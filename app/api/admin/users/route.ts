import { NextResponse, NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logError } from "@/lib/logger";
import { findCloseFoodSuggestions } from "../../../../lib/foodSearchSuggestions";

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id || !session.user.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const take = Math.min(
      parseInt(searchParams.get("take") || "50") || 50,
      200,
    );
    const skip = parseInt(searchParams.get("skip") || "0") || 0;

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

    return NextResponse.json({ users, total, take, skip, suggestions });
  } catch (error) {
    logError("admin/users/GET", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 },
    );
  }
}
