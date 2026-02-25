//! Edition API implementation (API-006)
//!
//! Manages Enterprise ↔ Decentralized edition switching.

use std::sync::Arc;

use axum::{Extension, Json};

use crate::{
    error::ApiError,
    services::AppState,
    types::{Edition, EditionResponse, EditionSwitchRequest, EditionSwitchResponse},
};

/// Edition switch time lock (days)
const EDITION_SWITCH_TIME_LOCK_DAYS: u64 = 7;

/// GET /v1/edition
/// 
/// Get current edition mode and switch status.
pub async fn get_edition(
    Extension(state): Extension<Arc<AppState>>,
) -> Result<Json<EditionResponse>, ApiError> {
    tracing::debug!("Getting current edition");

    let edition_state = state.get_edition_state().await?;

    Ok(Json(EditionResponse {
        current_edition: edition_state.current,
        available_editions: vec![Edition::Enterprise, Edition::Decentralized],
        switch_pending: edition_state.switch_pending,
        next_switch_time: edition_state.next_switch_time,
    }))
}

/// POST /v1/edition/switch (Admin only)
/// 
/// Initiate edition switch with 7-day time lock.
/// 
/// # Security
/// - Requires admin signature
/// - 7-day time lock before effective
pub async fn switch_edition(
    Extension(state): Extension<Arc<AppState>>,
    Json(req): Json<EditionSwitchRequest>,
) -> Result<Json<EditionSwitchResponse>, ApiError> {
    tracing::info!("Processing edition switch request to: {:?}", req.target_edition);

    // 1. Check if switch already pending
    let edition_state = state.get_edition_state().await?;
    if edition_state.switch_pending {
        return Err(ApiError::EditionSwitchPending);
    }

    // 2. Validate admin signature
    if !validate_admin_signature(&req.admin_signature) {
        return Err(ApiError::Unauthorized);
    }

    // 3. Calculate effective time (7 days from now)
    let now = chrono::Utc::now().timestamp() as u64;
    let effective_time = now + (EDITION_SWITCH_TIME_LOCK_DAYS * 24 * 3600);

    // 4. Generate switch_id
    let switch_id = generate_switch_id(&req, now);

    // 5. Store switch request
    state.store_edition_switch(&switch_id, &req, effective_time).await?;

    tracing::info!("Edition switch scheduled: {} → {:?} at {}", 
        switch_id, req.target_edition, effective_time);

    Ok(Json(EditionSwitchResponse {
        switch_id,
        target_edition: req.target_edition,
        effective_time,
        time_lock_days: EDITION_SWITCH_TIME_LOCK_DAYS,
        status: "pending".to_string(),
    }))
}

/// Validate admin signature
fn validate_admin_signature(signature: &str) -> bool {
    // TODO: Implement actual admin signature verification
    !signature.is_empty()
}

/// Generate switch_id
fn generate_switch_id(req: &EditionSwitchRequest, timestamp: u64) -> String {
    use sha3::{Sha3_256, Digest};
    let mut hasher = Sha3_256::new();
    hasher.update(b"EDITION_SWITCH_V1");
    hasher.update(format!("{:?}", req.target_edition).as_bytes());
    hasher.update(timestamp.to_be_bytes());
    let result = hasher.finalize();
    format!("0x{}", hex::encode(result))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_edition_switch_time_lock() {
        // Edition switch should have 7-day time lock
        assert_eq!(EDITION_SWITCH_TIME_LOCK_DAYS, 7);
    }
}
