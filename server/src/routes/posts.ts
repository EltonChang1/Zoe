import { Hono } from "hono";
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
  getHiddenUserIds,
  isBlockedEitherWay,
} from "../lib/moderation.js";
import { sendPushToUser } from "../lib/push.js";

const DetailLayout = z.enum(["discovery_photo", "album_review", "product_hero"]);
const PostType = z.enum(["photo", "carousel", "short_video"]);

const createPostSchema = z.object({
  objectId: idParam,
  postType: PostType.default("photo"),
  detailLayout: DetailLayout.default("discovery_photo"),
  headline: z.string().min(1).max(160),
  caption: z.string().min(1).max(2000),
  tags: z.array(z.string().min(1).max(40)).max(12).default([]),
  rankingListId: idParam.optional(),
  locationLabel: z.string().max(120).optional(),
  aspect: z.enum(["tall", "square", "wide"]).default("tall"),
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

      // Comments moved to a dedicated paginated endpoint (`/posts/:id/comments`)
      // so threads with thousands of replies don't blow up the detail
      // payload. Clients now hit both in parallel on first render.
      return c.json({
        post: {
          ...post,
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

      if (input.rankingListId) {
        const list = await prisma.rankingList.findUnique({
          where: { id: input.rankingListId },
          select: { ownerId: true },
        });
        if (!list || list.ownerId !== me.id) {
          throw HttpError.forbidden("You can only reference your own lists");
        }
      }

      const post = await prisma.post.create({
        data: { ...input, authorId: me.id },
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

      // Cascades take care of likes / saves / comments. Posts themselves
      // don't own uploaded media — the hero image lives on the Object
      // record — so there's nothing to clean up in storage.
      await prisma.post.delete({ where: { id } });
      return c.json({ ok: true });
    },
  );
