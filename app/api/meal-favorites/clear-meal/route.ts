import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/apiGuards";
import { checkMealFavoritesWriteRateLimit } from "@/lib/rateLimit";
import { apiBadRequest, apiSuccess, apiTooManyRequests } from "@/lib/apiResponse";
import { mealFavoriteClearMealBodySchema } from "@/lib/apiSchemas";

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

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
  const guard = await requireUser();
  if ("response" in guard) {
    return guard.response;
  }
  const { user } = guard;

  const allowed = await checkMealFavoritesWriteRateLimit(user.id);
  if (!allowed) {
    return apiTooManyRequests();
  }

  const body = await request.json();
  const parsedBody = mealFavoriteClearMealBodySchema.safeParse(body);

  if (!parsedBody.success) {
    return apiBadRequest("Invalid request payload", "VALIDATION_ERROR", {
      issues: parsedBody.error.issues,
    });
  }

  const { mealType, date } = parsedBody.data;

  let start: Date;
  let end: Date;
  try {
    ({ start, end } = getDateRange(date));
  } catch {
    return apiBadRequest("Invalid date format", "INVALID_DATE");
  }

  await prisma.mealEntry.deleteMany({
    where: {
      userId: user.id,
      mealType,
      date: {
        gte: start,
        lte: end,
      },
    },
  });

  return apiSuccess({ success: true, mealType });
}
