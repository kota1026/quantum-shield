import { test, expect } from '../fixtures';

test.describe('Prover Portal - Application Status Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/prover/application-status');
  });

  test('should display status check form', async ({ page }) => {
    // Header should be visible
    await expect(page.getByRole('banner')).toBeVisible();
    await expect(page.getByText('Quantum Shield')).toBeVisible();

    // Page title should be visible
    await expect(page.getByRole('heading', { name: /Application Status|申請状況確認/i })).toBeVisible();

    // Search form should be visible
    await expect(page.getByLabel(/Application ID|申請ID/i)).toBeVisible();
    await expect(page.getByLabel(/Email|メールアドレス/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Check Status|状況を確認/i })).toBeVisible();
  });

  test('should have accessible form elements', async ({ page }) => {
    // Form inputs should have proper labels
    const applicationIdInput = page.getByLabel(/Application ID|申請ID/i);
    await expect(applicationIdInput).toHaveAttribute('type', 'text');

    const emailInput = page.getByLabel(/Email|メールアドレス/i);
    await expect(emailInput).toHaveAttribute('type', 'email');
  });

  test('should disable check button when form is empty', async ({ page }) => {
    const checkButton = page.getByRole('button', { name: /Check Status|状況を確認/i });
    await expect(checkButton).toBeDisabled();
  });

  test('should enable check button when form is filled', async ({ page }) => {
    await page.getByLabel(/Application ID|申請ID/i).fill('PRV-2026-001234');
    await page.getByLabel(/Email|メールアドレス/i).fill('test@example.com');

    const checkButton = page.getByRole('button', { name: /Check Status|状況を確認/i });
    await expect(checkButton).toBeEnabled();
  });

  test('should display status result after search', async ({ page }) => {
    // Fill form
    await page.getByLabel(/Application ID|申請ID/i).fill('PRV-2026-001234');
    await page.getByLabel(/Email|メールアドレス/i).fill('test@example.com');

    // Click check button
    await page.getByRole('button', { name: /Check Status|状況を確認/i }).click();

    // Status result should be visible
    await expect(page.getByText(/Under Review|審査中/i)).toBeVisible();

    // Timeline should be visible
    await expect(page.getByText(/Review Progress|審査進捗/i)).toBeVisible();
    await expect(page.getByText(/Application Received|申請受付完了/i)).toBeVisible();
    await expect(page.getByText(/Technical Review|技術審査/i)).toBeVisible();
  });

  test('should display application details in result', async ({ page }) => {
    // Search
    await page.getByLabel(/Application ID|申請ID/i).fill('PRV-2026-001234');
    await page.getByLabel(/Email|メールアドレス/i).fill('test@example.com');
    await page.getByRole('button', { name: /Check Status|状況を確認/i }).click();

    // Details should be visible
    await expect(page.getByText('PRV-2026-0001')).toBeVisible();
    await expect(page.getByText('Example Infrastructure Co.')).toBeVisible();
    await expect(page.getByText('Technical Review Team')).toBeVisible();
  });

  test('should display questions from reviewers', async ({ page }) => {
    // Search
    await page.getByLabel(/Application ID|申請ID/i).fill('PRV-2026-001234');
    await page.getByLabel(/Email|メールアドレス/i).fill('test@example.com');
    await page.getByRole('button', { name: /Check Status|状況を確認/i }).click();

    // Questions section should be visible
    await expect(page.getByText(/Questions from Review Team|審査チームからの質問/i)).toBeVisible();

    // Question badges should be visible
    await expect(page.getByText(/Needs Answer|要回答/i)).toBeVisible();
    await expect(page.getByText(/Answered|回答済み/i)).toBeVisible();
  });

  test('should allow answering pending questions', async ({ page }) => {
    // Search
    await page.getByLabel(/Application ID|申請ID/i).fill('PRV-2026-001234');
    await page.getByLabel(/Email|メールアドレス/i).fill('test@example.com');
    await page.getByRole('button', { name: /Check Status|状況を確認/i }).click();

    // Answer textarea should be visible
    const answerTextarea = page.getByPlaceholder(/Enter your response|回答を入力/i);
    await expect(answerTextarea).toBeVisible();

    // Submit button should be disabled initially
    const submitButton = page.getByRole('button', { name: /Submit Answer|回答を送信/i });
    await expect(submitButton).toBeDisabled();

    // Fill answer
    await answerTextarea.fill('Test answer for the question');
    await expect(submitButton).toBeEnabled();
  });

  test('should display back to search button', async ({ page }) => {
    // Search
    await page.getByLabel(/Application ID|申請ID/i).fill('PRV-2026-001234');
    await page.getByLabel(/Email|メールアドレス/i).fill('test@example.com');
    await page.getByRole('button', { name: /Check Status|状況を確認/i }).click();

    // Back to search button should be visible
    const backButton = page.getByRole('button', { name: /Back to Search|検索に戻る/i });
    await expect(backButton).toBeVisible();

    // Click back button
    await backButton.click();

    // Form should be visible again
    await expect(page.getByLabel(/Application ID|申請ID/i)).toBeVisible();
  });

  test('should display help section', async ({ page }) => {
    await expect(page.getByText(/Need Help|お困りですか/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /Email|メール/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Phone|電話/i })).toBeVisible();
  });

  test('should pass accessibility checks', async ({ page, a11y }) => {
    const accessibilityScanResults = await a11y.analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have skip link', async ({ page }) => {
    const skipLink = page.getByText('Skip to status content');
    await skipLink.focus();
    await expect(skipLink).toBeVisible();
  });

  test('should have back to overview link', async ({ page }) => {
    await expect(page.getByRole('link', { name: /Back to Overview|Overviewに戻る/i })).toBeVisible();
  });
});

test.describe('Prover Portal - Application Status Page - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should display correctly on mobile', async ({ page }) => {
    await page.goto('/prover/application-status');

    // Header should be visible
    await expect(page.getByText('Quantum Shield')).toBeVisible();

    // Form should be visible
    await expect(page.getByLabel(/Application ID|申請ID/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Check Status|状況を確認/i })).toBeVisible();
  });

  test('should display timeline correctly on mobile', async ({ page }) => {
    await page.goto('/prover/application-status');

    // Fill and submit form
    await page.getByLabel(/Application ID|申請ID/i).fill('PRV-2026-001234');
    await page.getByLabel(/Email|メールアドレス/i).fill('test@example.com');
    await page.getByRole('button', { name: /Check Status|状況を確認/i }).click();

    // Timeline should be visible and properly styled
    await expect(page.getByText(/Review Progress|審査進捗/i)).toBeVisible();
  });
});

test.describe('Prover Portal - Application Status Page - i18n', () => {
  test('should display Japanese content', async ({ page }) => {
    await page.goto('/ja/prover/application-status');

    await expect(page.locator('html')).toHaveAttribute('lang', 'ja');
    await expect(page.getByText('申請状況確認')).toBeVisible();
    await expect(page.getByText('申請IDを入力して現在のステータスを確認')).toBeVisible();
  });

  test('should display English content', async ({ page }) => {
    await page.goto('/en/prover/application-status');

    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByText('Application Status')).toBeVisible();
    await expect(page.getByText('Enter your Application ID to check the current status')).toBeVisible();
  });
});
