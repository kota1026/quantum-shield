import { test, expect } from '../fixtures';

test.describe('Prover Portal - Metrics & Rewards', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/prover/metrics');
  });

  test('should display metrics page with sidebar and main content', async ({ page }) => {
    // Sidebar should be visible
    await expect(page.getByText('Quantum Shield')).toBeVisible();
    await expect(page.getByText('Prover Portal')).toBeVisible();

    // Navigation should be visible
    await expect(page.getByRole('link', { name: /Dashboard|ダッシュボード/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Metrics|メトリクス/i })).toBeVisible();
  });

  test('should display page title', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Performance.*Rewards|パフォーマンス.*報酬/i })).toBeVisible();
  });

  test('should display period selector and export button', async ({ page }) => {
    await expect(page.locator('select')).toBeVisible();
    await expect(page.getByRole('button', { name: /Export|CSV出力/i })).toBeVisible();
  });

  test('should display tab navigation', async ({ page }) => {
    await expect(page.getByRole('tab', { name: /Performance|パフォーマンス/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Rewards|報酬/i })).toBeVisible();
  });

  test('should have Performance tab selected by default', async ({ page }) => {
    const performanceTab = page.getByRole('tab', { name: /Performance|パフォーマンス/i });
    await expect(performanceTab).toHaveAttribute('aria-selected', 'true');
  });

  test('should display performance stats cards', async ({ page }) => {
    // Uptime
    await expect(page.getByText(/Uptime|アップタイム/i)).toBeVisible();

    // Signatures Completed
    await expect(page.getByText(/Signatures Completed|署名完了数/i)).toBeVisible();

    // Average Latency
    await expect(page.getByText(/Average Latency|平均レイテンシ/i)).toBeVisible();

    // Violations
    await expect(page.getByText(/Violations|違反/i)).toBeVisible();
  });

  test('should display performance chart', async ({ page }) => {
    await expect(page.getByText(/Signature Processing Performance|署名処理パフォーマンス/i)).toBeVisible();
  });

  test('should display signature history table', async ({ page }) => {
    await expect(page.getByText(/Signature Processing History|署名処理履歴/i)).toBeVisible();

    // Table headers
    await expect(page.getByRole('columnheader', { name: /Date|日付/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /Count|署名数/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /Success Rate|成功率/i })).toBeVisible();
  });

  test('should display detailed metrics', async ({ page }) => {
    await expect(page.getByText(/Detailed Metrics|詳細メトリクス/i)).toBeVisible();
    await expect(page.getByText(/SPHINCS\+/i)).toBeVisible();
    await expect(page.getByText(/SLA/i)).toBeVisible();
  });

  test('should have accessible progress bars', async ({ page }) => {
    const progressBars = page.locator('[role="progressbar"]');
    const count = await progressBars.count();
    expect(count).toBeGreaterThan(0);

    // Check first progress bar has proper aria attributes
    const firstProgressBar = progressBars.first();
    await expect(firstProgressBar).toHaveAttribute('aria-valuenow');
    await expect(firstProgressBar).toHaveAttribute('aria-valuemin', '0');
    await expect(firstProgressBar).toHaveAttribute('aria-valuemax', '100');
  });

  test('should switch to Rewards tab', async ({ page }) => {
    await page.getByRole('tab', { name: /Rewards|報酬/i }).click();

    // Rewards tab should be selected
    const rewardsTab = page.getByRole('tab', { name: /Rewards|報酬/i });
    await expect(rewardsTab).toHaveAttribute('aria-selected', 'true');
  });

  test('should display rewards summary on Rewards tab', async ({ page }) => {
    await page.getByRole('tab', { name: /Rewards|報酬/i }).click();

    await expect(page.getByRole('button', { name: /Withdraw|引き出す/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Reinvest|再投資/i })).toBeVisible();
  });

  test('should display rewards breakdown on Rewards tab', async ({ page }) => {
    await page.getByRole('tab', { name: /Rewards|報酬/i }).click();

    await expect(page.getByText(/Rewards Breakdown|報酬内訳/i)).toBeVisible();
    await expect(page.getByText(/Signature Rewards|署名報酬/i)).toBeVisible();
    await expect(page.getByText(/Performance Bonus|パフォーマンスボーナス/i)).toBeVisible();
  });

  test('should display withdrawal history on Rewards tab', async ({ page }) => {
    await page.getByRole('tab', { name: /Rewards|報酬/i }).click();

    await expect(page.getByText(/Withdrawal History|引き出し履歴/i)).toBeVisible();
    await expect(page.getByText(/Completed|完了/i).first()).toBeVisible();
  });

  test('should change period selection', async ({ page }) => {
    const select = page.locator('select');
    await select.selectOption('7d');
    await expect(select).toHaveValue('7d');
  });

  test('should display prover status in sidebar', async ({ page }) => {
    await expect(page.getByText(/Prover #|Prover/i).first()).toBeVisible();
  });

  test('should have skip link', async ({ page }) => {
    const skipLink = page.getByText('Skip to main content');
    await skipLink.focus();
    await expect(skipLink).toBeVisible();
  });

  test('should pass accessibility checks', async ({ page, a11y }) => {
    const accessibilityScanResults = await a11y.analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have accessible tab structure', async ({ page }) => {
    const tablist = page.locator('[role="tablist"]');
    await expect(tablist).toBeVisible();
    await expect(tablist).toHaveAttribute('aria-label');

    const tabs = page.locator('[role="tab"]');
    const tabCount = await tabs.count();
    expect(tabCount).toBe(2);
  });
});

test.describe('Prover Portal - Metrics - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should display on mobile', async ({ page }) => {
    await page.goto('/prover/metrics');

    // Main content should be visible
    await expect(page.getByRole('heading', { name: /Performance.*Rewards|パフォーマンス.*報酬/i })).toBeVisible();
  });
});

test.describe('Prover Portal - Metrics - i18n', () => {
  test('should display Japanese content', async ({ page }) => {
    await page.goto('/ja/prover/metrics');

    await expect(page.locator('html')).toHaveAttribute('lang', 'ja');
    await expect(page.getByText('パフォーマンス & 報酬')).toBeVisible();
    await expect(page.getByText('アップタイム')).toBeVisible();
  });

  test('should display English content', async ({ page }) => {
    await page.goto('/en/prover/metrics');

    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByText('Performance & Rewards')).toBeVisible();
    await expect(page.getByText('Uptime')).toBeVisible();
  });
});
