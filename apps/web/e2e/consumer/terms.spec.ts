import { test, expect } from '@playwright/test';

/**
 * Consumer App - Terms of Service Page
 * Static content page: no auth, no API calls
 */
test.describe('Consumer Terms of Service Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/consumer/terms');
  });

  test('displays page with correct structure', async ({ page }) => {
    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('has proper heading hierarchy with h1 and multiple h2 sections', async ({ page }) => {
    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toHaveCount(1);

    const h2s = page.getByRole('heading', { level: 2 });
    await expect(h2s.first()).toBeVisible();
    const h2Count = await h2s.count();
    // 9 article sections + contact = at least 10
    expect(h2Count).toBeGreaterThanOrEqual(10);
  });

  test('renders all article sections as h2 headings', async ({ page }) => {
    // Wait for the page to fully render (h1 appears after hydration)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // The component renders 9 sections + contact, all as h2
    const h2s = page.getByRole('heading', { level: 2 });

    // Wait for at least the first h2 to be visible before counting
    await expect(h2s.first()).toBeVisible();

    const h2Count = await h2s.count();
    expect(h2Count).toBeGreaterThanOrEqual(10);

    // Last h2 should be visible (contact section)
    await expect(h2s.last()).toBeVisible();
  });

  test('has back button that links to consumer home', async ({ page }) => {
    // The back link is in the header, linking to /consumer
    const headerLinks = page.locator('header').getByRole('link');
    const backLink = headerLinks.last();
    await expect(backLink).toBeVisible();
    await expect(backLink).toHaveAttribute('href', '/consumer');
  });

  test('has logo link that navigates to consumer home', async ({ page }) => {
    const logoLink = page.locator('header').getByRole('link').first();
    await expect(logoLink).toHaveAttribute('href', '/consumer');
    await expect(page.locator('header').getByText('Quantum Shield')).toBeVisible();
  });

  test('displays last updated date', async ({ page }) => {
    // The component renders a date string via i18n
    const main = page.getByRole('main');
    const dateText = main.locator('p').first();
    await expect(dateText).toBeVisible();
  });

  test('displays footer with navigation links', async ({ page }) => {
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();

    // Footer contains at least 4 links (home, terms, privacy, faq)
    const footerLinks = footer.getByRole('link');
    const linkCount = await footerLinks.count();
    expect(linkCount).toBeGreaterThanOrEqual(4);
  });

  test('footer links have correct hrefs', async ({ page }) => {
    const footer = page.locator('footer');
    await expect(footer.getByRole('link', { name: /consumer$/ }).or(
      footer.locator('a[href="/consumer"]')
    ).first()).toBeVisible();
    await expect(footer.locator('a[href="/consumer/terms"]')).toBeVisible();
    await expect(footer.locator('a[href="/consumer/privacy"]')).toBeVisible();
    await expect(footer.locator('a[href="/consumer/faq"]')).toBeVisible();
  });

  test('displays copyright notice in footer', async ({ page }) => {
    const footer = page.locator('footer');
    await expect(footer.getByText(/©/)).toBeVisible();
  });

  test('is keyboard navigable through sections', async ({ page }) => {
    // Wait for page to fully render
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // Tab through elements until we reach a page link (skip Next.js dev tools)
    let foundPageLink = false;
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      const tag = await page.evaluate(() => document.activeElement?.tagName);
      if (tag === 'A') {
        foundPageLink = true;
        break;
      }
    }
    expect(foundPageLink).toBe(true);
  });

  test('displays properly on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('footer')).toBeVisible();
  });

  test('displays English content at /en locale', async ({ page }) => {
    await page.goto('/en/consumer/terms');
    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // Wait for sections to render, then count h2s
    const h2s = page.getByRole('heading', { level: 2 });
    await expect(h2s.first()).toBeVisible();
    const h2Count = await h2s.count();
    expect(h2Count).toBeGreaterThanOrEqual(10);
  });
});
