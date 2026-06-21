import { test, expect } from '@playwright/test';

/**
 * Consumer App Privacy Policy E2E Tests
 * Tests for Screen 18: Privacy
 */

test.describe('Consumer Privacy Policy', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/consumer/privacy');
  });

  test.describe('Page Load & Layout', () => {
    test('should display privacy page correctly', async ({ page }) => {
      await expect(page).toHaveTitle(/プライバシーポリシー/);
      await expect(page.getByRole('heading', { name: /プライバシーポリシー/i })).toBeVisible();
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

  test.describe('Privacy Sections', () => {
    test('should display intro section', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /はじめに/ })).toBeVisible();
    });

    test('should display collection section', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /収集する情報/ })).toBeVisible();
    });

    test('should display not collected section', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /収集しない情報/ })).toBeVisible();
    });

    test('should display usage section', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /情報の利用目的/ })).toBeVisible();
    });

    test('should display sharing section', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /情報の共有/ })).toBeVisible();
    });

    test('should display cookies section', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /Cookie/ })).toBeVisible();
    });

    test('should display security section', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /セキュリティ/ })).toBeVisible();
    });

    test('should display rights section', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /ユーザーの権利/ })).toBeVisible();
    });

    test('should display changes section', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /ポリシーの変更/ })).toBeVisible();
    });

    test('should display contact section', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /お問い合わせ/ })).toBeVisible();
    });
  });

  test.describe('Privacy Content', () => {
    test('should mention self-custody', async ({ page }) => {
      await expect(page.getByText(/秘密鍵/)).toBeVisible();
    });

    test('should mention not collecting keys', async ({ page }) => {
      await expect(page.getByText(/収集・保存しません/)).toBeVisible();
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

    test('privacy link should be active/current', async ({ page }) => {
      const privacyLink = page.locator('footer').getByRole('link', { name: /プライバシー/i });
      await expect(privacyLink).toHaveAttribute('href', '/consumer/privacy');
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
      expect(h2Count).toBeGreaterThan(5);
    });
  });

  test.describe('English Locale', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/en/consumer/privacy');
    });

    test('should display English text', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /Privacy Policy/i })).toBeVisible();
      await expect(page.getByText(/Last updated/)).toBeVisible();
      await expect(page.getByRole('heading', { name: /Introduction/ })).toBeVisible();
      await expect(page.getByRole('heading', { name: /Information We Collect/ })).toBeVisible();
    });
  });
});
