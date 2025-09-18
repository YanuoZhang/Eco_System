import { test, expect } from "@playwright/test";

test("Transport quiz section loads and functions correctly", async ({ page }) => {
  await page.goto("/quiz");
  await page.waitForLoadState("networkidle");

  // Check if transport section is visible
  await expect(page.getByText(/Weekly Transport Habits/i)).toBeVisible();

  // Click to expand transport section
  await page.getByText(/Weekly Transport Habits/i).click();
  await page.waitForTimeout(500);

  // Check if transport options are visible
  await expect(page.getByRole("heading", { name: "Car" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Bus" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Train" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Walking" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Cycling" })).toBeVisible();

  // Test car transport configuration
  const carToggle = page.locator('input[type="checkbox"]').first();
  await carToggle.check();
  await page.waitForTimeout(500);

  // Check if car options appear
  await expect(page.getByText(/Weekly driving distance/i)).toBeVisible();
  await expect(page.getByText(/Fuel Type/i)).toBeVisible();
  await expect(page.getByText(/Vehicle Size/i)).toBeVisible();

  // Test input fields
  const distanceInput = page.locator('input[placeholder="0"]').first();
  await distanceInput.fill("50");
  await expect(distanceInput).toHaveValue("50");

  // Test fuel type selection
  const fuelSelect = page.locator("select").first();
  await fuelSelect.selectOption("electric");
  await expect(fuelSelect).toHaveValue("electric");

  // Test vehicle size selection
  const vehicleSelect = page.locator("select").nth(1);
  await vehicleSelect.selectOption("medium");
  await expect(vehicleSelect).toHaveValue("medium");

  // Test public transport
  const busToggle = page.locator('input[type="checkbox"]').nth(1);
  await busToggle.check();
  await page.waitForTimeout(500);

  // Check if bus input appears
  await expect(page.getByText(/Weekly bus distance/i)).toBeVisible();

  const busDistanceInput = page.locator('input[placeholder="0"]').nth(1);
  await busDistanceInput.fill("20");
  await expect(busDistanceInput).toHaveValue("20");

  // Test active transport
  const walkingToggle = page.locator('input[type="checkbox"]').nth(4);
  await walkingToggle.check();
  await page.waitForTimeout(500);

  // Check if walking input appears
  await expect(page.getByText(/Weekly walking distance/i)).toBeVisible();

  const walkingDistanceInput = page.locator('input[placeholder="0"]').nth(2);
  await walkingDistanceInput.fill("10");
  await expect(walkingDistanceInput).toHaveValue("10");

  // Check if summary appears
  await expect(page.getByText(/Weekly Transport Summary/i)).toBeVisible();
  await expect(page.getByText(/kg CO₂\/year/i)).toBeVisible();
});

test("Transport emissions calculation updates correctly", async ({ page }) => {
  await page.goto("/quiz");
  await page.waitForLoadState("networkidle");

  // Expand transport section
  await page.getByText(/Weekly Transport Habits/i).click();
  await page.waitForTimeout(500);

  // Enable car transport
  const carToggle = page.locator('input[type="checkbox"]').first();
  await carToggle.check();

  // Set car distance
  const distanceInput = page.locator('input[placeholder="0"]').first();
  await distanceInput.fill("100");

  // Set fuel type to petrol
  const fuelSelect = page.locator("select").first();
  await fuelSelect.selectOption("petrol");

  // Check if emissions calculation appears in summary
  await expect(page.getByText(/kg CO₂\/year/i)).toBeVisible();

  // The calculation should show some emissions value
  const summaryText = await page.getByText(/kg CO₂\/year/i).textContent();
  expect(summaryText).toMatch(/\d+\.\d+ kg CO₂\/year/);
});
