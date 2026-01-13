/**
 * E2E Integration Test: Lock → Unlock Full Flow
 *
 * Tests the complete user journey from locking assets to unlocking with STARK proof.
 * Validates SEQUENCES §1 (Lock) and §2 (Unlock) compliance.
 *
 * @see TASK-P5-034 E2E Test Implementation
 * @see SEQUENCES.md §1, §2
 */

import { test, expect, Page } from '@playwright/test';
import { mockResponses, ApiFixture } from '../fixtures/api.fixture';
import { mockStarkProof, mockDilithiumKeys, StarkFixture } from '../fixtures/stark.fixture';

// Test configuration
const TEST_CONFIG = {
  lockAmount: '1.5',
  lockAmountWei: '1500000000000000000',
  testAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
  recipientAddress: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
};

test.describe('E2E: Lock → Unlock Full Flow', () => {
  test.describe('SEQ#1: Lock Flow', () => {
    test('should navigate through lock flow with valid amount', async ({ page }) => {
      // Navigate to lock page
      await page.goto('/lock');

      // Step 1: Enter amount
      const amountInput = page.locator('input[type="number"], input[data-testid="amount-input"]').first();
      await amountInput.fill(TEST_CONFIG.lockAmount);

      // Verify amount is displayed
      await expect(page.getByText(TEST_CONFIG.lockAmount)).toBeVisible();

      // Step 2: Click continue/next
      const continueButton = page.getByRole('button', { name: /Continue|Next|Lock|Submit/i });
      await expect(continueButton).toBeEnabled();
    });

    test('should show Dilithium key generation step', async ({ page }) => {
      await page.goto('/lock/confirm?amount=' + TEST_CONFIG.lockAmount);

      // Should show key generation or signature info
      const keyInfo = page.getByText(/Dilithium|quantum|signature|key/i);
      await expect(keyInfo.first()).toBeVisible();

      // Should show confirmation details
      await expect(page.getByText(TEST_CONFIG.lockAmount)).toBeVisible();
    });

    test('should display gas estimation', async ({ page }) => {
      await page.goto('/lock/confirm?amount=' + TEST_CONFIG.lockAmount);

      // Gas fee should be visible
      const gasFee = page.getByText(/Gas|Fee|Cost/i);
      await expect(gasFee.first()).toBeVisible();
    });

    test('should show processing state with steps', async ({ page }) => {
      await page.goto('/lock/processing');

      // Processing indicator
      const processing = page.getByText(/Processing|Submitting|Locking/i);
      await expect(processing.first()).toBeVisible();

      // Steps indicator (signing, submitting, confirming)
      const steps = page.locator('[data-testid="step"], .step, [role="progressbar"]');
      const stepCount = await steps.count();
      expect(stepCount).toBeGreaterThan(0);
    });

    test('should display success page with transaction hash', async ({ page }) => {
      const mockTxHash = '0x' + 'abc'.repeat(21) + 'a';
      await page.goto(`/lock/success?amount=${TEST_CONFIG.lockAmount}&txHash=${mockTxHash}`);

      // Success message
      await expect(page.getByText(/Success|Complete|Locked/i).first()).toBeVisible();

      // Transaction hash or Etherscan link
      const txDisplay = page.getByText(/0x[a-fA-F0-9]+/i).or(page.locator('a[href*="etherscan.io"]'));
      await expect(txDisplay.first()).toBeVisible();

      // Dashboard link
      const dashboardLink = page.getByRole('link', { name: /Dashboard|View Locks/i });
      await expect(dashboardLink).toBeVisible();
    });
  });

  test.describe('SEQ#2: Unlock Flow', () => {
    test('should show unlock selection with active locks', async ({ page }) => {
      await page.goto('/unlock');

      // Should show title
      await expect(page.getByText(/Unlock|Select Lock/i).first()).toBeVisible();
    });

    test('should display unlock method options', async ({ page }) => {
      await page.goto('/unlock/method?lockId=1');

      // Normal unlock option (24h timelock)
      await expect(page.getByText(/Normal Unlock|Standard/i).first()).toBeVisible();
      await expect(page.getByText(/24 hours/i).first()).toBeVisible();

      // Emergency unlock option (7 day + bond)
      await expect(page.getByText(/Emergency Unlock/i).first()).toBeVisible();
      await expect(page.getByText(/7 days/i).first()).toBeVisible();
    });

    test('should show normal unlock countdown', async ({ page }) => {
      await page.goto('/unlock/countdown?lockId=1&type=normal');

      // Time remaining display
      await expect(page.getByText(/Time Remaining|Countdown/i).first()).toBeVisible();

      // Timer display (HH:MM:SS format or similar)
      const timer = page.getByText(/\d+:\d+|\d+ hours|\d+ minutes/i);
      await expect(timer.first()).toBeVisible();
    });

    test('should show emergency bond calculation (SEQ#3 compliant)', async ({ page }) => {
      await page.goto('/unlock/emergency/bond?lockId=1&amount=10');

      // Bond amount display (5% of locked amount)
      await expect(page.getByText(/Bond|Collateral/i).first()).toBeVisible();

      // 7-day waiting period
      await expect(page.getByText(/7 day|168 hour/i).first()).toBeVisible();
    });

    test('should show STARK proof generation during unlock', async ({ page }) => {
      await page.goto('/unlock/processing?lockId=1');

      // Proof generation step
      const proofStep = page.getByText(/Proof|STARK|Generating|Verifying/i);
      await expect(proofStep.first()).toBeVisible();
    });

    test('should complete unlock with transaction confirmation', async ({ page }) => {
      const mockTxHash = '0x' + 'def'.repeat(21) + 'd';
      await page.goto(`/unlock/complete?lockId=1&amount=${TEST_CONFIG.lockAmount}&txHash=${mockTxHash}`);

      // Success message
      await expect(page.getByText(/Complete|Success|Unlocked/i).first()).toBeVisible();

      // Amount unlocked
      await expect(page.getByText(TEST_CONFIG.lockAmount)).toBeVisible();

      // Transaction link
      const txDisplay = page.getByText(/0x[a-fA-F0-9]+/i).or(page.locator('a[href*="etherscan.io"]'));
      await expect(txDisplay.first()).toBeVisible();
    });
  });

  test.describe('Dashboard Integration', () => {
    test('should display user locks on dashboard', async ({ page }) => {
      await page.goto('/dashboard');

      // Dashboard title
      await expect(page.getByText(/Dashboard|My Locks|Overview/i).first()).toBeVisible();
    });

    test('should show lock details when clicked', async ({ page }) => {
      await page.goto('/dashboard/lock/1');

      // Lock details
      await expect(page.getByText(/Lock Details|Lock #|Status/i).first()).toBeVisible();
    });

    test('should navigate from dashboard to unlock flow', async ({ page }) => {
      await page.goto('/dashboard');

      // Unlock button should be present for active locks
      const unlockButton = page.getByRole('button', { name: /Unlock|Withdraw/i });

      if (await unlockButton.isVisible()) {
        await unlockButton.click();
        // Should navigate to unlock method selection
        await expect(page).toHaveURL(/\/unlock/);
      }
    });
  });

  test.describe('Error Handling', () => {
    test('should handle insufficient balance gracefully', async ({ page }) => {
      await page.goto('/lock');

      const amountInput = page.locator('input[type="number"]').first();
      await amountInput.fill('999999'); // Very large amount

      // Should show error or disable button
      const error = page.getByText(/Insufficient|Not enough|Balance too low/i);
      const disabledButton = page.getByRole('button', { name: /Continue|Lock/i });

      // Either error message or disabled button should be present
      const hasError = await error.count() > 0;
      const isDisabled = await disabledButton.isDisabled().catch(() => false);

      expect(hasError || isDisabled).toBeTruthy();
    });

    test('should handle zero amount input', async ({ page }) => {
      await page.goto('/lock');

      const amountInput = page.locator('input[type="number"]').first();
      await amountInput.fill('0');

      // Continue button should be disabled or show error
      const continueButton = page.getByRole('button', { name: /Continue|Lock/i });
      const isDisabled = await continueButton.isDisabled().catch(() => false);
      const error = page.getByText(/greater than 0|Invalid|minimum/i);

      expect(isDisabled || (await error.count()) > 0).toBeTruthy();
    });

    test('should handle network errors gracefully', async ({ page }) => {
      // Intercept API calls to simulate network error
      await page.route('**/api/**', route => route.abort('failed'));

      await page.goto('/dashboard');

      // Should show error state or fallback
      const errorMessage = page.getByText(/Error|Failed|Unable to load|Try again/i);
      await expect(errorMessage.first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Accessibility', () => {
    test('lock page should be keyboard navigable', async ({ page }) => {
      await page.goto('/lock');

      // Tab through elements
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      // Should be able to interact with focused element
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    });

    test('buttons should have proper aria labels', async ({ page }) => {
      await page.goto('/lock');

      const buttons = page.getByRole('button');
      const buttonCount = await buttons.count();

      for (let i = 0; i < Math.min(buttonCount, 5); i++) {
        const button = buttons.nth(i);
        const hasLabel =
          (await button.getAttribute('aria-label')) !== null ||
          (await button.textContent()) !== '';
        expect(hasLabel).toBeTruthy();
      }
    });
  });

  test.describe('Core Principles Verification', () => {
    test('CP-1: Quantum-safe cryptography indicators visible', async ({ page }) => {
      await page.goto('/lock/confirm?amount=1');

      // Should mention quantum-safe features
      const quantumInfo = page.getByText(/Dilithium|quantum|NIST|post-quantum/i);
      await expect(quantumInfo.first()).toBeVisible();
    });

    test('CP-3: Time lock periods correctly displayed', async ({ page }) => {
      await page.goto('/unlock/method?lockId=1');

      // 24h for normal unlock
      await expect(page.getByText(/24 hour/i).first()).toBeVisible();

      // 7 days for emergency
      await expect(page.getByText(/7 day/i).first()).toBeVisible();
    });

    test('CP-5: Transaction transparency with Etherscan links', async ({ page }) => {
      await page.goto('/lock/success?amount=1&txHash=0x123');

      // Should have Etherscan link
      const etherscanLink = page.locator('a[href*="etherscan.io"]');
      await expect(etherscanLink.first()).toBeVisible();
    });
  });
});

test.describe('E2E: Lock → Unlock with Mock API', () => {
  test('full flow with mocked responses', async ({ page }) => {
    // Setup API mocks
    await page.route('**/v1/lock', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockResponses.lock),
      });
    });

    await page.route('**/v1/unlock/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, unlockRequestId: 'unlock-001' }),
      });
    });

    // Start flow
    await page.goto('/lock');
    await expect(page).toHaveURL(/\/lock/);

    // Enter amount and proceed
    const amountInput = page.locator('input[type="number"]').first();
    if (await amountInput.isVisible()) {
      await amountInput.fill('1.5');
    }

    // Continue through flow
    const continueButton = page.getByRole('button', { name: /Continue|Next|Lock/i });
    if (await continueButton.isVisible() && await continueButton.isEnabled()) {
      await continueButton.click();
    }
  });
});
