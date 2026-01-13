/**
 * STARK Prover Integration Fixture for E2E Tests
 *
 * Provides helpers for testing STARK proof generation and verification
 * in the full E2E flow. Supports both mock mode and real STARK prover.
 *
 * @see TASK-P5-034 E2E Test Implementation
 * @see TASK-P5-001, TASK-P5-002 STARK Prover Implementation
 */

import { test as base, expect, Page } from '@playwright/test';

// STARK proof types matching dilithium-stark crate
export interface StarkProof {
  traceCommitment: string;
  friProof: string;
  queryResponses: string[];
}

export interface PublicInputs {
  publicKeyHash: string;
  messageHash: string;
  signatureValid: boolean;
  nonce: number;
  recipient: string;
  amount: string;
  lockId: string;
}

export interface ProofGenerationRequest {
  message: string;
  dilithiumSignature: string;
  dilithiumPublicKey: string;
  nonce: number;
  recipient: string;
  amount: string;
  lockId: string;
}

export interface ProofGenerationResponse {
  proofId: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  estimatedTime?: number;
}

export interface ProofResult {
  proof: StarkProof;
  publicInputs: PublicInputs;
  metadata: {
    generationTimeMs: number;
    proofSize: number;
    securityLevel: number;
  };
}

// STARK Prover Fixture
export class StarkFixture {
  private proverUrl: string;
  private page: Page;

  constructor(page: Page, proverUrl: string = 'http://localhost:3001') {
    this.page = page;
    this.proverUrl = proverUrl;
  }

  /**
   * Health check for STARK prover availability
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.page.request.get(`${this.proverUrl}/health`);
      return response.ok();
    } catch {
      return false;
    }
  }

  /**
   * Request STARK proof generation
   */
  async requestProof(request: ProofGenerationRequest): Promise<ProofGenerationResponse> {
    const response = await this.page.request.post(`${this.proverUrl}/prove`, {
      data: request,
    });

    if (!response.ok()) {
      throw new Error(`Failed to request proof: ${response.status()}`);
    }

    return response.json();
  }

  /**
   * Poll for proof completion
   */
  async waitForProof(proofId: string, timeoutMs: number = 30000): Promise<ProofResult> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      const response = await this.page.request.get(`${this.proverUrl}/status/${proofId}`);

      if (!response.ok()) {
        throw new Error(`Failed to get proof status: ${response.status()}`);
      }

      const status = await response.json();

      if (status.status === 'completed') {
        // Fetch the completed proof
        const proofResponse = await this.page.request.get(`${this.proverUrl}/proof/${proofId}`);
        return proofResponse.json();
      }

      if (status.status === 'failed') {
        throw new Error(`Proof generation failed: ${status.error}`);
      }

      // Wait before polling again
      await this.page.waitForTimeout(1000);
    }

    throw new Error(`Proof generation timed out after ${timeoutMs}ms`);
  }

  /**
   * Verify proof locally (using Winterfell endpoint)
   */
  async verifyProof(proof: StarkProof, publicInputs: PublicInputs): Promise<boolean> {
    const response = await this.page.request.post(`${this.proverUrl}/winterfell/verify`, {
      data: {
        proof,
        publicInputs,
      },
    });

    if (!response.ok()) {
      return false;
    }

    const result = await response.json();
    return result.valid === true;
  }

  /**
   * Generate and wait for proof in one call
   */
  async generateProof(request: ProofGenerationRequest): Promise<ProofResult> {
    const { proofId } = await this.requestProof(request);
    return this.waitForProof(proofId);
  }
}

// Mock STARK proof data for offline testing
export const mockStarkProof: ProofResult = {
  proof: {
    // Valid trace commitment (32 bytes hex)
    traceCommitment: '0x' + 'a'.repeat(64),
    // FRI proof with valid structure: [num_layers (1 byte)] [layer_commitments (32 bytes each)]
    friProof: '0x02' + 'b'.repeat(64) + 'c'.repeat(64),
    // 80 query responses for Level 1 verification
    queryResponses: Array(80)
      .fill(0)
      .map((_, i) => '0x' + ((i * 17) % 256).toString(16).padStart(64, '0')),
  },
  publicInputs: {
    publicKeyHash: '0x' + 'd'.repeat(64),
    messageHash: '0x' + 'e'.repeat(64),
    signatureValid: true,
    nonce: 1,
    recipient: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    amount: '1000000000000000000', // 1 ETH
    lockId: '0x' + 'f'.repeat(64),
  },
  metadata: {
    generationTimeMs: 2500,
    proofSize: 8192,
    securityLevel: 128,
  },
};

// Mock Dilithium key pair for testing
export const mockDilithiumKeys = {
  publicKey: '0x' + '1'.repeat(3232), // ML-DSA-65 public key size
  secretKey: '0x' + '2'.repeat(7680), // ML-DSA-65 secret key size (not exposed in tests)
  publicKeyHash: '0x' + '3'.repeat(64),
};

// Mock Dilithium signature
export const mockDilithiumSignature = {
  signature: '0x' + '4'.repeat(6596), // ML-DSA-65 signature size
  message: 'E2E Test Message',
  messageHash: '0x' + '5'.repeat(64),
};

// Helper to create mock proof request
export function createMockProofRequest(overrides?: Partial<ProofGenerationRequest>): ProofGenerationRequest {
  return {
    message: mockDilithiumSignature.message,
    dilithiumSignature: mockDilithiumSignature.signature,
    dilithiumPublicKey: mockDilithiumKeys.publicKey,
    nonce: 1,
    recipient: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    amount: '1000000000000000000',
    lockId: '0x' + 'f'.repeat(64),
    ...overrides,
  };
}

// Playwright test fixture extension
export const test = base.extend<{ stark: StarkFixture }>({
  stark: async ({ page }, use) => {
    const stark = new StarkFixture(page);
    await use(stark);
  },
});

export { expect };
