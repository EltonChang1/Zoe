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
import { isBlockedEitherWay } from "../lib/moderation.js";
import { sendPushToUser } from "../lib/push.js";

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

      // Either direction of a block renders the profile invisible to the
      // viewer — 404, not 403, so we don't confirm the account exists.
      if (await isBlockedEitherWay(viewer?.id, user.id)) {
        throw HttpError.notFound("User not found");
      }

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
            // NOTE: the Prisma relations on User are inverted w.r.t. their
            // labels — `User.followers` actually collects `Follow` rows where
            // this user is the *follower*, so `_count.followers` is the
            // number of accounts this user is following, and vice versa.
            // We swap here so the API contract matches the field semantics.
            followers: user._count.following,
            following: user._count.followers,
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
      if (await isBlockedEitherWay(me.id, target.id)) {
        throw HttpError.notFound("User not found");
      }

      await prisma.follow.upsert({
        where: {
          followerId_followeeId: { followerId: me.id, followeeId: target.id },
        },
        create: { followerId: me.id, followeeId: target.id },
        update: {},
      });
      void sendPushToUser({
        toUserId: target.id,
        title: `@${me.handle} followed you`,
        body: `${me.displayName} is now following you.`,
        data: { type: "follow", handle: me.handle },
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
  )

  // ---------------- Blocking ----------------
  //
  // `POST /users/:handle/block`   — block the user
  // `DELETE /users/:handle/block` — unblock
  //
  // Blocking is bidirectional in effect (both sides stop seeing each
  // other everywhere in the app), but the DB row is owned by the
  // blocker. Blocking also auto-severs any follow relationship in either
  // direction so stale follow-graph rows don't leak through activity,
  // suggestion lists, etc. once the block lifts.
  .post(
    "/:handle/block",
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
        throw HttpError.badRequest("You cannot block yourself");
      }

      await prisma.$transaction([
        prisma.block.upsert({
          where: {
            blockerId_blockedId: {
              blockerId: me.id,
              blockedId: target.id,
            },
          },
          create: { blockerId: me.id, blockedId: target.id },
          update: {},
        }),
        // Drop any follow edges between the two users so the block is
        // immediately reflected in followers / following counts and in
        // activity feeds.
        prisma.follow.deleteMany({
          where: {
            OR: [
              { followerId: me.id, followeeId: target.id },
              { followerId: target.id, followeeId: me.id },
            ],
          },
        }),
      ]);
      return c.json({ ok: true });
    },
  )
  .delete(
    "/:handle/block",
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
      await prisma.block
        .delete({
          where: {
            blockerId_blockedId: {
              blockerId: me.id,
              blockedId: target.id,
            },
          },
        })
        .catch(() => undefined);
      return c.json({ ok: true });
    },
  );

/**
 * "My blocks" — separate router so the route `GET /users/me/blocks`
 * never collides with `GET /users/:handle`. Mounted at the same `/users`
 * prefix; listed first in `index.ts` so Hono matches `/me/...` before
 * `/:handle`.
 */
export const myBlocksRouter = new Hono<{ Variables: AuthVariables }>().get(
  "/me/blocks",
  requireAuth,
  async (c) => {
    const me = currentUser(c);
    const rows = await prisma.block.findMany({
      where: { blockerId: me.id },
      orderBy: { createdAt: "desc" },
      include: {
        blocked: {
          select: {
            id: true,
            handle: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });
    return c.json({
      blocks: rows.map((r) => ({
        user: r.blocked,
        createdAt: r.createdAt,
      })),
    });
  },
);
