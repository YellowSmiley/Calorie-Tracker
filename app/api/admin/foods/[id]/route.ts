import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logError } from "@/lib/logger";

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();

    if (!session?.user?.id || !session.user.isAdmin) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id: foodId } = await params;
        const body = await request.json();

        // Validate input (same rules as POST)
        if (!body.name || typeof body.name !== "string" || body.name.trim().length === 0 || body.name.length > 200) {
            return NextResponse.json({ error: "Invalid food name" }, { status: 400 });
        }
        if (typeof body.calories !== "number" || body.calories < 0 || body.calories > 99999) {
            return NextResponse.json({ error: "Invalid calorie value" }, { status: 400 });
        }
        if (body.measurement && (typeof body.measurement !== "string" || body.measurement.length > 100)) {
            return NextResponse.json({ error: "Invalid measurement" }, { status: 400 });
        }
        if (body.protein !== undefined && (typeof body.protein !== "number" || body.protein < 0)) {
            return NextResponse.json({ error: "Invalid protein value" }, { status: 400 });
        }
        if (body.carbs !== undefined && (typeof body.carbs !== "number" || body.carbs < 0)) {
            return NextResponse.json({ error: "Invalid carbs value" }, { status: 400 });
        }
        if (body.fat !== undefined && (typeof body.fat !== "number" || body.fat < 0)) {
            return NextResponse.json({ error: "Invalid fat value" }, { status: 400 });
        }

        const updated = await prisma.food.update({
            where: { id: foodId },
            data: {
                name: body.name,
                measurement: body.measurement,
                calories: body.calories,
                protein: body.protein,
                carbs: body.carbs,
                fat: body.fat,
                defaultServingAmount: typeof body.defaultServingAmount === 'number' && body.defaultServingAmount > 0 ? body.defaultServingAmount : null,
                defaultServingDescription: typeof body.defaultServingDescription === 'string' && body.defaultServingDescription.trim() ? body.defaultServingDescription.trim().slice(0, 50) : null,
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
            { status: 500 }
        );
    }
}

export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();

    if (!session?.user?.id || !session.user.isAdmin) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id: foodId } = await params;

        // Delete food (cascade will handle meal entries)
        await prisma.food.delete({
            where: { id: foodId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        logError("admin/foods/DELETE", error);
        return NextResponse.json(
            { error: "Failed to delete food" },
            { status: 500 }
        );
    }
}
