import { NextResponse, NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    const session = await auth();

    if (!session?.user?.id || !session.user.isAdmin) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get("search") || "";
        const take = Math.min(parseInt(searchParams.get("take") || "50") || 50, 200);
        const skip = parseInt(searchParams.get("skip") || "0") || 0;

        const where = search
            ? {
                OR: [
                    { name: { contains: search, mode: "insensitive" as const } },
                    { measurement: { contains: search, mode: "insensitive" as const } },
                ],
            }
            : {};

        const [foods, total] = await Promise.all([
            prisma.food.findMany({
                where,
                orderBy: { name: "asc" },
                take,
                skip,
            }),
            prisma.food.count({ where }),
        ]);

        // Fetch creator names separately
        const foodsWithCreator = await Promise.all(
            foods.map(async (food) => {
                const creator = food.createdBy
                    ? await prisma.user.findUnique({
                        where: { id: food.createdBy },
                        select: { name: true },
                    })
                    : null;
                return {
                    ...food,
                    createdByName: creator?.name || "Unknown",
                };
            })
        );

        return NextResponse.json({ foods: foodsWithCreator, total, take, skip });
    } catch (error) {
        console.error("Error fetching foods:", error);
        return NextResponse.json(
            { error: "Failed to fetch foods" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    const session = await auth();

    if (!session?.user?.id || !(session.user).isAdmin) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { name, measurement, calories, protein, carbs, fat, defaultServingAmount, defaultServingDescription } = body;

        if (!name || !measurement || calories === undefined || protein === undefined || carbs === undefined || fat === undefined) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const newFood = await prisma.food.create({
            data: {
                name,
                measurement,
                calories,
                protein,
                carbs,
                fat,
                createdBy: session.user.id,
                defaultServingAmount: typeof defaultServingAmount === 'number' && defaultServingAmount > 0 ? defaultServingAmount : null,
                defaultServingDescription: typeof defaultServingDescription === 'string' && defaultServingDescription.trim() ? defaultServingDescription.trim().slice(0, 50) : null,
            },
        });

        return NextResponse.json(newFood);
    } catch (error) {
        console.error("Error creating food:", error);
        return NextResponse.json(
            { error: "Failed to create food" },
            { status: 500 }
        );
    }
}
