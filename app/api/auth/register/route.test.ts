/**
 * @jest-environment node
 */
import { POST } from "./route";

// Mock dependencies
jest.mock("@/lib/prisma", () => ({
    prisma: {
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
    sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("bcryptjs", () => ({
    hash: jest.fn().mockResolvedValue("hashed_password"),
}));

jest.mock("crypto", () => ({
    randomBytes: jest.fn().mockReturnValue({
        toString: () => "mock_token_hex",
    }),
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
        (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
        (prisma.user.create as jest.Mock).mockResolvedValue({ id: "new-user" });
        (prisma.verificationToken.create as jest.Mock).mockResolvedValue({});
    });

    describe("validation", () => {
        it("returns 400 when email is missing", async () => {
            const res = await POST(makeRequest({ password: "password123" }));
            const data = await res.json();

            expect(res.status).toBe(400);
            expect(data.error).toBe("Email and password are required");
        });

        it("returns 400 when password is missing", async () => {
            const res = await POST(makeRequest({ email: "test@test.com" }));
            const data = await res.json();

            expect(res.status).toBe(400);
            expect(data.error).toBe("Email and password are required");
        });

        it("returns 400 for invalid email format", async () => {
            const res = await POST(
                makeRequest({ email: "not-an-email", password: "password123" }),
            );
            const data = await res.json();

            expect(res.status).toBe(400);
            expect(data.error).toBe("Invalid email address");
        });

        it("returns 400 when password is too short", async () => {
            const res = await POST(
                makeRequest({ email: "test@test.com", password: "short" }),
            );
            const data = await res.json();

            expect(res.status).toBe(400);
            expect(data.error).toBe("Password must be at least 8 characters");
        });

        it("accepts exactly 8 character password", async () => {
            const res = await POST(
                makeRequest({ email: "test@test.com", password: "12345678" }),
            );

            expect(res.status).toBe(201);
        });
    });

    describe("duplicate check", () => {
        it("returns 409 when email already exists", async () => {
            (prisma.user.findUnique as jest.Mock).mockResolvedValue({
                id: "existing",
            });

            const res = await POST(
                makeRequest({ email: "existing@test.com", password: "password123" }),
            );
            const data = await res.json();

            expect(res.status).toBe(409);
            expect(data.error).toBe("An account with this email already exists");
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
                data: {
                    name: "John",
                    email: "john@test.com",
                    passwordHash: "hashed_password",
                },
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
                    token: "mock_token_hex",
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
            expect(data.message).toContain("check your email");
        });
    });

    describe("error handling", () => {
        it("returns 500 when an unexpected error occurs", async () => {
            (prisma.user.findUnique as jest.Mock).mockRejectedValue(
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
