import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logError } from "@/lib/logger";

// DELETE /api/account - Delete user account and all associated data
export async function DELETE() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Check if this user is the last admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true },
    });

    if (user?.isAdmin) {
      const adminCount = await prisma.user.count({
        where: { isAdmin: true },
      });

      if (adminCount <= 1) {
        return NextResponse.json(
          {
            error:
              "Cannot delete the last admin account. Please assign another admin first.",
          },
          { status: 400 },
        );
      }
    }

    // Delete the user — Prisma cascade will handle:
    // - Account (onDelete: Cascade)
    // - Session (onDelete: Cascade)
    // - MealEntry (onDelete: Cascade)
    // - Food.createdBy (onDelete: SetNull)
    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logError("account/DELETE", error);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 },
    );
  }
}
