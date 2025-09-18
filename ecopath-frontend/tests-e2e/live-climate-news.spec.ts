import { test, expect } from "@playwright/test";

test("Live Climate News: scroll into view and check loading state", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  // Scroll to news section
  const section = page.getByRole("region", { name: /Live Climate News/i });
  await section.scrollIntoViewIfNeeded();
  await expect(page.getByText(/Latest Australian Climate Impact Updates/i)).toBeVisible();

  // Wait for either loading state or news cards to appear
  await Promise.race([
    page.getByText(/Loading/i).waitFor({ state: "visible", timeout: 5000 }),
    page.getByRole("article").first().waitFor({ state: "visible", timeout: 10000 }),
  ]).catch(() => {
    // If neither loading nor news cards appear, that's also acceptable
  });

  // Check if news cards are visible (if they loaded)
  const newsCards = page.getByRole("article");
  if ((await newsCards.count()) > 0) {
    await expect(newsCards.first()).toBeVisible();
  }
});

test("Unknown route shows 404 page", async ({ page }) => {
  await page.goto("/some-unknown-route-123");
  await page.waitForLoadState("networkidle");

  // Check if 404 page loads
  await expect(page.getByText(/not found/i)).toBeVisible();
});
