import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Consumer App Landing Page E2E Tests
 * Screen: 01_landing.html
 * Path: /[locale]/consumer
 */

test.describe('Consumer Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/consumer');
  });

  test.describe('Page Load', () => {
    test('should load landing page successfully', async ({ page }) => {
      await expect(page).toHaveTitle(/Quantum Shield/);
    });

    test('should display hero section', async ({ page }) => {
      const heroSection = page.locator('section[aria-label*="ヒーロー"]');
      await expect(heroSection).toBeVisible();
    });

    test('should display hinomaru visual', async ({ page }) => {
      const hinomaru = page.locator('[role="img"][aria-label*="Hinomaru"]');
      await expect(hinomaru).toBeVisible();
    });
  });

  test.describe('Header Navigation', () => {
    test('should display logo', async ({ page }) => {
      const logo = page.locator('header a[aria-label*="Home"]');
      await expect(logo).toBeVisible();
    });

    test('should display navigation links on desktop', async ({ page }) => {
      // Set desktop viewport
      await page.setViewportSize({ width: 1280, height: 720 });

      const nav = page.locator('nav[aria-label*="ナビゲーション"]');
      await expect(nav).toBeVisible();

      await expect(page.getByRole('link', { name: 'プロダクト' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'セキュリティ' })).toBeVisible();
      await expect(page.getByRole('link', { name: '使い方' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'FAQ' })).toBeVisible();
    });

    test('should display mobile menu button on mobile', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 812 });

      const menuButton = page.locator('button[aria-label*="menu"]');
      await expect(menuButton).toBeVisible();
    });

    test('should open mobile menu when clicked', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });

      const menuButton = page.locator('button[aria-label*="menu"]');
      await menuButton.click();

      // Mobile menu should be visible
      await expect(page.locator('nav').locator('a', { hasText: 'プロダクト' })).toBeVisible();
    });
  });

  test.describe('Hero Section', () => {
    test('should display NIST badge', async ({ page }) => {
      const badge = page.locator('text=NIST認定');
      await expect(badge).toBeVisible();
    });

    test('should display hero title', async ({ page }) => {
      const title = page.locator('h1');
      await expect(title).toContainText('量子コンピュータ時代');
      await expect(title).toContainText('デジタル資産保護');
    });

    test('should display CTA buttons', async ({ page }) => {
      const primaryCta = page.getByRole('link', { name: /今すぐ無料で始める/ });
      const secondaryCta = page.getByRole('link', { name: /詳しく見る/ });

      await expect(primaryCta).toBeVisible();
      await expect(secondaryCta).toBeVisible();
    });

    test('should navigate to onboarding on primary CTA click', async ({ page }) => {
      const primaryCta = page.getByRole('link', { name: /今すぐ無料で始める/ });
      await primaryCta.click();

      await expect(page).toHaveURL(/\/consumer\/onboarding/);
    });

    test('should scroll to how-it-works on secondary CTA click', async ({ page }) => {
      const secondaryCta = page.locator('a[href="#how-it-works"]');
      await secondaryCta.click();

      const howItWorksSection = page.locator('#how-it-works');
      await expect(howItWorksSection).toBeInViewport();
    });
  });

  test.describe('Stats Section', () => {
    test('should display all stat cards', async ({ page }) => {
      const statsSection = page.locator('section[aria-label*="統計"]');
      await expect(statsSection).toBeVisible();

      await expect(page.locator('text=$847M+')).toBeVisible();
      await expect(page.locator('text=127')).toBeVisible();
      await expect(page.locator('text=24h')).toBeVisible();
      await expect(page.locator('text=0').first()).toBeVisible();
    });

    test('should display stat labels', async ({ page }) => {
      await expect(page.locator('text=保護された資産')).toBeVisible();
      await expect(page.locator('text=アクティブProver')).toBeVisible();
      await expect(page.locator('text=Time Lock期間')).toBeVisible();
      await expect(page.locator('text=セキュリティインシデント')).toBeVisible();
    });
  });

  test.describe('Features Section', () => {
    test('should display section title', async ({ page }) => {
      const title = page.locator('h2', { hasText: 'なぜQuantum Shieldなのか' });
      await expect(title).toBeVisible();
    });

    test('should display all 6 feature cards', async ({ page }) => {
      const featuresSection = page.locator('section[aria-label*="機能"]');
      const articles = featuresSection.locator('article');
      await expect(articles).toHaveCount(6);
    });

    test('should display feature titles', async ({ page }) => {
      await expect(page.locator('h3', { hasText: 'Dilithium-III暗号' })).toBeVisible();
      await expect(page.locator('h3', { hasText: 'Time Lock保護' })).toBeVisible();
      await expect(page.locator('h3', { hasText: 'ZK-STARK検証' })).toBeVisible();
      await expect(page.locator('h3', { hasText: 'セルフカストディ' })).toBeVisible();
      await expect(page.locator('h3', { hasText: '緊急リカバリー' })).toBeVisible();
      await expect(page.locator('h3', { hasText: '透明性' })).toBeVisible();
    });
  });

  test.describe('How It Works Section', () => {
    test('should display section title', async ({ page }) => {
      const title = page.locator('h2', { hasText: '3ステップで資産を保護' });
      await expect(title).toBeVisible();
    });

    test('should display all 3 steps as ordered list', async ({ page }) => {
      const howItWorksSection = page.locator('#how-it-works');
      const steps = howItWorksSection.locator('ol > li');
      await expect(steps).toHaveCount(3);
    });

    test('should display step titles', async ({ page }) => {
      await expect(page.locator('h3', { hasText: '鍵を生成' })).toBeVisible();
      await expect(page.locator('h3', { hasText: '資産をLock' })).toBeVisible();
      await expect(page.locator('h3', { hasText: '安全にUnlock' })).toBeVisible();
    });
  });

  test.describe('CTA Section', () => {
    test('should display final CTA', async ({ page }) => {
      const ctaSection = page.locator('section[aria-label*="アクション"]');
      await expect(ctaSection).toBeVisible();

      const title = page.locator('h2', { hasText: '量子時代に備えよう' });
      await expect(title).toBeVisible();

      const ctaButton = page.getByRole('link', { name: /無料で始める/ });
      await expect(ctaButton).toBeVisible();
    });
  });

  test.describe('Footer', () => {
    test('should display footer sections', async ({ page }) => {
      const footer = page.locator('footer');
      await expect(footer).toBeVisible();

      await expect(page.locator('text=プロダクト').last()).toBeVisible();
      await expect(page.locator('text=リソース')).toBeVisible();
      await expect(page.locator('text=サポート')).toBeVisible();
    });

    test('should display copyright', async ({ page }) => {
      await expect(page.locator('text=© 2026 Quantum Shield')).toBeVisible();
    });

    test('should display legal links', async ({ page }) => {
      await expect(page.getByRole('link', { name: '利用規約' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'プライバシー' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'リスク開示' })).toBeVisible();
    });
  });

  test.describe('Cookie Banner', () => {
    test('should display cookie banner on first visit', async ({ page }) => {
      // Clear storage to simulate first visit
      await page.context().clearCookies();

      await page.goto('/ja/consumer');

      const cookieBanner = page.locator('[role="dialog"][aria-label*="Cookie"]');
      await expect(cookieBanner).toBeVisible();
    });

    test('should hide cookie banner after acceptance', async ({ page }) => {
      await page.context().clearCookies();
      await page.goto('/ja/consumer');

      const acceptButton = page.getByRole('button', { name: '同意する' });
      await acceptButton.click();

      const cookieBanner = page.locator('[role="dialog"][aria-label*="Cookie"]');
      await expect(cookieBanner).not.toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should have no accessibility violations', async ({ page }) => {
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('should have skip to main content link', async ({ page }) => {
      const skipLink = page.locator('a[href="#main-content"]');
      await expect(skipLink).toBeAttached();
    });

    test('should focus main content after skip link', async ({ page }) => {
      // Press Tab to focus skip link
      await page.keyboard.press('Tab');
      await page.keyboard.press('Enter');

      const mainContent = page.locator('#main-content');
      await expect(mainContent).toBeFocused();
    });

    test('should have proper heading hierarchy', async ({ page }) => {
      // Should have exactly one h1
      const h1Elements = page.locator('h1');
      await expect(h1Elements).toHaveCount(1);

      // Check h2 elements exist
      const h2Elements = page.locator('h2');
      expect(await h2Elements.count()).toBeGreaterThan(0);
    });

    test('should have proper link text', async ({ page }) => {
      // All links should have accessible names
      const links = page.locator('a');
      const count = await links.count();

      for (let i = 0; i < count; i++) {
        const link = links.nth(i);
        const accessibleName = await link.getAttribute('aria-label') || await link.innerText();
        expect(accessibleName.trim().length).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Responsive Design', () => {
    test('should display correctly on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });

      // Hero should be visible
      await expect(page.locator('h1')).toBeVisible();

      // Stats should stack vertically
      const statsGrid = page.locator('section[aria-label*="統計"] > div');
      await expect(statsGrid).toHaveCSS('grid-template-columns', /1fr/);
    });

    test('should display correctly on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      // Features should show 2 columns
      const featuresGrid = page.locator('section[aria-label*="機能"] > div').last();
      await expect(featuresGrid).toBeVisible();
    });

    test('should display correctly on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });

      // Navigation should be visible
      const nav = page.locator('nav[aria-label*="ナビゲーション"]');
      await expect(nav).toBeVisible();

      // Stats should show 4 columns
      const statsGrid = page.locator('section[aria-label*="統計"] > div');
      await expect(statsGrid).toBeVisible();
    });
  });

  test.describe('English Version', () => {
    test('should display English content', async ({ page }) => {
      await page.goto('/en/consumer');

      await expect(page.locator('h1')).toContainText('Quantum Computing Era');
      await expect(page.getByRole('link', { name: /Get Started for Free/ })).toBeVisible();
    });
  });
});
