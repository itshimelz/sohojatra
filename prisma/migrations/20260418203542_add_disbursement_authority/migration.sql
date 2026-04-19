-- CreateTable
CREATE TABLE "disbursement" (
    "id" TEXT NOT NULL,
    "project" TEXT NOT NULL,
    "ministry" TEXT NOT NULL,
    "amountBdt" BIGINT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "releasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "disbursement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "authority_metric" (
    "id" TEXT NOT NULL,
    "agency" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "authority_metric_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "disbursement_status_idx" ON "disbursement"("status");

-- CreateIndex
CREATE UNIQUE INDEX "authority_metric_agency_metric_key" ON "authority_metric"("agency", "metric");
