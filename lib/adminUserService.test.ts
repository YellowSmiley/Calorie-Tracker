import { applyAdminUserAction } from "./adminUserService";

describe("adminUserService", () => {
  test("addMark blacklists email and ip once user reaches 3 marks", async () => {
    const tx = {
      user: {
        update: jest
          .fn()
          .mockResolvedValueOnce({
            blackMarks: 3,
            email: "test@example.com",
            lastKnownIp: "127.0.0.1",
          })
          .mockResolvedValueOnce({})
          .mockResolvedValueOnce({}),
        findUnique: jest.fn(async () => ({
          id: "u1",
          name: "Test",
          email: "test@example.com",
          isAdmin: false,
          provider: "credentials",
          isActive: false,
          blackMarks: 3,
          bannedAt: new Date(),
        })),
      },
      blacklistEntry: {
        upsert: jest.fn(async () => ({})),
        deleteMany: jest.fn(async () => ({ count: 0 })),
      },
    };

    const prisma = {
      $transaction: jest.fn(
        async (fn: (inner: typeof tx) => Promise<unknown>) => fn(tx),
      ),
    };

    const result = await applyAdminUserAction(
      prisma as never,
      "u1",
      "addMark",
      {
        blackMarks: 2,
        bannedAt: null,
        email: "test@example.com",
        lastKnownIp: "127.0.0.1",
      },
    );

    expect(result?.blackMarks).toBe(3);
    expect(tx.blacklistEntry.upsert).toHaveBeenCalledTimes(2);
  });

  test("clearPunishments removes blacklist entries and resets moderation fields", async () => {
    const tx = {
      user: {
        update: jest.fn(async () => ({})),
        findUnique: jest.fn(async () => ({
          id: "u2",
          name: "User",
          email: "user@example.com",
          isAdmin: false,
          provider: "credentials",
          isActive: true,
          blackMarks: 0,
          bannedAt: null,
        })),
      },
      blacklistEntry: {
        upsert: jest.fn(async () => ({})),
        deleteMany: jest.fn(async () => ({ count: 1 })),
      },
    };

    const prisma = {
      $transaction: jest.fn(
        async (fn: (inner: typeof tx) => Promise<unknown>) => fn(tx),
      ),
    };

    const result = await applyAdminUserAction(
      prisma as never,
      "u2",
      "clearPunishments",
      {
        blackMarks: 3,
        bannedAt: new Date(),
        email: "user@example.com",
        lastKnownIp: "10.0.0.1",
      },
    );

    expect(result?.blackMarks).toBe(0);
    expect(tx.blacklistEntry.deleteMany).toHaveBeenCalledTimes(2);
  });
});
