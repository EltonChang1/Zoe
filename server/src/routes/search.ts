import { Hono } from "hono";
import { Prisma } from "@prisma/client";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

import { prisma } from "../db.js";
import {
  currentUser,
  optionalAuth,
  requireAuth,
  type AuthVariables,
} from "../auth/middleware.js";
import { idParam } from "../http/validate.js";
import { getHiddenUserIds } from "../lib/moderation.js";
import {
  inferSearchCategory,
  rememberSearch,
  SUGGESTED_SEARCH_PROMPTS,
  normalizeSearchQuery,
} from "../lib/personalization.js";

/**
 * Full-text search over the two GIN-indexed tsvector columns.
 * We parse the query as `plainto_tsquery` (safe against ops) and rank with
 * `ts_rank_cd`. A trigram fallback catches typos on short queries.
 */

const searchSchema = z.object({
  q: z.string().min(1).max(80),
  type: z
    .enum(["all", "objects", "posts", "users", "lists"])
    .default("all"),
  limit: z.coerce.number().int().min(1).max(25).default(10),
});

const searchEventSchema = z.object({
  query: z.string().min(1).max(80),
  resultType: z.enum(["object", "post", "user", "list", "google_place", "prompt"]).optional(),
  resultId: z.string().max(160).optional(),
});

const followSearchSchema = z.object({
  query: z.string().min(1).max(80),
});

interface ObjectRow {
  id: string;
  type: string;
  title: string;
  subtitle: string | null;
  city: string | null;
  heroImage: string | null;
  rank: number;
}
interface PostRow {
  id: string;
  headline: string;
  caption: string;
  authorId: string;
  objectId: string | null;
  rank: number;
}
interface UserRow {
  id: string;
  handle: string;
  displayName: string;
  avatarUrl: string | null;
}
interface ListRow {
  id: string;
  title: string;
  category: string;
  description: string | null;
  coverImage: string | null;
  owner: UserRow;
  entries: number;
}

export const searchRouter = new Hono<{ Variables: AuthVariables }>()
  .get("/suggestions", optionalAuth, async (c) => {
    const viewer = c.var.user;
    const cityId = viewer?.preferredCityId ?? viewer?.homeCityId ?? null;
    const [recent, followed, trending] = viewer
      ? await Promise.all([
          prisma.recentSearch.findMany({
            where: { userId: viewer.id },
            orderBy: { updatedAt: "desc" },
            take: 8,
          }),
          prisma.followedSearch.findMany({
            where: { userId: viewer.id },
            orderBy: { updatedAt: "desc" },
            take: 8,
          }),
          prisma.cityRankingEntry.findMany({
            where: cityId ? { cityRankingList: { cityId } } : undefined,
            orderBy: [{ citytasteScore: "desc" }, { updatedAt: "desc" }],
            take: 6,
            include: {
              object: { select: { id: true, title: true, type: true, city: true } },
              cityRankingList: { select: { title: true } },
            },
          }),
        ])
      : [[], [], []];

    return c.json({
      prompts: SUGGESTED_SEARCH_PROMPTS,
      recent,
      followed,
      trending: trending.map((entry) => ({
        id: entry.objectId,
        title: entry.object.title,
        type: entry.object.type,
        city: entry.object.city,
        rank: entry.rank,
        listTitle: entry.cityRankingList.title,
      })),
    });
  })
  .get("/followed", requireAuth, async (c) => {
    const me = currentUser(c);
    const followed = await prisma.followedSearch.findMany({
      where: { userId: me.id },
      orderBy: { updatedAt: "desc" },
      take: 50,
    });
    return c.json({ followed });
  })
  .post(
    "/followed",
    requireAuth,
    zValidator("json", followSearchSchema),
    async (c) => {
      const me = currentUser(c);
      const { query } = c.req.valid("json");
      const normalizedQuery = normalizeSearchQuery(query);
      const followed = await prisma.followedSearch.upsert({
        where: {
          userId_normalizedQuery: { userId: me.id, normalizedQuery },
        },
        create: {
          userId: me.id,
          query: query.trim(),
          normalizedQuery,
          inferredCategory: inferSearchCategory(query),
        },
        update: {
          query: query.trim(),
          inferredCategory: inferSearchCategory(query),
        },
      });
      return c.json({ followed }, 201);
    },
  )
  .delete(
    "/followed/:id",
    requireAuth,
    zValidator("param", z.object({ id: idParam })),
    async (c) => {
      const me = currentUser(c);
      const { id } = c.req.valid("param");
      await prisma.followedSearch
        .deleteMany({ where: { id, userId: me.id } })
        .catch(() => undefined);
      return c.json({ ok: true });
    },
  )
  .post(
    "/events",
    requireAuth,
    zValidator("json", searchEventSchema),
    async (c) => {
      const me = currentUser(c);
      const body = c.req.valid("json");
      await rememberSearch(prisma, {
        userId: me.id,
        query: body.query,
        resultType: body.resultType,
        resultId: body.resultId,
      });
      return c.json({ ok: true });
    },
  )
  .get("/", optionalAuth, zValidator("query", searchSchema), async (c) => {
    const { q, type, limit } = c.req.valid("query");
    const viewer = c.var.user;
    await rememberSearch(prisma, { userId: viewer?.id, query: q });

    // Build tsquery safely — plainto_tsquery handles all user-facing escaping.
    const tsQuery = Prisma.sql`plainto_tsquery('english', ${q})`;

    // Collapse the blocker/blockee user IDs into a SQL fragment usable
    // from each raw query. An empty set still has to produce a valid
    // `NOT IN (...)` clause, so we fall back to a sentinel that can
    // never be a real cuid.
    const hidden = await getHiddenUserIds(viewer?.id);
    const hiddenSql =
      hidden.length > 0
        ? Prisma.sql`(${Prisma.join(hidden)})`
        : Prisma.sql`('__none__')`;

    const results: {
      objects?: ObjectRow[];
      posts?: PostRow[];
      users?: UserRow[];
      lists?: ListRow[];
    } = {};

    if (type === "all" || type === "objects") {
      // Objects are catalog data, not user-authored — no block filter.
      results.objects = await prisma.$queryRaw<ObjectRow[]>(Prisma.sql`
        SELECT id, type::text AS type, title, subtitle, city, "heroImage",
               ts_rank_cd(search_tsv, ${tsQuery}) AS rank
        FROM "objects"
        WHERE search_tsv @@ ${tsQuery}
           OR title ILIKE ${"%" + q + "%"}
        ORDER BY rank DESC, "createdAt" DESC
        LIMIT ${limit}
      `);
    }

    if (type === "all" || type === "posts") {
      results.posts = await prisma.$queryRaw<PostRow[]>(Prisma.sql`
        SELECT p.id, p.headline, p.caption, p."authorId", p."objectId",
               (
                 ts_rank_cd(p.search_tsv, ${tsQuery}) +
                 COALESCE(ts_rank_cd(o.search_tsv, ${tsQuery}), 0)
               ) AS rank
        FROM "posts" p
        LEFT JOIN "objects" o ON o.id = p."objectId"
        WHERE (
            p.search_tsv @@ ${tsQuery}
            OR o.search_tsv @@ ${tsQuery}
            OR p.headline ILIKE ${"%" + q + "%"}
            OR o.title ILIKE ${"%" + q + "%"}
            OR o.city ILIKE ${"%" + q + "%"}
          )
          AND p."authorId" NOT IN ${hiddenSql}
        ORDER BY rank DESC, p."publishedAt" DESC
        LIMIT ${limit}
      `);
    }

    if (type === "all" || type === "users") {
      results.users = await prisma.$queryRaw<UserRow[]>(Prisma.sql`
        SELECT id, handle, "displayName", "avatarUrl"
        FROM "users"
        WHERE (handle ILIKE ${q + "%"}
               OR "displayName" ILIKE ${"%" + q + "%"})
          AND id NOT IN ${hiddenSql}
        ORDER BY handle ASC
        LIMIT ${limit}
      `);
    }

    if (type === "all" || type === "lists") {
      const lists = await prisma.rankingList.findMany({
        where: {
          visibility: "public",
          ownerId: { notIn: hidden },
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { category: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ],
        },
        orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
        take: limit,
        include: {
          owner: {
            select: { id: true, handle: true, displayName: true, avatarUrl: true },
          },
          _count: { select: { entries: true } },
        },
      });
      results.lists = lists.map((list) => ({
        id: list.id,
        title: list.title,
        category: list.category,
        description: list.description,
        coverImage: list.coverImage,
        owner: list.owner,
        entries: list._count.entries,
      }));
    }

    return c.json({ query: q, ...results });
  });
