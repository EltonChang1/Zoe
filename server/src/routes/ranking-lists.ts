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
  readList,
  removeEntry,
} from "../lib/ranking.js";
import {
  getHiddenUserIds,
  isBlockedEitherWay,
} from "../lib/moderation.js";

const createListSchema = z.object({
  title: z.string().min(1).max(80),
  category: z.string().min(1).max(40),
  description: z.string().max(280).optional(),
  visibility: z.enum(["public", "followers", "private"]).default("public"),
  coverImage: z.string().url().optional(),
});

const insertSchema = z.object({
  objectId: idParam,
  insertAt: z.number().int().min(1).max(10_000),
  note: z.string().max(600).optional(),
});

const moveSchema = z.object({
  toRank: z.number().int().min(1).max(10_000),
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
      return c.json({ list });
    },
  )
  .post(
    "/",
    requireAuth,
    zValidator("json", createListSchema),
    async (c) => {
      const me = currentUser(c);
      const list = await prisma.rankingList.create({
        data: { ...c.req.valid("json"), ownerId: me.id },
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
      await assertOwner(id, me.id);
      const entry = await insertEntry({
        listId: id,
        objectId: body.objectId,
        insertAt: body.insertAt,
        note: body.note,
      });
      return c.json({ entry }, 201);
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
      return c.json({ entry });
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
      // `RankingEntry` cascades on listId, and `Post.rankingListId` is a
      // nullable FK, so Prisma will null it out when the list goes away
      // (posts survive the removal of their source list — they just lose
      // the "Ranked #x in …" chip). No storage cleanup: cover images
      // point at external catalog hero art, not user uploads.
      await prisma.rankingList.delete({ where: { id } });
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
