/**
 * Consumer App Emergency Success E2E Tests
 *
 * Requires auth — uses authenticatedPage fixture.
 * URL: /ja/consumer/emergency-success
 * Shows emergency unlock completion with countdown timer, amounts, tx hash.
 * Data values are dynamic (fallback or API) — use pattern matching, not hardcoded values.
 */

import { test, expect } from '../fixtures';

test.use({
  navigationTimeout: 60000,
  actionTimeout: 15000,
  expect: { timeout: 15000 },
});
test.setTimeout(60000);

const SUCCESS_URL_JA = '/ja/consumer/emergency-success';
const SUCCESS_URL_EN = '/en/consumer/emergency-success';

// ---------------------------------------------------------------------------
// 1. Page Structure
// ---------------------------------------------------------------------------
test.describe('Page Structure', () => {
  test('should render main landmark with role', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(SUCCESS_URL_JA);
    const main = page.getByRole('main');
    await expect(main).toBeVisible({ timeout: 15000 });
  });

  test('should display h1 heading', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(SUCCESS_URL_JA);
    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toBeVisible();
  });

  test('should display subtitle text', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(SUCCESS_URL_JA);

    // Subtitle about the 7-day waiting period
    await expect(page.getByText(/7日間|待機期間|7-day/i).first()).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 2. Success Icon
// ---------------------------------------------------------------------------
test.describe('Success Icon', () => {
  test('should display warning-themed success icon', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(SUCCESS_URL_JA);

    // The emergency success uses a warning-themed icon (AlertTriangle)
    const iconContainer = page.locator('.border-warning').first();
    await expect(iconContainer).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 3. Countdown Timer
// ---------------------------------------------------------------------------
test.describe('Countdown Timer', () => {
  test('should display time lock card with title', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(SUCCESS_URL_JA);

    // Time lock section with countdown
    await expect(page.getByText(/Time Lock|タイムロック/i).first()).toBeVisible();
  });

  test('should display countdown in Xd HH:MM:SS format', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(SUCCESS_URL_JA);

    // Countdown format: Xd HH:MM:SS
    const countdown = page.getByText(/\d+d \d{2}:\d{2}:\d{2}/);
    await expect(countdown).toBeVisible();
  });

  test('countdown should decrement over time', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(SUCCESS_URL_JA);

    const countdownLocator = page.getByText(/\d+d \d{2}:\d{2}:\d{2}/);
    const initialValue = await countdownLocator.textContent();

    await page.waitForTimeout(2000);
    const newValue = await countdownLocator.textContent();

    expect(initialValue).not.toBe(newValue);
  });

  test('should display progress bar', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(SUCCESS_URL_JA);

    // Progress bar may be hidden (zero width at start); check it exists in DOM
    const progressBar = page.locator('.bg-warning.rounded-full').first();
    await expect(progressBar).toBeAttached();
  });
});

// ---------------------------------------------------------------------------
// 4. Result Card (Amounts)
// ---------------------------------------------------------------------------
test.describe('Result Card', () => {
  test('should display unlock amount with ETH', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(SUCCESS_URL_JA);

    // Amount should have a numeric ETH value
    await expect(page.getByText(/\d+\.?\d*\s*ETH/).first()).toBeVisible();
  });

  test('should display bond amount', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(SUCCESS_URL_JA);

    await expect(page.getByText(/Bond/i).first()).toBeVisible();
  });

  test('should display transaction hash with external link', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(SUCCESS_URL_JA);

    await expect(page.getByText(/TX Hash/i)).toBeVisible();
    const txLink = page.locator('a[href*="etherscan"]');
    await expect(txLink).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 5. Navigation Buttons
// ---------------------------------------------------------------------------
test.describe('Navigation Buttons', () => {
  test('should display dashboard button', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(SUCCESS_URL_JA);

    const dashboardButton = page.getByRole('link', { name: /ダッシュボード|Dashboard/i });
    await expect(dashboardButton).toBeVisible();
    await expect(dashboardButton).toHaveAttribute('href', /\/consumer\/dashboard/);
  });

  test('should display history button', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(SUCCESS_URL_JA);

    const historyButton = page.getByRole('link', { name: /履歴|History/i });
    await expect(historyButton).toBeVisible();
    await expect(historyButton).toHaveAttribute('href', /\/consumer\/history/);
  });
});

// ---------------------------------------------------------------------------
// 6. External Links
// ---------------------------------------------------------------------------
test.describe('External Links', () => {
  test('etherscan link should open in new tab with security attrs', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(SUCCESS_URL_JA);

    const txLink = page.locator('a[href*="etherscan"]');
    await expect(txLink).toHaveAttribute('target', '_blank');
    await expect(txLink).toHaveAttribute('rel', /noopener/);
  });
});

// ---------------------------------------------------------------------------
// 7. Accessibility
// ---------------------------------------------------------------------------
test.describe('Accessibility', () => {
  test('navigation buttons should be keyboard accessible', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(SUCCESS_URL_JA);

    const dashboardButton = page.getByRole('link', { name: /ダッシュボード|Dashboard/i });
    await dashboardButton.focus();
    await expect(dashboardButton).toBeFocused();
  });
});

// ---------------------------------------------------------------------------
// 8. Responsive Design
// ---------------------------------------------------------------------------
test.describe('Responsive Design', () => {
  test('should display correctly on mobile (375x667)', async ({
    page,
    authenticatedPage,
  }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(SUCCESS_URL_JA);

    await expect(page.getByRole('main')).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('link', { name: /ダッシュボード|Dashboard/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /履歴|History/i })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 9. English Locale
// ---------------------------------------------------------------------------
test.describe('English Locale', () => {
  test('should display English content', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(SUCCESS_URL_EN);

    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // English navigation buttons
    await expect(page.getByRole('link', { name: /Dashboard/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /History/i })).toBeVisible();
  });
});
