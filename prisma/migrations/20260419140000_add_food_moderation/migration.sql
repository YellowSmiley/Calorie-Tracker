-- Add food moderation fields and report tracking
ALTER TABLE "Food"
  ADD COLUMN "isApproved" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "approvedBy" TEXT,
  ADD COLUMN "approvedAt" TIMESTAMP(3);

ALTER TABLE "Food"
  ADD CONSTRAINT "Food_approvedBy_fkey"
  FOREIGN KEY ("approvedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "FoodReport" (
  "id" TEXT NOT NULL,
  "foodId" TEXT NOT NULL,
  "reportedBy" TEXT NOT NULL,
  "reason" VARCHAR(250),
  "isResolved" BOOLEAN NOT NULL DEFAULT false,
  "resolvedBy" TEXT,
  "resolvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FoodReport_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "FoodReport"
  ADD CONSTRAINT "FoodReport_foodId_fkey"
  FOREIGN KEY ("foodId") REFERENCES "Food"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FoodReport"
  ADD CONSTRAINT "FoodReport_reportedBy_fkey"
  FOREIGN KEY ("reportedBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FoodReport"
  ADD CONSTRAINT "FoodReport_resolvedBy_fkey"
  FOREIGN KEY ("resolvedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "FoodReport_foodId_isResolved_idx" ON "FoodReport"("foodId", "isResolved");
CREATE INDEX "FoodReport_reportedBy_isResolved_idx" ON "FoodReport"("reportedBy", "isResolved");
