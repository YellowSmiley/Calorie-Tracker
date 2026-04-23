import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { Food } from "@prisma/client";
import { requireUser } from "@/lib/apiGuards";
import { checkFoodWriteRateLimit } from "@/lib/rateLimit";
import { getCacheControlHeader } from "@/lib/cacheKeys";
import {
  apiBadRequest,
  apiConflict,
  apiInternalError,
  apiSuccess,
  apiTooManyRequests,
} from "@/lib/apiResponse";
import {
  adminFoodUpsertBodySchema,
  searchPaginationQuerySchema,
} from "@/lib/apiSchemas";
import {
  findCloseFoodSuggestions,
  sortByRelevanceAndUsage,
} from "../../../../lib/foodSearchSuggestions";
import {
  buildDuplicateCheckInput,
  findDuplicateFood,
  getFoodModerationError,
  normalizeFoodWriteInput,
} from "@/lib/foodModerationService";

export type FoodWithCreator = Food & {
  createdByName?: string;
  hasUserReported?: boolean;
  reportCount?: number;
  canUserReport?: boolean;
};

export async function GET(request: NextRequest) {
  const guard = await requireUser();
  if ("response" in guard) {
    return guard.response;
  }
  const { user } = guard;

  try {
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
      ...(search
        ? {
            OR: [{ name: { contains: search, mode: "insensitive" as const } }],
          }
        : {}),
      ...(!user.isAdmin ? { createdBy: user.id } : {}),
    };

    const matchingFoods = await prisma.food.findMany({
      where,
      include: {
        creator: {
          select: { name: true },
        },
        reports: {
          where: { isResolved: false },
          select: { reportedBy: true },
        },
        _count: {
          select: { entries: true },
        },
      },
    });

    const sortedFoods = sortByRelevanceAndUsage(
      matchingFoods.map((food) => ({
        ...food,
        usageCount: food._count.entries,
      })),
      search,
    ).sort((a, b) => Number(b.isApproved) - Number(a.isApproved));

    const total = sortedFoods.length;
    const foodsWithCreator: FoodWithCreator[] = sortedFoods
      .slice(skip, skip + take)
      .map(({ creator, reports, ...food }) => ({
        ...food,
        createdByName: creator?.name || "Unknown",
        hasUserReported: reports.some(
          (report) => report.reportedBy === user.id,
        ),
        reportCount: reports.length,
      }));

    let suggestions: string[] = [];

    if (search && total === 0) {
      const suggestionWhere = {
        ...(!user.isAdmin ? { createdBy: user.id } : {}),
      };

      const suggestionCandidates = await prisma.food.findMany({
        where: suggestionWhere,
        select: { name: true },
        orderBy: { name: "asc" },
        take: 1000,
      });

      suggestions = findCloseFoodSuggestions(
        search,
        suggestionCandidates.map((food) => food.name),
      );
    }

    const response = apiSuccess({
      foods: foodsWithCreator,
      total,
      take,
      skip,
      suggestions,
    });
    response.headers.set("Cache-Control", getCacheControlHeader(0));
    return response;
  } catch (error) {
    return apiInternalError("admin/foods/GET", error, "Failed to fetch foods");
  }
}

export async function POST(request: NextRequest) {
  const guard = await requireUser();
  if ("response" in guard) {
    return guard.response;
  }
  const { user } = guard;

  const allowed = await checkFoodWriteRateLimit(user.id);
  if (!allowed) {
    return apiTooManyRequests();
  }

  try {
    const parsedBody = adminFoodUpsertBodySchema.safeParse(
      await request.json(),
    );
    if (!parsedBody.success) {
      return apiBadRequest("Invalid food payload", "VALIDATION_ERROR", {
        issues: parsedBody.error.issues,
      });
    }

    const normalized = normalizeFoodWriteInput(parsedBody.data);

    const moderationError = getFoodModerationError(normalized);
    if (moderationError) {
      return apiBadRequest(moderationError.message, moderationError.code);
    }

    const duplicate = await findDuplicateFood(
      buildDuplicateCheckInput(normalized),
    );

    if (duplicate) {
      return apiConflict(
        `Food appears to be a duplicate of \"${duplicate.name}\". Please review before creating another item.`,
        "DUPLICATE_FOOD",
      );
    }

    const newFood = await prisma.food.create({
      data: {
        name: normalized.name,
        measurementType: normalized.measurementType,
        measurementAmount: normalized.measurementAmount,
        calories: normalized.calories,
        protein: normalized.protein,
        carbs: normalized.carbs,
        fat: normalized.fat,
        saturates: normalized.saturates,
        sugars: normalized.sugars,
        fibre: normalized.fibre,
        salt: normalized.salt,
        createdBy: user.id,
        defaultServingAmount: normalized.defaultServingAmount,
        defaultServingDescription: normalized.defaultServingDescription,
        isApproved: false,
        approvedBy: null,
        approvedAt: null,
      },
    });

    return apiSuccess(newFood, 201);
  } catch (error) {
    return apiInternalError("admin/foods/POST", error, "Failed to create food");
  }
}
