import { test, expect } from '../fixtures';

test.describe('Prover Portal - Alerts & Stake Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/prover/alerts');
  });

  test('should display alerts page with sidebar and main content', async ({ page }) => {
    // Sidebar should be visible
    await expect(page.getByText('Quantum Shield')).toBeVisible();
    await expect(page.getByText('Prover Portal')).toBeVisible();

    // Navigation should be visible
    await expect(page.getByRole('link', { name: /Dashboard|ダッシュボード/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Alerts|アラート/i })).toBeVisible();
  });

  test('should display page title', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Alerts.*Stake|アラート.*ステーク/i })).toBeVisible();
  });

  test('should display tab navigation', async ({ page }) => {
    await expect(page.getByRole('tab', { name: /Alerts|アラート/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Stake|ステーク/i })).toBeVisible();
  });

  test('should have Alerts tab selected by default', async ({ page }) => {
    const alertsTab = page.getByRole('tab', { name: /Alerts|アラート/i }).first();
    await expect(alertsTab).toHaveAttribute('aria-selected', 'true');
  });

  test('should display alert filter buttons', async ({ page }) => {
    await expect(page.getByRole('button', { name: /All|すべて/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Critical|緊急/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Warning|警告/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Info|情報/i })).toBeVisible();
  });

  test('should filter alerts by clicking filter buttons', async ({ page }) => {
    // Click Critical filter
    await page.getByRole('button', { name: /Critical|緊急/i }).click();

    // Should show only critical alert
    await expect(page.getByText(/Signature Timeout|署名タイムアウト/i)).toBeVisible();
  });

  test('should display alert cards with severity indicators', async ({ page }) => {
    // Critical alert
    await expect(page.getByText(/Signature Timeout|署名タイムアウト/i)).toBeVisible();

    // Warning alert
    await expect(page.getByText(/System Resource|システムリソース/i)).toBeVisible();

    // Info alert (resolved)
    await expect(page.getByText(/Maintenance Complete|メンテナンス完了/i)).toBeVisible();
  });

  test('should display alert action buttons', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Handle Now|今すぐ対応/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /View Details|詳細を確認/i }).first()).toBeVisible();
  });

  test('should switch to Stake Management tab', async ({ page }) => {
    await page.getByRole('tab', { name: /Stake|ステーク/i }).click();

    // Stake tab should be selected
    const stakeTab = page.getByRole('tab', { name: /Stake|ステーク/i });
    await expect(stakeTab).toHaveAttribute('aria-selected', 'true');

    // Stake content should be visible
    await expect(page.getByText('$400,000')).toBeVisible();
  });

  test('should display stake overview cards', async ({ page }) => {
    await page.getByRole('tab', { name: /Stake|ステーク/i }).click();

    // Stake amount
    await expect(page.getByText(/Current Stake|現在のステーク額/i)).toBeVisible();
    await expect(page.getByText('$400,000')).toBeVisible();

    // Unlock date
    await expect(page.getByText(/Unlock Date|ロック解除日/i)).toBeVisible();

    // Total rewards
    await expect(page.getByText(/Total Rewards|累計報酬/i)).toBeVisible();
    await expect(page.getByText('$47,520')).toBeVisible();

    // Total slashing
    await expect(page.getByText(/Total Slashing|累計Slashing/i)).toBeVisible();
  });

  test('should display risk meter', async ({ page }) => {
    await page.getByRole('tab', { name: /Stake|ステーク/i }).click();

    await expect(page.getByText(/Risk Meter|リスクメーター/i)).toBeVisible();

    // Risk labels
    await expect(page.getByText(/Low Risk|低リスク/i)).toBeVisible();
    await expect(page.getByText(/Medium Risk|中リスク/i)).toBeVisible();
    await expect(page.getByText(/High Risk|高リスク/i)).toBeVisible();
  });

  test('should have accessible progress bar for risk meter', async ({ page }) => {
    await page.getByRole('tab', { name: /Stake|ステーク/i }).click();

    const riskMeter = page.locator('[role="progressbar"]').first();
    await expect(riskMeter).toBeVisible();
    await expect(riskMeter).toHaveAttribute('aria-valuenow');
    await expect(riskMeter).toHaveAttribute('aria-valuemin', '0');
    await expect(riskMeter).toHaveAttribute('aria-valuemax', '100');
  });

  test('should display risk details', async ({ page }) => {
    await page.getByRole('tab', { name: /Stake|ステーク/i }).click();

    await expect(page.getByText(/Violations.*30|違反.*30/i)).toBeVisible();
    await expect(page.getByText(/SLA.*Rate|SLA達成率/i)).toBeVisible();
    await expect(page.getByText(/Potential Slashing|潜在的Slashing/i)).toBeVisible();
  });

  test('should display quadratic slashing warning', async ({ page }) => {
    await page.getByRole('tab', { name: /Stake|ステーク/i }).click();

    await expect(page.getByText(/Quadratic Slashing/i)).toBeVisible();
    await expect(page.getByText(/N² × 10%/i)).toBeVisible();
  });

  test('should display slashing table', async ({ page }) => {
    await page.getByRole('tab', { name: /Stake|ステーク/i }).click();

    // Table headers
    await expect(page.getByRole('columnheader', { name: /Violations|違反/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /Rate|Slashing率/i })).toBeVisible();

    // Table data
    await expect(page.getByText('10%')).toBeVisible();
    await expect(page.getByText('40%')).toBeVisible();
    await expect(page.getByText('90%')).toBeVisible();
    await expect(page.getByText('100%')).toBeVisible();
  });

  test('should display stake action cards', async ({ page }) => {
    await page.getByRole('tab', { name: /Stake|ステーク/i }).click();

    // Add Stake
    await expect(page.getByText(/Add Stake|ステーク追加/i).first()).toBeVisible();

    // Withdraw Rewards
    await expect(page.getByText(/Withdraw Rewards|報酬引き出し/i).first()).toBeVisible();

    // Exit Request
    await expect(page.getByText(/Exit Request|Exit申請/i).first()).toBeVisible();
  });

  test('should display prover status in sidebar', async ({ page }) => {
    await expect(page.getByText('Prover #047')).toBeVisible();
    await expect(page.getByText(/Tier 1.*Active/i)).toBeVisible();
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

  test('should have accessible filter buttons', async ({ page }) => {
    const filterButtons = page.locator('[aria-pressed]');
    const buttonCount = await filterButtons.count();
    expect(buttonCount).toBeGreaterThan(0);
  });

  test('should navigate to exit page from stake actions', async ({ page }) => {
    await page.getByRole('tab', { name: /Stake|ステーク/i }).click();

    // Click the exit button link
    await page.getByRole('link', { name: /Exit.*Request|Exit申請/i }).click();

    // Should navigate to exit page
    await expect(page).toHaveURL(/\/prover\/exit/);
  });
});

test.describe('Prover Portal - Alerts - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should display on mobile', async ({ page }) => {
    await page.goto('/prover/alerts');

    // Main content should be visible
    await expect(page.getByRole('heading', { name: /Alerts.*Stake|アラート.*ステーク/i })).toBeVisible();
  });
});

test.describe('Prover Portal - Alerts - i18n', () => {
  test('should display Japanese content', async ({ page }) => {
    await page.goto('/ja/prover/alerts');

    await expect(page.locator('html')).toHaveAttribute('lang', 'ja');
    await expect(page.getByText('アラート & ステーク管理')).toBeVisible();
    await expect(page.getByText('緊急')).toBeVisible();
  });

  test('should display English content', async ({ page }) => {
    await page.goto('/en/prover/alerts');

    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByText('Alerts & Stake Management')).toBeVisible();
    await expect(page.getByText('Critical')).toBeVisible();
  });

  test('should display stake management in Japanese', async ({ page }) => {
    await page.goto('/ja/prover/alerts');
    await page.getByRole('tab', { name: /ステーク/i }).click();

    await expect(page.getByText('現在のステーク額')).toBeVisible();
    await expect(page.getByText('リスクメーター')).toBeVisible();
  });

  test('should display stake management in English', async ({ page }) => {
    await page.goto('/en/prover/alerts');
    await page.getByRole('tab', { name: /Stake/i }).click();

    await expect(page.getByText('Current Stake')).toBeVisible();
    await expect(page.getByText('Risk Meter')).toBeVisible();
  });
});
