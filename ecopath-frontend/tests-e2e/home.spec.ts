import { test, expect } from "@playwright/test";
import { loginViaApi } from "./test-utils";

test("Home page loads", async ({ page, request }) => {
  await loginViaApi(request, page);
  await page.goto("/");
  // Wait for page to load completely
  await page.waitForLoadState("networkidle");

  // Debug: log the current URL and page content
  console.log("Current URL:", page.url());
  const bodyText = await page.textContent("body");
  console.log("Body text:", bodyText?.substring(0, 200));

  // Check for the main heading specifically
  await expect(page.getByRole("heading", { name: /Climate Change is Here/i })).toBeVisible();
});

test.skip("Quiz page loads", async ({ page }) => {
  await page.goto("/quiz");
  await expect(page.getByText(/Electricity Usage/i)).toBeVisible();
});

test.skip("Info page loads", async ({ page }) => {
  await page.goto("/info");
  await expect(page.getByRole("heading", { name: /Info/ })).toBeVisible();
});

test("Pledge page loads", async ({ page, request }) => {
  await loginViaApi(request, page);
  await page.goto("/pledge");
  await expect(page.getByRole("heading", { name: /Pledge/ })).toBeVisible();
});
