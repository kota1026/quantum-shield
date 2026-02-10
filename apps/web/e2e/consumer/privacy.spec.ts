import { test, expect } from '@playwright/test';

/**
 * Consumer App - Privacy Policy Page
 * Static content page: no auth, no API calls
 */
test.describe('Consumer Privacy Policy Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/consumer/privacy');
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
    // 9 sections + contact = at least 10
    expect(h2Count).toBeGreaterThanOrEqual(10);
  });

  test('renders all policy sections as h2 headings', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const h2s = page.getByRole('heading', { level: 2 });
    await expect(h2s.first()).toBeVisible();
    const h2Count = await h2s.count();
    expect(h2Count).toBeGreaterThanOrEqual(10);

    await expect(h2s.last()).toBeVisible();
  });

  test('has back button that links to consumer home', async ({ page }) => {
    const headerLinks = page.locator('header').getByRole('link');
    const backLink = headerLinks.last();
    await expect(backLink).toBeVisible();
    await expect(backLink).toHaveAttribute('href', '/consumer');
  });

  test('has logo link that navigates to consumer home', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const logoLink = page.locator('header').getByRole('link').first();
    await expect(logoLink).toHaveAttribute('href', '/consumer');
    await expect(page.locator('header').getByText('Quantum Shield')).toBeVisible();
  });

  test('displays last updated date', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const main = page.getByRole('main');
    const dateText = main.locator('p').first();
    await expect(dateText).toBeVisible();
  });

  test('displays footer with navigation links', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();

    const footerLinks = footer.getByRole('link');
    await expect(footerLinks.first()).toBeVisible();
    const linkCount = await footerLinks.count();
    expect(linkCount).toBeGreaterThanOrEqual(4);
  });

  test('footer links have correct hrefs', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const footer = page.locator('footer');
    await expect(footer.locator('a[href="/consumer"]')).toBeVisible();
    await expect(footer.locator('a[href="/consumer/terms"]')).toBeVisible();
    await expect(footer.locator('a[href="/consumer/privacy"]')).toBeVisible();
    await expect(footer.locator('a[href="/consumer/faq"]')).toBeVisible();
  });

  test('displays copyright notice in footer', async ({ page }) => {
    const footer = page.locator('footer');
    await expect(footer.getByText(/©/)).toBeVisible();
  });

  test('displays properly on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('footer')).toBeVisible();
  });

  test('displays English content at /en locale', async ({ page }) => {
    await page.goto('/en/consumer/privacy');
    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // English version should also have h2 sections
    const h2s = page.getByRole('heading', { level: 2 });
    await expect(h2s.first()).toBeVisible();
    const h2Count = await h2s.count();
    expect(h2Count).toBeGreaterThanOrEqual(10);
  });
});
