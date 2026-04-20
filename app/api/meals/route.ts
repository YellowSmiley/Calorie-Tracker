import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { MeasurementType } from "@/app/diary/types";
import { RateLimiterMemory } from "rate-limiter-flexible";
import {
  mealsGetQuerySchema,
  mealsPostBodySchema,
  mealTypeSchema,
} from "@/lib/apiSchemas";

const MEAL_TYPES = mealTypeSchema.options;

const mealWriteLimiter = new RateLimiterMemory({
  points: 120,
  duration: 60,
});

const getDateRange = (dateString?: string | null) => {
  const baseDate = dateString ? new Date(`${dateString}T00:00:00`) : new Date();
  if (isNaN(baseDate.getTime())) {
    throw new Error("Invalid date");
  }
  const start = new Date(baseDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(baseDate);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const queryValidation = mealsGetQuerySchema.safeParse({
    date: searchParams.get("date") ?? undefined,
  });

  if (!queryValidation.success) {
    return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
  }

  const { date } = queryValidation.data;
  let start: Date, end: Date;
  try {
    ({ start, end } = getDateRange(date));
  } catch {
    return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
  }

  const entries = (await prisma.mealEntry.findMany({
    where: {
      userId: session.user.id,
      date: {
        gte: start,
        lte: end,
      },
    },
    include: {
      food: true,
    },
    orderBy: { createdAt: "asc" },
  })) as Array<{
    id: string;
    mealType: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    saturates: number;
    sugars: number;
    fibre: number;
    salt: number;
    serving: number;
    food: {
      name: string;
      measurementType: MeasurementType;
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
  }>;

  const meals = MEAL_TYPES.map((type) => ({
    name: type[0] + type.slice(1).toLowerCase(),
    items: entries
      .filter((entry) => entry.mealType === type)
      .map((entry) => ({
        id: entry.id,
        name: entry.food.name,
        measurementAmount: entry.food.measurementAmount,
        measurementType: entry.food.measurementType,
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
  }));

  return NextResponse.json({ meals });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await mealWriteLimiter.consume(session.user.id);
  } catch {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      { status: 429 },
    );
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

  const payloadValidation = mealsPostBodySchema.safeParse(body);
  if (!payloadValidation.success) {
    const firstIssue = payloadValidation.error.issues[0];
    if (firstIssue?.path[0] === "mealType") {
      return NextResponse.json({ error: "Invalid meal type" }, { status: 400 });
    }
    if (firstIssue?.path[0] === "date") {
      return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
    }
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { mealType, foodId, serving, date } = payloadValidation.data;

  const food = await prisma.food.findUnique({
    where: { id: foodId },
  });

  if (!food) {
    return NextResponse.json({ error: "Food not found" }, { status: 404 });
  }

  const servingValue = serving ?? 1;

  let mealDate: Date;
  try {
    if (date) {
      mealDate = new Date(`${date}T00:00:00`);
      if (isNaN(mealDate.getTime())) throw new Error("Invalid date");
    } else {
      mealDate = new Date();
    }
  } catch {
    return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
  }

  const entry = await prisma.mealEntry.create({
    data: {
      userId: session.user.id,
      foodId: food.id,
      mealType,
      date: mealDate,
      serving: servingValue,
      calories: Number((food.calories * servingValue).toFixed(1)),
      protein: Number((food.protein * servingValue).toFixed(1)),
      carbs: Number((food.carbs * servingValue).toFixed(1)),
      fat: Number((food.fat * servingValue).toFixed(1)),
      saturates: Number((food.saturates * servingValue).toFixed(1)),
      sugars: Number((food.sugars * servingValue).toFixed(1)),
      fibre: Number((food.fibre * servingValue).toFixed(1)),
      salt: Number((food.salt * servingValue).toFixed(2)),
    },
  });

  return NextResponse.json({
    item: {
      id: entry.id,
      name: food.name,
      measurementAmount: food.measurementAmount,
      measurementType: food.measurementType,
      calories: entry.calories,
      baseCalories: food.calories,
      serving: entry.serving,
      protein: entry.protein,
      carbs: entry.carbs,
      fat: entry.fat,
      saturates: entry.saturates,
      sugars: entry.sugars,
      fibre: entry.fibre,
      salt: entry.salt,
      baseProtein: food.protein,
      baseCarbs: food.carbs,
      baseFat: food.fat,
      baseSaturates: food.saturates,
      baseSugars: food.sugars,
      baseFibre: food.fibre,
      baseSalt: food.salt,
      defaultServingAmount: food.defaultServingAmount,
      defaultServingDescription: food.defaultServingDescription,
    },
  });
}
