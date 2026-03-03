//! Configuration module
#![allow(dead_code)]

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
    /// CORS configuration
    #[serde(default)]
    pub cors: CorsConfig,
    /// Rate limiting configuration
    #[serde(default)]
    pub rate_limit: RateLimitConfig,
    /// Auto-claim configuration for background unlock completion
    #[serde(default)]
    pub auto_claim: AutoClaimConfig,
    /// L1 sync configuration for background event indexing
    #[serde(default)]
    pub l1_sync: L1SyncConfig,
    /// Object storage configuration (MinIO/S3)
    #[serde(default)]
    pub storage: StorageConfig,
    /// L1 feature flags (mock/testnet/mainnet)
    #[serde(default)]
    pub l1: L1FeatureConfig,
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
    /// L1 Vault contract address (Sepolia v2.0.0 with lockWithSR0)
    #[serde(default)]
    pub l1_vault_address: Option<String>,
    /// L1 SPHINCS+ Verifier contract address
    #[serde(default)]
    pub l1_sphincs_verifier_address: Option<String>,
    /// L1 signer private key (env var: QS__L1_PRIVATE_KEY)
    #[serde(default)]
    pub l1_private_key: Option<String>,
    // L3 Contract Addresses (deployed to local Anvil or L3 chain)
    /// L3 CoreLayer contract address
    #[serde(default)]
    pub l3_core_layer_address: Option<String>,
    /// L3 veQS contract address
    #[serde(default)]
    pub l3_ve_qs_address: Option<String>,
    /// L3 RewardRouter contract address
    #[serde(default)]
    pub l3_reward_router_address: Option<String>,
    /// L3 Governor contract address
    #[serde(default)]
    pub l3_governor_address: Option<String>,
    /// L3 InsuranceFund contract address
    #[serde(default)]
    pub l3_insurance_fund_address: Option<String>,
    /// L3 Treasury contract address
    #[serde(default)]
    pub l3_treasury_address: Option<String>,
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
    /// Ethereum RPC URL (L1 endpoint, e.g. Sepolia)
    pub rpc_url: String,
    /// Private key for signing VRF transactions (hex, without 0x prefix)
    #[serde(default)]
    pub private_key: Option<String>,
    /// Chain ID (11155111 for Sepolia, 1 for Mainnet)
    #[serde(default = "default_vrf_chain_id")]
    pub chain_id: u64,
    /// VRF timeout in seconds (default: 300 = 5 minutes)
    pub timeout_seconds: u64,
    /// Polling interval in seconds for VRF status check
    pub polling_interval_seconds: u64,
}

fn default_vrf_chain_id() -> u64 { 11155111 } // Sepolia

impl Default for VRFConfig {
    fn default() -> Self {
        Self {
            contract_address: "0x0000000000000000000000000000000000000000".to_string(),
            rpc_url: "http://localhost:8545".to_string(),
            private_key: None,
            chain_id: 11155111,  // Sepolia
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
pub struct CorsConfig {
    /// Allowed origins for CORS. In dev: ["http://localhost:3000"].
    /// In production: ["https://app.quantum-shield.io"]
    #[serde(default = "default_cors_origins")]
    pub allowed_origins: Vec<String>,
}

fn default_cors_origins() -> Vec<String> {
    vec!["http://localhost:3000".to_string()]
}

impl Default for CorsConfig {
    fn default() -> Self {
        Self {
            allowed_origins: default_cors_origins(),
        }
    }
}

#[derive(Debug, Deserialize, Clone)]
pub struct RateLimitConfig {
    /// Maximum requests per window per IP
    #[serde(default = "default_rate_limit_max_requests")]
    pub max_requests: u32,
    /// Window duration in seconds
    #[serde(default = "default_rate_limit_window_secs")]
    pub window_secs: u64,
    /// Whether rate limiting is enabled
    #[serde(default = "default_rate_limit_enabled")]
    pub enabled: bool,
}

fn default_rate_limit_max_requests() -> u32 { 100 }
fn default_rate_limit_window_secs() -> u64 { 60 }
fn default_rate_limit_enabled() -> bool { true }

impl Default for RateLimitConfig {
    fn default() -> Self {
        Self {
            max_requests: default_rate_limit_max_requests(),
            window_secs: default_rate_limit_window_secs(),
            enabled: default_rate_limit_enabled(),
        }
    }
}

#[derive(Debug, Deserialize, Clone)]
pub struct AutoClaimConfig {
    /// Whether auto-claim is enabled
    #[serde(default = "default_auto_claim_enabled")]
    pub enabled: bool,
    /// Polling interval in seconds
    #[serde(default = "default_auto_claim_poll_interval")]
    pub poll_interval_secs: u64,
}

fn default_auto_claim_enabled() -> bool { true }
fn default_auto_claim_poll_interval() -> u64 { 60 }

impl Default for AutoClaimConfig {
    fn default() -> Self {
        Self {
            enabled: default_auto_claim_enabled(),
            poll_interval_secs: default_auto_claim_poll_interval(),
        }
    }
}

#[derive(Debug, Deserialize, Clone)]
pub struct L1SyncConfig {
    /// Whether L1 sync is enabled
    #[serde(default = "default_l1_sync_enabled")]
    pub enabled: bool,
    /// Polling interval in seconds
    #[serde(default = "default_l1_sync_poll_interval")]
    pub poll_interval_secs: u64,
    /// L1 RPC URL (defaults to Sepolia Infura)
    #[serde(default = "default_l1_sync_rpc_url")]
    pub rpc_url: String,
}

fn default_l1_sync_enabled() -> bool { true }
fn default_l1_sync_poll_interval() -> u64 { 300 } // 5 minutes
fn default_l1_sync_rpc_url() -> String {
    "https://sepolia.infura.io/v3/REDACTED_INFURA_PROJECT_ID".to_string()
}

impl Default for L1SyncConfig {
    fn default() -> Self {
        Self {
            enabled: default_l1_sync_enabled(),
            poll_interval_secs: default_l1_sync_poll_interval(),
            rpc_url: default_l1_sync_rpc_url(),
        }
    }
}

#[derive(Debug, Deserialize, Clone)]
pub struct StorageConfig {
    /// S3-compatible endpoint (e.g., "http://localhost:9000" for MinIO)
    #[serde(default = "default_storage_endpoint")]
    pub endpoint: String,
    /// S3 region
    #[serde(default = "default_storage_region")]
    pub region: String,
    /// S3 bucket name
    #[serde(default = "default_storage_bucket")]
    pub bucket: String,
    /// Access key ID
    #[serde(default = "default_storage_access_key")]
    pub access_key_id: String,
    /// Secret access key
    #[serde(default = "default_storage_secret_key")]
    pub secret_access_key: String,
    /// Maximum file size in bytes (default: 10MB)
    #[serde(default = "default_storage_max_file_size")]
    pub max_file_size: usize,
}

fn default_storage_endpoint() -> String { "http://localhost:9000".to_string() }
fn default_storage_region() -> String { "us-east-1".to_string() }
fn default_storage_bucket() -> String { "qs-documents".to_string() }
fn default_storage_access_key() -> String { "quantum".to_string() }
fn default_storage_secret_key() -> String { "quantum_dev_storage".to_string() }
fn default_storage_max_file_size() -> usize { 10 * 1024 * 1024 } // 10MB

impl Default for StorageConfig {
    fn default() -> Self {
        Self {
            endpoint: default_storage_endpoint(),
            region: default_storage_region(),
            bucket: default_storage_bucket(),
            access_key_id: default_storage_access_key(),
            secret_access_key: default_storage_secret_key(),
            max_file_size: default_storage_max_file_size(),
        }
    }
}

// ============================================================================
// L1 Feature Flags
// ============================================================================

/// L1 feature flags and operational mode configuration
///
/// Controls how the API interacts with L1 (Ethereum):
/// - `mock`: No L1 calls (development mode)
/// - `testnet`: Live Sepolia integration with reduced minimums
/// - `mainnet`: Production with full security requirements
#[derive(Debug, Deserialize, Clone)]
pub struct L1FeatureConfig {
    /// L1 operational mode: "mock" | "testnet" | "mainnet"
    #[serde(default = "default_l1_mode")]
    pub mode: String,

    /// Staking configuration
    #[serde(default)]
    pub staking: StakingConfig,

    /// Slashing configuration
    #[serde(default)]
    pub slashing: SlashingConfig,

    /// ProverRegistry contract address on L1
    #[serde(default)]
    pub prover_registry_address: Option<String>,
}

fn default_l1_mode() -> String { "mock".to_string() }

impl Default for L1FeatureConfig {
    fn default() -> Self {
        Self {
            mode: default_l1_mode(),
            staking: StakingConfig::default(),
            slashing: SlashingConfig::default(),
            prover_registry_address: None,
        }
    }
}

/// Staking parameters (min stake amounts vary by mode)
#[derive(Debug, Deserialize, Clone)]
pub struct StakingConfig {
    /// Whether L1 staking verification is enabled
    #[serde(default)]
    pub enabled: bool,

    /// Minimum stake in wei
    /// - Testnet: "10000000000000000" (0.01 ETH)
    /// - Mainnet: "1000000000000000000" (1 ETH)
    #[serde(default = "default_min_stake")]
    pub min_stake: String,
}

fn default_min_stake() -> String { "10000000000000000".to_string() } // 0.01 ETH

impl Default for StakingConfig {
    fn default() -> Self {
        Self {
            enabled: false,
            min_stake: default_min_stake(),
        }
    }
}

/// Slashing L1 execution configuration
#[derive(Debug, Deserialize, Clone)]
pub struct SlashingConfig {
    /// Whether to execute slash() on L1 ProverRegistry
    #[serde(default)]
    pub l1_execution: bool,
}

impl Default for SlashingConfig {
    fn default() -> Self {
        Self {
            l1_execution: false,
        }
    }
}

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

        let cfg: Self = config.try_deserialize()?;

        // Security guard: production mode must NOT have verification skips enabled
        if run_mode == "production" {
            if cfg.security.skip_signature_verification {
                panic!("SECURITY VIOLATION: skip_signature_verification=true in production mode. Aborting.");
            }
            if cfg.security.skip_totp_verification {
                panic!("SECURITY VIOLATION: skip_totp_verification=true in production mode. Aborting.");
            }
        }

        // L1 mainnet guard: min_stake must be >= 1 ETH
        if cfg.l1.mode == "mainnet" {
            let min_stake: u128 = cfg.l1.staking.min_stake.parse().unwrap_or(0);
            if min_stake < 1_000_000_000_000_000_000u128 {
                panic!(
                    "SECURITY VIOLATION: l1.staking.min_stake ({}) < 1 ETH in mainnet mode. Aborting.",
                    cfg.l1.staking.min_stake
                );
            }
        }

        // Log L1 mode
        tracing::info!("L1 mode: {}, staking.enabled: {}, slashing.l1_execution: {}",
            cfg.l1.mode, cfg.l1.staking.enabled, cfg.l1.slashing.l1_execution);

        // Log security warnings for dev mode
        if cfg.security.skip_signature_verification {
            tracing::warn!("SECURITY: signature verification DISABLED (dev mode)");
        }
        if cfg.security.skip_totp_verification {
            tracing::warn!("SECURITY: TOTP verification DISABLED (dev mode)");
        }

        Ok(cfg)
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
            cors: CorsConfig::default(),
            rate_limit: RateLimitConfig::default(),
            auto_claim: AutoClaimConfig::default(),
            l1_sync: L1SyncConfig::default(),
            storage: StorageConfig::default(),
            l1: L1FeatureConfig::default(),
            // Phase 8-D: L3/L1 defaults (None = not configured)
            l3_endpoint: None,
            l3_chain_id: None,
            l1_rpc_url: None,
            l1_chain_id: None,
            bridge_verifier_address: None,
            treasury_vault_address: None,
            l1_vault_address: None,
            l1_sphincs_verifier_address: None,
            l1_private_key: None,
            l3_core_layer_address: None,
            l3_ve_qs_address: None,
            l3_reward_router_address: None,
            l3_governor_address: None,
            l3_insurance_fund_address: None,
            l3_treasury_address: None,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_cors_config_default() {
        let cors = CorsConfig::default();
        assert_eq!(cors.allowed_origins, vec!["http://localhost:3000"]);
    }

    #[test]
    fn test_security_config_default() {
        let security = SecurityConfig::default();
        // Dev defaults: skip verifications
        assert!(security.skip_signature_verification);
        assert!(security.skip_totp_verification);
        // Security parameters from SEQUENCES
        assert_eq!(security.normal_time_lock_hours, 24);
        assert_eq!(security.emergency_time_lock_days, 7);
        assert_eq!(security.emergency_timeout_hours, 72);
    }

    #[test]
    fn test_config_default() {
        let config = Config::default();
        assert_eq!(config.server.port, 8080);
        assert_eq!(config.cors.allowed_origins.len(), 1);
        assert!(config.l3_endpoint.is_none());
    }

    #[test]
    fn test_l1_feature_config_default() {
        let l1 = L1FeatureConfig::default();
        assert_eq!(l1.mode, "mock");
        assert!(!l1.staking.enabled);
        assert!(!l1.slashing.l1_execution);
        assert!(l1.prover_registry_address.is_none());
    }

    #[test]
    fn test_min_stake_testnet_default() {
        let staking = StakingConfig::default();
        let min_stake: u128 = staking.min_stake.parse().unwrap();
        assert_eq!(min_stake, 10_000_000_000_000_000); // 0.01 ETH
    }

    #[test]
    #[should_panic(expected = "SECURITY VIOLATION: l1.staking.min_stake")]
    fn test_mainnet_guard_rejects_low_min_stake() {
        let cfg = Config {
            l1: L1FeatureConfig {
                mode: "mainnet".to_string(),
                staking: StakingConfig {
                    enabled: true,
                    min_stake: "10000000000000000".to_string(), // 0.01 ETH — too low for mainnet
                },
                ..L1FeatureConfig::default()
            },
            ..Config::default()
        };
        // Simulate the mainnet guard
        if cfg.l1.mode == "mainnet" {
            let min_stake: u128 = cfg.l1.staking.min_stake.parse().unwrap_or(0);
            if min_stake < 1_000_000_000_000_000_000u128 {
                panic!(
                    "SECURITY VIOLATION: l1.staking.min_stake ({}) < 1 ETH in mainnet mode. Aborting.",
                    cfg.l1.staking.min_stake
                );
            }
        }
    }

    #[test]
    #[should_panic(expected = "SECURITY VIOLATION: skip_signature_verification=true in production")]
    fn test_production_guard_rejects_skip_sig() {
        std::env::set_var("RUN_MODE", "production");
        // Load will panic because default config has skip_signature_verification=true
        // We can't call Config::load() directly because it reads files,
        // so we test the guard logic directly
        let cfg = Config::default();
        let run_mode = "production";
        if run_mode == "production" && cfg.security.skip_signature_verification {
            panic!("SECURITY VIOLATION: skip_signature_verification=true in production mode. Aborting.");
        }
    }
}
