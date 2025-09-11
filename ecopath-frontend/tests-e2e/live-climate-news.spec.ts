import { test, expect } from "@playwright/test";

test("Live Climate News: scroll into view and flip card", async ({ page }) => {
  await page.goto("/");
  // Scroll to news section
  const section = page.getByRole("region", { name: /Live Climate News/i });
  await section.scrollIntoViewIfNeeded();
  await expect(page.getByText(/Latest Australian Climate Impact Updates/i)).toBeVisible();

  // Ensure cards rendered and click first to flip
  const firstCard = section.locator("button").first();
  await firstCard.click();
  await expect(firstCard).toHaveAttribute("aria-pressed", "true");

  // Flip back
  await firstCard.click();
  await expect(firstCard).toHaveAttribute("aria-pressed", "false");
});
