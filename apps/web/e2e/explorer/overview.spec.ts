import { test, expect } from '@playwright/test';

test.describe('Explorer Overview Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/explorer/overview');
  });

  test('should display the page title and logo', async ({ page }) => {
    // Logo
    await expect(page.locator('text=Quantum Shield')).toBeVisible();
    await expect(page.locator('text=Explorer')).toBeVisible();
  });

  test('should display navigation tabs', async ({ page }) => {
    const nav = page.locator('nav[aria-label="Explorer navigation"]');
    await expect(nav).toBeVisible();

    // Check all navigation items
    await expect(nav.locator('text=概要')).toBeVisible();
    await expect(nav.locator('text=Lock')).toBeVisible();
    await expect(nav.locator('text=Unlock')).toBeVisible();
    await expect(nav.locator('text=Challenge')).toBeVisible();
    await expect(nav.locator('text=Prover')).toBeVisible();
    await expect(nav.locator('text=分析')).toBeVisible();
  });

  test('should display search input', async ({ page }) => {
    const searchInput = page.locator('input[aria-label="検索"]');
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toHaveAttribute(
      'placeholder',
      'アドレス、TX Hash、Lock IDで検索...'
    );
  });

  test('should display stats cards', async ({ page }) => {
    // Check stats section
    const statsSection = page.locator('section[aria-label="プロトコル統計"]');
    await expect(statsSection).toBeVisible();

    // Check individual stats
    await expect(page.locator('text=総ロック量 (TVL)')).toBeVisible();
    await expect(page.locator('text=総Lock数')).toBeVisible();
    await expect(page.locator('text=保留中のUnlock')).toBeVisible();
    await expect(page.locator('text=アクティブProver')).toBeVisible();
  });

  test('should display recent locks table', async ({ page }) => {
    const recentLocksSection = page.locator('section[aria-label="最近のLock一覧"]');
    await expect(recentLocksSection).toBeVisible();

    // Check table headers
    await expect(recentLocksSection.locator('th:has-text("Lock ID")')).toBeVisible();
    await expect(recentLocksSection.locator('th:has-text("金額")')).toBeVisible();
    await expect(recentLocksSection.locator('th:has-text("ステータス")')).toBeVisible();
    await expect(recentLocksSection.locator('th:has-text("時間")')).toBeVisible();

    // Check table has rows
    const rows = recentLocksSection.locator('tbody tr');
    await expect(rows).toHaveCount(5);
  });

  test('should display recent unlocks table', async ({ page }) => {
    const recentUnlocksSection = page.locator('section[aria-label="最近のUnlock一覧"]');
    await expect(recentUnlocksSection).toBeVisible();

    // Check table headers
    await expect(recentUnlocksSection.locator('th:has-text("Unlock ID")')).toBeVisible();
    await expect(recentUnlocksSection.locator('th:has-text("種類")')).toBeVisible();
    await expect(recentUnlocksSection.locator('th:has-text("ステータス")')).toBeVisible();
    await expect(recentUnlocksSection.locator('th:has-text("Time Lock")')).toBeVisible();

    // Check live indicator
    await expect(recentUnlocksSection.locator('text=ライブ')).toBeVisible();
  });

  test('should display active challenges table', async ({ page }) => {
    const challengesSection = page.locator('section[aria-label="アクティブなChallenge一覧"]');
    await expect(challengesSection).toBeVisible();

    // Check table headers
    await expect(challengesSection.locator('th:has-text("Challenge ID")')).toBeVisible();
    await expect(challengesSection.locator('th:has-text("対象Unlock")')).toBeVisible();
    await expect(challengesSection.locator('th:has-text("Challenger")')).toBeVisible();
    await expect(challengesSection.locator('th:has-text("Bond")')).toBeVisible();
    await expect(challengesSection.locator('th:has-text("防御期限")')).toBeVisible();
    await expect(challengesSection.locator('th:has-text("ステータス")')).toBeVisible();
  });

  test('should navigate to locks page when clicking View All', async ({ page }) => {
    const viewAllLink = page.locator('section[aria-label="最近のLock一覧"] a:has-text("すべて見る")');
    await viewAllLink.click();
    await expect(page).toHaveURL(/\/ja\/explorer\/locks/);
  });

  test('should search when submitting search form', async ({ page }) => {
    const searchInput = page.locator('input[aria-label="検索"]');
    await searchInput.fill('0x1234');
    await searchInput.press('Enter');
    await expect(page).toHaveURL(/\/ja\/explorer\/search\?q=0x1234/);
  });

  test('should be accessible via keyboard navigation', async ({ page }) => {
    // Tab to search input
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    const searchInput = page.locator('input[aria-label="検索"]');
    await expect(searchInput).toBeFocused();

    // Tab through navigation
    await page.keyboard.press('Tab');
    const firstNavItem = page.locator('nav[aria-label="Explorer navigation"] a').first();
    await expect(firstNavItem).toBeFocused();

    // Tab to table rows
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Navigate through table
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
  });

  test('should display in English when navigating to /en', async ({ page }) => {
    await page.goto('/en/explorer/overview');

    // Check English labels
    await expect(page.locator('text=Total Value Locked')).toBeVisible();
    await expect(page.locator('text=Total Locks')).toBeVisible();
    await expect(page.locator('text=Pending Unlocks')).toBeVisible();
    await expect(page.locator('text=Active Provers')).toBeVisible();
    await expect(page.locator('text=Recent Locks')).toBeVisible();
    await expect(page.locator('text=Recent Unlocks')).toBeVisible();
    await expect(page.locator('text=Active Challenges')).toBeVisible();
  });

  test('should have proper ARIA labels for screen readers', async ({ page }) => {
    // Check aria-labels on sections
    await expect(page.locator('section[aria-label="プロトコル統計"]')).toBeVisible();
    await expect(page.locator('section[aria-label="最近のLock一覧"]')).toBeVisible();
    await expect(page.locator('section[aria-label="最近のUnlock一覧"]')).toBeVisible();
    await expect(page.locator('section[aria-label="アクティブなChallenge一覧"]')).toBeVisible();

    // Check aria-current on active nav
    const activeNav = page.locator('a[aria-current="page"]');
    await expect(activeNav).toHaveText('概要');
  });

  test('should display status badges with correct styling', async ({ page }) => {
    // Check for Active status badge
    const activeBadge = page.locator('.bg-gold\\/10.text-gold').first();
    await expect(activeBadge).toBeVisible();
    await expect(activeBadge).toContainText('アクティブ');

    // Check for Complete status badge
    const completeBadge = page.locator('.bg-success\\/10.text-success').first();
    await expect(completeBadge).toBeVisible();
    await expect(completeBadge).toContainText('完了');
  });

  test('should display ETH amounts correctly', async ({ page }) => {
    // Check for ETH unit display
    const ethAmounts = page.locator('text=ETH');
    await expect(ethAmounts.first()).toBeVisible();
  });
});
