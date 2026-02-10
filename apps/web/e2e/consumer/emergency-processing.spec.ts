/**
 * Consumer App Emergency Processing E2E Tests
 *
 * Requires auth — uses authenticatedPage fixture.
 * URL: /ja/consumer/emergency-processing
 * Animated processing page with step list. Auto-navigates to success after ~5s.
 */

import { test, expect } from '../fixtures';

test.use({
  navigationTimeout: 60000,
  actionTimeout: 15000,
  expect: { timeout: 15000 },
});
test.setTimeout(60000);

const PROCESSING_URL_JA = '/ja/consumer/emergency-processing';
const PROCESSING_URL_EN = '/en/consumer/emergency-processing';

// ---------------------------------------------------------------------------
// 1. Page Structure
// ---------------------------------------------------------------------------
test.describe('Page Structure', () => {
  test('should render main landmark with role', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(PROCESSING_URL_JA);
    const main = page.getByRole('main');
    await expect(main).toBeVisible({ timeout: 15000 });
  });

  test('should display processing title', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(PROCESSING_URL_JA);
    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 2. Processing Animation
// ---------------------------------------------------------------------------
test.describe('Processing Animation', () => {
  test('should display spinning animation', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(PROCESSING_URL_JA);

    const spinner = page.locator('.animate-spin').first();
    await expect(spinner).toBeVisible();
  });

  test('should display pulsing center icon', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(PROCESSING_URL_JA);

    const pulseElement = page.locator('.animate-pulse').first();
    await expect(pulseElement).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 3. Step List
// ---------------------------------------------------------------------------
test.describe('Step List', () => {
  test('should display step list with role', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(PROCESSING_URL_JA);

    const stepList = page.locator('[role="list"]');
    await expect(stepList).toBeVisible();
  });

  test('should display 4 step items', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(PROCESSING_URL_JA);

    const items = page.locator('[role="listitem"]');
    await expect(items).toHaveCount(4);
  });

  test('first step should be marked as complete', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(PROCESSING_URL_JA);

    // First step has a success background
    const firstItem = page.locator('[role="listitem"]').first();
    await expect(firstItem).toBeVisible();

    // Should have a check icon (complete state)
    const checkIcon = firstItem.locator('.bg-success');
    await expect(checkIcon).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 4. Warning Message
// ---------------------------------------------------------------------------
test.describe('Warning Message', () => {
  test('should display do-not-close warning', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(PROCESSING_URL_JA);

    // The warning about not closing the browser
    await expect(page.getByText(/ブラウザを閉じないでください|Do not close/i)).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 5. Auto Navigation
// ---------------------------------------------------------------------------
test.describe('Auto Navigation', () => {
  test('should auto-navigate to success page', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(PROCESSING_URL_JA);
    // Component auto-redirects after 5s (TOTAL_DURATION) — allow extra time for page load
    await page.waitForURL('**/emergency-success', { timeout: 20000 });
    await expect(page).toHaveURL(/emergency-success/);
  });
});

// ---------------------------------------------------------------------------
// 6. Accessibility
// ---------------------------------------------------------------------------
test.describe('Accessibility', () => {
  test('step items should have proper listitem role', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(PROCESSING_URL_JA);

    const items = page.locator('[role="listitem"]');
    await expect(items.first()).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 7. English Locale
// ---------------------------------------------------------------------------
test.describe('English Locale', () => {
  test('should display English step labels', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(PROCESSING_URL_EN);

    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // Should display 4 English step items
    const items = page.locator('[role="listitem"]');
    await expect(items).toHaveCount(4);
  });
});
