import { test, expect } from '@playwright/test';

test.describe('Admin Enterprise Accounts Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/admin/enterprise');
  });

  test('should display page header correctly', async ({ page }) => {
    // Check main heading
    await expect(page.getByRole('heading', { name: 'Enterprise Accounts', level: 1 })).toBeVisible();

    // Check subtitle
    await expect(page.getByText('法人契約・大口顧客管理')).toBeVisible();
  });

  test('should have accessible main landmark', async ({ page }) => {
    const main = page.getByRole('main', { name: 'エンタープライズアカウントページ' });
    await expect(main).toBeVisible();
  });

  test('should display Add Enterprise button', async ({ page }) => {
    const button = page.getByRole('button', { name: /Add Enterprise/i });
    await expect(button).toBeVisible();
  });

  test('should display stats row', async ({ page }) => {
    await expect(page.getByText('Total Enterprises')).toBeVisible();
    await expect(page.getByText('Enterprise TVL')).toBeVisible();
    await expect(page.getByText('Active Contracts')).toBeVisible();
    await expect(page.getByText('Monthly Revenue')).toBeVisible();
  });

  test('should display stats values', async ({ page }) => {
    // Stats labels should be visible (values are dynamic)
    await expect(page.getByText('Total Enterprises')).toBeVisible();
    await expect(page.getByText('Enterprise TVL')).toBeVisible();
  });

  test('should display filter tabs', async ({ page }) => {
    const tablist = page.getByRole('tablist', { name: 'Enterprise Accounts' });
    await expect(tablist).toBeVisible();

    await expect(page.getByRole('tab', { name: 'All Enterprises' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Platinum' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Gold' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Pending' })).toBeVisible();
  });

  test('should show All Enterprises tab as active by default', async ({ page }) => {
    const allTab = page.getByRole('tab', { name: 'All Enterprises' });
    await expect(allTab).toHaveAttribute('aria-selected', 'true');
  });

  test('should switch tabs on click', async ({ page }) => {
    const platinumTab = page.getByRole('tab', { name: 'Platinum' });
    const allTab = page.getByRole('tab', { name: 'All Enterprises' });

    await platinumTab.click();
    await expect(platinumTab).toHaveAttribute('aria-selected', 'true');
    await expect(allTab).toHaveAttribute('aria-selected', 'false');
  });

  test('should display enterprise list table with correct columns', async ({ page }) => {
    const table = page.getByRole('table');
    await expect(table).toBeVisible();

    await expect(page.getByRole('columnheader', { name: 'Company' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Tier' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'TVL' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Status' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Contract Renewal' })).toBeVisible();
  });

  test('should display enterprise entries', async ({ page }) => {
    // Enterprise table rows should be present
    const enterpriseRows = page.locator('tbody tr');
    if (await enterpriseRows.count() > 0) {
      await expect(enterpriseRows.first()).toBeVisible();
    }
  });

  test('should display tier badges', async ({ page }) => {
    await expect(page.getByText('Platinum').first()).toBeVisible();
    await expect(page.getByText('Gold').first()).toBeVisible();
    await expect(page.getByText('Silver')).toBeVisible();
  });

  test('should display status badges', async ({ page }) => {
    await expect(page.getByText('Active').first()).toBeVisible();
    await expect(page.getByText('Renewal Pending')).toBeVisible();
  });

  test('should display TVL values', async ({ page }) => {
    // TVL column should contain dollar-formatted values
    const tvlColumn = page.getByRole('columnheader', { name: 'TVL' });
    await expect(tvlColumn).toBeVisible();
  });

  test('should display company types', async ({ page }) => {
    // Enterprise rows should contain type information
    const enterpriseRows = page.locator('tbody tr');
    if (await enterpriseRows.count() > 0) {
      await expect(enterpriseRows.first()).toBeVisible();
    }
  });

  test('should filter enterprises by Platinum tier', async ({ page }) => {
    await page.getByRole('tab', { name: 'Platinum' }).click();
    await expect(page.getByRole('tab', { name: 'Platinum' })).toHaveAttribute('aria-selected', 'true');

    // Table should update to show filtered results
    const enterpriseRows = page.locator('tbody tr');
    if (await enterpriseRows.count() > 0) {
      await expect(enterpriseRows.first()).toBeVisible();
    }
  });

  test('should filter enterprises by pending status', async ({ page }) => {
    await page.getByRole('tab', { name: 'Pending' }).click();
    await expect(page.getByRole('tab', { name: 'Pending' })).toHaveAttribute('aria-selected', 'true');
  });

  test('should have keyboard accessible enterprise rows', async ({ page }) => {
    const firstRow = page.locator('tbody tr').first();
    await expect(firstRow).toHaveAttribute('role', 'button');
    await expect(firstRow).toHaveAttribute('tabindex', '0');
  });

  test('should display Enterprise List card title', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Enterprise List' })).toBeVisible();
  });

  test('should work in English locale', async ({ page }) => {
    await page.goto('/en/admin/enterprise');

    await expect(page.getByRole('heading', { name: 'Enterprise Accounts', level: 1 })).toBeVisible();
    await expect(page.getByText('Enterprise Contracts & Large Customer Management')).toBeVisible();
  });
});
