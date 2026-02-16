-- AlterTable
ALTER TABLE "Food" ALTER COLUMN "measurementAmount" DROP DEFAULT,
ALTER COLUMN "measurementType" DROP DEFAULT,
ALTER COLUMN "measurementType" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "provider" TEXT DEFAULT 'credentials';
