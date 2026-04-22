import { prisma } from "@/lib/prisma";
import { apiBadRequest, apiInternalError, apiSuccess } from "@/lib/apiResponse";
import { authVerifyQuerySchema } from "@/lib/apiSchemas";
import { hashToken, normalizeEmail } from "@/lib/authSecurityService";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsedQuery = authVerifyQuerySchema.safeParse(
      Object.fromEntries(searchParams.entries()),
    );

    if (!parsedQuery.success) {
      return apiBadRequest("Invalid verification link", "VALIDATION_ERROR", {
        issues: parsedQuery.error.issues,
      });
    }

    const { token, email } = parsedQuery.data;

    const normalizedEmail = normalizeEmail(email);
    const tokenHash = hashToken(token);

    // Look up the verification token by hash
    const record = await prisma.verificationToken.findUnique({
      where: {
        identifier_token: {
          identifier: normalizedEmail,
          token: tokenHash,
        },
      },
    });

    if (!record) {
      return apiBadRequest(
        "Invalid or expired verification link",
        "INVALID_VERIFICATION_LINK",
      );
    }

    if (record.expires < new Date()) {
      // Clean up expired token
      await prisma.verificationToken.delete({
        where: {
          identifier_token: {
            identifier: normalizedEmail,
            token: tokenHash,
          },
        },
      });
      return apiBadRequest(
        "Verification link has expired. Please register again.",
        "VERIFICATION_LINK_EXPIRED",
      );
    }

    // Mark user as verified and delete the token
    await prisma.$transaction([
      prisma.user.update({
        where: { email: normalizedEmail },
        data: { emailVerified: new Date() },
      }),
      prisma.verificationToken.delete({
        where: {
          identifier_token: {
            identifier: normalizedEmail,
            token: tokenHash,
          },
        },
      }),
    ]);

    return apiSuccess({ success: true });
  } catch (error) {
    return apiInternalError(
      "auth/verify/GET",
      error,
      "Something went wrong. Please try again.",
    );
  }
}
