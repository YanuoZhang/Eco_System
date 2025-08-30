import { test, expect } from "@playwright/test";

test("homepage renders", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Your Environmental Journey")).toBeVisible();
  await expect(page.getByRole("button", { name: /Start My Environmental Journey/i })).toBeVisible();
});
