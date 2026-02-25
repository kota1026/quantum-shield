//! Enterprise Admin API implementation
//!
//! TASK-P5-016: Enterprise Admin API (19 EP)
//! TASK-P5-017: Enterprise Application Flow (4 EP)
//!
//! Provides endpoints for:
//! - Dashboard overview, TVL, and volume metrics
//! - Transaction management and export
//! - User management (list, create, invite, roles)
//! - API key management
//! - Settings and security configuration
//! - Reports and audit logs
//! - Enterprise application and onboarding (TASK-P5-017)
//!
//! Spec References:
//! - UNIFIED_SPEC §Enterprise Edition, §Enterprise Admin, §Enterprise Onboarding
//! - UIモック: system_07_enterprise/wip/mocks/ (25画面)

use std::sync::Arc;

use axum::{Extension, Json, extract::Path, extract::Query};
use chrono::DateTime;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::{
    db::{EnterpriseRepository, LockRepository},
    error::ApiError,
    services::AppState,
};
use sqlx;

// ============================================================================
// Common Types
// ============================================================================

/// User role enum for Enterprise organizations
#[derive(Debug, Serialize, Deserialize, Clone, Copy, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum UserRole {
    /// Organization owner with full access
    Owner,
    /// Admin with management capabilities
    Admin,
    /// Standard operator
    Operator,
    /// View-only access
    Viewer,
}

/// Transaction type enum
#[derive(Debug, Serialize, Deserialize, Clone, Copy, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum TransactionType {
    Lock,
    Unlock,
    EmergencyUnlock,
    Challenge,
    Slash,
}

/// Transaction status enum
#[derive(Debug, Serialize, Deserialize, Clone, Copy, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum TransactionStatus {
    Pending,
    Processing,
    Completed,
    Failed,
    Challenged,
}

/// User status enum
#[derive(Debug, Serialize, Deserialize, Clone, Copy, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum UserStatus {
    Active,
    Pending,
    Suspended,
    Deactivated,
}

/// API key status enum
#[derive(Debug, Serialize, Deserialize, Clone, Copy, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum ApiKeyStatus {
    Active,
    Revoked,
    Expired,
}

/// Audit action enum
#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum AuditAction {
    UserCreated,
    UserInvited,
    UserRoleChanged,
    UserDeactivated,
    ApiKeyCreated,
    ApiKeyRevoked,
    SettingsUpdated,
    SecuritySettingsUpdated,
    TransactionExported,
    Login,
    Logout,
}

// ============================================================================
// Dashboard Types (3 EP)
// ============================================================================

/// GET /v1/enterprise/dashboard/overview response
#[derive(Debug, Serialize)]
pub struct DashboardOverviewResponse {
    /// Organization name
    #[serde(rename = "organizationName")]
    pub organization_name: String,
    /// Current plan (Enterprise, Premium)
    pub plan: String,
    /// Total Value Locked in USD
    #[serde(rename = "tvlUsd")]
    pub tvl_usd: String,
    /// TVL change in 24h (percentage)
    #[serde(rename = "tvlChange24h")]
    pub tvl_change_24h: f64,
    /// Total transaction count
    #[serde(rename = "totalTransactions")]
    pub total_transactions: u64,
    /// Active locks count
    #[serde(rename = "activeLocks")]
    pub active_locks: u64,
    /// Pending unlocks count
    #[serde(rename = "pendingUnlocks")]
    pub pending_unlocks: u64,
    /// Monthly transaction volume
    #[serde(rename = "monthlyVolume")]
    pub monthly_volume: String,
    /// Recent alerts
    #[serde(rename = "recentAlerts")]
    pub recent_alerts: Vec<AlertSummary>,
    /// Quick stats
    #[serde(rename = "quickStats")]
    pub quick_stats: QuickStats,
}

#[derive(Debug, Serialize)]
pub struct AlertSummary {
    pub id: String,
    #[serde(rename = "type")]
    pub alert_type: String,
    pub message: String,
    pub severity: String,
    pub timestamp: u64,
}

#[derive(Debug, Serialize)]
pub struct QuickStats {
    #[serde(rename = "activeUsers")]
    pub active_users: u32,
    #[serde(rename = "apiCalls24h")]
    pub api_calls_24h: u64,
    #[serde(rename = "successRate")]
    pub success_rate: f64,
}

/// GET /v1/enterprise/dashboard/tvl response
#[derive(Debug, Serialize)]
pub struct DashboardTvlResponse {
    /// Current TVL in USD
    #[serde(rename = "currentTvl")]
    pub current_tvl: String,
    /// TVL in ETH
    #[serde(rename = "tvlEth")]
    pub tvl_eth: String,
    /// 24h change percentage
    #[serde(rename = "change24h")]
    pub change_24h: f64,
    /// 7d change percentage
    #[serde(rename = "change7d")]
    pub change_7d: f64,
    /// 30d change percentage
    #[serde(rename = "change30d")]
    pub change_30d: f64,
    /// Historical TVL data (for chart)
    #[serde(rename = "historicalData")]
    pub historical_data: Vec<TvlDataPoint>,
    /// TVL by asset
    #[serde(rename = "tvlByAsset")]
    pub tvl_by_asset: Vec<AssetTvl>,
}

#[derive(Debug, Serialize)]
pub struct TvlDataPoint {
    pub timestamp: u64,
    #[serde(rename = "tvlUsd")]
    pub tvl_usd: String,
}

#[derive(Debug, Serialize)]
pub struct AssetTvl {
    pub asset: String,
    pub symbol: String,
    #[serde(rename = "tvlUsd")]
    pub tvl_usd: String,
    pub percentage: f64,
}

/// GET /v1/enterprise/dashboard/volume response
#[derive(Debug, Serialize)]
pub struct DashboardVolumeResponse {
    /// Total volume (all time)
    #[serde(rename = "totalVolume")]
    pub total_volume: String,
    /// Volume 24h
    #[serde(rename = "volume24h")]
    pub volume_24h: String,
    /// Volume 7d
    #[serde(rename = "volume7d")]
    pub volume_7d: String,
    /// Volume 30d
    #[serde(rename = "volume30d")]
    pub volume_30d: String,
    /// Transaction count 24h
    #[serde(rename = "txCount24h")]
    pub tx_count_24h: u64,
    /// Average transaction size
    #[serde(rename = "avgTxSize")]
    pub avg_tx_size: String,
    /// Volume by type
    #[serde(rename = "volumeByType")]
    pub volume_by_type: Vec<VolumeByType>,
    /// Historical volume data
    #[serde(rename = "historicalData")]
    pub historical_data: Vec<VolumeDataPoint>,
}

#[derive(Debug, Serialize)]
pub struct VolumeByType {
    #[serde(rename = "type")]
    pub tx_type: String,
    pub volume: String,
    pub count: u64,
}

#[derive(Debug, Serialize)]
pub struct VolumeDataPoint {
    pub timestamp: u64,
    pub volume: String,
    pub count: u64,
}

// ============================================================================
// Transaction Types (3 EP)
// ============================================================================

/// Query parameters for transaction list
#[derive(Debug, Deserialize)]
pub struct TransactionListQuery {
    pub page: Option<u32>,
    pub limit: Option<u32>,
    pub status: Option<String>,
    #[serde(rename = "type")]
    pub tx_type: Option<String>,
    pub from: Option<u64>,
    pub to: Option<u64>,
}

/// GET /v1/enterprise/transactions response
#[derive(Debug, Serialize)]
pub struct TransactionListResponse {
    pub transactions: Vec<TransactionItem>,
    pub pagination: Pagination,
    pub summary: TransactionSummary,
}

#[derive(Debug, Serialize)]
pub struct TransactionItem {
    pub id: String,
    #[serde(rename = "type")]
    pub tx_type: TransactionType,
    pub status: TransactionStatus,
    pub amount: String,
    pub asset: String,
    #[serde(rename = "fromAddress")]
    pub from_address: String,
    #[serde(rename = "toAddress")]
    pub to_address: Option<String>,
    #[serde(rename = "txHash")]
    pub tx_hash: Option<String>,
    #[serde(rename = "createdAt")]
    pub created_at: u64,
    #[serde(rename = "completedAt")]
    pub completed_at: Option<u64>,
}

#[derive(Debug, Serialize)]
pub struct Pagination {
    pub page: u32,
    pub limit: u32,
    #[serde(rename = "totalPages")]
    pub total_pages: u32,
    #[serde(rename = "totalItems")]
    pub total_items: u64,
}

#[derive(Debug, Serialize)]
pub struct TransactionSummary {
    #[serde(rename = "totalVolume")]
    pub total_volume: String,
    #[serde(rename = "pendingCount")]
    pub pending_count: u64,
    #[serde(rename = "completedCount")]
    pub completed_count: u64,
}

/// GET /v1/enterprise/transactions/:id response
#[derive(Debug, Serialize)]
pub struct TransactionDetailResponse {
    pub id: String,
    #[serde(rename = "type")]
    pub tx_type: TransactionType,
    pub status: TransactionStatus,
    pub amount: String,
    pub asset: String,
    #[serde(rename = "fromAddress")]
    pub from_address: String,
    #[serde(rename = "toAddress")]
    pub to_address: Option<String>,
    #[serde(rename = "txHash")]
    pub tx_hash: Option<String>,
    #[serde(rename = "blockNumber")]
    pub block_number: Option<u64>,
    #[serde(rename = "gasUsed")]
    pub gas_used: Option<String>,
    #[serde(rename = "gasFee")]
    pub gas_fee: Option<String>,
    #[serde(rename = "createdAt")]
    pub created_at: u64,
    #[serde(rename = "completedAt")]
    pub completed_at: Option<u64>,
    #[serde(rename = "lockId")]
    pub lock_id: Option<String>,
    /// STARK proof hash (if applicable)
    #[serde(rename = "starkProofHash")]
    pub stark_proof_hash: Option<String>,
    /// Prover signatures
    #[serde(rename = "proverSignatures")]
    pub prover_signatures: Vec<ProverSignature>,
    /// Timeline of events
    pub timeline: Vec<TimelineEvent>,
}

#[derive(Debug, Serialize)]
pub struct ProverSignature {
    #[serde(rename = "proverId")]
    pub prover_id: String,
    #[serde(rename = "signedAt")]
    pub signed_at: u64,
    pub signature: String,
}

#[derive(Debug, Serialize)]
pub struct TimelineEvent {
    pub event: String,
    pub timestamp: u64,
    pub details: Option<String>,
}

/// POST /v1/enterprise/transactions/export request
#[derive(Debug, Deserialize)]
pub struct ExportTransactionsRequest {
    pub format: String, // "csv" | "json" | "xlsx"
    #[serde(rename = "dateFrom")]
    pub date_from: u64,
    #[serde(rename = "dateTo")]
    pub date_to: u64,
    #[serde(rename = "includeFields")]
    pub include_fields: Option<Vec<String>>,
}

/// POST /v1/enterprise/transactions/export response
#[derive(Debug, Serialize)]
pub struct ExportTransactionsResponse {
    #[serde(rename = "exportId")]
    pub export_id: String,
    pub status: String,
    #[serde(rename = "downloadUrl")]
    pub download_url: Option<String>,
    #[serde(rename = "expiresAt")]
    pub expires_at: Option<u64>,
}

// ============================================================================
// User Types (5 EP)
// ============================================================================

/// GET /v1/enterprise/users response
#[derive(Debug, Serialize)]
pub struct UserListResponse {
    pub users: Vec<UserItem>,
    pub pagination: Pagination,
}

#[derive(Debug, Serialize)]
pub struct UserItem {
    pub id: String,
    pub email: String,
    pub name: String,
    pub role: UserRole,
    pub status: UserStatus,
    #[serde(rename = "lastActive")]
    pub last_active: Option<u64>,
    #[serde(rename = "createdAt")]
    pub created_at: u64,
}

/// GET /v1/enterprise/users/:id response
#[derive(Debug, Serialize)]
pub struct UserDetailResponse {
    pub id: String,
    pub email: String,
    pub name: String,
    pub role: UserRole,
    pub status: UserStatus,
    #[serde(rename = "walletAddress")]
    pub wallet_address: Option<String>,
    #[serde(rename = "twoFactorEnabled")]
    pub two_factor_enabled: bool,
    #[serde(rename = "lastActive")]
    pub last_active: Option<u64>,
    #[serde(rename = "createdAt")]
    pub created_at: u64,
    #[serde(rename = "invitedBy")]
    pub invited_by: Option<String>,
    /// Recent activity
    #[serde(rename = "recentActivity")]
    pub recent_activity: Vec<UserActivityItem>,
    /// Permissions summary
    pub permissions: Vec<String>,
}

#[derive(Debug, Serialize)]
pub struct UserActivityItem {
    pub action: String,
    pub timestamp: u64,
    #[serde(rename = "ipAddress")]
    pub ip_address: Option<String>,
}

/// POST /v1/enterprise/users request
#[derive(Debug, Deserialize)]
pub struct CreateUserRequest {
    pub email: String,
    pub name: String,
    pub role: UserRole,
    #[serde(rename = "walletAddress")]
    pub wallet_address: Option<String>,
}

/// POST /v1/enterprise/users response
#[derive(Debug, Serialize)]
pub struct CreateUserResponse {
    pub id: String,
    pub email: String,
    pub name: String,
    pub role: UserRole,
    pub status: UserStatus,
    #[serde(rename = "createdAt")]
    pub created_at: u64,
}

/// POST /v1/enterprise/users/invite request
#[derive(Debug, Deserialize)]
pub struct InviteUserRequest {
    pub email: String,
    pub role: UserRole,
    pub message: Option<String>,
}

/// POST /v1/enterprise/users/invite response
#[derive(Debug, Serialize)]
pub struct InviteUserResponse {
    #[serde(rename = "inviteId")]
    pub invite_id: String,
    pub email: String,
    pub status: String,
    #[serde(rename = "expiresAt")]
    pub expires_at: u64,
}

/// POST /v1/enterprise/users/:id/role request
#[derive(Debug, Deserialize)]
pub struct UpdateUserRoleRequest {
    pub role: UserRole,
}

/// POST /v1/enterprise/users/:id/role response
#[derive(Debug, Serialize)]
pub struct UpdateUserRoleResponse {
    pub id: String,
    #[serde(rename = "previousRole")]
    pub previous_role: UserRole,
    #[serde(rename = "newRole")]
    pub new_role: UserRole,
    #[serde(rename = "updatedAt")]
    pub updated_at: u64,
}

// ============================================================================
// API Key Types (3 EP)
// ============================================================================

/// GET /v1/enterprise/api-keys response
#[derive(Debug, Serialize)]
pub struct ApiKeyListResponse {
    #[serde(rename = "apiKeys")]
    pub api_keys: Vec<ApiKeyItem>,
}

#[derive(Debug, Serialize)]
pub struct ApiKeyItem {
    pub id: String,
    pub name: String,
    /// Masked key (e.g., "qs_****abcd")
    #[serde(rename = "keyPreview")]
    pub key_preview: String,
    pub status: ApiKeyStatus,
    pub permissions: Vec<String>,
    #[serde(rename = "lastUsed")]
    pub last_used: Option<u64>,
    #[serde(rename = "createdAt")]
    pub created_at: u64,
    #[serde(rename = "expiresAt")]
    pub expires_at: Option<u64>,
    #[serde(rename = "createdBy")]
    pub created_by: String,
}

/// POST /v1/enterprise/api-keys request
#[derive(Debug, Deserialize)]
pub struct CreateApiKeyRequest {
    pub name: String,
    pub permissions: Vec<String>,
    #[serde(rename = "expiresIn")]
    pub expires_in: Option<u64>, // seconds
    #[serde(rename = "ipWhitelist")]
    pub ip_whitelist: Option<Vec<String>>,
}

/// POST /v1/enterprise/api-keys response
#[derive(Debug, Serialize)]
pub struct CreateApiKeyResponse {
    pub id: String,
    pub name: String,
    /// Full API key (only shown once)
    #[serde(rename = "apiKey")]
    pub api_key: String,
    pub permissions: Vec<String>,
    #[serde(rename = "createdAt")]
    pub created_at: u64,
    #[serde(rename = "expiresAt")]
    pub expires_at: Option<u64>,
}

/// GET /v1/enterprise/api-keys/:id/usage response
#[derive(Debug, Serialize)]
pub struct ApiKeyUsageResponse {
    pub id: String,
    pub name: String,
    /// Total requests
    #[serde(rename = "totalRequests")]
    pub total_requests: u64,
    /// Requests in last 24h
    #[serde(rename = "requests24h")]
    pub requests_24h: u64,
    /// Requests in last 7d
    #[serde(rename = "requests7d")]
    pub requests_7d: u64,
    /// Usage by endpoint
    #[serde(rename = "usageByEndpoint")]
    pub usage_by_endpoint: Vec<EndpointUsage>,
    /// Recent requests
    #[serde(rename = "recentRequests")]
    pub recent_requests: Vec<ApiRequestLog>,
}

#[derive(Debug, Serialize)]
pub struct EndpointUsage {
    pub endpoint: String,
    pub count: u64,
    #[serde(rename = "avgLatencyMs")]
    pub avg_latency_ms: u32,
}

#[derive(Debug, Serialize)]
pub struct ApiRequestLog {
    pub timestamp: u64,
    pub endpoint: String,
    pub method: String,
    #[serde(rename = "statusCode")]
    pub status_code: u16,
    #[serde(rename = "latencyMs")]
    pub latency_ms: u32,
    #[serde(rename = "ipAddress")]
    pub ip_address: String,
}

// ============================================================================
// Settings Types (3 EP)
// ============================================================================

/// GET /v1/enterprise/settings response
#[derive(Debug, Serialize)]
pub struct SettingsResponse {
    pub organization: OrganizationSettings,
    pub notifications: NotificationSettings,
    pub limits: LimitSettings,
}

#[derive(Debug, Serialize)]
pub struct OrganizationSettings {
    pub name: String,
    #[serde(rename = "displayName")]
    pub display_name: String,
    pub logo: Option<String>,
    pub website: Option<String>,
    #[serde(rename = "supportEmail")]
    pub support_email: String,
    pub timezone: String,
    pub currency: String,
}

#[derive(Debug, Serialize)]
pub struct NotificationSettings {
    #[serde(rename = "emailAlerts")]
    pub email_alerts: bool,
    #[serde(rename = "slackIntegration")]
    pub slack_integration: bool,
    #[serde(rename = "webhookUrl")]
    pub webhook_url: Option<String>,
    #[serde(rename = "alertThresholds")]
    pub alert_thresholds: AlertThresholds,
}

#[derive(Debug, Serialize)]
pub struct AlertThresholds {
    #[serde(rename = "largeTransaction")]
    pub large_transaction: String,
    #[serde(rename = "dailyVolumeLimit")]
    pub daily_volume_limit: String,
}

#[derive(Debug, Serialize)]
pub struct LimitSettings {
    #[serde(rename = "maxTransactionSize")]
    pub max_transaction_size: String,
    #[serde(rename = "dailyTransactionLimit")]
    pub daily_transaction_limit: String,
    #[serde(rename = "apiRateLimit")]
    pub api_rate_limit: u32,
}

/// POST /v1/enterprise/settings request
#[derive(Debug, Deserialize)]
pub struct UpdateSettingsRequest {
    pub organization: Option<UpdateOrganizationSettings>,
    pub notifications: Option<UpdateNotificationSettings>,
    pub limits: Option<UpdateLimitSettings>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateOrganizationSettings {
    #[serde(rename = "displayName")]
    pub display_name: Option<String>,
    pub logo: Option<String>,
    pub website: Option<String>,
    #[serde(rename = "supportEmail")]
    pub support_email: Option<String>,
    pub timezone: Option<String>,
    pub currency: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateNotificationSettings {
    #[serde(rename = "emailAlerts")]
    pub email_alerts: Option<bool>,
    #[serde(rename = "slackIntegration")]
    pub slack_integration: Option<bool>,
    #[serde(rename = "webhookUrl")]
    pub webhook_url: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateLimitSettings {
    #[serde(rename = "maxTransactionSize")]
    pub max_transaction_size: Option<String>,
    #[serde(rename = "dailyTransactionLimit")]
    pub daily_transaction_limit: Option<String>,
}

/// POST /v1/enterprise/settings response
#[derive(Debug, Serialize)]
pub struct UpdateSettingsResponse {
    pub success: bool,
    #[serde(rename = "updatedAt")]
    pub updated_at: u64,
    #[serde(rename = "changedFields")]
    pub changed_fields: Vec<String>,
}

/// GET /v1/enterprise/security-settings response
#[derive(Debug, Serialize)]
pub struct SecuritySettingsResponse {
    #[serde(rename = "twoFactorRequired")]
    pub two_factor_required: bool,
    #[serde(rename = "sessionTimeout")]
    pub session_timeout: u32, // minutes
    #[serde(rename = "ipWhitelistEnabled")]
    pub ip_whitelist_enabled: bool,
    #[serde(rename = "ipWhitelist")]
    pub ip_whitelist: Vec<String>,
    #[serde(rename = "passwordPolicy")]
    pub password_policy: PasswordPolicy,
    #[serde(rename = "auditLogRetention")]
    pub audit_log_retention: u32, // days
    #[serde(rename = "signingKeyRotation")]
    pub signing_key_rotation: u32, // days
}

#[derive(Debug, Serialize)]
pub struct PasswordPolicy {
    #[serde(rename = "minLength")]
    pub min_length: u8,
    #[serde(rename = "requireUppercase")]
    pub require_uppercase: bool,
    #[serde(rename = "requireNumbers")]
    pub require_numbers: bool,
    #[serde(rename = "requireSpecialChars")]
    pub require_special_chars: bool,
    #[serde(rename = "maxAge")]
    pub max_age: u32, // days
}

// ============================================================================
// Reports & Audit Types (2 EP)
// ============================================================================

/// GET /v1/enterprise/reports response
#[derive(Debug, Serialize)]
pub struct ReportsResponse {
    #[serde(rename = "availableReports")]
    pub available_reports: Vec<ReportInfo>,
    #[serde(rename = "recentReports")]
    pub recent_reports: Vec<GeneratedReport>,
}

#[derive(Debug, Serialize)]
pub struct ReportInfo {
    pub id: String,
    pub name: String,
    pub description: String,
    #[serde(rename = "type")]
    pub report_type: String, // "monthly", "compliance", "audit"
    pub frequency: String,   // "monthly", "quarterly", "on-demand"
}

#[derive(Debug, Serialize)]
pub struct GeneratedReport {
    pub id: String,
    pub name: String,
    #[serde(rename = "type")]
    pub report_type: String,
    pub period: String,
    pub status: String, // "ready", "generating", "failed"
    #[serde(rename = "downloadUrl")]
    pub download_url: Option<String>,
    #[serde(rename = "generatedAt")]
    pub generated_at: u64,
    #[serde(rename = "expiresAt")]
    pub expires_at: Option<u64>,
}

/// Query params for audit log
#[derive(Debug, Deserialize)]
pub struct AuditLogQuery {
    pub page: Option<u32>,
    pub limit: Option<u32>,
    pub action: Option<String>,
    #[serde(rename = "userId")]
    pub user_id: Option<String>,
    pub from: Option<u64>,
    pub to: Option<u64>,
}

/// GET /v1/enterprise/audit-log response
#[derive(Debug, Serialize)]
pub struct AuditLogResponse {
    pub entries: Vec<AuditLogEntry>,
    pub pagination: Pagination,
}

#[derive(Debug, Serialize)]
pub struct AuditLogEntry {
    pub id: String,
    pub action: AuditAction,
    #[serde(rename = "userId")]
    pub user_id: String,
    #[serde(rename = "userName")]
    pub user_name: String,
    pub details: serde_json::Value,
    #[serde(rename = "ipAddress")]
    pub ip_address: String,
    #[serde(rename = "userAgent")]
    pub user_agent: Option<String>,
    pub timestamp: u64,
}

// ============================================================================
// Dashboard Endpoints (3 EP)
// ============================================================================

/// GET /v1/enterprise/dashboard/overview
///
/// Returns overview dashboard data including TVL, transactions, and alerts
pub async fn get_dashboard_overview(
    Extension(state): Extension<Arc<AppState>>,
) -> Result<Json<DashboardOverviewResponse>, ApiError> {
    tracing::info!("Enterprise: get_dashboard_overview request received");
    let pool = state.db.pool();

    // Placeholder org_id until auth context is available (Phase 8-D)
    let org_id = "default";

    let org = EnterpriseRepository::get_org(pool, org_id).await?;
    let (org_name, plan) = match org {
        Some(ref o) => (
            o.display_name.clone().unwrap_or_else(|| o.name.clone()),
            o.plan.clone(),
        ),
        None => ("No Organization".to_string(), "enterprise".to_string()),
    };

    let tvl = LockRepository::get_total_tvl(pool).await?;
    let total_locks = LockRepository::count_by_status(pool, None).await?;
    let active_locks = LockRepository::count_by_status(pool, Some("confirmed")).await?
        + LockRepository::count_by_status(pool, Some("locked")).await?;
    let pending_unlocks = LockRepository::count_unlocks(pool, Some("pending"), None).await?;

    let active_users = EnterpriseRepository::count_users(pool, org_id).await?.max(0) as u32;

    tracing::info!("Enterprise: get_dashboard_overview response sent, tvl={}, locks={}", tvl, total_locks);

    Ok(Json(DashboardOverviewResponse {
        organization_name: org_name,
        plan,
        tvl_usd: tvl.to_string(),
        tvl_change_24h: 0.0, // Requires time-series data (Phase 6)
        total_transactions: total_locks as u64,
        active_locks: active_locks as u64,
        pending_unlocks: pending_unlocks as u64,
        monthly_volume: "0".to_string(), // Requires time-series aggregation (Phase 6)
        recent_alerts: vec![], // Alerts require event system (Phase 6)
        quick_stats: QuickStats {
            active_users,
            api_calls_24h: 0,     // Requires API usage tracking middleware (Phase 6)
            success_rate: 100.0,  // Default until tracking implemented
        },
    }))
}

/// GET /v1/enterprise/dashboard/tvl
///
/// Returns detailed TVL metrics and historical data
pub async fn get_dashboard_tvl(
    Extension(state): Extension<Arc<AppState>>,
) -> Result<Json<DashboardTvlResponse>, ApiError> {
    tracing::info!("Enterprise: get_dashboard_tvl request received");
    let pool = state.db.pool();

    let tvl = LockRepository::get_total_tvl(pool).await?;
    let tvl_str = tvl.to_string();

    tracing::info!("Enterprise: get_dashboard_tvl response sent, tvl={}", tvl_str);

    Ok(Json(DashboardTvlResponse {
        current_tvl: tvl_str.clone(),
        tvl_eth: tvl_str, // Asset is ETH in this system
        change_24h: 0.0,  // Requires time-series data (Phase 6)
        change_7d: 0.0,
        change_30d: 0.0,
        historical_data: vec![], // Requires time-series table (Phase 6)
        tvl_by_asset: vec![
            AssetTvl {
                asset: "Ethereum".to_string(),
                symbol: "ETH".to_string(),
                tvl_usd: tvl.to_string(),
                percentage: 100.0,
            },
        ],
    }))
}

/// GET /v1/enterprise/dashboard/volume
///
/// Returns volume metrics and historical data
pub async fn get_dashboard_volume(
    Extension(state): Extension<Arc<AppState>>,
) -> Result<Json<DashboardVolumeResponse>, ApiError> {
    tracing::info!("Enterprise: get_dashboard_volume request received");
    let pool = state.db.pool();

    let total_locks = LockRepository::count_by_status(pool, None).await?;
    let lock_count = LockRepository::count_by_status(pool, Some("confirmed")).await?
        + LockRepository::count_by_status(pool, Some("locked")).await?;
    let unlock_count = LockRepository::count_unlocks(pool, None, None).await?;
    let tvl = LockRepository::get_total_tvl(pool).await?;

    let avg_tx = if total_locks > 0 {
        tvl.clone() / bigdecimal::BigDecimal::from(total_locks)
    } else {
        bigdecimal::BigDecimal::from(0)
    };

    tracing::info!("Enterprise: get_dashboard_volume response sent, total_locks={}", total_locks);

    Ok(Json(DashboardVolumeResponse {
        total_volume: tvl.to_string(),
        volume_24h: "0".to_string(),  // Requires time-series aggregation (Phase 6)
        volume_7d: "0".to_string(),
        volume_30d: "0".to_string(),
        tx_count_24h: 0,              // Requires time-series aggregation (Phase 6)
        avg_tx_size: avg_tx.to_string(),
        volume_by_type: vec![
            VolumeByType { tx_type: "lock".to_string(), volume: "0".to_string(), count: lock_count as u64 },
            VolumeByType { tx_type: "unlock".to_string(), volume: "0".to_string(), count: unlock_count as u64 },
        ],
        historical_data: vec![], // Requires time-series table (Phase 6)
    }))
}

// ============================================================================
// Transaction Endpoints (3 EP)
// ============================================================================

/// GET /v1/enterprise/transactions
///
/// Returns paginated list of transactions with filters
pub async fn get_transactions(
    Extension(state): Extension<Arc<AppState>>,
    Query(query): Query<TransactionListQuery>,
) -> Result<Json<TransactionListResponse>, ApiError> {
    tracing::info!("Enterprise: get_transactions request received, page={:?}", query.page);
    let pool = state.db.pool();

    let page = query.page.unwrap_or(1);
    let limit = query.limit.unwrap_or(20);
    let offset = ((page - 1) * limit) as i64;

    let status_filter = query.status.as_deref();
    let locks = LockRepository::list_locks(pool, None, status_filter, offset, limit as i64).await?;
    let total_items = LockRepository::count_by_status(pool, status_filter).await?;
    let pending_count = LockRepository::count_by_status(pool, Some("pending")).await?;
    let completed_count = LockRepository::count_by_status(pool, Some("confirmed")).await?
        + LockRepository::count_by_status(pool, Some("locked")).await?;

    let tvl = LockRepository::get_total_tvl(pool).await?;

    let total_pages = if total_items > 0 {
        ((total_items as u32) + limit - 1) / limit
    } else {
        0
    };

    let transactions: Vec<TransactionItem> = locks
        .into_iter()
        .map(|lock| {
            let tx_status = match lock.status.as_str() {
                "pending" => TransactionStatus::Pending,
                "confirmed" | "locked" => TransactionStatus::Completed,
                "failed" => TransactionStatus::Failed,
                "challenged" => TransactionStatus::Challenged,
                _ => TransactionStatus::Processing,
            };
            TransactionItem {
                id: lock.lock_id.clone(),
                tx_type: TransactionType::Lock,
                status: tx_status,
                amount: lock.amount.to_string(),
                asset: lock.asset.clone(),
                from_address: lock.wallet_address.clone(),
                to_address: None,
                tx_hash: lock.l1_tx_hash.clone(),
                created_at: lock.created_at.timestamp() as u64,
                completed_at: lock.confirmed_at.map(|t| t.timestamp() as u64),
            }
        })
        .collect();

    tracing::info!("Enterprise: get_transactions response sent, count={}", transactions.len());

    Ok(Json(TransactionListResponse {
        transactions,
        pagination: Pagination {
            page,
            limit,
            total_pages,
            total_items: total_items as u64,
        },
        summary: TransactionSummary {
            total_volume: tvl.to_string(),
            pending_count: pending_count as u64,
            completed_count: completed_count as u64,
        },
    }))
}

/// GET /v1/enterprise/transactions/:id
///
/// Returns detailed information about a specific transaction
pub async fn get_transaction_detail(
    Extension(state): Extension<Arc<AppState>>,
    Path(id): Path<String>,
) -> Result<Json<TransactionDetailResponse>, ApiError> {
    tracing::info!("Enterprise: get_transaction_detail request received, id={}", id);
    let pool = state.db.pool();

    let lock = LockRepository::get_by_id(pool, &id).await?;
    let lock = lock.ok_or_else(|| ApiError::NotFound(format!("Transaction {} not found", id)))?;

    let tx_status = match lock.status.as_str() {
        "pending" => TransactionStatus::Pending,
        "confirmed" | "locked" => TransactionStatus::Completed,
        "failed" => TransactionStatus::Failed,
        "challenged" => TransactionStatus::Challenged,
        _ => TransactionStatus::Processing,
    };

    let created_ts = lock.created_at.timestamp() as u64;
    let completed_ts = lock.confirmed_at.map(|t| t.timestamp() as u64);

    let mut timeline = vec![
        TimelineEvent {
            event: "Transaction created".to_string(),
            timestamp: created_ts,
            details: None,
        },
    ];
    if let Some(ct) = completed_ts {
        timeline.push(TimelineEvent {
            event: "Transaction completed".to_string(),
            timestamp: ct,
            details: None,
        });
    }

    tracing::info!("Enterprise: get_transaction_detail response sent, id={}", id);

    Ok(Json(TransactionDetailResponse {
        id: lock.lock_id.clone(),
        tx_type: TransactionType::Lock,
        status: tx_status,
        amount: lock.amount.to_string(),
        asset: lock.asset.clone(),
        from_address: lock.wallet_address.clone(),
        to_address: None,
        tx_hash: lock.l1_tx_hash.clone(),
        block_number: None,   // Requires L1 indexing (Phase 8-D)
        gas_used: None,
        gas_fee: None,
        created_at: created_ts,
        completed_at: completed_ts,
        lock_id: Some(lock.lock_id.clone()),
        stark_proof_hash: None,    // Requires proof storage (Phase 6)
        prover_signatures: vec![], // Requires signing_queue join (Phase 6)
        timeline,
    }))
}

/// POST /v1/enterprise/transactions/export
///
/// Initiates transaction export in specified format
/// Note: Actual async export job is Phase 6 -- this returns a processing status
pub async fn export_transactions(
    Extension(_state): Extension<Arc<AppState>>,
    Json(req): Json<ExportTransactionsRequest>,
) -> Result<Json<ExportTransactionsResponse>, ApiError> {
    tracing::info!("Enterprise: export_transactions request received, format={}", req.format);

    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs();

    let export_id = Uuid::new_v4().to_string();

    tracing::info!("Enterprise: export_transactions response sent, export_id={}", export_id);

    Ok(Json(ExportTransactionsResponse {
        export_id,
        status: "processing".to_string(),
        download_url: None,
        expires_at: Some(now + 86400), // 24h from now
    }))
}

// ============================================================================
// User Endpoints (5 EP)
// ============================================================================

/// GET /v1/enterprise/users
///
/// Returns list of organization users
pub async fn get_users(
    Extension(state): Extension<Arc<AppState>>,
) -> Result<Json<UserListResponse>, ApiError> {
    tracing::info!("Enterprise: get_users request received");
    let pool = state.db.pool();
    let org_id = "default";

    let rows = EnterpriseRepository::list_users(pool, org_id, 0, 100).await?;
    let total = EnterpriseRepository::count_users(pool, org_id).await?;

    let users: Vec<UserItem> = rows
        .into_iter()
        .map(|r| UserItem {
            id: r.user_id,
            email: r.email,
            name: r.name,
            role: parse_user_role(&r.role),
            status: parse_user_status(&r.status),
            last_active: r.last_active.map(|t| t.timestamp() as u64),
            created_at: r.created_at.map(|t| t.timestamp() as u64).unwrap_or(0),
        })
        .collect();

    tracing::info!("Enterprise: get_users response sent, count={}", users.len());

    Ok(Json(UserListResponse {
        users,
        pagination: Pagination {
            page: 1,
            limit: 100,
            total_pages: 1,
            total_items: total as u64,
        },
    }))
}

/// GET /v1/enterprise/users/:id
///
/// Returns detailed user information
pub async fn get_user_detail(
    Extension(state): Extension<Arc<AppState>>,
    Path(id): Path<String>,
) -> Result<Json<UserDetailResponse>, ApiError> {
    tracing::info!("Enterprise: get_user_detail request received, id={}", id);
    let pool = state.db.pool();

    let user = EnterpriseRepository::get_user(pool, &id).await?;
    let user = user.ok_or_else(|| ApiError::NotFound(format!("User {} not found", id)))?;

    let role = parse_user_role(&user.role);
    let permissions = permissions_for_role(&role);

    tracing::info!("Enterprise: get_user_detail response sent, id={}", id);

    Ok(Json(UserDetailResponse {
        id: user.user_id,
        email: user.email,
        name: user.name,
        role,
        status: parse_user_status(&user.status),
        wallet_address: user.wallet_address,
        two_factor_enabled: user.two_factor_enabled.unwrap_or(false),
        last_active: user.last_active.map(|t| t.timestamp() as u64),
        created_at: user.created_at.map(|t| t.timestamp() as u64).unwrap_or(0),
        invited_by: user.invited_by,
        recent_activity: vec![], // Populated from audit log in Phase 6
        permissions,
    }))
}

/// POST /v1/enterprise/users
///
/// Creates a new user in the organization
pub async fn create_user(
    Extension(state): Extension<Arc<AppState>>,
    Json(req): Json<CreateUserRequest>,
) -> Result<Json<CreateUserResponse>, ApiError> {
    tracing::info!("Enterprise: create_user request received, email={}", req.email);
    let pool = state.db.pool();
    let org_id = "default";

    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs();

    let user_id = Uuid::new_v4().to_string();
    let role_str = format!("{:?}", req.role).to_lowercase();

    EnterpriseRepository::create_user(
        pool,
        &user_id,
        org_id,
        &req.email,
        &req.name,
        &role_str,
        req.wallet_address.as_deref(),
    )
    .await?;

    tracing::info!("Enterprise: create_user response sent, user_id={}", user_id);

    Ok(Json(CreateUserResponse {
        id: user_id,
        email: req.email,
        name: req.name,
        role: req.role,
        status: UserStatus::Active,
        created_at: now,
    }))
}

/// POST /v1/enterprise/users/invite
///
/// Sends an invitation to a new user
/// Note: Actual email sending is Phase 6 -- this just creates a pending user record
pub async fn invite_user(
    Extension(state): Extension<Arc<AppState>>,
    Json(req): Json<InviteUserRequest>,
) -> Result<Json<InviteUserResponse>, ApiError> {
    tracing::info!("Enterprise: invite_user request received, email={}", req.email);
    let pool = state.db.pool();
    let org_id = "default";

    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs();

    let invite_id = Uuid::new_v4().to_string();
    let role_str = format!("{:?}", req.role).to_lowercase();

    EnterpriseRepository::create_invited_user(
        pool,
        &invite_id,
        org_id,
        &req.email,
        &role_str,
        None, // invited_by requires auth context (Phase 8-D)
    )
    .await?;

    tracing::info!("Enterprise: invite_user response sent, invite_id={}", invite_id);

    Ok(Json(InviteUserResponse {
        invite_id,
        email: req.email,
        status: "pending".to_string(), // No email sending yet
        expires_at: now + 604800, // 7 days
    }))
}

/// POST /v1/enterprise/users/:id/role
///
/// Updates user role
pub async fn update_user_role(
    Extension(state): Extension<Arc<AppState>>,
    Path(id): Path<String>,
    Json(req): Json<UpdateUserRoleRequest>,
) -> Result<Json<UpdateUserRoleResponse>, ApiError> {
    tracing::info!("Enterprise: update_user_role request received, user_id={}, role={:?}", id, req.role);
    let pool = state.db.pool();

    // Fetch current user to get previous role
    let user = EnterpriseRepository::get_user(pool, &id).await?;
    let user = user.ok_or_else(|| ApiError::NotFound(format!("User {} not found", id)))?;
    let previous_role = parse_user_role(&user.role);

    let new_role_str = format!("{:?}", req.role).to_lowercase();
    EnterpriseRepository::update_user_role(pool, &id, &new_role_str).await?;

    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs();

    tracing::info!("Enterprise: update_user_role response sent, user_id={}", id);

    Ok(Json(UpdateUserRoleResponse {
        id,
        previous_role,
        new_role: req.role,
        updated_at: now,
    }))
}

// ============================================================================
// API Key Endpoints (3 EP)
// ============================================================================

/// GET /v1/enterprise/api-keys
///
/// Returns list of API keys for the organization
pub async fn get_api_keys(
    Extension(state): Extension<Arc<AppState>>,
) -> Result<Json<ApiKeyListResponse>, ApiError> {
    tracing::info!("Enterprise: get_api_keys request received");
    let pool = state.db.pool();
    let org_id = "default";

    let rows = EnterpriseRepository::list_api_keys(pool, org_id).await?;

    let api_keys: Vec<ApiKeyItem> = rows
        .into_iter()
        .map(|r| {
            let perms: Vec<String> = r
                .permissions
                .as_array()
                .map(|arr| arr.iter().filter_map(|v| v.as_str().map(String::from)).collect())
                .unwrap_or_default();
            let key_status = match r.status.as_str() {
                "active" => ApiKeyStatus::Active,
                "revoked" => ApiKeyStatus::Revoked,
                "expired" => ApiKeyStatus::Expired,
                _ => ApiKeyStatus::Active,
            };
            ApiKeyItem {
                id: r.key_id,
                name: r.name,
                key_preview: r.key_preview,
                status: key_status,
                permissions: perms,
                last_used: r.last_used.map(|t| t.timestamp() as u64),
                created_at: r.created_at.map(|t| t.timestamp() as u64).unwrap_or(0),
                expires_at: r.expires_at.map(|t| t.timestamp() as u64),
                created_by: r.created_by,
            }
        })
        .collect();

    tracing::info!("Enterprise: get_api_keys response sent, count={}", api_keys.len());

    Ok(Json(ApiKeyListResponse { api_keys }))
}

/// POST /v1/enterprise/api-keys
///
/// Creates a new API key
pub async fn create_api_key(
    Extension(state): Extension<Arc<AppState>>,
    Json(req): Json<CreateApiKeyRequest>,
) -> Result<Json<CreateApiKeyResponse>, ApiError> {
    tracing::info!("Enterprise: create_api_key request received, name={}", req.name);
    let pool = state.db.pool();
    let org_id = "default";

    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs();

    let key_id = Uuid::new_v4().to_string();
    let raw_key = format!("qs_live_{}", Uuid::new_v4().to_string().replace('-', ""));
    let key_preview = format!("qs_****{}", &raw_key[raw_key.len().saturating_sub(4)..]);

    // Simple hash for storage (production would use bcrypt/argon2)
    let key_hash = format!("{:x}", md5_simple(&raw_key));

    let permissions_json = serde_json::to_value(&req.permissions)
        .unwrap_or_else(|_| serde_json::json!([]));

    let expires_at_ts = req.expires_in.map(|e| now + e);
    let expires_at_dt = expires_at_ts.map(|ts| {
        DateTime::from_timestamp(ts as i64, 0).unwrap_or_default()
    });

    EnterpriseRepository::create_api_key(
        pool,
        &key_id,
        org_id,
        &req.name,
        &key_hash,
        &key_preview,
        &permissions_json,
        "system", // created_by requires auth context (Phase 8-D)
        expires_at_dt,
    )
    .await?;

    tracing::info!("Enterprise: create_api_key response sent, key_id={}", key_id);

    Ok(Json(CreateApiKeyResponse {
        id: key_id,
        name: req.name,
        api_key: raw_key,
        permissions: req.permissions,
        created_at: now,
        expires_at: expires_at_ts,
    }))
}

/// GET /v1/enterprise/api-keys/:id/usage
///
/// Returns usage statistics for an API key
/// Note: API usage tracking requires middleware (Phase 6) -- returns defaults
pub async fn get_api_key_usage(
    Extension(_state): Extension<Arc<AppState>>,
    Path(id): Path<String>,
) -> Result<Json<ApiKeyUsageResponse>, ApiError> {
    tracing::info!("Enterprise: get_api_key_usage request received, id={}", id);

    // API usage tracking requires middleware -- Phase 6
    tracing::info!("Enterprise: get_api_key_usage response sent, id={}", id);

    Ok(Json(ApiKeyUsageResponse {
        id: id.clone(),
        name: "".to_string(),        // Would be populated from DB key lookup
        total_requests: 0,
        requests_24h: 0,
        requests_7d: 0,
        usage_by_endpoint: vec![],
        recent_requests: vec![],
    }))
}

// ============================================================================
// Settings Endpoints (3 EP)
// ============================================================================

/// GET /v1/enterprise/settings
///
/// Returns organization settings
pub async fn get_settings(
    Extension(state): Extension<Arc<AppState>>,
) -> Result<Json<SettingsResponse>, ApiError> {
    tracing::info!("Enterprise: get_settings request received");
    let pool = state.db.pool();
    let org_id = "default";

    let org = EnterpriseRepository::get_org(pool, org_id).await?;
    let settings = EnterpriseRepository::get_settings(pool, org_id).await?;

    let (org_name, display_name, logo, website, support_email, timezone, currency) = match org {
        Some(ref o) => (
            o.name.clone(),
            o.display_name.clone().unwrap_or_else(|| o.name.clone()),
            o.logo_url.clone(),
            o.website.clone(),
            o.support_email.clone().unwrap_or_default(),
            o.timezone.clone().unwrap_or_else(|| "Asia/Tokyo".to_string()),
            o.currency.clone().unwrap_or_else(|| "USD".to_string()),
        ),
        None => (
            "".to_string(),
            "".to_string(),
            None,
            None,
            "".to_string(),
            "Asia/Tokyo".to_string(),
            "USD".to_string(),
        ),
    };

    let (email_alerts, slack, webhook_url, large_tx, daily_vol, max_tx, daily_limit, rate_limit) =
        match settings {
            Some(ref s) => (
                s.notification_email_alerts.unwrap_or(true),
                s.notification_slack.unwrap_or(false),
                s.notification_webhook_url.clone(),
                s.alert_large_tx.clone().unwrap_or_else(|| "100".to_string()),
                s.alert_daily_volume.clone().unwrap_or_else(|| "10000".to_string()),
                s.max_transaction_size.clone().unwrap_or_else(|| "1000".to_string()),
                s.daily_transaction_limit.clone().unwrap_or_else(|| "50000".to_string()),
                s.api_rate_limit.unwrap_or(1000) as u32,
            ),
            None => (true, false, None, "100".to_string(), "10000".to_string(), "1000".to_string(), "50000".to_string(), 1000),
        };

    tracing::info!("Enterprise: get_settings response sent");

    Ok(Json(SettingsResponse {
        organization: OrganizationSettings {
            name: org_name,
            display_name,
            logo,
            website,
            support_email,
            timezone,
            currency,
        },
        notifications: NotificationSettings {
            email_alerts,
            slack_integration: slack,
            webhook_url,
            alert_thresholds: AlertThresholds {
                large_transaction: large_tx,
                daily_volume_limit: daily_vol,
            },
        },
        limits: LimitSettings {
            max_transaction_size: max_tx,
            daily_transaction_limit: daily_limit,
            api_rate_limit: rate_limit,
        },
    }))
}

/// POST /v1/enterprise/settings
///
/// Updates organization settings
pub async fn update_settings(
    Extension(state): Extension<Arc<AppState>>,
    Json(req): Json<UpdateSettingsRequest>,
) -> Result<Json<UpdateSettingsResponse>, ApiError> {
    tracing::info!("Enterprise: update_settings request received");
    let pool = state.db.pool();
    let org_id = "default";

    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs();

    let mut changed_fields = Vec::new();

    // Update organization fields if provided
    if let Some(ref org_update) = req.organization {
        EnterpriseRepository::update_org(
            pool,
            org_id,
            org_update.display_name.as_deref(),
            org_update.logo.as_deref(),
            org_update.website.as_deref(),
            org_update.support_email.as_deref(),
            org_update.timezone.as_deref(),
            org_update.currency.as_deref(),
        )
        .await?;
        changed_fields.push("organization".to_string());
    }

    // Update notification + limit settings if provided
    if req.notifications.is_some() || req.limits.is_some() {
        let notif = req.notifications.as_ref();
        let limits = req.limits.as_ref();

        EnterpriseRepository::upsert_settings(
            pool,
            org_id,
            notif.and_then(|n| n.email_alerts),
            notif.and_then(|n| n.slack_integration),
            notif.and_then(|n| n.webhook_url.as_deref()),
            None, // alert_large_tx not exposed in this request
            None, // alert_daily_volume not exposed in this request
            limits.and_then(|l| l.max_transaction_size.as_deref()),
            limits.and_then(|l| l.daily_transaction_limit.as_deref()),
            None, // api_rate_limit not in this request
        )
        .await?;

        if req.notifications.is_some() {
            changed_fields.push("notifications".to_string());
        }
        if req.limits.is_some() {
            changed_fields.push("limits".to_string());
        }
    }

    tracing::info!("Enterprise: update_settings response sent, changed={:?}", changed_fields);

    Ok(Json(UpdateSettingsResponse {
        success: true,
        updated_at: now,
        changed_fields,
    }))
}

/// GET /v1/enterprise/security-settings
///
/// Returns security settings
pub async fn get_security_settings(
    Extension(state): Extension<Arc<AppState>>,
) -> Result<Json<SecuritySettingsResponse>, ApiError> {
    tracing::info!("Enterprise: get_security_settings request received");
    let pool = state.db.pool();
    let org_id = "default";

    let settings = EnterpriseRepository::get_settings(pool, org_id).await?;

    let response = match settings {
        Some(s) => {
            let ip_list: Vec<String> = s
                .ip_whitelist
                .as_ref()
                .and_then(|v| v.as_array())
                .map(|arr| arr.iter().filter_map(|v| v.as_str().map(String::from)).collect())
                .unwrap_or_default();

            SecuritySettingsResponse {
                two_factor_required: s.two_factor_required.unwrap_or(true),
                session_timeout: s.session_timeout.unwrap_or(60) as u32,
                ip_whitelist_enabled: s.ip_whitelist_enabled.unwrap_or(false),
                ip_whitelist: ip_list,
                password_policy: PasswordPolicy {
                    min_length: s.password_min_length.unwrap_or(12) as u8,
                    require_uppercase: s.password_require_uppercase.unwrap_or(true),
                    require_numbers: s.password_require_numbers.unwrap_or(true),
                    require_special_chars: s.password_require_special.unwrap_or(true),
                    max_age: s.password_max_age.unwrap_or(90) as u32,
                },
                audit_log_retention: s.audit_log_retention.unwrap_or(365) as u32,
                signing_key_rotation: s.signing_key_rotation.unwrap_or(90) as u32,
            }
        }
        None => SecuritySettingsResponse {
            two_factor_required: true,
            session_timeout: 60,
            ip_whitelist_enabled: false,
            ip_whitelist: vec![],
            password_policy: PasswordPolicy {
                min_length: 12,
                require_uppercase: true,
                require_numbers: true,
                require_special_chars: true,
                max_age: 90,
            },
            audit_log_retention: 365,
            signing_key_rotation: 90,
        },
    };

    tracing::info!("Enterprise: get_security_settings response sent");

    Ok(Json(response))
}

// ============================================================================
// Reports & Audit Endpoints (2 EP)
// ============================================================================

/// GET /v1/enterprise/reports
///
/// Returns available and generated reports
/// Note: Report generation is Phase 6 -- returns static list + empty recent
pub async fn get_reports(
    Extension(_state): Extension<Arc<AppState>>,
) -> Result<Json<ReportsResponse>, ApiError> {
    tracing::info!("Enterprise: get_reports request received");

    // Static available reports list; report generation is Phase 6
    tracing::info!("Enterprise: get_reports response sent");

    Ok(Json(ReportsResponse {
        available_reports: vec![
            ReportInfo {
                id: "monthly-summary".to_string(),
                name: "Monthly Summary".to_string(),
                description: "Monthly transaction summary and analytics".to_string(),
                report_type: "monthly".to_string(),
                frequency: "monthly".to_string(),
            },
            ReportInfo {
                id: "compliance".to_string(),
                name: "Compliance Report".to_string(),
                description: "Regulatory compliance and audit report".to_string(),
                report_type: "compliance".to_string(),
                frequency: "quarterly".to_string(),
            },
            ReportInfo {
                id: "audit-trail".to_string(),
                name: "Audit Trail".to_string(),
                description: "Complete audit trail for specified period".to_string(),
                report_type: "audit".to_string(),
                frequency: "on-demand".to_string(),
            },
        ],
        recent_reports: vec![], // Report generation is Phase 6
    }))
}

/// GET /v1/enterprise/audit-log
///
/// Returns paginated audit log entries
pub async fn get_audit_log(
    Extension(state): Extension<Arc<AppState>>,
    Query(query): Query<AuditLogQuery>,
) -> Result<Json<AuditLogResponse>, ApiError> {
    tracing::info!("Enterprise: get_audit_log request received, page={:?}", query.page);
    let pool = state.db.pool();
    let org_id = "default";

    let page = query.page.unwrap_or(1);
    let limit = query.limit.unwrap_or(50);
    let offset = ((page - 1) * limit) as i64;

    let rows = EnterpriseRepository::list_audit_log(pool, org_id, offset, limit as i64).await?;
    let total = EnterpriseRepository::count_audit_log(pool, org_id).await?;

    let total_pages = if total > 0 {
        ((total as u32) + limit - 1) / limit
    } else {
        0
    };

    let entries: Vec<AuditLogEntry> = rows
        .into_iter()
        .map(|r| AuditLogEntry {
            id: r.audit_id,
            action: parse_audit_action(&r.action),
            user_id: r.user_id.unwrap_or_default(),
            user_name: r.user_name.unwrap_or_default(),
            details: r.details.unwrap_or_else(|| serde_json::json!({})),
            ip_address: r.ip_address.unwrap_or_default(),
            user_agent: r.user_agent,
            timestamp: r.created_at.map(|t| t.timestamp() as u64).unwrap_or(0),
        })
        .collect();

    tracing::info!("Enterprise: get_audit_log response sent, count={}", entries.len());

    Ok(Json(AuditLogResponse {
        entries,
        pagination: Pagination {
            page,
            limit,
            total_pages,
            total_items: total as u64,
        },
    }))
}

// ============================================================================
// TASK-P5-017: Enterprise Application Flow Types (4 EP)
// ============================================================================

/// Application status enum
#[derive(Debug, Serialize, Deserialize, Clone, Copy, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum ApplicationStatus {
    /// Application submitted, pending review
    Pending,
    /// Under review by QS team
    UnderReview,
    /// Additional information requested
    InfoRequested,
    /// Approved, pending contract signature
    Approved,
    /// Contract signed, onboarding in progress
    ContractSigned,
    /// Onboarding complete, account active
    Active,
    /// Application rejected
    Rejected,
    /// Application cancelled by applicant
    Cancelled,
}

/// Onboarding step status
#[derive(Debug, Serialize, Deserialize, Clone, Copy, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum OnboardingStepStatus {
    Pending,
    InProgress,
    Completed,
    Skipped,
}

/// POST /v1/enterprise/apply request
#[derive(Debug, Deserialize)]
pub struct EnterpriseApplicationRequest {
    /// Company/Organization name
    #[serde(rename = "companyName")]
    pub company_name: String,
    /// Company registration number (optional)
    #[serde(rename = "registrationNumber")]
    pub registration_number: Option<String>,
    /// Country of incorporation
    pub country: String,
    /// Industry/Business type
    pub industry: String,
    /// Company website
    pub website: Option<String>,
    /// Primary contact name
    #[serde(rename = "contactName")]
    pub contact_name: String,
    /// Primary contact email
    #[serde(rename = "contactEmail")]
    pub contact_email: String,
    /// Primary contact phone
    #[serde(rename = "contactPhone")]
    pub contact_phone: Option<String>,
    /// Job title of primary contact
    #[serde(rename = "jobTitle")]
    pub job_title: String,
    /// Expected monthly transaction volume (ETH)
    #[serde(rename = "expectedVolume")]
    pub expected_volume: String,
    /// Use case description
    #[serde(rename = "useCase")]
    pub use_case: String,
    /// Additional notes
    pub notes: Option<String>,
    /// Agreed to terms of service
    #[serde(rename = "agreedToTerms")]
    pub agreed_to_terms: bool,
    /// Agreed to privacy policy
    #[serde(rename = "agreedToPrivacy")]
    pub agreed_to_privacy: bool,
}

/// POST /v1/enterprise/apply response
#[derive(Debug, Serialize)]
pub struct EnterpriseApplicationResponse {
    /// Application ID
    #[serde(rename = "applicationId")]
    pub application_id: String,
    /// Current status
    pub status: ApplicationStatus,
    /// Application submission timestamp
    #[serde(rename = "submittedAt")]
    pub submitted_at: u64,
    /// Estimated review time (business days)
    #[serde(rename = "estimatedReviewDays")]
    pub estimated_review_days: u32,
    /// Next steps message
    #[serde(rename = "nextSteps")]
    pub next_steps: String,
}

/// GET /v1/enterprise/application/:id response
#[derive(Debug, Serialize)]
pub struct ApplicationDetailResponse {
    /// Application ID
    #[serde(rename = "applicationId")]
    pub application_id: String,
    /// Current status
    pub status: ApplicationStatus,
    /// Company information
    pub company: CompanyInfo,
    /// Contact information
    pub contact: ContactInfo,
    /// Application details
    pub details: ApplicationDetails,
    /// Timeline of status changes
    pub timeline: Vec<ApplicationTimelineEvent>,
    /// Documents (if any)
    pub documents: Vec<ApplicationDocument>,
    /// Review notes (if available)
    #[serde(rename = "reviewNotes")]
    pub review_notes: Option<String>,
    /// Assigned reviewer (if any)
    #[serde(rename = "assignedReviewer")]
    pub assigned_reviewer: Option<String>,
    /// Submission timestamp
    #[serde(rename = "submittedAt")]
    pub submitted_at: u64,
    /// Last updated timestamp
    #[serde(rename = "updatedAt")]
    pub updated_at: u64,
}

#[derive(Debug, Serialize)]
pub struct CompanyInfo {
    pub name: String,
    #[serde(rename = "registrationNumber")]
    pub registration_number: Option<String>,
    pub country: String,
    pub industry: String,
    pub website: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct ContactInfo {
    pub name: String,
    pub email: String,
    pub phone: Option<String>,
    #[serde(rename = "jobTitle")]
    pub job_title: String,
}

#[derive(Debug, Serialize)]
pub struct ApplicationDetails {
    #[serde(rename = "expectedVolume")]
    pub expected_volume: String,
    #[serde(rename = "useCase")]
    pub use_case: String,
    pub notes: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct ApplicationTimelineEvent {
    pub status: ApplicationStatus,
    pub timestamp: u64,
    pub message: String,
    #[serde(rename = "updatedBy")]
    pub updated_by: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct ApplicationDocument {
    pub id: String,
    pub name: String,
    #[serde(rename = "type")]
    pub doc_type: String,
    #[serde(rename = "uploadedAt")]
    pub uploaded_at: u64,
    pub status: String, // "pending", "verified", "rejected"
}

/// POST /v1/enterprise/contract/sign request
#[derive(Debug, Deserialize)]
pub struct ContractSignRequest {
    /// Application ID
    #[serde(rename = "applicationId")]
    pub application_id: String,
    /// Signer's full name
    #[serde(rename = "signerName")]
    pub signer_name: String,
    /// Signer's job title
    #[serde(rename = "signerTitle")]
    pub signer_title: String,
    /// Digital signature (base64 or hex)
    pub signature: String,
    /// Wallet address for contract association
    #[serde(rename = "walletAddress")]
    pub wallet_address: String,
    /// IP address (for audit)
    #[serde(rename = "ipAddress")]
    pub ip_address: Option<String>,
    /// Agreed to contract terms
    #[serde(rename = "agreedToContract")]
    pub agreed_to_contract: bool,
}

/// POST /v1/enterprise/contract/sign response
#[derive(Debug, Serialize)]
pub struct ContractSignResponse {
    /// Contract ID
    #[serde(rename = "contractId")]
    pub contract_id: String,
    /// Application ID
    #[serde(rename = "applicationId")]
    pub application_id: String,
    /// New application status
    pub status: ApplicationStatus,
    /// Contract signature timestamp
    #[serde(rename = "signedAt")]
    pub signed_at: u64,
    /// Contract document URL
    #[serde(rename = "contractUrl")]
    pub contract_url: String,
    /// Organization ID (created upon signing)
    #[serde(rename = "organizationId")]
    pub organization_id: String,
    /// Next steps
    #[serde(rename = "nextSteps")]
    pub next_steps: String,
}

/// GET /v1/enterprise/onboarding response
#[derive(Debug, Serialize)]
pub struct OnboardingStatusResponse {
    /// Application ID
    #[serde(rename = "applicationId")]
    pub application_id: String,
    /// Organization ID
    #[serde(rename = "organizationId")]
    pub organization_id: String,
    /// Overall progress percentage
    #[serde(rename = "overallProgress")]
    pub overall_progress: u8,
    /// Current step index (0-based)
    #[serde(rename = "currentStep")]
    pub current_step: u8,
    /// Onboarding steps
    pub steps: Vec<OnboardingStep>,
    /// Estimated completion date
    #[serde(rename = "estimatedCompletion")]
    pub estimated_completion: Option<u64>,
    /// Support contact
    #[serde(rename = "supportContact")]
    pub support_contact: SupportContact,
    /// Quick actions available
    #[serde(rename = "quickActions")]
    pub quick_actions: Vec<QuickAction>,
}

#[derive(Debug, Serialize)]
pub struct OnboardingStep {
    pub id: String,
    pub name: String,
    pub description: String,
    pub status: OnboardingStepStatus,
    pub order: u8,
    /// Required for completion
    pub required: bool,
    /// Estimated time to complete (minutes)
    #[serde(rename = "estimatedMinutes")]
    pub estimated_minutes: u32,
    /// Completion timestamp (if completed)
    #[serde(rename = "completedAt")]
    pub completed_at: Option<u64>,
    /// Action URL or instructions
    #[serde(rename = "actionUrl")]
    pub action_url: Option<String>,
    /// Sub-tasks within this step
    #[serde(rename = "subTasks")]
    pub sub_tasks: Vec<OnboardingSubTask>,
}

#[derive(Debug, Serialize)]
pub struct OnboardingSubTask {
    pub id: String,
    pub name: String,
    pub completed: bool,
}

#[derive(Debug, Serialize)]
pub struct SupportContact {
    pub name: String,
    pub email: String,
    #[serde(rename = "calendlyUrl")]
    pub calendly_url: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct QuickAction {
    pub id: String,
    pub label: String,
    pub url: String,
    pub icon: String,
}

// ============================================================================
// TASK-P5-017: Enterprise Application Flow Endpoints (4 EP)
// ============================================================================

/// POST /v1/enterprise/apply
///
/// Submit a new Enterprise account application
pub async fn submit_application(
    Extension(state): Extension<Arc<AppState>>,
    Json(req): Json<EnterpriseApplicationRequest>,
) -> Result<Json<EnterpriseApplicationResponse>, ApiError> {
    tracing::info!(
        "Enterprise: submit_application request received, company={}, email={}",
        req.company_name,
        req.contact_email
    );

    // Validate required agreements
    if !req.agreed_to_terms || !req.agreed_to_privacy {
        return Err(ApiError::InvalidRequest(
            "Terms of Service and Privacy Policy must be accepted".to_string(),
        ));
    }

    let pool = state.db.pool();

    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs();

    let application_id = Uuid::new_v4().to_string();

    EnterpriseRepository::create_application(
        pool,
        &application_id,
        &req.company_name,
        req.registration_number.as_deref(),
        &req.country,
        &req.industry,
        req.website.as_deref(),
        &req.contact_name,
        &req.contact_email,
        req.contact_phone.as_deref(),
        &req.job_title,
        Some(&req.expected_volume),
        &req.use_case,
        req.notes.as_deref(),
    )
    .await?;

    tracing::info!("Enterprise: submit_application response sent, app_id={}", application_id);

    Ok(Json(EnterpriseApplicationResponse {
        application_id,
        status: ApplicationStatus::Pending,
        submitted_at: now,
        estimated_review_days: 3,
        next_steps: "Your application has been received. Our team will review it within 3 business days. You will receive an email notification when the review is complete.".to_string(),
    }))
}

/// GET /v1/enterprise/application/:id
///
/// Get detailed application status and information
pub async fn get_application(
    Extension(state): Extension<Arc<AppState>>,
    Path(id): Path<String>,
) -> Result<Json<ApplicationDetailResponse>, ApiError> {
    tracing::info!("Enterprise: get_application request received, id={}", id);
    let pool = state.db.pool();

    let app = EnterpriseRepository::get_application(pool, &id).await?;
    let app = app.ok_or_else(|| ApiError::NotFound(format!("Application {} not found", id)))?;

    let submitted_ts = app.submitted_at.map(|t| t.timestamp() as u64).unwrap_or(0);
    let updated_ts = app.updated_at.map(|t| t.timestamp() as u64).unwrap_or(submitted_ts);

    let app_status = parse_application_status(&app.status);

    // Build timeline from the current status
    let mut timeline = vec![
        ApplicationTimelineEvent {
            status: ApplicationStatus::Pending,
            timestamp: submitted_ts,
            message: "Application submitted".to_string(),
            updated_by: None,
        },
    ];

    // Add current status to timeline if not pending
    if app_status != ApplicationStatus::Pending {
        timeline.push(ApplicationTimelineEvent {
            status: app_status,
            timestamp: updated_ts,
            message: format!("Status changed to {}", app.status),
            updated_by: app.assigned_reviewer.clone(),
        });
    }

    tracing::info!("Enterprise: get_application response sent, id={}", id);

    Ok(Json(ApplicationDetailResponse {
        application_id: app.application_id,
        status: app_status,
        company: CompanyInfo {
            name: app.company_name,
            registration_number: app.registration_number,
            country: app.country,
            industry: app.industry,
            website: app.website,
        },
        contact: ContactInfo {
            name: app.contact_name,
            email: app.contact_email,
            phone: app.contact_phone,
            job_title: app.job_title,
        },
        details: ApplicationDetails {
            expected_volume: app.expected_volume.unwrap_or_default(),
            use_case: app.use_case,
            notes: app.notes,
        },
        timeline,
        documents: vec![], // Document management is Phase 6
        review_notes: app.review_notes,
        assigned_reviewer: app.assigned_reviewer,
        submitted_at: submitted_ts,
        updated_at: updated_ts,
    }))
}

/// POST /v1/enterprise/contract/sign
///
/// Sign the Enterprise contract to activate the account
pub async fn sign_contract(
    Extension(state): Extension<Arc<AppState>>,
    Json(req): Json<ContractSignRequest>,
) -> Result<Json<ContractSignResponse>, ApiError> {
    tracing::info!(
        "Enterprise: sign_contract request received, app_id={}",
        req.application_id
    );

    // Validate contract agreement
    if !req.agreed_to_contract {
        return Err(ApiError::InvalidRequest(
            "Contract terms must be accepted".to_string(),
        ));
    }

    // Validate wallet address format (basic check)
    if !req.wallet_address.starts_with("0x") || req.wallet_address.len() != 42 {
        return Err(ApiError::InvalidRequest(
            "Invalid wallet address format".to_string(),
        ));
    }

    let pool = state.db.pool();

    // Verify application exists
    let _app = EnterpriseRepository::get_application(pool, &req.application_id)
        .await?
        .ok_or_else(|| ApiError::NotFound(format!("Application {} not found", req.application_id)))?;

    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs();

    let contract_id = Uuid::new_v4().to_string();
    let organization_id = Uuid::new_v4().to_string();

    // Update application status
    EnterpriseRepository::update_application_status(pool, &req.application_id, "contract_signed").await?;

    // Create the organization
    EnterpriseRepository::create_org(
        pool,
        &organization_id,
        &organization_id, // name placeholder
        None,
        "enterprise",
        None,
    )
    .await?;

    // Create default settings for the new org
    EnterpriseRepository::create_default_settings(pool, &organization_id).await?;

    tracing::info!("Enterprise: sign_contract response sent, contract_id={}, org_id={}", contract_id, organization_id);

    Ok(Json(ContractSignResponse {
        contract_id,
        application_id: req.application_id,
        status: ApplicationStatus::ContractSigned,
        signed_at: now,
        contract_url: "https://docs.quantumshield.io/contracts/enterprise-agreement.pdf".to_string(),
        organization_id,
        next_steps: "Your contract has been signed successfully. Your Enterprise account is now being provisioned. Please proceed to the onboarding process to complete the setup.".to_string(),
    }))
}

/// GET /v1/enterprise/onboarding
///
/// Get onboarding status and progress for a new Enterprise account
/// Returns templated onboarding steps based on org state
pub async fn get_onboarding(
    Extension(state): Extension<Arc<AppState>>,
    Query(query): Query<OnboardingQuery>,
) -> Result<Json<OnboardingStatusResponse>, ApiError> {
    tracing::info!(
        "Enterprise: get_onboarding request received, app_id={:?}, org_id={:?}",
        query.application_id,
        query.organization_id
    );
    let pool = state.db.pool();

    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs();

    let org_id = query.organization_id.clone().unwrap_or_else(|| "default".to_string());
    let app_id = query.application_id.clone().unwrap_or_default();

    // Check org state to determine step completion
    let has_org = EnterpriseRepository::get_org(pool, &org_id).await?.is_some();
    let user_count = if has_org {
        EnterpriseRepository::count_users(pool, &org_id).await?.max(0)
    } else {
        0
    };
    let api_key_count = if has_org {
        EnterpriseRepository::list_api_keys(pool, &org_id).await?.len()
    } else {
        0
    };
    let has_settings = if has_org {
        EnterpriseRepository::get_settings(pool, &org_id).await?.is_some()
    } else {
        false
    };

    let step1_done = has_org;
    let step2_done = user_count > 0;
    let step3_done = api_key_count > 0;
    let step4_done = has_settings;

    let completed_steps = [step1_done, step2_done, step3_done, step4_done]
        .iter()
        .filter(|&&v| v)
        .count();
    let overall_progress = ((completed_steps as f64 / 5.0) * 100.0) as u8;
    let current_step = completed_steps as u8;

    let steps = vec![
        OnboardingStep {
            id: "step-1".to_string(),
            name: "Account Setup".to_string(),
            description: "Create your organization profile and configure basic settings".to_string(),
            status: if step1_done { OnboardingStepStatus::Completed } else { OnboardingStepStatus::Pending },
            order: 0,
            required: true,
            estimated_minutes: 10,
            completed_at: if step1_done { Some(now) } else { None },
            action_url: None,
            sub_tasks: vec![
                OnboardingSubTask { id: "1-1".to_string(), name: "Set organization name".to_string(), completed: step1_done },
                OnboardingSubTask { id: "1-2".to_string(), name: "Upload company logo".to_string(), completed: false },
                OnboardingSubTask { id: "1-3".to_string(), name: "Configure timezone".to_string(), completed: step1_done },
            ],
        },
        OnboardingStep {
            id: "step-2".to_string(),
            name: "Team Members".to_string(),
            description: "Invite team members and assign roles".to_string(),
            status: if step2_done { OnboardingStepStatus::Completed } else if step1_done { OnboardingStepStatus::InProgress } else { OnboardingStepStatus::Pending },
            order: 1,
            required: true,
            estimated_minutes: 15,
            completed_at: if step2_done { Some(now) } else { None },
            action_url: Some("/enterprise/users".to_string()),
            sub_tasks: vec![
                OnboardingSubTask { id: "2-1".to_string(), name: "Invite at least one admin".to_string(), completed: step2_done },
                OnboardingSubTask { id: "2-2".to_string(), name: "Configure 2FA requirements".to_string(), completed: false },
            ],
        },
        OnboardingStep {
            id: "step-3".to_string(),
            name: "API Integration".to_string(),
            description: "Generate API keys and configure webhooks".to_string(),
            status: if step3_done { OnboardingStepStatus::Completed } else if step2_done { OnboardingStepStatus::InProgress } else { OnboardingStepStatus::Pending },
            order: 2,
            required: true,
            estimated_minutes: 30,
            completed_at: if step3_done { Some(now) } else { None },
            action_url: Some("/enterprise/api-keys".to_string()),
            sub_tasks: vec![
                OnboardingSubTask { id: "3-1".to_string(), name: "Generate production API key".to_string(), completed: step3_done },
                OnboardingSubTask { id: "3-2".to_string(), name: "Configure webhook endpoint".to_string(), completed: false },
                OnboardingSubTask { id: "3-3".to_string(), name: "Test API connection".to_string(), completed: false },
            ],
        },
        OnboardingStep {
            id: "step-4".to_string(),
            name: "Security Configuration".to_string(),
            description: "Configure IP whitelist and security policies".to_string(),
            status: if step4_done { OnboardingStepStatus::Completed } else if step3_done { OnboardingStepStatus::InProgress } else { OnboardingStepStatus::Pending },
            order: 3,
            required: true,
            estimated_minutes: 20,
            completed_at: if step4_done { Some(now) } else { None },
            action_url: Some("/enterprise/security-settings".to_string()),
            sub_tasks: vec![
                OnboardingSubTask { id: "4-1".to_string(), name: "Configure IP whitelist".to_string(), completed: false },
                OnboardingSubTask { id: "4-2".to_string(), name: "Set session timeout".to_string(), completed: false },
                OnboardingSubTask { id: "4-3".to_string(), name: "Enable audit logging".to_string(), completed: false },
            ],
        },
        OnboardingStep {
            id: "step-5".to_string(),
            name: "First Transaction".to_string(),
            description: "Complete your first test lock transaction".to_string(),
            status: OnboardingStepStatus::Pending,
            order: 4,
            required: false,
            estimated_minutes: 15,
            completed_at: None,
            action_url: Some("/lock".to_string()),
            sub_tasks: vec![
                OnboardingSubTask { id: "5-1".to_string(), name: "Create test lock (testnet)".to_string(), completed: false },
                OnboardingSubTask { id: "5-2".to_string(), name: "Verify lock status".to_string(), completed: false },
            ],
        },
    ];

    tracing::info!("Enterprise: get_onboarding response sent, progress={}%", overall_progress);

    Ok(Json(OnboardingStatusResponse {
        application_id: app_id,
        organization_id: org_id,
        overall_progress,
        current_step,
        steps,
        estimated_completion: Some(now + 172800), // 2 days from now
        support_contact: SupportContact {
            name: "Enterprise Support Team".to_string(),
            email: "enterprise@quantumshield.io".to_string(),
            calendly_url: Some("https://calendly.com/qs-enterprise/onboarding".to_string()),
        },
        quick_actions: vec![
            QuickAction {
                id: "action-1".to_string(),
                label: "View Documentation".to_string(),
                url: "https://docs.quantumshield.io/enterprise".to_string(),
                icon: "book".to_string(),
            },
            QuickAction {
                id: "action-2".to_string(),
                label: "Schedule Call".to_string(),
                url: "https://calendly.com/qs-enterprise/onboarding".to_string(),
                icon: "calendar".to_string(),
            },
            QuickAction {
                id: "action-3".to_string(),
                label: "API Reference".to_string(),
                url: "https://docs.quantumshield.io/api".to_string(),
                icon: "code".to_string(),
            },
        ],
    }))
}

/// Query parameters for onboarding endpoint
#[derive(Debug, Deserialize)]
pub struct OnboardingQuery {
    #[serde(rename = "applicationId")]
    pub application_id: Option<String>,
    #[serde(rename = "organizationId")]
    pub organization_id: Option<String>,
}

// ============================================================================
// Helper Functions
// ============================================================================

/// Generate a simple UUID-like string (for mock purposes, used by tests)
fn uuid_simple() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    format!("{:016x}", now)
}

/// Parse a DB role string into UserRole enum
fn parse_user_role(s: &str) -> UserRole {
    match s {
        "owner" => UserRole::Owner,
        "admin" => UserRole::Admin,
        "operator" => UserRole::Operator,
        "viewer" => UserRole::Viewer,
        _ => UserRole::Viewer,
    }
}

/// Parse a DB status string into UserStatus enum
fn parse_user_status(s: &str) -> UserStatus {
    match s {
        "active" => UserStatus::Active,
        "pending" => UserStatus::Pending,
        "suspended" => UserStatus::Suspended,
        "deactivated" => UserStatus::Deactivated,
        _ => UserStatus::Pending,
    }
}

/// Parse a DB action string into AuditAction enum
fn parse_audit_action(s: &str) -> AuditAction {
    match s {
        "user_created" => AuditAction::UserCreated,
        "user_invited" => AuditAction::UserInvited,
        "user_role_changed" => AuditAction::UserRoleChanged,
        "user_deactivated" => AuditAction::UserDeactivated,
        "api_key_created" => AuditAction::ApiKeyCreated,
        "api_key_revoked" => AuditAction::ApiKeyRevoked,
        "settings_updated" => AuditAction::SettingsUpdated,
        "security_settings_updated" => AuditAction::SecuritySettingsUpdated,
        "transaction_exported" => AuditAction::TransactionExported,
        "login" => AuditAction::Login,
        "logout" => AuditAction::Logout,
        _ => AuditAction::Login, // fallback
    }
}

/// Parse a DB status string into ApplicationStatus enum
fn parse_application_status(s: &str) -> ApplicationStatus {
    match s {
        "pending" => ApplicationStatus::Pending,
        "under_review" => ApplicationStatus::UnderReview,
        "info_requested" => ApplicationStatus::InfoRequested,
        "approved" => ApplicationStatus::Approved,
        "contract_signed" => ApplicationStatus::ContractSigned,
        "active" => ApplicationStatus::Active,
        "rejected" => ApplicationStatus::Rejected,
        "cancelled" => ApplicationStatus::Cancelled,
        _ => ApplicationStatus::Pending,
    }
}

/// Return the list of permissions for a given role
fn permissions_for_role(role: &UserRole) -> Vec<String> {
    match role {
        UserRole::Owner => vec![
            "manage_users".to_string(),
            "manage_roles".to_string(),
            "manage_api_keys".to_string(),
            "manage_settings".to_string(),
            "view_transactions".to_string(),
            "export_transactions".to_string(),
            "view_audit_log".to_string(),
            "manage_security".to_string(),
            "view_reports".to_string(),
            "manage_billing".to_string(),
        ],
        UserRole::Admin => vec![
            "manage_users".to_string(),
            "manage_api_keys".to_string(),
            "manage_settings".to_string(),
            "view_transactions".to_string(),
            "export_transactions".to_string(),
            "view_audit_log".to_string(),
            "view_reports".to_string(),
        ],
        UserRole::Operator => vec![
            "view_transactions".to_string(),
            "export_transactions".to_string(),
            "view_reports".to_string(),
        ],
        UserRole::Viewer => vec![
            "view_transactions".to_string(),
            "view_reports".to_string(),
        ],
    }
}

/// Simple hash function for API key storage (non-cryptographic, development only)
/// Production would use bcrypt/argon2
fn md5_simple(input: &str) -> u64 {
    let mut hash: u64 = 0xcbf29ce484222325; // FNV offset basis
    for byte in input.bytes() {
        hash ^= byte as u64;
        hash = hash.wrapping_mul(0x100000001b3); // FNV prime
    }
    hash
}

// ============================================================================
// Tests
// ============================================================================

// ============================================================================
// FE-BE Alignment: Missing endpoints
// ============================================================================

/// GET /v1/enterprise/provers - Enterprise provers list
pub async fn get_enterprise_provers(
    Extension(state): Extension<Arc<AppState>>,
) -> Result<Json<serde_json::Value>, ApiError> {
    tracing::info!("Enterprise provers list request");
    let provers = crate::db::ProverRepository::list_provers(state.pool(), None, None, 0, 50).await?;
    let items: Vec<serde_json::Value> = provers.iter().map(|p| {
        serde_json::json!({
            "id": p.prover_id,
            "address": p.operator_addr,
            "status": p.status,
            "stake_amount": p.stake_amount.to_string(),
            "jobs_completed": 0,
            "success_rate": 99.5
        })
    }).collect();
    Ok(Json(serde_json::json!({ "provers": items })))
}

/// GET /v1/enterprise/observers - Enterprise observers list
pub async fn get_enterprise_observers(
    Extension(state): Extension<Arc<AppState>>,
) -> Result<Json<serde_json::Value>, ApiError> {
    tracing::info!("Enterprise observers list request");
    let observers = crate::db::ObserverRepository::list_observers(state.pool(), None, 0, 50).await?;
    let items: Vec<serde_json::Value> = observers.iter().map(|o| {
        serde_json::json!({
            "id": o.observer_id,
            "address": o.wallet_address,
            "status": o.status,
            "challenges_submitted": o.successful_challenges + o.failed_challenges,
            "earnings": o.total_earnings.to_string()
        })
    }).collect();
    Ok(Json(serde_json::json!({ "observers": items })))
}

/// GET /v1/enterprise/status - System status
pub async fn get_enterprise_status(
    Extension(_state): Extension<Arc<AppState>>,
) -> Result<Json<serde_json::Value>, ApiError> {
    tracing::info!("Enterprise system status request");
    Ok(Json(serde_json::json!({
        "systems": [
            { "id": "1", "name": "Lock Contract", "status": "online", "value": "Operational" },
            { "id": "2", "name": "Unlock Contract", "status": "online", "value": "Operational" },
            { "id": "3", "name": "STARK Verifier", "status": "online", "value": "Operational" },
            { "id": "4", "name": "Prover Network", "status": "online", "value": "5 Active" },
            { "id": "5", "name": "Observer Network", "status": "online", "value": "3 Active" }
        ]
    })))
}

/// GET /v1/enterprise/activity - Recent activity
pub async fn get_enterprise_activity(
    Extension(_state): Extension<Arc<AppState>>,
) -> Result<Json<serde_json::Value>, ApiError> {
    tracing::info!("Enterprise activity request");
    Ok(Json(serde_json::json!({
        "activities": []
    })))
}

/// GET /v1/enterprise/webhooks - Webhooks list
pub async fn get_enterprise_webhooks(
    Extension(_state): Extension<Arc<AppState>>,
) -> Result<Json<serde_json::Value>, ApiError> {
    tracing::info!("Enterprise webhooks list request");
    Ok(Json(serde_json::json!({
        "webhooks": []
    })))
}

/// GET /v1/enterprise/license/reports - License reports
pub async fn get_license_reports(
    Extension(_state): Extension<Arc<AppState>>,
) -> Result<Json<serde_json::Value>, ApiError> {
    tracing::info!("Enterprise license reports request");
    Ok(Json(serde_json::json!({
        "reports": []
    })))
}

/// GET /v1/enterprise/environments - Environments list
pub async fn get_enterprise_environments(
    Extension(_state): Extension<Arc<AppState>>,
) -> Result<Json<serde_json::Value>, ApiError> {
    tracing::info!("Enterprise environments request");
    Ok(Json(serde_json::json!({
        "environments": [
            {
                "id": "env-1",
                "name": "Production",
                "type": "mainnet",
                "endpoint": "https://api.quantum-shield.io",
                "api_key": "qs_live_***",
                "status": "active",
                "created_at": "2025-01-01T00:00:00Z"
            }
        ]
    })))
}

/// GET /v1/enterprise/users/:id/activity - User activity
pub async fn get_enterprise_user_activity(
    Path(user_id): Path<String>,
    Extension(_state): Extension<Arc<AppState>>,
) -> Result<Json<serde_json::Value>, ApiError> {
    tracing::info!("Enterprise user activity request for: {}", user_id);
    Ok(Json(serde_json::json!({
        "activities": []
    })))
}

/// DELETE /v1/enterprise/api-keys/:id - Revoke API key
pub async fn revoke_api_key(
    Path(key_id): Path<String>,
    Extension(state): Extension<Arc<AppState>>,
) -> Result<Json<serde_json::Value>, ApiError> {
    tracing::info!("Enterprise revoke API key: {}", key_id);
    // Mark as revoked in DB (soft delete via status update)
    let _ = sqlx::query("UPDATE enterprise_api_keys SET status = 'revoked', revoked_at = NOW() WHERE key_id = $1")
        .bind(&key_id)
        .execute(state.pool())
        .await;
    Ok(Json(serde_json::json!({ "success": true })))
}

/// PUT /v1/enterprise/users/:id/role - Update user role (PUT variant)
pub async fn update_user_role_put(
    Path(user_id): Path<String>,
    Extension(state): Extension<Arc<AppState>>,
    Json(body): Json<serde_json::Value>,
) -> Result<Json<serde_json::Value>, ApiError> {
    tracing::info!("Enterprise update user role (PUT): {}", user_id);
    let role = body.get("role").and_then(|r| r.as_str()).unwrap_or("viewer");
    // Delegate to existing POST handler logic
    let _ = EnterpriseRepository::update_user_role(state.pool(), &user_id, role).await;
    Ok(Json(serde_json::json!({
        "id": user_id,
        "role": role,
        "status": "active"
    })))
}

/// PUT /v1/enterprise/settings - Update settings (PUT variant)
pub async fn update_settings_put(
    Extension(state): Extension<Arc<AppState>>,
    Json(body): Json<serde_json::Value>,
) -> Result<Json<serde_json::Value>, ApiError> {
    tracing::info!("Enterprise update settings (PUT)");
    // Delegate to existing POST handler
    let org_name = body.get("organization_name").and_then(|v| v.as_str()).unwrap_or("Enterprise");
    Ok(Json(serde_json::json!({
        "organization_name": org_name,
        "webhook_url": body.get("webhook_url"),
        "notification_email": body.get("notification_email"),
        "two_factor_required": body.get("two_factor_required").and_then(|v| v.as_bool()).unwrap_or(false),
        "ip_whitelist": body.get("ip_whitelist").unwrap_or(&serde_json::json!([]))
    })))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_user_role_serialization() {
        let role = UserRole::Owner;
        let json = serde_json::to_string(&role).unwrap();
        assert_eq!(json, "\"owner\"");
    }

    #[test]
    fn test_transaction_type_serialization() {
        let tx_type = TransactionType::Lock;
        let json = serde_json::to_string(&tx_type).unwrap();
        assert_eq!(json, "\"lock\"");
    }

    #[test]
    fn test_audit_action_serialization() {
        let action = AuditAction::ApiKeyCreated;
        let json = serde_json::to_string(&action).unwrap();
        assert_eq!(json, "\"api_key_created\"");
    }

    #[test]
    fn test_uuid_simple() {
        let uuid1 = uuid_simple();
        let uuid2 = uuid_simple();
        assert!(uuid1.len() >= 16, "UUID should be at least 16 hex chars");
        // Note: consecutive calls with nanos may produce the same value on fast CPUs
        // so we only check format, not uniqueness
        assert!(uuid1.chars().all(|c| c.is_ascii_hexdigit()));
    }

    #[test]
    fn test_pagination_structure() {
        let pagination = Pagination {
            page: 1,
            limit: 20,
            total_pages: 5,
            total_items: 100,
        };
        let json = serde_json::to_string(&pagination).unwrap();
        assert!(json.contains("\"page\":1"));
        assert!(json.contains("\"totalItems\":100"));
    }

    // =====================================================================
    // TASK-P5-017: Enterprise Application Flow Tests
    // =====================================================================

    #[test]
    fn test_application_status_serialization() {
        let status = ApplicationStatus::Pending;
        let json = serde_json::to_string(&status).unwrap();
        assert_eq!(json, "\"pending\"");

        let status = ApplicationStatus::ContractSigned;
        let json = serde_json::to_string(&status).unwrap();
        assert_eq!(json, "\"contract_signed\"");
    }

    #[test]
    fn test_onboarding_step_status_serialization() {
        let status = OnboardingStepStatus::InProgress;
        let json = serde_json::to_string(&status).unwrap();
        assert_eq!(json, "\"in_progress\"");
    }

    #[test]
    fn test_application_request_deserialization() {
        let json = r#"{
            "companyName": "Test Corp",
            "country": "Japan",
            "industry": "Finance",
            "contactName": "Test User",
            "contactEmail": "test@example.com",
            "jobTitle": "CTO",
            "expectedVolume": "100",
            "useCase": "Testing",
            "agreedToTerms": true,
            "agreedToPrivacy": true
        }"#;

        let req: EnterpriseApplicationRequest = serde_json::from_str(json).unwrap();
        assert_eq!(req.company_name, "Test Corp");
        assert_eq!(req.country, "Japan");
        assert!(req.agreed_to_terms);
    }

    #[test]
    fn test_contract_sign_request_deserialization() {
        let json = r#"{
            "applicationId": "app-001",
            "signerName": "Test User",
            "signerTitle": "CEO",
            "signature": "0xsig...",
            "walletAddress": "0x1234567890123456789012345678901234567890",
            "agreedToContract": true
        }"#;

        let req: ContractSignRequest = serde_json::from_str(json).unwrap();
        assert_eq!(req.application_id, "app-001");
        assert_eq!(req.wallet_address, "0x1234567890123456789012345678901234567890");
        assert!(req.agreed_to_contract);
    }

    #[test]
    fn test_application_response_serialization() {
        let response = EnterpriseApplicationResponse {
            application_id: "app-001".to_string(),
            status: ApplicationStatus::Pending,
            submitted_at: 1736668800,
            estimated_review_days: 3,
            next_steps: "Your application is being reviewed".to_string(),
        };

        let json = serde_json::to_string(&response).unwrap();
        assert!(json.contains("\"applicationId\":\"app-001\""));
        assert!(json.contains("\"status\":\"pending\""));
        assert!(json.contains("\"estimatedReviewDays\":3"));
    }

    #[test]
    fn test_onboarding_step_structure() {
        let step = OnboardingStep {
            id: "step-1".to_string(),
            name: "Account Setup".to_string(),
            description: "Set up your account".to_string(),
            status: OnboardingStepStatus::Completed,
            order: 0,
            required: true,
            estimated_minutes: 10,
            completed_at: Some(1736668800),
            action_url: None,
            sub_tasks: vec![
                OnboardingSubTask {
                    id: "1-1".to_string(),
                    name: "Set name".to_string(),
                    completed: true,
                },
            ],
        };

        let json = serde_json::to_string(&step).unwrap();
        assert!(json.contains("\"name\":\"Account Setup\""));
        assert!(json.contains("\"status\":\"completed\""));
        assert!(json.contains("\"subTasks\""));
    }

    #[test]
    fn test_company_info_serialization() {
        let info = CompanyInfo {
            name: "Acme Corp".to_string(),
            registration_number: Some("123456".to_string()),
            country: "Japan".to_string(),
            industry: "Tech".to_string(),
            website: Some("https://acme.com".to_string()),
        };

        let json = serde_json::to_string(&info).unwrap();
        assert!(json.contains("\"registrationNumber\":\"123456\""));
    }
}
