import { prisma } from "@/lib/prisma";
import { MeasurementType } from "@/app/diary/types";
import { requireUser } from "@/lib/apiGuards";
import { checkMealWriteRateLimit } from "@/lib/rateLimit";
import {
  buildMealNutritionData,
  buildMealsResponse,
  getDateRangeForDay,
  getMealDateForCreate,
} from "@/lib/mealService";
import {
  mealsGetQuerySchema,
  mealsPostBodySchema,
} from "@/lib/apiSchemas";
import {
  apiBadRequest,
  apiNotFound,
  apiSuccess,
  apiTooManyRequests,
} from "@/lib/apiResponse";

export async function GET(request: Request) {
  const guard = await requireUser();
  if ("response" in guard) {
    return guard.response;
  }
  const { user } = guard;

  const { searchParams } = new URL(request.url);
  const queryValidation = mealsGetQuerySchema.safeParse({
    date: searchParams.get("date") ?? undefined,
  });

  if (!queryValidation.success) {
    return apiBadRequest("Invalid date format", "INVALID_DATE");
  }

  const { date } = queryValidation.data;
  let start: Date, end: Date;
  try {
    ({ start, end } = getDateRangeForDay(date));
  } catch {
    return apiBadRequest("Invalid date format", "INVALID_DATE");
  }

  const entries = (await prisma.mealEntry.findMany({
    where: {
      userId: user.id,
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

  const meals = buildMealsResponse(entries);

  return apiSuccess({ meals });
}

export async function POST(request: Request) {
  const guard = await requireUser();
  if ("response" in guard) {
    return guard.response;
  }
  const { user } = guard;

  const allowed = await checkMealWriteRateLimit(user.id);
  if (!allowed) {
    return apiTooManyRequests();
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiBadRequest("Invalid JSON payload", "INVALID_JSON");
  }

  const payloadValidation = mealsPostBodySchema.safeParse(body);
  if (!payloadValidation.success) {
    const firstIssue = payloadValidation.error.issues[0];
    if (firstIssue?.path[0] === "mealType") {
      return apiBadRequest("Invalid meal type", "INVALID_MEAL_TYPE");
    }
    if (firstIssue?.path[0] === "date") {
      return apiBadRequest("Invalid date format", "INVALID_DATE");
    }
    return apiBadRequest("Invalid payload", "VALIDATION_ERROR");
  }

  const { mealType, foodId, serving, date } = payloadValidation.data;

  const food = await prisma.food.findUnique({
    where: { id: foodId },
  });

  if (!food) {
    return apiNotFound("Food not found", "FOOD_NOT_FOUND");
  }

  const servingValue = serving ?? 1;

  let mealDate: Date;
  try {
    mealDate = getMealDateForCreate(date);
  } catch {
    return apiBadRequest("Invalid date format", "INVALID_DATE");
  }

  const nutrition = buildMealNutritionData(food, servingValue);

  const entry = await prisma.mealEntry.create({
    data: {
      userId: user.id,
      foodId: food.id,
      mealType,
      date: mealDate,
      serving: servingValue,
      ...nutrition,
    },
  });

  return apiSuccess(
    {
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
    },
    201,
  );
}
