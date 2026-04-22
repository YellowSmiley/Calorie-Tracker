import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { MeasurementType } from "@/app/diary/types";
import { Prisma } from "@prisma/client";
import { requireUser } from "@/lib/apiGuards";
import {
  apiBadRequest,
  apiNotFound,
  apiServiceUnavailable,
  apiSuccess,
  apiTooManyRequests,
} from "@/lib/apiResponse";
import { mealFavoriteApplyBodySchema } from "@/lib/apiSchemas";
import { checkMealFavoritesWriteRateLimit } from "@/lib/rateLimit";

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

type MealFavoriteWithItems = Prisma.MealFavoriteGetPayload<{
  include: {
    items: {
      include: { food: true };
      orderBy: { sortOrder: "asc" };
    };
  };
}>;

type MealFavoriteDelegate = {
  findFirst: (
    args: Prisma.MealFavoriteFindFirstArgs,
  ) => Promise<MealFavoriteWithItems | null>;
};

const getDateRange = (dateString: string) => {
  if (!DATE_REGEX.test(dateString)) {
    throw new Error("Invalid date format");
  }

  const baseDate = new Date(`${dateString}T00:00:00`);
  if (isNaN(baseDate.getTime())) {
    throw new Error("Invalid date");
  }

  const start = new Date(baseDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(baseDate);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

export async function POST(request: NextRequest) {
  const guard = await requireUser();
  if ("response" in guard) {
    return guard.response;
  }
  const { user } = guard;

  const allowed = await checkMealFavoritesWriteRateLimit(user.id);
  if (!allowed) {
    return apiTooManyRequests();
  }

  const body = await request.json();
  const parsedBody = mealFavoriteApplyBodySchema.safeParse(body);
  if (!parsedBody.success) {
    return apiBadRequest("Invalid request payload", "VALIDATION_ERROR", {
      issues: parsedBody.error.issues,
    });
  }

  const mealFavorite = (
    prisma as unknown as { mealFavorite?: MealFavoriteDelegate }
  ).mealFavorite;
  if (!mealFavorite) {
    return apiServiceUnavailable(
      "Meal favorites are not available yet. Run prisma generate and restart the dev server.",
      "MEAL_FAVORITES_UNAVAILABLE",
    );
  }

  const { favoriteId, date, mealType: targetMealType } = parsedBody.data;

  let start: Date;
  let end: Date;
  try {
    ({ start, end } = getDateRange(date));
  } catch {
    return apiBadRequest("Invalid date format", "INVALID_DATE");
  }

  const favorite = await mealFavorite.findFirst({
    where: {
      id: favoriteId,
      userId: user.id,
    },
    include: {
      items: {
        include: { food: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!favorite) {
    return apiNotFound("Favorite not found", "FAVORITE_NOT_FOUND");
  }

  if (favorite.items.length === 0) {
    return apiBadRequest("Favorite has no items", "EMPTY_FAVORITE");
  }

  const mealType = targetMealType ?? favorite.mealType;

  await prisma.$transaction(async (tx) => {
    await tx.mealEntry.deleteMany({
      where: {
        userId: user.id,
        mealType,
        date: {
          gte: start,
          lte: end,
        },
      },
    });

    await tx.mealEntry.createMany({
      data: favorite.items.map(
        (item: MealFavoriteWithItems["items"][number]) => ({
          userId: user.id,
          foodId: item.foodId,
          mealType,
          date: start,
          serving: item.serving,
          calories: Number((item.food.calories * item.serving).toFixed(1)),
          protein: Number((item.food.protein * item.serving).toFixed(1)),
          carbs: Number((item.food.carbs * item.serving).toFixed(1)),
          fat: Number((item.food.fat * item.serving).toFixed(1)),
          saturates: Number((item.food.saturates * item.serving).toFixed(1)),
          sugars: Number((item.food.sugars * item.serving).toFixed(1)),
          fibre: Number((item.food.fibre * item.serving).toFixed(1)),
          salt: Number((item.food.salt * item.serving).toFixed(1)),
        }),
      ),
    });

    await tx.mealFavorite.update({
      where: { id: favorite.id },
      data: {
        usageCount: {
          increment: 1,
        },
      },
    });
  });

  const updatedEntries = await prisma.mealEntry.findMany({
    where: {
      userId: user.id,
      mealType,
      date: {
        gte: start,
        lte: end,
      },
    },
    include: { food: true },
    orderBy: { createdAt: "asc" },
  });

  return apiSuccess({
    mealType,
    items: updatedEntries.map((entry) => ({
      id: entry.id,
      name: entry.food.name,
      measurementAmount: entry.food.measurementAmount,
      measurementType: entry.food.measurementType as MeasurementType,
      calories: entry.calories,
      baseCalories: entry.food.calories,
      serving: entry.serving,
      protein: entry.protein,
      carbs: entry.carbs,
      fat: entry.fat,
      saturates: entry.saturates,
      sugars: entry.sugars,
      fibre: entry.fibre,
      salt: entry.salt,
      baseProtein: entry.food.protein,
      baseCarbs: entry.food.carbs,
      baseFat: entry.food.fat,
      baseSaturates: entry.food.saturates,
      baseSugars: entry.food.sugars,
      baseFibre: entry.food.fibre,
      baseSalt: entry.food.salt,
      defaultServingAmount: entry.food.defaultServingAmount,
      defaultServingDescription: entry.food.defaultServingDescription,
    })),
  });
}
