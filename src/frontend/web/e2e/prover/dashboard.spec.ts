import { test, expect } from '../fixtures';

test.describe('Prover Portal - Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/prover/dashboard');
  });

  test('should display dashboard with sidebar and main content', async ({ page }) => {
    // Sidebar should be visible
    await expect(page.getByText('Quantum Shield')).toBeVisible();
    await expect(page.getByText('Prover Portal')).toBeVisible();

    // Navigation should be visible
    await expect(page.getByRole('link', { name: /Dashboard|ダッシュボード/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Signature Queue|署名キュー/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Metrics|メトリクス/i })).toBeVisible();
  });

  test('should display page title', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Operations Dashboard|運用ダッシュボード/i })).toBeVisible();
  });

  test('should display SLA alert banner', async ({ page }) => {
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByText(/SLA Warning|SLA警告/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /View Alerts|アラートを見る/i })).toBeVisible();
  });

  test('should display stats grid with 4 cards', async ({ page }) => {
    // Pending signatures
    await expect(page.getByText(/Pending Signatures|保留中の署名/i)).toBeVisible();
    await expect(page.getByText('12')).toBeVisible();

    // Today's processed
    await expect(page.getByText(/Today's Processed|本日の処理数/i)).toBeVisible();
    await expect(page.getByText('847')).toBeVisible();

    // Response time
    await expect(page.getByText(/Response Time|応答時間/i).first()).toBeVisible();

    // Uptime
    await expect(page.getByText(/Uptime|稼働率/i).first()).toBeVisible();
  });

  test('should display signature queue preview', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Signature Queue|署名キュー/i })).toBeVisible();
    await expect(page.getByText(/View All|すべて見る/i).first()).toBeVisible();

    // Queue items
    await expect(page.getByText(/Unlock Request|アンロックリクエスト/i).first()).toBeVisible();
    await expect(page.getByText('5.25 ETH')).toBeVisible();
  });

  test('should display performance overview', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Performance Overview|パフォーマンス概要/i })).toBeVisible();

    // Performance metrics
    await expect(page.getByText(/Success Rate|成功率/i)).toBeVisible();
    await expect(page.getByText(/HSM Health|HSMヘルス/i)).toBeVisible();
  });

  test('should display rewards card', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Rewards|報酬/i }).first()).toBeVisible();

    // Reward amounts
    await expect(page.getByText(/Claimable|請求可能/i)).toBeVisible();
    await expect(page.getByText('4.82 ETH')).toBeVisible();

    // Claim button
    await expect(page.getByRole('link', { name: /Claim.*ETH|ETHを請求/i })).toBeVisible();
  });

  test('should display stake info card', async ({ page }) => {
    await expect(page.getByText(/Your Stake|あなたのステーク/i)).toBeVisible();
    await expect(page.getByText('150.00 ETH')).toBeVisible();
    await expect(page.getByText(/No Slashing Risk|スラッシングリスクなし/i)).toBeVisible();
  });

  test('should display today summary', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Today's Summary|本日のサマリー/i })).toBeVisible();
    await expect(page.getByText(/Signatures|署名数/i)).toBeVisible();
    await expect(page.getByText(/Volume|ボリューム/i)).toBeVisible();
    await expect(page.getByText(/Fees Earned|獲得手数料/i)).toBeVisible();
    await expect(page.getByText(/Rank|ランク/i)).toBeVisible();
  });

  test('should display prover status in sidebar', async ({ page }) => {
    await expect(page.getByText('Prover #047')).toBeVisible();
    await expect(page.getByText(/Tier 1.*Active/i)).toBeVisible();
  });

  test('should have action buttons in header', async ({ page }) => {
    await expect(page.getByRole('link', { name: /View Metrics|メトリクスを見る/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Process Queue|キューを処理/i })).toBeVisible();
  });

  test('should navigate to queue page', async ({ page }) => {
    await page.getByRole('link', { name: /Process Queue|キューを処理/i }).click();
    await expect(page).toHaveURL(/\/prover\/queue/);
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

  test('should have accessible progress bars', async ({ page }) => {
    const progressBars = page.locator('[role="progressbar"]');
    const count = await progressBars.count();
    expect(count).toBeGreaterThan(0);

    // Check first progress bar has proper aria attributes
    const firstProgressBar = progressBars.first();
    await expect(firstProgressBar).toHaveAttribute('aria-valuenow');
    await expect(firstProgressBar).toHaveAttribute('aria-valuemin', '0');
  });
});

test.describe('Prover Portal - Dashboard - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should display on mobile (sidebar hidden or collapsed)', async ({ page }) => {
    await page.goto('/prover/dashboard');

    // Main content should be visible
    await expect(page.getByRole('heading', { name: /Operations Dashboard|運用ダッシュボード/i })).toBeVisible();
  });
});

test.describe('Prover Portal - Dashboard - i18n', () => {
  test('should display Japanese content', async ({ page }) => {
    await page.goto('/ja/prover/dashboard');

    await expect(page.locator('html')).toHaveAttribute('lang', 'ja');
    await expect(page.getByText('運用ダッシュボード')).toBeVisible();
    await expect(page.getByText('オペレーション')).toBeVisible();
  });

  test('should display English content', async ({ page }) => {
    await page.goto('/en/prover/dashboard');

    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByText('Operations Dashboard')).toBeVisible();
    await expect(page.getByText('Operations')).toBeVisible();
  });
});
