import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { settingsPutBodySchema } from "@/lib/apiSchemas";
import {
  apiBadRequest,
  apiInternalError,
  apiNotFound,
  apiSuccess,
  apiUnauthorized,
} from "@/lib/apiResponse";

// GET /api/settings - Get user settings
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return apiUnauthorized();
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        calorieGoal: true,
        proteinGoal: true,
        carbGoal: true,
        fatGoal: true,
        saturatesGoal: true,
        sugarsGoal: true,
        fibreGoal: true,
        saltGoal: true,
        calorieUnit: true,
        weightUnit: true,
        bodyWeightUnit: true,
        volumeUnit: true,
      },
    });

    if (!user) {
      return apiNotFound("User not found", "USER_NOT_FOUND");
    }

    return apiSuccess(user);
  } catch (error) {
    return apiInternalError("settings/GET", error, "Failed to fetch settings");
  }
}

// PUT /api/settings - Update user settings
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return apiUnauthorized();
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return apiBadRequest("Invalid JSON payload", "INVALID_JSON");
    }

    const payloadValidation = settingsPutBodySchema.safeParse(body);
    if (!payloadValidation.success) {
      return apiBadRequest(
        "Goal values must be between 0 and the maximum allowed",
        "INVALID_SETTINGS",
      );
    }

    const {
      calorieGoal,
      proteinGoal,
      carbGoal,
      fatGoal,
      saturatesGoal,
      sugarsGoal,
      fibreGoal,
      saltGoal,
      calorieUnit,
      weightUnit,
      bodyWeightUnit,
      volumeUnit,
    } = payloadValidation.data;

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        calorieGoal,
        proteinGoal,
        carbGoal,
        fatGoal,
        saturatesGoal,
        sugarsGoal,
        fibreGoal,
        saltGoal,
        calorieUnit: calorieUnit ?? "kcal",
        weightUnit: weightUnit ?? "g",
        bodyWeightUnit: bodyWeightUnit ?? "kg",
        volumeUnit: volumeUnit ?? "ml",
      },
      select: {
        calorieGoal: true,
        proteinGoal: true,
        carbGoal: true,
        fatGoal: true,
        saturatesGoal: true,
        sugarsGoal: true,
        fibreGoal: true,
        saltGoal: true,
        calorieUnit: true,
        weightUnit: true,
        bodyWeightUnit: true,
        volumeUnit: true,
      },
    });

    return apiSuccess(updatedUser);
  } catch (error) {
    return apiInternalError("settings/PUT", error, "Failed to update settings");
  }
}
