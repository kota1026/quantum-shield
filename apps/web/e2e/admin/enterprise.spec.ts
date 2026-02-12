import { test, expect } from '@playwright/test';
import { gotoAndWaitForApp } from '../helpers/wait-for-app';

test.describe('Admin Enterprise Accounts Page', () => {
  test.setTimeout(90000);

  test.beforeEach(async ({ page }) => {
    await gotoAndWaitForApp(page, '/ja/admin/enterprise');
  });

  test('should display page header with title', async ({ page }) => {
    // i18n: admin.enterprise.title = "Enterprise Accounts"
    await expect(page.locator('h1').first()).toContainText('Enterprise Accounts');
  });

  test('should display subtitle', async ({ page }) => {
    // i18n: admin.enterprise.subtitle = "法人契約・大口顧客管理"
    await expect(page.locator('text=法人契約・大口顧客管理').first()).toBeVisible();
  });

  test('should have main content area', async ({ page }) => {
    const main = page.locator('[role="main"]');
    await expect(main).toBeVisible();
  });

  test('should display Add Enterprise button', async ({ page }) => {
    // i18n: admin.enterprise.addButton = "Add Enterprise"
    await expect(page.locator('text=Add Enterprise').first()).toBeVisible();
  });

  test('should display stats labels', async ({ page }) => {
    await expect(page.locator('text=Total Enterprises').first()).toBeVisible();
    await expect(page.locator('text=Enterprise TVL').first()).toBeVisible();
    await expect(page.locator('text=Active Contracts').first()).toBeVisible();
    await expect(page.locator('text=Monthly Revenue').first()).toBeVisible();
  });

  test('should display filter tabs', async ({ page }) => {
    await expect(page.locator('text=All Enterprises').first()).toBeVisible();
    await expect(page.locator('text=Platinum').first()).toBeVisible();
    await expect(page.locator('text=Gold').first()).toBeVisible();
    await expect(page.locator('text=Pending').first()).toBeVisible();
  });

  test('should show All Enterprises tab as active by default', async ({ page }) => {
    const allTab = page.getByRole('tab', { name: 'All Enterprises' });
    await expect(allTab).toHaveAttribute('aria-selected', 'true');
  });

  test('should switch tabs on click', async ({ page }) => {
    const platinumTab = page.getByRole('tab', { name: 'Platinum' });
    await platinumTab.click();
    await expect(platinumTab).toHaveAttribute('aria-selected', 'true');
  });

  test('should display enterprise list table', async ({ page }) => {
    const table = page.locator('table');
    await expect(table.first()).toBeVisible();
  });

  test('should display table column headers', async ({ page }) => {
    await expect(page.locator('th:has-text("Company")').first()).toBeVisible();
    await expect(page.locator('th:has-text("Tier")').first()).toBeVisible();
    await expect(page.locator('th:has-text("TVL")').first()).toBeVisible();
    await expect(page.locator('th:has-text("Status")').first()).toBeVisible();
    await expect(page.locator('th:has-text("Contract Renewal")').first()).toBeVisible();
  });

  test('should display enterprise entries in table', async ({ page }) => {
    const rows = page.locator('tbody tr');
    await expect(rows.first()).toBeVisible();
  });

  test('should display Enterprise List card title', async ({ page }) => {
    await expect(page.locator('text=Enterprise List').first()).toBeVisible();
  });

  test('should have keyboard accessible enterprise rows', async ({ page }) => {
    const firstRow = page.locator('tbody tr').first();
    await expect(firstRow).toHaveAttribute('role', 'button');
    await expect(firstRow).toHaveAttribute('tabindex', '0');
  });
});
