/**
 * Members React Query Hooks
 *
 * Provides data fetching hooks for QS Admin Members management.
 * Uses React Query for caching, automatic refetch, and optimistic updates.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin/client';
import type { MembersStats, Member, Role } from '@/lib/api/admin/mock';

// Query key factory
export const membersKeys = {
  all: ['admin', 'members'] as const,
  stats: () => [...membersKeys.all, 'stats'] as const,
  list: (filters?: MemberFilters) => [...membersKeys.all, 'list', filters] as const,
  roles: () => [...membersKeys.all, 'roles'] as const,
  role: (roleId: string) => [...membersKeys.all, 'role', roleId] as const,
};

// Types for filters
interface MemberFilters {
  role?: string;
  status?: string;
  search?: string;
}

// Response types
interface MembersStatsResponse {
  stats: MembersStats;
}

interface MembersListResponse {
  members: Member[];
  total: number;
}

interface RolesListResponse {
  roles: Role[];
}

interface RoleResponse {
  role: Role;
}

// ==================== STATS ====================

export function useMembersStats() {
  return useQuery({
    queryKey: membersKeys.stats(),
    queryFn: async () => {
      const response = await adminApi.get<MembersStatsResponse>('/api/admin/members/stats');
      return response.stats;
    },
    staleTime: 30_000,
  });
}

// ==================== MEMBERS LIST ====================

export function useMembersList(filters?: MemberFilters) {
  return useQuery({
    queryKey: membersKeys.list(filters),
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (filters?.role) params.role = filters.role;
      if (filters?.status) params.status = filters.status;
      if (filters?.search) params.search = filters.search;

      return adminApi.get<MembersListResponse>('/api/admin/members', params);
    },
    staleTime: 30_000,
  });
}

// ==================== ROLES ====================

export function useRolesList() {
  return useQuery({
    queryKey: membersKeys.roles(),
    queryFn: async () => {
      return adminApi.get<RolesListResponse>('/api/admin/members/roles');
    },
    staleTime: 60_000, // Roles don't change often
  });
}

export function useRole(roleId: string) {
  return useQuery({
    queryKey: membersKeys.role(roleId),
    queryFn: async () => {
      const response = await adminApi.get<RoleResponse>(`/api/admin/members/roles/${roleId}`);
      return response.role;
    },
    staleTime: 60_000,
  });
}

// ==================== MUTATIONS ====================

// Invite member
interface InviteMemberInput {
  email: string;
  role: string;
  name?: string;
}

export function useInviteMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: InviteMemberInput) => {
      return adminApi.post('/api/admin/members/invite', input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: membersKeys.stats() });
      queryClient.invalidateQueries({ queryKey: membersKeys.list() });
    },
  });
}

// Update member role
interface UpdateMemberRoleInput {
  memberId: number;
  role: string;
}

export function useUpdateMemberRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ memberId, role }: UpdateMemberRoleInput) => {
      return adminApi.post(`/api/admin/members/${memberId}/role`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: membersKeys.list() });
      queryClient.invalidateQueries({ queryKey: membersKeys.roles() });
    },
  });
}

// Deactivate member
export function useDeactivateMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (memberId: number) => {
      return adminApi.post(`/api/admin/members/${memberId}/deactivate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: membersKeys.stats() });
      queryClient.invalidateQueries({ queryKey: membersKeys.list() });
    },
  });
}

// Reactivate member
export function useReactivateMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (memberId: number) => {
      return adminApi.post(`/api/admin/members/${memberId}/reactivate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: membersKeys.stats() });
      queryClient.invalidateQueries({ queryKey: membersKeys.list() });
    },
  });
}

// Resend invite
export function useResendInvite() {
  return useMutation({
    mutationFn: async (memberId: number) => {
      return adminApi.post(`/api/admin/members/${memberId}/resend-invite`);
    },
  });
}

// Create role
interface CreateRoleInput {
  name: string;
  description: string;
  permissions: string[];
}

export function useCreateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateRoleInput) => {
      return adminApi.post('/api/admin/members/roles', input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: membersKeys.roles() });
      queryClient.invalidateQueries({ queryKey: membersKeys.stats() });
    },
  });
}

// Update role permissions
interface UpdateRoleInput {
  roleId: string;
  permissions: string[];
}

export function useUpdateRolePermissions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ roleId, permissions }: UpdateRoleInput) => {
      return adminApi.post(`/api/admin/members/roles/${roleId}/permissions`, { permissions });
    },
    onSuccess: (_, { roleId }) => {
      queryClient.invalidateQueries({ queryKey: membersKeys.roles() });
      queryClient.invalidateQueries({ queryKey: membersKeys.role(roleId) });
    },
  });
}
