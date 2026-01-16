import { test, expect } from '@playwright/test';

/**
 * Consumer App Notifications E2E Tests
 * Tests for Screen 12: notifications
 */

test.describe('Notifications Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/consumer/notifications');
  });

  test.describe('Page Structure', () => {
    test('should display page title', async ({ page }) => {
      await expect(page.locator('h1')).toContainText('通知');
    });

    test('should display back button', async ({ page }) => {
      const backButton = page.locator('a[aria-label="戻る"]');
      await expect(backButton).toBeVisible();
      await expect(backButton).toHaveAttribute('href', '/consumer/settings');
    });

    test('should have main landmark', async ({ page }) => {
      const main = page.locator('main[role="main"]');
      await expect(main).toBeVisible();
    });

    test('should display unread count badge when there are unread notifications', async ({ page }) => {
      const badge = page.locator('span[aria-label*="件の未読通知"]');
      await expect(badge).toBeVisible();
    });
  });

  test.describe('Tabs', () => {
    test('should display filter tabs', async ({ page }) => {
      const tablist = page.locator('[role="tablist"]');
      await expect(tablist).toBeVisible();

      await expect(page.getByRole('tab', { name: 'すべて' })).toBeVisible();
      await expect(page.getByRole('tab', { name: /未読/ })).toBeVisible();
    });

    test('all tab should be selected by default', async ({ page }) => {
      const allTab = page.getByRole('tab', { name: 'すべて' });
      await expect(allTab).toHaveAttribute('aria-selected', 'true');
    });

    test('should switch to unread tab', async ({ page }) => {
      const unreadTab = page.getByRole('tab', { name: /未読/ });
      await unreadTab.click();

      await expect(unreadTab).toHaveAttribute('aria-selected', 'true');
    });
  });

  test.describe('Notification List', () => {
    test('should display notification panel', async ({ page }) => {
      const panel = page.locator('[role="tabpanel"]');
      await expect(panel).toBeVisible();
    });

    test('should display notifications with proper structure', async ({ page }) => {
      // Check for notification items
      const notifications = page.locator('[role="tabpanel"] > a, [role="tabpanel"] > div').filter({
        has: page.locator('h3'),
      });
      const count = await notifications.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should display notification icons', async ({ page }) => {
      // Lock, Unlock, Alert icons should be present
      const icons = page.locator('svg.lucide-lock, svg.lucide-unlock, svg.lucide-alert-triangle, svg.lucide-info');
      const count = await icons.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should display unread indicator for unread notifications', async ({ page }) => {
      const unreadIndicator = page.locator('span[aria-label="未読"]');
      const count = await unreadIndicator.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe('Mark as Read', () => {
    test('should display mark all read button when there are unread notifications', async ({ page }) => {
      const markAllButton = page.getByRole('button', { name: /すべて既読にする/ });
      await expect(markAllButton).toBeVisible();
    });

    test('should mark all as read when button is clicked', async ({ page }) => {
      const markAllButton = page.getByRole('button', { name: /すべて既読にする/ });
      await markAllButton.click();

      // Unread indicators should be removed
      const unreadIndicators = page.locator('span[aria-label="未読"]');
      await expect(unreadIndicators).toHaveCount(0);

      // Mark all button should be hidden
      await expect(markAllButton).not.toBeVisible();
    });
  });

  test.describe('Navigation', () => {
    test('should navigate back to settings', async ({ page }) => {
      const backButton = page.locator('a[aria-label="戻る"]');
      await backButton.click();
      await expect(page).toHaveURL(/\/consumer\/settings$/);
    });

    test('should navigate to detail when clicking linked notification', async ({ page }) => {
      // Find a notification with a link
      const linkedNotification = page.locator('[role="tabpanel"] a').first();
      if (await linkedNotification.count() > 0) {
        await linkedNotification.click();
        // Should navigate to the linked page
        await expect(page).not.toHaveURL(/\/notifications$/);
      }
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      const h1 = page.locator('h1');
      await expect(h1).toHaveCount(1);

      const h3 = page.locator('h3');
      const h3Count = await h3.count();
      expect(h3Count).toBeGreaterThan(0);
    });

    test('tabs should be keyboard navigable', async ({ page }) => {
      const allTab = page.getByRole('tab', { name: 'すべて' });
      await allTab.focus();
      await expect(allTab).toBeFocused();

      await page.keyboard.press('Tab');
      const unreadTab = page.getByRole('tab', { name: /未読/ });
      await expect(unreadTab).toBeFocused();
    });

    test('notifications should have proper aria labels', async ({ page }) => {
      const notifications = page.locator('[aria-label*="Lock"], [aria-label*="Unlock"], [aria-label*="セキュリティ"]');
      const count = await notifications.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe('Empty State', () => {
    test('should display empty state when no unread notifications', async ({ page }) => {
      // Mark all as read first
      const markAllButton = page.getByRole('button', { name: /すべて既読にする/ });
      if (await markAllButton.isVisible()) {
        await markAllButton.click();
      }

      // Switch to unread tab
      await page.getByRole('tab', { name: /未読/ }).click();

      // Empty state should be visible
      await expect(page.getByText('通知はありません')).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should display properly on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('[role="tablist"]')).toBeVisible();
      await expect(page.locator('[role="tabpanel"]')).toBeVisible();
    });

    test('should display properly on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('[role="tablist"]')).toBeVisible();
    });
  });
});

test.describe('Notifications Page (English)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/consumer/notifications');
  });

  test('should display content in English', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Notifications');
    await expect(page.getByRole('tab', { name: 'All' })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Unread/ })).toBeVisible();
  });

  test('should display mark all read button in English', async ({ page }) => {
    const markAllButton = page.getByRole('button', { name: /Mark all as read/ });
    await expect(markAllButton).toBeVisible();
  });
});
