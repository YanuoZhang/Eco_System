import type { Page } from "@playwright/test";

export async function loginViaApi(page: Page) {
  // Navigate to an allowed route, then set cookie via document.cookie
  await page.goto("/gate");
  await page.evaluate(() => {
    document.cookie = `site_auth=test; path=/`;
  });
  await page.goto("/");
}
