/**
 * @jest-environment node
 */
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  jest,
  test,
} from "@jest/globals";
import {
  getRequestId,
  logAdminAction,
  userActionToAuditAction,
  type LogAuditParams,
} from "./auditService";

const mockEntry = {
  id: "audit-1",
  occurredAt: new Date("2026-04-22T10:00:00.000Z"),
};

function makeDb() {
  return {
    auditLog: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      create: jest.fn((_args: any) => Promise.resolve(mockEntry)),
    },
  };
}

describe("logAdminAction", () => {
  let consoleSpy: ReturnType<typeof jest.spyOn>;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  test("creates an audit log record with required fields", async () => {
    const db = makeDb();
    const params: LogAuditParams = {
      actorId: "admin-1",
      targetType: "food",
      targetId: "food-1",
      action: "FOOD_APPROVED",
    };

    await logAdminAction(db as never, params);

    expect(db.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actorId: "admin-1",
        actorRole: "admin",
        targetType: "food",
        targetId: "food-1",
        action: "FOOD_APPROVED",
      }),
    });
  });

  test("defaults actorRole to 'admin' when not specified", async () => {
    const db = makeDb();
    await logAdminAction(db as never, {
      actorId: "admin-1",
      targetType: "food",
      targetId: "food-1",
      action: "FOOD_APPROVED",
    });

    expect(db.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ actorRole: "admin" }),
    });
  });

  test("persists reason and metadata when provided", async () => {
    const db = makeDb();
    await logAdminAction(db as never, {
      actorId: "admin-1",
      targetType: "user",
      targetId: "user-1",
      action: "USER_MARK_ADDED",
      reason: "Spamming invalid foods",
      metadata: { blackMarks: 1, banned: false },
    });

    expect(db.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        reason: "Spamming invalid foods",
        metadata: { blackMarks: 1, banned: false },
      }),
    });
  });

  test("stores null reason when not provided", async () => {
    const db = makeDb();
    await logAdminAction(db as never, {
      actorId: "admin-1",
      targetType: "food",
      targetId: "food-1",
      action: "FOOD_UNAPPROVED",
    });

    expect(db.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ reason: null }),
    });
  });

  test("emits structured JSON to console with required fields", async () => {
    const db = makeDb();
    await logAdminAction(db as never, {
      actorId: "admin-1",
      targetType: "food",
      targetId: "food-1",
      action: "FOOD_APPROVED",
      requestId: "iad1::abc-123",
    });

    expect(consoleSpy).toHaveBeenCalledTimes(1);
    const raw = consoleSpy.mock.calls[0][0] as string;
    const parsed = JSON.parse(raw);

    expect(parsed.level).toBe("info");
    expect(parsed.event).toBe("audit");
    expect(parsed.auditId).toBe("audit-1");
    expect(parsed.actorId).toBe("admin-1");
    expect(parsed.action).toBe("FOOD_APPROVED");
    expect(parsed.requestId).toBe("iad1::abc-123");
    expect(typeof parsed.occurredAt).toBe("string");
  });

  test("omits optional fields from console output when absent", async () => {
    const db = makeDb();
    await logAdminAction(db as never, {
      actorId: "admin-1",
      targetType: "food",
      targetId: "food-1",
      action: "FOOD_REPORTS_RESOLVED",
    });

    const raw = consoleSpy.mock.calls[0][0] as string;
    const parsed = JSON.parse(raw);

    expect("reason" in parsed).toBe(false);
    expect("metadata" in parsed).toBe(false);
    expect("requestId" in parsed).toBe(false);
  });
});

describe("getRequestId", () => {
  test("returns the x-vercel-id header value", () => {
    const request = new Request("https://example.com", {
      headers: { "x-vercel-id": "iad1::xyz-123" },
    });
    expect(getRequestId(request)).toBe("iad1::xyz-123");
  });

  test("returns undefined when header is absent", () => {
    const request = new Request("https://example.com");
    expect(getRequestId(request)).toBeUndefined();
  });
});

describe("userActionToAuditAction", () => {
  test.each([
    ["addMark", "USER_MARK_ADDED"],
    ["removeMark", "USER_MARK_REMOVED"],
    ["activate", "USER_ACTIVATED"],
    ["deactivate", "USER_DEACTIVATED"],
    ["clearPunishments", "USER_PUNISHMENTS_CLEARED"],
  ] as const)("maps '%s' → '%s'", (action, expected) => {
    expect(userActionToAuditAction(action)).toBe(expected);
  });
});
