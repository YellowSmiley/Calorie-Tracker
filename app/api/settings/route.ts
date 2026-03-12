import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logError } from "@/lib/logger";

// GET /api/settings - Get user settings
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        calorieGoal: true,
        proteinGoal: true,
        carbGoal: true,
        fatGoal: true,
        saturatesGoal: true,
        sugarsGoal: true,
        fibreGoal: true,
        saltGoal: true,
        calorieUnit: true,
        weightUnit: true,
        bodyWeightUnit: true,
        volumeUnit: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    logError("settings/GET", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 },
    );
  }
}

// PUT /api/settings - Update user settings
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      calorieGoal,
      proteinGoal,
      carbGoal,
      fatGoal,
      saturatesGoal,
      sugarsGoal,
      fibreGoal,
      saltGoal,
      calorieUnit,
      weightUnit,
      bodyWeightUnit,
      volumeUnit,
    } = body;

    // Validate required fields
    if (
      calorieGoal === undefined ||
      proteinGoal === undefined ||
      carbGoal === undefined ||
      fatGoal === undefined ||
      saturatesGoal === undefined ||
      sugarsGoal === undefined ||
      fibreGoal === undefined ||
      saltGoal === undefined
    ) {
      return NextResponse.json(
        { error: "All goal fields are required" },
        { status: 400 },
      );
    }

    // Validate numeric values with upper bounds
    const MAX_CALORIE_GOAL = 99999;
    const MAX_MACRO_GOAL = 9999;

    if (
      isNaN(calorieGoal) ||
      isNaN(proteinGoal) ||
      isNaN(carbGoal) ||
      isNaN(fatGoal) ||
      calorieGoal < 0 ||
      calorieGoal > MAX_CALORIE_GOAL ||
      proteinGoal < 0 ||
      proteinGoal > MAX_MACRO_GOAL ||
      carbGoal < 0 ||
      carbGoal > MAX_MACRO_GOAL ||
      fatGoal < 0 ||
      fatGoal > MAX_MACRO_GOAL ||
      saturatesGoal < 0 ||
      saturatesGoal > MAX_MACRO_GOAL ||
      sugarsGoal < 0 ||
      sugarsGoal > MAX_MACRO_GOAL ||
      fibreGoal < 0 ||
      fibreGoal > MAX_MACRO_GOAL ||
      saltGoal < 0 ||
      saltGoal > MAX_MACRO_GOAL
    ) {
      return NextResponse.json(
        { error: "Goal values must be between 0 and the maximum allowed" },
        { status: 400 },
      );
    }

    // Validate unit enum values
    const VALID_CALORIE_UNITS = ["kcal", "kJ"];
    const VALID_WEIGHT_UNITS = ["g", "kg", "oz", "lbs", "mg"];
    const VALID_BODY_WEIGHT_UNITS = ["kg", "lbs"];
    const VALID_VOLUME_UNITS = ["ml", "cup", "tbsp", "tsp", "L"];

    if (calorieUnit && !VALID_CALORIE_UNITS.includes(calorieUnit)) {
      return NextResponse.json(
        { error: "Invalid calorie unit" },
        { status: 400 },
      );
    }
    if (weightUnit && !VALID_WEIGHT_UNITS.includes(weightUnit)) {
      return NextResponse.json(
        { error: "Invalid weight unit" },
        { status: 400 },
      );
    }
    if (bodyWeightUnit && !VALID_BODY_WEIGHT_UNITS.includes(bodyWeightUnit)) {
      return NextResponse.json(
        { error: "Invalid body weight unit" },
        { status: 400 },
      );
    }
    if (volumeUnit && !VALID_VOLUME_UNITS.includes(volumeUnit)) {
      return NextResponse.json(
        { error: "Invalid volume unit" },
        { status: 400 },
      );
    }
    if (
      saturatesGoal !== undefined &&
      (isNaN(saturatesGoal) ||
        saturatesGoal < 0 ||
        saturatesGoal > MAX_MACRO_GOAL)
    ) {
      return NextResponse.json(
        { error: "Invalid saturates goal" },
        { status: 400 },
      );
    }
    if (
      sugarsGoal !== undefined &&
      (isNaN(sugarsGoal) || sugarsGoal < 0 || sugarsGoal > MAX_MACRO_GOAL)
    ) {
      return NextResponse.json(
        { error: "Invalid sugars goal" },
        { status: 400 },
      );
    }
    if (
      fibreGoal !== undefined &&
      (isNaN(fibreGoal) || fibreGoal < 0 || fibreGoal > MAX_MACRO_GOAL)
    ) {
      return NextResponse.json(
        { error: "Invalid fibre goal" },
        { status: 400 },
      );
    }
    if (
      saltGoal !== undefined &&
      (isNaN(saltGoal) || saltGoal < 0 || saltGoal > MAX_MACRO_GOAL)
    ) {
      return NextResponse.json({ error: "Invalid salt goal" }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        calorieGoal: parseFloat(calorieGoal),
        proteinGoal: parseFloat(proteinGoal),
        carbGoal: parseFloat(carbGoal),
        fatGoal: parseFloat(fatGoal),
        saturatesGoal:
          saturatesGoal !== undefined ? parseFloat(saturatesGoal) : undefined,
        sugarsGoal:
          sugarsGoal !== undefined ? parseFloat(sugarsGoal) : undefined,
        fibreGoal: fibreGoal !== undefined ? parseFloat(fibreGoal) : undefined,
        saltGoal: saltGoal !== undefined ? parseFloat(saltGoal) : undefined,
        calorieUnit: calorieUnit ?? "kcal",
        weightUnit: weightUnit ?? "g",
        bodyWeightUnit: bodyWeightUnit ?? "kg",
        volumeUnit: volumeUnit ?? "ml",
      },
      select: {
        calorieGoal: true,
        proteinGoal: true,
        carbGoal: true,
        fatGoal: true,
        saturatesGoal: true,
        sugarsGoal: true,
        fibreGoal: true,
        saltGoal: true,
        calorieUnit: true,
        weightUnit: true,
        bodyWeightUnit: true,
        volumeUnit: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    logError("settings/PUT", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 },
    );
  }
}
