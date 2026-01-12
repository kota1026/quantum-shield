import { test, expect } from '@playwright/test';

/**
 * Consumer App - Landing Page E2E Tests
 * 
 * タスクID: UI-CON-001
 * 対象: Landing Page (4画面)
 * 仕様書: 04_SCREENS.md §2.1 Consumer App
 */

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('ヒーローセクションが表示される', async ({ page }) => {
    // メインヘッドライン
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Quantum/i);
    
    // CTAボタン
    const ctaButton = page.getByRole('link', { name: /始める|Get Started|Connect/i });
    await expect(ctaButton).toBeVisible();
  });

  test('ナビゲーションが機能する', async ({ page }) => {
    // How It Worksリンク
    const howItWorks = page.getByRole('link', { name: /仕組み|How It Works/i });
    await expect(howItWorks).toBeVisible();
    
    // Securityリンク
    const security = page.getByRole('link', { name: /セキュリティ|Security/i });
    await expect(security).toBeVisible();
    
    // FAQリンク
    const faq = page.getByRole('link', { name: /FAQ|よくある質問/i });
    await expect(faq).toBeVisible();
  });

  test('CTAボタンクリックでOnboardingに遷移', async ({ page }) => {
    const ctaButton = page.getByRole('link', { name: /始める|Get Started|Connect/i });
    await ctaButton.click();
    
    // Onboarding/Connectページに遷移
    await expect(page).toHaveURL(/\/(onboarding|connect)/);
  });

  test('モバイルレスポンシブ対応（375px）', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    // メインコンテンツが表示される
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    
    // モバイルメニューまたはナビが表示される
    const nav = page.locator('nav, [role="navigation"]');
    await expect(nav).toBeVisible();
  });
});

test.describe('How It Works Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/how-it-works');
  });

  test('3ステップの説明が表示される', async ({ page }) => {
    // Lock, Protect, Unlock の3ステップ
    const steps = page.locator('[data-testid="step"], .step, article');
    await expect(steps).toHaveCount(3);
  });

  test('図解/イラストが表示される', async ({ page }) => {
    const illustration = page.locator('img, svg, [data-testid="illustration"]');
    await expect(illustration.first()).toBeVisible();
  });

  test('戻るリンクが機能する', async ({ page }) => {
    const backLink = page.getByRole('link', { name: /戻る|Back|Home/i });
    if (await backLink.isVisible()) {
      await backLink.click();
      await expect(page).toHaveURL('/');
    }
  });
});

test.describe('Security Explainer Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/security');
  });

  test('量子耐性の説明が表示される', async ({ page }) => {
    const content = page.getByText(/量子|quantum|Dilithium|post-quantum/i);
    await expect(content.first()).toBeVisible();
  });

  test('技術スタックの説明が表示される', async ({ page }) => {
    // Dilithium, SPHINCS+, SHA3-256 などの技術名
    const techStack = page.locator('text=/Dilithium|SPHINCS|SHA3/i');
    await expect(techStack.first()).toBeVisible();
  });
});

test.describe('FAQ Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/faq');
  });

  test('FAQ項目が表示される', async ({ page }) => {
    // アコーディオン形式のFAQ
    const faqItems = page.locator('[data-testid="faq-item"], details, .accordion-item');
    const count = await faqItems.count();
    expect(count).toBeGreaterThan(0);
  });

  test('FAQ項目をクリックで展開できる', async ({ page }) => {
    const firstFaq = page.locator('[data-testid="faq-item"], details, .accordion-item, button').first();
    await firstFaq.click();
    
    // 回答が表示される
    const answer = page.locator('[data-testid="faq-answer"], .accordion-content, dd, p').first();
    await expect(answer).toBeVisible();
  });

  test('検索機能がある場合、フィルタリングできる', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/検索|Search/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill('量子');
      // フィルタリングされたFAQ項目
      const filteredItems = page.locator('[data-testid="faq-item"]:visible, details:visible');
      const count = await filteredItems.count();
      expect(count).toBeGreaterThan(0);
    }
  });
});
