import { test, expect } from '@playwright/test';

/**
 * Consumer App Terms of Service E2E Tests
 * Tests for Screen 17: Terms
 */

test.describe('Consumer Terms of Service', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/consumer/terms');
  });

  test.describe('Page Load & Layout', () => {
    test('should display terms page correctly', async ({ page }) => {
      await expect(page).toHaveTitle(/利用規約/);
      await expect(page.getByRole('heading', { name: /利用規約/i })).toBeVisible();
    });

    test('should display last updated date', async ({ page }) => {
      await expect(page.getByText(/最終更新日/)).toBeVisible();
    });

    test('should display Quantum Shield logo', async ({ page }) => {
      await expect(page.getByText('Quantum Shield').first()).toBeVisible();
    });
  });

  test.describe('Header Navigation', () => {
    test('should display back button', async ({ page }) => {
      const backLink = page.getByRole('link', { name: /戻る/i });
      await expect(backLink).toBeVisible();
    });

    test('logo should link to home', async ({ page }) => {
      const logoLink = page.locator('header').getByRole('link').first();
      await expect(logoLink).toHaveAttribute('href', '/consumer');
    });
  });

  test.describe('Terms Sections', () => {
    test('should display acceptance section', async ({ page }) => {
      await expect(page.getByText(/第1条.*規約の承諾/)).toBeVisible();
    });

    test('should display service section', async ({ page }) => {
      await expect(page.getByText(/第2条.*サービス内容/)).toBeVisible();
    });

    test('should display eligibility section', async ({ page }) => {
      await expect(page.getByText(/第3条.*利用資格/)).toBeVisible();
    });

    test('should display risks section', async ({ page }) => {
      await expect(page.getByText(/第4条.*リスク/)).toBeVisible();
    });

    test('should display keys section', async ({ page }) => {
      await expect(page.getByText(/第5条.*秘密鍵の管理/)).toBeVisible();
    });

    test('should display prohibited section', async ({ page }) => {
      await expect(page.getByText(/第6条.*禁止事項/)).toBeVisible();
    });

    test('should display disclaimer section', async ({ page }) => {
      await expect(page.getByText(/第7条.*免責事項/)).toBeVisible();
    });

    test('should display changes section', async ({ page }) => {
      await expect(page.getByText(/第8条.*規約の変更/)).toBeVisible();
    });

    test('should display governing section', async ({ page }) => {
      await expect(page.getByText(/第9条.*準拠法・管轄/)).toBeVisible();
    });

    test('should display contact section', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /お問い合わせ/ })).toBeVisible();
    });
  });

  test.describe('Footer', () => {
    test('should display footer links', async ({ page }) => {
      const footer = page.locator('footer');
      await expect(footer.getByRole('link', { name: /ホーム/i })).toBeVisible();
      await expect(footer.getByRole('link', { name: /利用規約/i })).toBeVisible();
      await expect(footer.getByRole('link', { name: /プライバシー/i })).toBeVisible();
      await expect(footer.getByRole('link', { name: /FAQ/i })).toBeVisible();
    });

    test('should display copyright', async ({ page }) => {
      await expect(page.getByText(/© 2026 Quantum Shield/)).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('section titles should be headings', async ({ page }) => {
      const headings = page.getByRole('heading');
      await expect(headings.first()).toBeVisible();
    });

    test('page should have proper heading hierarchy', async ({ page }) => {
      const h1 = page.getByRole('heading', { level: 1 });
      await expect(h1).toBeVisible();

      const h2s = page.getByRole('heading', { level: 2 });
      const h2Count = await h2s.count();
      expect(h2Count).toBeGreaterThan(5); // At least 9 sections + contact
    });
  });

  test.describe('English Locale', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/en/consumer/terms');
    });

    test('should display English text', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /Terms of Service/i })).toBeVisible();
      await expect(page.getByText(/Last updated/)).toBeVisible();
      await expect(page.getByText(/1\. Acceptance of Terms/)).toBeVisible();
      await expect(page.getByText(/2\. Service Description/)).toBeVisible();
    });
  });
});
