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

      const [likedByMe, savedByMe, comments] = await Promise.all([
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
        prisma.comment.findMany({
          where: { postId: id, parentId: null },
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
            replies: {
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
        }),
      ]);

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
        comments,
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
      await prisma.like.upsert({
        where: { userId_postId: { userId: me.id, postId: id } },
        create: { userId: me.id, postId: id },
        update: {},
      });
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
        select: { id: true },
      });
      if (!post) throw HttpError.notFound();

      if (parentId) {
        const parent = await prisma.comment.findUnique({
          where: { id: parentId },
          select: { postId: true },
        });
        if (!parent || parent.postId !== id) {
          throw HttpError.badRequest("parentId must belong to this post");
        }
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
  );
