import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { containsBlockedLanguage } from "@/lib/foodModeration";
import { requireUser } from "@/lib/apiGuards";
import { checkFoodReportRateLimit } from "@/lib/rateLimit";
import { foodReportBodySchema } from "@/lib/apiSchemas";
import {
  apiBadRequest,
  apiNotFound,
  apiSuccess,
  apiTooManyRequests,
} from "@/lib/apiResponse";
import { logAdminAction, getRequestId } from "@/lib/auditService";

export async function POST(request: NextRequest) {
  const guard = await requireUser();
  if ("response" in guard) {
    return guard.response;
  }
  const { user } = guard;

  const allowed = await checkFoodReportRateLimit(user.id);
  if (!allowed) {
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

  if (food.createdBy === user.id) {
    return apiBadRequest(
      "You cannot report your own food item.",
      "CANNOT_REPORT_OWN_FOOD",
    );
  }

  const existing = await prisma.foodReport.findFirst({
    where: {
      foodId,
      reportedBy: user.id,
      isResolved: false,
    },
    select: { id: true },
  });

  if (existing) {
    return apiSuccess({ success: true, alreadyReported: true });
  }

  const report = await prisma.foodReport.create({
    data: {
      foodId,
      reportedBy: user.id,
      reason: normalizedReason || null,
    },
  });

  // Log food report
  const requestId = getRequestId(request);
  await logAdminAction(prisma, {
    actorId: user.id,
    actorRole: "user",
    targetType: "food",
    targetId: foodId,
    action: "FOOD_REPORTED",
    reason: normalizedReason || undefined,
    metadata: { reportId: report.id, reportedBy: user.id },
    requestId,
  });

  return apiSuccess({ success: true, alreadyReported: false });
}
