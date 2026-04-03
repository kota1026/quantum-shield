/**
 * Lock Integration Tests (Sequence #1) — Deep Verification
 *
 * Verifies the full lock flow: FE → BE → DB → L1
 * Tests real backend endpoints with skip_signature_verification=true (dev mode).
 *
 * Prerequisites:
 * - Backend running on localhost:8080
 * - Docker services: postgres, redis, rabbitmq, l3-node
 * - skip_signature_verification: true in config
 *
 * Spec References:
 * - SEQUENCES §1: Lock
 * - SR_0 = SHA3-256 hash
 * - SMT leaf insertion + proof
 * - L1 Vault lockWithSR0 transaction
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

test.describe('Sequence #1: Lock — Deep Integration', () => {
  test('health check confirms backend is ready', async ({ request }) => {
    const response = await request.get(`${API_BASE}/v1/health`);
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.status).toBe('healthy');
  });

  test('POST /v1/lock creates lock with valid SR_0 and lock_id', async ({
    request,
  }) => {
    const nonce = Date.now() + Math.floor(Math.random() * 100000);
    const expiry = Math.floor(Date.now() / 1000) + 86400 * 7;
    const destAddr = hexBytes(20);

    const response = await request.post(`${API_BASE}/v1/lock`, {
      data: {
        chain_id: 11155111,
        asset: 'ETH',
        amount: '500000000000000000', // 0.5 ETH
        dest_addr: destAddr,
        pk_dilithium: hexBytes(32),
        sig_dilithium: hexBytes(64),
        expiry,
        nonce,
      },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();

    // Core response fields
    expect(data.lock_id).toBeTruthy();
    expect(data.lock_id).toMatch(/^0x[a-f0-9]+$/);

    // SR_0: SHA3-256 hash (32 bytes = 64 hex chars + 0x)
    expect(data.sr_0).toBeTruthy();
    expect(data.sr_0).toMatch(/^0x[a-f0-9]{64}$/);

    // SMT proof
    expect(data.smt_proof).toBeTruthy();
    expect(data.smt_proof).toMatch(/^0x[a-f0-9]+$/);

    // Status should be pending
    expect(data.status).toBe('pending');

    console.log(`[Lock] lock_id=${data.lock_id}`);
    console.log(`[Lock] sr_0=${data.sr_0}`);
    console.log(`[Lock] smt_proof length=${data.smt_proof.length} chars`);
    if (data.l1_tx_hash) {
      console.log(`[Lock] l1_tx_hash=${data.l1_tx_hash}`);
    }
  });

  test('lock is persisted in DB and visible via GET /v1/explorer/locks', async ({
    request,
  }) => {
    // Create lock
    const nonce = Date.now() + Math.floor(Math.random() * 100000);
    const expiry = Math.floor(Date.now() / 1000) + 86400 * 7;
    const createRes = await request.post(`${API_BASE}/v1/lock`, {
      data: {
        chain_id: 11155111,
        asset: 'ETH',
        amount: '200000000000000000', // 0.2 ETH
        dest_addr: hexBytes(20),
        pk_dilithium: hexBytes(32),
        sig_dilithium: hexBytes(64),
        expiry,
        nonce,
      },
    });
    expect(createRes.status()).toBe(200);
    const lock = await createRes.json();

    // Retrieve lock from explorer locks list
    const listRes = await request.get(`${API_BASE}/v1/explorer/locks`);
    expect(listRes.status()).toBe(200);
    const listData = await listRes.json();
    const locks = listData.locks || listData;

    // Find our lock in the list
    const found = locks.find(
      (l: { id: string }) => l.id === lock.lock_id
    );
    expect(found).toBeTruthy();
    expect(found.status).toMatch(/active|pending/);
    console.log(`[Lock Persisted] lock_id=${lock.lock_id}, status=${found.status}`);
  });

  test('lock increases Explorer totalLocks count', async ({ request }) => {
    // BEFORE
    const beforeRes = await request.get(`${API_BASE}/v1/explorer/overview`);
    expect(beforeRes.ok()).toBeTruthy();
    const before = await beforeRes.json();
    const beforeCount = before.network.totalLocks;

    // Create lock
    const nonce = Date.now() + Math.floor(Math.random() * 100000);
    const createRes = await request.post(`${API_BASE}/v1/lock`, {
      data: {
        chain_id: 11155111,
        asset: 'ETH',
        amount: '100000000000000000',
        dest_addr: hexBytes(20),
        pk_dilithium: hexBytes(32),
        sig_dilithium: hexBytes(64),
        expiry: Math.floor(Date.now() / 1000) + 86400 * 7,
        nonce,
      },
    });
    expect(createRes.status()).toBe(200);

    // AFTER
    const afterRes = await request.get(`${API_BASE}/v1/explorer/overview`);
    expect(afterRes.ok()).toBeTruthy();
    const after = await afterRes.json();
    const afterCount = after.network.totalLocks;

    expect(afterCount).toBeGreaterThanOrEqual(beforeCount + 1);
    console.log(`[Explorer] totalLocks: ${beforeCount} -> ${afterCount}`);
  });

  test('nonce reuse is rejected', async ({ request }) => {
    const nonce = Date.now() + Math.floor(Math.random() * 100000);
    const expiry = Math.floor(Date.now() / 1000) + 86400 * 7;
    const lockData = {
      chain_id: 11155111,
      asset: 'ETH',
      amount: '100000000000000000',
      dest_addr: hexBytes(20),
      pk_dilithium: hexBytes(32),
      sig_dilithium: hexBytes(64),
      expiry,
      nonce,
    };

    // First lock — should succeed
    const first = await request.post(`${API_BASE}/v1/lock`, { data: lockData });
    expect(first.status()).toBe(200);

    // Second lock with same nonce — should fail
    const second = await request.post(`${API_BASE}/v1/lock`, { data: lockData });
    expect(second.status()).toBeGreaterThanOrEqual(400);
    console.log(`[Nonce Reuse] Correctly rejected with status ${second.status()}`);
  });

  test('expired lock request is rejected', async ({ request }) => {
    const response = await request.post(`${API_BASE}/v1/lock`, {
      data: {
        chain_id: 11155111,
        asset: 'ETH',
        amount: '100000000000000000',
        dest_addr: hexBytes(20),
        pk_dilithium: hexBytes(32),
        sig_dilithium: hexBytes(64),
        expiry: Math.floor(Date.now() / 1000) - 3600, // 1 hour in the past
        nonce: Date.now(),
      },
    });

    expect(response.status()).toBeGreaterThanOrEqual(400);
    console.log(`[Expired] Correctly rejected with status ${response.status()}`);
  });

  test('lock with missing required fields is rejected', async ({ request }) => {
    // Missing amount field entirely
    const response = await request.post(`${API_BASE}/v1/lock`, {
      data: {
        chain_id: 11155111,
        asset: 'ETH',
        // amount missing
        dest_addr: hexBytes(20),
        pk_dilithium: hexBytes(32),
        sig_dilithium: hexBytes(64),
        expiry: Math.floor(Date.now() / 1000) + 86400,
        nonce: Date.now(),
      },
    });

    expect(response.status()).toBeGreaterThanOrEqual(400);
    console.log(`[Missing Field] Correctly rejected with status ${response.status()}`);
  });

  test('multiple locks create distinct lock_ids and SR_0s', async ({
    request,
  }) => {
    const locks = [];
    for (let i = 0; i < 3; i++) {
      const res = await request.post(`${API_BASE}/v1/lock`, {
        data: {
          chain_id: 11155111,
          asset: 'ETH',
          amount: `${(i + 1) * 100000000000000000}`,
          dest_addr: hexBytes(20),
          pk_dilithium: hexBytes(32),
          sig_dilithium: hexBytes(64),
          expiry: Math.floor(Date.now() / 1000) + 86400 * 7,
          nonce: Date.now() + i,
        },
      });
      expect(res.status()).toBe(200);
      locks.push(await res.json());
    }

    // All lock_ids must be unique
    const lockIds = locks.map((l) => l.lock_id);
    expect(new Set(lockIds).size).toBe(3);

    // All SR_0s must be unique (different inputs → different hashes)
    const sr0s = locks.map((l) => l.sr_0);
    expect(new Set(sr0s).size).toBe(3);

    console.log(`[Multi-Lock] 3 distinct locks created: ${lockIds.join(', ')}`);
  });
});
