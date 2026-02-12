import { test, expect } from '@playwright/test';
import { gotoAndWaitForApp } from '../helpers/wait-for-app';

test.setTimeout(90000);

test.describe('Token Hub Consumer Link', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAndWaitForApp(page, '/ja/token-hub/consumer-link');
  });

  test.describe('Page Load & Layout', () => {
    test('should display main content area', async ({ page }) => {
      await expect(page.getByRole('main')).toBeVisible();
    });

    test('should display page title', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'アプリ連携' })).toBeVisible();
    });

    test('should display page subtitle', async ({ page }) => {
      await expect(page.getByText('Consumer AppとToken Hubの使い分け')).toBeVisible();
    });

    test('should display back to dashboard link', async ({ page }) => {
      const backLink = page.locator('a[href*="token-hub/dashboard"]').first();
      await expect(backLink).toBeVisible();
    });
  });

  test.describe('Consumer App Card', () => {
    test('should display Consumer App heading', async ({ page }) => {
      await expect(page.getByText('Consumer App').first()).toBeVisible();
    });

    test('should display Consumer App subtitle', async ({ page }) => {
      await expect(page.getByText('資産保護アプリ')).toBeVisible();
    });

    test('should display Consumer App features', async ({ page }) => {
      await expect(page.getByText('資産をロック')).toBeVisible();
      await expect(page.getByText('アンロック')).toBeVisible();
      await expect(page.getByText('緊急アンロック')).toBeVisible();
      await expect(page.getByText('取引履歴')).toBeVisible();
    });

    test('should display Consumer App CTA button', async ({ page }) => {
      await expect(page.getByText('Consumer Appを開く')).toBeVisible();
    });

    test('should have Consumer App features list with aria-label', async ({ page }) => {
      const featuresList = page.locator('ul[aria-label]').first();
      await expect(featuresList).toBeVisible();
    });
  });

  test.describe('Token Hub Card', () => {
    test('should display Token Hub heading', async ({ page }) => {
      await expect(page.locator('#token-hub-heading')).toBeVisible();
    });

    test('should display Token Hub subtitle', async ({ page }) => {
      await expect(page.getByText('ガバナンスアプリ')).toBeVisible();
    });

    test('should display current app badge', async ({ page }) => {
      await expect(page.getByText('現在のアプリ')).toBeVisible();
    });

    test('should display Token Hub features', async ({ page }) => {
      await expect(page.getByText('veQSを獲得')).toBeVisible();
      await expect(page.getByText('ガバナンス投票')).toBeVisible();
      await expect(page.getByText('投票権の委任')).toBeVisible();
      await expect(page.getByText('報酬を請求')).toBeVisible();
    });

    test('should display Token Hub CTA button', async ({ page }) => {
      await expect(page.getByText('Token Hubダッシュボード')).toBeVisible();
    });
  });

  test.describe('Connection Section', () => {
    test('should display connection heading', async ({ page }) => {
      await expect(page.getByText('2つのアプリは連携しています')).toBeVisible();
    });

    test('should display connection description', async ({ page }) => {
      const description = page.locator('[aria-labelledby="connection-heading"] p');
      await expect(description).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await expect(page.getByRole('main')).toBeVisible();
      await expect(page.getByRole('heading', { name: 'アプリ連携' })).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper ARIA landmarks', async ({ page }) => {
      await expect(page.getByRole('main')).toBeVisible();
    });

    test('should have sections with aria-labelledby', async ({ page }) => {
      await expect(page.locator('[aria-labelledby="consumer-app-heading"]')).toBeVisible();
      await expect(page.locator('[aria-labelledby="token-hub-heading"]')).toBeVisible();
      await expect(page.locator('[aria-labelledby="connection-heading"]')).toBeVisible();
    });
  });
});
