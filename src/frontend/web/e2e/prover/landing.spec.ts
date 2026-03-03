import { test, expect } from '../fixtures';

test.describe('Prover Portal - Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/prover/landing');
  });

  test('should display landing page with correct structure', async ({ page }) => {
    // Header should be visible
    await expect(page.getByRole('banner')).toBeVisible();
    await expect(page.getByText('Quantum Shield')).toBeVisible();
    await expect(page.getByText('Prover Portal')).toBeVisible();

    // Navigation should be visible
    await expect(page.getByRole('navigation')).toBeVisible();

    // Hero section (main)
    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // CTA buttons should be visible
    await expect(page.getByRole('link', { name: /Apply to Become a Prover|Proverに申請する/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /View Requirements|要件を確認/i })).toBeVisible();

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

    // Current page should be marked
    await expect(page.getByRole('link', { name: 'Overview' })).toHaveAttribute('aria-current', 'page');
  });

  test('should pass accessibility checks', async ({ page, a11y }) => {
    const accessibilityScanResults = await a11y.analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should display stats section', async ({ page }) => {
    const statsSection = page.getByLabel(/Network statistics/i);
    await expect(statsSection).toBeVisible();
  });

  test('should display requirements section', async ({ page }) => {
    // Section title
    await expect(page.getByRole('heading', { name: /What You Need|必要なもの/i })).toBeVisible();

    // Requirement cards
    await expect(page.getByText('$400,000')).toBeVisible();
    await expect(page.getByText('FIPS 140-2 L3+')).toBeVisible();
    await expect(page.getByText('99.9% / 30s')).toBeVisible();
  });

  test('should display ROI calculator section', async ({ page }) => {
    // Section title
    await expect(page.getByRole('heading', { name: /ROI Calculator|ROI計算機/i })).toBeVisible();

    // Calculator inputs
    await expect(page.getByLabel(/Stake Amount|ステーク額/i)).toBeVisible();
    await expect(page.getByLabel(/Monthly Volume|月間予想取引量/i)).toBeVisible();
    await expect(page.getByLabel(/Uptime|予想稼働率/i)).toBeVisible();

    // Calculator result
    await expect(page.getByText('27.75 ETH')).toBeVisible();
    await expect(page.getByText('24.00 ETH')).toBeVisible();
    await expect(page.getByText('3.75 ETH')).toBeVisible();
  });

  test('should display slashing warning section', async ({ page }) => {
    // Warning title
    await expect(page.getByText(/Quadratic Slashing Risk|二次スラッシングリスク/i)).toBeVisible();

    // Slashing table
    const table = page.getByRole('table', { name: /Slashing penalties/i });
    await expect(table).toBeVisible();

    // Check table values
    await expect(page.getByText('1 Prover')).toBeVisible();
    await expect(page.getByText('10%')).toBeVisible();
    await expect(page.getByText('$40,000')).toBeVisible();
  });

  test('should display CTA section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Ready to Join the Network|ネットワークに参加する準備/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Start Application|申請を開始/i })).toBeVisible();
  });

  test('should have footer links', async ({ page }) => {
    const footer = page.getByRole('contentinfo');

    await expect(footer.getByRole('link', { name: /Terms of Service|利用規約/i })).toBeVisible();
    await expect(footer.getByRole('link', { name: /Privacy Policy|プライバシーポリシー/i })).toBeVisible();
    await expect(footer.getByRole('link', { name: /Cookie Policy|Cookieポリシー/i })).toBeVisible();
  });

  test('should navigate to application page when Apply clicked', async ({ page }) => {
    await page.getByRole('link', { name: /Apply to Become a Prover|Proverに申請する/i }).first().click();
    await expect(page).toHaveURL(/\/prover\/application/);
  });

  test('should navigate to requirements page when View Requirements clicked', async ({ page }) => {
    await page.getByRole('link', { name: /View Requirements|要件を確認/i }).first().click();
    await expect(page).toHaveURL(/\/prover\/requirements/);
  });

  test('calculator inputs should accept valid values and update results', async ({ page }) => {
    // Get the results region
    const resultsRegion = page.getByLabel(/ROI calculation results/i);
    await expect(resultsRegion).toBeVisible();

    // Stake amount
    const stakeInput = page.getByLabel(/Stake Amount|ステーク額/i);
    await stakeInput.clear();
    await stakeInput.fill('200');
    await expect(stakeInput).toHaveValue('200');

    // Monthly volume
    const volumeInput = page.getByLabel(/Monthly Volume|月間予想取引量/i);
    await volumeInput.clear();
    await volumeInput.fill('100000');
    await expect(volumeInput).toHaveValue('100000');

    // Uptime
    const uptimeInput = page.getByLabel(/Uptime|予想稼働率/i);
    await uptimeInput.clear();
    await uptimeInput.fill('99.5');
    await expect(uptimeInput).toHaveValue('99.5');

    // Results should be updated (ROI values should change from defaults)
    // With 100000 monthly volume, signature fees = 100000 * 0.0004 * 12 = 480 ETH
    await expect(resultsRegion).toContainText('480.00 ETH');
  });

  test('calculator should show real-time hint', async ({ page }) => {
    await expect(page.getByText(/Results update in real-time|入力値を変更すると/i)).toBeVisible();
  });
});

test.describe('Prover Portal - Landing Page - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should display correctly on mobile', async ({ page }) => {
    await page.goto('/prover/landing');

    // Header should be visible
    await expect(page.getByText('Quantum Shield')).toBeVisible();

    // Hero should be visible
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // CTA buttons should be visible
    await expect(page.getByRole('link', { name: /Apply to Become a Prover|Proverに申請する/i }).first()).toBeVisible();
  });

  test('should have proper touch targets', async ({ page }) => {
    await page.goto('/prover/landing');

    // Check that buttons are at least 44x44 pixels
    const ctaButton = page.getByRole('link', { name: /Apply to Become a Prover|Proverに申請する/i }).first();
    const box = await ctaButton.boundingBox();

    expect(box?.height).toBeGreaterThanOrEqual(44);
  });
});

test.describe('Prover Portal - Landing Page - i18n', () => {
  test('should display Japanese content', async ({ page }) => {
    await page.goto('/ja/prover/landing');

    await expect(page.locator('html')).toHaveAttribute('lang', 'ja');
    await expect(page.getByText('Proverになろう')).toBeVisible();
    await expect(page.getByText('量子耐性インフラ')).toBeVisible();
  });

  test('should display English content', async ({ page }) => {
    await page.goto('/en/prover/landing');

    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByText('Become a Prover')).toBeVisible();
    await expect(page.getByText('Quantum-Resistant Infrastructure')).toBeVisible();
  });
});
