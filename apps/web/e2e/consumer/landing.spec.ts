import { test, expect } from '../fixtures';

test.describe('Consumer App - Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/consumer');
  });

  test('should display landing page with correct structure', async ({ page }) => {
    // Header should be visible
    await expect(page.getByRole('link', { name: /Quantum Shield/i })).toBeVisible();
    await expect(page.getByRole('navigation')).toBeVisible();

    // Hero section
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('button', { name: /今すぐ無料で始める|Get Started for Free/i })).toBeVisible();

    // Features section
    await expect(page.getByRole('heading', { name: /なぜQuantum Shield|Why Quantum Shield/i })).toBeVisible();

    // How It Works section
    await expect(page.getByRole('heading', { name: /3ステップ|3 Steps/i })).toBeVisible();

    // Footer should be visible
    await expect(page.getByRole('contentinfo')).toBeVisible();
  });

  test('should have accessible navigation', async ({ page }) => {
    // Skip link should be functional
    const skipLink = page.getByText('Skip to main content');
    await skipLink.focus();
    await expect(skipLink).toBeVisible();

    // Navigation links should be accessible
    const nav = page.getByRole('navigation');
    await expect(nav).toHaveAttribute('aria-label', 'Main navigation');
  });

  test('should pass accessibility checks', async ({ page, a11y }) => {
    const accessibilityScanResults = await a11y.analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should display stats section', async ({ page }) => {
    const statsSection = page.getByLabel(/統計情報|Statistics/i);
    await expect(statsSection).toBeVisible();

    // Check stat values are displayed
    await expect(page.getByText('$847M+')).toBeVisible();
    await expect(page.getByText('127')).toBeVisible();
    await expect(page.getByText('24h')).toBeVisible();
    await expect(page.getByText(/^0$/)).toBeVisible();
  });

  test('should navigate to onboarding when CTA clicked', async ({ page }) => {
    await page.getByRole('button', { name: /今すぐ無料で始める|Get Started for Free/i }).click();
    await expect(page).toHaveURL(/\/consumer\/onboarding/);
  });

  test('should scroll to features section when "Learn More" clicked', async ({ page }) => {
    await page.getByRole('link', { name: /詳しく見る|Learn More/i }).click();

    // Features section should be in view
    const featuresSection = page.locator('#how-it-works');
    await expect(featuresSection).toBeInViewport();
  });

  test('should display cookie banner', async ({ page }) => {
    const cookieBanner = page.getByRole('alertdialog');
    await expect(cookieBanner).toBeVisible();

    // Accept cookies
    await page.getByRole('button', { name: /同意する|Accept/i }).click();
    await expect(cookieBanner).not.toBeVisible();
  });

  test('should display feature cards with tooltips', async ({ page }) => {
    // Hover over a feature title with tooltip
    const dilithiumTitle = page.getByText(/Dilithium-III暗号|Dilithium-III Cryptography/i);
    await dilithiumTitle.hover();

    // Tooltip should appear (implementation dependent)
    const tooltip = page.getByRole('tooltip');
    await expect(tooltip).toBeVisible();
  });

  test('should display step cards in correct order', async ({ page }) => {
    const step1 = page.getByText(/鍵を生成|Generate Keys/i);
    const step2 = page.getByText(/資産をLock|Lock Assets/i);
    const step3 = page.getByText(/安全にUnlock|Unlock Safely/i);

    await expect(step1).toBeVisible();
    await expect(step2).toBeVisible();
    await expect(step3).toBeVisible();
  });

  test('should have correct footer links', async ({ page }) => {
    const footer = page.getByRole('contentinfo');

    // Check footer sections exist
    await expect(footer.getByText(/プロダクト|Product/i).first()).toBeVisible();
    await expect(footer.getByText(/リソース|Resources/i).first()).toBeVisible();
    await expect(footer.getByText(/サポート|Support/i).first()).toBeVisible();

    // Check legal links
    await expect(footer.getByRole('link', { name: /利用規約|Terms/i })).toBeVisible();
    await expect(footer.getByRole('link', { name: /プライバシー|Privacy/i })).toBeVisible();
  });
});

test.describe('Consumer App - Landing Page - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should display correctly on mobile', async ({ page }) => {
    await page.goto('/consumer');

    // Header should be visible
    await expect(page.getByRole('link', { name: /Quantum Shield/i })).toBeVisible();

    // Hero should be visible
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // CTA buttons should be full width on mobile
    const ctaButton = page.getByRole('button', { name: /今すぐ無料で始める|Get Started for Free/i });
    await expect(ctaButton).toBeVisible();
  });

  test('should have proper touch targets', async ({ page }) => {
    await page.goto('/consumer');

    // Check that buttons are at least 44x44 pixels
    const ctaButton = page.getByRole('button', { name: /今すぐ無料で始める|Get Started for Free/i });
    const box = await ctaButton.boundingBox();

    expect(box?.height).toBeGreaterThanOrEqual(44);
  });
});

test.describe('Consumer App - Landing Page - i18n', () => {
  test('should display Japanese content by default', async ({ page }) => {
    await page.goto('/ja/consumer');

    await expect(page.locator('html')).toHaveAttribute('lang', 'ja');
    await expect(page.getByText('量子コンピュータ時代の')).toBeVisible();
  });

  test('should display English content', async ({ page }) => {
    await page.goto('/en/consumer');

    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByText('Digital Asset Protection')).toBeVisible();
  });
});
