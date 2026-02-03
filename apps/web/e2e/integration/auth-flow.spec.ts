/**
 * Authentication Flow Integration Tests
 *
 * Tests the SIWE → JWT authentication flow end-to-end.
 * Note: These tests require the backend API to be running.
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

test.describe('Authentication API Integration', () => {
  test.describe('SIWE Authentication Endpoint', () => {
    test('should reject invalid SIWE request', async ({ request }) => {
      const response = await request.post(`${API_BASE_URL}/v1/auth/siwe`, {
        data: {
          message: 'invalid message',
          signature: '0x' + '00'.repeat(64),
          public_key: '0x' + '00'.repeat(32),
        },
      });

      // Should return 400 Bad Request for invalid SIWE message
      expect(response.status()).toBe(400);
    });

    test('should return proper error format for invalid request', async ({ request }) => {
      const response = await request.post(`${API_BASE_URL}/v1/auth/siwe`, {
        data: {
          message: '',
          signature: '',
          public_key: '',
        },
      });

      const body = await response.json();
      expect(body).toHaveProperty('error');
    });
  });

  test.describe('Token Refresh Endpoint', () => {
    test('should reject invalid refresh token', async ({ request }) => {
      const response = await request.post(`${API_BASE_URL}/v1/auth/refresh`, {
        data: {
          refresh_token: 'invalid_token',
        },
      });

      // Should return 401 Unauthorized for invalid token
      expect(response.status()).toBe(401);
    });
  });

  test.describe('Current User Endpoint', () => {
    test('should reject unauthenticated request', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/v1/auth/me`);

      // Should return 401 Unauthorized without auth header
      expect(response.status()).toBe(401);
    });

    test('should reject invalid bearer token', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/v1/auth/me`, {
        headers: {
          Authorization: 'Bearer invalid_token',
        },
      });

      // Should return 401 Unauthorized with invalid token
      expect(response.status()).toBe(401);
    });
  });
});

test.describe('Consumer App Login Flow', () => {
  test('should display login page correctly', async ({ page }) => {
    await page.goto('/ja/consumer/login');

    // Should show login title
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // Should have connect wallet button
    await expect(page.getByRole('button', { name: /ウォレット|wallet/i })).toBeVisible();
  });

  test('should have link to create account', async ({ page }) => {
    await page.goto('/ja/consumer/login');

    // Should have link to onboarding
    const createAccountLink = page.getByRole('link', { name: /アカウント作成|create account/i });
    await expect(createAccountLink).toBeVisible();
    await expect(createAccountLink).toHaveAttribute('href', /onboarding/);
  });

  test('should have back to home link', async ({ page }) => {
    await page.goto('/ja/consumer/login');

    // Should have back link
    const backLink = page.locator('a').filter({ hasText: /戻る|back/i });
    await expect(backLink.first()).toBeVisible();
  });
});

test.describe('Protected Routes', () => {
  test('consumer dashboard should require authentication', async ({ page }) => {
    // Clear any stored auth state
    await page.context().clearCookies();
    await page.evaluate(() => {
      sessionStorage.clear();
      localStorage.clear();
    });

    await page.goto('/ja/consumer/dashboard');

    // Should either redirect to login or show connect wallet prompt
    // The exact behavior depends on implementation
    await page.waitForLoadState('networkidle');

    const url = page.url();
    const hasLoginRedirect = url.includes('login');
    const hasConnectPrompt = await page.getByRole('button', { name: /ウォレット|wallet|connect/i }).isVisible().catch(() => false);

    expect(hasLoginRedirect || hasConnectPrompt).toBeTruthy();
  });
});
