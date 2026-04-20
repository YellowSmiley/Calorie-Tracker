import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiGuards";
import { apiNotFound, apiSuccess } from "@/lib/apiResponse";
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

  const parsedParams = resourceIdParamsSchema.safeParse(await params);
  if (!parsedParams.success) {
    return apiNotFound("Food not found", "FOOD_NOT_FOUND");
  }

  const { id: foodId } = parsedParams.data;

  const food = await prisma.food.findUnique({ where: { id: foodId } });
  if (!food) {
    return apiNotFound("Food not found", "FOOD_NOT_FOUND");
  }

  if (food.isApproved) {
    await prisma.food.update({
      where: { id: foodId },
      data: {
        isApproved: false,
        approvedBy: null,
        approvedAt: null,
      },
    });

    return apiSuccess({ success: true, isApproved: false });
  }

  await prisma.$transaction([
    prisma.food.update({
      where: { id: foodId },
      data: {
        isApproved: true,
        approvedBy: user.id,
        approvedAt: new Date(),
      },
    }),
    prisma.foodReport.updateMany({
      where: {
        foodId,
        isResolved: false,
      },
      data: {
        isResolved: true,
        resolvedBy: user.id,
        resolvedAt: new Date(),
      },
    }),
  ]);

  return apiSuccess({ success: true, isApproved: true });
}
