import { NextResponse, NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    return NextResponse.json({ foods, total, take, skip });
}

export async function POST(request: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
        name,
        measurement,
        calories,
        protein,
        carbs,
        fat,
        saturates,
        sugars,
        fibre,
        salt,
        defaultServingAmount,
        defaultServingDescription,
    } = body ?? {};

    if (
        !name ||
        typeof name !== "string" ||
        name.trim().length === 0 ||
        name.length > 200
    ) {
        return NextResponse.json({ error: "Invalid food name" }, { status: 400 });
    }
    if (typeof calories !== "number" || calories < 0 || calories > 99999) {
        return NextResponse.json(
            { error: "Invalid calorie value" },
            { status: 400 },
        );
    }
    if (
        measurement &&
        (typeof measurement !== "string" || measurement.length > 100)
    ) {
        return NextResponse.json({ error: "Invalid measurement" }, { status: 400 });
    }

    const food = await prisma.food.create({
        data: {
            name,
            measurement: measurement ?? "",
            calories,
            protein: typeof protein === "number" ? protein : 0,
            carbs: typeof carbs === "number" ? carbs : 0,
            fat: typeof fat === "number" ? fat : 0,
            saturates: typeof saturates === "number" ? saturates : 0,
            sugars: typeof sugars === "number" ? sugars : 0,
            fibre: typeof fibre === "number" ? fibre : 0,
            salt: typeof salt === "number" ? salt : 0,
            defaultServingAmount:
                typeof defaultServingAmount === "number" && defaultServingAmount > 0
                    ? defaultServingAmount
                    : null,
            defaultServingDescription:
                typeof defaultServingDescription === "string" &&
                    defaultServingDescription.trim()
                    ? defaultServingDescription.trim().slice(0, 50)
                    : null,
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
    const {
        id,
        name,
        measurement,
        calories,
        protein,
        carbs,
        fat,
        saturates,
        sugars,
        fibre,
        salt,
        defaultServingAmount,
        defaultServingDescription,
    } = body ?? {};

    if (!id) {
        return NextResponse.json({ error: "Food ID is required" }, { status: 400 });
    }
    if (
        !name ||
        typeof name !== "string" ||
        name.trim().length === 0 ||
        name.length > 200
    ) {
        return NextResponse.json({ error: "Invalid food name" }, { status: 400 });
    }
    if (typeof calories !== "number" || calories < 0 || calories > 99999) {
        return NextResponse.json(
            { error: "Invalid calorie value" },
            { status: 400 },
        );
    }
    if (
        measurement &&
        (typeof measurement !== "string" || measurement.length > 100)
    ) {
        return NextResponse.json({ error: "Invalid measurement" }, { status: 400 });
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
            saturates: typeof saturates === "number" ? saturates : 0,
            sugars: typeof sugars === "number" ? sugars : 0,
            fibre: typeof fibre === "number" ? fibre : 0,
            salt: typeof salt === "number" ? salt : 0,
            defaultServingAmount:
                typeof defaultServingAmount === "number" && defaultServingAmount > 0
                    ? defaultServingAmount
                    : null,
            defaultServingDescription:
                typeof defaultServingDescription === "string" &&
                    defaultServingDescription.trim()
                    ? defaultServingDescription.trim().slice(0, 50)
                    : null,
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
