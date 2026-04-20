import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { apiBadRequest, apiSuccess, apiUnauthorized } from "@/lib/apiResponse";
import { searchPaginationQuerySchema } from "@/lib/apiSchemas";

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id || !session.user.isAdmin) {
    return apiUnauthorized();
  }

  const { searchParams } = new URL(request.url);
  const parsedQuery = searchPaginationQuerySchema.safeParse(
    Object.fromEntries(searchParams.entries()),
  );

  if (!parsedQuery.success) {
    return apiBadRequest("Invalid query parameters", "VALIDATION_ERROR", {
      issues: parsedQuery.error.issues,
    });
  }

  const search = (parsedQuery.data.search || "").replace(/\s+/g, " ").trim();
  const take = parsedQuery.data.take ?? 50;
  const skip = parsedQuery.data.skip ?? 0;

  const where = {
    isResolved: false,
    ...(search
      ? {
          food: {
            name: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
        }
      : {}),
  };

  const grouped = await prisma.foodReport.groupBy({
    by: ["foodId"],
    where,
    _count: { _all: true },
    _max: { createdAt: true },
    orderBy: [{ _count: { foodId: "desc" } }, { _max: { createdAt: "desc" } }],
  });

  const total = grouped.length;
  const paged = grouped.slice(skip, skip + take);
  const foodIds = paged.map((entry) => entry.foodId);

  const [foods, recentReasons] = await Promise.all([
    prisma.food.findMany({
      where: { id: { in: foodIds } },
      include: {
        creator: {
          select: { name: true },
        },
      },
    }),
    prisma.foodReport.findMany({
      where: {
        foodId: { in: foodIds },
        isResolved: false,
      },
      select: {
        foodId: true,
        reason: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 500,
    }),
  ]);

  const foodMap = new Map(foods.map((food) => [food.id, food]));

  const responseItems = paged
    .map((entry) => {
      const food = foodMap.get(entry.foodId);
      if (!food) {
        return null;
      }

      const reasons = recentReasons
        .filter((report) => report.foodId === entry.foodId && report.reason)
        .slice(0, 3)
        .map((report) => report.reason as string);

      return {
        id: food.id,
        name: food.name,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
        saturates: food.saturates,
        sugars: food.sugars,
        fibre: food.fibre,
        salt: food.salt,
        calories: food.calories,
        measurementAmount: food.measurementAmount,
        measurementType: food.measurementType,
        defaultServingAmount: food.defaultServingAmount,
        defaultServingDescription: food.defaultServingDescription,
        createdBy: food.createdBy,
        createdByName: food.creator?.name || "Unknown",
        createdAt: food.createdAt,
        isApproved: food.isApproved,
        reportCount: entry._count._all,
        lastReportedAt: entry._max.createdAt,
        reasons,
      };
    })
    .filter(Boolean);

  return apiSuccess({
    items: responseItems,
    total,
    take,
    skip,
  });
}
