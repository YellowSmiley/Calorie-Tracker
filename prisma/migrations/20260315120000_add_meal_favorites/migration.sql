-- CreateTable
CREATE TABLE "MealFavorite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mealType" "MealType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MealFavorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MealFavoriteItem" (
    "id" TEXT NOT NULL,
    "favoriteId" TEXT NOT NULL,
    "foodId" TEXT NOT NULL,
    "serving" DOUBLE PRECISION NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MealFavoriteItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MealFavorite_userId_mealType_idx" ON "MealFavorite"("userId", "mealType");

-- CreateIndex
CREATE UNIQUE INDEX "MealFavorite_userId_name_mealType_key" ON "MealFavorite"("userId", "name", "mealType");

-- CreateIndex
CREATE INDEX "MealFavoriteItem_favoriteId_idx" ON "MealFavoriteItem"("favoriteId");

-- CreateIndex
CREATE INDEX "MealFavoriteItem_foodId_idx" ON "MealFavoriteItem"("foodId");

-- AddForeignKey
ALTER TABLE "MealFavorite" ADD CONSTRAINT "MealFavorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealFavoriteItem" ADD CONSTRAINT "MealFavoriteItem_favoriteId_fkey" FOREIGN KEY ("favoriteId") REFERENCES "MealFavorite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealFavoriteItem" ADD CONSTRAINT "MealFavoriteItem_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food"("id") ON DELETE CASCADE ON UPDATE CASCADE;
