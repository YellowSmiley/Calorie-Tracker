import { NextResponse, NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { RateLimiterMemory } from "rate-limiter-flexible";

const mealWriteLimiter = new RateLimiterMemory({
  points: 120,
  duration: 60,
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<unknown> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await mealWriteLimiter.consume(session.user.id);
  } catch {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      { status: 429 },
    );
  }

  const { id } = (await params) as { id: string };
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload" },
      { status: 400 },
    );
  }

  const payload =
    body && typeof body === "object" ? (body as { serving?: unknown }) : {};
  const serving = payload.serving;

  if (typeof serving !== "number" || serving <= 0 || serving > 1000) {
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
      saturates: Number((existing.food.saturates * serving).toFixed(1)),
      sugars: Number((existing.food.sugars * serving).toFixed(1)),
      fibre: Number((existing.food.fibre * serving).toFixed(1)),
      salt: Number((existing.food.salt * serving).toFixed(2)),
    },
    include: { food: true },
  });

  return NextResponse.json({
    item: {
      id: updated.id,
      name: updated.food.name,
      measurementAmount: updated.food.measurementAmount,
      measurementType: updated.food.measurementType,
      calories: updated.calories,
      baseCalories: updated.food.calories,
      serving: updated.serving,
      protein: updated.protein,
      carbs: updated.carbs,
      fat: updated.fat,
      saturates: updated.saturates,
      sugars: updated.sugars,
      fibre: updated.fibre,
      salt: updated.salt,
      baseProtein: updated.food.protein,
      baseCarbs: updated.food.carbs,
      baseFat: updated.food.fat,
      baseSaturates: updated.food.saturates,
      baseSugars: updated.food.sugars,
      baseFibre: updated.food.fibre,
      baseSalt: updated.food.salt,
      defaultServingAmount: updated.food.defaultServingAmount,
      defaultServingDescription: updated.food.defaultServingDescription,
    },
  });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await mealWriteLimiter.consume(session.user.id);
  } catch {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      { status: 429 },
    );
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
