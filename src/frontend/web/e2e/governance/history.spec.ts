import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Governance My Activity (History) E2E Tests
 * Tests for Screen 06: My Activity (Votes, Proposals, Delegations tabs)
 */

test.describe('Governance My Activity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/governance/history');
  });

  test.describe('Page Load & Layout', () => {
    test('should display my activity page correctly', async ({ page }) => {
      await expect(page.getByRole('main')).toBeVisible();
    });

    test('should display page header with title', async ({ page }) => {
      await expect(
        page.getByRole('heading', { level: 1, name: /マイアクティビティ/i })
      ).toBeVisible();
    });
  });

  test.describe('Stats Row', () => {
    test('should display total votes stat', async ({ page }) => {
      await expect(page.getByText('投票総数')).toBeVisible();
      // Verify a numeric value is displayed next to the label
      await expect(page.getByText(/投票総数/).locator('..').getByText(/^\d+$/)).toBeVisible();
    });

    test('should display participation rate stat', async ({ page }) => {
      await expect(page.getByText('参加率')).toBeVisible();
      // Verify a percentage value is displayed
      await expect(page.getByText(/参加率/).locator('..').getByText(/^\d+%$/)).toBeVisible();
    });

    test('should display proposals created stat', async ({ page }) => {
      await expect(page.getByText('作成した提案')).toBeVisible();
      // Verify a numeric value is displayed
      await expect(page.getByText(/作成した提案/).locator('..').getByText(/^\d+$/)).toBeVisible();
    });

    test('should display delegations received stat', async ({ page }) => {
      await expect(page.getByText('委任受領数')).toBeVisible();
    });
  });

  test.describe('Tabs Navigation', () => {
    test('should display Votes tab as default', async ({ page }) => {
      const votesTab = page.getByRole('tab', { name: /投票履歴/i });
      await expect(votesTab).toHaveAttribute('aria-selected', 'true');
    });

    test('should display My Proposals tab', async ({ page }) => {
      const proposalsTab = page.getByRole('tab', { name: /作成した提案/i });
      await expect(proposalsTab).toBeVisible();
    });

    test('should display Delegations tab', async ({ page }) => {
      const delegationsTab = page.getByRole('tab', { name: /委任/i });
      await expect(delegationsTab).toBeVisible();
    });

    test('should switch to Proposals tab on click', async ({ page }) => {
      const proposalsTab = page.getByRole('tab', { name: /作成した提案/i });
      await proposalsTab.click();
      await expect(proposalsTab).toHaveAttribute('aria-selected', 'true');
    });

    test('should switch to Delegations tab on click', async ({ page }) => {
      const delegationsTab = page.getByRole('tab', { name: /委任/i });
      await delegationsTab.click();
      await expect(delegationsTab).toHaveAttribute('aria-selected', 'true');
    });
  });

  test.describe('Votes Tab', () => {
    test('should display vote history title', async ({ page }) => {
      await expect(page.getByText('投票履歴').first()).toBeVisible();
    });

    test('should display vote entries', async ({ page }) => {
      // Verify vote entries are displayed with QIP IDs (format: QIP-NN)
      const voteEntries = page.getByText(/QIP-\d+/);
      await expect(voteEntries.first()).toBeVisible();
      expect(await voteEntries.count()).toBeGreaterThanOrEqual(2);
    });

    test('should display For vote badge', async ({ page }) => {
      await expect(page.getByText('賛成').first()).toBeVisible();
    });

    test('should display Against vote badge', async ({ page }) => {
      await expect(page.getByText('反対')).toBeVisible();
    });

    test('should display voting power used', async ({ page }) => {
      // Verify voting power is displayed with veQS unit
      await expect(page.getByText(/[\d,]+ veQS/).first()).toBeVisible();
    });
  });

  test.describe('Proposals Tab', () => {
    test.beforeEach(async ({ page }) => {
      await page.getByRole('tab', { name: /作成した提案/i }).click();
    });

    test('should display my proposals section', async ({ page }) => {
      await expect(page.getByRole('tabpanel', { name: /作成した提案/i })).toBeVisible();
    });

    test('should display proposal entries', async ({ page }) => {
      // Verify proposal entries are displayed with QIP IDs
      const proposalEntries = page.getByText(/QIP-\d+/);
      await expect(proposalEntries.first()).toBeVisible();
      expect(await proposalEntries.count()).toBeGreaterThanOrEqual(1);
    });

    test('should display Passed status badge', async ({ page }) => {
      await expect(page.getByText('可決').first()).toBeVisible();
    });

    test('should display Defeated status badge', async ({ page }) => {
      await expect(page.getByText('否決')).toBeVisible();
    });
  });

  test.describe('Delegations Tab', () => {
    test.beforeEach(async ({ page }) => {
      await page.getByRole('tab', { name: /委任/i }).click();
    });

    test('should display delegations section', async ({ page }) => {
      await expect(page.getByText('委任受領')).toBeVisible();
    });

    test('should display delegation cards', async ({ page }) => {
      // Verify delegation cards show truncated wallet addresses (0x...format)
      const addressElements = page.getByText(/0x[a-fA-F0-9]+\.{3}[a-fA-F0-9]+/);
      await expect(addressElements.first()).toBeVisible();
      expect(await addressElements.count()).toBeGreaterThanOrEqual(1);
    });

    test('should display delegated since date', async ({ page }) => {
      await expect(page.getByText(/委任開始/i).first()).toBeVisible();
    });

    test('should display delegated power', async ({ page }) => {
      // Verify delegated power is displayed with veQS unit
      await expect(page.getByText(/[\d,]+ veQS/).first()).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should display properly on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await expect(page.getByRole('main')).toBeVisible();
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });

    test('stats should stack on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await expect(page.getByText('投票総数')).toBeVisible();
      await expect(page.getByText('参加率')).toBeVisible();
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

      const votesTab = page.getByRole('tab', { name: /投票履歴/i });
      await expect(votesTab).toHaveAttribute('aria-selected', 'true');
      await expect(votesTab).toHaveAttribute('aria-controls', 'votes-panel');
    });

    test('tabs should be keyboard accessible', async ({ page }) => {
      const votesTab = page.getByRole('tab', { name: /投票履歴/i });
      await votesTab.focus();
      await expect(votesTab).toBeFocused();
    });
  });

  test.describe('i18n', () => {
    test('should display Japanese content on /ja/ path', async ({ page }) => {
      await expect(page.getByText('マイアクティビティ')).toBeVisible();
      await expect(page.getByText('投票履歴')).toBeVisible();
    });

    test('should display English content on /en/ path', async ({ page }) => {
      await page.goto('/en/governance/history');
      await expect(page.getByText('My Activity')).toBeVisible();
      await expect(page.getByText('My Votes')).toBeVisible();
    });
  });
});
