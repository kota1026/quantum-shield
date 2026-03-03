import { test, expect } from '@playwright/test';

test.describe('Enterprise Team Invite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/enterprise/team/invite');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Page Structure', () => {
    test('should display the page title', async ({ page }) => {
      await expect(page.getByRole('heading', { level: 1, name: 'ユーザー招待' })).toBeVisible();
    });

    test('should display main content area', async ({ page }) => {
      await expect(page.getByRole('main', { name: 'ユーザー招待フォーム' })).toBeVisible();
    });

    test('should display back button', async ({ page }) => {
      await expect(page.getByRole('link', { name: 'ユーザー一覧に戻る' })).toBeVisible();
    });
  });

  test.describe('Invitation Form', () => {
    test('should display form title', async ({ page }) => {
      await expect(page.getByRole('heading', { name: '招待を送信' })).toBeVisible();
    });

    test('should display email input fields', async ({ page }) => {
      const emailInputs = page.locator('input[type="email"]');
      expect(await emailInputs.count()).toBeGreaterThanOrEqual(2);
    });

    test('should display add email button', async ({ page }) => {
      await expect(page.getByRole('button', { name: /メールを追加/ })).toBeVisible();
    });

    test('should display role select', async ({ page }) => {
      await expect(page.getByText('デフォルトロール')).toBeVisible();
      await expect(page.getByRole('combobox')).toBeVisible();
    });

    test('should display submit button', async ({ page }) => {
      await expect(page.getByRole('button', { name: '招待を送信' })).toBeVisible();
    });
  });

  test.describe('Add Email Functionality', () => {
    test('should add new email field when clicking add button', async ({ page }) => {
      const initialCount = await page.locator('input[type="email"]').count();
      await page.getByRole('button', { name: /メールを追加/ }).click();
      const newCount = await page.locator('input[type="email"]').count();
      expect(newCount).toBe(initialCount + 1);
    });
  });

  test.describe('Pending Invitations', () => {
    test('should display pending invitations section', async ({ page }) => {
      await expect(page.getByRole('heading', { name: '保留中の招待' })).toBeVisible();
    });

    test('should display pending invitation items', async ({ page }) => {
      await expect(page.getByText('alice@company.com')).toBeVisible();
      await expect(page.getByText('bob@company.com')).toBeVisible();
    });

    test('should display resend and cancel buttons', async ({ page }) => {
      const resendButtons = page.getByRole('button', { name: '再送信' });
      expect(await resendButtons.count()).toBe(2);

      const cancelButtons = page.getByRole('button', { name: 'キャンセル' });
      expect(await cancelButtons.count()).toBe(2);
    });
  });

  test.describe('Navigation', () => {
    test('should navigate back to users page', async ({ page }) => {
      await page.getByRole('link', { name: 'ユーザー一覧に戻る' }).click();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/\/enterprise\/users/);
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      const h1 = await page.locator('h1').count();
      expect(h1).toBe(1);

      const h2s = page.locator('h2');
      expect(await h2s.count()).toBeGreaterThanOrEqual(1);
    });

    test('should have accessible navigation', async ({ page }) => {
      await expect(page.getByRole('navigation').first()).toBeVisible();
      await expect(page.getByRole('main')).toBeVisible();
    });
  });
});

test.describe('Enterprise Team Invite - English', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/enterprise/team/invite');
    await page.waitForLoadState('networkidle');
  });

  test('should display English content', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1, name: 'Invite Users' })).toBeVisible();
  });

  test('should display English form labels', async ({ page }) => {
    await expect(page.getByText('Email Addresses')).toBeVisible();
    await expect(page.getByText('Default Role')).toBeVisible();
  });

  test('should display English pending section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Pending Invitations' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Resend' }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cancel' }).first()).toBeVisible();
  });

  test('should display English submit button', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Send Invitations' })).toBeVisible();
  });
});
