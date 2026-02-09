import { test, expect } from "@playwright/test";

const testerEmail =
    process.env.E2E_TEST_EMAIL ?? "";
const testerPassword =
    process.env.E2E_TEST_PASSWORD ?? "";

test("tester can log in and see dashboard", async ({ page }) => {
    await page.goto("/login");

    await page.getByTestId("email").fill(testerEmail);
    await page.getByTestId("password").fill(testerPassword);

    await Promise.all([
        page.waitForURL("/"),
        page.getByTestId("sign-in-button").click(),
    ]);

    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
});
