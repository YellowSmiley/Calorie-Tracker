import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { requireUser } from "@/lib/apiGuards";
import {
  apiBadRequest,
  apiConflict,
  apiInternalError,
  apiServiceUnavailable,
  apiSuccess,
} from "@/lib/apiResponse";
import { mealFavoriteSaveCurrentBodySchema } from "@/lib/apiSchemas";

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

type MealFavoriteDelegate = {
  create: (args: Prisma.MealFavoriteCreateArgs) => Promise<
    Prisma.MealFavoriteGetPayload<{
      include: { _count: { select: { items: true } } };
    }>
  >;
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

  const body = await request.json();
  const parsedBody = mealFavoriteSaveCurrentBodySchema.safeParse(body);
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

  const { name, mealType, date } = parsedBody.data;

  let start: Date;
  let end: Date;
  try {
    ({ start, end } = getDateRange(date));
  } catch {
    return apiBadRequest("Invalid date format", "INVALID_DATE");
  }

  const entries = await prisma.mealEntry.findMany({
    where: {
      userId: user.id,
      mealType,
      date: {
        gte: start,
        lte: end,
      },
    },
    select: {
      foodId: true,
      serving: true,
    },
    orderBy: { createdAt: "asc" },
  });

  if (entries.length === 0) {
    return apiBadRequest("No items in this meal to save", "EMPTY_MEAL");
  }

  try {
    const favorite = await mealFavorite.create({
      data: {
        userId: user.id,
        name: name.trim(),
        mealType,
        items: {
          create: entries.map((entry, index) => ({
            foodId: entry.foodId,
            serving: entry.serving,
            sortOrder: index,
          })),
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
        "A favorite with this name already exists for this meal type",
        "DUPLICATE_FAVORITE_NAME",
      );
    }

    return apiInternalError(
      "meal-favorites/save-current/POST",
      error,
      "Failed to save favorite",
    );
  }
}
