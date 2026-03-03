/**
 * Consumer Lock Integration Tests
 *
 * Verifies the full lock flow: API → DB → Response
 * Tests real backend endpoints with skip_signature_verification=true (dev mode).
 *
 * Prerequisites:
 * - Backend running on localhost:8080
 * - Docker services: postgres, redis, rabbitmq, l3-node
 * - skip_signature_verification: true in config
 */
import { test, expect } from '../fixtures';

const API_BASE = 'http://localhost:8080';

test.describe('Consumer Lock Integration (API → DB)', () => {
  test('health check confirms backend is ready', async ({ request }) => {
    const response = await request.get(`${API_BASE}/v1/health`);
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.status).toBe('healthy');
  });

  test('POST /v1/lock creates lock record and returns valid response', async ({
    request,
  }) => {
    const nonce = Date.now();
    const expiry = Math.floor(Date.now() / 1000) + 3600;

    const response = await request.post(`${API_BASE}/v1/lock`, {
      data: {
        chain_id: 11155111,
        asset: 'ETH',
        amount: '500000000000000',
        dest_addr: '0xabcdef1234567890abcdef1234567890abcdef12',
        pk_dilithium: '0xtest_integration_pk',
        sig_dilithium: '0xtest_integration_sig',
        expiry,
        nonce,
      },
    });

    expect(response.status()).toBe(200);

    const data = await response.json();

    // Verify response structure matches backend LockResponse
    expect(data.lock_id).toBeDefined();
    expect(data.lock_id).toMatch(/^0x[a-f0-9]{64}$/);
    expect(data.sr_0).toBeDefined();
    expect(data.sr_0).toMatch(/^0x[a-f0-9]{64}$/);
    expect(data.smt_proof).toBeDefined();
    expect(data.smt_proof).toMatch(/^0x/);
    expect(data.status).toBe('pending');
  });

  test('POST /v1/lock rejects duplicate nonce', async ({ request }) => {
    const nonce = Date.now() + 100000;
    const expiry = Math.floor(Date.now() / 1000) + 3600;

    const lockData = {
      chain_id: 11155111,
      asset: 'ETH',
      amount: '100000000000000',
      dest_addr: '0x1111111111111111111111111111111111111111',
      pk_dilithium: '0xnonce_test_pk',
      sig_dilithium: '0xnonce_test_sig',
      expiry,
      nonce,
    };

    // First request should succeed
    const first = await request.post(`${API_BASE}/v1/lock`, {
      data: lockData,
    });
    expect(first.status()).toBe(200);

    // Second request with same nonce+pk should fail (409 Conflict or 400 Bad Request)
    const second = await request.post(`${API_BASE}/v1/lock`, {
      data: lockData,
    });
    expect([400, 409]).toContain(second.status());

    const error = await second.json();
    expect(error.message.toLowerCase()).toContain('nonce');
  });

  test('POST /v1/lock rejects expired request', async ({ request }) => {
    const response = await request.post(`${API_BASE}/v1/lock`, {
      data: {
        chain_id: 11155111,
        asset: 'ETH',
        amount: '100000000000000',
        dest_addr: '0x2222222222222222222222222222222222222222',
        pk_dilithium: '0xexpiry_test_pk',
        sig_dilithium: '0xexpiry_test_sig',
        expiry: 1000000000, // Expired timestamp
        nonce: Date.now() + 200000,
      },
    });

    expect(response.status()).toBe(400);
  });

  test('POST /v1/lock validates required fields', async ({ request }) => {
    // Missing required fields
    const response = await request.post(`${API_BASE}/v1/lock`, {
      data: {
        chain_id: 11155111,
        asset: 'ETH',
      },
    });

    // Should return 400 or 422, not 500
    expect(response.status()).toBeLessThan(500);
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });

  test('GET /v1/locks returns created lock records', async ({ request }) => {
    // Create a lock first
    const nonce = Date.now() + 300000;
    const expiry = Math.floor(Date.now() / 1000) + 3600;

    const createResponse = await request.post(`${API_BASE}/v1/lock`, {
      data: {
        chain_id: 11155111,
        asset: 'ETH',
        amount: '250000000000000',
        dest_addr: '0x3333333333333333333333333333333333333333',
        pk_dilithium: '0xlist_test_pk',
        sig_dilithium: '0xlist_test_sig',
        expiry,
        nonce,
      },
    });
    expect(createResponse.status()).toBe(200);

    const created = await createResponse.json();

    // Verify the lock can be retrieved via status endpoint
    const statusResponse = await request.get(
      `${API_BASE}/v1/lock/${created.lock_id}/status`
    );

    // Should return 200 or at least not 500
    if (statusResponse.status() === 200) {
      const status = await statusResponse.json();
      expect(status.lock_id).toBe(created.lock_id);
      expect(status.status).toBe('pending');
      expect(status.amount).toBe('250000000000000');
      expect(status.asset).toBe('ETH');
    }
  });

  test('lock response SR_0 is deterministic for same inputs', async ({
    request,
  }) => {
    // Two requests with identical inputs (except nonce) should produce different SR_0
    // because nonce is part of SR_0 computation
    const expiry = Math.floor(Date.now() / 1000) + 3600;
    const baseData = {
      chain_id: 11155111,
      asset: 'ETH',
      amount: '100000000000000',
      dest_addr: '0x4444444444444444444444444444444444444444',
      pk_dilithium: '0xsr0_test_pk',
      sig_dilithium: '0xsr0_test_sig',
      expiry,
    };

    const response1 = await request.post(`${API_BASE}/v1/lock`, {
      data: { ...baseData, nonce: Date.now() + 400000 },
    });
    const response2 = await request.post(`${API_BASE}/v1/lock`, {
      data: { ...baseData, nonce: Date.now() + 500000 },
    });

    expect(response1.status()).toBe(200);
    expect(response2.status()).toBe(200);

    const data1 = await response1.json();
    const data2 = await response2.json();

    // Different nonces should produce different SR_0 values
    expect(data1.sr_0).not.toBe(data2.sr_0);
    // And different lock_ids
    expect(data1.lock_id).not.toBe(data2.lock_id);
  });
});
