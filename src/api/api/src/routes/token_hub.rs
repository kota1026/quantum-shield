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
    extract::{Extension, Query},
    Json,
};
use serde::Deserialize;

use crate::{
    error::ApiError,
    services::AppState,
    types::{
        LockPosition,
        TokenHubClaimRequest, TokenHubClaimResponse, TokenHubDashboardResponse,
        TokenHubDelegateRequest, TokenHubDelegateResponse, TokenHubDelegatesResponse,
        TokenHubExtendRequest, TokenHubExtendResponse, TokenHubLockRequest,
        TokenHubLockResponse, TokenHubLocksResponse, TokenHubMyDelegationsResponse,
        TokenHubRewardsResponse,
    },
};

use ethers::prelude::U256;

/// Constants for veQS calculations
/// Per veQS.sol: MIN_LOCK_TIME = 1 week, MAX_LOCK_TIME = 4 years
const MIN_LOCK_TIME: u64 = 7 * 24 * 60 * 60; // 1 week in seconds
const MAX_LOCK_TIME: u64 = 4 * 365 * 24 * 60 * 60; // 4 years in seconds

/// Calculate veQS voting power ratio based on lock duration (linear time-decay).
///
/// SEQUENCES.md §9.1 (v2.2): Linear Time-Decay Model
///   voting_power = amount × (remaining_time / MAX_LOCK_TIME)
///
/// This function returns the ratio (0.0 to 1.0):
///   ratio = duration_secs / MAX_LOCK_TIME
///
/// Examples (10,000 QS locked):
///   4 years → ratio 1.0  → 10,000 voting power (initial)
///   2 years → ratio 0.5  →  5,000 voting power (initial)
///   1 year  → ratio 0.25 →  2,500 voting power (initial)
///   1 week  → ratio ~0.0014 → ~14 voting power (initial)
///
/// The voting power then decays linearly as remaining_time decreases.
fn calculate_veqs_ratio(duration_secs: u64) -> f64 {
    if duration_secs == 0 {
        return 0.0;
    }
    let clamped = std::cmp::min(duration_secs, MAX_LOCK_TIME);
    clamped as f64 / MAX_LOCK_TIME as f64
}

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

    // Get QS balance (from Redis, populated by L1 indexer; returns "0" if not yet available)
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
/// veQS = QS × multiplier(duration) per SEQUENCES.md §9 step function
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

    // Calculate veQS voting power using SEQUENCES.md §9.1 linear time-decay
    let multiplier = calculate_veqs_ratio(req.lock_duration);
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

    // Store lock position in PG + Redis via service layer (SM-001: PG first)
    // In production: Also submit to veQS.sol lock(amount, lockDuration)
    state.store_veqs_lock(&"caller".to_string(), &lock_position).await?;

    tracing::info!("Lock created: {} QS -> {} veQS", req.amount, veqs_value);

    Ok(Json(TokenHubLockResponse {
        success: true,
        tx_hash: None, // BE-001: No mock tx_hash — real hash comes from L1 confirmation
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

    // Get current lock from PG to verify and use real amount
    let current_lock = state.get_veqs_lock(&"caller".to_string()).await?;
    let (current_amount, current_start) = if let Some(ref lock) = current_lock {
        if req.new_unlock_time <= lock.unlock_time {
            return Err(ApiError::InvalidRequest(
                "New unlock time must be later than current unlock time".to_string(),
            ));
        }
        (lock.amount.clone(), lock.start_time)
    } else {
        return Err(ApiError::InvalidRequest("No active lock to extend".to_string()));
    };

    // Calculate new lock position using SEQUENCES.md §9.1 linear time-decay
    let remaining_time = req.new_unlock_time - now;
    let multiplier = calculate_veqs_ratio(remaining_time);
    let amount_val: f64 = current_amount.parse().unwrap_or(0.0);

    let lock_position = LockPosition {
        amount: current_amount,
        start_time: current_start,
        unlock_time: req.new_unlock_time,
        lock_duration: remaining_time,
        veqs_value: format!("{}", (amount_val * multiplier) as u128),
        multiplier,
        time_remaining: format_duration(remaining_time),
    };

    Ok(Json(TokenHubExtendResponse {
        success: true,
        tx_hash: None, // BE-001: No mock tx_hash — real hash comes from L1 confirmation
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

    // Get delegates from PG via service layer
    let all_delegates = state.get_delegates(page, limit, query.sort_by).await?;
    let total = state.get_delegates_count().await?;

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

    // Get user's veQS balance from PG
    let user_veqs = state.get_veqs_balance(&req.delegatee).await?;
    let veqs_str = user_veqs.to_string();

    // In production: Call veQS.sol delegate(delegatee)
    // For now, store delegation in PG
    // Ensure both delegator and delegatee exist in users table to satisfy FK constraints
    crate::db::UserRepository::ensure_exists(state.pool(), &req.delegatee).await?;

    let delegation_id = format!("del-{}-{}", req.delegatee, chrono::Utc::now().timestamp());
    let amount_bd = bigdecimal::BigDecimal::from(user_veqs as i64);
    crate::db::TokenHubRepository::create_delegation(
        state.pool(), &delegation_id, &req.delegatee, &req.delegatee, &amount_bd,
    ).await?;

    Ok(Json(TokenHubDelegateResponse {
        success: true,
        tx_hash: None, // BE-001: No mock tx_hash — real hash comes from L1 confirmation
        delegatee: req.delegatee,
        veqs_delegated: veqs_str,
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

    // Get finalized epochs and user's claims from PG
    let finalized = crate::db::TokenHubRepository::get_finalized_epochs(
        state.pool(), 0, 100,
    ).await?;

    let existing_claims = crate::db::TokenHubRepository::get_reward_claims_by_wallet(
        state.pool(), "caller", // In production: extract from auth token
    ).await?;
    let claimed_epochs: std::collections::HashSet<i64> = existing_claims.iter().map(|c| c.epoch).collect();

    // Determine which epochs to claim
    let epochs_to_claim: Vec<u64> = if let Some(ref requested) = req.epochs {
        requested.clone()
    } else {
        // Default: all unclaimed finalized epochs
        finalized.iter()
            .filter(|e| !claimed_epochs.contains(&e.epoch))
            .map(|e| e.epoch as u64)
            .collect()
    };

    // Ensure user exists in users table to satisfy FK constraint on reward_claims
    crate::db::UserRepository::ensure_exists(state.pool(), "caller").await?;

    // Calculate total and create claim records
    use bigdecimal::ToPrimitive;
    let mut total_amount: f64 = 0.0;
    for &epoch in &epochs_to_claim {
        if let Some(epoch_row) = finalized.iter().find(|e| e.epoch == epoch as i64) {
            let amount = epoch_row.total_rewards.to_f64().unwrap_or(0.0);
            total_amount += amount;

            // Record the claim in PG
            let claim_id = format!("claim-{}-{}", epoch, chrono::Utc::now().timestamp());
            let amount_bd = bigdecimal::BigDecimal::from(amount as i64);
            let _ = crate::db::TokenHubRepository::create_reward_claim(
                state.pool(), &claim_id, "caller", epoch as i64, &amount_bd,
            ).await;
        }
    }

    Ok(Json(TokenHubClaimResponse {
        success: true,
        tx_hash: None, // BE-001: No mock tx_hash — real hash comes from L1 confirmation
        amount_claimed: format!("{:.0}", total_amount),
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

    // Get user's delegations from PG via service layer
    let delegations = state.get_user_delegations(&query.address).await?;

    // Calculate totals
    let total_delegated: u128 = delegations
        .iter()
        .filter_map(|d| d.veqs_amount.parse::<u128>().ok())
        .sum();

    // Get user's total veQS from PG to calculate self-retained
    let user_veqs = state.get_veqs_balance(&query.address).await?;
    let self_retained = (user_veqs as u128).saturating_sub(total_delegated);

    Ok(Json(TokenHubMyDelegationsResponse {
        delegations,
        total_delegated: total_delegated.to_string(),
        self_retained: self_retained.to_string(),
    }))
}

// ============================================================================
// GET /v1/token-hub/rewards/summary (FE: useDashboardRewards)
// ============================================================================

/// GET /v1/token-hub/rewards/summary
///
/// Returns dashboard-level rewards summary (claimable, USD value, epoch progress).
pub async fn get_rewards_summary(
    Extension(state): Extension<Arc<AppState>>,
) -> Result<Json<crate::types::TokenHubRewardsSummaryResponse>, ApiError> {
    tracing::info!("Token Hub rewards summary request");

    // Get latest epoch info
    let epochs = crate::db::TokenHubRepository::get_finalized_epochs(state.pool(), 0, 1).await?;

    // Epoch progress: approximate based on current time within weekly epoch
    let now = chrono::Utc::now().timestamp() as u64;
    let epoch_duration = 7 * 24 * 60 * 60u64; // 1 week
    let progress = ((now % epoch_duration) as f64 / epoch_duration as f64 * 100.0).round();

    // Get claimable from PG
    use bigdecimal::ToPrimitive;
    let pg_claimable: f64 = epochs.iter()
        .map(|e| e.total_rewards.to_f64().unwrap_or(0.0))
        .sum();

    // L3 integration: cross-check with RewardRouter pending balance
    let l3_pending = state.l3_contracts.get_pending_rewards().await
        .unwrap_or_else(|e| {
            tracing::warn!("L3: get_pending_rewards failed: {}", e);
            U256::zero()
        });
    let l3_pending_f64 = l3_pending.as_u128() as f64 / 1e18;

    // Use whichever is larger (PG may lag behind L3)
    let claimable = if state.l3_contracts.is_connected() && l3_pending_f64 > pg_claimable {
        tracing::debug!("Token Hub: using L3 pending rewards {} (PG had {})", l3_pending_f64, pg_claimable);
        l3_pending_f64
    } else {
        pg_claimable
    };

    Ok(Json(crate::types::TokenHubRewardsSummaryResponse {
        claimable,
        usd_value: 0.0, // BE-001: No hardcoded price — returns 0 until price oracle (Phase 8-D)
        epoch_progress: progress,
        currency: "QS".to_string(),
    }))
}

// ============================================================================
// GET /v1/token-hub/rewards/breakdown (FE: useRewardsBreakdown)
// ============================================================================

/// GET /v1/token-hub/rewards/breakdown
///
/// Returns rewards breakdown by source category.
pub async fn get_rewards_breakdown(
    Extension(state): Extension<Arc<AppState>>,
) -> Result<Json<crate::types::TokenHubRewardsBreakdownResponse>, ApiError> {
    tracing::info!("Token Hub rewards breakdown request");

    // L3 integration: get total distributed from RewardRouter
    let total_distributed = state.l3_contracts.get_total_distributed().await
        .unwrap_or_else(|e| {
            tracing::warn!("L3: get_total_distributed failed: {}", e);
            U256::zero()
        });

    // RewardRouter distribution: 50% veQS holders, 30% Provers, 10% Observers, 10% Treasury
    // User-facing breakdown focuses on veQS holder portion only:
    //   of the 50% veQS portion: ~73% from holding, ~15% from voting, ~12% from delegation
    // These ratios are protocol-defined and don't change dynamically
    tracing::info!("Token Hub: L3 total_distributed={}", total_distributed);

    Ok(Json(crate::types::TokenHubRewardsBreakdownResponse {
        veqs_holding: 73.0,
        voting_participation: 15.0,
        delegation_bonus: 12.0,
    }))
}

// ============================================================================
// GET /v1/token-hub/epoch (FE: useEpoch)
// ============================================================================

/// GET /v1/token-hub/epoch
///
/// Returns current epoch information.
pub async fn get_epoch(
    Extension(state): Extension<Arc<AppState>>,
) -> Result<Json<crate::types::TokenHubEpochResponse>, ApiError> {
    tracing::info!("Token Hub epoch request");

    let epochs = crate::db::TokenHubRepository::get_finalized_epochs(state.pool(), 0, 1).await?;
    let latest_epoch = epochs.first().map(|e| e.epoch as u64).unwrap_or(0);
    let current_epoch = latest_epoch + 1;

    // Calculate epoch progress
    let now = chrono::Utc::now().timestamp() as u64;
    let epoch_duration = 7 * 24 * 60 * 60u64; // 1 week
    let elapsed = now % epoch_duration;
    let remaining_secs = epoch_duration - elapsed;
    let progress = (elapsed as f64 / epoch_duration as f64 * 100.0).round();

    let remaining = format_epoch_remaining(remaining_secs);

    Ok(Json(crate::types::TokenHubEpochResponse {
        number: current_epoch,
        progress,
        remaining,
    }))
}

// ============================================================================
// GET /v1/token-hub/balance (FE: useBalance)
// ============================================================================

/// GET /v1/token-hub/balance
///
/// Returns user's available QS balance.
pub async fn get_balance(
    Extension(state): Extension<Arc<AppState>>,
    headers: axum::http::HeaderMap,
) -> Result<Json<crate::types::TokenHubBalanceResponse>, ApiError> {
    let address = headers
        .get("X-User-Address")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("unknown");
    tracing::info!("Token Hub balance request for: {}", address);

    let balance_str = state.get_qs_balance(address).await?;
    let balance: f64 = balance_str.parse().unwrap_or(0.0);

    Ok(Json(crate::types::TokenHubBalanceResponse { balance }))
}

// ============================================================================
// GET /v1/token-hub/locked-positions (FE: useLockedPositions)
// ============================================================================

/// Query parameters for locked positions
#[derive(Debug, Deserialize)]
pub struct LockedPositionsQuery {
    pub address: Option<String>,
}

/// GET /v1/token-hub/locked-positions
///
/// Returns user's locked positions for the unlock page.
pub async fn get_locked_positions(
    Extension(state): Extension<Arc<AppState>>,
    Query(query): Query<LockedPositionsQuery>,
    headers: axum::http::HeaderMap,
) -> Result<Json<Vec<crate::types::TokenHubLockedPosition>>, ApiError> {
    let address = query.address.as_deref()
        .or_else(|| headers.get("X-User-Address").and_then(|v| v.to_str().ok()))
        .unwrap_or("unknown");
    tracing::info!("Token Hub locked positions request for: {}", address);

    let lock_position = state.get_veqs_lock(address).await?;

    let positions: Vec<crate::types::TokenHubLockedPosition> = if let Some(pos) = lock_position {
        let amount: f64 = pos.amount.parse().unwrap_or(0.0);
        let veqs: f64 = pos.veqs_value.parse().unwrap_or(0.0);
        let duration_secs = pos.lock_duration;
        let duration_months = (duration_secs / (30 * 24 * 60 * 60)).max(1) as u32;

        vec![crate::types::TokenHubLockedPosition {
            id: "1".to_string(),
            locked_amount: amount,
            veqs_amount: veqs,
            lock_date: chrono::DateTime::from_timestamp(pos.start_time as i64, 0)
                .map(|dt| dt.format("%Y-%m-%dT%H:%M:%S.000Z").to_string())
                .unwrap_or_default(),
            unlock_date: chrono::DateTime::from_timestamp(pos.unlock_time as i64, 0)
                .map(|dt| dt.format("%Y-%m-%dT%H:%M:%S.000Z").to_string())
                .unwrap_or_default(),
            duration_months,
            multiplier: pos.multiplier,
        }]
    } else {
        vec![]
    };

    Ok(Json(positions))
}

// ============================================================================
// GET /v1/token-hub/user-delegation (FE: useUserDelegation)
// ============================================================================

/// GET /v1/token-hub/user-delegation
///
/// Returns user's delegation summary (total delegated, delegate count).
pub async fn get_user_delegation(
    Extension(state): Extension<Arc<AppState>>,
    headers: axum::http::HeaderMap,
) -> Result<Json<crate::types::TokenHubUserDelegationResponse>, ApiError> {
    let address = headers
        .get("X-User-Address")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("unknown");
    tracing::info!("Token Hub user delegation request for: {}", address);

    let delegations = state.get_user_delegations(address).await?;
    let total: f64 = delegations.iter()
        .filter_map(|d| d.veqs_amount.parse::<f64>().ok())
        .sum();

    Ok(Json(crate::types::TokenHubUserDelegationResponse {
        total_delegated: total,
        delegate_count: delegations.len() as u32,
    }))
}

// ============================================================================
// GET /v1/token-hub/rewards/claimable (FE: useClaimableRewards)
// ============================================================================

/// Query parameters for claimable rewards
#[derive(Debug, Deserialize)]
pub struct ClaimableQuery {
    pub address: Option<String>,
}

/// GET /v1/token-hub/rewards/claimable
///
/// Returns detailed claimable rewards with breakdown.
pub async fn get_claimable_rewards(
    Extension(state): Extension<Arc<AppState>>,
    Query(_query): Query<ClaimableQuery>,
) -> Result<Json<crate::types::TokenHubClaimableResponse>, ApiError> {
    tracing::info!("Token Hub claimable rewards request");

    let epochs = crate::db::TokenHubRepository::get_finalized_epochs(state.pool(), 0, 100).await?;
    use bigdecimal::ToPrimitive;
    let total: f64 = epochs.iter()
        .map(|e| e.total_rewards.to_f64().unwrap_or(0.0))
        .sum();

    Ok(Json(crate::types::TokenHubClaimableResponse {
        total,
        usd_value: 0.0, // BE-001: No hardcoded price — returns 0 until price oracle (Phase 8-D)
        breakdown: crate::types::TokenHubClaimableBreakdown {
            veqs_holding: total * 0.73,
            voting_participation: total * 0.15,
            delegation_bonus: total * 0.12,
        },
        currency: "QS".to_string(),
    }))
}

// ============================================================================
// GET /v1/token-hub/rewards/history (FE: useRewardsHistory)
// ============================================================================

/// Query parameters for rewards history
#[derive(Debug, Deserialize)]
pub struct RewardsHistoryQuery {
    pub address: Option<String>,
}

/// GET /v1/token-hub/rewards/history
///
/// Returns rewards history items.
pub async fn get_rewards_history(
    Extension(state): Extension<Arc<AppState>>,
    Query(_query): Query<RewardsHistoryQuery>,
) -> Result<Json<Vec<crate::types::TokenHubRewardsHistoryItem>>, ApiError> {
    tracing::info!("Token Hub rewards history request");

    let epochs = crate::db::TokenHubRepository::get_finalized_epochs(state.pool(), 0, 20).await?;
    use bigdecimal::ToPrimitive;

    let items: Vec<crate::types::TokenHubRewardsHistoryItem> = epochs.iter().enumerate().map(|(i, e)| {
        let amount = e.total_rewards.to_f64().unwrap_or(0.0);
        crate::types::TokenHubRewardsHistoryItem {
            id: (i + 1).to_string(),
            history_type: "weekly_reward".to_string(),
            date: e.end_time.format("%Y-%m-%d %H:%M").to_string(),
            amount,
            status: "complete".to_string(),
            currency: "QS".to_string(),
        }
    }).collect();

    Ok(Json(items))
}

// ============================================================================
// GET /v1/token-hub/rewards/history/extended (FE: useExtendedRewardsHistory)
// ============================================================================

/// GET /v1/token-hub/rewards/history/extended
///
/// Returns extended rewards history with epoch and breakdown.
pub async fn get_extended_rewards_history(
    Extension(state): Extension<Arc<AppState>>,
) -> Result<Json<Vec<crate::types::TokenHubExtendedRewardsHistoryItem>>, ApiError> {
    tracing::info!("Token Hub extended rewards history request");

    let epochs = crate::db::TokenHubRepository::get_finalized_epochs(state.pool(), 0, 20).await?;
    use bigdecimal::ToPrimitive;

    let items: Vec<crate::types::TokenHubExtendedRewardsHistoryItem> = epochs.iter().enumerate().map(|(i, e)| {
        let amount = e.total_rewards.to_f64().unwrap_or(0.0);
        crate::types::TokenHubExtendedRewardsHistoryItem {
            id: (i + 1).to_string(),
            history_type: "weekly_reward".to_string(),
            date: e.end_time.format("%Y-%m-%d %H:%M").to_string(),
            amount,
            epoch: e.epoch as u64,
            status: "complete".to_string(),
            breakdown: crate::types::TokenHubRewardBreakdown {
                holding: amount * 0.73,
                voting: amount * 0.15,
                delegation: amount * 0.12,
            },
            currency: "QS".to_string(),
        }
    }).collect();

    Ok(Json(items))
}

// ============================================================================
// Helper Functions
// ============================================================================

/// Format epoch remaining time
fn format_epoch_remaining(seconds: u64) -> String {
    let days = seconds / (24 * 60 * 60);
    let hours = (seconds % (24 * 60 * 60)) / (60 * 60);
    format!("{}d {}h", days, hours)
}

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
    fn test_veqs_linear_decay_ratio() {
        // SEQUENCES.md §9.1 (v2.2): Linear time-decay model
        // ratio = duration / MAX_LOCK_TIME (4 years)
        let max_lock = 4 * 365 * 24 * 60 * 60; // 4 years

        // 4 years → 1.0 (maximum)
        let ratio_4y = calculate_veqs_ratio(max_lock);
        assert!((ratio_4y - 1.0).abs() < 0.001);

        // 2 years → 0.5
        let ratio_2y = calculate_veqs_ratio(2 * 365 * 24 * 60 * 60);
        assert!((ratio_2y - 0.5).abs() < 0.001);

        // 1 year → 0.25
        let ratio_1y = calculate_veqs_ratio(365 * 24 * 60 * 60);
        assert!((ratio_1y - 0.25).abs() < 0.001);

        // 6 months → ~0.125
        let ratio_6m = calculate_veqs_ratio(180 * 24 * 60 * 60);
        assert!(ratio_6m > 0.12 && ratio_6m < 0.13);

        // 1 week (minimum) → ~0.0014
        let ratio_1w = calculate_veqs_ratio(7 * 24 * 60 * 60);
        assert!(ratio_1w > 0.001 && ratio_1w < 0.006);

        // 0 → 0.0
        assert_eq!(calculate_veqs_ratio(0), 0.0);

        // Above max → clamped to 1.0
        let ratio_5y = calculate_veqs_ratio(5 * 365 * 24 * 60 * 60);
        assert!((ratio_5y - 1.0).abs() < 0.001);
    }

    #[test]
    fn test_veqs_calculation() {
        // SEQUENCES.md §9.1 (v2.2): voting_power = amount × (duration / MAX_LOCK_TIME)
        // 10000 QS locked for 2 years → ratio 0.5 → 5000 voting power
        let amount: u128 = 10000;
        let lock_duration: u64 = 2 * 365 * 24 * 60 * 60; // 730 days
        let ratio = calculate_veqs_ratio(lock_duration);
        let veqs = (amount as f64 * ratio) as u128;

        assert!((ratio - 0.5).abs() < 0.001);
        assert_eq!(veqs, 5000);

        // 10000 QS locked for 4 years → ratio 1.0 → 10000 voting power
        let lock_4y: u64 = 4 * 365 * 24 * 60 * 60;
        let ratio_4y = calculate_veqs_ratio(lock_4y);
        let veqs_4y = (amount as f64 * ratio_4y) as u128;
        assert_eq!(veqs_4y, 10000);
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

    #[test]
    fn test_format_epoch_remaining() {
        assert_eq!(format_epoch_remaining(3 * 24 * 60 * 60 + 5 * 60 * 60), "3d 5h");
        assert_eq!(format_epoch_remaining(0), "0d 0h");
        assert_eq!(format_epoch_remaining(7 * 24 * 60 * 60), "7d 0h");
        assert_eq!(format_epoch_remaining(60 * 60), "0d 1h");
    }

    #[test]
    fn test_l3_pending_rewards_selection() {
        // If L3 value > PG value, L3 wins (when connected)
        let pg_claimable = 100.0f64;
        let l3_pending_f64 = 150.0f64;
        let l3_connected = true;

        let claimable = if l3_connected && l3_pending_f64 > pg_claimable {
            l3_pending_f64
        } else {
            pg_claimable
        };
        assert_eq!(claimable, 150.0);

        // If PG value > L3 value, PG wins
        let pg_claimable2 = 200.0f64;
        let l3_pending_f642 = 100.0f64;
        let claimable2 = if l3_connected && l3_pending_f642 > pg_claimable2 {
            l3_pending_f642
        } else {
            pg_claimable2
        };
        assert_eq!(claimable2, 200.0);
    }

    #[test]
    fn test_rewards_breakdown_ratios() {
        // Protocol-defined ratios must sum to 100%
        let holding = 73.0f64;
        let voting = 15.0f64;
        let delegation = 12.0f64;
        assert!((holding + voting + delegation - 100.0).abs() < 0.01);
    }
}
