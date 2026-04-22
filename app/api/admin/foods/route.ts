import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { Food } from "@prisma/client";
import { requireUser } from "@/lib/apiGuards";
import { checkFoodWriteRateLimit } from "@/lib/rateLimit";
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
import { findLikelyDuplicateFood } from "@/lib/foodDuplicateDetection";
import {
  containsBlockedLanguage,
  validateFoodNumbersForModeration,
} from "@/lib/foodModeration";

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

    return apiSuccess({
      foods: foodsWithCreator,
      total,
      take,
      skip,
      suggestions,
    });
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

    const {
      name,
      measurementType,
      measurementAmount,
      calories,
      protein,
      carbs,
      fat,
      saturates,
      sugars,
      fibre,
      salt,
      defaultServingAmount,
      defaultServingDescription,
    } = parsedBody.data;

    if (containsBlockedLanguage(name)) {
      return apiBadRequest(
        "Food name contains blocked language.",
        "FOOD_NAME_BLOCKED",
      );
    }

    if (
      typeof defaultServingDescription === "string" &&
      containsBlockedLanguage(defaultServingDescription)
    ) {
      return apiBadRequest(
        "Serving description contains blocked language.",
        "SERVING_DESCRIPTION_BLOCKED",
      );
    }

    const moderationNumberError = validateFoodNumbersForModeration({
      calories,
      protein,
      carbs,
      fat,
      saturates: typeof saturates === "number" ? saturates : 0,
      sugars: typeof sugars === "number" ? sugars : 0,
      fibre: typeof fibre === "number" ? fibre : 0,
      salt: typeof salt === "number" ? salt : 0,
    });

    if (moderationNumberError) {
      return apiBadRequest(moderationNumberError, "FOOD_NUMBERS_INVALID");
    }

    const duplicate = await findLikelyDuplicateFood({
      name,
      measurementType,
      measurementAmount:
        measurementAmount && measurementAmount > 0 ? measurementAmount : 100,
      calories,
      protein,
      carbs,
      fat,
      saturates: typeof saturates === "number" ? saturates : 0,
      sugars: typeof sugars === "number" ? sugars : 0,
      fibre: typeof fibre === "number" ? fibre : 0,
      salt: typeof salt === "number" ? salt : 0,
    });

    if (duplicate) {
      return apiConflict(
        `Food appears to be a duplicate of \"${duplicate.name}\". Please review before creating another item.`,
        "DUPLICATE_FOOD",
      );
    }

    const newFood = await prisma.food.create({
      data: {
        name,
        measurementType,
        measurementAmount:
          measurementAmount && measurementAmount > 0 ? measurementAmount : 100,
        calories,
        protein,
        carbs,
        fat,
        saturates: typeof saturates === "number" ? saturates : 0,
        sugars: typeof sugars === "number" ? sugars : 0,
        fibre: typeof fibre === "number" ? fibre : 0,
        salt: typeof salt === "number" ? salt : 0,
        createdBy: user.id,
        defaultServingAmount:
          typeof defaultServingAmount === "number" && defaultServingAmount > 0
            ? defaultServingAmount
            : null,
        defaultServingDescription:
          typeof defaultServingDescription === "string" &&
          defaultServingDescription.trim()
            ? defaultServingDescription.trim().slice(0, 50)
            : null,
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
