import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { settingsPutBodySchema } from "@/lib/apiSchemas";
import { requireUser } from "@/lib/apiGuards";
import { checkProfileWriteRateLimit } from "@/lib/rateLimit";
import {
  apiBadRequest,
  apiInternalError,
  apiNotFound,
  apiSuccess,
  apiTooManyRequests,
} from "@/lib/apiResponse";
import { logAdminAction, getRequestId } from "@/lib/auditService";
import { CACHE_DURATIONS, getCacheControlHeader } from "@/lib/cacheKeys";

// GET /api/settings - Get user settings
export async function GET() {
  try {
    const guard = await requireUser();
    if ("response" in guard) {
      return guard.response;
    }
    const { user } = guard;

    const settingsUser = await prisma.user.findUnique({
      where: { id: user.id },
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

    if (!settingsUser) {
      return apiNotFound("User not found", "USER_NOT_FOUND");
    }

    const response = apiSuccess(settingsUser);
    response.headers.set("Cache-Control", getCacheControlHeader(CACHE_DURATIONS.userSettings));
    return response;
  } catch (error) {
    return apiInternalError("settings/GET", error, "Failed to fetch settings");
  }
}

// PUT /api/settings - Update user settings
export async function PUT(request: NextRequest) {
  try {
    const guard = await requireUser();
    if ("response" in guard) {
      return guard.response;
    }
    const { user } = guard;

    const allowed = await checkProfileWriteRateLimit(user.id);
    if (!allowed) {
      return apiTooManyRequests();
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
      where: { id: user.id },
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

    // Log settings update
    const requestId = getRequestId(request);
    await logAdminAction(prisma, {
      actorId: user.id,
      actorRole: "user",
      targetType: "user",
      targetId: user.id,
      action: "SETTINGS_UPDATED",
      metadata: {
        updatedFields: [
          calorieGoal !== undefined && "calorieGoal",
          proteinGoal !== undefined && "proteinGoal",
          carbGoal !== undefined && "carbGoal",
          fatGoal !== undefined && "fatGoal",
          saturatesGoal !== undefined && "saturatesGoal",
          sugarsGoal !== undefined && "sugarsGoal",
          fibreGoal !== undefined && "fibreGoal",
          saltGoal !== undefined && "saltGoal",
          calorieUnit !== undefined && "calorieUnit",
          weightUnit !== undefined && "weightUnit",
          bodyWeightUnit !== undefined && "bodyWeightUnit",
          volumeUnit !== undefined && "volumeUnit",
        ].filter(Boolean),
      },
      requestId,
    });

    // Cache is revalidated via unstable_cache() TTL (300 sec) in server components
    return apiSuccess(updatedUser);
  } catch (error) {
    return apiInternalError("settings/PUT", error, "Failed to update settings");
  }
}
