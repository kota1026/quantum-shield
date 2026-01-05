import { apiClient } from '../client';
import type { User, UserLock, UserUnlock, PaginatedResponse } from '../types/api';

export const usersApi = {
  /**
   * Register a new user with Dilithium public key
   */
  register: (data: { address: string; dilithiumPublicKey: string }) =>
    apiClient.post<User>('/users/register', data),

  /**
   * Get current user profile
   */
  getMe: () => apiClient.get<User>('/users/me'),

  /**
   * Update user profile
   */
  updateMe: (data: Partial<User>) => apiClient.put<User>('/users/me', data),

  /**
   * Get user's locks
   */
  getMyLocks: (params?: { page?: number; pageSize?: number; status?: string }) =>
    apiClient.get<PaginatedResponse<UserLock>>('/users/me/locks', params),

  /**
   * Get user's unlock requests
   */
  getMyUnlocks: (params?: { page?: number; pageSize?: number; status?: string }) =>
    apiClient.get<PaginatedResponse<UserUnlock>>('/users/me/unlocks', params),

  /**
   * Get user's transaction history
   */
  getMyHistory: (params?: { page?: number; pageSize?: number }) =>
    apiClient.get<PaginatedResponse<UserLock | UserUnlock>>('/users/me/history', params),
};
