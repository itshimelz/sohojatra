-- AlterTable
ALTER TABLE "award" ADD COLUMN     "awardedTo" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "title" TEXT,
ADD COLUMN     "value" TEXT;

-- CreateTable
CREATE TABLE "project" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "ministry" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Planning',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "deadline" TEXT NOT NULL,
    "budgetAllocatedBdt" BIGINT NOT NULL DEFAULT 0,
    "budgetSpentBdt" BIGINT NOT NULL DEFAULT 0,
    "milestones" JSONB NOT NULL DEFAULT '[]',
    "updates" JSONB NOT NULL DEFAULT '[]',
    "followers" JSONB NOT NULL DEFAULT '[]',
    "comments" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "solution_plan" (
    "id" TEXT NOT NULL,
    "concernId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "technicalDocs" JSONB NOT NULL DEFAULT '[]',
    "budgetEstimateBdt" BIGINT NOT NULL DEFAULT 0,
    "timeline" TEXT NOT NULL,
    "riskNotes" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Submitted',
    "submittedBy" TEXT NOT NULL,
    "governmentComments" TEXT,
    "assignedDepartment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "solution_plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reputation_event" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "delta" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reputation_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "thread" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "thread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "thread_message" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "thread_message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "project_status_idx" ON "project"("status");

-- CreateIndex
CREATE INDEX "solution_plan_concernId_idx" ON "solution_plan"("concernId");

-- CreateIndex
CREATE INDEX "solution_plan_status_idx" ON "solution_plan"("status");

-- CreateIndex
CREATE INDEX "reputation_event_userId_createdAt_idx" ON "reputation_event"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "thread_message_threadId_createdAt_idx" ON "thread_message"("threadId", "createdAt");

-- AddForeignKey
ALTER TABLE "thread_message" ADD CONSTRAINT "thread_message_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "thread"("id") ON DELETE CASCADE ON UPDATE CASCADE;
