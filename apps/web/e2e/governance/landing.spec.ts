import { test, expect } from '@playwright/test';
import { gotoAndWaitForApp } from '../helpers/wait-for-app';

/**
 * Governance Landing (Public Landing Page) E2E Tests
 * Tests for the GovernanceLanding component at /governance/landing
 *
 * This is the public-facing landing page with hero, stats, features,
 * expert quotes, and CTA sections. NOT the logged-in dashboard.
 */

test.describe('Governance Landing Page', () => {
  test.setTimeout(90000);

  test.beforeEach(async ({ page }) => {
    await gotoAndWaitForApp(page, '/ja/qs-hub/landing');
  });

  test.describe('Page Load & Layout', () => {
    test('should display governance landing page correctly', async ({ page }) => {
      await expect(page.getByRole('main')).toBeVisible();
    });

    test('should display hero section with title', async ({ page }) => {
      // The hero title is h1: t('landing.hero.whatIsGovernance.title') = "ガバナンスとは？"
      const h1 = page.getByRole('heading', { level: 1 });
      await expect(h1).toBeVisible();
    });

    test('should display page badge with governance label', async ({ page }) => {
      // The badge renders t('landing.pageTitle') = "ガバナンス"
      await expect(page.getByText('ガバナンス').first()).toBeVisible();
    });
  });

  test.describe('Stats Section', () => {
    test('should display stats section', async ({ page }) => {
      // Stats section has aria-label from t('landing.stats.ariaLabel') = "ガバナンス統計"
      const statsSection = page.locator('section[aria-label="ガバナンス統計"]');
      await expect(statsSection).toBeVisible({ timeout: 10000 });
    });

    test('should display active proposals stat', async ({ page }) => {
      await expect(page.getByText('アクティブな提案').first()).toBeVisible({ timeout: 10000 });
    });

    test('should display participation rate stat', async ({ page }) => {
      await expect(page.getByText('参加率').first()).toBeVisible({ timeout: 10000 });
    });

    test('should display total proposals stat', async ({ page }) => {
      await expect(page.getByText('累計提案数').first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Features Section', () => {
    test('should display benefits title', async ({ page }) => {
      // Section heading: t('onboarding.benefits.title') = "参加するメリット"
      // This section may need scrolling to be visible
      const title = page.getByText('参加するメリット');
      await title.scrollIntoViewIfNeeded();
      await expect(title).toBeVisible({ timeout: 10000 });
    });

    test('should display feature cards with point titles', async ({ page }) => {
      // Feature card titles from landing.hero.whatIsGovernance.point1/2/3.title
      const point1 = page.getByText('提案と投票').first();
      await point1.scrollIntoViewIfNeeded();
      await expect(point1).toBeVisible({ timeout: 10000 });

      await expect(page.getByText('QSトークンで投票').first()).toBeVisible({ timeout: 10000 });
      await expect(page.getByText('セキュリティ評議会').first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('How It Works Section', () => {
    test('should display how to participate title', async ({ page }) => {
      // t('onboarding.howTo.title') = "参加するには？"
      const title = page.getByText('参加するには？');
      await title.scrollIntoViewIfNeeded();
      await expect(title).toBeVisible({ timeout: 10000 });
    });

    test('should display numbered steps', async ({ page }) => {
      // Step titles from onboarding.steps
      const step1 = page.getByText('QSトークンを入手する');
      await step1.scrollIntoViewIfNeeded();
      await expect(step1).toBeVisible({ timeout: 10000 });
      await expect(page.getByText('QSをロックしてveQSを取得')).toBeVisible({ timeout: 10000 });
      await expect(page.getByText('提案に投票する')).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('veQS Section', () => {
    test('should display veQS explanation title', async ({ page }) => {
      // t('onboarding.veqs.title') = "veQSとは？"
      const title = page.getByText('veQSとは？');
      await title.scrollIntoViewIfNeeded();
      await expect(title).toBeVisible({ timeout: 10000 });
    });

    test('should display veQS explanation points', async ({ page }) => {
      const point = page.getByText(/最大2年ロックで/).first();
      await point.scrollIntoViewIfNeeded();
      await expect(point).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Expert Quotes Section', () => {
    test('should display expert quotes section title', async ({ page }) => {
      // t('landing.expertQuotes.title') = "なぜ分散型ガバナンスが重要なのか"
      const title = page.getByText('なぜ分散型ガバナンスが重要なのか');
      await title.scrollIntoViewIfNeeded();
      await expect(title).toBeVisible({ timeout: 10000 });
    });

    test('should display expert quote authors', async ({ page }) => {
      const author = page.getByText('Vitalik Buterin');
      await author.scrollIntoViewIfNeeded();
      await expect(author).toBeVisible({ timeout: 10000 });
    });

    test('should display disclaimer', async ({ page }) => {
      const disclaimer = page.getByText(/上記は参考情報です/).first();
      await disclaimer.scrollIntoViewIfNeeded();
      await expect(disclaimer).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('CTA Section', () => {
    test('should display CTA title', async ({ page }) => {
      // t('onboarding.cta.title') = "さあ、始めましょう！"
      const title = page.getByText('さあ、始めましょう！');
      await title.scrollIntoViewIfNeeded();
      await expect(title).toBeVisible({ timeout: 10000 });
    });

    test('should have lock QS button', async ({ page }) => {
      // t('onboarding.cta.lockButton') = "QSをロックする"
      const lockButton = page.getByText('QSをロックする').first();
      await lockButton.scrollIntoViewIfNeeded();
      await expect(lockButton).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Responsive Design', () => {
    test('should display properly on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await expect(page.getByRole('main')).toBeVisible();
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });

    test('should display properly on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await expect(page.getByRole('main')).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      const h1 = page.getByRole('heading', { level: 1 });
      await expect(h1).toHaveCount(1);
    });

    test('should have proper ARIA landmarks', async ({ page }) => {
      await expect(page.getByRole('main')).toBeVisible();
    });

    test('all interactive elements should be keyboard accessible', async ({ page }) => {
      await page.keyboard.press('Tab');
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    });
  });

  test.describe('i18n', () => {
    test('should display Japanese content on /ja/ path', async ({ page }) => {
      await expect(page.getByText('ガバナンスとは？')).toBeVisible({ timeout: 10000 });
      const benefits = page.getByText('参加するメリット');
      await benefits.scrollIntoViewIfNeeded();
      await expect(benefits).toBeVisible({ timeout: 10000 });
    });

    test('should display English content on /en/ path', async ({ page }) => {
      await gotoAndWaitForApp(page, '/en/qs-hub/landing');

      await expect(page.getByText('What is Governance?')).toBeVisible({ timeout: 10000 });
      const benefits = page.getByText('Benefits of Participating');
      await benefits.scrollIntoViewIfNeeded();
      await expect(benefits).toBeVisible({ timeout: 10000 });
    });
  });
});
