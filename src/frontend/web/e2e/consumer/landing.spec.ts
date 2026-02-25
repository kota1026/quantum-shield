/**
 * Consumer App Landing Page E2E Tests
 *
 * Static public page — no authentication needed.
 * Uses the a11y fixture for accessibility checks.
 * All assertions avoid hardcoded data values where possible.
 */

import { test, expect } from '../fixtures';

const LANDING_URL_JA = '/ja/consumer/landing';
const LANDING_URL_EN = '/en/consumer/landing';

// ---------------------------------------------------------------------------
// 1. Page Structure
// ---------------------------------------------------------------------------
test.describe('Page Structure', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(LANDING_URL_JA);
  });

  test('should render main landmark with role', async ({ page }) => {
    const main = page.getByRole('main');
    await expect(main).toBeVisible({ timeout: 15000 });
  });

  test('should display h1 heading in hero section', async ({ page }) => {
    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toBeVisible();
  });

  test('should display header with logo and navigation', async ({ page }) => {
    // Logo link with aria-label "Consumer App Home"
    await expect(page.getByRole('link', { name: /Consumer App Home/i })).toBeVisible();
    // Header banner
    await expect(page.getByRole('banner')).toBeVisible();
  });

  test('should display footer with content info', async ({ page }) => {
    await expect(page.getByRole('contentinfo')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 2. Hero Section
// ---------------------------------------------------------------------------
test.describe('Hero Section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(LANDING_URL_JA);
  });

  test('should display quantum protection badge', async ({ page }) => {
    // Badge text comes from i18n: hero.badge
    const badge = page.locator('span').filter({ hasText: /量子耐性|Quantum/i }).first();
    await expect(badge).toBeVisible();
  });

  test('should display primary CTA button', async ({ page }) => {
    const cta = page.getByRole('button', { name: /今すぐ無料で始める|Get Started/i });
    await expect(cta).toBeVisible();
  });

  test('should display secondary CTA button', async ({ page }) => {
    const learnMore = page.getByRole('button', { name: /詳しく見る|Learn More/i });
    await expect(learnMore).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 3. CTA Navigation
// ---------------------------------------------------------------------------
test.describe('CTA Navigation', () => {
  test('primary CTA should navigate to onboarding', async ({ page }) => {
    await page.goto(LANDING_URL_JA);
    // CTA is a Link wrapping a Button - click the parent link
    const ctaLink = page.locator('a[href*="/consumer/onboarding"]').first();
    await ctaLink.click();
    await expect(page).toHaveURL(/\/consumer\/onboarding/, { timeout: 15000 });
  });

  test('learn more link should scroll to how-it-works section', async ({ page }) => {
    await page.goto(LANDING_URL_JA);
    const link = page.locator('a[href="#how-it-works"]');
    if (await link.isVisible()) {
      await link.click();
      const howItWorks = page.locator('#how-it-works');
      await expect(howItWorks).toBeInViewport();
    }
  });
});

// ---------------------------------------------------------------------------
// 4. Features Section
// ---------------------------------------------------------------------------
test.describe('Features Section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(LANDING_URL_JA);
  });

  test('should display features section heading', async ({ page }) => {
    const heading = page.getByRole('heading', { name: /なぜQuantum Shield|Why Quantum Shield/i });
    await expect(heading).toBeVisible();
  });

  test('should display 6 feature cards', async ({ page }) => {
    const featureSection = page.locator('#features');
    await expect(featureSection).toBeVisible();

    // 6 feature article cards
    const cards = featureSection.locator('article');
    await expect(cards).toHaveCount(6);
  });
});

// ---------------------------------------------------------------------------
// 5. Steps Section (How It Works)
// ---------------------------------------------------------------------------
test.describe('Steps Section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(LANDING_URL_JA);
  });

  test('should display how it works heading', async ({ page }) => {
    const heading = page.getByRole('heading', { name: /3ステップ|3 Steps/i });
    await expect(heading).toBeVisible();
  });

  test('should display 3 step cards in order', async ({ page }) => {
    const howItWorks = page.locator('#how-it-works');
    const stepCards = howItWorks.locator('article');
    await expect(stepCards).toHaveCount(3);

    // Step 1, 2, 3 titles are visible
    await expect(stepCards.nth(0)).toBeVisible();
    await expect(stepCards.nth(1)).toBeVisible();
    await expect(stepCards.nth(2)).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 6. Stats Section
// ---------------------------------------------------------------------------
test.describe('Stats Section', () => {
  test('should display stats section with aria label', async ({ page }) => {
    await page.goto(LANDING_URL_JA);
    const statsSection = page.getByLabel(/統計情報|Statistics/i);
    await expect(statsSection).toBeVisible();
  });

  test('should display 4 stat cards', async ({ page }) => {
    await page.goto(LANDING_URL_JA);
    const statsSection = page.getByLabel(/統計情報|Statistics/i);
    const cards = statsSection.locator('.card');
    await expect(cards).toHaveCount(4);
  });
});

// ---------------------------------------------------------------------------
// 7. Footer
// ---------------------------------------------------------------------------
test.describe('Footer', () => {
  test('should display footer with legal links', async ({ page }) => {
    await page.goto(LANDING_URL_JA);
    const footer = page.getByRole('contentinfo');
    await expect(footer).toBeVisible();

    await expect(footer.getByRole('link', { name: /利用規約|Terms/i })).toBeVisible();
    await expect(footer.getByRole('link', { name: /プライバシー|Privacy/i })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 8. Accessibility
// ---------------------------------------------------------------------------
test.describe('Accessibility', () => {
  test('should pass axe accessibility checks', async ({ page, a11y }) => {
    await page.goto(LANDING_URL_JA);
    const results = await a11y.analyze();
    expect(results.violations).toEqual([]);
  });

  test('skip link should be functional', async ({ page }) => {
    await page.goto(LANDING_URL_JA);
    const skipLink = page.getByText('Skip to main content').first();
    await skipLink.focus();
    await expect(skipLink).toBeVisible();
  });

  test('touch targets should be at least 44px', async ({ page }) => {
    await page.goto(LANDING_URL_JA);
    const cta = page.getByRole('button', { name: /今すぐ無料で始める|Get Started/i });
    const box = await cta.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
  });
});

// ---------------------------------------------------------------------------
// 9. Responsive Design
// ---------------------------------------------------------------------------
test.describe('Responsive Design', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should display correctly on mobile', async ({ page }) => {
    await page.goto(LANDING_URL_JA);

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('button', { name: /今すぐ無料で始める|Get Started/i })).toBeVisible();
    await expect(page.getByRole('contentinfo')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 10. English Locale
// ---------------------------------------------------------------------------
test.describe('English Locale', () => {
  test('should display English content', async ({ page }) => {
    await page.goto(LANDING_URL_EN);

    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('should display English CTA button', async ({ page }) => {
    await page.goto(LANDING_URL_EN);
    await expect(page.getByRole('main')).toBeVisible({ timeout: 15000 });
    // Two CTA buttons exist: hero "Get Started for Free" and bottom "Get Started Free"
    await expect(page.getByRole('button', { name: /Get Started/i }).first()).toBeVisible();
  });
});
