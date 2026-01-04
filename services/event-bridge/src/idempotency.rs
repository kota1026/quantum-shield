//! Idempotency Manager
//!
//! Ensures each event is processed exactly once using:
//! - In-memory cache for hot path
//! - Redis for distributed deduplication
//! - 30-day retention for processed event IDs

use crate::config::RedisConfig;
use crate::error::Result;
use alloy::hex;
use redis::{AsyncCommands, Client};
use std::collections::HashSet;
use std::sync::RwLock;
use tracing::debug;

/// Idempotency key manager
pub struct IdempotencyManager {
    client: Client,
    /// In-memory cache for fast lookups
    local_cache: RwLock<HashSet<[u8; 32]>>,
    /// TTL for processed event keys (30 days)
    ttl_seconds: u64,
}

impl IdempotencyManager {
    /// Create new idempotency manager
    pub fn new(config: &RedisConfig) -> Result<Self> {
        let client = Client::open(config.url.as_str())?;
        Ok(Self {
            client,
            local_cache: RwLock::new(HashSet::new()),
            ttl_seconds: 86400 * 30, // 30 days
        })
    }

    /// Check if event has been processed
    pub async fn is_processed(&self, event_id: &[u8; 32]) -> Result<bool> {
        // Check local cache first
        {
            let cache = self.local_cache.read().unwrap();
            if cache.contains(event_id) {
                debug!("Event found in local cache");
                return Ok(true);
            }
        }

        // Check Redis
        let mut conn = self.client.get_multiplexed_async_connection().await?;
        let key = format!("event:{}", hex::encode(event_id));
        let exists: bool = conn.exists(&key).await?;

        if exists {
            // Add to local cache
            let mut cache = self.local_cache.write().unwrap();
            cache.insert(*event_id);
            debug!("Event found in Redis, added to local cache");
        }

        Ok(exists)
    }

    /// Mark event as processed
    pub async fn mark_processed(&self, event_id: &[u8; 32]) -> Result<()> {
        // Add to local cache
        {
            let mut cache = self.local_cache.write().unwrap();
            cache.insert(*event_id);
        }

        // Add to Redis with TTL
        let mut conn = self.client.get_multiplexed_async_connection().await?;
        let key = format!("event:{}", hex::encode(event_id));
        
        let _: () = redis::cmd("SET")
            .arg(&key)
            .arg("1")
            .arg("EX")
            .arg(self.ttl_seconds)
            .query_async(&mut conn)
            .await?;

        debug!("Event marked as processed: {}", key);
        Ok(())
    }

    /// Clear local cache (for testing)
    #[cfg(test)]
    pub fn clear_local_cache(&self) {
        let mut cache = self.local_cache.write().unwrap();
        cache.clear();
    }
}
