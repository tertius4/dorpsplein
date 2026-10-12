-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('OPEN', 'CLOSED', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Listing" (
    "id" TEXT NOT NULL,
    "kind" "ListingKind" NOT NULL,
    "ownerId" TEXT NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "description" VARCHAR(2000),
    "price" VARCHAR(100),
    "capacity" INTEGER NOT NULL DEFAULT 1,
    "location" VARCHAR(120),
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "closesAt" TIMESTAMP(3),
    "status" "ListingStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Listing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobDetails" (
    "listingId" TEXT NOT NULL,
    "jobType" "JobType" NOT NULL,
    "requiresDriversLicence" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "JobDetails_pkey" PRIMARY KEY ("listingId")
);

-- CreateTable
CREATE TABLE "ProcessedRequest" (
    "requestId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "result" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProcessedRequest_pkey" PRIMARY KEY ("requestId")
);

-- CreateIndex
CREATE INDEX "Listing_status_kind_categoryId_idx" ON "Listing"("status", "kind", "categoryId");

-- CreateIndex
CREATE INDEX "Listing_status_createdAt_idx" ON "Listing"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Listing_ownerId_status_idx" ON "Listing"("ownerId", "status");

-- CreateIndex
CREATE INDEX "JobDetails_jobType_idx" ON "JobDetails"("jobType");

-- CreateIndex
CREATE INDEX "ProcessedRequest_userId_createdAt_idx" ON "ProcessedRequest"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobDetails" ADD CONSTRAINT "JobDetails_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessedRequest" ADD CONSTRAINT "ProcessedRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Prisma kan CHECK-beperkings nie uitdruk nie
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_capacity_positive" CHECK ("capacity" >= 1);
