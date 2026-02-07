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
    const { name, measurement, calories, protein, carbs, fat } = body ?? {};

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
        },
    });

    return NextResponse.json({ food });
}
