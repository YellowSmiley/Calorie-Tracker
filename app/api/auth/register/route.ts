import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";
import { checkRegisterRateLimit } from "@/lib/rateLimit";
import bcrypt from "bcryptjs";
import { getClientIp } from "@/lib/blacklist";
import { apiBadRequest, apiInternalError, apiSuccess } from "@/lib/apiResponse";
import { authRegisterBodySchema } from "@/lib/apiSchemas";
import {
  buildTokenExpiry,
  createSecureToken,
  hashToken,
  normalizeEmail,
} from "@/lib/authSecurityService";
import { logAdminAction, getRequestId } from "@/lib/auditService";

const SALT_ROUNDS = 12;
const TOKEN_EXPIRY_HOURS = 24;

const SUCCESS_MESSAGE =
  "If that email is available, you will receive a verification link shortly.";

function successResponse() {
  return apiSuccess({ success: true, message: SUCCESS_MESSAGE }, 201);
}

export async function POST(request: Request) {
  const rateLimited = await checkRegisterRateLimit(request);
  if (rateLimited) return rateLimited;

  try {
    const payload = await request.json();
    const parsedBody = authRegisterBodySchema.safeParse(payload);

    if (!parsedBody.success) {
      return apiBadRequest("Invalid registration payload", "VALIDATION_ERROR", {
        issues: parsedBody.error.issues,
      });
    }

    const { name, email, password } = parsedBody.data;

    const normalizedEmail = normalizeEmail(email);
    const ip = getClientIp(request.headers);

    const emailBlocked = await prisma.blacklistEntry.findFirst({
      where: {
        entryType: "email",
        value: normalizedEmail,
      },
      select: { id: true },
    });

    if (emailBlocked) {
      return successResponse();
    }

    if (ip) {
      const ipBlocked = await prisma.blacklistEntry.findFirst({
        where: {
          entryType: "ip",
          value: ip,
        },
        select: { id: true },
      });

      if (ipBlocked) {
        return successResponse();
      }
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      // Don't reveal that the account exists — return same response as success
      return successResponse();
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Generate verification token
    const token = createSecureToken();
    const tokenHash = hashToken(token);
    const expires = buildTokenExpiry(TOKEN_EXPIRY_HOURS);

    const [newUser] = await prisma.$transaction([
      prisma.user.create({
        data: {
          name: name?.trim() || null,
          email: normalizedEmail,
          passwordHash,
          lastKnownIp: ip,
        },
      }),
      prisma.verificationToken.create({
        data: {
          identifier: normalizedEmail,
          token: tokenHash,
          expires,
        },
      }),
    ]);

    // Send verification email
    await sendVerificationEmail(normalizedEmail, token);

    // Log user registration
    const requestId = getRequestId(request);
    await logAdminAction(prisma, {
      actorId: newUser.id,
      actorRole: "user",
      targetType: "user",
      targetId: newUser.id,
      action: "USER_REGISTERED",
      requestId,
    });

    return successResponse();
  } catch {
    return apiInternalError(
      "auth/register/POST",
      null,
      "Something went wrong. Please try again.",
    );
  }
}
