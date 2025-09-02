import { test, expect } from "@playwright/test";

test.describe("Energy Mix Chart E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Pre-set selected state to VIC
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.setItem("selectedState", "Victoria (VIC)");
    });
  });

  test("TC-1.2.1: Chart renders after selecting state", async ({ page }) => {
    // Navigate to homepage
    await page.goto("/");

    // Click start environmental journey button
    await page.getByRole("button", { name: /Start My Environmental Journey/i }).click();

    // Wait for page to load and click next
    await page.waitForSelector('[data-testid="journey-welcome"]');
    await page.getByRole("button", { name: /Next/i }).click();

    // Verify Data Insight page loads
    await page.waitForSelector('[data-testid="data-insight"]');

    // Verify Energy Mix tab exists
    await expect(page.getByTestId("energy-tab")).toBeVisible();

    // Click Energy Mix tab
    await page.getByTestId("energy-tab").click();

    // Verify chart renders
    await expect(page.getByTestId("energy-mix-chart")).toBeVisible();

    // Verify chart data displays correctly
    await expect(page.getByText("Coal")).toBeVisible();
    await expect(page.getByText("45.2%")).toBeVisible();
    await expect(page.getByText("8,450 MW")).toBeVisible();
  });

  test("TC-1.2.2: Hovering over chart segments shows tooltip with correct info", async ({
    page,
  }) => {
    // Navigate to homepage
    await page.goto("/");

    // Click start environmental journey button
    await page.getByRole("button", { name: /Start My Environmental Journey/i }).click();

    // Wait for page to load and click next
    await page.waitForSelector('[data-testid="journey-welcome"]');
    await page.getByRole("button", { name: /Next/i }).click();

    // Verify Data Insight page loads
    await page.waitForSelector('[data-testid="data-insight"]');

    // Click Energy Mix tab
    await page.getByTestId("energy-tab").click();

    // Wait for chart to load
    await page.waitForSelector('[data-testid="energy-mix-chart"]');

    // Hover over first energy source (Coal)
    const coalSegment = page
      .locator('[data-testid="energy-mix-chart"] .bg-white.rounded-lg')
      .first();
    await coalSegment.hover();

    // Verify tooltip appears
    await expect(page.locator(".absolute.z-50.bg-white")).toBeVisible();

    // Verify tooltip content is correct
    await expect(page.locator(".absolute.z-50.bg-white")).toContainText("Coal");
    await expect(page.locator(".absolute.z-50.bg-white")).toContainText(
      "45.2% of total generation",
    );
    await expect(page.locator(".absolute.z-50.bg-white")).toContainText("Capacity: 8,450 MW");

    // Hover over another energy source (Wind)
    const windSegment = page
      .locator('[data-testid="energy-mix-chart"] .bg-white.rounded-lg')
      .nth(2);
    await windSegment.hover();

    // Verify tooltip updates
    await expect(page.locator(".absolute.z-50.bg-white")).toContainText("Wind");
    await expect(page.locator(".absolute.z-50.bg-white")).toContainText(
      "22.8% of total generation",
    );
  });

  test("Chart updates when switching states", async ({ page }) => {
    // Navigate to homepage
    await page.goto("/");

    // Click start environmental journey button
    await page.getByRole("button", { name: /Start My Environmental Journey/i }).click();

    // Wait for page to load and click next
    await page.waitForSelector('[data-testid="journey-welcome"]');
    await page.getByRole("button", { name: /Next/i }).click();

    // Verify Data Insight page loads
    await page.waitForSelector('[data-testid="data-insight"]');

    // Click Energy Mix tab
    await page.getByTestId("energy-tab").click();

    // Wait for chart to load
    await page.waitForSelector('[data-testid="energy-mix-chart"]');

    // Verify VIC initial data
    await expect(page.getByText("Coal")).toBeVisible();
    await expect(page.getByText("45.2%")).toBeVisible();

    // Switch to NSW
    await page.getByTestId("state-selector").click();
    await page.getByTestId("state-option-New-South-Wales-NSW").click();

    // Wait for chart to update
    await page.waitForTimeout(1000);

    // Verify NSW data
    await expect(page.getByText("Coal")).toBeVisible();
    await expect(page.getByText("52.1%")).toBeVisible();
    await expect(page.getByText("12,300 MW")).toBeVisible();
  });

  test("Chart accessibility features work correctly", async ({ page }) => {
    // Navigate to homepage
    await page.goto("/");

    // Click start environmental journey button
    await page.getByRole("button", { name: /Start My Environmental Journey/i }).click();

    // Wait for page to load and click next
    await page.waitForSelector('[data-testid="journey-welcome"]');
    await page.getByRole("button", { name: /Next/i }).click();

    // Verify Data Insight page loads
    await page.waitForSelector('[data-testid="data-insight"]');

    // Click Energy Mix tab
    await page.getByTestId("energy-tab").click();

    // Wait for chart to load
    await page.waitForSelector('[data-testid="energy-mix-chart"]');

    // Verify keyboard navigation
    const firstSegment = page
      .locator('[data-testid="energy-mix-chart"] .bg-white.rounded-lg')
      .first();
    await firstSegment.focus();

    // Press Enter key should show tooltip
    await firstSegment.press("Enter");
    await expect(page.locator(".absolute.z-50.bg-white")).toBeVisible();

    // Verify ARIA labels
    await expect(firstSegment).toHaveAttribute("aria-label");
    const ariaLabel = await firstSegment.getAttribute("aria-label");
    expect(ariaLabel).toContain("Coal");
    expect(ariaLabel).toContain("45.2%");
  });
});
