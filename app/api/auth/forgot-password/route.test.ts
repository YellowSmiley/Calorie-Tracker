/**
 * @jest-environment node
 */
import { describe, expect, test, jest, beforeEach } from "@jest/globals";

jest.mock("@/lib/rateLimit", () => ({
  checkAuthRateLimit: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    verificationToken: {
      deleteMany: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

jest.mock("@/lib/email", () => ({
  sendPasswordResetEmail: jest.fn(),
}));

jest.mock("@/lib/authSecurityService", () => ({
  normalizeEmail: jest.fn((email: string) => email.toLowerCase()),
  buildResetTokenIdentifier: jest.fn((email) => `reset_${email}`),
  createSecureToken: jest.fn(() => "secure_token_123"),
  hashToken: jest.fn((token) => `hash_of_${token}`),
  buildTokenExpiry: jest.fn(() => new Date(Date.now() + 3600000)),
}));

import { POST } from "./route";
import { checkAuthRateLimit } from "@/lib/rateLimit";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";

const mockCheckAuthRateLimit =
  checkAuthRateLimit as jest.MockedFunction<typeof checkAuthRateLimit>;
const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockSendPasswordResetEmail =
  sendPasswordResetEmail as jest.MockedFunction<typeof sendPasswordResetEmail>;

describe("POST /api/auth/forgot-password", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns 429 when rate limit is exceeded", async () => {
    const rateLimitResponse = new Response(null, { status: 429 });
    mockCheckAuthRateLimit.mockResolvedValue(rateLimitResponse as never);

    const request = {
      json: async () => ({ email: "test@example.com" }),
    } as unknown as Request;

    const response = await POST(request);

    expect(response.status).toBe(429);
  });

  test("returns 400 when email is missing", async () => {
    mockCheckAuthRateLimit.mockResolvedValue(false as never);

    const request = {
      json: async () => ({}),
    } as unknown as Request;

    const response = await POST(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.code).toBe("VALIDATION_ERROR");
  });

  test("returns 400 when email format is invalid", async () => {
    mockCheckAuthRateLimit.mockResolvedValue(false as never);

    const request = {
      json: async () => ({ email: "not-an-email" }),
    } as unknown as Request;

    const response = await POST(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.code).toBe("VALIDATION_ERROR");
  });

  test("returns success (enumeration protection) when user not found", async () => {
    mockCheckAuthRateLimit.mockResolvedValue(false as never);
    mockPrisma.user.findUnique.mockResolvedValue(null);

    const request = {
      json: async () => ({ email: "nonexistent@example.com" }),
    } as unknown as Request;

    const response = await POST(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.data.success).toBe(true);
    expect(data.data.message).toContain("If an account exists");
  });

  test("returns success when user has OAuth-only account", async () => {
    mockCheckAuthRateLimit.mockResolvedValue(false as never);
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user-oauth",
      passwordHash: null,
    } as never);

    const request = {
      json: async () => ({ email: "oauth-user@example.com" }),
    } as unknown as Request;

    const response = await POST(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.data.success).toBe(true);
    // Email should NOT be sent for OAuth accounts
    expect(mockSendPasswordResetEmail).not.toHaveBeenCalled();
  });

  test("creates reset token and sends email for credentials account", async () => {
    mockCheckAuthRateLimit.mockResolvedValue(false as never);
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user-creds",
      passwordHash: "$2a$10$hashedpassword",
    } as never);
    mockPrisma.$transaction.mockResolvedValue([{ count: 0 }, { id: "token1" }]);

    const request = {
      json: async () => ({ email: "user@example.com" }),
    } as unknown as Request;

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(mockPrisma.$transaction).toHaveBeenCalled();
    expect(mockSendPasswordResetEmail).toHaveBeenCalledWith(
      "user@example.com",
      "secure_token_123",
    );
    const data = await response.json();
    expect(data.data.success).toBe(true);
  });
});
