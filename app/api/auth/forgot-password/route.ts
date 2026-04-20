import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import { checkAuthRateLimit } from "@/lib/rateLimit";
import crypto, { createHash } from "crypto";
import { apiBadRequest, apiInternalError, apiSuccess } from "@/lib/apiResponse";
import { authEmailBodySchema } from "@/lib/apiSchemas";

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

    const normalizedEmail = email.toLowerCase().trim();

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

    // Delete any existing reset tokens for this user
    await prisma.verificationToken.deleteMany({
      where: { identifier: `reset:${normalizedEmail}` },
    });

    // Generate a new reset token
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const expires = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

    await prisma.verificationToken.create({
      data: {
        identifier: `reset:${normalizedEmail}`,
        token: tokenHash,
        expires,
      },
    });

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
