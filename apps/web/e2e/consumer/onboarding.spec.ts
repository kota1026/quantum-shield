import { test, expect } from '../fixtures';

test.describe('Consumer App - Onboarding', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/consumer/onboarding');
  });

  test('should display step 1 wallet connect by default', async ({ page }) => {
    // Header should be visible
    await expect(page.getByRole('heading', { name: /はじめる|Get Started/i })).toBeVisible();

    // Progress bar should show step 1
    await expect(page.getByRole('progressbar')).toBeVisible();

    // Step indicator should show STEP 1 / 4
    await expect(page.getByText(/STEP 1.*4/i)).toBeVisible();

    // Wallet options should be visible
    await expect(page.getByText('MetaMask')).toBeVisible();
    await expect(page.getByText('WalletConnect')).toBeVisible();
    await expect(page.getByText('Coinbase Wallet')).toBeVisible();
  });

  test('should have accessible back button', async ({ page }) => {
    const backButton = page.getByRole('link', { name: /戻る|Back/i });
    await expect(backButton).toBeVisible();
    await expect(backButton).toHaveAttribute('href', '/consumer');
  });

  test('should open wallet help modal', async ({ page }) => {
    await page.getByText(/ウォレットを持っていない方|Don't have a wallet/i).click();

    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();
    await expect(page.getByRole('heading', { name: /ウォレットの取得方法|How to Get a Wallet/i })).toBeVisible();

    // Close modal
    await page.getByRole('button', { name: /閉じる|Close/i }).click();
    await expect(modal).not.toBeVisible();
  });

  test('should proceed to step 2 after wallet selection', async ({ page }) => {
    // Click MetaMask option
    await page.getByText('MetaMask').click();

    // Wait for transition to step 2
    await expect(page.getByText(/STEP 2.*4/i)).toBeVisible({ timeout: 2000 });
    await expect(page.getByText(/Dilithium鍵を生成|Generate Dilithium Keys/i)).toBeVisible();
  });

  test('should display self-custody notice in step 2', async ({ page }) => {
    // Navigate to step 2
    await page.getByText('MetaMask').click();
    await expect(page.getByText(/STEP 2.*4/i)).toBeVisible({ timeout: 2000 });

    // Self-custody notice should be visible
    await expect(page.getByText(/自己管理型|Self-Custody/i)).toBeVisible();
  });

  test('should open dilithium modal from step 2', async ({ page }) => {
    // Navigate to step 2
    await page.getByText('MetaMask').click();
    await expect(page.getByText(/STEP 2.*4/i)).toBeVisible({ timeout: 2000 });

    // Click the help button
    await page.getByRole('button', { name: /\?/ }).first().click();

    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();
    await expect(page.getByRole('heading', { name: /Dilithium暗号とは|What is Dilithium/i })).toBeVisible();

    // Close modal
    await page.getByRole('button', { name: /閉じる|Close/i }).click();
  });

  test('should generate keys and proceed to step 3', async ({ page }) => {
    // Navigate to step 2
    await page.getByText('MetaMask').click();
    await expect(page.getByText(/STEP 2.*4/i)).toBeVisible({ timeout: 2000 });

    // Click generate button
    await page.getByRole('button', { name: /Dilithium鍵を生成|Generate Dilithium Keys/i }).click();

    // Wait for key generation to complete and proceed to step 3
    await expect(page.getByText(/STEP 3.*4/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/鍵をバックアップ|Backup Your Keys/i)).toBeVisible();
  });

  test('should display warning in step 3', async ({ page }) => {
    // Navigate through to step 3
    await page.getByText('MetaMask').click();
    await expect(page.getByText(/STEP 2.*4/i)).toBeVisible({ timeout: 2000 });
    await page.getByRole('button', { name: /Dilithium鍵を生成|Generate Dilithium Keys/i }).click();
    await expect(page.getByText(/STEP 3.*4/i)).toBeVisible({ timeout: 10000 });

    // Warning should be visible
    await expect(page.getByText(/重要|Important/i).first()).toBeVisible();
    await expect(page.getByText(/秘密鍵を安全に保管|Keep your private key safe/i)).toBeVisible();
  });

  test('should enable continue button only after both checkboxes are checked', async ({ page }) => {
    // Navigate through to step 3
    await page.getByText('MetaMask').click();
    await expect(page.getByText(/STEP 2.*4/i)).toBeVisible({ timeout: 2000 });
    await page.getByRole('button', { name: /Dilithium鍵を生成|Generate Dilithium Keys/i }).click();
    await expect(page.getByText(/STEP 3.*4/i)).toBeVisible({ timeout: 10000 });

    // Continue button should be disabled initially
    const continueButton = page.getByRole('button', { name: /次へ進む|Continue/i });
    await expect(continueButton).toBeDisabled();

    // Download backup (first checkbox gets auto-checked)
    await page.getByText(/暗号化ファイルでダウンロード|Download Encrypted File/i).click();

    // First checkbox should be checked, button still disabled
    await expect(continueButton).toBeDisabled();

    // Check second checkbox
    await page.getByText(/ファイルを安全な場所|saved the file to a safe location/i).click();

    // Now button should be enabled
    await expect(continueButton).toBeEnabled();
  });

  test('should complete onboarding flow and reach step 4', async ({ page }) => {
    // Navigate through all steps
    await page.getByText('MetaMask').click();
    await expect(page.getByText(/STEP 2.*4/i)).toBeVisible({ timeout: 2000 });
    await page.getByRole('button', { name: /Dilithium鍵を生成|Generate Dilithium Keys/i }).click();
    await expect(page.getByText(/STEP 3.*4/i)).toBeVisible({ timeout: 10000 });

    // Complete backup
    await page.getByText(/暗号化ファイルでダウンロード|Download Encrypted File/i).click();
    await page.getByText(/ファイルを安全な場所|saved the file to a safe location/i).click();
    await page.getByRole('button', { name: /次へ進む|Continue/i }).click();

    // Step 4 should be visible
    await expect(page.getByText(/STEP 4.*4/i)).toBeVisible();
    await expect(page.getByText(/準備完了|All Set/i)).toBeVisible();

    // Dashboard button should be visible
    await expect(page.getByRole('button', { name: /ダッシュボードへ|Go to Dashboard/i })).toBeVisible();
  });

  test('should open tutorial modal in step 4', async ({ page }) => {
    // Navigate through all steps to step 4
    await page.getByText('MetaMask').click();
    await expect(page.getByText(/STEP 2.*4/i)).toBeVisible({ timeout: 2000 });
    await page.getByRole('button', { name: /Dilithium鍵を生成|Generate Dilithium Keys/i }).click();
    await expect(page.getByText(/STEP 3.*4/i)).toBeVisible({ timeout: 10000 });
    await page.getByText(/暗号化ファイルでダウンロード|Download Encrypted File/i).click();
    await page.getByText(/ファイルを安全な場所|saved the file to a safe location/i).click();
    await page.getByRole('button', { name: /次へ進む|Continue/i }).click();
    await expect(page.getByText(/STEP 4.*4/i)).toBeVisible();

    // Click tutorial link
    await page.getByText(/使い方チュートリアル|View tutorial/i).click();

    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();
    await expect(page.getByRole('heading', { name: /使い方チュートリアル|Tutorial/i })).toBeVisible();
  });
});

test.describe('Consumer App - Onboarding - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should display correctly on mobile', async ({ page }) => {
    await page.goto('/consumer/onboarding');

    // Header should be visible
    await expect(page.getByRole('heading', { name: /はじめる|Get Started/i })).toBeVisible();

    // Wallet options should be visible
    await expect(page.getByText('MetaMask')).toBeVisible();
  });

  test('should have proper touch targets on mobile', async ({ page }) => {
    await page.goto('/consumer/onboarding');

    // Wallet option should have proper touch target size
    const walletOption = page.getByText('MetaMask').locator('..');
    const box = await walletOption.boundingBox();

    expect(box?.height).toBeGreaterThanOrEqual(44);
  });
});

test.describe('Consumer App - Onboarding - i18n', () => {
  test('should display Japanese content', async ({ page }) => {
    await page.goto('/ja/consumer/onboarding');

    await expect(page.locator('html')).toHaveAttribute('lang', 'ja');
    await expect(page.getByText('ウォレットを接続')).toBeVisible();
  });

  test('should display English content', async ({ page }) => {
    await page.goto('/en/consumer/onboarding');

    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByText('Connect Wallet')).toBeVisible();
  });
});

test.describe('Consumer App - Onboarding - Accessibility', () => {
  test('should pass accessibility checks', async ({ page, a11y }) => {
    await page.goto('/consumer/onboarding');
    const accessibilityScanResults = await a11y.analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have proper ARIA attributes on progress bar', async ({ page }) => {
    await page.goto('/consumer/onboarding');

    const progressbar = page.getByRole('progressbar');
    await expect(progressbar).toHaveAttribute('aria-valuenow', '1');
    await expect(progressbar).toHaveAttribute('aria-valuemin', '1');
    await expect(progressbar).toHaveAttribute('aria-valuemax', '4');
  });

  test('should have accessible modals', async ({ page }) => {
    await page.goto('/consumer/onboarding');

    // Open wallet help modal
    await page.getByText(/ウォレットを持っていない方|Don't have a wallet/i).click();

    const modal = page.getByRole('dialog');
    await expect(modal).toHaveAttribute('aria-modal', 'true');
    await expect(modal).toHaveAttribute('aria-labelledby');
  });
});
