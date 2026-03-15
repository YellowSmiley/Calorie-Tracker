import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { MeasurementType } from "@/app/diary/types";
import { Prisma } from "@prisma/client";

const VALID_MEAL_TYPES = ["BREAKFAST", "LUNCH", "DINNER", "SNACK"] as const;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const isValidMealType = (
  mealType: string,
): mealType is (typeof VALID_MEAL_TYPES)[number] =>
  VALID_MEAL_TYPES.includes(mealType as (typeof VALID_MEAL_TYPES)[number]);

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
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const mealFavorite = (
    prisma as unknown as { mealFavorite?: MealFavoriteDelegate }
  ).mealFavorite;
  if (!mealFavorite) {
    return NextResponse.json(
      {
        error:
          "Meal favorites are not available yet. Run prisma generate and restart the dev server.",
      },
      { status: 503 },
    );
  }

  const { favoriteId, date, mealType: targetMealType } = body ?? {};

  if (!favoriteId || typeof favoriteId !== "string") {
    return NextResponse.json(
      { error: "Favorite id is required" },
      { status: 400 },
    );
  }

  if (!date || typeof date !== "string") {
    return NextResponse.json({ error: "Date is required" }, { status: 400 });
  }

  if (
    targetMealType &&
    (typeof targetMealType !== "string" || !isValidMealType(targetMealType))
  ) {
    return NextResponse.json({ error: "Invalid meal type" }, { status: 400 });
  }

  let start: Date;
  let end: Date;
  try {
    ({ start, end } = getDateRange(date));
  } catch {
    return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
  }

  const favorite = await mealFavorite.findFirst({
    where: {
      id: favoriteId,
      userId: session.user.id,
    },
    include: {
      items: {
        include: { food: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!favorite) {
    return NextResponse.json({ error: "Favorite not found" }, { status: 404 });
  }

  if (favorite.items.length === 0) {
    return NextResponse.json(
      { error: "Favorite has no items" },
      { status: 400 },
    );
  }

  const mealType = targetMealType ?? favorite.mealType;

  await prisma.$transaction(async (tx) => {
    await tx.mealEntry.deleteMany({
      where: {
        userId: session.user.id,
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
          userId: session.user.id,
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
      userId: session.user.id,
      mealType,
      date: {
        gte: start,
        lte: end,
      },
    },
    include: { food: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({
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
