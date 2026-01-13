import { apiClient } from '../client';
import type {
  ObserverDashboardResponse,
  PendingUnlocksResponse,
  SuspiciousTxsResponse,
  ObserverHistoryResponse,
  SubmitChallengeRequest,
  SubmitChallengeResponse,
  ChallengeDetailResponse,
  EarningsResponse,
  ClaimEarningsRequest,
  ClaimEarningsResponse,
} from '../types/api';

/**
 * Observer API - monitor unlocks, submit challenges, track earnings
 * TASK-P5-019: 8 endpoints
 */
export const observerApi = {
  /**
   * GET /v1/observer/dashboard
   * Get observer's dashboard with earnings, challenges, and network stats
   */
  getDashboard: () =>
    apiClient.get<ObserverDashboardResponse>('/v1/observer/dashboard'),

  /**
   * GET /v1/observer/pending-unlocks
   * Get list of pending unlocks available to monitor/challenge
   */
  getPendingUnlocks: (params?: {
    page?: number;
    pageSize?: number;
    minAmount?: string;
    suspicionLevel?: string;
  }) =>
    apiClient.get<PendingUnlocksResponse>('/v1/observer/pending-unlocks', params),

  /**
   * GET /v1/observer/suspicious-txs
   * Get transactions flagged as suspicious by the monitoring system
   */
  getSuspiciousTxs: (params?: { page?: number; pageSize?: number }) =>
    apiClient.get<SuspiciousTxsResponse>('/v1/observer/suspicious-txs', params),

  /**
   * GET /v1/observer/history
   * Get observer's challenge and earnings history
   */
  getHistory: (params?: { page?: number; pageSize?: number }) =>
    apiClient.get<ObserverHistoryResponse>('/v1/observer/history', params),

  /**
   * POST /v1/observer/challenge
   * Submit a challenge against a pending unlock
   */
  submitChallenge: (data: SubmitChallengeRequest) =>
    apiClient.post<SubmitChallengeResponse>('/v1/observer/challenge', data),

  /**
   * GET /v1/observer/challenge/:id
   * Get details of a specific challenge
   */
  getChallenge: (challengeId: string) =>
    apiClient.get<ChallengeDetailResponse>(`/v1/observer/challenge/${challengeId}`),

  /**
   * GET /v1/observer/earnings
   * Get observer's earnings summary and history
   */
  getEarnings: () =>
    apiClient.get<EarningsResponse>('/v1/observer/earnings'),

  /**
   * POST /v1/observer/claim-earnings
   * Claim accumulated earnings from successful challenges
   */
  claimEarnings: (data: ClaimEarningsRequest) =>
    apiClient.post<ClaimEarningsResponse>('/v1/observer/claim-earnings', data),
};
