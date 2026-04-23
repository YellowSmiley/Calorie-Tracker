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
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
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

const mockSettingsUser = {
  calorieGoal: 2000,
  proteinGoal: 150,
  carbGoal: 250,
  fatGoal: 70,
  saturatesGoal: 25,
  sugarsGoal: 50,
  fibreGoal: 30,
  saltGoal: 6,
  calorieUnit: "kcal",
  weightUnit: "g",
  bodyWeightUnit: "kg",
  volumeUnit: "ml",
};

describe("GET /api/settings", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns 401 when requireUser guard fails", async () => {
    mockRequireUser.mockResolvedValue({
      response: new Response("Unauthorized", { status: 401 }) as never,
    });

    const response = await GET();

    expect(response.status).toBe(401);
  });

  test("returns 404 when user not found", async () => {
    mockRequireUser.mockResolvedValue({
      user: { id: "user-123", isAdmin: false },
    });
    mockPrisma.user.findUnique.mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.code).toBe("USER_NOT_FOUND");
  });

  test("successfully returns user settings", async () => {
    mockRequireUser.mockResolvedValue({
      user: { id: "user-123", isAdmin: false },
    });
    mockPrisma.user.findUnique.mockResolvedValue(mockSettingsUser as never);

    const response = await GET();

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.data.calorieGoal).toBe(2000);
    expect(data.data.proteinGoal).toBe(150);
    expect(data.data.calorieUnit).toBe("kcal");
  });
});

describe("PUT /api/settings", () => {
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
        calorieGoal: 2500,
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
        calorieGoal: 2500,
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

  test("returns 400 when calorie goal is invalid", async () => {
    mockRequireUser.mockResolvedValue({
      user: { id: "user-123", isAdmin: false },
    });
    mockCheckProfileWriteRateLimit.mockResolvedValue(true);

    const request = {
      json: async () => ({
        calorieGoal: 50000, // Invalid: too high
      }),
    } as unknown as NextRequest;

    const response = await PUT(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.code).toBe("INVALID_SETTINGS");
  });

  test("successfully updates user settings", async () => {
    mockRequireUser.mockResolvedValue({
      user: { id: "user-123", isAdmin: false },
    });
    mockCheckProfileWriteRateLimit.mockResolvedValue(true);

    const updatedSettings = {
      ...mockSettingsUser,
      calorieGoal: 2500,
      proteinGoal: 180,
    };

    mockPrisma.user.update.mockResolvedValue(updatedSettings as never);

    const request = {
      json: async () => ({
        calorieGoal: 2500,
        proteinGoal: 180,
        carbGoal: 250,
        fatGoal: 70,
        saturatesGoal: 25,
        sugarsGoal: 50,
        fibreGoal: 30,
        saltGoal: 6,
      }),
    } as unknown as NextRequest;

    const response = await PUT(request);

    expect(response.status).toBe(200);
    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "user-123" },
        data: expect.objectContaining({
          calorieGoal: 2500,
          proteinGoal: 180,
        }),
      }),
    );
    const data = await response.json();
    expect(data.data.calorieGoal).toBe(2500);
    expect(data.data.proteinGoal).toBe(180);
  });

  test("uses default units when not provided", async () => {
    mockRequireUser.mockResolvedValue({
      user: { id: "user-123", isAdmin: false },
    });
    mockCheckProfileWriteRateLimit.mockResolvedValue(true);

    mockPrisma.user.update.mockResolvedValue(mockSettingsUser as never);

    const request = {
      json: async () => ({
        calorieGoal: 2000,
        proteinGoal: 150,
        carbGoal: 250,
        fatGoal: 70,
        saturatesGoal: 25,
        sugarsGoal: 50,
        fibreGoal: 30,
        saltGoal: 6,
      }),
    } as unknown as NextRequest;

    const response = await PUT(request);

    expect(response.status).toBe(200);
    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          calorieUnit: "kcal",
          weightUnit: "g",
          bodyWeightUnit: "kg",
          volumeUnit: "ml",
        }),
      }),
    );
  });
});
