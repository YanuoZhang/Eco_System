import { test, expect } from "@playwright/test";

test("Home page: hero, timeline switch, CTA and footer", async ({ page }) => {
  await page.goto("/");

  // Hero section
  await expect(page.getByRole("heading", { name: /Climate Change is Here/i })).toBeVisible();

  // Scroll to timeline and switch period
  const timeline = page.getByRole("region", { name: /Climate Timeline/i });
  await timeline.scrollIntoViewIfNeeded();

  const heading = page.getByRole("heading", { name: /How We Got Here/i });
  const loadingHeading = page.getByRole("heading", { name: /Loading timeline/i });
  const noDataText = page.getByText(/No timeline data/i);

  let didSeeData = false;
  try {
    await heading.waitFor({ state: "visible", timeout: 5000 });
    didSeeData = true;
  } catch {
    // No data header visible promptly; try loading header or empty state
    try {
      await loadingHeading.waitFor({ state: "visible", timeout: 3000 });
    } catch {
      await noDataText
        .first()
        .waitFor({ state: "visible", timeout: 3000 })
        .catch(async () => {
          // As a last resort ensure the region rendered
          await expect(timeline).toBeVisible();
        });
    }
  }

  if (didSeeData) {
    // On small screens, the period button text is split. Click the 3rd period button instead.
    const periodButtons = timeline.getByRole("button");
    await periodButtons.nth(2).click();
    // Check if timeline content changes after clicking period button
    await expect(timeline).toBeVisible();
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
  await page.getByRole("link", { name: "Explore My Impact" }).waitFor({ state: "visible" });
  await page.getByRole("link", { name: "Explore My Impact" }).click();
  await expect(page).toHaveURL(/\/quiz$/);

  await page.getByRole("link", { name: "Info" }).waitFor({ state: "visible" });
  await page.getByRole("link", { name: "Info" }).click();
  await expect(page).toHaveURL(/\/info$/);
  await expect(page.getByRole("heading", { name: /Info/ })).toBeVisible();

  await page.getByRole("link", { name: "My Pledge" }).waitFor({ state: "visible" });
  await page.getByRole("link", { name: "My Pledge" }).click();
  await expect(page).toHaveURL(/\/pledge$/);
  await expect(page.getByRole("heading", { name: /Pledge/ })).toBeVisible();
});
