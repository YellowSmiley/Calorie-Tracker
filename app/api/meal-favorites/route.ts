import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { MealType as PrismaMealType } from "@prisma/client";
import {
  mealFavoriteCreateBodySchema,
  mealFavoritesGetQuerySchema,
  mealTypeSchema,
} from "@/lib/apiSchemas";

const isValidMealType = (mealType: string): mealType is PrismaMealType =>
  mealTypeSchema.options.includes(mealType as (typeof mealTypeSchema.options)[number]);

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

  const queryValidation = mealFavoritesGetQuerySchema.safeParse({
    search: searchParams.get("search") ?? undefined,
    take: searchParams.get("take") ?? undefined,
    skip: searchParams.get("skip") ?? undefined,
    mealType: searchParams.get("mealType") ?? undefined,
  });

  if (!queryValidation.success) {
    return NextResponse.json({ error: "Invalid meal type" }, { status: 400 });
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload" },
      { status: 400 },
    );
  }
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

  const payloadValidation = mealFavoriteCreateBodySchema.safeParse(body);
  if (!payloadValidation.success) {
    const firstIssue = payloadValidation.error.issues[0];
    if (firstIssue?.path[0] === "mealType") {
      return NextResponse.json({ error: "Invalid meal type" }, { status: 400 });
    }
    if (firstIssue?.path[0] === "items") {
      return NextResponse.json(
        { error: "Favorites must include between 1 and 100 items" },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Favorite name is required and must be under 100 characters" },
      { status: 400 },
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
