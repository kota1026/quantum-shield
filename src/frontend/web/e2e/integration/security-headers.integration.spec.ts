/**
 * Security Headers Integration Tests (Phase C)
 *
 * Verifies that all OWASP-recommended security headers are present
 * on API responses. These headers protect against:
 * - Clickjacking (X-Frame-Options)
 * - MIME sniffing (X-Content-Type-Options)
 * - Downgrade attacks (Strict-Transport-Security)
 * - XSS/injection (Content-Security-Policy)
 * - Information leakage (Referrer-Policy)
 * - Feature abuse (Permissions-Policy)
 *
 * Prerequisites:
 * - Backend running on localhost:8080
 */
import { test, expect } from '@playwright/test';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

test.describe('Security Headers — Backend API', () => {
  test('health endpoint returns security headers', async ({ request }) => {
    const response = await request.get(`${API_BASE}/v1/health`);
    expect(response.status()).toBe(200);

    const headers = response.headers();

    // HSTS
    expect(headers['strict-transport-security']).toContain('max-age=31536000');
    expect(headers['strict-transport-security']).toContain('includeSubDomains');

    // Anti-clickjacking
    expect(headers['x-frame-options']).toBe('DENY');

    // MIME sniffing prevention
    expect(headers['x-content-type-options']).toBe('nosniff');

    // Referrer policy
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');

    // CSP for API
    expect(headers['content-security-policy']).toContain("default-src 'none'");
    expect(headers['content-security-policy']).toContain("frame-ancestors 'none'");

    // Permissions policy
    expect(headers['permissions-policy']).toContain('camera=()');
    expect(headers['permissions-policy']).toContain('microphone=()');

    // Cache control
    expect(headers['cache-control']).toContain('no-store');

    // Request ID
    expect(headers['x-request-id']).toBeTruthy();

    console.log('[Security Headers] All OWASP headers present on /v1/health');
  });

  test('lock endpoint returns security headers', async ({ request }) => {
    // POST to lock with invalid body to get a 400 — still should have security headers
    const response = await request.post(`${API_BASE}/v1/lock`, {
      data: {},
    });

    const headers = response.headers();
    expect(headers['strict-transport-security']).toContain('max-age=31536000');
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['content-security-policy']).toBeTruthy();

    console.log('[Security Headers] Present on error responses too');
  });

  test('rate limit headers are present', async ({ request }) => {
    const response = await request.get(`${API_BASE}/v1/health`);
    const headers = response.headers();

    // Rate limit headers should always be present
    expect(headers['x-ratelimit-limit']).toBeTruthy();
    expect(headers['x-ratelimit-remaining']).toBeTruthy();

    const limit = parseInt(headers['x-ratelimit-limit']);
    const remaining = parseInt(headers['x-ratelimit-remaining']);
    expect(limit).toBeGreaterThan(0);
    expect(remaining).toBeGreaterThanOrEqual(0);
    expect(remaining).toBeLessThanOrEqual(limit);

    console.log(`[Rate Limit] limit=${limit}, remaining=${remaining}`);
  });

  test('API version header is present', async ({ request }) => {
    const response = await request.get(`${API_BASE}/v1/health`);
    const headers = response.headers();

    expect(headers['x-api-version']).toBeTruthy();
    console.log(`[API Version] ${headers['x-api-version']}`);
  });
});
