/**
 * Lock Integration Tests (Sequence #1) — Deep Verification
 *
 * Verifies the full lock flow: FE → BE → DB → L1
 * Tests real backend endpoints. Sends real ML-DSA-65 (FIPS 204) keys and
 * signatures so the backend's signature/length validation actually exercises
 * the production code path.
 *
 * Prerequisites:
 * - Backend running on localhost:8080
 * - Docker services: postgres, redis, rabbitmq, l3-node
 *
 * Spec References:
 * - SEQUENCES §1: Lock
 * - SR_0 = SHA3-256 hash
 * - SMT leaf insertion + proof
 * - L1 Vault lockWithSR0 transaction
 *
 * 2026-04-30 (orchestrator run 25168505086): switched from random
 * `hexBytes(32)` / `hexBytes(64)` placeholders to real ML-DSA-65 keypairs.
 * The placeholders were silently accepted by the backend's removed
 * `hex::decode().unwrap_or_else(|_| as_bytes())` fallback, masking client
 * bugs and recording garbage pks. Strict server-side length validation
 * (1952B pk / 3309B sig per FIPS 204) now rejects short payloads with
 * HTTP 400, so the test fixture must produce real keys.
 */
import { test, expect } from '@playwright/test';
// `.js` extension is required by @noble/post-quantum's exports map
// (`"./ml-dsa.js": "./ml-dsa.js"`). TS's moduleResolution lets the
// extensionless form type-check, but Node ESM at Playwright runtime
// honors the exports map strictly and fails at import. Run 25207474843
// caught this — frontend layer crashed at module load with
// "ERR_PACKAGE_PATH_NOT_EXPORTED" and zero tests ran.
import { ml_dsa65 } from '@noble/post-quantum/ml-dsa.js';
import { randomBytes } from 'node:crypto';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

const ML_DSA_65_PK_BYTES = 1952;
const ML_DSA_65_SIG_BYTES = 3309;

function hexBytes(n: number): string {
  const buf = randomBytes(n);
  return '0x' + Buffer.from(buf).toString('hex');
}

function toHexPrefixed(bytes: Uint8Array): string {
  return '0x' + Buffer.from(bytes).toString('hex');
}

/**
 * Big-endian u64 encoder. Mirrors Rust's `u64::to_be_bytes()` used in
 * src/api/api/src/routes/lock.rs::construct_lock_message — any drift here
 * makes signatures verify-fail with `Ok(false)`.
 */
function u64BE(n: bigint): Uint8Array {
  const buf = new Uint8Array(8);
  new DataView(buf.buffer).setBigUint64(0, n, false);
  return buf;
}

function concatBytes(...parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((s, p) => s + p.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const p of parts) {
    out.set(p, off);
    off += p.length;
  }
  return out;
}

type LockMsgFields = {
  chain_id: number;
  asset: string;
  amount: string;
  dest_addr: string;
  expiry: number;
  nonce: number;
};

/**
 * Mirrors src/api/api/src/routes/lock.rs::construct_lock_message exactly.
 * Layout: "QS_LOCK_V1" || chain_id (BE u64) || asset (utf8) || amount (utf8) ||
 *         dest_addr (utf8 of the "0x..." hex string) || expiry (BE u64) ||
 *         nonce (BE u64).
 */
function constructLockMessage(f: LockMsgFields): Uint8Array {
  const enc = new TextEncoder();
  return concatBytes(
    enc.encode('QS_LOCK_V1'),
    u64BE(BigInt(f.chain_id)),
    enc.encode(f.asset),
    enc.encode(f.amount),
    enc.encode(f.dest_addr),
    u64BE(BigInt(f.expiry)),
    u64BE(BigInt(f.nonce)),
  );
}

type SignedLock = LockMsgFields & {
  pk_dilithium: string;
  sig_dilithium: string;
};

/**
 * Generate a fresh ML-DSA-65 keypair and produce a valid signature over the
 * canonical lock message. The empty default context matches the Rust
 * backend's `sk.try_sign(&msg, &[])` call.
 */
function signLock(fields: LockMsgFields): SignedLock {
  const { secretKey, publicKey } = ml_dsa65.keygen();
  const message = constructLockMessage(fields);
  const sig = ml_dsa65.sign(message, secretKey);

  expect(publicKey.length).toBe(ML_DSA_65_PK_BYTES);
  expect(sig.length).toBe(ML_DSA_65_SIG_BYTES);

  return {
    ...fields,
    pk_dilithium: toHexPrefixed(publicKey),
    sig_dilithium: toHexPrefixed(sig),
  };
}

function uniqueNonce(): number {
  // Test runs in parallel; the millisecond timestamp + small random spread
  // is enough to avoid same-nonce collisions across the suite.
  return Date.now() + Math.floor(Math.random() * 100000);
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
    const payload = signLock({
      chain_id: 11155111,
      asset: 'ETH',
      amount: '500000000000000000', // 0.5 ETH
      dest_addr: hexBytes(20),
      expiry: Math.floor(Date.now() / 1000) + 86400 * 7,
      nonce: uniqueNonce(),
    });

    const response = await request.post(`${API_BASE}/v1/lock`, { data: payload });
    expect(response.status()).toBe(200);
    const data = await response.json();

    expect(data.lock_id).toBeTruthy();
    expect(data.lock_id).toMatch(/^0x[a-f0-9]+$/);

    expect(data.sr_0).toBeTruthy();
    expect(data.sr_0).toMatch(/^0x[a-f0-9]{64}$/);

    expect(data.smt_proof).toBeTruthy();
    expect(data.smt_proof).toMatch(/^0x[a-f0-9]+$/);

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
    const payload = signLock({
      chain_id: 11155111,
      asset: 'ETH',
      amount: '200000000000000000', // 0.2 ETH
      dest_addr: hexBytes(20),
      expiry: Math.floor(Date.now() / 1000) + 86400 * 7,
      nonce: uniqueNonce(),
    });
    const createRes = await request.post(`${API_BASE}/v1/lock`, { data: payload });
    expect(createRes.status()).toBe(200);
    const lock = await createRes.json();

    const listRes = await request.get(`${API_BASE}/v1/explorer/locks`);
    expect(listRes.status()).toBe(200);
    const listData = await listRes.json();
    const locks = listData.locks || listData;

    const found = locks.find(
      (l: { id: string }) => l.id === lock.lock_id
    );
    expect(found).toBeTruthy();
    expect(found.status).toMatch(/active|pending/);
    console.log(`[Lock Persisted] lock_id=${lock.lock_id}, status=${found.status}`);
  });

  test('lock increases Explorer totalLocks count', async ({ request }) => {
    const beforeRes = await request.get(`${API_BASE}/v1/explorer/overview`);
    expect(beforeRes.ok()).toBeTruthy();
    const before = await beforeRes.json();
    const beforeCount = before.network.totalLocks;

    const payload = signLock({
      chain_id: 11155111,
      asset: 'ETH',
      amount: '100000000000000000',
      dest_addr: hexBytes(20),
      expiry: Math.floor(Date.now() / 1000) + 86400 * 7,
      nonce: uniqueNonce(),
    });
    const createRes = await request.post(`${API_BASE}/v1/lock`, { data: payload });
    expect(createRes.status()).toBe(200);

    const afterRes = await request.get(`${API_BASE}/v1/explorer/overview`);
    expect(afterRes.ok()).toBeTruthy();
    const after = await afterRes.json();
    const afterCount = after.network.totalLocks;

    expect(afterCount).toBeGreaterThanOrEqual(beforeCount + 1);
    console.log(`[Explorer] totalLocks: ${beforeCount} -> ${afterCount}`);
  });

  test('nonce reuse is rejected', async ({ request }) => {
    // Same fields signed once; second submission with the same nonce must fail.
    const payload = signLock({
      chain_id: 11155111,
      asset: 'ETH',
      amount: '100000000000000000',
      dest_addr: hexBytes(20),
      expiry: Math.floor(Date.now() / 1000) + 86400 * 7,
      nonce: uniqueNonce(),
    });

    const first = await request.post(`${API_BASE}/v1/lock`, { data: payload });
    expect(first.status()).toBe(200);

    const second = await request.post(`${API_BASE}/v1/lock`, { data: payload });
    expect(second.status()).toBeGreaterThanOrEqual(400);
    console.log(`[Nonce Reuse] Correctly rejected with status ${second.status()}`);
  });

  test('expired lock request is rejected', async ({ request }) => {
    const payload = signLock({
      chain_id: 11155111,
      asset: 'ETH',
      amount: '100000000000000000',
      dest_addr: hexBytes(20),
      expiry: Math.floor(Date.now() / 1000) - 3600, // 1 hour in the past
      nonce: uniqueNonce(),
    });
    const response = await request.post(`${API_BASE}/v1/lock`, { data: payload });

    expect(response.status()).toBeGreaterThanOrEqual(400);
    console.log(`[Expired] Correctly rejected with status ${response.status()}`);
  });

  test('lock with missing required fields is rejected', async ({ request }) => {
    // Intentionally malformed: omit `amount`. Server must reject before any
    // signature check. We reuse hexBytes for the pk/sig fields here because
    // length validation runs after JSON deserialization, which already
    // catches the missing field.
    const response = await request.post(`${API_BASE}/v1/lock`, {
      data: {
        chain_id: 11155111,
        asset: 'ETH',
        // amount missing
        dest_addr: hexBytes(20),
        pk_dilithium: hexBytes(ML_DSA_65_PK_BYTES),
        sig_dilithium: hexBytes(ML_DSA_65_SIG_BYTES),
        expiry: Math.floor(Date.now() / 1000) + 86400,
        nonce: uniqueNonce(),
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
      const payload = signLock({
        chain_id: 11155111,
        asset: 'ETH',
        amount: `${(i + 1) * 100000000000000000}`,
        dest_addr: hexBytes(20),
        expiry: Math.floor(Date.now() / 1000) + 86400 * 7,
        nonce: uniqueNonce() + i,
      });
      const res = await request.post(`${API_BASE}/v1/lock`, { data: payload });
      expect(res.status()).toBe(200);
      locks.push(await res.json());
    }

    const lockIds = locks.map((l) => l.lock_id);
    expect(new Set(lockIds).size).toBe(3);

    const sr0s = locks.map((l) => l.sr_0);
    expect(new Set(sr0s).size).toBe(3);

    console.log(`[Multi-Lock] 3 distinct locks created: ${lockIds.join(', ')}`);
  });
});
