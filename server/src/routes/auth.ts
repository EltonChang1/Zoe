import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
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
    const user = await prisma.user.create({
      data: {
        email: input.email,
        handle: input.handle,
        displayName: input.displayName,
        bio: input.bio,
        avatarUrl: input.avatarUrl,
        passwordHash,
      },
    });

    const { token, expiresAt } = await issueSession(user.id, {
      userAgent: c.req.header("user-agent") ?? null,
      ipAddress: c.req.header("x-forwarded-for") ?? null,
    });

    return c.json({ user: toPublicUser(user), session: { token, expiresAt } }, 201);
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
  .get("/me", requireAuth, async (c) => {
    const me = currentUser(c);
    const [followers, following, posts] = await Promise.all([
      prisma.follow.count({ where: { followeeId: me.id } }),
      prisma.follow.count({ where: { followerId: me.id } }),
      prisma.post.count({ where: { authorId: me.id } }),
    ]);
    return c.json({
      user: { ...toPublicUser(me), followers, following, posts },
    });
  });

function toPublicUser<T extends { passwordHash: string }>(u: T) {
  const { passwordHash, ...rest } = u;
  return rest;
}
