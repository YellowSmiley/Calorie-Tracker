import { NextResponse, NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { serving } = body ?? {};

    if (typeof serving !== "number" || serving <= 0) {
        return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const existing = await prisma.mealEntry.findFirst({
        where: { id, userId: session.user.id },
        include: { food: true },
    });

    if (!existing) {
        return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    const updated = await prisma.mealEntry.update({
        where: { id: existing.id },
        data: {
            serving,
            calories: Number((existing.food.calories * serving).toFixed(1)),
            protein: Number((existing.food.protein * serving).toFixed(1)),
            carbs: Number((existing.food.carbs * serving).toFixed(1)),
            fat: Number((existing.food.fat * serving).toFixed(1)),
        },
        include: { food: true },
    });

    return NextResponse.json({
        item: {
            id: updated.id,
            name: updated.food.name,
            measurement: updated.food.measurement,
            calories: updated.calories,
            baseCalories: updated.food.calories,
            serving: updated.serving,
            protein: updated.protein,
            carbs: updated.carbs,
            fat: updated.fat,
            baseProtein: updated.food.protein,
            baseCarbs: updated.food.carbs,
            baseFat: updated.food.fat,
        },
    });
}

export async function DELETE(
    { params }: { params: Promise<{ id: string }> },
) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const existing = await prisma.mealEntry.findFirst({
        where: { id, userId: session.user.id },
    });

    if (!existing) {
        return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    await prisma.mealEntry.delete({
        where: { id: existing.id },
    });

    return NextResponse.json({ success: true });
}
