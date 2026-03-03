/**
 * Emergency Pause Admin Hooks
 *
 * React Query hooks for Emergency Pause management.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin/client';
import type {
  EmergencyStatusResponse,
  EmergencyPauseRequest,
  EmergencyUnpauseRequest,
} from '@/lib/api/admin/types';

export const emergencyKeys = {
  all: ['admin', 'emergency'] as const,
  status: () => [...emergencyKeys.all, 'status'] as const,
};

export function useEmergencyStatus() {
  return useQuery({
    queryKey: emergencyKeys.status(),
    queryFn: () => adminApi.get<EmergencyStatusResponse>('/v1/emergency/status'),
    staleTime: 10_000,
    refetchInterval: 30_000,
  });
}

export function useExecutePause() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: EmergencyPauseRequest) =>
      adminApi.post<{ success: boolean }>('/v1/emergency/pause', request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: emergencyKeys.all });
    },
  });
}

export function useExecuteUnpause() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: EmergencyUnpauseRequest) =>
      adminApi.post<{ success: boolean }>('/v1/emergency/unpause', request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: emergencyKeys.all });
    },
  });
}
