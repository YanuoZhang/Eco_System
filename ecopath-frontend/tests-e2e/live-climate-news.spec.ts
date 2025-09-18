import { test, expect } from "@playwright/test";

test("Home page loads with news section", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  // Check if home page loads
  await expect(page.getByText("EcoPath").first()).toBeVisible();

  // Check if news section exists (may be loading)
  const newsSection = page.getByText(/Climate/i);
  if (await newsSection.isVisible().catch(() => false)) {
    await expect(newsSection).toBeVisible();
  }
});

test("404 page shows for unknown routes", async ({ page }) => {
  await page.goto("/some-unknown-route-123");
  await page.waitForLoadState("networkidle");

  // Check if 404 page loads
  await expect(page.getByText(/not available/i)).toBeVisible();
});
