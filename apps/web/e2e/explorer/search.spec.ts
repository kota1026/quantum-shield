import { test, expect } from '@playwright/test';

test.describe('Explorer Search Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/explorer/search?q=0x7a3f');
  });

  test('should display the search bar with query', async ({ page }) => {
    const searchInput = page.locator('input[aria-label="検索"]');
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toHaveValue('0x7a3f');
  });

  test('should display search meta information', async ({ page }) => {
    // Check results for text
    await expect(page.locator('text=「0x7a3f」の検索結果')).toBeVisible();
    await expect(page.locator('text=4件の結果')).toBeVisible();
  });

  test('should display filter tabs', async ({ page }) => {
    const filterTabs = page.locator('[role="tablist"]');
    await expect(filterTabs).toBeVisible();

    // Check all filter tabs
    await expect(page.locator('[role="tab"]:has-text("すべて")')).toBeVisible();
    await expect(page.locator('[role="tab"]:has-text("Lock")')).toBeVisible();
    await expect(page.locator('[role="tab"]:has-text("Unlock")')).toBeVisible();
    await expect(page.locator('[role="tab"]:has-text("アドレス")')).toBeVisible();
    await expect(page.locator('[role="tab"]:has-text("Challenge")')).toBeVisible();
  });

  test('should have "All" filter selected by default', async ({ page }) => {
    const allTab = page.locator('[role="tab"]:has-text("すべて")');
    await expect(allTab).toHaveAttribute('aria-selected', 'true');
  });

  test('should display all result types', async ({ page }) => {
    // Check for Lock results
    await expect(page.locator('text=Lock').first()).toBeVisible();

    // Check for Unlock results
    await expect(page.locator('text=Unlock').first()).toBeVisible();

    // Check for Address results
    await expect(page.locator('text=アドレス').first()).toBeVisible();
  });

  test('should filter results when clicking filter tabs', async ({ page }) => {
    // Click on Locks filter
    await page.locator('[role="tab"]:has-text("Lock")').first().click();

    // Wait for filter to be selected
    await expect(page.locator('[role="tab"]:has-text("Lock")').first()).toHaveAttribute('aria-selected', 'true');

    // Only Lock results should be visible
    const results = page.locator('[role="tabpanel"] [role="button"]');
    const count = await results.count();
    expect(count).toBe(2); // 2 lock results
  });

  test('should filter to addresses when clicking Addresses tab', async ({ page }) => {
    await page.locator('[role="tab"]:has-text("アドレス")').click();

    await expect(page.locator('[role="tab"]:has-text("アドレス")')).toHaveAttribute('aria-selected', 'true');

    // Should show address result
    await expect(page.locator('text=総ロック額')).toBeVisible();
  });

  test('should submit new search when pressing Enter', async ({ page }) => {
    const searchInput = page.locator('input[aria-label="検索"]');
    await searchInput.fill('0x1234');
    await searchInput.press('Enter');

    await expect(page).toHaveURL(/\/ja\/explorer\/search\?q=0x1234/);
  });

  test('should submit new search when clicking search button', async ({ page }) => {
    const searchInput = page.locator('input[aria-label="検索"]');
    await searchInput.fill('0xabcd');

    await page.locator('button:has-text("検索")').click();

    await expect(page).toHaveURL(/\/ja\/explorer\/search\?q=0xabcd/);
  });

  test('should display result details', async ({ page }) => {
    // Check for result field labels
    await expect(page.locator('text=金額').first()).toBeVisible();
    await expect(page.locator('text=オーナー').first()).toBeVisible();
    await expect(page.locator('text=Lock日時').first()).toBeVisible();
  });

  test('should display status badges', async ({ page }) => {
    // Check for Active status
    await expect(page.locator('.bg-gold\\/10:has-text("アクティブ")')).toBeVisible();

    // Check for Pending status
    await expect(page.locator('.bg-foreground-tertiary\\/10:has-text("保留中")')).toBeVisible();
  });

  test('should be keyboard navigable', async ({ page }) => {
    // Tab to search input
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    const searchInput = page.locator('input[aria-label="検索"]');
    await expect(searchInput).toBeFocused();

    // Tab to search button
    await page.keyboard.press('Tab');
    await expect(page.locator('button:has-text("検索")')).toBeFocused();
  });

  test('should navigate to result when clicking on it', async ({ page }) => {
    const firstResult = page.locator('[role="tabpanel"] [role="button"]').first();
    await firstResult.click();

    // Should navigate to lock detail page
    await expect(page).toHaveURL(/\/ja\/explorer\/locks\//);
  });

  test('should navigate to result with keyboard', async ({ page }) => {
    const firstResult = page.locator('[role="tabpanel"] [role="button"]').first();
    await firstResult.focus();
    await page.keyboard.press('Enter');

    await expect(page).toHaveURL(/\/ja\/explorer\/locks\//);
  });

  test('should display in English when navigating to /en', async ({ page }) => {
    await page.goto('/en/explorer/search?q=0x7a3f');

    // Check English labels
    await expect(page.locator('text=Results for')).toBeVisible();
    await expect(page.locator('text=Found 4 results')).toBeVisible();
    await expect(page.locator('text=All').first()).toBeVisible();
    await expect(page.locator('text=Locks')).toBeVisible();
    await expect(page.locator('text=Unlocks')).toBeVisible();
    await expect(page.locator('text=Addresses')).toBeVisible();
  });

  test('should have proper ARIA roles for accessibility', async ({ page }) => {
    // Check tablist
    await expect(page.locator('[role="tablist"]')).toBeVisible();

    // Check tabs
    const tabs = page.locator('[role="tab"]');
    await expect(tabs).toHaveCount(5);

    // Check tabpanel
    await expect(page.locator('[role="tabpanel"]')).toBeVisible();
  });

  test('should show no results message when filtering to empty category', async ({ page }) => {
    // Click on Challenges filter (0 results)
    await page.locator('[role="tab"]:has-text("Challenge")').click();

    // Should show no results message
    await expect(page.locator('text=結果が見つかりません')).toBeVisible();
    await expect(page.locator('text=検索条件に一致する結果がありませんでした')).toBeVisible();
  });
});
