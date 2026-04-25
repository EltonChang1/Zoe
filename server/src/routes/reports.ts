import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

import { prisma } from "../db.js";
import { HttpError } from "../http/errors.js";
import { idParam } from "../http/validate.js";
import {
  currentUser,
  requireAuth,
  type AuthVariables,
} from "../auth/middleware.js";

/**
 * Reports router.
 *
 * Reporting is write-only for end users. We accept the payload, store
 * the row with `status=open`, and let an out-of-band ops review
 * process triage it. Apple Guideline 1.2 requires the in-app entry
 * point; triage tooling is not a review-blocker.
 *
 * Abuse controls:
 *   - Auth is required. Anonymous reporting is a DDoS vector and doesn't
 *     satisfy the policy (reviewer must be identifiable).
 *   - Per-viewer rate cap: 30 reports / 24h. Applied in-process via a
 *     cheap Prisma count — cheap because `reporterId` is indexed.
 *   - Duplicate guard: the same reporter cannot stack open reports
 *     against the same subject.
 *
 * The API intentionally does not 404 when the subject doesn't exist —
 * we log the report anyway so ops can see spam / bad client data. Only
 * the duplicate guard and rate cap can reject.
 */

const SubjectType = z.enum([
  "user",
  "post",
  "short",
  "comment",
  "short_comment",
]);

const Reason = z.enum([
  "spam",
  "harassment",
  "hate",
  "sexual",
  "violence",
  "self_harm",
  "misinformation",
  "ip_violation",
  "other",
]);

const reportSchema = z.object({
  subjectType: SubjectType,
  subjectId: idParam,
  reason: Reason,
  details: z.string().max(1000).optional(),
});

const REPORTS_PER_DAY = 30;

export const reportsRouter = new Hono<{ Variables: AuthVariables }>().post(
  "/",
  requireAuth,
  zValidator("json", reportSchema),
  async (c) => {
    const me = currentUser(c);
    const input = c.req.valid("json");

    // Reporting yourself is almost always a UI bug — treat as a 400 so
    // the client can surface the correct error.
    if (input.subjectType === "user" && input.subjectId === me.id) {
      throw HttpError.badRequest("You cannot report yourself");
    }

    // Rate cap.
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recent = await prisma.report.count({
      where: { reporterId: me.id, createdAt: { gt: since } },
    });
    if (recent >= REPORTS_PER_DAY) {
      throw HttpError.tooManyRequests(
        "You have reported too many items today. Try again tomorrow.",
      );
    }

    // Duplicate guard — idempotent by (reporter, subject). If an open
    // report already exists, surface a 200 so the client UI can show a
    // "reported" state without confusion.
    const existing = await prisma.report.findFirst({
      where: {
        reporterId: me.id,
        subjectType: input.subjectType,
        subjectId: input.subjectId,
        status: "open",
      },
      select: { id: true },
    });
    if (existing) {
      return c.json({ report: { id: existing.id, deduped: true } });
    }

    const report = await prisma.report.create({
      data: {
        reporterId: me.id,
        subjectType: input.subjectType,
        subjectId: input.subjectId,
        reason: input.reason,
        details: input.details,
      },
      select: { id: true, createdAt: true },
    });
    return c.json({ report }, 201);
  },
);
