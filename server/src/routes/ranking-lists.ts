import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

import { prisma } from "../db.js";
import { HttpError } from "../http/errors.js";
import { idParam } from "../http/validate.js";
import {
  currentUser,
  requireAuth,
  type AuthVariables,
} from "../auth/middleware.js";
import {
  insertEntry,
  moveEntry,
  readList,
  removeEntry,
} from "../lib/ranking.js";

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
    zValidator(
      "query",
      z.object({
        owner: z.string().optional(), // handle filter
        category: z.string().optional(),
        limit: z.coerce.number().int().min(1).max(50).default(20),
        cursor: z.string().optional(),
      }),
    ),
    async (c) => {
      const q = c.req.valid("query");
      const ownerId = q.owner
        ? (
            await prisma.user.findUnique({
              where: { handle: q.owner.toLowerCase() },
              select: { id: true },
            })
          )?.id
        : undefined;
      if (q.owner && !ownerId) return c.json({ lists: [], nextCursor: null });

      const lists = await prisma.rankingList.findMany({
        where: {
          ownerId: ownerId ?? undefined,
          category: q.category ?? undefined,
          visibility: "public",
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
    zValidator("param", z.object({ id: idParam })),
    async (c) => {
      const { id } = c.req.valid("param");
      const list = await readList(id);
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
  );

async function assertOwner(listId: string, userId: string) {
  const list = await prisma.rankingList.findUnique({
    where: { id: listId },
    select: { ownerId: true },
  });
  if (!list) throw HttpError.notFound("Ranking list not found");
  if (list.ownerId !== userId) throw HttpError.forbidden();
}
