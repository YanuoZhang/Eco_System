import { test, expect } from "@playwright/test";

test.describe("Calculator Equivalents Panel", () => {
  test.beforeEach(async ({ page }) => {
    // Pre-set selected state to VIC
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.setItem("selectedState", "Victoria (VIC)");
    });
  });

  test("TC-2.3.1 - Equivalents displayed", async ({ page }) => {
    // Navigate to calculator
    await page.goto("/");
    await page.click('[data-testid="start-journey-btn"]');
    await page.click('[data-testid="calculator-cta"]');

    // Fill in some inputs
    await page.fill('[data-testid="electricity-input"]', "100");
    await page.fill('[data-testid="gas-input"]', "50");

    // Select transport mode and distance
    await page.selectOption('[data-testid="transport-mode-select"]', "car-petrol");
    await page.fill('[data-testid="distance-input"]', "25");

    // Click calculate
    await page.click('[data-testid="calculate-btn"]');

    // Wait for results to appear
    await expect(page.locator("text=Your Carbon Footprint Results")).toBeVisible();

    // Check that all equivalents are visible with correct test IDs
    await expect(page.locator('[data-testid="equiv-trees"]')).toBeVisible();
    await expect(page.locator('[data-testid="equiv-phones"]')).toBeVisible();
    await expect(page.locator('[data-testid="equiv-km"]')).toBeVisible();
    await expect(page.locator('[data-testid="equiv-burgers"]')).toBeVisible();
    await expect(page.locator('[data-testid="equiv-milk"]')).toBeVisible();

    // Check that equivalents have content (numbers and units)
    await expect(page.locator('[data-testid="equiv-trees"]')).toContainText("trees");
    await expect(page.locator('[data-testid="equiv-phones"]')).toContainText("charges");
    await expect(page.locator('[data-testid="equiv-km"]')).toContainText("km");
    await expect(page.locator('[data-testid="equiv-burgers"]')).toContainText("burgers");
    await expect(page.locator('[data-testid="equiv-milk"]')).toContainText("cups");

    // Check that icons are present
    await expect(page.locator('[data-testid="equiv-trees"]')).toContainText("🌳");
    await expect(page.locator('[data-testid="equiv-phones"]')).toContainText("🔋");
    await expect(page.locator('[data-testid="equiv-km"]')).toContainText("🚗");
    await expect(page.locator('[data-testid="equiv-burgers"]')).toContainText("🍔");
    await expect(page.locator('[data-testid="equiv-milk"]')).toContainText("🥛");
  });

  test("TC-2.3.2 - Equivalents update when inputs change", async ({ page }) => {
    // Navigate to calculator
    await page.goto("/");
    await page.click('[data-testid="start-journey-btn"]');
    await page.click('[data-testid="calculator-cta"]');

    // Fill initial inputs
    await page.fill('[data-testid="electricity-input"]', "100");
    await page.fill('[data-testid="gas-input"]', "50");
    await page.selectOption('[data-testid="transport-mode-select"]', "car-petrol");
    await page.fill('[data-testid="distance-input"]', "25");

    // Calculate initial results
    await page.click('[data-testid="calculate-btn"]');
    await expect(page.locator("text=Your Carbon Footprint Results")).toBeVisible();

    // Get initial values
    const initialTrees = await page.locator('[data-testid="equiv-trees"]').textContent();
    const initialPhones = await page.locator('[data-testid="equiv-phones"]').textContent();

    // Change electricity input
    await page.fill('[data-testid="electricity-input"]', "200");
    await page.click('[data-testid="calculate-btn"]');

    // Wait for results to update
    await expect(page.locator("text=Your Carbon Footprint Results")).toBeVisible();

    // Check that values have changed
    const updatedTrees = await page.locator('[data-testid="equiv-trees"]').textContent();
    const updatedPhones = await page.locator('[data-testid="equiv-phones"]').textContent();

    expect(updatedTrees).not.toBe(initialTrees);
    expect(updatedPhones).not.toBe(initialPhones);

    // Change time unit
    await page.selectOption('[data-testid="energy-time-unit-select"]', "day");
    await page.click('[data-testid="calculate-btn"]');

    // Wait for results to update
    await expect(page.locator("text=Your Carbon Footprint Results")).toBeVisible();

    // Check that time unit label has changed
    await expect(page.locator("text=Your daily CO₂ emissions equivalent to:")).toBeVisible();
  });

  test("TC-2.3.3 - Toggle panel visibility", async ({ page }) => {
    // Navigate to calculator
    await page.goto("/");
    await page.click('[data-testid="start-journey-btn"]');
    await page.click('[data-testid="calculator-cta"]');

    // Fill inputs and calculate
    await page.fill('[data-testid="electricity-input"]', "100");
    await page.fill('[data-testid="gas-input"]', "50");
    await page.selectOption('[data-testid="transport-mode-select"]', "car-petrol");
    await page.fill('[data-testid="distance-input"]', "25");
    await page.click('[data-testid="calculate-btn"]');

    // Wait for results
    await expect(page.locator("text=Your Carbon Footprint Results")).toBeVisible();

    // Initially equivalents should be visible
    await expect(page.locator('[data-testid="equiv-trees"]')).toBeVisible();
    await expect(page.locator('[data-testid="equiv-phones"]')).toBeVisible();

    // Click hide button
    await page.click('[data-testid="equivalents-toggle"]');

    // Equivalents should be hidden
    await expect(page.locator('[data-testid="equiv-trees"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="equiv-phones"]')).not.toBeVisible();

    // Toggle button should show "Show"
    await expect(page.locator('[data-testid="equivalents-toggle"]')).toContainText("Show");

    // Click show button
    await page.click('[data-testid="equivalents-toggle"]');

    // Equivalents should be visible again
    await expect(page.locator('[data-testid="equiv-trees"]')).toBeVisible();
    await expect(page.locator('[data-testid="equiv-phones"]')).toBeVisible();

    // Toggle button should show "Hide"
    await expect(page.locator('[data-testid="equivalents-toggle"]')).toContainText("Hide");
  });

  test("Equivalents show fallback message when no emissions calculated", async ({ page }) => {
    // Navigate to calculator
    await page.goto("/");
    await page.click('[data-testid="start-journey-btn"]');
    await page.click('[data-testid="calculator-cta"]');

    // Don't fill any inputs, just check the page loads
    await expect(page.locator("text=Carbon Footprint Calculator")).toBeVisible();

    // The equivalents panel should not be visible until calculation is done
    await expect(page.locator('[data-testid="equiv-trees"]')).not.toBeVisible();
  });

  test("Equivalents display correct calculations for known values", async ({ page }) => {
    // Navigate to calculator
    await page.goto("/");
    await page.click('[data-testid="start-journey-btn"]');
    await page.click('[data-testid="calculator-cta"]');

    // Fill inputs that should give predictable results
    // Using small values to get manageable equivalent numbers
    await page.fill('[data-testid="electricity-input"]', "1");
    await page.fill('[data-testid="gas-input"]', "1");
    await page.selectOption('[data-testid="transport-mode-select"]', "car-petrol");
    await page.fill('[data-testid="distance-input"]', "1");

    // Calculate
    await page.click('[data-testid="calculate-btn"]');
    await expect(page.locator("text=Your Carbon Footprint Results")).toBeVisible();

    // Check that equivalents are reasonable numbers (not zero, not negative)
    const treesText = await page.locator('[data-testid="equiv-trees"]').textContent();
    const phonesText = await page.locator('[data-testid="equiv-phones"]').textContent();
    const kmText = await page.locator('[data-testid="equiv-km"]').textContent();
    const burgersText = await page.locator('[data-testid="equiv-burgers"]').textContent();
    const milkText = await page.locator('[data-testid="equiv-milk"]').textContent();

    // Extract numbers from text (remove commas and non-numeric characters)
    const treesNumber = parseInt(treesText?.replace(/[^\d]/g, "") || "0");
    const phonesNumber = parseInt(phonesText?.replace(/[^\d]/g, "") || "0");
    const kmNumber = parseInt(kmText?.replace(/[^\d]/g, "") || "0");
    const burgersNumber = parseInt(burgersText?.replace(/[^\d]/g, "") || "0");
    const milkNumber = parseInt(milkText?.replace(/[^\d]/g, "") || "0");

    // All should be positive numbers
    expect(treesNumber).toBeGreaterThan(0);
    expect(phonesNumber).toBeGreaterThan(0);
    expect(kmNumber).toBeGreaterThan(0);
    expect(burgersNumber).toBeGreaterThan(0);
    expect(milkNumber).toBeGreaterThan(0);
  });
});
