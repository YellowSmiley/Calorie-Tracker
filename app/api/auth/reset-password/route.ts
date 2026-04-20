import { prisma } from "@/lib/prisma";
import { checkAuthRateLimit } from "@/lib/rateLimit";
import { createHash } from "crypto";
import bcrypt from "bcryptjs";
import { apiBadRequest, apiInternalError, apiSuccess } from "@/lib/apiResponse";
import { authResetPasswordBodySchema } from "@/lib/apiSchemas";

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

    // Password requirements: min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
    const passwordRequirements = [
      {
        regex: /.{8,}/,
        message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
      },
      {
        regex: /[A-Z]/,
        message: "Password must contain at least one uppercase letter",
      },
      {
        regex: /[a-z]/,
        message: "Password must contain at least one lowercase letter",
      },
      { regex: /[0-9]/, message: "Password must contain at least one number" },
      {
        regex: /[^A-Za-z0-9]/,
        message: "Password must contain at least one special character",
      },
    ];
    for (const req of passwordRequirements) {
      if (!req.regex.test(password)) {
        return apiBadRequest(req.message, "WEAK_PASSWORD");
      }
    }

    const normalizedEmail = email.toLowerCase().trim();
    const tokenHash = createHash("sha256").update(token).digest("hex");

    const record = await prisma.verificationToken.findUnique({
      where: {
        identifier_token: {
          identifier: `reset:${normalizedEmail}`,
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
            identifier: `reset:${normalizedEmail}`,
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

    await prisma.$transaction([
      prisma.user.update({
        where: { email: normalizedEmail },
        data: { passwordHash },
      }),
      prisma.verificationToken.delete({
        where: {
          identifier_token: {
            identifier: `reset:${normalizedEmail}`,
            token: tokenHash,
          },
        },
      }),
    ]);

    return apiSuccess({ success: true });
  } catch (error) {
    return apiInternalError(
      "auth/reset-password",
      error,
      "Something went wrong. Please try again.",
    );
  }
}
