import { Hono } from "hono";
import { Prisma } from "@prisma/client";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

import { prisma } from "../db.js";
import { HttpError } from "../http/errors.js";
import { idParam } from "../http/validate.js";
import {
  currentUser,
  optionalAuth,
  requireAuth,
  type AuthVariables,
} from "../auth/middleware.js";
import {
  insertEntry,
  moveEntry,
  personalRankingScore,
  readList,
  removeEntry,
} from "../lib/ranking.js";
import {
  recalculateCityRankingList,
  recalculateLinkedCityRankingForUserList,
} from "../lib/city-ranking.js";
import {
  getHiddenUserIds,
  isBlockedEitherWay,
} from "../lib/moderation.js";
import { sendPushToUser } from "../lib/push.js";
import {
  createPostMentions,
  createRestaurantVisit,
  mentionedUserIdsSchema,
  restaurantVisitSchema,
} from "../lib/restaurant-social.js";

const createListSchema = z.object({
  title: z.string().min(1).max(80),
  category: z.string().min(1).max(40),
  description: z.string().max(280).optional(),
  visibility: z.enum(["public", "followers", "private"]).default("public"),
  coverImage: z.string().url().optional(),
  cityId: idParam.optional(),
  listType: z
    .enum(["official_city_connected", "custom_personal"])
    .default("custom_personal"),
  linkedCityRankingListId: idParam.optional(),
});

const insertSchema = z.object({
  objectId: idParam,
  insertAt: z.number().int().min(1).max(10_000),
  note: z.string().max(600).optional(),
  imageUrl: z.string().url().optional(),
  publishPost: z
    .object({
      headline: z.string().min(1).max(160).optional(),
      caption: z.string().min(1).max(2000).optional(),
      tags: z.array(z.string().min(1).max(40)).max(12).optional(),
    })
    .optional(),
  mentionedUserIds: mentionedUserIdsSchema,
  restaurantVisit: restaurantVisitSchema,
});

const moveSchema = z.object({
  toRank: z.number().int().min(1).max(10_000),
});

const replaceEntriesSchema = z.object({
  entries: z
    .array(
      z.object({
        objectId: idParam,
        note: z.string().max(600).optional(),
      }),
    )
    .max(500),
});

export const rankingListsRouter = new Hono<{ Variables: AuthVariables }>()
  .get(
    "/",
    optionalAuth,
    zValidator(
      "query",
      z.object({
        owner: z.string().optional(), // handle filter
        category: z.string().optional(),
        // Lists that contain a specific object — powers the object-detail
        // screen's "Ranked in" section without a bespoke route.
        object: z.string().optional(),
        limit: z.coerce.number().int().min(1).max(50).default(20),
        cursor: z.string().optional(),
      }),
    ),
    async (c) => {
      const q = c.req.valid("query");
      const viewer = c.var.user;
      const ownerId = q.owner
        ? (
            await prisma.user.findUnique({
              where: { handle: q.owner.toLowerCase() },
              select: { id: true },
            })
          )?.id
        : undefined;
      if (q.owner && !ownerId) return c.json({ lists: [], nextCursor: null });

      // Visibility rules:
      // - Viewing your own hub (`owner` resolves to you): all three
      //   visibilities — public, followers, private — are returned. The
      //   Personal hub on the app *must* show the user their own private
      //   and followers-only lists.
      // - Viewing someone else's hub or the unscoped community feed:
      //   public only for now. Followers-only support ships once the
      //   follow graph is wired into this query.
      const isOwnHub = Boolean(viewer && ownerId && ownerId === viewer.id);
      const visibilityFilter: Prisma.RankingListWhereInput = isOwnHub
        ? {}
        : { visibility: "public" };

      const hidden = await getHiddenUserIds(viewer?.id);
      // Scoping to an owner who is on either side of a block returns an
      // empty page (same shape as an unknown handle). Otherwise strip
      // blocked owners from the list query.
      if (ownerId && hidden.includes(ownerId)) {
        return c.json({ lists: [], nextCursor: null });
      }

      const lists = await prisma.rankingList.findMany({
        where: {
          ...(ownerId
            ? { ownerId }
            : hidden.length > 0
              ? { ownerId: { notIn: hidden } }
              : {}),
          category: q.category ?? undefined,
          ...visibilityFilter,
          ...(q.object
            ? { entries: { some: { objectId: q.object } } }
            : {}),
        },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: q.limit + 1,
        ...(q.cursor ? { cursor: { id: q.cursor }, skip: 1 } : {}),
        include: {
          owner: {
            select: { id: true, handle: true, displayName: true, avatarUrl: true },
          },
          _count: { select: { entries: true } },
        },
      });
      return c.json({
        lists: lists.slice(0, q.limit),
        nextCursor: lists.length > q.limit ? lists[q.limit]!.id : null,
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
      const list = await readList(id);
      // A non-public list is only readable by its owner until the follow
      // graph lands. Respond with 404 instead of 403 so list ids can't be
      // enumerated for existence checks. Blocks short-circuit even
      // public lists with the same "no leak" 404.
      if (list.visibility !== "public" && list.ownerId !== viewer?.id) {
        throw HttpError.notFound("Ranking list not found");
      }
      if (await isBlockedEitherWay(viewer?.id, list.ownerId)) {
        throw HttpError.notFound("Ranking list not found");
      }
      const hidden = await getHiddenUserIds(viewer?.id);
      return c.json({
        list: {
          ...list,
          entries: list.entries.map((entry) => ({
            ...entry,
            restaurantVisit: entry.restaurantVisit
              ? {
                  ...entry.restaurantVisit,
                  companions: entry.restaurantVisit.companions.filter(
                    (companion) => !hidden.includes(companion.userId),
                  ),
                }
              : null,
          })),
        },
      });
    },
  )
  .post(
    "/",
    requireAuth,
    zValidator("json", createListSchema),
    async (c) => {
      const me = currentUser(c);
      const body = c.req.valid("json");
      const cityConnection = await resolveCityConnection(body);
      const list = await prisma.rankingList.create({
        data: {
          title: body.title,
          category: cityConnection.category ?? body.category,
          description: body.description,
          visibility: body.visibility,
          coverImage: body.coverImage,
          ownerId: me.id,
          cityId: cityConnection.cityId,
          listType: cityConnection.listType,
          countsTowardCityRanking: cityConnection.countsTowardCityRanking,
          linkedCityRankingListId: cityConnection.linkedCityRankingListId,
        },
      });
      return c.json({ list }, 201);
    },
  )
  .post(
    "/:id/entries",
    requireAuth,
    zValidator("param", z.object({ id: idParam })),
    zValidator("json", insertSchema),
    async (c) => {
      const me = currentUser(c);
      const { id } = c.req.valid("param");
      const body = c.req.valid("json");
      let publishedPostId: string | null = null;
      let publishedHeadline = "";
      let mentionNotifyIds: string[] = [];
      let companionNotifyIds: string[] = [];
      const entry = await prisma.$transaction(async (tx) => {
        const list = await tx.rankingList.findUnique({
          where: { id },
          select: { id: true, title: true, ownerId: true },
        });
        if (!list || list.ownerId !== me.id) {
          throw HttpError.forbidden("You can only edit your own lists");
        }

        const object = await tx.object.findUnique({
          where: { id: body.objectId },
          select: {
            id: true,
            type: true,
            title: true,
            heroImage: true,
            city: true,
            primaryType: true,
            externalTypes: true,
            metadata: true,
            musicProviderItems: {
              select: { artworkUrl: true },
              take: 1,
            },
          },
        });
        if (!object) throw HttpError.notFound("Object not found");

        const isMusic = object.type === "album" || object.type === "track";
        const imageUrl =
          body.imageUrl ??
          (isMusic
            ? object.heroImage ?? object.musicProviderItems[0]?.artworkUrl ?? undefined
            : undefined);
        if (!imageUrl) {
          throw HttpError.unprocessable(
            isMusic
              ? "Music rankings need Spotify artwork or an uploaded image"
              : "Ranking updates need an uploaded image",
          );
        }

        const createdEntry = await insertEntry(
          {
            listId: id,
            objectId: body.objectId,
            insertAt: body.insertAt,
            note: body.note,
            imageUrl,
          },
          tx,
        );

        const publish = body.publishPost ?? {};
        const headline =
          publish.headline ??
          `${object.title} is #${createdEntry.rank} in ${list.title}`;
        const post = await tx.post.create({
          data: {
            authorId: me.id,
            objectId: body.objectId,
            postKind: "ranking_update",
            postType: "photo",
            detailLayout: isMusic ? "album_review" : "discovery_photo",
            imageUrl,
            headline,
            caption:
              publish.caption ??
              body.note ??
              `Added to ${list.title}.`,
            tags: publish.tags ?? [],
            rankingListId: id,
            rankingRank: createdEntry.rank,
            rankingMovement: createdEntry.movement,
            rankingDelta: createdEntry.delta,
            locationLabel: object.city ?? undefined,
            aspect: isMusic ? "square" : "tall",
          },
        });
        publishedPostId = post.id;
        publishedHeadline = headline;
        mentionNotifyIds = await createPostMentions({
          tx,
          postId: post.id,
          createdById: me.id,
          mentionedUserIds: body.mentionedUserIds,
        });
        if (body.restaurantVisit) {
          const visitResult = await createRestaurantVisit({
            tx,
            authorId: me.id,
            object,
            postId: post.id,
            rankingEntryId: createdEntry.id,
            restaurantVisit: body.restaurantVisit,
          });
          companionNotifyIds = visitResult.companionUserIds;
        }
        return createdEntry;
      });
      await recalculateLinkedCityRankingForUserList(id);
      if (publishedPostId) {
        notifyTaggedUsers({
          actorHandle: me.handle,
          headline: publishedHeadline,
          postId: publishedPostId,
          mentionUserIds: mentionNotifyIds,
          companionUserIds: companionNotifyIds,
        });
      }
      const [hydratedEntry, totalEntries] = await Promise.all([
        prisma.rankingEntry.findUnique({
          where: { id: entry.id },
          include: {
            object: true,
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
          },
        }),
        prisma.rankingEntry.count({ where: { listId: id } }),
      ]);
      return c.json(
        {
          entry: hydratedEntry
            ? {
                ...hydratedEntry,
                score: personalRankingScore(hydratedEntry.rank, totalEntries),
              }
            : {
                ...entry,
                score: personalRankingScore(entry.rank, totalEntries),
              },
          postId: publishedPostId,
        },
        201,
      );
    },
  )
  .patch(
    "/:id/entries/:entryId/move",
    requireAuth,
    zValidator(
      "param",
      z.object({ id: idParam, entryId: idParam }),
    ),
    zValidator("json", moveSchema),
    async (c) => {
      const me = currentUser(c);
      const { id, entryId } = c.req.valid("param");
      const { toRank } = c.req.valid("json");
      await assertOwner(id, me.id);
      const entry = await moveEntry({ listId: id, entryId, toRank });
      await recalculateLinkedCityRankingForUserList(id);
      return c.json({ entry });
    },
  )
  .put(
    "/:id/entries",
    requireAuth,
    zValidator("param", z.object({ id: idParam })),
    zValidator("json", replaceEntriesSchema),
    async (c) => {
      const me = currentUser(c);
      const { id } = c.req.valid("param");
      const { entries } = c.req.valid("json");
      await assertOwner(id, me.id);

      const seen = new Set<string>();
      for (const entry of entries) {
        if (seen.has(entry.objectId)) {
          throw HttpError.conflict("Object appears more than once in the list");
        }
        seen.add(entry.objectId);
      }

      await prisma.$transaction(async (tx) => {
        await tx.rankingEntry.deleteMany({ where: { listId: id } });
        for (const [index, entry] of entries.entries()) {
          await tx.rankingEntry.create({
            data: {
              listId: id,
              objectId: entry.objectId,
              rank: index + 1,
              movement: "stable",
              delta: null,
              note: entry.note ?? null,
            },
          });
        }
      });
      await recalculateLinkedCityRankingForUserList(id);
      const list = await readList(id);
      return c.json({ list });
    },
  )
  .delete(
    "/:id/entries/:entryId",
    requireAuth,
    zValidator(
      "param",
      z.object({ id: idParam, entryId: idParam }),
    ),
    async (c) => {
      const me = currentUser(c);
      const { id, entryId } = c.req.valid("param");
      await assertOwner(id, me.id);
      await removeEntry(id, entryId);
      await recalculateLinkedCityRankingForUserList(id);
      return c.json({ ok: true });
    },
  )
  .delete(
    "/:id",
    requireAuth,
    zValidator("param", z.object({ id: idParam })),
    async (c) => {
      const me = currentUser(c);
      const { id } = c.req.valid("param");
      await assertOwner(id, me.id);
      const linked = await prisma.rankingList.findUnique({
        where: { id },
        select: {
          linkedCityRankingListId: true,
          listType: true,
          countsTowardCityRanking: true,
        },
      });
      // `RankingEntry` cascades on listId, and `Post.rankingListId` is a
      // nullable FK, so Prisma will null it out when the list goes away
      // (posts survive the removal of their source list — they just lose
      // the "Ranked #x in …" chip). No storage cleanup: cover images
      // point at external catalog hero art, not user uploads.
      await prisma.rankingList.delete({ where: { id } });
      if (
        linked?.linkedCityRankingListId &&
        linked.listType === "official_city_connected" &&
        linked.countsTowardCityRanking
      ) {
        await recalculateCityRankingList(linked.linkedCityRankingListId);
      }
      return c.json({ ok: true });
    },
  );

async function assertOwner(listId: string, userId: string) {
  const list = await prisma.rankingList.findUnique({
    where: { id: listId },
    select: { ownerId: true },
  });
  if (!list) throw HttpError.notFound("Ranking list not found");
  if (list.ownerId !== userId) throw HttpError.forbidden();
}

async function resolveCityConnection(body: z.infer<typeof createListSchema>) {
  if (body.listType !== "official_city_connected") {
    return {
      cityId: body.cityId ?? null,
      listType: "custom_personal" as const,
      countsTowardCityRanking: false,
      linkedCityRankingListId: null,
      category: null,
    };
  }

  if (!body.cityId || !body.linkedCityRankingListId) {
    throw HttpError.badRequest(
      "Official city-connected lists require cityId and linkedCityRankingListId",
    );
  }

  const official = await prisma.officialCityRankingList.findUnique({
    where: { id: body.linkedCityRankingListId },
    select: { id: true, cityId: true, category: true },
  });
  if (!official) throw HttpError.notFound("Official city ranking not found");
  if (official.cityId !== body.cityId) {
    throw HttpError.badRequest(
      "Official city ranking does not belong to the selected city",
    );
  }

  return {
    cityId: official.cityId,
    listType: "official_city_connected" as const,
    countsTowardCityRanking: true,
    linkedCityRankingListId: official.id,
    category: official.category,
  };
}

function notifyTaggedUsers(input: {
  actorHandle: string;
  headline: string;
  postId: string;
  mentionUserIds: string[];
  companionUserIds: string[];
}) {
  const companionSet = new Set(input.companionUserIds);
  for (const toUserId of input.companionUserIds) {
    void sendPushToUser({
      toUserId,
      title: `@${input.actorHandle} tagged you at a restaurant`,
      body: input.headline,
      data: { type: "companion_tag", postId: input.postId },
    });
  }
  for (const toUserId of input.mentionUserIds) {
    if (companionSet.has(toUserId)) continue;
    void sendPushToUser({
      toUserId,
      title: `@${input.actorHandle} mentioned you`,
      body: input.headline,
      data: { type: "mention", postId: input.postId },
    });
  }
}
