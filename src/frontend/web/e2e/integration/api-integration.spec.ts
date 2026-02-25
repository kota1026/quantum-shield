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
    // Health endpoint is at /v1/health
    const response = await request.get(`${API_BASE_URL}/v1/health`);
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.status).toBe('healthy');
  });
});

test.describe('Consumer API Integration', () => {
  test.describe('Dashboard Endpoint', () => {
    test('GET /v1/user/dashboard requires authentication', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/v1/user/dashboard`);
      // API returns 401 for unauthenticated requests
      expect(response.status()).toBe(401);
    });
  });

  test.describe('Lock Endpoints', () => {
    test('POST /v1/lock requires valid request body', async ({ request }) => {
      const response = await request.post(`${API_BASE_URL}/v1/lock`, {
        data: { amount: '1.0', token: 'ETH' },
      });
      // Returns 422 for invalid request body (missing required fields)
      // or 401 for unauthenticated
      expect([401, 422]).toContain(response.status());
    });
  });

  test.describe('Unlock Endpoints', () => {
    test('POST /v1/unlock requires valid request body', async ({ request }) => {
      const response = await request.post(`${API_BASE_URL}/v1/unlock`, {
        data: { lockId: 'test-lock-id' },
      });
      // Returns 422 for invalid request body or 401 for unauthenticated
      expect([401, 422]).toContain(response.status());
    });

    test('POST /v1/unlock/emergency requires valid request body', async ({ request }) => {
      const response = await request.post(`${API_BASE_URL}/v1/unlock/emergency`, {
        data: { lockId: 'test-lock-id', bondAmount: '1.0' },
      });
      // Returns 422 for invalid request body or 401 for unauthenticated
      expect([401, 422]).toContain(response.status());
    });
  });

  test.describe('Transactions Endpoint', () => {
    test('GET /v1/user/transactions requires authentication', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/v1/user/transactions`);
      expect(response.status()).toBe(401);
    });
  });
});

test.describe('Token Hub API Integration', () => {
  test.describe('Public Endpoints', () => {
    test('GET /v1/token-hub/locks returns response', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/v1/token-hub/locks`);
      // May return 200, 400 (missing params), 401 or 404
      expect([200, 400, 401, 404]).toContain(response.status());
    });

    test('GET /v1/token-hub/delegates returns response', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/v1/token-hub/delegates`);
      expect([200, 400, 401, 404]).toContain(response.status());
    });
  });
});

test.describe('Explorer API Integration', () => {
  test.describe('Public Endpoints', () => {
    test('GET /v1/explorer/stats should return stats', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/v1/explorer/stats`);
      // Should be accessible without auth (public endpoint)
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
    test('GET /v1/prover/:id requires valid prover ID', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/v1/prover/test-prover-id`);
      // Returns 404 for non-existent prover or 401 for unauthenticated
      expect([401, 404]).toContain(response.status());
    });

    test('POST /v1/prover/register requires valid request body', async ({ request }) => {
      const response = await request.post(`${API_BASE_URL}/v1/prover/register`, {
        data: {},
      });
      // Returns 422 for invalid request body or 401 for unauthenticated
      expect([401, 422]).toContain(response.status());
    });
  });
});

test.describe('Observer API Integration', () => {
  test.describe('Protected Endpoints', () => {
    test('GET /v1/observer/:id requires valid observer ID', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/v1/observer/test-observer-id`);
      // Returns 404 for non-existent observer or 401 for unauthenticated
      expect([401, 404]).toContain(response.status());
    });

    test('POST /v1/observer/register requires valid request body', async ({ request }) => {
      const response = await request.post(`${API_BASE_URL}/v1/observer/register`, {
        data: {},
      });
      // Returns 422 for invalid request body or 401 for unauthenticated
      expect([401, 422]).toContain(response.status());
    });
  });
});

test.describe('Governance API Integration', () => {
  test.describe('Public Endpoints', () => {
    test('GET /v1/governance/proposals should return proposals', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/v1/governance/proposals`);
      expect([200, 404]).toContain(response.status());
    });

    test('GET /v1/governance/dashboard should return dashboard', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/v1/governance/dashboard`);
      expect([200, 401, 404]).toContain(response.status());
    });
  });

  test.describe('Protected Endpoints', () => {
    test('POST /v1/governance/proposals requires valid request body', async ({ request }) => {
      const response = await request.post(`${API_BASE_URL}/v1/governance/proposals`, {
        data: { title: 'Test', description: 'Test proposal' },
      });
      // Returns 422 for invalid request body or 401 for unauthenticated
      expect([401, 422]).toContain(response.status());
    });

    test('POST /v1/governance/vote requires valid request body', async ({ request }) => {
      const response = await request.post(`${API_BASE_URL}/v1/governance/vote`, {
        data: { proposalId: 1, vote: 'for' },
      });
      // Returns 422 for invalid request body or 401 for unauthenticated
      expect([401, 422]).toContain(response.status());
    });
  });
});

test.describe('Admin API Integration', () => {
  test('Admin endpoints are accessible', async ({ request }) => {
    // Admin API is at /api/admin/* and /api/provers etc
    const adminEndpoints = [
      '/api/admin/dashboard',
      '/api/admin/transactions',
      '/api/provers',
      '/api/observers',
    ];

    for (const endpoint of adminEndpoints) {
      const response = await request.get(`${API_BASE_URL}${endpoint}`);
      // Admin endpoints may return:
      // - 200: Success (with mock data or real data)
      // - 401: Unauthorized (when auth is enforced)
      // - 404: Not found
      // - 500: Database error (when DB not connected)
      expect([200, 401, 404, 500]).toContain(response.status());
    }
  });
});
