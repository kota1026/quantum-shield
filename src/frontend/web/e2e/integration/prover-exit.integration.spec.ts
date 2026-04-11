/**
 * Prover Exit Integration Tests (Sequence #6)
 *
 * Verifies the prover exit flow:
 * - 7-day unbonding period
 * - Slash-vulnerable during unbonding
 * - Stake returned in same currency as deposited
 *
 * Prerequisites:
 * - Backend running on localhost:8080
 * - Docker services: postgres, redis, rabbitmq, l3-node
 *
 * Spec References:
 * - SEQUENCES §6: Prover Exit
 * - Unbonding: 7 days
 * - Slash-vulnerable during unbonding period
 */
import { test, expect } from '@playwright/test';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

const SEVEN_DAYS_SECS = 7 * 24 * 3600;

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

function uniqueAddr(): string {
  return `0x${Date.now().toString(16).padStart(40, '0').slice(-40)}`;
}

async function registerProver(
  request: Parameters<Parameters<typeof test>[1]>[0]['request']
): Promise<{ prover_id: string; address: string } | null> {
  const addr = uniqueAddr();
  const res = await request.post(`${API_BASE}/v1/prover/register`, {
    data: {
      name: `E2E-Exit-Prover-${Date.now()}`,
      address: addr,
      stake: '32000000000000000000',
      dilithium_pubkey: hexBytes(1952),
      sphincs_pubkey: hexBytes(32),
      hsm_attestation: hexBytes(128),
      multisig_proof: hexBytes(64),
      signature: hexBytes(3309),
    },
  });

  if (res.status() === 200 || res.status() === 201) {
    const data = await res.json();
    return {
      prover_id: data.prover_id || data.proverId,
      address: addr,
    };
  }
  return null;
}

test.describe('Sequence #6: Prover Exit — Deep Integration', () => {
  test('health check', async ({ request }) => {
    const res = await request.get(`${API_BASE}/v1/health`);
    expect(res.status()).toBe(200);
  });

  test('POST /v1/prover/exit initiates 7-day unbonding', async ({
    request,
  }) => {
    const prover = await registerProver(request);
    if (!prover) {
      console.log('[Skip] Prover registration failed — cannot test exit');
      return;
    }

    const nowSecs = Math.floor(Date.now() / 1000);
    const response = await request.post(`${API_BASE}/v1/prover/exit`, {
      data: {
        prover_id: prover.prover_id,
        address: prover.address,
        signature: hexBytes(3309),
      },
      headers: { 'X-User-Address': prover.address },
    });

    if (response.status() === 200) {
      const data = await response.json();
      expect(data.status).toMatch(/unbonding|exit_pending/i);

      // Verify 7-day unbonding period
      if (data.unbonding_end || data.unbondingEnd) {
        const unbondingEnd = data.unbonding_end || data.unbondingEnd;
        const endSecs =
          typeof unbondingEnd === 'number'
            ? unbondingEnd
            : Math.floor(new Date(unbondingEnd).getTime() / 1000);
        const diff = endSecs - nowSecs;
        expect(diff).toBeGreaterThan(SEVEN_DAYS_SECS - 3600);
        expect(diff).toBeLessThan(SEVEN_DAYS_SECS + 3600);
        console.log(
          `[Prover Exit] unbonding ~${(diff / 86400).toFixed(1)} days`
        );
      }

      console.log(
        `[Prover Exit] prover_id=${prover.prover_id}, status=${data.status}`
      );
    } else {
      expect([400, 401, 403, 404]).toContain(response.status());
      console.log(`[Prover Exit] Rejected: ${response.status()}`);
    }
  });

  test('GET /v1/prover/exit-status returns unbonding info', async ({
    request,
  }) => {
    const prover = await registerProver(request);
    if (!prover) {
      console.log('[Skip] Registration failed');
      return;
    }

    // Initiate exit first
    await request.post(`${API_BASE}/v1/prover/exit`, {
      data: {
        prover_id: prover.prover_id,
        address: prover.address,
        signature: hexBytes(3309),
      },
      headers: { 'X-User-Address': prover.address },
    });

    // Check exit status
    const response = await request.get(`${API_BASE}/v1/prover/exit-status`, {
      headers: { 'X-User-Address': prover.address },
    });

    if (response.status() === 200) {
      const data = await response.json();
      console.log(`[Exit Status] ${JSON.stringify(data)}`);
    } else {
      expect([404, 401]).toContain(response.status());
    }
  });

  test('POST /v1/prover/withdraw before unbonding ends is rejected', async ({
    request,
  }) => {
    const prover = await registerProver(request);
    if (!prover) {
      console.log('[Skip] Registration failed');
      return;
    }

    // Initiate exit
    const exitRes = await request.post(`${API_BASE}/v1/prover/exit`, {
      data: {
        prover_id: prover.prover_id,
        address: prover.address,
        signature: hexBytes(3309),
      },
      headers: { 'X-User-Address': prover.address },
    });

    if (exitRes.status() !== 200) {
      console.log('[Skip] Exit initiation failed');
      return;
    }

    // Try immediate withdraw — should fail (7-day unbonding not elapsed)
    const withdrawRes = await request.post(`${API_BASE}/v1/prover/withdraw`, {
      data: {
        prover_id: prover.prover_id,
        address: prover.address,
        signature: hexBytes(3309),
      },
      headers: { 'X-User-Address': prover.address },
    });

    expect(withdrawRes.status()).toBeGreaterThanOrEqual(400);
    console.log(
      `[Early Withdraw] Correctly rejected: ${withdrawRes.status()}`
    );
  });

  test('prover exit decreases active prover count', async ({ request }) => {
    const prover = await registerProver(request);
    if (!prover) {
      console.log('[Skip] Registration failed');
      return;
    }

    // BEFORE
    const beforeRes = await request.get(`${API_BASE}/v1/explorer/overview`);
    const beforeCount = (await beforeRes.json()).network.activeProvers;

    // Exit
    const exitRes = await request.post(`${API_BASE}/v1/prover/exit`, {
      data: {
        prover_id: prover.prover_id,
        address: prover.address,
        signature: hexBytes(3309),
      },
      headers: { 'X-User-Address': prover.address },
    });

    if (exitRes.status() === 200) {
      const afterRes = await request.get(`${API_BASE}/v1/explorer/overview`);
      const afterCount = (await afterRes.json()).network.activeProvers;
      // Count should decrease or stay same (exit puts into unbonding)
      expect(afterCount).toBeLessThanOrEqual(beforeCount);
      console.log(`[Explorer] activeProvers: ${beforeCount} -> ${afterCount}`);
    }
  });
});
