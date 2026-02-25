import { test, expect } from '@playwright/test';

test.describe('Enterprise Privacy', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/enterprise/privacy');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Page Structure', () => {
    test('should display the page title', async ({ page }) => {
      await expect(page.getByRole('heading', { level: 1, name: 'プライバシーポリシー' })).toBeVisible();
    });

    test('should display main content area', async ({ page }) => {
      await expect(page.getByRole('main', { name: 'プライバシーポリシー' })).toBeVisible();
    });

    test('should display last updated date', async ({ page }) => {
      await expect(page.getByText(/最終更新日:/)).toBeVisible();
    });
  });

  test.describe('Privacy Sections', () => {
    test('should display introduction section', async ({ page }) => {
      await expect(page.getByRole('heading', { name: '1. はじめに' })).toBeVisible();
    });

    test('should display collection section', async ({ page }) => {
      await expect(page.getByRole('heading', { name: '2. 収集する情報' })).toBeVisible();
    });

    test('should display usage section', async ({ page }) => {
      await expect(page.getByRole('heading', { name: '3. 情報の利用目的' })).toBeVisible();
    });

    test('should display sharing section', async ({ page }) => {
      await expect(page.getByRole('heading', { name: '4. 情報の共有' })).toBeVisible();
    });

    test('should display security section', async ({ page }) => {
      await expect(page.getByRole('heading', { name: '5. セキュリティ対策' })).toBeVisible();
    });

    test('should display retention section', async ({ page }) => {
      await expect(page.getByRole('heading', { name: '6. データ保持期間' })).toBeVisible();
    });

    test('should display rights section', async ({ page }) => {
      await expect(page.getByRole('heading', { name: '7. お客様の権利' })).toBeVisible();
    });

    test('should display cookies section', async ({ page }) => {
      await expect(page.getByRole('heading', { name: '8. クッキーとトラッキング' })).toBeVisible();
    });

    test('should display changes section', async ({ page }) => {
      await expect(page.getByRole('heading', { name: '9. ポリシーの変更' })).toBeVisible();
    });

    test('should display contact section', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'お問い合わせ' })).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      const h1 = await page.locator('h1').count();
      expect(h1).toBe(1);

      const h2s = page.locator('h2');
      expect(await h2s.count()).toBeGreaterThanOrEqual(9);
    });

    test('should have accessible navigation', async ({ page }) => {
      await expect(page.getByRole('navigation')).toBeVisible();
      await expect(page.getByRole('main')).toBeVisible();
    });
  });
});

test.describe('Enterprise Privacy - English', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/enterprise/privacy');
    await page.waitForLoadState('networkidle');
  });

  test('should display English content', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1, name: 'Privacy Policy' })).toBeVisible();
  });

  test('should display English section titles', async ({ page }) => {
    await expect(page.getByRole('heading', { name: '1. Introduction' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '5. Security Measures' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '7. Your Rights' })).toBeVisible();
  });

  test('should display last updated in English', async ({ page }) => {
    await expect(page.getByText(/Last updated:/)).toBeVisible();
  });
});
