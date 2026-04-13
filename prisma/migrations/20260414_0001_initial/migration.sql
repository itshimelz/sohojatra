-- Initial Sohojatra / Nagarik schema migration
-- Generated to match prisma/schema.prisma and the civic platform data model.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN
  CREATE TYPE "ConcernStatus" AS ENUM ('Submitted', 'UnderReview', 'Resolved', 'Rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "ProposalStatus" AS ENUM ('Pending', 'Approved', 'Rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "ResearchStatus" AS ENUM ('Open', 'UnderReview', 'Funded', 'Closed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "ModerationStatus" AS ENUM ('Pending', 'NeedsReview', 'Escalated', 'Resolved');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "NotificationChannel" AS ENUM ('Push', 'Sms', 'Email', 'InApp');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "user" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "emailVerified" BOOLEAN NOT NULL DEFAULT FALSE,
  "image" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "phoneNumber" TEXT,
  "phoneNumberVerified" BOOLEAN,
  CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "user_email_key" ON "user"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "user_phoneNumber_key" ON "user"("phoneNumber");

CREATE TABLE IF NOT EXISTS "session" (
  "id" TEXT NOT NULL,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "token" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "userId" TEXT NOT NULL,
  CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "session_token_key" ON "session"("token");
CREATE INDEX IF NOT EXISTS "session_userId_idx" ON "session"("userId");
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "account" (
  "id" TEXT NOT NULL,
  "accountId" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "accessToken" TEXT,
  "refreshToken" TEXT,
  "idToken" TEXT,
  "accessTokenExpiresAt" TIMESTAMPTZ,
  "refreshTokenExpiresAt" TIMESTAMPTZ,
  "scope" TEXT,
  "password" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "account_userId_idx" ON "account"("userId");
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "verification" (
  "id" TEXT NOT NULL,
  "identifier" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "verification_identifier_idx" ON "verification"("identifier");

CREATE TABLE IF NOT EXISTS "concern" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "status" "ConcernStatus" NOT NULL DEFAULT 'Submitted',
  "upvotes" INTEGER NOT NULL DEFAULT 0,
  "downvotes" INTEGER NOT NULL DEFAULT 0,
  "hasUpvoted" BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "authorName" TEXT NOT NULL,
  "locationLat" DOUBLE PRECISION NOT NULL,
  "locationLng" DOUBLE PRECISION NOT NULL,
  "location" TEXT,
  "photos" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "updates" JSONB NOT NULL DEFAULT '[]'::jsonb,
  CONSTRAINT "concern_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "concern_status_createdAt_idx" ON "concern"("status", "createdAt" DESC);

CREATE TABLE IF NOT EXISTS "proposal" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "authorName" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "votes" INTEGER NOT NULL DEFAULT 0,
  "downvotes" INTEGER NOT NULL DEFAULT 0,
  "status" "ProposalStatus" NOT NULL DEFAULT 'Pending',
  "aiPriorityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "concernId" TEXT,
  CONSTRAINT "proposal_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "proposal_status_createdAt_idx" ON "proposal"("status", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "proposal_concernId_idx" ON "proposal"("concernId");
ALTER TABLE "proposal" ADD CONSTRAINT "proposal_concernId_fkey"
  FOREIGN KEY ("concernId") REFERENCES "concern"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "comment" (
  "id" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "authorName" TEXT NOT NULL,
  "aiPriorityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "upvotes" INTEGER NOT NULL DEFAULT 0,
  "downvotes" INTEGER NOT NULL DEFAULT 0,
  "quoted" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "proposalId" TEXT,
  "concernId" TEXT,
  "parentCommentId" TEXT,
  CONSTRAINT "comment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "comment_proposalId_createdAt_idx" ON "comment"("proposalId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "comment_concernId_createdAt_idx" ON "comment"("concernId", "createdAt" DESC);
ALTER TABLE "comment" ADD CONSTRAINT "comment_proposalId_fkey"
  FOREIGN KEY ("proposalId") REFERENCES "proposal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "comment" ADD CONSTRAINT "comment_concernId_fkey"
  FOREIGN KEY ("concernId") REFERENCES "concern"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "comment" ADD CONSTRAINT "comment_parentCommentId_fkey"
  FOREIGN KEY ("parentCommentId") REFERENCES "comment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "award" (
  "id" TEXT NOT NULL,
  "commentId" TEXT,
  "proposalId" TEXT,
  "awardType" TEXT NOT NULL,
  "givenBy" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "award_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "award_commentId_idx" ON "award"("commentId");
CREATE INDEX IF NOT EXISTS "award_proposalId_idx" ON "award"("proposalId");
ALTER TABLE "award" ADD CONSTRAINT "award_commentId_fkey"
  FOREIGN KEY ("commentId") REFERENCES "comment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "award" ADD CONSTRAINT "award_proposalId_fkey"
  FOREIGN KEY ("proposalId") REFERENCES "proposal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "research_problem" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "ministry" TEXT NOT NULL,
  "grantAmount" TEXT NOT NULL,
  "deadline" TEXT NOT NULL,
  "status" "ResearchStatus" NOT NULL DEFAULT 'Open',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "research_problem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "research_problem_status_createdAt_idx" ON "research_problem"("status", "createdAt" DESC);

CREATE TABLE IF NOT EXISTS "grant_application" (
  "id" TEXT NOT NULL,
  "researcherName" TEXT NOT NULL,
  "institution" TEXT NOT NULL,
  "proposalText" TEXT NOT NULL,
  "panelScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'submitted',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "researchProblemId" TEXT NOT NULL,
  CONSTRAINT "grant_application_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "grant_application_researchProblemId_idx" ON "grant_application"("researchProblemId");
ALTER TABLE "grant_application" ADD CONSTRAINT "grant_application_researchProblemId_fkey"
  FOREIGN KEY ("researchProblemId") REFERENCES "research_problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "milestone" (
  "id" TEXT NOT NULL,
  "grantApplicationId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "dueDate" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "deliverableUrl" TEXT,
  "paymentAmount" TEXT,
  "paidAt" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "milestone_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "milestone_grantApplicationId_idx" ON "milestone"("grantApplicationId");
ALTER TABLE "milestone" ADD CONSTRAINT "milestone_grantApplicationId_fkey"
  FOREIGN KEY ("grantApplicationId") REFERENCES "grant_application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "assembly_event" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "location" TEXT NOT NULL,
  "agenda" TEXT,
  "eventTime" TEXT NOT NULL,
  "minutesUrl" TEXT,
  "organizedBy" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "assembly_event_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "notification" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "concernId" TEXT,
  "message" TEXT NOT NULL,
  "channel" "NotificationChannel" NOT NULL,
  "isRead" BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "notification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "notification_userId_isRead_idx" ON "notification"("userId", "isRead");

CREATE TABLE IF NOT EXISTS "moderation_flag" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "severity" TEXT NOT NULL,
  "status" "ModerationStatus" NOT NULL DEFAULT 'Pending',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "moderation_flag_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "moderation_flag_status_severity_idx" ON "moderation_flag"("status", "severity");

CREATE TABLE IF NOT EXISTS "ai_analysis_result" (
  "id" TEXT NOT NULL,
  "concernId" TEXT NOT NULL,
  "sentimentScore" DOUBLE PRECISION NOT NULL,
  "urgencyScore" DOUBLE PRECISION NOT NULL,
  "categoryTags" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "crimeFlags" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "analyzedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "ai_analysis_result_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ai_analysis_result_concernId_analyzedAt_idx" ON "ai_analysis_result"("concernId", "analyzedAt" DESC);
ALTER TABLE "ai_analysis_result" ADD CONSTRAINT "ai_analysis_result_concernId_fkey"
  FOREIGN KEY ("concernId") REFERENCES "concern"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill-safe indexes for auth tables
CREATE INDEX IF NOT EXISTS "user_createdAt_idx" ON "user"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS "account_providerId_idx" ON "account"("providerId");

