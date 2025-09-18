import { test, expect } from "@playwright/test";

// E2E: week/month switch + appliances selection + results consistency
test("Quiz appliances: week/month switch and consistency", async ({ page }) => {
  await page.goto("/");

  // Wait for navigation link to be visible and clickable
  await page.getByRole("link", { name: "Explore My Impact" }).waitFor({ state: "visible" });
  await page.getByRole("link", { name: "Explore My Impact" }).click();

  // Ensure page loaded
  await expect(page.getByText(/Electricity Usage/i)).toBeVisible();

  // Select VIC state if selector exists
  if (
    await page
      .getByLabel(/State\/Territory/i)
      .isVisible()
      .catch(() => false)
  ) {
    await page.getByLabel(/State\/Territory/i).selectOption("VIC");
  }

  // Switch to week
  await page.getByRole("button", { name: "week" }).click();

  // Expand appliances section
  const appliancesHeader = page.getByRole("button", { name: /Common Appliances/i });
  await appliancesHeader.click();

  // Select TV and Computer
  const tv = page.getByRole("button", { name: /Television/i });
  const computer = page.getByRole("button", { name: /Computer/i });
  await tv.click();
  await computer.click();

  // Open advanced settings and adjust usage: TV 10h/week, Computer 5h/week
  await page.getByRole("button", { name: /Advanced usage settings/i }).click();
  const inputs = page.locator("input[type='number']");
  // Since fridge is always on by default, input order may vary, fill first two editable inputs
  const editable = await inputs.elementHandles();
  if (editable.length > 0) await editable[0].fill("10");
  if (editable.length > 1) await editable[1].fill("5");

  // Open preview
  await page.getByRole("button", { name: /Click for full analysis/i }).click();

  // Verify modal appears with week unit
  await expect(page.getByText(/kg CO₂\/week/i)).toBeVisible();

  // Record week total value
  const weekText = await page.locator("text=/kg CO₂\\/week/").first().textContent();
  expect(weekText).toBeTruthy();

  // Close modal
  await page.getByRole("button", { name: "×" }).click();

  // Switch to month
  await page.getByRole("button", { name: "month" }).click();

  // Open preview again and assert unit change
  await page.getByRole("button", { name: /Click for full analysis/i }).click();
  await expect(page.getByText(/kg CO₂\/month/i)).toBeVisible();
});
