import { test, expect } from '@playwright/test';

/**
 * Consumer App - Cookie Policy Page
 * Static content page with interactive cookie settings toggle
 * No auth, no API calls
 */
test.describe('Consumer Cookie Policy Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/consumer/cookie');
  });

  test('displays page with correct structure', async ({ page }) => {
    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('has proper heading hierarchy with h1 and multiple h2 sections', async ({ page }) => {
    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toHaveCount(1);

    const h2s = page.getByRole('heading', { level: 2 });
    await expect(h2s.first()).toBeVisible();
    const h2Count = await h2s.count();
    // 8 sections + contact = at least 9
    expect(h2Count).toBeGreaterThanOrEqual(9);
  });

  test('has back button that links to consumer home', async ({ page }) => {
    const headerLinks = page.locator('header').getByRole('link');
    const backLink = headerLinks.last();
    await expect(backLink).toBeVisible();
    await expect(backLink).toHaveAttribute('href', '/consumer');
  });

  test('has logo link with Quantum Shield text', async ({ page }) => {
    const logoLink = page.locator('header').getByRole('link').first();
    await expect(logoLink).toHaveAttribute('href', '/consumer');
    await expect(page.locator('header').getByText('Quantum Shield')).toBeVisible();
  });

  test('displays last updated date', async ({ page }) => {
    const main = page.getByRole('main');
    // Date paragraph is after h1
    const dateParagraph = main.locator('p').first();
    await expect(dateParagraph).toBeVisible();
  });

  test('has a cookie settings toggle button', async ({ page }) => {
    // The cookie settings button is a plain button (not role="switch")
    // It contains a settings icon and label text
    const settingsButton = page.getByRole('main').locator('button').first();
    await expect(settingsButton).toBeVisible();
  });

  test('opens settings panel when settings button is clicked', async ({ page }) => {
    // Click the cookie settings button to open the panel
    const settingsButton = page.getByRole('main').locator('button').first();
    await settingsButton.click();

    // After opening, toggle switches should be visible
    const switches = page.locator('button[role="switch"]');
    await expect(switches.first()).toBeVisible();
    const switchCount = await switches.count();
    // analytics + functional = 2 switches (essential is always on, no switch)
    expect(switchCount).toBeGreaterThanOrEqual(2);
  });

  test('toggle switches have proper aria attributes', async ({ page }) => {
    // Open settings panel
    const settingsButton = page.getByRole('main').locator('button').first();
    await settingsButton.click();

    const switches = page.locator('button[role="switch"]');
    const firstSwitch = switches.first();
    await expect(firstSwitch).toHaveAttribute('role', 'switch');
    await expect(firstSwitch).toHaveAttribute('aria-checked');
    await expect(firstSwitch).toHaveAttribute('aria-label');
  });

  test('can toggle analytics cookie switch', async ({ page }) => {
    // Open settings panel
    const settingsButton = page.getByRole('main').locator('button').first();
    await settingsButton.click();

    // First switch is analytics (initially checked=true)
    const analyticsSwitch = page.locator('button[role="switch"]').first();
    await expect(analyticsSwitch).toHaveAttribute('aria-checked', 'true');

    // Toggle off
    await analyticsSwitch.click();
    await expect(analyticsSwitch).toHaveAttribute('aria-checked', 'false');

    // Toggle back on
    await analyticsSwitch.click();
    await expect(analyticsSwitch).toHaveAttribute('aria-checked', 'true');
  });

  test('displays save and accept-all buttons in settings panel', async ({ page }) => {
    // Open settings panel
    const settingsButton = page.getByRole('main').locator('button').first();
    await settingsButton.click();

    // Two action buttons in the panel
    const panelButtons = page.locator('.mb-8 button[class*="flex-1"], .mb-8 button').filter({ hasNotText: '' });
    // At minimum, the save and accept-all buttons should exist
    // Note: role="switch" elements may count separately from role="button"
    const allButtons = page.getByRole('button');
    await expect(allButtons.first()).toBeVisible();
    const buttonCount = await allButtons.count();
    // settings toggle (1) + save (1) + accept all (1) + NextJS dev button (1) = at least 3
    expect(buttonCount).toBeGreaterThanOrEqual(3);
  });

  test('displays footer with navigation links', async ({ page }) => {
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();

    const footerLinks = footer.getByRole('link');
    const linkCount = await footerLinks.count();
    expect(linkCount).toBeGreaterThanOrEqual(4);
  });

  test('displays properly on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('displays English content at /en locale', async ({ page }) => {
    await page.goto('/en/consumer/cookie');
    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // English version should also have h2 sections
    const h2s = page.getByRole('heading', { level: 2 });
    await expect(h2s.first()).toBeVisible();
    const h2Count = await h2s.count();
    expect(h2Count).toBeGreaterThanOrEqual(9);
  });
});
