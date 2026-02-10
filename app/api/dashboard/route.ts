import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logError } from "@/lib/logger";

export async function GET(request: NextRequest) {
    const session = await auth();

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const range = searchParams.get("range") || "day";
        const dateString = searchParams.get("date") || new Date().toISOString().split("T")[0];

        const baseDate = new Date(`${dateString}T00:00:00`);
        let start: Date;
        let end: Date;

        if (range === "day") {
            start = new Date(baseDate);
            start.setHours(0, 0, 0, 0);
            end = new Date(baseDate);
            end.setHours(23, 59, 59, 999);
        } else if (range === "week") {
            // Monday to Sunday
            const dayOfWeek = baseDate.getDay();
            const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            start = new Date(baseDate);
            start.setDate(baseDate.getDate() - daysFromMonday);
            start.setHours(0, 0, 0, 0);
            end = new Date(start);
            end.setDate(start.getDate() + 6);
            end.setHours(23, 59, 59, 999);
        } else {
            // Month
            start = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
            start.setHours(0, 0, 0, 0);
            end = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0);
            end.setHours(23, 59, 59, 999);
        }

        const entries = await prisma.mealEntry.findMany({
            where: {
                userId: session.user.id,
                date: {
                    gte: start,
                    lte: end,
                },
            },
            include: {
                food: true,
            },
        });

        const totals = entries.reduce(
            (acc, entry) => {
                const serving = entry.serving || 1;
                acc.calories += entry.food.calories * serving;
                acc.protein += entry.food.protein * serving;
                acc.carbs += entry.food.carbs * serving;
                acc.fat += entry.food.fat * serving;
                return acc;
            },
            { calories: 0, protein: 0, carbs: 0, fat: 0 },
        );

        return NextResponse.json({ totals });
    } catch (error) {
        logError("dashboard/GET", error);
        return NextResponse.json(
            { error: "Failed to fetch dashboard data" },
            { status: 500 },
        );
    }
}
