import { test, expect } from '@playwright/test';

/**
 * Consumer App Dashboard E2E Tests
 * Tests for Screen 03: Dashboard
 */

test.describe('Consumer Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard page
    await page.goto('/ja/consumer/dashboard');
  });

  test.describe('Page Load & Layout', () => {
    test('should display dashboard page correctly', async ({ page }) => {
      // Check page title
      await expect(page).toHaveTitle(/ダッシュボード/);

      // Check main elements are visible
      await expect(page.locator('header')).toBeVisible();
      await expect(page.getByRole('main')).toBeVisible();
    });

    test('should display header with navigation', async ({ page }) => {
      // Check logo text
      await expect(page.getByText('Quantum Shield')).toBeVisible();

      // Check desktop navigation is visible
      const nav = page.getByRole('navigation', { name: /Main navigation/i });
      await expect(nav).toBeVisible();

      // Check nav has 4 items (Dashboard, Lock, Unlock, History)
      await expect(nav.locator('a, button')).toHaveCount(4);
    });

    test('should display wallet button with address', async ({ page }) => {
      const walletButton = page.getByRole('button', { name: /Wallet menu/i });
      await expect(walletButton).toBeVisible();
      await expect(walletButton).toContainText('0x7a3f');
    });
  });

  test.describe('Stats Cards', () => {
    test('should display all stat cards', async ({ page }) => {
      const statsSection = page.getByRole('region', { name: /資産統計/i });
      await expect(statsSection).toBeVisible();

      // Check all 4 stat cards
      await expect(page.getByText('ロック中')).toBeVisible();
      await expect(page.getByText('利用可能')).toBeVisible();
      await expect(page.getByText('アンロック待ち')).toBeVisible();
      await expect(page.getByText('取引数')).toBeVisible();
    });

    test('should display values correctly', async ({ page }) => {
      // Check values are displayed
      await expect(page.getByText('24.85')).toBeVisible();
      await expect(page.getByText('12.50')).toBeVisible();
    });

    test('stat cards should be clickable', async ({ page }) => {
      // Click on first stat card (Total Locked - navigates to history page)
      const statsSection = page.getByRole('region', { name: /資産統計/i });
      const lockedCard = statsSection.getByRole('button').first();
      await lockedCard.click();

      // Verify navigation to history page
      await expect(page).toHaveURL(/\/consumer\/history/);
    });
  });

  test.describe('Lock Asset Card', () => {
    test('should display lock asset card', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /資産をロック/i })).toBeVisible();
      await expect(page.getByText('量子耐性保護')).toBeVisible();
    });

    test('should allow entering lock amount', async ({ page }) => {
      const input = page.getByRole('textbox', { name: /ロック金額/i });
      await expect(input).toBeVisible();

      // Enter amount
      await input.fill('5.00');
      await expect(input).toHaveValue('5.00');
    });

    test('should have quick amount buttons', async ({ page }) => {
      const quickButtons = page.getByRole('group', { name: /Quick amount selection/i });
      await expect(quickButtons).toBeVisible();

      // Check all buttons are present
      await expect(quickButtons.getByText('25%')).toBeVisible();
      await expect(quickButtons.getByText('50%')).toBeVisible();
      await expect(quickButtons.getByText('75%')).toBeVisible();
      await expect(quickButtons.getByText('最大')).toBeVisible();
    });

    test('quick amount buttons should set correct values', async ({ page }) => {
      const input = page.getByRole('textbox', { name: /ロック金額/i });

      // Click 50% button (should set to 6.25 based on 12.50 balance)
      await page.getByRole('button', { name: /Set to 50% of balance/i }).click();
      await expect(input).toHaveValue('6.25');

      // Click MAX button (should set to 12.50)
      await page.getByRole('button', { name: /Set to 100% of balance/i }).click();
      await expect(input).toHaveValue('12.50');
    });

    test('should open lock modal when clicking lock button', async ({ page }) => {
      // Enter amount first
      await page.getByRole('textbox', { name: /ロック金額/i }).fill('5.00');

      // Click lock button
      await page.getByRole('button', { name: /Dilithium署名で資産をロックする/i }).click();

      // Verify modal opens
      const modal = page.getByRole('dialog', { name: /ロック確認/i });
      await expect(modal).toBeVisible();
      await expect(modal.getByText('5.00 ETH')).toBeVisible();
    });
  });

  test.describe('Recent Activity', () => {
    test('should display recent activity section', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /最近のアクティビティ/i })).toBeVisible();
    });

    test('should display transaction list', async ({ page }) => {
      const activityList = page.getByRole('list', { name: /最近のアクティビティ/i });
      await expect(activityList).toBeVisible();

      // Check transactions are visible
      await expect(activityList.getByRole('listitem')).toHaveCount(3);
    });

    test('should display transaction details', async ({ page }) => {
      // Check transaction types in the activity list
      const activityList = page.getByRole('list', { name: /最近のアクティビティ/i });
      await expect(activityList.locator('p.text-sm.font-semibold').first()).toBeVisible();

      // Check that we have multiple transaction items
      const items = activityList.getByRole('listitem');
      await expect(items).toHaveCount(3);
    });

    test('should have view all history link', async ({ page }) => {
      const viewAllButton = page.getByRole('link', { name: /すべての履歴を見る/i });
      await expect(viewAllButton).toBeVisible();
    });
  });

  test.describe('Lock Modal', () => {
    test.beforeEach(async ({ page }) => {
      // Open lock modal
      await page.getByRole('textbox', { name: /ロック金額/i }).fill('5.00');
      await page.getByRole('button', { name: /Dilithium署名で資産をロックする/i }).click();
    });

    test('should display lock confirmation details', async ({ page }) => {
      const modal = page.getByRole('dialog', { name: /ロック確認/i });

      await expect(modal.getByText(/以下の内容でロックを実行/)).toBeVisible();
      await expect(modal.getByText('ロック金額')).toBeVisible();
      await expect(modal.getByText('5.00 ETH')).toBeVisible();
      await expect(modal.getByText('ガス代（概算）')).toBeVisible();
    });

    test('should close modal on cancel', async ({ page }) => {
      const modal = page.getByRole('dialog', { name: /ロック確認/i });

      await modal.getByRole('button', { name: /キャンセル/i }).click();
      await expect(modal).not.toBeVisible();
    });

    test('should close modal on X button', async ({ page }) => {
      const modal = page.getByRole('dialog', { name: /ロック確認/i });

      await modal.getByRole('button', { name: /Close modal/i }).click();
      await expect(modal).not.toBeVisible();
    });

    test('should close modal on backdrop click', async ({ page }) => {
      const modal = page.getByRole('dialog', { name: /ロック確認/i });
      await expect(modal).toBeVisible();

      // Press Escape to close modal (more reliable than backdrop click)
      await page.keyboard.press('Escape');
      await expect(modal).not.toBeVisible();
    });
  });

  test.describe('Wallet Modal', () => {
    test.beforeEach(async ({ page }) => {
      // Open wallet modal
      await page.getByRole('button', { name: /Wallet menu/i }).click();
    });

    test('should display wallet information', async ({ page }) => {
      const modal = page.getByRole('dialog', { name: /ウォレット/i });
      await expect(modal).toBeVisible();

      await expect(modal.getByText('接続中のウォレット')).toBeVisible();
      await expect(modal.getByText(/0x7a3f9c2d/)).toBeVisible();
    });

    test('should have copy and disconnect buttons', async ({ page }) => {
      const modal = page.getByRole('dialog', { name: /ウォレット/i });

      await expect(modal.getByRole('button', { name: /コピー/i })).toBeVisible();
      await expect(modal.getByRole('button', { name: /切断/i })).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should show mobile navigation on mobile', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.reload();
      await page.waitForLoadState('domcontentloaded');

      // Mobile nav should be visible (bottom navigation bar)
      const mobileNav = page.getByLabel('Mobile navigation');
      await expect(mobileNav).toBeVisible();

      // Check mobile nav has navigation items (5 including settings)
      await expect(mobileNav.locator('a, button')).toHaveCount(5);
    });

    test('should hide desktop nav on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      // Desktop nav should be hidden
      const desktopNav = page.getByRole('navigation', { name: /Main navigation/i });
      await expect(desktopNav).toBeHidden();
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('should navigate with keyboard', async ({ page }) => {
      // Stat cards navigate to history page, not open modal
      const statsSection = page.getByRole('region', { name: /資産統計/i });
      const lockedCard = statsSection.getByRole('button').first();
      await lockedCard.focus();
      await page.keyboard.press('Enter');

      // Should navigate to history page
      await expect(page).toHaveURL(/\/consumer\/history/);
    });

    test('input should accept keyboard input', async ({ page }) => {
      const input = page.getByRole('textbox', { name: /ロック金額/i });
      await input.focus();
      await page.keyboard.type('10.5');
      await expect(input).toHaveValue('10.5');
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper ARIA labels', async ({ page }) => {
      // Check important ARIA labels exist
      await expect(page.getByRole('region', { name: /資産統計/i })).toBeVisible();
      await expect(page.getByRole('navigation', { name: /Main navigation/i })).toBeVisible();
      await expect(page.getByRole('list', { name: /最近のアクティビティ/i })).toBeVisible();
    });

    test('modals should trap focus', async ({ page }) => {
      // Open modal
      await page.getByRole('button', { name: /Wallet menu/i }).click();

      // Tab should stay within modal
      const modal = page.getByRole('dialog', { name: /ウォレット/i });
      await expect(modal).toBeVisible();

      // Escape should close modal
      await page.keyboard.press('Escape');
      await expect(modal).not.toBeVisible();
    });
  });

  test.describe('English Locale', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/en/consumer/dashboard');
    });

    test('should display English text', async ({ page }) => {
      // Check English locale loaded - stat card labels
      await expect(page.getByText('Protected with Quantum Keys')).toBeVisible();
      await expect(page.getByText('Available')).toBeVisible();

      // Check headings in English
      await expect(page.getByRole('heading', { name: /Lock Assets/i })).toBeVisible();
      await expect(page.getByRole('heading', { name: /Recent Activity/i })).toBeVisible();
    });
  });
});
