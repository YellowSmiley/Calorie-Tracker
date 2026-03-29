import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { MeasurementType } from "@/app/diary/types";
import { Prisma } from "@prisma/client";
import { MealType as PrismaMealType } from "@prisma/client";

const VALID_MEAL_TYPES = ["BREAKFAST", "LUNCH", "DINNER", "SNACK"] as const;
const MAX_ITEMS = 100;

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
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = (await params) as { id: string };
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

  const favorite = await mealFavorite.findFirst({
    where: {
      id,
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

  return NextResponse.json({
    id: favorite.id,
    name: favorite.name,
    mealType: favorite.mealType,
    updatedAt: favorite.updatedAt,
    items: favorite.items.map(mapFavoriteItemForClient),
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<unknown> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = (await params) as { id: string };
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

  const body = await request.json();
  const { name, mealType, items } = body ?? {};

  if (
    !name ||
    typeof name !== "string" ||
    name.trim().length === 0 ||
    name.trim().length > 100
  ) {
    return NextResponse.json(
      { error: "Favorite name is required and must be under 100 characters" },
      { status: 400 },
    );
  }

  if (mealType !== undefined && !isValidMealType(String(mealType))) {
    return NextResponse.json({ error: "Invalid meal type" }, { status: 400 });
  }

  if (!Array.isArray(items) || items.length === 0 || items.length > MAX_ITEMS) {
    return NextResponse.json(
      { error: "Favorites must include between 1 and 100 items" },
      { status: 400 },
    );
  }

  const normalizedItems = items.map((item: unknown, index: number) => {
    const typed = item as { foodId?: string; serving?: number };
    return {
      foodId: typed.foodId,
      serving: typed.serving,
      sortOrder: index,
    };
  });

  if (
    normalizedItems.some(
      (item) =>
        !item.foodId ||
        typeof item.foodId !== "string" ||
        typeof item.serving !== "number" ||
        !Number.isFinite(item.serving) ||
        item.serving <= 0 ||
        item.serving > 1000,
    )
  ) {
    return NextResponse.json(
      { error: "Invalid favorite items payload" },
      { status: 400 },
    );
  }

  const existing = await mealFavorite.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Favorite not found" }, { status: 404 });
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
    return NextResponse.json(
      { error: "One or more foods no longer exist" },
      { status: 400 },
    );
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
      return NextResponse.json(
        { error: "Favorite not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
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
      return NextResponse.json(
        {
          error: "A favorite with this name already exists for that meal type",
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "Failed to update favorite" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<unknown> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = (await params) as { id: string };
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

  const existing = await mealFavorite.findFirst({
    where: {
      id,
      userId: session.user.id,
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "Favorite not found" }, { status: 404 });
  }

  await mealFavorite.delete({
    where: { id: existing.id },
  });

  return NextResponse.json({ success: true });
}
