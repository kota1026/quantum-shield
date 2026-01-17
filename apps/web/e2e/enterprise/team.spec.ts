import { test, expect } from '@playwright/test';

test.describe('Enterprise Team', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/enterprise/team');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Page Structure', () => {
    test('should display the page title', async ({ page }) => {
      await expect(page.getByRole('heading', { level: 1, name: 'チーム管理' })).toBeVisible();
    });

    test('should display main content area', async ({ page }) => {
      await expect(page.getByRole('main', { name: 'チーム管理ダッシュボード' })).toBeVisible();
    });

    test('should display invite users button', async ({ page }) => {
      await expect(page.getByRole('link', { name: 'ユーザーを招待' })).toBeVisible();
    });
  });

  test.describe('Role Cards', () => {
    test('should display Admin role card', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Admin' })).toBeVisible();
      await expect(page.getByText('3ユーザー')).toBeVisible();
    });

    test('should display Member role card', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Member' })).toBeVisible();
      await expect(page.getByText('8ユーザー')).toBeVisible();
    });

    test('should display Viewer role card', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Viewer' })).toBeVisible();
      await expect(page.getByText('4ユーザー')).toBeVisible();
    });

    test('should display role descriptions', async ({ page }) => {
      await expect(page.getByText(/ユーザー管理、設定、請求を含む/)).toBeVisible();
      await expect(page.getByText(/トランザクションの実行とアナリティクスの閲覧が可能/)).toBeVisible();
      await expect(page.getByText(/読み取り専用アクセス/)).toBeVisible();
    });
  });

  test.describe('Permissions Display', () => {
    test('should display permissions label', async ({ page }) => {
      const permLabels = page.getByText('権限');
      expect(await permLabels.count()).toBeGreaterThanOrEqual(3);
    });

    test('should display permission items', async ({ page }) => {
      await expect(page.getByText('ユーザーとロールの管理').first()).toBeVisible();
      await expect(page.getByText('トランザクションの実行').first()).toBeVisible();
      await expect(page.getByText('アナリティクスの閲覧').first()).toBeVisible();
    });
  });

  test.describe('Navigation', () => {
    test('should navigate to invite page', async ({ page }) => {
      await page.getByRole('link', { name: 'ユーザーを招待' }).click();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/\/enterprise\/team\/invite/);
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      const h1 = await page.locator('h1').count();
      expect(h1).toBe(1);

      const h2s = page.locator('h2');
      expect(await h2s.count()).toBe(3);
    });

    test('should have accessible navigation', async ({ page }) => {
      await expect(page.getByRole('navigation')).toBeVisible();
      await expect(page.getByRole('main')).toBeVisible();
    });

    test('should have interactive role cards', async ({ page }) => {
      const roleButtons = page.getByRole('button', { name: /role with/ });
      expect(await roleButtons.count()).toBe(3);
    });
  });
});

test.describe('Enterprise Team - English', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/enterprise/team');
    await page.waitForLoadState('networkidle');
  });

  test('should display English content', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1, name: 'Team Management' })).toBeVisible();
  });

  test('should display English role cards', async ({ page }) => {
    await expect(page.getByText('3 users')).toBeVisible();
    await expect(page.getByText('8 users')).toBeVisible();
    await expect(page.getByText('4 users')).toBeVisible();
  });

  test('should display English permissions', async ({ page }) => {
    await expect(page.getByText('Permissions').first()).toBeVisible();
    await expect(page.getByText('Manage users & roles').first()).toBeVisible();
  });

  test('should display English invite button', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Invite Users' })).toBeVisible();
  });
});
