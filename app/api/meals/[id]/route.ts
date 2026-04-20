import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { RateLimiterMemory } from "rate-limiter-flexible";
import {
  mealEntryParamsSchema,
  mealEntryPatchBodySchema,
} from "@/lib/apiSchemas";
import {
  apiBadRequest,
  apiNotFound,
  apiSuccess,
  apiTooManyRequests,
  apiUnauthorized,
} from "@/lib/apiResponse";

const mealWriteLimiter = new RateLimiterMemory({
  points: 120,
  duration: 60,
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<unknown> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return apiUnauthorized();
  }

  try {
    await mealWriteLimiter.consume(session.user.id);
  } catch {
    return apiTooManyRequests();
  }

  const paramsValidation = mealEntryParamsSchema.safeParse(await params);
  if (!paramsValidation.success) {
    return apiBadRequest("Invalid payload", "VALIDATION_ERROR");
  }

  const { id } = paramsValidation.data;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiBadRequest("Invalid JSON payload", "INVALID_JSON");
  }

  const payloadValidation = mealEntryPatchBodySchema.safeParse(body);
  if (!payloadValidation.success) {
    return apiBadRequest("Invalid payload", "VALIDATION_ERROR");
  }

  const { serving } = payloadValidation.data;

  const existing = await prisma.mealEntry.findFirst({
    where: { id, userId: session.user.id },
    include: { food: true },
  });

  if (!existing) {
    return apiNotFound("Entry not found", "MEAL_ENTRY_NOT_FOUND");
  }

  const updated = await prisma.mealEntry.update({
    where: { id: existing.id },
    data: {
      serving,
      calories: Number((existing.food.calories * serving).toFixed(1)),
      protein: Number((existing.food.protein * serving).toFixed(1)),
      carbs: Number((existing.food.carbs * serving).toFixed(1)),
      fat: Number((existing.food.fat * serving).toFixed(1)),
      saturates: Number((existing.food.saturates * serving).toFixed(1)),
      sugars: Number((existing.food.sugars * serving).toFixed(1)),
      fibre: Number((existing.food.fibre * serving).toFixed(1)),
      salt: Number((existing.food.salt * serving).toFixed(2)),
    },
    include: { food: true },
  });

  return apiSuccess({
    item: {
      id: updated.id,
      name: updated.food.name,
      measurementAmount: updated.food.measurementAmount,
      measurementType: updated.food.measurementType,
      calories: updated.calories,
      baseCalories: updated.food.calories,
      serving: updated.serving,
      protein: updated.protein,
      carbs: updated.carbs,
      fat: updated.fat,
      saturates: updated.saturates,
      sugars: updated.sugars,
      fibre: updated.fibre,
      salt: updated.salt,
      baseProtein: updated.food.protein,
      baseCarbs: updated.food.carbs,
      baseFat: updated.food.fat,
      baseSaturates: updated.food.saturates,
      baseSugars: updated.food.sugars,
      baseFibre: updated.food.fibre,
      baseSalt: updated.food.salt,
      defaultServingAmount: updated.food.defaultServingAmount,
      defaultServingDescription: updated.food.defaultServingDescription,
    },
  });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<unknown> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return apiUnauthorized();
  }

  try {
    await mealWriteLimiter.consume(session.user.id);
  } catch {
    return apiTooManyRequests();
  }

  const paramsValidation = mealEntryParamsSchema.safeParse(await params);
  if (!paramsValidation.success) {
    return apiBadRequest("Invalid payload", "VALIDATION_ERROR");
  }

  const { id } = paramsValidation.data;
  const existing = await prisma.mealEntry.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!existing) {
    return apiNotFound("Entry not found", "MEAL_ENTRY_NOT_FOUND");
  }

  await prisma.mealEntry.delete({
    where: { id: existing.id },
  });

  return apiSuccess({ success: true });
}
