import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  bodyWeightDateQuerySchema,
  bodyWeightPutBodySchema,
} from "@/lib/apiSchemas";
import {
  apiBadRequest,
  apiInternalError,
  apiSuccess,
  apiUnauthorized,
} from "@/lib/apiResponse";

const getEntryDate = (dateString?: string | null) => {
  const safeDate = dateString || new Date().toISOString().split("T")[0];

  const date = new Date(`${safeDate}T00:00:00`);
  if (isNaN(date.getTime())) {
    throw new Error("Invalid date");
  }

  date.setHours(0, 0, 0, 0);
  return date;
};

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return apiUnauthorized();
    }

    const { searchParams } = new URL(request.url);
    const queryValidation = bodyWeightDateQuerySchema.safeParse({
      date: searchParams.get("date") ?? undefined,
    });

    if (!queryValidation.success) {
      return apiBadRequest("Invalid date format", "INVALID_DATE");
    }

    const date = getEntryDate(queryValidation.data.date);

    const entry = await prisma.weightEntry.findUnique({
      where: {
        userId_date: {
          userId: session.user.id,
          date,
        },
      },
      select: { weight: true },
    });

    return apiSuccess({ weight: entry?.weight ?? null });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Invalid date")) {
      return apiBadRequest(error.message, "INVALID_DATE");
    }

    return apiInternalError(
      "body-weight/GET",
      error,
      "Failed to fetch body weight",
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return apiUnauthorized();
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return apiBadRequest("Invalid JSON payload", "INVALID_JSON");
    }

    const payloadValidation = bodyWeightPutBodySchema.safeParse(body);
    if (!payloadValidation.success) {
      const firstIssue = payloadValidation.error.issues[0];
      if (firstIssue?.path[0] === "date") {
        return apiBadRequest("Invalid date format", "INVALID_DATE");
      }
      return apiBadRequest(
        "Body weight must be between 0 and 1000 kg",
        "INVALID_BODY_WEIGHT",
      );
    }

    const { date: rawDate, weight } = payloadValidation.data;
    const date = getEntryDate(rawDate);

    if (weight === null || weight === undefined) {
      await prisma.weightEntry.deleteMany({
        where: {
          userId: session.user.id,
          date,
        },
      });

      return apiSuccess({ weight: null });
    }

    const entry = await prisma.weightEntry.upsert({
      where: {
        userId_date: {
          userId: session.user.id,
          date,
        },
      },
      create: {
        userId: session.user.id,
        date,
        weight,
      },
      update: {
        weight,
      },
      select: {
        weight: true,
      },
    });

    return apiSuccess({ weight: entry.weight });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Invalid date")) {
      return apiBadRequest(error.message, "INVALID_DATE");
    }

    return apiInternalError(
      "body-weight/PUT",
      error,
      "Failed to save body weight",
    );
  }
}
