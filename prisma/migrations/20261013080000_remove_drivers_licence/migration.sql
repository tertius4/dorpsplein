-- Rybewys is uit die stelsel verwyder: 'n plaser noem dit in die beskrywing.
-- LET WEL: dit vee die bestaande waardes uit.

-- AlterTable
ALTER TABLE "JobDetails" DROP COLUMN "requiresDriversLicence";

-- AlterTable
ALTER TABLE "WorkerProfile" DROP COLUMN "driversLicence";
