import { apiClient } from '../client';
import type {
  AdminDashboardResponse,
  AdminTransactionsResponse,
  AdminNodesResponse,
  AdminStaffResponse,
  CreateStaffRequest,
  CreateStaffResponse,
  AdminReportsResponse,
  AdminAuditLogResponse,
  AdminParametersResponse,
  ParameterChangeRequest,
  ParameterChangeResponse,
  EnterpriseAccountsResponse,
  CreateEnterpriseAccountRequest,
  CreateEnterpriseAccountResponse,
} from '../types/api';

/**
 * Admin API - QS Admin dashboard and management
 * TASK-P5-015: 11 endpoints
 */
export const adminApi = {
  /**
   * GET /v1/admin/dashboard
   * Get admin dashboard overview
   */
  getDashboard: () =>
    apiClient.get<AdminDashboardResponse>('/v1/admin/dashboard'),

  /**
   * GET /v1/admin/transactions
   * Get list of all transactions
   */
  getTransactions: (params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    type?: string;
  }) =>
    apiClient.get<AdminTransactionsResponse>('/v1/admin/transactions', params),

  /**
   * GET /v1/admin/nodes
   * Get list of L3 nodes
   */
  getNodes: () =>
    apiClient.get<AdminNodesResponse>('/v1/admin/nodes'),

  /**
   * GET /v1/admin/staff
   * Get list of staff members
   */
  getStaff: () =>
    apiClient.get<AdminStaffResponse>('/v1/admin/staff'),

  /**
   * POST /v1/admin/staff
   * Create new staff member
   */
  createStaff: (data: CreateStaffRequest) =>
    apiClient.post<CreateStaffResponse>('/v1/admin/staff', data),

  /**
   * GET /v1/admin/reports
   * Get available reports
   */
  getReports: (params?: { type?: string; period?: string }) =>
    apiClient.get<AdminReportsResponse>('/v1/admin/reports', params),

  /**
   * GET /v1/admin/audit-log
   * Get audit log entries
   */
  getAuditLog: (params?: {
    page?: number;
    pageSize?: number;
    action?: string;
    actor?: string;
  }) =>
    apiClient.get<AdminAuditLogResponse>('/v1/admin/audit-log', params),

  /**
   * GET /v1/admin/parameters
   * Get system parameters
   */
  getParameters: () =>
    apiClient.get<AdminParametersResponse>('/v1/admin/parameters'),

  /**
   * POST /v1/admin/parameters/change-request
   * Submit a parameter change request
   */
  requestParameterChange: (data: ParameterChangeRequest) =>
    apiClient.post<ParameterChangeResponse>('/v1/admin/parameters/change-request', data),

  /**
   * GET /v1/admin/enterprise/accounts
   * Get list of enterprise accounts
   */
  getEnterpriseAccounts: (params?: { page?: number; pageSize?: number; status?: string }) =>
    apiClient.get<EnterpriseAccountsResponse>('/v1/admin/enterprise/accounts', params),

  /**
   * POST /v1/admin/enterprise/accounts
   * Create new enterprise account
   */
  createEnterpriseAccount: (data: CreateEnterpriseAccountRequest) =>
    apiClient.post<CreateEnterpriseAccountResponse>('/v1/admin/enterprise/accounts', data),
};
