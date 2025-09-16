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

  // Check if we have any AI Analysis buttons rendered
  const aiButtons = section.getByRole("button", { name: /AI Analysis/i });
  const cardCount = await aiButtons.count();

  if (cardCount > 0) {
    // Test news card interaction
    const aiAnalysisButton = aiButtons.first();
    await aiAnalysisButton.scrollIntoViewIfNeeded();
    await aiAnalysisButton.waitFor({ state: "visible", timeout: 5000 });
    await expect(aiAnalysisButton).toBeVisible();
    await expect(aiAnalysisButton).toBeEnabled();
    await aiAnalysisButton.click({ timeout: 5000 });

    // Check if AI analysis view is shown
    await expect(page.getByText("AI Insight Analysis")).toBeVisible();

    // Click Back button to return
    const backButton = section.getByRole("button", { name: /Back/i }).first();
    await backButton.scrollIntoViewIfNeeded();
    await expect(backButton).toBeVisible();
    await expect(backButton).toBeEnabled();
    await backButton.click();

    // Verify we're back to the original view
    await expect(page.getByText("AI Analysis")).toBeVisible();
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
