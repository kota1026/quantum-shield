import { test, expect } from '@playwright/test';
import { gotoAndWaitForApp } from '../helpers/wait-for-app';

test.describe('Admin Community Management Page', () => {
  test.setTimeout(90000);

  test.beforeEach(async ({ page }) => {
    await gotoAndWaitForApp(page, '/ja/admin/community');
  });

  test('should display page header with title', async ({ page }) => {
    await expect(page.locator('h1').first()).toContainText('Community Management');
  });

  test('should display subtitle', async ({ page }) => {
    await expect(page.locator('text=アナウンスメント・FAQ・コミュニティ管理').first()).toBeVisible();
  });

  test('should have main content area', async ({ page }) => {
    const main = page.locator('[role="main"]');
    await expect(main).toBeVisible();
  });

  test('should display New Announcement button', async ({ page }) => {
    await expect(page.locator('text=New Announcement').first()).toBeVisible();
  });

  test('should display stats labels', async ({ page }) => {
    await expect(page.locator('text=Total Users').first()).toBeVisible();
    await expect(page.locator('text=Active This Week').first()).toBeVisible();
    await expect(page.locator('text=Support Tickets').first()).toBeVisible();
    await expect(page.locator('text=Avg Response Time').first()).toBeVisible();
  });

  test('should display filter tabs', async ({ page }) => {
    await expect(page.locator('text=Announcements').first()).toBeVisible();
    await expect(page.locator('text=FAQ').first()).toBeVisible();
    await expect(page.locator('text=Support Tickets').first()).toBeVisible();
    await expect(page.locator('text=Analytics').first()).toBeVisible();
  });

  test('should show Announcements tab as active by default', async ({ page }) => {
    const announcementsTab = page.getByRole('tab', { name: 'Announcements' });
    await expect(announcementsTab).toHaveAttribute('aria-selected', 'true');
  });

  test('should switch tabs on click', async ({ page }) => {
    const faqTab = page.getByRole('tab', { name: 'FAQ' });
    await faqTab.click();
    await expect(faqTab).toHaveAttribute('aria-selected', 'true');
  });

  test('should display Recent Announcements card', async ({ page }) => {
    await expect(page.locator('text=Recent Announcements').first()).toBeVisible();
  });

  test('should display announcement type badges', async ({ page }) => {
    await expect(page.locator('text=Important').first()).toBeVisible();
  });

  test('should display Top FAQs card', async ({ page }) => {
    await expect(page.locator('text=Top FAQs').first()).toBeVisible();
  });

  test('should display Quick Links card', async ({ page }) => {
    await expect(page.locator('text=Quick Links').first()).toBeVisible();
  });

  test('should display quick link items', async ({ page }) => {
    await expect(page.locator('text=Discord Server').first()).toBeVisible();
    await expect(page.locator('text=Documentation').first()).toBeVisible();
  });
});
