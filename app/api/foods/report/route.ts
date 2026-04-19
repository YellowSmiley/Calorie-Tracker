import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { containsBlockedLanguage } from "@/lib/foodModeration";

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { foodId?: string; reason?: string };
  const foodId = (body.foodId || "").trim();
  const reason = (body.reason || "").trim();

  if (!foodId) {
    return NextResponse.json({ error: "Food id is required." }, { status: 400 });
  }

  if (reason.length > 250) {
    return NextResponse.json(
      { error: "Report reason must be 250 characters or fewer." },
      { status: 400 },
    );
  }

  if (reason && containsBlockedLanguage(reason)) {
    return NextResponse.json(
      { error: "Report reason contains blocked language." },
      { status: 400 },
    );
  }

  const food = await prisma.food.findUnique({
    where: { id: foodId },
    select: { id: true, createdBy: true },
  });

  if (!food) {
    return NextResponse.json({ error: "Food not found." }, { status: 404 });
  }

  if (food.createdBy === session.user.id) {
    return NextResponse.json(
      { error: "You cannot report your own food item." },
      { status: 400 },
    );
  }

  const existing = await prisma.foodReport.findFirst({
    where: {
      foodId,
      reportedBy: session.user.id,
      isResolved: false,
    },
    select: { id: true },
  });

  if (existing) {
    return NextResponse.json({ success: true, alreadyReported: true });
  }

  await prisma.foodReport.create({
    data: {
      foodId,
      reportedBy: session.user.id,
      reason: reason || null,
    },
  });

  return NextResponse.json({ success: true, alreadyReported: false });
}
