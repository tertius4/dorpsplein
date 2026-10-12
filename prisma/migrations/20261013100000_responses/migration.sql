-- CreateEnum
CREATE TYPE "ResponseStatus" AS ENUM ('INTERESTED', 'WITHDRAWN', 'ACCEPTED', 'DECLINED');

-- CreateTable
CREATE TABLE "Response" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "responderId" TEXT NOT NULL,
    "status" "ResponseStatus" NOT NULL DEFAULT 'INTERESTED',
    "note" VARCHAR(300),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Response_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Response_responderId_status_idx" ON "Response"("responderId", "status");

-- CreateIndex
CREATE INDEX "Response_listingId_status_idx" ON "Response"("listingId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Response_listingId_responderId_key" ON "Response"("listingId", "responderId");

-- AddForeignKey
ALTER TABLE "Response" ADD CONSTRAINT "Response_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Response" ADD CONSTRAINT "Response_responderId_fkey" FOREIGN KEY ("responderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
