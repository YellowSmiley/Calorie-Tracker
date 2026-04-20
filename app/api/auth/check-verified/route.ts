import { prisma } from "@/lib/prisma";
import { checkAuthRateLimit } from "@/lib/rateLimit";
import { apiSuccess } from "@/lib/apiResponse";
import { authEmailBodySchema } from "@/lib/apiSchemas";

export async function POST(request: Request) {
  const rateLimited = await checkAuthRateLimit(request);
  if (rateLimited) return rateLimited;

  try {
    const payload = await request.json();
    const parsedBody = authEmailBodySchema.safeParse(payload);

    if (!parsedBody.success) {
      // Add constant-time delay to prevent timing-based enumeration
      await new Promise((resolve) =>
        setTimeout(resolve, 100 + Math.random() * 100),
      );
      return apiSuccess({ unverified: false });
    }

    const { email } = parsedBody.data;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { emailVerified: true, passwordHash: true },
    });

    // Only flag as unverified if the user exists with a password but no verification
    const unverified = !!user && !!user.passwordHash && !user.emailVerified;

    // Constant-time delay to prevent timing-based enumeration
    await new Promise((resolve) =>
      setTimeout(resolve, 100 + Math.random() * 100),
    );

    return apiSuccess({ unverified });
  } catch {
    return apiSuccess({ unverified: false });
  }
}
