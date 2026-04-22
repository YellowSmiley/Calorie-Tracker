import {
  deleteAccountWithLastAdminProtection,
  deleteUserByAdminWithLastAdminProtection,
} from "./accountService";

describe("accountService", () => {
  test("deleteAccountWithLastAdminProtection blocks last admin", async () => {
    const tx = {
      user: {
        findUnique: jest.fn(async () => ({ isAdmin: true })),
        count: jest.fn(async () => 1),
        delete: jest.fn(async () => ({})),
      },
    };

    const prisma = {
      $transaction: jest.fn(async (fn: (inner: typeof tx) => Promise<unknown>) =>
        fn(tx),
      ),
    };

    const result = await deleteAccountWithLastAdminProtection(
      prisma as never,
      "user-1",
    );

    expect(result).toEqual({ blocked: true });
    expect(tx.user.delete).not.toHaveBeenCalled();
  });

  test("deleteUserByAdminWithLastAdminProtection deletes non-admin user", async () => {
    const tx = {
      user: {
        findUnique: jest.fn(async () => ({ isAdmin: false })),
        count: jest.fn(async () => 2),
        delete: jest.fn(async () => ({})),
      },
    };

    const prisma = {
      $transaction: jest.fn(async (fn: (inner: typeof tx) => Promise<unknown>) =>
        fn(tx),
      ),
    };

    const result = await deleteUserByAdminWithLastAdminProtection(
      prisma as never,
      "user-2",
    );

    expect(result).toEqual({ missing: false, blocked: false });
    expect(tx.user.delete).toHaveBeenCalledWith({ where: { id: "user-2" } });
  });
});
