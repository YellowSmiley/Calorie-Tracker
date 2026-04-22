import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/apiGuards";
import { checkAccountDeleteRateLimit } from "@/lib/rateLimit";
import { deleteAccountWithLastAdminProtection } from "@/lib/accountService";
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

    const result = await deleteAccountWithLastAdminProtection(prisma, userId);

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
