-- CreateTable
CREATE TABLE "concern_vote" (
    "id" TEXT NOT NULL,
    "concernId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "voteType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "concern_vote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "concern_vote_userId_idx" ON "concern_vote"("userId");

-- CreateIndex
CREATE INDEX "concern_vote_concernId_idx" ON "concern_vote"("concernId");

-- CreateIndex
CREATE UNIQUE INDEX "concern_vote_concernId_userId_key" ON "concern_vote"("concernId", "userId");

-- AddForeignKey
ALTER TABLE "concern_vote" ADD CONSTRAINT "concern_vote_concernId_fkey" FOREIGN KEY ("concernId") REFERENCES "concern"("id") ON DELETE CASCADE ON UPDATE CASCADE;
