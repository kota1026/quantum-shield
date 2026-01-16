/**
 * API Integration Fixture for E2E Tests
 *
 * Provides mock and real API interaction helpers for Playwright E2E tests.
 * Supports both mock mode (for UI testing) and integration mode (for full E2E).
 *
 * @see TASK-P5-034 E2E Test Implementation
 * @see SEQUENCES.md for API contract definitions
 */

import { test as base, expect, Page } from '@playwright/test';

// API response types
export interface LockResponse {
  lockId: string;
  amount: string;
  dilithiumPubKeyHash: string;
  createdAt: string;
  status: 'pending' | 'locked' | 'unlocking' | 'unlocked';
}

export interface UnlockRequest {
  lockId: string;
  recipient: string;
  amount: string;
  signature: string;
}

export interface StarkProofResponse {
  proofId: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  proof?: {
    traceCommitment: string;
    friProof: string;
    queryResponses: string[];
  };
  publicInputs?: {
    publicKeyHash: string;
    messageHash: string;
    signatureValid: boolean;
    nonce: number;
  };
}

export interface ChallengeResponse {
  challengeId: string;
  lockId: string;
  challenger: string;
  bondAmount: string;
  reason: string;
  status: 'pending' | 'active' | 'resolved' | 'slashed';
  defenseDeadline: string;
}

// API Helper class
export class ApiFixture {
  private baseUrl: string;
  private page: Page;

  constructor(page: Page, baseUrl: string = 'http://localhost:8080') {
    this.page = page;
    this.baseUrl = baseUrl;
  }

  /**
   * Health check for API availability
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.page.request.get(`${this.baseUrl}/health`);
      return response.ok();
    } catch {
      return false;
    }
  }

  /**
   * Create a lock via API (mock mode)
   */
  async createLock(amount: string, dilithiumPubKeyHash: string): Promise<LockResponse> {
    const response = await this.page.request.post(`${this.baseUrl}/v1/lock`, {
      data: {
        amount,
        dilithiumPubKeyHash,
      },
    });

    if (!response.ok()) {
      throw new Error(`Failed to create lock: ${response.status()}`);
    }

    return response.json();
  }

  /**
   * Get lock status
   */
  async getLock(lockId: string): Promise<LockResponse> {
    const response = await this.page.request.get(`${this.baseUrl}/v1/lock/${lockId}`);

    if (!response.ok()) {
      throw new Error(`Failed to get lock: ${response.status()}`);
    }

    return response.json();
  }

  /**
   * Request unlock via API
   */
  async requestUnlock(request: UnlockRequest): Promise<{ unlockRequestId: string }> {
    const response = await this.page.request.post(`${this.baseUrl}/v1/unlock/request`, {
      data: request,
    });

    if (!response.ok()) {
      throw new Error(`Failed to request unlock: ${response.status()}`);
    }

    return response.json();
  }

  /**
   * Get STARK proof status
   */
  async getStarkProofStatus(proofId: string): Promise<StarkProofResponse> {
    const response = await this.page.request.get(`${this.baseUrl}/v1/stark/status/${proofId}`);

    if (!response.ok()) {
      throw new Error(`Failed to get proof status: ${response.status()}`);
    }

    return response.json();
  }

  /**
   * Submit challenge
   */
  async submitChallenge(
    lockId: string,
    reason: string,
    bondAmount: string
  ): Promise<ChallengeResponse> {
    const response = await this.page.request.post(`${this.baseUrl}/v1/challenge`, {
      data: {
        lockId,
        reason,
        bondAmount,
      },
    });

    if (!response.ok()) {
      throw new Error(`Failed to submit challenge: ${response.status()}`);
    }

    return response.json();
  }

  /**
   * Get challenge status
   */
  async getChallenge(challengeId: string): Promise<ChallengeResponse> {
    const response = await this.page.request.get(`${this.baseUrl}/v1/challenge/${challengeId}`);

    if (!response.ok()) {
      throw new Error(`Failed to get challenge: ${response.status()}`);
    }

    return response.json();
  }

  /**
   * Get user dashboard data
   */
  async getDashboard(address: string): Promise<{
    totalLocked: string;
    activeLocks: number;
    pendingUnlocks: number;
  }> {
    const response = await this.page.request.get(`${this.baseUrl}/v1/user/dashboard`, {
      headers: {
        'x-user-address': address,
      },
    });

    if (!response.ok()) {
      throw new Error(`Failed to get dashboard: ${response.status()}`);
    }

    return response.json();
  }
}

// Mock API responses for offline testing
export const mockResponses = {
  lock: {
    lockId: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    amount: '1000000000000000000', // 1 ETH
    dilithiumPubKeyHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    createdAt: new Date().toISOString(),
    status: 'locked' as const,
  },

  starkProof: {
    proofId: 'proof-001',
    status: 'completed' as const,
    proof: {
      traceCommitment: '0x' + '1'.repeat(64),
      friProof: '0x' + '2'.repeat(128),
      queryResponses: Array(80)
        .fill(0)
        .map((_, i) => '0x' + i.toString(16).padStart(64, '0')),
    },
    publicInputs: {
      publicKeyHash: '0x' + 'a'.repeat(64),
      messageHash: '0x' + 'b'.repeat(64),
      signatureValid: true,
      nonce: 1,
    },
  },

  challenge: {
    challengeId: 'challenge-001',
    lockId: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    challenger: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    bondAmount: '100000000000000000', // 0.1 ETH
    reason: 'Suspected fraudulent unlock',
    status: 'active' as const,
    defenseDeadline: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
  },

  dashboard: {
    totalLocked: '5000000000000000000', // 5 ETH
    activeLocks: 3,
    pendingUnlocks: 1,
  },
};

// Playwright test fixture extension
export const test = base.extend<{ api: ApiFixture }>({
  api: async ({ page }, use) => {
    const api = new ApiFixture(page);
    await use(api);
  },
});

export { expect };
