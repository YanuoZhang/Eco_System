import { test, expect } from "@playwright/test";
import { loginViaApi } from "./test-utils";

test("Quiz page loads with time controls", async ({ page, request }) => {
  await loginViaApi(request, page);
  await page.goto("/quiz");
  // Avoid brittle networkidle; wait for a stable heading
  await expect(page.getByText(/Electricity Usage/i)).toBeVisible();

  // Check if quiz page loads
  await expect(page.getByText(/Electricity Usage/i)).toBeVisible();

  // Check if time unit buttons exist - use more specific selectors
  await expect(page.locator('button:has-text("month")').first()).toBeVisible();
  await expect(page.locator('button:has-text("year")').first()).toBeVisible();

  // Check if the global time unit selector is visible
  await expect(page.locator(".grid.grid-cols-4.gap-3")).toBeVisible();
});
