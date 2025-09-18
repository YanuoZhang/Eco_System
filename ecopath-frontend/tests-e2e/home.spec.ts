import { test, expect } from "@playwright/test";

test("Home page loads", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Climate Change is Here\./i })).toBeVisible();
});

test.skip("Quiz page loads", async ({ page }) => {
  await page.goto("/quiz");
  await expect(page.getByText(/Electricity Usage/i)).toBeVisible();
});

test.skip("Info page loads", async ({ page }) => {
  await page.goto("/info");
  await expect(page.getByRole("heading", { name: /Info/ })).toBeVisible();
});

test("Pledge page loads", async ({ page }) => {
  await page.goto("/pledge");
  await expect(page.getByRole("heading", { name: /Pledge/ })).toBeVisible();
});
