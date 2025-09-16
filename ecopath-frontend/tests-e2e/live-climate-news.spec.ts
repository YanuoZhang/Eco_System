import { test, expect } from "@playwright/test";

test("Live Climate News: scroll into view and check loading state", async ({ page }) => {
  await page.goto("/");
  // Scroll to news section
  const section = page.getByRole("region", { name: /Live Climate News/i });
  await section.scrollIntoViewIfNeeded();
  await expect(page.getByText(/Latest Australian Climate Impact Updates/i)).toBeVisible();

  // Wait for either loading state or news cards to appear
  await Promise.race([
    page.getByText(/Loading AI-curated climate insights/i).waitFor({ timeout: 5000 }),
    page.getByText(/Headlines with AI insights/i).waitFor({ timeout: 5000 }),
    section.locator("div").filter({ hasText: "AI Analysis" }).first().waitFor({ timeout: 5000 }),
  ]);

  // Check if we have news cards loaded
  const newsCards = section.locator("div").filter({ hasText: "AI Analysis" });
  const cardCount = await newsCards.count();

  if (cardCount > 0) {
    // Test news card interaction
    const firstCard = newsCards.first();
    const aiAnalysisButton = firstCard.locator("button", { hasText: "AI Analysis" });
    await aiAnalysisButton.click();

    // Check if AI analysis view is shown
    await expect(firstCard.getByText("AI Insight Analysis")).toBeVisible();

    // Click Back button to return
    const backButton = firstCard.locator("button", { hasText: "Back" });
    await backButton.click();

    // Verify we're back to the original view
    await expect(firstCard.getByText("AI Analysis")).toBeVisible();
  } else {
    // If no cards loaded, just verify the section is visible
    console.log("No news cards loaded, but section is visible");
  }
});

test("Unknown route shows 404 page", async ({ page }) => {
  await page.goto("/some-unknown-route-123");
  await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
  await expect(page.getByText(/not available/i)).toBeVisible();
});
