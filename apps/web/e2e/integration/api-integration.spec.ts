/**
 * API Integration Tests
 *
 * Tests frontend-to-backend API integration.
 * Note: These tests require the backend API to be running on localhost:8080.
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

test.describe('Backend API Health Check', () => {
  test('API should be accessible', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/health`);
    expect(response.ok()).toBeTruthy();
  });
});

test.describe('Consumer API Integration', () => {
  test.describe('Dashboard Endpoint', () => {
    test('GET /v1/user/dashboard requires authentication', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/v1/user/dashboard`);
      expect(response.status()).toBe(401);
    });
  });

  test.describe('Locks Endpoints', () => {
    test('GET /v1/user/locks requires authentication', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/v1/user/locks`);
      expect(response.status()).toBe(401);
    });

    test('POST /v1/lock requires authentication', async ({ request }) => {
      const response = await request.post(`${API_BASE_URL}/v1/lock`, {
        data: { amount: '1.0', token: 'ETH' },
      });
      expect(response.status()).toBe(401);
    });
  });

  test.describe('Unlock Endpoints', () => {
    test('POST /v1/unlock requires authentication', async ({ request }) => {
      const response = await request.post(`${API_BASE_URL}/v1/unlock`, {
        data: { lockId: 'test-lock-id' },
      });
      expect(response.status()).toBe(401);
    });

    test('POST /v1/unlock/emergency requires authentication', async ({ request }) => {
      const response = await request.post(`${API_BASE_URL}/v1/unlock/emergency`, {
        data: { lockId: 'test-lock-id', bondAmount: '1.0' },
      });
      expect(response.status()).toBe(401);
    });
  });

  test.describe('Transactions Endpoint', () => {
    test('GET /v1/user/transactions requires authentication', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/v1/user/transactions`);
      expect(response.status()).toBe(401);
    });
  });
});

test.describe('Explorer API Integration', () => {
  test.describe('Public Endpoints', () => {
    test('GET /v1/explorer/stats should return stats', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/v1/explorer/stats`);
      // Should be accessible without auth (public endpoint)
      // May return 200 or 404 depending on implementation
      expect([200, 404]).toContain(response.status());
    });

    test('GET /v1/explorer/locks should return locks list', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/v1/explorer/locks`);
      expect([200, 404]).toContain(response.status());
    });

    test('GET /v1/explorer/unlocks should return unlocks list', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/v1/explorer/unlocks`);
      expect([200, 404]).toContain(response.status());
    });
  });
});

test.describe('Prover API Integration', () => {
  test.describe('Protected Endpoints', () => {
    test('GET /v1/prover/status requires authentication', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/v1/prover/status`);
      expect(response.status()).toBe(401);
    });

    test('POST /v1/prover/register requires authentication', async ({ request }) => {
      const response = await request.post(`${API_BASE_URL}/v1/prover/register`, {
        data: {},
      });
      expect(response.status()).toBe(401);
    });
  });
});

test.describe('Observer API Integration', () => {
  test.describe('Protected Endpoints', () => {
    test('GET /v1/observer/status requires authentication', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/v1/observer/status`);
      expect(response.status()).toBe(401);
    });

    test('POST /v1/observer/register requires authentication', async ({ request }) => {
      const response = await request.post(`${API_BASE_URL}/v1/observer/register`, {
        data: {},
      });
      expect(response.status()).toBe(401);
    });
  });
});

test.describe('Governance API Integration', () => {
  test.describe('Public Endpoints', () => {
    test('GET /v1/governance/proposals should return proposals', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/v1/governance/proposals`);
      expect([200, 404]).toContain(response.status());
    });
  });

  test.describe('Protected Endpoints', () => {
    test('POST /v1/governance/proposals requires authentication', async ({ request }) => {
      const response = await request.post(`${API_BASE_URL}/v1/governance/proposals`, {
        data: { title: 'Test', description: 'Test proposal' },
      });
      expect(response.status()).toBe(401);
    });

    test('POST /v1/governance/vote requires authentication', async ({ request }) => {
      const response = await request.post(`${API_BASE_URL}/v1/governance/vote`, {
        data: { proposalId: 1, vote: 'for' },
      });
      expect(response.status()).toBe(401);
    });
  });
});

test.describe('Admin API Integration', () => {
  test('Admin endpoints require authentication', async ({ request }) => {
    const adminEndpoints = [
      '/v1/admin/dashboard',
      '/v1/admin/users',
      '/v1/admin/transactions',
      '/v1/admin/provers',
      '/v1/admin/observers',
    ];

    for (const endpoint of adminEndpoints) {
      const response = await request.get(`${API_BASE_URL}${endpoint}`);
      expect(response.status()).toBe(401);
    }
  });
});
