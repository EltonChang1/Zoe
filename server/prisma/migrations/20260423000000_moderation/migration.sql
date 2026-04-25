-- Moderation: blocks + reports.
--
-- Blocks hide content symmetrically across the app (feeds, search,
-- comments, notifications, profiles). Reports are write-only for end
-- users; review happens out-of-band in an ops tool.

-- Enums --------------------------------------------------------------

CREATE TYPE "ReportSubjectType" AS ENUM ('user', 'post', 'short', 'comment', 'short_comment');
CREATE TYPE "ReportReason"      AS ENUM ('spam', 'harassment', 'hate', 'sexual', 'violence', 'self_harm', 'misinformation', 'ip_violation', 'other');
CREATE TYPE "ReportStatus"      AS ENUM ('open', 'reviewed', 'actioned', 'dismissed');

-- Blocks -------------------------------------------------------------

CREATE TABLE "blocks" (
    "blockerId"  TEXT                     NOT NULL,
    "blockedId"  TEXT                     NOT NULL,
    "createdAt"  TIMESTAMP(3)             NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blocks_pkey" PRIMARY KEY ("blockerId", "blockedId")
);

ALTER TABLE "blocks"
    ADD CONSTRAINT "blocks_blockerId_fkey"
        FOREIGN KEY ("blockerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT "blocks_blockedId_fkey"
        FOREIGN KEY ("blockedId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    -- Disallow self-block. The API layer also rejects these but CHECK
    -- keeps the DB clean regardless of caller.
    ADD CONSTRAINT "blocks_no_self" CHECK ("blockerId" <> "blockedId");

CREATE INDEX "blocks_blockedId_idx" ON "blocks"("blockedId");

-- Reports ------------------------------------------------------------

CREATE TABLE "reports" (
    "id"          TEXT                 NOT NULL,
    "reporterId"  TEXT                 NOT NULL,
    "subjectType" "ReportSubjectType"  NOT NULL,
    "subjectId"   TEXT                 NOT NULL,
    "reason"      "ReportReason"       NOT NULL,
    "details"     TEXT,
    "status"      "ReportStatus"       NOT NULL DEFAULT 'open',
    "createdAt"   TIMESTAMP(3)         NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt"  TIMESTAMP(3),

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "reports"
    ADD CONSTRAINT "reports_reporterId_fkey"
        FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "reports_reporterId_idx"      ON "reports"("reporterId");
CREATE INDEX "reports_subject_idx"         ON "reports"("subjectType", "subjectId");
CREATE INDEX "reports_status_createdAt_idx" ON "reports"("status", "createdAt");
