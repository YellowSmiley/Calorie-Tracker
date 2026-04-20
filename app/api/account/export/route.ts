import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logError } from "@/lib/logger";

// GET /api/account/export - Export all user data (GDPR Subject Access Request)
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        isAdmin: true,
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

    const mealEntries = await prisma.mealEntry.findMany({
      where: { userId },
      select: {
        id: true,
        mealType: true,
        date: true,
        serving: true,
        calories: true,
        protein: true,
        carbs: true,
        fat: true,
        saturates: true,
        sugars: true,
        fibre: true,
        salt: true,
        createdAt: true,
        food: {
          select: {
            name: true,
            measurementType: true,
            measurementAmount: true,
          },
        },
      },
      orderBy: { date: "desc" },
    });

    const createdFoods = await prisma.food.findMany({
      where: { createdBy: userId },
      select: {
        id: true,
        name: true,
        measurementType: true,
        measurementAmount: true,
        calories: true,
        protein: true,
        carbs: true,
        fat: true,
        saturates: true,
        sugars: true,
        fibre: true,
        salt: true,
        defaultServingAmount: true,
        defaultServingDescription: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const accounts = await prisma.account.findMany({
      where: { userId },
      select: {
        provider: true,
        type: true,
        providerAccountId: true,
      },
    });

    const weightEntries = await prisma.weightEntry.findMany({
      where: { userId },
      select: {
        date: true,
        weight: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { date: "desc" },
    });

    const exportData = {
      exportedAt: new Date().toISOString(),
      profile: user,
      connectedAccounts: accounts.map((a) => ({
        provider: a.provider,
        type: a.type,
      })),
      mealEntries: mealEntries.map((entry) => ({
        date: entry.date,
        mealType: entry.mealType,
        foodName: entry.food.name,
        foodMeasurementAmount: entry.food.measurementAmount,
        foodMeasurementType: entry.food.measurementType,
        serving: entry.serving,
        calories: entry.calories,
        protein: entry.protein,
        carbs: entry.carbs,
        fat: entry.fat,
        saturates: entry.saturates,
        sugars: entry.sugars,
        fibre: entry.fibre,
        salt: entry.salt,
        createdAt: entry.createdAt,
      })),
      weightEntries,
      createdFoods,
    };

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="calorie-tracker-data-export-${new Date().toISOString().slice(0, 10)}.json"`,
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        Pragma: "no-cache",
      },
    });
  } catch (error) {
    logError("account/export/GET", error);
    return NextResponse.json(
      { error: "Failed to export data" },
      { status: 500 },
    );
  }
}
