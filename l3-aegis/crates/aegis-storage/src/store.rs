//! Storage implementation using RocksDB.
//!
//! CP-1 Compliance: All hash operations use SHA3-256 via aegis-types::Hash256.

use std::sync::Arc;
use rocksdb::{DB, Options, ColumnFamilyDescriptor, WriteBatch};
use tracing::{info, debug, error};

use aegis_types::{Hash256, Block, BlockHeader, Transaction};
use crate::error::{StorageError, StorageResult};
use crate::config::StorageConfig;
use crate::{cf, STORAGE_VERSION};

/// Main storage handle wrapping RocksDB.
pub struct Storage {
    db: Arc<DB>,
    config: StorageConfig,
}

impl Storage {
    /// Open or create the storage at the configured path.
    pub fn open(config: StorageConfig) -> StorageResult<Self> {
        let mut opts = Options::default();
        opts.create_if_missing(config.create_if_missing);
        opts.create_missing_column_families(true);
        opts.set_max_open_files(config.max_open_files);
        opts.set_write_buffer_size(config.write_buffer_size);
        opts.set_max_write_buffer_number(config.max_write_buffer_number);
        opts.increase_parallelism(config.compaction_threads);

        if config.enable_compression {
            opts.set_compression_type(rocksdb::DBCompressionType::Lz4);
        }

        // Define column families
        let cf_descriptors = vec![
            ColumnFamilyDescriptor::new(cf::BLOCK_HEADERS, Options::default()),
            ColumnFamilyDescriptor::new(cf::BLOCK_BODIES, Options::default()),
            ColumnFamilyDescriptor::new(cf::BLOCK_HEIGHT_INDEX, Options::default()),
            ColumnFamilyDescriptor::new(cf::ACCOUNTS, Options::default()),
            ColumnFamilyDescriptor::new(cf::TX_POOL, Options::default()),
            ColumnFamilyDescriptor::new(cf::METADATA, Options::default()),
        ];

        let db = DB::open_cf_descriptors(&opts, &config.db_path, cf_descriptors)?;
        
        info!(
            path = %config.db_path.display(),
            "Storage opened successfully"
        );

        Ok(Self {
            db: Arc::new(db),
            config,
        })
    }

    /// Get the block store interface.
    pub fn blocks(&self) -> BlockStore {
        BlockStore { db: self.db.clone() }
    }

    /// Get the state store interface.
    pub fn state(&self) -> StateStore {
        StateStore { db: self.db.clone() }
    }

    /// Get the current chain tip hash.
    pub fn chain_tip(&self) -> StorageResult<Option<Hash256>> {
        let cf = self.db.cf_handle(cf::METADATA)
            .ok_or(StorageError::NotInitialized)?;
        
        match self.db.get_cf(&cf, b"chain_tip")? {
            Some(bytes) => {
                let hash = Hash256::from_bytes(&bytes)
                    .map_err(|_| StorageError::InvalidData {
                        msg: "Invalid chain tip hash".to_string(),
                    })?;
                Ok(Some(hash))
            }
            None => Ok(None),
        }
    }

    /// Set the current chain tip hash.
    pub fn set_chain_tip(&self, hash: &Hash256) -> StorageResult<()> {
        let cf = self.db.cf_handle(cf::METADATA)
            .ok_or(StorageError::NotInitialized)?;
        
        self.db.put_cf(&cf, b"chain_tip", hash.as_bytes())?;
        debug!(hash = %hash, "Chain tip updated");
        Ok(())
    }

    /// Get storage version.
    pub fn version(&self) -> u32 {
        STORAGE_VERSION
    }
}

/// Block storage operations.
pub struct BlockStore {
    db: Arc<DB>,
}

impl BlockStore {
    /// Store a block header.
    pub fn put_header(&self, header: &BlockHeader) -> StorageResult<()> {
        let cf = self.db.cf_handle(cf::BLOCK_HEADERS)
            .ok_or(StorageError::NotInitialized)?;
        
        let hash = header.hash();
        let encoded = bincode::serialize(header)?;
        self.db.put_cf(&cf, hash.as_bytes(), &encoded)?;

        // Also index by height
        let height_cf = self.db.cf_handle(cf::BLOCK_HEIGHT_INDEX)
            .ok_or(StorageError::NotInitialized)?;
        self.db.put_cf(&height_cf, &header.height.to_be_bytes(), hash.as_bytes())?;

        debug!(hash = %hash, height = header.height, "Block header stored");
        Ok(())
    }

    /// Get a block header by hash.
    pub fn get_header(&self, hash: &Hash256) -> StorageResult<Option<BlockHeader>> {
        let cf = self.db.cf_handle(cf::BLOCK_HEADERS)
            .ok_or(StorageError::NotInitialized)?;
        
        match self.db.get_cf(&cf, hash.as_bytes())? {
            Some(bytes) => {
                let header: BlockHeader = bincode::deserialize(&bytes)?;
                Ok(Some(header))
            }
            None => Ok(None),
        }
    }

    /// Get block hash at a specific height.
    pub fn get_hash_at_height(&self, height: u64) -> StorageResult<Option<Hash256>> {
        let cf = self.db.cf_handle(cf::BLOCK_HEIGHT_INDEX)
            .ok_or(StorageError::NotInitialized)?;
        
        match self.db.get_cf(&cf, &height.to_be_bytes())? {
            Some(bytes) => {
                let hash = Hash256::from_bytes(&bytes)
                    .map_err(|_| StorageError::InvalidData {
                        msg: format!("Invalid hash at height {}", height),
                    })?;
                Ok(Some(hash))
            }
            None => Ok(None),
        }
    }

    /// Get a block header at a specific height.
    pub fn get_header_at_height(&self, height: u64) -> StorageResult<Option<BlockHeader>> {
        match self.get_hash_at_height(height)? {
            Some(hash) => self.get_header(&hash),
            None => Ok(None),
        }
    }

    /// Store transactions for a block.
    pub fn put_transactions(&self, block_hash: &Hash256, txs: &[Transaction]) -> StorageResult<()> {
        let cf = self.db.cf_handle(cf::BLOCK_BODIES)
            .ok_or(StorageError::NotInitialized)?;
        
        let encoded = bincode::serialize(txs)?;
        self.db.put_cf(&cf, block_hash.as_bytes(), &encoded)?;

        debug!(hash = %block_hash, tx_count = txs.len(), "Block transactions stored");
        Ok(())
    }

    /// Get transactions for a block.
    pub fn get_transactions(&self, block_hash: &Hash256) -> StorageResult<Option<Vec<Transaction>>> {
        let cf = self.db.cf_handle(cf::BLOCK_BODIES)
            .ok_or(StorageError::NotInitialized)?;
        
        match self.db.get_cf(&cf, block_hash.as_bytes())? {
            Some(bytes) => {
                let txs: Vec<Transaction> = bincode::deserialize(&bytes)?;
                Ok(Some(txs))
            }
            None => Ok(None),
        }
    }

    /// Check if a block exists.
    pub fn has_block(&self, hash: &Hash256) -> StorageResult<bool> {
        Ok(self.get_header(hash)?.is_some())
    }

    /// Get the latest block height.
    pub fn latest_height(&self) -> StorageResult<Option<u64>> {
        let cf = self.db.cf_handle(cf::BLOCK_HEIGHT_INDEX)
            .ok_or(StorageError::NotInitialized)?;
        
        // Iterate from the end to find the highest key
        let iter = self.db.iterator_cf(&cf, rocksdb::IteratorMode::End);
        
        for result in iter {
            match result {
                Ok((key, _)) => {
                    if key.len() == 8 {
                        let height = u64::from_be_bytes(key.as_ref().try_into().unwrap());
                        return Ok(Some(height));
                    }
                }
                Err(e) => {
                    error!(error = %e, "Error iterating block heights");
                    return Err(StorageError::RocksDb(e));
                }
            }
        }
        
        Ok(None)
    }
}

/// State storage operations.
pub struct StateStore {
    db: Arc<DB>,
}

/// Account state representation.
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct AccountState {
    /// Account nonce
    pub nonce: u64,
    /// Account balance (in wei-equivalent)
    pub balance: u128,
    /// Last updated block height
    pub last_updated: u64,
}

impl StateStore {
    /// Get account state.
    pub fn get_account(&self, address: &[u8; 20]) -> StorageResult<Option<AccountState>> {
        let cf = self.db.cf_handle(cf::ACCOUNTS)
            .ok_or(StorageError::NotInitialized)?;
        
        match self.db.get_cf(&cf, address)? {
            Some(bytes) => {
                let state: AccountState = bincode::deserialize(&bytes)?;
                Ok(Some(state))
            }
            None => Ok(None),
        }
    }

    /// Set account state.
    pub fn put_account(&self, address: &[u8; 20], state: &AccountState) -> StorageResult<()> {
        let cf = self.db.cf_handle(cf::ACCOUNTS)
            .ok_or(StorageError::NotInitialized)?;
        
        let encoded = bincode::serialize(state)?;
        self.db.put_cf(&cf, address, &encoded)?;
        
        debug!(
            address = hex::encode(address),
            nonce = state.nonce,
            balance = state.balance,
            "Account state updated"
        );
        Ok(())
    }

    /// Get account nonce (returns 0 if account doesn't exist).
    pub fn get_nonce(&self, address: &[u8; 20]) -> StorageResult<u64> {
        Ok(self.get_account(address)?.map(|a| a.nonce).unwrap_or(0))
    }

    /// Get account balance (returns 0 if account doesn't exist).
    pub fn get_balance(&self, address: &[u8; 20]) -> StorageResult<u128> {
        Ok(self.get_account(address)?.map(|a| a.balance).unwrap_or(0))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    fn test_config() -> StorageConfig {
        let dir = tempdir().unwrap();
        StorageConfig::new(dir.into_path())
    }

    #[test]
    fn test_storage_open() {
        let config = test_config();
        let storage = Storage::open(config).unwrap();
        assert_eq!(storage.version(), STORAGE_VERSION);
    }

    #[test]
    fn test_chain_tip() {
        let config = test_config();
        let storage = Storage::open(config).unwrap();

        // Initially no chain tip
        assert!(storage.chain_tip().unwrap().is_none());

        // Set chain tip
        let hash = Hash256::hash(b"test block");
        storage.set_chain_tip(&hash).unwrap();

        // Verify chain tip
        let tip = storage.chain_tip().unwrap();
        assert_eq!(tip, Some(hash));
    }

    #[test]
    fn test_account_state() {
        let config = test_config();
        let storage = Storage::open(config).unwrap();
        let state_store = storage.state();

        let address = [0u8; 20];
        
        // Initially no account
        assert!(state_store.get_account(&address).unwrap().is_none());
        assert_eq!(state_store.get_nonce(&address).unwrap(), 0);
        assert_eq!(state_store.get_balance(&address).unwrap(), 0);

        // Create account
        let state = AccountState {
            nonce: 5,
            balance: 1000,
            last_updated: 100,
        };
        state_store.put_account(&address, &state).unwrap();

        // Verify account
        let retrieved = state_store.get_account(&address).unwrap().unwrap();
        assert_eq!(retrieved.nonce, 5);
        assert_eq!(retrieved.balance, 1000);
    }
}
