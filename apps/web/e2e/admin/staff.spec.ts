import { test, expect } from '@playwright/test';
import { gotoAndWaitForApp } from '../helpers/wait-for-app';

test.describe('QS Admin Staff Management', () => {
  test.setTimeout(90000);

  test.beforeEach(async ({ page }) => {
    await gotoAndWaitForApp(page, '/ja/admin/staff');
  });

  test('should display page header with title', async ({ page }) => {
    // i18n: admin.staff.title = "Staff Management"
    await expect(page.locator('h1').first()).toContainText('Staff Management');
  });

  test('should display subtitle', async ({ page }) => {
    // i18n: admin.staff.subtitle = "スタッフ権限・アクセス管理"
    await expect(page.locator('text=スタッフ権限・アクセス管理').first()).toBeVisible();
  });

  test('should have main content area', async ({ page }) => {
    const main = page.locator('[role="main"]');
    await expect(main).toBeVisible();
  });

  test('should display Add Staff button', async ({ page }) => {
    // i18n: admin.staff.addButton = "Add Staff"
    await expect(page.locator('text=Add Staff').first()).toBeVisible();
  });

  test('should display Staff List card header', async ({ page }) => {
    // i18n: admin.staff.card.title = "Staff List"
    await expect(page.locator('text=Staff List').first()).toBeVisible();
  });

  test('should display table with columns', async ({ page }) => {
    const table = page.locator('table');
    await expect(table.first()).toBeVisible();

    await expect(page.locator('th:has-text("Name")').first()).toBeVisible();
    await expect(page.locator('th:has-text("Role")').first()).toBeVisible();
    await expect(page.locator('th:has-text("Permission")').first()).toBeVisible();
    await expect(page.locator('th:has-text("Status")').first()).toBeVisible();
    await expect(page.locator('th:has-text("Last Active")').first()).toBeVisible();
  });

  test('should display staff rows', async ({ page }) => {
    const rows = page.locator('tbody tr');
    await expect(rows.first()).toBeVisible();
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('should display permission badges', async ({ page }) => {
    // i18n: admin.staff.permission values
    await expect(page.locator('text=Super Admin').first()).toBeVisible();
  });

  test('should display status badges', async ({ page }) => {
    // i18n: admin.staff.status values
    await expect(page.locator('text=Active').first()).toBeVisible();
  });

  test('staff rows should be clickable', async ({ page }) => {
    const firstRow = page.locator('tbody tr').first();
    await expect(firstRow).toHaveAttribute('role', 'button');
    await expect(firstRow).toHaveAttribute('tabindex', '0');
  });

  test('table headers should have scope attribute', async ({ page }) => {
    const headers = page.locator('th[scope="col"]');
    const count = await headers.count();
    expect(count).toBe(5);
  });
});
