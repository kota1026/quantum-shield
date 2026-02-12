import { test, expect } from '@playwright/test';
import { gotoAndWaitForApp } from '../helpers/wait-for-app';

test.describe('QS Admin Emergency Operations', () => {
  test.setTimeout(90000);

  test.beforeEach(async ({ page }) => {
    await gotoAndWaitForApp(page, '/ja/admin/emergency');
  });

  test('should display page header with title', async ({ page }) => {
    // i18n: admin.emergency.title = "Emergency Operations"
    await expect(page.locator('h1').first()).toContainText('Emergency Operations');
  });

  test('should display subtitle', async ({ page }) => {
    // i18n: admin.emergency.subtitle = "システム緊急停止・復旧管理"
    await expect(page.locator('text=システム緊急停止・復旧管理').first()).toBeVisible();
  });

  test('should have main content area', async ({ page }) => {
    const main = page.locator('[role="main"]');
    await expect(main).toBeVisible();
  });

  test('should display operational status banner', async ({ page }) => {
    const statusBanner = page.getByRole('status');
    await expect(statusBanner).toBeVisible();
    // i18n: admin.emergency.status.operational = "System Operational"
    await expect(statusBanner).toContainText('System Operational');
  });

  test('should display emergency pause card', async ({ page }) => {
    // i18n: admin.emergency.pauseControl.title = "Emergency Pause"
    await expect(page.locator('text=Emergency Pause').first()).toBeVisible();
  });

  test('should display execute pause button', async ({ page }) => {
    // i18n: admin.emergency.pauseControl.executeButton = "Execute Emergency Pause"
    await expect(page.locator('text=Execute Emergency Pause').first()).toBeVisible();
  });

  test('should display warning box', async ({ page }) => {
    // i18n: admin.emergency.pauseControl.warning.title = "重要な注意事項"
    await expect(page.locator('text=重要な注意事項').first()).toBeVisible();
  });

  test('should display pre-pause checklist', async ({ page }) => {
    // i18n: admin.emergency.checklist.title = "Pre-Pause Checklist"
    await expect(page.locator('text=Pre-Pause Checklist').first()).toBeVisible();
  });

  test('should display checklist items as checkboxes', async ({ page }) => {
    const checkboxes = page.getByRole('checkbox');
    const count = await checkboxes.count();
    expect(count).toBeGreaterThanOrEqual(5);
  });

  test('checklist items should be toggleable', async ({ page }) => {
    const firstCheckbox = page.getByRole('checkbox').first();
    await expect(firstCheckbox).toHaveAttribute('aria-checked', 'false');
    await firstCheckbox.click();
    await expect(firstCheckbox).toHaveAttribute('aria-checked', 'true');
    await firstCheckbox.click();
    await expect(firstCheckbox).toHaveAttribute('aria-checked', 'false');
  });

  test('should display recovery procedures', async ({ page }) => {
    // i18n: admin.emergency.recovery.title = "Recovery Procedures"
    await expect(page.locator('text=Recovery Procedures').first()).toBeVisible();
  });

  test('should display all 6 recovery steps', async ({ page }) => {
    const steps = page.locator('article[aria-label^="Step"]');
    await expect(steps).toHaveCount(6);
  });

  test('should display pause history', async ({ page }) => {
    // i18n: admin.emergency.history.title = "Pause History"
    await expect(page.locator('text=Pause History').first()).toBeVisible();
  });

  test('should open confirmation modal on execute click', async ({ page }) => {
    const executeBtn = page.locator('button:has-text("Execute Emergency Pause")').first();
    await executeBtn.click();
    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();
    // i18n: admin.emergency.modal.title = "Confirm Emergency Pause"
    await expect(modal.locator('text=Confirm Emergency Pause')).toBeVisible();
  });

  test('should close modal on cancel', async ({ page }) => {
    await page.locator('button:has-text("Execute Emergency Pause")').first().click();
    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();
    await modal.locator('button:has-text("Cancel")').click();
    await expect(modal).not.toBeVisible();
  });

  test('should close modal on Escape key', async ({ page }) => {
    await page.locator('button:has-text("Execute Emergency Pause")').first().click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('should show error with incorrect confirmation text', async ({ page }) => {
    await page.locator('button:has-text("Execute Emergency Pause")').first().click();
    const modal = page.getByRole('dialog');
    const input = modal.locator('input[type="text"]');
    await input.fill('WRONG');
    await modal.locator('button:has-text("Execute Pause")').click();
    await expect(modal).toBeVisible();
  });

  test('should execute pause with correct confirmation text', async ({ page }) => {
    await page.locator('button:has-text("Execute Emergency Pause")').first().click();
    const modal = page.getByRole('dialog');
    await modal.locator('input[type="text"]').fill('PAUSE');
    await modal.locator('button:has-text("Execute Pause")').click();
    await expect(modal).not.toBeVisible();
    // Status should change to paused
    const statusBanner = page.getByRole('status');
    await expect(statusBanner).toContainText('System Paused');
  });
});
