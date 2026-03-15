import { NextResponse, NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logError } from "@/lib/logger";
import { Food } from "@prisma/client";
import { FoodItem } from "@/app/diary/types";
import {
  findCloseFoodSuggestions,
  sortByRelevanceAndUsage,
} from "../../../../lib/foodSearchSuggestions";
import { findLikelyDuplicateFood } from "@/lib/foodDuplicateDetection";

export type FoodWithCreator = Food & { createdByName?: string };

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
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

    const where = {
      ...(search
        ? {
            OR: [{ name: { contains: search, mode: "insensitive" as const } }],
          }
        : {}),
      ...(!session.user.isAdmin ? { createdBy: session.user.id } : {}),
    };

    const matchingFoods = await prisma.food.findMany({
      where,
      include: {
        creator: {
          select: { name: true },
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
    );

    const total = sortedFoods.length;
    const foodsWithCreator: FoodWithCreator[] = sortedFoods
      .slice(skip, skip + take)
      .map(({ creator, ...food }) => ({
        ...food,
        createdByName: creator?.name || "Unknown",
      }));

    let suggestions: string[] = [];

    if (search && total === 0) {
      const suggestionWhere = {
        ...(!session.user.isAdmin ? { createdBy: session.user.id } : {}),
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

    return NextResponse.json({
      foods: foodsWithCreator,
      total,
      take,
      skip,
      suggestions,
    });
  } catch (error) {
    logError("admin/foods/GET", error);
    return NextResponse.json(
      { error: "Failed to fetch foods" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
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
    } = body as Partial<FoodItem>;

    if (
      !name ||
      typeof name !== "string" ||
      name.trim().length === 0 ||
      name.length > 200
    ) {
      return NextResponse.json({ error: "Invalid food name" }, { status: 400 });
    }
    if (measurementType !== "volume" && measurementType !== "weight") {
      return NextResponse.json(
        { error: "Invalid measurement type" },
        { status: 400 },
      );
    }
    if (
      measurementAmount === undefined ||
      typeof measurementAmount !== "number"
    ) {
      return NextResponse.json(
        { error: "Invalid measurement amount" },
        { status: 400 },
      );
    }
    if (typeof calories !== "number" || calories < 0 || calories > 99999) {
      return NextResponse.json(
        { error: "Invalid calorie value" },
        { status: 400 },
      );
    }
    if (
      typeof protein !== "number" ||
      protein < 0 ||
      typeof carbs !== "number" ||
      carbs < 0 ||
      typeof fat !== "number" ||
      fat < 0 ||
      typeof saturates !== "number" ||
      saturates < 0 ||
      typeof sugars !== "number" ||
      sugars < 0 ||
      typeof fibre !== "number" ||
      fibre < 0 ||
      typeof salt !== "number" ||
      salt < 0
    ) {
      return NextResponse.json(
        { error: "Invalid macro values" },
        { status: 400 },
      );
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
      return NextResponse.json(
        {
          error: `Food appears to be a duplicate of \"${duplicate.name}\". Please review before creating another item.`,
          duplicateFoodId: duplicate.id,
          duplicateFoodName: duplicate.name,
        },
        { status: 409 },
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
        createdBy: session.user.id,
        defaultServingAmount:
          typeof defaultServingAmount === "number" && defaultServingAmount > 0
            ? defaultServingAmount
            : null,
        defaultServingDescription:
          typeof defaultServingDescription === "string" &&
          defaultServingDescription.trim()
            ? defaultServingDescription.trim().slice(0, 50)
            : null,
      },
    });

    return NextResponse.json(newFood);
  } catch (error) {
    logError("admin/foods/POST", error);
    return NextResponse.json(
      { error: "Failed to create food" },
      { status: 500 },
    );
  }
}
