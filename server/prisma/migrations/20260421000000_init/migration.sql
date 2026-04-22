-- Zoe initial schema.
-- Mirrors prisma/schema.prisma. tsvector columns are created as GENERATED
-- STORED columns backed by GIN indexes so full-text queries stay fast.

-- ========== Helpers ==========

-- `to_tsvector(regconfig, text)` is STABLE (its behaviour can change if
-- dictionaries are updated), so Postgres rejects it inside a GENERATED
-- STORED expression. plpgsql functions are never inlined by the planner,
-- so a plpgsql IMMUTABLE wrapper is the widely-used workaround. We never
-- live-patch the 'english' dictionary, so this is safe.
CREATE OR REPLACE FUNCTION zoe_english_tsv(txt text) RETURNS tsvector
  LANGUAGE plpgsql IMMUTABLE PARALLEL SAFE
  AS $$
    BEGIN
      RETURN to_tsvector('english'::regconfig, coalesce(txt, ''));
    END;
  $$;

-- `array_to_string` is STABLE, which would contaminate a generated expression.
-- Hide it inside an IMMUTABLE plpgsql wrapper so the outer expression stays
-- immutable (plpgsql is never inlined, so the declaration is honoured).
CREATE OR REPLACE FUNCTION zoe_english_tsv_arr(arr text[]) RETURNS tsvector
  LANGUAGE plpgsql IMMUTABLE PARALLEL SAFE
  AS $$
    BEGIN
      RETURN to_tsvector(
        'english'::regconfig,
        coalesce(array_to_string(arr, ' '), '')
      );
    END;
  $$;

-- ========== Enums ==========

CREATE TYPE "ObjectType" AS ENUM (
  'place', 'restaurant', 'cafe', 'bar', 'perfume',
  'album', 'fashion', 'sneaker', 'product'
);

CREATE TYPE "PostType" AS ENUM ('photo', 'carousel', 'short_video');

CREATE TYPE "DetailLayout" AS ENUM (
  'discovery_photo', 'album_review', 'product_hero'
);

CREATE TYPE "ListVisibility" AS ENUM ('public', 'followers', 'private');

CREATE TYPE "RankMovement" AS ENUM ('up', 'down', 'new', 'stable');

-- ========== Users & sessions ==========

CREATE TABLE "users" (
  "id"           TEXT NOT NULL PRIMARY KEY,
  "email"        TEXT NOT NULL,
  "handle"       TEXT NOT NULL,
  "displayName"  TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "avatarUrl"    TEXT,
  "bio"          TEXT,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL
);
CREATE UNIQUE INDEX "users_email_key"  ON "users"("email");
CREATE UNIQUE INDEX "users_handle_key" ON "users"("handle");

CREATE TABLE "sessions" (
  "id"         TEXT NOT NULL PRIMARY KEY,
  "tokenHash"  TEXT NOT NULL,
  "userId"     TEXT NOT NULL,
  "expiresAt"  TIMESTAMP(3) NOT NULL,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "userAgent"  TEXT,
  "ipAddress"  TEXT,
  CONSTRAINT "sessions_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX "sessions_tokenHash_key" ON "sessions"("tokenHash");
CREATE INDEX "sessions_userId_idx"    ON "sessions"("userId");
CREATE INDEX "sessions_expiresAt_idx" ON "sessions"("expiresAt");

-- ========== Catalog ==========

CREATE TABLE "objects" (
  "id"              TEXT NOT NULL PRIMARY KEY,
  "type"            "ObjectType" NOT NULL,
  "title"           TEXT NOT NULL,
  "subtitle"        TEXT,
  "city"            TEXT,
  "neighborhood"    TEXT,
  "tags"            TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "shortDescriptor" TEXT,
  "heroImage"       TEXT,
  "metadata"        JSONB,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "search_tsv"      tsvector GENERATED ALWAYS AS (
    setweight(zoe_english_tsv("title"),                          'A') ||
    setweight(zoe_english_tsv("subtitle"),                       'B') ||
    setweight(zoe_english_tsv("city"),                           'B') ||
    setweight(zoe_english_tsv("neighborhood"),                   'C') ||
    setweight(zoe_english_tsv("shortDescriptor"),                'C') ||
    setweight(zoe_english_tsv_arr("tags"),                       'D')
  ) STORED
);
CREATE INDEX "objects_type_idx" ON "objects"("type");
CREATE INDEX "objects_city_idx" ON "objects"("city");
CREATE INDEX "objects_search_idx" ON "objects" USING GIN ("search_tsv");
-- Trigram search over titles as a safety net for typos.
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX "objects_title_trgm_idx"
  ON "objects" USING GIN ("title" gin_trgm_ops);

-- ========== Ranking lists ==========

CREATE TABLE "ranking_lists" (
  "id"          TEXT NOT NULL PRIMARY KEY,
  "ownerId"     TEXT NOT NULL,
  "title"       TEXT NOT NULL,
  "category"    TEXT NOT NULL,
  "description" TEXT,
  "visibility"  "ListVisibility" NOT NULL DEFAULT 'public',
  "coverImage"  TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ranking_lists_ownerId_fkey"
    FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE
);
CREATE INDEX "ranking_lists_ownerId_idx"  ON "ranking_lists"("ownerId");
CREATE INDEX "ranking_lists_category_idx" ON "ranking_lists"("category");

CREATE TABLE "ranking_entries" (
  "id"        TEXT NOT NULL PRIMARY KEY,
  "listId"    TEXT NOT NULL,
  "objectId"  TEXT NOT NULL,
  "rank"      INTEGER NOT NULL,
  "movement"  "RankMovement" NOT NULL DEFAULT 'stable',
  "delta"     INTEGER,
  "note"      TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ranking_entries_listId_fkey"
    FOREIGN KEY ("listId") REFERENCES "ranking_lists"("id") ON DELETE CASCADE,
  CONSTRAINT "ranking_entries_objectId_fkey"
    FOREIGN KEY ("objectId") REFERENCES "objects"("id") ON DELETE RESTRICT
);
CREATE UNIQUE INDEX "ranking_entries_listId_objectId_key"
  ON "ranking_entries"("listId", "objectId");
-- `rank` uniqueness is enforced as a DEFERRABLE constraint so that a single
-- transaction can shift multiple ranks (insert/move/delete) without tripping
-- the index mid-statement. Postgres only supports DEFERRABLE on constraints,
-- not on plain indexes — hence ALTER TABLE rather than CREATE UNIQUE INDEX.
ALTER TABLE "ranking_entries"
  ADD CONSTRAINT "ranking_entries_listId_rank_key"
  UNIQUE ("listId", "rank") DEFERRABLE INITIALLY DEFERRED;
CREATE INDEX "ranking_entries_listId_idx" ON "ranking_entries"("listId");

-- ========== Posts ==========

CREATE TABLE "posts" (
  "id"              TEXT NOT NULL PRIMARY KEY,
  "authorId"        TEXT NOT NULL,
  "objectId"        TEXT NOT NULL,
  "postType"        "PostType" NOT NULL DEFAULT 'photo',
  "detailLayout"    "DetailLayout" NOT NULL DEFAULT 'discovery_photo',
  "headline"        TEXT NOT NULL,
  "caption"         TEXT NOT NULL,
  "tags"            TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "rankingListId"   TEXT,
  "rankingRank"     INTEGER,
  "rankingMovement" "RankMovement" DEFAULT 'stable',
  "rankingDelta"    INTEGER,
  "locationLabel"   TEXT,
  "aspect"          TEXT DEFAULT 'tall',
  "featured"        BOOLEAN NOT NULL DEFAULT false,
  "publishedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL,
  "search_tsv"      tsvector GENERATED ALWAYS AS (
    setweight(zoe_english_tsv("headline"),                       'A') ||
    setweight(zoe_english_tsv("caption"),                        'B') ||
    setweight(zoe_english_tsv_arr("tags"),                       'C')
  ) STORED,
  CONSTRAINT "posts_authorId_fkey"
    FOREIGN KEY ("authorId") REFERENCES "users"("id")      ON DELETE CASCADE,
  CONSTRAINT "posts_objectId_fkey"
    FOREIGN KEY ("objectId") REFERENCES "objects"("id")    ON DELETE RESTRICT,
  CONSTRAINT "posts_rankingListId_fkey"
    FOREIGN KEY ("rankingListId") REFERENCES "ranking_lists"("id") ON DELETE SET NULL
);
CREATE INDEX "posts_authorId_publishedAt_idx"
  ON "posts"("authorId", "publishedAt" DESC);
CREATE INDEX "posts_publishedAt_idx"
  ON "posts"("publishedAt" DESC);
CREATE INDEX "posts_rankingListId_idx" ON "posts"("rankingListId");
CREATE INDEX "posts_search_idx" ON "posts" USING GIN ("search_tsv");

-- ========== Social graph ==========

CREATE TABLE "follows" (
  "followerId" TEXT NOT NULL,
  "followeeId" TEXT NOT NULL,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "follows_pk" PRIMARY KEY ("followerId", "followeeId"),
  CONSTRAINT "follows_followerId_fkey"
    FOREIGN KEY ("followerId") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "follows_followeeId_fkey"
    FOREIGN KEY ("followeeId") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "follows_no_self" CHECK ("followerId" <> "followeeId")
);
CREATE INDEX "follows_followeeId_idx" ON "follows"("followeeId");

CREATE TABLE "likes" (
  "userId"    TEXT NOT NULL,
  "postId"    TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "likes_pk" PRIMARY KEY ("userId", "postId"),
  CONSTRAINT "likes_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "likes_postId_fkey"
    FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE
);
CREATE INDEX "likes_postId_idx" ON "likes"("postId");

CREATE TABLE "saves" (
  "userId"    TEXT NOT NULL,
  "postId"    TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "saves_pk" PRIMARY KEY ("userId", "postId"),
  CONSTRAINT "saves_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "saves_postId_fkey"
    FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE
);
CREATE INDEX "saves_postId_idx" ON "saves"("postId");

-- ========== Comments ==========

CREATE TABLE "comments" (
  "id"        TEXT NOT NULL PRIMARY KEY,
  "postId"    TEXT NOT NULL,
  "authorId"  TEXT NOT NULL,
  "parentId"  TEXT,
  "body"      TEXT NOT NULL,
  "likes"     INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "comments_postId_fkey"
    FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE,
  CONSTRAINT "comments_authorId_fkey"
    FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "comments_parentId_fkey"
    FOREIGN KEY ("parentId") REFERENCES "comments"("id") ON DELETE CASCADE
);
CREATE INDEX "comments_postId_createdAt_idx" ON "comments"("postId", "createdAt");
CREATE INDEX "comments_parentId_idx" ON "comments"("parentId");

-- ========== Shorts ==========

CREATE TABLE "shorts" (
  "id"              TEXT NOT NULL PRIMARY KEY,
  "authorId"        TEXT NOT NULL,
  "objectId"        TEXT NOT NULL,
  "hookLine"        TEXT NOT NULL,
  "caption"         TEXT NOT NULL,
  "audioLabel"      TEXT,
  "heroImage"       TEXT NOT NULL,
  "videoUrl"        TEXT,
  "rankingListTitle" TEXT,
  "rankingRank"      INTEGER,
  "rankingMovement"  "RankMovement" DEFAULT 'stable',
  "likes"            INTEGER NOT NULL DEFAULT 0,
  "comments"         INTEGER NOT NULL DEFAULT 0,
  "saves"            INTEGER NOT NULL DEFAULT 0,
  "publishedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "shorts_authorId_fkey"
    FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "shorts_objectId_fkey"
    FOREIGN KEY ("objectId") REFERENCES "objects"("id") ON DELETE RESTRICT
);
CREATE INDEX "shorts_authorId_publishedAt_idx"
  ON "shorts"("authorId", "publishedAt" DESC);
