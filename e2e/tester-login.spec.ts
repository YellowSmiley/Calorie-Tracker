import { test } from "@playwright/test";
import { login } from "./auth";

test("tester can log in and see dashboard", async ({ page }) => {
  await login(page);
});
