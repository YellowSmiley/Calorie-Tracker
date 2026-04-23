import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiGuards";
import { apiBadRequest, apiInternalError, apiSuccess } from "@/lib/apiResponse";
import { findCloseFoodSuggestions } from "../../../../lib/foodSearchSuggestions";
import { searchPaginationQuerySchema } from "@/lib/apiSchemas";
import { getCacheControlHeader } from "@/lib/cacheKeys";

export async function GET(request: NextRequest) {
  const guard = await requireAdmin();
  if ("response" in guard) {
    return guard.response;
  }

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

    const search = (parsedQuery.data.search || "").trim();
    const take = parsedQuery.data.take ?? 50;
    const skip = parsedQuery.data.skip ?? 0;

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          isAdmin: true,
          provider: true,
          isActive: true,
          blackMarks: true,
          bannedAt: true,
        },
        orderBy: { email: "asc" },
        take,
        skip,
      }),
      prisma.user.count({ where }),
    ]);

    let suggestions: string[] = [];

    if (search && users.length === 0) {
      const suggestionCandidates = await prisma.user.findMany({
        select: { name: true, email: true },
        orderBy: { email: "asc" },
        take: 1000,
      });

      const candidateValues = Array.from(
        new Set(
          suggestionCandidates
            .flatMap((user) => [user.name, user.email])
            .filter((value): value is string => !!value),
        ),
      );

      suggestions = findCloseFoodSuggestions(search, candidateValues);
    }

    const response = apiSuccess({ users, total, take, skip, suggestions });
    response.headers.set("Cache-Control", getCacheControlHeader(0));
    return response;
  } catch (error) {
    return apiInternalError("admin/users/GET", error, "Failed to fetch users");
  }
}
