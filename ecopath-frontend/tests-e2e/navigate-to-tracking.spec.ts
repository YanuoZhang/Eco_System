import { test, expect } from "@playwright/test";

test.describe("US 2.5 - Navigate to Next Step (Tracking)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("TC-2.5.1: Route to next step (Tracking)", async ({ page }) => {
    // Start the journey
    await page.click("text=Start Your Journey");
    await expect(page).toHaveURL(/.*step=1/);

    // Navigate to step 2 (Data Insight)
    await page.click("text=Continue to Environment");
    await expect(page).toHaveURL(/.*step=2/);

    // Verify we're on Data Insight page
    await expect(page.locator("h1")).toContainText("Data Insight Hub");
    await expect(page.locator('[data-testid="data-insight"]')).toBeVisible();

    // Click Next Step to go to Tracking page
    await page.click("text=Next Journey");
    await expect(page).toHaveURL(/.*step=4/);

    // Verify we're on the Tracking page
    await expect(page.locator("h1")).toContainText("Progress Tracking");
    await expect(page.locator('[data-testid="progress-tracker"]')).toBeVisible();

    // Verify tracking-specific content is displayed
    await expect(page.locator("text=Monitor your environmental progress")).toBeVisible();
    await expect(page.locator("text=Monthly progress tracking")).toBeVisible();
    await expect(page.locator("text=Goal setting and monitoring")).toBeVisible();
    await expect(page.locator("text=Personalized improvement suggestions")).toBeVisible();

    // Verify navigation buttons are present
    await expect(page.locator("text=Previous Step")).toBeVisible();
    await expect(page.locator("text=Next Journey")).toBeVisible();
  });

  test("Navigation flow from Calculator to Tracking", async ({ page }) => {
    // Navigate to step 3 (Calculator)
    await page.goto("/?step=3");
    await expect(page).toHaveURL(/.*step=3/);

    // Verify we're on Calculator page
    await expect(page.locator("h1")).toContainText("Carbon Footprint Calculator");

    // Click Next Step to go to Tracking page
    await page.click("text=Next Journey");
    await expect(page).toHaveURL(/.*step=4/);

    // Verify we're on the Tracking page
    await expect(page.locator("h1")).toContainText("Progress Tracking");
    await expect(page.locator('[data-testid="progress-tracker"]')).toBeVisible();
  });

  test("Tracking page displays first-time user experience", async ({ page }) => {
    // Navigate directly to Tracking page
    await page.goto("/?step=4");
    await expect(page).toHaveURL(/.*step=4/);

    // Verify first-time user experience is shown
    await expect(page.locator("text=Save Your First Data Point")).toBeVisible();
    await expect(page.locator("text=Save My Environmental Data")).toBeVisible();
    await expect(page.locator("text=Your Current Footprint Summary")).toBeVisible();

    // Verify tracking features are displayed
    await expect(page.locator("text=Track Progress")).toBeVisible();
    await expect(page.locator("text=Set Goals")).toBeVisible();
    await expect(page.locator("text=Celebrate Wins")).toBeVisible();
  });

  test("Data saving functionality works", async ({ page }) => {
    // Navigate to Tracking page
    await page.goto("/?step=4");
    await expect(page).toHaveURL(/.*step=4/);

    // Click save data button
    await page.click("text=Save My Environmental Data");

    // Verify data was saved (check localStorage)
    const savedData = await page.evaluate(() => {
      return localStorage.getItem("carbonFootprintHistory");
    });
    expect(savedData).toBeTruthy();

    // Verify the UI changes after saving
    await expect(page.locator("text=Save Your First Data Point")).not.toBeVisible();
  });

  test("Navigation buttons work correctly", async ({ page }) => {
    // Navigate to Tracking page
    await page.goto("/?step=4");
    await expect(page).toHaveURL(/.*step=4/);

    // Test Previous Step button
    await page.click("text=Previous Step");
    await expect(page).toHaveURL(/.*step=3/);
    await expect(page.locator("h1")).toContainText("Carbon Footprint Calculator");

    // Go back to Tracking page
    await page.goto("/?step=4");

    // Test Next Journey button
    await page.click("text=Next Journey");
    await expect(page).toHaveURL(/.*step=1/);
    await expect(page.locator("h1")).toContainText("Welcome to Your Journey");
  });
});
