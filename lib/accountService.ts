import type { Prisma, PrismaClient } from "@prisma/client";

type AccountDeleteResult = {
  blocked: boolean;
};

type AdminDeleteResult = {
  missing: boolean;
  blocked: boolean;
};

type AccountTx = Pick<PrismaClient, "user">;

type AccountPrisma = {
  $transaction: <T>(
    fn: (tx: AccountTx) => Promise<T>,
    options?: { isolationLevel?: Prisma.TransactionIsolationLevel },
  ) => Promise<T>;
};

const SERIALIZABLE_ISOLATION_LEVEL =
  "Serializable" as Prisma.TransactionIsolationLevel;

export async function deleteAccountWithLastAdminProtection(
  prisma: AccountPrisma,
  userId: string,
): Promise<AccountDeleteResult> {
  return prisma.$transaction(
    async (tx) => {
      const existingUser = await tx.user.findUnique({
        where: { id: userId },
        select: { isAdmin: true },
      });

      if (existingUser?.isAdmin) {
        const adminCount = await tx.user.count({
          where: { isAdmin: true },
        });

        if (adminCount <= 1) {
          return { blocked: true };
        }
      }

      await tx.user.delete({
        where: { id: userId },
      });

      return { blocked: false };
    },
    { isolationLevel: SERIALIZABLE_ISOLATION_LEVEL },
  );
}

export async function deleteUserByAdminWithLastAdminProtection(
  prisma: AccountPrisma,
  userId: string,
): Promise<AdminDeleteResult> {
  return prisma.$transaction(
    async (tx) => {
      const targetUser = await tx.user.findUnique({
        where: { id: userId },
        select: { isAdmin: true },
      });

      if (!targetUser) {
        return { missing: true, blocked: false };
      }

      if (targetUser.isAdmin) {
        const adminCount = await tx.user.count({ where: { isAdmin: true } });
        if (adminCount <= 1) {
          return { missing: false, blocked: true };
        }
      }

      await tx.user.delete({
        where: { id: userId },
      });

      return { missing: false, blocked: false };
    },
    { isolationLevel: SERIALIZABLE_ISOLATION_LEVEL },
  );
}
