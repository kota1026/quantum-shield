//! Configuration module

use serde::Deserialize;
use config::{ConfigError, Environment, File};

#[derive(Debug, Deserialize, Clone)]
pub struct Config {
    pub server: ServerConfig,
    pub database: DatabaseConfig,
    pub redis: RedisConfig,
    pub rabbitmq: RabbitMQConfig,
    pub jwt: JwtConfig,
    pub security: SecurityConfig,
    pub vrf: VRFConfig,
    // Phase 8-D: L3/L1 Integration
    /// L3 node endpoint (e.g., "http://localhost:8545")
    #[serde(default)]
    pub l3_endpoint: Option<String>,
    /// L3 chain ID (default: 31337 for local)
    #[serde(default)]
    pub l3_chain_id: Option<u64>,
    /// L1 RPC URL (e.g., "https://sepolia.infura.io/v3/...")
    #[serde(default)]
    pub l1_rpc_url: Option<String>,
    /// L1 chain ID (default: 11155111 for Sepolia)
    #[serde(default)]
    pub l1_chain_id: Option<u64>,
    /// Bridge Verifier contract address on L1
    #[serde(default)]
    pub bridge_verifier_address: Option<String>,
    /// Treasury Vault contract address on L1
    #[serde(default)]
    pub treasury_vault_address: Option<String>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct DatabaseConfig {
    pub url: String,
    #[serde(default = "default_db_max_connections")]
    pub max_connections: u32,
    #[serde(default = "default_db_min_connections")]
    pub min_connections: u32,
    #[serde(default = "default_db_acquire_timeout_secs")]
    pub acquire_timeout_secs: u64,
    #[serde(default = "default_db_idle_timeout_secs")]
    pub idle_timeout_secs: u64,
    #[serde(default = "default_db_max_lifetime_secs")]
    pub max_lifetime_secs: u64,
}

fn default_db_max_connections() -> u32 { 50 }
fn default_db_min_connections() -> u32 { 5 }
fn default_db_acquire_timeout_secs() -> u64 { 10 }
fn default_db_idle_timeout_secs() -> u64 { 600 }
fn default_db_max_lifetime_secs() -> u64 { 1800 }

impl Default for DatabaseConfig {
    fn default() -> Self {
        Self {
            url: std::env::var("DATABASE_URL")
                .unwrap_or_else(|_| "postgres://localhost/quantum_shield".to_string()),
            max_connections: 50,
            min_connections: 5,
            acquire_timeout_secs: 10,
            idle_timeout_secs: 600,
            max_lifetime_secs: 1800,
        }
    }
}

#[derive(Debug, Deserialize, Clone)]
pub struct VRFConfig {
    /// VRFConsumer contract address
    pub contract_address: String,
    /// Ethereum RPC URL
    pub rpc_url: String,
    /// VRF timeout in seconds (default: 300 = 5 minutes)
    pub timeout_seconds: u64,
    /// Polling interval in seconds for VRF status check
    pub polling_interval_seconds: u64,
}

impl Default for VRFConfig {
    fn default() -> Self {
        Self {
            contract_address: "0x0000000000000000000000000000000000000000".to_string(),
            rpc_url: "http://localhost:8545".to_string(),
            timeout_seconds: 300,  // 5 minutes per SEQUENCES §2.3
            polling_interval_seconds: 5,
        }
    }
}

#[derive(Debug, Deserialize, Clone)]
pub struct ServerConfig {
    pub host: String,
    pub port: u16,
}

#[derive(Debug, Deserialize, Clone)]
pub struct RedisConfig {
    pub url: String,
    pub password: Option<String>,  // FIX-001: Redis AUTH
}

#[derive(Debug, Deserialize, Clone)]
pub struct RabbitMQConfig {
    pub url: String,
    pub queue_name: String,
}

#[derive(Debug, Deserialize, Clone)]
pub struct JwtConfig {
    pub secret: String,
    pub expiry_hours: u64,
    /// Access token expiry in seconds (default: 3600 = 1 hour)
    #[serde(default = "default_access_token_expiry")]
    pub access_token_expiry: u64,
    /// Refresh token expiry in seconds (default: 604800 = 7 days)
    #[serde(default = "default_refresh_token_expiry")]
    pub refresh_token_expiry: u64,
}

fn default_access_token_expiry() -> u64 { 3600 }
fn default_refresh_token_expiry() -> u64 { 604800 }

#[derive(Debug, Deserialize, Clone)]
pub struct SecurityConfig {
    /// Time lock for normal unlock (hours)
    pub normal_time_lock_hours: u64,
    /// Time lock for emergency unlock (days)
    pub emergency_time_lock_days: u64,
    /// Emergency timeout (hours) - triggers emergency path
    pub emergency_timeout_hours: u64,
    /// Maximum pause duration (hours)
    pub max_pause_duration_hours: u64,
    /// Minimum emergency bond (wei)
    pub min_emergency_bond_wei: String,
    /// Emergency bond percentage (basis points, 500 = 5%)
    pub emergency_bond_bps: u64,
    /// Skip wallet signature verification (dev mode only, MUST be false in production)
    #[serde(default)]
    pub skip_signature_verification: bool,
    /// Skip TOTP verification (dev mode only, MUST be false in production)
    #[serde(default)]
    pub skip_totp_verification: bool,
}

impl Default for SecurityConfig {
    fn default() -> Self {
        Self {
            normal_time_lock_hours: 24,      // SEQ#2: 24h
            emergency_time_lock_days: 7,     // SEQ#3: 7d
            emergency_timeout_hours: 72,     // SEQ#3: 72h
            max_pause_duration_hours: 72,    // SEQ#8: 72h
            min_emergency_bond_wei: "500000000000000000".to_string(), // 0.5 ETH
            emergency_bond_bps: 500,         // 5%
            skip_signature_verification: true, // Dev default: skip. MUST be false in production!
            skip_totp_verification: true,      // Dev default: skip. MUST be false in production!
        }
    }
}

impl Config {
    pub fn load() -> Result<Self, ConfigError> {
        let run_mode = std::env::var("RUN_MODE").unwrap_or_else(|_| "development".into());

        let config = config::Config::builder()
            .add_source(File::with_name("config/default"))
            .add_source(File::with_name(&format!("config/{}", run_mode)).required(false))
            .add_source(Environment::with_prefix("QS").separator("__"))
            .build()?;

        config.try_deserialize()
    }
}

impl Default for Config {
    fn default() -> Self {
        Self {
            server: ServerConfig {
                host: "0.0.0.0".to_string(),
                port: 8080,
            },
            database: DatabaseConfig::default(),
            redis: RedisConfig {
                url: "redis://localhost:6379".to_string(),
                password: None,
            },
            rabbitmq: RabbitMQConfig {
                url: "amqp://localhost:5672".to_string(),
                queue_name: "sig_queue".to_string(),
            },
            jwt: JwtConfig {
                secret: "development-secret-change-in-production".to_string(),
                expiry_hours: 24,
                access_token_expiry: 3600,      // 1 hour
                refresh_token_expiry: 604800,   // 7 days
            },
            security: SecurityConfig::default(),
            vrf: VRFConfig::default(),
            // Phase 8-D: L3/L1 defaults (None = not configured)
            l3_endpoint: None,
            l3_chain_id: None,
            l1_rpc_url: None,
            l1_chain_id: None,
            bridge_verifier_address: None,
            treasury_vault_address: None,
        }
    }
}
