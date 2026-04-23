import { prisma } from "@/lib/prisma";
import { checkAuthRateLimit } from "@/lib/rateLimit";
import bcrypt from "bcryptjs";
import { apiBadRequest, apiInternalError, apiSuccess } from "@/lib/apiResponse";
import { authResetPasswordBodySchema } from "@/lib/apiSchemas";
import {
  buildResetTokenIdentifier,
  getWeakPasswordMessage,
  hashToken,
  normalizeEmail,
} from "@/lib/authSecurityService";
import { logAdminAction, getRequestId } from "@/lib/auditService";

const SALT_ROUNDS = 12;
const MIN_PASSWORD_LENGTH = 8;

export async function POST(request: Request) {
  const rateLimited = await checkAuthRateLimit(request);
  if (rateLimited) return rateLimited;

  try {
    const payload = await request.json();
    const parsedBody = authResetPasswordBodySchema.safeParse(payload);
    if (!parsedBody.success) {
      return apiBadRequest("Invalid reset payload", "VALIDATION_ERROR", {
        issues: parsedBody.error.issues,
      });
    }

    const { email, token, password } = parsedBody.data;

    const weakPasswordMessage = getWeakPasswordMessage(
      password,
      MIN_PASSWORD_LENGTH,
    );
    if (weakPasswordMessage) {
      return apiBadRequest(weakPasswordMessage, "WEAK_PASSWORD");
    }

    const normalizedEmail = normalizeEmail(email);
    const resetIdentifier = buildResetTokenIdentifier(normalizedEmail);
    const tokenHash = hashToken(token);

    const record = await prisma.verificationToken.findUnique({
      where: {
        identifier_token: {
          identifier: resetIdentifier,
          token: tokenHash,
        },
      },
    });

    if (!record) {
      return apiBadRequest(
        "Invalid or expired reset link",
        "INVALID_RESET_LINK",
      );
    }

    if (record.expires < new Date()) {
      await prisma.verificationToken.delete({
        where: {
          identifier_token: {
            identifier: resetIdentifier,
            token: tokenHash,
          },
        },
      });
      return apiBadRequest(
        "Reset link has expired. Please request a new one.",
        "RESET_LINK_EXPIRED",
      );
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const [updatedUser] = await prisma.$transaction([
      prisma.user.update({
        where: { email: normalizedEmail },
        data: { passwordHash },
        select: { id: true },
      }),
      prisma.verificationToken.delete({
        where: {
          identifier_token: {
            identifier: resetIdentifier,
            token: tokenHash,
          },
        },
      }),
    ]);

    // Log password reset completion
    const requestId = getRequestId(request);
    await logAdminAction(prisma, {
      actorId: updatedUser.id,
      actorRole: "user",
      targetType: "user",
      targetId: updatedUser.id,
      action: "PASSWORD_RESET_COMPLETED",
      requestId,
    });

    return apiSuccess({ success: true });
  } catch (error) {
    return apiInternalError(
      "auth/reset-password",
      error,
      "Something went wrong. Please try again.",
    );
  }
}
