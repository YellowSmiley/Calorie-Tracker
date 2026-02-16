import { NextResponse, NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

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

  const [foods, total] = await Promise.all([
    prisma.food.findMany({
      where,
      orderBy: { name: "asc" },
      take,
      skip,
    }),
    prisma.food.count({ where }),
  ]);

  return NextResponse.json({ foods, total, take, skip });
}
