import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const mealOrder = ["BREAKFAST", "LUNCH", "DINNER", "SNACK"] as const;

const getDateRange = (dateString?: string | null) => {
    const baseDate = dateString ? new Date(`${dateString}T00:00:00`) : new Date();
    const start = new Date(baseDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(baseDate);
    end.setHours(23, 59, 59, 999);
    return { start, end };
};

export async function GET(request: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const { start, end } = getDateRange(date);

    const entries = (await prisma.mealEntry.findMany({
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
        orderBy: { createdAt: "asc" },
    })) as Array<{
        id: string;
        mealType: string;
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
        serving: number;
        food: {
            name: string;
            measurement: string;
            calories: number;
            protein: number;
            carbs: number;
            fat: number;
            defaultServingAmount: number | null;
            defaultServingDescription: string | null;
        };
    }>;

    const meals = mealOrder.map((type) => ({
        name: type[0] + type.slice(1).toLowerCase(),
        items: entries
            .filter((entry) => entry.mealType === type)
            .map((entry) => ({
                id: entry.id,
                name: entry.food.name,
                measurement: entry.food.measurement,
                calories: entry.calories,
                baseCalories: entry.food.calories,
                serving: entry.serving,
                protein: entry.protein,
                carbs: entry.carbs,
                fat: entry.fat,
                baseProtein: entry.food.protein,
                baseCarbs: entry.food.carbs,
                baseFat: entry.food.fat,
                defaultServingAmount: entry.food.defaultServingAmount,
                defaultServingDescription: entry.food.defaultServingDescription,
            })),
    }));

    return NextResponse.json({ meals });
}

export async function POST(request: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { mealType, foodId, serving, date } = body ?? {};

    if (!mealType || !foodId) {
        return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const food = await prisma.food.findUnique({
        where: { id: foodId },
    });

    if (!food) {
        return NextResponse.json({ error: "Food not found" }, { status: 404 });
    }

    const servingValue = typeof serving === "number" && serving > 0 ? serving : 1;
    const mealDate = date ? new Date(`${date}T00:00:00`) : new Date();

    const entry = await prisma.mealEntry.create({
        data: {
            userId: session.user.id,
            foodId: food.id,
            mealType,
            date: mealDate,
            serving: servingValue,
            calories: Number((food.calories * servingValue).toFixed(1)),
            protein: Number((food.protein * servingValue).toFixed(1)),
            carbs: Number((food.carbs * servingValue).toFixed(1)),
            fat: Number((food.fat * servingValue).toFixed(1)),
        },
        include: {
            food: true,
        },
    });

    return NextResponse.json({
        item: {
            id: entry.id,
            name: entry.food.name,
            measurement: entry.food.measurement,
            calories: entry.calories,
            baseCalories: entry.food.calories,
            serving: entry.serving,
            protein: entry.protein,
            carbs: entry.carbs,
            fat: entry.fat,
            baseProtein: entry.food.protein,
            baseCarbs: entry.food.carbs,
            baseFat: entry.food.fat,
            defaultServingAmount: entry.food.defaultServingAmount,
            defaultServingDescription: entry.food.defaultServingDescription,
        },
    });
}
