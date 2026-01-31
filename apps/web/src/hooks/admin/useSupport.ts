/**
 * Support React Query Hooks
 *
 * Provides data fetching hooks for QS Admin Support management.
 * Uses React Query for caching, automatic refetch, and optimistic updates.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin/client';
import type { SupportStats, Ticket, FAQCategory, FAQ } from '@/lib/api/admin/mock';

// Query key factory
export const supportKeys = {
  all: ['admin', 'support'] as const,
  stats: () => [...supportKeys.all, 'stats'] as const,
  tickets: (filters?: TicketFilters) => [...supportKeys.all, 'tickets', filters] as const,
  ticket: (id: string) => [...supportKeys.all, 'ticket', id] as const,
  faqCategories: () => [...supportKeys.all, 'faq', 'categories'] as const,
  faq: (id: number) => [...supportKeys.all, 'faq', id] as const,
};

// Types for filters
interface TicketFilters {
  status?: string;
  priority?: string;
  category?: string;
  search?: string;
}

// Response types
interface SupportStatsResponse {
  stats: SupportStats;
}

interface TicketsListResponse {
  tickets: Ticket[];
  total: number;
}

interface TicketResponse {
  ticket: Ticket;
}

interface FAQCategoriesResponse {
  categories: FAQCategory[];
}

interface FAQResponse {
  faq: FAQ;
}

// ==================== STATS ====================

export function useSupportStats() {
  return useQuery({
    queryKey: supportKeys.stats(),
    queryFn: async () => {
      const response = await adminApi.get<SupportStatsResponse>('/api/admin/support/stats');
      return response.stats;
    },
    staleTime: 30_000,
  });
}

// ==================== TICKETS ====================

export function useTicketsList(filters?: TicketFilters) {
  return useQuery({
    queryKey: supportKeys.tickets(filters),
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (filters?.status) params.status = filters.status;
      if (filters?.priority) params.priority = filters.priority;
      if (filters?.category) params.category = filters.category;
      if (filters?.search) params.search = filters.search;

      return adminApi.get<TicketsListResponse>('/api/admin/support/tickets', params);
    },
    staleTime: 30_000,
  });
}

export function useTicket(id: string) {
  return useQuery({
    queryKey: supportKeys.ticket(id),
    queryFn: async () => {
      const response = await adminApi.get<TicketResponse>(`/api/admin/support/tickets/${id}`);
      return response.ticket;
    },
    staleTime: 30_000,
  });
}

// ==================== TICKET MUTATIONS ====================

interface UpdateTicketStatusInput {
  ticketId: string;
  status: string;
  message?: string;
}

export function useUpdateTicketStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ticketId, status, message }: UpdateTicketStatusInput) => {
      return adminApi.post(`/api/admin/support/tickets/${ticketId}/status`, { status, message });
    },
    onSuccess: (_, { ticketId }) => {
      queryClient.invalidateQueries({ queryKey: supportKeys.stats() });
      queryClient.invalidateQueries({ queryKey: supportKeys.tickets() });
      queryClient.invalidateQueries({ queryKey: supportKeys.ticket(ticketId) });
    },
  });
}

interface ReplyToTicketInput {
  ticketId: string;
  message: string;
}

export function useReplyToTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ticketId, message }: ReplyToTicketInput) => {
      return adminApi.post(`/api/admin/support/tickets/${ticketId}/reply`, { message });
    },
    onSuccess: (_, { ticketId }) => {
      queryClient.invalidateQueries({ queryKey: supportKeys.ticket(ticketId) });
      queryClient.invalidateQueries({ queryKey: supportKeys.tickets() });
    },
  });
}

export function useAssignTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ticketId, assigneeId }: { ticketId: string; assigneeId: string }) => {
      return adminApi.post(`/api/admin/support/tickets/${ticketId}/assign`, { assigneeId });
    },
    onSuccess: (_, { ticketId }) => {
      queryClient.invalidateQueries({ queryKey: supportKeys.ticket(ticketId) });
      queryClient.invalidateQueries({ queryKey: supportKeys.tickets() });
    },
  });
}

// ==================== FAQ ====================

export function useFAQCategories() {
  return useQuery({
    queryKey: supportKeys.faqCategories(),
    queryFn: async () => {
      return adminApi.get<FAQCategoriesResponse>('/api/admin/support/faq/categories');
    },
    staleTime: 60_000, // FAQ doesn't change often
  });
}

export function useFAQ(id: number) {
  return useQuery({
    queryKey: supportKeys.faq(id),
    queryFn: async () => {
      const response = await adminApi.get<FAQResponse>(`/api/admin/support/faq/${id}`);
      return response.faq;
    },
    staleTime: 60_000,
  });
}

// ==================== FAQ MUTATIONS ====================

interface CreateFAQInput {
  categoryId: string;
  question: string;
  answer: string;
}

export function useCreateFAQ() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateFAQInput) => {
      return adminApi.post('/api/admin/support/faq', input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supportKeys.faqCategories() });
    },
  });
}

interface UpdateFAQInput {
  id: number;
  question?: string;
  answer?: string;
}

export function useUpdateFAQ() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateFAQInput) => {
      return adminApi.post(`/api/admin/support/faq/${id}`, data);
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: supportKeys.faqCategories() });
      queryClient.invalidateQueries({ queryKey: supportKeys.faq(id) });
    },
  });
}

export function useDeleteFAQ() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      return adminApi.delete(`/api/admin/support/faq/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supportKeys.faqCategories() });
    },
  });
}

interface CreateFAQCategoryInput {
  name: string;
}

export function useCreateFAQCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateFAQCategoryInput) => {
      return adminApi.post('/api/admin/support/faq/categories', input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supportKeys.faqCategories() });
    },
  });
}
