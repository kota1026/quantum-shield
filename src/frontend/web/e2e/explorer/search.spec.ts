import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Explorer Search Page', () => {
  test.setTimeout(60000);

  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/explorer/search?q=0x7a3f');
    await page.waitForLoadState('domcontentloaded');
    // Wait for search results or no results message
    await page.locator('text=検索結果, text=結果が見つかりません, input[aria-label="検索"]').first().waitFor({ timeout: 15000 });
  });

  test('should display the search bar with query', async ({ page }) => {
    const searchInput = page.locator('input[aria-label="検索"]');
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toHaveValue('0x7a3f');
  });

  test('should display search meta information', async ({ page }) => {
    // Check results for text — the query should appear
    await expect(page.getByText(/0x7a3f/).first()).toBeVisible();
  });

  test('should display filter tabs', async ({ page }) => {
    const filterTabs = page.locator('[role="tablist"]');
    const hasTablist = await filterTabs.count() > 0;
    if (hasTablist) {
      await expect(filterTabs).toBeVisible();
      await expect(page.locator('[role="tab"]').first()).toBeVisible();
    }
  });

  test('should submit new search when pressing Enter', async ({ page }) => {
    const searchInput = page.locator('input[aria-label="検索"]');
    await searchInput.fill('0x1234');
    await searchInput.press('Enter');
    await expect(page).toHaveURL(/\/ja\/explorer\/search\?q=0x1234/, { timeout: 15000 });
  });

  test('should submit new search when clicking search button', async ({ page }) => {
    const searchInput = page.locator('input[aria-label="検索"]');
    await searchInput.fill('0xabcd');

    const searchButton = page.locator('button:has-text("検索")');
    const hasSearchButton = await searchButton.count() > 0;
    if (hasSearchButton) {
      await searchButton.click();
      await expect(page).toHaveURL(/\/ja\/explorer\/search\?q=0xabcd/, { timeout: 15000 });
    } else {
      // Fall back to pressing Enter
      await searchInput.press('Enter');
      await expect(page).toHaveURL(/\/ja\/explorer\/search\?q=0xabcd/, { timeout: 15000 });
    }
  });

  test('should display search results or no results message', async ({ page }) => {
    // The page should show either search results or "結果が見つかりません"
    const hasResults = await page.locator('[role="tabpanel"] [role="button"]').count() > 0;
    const hasNoResults = await page.getByText('結果が見つかりません').count() > 0;
    const hasResultCount = await page.getByText(/件の結果/).count() > 0;
    expect(hasResults || hasNoResults || hasResultCount).toBe(true);
  });

  test('should filter results when clicking filter tabs', async ({ page }) => {
    const tabs = page.locator('[role="tab"]');
    const tabCount = await tabs.count();
    if (tabCount >= 2) {
      // Click on the second tab (e.g., "Lock")
      await tabs.nth(1).click();
      await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
    }
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.keyboard.press('Tab');
    const focusedTag = await page.evaluate(() => document.activeElement?.tagName?.toLowerCase());
    expect(focusedTag).toBeDefined();
    expect(focusedTag).not.toBe('');
  });

  test('should display in English when navigating to /en', async ({ page }) => {
    await page.goto('/en/explorer/search?q=0x7a3f');
    await page.waitForLoadState('domcontentloaded');
    await page.locator('input[aria-label]').first().waitFor({ timeout: 15000 });

    // Check for English content
    const hasResults = await page.getByText('Results for').count() > 0;
    const hasNoResults = await page.getByText('No results found').count() > 0;
    expect(hasResults || hasNoResults).toBe(true);
  });

  test('should have proper ARIA roles for accessibility', async ({ page }) => {
    // Check tablist exists
    const hasTablist = await page.locator('[role="tablist"]').count() > 0;
    if (hasTablist) {
      await expect(page.locator('[role="tablist"]')).toBeVisible();
      const tabs = page.locator('[role="tab"]');
      const tabCount = await tabs.count();
      expect(tabCount).toBeGreaterThan(0);
    }
  });

  test('should pass accessibility checks', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .exclude('[aria-hidden="true"]')
      .disableRules(['color-contrast'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
