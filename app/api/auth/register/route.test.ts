/**
 * @jest-environment node
 */
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { POST } from "./route";
import type { Mock } from "jest-mock";

type AsyncMock = Mock<(...args: unknown[]) => Promise<unknown>>;

// Mock dependencies
jest.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: jest.fn(async (operations: unknown[]) =>
      Promise.all(operations),
    ),
    blacklistEntry: {
      findFirst: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    verificationToken: {
      create: jest.fn(),
    },
  },
}));

jest.mock("@/lib/email", () => ({
  sendVerificationEmail: jest.fn(async () => undefined),
}));

jest.mock("bcryptjs", () => ({
  hash: jest.fn(async () => "hashed_password"),
}));

jest.mock("crypto", () => ({
  randomBytes: jest.fn().mockReturnValue({
    toString: () => "mock_token_hex",
  }),
  createHash: jest.fn().mockReturnValue({
    update: jest.fn().mockReturnValue({
      digest: jest.fn().mockReturnValue("mock_token_hashed"),
    }),
  }),
}));

jest.mock("@/lib/rateLimit", () => ({
  checkRegisterRateLimit: jest.fn(async () => null),
}));

import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";
import bcrypt from "bcryptjs";

function makeRequest(body: Record<string, unknown>): Request {
  return new Request("http://localhost/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.blacklistEntry.findFirst as unknown as AsyncMock).mockResolvedValue(
      null,
    );
    (prisma.user.findUnique as unknown as AsyncMock).mockResolvedValue(null);
    (prisma.user.create as unknown as AsyncMock).mockResolvedValue({
      id: "new-user",
    });
    (prisma.verificationToken.create as unknown as AsyncMock).mockResolvedValue(
      {},
    );
  });

  describe("validation", () => {
    it("returns 400 when email is missing", async () => {
      const res = await POST(makeRequest({ password: "password123" }));
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe("Invalid registration payload");
    });

    it("returns 400 when password is missing", async () => {
      const res = await POST(makeRequest({ email: "test@test.com" }));
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe("Invalid registration payload");
    });

    it("returns 400 for invalid email format", async () => {
      const res = await POST(
        makeRequest({ email: "not-an-email", password: "password123" }),
      );
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe("Invalid registration payload");
    });

    it("returns 400 when password is too short", async () => {
      const res = await POST(
        makeRequest({ email: "test@test.com", password: "short" }),
      );
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe("Invalid registration payload");
    });

    it("accepts exactly 8 character password", async () => {
      const res = await POST(
        makeRequest({ email: "test@test.com", password: "12345678" }),
      );

      expect(res.status).toBe(201);
    });
  });

  describe("duplicate check", () => {
    it("returns 201 with generic message when email already exists (no enumeration)", async () => {
      (prisma.user.findUnique as unknown as AsyncMock).mockResolvedValue({
        id: "existing",
      });

      const res = await POST(
        makeRequest({ email: "existing@test.com", password: "password123" }),
      );
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.success).toBe(true);
      // Should NOT call user.create for existing user
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it("normalizes email to lowercase for duplicate check", async () => {
      await POST(
        makeRequest({ email: "TEST@Test.COM", password: "password123" }),
      );

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: "test@test.com" },
      });
    });
  });

  describe("successful registration", () => {
    it("creates user with hashed password", async () => {
      await POST(
        makeRequest({
          name: "John",
          email: "john@test.com",
          password: "password123",
        }),
      );

      expect(bcrypt.hash).toHaveBeenCalledWith("password123", 12);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: "John",
          email: "john@test.com",
          passwordHash: "hashed_password",
        }),
      });
    });

    it("trims name whitespace", async () => {
      await POST(
        makeRequest({
          name: "  John  ",
          email: "john@test.com",
          password: "password123",
        }),
      );

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ name: "John" }),
        }),
      );
    });

    it("sets name to null when not provided", async () => {
      await POST(
        makeRequest({ email: "john@test.com", password: "password123" }),
      );

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ name: null }),
        }),
      );
    });

    it("creates verification token and sends email", async () => {
      await POST(
        makeRequest({ email: "john@test.com", password: "password123" }),
      );

      expect(prisma.verificationToken.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          identifier: "john@test.com",
          token: "mock_token_hashed",
        }),
      });

      expect(sendVerificationEmail).toHaveBeenCalledWith(
        "john@test.com",
        "mock_token_hex",
      );
    });

    it("returns 201 with success message", async () => {
      const res = await POST(
        makeRequest({ email: "john@test.com", password: "password123" }),
      );
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.message).toContain("verification link");
    });
  });

  describe("error handling", () => {
    it("returns 500 when an unexpected error occurs", async () => {
      (prisma.user.findUnique as unknown as AsyncMock).mockRejectedValue(
        new Error("DB down"),
      );

      const res = await POST(
        makeRequest({ email: "john@test.com", password: "password123" }),
      );
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toBe("Something went wrong. Please try again.");
    });
  });
});
