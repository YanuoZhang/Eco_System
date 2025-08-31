import { test, expect } from "@playwright/test";

test.describe("Back to Homepage E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Pre-set selected state to VIC
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.setItem("selectedState", "Victoria (VIC)");
    });
  });

  test("TC-1.8.1: Return to homepage from Data Insight Step 1", async ({ page }) => {
    // Navigate to homepage
    await page.goto("/");

    // Click start environmental journey button
    await page.getByRole("button", { name: /Start My Environmental Journey/i }).click();

    // Wait for page to load and click next
    await page.waitForSelector('[data-testid="journey-welcome"]');
    await page.getByRole("button", { name: /Next/i }).click();

    // Verify Data Insight page loads
    await page.waitForSelector('[data-testid="data-insight"]');

    // Verify we are on Data Insight Step 1
    await expect(page.getByText("Data Insight Hub")).toBeVisible();

    // Click the "Back to Homepage" button
    await page.getByTestId("btn-back-home").click();

    // Verify URL updates to /?step=1
    await expect(page).toHaveURL(/.*\?step=1$/);

    // Verify we're back to Journey Welcome (step 1)
    await page.waitForSelector('[data-testid="journey-welcome"]');
    await expect(page.getByTestId("journey-welcome")).toBeVisible();

    // Verify the welcome content is visible (use more specific selectors)
    await expect(page.getByRole("heading", { name: "Welcome to Your Journey" })).toBeVisible();
    await expect(page.getByText("Start your environmental exploration")).toBeVisible();

    // Verify the Next button is visible and clickable
    const nextButton = page.getByRole("button", { name: /Next/i });
    await expect(nextButton).toBeVisible();
    await expect(nextButton).toBeEnabled();

    // Verify the step indicator shows step 1
    await expect(page.getByText("Step 1")).toBeVisible();
  });

  test("TC-1.8.2: Journey Welcome loads correctly after returning from Data Insight", async ({
    page,
  }) => {
    // Navigate to Data Insight page first
    await page.goto("/");

    // Click start environmental journey button
    await page.getByRole("button", { name: /Start My Environmental Journey/i }).click();

    // Wait for page to load and click next
    await page.waitForSelector('[data-testid="journey-welcome"]');
    await page.getByRole("button", { name: /Next/i }).click();

    // Verify Data Insight page loads
    await page.waitForSelector('[data-testid="data-insight"]');

    // Return to homepage
    await page.getByTestId("btn-back-home").click();

    // Wait for Journey Welcome to load
    await page.waitForSelector('[data-testid="journey-welcome"]');

    // Verify all Journey Welcome elements are properly loaded
    await expect(page.getByTestId("journey-welcome")).toBeVisible();

    // Verify welcome content (use specific selectors)
    await expect(page.getByRole("heading", { name: "Welcome to Your Journey" })).toBeVisible();
    await expect(page.getByText("Start your environmental exploration")).toBeVisible();

    // Verify the Next button is interactive
    const nextButton = page.getByRole("button", { name: /Next/i });
    await expect(nextButton).toBeVisible();
    await expect(nextButton).toBeEnabled();

    // Verify step indicator
    await expect(page.getByText("Step 1")).toBeVisible();

    // Verify the page is ready for user interaction
    await expect(page.getByTestId("journey-welcome")).toBeVisible();
  });

  test("TC-1.8.3: Navigation state is properly reset after returning to homepage", async ({
    page,
  }) => {
    // Navigate to Data Insight page
    await page.goto("/");

    // Click start environmental journey button
    await page.getByRole("button", { name: /Start My Environmental Journey/i }).click();

    // Wait for page to load and click next
    await page.waitForSelector('[data-testid="journey-welcome"]');
    await page.getByRole("button", { name: /Next/i }).click();

    // Verify Data Insight page loads
    await page.waitForSelector('[data-testid="data-insight"]');

    // Verify we are on step 2
    await expect(page.getByText("Data Insight Hub")).toBeVisible();

    // Return to homepage
    await page.getByTestId("btn-back-home").click();

    // Verify URL is reset to step 1
    await expect(page).toHaveURL(/.*\?step=1$/);

    // Verify Journey Welcome is visible
    await page.waitForSelector('[data-testid="journey-welcome"]');
    await expect(page.getByTestId("journey-welcome")).toBeVisible();

    // Verify the journey can be continued from step 1
    const startButton = page.getByRole("button", { name: /Start My Environmental Journey/i });
    await expect(startButton).toBeVisible();
    await expect(startButton).toBeEnabled();

    // Click start button to verify it works
    await startButton.click();

    // Wait for the 1.5 second delay in JourneyWelcome component
    await page.waitForTimeout(2000);

    // Wait for navigation to complete and verify we're on Data Insight
    await page.waitForSelector('[data-testid="data-insight"]', { timeout: 15000 });
    await expect(page.getByText("Data Insight Hub")).toBeVisible();

    // Verify URL is now step 2
    await expect(page).toHaveURL(/.*\?step=2$/);
  });
});
