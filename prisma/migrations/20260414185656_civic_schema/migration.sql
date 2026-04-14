-- CreateEnum
CREATE TYPE "ConcernStatus" AS ENUM ('Submitted', 'UnderReview', 'Resolved', 'Rejected');

-- CreateEnum
CREATE TYPE "ProposalStatus" AS ENUM ('Pending', 'Approved', 'Rejected');

-- CreateEnum
CREATE TYPE "ResearchStatus" AS ENUM ('Open', 'UnderReview', 'Funded', 'Closed');

-- CreateEnum
CREATE TYPE "ModerationStatus" AS ENUM ('Pending', 'NeedsReview', 'Escalated', 'Resolved');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('Push', 'Sms', 'Email', 'InApp');

-- CreateTable
CREATE TABLE "concern" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "ConcernStatus" NOT NULL DEFAULT 'Submitted',
    "upvotes" INTEGER NOT NULL DEFAULT 0,
    "downvotes" INTEGER NOT NULL DEFAULT 0,
    "hasUpvoted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "authorName" TEXT NOT NULL,
    "locationLat" DOUBLE PRECISION NOT NULL,
    "locationLng" DOUBLE PRECISION NOT NULL,
    "location" TEXT,
    "photos" JSONB NOT NULL,
    "updates" JSONB NOT NULL,

    CONSTRAINT "concern_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proposal" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "votes" INTEGER NOT NULL DEFAULT 0,
    "downvotes" INTEGER NOT NULL DEFAULT 0,
    "status" "ProposalStatus" NOT NULL DEFAULT 'Pending',
    "aiPriorityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "concernId" TEXT,

    CONSTRAINT "proposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comment" (
    "id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "aiPriorityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "upvotes" INTEGER NOT NULL DEFAULT 0,
    "downvotes" INTEGER NOT NULL DEFAULT 0,
    "quoted" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "proposalId" TEXT,
    "concernId" TEXT,
    "parentCommentId" TEXT,

    CONSTRAINT "comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "award" (
    "id" TEXT NOT NULL,
    "commentId" TEXT,
    "proposalId" TEXT,
    "awardType" TEXT NOT NULL,
    "givenBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "award_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "research_problem" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "ministry" TEXT NOT NULL,
    "grantAmount" TEXT NOT NULL,
    "deadline" TEXT NOT NULL,
    "status" "ResearchStatus" NOT NULL DEFAULT 'Open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "research_problem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grant_application" (
    "id" TEXT NOT NULL,
    "researcherName" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "proposalText" TEXT NOT NULL,
    "panelScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'submitted',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "researchProblemId" TEXT NOT NULL,

    CONSTRAINT "grant_application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "milestone" (
    "id" TEXT NOT NULL,
    "grantApplicationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "dueDate" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "deliverableUrl" TEXT,
    "paymentAmount" TEXT,
    "paidAt" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "milestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assembly_event" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "agenda" TEXT,
    "eventTime" TEXT NOT NULL,
    "minutesUrl" TEXT,
    "organizedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assembly_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "concernId" TEXT,
    "message" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moderation_flag" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "status" "ModerationStatus" NOT NULL DEFAULT 'Pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "moderation_flag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_analysis_result" (
    "id" TEXT NOT NULL,
    "concernId" TEXT NOT NULL,
    "sentimentScore" DOUBLE PRECISION NOT NULL,
    "urgencyScore" DOUBLE PRECISION NOT NULL,
    "categoryTags" JSONB NOT NULL,
    "crimeFlags" JSONB NOT NULL,
    "analyzedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_analysis_result_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "concern_status_createdAt_idx" ON "concern"("status", "createdAt");

-- CreateIndex
CREATE INDEX "proposal_status_createdAt_idx" ON "proposal"("status", "createdAt");

-- CreateIndex
CREATE INDEX "proposal_concernId_idx" ON "proposal"("concernId");

-- CreateIndex
CREATE INDEX "comment_proposalId_createdAt_idx" ON "comment"("proposalId", "createdAt");

-- CreateIndex
CREATE INDEX "comment_concernId_createdAt_idx" ON "comment"("concernId", "createdAt");

-- CreateIndex
CREATE INDEX "award_commentId_idx" ON "award"("commentId");

-- CreateIndex
CREATE INDEX "award_proposalId_idx" ON "award"("proposalId");

-- CreateIndex
CREATE INDEX "research_problem_status_createdAt_idx" ON "research_problem"("status", "createdAt");

-- CreateIndex
CREATE INDEX "grant_application_researchProblemId_idx" ON "grant_application"("researchProblemId");

-- CreateIndex
CREATE INDEX "milestone_grantApplicationId_idx" ON "milestone"("grantApplicationId");

-- CreateIndex
CREATE INDEX "notification_userId_isRead_idx" ON "notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "moderation_flag_status_severity_idx" ON "moderation_flag"("status", "severity");

-- CreateIndex
CREATE INDEX "ai_analysis_result_concernId_analyzedAt_idx" ON "ai_analysis_result"("concernId", "analyzedAt");

-- AddForeignKey
ALTER TABLE "proposal" ADD CONSTRAINT "proposal_concernId_fkey" FOREIGN KEY ("concernId") REFERENCES "concern"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment" ADD CONSTRAINT "comment_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "proposal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment" ADD CONSTRAINT "comment_concernId_fkey" FOREIGN KEY ("concernId") REFERENCES "concern"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment" ADD CONSTRAINT "comment_parentCommentId_fkey" FOREIGN KEY ("parentCommentId") REFERENCES "comment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "award" ADD CONSTRAINT "award_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "comment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "award" ADD CONSTRAINT "award_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "proposal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grant_application" ADD CONSTRAINT "grant_application_researchProblemId_fkey" FOREIGN KEY ("researchProblemId") REFERENCES "research_problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "milestone" ADD CONSTRAINT "milestone_grantApplicationId_fkey" FOREIGN KEY ("grantApplicationId") REFERENCES "grant_application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_analysis_result" ADD CONSTRAINT "ai_analysis_result_concernId_fkey" FOREIGN KEY ("concernId") REFERENCES "concern"("id") ON DELETE CASCADE ON UPDATE CASCADE;
