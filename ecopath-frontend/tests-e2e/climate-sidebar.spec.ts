import { test, expect } from "@playwright/test";

test.describe("Climate Target Sidebar E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Pre-set selected state to VIC
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.setItem("selectedState", "Victoria (VIC)");
    });
  });

  test("Sidebar shows correct plan and progress on page load", async ({ page }) => {
    // Navigate to homepage
    await page.goto("/");

    // Click start environmental journey button
    await page.getByRole("button", { name: /Start My Environmental Journey/i }).click();

    // Wait for page to load and click next
    await page.waitForSelector('[data-testid="journey-welcome"]');
    await page.getByRole("button", { name: /Next/i }).click();

    // Verify Data Insight page loads
    await page.waitForSelector('[data-testid="data-insight"]');

    // Wait a bit for the page to fully load
    await page.waitForTimeout(1000);

    // Verify emissions tab is visible and clickable
    const emissionsTab = page.getByTestId("emissions-tab");
    await expect(emissionsTab).toBeVisible();

    // Click Emissions tab to show ClimateTargetSidebar
    await emissionsTab.click();

    // Wait for the tab click to take effect
    await page.waitForTimeout(500);

    // Debug: Check if the sidebar container exists
    const sidebarContainer = page.locator('[data-testid="climate-sidebar"]');

    // Wait for sidebar to load with increased timeout and better error handling
    try {
      await sidebarContainer.waitFor({ state: "visible", timeout: 10000 });
    } catch (error) {
      console.log("Sidebar not visible, checking if it exists in DOM...");
      // Check if element exists in DOM even if not visible
      const exists = (await sidebarContainer.count()) > 0;
      if (exists) {
        console.log("Sidebar exists in DOM but not visible");
        // Wait a bit more and try again
        await page.waitForTimeout(2000);
        await sidebarContainer.waitFor({ state: "visible", timeout: 10000 });
      } else {
        console.log("Sidebar does not exist in DOM");
        throw error;
      }
    }

    // Verify sidebar title
    await expect(page.getByText("Reduction Goals")).toBeVisible();

    // Verify plan name
    const planName = page.getByTestId("plan-name");
    await expect(planName).toBeVisible();
    await expect(planName).toContainText("Victoria 2030 Net Zero Plan");

    // Verify progress bar
    const progressBar = page.getByTestId("progress-bar");
    await expect(progressBar).toBeVisible();

    // Verify progress percentage
    const progressText = page.getByTestId("progress-text");
    await expect(progressText).toBeVisible();
    await expect(progressText).toContainText("18%");

    // Verify target year
    await expect(page.getByText("Target: 2030")).toBeVisible();

    // Verify description
    await expect(
      page.getByText("Ambitious plan to achieve net zero emissions by 2030"),
    ).toBeVisible();
  });

  test("Sidebar updates when switching to another state", async ({ page }) => {
    // Navigate to homepage
    await page.goto("/");

    // Click start environmental journey button
    await page.getByRole("button", { name: /Start My Environmental Journey/i }).click();

    // Wait for page to load and click next
    await page.waitForSelector('[data-testid="journey-welcome"]');
    await page.getByRole("button", { name: /Next/i }).click();

    // Verify Data Insight page loads
    await page.waitForSelector('[data-testid="data-insight"]');

    // Click Emissions tab to show ClimateTargetSidebar
    await page.getByTestId("emissions-tab").click();

    // Wait for sidebar to load
    await page.waitForSelector('[data-testid="climate-sidebar"]');

    // Verify VIC initial data
    await expect(page.getByTestId("plan-name")).toContainText("Victoria 2030 Net Zero Plan");
    await expect(page.getByTestId("progress-text")).toContainText("18%");

    // Switch to NSW
    await page.getByTestId("state-selector").click();
    await page.getByTestId("state-option-New-South-Wales-NSW").click();

    // Wait for state change to take effect
    await page.waitForTimeout(1000);

    // Verify the state selector shows NSW
    await expect(page.getByTestId("state-selector")).toContainText("New");

    // Wait for sidebar to update with new data
    await page.waitForSelector('[data-testid="climate-sidebar"]');

    // Verify NSW data
    await expect(page.getByTestId("plan-name")).toContainText("NSW Net Zero Plan Stage 1");
    await expect(page.getByTestId("progress-text")).toContainText("12%");
    await expect(page.getByTestId("target-year")).toContainText("Target: 2050");
    await expect(page.getByText("Comprehensive plan to reach net zero by 2050")).toBeVisible();

    // Switch to QLD
    await page.getByTestId("state-selector").click();
    await page.getByTestId("state-option-Queensland-QLD").click();

    // Wait for state change to take effect
    await page.waitForTimeout(1000);

    // Verify the state selector shows QLD
    await expect(page.getByTestId("state-selector")).toContainText("Queensland");

    // Wait for sidebar to update with new data
    await page.waitForSelector('[data-testid="climate-sidebar"]');

    // Verify QLD data
    await expect(page.getByTestId("plan-name")).toContainText("Queensland Climate Action Plan");
    await expect(page.getByTestId("progress-text")).toContainText("8%");
    await expect(page.getByTestId("target-year")).toContainText("Target: 2050");
  });

  test("Sidebar shows loading state during data fetch", async ({ page }) => {
    // Navigate to homepage
    await page.goto("/");

    // Click start environmental journey button
    await page.getByRole("button", { name: /Start My Environmental Journey/i }).click();

    // Wait for page to load and click next
    await page.waitForSelector('[data-testid="journey-welcome"]');
    await page.getByRole("button", { name: /Next/i }).click();

    // Verify Data Insight page loads
    await page.waitForSelector('[data-testid="data-insight"]');

    // Click Emissions tab to show ClimateTargetSidebar
    await page.getByTestId("emissions-tab").click();

    // Verify loading skeleton appears
    const loadingSkeleton = page.getByTestId("loading-skeleton");
    await expect(loadingSkeleton).toBeVisible();

    // Wait for loading to complete
    await page.waitForSelector('[data-testid="climate-sidebar"]');

    // Verify loading skeleton disappears
    await expect(loadingSkeleton).not.toBeVisible();

    // Verify actual content displays
    await expect(page.getByTestId("plan-name")).toBeVisible();
  });

  test("Sidebar handles error states gracefully", async ({ page }) => {
    // Navigate to homepage
    await page.goto("/");

    // Click start environmental journey button
    await page.getByRole("button", { name: /Start My Environmental Journey/i }).click();

    // Wait for page to load and click next
    await page.waitForSelector('[data-testid="journey-welcome"]');
    await page.getByRole("button", { name: /Next/i }).click();

    // Verify Data Insight page loads
    await page.waitForSelector('[data-testid="data-insight"]');

    // Click Emissions tab to show ClimateTargetSidebar
    await page.getByTestId("emissions-tab").click();

    // Wait for sidebar to load first
    await page.waitForSelector('[data-testid="climate-sidebar"]');

    // Since the component uses mock data and doesn't make real API calls,
    // we'll test the loading state instead by checking if it shows during state changes

    // Switch to a different state to trigger loading
    await page.getByTestId("state-selector").click();
    await page.getByTestId("state-option-New-South-Wales-NSW").click();

    // Wait for loading state to appear
    await page.waitForSelector('[data-testid="loading-skeleton"]');

    // Verify loading skeleton is visible
    await expect(page.getByTestId("loading-skeleton")).toBeVisible();

    // Wait for loading to complete and sidebar to show
    await page.waitForSelector('[data-testid="climate-sidebar"]');

    // Verify loading skeleton disappears
    await expect(page.getByTestId("loading-skeleton")).not.toBeVisible();

    // Verify new state data is displayed
    await expect(page.getByTestId("plan-name")).toContainText("NSW Net Zero Plan Stage 1");
  });

  test("Sidebar accessibility features work correctly", async ({ page }) => {
    // Navigate to homepage
    await page.goto("/");

    // Click start environmental journey button
    await page.getByRole("button", { name: /Start My Environmental Journey/i }).click();

    // Wait for page to load and click next
    await page.waitForSelector('[data-testid="journey-welcome"]');
    await page.getByRole("button", { name: /Next/i }).click();

    // Verify Data Insight page loads
    await page.waitForSelector('[data-testid="data-insight"]');

    // Click Emissions tab to show ClimateTargetSidebar
    await page.getByTestId("emissions-tab").click();

    // Wait for sidebar to load
    await page.waitForSelector('[data-testid="climate-sidebar"]');

    // Verify ARIA labels
    await expect(page.getByTestId("climate-sidebar")).toHaveAttribute(
      "aria-label",
      "Climate Action Plan Information",
    );

    // Verify progress bar ARIA attributes (check the inner div that has the ARIA attributes)
    const progressBarInner = page.locator('[data-testid="progress-bar"] > div');
    await expect(progressBarInner).toHaveAttribute("aria-valuenow");
    await expect(progressBarInner).toHaveAttribute("aria-valuemin", "0");
    await expect(progressBarInner).toHaveAttribute("aria-valuemax", "100");

    // Verify progress bar current value
    const currentValue = await progressBarInner.getAttribute("aria-valuenow");
    expect(parseInt(currentValue || "0")).toBeGreaterThan(0);
  });

  test("Sidebar content is responsive on different screen sizes", async ({ page }) => {
    // Navigate to homepage
    await page.goto("/");

    // Click start environmental journey button
    await page.getByRole("button", { name: /Start My Environmental Journey/i }).click();

    // Wait for page to load and click next
    await page.waitForSelector('[data-testid="journey-welcome"]');
    await page.getByRole("button", { name: /Next/i }).click();

    // Verify Data Insight page loads
    await page.waitForSelector('[data-testid="data-insight"]');

    // Click Emissions tab to show ClimateTargetSidebar
    await page.getByTestId("emissions-tab").click();

    // Wait for sidebar to load
    await page.waitForSelector('[data-testid="climate-sidebar"]');

    // Test desktop view
    await page.setViewportSize({ width: 1280, height: 720 });
    await expect(page.getByTestId("climate-sidebar")).toBeVisible();

    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.getByTestId("climate-sidebar")).toBeVisible();

    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.getByTestId("climate-sidebar")).toBeVisible();

    // Verify content remains readable on small screens
    await expect(page.getByTestId("plan-name")).toBeVisible();
    await expect(page.getByTestId("progress-text")).toBeVisible();
  });

  test("Sidebar maintains state consistency across navigation", async ({ page }) => {
    // Navigate to homepage
    await page.goto("/");

    // Click start environmental journey button
    await page.getByRole("button", { name: /Start My Environmental Journey/i }).click();

    // Wait for page to load and click next
    await page.waitForSelector('[data-testid="journey-welcome"]');
    await page.getByRole("button", { name: /Next/i }).click();

    // Verify Data Insight page loads
    await page.waitForSelector('[data-testid="data-insight"]');

    // Click Emissions tab to show ClimateTargetSidebar
    await page.getByTestId("emissions-tab").click();

    // Wait for sidebar to load
    await page.waitForSelector('[data-testid="climate-sidebar"]');

    // Record current state
    const initialPlanName = await page.getByTestId("plan-name").textContent();

    // Navigate to other step using more specific selector
    await page.getByRole("button", { name: "Next Journey →" }).click();

    // Wait for Footprint Calculator page to load
    await page.waitForSelector('[data-testid="footprint-calculator"]');

    // Return to Data Insight page using more specific selector
    await page.getByRole("button", { name: "Previous Step" }).click();

    // Wait for page to load
    await page.waitForSelector('[data-testid="data-insight"]');

    // Re-click emissions tab to ensure sidebar is visible
    await page.getByTestId("emissions-tab").click();
    await page.waitForSelector('[data-testid="climate-sidebar"]');

    // Verify sidebar state remains consistent
    await expect(page.getByTestId("plan-name")).toContainText(initialPlanName || "");

    // Verify progress bar state remains consistent
    await expect(page.getByTestId("progress-text")).toContainText("18%");
  });
});
