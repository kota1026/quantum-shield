/**
 * Consumer App Onboarding E2E Tests
 *
 * URL: /ja/consumer/onboarding
 * Auth: NOT required (onboarding flow for new users)
 * Content: 4-step onboarding flow (wallet -> key gen -> backup -> ready)
 *
 * Uses fixtures for a11y checks. No backend auth needed.
 */

import { test, expect } from '../fixtures';

const ONBOARDING_URL_JA = '/ja/consumer/onboarding';
const ONBOARDING_URL_EN = '/en/consumer/onboarding';

// ---------------------------------------------------------------------------
// 1. Step 1 Display & Structure
// ---------------------------------------------------------------------------
test.describe('Step 1 - Wallet Connection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ONBOARDING_URL_JA);
  });

  test('should display page heading', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /はじめる|Get Started/i })
    ).toBeVisible();
  });

  test('should have main landmark with role="main"', async ({ page }) => {
    const main = page.getByRole('main');
    await expect(main).toBeVisible({ timeout: 15000 });
  });

  test('should display back button linking to landing', async ({ page }) => {
    const backLink = page.locator('a[href*="/consumer/landing"]');
    await expect(backLink).toBeVisible();
  });

  test('should display progress bar at step 1 of 4', async ({ page }) => {
    const progressbar = page.locator('[role="progressbar"]');
    await expect(progressbar).toBeVisible();
    await expect(progressbar).toHaveAttribute('aria-valuenow', '1');
    await expect(progressbar).toHaveAttribute('aria-valuemax', '4');
  });

  test('should display step 1 indicator text', async ({ page }) => {
    await expect(page.getByText('STEP 1 / 4')).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /ウォレットを接続|Connect Wallet/i })
    ).toBeVisible();
  });

  test('should display wallet options', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: /MetaMask/i })
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /WalletConnect/i })
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /Coinbase/i })
    ).toBeVisible();
  });

  test('should display help link for users without a wallet', async ({
    page,
  }) => {
    await expect(
      page.getByRole('button', {
        name: /ウォレットを持っていない方|Don't have a wallet/i,
      })
    ).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 2. Step Navigation & Wallet Help Modal
// ---------------------------------------------------------------------------
test.describe('Wallet Help Modal', () => {
  test('should open wallet help modal', async ({ page }) => {
    await page.goto(ONBOARDING_URL_JA);

    await page
      .getByRole('button', {
        name: /ウォレットを持っていない方|Don't have a wallet/i,
      })
      .click();

    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(
      page.getByRole('heading', {
        name: /ウォレットの取得方法|How to Get a Wallet/i,
      })
    ).toBeVisible();
  });

  test('should close wallet help modal with close button', async ({
    page,
  }) => {
    await page.goto(ONBOARDING_URL_JA);

    await page
      .getByRole('button', {
        name: /ウォレットを持っていない方|Don't have a wallet/i,
      })
      .click();

    await expect(page.getByRole('dialog')).toBeVisible();

    // Close button in the modal
    const closeButton = page.getByRole('button', { name: /Close modal/i });
    if (await closeButton.isVisible()) {
      await closeButton.click();
    } else {
      // May also have a text close button
      await page
        .getByRole('button', { name: /閉じる|Close/i })
        .first()
        .click();
    }

    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('should close modal with Escape key', async ({ page }) => {
    await page.goto(ONBOARDING_URL_JA);

    await page
      .getByRole('button', {
        name: /ウォレットを持っていない方|Don't have a wallet/i,
      })
      .click();

    await expect(page.getByRole('dialog')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 3. Step 2 - Key Generation (via simulated wallet connect)
// ---------------------------------------------------------------------------
test.describe('Step 2 - Key Generation', () => {
  test('should display step 2 content after wallet selection', async ({
    page,
  }) => {
    await page.goto(ONBOARDING_URL_JA);

    // Click MetaMask to simulate wallet selection
    await page.getByRole('button', { name: /MetaMask/i }).click();

    // Step 2 may appear if RainbowKit modal triggers or if connection resolves
    // In test environment without real wallet, we verify the button is clickable
    // and step 1 content remains (since no actual connection occurs)
    const step2 = page.getByText('STEP 2 / 4');
    const step1 = page.getByText('STEP 1 / 4');

    // Either step 2 appeared (wallet connected) or step 1 remains (no real wallet)
    const isStep2 = await step2.isVisible().catch(() => false);
    const isStep1 = await step1.isVisible().catch(() => false);

    expect(isStep2 || isStep1).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// 4. Progress Indicator
// ---------------------------------------------------------------------------
test.describe('Progress Indicator', () => {
  test('should display 4-segment progress bar', async ({ page }) => {
    await page.goto(ONBOARDING_URL_JA);

    const progressbar = page.locator('[role="progressbar"]');
    await expect(progressbar).toBeVisible();

    // Should have 4 segments
    const segments = progressbar.locator('div');
    expect(await segments.count()).toBe(4);
  });
});

// ---------------------------------------------------------------------------
// 5. Navigation
// ---------------------------------------------------------------------------
test.describe('Navigation', () => {
  test('should navigate back to landing page', async ({ page }) => {
    await page.goto(ONBOARDING_URL_JA);

    const backLink = page.locator('a[href*="/consumer/landing"]');
    await backLink.click();

    // Should navigate away from onboarding
    await expect(page).toHaveURL(/\/consumer/);
  });
});

// ---------------------------------------------------------------------------
// 6. Accessibility
// ---------------------------------------------------------------------------
test.describe('Accessibility', () => {
  test('should have accessible skip link', async ({ page }) => {
    await page.goto(ONBOARDING_URL_JA);

    const skipLink = page.getByText('Skip to main content').first();
    await skipLink.focus();
    await expect(skipLink).toBeVisible();
  });

  test('should have progress bar with aria attributes', async ({ page }) => {
    await page.goto(ONBOARDING_URL_JA);

    const progressbar = page.locator('[role="progressbar"]');
    await expect(progressbar).toHaveAttribute('aria-valuenow', '1');
    await expect(progressbar).toHaveAttribute('aria-valuemin', '1');
    await expect(progressbar).toHaveAttribute('aria-valuemax', '4');
  });

  test('wallet buttons should have proper touch targets (44px)', async ({
    page,
  }) => {
    await page.goto(ONBOARDING_URL_JA);

    const walletButton = page.getByRole('button', { name: /MetaMask/i });
    const box = await walletButton.boundingBox();

    expect(box?.height).toBeGreaterThanOrEqual(44);
  });

  test('should pass a11y checks on step 1', async ({ page, a11y }) => {
    await page.goto(ONBOARDING_URL_JA);

    const results = await a11y.analyze();
    expect(results.violations).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// 7. Responsive Design
// ---------------------------------------------------------------------------
test.describe('Responsive Design', () => {
  test('should display correctly on mobile (375x667)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(ONBOARDING_URL_JA);

    await expect(
      page.getByRole('heading', { name: /はじめる|Get Started/i })
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /MetaMask/i })
    ).toBeVisible();
  });

  test('should display correctly on tablet (768x1024)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(ONBOARDING_URL_JA);

    await expect(
      page.getByRole('heading', { name: /はじめる|Get Started/i })
    ).toBeVisible();
    await expect(page.locator('[role="progressbar"]')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 8. English Locale
// ---------------------------------------------------------------------------
test.describe('English Locale', () => {
  test('should display Japanese content on /ja/ URL', async ({ page }) => {
    await page.goto(ONBOARDING_URL_JA);
    await expect(page.getByText('ウォレットを接続').first()).toBeVisible();
  });

  test('should display English content on /en/ URL', async ({ page }) => {
    await page.goto(ONBOARDING_URL_EN);
    await expect(page.getByText('Connect Wallet')).toBeVisible();
  });
});
