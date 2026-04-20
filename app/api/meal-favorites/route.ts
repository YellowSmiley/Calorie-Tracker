import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { MealType as PrismaMealType } from "@prisma/client";
import { requireUser } from "@/lib/apiGuards";
import {
  mealFavoriteCreateBodySchema,
  mealFavoritesGetQuerySchema,
  mealTypeSchema,
} from "@/lib/apiSchemas";
import {
  apiBadRequest,
  apiConflict,
  apiInternalError,
  apiServiceUnavailable,
  apiSuccess,
} from "@/lib/apiResponse";

const isValidMealType = (mealType: string): mealType is PrismaMealType =>
  mealTypeSchema.options.includes(
    mealType as (typeof mealTypeSchema.options)[number],
  );

type MealFavoriteDelegate = {
  findMany: (args: Prisma.MealFavoriteFindManyArgs) => Promise<
    Array<
      Prisma.MealFavoriteGetPayload<{
        include: {
          _count: { select: { items: true } };
          items: {
            include: {
              food: {
                select: {
                  name: true;
                  calories: true;
                  protein: true;
                  carbs: true;
                  fat: true;
                };
              };
            };
            orderBy: { sortOrder: "asc" };
          };
        };
      }>
    >
  >;
  count: (args: Prisma.MealFavoriteCountArgs) => Promise<number>;
  create: (args: Prisma.MealFavoriteCreateArgs) => Promise<
    Prisma.MealFavoriteGetPayload<{
      include: { _count: { select: { items: true } } };
    }>
  >;
};

export async function GET(request: NextRequest) {
  const guard = await requireUser();
  if ("response" in guard) {
    return guard.response;
  }
  const { user } = guard;

  const { searchParams } = new URL(request.url);
  const mealFavorite = (
    prisma as unknown as { mealFavorite?: MealFavoriteDelegate }
  ).mealFavorite;
  if (!mealFavorite) {
    return apiServiceUnavailable(
      "Meal favorites are not available yet. Run prisma generate and restart the dev server.",
      "MEAL_FAVORITES_UNAVAILABLE",
    );
  }

  const queryValidation = mealFavoritesGetQuerySchema.safeParse({
    search: searchParams.get("search") ?? undefined,
    take: searchParams.get("take") ?? undefined,
    skip: searchParams.get("skip") ?? undefined,
    mealType: searchParams.get("mealType") ?? undefined,
  });

  if (!queryValidation.success) {
    return apiBadRequest("Invalid meal type", "INVALID_MEAL_TYPE");
  }

  const {
    mealType,
    search: rawSearch,
    take: rawTake,
    skip: rawSkip,
  } = queryValidation.data;

  const search = (rawSearch || "").trim();
  const take = rawTake ?? 50;
  const skip = rawSkip ?? 0;

  const where: Prisma.MealFavoriteWhereInput = {
    userId: user.id,
    ...(mealType ? { mealType: mealType as PrismaMealType } : {}),
    ...(search
      ? {
          name: {
            contains: search,
            mode: "insensitive" as const,
          },
        }
      : {}),
  };

  const [favorites, total] = await Promise.all([
    mealFavorite.findMany({
      where,
      include: {
        _count: {
          select: { items: true },
        },
        items: {
          include: {
            food: {
              select: {
                name: true,
                calories: true,
                protein: true,
                carbs: true,
                fat: true,
              },
            },
          },
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: [{ usageCount: "desc" }, { updatedAt: "desc" }, { name: "asc" }],
      take,
      skip,
    }),
    mealFavorite.count({ where }),
  ]);

  return apiSuccess({
    favorites: favorites.map((favorite: (typeof favorites)[number]) => ({
      id: favorite.id,
      name: favorite.name,
      mealType: favorite.mealType,
      updatedAt: favorite.updatedAt,
      itemCount: favorite._count.items,
      usageCount: favorite.usageCount,
      totals: favorite.items.reduce(
        (acc, item) => ({
          calories: acc.calories + item.food.calories * item.serving,
          protein: acc.protein + item.food.protein * item.serving,
          carbs: acc.carbs + item.food.carbs * item.serving,
          fat: acc.fat + item.food.fat * item.serving,
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 },
      ),
      itemPreview: favorite.items.slice(0, 3).map((item) => item.food.name),
    })),
    total,
    take,
    skip,
  });
}

export async function POST(request: NextRequest) {
  const guard = await requireUser();
  if ("response" in guard) {
    return guard.response;
  }
  const { user } = guard;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiBadRequest("Invalid JSON payload", "INVALID_JSON");
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

  const payloadValidation = mealFavoriteCreateBodySchema.safeParse(body);
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

  const normalizedMealType: PrismaMealType =
    typeof mealType === "string" && isValidMealType(mealType)
      ? (mealType as PrismaMealType)
      : "BREAKFAST";

  const favoriteItems = items.map((item, index) => ({
    foodId: item.foodId,
    serving: item.serving,
    sortOrder: index,
  }));

  const uniqueFoodIds = [...new Set(favoriteItems.map((item) => item.foodId))];
  const existingFoodsCount = await prisma.food.count({
    where: { id: { in: uniqueFoodIds } },
  });

  if (existingFoodsCount !== uniqueFoodIds.length) {
    return apiBadRequest("One or more foods no longer exist", "FOOD_NOT_FOUND");
  }

  try {
    const favorite = await mealFavorite.create({
      data: {
        userId: user.id,
        name: name.trim(),
        mealType: normalizedMealType,
        items: {
          create: favoriteItems,
        },
      },
      include: {
        _count: {
          select: { items: true },
        },
      },
    });

    return apiSuccess(
      {
        id: favorite.id,
        name: favorite.name,
        mealType: favorite.mealType,
        updatedAt: favorite.updatedAt,
        itemCount: favorite._count.items,
      },
      201,
    );
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
      "meal-favorites/POST",
      error,
      "Failed to create favorite",
    );
  }
}
