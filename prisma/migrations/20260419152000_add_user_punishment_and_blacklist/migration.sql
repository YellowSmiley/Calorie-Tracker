-- Add user punishment/ban fields
ALTER TABLE "User"
  ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "blackMarks" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "bannedAt" TIMESTAMP(3),
  ADD COLUMN "lastKnownIp" VARCHAR(64);

-- Add blacklist entries table for banned email/ip
CREATE TABLE "BlacklistEntry" (
  "id" TEXT NOT NULL,
  "entryType" VARCHAR(16) NOT NULL,
  "value" VARCHAR(255) NOT NULL,
  "reason" VARCHAR(255),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BlacklistEntry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BlacklistEntry_entryType_value_key" ON "BlacklistEntry"("entryType", "value");
CREATE INDEX "BlacklistEntry_value_idx" ON "BlacklistEntry"("value");
