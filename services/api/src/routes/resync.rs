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
    Extension(_state): Extension<Arc<AppState>>,
    Json(req): Json<ResyncRequest>,
) -> Result<Json<ResyncResponse>, ApiError> {
    tracing::info!(
        "Resync: Manual resync request for lock_id={}, l1_tx_hash={}",
        req.lock_id,
        req.l1_tx_hash
    );

    // Validate L1 tx hash format
    if !req.l1_tx_hash.starts_with("0x") || req.l1_tx_hash.len() != 66 {
        return Err(ApiError::InvalidRequest("Invalid L1 transaction hash format".to_string()));
    }

    // Generate resync ID
    let resync_id = format!(
        "resync-{}",
        uuid::Uuid::new_v4().to_string().chars().take(8).collect::<String>()
    );

    // In production:
    // 1. Query L1 for the transaction
    // 2. Verify the Lock event was emitted
    // 3. Extract lock data (SR_0, asset, amount, etc.)
    // 4. Update L3 SMT with the lock
    // 5. Return confirmed status

    // Mock: Simulate successful resync
    Ok(Json(ResyncResponse {
        lock_id: req.lock_id,
        status: ResyncStatus::Synced,
        resync_id,
        message: "Resync completed successfully. Lock is now synced on L3.".to_string(),
        estimated_time: None,
    }))
}

/// GET /v1/resync/:lock_id
///
/// Get the current sync status for a specific lock, including L1 and L3 state.
pub async fn get_resync_status(
    Extension(_state): Extension<Arc<AppState>>,
    Path(lock_id): Path<String>,
) -> Result<Json<ResyncStatusResponse>, ApiError> {
    tracing::debug!("Resync: Getting status for lock_id={}", lock_id);

    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs();

    // Mock: Return synced status with full details
    Ok(Json(ResyncStatusResponse {
        lock_id: lock_id.clone(),
        status: ResyncStatus::Synced,
        lock: Some(SyncedLockInfo {
            lock_id: lock_id.clone(),
            asset: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2".to_string(), // WETH
            amount: "1000000000000000000".to_string(), // 1 ETH
            dest_chain_id: 42161, // Arbitrum
            dest_addr: "0x1234567890abcdef1234567890abcdef12345678".to_string(),
            state_root: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890".to_string(),
            created_at: now - 3600, // 1 hour ago
            expiry: now + 86400, // 24 hours from now
        }),
        l1_info: Some(L1TransactionInfo {
            tx_hash: "0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba".to_string(),
            block_number: 19000000,
            confirmed: true,
            confirmations: 12,
            gas_used: 135000,
            event_data: Some(LockEventData {
                lock_id: lock_id.clone(),
                state_root: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890".to_string(),
                user: "0x1234567890abcdef1234567890abcdef12345678".to_string(),
                asset: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2".to_string(),
                amount: "1000000000000000000".to_string(),
            }),
        }),
        l3_info: Some(L3StateInfo {
            lock_known: true,
            recorded_state_root: Some("0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890".to_string()),
            smt_leaf_index: Some(12345),
            last_sync_block: 19000000,
        }),
        history: vec![
            ResyncHistoryEntry {
                timestamp: now - 3600,
                action: "Lock created on L1".to_string(),
                source: ResyncSource::AutoPoll,
                result: "success".to_string(),
                error: None,
            },
            ResyncHistoryEntry {
                timestamp: now - 3590,
                action: "L3 sync completed".to_string(),
                source: ResyncSource::AutoPoll,
                result: "success".to_string(),
                error: None,
            },
        ],
        last_checked: now,
    }))
}

/// GET /v1/resync/pending
///
/// Get list of all locks that are pending synchronization.
/// This endpoint is useful for monitoring and manual intervention.
pub async fn get_pending_resyncs(
    Extension(_state): Extension<Arc<AppState>>,
) -> Result<Json<PendingResyncsResponse>, ApiError> {
    tracing::debug!("Resync: Getting pending resyncs");

    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs();

    // Mock: Return a few pending items for demonstration
    // In production, this would query the database for unsynced locks
    let pending = vec![
        PendingResyncItem {
            lock_id: "lock-pending-001".to_string(),
            l1_tx_hash: "0x1111111111111111111111111111111111111111111111111111111111111111".to_string(),
            asset: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2".to_string(),
            amount: "500000000000000000".to_string(), // 0.5 ETH
            user: "0xaaaa111122223333444455556666777788889999".to_string(),
            l1_block_number: 18999990,
            detected_at: now - 300, // 5 minutes ago
            retry_count: 2,
            last_retry: Some(now - 60),
            status: ResyncStatus::PendingSync,
        },
        PendingResyncItem {
            lock_id: "lock-pending-002".to_string(),
            l1_tx_hash: "0x2222222222222222222222222222222222222222222222222222222222222222".to_string(),
            asset: "0xA0b86a33E6a8CbB7b2c3bDdee8B0c2f3D4E5F6a7".to_string(), // Some token
            amount: "1000000000000000000000".to_string(), // 1000 tokens
            user: "0xbbbb111122223333444455556666777788889999".to_string(),
            l1_block_number: 18999985,
            detected_at: now - 600, // 10 minutes ago
            retry_count: 3,
            last_retry: Some(now - 120),
            status: ResyncStatus::Failed,
        },
    ];

    Ok(Json(PendingResyncsResponse {
        pending,
        total: 2,
        last_auto_poll: now - 30, // 30 seconds ago
        auto_poll_interval: 60, // 1 minute
        summary: ResyncSummary {
            total_pending: 2,
            synced_last_24h: 156,
            failed_count: 1,
            avg_sync_time: 45, // 45 seconds average
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
