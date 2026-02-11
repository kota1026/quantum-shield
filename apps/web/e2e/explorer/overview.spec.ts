import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Explorer Overview Page', () => {
  test.setTimeout(60000);

  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/explorer/overview');
    await page.waitForLoadState('domcontentloaded');
    await page.locator('text=Quantum Shield').first().waitFor({ timeout: 15000 });
  });

  test('should display the page title and logo', async ({ page }) => {
    await expect(page.locator('text=Quantum Shield').first()).toBeVisible();
    await expect(page.locator('text=Explorer').first()).toBeVisible();
  });

  test('should display navigation tabs', async ({ page }) => {
    const nav = page.locator('nav[aria-label="Explorer navigation"]');
    await expect(nav).toBeVisible();

    await expect(nav.locator('text=概要')).toBeVisible();
    await expect(nav.locator('text=Lock').first()).toBeVisible();
    await expect(nav.locator('text=Unlock').first()).toBeVisible();
    await expect(nav.locator('text=Challenge').first()).toBeVisible();
    await expect(nav.locator('text=Prover').first()).toBeVisible();
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
    const statsSection = page.locator('section[aria-label="プロトコル統計"]');
    await expect(statsSection).toBeVisible();

    await expect(page.getByText('総ロック量 (TVL)')).toBeVisible();
    await expect(page.getByText('総Lock数')).toBeVisible();
    await expect(page.getByText('保留中のUnlock')).toBeVisible();
    await expect(page.getByText('アクティブProver')).toBeVisible();
  });

  test('should display recent locks section', async ({ page }) => {
    const recentLocksSection = page.locator('section[aria-label="最近のLock一覧"]');
    await expect(recentLocksSection).toBeVisible();

    // Table headers or empty state should be visible
    const hasTable = await recentLocksSection.locator('table').count() > 0;
    if (hasTable) {
      await expect(recentLocksSection.locator('th:has-text("Lock ID")')).toBeVisible();
      await expect(recentLocksSection.locator('th:has-text("金額")')).toBeVisible();
    } else {
      // Empty state
      await expect(recentLocksSection.getByText(/Lockがありません/)).toBeVisible();
    }
  });

  test('should display recent unlocks section', async ({ page }) => {
    const recentUnlocksSection = page.locator('section[aria-label="最近のUnlock一覧"]');
    await expect(recentUnlocksSection).toBeVisible();
  });

  test('should display active challenges section', async ({ page }) => {
    const challengesSection = page.locator('section[aria-label="アクティブなChallenge一覧"]');
    await expect(challengesSection).toBeVisible();
  });

  test('should navigate to locks page when clicking View All', async ({ page }) => {
    const viewAllLink = page.locator('section[aria-label="最近のLock一覧"]').getByText('すべて見る');
    await viewAllLink.click();
    await expect(page).toHaveURL(/\/ja\/explorer\/locks/, { timeout: 15000 });
  });

  test('should search when submitting search form', async ({ page }) => {
    const searchInput = page.locator('input[aria-label="検索"]');
    await searchInput.fill('0x1234');
    await searchInput.press('Enter');
    await expect(page).toHaveURL(/\/ja\/explorer\/search\?q=0x1234/, { timeout: 15000 });
  });

  test('should be keyboard navigable', async ({ page }) => {
    // Tab through interactive elements
    await page.keyboard.press('Tab');
    const focusedTag = await page.evaluate(() => document.activeElement?.tagName?.toLowerCase());
    expect(focusedTag).toBeDefined();
    expect(focusedTag).not.toBe('');
  });

  test('should display in English when navigating to /en', async ({ page }) => {
    await page.goto('/en/explorer/overview');
    await page.waitForLoadState('domcontentloaded');
    await page.locator('text=Quantum Shield').first().waitFor({ timeout: 15000 });

    await expect(page.getByText('Total Value Locked')).toBeVisible();
    await expect(page.getByText('Total Locks')).toBeVisible();
    await expect(page.getByText('Pending Unlocks')).toBeVisible();
    await expect(page.getByText('Active Provers')).toBeVisible();
    await expect(page.getByText('Recent Locks')).toBeVisible();
    await expect(page.getByText('Recent Unlocks')).toBeVisible();
    await expect(page.getByText('Active Challenges')).toBeVisible();
  });

  test('should have proper ARIA labels for screen readers', async ({ page }) => {
    await expect(page.locator('section[aria-label="プロトコル統計"]')).toBeVisible();
    await expect(page.locator('section[aria-label="最近のLock一覧"]')).toBeVisible();
    await expect(page.locator('section[aria-label="最近のUnlock一覧"]')).toBeVisible();
    await expect(page.locator('section[aria-label="アクティブなChallenge一覧"]')).toBeVisible();
  });

  test('should pass accessibility checks', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .exclude('[aria-hidden="true"]')
      .disableRules(['color-contrast'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
