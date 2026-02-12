import { test, expect } from '@playwright/test';
import { gotoAndWaitForApp } from '../helpers/wait-for-app';

/**
 * Governance My Activity (History) E2E Tests
 * Tests for the MyActivity component at /governance/history
 *
 * The component uses hardcoded empty arrays and zero stats:
 * - voteHistory: [] (empty)
 * - myProposals: [] (empty)
 * - delegations: [] (empty)
 * - stats: { totalVotes: 0, participationRate: 0, proposalsCreated: 0, delegationsReceived: 0 }
 *
 * Each tab shows an empty state message when no data is available.
 */

test.describe('Governance My Activity', () => {
  test.setTimeout(90000);

  test.beforeEach(async ({ page }) => {
    await gotoAndWaitForApp(page, '/ja/governance/history');
  });

  test.describe('Page Load & Layout', () => {
    test('should display my activity page correctly', async ({ page }) => {
      await expect(page.getByRole('main')).toBeVisible();
    });

    test('should display page header with title', async ({ page }) => {
      const h1 = page.getByRole('heading', { level: 1 });
      await expect(h1).toBeVisible();
      await expect(h1).toContainText(/マイアクティビティ|My Activity/);
    });

    test('should have back to dashboard link', async ({ page }) => {
      await expect(page.getByText(/ダッシュボードに戻る|Back to Dashboard/).first()).toBeVisible();
    });
  });

  test.describe('Stats Row', () => {
    test('should display total votes stat label', async ({ page }) => {
      // t('stats.totalVotes') = "投票総数" / "Total Votes Cast"
      await expect(page.getByText(/投票総数|Total Votes/).first()).toBeVisible({ timeout: 10000 });
    });

    test('should display total votes value as 0', async ({ page }) => {
      // Stats are all zero
      await expect(page.getByText('0').first()).toBeVisible();
    });

    test('should display participation rate stat label', async ({ page }) => {
      // t('stats.participationRate') = "参加率" / "Participation Rate"
      await expect(page.getByText(/参加率|Participation Rate/).first()).toBeVisible({ timeout: 10000 });
    });

    test('should display participation rate as 0%', async ({ page }) => {
      await expect(page.getByText('0%').first()).toBeVisible();
    });

    test('should display proposals created stat label', async ({ page }) => {
      // t('stats.proposalsCreated') = "作成した提案" / "Proposals Created"
      await expect(page.getByText(/作成した提案|Proposals Created/).first()).toBeVisible({ timeout: 10000 });
    });

    test('should display delegations received stat label', async ({ page }) => {
      // t('stats.delegationsReceived') = "委任受領数" / "Delegations Received"
      await expect(page.getByText(/委任受領数|Delegations Received/).first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Tabs Navigation', () => {
    test('should display Votes tab as default', async ({ page }) => {
      // t('tabs.votes') = "投票履歴" / "My Votes"
      const votesTab = page.getByRole('tab', { name: /投票履歴|My Votes/ });
      await expect(votesTab).toHaveAttribute('aria-selected', 'true');
    });

    test('should display My Proposals tab', async ({ page }) => {
      // t('tabs.proposals') = "作成した提案" / "My Proposals"
      const proposalsTab = page.getByRole('tab', { name: /作成した提案|My Proposals/ });
      await expect(proposalsTab).toBeVisible();
    });

    test('should display Delegations tab', async ({ page }) => {
      // t('tabs.delegations') = "委任" / "Delegations"
      const delegationsTab = page.getByRole('tab', { name: /委任|Delegations/ });
      await expect(delegationsTab).toBeVisible();
    });

    test('should switch to Proposals tab on click', async ({ page }) => {
      const proposalsTab = page.getByRole('tab', { name: /作成した提案|My Proposals/ });
      await proposalsTab.click();
      await expect(proposalsTab).toHaveAttribute('aria-selected', 'true');
    });

    test('should switch to Delegations tab on click', async ({ page }) => {
      const delegationsTab = page.getByRole('tab', { name: /委任|Delegations/ });
      await delegationsTab.click();
      await expect(delegationsTab).toHaveAttribute('aria-selected', 'true');
    });
  });

  test.describe('Votes Tab (Empty State)', () => {
    test('should display votes tab title', async ({ page }) => {
      // t('votesTab.title') = "投票履歴" / "Vote History"
      await expect(page.getByText(/投票履歴|Vote History/).first()).toBeVisible();
    });

    test('should display empty state message for votes', async ({ page }) => {
      // t('votesTab.emptyState.title') = "投票履歴がありません" / "No voting history"
      await expect(page.getByText(/投票履歴がありません|No voting history/).first()).toBeVisible({ timeout: 10000 });
    });

    test('should display empty state description for votes', async ({ page }) => {
      // t('votesTab.emptyState.description') contains "まだ投票していません" / "You haven't voted yet"
      await expect(
        page.getByText(/まだ投票していません|haven't voted yet/).first()
      ).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Proposals Tab (Empty State)', () => {
    test.beforeEach(async ({ page }) => {
      await page.getByRole('tab', { name: /作成した提案|My Proposals/ }).click();
    });

    test('should display proposals tab panel', async ({ page }) => {
      const panel = page.locator('#proposals-panel');
      await expect(panel).toBeVisible();
    });

    test('should display empty state message for proposals', async ({ page }) => {
      // t('proposalsTab.emptyState.title') = "作成した提案がありません" / "No proposals created"
      await expect(page.getByText(/作成した提案がありません|No proposals created/).first()).toBeVisible({ timeout: 10000 });
    });

    test('should display empty state description for proposals', async ({ page }) => {
      // t('proposalsTab.emptyState.description') contains "まだ提案を作成していません" / "You haven't created any proposals"
      await expect(
        page.getByText(/まだ提案を作成していません|haven't created any proposals/).first()
      ).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Delegations Tab (Empty State)', () => {
    test.beforeEach(async ({ page }) => {
      await page.getByRole('tab', { name: /委任|Delegations/ }).click();
    });

    test('should display delegations tab panel', async ({ page }) => {
      const panel = page.locator('#delegations-panel');
      await expect(panel).toBeVisible();
    });

    test('should display empty state message for delegations', async ({ page }) => {
      // t('delegationsTab.emptyState.title') = "委任がありません" / "No delegations"
      await expect(page.getByText(/委任がありません|No delegations/).first()).toBeVisible({ timeout: 10000 });
    });

    test('should display empty state description for delegations', async ({ page }) => {
      // t('delegationsTab.emptyState.description') contains "まだ誰からも委任を受けていません" / "haven't received any delegations"
      await expect(
        page.getByText(/まだ誰からも委任を受けていません|haven't received any delegations/).first()
      ).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Responsive Design', () => {
    test('should display properly on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await expect(page.getByRole('main')).toBeVisible();
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });

    test('stats should be visible on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await expect(page.getByText(/投票総数|Total Votes/).first()).toBeVisible({ timeout: 10000 });
      await expect(page.getByText(/参加率|Participation Rate/).first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      const h1 = page.getByRole('heading', { level: 1 });
      await expect(h1).toHaveCount(1);
    });

    test('tabs should have proper ARIA attributes', async ({ page }) => {
      const tablist = page.getByRole('tablist');
      await expect(tablist).toBeVisible();

      const votesTab = page.getByRole('tab', { name: /投票履歴|My Votes/ });
      await expect(votesTab).toHaveAttribute('aria-selected', 'true');
      await expect(votesTab).toHaveAttribute('aria-controls', 'votes-panel');
    });

    test('tabs should be keyboard accessible', async ({ page }) => {
      const votesTab = page.getByRole('tab', { name: /投票履歴|My Votes/ });
      await votesTab.focus();
      await expect(votesTab).toBeFocused();
    });

    test('tab panels should have proper role', async ({ page }) => {
      const votesPanel = page.locator('#votes-panel');
      await expect(votesPanel).toHaveAttribute('role', 'tabpanel');
    });
  });

  test.describe('Footer', () => {
    test('should display footer disclaimer', async ({ page }) => {
      // t('footer.disclaimer') contains "ガバナンスアクティビティはオンチェーンで記録" / "governance activity is recorded on-chain"
      const disclaimer = page.getByText(/ガバナンスアクティビティはオンチェーンで記録|governance activity is recorded on-chain/).first();
      await disclaimer.scrollIntoViewIfNeeded();
      await expect(disclaimer).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('i18n', () => {
    test('should display Japanese content on /ja/ path', async ({ page }) => {
      await expect(page.getByText('マイアクティビティ').first()).toBeVisible();
      await expect(page.getByText('投票履歴').first()).toBeVisible();
    });

    test('should display English content on /en/ path', async ({ page }) => {
      await gotoAndWaitForApp(page, '/en/governance/history');

      await expect(page.getByText('My Activity').first()).toBeVisible({ timeout: 10000 });
      await expect(page.getByText('My Votes').first()).toBeVisible({ timeout: 10000 });
    });
  });
});
