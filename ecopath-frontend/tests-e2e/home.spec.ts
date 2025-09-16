import { test, expect } from "@playwright/test";

test("Home page: hero, timeline switch, CTA and footer", async ({ page }) => {
  await page.goto("/");

  // Hero section
  await expect(page.getByRole("heading", { name: /Climate Change is Here/i })).toBeVisible();

  // Scroll to timeline and switch period
  const timeline = page.getByRole("region", { name: /Climate Timeline/i });
  await timeline.scrollIntoViewIfNeeded();

  const heading = page.getByRole("heading", { name: /How We Got Here/i });
  const loading = page.getByRole("heading", { name: /Loading timeline/i });

  if ((await heading.count()) > 0) {
    await expect(heading).toBeVisible();
    // On small screens, the period button text is split. Click the 3rd period button instead.
    const periodButtons = timeline.getByRole("button");
    await periodButtons.nth(2).click();
    await expect(page.getByRole("heading", { name: /First Climate Signals/i })).toBeVisible();
  } else {
    // If API data not available, ensure loading state is shown
    await expect(loading).toBeVisible();
  }

  // CTA link navigates to /quiz
  const cta = page.getByRole("link", { name: /Explore My Climate Impact/i });
  await expect(cta).toHaveAttribute("href", "/quiz");

  // Footer brand visible
  await expect(page.getByText("EcoPath").first()).toBeVisible();
});

test("Nav links navigate to Quiz / Info / Pledge", async ({ page }) => {
  await page.goto("/");
  // Desktop nav links exist; click each and verify route
  await page.getByRole("link", { name: "Explore My Impact" }).click({ noWaitAfter: true });
  await expect(page).toHaveURL(/\/quiz$/);

  await page.getByRole("link", { name: "Info" }).click({ noWaitAfter: true });
  await expect(page).toHaveURL(/\/info$/);
  await expect(page.getByRole("heading", { name: /Info/ })).toBeVisible();

  await page.getByRole("link", { name: "My Pledge" }).click({ noWaitAfter: true });
  await expect(page).toHaveURL(/\/pledge$/);
  await expect(page.getByRole("heading", { name: /Pledge/ })).toBeVisible();
});
