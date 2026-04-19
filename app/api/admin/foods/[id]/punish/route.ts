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

  const food = await prisma.food.findUnique({
    where: { id: foodId },
    select: { id: true, createdBy: true },
  });

  if (!food) {
    return NextResponse.json({ error: "Food not found" }, { status: 404 });
  }

  if (!food.createdBy) {
    return NextResponse.json(
      { error: "Food creator not available for punishment." },
      { status: 400 },
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    const updatedUser = await tx.user.update({
      where: { id: food.createdBy as string },
      data: {
        blackMarks: { increment: 1 },
      },
      select: {
        id: true,
        email: true,
        blackMarks: true,
        lastKnownIp: true,
      },
    });

    const shouldBan = updatedUser.blackMarks >= 3;

    if (shouldBan) {
      await tx.user.update({
        where: { id: updatedUser.id },
        data: {
          isActive: false,
          bannedAt: new Date(),
        },
      });

      if (updatedUser.email) {
        await tx.blacklistEntry.upsert({
          where: {
            entryType_value: {
              entryType: "email",
              value: updatedUser.email.toLowerCase().trim(),
            },
          },
          update: {
            reason: "Auto-blacklisted after 3 moderation marks",
          },
          create: {
            entryType: "email",
            value: updatedUser.email.toLowerCase().trim(),
            reason: "Auto-blacklisted after 3 moderation marks",
          },
        });
      }

      if (updatedUser.lastKnownIp) {
        await tx.blacklistEntry.upsert({
          where: {
            entryType_value: {
              entryType: "ip",
              value: updatedUser.lastKnownIp,
            },
          },
          update: {
            reason: "Auto-blacklisted after 3 moderation marks",
          },
          create: {
            entryType: "ip",
            value: updatedUser.lastKnownIp,
            reason: "Auto-blacklisted after 3 moderation marks",
          },
        });
      }
    }

    return {
      blackMarks: updatedUser.blackMarks,
      banned: shouldBan,
    };
  });

  return NextResponse.json({ success: true, ...result });
}
