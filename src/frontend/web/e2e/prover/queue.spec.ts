import { test, expect } from '../fixtures';

test.describe('Prover Portal - Signature Queue', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/prover/queue');
  });

  test('should display queue page with sidebar and main content', async ({ page }) => {
    // Sidebar should be visible
    await expect(page.getByText('Quantum Shield')).toBeVisible();
    await expect(page.getByText('Prover Portal')).toBeVisible();

    // Navigation should be visible
    await expect(page.getByRole('link', { name: /Dashboard|ダッシュボード/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Signature Queue|署名キュー/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Metrics|メトリクス/i })).toBeVisible();
  });

  test('should display page title', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Signature Queue|署名キュー/i })).toBeVisible();
  });

  test('should display stats row with 4 cards', async ({ page }) => {
    // Pending
    await expect(page.getByText(/Pending|保留中/i).first()).toBeVisible();
    await expect(page.getByText('12').first()).toBeVisible();

    // Urgent
    await expect(page.getByText(/Urgent|緊急/i).first()).toBeVisible();
    await expect(page.getByText('4').first()).toBeVisible();

    // Avg Wait
    await expect(page.getByText(/Avg Wait|平均待ち時間/i)).toBeVisible();
    await expect(page.getByText('4m 32s').first()).toBeVisible();

    // Today Processed
    await expect(page.getByText(/Today Processed|本日の処理数/i)).toBeVisible();
    await expect(page.getByText('847')).toBeVisible();
  });

  test('should display filter buttons', async ({ page }) => {
    await expect(page.getByRole('button', { name: /All.*12|すべて.*12/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Normal.*9|通常.*9/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Emergency.*3|緊急.*3/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Urgent.*4|緊急対応.*4/i })).toBeVisible();
  });

  test('should toggle filter buttons', async ({ page }) => {
    const allButton = page.getByRole('button', { name: /All.*12|すべて.*12/i });
    const normalButton = page.getByRole('button', { name: /Normal.*9|通常.*9/i });

    // All should be selected by default
    await expect(allButton).toHaveAttribute('aria-pressed', 'true');

    // Click Normal
    await normalButton.click();
    await expect(normalButton).toHaveAttribute('aria-pressed', 'true');
    await expect(allButton).toHaveAttribute('aria-pressed', 'false');
  });

  test('should display queue table with request rows', async ({ page }) => {
    // Table headers
    await expect(page.getByRole('columnheader', { name: /Request ID|リクエストID/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /Type|種類/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /User Address|ユーザーアドレス/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /Amount|金額/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /Wait Time|待ち時間/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /Action|アクション/i })).toBeVisible();

    // Request rows
    await expect(page.getByText('#UNL-78421')).toBeVisible();
    await expect(page.getByText('5.25 ETH')).toBeVisible();
    await expect(page.getByText('0x7a3f...9c2d')).toBeVisible();
  });

  test('should display request type badges', async ({ page }) => {
    // Unlock badges
    const unlockBadges = page.getByText(/Unlock|アンロック/i);
    await expect(unlockBadges.first()).toBeVisible();

    // Emergency badge
    await expect(page.getByText(/Emergency|緊急/i).first()).toBeVisible();
  });

  test('should display Sign buttons in each row', async ({ page }) => {
    const signButtons = page.getByRole('button', { name: /Sign|署名/i });
    const count = await signButtons.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should open request detail modal when clicking a row', async ({ page }) => {
    // Click the first row
    await page.getByText('#UNL-78421').click();

    // Modal should appear
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText(/Request Detail|リクエスト詳細/i)).toBeVisible();

    // Detail grid
    await expect(page.getByText(/Source Chain|ソースチェーン/i)).toBeVisible();
    await expect(page.getByText('L3 Aegis')).toBeVisible();
    await expect(page.getByText(/Destination|宛先チェーン/i)).toBeVisible();
    await expect(page.getByText('Ethereum L1')).toBeVisible();
  });

  test('should close detail modal with cancel button', async ({ page }) => {
    // Open modal
    await page.getByText('#UNL-78421').click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Click cancel
    await page.getByRole('button', { name: /Cancel|キャンセル/i }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('should close detail modal with X button', async ({ page }) => {
    // Open modal
    await page.getByText('#UNL-78421').click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Click close button
    await page.getByRole('button', { name: /Close|閉じる/i }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('should close modal with Escape key', async ({ page }) => {
    // Open modal
    await page.getByText('#UNL-78421').click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Press Escape
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('should open sign confirm modal from detail modal', async ({ page }) => {
    // Open detail modal
    await page.getByText('#UNL-78421').click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Click Sign with SPHINCS+
    await page.getByRole('button', { name: /Sign with SPHINCS\+|SPHINCS\+で署名/i }).click();

    // Sign confirm modal should appear
    await expect(page.getByText(/Confirm.*Signature|署名の確認/i)).toBeVisible();
    await expect(page.getByText('🔐')).toBeVisible();
  });

  test('should open sign confirm modal from Sign button in table', async ({ page }) => {
    // Click Sign button on first row
    const signButtons = page.getByRole('button', { name: /^Sign$|^署名$/i });
    await signButtons.first().click();

    // Sign confirm modal should appear
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText(/Confirm.*Signature|署名の確認/i)).toBeVisible();
  });

  test('should open batch sign modal', async ({ page }) => {
    // Click Sign All button
    await page.getByRole('button', { name: /Sign All|すべて署名/i }).click();

    // Batch modal should appear
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText(/Confirm Batch|一括署名の確認/i)).toBeVisible();
    await expect(page.getByText('✍️')).toBeVisible();
  });

  test('should display header action buttons', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Refresh|更新/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Sign All|すべて署名/i })).toBeVisible();
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

  test('should have accessible table structure', async ({ page }) => {
    const table = page.locator('table[role="grid"]');
    await expect(table).toBeVisible();
    await expect(table).toHaveAttribute('aria-label');
  });

  test('should navigate with keyboard in table', async ({ page }) => {
    // Tab to first table row
    const firstRow = page.locator('tbody tr').first();
    await firstRow.focus();
    await expect(firstRow).toBeFocused();

    // Press Enter to open modal
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog')).toBeVisible();
  });
});

test.describe('Prover Portal - Signature Queue - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should display on mobile', async ({ page }) => {
    await page.goto('/prover/queue');

    // Main content should be visible
    await expect(page.getByRole('heading', { name: /Signature Queue|署名キュー/i })).toBeVisible();
  });
});

test.describe('Prover Portal - Signature Queue - i18n', () => {
  test('should display Japanese content', async ({ page }) => {
    await page.goto('/ja/prover/queue');

    await expect(page.locator('html')).toHaveAttribute('lang', 'ja');
    await expect(page.getByText('署名キュー')).toBeVisible();
    await expect(page.getByText('保留中')).toBeVisible();
  });

  test('should display English content', async ({ page }) => {
    await page.goto('/en/prover/queue');

    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByText('Signature Queue')).toBeVisible();
    await expect(page.getByText('Pending')).toBeVisible();
  });
});
