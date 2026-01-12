import { apiClient } from '../client';
import type {
  Prover,
  ProverApplication,
  SignatureRequest,
  PaginatedResponse,
} from '../types/api';

export const proversApi = {
  /**
   * Apply to become a prover
   */
  apply: (data: {
    companyName: string;
    contactEmail: string;
    technicalSpecs: {
      hsmType: string;
      infrastructure: string;
    };
  }) => apiClient.post<ProverApplication>('/provers/apply', data),

  /**
   * Get current prover's application status
   */
  getMyApplication: () =>
    apiClient.get<ProverApplication>('/provers/applications/me'),

  /**
   * Get current prover's info
   */
  getMe: () => apiClient.get<Prover>('/provers/me'),

  /**
   * Get signature queue
   */
  getSignatureQueue: () =>
    apiClient.get<{ requests: SignatureRequest[] }>('/provers/me/signatures'),

  /**
   * Submit signature for a request
   */
  submitSignature: (requestId: string, signature: string) =>
    apiClient.post<{ success: boolean }>(`/provers/me/signatures/${requestId}`, {
      signature,
    }),

  /**
   * Get prover's rewards info
   */
  getRewards: () =>
    apiClient.get<{
      pending: string;
      claimed: string;
      total: string;
    }>('/provers/me/rewards'),

  /**
   * Claim pending rewards
   */
  claimRewards: () =>
    apiClient.post<{ txHash: string }>('/provers/me/rewards/claim'),

  /**
   * Get stake info
   */
  getStake: () =>
    apiClient.get<{
      staked: string;
      slashed: string;
      available: string;
    }>('/provers/me/stake'),

  /**
   * Request exit from prover network
   */
  requestExit: () =>
    apiClient.post<{ unbondingEndsAt: string }>('/provers/me/exit'),

  /**
   * Get public list of provers
   */
  list: (params?: { page?: number; pageSize?: number }) =>
    apiClient.get<PaginatedResponse<Prover>>('/provers', params),

  /**
   * Get public prover details
   */
  getByAddress: (address: string) => apiClient.get<Prover>(`/provers/${address}`),
};
