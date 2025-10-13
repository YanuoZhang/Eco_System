import { test, expect } from "@playwright/test";
import { loginViaApi } from "./test-utils";

test("Quiz appliances section loads", async ({ page, request }) => {
  await loginViaApi(request, page);
  await page.goto("/quiz", { waitUntil: "domcontentloaded" });
  // Wait for the page to be interactive
  await page.waitForLoadState("networkidle");
  // Avoid brittle networkidle; wait for a stable heading
  await expect(page.getByText(/Electricity Usage/i)).toBeVisible({ timeout: 10000 });

  // Check if quiz page loads
  await expect(page.getByText(/Electricity Usage/i)).toBeVisible();

  // Check if appliances section exists
  await expect(page.getByText(/Common Appliances/i)).toBeVisible();
});
