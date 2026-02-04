import { test, expect } from '@playwright/test';

test.describe('Explorer Analytics Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/explorer/analytics');
  });

  test('should display the page header', async ({ page }) => {
    await expect(page.locator('h1:has-text("プロトコル分析")')).toBeVisible();
  });

  test('should display time range selector', async ({ page }) => {
    await expect(page.locator('text=期間:')).toBeVisible();
    await expect(page.locator('button:has-text("7日")')).toBeVisible();
    await expect(page.locator('button:has-text("30日")')).toBeVisible();
    await expect(page.locator('button:has-text("90日")')).toBeVisible();
    await expect(page.locator('button:has-text("1年")')).toBeVisible();
    await expect(page.locator('button:has-text("全期間")')).toBeVisible();
  });

  test('should change time range on click', async ({ page }) => {
    const button30d = page.locator('button:has-text("30日")');
    await button30d.click();
    await expect(button30d).toHaveAttribute('aria-pressed', 'true');
  });

  test('should display export button', async ({ page }) => {
    await expect(page.locator('button:has-text("データをエクスポート")')).toBeVisible();
  });

  test('should display key statistics', async ({ page }) => {
    // TVL
    await expect(page.locator('text=15,234.5')).toBeVisible();
    await expect(page.locator('text=現在のTVL')).toBeVisible();

    // Total locks/unlocks
    await expect(page.locator('text=8,234')).toBeVisible();
    await expect(page.locator('text=累計Lock数')).toBeVisible();

    await expect(page.locator('text=7,891')).toBeVisible();
    await expect(page.locator('text=累計Unlock数')).toBeVisible();

    // Success rate
    await expect(page.locator('text=98.2%')).toBeVisible();
    await expect(page.locator('text=成功率')).toBeVisible();
  });

  test('should display TVL chart', async ({ page }) => {
    await expect(page.locator('text=TVL推移').first()).toBeVisible();
    await expect(page.locator('[role="img"][aria-label="TVL推移"]')).toBeVisible();
  });

  test('should display volume chart', async ({ page }) => {
    await expect(page.locator('text=取引量')).toBeVisible();
    await expect(page.locator('[role="img"][aria-label="日次取引量"]')).toBeVisible();
  });

  test('should display lock status distribution', async ({ page }) => {
    await expect(page.locator('text=Lockステータス別')).toBeVisible();
    await expect(page.locator('text=アクティブ').first()).toBeVisible();
    await expect(page.locator('text=Unlock中').first()).toBeVisible();
    await expect(page.locator('text=Unlock済み').first()).toBeVisible();
  });

  test('should display unlock type distribution', async ({ page }) => {
    await expect(page.locator('text=Unlockタイプ別')).toBeVisible();
    await expect(page.locator('text=通常').first()).toBeVisible();
    await expect(page.locator('text=緊急').first()).toBeVisible();
  });

  test('should display challenge rate', async ({ page }) => {
    await expect(page.locator('text=Challenge発生率')).toBeVisible();
    await expect(page.locator('text=1.8%')).toBeVisible();
    await expect(page.locator('text=解決済み')).toBeVisible();
    await expect(page.locator('text=係争中')).toBeVisible();
  });

  test('should display prover performance summary', async ({ page }) => {
    await expect(page.locator('text=Prover稼働状況')).toBeVisible();
    await expect(page.locator('text=稼働率').first()).toBeVisible();
  });

  test('should display prover performance table', async ({ page }) => {
    await expect(page.locator('text=Prover稼働率')).toBeVisible();
    await expect(page.locator('text=Prover Alpha')).toBeVisible();
    await expect(page.locator('text=Prover Beta')).toBeVisible();
    await expect(page.locator('text=99.9%').first()).toBeVisible();
  });

  test('should have tooltips for technical terms', async ({ page }) => {
    // TVL tooltip
    const tvlTooltip = page.locator('h2:has-text("TVL推移") button').first();
    await tvlTooltip.hover();
    await expect(page.locator('text=Total Value Locked（総ロック額）')).toBeVisible();

    // Success rate tooltip
    const successTooltip = page.locator('text=成功率').locator('..').locator('button').first();
    await successTooltip.hover();
    await expect(page.locator('text=Challenge無しで完了したUnlockの割合')).toBeVisible();
  });

  test('should navigate to prover page from table', async ({ page }) => {
    await page.locator('a:has-text("Prover Alpha")').click();
    await expect(page).toHaveURL(/\/ja\/explorer\/provers/);
  });

  test('should display navigation', async ({ page }) => {
    await expect(page.locator('nav[role="navigation"]')).toBeVisible();
    await expect(page.locator('nav[role="navigation"] >> text=概要')).toBeVisible();
    await expect(page.locator('nav[role="navigation"] >> text=Lock')).toBeVisible();
    await expect(page.locator('nav[role="navigation"] >> text=分析')).toBeVisible();
  });

  test('should have Analytics tab as current page', async ({ page }) => {
    const analyticsLink = page.locator('nav[role="navigation"] a[aria-current="page"]');
    await expect(analyticsLink).toHaveText('分析');
  });

  test('should display in English when navigating to /en', async ({ page }) => {
    await page.goto('/en/explorer/analytics');

    await expect(page.locator('h1:has-text("Protocol Analytics")')).toBeVisible();
    await expect(page.locator('text=Time Range:')).toBeVisible();
    await expect(page.locator('text=7 Days')).toBeVisible();
    await expect(page.locator('text=Total Locks')).toBeVisible();
    await expect(page.locator('text=Success Rate')).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Key content should still be visible
    await expect(page.locator('h1:has-text("プロトコル分析")')).toBeVisible();
    await expect(page.locator('text=現在のTVL')).toBeVisible();
    await expect(page.locator('text=累計Lock数')).toBeVisible();
  });

  test('should have proper ARIA attributes', async ({ page }) => {
    // Navigation
    await expect(page.locator('nav[role="navigation"][aria-label="Explorer navigation"]')).toBeVisible();

    // Charts have role img
    await expect(page.locator('[role="img"]').first()).toBeVisible();

    // Table has aria-label
    await expect(page.locator('table[aria-label="Prover稼働率"]')).toBeVisible();

    // Time range buttons have aria-pressed
    const activeButton = page.locator('button[aria-pressed="true"]');
    await expect(activeButton).toBeVisible();
  });

  test('should be keyboard navigable', async ({ page }) => {
    // Tab to time range and change selection
    const button30d = page.locator('button:has-text("30日")');
    await button30d.focus();
    await page.keyboard.press('Enter');
    await expect(button30d).toHaveAttribute('aria-pressed', 'true');
  });
});
