import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<unknown> },
) {
  const session = await auth();

  if (!session?.user?.id || !session.user.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: foodId } = (await params) as { id: string };

  const food = await prisma.food.findUnique({ where: { id: foodId } });
  if (!food) {
    return NextResponse.json({ error: "Food not found" }, { status: 404 });
  }

  if (food.isApproved) {
    await prisma.food.update({
      where: { id: foodId },
      data: {
        isApproved: false,
        approvedBy: null,
        approvedAt: null,
      },
    });

    return NextResponse.json({ success: true, isApproved: false });
  }

  await prisma.$transaction([
    prisma.food.update({
      where: { id: foodId },
      data: {
        isApproved: true,
        approvedBy: session.user.id,
        approvedAt: new Date(),
      },
    }),
    prisma.foodReport.updateMany({
      where: {
        foodId,
        isResolved: false,
      },
      data: {
        isResolved: true,
        resolvedBy: session.user.id,
        resolvedAt: new Date(),
      },
    }),
  ]);

  return NextResponse.json({ success: true, isApproved: true });
}
