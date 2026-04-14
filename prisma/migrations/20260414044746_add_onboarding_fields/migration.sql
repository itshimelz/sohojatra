-- AlterTable
ALTER TABLE "user" ADD COLUMN     "dob" TIMESTAMP(3),
ADD COLUMN     "education" TEXT,
ADD COLUMN     "nid" TEXT,
ADD COLUMN     "onboarded" BOOLEAN NOT NULL DEFAULT false;
