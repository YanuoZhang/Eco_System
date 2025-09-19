import { test, expect } from "@playwright/test";
import { loginViaApi } from "./test-utils";

test.skip("Transport quiz section loads and functions correctly", async ({ page, request }) => {
  await loginViaApi(request, page);
  await page.goto("/quiz");
  await page.waitForLoadState("domcontentloaded");

  // Wait for the quiz page to load completely
  await page.waitForLoadState("networkidle");
  await expect(page.getByText(/Electricity Usage/i)).toBeVisible();

  // Scroll to transport section and wait for it to be visible
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(500);

  const carSection = page.getByTestId("car-section");
  await carSection.waitFor({ state: "visible" });
  await carSection.scrollIntoViewIfNeeded();

  // Enable car transport by clicking the hidden checkbox directly with force
  await carSection.locator('input[type="checkbox"]').click({ force: true });

  // Wait for React state to update and input fields to appear
  await page.waitForTimeout(500);
  await carSection.getByTestId("car-distance").waitFor({ state: "visible" });
  await carSection.getByTestId("car-fuel").waitFor({ state: "visible" });
  await carSection.getByTestId("car-vehicle").waitFor({ state: "visible" });

  // Test input fields
  const distanceInput = carSection.getByTestId("car-distance");
  await distanceInput.fill("50");
  await expect(distanceInput).toHaveValue("50");

  // Test fuel type selection
  const fuelSelect = carSection.getByTestId("car-fuel");
  await fuelSelect.selectOption("electric");
  await expect(fuelSelect).toHaveValue("electric");

  // Test vehicle size selection
  const vehicleSelect = carSection.getByTestId("car-vehicle");
  await vehicleSelect.selectOption("medium");
  await expect(vehicleSelect).toHaveValue("medium");

  // Test public transport
  const busSection = page.getByTestId("bus-section");
  // Click checkbox programmatically to avoid visual switch intercepting pointer events
  await busSection.evaluate((el) => {
    const checkbox = el.querySelector('[data-testid="bus-toggle"]') as HTMLInputElement | null;
    if (checkbox && !checkbox.checked) checkbox.click();
  });
  await expect(busSection.locator('input[type="checkbox"]').first()).toBeChecked();
  await page.waitForTimeout(500);

  // Check if bus input appears
  await expect(busSection.getByText(/Weekly bus distance/i)).toBeVisible();

  const busDistanceInput = busSection.getByTestId("bus-distance");
  await busDistanceInput.fill("20");
  await expect(busDistanceInput).toHaveValue("20");

  // Test active transport
  const walkingSection = page.getByTestId("walking-section");
  await walkingSection.scrollIntoViewIfNeeded();
  await walkingSection.evaluate((el) => {
    const checkbox = el.querySelector('[data-testid="walking-toggle"]') as HTMLInputElement | null;
    if (checkbox && !checkbox.checked) checkbox.click();
  });
  await expect(walkingSection.locator('input[type="checkbox"]').first()).toBeChecked();
  await page.waitForTimeout(500);

  // Check if walking input appears
  await expect(walkingSection.getByText(/Weekly walking distance/i)).toBeVisible();

  const walkingDistanceInput = walkingSection.getByTestId("walking-distance");
  await walkingDistanceInput.fill("10");
  await expect(walkingDistanceInput).toHaveValue("10");

  // Check if summary appears
  await expect(page.getByText(/Weekly Transport Summary/i)).toBeVisible();
  await expect(page.getByTestId("transport-summary-emissions")).toBeVisible();
});

test.skip("Transport emissions calculation updates correctly", async ({ page, request }) => {
  await loginViaApi(request, page);
  await page.goto("/quiz");
  await page.waitForLoadState("domcontentloaded");

  // Wait for the quiz page to load completely
  await page.waitForLoadState("networkidle");
  await expect(page.getByText(/Electricity Usage/i)).toBeVisible();

  // Scroll to transport section and wait for it to be visible
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(500);

  const carSection = page.getByTestId("car-section");
  await carSection.waitFor({ state: "visible" });
  await carSection.scrollIntoViewIfNeeded();

  // Enable car transport by clicking the hidden checkbox directly with force
  await carSection.locator('input[type="checkbox"]').click({ force: true });

  // Wait for React state to update and input fields to appear
  await page.waitForTimeout(500);
  await carSection.getByTestId("car-distance").waitFor({ state: "visible" });
  const distanceInput = carSection.getByTestId("car-distance");
  await distanceInput.fill("100");

  // Set fuel type to petrol
  const fuelSelect = carSection.getByTestId("car-fuel");
  await fuelSelect.selectOption("petrol");

  // Check if emissions calculation appears in summary
  await expect(page.getByTestId("transport-summary-emissions")).toBeVisible();
  // The calculation should show some emissions value
  const summaryText = await page.getByTestId("transport-summary-emissions").textContent();
  expect(summaryText).toMatch(/\d+\.\d+ kg CO₂\/year/);
});
