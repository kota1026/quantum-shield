/**
 * Enterprise Billing Page E2E Tests
 *
 * Tests page structure, plan display, usage section, charges table, accessibility.
 * Uses structural assertions rather than hardcoded mock data values.
 *
 * NOTE: Route /enterprise/billing does not exist yet (page not created).
 * These tests are skipped until the billing page route is implemented.
 *
 * Requires: Frontend on :3000, route /enterprise/billing
 */

import { test, expect } from '@playwright/test';

// Skip: /enterprise/billing route not yet implemented
// Remove this line once src/app/[locale]/enterprise/billing/page.tsx exists
test.describe.skip('Enterprise Billing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/enterprise/billing');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Page Structure', () => {
    test('should display the page title', async ({ page }) => {
      const h1 = page.getByRole('heading', { level: 1 });
      await expect(h1).toBeVisible();
      const text = await h1.textContent();
      expect(text?.trim().length).toBeGreaterThan(0);
    });

    test('should display main content area', async ({ page }) => {
      await expect(page.getByRole('main')).toBeVisible();
    });

    test('should display view invoices button', async ({ page }) => {
      await expect(page.getByRole('link', { name: /請求書|Invoice/ })).toBeVisible();
    });
  });

  test.describe('Current Plan Section', () => {
    test('should display current plan heading', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /現在のプラン|Current Plan/ })).toBeVisible();
    });

    test('should display plan name', async ({ page }) => {
      // Plan name should be visible (e.g. "Enterprise", "Professional")
      await expect(page.getByText(/Enterprise|Professional|Plan/)).toBeVisible();
    });

    test('should display monthly fee (formatted currency)', async ({ page }) => {
      // Fee should be a formatted dollar amount
      const planSection = page.locator('section, [class*="plan"], [class*="card"]').filter({
        hasText: /現在のプラン|Current Plan/,
      });
      const sectionText = await planSection.first().textContent();
      // Should contain a dollar amount
      expect(sectionText).toMatch(/\$/);
    });

    test('should display payment method section', async ({ page }) => {
      // Payment method should show masked card number (e.g. **** 4242)
      await expect(page.getByText(/\*{4}/)).toBeVisible();
    });

    test('should display update payment button', async ({ page }) => {
      await expect(page.getByRole('button', { name: /支払い方法|Payment/ })).toBeVisible();
    });
  });

  test.describe('Usage Section', () => {
    test('should display usage heading', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /使用状況|Usage/ })).toBeVisible();
    });

    test('should display API calls usage', async ({ page }) => {
      await expect(page.getByText(/API\s*コール|API\s*Calls/)).toBeVisible();
    });

    test('should display transactions usage', async ({ page }) => {
      await expect(page.getByText(/トランザクション数|Transactions/)).toBeVisible();
    });

    test('should display storage usage', async ({ page }) => {
      await expect(page.getByText(/ストレージ|Storage/)).toBeVisible();
    });
  });

  test.describe('Recent Charges Section', () => {
    test('should display recent charges heading', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /最近の請求|Recent Charges/ })).toBeVisible();
    });

    test('should display charges table headers', async ({ page }) => {
      await expect(page.getByRole('columnheader', { name: /日付|Date/ })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: /内容|Description/ })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: /金額|Amount/ })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: /ステータス|Status/ })).toBeVisible();
    });

    test('should display at least one charge entry', async ({ page }) => {
      const rows = page.locator('table tbody tr');
      expect(await rows.count()).toBeGreaterThanOrEqual(1);
    });

    test('should display download receipt links', async ({ page }) => {
      const downloadLinks = page.getByRole('button', { name: /領収書|Receipt/ });
      expect(await downloadLinks.count()).toBeGreaterThanOrEqual(1);
    });
  });

  test.describe('Navigation', () => {
    test('should navigate to invoices page', async ({ page }) => {
      await page.getByRole('link', { name: /請求書|Invoice/ }).click();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/\/enterprise\/invoices/);
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      const h1 = await page.locator('h1').count();
      expect(h1).toBe(1);

      const h2s = page.locator('h2');
      expect(await h2s.count()).toBeGreaterThanOrEqual(3);
    });

    test('should have accessible navigation', async ({ page }) => {
      await expect(page.getByRole('navigation').first()).toBeVisible();
      await expect(page.getByRole('main')).toBeVisible();
    });
  });
});

test.describe.skip('Enterprise Billing - English', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/enterprise/billing');
    await page.waitForLoadState('networkidle');
  });

  test('should display English content', async ({ page }) => {
    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toBeVisible();
    await expect(page).toHaveURL(/\/en\//);
  });

  test('should display English section titles', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Current Plan/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Usage/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Recent Charges/ })).toBeVisible();
  });

  test('should display English usage labels', async ({ page }) => {
    await expect(page.getByText('API Calls')).toBeVisible();
    await expect(page.getByText(/Transactions/)).toBeVisible();
    await expect(page.getByText(/Storage/)).toBeVisible();
  });
});
