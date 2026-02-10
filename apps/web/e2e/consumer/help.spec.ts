import { test, expect } from '@playwright/test';

/**
 * Consumer App - Help Center Page
 * Static content page with search, quick links, resources, and tutorial CTA
 * No auth, no API calls
 */
test.describe('Consumer Help Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/consumer/help');
  });

  test('displays page with correct structure', async ({ page }) => {
    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('has a single h1 heading', async ({ page }) => {
    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toHaveCount(1);
  });

  test('has back button linking to settings page', async ({ page }) => {
    const backLink = page.getByRole('main').locator('a[href="/consumer/settings"]');
    await expect(backLink).toBeVisible();
  });

  test('displays search input with proper aria attributes', async ({ page }) => {
    const searchInput = page.locator('input[type="search"]');
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toHaveAttribute('aria-label');
  });

  test('allows typing in search input', async ({ page }) => {
    const searchInput = page.locator('input[type="search"]');
    await searchInput.fill('test query');
    await expect(searchInput).toHaveValue('test query');
  });

  test('displays quick links section with h2 heading', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const h2s = page.getByRole('heading', { level: 2 });
    await expect(h2s.first()).toBeVisible();
    const h2Count = await h2s.count();
    // At least quick links and resources headings
    expect(h2Count).toBeGreaterThanOrEqual(2);
  });

  test('displays quick link items as clickable cards', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    // 4 quick link items: gettingStarted, lockUnlock, security, troubleshooting
    const quickLinksSection = page.locator('section').first();
    const links = quickLinksSection.getByRole('link');
    await expect(links.first()).toBeVisible();
    const linkCount = await links.count();
    expect(linkCount).toBeGreaterThanOrEqual(4);
  });

  test('quick link items have valid hrefs', async ({ page }) => {
    // Getting started links to onboarding
    await expect(page.locator('a[href="/consumer/onboarding"]').first()).toBeVisible();
    // Lock/Unlock links to dashboard
    await expect(page.locator('a[href="/consumer/dashboard"]')).toBeVisible();
  });

  test('displays resources section with links', async ({ page }) => {
    // FAQ resource links to /consumer/faq
    await expect(page.locator('a[href="/consumer/faq"]').first()).toBeVisible();
    // Contact resource links to /consumer/contact
    await expect(page.locator('a[href="/consumer/contact"]')).toBeVisible();
  });

  test('displays tutorial CTA section with link to onboarding', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    // Tutorial section contains a link to /consumer/onboarding
    const tutorialLinks = page.locator('a[href="/consumer/onboarding"]');
    await expect(tutorialLinks.first()).toBeVisible();
    const count = await tutorialLinks.count();
    // At least the quick link + tutorial CTA button
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('search input is focusable', async ({ page }) => {
    const searchInput = page.locator('input[type="search"]');
    await searchInput.focus();
    await expect(searchInput).toBeFocused();
  });

  test('displays properly on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('input[type="search"]')).toBeVisible();
  });

  test('displays English content at /en locale', async ({ page }) => {
    await page.goto('/en/consumer/help');
    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // Search input should have English placeholder
    const searchInput = page.locator('input[type="search"]');
    await expect(searchInput).toBeVisible();

    // Should still have h2 sections
    const h2s = page.getByRole('heading', { level: 2 });
    await expect(h2s.first()).toBeVisible();
    const h2Count = await h2s.count();
    expect(h2Count).toBeGreaterThanOrEqual(2);
  });
});
