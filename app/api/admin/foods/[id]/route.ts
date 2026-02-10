import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

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
        console.error("Error updating food:", error);
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
        console.error("Error deleting food:", error);
        return NextResponse.json(
            { error: "Failed to delete food" },
            { status: 500 }
        );
    }
}
