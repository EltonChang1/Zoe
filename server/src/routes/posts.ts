import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

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
  getHiddenUserIds,
  isBlockedEitherWay,
} from "../lib/moderation.js";
import { sendPushToUser } from "../lib/push.js";
import { insertEntry } from "../lib/ranking.js";
import { recalculateLinkedCityRankingForUserList } from "../lib/city-ranking.js";
import {
  createPostMentions,
  createRestaurantVisit,
  mentionedUserIdsSchema,
  readRestaurantObjectOrThrow,
  restaurantVisitSchema,
} from "../lib/restaurant-social.js";

const DetailLayout = z.enum([
  "discovery_photo",
  "album_review",
  "product_hero",
  "blog_story",
]);
const PostType = z.enum(["photo", "carousel", "short_video"]);
const PostKind = z.enum(["place", "music", "blog", "ranking_update"]);

const createPostSchema = z.object({
  objectId: idParam.optional(),
  postKind: PostKind.optional(),
  postType: PostType.default("photo"),
  detailLayout: DetailLayout.default("discovery_photo"),
  imageUrl: z.string().url().optional(),
  headline: z.string().min(1).max(160),
  caption: z.string().min(1).max(2000),
  tags: z.array(z.string().min(1).max(40)).max(12).default([]),
  rankingListId: idParam.optional(),
  rankingAttachment: z
    .discriminatedUnion("mode", [
      z.object({
        mode: z.literal("existing"),
        listId: idParam,
      }),
      z.object({
        mode: z.literal("insert"),
        listId: idParam,
        insertAt: z.number().int().min(1).max(10_000),
        note: z.string().max(600).optional(),
      }),
    ])
    .optional(),
  locationLabel: z.string().max(120).optional(),
  aspect: z.enum(["tall", "square", "wide"]).default("tall"),
  mentionedUserIds: mentionedUserIdsSchema,
  restaurantVisit: restaurantVisitSchema,
});

const commentSchema = z.object({
  body: z.string().min(1).max(800),
  parentId: idParam.optional(),
});

export const postsRouter = new Hono<{ Variables: AuthVariables }>()
  .get(
    "/:id",
    optionalAuth,
    zValidator("param", z.object({ id: idParam })),
    async (c) => {
      const { id } = c.req.valid("param");
      const viewer = c.var.user;
      const post = await prisma.post.findUnique({
        where: { id },
        include: {
          author: {
            select: {
              id: true,
              handle: true,
              displayName: true,
              avatarUrl: true,
            },
          },
          object: true,
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
      if (!post) throw HttpError.notFound();

      // Either side of a block erases the post for the viewer. 404 (not
      // 403) so we don't leak that the author exists.
      if (await isBlockedEitherWay(viewer?.id, post.authorId)) {
        throw HttpError.notFound();
      }

      const [likedByMe, savedByMe] = await Promise.all([
        viewer
          ? prisma.like.findUnique({
              where: { userId_postId: { userId: viewer.id, postId: id } },
            })
          : null,
        viewer
          ? prisma.save.findUnique({
              where: { userId_postId: { userId: viewer.id, postId: id } },
            })
          : null,
      ]);

      const hidden = await getHiddenUserIds(viewer?.id);

      // Comments moved to a dedicated paginated endpoint (`/posts/:id/comments`)
      // so threads with thousands of replies don't blow up the detail
      // payload. Clients now hit both in parallel on first render.
      return c.json({
        post: {
          ...post,
          mentions: post.mentions.filter((mention) => !hidden.includes(mention.userId)),
          restaurantVisit: post.restaurantVisit
            ? {
                ...post.restaurantVisit,
                companions: post.restaurantVisit.companions.filter(
                  (companion) => !hidden.includes(companion.userId),
                ),
              }
            : null,
          stats: post._count,
          viewer: {
            likedByMe: Boolean(likedByMe),
            savedByMe: Boolean(savedByMe),
            isAuthor: viewer?.id === post.authorId,
          },
        },
      });
    },
  )
  .get(
    "/:id/comments",
    optionalAuth,
    zValidator("param", z.object({ id: idParam })),
    zValidator(
      "query",
      z.object({
        limit: z.coerce.number().int().min(1).max(100).default(30),
        cursor: z.string().optional(),
      }),
    ),
    async (c) => {
      const { id } = c.req.valid("param");
      const { limit, cursor } = c.req.valid("query");
      const viewer = c.var.user;

      const exists = await prisma.post.findUnique({
        where: { id },
        select: { id: true, authorId: true },
      });
      if (!exists) throw HttpError.notFound();
      if (await isBlockedEitherWay(viewer?.id, exists.authorId)) {
        throw HttpError.notFound();
      }

      const hidden = await getHiddenUserIds(viewer?.id);
      const authorFilter =
        hidden.length > 0 ? { authorId: { notIn: hidden } } : {};

      // Paginate top-level threads chronologically; replies arrive inline per
      // parent so the client renders a single-depth tree without a second
      // round-trip (identical shape to /shorts/:id/comments). Block filter
      // applies to both top-level rows and nested replies.
      const rows = await prisma.comment.findMany({
        where: { postId: id, parentId: null, ...authorFilter },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        include: {
          author: {
            select: {
              id: true,
              handle: true,
              displayName: true,
              avatarUrl: true,
            },
          },
          replies: {
            where: authorFilter,
            orderBy: { createdAt: "asc" },
            include: {
              author: {
                select: {
                  id: true,
                  handle: true,
                  displayName: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      });

      return c.json({
        comments: rows.slice(0, limit),
        nextCursor: rows.length > limit ? rows[limit]!.id : null,
      });
    },
  )
  .post(
    "/",
    requireAuth,
    zValidator("json", createPostSchema),
    async (c) => {
      const me = currentUser(c);
      const input = c.req.valid("json");
      const {
        rankingAttachment,
        rankingListId,
        postKind: _postKind,
        imageUrl: _imageUrl,
        detailLayout: _detailLayout,
        objectId: _objectId,
        mentionedUserIds,
        restaurantVisit,
        ...postInput
      } = input;

      let insertedListId: string | null = null;
      let mentionNotifyIds: string[] = [];
      let companionNotifyIds: string[] = [];
      const post = await prisma.$transaction(async (tx) => {
        const normalized = await normalizeCreatePostInput(tx, input);
        let rankingInput = {};
        if (rankingAttachment) {
          if (!normalized.objectId) {
            throw HttpError.badRequest("Ranking context requires an object");
          }
          rankingInput = await resolveRankingAttachment({
            tx,
            userId: me.id,
            objectId: normalized.objectId,
            attachment: rankingAttachment,
            imageUrl: normalized.imageUrl,
          });
        } else if (rankingListId) {
          if (!normalized.objectId) {
            throw HttpError.badRequest("Ranking context requires an object");
          }
          rankingInput = await resolveLegacyRankingListReference({
            tx,
            userId: me.id,
            objectId: normalized.objectId,
            listId: rankingListId,
          });
        }

        if (rankingAttachment?.mode === "insert") {
          insertedListId = rankingAttachment.listId;
        }

        const created = await tx.post.create({
          data: {
            ...postInput,
            objectId: normalized.objectId,
            postKind: normalized.postKind,
            detailLayout: normalized.detailLayout,
            imageUrl: normalized.imageUrl,
            ...rankingInput,
            authorId: me.id,
          },
        });

        mentionNotifyIds = await createPostMentions({
          tx,
          postId: created.id,
          createdById: me.id,
          mentionedUserIds,
        });

        if (restaurantVisit) {
          if (!normalized.objectId) {
            throw HttpError.badRequest("Restaurant visit details require a restaurant or food place");
          }
          const object = await readRestaurantObjectOrThrow(tx, normalized.objectId);
          const visitResult = await createRestaurantVisit({
            tx,
            authorId: me.id,
            object,
            postId: created.id,
            restaurantVisit,
          });
          companionNotifyIds = visitResult.companionUserIds;
        }

        return created;
      });
      if (insertedListId) {
        await recalculateLinkedCityRankingForUserList(insertedListId);
      }
      notifyTaggedUsers({
        actorHandle: me.handle,
        headline: post.headline,
        postId: post.id,
        mentionUserIds: mentionNotifyIds,
        companionUserIds: companionNotifyIds,
      });
      return c.json({ post }, 201);
    },
  )
  .post(
    "/:id/like",
    requireAuth,
    zValidator("param", z.object({ id: idParam })),
    async (c) => {
      const me = currentUser(c);
      const { id } = c.req.valid("param");
      const post = await prisma.post.findUnique({
        where: { id },
        select: { id: true, authorId: true, headline: true },
      });
      if (!post) throw HttpError.notFound();

      await prisma.like.upsert({
        where: { userId_postId: { userId: me.id, postId: id } },
        create: { userId: me.id, postId: id },
        update: {},
      });
      if (post.authorId !== me.id) {
        void sendPushToUser({
          toUserId: post.authorId,
          title: `@${me.handle} liked your post`,
          body: post.headline,
          data: { type: "like", postId: post.id },
        });
      }
      const count = await prisma.like.count({ where: { postId: id } });
      return c.json({ liked: true, likes: count });
    },
  )
  .delete(
    "/:id/like",
    requireAuth,
    zValidator("param", z.object({ id: idParam })),
    async (c) => {
      const me = currentUser(c);
      const { id } = c.req.valid("param");
      await prisma.like
        .delete({ where: { userId_postId: { userId: me.id, postId: id } } })
        .catch(() => undefined);
      const count = await prisma.like.count({ where: { postId: id } });
      return c.json({ liked: false, likes: count });
    },
  )
  .post(
    "/:id/save",
    requireAuth,
    zValidator("param", z.object({ id: idParam })),
    async (c) => {
      const me = currentUser(c);
      const { id } = c.req.valid("param");
      await prisma.save.upsert({
        where: { userId_postId: { userId: me.id, postId: id } },
        create: { userId: me.id, postId: id },
        update: {},
      });
      return c.json({ saved: true });
    },
  )
  .delete(
    "/:id/save",
    requireAuth,
    zValidator("param", z.object({ id: idParam })),
    async (c) => {
      const me = currentUser(c);
      const { id } = c.req.valid("param");
      await prisma.save
        .delete({ where: { userId_postId: { userId: me.id, postId: id } } })
        .catch(() => undefined);
      return c.json({ saved: false });
    },
  )
  .post(
    "/:id/comments",
    requireAuth,
    zValidator("param", z.object({ id: idParam })),
    zValidator("json", commentSchema),
    async (c) => {
      const me = currentUser(c);
      const { id } = c.req.valid("param");
      const { body, parentId } = c.req.valid("json");

      const post = await prisma.post.findUnique({
        where: { id },
        select: { id: true, authorId: true, headline: true },
      });
      if (!post) throw HttpError.notFound();

      let parentAuthorId: string | null = null;
      if (parentId) {
        const parent = await prisma.comment.findUnique({
          where: { id: parentId },
          select: { postId: true, authorId: true },
        });
        if (!parent || parent.postId !== id) {
          throw HttpError.badRequest("parentId must belong to this post");
        }
        parentAuthorId = parent.authorId;
      }

      const comment = await prisma.comment.create({
        data: { postId: id, authorId: me.id, body, parentId: parentId ?? null },
        include: {
          author: {
            select: {
              id: true,
              handle: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      });

      if (parentId && parentAuthorId && parentAuthorId !== me.id) {
        void sendPushToUser({
          toUserId: parentAuthorId,
          title: `@${me.handle} replied to your comment`,
          body,
          data: { type: "reply", postId: post.id, commentId: comment.id },
        });
      } else if (!parentId && post.authorId !== me.id) {
        void sendPushToUser({
          toUserId: post.authorId,
          title: `@${me.handle} commented on your post`,
          body,
          data: { type: "comment", postId: post.id, commentId: comment.id },
        });
      }
      return c.json({ comment }, 201);
    },
  )
  .delete(
    "/:id/comments/:commentId",
    requireAuth,
    zValidator(
      "param",
      z.object({ id: idParam, commentId: idParam }),
    ),
    async (c) => {
      const me = currentUser(c);
      const { id, commentId } = c.req.valid("param");
      const comment = await prisma.comment.findUnique({
        where: { id: commentId },
        select: { authorId: true, postId: true, post: { select: { authorId: true } } },
      });
      if (!comment || comment.postId !== id) throw HttpError.notFound();

      // Only author of the comment or the post can delete.
      const canDelete =
        comment.authorId === me.id || comment.post.authorId === me.id;
      if (!canDelete) throw HttpError.forbidden();

      await prisma.comment.delete({ where: { id: commentId } });
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
      const post = await prisma.post.findUnique({
        where: { id },
        select: { authorId: true },
      });
      if (!post) throw HttpError.notFound();
      if (post.authorId !== me.id) throw HttpError.forbidden();

      // Cascades take care of likes / saves / comments. Uploaded post images
      // may be shared through CDN URLs; storage cleanup can be added once the
      // media table tracks ownership explicitly.
      await prisma.post.delete({ where: { id } });
      return c.json({ ok: true });
    },
  );

type CreatePostInput = z.infer<typeof createPostSchema>;
type PostTx = Prisma.TransactionClient;
type PostKindInput = z.infer<typeof PostKind>;
type DetailLayoutInput = z.infer<typeof DetailLayout>;

function isMusicType(type: string | null | undefined) {
  return type === "album" || type === "track";
}

async function normalizeCreatePostInput(tx: PostTx, input: CreatePostInput) {
  const requestedKind = input.postKind;

  if (requestedKind === "blog") {
    if (input.objectId) {
      throw HttpError.badRequest("Blog posts cannot be attached to an object");
    }
    if (input.rankingAttachment || input.rankingListId) {
      throw HttpError.badRequest("Blog posts cannot attach ranking context");
    }
    if (input.restaurantVisit) {
      throw HttpError.badRequest("Blog posts cannot attach restaurant visit details");
    }
    if (!input.imageUrl) {
      throw HttpError.unprocessable("Blog posts need an uploaded image");
    }
    return {
      objectId: null,
      postKind: "blog" as const,
      detailLayout: "blog_story" as const,
      imageUrl: input.imageUrl,
    };
  }

  if (!input.objectId) {
    throw HttpError.badRequest("objectId is required for place and music posts");
  }

  const object = await tx.object.findUnique({
    where: { id: input.objectId },
    select: {
      id: true,
      type: true,
      heroImage: true,
      musicProviderItems: {
        select: { artworkUrl: true },
        take: 1,
      },
    },
  });
  if (!object) throw HttpError.notFound("Object not found");

  const derivedKind: PostKindInput = isMusicType(object.type)
    ? "music"
    : requestedKind === "ranking_update"
      ? "ranking_update"
      : "place";
  const spotifyArtwork =
    object.heroImage ?? object.musicProviderItems[0]?.artworkUrl ?? null;
  const imageUrl = input.imageUrl ?? (derivedKind === "music" ? spotifyArtwork ?? undefined : undefined);

  if (!imageUrl) {
    throw HttpError.unprocessable(
      derivedKind === "music"
        ? "Music posts need Spotify artwork or an uploaded image"
        : "Posts need an uploaded image",
    );
  }

  const detailLayout: DetailLayoutInput =
    input.detailLayout === "blog_story"
      ? defaultLayoutForObjectType(object.type)
      : input.detailLayout;

  return {
    objectId: object.id,
    postKind: derivedKind,
    detailLayout,
    imageUrl,
  };
}

function defaultLayoutForObjectType(type: string): DetailLayoutInput {
  if (isMusicType(type)) return "album_review";
  if (
    type === "perfume" ||
    type === "fashion" ||
    type === "sneaker" ||
    type === "product"
  ) {
    return "product_hero";
  }
  return "discovery_photo";
}

async function assertOwnedList(tx: PostTx, listId: string, userId: string) {
  const list = await tx.rankingList.findUnique({
    where: { id: listId },
    select: { ownerId: true },
  });
  if (!list || list.ownerId !== userId) {
    throw HttpError.forbidden("You can only reference your own lists");
  }
}

async function resolveRankingAttachment(input: {
  tx: PostTx;
  userId: string;
  objectId: string;
  attachment: NonNullable<CreatePostInput["rankingAttachment"]>;
  imageUrl?: string;
}) {
  const { tx, userId, objectId, attachment, imageUrl } = input;
  await assertOwnedList(tx, attachment.listId, userId);

  if (attachment.mode === "insert") {
    const entry = await insertEntry(
      {
        listId: attachment.listId,
        objectId,
        insertAt: attachment.insertAt,
        note: attachment.note,
        imageUrl,
      },
      tx,
    );
    return {
      rankingListId: attachment.listId,
      rankingRank: entry.rank,
      rankingMovement: entry.movement,
      rankingDelta: entry.delta,
    };
  }

  const entry = await tx.rankingEntry.findUnique({
    where: { listId_objectId: { listId: attachment.listId, objectId } },
    select: { rank: true, movement: true, delta: true },
  });
  if (!entry) {
    throw HttpError.badRequest("Object is not ranked in this list yet");
  }
  return {
    rankingListId: attachment.listId,
    rankingRank: entry.rank,
    rankingMovement: entry.movement,
    rankingDelta: entry.delta,
  };
}

async function resolveLegacyRankingListReference(input: {
  tx: PostTx;
  userId: string;
  objectId: string;
  listId: string;
}) {
  const { tx, userId, objectId, listId } = input;
  await assertOwnedList(tx, listId, userId);
  const entry = await tx.rankingEntry.findUnique({
    where: { listId_objectId: { listId, objectId } },
    select: { rank: true, movement: true, delta: true },
  });
  return {
    rankingListId: listId,
    rankingRank: entry?.rank ?? null,
    rankingMovement: entry?.movement ?? "stable",
    rankingDelta: entry?.delta ?? null,
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
