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
    "/:handle/taste-profile",
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
        },
      });
      if (!user) throw HttpError.notFound("User not found");
      if (await isBlockedEitherWay(viewer?.id, user.id)) {
        throw HttpError.notFound("User not found");
      }

      const [targetVisits, viewerVisits] = await Promise.all([
        prisma.restaurantVisit.findMany({
          where: { authorId: user.id },
          take: 250,
          orderBy: { createdAt: "desc" },
          include: {
            object: true,
            dishes: true,
          },
        }),
        viewer && viewer.id !== user.id
          ? prisma.restaurantVisit.findMany({
              where: { authorId: viewer.id },
              take: 250,
              orderBy: { createdAt: "desc" },
              include: {
                object: true,
                dishes: true,
              },
            })
          : Promise.resolve([]),
      ]);

      const targetTaste = buildTasteProfile(targetVisits);
      const viewerTaste = buildTasteProfile(viewerVisits);
      return c.json({
        profile: {
          user,
          stats: {
            visits: targetVisits.length,
            restaurants: new Set(targetVisits.map((visit) => visit.objectId)).size,
            dishes: targetVisits.reduce((sum, visit) => sum + visit.dishes.length, 0),
          },
          topCities: topCounts(targetTaste.cities),
          topLabels: topCounts(targetTaste.labels),
          topDishes: topCounts(targetTaste.dishes),
          topPlaceTypes: topCounts(targetTaste.placeTypes),
          matchScore:
            viewer && viewer.id !== user.id
              ? tasteMatchScore(targetTaste, viewerTaste)
              : null,
        },
      });
    },
  )
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

type VisitForTaste = {
  labels: string[];
  object: {
    city: string | null;
    primaryType: string | null;
    externalTypes: string[];
  };
  dishes: Array<{ name: string; recommended: boolean }>;
};

type TasteBuckets = {
  cities: Map<string, number>;
  labels: Map<string, number>;
  dishes: Map<string, number>;
  placeTypes: Map<string, number>;
};

function buildTasteProfile(visits: VisitForTaste[]): TasteBuckets {
  const buckets: TasteBuckets = {
    cities: new Map(),
    labels: new Map(),
    dishes: new Map(),
    placeTypes: new Map(),
  };
  for (const visit of visits) {
    increment(buckets.cities, visit.object.city);
    for (const label of visit.labels) increment(buckets.labels, label);
    for (const type of [visit.object.primaryType, ...visit.object.externalTypes]) {
      increment(buckets.placeTypes, type);
    }
    for (const dish of visit.dishes) {
      increment(buckets.dishes, dish.name, dish.recommended ? 2 : 1);
    }
  }
  return buckets;
}

function topCounts(bucket: Map<string, number>, limit = 8) {
  return [...bucket.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([label, count]) => ({ label, count }));
}

function tasteMatchScore(a: TasteBuckets, b: TasteBuckets) {
  const scores = [
    overlapScore(a.cities, b.cities),
    overlapScore(a.labels, b.labels),
    overlapScore(a.dishes, b.dishes),
    overlapScore(a.placeTypes, b.placeTypes),
  ].filter((score) => score !== null) as number[];
  if (scores.length === 0) return null;
  return Math.round((scores.reduce((sum, score) => sum + score, 0) / scores.length) * 100);
}

function overlapScore(a: Map<string, number>, b: Map<string, number>) {
  if (a.size === 0 || b.size === 0) return null;
  const union = new Set([...a.keys(), ...b.keys()]);
  let shared = 0;
  for (const key of union) {
    shared += Math.min(a.get(key) ?? 0, b.get(key) ?? 0);
  }
  const total = [...union].reduce(
    (sum, key) => sum + Math.max(a.get(key) ?? 0, b.get(key) ?? 0),
    0,
  );
  return total > 0 ? shared / total : null;
}

function increment(bucket: Map<string, number>, raw: string | null | undefined, by = 1) {
  const value = raw?.trim();
  if (!value) return;
  bucket.set(value, (bucket.get(value) ?? 0) + by);
}

/**
 * "My blocks" — separate router so the route `GET /users/me/blocks`
 * never collides with `GET /users/:handle`. Mounted at the same `/users`
 * prefix; listed first in `index.ts` so Hono matches `/me/...` before
 * `/:handle`.
 */
export const myBlocksRouter = new Hono<{ Variables: AuthVariables }>()
  .get("/me/blocks", requireAuth, async (c) => {
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
  })
  .get(
    "/me/saves",
    requireAuth,
    zValidator(
      "query",
      z.object({
        cityId: z.string().optional(),
        limit: z.coerce.number().int().min(1).max(40).default(20),
      }),
    ),
    async (c) => {
      const me = currentUser(c);
      const { cityId, limit } = c.req.valid("query");
      const effectiveCityId = cityId ?? me.preferredCityId ?? me.homeCityId ?? undefined;

      const [savedPosts, wantToTry, unrankedSavedObjects] = await Promise.all([
        prisma.save.findMany({
          where: {
            userId: me.id,
            ...(effectiveCityId
              ? { post: { object: { cityId: effectiveCityId } } }
              : {}),
          },
          orderBy: { createdAt: "desc" },
          take: limit,
          include: {
            post: {
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
                rankingList: { select: { id: true, title: true, category: true } },
                mentions: {
                  include: {
                    user: {
                      select: { id: true, handle: true, displayName: true, avatarUrl: true },
                    },
                  },
                },
                restaurantVisit: {
                  include: {
                    companions: {
                      include: {
                        user: {
                          select: { id: true, handle: true, displayName: true, avatarUrl: true },
                        },
                      },
                    },
                    dishes: { orderBy: { createdAt: "asc" } },
                  },
                },
                _count: { select: { likes: true, comments: true, saves: true } },
              },
            },
          },
        }),
        prisma.userRestaurantBookmark.findMany({
          where: {
            userId: me.id,
            status: "want_to_try",
            ...(effectiveCityId ? { object: { cityId: effectiveCityId } } : {}),
          },
          orderBy: { updatedAt: "desc" },
          take: limit,
          include: { object: true },
        }),
        prisma.save.findMany({
          where: {
            userId: me.id,
            post: {
              objectId: { not: null },
              ...(effectiveCityId ? { object: { cityId: effectiveCityId } } : {}),
            },
          },
          orderBy: { createdAt: "desc" },
          take: limit * 2,
          include: {
            post: {
              select: {
                object: {
                  include: {
                    entries: {
                      where: { list: { ownerId: me.id } },
                      select: { id: true },
                      take: 1,
                    },
                  },
                },
              },
            },
          },
        }),
      ]);

      const seenObjectIds = new Set<string>();
      const savedObjects = savedPosts
        .flatMap((row) => (row.post.object ? [row.post.object] : []))
        .filter((object) => {
          if (seenObjectIds.has(object.id)) return false;
          seenObjectIds.add(object.id);
          return true;
        });

      const unrankedObjects = unrankedSavedObjects
        .flatMap((row) => (row.post.object ? [row.post.object] : []))
        .filter((object) => object.entries.length === 0)
        .filter((object) => {
          if (seenObjectIds.has(`unranked:${object.id}`)) return false;
          seenObjectIds.add(`unranked:${object.id}`);
          return true;
        });

      return c.json({
        posts: savedPosts.map((row) => ({
          ...row.post,
          stats: row.post._count,
          why: row.post.object?.city
            ? `Saved near ${row.post.object.city}`
            : "Saved by you",
          viewer: { likedByMe: false, savedByMe: true },
        })),
        objects: savedObjects,
        wantToTry: wantToTry.map((row) => ({
          bookmark: {
            id: row.id,
            userId: row.userId,
            objectId: row.objectId,
            status: row.status,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
          },
          object: row.object,
        })),
        unrankedObjects,
      });
    },
  );
