-- Prisma migration: add nullable unique public matchId to Match table
-- Safe/idempotent DDL for Postgres

-- 1) Add the column if it doesn't exist
ALTER TABLE "Match" ADD COLUMN IF NOT EXISTS "matchId" VARCHAR(8);

-- 2) Ensure a unique index exists (Postgres allows multiple NULLs)
CREATE UNIQUE INDEX IF NOT EXISTS "Match_matchId_key" ON "Match" ("matchId");
