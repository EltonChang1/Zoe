-- Shorts engagement: per-user like/save and a dedicated comment table.
--
-- Replaces the denormalised counters (`shorts.likes`, `shorts.saves`,
-- `shorts.comments`) with authoritative relations. The counters are dropped
-- at the end of this migration; callers now derive counts via Prisma's
-- `_count` selector like Posts do.

-- ========== short_likes ==========

CREATE TABLE "short_likes" (
  "userId"    TEXT NOT NULL,
  "shortId"   TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "short_likes_pk" PRIMARY KEY ("userId", "shortId"),
  CONSTRAINT "short_likes_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "short_likes_shortId_fkey"
    FOREIGN KEY ("shortId") REFERENCES "shorts"("id") ON DELETE CASCADE
);
CREATE INDEX "short_likes_shortId_idx" ON "short_likes"("shortId");

-- ========== short_saves ==========

CREATE TABLE "short_saves" (
  "userId"    TEXT NOT NULL,
  "shortId"   TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "short_saves_pk" PRIMARY KEY ("userId", "shortId"),
  CONSTRAINT "short_saves_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "short_saves_shortId_fkey"
    FOREIGN KEY ("shortId") REFERENCES "shorts"("id") ON DELETE CASCADE
);
CREATE INDEX "short_saves_shortId_idx" ON "short_saves"("shortId");

-- ========== short_comments ==========

CREATE TABLE "short_comments" (
  "id"        TEXT NOT NULL PRIMARY KEY,
  "shortId"   TEXT NOT NULL,
  "authorId"  TEXT NOT NULL,
  "parentId"  TEXT,
  "body"      TEXT NOT NULL,
  "likes"     INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "short_comments_shortId_fkey"
    FOREIGN KEY ("shortId") REFERENCES "shorts"("id") ON DELETE CASCADE,
  CONSTRAINT "short_comments_authorId_fkey"
    FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "short_comments_parentId_fkey"
    FOREIGN KEY ("parentId") REFERENCES "short_comments"("id") ON DELETE CASCADE
);
CREATE INDEX "short_comments_shortId_createdAt_idx"
  ON "short_comments"("shortId", "createdAt");
CREATE INDEX "short_comments_parentId_idx"
  ON "short_comments"("parentId");

-- ========== indexes / drops on shorts ==========

CREATE INDEX "shorts_publishedAt_idx" ON "shorts"("publishedAt" DESC);

-- Denormalised counters are no longer the source of truth.
ALTER TABLE "shorts" DROP COLUMN "likes";
ALTER TABLE "shorts" DROP COLUMN "saves";
ALTER TABLE "shorts" DROP COLUMN "comments";
