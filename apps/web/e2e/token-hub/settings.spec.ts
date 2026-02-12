import { test, expect } from '@playwright/test';
import { gotoAndWaitForApp } from '../helpers/wait-for-app';

test.setTimeout(90000);

test.describe('Token Hub Settings', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAndWaitForApp(page, '/ja/token-hub/settings');
  });

  test.describe('Page Load & Layout', () => {
    test('should display page title', async ({ page }) => {
      await expect(page.getByRole('heading', { name: '設定' })).toBeVisible();
    });

    test('should display back to dashboard link', async ({ page }) => {
      const backLink = page.locator('a[href*="token-hub/dashboard"]').first();
      await expect(backLink).toBeVisible();
    });
  });

  test.describe('Account Section', () => {
    test('should display account section heading', async ({ page }) => {
      await expect(page.getByText('アカウント')).toBeVisible();
    });

    test('should display connected wallet item', async ({ page }) => {
      await expect(page.getByText('接続中のウォレット')).toBeVisible();
    });

    test('should display lock positions item', async ({ page }) => {
      await expect(page.getByText('ロックポジション')).toBeVisible();
    });

    test('should display delegations item', async ({ page }) => {
      await expect(page.getByText('委任の管理')).toBeVisible();
    });
  });

  test.describe('Notifications Section', () => {
    test('should display notifications section heading', async ({ page }) => {
      await expect(page.getByText('通知')).toBeVisible();
    });

    test('should display push notifications item', async ({ page }) => {
      await expect(page.getByText('プッシュ通知')).toBeVisible();
    });

    test('should display email notifications item', async ({ page }) => {
      await expect(page.getByText('メール通知')).toBeVisible();
    });

    test('should display vote reminders item', async ({ page }) => {
      await expect(page.getByText('投票リマインダー')).toBeVisible();
    });
  });

  test.describe('Rewards Section', () => {
    test('should display rewards section heading', async ({ page }) => {
      await expect(page.getByText('報酬設定')).toBeVisible();
    });

    test('should display auto compound item', async ({ page }) => {
      await expect(page.getByText('報酬の自動複利')).toBeVisible();
    });
  });

  test.describe('Display Section', () => {
    test('should display display section heading', async ({ page }) => {
      await expect(page.getByText('表示').first()).toBeVisible();
    });

    test('should display dark mode item', async ({ page }) => {
      await expect(page.getByText('ダークモード')).toBeVisible();
    });

    test('should display language item', async ({ page }) => {
      await expect(page.getByText('言語')).toBeVisible();
    });

    test('should display currency item', async ({ page }) => {
      await expect(page.getByText('表示通貨')).toBeVisible();
    });
  });

  test.describe('Support Section', () => {
    test('should display support section heading', async ({ page }) => {
      await expect(page.getByText('サポート')).toBeVisible();
    });

    test('should display FAQ item', async ({ page }) => {
      await expect(page.getByText('よくある質問')).toBeVisible();
    });

    test('should display contact item', async ({ page }) => {
      await expect(page.getByText('お問い合わせ')).toBeVisible();
    });

    test('should display legal item', async ({ page }) => {
      await expect(page.getByText('法的情報')).toBeVisible();
    });
  });

  test.describe('Danger Zone', () => {
    test('should display danger zone heading', async ({ page }) => {
      await expect(page.getByText('危険な操作')).toBeVisible();
    });

    test('should display disconnect wallet item', async ({ page }) => {
      await expect(page.getByText('ウォレットを切断')).toBeVisible();
    });
  });

  test.describe('Version Info', () => {
    test('should display version label', async ({ page }) => {
      await expect(page.getByText('Token Hub バージョン')).toBeVisible();
    });

    test('should display version number', async ({ page }) => {
      await expect(page.getByText(/v1\.0\.0/)).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await expect(page.getByRole('heading', { name: '設定' })).toBeVisible();
      await expect(page.getByText('アカウント')).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      const h1 = page.getByRole('heading', { level: 1 });
      await expect(h1).toBeVisible();
    });

    test('should have toggle switches for notification settings', async ({ page }) => {
      const toggles = page.locator('button[role="switch"]');
      const count = await toggles.count();
      expect(count).toBeGreaterThanOrEqual(1);
    });
  });
});
