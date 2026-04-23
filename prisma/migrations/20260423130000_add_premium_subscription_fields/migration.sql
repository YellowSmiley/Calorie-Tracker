-- AlterTable
ALTER TABLE "User"
ADD COLUMN "isPremium" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "premiumExpiresAt" TIMESTAMP(3),
ADD COLUMN "stripeCustomerId" VARCHAR(255),
ADD COLUMN "stripeSubscriptionId" VARCHAR(255),
ADD COLUMN "stripePriceId" VARCHAR(255),
ADD COLUMN "subscriptionStatus" VARCHAR(64);

-- CreateIndex
CREATE UNIQUE INDEX "User_stripeCustomerId_key" ON "User"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "User_stripeSubscriptionId_key" ON "User"("stripeSubscriptionId");
