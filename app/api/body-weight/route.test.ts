/**
 * @jest-environment node
 */
import { beforeEach, describe, expect, test, jest } from "@jest/globals";

jest.mock("@/lib/apiGuards", () => ({
  requireUser: jest.fn(),
}));

jest.mock("@/lib/rateLimit", () => ({
  checkProfileWriteRateLimit: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    weightEntry: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}));

jest.mock("@/lib/auditService", () => ({
  logAdminAction: jest.fn(),
  getRequestId: jest.fn(),
}));

import { GET, PUT } from "./route";
import { NextRequest } from "next/server";
import { requireUser } from "@/lib/apiGuards";
import { checkProfileWriteRateLimit } from "@/lib/rateLimit";
import { prisma } from "@/lib/prisma";
import { logAdminAction, getRequestId } from "@/lib/auditService";

const mockRequireUser = requireUser as jest.MockedFunction<typeof requireUser>;
const mockCheckProfileWriteRateLimit =
  checkProfileWriteRateLimit as jest.MockedFunction<
    typeof checkProfileWriteRateLimit
  >;
const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockLogAdminAction = logAdminAction as jest.MockedFunction<
  typeof logAdminAction
>;
const mockGetRequestId = getRequestId as jest.MockedFunction<
  typeof getRequestId
>;

describe("GET /api/body-weight", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns 401 when requireUser guard fails", async () => {
    mockRequireUser.mockResolvedValue({
      response: new Response("Unauthorized", { status: 401 }) as never,
    });

    const request = new NextRequest(
      "http://localhost:3000/api/body-weight?date=2024-01-15",
    );
    const response = await GET(request);

    expect(response.status).toBe(401);
  });

  test("returns 400 when date format is invalid", async () => {
    mockRequireUser.mockResolvedValue({
      user: { id: "user-123", isAdmin: false },
    });

    const request = new NextRequest(
      "http://localhost:3000/api/body-weight?date=invalid-date",
    );
    const response = await GET(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.code).toBe("INVALID_DATE");
  });

  test("returns weight entry when found", async () => {
    mockRequireUser.mockResolvedValue({
      user: { id: "user-123", isAdmin: false },
    });
    mockPrisma.weightEntry.findUnique.mockResolvedValue({
      weight: 75.5,
    } as never);

    const request = new NextRequest(
      "http://localhost:3000/api/body-weight?date=2024-01-15",
    );
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.data.weight).toBe(75.5);
  });

  test("returns null when weight entry not found", async () => {
    mockRequireUser.mockResolvedValue({
      user: { id: "user-123", isAdmin: false },
    });
    mockPrisma.weightEntry.findUnique.mockResolvedValue(null);

    const request = new NextRequest(
      "http://localhost:3000/api/body-weight?date=2024-01-15",
    );
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.data.weight).toBeNull();
  });

  test("uses current date when no date query param provided", async () => {
    mockRequireUser.mockResolvedValue({
      user: { id: "user-123", isAdmin: false },
    });
    mockPrisma.weightEntry.findUnique.mockResolvedValue(null);

    const request = new NextRequest("http://localhost:3000/api/body-weight");
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(mockPrisma.weightEntry.findUnique).toHaveBeenCalled();
  });
});

describe("PUT /api/body-weight", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetRequestId.mockReturnValue(undefined);
    mockLogAdminAction.mockResolvedValue(undefined);
  });

  test("returns 401 when requireUser guard fails", async () => {
    mockRequireUser.mockResolvedValue({
      response: new Response("Unauthorized", { status: 401 }) as never,
    });

    const request = {
      json: async () => ({
        date: "2024-01-15",
        weight: 75.5,
      }),
    } as unknown as NextRequest;

    const response = await PUT(request);

    expect(response.status).toBe(401);
  });

  test("returns 429 when rate limit is exceeded", async () => {
    mockRequireUser.mockResolvedValue({
      user: { id: "user-123", isAdmin: false },
    });
    mockCheckProfileWriteRateLimit.mockResolvedValue(false);

    const request = {
      json: async () => ({
        date: "2024-01-15",
        weight: 75.5,
      }),
    } as unknown as NextRequest;

    const response = await PUT(request);

    expect(response.status).toBe(429);
  });

  test("returns 400 when JSON is invalid", async () => {
    mockRequireUser.mockResolvedValue({
      user: { id: "user-123", isAdmin: false },
    });
    mockCheckProfileWriteRateLimit.mockResolvedValue(true);

    const request = {
      json: async () => {
        throw new Error("Invalid JSON");
      },
    } as unknown as NextRequest;

    const response = await PUT(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.code).toBe("INVALID_JSON");
  });

  test("returns 400 when date format is invalid", async () => {
    mockRequireUser.mockResolvedValue({
      user: { id: "user-123", isAdmin: false },
    });
    mockCheckProfileWriteRateLimit.mockResolvedValue(true);

    const request = {
      json: async () => ({
        date: "invalid-date",
        weight: 75.5,
      }),
    } as unknown as NextRequest;

    const response = await PUT(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.code).toBe("INVALID_DATE");
  });

  test("returns 400 when weight is outside valid range", async () => {
    mockRequireUser.mockResolvedValue({
      user: { id: "user-123", isAdmin: false },
    });
    mockCheckProfileWriteRateLimit.mockResolvedValue(true);

    const request = {
      json: async () => ({
        date: "2024-01-15",
        weight: 1500, // Invalid: > 1000
      }),
    } as unknown as NextRequest;

    const response = await PUT(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.code).toBe("INVALID_BODY_WEIGHT");
  });

  test("successfully saves new weight entry", async () => {
    const userId = "user-123";
    const weight = 75.5;

    mockRequireUser.mockResolvedValue({
      user: { id: userId, isAdmin: false },
    });
    mockCheckProfileWriteRateLimit.mockResolvedValue(true);
    mockPrisma.weightEntry.upsert.mockResolvedValue({
      weight,
    } as never);

    const request = {
      json: async () => ({
        date: "2024-01-15",
        weight,
      }),
    } as unknown as NextRequest;

    const response = await PUT(request);

    expect(response.status).toBe(200);
    expect(mockPrisma.weightEntry.upsert).toHaveBeenCalled();
    const data = await response.json();
    expect(data.data.weight).toBe(weight);
  });

  test("deletes weight entry when weight is null", async () => {
    mockRequireUser.mockResolvedValue({
      user: { id: "user-123", isAdmin: false },
    });
    mockCheckProfileWriteRateLimit.mockResolvedValue(true);
    mockPrisma.weightEntry.deleteMany.mockResolvedValue({ count: 1 });

    const request = {
      json: async () => ({
        date: "2024-01-15",
        weight: null,
      }),
    } as unknown as NextRequest;

    const response = await PUT(request);

    expect(response.status).toBe(200);
    expect(mockPrisma.weightEntry.deleteMany).toHaveBeenCalled();
    const data = await response.json();
    expect(data.data.weight).toBeNull();
  });
});
