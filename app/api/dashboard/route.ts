import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logError } from "@/lib/logger";

type NutritionTotals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  saturates: number;
  sugars: number;
  fibre: number;
  salt: number;
};

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const CHART_RANGES = new Set(["1m", "3m", "6m", "1y", "all"]);

const createEmptyTotals = (): NutritionTotals => ({
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  saturates: 0,
  sugars: 0,
  fibre: 0,
  salt: 0,
});

const formatDateKey = (date: Date) => date.toISOString().split("T")[0];

const getBaseDate = (dateString: string) => {
  if (!DATE_REGEX.test(dateString)) {
    throw new Error("Invalid date format");
  }

  const baseDate = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(baseDate.getTime())) {
    throw new Error("Invalid date");
  }

  return baseDate;
};

const getRangeBounds = (range: string, baseDate: Date) => {
  let start: Date;
  let end: Date;

  if (range === "day") {
    start = new Date(baseDate);
    start.setHours(0, 0, 0, 0);
    end = new Date(baseDate);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  if (range === "week") {
    const dayOfWeek = baseDate.getDay();
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    start = new Date(baseDate);
    start.setDate(baseDate.getDate() - daysFromMonday);
    start.setHours(0, 0, 0, 0);
    end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  start = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
  start.setHours(0, 0, 0, 0);
  end = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

const getTrendBounds = async (
  userId: string,
  chartRange: string,
  baseDate: Date,
) => {
  const end = new Date(baseDate);
  end.setHours(23, 59, 59, 999);

  if (chartRange !== "all") {
    const start = new Date(baseDate);

    switch (chartRange) {
      case "1m":
        start.setMonth(start.getMonth() - 1);
        break;
      case "3m":
        start.setMonth(start.getMonth() - 3);
        break;
      case "1y":
        start.setFullYear(start.getFullYear() - 1);
        break;
      case "6m":
      default:
        start.setMonth(start.getMonth() - 6);
        break;
    }

    start.setHours(0, 0, 0, 0);
    return { start, end };
  }

  const [firstMealEntry, firstWeightEntry] = await Promise.all([
    prisma.mealEntry.findFirst({
      where: { userId },
      select: { date: true },
      orderBy: { date: "asc" },
    }),
    prisma.weightEntry.findFirst({
      where: { userId },
      select: { date: true },
      orderBy: { date: "asc" },
    }),
  ]);

  const earliestDate = [firstMealEntry?.date, firstWeightEntry?.date]
    .filter((value): value is Date => value instanceof Date)
    .sort((left, right) => left.getTime() - right.getTime())[0];

  const start = new Date(earliestDate ?? baseDate);
  start.setHours(0, 0, 0, 0);

  return { start, end };
};

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "day";
    const chartRangeParam = searchParams.get("chartRange") || "6m";
    const dateString =
      searchParams.get("date") || new Date().toISOString().split("T")[0];
    const chartRange = CHART_RANGES.has(chartRangeParam)
      ? chartRangeParam
      : "6m";

    const baseDate = getBaseDate(dateString);
    const { start, end } = getRangeBounds(range, baseDate);

    const entries = await prisma.mealEntry.findMany({
      where: {
        userId: session.user.id,
        date: {
          gte: start,
          lte: end,
        },
      },
      select: {
        calories: true,
        protein: true,
        carbs: true,
        fat: true,
        saturates: true,
        sugars: true,
        fibre: true,
        salt: true,
      },
      take: 10000,
    });

    const totals = entries.reduce<NutritionTotals>((acc, entry) => {
      acc.calories += entry.calories;
      acc.protein += entry.protein;
      acc.carbs += entry.carbs;
      acc.fat += entry.fat;
      acc.saturates += entry.saturates;
      acc.sugars += entry.sugars;
      acc.fibre += entry.fibre;
      acc.salt += entry.salt;
      return acc;
    }, createEmptyTotals());

    const { start: trendStart, end: trendEnd } = await getTrendBounds(
      session.user.id,
      chartRange,
      baseDate,
    );

    const [trendEntries, weightEntries] = await Promise.all([
      prisma.mealEntry.findMany({
        where: {
          userId: session.user.id,
          date: {
            gte: trendStart,
            lte: trendEnd,
          },
        },
        select: {
          date: true,
          calories: true,
          protein: true,
          carbs: true,
          fat: true,
        },
      }),
      prisma.weightEntry.findMany({
        where: {
          userId: session.user.id,
          date: {
            gte: trendStart,
            lte: trendEnd,
          },
        },
        select: {
          date: true,
          weight: true,
        },
      }),
    ]);

    const trendMap = new Map<
      string,
      {
        date: string;
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
        bodyWeight: number | null;
      }
    >();

    for (
      const date = new Date(trendStart);
      date <= trendEnd;
      date.setDate(date.getDate() + 1)
    ) {
      const key = formatDateKey(date);
      trendMap.set(key, {
        date: key,
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        bodyWeight: null,
      });
    }

    trendEntries.forEach((entry) => {
      const key = formatDateKey(entry.date);
      const current = trendMap.get(key);
      if (current) {
        current.calories += entry.calories;
        current.protein += entry.protein;
        current.carbs += entry.carbs;
        current.fat += entry.fat;
      }
    });

    weightEntries.forEach((entry) => {
      const key = formatDateKey(entry.date);
      const current = trendMap.get(key);
      if (current) {
        current.bodyWeight = entry.weight;
      }
    });

    return NextResponse.json({
      totals,
      trend: Array.from(trendMap.values()),
    });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Invalid date")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    logError("dashboard/GET", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 },
    );
  }
}
