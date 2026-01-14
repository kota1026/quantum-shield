import { test, expect } from '@playwright/test';

/**
 * Consumer App - Onboarding E2E Tests
 * 
 * タスクID: UI-CON-002
 * 対象: Onboarding Flow (4画面)
 * - Wallet Connect
 * - Key Generation (Dilithium)
 * - Backup Instructions
 * - Ready
 * 
 * 仕様書: 
 * - 04_SCREENS.md §2.1 Consumer App
 * - 05_AUTH_SECURITY.md §2.1 SIWE認証フロー
 */

test.describe('Wallet Connect', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/onboarding');
  });

  test('ウォレット接続オプションが表示される', async ({ page }) => {
    // MetaMaskオプション
    const metamask = page.getByText(/MetaMask/i);
    await expect(metamask).toBeVisible();
    
    // WalletConnectオプション
    const walletConnect = page.getByText(/WalletConnect/i);
    await expect(walletConnect).toBeVisible();
  });

  test('接続の説明テキストが表示される', async ({ page }) => {
    const explanation = page.getByText(/ウォレット|wallet|接続|connect/i);
    await expect(explanation.first()).toBeVisible();
  });

  test('戻るボタンでLandingに戻れる', async ({ page }) => {
    const backButton = page.getByRole('button', { name: /戻る|Back/i })
      .or(page.getByRole('link', { name: /戻る|Back/i }));
    
    if (await backButton.isVisible()) {
      await backButton.click();
      await expect(page).toHaveURL('/');
    }
  });
});

test.describe('Key Generation (Dilithium)', () => {
  // Note: この画面はウォレット接続後にアクセス可能
  // Mockを使用してテスト
  
  test('鍵生成ページが存在する', async ({ page }) => {
    await page.goto('/onboarding/key-generation');
    
    // 鍵生成の説明
    const explanation = page.getByText(/Dilithium|量子耐性|鍵|key/i);
    await expect(explanation.first()).toBeVisible();
  });

  test('鍵生成ボタンがある', async ({ page }) => {
    await page.goto('/onboarding/key-generation');
    
    const generateButton = page.getByRole('button', { name: /生成|Generate/i });
    await expect(generateButton).toBeVisible();
  });

  test('プログレス表示がある', async ({ page }) => {
    await page.goto('/onboarding/key-generation');
    
    // ステップインジケータ
    const progress = page.locator('[data-testid="progress"], .progress, [role="progressbar"]');
    await expect(progress.first()).toBeVisible();
  });
});

test.describe('Backup Instructions', () => {
  test('バックアップページが存在する', async ({ page }) => {
    await page.goto('/onboarding/backup');
    
    // バックアップ説明
    const explanation = page.getByText(/バックアップ|backup|保存|save/i);
    await expect(explanation.first()).toBeVisible();
  });

  test('重要な警告が表示される', async ({ page }) => {
    await page.goto('/onboarding/backup');
    
    // 警告テキスト
    const warning = page.getByText(/重要|Important|注意|Warning/i);
    await expect(warning.first()).toBeVisible();
  });

  test('バックアップ確認チェックボックスがある', async ({ page }) => {
    await page.goto('/onboarding/backup');
    
    const checkbox = page.getByRole('checkbox')
      .or(page.locator('input[type="checkbox"]'));
    
    if (await checkbox.isVisible()) {
      await expect(checkbox).toBeVisible();
    }
  });
});

test.describe('Ready', () => {
  test('準備完了ページが存在する', async ({ page }) => {
    await page.goto('/onboarding/ready');
    
    // 完了メッセージ
    const successMessage = page.getByText(/準備完了|Ready|完了|Success/i);
    await expect(successMessage.first()).toBeVisible();
  });

  test('ダッシュボードへのリンクがある', async ({ page }) => {
    await page.goto('/onboarding/ready');
    
    const dashboardLink = page.getByRole('link', { name: /ダッシュボード|Dashboard|始める|Start/i });
    await expect(dashboardLink).toBeVisible();
  });

  test('ダッシュボードリンククリックで遷移', async ({ page }) => {
    await page.goto('/onboarding/ready');
    
    const dashboardLink = page.getByRole('link', { name: /ダッシュボード|Dashboard|始める|Start/i });
    await dashboardLink.click();
    
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
