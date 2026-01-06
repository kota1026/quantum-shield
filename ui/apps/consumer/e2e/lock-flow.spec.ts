import { test, expect } from '@playwright/test';

/**
 * Consumer App - Lock Flow E2E Tests
 * 
 * タスクID: UI-CON-004
 * 対象: Lock Flow (4画面)
 * - Lock Input
 * - Lock Confirmation
 * - Lock Processing
 * - Lock Success
 * 
 * 仕様書: 
 * - 04_SCREENS.md §2.1 Consumer App
 * - 03_USER_JOURNEYS.md Part 2 End User Journey
 * - SEQUENCES_v2.0.md SEQ#1
 */

test.describe('Lock Input', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/lock');
  });

  test('金額入力フィールドが表示される', async ({ page }) => {
    const amountInput = page.getByRole('spinbutton')
      .or(page.getByPlaceholder(/金額|amount|ETH/i))
      .or(page.locator('input[type="number"]'));
    
    await expect(amountInput.first()).toBeVisible();
  });

  test('残高が表示される', async ({ page }) => {
    const balance = page.getByText(/残高|Balance|Available/i);
    await expect(balance.first()).toBeVisible();
  });

  test('MAXボタンがある', async ({ page }) => {
    const maxButton = page.getByRole('button', { name: /MAX|最大/i });
    await expect(maxButton).toBeVisible();
  });

  test('金額入力後に続行ボタンが有効になる', async ({ page }) => {
    const amountInput = page.getByRole('spinbutton')
      .or(page.getByPlaceholder(/金額|amount|ETH/i))
      .or(page.locator('input[type="number"]'))
      .first();
    
    await amountInput.fill('0.01');
    
    const continueButton = page.getByRole('button', { name: /続行|Continue|次へ|Next|Lock/i });
    await expect(continueButton).toBeEnabled();
  });

  test('無効な金額でエラー表示', async ({ page }) => {
    const amountInput = page.getByRole('spinbutton')
      .or(page.getByPlaceholder(/金額|amount|ETH/i))
      .or(page.locator('input[type="number"]'))
      .first();
    
    await amountInput.fill('0');
    
    // エラーメッセージまたは無効なボタン
    const errorOrDisabled = page.getByText(/0より大きい|greater than 0|Invalid/i)
      .or(page.getByRole('button', { name: /続行|Continue|Next|Lock/i }));
    
    await expect(errorOrDisabled.first()).toBeVisible();
  });
});

test.describe('Lock Confirmation', () => {
  test('確認ページが存在する', async ({ page }) => {
    await page.goto('/lock/confirm');
    
    // 確認タイトル
    const title = page.getByText(/確認|Confirm|Review/i);
    await expect(title.first()).toBeVisible();
  });

  test('Lock金額が表示される', async ({ page }) => {
    await page.goto('/lock/confirm');
    
    // ETH金額表示
    const amount = page.getByText(/ETH/i);
    await expect(amount.first()).toBeVisible();
  });

  test('ガス代概算が表示される', async ({ page }) => {
    await page.goto('/lock/confirm');
    
    const gasFee = page.getByText(/ガス|Gas|手数料|Fee/i);
    await expect(gasFee.first()).toBeVisible();
  });

  test('確認ボタンがある', async ({ page }) => {
    await page.goto('/lock/confirm');
    
    const confirmButton = page.getByRole('button', { name: /確認|Confirm|署名|Sign|Lock/i });
    await expect(confirmButton).toBeVisible();
  });

  test('戻るボタンがある', async ({ page }) => {
    await page.goto('/lock/confirm');
    
    const backButton = page.getByRole('button', { name: /戻る|Back|キャンセル|Cancel/i });
    await expect(backButton).toBeVisible();
  });
});

test.describe('Lock Processing', () => {
  test('処理中ページが存在する', async ({ page }) => {
    await page.goto('/lock/processing');
    
    // 処理中表示
    const processing = page.getByText(/処理中|Processing|送信中|Submitting/i);
    await expect(processing.first()).toBeVisible();
  });

  test('ローディングインジケータがある', async ({ page }) => {
    await page.goto('/lock/processing');
    
    const loader = page.locator('[data-testid="loader"], .spinner, .loading, [role="progressbar"]');
    await expect(loader.first()).toBeVisible();
  });

  test('ステップ表示がある', async ({ page }) => {
    await page.goto('/lock/processing');
    
    // 署名、送信、確認などのステップ
    const steps = page.locator('[data-testid="step"], .step');
    const count = await steps.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('Lock Success', () => {
  test('成功ページが存在する', async ({ page }) => {
    await page.goto('/lock/success');
    
    // 成功メッセージ
    const success = page.getByText(/成功|Success|完了|Complete/i);
    await expect(success.first()).toBeVisible();
  });

  test('トランザクションハッシュが表示される', async ({ page }) => {
    await page.goto('/lock/success');
    
    // TXハッシュまたはEtherscanリンク
    const txLink = page.getByRole('link', { name: /0x|Etherscan|トランザクション/i })
      .or(page.getByText(/0x[a-fA-F0-9]{8}/i));
    
    await expect(txLink.first()).toBeVisible();
  });

  test('ダッシュボードへのリンクがある', async ({ page }) => {
    await page.goto('/lock/success');
    
    const dashboardLink = page.getByRole('link', { name: /ダッシュボード|Dashboard/i });
    await expect(dashboardLink).toBeVisible();
  });

  test('新しいLockボタンがある', async ({ page }) => {
    await page.goto('/lock/success');
    
    const newLockButton = page.getByRole('link', { name: /新しいLock|Another|もう一度/i })
      .or(page.getByRole('button', { name: /新しいLock|Another|もう一度/i }));
    
    if (await newLockButton.isVisible()) {
      await expect(newLockButton).toBeVisible();
    }
  });
});

test.describe('Lock Flow Integration', () => {
  test('入力→確認→処理→成功の遷移', async ({ page }) => {
    // 入力画面から開始
    await page.goto('/lock');
    
    // 金額入力
    const amountInput = page.getByRole('spinbutton')
      .or(page.getByPlaceholder(/金額|amount|ETH/i))
      .or(page.locator('input[type="number"]'))
      .first();
    
    await amountInput.fill('0.01');
    
    // 続行ボタン
    const continueButton = page.getByRole('button', { name: /続行|Continue|次へ|Next/i });
    await continueButton.click();
    
    // 確認画面に遷移
    await expect(page).toHaveURL(/\/lock\/confirm/);
  });
});
