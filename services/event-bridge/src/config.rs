//! Configuration module for Event Bridge

use serde::Deserialize;
use std::time::Duration;

/// Event Bridge Configuration
#[derive(Debug, Clone, Deserialize)]
pub struct Config {
    pub l1: L1Config,
    pub l3: L3Config,
    pub redis: RedisConfig,
    pub retry: RetryConfig,
    pub security: SecurityConfig,
}

/// L1 (Ethereum Sepolia) Configuration
#[derive(Debug, Clone, Deserialize)]
pub struct L1Config {
    /// WebSocket RPC URL
    pub ws_rpc_url: String,
    /// HTTP RPC URL (fallback)
    pub http_rpc_url: String,
    /// L1Vault contract address
    pub vault_contract: String,
    /// Number of confirmations required (reorg protection)
    #[serde(default = "default_confirmation_blocks")]
    pub confirmation_blocks: u64,
}

/// L3 (Aegis Chain) Configuration
#[derive(Debug, Clone, Deserialize)]
pub struct L3Config {
    /// RPC URL
    pub rpc_url: String,
    /// State contract address
    pub state_contract: String,
}

/// Redis Configuration
#[derive(Debug, Clone, Deserialize)]
pub struct RedisConfig {
    pub url: String,
    pub l1_events_stream: String,
    pub l3_events_stream: String,
    pub consumer_group: String,
}

/// Retry Policy Configuration
#[derive(Debug, Clone, Deserialize)]
pub struct RetryConfig {
    #[serde(default = "default_max_attempts")]
    pub max_attempts: u32,
    #[serde(default = "default_initial_delay_ms")]
    pub initial_delay_ms: u64,
    #[serde(default = "default_max_delay_ms")]
    pub max_delay_ms: u64,
    #[serde(default = "default_backoff_multiplier")]
    pub backoff_multiplier: f64,
}

/// Security Configuration
#[derive(Debug, Clone, Deserialize)]
pub struct SecurityConfig {
    /// Rate limit: events per second
    #[serde(default = "default_rate_limit")]
    pub rate_limit_per_second: u32,
    /// Enable mTLS for HSM communication
    #[serde(default = "default_mtls")]
    pub mtls_enabled: bool,
    /// HSM endpoint URL
    pub hsm_endpoint: Option<String>,
}

// Default values
fn default_confirmation_blocks() -> u64 { 12 }  // 12 blocks for reorg protection
fn default_max_attempts() -> u32 { 10 }
fn default_initial_delay_ms() -> u64 { 1000 }
fn default_max_delay_ms() -> u64 { 300000 }  // 5 minutes
fn default_backoff_multiplier() -> f64 { 2.0 }
fn default_rate_limit() -> u32 { 100 }
fn default_mtls() -> bool { true }

impl Config {
    /// Load configuration from environment and files
    pub fn load() -> crate::Result<Self> {
        let config = config::Config::builder()
            .add_source(config::File::with_name("config/event_bridge").required(false))
            .add_source(config::Environment::with_prefix("EVENT_BRIDGE").separator("__"))
            .build()?;

        let config: Config = config.try_deserialize()?;
        Ok(config)
    }
}

impl Default for RetryConfig {
    fn default() -> Self {
        Self {
            max_attempts: default_max_attempts(),
            initial_delay_ms: default_initial_delay_ms(),
            max_delay_ms: default_max_delay_ms(),
            backoff_multiplier: default_backoff_multiplier(),
        }
    }
}

impl RetryConfig {
    pub fn initial_delay(&self) -> Duration {
        Duration::from_millis(self.initial_delay_ms)
    }

    pub fn max_delay(&self) -> Duration {
        Duration::from_millis(self.max_delay_ms)
    }
}
