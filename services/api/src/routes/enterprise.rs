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
use serde::{Deserialize, Serialize};

use crate::{
    error::ApiError,
    services::AppState,
};

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
    Extension(_state): Extension<Arc<AppState>>,
) -> Result<Json<DashboardOverviewResponse>, ApiError> {
    tracing::debug!("Enterprise: Getting dashboard overview");

    Ok(Json(DashboardOverviewResponse {
        organization_name: "Acme Corporation".to_string(),
        plan: "Enterprise".to_string(),
        tvl_usd: "12,500,000".to_string(),
        tvl_change_24h: 2.5,
        total_transactions: 1250,
        active_locks: 156,
        pending_unlocks: 8,
        monthly_volume: "45,000,000".to_string(),
        recent_alerts: vec![
            AlertSummary {
                id: "alert-001".to_string(),
                alert_type: "large_transaction".to_string(),
                message: "Large transaction detected: 500 ETH".to_string(),
                severity: "info".to_string(),
                timestamp: 1736668800,
            },
        ],
        quick_stats: QuickStats {
            active_users: 12,
            api_calls_24h: 45000,
            success_rate: 99.8,
        },
    }))
}

/// GET /v1/enterprise/dashboard/tvl
///
/// Returns detailed TVL metrics and historical data
pub async fn get_dashboard_tvl(
    Extension(_state): Extension<Arc<AppState>>,
) -> Result<Json<DashboardTvlResponse>, ApiError> {
    tracing::debug!("Enterprise: Getting TVL dashboard");

    Ok(Json(DashboardTvlResponse {
        current_tvl: "12,500,000".to_string(),
        tvl_eth: "5,000".to_string(),
        change_24h: 2.5,
        change_7d: 8.2,
        change_30d: 15.0,
        historical_data: vec![
            TvlDataPoint { timestamp: 1736582400, tvl_usd: "12,200,000".to_string() },
            TvlDataPoint { timestamp: 1736668800, tvl_usd: "12,500,000".to_string() },
        ],
        tvl_by_asset: vec![
            AssetTvl { asset: "Ethereum".to_string(), symbol: "ETH".to_string(), tvl_usd: "10,000,000".to_string(), percentage: 80.0 },
            AssetTvl { asset: "USD Coin".to_string(), symbol: "USDC".to_string(), tvl_usd: "2,500,000".to_string(), percentage: 20.0 },
        ],
    }))
}

/// GET /v1/enterprise/dashboard/volume
///
/// Returns volume metrics and historical data
pub async fn get_dashboard_volume(
    Extension(_state): Extension<Arc<AppState>>,
) -> Result<Json<DashboardVolumeResponse>, ApiError> {
    tracing::debug!("Enterprise: Getting volume dashboard");

    Ok(Json(DashboardVolumeResponse {
        total_volume: "150,000,000".to_string(),
        volume_24h: "2,500,000".to_string(),
        volume_7d: "15,000,000".to_string(),
        volume_30d: "45,000,000".to_string(),
        tx_count_24h: 85,
        avg_tx_size: "29,412".to_string(),
        volume_by_type: vec![
            VolumeByType { tx_type: "lock".to_string(), volume: "1,500,000".to_string(), count: 45 },
            VolumeByType { tx_type: "unlock".to_string(), volume: "1,000,000".to_string(), count: 40 },
        ],
        historical_data: vec![
            VolumeDataPoint { timestamp: 1736582400, volume: "2,300,000".to_string(), count: 78 },
            VolumeDataPoint { timestamp: 1736668800, volume: "2,500,000".to_string(), count: 85 },
        ],
    }))
}

// ============================================================================
// Transaction Endpoints (3 EP)
// ============================================================================

/// GET /v1/enterprise/transactions
///
/// Returns paginated list of transactions with filters
pub async fn get_transactions(
    Extension(_state): Extension<Arc<AppState>>,
    Query(query): Query<TransactionListQuery>,
) -> Result<Json<TransactionListResponse>, ApiError> {
    tracing::debug!("Enterprise: Getting transactions, page={:?}", query.page);

    let page = query.page.unwrap_or(1);
    let limit = query.limit.unwrap_or(20);

    Ok(Json(TransactionListResponse {
        transactions: vec![
            TransactionItem {
                id: "tx-001".to_string(),
                tx_type: TransactionType::Lock,
                status: TransactionStatus::Completed,
                amount: "100.0".to_string(),
                asset: "ETH".to_string(),
                from_address: "0x1234...5678".to_string(),
                to_address: Some("0xabcd...efgh".to_string()),
                tx_hash: Some("0xhash1...".to_string()),
                created_at: 1736668800,
                completed_at: Some(1736668900),
            },
            TransactionItem {
                id: "tx-002".to_string(),
                tx_type: TransactionType::Unlock,
                status: TransactionStatus::Pending,
                amount: "50.0".to_string(),
                asset: "ETH".to_string(),
                from_address: "0xabcd...efgh".to_string(),
                to_address: Some("0x1234...5678".to_string()),
                tx_hash: None,
                created_at: 1736669000,
                completed_at: None,
            },
        ],
        pagination: Pagination {
            page,
            limit,
            total_pages: 5,
            total_items: 100,
        },
        summary: TransactionSummary {
            total_volume: "12,500,000".to_string(),
            pending_count: 8,
            completed_count: 92,
        },
    }))
}

/// GET /v1/enterprise/transactions/:id
///
/// Returns detailed information about a specific transaction
pub async fn get_transaction_detail(
    Extension(_state): Extension<Arc<AppState>>,
    Path(id): Path<String>,
) -> Result<Json<TransactionDetailResponse>, ApiError> {
    tracing::debug!("Enterprise: Getting transaction detail for {}", id);

    Ok(Json(TransactionDetailResponse {
        id: id.clone(),
        tx_type: TransactionType::Lock,
        status: TransactionStatus::Completed,
        amount: "100.0".to_string(),
        asset: "ETH".to_string(),
        from_address: "0x1234567890abcdef1234567890abcdef12345678".to_string(),
        to_address: Some("0xabcdef1234567890abcdef1234567890abcdef12".to_string()),
        tx_hash: Some("0xhash123456789abcdef...".to_string()),
        block_number: Some(12345678),
        gas_used: Some("150000".to_string()),
        gas_fee: Some("0.003".to_string()),
        created_at: 1736668800,
        completed_at: Some(1736668900),
        lock_id: Some("lock-001".to_string()),
        stark_proof_hash: Some("0xstarkproof...".to_string()),
        prover_signatures: vec![
            ProverSignature {
                prover_id: "prover-001".to_string(),
                signed_at: 1736668850,
                signature: "0xsig1...".to_string(),
            },
            ProverSignature {
                prover_id: "prover-002".to_string(),
                signed_at: 1736668855,
                signature: "0xsig2...".to_string(),
            },
        ],
        timeline: vec![
            TimelineEvent { event: "Transaction created".to_string(), timestamp: 1736668800, details: None },
            TimelineEvent { event: "STARK proof generated".to_string(), timestamp: 1736668830, details: None },
            TimelineEvent { event: "Prover signatures collected (2/5)".to_string(), timestamp: 1736668860, details: None },
            TimelineEvent { event: "Transaction completed".to_string(), timestamp: 1736668900, details: None },
        ],
    }))
}

/// POST /v1/enterprise/transactions/export
///
/// Initiates transaction export in specified format
pub async fn export_transactions(
    Extension(_state): Extension<Arc<AppState>>,
    Json(req): Json<ExportTransactionsRequest>,
) -> Result<Json<ExportTransactionsResponse>, ApiError> {
    tracing::info!("Enterprise: Exporting transactions in {} format", req.format);

    Ok(Json(ExportTransactionsResponse {
        export_id: "export-001".to_string(),
        status: "processing".to_string(),
        download_url: None,
        expires_at: Some(1736755200), // 24h from now
    }))
}

// ============================================================================
// User Endpoints (5 EP)
// ============================================================================

/// GET /v1/enterprise/users
///
/// Returns list of organization users
pub async fn get_users(
    Extension(_state): Extension<Arc<AppState>>,
) -> Result<Json<UserListResponse>, ApiError> {
    tracing::debug!("Enterprise: Getting users");

    Ok(Json(UserListResponse {
        users: vec![
            UserItem {
                id: "user-001".to_string(),
                email: "admin@acme.com".to_string(),
                name: "John Admin".to_string(),
                role: UserRole::Owner,
                status: UserStatus::Active,
                last_active: Some(1736668800),
                created_at: 1735000000,
            },
            UserItem {
                id: "user-002".to_string(),
                email: "operator@acme.com".to_string(),
                name: "Jane Operator".to_string(),
                role: UserRole::Operator,
                status: UserStatus::Active,
                last_active: Some(1736665200),
                created_at: 1735100000,
            },
            UserItem {
                id: "user-003".to_string(),
                email: "viewer@acme.com".to_string(),
                name: "Bob Viewer".to_string(),
                role: UserRole::Viewer,
                status: UserStatus::Pending,
                last_active: None,
                created_at: 1736600000,
            },
        ],
        pagination: Pagination {
            page: 1,
            limit: 20,
            total_pages: 1,
            total_items: 3,
        },
    }))
}

/// GET /v1/enterprise/users/:id
///
/// Returns detailed user information
pub async fn get_user_detail(
    Extension(_state): Extension<Arc<AppState>>,
    Path(id): Path<String>,
) -> Result<Json<UserDetailResponse>, ApiError> {
    tracing::debug!("Enterprise: Getting user detail for {}", id);

    Ok(Json(UserDetailResponse {
        id: id.clone(),
        email: "admin@acme.com".to_string(),
        name: "John Admin".to_string(),
        role: UserRole::Owner,
        status: UserStatus::Active,
        wallet_address: Some("0x1234567890abcdef1234567890abcdef12345678".to_string()),
        two_factor_enabled: true,
        last_active: Some(1736668800),
        created_at: 1735000000,
        invited_by: None,
        recent_activity: vec![
            UserActivityItem {
                action: "Login".to_string(),
                timestamp: 1736668800,
                ip_address: Some("192.168.1.1".to_string()),
            },
            UserActivityItem {
                action: "API key created".to_string(),
                timestamp: 1736665200,
                ip_address: Some("192.168.1.1".to_string()),
            },
        ],
        permissions: vec![
            "transactions:read".to_string(),
            "transactions:write".to_string(),
            "users:manage".to_string(),
            "settings:manage".to_string(),
            "api_keys:manage".to_string(),
        ],
    }))
}

/// POST /v1/enterprise/users
///
/// Creates a new user in the organization
pub async fn create_user(
    Extension(_state): Extension<Arc<AppState>>,
    Json(req): Json<CreateUserRequest>,
) -> Result<Json<CreateUserResponse>, ApiError> {
    tracing::info!("Enterprise: Creating user {}", req.email);

    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs();

    Ok(Json(CreateUserResponse {
        id: format!("user-{}", uuid_simple()),
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
pub async fn invite_user(
    Extension(_state): Extension<Arc<AppState>>,
    Json(req): Json<InviteUserRequest>,
) -> Result<Json<InviteUserResponse>, ApiError> {
    tracing::info!("Enterprise: Inviting user {}", req.email);

    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs();

    Ok(Json(InviteUserResponse {
        invite_id: format!("invite-{}", uuid_simple()),
        email: req.email,
        status: "sent".to_string(),
        expires_at: now + 604800, // 7 days
    }))
}

/// POST /v1/enterprise/users/:id/role
///
/// Updates user role
pub async fn update_user_role(
    Extension(_state): Extension<Arc<AppState>>,
    Path(id): Path<String>,
    Json(req): Json<UpdateUserRoleRequest>,
) -> Result<Json<UpdateUserRoleResponse>, ApiError> {
    tracing::info!("Enterprise: Updating role for user {} to {:?}", id, req.role);

    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs();

    Ok(Json(UpdateUserRoleResponse {
        id,
        previous_role: UserRole::Operator,
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
    Extension(_state): Extension<Arc<AppState>>,
) -> Result<Json<ApiKeyListResponse>, ApiError> {
    tracing::debug!("Enterprise: Getting API keys");

    Ok(Json(ApiKeyListResponse {
        api_keys: vec![
            ApiKeyItem {
                id: "key-001".to_string(),
                name: "Production API Key".to_string(),
                key_preview: "qs_****abcd".to_string(),
                status: ApiKeyStatus::Active,
                permissions: vec!["transactions:read".to_string(), "transactions:write".to_string()],
                last_used: Some(1736668800),
                created_at: 1735000000,
                expires_at: Some(1767139200), // 1 year
                created_by: "admin@acme.com".to_string(),
            },
            ApiKeyItem {
                id: "key-002".to_string(),
                name: "Read-Only Key".to_string(),
                key_preview: "qs_****efgh".to_string(),
                status: ApiKeyStatus::Active,
                permissions: vec!["transactions:read".to_string()],
                last_used: Some(1736665200),
                created_at: 1735500000,
                expires_at: None,
                created_by: "admin@acme.com".to_string(),
            },
        ],
    }))
}

/// POST /v1/enterprise/api-keys
///
/// Creates a new API key
pub async fn create_api_key(
    Extension(_state): Extension<Arc<AppState>>,
    Json(req): Json<CreateApiKeyRequest>,
) -> Result<Json<CreateApiKeyResponse>, ApiError> {
    tracing::info!("Enterprise: Creating API key {}", req.name);

    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs();

    let expires_at = req.expires_in.map(|e| now + e);

    Ok(Json(CreateApiKeyResponse {
        id: format!("key-{}", uuid_simple()),
        name: req.name,
        api_key: format!("qs_live_{}", uuid_simple()),
        permissions: req.permissions,
        created_at: now,
        expires_at,
    }))
}

/// GET /v1/enterprise/api-keys/:id/usage
///
/// Returns usage statistics for an API key
pub async fn get_api_key_usage(
    Extension(_state): Extension<Arc<AppState>>,
    Path(id): Path<String>,
) -> Result<Json<ApiKeyUsageResponse>, ApiError> {
    tracing::debug!("Enterprise: Getting API key usage for {}", id);

    Ok(Json(ApiKeyUsageResponse {
        id: id.clone(),
        name: "Production API Key".to_string(),
        total_requests: 125000,
        requests_24h: 4500,
        requests_7d: 28000,
        usage_by_endpoint: vec![
            EndpointUsage { endpoint: "/v1/lock".to_string(), count: 2000, avg_latency_ms: 150 },
            EndpointUsage { endpoint: "/v1/unlock".to_string(), count: 1800, avg_latency_ms: 180 },
            EndpointUsage { endpoint: "/v1/status".to_string(), count: 700, avg_latency_ms: 50 },
        ],
        recent_requests: vec![
            ApiRequestLog {
                timestamp: 1736668800,
                endpoint: "/v1/lock".to_string(),
                method: "POST".to_string(),
                status_code: 200,
                latency_ms: 145,
                ip_address: "192.168.1.1".to_string(),
            },
            ApiRequestLog {
                timestamp: 1736668750,
                endpoint: "/v1/status/lock-001".to_string(),
                method: "GET".to_string(),
                status_code: 200,
                latency_ms: 45,
                ip_address: "192.168.1.1".to_string(),
            },
        ],
    }))
}

// ============================================================================
// Settings Endpoints (3 EP)
// ============================================================================

/// GET /v1/enterprise/settings
///
/// Returns organization settings
pub async fn get_settings(
    Extension(_state): Extension<Arc<AppState>>,
) -> Result<Json<SettingsResponse>, ApiError> {
    tracing::debug!("Enterprise: Getting settings");

    Ok(Json(SettingsResponse {
        organization: OrganizationSettings {
            name: "acme-corp".to_string(),
            display_name: "Acme Corporation".to_string(),
            logo: Some("https://example.com/logo.png".to_string()),
            website: Some("https://acme.com".to_string()),
            support_email: "support@acme.com".to_string(),
            timezone: "Asia/Tokyo".to_string(),
            currency: "USD".to_string(),
        },
        notifications: NotificationSettings {
            email_alerts: true,
            slack_integration: true,
            webhook_url: Some("https://hooks.slack.com/...".to_string()),
            alert_thresholds: AlertThresholds {
                large_transaction: "100".to_string(),
                daily_volume_limit: "10000".to_string(),
            },
        },
        limits: LimitSettings {
            max_transaction_size: "1000".to_string(),
            daily_transaction_limit: "50000".to_string(),
            api_rate_limit: 1000,
        },
    }))
}

/// POST /v1/enterprise/settings
///
/// Updates organization settings
pub async fn update_settings(
    Extension(_state): Extension<Arc<AppState>>,
    Json(req): Json<UpdateSettingsRequest>,
) -> Result<Json<UpdateSettingsResponse>, ApiError> {
    tracing::info!("Enterprise: Updating settings");

    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs();

    let mut changed_fields = Vec::new();
    if req.organization.is_some() {
        changed_fields.push("organization".to_string());
    }
    if req.notifications.is_some() {
        changed_fields.push("notifications".to_string());
    }
    if req.limits.is_some() {
        changed_fields.push("limits".to_string());
    }

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
    Extension(_state): Extension<Arc<AppState>>,
) -> Result<Json<SecuritySettingsResponse>, ApiError> {
    tracing::debug!("Enterprise: Getting security settings");

    Ok(Json(SecuritySettingsResponse {
        two_factor_required: true,
        session_timeout: 60,
        ip_whitelist_enabled: true,
        ip_whitelist: vec![
            "192.168.1.0/24".to_string(),
            "10.0.0.0/8".to_string(),
        ],
        password_policy: PasswordPolicy {
            min_length: 12,
            require_uppercase: true,
            require_numbers: true,
            require_special_chars: true,
            max_age: 90,
        },
        audit_log_retention: 365,
        signing_key_rotation: 90,
    }))
}

// ============================================================================
// Reports & Audit Endpoints (2 EP)
// ============================================================================

/// GET /v1/enterprise/reports
///
/// Returns available and generated reports
pub async fn get_reports(
    Extension(_state): Extension<Arc<AppState>>,
) -> Result<Json<ReportsResponse>, ApiError> {
    tracing::debug!("Enterprise: Getting reports");

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
        recent_reports: vec![
            GeneratedReport {
                id: "report-001".to_string(),
                name: "December 2025 Summary".to_string(),
                report_type: "monthly".to_string(),
                period: "2025-12".to_string(),
                status: "ready".to_string(),
                download_url: Some("https://reports.example.com/report-001.pdf".to_string()),
                generated_at: 1735689600,
                expires_at: Some(1738368000),
            },
        ],
    }))
}

/// GET /v1/enterprise/audit-log
///
/// Returns paginated audit log entries
pub async fn get_audit_log(
    Extension(_state): Extension<Arc<AppState>>,
    Query(query): Query<AuditLogQuery>,
) -> Result<Json<AuditLogResponse>, ApiError> {
    tracing::debug!("Enterprise: Getting audit log, page={:?}", query.page);

    let page = query.page.unwrap_or(1);
    let limit = query.limit.unwrap_or(50);

    Ok(Json(AuditLogResponse {
        entries: vec![
            AuditLogEntry {
                id: "audit-001".to_string(),
                action: AuditAction::Login,
                user_id: "user-001".to_string(),
                user_name: "John Admin".to_string(),
                details: serde_json::json!({"ip": "192.168.1.1", "success": true}),
                ip_address: "192.168.1.1".to_string(),
                user_agent: Some("Mozilla/5.0...".to_string()),
                timestamp: 1736668800,
            },
            AuditLogEntry {
                id: "audit-002".to_string(),
                action: AuditAction::ApiKeyCreated,
                user_id: "user-001".to_string(),
                user_name: "John Admin".to_string(),
                details: serde_json::json!({"keyName": "Production API Key", "permissions": ["transactions:read", "transactions:write"]}),
                ip_address: "192.168.1.1".to_string(),
                user_agent: Some("Mozilla/5.0...".to_string()),
                timestamp: 1736665200,
            },
            AuditLogEntry {
                id: "audit-003".to_string(),
                action: AuditAction::UserInvited,
                user_id: "user-001".to_string(),
                user_name: "John Admin".to_string(),
                details: serde_json::json!({"email": "viewer@acme.com", "role": "viewer"}),
                ip_address: "192.168.1.1".to_string(),
                user_agent: Some("Mozilla/5.0...".to_string()),
                timestamp: 1736600000,
            },
        ],
        pagination: Pagination {
            page,
            limit,
            total_pages: 10,
            total_items: 500,
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
    Extension(_state): Extension<Arc<AppState>>,
    Json(req): Json<EnterpriseApplicationRequest>,
) -> Result<Json<EnterpriseApplicationResponse>, ApiError> {
    tracing::info!(
        "Enterprise Application: New application from {} ({})",
        req.company_name,
        req.contact_email
    );

    // Validate required agreements
    if !req.agreed_to_terms || !req.agreed_to_privacy {
        return Err(ApiError::InvalidRequest(
            "Terms of Service and Privacy Policy must be accepted".to_string(),
        ));
    }

    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs();

    let application_id = format!("app-{}", uuid_simple());

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
    Extension(_state): Extension<Arc<AppState>>,
    Path(id): Path<String>,
) -> Result<Json<ApplicationDetailResponse>, ApiError> {
    tracing::debug!("Enterprise Application: Getting application {}", id);

    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs();

    // Mock response - in production, fetch from database
    Ok(Json(ApplicationDetailResponse {
        application_id: id.clone(),
        status: ApplicationStatus::Approved,
        company: CompanyInfo {
            name: "Acme Corporation".to_string(),
            registration_number: Some("12345678".to_string()),
            country: "Japan".to_string(),
            industry: "Financial Services".to_string(),
            website: Some("https://acme.com".to_string()),
        },
        contact: ContactInfo {
            name: "Taro Yamada".to_string(),
            email: "taro@acme.com".to_string(),
            phone: Some("+81-3-1234-5678".to_string()),
            job_title: "CTO".to_string(),
        },
        details: ApplicationDetails {
            expected_volume: "1000".to_string(),
            use_case: "Secure custody solution for institutional clients".to_string(),
            notes: Some("Looking to integrate with existing custody infrastructure".to_string()),
        },
        timeline: vec![
            ApplicationTimelineEvent {
                status: ApplicationStatus::Pending,
                timestamp: now - 259200, // 3 days ago
                message: "Application submitted".to_string(),
                updated_by: None,
            },
            ApplicationTimelineEvent {
                status: ApplicationStatus::UnderReview,
                timestamp: now - 172800, // 2 days ago
                message: "Application under review".to_string(),
                updated_by: Some("QS Review Team".to_string()),
            },
            ApplicationTimelineEvent {
                status: ApplicationStatus::Approved,
                timestamp: now - 86400, // 1 day ago
                message: "Application approved. Please proceed to sign the contract.".to_string(),
                updated_by: Some("QS Review Team".to_string()),
            },
        ],
        documents: vec![
            ApplicationDocument {
                id: "doc-001".to_string(),
                name: "Certificate of Incorporation".to_string(),
                doc_type: "legal".to_string(),
                uploaded_at: now - 259200,
                status: "verified".to_string(),
            },
            ApplicationDocument {
                id: "doc-002".to_string(),
                name: "KYB Documentation".to_string(),
                doc_type: "compliance".to_string(),
                uploaded_at: now - 259200,
                status: "verified".to_string(),
            },
        ],
        review_notes: Some("Strong use case, reputable company. Approved for Enterprise tier.".to_string()),
        assigned_reviewer: Some("QS Enterprise Team".to_string()),
        submitted_at: now - 259200,
        updated_at: now - 86400,
    }))
}

/// POST /v1/enterprise/contract/sign
///
/// Sign the Enterprise contract to activate the account
pub async fn sign_contract(
    Extension(_state): Extension<Arc<AppState>>,
    Json(req): Json<ContractSignRequest>,
) -> Result<Json<ContractSignResponse>, ApiError> {
    tracing::info!(
        "Enterprise Contract: Signing contract for application {}",
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

    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs();

    let contract_id = format!("contract-{}", uuid_simple());
    let organization_id = format!("org-{}", uuid_simple());

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
pub async fn get_onboarding(
    Extension(_state): Extension<Arc<AppState>>,
    Query(query): Query<OnboardingQuery>,
) -> Result<Json<OnboardingStatusResponse>, ApiError> {
    tracing::debug!(
        "Enterprise Onboarding: Getting status for application {:?}",
        query.application_id
    );

    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs();

    // Mock response with realistic onboarding steps
    Ok(Json(OnboardingStatusResponse {
        application_id: query.application_id.unwrap_or_else(|| "app-001".to_string()),
        organization_id: "org-001".to_string(),
        overall_progress: 40,
        current_step: 2,
        steps: vec![
            OnboardingStep {
                id: "step-1".to_string(),
                name: "Account Setup".to_string(),
                description: "Create your organization profile and configure basic settings".to_string(),
                status: OnboardingStepStatus::Completed,
                order: 0,
                required: true,
                estimated_minutes: 10,
                completed_at: Some(now - 86400),
                action_url: None,
                sub_tasks: vec![
                    OnboardingSubTask {
                        id: "1-1".to_string(),
                        name: "Set organization name".to_string(),
                        completed: true,
                    },
                    OnboardingSubTask {
                        id: "1-2".to_string(),
                        name: "Upload company logo".to_string(),
                        completed: true,
                    },
                    OnboardingSubTask {
                        id: "1-3".to_string(),
                        name: "Configure timezone".to_string(),
                        completed: true,
                    },
                ],
            },
            OnboardingStep {
                id: "step-2".to_string(),
                name: "Team Members".to_string(),
                description: "Invite team members and assign roles".to_string(),
                status: OnboardingStepStatus::Completed,
                order: 1,
                required: true,
                estimated_minutes: 15,
                completed_at: Some(now - 43200),
                action_url: Some("/enterprise/users".to_string()),
                sub_tasks: vec![
                    OnboardingSubTask {
                        id: "2-1".to_string(),
                        name: "Invite at least one admin".to_string(),
                        completed: true,
                    },
                    OnboardingSubTask {
                        id: "2-2".to_string(),
                        name: "Configure 2FA requirements".to_string(),
                        completed: true,
                    },
                ],
            },
            OnboardingStep {
                id: "step-3".to_string(),
                name: "API Integration".to_string(),
                description: "Generate API keys and configure webhooks".to_string(),
                status: OnboardingStepStatus::InProgress,
                order: 2,
                required: true,
                estimated_minutes: 30,
                completed_at: None,
                action_url: Some("/enterprise/api-keys".to_string()),
                sub_tasks: vec![
                    OnboardingSubTask {
                        id: "3-1".to_string(),
                        name: "Generate production API key".to_string(),
                        completed: true,
                    },
                    OnboardingSubTask {
                        id: "3-2".to_string(),
                        name: "Configure webhook endpoint".to_string(),
                        completed: false,
                    },
                    OnboardingSubTask {
                        id: "3-3".to_string(),
                        name: "Test API connection".to_string(),
                        completed: false,
                    },
                ],
            },
            OnboardingStep {
                id: "step-4".to_string(),
                name: "Security Configuration".to_string(),
                description: "Configure IP whitelist and security policies".to_string(),
                status: OnboardingStepStatus::Pending,
                order: 3,
                required: true,
                estimated_minutes: 20,
                completed_at: None,
                action_url: Some("/enterprise/security-settings".to_string()),
                sub_tasks: vec![
                    OnboardingSubTask {
                        id: "4-1".to_string(),
                        name: "Configure IP whitelist".to_string(),
                        completed: false,
                    },
                    OnboardingSubTask {
                        id: "4-2".to_string(),
                        name: "Set session timeout".to_string(),
                        completed: false,
                    },
                    OnboardingSubTask {
                        id: "4-3".to_string(),
                        name: "Enable audit logging".to_string(),
                        completed: false,
                    },
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
                    OnboardingSubTask {
                        id: "5-1".to_string(),
                        name: "Create test lock (testnet)".to_string(),
                        completed: false,
                    },
                    OnboardingSubTask {
                        id: "5-2".to_string(),
                        name: "Verify lock status".to_string(),
                        completed: false,
                    },
                ],
            },
        ],
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

/// Generate a simple UUID-like string (for mock purposes)
fn uuid_simple() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    format!("{:016x}", now)
}

// ============================================================================
// Tests
// ============================================================================

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
        assert_eq!(uuid1.len(), 16);
        assert_ne!(uuid1, uuid2);
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
