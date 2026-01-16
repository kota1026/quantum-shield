//! Status API implementation (API-004)
//!
//! Provides lock status tracking and pending unlock monitoring.

use std::sync::Arc;

use axum::{Extension, Json, extract::Path};

use crate::{
    error::ApiError,
    services::AppState,
    types::{StatusResponse, PendingUnlocksResponse, PendingUnlock, LockStatus},
};

/// GET /v1/status/{lock_id}
/// 
/// Get detailed status of a specific lock.
pub async fn get_lock_status(
    Extension(state): Extension<Arc<AppState>>,
    Path(lock_id): Path<String>,
) -> Result<Json<StatusResponse>, ApiError> {
    tracing::debug!("Getting status for lock_id: {}", lock_id);

    let lock = state.get_lock(&lock_id).await?
        .ok_or_else(|| ApiError::LockNotFound(lock_id.clone()))?;

    // Calculate remaining time lock
    let now = chrono::Utc::now().timestamp() as u64;
    let time_lock_remaining = lock.release_time.map(|rt| {
        if rt > now {
            (rt - now) as i64
        } else {
            0
        }
    });

    Ok(Json(StatusResponse {
        lock_id: lock.lock_id,
        status: lock.status,
        amount: lock.amount,
        asset: lock.asset,
        owner: lock.owner,
        created_at: lock.created_at,
        time_lock_remaining,
        release_time: lock.release_time,
        is_emergency: lock.is_emergency,
    }))
}

/// GET /v1/status/pending
/// 
/// Get all pending unlocks for the authenticated user.
pub async fn get_pending_unlocks(
    Extension(state): Extension<Arc<AppState>>,
    // TODO: Extract user from JWT
) -> Result<Json<PendingUnlocksResponse>, ApiError> {
    tracing::debug!("Getting pending unlocks");

    let pending_locks = state.get_pending_locks().await?;
    let now = chrono::Utc::now().timestamp() as u64;

    let pending_unlocks: Vec<PendingUnlock> = pending_locks
        .into_iter()
        .filter(|lock| {
            matches!(lock.status, LockStatus::UnlockPending | LockStatus::EmergencyPending)
        })
        .map(|lock| {
            let time_lock_remaining = lock.release_time.map(|rt| {
                if rt > now {
                    (rt - now) as i64
                } else {
                    0
                }
            }).unwrap_or(0);

            PendingUnlock {
                unlock_id: generate_unlock_id_from_lock(&lock.lock_id),
                lock_id: lock.lock_id,
                status: lock.status,
                release_time: lock.release_time.unwrap_or(0),
                time_lock_remaining,
                is_emergency: lock.is_emergency,
            }
        })
        .collect();

    let total = pending_unlocks.len();

    Ok(Json(PendingUnlocksResponse {
        pending_unlocks,
        total,
    }))
}

/// Generate unlock_id from lock_id (simplified for status tracking)
fn generate_unlock_id_from_lock(lock_id: &str) -> String {
    use sha3::{Sha3_256, Digest};
    let mut hasher = Sha3_256::new();
    hasher.update(b"UNLOCK_ID_");
    hasher.update(lock_id.as_bytes());
    let result = hasher.finalize();
    format!("0x{}", hex::encode(result))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_unlock_id_deterministic() {
        let lock_id = "0xabc123";
        let id1 = generate_unlock_id_from_lock(lock_id);
        let id2 = generate_unlock_id_from_lock(lock_id);
        assert_eq!(id1, id2);
    }
}
