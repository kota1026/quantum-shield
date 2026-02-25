import { test, expect } from '@playwright/test';

test.describe('Enterprise API Key Create', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/enterprise/api-keys/create');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Page Structure', () => {
    test('should display the page title', async ({ page }) => {
      await expect(page.getByRole('heading', { level: 1, name: 'APIキー作成' })).toBeVisible();
    });

    test('should display back button', async ({ page }) => {
      await expect(page.getByRole('link', { name: 'APIキー一覧に戻る' })).toBeVisible();
    });

    test('should display main content area', async ({ page }) => {
      await expect(page.getByRole('main', { name: 'APIキー作成フォーム' })).toBeVisible();
    });
  });

  test.describe('Form Fields', () => {
    test('should display key name input', async ({ page }) => {
      await expect(page.getByLabel('キー名')).toBeVisible();
      await expect(page.getByPlaceholder('Production API Key')).toBeVisible();
    });

    test('should display environment selection', async ({ page }) => {
      await expect(page.getByText('環境')).toBeVisible();
      await expect(page.getByText('本番環境')).toBeVisible();
      await expect(page.getByText('テスト環境')).toBeVisible();
    });

    test('should display expiration select', async ({ page }) => {
      await expect(page.getByLabel('有効期限')).toBeVisible();
    });

    test('should display permissions checkboxes', async ({ page }) => {
      await expect(page.getByText('権限')).toBeVisible();
      await expect(page.getByText('Read')).toBeVisible();
      await expect(page.getByText('Write')).toBeVisible();
      await expect(page.getByText('Admin')).toBeVisible();
    });

    test('should display warning message', async ({ page }) => {
      await expect(page.getByRole('alert')).toBeVisible();
      await expect(page.getByText(/APIキーは作成後に一度だけ表示されます/)).toBeVisible();
    });

    test('should display submit button', async ({ page }) => {
      await expect(page.getByRole('button', { name: /APIキーを作成/ })).toBeVisible();
    });
  });

  test.describe('Form Interactions', () => {
    test('should allow entering key name', async ({ page }) => {
      const input = page.getByLabel('キー名');
      await input.fill('My Test Key');
      await expect(input).toHaveValue('My Test Key');
    });

    test('should allow selecting test environment', async ({ page }) => {
      const testRadio = page.getByRole('radio', { name: /テスト環境/ });
      await page.getByText('テスト環境').click();
      await expect(testRadio).toBeChecked();
    });

    test('should allow changing expiration', async ({ page }) => {
      const select = page.getByLabel('有効期限');
      await select.selectOption('30days');
      await expect(select).toHaveValue('30days');
    });

    test('should allow toggling permissions', async ({ page }) => {
      const adminCheckbox = page.getByRole('checkbox').nth(2);
      await adminCheckbox.check();
      await expect(adminCheckbox).toBeChecked();
    });
  });

  test.describe('Form Submission', () => {
    test('should show success state after submission', async ({ page }) => {
      // Fill required fields
      await page.getByLabel('キー名').fill('Test Key');

      // Submit form
      await page.getByRole('button', { name: /APIキーを作成/ }).click();

      // Check success state
      await expect(page.getByText('APIキーが作成されました')).toBeVisible();
      await expect(page.getByText(/qs_(live|test)_/)).toBeVisible();
      await expect(page.getByRole('button', { name: 'コピー' })).toBeVisible();
      await expect(page.getByRole('link', { name: '完了' })).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      const h1 = await page.locator('h1').count();
      expect(h1).toBe(1);

      const h2s = page.locator('h2');
      await expect(h2s.first()).toBeVisible();
    });

    test('should have accessible navigation', async ({ page }) => {
      await expect(page.getByRole('navigation')).toBeVisible();
      await expect(page.getByRole('main')).toBeVisible();
      await expect(page.getByRole('banner')).toBeVisible();
    });

    test('should have accessible form labels', async ({ page }) => {
      await expect(page.getByLabel('キー名')).toBeVisible();
      await expect(page.getByLabel('有効期限')).toBeVisible();
    });

    test('should have accessible alert', async ({ page }) => {
      await expect(page.getByRole('alert')).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should adapt layout for tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await expect(page.getByRole('heading', { name: 'APIキー作成' })).toBeVisible();
    });

    test('should stack columns for mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await expect(page.getByRole('heading', { level: 1, name: 'APIキー作成' })).toBeVisible();
    });
  });
});

test.describe('Enterprise API Key Create - English', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/enterprise/api-keys/create');
    await page.waitForLoadState('networkidle');
  });

  test('should display English content', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1, name: 'Create API Key' })).toBeVisible();
  });

  test('should display English form labels', async ({ page }) => {
    await expect(page.getByText('Key Name')).toBeVisible();
    await expect(page.getByText('Environment')).toBeVisible();
    await expect(page.getByText('Expiration')).toBeVisible();
    await expect(page.getByText('Permissions')).toBeVisible();
  });

  test('should display English warning', async ({ page }) => {
    await expect(page.getByText(/The API key will only be shown once/)).toBeVisible();
  });

  test('should display English submit button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Create API Key/ })).toBeVisible();
  });

  test('should show English success state after submission', async ({ page }) => {
    await page.getByLabel('Key Name').fill('Test Key');
    await page.getByRole('button', { name: /Create API Key/ }).click();

    await expect(page.getByText('API Key Created')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Copy' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Done' })).toBeVisible();
  });
});
