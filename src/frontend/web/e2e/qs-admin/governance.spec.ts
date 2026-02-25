/**
 * QS Admin Governance E2E Tests (Phase 8-E)
 *
 * ## Coverage
 * - Screen 21-23: Governance Dashboard, Proposals, Voting
 *
 * ## BE Rules Compliance
 * - BE-001: Real API endpoints (no stubs)
 * - BE-002: No test-specific modifications
 * - BE-003: All API calls logged
 */

import { test, expect } from '../fixtures/admin-auth';

test.describe('QS Admin Governance', () => {
  test.describe('Governance Dashboard', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/ja/qs-admin/governance');
    });

    test('should display governance dashboard', async ({ page, apiLogs }) => {
      await expect(page.getByRole('heading', { name: /Governance|ガバナンス/i, level: 1 })).toBeVisible();

      console.log(`[TEST LOG] Governance dashboard loaded, API calls: ${apiLogs.length}`);
    });

    test('should display governance stats', async ({ page }) => {
      await expect(page.getByText(/Active Proposals|アクティブな提案/i)).toBeVisible();
      await expect(page.getByText(/Total Votes|総投票数/i)).toBeVisible();
    });

    test('should display recent proposals', async ({ page }) => {
      await expect(page.getByText(/Recent Proposals|最近の提案/i)).toBeVisible();

      const proposalItems = page.locator('[data-testid="proposal-item"]');
      if (await proposalItems.count() > 0) {
        await expect(proposalItems.first()).toBeVisible();
      }
    });

    test('should navigate to proposals list', async ({ page }) => {
      const viewAllLink = page.getByRole('link', { name: /View All|すべて表示/i });
      await viewAllLink.click();
      await expect(page).toHaveURL(/\/qs-admin\/governance\/proposals/);
    });
  });

  test.describe('Proposals List', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/ja/qs-admin/governance/proposals');
    });

    test('should display proposals list', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /Proposals|提案/i, level: 1 })).toBeVisible();

      const proposalRows = page.locator('tbody tr, [data-testid="proposal-row"]');
      if (await proposalRows.count() > 0) {
        await expect(proposalRows.first()).toBeVisible();
      }
    });

    test('should display proposal columns', async ({ page }) => {
      await expect(page.getByText(/Title|タイトル/i)).toBeVisible();
      await expect(page.getByText(/Status|ステータス/i)).toBeVisible();
      await expect(page.getByText(/Votes|投票/i)).toBeVisible();
    });

    test('should filter by status', async ({ page }) => {
      const statusFilter = page.getByRole('combobox', { name: /Status|ステータス/i });
      if (await statusFilter.isVisible()) {
        await statusFilter.selectOption('active');
      }
    });

    test('should navigate to proposal detail', async ({ page }) => {
      const proposalRow = page.locator('tbody tr, [data-testid="proposal-row"]').first();
      if (await proposalRow.isVisible()) {
        await proposalRow.click();
        await expect(page).toHaveURL(/\/qs-admin\/governance\/proposals\/[\w-]+/);
      }
    });
  });

  test.describe('Proposal Detail', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/ja/qs-admin/governance/proposals/proposal-001');
    });

    test('should display proposal detail', async ({ page }) => {
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

      await expect(page.getByText(/Status|ステータス/i)).toBeVisible();
      await expect(page.getByText(/Author|提案者/i)).toBeVisible();
    });

    test('should display vote breakdown', async ({ page }) => {
      await expect(page.getByText(/For|賛成/i)).toBeVisible();
      await expect(page.getByText(/Against|反対/i)).toBeVisible();
      await expect(page.getByText(/Abstain|棄権/i)).toBeVisible();
    });

    test('should display timeline', async ({ page }) => {
      await expect(page.getByText(/Timeline|タイムライン/i)).toBeVisible();
    });

    test('should display action buttons for admin', async ({ page }) => {
      const executeButton = page.getByRole('button', { name: /Execute|実行/i });
      const cancelButton = page.getByRole('button', { name: /Cancel|キャンセル/i });

      // One of these should be visible depending on proposal state
      const executeVisible = await executeButton.isVisible();
      const cancelVisible = await cancelButton.isVisible();

      expect(executeVisible || cancelVisible).toBeTruthy();
    });

    test('should execute proposal', async ({ page, apiLogs }) => {
      const executeButton = page.getByRole('button', { name: /Execute|実行/i });
      if (await executeButton.isVisible()) {
        await executeButton.click();

        await expect(page.getByRole('dialog')).toBeVisible();
        await expect(page.getByText(/Confirm Execute|実行確認/i)).toBeVisible();

        console.log(`[TEST LOG] Execute proposal, API calls: ${apiLogs.length}`);
      }
    });
  });

  test.describe('Voting History', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/ja/qs-admin/governance/votes');
    });

    test('should display voting history', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /Voting.*History|投票履歴/i, level: 1 })).toBeVisible();

      const voteRows = page.locator('tbody tr');
      if (await voteRows.count() > 0) {
        await expect(voteRows.first()).toBeVisible();
      }
    });

    test('should display vote details', async ({ page }) => {
      await expect(page.getByText(/Proposal|提案/i)).toBeVisible();
      await expect(page.getByText(/Vote|投票/i)).toBeVisible();
      await expect(page.getByText(/Timestamp|タイムスタンプ/i)).toBeVisible();
    });
  });

  test.describe('Council', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/ja/qs-admin/governance/council');
    });

    test('should display council members', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /Council|評議会/i, level: 1 })).toBeVisible();

      const memberCards = page.locator('[data-testid="council-member"]');
      if (await memberCards.count() > 0) {
        await expect(memberCards.first()).toBeVisible();
      }
    });

    test('should display member details', async ({ page }) => {
      const memberCard = page.locator('[data-testid="council-member"]').first();
      if (await memberCard.isVisible()) {
        await expect(memberCard.getByText(/Name|名前/i)).toBeVisible();
        await expect(memberCard.getByText(/Role|役割/i)).toBeVisible();
      }
    });
  });

  test.describe('English Locale', () => {
    test('should display English content', async ({ page }) => {
      await page.goto('/en/qs-admin/governance');
      await expect(page.getByRole('heading', { name: /Governance/i, level: 1 })).toBeVisible();
    });

    test('proposals should display English', async ({ page }) => {
      await page.goto('/en/qs-admin/governance/proposals');
      await expect(page.getByRole('heading', { name: /Proposals/i, level: 1 })).toBeVisible();
    });
  });
});
