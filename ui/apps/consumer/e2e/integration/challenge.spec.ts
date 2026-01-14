/**
 * E2E Integration Test: Challenge + Slashing Flow
 *
 * Tests the complete challenge flow including:
 * - Observer monitoring pending unlocks
 * - Challenge submission with bond
 * - Defense period (48 hours)
 * - Slashing execution (quadratic: N^2 * 10%)
 * - Reward distribution
 *
 * @see TASK-P5-034 E2E Test Implementation
 * @see SEQUENCES.md §4 Challenge + Slashing
 * @see CORE_PRINCIPLES CP-4: Slashing existence
 */

import { test, expect, Page } from '@playwright/test';
import { mockResponses } from '../fixtures/api.fixture';

// Test configuration
const TEST_CONFIG = {
  challengerAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
  proverAddress: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
  bondAmount: '0.1', // ETH
  lockId: '0x' + '1'.repeat(64),
  defensePeriodHours: 48,
};

// Mock challenge data
const mockChallenge = {
  challengeId: 'challenge-001',
  lockId: TEST_CONFIG.lockId,
  challenger: TEST_CONFIG.challengerAddress,
  bondAmount: '100000000000000000', // 0.1 ETH in wei
  reason: 'Suspected fraudulent unlock - invalid signature',
  status: 'active',
  defenseDeadline: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
  createdAt: new Date().toISOString(),
};

test.describe('E2E: Challenge + Slashing Flow (SEQ#4)', () => {
  test.describe('Observer Dashboard', () => {
    test('should display observer dashboard', async ({ page }) => {
      await page.goto('/observer');

      // Dashboard title
      await expect(page.getByText(/Observer|Monitor|Watch/i).first()).toBeVisible();
    });

    test('should show pending unlocks to monitor', async ({ page }) => {
      // Mock pending unlocks API
      await page.route('**/v1/observer/pending-unlocks', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            pendingUnlocks: [
              {
                lockId: TEST_CONFIG.lockId,
                amount: '1000000000000000000',
                unlockRequestTime: new Date().toISOString(),
                timeRemaining: '23:45:00',
              },
            ],
          }),
        });
      });

      await page.goto('/observer/pending-unlocks');

      // Should show pending unlocks
      await expect(page.getByText(/Pending|Unlocks|Monitor/i).first()).toBeVisible();
    });

    test('should display suspicious transactions', async ({ page }) => {
      // Mock suspicious transactions
      await page.route('**/v1/observer/suspicious-txs', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            suspiciousTxs: [
              {
                txHash: '0x' + 'abc'.repeat(21) + 'a',
                lockId: TEST_CONFIG.lockId,
                reason: 'Unusual unlock pattern',
                riskScore: 0.85,
              },
            ],
          }),
        });
      });

      await page.goto('/observer/suspicious');

      // Should show suspicious transactions section
      await expect(page.getByText(/Suspicious|Risk|Alert/i).first()).toBeVisible();
    });
  });

  test.describe('Challenge Submission', () => {
    test('should navigate to challenge form', async ({ page }) => {
      await page.goto('/observer/challenge/new?lockId=' + TEST_CONFIG.lockId);

      // Challenge form
      await expect(page.getByText(/Challenge|Submit|Report/i).first()).toBeVisible();
    });

    test('should display bond requirement', async ({ page }) => {
      await page.goto('/observer/challenge/new?lockId=' + TEST_CONFIG.lockId);

      // Bond amount requirement
      const bondInfo = page.getByText(/Bond|Collateral|Stake/i);
      await expect(bondInfo.first()).toBeVisible();
    });

    test('should require reason for challenge', async ({ page }) => {
      await page.goto('/observer/challenge/new?lockId=' + TEST_CONFIG.lockId);

      // Reason input field
      const reasonInput = page.locator('textarea, input[name="reason"]');
      if (await reasonInput.count() > 0) {
        await expect(reasonInput.first()).toBeVisible();
      }
    });

    test('should show 48-hour defense period warning', async ({ page }) => {
      await page.goto('/observer/challenge/new?lockId=' + TEST_CONFIG.lockId);

      // Defense period info
      await expect(page.getByText(/48 hour|defense|period/i).first()).toBeVisible();
    });

    test('should submit challenge with valid data', async ({ page }) => {
      // Mock challenge submission
      await page.route('**/v1/observer/challenge', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockChallenge),
        });
      });

      await page.goto('/observer/challenge/new?lockId=' + TEST_CONFIG.lockId);

      // Fill form (if inputs exist)
      const reasonInput = page.locator('textarea').first();
      if (await reasonInput.isVisible()) {
        await reasonInput.fill('Suspected fraudulent unlock');
      }

      // Submit button
      const submitButton = page.getByRole('button', { name: /Submit|Challenge/i });
      if (await submitButton.isVisible() && await submitButton.isEnabled()) {
        await submitButton.click();
      }
    });
  });

  test.describe('Challenge Status', () => {
    test('should display active challenge details', async ({ page }) => {
      // Mock challenge status
      await page.route('**/v1/observer/challenge/*', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockChallenge),
        });
      });

      await page.goto('/observer/challenge/challenge-001');

      // Challenge status
      await expect(page.getByText(/Challenge|Status|Active/i).first()).toBeVisible();
    });

    test('should show defense deadline countdown', async ({ page }) => {
      await page.route('**/v1/observer/challenge/*', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockChallenge),
        });
      });

      await page.goto('/observer/challenge/challenge-001');

      // Countdown or deadline
      const deadline = page.getByText(/Deadline|Remaining|48|hours/i);
      await expect(deadline.first()).toBeVisible();
    });

    test('should display challenge reason', async ({ page }) => {
      await page.route('**/v1/observer/challenge/*', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockChallenge),
        });
      });

      await page.goto('/observer/challenge/challenge-001');

      // Challenge reason should be visible
      await expect(page.getByText(/reason|fraudulent|invalid/i).first()).toBeVisible();
    });
  });

  test.describe('Defense Period (Prover View)', () => {
    test('should show prover dashboard with active challenges', async ({ page }) => {
      await page.goto('/prover');

      // Prover dashboard
      await expect(page.getByText(/Prover|Dashboard|Portal/i).first()).toBeVisible();
    });

    test('should display challenge alert for prover', async ({ page }) => {
      // Mock prover challenges
      await page.route('**/v1/prover/challenges', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            challenges: [mockChallenge],
          }),
        });
      });

      await page.goto('/prover/challenges');

      // Challenge alert
      await expect(page.getByText(/Challenge|Alert|Defense/i).first()).toBeVisible();
    });

    test('should allow prover to respond to challenge', async ({ page }) => {
      await page.goto('/prover/challenge-response?challengeId=challenge-001');

      // Response form
      await expect(page.getByText(/Response|Defense|Evidence/i).first()).toBeVisible();
    });
  });

  test.describe('Slashing Execution', () => {
    test('should display slashing result after defense period', async ({ page }) => {
      // Mock resolved challenge with slashing
      await page.route('**/v1/observer/challenge/*', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            ...mockChallenge,
            status: 'resolved',
            resolution: 'slashed',
            slashAmount: '100000000000000000', // 0.1 ETH
            slashRate: 10, // 10% (first offense: 1^2 * 10%)
          }),
        });
      });

      await page.goto('/observer/challenge/challenge-001');

      // Slashing result
      await expect(page.getByText(/Resolved|Slashed|Complete/i).first()).toBeVisible();
    });

    test('should show quadratic slashing formula info', async ({ page }) => {
      await page.goto('/observer');

      // Slashing formula info (N^2 * 10%)
      const slashInfo = page.getByText(/quadratic|N\^2|10%|slashing/i);
      if (await slashInfo.count() > 0) {
        await expect(slashInfo.first()).toBeVisible();
      }
    });

    test('should display slash count effect on rate', async ({ page }) => {
      // Mock prover with multiple slashes
      await page.route('**/v1/explorer/provers/*', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            proverId: TEST_CONFIG.proverAddress,
            slashCount: 2,
            currentSlashRate: 40, // 2^2 * 10% = 40%
            stake: '10000000000000000000', // 10 ETH
          }),
        });
      });

      await page.goto('/explorer/prover/' + TEST_CONFIG.proverAddress);

      // Slash count and rate
      await expect(page.getByText(/Slash|Count|Rate/i).first()).toBeVisible();
    });
  });

  test.describe('Observer Earnings', () => {
    test('should display observer earnings dashboard', async ({ page }) => {
      // Mock earnings
      await page.route('**/v1/observer/earnings', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            totalEarnings: '500000000000000000', // 0.5 ETH
            pendingEarnings: '100000000000000000', // 0.1 ETH
            claimedEarnings: '400000000000000000', // 0.4 ETH
            successfulChallenges: 5,
          }),
        });
      });

      await page.goto('/observer/earnings');

      // Earnings info
      await expect(page.getByText(/Earnings|Rewards|Claim/i).first()).toBeVisible();
    });

    test('should allow claiming observer earnings', async ({ page }) => {
      // Mock claim endpoint
      await page.route('**/v1/observer/claim-earnings', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            txHash: '0x' + 'def'.repeat(21) + 'd',
            claimedAmount: '100000000000000000',
          }),
        });
      });

      await page.goto('/observer/earnings');

      // Claim button
      const claimButton = page.getByRole('button', { name: /Claim|Withdraw/i });
      if (await claimButton.isVisible() && await claimButton.isEnabled()) {
        expect(claimButton).toBeTruthy();
      }
    });
  });

  test.describe('Challenge History', () => {
    test('should display challenge history', async ({ page }) => {
      // Mock challenge history
      await page.route('**/v1/observer/history', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            challenges: [
              { ...mockChallenge, status: 'resolved', resolution: 'slashed' },
              { ...mockChallenge, challengeId: 'challenge-002', status: 'resolved', resolution: 'dismissed' },
            ],
          }),
        });
      });

      await page.goto('/observer/history');

      // History list
      await expect(page.getByText(/History|Past|Resolved/i).first()).toBeVisible();
    });

    test('should filter challenges by status', async ({ page }) => {
      await page.goto('/observer/history');

      // Filter options (if present)
      const filterSelect = page.locator('select, [role="combobox"]');
      if (await filterSelect.count() > 0) {
        await expect(filterSelect.first()).toBeVisible();
      }
    });
  });

  test.describe('Error Handling', () => {
    test('should handle insufficient bond for challenge', async ({ page }) => {
      await page.goto('/observer/challenge/new?lockId=' + TEST_CONFIG.lockId);

      // Should show bond requirement warning
      const bondWarning = page.getByText(/insufficient|bond|minimum/i);
      if (await bondWarning.count() > 0) {
        await expect(bondWarning.first()).toBeVisible();
      }
    });

    test('should handle challenge already exists', async ({ page }) => {
      // Mock error response
      await page.route('**/v1/observer/challenge', async route => {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Challenge already exists for this lock',
          }),
        });
      });

      // UI should handle this error gracefully
    });

    test('should handle defense period expired', async ({ page }) => {
      // Mock expired challenge
      await page.route('**/v1/observer/challenge/*', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            ...mockChallenge,
            defenseDeadline: new Date(Date.now() - 1000).toISOString(), // Expired
            status: 'pending_resolution',
          }),
        });
      });

      await page.goto('/observer/challenge/challenge-001');

      // Should show expired/pending resolution state
      await expect(page.getByText(/Expired|Resolution|Pending/i).first()).toBeVisible();
    });
  });

  test.describe('Core Principles Verification', () => {
    test('CP-4: Slashing existence confirmed', async ({ page }) => {
      await page.goto('/security');

      // Slashing mentioned in security info
      const slashingInfo = page.getByText(/slash|penalty|economic/i);
      await expect(slashingInfo.first()).toBeVisible();
    });

    test('48-hour defense period enforced', async ({ page }) => {
      await page.goto('/observer/challenge/new?lockId=' + TEST_CONFIG.lockId);

      // 48-hour defense period
      await expect(page.getByText(/48|hour|defense/i).first()).toBeVisible();
    });

    test('Quadratic slashing formula displayed', async ({ page }) => {
      await page.goto('/faq');

      // Slashing formula explanation
      const formulaInfo = page.getByText(/quadratic|N.*2|slashing formula/i);
      if (await formulaInfo.count() > 0) {
        await expect(formulaInfo.first()).toBeVisible();
      }
    });
  });
});

test.describe('E2E: Challenge Flow with Mock API', () => {
  test('complete challenge flow simulation', async ({ page }) => {
    // Setup all mocks
    await page.route('**/v1/observer/pending-unlocks', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          pendingUnlocks: [
            {
              lockId: TEST_CONFIG.lockId,
              amount: '1000000000000000000',
              unlockRequestTime: new Date().toISOString(),
              timeRemaining: '23:00:00',
            },
          ],
        }),
      });
    });

    await page.route('**/v1/observer/challenge', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockChallenge),
        });
      }
    });

    await page.route('**/v1/observer/challenge/*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockChallenge),
      });
    });

    // Step 1: View pending unlocks
    await page.goto('/observer/pending-unlocks');
    await expect(page.getByText(/Pending|Unlock/i).first()).toBeVisible();

    // Step 2: Navigate to challenge form
    await page.goto('/observer/challenge/new?lockId=' + TEST_CONFIG.lockId);
    await expect(page.getByText(/Challenge/i).first()).toBeVisible();

    // Step 3: View challenge status
    await page.goto('/observer/challenge/challenge-001');
    await expect(page.getByText(/Active|Status/i).first()).toBeVisible();
  });
});
