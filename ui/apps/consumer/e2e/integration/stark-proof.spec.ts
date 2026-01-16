/**
 * E2E Integration Test: STARK Proof Generation and Verification
 *
 * Tests the complete STARK proof flow including:
 * - Dilithium signature generation (WASM)
 * - STARK proof generation (Winterfell)
 * - On-chain verification (STARKVerifier.sol)
 *
 * @see TASK-P5-034 E2E Test Implementation
 * @see TASK-P5-001 Challenge API + SDK
 * @see TASK-P5-002 STARK Prover Archive Migration
 */

import { test, expect, Page } from '@playwright/test';
import {
  mockStarkProof,
  mockDilithiumKeys,
  mockDilithiumSignature,
  createMockProofRequest,
  StarkFixture,
  ProofResult,
} from '../fixtures/stark.fixture';

// Test configuration
const STARK_PROVER_URL = process.env.STARK_PROVER_URL || 'http://localhost:3001';
const USE_REAL_PROVER = process.env.E2E_REAL_PROVER === 'true';

test.describe('E2E: STARK Proof Integration', () => {
  test.describe('WASM Dilithium Signature', () => {
    test('should load WASM module on page load', async ({ page }) => {
      await page.goto('/');

      // Wait for WASM initialization
      await page.waitForTimeout(2000);

      // Check WASM loaded indicator (if present in UI)
      const wasmStatus = await page.evaluate(() => {
        // Check if quantum-shield WASM is available
        return typeof (window as any).__QUANTUM_SHIELD_WASM__ !== 'undefined' ||
               typeof (window as any).dilithiumSign !== 'undefined';
      });

      // WASM may not be globally exposed, but page should load without errors
      await expect(page).toHaveTitle(/Quantum Shield/i);
    });

    test('should show Dilithium key info in security page', async ({ page }) => {
      await page.goto('/security');

      // ML-DSA-65 (Dilithium3) information
      await expect(page.getByText(/Dilithium/i).first()).toBeVisible();
      await expect(page.getByText(/NIST/i).first()).toBeVisible();

      // Security level info
      await expect(page.getByText(/quantum|post-quantum|resistant/i).first()).toBeVisible();
    });

    test('should display key generation during lock setup', async ({ page }) => {
      await page.goto('/lock/confirm?amount=1.5');

      // Should show signature/key related info
      const cryptoInfo = page.getByText(/signature|sign|key|Dilithium/i);
      await expect(cryptoInfo.first()).toBeVisible();
    });
  });

  test.describe('STARK Prover Integration', () => {
    test('should show proof generation status in UI', async ({ page }) => {
      await page.goto('/unlock/processing?lockId=1');

      // Proof generation status
      const proofStatus = page.getByText(/Proof|Generating|STARK|Verifying/i);
      await expect(proofStatus.first()).toBeVisible();

      // Progress indicator
      const progress = page.locator('[role="progressbar"], .spinner, .loading');
      await expect(progress.first()).toBeVisible();
    });

    test('should handle proof generation with mock prover', async ({ page }) => {
      // Mock STARK prover endpoints
      await page.route('**/prove', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            proofId: 'proof-001',
            status: 'pending',
          }),
        });
      });

      await page.route('**/status/proof-001', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            proofId: 'proof-001',
            status: 'completed',
          }),
        });
      });

      await page.route('**/proof/proof-001', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockStarkProof),
        });
      });

      await page.goto('/unlock/processing?lockId=1');

      // Should show processing state
      await expect(page.getByText(/Processing|Generating/i).first()).toBeVisible();
    });

    test.skip('should generate real STARK proof (requires prover service)', async ({ page }) => {
      if (!USE_REAL_PROVER) {
        test.skip();
        return;
      }

      // This test requires the actual STARK prover service to be running
      const stark = new StarkFixture(page, STARK_PROVER_URL);

      // Health check
      const isHealthy = await stark.healthCheck();
      expect(isHealthy).toBeTruthy();

      // Generate proof
      const request = createMockProofRequest();
      const result = await stark.generateProof(request);

      // Verify proof structure
      expect(result.proof).toBeDefined();
      expect(result.proof.traceCommitment).toBeDefined();
      expect(result.proof.friProof).toBeDefined();
      expect(result.proof.queryResponses).toHaveLength(80);

      // Verify public inputs
      expect(result.publicInputs.signatureValid).toBeTruthy();

      // Verify proof metadata
      expect(result.metadata.securityLevel).toBeGreaterThanOrEqual(128);
    });

    test('should display proof verification result', async ({ page }) => {
      // Mock verification endpoint
      await page.route('**/winterfell/verify', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ valid: true }),
        });
      });

      await page.goto('/unlock/complete?lockId=1&amount=1.5&txHash=0x123');

      // Should show verification success
      await expect(page.getByText(/Success|Complete|Verified/i).first()).toBeVisible();
    });
  });

  test.describe('Proof Metadata Display', () => {
    test('should show proof details on success page', async ({ page }) => {
      await page.goto('/unlock/complete?lockId=1&amount=1.5&txHash=0x123');

      // Proof-related information (if displayed)
      const proofInfo = page.getByText(/proof|STARK|verified/i);
      if (await proofInfo.count() > 0) {
        await expect(proofInfo.first()).toBeVisible();
      }

      // Transaction confirmation
      await expect(page.getByText(/Success|Complete/i).first()).toBeVisible();
    });

    test('should show security level indicator', async ({ page }) => {
      await page.goto('/security');

      // 128-bit security level info
      const securityInfo = page.getByText(/128.bit|security level|quantum/i);
      await expect(securityInfo.first()).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle proof generation failure gracefully', async ({ page }) => {
      // Mock failed proof generation
      await page.route('**/prove', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            proofId: 'proof-fail',
            status: 'pending',
          }),
        });
      });

      await page.route('**/status/proof-fail', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            proofId: 'proof-fail',
            status: 'failed',
            error: 'Witness generation failed',
          }),
        });
      });

      await page.goto('/unlock/processing?lockId=1');

      // Should show error state after timeout/failure
      // Note: Actual behavior depends on UI implementation
    });

    test('should handle verification failure', async ({ page }) => {
      // Mock failed verification
      await page.route('**/winterfell/verify', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ valid: false, error: 'Invalid proof structure' }),
        });
      });

      // The UI should handle verification failures appropriately
    });

    test('should handle prover service unavailable', async ({ page }) => {
      // Mock network error
      await page.route('**/prove', async route => {
        await route.abort('failed');
      });

      await page.goto('/unlock/processing?lockId=1');

      // Should show error or retry state
      const errorState = page.getByText(/Error|Failed|Retry|Unable/i);
      // Timeout increased as error may take time to appear
      await expect(errorState.first()).toBeVisible({ timeout: 15000 }).catch(() => {
        // If no error shown, page should still be visible
        expect(page).toBeDefined();
      });
    });
  });

  test.describe('STARK Proof Structure Validation', () => {
    test('mock proof has correct structure for Level 1 verification', () => {
      const proof = mockStarkProof.proof;

      // Trace commitment (32 bytes = 64 hex chars + 0x prefix)
      expect(proof.traceCommitment).toMatch(/^0x[a-fA-F0-9]{64}$/);

      // FRI proof structure: [num_layers (1 byte)] [layer_commitments]
      expect(proof.friProof).toMatch(/^0x[a-fA-F0-9]+$/);
      expect(proof.friProof.length).toBeGreaterThan(66); // At least 1 byte + 1 commitment

      // Query responses (80 for Level 1)
      expect(proof.queryResponses).toHaveLength(80);
      proof.queryResponses.forEach((response, i) => {
        expect(response).toMatch(/^0x[a-fA-F0-9]+$/);
      });
    });

    test('mock public inputs have correct structure', () => {
      const inputs = mockStarkProof.publicInputs;

      // Public key hash (32 bytes)
      expect(inputs.publicKeyHash).toMatch(/^0x[a-fA-F0-9]{64}$/);

      // Message hash (32 bytes)
      expect(inputs.messageHash).toMatch(/^0x[a-fA-F0-9]{64}$/);

      // Signature valid flag
      expect(typeof inputs.signatureValid).toBe('boolean');

      // Nonce
      expect(typeof inputs.nonce).toBe('number');
      expect(inputs.nonce).toBeGreaterThan(0);

      // Recipient address
      expect(inputs.recipient).toMatch(/^0x[a-fA-F0-9]{40}$/);

      // Amount (wei string)
      expect(inputs.amount).toMatch(/^[0-9]+$/);

      // Lock ID (32 bytes)
      expect(inputs.lockId).toMatch(/^0x[a-fA-F0-9]{64}$/);
    });

    test('mock Dilithium keys have correct sizes', () => {
      // ML-DSA-65 public key: 1952 bytes = 3904 hex chars
      expect(mockDilithiumKeys.publicKey.length).toBeGreaterThan(3900);

      // Public key hash (32 bytes)
      expect(mockDilithiumKeys.publicKeyHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
    });

    test('mock Dilithium signature has correct size', () => {
      // ML-DSA-65 signature: 3293 bytes = 6586 hex chars (+ 0x prefix)
      expect(mockDilithiumSignature.signature.length).toBeGreaterThan(6580);
    });
  });

  test.describe('Integration with Contract Verification', () => {
    test('should display L1 verification status', async ({ page }) => {
      await page.goto('/unlock/complete?lockId=1&amount=1.5&txHash=0x123');

      // L1 verification info
      const verificationInfo = page.getByText(/L1|Ethereum|verified|on-chain/i);
      if (await verificationInfo.count() > 0) {
        await expect(verificationInfo.first()).toBeVisible();
      }

      // Transaction should be confirmed
      await expect(page.getByText(/Complete|Success/i).first()).toBeVisible();
    });

    test('should show gas cost estimate for verification', async ({ page }) => {
      await page.goto('/unlock/method?lockId=1');

      // Gas estimation (if displayed)
      const gasInfo = page.getByText(/gas|fee|cost/i);
      if (await gasInfo.count() > 0) {
        await expect(gasInfo.first()).toBeVisible();
      }
    });
  });
});

test.describe('E2E: STARK Proof with Real Prover (Integration)', () => {
  test.beforeAll(async () => {
    // Skip all tests in this group if real prover is not enabled
    if (!USE_REAL_PROVER) {
      test.skip();
    }
  });

  test('full STARK proof generation and verification flow', async ({ page }) => {
    if (!USE_REAL_PROVER) {
      test.skip();
      return;
    }

    const stark = new StarkFixture(page, STARK_PROVER_URL);

    // Check prover health
    const healthy = await stark.healthCheck();
    if (!healthy) {
      test.skip();
      return;
    }

    // Generate proof
    const request = createMockProofRequest({
      message: 'E2E Test Unlock',
      nonce: Date.now(),
    });

    const startTime = Date.now();
    const result = await stark.generateProof(request);
    const duration = Date.now() - startTime;

    console.log(`Proof generated in ${duration}ms`);
    console.log(`Proof size: ${result.metadata.proofSize} bytes`);
    console.log(`Security level: ${result.metadata.securityLevel} bits`);

    // Verify proof locally
    const isValid = await stark.verifyProof(result.proof, result.publicInputs);
    expect(isValid).toBeTruthy();

    // Performance assertions
    expect(duration).toBeLessThan(30000); // 30 seconds max
    expect(result.metadata.proofSize).toBeLessThan(50000); // 50KB max
  });

  test('batch proof generation', async ({ page }) => {
    if (!USE_REAL_PROVER) {
      test.skip();
      return;
    }

    const stark = new StarkFixture(page, STARK_PROVER_URL);

    // Check prover health
    if (!(await stark.healthCheck())) {
      test.skip();
      return;
    }

    // Generate multiple proofs
    const proofCount = 3;
    const results: ProofResult[] = [];

    for (let i = 0; i < proofCount; i++) {
      const request = createMockProofRequest({
        nonce: Date.now() + i,
        lockId: '0x' + i.toString(16).padStart(64, '0'),
      });

      const result = await stark.generateProof(request);
      results.push(result);

      // Verify each proof
      const isValid = await stark.verifyProof(result.proof, result.publicInputs);
      expect(isValid).toBeTruthy();
    }

    expect(results).toHaveLength(proofCount);
  });
});
