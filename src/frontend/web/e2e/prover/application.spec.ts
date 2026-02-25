import { test, expect } from '../fixtures';

test.describe('Prover Portal - Application Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/prover/application');
  });

  test('should display application form with step 1 active', async ({ page }) => {
    // Header should be visible
    await expect(page.getByRole('banner')).toBeVisible();
    await expect(page.getByText('Quantum Shield')).toBeVisible();

    // Progress steps should be visible
    await expect(page.getByRole('navigation', { name: /Application progress/i })).toBeVisible();

    // Step 1 should be active
    await expect(page.getByRole('heading', { name: /Basic Information|基本情報/i })).toBeVisible();
  });

  test('should have accessible progress navigation', async ({ page }) => {
    // Progress navigation should have aria-label
    const progressNav = page.getByRole('navigation', { name: /Application progress/i });
    await expect(progressNav).toBeVisible();

    // Current step should be marked
    await expect(page.locator('[aria-current="step"]')).toBeVisible();
  });

  test('should pass accessibility checks', async ({ page, a11y }) => {
    const accessibilityScanResults = await a11y.analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should display step 1 form fields', async ({ page }) => {
    // Organization name field
    await expect(page.getByLabel(/Organization Name|組織名/i)).toBeVisible();

    // Country dropdown
    await expect(page.getByLabel(/Country|国/i)).toBeVisible();

    // Website field
    await expect(page.getByLabel(/Website|ウェブサイト/i)).toBeVisible();

    // Email field
    await expect(page.getByLabel(/Contact Email|連絡先メール/i)).toBeVisible();

    // Experience dropdown
    await expect(page.getByLabel(/Validator Experience|バリデーター経験/i)).toBeVisible();

    // Continue button
    await expect(page.getByRole('button', { name: /Continue|続ける/i })).toBeVisible();
  });

  test('should navigate to step 2 when Continue clicked', async ({ page }) => {
    // Fill step 1 fields
    await page.getByLabel(/Organization Name|組織名/i).fill('Test Corp');
    await page.getByLabel(/Country|国/i).selectOption('JP');
    await page.getByLabel(/Contact Email|連絡先メール/i).fill('test@example.com');

    // Click continue
    await page.getByRole('button', { name: /Continue|続ける/i }).click();

    // Step 2 should be visible
    await expect(page.getByRole('heading', { name: /Technical Requirements|技術要件/i })).toBeVisible();
  });

  test('should display step 2 technical requirements checklist', async ({ page }) => {
    // Navigate to step 2
    await page.getByRole('button', { name: /Continue|続ける/i }).click();

    // Technical requirements checklist should be visible
    await expect(page.getByText(/FIPS 140-2 Level 3\+ HSM/i)).toBeVisible();
    await expect(page.getByText(/99.9% Uptime|99.9%稼働率/i)).toBeVisible();
    await expect(page.getByText(/30s Response Time|30秒応答時間/i)).toBeVisible();
    await expect(page.getByText(/2-of-3\+ Multisig|マルチシグ/i)).toBeVisible();

    // HSM Provider dropdown
    await expect(page.getByLabel(/HSM Provider|HSMプロバイダー/i)).toBeVisible();

    // Infrastructure Location field
    await expect(page.getByLabel(/Infrastructure Location|インフラの場所/i)).toBeVisible();
  });

  test('should navigate back from step 2 to step 1', async ({ page }) => {
    // Navigate to step 2
    await page.getByRole('button', { name: /Continue|続ける/i }).click();
    await expect(page.getByRole('heading', { name: /Technical Requirements|技術要件/i })).toBeVisible();

    // Click back
    await page.getByRole('button', { name: /Back|戻る/i }).click();

    // Step 1 should be visible again
    await expect(page.getByRole('heading', { name: /Basic Information|基本情報/i })).toBeVisible();
  });

  test('should complete all 4 steps and submit application', async ({ page }) => {
    // Step 1: Fill basic info
    await page.getByLabel(/Organization Name|組織名/i).fill('Test Corp');
    await page.getByLabel(/Country|国/i).selectOption('JP');
    await page.getByLabel(/Contact Email|連絡先メール/i).fill('test@example.com');
    await page.getByRole('button', { name: /Continue|続ける/i }).click();

    // Step 2: Check technical requirements
    await expect(page.getByRole('heading', { name: /Technical Requirements|技術要件/i })).toBeVisible();
    // Check all checkboxes
    const checkboxes = page.locator('input[type="checkbox"]');
    const count = await checkboxes.count();
    for (let i = 0; i < count; i++) {
      await checkboxes.nth(i).check();
    }
    await page.getByLabel(/HSM Provider|HSMプロバイダー/i).selectOption('aws');
    await page.getByLabel(/Infrastructure Location|インフラの場所/i).fill('AWS Tokyo');
    await page.getByRole('button', { name: /Continue|続ける/i }).click();

    // Step 3: Legal & KYB
    await expect(page.getByRole('heading', { name: /Legal & KYB|法務・KYB/i })).toBeVisible();
    await page.getByLabel(/Business Registration Number|事業者登録番号/i).fill('123456789');
    // Check agreement checkboxes
    const legalCheckboxes = page.locator('input[type="checkbox"]');
    const legalCount = await legalCheckboxes.count();
    for (let i = 0; i < legalCount; i++) {
      await legalCheckboxes.nth(i).check();
    }
    await page.getByRole('button', { name: /Continue|続ける/i }).click();

    // Step 4: Review
    await expect(page.getByRole('heading', { name: /Review Application|申請内容の確認/i })).toBeVisible();
    await expect(page.getByText('Test Corp')).toBeVisible();
    await expect(page.getByText('test@example.com')).toBeVisible();

    // Submit application
    await page.getByRole('button', { name: /Submit Application|申請を送信/i }).click();

    // Submitted state should be visible
    await expect(page.getByRole('heading', { name: /Application Submitted|申請が送信されました/i })).toBeVisible();
    await expect(page.getByText(/Application ID|申請ID/i)).toBeVisible();
  });

  test('should display skip link', async ({ page }) => {
    const skipLink = page.getByText('Skip to application form');
    await skipLink.focus();
    await expect(skipLink).toBeVisible();
  });

  test('should have back to overview link', async ({ page }) => {
    await expect(page.getByRole('link', { name: /Back to Overview|Overviewに戻る/i })).toBeVisible();
  });
});

test.describe('Prover Portal - Application Page - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should display correctly on mobile', async ({ page }) => {
    await page.goto('/prover/application');

    // Header should be visible
    await expect(page.getByText('Quantum Shield')).toBeVisible();

    // Form should be visible
    await expect(page.getByRole('heading', { name: /Basic Information|基本情報/i })).toBeVisible();

    // Continue button should be visible
    await expect(page.getByRole('button', { name: /Continue|続ける/i })).toBeVisible();
  });

  test('should have proper touch targets', async ({ page }) => {
    await page.goto('/prover/application');

    // Check that buttons are at least 44x44 pixels
    const continueButton = page.getByRole('button', { name: /Continue|続ける/i });
    const box = await continueButton.boundingBox();

    expect(box?.height).toBeGreaterThanOrEqual(44);
  });
});

test.describe('Prover Portal - Application Page - i18n', () => {
  test('should display Japanese content', async ({ page }) => {
    await page.goto('/ja/prover/application');

    await expect(page.locator('html')).toHaveAttribute('lang', 'ja');
    await expect(page.getByText('基本情報')).toBeVisible();
    await expect(page.getByText('組織についてお知らせください')).toBeVisible();
  });

  test('should display English content', async ({ page }) => {
    await page.goto('/en/prover/application');

    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByText('Basic Information')).toBeVisible();
    await expect(page.getByText('Tell us about your organization')).toBeVisible();
  });
});
