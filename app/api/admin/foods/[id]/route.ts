import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logError } from "@/lib/logger";
import { FoodItem } from "@/app/diary/types";
import { findLikelyDuplicateFood } from "@/lib/foodDuplicateDetection";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<unknown> },
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id: foodId } = (await params) as { id: string };
    const body = (await request.json()) as FoodItem;

    // Validate input (same rules as POST)
    if (
      !body.name ||
      typeof body.name !== "string" ||
      body.name.trim().length === 0 ||
      body.name.length > 200
    ) {
      return NextResponse.json({ error: "Invalid food name" }, { status: 400 });
    }
    if (
      typeof body.calories !== "number" ||
      body.calories < 0 ||
      body.calories > 99999
    ) {
      return NextResponse.json(
        { error: "Invalid calorie value" },
        { status: 400 },
      );
    }
    if (
      body.measurementType &&
      body.measurementType !== "weight" &&
      body.measurementType !== "volume"
    ) {
      return NextResponse.json(
        { error: "Invalid measurement type" },
        { status: 400 },
      );
    }
    if (
      body.measurementAmount !== undefined &&
      typeof body.measurementAmount !== "number"
    ) {
      return NextResponse.json(
        { error: "Invalid measurement amount" },
        { status: 400 },
      );
    }
    if (
      body.protein !== undefined &&
      (typeof body.protein !== "number" || body.protein < 0)
    ) {
      return NextResponse.json(
        { error: "Invalid protein value" },
        { status: 400 },
      );
    }
    if (
      body.carbs !== undefined &&
      (typeof body.carbs !== "number" || body.carbs < 0)
    ) {
      return NextResponse.json(
        { error: "Invalid carbs value" },
        { status: 400 },
      );
    }
    if (
      body.fat !== undefined &&
      (typeof body.fat !== "number" || body.fat < 0)
    ) {
      return NextResponse.json({ error: "Invalid fat value" }, { status: 400 });
    }
    if (
      body.saturates !== undefined &&
      (typeof body.saturates !== "number" || body.saturates < 0)
    ) {
      return NextResponse.json(
        { error: "Invalid saturates value" },
        { status: 400 },
      );
    }
    if (
      body.sugars !== undefined &&
      (typeof body.sugars !== "number" || body.sugars < 0)
    ) {
      return NextResponse.json(
        { error: "Invalid sugars value" },
        { status: 400 },
      );
    }
    if (
      body.fibre !== undefined &&
      (typeof body.fibre !== "number" || body.fibre < 0)
    ) {
      return NextResponse.json(
        { error: "Invalid fibre value" },
        { status: 400 },
      );
    }
    if (
      body.salt !== undefined &&
      (typeof body.salt !== "number" || body.salt < 0)
    ) {
      return NextResponse.json(
        { error: "Invalid salt value" },
        { status: 400 },
      );
    }

    // Ownership check
    const existingFood = await prisma.food.findUnique({
      where: { id: foodId },
    });
    if (!existingFood) {
      return NextResponse.json({ error: "Food not found" }, { status: 404 });
    }
    if (!session.user.isAdmin && existingFood.createdBy !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const mergedFoodForDuplicateCheck = {
      id: foodId,
      name: body.name ?? existingFood.name,
      measurementType: body.measurementType ?? existingFood.measurementType,
      measurementAmount:
        typeof body.measurementAmount === "number"
          ? body.measurementAmount
          : existingFood.measurementAmount,
      calories:
        typeof body.calories === "number"
          ? body.calories
          : existingFood.calories,
      protein:
        typeof body.protein === "number" ? body.protein : existingFood.protein,
      carbs: typeof body.carbs === "number" ? body.carbs : existingFood.carbs,
      fat: typeof body.fat === "number" ? body.fat : existingFood.fat,
      saturates:
        typeof body.saturates === "number"
          ? body.saturates
          : existingFood.saturates,
      sugars:
        typeof body.sugars === "number" ? body.sugars : existingFood.sugars,
      fibre: typeof body.fibre === "number" ? body.fibre : existingFood.fibre,
      salt: typeof body.salt === "number" ? body.salt : existingFood.salt,
    };

    const duplicate = await findLikelyDuplicateFood(
      mergedFoodForDuplicateCheck,
    );
    if (duplicate) {
      return NextResponse.json(
        {
          error: `Food appears to be a duplicate of \"${duplicate.name}\". Please review before saving.`,
          duplicateFoodId: duplicate.id,
          duplicateFoodName: duplicate.name,
        },
        { status: 409 },
      );
    }

    const updated = await prisma.food.update({
      where: { id: foodId },
      data: {
        name: body.name,
        measurementAmount: body.measurementAmount,
        measurementType: body.measurementType,
        calories: body.calories,
        protein: body.protein,
        carbs: body.carbs,
        fat: body.fat,
        saturates: typeof body.saturates === "number" ? body.saturates : 0,
        sugars: typeof body.sugars === "number" ? body.sugars : 0,
        fibre: typeof body.fibre === "number" ? body.fibre : 0,
        salt: typeof body.salt === "number" ? body.salt : 0,
        defaultServingAmount:
          typeof body.defaultServingAmount === "number" &&
          body.defaultServingAmount > 0
            ? body.defaultServingAmount
            : null,
        defaultServingDescription:
          typeof body.defaultServingDescription === "string" &&
          body.defaultServingDescription.trim()
            ? body.defaultServingDescription.trim().slice(0, 50)
            : null,
      },
    });

    const creator = updated.createdBy
      ? await prisma.user.findUnique({
          where: { id: updated.createdBy },
          select: { name: true },
        })
      : null;

    return NextResponse.json({
      ...updated,
      createdByName: creator?.name || "Unknown",
    });
  } catch (error) {
    logError("admin/foods/PUT", error);
    return NextResponse.json(
      { error: "Failed to update food" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<unknown> },
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id: foodId } = (await params) as { id: string };

    // Ownership check
    const existingFood = await prisma.food.findUnique({
      where: { id: foodId },
    });
    console.log({ foodId });
    if (!existingFood) {
      return NextResponse.json({ error: "Food not found" }, { status: 404 });
    }
    if (!session.user.isAdmin && existingFood.createdBy !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    // Delete food (cascade will handle meal entries)
    await prisma.food.delete({
      where: { id: foodId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logError("admin/foods/DELETE", error);
    return NextResponse.json(
      { error: "Failed to delete food" },
      { status: 500 },
    );
  }
}
