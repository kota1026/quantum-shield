import { apiClient } from '../client';
import type { NonceResponse, VerifyRequest, AuthSession } from '../types/api';

export const authApi = {
  /**
   * Get a nonce for SIWE authentication
   */
  getNonce: () => apiClient.get<NonceResponse>('/auth/siwe/nonce'),

  /**
   * Verify SIWE signature and create session
   */
  verify: (data: VerifyRequest) =>
    apiClient.post<AuthSession>('/auth/siwe/verify', data),

  /**
   * Refresh authentication token
   */
  refresh: () => apiClient.post<AuthSession>('/auth/refresh'),

  /**
   * Logout and invalidate session
   */
  logout: () => apiClient.post<{ success: boolean }>('/auth/logout'),
};
