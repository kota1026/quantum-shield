/**
 * QS Admin Dashboard E2E Tests (Phase 8-E)
 *
 * ## Coverage
 * - Screen 01: Dashboard (qs-admin)
 * - Stats cards, navigation, charts
 *
 * ## BE Rules Compliance
 * - BE-001: Real API endpoints (no stubs)
 * - BE-002: No test-specific modifications
 * - BE-003: All API calls logged
 */

import { test, expect } from '../fixtures/admin-auth';

test.describe('QS Admin Dashboard - Phase 8', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/qs-admin/dashboard');
  });

  test.describe('Page Load & Layout', () => {
    test('should load dashboard page', async ({ page, apiLogs }) => {
      // Wait for dashboard to load - Japanese: ダッシュボード (use heading to avoid multiple matches)
      await expect(page.getByRole('heading', { name: 'ダッシュボード' })).toBeVisible();
      await expect(page.getByText('Quantum Shield Foundation 管理概要')).toBeVisible();

      // Check main elements
      await expect(page.getByRole('navigation')).toBeVisible();

      console.log(`[TEST LOG] Dashboard loaded, API calls: ${apiLogs.length}`);
    });

    test('should display stats cards with data', async ({ page }) => {
      // Stats cards - Japanese text
      await expect(page.getByText('総ユーザー数')).toBeVisible();
      await expect(page.getByText('総ロック額')).toBeVisible();
      await expect(page.getByText('アクティブProver')).toBeVisible();
      await expect(page.getByText('アクティブObserver')).toBeVisible();
      await expect(page.getByText('アンロック待ち')).toBeVisible();
      await expect(page.getByText('トレジャリー残高')).toBeVisible();

      // Values should be displayed - check for specific ETH value
      await expect(page.getByText(/ETH/).first()).toBeVisible();
    });

    test('should display TVL chart', async ({ page }) => {
      // TVL chart section
      await expect(page.getByText(/TVL推移|Total Value Locked/)).toBeVisible();
    });

    test('should display transaction count chart', async ({ page }) => {
      // Transaction chart section
      await expect(page.getByText('トランザクション件数推移')).toBeVisible();
    });
  });

  test.describe('Sidebar Navigation', () => {
    test('should display sidebar with QS Admin branding', async ({ page }) => {
      await expect(page.getByText('QS Admin')).toBeVisible();
      await expect(page.getByText('Foundation Console')).toBeVisible();
    });

    test('should display main navigation sections', async ({ page }) => {
      // Main sections
      await expect(page.getByText('メイン')).toBeVisible();
      await expect(page.getByText('オペレーション')).toBeVisible();
      await expect(page.getByText('ネットワーク')).toBeVisible();
      await expect(page.getByText('ファイナンス')).toBeVisible();
    });

    test('should display user info', async ({ page }) => {
      await expect(page.getByText('管理者')).toBeVisible();
      await expect(page.getByText('Superadmin')).toBeVisible();
    });

    test('should display Transactions menu', async ({ page }) => {
      // トランザクション is a menu item (may be button or link)
      await expect(page.getByText('トランザクション').first()).toBeVisible();
    });

    test('should display Prover menu', async ({ page }) => {
      // Prover link should be visible
      await expect(page.getByText('Prover').first()).toBeVisible();
    });

    test('should display Observer menu', async ({ page }) => {
      // Observer link should be visible
      await expect(page.getByText('Observer').first()).toBeVisible();
    });

    test('should navigate to Treasury', async ({ page }) => {
      const treasuryLink = page.getByText('トレジャリー').first();
      await treasuryLink.click();
      // Should expand submenu or navigate
    });
  });

  test.describe('Tabs', () => {
    test('should display overview and stats tabs', async ({ page }) => {
      // Tabs are buttons
      await expect(page.getByRole('button', { name: '概要' })).toBeVisible();
      await expect(page.getByRole('button', { name: '統計' })).toBeVisible();
    });

    test('should switch to stats tab', async ({ page }) => {
      const statsTab = page.getByText('統計').first();
      await statsTab.click();
      // Stats content should be visible
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper heading structure', async ({ page }) => {
      // Main title should be visible (use heading role)
      await expect(page.getByRole('heading', { name: 'ダッシュボード' })).toBeVisible();
    });

    test('should have interactive elements', async ({ page }) => {
      // Check that interactive elements exist
      const links = page.getByRole('link');
      await expect(links.first()).toBeVisible();
    });
  });

  test.describe('Search', () => {
    test('should display search input', async ({ page }) => {
      const searchInput = page.getByPlaceholder(/検索|Search/);
      await expect(searchInput).toBeVisible();
    });
  });
});
