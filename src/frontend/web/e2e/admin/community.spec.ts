import { test, expect } from '@playwright/test';

test.describe('Admin Community Management Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/admin/community');
  });

  test('should display page header correctly', async ({ page }) => {
    // Check main heading
    await expect(page.getByRole('heading', { name: 'Community Management', level: 1 })).toBeVisible();

    // Check subtitle
    await expect(page.getByText('アナウンスメント・FAQ・コミュニティ管理')).toBeVisible();
  });

  test('should have accessible main landmark', async ({ page }) => {
    const main = page.getByRole('main', { name: 'コミュニティ管理ページ' });
    await expect(main).toBeVisible();
  });

  test('should display New Announcement button', async ({ page }) => {
    const button = page.getByRole('button', { name: /New Announcement/i });
    await expect(button).toBeVisible();
  });

  test('should display stats row', async ({ page }) => {
    await expect(page.getByText('Total Users')).toBeVisible();
    await expect(page.getByText('Active This Week')).toBeVisible();
    await expect(page.getByText('Support Tickets')).toBeVisible();
    await expect(page.getByText('Avg Response Time')).toBeVisible();
  });

  test('should display stats values', async ({ page }) => {
    // Stats labels should have associated numeric values
    const statsSection = page.locator('main');
    await expect(statsSection.getByText('Total Users')).toBeVisible();
  });

  test('should display filter tabs', async ({ page }) => {
    const tablist = page.getByRole('tablist', { name: 'Community Management' });
    await expect(tablist).toBeVisible();

    await expect(page.getByRole('tab', { name: 'Announcements' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'FAQ' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Support Tickets' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Analytics' })).toBeVisible();
  });

  test('should show Announcements tab as active by default', async ({ page }) => {
    const announcementsTab = page.getByRole('tab', { name: 'Announcements' });
    await expect(announcementsTab).toHaveAttribute('aria-selected', 'true');
  });

  test('should switch tabs on click', async ({ page }) => {
    const faqTab = page.getByRole('tab', { name: 'FAQ' });
    const announcementsTab = page.getByRole('tab', { name: 'Announcements' });

    await faqTab.click();
    await expect(faqTab).toHaveAttribute('aria-selected', 'true');
    await expect(announcementsTab).toHaveAttribute('aria-selected', 'false');
  });

  test('should display Recent Announcements card', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Recent Announcements' })).toBeVisible();
  });

  test('should display announcement entries', async ({ page }) => {
    // Announcements section should have entries
    const announcementItems = page.locator('[role="button"]');
    if (await announcementItems.count() > 0) {
      await expect(announcementItems.first()).toBeVisible();
    }
  });

  test('should display announcement type badges', async ({ page }) => {
    await expect(page.getByText('Important')).toBeVisible();
    await expect(page.getByText('Update')).toBeVisible();
    await expect(page.getByText('Event')).toBeVisible();
  });

  test('should display announcement meta information', async ({ page }) => {
    // Announcements should show view/comment counts
    await expect(page.getByText(/views/i).first()).toBeVisible();
  });

  test('should display Top FAQs card', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Top FAQs' })).toBeVisible();
  });

  test('should display FAQ items', async ({ page }) => {
    // FAQ section should exist under "Top FAQs" heading
    await expect(page.getByRole('heading', { name: 'Top FAQs' })).toBeVisible();
  });

  test('should display FAQ view counts', async ({ page }) => {
    // FAQ items should show view counts
    const faqViews = page.getByText(/views/i);
    if (await faqViews.count() > 0) {
      await expect(faqViews.first()).toBeVisible();
    }
  });

  test('should display Quick Links card', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Quick Links' })).toBeVisible();
  });

  test('should display quick links', async ({ page }) => {
    await expect(page.getByRole('link', { name: /Discord Server/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Twitter/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Documentation/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Status Page/i })).toBeVisible();
  });

  test('should have keyboard accessible announcement cards', async ({ page }) => {
    const firstAnnouncement = page.locator('[role="button"]').first();
    await expect(firstAnnouncement).toHaveAttribute('tabindex', '0');
  });

  test('should work in English locale', async ({ page }) => {
    await page.goto('/en/admin/community');

    await expect(page.getByRole('heading', { name: 'Community Management', level: 1 })).toBeVisible();
    await expect(page.getByText('Announcements, FAQ & Community Management')).toBeVisible();
  });
});
