import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

import { prisma } from "../db.js";
import { optionalAuth, type AuthVariables } from "../auth/middleware.js";
import { getHiddenUserIds } from "../lib/moderation.js";
import {
  categoryToObjectTypes,
  explainPost,
  normalizeSearchQuery,
} from "../lib/personalization.js";

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
        scope: z.enum(["for_you", "home_city", "anywhere"]).default("for_you"),
        cityId: z.string().optional(),
        category: z.string().max(40).optional(),
        savedOnly: z.coerce.boolean().default(false),
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
      const { scope, cityId, category, savedOnly } = c.req.valid("query");

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
      const effectiveCityId =
        cityId ??
        (scope === "anywhere"
          ? undefined
          : viewer?.preferredCityId ?? viewer?.homeCityId ?? undefined);
      const objectTypes = categoryToObjectTypes(category);

      const [followedRows, recentRows, savedRows] = viewer
        ? await Promise.all([
            prisma.follow.findMany({
              where: { followerId: viewer.id },
              select: { followeeId: true },
            }),
            prisma.recentSearch.findMany({
              where: { userId: viewer.id },
              orderBy: { updatedAt: "desc" },
              take: 8,
              select: { normalizedQuery: true, inferredCategory: true },
            }),
            prisma.save.findMany({
              where: { userId: viewer.id, post: { objectId: { not: null } } },
              orderBy: { createdAt: "desc" },
              take: 80,
              select: { post: { select: { objectId: true } } },
            }),
          ])
        : [[], [], []];
      const followedAuthorIds = new Set(followedRows.map((f) => f.followeeId));
      const savedObjectIds = new Set(
        savedRows
          .map((row) => row.post.objectId)
          .filter((id): id is string => Boolean(id)),
      );
      const recentTerms = recentRows
        .flatMap((row) => [
          normalizeSearchQuery(row.normalizedQuery),
          row.inferredCategory ?? "",
        ])
        .filter(Boolean)
        .slice(0, 10);

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
          ...(savedOnly
            ? { objectId: { in: [...savedObjectIds] } }
            : {}),
          ...(effectiveCityId || objectTypes.length > 0
            ? {
                object: {
                  ...(effectiveCityId ? { cityId: effectiveCityId } : {}),
                  ...(objectTypes.length > 0
                    ? { type: { in: objectTypes } }
                    : {}),
                },
              }
            : {}),
        },
        orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
        take: author || object ? limit + 1 : Math.min(limit * 4 + 1, 100),
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
              cityId: true,
              neighborhood: true,
              tags: true,
              heroImage: true,
              metadata: true,
            },
          },
          rankingList: {
            select: { id: true, title: true, category: true },
          },
          mentions: {
            include: {
              user: {
                select: {
                  id: true,
                  handle: true,
                  displayName: true,
                  avatarUrl: true,
                },
              },
            },
          },
          restaurantVisit: {
            include: {
              companions: {
                include: {
                  user: {
                    select: {
                      id: true,
                      handle: true,
                      displayName: true,
                      avatarUrl: true,
                    },
                  },
                },
              },
              dishes: { orderBy: { createdAt: "asc" } },
            },
          },
          _count: { select: { likes: true, comments: true, saves: true } },
        },
      });

      const rankedPosts =
        author || object
          ? posts
          : posts
              .map((post) => ({
                post,
                score: scoreFeedPost(post, {
                  cityId: effectiveCityId,
                  followedAuthorIds,
                  savedObjectIds,
                  recentTerms,
                  category,
                  interestTopics: viewer?.interestTopics ?? [],
                }),
              }))
              .sort((a, b) => b.score - a.score)
              .map((row) => row.post);

      const pageItems = rankedPosts.slice(0, limit);
      const nextCursor = posts.length > limit ? posts[Math.min(limit, posts.length - 1)]!.id : null;

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
          mentions: p.mentions.filter((mention) => !hidden.includes(mention.userId)),
          restaurantVisit: p.restaurantVisit
            ? {
                ...p.restaurantVisit,
                companions: p.restaurantVisit.companions.filter(
                  (companion) => !hidden.includes(companion.userId),
                ),
              }
            : null,
          stats: p._count,
          why: explainPost(p, {
            cityId: effectiveCityId,
            followedAuthorIds,
            savedObjectIds,
            recentTerms,
            interestTopics: viewer?.interestTopics ?? [],
          }),
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
              metadata: true,
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
          imageUrl: p.imageUrl,
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

type FeedPost = {
  id: string;
  authorId: string;
  objectId: string | null;
  headline: string;
  caption: string;
  tags: string[];
  featured: boolean;
  publishedAt: Date;
  rankingRank: number | null;
  object: {
    id: string;
    type: string;
    title: string;
    subtitle: string | null;
    city: string | null;
    cityId: string | null;
    neighborhood: string | null;
    tags: string[];
    heroImage: string | null;
    metadata: unknown;
  } | null;
  rankingList: { id: string; title: string; category: string } | null;
  _count: { likes: number; comments: number; saves: number };
};

function scoreFeedPost(
  post: FeedPost,
  context: {
    cityId?: string | null;
    followedAuthorIds: Set<string>;
    savedObjectIds: Set<string>;
    recentTerms: string[];
    category?: string;
    interestTopics: string[];
  },
) {
  const ageHours = Math.max(1, (Date.now() - post.publishedAt.getTime()) / 3_600_000);
  let score = 40 / Math.sqrt(ageHours);
  score += post._count.saves * 2 + post._count.comments * 1.5 + post._count.likes * 0.5;
  if (post.featured) score += 8;
  if (context.followedAuthorIds.has(post.authorId)) score += 20;
  if (post.object?.cityId && post.object.cityId === context.cityId) score += 16;
  if (post.objectId && context.savedObjectIds.has(post.objectId)) score += 18;
  if (post.rankingRank) score += Math.max(2, 12 - post.rankingRank);

  const haystack = [
    post.headline,
    post.caption,
    post.object?.title,
    post.object?.city,
    post.object?.type,
    ...(post.tags ?? []),
    ...(post.object?.tags ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (context.category && haystack.includes(context.category.toLowerCase())) {
    score += 10;
  }
  for (const term of context.recentTerms) {
    if (term.length >= 2 && haystack.includes(term)) score += 8;
  }
  for (const topic of context.interestTopics) {
    const normalized = topic.toLowerCase();
    if (normalized && haystack.includes(normalized)) score += 7;
  }
  return score;
}
