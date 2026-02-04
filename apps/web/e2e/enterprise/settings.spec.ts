import { test, expect } from '@playwright/test';

test.describe('Enterprise Settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/enterprise/settings');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Page Structure', () => {
    test('should display the page title', async ({ page }) => {
      await expect(page.getByRole('heading', { level: 1, name: '設定' })).toBeVisible();
    });

    test('should display save button', async ({ page }) => {
      await expect(page.getByRole('button', { name: '変更を保存' })).toBeVisible();
    });

    test('should display main content area', async ({ page }) => {
      await expect(page.getByRole('main', { name: '設定ダッシュボード' })).toBeVisible();
    });
  });

  test.describe('Settings Navigation', () => {
    test('should display settings tabs', async ({ page }) => {
      await expect(page.getByRole('button', { name: '組織' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'セキュリティ' })).toBeVisible();
      await expect(page.getByRole('button', { name: '通知' })).toBeVisible();
      await expect(page.getByRole('button', { name: '制限' })).toBeVisible();
    });

    test('should switch tabs when clicked', async ({ page }) => {
      await page.getByRole('button', { name: 'セキュリティ' }).click();
      await expect(page.getByText(/Security.*coming soon/i)).toBeVisible();
    });
  });

  test.describe('Organization Tab', () => {
    test('should display organization profile section', async ({ page }) => {
      await expect(page.getByRole('heading', { name: '組織プロファイル' })).toBeVisible();
    });

    test('should display organization name input', async ({ page }) => {
      await expect(page.getByLabel('組織名')).toBeVisible();
      await expect(page.getByLabel('組織名')).toHaveValue('Acme Corp');
    });

    test('should display organization ID (disabled)', async ({ page }) => {
      const orgIdInput = page.getByLabel('組織ID');
      await expect(orgIdInput).toBeVisible();
      await expect(orgIdInput).toBeDisabled();
    });

    test('should display website input', async ({ page }) => {
      await expect(page.getByLabel('ウェブサイト')).toBeVisible();
    });

    test('should display logo upload section', async ({ page }) => {
      await expect(page.getByText('ロゴ')).toBeVisible();
      await expect(page.getByRole('button', { name: 'ロゴをアップロード' })).toBeVisible();
    });
  });

  test.describe('Billing Contact', () => {
    test('should display billing contact section', async ({ page }) => {
      await expect(page.getByRole('heading', { name: '請求先情報' })).toBeVisible();
    });

    test('should display contact form fields', async ({ page }) => {
      await expect(page.getByLabel('担当者名')).toBeVisible();
      await expect(page.getByLabel('メールアドレス')).toBeVisible();
      await expect(page.getByLabel('電話番号')).toBeVisible();
    });
  });

  test.describe('Contract Information', () => {
    test('should display contract section', async ({ page }) => {
      await expect(page.getByRole('heading', { name: '契約情報' })).toBeVisible();
    });

    test('should display contract details', async ({ page }) => {
      await expect(page.getByText('Enterprise')).toBeVisible();
      await expect(page.getByText('2025-01-01')).toBeVisible();
      await expect(page.getByText('2026-12-31')).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      const h1 = await page.locator('h1').count();
      expect(h1).toBe(1);

      const h2s = page.locator('h2');
      expect(await h2s.count()).toBeGreaterThanOrEqual(3);
    });

    test('should have accessible navigation', async ({ page }) => {
      await expect(page.getByRole('navigation')).toBeVisible();
      await expect(page.getByRole('main')).toBeVisible();
    });
  });
});

test.describe('Enterprise Settings - English', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/enterprise/settings');
    await page.waitForLoadState('networkidle');
  });

  test('should display English content', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1, name: 'Settings' })).toBeVisible();
  });

  test('should display English tabs', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Organization' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Security' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Notifications' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Limits' })).toBeVisible();
  });

  test('should display English section titles', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Organization Profile' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Billing Contact' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Contract Information' })).toBeVisible();
  });
});
