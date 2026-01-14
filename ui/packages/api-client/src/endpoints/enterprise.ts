import { apiClient } from '../client';
import type {
  EnterpriseDashboardOverview,
  EnterpriseTVLResponse,
  EnterpriseVolumeResponse,
  EnterpriseTransactionsResponse,
  EnterpriseTransactionDetail,
  ExportTransactionsRequest,
  ExportTransactionsResponse,
  EnterpriseUsersResponse,
  EnterpriseUserDetail,
  CreateEnterpriseUserRequest,
  CreateEnterpriseUserResponse,
  InviteUserRequest,
  InviteUserResponse,
  UpdateUserRoleRequest,
  UpdateUserRoleResponse,
  EnterpriseApiKeysResponse,
  CreateApiKeyRequest,
  CreateApiKeyResponse,
  ApiKeyUsageResponse,
  EnterpriseSettingsResponse,
  UpdateEnterpriseSettingsRequest,
  UpdateEnterpriseSettingsResponse,
  EnterpriseSecuritySettingsResponse,
  EnterpriseReportsResponse,
  EnterpriseAuditLogResponse,
  EnterpriseApplicationRequest,
  EnterpriseApplicationResponse,
  ApplicationStatusResponse,
  SignContractRequest,
  SignContractResponse,
  OnboardingStatusResponse,
} from '../types/api';

/**
 * Enterprise API - Enterprise admin and application management
 * TASK-P5-016/017: 23 endpoints
 */
export const enterpriseApi = {
  // ============================================================================
  // Dashboard
  // ============================================================================

  /**
   * GET /v1/enterprise/dashboard/overview
   * Get enterprise dashboard overview
   */
  getDashboardOverview: () =>
    apiClient.get<EnterpriseDashboardOverview>('/v1/enterprise/dashboard/overview'),

  /**
   * GET /v1/enterprise/dashboard/tvl
   * Get enterprise TVL data
   */
  getTVL: (params?: { period?: string }) =>
    apiClient.get<EnterpriseTVLResponse>('/v1/enterprise/dashboard/tvl', params),

  /**
   * GET /v1/enterprise/dashboard/volume
   * Get enterprise volume data
   */
  getVolume: (params?: { period?: string }) =>
    apiClient.get<EnterpriseVolumeResponse>('/v1/enterprise/dashboard/volume', params),

  // ============================================================================
  // Transactions
  // ============================================================================

  /**
   * GET /v1/enterprise/transactions
   * Get enterprise transactions
   */
  getTransactions: (params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    type?: string;
    startDate?: string;
    endDate?: string;
  }) =>
    apiClient.get<EnterpriseTransactionsResponse>('/v1/enterprise/transactions', params),

  /**
   * GET /v1/enterprise/transactions/:id
   * Get transaction details
   */
  getTransaction: (transactionId: string) =>
    apiClient.get<EnterpriseTransactionDetail>(`/v1/enterprise/transactions/${transactionId}`),

  /**
   * POST /v1/enterprise/transactions/export
   * Export transactions to CSV/Excel
   */
  exportTransactions: (data: ExportTransactionsRequest) =>
    apiClient.post<ExportTransactionsResponse>('/v1/enterprise/transactions/export', data),

  // ============================================================================
  // Users
  // ============================================================================

  /**
   * GET /v1/enterprise/users
   * Get enterprise users
   */
  getUsers: (params?: { page?: number; pageSize?: number; role?: string }) =>
    apiClient.get<EnterpriseUsersResponse>('/v1/enterprise/users', params),

  /**
   * GET /v1/enterprise/users/:id
   * Get user details
   */
  getUser: (userId: string) =>
    apiClient.get<EnterpriseUserDetail>(`/v1/enterprise/users/${userId}`),

  /**
   * POST /v1/enterprise/users
   * Create new enterprise user
   */
  createUser: (data: CreateEnterpriseUserRequest) =>
    apiClient.post<CreateEnterpriseUserResponse>('/v1/enterprise/users', data),

  /**
   * POST /v1/enterprise/users/invite
   * Invite a user to enterprise account
   */
  inviteUser: (data: InviteUserRequest) =>
    apiClient.post<InviteUserResponse>('/v1/enterprise/users/invite', data),

  /**
   * POST /v1/enterprise/users/:id/role
   * Update user's role
   */
  updateUserRole: (userId: string, data: UpdateUserRoleRequest) =>
    apiClient.post<UpdateUserRoleResponse>(`/v1/enterprise/users/${userId}/role`, data),

  // ============================================================================
  // API Keys
  // ============================================================================

  /**
   * GET /v1/enterprise/api-keys
   * Get enterprise API keys
   */
  getApiKeys: () =>
    apiClient.get<EnterpriseApiKeysResponse>('/v1/enterprise/api-keys'),

  /**
   * POST /v1/enterprise/api-keys
   * Create new API key
   */
  createApiKey: (data: CreateApiKeyRequest) =>
    apiClient.post<CreateApiKeyResponse>('/v1/enterprise/api-keys', data),

  /**
   * GET /v1/enterprise/api-keys/:id/usage
   * Get API key usage statistics
   */
  getApiKeyUsage: (keyId: string) =>
    apiClient.get<ApiKeyUsageResponse>(`/v1/enterprise/api-keys/${keyId}/usage`),

  // ============================================================================
  // Settings
  // ============================================================================

  /**
   * GET /v1/enterprise/settings
   * Get enterprise settings
   */
  getSettings: () =>
    apiClient.get<EnterpriseSettingsResponse>('/v1/enterprise/settings'),

  /**
   * POST /v1/enterprise/settings
   * Update enterprise settings
   */
  updateSettings: (data: UpdateEnterpriseSettingsRequest) =>
    apiClient.post<UpdateEnterpriseSettingsResponse>('/v1/enterprise/settings', data),

  /**
   * GET /v1/enterprise/security-settings
   * Get enterprise security settings
   */
  getSecuritySettings: () =>
    apiClient.get<EnterpriseSecuritySettingsResponse>('/v1/enterprise/security-settings'),

  // ============================================================================
  // Reports & Audit
  // ============================================================================

  /**
   * GET /v1/enterprise/reports
   * Get enterprise reports
   */
  getReports: (params?: { type?: string; period?: string }) =>
    apiClient.get<EnterpriseReportsResponse>('/v1/enterprise/reports', params),

  /**
   * GET /v1/enterprise/audit-log
   * Get enterprise audit log
   */
  getAuditLog: (params?: {
    page?: number;
    pageSize?: number;
    action?: string;
    actor?: string;
  }) =>
    apiClient.get<EnterpriseAuditLogResponse>('/v1/enterprise/audit-log', params),

  // ============================================================================
  // Application Flow (TASK-P5-017)
  // ============================================================================

  /**
   * POST /v1/enterprise/apply
   * Submit enterprise application
   */
  submitApplication: (data: EnterpriseApplicationRequest) =>
    apiClient.post<EnterpriseApplicationResponse>('/v1/enterprise/apply', data),

  /**
   * GET /v1/enterprise/application/:id
   * Get application status
   */
  getApplicationStatus: (applicationId: string) =>
    apiClient.get<ApplicationStatusResponse>(`/v1/enterprise/application/${applicationId}`),

  /**
   * POST /v1/enterprise/contract/sign
   * Sign enterprise contract
   */
  signContract: (data: SignContractRequest) =>
    apiClient.post<SignContractResponse>('/v1/enterprise/contract/sign', data),

  /**
   * GET /v1/enterprise/onboarding
   * Get onboarding status
   */
  getOnboardingStatus: () =>
    apiClient.get<OnboardingStatusResponse>('/v1/enterprise/onboarding'),
};
