import { test, expect } from '../fixtures';

test.describe('Prover Portal - Challenge Response', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/prover/challenges');
  });

  test('should display challenge page with sidebar and main content', async ({ page }) => {
    // Sidebar should be visible
    await expect(page.getByText('Quantum Shield')).toBeVisible();
    await expect(page.getByText('Prover Portal')).toBeVisible();

    // Navigation should be visible
    await expect(page.getByRole('link', { name: /Dashboard|ダッシュボード/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Challenges|チャレンジ/i })).toBeVisible();
  });

  test('should display page title', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Challenge.*Response|チャレンジ対応/i })).toBeVisible();
  });

  test('should display tab navigation', async ({ page }) => {
    await expect(page.getByRole('tab', { name: /Notification|通知/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Defense|弁明/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Result|結果/i })).toBeVisible();
  });

  test('should have Notification tab selected by default', async ({ page }) => {
    const notificationTab = page.getByRole('tab', { name: /Notification|通知/i });
    await expect(notificationTab).toHaveAttribute('aria-selected', 'true');
  });

  test('should display active challenge notification', async ({ page }) => {
    // Challenge notification should be visible
    await expect(page.getByText(/Challenge Notification|チャレンジ通知/i)).toBeVisible();
    await expect(page.getByText('CHG-2026-000123')).toBeVisible();
  });

  test('should display countdown timer', async ({ page }) => {
    await expect(page.getByText(/Defense Deadline|弁明期限/i)).toBeVisible();
    // Timer should be visible with format HH:MM:SS
    await expect(page.locator('[aria-live="polite"]')).toBeVisible();
  });

  test('should display challenge details', async ({ page }) => {
    // Applicant
    await expect(page.getByText(/Applicant|申立人/i)).toBeVisible();
    await expect(page.getByText('Watcher #W-0042')).toBeVisible();

    // Violation type
    await expect(page.getByText(/Violation Type|違反種類/i)).toBeVisible();
    await expect(page.getByText(/Invalid Signature|無効な署名/i)).toBeVisible();

    // Potential slashing
    await expect(page.getByText(/Potential Slashing|潜在的Slashing/i)).toBeVisible();
    await expect(page.getByText('$40,000')).toBeVisible();
  });

  test('should display accusation content', async ({ page }) => {
    await expect(page.getByText(/Accusation Content|申立内容/i)).toBeVisible();
    await expect(page.getByText(/REQ-789012/i)).toBeVisible();
  });

  test('should display attached evidence files', async ({ page }) => {
    await expect(page.getByText(/Attached Evidence|添付証拠/i)).toBeVisible();
    await expect(page.getByText('signature_log_REQ-789012.json')).toBeVisible();
    await expect(page.getByText('watcher_verification_report.pdf')).toBeVisible();
  });

  test('should display download buttons for evidence', async ({ page }) => {
    const downloadButtons = page.getByRole('button', { name: /Download|ダウンロード/i });
    const count = await downloadButtons.count();
    expect(count).toBe(2);
  });

  test('should display action buttons', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Submit Defense|弁明を提出/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /View Guidelines|ガイドライン/i })).toBeVisible();
  });

  test('should switch to Defense tab', async ({ page }) => {
    await page.getByRole('tab', { name: /Defense|弁明/i }).click();

    // Defense tab should be selected
    const defenseTab = page.getByRole('tab', { name: /Defense|弁明/i });
    await expect(defenseTab).toHaveAttribute('aria-selected', 'true');

    // Defense form should be visible
    await expect(page.getByText(/Submit Defense Statement|弁明書の提出/i)).toBeVisible();
  });

  test('should display defense form elements', async ({ page }) => {
    await page.getByRole('tab', { name: /Defense|弁明/i }).click();

    // Textarea
    await expect(page.getByRole('textbox', { name: /Defense Content|弁明内容/i })).toBeVisible();

    // File upload
    await expect(page.getByText(/Upload Evidence|証拠のアップロード/i)).toBeVisible();

    // Submit button
    await expect(page.getByRole('button', { name: /^Submit|弁明を提出$/i }).first()).toBeVisible();
  });

  test('should display uploaded files list', async ({ page }) => {
    await page.getByRole('tab', { name: /Defense|弁明/i }).click();

    await expect(page.getByText('server_logs_20260117.json')).toBeVisible();
    await expect(page.getByText('signature_generation_trace.txt')).toBeVisible();
  });

  test('should display warning message on defense tab', async ({ page }) => {
    await page.getByRole('tab', { name: /Defense|弁明/i }).click();

    await expect(page.getByText(/cannot be modified|変更できません/i)).toBeVisible();
  });

  test('should switch to Result tab', async ({ page }) => {
    await page.getByRole('tab', { name: /Result|結果/i }).click();

    // Result tab should be selected
    const resultTab = page.getByRole('tab', { name: /Result|結果/i });
    await expect(resultTab).toHaveAttribute('aria-selected', 'true');
  });

  test('should display result card', async ({ page }) => {
    await page.getByRole('tab', { name: /Result|結果/i }).click();

    // Result status
    await expect(page.getByText(/Challenge Dismissed|チャレンジ棄却/i)).toBeVisible();
    await expect(page.getByText(/Dismissed.*Won|棄却.*勝訴/i)).toBeVisible();
    await expect(page.getByText('$0').first()).toBeVisible();
  });

  test('should display challenge history table', async ({ page }) => {
    await page.getByRole('tab', { name: /Result|結果/i }).click();

    await expect(page.getByText(/Challenge History|チャレンジ履歴/i)).toBeVisible();

    // Table headers
    await expect(page.getByRole('columnheader', { name: /Challenge ID|チャレンジID/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /Date|日時/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /Violation Type|違反種類/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /Result|結果/i })).toBeVisible();
  });

  test('should display challenge history data', async ({ page }) => {
    await page.getByRole('tab', { name: /Result|結果/i }).click();

    await expect(page.getByText('CHG-2026-000123')).toBeVisible();
    await expect(page.getByText('CHG-2026-000122')).toBeVisible();
    await expect(page.getByText('CHG-2026-000098')).toBeVisible();
  });

  test('should display back to dashboard button', async ({ page }) => {
    await page.getByRole('tab', { name: /Result|結果/i }).click();

    await expect(page.getByRole('link', { name: /Back to Dashboard|ダッシュボードに戻る/i })).toBeVisible();
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
    expect(tabCount).toBe(3);
  });

  test('should have accessible table structure', async ({ page }) => {
    await page.getByRole('tab', { name: /Result|結果/i }).click();

    const table = page.locator('[role="grid"]');
    await expect(table).toBeVisible();
    await expect(table).toHaveAttribute('aria-label');
  });
});

test.describe('Prover Portal - Challenge - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should display on mobile', async ({ page }) => {
    await page.goto('/prover/challenges');

    // Main content should be visible
    await expect(page.getByRole('heading', { name: /Challenge.*Response|チャレンジ対応/i })).toBeVisible();
  });
});

test.describe('Prover Portal - Challenge - i18n', () => {
  test('should display Japanese content', async ({ page }) => {
    await page.goto('/ja/prover/challenges');

    await expect(page.locator('html')).toHaveAttribute('lang', 'ja');
    await expect(page.getByText('チャレンジ対応')).toBeVisible();
    await expect(page.getByText('チャレンジ通知')).toBeVisible();
  });

  test('should display English content', async ({ page }) => {
    await page.goto('/en/prover/challenges');

    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByText('Challenge Response')).toBeVisible();
    await expect(page.getByText('Challenge Notification')).toBeVisible();
  });

  test('should display defense tab in Japanese', async ({ page }) => {
    await page.goto('/ja/prover/challenges');
    await page.getByRole('tab', { name: /弁明/i }).click();

    await expect(page.getByText('弁明書の提出')).toBeVisible();
    await expect(page.getByText('弁明内容')).toBeVisible();
  });

  test('should display defense tab in English', async ({ page }) => {
    await page.goto('/en/prover/challenges');
    await page.getByRole('tab', { name: /Defense/i }).click();

    await expect(page.getByText('Submit Defense Statement')).toBeVisible();
    await expect(page.getByText('Defense Content')).toBeVisible();
  });

  test('should display result tab in Japanese', async ({ page }) => {
    await page.goto('/ja/prover/challenges');
    await page.getByRole('tab', { name: /結果/i }).click();

    await expect(page.getByText('チャレンジ棄却')).toBeVisible();
    await expect(page.getByText('チャレンジ履歴')).toBeVisible();
  });

  test('should display result tab in English', async ({ page }) => {
    await page.goto('/en/prover/challenges');
    await page.getByRole('tab', { name: /Result/i }).click();

    await expect(page.getByText('Challenge Dismissed')).toBeVisible();
    await expect(page.getByText('Challenge History')).toBeVisible();
  });
});
