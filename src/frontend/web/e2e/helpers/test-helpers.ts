/**
 * E2E Test Helpers for Sequence Integration Tests
 *
 * Provides utilities for:
 * 1. API data fetching (backend verification)
 * 2. UI data extraction (frontend verification via data-testid)
 * 3. Cross-app numeric comparison
 * 4. Common operations (lock, unlock, proposal creation via API)
 */

import { type Page, type APIRequestContext, expect } from '@playwright/test';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
const APP_BASE = 'http://localhost:3000';

// ============================================================
// 1. API Data Fetching Helpers
// ============================================================

/** Fetch explorer overview stats from API */
export async function getExplorerStatsFromApi(request: APIRequestContext) {
  const res = await request.get(`${API_BASE}/v1/explorer/overview`);
  expect(res.ok()).toBeTruthy();
  const data = await res.json();
  return {
    totalLocks: data.network.totalLocks as number,
    totalUnlocks: data.network.totalUnlocks as number,
    activeProvers: data.network.activeProvers as number,
    totalChallenges: data.network.totalChallenges as number,
    totalValueLocked: data.network.totalValueLocked as string,
  };
}

/** Fetch governance proposals count from API */
export async function getGovernanceProposalsFromApi(request: APIRequestContext) {
  const res = await request.get(`${API_BASE}/v1/governance/proposals`);
  expect(res.ok()).toBeTruthy();
  const data = await res.json();
  const proposals = Array.isArray(data) ? data : data.proposals || [];
  return {
    total: data.total ?? proposals.length,
    proposals,
  };
}

/** Fetch user dashboard from API (requires wallet address) */
export async function getUserDashboardFromApi(
  request: APIRequestContext,
  address: string = '0x1111111111111111111111111111111111111111'
) {
  const res = await request.get(`${API_BASE}/v1/user/dashboard`, {
    headers: { 'X-User-Address': address },
  });
  expect(res.ok()).toBeTruthy();
  return res.json();
}

/** Fetch token-hub delegates from API */
export async function getTokenHubDelegatesFromApi(request: APIRequestContext) {
  const res = await request.get(`${API_BASE}/v1/token-hub/delegates`);
  expect(res.ok()).toBeTruthy();
  return res.json();
}

/** Fetch prover list from API */
export async function getProversFromApi(request: APIRequestContext) {
  const res = await request.get(`${API_BASE}/v1/prover/list`);
  if (res.status() === 404) {
    // Try alternative endpoint
    const res2 = await request.get(`${API_BASE}/v1/explorer/provers`);
    if (res2.ok()) return res2.json();
    return { provers: [], total: 0 };
  }
  expect(res.ok()).toBeTruthy();
  return res.json();
}

/** Fetch admin dashboard overview from API */
export async function getAdminDashboardFromApi(request: APIRequestContext) {
  const res = await request.get(`${API_BASE}/v1/admin/dashboard/overview`);
  if (!res.ok()) return null;
  return res.json();
}

/** Fetch health status from API */
export async function getHealthFromApi(request: APIRequestContext) {
  const res = await request.get(`${API_BASE}/v1/health/ready`);
  expect(res.ok()).toBeTruthy();
  return res.json();
}

// ============================================================
// 2. API Operation Helpers (for actions requiring wallet signature)
// ============================================================

/** Create a lock via API (wallet signature fallback) */
export async function createLockViaApi(
  request: APIRequestContext,
  params: {
    amount?: string;
    destAddr?: string;
  } = {}
) {
  const {
    amount = '100000000000000000', // 0.1 ETH
    destAddr = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  } = params;

  const res = await request.post(`${API_BASE}/v1/lock`, {
    data: {
      chain_id: 11155111,
      asset: 'ETH',
      amount,
      dest_addr: destAddr,
      expiry: Math.floor(Date.now() / 1000) + 86400 * 7, // 7 days from now
      nonce: Date.now(),
      pk_dilithium: '0x' + 'ab'.repeat(1952),
      sig_dilithium: '0x' + 'cd'.repeat(3309),
    },
  });

  return { status: res.status(), data: await res.json().catch(() => null) };
}

/** Request unlock via API (wallet signature fallback) */
export async function requestUnlockViaApi(
  request: APIRequestContext,
  lockId: string
) {
  const res = await request.post(`${API_BASE}/v1/unlock`, {
    data: {
      lock_id: lockId,
      dest_addr: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      amount: '100000000000000000',
      sig_dilithium: '0x' + 'ee'.repeat(3309),
    },
  });

  return { status: res.status(), data: await res.json().catch(() => null) };
}

/** Create a governance proposal via API */
export async function createProposalViaApi(
  request: APIRequestContext,
  title?: string
) {
  const proposalTitle = title || `E2E Test Proposal ${Date.now()}`;
  const res = await request.post(`${API_BASE}/v1/governance/proposals`, {
    data: {
      title: proposalTitle,
      description: 'Automated E2E test proposal',
      fullDescription: `This proposal was created during sequence E2E testing at ${new Date().toISOString()}`,
      type: 'signal',
      votingDuration: 604800,
      signature: '0x' + 'ff'.repeat(64),
    },
  });

  return {
    status: res.status(),
    data: await res.json().catch(() => null),
  };
}

/** Register a prover via API */
export async function registerProverViaApi(
  request: APIRequestContext,
  name?: string
) {
  const res = await request.post(`${API_BASE}/v1/prover/register`, {
    data: {
      name: name || `E2E-Prover-${Date.now()}`,
      address: `0x${Date.now().toString(16).padStart(40, '0')}`,
      stake: '32000000000000000000', // 32 ETH
      dilithium_pubkey: '0x' + 'ab'.repeat(1952),
      signature: '0x' + 'cd'.repeat(3309),
    },
  });

  return { status: res.status(), data: await res.json().catch(() => null) };
}

// ============================================================
// 3. UI Data Extraction Helpers (via data-testid)
// ============================================================

/** Extract numeric value from a data-testid element */
export async function getTestIdValue(page: Page, testId: string): Promise<string> {
  const el = page.locator(`[data-testid="${testId}"]`);
  await expect(el).toBeVisible({ timeout: 10000 });
  const text = await el.textContent();
  return text?.trim() || '';
}

/** Extract number from a data-testid element (strips non-numeric chars except '.') */
export async function getTestIdNumber(page: Page, testId: string): Promise<number> {
  const text = await getTestIdValue(page, testId);
  const numStr = text.replace(/[^0-9.-]/g, '');
  return parseFloat(numStr) || 0;
}

/** Navigate to a page and wait for content */
export async function navigateAndWait(page: Page, path: string, timeout = 15000) {
  await page.goto(`${APP_BASE}${path}`);
  // Wait for any main content to appear
  await expect(
    page.locator('main, [role="main"], .min-h-screen, #__next > div').first()
  ).toBeVisible({ timeout });
}

// ============================================================
// 4. Cross-App Verification Helpers
// ============================================================

/** Get Explorer overview stats from the UI */
export async function getExplorerStatsFromUI(page: Page) {
  await navigateAndWait(page, '/ja/explorer/overview');
  // Wait a bit for data to load
  await page.waitForTimeout(2000);

  return {
    tvl: await getTestIdValue(page, 'explorer-tvl-value'),
    totalLocks: await getTestIdNumber(page, 'explorer-total-locks-value'),
    pendingUnlocks: await getTestIdNumber(page, 'explorer-pending-unlocks-value'),
    activeProvers: await getTestIdNumber(page, 'explorer-active-provers-value'),
  };
}

/** Safely get text from a data-testid element (returns fallback on timeout) */
async function safeGetTestIdText(page: Page, testId: string, fallback = '0'): Promise<string> {
  try {
    const el = page.locator(`[data-testid="${testId}"]`);
    if (await el.isVisible({ timeout: 3000 })) {
      return (await el.textContent())?.trim() || fallback;
    }
    return fallback;
  } catch {
    return fallback;
  }
}

/** Get QS Admin dashboard stats from the UI (gracefully handles auth-gated content) */
export async function getAdminStatsFromUI(page: Page) {
  await navigateAndWait(page, '/ja/qs-admin/dashboard');
  await page.waitForTimeout(2000);

  return {
    totalUsers: await safeGetTestIdText(page, 'admin-total-users-value'),
    totalLocked: await safeGetTestIdText(page, 'admin-total-locked-value'),
    activeProvers: await safeGetTestIdText(page, 'admin-active-provers-value'),
    activeObservers: await safeGetTestIdText(page, 'admin-active-observers-value'),
    pendingUnlocks: await safeGetTestIdText(page, 'admin-pending-unlocks-value'),
    treasuryBalance: await safeGetTestIdText(page, 'admin-treasury-balance-value'),
  };
}

/** Get Governance dashboard stats from the UI (gracefully handles auth-gated content) */
export async function getGovernanceStatsFromUI(page: Page) {
  await navigateAndWait(page, '/ja/governance/dashboard');
  await page.waitForTimeout(2000);

  const getNum = async (testId: string): Promise<number> => {
    const text = await safeGetTestIdText(page, testId, '0');
    return parseFloat(text.replace(/[^0-9.-]/g, '')) || 0;
  };

  return {
    activeProposals: await getNum('governance-active-proposals-value'),
    totalProposals: await getNum('governance-total-proposals-value'),
  };
}

// ============================================================
// 5. Comparison Utilities
// ============================================================

/** Verify that a number increased by at least `min` after an operation */
export function expectIncreased(before: number, after: number, min = 1, label = 'value') {
  expect(after, `${label} should have increased (before=${before}, after=${after})`).toBeGreaterThanOrEqual(before + min);
}

/** Verify that two values match (API vs UI) */
export function expectMatch(apiValue: number | string, uiValue: number | string, label = 'value') {
  expect(String(uiValue), `${label}: UI value should match API value`).toContain(String(apiValue));
}
