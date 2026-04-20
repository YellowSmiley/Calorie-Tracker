import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/apiGuards";
import {
  apiBadRequest,
  apiInternalError,
  apiSuccess,
} from "@/lib/apiResponse";

// DELETE /api/account - Delete user account and all associated data
export async function DELETE() {
  try {
    const guard = await requireUser();
    if ("response" in guard) {
      return guard.response;
    }
    const { user: authUser } = guard;

    const userId = authUser.id;

    // Check if this user is the last admin
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true },
    });

    if (existingUser?.isAdmin) {
      const adminCount = await prisma.user.count({
        where: { isAdmin: true },
      });

      if (adminCount <= 1) {
        return apiBadRequest(
          "Cannot delete the last admin account. Please assign another admin first.",
          "LAST_ADMIN_DELETE_BLOCKED",
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

    return apiSuccess({ success: true });
  } catch (error) {
    return apiInternalError(
      "account/DELETE",
      error,
      "Failed to delete account",
    );
  }
}
