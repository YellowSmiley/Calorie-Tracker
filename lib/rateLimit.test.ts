/** @jest-environment node */

const originalEnv = process.env;

describe("rateLimit", () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv, NODE_ENV: "production" };
    delete process.env.REDIS_URL;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test("checkAuthRateLimit blocks after threshold for same ip", async () => {
    const { checkAuthRateLimit } = await import("./rateLimit");
    const request = new Request("http://localhost/api/auth/reset-password", {
      headers: { "x-forwarded-for": "203.0.113.10" },
    });

    for (let i = 0; i < 5; i += 1) {
      const allowed = await checkAuthRateLimit(request);
      expect(allowed).toBeNull();
    }

    const blocked = await checkAuthRateLimit(request);
    expect(blocked?.status).toBe(429);
  });

  test("checkLoginRateLimit blocks after production threshold", async () => {
    const { checkLoginRateLimit } = await import("./rateLimit");

    for (let i = 0; i < 5; i += 1) {
      await expect(
        checkLoginRateLimit("rate-limit-user@example.com"),
      ).resolves.toBe(true);
    }

    await expect(
      checkLoginRateLimit("rate-limit-user@example.com"),
    ).resolves.toBe(false);
  });

  test("checkFoodReportRateLimit blocks after threshold", async () => {
    const { checkFoodReportRateLimit } = await import("./rateLimit");

    for (let i = 0; i < 10; i += 1) {
      await expect(checkFoodReportRateLimit("user-1")).resolves.toBe(true);
    }

    await expect(checkFoodReportRateLimit("user-1")).resolves.toBe(false);
  });

  test("checkMealFavoritesWriteRateLimit blocks after threshold", async () => {
    const { checkMealFavoritesWriteRateLimit } = await import("./rateLimit");

    for (let i = 0; i < 60; i += 1) {
      await expect(
        checkMealFavoritesWriteRateLimit("favorite-user-1"),
      ).resolves.toBe(true);
    }

    await expect(
      checkMealFavoritesWriteRateLimit("favorite-user-1"),
    ).resolves.toBe(false);
  });

  test("checkProfileWriteRateLimit blocks after threshold", async () => {
    const { checkProfileWriteRateLimit } = await import("./rateLimit");

    for (let i = 0; i < 30; i += 1) {
      await expect(checkProfileWriteRateLimit("profile-user-1")).resolves.toBe(
        true,
      );
    }

    await expect(checkProfileWriteRateLimit("profile-user-1")).resolves.toBe(
      false,
    );
  });

  test("checkAccountDeleteRateLimit blocks after threshold", async () => {
    const { checkAccountDeleteRateLimit } = await import("./rateLimit");

    for (let i = 0; i < 3; i += 1) {
      await expect(checkAccountDeleteRateLimit("delete-user-1")).resolves.toBe(
        true,
      );
    }

    await expect(checkAccountDeleteRateLimit("delete-user-1")).resolves.toBe(
      false,
    );
  });

  test("checkAdminWriteRateLimit blocks after threshold", async () => {
    const { checkAdminWriteRateLimit } = await import("./rateLimit");

    for (let i = 0; i < 120; i += 1) {
      await expect(checkAdminWriteRateLimit("admin-1")).resolves.toBe(true);
    }

    await expect(checkAdminWriteRateLimit("admin-1")).resolves.toBe(false);
  });
});
