import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import { checkAuthRateLimit } from "@/lib/rateLimit";
import { apiBadRequest, apiInternalError, apiSuccess } from "@/lib/apiResponse";
import { authEmailBodySchema } from "@/lib/apiSchemas";
import {
  buildResetTokenIdentifier,
  buildTokenExpiry,
  createSecureToken,
  hashToken,
  normalizeEmail,
} from "@/lib/authSecurityService";

const TOKEN_EXPIRY_HOURS = 1;

export async function POST(request: Request) {
  const rateLimited = await checkAuthRateLimit(request);
  if (rateLimited) return rateLimited;

  try {
    const payload = await request.json();
    const parsedBody = authEmailBodySchema.safeParse(payload);
    if (!parsedBody.success) {
      return apiBadRequest("Invalid email payload", "VALIDATION_ERROR", {
        issues: parsedBody.error.issues,
      });
    }

    const { email } = parsedBody.data;

    const normalizedEmail = normalizeEmail(email);
    const resetIdentifier = buildResetTokenIdentifier(normalizedEmail);

    // Always return success to prevent enumeration
    const successResponse = () =>
      apiSuccess({
        success: true,
        message:
          "If an account exists with that email, a password reset link has been sent.",
      });

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, passwordHash: true },
    });

    // Only send reset email if user exists and has a password (credentials account)
    if (!user || !user.passwordHash) {
      return successResponse();
    }

    // Generate a new reset token
    const token = createSecureToken();
    const tokenHash = hashToken(token);
    const expires = buildTokenExpiry(TOKEN_EXPIRY_HOURS);

    await prisma.$transaction([
      prisma.verificationToken.deleteMany({
        where: { identifier: resetIdentifier },
      }),
      prisma.verificationToken.create({
        data: {
          identifier: resetIdentifier,
          token: tokenHash,
          expires,
        },
      }),
    ]);

    await sendPasswordResetEmail(normalizedEmail, token);

    return successResponse();
  } catch (error) {
    return apiInternalError(
      "auth/forgot-password",
      error,
      "Something went wrong. Please try again.",
    );
  }
}
