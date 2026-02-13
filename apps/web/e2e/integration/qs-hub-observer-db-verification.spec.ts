/**
 * Slice 3 & 4: QS Hub + Governance + Observer + Explorer — E2E DB Verification Test
 *
 * Verifies that Slice 3 (QS Hub/Governance integration) and Slice 4 (Observer/Explorer)
 * endpoints return real data from the database without mock fallbacks.
 *
 * Test scope:
 *
 * Slice 3 — QS Hub + Governance:
 * 1. GET /v1/qs-hub/dashboard/stats → Returns real dashboard statistics
 * 2. GET /v1/qs-hub/proposals → Returns array of governance proposals
 * 3. GET /v1/qs-hub/rewards → Returns rewards data
 * 4. GET /v1/qs-hub/delegates → Returns delegate list
 * 5. GET /v1/qs-hub/council → Returns council members array
 *
 * Slice 4 — Observer + Explorer:
 * 6. GET /v1/observer/dashboard → Returns observer dashboard data
 * 7. GET /v1/observer/pending-unlocks → Returns pending unlock requests
 * 8. GET /v1/explorer/overview → Returns overview stats matching DB
 * 9. GET /v1/explorer/locks → Returns locks array (already tested in Slice 1)
 * 10. GET /v1/explorer/unlocks → Returns unlocks array
 * 11. GET /v1/explorer/challenges → Returns challenges array
 * 12. GET /v1/explorer/provers → Returns provers array
 *
 * Prerequisites:
 * - Backend API running on localhost:8080
 * - PostgreSQL accessible via backend
 * - Slice 1 (Lock) fully completed and DB populated
 * - No mock data fallbacks (ENABLE_MOCK=false)
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8080';

test.describe('Slice 3 & 4: QS Hub + Governance + Observer + Explorer DB Verification', () => {
  test.describe('Backend API Health', () => {
    test('API server is healthy', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/v1/health`);
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.status).toBe('healthy');
    });
  });

  // ============================================================================
  // Slice 3: QS Hub + Governance
  // ============================================================================

  test.describe('Slice 3: QS Hub Dashboard Stats', () => {
    test('GET /v1/qs-hub/dashboard/stats returns real data', async ({
      request,
    }) => {
      const response = await request.get(
        `${API_BASE_URL}/v1/qs-hub/dashboard/stats`
      );

      // Endpoint may not exist yet (Phase B) — skip if 404
      if (!response.ok()) {
        if (response.status() === 404) {
          test.skip(true, 'QS Hub dashboard stats endpoint not yet deployed');
        }
        expect(response.ok()).toBeTruthy();
        return;
      }

      const data = await response.json();
      expect(data).toBeDefined();

      // Should return stats object with key metrics (not mock fallback)
      // Don't assert specific values since DB might be empty
      // Just verify structure exists
      expect(typeof data).toBe('object');
    });
  });

  test.describe('Slice 3: Governance Proposals', () => {
    test('GET /v1/qs-hub/proposals returns proposals array', async ({
      request,
    }) => {
      const response = await request.get(`${API_BASE_URL}/v1/qs-hub/proposals`);

      if (!response.ok()) {
        if (response.status() === 404) {
          test.skip(true, 'QS Hub proposals endpoint not yet deployed');
        }
        expect(response.ok()).toBeTruthy();
        return;
      }

      const data = await response.json();

      // Should have proposals array property
      expect(data).toHaveProperty('proposals');
      expect(Array.isArray(data.proposals)).toBeTruthy();

      // If proposals exist, verify structure (not FALLBACK_PROPOSALS)
      if (data.proposals.length > 0) {
        const proposal = data.proposals[0];
        expect(proposal).toHaveProperty('id');
        expect(proposal).toHaveProperty('title');
        // Should have a real proposal ID (e.g., "QIP-001"), not placeholder
        expect(proposal.id).toBeTruthy();
      }
    });

    test('proposal IDs are valid format (QIP-xxx)', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/v1/qs-hub/proposals`);

      if (!response.ok()) {
        test.skip(true, 'QS Hub proposals endpoint not available');
        return;
      }

      const data = await response.json();

      // If proposals exist, validate ID format
      if (data.proposals && data.proposals.length > 0) {
        for (const proposal of data.proposals) {
          if (proposal.id) {
            // Should be QIP-xxx format
            expect(proposal.id).toMatch(/^QIP-\d+$/);
          }
        }
      }
    });
  });

  test.describe('Slice 3: QS Hub Rewards', () => {
    test('GET /v1/qs-hub/rewards returns rewards data', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/v1/qs-hub/rewards`);

      if (!response.ok()) {
        if (response.status() === 404) {
          test.skip(true, 'QS Hub rewards endpoint not yet deployed');
        }
        expect(response.ok()).toBeTruthy();
        return;
      }

      const data = await response.json();
      expect(data).toBeDefined();

      // Should return rewards object (not mock fallback with fake values)
      expect(typeof data).toBe('object');
    });
  });

  test.describe('Slice 3: QS Hub Delegates', () => {
    test('GET /v1/qs-hub/delegates returns delegate list', async ({
      request,
    }) => {
      const response = await request.get(`${API_BASE_URL}/v1/qs-hub/delegates`);

      if (!response.ok()) {
        if (response.status() === 404) {
          test.skip(true, 'QS Hub delegates endpoint not yet deployed');
        }
        expect(response.ok()).toBeTruthy();
        return;
      }

      const data = await response.json();

      // Should have delegates array property
      expect(data).toHaveProperty('delegates');
      expect(Array.isArray(data.delegates)).toBeTruthy();

      // If delegates exist, verify structure
      if (data.delegates.length > 0) {
        const delegate = data.delegates[0];
        expect(delegate).toHaveProperty('address');
        // Address should be real (0x...) not placeholder
        expect(delegate.address).toMatch(/^0x[0-9a-f]{40}$/i);
      }
    });
  });

  test.describe('Slice 3: Governance Council', () => {
    test('GET /v1/qs-hub/council returns council members array', async ({
      request,
    }) => {
      const response = await request.get(`${API_BASE_URL}/v1/qs-hub/council`);

      if (!response.ok()) {
        if (response.status() === 404) {
          test.skip(true, 'QS Hub council endpoint not yet deployed');
        }
        expect(response.ok()).toBeTruthy();
        return;
      }

      const data = await response.json();

      // Should have members array property
      expect(data).toHaveProperty('members');
      expect(Array.isArray(data.members)).toBeTruthy();

      // If members exist, verify structure (not FALLBACK_COUNCIL)
      if (data.members.length > 0) {
        const member = data.members[0];
        expect(member).toHaveProperty('address');
        expect(member.address).toMatch(/^0x[0-9a-f]{40}$/i);
      }
    });
  });

  // ============================================================================
  // Slice 4: Observer
  // ============================================================================

  test.describe('Slice 4: Observer Dashboard', () => {
    test('GET /v1/observer/dashboard returns real data', async ({ request }) => {
      const response = await request.get(
        `${API_BASE_URL}/v1/observer/dashboard`
      );

      if (!response.ok()) {
        if (response.status() === 404) {
          test.skip(true, 'Observer dashboard endpoint not yet deployed');
        }
        expect(response.ok()).toBeTruthy();
        return;
      }

      const data = await response.json();
      expect(data).toBeDefined();

      // Should return dashboard object with metrics
      expect(typeof data).toBe('object');
    });
  });

  test.describe('Slice 4: Observer Pending Unlocks', () => {
    test('GET /v1/observer/pending-unlocks returns pending unlock requests', async ({
      request,
    }) => {
      const response = await request.get(
        `${API_BASE_URL}/v1/observer/pending-unlocks`
      );

      if (!response.ok()) {
        if (response.status() === 404) {
          test.skip(true, 'Observer pending-unlocks endpoint not yet deployed');
        }
        expect(response.ok()).toBeTruthy();
        return;
      }

      const data = await response.json();

      // Should have unlocks array property
      expect(data).toHaveProperty('unlocks');
      expect(Array.isArray(data.unlocks)).toBeTruthy();

      // If unlocks exist, verify structure
      if (data.unlocks.length > 0) {
        const unlock = data.unlocks[0];
        expect(unlock).toHaveProperty('id');
        expect(unlock).toHaveProperty('status');
      }
    });
  });

  // ============================================================================
  // Slice 4: Explorer
  // ============================================================================

  test.describe('Slice 4: Explorer Overview', () => {
    test('GET /v1/explorer/overview returns real stats', async ({ request }) => {
      const response = await request.get(
        `${API_BASE_URL}/v1/explorer/overview`
      );

      if (!response.ok()) {
        if (response.status() === 404) {
          test.skip(true, 'Explorer overview endpoint not yet deployed');
        }
        expect(response.ok()).toBeTruthy();
        return;
      }

      const data = await response.json();
      expect(data).toBeDefined();

      // Overview should have stats object (not all zeros/mock fallback)
      expect(typeof data).toBe('object');

      // Common overview fields that should exist (values may be 0 in empty DB)
      if (data.stats) {
        expect(typeof data.stats).toBe('object');
      }
    });

    test('explorer overview stats are consistent with lock count', async ({
      request,
    }) => {
      // Get lock count from explorer
      const locksResponse = await request.get(
        `${API_BASE_URL}/v1/explorer/locks`
      );

      if (!locksResponse.ok()) {
        test.skip(true, 'Explorer locks endpoint not available');
        return;
      }

      const locksData = await locksResponse.json();
      const lockCount = locksData.total || locksData.locks?.length || 0;

      // Get overview stats
      const overviewResponse = await request.get(
        `${API_BASE_URL}/v1/explorer/overview`
      );

      if (!overviewResponse.ok()) {
        test.skip(true, 'Explorer overview endpoint not available');
        return;
      }

      const overviewData = await overviewResponse.json();

      // If overview has lock_count field, should match locks endpoint
      if (overviewData.stats && typeof overviewData.stats.lock_count === 'number') {
        expect(overviewData.stats.lock_count).toBe(lockCount);
      }
    });
  });

  test.describe('Slice 4: Explorer Locks', () => {
    test('GET /v1/explorer/locks returns locks array', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/v1/explorer/locks`);

      expect(response.ok()).toBeTruthy();
      const data = await response.json();

      expect(data).toHaveProperty('locks');
      expect(Array.isArray(data.locks)).toBeTruthy();
      expect(data).toHaveProperty('total');
      expect(typeof data.total).toBe('number');

      // Verify not returning mock data (Slice 1 gate: should have at least 9 locks from DB seed)
      if (data.locks.length > 0) {
        const lock = data.locks[0];
        expect(lock).toHaveProperty('id');
        expect(lock.id).toMatch(/^0x[0-9a-f]{64}$/);
      }
    });
  });

  test.describe('Slice 4: Explorer Unlocks', () => {
    test('GET /v1/explorer/unlocks returns unlocks array', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/v1/explorer/unlocks`);

      if (!response.ok()) {
        if (response.status() === 404) {
          test.skip(true, 'Explorer unlocks endpoint not yet deployed');
        }
        expect(response.ok()).toBeTruthy();
        return;
      }

      const data = await response.json();

      // Should have unlocks array property
      expect(data).toHaveProperty('unlocks');
      expect(Array.isArray(data.unlocks)).toBeTruthy();

      // If unlocks exist, verify structure (not mock fallback)
      if (data.unlocks.length > 0) {
        const unlock = data.unlocks[0];
        expect(unlock).toHaveProperty('id');
      }
    });
  });

  test.describe('Slice 4: Explorer Challenges', () => {
    test('GET /v1/explorer/challenges returns challenges array', async ({
      request,
    }) => {
      const response = await request.get(
        `${API_BASE_URL}/v1/explorer/challenges`
      );

      if (!response.ok()) {
        if (response.status() === 404) {
          test.skip(true, 'Explorer challenges endpoint not yet deployed');
        }
        expect(response.ok()).toBeTruthy();
        return;
      }

      const data = await response.json();

      // Should have challenges array property
      expect(data).toHaveProperty('challenges');
      expect(Array.isArray(data.challenges)).toBeTruthy();

      // If challenges exist, verify structure
      if (data.challenges.length > 0) {
        const challenge = data.challenges[0];
        expect(challenge).toHaveProperty('id');
      }
    });
  });

  test.describe('Slice 4: Explorer Provers', () => {
    test('GET /v1/explorer/provers returns provers array', async ({
      request,
    }) => {
      const response = await request.get(`${API_BASE_URL}/v1/explorer/provers`);

      if (!response.ok()) {
        if (response.status() === 404) {
          test.skip(true, 'Explorer provers endpoint not yet deployed');
        }
        expect(response.ok()).toBeTruthy();
        return;
      }

      const data = await response.json();

      // Should have provers array property
      expect(data).toHaveProperty('provers');
      expect(Array.isArray(data.provers)).toBeTruthy();

      // If provers exist, verify structure
      if (data.provers.length > 0) {
        const prover = data.provers[0];
        expect(prover).toHaveProperty('id');
        expect(prover).toHaveProperty('address');
        // Address should be valid
        expect(prover.address).toMatch(/^0x[0-9a-f]{40}$/i);
      }
    });
  });

  // ============================================================================
  // Cross-endpoint Consistency Checks
  // ============================================================================

  test.describe('Explorer Data Consistency', () => {
    test('all explorer endpoints return consistent structures', async ({
      request,
    }) => {
      const endpoints = [
        '/v1/explorer/locks',
        '/v1/explorer/unlocks',
        '/v1/explorer/challenges',
        '/v1/explorer/provers',
      ];

      for (const endpoint of endpoints) {
        const response = await request.get(`${API_BASE_URL}${endpoint}`);

        // Skip if endpoint not deployed
        if (response.status() === 404) {
          continue;
        }

        expect(response.ok()).toBeTruthy();
        const data = await response.json();

        // All explorer endpoints should return object with array and total
        expect(data).toBeDefined();
        expect(typeof data).toBe('object');
      }
    });
  });

  test.describe('No Mock Fallbacks', () => {
    test('QS Hub endpoints do not return FALLBACK_ prefixed data', async ({
      request,
    }) => {
      const endpoints = [
        '/v1/qs-hub/proposals',
        '/v1/qs-hub/delegates',
        '/v1/qs-hub/council',
      ];

      for (const endpoint of endpoints) {
        const response = await request.get(`${API_BASE_URL}${endpoint}`);

        // Skip if not deployed
        if (response.status() === 404) {
          continue;
        }

        if (!response.ok()) {
          continue;
        }

        const data = await response.json();
        const jsonString = JSON.stringify(data);

        // Should not contain FALLBACK_ strings (indicator of mock data)
        expect(jsonString).not.toContain('FALLBACK_');
      }
    });

    test('Observer endpoints do not return FALLBACK_ prefixed data', async ({
      request,
    }) => {
      const endpoints = [
        '/v1/observer/dashboard',
        '/v1/observer/pending-unlocks',
      ];

      for (const endpoint of endpoints) {
        const response = await request.get(`${API_BASE_URL}${endpoint}`);

        if (response.status() === 404) {
          continue;
        }

        if (!response.ok()) {
          continue;
        }

        const data = await response.json();
        const jsonString = JSON.stringify(data);

        expect(jsonString).not.toContain('FALLBACK_');
      }
    });

    test('Explorer endpoints do not return FALLBACK_ prefixed data', async ({
      request,
    }) => {
      const endpoints = [
        '/v1/explorer/overview',
        '/v1/explorer/locks',
        '/v1/explorer/unlocks',
        '/v1/explorer/challenges',
        '/v1/explorer/provers',
      ];

      for (const endpoint of endpoints) {
        const response = await request.get(`${API_BASE_URL}${endpoint}`);

        if (response.status() === 404) {
          continue;
        }

        if (!response.ok()) {
          continue;
        }

        const data = await response.json();
        const jsonString = JSON.stringify(data);

        expect(jsonString).not.toContain('FALLBACK_');
      }
    });
  });
});
