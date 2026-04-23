import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiBadRequest, apiSuccess } from "@/lib/apiResponse";
import { CACHE_DURATIONS, getCacheControlHeader } from "@/lib/cacheKeys";
import { searchPaginationQuerySchema } from "@/lib/apiSchemas";
import { requireUser } from "@/lib/apiGuards";
import {
  findCloseFoodSuggestions,
  sortByRelevanceAndUsage,
} from "../../../lib/foodSearchSuggestions";

export async function GET(request: NextRequest) {
  const guard = await requireUser();
  if ("response" in guard) {
    return guard.response;
  }
  const { user } = guard;

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
  };

  const matchingFoods = await prisma.food.findMany({
    where,
    include: {
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
  const foods = sortedFoods
    .slice(skip, skip + take)
    .map(({ _count, usageCount, reports, ...food }) => {
      void _count;
      void usageCount;
      return {
        ...food,
        hasUserReported: reports.some(
          (report) => report.reportedBy === user.id,
        ),
        reportCount: reports.length,
        canUserReport: food.createdBy !== user.id,
      };
    });

  let suggestions: string[] = [];

  if (search && total === 0) {
    const suggestionCandidates = await prisma.food.findMany({
      select: { name: true },
      orderBy: { name: "asc" },
      take: 1000,
    });

    suggestions = findCloseFoodSuggestions(
      search,
      suggestionCandidates.map((food) => food.name),
    );
  }

  const response = apiSuccess({ foods, total, take, skip, suggestions });
  response.headers.set("Cache-Control", getCacheControlHeader(CACHE_DURATIONS.foods));
  return response;
}
