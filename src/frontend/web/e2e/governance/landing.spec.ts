import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Governance Landing (Dashboard) E2E Tests
 * Tests for Screen 01: Governance Dashboard
 */

test.describe('Governance Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to governance landing page
    await page.goto('/ja/governance/landing');
  });

  test.describe('Page Load & Layout', () => {
    test('should display governance dashboard page correctly', async ({ page }) => {
      // Check page title
      await expect(page).toHaveTitle(/ガバナンス/);

      // Check main elements are visible
      await expect(page.getByRole('main')).toBeVisible();
    });

    test('should display page header with title and subtitle', async ({ page }) => {
      // Check page title
      await expect(page.getByRole('heading', { level: 1 })).toContainText('Governance Dashboard');

      // Check subtitle
      await expect(page.getByText('Quantum Shieldの将来を決める投票に参加しましょう')).toBeVisible();
    });
  });

  test.describe('Stats Section', () => {
    test('should display all governance stat cards', async ({ page }) => {
      const statsSection = page.getByRole('region', { name: /ガバナンス統計/i });
      await expect(statsSection).toBeVisible();

      // Check all stat cards are present
      await expect(page.getByText('アクティブな提案')).toBeVisible();
      await expect(page.getByText('あなたの投票力')).toBeVisible();
      await expect(page.getByText('参加率')).toBeVisible();
      await expect(page.getByText('累計提案数')).toBeVisible();
    });

    test('should display voting power with veQS unit', async ({ page }) => {
      await expect(page.getByText('125,000')).toBeVisible();
      await expect(page.getByText('veQS')).toBeVisible();
    });

    test('should display Live badge on active proposals', async ({ page }) => {
      await expect(page.getByText('Live')).toBeVisible();
    });
  });

  test.describe('Voting Power Card', () => {
    test('should display voting power section', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /My Voting Power/i })).toBeVisible();
    });

    test('should display voting power breakdown', async ({ page }) => {
      // Check breakdown items
      await expect(page.getByText('My veQS')).toBeVisible();
      await expect(page.getByText('100,000')).toBeVisible();

      await expect(page.getByText(/委任された分|Delegated to Me/i)).toBeVisible();
      await expect(page.getByText('+25,000')).toBeVisible();
    });

    test('should display delegation status', async ({ page }) => {
      // Check delegators count
      await expect(page.getByText(/委任者数|Delegators/i)).toBeVisible();
      await expect(page.getByText('3')).toBeVisible();

      // Check lock expiry
      await expect(page.getByText(/ロック期限|Lock Expiry/i)).toBeVisible();
      await expect(page.getByText('2028-01-15')).toBeVisible();
    });

    test('should have Vote Now button that navigates to proposals', async ({ page }) => {
      const voteButton = page.getByRole('link', { name: /投票する|Vote Now/i });
      await expect(voteButton).toBeVisible();
      await expect(voteButton).toHaveAttribute('href', '/governance/proposals');
    });

    test('should have Create Proposal button that navigates to create page', async ({ page }) => {
      const createButton = page.getByRole('link', { name: /提案を作成|Create Proposal/i });
      await expect(createButton).toBeVisible();
      await expect(createButton).toHaveAttribute('href', '/governance/create');
    });

    test('should display calculation info tooltip', async ({ page }) => {
      const tooltipTrigger = page.getByText(/計算方法|How is this calculated/i);
      await expect(tooltipTrigger).toBeVisible();

      // Hover to show tooltip
      await tooltipTrigger.hover();
      await expect(page.getByRole('tooltip')).toBeVisible();
    });
  });

  test.describe('Active Proposals Card', () => {
    test('should display active proposals section', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /アクティブな提案|Active Proposals/i })).toBeVisible();
    });

    test('should display proposal cards with details', async ({ page }) => {
      // Check proposal IDs
      await expect(page.getByText('QIP-47')).toBeVisible();
      await expect(page.getByText('QIP-46')).toBeVisible();
      await expect(page.getByText('QIP-45')).toBeVisible();
    });

    test('should display proposal titles', async ({ page }) => {
      await expect(page.getByText('Increase Prover Bond Amount from 100 ETH to 150 ETH')).toBeVisible();
      await expect(page.getByText('Add New Security Council Member: quantum_expert.eth')).toBeVisible();
      await expect(page.getByText('Upgrade STARK Verifier Contract to v2.1')).toBeVisible();
    });

    test('should display voting progress bars', async ({ page }) => {
      // Check for progress bar elements
      const progressBars = page.getByRole('progressbar');
      await expect(progressBars.first()).toBeVisible();

      // Check vote percentages
      await expect(page.getByText('72%')).toBeVisible();
      await expect(page.getByText('85%')).toBeVisible();
      await expect(page.getByText('91%')).toBeVisible();
    });

    test('should display countdown timers for active proposals', async ({ page }) => {
      await expect(page.getByText('2d 14h')).toBeVisible();
      await expect(page.getByText('5d 8h')).toBeVisible();
    });

    test('should display status badges', async ({ page }) => {
      // Active status
      await expect(page.getByText('投票中').first()).toBeVisible();

      // Pending execution status
      await expect(page.getByText('実行待ち')).toBeVisible();
    });

    test('proposal cards should be clickable', async ({ page }) => {
      const proposalCard = page.getByRole('article', { name: /QIP-47/ });
      await expect(proposalCard).toHaveAttribute('href', '/governance/proposals');
    });
  });

  test.describe('Quorum Requirements Card', () => {
    test('should display quorum requirements section', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /定足数要件|Quorum Requirements/i })).toBeVisible();
    });

    test('should display current total veQS', async ({ page }) => {
      await expect(page.getByText('12,500,000 veQS')).toBeVisible();
    });

    test('should display quorum percentages by type', async ({ page }) => {
      // Parameter
      await expect(page.getByText('パラメータ')).toBeVisible();
      await expect(page.getByText('4%')).toBeVisible();

      // Upgrade
      await expect(page.getByText('アップグレード')).toBeVisible();
      await expect(page.getByText('8%')).toBeVisible();

      // Council
      await expect(page.getByText('評議会')).toBeVisible();
      await expect(page.getByText('15%')).toBeVisible();
    });
  });

  test.describe('Recent Activity Card', () => {
    test('should display recent activity section', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /最近のアクティビティ|Recent Activity/i })).toBeVisible();
    });

    test('should display activity items', async ({ page }) => {
      // Check vote activity
      await expect(page.getByText(/voted.*For.*QIP-47/i)).toBeVisible();

      // Check delegation activity
      await expect(page.getByText(/delegation.*0x456/i)).toBeVisible();

      // Check proposal passed activity
      await expect(page.getByText(/QIP-45.*passed.*91%/i)).toBeVisible();
    });

    test('should display time ago for activities', async ({ page }) => {
      await expect(page.getByText(/2時間前|2 hours ago/i)).toBeVisible();
      await expect(page.getByText(/1日前|1 day ago/i)).toBeVisible();
      await expect(page.getByText(/3日前|3 days ago/i)).toBeVisible();
    });
  });

  test.describe('Council Status Card', () => {
    test('should display council status section', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /評議会ステータス|Council Status/i })).toBeVisible();
    });

    test('should display security council status', async ({ page }) => {
      await expect(page.getByText('セキュリティ評議会')).toBeVisible();
      await expect(page.getByText('5/7')).toBeVisible();
    });

    test('should display purpose committee status', async ({ page }) => {
      await expect(page.getByText('目的委員会')).toBeVisible();
      await expect(page.getByText('3/3')).toBeVisible();
    });

    test('should have View Council button', async ({ page }) => {
      const councilButton = page.getByRole('link', { name: /評議会を見る|View Council/i });
      await expect(councilButton).toBeVisible();
      await expect(councilButton).toHaveAttribute('href', '/governance/council');
    });
  });

  test.describe('Footer', () => {
    test('should display footer links', async ({ page }) => {
      const footerNav = page.getByRole('navigation', { name: /Footer navigation/i });
      await expect(footerNav).toBeVisible();

      await expect(page.getByRole('link', { name: /ガバナンスフォーラム|Governance Forum/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /ドキュメント|Documentation/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /利用規約|Terms/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /プライバシー|Privacy/i })).toBeVisible();
    });

    test('should display disclaimer text', async ({ page }) => {
      await expect(page.getByText(/ガバナンスへの参加は任意です|Governance participation is voluntary/i)).toBeVisible();
    });

    test('should display copyright notice', async ({ page }) => {
      await expect(page.getByText('© 2026 Quantum Shield. Made in Japan.')).toBeVisible();
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

      // Stats should stack
      await expect(page.getByText('アクティブな提案')).toBeVisible();
    });

    test('should display properly on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      // Check main elements are still visible
      await expect(page.getByRole('main')).toBeVisible();

      // Stats should show 2 per row
      const statsSection = page.getByRole('region', { name: /ガバナンス統計/i });
      await expect(statsSection).toBeVisible();
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
      await expect(h1).toContainText('Governance Dashboard');
    });

    test('should have proper ARIA landmarks', async ({ page }) => {
      // Main landmark
      await expect(page.getByRole('main')).toBeVisible();

      // Navigation landmarks
      await expect(page.getByRole('navigation', { name: /Footer navigation/i })).toBeVisible();

      // Complementary landmark (aside)
      await expect(page.locator('aside')).toBeVisible();
    });

    test('all interactive elements should be keyboard accessible', async ({ page }) => {
      // Tab through the page and verify focus order
      await page.keyboard.press('Tab');

      // First focusable element should receive focus
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    });

    test('buttons and links should have visible focus states', async ({ page }) => {
      const voteButton = page.getByRole('link', { name: /投票する|Vote Now/i });
      await voteButton.focus();

      // Check that focus ring is visible
      await expect(voteButton).toHaveClass(/focus-visible:ring/);
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('should navigate through proposal cards with keyboard', async ({ page }) => {
      // Focus first proposal card
      const firstProposal = page.getByRole('article', { name: /QIP-47/ });
      await firstProposal.focus();
      await expect(firstProposal).toBeFocused();

      // Tab to next proposal
      await page.keyboard.press('Tab');
      const secondProposal = page.getByRole('article', { name: /QIP-46/ });
      await expect(secondProposal).toBeFocused();
    });

    test('should activate links with Enter key', async ({ page }) => {
      const viewAllLink = page.getByRole('link', { name: /すべて見る|View All/i }).first();
      await viewAllLink.focus();
      await page.keyboard.press('Enter');

      // Should navigate to proposals page
      await expect(page).toHaveURL(/\/governance\/proposals/);
    });
  });

  test.describe('i18n', () => {
    test('should display Japanese content on /ja/ path', async ({ page }) => {
      await expect(page.getByText('Quantum Shieldの将来を決める投票に参加しましょう')).toBeVisible();
      await expect(page.getByText('アクティブな提案')).toBeVisible();
      await expect(page.getByText('投票中')).toBeVisible();
    });

    test('should display English content on /en/ path', async ({ page }) => {
      await page.goto('/en/governance/landing');

      await expect(page.getByText('Participate in voting to shape the future of Quantum Shield')).toBeVisible();
      await expect(page.getByText('Active Proposals')).toBeVisible();
      await expect(page.getByText('Active').first()).toBeVisible();
    });
  });
});
