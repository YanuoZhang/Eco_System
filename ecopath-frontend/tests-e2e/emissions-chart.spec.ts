import { test, expect } from '@playwright/test';

test.describe('Emissions Chart E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Pre-set selected state to VIC
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('selectedState', 'Victoria (VIC)');
    });
  });

  test('Chart renders with latest annual value clearly labeled', async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');
    
    // Click start environmental journey button
    await page.getByRole('button', { name: /Start My Environmental Journey/i }).click();
    
    // Wait for page to load and click next
    await page.waitForSelector('[data-testid="journey-welcome"]');
    await page.getByRole('button', { name: /Next/i }).click();
    
    // Verify Data Insight page loads
    await page.waitForSelector('[data-testid="data-insight"]');
    
    // Click Emissions tab
    await page.getByTestId('emissions-tab').click();
    
    // Wait for chart to load
    await page.waitForSelector('[data-testid="emissions-chart"]');
    
    // Verify chart title (dynamic based on state)
    await expect(page.getByText('Victoria Greenhouse Gas Emissions')).toBeVisible();
    
    // Verify latest label exists and matches pattern
    const latestLabel = page.getByTestId('latest-label');
    await expect(latestLabel).toBeVisible();
    
    // Verify label format: YYYY: xx.x Mt CO₂-e
    const labelText = await latestLabel.textContent();
    expect(labelText).toMatch(/^\d{4}: \d+\.\d+ Mt CO₂-e$/);
    
    // Verify specific value (VIC 2023 data should be 42.7)
    expect(labelText).toContain('2023: 42.7 Mt CO₂-e');
  });

  test('Chart updates when switching time ranges (5y/10y/All)', async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');
    
    // Click start environmental journey button
    await page.getByRole('button', { name: /Start My Environmental Journey/i }).click();
    
    // Wait for page to load and click next
    await page.waitForSelector('[data-testid="journey-welcome"]');
    await page.getByRole('button', { name: /Next/i }).click();
    
    // Verify Data Insight page loads
    await page.waitForSelector('[data-testid="data-insight"]');
    
    // Click Emissions tab
    await page.getByTestId('emissions-tab').click();
    
    // Wait for chart to load
    await page.waitForSelector('[data-testid="emissions-chart"]');
    
    // Verify time range selector exists
    const timeRangeSelector = page.getByTestId('time-range-selector');
    await expect(timeRangeSelector).toBeVisible();
    
    // Switch to 5 year range
    await timeRangeSelector.selectOption('5');
    
    // Wait for chart to update
    await page.waitForTimeout(500);
    
    // Verify 5 year data (should only show 2019-2023)
    // Use more specific selectors to avoid conflicts
    await expect(page.locator('[data-testid="emissions-chart"] .recharts-xAxis .recharts-cartesian-axis-tick').filter({ hasText: '2019' })).toBeVisible();
    await expect(page.locator('[data-testid="emissions-chart"] .recharts-xAxis .recharts-cartesian-axis-tick').filter({ hasText: '2023' })).toBeVisible();
    // Verify 2014 is not in 5 year range
    await expect(page.locator('[data-testid="emissions-chart"] .recharts-xAxis .recharts-cartesian-axis-tick').filter({ hasText: '2014' })).not.toBeVisible();
    
    // Switch to 10 year range
    await timeRangeSelector.selectOption('10');
    
    // Wait for chart to update
    await page.waitForTimeout(500);
    
    // Verify 10 year data (should show 2014-2023)
    await expect(page.locator('[data-testid="emissions-chart"] .recharts-xAxis .recharts-cartesian-axis-tick').filter({ hasText: '2014' })).toBeVisible();
    await expect(page.locator('[data-testid="emissions-chart"] .recharts-xAxis .recharts-cartesian-axis-tick').filter({ hasText: '2023' })).toBeVisible();
    
    // Switch to all data
    await timeRangeSelector.selectOption('0');
    
    // Wait for chart to update
    await page.waitForTimeout(500);
    
    // Verify all data is displayed
    await expect(page.locator('[data-testid="emissions-chart"] .recharts-xAxis .recharts-cartesian-axis-tick').filter({ hasText: '2014' })).toBeVisible();
    await expect(page.locator('[data-testid="emissions-chart"] .recharts-xAxis .recharts-cartesian-axis-tick').filter({ hasText: '2023' })).toBeVisible();
  });

  test('Tooltip appears on hover with correct format', async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');
    
    // Click start environmental journey button
    await page.getByRole('button', { name: /Start My Environmental Journey/i }).click();
    
    // Wait for page to load and click next
    await page.waitForSelector('[data-testid="journey-welcome"]');
    await page.getByRole('button', { name: /Next/i }).click();
    
    // Verify Data Insight page loads
    await page.waitForSelector('[data-testid="data-insight"]');
    
    // Click Emissions tab
    await page.getByTestId('emissions-tab').click();
    
    // Wait for chart to load
    await page.waitForSelector('[data-testid="emissions-chart"]');
    
    // Wait for Recharts to fully load
    await page.waitForTimeout(1000);
    
    // Hover over chart (using Recharts default tooltip)
    const chartArea = page.locator('[data-testid="emissions-chart"] .recharts-wrapper');
    await chartArea.hover();
    
    // Verify tooltip appears
    const tooltip = page.locator('.recharts-tooltip-wrapper');
    await expect(tooltip).toBeVisible();
    
    // Verify tooltip format: YYYY – xx.x Mt CO₂-e
    const tooltipText = await tooltip.textContent();
    expect(tooltipText).toMatch(/\d{4} – \d+\.\d+ Mt CO₂-e/);
  });

  test('Empty state is shown when API returns no data', async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');
    
    // Click start environmental journey button
    await page.getByRole('button', { name: /Start My Environmental Journey/i }).click();
    
    // Wait for page to load and click next
    await page.waitForSelector('[data-testid="journey-welcome"]');
    await page.getByRole('button', { name: /Next/i }).click();
    
    // Verify Data Insight page loads
    await page.waitForSelector('[data-testid="data-insight"]');
    
    // Mock API returning empty data by intercepting the component's data
    // Since we're using mock data in the component, we'll test the empty state differently
    // Let's test with a state that has no data
    await page.getByTestId('state-selector').click();
    await page.getByTestId('state-option-Northern-Territory-NT').click();
    
    // Wait for chart to update
    await page.waitForTimeout(1000);
    
    // Click Emissions tab
    await page.getByTestId('emissions-tab').click();
    
    // Wait for empty state to display
    await page.waitForSelector('[data-testid="empty-state"]');
    
    // Verify empty state message
    await expect(page.getByTestId('empty-state')).toBeVisible();
    await expect(page.getByText('No Data Available')).toBeVisible();
    await expect(page.getByText('Emissions data is not available for the selected state and time period.')).toBeVisible();
  });

  test('Chart accessibility and keyboard navigation', async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');
    
    // Click start environmental journey button
    await page.getByRole('button', { name: /Start My Environmental Journey/i }).click();
    
    // Wait for page to load and click next
    await page.waitForSelector('[data-testid="journey-welcome"]');
    await page.getByRole('button', { name: /Next/i }).click();
    
    // Verify Data Insight page loads
    await page.waitForSelector('[data-testid="data-insight"]');
    
    // Click Emissions tab
    await page.getByTestId('emissions-tab').click();
    
    // Wait for chart to load
    await page.waitForSelector('[data-testid="emissions-chart"]');
    
    // Verify time range selector can be navigated via keyboard
    const timeRangeSelector = page.getByTestId('time-range-selector');
    await timeRangeSelector.focus();
    await expect(timeRangeSelector).toBeFocused();
    
    // Verify selector has correct label
    await expect(page.getByText('Time Range:')).toBeVisible();
    
    // Verify chart has correct ARIA label
    const chart = page.locator('[data-testid="emissions-chart"]');
    await expect(chart).toHaveAttribute('role', 'img');
  });

  test('Chart data updates when switching states', async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');
    
    // Click start environmental journey button
    await page.getByRole('button', { name: /Start My Environmental Journey/i }).click();
    
    // Wait for page to load and click next
    await page.waitForSelector('[data-testid="journey-welcome"]');
    await page.getByRole('button', { name: /Next/i }).click();
    
    // Verify Data Insight page loads
    await page.waitForSelector('[data-testid="data-insight"]');
    
    // Click Emissions tab
    await page.getByTestId('emissions-tab').click();
    
    // Wait for chart to load
    await page.waitForSelector('[data-testid="emissions-chart"]');
    
    // Verify VIC initial data
    const latestLabel = page.getByTestId('latest-label');
    await expect(latestLabel).toContainText('2023: 42.7 Mt CO₂-e');
    
    // Switch to NSW
    await page.getByTestId('state-selector').click();
    await page.getByTestId('state-option-New-South-Wales-NSW').click();
    
    // Wait for chart to update
    await page.waitForTimeout(1000);
    
    // Verify NSW data
    await expect(latestLabel).toContainText('2023: 47.2 Mt CO₂-e');
    
    // Verify X-axis labels update (use specific selectors)
    await expect(page.locator('[data-testid="emissions-chart"] .recharts-xAxis .recharts-cartesian-axis-tick').filter({ hasText: '2014' })).toBeVisible();
    await expect(page.locator('[data-testid="emissions-chart"] .recharts-xAxis .recharts-cartesian-axis-tick').filter({ hasText: '2023' })).toBeVisible();
  });
});
