import type { Prisma, PrismaClient } from "@prisma/client";

type AuditDb = { auditLog: PrismaClient["auditLog"] };

export const AUDIT_ACTIONS = [
  "FOOD_APPROVED",
  "FOOD_UNAPPROVED",
  "FOOD_CREATOR_PUNISHED",
  "FOOD_REPORTS_RESOLVED",
  "USER_MARK_ADDED",
  "USER_MARK_REMOVED",
  "USER_ACTIVATED",
  "USER_DEACTIVATED",
  "USER_PUNISHMENTS_CLEARED",
  "USER_DELETED_BY_ADMIN",
  "USER_PROFILE_UPDATED",
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export type AuditTargetType = "food" | "user";

export type AuditRole = "admin" | "user";

export type LogAuditParams = {
  actorId: string;
  actorRole?: AuditRole;
  targetType: AuditTargetType;
  targetId: string;
  action: AuditAction;
  reason?: string;
  metadata?: Record<string, unknown>;
  requestId?: string;
};

export async function logAdminAction(
  db: AuditDb,
  params: LogAuditParams,
): Promise<void> {
  const {
    actorId,
    actorRole = "admin",
    targetType,
    targetId,
    action,
    reason,
    metadata,
    requestId,
  } = params;

  const entry = await db.auditLog.create({
    data: {
      actorId,
      actorRole,
      targetType,
      targetId,
      action,
      reason: reason ?? null,
      requestId: requestId ?? null,
      ...(metadata !== undefined
        ? { metadata: metadata as Prisma.InputJsonValue }
        : {}),
    },
  });

  // Structured JSON — Vercel captures and indexes stdout automatically
  console.log(
    JSON.stringify({
      level: "info",
      event: "audit",
      auditId: entry.id,
      actorId,
      actorRole,
      targetType,
      targetId,
      action,
      ...(reason ? { reason } : {}),
      ...(metadata ? { metadata } : {}),
      ...(requestId ? { requestId } : {}),
      occurredAt: entry.occurredAt.toISOString(),
    }),
  );
}

/**
 * Extract the Vercel request correlation ID from headers.
 * Returns undefined outside of Vercel deployments.
 */
export function getRequestId(request: Request): string | undefined {
  return (
    (request.headers as Headers | undefined)?.get("x-vercel-id") ?? undefined
  );
}

const USER_ACTION_TO_AUDIT: Record<string, AuditAction> = {
  addMark: "USER_MARK_ADDED",
  removeMark: "USER_MARK_REMOVED",
  activate: "USER_ACTIVATED",
  deactivate: "USER_DEACTIVATED",
  clearPunishments: "USER_PUNISHMENTS_CLEARED",
};

export function userActionToAuditAction(action: string): AuditAction {
  return USER_ACTION_TO_AUDIT[action] ?? "USER_MARK_ADDED";
}
