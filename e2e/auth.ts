import { expect, Page } from "@playwright/test";

const testerEmail = process.env.E2E_TEST_EMAIL ?? "";
const testerPassword = process.env.E2E_TEST_PASSWORD ?? "";

export const login = async (page: Page) => {
  await page.goto("/login");
  await page.getByTestId("email").fill(testerEmail);
  await page.getByTestId("password").fill(testerPassword);
  await Promise.all([
    page.waitForURL("/"),
    page.getByTestId("sign-in-button").click(),
  ]);
  await page.getByTestId("cookie-banner-button").click();
  await expect(page.getByTestId("cookie-banner-button")).not.toBeVisible();
  await page.getByTestId("install-prompt-dismiss-button").click();
  await expect(
    page.getByTestId("install-prompt-dismiss-button"),
  ).not.toBeVisible();
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
};
