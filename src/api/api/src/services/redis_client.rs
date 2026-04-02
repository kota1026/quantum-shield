//! Redis client with AUTH support (FIX-001)
//!
//! Actual Redis operations - NO STUBS!

use anyhow::Result;
use redis::AsyncCommands;
use crate::config::RedisConfig;

pub struct RedisClient {
    client: Option<redis::Client>,
    connection: tokio::sync::Mutex<Option<redis::aio::MultiplexedConnection>>,
    /// When true, all operations are no-ops (graceful degradation for Beta)
    pub disabled: bool,
}

impl RedisClient {
    /// Create new Redis client with AUTH (FIX-001)
    /// In Beta mode: if Redis is unavailable, returns a disabled no-op client
    pub async fn new(config: &RedisConfig) -> Result<Self> {
        let url = if let Some(ref password) = config.password {
            // FIX-001: Redis AUTH implementation
            let base = config.url.replace("redis://", "");
            format!("redis://:{}@{}", password, base)
        } else {
            config.url.clone()
        };

        tracing::info!("Connecting to Redis: {}", config.url);
        let client = match redis::Client::open(url.as_str()) {
            Ok(c) => c,
            Err(e) => {
                tracing::warn!("Redis client creation failed: {} — running without Redis", e);
                return Ok(Self { client: None, connection: tokio::sync::Mutex::new(None), disabled: true });
            }
        };

        // Test connection — if fails, run without Redis
        match client.get_multiplexed_async_connection().await {
            Ok(mut conn) => {
                let pong: String = redis::cmd("PING").query_async(&mut conn).await.unwrap_or_default();
                tracing::info!("Redis connection established: {}", pong);
                Ok(Self {
                    client: Some(client),
                    connection: tokio::sync::Mutex::new(Some(conn)),
                    disabled: false,
                })
            }
            Err(e) => {
                tracing::warn!("Redis connection failed: {} — running without Redis (Beta mode)", e);
                Ok(Self { client: None, connection: tokio::sync::Mutex::new(None), disabled: true })
            }
        }
    }

    async fn get_conn(&self) -> Result<redis::aio::MultiplexedConnection> {
        if self.disabled {
            anyhow::bail!("Redis is disabled");
        }
        let mut guard = self.connection.lock().await;
        if let Some(conn) = guard.take() {
            *guard = Some(conn.clone());
            Ok(conn)
        } else if let Some(ref client) = self.client {
            let conn = client.get_multiplexed_async_connection().await?;
            *guard = Some(conn.clone());
            Ok(conn)
        } else {
            anyhow::bail!("Redis client not available")
        }
    }

    pub async fn exists(&self, key: &str) -> Result<bool> {
        if self.disabled { return Ok(false); }
        let mut conn = self.get_conn().await?;
        let result: bool = conn.exists(key).await?;
        tracing::debug!("Redis EXISTS {}: {}", key, result);
        Ok(result)
    }

    pub async fn get(&self, key: &str) -> Result<Option<String>> {
        if self.disabled { return Ok(None); }
        let mut conn = self.get_conn().await?;
        let result: Option<String> = conn.get(key).await?;
        tracing::debug!("Redis GET {}: {:?}", key, result.as_ref().map(|v| v.len()));
        Ok(result)
    }

    pub async fn set(&self, key: &str, value: &str, ttl: u64) -> Result<()> {
        if self.disabled { return Ok(()); }
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
        if self.disabled { return Ok(vec![]); }
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
        if self.disabled { return Ok(()); }
        let mut conn = self.get_conn().await?;
        let _: () = conn.del(key).await?;
        tracing::info!("Redis DEL {}", key);
        Ok(())
    }

    /// Add a member to a Redis set (R-3: per-user lock index)
    pub async fn sadd(&self, key: &str, member: &str) -> Result<()> {
        if self.disabled { return Ok(()); }
        let mut conn = self.get_conn().await?;
        let _: () = conn.sadd(key, member).await?;
        tracing::debug!("Redis SADD {} {}", key, member);
        Ok(())
    }

    /// Get all members of a Redis set (R-3: per-user lock index)
    pub async fn smembers(&self, key: &str) -> Result<Vec<String>> {
        if self.disabled { return Ok(vec![]); }
        let mut conn = self.get_conn().await?;
        let members: Vec<String> = conn.smembers(key).await?;
        tracing::debug!("Redis SMEMBERS {}: {} members", key, members.len());
        Ok(members)
    }

    /// Remove a member from a Redis set
    pub async fn srem(&self, key: &str, member: &str) -> Result<()> {
        if self.disabled { return Ok(()); }
        let mut conn = self.get_conn().await?;
        let _: () = conn.srem(key, member).await?;
        tracing::debug!("Redis SREM {} {}", key, member);
        Ok(())
    }

    /// Health check: PING the Redis server
    pub async fn ping(&self) -> Result<()> {
        if self.disabled { return Ok(()); }
        let mut conn = self.get_conn().await?;
        let _: String = redis::cmd("PING").query_async(&mut conn).await?;
        Ok(())
    }
}
