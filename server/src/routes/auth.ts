import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import type { User } from "@prisma/client";
import { z } from "zod";

import { prisma } from "../db.js";
import { HttpError } from "../http/errors.js";
import { hashPassword, verifyPassword } from "../auth/password.js";
import {
  currentUser,
  requireAuth,
  type AuthVariables,
} from "../auth/middleware.js";
import { issueSession, revokeSession } from "../auth/session.js";
import { storage } from "../storage/index.js";
import { generateRawAccountToken, hashAccountToken } from "../lib/accountTokens.js";
import { sendTransactionalMail } from "../lib/mail.js";
import { env } from "../env.js";

const HANDLE = /^[a-z0-9_\.]{3,24}$/;

const registerSchema = z.object({
  email: z.string().email().max(254).toLowerCase(),
  password: z.string().min(8).max(128),
  handle: z
    .string()
    .min(3)
    .max(24)
    .toLowerCase()
    .regex(HANDLE, "handle must be 3–24 chars of [a-z0-9_.]"),
  displayName: z.string().min(1).max(60),
  bio: z.string().max(280).optional(),
  avatarUrl: z.string().url().optional(),
});

const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1),
});

const tokenSchema = z.object({
  token: z.string().min(1).max(512),
});

const forgotSchema = z.object({
  email: z.string().email().toLowerCase(),
});

const resetSchema = z.object({
  token: z.string().min(1).max(512),
  password: z.string().min(8).max(128),
});

const VERIFY_TTL_MS = 48 * 60 * 60 * 1000;
const RESET_TTL_MS = 60 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;

function accountDeepLink(pathAndQuery: string): string {
  const base = env.APP_DEEPLINK_ORIGIN.replace(/\/+$/, "");
  if (base.endsWith("://")) return `${base}${pathAndQuery}`;
  return `${base}/${pathAndQuery}`;
}

function sendVerificationEmail(to: string, rawToken: string): void {
  const link = accountDeepLink(`verify-email?token=${encodeURIComponent(rawToken)}`);
  const text =
    `Verify your email for Zoe.\n\nOpen this link in the app:\n${link}\n\n` +
    `If you did not create an account, you can ignore this message.`;
  void sendTransactionalMail({
    to,
    subject: "Verify your Zoe email",
    text,
    html: `<p>Verify your email for Zoe.</p><p><a href="${link}">Verify email</a></p>`,
  }).catch(() => undefined);
}

function sendPasswordResetEmail(to: string, rawToken: string): void {
  const link = accountDeepLink(`reset-password?token=${encodeURIComponent(rawToken)}`);
  const text =
    `Reset your Zoe password.\n\nOpen this link in the app:\n${link}\n\n` +
    `This link expires in one hour. If you did not request a reset, ignore this email.`;
  void sendTransactionalMail({
    to,
    subject: "Reset your Zoe password",
    text,
    html: `<p>Reset your Zoe password.</p><p><a href="${link}">Choose a new password</a></p>`,
  }).catch(() => undefined);
}

export const authRouter = new Hono<{ Variables: AuthVariables }>()
  .post("/register", zValidator("json", registerSchema), async (c) => {
    const input = c.req.valid("json");

    const clash = await prisma.user.findFirst({
      where: { OR: [{ email: input.email }, { handle: input.handle }] },
      select: { email: true, handle: true },
    });
    if (clash) {
      throw HttpError.conflict(
        clash.email === input.email
          ? "That email is already registered"
          : "That handle is taken",
      );
    }

    const passwordHash = await hashPassword(input.password);
    const rawVerify = generateRawAccountToken();
    const verifyHash = hashAccountToken(rawVerify);
    const verifyExpires = new Date(Date.now() + VERIFY_TTL_MS);

    const user = await prisma.user.create({
      data: {
        email: input.email,
        handle: input.handle,
        displayName: input.displayName,
        bio: input.bio,
        avatarUrl: input.avatarUrl,
        passwordHash,
        emailVerifiedAt: null,
        emailVerificationTokenHash: verifyHash,
        emailVerificationExpiresAt: verifyExpires,
      },
    });

    sendVerificationEmail(user.email, rawVerify);

    const { token, expiresAt } = await issueSession(user.id, {
      userAgent: c.req.header("user-agent") ?? null,
      ipAddress: c.req.header("x-forwarded-for") ?? null,
    });

    return c.json(
      { user: toPublicUser(user), session: { token, expiresAt } },
      201,
    );
  })
  .post("/login", zValidator("json", loginSchema), async (c) => {
    const { email, password } = c.req.valid("json");
    const user = await prisma.user.findUnique({ where: { email } });
    const ok = user && (await verifyPassword(user.passwordHash, password));
    if (!user || !ok) {
      throw HttpError.unauthorized("Invalid email or password");
    }

    const { token, expiresAt } = await issueSession(user.id, {
      userAgent: c.req.header("user-agent") ?? null,
      ipAddress: c.req.header("x-forwarded-for") ?? null,
    });

    return c.json({ user: toPublicUser(user), session: { token, expiresAt } });
  })
  .post("/logout", async (c) => {
    const header = c.req.header("authorization");
    const token = header?.toLowerCase().startsWith("bearer ")
      ? header.slice(7).trim()
      : null;
    if (token) await revokeSession(token);
    return c.json({ ok: true });
  })
  .post("/verify-email", zValidator("json", tokenSchema), async (c) => {
    const { token: raw } = c.req.valid("json");
    const hash = hashAccountToken(raw.trim());
    const user = await prisma.user.findFirst({
      where: { emailVerificationTokenHash: hash },
    });
    if (
      !user ||
      !user.emailVerificationExpiresAt ||
      user.emailVerificationExpiresAt < new Date()
    ) {
      throw HttpError.badRequest("Invalid or expired verification link");
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerifiedAt: new Date(),
        emailVerificationTokenHash: null,
        emailVerificationExpiresAt: null,
      },
    });

    return c.json({ ok: true, user: toPublicUser(updated) });
  })
  .post("/resend-verification", requireAuth, async (c) => {
    const me = currentUser(c);
    if (me.emailVerifiedAt) {
      return c.json({ ok: true, alreadyVerified: true });
    }

    const last = me.lastVerificationEmailSentAt;
    if (last && Date.now() - last.getTime() < RESEND_COOLDOWN_MS) {
      throw HttpError.tooManyRequests(
        "Please wait a minute before requesting another email",
      );
    }

    const rawVerify = generateRawAccountToken();
    const verifyHash = hashAccountToken(rawVerify);
    const verifyExpires = new Date(Date.now() + VERIFY_TTL_MS);

    const updated = await prisma.user.update({
      where: { id: me.id },
      data: {
        emailVerificationTokenHash: verifyHash,
        emailVerificationExpiresAt: verifyExpires,
        lastVerificationEmailSentAt: new Date(),
      },
    });

    sendVerificationEmail(updated.email, rawVerify);
    return c.json({ ok: true });
  })
  .post("/forgot-password", zValidator("json", forgotSchema), async (c) => {
    const { email } = c.req.valid("json");
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      const raw = generateRawAccountToken();
      const tokenHash = hashAccountToken(raw);
      const expires = new Date(Date.now() + RESET_TTL_MS);
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetTokenHash: tokenHash,
          passwordResetExpiresAt: expires,
        },
      });
      sendPasswordResetEmail(user.email, raw);
    }
    return c.json({ ok: true });
  })
  .post("/reset-password", zValidator("json", resetSchema), async (c) => {
    const { token: raw, password } = c.req.valid("json");
    const hash = hashAccountToken(raw.trim());
    const user = await prisma.user.findFirst({
      where: { passwordResetTokenHash: hash },
    });
    if (
      !user ||
      !user.passwordResetExpiresAt ||
      user.passwordResetExpiresAt < new Date()
    ) {
      throw HttpError.badRequest("Invalid or expired reset link");
    }

    const passwordHash = await hashPassword(password);
    await prisma.$transaction([
      prisma.session.deleteMany({ where: { userId: user.id } }),
      prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          passwordResetTokenHash: null,
          passwordResetExpiresAt: null,
        },
      }),
    ]);

    return c.json({ ok: true });
  })
  .get("/me", requireAuth, async (c) => {
    const me = currentUser(c);
    const [followers, following, posts] = await Promise.all([
      prisma.follow.count({ where: { followeeId: me.id } }),
      prisma.follow.count({ where: { followerId: me.id } }),
      prisma.post.count({ where: { authorId: me.id } }),
    ]);
    return c.json({
      user: {
        ...toPublicUser(me),
        followers,
        following,
        posts,
      },
    });
  })
  .delete("/me", requireAuth, async (c) => {
    const me = currentUser(c);
    await prisma.user.delete({ where: { id: me.id } });
    await storage.deleteUserPrefix(me.id).catch(() => undefined);
    return c.json({ ok: true });
  });

function toPublicUser(u: User) {
  const {
    passwordHash: _pw,
    emailVerificationTokenHash: _evh,
    emailVerificationExpiresAt: _eve,
    passwordResetTokenHash: _prh,
    passwordResetExpiresAt: _pre,
    lastVerificationEmailSentAt: _lv,
    emailVerifiedAt,
    ...rest
  } = u;
  return {
    ...rest,
    emailVerified: Boolean(emailVerifiedAt),
  };
}
