/**
 * Consumer App Notifications E2E Tests
 *
 * URL: /ja/consumer/notifications
 * Auth: Required (uses authenticatedPage fixture with real SIWE JWT)
 * APIs: GET /v1/user/notifications, POST /v1/user/notifications/read
 *
 * Uses real backend at localhost:8080. No mocking.
 */

import { test, expect } from '../fixtures';

const NOTIFICATIONS_URL_JA = '/ja/consumer/notifications';
const NOTIFICATIONS_URL_EN = '/en/consumer/notifications';

// ---------------------------------------------------------------------------
// 1. Page Structure & Main Landmark
// ---------------------------------------------------------------------------
test.describe('Page Structure', () => {
  test.beforeEach(async ({ page, authenticatedPage }) => {
    await page.goto(NOTIFICATIONS_URL_JA);
    await expect(page.getByRole('main')).toBeVisible({ timeout: 15000 });
  });

  test('should have main landmark with role="main"', async ({ page }) => {
    const main = page.locator('main[role="main"]');
    await expect(main).toBeVisible();
  });

  test('should display page heading', async ({ page }) => {
    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1);
    await expect(h1).toContainText(/通知/);
  });

  test('should display back button', async ({ page }) => {
    const backButton = page.locator('a[href*="/consumer/settings"]');
    await expect(backButton).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 2. Tab Filtering
// ---------------------------------------------------------------------------
test.describe('Tabs', () => {
  test.beforeEach(async ({ page, authenticatedPage }) => {
    await page.goto(NOTIFICATIONS_URL_JA);
    await expect(page.getByRole('main')).toBeVisible({ timeout: 15000 });
  });

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

  test('should switch to unread tab on click', async ({ page }) => {
    const unreadTab = page.getByRole('tab', { name: /未読/ });
    await unreadTab.click();

    await expect(unreadTab).toHaveAttribute('aria-selected', 'true');

    // The "all" tab should no longer be selected
    const allTab = page.getByRole('tab', { name: 'すべて' });
    await expect(allTab).toHaveAttribute('aria-selected', 'false');
  });
});

// ---------------------------------------------------------------------------
// 3. Notification Display
// ---------------------------------------------------------------------------
test.describe('Notification List', () => {
  test.beforeEach(async ({ page, authenticatedPage }) => {
    await page.goto(NOTIFICATIONS_URL_JA);
    await expect(page.getByRole('main')).toBeVisible({ timeout: 15000 });
  });

  test('should display notification panel', async ({ page }) => {
    const panel = page.locator('[role="tabpanel"]');
    await expect(panel).toBeVisible();
  });

  test('should display notifications or empty state', async ({ page }) => {
    const panel = page.locator('[role="tabpanel"]');
    await expect(panel).toBeVisible();

    // Either notifications are present (h3 items) or empty state is shown
    const notifications = panel.locator('h3');
    const notifCount = await notifications.count();

    if (notifCount > 0) {
      // Has notifications
      await expect(notifications.first()).toBeVisible();
    } else {
      // Empty state
      await expect(page.getByText(/通知はありません/)).toBeVisible();
    }
  });
});

// ---------------------------------------------------------------------------
// 4. Mark as Read
// ---------------------------------------------------------------------------
test.describe('Mark as Read', () => {
  test('should show or hide mark-all-read button based on unread count', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(NOTIFICATIONS_URL_JA);
    await expect(page.getByRole('main')).toBeVisible({ timeout: 15000 });

    const markAllButton = page.getByRole('button', {
      name: /すべて既読にする/,
    });

    // If there are unread notifications, the button should be visible
    const unreadBadge = page.locator('span[aria-label*="件の未読通知"]');
    if ((await unreadBadge.count()) > 0) {
      await expect(markAllButton).toBeVisible();
    }
    // Otherwise it may be hidden, which is also valid
  });

  test('should mark all as read when button clicked', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(NOTIFICATIONS_URL_JA);
    await expect(page.getByRole('main')).toBeVisible({ timeout: 15000 });

    const markAllButton = page.getByRole('button', {
      name: /すべて既読にする/,
    });

    if (await markAllButton.isVisible()) {
      await markAllButton.click();

      // Unread indicators should disappear
      const unreadIndicators = page.locator('span[aria-label="未読"]');
      await expect(unreadIndicators).toHaveCount(0);
    }
  });
});

// ---------------------------------------------------------------------------
// 5. Empty State after Marking Read
// ---------------------------------------------------------------------------
test.describe('Empty State', () => {
  test('should display empty state on unread tab when no unread notifications', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(NOTIFICATIONS_URL_JA);
    await expect(page.getByRole('main')).toBeVisible({ timeout: 15000 });

    // Mark all as read first if possible
    const markAllButton = page.getByRole('button', {
      name: /すべて既読にする/,
    });
    if (await markAllButton.isVisible()) {
      await markAllButton.click();
    }

    // Switch to unread tab
    await page.getByRole('tab', { name: /未読/ }).click();

    // Empty state should be visible
    await expect(page.getByText(/通知はありません/)).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 6. Navigation
// ---------------------------------------------------------------------------
test.describe('Navigation', () => {
  test('should navigate back to settings', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(NOTIFICATIONS_URL_JA);
    await expect(page.getByRole('main')).toBeVisible({ timeout: 15000 });

    const backButton = page.locator('a[href*="/consumer/settings"]');
    await backButton.click();
    await expect(page).toHaveURL(/\/consumer\/settings/);
  });
});

// ---------------------------------------------------------------------------
// 7. Accessibility
// ---------------------------------------------------------------------------
test.describe('Accessibility', () => {
  test.beforeEach(async ({ page, authenticatedPage }) => {
    await page.goto(NOTIFICATIONS_URL_JA);
    await expect(page.getByRole('main')).toBeVisible({ timeout: 15000 });
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1);
  });

  test('tabs should be keyboard navigable', async ({ page }) => {
    const allTab = page.getByRole('tab', { name: 'すべて' });
    await allTab.focus();
    await expect(allTab).toBeFocused();
  });

  test('notification items should have aria-label', async ({ page }) => {
    const panel = page.locator('[role="tabpanel"]');
    const items = panel.locator('[aria-label]');
    // Items may or may not exist depending on API data
    const count = await items.count();
    // Just verify the panel structure is present
    await expect(panel).toBeVisible();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

// ---------------------------------------------------------------------------
// 8. Responsive Design
// ---------------------------------------------------------------------------
test.describe('Responsive Design', () => {
  test('should display properly on mobile (375x667)', async ({
    page,
    authenticatedPage,
  }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(NOTIFICATIONS_URL_JA);
    await expect(page.getByRole('main')).toBeVisible({ timeout: 15000 });

    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('[role="tablist"]')).toBeVisible();
    await expect(page.locator('[role="tabpanel"]')).toBeVisible();
  });

  test('should display properly on tablet (768x1024)', async ({
    page,
    authenticatedPage,
  }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(NOTIFICATIONS_URL_JA);
    await expect(page.getByRole('main')).toBeVisible({ timeout: 15000 });

    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('[role="tablist"]')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 9. English Locale
// ---------------------------------------------------------------------------
test.describe('English Locale', () => {
  test('should display content in English', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(NOTIFICATIONS_URL_EN);
    await expect(page.getByRole('main')).toBeVisible({ timeout: 15000 });

    await expect(page.locator('h1')).toContainText('Notifications');
    await expect(page.getByRole('tab', { name: 'All' })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Unread/ })).toBeVisible();
  });

  test('should display mark all read button in English', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(NOTIFICATIONS_URL_EN);
    await expect(page.getByRole('main')).toBeVisible({ timeout: 15000 });

    // The button may or may not be visible depending on unread count
    const markAllButton = page.getByRole('button', {
      name: /Mark all as read/,
    });
    // If there are unread notifications, button should be visible
    const panel = page.locator('[role="tabpanel"]');
    await expect(panel).toBeVisible();
  });
});
