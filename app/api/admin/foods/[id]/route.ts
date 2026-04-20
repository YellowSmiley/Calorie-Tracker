import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { findLikelyDuplicateFood } from "@/lib/foodDuplicateDetection";
import {
  containsBlockedLanguage,
  validateFoodNumbersForModeration,
} from "@/lib/foodModeration";
import {
  apiBadRequest,
  apiConflict,
  apiForbidden,
  apiInternalError,
  apiNotFound,
  apiSuccess,
  apiUnauthorized,
} from "@/lib/apiResponse";
import {
  adminFoodUpsertBodySchema,
  resourceIdParamsSchema,
} from "@/lib/apiSchemas";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<unknown> },
) {
  const session = await auth();

  if (!session?.user?.id) {
    return apiUnauthorized();
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

    if (containsBlockedLanguage(body.name)) {
      return apiBadRequest(
        "Food name contains blocked language.",
        "FOOD_NAME_BLOCKED",
      );
    }

    if (
      typeof body.defaultServingDescription === "string" &&
      containsBlockedLanguage(body.defaultServingDescription)
    ) {
      return apiBadRequest(
        "Serving description contains blocked language.",
        "SERVING_DESCRIPTION_BLOCKED",
      );
    }

    // Ownership check
    const existingFood = await prisma.food.findUnique({
      where: { id: foodId },
    });
    if (!existingFood) {
      return apiNotFound("Food not found", "FOOD_NOT_FOUND");
    }
    if (!session.user.isAdmin && existingFood.createdBy !== session.user.id) {
      return apiForbidden();
    }

    const mergedFoodForDuplicateCheck = {
      id: foodId,
      name: body.name ?? existingFood.name,
      measurementType: body.measurementType ?? existingFood.measurementType,
      measurementAmount:
        typeof body.measurementAmount === "number"
          ? body.measurementAmount
          : existingFood.measurementAmount,
      calories:
        typeof body.calories === "number"
          ? body.calories
          : existingFood.calories,
      protein:
        typeof body.protein === "number" ? body.protein : existingFood.protein,
      carbs: typeof body.carbs === "number" ? body.carbs : existingFood.carbs,
      fat: typeof body.fat === "number" ? body.fat : existingFood.fat,
      saturates:
        typeof body.saturates === "number"
          ? body.saturates
          : existingFood.saturates,
      sugars:
        typeof body.sugars === "number" ? body.sugars : existingFood.sugars,
      fibre: typeof body.fibre === "number" ? body.fibre : existingFood.fibre,
      salt: typeof body.salt === "number" ? body.salt : existingFood.salt,
    };

    const duplicate = await findLikelyDuplicateFood(
      mergedFoodForDuplicateCheck,
    );
    if (duplicate) {
      return apiConflict(
        `Food appears to be a duplicate of \"${duplicate.name}\". Please review before saving.`,
        "DUPLICATE_FOOD",
      );
    }

    const moderationNumberError = validateFoodNumbersForModeration({
      calories: mergedFoodForDuplicateCheck.calories,
      protein: mergedFoodForDuplicateCheck.protein,
      carbs: mergedFoodForDuplicateCheck.carbs,
      fat: mergedFoodForDuplicateCheck.fat,
      saturates: mergedFoodForDuplicateCheck.saturates,
      sugars: mergedFoodForDuplicateCheck.sugars,
      fibre: mergedFoodForDuplicateCheck.fibre,
      salt: mergedFoodForDuplicateCheck.salt,
    });

    if (moderationNumberError) {
      return apiBadRequest(moderationNumberError, "FOOD_NUMBERS_INVALID");
    }

    const updated = await prisma.food.update({
      where: { id: foodId },
      data: {
        name: body.name,
        measurementAmount: body.measurementAmount,
        measurementType: body.measurementType,
        calories: body.calories,
        protein: body.protein,
        carbs: body.carbs,
        fat: body.fat,
        saturates: typeof body.saturates === "number" ? body.saturates : 0,
        sugars: typeof body.sugars === "number" ? body.sugars : 0,
        fibre: typeof body.fibre === "number" ? body.fibre : 0,
        salt: typeof body.salt === "number" ? body.salt : 0,
        defaultServingAmount:
          typeof body.defaultServingAmount === "number" &&
          body.defaultServingAmount > 0
            ? body.defaultServingAmount
            : null,
        defaultServingDescription:
          typeof body.defaultServingDescription === "string" &&
          body.defaultServingDescription.trim()
            ? body.defaultServingDescription.trim().slice(0, 50)
            : null,
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
  const session = await auth();

  if (!session?.user?.id) {
    return apiUnauthorized();
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
    if (!session.user.isAdmin && existingFood.createdBy !== session.user.id) {
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
