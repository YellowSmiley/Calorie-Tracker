import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const VALID_MEAL_TYPES = ["BREAKFAST", "LUNCH", "DINNER", "SNACK"] as const;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const isValidMealType = (
  mealType: string,
): mealType is (typeof VALID_MEAL_TYPES)[number] =>
  VALID_MEAL_TYPES.includes(mealType as (typeof VALID_MEAL_TYPES)[number]);

const getDateRange = (dateString: string) => {
  if (!DATE_REGEX.test(dateString)) {
    throw new Error("Invalid date format");
  }

  const baseDate = new Date(`${dateString}T00:00:00`);
  if (isNaN(baseDate.getTime())) {
    throw new Error("Invalid date");
  }

  const start = new Date(baseDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(baseDate);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { mealType, date } = body ?? {};

  if (!mealType || typeof mealType !== "string" || !isValidMealType(mealType)) {
    return NextResponse.json({ error: "Invalid meal type" }, { status: 400 });
  }

  if (!date || typeof date !== "string") {
    return NextResponse.json({ error: "Date is required" }, { status: 400 });
  }

  let start: Date;
  let end: Date;
  try {
    ({ start, end } = getDateRange(date));
  } catch {
    return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
  }

  await prisma.mealEntry.deleteMany({
    where: {
      userId: session.user.id,
      mealType,
      date: {
        gte: start,
        lte: end,
      },
    },
  });

  return NextResponse.json({ success: true, mealType });
}
