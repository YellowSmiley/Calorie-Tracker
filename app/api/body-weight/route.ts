import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logError } from "@/lib/logger";
import {
  bodyWeightDateQuerySchema,
  bodyWeightPutBodySchema,
} from "@/lib/apiSchemas";

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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const queryValidation = bodyWeightDateQuerySchema.safeParse({
      date: searchParams.get("date") ?? undefined,
    });

    if (!queryValidation.success) {
      return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
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

    return NextResponse.json({ weight: entry?.weight ?? null });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Invalid date")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    logError("body-weight/GET", error);
    return NextResponse.json(
      { error: "Failed to fetch body weight" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 },
      );
    }

    const payloadValidation = bodyWeightPutBodySchema.safeParse(body);
    if (!payloadValidation.success) {
      const firstIssue = payloadValidation.error.issues[0];
      if (firstIssue?.path[0] === "date") {
        return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
      }
      return NextResponse.json(
        { error: "Body weight must be between 0 and 1000 kg" },
        { status: 400 },
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

      return NextResponse.json({ weight: null });
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

    return NextResponse.json({ weight: entry.weight });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Invalid date")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    logError("body-weight/PUT", error);
    return NextResponse.json(
      { error: "Failed to save body weight" },
      { status: 500 },
    );
  }
}
