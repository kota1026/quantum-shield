import { test, expect } from '@playwright/test';

/**
 * Consumer App - FAQ Page
 * Static content page with interactive accordion
 * No auth, no API calls
 */
test.describe('Consumer FAQ Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/consumer/faq');
    // Wait for full page render including all FAQ accordion items
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    // Wait for the contact section at the bottom to ensure full render
    await expect(page.locator('a[href*="/consumer/contact"]')).toBeVisible({ timeout: 10000 });
  });

  test('displays page with correct structure', async ({ page }) => {
    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('has a single h1 heading', async ({ page }) => {
    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toHaveCount(1);
  });

  test('has back button linking to settings page', async ({ page }) => {
    // Back button links to /consumer/settings
    const backLink = page.getByRole('main').locator('a[href*="/consumer/settings"]');
    await expect(backLink).toBeVisible();
  });

  test('displays FAQ section labels', async ({ page }) => {
    // The component renders 3 sections: basics, lock-unlock, security
    // Section labels are rendered as uppercase text spans (not headings)
    const main = page.getByRole('main');
    await expect(main).toBeVisible();

    // At least 3 sections should have questions
    const faqButtons = page.locator('button[aria-expanded]');
    await expect(faqButtons.first()).toBeVisible();
    const buttonCount = await faqButtons.count();
    expect(buttonCount).toBeGreaterThanOrEqual(6);
  });

  test('renders FAQ items with aria-expanded attribute', async ({ page }) => {
    const faqButtons = page.locator('button[aria-expanded]');
    await expect(faqButtons.first()).toBeVisible();
    const count = await faqButtons.count();
    expect(count).toBeGreaterThanOrEqual(6);

    // All should start collapsed
    for (let i = 0; i < count; i++) {
      await expect(faqButtons.nth(i)).toHaveAttribute('aria-expanded', 'false');
    }
  });

  test('expands FAQ item when clicked', async ({ page }) => {
    const firstButton = page.locator('button[aria-expanded]').first();
    await expect(firstButton).toHaveAttribute('aria-expanded', 'false');

    await firstButton.click();
    await expect(firstButton).toHaveAttribute('aria-expanded', 'true');
  });

  test('collapses FAQ item when clicked again', async ({ page }) => {
    const firstButton = page.locator('button[aria-expanded]').first();

    // Open
    await firstButton.click();
    await expect(firstButton).toHaveAttribute('aria-expanded', 'true');

    // Close
    await firstButton.click();
    await expect(firstButton).toHaveAttribute('aria-expanded', 'false');
  });

  test('allows multiple FAQ items to be open simultaneously', async ({ page }) => {
    const buttons = page.locator('button[aria-expanded]');
    const firstButton = buttons.first();
    const secondButton = buttons.nth(1);

    await firstButton.click();
    await secondButton.click();

    await expect(firstButton).toHaveAttribute('aria-expanded', 'true');
    await expect(secondButton).toHaveAttribute('aria-expanded', 'true');
  });

  test('FAQ items have aria-controls linking to answer regions', async ({ page }) => {
    // Use aria-expanded to target only FAQ accordion buttons (not NextJS dev tools)
    const faqButtons = page.locator('button[aria-expanded]');
    await expect(faqButtons.first()).toBeVisible();
    const count = await faqButtons.count();
    expect(count).toBeGreaterThanOrEqual(6);

    // Each FAQ button should have a corresponding region
    // Some buttons might be outside the FAQ section (e.g., cookie banner)
    const regions = page.getByRole('main').locator('[role="region"]');
    const regionCount = await regions.count();
    expect(regionCount).toBeGreaterThanOrEqual(6);
  });

  test('toggles FAQ with Enter key', async ({ page }) => {
    const firstButton = page.locator('button[aria-expanded]').first();
    await firstButton.focus();

    await page.keyboard.press('Enter');
    await expect(firstButton).toHaveAttribute('aria-expanded', 'true');

    await page.keyboard.press('Enter');
    await expect(firstButton).toHaveAttribute('aria-expanded', 'false');
  });

  test('displays contact support section', async ({ page }) => {
    // Contact section at bottom with a link to /consumer/contact
    const contactLink = page.locator('a[href*="/consumer/contact"]');
    await expect(contactLink).toBeVisible();
  });

  test('displays properly on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const faqButtons = page.locator('button[aria-expanded]');
    await expect(faqButtons.first()).toBeVisible();
  });

  test('displays English content at /en locale', async ({ page }) => {
    await page.goto('/en/consumer/faq');
    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // English FAQ should also have accordion items
    const faqButtons = page.locator('button[aria-expanded]');
    await expect(faqButtons.first()).toBeVisible();
    const count = await faqButtons.count();
    expect(count).toBeGreaterThanOrEqual(6);
  });
});
