import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

import { prisma } from "../db.js";
import { HttpError } from "../http/errors.js";
import {
  currentUser,
  optionalAuth,
  requireAuth,
  type AuthVariables,
} from "../auth/middleware.js";

export const usersRouter = new Hono<{ Variables: AuthVariables }>()
  .get(
    "/:handle",
    optionalAuth,
    zValidator("param", z.object({ handle: z.string().min(3).max(24) })),
    async (c) => {
      const { handle } = c.req.valid("param");
      const viewer = c.var.user;

      const user = await prisma.user.findUnique({
        where: { handle: handle.toLowerCase() },
        select: {
          id: true,
          handle: true,
          displayName: true,
          avatarUrl: true,
          bio: true,
          createdAt: true,
          _count: {
            select: {
              posts: true,
              followers: true,
              following: true,
              lists: true,
            },
          },
        },
      });
      if (!user) throw HttpError.notFound("User not found");

      const followsMe = viewer
        ? Boolean(
            await prisma.follow.findUnique({
              where: {
                followerId_followeeId: {
                  followerId: user.id,
                  followeeId: viewer.id,
                },
              },
            }),
          )
        : false;

      const followedByMe = viewer
        ? Boolean(
            await prisma.follow.findUnique({
              where: {
                followerId_followeeId: {
                  followerId: viewer.id,
                  followeeId: user.id,
                },
              },
            }),
          )
        : false;

      return c.json({
        user: {
          id: user.id,
          handle: user.handle,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          bio: user.bio,
          createdAt: user.createdAt,
          stats: {
            posts: user._count.posts,
            followers: user._count.followers,
            following: user._count.following,
            lists: user._count.lists,
          },
          viewer: { followsMe, followedByMe, isSelf: viewer?.id === user.id },
        },
      });
    },
  )
  .post(
    "/:handle/follow",
    requireAuth,
    zValidator("param", z.object({ handle: z.string().min(3).max(24) })),
    async (c) => {
      const { handle } = c.req.valid("param");
      const me = currentUser(c);
      const target = await prisma.user.findUnique({
        where: { handle: handle.toLowerCase() },
        select: { id: true },
      });
      if (!target) throw HttpError.notFound("User not found");
      if (target.id === me.id) {
        throw HttpError.badRequest("You cannot follow yourself");
      }

      await prisma.follow.upsert({
        where: {
          followerId_followeeId: { followerId: me.id, followeeId: target.id },
        },
        create: { followerId: me.id, followeeId: target.id },
        update: {},
      });
      return c.json({ ok: true });
    },
  )
  .delete(
    "/:handle/follow",
    requireAuth,
    zValidator("param", z.object({ handle: z.string().min(3).max(24) })),
    async (c) => {
      const { handle } = c.req.valid("param");
      const me = currentUser(c);
      const target = await prisma.user.findUnique({
        where: { handle: handle.toLowerCase() },
        select: { id: true },
      });
      if (!target) throw HttpError.notFound("User not found");
      await prisma.follow
        .delete({
          where: {
            followerId_followeeId: {
              followerId: me.id,
              followeeId: target.id,
            },
          },
        })
        .catch(() => undefined);
      return c.json({ ok: true });
    },
  );
