import { test, expect } from "@playwright/test";
import { loginViaApi } from "./test-utils";

test("Transport quiz section loads and functions correctly", async ({ page }) => {
  await loginViaApi(page);
  await page.goto("/quiz");
  await page.waitForLoadState("domcontentloaded");

  // Nudge layout and wait for car section to attach (slow env safety)
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(100);
  const carSectionInit = page.getByTestId("car-section");
  await page.waitForSelector('[data-testid="car-section"]', { state: "attached" });
  await carSectionInit.scrollIntoViewIfNeeded();
  await carSectionInit.waitFor({ state: "visible" });

  // Scope to Car section then toggle and assert inputs appear
  const carSection = page.getByTestId("car-section");
  await carSection.evaluate((el) => {
    const checkbox = el.querySelector('input[type="checkbox"]') as HTMLInputElement | null;
    if (checkbox && !checkbox.checked) checkbox.click();
  });
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

test("Transport emissions calculation updates correctly", async ({ page }) => {
  await loginViaApi(page);
  await page.goto("/quiz");
  await page.waitForLoadState("domcontentloaded");

  // Ensure car section is in DOM, then scroll into view and wait visible
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(100);
  const carSection = page.getByTestId("car-section");
  await page.waitForSelector('[data-testid="car-section"]', { state: "attached" });
  await carSection.scrollIntoViewIfNeeded();
  await carSection.waitFor({ state: "visible" });

  // Enable car transport via section label
  const carSection2 = page.getByTestId("car-section");
  await carSection2.evaluate((el) => {
    const checkbox = el.querySelector('input[type="checkbox"]') as HTMLInputElement | null;
    if (checkbox && !checkbox.checked) checkbox.click();
  });

  // Set car distance
  const distanceInput = carSection2.getByTestId("car-distance");
  await distanceInput.fill("100");

  // Set fuel type to petrol
  const fuelSelect = carSection2.getByTestId("car-fuel");
  await fuelSelect.selectOption("petrol");

  // Check if emissions calculation appears in summary
  await expect(page.getByTestId("transport-summary-emissions")).toBeVisible();
  // The calculation should show some emissions value
  const summaryText = await page.getByTestId("transport-summary-emissions").textContent();
  expect(summaryText).toMatch(/\d+\.\d+ kg CO₂\/year/);
});
