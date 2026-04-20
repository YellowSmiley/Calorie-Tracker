import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { containsBlockedLanguage } from "@/lib/foodModeration";
import { RateLimiterMemory } from "rate-limiter-flexible";
import { foodReportBodySchema } from "@/lib/apiSchemas";
import {
  apiBadRequest,
  apiNotFound,
  apiSuccess,
  apiTooManyRequests,
  apiUnauthorized,
} from "@/lib/apiResponse";

const reportLimiter = new RateLimiterMemory({
  points: 10,
  duration: 60,
});

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return apiUnauthorized();
  }

  try {
    await reportLimiter.consume(session.user.id);
  } catch {
    return apiTooManyRequests(
      "Too many report attempts. Please try again shortly.",
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiBadRequest("Invalid JSON payload.", "INVALID_JSON");
  }

  const payloadValidation = foodReportBodySchema.safeParse(body);
  if (!payloadValidation.success) {
    return apiBadRequest("Food id is required.", "INVALID_FOOD_REPORT");
  }

  const { foodId, reason } = payloadValidation.data;
  const normalizedReason = reason ?? "";

  if (normalizedReason && containsBlockedLanguage(normalizedReason)) {
    return apiBadRequest(
      "Report reason contains blocked language.",
      "BLOCKED_LANGUAGE",
    );
  }

  const food = await prisma.food.findUnique({
    where: { id: foodId },
    select: { id: true, createdBy: true },
  });

  if (!food) {
    return apiNotFound("Food not found.", "FOOD_NOT_FOUND");
  }

  if (food.createdBy === session.user.id) {
    return apiBadRequest(
      "You cannot report your own food item.",
      "CANNOT_REPORT_OWN_FOOD",
    );
  }

  const existing = await prisma.foodReport.findFirst({
    where: {
      foodId,
      reportedBy: session.user.id,
      isResolved: false,
    },
    select: { id: true },
  });

  if (existing) {
    return apiSuccess({ success: true, alreadyReported: true });
  }

  await prisma.foodReport.create({
    data: {
      foodId,
      reportedBy: session.user.id,
      reason: normalizedReason || null,
    },
  });

  return apiSuccess({ success: true, alreadyReported: false });
}
