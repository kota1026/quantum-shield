import { test, expect } from '../fixtures';

test.describe('Consumer App - Onboarding Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/consumer/onboarding');
  });

  test('should display onboarding page with step 1', async ({ page }) => {
    // Header should be visible
    await expect(page.getByRole('heading', { name: /はじめる|Get Started/i })).toBeVisible();

    // Back button should be visible
    await expect(page.getByRole('link', { name: /ランディングページに戻る|Return to landing/i })).toBeVisible();

    // Progress bar should be visible
    await expect(page.getByRole('progressbar')).toBeVisible();

    // Step 1 content should be visible
    await expect(page.getByText('STEP 1 / 4')).toBeVisible();
    await expect(page.getByRole('heading', { name: /ウォレットを接続|Connect Wallet/i })).toBeVisible();
  });

  test('should display wallet options in step 1', async ({ page }) => {
    // Wallet options should be visible
    await expect(page.getByRole('button', { name: /MetaMask/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /WalletConnect/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Coinbase Wallet/i })).toBeVisible();

    // Help link should be visible
    await expect(page.getByRole('button', { name: /ウォレットを持っていない方|Don't have a wallet/i })).toBeVisible();
  });

  test('should open wallet help modal', async ({ page }) => {
    await page.getByRole('button', { name: /ウォレットを持っていない方|Don't have a wallet/i }).click();

    // Modal should be visible
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: /ウォレットの取得方法|How to Get a Wallet/i })).toBeVisible();

    // Close modal with button
    await page.getByRole('button', { name: /閉じる|Close/i }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('should close modal with Escape key', async ({ page }) => {
    await page.getByRole('button', { name: /ウォレットを持っていない方|Don't have a wallet/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Press Escape to close
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('should navigate from step 1 to step 2 when wallet selected', async ({ page }) => {
    // Click MetaMask wallet option
    await page.getByRole('button', { name: /MetaMask/i }).click();

    // Wait for step 2 to appear
    await expect(page.getByText('STEP 2 / 4')).toBeVisible({ timeout: 2000 });
    await expect(page.getByRole('heading', { name: /Dilithium鍵を生成|Generate Dilithium Keys/i })).toBeVisible();
  });

  test('should display step 2 content correctly', async ({ page }) => {
    // Navigate to step 2
    await page.getByRole('button', { name: /MetaMask/i }).click();
    await expect(page.getByText('STEP 2 / 4')).toBeVisible({ timeout: 2000 });

    // Self-custody notice should be visible
    await expect(page.getByText(/自己管理型|Self-Custody/i)).toBeVisible();

    // Generate button should be visible
    await expect(page.getByRole('button', { name: /Dilithium鍵を生成|Generate Dilithium Keys/i })).toBeVisible();

    // Dilithium help link should be visible
    await expect(page.getByRole('button', { name: /Dilithium暗号について詳しく知る|Learn more about Dilithium/i })).toBeVisible();
  });

  test('should open Dilithium help modal', async ({ page }) => {
    // Navigate to step 2
    await page.getByRole('button', { name: /MetaMask/i }).click();
    await expect(page.getByText('STEP 2 / 4')).toBeVisible({ timeout: 2000 });

    // Open Dilithium modal
    await page.getByRole('button', { name: /Dilithium暗号について詳しく知る|Learn more about Dilithium/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: /Dilithium暗号とは|What is Dilithium/i })).toBeVisible();
  });

  test('should generate keys and navigate to step 3', async ({ page }) => {
    // Navigate to step 2
    await page.getByRole('button', { name: /MetaMask/i }).click();
    await expect(page.getByText('STEP 2 / 4')).toBeVisible({ timeout: 2000 });

    // Click generate button
    await page.getByRole('button', { name: /Dilithium鍵を生成|Generate Dilithium Keys/i }).click();

    // Wait for generation to complete and navigate to step 3
    await expect(page.getByText('STEP 3 / 4')).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: /鍵をバックアップ|Backup Your Keys/i })).toBeVisible();
  });

  test('should display step 3 backup content correctly', async ({ page }) => {
    // Navigate through steps 1 and 2
    await page.getByRole('button', { name: /MetaMask/i }).click();
    await expect(page.getByText('STEP 2 / 4')).toBeVisible({ timeout: 2000 });
    await page.getByRole('button', { name: /Dilithium鍵を生成|Generate Dilithium Keys/i }).click();
    await expect(page.getByText('STEP 3 / 4')).toBeVisible({ timeout: 10000 });

    // Warning box should be visible
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByText(/重要|Important/i)).toBeVisible();

    // Download option should be visible
    await expect(page.getByText(/暗号化ファイルでダウンロード|Download Encrypted File/i)).toBeVisible();

    // Checkboxes should be visible
    await expect(page.getByRole('checkbox', { name: /バックアップファイルをダウンロード|downloaded the backup file/i })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: /ファイルを安全な場所|saved the file to a secure location/i })).toBeVisible();

    // Continue button should be disabled initially
    await expect(page.getByRole('button', { name: /次へ進む|Continue/i })).toBeDisabled();
  });

  test('should enable continue button when both checkboxes are checked', async ({ page }) => {
    // Navigate through steps 1 and 2
    await page.getByRole('button', { name: /MetaMask/i }).click();
    await expect(page.getByText('STEP 2 / 4')).toBeVisible({ timeout: 2000 });
    await page.getByRole('button', { name: /Dilithium鍵を生成|Generate Dilithium Keys/i }).click();
    await expect(page.getByText('STEP 3 / 4')).toBeVisible({ timeout: 10000 });

    // Download backup (first checkbox gets auto-checked)
    await page.getByText(/暗号化ファイルでダウンロード|Download Encrypted File/i).click();

    // Check second checkbox
    await page.getByRole('checkbox', { name: /ファイルを安全な場所|saved the file to a secure location/i }).check();

    // Continue button should be enabled
    await expect(page.getByRole('button', { name: /次へ進む|Continue/i })).toBeEnabled();
  });

  test('should navigate to step 4 after completing backup', async ({ page }) => {
    // Navigate through steps 1, 2, and 3
    await page.getByRole('button', { name: /MetaMask/i }).click();
    await expect(page.getByText('STEP 2 / 4')).toBeVisible({ timeout: 2000 });
    await page.getByRole('button', { name: /Dilithium鍵を生成|Generate Dilithium Keys/i }).click();
    await expect(page.getByText('STEP 3 / 4')).toBeVisible({ timeout: 10000 });

    // Complete backup
    await page.getByText(/暗号化ファイルでダウンロード|Download Encrypted File/i).click();
    await page.getByRole('checkbox', { name: /ファイルを安全な場所|saved the file to a secure location/i }).check();
    await page.getByRole('button', { name: /次へ進む|Continue/i }).click();

    // Step 4 should be visible
    await expect(page.getByText('STEP 4 / 4')).toBeVisible();
    await expect(page.getByRole('heading', { name: /準備完了|Ready to Go/i })).toBeVisible();
  });

  test('should display step 4 ready content correctly', async ({ page }) => {
    // Navigate through all steps
    await page.getByRole('button', { name: /MetaMask/i }).click();
    await expect(page.getByText('STEP 2 / 4')).toBeVisible({ timeout: 2000 });
    await page.getByRole('button', { name: /Dilithium鍵を生成|Generate Dilithium Keys/i }).click();
    await expect(page.getByText('STEP 3 / 4')).toBeVisible({ timeout: 10000 });
    await page.getByText(/暗号化ファイルでダウンロード|Download Encrypted File/i).click();
    await page.getByRole('checkbox', { name: /ファイルを安全な場所|saved the file to a secure location/i }).check();
    await page.getByRole('button', { name: /次へ進む|Continue/i }).click();

    // Step 4 content
    await expect(page.getByText('STEP 4 / 4')).toBeVisible();
    await expect(page.getByText(/Dilithium鍵ペアを生成しました|Dilithium key pair generated/i)).toBeVisible();
    await expect(page.getByText(/秘密鍵をバックアップしました|Private key backed up/i)).toBeVisible();
    await expect(page.getByText(/量子耐性保護が有効です|Quantum-resistant protection active/i)).toBeVisible();

    // Dashboard button should be visible
    await expect(page.getByRole('link', { name: /ダッシュボードへ|Go to Dashboard/i })).toBeVisible();

    // Tutorial link should be visible
    await expect(page.getByRole('button', { name: /使い方チュートリアル|View Tutorial/i })).toBeVisible();
  });

  test('should open tutorial modal', async ({ page }) => {
    // Navigate through all steps
    await page.getByRole('button', { name: /MetaMask/i }).click();
    await expect(page.getByText('STEP 2 / 4')).toBeVisible({ timeout: 2000 });
    await page.getByRole('button', { name: /Dilithium鍵を生成|Generate Dilithium Keys/i }).click();
    await expect(page.getByText('STEP 3 / 4')).toBeVisible({ timeout: 10000 });
    await page.getByText(/暗号化ファイルでダウンロード|Download Encrypted File/i).click();
    await page.getByRole('checkbox', { name: /ファイルを安全な場所|saved the file to a secure location/i }).check();
    await page.getByRole('button', { name: /次へ進む|Continue/i }).click();

    // Open tutorial modal
    await page.getByRole('button', { name: /使い方チュートリアル|View Tutorial/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: /使い方チュートリアル|How to Use Tutorial/i })).toBeVisible();
  });

  test('should pass accessibility checks', async ({ page, a11y }) => {
    const accessibilityScanResults = await a11y.analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have accessible skip link', async ({ page }) => {
    const skipLink = page.getByText('Skip to main content');
    await skipLink.focus();
    await expect(skipLink).toBeVisible();
  });

  test('should navigate back to landing page', async ({ page }) => {
    await page.getByRole('link', { name: /ランディングページに戻る|Return to landing/i }).click();
    await expect(page).toHaveURL(/\/consumer$/);
  });
});

test.describe('Consumer App - Onboarding Page - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should display correctly on mobile', async ({ page }) => {
    await page.goto('/consumer/onboarding');

    // Header should be visible
    await expect(page.getByRole('heading', { name: /はじめる|Get Started/i })).toBeVisible();

    // Wallet options should be visible
    await expect(page.getByRole('button', { name: /MetaMask/i })).toBeVisible();
  });

  test('should have proper touch targets', async ({ page }) => {
    await page.goto('/consumer/onboarding');

    // Check that wallet buttons are at least 44x44 pixels
    const walletButton = page.getByRole('button', { name: /MetaMask/i });
    const box = await walletButton.boundingBox();

    expect(box?.height).toBeGreaterThanOrEqual(44);
  });
});

test.describe('Consumer App - Onboarding Page - i18n', () => {
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
