import { Prisma, type RankingEntry } from "@prisma/client";

import { prisma } from "../db.js";
import { HttpError } from "../http/errors.js";

/**
 * Ranking engine.
 *
 * The store of truth is `ranking_entries.rank` — a 1-indexed dense integer
 * per (listId, rank). Insert / move / delete always run inside a transaction
 * and rely on the `DEFERRABLE INITIALLY DEFERRED` uniqueness constraint so
 * intermediate shifts don't trip the index.
 */

export interface InsertInput {
  listId: string;
  objectId: string;
  insertAt: number; // 1-indexed target rank
  note?: string | null;
}

export interface MoveInput {
  listId: string;
  entryId: string;
  toRank: number;
}

export async function insertEntry(input: InsertInput): Promise<RankingEntry> {
  const { listId, objectId, insertAt, note } = input;

  return prisma.$transaction(async (tx) => {
    const list = await tx.rankingList.findUnique({
      where: { id: listId },
      select: { id: true, _count: { select: { entries: true } } },
    });
    if (!list) throw HttpError.notFound("Ranking list not found");

    const total = list._count.entries;
    if (insertAt < 1 || insertAt > total + 1) {
      throw HttpError.badRequest(
        `insertAt must be between 1 and ${total + 1}`,
      );
    }

    const existing = await tx.rankingEntry.findUnique({
      where: { listId_objectId: { listId, objectId } },
      select: { id: true },
    });
    if (existing) {
      throw HttpError.conflict("Object is already in this list");
    }

    // Shift everyone at or below the target down by one rank.
    await tx.rankingEntry.updateMany({
      where: { listId, rank: { gte: insertAt } },
      data: { rank: { increment: 1 } },
    });

    return tx.rankingEntry.create({
      data: {
        listId,
        objectId,
        rank: insertAt,
        movement: "new",
        delta: null,
        note: note ?? null,
      },
    });
  });
}

export async function moveEntry(input: MoveInput): Promise<RankingEntry> {
  const { listId, entryId, toRank } = input;

  return prisma.$transaction(async (tx) => {
    const entry = await tx.rankingEntry.findUnique({ where: { id: entryId } });
    if (!entry || entry.listId !== listId) {
      throw HttpError.notFound("Entry not found in this list");
    }

    const total = await tx.rankingEntry.count({ where: { listId } });
    if (toRank < 1 || toRank > total) {
      throw HttpError.badRequest(`toRank must be between 1 and ${total}`);
    }

    const fromRank = entry.rank;
    if (toRank === fromRank) return entry;

    if (toRank < fromRank) {
      // Moving up: items in [toRank, fromRank-1] shift down by 1.
      await tx.rankingEntry.updateMany({
        where: { listId, rank: { gte: toRank, lte: fromRank - 1 } },
        data: { rank: { increment: 1 } },
      });
    } else {
      // Moving down: items in [fromRank+1, toRank] shift up by 1.
      await tx.rankingEntry.updateMany({
        where: { listId, rank: { gte: fromRank + 1, lte: toRank } },
        data: { rank: { decrement: 1 } },
      });
    }

    return tx.rankingEntry.update({
      where: { id: entryId },
      data: {
        rank: toRank,
        movement: toRank < fromRank ? "up" : "down",
        delta: Math.abs(fromRank - toRank),
      },
    });
  });
}

export async function removeEntry(
  listId: string,
  entryId: string,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const entry = await tx.rankingEntry.findUnique({ where: { id: entryId } });
    if (!entry || entry.listId !== listId) {
      throw HttpError.notFound("Entry not found in this list");
    }

    await tx.rankingEntry.delete({ where: { id: entryId } });
    await tx.rankingEntry.updateMany({
      where: { listId, rank: { gt: entry.rank } },
      data: { rank: { decrement: 1 } },
    });
  });
}

/** Ordered hydration — entries + objects, cheapest query for list detail views. */
export async function readList(listId: string) {
  const list = await prisma.rankingList.findUnique({
    where: { id: listId },
    include: {
      owner: {
        select: {
          id: true,
          handle: true,
          displayName: true,
          avatarUrl: true,
        },
      },
      entries: {
        orderBy: { rank: "asc" },
        include: { object: true },
      },
      _count: { select: { entries: true, posts: true } },
    },
  });
  if (!list) throw HttpError.notFound("Ranking list not found");
  return list;
}

/**
 * Sanity helper: asserts that a list has no rank gaps or duplicates.
 * Not called in hot paths — use in tests or a periodic integrity check.
 */
export async function assertContiguous(listId: string) {
  const ranks: Array<{ rank: number }> = await prisma.$queryRaw(
    Prisma.sql`SELECT "rank" FROM "ranking_entries" WHERE "listId" = ${listId} ORDER BY "rank" ASC`,
  );
  ranks.forEach((row, i) => {
    if (row.rank !== i + 1) {
      throw new Error(
        `Ranking list ${listId} has a gap at position ${i + 1} (found rank=${row.rank})`,
      );
    }
  });
}
