//! Consumer App API implementation (TASK-P5-020)
//!
//! Implements 6 endpoints for consumer application:
//! - GET /v1/user/dashboard - User dashboard with aggregated data
//! - GET /v1/user/transactions - List user transactions
//! - GET /v1/user/transactions/:id - Get transaction details
//! - GET /v1/user/settings - Get user settings
//! - POST /v1/user/settings - Update user settings
//! - GET /v1/user/keys - Get user's quantum keys info
//!
//! ## CP-1 Compliance
//! - Uses NIST FIPS 204 ML-DSA-65 for user signatures
//! - Uses SHA3-256 for all hashing (key fingerprints)
//! - NO keccak256, ECDSA, or pre-FIPS algorithms

use std::sync::Arc;

use axum::{
    extract::{Path, Query},
    Extension, Json,
};
use sha3::{Digest, Sha3_256};

use crate::{
    error::ApiError,
    services::AppState,
    types::{
        ActivitySummary, ActivityType, KeyAlgorithmInfo, LockStatus,
        NotificationSettings, TimelineEvent, TransactionStatus, TransactionType,
        TransactionsQueryParams, TransactionChallengeInfo, UserDashboardResponse, UserKeysResponse,
        UserQuantumKeysStatus, UserSettingsResponse, UserSettingsUpdateRequest,
        UserTransaction, UserTransactionDetailResponse, UserTransactionsResponse,
    },
};

/// GET /v1/user/dashboard
///
/// Get user dashboard with aggregated data including:
/// - Total value locked
/// - Active locks count
/// - Pending unlocks count
/// - Quantum keys status
/// - Recent activity
///
/// # Authentication
/// TODO: Requires JWT token (TASK-P5-012)
/// Currently uses X-User-Address header for development
pub async fn get_dashboard(
    Extension(state): Extension<Arc<AppState>>,
    headers: axum::http::HeaderMap,
) -> Result<Json<UserDashboardResponse>, ApiError> {
    // TODO: Replace with JWT authentication (TASK-P5-012)
    let user_address = extract_user_address(&headers)?;

    tracing::info!("Fetching dashboard for user: {}", user_address);

    // Get user's locks from state
    let locks = state.get_user_locks(&user_address).await?;

    // Calculate aggregated values
    let mut total_locked_wei: u128 = 0;
    let mut active_locks: u32 = 0;
    let mut pending_unlocks: u32 = 0;
    let mut recent_activity: Vec<ActivitySummary> = Vec::new();

    for lock in &locks {
        // Parse amount (assuming wei as string)
        if let Ok(amount) = lock.amount.parse::<u128>() {
            if matches!(lock.status, LockStatus::Locked | LockStatus::Pending | LockStatus::Confirmed) {
                total_locked_wei += amount;
                active_locks += 1;
            }
            if matches!(lock.status, LockStatus::UnlockPending | LockStatus::EmergencyPending) {
                pending_unlocks += 1;
            }
        }

        // Add to recent activity (last 5)
        if recent_activity.len() < 5 {
            let activity_type = match lock.status {
                LockStatus::EmergencyPending => ActivityType::EmergencyUnlock,
                LockStatus::UnlockPending => ActivityType::Unlock,
                LockStatus::Challenged => ActivityType::Challenge,
                _ => ActivityType::Lock,
            };
            recent_activity.push(ActivitySummary {
                activity_type,
                reference_id: lock.lock_id.clone(),
                amount: lock.amount.clone(),
                asset: lock.asset.clone(),
                timestamp: lock.created_at,
            });
        }
    }

    // Get quantum keys status
    let quantum_keys = get_user_quantum_keys_status(&state, &user_address).await?;

    // Convert wei to ETH string (18 decimals)
    let total_locked = format_wei_to_eth(total_locked_wei);
    // TODO: Integrate price oracle for USD conversion
    let total_locked_usd = calculate_usd_value(&total_locked);

    Ok(Json(UserDashboardResponse {
        address: user_address,
        total_locked,
        total_locked_usd,
        active_locks,
        pending_unlocks,
        quantum_keys,
        recent_activity,
    }))
}

/// GET /v1/user/transactions
///
/// List user transactions with pagination and filtering.
///
/// # Query Parameters
/// - `tx_type`: Filter by transaction type (lock, normal_unlock, emergency_unlock)
/// - `status`: Filter by status
/// - `page`: Page number (1-indexed, default 1)
/// - `per_page`: Items per page (default 20, max 100)
pub async fn get_transactions(
    Extension(state): Extension<Arc<AppState>>,
    headers: axum::http::HeaderMap,
    Query(params): Query<TransactionsQueryParams>,
) -> Result<Json<UserTransactionsResponse>, ApiError> {
    let user_address = extract_user_address(&headers)?;

    tracing::info!("Fetching transactions for user: {}", user_address);

    let page = params.page.unwrap_or(1).max(1);
    let per_page = params.per_page.unwrap_or(20).min(100);

    // Get all user locks
    let locks = state.get_user_locks(&user_address).await?;

    // Convert locks to transactions and apply filters
    let mut transactions: Vec<UserTransaction> = locks
        .iter()
        .map(|lock| {
            let tx_type = if lock.is_emergency {
                TransactionType::EmergencyUnlock
            } else if matches!(lock.status, LockStatus::UnlockPending | LockStatus::Released) {
                TransactionType::NormalUnlock
            } else {
                TransactionType::Lock
            };

            let status = convert_lock_status_to_tx_status(lock.status);

            UserTransaction {
                id: lock.lock_id.clone(),
                tx_type,
                asset: lock.asset.clone(),
                amount: lock.amount.clone(),
                status,
                chain_id: lock.chain_id,
                created_at: lock.created_at,
                updated_at: None,
                release_time: lock.release_time,
                l1_tx_hash: None, // TODO: Store L1 tx hash
            }
        })
        .collect();

    // Apply filters
    if let Some(tx_type_filter) = params.tx_type {
        transactions.retain(|tx| tx.tx_type == tx_type_filter);
    }
    if let Some(status_filter) = params.status {
        transactions.retain(|tx| tx.status == status_filter);
    }

    // Sort by created_at descending
    transactions.sort_by(|a, b| b.created_at.cmp(&a.created_at));

    let total = transactions.len() as u64;

    // Apply pagination
    let start = ((page - 1) * per_page) as usize;
    let transactions: Vec<UserTransaction> = transactions
        .into_iter()
        .skip(start)
        .take(per_page as usize)
        .collect();

    Ok(Json(UserTransactionsResponse {
        transactions,
        total,
        page,
        per_page,
    }))
}

/// GET /v1/user/transactions/:id
///
/// Get detailed information about a specific transaction.
pub async fn get_transaction_detail(
    Extension(state): Extension<Arc<AppState>>,
    headers: axum::http::HeaderMap,
    Path(tx_id): Path<String>,
) -> Result<Json<UserTransactionDetailResponse>, ApiError> {
    let user_address = extract_user_address(&headers)?;

    tracing::info!("Fetching transaction detail: {} for user: {}", tx_id, user_address);

    // Get lock by ID
    let lock = state
        .get_lock(&tx_id)
        .await?
        .ok_or_else(|| ApiError::LockNotFound(tx_id.clone()))?;

    // Verify ownership
    if lock.owner != user_address && lock.user_public_key != user_address {
        return Err(ApiError::Unauthorized);
    }

    let tx_type = if lock.is_emergency {
        TransactionType::EmergencyUnlock
    } else if matches!(lock.status, LockStatus::UnlockPending | LockStatus::Released) {
        TransactionType::NormalUnlock
    } else {
        TransactionType::Lock
    };

    let transaction = UserTransaction {
        id: lock.lock_id.clone(),
        tx_type,
        asset: lock.asset.clone(),
        amount: lock.amount.clone(),
        status: convert_lock_status_to_tx_status(lock.status),
        chain_id: lock.chain_id,
        created_at: lock.created_at,
        updated_at: None,
        release_time: lock.release_time,
        l1_tx_hash: None,
    };

    // Calculate time lock remaining
    let time_lock_remaining = lock.release_time.map(|release_time| {
        let now = chrono::Utc::now().timestamp() as u64;
        release_time as i64 - now as i64
    });

    // Build timeline
    let mut timeline = vec![TimelineEvent {
        event: "created".to_string(),
        timestamp: lock.created_at,
        description: "Lock request created".to_string(),
    }];

    if matches!(lock.status, LockStatus::Confirmed | LockStatus::Locked | LockStatus::UnlockPending | LockStatus::Released) {
        timeline.push(TimelineEvent {
            event: "confirmed".to_string(),
            timestamp: lock.created_at + 60, // Approximate
            description: "Lock confirmed on L1".to_string(),
        });
    }

    if let Some(release_time) = lock.release_time {
        timeline.push(TimelineEvent {
            event: "unlock_requested".to_string(),
            timestamp: release_time - 86400, // 24h before release for normal unlock
            description: "Unlock request submitted".to_string(),
        });
    }

    // Get challenge info if challenged
    let challenge_info = if matches!(lock.status, LockStatus::Challenged) {
        Some(TransactionChallengeInfo {
            challenger: "0x...".to_string(), // TODO: Store challenger address
            bond: "100000000000000000".to_string(), // 0.1 ETH placeholder
            challenged_at: chrono::Utc::now().timestamp() as u64,
            defense_deadline: chrono::Utc::now().timestamp() as u64 + 172800, // +48h
        })
    } else {
        None
    };

    Ok(Json(UserTransactionDetailResponse {
        transaction,
        sr_0: lock.sr_0.clone(),
        sr_1: None, // TODO: Store SR_1 for unlocks
        prover_signatures: 0, // TODO: Track prover signatures
        required_signatures: 2, // 2/5 threshold
        time_lock_remaining,
        challenge_info,
        timeline,
    }))
}

/// GET /v1/user/settings
///
/// Get user settings including notification preferences.
pub async fn get_settings(
    Extension(state): Extension<Arc<AppState>>,
    headers: axum::http::HeaderMap,
) -> Result<Json<UserSettingsResponse>, ApiError> {
    let user_address = extract_user_address(&headers)?;

    tracing::info!("Fetching settings for user: {}", user_address);

    // Get settings from Redis
    let settings = state.get_user_settings(&user_address).await?;

    Ok(Json(settings.unwrap_or_else(|| UserSettingsResponse {
        address: user_address,
        notifications: NotificationSettings {
            email_enabled: false,
            email: None,
            on_lock_confirmed: true,
            on_unlock_ready: true,
            on_challenge: true,
        },
        default_time_lock_hours: 24, // CP-3: Minimum 24 hours
        language: "en".to_string(),
        two_factor_enabled: false,
    })))
}

/// POST /v1/user/settings
///
/// Update user settings.
pub async fn update_settings(
    Extension(state): Extension<Arc<AppState>>,
    headers: axum::http::HeaderMap,
    Json(req): Json<UserSettingsUpdateRequest>,
) -> Result<Json<UserSettingsResponse>, ApiError> {
    let user_address = extract_user_address(&headers)?;

    tracing::info!("Updating settings for user: {}", user_address);

    // Get current settings or create default
    let mut settings = state
        .get_user_settings(&user_address)
        .await?
        .unwrap_or_else(|| UserSettingsResponse {
            address: user_address.clone(),
            notifications: NotificationSettings {
                email_enabled: false,
                email: None,
                on_lock_confirmed: true,
                on_unlock_ready: true,
                on_challenge: true,
            },
            default_time_lock_hours: 24,
            language: "en".to_string(),
            two_factor_enabled: false,
        });

    // Apply updates
    if let Some(notifications) = req.notifications {
        settings.notifications = notifications;
    }
    if let Some(time_lock_hours) = req.default_time_lock_hours {
        // CP-3: Time Lock cannot be less than 24 hours
        settings.default_time_lock_hours = time_lock_hours.max(24);
    }
    if let Some(language) = req.language {
        settings.language = language;
    }

    // Save updated settings
    state.store_user_settings(&user_address, &settings).await?;

    tracing::info!("Settings updated successfully for user: {}", user_address);

    Ok(Json(settings))
}

/// GET /v1/user/keys
///
/// Get user's quantum-resistant keys information.
///
/// ## CP-1 Compliance
/// Returns information about NIST FIPS 204 ML-DSA-65 keys only.
pub async fn get_keys(
    Extension(state): Extension<Arc<AppState>>,
    headers: axum::http::HeaderMap,
) -> Result<Json<UserKeysResponse>, ApiError> {
    let user_address = extract_user_address(&headers)?;

    tracing::info!("Fetching keys for user: {}", user_address);

    // Get user's registered Dilithium key
    let key_info = state.get_user_dilithium_key(&user_address).await?;

    let (dilithium_public_key, dilithium_fingerprint, registered_at) = match key_info {
        Some((pk, registered)) => {
            let fingerprint = compute_key_fingerprint(&pk);
            (Some(pk), Some(fingerprint), Some(registered))
        }
        None => (None, None, None),
    };

    // ML-DSA-65 (FIPS 204) algorithm info
    let algorithm = KeyAlgorithmInfo {
        name: "ML-DSA-65".to_string(),
        standard: "NIST FIPS 204".to_string(),
        security_level: "NIST Level 3 (equivalent to AES-192)".to_string(),
        public_key_size: 1952,
        signature_size: 3293,
    };

    Ok(Json(UserKeysResponse {
        address: user_address,
        dilithium_public_key,
        dilithium_fingerprint,
        registered_at,
        algorithm,
    }))
}

// ============================================================================
// Helper Functions
// ============================================================================

/// Extract user address from headers (temporary until JWT auth is implemented)
fn extract_user_address(headers: &axum::http::HeaderMap) -> Result<String, ApiError> {
    // TODO: Replace with JWT token extraction (TASK-P5-012)
    headers
        .get("X-User-Address")
        .and_then(|v| v.to_str().ok())
        .map(|s| s.to_string())
        .ok_or(ApiError::Unauthorized)
}

/// Get user's quantum keys status
async fn get_user_quantum_keys_status(
    state: &AppState,
    user_address: &str,
) -> Result<UserQuantumKeysStatus, ApiError> {
    let key_info = state.get_user_dilithium_key(user_address).await?;

    match key_info {
        Some((pk, registered_at)) => {
            let fingerprint = compute_key_fingerprint(&pk);
            Ok(UserQuantumKeysStatus {
                dilithium_registered: true,
                dilithium_fingerprint: Some(fingerprint),
                registered_at: Some(registered_at),
            })
        }
        None => Ok(UserQuantumKeysStatus {
            dilithium_registered: false,
            dilithium_fingerprint: None,
            registered_at: None,
        }),
    }
}

/// Compute SHA3-256 fingerprint of a public key (CP-1 compliant)
fn compute_key_fingerprint(public_key: &str) -> String {
    let mut hasher = Sha3_256::new();
    hasher.update(public_key.as_bytes());
    let result = hasher.finalize();
    format!("0x{}", hex::encode(result))
}

/// Convert wei (as u128) to ETH string with 18 decimal precision
fn format_wei_to_eth(wei: u128) -> String {
    let eth = wei as f64 / 1e18;
    format!("{:.18}", eth)
}

/// Calculate USD value from ETH amount (placeholder)
fn calculate_usd_value(eth_amount: &str) -> String {
    // TODO: Integrate with price oracle (Chainlink)
    let eth: f64 = eth_amount.parse().unwrap_or(0.0);
    let usd = eth * 3500.0; // Placeholder ETH price
    format!("{:.2}", usd)
}

/// Convert internal LockStatus to user-facing TransactionStatus
fn convert_lock_status_to_tx_status(status: LockStatus) -> TransactionStatus {
    match status {
        LockStatus::Pending => TransactionStatus::Pending,
        LockStatus::Confirmed => TransactionStatus::Confirmed,
        LockStatus::Locked => TransactionStatus::Confirmed,
        LockStatus::UnlockPending => TransactionStatus::Processing,
        LockStatus::Released => TransactionStatus::Completed,
        LockStatus::EmergencyPending => TransactionStatus::Processing,
        LockStatus::Challenged => TransactionStatus::Challenged,
        LockStatus::Slashed => TransactionStatus::Failed,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_format_wei_to_eth() {
        // 1 ETH = 1e18 wei
        assert_eq!(format_wei_to_eth(1_000_000_000_000_000_000), "1.000000000000000000");

        // 0.5 ETH
        assert_eq!(format_wei_to_eth(500_000_000_000_000_000), "0.500000000000000000");

        // 0 ETH
        assert_eq!(format_wei_to_eth(0), "0.000000000000000000");
    }

    #[test]
    fn test_compute_key_fingerprint_uses_sha3_256() {
        let public_key = "0xabc123def456";
        let fingerprint = compute_key_fingerprint(public_key);

        // Should be SHA3-256 hash (32 bytes = 64 hex chars + 0x prefix)
        assert!(fingerprint.starts_with("0x"));
        assert_eq!(fingerprint.len(), 66);
    }

    #[test]
    fn test_compute_key_fingerprint_deterministic() {
        let public_key = "0xabc123def456";
        let fp1 = compute_key_fingerprint(public_key);
        let fp2 = compute_key_fingerprint(public_key);
        assert_eq!(fp1, fp2);
    }

    #[test]
    fn test_convert_lock_status_to_tx_status() {
        assert_eq!(
            convert_lock_status_to_tx_status(LockStatus::Pending),
            TransactionStatus::Pending
        );
        assert_eq!(
            convert_lock_status_to_tx_status(LockStatus::Released),
            TransactionStatus::Completed
        );
        assert_eq!(
            convert_lock_status_to_tx_status(LockStatus::Challenged),
            TransactionStatus::Challenged
        );
    }
}
