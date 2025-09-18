import { test, expect } from "@playwright/test";

test.skip("Quiz appliances section loads", async ({ page }) => {
  await page.goto("/quiz");
  // Avoid brittle networkidle; wait for a stable heading
  await expect(page.getByText(/Electricity Usage/i)).toBeVisible();

  // Check if quiz page loads
  await expect(page.getByText(/Electricity Usage/i)).toBeVisible();

  // Check if appliances section exists
  await expect(page.getByText(/Common Appliances/i)).toBeVisible();
});
