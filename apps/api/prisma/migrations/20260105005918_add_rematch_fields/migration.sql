/*
  Warnings:

  - A unique constraint covering the columns `[nextMatchId]` on the table `Match` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "RematchStatus" AS ENUM ('NONE', 'PROPOSED', 'ACCEPTED', 'REJECTED');

-- AlterEnum
ALTER TYPE "MatchStatus" ADD VALUE 'pending_acceptance';

-- AlterTable
ALTER TABLE "Match" ADD COLUMN     "nextMatchId" TEXT,
ADD COLUMN     "rematchProposedAt" TIMESTAMP(3),
ADD COLUMN     "rematchRespondedAt" TIMESTAMP(3),
ADD COLUMN     "rematchStatus" "RematchStatus" NOT NULL DEFAULT 'NONE';

-- CreateIndex
CREATE UNIQUE INDEX "Match_nextMatchId_key" ON "Match"("nextMatchId");

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_nextMatchId_fkey" FOREIGN KEY ("nextMatchId") REFERENCES "Match"("id") ON DELETE SET NULL ON UPDATE CASCADE;
