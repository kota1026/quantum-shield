//! Redis client with AUTH support (FIX-001)
//!
//! Actual Redis operations - NO STUBS!

use anyhow::Result;
use redis::AsyncCommands;
use crate::config::RedisConfig;

pub struct RedisClient {
    client: redis::Client,
    connection: tokio::sync::Mutex<Option<redis::aio::MultiplexedConnection>>,
}

impl RedisClient {
    /// Create new Redis client with AUTH (FIX-001)
    pub async fn new(config: &RedisConfig) -> Result<Self> {
        let url = if let Some(ref password) = config.password {
            // FIX-001: Redis AUTH implementation
            let base = config.url.replace("redis://", "");
            format!("redis://:{}@{}", password, base)
        } else {
            config.url.clone()
        };

        tracing::info!("Connecting to Redis: {}", config.url);
        let client = redis::Client::open(url.as_str())?;

        // Test connection
        let mut conn = client.get_multiplexed_async_connection().await?;
        let pong: String = redis::cmd("PING").query_async(&mut conn).await?;
        tracing::info!("Redis connection established: {}", pong);

        Ok(Self {
            client,
            connection: tokio::sync::Mutex::new(Some(conn)),
        })
    }

    async fn get_conn(&self) -> Result<redis::aio::MultiplexedConnection> {
        let mut guard = self.connection.lock().await;
        if let Some(conn) = guard.take() {
            *guard = Some(conn.clone());
            Ok(conn)
        } else {
            let conn = self.client.get_multiplexed_async_connection().await?;
            *guard = Some(conn.clone());
            Ok(conn)
        }
    }

    pub async fn exists(&self, key: &str) -> Result<bool> {
        let mut conn = self.get_conn().await?;
        let result: bool = conn.exists(key).await?;
        tracing::debug!("Redis EXISTS {}: {}", key, result);
        Ok(result)
    }

    pub async fn get(&self, key: &str) -> Result<Option<String>> {
        let mut conn = self.get_conn().await?;
        let result: Option<String> = conn.get(key).await?;
        tracing::debug!("Redis GET {}: {:?}", key, result.as_ref().map(|v| v.len()));
        Ok(result)
    }

    pub async fn set(&self, key: &str, value: &str, ttl: u64) -> Result<()> {
        let mut conn = self.get_conn().await?;
        if ttl > 0 {
            let _: () = conn.set_ex(key, value, ttl).await?;
        } else {
            let _: () = conn.set(key, value).await?;
        }
        tracing::info!("Redis SET {} (ttl={}s, len={})", key, ttl, value.len());
        Ok(())
    }

    /// Scan for keys matching a pattern (TASK-P5-020)
    pub async fn scan(&self, pattern: &str) -> Result<Vec<String>> {
        let mut conn = self.get_conn().await?;
        let keys: Vec<String> = redis::cmd("KEYS")
            .arg(pattern)
            .query_async(&mut conn)
            .await?;
        tracing::debug!("Redis SCAN {}: {} keys found", pattern, keys.len());
        Ok(keys)
    }

    /// Delete a key (TASK-P5-031)
    pub async fn del(&self, key: &str) -> Result<()> {
        let mut conn = self.get_conn().await?;
        let _: () = conn.del(key).await?;
        tracing::info!("Redis DEL {}", key);
        Ok(())
    }
}
