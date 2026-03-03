import { test, expect } from '../fixtures';

test.describe('Prover Portal - Exit Request', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/prover/exit');
  });

  test('should display exit page with sidebar and main content', async ({ page }) => {
    // Sidebar should be visible
    await expect(page.getByText('Quantum Shield')).toBeVisible();
    await expect(page.getByText('Prover Portal')).toBeVisible();

    // Navigation should be visible
    await expect(page.getByRole('link', { name: /Dashboard|ダッシュボード/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Exit|終了/i })).toBeVisible();
  });

  test('should display page title and description', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Prover Exit.*Request|Prover Exit申請/i })).toBeVisible();
  });

  test('should display tab navigation', async ({ page }) => {
    await expect(page.getByRole('tab', { name: /Request|申請/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Complete|完了/i })).toBeVisible();
  });

  test('should have Request tab selected by default', async ({ page }) => {
    const requestTab = page.getByRole('tab', { name: /Request|申請/i });
    await expect(requestTab).toHaveAttribute('aria-selected', 'true');
  });

  test('should display warning banner', async ({ page }) => {
    await expect(page.getByText(/Pre-Exit Checklist|Exit前の確認事項/i)).toBeVisible();
    await expect(page.getByText(/Lock Period|ロック期間/i)).toBeVisible();
    await expect(page.getByText(/Pending Requests|保留中のリクエスト/i)).toBeVisible();
    await expect(page.getByText(/Unresolved Challenges|未解決のチャレンジ/i)).toBeVisible();
    await expect(page.getByText(/Rewards|報酬/i)).toBeVisible();
  });

  test('should display exit summary', async ({ page }) => {
    await expect(page.getByText(/Exit Overview|Exit概要/i)).toBeVisible();

    // Current Stake
    await expect(page.getByText(/Current Stake|現在のステーク/i)).toBeVisible();

    // Unclaimed Rewards
    await expect(page.getByText(/Unclaimed Rewards|未請求の報酬/i)).toBeVisible();

    // Unlock Date
    await expect(page.getByText(/Unlock Date|ロック解除日/i)).toBeVisible();
  });

  test('should display timeline', async ({ page }) => {
    await expect(page.getByText(/Exit Processing Timeline|Exit処理タイムライン/i)).toBeVisible();

    // Timeline steps
    await expect(page.getByText(/Exit Request|Exit申請/i).first()).toBeVisible();
    await expect(page.getByText(/Queue Complete|キュー完了/i)).toBeVisible();
    await expect(page.getByText(/Cooling Period|クーリング期間/i)).toBeVisible();
    await expect(page.getByText(/Stake Return|ステーク返還/i)).toBeVisible();
  });

  test('should display early exit penalty warning', async ({ page }) => {
    await expect(page.getByText(/Early Exit Penalty|早期Exitペナルティ/i)).toBeVisible();
    await expect(page.getByText(/Penalty Rate|ペナルティ率/i)).toBeVisible();
  });

  test('should display exit form', async ({ page }) => {
    await expect(page.getByText(/Exit Request Form|Exit申請フォーム/i)).toBeVisible();

    // Reason select
    await expect(page.getByRole('combobox', { name: /Exit Reason|退出理由/i })).toBeVisible();

    // Comment textarea
    await expect(page.getByRole('textbox', { name: /Comment|コメント/i })).toBeVisible();

    // Return address
    await expect(page.getByText(/Return Address|ステーク返還先アドレス/i)).toBeVisible();
    await expect(page.getByText(/Verified|検証済み/i)).toBeVisible();
  });

  test('should display confirmation checkboxes', async ({ page }) => {
    const checkboxes = page.locator('input[type="checkbox"]');
    const count = await checkboxes.count();
    expect(count).toBe(3);
  });

  test('should have submit button disabled by default', async ({ page }) => {
    const submitButton = page.getByRole('button', { name: /Submit Exit Request|Exit申請を提出/i });
    await expect(submitButton).toBeDisabled();
  });

  test('should enable submit button when all checkboxes are checked', async ({ page }) => {
    const checkboxes = page.locator('input[type="checkbox"]');
    const count = await checkboxes.count();

    for (let i = 0; i < count; i++) {
      await checkboxes.nth(i).check();
    }

    const submitButton = page.getByRole('button', { name: /Submit Exit Request|Exit申請を提出/i });
    await expect(submitButton).toBeEnabled();
  });

  test('should display cancel button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Cancel|キャンセル/i })).toBeVisible();
  });

  test('should switch to Complete tab', async ({ page }) => {
    await page.getByRole('tab', { name: /Complete|完了/i }).click();

    // Complete tab should be selected
    const completeTab = page.getByRole('tab', { name: /Complete|完了/i });
    await expect(completeTab).toHaveAttribute('aria-selected', 'true');
  });

  test('should display exit complete content', async ({ page }) => {
    await page.getByRole('tab', { name: /Complete|完了/i }).click();

    // Exit complete title
    await expect(page.getByRole('heading', { name: /Exit Complete|Exit完了/i })).toBeVisible();

    // Summary detail labels
    await expect(page.getByText(/Prover ID|Prover ID/i)).toBeVisible();
    await expect(page.getByText(/Activity Period|活動期間/i)).toBeVisible();
    await expect(page.getByText(/Stake Returned|返還されたステーク/i)).toBeVisible();
    await expect(page.getByText(/Total Rewards|累計報酬/i)).toBeVisible();
    await expect(page.getByText(/Signatures Processed|処理した署名数/i)).toBeVisible();
  });

  test('should display thank you message', async ({ page }) => {
    await page.getByRole('tab', { name: /Complete|完了/i }).click();

    await expect(page.getByText(/Thank you.*Quantum Shield|Quantum Shieldをご利用いただきありがとうございました/i)).toBeVisible();
  });

  test('should display back to home button', async ({ page }) => {
    await page.getByRole('tab', { name: /Complete|完了/i }).click();

    await expect(page.getByRole('link', { name: /Back to Home|ホームに戻る/i })).toBeVisible();
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

  test('should have accessible form controls', async ({ page }) => {
    // Select should have label
    const select = page.getByRole('combobox');
    await expect(select).toBeVisible();

    // Textarea should have label
    const textarea = page.getByRole('textbox');
    await expect(textarea).toBeVisible();
  });
});

test.describe('Prover Portal - Exit - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should display on mobile', async ({ page }) => {
    await page.goto('/prover/exit');

    // Main content should be visible
    await expect(page.getByRole('heading', { name: /Prover Exit.*Request|Prover Exit申請/i })).toBeVisible();
  });
});

test.describe('Prover Portal - Exit - i18n', () => {
  test('should display Japanese content', async ({ page }) => {
    await page.goto('/ja/prover/exit');

    await expect(page.locator('html')).toHaveAttribute('lang', 'ja');
    await expect(page.getByText('Prover Exit申請')).toBeVisible();
    await expect(page.getByText('Exit前の確認事項')).toBeVisible();
  });

  test('should display English content', async ({ page }) => {
    await page.goto('/en/prover/exit');

    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByText('Prover Exit Request')).toBeVisible();
    await expect(page.getByText('Pre-Exit Checklist')).toBeVisible();
  });

  test('should display exit summary in Japanese', async ({ page }) => {
    await page.goto('/ja/prover/exit');

    await expect(page.getByText('Exit概要')).toBeVisible();
    await expect(page.getByText('現在のステーク')).toBeVisible();
    await expect(page.getByText('未請求の報酬')).toBeVisible();
  });

  test('should display exit summary in English', async ({ page }) => {
    await page.goto('/en/prover/exit');

    await expect(page.getByText('Exit Overview')).toBeVisible();
    await expect(page.getByText('Current Stake')).toBeVisible();
    await expect(page.getByText('Unclaimed Rewards')).toBeVisible();
  });

  test('should display complete tab in Japanese', async ({ page }) => {
    await page.goto('/ja/prover/exit');
    await page.getByRole('tab', { name: /完了/i }).click();

    await expect(page.getByRole('heading', { name: 'Exit完了' })).toBeVisible();
    await expect(page.getByText('Quantum Shieldをご利用いただきありがとうございました')).toBeVisible();
  });

  test('should display complete tab in English', async ({ page }) => {
    await page.goto('/en/prover/exit');
    await page.getByRole('tab', { name: /Complete/i }).click();

    await expect(page.getByRole('heading', { name: 'Exit Complete' })).toBeVisible();
    await expect(page.getByText('Thank you for using Quantum Shield')).toBeVisible();
  });
});
