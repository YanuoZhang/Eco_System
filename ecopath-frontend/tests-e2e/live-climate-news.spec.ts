import { test, expect } from "@playwright/test";

test("Live Climate News: scroll into view and flip card", async ({ page }) => {
  await page.goto("/");
  // Scroll to news section
  const section = page.getByRole("region", { name: /Live Climate News/i });
  await section.scrollIntoViewIfNeeded();
  await expect(page.getByText(/Latest Australian Climate Impact Updates/i)).toBeVisible();

  // Ensure cards rendered and click AI Analysis button to flip
  const firstCard = section.locator("div").first();
  const aiAnalysisButton = firstCard.locator("button", { hasText: "AI Analysis" });
  await aiAnalysisButton.click();

  // Check if AI analysis view is shown (look for "AI Insight Analysis" text)
  await expect(firstCard.getByText("AI Insight Analysis")).toBeVisible();

  // Click Back button to return
  const backButton = firstCard.locator("button", { hasText: "Back" });
  await backButton.click();

  // Verify we're back to the original view
  await expect(firstCard.getByText("AI Analysis")).toBeVisible();
});

test("Unknown route shows 404 page", async ({ page }) => {
  await page.goto("/some-unknown-route-123");
  await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
  await expect(page.getByText(/not available/i)).toBeVisible();
});
