import { NextRequest } from "next/server";
import { CACHE_DURATIONS, getCacheControlHeader } from "@/lib/cacheKeys";
import { prisma } from "@/lib/prisma";
import { MeasurementType } from "@/app/diary/types";
import { Prisma } from "@prisma/client";
import { MealType as PrismaMealType } from "@prisma/client";
import { requireUser } from "@/lib/apiGuards";
import {
  mealFavoriteParamsSchema,
  mealFavoriteUpdateBodySchema,
  mealTypeSchema,
} from "@/lib/apiSchemas";
import {
  apiBadRequest,
  apiConflict,
  apiInternalError,
  apiNotFound,
  apiServiceUnavailable,
  apiSuccess,
  apiTooManyRequests,
} from "@/lib/apiResponse";
import { checkMealFavoritesWriteRateLimit } from "@/lib/rateLimit";

const isValidMealType = (mealType: string): mealType is PrismaMealType =>
  mealTypeSchema.options.includes(
    mealType as (typeof mealTypeSchema.options)[number],
  );

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
  delete: (
    args: Prisma.MealFavoriteDeleteArgs,
  ) => Promise<Prisma.MealFavoriteGetPayload<object>>;
};

const mapFavoriteItemForClient = (favoriteItem: {
  id: string;
  foodId: string;
  serving: number;
  sortOrder: number;
  food: {
    name: string;
    measurementType: string;
    measurementAmount: number;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    saturates: number;
    sugars: number;
    fibre: number;
    salt: number;
    defaultServingAmount: number | null;
    defaultServingDescription: string | null;
  };
}) => {
  const serving = favoriteItem.serving;

  return {
    id: favoriteItem.id,
    foodId: favoriteItem.foodId,
    name: favoriteItem.food.name,
    measurementType: favoriteItem.food.measurementType as MeasurementType,
    measurementAmount: favoriteItem.food.measurementAmount,
    calories: Number((favoriteItem.food.calories * serving).toFixed(1)),
    baseCalories: favoriteItem.food.calories,
    serving,
    protein: Number((favoriteItem.food.protein * serving).toFixed(1)),
    carbs: Number((favoriteItem.food.carbs * serving).toFixed(1)),
    fat: Number((favoriteItem.food.fat * serving).toFixed(1)),
    saturates: Number((favoriteItem.food.saturates * serving).toFixed(1)),
    sugars: Number((favoriteItem.food.sugars * serving).toFixed(1)),
    fibre: Number((favoriteItem.food.fibre * serving).toFixed(1)),
    salt: Number((favoriteItem.food.salt * serving).toFixed(1)),
    baseProtein: favoriteItem.food.protein,
    baseCarbs: favoriteItem.food.carbs,
    baseFat: favoriteItem.food.fat,
    baseSaturates: favoriteItem.food.saturates,
    baseSugars: favoriteItem.food.sugars,
    baseFibre: favoriteItem.food.fibre,
    baseSalt: favoriteItem.food.salt,
    defaultServingAmount: favoriteItem.food.defaultServingAmount,
    defaultServingDescription: favoriteItem.food.defaultServingDescription,
    sortOrder: favoriteItem.sortOrder,
  };
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<unknown> },
) {
  const guard = await requireUser();
  if ("response" in guard) {
    return guard.response;
  }
  const { user } = guard;

  const paramsValidation = mealFavoriteParamsSchema.safeParse(await params);
  if (!paramsValidation.success) {
    return apiBadRequest("Invalid payload", "VALIDATION_ERROR");
  }

  const { id } = paramsValidation.data;
  const mealFavorite = (
    prisma as unknown as { mealFavorite?: MealFavoriteDelegate }
  ).mealFavorite;
  if (!mealFavorite) {
    return apiServiceUnavailable(
      "Meal favorites are not available yet. Run prisma generate and restart the dev server.",
      "MEAL_FAVORITES_UNAVAILABLE",
    );
  }

  const favorite = await mealFavorite.findFirst({
    where: {
      id,
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

  const response = apiSuccess({
    id: favorite.id,
    name: favorite.name,
    mealType: favorite.mealType,
    updatedAt: favorite.updatedAt,
    items: favorite.items.map(mapFavoriteItemForClient),
  });
  response.headers.set(
    "Cache-Control",
    getCacheControlHeader(CACHE_DURATIONS.userMealFavorites),
  );
  return response;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<unknown> },
) {
  const guard = await requireUser();
  if ("response" in guard) {
    return guard.response;
  }
  const { user } = guard;

  const allowed = await checkMealFavoritesWriteRateLimit(user.id);
  if (!allowed) {
    return apiTooManyRequests();
  }

  const paramsValidation = mealFavoriteParamsSchema.safeParse(await params);
  if (!paramsValidation.success) {
    return apiBadRequest("Invalid payload", "VALIDATION_ERROR");
  }

  const { id } = paramsValidation.data;
  const mealFavorite = (
    prisma as unknown as { mealFavorite?: MealFavoriteDelegate }
  ).mealFavorite;
  if (!mealFavorite) {
    return apiServiceUnavailable(
      "Meal favorites are not available yet. Run prisma generate and restart the dev server.",
      "MEAL_FAVORITES_UNAVAILABLE",
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiBadRequest("Invalid JSON payload", "INVALID_JSON");
  }

  const payloadValidation = mealFavoriteUpdateBodySchema.safeParse(body);
  if (!payloadValidation.success) {
    const firstIssue = payloadValidation.error.issues[0];
    if (firstIssue?.path[0] === "mealType") {
      return apiBadRequest("Invalid meal type", "INVALID_MEAL_TYPE");
    }
    if (firstIssue?.path[0] === "items") {
      return apiBadRequest(
        "Favorites must include between 1 and 100 items",
        "INVALID_FAVORITE_ITEMS",
      );
    }
    return apiBadRequest(
      "Favorite name is required and must be under 100 characters",
      "INVALID_FAVORITE_NAME",
    );
  }

  const { name, mealType, items } = payloadValidation.data;

  if (mealType !== undefined && !isValidMealType(String(mealType))) {
    return apiBadRequest("Invalid meal type", "INVALID_MEAL_TYPE");
  }

  const normalizedItems = items.map((item, index) => ({
    foodId: item.foodId,
    serving: item.serving,
    sortOrder: index,
  }));

  const existing = await mealFavorite.findFirst({
    where: { id, userId: user.id },
  });

  if (!existing) {
    return apiNotFound("Favorite not found", "FAVORITE_NOT_FOUND");
  }

  const normalizedMealType: PrismaMealType =
    typeof mealType === "string" && isValidMealType(mealType)
      ? (mealType as PrismaMealType)
      : existing.mealType;

  const uniqueFoodIds = [
    ...new Set(
      normalizedItems
        .map((item) => item.foodId)
        .filter((foodId): foodId is string => typeof foodId === "string"),
    ),
  ];
  const existingFoodsCount = await prisma.food.count({
    where: { id: { in: uniqueFoodIds } },
  });

  if (existingFoodsCount !== uniqueFoodIds.length) {
    return apiBadRequest("One or more foods no longer exist", "FOOD_NOT_FOUND");
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      await tx.mealFavorite.update({
        where: { id: existing.id },
        data: {
          name: name.trim(),
          mealType: normalizedMealType,
        },
      });

      await tx.mealFavoriteItem.deleteMany({
        where: { favoriteId: existing.id },
      });

      await tx.mealFavoriteItem.createMany({
        data: normalizedItems.map((item) => ({
          favoriteId: existing.id,
          foodId: item.foodId as string,
          serving: item.serving as number,
          sortOrder: item.sortOrder,
        })),
      });

      return tx.mealFavorite.findUnique({
        where: { id: existing.id },
        include: {
          items: {
            include: { food: true },
            orderBy: { sortOrder: "asc" },
          },
        },
      });
    });

    if (!updated) {
      return apiNotFound("Favorite not found", "FAVORITE_NOT_FOUND");
    }

    return apiSuccess({
      id: updated.id,
      name: updated.name,
      mealType: updated.mealType,
      updatedAt: updated.updatedAt,
      items: updated.items.map(mapFavoriteItemForClient),
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      return apiConflict(
        "A favorite with this name already exists for that meal type",
        "FAVORITE_NAME_CONFLICT",
      );
    }

    return apiInternalError(
      "meal-favorites/[id]/PUT",
      error,
      "Failed to update favorite",
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<unknown> },
) {
  const guard = await requireUser();
  if ("response" in guard) {
    return guard.response;
  }
  const { user } = guard;

  const allowed = await checkMealFavoritesWriteRateLimit(user.id);
  if (!allowed) {
    return apiTooManyRequests();
  }

  const paramsValidation = mealFavoriteParamsSchema.safeParse(await params);
  if (!paramsValidation.success) {
    return apiBadRequest("Invalid payload", "VALIDATION_ERROR");
  }

  const { id } = paramsValidation.data;
  const mealFavorite = (
    prisma as unknown as { mealFavorite?: MealFavoriteDelegate }
  ).mealFavorite;
  if (!mealFavorite) {
    return apiServiceUnavailable(
      "Meal favorites are not available yet. Run prisma generate and restart the dev server.",
      "MEAL_FAVORITES_UNAVAILABLE",
    );
  }

  const existing = await mealFavorite.findFirst({
    where: {
      id,
      userId: user.id,
    },
  });

  if (!existing) {
    return apiNotFound("Favorite not found", "FAVORITE_NOT_FOUND");
  }

  await mealFavorite.delete({
    where: { id: existing.id },
  });

  return apiSuccess({ success: true });
}
