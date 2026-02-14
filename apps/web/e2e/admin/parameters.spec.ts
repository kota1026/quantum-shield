import { test, expect } from '@playwright/test';
import { gotoAndWaitForApp } from '../helpers/wait-for-app';

test.describe('Admin Protocol Parameters Page', () => {
  test.setTimeout(90000);

  test.beforeEach(async ({ page }) => {
    await gotoAndWaitForApp(page, '/ja/admin/parameters');
  });

  test('should display page header with title', async ({ page }) => {
    // i18n: admin.parameters.title = "Protocol Parameters"
    await expect(page.locator('h1').first()).toContainText('Protocol Parameters');
  });

  test('should display subtitle', async ({ page }) => {
    // i18n: admin.parameters.subtitle = "プロトコルパラメータ管理・変更リクエスト"
    await expect(page.locator('text=プロトコルパラメータ管理・変更リクエスト').first()).toBeVisible();
  });

  test('should have main content area', async ({ page }) => {
    const main = page.locator('[role="main"]');
    await expect(main).toBeVisible();
  });

  test('should display Request Change button', async ({ page }) => {
    // i18n: admin.parameters.requestChangeButton = "Request Change"
    await expect(page.locator('text=Request Change').first()).toBeVisible();
  });

  test('should display info banner about governance approval', async ({ page }) => {
    const alert = page.getByRole('alert');
    await expect(alert).toBeVisible();
    // i18n: admin.parameters.infoBanner contains "ガバナンス承認が必要"
    await expect(alert).toContainText('ガバナンス承認が必要');
  });

  test('should display all four parameter categories', async ({ page }) => {
    await expect(page.locator('text=Time Lock Parameters').first()).toBeVisible();
    await expect(page.locator('text=Prover Parameters').first()).toBeVisible();
    await expect(page.locator('text=Fee Parameters').first()).toBeVisible();
    await expect(page.locator('text=Security Parameters').first()).toBeVisible();
  });

  test('should display Time Lock parameter names', async ({ page }) => {
    await expect(page.locator('text=Minimum Lock Period').first()).toBeVisible();
    await expect(page.locator('text=Maximum Lock Period').first()).toBeVisible();
    await expect(page.locator('text=Early Unlock Penalty').first()).toBeVisible();
  });

  test('should display Prover parameter names', async ({ page }) => {
    await expect(page.locator('text=Minimum Stake').first()).toBeVisible();
    await expect(page.locator('text=SLA Target').first()).toBeVisible();
    await expect(page.locator('text=Slashing Rate').first()).toBeVisible();
  });

  test('should display Fee parameter names', async ({ page }) => {
    await expect(page.locator('text=Lock Fee').first()).toBeVisible();
    await expect(page.locator('text=Unlock Fee').first()).toBeVisible();
    await expect(page.locator('text=Enterprise Discount').first()).toBeVisible();
  });

  test('should display Security parameter names', async ({ page }) => {
    await expect(page.locator('text=Challenge Period').first()).toBeVisible();
    await expect(page.locator('text=Multi-sig Threshold').first()).toBeVisible();
    await expect(page.locator('text=Quantum Algorithm').first()).toBeVisible();
  });

  test('should display Locked badges', async ({ page }) => {
    // i18n: admin.parameters.badge.locked = "Locked"
    await expect(page.locator('text=Locked').first()).toBeVisible();
  });

  test('should display Adjustable badges', async ({ page }) => {
    // i18n: admin.parameters.badge.adjustable = "Adjustable"
    await expect(page.locator('text=Adjustable').first()).toBeVisible();
  });

  test('should display History links', async ({ page }) => {
    // i18n: admin.parameters.historyLink = "History →"
    const historyLinks = page.locator('text=History →');
    const count = await historyLinks.count();
    expect(count).toBe(4);
  });

  test('should have keyboard accessible parameter items', async ({ page }) => {
    const paramItem = page.locator('[role="button"]').first();
    await expect(paramItem).toHaveAttribute('tabindex', '0');
  });
});
