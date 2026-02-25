import { test, expect } from '@playwright/test';

test.describe('Enterprise Terms', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/enterprise/terms');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Page Structure', () => {
    test('should display the page title', async ({ page }) => {
      await expect(page.getByRole('heading', { level: 1, name: 'エンタープライズ利用規約' })).toBeVisible();
    });

    test('should display main content area', async ({ page }) => {
      await expect(page.getByRole('main', { name: 'エンタープライズ利用規約' })).toBeVisible();
    });

    test('should display last updated date', async ({ page }) => {
      await expect(page.getByText(/最終更新日:/)).toBeVisible();
    });
  });

  test.describe('Terms Sections', () => {
    test('should display acceptance section', async ({ page }) => {
      await expect(page.getByRole('heading', { name: '1. 規約の承諾' })).toBeVisible();
    });

    test('should display service section', async ({ page }) => {
      await expect(page.getByRole('heading', { name: '2. サービスの内容' })).toBeVisible();
    });

    test('should display SLA section', async ({ page }) => {
      await expect(page.getByRole('heading', { name: '3. サービスレベル合意（SLA）' })).toBeVisible();
    });

    test('should display security section', async ({ page }) => {
      await expect(page.getByRole('heading', { name: '4. セキュリティ責任' })).toBeVisible();
    });

    test('should display data section', async ({ page }) => {
      await expect(page.getByRole('heading', { name: '5. データの取り扱い' })).toBeVisible();
    });

    test('should display liability section', async ({ page }) => {
      await expect(page.getByRole('heading', { name: '6. 責任の制限' })).toBeVisible();
    });

    test('should display termination section', async ({ page }) => {
      await expect(page.getByRole('heading', { name: '7. 契約の終了' })).toBeVisible();
    });

    test('should display changes section', async ({ page }) => {
      await expect(page.getByRole('heading', { name: '8. 規約の変更' })).toBeVisible();
    });

    test('should display governing law section', async ({ page }) => {
      await expect(page.getByRole('heading', { name: '9. 準拠法および管轄' })).toBeVisible();
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

test.describe('Enterprise Terms - English', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/enterprise/terms');
    await page.waitForLoadState('networkidle');
  });

  test('should display English content', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1, name: 'Enterprise Terms of Service' })).toBeVisible();
  });

  test('should display English section titles', async ({ page }) => {
    await expect(page.getByRole('heading', { name: '1. Acceptance of Terms' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '2. Service Description' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '9. Governing Law' })).toBeVisible();
  });

  test('should display last updated in English', async ({ page }) => {
    await expect(page.getByText(/Last updated:/)).toBeVisible();
  });
});
