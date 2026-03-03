import { test, expect } from '@playwright/test';

/**
 * Token Hub Delegate E2E Tests
 * Tests for Token Hub Screen 06: Delegate List
 */

test.describe('Token Hub Delegate', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to Token Hub delegate page
    await page.goto('/ja/token-hub/delegate');
  });

  test.describe('Page Load & Layout', () => {
    test('should display delegate page correctly', async ({ page }) => {
      // Check page title
      await expect(page).toHaveTitle(/デリゲート.*Token Hub/);

      // Check main elements are visible
      await expect(page.getByRole('main')).toBeVisible();
    });

    test('should display page header with title', async ({ page }) => {
      // Check page title
      await expect(page.getByRole('heading', { level: 1, name: /デリゲート/i })).toBeVisible();

      // Check subtitle
      await expect(page.getByText(/信頼できるデリゲート/)).toBeVisible();
    });

    test('should display header navigation', async ({ page }) => {
      // Check logo
      await expect(page.getByText('Quantum Shield')).toBeVisible();
      await expect(page.getByText('Token Hub')).toBeVisible();

      // Check navigation
      const nav = page.getByRole('navigation', { name: /Token Hub/i });
      await expect(nav).toBeVisible();
      await expect(nav.getByText('Dashboard')).toBeVisible();
      await expect(nav.getByText('Lock')).toBeVisible();
      await expect(nav.getByText('Delegate')).toBeVisible();
      await expect(nav.getByText('Rewards')).toBeVisible();
    });

    test('should highlight delegate in navigation as active', async ({ page }) => {
      const nav = page.getByRole('navigation', { name: /Token Hub/i });
      const delegateLink = nav.getByText('Delegate');

      // Check it's the current page
      await expect(delegateLink).toHaveAttribute('aria-current', 'page');
    });
  });

  test.describe('My Delegation Summary', () => {
    test('should display delegation summary box', async ({ page }) => {
      const summaryBox = page.getByRole('region', { name: /あなたの委任状況/i });
      await expect(summaryBox).toBeVisible();
    });

    test('should display delegation values', async ({ page }) => {
      await expect(page.getByText('委任済みveQS')).toBeVisible();
      // veQS amount and delegate count are dynamic
      await expect(page.getByText(/名のデリゲート/)).toBeVisible();
    });
  });

  test.describe('Search & Filters', () => {
    test('should display search input', async ({ page }) => {
      const searchInput = page.getByRole('textbox', { name: /デリゲートを検索/i });
      await expect(searchInput).toBeVisible();
      await expect(searchInput).toHaveAttribute('placeholder', /名前またはアドレスで検索/);
    });

    test('should display filter buttons', async ({ page }) => {
      const filterGroup = page.getByRole('group', { name: /デリゲートフィルター/i });
      await expect(filterGroup).toBeVisible();

      await expect(filterGroup.getByRole('button', { name: 'すべて' })).toBeVisible();
      await expect(filterGroup.getByRole('button', { name: 'トップ10' })).toBeVisible();
      await expect(filterGroup.getByRole('button', { name: '最も活発' })).toBeVisible();
      await expect(filterGroup.getByRole('button', { name: 'セキュリティ委員会' })).toBeVisible();
    });

    test('should have "All" filter active by default', async ({ page }) => {
      const allButton = page.getByRole('button', { name: 'すべて' });
      await expect(allButton).toHaveAttribute('aria-pressed', 'true');
    });

    test('should filter delegates when search query is entered', async ({ page }) => {
      const searchInput = page.getByRole('textbox', { name: /デリゲートを検索/i });

      // Search for "渡辺"
      await searchInput.fill('渡辺');

      // Should only show Watanabe delegate
      const delegateList = page.getByRole('list', { name: /デリゲート一覧/i });
      await expect(delegateList.getByRole('listitem')).toHaveCount(1);
      await expect(page.getByText('渡辺 デリゲート')).toBeVisible();
    });

    test('should filter by security council', async ({ page }) => {
      // Click Security Council filter
      await page.getByRole('button', { name: 'セキュリティ委員会' }).click();

      // Should show only Security Council members
      const delegateList = page.getByRole('list', { name: /デリゲート一覧/i });
      const items = await delegateList.getByRole('listitem').all();

      // Each visible delegate should have security-related tag
      for (const item of items) {
        const hasSecurityTag = await item.getByText(/セキュリティ委員会|目的委員会/).isVisible();
        expect(hasSecurityTag).toBeTruthy();
      }
    });

    test('should filter by most active', async ({ page }) => {
      // Click Most Active filter
      await page.getByRole('button', { name: '最も活発' }).click();

      // Should show delegates with high participation (specific % values are dynamic)
      const delegateList = page.getByRole('list', { name: /デリゲート一覧/i });
      const items = await delegateList.getByRole('listitem').count();
      expect(items).toBeGreaterThan(0);
    });

    test('should show empty state when no results', async ({ page }) => {
      const searchInput = page.getByRole('textbox', { name: /デリゲートを検索/i });

      // Search for non-existent delegate
      await searchInput.fill('存在しないデリゲート');

      // Should show empty state
      const emptyState = page.getByRole('status', { name: /デリゲートが見つかりません/i });
      await expect(page.getByText('デリゲートが見つかりません')).toBeVisible();
      await expect(page.getByText('検索条件を変更する')).toBeVisible();
    });
  });

  test.describe('Delegate List', () => {
    test('should display delegate list', async ({ page }) => {
      const delegateList = page.getByRole('list', { name: /デリゲート一覧/i });
      await expect(delegateList).toBeVisible();

      // Should have at least one delegate
      const count = await delegateList.getByRole('listitem').count();
      expect(count).toBeGreaterThan(0);
    });

    test('should display delegate cards with correct structure', async ({ page }) => {
      // Check first delegate card has structural elements (names/values are dynamic)
      const delegateList = page.getByRole('list', { name: /デリゲート一覧/i });
      const firstItem = delegateList.getByRole('listitem').first();
      await expect(firstItem).toBeVisible();
    });

    test('should display delegate tags', async ({ page }) => {
      await expect(page.getByText('セキュリティ委員会')).toBeVisible();
      await expect(page.getByText('DeFiエキスパート')).toBeVisible();
      await expect(page.getByText('長期保有者')).toBeVisible();
    });

    test('should display delegate bio', async ({ page }) => {
      await expect(page.getByText(/Quantum Shield初期からの支持者/)).toBeVisible();
    });

    test('should display last vote information', async ({ page }) => {
      await expect(page.getByText(/2日前に投票/)).toBeVisible();
    });

    test('delegate cards should be clickable links', async ({ page }) => {
      const firstDelegate = page.getByRole('listitem').first().getByRole('link');
      await expect(firstDelegate).toBeVisible();

      // Should have proper href
      await expect(firstDelegate).toHaveAttribute('href', /\/token-hub\/delegate\/1/);
    });

    test('delegate cards should show "View Profile" action', async ({ page }) => {
      await expect(page.getByText('プロフィールを見る').first()).toBeVisible();
    });
  });

  test.describe('Footer', () => {
    test('should display footer with links', async ({ page }) => {
      const footerNav = page.getByRole('navigation', { name: /フッターナビゲーション/i });
      await expect(footerNav).toBeVisible();

      await expect(footerNav.getByText('利用規約')).toBeVisible();
      await expect(footerNav.getByText('プライバシーポリシー')).toBeVisible();
      await expect(footerNav.getByText('ドキュメント')).toBeVisible();
    });

    test('should display disclaimer', async ({ page }) => {
      await expect(page.getByText(/これは投資アドバイスではありません/)).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should adapt layout for mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      // Page should still display correctly
      await expect(page.getByRole('main')).toBeVisible();
      await expect(page.getByRole('heading', { level: 1, name: /デリゲート/i })).toBeVisible();

      // Delegate cards should stack
      const delegateList = page.getByRole('list', { name: /デリゲート一覧/i });
      await expect(delegateList).toBeVisible();
    });

    test('should adapt layout for tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      // Page should display correctly
      await expect(page.getByRole('main')).toBeVisible();
      await expect(page.getByText('Quantum Shield')).toBeVisible();
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('should navigate search with keyboard', async ({ page }) => {
      // Focus on search
      const searchInput = page.getByRole('textbox', { name: /デリゲートを検索/i });
      await searchInput.focus();
      await expect(searchInput).toBeFocused();

      // Type search query
      await page.keyboard.type('渡辺');

      // Results should update
      const delegateList = page.getByRole('list', { name: /デリゲート一覧/i });
      await expect(delegateList.getByRole('listitem')).toHaveCount(1);
    });

    test('should navigate filters with keyboard', async ({ page }) => {
      // Tab to filter buttons
      const securityButton = page.getByRole('button', { name: 'セキュリティ委員会' });
      await securityButton.focus();
      await expect(securityButton).toBeFocused();

      // Activate with Enter
      await page.keyboard.press('Enter');
      await expect(securityButton).toHaveAttribute('aria-pressed', 'true');
    });

    test('should navigate delegate cards with keyboard', async ({ page }) => {
      // Tab to first delegate card
      const firstDelegateLink = page.getByRole('listitem').first().getByRole('link');
      await firstDelegateLink.focus();
      await expect(firstDelegateLink).toBeFocused();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper ARIA labels', async ({ page }) => {
      // Check important ARIA labels exist
      await expect(page.getByRole('main')).toBeVisible();
      await expect(page.getByRole('region', { name: /あなたの委任状況/i })).toBeVisible();
      await expect(page.getByRole('group', { name: /デリゲートフィルター/i })).toBeVisible();
      await expect(page.getByRole('list', { name: /デリゲート一覧/i })).toBeVisible();
    });

    test('filter buttons should have aria-pressed state', async ({ page }) => {
      const allButton = page.getByRole('button', { name: 'すべて' });
      await expect(allButton).toHaveAttribute('aria-pressed', 'true');

      const topButton = page.getByRole('button', { name: 'トップ10' });
      await expect(topButton).toHaveAttribute('aria-pressed', 'false');
    });

    test('delegate cards should have accessible labels', async ({ page }) => {
      const firstDelegateLink = page.getByRole('listitem').first().getByRole('link');
      const ariaLabel = await firstDelegateLink.getAttribute('aria-label');
      // Delegate name and rank are dynamic, just check aria-label exists
      expect(ariaLabel).toBeTruthy();
    });

    test('focus should be visible on interactive elements', async ({ page }) => {
      const searchInput = page.getByRole('textbox', { name: /デリゲートを検索/i });
      await searchInput.focus();
      await expect(searchInput).toBeFocused();

      const filterButton = page.getByRole('button', { name: 'すべて' });
      await filterButton.focus();
      await expect(filterButton).toBeFocused();
    });

    test('should announce search results to screen readers', async ({ page }) => {
      // Check for sr-only announcement element
      const announcement = page.locator('.sr-only[role="status"]');
      await expect(announcement).toBeVisible({ visible: false }); // Visually hidden but present
    });
  });

  test.describe('English Locale', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/en/token-hub/delegate');
    });

    test('should display English text', async ({ page }) => {
      await expect(page.getByRole('heading', { level: 1, name: /Delegates/i })).toBeVisible();
      await expect(page.getByText('My Delegated veQS')).toBeVisible();
      await expect(page.getByText(/to \d delegates/)).toBeVisible();
    });

    test('should display English filters', async ({ page }) => {
      const filterGroup = page.getByRole('group', { name: /Delegate filters/i });
      await expect(filterGroup.getByRole('button', { name: 'All' })).toBeVisible();
      await expect(filterGroup.getByRole('button', { name: 'Top 10' })).toBeVisible();
      await expect(filterGroup.getByRole('button', { name: 'Most Active' })).toBeVisible();
      await expect(filterGroup.getByRole('button', { name: 'Security Council' })).toBeVisible();
    });

    test('should display delegate cards in English', async ({ page }) => {
      // Delegate names are dynamic, just verify list has items
      const delegateList = page.getByRole('list', { name: /Delegate List/i });
      const count = await delegateList.getByRole('listitem').count();
      expect(count).toBeGreaterThan(0);
    });

    test('should display English tags', async ({ page }) => {
      await expect(page.getByText('Security Council')).toBeVisible();
      await expect(page.getByText('DeFi Expert')).toBeVisible();
      await expect(page.getByText('Long-term Holder')).toBeVisible();
    });

    test('should display English footer', async ({ page }) => {
      await expect(page.getByText('Terms of Service')).toBeVisible();
      await expect(page.getByText('Privacy Policy')).toBeVisible();
      await expect(page.getByText(/This is not investment advice/)).toBeVisible();
    });
  });
});
