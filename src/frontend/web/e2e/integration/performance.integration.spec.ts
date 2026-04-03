/**
 * API Performance Integration Tests (Phase E)
 *
 * Verifies that critical API endpoints respond within acceptable latency.
 * These are smoke-level performance checks — for full load testing use k6.
 *
 * Latency targets (single request, no load):
 *   GET /v1/health:           < 50ms
 *   GET /v1/explorer/overview: < 200ms
 *   GET /v1/metrics:          < 200ms
 *   POST /v1/lock:            < 500ms
 *   GET /v1/explorer/locks:   < 200ms
 *
 * Prerequisites:
 * - Backend running on localhost:8080
 */
import { test, expect } from '@playwright/test';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

function hexBytes(n: number): string {
  return (
    '0x' +
    Array.from({ length: n }, () =>
      Math.floor(Math.random() * 256)
        .toString(16)
        .padStart(2, '0')
    ).join('')
  );
}

test.describe('API Performance — Latency Targets', () => {
  test('GET /v1/health responds within 50ms', async ({ request }) => {
    const start = Date.now();
    const response = await request.get(`${API_BASE}/v1/health`);
    const elapsed = Date.now() - start;

    expect(response.status()).toBe(200);
    expect(elapsed).toBeLessThan(50);
    console.log(`[Perf] GET /v1/health: ${elapsed}ms`);
  });

  test('GET /v1/health/ready responds within 200ms', async ({ request }) => {
    const start = Date.now();
    const response = await request.get(`${API_BASE}/v1/health/ready`);
    const elapsed = Date.now() - start;

    expect(response.status()).toBe(200);
    expect(elapsed).toBeLessThan(200);
    console.log(`[Perf] GET /v1/health/ready: ${elapsed}ms`);
  });

  test('GET /v1/explorer/overview responds within 200ms', async ({
    request,
  }) => {
    const start = Date.now();
    const response = await request.get(`${API_BASE}/v1/explorer/overview`);
    const elapsed = Date.now() - start;

    expect(response.status()).toBe(200);
    expect(elapsed).toBeLessThan(200);
    console.log(`[Perf] GET /v1/explorer/overview: ${elapsed}ms`);
  });

  test('GET /v1/metrics responds within 200ms', async ({ request }) => {
    const start = Date.now();
    const response = await request.get(`${API_BASE}/v1/metrics`);
    const elapsed = Date.now() - start;

    expect(response.status()).toBe(200);
    expect(elapsed).toBeLessThan(200);
    console.log(`[Perf] GET /v1/metrics: ${elapsed}ms`);
  });

  test('POST /v1/lock responds within 500ms', async ({ request }) => {
    const start = Date.now();
    const response = await request.post(`${API_BASE}/v1/lock`, {
      data: {
        chain_id: 11155111,
        asset: 'ETH',
        amount: '100000000000000000',
        dest_addr: hexBytes(20),
        pk_dilithium: hexBytes(32),
        sig_dilithium: hexBytes(64),
        expiry: Math.floor(Date.now() / 1000) + 86400 * 7,
        nonce: Date.now() + Math.floor(Math.random() * 100000),
      },
    });
    const elapsed = Date.now() - start;

    expect(response.status()).toBe(200);
    expect(elapsed).toBeLessThan(500);
    console.log(`[Perf] POST /v1/lock: ${elapsed}ms`);
  });

  test('GET /v1/explorer/locks responds within 200ms', async ({ request }) => {
    const start = Date.now();
    const response = await request.get(`${API_BASE}/v1/explorer/locks`);
    const elapsed = Date.now() - start;

    expect(response.status()).toBe(200);
    expect(elapsed).toBeLessThan(200);
    console.log(`[Perf] GET /v1/explorer/locks: ${elapsed}ms`);
  });

  test('GET /v1/token-hub/delegates responds within 200ms', async ({
    request,
  }) => {
    const start = Date.now();
    const response = await request.get(
      `${API_BASE}/v1/token-hub/delegates?page=1&limit=10`
    );
    const elapsed = Date.now() - start;

    expect(response.status()).toBe(200);
    expect(elapsed).toBeLessThan(200);
    console.log(`[Perf] GET /v1/token-hub/delegates: ${elapsed}ms`);
  });

  test('GET /v1/governance/proposals responds within 200ms', async ({
    request,
  }) => {
    const start = Date.now();
    const response = await request.get(`${API_BASE}/v1/governance/proposals`);
    const elapsed = Date.now() - start;

    expect(response.status()).toBe(200);
    expect(elapsed).toBeLessThan(200);
    console.log(`[Perf] GET /v1/governance/proposals: ${elapsed}ms`);
  });
});

test.describe('API Performance — Concurrent Requests', () => {
  test('10 concurrent health checks complete within 200ms total', async ({
    request,
  }) => {
    const start = Date.now();
    const promises = Array.from({ length: 10 }, () =>
      request.get(`${API_BASE}/v1/health`)
    );
    const responses = await Promise.all(promises);
    const elapsed = Date.now() - start;

    for (const res of responses) {
      expect(res.status()).toBe(200);
    }
    expect(elapsed).toBeLessThan(200);
    console.log(`[Perf] 10x concurrent GET /v1/health: ${elapsed}ms total`);
  });

  test('5 concurrent lock requests complete within 1000ms total', async ({
    request,
  }) => {
    const start = Date.now();
    const promises = Array.from({ length: 5 }, (_, i) =>
      request.post(`${API_BASE}/v1/lock`, {
        data: {
          chain_id: 11155111,
          asset: 'ETH',
          amount: '100000000000000000',
          dest_addr: hexBytes(20),
          pk_dilithium: hexBytes(32),
          sig_dilithium: hexBytes(64),
          expiry: Math.floor(Date.now() / 1000) + 86400 * 7,
          nonce: Date.now() + i * 1000 + Math.floor(Math.random() * 100),
        },
      })
    );
    const responses = await Promise.all(promises);
    const elapsed = Date.now() - start;

    for (const res of responses) {
      expect(res.status()).toBe(200);
    }
    expect(elapsed).toBeLessThan(1000);
    console.log(`[Perf] 5x concurrent POST /v1/lock: ${elapsed}ms total`);
  });
});
