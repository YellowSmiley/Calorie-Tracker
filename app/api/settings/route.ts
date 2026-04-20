import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logError } from "@/lib/logger";
import { settingsPutBodySchema } from "@/lib/apiSchemas";

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

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 },
      );
    }

    const payloadValidation = settingsPutBodySchema.safeParse(body);
    if (!payloadValidation.success) {
      return NextResponse.json(
        { error: "Goal values must be between 0 and the maximum allowed" },
        { status: 400 },
      );
    }

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
    } = payloadValidation.data;

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
