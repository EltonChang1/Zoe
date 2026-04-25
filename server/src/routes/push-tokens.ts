import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

import {
  currentUser,
  requireAuth,
  type AuthVariables,
} from "../auth/middleware.js";
import { prisma } from "../db.js";
import { HttpError } from "../http/errors.js";
import { isExpoPushToken } from "../lib/push.js";

const registerSchema = z.object({
  token: z.string().min(1),
  platform: z.enum(["ios", "android", "web"]).optional(),
  appVersion: z.string().max(32).optional(),
});

const unregisterSchema = z.object({
  token: z.string().min(1),
});

export const pushTokensRouter = new Hono<{ Variables: AuthVariables }>()
  .post("/", requireAuth, zValidator("json", registerSchema), async (c) => {
    const me = currentUser(c);
    const body = c.req.valid("json");
    const token = body.token.trim();
    if (!isExpoPushToken(token)) {
      throw HttpError.unprocessable("Invalid Expo push token");
    }

    const row = await prisma.pushToken.upsert({
      where: { token },
      create: {
        token,
        userId: me.id,
        platform: body.platform,
        appVersion: body.appVersion,
      },
      update: {
        userId: me.id,
        platform: body.platform,
        appVersion: body.appVersion,
        lastSeenAt: new Date(),
        disabledAt: null,
      },
      select: { id: true },
    });
    return c.json({ token: { id: row.id } }, 201);
  })
  .delete(
    "/",
    requireAuth,
    zValidator("json", unregisterSchema),
    async (c) => {
      const me = currentUser(c);
      const body = c.req.valid("json");
      const token = body.token.trim();
      await prisma.pushToken.deleteMany({
        where: { userId: me.id, token },
      });
      return c.json({ ok: true });
    },
  );
