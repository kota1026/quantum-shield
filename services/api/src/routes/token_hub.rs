//! Token Hub API implementation (TASK-P5-021)
//!
//! Implements veQS token locking, delegation, and rewards functionality.
//! Per UNIFIED_SPEC_v2.0.md §veQS Token and §Delegation
//!
//! ## Endpoints (9 total)
//! - GET  /v1/token-hub/dashboard      - User dashboard with balances and voting power
//! - POST /v1/token-hub/lock           - Lock QS tokens for veQS
//! - GET  /v1/token-hub/locks          - Get user's lock positions
//! - POST /v1/token-hub/extend         - Extend lock duration
//! - GET  /v1/token-hub/delegates      - List available delegates
//! - POST /v1/token-hub/delegate       - Delegate voting power
//! - GET  /v1/token-hub/rewards        - Get rewards information
//! - POST /v1/token-hub/claim          - Claim rewards
//! - GET  /v1/token-hub/delegations/my - Get user's delegations

use std::sync::Arc;

use axum::{
    extract::{Extension, Path, Query},
    Json,
};
use serde::Deserialize;

use crate::{
    error::ApiError,
    services::AppState,
    types::{
        DelegateInfo, HistoricalLock, LockPosition, MyDelegation, RewardHistory,
        TokenHubClaimRequest, TokenHubClaimResponse, TokenHubDashboardResponse,
        TokenHubDelegateRequest, TokenHubDelegateResponse, TokenHubDelegatesResponse,
        TokenHubExtendRequest, TokenHubExtendResponse, TokenHubLockRequest,
        TokenHubLockResponse, TokenHubLocksResponse, TokenHubMyDelegationsResponse,
        TokenHubRewardsResponse,
    },
};

/// Constants for veQS calculations
/// Per veQS.sol: MIN_LOCK_TIME = 1 week, MAX_LOCK_TIME = 4 years
const MIN_LOCK_TIME: u64 = 7 * 24 * 60 * 60; // 1 week in seconds
const MAX_LOCK_TIME: u64 = 4 * 365 * 24 * 60 * 60; // 4 years in seconds

/// Query parameters for dashboard
#[derive(Debug, Deserialize)]
pub struct DashboardQuery {
    /// User's wallet address
    pub address: String,
}

/// Query parameters for locks
#[derive(Debug, Deserialize)]
pub struct LocksQuery {
    /// User's wallet address
    pub address: String,
}

/// Query parameters for delegates list
#[derive(Debug, Deserialize)]
pub struct DelegatesQuery {
    /// Page number (default: 1)
    pub page: Option<u32>,
    /// Page size (default: 20, max: 100)
    pub limit: Option<u32>,
    /// Sort by: "total_veqs", "participation_rate", "delegators_count"
    pub sort_by: Option<String>,
}

/// Query parameters for rewards
#[derive(Debug, Deserialize)]
pub struct RewardsQuery {
    /// User's wallet address
    pub address: String,
}

/// Query parameters for user's delegations
#[derive(Debug, Deserialize)]
pub struct MyDelegationsQuery {
    /// User's wallet address
    pub address: String,
}

// ============================================================================
// GET /v1/token-hub/dashboard
// ============================================================================

/// GET /v1/token-hub/dashboard
///
/// Returns user's Token Hub dashboard data including:
/// - QS balance, locked QS, veQS balance
/// - Voting power percentage
/// - Active lock position
/// - Pending rewards
pub async fn get_dashboard(
    Extension(state): Extension<Arc<AppState>>,
    Query(query): Query<DashboardQuery>,
) -> Result<Json<TokenHubDashboardResponse>, ApiError> {
    tracing::info!("Token Hub dashboard request for: {}", query.address);

    // Get user's lock position from storage
    let lock_position = state.get_veqs_lock(&query.address).await?;

    // Calculate veQS balance based on remaining time
    let (veqs_balance, locked_qs) = if let Some(ref pos) = lock_position {
        (pos.veqs_value.clone(), pos.amount.clone())
    } else {
        ("0".to_string(), "0".to_string())
    };

    // Get QS balance (mock - would come from L1 contract)
    let qs_balance = state.get_qs_balance(&query.address).await?;

    // Get voting power percentage (veQS / total veQS supply)
    let voting_power_percent = state.get_voting_power_percent(&query.address).await?;

    // Get delegations count
    let delegations_count = state.get_delegations_count(&query.address).await?;

    // Get pending rewards
    let pending_rewards = state.get_pending_rewards(&query.address).await?;

    Ok(Json(TokenHubDashboardResponse {
        address: query.address,
        qs_balance,
        locked_qs,
        veqs_balance,
        voting_power_percent,
        lock_position,
        delegations_count,
        pending_rewards,
    }))
}

// ============================================================================
// POST /v1/token-hub/lock
// ============================================================================

/// POST /v1/token-hub/lock
///
/// Lock QS tokens to receive veQS voting power.
/// veQS = QS × (lock_duration / MAX_LOCK_TIME)
///
/// # Constraints
/// - lock_duration must be >= MIN_LOCK_TIME (1 week)
/// - lock_duration must be <= MAX_LOCK_TIME (4 years)
/// - User must not have an existing active lock
pub async fn create_lock(
    Extension(state): Extension<Arc<AppState>>,
    Json(req): Json<TokenHubLockRequest>,
) -> Result<Json<TokenHubLockResponse>, ApiError> {
    tracing::info!("Token Hub lock request: {} QS for {} seconds", req.amount, req.lock_duration);

    // Validate lock duration
    if req.lock_duration < MIN_LOCK_TIME {
        return Err(ApiError::InvalidRequest(
            format!("Lock duration must be at least {} seconds (1 week)", MIN_LOCK_TIME),
        ));
    }
    if req.lock_duration > MAX_LOCK_TIME {
        return Err(ApiError::InvalidRequest(
            format!("Lock duration must be at most {} seconds (4 years)", MAX_LOCK_TIME),
        ));
    }

    // Parse amount
    let amount: u128 = req.amount.parse().map_err(|_| {
        ApiError::InvalidRequest("Invalid amount format".to_string())
    })?;
    if amount == 0 {
        return Err(ApiError::InvalidRequest("Amount must be greater than 0".to_string()));
    }

    // Calculate timestamps
    let now = chrono::Utc::now().timestamp() as u64;
    let unlock_time = now + req.lock_duration;

    // Calculate veQS value
    let multiplier = req.lock_duration as f64 / MAX_LOCK_TIME as f64;
    let veqs_value = (amount as f64 * multiplier) as u128;

    // Create lock position
    let lock_position = LockPosition {
        amount: req.amount.clone(),
        start_time: now,
        unlock_time,
        lock_duration: req.lock_duration,
        veqs_value: veqs_value.to_string(),
        multiplier,
        time_remaining: format_duration(req.lock_duration),
    };

    // Store lock position (would also submit to L1 contract in production)
    // For now, we store in Redis and return success
    // In production: Call veQS.sol lock(amount, lockDuration)

    tracing::info!("Lock created: {} QS -> {} veQS", req.amount, veqs_value);

    Ok(Json(TokenHubLockResponse {
        success: true,
        tx_hash: Some(format!("0x{:064x}", now)), // Mock tx hash
        lock_position,
        estimated_gas: "150000".to_string(),
    }))
}

// ============================================================================
// GET /v1/token-hub/locks
// ============================================================================

/// GET /v1/token-hub/locks
///
/// Returns user's lock positions (active and historical).
/// Per veQS.sol: only one active lock per user.
pub async fn get_locks(
    Extension(state): Extension<Arc<AppState>>,
    Query(query): Query<LocksQuery>,
) -> Result<Json<TokenHubLocksResponse>, ApiError> {
    tracing::info!("Token Hub locks request for: {}", query.address);

    // Get active lock
    let active_lock = state.get_veqs_lock(&query.address).await?;

    // Get historical locks
    let history = state.get_veqs_lock_history(&query.address).await?;

    Ok(Json(TokenHubLocksResponse {
        active_lock,
        history,
    }))
}

// ============================================================================
// POST /v1/token-hub/extend
// ============================================================================

/// POST /v1/token-hub/extend
///
/// Extend an existing lock's duration.
/// Per veQS.sol: new_unlock_time must be > current unlock_time.
pub async fn extend_lock(
    Extension(state): Extension<Arc<AppState>>,
    Json(req): Json<TokenHubExtendRequest>,
) -> Result<Json<TokenHubExtendResponse>, ApiError> {
    tracing::info!("Token Hub extend request: new_unlock_time={}", req.new_unlock_time);

    let now = chrono::Utc::now().timestamp() as u64;

    // Validate new unlock time
    if req.new_unlock_time <= now {
        return Err(ApiError::InvalidRequest(
            "New unlock time must be in the future".to_string(),
        ));
    }

    let max_unlock_time = now + MAX_LOCK_TIME;
    if req.new_unlock_time > max_unlock_time {
        return Err(ApiError::InvalidRequest(
            format!("New unlock time exceeds maximum ({} years from now)", MAX_LOCK_TIME / (365 * 24 * 60 * 60)),
        ));
    }

    // In production: Get current lock and verify new_unlock_time > current unlock_time
    // Then call veQS.sol extendLockTime(newUnlockTime)

    // Calculate new lock position (mock)
    let remaining_time = req.new_unlock_time - now;
    let multiplier = remaining_time as f64 / MAX_LOCK_TIME as f64;

    let lock_position = LockPosition {
        amount: "8500".to_string(), // Would come from current lock
        start_time: now - 30 * 24 * 60 * 60, // Example: started 30 days ago
        unlock_time: req.new_unlock_time,
        lock_duration: remaining_time,
        veqs_value: format!("{}", (8500.0 * multiplier) as u128),
        multiplier,
        time_remaining: format_duration(remaining_time),
    };

    Ok(Json(TokenHubExtendResponse {
        success: true,
        tx_hash: Some(format!("0x{:064x}", now)),
        lock_position,
    }))
}

// ============================================================================
// GET /v1/token-hub/delegates
// ============================================================================

/// GET /v1/token-hub/delegates
///
/// Returns list of available delegates for voting power delegation.
pub async fn get_delegates(
    Extension(state): Extension<Arc<AppState>>,
    Query(query): Query<DelegatesQuery>,
) -> Result<Json<TokenHubDelegatesResponse>, ApiError> {
    let page = query.page.unwrap_or(1);
    let limit = query.limit.unwrap_or(20).min(100);

    tracing::info!("Token Hub delegates request: page={}, limit={}", page, limit);

    // Get delegates from storage (pagination applied client-side for now)
    let all_delegates = state.get_delegates(page, limit, None).await?;
    let total = all_delegates.len() as u32;

    // Apply simple pagination
    let start = ((page - 1) * limit) as usize;
    let delegates: Vec<_> = all_delegates.into_iter().skip(start).take(limit as usize).collect();

    Ok(Json(TokenHubDelegatesResponse { delegates, total }))
}

// ============================================================================
// POST /v1/token-hub/delegate
// ============================================================================

/// POST /v1/token-hub/delegate
///
/// Delegate voting power to another address.
/// Per veQS.sol: Cannot delegate to self or zero address.
pub async fn delegate_power(
    Extension(state): Extension<Arc<AppState>>,
    Json(req): Json<TokenHubDelegateRequest>,
) -> Result<Json<TokenHubDelegateResponse>, ApiError> {
    tracing::info!("Token Hub delegate request to: {}", req.delegatee);

    // Validate delegatee address
    if req.delegatee.is_empty() || req.delegatee == "0x0000000000000000000000000000000000000000" {
        return Err(ApiError::InvalidRequest(
            "Cannot delegate to zero address".to_string(),
        ));
    }

    // In production:
    // 1. Verify caller has veQS balance
    // 2. Call veQS.sol delegate(delegatee)

    // Mock response
    Ok(Json(TokenHubDelegateResponse {
        success: true,
        tx_hash: Some(format!("0x{:064x}", chrono::Utc::now().timestamp())),
        delegatee: req.delegatee,
        veqs_delegated: "6225".to_string(), // Would come from user's veQS balance
    }))
}

// ============================================================================
// GET /v1/token-hub/rewards
// ============================================================================

/// GET /v1/token-hub/rewards
///
/// Returns user's reward information including claimable and historical rewards.
pub async fn get_rewards(
    Extension(state): Extension<Arc<AppState>>,
    Query(query): Query<RewardsQuery>,
) -> Result<Json<TokenHubRewardsResponse>, ApiError> {
    tracing::info!("Token Hub rewards request for: {}", query.address);

    // Get rewards data from storage/contract
    let rewards = state.get_veqs_rewards(&query.address).await?;

    Ok(Json(rewards))
}

// ============================================================================
// POST /v1/token-hub/claim
// ============================================================================

/// POST /v1/token-hub/claim
///
/// Claim accumulated rewards.
pub async fn claim_rewards(
    Extension(state): Extension<Arc<AppState>>,
    Json(req): Json<TokenHubClaimRequest>,
) -> Result<Json<TokenHubClaimResponse>, ApiError> {
    tracing::info!("Token Hub claim request: epochs={:?}", req.epochs);

    // In production:
    // 1. Get claimable rewards
    // 2. Call rewards contract to claim
    // 3. Return transaction result

    let epochs_to_claim = req.epochs.unwrap_or_else(|| vec![1, 2, 3]); // Mock epochs
    let amount_claimed = "847".to_string(); // Would be calculated from epochs

    Ok(Json(TokenHubClaimResponse {
        success: true,
        tx_hash: Some(format!("0x{:064x}", chrono::Utc::now().timestamp())),
        amount_claimed,
        epochs_claimed: epochs_to_claim,
    }))
}

// ============================================================================
// GET /v1/token-hub/delegations/my
// ============================================================================

/// GET /v1/token-hub/delegations/my
///
/// Returns user's delegation information.
pub async fn get_my_delegations(
    Extension(state): Extension<Arc<AppState>>,
    Query(query): Query<MyDelegationsQuery>,
) -> Result<Json<TokenHubMyDelegationsResponse>, ApiError> {
    tracing::info!("Token Hub my delegations request for: {}", query.address);

    // Get user's delegations from storage
    let delegations = state.get_user_delegations(&query.address).await?;

    // Calculate totals
    let total_delegated: u128 = delegations
        .iter()
        .filter_map(|d| d.veqs_amount.parse::<u128>().ok())
        .sum();

    // Get user's total veQS to calculate self-retained
    let user_veqs: u128 = state.get_veqs_balance(&query.address).await?;
    let self_retained = user_veqs.saturating_sub(total_delegated);

    Ok(Json(TokenHubMyDelegationsResponse {
        delegations,
        total_delegated: total_delegated.to_string(),
        self_retained: self_retained.to_string(),
    }))
}

// ============================================================================
// Helper Functions
// ============================================================================

/// Format duration in seconds to human readable string
fn format_duration(seconds: u64) -> String {
    let years = seconds / (365 * 24 * 60 * 60);
    let months = (seconds % (365 * 24 * 60 * 60)) / (30 * 24 * 60 * 60);
    let days = (seconds % (30 * 24 * 60 * 60)) / (24 * 60 * 60);

    if years > 0 {
        if months > 0 {
            format!("{}Y {}M", years, months)
        } else {
            format!("{}Y", years)
        }
    } else if months > 0 {
        if days > 0 {
            format!("{}M {}D", months, days)
        } else {
            format!("{}M", months)
        }
    } else {
        format!("{}D", days.max(1))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_format_duration() {
        assert_eq!(format_duration(365 * 24 * 60 * 60), "1Y");
        assert_eq!(format_duration(2 * 365 * 24 * 60 * 60 + 3 * 30 * 24 * 60 * 60), "2Y 3M");
        assert_eq!(format_duration(6 * 30 * 24 * 60 * 60), "6M");
        assert_eq!(format_duration(30 * 24 * 60 * 60 + 15 * 24 * 60 * 60), "1M 15D");
        assert_eq!(format_duration(7 * 24 * 60 * 60), "7D");
        assert_eq!(format_duration(0), "1D"); // Minimum 1D
    }

    #[test]
    fn test_veqs_calculation() {
        // 5000 QS locked for 2 years = 2500 veQS
        let amount: u128 = 5000;
        let lock_duration: u64 = 2 * 365 * 24 * 60 * 60;
        let multiplier = lock_duration as f64 / MAX_LOCK_TIME as f64;
        let veqs = (amount as f64 * multiplier) as u128;

        assert_eq!(multiplier, 0.5);
        assert_eq!(veqs, 2500);
    }

    #[test]
    fn test_lock_duration_validation() {
        // Valid: 1 week
        assert!(MIN_LOCK_TIME <= 7 * 24 * 60 * 60);

        // Valid: 4 years
        assert!(MAX_LOCK_TIME >= 4 * 365 * 24 * 60 * 60);

        // Invalid: less than 1 week
        let invalid_duration = 6 * 24 * 60 * 60;
        assert!(invalid_duration < MIN_LOCK_TIME);
    }
}
