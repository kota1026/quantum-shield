import { test, expect } from '@playwright/test';

test.describe('Enterprise User Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/enterprise/users');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Page Structure', () => {
    test('should display the page title', async ({ page }) => {
      await expect(page.getByRole('heading', { level: 1, name: 'ユーザー管理' })).toBeVisible();
    });

    test('should display action buttons', async ({ page }) => {
      await expect(page.getByRole('link', { name: /ロール管理/ })).toBeVisible();
      await expect(page.getByRole('link', { name: /招待/ })).toBeVisible();
      await expect(page.getByRole('link', { name: /ユーザー追加/ })).toBeVisible();
    });

    test('should display main content area', async ({ page }) => {
      await expect(page.getByRole('main', { name: 'ユーザー管理ダッシュボード' })).toBeVisible();
    });
  });

  test.describe('Statistics Cards', () => {
    test('should display user statistics', async ({ page }) => {
      await expect(page.getByText('総ユーザー数')).toBeVisible();
      await expect(page.getByText('管理者')).toBeVisible();
      await expect(page.getByText('メンバー')).toBeVisible();
      await expect(page.getByText('招待待ち')).toBeVisible();
    });

    test('should display stat values', async ({ page }) => {
      // Check that numeric values are displayed
      const statsSection = page.locator('[aria-label="ユーザー統計"]');
      await expect(statsSection).toBeVisible();
    });
  });

  test.describe('Users Table', () => {
    test('should display table header', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'チームメンバー' })).toBeVisible();
    });

    test('should display search input', async ({ page }) => {
      await expect(page.getByPlaceholder('ユーザーを検索...')).toBeVisible();
    });

    test('should display table columns', async ({ page }) => {
      await expect(page.getByRole('columnheader', { name: 'ユーザー' })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: 'ロール' })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: 'ステータス' })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: '2FA' })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: '最終アクティブ' })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: '操作' })).toBeVisible();
    });

    test('should display user data', async ({ page }) => {
      await expect(page.getByText('佐藤 太郎')).toBeVisible();
      await expect(page.getByText('sato@acme.co.jp')).toBeVisible();
    });

    test('should display role badges', async ({ page }) => {
      await expect(page.getByRole('status', { name: 'Admin' }).first()).toBeVisible();
      await expect(page.getByRole('status', { name: 'Member' }).first()).toBeVisible();
    });

    test('should display status badges', async ({ page }) => {
      await expect(page.getByRole('status', { name: 'アクティブ' }).first()).toBeVisible();
    });

    test('should display 2FA status', async ({ page }) => {
      await expect(page.getByText('✓ 有効').first()).toBeVisible();
    });

    test('should display edit buttons', async ({ page }) => {
      await expect(page.getByRole('link', { name: '編集' }).first()).toBeVisible();
    });
  });

  test.describe('Search Functionality', () => {
    test('should filter users by name', async ({ page }) => {
      const searchInput = page.getByPlaceholder('ユーザーを検索...');
      await searchInput.fill('佐藤');
      await expect(page.getByText('佐藤 太郎')).toBeVisible();
    });

    test('should filter users by email', async ({ page }) => {
      const searchInput = page.getByPlaceholder('ユーザーを検索...');
      await searchInput.fill('sato@');
      await expect(page.getByText('佐藤 太郎')).toBeVisible();
    });
  });

  test.describe('Pagination', () => {
    test('should display pagination controls', async ({ page }) => {
      await expect(page.getByRole('navigation', { name: 'ユーザーページネーション' })).toBeVisible();
    });

    test('should display showing info', async ({ page }) => {
      await expect(page.getByText(/件中.*件を表示/)).toBeVisible();
    });

    test('should display navigation buttons', async ({ page }) => {
      await expect(page.getByRole('button', { name: '前へ' })).toBeVisible();
      await expect(page.getByRole('button', { name: '次へ' })).toBeVisible();
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

    test('should have accessible search input', async ({ page }) => {
      const searchInput = page.getByRole('textbox', { name: 'ユーザー検索' });
      await expect(searchInput).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should adapt layout for tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await expect(page.getByRole('heading', { name: 'ユーザー管理' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'チームメンバー' })).toBeVisible();
    });

    test('should stack columns for mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await expect(page.getByRole('heading', { name: 'ユーザー管理' })).toBeVisible();
    });
  });
});

test.describe('Enterprise User Management - English', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/enterprise/users');
    await page.waitForLoadState('networkidle');
  });

  test('should display English content', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1, name: 'User Management' })).toBeVisible();
  });

  test('should display English action buttons', async ({ page }) => {
    await expect(page.getByRole('link', { name: /Manage Roles/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Invite/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Add User/ })).toBeVisible();
  });

  test('should display English statistics labels', async ({ page }) => {
    await expect(page.getByText('Total Users')).toBeVisible();
    await expect(page.getByText('Admins')).toBeVisible();
    await expect(page.getByText('Members')).toBeVisible();
    await expect(page.getByText('Pending Invites')).toBeVisible();
  });

  test('should display English table headers', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Team Members' })).toBeVisible();
    await expect(page.getByPlaceholder('Search users...')).toBeVisible();
  });

  test('should display English column headers', async ({ page }) => {
    await expect(page.getByRole('columnheader', { name: 'User' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Role' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Status' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Last Active' })).toBeVisible();
  });

  test('should display English pagination', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Previous' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Next' })).toBeVisible();
  });
});
