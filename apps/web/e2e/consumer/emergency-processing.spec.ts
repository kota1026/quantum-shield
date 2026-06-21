import { test, expect } from '@playwright/test';

/**
 * Consumer App Emergency Processing E2E Tests
 * Tests for Screen 15: Emergency Unlock Processing
 */

test.describe('Consumer Emergency Processing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/consumer/emergency-processing');
  });

  test.describe('Page Load & Layout', () => {
    test('should display processing page correctly', async ({ page }) => {
      await expect(page).toHaveTitle(/処理中/);
      await expect(page.getByText(/緊急Unlock処理中/)).toBeVisible();
    });

    test('should display processing animation', async ({ page }) => {
      // Check for the processing visual container
      const processingVisual = page.locator('.animate-spin').first();
      await expect(processingVisual).toBeVisible();
    });
  });

  test.describe('Processing Steps', () => {
    test('should display step list', async ({ page }) => {
      const stepList = page.getByRole('list');
      await expect(stepList).toBeVisible();
    });

    test('should show first step as complete', async ({ page }) => {
      await expect(page.getByText('ウォレット署名を検証')).toBeVisible();
    });

    test('should show second step as active initially', async ({ page }) => {
      await expect(page.getByText(/Bond.*を送金中/)).toBeVisible();
    });

    test('should show remaining steps as pending', async ({ page }) => {
      await expect(page.getByText('緊急Unlock要求を登録')).toBeVisible();
      await expect(page.getByText('7日間Time Lock開始')).toBeVisible();
    });
  });

  test.describe('Messages', () => {
    test('should display wait message', async ({ page }) => {
      await expect(page.getByText(/処理には数分かかる|Bond支払いを処理/)).toBeVisible();
    });

    test('should display do not close warning', async ({ page }) => {
      await expect(page.getByText(/ブラウザを閉じないでください/)).toBeVisible();
    });
  });

  test.describe('Auto Navigation', () => {
    test('should navigate to success page after processing', async ({ page }) => {
      // Wait for the auto-navigation (5 seconds)
      await page.waitForURL('**/emergency-success', { timeout: 10000 });
      await expect(page).toHaveURL(/emergency-success/);
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper step list structure', async ({ page }) => {
      const stepList = page.getByRole('list');
      await expect(stepList).toHaveAttribute('aria-label');
    });

    test('step items should be listitem role', async ({ page }) => {
      const stepItems = page.getByRole('listitem');
      await expect(stepItems.first()).toBeVisible();
    });
  });

  test.describe('English Locale', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/en/consumer/emergency-processing');
    });

    test('should display English text', async ({ page }) => {
      await expect(page.getByText('Verifying wallet signature')).toBeVisible();
      await expect(page.getByText(/Sending Bond/)).toBeVisible();
      await expect(page.getByText('Registering Emergency Unlock request')).toBeVisible();
      await expect(page.getByText('Starting 7-day Time Lock')).toBeVisible();
    });
  });
});
