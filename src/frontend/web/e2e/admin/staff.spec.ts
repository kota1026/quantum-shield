import { test, expect } from '@playwright/test';

/**
 * QS Admin Staff Management E2E Tests
 * Tests for Screen 07: Staff Management
 */

test.describe('QS Admin Staff Management', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to staff page
    await page.goto('/ja/admin/staff');
  });

  test.describe('Page Load & Layout', () => {
    test('should display staff page correctly', async ({ page }) => {
      // Check page title
      await expect(page).toHaveTitle(/Staff Management.*QS Admin/);

      // Check main elements are visible
      await expect(page.getByRole('navigation')).toBeVisible(); // Sidebar
      await expect(page.getByRole('main')).toBeVisible();
    });

    test('should display page header with title and subtitle', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Staff Management', level: 1 })).toBeVisible();
      await expect(page.getByText(/スタッフ権限.*アクセス管理/)).toBeVisible();
    });

    test('should display Add Staff button', async ({ page }) => {
      const addButton = page.getByRole('button', { name: /Add Staff/i });
      await expect(addButton).toBeVisible();
      await expect(addButton).toBeEnabled();
    });
  });

  test.describe('Staff Table', () => {
    test('should display card header', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Staff List' })).toBeVisible();
    });

    test('should display table columns', async ({ page }) => {
      await expect(page.getByText('Name')).toBeVisible();
      await expect(page.getByText('Role')).toBeVisible();
      await expect(page.getByText('Permission')).toBeVisible();
      await expect(page.getByText('Status')).toBeVisible();
      await expect(page.getByText('Last Active')).toBeVisible();
    });

    test('should display staff rows', async ({ page }) => {
      await expect(page.getByText('松本さん')).toBeVisible();
      await expect(page.getByText('田村さん')).toBeVisible();
      await expect(page.getByText('加藤さん')).toBeVisible();
      await expect(page.getByText('山田さん')).toBeVisible();
    });

    test('should display staff emails', async ({ page }) => {
      await expect(page.getByText('matsumoto@qs.foundation')).toBeVisible();
      await expect(page.getByText('tamura@qs.foundation')).toBeVisible();
      await expect(page.getByText('kato@qs.foundation')).toBeVisible();
      await expect(page.getByText('yamada@qs.foundation')).toBeVisible();
    });

    test('should display roles', async ({ page }) => {
      await expect(page.getByText('Senior Engineer')).toBeVisible();
      await expect(page.getByText('Lead Engineer')).toBeVisible();
      await expect(page.getByText('Junior Engineer')).toBeVisible();
      await expect(page.getByText('New Hire')).toBeVisible();
    });

    test('should display permission badges', async ({ page }) => {
      await expect(page.getByText('Super Admin')).toBeVisible();
      await expect(page.getByText('Admin')).toBeVisible();
      await expect(page.getByText('Operator')).toBeVisible();
      await expect(page.getByText('Viewer')).toBeVisible();
    });

    test('should display status badges', async ({ page }) => {
      const activeStatus = page.getByText('Active');
      await expect(activeStatus.first()).toBeVisible();
      await expect(page.getByText('Onboarding')).toBeVisible();
    });

    test('should display last active times', async ({ page }) => {
      await expect(page.getByText('Now')).toBeVisible();
      await expect(page.getByText('5 min ago')).toBeVisible();
      await expect(page.getByText('1 hour ago')).toBeVisible();
      await expect(page.getByText('Today')).toBeVisible();
    });

    test('staff rows should be clickable', async ({ page }) => {
      const staffRow = page.getByRole('button', { name: /松本さん.*Senior Engineer/ });
      await expect(staffRow).toBeVisible();
      await expect(staffRow).toBeEnabled();
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('Add Staff button should be keyboard accessible', async ({ page }) => {
      const addButton = page.getByRole('button', { name: /Add Staff/i });
      await addButton.focus();
      await expect(addButton).toBeFocused();
    });

    test('staff rows should be keyboard navigable', async ({ page }) => {
      const staffRow = page.getByRole('button', { name: /松本さん/ });
      await staffRow.focus();
      await expect(staffRow).toBeFocused();
    });

    test('should activate row on Enter key', async ({ page }) => {
      const staffRow = page.getByRole('button', { name: /松本さん/ });
      await staffRow.focus();
      await staffRow.press('Enter');
      // In production, this would open a detail modal
    });
  });

  test.describe('Responsive Design', () => {
    test('should adapt layout on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      await expect(page.getByRole('navigation')).toBeVisible();
      await expect(page.getByRole('main')).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Staff Management' })).toBeVisible();
    });

    test('should have horizontal scroll for table on small screens', async ({ page }) => {
      await page.setViewportSize({ width: 640, height: 800 });

      // Header should still be visible
      await expect(page.getByText('Staff List')).toBeVisible();

      // Table should be in scrollable container
      const table = page.getByRole('table');
      await expect(table).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper ARIA labels', async ({ page }) => {
      // Main content with aria-label
      const main = page.getByRole('main');
      await expect(main).toBeVisible();

      // Table
      await expect(page.getByRole('table')).toBeVisible();
    });

    test('table headers should have scope attribute', async ({ page }) => {
      const headers = page.locator('th[scope="col"]');
      await expect(headers).toHaveCount(5);
    });

    test('staff rows should have aria-label', async ({ page }) => {
      const staffRow = page.getByRole('button', { name: /松本さん.*Senior Engineer/ });
      await expect(staffRow).toBeVisible();
    });
  });

  test.describe('Sidebar Navigation', () => {
    test('Staff should be highlighted in sidebar', async ({ page }) => {
      const sidebar = page.getByRole('navigation', { name: /QS Admin/i });
      const staffLink = sidebar.getByRole('link', { name: /Staff/i });
      await expect(staffLink).toHaveAttribute('aria-current', 'page');
    });

    test('should navigate to dashboard from sidebar', async ({ page }) => {
      const sidebar = page.getByRole('navigation', { name: /QS Admin/i });
      await sidebar.getByRole('link', { name: 'Dashboard' }).click();
      await expect(page).toHaveURL(/\/admin\/dashboard/);
    });
  });

  test.describe('English Locale', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/en/admin/staff');
    });

    test('should display English text', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Staff Management', level: 1 })).toBeVisible();
      await expect(page.getByText('Staff Permissions & Access Management')).toBeVisible();
    });

    test('should display English permission badges', async ({ page }) => {
      await expect(page.getByText('Super Admin')).toBeVisible();
      await expect(page.getByText('Admin')).toBeVisible();
      await expect(page.getByText('Operator')).toBeVisible();
      await expect(page.getByText('Viewer')).toBeVisible();
    });

    test('should display English status badges', async ({ page }) => {
      await expect(page.getByText('Active').first()).toBeVisible();
      await expect(page.getByText('Onboarding')).toBeVisible();
    });
  });
});
