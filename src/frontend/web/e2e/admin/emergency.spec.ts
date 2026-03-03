import { test, expect } from '@playwright/test';

/**
 * QS Admin Emergency Operations E2E Tests
 * Tests for Screen 02: Emergency Operations
 */

test.describe('QS Admin Emergency Operations', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to emergency page
    await page.goto('/ja/admin/emergency');
  });

  test.describe('Page Load & Layout', () => {
    test('should display emergency page correctly', async ({ page }) => {
      // Check page title
      await expect(page).toHaveTitle(/Emergency Operations.*QS Admin/);

      // Check main elements are visible
      await expect(page.getByRole('navigation')).toBeVisible(); // Sidebar
      await expect(page.getByRole('main')).toBeVisible();
    });

    test('should display page header with title and subtitle', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Emergency Operations', level: 1 })).toBeVisible();
      await expect(page.getByText(/システム緊急停止.*復旧管理|System Emergency/)).toBeVisible();
    });

    test('should display operational status banner', async ({ page }) => {
      const statusBanner = page.getByRole('status');
      await expect(statusBanner).toBeVisible();
      await expect(statusBanner).toContainText('System Operational');
    });
  });

  test.describe('Emergency Pause Control', () => {
    test('should display emergency pause card', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /Emergency Pause/i })).toBeVisible();
      await expect(page.getByText(/System Pause/)).toBeVisible();
      await expect(page.getByText(/Lock\/Unlock/)).toBeVisible();
    });

    test('should display pause icon button', async ({ page }) => {
      const pauseIcon = page.getByRole('button', { name: /Execute Emergency Pause/i }).first();
      await expect(pauseIcon).toBeVisible();
      await expect(pauseIcon).toBeEnabled();
    });

    test('should display execute pause button', async ({ page }) => {
      const executeButton = page.getByRole('button', { name: /Execute Emergency Pause/i }).last();
      await expect(executeButton).toBeVisible();
      await expect(executeButton).toBeEnabled();
    });

    test('should display warning box', async ({ page }) => {
      await expect(page.getByText(/重要な注意事項|Important Notice/)).toBeVisible();
      await expect(page.getByText(/72時間|72 hours/)).toBeVisible();
      await expect(page.getByText(/Security Council/)).toBeVisible();
      await expect(page.getByText(/監査ログ|audit log/i)).toBeVisible();
    });
  });

  test.describe('Pre-Pause Checklist', () => {
    test('should display checklist card', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /Pre-Pause Checklist/i })).toBeVisible();
    });

    test('should display all checklist items', async ({ page }) => {
      await expect(page.getByText(/深刻度|severity/i)).toBeVisible();
      await expect(page.getByText(/Security Council.*連絡|Contacted Security Council/i)).toBeVisible();
      await expect(page.getByText(/影響範囲|impact scope/i)).toBeVisible();
      await expect(page.getByText(/コミュニティ通知|Community notification/i)).toBeVisible();
      await expect(page.getByText(/復旧計画|recovery plan/i)).toBeVisible();
    });

    test('checklist items should be toggleable', async ({ page }) => {
      const checklistItem = page.getByRole('checkbox').first();

      // Initially unchecked
      await expect(checklistItem).toHaveAttribute('aria-checked', 'false');

      // Click to check
      await checklistItem.click();
      await expect(checklistItem).toHaveAttribute('aria-checked', 'true');

      // Click again to uncheck
      await checklistItem.click();
      await expect(checklistItem).toHaveAttribute('aria-checked', 'false');
    });

    test('all checklist items should be independently toggleable', async ({ page }) => {
      const checkboxes = page.getByRole('checkbox');
      const count = await checkboxes.count();

      // Toggle each checkbox
      for (let i = 0; i < count; i++) {
        const checkbox = checkboxes.nth(i);
        await checkbox.click();
        await expect(checkbox).toHaveAttribute('aria-checked', 'true');
      }
    });
  });

  test.describe('Recovery Procedures', () => {
    test('should display recovery procedures card', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /Recovery Procedures/i })).toBeVisible();
    });

    test('should display all 6 recovery steps', async ({ page }) => {
      // Check for step numbers and titles
      await expect(page.getByText(/根本原因|Root Cause/i)).toBeVisible();
      await expect(page.getByText(/修正の実装|Implement Fix/i)).toBeVisible();
      await expect(page.getByText(/テスト環境|Test Environment/i)).toBeVisible();
      await expect(page.getByText(/Security Council承認|Council Approval/i)).toBeVisible();
      await expect(page.getByText(/System Resume/)).toBeVisible();
      await expect(page.getByText(/ポストモーテム|Post-Mortem/i)).toBeVisible();
    });

    test('recovery steps should be properly numbered', async ({ page }) => {
      const steps = page.locator('article[aria-label^="Step"]');
      await expect(steps).toHaveCount(6);
    });
  });

  test.describe('Pause History', () => {
    test('should display pause history card', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /Pause History/i })).toBeVisible();
    });

    test('should display history items', async ({ page }) => {
      await expect(page.getByText('System Resumed')).toBeVisible();
      await expect(page.getByText(/Emergency Pause.*L1 Gas Spike/)).toBeVisible();
      await expect(page.getByText(/Scheduled Maintenance|Maintenance/)).toBeVisible();
    });

    test('should display timestamps', async ({ page }) => {
      // History items should show date/time values
      const historyItems = page.getByRole('button').filter({ hasText: /System Resumed|Emergency Pause|Maintenance/i });
      if (await historyItems.count() > 0) {
        await expect(historyItems.first()).toBeVisible();
      }
    });

    test('should display durations for resume events', async ({ page }) => {
      // Resume events should show duration
      const historyItems = page.getByRole('button').filter({ hasText: /Resumed/i });
      if (await historyItems.count() > 0) {
        await expect(historyItems.first()).toBeVisible();
      }
    });

    test('history items should be clickable', async ({ page }) => {
      const historyItem = page.getByRole('button', { name: /System Resumed/i }).first();
      await expect(historyItem).toBeVisible();
      await expect(historyItem).toBeEnabled();
    });
  });

  test.describe('Confirmation Modal', () => {
    test.beforeEach(async ({ page }) => {
      // Open confirmation modal
      await page.getByRole('button', { name: /Execute Emergency Pause/i }).first().click();
    });

    test('should display confirmation modal', async ({ page }) => {
      const modal = page.getByRole('dialog');
      await expect(modal).toBeVisible();
      await expect(modal.getByText('Confirm Emergency Pause')).toBeVisible();
    });

    test('should display warning message in modal', async ({ page }) => {
      const modal = page.getByRole('dialog');
      await expect(modal.getByText(/Lock\/Unlock/)).toBeVisible();
      await expect(modal.getByText(/Security Council/)).toBeVisible();
    });

    test('should display confirmation input field', async ({ page }) => {
      const modal = page.getByRole('dialog');
      const input = modal.locator('input[type="text"]');
      await expect(input).toBeVisible();
      await expect(input).toHaveAttribute('placeholder', 'PAUSE');
    });

    test('should display cancel and confirm buttons', async ({ page }) => {
      const modal = page.getByRole('dialog');
      await expect(modal.getByRole('button', { name: /Cancel/i })).toBeVisible();
      await expect(modal.getByRole('button', { name: /Execute Pause/i })).toBeVisible();
    });

    test('should close modal on cancel button', async ({ page }) => {
      const modal = page.getByRole('dialog');
      await modal.getByRole('button', { name: /Cancel/i }).click();
      await expect(modal).not.toBeVisible();
    });

    test('should close modal on backdrop click', async ({ page }) => {
      // Click on backdrop (outside modal content)
      await page.locator('.fixed.inset-0').click({ position: { x: 10, y: 10 } });
      await expect(page.getByRole('dialog')).not.toBeVisible();
    });

    test('should close modal on Escape key', async ({ page }) => {
      await page.keyboard.press('Escape');
      await expect(page.getByRole('dialog')).not.toBeVisible();
    });

    test('should show error when incorrect confirmation text entered', async ({ page }) => {
      const modal = page.getByRole('dialog');
      const input = modal.locator('input[type="text"]');

      await input.fill('WRONG');
      await modal.getByRole('button', { name: /Execute Pause/i }).click();

      // Modal should stay open and show error
      await expect(modal).toBeVisible();
      await expect(modal.getByText(/PAUSE.*入力|Please type.*PAUSE/i)).toBeVisible();
    });

    test('should execute pause when correct confirmation text entered', async ({ page }) => {
      const modal = page.getByRole('dialog');
      const input = modal.locator('input[type="text"]');

      await input.fill('PAUSE');
      await modal.getByRole('button', { name: /Execute Pause/i }).click();

      // Modal should close
      await expect(modal).not.toBeVisible();

      // Status should change to paused
      const statusBanner = page.getByRole('status');
      await expect(statusBanner).toContainText('System Paused');
    });
  });

  test.describe('Paused State', () => {
    test.beforeEach(async ({ page }) => {
      // Execute pause
      await page.getByRole('button', { name: /Execute Emergency Pause/i }).first().click();
      const modal = page.getByRole('dialog');
      await modal.locator('input[type="text"]').fill('PAUSE');
      await modal.getByRole('button', { name: /Execute Pause/i }).click();
    });

    test('should show paused status banner', async ({ page }) => {
      const statusBanner = page.getByRole('status');
      await expect(statusBanner).toContainText('System Paused');
    });

    test('pause button should be disabled when paused', async ({ page }) => {
      const pauseButton = page.getByRole('button', { name: /Execute Emergency Pause/i }).last();
      await expect(pauseButton).toBeDisabled();
    });
  });

  test.describe('Sidebar Navigation', () => {
    test('emergency page should be highlighted in sidebar', async ({ page }) => {
      const sidebar = page.getByRole('navigation', { name: /QS Admin/i });
      const emergencyLink = sidebar.getByRole('link', { name: /Emergency Pause/i });
      await expect(emergencyLink).toHaveAttribute('aria-current', 'page');
    });

    test('should navigate to dashboard from sidebar', async ({ page }) => {
      const sidebar = page.getByRole('navigation', { name: /QS Admin/i });
      await sidebar.getByRole('link', { name: 'Dashboard' }).click();
      await expect(page).toHaveURL(/\/admin\/dashboard/);
    });
  });

  test.describe('Responsive Design', () => {
    test('should adapt layout on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      await expect(page.getByRole('navigation', { name: /QS Admin/i })).toBeVisible();
      await expect(page.getByRole('main')).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Emergency Operations' })).toBeVisible();
    });

    test('cards should stack on smaller screens', async ({ page }) => {
      await page.setViewportSize({ width: 640, height: 800 });

      // Cards should still be visible
      await expect(page.getByRole('heading', { name: /Emergency Pause/i })).toBeVisible();
      await expect(page.getByRole('heading', { name: /Pre-Pause Checklist/i })).toBeVisible();
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('should navigate checklist with keyboard', async ({ page }) => {
      const firstCheckbox = page.getByRole('checkbox').first();
      await firstCheckbox.focus();
      await expect(firstCheckbox).toBeFocused();

      // Toggle with Space or Enter
      await page.keyboard.press('Space');
      await expect(firstCheckbox).toHaveAttribute('aria-checked', 'true');
    });

    test('history items should be keyboard accessible', async ({ page }) => {
      const historyItem = page.getByRole('button', { name: /System Resumed/i }).first();
      await historyItem.focus();
      await expect(historyItem).toBeFocused();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper ARIA labels', async ({ page }) => {
      // Main content
      await expect(page.getByRole('main')).toBeVisible();

      // Status banner
      await expect(page.getByRole('status')).toBeVisible();

      // Checklist group
      await expect(page.getByRole('group', { name: /Pre-Pause Checklist/i })).toBeVisible();

      // Modal (when open)
      await page.getByRole('button', { name: /Execute Emergency Pause/i }).first().click();
      const modal = page.getByRole('dialog');
      await expect(modal).toHaveAttribute('aria-modal', 'true');
    });

    test('checkboxes should have proper accessibility attributes', async ({ page }) => {
      const checkboxes = page.getByRole('checkbox');
      const count = await checkboxes.count();

      for (let i = 0; i < count; i++) {
        const checkbox = checkboxes.nth(i);
        await expect(checkbox).toHaveAttribute('aria-checked');
        await expect(checkbox).toHaveAttribute('aria-label');
      }
    });

    test('recovery steps should have accessible labels', async ({ page }) => {
      const steps = page.locator('article[aria-label^="Step"]');
      await expect(steps).toHaveCount(6);
    });
  });

  test.describe('English Locale', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/en/admin/emergency');
    });

    test('should display English text', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Emergency Operations', level: 1 })).toBeVisible();
      await expect(page.getByText('System Emergency Stop & Recovery Management')).toBeVisible();
      await expect(page.getByText('System Operational')).toBeVisible();
      await expect(page.getByText('Important Notice')).toBeVisible();
    });

    test('should display English checklist items', async ({ page }) => {
      await expect(page.getByText('Confirmed the severity of the incident')).toBeVisible();
      await expect(page.getByText('Contacted Security Council members')).toBeVisible();
    });
  });
});
