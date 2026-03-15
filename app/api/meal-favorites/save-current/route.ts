import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

const VALID_MEAL_TYPES = ["BREAKFAST", "LUNCH", "DINNER", "SNACK"] as const;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const isValidMealType = (
  mealType: string,
): mealType is (typeof VALID_MEAL_TYPES)[number] =>
  VALID_MEAL_TYPES.includes(mealType as (typeof VALID_MEAL_TYPES)[number]);

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

  const { name, mealType, date } = body ?? {};

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

  if (!mealType || typeof mealType !== "string" || !isValidMealType(mealType)) {
    return NextResponse.json({ error: "Invalid meal type" }, { status: 400 });
  }

  if (!date || typeof date !== "string") {
    return NextResponse.json({ error: "Date is required" }, { status: 400 });
  }

  let start: Date;
  let end: Date;
  try {
    ({ start, end } = getDateRange(date));
  } catch {
    return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
  }

  const entries = await prisma.mealEntry.findMany({
    where: {
      userId: session.user.id,
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
    return NextResponse.json(
      { error: "No items in this meal to save" },
      { status: 400 },
    );
  }

  try {
    const favorite = await mealFavorite.create({
      data: {
        userId: session.user.id,
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
          error: "A favorite with this name already exists for this meal type",
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "Failed to save favorite" },
      { status: 500 },
    );
  }
}
