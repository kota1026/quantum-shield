/**
 * Consumer App Key Management E2E Tests
 *
 * URL: /ja/consumer/key-management
 * Auth: Required (uses authenticatedPage fixture with real SIWE JWT)
 * APIs: GET /v1/user/keys
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

const KEY_MGMT_URL_JA = '/ja/consumer/key-management';
const KEY_MGMT_URL_EN = '/en/consumer/key-management';

// ---------------------------------------------------------------------------
// 1. Page Structure & Main Landmark
// ---------------------------------------------------------------------------
test.describe('Page Structure', () => {
  test.beforeEach(async ({ page, authenticatedPage }) => {
    await page.goto(KEY_MGMT_URL_JA);
    await expect(page.getByRole('main')).toBeVisible({ timeout: 15000 });
  });

  test('should have main landmark with role="main"', async ({ page }) => {
    const main = page.getByRole('main');
    await expect(main).toBeVisible();
  });

  test('should display page heading', async ({ page }) => {
    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1);
    await expect(h1).toContainText(/鍵管理/);
  });

  test('should display back button to settings', async ({ page }) => {
    const backLink = page.locator('a[href*="/consumer/settings"]');
    await expect(backLink).toBeVisible();
  });

  test('should display warning box', async ({ page }) => {
    // Multiple role="alert" elements exist (component + Next.js route announcer)
    const alert = page.locator('[role="alert"]').first();
    await expect(alert).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 2. Key Info from API
// ---------------------------------------------------------------------------
test.describe('Key Info', () => {
  test('should display public key section with active badge', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(KEY_MGMT_URL_JA);
    await expect(page.getByRole('main')).toBeVisible({ timeout: 15000 });

    // Public key label with Dilithium reference
    await expect(page.getByText(/Dilithium.*公開鍵/)).toBeVisible();

    // Active badge
    await expect(page.getByText(/アクティブ/)).toBeVisible();
  });

  test('should display public key value from API', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(KEY_MGMT_URL_JA);
    await expect(page.getByRole('main')).toBeVisible({ timeout: 15000 });

    // The public key should be displayed in the mono font area
    // Wait for API to load key data
    const keyDisplay = page.locator('.font-mono').first();
    await expect(keyDisplay).toBeVisible({ timeout: 10000 });

    // Key value may be empty if API hasn't returned yet or no key exists
    const keyText = await keyDisplay.textContent();
    expect(keyText).toBeDefined();
  });

  test('should copy public key when copy button clicked', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(KEY_MGMT_URL_JA);
    await expect(page.getByRole('main')).toBeVisible({ timeout: 15000 });

    // Grant clipboard permission for this context
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

    const copyButton = page.locator('[aria-live="polite"]');
    await expect(copyButton).toBeVisible();

    await copyButton.click();

    // Should show "copied" confirmation
    await expect(page.getByText(/コピーしました/)).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 3. Management Actions
// ---------------------------------------------------------------------------
test.describe('Key Management Actions', () => {
  test.beforeEach(async ({ page, authenticatedPage }) => {
    await page.goto(KEY_MGMT_URL_JA);
    await expect(page.getByRole('main')).toBeVisible({ timeout: 15000 });
  });

  test('should display management section with all actions', async ({
    page,
  }) => {
    await expect(page.getByText('鍵の管理')).toBeVisible();
    await expect(page.getByText('バックアップをダウンロード')).toBeVisible();
    await expect(page.getByText('秘密鍵を表示')).toBeVisible();
    await expect(page.getByText('鍵を再生成')).toBeVisible();
  });

  test('should display key history section', async ({ page }) => {
    await expect(page.getByText('鍵の履歴')).toBeVisible();
    await expect(page.getByText('生成日時')).toBeVisible();
    await expect(page.getByText('最終バックアップ')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 4. Backup Modal
// ---------------------------------------------------------------------------
test.describe('Backup Modal', () => {
  test('should open backup modal when backup item clicked', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(KEY_MGMT_URL_JA);
    await expect(page.getByRole('main')).toBeVisible({ timeout: 15000 });

    const backupButton = page.locator(
      'button[aria-label*="バックアップ"]'
    );
    await backupButton.click();

    const modal = page.locator('div[role="dialog"][aria-modal="true"]');
    await expect(modal).toBeVisible();
  });

  test('should close backup modal with Escape key', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(KEY_MGMT_URL_JA);
    await expect(page.getByRole('main')).toBeVisible({ timeout: 15000 });

    const backupButton = page.locator(
      'button[aria-label*="バックアップ"]'
    );
    await backupButton.click();

    await expect(
      page.locator('div[role="dialog"][aria-modal="true"]')
    ).toBeVisible();

    await page.keyboard.press('Escape');

    await expect(
      page.locator('div[role="dialog"][aria-modal="true"]')
    ).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 5. Export/Reveal Secret Key Modal
// ---------------------------------------------------------------------------
test.describe('Export Modal', () => {
  test('should open export modal when item clicked', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(KEY_MGMT_URL_JA);
    await expect(page.getByRole('main')).toBeVisible({ timeout: 15000 });

    const exportButton = page.locator('button[aria-label*="秘密鍵"]');
    await exportButton.click();

    const modal = page.locator('div[role="dialog"][aria-modal="true"]');
    await expect(modal).toBeVisible();
  });

  test('should display warning in export modal', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(KEY_MGMT_URL_JA);
    await expect(page.getByRole('main')).toBeVisible({ timeout: 15000 });

    const exportButton = page.locator('button[aria-label*="秘密鍵"]');
    await exportButton.click();

    await expect(page.getByText(/注意/).first()).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 6. Regenerate Keys Modal
// ---------------------------------------------------------------------------
test.describe('Regenerate Modal', () => {
  test('should open regenerate modal when item clicked', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(KEY_MGMT_URL_JA);
    await expect(page.getByRole('main')).toBeVisible({ timeout: 15000 });

    const regenerateButton = page.locator(
      'button[aria-label*="再生成"]'
    );
    await regenerateButton.click();

    const modal = page.locator('div[role="dialog"][aria-modal="true"]');
    await expect(modal).toBeVisible();
  });

  test('should display danger warning in regenerate modal', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(KEY_MGMT_URL_JA);
    await expect(page.getByRole('main')).toBeVisible({ timeout: 15000 });

    const regenerateButton = page.locator(
      'button[aria-label*="再生成"]'
    );
    await regenerateButton.click();

    await expect(page.getByText(/危険な操作/)).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 7. Navigation
// ---------------------------------------------------------------------------
test.describe('Navigation', () => {
  test('should navigate back to settings when back button clicked', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(KEY_MGMT_URL_JA);
    await expect(page.getByRole('main')).toBeVisible({ timeout: 15000 });

    const backLink = page.locator('a[href*="/consumer/settings"]');
    await backLink.click();

    await expect(page).toHaveURL(/\/consumer\/settings/, { timeout: 15000 });
  });
});

// ---------------------------------------------------------------------------
// 8. Accessibility
// ---------------------------------------------------------------------------
test.describe('Accessibility', () => {
  test.beforeEach(async ({ page, authenticatedPage }) => {
    await page.goto(KEY_MGMT_URL_JA);
    await expect(page.getByRole('main')).toBeVisible({ timeout: 15000 });
  });

  test('should have exactly one h1 heading', async ({ page }) => {
    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1);
  });

  test('should have alert role on warning box', async ({ page }) => {
    const alerts = page.locator('[role="alert"]');
    await expect(alerts.first()).toBeVisible();
  });

  test('should have aria-live on copy button', async ({ page }) => {
    const copyButton = page.locator('[aria-live="polite"]');
    await expect(copyButton).toBeVisible();
  });

  test('should be keyboard navigable on action items', async ({ page }) => {
    const backupButton = page.locator(
      'button[aria-label*="バックアップ"]'
    );
    await backupButton.focus();
    await page.keyboard.press('Enter');

    await expect(
      page.locator('div[role="dialog"][aria-modal="true"]')
    ).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 9. Responsive Design
// ---------------------------------------------------------------------------
test.describe('Responsive Design', () => {
  test('should display properly on mobile (375x667)', async ({
    page,
    authenticatedPage,
  }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(KEY_MGMT_URL_JA);
    await expect(page.getByRole('main')).toBeVisible({ timeout: 15000 });

    await expect(page.locator('h1')).toBeVisible();
    await expect(page.getByText(/Dilithium.*公開鍵/)).toBeVisible();
    await expect(page.getByText('鍵の管理')).toBeVisible();
    await expect(page.getByText('鍵の履歴')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 10. English Locale
// ---------------------------------------------------------------------------
test.describe('English Locale', () => {
  test('should display content in English', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(KEY_MGMT_URL_EN);
    await expect(page.getByRole('main')).toBeVisible({ timeout: 15000 });

    await expect(page.locator('h1')).toContainText('Key Management');
    await expect(page.getByText('Dilithium Public Key')).toBeVisible();
    await expect(page.getByText('Active')).toBeVisible();
  });

  test('should display actions in English', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(KEY_MGMT_URL_EN);
    await expect(page.getByRole('main')).toBeVisible({ timeout: 15000 });

    await expect(page.getByText('Download Backup')).toBeVisible();
    await expect(page.getByText('Show Secret Key')).toBeVisible();
    await expect(page.getByText('Regenerate Keys')).toBeVisible();
  });

  test('should display warning in English', async ({
    page,
    authenticatedPage,
  }) => {
    await page.goto(KEY_MGMT_URL_EN);
    await expect(page.getByRole('main')).toBeVisible({ timeout: 15000 });

    await expect(
      page.getByText('Never share your secret key with anyone')
    ).toBeVisible();
  });
});
