import { test, expect } from "@playwright/test";

test("Home page loads", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  // Check if page loads without errors
  await expect(page.getByText("EcoPath").first()).toBeVisible();
});

test("Quiz page loads", async ({ page }) => {
  await page.goto("/quiz");
  await page.waitForLoadState("networkidle");

  // Check if quiz page loads
  await expect(page.getByText(/Electricity Usage/i)).toBeVisible();
});

test("Info page loads", async ({ page }) => {
  await page.goto("/info");
  await page.waitForLoadState("networkidle");

  // Check if info page loads
  await expect(page.getByRole("heading", { name: /Info/ })).toBeVisible();
});

test("Pledge page loads", async ({ page }) => {
  await page.goto("/pledge");
  await page.waitForLoadState("networkidle");

  // Check if pledge page loads
  await expect(page.getByRole("heading", { name: /Pledge/ })).toBeVisible();
});
