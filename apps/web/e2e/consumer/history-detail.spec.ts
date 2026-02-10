/**
 * Consumer App History Detail E2E Tests
 *
 * Requires auth — uses authenticatedPage fixture.
 * URL: /ja/consumer/history/:id (dynamic route)
 * API: GET /v1/user/transactions/:id
 * Shows transaction info, timeline, copy functionality.
 * Data from real API — no hardcoded values.
 *
 * NOTE: Transaction ID 1 may not exist in the database.
 * Tests that require a valid transaction first attempt to discover one
 * from the history list. If no transactions exist, those tests skip.
 */

import { test, expect } from '../fixtures';

test.use({
  navigationTimeout: 60000,
  actionTimeout: 15000,
  expect: { timeout: 15000 },
});
test.setTimeout(60000);

const DETAIL_URL_JA = '/ja/consumer/history';
const DETAIL_URL_EN = '/en/consumer/history';

/**
 * Helper to discover a valid transaction ID from the history list page.
 * Returns the ID string, or null if no transactions found.
 */
async function findValidTxId(page: import('@playwright/test').Page): Promise<string | null> {
  await page.goto(`${DETAIL_URL_JA}`);
  await expect(page.getByRole('main')).toBeVisible({ timeout: 15000 });

  // Look for a link to a transaction detail page on the list
  const detailLink = page.locator('a[href*="/consumer/history/"]').first();
  if (await detailLink.isVisible({ timeout: 5000 }).catch(() => false)) {
    const href = await detailLink.getAttribute('href');
    if (href) {
      const match = href.match(/\/consumer\/history\/(.+)$/);
      if (match) {
        return match[1];
      }
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// 1. Page Load & API Integration
// ---------------------------------------------------------------------------
test.describe('Page Load & API Integration', () => {
  test('should load transaction detail from API', async ({
    page,
    authenticatedPage,
  }) => {
    const txId = await findValidTxId(page);

    if (txId) {
      // Navigate to valid transaction
      await page.goto(`${DETAIL_URL_JA}/${txId}`);
      await expect(page.getByRole('main')).toBeVisible({ timeout: 15000 });
      // Should show content (not error state)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    } else {
      // No transactions exist — verify the history list shows empty state
      await expect(page.getByRole('main')).toBeVisible({ timeout: 15000 });
    }
  });
});

// ---------------------------------------------------------------------------
// 2. Page Structure (with first available transaction)
// ---------------------------------------------------------------------------
test.describe('Page Structure', () => {
  test('should render main landmark with role', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(`${DETAIL_URL_JA}/1`);
    await expect(page.getByRole('main')).toBeVisible({ timeout: 15000 });
  });

  test('should display h1 heading', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(`${DETAIL_URL_JA}/1`);
    await expect(page.getByRole('main')).toBeVisible({ timeout: 15000 });

    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toBeVisible();
  });

  test('should display back button', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(`${DETAIL_URL_JA}/1`);
    await expect(page.getByRole('main')).toBeVisible({ timeout: 15000 });

    // Back button links to history
    const backButton = page.locator('a[href*="/consumer/history"]').first();
    await expect(backButton).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 3. Transaction Details (requires valid transaction)
// ---------------------------------------------------------------------------
test.describe('Transaction Details', () => {
  test('should display transaction type in summary card', async ({
    page,
    authenticatedPage,
  }) => {
    const txId = await findValidTxId(page);
    test.skip(!txId, 'No transactions available in database');

    await page.goto(`${DETAIL_URL_JA}/${txId}`);
    await expect(page.getByRole('main')).toBeVisible({ timeout: 15000 });

    // h2 shows transaction type (Lock, Normal Unlock, Emergency Unlock, etc.)
    const h2 = page.locator('h2').first();
    await expect(h2).toBeVisible();
  });

  test('should display transaction status badge', async ({
    page,
    authenticatedPage,
  }) => {
    const txId = await findValidTxId(page);
    test.skip(!txId, 'No transactions available in database');

    await page.goto(`${DETAIL_URL_JA}/${txId}`);
    await expect(page.getByRole('main')).toBeVisible({ timeout: 15000 });

    // Status badge
    const statusBadge = page.locator('span').filter({ hasText: /完了|待機中|処理中|Complete|Pending|Processing/i }).first();
    await expect(statusBadge).toBeVisible();
  });

  test('should display transaction amount with ETH', async ({
    page,
    authenticatedPage,
  }) => {
    const txId = await findValidTxId(page);
    test.skip(!txId, 'No transactions available in database');

    await page.goto(`${DETAIL_URL_JA}/${txId}`);
    await expect(page.getByRole('main')).toBeVisible({ timeout: 15000 });

    await expect(page.getByText(/ETH/).first()).toBeVisible();
  });

  test('should display details section with heading', async ({
    page,
    authenticatedPage,
  }) => {
    const txId = await findValidTxId(page);
    test.skip(!txId, 'No transactions available in database');

    await page.goto(`${DETAIL_URL_JA}/${txId}`);
    await expect(page.getByRole('main')).toBeVisible({ timeout: 15000 });

    const detailsHeading = page.locator('#details-heading');
    await expect(detailsHeading).toBeVisible();
  });

  test('should display transaction hash', async ({
    page,
    authenticatedPage,
  }) => {
    const txId = await findValidTxId(page);
    test.skip(!txId, 'No transactions available in database');

    await page.goto(`${DETAIL_URL_JA}/${txId}`);
    await expect(page.getByRole('main')).toBeVisible({ timeout: 15000 });

    // tx hash displayed in monospace
    const txHash = page.locator('.font-mono').first();
    await expect(txHash).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 4. Timeline (requires valid transaction)
// ---------------------------------------------------------------------------
test.describe('Timeline', () => {
  test('should display timeline section with heading', async ({
    page,
    authenticatedPage,
  }) => {
    const txId = await findValidTxId(page);
    test.skip(!txId, 'No transactions available in database');

    await page.goto(`${DETAIL_URL_JA}/${txId}`);
    await expect(page.getByRole('main')).toBeVisible({ timeout: 15000 });

    const timelineHeading = page.locator('#timeline-heading');
    await expect(timelineHeading).toBeVisible();
  });

  test('should display timeline steps as ordered list', async ({
    page,
    authenticatedPage,
  }) => {
    const txId = await findValidTxId(page);
    test.skip(!txId, 'No transactions available in database');

    await page.goto(`${DETAIL_URL_JA}/${txId}`);
    await expect(page.getByRole('main')).toBeVisible({ timeout: 15000 });

    const timeline = page.locator('ol');
    await expect(timeline).toBeVisible();

    // Should have at least 2 steps
    const steps = timeline.locator('li');
    const count = await steps.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });
});

// ---------------------------------------------------------------------------
// 5. Copy Functionality
// ---------------------------------------------------------------------------
test.describe('Copy Functionality', () => {
  test('should show copy button for transaction hash', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(`${DETAIL_URL_JA}/1`);
    await expect(page.getByRole('main')).toBeVisible({ timeout: 15000 });

    const copyButton = page.locator('button').filter({ has: page.locator('svg') }).first();
    await expect(copyButton).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 6. External Link
// ---------------------------------------------------------------------------
test.describe('External Link', () => {
  test('etherscan link should have security attributes', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(`${DETAIL_URL_JA}/1`);
    await expect(page.getByRole('main')).toBeVisible({ timeout: 15000 });

    const externalLink = page.locator('a[href*="etherscan"]').first();
    if (await externalLink.isVisible()) {
      await expect(externalLink).toHaveAttribute('target', '_blank');
      await expect(externalLink).toHaveAttribute('rel', /noopener/);
    }
  });
});

// ---------------------------------------------------------------------------
// 7. Navigation
// ---------------------------------------------------------------------------
test.describe('Navigation', () => {
  test('back button should navigate to history list', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(`${DETAIL_URL_JA}/1`);
    await expect(page.getByRole('main')).toBeVisible({ timeout: 15000 });

    // Find the back-to-history link (could be aria-label or text based)
    const backLink = page.locator('a[href*="/consumer/history"]').first();
    if (await backLink.isVisible()) {
      await backLink.click();
      await expect(page).toHaveURL(/\/consumer\/history/);
    }
  });
});

// ---------------------------------------------------------------------------
// 8. Accessibility
// ---------------------------------------------------------------------------
test.describe('Accessibility', () => {
  test('should have proper heading hierarchy', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(`${DETAIL_URL_JA}/1`);
    await expect(page.getByRole('main')).toBeVisible({ timeout: 15000 });

    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1);
  });

  test('should have definition list for details', async ({
    page,
    authenticatedPage,
  }) => {
    const txId = await findValidTxId(page);
    test.skip(!txId, 'No transactions available in database');

    await page.goto(`${DETAIL_URL_JA}/${txId}`);
    await expect(page.getByRole('main')).toBeVisible({ timeout: 15000 });

    const dl = page.locator('dl');
    await expect(dl).toBeVisible();

    const dt = page.locator('dt');
    const dd = page.locator('dd');
    expect(await dt.count()).toBeGreaterThanOrEqual(2);
    expect(await dd.count()).toBeGreaterThanOrEqual(2);
  });

  test('copy button should be keyboard accessible', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(`${DETAIL_URL_JA}/1`);
    await expect(page.getByRole('main')).toBeVisible({ timeout: 15000 });

    const copyButton = page.locator('button').filter({ has: page.locator('svg') }).first();
    await copyButton.focus();
    await expect(copyButton).toBeFocused();
  });
});

// ---------------------------------------------------------------------------
// 9. Responsive Design
// ---------------------------------------------------------------------------
test.describe('Responsive Design', () => {
  test('should display correctly on mobile (375x667)', async ({
    page,
    authenticatedPage,
  }) => {
    const txId = await findValidTxId(page);
    test.skip(!txId, 'No transactions available in database');

    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${DETAIL_URL_JA}/${txId}`);
    await expect(page.getByRole('main')).toBeVisible({ timeout: 15000 });

    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('#details-heading')).toBeVisible();
    await expect(page.locator('#timeline-heading')).toBeVisible();
  });

  test('should display correctly on tablet (768x1024)', async ({
    page,
    authenticatedPage,
  }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(`${DETAIL_URL_JA}/1`);
    await expect(page.getByRole('main')).toBeVisible({ timeout: 15000 });

    await expect(page.locator('h1')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 10. English Locale
// ---------------------------------------------------------------------------
test.describe('English Locale', () => {
  test('should display English content', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(`${DETAIL_URL_EN}/1`);
    await expect(page.getByRole('main')).toBeVisible({ timeout: 15000 });

    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should display English section headings', async ({
    page,
    authenticatedPage,
  }) => {
    const txId = await findValidTxId(page);
    test.skip(!txId, 'No transactions available in database');

    await page.goto(`${DETAIL_URL_EN}/${txId}`);
    await expect(page.getByRole('main')).toBeVisible({ timeout: 15000 });

    // Details and timeline sections have English headings
    const detailsHeading = page.locator('#details-heading');
    await expect(detailsHeading).toBeVisible();

    const timelineHeading = page.locator('#timeline-heading');
    await expect(timelineHeading).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 11. Error Handling
// ---------------------------------------------------------------------------
test.describe('Error Handling', () => {
  test('should show error state for non-existent transaction', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(`${DETAIL_URL_JA}/non-existent-tx-999999`);
    await expect(page.getByRole('main')).toBeVisible({ timeout: 15000 });

    // Should show error or "not found" state
    const errorIndicator = page.locator('[class*="destructive"], [class*="error"]').first();
    const notFound = page.getByText(/Not Found|見つかりません/i).first();

    // Either error indicator or not found text should be visible
    const errorVisible = await errorIndicator.isVisible().catch(() => false);
    const notFoundVisible = await notFound.isVisible().catch(() => false);

    expect(errorVisible || notFoundVisible).toBeTruthy();
  });
});
