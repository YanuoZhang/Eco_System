import { test, expect } from "@playwright/test";

test("Quiz appliances section loads", async ({ page }) => {
  await page.goto("/quiz");
  await page.waitForLoadState("networkidle");

  // Check if quiz page loads
  await expect(page.getByText(/Electricity Usage/i)).toBeVisible();

  // Check if appliances section exists
  await expect(page.getByText(/Common Appliances/i)).toBeVisible();
});
