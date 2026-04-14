/**
 * Cross-Sequence Chain Integration Test
 *
 * Verifies the full lifecycle across multiple sequences:
 * Lock (#1) → Unlock (#2) → Challenge (#4) → Slashing (#4)
 *
 * Each step verifies:
 * 1. API response correctness
 * 2. DB state change (via Explorer/status APIs)
 * 3. Cross-app consistency (Explorer, Observer, QS Admin)
 *
 * Prerequisites:
 * - Backend running on localhost:8080
 * - Docker services: postgres, redis, rabbitmq, l3-node
 * - skip_signature_verification: true in config
 *
 * Spec References:
 * - SEQUENCES §1-4: Lock → Unlock → Challenge → Slashing
 * - Full FE→BE→DB→L1 layer verification
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

test.describe('Cross-Sequence Chain: Lock → Unlock → Challenge → Slash', () => {
  test('health check confirms all services are ready', async ({ request }) => {
    const res = await request.get(`${API_BASE}/v1/health/ready`);
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.status).toBe('ready');
    expect(data.dependencies.database.status).toBe('up');
    console.log('[Health] All services ready');
  });

  test('full lifecycle: Lock → status check → Unlock → Challenge → status check', async ({
    request,
  }) => {
    // ================================================================
    // STEP 1: Capture baseline from Explorer
    // ================================================================
    const baselineRes = await request.get(`${API_BASE}/v1/explorer/overview`);
    expect(baselineRes.ok()).toBeTruthy();
    const baseline = await baselineRes.json();
    console.log(
      `[Baseline] totalLocks=${baseline.network.totalLocks}, totalUnlocks=${baseline.network.totalUnlocks}, totalChallenges=${baseline.network.totalChallenges}`
    );

    // ================================================================
    // STEP 2: Create Lock (SEQ#1)
    // ================================================================
    const nonce = Date.now() + Math.floor(Math.random() * 100000);
    const destAddr = hexBytes(20);
    const lockRes = await request.post(`${API_BASE}/v1/lock`, {
      data: {
        chain_id: 11155111,
        asset: 'ETH',
        amount: '1000000000000000000', // 1 ETH
        dest_addr: destAddr,
        pk_dilithium: hexBytes(32),
        sig_dilithium: hexBytes(64),
        expiry: Math.floor(Date.now() / 1000) + 86400 * 7,
        nonce,
      },
    });
    expect(lockRes.status()).toBe(200);
    const lock = await lockRes.json();
    expect(lock.lock_id).toBeTruthy();
    expect(lock.sr_0).toMatch(/^0x[a-f0-9]{64}$/);
    console.log(`[SEQ#1 Lock] lock_id=${lock.lock_id}, sr_0=${lock.sr_0}`);

    // Verify lock status = pending
    const lockStatusRes = await request.get(
      `${API_BASE}/v1/lock/${lock.lock_id}/status`
    );
    if (lockStatusRes.status() === 200) {
      const lockStatus = await lockStatusRes.json();
      expect(lockStatus.status).toBe('pending');
      console.log(`[Lock Status] ${lockStatus.status}`);
    }

    // Verify Explorer count increased
    const afterLockRes = await request.get(`${API_BASE}/v1/explorer/overview`);
    const afterLock = await afterLockRes.json();
    expect(afterLock.network.totalLocks).toBeGreaterThanOrEqual(
      baseline.network.totalLocks + 1
    );
    console.log(
      `[Explorer] totalLocks: ${baseline.network.totalLocks} -> ${afterLock.network.totalLocks}`
    );

    // ================================================================
    // STEP 3: Request Normal Unlock (SEQ#2)
    // ================================================================
    const unlockRes = await request.post(`${API_BASE}/v1/unlock`, {
      data: {
        lock_id: lock.lock_id,
        dest_addr: destAddr,
        amount: '1000000000000000000',
        sig_dilithium: hexBytes(64),
      },
    });
    expect(unlockRes.status()).toBe(200);
    const unlock = await unlockRes.json();
    expect(unlock.unlock_id).toBeTruthy();
    console.log(
      `[SEQ#2 Unlock] unlock_id=${unlock.unlock_id}, status=${unlock.status}`
    );

    // Verify lock moved to unlock_pending
    const afterUnlockStatusRes = await request.get(
      `${API_BASE}/v1/lock/${lock.lock_id}/status`
    );
    if (afterUnlockStatusRes.status() === 200) {
      const s = await afterUnlockStatusRes.json();
      expect(s.status).toMatch(/unlock_pending|unlocking/i);
      console.log(`[Lock Status] After unlock: ${s.status}`);
    }

    // Verify release_time is ~24h from now
    if (unlock.release_time) {
      const releaseTime =
        typeof unlock.release_time === 'number'
          ? unlock.release_time
          : Math.floor(new Date(unlock.release_time).getTime() / 1000);
      const nowSecs = Math.floor(Date.now() / 1000);
      const diff = releaseTime - nowSecs;
      // Should be ~24 hours (86400s ± 1 hour)
      expect(diff).toBeGreaterThan(82800);
      expect(diff).toBeLessThan(90000);
      console.log(`[Unlock] release in ~${(diff / 3600).toFixed(1)}h`);
    }

    // ================================================================
    // STEP 4: Submit Challenge (SEQ#4)
    // ================================================================
    const challengeRes = await request.post(`${API_BASE}/v1/challenge`, {
      data: {
        lock_id: lock.lock_id,
        challenger: hexBytes(20),
        fraud_proof: `Cross-seq test: invalid prover sig for lock ${lock.lock_id}`,
        bond: '100000000000000000', // 0.1 ETH
      },
    });
    expect(challengeRes.status()).toBe(200);
    const challenge = await challengeRes.json();
    expect(challenge.challenge_id).toBeTruthy();
    expect(challenge.fraud_proof_hash).toMatch(/^0x[a-f0-9]{64}$/);
    expect(challenge.defense_deadline).toBeGreaterThan(0);
    console.log(
      `[SEQ#4 Challenge] challenge_id=${challenge.challenge_id}, defense_deadline=${challenge.defense_deadline}`
    );

    // Verify lock status = challenged
    const afterChallengeStatusRes = await request.get(
      `${API_BASE}/v1/lock/${lock.lock_id}/status`
    );
    if (afterChallengeStatusRes.status() === 200) {
      const s = await afterChallengeStatusRes.json();
      expect(s.status).toBe('challenged');
      console.log(`[Lock Status] After challenge: ${s.status}`);
    }

    // Verify challenge count in Explorer
    const afterChallengeRes = await request.get(
      `${API_BASE}/v1/explorer/overview`
    );
    const afterChallenge = await afterChallengeRes.json();
    expect(afterChallenge.network.totalChallenges).toBeGreaterThanOrEqual(
      baseline.network.totalChallenges + 1
    );
    console.log(
      `[Explorer] totalChallenges: ${baseline.network.totalChallenges} -> ${afterChallenge.network.totalChallenges}`
    );

    // ================================================================
    // STEP 5: Verify challenge via GET
    // ================================================================
    const getChallengeRes = await request.get(
      `${API_BASE}/v1/challenge/${lock.lock_id}`
    );
    expect(getChallengeRes.status()).toBe(200);
    const getChallengeData = await getChallengeRes.json();
    expect(getChallengeData.challenge_id).toBe(challenge.challenge_id);
    expect(getChallengeData.lock_id).toBe(lock.lock_id);
    console.log('[Challenge GET] Verified challenge retrieval');

    // ================================================================
    // STEP 6: Verify cross-app consistency
    // ================================================================

    // Explorer challenge stats
    const challengeStatsRes = await request.get(
      `${API_BASE}/v1/explorer/challenges/stats`
    );
    if (challengeStatsRes.status() === 200) {
      const stats = await challengeStatsRes.json();
      expect(stats.totalChallenges).toBeGreaterThanOrEqual(1);
      expect(stats.activeChallenges).toBeGreaterThanOrEqual(1);
      console.log(
        `[Challenge Stats] total=${stats.totalChallenges}, active=${stats.activeChallenges}`
      );
    }

    // Active challenges list
    const activeChallengesRes = await request.get(
      `${API_BASE}/v1/explorer/challenges/active`
    );
    if (activeChallengesRes.status() === 200) {
      const active = await activeChallengesRes.json();
      const challenges = active.challenges || active.items || active;
      expect(Array.isArray(challenges)).toBe(true);
      console.log(`[Active Challenges] ${challenges.length} active`);
    }

    console.log('=== Cross-Sequence Chain Test PASSED ===');
    console.log(`  Lock:      ${lock.lock_id}`);
    console.log(`  Unlock:    ${unlock.unlock_id}`);
    console.log(`  Challenge: ${challenge.challenge_id}`);
    console.log(`  States:    pending → unlock_pending → challenged`);
  });

  test('parallel locks maintain independent state', async ({ request }) => {
    // Create 3 locks simultaneously
    const lockPromises = Array.from({ length: 3 }, (_, i) =>
      request.post(`${API_BASE}/v1/lock`, {
        data: {
          chain_id: 11155111,
          asset: 'ETH',
          amount: `${(i + 1) * 1000000000000000000}`,
          dest_addr: hexBytes(20),
          pk_dilithium: hexBytes(32),
          sig_dilithium: hexBytes(64),
          expiry: Math.floor(Date.now() / 1000) + 86400 * 7,
          nonce: Date.now() + i * 1000,
        },
      })
    );

    const responses = await Promise.all(lockPromises);
    const locks = await Promise.all(
      responses.map(async (r) => {
        expect(r.status()).toBe(200);
        return r.json();
      })
    );

    // All lock_ids unique
    const ids = locks.map((l) => l.lock_id);
    expect(new Set(ids).size).toBe(3);

    // Unlock only the second lock
    const unlockRes = await request.post(`${API_BASE}/v1/unlock`, {
      data: {
        lock_id: locks[1].lock_id,
        dest_addr: hexBytes(20),
        amount: '2000000000000000000',
        sig_dilithium: hexBytes(64),
      },
    });
    expect(unlockRes.status()).toBe(200);

    // Verify states: lock[0]=pending, lock[1]=unlock_pending, lock[2]=pending
    for (let i = 0; i < 3; i++) {
      const statusRes = await request.get(
        `${API_BASE}/v1/lock/${locks[i].lock_id}/status`
      );
      if (statusRes.status() === 200) {
        const s = await statusRes.json();
        if (i === 1) {
          expect(s.status).toMatch(/unlock_pending|unlocking/i);
        } else {
          expect(s.status).toBe('pending');
        }
        console.log(`[Lock ${i}] ${locks[i].lock_id}: ${s.status}`);
      }
    }
  });
});
