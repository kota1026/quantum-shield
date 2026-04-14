//! L1 Event Indexer for Dashboard Data
//!
//! Fetches historical events from L1 Vault contract and syncs to PostgreSQL.
//! This provides accurate data for the QS Admin dashboard.
//!
//! Events indexed:
//! - Locked: User locks ETH in the vault
//! - UnlockExecuted: User withdraws ETH from the vault
//!
//! Data synced:
//! - Lock count per wallet
//! - Unlock count per wallet
//! - Total TVL
//! - Unique user count

use ethers::prelude::*;
use ethers::types::{H256, U256, Address, Filter, Log};
use bigdecimal::BigDecimal;
use sqlx::PgPool;
use std::str::FromStr;
use std::sync::Arc;
use tracing::{info, warn, instrument};

use crate::error::ApiError;

/// Event signatures (keccak256 hashes - used by L1 for event filtering)
/// Locked(bytes32,address,address,uint256,bytes32,bytes32)
const LOCKED_EVENT_SIGNATURE: &str = "0x7ea6a10ee887144d0680d547987ce45166d4fb495877d46fdd000ff01767b99c";
/// UnlockExecuted(bytes32,address,uint256)
const UNLOCK_EXECUTED_SIGNATURE: &str = "0x41f97fc03cf7f2c1829da0c368b4c948bb17a3c760dd35510feed443faaa7040";

/// Indexed lock event from L1
#[derive(Debug, Clone)]
pub struct IndexedLock {
    pub lock_id: String,
    pub sender: String,
    pub recipient: String,
    pub amount: BigDecimal,
    pub tx_hash: String,
    pub block_number: u64,
    pub timestamp: u64,
}

/// Indexed unlock event from L1
#[derive(Debug, Clone)]
pub struct IndexedUnlock {
    pub lock_id: String,
    pub recipient: String,
    pub amount: BigDecimal,
    pub tx_hash: String,
    pub block_number: u64,
}

/// L1 Dashboard Stats from on-chain data
#[derive(Debug, Clone, Default)]
pub struct L1DashboardStats {
    pub total_locks: u64,
    pub total_unlocks: u64,
    pub total_tvl_wei: U256,
    pub unique_users: u64,
    pub locks: Vec<IndexedLock>,
}

/// L1 Indexer for fetching on-chain data
pub struct L1Indexer {
    provider: Arc<Provider<Http>>,
    vault_address: Address,
}

impl L1Indexer {
    /// Create new L1 Indexer
    ///
    /// `vault_address` must be the current production vault (from `config.l1_vault_address`).
    /// Do NOT hardcode addresses here — use the value from config so Railway env var
    /// `QS__L1_VAULT_ADDRESS` controls which contract is indexed.
    pub async fn new(rpc_url: &str, vault_address: &str) -> Result<Self, ApiError> {
        let provider = Provider::<Http>::try_from(rpc_url)
            .map_err(|e| ApiError::Internal(format!("Failed to connect to L1: {}", e)))?;

        let parsed_address = vault_address.parse::<Address>()
            .map_err(|e| ApiError::Internal(format!("Invalid vault address '{}': {}", vault_address, e)))?;

        info!("L1 Indexer initialized for vault: {}", vault_address);

        Ok(Self {
            provider: Arc::new(provider),
            vault_address: parsed_address,
        })
    }

    /// Get total locked value from contract state
    #[instrument(skip(self))]
    pub async fn get_total_locked(&self) -> Result<U256, ApiError> {
        // Read totalLocked state variable (slot 6 based on L1Vault.sol)
        // Actually easier to just read the contract balance
        let balance = self.provider
            .get_balance(self.vault_address, None)
            .await
            .map_err(|e| ApiError::Internal(format!("Failed to get vault balance: {}", e)))?;

        info!("L1 Vault balance: {} wei", balance);
        Ok(balance)
    }

    /// Fetch Locked events from L1
    #[instrument(skip(self))]
    pub async fn fetch_locked_events(&self, from_block: u64, to_block: Option<u64>) -> Result<Vec<IndexedLock>, ApiError> {
        let current_block = self.provider
            .get_block_number()
            .await
            .map_err(|e| ApiError::Internal(format!("Failed to get block number: {}", e)))?
            .as_u64();

        let to = to_block.unwrap_or(current_block);

        info!("Fetching Locked events from block {} to {}", from_block, to);

        // Build filter for Locked events
        let filter = Filter::new()
            .address(self.vault_address)
            .from_block(from_block)
            .to_block(to)
            .topic0(H256::from_str(LOCKED_EVENT_SIGNATURE).unwrap_or_default());

        let logs = self.provider
            .get_logs(&filter)
            .await
            .map_err(|e| ApiError::Internal(format!("Failed to fetch logs: {}", e)))?;

        info!("Found {} Locked events", logs.len());

        let mut locks = Vec::new();
        for log in logs {
            if let Some(indexed) = self.parse_locked_event(&log).await {
                locks.push(indexed);
            }
        }

        Ok(locks)
    }

    /// Parse a Locked event log
    async fn parse_locked_event(&self, log: &Log) -> Option<IndexedLock> {
        // Locked event: Locked(bytes32 indexed lockId, address indexed sender, address indexed recipient, uint256 amount, bytes32 dilithiumPubKeyHash, bytes32 stateRoot)
        // Topics: [event_sig, lockId, sender, recipient]
        // Data: [amount, dilithiumPubKeyHash, stateRoot]

        if log.topics.len() < 4 {
            warn!("Invalid Locked event: not enough topics");
            return None;
        }

        let lock_id = format!("0x{}", hex::encode(log.topics[1].as_bytes()));
        let sender = format!("0x{}", hex::encode(&log.topics[2].as_bytes()[12..32]));
        let recipient = format!("0x{}", hex::encode(&log.topics[3].as_bytes()[12..32]));

        // Parse amount from data (first 32 bytes)
        let amount = if log.data.len() >= 32 {
            let amount_bytes = &log.data[0..32];
            let amount_u256 = U256::from_big_endian(amount_bytes);
            BigDecimal::from_str(&amount_u256.to_string()).unwrap_or_default()
        } else {
            BigDecimal::from(0)
        };

        let tx_hash = log.transaction_hash
            .map(|h| format!("0x{}", hex::encode(h.as_bytes())))
            .unwrap_or_default();

        let block_number = log.block_number.map(|b| b.as_u64()).unwrap_or(0);

        // Get block timestamp
        let timestamp = if let Some(block_num) = log.block_number {
            if let Ok(Some(block)) = self.provider.get_block(block_num).await {
                block.timestamp.as_u64()
            } else {
                0
            }
        } else {
            0
        };

        Some(IndexedLock {
            lock_id,
            sender,
            recipient,
            amount,
            tx_hash,
            block_number,
            timestamp,
        })
    }

    /// Get dashboard stats from L1
    #[instrument(skip(self))]
    pub async fn get_dashboard_stats(&self) -> Result<L1DashboardStats, ApiError> {
        // Get TVL
        let total_tvl_wei = self.get_total_locked().await?;

        // Fetch all Locked events from deployment block
        // L1Vault was deployed around block ~7000000 on Sepolia (estimate)
        // L1Vault v2.0.0 deployed on Sepolia around block 10190000
        let deployment_block = 10190000u64;
        let locks = self.fetch_locked_events(deployment_block, None).await?;

        // Count unique users
        let unique_users: std::collections::HashSet<String> = locks
            .iter()
            .map(|l| l.sender.to_lowercase())
            .collect();

        Ok(L1DashboardStats {
            total_locks: locks.len() as u64,
            total_unlocks: 0, // TODO: Fetch UnlockExecuted events
            total_tvl_wei,
            unique_users: unique_users.len() as u64,
            locks,
        })
    }

    /// Sync L1 data to PostgreSQL
    #[instrument(skip(self, pool))]
    pub async fn sync_to_database(&self, pool: &PgPool) -> Result<u64, ApiError> {
        info!("Starting L1 to PostgreSQL sync");

        // Get the last synced block from database
        let last_synced: Option<i64> = sqlx::query_scalar(
            "SELECT COALESCE(MAX(block_number), 0) FROM l1_sync_state"
        )
        .fetch_optional(pool)
        .await
        .map_err(|e| ApiError::Internal(format!("DB error: {}", e)))?
        .flatten();

        // L1Vault v2.0.0 deployed on Sepolia around block 10190000
        let from_block = last_synced.map(|b| b as u64 + 1).unwrap_or(10190000);

        // Fetch new events
        let locks = self.fetch_locked_events(from_block, None).await?;

        if locks.is_empty() {
            info!("No new events to sync");
            return Ok(0);
        }

        let mut synced_count = 0u64;

        for lock in &locks {
            // Ensure user exists
            sqlx::query(
                "INSERT INTO users (wallet_address) VALUES ($1) ON CONFLICT DO NOTHING"
            )
            .bind(&lock.sender)
            .execute(pool)
            .await
            .ok();

            // Insert lock record
            let result = sqlx::query(
                r#"
                INSERT INTO locks (
                    lock_id, wallet_address, chain_id, asset, amount, dest_addr,
                    expiry, nonce, pk_dilithium, sig_dilithium, sr_0, status,
                    l1_tx_hash, created_at, confirmed_at
                ) VALUES (
                    $1, $2, 11155111, '0x0000000000000000000000000000000000000000',
                    $3, $4::bytea, 0, 0, ''::bytea, ''::bytea, '', 'confirmed',
                    $5, to_timestamp($6), NOW()
                )
                ON CONFLICT (lock_id) DO UPDATE SET
                    status = CASE WHEN locks.status = 'pending' THEN 'confirmed' ELSE locks.status END,
                    confirmed_at = CASE WHEN locks.status = 'pending' THEN NOW() ELSE locks.confirmed_at END,
                    l1_tx_hash = COALESCE(locks.l1_tx_hash, EXCLUDED.l1_tx_hash)
                "#
            )
            .bind(&lock.lock_id)
            .bind(&lock.sender)
            .bind(&lock.amount)
            .bind(hex::decode(&lock.recipient.trim_start_matches("0x")).unwrap_or_default())
            .bind(&lock.tx_hash)
            .bind(lock.timestamp as i64)
            .execute(pool)
            .await;

            if result.is_ok() {
                synced_count += 1;
            }
        }

        // Update sync state
        if let Some(last_lock) = locks.last() {
            sqlx::query(
                "INSERT INTO l1_sync_state (id, block_number, synced_at) VALUES (1, $1, NOW())
                 ON CONFLICT (id) DO UPDATE SET block_number = $1, synced_at = NOW()"
            )
            .bind(last_lock.block_number as i64)
            .execute(pool)
            .await
            .ok();
        }

        info!("Synced {} locks to PostgreSQL", synced_count);
        Ok(synced_count)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_vault_address_parsing() {
        // Verify the canonical vault address (from default.yaml / blockchain.md) parses correctly
        let addr = "0x07012aeF87C6E423c32F2f8eaF81762f63337260".parse::<Address>();
        assert!(addr.is_ok());
    }
}
