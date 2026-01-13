import { apiClient } from '../client';
import type {
  TokenHubDashboardResponse,
  TokenHubLockRequest,
  TokenHubLockResponse,
  TokenHubLocksResponse,
  TokenHubExtendRequest,
  TokenHubExtendResponse,
  TokenHubDelegatesResponse,
  TokenHubDelegateRequest,
  TokenHubDelegateResponse,
  TokenHubRewardsResponse,
  TokenHubClaimRequest,
  TokenHubClaimResponse,
  TokenHubMyDelegationsResponse,
} from '../types/api';

/**
 * Token Hub API - veQS token locking, delegation, and rewards
 * TASK-P5-021: 9 endpoints
 */
export const tokenHubApi = {
  /**
   * GET /v1/token-hub/dashboard
   * Get user's Token Hub dashboard with balances and voting power
   */
  getDashboard: (address: string) =>
    apiClient.get<TokenHubDashboardResponse>('/v1/token-hub/dashboard', { address }),

  /**
   * POST /v1/token-hub/lock
   * Lock QS tokens to receive veQS voting power
   */
  createLock: (data: TokenHubLockRequest) =>
    apiClient.post<TokenHubLockResponse>('/v1/token-hub/lock', data),

  /**
   * GET /v1/token-hub/locks
   * Get user's lock positions (active and historical)
   */
  getLocks: (address: string) =>
    apiClient.get<TokenHubLocksResponse>('/v1/token-hub/locks', { address }),

  /**
   * POST /v1/token-hub/extend
   * Extend an existing lock's duration
   */
  extendLock: (data: TokenHubExtendRequest) =>
    apiClient.post<TokenHubExtendResponse>('/v1/token-hub/extend', data),

  /**
   * GET /v1/token-hub/delegates
   * Get list of available delegates for voting power delegation
   */
  getDelegates: (params?: { page?: number; limit?: number; sortBy?: string }) =>
    apiClient.get<TokenHubDelegatesResponse>('/v1/token-hub/delegates', params),

  /**
   * POST /v1/token-hub/delegate
   * Delegate voting power to another address
   */
  delegate: (data: TokenHubDelegateRequest) =>
    apiClient.post<TokenHubDelegateResponse>('/v1/token-hub/delegate', data),

  /**
   * GET /v1/token-hub/rewards
   * Get user's reward information
   */
  getRewards: (address: string) =>
    apiClient.get<TokenHubRewardsResponse>('/v1/token-hub/rewards', { address }),

  /**
   * POST /v1/token-hub/claim
   * Claim accumulated rewards
   */
  claimRewards: (data: TokenHubClaimRequest) =>
    apiClient.post<TokenHubClaimResponse>('/v1/token-hub/claim', data),

  /**
   * GET /v1/token-hub/delegations/my
   * Get user's delegation information
   */
  getMyDelegations: (address: string) =>
    apiClient.get<TokenHubMyDelegationsResponse>('/v1/token-hub/delegations/my', { address }),
};
