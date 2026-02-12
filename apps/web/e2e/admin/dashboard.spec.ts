import { test, expect } from '@playwright/test';
import { gotoAndWaitForApp } from '../helpers/wait-for-app';

test.describe('QS Admin Dashboard', () => {
  test.setTimeout(90000);

  test.beforeEach(async ({ page }) => {
    await gotoAndWaitForApp(page, '/ja/admin/dashboard');
  });

  test('should display page header with title', async ({ page }) => {
    // i18n: admin.integratedDashboard.title = "統合ダッシュボード"
    await expect(page.locator('h1').first()).toContainText('統合ダッシュボード');
  });

  test('should display subtitle', async ({ page }) => {
    // i18n: admin.integratedDashboard.subtitle = "Quantum Shield 全体管理"
    await expect(page.locator('text=Quantum Shield 全体管理').first()).toBeVisible();
  });

  test('should have main content area', async ({ page }) => {
    const main = page.locator('[role="main"]');
    await expect(main).toBeVisible();
  });

  test('should display live indicator', async ({ page }) => {
    // i18n: admin.integratedDashboard.liveIndicator = "リアルタイム更新"
    const statusEl = page.getByRole('status');
    await expect(statusEl).toBeVisible();
    await expect(statusEl).toContainText('リアルタイム更新');
  });

  test('should display emergency button', async ({ page }) => {
    // i18n: admin.integratedDashboard.emergencyButton = "緊急停止"
    await expect(page.locator('text=緊急停止').first()).toBeVisible();
  });

  test('should display tab buttons', async ({ page }) => {
    // i18n: tabs
    await expect(page.locator('text=概要').first()).toBeVisible();
    await expect(page.locator('text=パブリック版').first()).toBeVisible();
    await expect(page.locator('text=企業版SaaS').first()).toBeVisible();
    await expect(page.locator('text=技術譲渡').first()).toBeVisible();
  });

  test('should display overview stat labels', async ({ page }) => {
    // i18n: admin.integratedDashboard.overview
    await expect(page.locator('text=総TVL').first()).toBeVisible();
    await expect(page.locator('text=総ユーザー数').first()).toBeVisible();
    await expect(page.locator('text=総Prover数').first()).toBeVisible();
    await expect(page.locator('text=月間収益').first()).toBeVisible();
  });

  test('should display section cards', async ({ page }) => {
    // i18n: admin.integratedDashboard.publicStats.title, saasStats.title, licenseStats.title
    await expect(page.locator('text=パブリック版').first()).toBeVisible();
    await expect(page.locator('text=企業版SaaS').first()).toBeVisible();
    await expect(page.locator('text=技術譲渡').first()).toBeVisible();
  });

  test('should display alerts section', async ({ page }) => {
    // i18n: admin.integratedDashboard.alerts.title = "要対応アラート"
    await expect(page.locator('text=要対応アラート').first()).toBeVisible();
  });

  test('should display recent activity section', async ({ page }) => {
    // i18n: admin.integratedDashboard.recentActivity.title = "最近のアクティビティ"
    await expect(page.locator('text=最近のアクティビティ').first()).toBeVisible();
  });

  test('should switch to public tab', async ({ page }) => {
    await page.locator('button:has-text("パブリック版")').first().click();
    // i18n: admin.integratedDashboard.publicTab.title = "パブリック版管理"
    await expect(page.locator('text=パブリック版管理').first()).toBeVisible();
  });

  test('should display sidebar navigation', async ({ page }) => {
    const nav = page.locator('nav').first();
    await expect(nav).toBeVisible();
  });
});
