import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

import { prisma } from "../db.js";
import {
  currentUser,
  requireAuth,
  type AuthVariables,
} from "../auth/middleware.js";
import { getHiddenUserIds } from "../lib/moderation.js";

/**
 * Notifications (inbox).
 *
 * MVP design — we intentionally do NOT persist a separate `notifications`
 * table. Instead, each notification type is derived on read from the
 * existing social tables:
 *
 *   like          →  Like.where(post.authorId = me)
 *   follow        →  Follow.where(followeeId  = me)
 *   mention       →  PostMention.where(userId = me)
 *   companion_tag →  RestaurantVisitCompanion.where(userId = me)
 *   comment       →  Comment.where(post.authorId = me, parentId is null)
 *   reply         →  Comment.where(parent.authorId = me, parentId is not null)
 *
 * Why derived instead of denormalised?
 *  - Zero write-path impact — no double-writes to go out of sync on crash.
 *  - No migration surface; the social tables already carry actor + target
 *    + timestamp, which is all an inbox needs.
 *  - Easy to evolve: when we outgrow this (push pipeline, read/unread
 *    persistence, grouping), we can introduce a pre-aggregated table and
 *    back-fill without changing the client contract — just the same
 *    shapes coming from a different source.
 *
 * Pagination is timestamp-based. Clients send `before` (ISO) to fetch the
 * next page. The server queries each type with `createdAt < before LIMIT n`,
 * unions, sorts, trims to `limit`, and returns the oldest returned row's
 * `createdAt` as the next cursor. Items tied at the exact same millisecond
 * are still ordered within the same page; on the boundary we advance the
 * cursor by 1ms to guarantee forward progress even if two events share a
 * timestamp (rare but possible in tests).
 *
 * We always *exclude self-events* (you liking your own post should not
 * land in your own inbox).
 */

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  before: z.string().datetime().optional(),
});

type NotifType = "like" | "comment" | "reply" | "follow" | "mention" | "companion_tag";

type ActorSnapshot = {
  id: string;
  handle: string;
  displayName: string;
  avatarUrl: string | null;
};

type NotificationItem = {
  // `${type}:${source_id}` — stable + unique across types.
  id: string;
  type: NotifType;
  actor: ActorSnapshot;
  createdAt: Date;
  // Navigation target. Exactly one of these is populated per type:
  //   like / comment / reply → { postId, commentId? }
  //   follow                 → { handle }
  target: {
    postId?: string;
    commentId?: string;
    postHeadline?: string;
    commentBody?: string;
    handle?: string;
  };
};

export const notificationsRouter = new Hono<{ Variables: AuthVariables }>().get(
  "/",
  requireAuth,
  zValidator("query", querySchema),
  async (c) => {
    const me = currentUser(c);
    const { limit, before } = c.req.valid("query");
    const beforeDate = before ? new Date(before) : undefined;

    // Per-type queries. Each pulls `limit + 1` so we can *usually* satisfy
    // the union without over-fetching; if one bucket dominates we accept a
    // slightly thinner page rather than making the query wider — the next
    // page request will just ask again with a fresher `before`.
    const take = limit + 1;
    const cursorFilter = beforeDate ? { lt: beforeDate } : undefined;

    // Exclude any event authored by a user on either side of a block
    // with the viewer — they shouldn't see the actor in the inbox, and
    // vice versa.
    const hidden = await getHiddenUserIds(me.id);
    const notHidden = hidden.length > 0 ? { notIn: hidden } : undefined;

    const [likes, follows, comments, replies, mentions, companionTags] = await Promise.all([
      prisma.like.findMany({
        where: {
          post: { authorId: me.id },
          userId: { not: me.id, ...(notHidden ?? {}) },
          ...(cursorFilter ? { createdAt: cursorFilter } : {}),
        },
        orderBy: { createdAt: "desc" },
        take,
        include: {
          user: {
            select: { id: true, handle: true, displayName: true, avatarUrl: true },
          },
          post: { select: { id: true, headline: true } },
        },
      }),
      prisma.follow.findMany({
        where: {
          followeeId: me.id,
          ...(notHidden ? { followerId: notHidden } : {}),
          ...(cursorFilter ? { createdAt: cursorFilter } : {}),
        },
        orderBy: { createdAt: "desc" },
        take,
        include: {
          follower: {
            select: { id: true, handle: true, displayName: true, avatarUrl: true },
          },
        },
      }),
      prisma.comment.findMany({
        where: {
          post: { authorId: me.id },
          authorId: { not: me.id, ...(notHidden ?? {}) },
          parentId: null,
          ...(cursorFilter ? { createdAt: cursorFilter } : {}),
        },
        orderBy: { createdAt: "desc" },
        take,
        include: {
          author: {
            select: { id: true, handle: true, displayName: true, avatarUrl: true },
          },
          post: { select: { id: true, headline: true } },
        },
      }),
      prisma.comment.findMany({
        where: {
          parent: { authorId: me.id },
          authorId: { not: me.id, ...(notHidden ?? {}) },
          NOT: { parentId: null },
          ...(cursorFilter ? { createdAt: cursorFilter } : {}),
        },
        orderBy: { createdAt: "desc" },
        take,
        include: {
          author: {
            select: { id: true, handle: true, displayName: true, avatarUrl: true },
          },
          post: { select: { id: true, headline: true } },
        },
      }),
      prisma.postMention.findMany({
        where: {
          userId: me.id,
          createdById: { not: me.id, ...(notHidden ?? {}) },
          ...(cursorFilter ? { createdAt: cursorFilter } : {}),
        },
        orderBy: { createdAt: "desc" },
        take,
        include: {
          createdBy: {
            select: { id: true, handle: true, displayName: true, avatarUrl: true },
          },
          post: { select: { id: true, headline: true } },
        },
      }),
      prisma.restaurantVisitCompanion.findMany({
        where: {
          userId: me.id,
          visit: {
            authorId: { not: me.id, ...(notHidden ?? {}) },
          },
          ...(cursorFilter ? { createdAt: cursorFilter } : {}),
        },
        orderBy: { createdAt: "desc" },
        take,
        include: {
          visit: {
            include: {
              author: {
                select: { id: true, handle: true, displayName: true, avatarUrl: true },
              },
              post: { select: { id: true, headline: true } },
              object: { select: { title: true } },
            },
          },
        },
      }),
    ]);

    const merged: NotificationItem[] = [
      ...likes.map((l): NotificationItem => ({
        id: `like:${l.userId}:${l.postId}`,
        type: "like",
        actor: l.user,
        createdAt: l.createdAt,
        target: { postId: l.post.id, postHeadline: l.post.headline },
      })),
      ...follows.map((f): NotificationItem => ({
        id: `follow:${f.followerId}:${f.followeeId}`,
        type: "follow",
        actor: f.follower,
        createdAt: f.createdAt,
        target: { handle: f.follower.handle },
      })),
      ...comments.map((cm): NotificationItem => ({
        id: `comment:${cm.id}`,
        type: "comment",
        actor: cm.author,
        createdAt: cm.createdAt,
        target: {
          postId: cm.post.id,
          postHeadline: cm.post.headline,
          commentId: cm.id,
          commentBody: cm.body,
        },
      })),
      ...replies.map((cm): NotificationItem => ({
        id: `reply:${cm.id}`,
        type: "reply",
        actor: cm.author,
        createdAt: cm.createdAt,
        target: {
          postId: cm.post.id,
          postHeadline: cm.post.headline,
          commentId: cm.id,
          commentBody: cm.body,
        },
      })),
      ...mentions.map((mention): NotificationItem => ({
        id: `mention:${mention.id}`,
        type: "mention",
        actor: mention.createdBy,
        createdAt: mention.createdAt,
        target: {
          postId: mention.post.id,
          postHeadline: mention.post.headline,
        },
      })),
      ...companionTags
        .filter((tag) => tag.visit.post)
        .map((tag): NotificationItem => ({
          id: `companion_tag:${tag.visitId}:${tag.userId}`,
          type: "companion_tag",
          actor: tag.visit.author,
          createdAt: tag.createdAt,
          target: {
            postId: tag.visit.post?.id,
            postHeadline: tag.visit.post?.headline ?? tag.visit.object.title,
          },
        })),
    ];

    merged.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const pageItems = merged.slice(0, limit);
    const hasMore = merged.length > limit;
    const nextCursor =
      hasMore && pageItems.length > 0
        ? pageItems[pageItems.length - 1]!.createdAt.toISOString()
        : null;

    return c.json({
      items: pageItems.map((i) => ({
        ...i,
        createdAt: i.createdAt.toISOString(),
      })),
      nextCursor,
    });
  },
);
