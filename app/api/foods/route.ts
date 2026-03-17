import { NextResponse, NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  findCloseFoodSuggestions,
  sortByRelevanceAndUsage,
} from "../../../lib/foodSearchSuggestions";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const take = Math.min(parseInt(searchParams.get("take") || "50") || 50, 200);
  const skip = parseInt(searchParams.get("skip") || "0") || 0;

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
  );

  const total = sortedFoods.length;
  const foods = sortedFoods
    .slice(skip, skip + take)
    .map(({ _count, usageCount, ...food }) => {
      void _count;
      void usageCount;
      return food;
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

  return NextResponse.json({ foods, total, take, skip, suggestions });
}
