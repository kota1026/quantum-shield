/**
 * Enterprise Settings Page E2E Tests
 *
 * URL: /ja/enterprise/settings
 * Tests page structure, settings tab navigation, organization profile form,
 * billing contact section, accessibility, and English locale.
 * Uses structural assertions rather than hardcoded mock data values.
 *
 * Requires: Frontend on :3000
 */

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

    test('should display main content area', async ({ page }) => {
      await expect(page.getByRole('main', { name: '設定ダッシュボード' })).toBeVisible();
    });

    test('should display top bar with search and user menu', async ({ page }) => {
      await expect(page.getByRole('searchbox', { name: '検索' })).toBeVisible();
      await expect(page.getByRole('link', { name: '通知を表示' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'ユーザーメニューを開く' })).toBeVisible();
    });
  });

  test.describe('Settings Navigation', () => {
    test('should display all six settings tabs', async ({ page }) => {
      const settingsNav = page.getByRole('navigation', { name: '設定ナビゲーション' });
      await expect(settingsNav).toBeVisible();

      await expect(settingsNav.getByRole('button', { name: '組織' })).toBeVisible();
      await expect(settingsNav.getByRole('button', { name: 'ブランディング' })).toBeVisible();
      await expect(settingsNav.getByRole('button', { name: '通知' })).toBeVisible();
      await expect(settingsNav.getByRole('button', { name: '環境管理' })).toBeVisible();
      await expect(settingsNav.getByRole('button', { name: '開発者' })).toBeVisible();
      await expect(settingsNav.getByRole('button', { name: 'ライセンス' })).toBeVisible();
    });

    test('should default to organization tab', async ({ page }) => {
      const orgButton = page.getByRole('navigation', { name: '設定ナビゲーション' })
        .getByRole('button', { name: '組織' });
      await expect(orgButton).toHaveAttribute('aria-current', 'page');
    });

    test('should switch to branding tab when clicked', async ({ page }) => {
      const settingsNav = page.getByRole('navigation', { name: '設定ナビゲーション' });
      await settingsNav.getByRole('button', { name: 'ブランディング' }).click();

      // Branding tab content should appear
      await expect(page.getByRole('heading', { level: 2 }).first()).toBeVisible();
    });

    test('should switch to developer tab when clicked', async ({ page }) => {
      const settingsNav = page.getByRole('navigation', { name: '設定ナビゲーション' });
      await settingsNav.getByRole('button', { name: '開発者' }).click();

      // Developer tab content should appear
      await expect(page.getByRole('heading', { level: 2 }).first()).toBeVisible();
    });
  });

  test.describe('Organization Tab', () => {
    test('should display organization profile heading', async ({ page }) => {
      await expect(page.getByRole('heading', { name: '組織プロファイル' })).toBeVisible();
    });

    test('should display profile description', async ({ page }) => {
      await expect(page.getByText('組織の基本情報を設定します。')).toBeVisible();
    });

    test('should display organization name input', async ({ page }) => {
      const orgNameInput = page.getByRole('textbox', { name: /組織名/ });
      await expect(orgNameInput).toBeVisible();
      await expect(orgNameInput).toBeEditable();
    });

    test('should display organization ID as disabled', async ({ page }) => {
      const orgIdInput = page.getByRole('textbox', { name: '組織ID' });
      await expect(orgIdInput).toBeVisible();
      await expect(orgIdInput).toBeDisabled();
    });

    test('should display website input', async ({ page }) => {
      const websiteInput = page.getByRole('textbox', { name: 'ウェブサイト' });
      await expect(websiteInput).toBeVisible();
      await expect(websiteInput).toBeEditable();
    });

    test('should display industry combobox', async ({ page }) => {
      const industrySelect = page.getByRole('combobox', { name: '業種' });
      await expect(industrySelect).toBeVisible();
    });

    test('should display employee count combobox', async ({ page }) => {
      const employeeSelect = page.getByRole('combobox', { name: '従業員数' });
      await expect(employeeSelect).toBeVisible();
    });

    test('should display address input', async ({ page }) => {
      const addressInput = page.getByRole('textbox', { name: '住所' });
      await expect(addressInput).toBeVisible();
      await expect(addressInput).toBeEditable();
    });
  });

  test.describe('Billing Contact', () => {
    test('should display billing contact heading', async ({ page }) => {
      await expect(page.getByRole('heading', { name: '請求先情報' })).toBeVisible();
    });

    test('should display contact name input', async ({ page }) => {
      const contactNameInput = page.getByRole('textbox', { name: '担当者名' });
      await expect(contactNameInput).toBeVisible();
      await expect(contactNameInput).toBeEditable();
    });

    test('should display email input', async ({ page }) => {
      const emailInput = page.getByRole('textbox', { name: 'メールアドレス' });
      await expect(emailInput).toBeVisible();
      await expect(emailInput).toBeEditable();
    });

    test('should display phone input', async ({ page }) => {
      const phoneInput = page.getByRole('textbox', { name: '電話番号' });
      await expect(phoneInput).toBeVisible();
      await expect(phoneInput).toBeEditable();
    });
  });

  test.describe('Accessibility', () => {
    test('should have exactly one h1 heading', async ({ page }) => {
      const h1Count = await page.locator('h1').count();
      expect(h1Count).toBe(1);
    });

    test('should have multiple h2 section headings', async ({ page }) => {
      const h2Count = await page.locator('h2').count();
      expect(h2Count).toBeGreaterThanOrEqual(2);
    });

    test('should have accessible navigation elements', async ({ page }) => {
      // Multiple nav elements exist (sidebar + settings nav); use .first()
      await expect(page.getByRole('navigation').first()).toBeVisible();
      await expect(page.getByRole('main')).toBeVisible();
    });

    test('should have settings navigation with aria-label', async ({ page }) => {
      await expect(
        page.getByRole('navigation', { name: '設定ナビゲーション' })
      ).toBeVisible();
    });

    test('should mark active tab with aria-current', async ({ page }) => {
      const activeTab = page.getByRole('navigation', { name: '設定ナビゲーション' })
        .locator('button[aria-current="page"]');
      await expect(activeTab).toHaveCount(1);
    });
  });
});

test.describe('Enterprise Settings - English', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/enterprise/settings');
    await page.waitForLoadState('networkidle');
  });

  test('should display English page title', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1, name: 'Settings' })).toBeVisible();
  });

  test('should display English settings tabs', async ({ page }) => {
    const settingsNav = page.getByRole('navigation', { name: 'Settings navigation' });
    await expect(settingsNav).toBeVisible();

    await expect(settingsNav.getByRole('button', { name: 'Organization' })).toBeVisible();
    await expect(settingsNav.getByRole('button', { name: 'Branding' })).toBeVisible();
    await expect(settingsNav.getByRole('button', { name: 'Notifications' })).toBeVisible();
    await expect(settingsNav.getByRole('button', { name: 'Environments' })).toBeVisible();
    await expect(settingsNav.getByRole('button', { name: 'Developer' })).toBeVisible();
    await expect(settingsNav.getByRole('button', { name: 'License' })).toBeVisible();
  });

  test('should display English section headings on organization tab', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Organization Profile' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Billing Contact' })).toBeVisible();
  });
});
