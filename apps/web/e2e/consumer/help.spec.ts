import { test, expect } from '@playwright/test';

/**
 * Consumer App Help E2E Tests
 * Tests for Screen 13: help
 */

test.describe('Help Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/consumer/help');
  });

  test.describe('Page Structure', () => {
    test('should display page title', async ({ page }) => {
      await expect(page.locator('h1')).toContainText('ヘルプ');
    });

    test('should display back button', async ({ page }) => {
      const backButton = page.locator('a[aria-label="戻る"]');
      await expect(backButton).toBeVisible();
      await expect(backButton).toHaveAttribute('href', '/consumer/settings');
    });

    test('should have main landmark', async ({ page }) => {
      const main = page.locator('main[role="main"]');
      await expect(main).toBeVisible();
    });
  });

  test.describe('Search', () => {
    test('should display search input', async ({ page }) => {
      const searchInput = page.locator('input[type="search"]');
      await expect(searchInput).toBeVisible();
      await expect(searchInput).toHaveAttribute('aria-label', 'ヘルプを検索');
    });

    test('should allow typing in search', async ({ page }) => {
      const searchInput = page.locator('input[type="search"]');
      await searchInput.fill('ロック');
      await expect(searchInput).toHaveValue('ロック');
    });
  });

  test.describe('Quick Links', () => {
    test('should display quick links section', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'クイックリンク' })).toBeVisible();
    });

    test('should display all quick link items', async ({ page }) => {
      await expect(page.getByText('はじめに')).toBeVisible();
      await expect(page.getByText('Lock / Unlock')).toBeVisible();
      await expect(page.getByText('セキュリティ')).toBeVisible();
      await expect(page.getByText('トラブルシューティング')).toBeVisible();
    });

    test('quick links should be clickable', async ({ page }) => {
      const gettingStartedLink = page.getByText('はじめに').locator('..');
      await expect(gettingStartedLink).toBeVisible();
    });
  });

  test.describe('Resources', () => {
    test('should display resources section', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'リソース' })).toBeVisible();
    });

    test('should display all resource items', async ({ page }) => {
      await expect(page.getByText('よくある質問')).toBeVisible();
      await expect(page.getByText('お問い合わせ')).toBeVisible();
      await expect(page.getByText('ドキュメント')).toBeVisible();
      await expect(page.getByText('システムステータス')).toBeVisible();
    });

    test('FAQ link should navigate to FAQ page', async ({ page }) => {
      const faqLink = page.getByRole('link', { name: /よくある質問/ });
      await expect(faqLink).toHaveAttribute('href', '/consumer/faq');
    });

    test('Contact link should navigate to contact page', async ({ page }) => {
      const contactLink = page.getByRole('link', { name: /お問い合わせ/ });
      await expect(contactLink).toHaveAttribute('href', '/consumer/contact');
    });
  });

  test.describe('Tutorial CTA', () => {
    test('should display tutorial section', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'チュートリアル' })).toBeVisible();
    });

    test('should display tutorial button', async ({ page }) => {
      const tutorialButton = page.getByRole('link', { name: 'チュートリアルを見る' });
      await expect(tutorialButton).toBeVisible();
      await expect(tutorialButton).toHaveAttribute('href', '/consumer/onboarding');
    });
  });

  test.describe('Navigation', () => {
    test('should navigate back to settings', async ({ page }) => {
      const backButton = page.locator('a[aria-label="戻る"]');
      await backButton.click();
      await expect(page).toHaveURL(/\/consumer\/settings$/);
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      const h1 = page.locator('h1');
      await expect(h1).toHaveCount(1);

      const h2 = page.locator('h2');
      await expect(h2).toHaveCount(2); // Quick Links, Resources

      const h3 = page.locator('h3');
      const h3Count = await h3.count();
      expect(h3Count).toBeGreaterThanOrEqual(5); // Quick link items + resources + tutorial
    });

    test('search input should be focusable', async ({ page }) => {
      const searchInput = page.locator('input[type="search"]');
      await searchInput.focus();
      await expect(searchInput).toBeFocused();
    });

    test('links should be focusable', async ({ page }) => {
      const firstLink = page.locator('section a').first();
      await firstLink.focus();
      await expect(firstLink).toBeFocused();
    });
  });

  test.describe('Responsive Design', () => {
    test('should display properly on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('input[type="search"]')).toBeVisible();
      await expect(page.getByRole('heading', { name: 'クイックリンク' })).toBeVisible();
    });

    test('should display properly on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      await expect(page.locator('h1')).toBeVisible();
      await expect(page.getByRole('heading', { name: 'リソース' })).toBeVisible();
    });
  });
});

test.describe('Help Page (English)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/consumer/help');
  });

  test('should display content in English', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Help');
    await expect(page.getByRole('heading', { name: 'Quick Links' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Resources' })).toBeVisible();
  });

  test('should display search placeholder in English', async ({ page }) => {
    const searchInput = page.locator('input[type="search"]');
    await expect(searchInput).toHaveAttribute('placeholder', 'Search for help...');
  });

  test('should display tutorial button in English', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'View Tutorial' })).toBeVisible();
  });
});
