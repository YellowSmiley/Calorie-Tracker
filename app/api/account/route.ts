import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { requireUser } from "@/lib/apiGuards";
import { checkAccountDeleteRateLimit } from "@/lib/rateLimit";
import {
  apiBadRequest,
  apiInternalError,
  apiSuccess,
  apiTooManyRequests,
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

    const allowed = await checkAccountDeleteRateLimit(userId);
    if (!allowed) {
      return apiTooManyRequests();
    }

    const result = await prisma.$transaction(
      async (tx) => {
        // Check if this user is the last admin in the same transaction as delete.
        const existingUser = await tx.user.findUnique({
          where: { id: userId },
          select: { isAdmin: true },
        });

        if (existingUser?.isAdmin) {
          const adminCount = await tx.user.count({
            where: { isAdmin: true },
          });

          if (adminCount <= 1) {
            return { blocked: true as const };
          }
        }

        // Delete the user — Prisma cascade will handle:
        // - Account (onDelete: Cascade)
        // - Session (onDelete: Cascade)
        // - MealEntry (onDelete: Cascade)
        // - Food.createdBy (onDelete: SetNull)
        await tx.user.delete({
          where: { id: userId },
        });

        return { blocked: false as const };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    if (result.blocked) {
      return apiBadRequest(
        "Cannot delete the last admin account. Please assign another admin first.",
        "LAST_ADMIN_DELETE_BLOCKED",
      );
    }

    return apiSuccess({ success: true });
  } catch (error) {
    return apiInternalError(
      "account/DELETE",
      error,
      "Failed to delete account",
    );
  }
}
