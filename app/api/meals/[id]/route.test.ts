/**
 * @jest-environment node
 */
import { beforeEach, describe, expect, test, jest } from "@jest/globals";

jest.mock("@/lib/apiGuards", () => ({
  requireUser: jest.fn(),
}));

jest.mock("@/lib/rateLimit", () => ({
  checkMealWriteRateLimit: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    mealEntry: {
      findFirst: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock("@/lib/mealService", () => ({
  buildMealNutritionData: jest.fn(),
}));

jest.mock("@/lib/auditService", () => ({
  logAdminAction: jest.fn(),
  getRequestId: jest.fn(),
}));

import { PATCH, DELETE } from "./route";
import { NextRequest } from "next/server";
import { requireUser } from "@/lib/apiGuards";
import { checkMealWriteRateLimit } from "@/lib/rateLimit";
import { prisma } from "@/lib/prisma";
import { buildMealNutritionData } from "@/lib/mealService";
import { logAdminAction, getRequestId } from "@/lib/auditService";

const mockRequireUser = requireUser as jest.MockedFunction<typeof requireUser>;
const mockCheckMealWriteRateLimit =
  checkMealWriteRateLimit as jest.MockedFunction<
    typeof checkMealWriteRateLimit
  >;
const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockLogAdminAction = logAdminAction as jest.MockedFunction<
  typeof logAdminAction
>;
const mockGetRequestId = getRequestId as jest.MockedFunction<
  typeof getRequestId
>;
const mockBuildMealNutritionData =
  buildMealNutritionData as jest.MockedFunction<typeof buildMealNutritionData>;

describe("DELETE /api/meals/[id]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetRequestId.mockReturnValue(undefined);
    mockLogAdminAction.mockResolvedValue(undefined);
  });

  test("returns 401 when requireUser guard fails", async () => {
    mockRequireUser.mockResolvedValue({
      response: new Response("Unauthorized", { status: 401 }) as never,
    });

    const response = await DELETE({} as NextRequest, {
      params: Promise.resolve({ id: "meal-123" }),
    });

    expect(response.status).toBe(401);
    expect(mockRequireUser).toHaveBeenCalled();
  });

  test("returns 429 when rate limit is exceeded", async () => {
    mockRequireUser.mockResolvedValue({
      user: { id: "user-123", isAdmin: false },
    });
    mockCheckMealWriteRateLimit.mockResolvedValue(false);

    const response = await DELETE({} as NextRequest, {
      params: Promise.resolve({ id: "meal-123" }),
    });

    expect(response.status).toBe(429);
  });

  test("returns 400 when params validation fails", async () => {
    mockRequireUser.mockResolvedValue({
      user: { id: "user-123", isAdmin: false },
    });
    mockCheckMealWriteRateLimit.mockResolvedValue(true);

    const response = await DELETE(
      {} as NextRequest,
      { params: Promise.resolve({ id: "" }) }, // Invalid empty id
    );

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.code).toBe("VALIDATION_ERROR");
  });

  test("returns 404 when meal entry not found", async () => {
    mockRequireUser.mockResolvedValue({
      user: { id: "user-123", isAdmin: false },
    });
    mockCheckMealWriteRateLimit.mockResolvedValue(true);
    mockPrisma.mealEntry.findFirst.mockResolvedValue(null);

    const response = await DELETE({} as NextRequest, {
      params: Promise.resolve({ id: "meal-456" }),
    });

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.code).toBe("MEAL_ENTRY_NOT_FOUND");
  });

  test("successfully deletes meal entry", async () => {
    const userId = "user-123";
    const mealId = "meal-123";

    mockRequireUser.mockResolvedValue({
      user: { id: userId, isAdmin: false },
    });
    mockCheckMealWriteRateLimit.mockResolvedValue(true);
    mockPrisma.mealEntry.findFirst.mockResolvedValue({
      id: mealId,
      userId,
    } as never);
    mockPrisma.mealEntry.delete.mockResolvedValue({
      id: mealId,
      userId,
    } as never);

    const response = await DELETE({} as NextRequest, {
      params: Promise.resolve({ id: mealId }),
    });

    expect(response.status).toBe(200);
    expect(mockPrisma.mealEntry.delete).toHaveBeenCalledWith({
      where: { id: mealId },
    });
    const data = await response.json();
    expect(data.data.success).toBe(true);
  });
});

describe("PATCH /api/meals/[id]", () => {
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
      json: async () => ({ serving: 1.5 }),
    } as NextRequest;

    const response = await PATCH(request, {
      params: Promise.resolve({ id: "meal-123" }),
    });

    expect(response.status).toBe(401);
  });

  test("returns 429 when rate limit is exceeded", async () => {
    mockRequireUser.mockResolvedValue({
      user: { id: "user-123", isAdmin: false },
    });
    mockCheckMealWriteRateLimit.mockResolvedValue(false);

    const request = {
      json: async () => ({ serving: 1.5 }),
    } as NextRequest;

    const response = await PATCH(request, {
      params: Promise.resolve({ id: "meal-123" }),
    });

    expect(response.status).toBe(429);
  });

  test("returns 400 when JSON is invalid", async () => {
    mockRequireUser.mockResolvedValue({
      user: { id: "user-123", isAdmin: false },
    });
    mockCheckMealWriteRateLimit.mockResolvedValue(true);

    const request = {
      json: async () => {
        throw new Error("Invalid JSON");
      },
    } as unknown as NextRequest;

    const response = await PATCH(request, {
      params: Promise.resolve({ id: "meal-123" }),
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.code).toBe("INVALID_JSON");
  });

  test("returns 400 when payload validation fails (missing serving)", async () => {
    mockRequireUser.mockResolvedValue({
      user: { id: "user-123", isAdmin: false },
    });
    mockCheckMealWriteRateLimit.mockResolvedValue(true);

    const request = {
      json: async () => ({}), // Missing required 'serving' field
    } as NextRequest;

    const response = await PATCH(request, {
      params: Promise.resolve({ id: "meal-123" }),
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.code).toBe("VALIDATION_ERROR");
  });

  test("returns 404 when meal entry not found", async () => {
    mockRequireUser.mockResolvedValue({
      user: { id: "user-123", isAdmin: false },
    });
    mockCheckMealWriteRateLimit.mockResolvedValue(true);
    mockPrisma.mealEntry.findFirst.mockResolvedValue(null);

    const request = {
      json: async () => ({ serving: 1.5 }),
    } as NextRequest;

    const response = await PATCH(request, {
      params: Promise.resolve({ id: "nonexistent-meal" }),
    });

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.code).toBe("MEAL_ENTRY_NOT_FOUND");
  });

  test("successfully updates meal entry with new serving", async () => {
    const userId = "user-123";
    const mealId = "meal-123";
    const newServing = 2.0;

    const mockFood = {
      id: "food-123",
      name: "Apple",
      calories: 52,
      protein: 0.3,
      carbs: 13.8,
      fat: 0.2,
      saturates: 0,
      sugars: 10,
      fibre: 2.4,
      salt: 0,
      measurementType: "grams",
    };

    const mockMealEntry = {
      id: mealId,
      userId,
      foodId: "food-123",
      food: mockFood,
      serving: 1.0,
    };

    const mockUpdatedEntry = {
      id: mealId,
      userId,
      foodId: "food-123",
      food: mockFood,
      serving: newServing,
      calories: 104,
      protein: 0.6,
      carbs: 27.6,
      fat: 0.4,
      saturates: 0,
      sugars: 20,
      fibre: 4.8,
      salt: 0,
    };

    mockRequireUser.mockResolvedValue({
      user: { id: userId, isAdmin: false },
    });
    mockCheckMealWriteRateLimit.mockResolvedValue(true);
    mockPrisma.mealEntry.findFirst.mockResolvedValue(mockMealEntry as never);
    mockBuildMealNutritionData.mockReturnValue({
      calories: 104,
      protein: 0.6,
      carbs: 27.6,
      fat: 0.4,
      saturates: 0,
      sugars: 20,
      fibre: 4.8,
      salt: 0,
    });
    mockPrisma.mealEntry.update.mockResolvedValue(mockUpdatedEntry as never);

    const request = {
      json: async () => ({ serving: newServing }),
    } as NextRequest;

    const response = await PATCH(request, {
      params: Promise.resolve({ id: mealId }),
    });

    expect(response.status).toBe(200);
    expect(mockPrisma.mealEntry.update).toHaveBeenCalled();
    const data = await response.json();
    expect(data.data.item.serving).toBe(newServing);
  });
});
