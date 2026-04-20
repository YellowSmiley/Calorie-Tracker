import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { containsBlockedLanguage } from "@/lib/foodModeration";
import { RateLimiterMemory } from "rate-limiter-flexible";
import { foodReportBodySchema } from "@/lib/apiSchemas";

const reportLimiter = new RateLimiterMemory({
  points: 10,
  duration: 60,
});

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await reportLimiter.consume(session.user.id);
  } catch {
    return NextResponse.json(
      { error: "Too many report attempts. Please try again shortly." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload." },
      { status: 400 },
    );
  }

  const payloadValidation = foodReportBodySchema.safeParse(body);
  if (!payloadValidation.success) {
    return NextResponse.json(
      { error: "Food id is required." },
      { status: 400 },
    );
  }

  const { foodId, reason } = payloadValidation.data;
  const normalizedReason = reason ?? "";

  if (normalizedReason && containsBlockedLanguage(normalizedReason)) {
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
      reason: normalizedReason || null,
    },
  });

  return NextResponse.json({ success: true, alreadyReported: false });
}
