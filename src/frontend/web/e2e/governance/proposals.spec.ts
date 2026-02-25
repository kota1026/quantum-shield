import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Governance Proposals List E2E Tests
 * Tests for Screen 02: Proposals List
 */

test.describe('Governance Proposals List', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to governance proposals page
    await page.goto('/ja/governance/proposals');
  });

  test.describe('Page Load & Layout', () => {
    test('should display proposals list page correctly', async ({ page }) => {
      // Check main elements are visible
      await expect(page.getByRole('main')).toBeVisible();
    });

    test('should display page header with title', async ({ page }) => {
      // Check page title
      await expect(page.getByRole('heading', { level: 1 })).toContainText('Proposals');
    });

    test('should have Create Proposal button', async ({ page }) => {
      const createButton = page.getByRole('link', { name: /提案を作成|Create Proposal/i });
      await expect(createButton).toBeVisible();
      await expect(createButton).toHaveAttribute('href', '/governance/create');
    });
  });

  test.describe('Filter Tabs', () => {
    test('should display all filter tabs', async ({ page }) => {
      await expect(page.getByRole('button', { name: /すべて|All/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /投票中|Active/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /可決|Passed/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /否決|Defeated/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /拒否|Vetoed/i })).toBeVisible();
    });

    test('should filter proposals when clicking Active tab', async ({ page }) => {
      const activeTab = page.getByRole('button', { name: /投票中/i });
      await activeTab.click();

      // Check that active tab is pressed
      await expect(activeTab).toHaveAttribute('aria-pressed', 'true');

      // Check that only active proposals are shown
      await expect(page.getByText('投票中').first()).toBeVisible();
    });

    test('should filter proposals when clicking Passed tab', async ({ page }) => {
      const passedTab = page.getByRole('button', { name: /可決/i });
      await passedTab.click();

      await expect(passedTab).toHaveAttribute('aria-pressed', 'true');
    });

    test('should filter proposals when clicking Defeated tab', async ({ page }) => {
      const defeatedTab = page.getByRole('button', { name: /否決/i });
      await defeatedTab.click();

      await expect(defeatedTab).toHaveAttribute('aria-pressed', 'true');
    });

    test('should show count badges on filter tabs', async ({ page }) => {
      // Each filter tab should have a count badge
      const allTab = page.getByRole('button', { name: /すべて|All/i });
      await expect(allTab.locator('span').last()).toBeVisible();
    });
  });

  test.describe('Search Functionality', () => {
    test('should display search input', async ({ page }) => {
      const searchInput = page.getByRole('textbox', { name: /提案を検索|Search proposals/i });
      await expect(searchInput).toBeVisible();
    });

    test('should filter proposals when searching', async ({ page }) => {
      const searchInput = page.getByRole('textbox', { name: /提案を検索|Search proposals/i });
      await searchInput.fill('QIP-47');

      // Wait for filter to apply
      await page.waitForTimeout(300);

      // Should show QIP-47 proposal
      await expect(page.getByText('QIP-47')).toBeVisible();
    });

    test('should show empty state when no results', async ({ page }) => {
      const searchInput = page.getByRole('textbox', { name: /提案を検索|Search proposals/i });
      await searchInput.fill('nonexistent proposal xyz');

      // Wait for filter to apply
      await page.waitForTimeout(300);

      // Should show empty state
      await expect(page.getByText(/提案がありません|No proposals/i)).toBeVisible();
    });
  });

  test.describe('Proposal Cards', () => {
    test('should display proposal cards with IDs', async ({ page }) => {
      // Check proposal IDs are visible
      await expect(page.getByText('47')).toBeVisible();
      await expect(page.getByText('46')).toBeVisible();
      await expect(page.getByText('45')).toBeVisible();
    });

    test('should display proposal titles', async ({ page }) => {
      await expect(page.getByText('Increase Prover Bond Amount from 100 ETH to 150 ETH')).toBeVisible();
      await expect(page.getByText('Add New Security Council Member: quantum_expert.eth')).toBeVisible();
      await expect(page.getByText('Upgrade STARK Verifier Contract to v2.1')).toBeVisible();
    });

    test('should display proposal descriptions', async ({ page }) => {
      await expect(page.getByText(/seeks to increase the minimum bond requirement/i)).toBeVisible();
    });

    test('should display proposal types', async ({ page }) => {
      await expect(page.getByText('パラメータ').first()).toBeVisible();
      await expect(page.getByText('評議会')).toBeVisible();
      await expect(page.getByText('アップグレード')).toBeVisible();
    });

    test('should display status badges', async ({ page }) => {
      // Active status
      await expect(page.getByText('投票中').first()).toBeVisible();

      // Pending status
      await expect(page.getByText('実行待ち')).toBeVisible();

      // Executed status
      await expect(page.getByText('実行済み')).toBeVisible();
    });

    test('should display voting progress bars', async ({ page }) => {
      // Check for progress bar elements
      const progressBars = page.getByRole('progressbar');
      await expect(progressBars.first()).toBeVisible();
    });

    test('should display vote percentages', async ({ page }) => {
      await expect(page.getByText('72%')).toBeVisible();
      await expect(page.getByText('85%')).toBeVisible();
      await expect(page.getByText('91%')).toBeVisible();
    });

    test('should display time remaining for active proposals', async ({ page }) => {
      await expect(page.getByText('2d 14h 32m')).toBeVisible();
      await expect(page.getByText('5d 8h 15m')).toBeVisible();
    });

    test('should display user vote status', async ({ page }) => {
      await expect(page.getByText('賛成票を投じました').first()).toBeVisible();
      await expect(page.getByText('まだ投票していません')).toBeVisible();
    });

    test('should display proposer information', async ({ page }) => {
      await expect(page.getByText(/提案者.*0xabc/i)).toBeVisible();
    });

    test('should display comment counts', async ({ page }) => {
      await expect(page.getByText('24 コメント')).toBeVisible();
      await expect(page.getByText('47 コメント')).toBeVisible();
    });

    test('proposal cards should be clickable', async ({ page }) => {
      const proposalCard = page.getByRole('article').first();
      await expect(proposalCard).toHaveAttribute('href', /\/governance\/proposals\/\d+/);
    });
  });

  test.describe('Pagination', () => {
    test('should display pagination controls', async ({ page }) => {
      const pagination = page.getByRole('navigation', { name: /Pagination/i });
      await expect(pagination).toBeVisible();
    });

    test('should have previous and next buttons', async ({ page }) => {
      await expect(page.getByRole('button', { name: /前へ|Previous/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /次へ|Next/i })).toBeVisible();
    });

    test('should disable previous button on first page', async ({ page }) => {
      const prevButton = page.getByRole('button', { name: /前へ|Previous/i });
      await expect(prevButton).toBeDisabled();
    });

    test('should highlight current page', async ({ page }) => {
      const currentPage = page.getByRole('button', { name: /ページ 1|Page 1/i });
      await expect(currentPage).toHaveAttribute('aria-current', 'page');
    });
  });

  test.describe('Footer', () => {
    test('should display footer links', async ({ page }) => {
      const footerNav = page.getByRole('navigation', { name: /Footer navigation/i });
      await expect(footerNav).toBeVisible();

      await expect(page.getByRole('link', { name: /ガバナンスフォーラム|Governance Forum/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /ドキュメント|Documentation/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /利用規約|Terms/i })).toBeVisible();
    });

    test('should display disclaimer text', async ({ page }) => {
      await expect(page.getByText(/ガバナンスへの参加は任意です|Governance participation is voluntary/i)).toBeVisible();
    });

    test('external links should open in new tab', async ({ page }) => {
      const forumLink = page.getByRole('link', { name: /ガバナンスフォーラム|Governance Forum/i });
      await expect(forumLink).toHaveAttribute('target', '_blank');
      await expect(forumLink).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  test.describe('Responsive Design', () => {
    test('should display properly on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      // Check main elements are still visible
      await expect(page.getByRole('main')).toBeVisible();
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

      // Check proposals are visible
      await expect(page.getByText('47')).toBeVisible();
    });

    test('should display properly on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      // Check main elements are still visible
      await expect(page.getByRole('main')).toBeVisible();

      // Filter tabs should be visible
      await expect(page.getByRole('button', { name: /すべて|All/i })).toBeVisible();
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
      // Check h1 exists
      const h1 = page.getByRole('heading', { level: 1 });
      await expect(h1).toHaveCount(1);

      // Check that h1 contains the page title
      await expect(h1).toContainText('Proposals');
    });

    test('should have proper ARIA landmarks', async ({ page }) => {
      // Main landmark
      await expect(page.getByRole('main')).toBeVisible();

      // Navigation landmarks
      await expect(page.getByRole('navigation', { name: /Footer navigation/i })).toBeVisible();
      await expect(page.getByRole('navigation', { name: /Pagination/i })).toBeVisible();

      // Group for filter buttons
      await expect(page.getByRole('group', { name: /Filter proposals/i })).toBeVisible();
    });

    test('all interactive elements should be keyboard accessible', async ({ page }) => {
      // Tab through the page and verify focus order
      await page.keyboard.press('Tab');

      // First focusable element should receive focus
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    });

    test('filter buttons should have visible focus states', async ({ page }) => {
      const allTab = page.getByRole('button', { name: /すべて|All/i });
      await allTab.focus();

      // Check that element is focused
      await expect(allTab).toBeFocused();
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('should navigate through filter tabs with keyboard', async ({ page }) => {
      // Focus first filter tab
      const allTab = page.getByRole('button', { name: /すべて|All/i });
      await allTab.focus();
      await expect(allTab).toBeFocused();

      // Tab to next filter
      await page.keyboard.press('Tab');
      const activeTab = page.getByRole('button', { name: /投票中|Active/i });
      await expect(activeTab).toBeFocused();
    });

    test('should activate filter with Enter key', async ({ page }) => {
      const activeTab = page.getByRole('button', { name: /投票中|Active/i });
      await activeTab.focus();
      await page.keyboard.press('Enter');

      // Check that filter is applied
      await expect(activeTab).toHaveAttribute('aria-pressed', 'true');
    });

    test('should navigate to proposal detail with Enter key', async ({ page }) => {
      const proposalCard = page.getByRole('article').first();
      await proposalCard.focus();
      await page.keyboard.press('Enter');

      // Should navigate to proposal detail page
      await expect(page).toHaveURL(/\/governance\/proposals\/\d+/);
    });
  });

  test.describe('i18n', () => {
    test('should display Japanese content on /ja/ path', async ({ page }) => {
      await expect(page.getByText('すべて')).toBeVisible();
      await expect(page.getByText('投票中').first()).toBeVisible();
      await expect(page.getByText('可決')).toBeVisible();
      await expect(page.getByText('提案者').first()).toBeVisible();
    });

    test('should display English content on /en/ path', async ({ page }) => {
      await page.goto('/en/governance/proposals');

      await expect(page.getByText('All')).toBeVisible();
      await expect(page.getByText('Active').first()).toBeVisible();
      await expect(page.getByText('Passed')).toBeVisible();
      await expect(page.getByText('Proposer').first()).toBeVisible();
    });
  });
});
