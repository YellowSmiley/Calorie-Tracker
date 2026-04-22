import type { Prisma, PrismaClient } from "@prisma/client";

const AUTO_BLACKLIST_REASON = "Auto-blacklisted after 3 moderation marks";
const SERIALIZABLE_ISOLATION_LEVEL =
  "Serializable" as Prisma.TransactionIsolationLevel;

export type AdminUserAction =
  | "addMark"
  | "removeMark"
  | "activate"
  | "deactivate"
  | "clearPunishments";

export type AdminUserTarget = {
  blackMarks: number;
  bannedAt: Date | null;
  email: string | null;
  lastKnownIp: string | null;
};

export type AdminUserSummary = {
  id: string;
  name: string | null;
  email: string | null;
  isAdmin: boolean;
  provider: string | null;
  isActive: boolean;
  blackMarks: number;
  bannedAt: Date | null;
};

type AdminUserTx = Pick<PrismaClient, "user" | "blacklistEntry">;

type AdminUserPrisma = {
  $transaction: <T>(
    fn: (tx: AdminUserTx) => Promise<T>,
    options?: { isolationLevel?: Prisma.TransactionIsolationLevel },
  ) => Promise<T>;
};

function normalizedEmailValue(email: string | null): string | null {
  if (!email) {
    return null;
  }

  return email.toLowerCase().trim();
}

export async function applyAdminUserAction(
  prisma: AdminUserPrisma,
  userId: string,
  action: AdminUserAction,
  targetUser: AdminUserTarget,
): Promise<AdminUserSummary | null> {
  return prisma.$transaction(
    async (tx) => {
      if (action === "addMark") {
        const marked = await tx.user.update({
          where: { id: userId },
          data: { blackMarks: { increment: 1 } },
          select: { blackMarks: true, email: true, lastKnownIp: true },
        });

        if (marked.blackMarks >= 3) {
          await tx.user.update({
            where: { id: userId },
            data: { isActive: false, bannedAt: new Date() },
          });

          const markedEmail = normalizedEmailValue(marked.email);
          if (markedEmail) {
            await tx.blacklistEntry.upsert({
              where: {
                entryType_value: {
                  entryType: "email",
                  value: markedEmail,
                },
              },
              update: { reason: AUTO_BLACKLIST_REASON },
              create: {
                entryType: "email",
                value: markedEmail,
                reason: AUTO_BLACKLIST_REASON,
              },
            });
          }

          if (marked.lastKnownIp) {
            await tx.blacklistEntry.upsert({
              where: {
                entryType_value: {
                  entryType: "ip",
                  value: marked.lastKnownIp,
                },
              },
              update: { reason: AUTO_BLACKLIST_REASON },
              create: {
                entryType: "ip",
                value: marked.lastKnownIp,
                reason: AUTO_BLACKLIST_REASON,
              },
            });
          }
        }
      }

      if (action === "removeMark") {
        const nextMarks = Math.max(0, targetUser.blackMarks - 1);
        await tx.user.update({
          where: { id: userId },
          data: {
            blackMarks: nextMarks,
            bannedAt: nextMarks < 3 ? null : targetUser.bannedAt,
          },
        });
      }

      if (action === "activate") {
        await tx.user.update({
          where: { id: userId },
          data: { isActive: true },
        });
      }

      if (action === "deactivate") {
        await tx.user.update({
          where: { id: userId },
          data: {
            isActive: false,
            bannedAt: targetUser.bannedAt ?? new Date(),
          },
        });
      }

      if (action === "clearPunishments") {
        await tx.user.update({
          where: { id: userId },
          data: {
            blackMarks: 0,
            bannedAt: null,
            isActive: true,
          },
        });

        const targetEmail = normalizedEmailValue(targetUser.email);
        if (targetEmail) {
          await tx.blacklistEntry.deleteMany({
            where: {
              entryType: "email",
              value: targetEmail,
            },
          });
        }

        if (targetUser.lastKnownIp) {
          await tx.blacklistEntry.deleteMany({
            where: {
              entryType: "ip",
              value: targetUser.lastKnownIp,
            },
          });
        }
      }

      return tx.user.findUnique({
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
        },
      });
    },
    { isolationLevel: SERIALIZABLE_ISOLATION_LEVEL },
  );
}
