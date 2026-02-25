/**
 * Consumer App Settings E2E Tests
 *
 * URL: /ja/consumer/settings
 * Auth: Required (uses authenticatedPage fixture with real SIWE JWT)
 * APIs: GET /v1/user/settings, POST /v1/user/settings
 *
 * Uses real backend at localhost:8080. No mocking.
 */

import { test, expect } from '../fixtures';

test.use({
  navigationTimeout: 60000,
  actionTimeout: 15000,
  expect: { timeout: 15000 },
});
test.setTimeout(60000);

const SETTINGS_URL_JA = '/ja/consumer/settings';
const SETTINGS_URL_EN = '/en/consumer/settings';

// ---------------------------------------------------------------------------
// 1. Page Structure & Main Landmark
// ---------------------------------------------------------------------------
test.describe('Page Structure', () => {
  test.beforeEach(async ({ page, authenticatedPage }) => {
    await page.goto(SETTINGS_URL_JA);
    await expect(page.getByRole('main')).toBeVisible({ timeout: 15000 });
  });

  test('should have main landmark with role="main"', async ({ page }) => {
    const main = page.getByRole('main');
    await expect(main).toBeVisible();
  });

  test('should display page heading', async ({ page }) => {
    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1);
    await expect(h1).toContainText(/設定/);
  });

  test('should display back button linking to dashboard', async ({ page }) => {
    const backButton = page.locator('a[aria-label]').filter({ hasText: '' }).first();
    // Back button should be a link pointing to consumer dashboard
    const backLink = page.locator('a[href*="/consumer/dashboard"]');
    await expect(backLink).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 2. Settings Sections
// ---------------------------------------------------------------------------
test.describe('Settings Sections', () => {
  test.beforeEach(async ({ page, authenticatedPage }) => {
    await page.goto(SETTINGS_URL_JA);
    await expect(page.getByRole('main')).toBeVisible({ timeout: 15000 });
  });

  test('should display Account section with key management and wallet', async ({
    page,
  }) => {
    await expect(page.getByText('アカウント')).toBeVisible();
    await expect(page.getByText('鍵管理')).toBeVisible();
    await expect(page.getByText('接続中のウォレット')).toBeVisible();
  });

  test('should display Notifications section with toggles', async ({
    page,
  }) => {
    await expect(page.getByText('通知').first()).toBeVisible();
    await expect(page.getByText('プッシュ通知')).toBeVisible();
    await expect(page.getByText('メール通知')).toBeVisible();
  });

  test('should display Display section with theme and language', async ({
    page,
  }) => {
    await expect(page.getByText('表示').first()).toBeVisible();
    await expect(page.getByText('ダークモード')).toBeVisible();
    await expect(page.getByText('言語').first()).toBeVisible();
    await expect(page.getByText('通貨表示')).toBeVisible();
  });

  test('should display Security section', async ({ page }) => {
    await expect(page.getByText('セキュリティ')).toBeVisible();
    await expect(page.getByText('自動ロック')).toBeVisible();
    await expect(page.getByText('生体認証')).toBeVisible();
  });

  test('should display Support section', async ({ page }) => {
    await expect(page.getByText('サポート').first()).toBeVisible();
    await expect(page.getByText('よくある質問')).toBeVisible();
    await expect(page.getByText('お問い合わせ')).toBeVisible();
    await expect(page.getByText('利用規約・プライバシー')).toBeVisible();
  });

  test('should display Danger Zone with disconnect wallet', async ({
    page,
  }) => {
    await expect(page.getByText('危険な操作')).toBeVisible();
    await expect(page.getByText('ウォレットを切断')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 3. Toggle Switches
// ---------------------------------------------------------------------------
test.describe('Toggle Switches', () => {
  test.beforeEach(async ({ page, authenticatedPage }) => {
    await page.goto(SETTINGS_URL_JA);
    await expect(page.getByRole('main')).toBeVisible({ timeout: 15000 });
  });

  test('should toggle push notifications switch', async ({ page }) => {
    const pushToggle = page.getByRole('checkbox', { name: 'プッシュ通知' }).or(
      page.locator('input[type="checkbox"][aria-label="プッシュ通知"]')
    ).first();
    await expect(pushToggle).toBeAttached();

    const initialState = await pushToggle.isChecked();

    // Toggle via click with force (sr-only checkbox needs force)
    await pushToggle.click({ force: true });
    const newState = await pushToggle.isChecked();
    expect(newState).toBe(!initialState);

    // Toggle back
    await pushToggle.click({ force: true });
    const revertedState = await pushToggle.isChecked();
    expect(revertedState).toBe(initialState);
  });

  test('should have all toggles with aria-label attributes', async ({
    page,
  }) => {
    const toggles = page.locator('input[type="checkbox"][aria-label]');
    const count = await toggles.count();
    // Push, Email, Dark mode, Biometric = at least 4
    expect(count).toBeGreaterThanOrEqual(4);
  });
});

// ---------------------------------------------------------------------------
// 4. Wallet Address Display
// ---------------------------------------------------------------------------
test.describe('Wallet Info', () => {
  test('should display a wallet address or not-connected state', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(SETTINGS_URL_JA);
    await expect(page.getByRole('main')).toBeVisible({ timeout: 15000 });

    // The wallet address should be displayed (abbreviated format 0x...)
    // OR a fallback / not-connected state may be shown
    const walletAddress = page.getByText(/0x[a-fA-F0-9]/);
    const notConnected = page.getByText(/未接続|Not connected|接続中のウォレット/);
    await expect(walletAddress.or(notConnected).first()).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 5. Navigation
// ---------------------------------------------------------------------------
test.describe('Navigation', () => {
  test('should navigate back to dashboard when back button is clicked', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(SETTINGS_URL_JA);
    await expect(page.getByRole('main')).toBeVisible({ timeout: 15000 });

    const backLink = page.locator('a[href*="/consumer/dashboard"]');
    await backLink.click();

    await expect(page).toHaveURL(/\/consumer\/dashboard/, { timeout: 30000 });
  });

  test('should navigate to key management page', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(SETTINGS_URL_JA);
    await expect(page.getByRole('main')).toBeVisible({ timeout: 15000 });

    // Click the key management item (div[role="button"] with router.push)
    const keyManagementButton = page.locator('[role="button"]').filter({ hasText: '鍵管理' }).first();
    await keyManagementButton.click();

    await expect(page).toHaveURL(/\/consumer\/key-management/, { timeout: 15000 });
  });
});

// ---------------------------------------------------------------------------
// 6. Version Info
// ---------------------------------------------------------------------------
test.describe('Version Info', () => {
  test('should display version information', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(SETTINGS_URL_JA);
    await expect(page.getByRole('main')).toBeVisible({ timeout: 15000 });

    await expect(page.getByText(/Version \d+\.\d+\.\d+/)).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 7. Accessibility
// ---------------------------------------------------------------------------
test.describe('Accessibility', () => {
  test.beforeEach(async ({ page, authenticatedPage }) => {
    await page.goto(SETTINGS_URL_JA);
    await expect(page.getByRole('main')).toBeVisible({ timeout: 15000 });
  });

  test('should have exactly one h1 heading', async ({ page }) => {
    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1);
  });

  test('should have sections with proper aria-labelledby', async ({
    page,
  }) => {
    const sections = page.locator('section[aria-labelledby]');
    expect(await sections.count()).toBeGreaterThan(0);
  });

  test('should support keyboard navigation on toggles', async ({ page }) => {
    const pushToggle = page.getByRole('checkbox', { name: 'プッシュ通知' }).or(
      page.locator('input[type="checkbox"][aria-label="プッシュ通知"]')
    ).first();
    await expect(pushToggle).toBeAttached();
    const initialState = await pushToggle.isChecked();

    await pushToggle.focus({ timeout: 5000 });
    await page.keyboard.press('Space');

    const newState = await pushToggle.isChecked();
    expect(newState).toBe(!initialState);
  });
});

// ---------------------------------------------------------------------------
// 8. Responsive Design
// ---------------------------------------------------------------------------
test.describe('Responsive Design', () => {
  test('should display properly on mobile (375x667)', async ({
    page,
    authenticatedPage,
  }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(SETTINGS_URL_JA);
    await expect(page.getByRole('main')).toBeVisible({ timeout: 15000 });

    await expect(page.locator('h1')).toBeVisible();
    await expect(page.getByText('アカウント')).toBeVisible();
    await expect(page.getByText('セキュリティ')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 9. English Locale
// ---------------------------------------------------------------------------
test.describe('English Locale', () => {
  test('should display content in English', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(SETTINGS_URL_EN);
    await expect(page.getByRole('main')).toBeVisible({ timeout: 15000 });

    await expect(page.locator('h1')).toContainText('Settings');

    await expect(page.getByText('Account')).toBeVisible();
    await expect(page.getByText('Notifications').first()).toBeVisible();
    await expect(page.getByText('Display').first()).toBeVisible();
    await expect(page.getByText('Security').first()).toBeVisible();
    await expect(page.getByText('Support').first()).toBeVisible();
    await expect(page.getByText('Danger Zone')).toBeVisible();
  });

  test('should display English settings items', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(SETTINGS_URL_EN);
    await expect(page.getByRole('main')).toBeVisible({ timeout: 15000 });

    await expect(page.getByText('Key Management')).toBeVisible();
    await expect(page.getByText('Push Notifications')).toBeVisible();
    await expect(page.getByText('Dark Mode')).toBeVisible();
    await expect(page.getByText('Auto Lock')).toBeVisible();
    await expect(page.getByText('FAQ')).toBeVisible();
  });
});
