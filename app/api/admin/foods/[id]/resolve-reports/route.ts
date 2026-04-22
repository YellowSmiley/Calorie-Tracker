import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiGuards";
import { checkAdminWriteRateLimit } from "@/lib/rateLimit";
import { apiNotFound, apiSuccess, apiTooManyRequests } from "@/lib/apiResponse";
import { resourceIdParamsSchema } from "@/lib/apiSchemas";

export async function POST(
  _request: NextRequest,
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

  return apiSuccess({ success: true, resolvedCount: result.count });
}
