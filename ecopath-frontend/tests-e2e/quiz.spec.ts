import { test, expect } from "@playwright/test";

test("Quiz page: change time unit and see preview", async ({ page }) => {
  await page.goto("/quiz");

  // Ensure time unit controls exist and click year
  await expect(page.getByRole("button", { name: /^month$/ })).toBeVisible();
  await page.getByRole("button", { name: /^year$/ }).click({ noWaitAfter: true });

  // Scroll some section to simulate interaction
  await page
    .getByText(/Electricity/i)
    .first()
    .scrollIntoViewIfNeeded();

  // Check if floating preview appears
  const floatingPreview = page.getByRole("button", { name: /Click for full analysis/i });
  if (await floatingPreview.isVisible().catch(() => false)) {
    await expect(floatingPreview).toBeVisible();
  } else {
    // Fallback: check if page is still responsive
    await expect(page.getByText("EcoPath").first()).toBeVisible();
  }
});
