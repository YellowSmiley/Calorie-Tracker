/**
 * @jest-environment node
 */
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { Mock } from "jest-mock";
import { POST } from "./route";

jest.mock("@/lib/apiGuards", () => ({
  requireAdmin: jest.fn(),
}));

jest.mock("@/lib/rateLimit", () => ({
  checkAdminWriteRateLimit: jest.fn(async () => true),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    food: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(async (callback: (tx: unknown) => Promise<unknown>) =>
      callback({
        user: {
          update: jest.fn(async () => ({
            id: "u-1",
            email: "user@test.com",
            blackMarks: 1,
            lastKnownIp: null,
          })),
        },
        blacklistEntry: {
          upsert: jest.fn(async () => ({})),
        },
      }),
    ),
  },
}));

import { requireAdmin } from "@/lib/apiGuards";
import { checkAdminWriteRateLimit } from "@/lib/rateLimit";
import { prisma } from "@/lib/prisma";

type AsyncMock = Mock<(...args: unknown[]) => Promise<unknown>>;

describe("POST /api/admin/foods/[id]/punish invariants", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (requireAdmin as unknown as AsyncMock).mockResolvedValue({
      user: { id: "admin-1" },
    });
    (checkAdminWriteRateLimit as unknown as AsyncMock).mockResolvedValue(true);
    (prisma.food.findUnique as unknown as AsyncMock).mockResolvedValue({
      id: "food-1",
      createdBy: "user-1",
    });
  });

  it("returns guard response when admin is not authorized", async () => {
    (requireAdmin as unknown as AsyncMock).mockResolvedValue({
      response: new Response("Forbidden", { status: 403 }),
    });

    const res = await POST(new Request("http://localhost") as never, {
      params: Promise.resolve({ id: "food-1" }),
    });

    expect(res.status).toBe(403);
  });

  it("returns 404 when route params are invalid", async () => {
    const res = await POST(new Request("http://localhost") as never, {
      params: Promise.resolve({}),
    });
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.code).toBe("FOOD_NOT_FOUND");
  });

  it("returns 400 when food creator is unavailable", async () => {
    (prisma.food.findUnique as unknown as AsyncMock).mockResolvedValue({
      id: "food-1",
      createdBy: null,
    });

    const res = await POST(new Request("http://localhost") as never, {
      params: Promise.resolve({ id: "food-1" }),
    });
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.code).toBe("FOOD_CREATOR_UNAVAILABLE");
  });
});
