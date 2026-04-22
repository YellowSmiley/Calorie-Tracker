/**
 * @jest-environment node
 */
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { Mock } from "jest-mock";
import { GET, POST } from "./route";

jest.mock("@/lib/apiGuards", () => ({
  requireUser: jest.fn(),
}));

jest.mock("@/lib/rateLimit", () => ({
  checkMealWriteRateLimit: jest.fn(async () => true),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    mealEntry: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    food: {
      findUnique: jest.fn(),
    },
  },
}));

import { requireUser } from "@/lib/apiGuards";
import { checkMealWriteRateLimit } from "@/lib/rateLimit";
import { prisma } from "@/lib/prisma";

type AsyncMock = Mock<(...args: unknown[]) => Promise<unknown>>;

function makeJsonRequest(url: string, body: unknown): Request {
  return new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("/api/meals route invariants", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (requireUser as unknown as AsyncMock).mockResolvedValue({
      user: { id: "user-1" },
    });
    (checkMealWriteRateLimit as unknown as AsyncMock).mockResolvedValue(true);
    (prisma.mealEntry.findMany as unknown as AsyncMock).mockResolvedValue([]);
    (prisma.food.findUnique as unknown as AsyncMock).mockResolvedValue({
      id: "food-1",
      name: "Oats",
      measurementType: "weight",
      measurementAmount: 100,
      calories: 100,
      protein: 10,
      carbs: 10,
      fat: 5,
      saturates: 1,
      sugars: 2,
      fibre: 3,
      salt: 0.2,
      defaultServingAmount: null,
      defaultServingDescription: null,
    });
    (prisma.mealEntry.create as unknown as AsyncMock).mockResolvedValue({
      id: "entry-1",
      calories: 100,
      protein: 10,
      carbs: 10,
      fat: 5,
      saturates: 1,
      sugars: 2,
      fibre: 3,
      salt: 0.2,
      serving: 1,
    });
  });

  it("returns guard response when user is not authorized", async () => {
    (requireUser as unknown as AsyncMock).mockResolvedValue({
      response: new Response("Unauthorized", { status: 401 }),
    });

    const res = await GET(new Request("http://localhost/api/meals"));

    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid date query", async () => {
    const res = await GET(
      new Request("http://localhost/api/meals?date=not-a-date"),
    );
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.code).toBe("INVALID_DATE");
  });

  it("returns 400 for invalid JSON payload", async () => {
    const req = new Request("http://localhost/api/meals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{",
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.code).toBe("INVALID_JSON");
  });

  it("returns 400 for invalid meal type", async () => {
    const res = await POST(
      makeJsonRequest("http://localhost/api/meals", {
        mealType: "INVALID",
        foodId: "food-1",
      }),
    );
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.code).toBe("INVALID_MEAL_TYPE");
  });

  it("returns 404 when food does not exist", async () => {
    (prisma.food.findUnique as unknown as AsyncMock).mockResolvedValue(null);

    const res = await POST(
      makeJsonRequest("http://localhost/api/meals", {
        mealType: "BREAKFAST",
        foodId: "missing-food",
      }),
    );
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.code).toBe("FOOD_NOT_FOUND");
  });
});
