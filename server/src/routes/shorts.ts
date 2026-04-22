import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

import { prisma } from "../db.js";
import { idParam } from "../http/validate.js";
import {
  currentUser,
  requireAuth,
  type AuthVariables,
} from "../auth/middleware.js";

const createSchema = z.object({
  objectId: idParam,
  hookLine: z.string().min(1).max(160),
  caption: z.string().min(1).max(500),
  audioLabel: z.string().max(120).optional(),
  heroImage: z.string().url(),
  videoUrl: z.string().url().optional(),
  rankingListTitle: z.string().max(80).optional(),
  rankingRank: z.number().int().positive().optional(),
});

export const shortsRouter = new Hono<{ Variables: AuthVariables }>()
  .get(
    "/",
    zValidator(
      "query",
      z.object({
        limit: z.coerce.number().int().min(1).max(40).default(20),
        cursor: z.string().optional(),
      }),
    ),
    async (c) => {
      const { limit, cursor } = c.req.valid("query");
      const shorts = await prisma.short.findMany({
        orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        include: {
          author: {
            select: { id: true, handle: true, displayName: true, avatarUrl: true },
          },
          object: {
            select: { id: true, title: true, type: true, heroImage: true },
          },
        },
      });
      return c.json({
        shorts: shorts.slice(0, limit),
        nextCursor: shorts.length > limit ? shorts[limit]!.id : null,
      });
    },
  )
  .post(
    "/",
    requireAuth,
    zValidator("json", createSchema),
    async (c) => {
      const me = currentUser(c);
      const input = c.req.valid("json");
      const short = await prisma.short.create({
        data: { ...input, authorId: me.id },
      });
      return c.json({ short }, 201);
    },
  );
