-- CreateEnum
CREATE TYPE "ConcernStatus" AS ENUM ('Submitted', 'UnderReview', 'ExpertProposed', 'GovtApproved', 'InProgress', 'Resolved', 'Rated');

-- CreateEnum
CREATE TYPE "ConcernCategory" AS ENUM ('Infrastructure', 'Health', 'Education', 'Environment', 'Corruption', 'Safety', 'Rights', 'Economy');

-- CreateEnum
CREATE TYPE "ProposalStatus" AS ENUM ('Pending', 'Approved', 'Rejected');

-- CreateEnum
CREATE TYPE "ResearchStatus" AS ENUM ('Open', 'UnderReview', 'Funded', 'Closed');

-- CreateEnum
CREATE TYPE "ModerationStatus" AS ENUM ('Pending', 'NeedsReview', 'Escalated', 'Resolved');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('Push', 'Sms', 'Email', 'InApp');

-- CreateEnum
CREATE TYPE "AwardType" AS ENUM ('ExpertTake', 'MostActionable', 'BestCited', 'LocalVoice');

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "phoneNumber" TEXT,
    "phoneNumberVerified" BOOLEAN,
    "role" TEXT NOT NULL DEFAULT 'citizen',
    "banned" BOOLEAN NOT NULL DEFAULT false,
    "banReason" TEXT,
    "banExpires" TIMESTAMP(3),
    "nidHash" TEXT,
    "passportNumber" TEXT,
    "institution" TEXT,
    "department" TEXT,
    "ministry" TEXT,
    "specialization" TEXT,
    "trustScore" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "reputationPoints" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,
    "impersonatedBy" TEXT,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "concern" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "ConcernStatus" NOT NULL DEFAULT 'Submitted',
    "category" "ConcernCategory" NOT NULL DEFAULT 'Infrastructure',
    "upvotes" INTEGER NOT NULL DEFAULT 0,
    "downvotes" INTEGER NOT NULL DEFAULT 0,
    "hasUpvoted" BOOLEAN NOT NULL DEFAULT false,
    "priorityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "urgencyScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "authorName" TEXT NOT NULL,
    "authorId" TEXT,
    "locationLat" DOUBLE PRECISION NOT NULL,
    "locationLng" DOUBLE PRECISION NOT NULL,
    "location" TEXT,
    "division" TEXT,
    "district" TEXT,
    "upazila" TEXT,
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
    "authorId" TEXT,
    "category" TEXT NOT NULL,
    "votes" INTEGER NOT NULL DEFAULT 0,
    "downvotes" INTEGER NOT NULL DEFAULT 0,
    "status" "ProposalStatus" NOT NULL DEFAULT 'Pending',
    "aiPriorityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
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
    "authorId" TEXT,
    "aiPriorityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "upvotes" INTEGER NOT NULL DEFAULT 0,
    "downvotes" INTEGER NOT NULL DEFAULT 0,
    "quoted" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "proposalId" TEXT,
    "concernId" TEXT,
    "parentCommentId" TEXT,
    "quotedCommentId" TEXT,

    CONSTRAINT "comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "award" (
    "id" TEXT NOT NULL,
    "commentId" TEXT,
    "proposalId" TEXT,
    "awardType" TEXT NOT NULL,
    "givenBy" TEXT NOT NULL,
    "givenById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "award_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vote" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "votedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "badge" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "criteria" TEXT NOT NULL,
    "iconKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "badge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "citizen_badge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "citizen_badge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "action_log" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "concernId" TEXT,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" JSONB,
    "loggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "action_log_pkey" PRIMARY KEY ("id")
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
    "releasedById" TEXT,
    "isOpen" BOOLEAN NOT NULL DEFAULT true,
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
    "applicantId" TEXT,
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
    "organizerId" TEXT,
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
    "targetType" TEXT,
    "targetId" TEXT,
    "reportedBy" TEXT,
    "reviewedBy" TEXT,
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
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_phoneNumber_key" ON "user"("phoneNumber");

-- CreateIndex
CREATE INDEX "session_userId_idx" ON "session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE INDEX "account_userId_idx" ON "account"("userId");

-- CreateIndex
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");

-- CreateIndex
CREATE INDEX "concern_status_createdAt_idx" ON "concern"("status", "createdAt");

-- CreateIndex
CREATE INDEX "concern_category_status_idx" ON "concern"("category", "status");

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
CREATE INDEX "vote_targetId_idx" ON "vote"("targetId");

-- CreateIndex
CREATE UNIQUE INDEX "vote_userId_targetType_targetId_key" ON "vote"("userId", "targetType", "targetId");

-- CreateIndex
CREATE UNIQUE INDEX "badge_name_key" ON "badge"("name");

-- CreateIndex
CREATE INDEX "citizen_badge_userId_idx" ON "citizen_badge"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "citizen_badge_userId_badgeId_key" ON "citizen_badge"("userId", "badgeId");

-- CreateIndex
CREATE INDEX "action_log_targetType_targetId_idx" ON "action_log"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "action_log_userId_idx" ON "action_log"("userId");

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
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
ALTER TABLE "vote" ADD CONSTRAINT "vote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citizen_badge" ADD CONSTRAINT "citizen_badge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citizen_badge" ADD CONSTRAINT "citizen_badge_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "badge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_log" ADD CONSTRAINT "action_log_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grant_application" ADD CONSTRAINT "grant_application_researchProblemId_fkey" FOREIGN KEY ("researchProblemId") REFERENCES "research_problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "milestone" ADD CONSTRAINT "milestone_grantApplicationId_fkey" FOREIGN KEY ("grantApplicationId") REFERENCES "grant_application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_analysis_result" ADD CONSTRAINT "ai_analysis_result_concernId_fkey" FOREIGN KEY ("concernId") REFERENCES "concern"("id") ON DELETE CASCADE ON UPDATE CASCADE;
