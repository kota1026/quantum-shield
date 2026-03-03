import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Governance Council E2E Tests
 * Tests for Screen 05: Council (Security Council & Purpose Committee)
 */

test.describe('Governance Council', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/governance/council');
  });

  test.describe('Page Load & Layout', () => {
    test('should display council page correctly', async ({ page }) => {
      await expect(page.getByRole('main')).toBeVisible();
    });

    test('should display page header with title', async ({ page }) => {
      await expect(page.getByRole('heading', { level: 1, name: /評議会/i })).toBeVisible();
    });

    test('should display page subtitle', async ({ page }) => {
      await expect(page.getByText(/セキュリティ評議会と目的委員会の監督機能/i)).toBeVisible();
    });
  });

  test.describe('Info Box', () => {
    test('should display info box with CP-3 title', async ({ page }) => {
      await expect(page.getByText(/評議会拒否権/i)).toBeVisible();
    });

    test('should display info box description', async ({ page }) => {
      await expect(
        page.getByText(/セキュリティ評議会はセキュリティリスクのある提案を拒否できます/i)
      ).toBeVisible();
    });
  });

  test.describe('Security Council Card', () => {
    test('should display Security Council title', async ({ page }) => {
      await expect(page.getByText('セキュリティ評議会')).toBeVisible();
    });

    test('should display Security Council status badge', async ({ page }) => {
      // Should show active member ratio N/M
      await expect(page.getByText(/\d+\/\d+\s*アクティブ/i)).toBeVisible();
    });

    test('should display Security Council description', async ({ page }) => {
      await expect(page.getByText(/プロトコルセキュリティを担当/i)).toBeVisible();
    });

    test('should display Security Council members', async ({ page }) => {
      // Verify member names/addresses are displayed (ENS or truncated address format)
      const memberElements = page.getByText(/\.eth|0x[a-fA-F0-9]/);
      await expect(memberElements.first()).toBeVisible();
    });
  });

  test.describe('Purpose Committee Card', () => {
    test('should display Purpose Committee title', async ({ page }) => {
      await expect(page.getByText('目的委員会')).toBeVisible();
    });

    test('should display Purpose Committee status badge', async ({ page }) => {
      // Verify active member count in N/N format
      await expect(page.getByText(/\d+\/\d+\s*アクティブ/i).last()).toBeVisible();
    });

    test('should display Purpose Committee description', async ({ page }) => {
      await expect(page.getByText(/コア原則.*の守護者/i)).toBeVisible();
    });

    test('should display Purpose Committee members', async ({ page }) => {
      // Verify Purpose Committee section has member entries displayed
      const committeeSection = page.getByText('目的委員会').locator('..');
      await expect(committeeSection).toBeVisible();
      // Verify member names/addresses are displayed (ENS or truncated address format)
      const memberElements = committeeSection.getByText(/\.eth|0x[a-fA-F0-9]/);
      expect(await memberElements.count()).toBeGreaterThanOrEqual(1);
    });
  });

  test.describe('Tabs Navigation', () => {
    test('should display System Status tab as default', async ({ page }) => {
      const statusTab = page.getByRole('tab', { name: /システムステータス/i });
      await expect(statusTab).toHaveAttribute('aria-selected', 'true');
    });

    test('should display Veto History tab', async ({ page }) => {
      const vetoTab = page.getByRole('tab', { name: /拒否履歴/i });
      await expect(vetoTab).toBeVisible();
    });

    test('should switch to Veto History tab on click', async ({ page }) => {
      const vetoTab = page.getByRole('tab', { name: /拒否履歴/i });
      await vetoTab.click();
      await expect(vetoTab).toHaveAttribute('aria-selected', 'true');
    });
  });

  test.describe('System Status Tab', () => {
    test('should display all systems operational status', async ({ page }) => {
      await expect(page.getByText(/すべてのシステムが正常稼働中/i)).toBeVisible();
    });

    test('should display last check time', async ({ page }) => {
      await expect(page.getByText(/最終チェック/i)).toBeVisible();
    });

    test('should display Lock Contract status', async ({ page }) => {
      await expect(page.getByText('ロックコントラクト')).toBeVisible();
    });

    test('should display STARK Verifier status', async ({ page }) => {
      await expect(page.getByText('STARK検証器')).toBeVisible();
    });

    test('should display Governance status', async ({ page }) => {
      await expect(page.getByText('ガバナンス').first()).toBeVisible();
    });
  });

  test.describe('Veto History Tab', () => {
    test.beforeEach(async ({ page }) => {
      await page.getByRole('tab', { name: /拒否履歴/i }).click();
    });

    test('should display veto history section', async ({ page }) => {
      // Verify veto history header with count
      await expect(page.getByText(/拒否履歴.*\d+件/i)).toBeVisible();
    });

    test('should display veto entries with QIP IDs', async ({ page }) => {
      // Verify at least one veto entry with QIP ID format
      await expect(page.getByText(/QIP-\d+/).first()).toBeVisible();
    });

    test('should display veto entry titles', async ({ page }) => {
      // Verify veto entries have title text
      const vetoPanel = page.getByRole('tabpanel');
      await expect(vetoPanel).not.toBeEmpty();
    });

    test('should display vetoed by info', async ({ page }) => {
      // Verify vetoed-by information shows a council/committee name
      await expect(page.getByText(/Purpose Committee|Security Council|目的委員会|セキュリティ評議会/).first()).toBeVisible();
    });

    test('should display veto detail on click', async ({ page }) => {
      // Click first veto entry to open detail
      const vetoEntry = page.getByText(/QIP-\d+/).first();
      await vetoEntry.click();
      // Verify detail view opens with veto detail heading
      await expect(page.getByText(/拒否詳細: QIP-\d+/i)).toBeVisible();
    });

    test('should display veto reason in detail', async ({ page }) => {
      // Click first veto entry to open detail
      const vetoEntry = page.getByText(/QIP-\d+/).first();
      await vetoEntry.click();
      // Verify a Core Principle reference is shown as reason
      await expect(page.getByText(/Core Principle \d+.*CP-\d+/i)).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should display properly on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await expect(page.getByRole('main')).toBeVisible();
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });

    test('council cards should stack on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await expect(page.getByText('セキュリティ評議会')).toBeVisible();
      await expect(page.getByText('目的委員会')).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should have no accessibility violations', async ({ page }) => {
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();
      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('should have proper heading hierarchy', async ({ page }) => {
      const h1 = page.getByRole('heading', { level: 1 });
      await expect(h1).toHaveCount(1);
    });

    test('tabs should have proper ARIA attributes', async ({ page }) => {
      const tablist = page.getByRole('tablist');
      await expect(tablist).toBeVisible();

      const statusTab = page.getByRole('tab', { name: /システムステータス/i });
      await expect(statusTab).toHaveAttribute('aria-selected', 'true');
      await expect(statusTab).toHaveAttribute('aria-controls', 'status-panel');

      const vetoTab = page.getByRole('tab', { name: /拒否履歴/i });
      await expect(vetoTab).toHaveAttribute('aria-selected', 'false');
    });

    test('tabs should be keyboard accessible', async ({ page }) => {
      const statusTab = page.getByRole('tab', { name: /システムステータス/i });
      await statusTab.focus();
      await expect(statusTab).toBeFocused();
    });
  });

  test.describe('i18n', () => {
    test('should display Japanese content on /ja/ path', async ({ page }) => {
      await expect(page.getByText('評議会')).toBeVisible();
      await expect(page.getByText('セキュリティ評議会')).toBeVisible();
    });

    test('should display English content on /en/ path', async ({ page }) => {
      await page.goto('/en/governance/council');
      await expect(page.getByText('Council')).toBeVisible();
      await expect(page.getByText('Security Council')).toBeVisible();
    });
  });
});
