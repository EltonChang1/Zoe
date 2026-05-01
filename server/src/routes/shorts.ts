import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { Prisma } from "@prisma/client";
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
import { storage } from "../storage/index.js";
import {
  getHiddenUserIds,
  isBlockedEitherWay,
} from "../lib/moderation.js";

const createSchema = z.object({
  objectId: idParam,
  hookLine: z.string().min(1).max(160),
  caption: z.string().min(1).max(500),
  audioLabel: z.string().max(120).optional(),
  heroImage: z.string().url(),
  videoUrl: z.string().url().optional(),
  rankingListTitle: z.string().max(80).optional(),
  rankingRank: z.number().int().positive().optional(),
});

const commentSchema = z.object({
  body: z.string().min(1).max(800),
  parentId: idParam.optional(),
});

/**
 * Projection helpers shared between list + detail so the wire format stays
 * in sync. The list endpoint flattens `_count` into a `stats` object and
 * hoists viewer-specific flags (`likedByMe`, `savedByMe`) to match what the
 * Posts endpoints already do — this keeps the client mutation hooks
 * straightforward when they write optimistic updates into the cache.
 */
const shortInclude = Prisma.validator<Prisma.ShortInclude>()({
  author: {
    select: { id: true, handle: true, displayName: true, avatarUrl: true },
  },
  object: {
    select: { id: true, title: true, type: true, heroImage: true, metadata: true },
  },
  _count: { select: { likedBy: true, savedBy: true, comments: true } },
});

type ShortWithInclude = Prisma.ShortGetPayload<{ include: typeof shortInclude }>;

/**
 * Flatten Prisma's `_count` block into a viewer-friendly `stats` object and
 * hoist the per-viewer flags so the wire format matches what the Posts
 * endpoints already emit. Keeping these in one place ensures the list and
 * detail responses stay in sync.
 */
function project(
  short: ShortWithInclude,
  viewer: { likedByMe: boolean; savedByMe: boolean } | null,
) {
  const { _count, ...rest } = short;
  return {
    ...rest,
    stats: {
      likes: _count.likedBy,
      saves: _count.savedBy,
      comments: _count.comments,
    },
    viewer: viewer ?? null,
  };
}

async function viewerFlagsFor(
  viewerId: string | undefined,
  shortIds: string[],
): Promise<Map<string, { likedByMe: boolean; savedByMe: boolean }>> {
  const flags = new Map<string, { likedByMe: boolean; savedByMe: boolean }>();
  if (!viewerId || shortIds.length === 0) return flags;
  const [likes, saves] = await Promise.all([
    prisma.shortLike.findMany({
      where: { userId: viewerId, shortId: { in: shortIds } },
      select: { shortId: true },
    }),
    prisma.shortSave.findMany({
      where: { userId: viewerId, shortId: { in: shortIds } },
      select: { shortId: true },
    }),
  ]);
  const likeSet = new Set(likes.map((l) => l.shortId));
  const saveSet = new Set(saves.map((s) => s.shortId));
  for (const id of shortIds) {
    flags.set(id, {
      likedByMe: likeSet.has(id),
      savedByMe: saveSet.has(id),
    });
  }
  return flags;
}

export const shortsRouter = new Hono<{ Variables: AuthVariables }>()
  .get(
    "/",
    optionalAuth,
    zValidator(
      "query",
      z.object({
        limit: z.coerce.number().int().min(1).max(40).default(20),
        cursor: z.string().optional(),
      }),
    ),
    async (c) => {
      const { limit, cursor } = c.req.valid("query");
      const viewer = c.var.user;
      const hidden = await getHiddenUserIds(viewer?.id);
      const rows = await prisma.short.findMany({
        where: hidden.length > 0 ? { authorId: { notIn: hidden } } : {},
        orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        include: shortInclude,
      });
      const slice = rows.slice(0, limit);
      const flags = await viewerFlagsFor(
        viewer?.id,
        slice.map((s) => s.id),
      );
      return c.json({
        shorts: slice.map((s) =>
          project(s, flags.get(s.id) ?? null),
        ),
        nextCursor: rows.length > limit ? rows[limit]!.id : null,
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
      const short = await prisma.short.findUnique({
        where: { id },
        include: shortInclude,
      });
      if (!short) throw HttpError.notFound();
      if (await isBlockedEitherWay(viewer?.id, short.authorId)) {
        throw HttpError.notFound();
      }

      const [likedByMe, savedByMe] = await Promise.all([
        viewer
          ? prisma.shortLike.findUnique({
              where: { userId_shortId: { userId: viewer.id, shortId: id } },
            })
          : null,
        viewer
          ? prisma.shortSave.findUnique({
              where: { userId_shortId: { userId: viewer.id, shortId: id } },
            })
          : null,
      ]);

      return c.json({
        short: project(
          short,
          viewer
            ? { likedByMe: Boolean(likedByMe), savedByMe: Boolean(savedByMe) }
            : null,
        ),
      });
    },
  )
  .post(
    "/",
    requireAuth,
    zValidator("json", createSchema),
    async (c) => {
      const me = currentUser(c);
      const input = c.req.valid("json");
      const short = await prisma.short.create({
        data: { ...input, authorId: me.id },
      });
      return c.json({ short }, 201);
    },
  )
  .post(
    "/:id/like",
    requireAuth,
    zValidator("param", z.object({ id: idParam })),
    async (c) => {
      const me = currentUser(c);
      const { id } = c.req.valid("param");
      // Fail fast on unknown ids so toggling against a deleted/404 short
      // doesn't leave orphaned like rows.
      const exists = await prisma.short.findUnique({
        where: { id },
        select: { id: true },
      });
      if (!exists) throw HttpError.notFound();
      await prisma.shortLike.upsert({
        where: { userId_shortId: { userId: me.id, shortId: id } },
        create: { userId: me.id, shortId: id },
        update: {},
      });
      const count = await prisma.shortLike.count({ where: { shortId: id } });
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
      await prisma.shortLike
        .delete({ where: { userId_shortId: { userId: me.id, shortId: id } } })
        .catch(() => undefined);
      const count = await prisma.shortLike.count({ where: { shortId: id } });
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
      const exists = await prisma.short.findUnique({
        where: { id },
        select: { id: true },
      });
      if (!exists) throw HttpError.notFound();
      await prisma.shortSave.upsert({
        where: { userId_shortId: { userId: me.id, shortId: id } },
        create: { userId: me.id, shortId: id },
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
      await prisma.shortSave
        .delete({ where: { userId_shortId: { userId: me.id, shortId: id } } })
        .catch(() => undefined);
      return c.json({ saved: false });
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

      const exists = await prisma.short.findUnique({
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

      // Paginate top-level threads; replies arrive inline per parent so the
      // client can render a single-depth tree without a second request.
      const rows = await prisma.shortComment.findMany({
        where: { shortId: id, parentId: null, ...authorFilter },
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
    "/:id/comments",
    requireAuth,
    zValidator("param", z.object({ id: idParam })),
    zValidator("json", commentSchema),
    async (c) => {
      const me = currentUser(c);
      const { id } = c.req.valid("param");
      const { body, parentId } = c.req.valid("json");

      const short = await prisma.short.findUnique({
        where: { id },
        select: { id: true },
      });
      if (!short) throw HttpError.notFound();

      if (parentId) {
        const parent = await prisma.shortComment.findUnique({
          where: { id: parentId },
          select: { shortId: true },
        });
        if (!parent || parent.shortId !== id) {
          throw HttpError.badRequest("parentId must belong to this short");
        }
      }

      const comment = await prisma.shortComment.create({
        data: { shortId: id, authorId: me.id, body, parentId: parentId ?? null },
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
      const comment = await prisma.shortComment.findUnique({
        where: { id: commentId },
        select: {
          authorId: true,
          shortId: true,
          short: { select: { authorId: true } },
        },
      });
      if (!comment || comment.shortId !== id) throw HttpError.notFound();

      // Allow the commenter or the short's author to delete (mirrors /posts).
      const canDelete =
        comment.authorId === me.id || comment.short.authorId === me.id;
      if (!canDelete) throw HttpError.forbidden();

      await prisma.shortComment.delete({ where: { id: commentId } });
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
      const short = await prisma.short.findUnique({
        where: { id },
        select: { authorId: true, heroImage: true, videoUrl: true },
      });
      if (!short) throw HttpError.notFound();
      if (short.authorId !== me.id) throw HttpError.forbidden();

      // Row first — cascades wipe likes / saves / comments. Storage
      // cleanup runs after and is best-effort: a failure here must not
      // resurrect a row we've already removed.
      await prisma.short.delete({ where: { id } });
      if (short.heroImage) {
        await storage.deletePublicUrl(short.heroImage).catch(() => undefined);
      }
      if (short.videoUrl) {
        await storage.deletePublicUrl(short.videoUrl).catch(() => undefined);
      }
      return c.json({ ok: true });
    },
  );
