import { Hono } from "hono";
import { Prisma } from "@prisma/client";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

import { prisma } from "../db.js";

/**
 * Full-text search over the two GIN-indexed tsvector columns.
 * We parse the query as `plainto_tsquery` (safe against ops) and rank with
 * `ts_rank_cd`. A trigram fallback catches typos on short queries.
 */

const searchSchema = z.object({
  q: z.string().min(1).max(80),
  type: z
    .enum(["all", "objects", "posts", "users"])
    .default("all"),
  limit: z.coerce.number().int().min(1).max(25).default(10),
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
  objectId: string;
  rank: number;
}
interface UserRow {
  id: string;
  handle: string;
  displayName: string;
  avatarUrl: string | null;
}

export const searchRouter = new Hono().get(
  "/",
  zValidator("query", searchSchema),
  async (c) => {
    const { q, type, limit } = c.req.valid("query");

    // Build tsquery safely — plainto_tsquery handles all user-facing escaping.
    const tsQuery = Prisma.sql`plainto_tsquery('english', ${q})`;

    const results: {
      objects?: ObjectRow[];
      posts?: PostRow[];
      users?: UserRow[];
    } = {};

    if (type === "all" || type === "objects") {
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
        SELECT id, headline, caption, "authorId", "objectId",
               ts_rank_cd(search_tsv, ${tsQuery}) AS rank
        FROM "posts"
        WHERE search_tsv @@ ${tsQuery}
        ORDER BY rank DESC, "publishedAt" DESC
        LIMIT ${limit}
      `);
    }

    if (type === "all" || type === "users") {
      results.users = await prisma.$queryRaw<UserRow[]>(Prisma.sql`
        SELECT id, handle, "displayName", "avatarUrl"
        FROM "users"
        WHERE handle ILIKE ${q + "%"}
           OR "displayName" ILIKE ${"%" + q + "%"}
        ORDER BY handle ASC
        LIMIT ${limit}
      `);
    }

    return c.json({ query: q, ...results });
  },
);
