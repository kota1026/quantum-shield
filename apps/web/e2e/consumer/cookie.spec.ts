import { test, expect } from '@playwright/test';

/**
 * Consumer App Cookie Policy E2E Tests
 * Tests for Screen 18: cookie
 */

test.describe('Cookie Policy Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/consumer/cookie');
  });

  test.describe('Page Structure', () => {
    test('should display page title with cookie icon', async ({ page }) => {
      await expect(page.locator('h1')).toContainText('Cookieポリシー');
      await expect(page.locator('svg.lucide-cookie')).toBeVisible();
    });

    test('should display back button', async ({ page }) => {
      const backButton = page.locator('a[aria-label="戻る"]');
      await expect(backButton).toBeVisible();
    });

    test('should have main landmark', async ({ page }) => {
      const main = page.locator('main[role="main"]');
      await expect(main).toBeVisible();
    });

    test('should display last updated date', async ({ page }) => {
      await expect(page.getByText(/最終更新日:/)).toBeVisible();
    });

    test('should display quantum shield logo in header', async ({ page }) => {
      await expect(page.getByText('Quantum Shield').first()).toBeVisible();
    });
  });

  test.describe('Cookie Settings Panel', () => {
    test('should display cookie settings button', async ({ page }) => {
      await expect(page.getByText('Cookie設定')).toBeVisible();
    });

    test('should toggle settings panel when button is clicked', async ({ page }) => {
      const settingsButton = page.getByText('Cookie設定').locator('..');
      await settingsButton.click();

      // Settings panel should be visible
      await expect(page.getByText('必須Cookie')).toBeVisible();
      await expect(page.getByText('分析Cookie')).toBeVisible();
      await expect(page.getByText('機能Cookie')).toBeVisible();
    });

    test('should display toggle switches for cookies', async ({ page }) => {
      const settingsButton = page.getByText('Cookie設定').locator('..');
      await settingsButton.click();

      // Check for toggle switches
      const analyticSwitch = page.locator('button[role="switch"][aria-label="分析Cookie"]');
      await expect(analyticSwitch).toBeVisible();

      const functionalSwitch = page.locator('button[role="switch"][aria-label="機能Cookie"]');
      await expect(functionalSwitch).toBeVisible();
    });

    test('should toggle analytics cookie setting', async ({ page }) => {
      const settingsButton = page.getByText('Cookie設定').locator('..');
      await settingsButton.click();

      const analyticSwitch = page.locator('button[role="switch"][aria-label="分析Cookie"]');
      await expect(analyticSwitch).toHaveAttribute('aria-checked', 'true');

      await analyticSwitch.click();
      await expect(analyticSwitch).toHaveAttribute('aria-checked', 'false');
    });

    test('should display save and accept all buttons', async ({ page }) => {
      const settingsButton = page.getByText('Cookie設定').locator('..');
      await settingsButton.click();

      await expect(page.getByRole('button', { name: '設定を保存' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'すべて許可' })).toBeVisible();
    });
  });

  test.describe('Policy Sections', () => {
    test('should display about cookies section', async ({ page }) => {
      await expect(page.getByText('Cookieについて')).toBeVisible();
    });

    test('should display what are cookies section', async ({ page }) => {
      await expect(page.getByText('Cookieとは')).toBeVisible();
    });

    test('should display essential cookies section with items', async ({ page }) => {
      await expect(page.getByText('必須Cookie').first()).toBeVisible();
      await expect(page.getByText('セッション管理')).toBeVisible();
      await expect(page.getByText('セキュリティ')).toBeVisible();
    });

    test('should display analytics cookies section with items', async ({ page }) => {
      // Get the section heading (not the settings toggle)
      const analyticsHeading = page.locator('h2').getByText('分析Cookie');
      await expect(analyticsHeading).toBeVisible();
      await expect(page.getByText('ページビュー数の計測')).toBeVisible();
    });

    test('should display functional cookies section', async ({ page }) => {
      const functionalHeading = page.locator('h2').getByText('機能Cookie');
      await expect(functionalHeading).toBeVisible();
    });

    test('should display third party cookies section', async ({ page }) => {
      await expect(page.getByText('サードパーティCookie')).toBeVisible();
      await expect(page.getByText('Google Analytics')).toBeVisible();
    });

    test('should display managing cookies section', async ({ page }) => {
      await expect(page.getByText('Cookieの管理')).toBeVisible();
    });

    test('should display policy changes section', async ({ page }) => {
      await expect(page.getByText('ポリシーの変更')).toBeVisible();
    });

    test('should display contact section', async ({ page }) => {
      await expect(page.getByText('お問い合わせ').last()).toBeVisible();
      await expect(page.getByText('privacy@quantumshield.io')).toBeVisible();
    });
  });

  test.describe('Footer', () => {
    test('should display footer links', async ({ page }) => {
      await expect(page.locator('footer').getByText('ホーム')).toBeVisible();
      await expect(page.locator('footer').getByText('利用規約')).toBeVisible();
      await expect(page.locator('footer').getByText('プライバシー')).toBeVisible();
      await expect(page.locator('footer').getByText('Cookie')).toBeVisible();
    });

    test('should display copyright', async ({ page }) => {
      await expect(page.getByText('© 2026 Quantum Shield. Made in Japan')).toBeVisible();
    });
  });

  test.describe('Navigation', () => {
    test('should navigate to home from logo', async ({ page }) => {
      await page.locator('header').getByText('Quantum Shield').click();
      await expect(page).toHaveURL(/\/consumer$/);
    });

    test('should navigate to terms from footer', async ({ page }) => {
      await page.locator('footer').getByText('利用規約').click();
      await expect(page).toHaveURL(/\/consumer\/terms$/);
    });

    test('should navigate to privacy from footer', async ({ page }) => {
      await page.locator('footer').getByText('プライバシー').click();
      await expect(page).toHaveURL(/\/consumer\/privacy$/);
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      const h1 = page.locator('h1');
      await expect(h1).toHaveCount(1);

      const h2 = page.locator('h2');
      const h2Count = await h2.count();
      expect(h2Count).toBeGreaterThan(0);
    });

    test('toggle switches should have proper aria attributes', async ({ page }) => {
      const settingsButton = page.getByText('Cookie設定').locator('..');
      await settingsButton.click();

      const analyticSwitch = page.locator('button[role="switch"][aria-label="分析Cookie"]');
      await expect(analyticSwitch).toHaveAttribute('role', 'switch');
      await expect(analyticSwitch).toHaveAttribute('aria-checked');
    });

    test('should be keyboard navigable', async ({ page }) => {
      // Tab to the settings button
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      // Open settings panel
      await page.keyboard.press('Enter');

      // Check that panel is open
      await expect(page.getByText('必須Cookie')).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should display properly on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      await expect(page.locator('h1')).toBeVisible();
      await expect(page.getByText('Cookie設定')).toBeVisible();
    });

    test('should display properly on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('footer')).toBeVisible();
    });
  });
});

test.describe('Cookie Policy Page (English)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/consumer/cookie');
  });

  test('should display content in English', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Cookie Policy');
    await expect(page.getByText('About Cookies')).toBeVisible();
    await expect(page.getByText('What Are Cookies')).toBeVisible();
  });

  test('should display cookie settings in English', async ({ page }) => {
    await expect(page.getByText('Cookie Settings')).toBeVisible();

    const settingsButton = page.getByText('Cookie Settings').locator('..');
    await settingsButton.click();

    await expect(page.getByText('Essential Cookies')).toBeVisible();
    await expect(page.getByText('Analytics Cookies')).toBeVisible();
    await expect(page.getByText('Functional Cookies')).toBeVisible();
  });

  test('should display buttons in English', async ({ page }) => {
    const settingsButton = page.getByText('Cookie Settings').locator('..');
    await settingsButton.click();

    await expect(page.getByRole('button', { name: 'Save Settings' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Accept All' })).toBeVisible();
  });
});
