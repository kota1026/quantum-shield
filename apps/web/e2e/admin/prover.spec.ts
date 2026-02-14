import { test, expect } from '@playwright/test';
import { gotoAndWaitForApp } from '../helpers/wait-for-app';

test.describe('QS Admin Prover Management', () => {
  test.setTimeout(90000);

  test.beforeEach(async ({ page }) => {
    await gotoAndWaitForApp(page, '/ja/admin/prover');
  });

  test('should display page header with title', async ({ page }) => {
    // i18n: admin.prover.title = "Prover Management"
    await expect(page.locator('h1').first()).toContainText('Prover Management');
  });

  test('should display subtitle', async ({ page }) => {
    // i18n: admin.prover.subtitle = "Proverネットワーク監視・管理"
    await expect(page.locator('text=Proverネットワーク監視・管理').first()).toBeVisible();
  });

  test('should have main content area', async ({ page }) => {
    const main = page.locator('[role="main"]');
    await expect(main).toBeVisible();
  });

  test('should display all 4 tabs', async ({ page }) => {
    await expect(page.getByRole('tab', { name: 'All Provers' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Signing Queue' })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Applications/ })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Performance' })).toBeVisible();
  });

  test('should have All Provers tab selected by default', async ({ page }) => {
    const allProversTab = page.getByRole('tab', { name: 'All Provers' });
    await expect(allProversTab).toHaveAttribute('aria-selected', 'true');
  });

  test('should switch tabs on click', async ({ page }) => {
    const queueTab = page.getByRole('tab', { name: 'Signing Queue' });
    await queueTab.click();
    await expect(queueTab).toHaveAttribute('aria-selected', 'true');
  });

  test('should display stat labels', async ({ page }) => {
    await expect(page.locator('text=Active Provers').first()).toBeVisible();
    await expect(page.locator('text=Total Stake').first()).toBeVisible();
    await expect(page.locator('text=Avg SLA').first()).toBeVisible();
    await expect(page.locator('text=Pending Queue').first()).toBeVisible();
  });

  test('should display Prover List table header', async ({ page }) => {
    // i18n: admin.prover.table.title = "Prover List"
    await expect(page.locator('text=Prover List').first()).toBeVisible();
  });

  test('should display table column headers', async ({ page }) => {
    await expect(page.locator('text=Prover ID').first()).toBeVisible();
    await expect(page.locator('text=Operator').first()).toBeVisible();
    await expect(page.locator('text=Status').first()).toBeVisible();
    await expect(page.locator('text=Stake').first()).toBeVisible();
    await expect(page.locator('text=SLA').first()).toBeVisible();
  });

  test('should display prover entries', async ({ page }) => {
    const table = page.locator('table');
    await expect(table.first()).toBeVisible();
    const rows = page.locator('tbody tr');
    await expect(rows.first()).toBeVisible();
  });

  test('should display SLA progress bars', async ({ page }) => {
    const slaBars = page.getByRole('progressbar');
    const count = await slaBars.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('should have proper tab ARIA attributes', async ({ page }) => {
    const tabs = page.getByRole('tab');
    const count = await tabs.count();
    for (let i = 0; i < count; i++) {
      const tab = tabs.nth(i);
      await expect(tab).toHaveAttribute('aria-selected');
    }
  });
});
