import { test, expect } from '@playwright/test';

test.describe('State Selector Basic Functionality', () => {
  test('State selector opens and closes dropdown', async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');
    
    // Click state selector button
    await page.getByTestId('state-selector').click();
    
    // Verify dropdown is visible
    await expect(page.getByText('Select State')).toBeVisible();
    
    // Verify state options are visible
    await expect(page.getByTestId('state-option-Victoria-VIC')).toBeVisible();
    await expect(page.getByTestId('state-option-New-South-Wales-NSW')).toBeVisible();
    
    // Click outside to close (click on hero section)
    await page.getByRole('button', { name: /Start My Environmental Journey/i }).click();
    
    // Verify dropdown is closed
    await expect(page.getByText('Select State')).not.toBeVisible();
  });

  test('State selector can select different states', async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');
    
    // Click state selector button
    await page.getByTestId('state-selector').click();
    
    // Click on NSW option
    await page.getByTestId('state-option-New-South-Wales-NSW').click();
    
    // Verify dropdown is closed
    await expect(page.getByText('Select State')).not.toBeVisible();
    
    // Verify state selector shows NSW
    await expect(page.getByTestId('state-selector')).toContainText('New');
  });
});
