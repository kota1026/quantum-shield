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
