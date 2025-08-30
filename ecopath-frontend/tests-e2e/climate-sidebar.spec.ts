import { test, expect } from '@playwright/test';

test.describe('Climate Target Sidebar E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Pre-set selected state to VIC
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('selectedState', 'Victoria (VIC)');
    });
  });

  test('Sidebar shows correct plan and progress on page load', async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');
    
    // Click start environmental journey button
    await page.getByRole('button', { name: /Start My Environmental Journey/i }).click();
    
    // Wait for page to load and click next
    await page.waitForSelector('[data-testid="journey-welcome"]');
    await page.getByRole('button', { name: /Next/i }).click();
    
    // Verify Data Insight page loads
    await page.waitForSelector('[data-testid="data-insight"]');
    
    // Click Emissions tab to show ClimateTargetSidebar
    await page.getByTestId('emissions-tab').click();
    
    // Wait for sidebar to load
    await page.waitForSelector('[data-testid="climate-sidebar"]');
    
    // Verify sidebar title
    await expect(page.getByText('Climate Action Plan')).toBeVisible();
    
    // Verify plan name
    const planName = page.getByTestId('plan-name');
    await expect(planName).toBeVisible();
    await expect(planName).toContainText('Victoria 2030 Net Zero Plan');
    
    // Verify progress bar
    const progressBar = page.getByTestId('progress-bar');
    await expect(progressBar).toBeVisible();
    
    // Verify progress percentage
    const progressText = page.getByTestId('progress-text');
    await expect(progressText).toBeVisible();
    await expect(progressText).toContainText('18%');
    
    // Verify target year
    await expect(page.getByText('Target: 2030')).toBeVisible();
    
    // Verify description
    await expect(page.getByText('Ambitious plan to achieve net zero emissions by 2030')).toBeVisible();
  });

  test('Sidebar updates when switching to another state', async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');
    
    // Click start environmental journey button
    await page.getByRole('button', { name: /Start My Environmental Journey/i }).click();
    
    // Wait for page to load and click next
    await page.waitForSelector('[data-testid="journey-welcome"]');
    await page.getByRole('button', { name: /Next/i }).click();
    
    // Verify Data Insight page loads
    await page.waitForSelector('[data-testid="data-insight"]');
    
    // Click Emissions tab to show ClimateTargetSidebar
    await page.getByTestId('emissions-tab').click();
    
    // Wait for sidebar to load
    await page.waitForSelector('[data-testid="climate-sidebar"]');
    
    // Verify VIC initial data
    await expect(page.getByTestId('plan-name')).toContainText('Victoria 2030 Net Zero Plan');
    await expect(page.getByTestId('progress-text')).toContainText('18%');
    
    // Switch to NSW
    await page.getByTestId('state-selector').click();
    await page.getByTestId('state-option-New-South-Wales-NSW').click();
    
    // Wait for sidebar to update (increase wait time)
    await page.waitForTimeout(3000);
    
    // Verify NSW data
    await expect(page.getByTestId('plan-name')).toContainText('NSW Net Zero Plan Stage 1');
    await expect(page.getByTestId('progress-text')).toContainText('12%');
    await expect(page.getByTestId('target-year')).toContainText('Target: 2050');
    await expect(page.getByText('Comprehensive plan to reach net zero by 2050')).toBeVisible();
    
    // Switch to QLD
    await page.getByTestId('state-selector').click();
    await page.getByTestId('state-option-Queensland-QLD').click();
    
    // Wait for sidebar to update (increase wait time)
    await page.waitForTimeout(3000);
    
    // Verify QLD data
    await expect(page.getByTestId('plan-name')).toContainText('Queensland Climate Action Plan');
    await expect(page.getByTestId('progress-text')).toContainText('8%');
    await expect(page.getByTestId('target-year')).toContainText('Target: 2050');
  });

  test('Sidebar shows loading state during data fetch', async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');
    
    // Click start environmental journey button
    await page.getByRole('button', { name: /Start My Environmental Journey/i }).click();
    
    // Wait for page to load and click next
    await page.waitForSelector('[data-testid="journey-welcome"]');
    await page.getByRole('button', { name: /Next/i }).click();
    
    // Verify Data Insight page loads
    await page.waitForSelector('[data-testid="data-insight"]');
    
    // Click Emissions tab to show ClimateTargetSidebar
    await page.getByTestId('emissions-tab').click();
    
    // Verify loading skeleton appears
    const loadingSkeleton = page.getByTestId('loading-skeleton');
    await expect(loadingSkeleton).toBeVisible();
    
    // Wait for loading to complete
    await page.waitForSelector('[data-testid="climate-sidebar"]');
    
    // Verify loading skeleton disappears
    await expect(loadingSkeleton).not.toBeVisible();
    
    // Verify actual content displays
    await expect(page.getByTestId('plan-name')).toBeVisible();
  });

  test('Sidebar handles error states gracefully', async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');
    
    // Click start environmental journey button
    await page.getByRole('button', { name: /Start My Environmental Journey/i }).click();
    
    // Wait for page to load and click next
    await page.waitForSelector('[data-testid="journey-welcome"]');
    await page.getByRole('button', { name: /Next/i }).click();
    
    // Verify Data Insight page loads
    await page.waitForSelector('[data-testid="data-insight"]');
    
    // Click Emissions tab to show ClimateTargetSidebar
    await page.getByTestId('emissions-tab').click();
    
    // Wait for sidebar to load first
    await page.waitForSelector('[data-testid="climate-sidebar"]');
    
    // Mock API error by changing state to trigger error
    await page.getByTestId('state-selector').click();
    await page.getByTestId('state-option-Western-Australia-WA').click();
    
    // Wait for error state to display
    await page.waitForSelector('[data-testid="error-state"]');
    
    // Verify error message
    await expect(page.getByTestId('error-state')).toBeVisible();
    await expect(page.getByText('Failed to load climate target data')).toBeVisible();
    
    // Verify retry button
    const retryButton = page.getByTestId('retry-button');
    await expect(retryButton).toBeVisible();
    await expect(retryButton).toContainText('Retry');
    
    // Click retry button
    await retryButton.click();
    
    // Verify loading state
    await expect(page.getByTestId('loading-skeleton')).toBeVisible();
  });

  test('Sidebar accessibility features work correctly', async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');
    
    // Click start environmental journey button
    await page.getByRole('button', { name: /Start My Environmental Journey/i }).click();
    
    // Wait for page to load and click next
    await page.waitForSelector('[data-testid="journey-welcome"]');
    await page.getByRole('button', { name: /Next/i }).click();
    
    // Verify Data Insight page loads
    await page.waitForSelector('[data-testid="data-insight"]');
    
    // Click Emissions tab to show ClimateTargetSidebar
    await page.getByTestId('emissions-tab').click();
    
    // Wait for sidebar to load
    await page.waitForSelector('[data-testid="climate-sidebar"]');
    
    // Verify ARIA labels
    await expect(page.getByTestId('climate-sidebar')).toHaveAttribute('aria-label', 'Climate Action Plan Information');
    
    // Verify progress bar ARIA attributes (check the inner div that has the ARIA attributes)
    const progressBarInner = page.locator('[data-testid="progress-bar"] > div');
    await expect(progressBarInner).toHaveAttribute('aria-valuenow');
    await expect(progressBarInner).toHaveAttribute('aria-valuemin', '0');
    await expect(progressBarInner).toHaveAttribute('aria-valuemax', '100');
    
    // Verify progress bar current value
    const currentValue = await progressBarInner.getAttribute('aria-valuenow');
    expect(parseInt(currentValue || '0')).toBeGreaterThan(0);
  });

  test('Sidebar content is responsive on different screen sizes', async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');
    
    // Click start environmental journey button
    await page.getByRole('button', { name: /Start My Environmental Journey/i }).click();
    
    // Wait for page to load and click next
    await page.waitForSelector('[data-testid="journey-welcome"]');
    await page.getByRole('button', { name: /Next/i }).click();
    
    // Verify Data Insight page loads
    await page.waitForSelector('[data-testid="data-insight"]');
    
    // Click Emissions tab to show ClimateTargetSidebar
    await page.getByTestId('emissions-tab').click();
    
    // Wait for sidebar to load
    await page.waitForSelector('[data-testid="climate-sidebar"]');
    
    // Test desktop view
    await page.setViewportSize({ width: 1280, height: 720 });
    await expect(page.getByTestId('climate-sidebar')).toBeVisible();
    
    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.getByTestId('climate-sidebar')).toBeVisible();
    
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.getByTestId('climate-sidebar')).toBeVisible();
    
    // Verify content remains readable on small screens
    await expect(page.getByTestId('plan-name')).toBeVisible();
    await expect(page.getByTestId('progress-text')).toBeVisible();
  });

  test('Sidebar maintains state consistency across navigation', async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');
    
    // Click start environmental journey button
    await page.getByRole('button', { name: /Start My Environmental Journey/i }).click();
    
    // Wait for page to load and click next
    await page.waitForSelector('[data-testid="journey-welcome"]');
    await page.getByRole('button', { name: /Next/i }).click();
    
    // Verify Data Insight page loads
    await page.waitForSelector('[data-testid="data-insight"]');
    
    // Click Emissions tab to show ClimateTargetSidebar
    await page.getByTestId('emissions-tab').click();
    
    // Wait for sidebar to load
    await page.waitForSelector('[data-testid="climate-sidebar"]');
    
    // Record current state
    const initialPlanName = await page.getByTestId('plan-name').textContent();
    
    // Navigate to other step
    await page.getByRole('button', { name: /Next/i }).click();
    
    // Wait for Footprint Calculator page to load
    await page.waitForSelector('[data-testid="footprint-calculator"]');
    
    // Return to Data Insight page
    await page.getByRole('button', { name: /Previous/i }).click();
    
    // Wait for page to load
    await page.waitForSelector('[data-testid="data-insight"]');
    
    // Verify sidebar state remains consistent
    await expect(page.getByTestId('plan-name')).toContainText(initialPlanName || '');
    
    // Verify progress bar state remains consistent
    await expect(page.getByTestId('progress-text')).toContainText('18%');
  });
});
