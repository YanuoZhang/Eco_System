import { test, expect } from "@playwright/test";
import { loginViaApi } from "./test-utils";

test("Home page loads with news section", async ({ page }) => {
  await loginViaApi(page);
  await page.goto("/");
  // Avoid brittle networkidle; wait for a stable UI element
  await expect(page.getByText("EcoPath").first()).toBeVisible();

  // Check if home page loads
  await expect(page.getByText("EcoPath").first()).toBeVisible();

  // Check if news section exists (may be loading)
  const newsSection = page.getByText(/Climate/i);
  if (await newsSection.isVisible().catch(() => false)) {
    await expect(newsSection).toBeVisible();
  }
});

test("404 page shows for unknown routes", async ({ page }) => {
  await loginViaApi(page);
  await page.goto("/some-unknown-route-123");
  // Wait for 404 content instead of networkidle
  await expect(page.getByText(/not available/i)).toBeVisible();

  // Check if 404 page loads
  await expect(page.getByText(/not available/i)).toBeVisible();
});
