import { test, expect } from '@playwright/test';

test.describe('Explorer Analytics Page', () => {
  test.setTimeout(60000);

  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/explorer/analytics');
    // Wait for the page to be fully rendered
    await page.waitForSelector('h1', { timeout: 15000 });
  });

  test('should display the page header', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('プロトコル分析');
  });

  test('should display time range selector', async ({ page }) => {
    // The label is rendered as "期間:" (timeRange.label + ":")
    await expect(page.getByText('期間', { exact: false })).toBeVisible();
    await expect(page.getByRole('button', { name: '7日' })).toBeVisible();
    await expect(page.getByRole('button', { name: '30日' })).toBeVisible();
    await expect(page.getByRole('button', { name: '90日' })).toBeVisible();
    await expect(page.getByRole('button', { name: '1年' })).toBeVisible();
    await expect(page.getByRole('button', { name: '全期間' })).toBeVisible();
  });

  test('should change time range on click', async ({ page }) => {
    const button30d = page.getByRole('button', { name: '30日' });
    await button30d.click();
    await expect(button30d).toHaveAttribute('aria-pressed', 'true');
  });

  test('should display export button', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'データをエクスポート' })).toBeVisible();
  });

  test('should display key statistics labels', async ({ page }) => {
    // With fallback/empty data, verify the i18n labels are rendered (not hardcoded values)
    await expect(page.getByText('現在のTVL')).toBeVisible();
    await expect(page.getByText('累計Lock数')).toBeVisible();
    await expect(page.getByText('累計Unlock数')).toBeVisible();
    await expect(page.getByText('成功率')).toBeVisible();
    await expect(page.getByText('平均Lock金額')).toBeVisible();
    await expect(page.getByText('平均Lock期間')).toBeVisible();
  });

  test('should display section headings', async ({ page }) => {
    // TVL section heading
    await expect(page.getByText('TVL推移').first()).toBeVisible();
    // Volume section heading
    await expect(page.getByText('取引量').first()).toBeVisible();
  });

  test('should display TVL chart area', async ({ page }) => {
    // The chart container with role="img" is always rendered even with empty data
    const tvlChart = page.locator('[role="img"]').first();
    await expect(tvlChart).toBeVisible();
  });

  test('should display lock status distribution section', async ({ page }) => {
    await expect(page.getByText('Lockステータス別')).toBeVisible();
    // The status labels are always rendered from lockStatusData keys
    await expect(page.getByText('アクティブ').first()).toBeVisible();
    await expect(page.getByText('Unlock中').first()).toBeVisible();
    await expect(page.getByText('Unlock済み').first()).toBeVisible();
  });

  test('should display unlock type distribution section', async ({ page }) => {
    await expect(page.getByText('Unlockタイプ別')).toBeVisible();
    await expect(page.getByText('通常').first()).toBeVisible();
    await expect(page.getByText('緊急').first()).toBeVisible();
  });

  test('should display challenge rate section', async ({ page }) => {
    await expect(page.getByText('Challenge発生率')).toBeVisible();
    await expect(page.getByText('発生率')).toBeVisible();
    await expect(page.getByText('解決済み').first()).toBeVisible();
    await expect(page.getByText('係争中').first()).toBeVisible();
  });

  test('should display prover performance section', async ({ page }) => {
    await expect(page.getByText('Prover稼働状況')).toBeVisible();
    // The uptime label is always present in the summary card
    await expect(page.getByText('稼働率').first()).toBeVisible();
  });

  test('should display prover uptime table heading', async ({ page }) => {
    // The table heading is always rendered
    await expect(page.getByText('Prover稼働率')).toBeVisible();
    // Table exists (even if empty rows when no prover data)
    const table = page.locator('table');
    await expect(table).toBeVisible();
  });

  test('should display navigation', async ({ page }) => {
    const nav = page.locator('nav[role="navigation"]');
    await expect(nav).toBeVisible();
    await expect(nav.getByText('概要')).toBeVisible();
    await expect(nav.getByText('Lock')).toBeVisible();
    await expect(nav.getByText('分析')).toBeVisible();
  });

  test('should have Analytics tab as current page', async ({ page }) => {
    const analyticsLink = page.locator('nav[role="navigation"] a[aria-current="page"]');
    await expect(analyticsLink).toBeVisible();
    await expect(analyticsLink).toContainText('分析');
  });

  test('should display in English when navigating to /en', async ({ page }) => {
    await page.goto('/en/explorer/analytics');
    await page.waitForSelector('h1', { timeout: 15000 });

    await expect(page.locator('h1')).toContainText('Protocol Analytics');
    await expect(page.getByText('Time Range')).toBeVisible();
    await expect(page.getByRole('button', { name: '7 Days' })).toBeVisible();
    await expect(page.getByText('Total Locks')).toBeVisible();
    await expect(page.getByText('Success Rate')).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(300);

    // Key content should still be visible
    await expect(page.locator('h1')).toContainText('プロトコル分析');
    await expect(page.getByText('現在のTVL')).toBeVisible();
    await expect(page.getByText('累計Lock数')).toBeVisible();
  });

  test('should have proper ARIA attributes', async ({ page }) => {
    // Navigation with aria-label
    await expect(
      page.locator('nav[role="navigation"][aria-label="Explorer navigation"]')
    ).toBeVisible();

    // Time range buttons have aria-pressed
    const activeButton = page.locator('button[aria-pressed="true"]');
    await expect(activeButton).toBeVisible();

    // Chart areas have role="img"
    const chartAreas = page.locator('[role="img"]');
    const chartCount = await chartAreas.count();
    expect(chartCount).toBeGreaterThanOrEqual(1);

    // Table exists with proper structure
    const table = page.locator('table');
    await expect(table).toBeVisible();
    // Table has th elements with scope="col"
    const thCount = await page.locator('th[scope="col"]').count();
    expect(thCount).toBeGreaterThanOrEqual(1);
  });

  test('should be keyboard navigable', async ({ page }) => {
    // Tab to time range and change selection
    const button30d = page.getByRole('button', { name: '30日' });
    await button30d.focus();
    await page.keyboard.press('Enter');
    await expect(button30d).toHaveAttribute('aria-pressed', 'true');
  });

  test('should default to 7d time range', async ({ page }) => {
    const button7d = page.getByRole('button', { name: '7日' });
    await expect(button7d).toHaveAttribute('aria-pressed', 'true');
  });
});
