import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { requireAdmin } from "@/lib/apiGuards";
import { checkAdminWriteRateLimit } from "@/lib/rateLimit";
import { deleteUserByAdminWithLastAdminProtection } from "@/lib/accountService";
import { applyAdminUserAction } from "@/lib/adminUserService";
import {
  apiBadRequest,
  apiInternalError,
  apiNotFound,
  apiSuccess,
  apiTooManyRequests,
} from "@/lib/apiResponse";
import {
  adminUserPatchBodySchema,
  resourceIdParamsSchema,
} from "@/lib/apiSchemas";

async function selectUserForAdmin(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      isAdmin: true,
      provider: true,
      isActive: true,
      blackMarks: true,
      bannedAt: true,
      lastKnownIp: true,
    },
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<unknown> },
) {
  const guard = await requireAdmin();
  if ("response" in guard) {
    return guard.response;
  }
  const { user } = guard;

  const allowed = await checkAdminWriteRateLimit(user.id);
  if (!allowed) {
    return apiTooManyRequests();
  }

  try {
    const parsedParams = resourceIdParamsSchema.safeParse(await params);
    if (!parsedParams.success) {
      return apiNotFound("User not found", "USER_NOT_FOUND");
    }

    const { id: userId } = parsedParams.data;

    const parsedBody = adminUserPatchBodySchema.safeParse(await request.json());
    if (!parsedBody.success) {
      return apiBadRequest("Invalid update payload", "VALIDATION_ERROR", {
        issues: parsedBody.error.issues,
      });
    }

    const body = parsedBody.data;

    if (body.action) {
      const targetUser = await selectUserForAdmin(userId);

      if (!targetUser) {
        return apiNotFound("User not found", "USER_NOT_FOUND");
      }

      if (
        (body.action === "deactivate" || body.action === "addMark") &&
        userId === user.id
      ) {
        return apiBadRequest(
          "You cannot punish or deactivate your own account.",
          "SELF_PUNISH_BLOCKED",
        );
      }

      const updatedUser = await applyAdminUserAction(
        prisma,
        userId,
        body.action,
        {
          blackMarks: targetUser.blackMarks,
          bannedAt: targetUser.bannedAt,
          email: targetUser.email,
          lastKnownIp: targetUser.lastKnownIp,
        },
      );

      if (!updatedUser) {
        return apiNotFound("User not found", "USER_NOT_FOUND");
      }

      return apiSuccess({ success: true, user: updatedUser });
    }

    const { name, email, password } = body;

    const updateData: { name?: string; email?: string; passwordHash?: string } =
      {};
    if (typeof name === "string") updateData.name = name;
    if (typeof email === "string") updateData.email = email;
    if (typeof password === "string" && password.length >= 8) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    if (Object.keys(updateData).length === 0) {
      return apiBadRequest("No valid fields to update", "NO_VALID_FIELDS");
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        isAdmin: true,
        provider: true,
        isActive: true,
        blackMarks: true,
        bannedAt: true,
      },
    });

    return apiSuccess({ success: true, user: updatedUser });
  } catch (error) {
    return apiInternalError(
      "admin/users/PATCH",
      error,
      "Failed to update user",
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<unknown> },
) {
  const guard = await requireAdmin();
  if ("response" in guard) {
    return guard.response;
  }
  const { user } = guard;

  const allowed = await checkAdminWriteRateLimit(user.id);
  if (!allowed) {
    return apiTooManyRequests();
  }

  try {
    const parsedParams = resourceIdParamsSchema.safeParse(await params);
    if (!parsedParams.success) {
      return apiNotFound("User not found", "USER_NOT_FOUND");
    }

    const { id: userId } = parsedParams.data;

    // Prevent admin from deleting themselves
    if (userId === user.id) {
      return apiBadRequest(
        "Cannot delete your own account",
        "SELF_DELETE_BLOCKED",
      );
    }

    const result = await deleteUserByAdminWithLastAdminProtection(
      prisma,
      userId,
    );

    if (result.missing) {
      return apiNotFound("User not found", "USER_NOT_FOUND");
    }

    if (result.blocked) {
      return apiBadRequest(
        "Cannot delete the last admin",
        "LAST_ADMIN_DELETE_BLOCKED",
      );
    }

    return apiSuccess({ success: true });
  } catch (error) {
    return apiInternalError(
      "admin/users/DELETE",
      error,
      "Failed to delete user",
    );
  }
}
