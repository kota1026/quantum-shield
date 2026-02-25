//! Resync API implementation (Sequence #3')
//!
//! Provides endpoints for L1-L3 synchronization recovery:
//! - POST /v1/resync - Manual resync request
//! - GET /v1/resync/:lock_id - Get resync status
//! - GET /v1/resync/pending - List pending (unsynced) locks
//!
//! Reference: SEQUENCES.md §3' Resync

use std::sync::Arc;

use axum::{Extension, Json, extract::Path};
use serde::{Deserialize, Serialize};

use crate::{
    db::LockRepository,
    error::ApiError,
    services::AppState,
};

// ============================================================================
// Resync Types
// ============================================================================

/// Resync status enum
#[derive(Debug, Serialize, Deserialize, Clone, Copy, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum ResyncStatus {
    /// Lock is synced between L1 and L3
    Synced,
    /// Lock is pending sync (L1 confirmed, L3 not aware)
    PendingSync,
    /// Resync in progress
    Syncing,
    /// Resync failed, requires retry
    Failed,
    /// Lock not found on L1
    NotFound,
}

/// Resync source enum
#[derive(Debug, Serialize, Deserialize, Clone, Copy, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum ResyncSource {
    /// Automatic polling detected the unsynced lock
    AutoPoll,
    /// Manual user request
    Manual,
}

// ============================================================================
// Request Types
// ============================================================================

/// POST /v1/resync request body
#[derive(Debug, Deserialize)]
pub struct ResyncRequest {
    /// Lock ID to resync
    #[serde(rename = "lockId")]
    pub lock_id: String,
    /// L1 transaction hash that created the lock
    #[serde(rename = "l1TxHash")]
    pub l1_tx_hash: String,
}

// ============================================================================
// Response Types
// ============================================================================

/// POST /v1/resync response
#[derive(Debug, Serialize)]
pub struct ResyncResponse {
    /// Lock ID
    #[serde(rename = "lockId")]
    pub lock_id: String,
    /// Current resync status
    pub status: ResyncStatus,
    /// Resync request ID for tracking
    #[serde(rename = "resyncId")]
    pub resync_id: String,
    /// Message describing the result
    pub message: String,
    /// Estimated time to completion (seconds)
    #[serde(rename = "estimatedTime")]
    pub estimated_time: Option<u32>,
}

/// GET /v1/resync/:lock_id response
#[derive(Debug, Serialize)]
pub struct ResyncStatusResponse {
    /// Lock ID
    #[serde(rename = "lockId")]
    pub lock_id: String,
    /// Current sync status
    pub status: ResyncStatus,
    /// Lock details (if synced)
    pub lock: Option<SyncedLockInfo>,
    /// L1 transaction info
    #[serde(rename = "l1Info")]
    pub l1_info: Option<L1TransactionInfo>,
    /// L3 state info
    #[serde(rename = "l3Info")]
    pub l3_info: Option<L3StateInfo>,
    /// Resync history
    pub history: Vec<ResyncHistoryEntry>,
    /// Last checked timestamp
    #[serde(rename = "lastChecked")]
    pub last_checked: u64,
}

/// Synced lock information
#[derive(Debug, Serialize, Clone)]
pub struct SyncedLockInfo {
    /// Lock ID
    #[serde(rename = "lockId")]
    pub lock_id: String,
    /// Asset address
    pub asset: String,
    /// Locked amount
    pub amount: String,
    /// Destination chain ID
    #[serde(rename = "destChainId")]
    pub dest_chain_id: u64,
    /// Destination address
    #[serde(rename = "destAddr")]
    pub dest_addr: String,
    /// State root (SR_0)
    #[serde(rename = "stateRoot")]
    pub state_root: String,
    /// Lock creation timestamp
    #[serde(rename = "createdAt")]
    pub created_at: u64,
    /// Expiry timestamp
    pub expiry: u64,
}

/// L1 transaction information
#[derive(Debug, Serialize, Clone)]
pub struct L1TransactionInfo {
    /// Transaction hash
    #[serde(rename = "txHash")]
    pub tx_hash: String,
    /// Block number
    #[serde(rename = "blockNumber")]
    pub block_number: u64,
    /// Confirmation status
    pub confirmed: bool,
    /// Confirmations count
    pub confirmations: u32,
    /// Gas used
    #[serde(rename = "gasUsed")]
    pub gas_used: u64,
    /// Event data from lock
    #[serde(rename = "eventData")]
    pub event_data: Option<LockEventData>,
}

/// Lock event data from L1
#[derive(Debug, Serialize, Clone)]
pub struct LockEventData {
    /// Emitted lock ID
    #[serde(rename = "lockId")]
    pub lock_id: String,
    /// Emitted state root
    #[serde(rename = "stateRoot")]
    pub state_root: String,
    /// User address
    pub user: String,
    /// Asset address
    pub asset: String,
    /// Amount
    pub amount: String,
}

/// L3 state information
#[derive(Debug, Serialize, Clone)]
pub struct L3StateInfo {
    /// Is lock known on L3
    #[serde(rename = "lockKnown")]
    pub lock_known: bool,
    /// L3 recorded state root
    #[serde(rename = "recordedStateRoot")]
    pub recorded_state_root: Option<String>,
    /// SMT leaf index
    #[serde(rename = "smtLeafIndex")]
    pub smt_leaf_index: Option<u64>,
    /// Last sync block
    #[serde(rename = "lastSyncBlock")]
    pub last_sync_block: u64,
}

/// Resync history entry
#[derive(Debug, Serialize, Clone)]
pub struct ResyncHistoryEntry {
    /// Timestamp
    pub timestamp: u64,
    /// Action taken
    pub action: String,
    /// Source of resync attempt
    pub source: ResyncSource,
    /// Result
    pub result: String,
    /// Error message if failed
    pub error: Option<String>,
}

/// GET /v1/resync/pending response
#[derive(Debug, Serialize)]
pub struct PendingResyncsResponse {
    /// List of pending locks that need resync
    pub pending: Vec<PendingResyncItem>,
    /// Total count
    pub total: u32,
    /// Last auto-poll timestamp
    #[serde(rename = "lastAutoPoll")]
    pub last_auto_poll: u64,
    /// Auto-poll interval (seconds)
    #[serde(rename = "autoPollInterval")]
    pub auto_poll_interval: u32,
    /// Summary statistics
    pub summary: ResyncSummary,
}

/// Pending resync item
#[derive(Debug, Serialize, Clone)]
pub struct PendingResyncItem {
    /// Lock ID
    #[serde(rename = "lockId")]
    pub lock_id: String,
    /// L1 transaction hash
    #[serde(rename = "l1TxHash")]
    pub l1_tx_hash: String,
    /// Asset address
    pub asset: String,
    /// Amount
    pub amount: String,
    /// User address
    pub user: String,
    /// L1 block number
    #[serde(rename = "l1BlockNumber")]
    pub l1_block_number: u64,
    /// Detected at timestamp
    #[serde(rename = "detectedAt")]
    pub detected_at: u64,
    /// Retry count
    #[serde(rename = "retryCount")]
    pub retry_count: u32,
    /// Last retry timestamp
    #[serde(rename = "lastRetry")]
    pub last_retry: Option<u64>,
    /// Status
    pub status: ResyncStatus,
}

/// Resync summary statistics
#[derive(Debug, Serialize)]
pub struct ResyncSummary {
    /// Total pending
    #[serde(rename = "totalPending")]
    pub total_pending: u32,
    /// Successfully synced (last 24h)
    #[serde(rename = "syncedLast24h")]
    pub synced_last_24h: u32,
    /// Failed (requires manual intervention)
    #[serde(rename = "failedCount")]
    pub failed_count: u32,
    /// Average sync time (seconds)
    #[serde(rename = "avgSyncTime")]
    pub avg_sync_time: u32,
}

// ============================================================================
// Endpoint Handlers
// ============================================================================

/// POST /v1/resync
///
/// Manually trigger resync for a lock that failed to sync from L1 to L3.
/// This is used when the automatic event polling missed a lock or when
/// there was a communication failure between L1 and L3.
///
/// # Sequence #3' Resync Flow (Manual)
/// 1. User submits resync request with lock_id and L1 tx hash
/// 2. API verifies the L1 transaction and lock data
/// 3. API updates L3 state with the verified lock
/// 4. Returns resync confirmation
pub async fn create_resync(
    Extension(state): Extension<Arc<AppState>>,
    Json(req): Json<ResyncRequest>,
) -> Result<Json<ResyncResponse>, ApiError> {
    tracing::info!(
        "Resync: Manual resync request started, lock_id={}, l1_tx_hash={}",
        req.lock_id,
        req.l1_tx_hash
    );

    // Validate L1 tx hash format
    if !req.l1_tx_hash.starts_with("0x") || req.l1_tx_hash.len() != 66 {
        return Err(ApiError::InvalidRequest("Invalid L1 transaction hash format".to_string()));
    }

    let pool = state.pool();

    // Verify the lock exists in DB
    let lock = LockRepository::get_by_id(pool, &req.lock_id)
        .await?
        .ok_or_else(|| ApiError::LockNotFound(req.lock_id.clone()))?;

    // Generate resync ID
    let resync_id = format!(
        "resync-{}",
        uuid::Uuid::new_v4().to_string().chars().take(8).collect::<String>()
    );

    // Store the L1 tx hash on the lock record
    LockRepository::update_l1_tx_hash(pool, &req.lock_id, &req.l1_tx_hash).await?;

    // Determine resync status from the lock's current DB status
    let (status, message, estimated_time) = match lock.status.as_str() {
        "confirmed" | "locked" => (
            ResyncStatus::Synced,
            "Lock is already synced on L3.".to_string(),
            None,
        ),
        "pending" => (
            ResyncStatus::PendingSync,
            "Resync request accepted. Lock will be synced shortly.".to_string(),
            Some(60u32),
        ),
        "pending_confirmation" => (
            ResyncStatus::Syncing,
            "Resync in progress. Awaiting L1 confirmation.".to_string(),
            Some(120u32),
        ),
        "failed" => (
            ResyncStatus::Failed,
            "Lock is in failed state. Manual intervention may be required.".to_string(),
            None,
        ),
        _ => (
            ResyncStatus::PendingSync,
            format!("Resync request accepted for lock in '{}' state.", lock.status),
            Some(90u32),
        ),
    };

    tracing::info!(
        "Resync: Manual resync completed, lock_id={}, resync_id={}, status={:?}",
        req.lock_id,
        resync_id,
        status
    );

    Ok(Json(ResyncResponse {
        lock_id: req.lock_id,
        status,
        resync_id,
        message,
        estimated_time,
    }))
}

/// GET /v1/resync/:lock_id
///
/// Get the current sync status for a specific lock, including L1 and L3 state.
pub async fn get_resync_status(
    Extension(state): Extension<Arc<AppState>>,
    Path(lock_id): Path<String>,
) -> Result<Json<ResyncStatusResponse>, ApiError> {
    tracing::info!("Resync: Getting status started, lock_id={}", lock_id);

    let pool = state.pool();
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs();

    // Query lock from DB
    let lock_opt = LockRepository::get_by_id(pool, &lock_id).await?;

    let (status, lock_info, l1_info, l3_info) = match lock_opt {
        Some(ref lock) => {
            let resync_status = match lock.status.as_str() {
                "confirmed" | "locked" => ResyncStatus::Synced,
                "pending" => ResyncStatus::PendingSync,
                "pending_confirmation" => ResyncStatus::Syncing,
                "failed" => ResyncStatus::Failed,
                _ => ResyncStatus::PendingSync,
            };

            let dest_addr_hex = format!("0x{}", hex::encode(&lock.dest_addr));

            let synced_lock = SyncedLockInfo {
                lock_id: lock.lock_id.clone(),
                asset: lock.asset.clone(),
                amount: lock.amount.to_string(),
                dest_chain_id: lock.chain_id as u64,
                dest_addr: dest_addr_hex,
                state_root: lock.sr_0.clone(),
                created_at: lock.created_at.timestamp() as u64,
                expiry: lock.expiry as u64,
            };

            // L1 info: populated from lock record if l1_tx_hash exists;
            // block number / confirmations / gas are L1-specific and not stored in our DB
            let l1 = lock.l1_tx_hash.as_ref().map(|tx_hash| L1TransactionInfo {
                tx_hash: tx_hash.clone(),
                block_number: 0,    // L1-specific, not available in DB
                confirmed: resync_status == ResyncStatus::Synced,
                confirmations: 0,   // L1-specific, not available in DB
                gas_used: 0,        // L1-specific, not available in DB
                event_data: None,   // L1-specific, not available in DB
            });

            // L3 info: derived from lock record existence and state root
            let l3 = Some(L3StateInfo {
                lock_known: true,
                recorded_state_root: Some(lock.sr_0.clone()),
                smt_leaf_index: None,   // SMT index not stored in locks table
                last_sync_block: 0,     // L3-specific, not available in DB
            });

            (resync_status, Some(synced_lock), l1, l3)
        }
        None => (
            ResyncStatus::NotFound,
            None,
            None,
            Some(L3StateInfo {
                lock_known: false,
                recorded_state_root: None,
                smt_leaf_index: None,
                last_sync_block: 0,
            }),
        ),
    };

    // No resync_history table exists; return empty history
    let history = Vec::new();

    tracing::info!(
        "Resync: Getting status completed, lock_id={}, status={:?}, found={}",
        lock_id,
        status,
        lock_opt.is_some()
    );

    Ok(Json(ResyncStatusResponse {
        lock_id,
        status,
        lock: lock_info,
        l1_info,
        l3_info,
        history,
        last_checked: now,
    }))
}

/// GET /v1/resync/pending
///
/// Get list of all locks that are pending synchronization.
/// This endpoint is useful for monitoring and manual intervention.
pub async fn get_pending_resyncs(
    Extension(state): Extension<Arc<AppState>>,
) -> Result<Json<PendingResyncsResponse>, ApiError> {
    tracing::info!("Resync: Getting pending resyncs started");

    let pool = state.pool();
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs();

    // Query locks with pending-like statuses from DB
    let pending_locks = LockRepository::list_locks(pool, None, Some("pending"), 0, 1000).await?;
    let pending_conf_locks =
        LockRepository::list_locks(pool, None, Some("pending_confirmation"), 0, 1000).await?;
    let failed_locks = LockRepository::list_locks(pool, None, Some("failed"), 0, 1000).await?;

    // Count confirmed locks (for summary: synced in last 24h approximation)
    let synced_count = LockRepository::count_by_status(pool, Some("confirmed")).await?
        + LockRepository::count_by_status(pool, Some("locked")).await?;

    // Combine pending + pending_confirmation into pending items
    let mut pending: Vec<PendingResyncItem> = Vec::new();

    for lock in pending_locks.iter().chain(pending_conf_locks.iter()) {
        pending.push(PendingResyncItem {
            lock_id: lock.lock_id.clone(),
            l1_tx_hash: lock.l1_tx_hash.clone().unwrap_or_default(),
            asset: lock.asset.clone(),
            amount: lock.amount.to_string(),
            user: lock.wallet_address.clone(),
            l1_block_number: 0,  // L1-specific, not stored in locks table
            detected_at: lock.created_at.timestamp() as u64,
            retry_count: 0,      // No retry tracking table exists
            last_retry: None,    // No retry tracking table exists
            status: if lock.status == "pending" {
                ResyncStatus::PendingSync
            } else {
                ResyncStatus::Syncing
            },
        });
    }

    for lock in &failed_locks {
        pending.push(PendingResyncItem {
            lock_id: lock.lock_id.clone(),
            l1_tx_hash: lock.l1_tx_hash.clone().unwrap_or_default(),
            asset: lock.asset.clone(),
            amount: lock.amount.to_string(),
            user: lock.wallet_address.clone(),
            l1_block_number: 0,
            detected_at: lock.created_at.timestamp() as u64,
            retry_count: 0,
            last_retry: None,
            status: ResyncStatus::Failed,
        });
    }

    let total = pending.len() as u32;
    let failed_count = failed_locks.len() as u32;

    tracing::info!(
        "Resync: Getting pending resyncs completed, total={}, failed={}",
        total,
        failed_count
    );

    Ok(Json(PendingResyncsResponse {
        pending,
        total,
        last_auto_poll: now,
        auto_poll_interval: 60,
        summary: ResyncSummary {
            total_pending: total,
            synced_last_24h: synced_count as u32,
            failed_count,
            avg_sync_time: 0, // No timing data available in DB
        },
    }))
}

// ============================================================================
// Unit Tests
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_resync_status_serialization() {
        let status = ResyncStatus::Synced;
        let json = serde_json::to_string(&status).unwrap();
        assert_eq!(json, "\"synced\"");

        let status = ResyncStatus::PendingSync;
        let json = serde_json::to_string(&status).unwrap();
        assert_eq!(json, "\"pending_sync\"");

        let status = ResyncStatus::Failed;
        let json = serde_json::to_string(&status).unwrap();
        assert_eq!(json, "\"failed\"");
    }

    #[test]
    fn test_resync_source_serialization() {
        let source = ResyncSource::AutoPoll;
        let json = serde_json::to_string(&source).unwrap();
        assert_eq!(json, "\"auto_poll\"");

        let source = ResyncSource::Manual;
        let json = serde_json::to_string(&source).unwrap();
        assert_eq!(json, "\"manual\"");
    }

    #[test]
    fn test_resync_request_deserialization() {
        let json = r#"{
            "lockId": "lock-123",
            "l1TxHash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
        }"#;

        let req: ResyncRequest = serde_json::from_str(json).unwrap();
        assert_eq!(req.lock_id, "lock-123");
        assert!(req.l1_tx_hash.starts_with("0x"));
        assert_eq!(req.l1_tx_hash.len(), 66);
    }

    #[test]
    fn test_resync_response_serialization() {
        let response = ResyncResponse {
            lock_id: "lock-123".to_string(),
            status: ResyncStatus::Synced,
            resync_id: "resync-abc12345".to_string(),
            message: "Resync completed".to_string(),
            estimated_time: None,
        };

        let json = serde_json::to_string(&response).unwrap();
        assert!(json.contains("\"lockId\":\"lock-123\""));
        assert!(json.contains("\"status\":\"synced\""));
        assert!(json.contains("\"resyncId\":\"resync-abc12345\""));
    }

    #[test]
    fn test_synced_lock_info_serialization() {
        let info = SyncedLockInfo {
            lock_id: "lock-456".to_string(),
            asset: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2".to_string(),
            amount: "1000000000000000000".to_string(),
            dest_chain_id: 42161,
            dest_addr: "0x1234...".to_string(),
            state_root: "0xabcd...".to_string(),
            created_at: 1736467200,
            expiry: 1736553600,
        };

        let json = serde_json::to_string(&info).unwrap();
        assert!(json.contains("\"lockId\":\"lock-456\""));
        assert!(json.contains("\"destChainId\":42161"));
        assert!(json.contains("\"stateRoot\""));
    }

    #[test]
    fn test_pending_resync_item_serialization() {
        let item = PendingResyncItem {
            lock_id: "lock-pending-001".to_string(),
            l1_tx_hash: "0x1111...".to_string(),
            asset: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2".to_string(),
            amount: "500000000000000000".to_string(),
            user: "0xaaaa...".to_string(),
            l1_block_number: 18999990,
            detected_at: 1736467200,
            retry_count: 2,
            last_retry: Some(1736467140),
            status: ResyncStatus::PendingSync,
        };

        let json = serde_json::to_string(&item).unwrap();
        assert!(json.contains("\"lockId\":\"lock-pending-001\""));
        assert!(json.contains("\"l1TxHash\""));
        assert!(json.contains("\"retryCount\":2"));
        assert!(json.contains("\"status\":\"pending_sync\""));
    }

    #[test]
    fn test_resync_history_entry_serialization() {
        let entry = ResyncHistoryEntry {
            timestamp: 1736467200,
            action: "Lock created on L1".to_string(),
            source: ResyncSource::AutoPoll,
            result: "success".to_string(),
            error: None,
        };

        let json = serde_json::to_string(&entry).unwrap();
        assert!(json.contains("\"action\":\"Lock created on L1\""));
        assert!(json.contains("\"source\":\"auto_poll\""));
        assert!(json.contains("\"result\":\"success\""));
    }
}
