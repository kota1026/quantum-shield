import { test, expect } from '@playwright/test';
import { gotoAndWaitForApp } from '../helpers/wait-for-app';

test.describe('QS Admin Reports', () => {
  test.setTimeout(90000);

  test.beforeEach(async ({ page }) => {
    await gotoAndWaitForApp(page, '/ja/admin/reports');
  });

  test('should display page header with title', async ({ page }) => {
    // i18n: admin.reports.title = "Reports"
    await expect(page.locator('h1').first()).toContainText('Reports');
  });

  test('should display subtitle', async ({ page }) => {
    // i18n: admin.reports.subtitle = "システムレポート・分析"
    await expect(page.locator('text=システムレポート・分析').first()).toBeVisible();
  });

  test('should have main content area', async ({ page }) => {
    const main = page.locator('[role="main"]');
    await expect(main).toBeVisible();
  });

  test('should display Export All button', async ({ page }) => {
    // i18n: admin.reports.exportButton = "Export All"
    await expect(page.locator('text=Export All').first()).toBeVisible();
  });

  test('should display all 4 report cards', async ({ page }) => {
    // i18n: admin.reports.types
    await expect(page.locator('text=Daily Report').first()).toBeVisible();
    await expect(page.locator('text=Weekly Report').first()).toBeVisible();
    await expect(page.locator('text=Monthly Report').first()).toBeVisible();
    await expect(page.locator('text=Revenue Report').first()).toBeVisible();
  });

  test('should display report descriptions', async ({ page }) => {
    await expect(page.locator('text=過去24時間のトランザクション').first()).toBeVisible();
    await expect(page.locator('text=週次サマリー').first()).toBeVisible();
  });

  test('should display Today Summary card', async ({ page }) => {
    // i18n: admin.reports.summary.title = "Today's Summary"
    await expect(page.locator("text=Today's Summary").first()).toBeVisible();
  });

  test('should display summary metric labels', async ({ page }) => {
    await expect(page.locator('text=Total Transactions').first()).toBeVisible();
    await expect(page.locator('text=TVL Change').first()).toBeVisible();
    await expect(page.locator('text=Avg Prover SLA').first()).toBeVisible();
    await expect(page.locator('text=Security Incidents').first()).toBeVisible();
  });

  test('report cards should be clickable', async ({ page }) => {
    const dailyReport = page.locator('[role="button"]:has-text("Daily Report")').first();
    await expect(dailyReport).toBeVisible();
  });

  test('should have reports list with aria-label', async ({ page }) => {
    const reportList = page.locator('[role="list"]');
    await expect(reportList.first()).toBeVisible();
  });
});
