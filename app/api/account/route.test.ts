/**
 * @jest-environment node
 */
import { beforeEach, describe, expect, test, jest } from "@jest/globals";

jest.mock("@/lib/apiGuards", () => ({
  requireUser: jest.fn(),
}));

jest.mock("@/lib/rateLimit", () => ({
  checkAccountDeleteRateLimit: jest.fn(),
}));

jest.mock("@/lib/accountService", () => ({
  deleteAccountWithLastAdminProtection: jest.fn(),
}));

jest.mock("@/lib/auditService", () => ({
  logAdminAction: jest.fn(),
  getRequestId: jest.fn(),
}));

import { DELETE } from "./route";
import { requireUser } from "@/lib/apiGuards";
import { checkAccountDeleteRateLimit } from "@/lib/rateLimit";
import { deleteAccountWithLastAdminProtection } from "@/lib/accountService";
import { logAdminAction, getRequestId } from "@/lib/auditService";

const mockRequireUser = requireUser as jest.MockedFunction<typeof requireUser>;
const mockCheckAccountDeleteRateLimit =
  checkAccountDeleteRateLimit as jest.MockedFunction<
    typeof checkAccountDeleteRateLimit
  >;
const mockDeleteAccountWithLastAdminProtection =
  deleteAccountWithLastAdminProtection as jest.MockedFunction<
    typeof deleteAccountWithLastAdminProtection
  >;
const mockLogAdminAction = logAdminAction as jest.MockedFunction<
  typeof logAdminAction
>;
const mockGetRequestId = getRequestId as jest.MockedFunction<
  typeof getRequestId
>;

const mockRequest = { headers: new Headers() } as Request;

describe("DELETE /api/account", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetRequestId.mockReturnValue(undefined);
  });

  test("returns 401 when requireUser guard fails", async () => {
    mockRequireUser.mockResolvedValue({
      response: { status: 401 } as never,
    });

    const response = await DELETE(mockRequest);

    expect(response.status).toBe(401);
  });

  test("returns 429 when rate limit is exceeded", async () => {
    mockRequireUser.mockResolvedValue({
      user: { id: "user-123", isAdmin: false },
    });
    mockCheckAccountDeleteRateLimit.mockResolvedValue(false);

    const response = await DELETE(mockRequest);

    expect(response.status).toBe(429);
  });

  test("returns 400 when trying to delete last admin account", async () => {
    mockRequireUser.mockResolvedValue({
      user: { id: "user-123", isAdmin: false },
    });
    mockCheckAccountDeleteRateLimit.mockResolvedValue(true);
    mockDeleteAccountWithLastAdminProtection.mockResolvedValue({
      blocked: true,
    });

    const response = await DELETE(mockRequest);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.code).toBe("LAST_ADMIN_DELETE_BLOCKED");
    expect(data.message).toContain("Cannot delete the last admin account");
  });

  test("successfully deletes user account and logs action", async () => {
    mockRequireUser.mockResolvedValue({
      user: { id: "user-123", isAdmin: false },
    });
    mockCheckAccountDeleteRateLimit.mockResolvedValue(true);
    mockDeleteAccountWithLastAdminProtection.mockResolvedValue({
      blocked: false,
    });

    const response = await DELETE(mockRequest);

    expect(response.status).toBe(200);
    expect(mockDeleteAccountWithLastAdminProtection).toHaveBeenCalledWith(
      expect.anything(),
      "user-123",
    );
    expect(mockLogAdminAction).toHaveBeenCalledWith(expect.anything(), {
      actorId: "user-123",
      actorRole: "user",
      targetType: "user",
      targetId: "user-123",
      action: "ACCOUNT_DELETION_INITIATED",
      requestId: undefined,
    });
    const data = await response.json();
    expect(data.data.success).toBe(true);
  });
});
