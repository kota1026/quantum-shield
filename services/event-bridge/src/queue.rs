//! Redis Streams Message Queue
//!
//! Implements:
//! - Event buffering between components
//! - Consumer groups for distributed processing
//! - Primary lock for relayer coordination

use crate::config::RedisConfig;
use crate::error::Result;
use crate::events::BridgeEvent;
use redis::{AsyncCommands, Client};
use tracing::debug;

/// Redis Streams based event queue
pub struct EventQueue {
    client: Client,
    config: RedisConfig,
}

impl EventQueue {
    /// Create new event queue
    pub fn new(config: &RedisConfig) -> Result<Self> {
        let client = Client::open(config.url.as_str())?;
        Ok(Self {
            client,
            config: config.clone(),
        })
    }

    /// Enqueue event for L3 sync
    pub async fn enqueue_l3_sync(&self, event: &BridgeEvent) -> Result<String> {
        let mut conn = self.client.get_multiplexed_async_connection().await?;
        
        let event_json = serde_json::to_string(event)?;
        let stream = &self.config.l1_events_stream;
        
        let id: String = redis::cmd("XADD")
            .arg(stream)
            .arg("*")
            .arg("type")
            .arg(event.event_type())
            .arg("data")
            .arg(&event_json)
            .query_async(&mut conn)
            .await?;

        debug!("Enqueued event {} to stream {}", id, stream);
        Ok(id)
    }

    /// Enqueue event for L1 relay
    pub async fn enqueue_l1_relay(&self, event: &BridgeEvent) -> Result<String> {
        let mut conn = self.client.get_multiplexed_async_connection().await?;
        
        let event_json = serde_json::to_string(event)?;
        let stream = &self.config.l3_events_stream;
        
        let id: String = redis::cmd("XADD")
            .arg(stream)
            .arg("*")
            .arg("type")
            .arg(event.event_type())
            .arg("data")
            .arg(&event_json)
            .query_async(&mut conn)
            .await?;

        debug!("Enqueued event {} to stream {}", id, stream);
        Ok(id)
    }

    /// Dequeue events for L1 relay (used by relayer)
    pub async fn dequeue_l1_relay(&self, count: usize) -> Result<Vec<BridgeEvent>> {
        let mut conn = self.client.get_multiplexed_async_connection().await?;
        
        // Use XREADGROUP for consumer group semantics
        let _results: Vec<redis::Value> = redis::cmd("XREADGROUP")
            .arg("GROUP")
            .arg(&self.config.consumer_group)
            .arg("relayer-1")
            .arg("COUNT")
            .arg(count)
            .arg("BLOCK")
            .arg(5000) // 5 second block
            .arg("STREAMS")
            .arg(&self.config.l3_events_stream)
            .arg(">")
            .query_async(&mut conn)
            .await?;

        // Parse results (simplified - production would handle properly)
        Ok(vec![])
    }

    /// Try to acquire primary relayer lock
    pub async fn try_acquire_primary_lock(&self) -> Result<bool> {
        let mut conn = self.client.get_multiplexed_async_connection().await?;
        
        // Use SET NX EX for distributed lock
        let result: Option<String> = redis::cmd("SET")
            .arg("event_bridge:primary_lock")
            .arg("1")
            .arg("NX")
            .arg("EX")
            .arg(30) // 30 second TTL
            .query_async(&mut conn)
            .await?;

        Ok(result.is_some())
    }

    /// Renew primary relayer lock
    pub async fn renew_primary_lock(&self) -> Result<()> {
        let mut conn = self.client.get_multiplexed_async_connection().await?;
        
        let _: () = redis::cmd("EXPIRE")
            .arg("event_bridge:primary_lock")
            .arg(30)
            .query_async(&mut conn)
            .await?;

        Ok(())
    }

    /// Check if primary relayer is alive
    pub async fn is_primary_alive(&self) -> Result<bool> {
        let mut conn = self.client.get_multiplexed_async_connection().await?;
        
        let exists: bool = conn.exists("event_bridge:primary_lock").await?;
        Ok(exists)
    }

    /// Acknowledge processed event
    pub async fn ack(&self, stream: &str, id: &str) -> Result<()> {
        let mut conn = self.client.get_multiplexed_async_connection().await?;
        
        let _: () = redis::cmd("XACK")
            .arg(stream)
            .arg(&self.config.consumer_group)
            .arg(id)
            .query_async(&mut conn)
            .await?;

        Ok(())
    }
}
