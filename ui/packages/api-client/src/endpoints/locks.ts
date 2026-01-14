import { apiClient } from '../client';
import type {
  LockRequest,
  LockResponse,
  UnlockRequest,
  EmergencyUnlockRequest,
  UnlockResponse,
} from '../types/api';

export const locksApi = {
  /**
   * Create a new lock
   */
  lock: (data: LockRequest) => apiClient.post<LockResponse>('/lock', data),

  /**
   * Request a normal unlock (24h time lock)
   */
  requestUnlock: (data: UnlockRequest) =>
    apiClient.post<UnlockResponse>('/unlock', data),

  /**
   * Request an emergency unlock (7d time lock + bond)
   */
  requestEmergencyUnlock: (data: EmergencyUnlockRequest) =>
    apiClient.post<UnlockResponse>('/unlock/emergency', data),

  /**
   * Get lock status
   */
  getLockStatus: (lockId: string) =>
    apiClient.get<{
      lockId: string;
      status: string;
      amount: string;
      owner: string;
    }>(`/status/${lockId}`),

  /**
   * Get pending unlock requests
   */
  getPendingUnlocks: () =>
    apiClient.get<{ unlocks: Array<{ unlockId: string; unlockTime: string; status: string }> }>(
      '/status/pending'
    ),
};
