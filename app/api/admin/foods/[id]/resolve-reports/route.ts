import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiGuards";
import { checkAdminWriteRateLimit } from "@/lib/rateLimit";
import { apiNotFound, apiSuccess, apiTooManyRequests } from "@/lib/apiResponse";
import {
  adminAuditReasonBodySchema,
  resourceIdParamsSchema,
} from "@/lib/apiSchemas";
import { logAdminAction, getRequestId } from "@/lib/auditService";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<unknown> },
) {
  const guard = await requireAdmin();
  if ("response" in guard) {
    return guard.response;
  }
  const { user } = guard;

  const allowed = await checkAdminWriteRateLimit(user.id);
  if (!allowed) {
    return apiTooManyRequests();
  }

  const parsedParams = resourceIdParamsSchema.safeParse(await params);
  if (!parsedParams.success) {
    return apiNotFound("Food not found", "FOOD_NOT_FOUND");
  }

  const { id: foodId } = parsedParams.data;

  let reason: string | undefined;
  try {
    const rawBody = await request.json();
    const parsed = adminAuditReasonBodySchema.safeParse(rawBody);
    if (parsed.success) reason = parsed.data.reason;
  } catch {
    // body is optional
  }
  const requestId = getRequestId(request);

  const food = await prisma.food.findUnique({ where: { id: foodId } });
  if (!food) {
    return apiNotFound("Food not found", "FOOD_NOT_FOUND");
  }

  const resolvedAt = new Date();
  const result = await prisma.foodReport.updateMany({
    where: {
      foodId,
      isResolved: false,
    },
    data: {
      isResolved: true,
      resolvedBy: user.id,
      resolvedAt,
    },
  });

  await logAdminAction(prisma, {
    actorId: user.id,
    targetType: "food",
    targetId: foodId,
    action: "FOOD_REPORTS_RESOLVED",
    reason,
    requestId,
    metadata: { resolvedCount: result.count },
  });

  return apiSuccess({ success: true, resolvedCount: result.count });
}
