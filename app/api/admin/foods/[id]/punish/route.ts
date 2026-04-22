import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiGuards";
import { checkAdminWriteRateLimit } from "@/lib/rateLimit";
import {
  apiBadRequest,
  apiNotFound,
  apiSuccess,
  apiTooManyRequests,
} from "@/lib/apiResponse";
import {
  adminAuditReasonBodySchema,
  resourceIdParamsSchema,
} from "@/lib/apiSchemas";
import { logAdminAction, getRequestId } from "@/lib/auditService";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<unknown> },
) {
  const guard = await requireAdmin();
  if ("response" in guard) {
    return guard.response;
  }

  const allowed = await checkAdminWriteRateLimit(guard.user.id);
  if (!allowed) {
    return apiTooManyRequests();
  }

  const parsedParams = resourceIdParamsSchema.safeParse(await params);
  if (!parsedParams.success) {
    return apiNotFound("Food not found", "FOOD_NOT_FOUND");
  }

  const { id: foodId } = parsedParams.data;

  let reason: string | undefined;
  try {
    const rawBody = await request.json();
    const parsed = adminAuditReasonBodySchema.safeParse(rawBody);
    if (parsed.success) reason = parsed.data.reason;
  } catch {
    // body is optional
  }
  const requestId = getRequestId(request);

  const food = await prisma.food.findUnique({
    where: { id: foodId },
    select: { id: true, createdBy: true },
  });

  if (!food) {
    return apiNotFound("Food not found", "FOOD_NOT_FOUND");
  }

  if (!food.createdBy) {
    return apiBadRequest(
      "Food creator not available for punishment.",
      "FOOD_CREATOR_UNAVAILABLE",
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    const updatedUser = await tx.user.update({
      where: { id: food.createdBy as string },
      data: {
        blackMarks: { increment: 1 },
      },
      select: {
        id: true,
        email: true,
        blackMarks: true,
        lastKnownIp: true,
      },
    });

    const shouldBan = updatedUser.blackMarks >= 3;

    if (shouldBan) {
      await tx.user.update({
        where: { id: updatedUser.id },
        data: {
          isActive: false,
          bannedAt: new Date(),
        },
      });

      if (updatedUser.email) {
        await tx.blacklistEntry.upsert({
          where: {
            entryType_value: {
              entryType: "email",
              value: updatedUser.email.toLowerCase().trim(),
            },
          },
          update: {
            reason: "Auto-blacklisted after 3 moderation marks",
          },
          create: {
            entryType: "email",
            value: updatedUser.email.toLowerCase().trim(),
            reason: "Auto-blacklisted after 3 moderation marks",
          },
        });
      }

      if (updatedUser.lastKnownIp) {
        await tx.blacklistEntry.upsert({
          where: {
            entryType_value: {
              entryType: "ip",
              value: updatedUser.lastKnownIp,
            },
          },
          update: {
            reason: "Auto-blacklisted after 3 moderation marks",
          },
          create: {
            entryType: "ip",
            value: updatedUser.lastKnownIp,
            reason: "Auto-blacklisted after 3 moderation marks",
          },
        });
      }
    }

    return {
      blackMarks: updatedUser.blackMarks,
      banned: shouldBan,
    };
  });

  await logAdminAction(prisma, {
    actorId: guard.user.id,
    targetType: "user",
    targetId: food.createdBy,
    action: "FOOD_CREATOR_PUNISHED",
    reason,
    requestId,
    metadata: {
      foodId,
      blackMarks: result.blackMarks,
      banned: result.banned,
    },
  });

  return apiSuccess({ success: true, ...result });
}
