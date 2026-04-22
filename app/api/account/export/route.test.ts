/**
 * @jest-environment node
 */
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { Mock } from "jest-mock";
import { GET } from "./route";

jest.mock("@/lib/apiGuards", () => ({
  requireUser: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    mealEntry: {
      findMany: jest.fn(),
    },
    food: {
      findMany: jest.fn(),
    },
    account: {
      findMany: jest.fn(),
    },
    weightEntry: {
      findMany: jest.fn(),
    },
  },
}));

import { requireUser } from "@/lib/apiGuards";
import { prisma } from "@/lib/prisma";

type AsyncMock = Mock<(...args: unknown[]) => Promise<unknown>>;

describe("GET /api/account/export invariants", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (requireUser as unknown as AsyncMock).mockResolvedValue({
      user: { id: "user-1" },
    });

    (prisma.user.findUnique as unknown as AsyncMock).mockResolvedValue({
      id: "user-1",
      name: "Test User",
      email: "test@example.com",
      emailVerified: null,
      image: null,
      isAdmin: false,
      calorieGoal: 2000,
      proteinGoal: 120,
      carbGoal: 250,
      fatGoal: 70,
      saturatesGoal: 20,
      sugarsGoal: 40,
      fibreGoal: 30,
      saltGoal: 6,
      calorieUnit: "kcal",
      weightUnit: "g",
      bodyWeightUnit: "kg",
      volumeUnit: "ml",
    });
    (prisma.mealEntry.findMany as unknown as AsyncMock).mockResolvedValue([]);
    (prisma.food.findMany as unknown as AsyncMock).mockResolvedValue([]);
    (prisma.account.findMany as unknown as AsyncMock).mockResolvedValue([]);
    (prisma.weightEntry.findMany as unknown as AsyncMock).mockResolvedValue([]);
  });

  it("returns guard response when user is not authorized", async () => {
    (requireUser as unknown as AsyncMock).mockResolvedValue({
      response: new Response("Unauthorized", { status: 401 }),
    });

    const res = await GET();

    expect(res.status).toBe(401);
  });

  it("returns 404 when profile is not found", async () => {
    (prisma.user.findUnique as unknown as AsyncMock).mockResolvedValue(null);

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.code).toBe("USER_NOT_FOUND");
  });

  it("returns no-cache json attachment on success", async () => {
    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("application/json");
    expect(res.headers.get("Cache-Control")).toContain("no-store");
    expect(res.headers.get("Pragma")).toBe("no-cache");
    expect(res.headers.get("Content-Disposition")).toContain(
      "calorie-tracker-data-export",
    );
    expect(data.profile.id).toBe("user-1");
  });
});
