import { test, expect } from '@playwright/test';

test.describe('Enterprise User Detail', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/enterprise/users/user_001');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Page Structure', () => {
    test('should display the page title', async ({ page }) => {
      await expect(page.getByRole('heading', { level: 1, name: 'ユーザー詳細' })).toBeVisible();
    });

    test('should display back button', async ({ page }) => {
      await expect(page.getByRole('link', { name: 'ユーザー一覧に戻る' })).toBeVisible();
    });

    test('should display action buttons', async ({ page }) => {
      await expect(page.getByRole('button', { name: 'ユーザーを無効化' })).toBeVisible();
      await expect(page.getByRole('button', { name: '変更を保存' })).toBeVisible();
    });

    test('should display main content area', async ({ page }) => {
      await expect(page.getByRole('main', { name: 'ユーザー詳細ページ' })).toBeVisible();
    });
  });

  test.describe('User Header', () => {
    test('should display user information header', async ({ page }) => {
      await expect(page.locator('[aria-label="ユーザー情報ヘッダー"]')).toBeVisible();
    });

    test('should display user name', async ({ page }) => {
      await expect(page.getByRole('heading', { level: 2, name: '佐藤 太郎' })).toBeVisible();
    });

    test('should display user email', async ({ page }) => {
      await expect(page.getByText('sato@acme.co.jp')).toBeVisible();
    });

    test('should display role badge', async ({ page }) => {
      await expect(page.getByRole('status', { name: 'Admin' })).toBeVisible();
    });

    test('should display status badge', async ({ page }) => {
      await expect(page.getByRole('status', { name: 'アクティブ' })).toBeVisible();
    });
  });

  test.describe('Profile Settings', () => {
    test('should display profile settings card', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'プロフィール設定' })).toBeVisible();
    });

    test('should display name input', async ({ page }) => {
      const nameInput = page.getByLabel('名前');
      await expect(nameInput).toBeVisible();
      await expect(nameInput).toHaveValue('佐藤 太郎');
    });

    test('should display email input', async ({ page }) => {
      const emailInput = page.getByLabel('メールアドレス');
      await expect(emailInput).toBeVisible();
      await expect(emailInput).toHaveValue('sato@acme.co.jp');
    });

    test('should display role select', async ({ page }) => {
      const roleSelect = page.getByLabel('ロール');
      await expect(roleSelect).toBeVisible();
      await expect(roleSelect).toHaveValue('admin');
    });

    test('should allow editing name', async ({ page }) => {
      const nameInput = page.getByLabel('名前');
      await nameInput.fill('佐藤 次郎');
      await expect(nameInput).toHaveValue('佐藤 次郎');
    });

    test('should allow changing role', async ({ page }) => {
      const roleSelect = page.getByLabel('ロール');
      await roleSelect.selectOption('member');
      await expect(roleSelect).toHaveValue('member');
    });
  });

  test.describe('Recent Activity', () => {
    test('should display activity card', async ({ page }) => {
      await expect(page.getByRole('heading', { name: '最近のアクティビティ' })).toBeVisible();
    });

    test('should display activity events', async ({ page }) => {
      await expect(page.getByText('ログイン')).toBeVisible();
      await expect(page.getByText('APIキーを作成')).toBeVisible();
      await expect(page.getByText('ユーザーを招待')).toBeVisible();
      await expect(page.getByText('設定を更新')).toBeVisible();
    });

    test('should display activity timestamps', async ({ page }) => {
      await expect(page.getByText('2分前')).toBeVisible();
      await expect(page.getByText('1時間前')).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      const h1 = await page.locator('h1').count();
      expect(h1).toBe(1);

      const h2 = await page.locator('h2').count();
      expect(h2).toBe(1);

      const h3s = page.locator('h3');
      await expect(h3s).toHaveCount(2);
    });

    test('should have accessible form inputs', async ({ page }) => {
      await expect(page.getByRole('textbox', { name: '名前' })).toBeVisible();
      await expect(page.getByRole('textbox', { name: 'メールアドレス' })).toBeVisible();
      await expect(page.getByRole('combobox', { name: 'ロール' })).toBeVisible();
    });

    test('should have accessible navigation', async ({ page }) => {
      await expect(page.getByRole('navigation')).toBeVisible();
      await expect(page.getByRole('main')).toBeVisible();
      await expect(page.getByRole('banner')).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should adapt layout for tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await expect(page.getByRole('heading', { name: 'ユーザー詳細' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'プロフィール設定' })).toBeVisible();
    });

    test('should stack columns for mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await expect(page.getByRole('heading', { name: 'プロフィール設定' })).toBeVisible();
      await expect(page.getByRole('heading', { name: '最近のアクティビティ' })).toBeVisible();
    });
  });
});

test.describe('Enterprise User Detail - English', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/enterprise/users/user_001');
    await page.waitForLoadState('networkidle');
  });

  test('should display English content', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1, name: 'User Detail' })).toBeVisible();
  });

  test('should display English action buttons', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Deactivate User' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Save Changes' })).toBeVisible();
  });

  test('should display English section titles', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Profile Settings' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Recent Activity' })).toBeVisible();
  });

  test('should display English form labels', async ({ page }) => {
    await expect(page.getByLabel('Name')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Role')).toBeVisible();
  });

  test('should display English activity events', async ({ page }) => {
    await expect(page.getByText('Logged in')).toBeVisible();
    await expect(page.getByText('Created API key')).toBeVisible();
    await expect(page.getByText('Invited user')).toBeVisible();
    await expect(page.getByText('Updated settings')).toBeVisible();
  });
});
