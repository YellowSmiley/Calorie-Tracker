/**
 * @jest-environment node
 */
import { beforeEach, describe, expect, test, jest } from "@jest/globals";

jest.mock("@/lib/apiGuards", () => ({
  requireAdmin: jest.fn(),
}));

jest.mock("@/lib/rateLimit", () => ({
  checkAdminWriteRateLimit: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock("@/lib/adminUserService", () => ({
  applyAdminUserAction: jest.fn(),
}));

jest.mock("@/lib/accountService", () => ({
  deleteUserByAdminWithLastAdminProtection: jest.fn(),
}));

jest.mock("bcryptjs", () => ({
  hash: jest.fn(() => Promise.resolve("hashed_password")),
}));

import { PATCH, DELETE } from "./route";
import { requireAdmin } from "@/lib/apiGuards";
import { checkAdminWriteRateLimit } from "@/lib/rateLimit";
import { prisma } from "@/lib/prisma";
import { applyAdminUserAction } from "@/lib/adminUserService";
import { deleteUserByAdminWithLastAdminProtection } from "@/lib/accountService";
import bcrypt from "bcryptjs";

const mockRequireAdmin = requireAdmin as jest.MockedFunction<
  typeof requireAdmin
>;
const mockCheckAdminWriteRateLimit =
  checkAdminWriteRateLimit as jest.MockedFunction<
    typeof checkAdminWriteRateLimit
  >;
const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockApplyAdminUserAction = applyAdminUserAction as jest.MockedFunction<
  typeof applyAdminUserAction
>;
const mockDeleteUserByAdminWithLastAdminProtection =
  deleteUserByAdminWithLastAdminProtection as jest.MockedFunction<
    typeof deleteUserByAdminWithLastAdminProtection
  >;
const mockBcryptHash = bcrypt.hash as jest.MockedFunction<typeof bcrypt.hash>;

const mockUser = {
  id: "user-123",
  name: "Test User",
  email: "test@test.com",
  isAdmin: false,
  provider: "credentials",
  isActive: true,
  blackMarks: 0,
  bannedAt: null,
  lastKnownIp: "192.168.1.1",
};

const mockAdminUser = {
  id: "admin-123",
  email: "admin@test.com",
  isAdmin: true,
};

describe("PATCH /api/admin/users/[id]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns 401 when requireAdmin guard fails", async () => {
    mockRequireAdmin.mockResolvedValue({
      response: { status: 401 } as never,
    });

    const request = {
      json: async () => ({ name: "Updated Name" }),
    } as unknown as Request;

    const response = await PATCH(request, {
      params: Promise.resolve({ id: "user-123" }),
    });

    expect(response.status).toBe(401);
  });

  test("returns 429 when rate limit is exceeded", async () => {
    mockRequireAdmin.mockResolvedValue({
      user: mockAdminUser,
    });
    mockCheckAdminWriteRateLimit.mockResolvedValue(false);

    const request = {
      json: async () => ({ name: "Updated Name" }),
    } as unknown as Request;

    const response = await PATCH(request, {
      params: Promise.resolve({ id: "user-123" }),
    });

    expect(response.status).toBe(429);
  });

  test("returns 404 when user ID param is invalid", async () => {
    mockRequireAdmin.mockResolvedValue({
      user: mockAdminUser,
    });
    mockCheckAdminWriteRateLimit.mockResolvedValue(true);

    const request = {
      json: async () => ({ name: "Updated Name" }),
    } as unknown as Request;

    const response = await PATCH(request, {
      params: Promise.resolve({ id: "" }), // Invalid empty id
    });

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.code).toBe("USER_NOT_FOUND");
  });

  test("returns 400 when trying to self-punish with addMark action", async () => {
    mockRequireAdmin.mockResolvedValue({
      user: { ...mockAdminUser, id: "user-123" },
    });
    mockCheckAdminWriteRateLimit.mockResolvedValue(true);
    mockPrisma.user.findUnique.mockResolvedValue(mockUser as never);

    const request = {
      json: async () => ({ action: "addMark" }),
    } as unknown as Request;

    const response = await PATCH(request, {
      params: Promise.resolve({ id: "user-123" }),
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.code).toBe("SELF_PUNISH_BLOCKED");
  });

  test("returns 400 when trying to self-deactivate", async () => {
    mockRequireAdmin.mockResolvedValue({
      user: { ...mockAdminUser, id: "user-123" },
    });
    mockCheckAdminWriteRateLimit.mockResolvedValue(true);
    mockPrisma.user.findUnique.mockResolvedValue(mockUser as never);

    const request = {
      json: async () => ({ action: "deactivate" }),
    } as unknown as Request;

    const response = await PATCH(request, {
      params: Promise.resolve({ id: "user-123" }),
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.code).toBe("SELF_PUNISH_BLOCKED");
  });

  test("successfully applies admin action to user", async () => {
    mockRequireAdmin.mockResolvedValue({
      user: mockAdminUser,
    });
    mockCheckAdminWriteRateLimit.mockResolvedValue(true);
    mockPrisma.user.findUnique.mockResolvedValue(mockUser as never);
    mockApplyAdminUserAction.mockResolvedValue({
      ...mockUser,
      blackMarks: 1,
    } as never);

    const request = {
      json: async () => ({ action: "addMark" }),
    } as unknown as Request;

    const response = await PATCH(request, {
      params: Promise.resolve({ id: "user-123" }),
    });

    expect(response.status).toBe(200);
    expect(mockApplyAdminUserAction).toHaveBeenCalledWith(
      expect.anything(),
      "user-123",
      "addMark",
      expect.any(Object),
    );
    const data = await response.json();
    expect(data.data.success).toBe(true);
  });

  test("successfully updates user name", async () => {
    mockRequireAdmin.mockResolvedValue({
      user: mockAdminUser,
    });
    mockCheckAdminWriteRateLimit.mockResolvedValue(true);
    mockPrisma.user.update.mockResolvedValue({
      ...mockUser,
      name: "New Name",
    } as never);

    const request = {
      json: async () => ({ name: "New Name" }),
    } as unknown as Request;

    const response = await PATCH(request, {
      params: Promise.resolve({ id: "user-123" }),
    });

    expect(response.status).toBe(200);
    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { name: "New Name" },
      }),
    );
  });

  test("successfully updates user password", async () => {
    mockRequireAdmin.mockResolvedValue({
      user: mockAdminUser,
    });
    mockCheckAdminWriteRateLimit.mockResolvedValue(true);
    mockBcryptHash.mockImplementation(() => Promise.resolve("hashed_password"));
    mockPrisma.user.update.mockResolvedValue({
      ...mockUser,
      passwordHash: "hashed_password",
    } as never);

    const request = {
      json: async () => ({ password: "newPassword123" }),
    } as unknown as Request;

    const response = await PATCH(request, {
      params: Promise.resolve({ id: "user-123" }),
    });

    expect(response.status).toBe(200);
    expect(mockBcryptHash).toHaveBeenCalledWith("newPassword123", 10);
  });

  test("successfully updates user email", async () => {
    mockRequireAdmin.mockResolvedValue({
      user: mockAdminUser,
    });
    mockCheckAdminWriteRateLimit.mockResolvedValue(true);
    mockPrisma.user.update.mockResolvedValue({
      ...mockUser,
      email: "newemail@test.com",
    } as never);

    const request = {
      json: async () => ({ email: "newemail@test.com" }),
    } as unknown as Request;

    const response = await PATCH(request, {
      params: Promise.resolve({ id: "user-123" }),
    });

    expect(response.status).toBe(200);
    expect(mockPrisma.user.update).toHaveBeenCalled();
  });
});

describe("DELETE /api/admin/users/[id]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns 401 when requireAdmin guard fails", async () => {
    mockRequireAdmin.mockResolvedValue({
      response: { status: 401 } as never,
    });

    const response = await DELETE({} as Request, {
      params: Promise.resolve({ id: "user-123" }),
    });

    expect(response.status).toBe(401);
  });

  test("returns 429 when rate limit is exceeded", async () => {
    mockRequireAdmin.mockResolvedValue({
      user: mockAdminUser,
    });
    mockCheckAdminWriteRateLimit.mockResolvedValue(false);

    const response = await DELETE({} as Request, {
      params: Promise.resolve({ id: "user-123" }),
    });

    expect(response.status).toBe(429);
  });

  test("returns 400 when trying to delete own account", async () => {
    mockRequireAdmin.mockResolvedValue({
      user: { ...mockAdminUser, id: "user-123" },
    });
    mockCheckAdminWriteRateLimit.mockResolvedValue(true);

    const response = await DELETE({} as Request, {
      params: Promise.resolve({ id: "user-123" }),
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.code).toBe("SELF_DELETE_BLOCKED");
  });

  test("returns 404 when target user not found", async () => {
    mockRequireAdmin.mockResolvedValue({
      user: mockAdminUser,
    });
    mockCheckAdminWriteRateLimit.mockResolvedValue(true);
    mockDeleteUserByAdminWithLastAdminProtection.mockResolvedValue({
      missing: true,
      blocked: false,
    });

    const response = await DELETE({} as Request, {
      params: Promise.resolve({ id: "nonexistent-user" }),
    });

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.code).toBe("USER_NOT_FOUND");
  });

  test("returns 400 when trying to delete last admin", async () => {
    mockRequireAdmin.mockResolvedValue({
      user: mockAdminUser,
    });
    mockCheckAdminWriteRateLimit.mockResolvedValue(true);
    mockDeleteUserByAdminWithLastAdminProtection.mockResolvedValue({
      blocked: true,
      missing: false,
    });

    const response = await DELETE({} as Request, {
      params: Promise.resolve({ id: "user-123" }),
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.code).toBe("LAST_ADMIN_DELETE_BLOCKED");
  });

  test("successfully deletes user account", async () => {
    mockRequireAdmin.mockResolvedValue({
      user: mockAdminUser,
    });
    mockCheckAdminWriteRateLimit.mockResolvedValue(true);
    mockDeleteUserByAdminWithLastAdminProtection.mockResolvedValue({
      missing: false,
      blocked: false,
    });

    const response = await DELETE({} as Request, {
      params: Promise.resolve({ id: "user-123" }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.data.success).toBe(true);
  });
});
