-- Migration: Convert measurement string to measurementAmount and measurementType
-- Remove old measurement column, add measurementAmount and measurementType, defaulting all rows to 100 and 'weight'

ALTER TABLE "Food" DROP COLUMN IF EXISTS "measurement";
ALTER TABLE "Food" ADD COLUMN "measurementAmount" DOUBLE PRECISION NOT NULL DEFAULT 100;
ALTER TABLE "Food" ADD COLUMN "measurementType" VARCHAR(16) NOT NULL DEFAULT 'weight';
