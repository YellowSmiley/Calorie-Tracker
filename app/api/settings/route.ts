import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

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
                calorieUnit: true,
                macroUnit: true,
                weightUnit: true,
                volumeUnit: true,
            },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json(user);
    } catch (error) {
        console.error("Error fetching settings:", error);
        return NextResponse.json(
            { error: "Failed to fetch settings" },
            { status: 500 }
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
        const { calorieGoal, proteinGoal, carbGoal, fatGoal, calorieUnit, macroUnit, weightUnit, volumeUnit } = body;

        // Validate required fields
        if (
            calorieGoal === undefined ||
            proteinGoal === undefined ||
            carbGoal === undefined ||
            fatGoal === undefined
        ) {
            return NextResponse.json(
                { error: "All goal fields are required" },
                { status: 400 }
            );
        }

        // Validate numeric values
        if (
            isNaN(calorieGoal) ||
            isNaN(proteinGoal) ||
            isNaN(carbGoal) ||
            isNaN(fatGoal) ||
            calorieGoal < 0 ||
            proteinGoal < 0 ||
            carbGoal < 0 ||
            fatGoal < 0
        ) {
            return NextResponse.json(
                { error: "Goal values must be positive numbers" },
                { status: 400 }
            );
        }

        const updatedUser = await prisma.user.update({
            where: { id: session.user.id },
            data: {
                calorieGoal: parseFloat(calorieGoal),
                proteinGoal: parseFloat(proteinGoal),
                carbGoal: parseFloat(carbGoal),
                fatGoal: parseFloat(fatGoal),
                calorieUnit: calorieUnit ?? "kcal",
                macroUnit: macroUnit ?? "g",
                weightUnit: weightUnit ?? "g",
                volumeUnit: volumeUnit ?? "ml",
            },
            select: {
                calorieGoal: true,
                proteinGoal: true,
                carbGoal: true,
                fatGoal: true,
                calorieUnit: true,
                macroUnit: true,
                weightUnit: true,
                volumeUnit: true,
            },
        });

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error("Error updating settings:", error);
        return NextResponse.json(
            { error: "Failed to update settings" },
            { status: 500 }
        );
    }
}
