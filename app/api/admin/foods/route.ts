import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const session = await auth();

    if (!session?.user?.id || !session.user.isAdmin) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const foods = await prisma.food.findMany({
            orderBy: { name: "asc" },
        });

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

        return NextResponse.json(foodsWithCreator);
    } catch (error) {
        console.error("Error fetching foods:", error);
        return NextResponse.json(
            { error: "Failed to fetch foods" },
            { status: 500 }
        );
    }
}
