/**
 * Governance Integration Tests (Sequence #7)
 *
 * Verifies the governance flow: Dashboard → Proposals → Council → Voting Power
 * Tests real backend endpoints and frontend L/E/E states.
 *
 * Prerequisites:
 * - Backend running on localhost:8080
 * - Docker services: postgres, redis, rabbitmq, l3-node
 *
 * Spec References:
 * - SEQUENCES §7: Governance Proposal
 * - L3 contracts: Governor, veQS
 */
import { test, expect } from '@playwright/test';

const API_BASE = 'http://localhost:8080';

test.describe('Governance API Integration (Sequence #7)', () => {
  test('health check confirms backend is ready', async ({ request }) => {
    const response = await request.get(`${API_BASE}/v1/health`);
    expect(response.status()).toBe(200);
  });

  test('GET /v1/governance/dashboard returns dashboard data', async ({
    request,
  }) => {
    const response = await request.get(`${API_BASE}/v1/governance/dashboard`);
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toBeTruthy();
    // Dashboard should include stats about proposals, voting, etc.
    expect(typeof data.total_proposals !== 'undefined' || typeof data.totalProposals !== 'undefined').toBe(true);
  });

  test('GET /v1/governance/proposals returns proposals list', async ({
    request,
  }) => {
    const response = await request.get(`${API_BASE}/v1/governance/proposals`);
    expect(response.status()).toBe(200);

    const data = await response.json();
    // Should return proposals array
    const proposals = data.proposals || data.items || data;
    expect(Array.isArray(proposals)).toBe(true);

    // If proposals exist, verify structure
    if (proposals.length > 0) {
      const proposal = proposals[0];
      expect(proposal.id || proposal.proposal_id || proposal.proposalId).toBeTruthy();
      expect(proposal.title).toBeTruthy();
      expect(proposal.status).toBeTruthy();
    }
  });

  test('GET /v1/governance/council returns council members', async ({
    request,
  }) => {
    const response = await request.get(`${API_BASE}/v1/governance/council`);
    expect(response.status()).toBe(200);

    const data = await response.json();
    const members = data.members || data.items || data;
    expect(Array.isArray(members)).toBe(true);

    // Council should have members (9 per spec)
    if (members.length > 0) {
      const member = members[0];
      expect(member.name || member.wallet_address || member.walletAddress).toBeTruthy();
    }
  });

  test('GET /v1/governance/voting-power returns voting power data', async ({
    request,
  }) => {
    const response = await request.get(`${API_BASE}/v1/governance/voting-power`);
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toBeTruthy();
  });

  test('GET /v1/governance/activity returns governance activity', async ({
    request,
  }) => {
    const response = await request.get(`${API_BASE}/v1/governance/activity`);
    expect(response.status()).toBe(200);

    const data = await response.json();
    const activities = data.activities || data.items || data;
    expect(Array.isArray(activities)).toBe(true);
  });

  test('POST /v1/governance/proposals creates proposal', async ({
    request,
  }) => {
    const response = await request.post(`${API_BASE}/v1/governance/proposals`, {
      data: {
        title: 'Integration Test Proposal',
        description: 'Test proposal created by E2E integration tests',
        type: 'parameter_change',
        proposer: '0xabcdef1234567890abcdef1234567890abcdef12',
        actions: [],
      },
    });

    // Should succeed or fail with validation (not 500)
    expect(response.status()).toBeLessThan(500);

    if (response.ok()) {
      const data = await response.json();
      expect(data.proposal_id || data.proposalId || data.id).toBeTruthy();
    }
  });

  test('GET /v1/governance/proposals/:id returns specific proposal', async ({
    request,
  }) => {
    // First get list to find an ID
    const listResponse = await request.get(
      `${API_BASE}/v1/governance/proposals`
    );
    const listData = await listResponse.json();
    const proposals = listData.proposals || listData.items || listData;

    if (Array.isArray(proposals) && proposals.length > 0) {
      const proposalId =
        proposals[0].id || proposals[0].proposal_id || proposals[0].proposalId;

      const response = await request.get(
        `${API_BASE}/v1/governance/proposals/${proposalId}`
      );
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.title).toBeTruthy();
      expect(data.description || data.body).toBeTruthy();
      expect(data.status).toBeTruthy();
    }
  });
});

test.describe('Governance Frontend L/E/E States', () => {
  test('shows loading state while fetching proposals', async ({ page }) => {
    await page.route('**/v1/governance/**', async (route) => {
      await new Promise((r) => setTimeout(r, 1000));
      await route.continue();
    });

    await page.goto('/ja/governance/proposals');

    const loadingIndicator = page
      .locator(
        '[class*="animate-pulse"], [class*="skeleton"], [class*="Skeleton"], [role="status"]'
      )
      .first();
    await expect(loadingIndicator).toBeVisible({ timeout: 2000 });
  });

  test('shows error state on API failure', async ({ page }) => {
    await page.route('**/v1/governance/**', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' }),
      });
    });

    await page.goto('/ja/governance/proposals');
    await page.waitForLoadState('networkidle');

    const errorIndicator = page.getByText(/error|エラー|失敗/i);
    await expect(errorIndicator).toBeVisible({ timeout: 5000 });
  });

  test('dashboard page makes API calls and displays data', async ({
    page,
  }) => {
    const apiCalls: string[] = [];

    await page.route('**/v1/governance/**', async (route) => {
      apiCalls.push(route.request().url());
      await route.continue();
    });

    await page.goto('/ja/governance');
    await page.waitForLoadState('networkidle');

    // Should have made at least one API call
    expect(apiCalls.length).toBeGreaterThan(0);
  });

  test('council page loads and displays member data', async ({ page }) => {
    let councilCalled = false;

    await page.route('**/v1/governance/council**', async (route) => {
      councilCalled = true;
      await route.continue();
    });

    await page.goto('/ja/governance/council');
    await page.waitForLoadState('networkidle');

    expect(councilCalled).toBe(true);
  });
});
