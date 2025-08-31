import { test, expect } from '@playwright/test';

test.describe('Data Sources Workflow E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Pre-set selected state to VIC
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('selectedState', 'Victoria (VIC)');
    });
  });

  test('TC-1.7.1: Scroll to bottom → Button becomes visible', async ({ page }) => {
    // Navigate to Data Insight page
    await page.goto('/');
    
    // Click start environmental journey button
    await page.getByRole('button', { name: /Start My Environmental Journey/i }).click();
    
    // Wait for page to load and click next
    await page.waitForSelector('[data-testid="journey-welcome"]');
    await page.getByRole('button', { name: /Next/i }).click();
    
    // Verify Data Insight page loads
    await page.waitForSelector('[data-testid="data-insight"]');
    
    // Initially, the Data Sources button should not be visible (it's at the bottom)
    const dataSourcesBtn = page.getByTestId('data-sources-btn');
    
    // Scroll to the bottom of the page to make the button visible
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    
    // Wait a moment for scroll to complete
    await page.waitForTimeout(500);
    
    // Now the Data Sources button should be visible
    await expect(dataSourcesBtn).toBeVisible();
    
    // Verify button text and styling
    await expect(dataSourcesBtn).toContainText('Data Sources');
    await expect(dataSourcesBtn).toContainText('📚');
  });

  test('TC-1.7.2: Click button → Modal/panel opens with list', async ({ page }) => {
    // Navigate to Data Insight page
    await page.goto('/');
    
    // Click start environmental journey button
    await page.getByRole('button', { name: /Start My Environmental Journey/i }).click();
    
    // Wait for page to load and click next
    await page.waitForSelector('[data-testid="journey-welcome"]');
    await page.getByRole('button', { name: /Next/i }).click();
    
    // Verify Data Insight page loads
    await page.waitForSelector('[data-testid="data-insight"]');
    
    // Scroll to bottom to make Data Sources button visible
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await page.waitForTimeout(500);
    
    // Click the Data Sources button
    await page.getByTestId('data-sources-btn').click();
    
    // Verify modal opens
    await page.waitForSelector('[data-testid="data-sources-modal"]');
    await expect(page.getByTestId('data-sources-modal')).toBeVisible();
    
    // Verify modal header content (use specific selectors)
    await expect(page.getByRole('heading', { name: 'Data Sources' })).toBeVisible();
    await expect(page.getByText('Official datasets used in our analysis')).toBeVisible();
    
    // Verify modal has close button
    await expect(page.getByTestId('modal-close-btn')).toBeVisible();
    
    // Verify dataset links are displayed
    const expectedDatasets = [
      'ABS Census Data',
      'Department of Climate Change',
      'AEMO Emissions Data',
      'City of Melbourne Open Data',
      'Bureau of Meteorology',
      'CSIRO Climate Data'
    ];
    
    for (const dataset of expectedDatasets) {
      await expect(page.getByText(dataset)).toBeVisible();
    }
    
    // Verify we have exactly 6 dataset links
    const datasetLinks = page.locator('[data-testid^="dataset-link-"]');
    await expect(datasetLinks).toHaveCount(6);
    
    // Verify modal footer content
    await expect(page.getByText('All data sources are official government and research institutions')).toBeVisible();
    await expect(page.getByText('Click any dataset to verify the original source')).toBeVisible();
  });

  test('TC-1.7.3: Click link → Official dataset opens in a new tab', async ({ page, context }) => {
    // Navigate to Data Insight page
    await page.goto('/');
    
    // Click start environmental journey button
    await page.getByRole('button', { name: /Start My Environmental Journey/i }).click();
    
    // Wait for page to load and click next
    await page.waitForSelector('[data-testid="journey-welcome"]');
    await page.getByRole('button', { name: /Next/i }).click();
    
    // Verify Data Insight page loads
    await page.waitForSelector('[data-testid="data-insight"]');
    
    // Scroll to bottom to make Data Sources button visible
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await page.waitForTimeout(500);
    
    // Click the Data Sources button
    await page.getByTestId('data-sources-btn').click();
    
    // Wait for modal to open
    await page.waitForSelector('[data-testid="data-sources-modal"]');
    
    // Click on the first dataset link (ABS Census Data)
    const firstDatasetLink = page.getByTestId('dataset-link-0');
    await expect(firstDatasetLink).toBeVisible();
    
    // Create a promise to wait for the new page
    const pagePromise = context.waitForEvent('page');
    
    // Click the dataset link
    await firstDatasetLink.click();
    
    // Wait for the new page to open
    const newPage = await pagePromise;
    
    // Verify the new page opened
    expect(newPage).toBeTruthy();
    
    // Wait for the new page to load
    await newPage.waitForLoadState();
    
    // Verify the new page has the expected URL (ABS website)
    expect(newPage.url()).toContain('abs.gov.au');
    
    // Close the new page
    await newPage.close();
    
    // Verify we're still on the Data Insight page with modal open
    await expect(page.getByTestId('data-sources-modal')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Data Sources' })).toBeVisible();
  });

  test('TC-1.7.4: Modal can be closed and reopened', async ({ page }) => {
    // Navigate to Data Insight page
    await page.goto('/');
    
    // Click start environmental journey button
    await page.getByRole('button', { name: /Start My Environmental Journey/i }).click();
    
    // Wait for page to load and click next
    await page.waitForSelector('[data-testid="journey-welcome"]');
    await page.getByRole('button', { name: /Next/i }).click();
    
    // Verify Data Insight page loads
    await page.waitForSelector('[data-testid="data-insight"]');
    
    // Scroll to bottom to make Data Sources button visible
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await page.waitForTimeout(500);
    
    // Click the Data Sources button
    await page.getByTestId('data-sources-btn').click();
    
    // Wait for modal to open
    await page.waitForSelector('[data-testid="data-sources-modal"]');
    await expect(page.getByTestId('data-sources-modal')).toBeVisible();
    
    // Close the modal
    await page.getByTestId('modal-close-btn').click();
    
    // Verify modal is closed
    await expect(page.getByTestId('data-sources-modal')).not.toBeVisible();
    
    // Click the Data Sources button again
    await page.getByTestId('data-sources-btn').click();
    
    // Verify modal opens again
    await page.waitForSelector('[data-testid="data-sources-modal"]');
    await expect(page.getByTestId('data-sources-modal')).toBeVisible();
    
    // Verify all content is still there (use specific selectors)
    await expect(page.getByRole('heading', { name: 'Data Sources' })).toBeVisible();
    await expect(page.getByText('ABS Census Data')).toBeVisible();
  });

  test('TC-1.7.5: All dataset links are clickable and have proper styling', async ({ page }) => {
    // Navigate to Data Insight page
    await page.goto('/');
    
    // Click start environmental journey button
    await page.getByRole('button', { name: /Start My Environmental Journey/i }).click();
    
    // Wait for page to load and click next
    await page.waitForSelector('[data-testid="journey-welcome"]');
    await page.getByRole('button', { name: /Next/i }).click();
    
    // Verify Data Insight page loads
    await page.waitForSelector('[data-testid="data-insight"]');
    
    // Scroll to bottom to make Data Sources button visible
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await page.waitForTimeout(500);
    
    // Click the Data Sources button
    await page.getByTestId('data-sources-btn').click();
    
    // Wait for modal to open
    await page.waitForSelector('[data-testid="data-sources-modal"]');
    
    // Verify all dataset links are present and clickable
    for (let i = 0; i < 6; i++) {
      const datasetLink = page.getByTestId(`dataset-link-${i}`);
      await expect(datasetLink).toBeVisible();
      await expect(datasetLink).toBeEnabled();
      
      // Verify each link has the expected styling classes
      await expect(datasetLink).toHaveClass(/border.*rounded-lg.*p-4.*cursor-pointer/);
    }
    
    // Verify specific dataset content (use exact matching for category labels)
    await expect(page.getByText('ABS Census Data')).toBeVisible();
    await expect(page.getByText('Australian Bureau of Statistics population and demographic data')).toBeVisible();
    await expect(page.getByText('Demographics', { exact: true })).toBeVisible();
    
    await expect(page.getByText('Department of Climate Change')).toBeVisible();
    await expect(page.getByText('Official climate change and emissions reduction data')).toBeVisible();
    await expect(page.getByText('Climate', { exact: true })).toBeVisible();
    
    await expect(page.getByText('AEMO Emissions Data')).toBeVisible();
    await expect(page.getByText('Australian Energy Market Operator energy and emissions data')).toBeVisible();
    await expect(page.getByText('Energy', { exact: true })).toBeVisible();
  });
});
