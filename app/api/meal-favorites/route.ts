import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { MealType as PrismaMealType } from "@prisma/client";

const VALID_MEAL_TYPES = ["BREAKFAST", "LUNCH", "DINNER", "SNACK"] as const;
const MAX_ITEMS = 100;

const isValidMealType = (
  mealType: string,
): mealType is (typeof VALID_MEAL_TYPES)[number] =>
  VALID_MEAL_TYPES.includes(mealType as (typeof VALID_MEAL_TYPES)[number]);

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
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
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

  const search = (searchParams.get("search") || "").trim();
  const take = Math.min(Number(searchParams.get("take") || "50") || 50, 200);
  const skip = Number(searchParams.get("skip") || "0") || 0;
  const mealType = searchParams.get("mealType") || undefined;

  if (mealType && !isValidMealType(mealType)) {
    return NextResponse.json({ error: "Invalid meal type" }, { status: 400 });
  }

  const where: Prisma.MealFavoriteWhereInput = {
    userId: session.user.id,
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

  return NextResponse.json({
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

  const normalizedMealType: PrismaMealType =
    typeof mealType === "string" && isValidMealType(mealType)
      ? (mealType as PrismaMealType)
      : "BREAKFAST";

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

  const favoriteItems = normalizedItems.map((item) => ({
    foodId: item.foodId as string,
    serving: item.serving as number,
    sortOrder: item.sortOrder,
  }));

  const uniqueFoodIds = [...new Set(favoriteItems.map((item) => item.foodId))];
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
    const favorite = await mealFavorite.create({
      data: {
        userId: session.user.id,
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

    return NextResponse.json({
      id: favorite.id,
      name: favorite.name,
      mealType: favorite.mealType,
      updatedAt: favorite.updatedAt,
      itemCount: favorite._count.items,
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
      { error: "Failed to create favorite" },
      { status: 500 },
    );
  }
}
