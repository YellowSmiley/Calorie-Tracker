import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const foods = await prisma.food.findMany({
        orderBy: { name: "asc" },
    });

    return NextResponse.json({ foods });
}

export async function POST(request: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, measurement, calories, protein, carbs, fat, defaultServingAmount, defaultServingDescription } = body ?? {};

    if (!name || typeof calories !== "number") {
        return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const food = await prisma.food.create({
        data: {
            name,
            measurement: measurement ?? "",
            calories,
            protein: typeof protein === "number" ? protein : 0,
            carbs: typeof carbs === "number" ? carbs : 0,
            fat: typeof fat === "number" ? fat : 0,
            defaultServingAmount: typeof defaultServingAmount === "number" && defaultServingAmount > 0 ? defaultServingAmount : null,
            defaultServingDescription: typeof defaultServingDescription === "string" && defaultServingDescription.trim() ? defaultServingDescription.trim().slice(0, 50) : null,
            createdBy: session.user.id,
        },
    });

    return NextResponse.json({ food });
}

export async function PUT(request: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, measurement, calories, protein, carbs, fat, defaultServingAmount, defaultServingDescription } = body ?? {};

    if (!id || !name || typeof calories !== "number") {
        return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // Verify the food belongs to the current user
    const existingFood = await prisma.food.findUnique({
        where: { id },
    });

    if (!existingFood) {
        return NextResponse.json({ error: "Food not found" }, { status: 404 });
    }

    if (existingFood.createdBy !== session.user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Update the food
    const food = await prisma.food.update({
        where: { id },
        data: {
            name,
            measurement: measurement ?? "",
            calories,
            protein: typeof protein === "number" ? protein : 0,
            carbs: typeof carbs === "number" ? carbs : 0,
            fat: typeof fat === "number" ? fat : 0,
            defaultServingAmount: typeof defaultServingAmount === "number" && defaultServingAmount > 0 ? defaultServingAmount : null,
            defaultServingDescription: typeof defaultServingDescription === "string" && defaultServingDescription.trim() ? defaultServingDescription.trim().slice(0, 50) : null,
        },
    });

    return NextResponse.json(food);
}

export async function DELETE(request: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id } = body ?? {};

    if (!id) {
        return NextResponse.json({ error: "Food ID is required" }, { status: 400 });
    }

    // Verify the food belongs to the current user
    const food = await prisma.food.findUnique({
        where: { id },
    });

    if (!food) {
        return NextResponse.json({ error: "Food not found" }, { status: 404 });
    }

    if (food.createdBy !== session.user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Delete the food
    await prisma.food.delete({
        where: { id },
    });

    return NextResponse.json({ success: true });
}
