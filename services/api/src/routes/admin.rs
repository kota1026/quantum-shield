//! Admin API implementation for Admin Dashboard
//!
//! Provides endpoints for:
//! - Prover list and management
//! - Provider list and management
//! - System status and analytics
//! - Emergency pause controls

use std::sync::Arc;

use axum::{Extension, Json, extract::Path};
use serde::{Deserialize, Serialize};

use crate::{
    error::ApiError,
    services::AppState,
    types::{ProverStatus, Edition},
};

// ============================================================================
// Admin Types
// ============================================================================

#[derive(Debug, Serialize)]
pub struct ProverListResponse {
    pub provers: Vec<ProverListItem>,
}

#[derive(Debug, Serialize)]
pub struct ProverListItem {
    pub id: String,
    pub name: String,
    pub status: AdminProverStatus,
    #[serde(rename = "hsmConnected")]
    pub hsm_connected: bool,
    pub stake: u64,
    #[serde(rename = "successRate")]
    pub success_rate: f64,
    #[serde(rename = "responseTime")]
    pub response_time: u64,
    #[serde(rename = "operatorAddress")]
    pub operator_address: String,
}

#[derive(Debug, Serialize, Deserialize, Clone, Copy)]
#[serde(rename_all = "lowercase")]
pub enum AdminProverStatus {
    Active,
    Pending,
    Suspended,
}

#[derive(Debug, Serialize)]
pub struct ProviderListResponse {
    pub providers: Vec<ProviderListItem>,
}

#[derive(Debug, Serialize)]
pub struct ProviderListItem {
    pub id: String,
    pub name: String,
    #[serde(rename = "type")]
    pub provider_type: String,
    pub status: String,
    pub tvl: u64,
    #[serde(rename = "monthlyTx")]
    pub monthly_tx: u64,
}

#[derive(Debug, Serialize)]
pub struct SystemStatusResponse {
    pub status: String,
    #[serde(rename = "pausedAt")]
    pub paused_at: Option<u64>,
    pub tvl: u64,
    #[serde(rename = "totalLocks")]
    pub total_locks: u64,
    #[serde(rename = "totalUnlocks")]
    pub total_unlocks: u64,
    #[serde(rename = "activeProvers")]
    pub active_provers: u64,
}

#[derive(Debug, Serialize)]
pub struct AnalyticsOverviewResponse {
    pub tvl: u64,
    #[serde(rename = "tvlChange24h")]
    pub tvl_change_24h: f64,
    #[serde(rename = "totalLocks")]
    pub total_locks: u64,
    #[serde(rename = "totalUnlocks")]
    pub total_unlocks: u64,
    #[serde(rename = "proverPerformance")]
    pub prover_performance: Vec<ProverPerformance>,
}

#[derive(Debug, Serialize)]
pub struct ProverPerformance {
    #[serde(rename = "proverId")]
    pub prover_id: String,
    #[serde(rename = "successRate")]
    pub success_rate: f64,
    #[serde(rename = "avgResponse")]
    pub avg_response: u64,
}

#[derive(Debug, Serialize)]
pub struct EditionCurrentResponse {
    pub edition: String,
    #[serde(rename = "switchPending")]
    pub switch_pending: bool,
}

#[derive(Debug, Deserialize)]
pub struct PauseRequest {
    pub reason: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct PauseResponse {
    pub status: String,
    #[serde(rename = "pausedAt")]
    pub paused_at: u64,
}

// ============================================================================
// Prover Management Endpoints
// ============================================================================

/// GET /api/provers
/// 
/// List all provers for Admin Dashboard
pub async fn list_provers(
    Extension(state): Extension<Arc<AppState>>,
) -> Result<Json<ProverListResponse>, ApiError> {
    tracing::debug!("Admin: Listing all provers");

    // Get provers from state (mock data for now)
    let provers = vec![
        ProverListItem {
            id: "prover-001".to_string(),
            name: "Quantum Prover Alpha".to_string(),
            status: AdminProverStatus::Active,
            hsm_connected: true,
            stake: 500000,
            success_rate: 99.8,
            response_time: 145,
            operator_address: "0x1234567890abcdef1234567890abcdef12345678".to_string(),
        },
        ProverListItem {
            id: "prover-002".to_string(),
            name: "Quantum Prover Beta".to_string(),
            status: AdminProverStatus::Active,
            hsm_connected: true,
            stake: 450000,
            success_rate: 99.5,
            response_time: 162,
            operator_address: "0xabcdef1234567890abcdef1234567890abcdef12".to_string(),
        },
        ProverListItem {
            id: "prover-003".to_string(),
            name: "Quantum Prover Gamma".to_string(),
            status: AdminProverStatus::Pending,
            hsm_connected: false,
            stake: 400000,
            success_rate: 0.0,
            response_time: 0,
            operator_address: "0x9876543210fedcba9876543210fedcba98765432".to_string(),
        },
    ];

    Ok(Json(ProverListResponse { provers }))
}

/// POST /api/provers/register
/// 
/// Register a new prover (admin endpoint)
pub async fn register_prover(
    Extension(state): Extension<Arc<AppState>>,
    Json(req): Json<serde_json::Value>,
) -> Result<Json<serde_json::Value>, ApiError> {
    tracing::info!("Admin: Registering new prover");

    Ok(Json(serde_json::json!({
        "id": "prover-new",
        "status": "pending",
        "message": "Prover registration submitted"
    })))
}

/// POST /api/provers/:id/approve
/// 
/// Approve a pending prover
pub async fn approve_prover(
    Extension(state): Extension<Arc<AppState>>,
    Path(prover_id): Path<String>,
) -> Result<Json<serde_json::Value>, ApiError> {
    tracing::info!("Admin: Approving prover {}", prover_id);

    Ok(Json(serde_json::json!({
        "id": prover_id,
        "status": "active",
        "message": "Prover approved"
    })))
}

/// POST /api/provers/:id/reject
/// 
/// Reject a pending prover
pub async fn reject_prover(
    Extension(state): Extension<Arc<AppState>>,
    Path(prover_id): Path<String>,
) -> Result<Json<serde_json::Value>, ApiError> {
    tracing::info!("Admin: Rejecting prover {}", prover_id);

    Ok(Json(serde_json::json!({
        "id": prover_id,
        "status": "rejected",
        "message": "Prover rejected"
    })))
}

/// POST /api/provers/:id/suspend
/// 
/// Suspend an active prover
pub async fn suspend_prover(
    Extension(state): Extension<Arc<AppState>>,
    Path(prover_id): Path<String>,
) -> Result<Json<serde_json::Value>, ApiError> {
    tracing::info!("Admin: Suspending prover {}", prover_id);

    Ok(Json(serde_json::json!({
        "id": prover_id,
        "status": "suspended",
        "message": "Prover suspended"
    })))
}

// ============================================================================
// Provider Management Endpoints
// ============================================================================

/// GET /api/providers
/// 
/// List all providers for Admin Dashboard
pub async fn list_providers(
    Extension(state): Extension<Arc<AppState>>,
) -> Result<Json<ProviderListResponse>, ApiError> {
    tracing::debug!("Admin: Listing all providers");

    let providers = vec![
        ProviderListItem {
            id: "provider-001".to_string(),
            name: "Acme Corp".to_string(),
            provider_type: "Enterprise".to_string(),
            status: "active".to_string(),
            tvl: 5000000,
            monthly_tx: 1250,
        },
    ];

    Ok(Json(ProviderListResponse { providers }))
}

/// POST /api/providers/register
/// 
/// Register a new provider
pub async fn register_provider(
    Extension(state): Extension<Arc<AppState>>,
    Json(req): Json<serde_json::Value>,
) -> Result<Json<serde_json::Value>, ApiError> {
    tracing::info!("Admin: Registering new provider");

    Ok(Json(serde_json::json!({
        "id": "provider-new",
        "status": "pending",
        "message": "Provider registration submitted"
    })))
}

// ============================================================================
// System Status Endpoints
// ============================================================================

/// GET /api/system/status
/// 
/// Get system status for Admin Dashboard
pub async fn get_system_status(
    Extension(state): Extension<Arc<AppState>>,
) -> Result<Json<SystemStatusResponse>, ApiError> {
    tracing::debug!("Admin: Getting system status");

    Ok(Json(SystemStatusResponse {
        status: "active".to_string(),
        paused_at: None,
        tvl: 12500000,
        total_locks: 156,
        total_unlocks: 89,
        active_provers: 2,
    }))
}

/// POST /api/system/pause
/// 
/// Emergency pause the system (SEQ#8)
/// Requires 5/9 Security Council approval
pub async fn pause_system(
    Extension(state): Extension<Arc<AppState>>,
    Json(req): Json<PauseRequest>,
) -> Result<Json<PauseResponse>, ApiError> {
    tracing::warn!("Admin: EMERGENCY PAUSE requested");

    // In production, this would require 5/9 Security Council signatures
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs();

    Ok(Json(PauseResponse {
        status: "paused".to_string(),
        paused_at: now,
    }))
}

/// POST /api/system/unpause
/// 
/// Resume system operations
pub async fn unpause_system(
    Extension(state): Extension<Arc<AppState>>,
) -> Result<Json<serde_json::Value>, ApiError> {
    tracing::info!("Admin: System unpause requested");

    Ok(Json(serde_json::json!({
        "status": "active",
        "message": "System resumed"
    })))
}

// ============================================================================
// Analytics Endpoints
// ============================================================================

/// GET /api/analytics/overview
/// 
/// Get analytics overview for Admin Dashboard
pub async fn get_analytics_overview(
    Extension(state): Extension<Arc<AppState>>,
) -> Result<Json<AnalyticsOverviewResponse>, ApiError> {
    tracing::debug!("Admin: Getting analytics overview");

    Ok(Json(AnalyticsOverviewResponse {
        tvl: 12500000,
        tvl_change_24h: 2.5,
        total_locks: 156,
        total_unlocks: 89,
        prover_performance: vec![
            ProverPerformance {
                prover_id: "prover-001".to_string(),
                success_rate: 99.8,
                avg_response: 145,
            },
            ProverPerformance {
                prover_id: "prover-002".to_string(),
                success_rate: 99.5,
                avg_response: 162,
            },
        ],
    }))
}

// ============================================================================
// Edition Endpoints
// ============================================================================

/// GET /api/edition/current
/// 
/// Get current edition
pub async fn get_current_edition(
    Extension(state): Extension<Arc<AppState>>,
) -> Result<Json<EditionCurrentResponse>, ApiError> {
    tracing::debug!("Admin: Getting current edition");

    Ok(Json(EditionCurrentResponse {
        edition: "Enterprise".to_string(),
        switch_pending: false,
    }))
}

/// POST /api/edition/switch
///
/// Switch edition (Enterprise <-> Decentralized)
pub async fn switch_edition(
    Extension(state): Extension<Arc<AppState>>,
    Json(req): Json<serde_json::Value>,
) -> Result<Json<serde_json::Value>, ApiError> {
    tracing::info!("Admin: Edition switch requested");

    Ok(Json(serde_json::json!({
        "status": "pending",
        "message": "Edition switch initiated",
        "effectiveTime": 604800  // 7 days
    })))
}

// ============================================================================
// TASK-P5-015: QS Admin API (11 Endpoints)
// ============================================================================
//
// Spec Reference: PHASE5_INTEGRATION_PLAN.md §3.4, B.2
//
// Endpoints:
// 1. GET  /v1/admin/dashboard
// 2. GET  /v1/admin/transactions
// 3. GET  /v1/admin/nodes
// 4. GET  /v1/admin/staff
// 5. POST /v1/admin/staff
// 6. GET  /v1/admin/reports
// 7. GET  /v1/admin/audit-log
// 8. GET  /v1/admin/parameters
// 9. POST /v1/admin/parameters/change-request
// 10. GET  /v1/admin/enterprise/accounts
// 11. POST /v1/admin/enterprise/accounts

// ============================================================================
// QS Admin Types
// ============================================================================

/// Staff role enum
#[derive(Debug, Serialize, Deserialize, Clone, Copy, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum StaffRole {
    /// Super admin with full access
    SuperAdmin,
    /// Standard admin
    Admin,
    /// Read-only operator
    Operator,
    /// Support staff
    Support,
}

/// Audit log action type
#[derive(Debug, Serialize, Deserialize, Clone, Copy, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum AuditAction {
    /// User login
    Login,
    /// User logout
    Logout,
    /// Parameter change
    ParameterChange,
    /// Staff created
    StaffCreated,
    /// Staff updated
    StaffUpdated,
    /// Enterprise account created
    EnterpriseCreated,
    /// System pause
    SystemPause,
    /// System unpause
    SystemUnpause,
    /// Prover approved
    ProverApproved,
    /// Prover suspended
    ProverSuspended,
}

/// Node status enum
#[derive(Debug, Serialize, Deserialize, Clone, Copy, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum NodeStatus {
    Online,
    Offline,
    Syncing,
    Maintenance,
}

/// Enterprise tier enum
#[derive(Debug, Serialize, Deserialize, Clone, Copy, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum EnterpriseTier {
    Starter,
    Professional,
    Enterprise,
    Custom,
}

// ============================================================================
// QS Admin Response Types
// ============================================================================

/// GET /v1/admin/dashboard response
#[derive(Debug, Serialize)]
pub struct QsDashboardResponse {
    /// System health summary
    pub health: SystemHealth,
    /// Key metrics
    pub metrics: DashboardMetrics,
    /// Recent alerts
    #[serde(rename = "recentAlerts")]
    pub recent_alerts: Vec<SystemAlert>,
    /// Quick stats
    pub stats: QuickStats,
}

#[derive(Debug, Serialize)]
pub struct SystemHealth {
    pub status: String,
    #[serde(rename = "uptime")]
    pub uptime_percent: f64,
    #[serde(rename = "lastIncident")]
    pub last_incident: Option<u64>,
    #[serde(rename = "activeProvers")]
    pub active_provers: u32,
    #[serde(rename = "totalNodes")]
    pub total_nodes: u32,
}

#[derive(Debug, Serialize)]
pub struct DashboardMetrics {
    #[serde(rename = "totalTvl")]
    pub total_tvl: String,
    #[serde(rename = "tvlChange24h")]
    pub tvl_change_24h: f64,
    #[serde(rename = "totalTransactions")]
    pub total_transactions: u64,
    #[serde(rename = "txChange24h")]
    pub tx_change_24h: f64,
    #[serde(rename = "activeUsers")]
    pub active_users: u64,
    #[serde(rename = "pendingChallenges")]
    pub pending_challenges: u32,
}

#[derive(Debug, Serialize)]
pub struct SystemAlert {
    pub id: String,
    pub severity: String,
    pub message: String,
    pub timestamp: u64,
    pub resolved: bool,
}

#[derive(Debug, Serialize)]
pub struct QuickStats {
    #[serde(rename = "enterpriseAccounts")]
    pub enterprise_accounts: u32,
    #[serde(rename = "activeStaff")]
    pub active_staff: u32,
    #[serde(rename = "pendingRequests")]
    pub pending_requests: u32,
    #[serde(rename = "openReports")]
    pub open_reports: u32,
}

/// GET /v1/admin/transactions response
#[derive(Debug, Serialize)]
pub struct AdminTransactionsResponse {
    pub transactions: Vec<AdminTransaction>,
    pub total: u64,
    pub page: u32,
    #[serde(rename = "pageSize")]
    pub page_size: u32,
    pub filters: TransactionFilters,
}

#[derive(Debug, Serialize)]
pub struct AdminTransaction {
    pub id: String,
    #[serde(rename = "type")]
    pub tx_type: String,
    pub amount: String,
    pub token: String,
    pub from: String,
    pub to: Option<String>,
    pub status: String,
    pub timestamp: u64,
    #[serde(rename = "blockNumber")]
    pub block_number: u64,
    #[serde(rename = "txHash")]
    pub tx_hash: String,
    #[serde(rename = "enterpriseId")]
    pub enterprise_id: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct TransactionFilters {
    #[serde(rename = "availableTypes")]
    pub available_types: Vec<String>,
    #[serde(rename = "availableStatuses")]
    pub available_statuses: Vec<String>,
}

/// GET /v1/admin/nodes response
#[derive(Debug, Serialize)]
pub struct AdminNodesResponse {
    pub nodes: Vec<AdminNode>,
    pub summary: NodesSummary,
}

#[derive(Debug, Serialize)]
pub struct AdminNode {
    pub id: String,
    pub name: String,
    #[serde(rename = "type")]
    pub node_type: String,
    pub status: NodeStatus,
    pub version: String,
    #[serde(rename = "lastSeen")]
    pub last_seen: u64,
    pub location: String,
    pub metrics: NodeMetrics,
}

#[derive(Debug, Serialize)]
pub struct NodeMetrics {
    #[serde(rename = "blockHeight")]
    pub block_height: u64,
    #[serde(rename = "peerCount")]
    pub peer_count: u32,
    #[serde(rename = "cpuUsage")]
    pub cpu_usage: f64,
    #[serde(rename = "memoryUsage")]
    pub memory_usage: f64,
    #[serde(rename = "diskUsage")]
    pub disk_usage: f64,
}

#[derive(Debug, Serialize)]
pub struct NodesSummary {
    pub total: u32,
    pub online: u32,
    pub offline: u32,
    pub syncing: u32,
    pub maintenance: u32,
}

/// GET /v1/admin/staff response
#[derive(Debug, Serialize)]
pub struct StaffListResponse {
    pub staff: Vec<StaffMember>,
    pub total: u32,
}

#[derive(Debug, Serialize)]
pub struct StaffMember {
    pub id: String,
    pub email: String,
    pub name: String,
    pub role: StaffRole,
    pub status: String,
    #[serde(rename = "createdAt")]
    pub created_at: u64,
    #[serde(rename = "lastLogin")]
    pub last_login: Option<u64>,
    #[serde(rename = "mfaEnabled")]
    pub mfa_enabled: bool,
    pub permissions: Vec<String>,
}

/// POST /v1/admin/staff request
#[derive(Debug, Deserialize)]
pub struct CreateStaffRequest {
    pub email: String,
    pub name: String,
    pub role: StaffRole,
    pub permissions: Option<Vec<String>>,
}

/// POST /v1/admin/staff response
#[derive(Debug, Serialize)]
pub struct CreateStaffResponse {
    pub id: String,
    pub email: String,
    pub name: String,
    pub role: StaffRole,
    #[serde(rename = "temporaryPassword")]
    pub temporary_password: String,
    pub message: String,
}

/// GET /v1/admin/reports response
#[derive(Debug, Serialize)]
pub struct ReportsResponse {
    pub reports: Vec<Report>,
    pub total: u32,
    #[serde(rename = "availableTypes")]
    pub available_types: Vec<String>,
}

#[derive(Debug, Serialize)]
pub struct Report {
    pub id: String,
    pub name: String,
    #[serde(rename = "type")]
    pub report_type: String,
    pub status: String,
    #[serde(rename = "generatedAt")]
    pub generated_at: u64,
    #[serde(rename = "generatedBy")]
    pub generated_by: String,
    #[serde(rename = "downloadUrl")]
    pub download_url: Option<String>,
    #[serde(rename = "fileSize")]
    pub file_size: Option<u64>,
}

/// GET /v1/admin/audit-log response
#[derive(Debug, Serialize)]
pub struct AuditLogResponse {
    pub entries: Vec<AuditEntry>,
    pub total: u64,
    pub page: u32,
    #[serde(rename = "pageSize")]
    pub page_size: u32,
}

#[derive(Debug, Serialize)]
pub struct AuditEntry {
    pub id: String,
    pub action: AuditAction,
    pub actor: String,
    #[serde(rename = "actorType")]
    pub actor_type: String,
    pub target: Option<String>,
    #[serde(rename = "targetType")]
    pub target_type: Option<String>,
    pub details: serde_json::Value,
    pub timestamp: u64,
    #[serde(rename = "ipAddress")]
    pub ip_address: String,
    #[serde(rename = "userAgent")]
    pub user_agent: Option<String>,
}

/// GET /v1/admin/parameters response
#[derive(Debug, Serialize)]
pub struct ParametersResponse {
    pub parameters: Vec<SystemParameter>,
    pub categories: Vec<ParameterCategory>,
}

#[derive(Debug, Serialize)]
pub struct SystemParameter {
    pub key: String,
    pub value: String,
    #[serde(rename = "type")]
    pub param_type: String,
    pub category: String,
    pub description: String,
    #[serde(rename = "lastModified")]
    pub last_modified: u64,
    #[serde(rename = "modifiedBy")]
    pub modified_by: String,
    pub editable: bool,
    #[serde(rename = "requiresApproval")]
    pub requires_approval: bool,
}

#[derive(Debug, Serialize)]
pub struct ParameterCategory {
    pub id: String,
    pub name: String,
    pub description: String,
    pub count: u32,
}

/// POST /v1/admin/parameters/change-request request
#[derive(Debug, Deserialize)]
pub struct ParameterChangeRequest {
    pub key: String,
    #[serde(rename = "newValue")]
    pub new_value: String,
    pub reason: String,
}

/// POST /v1/admin/parameters/change-request response
#[derive(Debug, Serialize)]
pub struct ParameterChangeResponse {
    #[serde(rename = "requestId")]
    pub request_id: String,
    pub key: String,
    #[serde(rename = "currentValue")]
    pub current_value: String,
    #[serde(rename = "newValue")]
    pub new_value: String,
    pub status: String,
    #[serde(rename = "requiresApproval")]
    pub requires_approval: bool,
    pub message: String,
}

/// GET /v1/admin/enterprise/accounts response
#[derive(Debug, Serialize)]
pub struct EnterpriseAccountsResponse {
    pub accounts: Vec<EnterpriseAccount>,
    pub total: u32,
    pub summary: EnterpriseSummary,
}

#[derive(Debug, Serialize)]
pub struct EnterpriseAccount {
    pub id: String,
    pub name: String,
    pub tier: EnterpriseTier,
    pub status: String,
    #[serde(rename = "primaryContact")]
    pub primary_contact: EnterpriseContact,
    #[serde(rename = "createdAt")]
    pub created_at: u64,
    pub tvl: String,
    #[serde(rename = "monthlyVolume")]
    pub monthly_volume: String,
    #[serde(rename = "apiKeysCount")]
    pub api_keys_count: u32,
    #[serde(rename = "usersCount")]
    pub users_count: u32,
}

#[derive(Debug, Serialize, Clone)]
pub struct EnterpriseContact {
    pub name: String,
    pub email: String,
    pub phone: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct EnterpriseSummary {
    #[serde(rename = "totalAccounts")]
    pub total_accounts: u32,
    #[serde(rename = "activeAccounts")]
    pub active_accounts: u32,
    #[serde(rename = "pendingAccounts")]
    pub pending_accounts: u32,
    #[serde(rename = "totalTvl")]
    pub total_tvl: String,
}

/// POST /v1/admin/enterprise/accounts request
#[derive(Debug, Deserialize)]
pub struct CreateEnterpriseAccountRequest {
    pub name: String,
    pub tier: EnterpriseTier,
    #[serde(rename = "primaryContact")]
    pub primary_contact: CreateEnterpriseContact,
    pub notes: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateEnterpriseContact {
    pub name: String,
    pub email: String,
    pub phone: Option<String>,
}

/// POST /v1/admin/enterprise/accounts response
#[derive(Debug, Serialize)]
pub struct CreateEnterpriseAccountResponse {
    pub id: String,
    pub name: String,
    pub tier: EnterpriseTier,
    pub status: String,
    #[serde(rename = "apiKey")]
    pub api_key: String,
    pub message: String,
}

// ============================================================================
// QS Admin Endpoint Handlers
// ============================================================================

/// GET /v1/admin/dashboard
///
/// Returns QS admin dashboard overview with system health, metrics, and alerts.
pub async fn get_qs_dashboard(
    Extension(_state): Extension<Arc<AppState>>,
) -> Result<Json<QsDashboardResponse>, ApiError> {
    tracing::debug!("QS Admin: Getting dashboard");

    let response = QsDashboardResponse {
        health: SystemHealth {
            status: "healthy".to_string(),
            uptime_percent: 99.97,
            last_incident: Some(1735689600),
            active_provers: 8,
            total_nodes: 12,
        },
        metrics: DashboardMetrics {
            total_tvl: "125000000000000000000000".to_string(), // 125,000 ETH
            tvl_change_24h: 2.5,
            total_transactions: 15632,
            tx_change_24h: 5.8,
            active_users: 3250,
            pending_challenges: 2,
        },
        recent_alerts: vec![
            SystemAlert {
                id: "alert-001".to_string(),
                severity: "warning".to_string(),
                message: "High gas prices detected on L1".to_string(),
                timestamp: 1736380800,
                resolved: true,
            },
            SystemAlert {
                id: "alert-002".to_string(),
                severity: "info".to_string(),
                message: "Scheduled maintenance in 24 hours".to_string(),
                timestamp: 1736467200,
                resolved: false,
            },
        ],
        stats: QuickStats {
            enterprise_accounts: 15,
            active_staff: 8,
            pending_requests: 3,
            open_reports: 2,
        },
    };

    Ok(Json(response))
}

/// GET /v1/admin/transactions
///
/// Returns paginated list of all system transactions for admin view.
pub async fn get_admin_transactions(
    Extension(_state): Extension<Arc<AppState>>,
) -> Result<Json<AdminTransactionsResponse>, ApiError> {
    tracing::debug!("QS Admin: Getting transactions");

    let transactions = vec![
        AdminTransaction {
            id: "tx-001".to_string(),
            tx_type: "lock".to_string(),
            amount: "10000000000000000000".to_string(), // 10 ETH
            token: "ETH".to_string(),
            from: "0x1234567890abcdef1234567890abcdef12345678".to_string(),
            to: None,
            status: "confirmed".to_string(),
            timestamp: 1736467200,
            block_number: 19000001,
            tx_hash: "0xabc123...".to_string(),
            enterprise_id: Some("ent-001".to_string()),
        },
        AdminTransaction {
            id: "tx-002".to_string(),
            tx_type: "unlock".to_string(),
            amount: "5000000000000000000".to_string(), // 5 ETH
            token: "ETH".to_string(),
            from: "0xabcdef1234567890abcdef1234567890abcdef12".to_string(),
            to: Some("0x9876543210fedcba9876543210fedcba98765432".to_string()),
            status: "pending".to_string(),
            timestamp: 1736463600,
            block_number: 19000000,
            tx_hash: "0xdef456...".to_string(),
            enterprise_id: None,
        },
    ];

    Ok(Json(AdminTransactionsResponse {
        transactions,
        total: 15632,
        page: 1,
        page_size: 20,
        filters: TransactionFilters {
            available_types: vec!["lock".to_string(), "unlock".to_string(), "challenge".to_string(), "slash".to_string()],
            available_statuses: vec!["pending".to_string(), "confirmed".to_string(), "failed".to_string()],
        },
    }))
}

/// GET /v1/admin/nodes
///
/// Returns list of all network nodes with their status and metrics.
pub async fn get_admin_nodes(
    Extension(_state): Extension<Arc<AppState>>,
) -> Result<Json<AdminNodesResponse>, ApiError> {
    tracing::debug!("QS Admin: Getting nodes");

    let nodes = vec![
        AdminNode {
            id: "node-001".to_string(),
            name: "L3-Aegis-Primary".to_string(),
            node_type: "L3-Validator".to_string(),
            status: NodeStatus::Online,
            version: "1.2.0".to_string(),
            last_seen: 1736467200,
            location: "US-East".to_string(),
            metrics: NodeMetrics {
                block_height: 1500000,
                peer_count: 24,
                cpu_usage: 45.2,
                memory_usage: 62.8,
                disk_usage: 35.5,
            },
        },
        AdminNode {
            id: "node-002".to_string(),
            name: "L3-Aegis-Secondary".to_string(),
            node_type: "L3-Validator".to_string(),
            status: NodeStatus::Online,
            version: "1.2.0".to_string(),
            last_seen: 1736467200,
            location: "EU-West".to_string(),
            metrics: NodeMetrics {
                block_height: 1500000,
                peer_count: 22,
                cpu_usage: 38.5,
                memory_usage: 58.2,
                disk_usage: 32.1,
            },
        },
        AdminNode {
            id: "node-003".to_string(),
            name: "Prover-Node-Alpha".to_string(),
            node_type: "Prover".to_string(),
            status: NodeStatus::Online,
            version: "1.2.0".to_string(),
            last_seen: 1736467200,
            location: "AP-Northeast".to_string(),
            metrics: NodeMetrics {
                block_height: 1500000,
                peer_count: 18,
                cpu_usage: 72.3,
                memory_usage: 81.5,
                disk_usage: 45.8,
            },
        },
        AdminNode {
            id: "node-004".to_string(),
            name: "Observer-Node-1".to_string(),
            node_type: "Observer".to_string(),
            status: NodeStatus::Syncing,
            version: "1.1.9".to_string(),
            last_seen: 1736466000,
            location: "US-West".to_string(),
            metrics: NodeMetrics {
                block_height: 1499850,
                peer_count: 15,
                cpu_usage: 55.0,
                memory_usage: 48.2,
                disk_usage: 28.5,
            },
        },
    ];

    Ok(Json(AdminNodesResponse {
        nodes,
        summary: NodesSummary {
            total: 12,
            online: 10,
            offline: 0,
            syncing: 1,
            maintenance: 1,
        },
    }))
}

/// GET /v1/admin/staff
///
/// Returns list of all staff members.
pub async fn get_staff(
    Extension(_state): Extension<Arc<AppState>>,
) -> Result<Json<StaffListResponse>, ApiError> {
    tracing::debug!("QS Admin: Getting staff list");

    let staff = vec![
        StaffMember {
            id: "staff-001".to_string(),
            email: "admin@quantumshield.io".to_string(),
            name: "System Admin".to_string(),
            role: StaffRole::SuperAdmin,
            status: "active".to_string(),
            created_at: 1704067200,
            last_login: Some(1736467200),
            mfa_enabled: true,
            permissions: vec!["*".to_string()],
        },
        StaffMember {
            id: "staff-002".to_string(),
            email: "ops@quantumshield.io".to_string(),
            name: "Operations Manager".to_string(),
            role: StaffRole::Admin,
            status: "active".to_string(),
            created_at: 1706745600,
            last_login: Some(1736380800),
            mfa_enabled: true,
            permissions: vec![
                "nodes:read".to_string(),
                "nodes:manage".to_string(),
                "reports:read".to_string(),
                "audit:read".to_string(),
            ],
        },
        StaffMember {
            id: "staff-003".to_string(),
            email: "support@quantumshield.io".to_string(),
            name: "Support Lead".to_string(),
            role: StaffRole::Support,
            status: "active".to_string(),
            created_at: 1709424000,
            last_login: Some(1736294400),
            mfa_enabled: true,
            permissions: vec![
                "enterprise:read".to_string(),
                "transactions:read".to_string(),
            ],
        },
    ];

    Ok(Json(StaffListResponse {
        staff,
        total: 8,
    }))
}

/// POST /v1/admin/staff
///
/// Creates a new staff member.
pub async fn create_staff(
    Extension(_state): Extension<Arc<AppState>>,
    Json(req): Json<CreateStaffRequest>,
) -> Result<Json<CreateStaffResponse>, ApiError> {
    tracing::info!("QS Admin: Creating staff member - {}", req.email);

    // Generate temporary password (in production, use secure random generation)
    let temp_password = format!("TempPass-{}", uuid::Uuid::new_v4().to_string().chars().take(8).collect::<String>());

    Ok(Json(CreateStaffResponse {
        id: format!("staff-{}", uuid::Uuid::new_v4().to_string().chars().take(8).collect::<String>()),
        email: req.email,
        name: req.name,
        role: req.role,
        temporary_password: temp_password,
        message: "Staff member created. Temporary password sent to email.".to_string(),
    }))
}

/// GET /v1/admin/reports
///
/// Returns list of available reports.
pub async fn get_reports(
    Extension(_state): Extension<Arc<AppState>>,
) -> Result<Json<ReportsResponse>, ApiError> {
    tracing::debug!("QS Admin: Getting reports");

    let reports = vec![
        Report {
            id: "report-001".to_string(),
            name: "Monthly Transaction Summary - December 2025".to_string(),
            report_type: "transaction_summary".to_string(),
            status: "completed".to_string(),
            generated_at: 1735689600,
            generated_by: "admin@quantumshield.io".to_string(),
            download_url: Some("/reports/download/report-001".to_string()),
            file_size: Some(1024 * 512), // 512KB
        },
        Report {
            id: "report-002".to_string(),
            name: "Enterprise Usage Report - Q4 2025".to_string(),
            report_type: "enterprise_usage".to_string(),
            status: "completed".to_string(),
            generated_at: 1735603200,
            generated_by: "ops@quantumshield.io".to_string(),
            download_url: Some("/reports/download/report-002".to_string()),
            file_size: Some(1024 * 256), // 256KB
        },
        Report {
            id: "report-003".to_string(),
            name: "Security Audit Report - January 2026".to_string(),
            report_type: "security_audit".to_string(),
            status: "generating".to_string(),
            generated_at: 1736467200,
            generated_by: "admin@quantumshield.io".to_string(),
            download_url: None,
            file_size: None,
        },
    ];

    Ok(Json(ReportsResponse {
        reports,
        total: 25,
        available_types: vec![
            "transaction_summary".to_string(),
            "enterprise_usage".to_string(),
            "security_audit".to_string(),
            "prover_performance".to_string(),
            "compliance".to_string(),
        ],
    }))
}

/// GET /v1/admin/audit-log
///
/// Returns paginated audit log entries.
pub async fn get_audit_log(
    Extension(_state): Extension<Arc<AppState>>,
) -> Result<Json<AuditLogResponse>, ApiError> {
    tracing::debug!("QS Admin: Getting audit log");

    let entries = vec![
        AuditEntry {
            id: "audit-001".to_string(),
            action: AuditAction::Login,
            actor: "admin@quantumshield.io".to_string(),
            actor_type: "staff".to_string(),
            target: None,
            target_type: None,
            details: serde_json::json!({
                "method": "password",
                "mfa": true
            }),
            timestamp: 1736467200,
            ip_address: "192.168.1.100".to_string(),
            user_agent: Some("Mozilla/5.0...".to_string()),
        },
        AuditEntry {
            id: "audit-002".to_string(),
            action: AuditAction::ParameterChange,
            actor: "admin@quantumshield.io".to_string(),
            actor_type: "staff".to_string(),
            target: Some("MAX_LOCK_DURATION".to_string()),
            target_type: Some("parameter".to_string()),
            details: serde_json::json!({
                "oldValue": "31536000",
                "newValue": "63072000",
                "reason": "Extend maximum lock duration to 2 years"
            }),
            timestamp: 1736463600,
            ip_address: "192.168.1.100".to_string(),
            user_agent: Some("Mozilla/5.0...".to_string()),
        },
        AuditEntry {
            id: "audit-003".to_string(),
            action: AuditAction::ProverApproved,
            actor: "ops@quantumshield.io".to_string(),
            actor_type: "staff".to_string(),
            target: Some("prover-005".to_string()),
            target_type: Some("prover".to_string()),
            details: serde_json::json!({
                "proverName": "Quantum Prover Delta",
                "stake": "500000"
            }),
            timestamp: 1736380800,
            ip_address: "192.168.1.101".to_string(),
            user_agent: Some("Mozilla/5.0...".to_string()),
        },
    ];

    Ok(Json(AuditLogResponse {
        entries,
        total: 1250,
        page: 1,
        page_size: 50,
    }))
}

/// GET /v1/admin/parameters
///
/// Returns list of system parameters.
pub async fn get_parameters(
    Extension(_state): Extension<Arc<AppState>>,
) -> Result<Json<ParametersResponse>, ApiError> {
    tracing::debug!("QS Admin: Getting parameters");

    let parameters = vec![
        SystemParameter {
            key: "MIN_LOCK_AMOUNT".to_string(),
            value: "100000000000000000".to_string(), // 0.1 ETH
            param_type: "uint256".to_string(),
            category: "lock".to_string(),
            description: "Minimum amount for a lock transaction".to_string(),
            last_modified: 1704067200,
            modified_by: "admin@quantumshield.io".to_string(),
            editable: true,
            requires_approval: true,
        },
        SystemParameter {
            key: "MAX_LOCK_DURATION".to_string(),
            value: "63072000".to_string(), // 2 years
            param_type: "uint256".to_string(),
            category: "lock".to_string(),
            description: "Maximum lock duration in seconds".to_string(),
            last_modified: 1736463600,
            modified_by: "admin@quantumshield.io".to_string(),
            editable: true,
            requires_approval: true,
        },
        SystemParameter {
            key: "PROVER_MIN_STAKE".to_string(),
            value: "100000000000000000000000".to_string(), // 100,000 QS
            param_type: "uint256".to_string(),
            category: "prover".to_string(),
            description: "Minimum stake required for prover registration".to_string(),
            last_modified: 1709424000,
            modified_by: "admin@quantumshield.io".to_string(),
            editable: true,
            requires_approval: true,
        },
        SystemParameter {
            key: "CHALLENGE_PERIOD".to_string(),
            value: "172800".to_string(), // 48 hours
            param_type: "uint256".to_string(),
            category: "challenge".to_string(),
            description: "Challenge period duration in seconds".to_string(),
            last_modified: 1704067200,
            modified_by: "admin@quantumshield.io".to_string(),
            editable: true,
            requires_approval: true,
        },
        SystemParameter {
            key: "SLASHING_RATE".to_string(),
            value: "1000".to_string(), // 10% (basis points)
            param_type: "uint256".to_string(),
            category: "slashing".to_string(),
            description: "Base slashing rate in basis points".to_string(),
            last_modified: 1704067200,
            modified_by: "admin@quantumshield.io".to_string(),
            editable: true,
            requires_approval: true,
        },
    ];

    let categories = vec![
        ParameterCategory {
            id: "lock".to_string(),
            name: "Lock Parameters".to_string(),
            description: "Parameters related to lock operations".to_string(),
            count: 5,
        },
        ParameterCategory {
            id: "prover".to_string(),
            name: "Prover Parameters".to_string(),
            description: "Parameters related to prover management".to_string(),
            count: 4,
        },
        ParameterCategory {
            id: "challenge".to_string(),
            name: "Challenge Parameters".to_string(),
            description: "Parameters related to challenge mechanism".to_string(),
            count: 3,
        },
        ParameterCategory {
            id: "slashing".to_string(),
            name: "Slashing Parameters".to_string(),
            description: "Parameters related to slashing mechanism".to_string(),
            count: 2,
        },
    ];

    Ok(Json(ParametersResponse {
        parameters,
        categories,
    }))
}

/// POST /v1/admin/parameters/change-request
///
/// Creates a parameter change request.
pub async fn create_parameter_change_request(
    Extension(_state): Extension<Arc<AppState>>,
    Json(req): Json<ParameterChangeRequest>,
) -> Result<Json<ParameterChangeResponse>, ApiError> {
    tracing::info!("QS Admin: Creating parameter change request for {}", req.key);

    // Mock: Get current value (in production, query from blockchain/database)
    let current_value = match req.key.as_str() {
        "MIN_LOCK_AMOUNT" => "100000000000000000",
        "MAX_LOCK_DURATION" => "63072000",
        "PROVER_MIN_STAKE" => "100000000000000000000000",
        _ => "0",
    };

    Ok(Json(ParameterChangeResponse {
        request_id: format!("pcr-{}", uuid::Uuid::new_v4().to_string().chars().take(8).collect::<String>()),
        key: req.key,
        current_value: current_value.to_string(),
        new_value: req.new_value,
        status: "pending_approval".to_string(),
        requires_approval: true,
        message: "Parameter change request submitted. Awaiting Security Council approval (5/9).".to_string(),
    }))
}

/// GET /v1/admin/enterprise/accounts
///
/// Returns list of enterprise accounts.
pub async fn get_enterprise_accounts(
    Extension(_state): Extension<Arc<AppState>>,
) -> Result<Json<EnterpriseAccountsResponse>, ApiError> {
    tracing::debug!("QS Admin: Getting enterprise accounts");

    let accounts = vec![
        EnterpriseAccount {
            id: "ent-001".to_string(),
            name: "Acme Corporation".to_string(),
            tier: EnterpriseTier::Enterprise,
            status: "active".to_string(),
            primary_contact: EnterpriseContact {
                name: "John Smith".to_string(),
                email: "john@acme.com".to_string(),
                phone: Some("+1-555-0100".to_string()),
            },
            created_at: 1704067200,
            tvl: "50000000000000000000000".to_string(), // 50,000 ETH
            monthly_volume: "10000000000000000000000".to_string(), // 10,000 ETH
            api_keys_count: 5,
            users_count: 12,
        },
        EnterpriseAccount {
            id: "ent-002".to_string(),
            name: "TechStart Inc".to_string(),
            tier: EnterpriseTier::Professional,
            status: "active".to_string(),
            primary_contact: EnterpriseContact {
                name: "Jane Doe".to_string(),
                email: "jane@techstart.io".to_string(),
                phone: None,
            },
            created_at: 1709424000,
            tvl: "15000000000000000000000".to_string(), // 15,000 ETH
            monthly_volume: "3000000000000000000000".to_string(), // 3,000 ETH
            api_keys_count: 3,
            users_count: 5,
        },
        EnterpriseAccount {
            id: "ent-003".to_string(),
            name: "BlockChain Labs".to_string(),
            tier: EnterpriseTier::Starter,
            status: "pending".to_string(),
            primary_contact: EnterpriseContact {
                name: "Bob Wilson".to_string(),
                email: "bob@bcl.io".to_string(),
                phone: Some("+44-20-1234-5678".to_string()),
            },
            created_at: 1736380800,
            tvl: "0".to_string(),
            monthly_volume: "0".to_string(),
            api_keys_count: 1,
            users_count: 2,
        },
    ];

    Ok(Json(EnterpriseAccountsResponse {
        accounts,
        total: 15,
        summary: EnterpriseSummary {
            total_accounts: 15,
            active_accounts: 12,
            pending_accounts: 3,
            total_tvl: "125000000000000000000000".to_string(), // 125,000 ETH
        },
    }))
}

/// POST /v1/admin/enterprise/accounts
///
/// Creates a new enterprise account.
pub async fn create_enterprise_account(
    Extension(_state): Extension<Arc<AppState>>,
    Json(req): Json<CreateEnterpriseAccountRequest>,
) -> Result<Json<CreateEnterpriseAccountResponse>, ApiError> {
    tracing::info!("QS Admin: Creating enterprise account - {}", req.name);

    // Generate API key (in production, use secure random generation)
    let api_key = format!("qs_live_{}", uuid::Uuid::new_v4().to_string().replace("-", ""));

    Ok(Json(CreateEnterpriseAccountResponse {
        id: format!("ent-{}", uuid::Uuid::new_v4().to_string().chars().take(8).collect::<String>()),
        name: req.name,
        tier: req.tier,
        status: "pending".to_string(),
        api_key,
        message: "Enterprise account created. Activation email sent to primary contact.".to_string(),
    }))
}

// ============================================================================
// TASK-P5-018: 4BFT Contract Management API (4 Endpoints)
// ============================================================================
//
// Spec Reference: PHASE5_INTEGRATION_PLAN.md §3.4, EDITION_SWITCH_SPEC.md
//
// Enterprise Edition (4BFT) features:
// - Fixed 4-node BFT consensus (all phases)
// - CONTRACT_BASED Prover approval mode
// - Governance: CENTRALIZED/MULTISIG only
// - SLA-based service with dedicated support
//
// Additional Endpoints:
// 1. GET  /v1/admin/enterprise/accounts/:id - Enterprise account detail
// 2. PUT  /v1/admin/enterprise/accounts/:id - Update enterprise account
// 3. GET  /v1/admin/enterprise/contracts    - List enterprise contracts
// 4. POST /v1/admin/enterprise/contracts    - Create enterprise contract

// ============================================================================
// 4BFT Contract Management Types
// ============================================================================

/// Contract status enum for 4BFT Enterprise
#[derive(Debug, Serialize, Deserialize, Clone, Copy, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum ContractStatus {
    /// Contract drafted, awaiting signatures
    Draft,
    /// Pending legal review
    PendingReview,
    /// Contract active
    Active,
    /// Contract suspended
    Suspended,
    /// Contract terminated
    Terminated,
    /// Contract expired
    Expired,
}

/// Contract type enum
#[derive(Debug, Serialize, Deserialize, Clone, Copy, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum ContractType {
    /// Standard enterprise contract
    Standard,
    /// Custom enterprise contract with SLA
    CustomSla,
    /// Proof of concept / trial
    Trial,
    /// Partner / strategic alliance
    Partner,
}

/// 4BFT node configuration for enterprise
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Enterprise4BftConfig {
    /// Node count (always 4 for 4BFT)
    pub node_count: u8,
    /// Consensus type (FIXED_4BFT)
    pub consensus_type: String,
    /// Whether dynamic membership is enabled (always false for Enterprise)
    pub dynamic_membership: bool,
    /// Geographic distribution of nodes
    pub node_distribution: Vec<NodeLocation>,
    /// Backup node configuration
    pub backup_nodes: u8,
}

/// Node location for geographic distribution
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct NodeLocation {
    pub region: String,
    pub availability_zone: String,
    pub is_primary: bool,
}

/// SLA terms for enterprise contract
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SlaTerms {
    /// Uptime guarantee percentage (e.g., 99.9)
    pub uptime_guarantee: f64,
    /// Maximum response time in milliseconds
    pub max_response_time_ms: u64,
    /// Support tier (24x7, business hours, etc.)
    pub support_tier: String,
    /// Incident response time in minutes
    pub incident_response_minutes: u32,
    /// Data retention period in days
    pub data_retention_days: u32,
    /// Penalty terms for SLA breach
    pub penalty_terms: Option<String>,
}

/// Enterprise account detail response
#[derive(Debug, Serialize)]
pub struct EnterpriseAccountDetailResponse {
    /// Account details
    pub account: EnterpriseAccountDetail,
    /// 4BFT configuration
    pub bft_config: Enterprise4BftConfig,
    /// Active contracts
    pub contracts: Vec<EnterpriseContractSummary>,
    /// Usage statistics
    pub usage_stats: EnterpriseUsageStats,
    /// Prover assignments
    pub assigned_provers: Vec<AssignedProver>,
}

/// Detailed enterprise account info
#[derive(Debug, Serialize, Clone)]
pub struct EnterpriseAccountDetail {
    pub id: String,
    pub name: String,
    pub tier: EnterpriseTier,
    pub status: String,
    #[serde(rename = "primaryContact")]
    pub primary_contact: EnterpriseContact,
    #[serde(rename = "secondaryContacts")]
    pub secondary_contacts: Vec<EnterpriseContact>,
    #[serde(rename = "billingContact")]
    pub billing_contact: Option<EnterpriseContact>,
    #[serde(rename = "technicalContact")]
    pub technical_contact: Option<EnterpriseContact>,
    #[serde(rename = "createdAt")]
    pub created_at: u64,
    #[serde(rename = "activatedAt")]
    pub activated_at: Option<u64>,
    pub tvl: String,
    #[serde(rename = "monthlyVolume")]
    pub monthly_volume: String,
    #[serde(rename = "apiKeysCount")]
    pub api_keys_count: u32,
    #[serde(rename = "usersCount")]
    pub users_count: u32,
    /// Legal entity information
    #[serde(rename = "legalEntity")]
    pub legal_entity: LegalEntityInfo,
    /// Notes / comments
    pub notes: Option<String>,
}

/// Legal entity information
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LegalEntityInfo {
    /// Registered company name
    #[serde(rename = "companyName")]
    pub company_name: String,
    /// Registration number
    #[serde(rename = "registrationNumber")]
    pub registration_number: Option<String>,
    /// Jurisdiction
    pub jurisdiction: String,
    /// Address
    pub address: String,
    /// Tax ID
    #[serde(rename = "taxId")]
    pub tax_id: Option<String>,
}

/// Contract summary for account detail
#[derive(Debug, Serialize, Clone)]
pub struct EnterpriseContractSummary {
    pub id: String,
    #[serde(rename = "contractType")]
    pub contract_type: ContractType,
    pub status: ContractStatus,
    #[serde(rename = "startDate")]
    pub start_date: u64,
    #[serde(rename = "endDate")]
    pub end_date: Option<u64>,
    #[serde(rename = "monthlyFee")]
    pub monthly_fee: String,
}

/// Enterprise usage statistics
#[derive(Debug, Serialize)]
pub struct EnterpriseUsageStats {
    /// Total transactions this month
    #[serde(rename = "transactionsThisMonth")]
    pub transactions_this_month: u64,
    /// Total volume this month (ETH)
    #[serde(rename = "volumeThisMonth")]
    pub volume_this_month: String,
    /// API calls this month
    #[serde(rename = "apiCallsThisMonth")]
    pub api_calls_this_month: u64,
    /// Average response time (ms)
    #[serde(rename = "avgResponseTime")]
    pub avg_response_time: u64,
    /// Current uptime percentage
    #[serde(rename = "uptimePercentage")]
    pub uptime_percentage: f64,
    /// Number of incidents this month
    #[serde(rename = "incidentsThisMonth")]
    pub incidents_this_month: u32,
}

/// Assigned prover info
#[derive(Debug, Serialize, Clone)]
pub struct AssignedProver {
    #[serde(rename = "proverId")]
    pub prover_id: String,
    pub name: String,
    pub status: String,
    #[serde(rename = "assignedAt")]
    pub assigned_at: u64,
    #[serde(rename = "signaturesProvided")]
    pub signatures_provided: u64,
}

/// Update enterprise account request
#[derive(Debug, Deserialize)]
pub struct UpdateEnterpriseAccountRequest {
    pub name: Option<String>,
    pub tier: Option<EnterpriseTier>,
    pub status: Option<String>,
    #[serde(rename = "primaryContact")]
    pub primary_contact: Option<CreateEnterpriseContact>,
    #[serde(rename = "secondaryContacts")]
    pub secondary_contacts: Option<Vec<CreateEnterpriseContact>>,
    #[serde(rename = "billingContact")]
    pub billing_contact: Option<CreateEnterpriseContact>,
    #[serde(rename = "technicalContact")]
    pub technical_contact: Option<CreateEnterpriseContact>,
    #[serde(rename = "legalEntity")]
    pub legal_entity: Option<LegalEntityInfo>,
    pub notes: Option<String>,
}

/// Update enterprise account response
#[derive(Debug, Serialize)]
pub struct UpdateEnterpriseAccountResponse {
    pub id: String,
    pub name: String,
    pub tier: EnterpriseTier,
    pub status: String,
    pub updated: bool,
    #[serde(rename = "updatedAt")]
    pub updated_at: u64,
    pub message: String,
}

/// Enterprise contracts list response
#[derive(Debug, Serialize)]
pub struct EnterpriseContractsResponse {
    pub contracts: Vec<EnterpriseContract>,
    pub total: u32,
    pub summary: ContractsSummary,
}

/// Full enterprise contract details
#[derive(Debug, Serialize, Clone)]
pub struct EnterpriseContract {
    pub id: String,
    /// Associated enterprise account ID
    #[serde(rename = "enterpriseId")]
    pub enterprise_id: String,
    /// Enterprise account name
    #[serde(rename = "enterpriseName")]
    pub enterprise_name: String,
    #[serde(rename = "contractType")]
    pub contract_type: ContractType,
    pub status: ContractStatus,
    /// Contract number for legal reference
    #[serde(rename = "contractNumber")]
    pub contract_number: String,
    /// Contract start date
    #[serde(rename = "startDate")]
    pub start_date: u64,
    /// Contract end date (None for indefinite)
    #[serde(rename = "endDate")]
    pub end_date: Option<u64>,
    /// Auto-renewal enabled
    #[serde(rename = "autoRenewal")]
    pub auto_renewal: bool,
    /// Monthly fee in USD
    #[serde(rename = "monthlyFee")]
    pub monthly_fee: String,
    /// Annual fee in USD (if applicable)
    #[serde(rename = "annualFee")]
    pub annual_fee: Option<String>,
    /// 4BFT configuration for this contract
    #[serde(rename = "bftConfig")]
    pub bft_config: Enterprise4BftConfig,
    /// SLA terms
    #[serde(rename = "slaTerms")]
    pub sla_terms: SlaTerms,
    /// Contract document hash (SHA3-256)
    #[serde(rename = "documentHash")]
    pub document_hash: String,
    /// Signatures
    pub signatures: Vec<ContractSignature>,
    /// Created timestamp
    #[serde(rename = "createdAt")]
    pub created_at: u64,
    /// Last updated timestamp
    #[serde(rename = "updatedAt")]
    pub updated_at: u64,
    /// Created by (admin email)
    #[serde(rename = "createdBy")]
    pub created_by: String,
}

/// Contract signature
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ContractSignature {
    /// Signer role (enterprise_admin, qs_admin, legal)
    pub role: String,
    /// Signer name
    #[serde(rename = "signerName")]
    pub signer_name: String,
    /// Signer email
    #[serde(rename = "signerEmail")]
    pub signer_email: String,
    /// Signature hash
    #[serde(rename = "signatureHash")]
    pub signature_hash: Option<String>,
    /// Signed timestamp
    #[serde(rename = "signedAt")]
    pub signed_at: Option<u64>,
}

/// Contracts summary statistics
#[derive(Debug, Serialize)]
pub struct ContractsSummary {
    #[serde(rename = "totalContracts")]
    pub total_contracts: u32,
    #[serde(rename = "activeContracts")]
    pub active_contracts: u32,
    #[serde(rename = "pendingContracts")]
    pub pending_contracts: u32,
    #[serde(rename = "expiringThisMonth")]
    pub expiring_this_month: u32,
    #[serde(rename = "totalMonthlyRevenue")]
    pub total_monthly_revenue: String,
}

/// Create enterprise contract request
#[derive(Debug, Deserialize)]
pub struct CreateEnterpriseContractRequest {
    /// Associated enterprise account ID
    #[serde(rename = "enterpriseId")]
    pub enterprise_id: String,
    #[serde(rename = "contractType")]
    pub contract_type: ContractType,
    /// Contract start date (Unix timestamp)
    #[serde(rename = "startDate")]
    pub start_date: u64,
    /// Contract duration in months (None for indefinite)
    #[serde(rename = "durationMonths")]
    pub duration_months: Option<u32>,
    /// Auto-renewal enabled
    #[serde(rename = "autoRenewal")]
    pub auto_renewal: bool,
    /// Monthly fee in USD
    #[serde(rename = "monthlyFee")]
    pub monthly_fee: String,
    /// SLA terms
    #[serde(rename = "slaTerms")]
    pub sla_terms: SlaTerms,
    /// 4BFT node distribution preferences
    #[serde(rename = "nodeDistribution")]
    pub node_distribution: Option<Vec<NodeLocation>>,
    /// Required signers
    pub signers: Vec<ContractSignerRequest>,
}

/// Contract signer request
#[derive(Debug, Deserialize)]
pub struct ContractSignerRequest {
    pub role: String,
    #[serde(rename = "signerName")]
    pub signer_name: String,
    #[serde(rename = "signerEmail")]
    pub signer_email: String,
}

/// Create enterprise contract response
#[derive(Debug, Serialize)]
pub struct CreateEnterpriseContractResponse {
    pub id: String,
    #[serde(rename = "contractNumber")]
    pub contract_number: String,
    #[serde(rename = "enterpriseId")]
    pub enterprise_id: String,
    pub status: ContractStatus,
    #[serde(rename = "documentHash")]
    pub document_hash: String,
    #[serde(rename = "signingUrl")]
    pub signing_url: String,
    pub message: String,
}

// ============================================================================
// 4BFT Contract Management Endpoint Handlers
// ============================================================================

/// GET /v1/admin/enterprise/accounts/:id
///
/// Returns detailed information about a specific enterprise account,
/// including 4BFT configuration, contracts, and usage statistics.
pub async fn get_enterprise_account_detail(
    Extension(_state): Extension<Arc<AppState>>,
    Path(account_id): Path<String>,
) -> Result<Json<EnterpriseAccountDetailResponse>, ApiError> {
    tracing::debug!("QS Admin: Getting enterprise account detail - {}", account_id);

    // Mock response (in production, fetch from database)
    let response = EnterpriseAccountDetailResponse {
        account: EnterpriseAccountDetail {
            id: account_id.clone(),
            name: "Acme Corporation".to_string(),
            tier: EnterpriseTier::Enterprise,
            status: "active".to_string(),
            primary_contact: EnterpriseContact {
                name: "John Smith".to_string(),
                email: "john@acme.com".to_string(),
                phone: Some("+1-555-0100".to_string()),
            },
            secondary_contacts: vec![
                EnterpriseContact {
                    name: "Jane Doe".to_string(),
                    email: "jane@acme.com".to_string(),
                    phone: None,
                },
            ],
            billing_contact: Some(EnterpriseContact {
                name: "Finance Team".to_string(),
                email: "finance@acme.com".to_string(),
                phone: Some("+1-555-0101".to_string()),
            }),
            technical_contact: Some(EnterpriseContact {
                name: "Tech Lead".to_string(),
                email: "tech@acme.com".to_string(),
                phone: None,
            }),
            created_at: 1704067200,
            activated_at: Some(1704153600),
            tvl: "50000000000000000000000".to_string(), // 50,000 ETH
            monthly_volume: "10000000000000000000000".to_string(), // 10,000 ETH
            api_keys_count: 5,
            users_count: 12,
            legal_entity: LegalEntityInfo {
                company_name: "Acme Corporation Inc.".to_string(),
                registration_number: Some("DE-12345678".to_string()),
                jurisdiction: "Delaware, USA".to_string(),
                address: "123 Main St, Wilmington, DE 19801, USA".to_string(),
                tax_id: Some("12-3456789".to_string()),
            },
            notes: Some("Premium customer, priority support".to_string()),
        },
        bft_config: Enterprise4BftConfig {
            node_count: 4,
            consensus_type: "FIXED_4BFT".to_string(),
            dynamic_membership: false,
            node_distribution: vec![
                NodeLocation {
                    region: "US-East".to_string(),
                    availability_zone: "us-east-1a".to_string(),
                    is_primary: true,
                },
                NodeLocation {
                    region: "US-West".to_string(),
                    availability_zone: "us-west-2a".to_string(),
                    is_primary: false,
                },
                NodeLocation {
                    region: "EU-West".to_string(),
                    availability_zone: "eu-west-1a".to_string(),
                    is_primary: false,
                },
                NodeLocation {
                    region: "AP-Northeast".to_string(),
                    availability_zone: "ap-northeast-1a".to_string(),
                    is_primary: false,
                },
            ],
            backup_nodes: 2,
        },
        contracts: vec![
            EnterpriseContractSummary {
                id: "contract-001".to_string(),
                contract_type: ContractType::CustomSla,
                status: ContractStatus::Active,
                start_date: 1704067200,
                end_date: Some(1735689600),
                monthly_fee: "25000".to_string(),
            },
        ],
        usage_stats: EnterpriseUsageStats {
            transactions_this_month: 1250,
            volume_this_month: "8500000000000000000000".to_string(), // 8,500 ETH
            api_calls_this_month: 125000,
            avg_response_time: 145,
            uptime_percentage: 99.98,
            incidents_this_month: 0,
        },
        assigned_provers: vec![
            AssignedProver {
                prover_id: "prover-001".to_string(),
                name: "Quantum Prover Alpha".to_string(),
                status: "active".to_string(),
                assigned_at: 1704153600,
                signatures_provided: 3250,
            },
            AssignedProver {
                prover_id: "prover-002".to_string(),
                name: "Quantum Prover Beta".to_string(),
                status: "active".to_string(),
                assigned_at: 1704153600,
                signatures_provided: 3180,
            },
        ],
    };

    Ok(Json(response))
}

/// PUT /v1/admin/enterprise/accounts/:id
///
/// Updates an enterprise account's information.
pub async fn update_enterprise_account(
    Extension(_state): Extension<Arc<AppState>>,
    Path(account_id): Path<String>,
    Json(req): Json<UpdateEnterpriseAccountRequest>,
) -> Result<Json<UpdateEnterpriseAccountResponse>, ApiError> {
    tracing::info!("QS Admin: Updating enterprise account - {}", account_id);

    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs();

    Ok(Json(UpdateEnterpriseAccountResponse {
        id: account_id,
        name: req.name.unwrap_or_else(|| "Acme Corporation".to_string()),
        tier: req.tier.unwrap_or(EnterpriseTier::Enterprise),
        status: req.status.unwrap_or_else(|| "active".to_string()),
        updated: true,
        updated_at: now,
        message: "Enterprise account updated successfully.".to_string(),
    }))
}

/// GET /v1/admin/enterprise/contracts
///
/// Returns list of all enterprise contracts across all accounts.
pub async fn get_enterprise_contracts(
    Extension(_state): Extension<Arc<AppState>>,
) -> Result<Json<EnterpriseContractsResponse>, ApiError> {
    tracing::debug!("QS Admin: Getting enterprise contracts");

    let contracts = vec![
        EnterpriseContract {
            id: "contract-001".to_string(),
            enterprise_id: "ent-001".to_string(),
            enterprise_name: "Acme Corporation".to_string(),
            contract_type: ContractType::CustomSla,
            status: ContractStatus::Active,
            contract_number: "QS-ENT-2025-001".to_string(),
            start_date: 1704067200,
            end_date: Some(1735689600),
            auto_renewal: true,
            monthly_fee: "25000".to_string(),
            annual_fee: Some("270000".to_string()), // 10% discount
            bft_config: Enterprise4BftConfig {
                node_count: 4,
                consensus_type: "FIXED_4BFT".to_string(),
                dynamic_membership: false,
                node_distribution: vec![
                    NodeLocation {
                        region: "US-East".to_string(),
                        availability_zone: "us-east-1a".to_string(),
                        is_primary: true,
                    },
                    NodeLocation {
                        region: "EU-West".to_string(),
                        availability_zone: "eu-west-1a".to_string(),
                        is_primary: false,
                    },
                    NodeLocation {
                        region: "AP-Northeast".to_string(),
                        availability_zone: "ap-northeast-1a".to_string(),
                        is_primary: false,
                    },
                    NodeLocation {
                        region: "US-West".to_string(),
                        availability_zone: "us-west-2a".to_string(),
                        is_primary: false,
                    },
                ],
                backup_nodes: 2,
            },
            sla_terms: SlaTerms {
                uptime_guarantee: 99.9,
                max_response_time_ms: 500,
                support_tier: "24x7 Premium".to_string(),
                incident_response_minutes: 15,
                data_retention_days: 365,
                penalty_terms: Some("10% monthly fee credit per 0.1% under SLA".to_string()),
            },
            document_hash: "0x8a7b5c3d2e1f0987654321abcdef0123456789abcdef0123456789abcdef01".to_string(),
            signatures: vec![
                ContractSignature {
                    role: "enterprise_admin".to_string(),
                    signer_name: "John Smith".to_string(),
                    signer_email: "john@acme.com".to_string(),
                    signature_hash: Some("0xabc123...".to_string()),
                    signed_at: Some(1704067200),
                },
                ContractSignature {
                    role: "qs_admin".to_string(),
                    signer_name: "QS Legal".to_string(),
                    signer_email: "legal@quantumshield.io".to_string(),
                    signature_hash: Some("0xdef456...".to_string()),
                    signed_at: Some(1704070800),
                },
            ],
            created_at: 1704060000,
            updated_at: 1704070800,
            created_by: "admin@quantumshield.io".to_string(),
        },
        EnterpriseContract {
            id: "contract-002".to_string(),
            enterprise_id: "ent-002".to_string(),
            enterprise_name: "TechStart Inc".to_string(),
            contract_type: ContractType::Standard,
            status: ContractStatus::Active,
            contract_number: "QS-ENT-2025-002".to_string(),
            start_date: 1709424000,
            end_date: Some(1740960000),
            auto_renewal: false,
            monthly_fee: "10000".to_string(),
            annual_fee: None,
            bft_config: Enterprise4BftConfig {
                node_count: 4,
                consensus_type: "FIXED_4BFT".to_string(),
                dynamic_membership: false,
                node_distribution: vec![
                    NodeLocation {
                        region: "US-East".to_string(),
                        availability_zone: "us-east-1a".to_string(),
                        is_primary: true,
                    },
                    NodeLocation {
                        region: "US-West".to_string(),
                        availability_zone: "us-west-2a".to_string(),
                        is_primary: false,
                    },
                    NodeLocation {
                        region: "EU-West".to_string(),
                        availability_zone: "eu-west-1a".to_string(),
                        is_primary: false,
                    },
                    NodeLocation {
                        region: "EU-Central".to_string(),
                        availability_zone: "eu-central-1a".to_string(),
                        is_primary: false,
                    },
                ],
                backup_nodes: 1,
            },
            sla_terms: SlaTerms {
                uptime_guarantee: 99.5,
                max_response_time_ms: 1000,
                support_tier: "Business Hours".to_string(),
                incident_response_minutes: 60,
                data_retention_days: 90,
                penalty_terms: None,
            },
            document_hash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef".to_string(),
            signatures: vec![
                ContractSignature {
                    role: "enterprise_admin".to_string(),
                    signer_name: "Jane Doe".to_string(),
                    signer_email: "jane@techstart.io".to_string(),
                    signature_hash: Some("0x789abc...".to_string()),
                    signed_at: Some(1709424000),
                },
                ContractSignature {
                    role: "qs_admin".to_string(),
                    signer_name: "QS Legal".to_string(),
                    signer_email: "legal@quantumshield.io".to_string(),
                    signature_hash: Some("0xdef012...".to_string()),
                    signed_at: Some(1709427600),
                },
            ],
            created_at: 1709420400,
            updated_at: 1709427600,
            created_by: "ops@quantumshield.io".to_string(),
        },
        EnterpriseContract {
            id: "contract-003".to_string(),
            enterprise_id: "ent-003".to_string(),
            enterprise_name: "BlockChain Labs".to_string(),
            contract_type: ContractType::Trial,
            status: ContractStatus::PendingReview,
            contract_number: "QS-ENT-2026-001".to_string(),
            start_date: 1736380800,
            end_date: Some(1738972800), // 30-day trial
            auto_renewal: false,
            monthly_fee: "0".to_string(), // Trial period free
            annual_fee: None,
            bft_config: Enterprise4BftConfig {
                node_count: 4,
                consensus_type: "FIXED_4BFT".to_string(),
                dynamic_membership: false,
                node_distribution: vec![
                    NodeLocation {
                        region: "EU-West".to_string(),
                        availability_zone: "eu-west-1a".to_string(),
                        is_primary: true,
                    },
                    NodeLocation {
                        region: "EU-Central".to_string(),
                        availability_zone: "eu-central-1a".to_string(),
                        is_primary: false,
                    },
                    NodeLocation {
                        region: "EU-North".to_string(),
                        availability_zone: "eu-north-1a".to_string(),
                        is_primary: false,
                    },
                    NodeLocation {
                        region: "EU-South".to_string(),
                        availability_zone: "eu-south-1a".to_string(),
                        is_primary: false,
                    },
                ],
                backup_nodes: 0,
            },
            sla_terms: SlaTerms {
                uptime_guarantee: 99.0,
                max_response_time_ms: 2000,
                support_tier: "Email Only".to_string(),
                incident_response_minutes: 240,
                data_retention_days: 30,
                penalty_terms: None,
            },
            document_hash: "0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321".to_string(),
            signatures: vec![
                ContractSignature {
                    role: "enterprise_admin".to_string(),
                    signer_name: "Bob Wilson".to_string(),
                    signer_email: "bob@bcl.io".to_string(),
                    signature_hash: None,
                    signed_at: None,
                },
                ContractSignature {
                    role: "qs_admin".to_string(),
                    signer_name: "QS Legal".to_string(),
                    signer_email: "legal@quantumshield.io".to_string(),
                    signature_hash: None,
                    signed_at: None,
                },
            ],
            created_at: 1736377200,
            updated_at: 1736377200,
            created_by: "admin@quantumshield.io".to_string(),
        },
    ];

    Ok(Json(EnterpriseContractsResponse {
        contracts,
        total: 15,
        summary: ContractsSummary {
            total_contracts: 15,
            active_contracts: 12,
            pending_contracts: 2,
            expiring_this_month: 1,
            total_monthly_revenue: "185000".to_string(),
        },
    }))
}

/// POST /v1/admin/enterprise/contracts
///
/// Creates a new enterprise contract for an existing account.
/// This initiates the contract signing workflow.
pub async fn create_enterprise_contract(
    Extension(_state): Extension<Arc<AppState>>,
    Json(req): Json<CreateEnterpriseContractRequest>,
) -> Result<Json<CreateEnterpriseContractResponse>, ApiError> {
    tracing::info!("QS Admin: Creating enterprise contract for account - {}", req.enterprise_id);

    // Generate contract number (in production, use sequential numbering)
    let contract_number = format!(
        "QS-ENT-{}-{}",
        chrono::Utc::now().format("%Y"),
        uuid::Uuid::new_v4().to_string().chars().take(6).collect::<String>().to_uppercase()
    );

    // Generate contract ID
    let contract_id = format!(
        "contract-{}",
        uuid::Uuid::new_v4().to_string().chars().take(8).collect::<String>()
    );

    // Generate document hash (in production, hash actual contract document)
    let document_hash = format!(
        "0x{}",
        uuid::Uuid::new_v4().to_string().replace("-", "") + &uuid::Uuid::new_v4().to_string().replace("-", "")
    );

    // Generate signing URL
    let signing_url = format!(
        "https://contracts.quantumshield.io/sign/{}/{}",
        contract_id,
        uuid::Uuid::new_v4().to_string().chars().take(12).collect::<String>()
    );

    Ok(Json(CreateEnterpriseContractResponse {
        id: contract_id,
        contract_number,
        enterprise_id: req.enterprise_id,
        status: ContractStatus::Draft,
        document_hash,
        signing_url,
        message: "Contract created. Signing requests sent to all parties.".to_string(),
    }))
}
