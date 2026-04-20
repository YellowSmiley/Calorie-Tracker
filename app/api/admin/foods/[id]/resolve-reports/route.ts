import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { apiNotFound, apiSuccess, apiUnauthorized } from "@/lib/apiResponse";
import { resourceIdParamsSchema } from "@/lib/apiSchemas";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<unknown> },
) {
  const session = await auth();

  if (!session?.user?.id || !session.user.isAdmin) {
    return apiUnauthorized();
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
      resolvedBy: session.user.id,
      resolvedAt,
    },
  });

  return apiSuccess({ success: true, resolvedCount: result.count });
}
