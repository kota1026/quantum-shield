import { test, expect } from '@playwright/test';

test.describe('Explorer About Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/explorer/about');
  });

  test('should display the hero section', async ({ page }) => {
    await expect(page.locator('h1:has-text("プロトコルの透明性を実現")')).toBeVisible();
    await expect(page.locator('text=Quantum Shield Explorerは、すべてのLock、Unlock、Challenge')).toBeVisible();
  });

  test('should display the explore button', async ({ page }) => {
    await expect(page.locator('button:has-text("Explorerを開始")').first()).toBeVisible();
  });

  test('should display what is section', async ({ page }) => {
    await expect(page.locator('h2:has-text("Quantum Shield Explorerとは")')).toBeVisible();
    await expect(page.locator('text=Quantum Shieldプロトコルのすべての活動を可視化')).toBeVisible();
  });

  test('should display features section', async ({ page }) => {
    await expect(page.locator('text=主な機能')).toBeVisible();
    await expect(page.locator('text=リアルタイム追跡')).toBeVisible();
    await expect(page.locator('text=高度な検索')).toBeVisible();
    await expect(page.locator('text=分析ダッシュボード')).toBeVisible();
    await expect(page.locator('text=完全な透明性')).toBeVisible();
  });

  test('should display how it works section', async ({ page }) => {
    await expect(page.locator('text=仕組み')).toBeVisible();
    await expect(page.locator('text=1. Lock')).toBeVisible();
    await expect(page.locator('text=2. Unlock要求')).toBeVisible();
    await expect(page.locator('text=3. Prover検証')).toBeVisible();
    await expect(page.locator('text=4. Time Lock')).toBeVisible();
    await expect(page.locator('text=5. 完了')).toBeVisible();
  });

  test('should display resources section', async ({ page }) => {
    await expect(page.locator('text=リソース')).toBeVisible();
    await expect(page.locator('text=ドキュメント')).toBeVisible();
    await expect(page.locator('text=GitHub')).toBeVisible();
    await expect(page.locator('text=Discord')).toBeVisible();
  });

  test('should navigate to overview when clicking explore button', async ({ page }) => {
    await page.locator('button:has-text("Explorerを開始")').first().click();
    await expect(page).toHaveURL(/\/ja\/explorer\/overview/);
  });

  test('should display navigation bar', async ({ page }) => {
    await expect(page.locator('nav[role="navigation"]')).toBeVisible();
    await expect(page.locator('nav[role="navigation"] >> text=概要')).toBeVisible();
    await expect(page.locator('nav[role="navigation"] >> text=Lock')).toBeVisible();
    await expect(page.locator('nav[role="navigation"] >> text=分析')).toBeVisible();
  });

  test('should display in English when navigating to /en', async ({ page }) => {
    await page.goto('/en/explorer/about');

    await expect(page.locator('h1:has-text("Enabling Protocol Transparency")')).toBeVisible();
    await expect(page.locator('text=What is Quantum Shield Explorer')).toBeVisible();
    await expect(page.locator('text=Key Features')).toBeVisible();
    await expect(page.locator('text=How It Works')).toBeVisible();
    await expect(page.locator('text=Resources')).toBeVisible();
    await expect(page.locator('text=Start Exploring')).toBeVisible();
  });

  test('should display feature cards with icons', async ({ page }) => {
    // Check for feature card structure
    const featureCards = page.locator('.grid >> .text-center');
    await expect(featureCards).toHaveCount({ min: 4 });
  });

  test('should display step indicators in how it works', async ({ page }) => {
    // Check for numbered step indicators
    await expect(page.locator('text=1').first()).toBeVisible();
    await expect(page.locator('text=2').first()).toBeVisible();
    await expect(page.locator('text=3').first()).toBeVisible();
    await expect(page.locator('text=4').first()).toBeVisible();
    await expect(page.locator('text=5').first()).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Key content should still be visible
    await expect(page.locator('h1:has-text("プロトコルの透明性を実現")')).toBeVisible();
    await expect(page.locator('text=主な機能')).toBeVisible();
    await expect(page.locator('text=仕組み')).toBeVisible();
    await expect(page.locator('button:has-text("Explorerを開始")').first()).toBeVisible();
  });

  test('should have proper navigation structure', async ({ page }) => {
    await expect(page.locator('nav[role="navigation"][aria-label="Explorer navigation"]')).toBeVisible();
  });

  test('should have external links for resources', async ({ page }) => {
    const githubLink = page.locator('a:has-text("GitHub")');
    await expect(githubLink).toHaveAttribute('target', '_blank');
    await expect(githubLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  test('should display CTA section at bottom', async ({ page }) => {
    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Check for CTA section
    await expect(page.locator('button:has-text("Explorerを開始")').last()).toBeVisible();
  });
});
