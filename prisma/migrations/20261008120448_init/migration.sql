-- CreateEnum
CREATE TYPE "ListingKind" AS ENUM ('JOB');

-- CreateTable
CREATE TABLE "Category" (
    "id" SERIAL NOT NULL,
    "kind" "ListingKind" NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_kind_name_key" ON "Category"("kind", "name");
