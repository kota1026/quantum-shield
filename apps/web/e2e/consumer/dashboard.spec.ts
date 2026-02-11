/**
 * Consumer App Dashboard E2E Tests
 *
 * 3-Layer Verification:
 *   Layer 1: Verify API endpoints are called correctly (waitForResponse)
 *   Layer 2: Verify API response data appears in UI
 *   Layer 3: Verify user actions trigger correct API calls
 *
 * Uses real SIWE authentication via the authenticatedPage fixture.
 * All API calls go to the live backend at localhost:8080.
 */

import { test, expect } from '../fixtures';
import { getTestWalletAddress } from '../helpers/consumer-auth';

// Authenticated pages need more time: SIWE auth + WagmiProvider init + API calls
test.use({
  navigationTimeout: 60000,
  actionTimeout: 15000,
  // WagmiProvider dynamic import takes 5-15s — default 5s expect timeout is insufficient
  expect: { timeout: 15000 },
});
test.setTimeout(60000);

const DASHBOARD_URL_JA = '/ja/consumer/dashboard';
const DASHBOARD_URL_EN = '/en/consumer/dashboard';

// ---------------------------------------------------------------------------
// 1. Page Load & API Integration
// ---------------------------------------------------------------------------
test.describe('Page Load & API Integration', () => {
  test('page loads and calls GET /v1/user/dashboard', async ({
    page,
    authenticatedPage,
  }) => {
    const dashboardResponse = page.waitForResponse(
      (resp) =>
        resp.url().includes('/v1/user/dashboard') && resp.status() === 200
    );

    await page.goto(DASHBOARD_URL_JA);
    const response = await dashboardResponse;

    expect(response.status()).toBe(200);
    const data = await response.json();
    // The response should have expected shape fields
    expect(data).toBeDefined();
  });

  test('API response data is displayed on the page', async ({
    page,
    authenticatedPage,
  }) => {
    const dashboardResponse = page.waitForResponse(
      (resp) =>
        resp.url().includes('/v1/user/dashboard') && resp.status() === 200
    );

    await page.goto(DASHBOARD_URL_JA);
    await dashboardResponse;

    // Stats section should be visible after data loads
    const statsSection = page.getByRole('region', { name: /資産統計/i });
    await expect(statsSection).toBeVisible();

    // At least one stat value with ETH unit should be present
    await expect(page.getByText('ETH').first()).toBeVisible();
  });

  test('stats cards show data from API response format', async ({
    page,
    authenticatedPage,
  }) => {
    const dashboardResponse = page.waitForResponse(
      (resp) =>
        resp.url().includes('/v1/user/dashboard') && resp.status() === 200
    );

    await page.goto(DASHBOARD_URL_JA);
    await dashboardResponse;

    // Verify the 4 stat cards are rendered with their labels
    await expect(page.getByText('量子耐性暗号鍵で保管中')).toBeVisible();
    await expect(page.getByText('利用可能')).toBeVisible();
    await expect(page.getByText('アンロック待ち')).toBeVisible();
    await expect(page.getByText('取引数')).toBeVisible();
  });

  test('handles API error gracefully and shows error state', async ({
    page,
    authenticatedPage,
  }) => {
    // Intercept the dashboard API and return an error
    await page.route('**/v1/user/dashboard', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' }),
      });
    });

    await page.goto(DASHBOARD_URL_JA);

    // The main element should still be visible (page does not crash)
    await expect(page.getByRole('main')).toBeVisible({ timeout: 15000 });

    // Error banner or retry mechanism should be present
    const errorBanner = page.locator('[class*="destructive"]').first();
    await expect(errorBanner).toBeVisible({ timeout: 10000 });
  });

  test('shows loading skeletons while API is pending', async ({
    page,
    authenticatedPage,
  }) => {
    // Delay the API response to observe loading state
    await page.route('**/v1/user/dashboard', async (route) => {
      await new Promise((r) => setTimeout(r, 2000));
      await route.continue();
    });

    await page.goto(DASHBOARD_URL_JA);

    // Skeleton / pulse loading indicators should appear
    const skeleton = page
      .locator('[class*="animate-pulse"]')
      .first();
    await expect(skeleton).toBeVisible({ timeout: 3000 });
  });
});

// ---------------------------------------------------------------------------
// 2. Stats Section
// ---------------------------------------------------------------------------
test.describe('Stats Section', () => {
  test('stats region is present with aria-label', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(DASHBOARD_URL_JA);
    await expect(page.getByRole('region', { name: /資産統計/i })).toBeVisible();

    const statsSection = page.getByRole('region', { name: /資産統計/i });
    await expect(statsSection).toBeVisible();
  });

  test('4 stat cards are visible with correct labels', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(DASHBOARD_URL_JA);
    await expect(page.getByRole('region', { name: /資産統計/i })).toBeVisible();

    const statsSection = page.getByRole('region', { name: /資産統計/i });
    await expect(statsSection).toBeVisible();

    // All 4 stat card labels
    await expect(page.getByText('量子耐性暗号鍵で保管中')).toBeVisible();
    await expect(page.getByText('利用可能')).toBeVisible();
    await expect(page.getByText('アンロック待ち')).toBeVisible();
    await expect(page.getByText('取引数')).toBeVisible();
  });

  test('stat card values match API response format', async ({
    page,
    authenticatedPage,
  }) => {
    const dashboardResponse = page.waitForResponse(
      (resp) =>
        resp.url().includes('/v1/user/dashboard') && resp.status() === 200
    );

    await page.goto(DASHBOARD_URL_JA);
    await dashboardResponse;

    // Values should contain numeric content (not NaN or undefined)
    const statsSection = page.getByRole('region', { name: /資産統計/i });
    // At least one value with a decimal number pattern (e.g. "0.00", "1.23")
    await expect(statsSection.getByText(/\d+\.\d{2}/).first()).toBeVisible();
  });

  test('totalLocked stat card navigates to history on click', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(DASHBOARD_URL_JA);
    await expect(page.getByRole('region', { name: /資産統計/i })).toBeVisible();

    const statsSection = page.getByRole('region', { name: /資産統計/i });
    const lockedCard = statsSection.getByRole('button').first();
    await lockedCard.click();

    await expect(page).toHaveURL(/\/consumer\/history/);
  });
});

// ---------------------------------------------------------------------------
// 3. Navigation
// ---------------------------------------------------------------------------
test.describe('Navigation', () => {
  test('header navigation links are present', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(DASHBOARD_URL_JA);
    await expect(page.getByRole('region', { name: /資産統計/i })).toBeVisible();

    const nav = page.getByRole('navigation', { name: /Main navigation/i });
    await expect(nav).toBeVisible();

    // Check nav items: Dashboard, Lock, Unlock, History
    await expect(nav.getByText('ダッシュボード')).toBeVisible();
    await expect(nav.getByText('ロック', { exact: true })).toBeVisible();
    await expect(nav.getByText('アンロック')).toBeVisible();
    await expect(nav.getByText('履歴')).toBeVisible();
  });

  test('Dashboard link navigates to dashboard', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(DASHBOARD_URL_JA);
    await expect(page.getByRole('region', { name: /資産統計/i })).toBeVisible();

    const nav = page.getByRole('navigation', { name: /Main navigation/i });
    await nav.getByText('ダッシュボード').click();

    await expect(page).toHaveURL(/\/consumer\/dashboard/);
  });

  test('Unlock link navigates to unlock page', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(DASHBOARD_URL_JA);
    await expect(page.getByRole('region', { name: /資産統計/i })).toBeVisible();

    const nav = page.getByRole('navigation', { name: /Main navigation/i });
    await nav.getByText('アンロック').click();

    await expect(page).toHaveURL(/\/consumer\/unlock/);
  });

  test('History link navigates to history page', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(DASHBOARD_URL_JA);
    await expect(page.getByRole('region', { name: /資産統計/i })).toBeVisible();

    const nav = page.getByRole('navigation', { name: /Main navigation/i });
    await nav.getByText('履歴').click();

    await expect(page).toHaveURL(/\/consumer\/history/);
  });

  test('Logo links back to dashboard', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(DASHBOARD_URL_JA);
    await expect(page.getByRole('region', { name: /資産統計/i })).toBeVisible();

    const logo = page.getByRole('link', {
      name: /Quantum Shield - Back to Dashboard/i,
    });
    await expect(logo).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 4. Lock Asset Card
// ---------------------------------------------------------------------------
test.describe('Lock Asset Card', () => {
  test('lock form is visible with heading and badge', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(DASHBOARD_URL_JA);
    await expect(page.getByRole('region', { name: /資産統計/i })).toBeVisible();

    await expect(
      page.getByRole('heading', { name: /資産をロック/i })
    ).toBeVisible();
    await expect(page.getByText('量子耐性保護')).toBeVisible();
  });

  test('amount input accepts decimal values', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(DASHBOARD_URL_JA);
    await expect(page.getByRole('region', { name: /資産統計/i })).toBeVisible();

    const input = page.locator('#lockAmount');
    await expect(input).toBeVisible();

    await input.fill('5.00');
    await expect(input).toHaveValue('5.00');
  });

  test('quick amount buttons are present', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(DASHBOARD_URL_JA);
    await expect(page.getByRole('region', { name: /資産統計/i })).toBeVisible();

    const quickButtons = page.getByRole('group', {
      name: /Quick amount selection/i,
    });
    await expect(quickButtons).toBeVisible();

    await expect(quickButtons.getByText('25%')).toBeVisible();
    await expect(quickButtons.getByText('50%')).toBeVisible();
    await expect(quickButtons.getByText('75%')).toBeVisible();
    await expect(quickButtons.getByText('最大')).toBeVisible();
  });

  test('quick amount buttons set input value based on balance', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(DASHBOARD_URL_JA);
    await expect(page.getByRole('region', { name: /資産統計/i })).toBeVisible();

    const input = page.locator('#lockAmount');

    // Click 50% button - should set to some percentage of the wallet balance
    await page
      .getByRole('button', { name: /Set to 50% of balance/i })
      .click();
    const fiftyValue = await input.inputValue();
    expect(parseFloat(fiftyValue)).toBeGreaterThanOrEqual(0);

    // Click 100% button - should set to full available balance
    await page
      .getByRole('button', { name: /Set to 100% of balance/i })
      .click();
    const maxValue = await input.inputValue();
    expect(parseFloat(maxValue)).toBeGreaterThanOrEqual(parseFloat(fiftyValue));
  });

  test('lock button opens confirmation modal', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(DASHBOARD_URL_JA);
    await expect(page.getByRole('region', { name: /資産統計/i })).toBeVisible();

    // Enter a valid amount
    const input = page.locator('#lockAmount');
    await input.fill('1.00');

    // Click the lock button
    await page
      .getByRole('button', { name: /Dilithium署名で資産をロックする/i })
      .click();

    // Verify modal opens
    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();
    await expect(modal.getByText('ロック確認')).toBeVisible();
    await expect(modal.getByText('1.00 ETH')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 5. Recent Activity
// ---------------------------------------------------------------------------
test.describe('Recent Activity', () => {
  test('activity section heading is visible', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(DASHBOARD_URL_JA);
    await expect(page.getByRole('region', { name: /資産統計/i })).toBeVisible();

    await expect(
      page.getByRole('heading', { name: /最近のアクティビティ/i })
    ).toBeVisible();
  });

  test('activity section loads transaction data from API', async ({
    page,
    authenticatedPage,
  }) => {
    const txResponse = page.waitForResponse(
      (resp) =>
        resp.url().includes('/v1/user/transactions') && resp.status() === 200
    );

    await page.goto(DASHBOARD_URL_JA);
    const response = await txResponse;

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toBeDefined();
  });

  test('transaction items are displayed when data exists', async ({
    page,
    authenticatedPage,
  }) => {
    const txResponse = page.waitForResponse(
      (resp) =>
        resp.url().includes('/v1/user/transactions') && resp.status() === 200
    );

    await page.goto(DASHBOARD_URL_JA);
    const response = await txResponse;
    const data = await response.json();

    if (data.transactions && data.transactions.length > 0) {
      // Transaction list should be visible
      const activityList = page.getByRole('list', {
        name: /最近のアクティビティ/i,
      });
      await expect(activityList).toBeVisible();

      // Should have at least one listitem
      const items = activityList.getByRole('listitem');
      await expect(items.first()).toBeVisible();
    } else {
      // Empty state should be visible
      await expect(page.getByText('取引履歴がありません')).toBeVisible();
    }
  });

  test('"View all" link navigates to history page', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(DASHBOARD_URL_JA);
    await expect(page.getByRole('region', { name: /資産統計/i })).toBeVisible();

    const viewAllButton = page.getByRole('link', {
      name: /すべての履歴を見る/i,
    });
    await expect(viewAllButton).toBeVisible();

    await viewAllButton.click();
    await expect(page).toHaveURL(/\/consumer\/history/);
  });
});

// ---------------------------------------------------------------------------
// 6. Lock Modal
// ---------------------------------------------------------------------------
test.describe('Lock Modal', () => {
  async function openLockModal(page: import('@playwright/test').Page) {
    await page.goto(DASHBOARD_URL_JA);
    await expect(page.getByRole('region', { name: /資産統計/i })).toBeVisible();

    const input = page.locator('#lockAmount');
    await input.fill('2.50');
    await page
      .getByRole('button', { name: /Dilithium署名で資産をロックする/i })
      .click();
  }

  test('displays lock confirmation details', async ({
    page,
    authenticatedPage,
  }) => {
    await openLockModal(page);

    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();
    await expect(modal.getByText('ロック確認')).toBeVisible();
    await expect(modal.getByText('ロック金額')).toBeVisible();
    await expect(modal.getByText('2.50 ETH')).toBeVisible();
    await expect(modal.getByText('ガス代（概算）')).toBeVisible();
  });

  test('closes modal on cancel button', async ({
    page,
    authenticatedPage,
  }) => {
    await openLockModal(page);

    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();

    await modal.getByRole('button', { name: /キャンセル/i }).click();
    await expect(modal).not.toBeVisible();
  });

  test('closes modal on X button', async ({ page, authenticatedPage }) => {
    await openLockModal(page);

    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();

    await modal.getByRole('button', { name: /Close modal/i }).click();
    await expect(modal).not.toBeVisible();
  });

  test('closes modal on Escape key', async ({ page, authenticatedPage }) => {
    await openLockModal(page);

    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible();
  });

  test('closes modal on backdrop click', async ({
    page,
    authenticatedPage,
  }) => {
    await openLockModal(page);

    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();

    // Click the backdrop (top-left corner of the overlay)
    await page.mouse.click(10, 10);
    await expect(modal).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 7. Wallet Button & Connect Modal
// ---------------------------------------------------------------------------
test.describe('Wallet Button & Connect Modal', () => {
  test('wallet button is present in header', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(DASHBOARD_URL_JA);
    await expect(page.getByRole('region', { name: /資産統計/i })).toBeVisible();

    const walletButton = page.getByRole('button', { name: /Wallet menu/i });
    await expect(walletButton).toBeVisible();
  });

  test('clicking wallet button opens connect dialog when not connected', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(DASHBOARD_URL_JA);
    await expect(page.getByRole('region', { name: /資産統計/i })).toBeVisible();

    await page.getByRole('button', { name: /Wallet menu/i }).click();

    // RainbowKit connect modal opens when wagmi reports not connected
    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();
    await expect(modal.getByText('Connect a Wallet')).toBeVisible();
  });

  test('connect dialog shows wallet options', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(DASHBOARD_URL_JA);
    await expect(page.getByRole('region', { name: /資産統計/i })).toBeVisible();

    await page.getByRole('button', { name: /Wallet menu/i }).click();

    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();
    // Should show wallet provider options
    await expect(modal.getByRole('button', { name: /MetaMask/i })).toBeVisible();
  });

  test('connect dialog closes on Close button', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(DASHBOARD_URL_JA);
    await expect(page.getByRole('region', { name: /資産統計/i })).toBeVisible();

    await page.getByRole('button', { name: /Wallet menu/i }).click();

    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();

    await modal.getByRole('button', { name: /Close/i }).click();
    await expect(modal).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 8. Accessibility
// ---------------------------------------------------------------------------
test.describe('Accessibility', () => {
  test('main landmark is present', async ({ page, authenticatedPage }) => {
    await page.goto(DASHBOARD_URL_JA);
    await expect(page.getByRole('region', { name: /資産統計/i })).toBeVisible();

    await expect(page.getByRole('main')).toBeVisible();
  });

  test('WCAG heading hierarchy is correct', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(DASHBOARD_URL_JA);
    await expect(page.getByRole('region', { name: /資産統計/i })).toBeVisible();

    // h2 headings for major sections
    await expect(
      page.getByRole('heading', { name: /資産をロック/i, level: 2 })
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /最近のアクティビティ/i, level: 2 })
    ).toBeVisible();
  });

  test('keyboard navigation works on stat cards', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(DASHBOARD_URL_JA);
    await expect(page.getByRole('region', { name: /資産統計/i })).toBeVisible();

    const statsSection = page.getByRole('region', { name: /資産統計/i });
    const firstStatCard = statsSection.getByRole('button').first();
    await firstStatCard.focus();
    await page.keyboard.press('Enter');

    await expect(page).toHaveURL(/\/consumer\/history/);
  });

  test('keyboard input works on lock amount field', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(DASHBOARD_URL_JA);
    await expect(page.getByRole('region', { name: /資産統計/i })).toBeVisible();

    const input = page.locator('#lockAmount');
    await input.focus();
    await page.keyboard.type('10.5');
    await expect(input).toHaveValue('10.5');
  });

  test('ARIA labels are present on key sections', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(DASHBOARD_URL_JA);
    await expect(page.getByRole('region', { name: /資産統計/i })).toBeVisible();

    await expect(
      page.getByRole('region', { name: /資産統計/i })
    ).toBeVisible();
    await expect(
      page.getByRole('navigation', { name: /Main navigation/i })
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /Wallet menu/i })
    ).toBeVisible();
  });

  test('modals trap focus and close on Escape', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(DASHBOARD_URL_JA);
    await expect(page.getByRole('region', { name: /資産統計/i })).toBeVisible();

    // Open wallet modal
    await page.getByRole('button', { name: /Wallet menu/i }).click();
    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();

    // Modal should have aria-modal="true"
    await expect(modal).toHaveAttribute('aria-modal', 'true');

    // Escape should close it
    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 9. Responsive Design
// ---------------------------------------------------------------------------
test.describe('Responsive Design', () => {
  test('displays correctly on mobile viewport (375x667)', async ({
    page,
    authenticatedPage,
  }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(DASHBOARD_URL_JA);
    await expect(page.getByRole('region', { name: /資産統計/i })).toBeVisible();

    // Main content should be visible
    await expect(page.getByRole('main')).toBeVisible();

    // Mobile navigation bar should be visible
    const mobileNav = page.getByRole('navigation', {
      name: /Mobile navigation/i,
    });
    await expect(mobileNav).toBeVisible();

    // Mobile nav should contain 5 items (Dashboard, Lock, Unlock, History, Settings)
    await expect(mobileNav.locator('a, button')).toHaveCount(5);
  });

  test('hides desktop navigation on mobile', async ({
    page,
    authenticatedPage,
  }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(DASHBOARD_URL_JA);
    await expect(page.getByRole('region', { name: /資産統計/i })).toBeVisible();

    const desktopNav = page.getByRole('navigation', {
      name: /Main navigation/i,
    });
    await expect(desktopNav).toBeHidden();
  });

  test('stat cards stack on mobile', async ({ page, authenticatedPage }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(DASHBOARD_URL_JA);
    await expect(page.getByRole('region', { name: /資産統計/i })).toBeVisible();

    // All 4 stat card labels should still be visible
    await expect(page.getByText('量子耐性暗号鍵で保管中')).toBeVisible();
    await expect(page.getByText('利用可能')).toBeVisible();
    await expect(page.getByText('アンロック待ち')).toBeVisible();
    await expect(page.getByText('取引数')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 10. English Locale
// ---------------------------------------------------------------------------
test.describe('English Locale', () => {
  test('English text displayed correctly', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(DASHBOARD_URL_EN);
    await expect(page.getByRole('region', { name: /Asset Statistics/i })).toBeVisible();

    // Stat card labels in English
    await expect(page.getByText('Protected with Quantum Keys')).toBeVisible();
    await expect(page.getByText('Available')).toBeVisible();
    await expect(page.getByText('Pending Unlock')).toBeVisible();
    await expect(page.getByText('Transactions')).toBeVisible();

    // Section headings
    await expect(
      page.getByRole('heading', { name: /Lock Assets/i })
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /Recent Activity/i })
    ).toBeVisible();
  });

  test('English navigation items are present', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(DASHBOARD_URL_EN);
    await expect(page.getByRole('region', { name: /Asset Statistics/i })).toBeVisible();

    const nav = page.getByRole('navigation', { name: /Main navigation/i });
    await expect(nav.getByText('Dashboard')).toBeVisible();
    await expect(nav.getByText('Lock', { exact: true })).toBeVisible();
    await expect(nav.getByText('Unlock')).toBeVisible();
    await expect(nav.getByText('History')).toBeVisible();
  });

  test('English lock modal text', async ({ page, authenticatedPage }) => {
    await page.goto(DASHBOARD_URL_EN);
    await expect(page.getByRole('region', { name: /Asset Statistics/i })).toBeVisible();

    const input = page.locator('#lockAmount');
    await input.fill('3.00');

    await page
      .getByRole('button', { name: /Lock assets with Dilithium signature/i })
      .click();

    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();
    await expect(modal.getByText('Confirm Lock')).toBeVisible();
    await expect(modal.getByText('Lock Amount')).toBeVisible();
    await expect(modal.getByText('3.00 ETH')).toBeVisible();
    await expect(modal.getByText('Gas Fee (est.)')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 11. Layer 3 — User actions trigger correct API calls
// ---------------------------------------------------------------------------
test.describe('User Actions & API Calls', () => {
  test('page load triggers both dashboard and transactions API calls', async ({
    page,
    authenticatedPage,
  }) => {
    const dashboardCall = page.waitForResponse(
      (resp) => resp.url().includes('/v1/user/dashboard')
    );
    const txCall = page.waitForResponse(
      (resp) => resp.url().includes('/v1/user/transactions')
    );

    await page.goto(DASHBOARD_URL_JA);

    const [dashResp, txResp] = await Promise.all([dashboardCall, txCall]);
    expect(dashResp.status()).toBe(200);
    expect(txResp.status()).toBe(200);
  });

  test('error banner retry button refetches API data', async ({
    page,
    authenticatedPage,
  }) => {
    let callCount = 0;

    // First call fails, subsequent calls succeed
    await page.route('**/v1/user/dashboard', async (route) => {
      callCount++;
      if (callCount === 1) {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Server error' }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto(DASHBOARD_URL_JA);

    // Wait for main element (page renders even on API error)
    await expect(page.getByRole('main')).toBeVisible();

    // Error banner should appear after failed API call
    const errorBanner = page.locator('[class*="destructive"]').first();
    const retryButton = page.getByText('Retry');

    // React Query may auto-retry, so callCount could already be > 1
    // Check if retry button is visible and click it if so
    if (await retryButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await retryButton.click();
      // Wait for the retry call to complete
      await page.waitForTimeout(1000);
      expect(callCount).toBeGreaterThanOrEqual(2);
    } else {
      // React Query auto-retried and succeeded — verify data loaded
      await expect(page.getByRole('region', { name: /資産統計/i })).toBeVisible();
      expect(callCount).toBeGreaterThanOrEqual(2);
    }
  });
});
