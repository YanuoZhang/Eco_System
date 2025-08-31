import { Page } from "@playwright/test";

// Test data constants
export const TEST_STATES = {
  VIC: "Victoria (VIC)",
  NSW: "New South Wales (NSW)",
  QLD: "Queensland (QLD)",
  WA: "Western Australia (WA)",
  SA: "South Australia (SA)",
  TAS: "Tasmania (TAS)",
  ACT: "Australian Capital Territory (ACT)",
  NT: "Northern Territory (NT)",
};

// Mock energy data
export const MOCK_ENERGY_DATA = {
  [TEST_STATES.VIC]: [
    { source: "Coal", percentage: 45.2, generation: "8,450 MW", trend: -8.5 },
    { source: "Natural Gas", percentage: 18.3, generation: "3,420 MW", trend: -2.1 },
    { source: "Wind", percentage: 22.8, generation: "4,250 MW", trend: 15.2 },
    { source: "Solar", percentage: 8.9, generation: "1,660 MW", trend: 28.7 },
    { source: "Hydro", percentage: 4.8, generation: "895 MW", trend: 1.2 },
  ],
  [TEST_STATES.NSW]: [
    { source: "Coal", percentage: 52.1, generation: "12,300 MW", trend: -5.2 },
    { source: "Natural Gas", percentage: 15.8, generation: "3,750 MW", trend: -1.8 },
    { source: "Wind", percentage: 18.5, generation: "4,100 MW", trend: 12.5 },
    { source: "Solar", percentage: 9.2, generation: "2,180 MW", trend: 25.3 },
    { source: "Hydro", percentage: 4.4, generation: "1,200 MW", trend: 0.8 },
  ],
};

// Mock emissions data
export const MOCK_EMISSIONS_DATA = {
  [TEST_STATES.VIC]: [
    { year: 2014, value: 48.2 },
    { year: 2015, value: 47.8 },
    { year: 2016, value: 47.1 },
    { year: 2017, value: 46.5 },
    { year: 2018, value: 45.9 },
    { year: 2019, value: 45.2 },
    { year: 2020, value: 44.1 },
    { year: 2021, value: 43.5 },
    { year: 2022, value: 43.1 },
    { year: 2023, value: 42.7 },
  ],
  [TEST_STATES.NSW]: [
    { year: 2014, value: 52.8 },
    { year: 2015, value: 52.1 },
    { year: 2016, value: 51.5 },
    { year: 2017, value: 50.9 },
    { year: 2018, value: 50.2 },
    { year: 2019, value: 49.8 },
    { year: 2020, value: 48.9 },
    { year: 2021, value: 48.3 },
    { year: 2022, value: 47.8 },
    { year: 2023, value: 47.2 },
  ],
};

// Mock climate targets data
export const MOCK_CLIMATE_TARGETS = {
  [TEST_STATES.VIC]: {
    planName: "Victoria 2030 Net Zero Plan",
    progress: 18,
    targetYear: 2030,
    description: "Ambitious plan to achieve net zero emissions by 2030",
  },
  [TEST_STATES.NSW]: {
    planName: "NSW Net Zero Plan Stage 1",
    progress: 12,
    targetYear: 2050,
    description: "Comprehensive plan to reach net zero by 2050",
  },
  [TEST_STATES.QLD]: {
    planName: "Queensland Climate Action Plan",
    progress: 8,
    targetYear: 2050,
    description: "Progressive climate action with renewable energy focus",
  },
  [TEST_STATES.WA]: {
    planName: "WA Climate Action Plan",
    progress: 15,
    targetYear: 2050,
    description: "Western Australia climate action plan",
  },
};

// Helper function: Set selected state
export async function setSelectedState(page: Page, state: string) {
  await page.evaluate((stateName) => {
    localStorage.setItem("selectedState", stateName);
  }, state);
}

// Helper function: Navigate to Data Insight page
export async function navigateToDataInsight(page: Page) {
  await page.goto("/?step=2");
  await page.waitForSelector('[data-testid="data-insight"]');
}

// Helper function: Wait for chart to load
export async function waitForChart(page: Page, chartTestId: string) {
  await page.waitForSelector(`[data-testid="${chartTestId}"]`);
  // Give chart some time to fully render
  await page.waitForTimeout(500);
}

// Helper function: Mock API response
export async function mockApiResponse(page: Page, url: string, response: unknown): Promise<void> {
  await page.route(url, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(response),
    });
  });
}

// Helper function: Mock API error
export async function mockApiError(
  page: Page,
  urlPattern: string,
  errorMessage: string = "Internal Server Error",
) {
  await page.route(urlPattern, (route) => {
    route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ error: errorMessage }),
    });
  });
}

// Helper function: Mock network delay
export async function mockApiDelay(page: Page, urlPattern: string, delayMs: number = 1000) {
  await page.route(urlPattern, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    await route.continue();
  });
}

// Helper function: Validate tooltip content
export async function validateTooltip(page: Page, expectedContent: string[]) {
  const tooltip = page.locator(".absolute.z-50.bg-white, .recharts-tooltip-wrapper");
  await expect(tooltip).toBeVisible();

  for (const content of expectedContent) {
    await expect(tooltip).toContain(content);
  }
}

// Helper function: Switch time range
export async function switchTimeRange(page: Page, range: "5" | "10" | "0") {
  const timeRangeSelector = page.locator("select");
  await timeRangeSelector.selectOption(range);
  await page.waitForTimeout(500); // Wait for chart to update
}

// Helper function: Switch state
export async function switchState(page: Page, state: string) {
  await page.getByTestId("state-selector").click();
  await page.getByText(state).click();
  await page.waitForTimeout(1000); // Wait for data to update
}

// Helper function: Validate loading state
export async function validateLoadingState(page: Page, loadingTestId: string) {
  await expect(page.getByTestId(loadingTestId)).toBeVisible();
  // Wait for loading to complete
  await page.waitForSelector(`[data-testid="${loadingTestId}"]`, { state: "hidden" });
}

// Helper function: Validate error state
export async function validateErrorState(page: Page, errorTestId: string, expectedMessage: string) {
  await expect(page.getByTestId(errorTestId)).toBeVisible();
  await expect(page.getByText(expectedMessage)).toBeVisible();
}

// Screenshot and video configuration
export const SCREENSHOT_CONFIG = {
  fullPage: true,
  type: "png" as const,
  quality: 90,
};

export const VIDEO_CONFIG = {
  mode: "retain-on-failure" as const,
  size: { width: 1280, height: 720 },
};

// Test environment configuration
export const TEST_CONFIG = {
  baseURL: process.env.BASE_URL || "http://localhost:3000",
  timeout: 30000,
  retries: process.env.CI ? 2 : 0,
  headless: process.env.CI ? true : false,
};
