import { test, expect } from '@playwright/test';

test.describe('Enterprise Webhook Create', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/enterprise/webhooks/create');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Page Structure', () => {
    test('should display the page title', async ({ page }) => {
      await expect(page.getByRole('heading', { level: 1, name: 'Webhook作成' })).toBeVisible();
    });

    test('should display back button', async ({ page }) => {
      await expect(page.getByRole('link', { name: 'Webhook一覧に戻る' })).toBeVisible();
    });

    test('should display main content area', async ({ page }) => {
      await expect(page.getByRole('main', { name: 'Webhook作成フォーム' })).toBeVisible();
    });
  });

  test.describe('Form Fields', () => {
    test('should display webhook name input', async ({ page }) => {
      await expect(page.getByLabel('Webhook名')).toBeVisible();
    });

    test('should display endpoint URL input', async ({ page }) => {
      await expect(page.getByLabel('エンドポイントURL')).toBeVisible();
    });

    test('should display event checkboxes', async ({ page }) => {
      await expect(page.getByText('イベント')).toBeVisible();
      await expect(page.getByText('トランザクション作成')).toBeVisible();
      await expect(page.getByText('トランザクション完了')).toBeVisible();
      await expect(page.getByText('セキュリティアラート')).toBeVisible();
    });

    test('should display submit button', async ({ page }) => {
      await expect(page.getByRole('button', { name: /Webhookを作成/ })).toBeVisible();
    });
  });

  test.describe('Form Submission', () => {
    test('should show success state after submission', async ({ page }) => {
      await page.getByLabel('Webhook名').fill('Test Webhook');
      await page.getByLabel('エンドポイントURL').fill('https://example.com/webhook');
      await page.getByRole('button', { name: /Webhookを作成/ }).click();

      await expect(page.getByText('Webhookが作成されました')).toBeVisible();
      await expect(page.getByText(/whsec_/)).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      const h1 = await page.locator('h1').count();
      expect(h1).toBe(1);
    });

    test('should have accessible form labels', async ({ page }) => {
      await expect(page.getByLabel('Webhook名')).toBeVisible();
      await expect(page.getByLabel('エンドポイントURL')).toBeVisible();
    });
  });
});

test.describe('Enterprise Webhook Create - English', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/enterprise/webhooks/create');
    await page.waitForLoadState('networkidle');
  });

  test('should display English content', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1, name: 'Create Webhook' })).toBeVisible();
  });

  test('should display English form labels', async ({ page }) => {
    await expect(page.getByText('Webhook Name')).toBeVisible();
    await expect(page.getByText('Endpoint URL')).toBeVisible();
    await expect(page.getByText('Events')).toBeVisible();
  });
});
