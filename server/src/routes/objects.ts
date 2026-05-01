import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

import { prisma } from "../db.js";
import { optionalAuth, type AuthVariables } from "../auth/middleware.js";
import { HttpError } from "../http/errors.js";
import { idParam } from "../http/validate.js";
import { getHiddenUserIds } from "../lib/moderation.js";

const ObjectTypeEnum = z.enum([
  "place",
  "restaurant",
  "cafe",
  "bar",
  "perfume",
  "album",
  "track",
  "fashion",
  "sneaker",
  "product",
]);

const createSchema = z.object({
  type: ObjectTypeEnum,
  title: z.string().min(1).max(120),
  subtitle: z.string().max(200).optional(),
  city: z.string().max(80).optional(),
  neighborhood: z.string().max(80).optional(),
  tags: z.array(z.string().min(1).max(40)).max(12).default([]),
  shortDescriptor: z.string().max(280).optional(),
  heroImage: z.string().url().optional(),
  metadata: z.record(z.any()).optional(),
});

export const objectsRouter = new Hono<{ Variables: AuthVariables }>()
  .get(
    "/",
    zValidator(
      "query",
      z.object({
        type: ObjectTypeEnum.optional(),
        city: z.string().optional(),
        cursor: z.string().optional(),
        limit: z.coerce.number().int().min(1).max(50).default(20),
      }),
    ),
    async (c) => {
      const q = c.req.valid("query");
      const objects = await prisma.object.findMany({
        where: {
          type: q.type ?? undefined,
          city: q.city ?? undefined,
        },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: q.limit + 1,
        ...(q.cursor ? { cursor: { id: q.cursor }, skip: 1 } : {}),
      });
      const nextCursor =
        objects.length > q.limit ? objects[q.limit]!.id : null;
      return c.json({
        objects: objects.slice(0, q.limit),
        nextCursor,
      });
    },
  )
  .get(
    "/:id",
    optionalAuth,
    zValidator("param", z.object({ id: idParam })),
    async (c) => {
      const { id } = c.req.valid("param");
      const viewer = c.var.user;
      const hidden = await getHiddenUserIds(viewer?.id);
      const object = await prisma.object.findUnique({
        where: { id },
        include: {
          musicProviderItems: true,
          restaurantBookmarks: {
            where: {
              userId: viewer?.id ?? "__anonymous__",
              status: "want_to_try",
            },
            take: 1,
          },
          restaurantVisits: {
            where:
              hidden.length > 0
                ? { authorId: { notIn: hidden } }
                : undefined,
            take: 20,
            orderBy: { createdAt: "desc" },
            include: {
              author: {
                select: {
                  id: true,
                  handle: true,
                  displayName: true,
                  avatarUrl: true,
                },
              },
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
          _count: { select: { posts: true, entries: true } },
        },
      });
      if (!object) throw HttpError.notFound();
      const followedIds = viewer
        ? (
            await prisma.follow.findMany({
              where: { followerId: viewer.id },
              select: { followeeId: true },
            })
          ).map((f) => f.followeeId)
        : [];
      const [savedPostsCount, friendSavedCount, topCityRank] =
        await Promise.all([
          prisma.save.count({ where: { post: { objectId: id } } }),
          followedIds.length > 0
            ? prisma.save.count({
                where: {
                  userId: { in: followedIds },
                  post: { objectId: id },
                },
              })
            : Promise.resolve(0),
          prisma.cityRankingEntry.findFirst({
            where: { objectId: id },
            orderBy: [{ rank: "asc" }],
            select: {
              rank: true,
              cityRankingList: {
                select: { title: true, city: { select: { name: true } } },
              },
            },
          }),
        ]);
      return c.json({
        object: {
          ...object,
          restaurantBookmarks: object.restaurantBookmarks ?? [],
          restaurantVisits: object.restaurantVisits.map((visit) => ({
            ...visit,
            companions: visit.companions.filter(
              (companion) => !hidden.includes(companion.userId),
            ),
          })),
          viewer: {
            wantToTry: Boolean(object.restaurantBookmarks?.length),
          },
          socialProof: {
            rankingAppearances: object._count.entries,
            savedPosts: savedPostsCount,
            friendSaves: friendSavedCount,
            topCityRank: topCityRank
              ? {
                  rank: topCityRank.rank,
                  listTitle: topCityRank.cityRankingList.title,
                  city: topCityRank.cityRankingList.city.name,
                }
              : null,
          },
        },
      });
    },
  )
  .post("/", zValidator("json", createSchema), async (c) => {
    const input = c.req.valid("json");
    const object = await prisma.object.create({ data: input });
    return c.json({ object }, 201);
  });
