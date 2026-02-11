/**
 * Consumer App Unlock Success E2E Tests
 *
 * Requires auth — uses authenticatedPage fixture.
 * URL: /ja/consumer/unlock/success
 * Shows normal unlock success with time lock countdown.
 * Data comes from URL params + API — values checked with patterns not hardcoded.
 */

import { test, expect } from '../fixtures';

const SUCCESS_URL_JA = '/ja/consumer/unlock/success';
const SUCCESS_URL_EN = '/en/consumer/unlock/success';

// ---------------------------------------------------------------------------
// 1. Page Structure
// ---------------------------------------------------------------------------
test.describe('Page Structure', () => {
  test('should render main landmark with role', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(SUCCESS_URL_JA);
    const main = page.locator('main[role="main"]');
    await expect(main).toBeVisible();
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

    // Subtitle about the 24h waiting period
    const subtitle = page.locator('main p').first();
    await expect(subtitle).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 2. Success Icon
// ---------------------------------------------------------------------------
test.describe('Success Icon', () => {
  test('should display success check circle icon', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(SUCCESS_URL_JA);

    // Green success icon with check
    const successIcon = page.locator('.bg-success').first();
    await expect(successIcon).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 3. Time Lock Section
// ---------------------------------------------------------------------------
test.describe('Time Lock Section', () => {
  test('should display time lock card', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(SUCCESS_URL_JA);

    await expect(page.getByText(/Time Lock/i).first()).toBeVisible();
  });

  test('should display countdown timer in HH:MM:SS format', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(SUCCESS_URL_JA);

    // Timer format: HH:MM:SS (or 00:00:00 if no releaseTime param)
    const timer = page.getByText(/\d{2}:\d{2}:\d{2}/);
    await expect(timer).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 4. Transaction Details
// ---------------------------------------------------------------------------
test.describe('Transaction Details', () => {
  test('should display amount label', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(SUCCESS_URL_JA);

    await expect(page.getByText(/アンロック金額|Unlock Amount/i).first()).toBeVisible();
  });

  test('should display estimated completion label', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(SUCCESS_URL_JA);

    await expect(page.getByText(/完了予定|Estimated|アンロック可能日時/i).first()).toBeVisible();
  });

  test('should display unlock ID label', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(SUCCESS_URL_JA);

    await expect(page.getByText(/Unlock ID/i).first()).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 5. Navigation Buttons
// ---------------------------------------------------------------------------
test.describe('Navigation Buttons', () => {
  test('should display view history button', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(SUCCESS_URL_JA);

    const historyButton = page.getByRole('link', { name: /履歴|History/i });
    await expect(historyButton).toBeVisible();
    await expect(historyButton).toHaveAttribute('href', /\/consumer\/history/);
  });

  test('should display back to dashboard button', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(SUCCESS_URL_JA);

    const dashboardButton = page.getByRole('link', { name: /ダッシュボード|Dashboard/i });
    await expect(dashboardButton).toBeVisible();
    await expect(dashboardButton).toHaveAttribute('href', /\/consumer\/dashboard/);
  });

  test('history button should navigate to history page', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(SUCCESS_URL_JA);

    // Link wraps a Button — use href-based locator for reliable click
    const historyLink = page.locator('a[href*="/consumer/history"]');
    await historyLink.click();
    await expect(page).toHaveURL(/\/consumer\/history/, { timeout: 15000 });
  });

  test('dashboard button should navigate to dashboard page', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(SUCCESS_URL_JA);

    // Link wraps a Button — use href-based locator for reliable click
    const dashboardLink = page.locator('a[href*="/consumer/dashboard"]');
    await dashboardLink.click();
    await expect(page).toHaveURL(/\/consumer\/dashboard/, { timeout: 15000 });
  });
});

// ---------------------------------------------------------------------------
// 6. Accessibility
// ---------------------------------------------------------------------------
test.describe('Accessibility', () => {
  test('action buttons should be keyboard accessible', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(SUCCESS_URL_JA);

    const historyButton = page.getByRole('link', { name: /履歴|History/i });
    await historyButton.focus();
    await expect(historyButton).toBeFocused();

    const dashboardButton = page.getByRole('link', { name: /ダッシュボード|Dashboard/i });
    await dashboardButton.focus();
    await expect(dashboardButton).toBeFocused();
  });

  test('should have exactly one h1', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(SUCCESS_URL_JA);

    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1);
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
    await page.goto(SUCCESS_URL_JA);

    await expect(page.locator('main[role="main"]')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('link', { name: /履歴|History/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /ダッシュボード|Dashboard/i })).toBeVisible();
  });

  test('should display correctly on tablet (768x1024)', async ({
    page,
    authenticatedPage,
  }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(SUCCESS_URL_JA);

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('main[role="main"]')).toBeVisible();
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
    await page.goto(SUCCESS_URL_EN);

    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('should display English action buttons', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(SUCCESS_URL_EN);

    await expect(page.getByRole('link', { name: /History/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Dashboard/i })).toBeVisible();
  });
});
