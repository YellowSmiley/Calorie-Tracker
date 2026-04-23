import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/apiGuards";
import { CACHE_DURATIONS, getCacheControlHeader } from "@/lib/cacheKeys";
import {
  bodyWeightDateQuerySchema,
  bodyWeightPutBodySchema,
} from "@/lib/apiSchemas";
import {
  apiBadRequest,
  apiInternalError,
  apiSuccess,
  apiTooManyRequests,
} from "@/lib/apiResponse";
import { checkProfileWriteRateLimit } from "@/lib/rateLimit";
import { logAdminAction, getRequestId } from "@/lib/auditService";

const getEntryDate = (dateString?: string | null) => {
  const safeDate = dateString || new Date().toISOString().split("T")[0];

  const date = new Date(`${safeDate}T00:00:00`);
  if (isNaN(date.getTime())) {
    throw new Error("Invalid date");
  }

  date.setHours(0, 0, 0, 0);
  return date;
};

export async function GET(request: NextRequest) {
  try {
    const guard = await requireUser();
    if ("response" in guard) {
      return guard.response;
    }
    const { user } = guard;

    const { searchParams } = new URL(request.url);
    const queryValidation = bodyWeightDateQuerySchema.safeParse({
      date: searchParams.get("date") ?? undefined,
    });

    if (!queryValidation.success) {
      return apiBadRequest("Invalid date format", "INVALID_DATE");
    }

    const date = getEntryDate(queryValidation.data.date);

    const entry = await prisma.weightEntry.findUnique({
      where: {
        userId_date: {
          userId: user.id,
          date,
        },
      },
      select: { weight: true },
    });

    const response = apiSuccess({ weight: entry?.weight ?? null });
    response.headers.set("Cache-Control", getCacheControlHeader(CACHE_DURATIONS.userBodyWeight));
    return response;
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Invalid date")) {
      return apiBadRequest(error.message, "INVALID_DATE");
    }

    return apiInternalError(
      "body-weight/GET",
      error,
      "Failed to fetch body weight",
    );
  }
}

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

    const payloadValidation = bodyWeightPutBodySchema.safeParse(body);
    if (!payloadValidation.success) {
      const firstIssue = payloadValidation.error.issues[0];
      if (firstIssue?.path[0] === "date") {
        return apiBadRequest("Invalid date format", "INVALID_DATE");
      }
      return apiBadRequest(
        "Body weight must be between 0 and 1000 kg",
        "INVALID_BODY_WEIGHT",
      );
    }

    const { date: rawDate, weight } = payloadValidation.data;
    const date = getEntryDate(rawDate);
    const requestId = getRequestId(request);

    if (weight === null || weight === undefined) {
      await prisma.weightEntry.deleteMany({
        where: {
          userId: user.id,
          date,
        },
      });

      // Log body weight deletion
      await logAdminAction(prisma, {
        actorId: user.id,
        actorRole: "user",
        targetType: "user",
        targetId: user.id,
        action: "BODY_WEIGHT_DELETED",
        metadata: { date: date.toISOString() },
        requestId,
      });

      return apiSuccess({ weight: null });
    }

    const entry = await prisma.weightEntry.upsert({
      where: {
        userId_date: {
          userId: user.id,
          date,
        },
      },
      create: {
        userId: user.id,
        date,
        weight,
      },
      update: {
        weight,
      },
      select: {
        weight: true,
      },
    });

    // Log body weight recording
    await logAdminAction(prisma, {
      actorId: user.id,
      actorRole: "user",
      targetType: "user",
      targetId: user.id,
      action: "BODY_WEIGHT_RECORDED",
      metadata: { weight, date: date.toISOString() },
      requestId,
    });

    return apiSuccess({ weight: entry.weight });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Invalid date")) {
      return apiBadRequest(error.message, "INVALID_DATE");
    }

    return apiInternalError(
      "body-weight/PUT",
      error,
      "Failed to save body weight",
    );
  }
}
