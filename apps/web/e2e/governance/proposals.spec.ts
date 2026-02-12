import { test, expect } from '@playwright/test';
import { gotoAndWaitForApp } from '../helpers/wait-for-app';

/**
 * Governance Proposals List E2E Tests
 * Tests for the ProposalsList component at /governance/proposals
 *
 * Note: In dev mode, proposals may be empty (fallback state).
 * Tests focus on page structure and interactive elements.
 */

test.describe('Governance Proposals List', () => {
  test.setTimeout(90000);

  test.beforeEach(async ({ page }) => {
    await gotoAndWaitForApp(page, '/ja/qs-hub/vote/proposals');
  });

  test.describe('Page Load & Layout', () => {
    test('should display proposals list page correctly', async ({ page }) => {
      await expect(page.getByRole('main')).toBeVisible();
    });

    test('should display page header with title', async ({ page }) => {
      const h1 = page.getByRole('heading', { level: 1 });
      await expect(h1).toBeVisible();
      await expect(h1).toContainText(/提案一覧|Proposals/);
    });

    test('should display page subtitle', async ({ page }) => {
      await expect(
        page.getByText(/Quantum Shieldの将来を決める提案に投票しましょう|Vote on proposals/).first()
      ).toBeVisible({ timeout: 10000 });
    });

    test('should have back to dashboard link', async ({ page }) => {
      await expect(page.getByText(/ダッシュボードに戻る|Back to Dashboard/).first()).toBeVisible({ timeout: 10000 });
    });

    test('should have Create Proposal button', async ({ page }) => {
      const createLink = page.getByRole('link', { name: /提案を作成|Create Proposal/ });
      await expect(createLink).toBeVisible();
    });
  });

  test.describe('Filter Tabs', () => {
    test('should display all filter tabs', async ({ page }) => {
      // Filter tabs use aria-pressed and are buttons
      await expect(page.getByRole('button', { name: /すべて/ })).toBeVisible();
      await expect(page.getByRole('button', { name: /投票中/ })).toBeVisible();
      await expect(page.getByRole('button', { name: /可決/ })).toBeVisible();
      await expect(page.getByRole('button', { name: /否決/ })).toBeVisible();
      await expect(page.getByRole('button', { name: /拒否/ })).toBeVisible();
    });

    test('All filter tab should be selected by default', async ({ page }) => {
      const allTab = page.getByRole('button', { name: /すべて/ });
      await expect(allTab).toHaveAttribute('aria-pressed', 'true');
    });

    test('should switch filter when clicking Active tab', async ({ page }) => {
      const activeTab = page.getByRole('button', { name: /投票中/ });
      await activeTab.click();
      await expect(activeTab).toHaveAttribute('aria-pressed', 'true');
    });

    test('should switch filter when clicking Passed tab', async ({ page }) => {
      const passedTab = page.getByRole('button', { name: /可決/ });
      await passedTab.click();
      await expect(passedTab).toHaveAttribute('aria-pressed', 'true');
    });

    test('should switch filter when clicking Defeated tab', async ({ page }) => {
      const defeatedTab = page.getByRole('button', { name: /否決/ });
      await defeatedTab.click();
      await expect(defeatedTab).toHaveAttribute('aria-pressed', 'true');
    });

    test('should show count badges on filter tabs', async ({ page }) => {
      // Each filter button has a child span with count
      const allTab = page.getByRole('button', { name: /すべて/ });
      const badge = allTab.locator('span').last();
      await expect(badge).toBeVisible();
    });
  });

  test.describe('Search Functionality', () => {
    test('should display search input', async ({ page }) => {
      const searchInput = page.getByPlaceholder(/提案を検索|Search proposals/);
      await expect(searchInput).toBeVisible();
    });

    test('should accept search text', async ({ page }) => {
      const searchInput = page.getByPlaceholder(/提案を検索|Search proposals/);
      await searchInput.fill('test search');
      await expect(searchInput).toHaveValue('test search');
    });

    test('should show empty state when searching for nonexistent term', async ({ page }) => {
      const searchInput = page.getByPlaceholder(/提案を検索|Search proposals/);
      await searchInput.fill('nonexistent proposal xyz');
      await page.waitForTimeout(500);
      await expect(page.getByText(/提案がありません|No proposals/).first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Proposals List Area', () => {
    test('should display proposals list container', async ({ page }) => {
      const list = page.locator('[role="list"]');
      await expect(list).toBeVisible();
    });

    test('should display empty state or proposals', async ({ page }) => {
      // In fallback mode, shows empty state; with API data, shows proposals
      const hasProposals = await page.locator('[role="article"]').count() > 0;
      const hasEmptyState = await page.getByText(/提案がありません|No proposals/).isVisible().catch(() => false);
      expect(hasProposals || hasEmptyState).toBeTruthy();
    });
  });

  test.describe('Footer', () => {
    test('should display footer navigation', async ({ page }) => {
      const footerNav = page.getByRole('navigation', { name: /Footer/ });
      await footerNav.scrollIntoViewIfNeeded();
      await expect(footerNav).toBeVisible({ timeout: 10000 });
    });

    test('should display footer links', async ({ page }) => {
      const forum = page.getByText(/ガバナンスフォーラム|Governance Forum/).first();
      await forum.scrollIntoViewIfNeeded();
      await expect(forum).toBeVisible({ timeout: 10000 });
      await expect(page.getByText(/ドキュメント|Documentation/).first()).toBeVisible({ timeout: 10000 });
      await expect(page.getByText(/利用規約|Terms/).first()).toBeVisible({ timeout: 10000 });
    });

    test('should display disclaimer text', async ({ page }) => {
      const disclaimer = page.getByText(/ガバナンスへの参加は任意です|Governance participation/).first();
      await disclaimer.scrollIntoViewIfNeeded();
      await expect(disclaimer).toBeVisible({ timeout: 10000 });
    });

    test('external links should open in new tab', async ({ page }) => {
      const forumLink = page.getByRole('link', { name: /ガバナンスフォーラム|Governance Forum/ });
      await forumLink.scrollIntoViewIfNeeded();
      await expect(forumLink).toHaveAttribute('target', '_blank');
      await expect(forumLink).toHaveAttribute('rel', /noopener/);
    });
  });

  test.describe('Responsive Design', () => {
    test('should display properly on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await expect(page.getByRole('main')).toBeVisible();
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });

    test('should display properly on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await expect(page.getByRole('main')).toBeVisible();
      await expect(page.getByRole('button', { name: /すべて/ })).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      const h1 = page.getByRole('heading', { level: 1 });
      await expect(h1).toHaveCount(1);
    });

    test('should have proper ARIA landmarks', async ({ page }) => {
      await expect(page.getByRole('main')).toBeVisible();
      const footerNav = page.getByRole('navigation', { name: /Footer/ });
      await footerNav.scrollIntoViewIfNeeded();
      await expect(footerNav).toBeVisible({ timeout: 10000 });
      await expect(page.getByRole('group', { name: /Filter proposals/ })).toBeVisible();
    });

    test('all interactive elements should be keyboard accessible', async ({ page }) => {
      await page.keyboard.press('Tab');
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    });

    test('filter buttons should have visible focus states', async ({ page }) => {
      const allTab = page.getByRole('button', { name: /すべて/ });
      await allTab.focus();
      await expect(allTab).toBeFocused();
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('should activate filter with Enter key', async ({ page }) => {
      const activeTab = page.getByRole('button', { name: /投票中/ });
      await activeTab.focus();
      await page.keyboard.press('Enter');
      await expect(activeTab).toHaveAttribute('aria-pressed', 'true');
    });
  });

  test.describe('i18n', () => {
    test('should display Japanese content on /ja/ path', async ({ page }) => {
      await expect(page.getByText('すべて').first()).toBeVisible();
      await expect(page.getByText('投票中').first()).toBeVisible();
      await expect(page.getByText('可決').first()).toBeVisible();
    });

    test('should display English content on /en/ path', async ({ page }) => {
      await gotoAndWaitForApp(page, '/en/qs-hub/vote/proposals');

      await expect(page.getByText('Proposals').first()).toBeVisible({ timeout: 10000 });
      await expect(page.getByText('All').first()).toBeVisible({ timeout: 10000 });
      await expect(page.getByText('Active').first()).toBeVisible({ timeout: 10000 });
      await expect(page.getByText('Passed').first()).toBeVisible({ timeout: 10000 });
    });
  });
});
