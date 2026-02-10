/**
 * Consumer App Emergency Bond E2E Tests
 *
 * Requires auth — uses authenticatedPage fixture.
 * URL: /ja/consumer/emergency-bond
 * Page shows bond calculation for emergency unlock with confirmation.
 * Data values (amounts) checked with regex/dynamic patterns, not hardcoded.
 */

import { test, expect } from '../fixtures';

test.use({
  navigationTimeout: 60000,
  actionTimeout: 15000,
  expect: { timeout: 15000 },
});
test.setTimeout(60000);

const BOND_URL_JA = '/ja/consumer/emergency-bond';
const BOND_URL_EN = '/en/consumer/emergency-bond';

// ---------------------------------------------------------------------------
// 1. Page Structure
// ---------------------------------------------------------------------------
test.describe('Page Structure', () => {
  test('should render main landmark with role', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(BOND_URL_JA);
    const main = page.getByRole('main');
    await expect(main).toBeVisible({ timeout: 15000 });
  });

  test('should display header with back button and title', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(BOND_URL_JA);

    // Back button
    const backButton = page.locator('a').filter({ has: page.locator('svg') }).first();
    await expect(backButton).toBeVisible();

    // Page heading
    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 2. Warning Banner
// ---------------------------------------------------------------------------
test.describe('Warning Banner', () => {
  test('should display warning alert', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(BOND_URL_JA);

    const warning = page.getByRole('alert').first();
    await expect(warning).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 3. Bond Information
// ---------------------------------------------------------------------------
test.describe('Bond Information', () => {
  test('should display bond card with title', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(BOND_URL_JA);

    // Bond card title (h2)
    const bondTitle = page.getByRole('heading', { level: 2 });
    await expect(bondTitle).toBeVisible();
  });

  test('should display unlock amount with ETH value', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(BOND_URL_JA);

    // Amount should match a numeric ETH pattern
    await expect(page.getByText(/\d+\.?\d*\s*ETH/).first()).toBeVisible();
  });

  test('should display bond calculation formula', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(BOND_URL_JA);

    await expect(page.getByText(/MAX\(0\.5\s*ETH/).first()).toBeVisible();
  });

  test('should display required bond amount', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(BOND_URL_JA);

    // Bond amount in the highlighted section (numeric pattern)
    const bondSection = page.locator('.border-warning');
    await expect(bondSection.getByText(/\d+\.\d+\s*ETH/).first()).toBeVisible();
  });

  test('should display info list items', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(BOND_URL_JA);

    // Wait for the info list to render (ul with li items inside bond card)
    const infoList = page.getByRole('main').locator('ul');
    await expect(infoList.first()).toBeVisible({ timeout: 10000 });
    const infoItems = infoList.first().locator('li');
    const count = await infoItems.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });
});

// ---------------------------------------------------------------------------
// 4. Confirmation Checkbox
// ---------------------------------------------------------------------------
test.describe('Confirmation Checkbox', () => {
  test('submit button should be disabled initially', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(BOND_URL_JA);

    const submitButton = page.getByRole('button', { name: /緊急Unlock|Emergency Unlock/i });
    await expect(submitButton).toBeDisabled();
  });

  test('checking checkbox should enable submit button', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(BOND_URL_JA);

    const checkbox = page.getByRole('checkbox');
    await checkbox.check();

    const submitButton = page.getByRole('button', { name: /緊急Unlock|Emergency Unlock/i });
    await expect(submitButton).toBeEnabled();
  });

  test('unchecking checkbox should disable submit button again', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(BOND_URL_JA);

    const checkbox = page.getByRole('checkbox');
    await checkbox.check();
    await checkbox.uncheck();

    const submitButton = page.getByRole('button', { name: /緊急Unlock|Emergency Unlock/i });
    await expect(submitButton).toBeDisabled();
  });

  test('checkbox should have aria-describedby', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(BOND_URL_JA);

    const checkbox = page.getByRole('checkbox');
    await expect(checkbox).toHaveAttribute('aria-describedby', 'confirm-label');
  });
});

// ---------------------------------------------------------------------------
// 5. Cancel Navigation
// ---------------------------------------------------------------------------
test.describe('Cancel Navigation', () => {
  test('cancel button should link to unlock page', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(BOND_URL_JA);

    const cancelButton = page.getByRole('link', { name: /キャンセル|Cancel/i });
    await expect(cancelButton).toBeVisible();
    await expect(cancelButton).toHaveAttribute('href', /\/consumer\/unlock/);
  });
});

// ---------------------------------------------------------------------------
// 6. Accessibility
// ---------------------------------------------------------------------------
test.describe('Accessibility', () => {
  test('checkbox should be keyboard accessible', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(BOND_URL_JA);

    const checkbox = page.getByRole('checkbox');
    await checkbox.focus();
    await expect(checkbox).toBeFocused();
  });
});

// ---------------------------------------------------------------------------
// 7. Responsive Design
// ---------------------------------------------------------------------------
test.describe('Responsive Design', () => {
  test('should display correctly on mobile (375x667)', async ({
    page,
    authenticatedPage,
  }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(BOND_URL_JA);

    await expect(page.getByRole('main')).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('checkbox')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 8. English Locale
// ---------------------------------------------------------------------------
test.describe('English Locale', () => {
  test('should display English content', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(BOND_URL_EN);

    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('alert').first()).toBeVisible();
    await expect(page.getByRole('checkbox')).toBeVisible();
  });
});
