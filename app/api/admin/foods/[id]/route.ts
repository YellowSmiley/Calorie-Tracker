import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/apiGuards";
import { checkFoodWriteRateLimit } from "@/lib/rateLimit";
import {
  buildDuplicateCheckInput,
  findDuplicateFood,
  getFoodModerationError,
  mergeWithExistingFood,
} from "@/lib/foodModerationService";
import {
  apiBadRequest,
  apiConflict,
  apiForbidden,
  apiInternalError,
  apiNotFound,
  apiSuccess,
  apiTooManyRequests,
} from "@/lib/apiResponse";
import {
  adminFoodUpsertBodySchema,
  resourceIdParamsSchema,
} from "@/lib/apiSchemas";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<unknown> },
) {
  const guard = await requireUser();
  if ("response" in guard) {
    return guard.response;
  }
  const { user } = guard;

  const allowed = await checkFoodWriteRateLimit(user.id);
  if (!allowed) {
    return apiTooManyRequests();
  }

  try {
    const parsedParams = resourceIdParamsSchema.safeParse(await params);
    if (!parsedParams.success) {
      return apiNotFound("Food not found", "FOOD_NOT_FOUND");
    }

    const { id: foodId } = parsedParams.data;
    const parsedBody = adminFoodUpsertBodySchema.safeParse(
      await request.json(),
    );
    if (!parsedBody.success) {
      return apiBadRequest("Invalid food payload", "VALIDATION_ERROR", {
        issues: parsedBody.error.issues,
      });
    }

    const body = parsedBody.data;

    // Ownership check
    const existingFood = await prisma.food.findUnique({
      where: { id: foodId },
    });
    if (!existingFood) {
      return apiNotFound("Food not found", "FOOD_NOT_FOUND");
    }
    if (!user.isAdmin && existingFood.createdBy !== user.id) {
      return apiForbidden();
    }

    const normalized = mergeWithExistingFood(existingFood, body);

    const moderationError = getFoodModerationError(normalized);
    if (moderationError) {
      return apiBadRequest(moderationError.message, moderationError.code);
    }

    const duplicate = await findDuplicateFood(
      buildDuplicateCheckInput(normalized, foodId),
    );
    if (duplicate) {
      return apiConflict(
        `Food appears to be a duplicate of \"${duplicate.name}\". Please review before saving.`,
        "DUPLICATE_FOOD",
      );
    }

    const updated = await prisma.food.update({
      where: { id: foodId },
      data: {
        name: normalized.name,
        measurementAmount: normalized.measurementAmount,
        measurementType: normalized.measurementType,
        calories: normalized.calories,
        protein: normalized.protein,
        carbs: normalized.carbs,
        fat: normalized.fat,
        saturates: normalized.saturates,
        sugars: normalized.sugars,
        fibre: normalized.fibre,
        salt: normalized.salt,
        defaultServingAmount: normalized.defaultServingAmount,
        defaultServingDescription: normalized.defaultServingDescription,
        isApproved: false,
        approvedBy: null,
        approvedAt: null,
      },
    });

    const creator = updated.createdBy
      ? await prisma.user.findUnique({
          where: { id: updated.createdBy },
          select: { name: true },
        })
      : null;

    return apiSuccess({
      ...updated,
      createdByName: creator?.name || "Unknown",
    });
  } catch (error) {
    return apiInternalError("admin/foods/PUT", error, "Failed to update food");
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<unknown> },
) {
  const guard = await requireUser();
  if ("response" in guard) {
    return guard.response;
  }
  const { user } = guard;

  const allowed = await checkFoodWriteRateLimit(user.id);
  if (!allowed) {
    return apiTooManyRequests();
  }

  try {
    const parsedParams = resourceIdParamsSchema.safeParse(await params);
    if (!parsedParams.success) {
      return apiNotFound("Food not found", "FOOD_NOT_FOUND");
    }

    const { id: foodId } = parsedParams.data;

    // Ownership check
    const existingFood = await prisma.food.findUnique({
      where: { id: foodId },
    });
    if (!existingFood) {
      return apiNotFound("Food not found", "FOOD_NOT_FOUND");
    }
    if (!user.isAdmin && existingFood.createdBy !== user.id) {
      return apiForbidden();
    }
    // Delete food (cascade will handle meal entries)
    await prisma.food.delete({
      where: { id: foodId },
    });

    return apiSuccess({ success: true });
  } catch (error) {
    return apiInternalError(
      "admin/foods/DELETE",
      error,
      "Failed to delete food",
    );
  }
}
