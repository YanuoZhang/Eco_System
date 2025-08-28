import { test, expect } from '@playwright/test';

test('homepage renders', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Journey Homepage')).toBeVisible();
  await expect(page.getByRole('button', { name: /Start Journey/i })).toBeVisible();
});
