import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

import { prisma } from "../db.js";
import { optionalAuth, type AuthVariables } from "../auth/middleware.js";
import { getHiddenUserIds } from "../lib/moderation.js";

/**
 * Feed endpoints.
 *
 * - /feed       — editorial masonry (Home). For v1 this is "latest public
 *                 posts with rich context". Personalisation is an explicit
 *                 roadmap item (PRD §19.2 ranking signals).
 * - /activity   — Following Activity (Search tab). For each post authored
 *                 by a user the viewer follows, expose actor + artifact
 *                 + delta in the shape the ActivityCard expects.
 */
export const feedRouter = new Hono<{ Variables: AuthVariables }>()
  .get(
    "/feed",
    optionalAuth,
    zValidator(
      "query",
      z.object({
        limit: z.coerce.number().int().min(1).max(40).default(20),
        cursor: z.string().optional(),
        // Optional filters so profile + object-detail screens can reuse the
        // feed payload shape + viewer annotations instead of bespoke
        // `/users/:h/posts` or `/objects/:id/posts` endpoints.
        author: z.string().min(3).max(24).optional(),
        object: z.string().optional(),
      }),
    ),
    async (c) => {
      const { limit, cursor, author, object } = c.req.valid("query");
      const viewer = c.var.user;

      const authorId = author
        ? (
            await prisma.user.findUnique({
              where: { handle: author.toLowerCase() },
              select: { id: true },
            })
          )?.id
        : undefined;

      // Unknown author → empty page rather than a full feed leak.
      if (author && !authorId) {
        return c.json({ posts: [], nextCursor: null });
      }

      const hidden = await getHiddenUserIds(viewer?.id);

      // Author-scoped fetch of a user who is on either side of a block
      // with the viewer resolves to an empty page (same shape as an
      // unknown author). The author never appears anywhere else in the
      // app for them.
      if (authorId && hidden.includes(authorId)) {
        return c.json({ posts: [], nextCursor: null });
      }

      const posts = await prisma.post.findMany({
        where: {
          // When `authorId` is scoped we already short-circuited any
          // hidden match above, so a `notIn` would be redundant *and*
          // would clobber the `authorId: "..."` key via object-spread
          // key collision. Apply the notIn only to unscoped queries.
          ...(authorId
            ? { authorId }
            : hidden.length > 0
              ? { authorId: { notIn: hidden } }
              : {}),
          ...(object ? { objectId: object } : {}),
        },
        orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        include: {
          author: {
            select: { id: true, handle: true, displayName: true, avatarUrl: true },
          },
          object: {
            select: {
              id: true,
              type: true,
              title: true,
              subtitle: true,
              city: true,
              heroImage: true,
            },
          },
          rankingList: {
            select: { id: true, title: true, category: true },
          },
          _count: { select: { likes: true, comments: true, saves: true } },
        },
      });

      const pageItems = posts.slice(0, limit);
      const nextCursor = posts.length > limit ? posts[limit]!.id : null;

      // Annotate viewer state in a single extra query.
      let likedSet = new Set<string>();
      let savedSet = new Set<string>();
      if (viewer && pageItems.length > 0) {
        const ids = pageItems.map((p) => p.id);
        const [likes, saves] = await Promise.all([
          prisma.like.findMany({
            where: { userId: viewer.id, postId: { in: ids } },
            select: { postId: true },
          }),
          prisma.save.findMany({
            where: { userId: viewer.id, postId: { in: ids } },
            select: { postId: true },
          }),
        ]);
        likedSet = new Set(likes.map((l) => l.postId));
        savedSet = new Set(saves.map((s) => s.postId));
      }

      return c.json({
        posts: pageItems.map((p) => ({
          ...p,
          stats: p._count,
          viewer: {
            likedByMe: likedSet.has(p.id),
            savedByMe: savedSet.has(p.id),
          },
        })),
        nextCursor,
      });
    },
  )
  .get(
    "/activity",
    optionalAuth,
    zValidator(
      "query",
      z.object({
        limit: z.coerce.number().int().min(1).max(40).default(20),
        cursor: z.string().optional(),
      }),
    ),
    async (c) => {
      const viewer = c.var.user;
      const { limit, cursor } = c.req.valid("query");

      // Non-authenticated viewers see a public trending slice, so the tab
      // still has content pre-login.
      const followedIds = viewer
        ? (
            await prisma.follow.findMany({
              where: { followerId: viewer.id },
              select: { followeeId: true },
            })
          ).map((f) => f.followeeId)
        : [];

      const hidden = await getHiddenUserIds(viewer?.id);

      // Narrow followed IDs by block set — a follow relationship is not
      // auto-broken on block (we might want nicer UX later) but activity
      // must respect the viewer's current block graph.
      const visibleFollowed =
        followedIds.length > 0
          ? followedIds.filter((id) => !hidden.includes(id))
          : [];

      const authorFilter =
        viewer && visibleFollowed.length > 0
          ? { authorId: { in: visibleFollowed } }
          : hidden.length > 0
            ? { authorId: { notIn: hidden } }
            : undefined;

      const posts = await prisma.post.findMany({
        where: authorFilter,
        orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        include: {
          author: {
            select: { id: true, handle: true, displayName: true, avatarUrl: true },
          },
          object: {
            select: {
              id: true,
              type: true,
              title: true,
              city: true,
              heroImage: true,
            },
          },
          rankingList: {
            select: { id: true, title: true, category: true },
          },
        },
      });

      return c.json({
        activity: posts.slice(0, limit).map((p) => ({
          id: p.id,
          actor: p.author,
          verb: p.rankingRank === 1 ? "moved" : "added",
          object: p.object,
          list: p.rankingList,
          rank: p.rankingRank,
          movement: p.rankingMovement,
          delta: p.rankingDelta,
          body: p.caption,
          headline: p.headline,
          publishedAt: p.publishedAt,
        })),
        nextCursor: posts.length > limit ? posts[limit]!.id : null,
      });
    },
  );
