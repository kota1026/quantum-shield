//! Services module
//!
//! This module provides the core services for the Quantum Shield API:
//! - Database: PostgreSQL connection pool (Phase 8-C)
//! - RedisClient: State storage and caching
//! - RabbitMQClient: Message queue for async processing
//! - HsmClient: Hardware Security Module integration
//! - VRFService: Chainlink VRF integration (SEQUENCES §2.3-§2.4)
//! - SphincsService: SPHINCS+-128s signature validation (CP-1)
//! - L3Client: L3 node connectivity for admin operations (Phase 8-D)
//! - L1Client: Ethereum Sepolia connectivity (Phase 8-D)

mod redis_client;
mod rabbitmq_client;
mod hsm_client;
mod vrf_service;
mod sphincs_service;
pub mod smt_service;
pub mod auth_service;
pub mod l3_client;
pub mod l1_client;
pub mod l1_vault;
pub mod admin_l3_ops;
pub mod bridge_verifier;
pub mod treasury_vault;
pub mod l3_l1_bridge;
pub mod l1_indexer;
pub mod slashing;
pub mod l1_prover_registry;
pub mod l3_contracts;
pub mod auto_claim;
pub mod sr1_calculator;
pub mod l1_sync_service;
pub mod storage;

use anyhow::Result;
use bigdecimal::BigDecimal;
use ethers::prelude::Address;
use sha3::{Digest, Sha3_256};
use sqlx::PgPool;
use std::str::FromStr;

use crate::{
    config::Config,
    db::Database,
    error::ApiError,
    types::{
        Lock, LockRequest, LockStatus, Edition,
        ProverRegisterRequest, ProverInfoResponse, ProverStatus,
        ChallengeInfo, ChallengeStatus,
        VRFRequest, VRFStatus,
        // Token Hub types (TASK-P5-021)
        LockPosition, HistoricalLock, DelegateInfo, MyDelegation,
        TokenHubRewardsResponse, RewardHistory,
        // Prover Portal types (TASK-P5-022)
        ProverDashboard, SigningQueueItem, SigningQueueResponse, QueueItemStatus,
        ProverSignRequest, ProverSignResponse, ProverMetrics,
        ProverAlert, ProverAlertsResponse,
        ProverChallengeItem, ProverChallengesResponse,
        ProverChallengeResponseRequest, ProverChallengeResponseResult,
        ProverExitRequest, ProverExitResponse,
        // Prover Exit types (TASK-P5-031 - SEQUENCES §6)
        ProverExitStatusResponse, ProverWithdrawRequest, ProverWithdrawResponse,
    },
    // Note: Governance types are in routes::governance and handlers there implement logic directly
};

pub use redis_client::RedisClient;
pub use rabbitmq_client::RabbitMQClient;
pub use hsm_client::HsmClient;
pub use vrf_service::VRFService;
pub use sphincs_service::{SphincsService, SPHINCS_PUBLIC_KEY_BYTES};
pub use auth_service::AuthService;
pub use l3_client::{L3Client, L3Config};
pub use l1_client::{L1Client, L1Config, SEPOLIA_CHAIN_ID};
pub use smt_service::SmtService;
pub use l1_vault::L1VaultService;
pub use slashing::SlashingService;
pub use l1_prover_registry::L1ProverRegistryService;
pub use l3_contracts::{L3Contracts, L3ContractAddresses};
pub use auto_claim::AutoClaimService;
pub use l1_sync_service::L1SyncService;
pub use storage::{StorageService, StorageError};

/// Application state shared across handlers
pub struct AppState {
    pub config: Config,
    /// PostgreSQL database connection pool (Phase 8-C)
    pub db: Database,
    pub redis: RedisClient,
    pub rabbitmq: RabbitMQClient,
    pub hsm: HsmClient,
    /// VRF Service for Chainlink VRF integration (SEQUENCES §2.3-§2.4)
    pub vrf: VRFService,
    /// SMT Service for Sparse Merkle Tree operations (L3 state management)
    pub smt: SmtService,
    /// Authentication service for SIWE/JWT (TASK-P5-012)
    pub auth_service: AuthService,
    /// L3 Client for admin operations (Phase 8-D)
    pub l3_client: Option<L3Client>,
    /// L1 Client for Sepolia operations (Phase 8-D)
    pub l1_client: Option<L1Client>,
    /// L1 Vault Service for Lock/Unlock operations (Phase 1)
    pub l1_vault: Option<L1VaultService>,
    /// L1 ProverRegistry Service for slash/exit on L1 (Feature Flag controlled)
    pub l1_prover_registry: Option<L1ProverRegistryService>,
    /// L3 Contract bindings for on-chain reads (veQS, Governor, etc.)
    pub l3_contracts: L3Contracts,
    /// Object storage service (MinIO/S3) for document uploads
    pub storage: Option<StorageService>,
}

/// Edition state tracking
pub struct EditionState {
    pub current: Edition,
    pub switch_pending: bool,
    pub next_switch_time: Option<u64>,
}

impl AppState {
    pub async fn new(config: &Config) -> Result<Self> {
        tracing::info!("Initializing application state");

        // Initialize database connection pool (Phase 8-C)
        tracing::info!("Connecting to PostgreSQL database...");
        let db = Database::new(&config.database).await?;
        tracing::info!("Database connection established");

        let redis = RedisClient::new(&config.redis).await?;
        let rabbitmq = RabbitMQClient::new(&config.rabbitmq).await?;
        let hsm = HsmClient::new().await?;
        let vrf = VRFService::new(&config.vrf).await?;

        // Initialize SMT service for Sparse Merkle Tree operations
        tracing::info!("Initializing SMT service...");
        let smt = SmtService::new();
        tracing::info!("SMT service initialized");

        let auth_service = AuthService::new(config.jwt.clone());

        // Initialize L3 client (Phase 8-D)
        let l3_client = if let Some(ref l3_endpoint) = config.l3_endpoint {
            tracing::info!("Initializing L3 client...");
            let l3_config = L3Config {
                endpoint: l3_endpoint.clone(),
                chain_id: config.l3_chain_id.unwrap_or(31337),
                timeout_ms: 30000,
            };
            match L3Client::new(&l3_config) {
                Ok(client) => {
                    tracing::info!("L3 client initialized");
                    Some(client)
                }
                Err(e) => {
                    tracing::warn!("L3 client initialization failed: {}", e);
                    None
                }
            }
        } else {
            tracing::info!("L3 client not configured");
            None
        };

        // Initialize L1 client (Phase 8-D)
        let l1_client = if let Some(ref l1_rpc_url) = config.l1_rpc_url {
            tracing::info!("Initializing L1 client...");
            let l1_config = L1Config {
                rpc_url: l1_rpc_url.clone(),
                chain_id: config.l1_chain_id.unwrap_or(SEPOLIA_CHAIN_ID),
                timeout_ms: 60000,
                bridge_verifier_address: config.bridge_verifier_address.clone(),
                treasury_vault_address: config.treasury_vault_address.clone(),
            };
            match L1Client::new(&l1_config).await {
                Ok(client) => {
                    tracing::info!("L1 client initialized");
                    Some(client)
                }
                Err(e) => {
                    tracing::warn!("L1 client initialization failed: {}", e);
                    None
                }
            }
        } else {
            tracing::info!("L1 client not configured");
            None
        };

        // Initialize L1 Vault Service (Phase 1 - Lock/Unlock E2E)
        let l1_vault = if let (Some(ref vault_addr), Some(ref private_key), Some(ref l1_rpc_url)) = (
            &config.l1_vault_address,
            &config.l1_private_key,
            &config.l1_rpc_url,
        ) {
            tracing::info!("Initializing L1 Vault Service...");
            let provider = ethers::prelude::Provider::<ethers::prelude::Http>::try_from(l1_rpc_url.as_str())
                .map_err(|e| anyhow::anyhow!("L1 Vault provider error: {}", e))?;
            let chain_id = config.l1_chain_id.unwrap_or(SEPOLIA_CHAIN_ID);
            match L1VaultService::new(
                std::sync::Arc::new(provider),
                vault_addr,
                private_key,
                chain_id,
            ).await {
                Ok(service) => {
                    tracing::info!(vault_address = %vault_addr, "L1 Vault Service initialized");
                    Some(service)
                }
                Err(e) => {
                    tracing::warn!("L1 Vault Service initialization failed: {}", e);
                    None
                }
            }
        } else {
            tracing::info!("L1 Vault Service not configured (missing l1_vault_address, l1_private_key, or l1_rpc_url)");
            None
        };

        // Initialize L1 ProverRegistry Service (conditional on feature flags)
        let l1_prover_registry = if config.l1.mode != "mock" {
            if let (Some(ref registry_addr), Some(ref private_key), Some(ref l1_rpc_url)) = (
                &config.l1.prover_registry_address,
                &config.l1_private_key,
                &config.l1_rpc_url,
            ) {
                tracing::info!("Initializing L1 ProverRegistry Service (mode={})...", config.l1.mode);
                let provider = ethers::prelude::Provider::<ethers::prelude::Http>::try_from(l1_rpc_url.as_str())
                    .map_err(|e| anyhow::anyhow!("L1 ProverRegistry provider error: {}", e))?;
                let chain_id = config.l1_chain_id.unwrap_or(SEPOLIA_CHAIN_ID);
                match L1ProverRegistryService::new(
                    std::sync::Arc::new(provider),
                    registry_addr,
                    private_key,
                    chain_id,
                ).await {
                    Ok(service) => {
                        tracing::info!(registry_address = %registry_addr, "L1 ProverRegistry Service initialized");
                        Some(service)
                    }
                    Err(e) => {
                        tracing::warn!("L1 ProverRegistry Service initialization failed: {}", e);
                        None
                    }
                }
            } else {
                tracing::info!("L1 ProverRegistry not configured (missing address, private_key, or rpc_url)");
                None
            }
        } else {
            tracing::info!("L1 mode=mock, ProverRegistry Service disabled");
            None
        };

        // Initialize Storage Service (MinIO/S3)
        let storage = match StorageService::new(&config.storage).await {
            Ok(s) => {
                tracing::info!("Storage service initialized (endpoint={})", config.storage.endpoint);
                Some(s)
            }
            Err(e) => {
                tracing::warn!("Storage service initialization failed: {}, document uploads disabled", e);
                None
            }
        };

        // Initialize L3 Contract bindings (read-only)
        let l3_contracts = {
            let endpoint = config.l3_endpoint.as_deref();
            let addresses = L3ContractAddresses {
                core_layer: config.l3_core_layer_address.as_deref()
                    .and_then(|a| a.parse().ok()).unwrap_or(Address::zero()),
                ve_qs: config.l3_ve_qs_address.as_deref()
                    .and_then(|a| a.parse().ok()).unwrap_or(Address::zero()),
                reward_router: config.l3_reward_router_address.as_deref()
                    .and_then(|a| a.parse().ok()).unwrap_or(Address::zero()),
                governor: config.l3_governor_address.as_deref()
                    .and_then(|a| a.parse().ok()).unwrap_or(Address::zero()),
                insurance_fund: config.l3_insurance_fund_address.as_deref()
                    .and_then(|a| a.parse().ok()).unwrap_or(Address::zero()),
                treasury: config.l3_treasury_address.as_deref()
                    .and_then(|a| a.parse().ok()).unwrap_or(Address::zero()),
            };
            match L3Contracts::new(endpoint, &addresses) {
                Ok(c) => {
                    tracing::info!("L3 Contracts initialized (connected={})", c.is_connected());
                    c
                }
                Err(e) => {
                    tracing::warn!("L3 Contracts initialization failed: {}, using dev mode", e);
                    L3Contracts::new(None, &L3ContractAddresses::default()).unwrap()
                }
            }
        };

        Ok(Self {
            config: config.clone(),
            db,
            redis,
            rabbitmq,
            hsm,
            vrf,
            smt,
            auth_service,
            l3_client,
            l1_client,
            l1_vault,
            l1_prover_registry,
            l3_contracts,
            storage,
        })
    }

    /// Get database pool reference
    pub fn pool(&self) -> &PgPool {
        self.db.pool()
    }

    /// Get config reference
    pub fn config(&self) -> &Config {
        &self.config
    }

    pub async fn is_nonce_used(&self, pk: &str, nonce: u64) -> Result<bool, ApiError> {
        let key = format!("nonce:{}:{}", pk, nonce);
        self.redis.exists(&key).await.map_err(|e| ApiError::Internal(e.to_string()))
    }

    pub async fn mark_nonce_used(&self, pk: &str, nonce: u64) -> Result<(), ApiError> {
        let key = format!("nonce:{}:{}", pk, nonce);
        self.redis.set(&key, "1", 86400 * 30).await.map_err(|e| ApiError::Internal(e.to_string()))
    }

    /// Store a new lock with Dual-Write pattern
    /// SM-001: Write PG first → Redis cache second
    /// If PG fails → return error (data not stored)
    /// If Redis fails → warn only (PG has the data)
    pub async fn store_lock(&self, lock_id: &str, req: &LockRequest, sr_0: &str) -> Result<(), ApiError> {
        let lock = Lock {
            lock_id: lock_id.to_string(),
            chain_id: req.chain_id,
            asset: req.asset.clone(),
            amount: req.amount.clone(),
            dest_addr: req.dest_addr.clone(),
            expiry: req.expiry,
            nonce: req.nonce,
            owner: req.pk_dilithium.clone(),
            sr_0: sr_0.to_string(),
            status: LockStatus::Pending,
            created_at: chrono::Utc::now().timestamp() as u64,
            release_time: None,
            is_emergency: false,
            user_public_key: req.pk_dilithium.clone(),
        };

        // ===== Step 0: Ensure user exists (FK constraint on locks.wallet_address) =====
        crate::db::UserRepository::ensure_exists(self.pool(), &req.dest_addr.to_lowercase()).await?;

        // ===== Step 1: PG INSERT (Source of Truth) - MUST succeed =====
        let amount_bd = req.amount.parse::<bigdecimal::BigDecimal>()
            .unwrap_or_else(|_| bigdecimal::BigDecimal::from(0));
        let dest_addr_bytes = hex::decode(req.dest_addr.trim_start_matches("0x"))
            .unwrap_or_else(|_| req.dest_addr.as_bytes().to_vec());
        let pk_bytes = hex::decode(req.pk_dilithium.trim_start_matches("0x"))
            .unwrap_or_else(|_| req.pk_dilithium.as_bytes().to_vec());
        let sig_bytes = hex::decode(req.sig_dilithium.trim_start_matches("0x"))
            .unwrap_or_else(|_| req.sig_dilithium.as_bytes().to_vec());

        if let Err(e) = crate::db::LockRepository::create(
            self.pool(),
            lock_id,
            &req.dest_addr.to_lowercase(),
            req.chain_id as i64,
            &req.asset,
            &amount_bd,
            &dest_addr_bytes,
            req.expiry as i64,
            req.nonce as i64,
            &pk_bytes,
            &sig_bytes,
            sr_0,
        ).await {
            tracing::error!("PG write failed for lock {}: {:?}", lock_id, e);
            return Err(e);
        }
        tracing::info!("PG: lock {} stored successfully", lock_id);

        // ===== Step 2: Redis SET (Cache) - warn on failure =====
        let key = format!("lock:{}", lock_id);
        let value = serde_json::to_string(&lock).map_err(|e| ApiError::Internal(e.to_string()))?;
        if let Err(e) = self.redis.set(&key, &value, 86400).await {
            tracing::warn!("Redis cache write failed for lock {}: {} (PG has data)", lock_id, e);
        }

        // R-3: Maintain per-user lock index in Redis (cache aid, not critical)
        let owner_index_key = format!("user:locks:{}", lock.owner);
        let _ = self.redis.sadd(&owner_index_key, lock_id).await;
        let dest_index_key = format!("user:locks:{}", lock.dest_addr.to_lowercase());
        let _ = self.redis.sadd(&dest_index_key, lock_id).await;

        Ok(())
    }

    /// Get lock with PG fallback pattern
    /// SM-002: Redis first → PG fallback → re-cache in Redis
    pub async fn get_lock(&self, lock_id: &str) -> Result<Option<Lock>, ApiError> {
        // Step 1: Try Redis cache first (fast path)
        let key = format!("lock:{}", lock_id);
        if let Ok(Some(value)) = self.redis.get(&key).await {
            if let Ok(lock) = serde_json::from_str::<Lock>(&value) {
                return Ok(Some(lock));
            }
        }

        // Step 2: PG fallback (Source of Truth)
        tracing::debug!("Redis cache miss for lock {}, falling back to PG", lock_id);
        let row = crate::db::LockRepository::get_by_id(self.pool(), lock_id).await?;

        if let Some(row) = row {
            let lock = Lock {
                lock_id: row.lock_id.clone(),
                chain_id: row.chain_id as u64,
                asset: row.asset.clone(),
                amount: row.amount.to_string(),
                dest_addr: row.wallet_address.clone(),
                expiry: row.expiry as u64,
                nonce: row.nonce as u64,
                owner: hex::encode(&row.pk_dilithium),
                sr_0: row.sr_0.clone(),
                status: match row.status.as_str() {
                    "pending" => LockStatus::Pending,
                    "confirmed" => LockStatus::Confirmed,
                    "locked" => LockStatus::Locked,
                    "unlock_pending" => LockStatus::UnlockPending,
                    "released" => LockStatus::Released,
                    "emergency_pending" => LockStatus::EmergencyPending,
                    "challenged" => LockStatus::Challenged,
                    "slashed" => LockStatus::Slashed,
                    _ => LockStatus::Pending,
                },
                created_at: row.created_at.timestamp() as u64,
                release_time: None,
                is_emergency: row.status == "emergency_pending",
                user_public_key: hex::encode(&row.pk_dilithium),
            };

            // Step 3: Re-cache in Redis (best effort)
            if let Ok(json) = serde_json::to_string(&lock) {
                let _ = self.redis.set(&key, &json, 86400).await;
            }

            return Ok(Some(lock));
        }

        Ok(None)
    }

    /// Update lock status with Dual-Write pattern
    /// SM-001: PG first → Redis cache invalidation
    pub async fn update_lock_status(&self, lock_id: &str, status: LockStatus, release_time: Option<u64>) -> Result<(), ApiError> {
        let status_str = match status {
            LockStatus::Pending => "pending",
            LockStatus::Confirmed => "confirmed",
            LockStatus::Locked => "locked",
            LockStatus::UnlockPending => "unlock_pending",
            LockStatus::Released => "released",
            LockStatus::EmergencyPending => "emergency_pending",
            LockStatus::Challenged => "challenged",
            LockStatus::Slashed => "slashed",
        };

        // Step 1: PG UPDATE (Source of Truth)
        if let Err(e) = crate::db::LockRepository::update_status(
            self.pool(), lock_id, status_str
        ).await {
            tracing::error!("PG update_lock_status failed for {}: {:?}", lock_id, e);
            return Err(e);
        }
        tracing::info!("PG: lock {} status updated to {}", lock_id, status_str);

        // Step 2: Update Redis cache (or invalidate)
        if let Some(mut lock) = self.get_lock(lock_id).await? {
            lock.status = status;
            lock.release_time = release_time;
            lock.is_emergency = matches!(status, LockStatus::EmergencyPending);
            let key = format!("lock:{}", lock_id);
            if let Ok(value) = serde_json::to_string(&lock) {
                if let Err(e) = self.redis.set(&key, &value, 86400).await {
                    tracing::warn!("Redis cache update failed for lock {}: {} (PG is updated)", lock_id, e);
                }
            }
        } else {
            // If we can't rebuild cache, just delete the stale entry
            let key = format!("lock:{}", lock_id);
            let _ = self.redis.del(&key).await;
        }

        Ok(())
    }

    /// Get all locks with pending unlock or emergency statuses
    /// C-4 fix: Replace empty stub with real PG query via LockRepository
    pub async fn get_pending_locks(&self) -> Result<Vec<Lock>, ApiError> {
        tracing::info!("get_pending_locks: querying PG for pending locks");

        let statuses = &["unlock_pending", "emergency_pending"];
        let rows = crate::db::LockRepository::list_locks_by_statuses(self.pool(), statuses).await?;

        let locks: Vec<Lock> = rows
            .into_iter()
            .map(|row| Lock {
                lock_id: row.lock_id.clone(),
                chain_id: row.chain_id as u64,
                asset: row.asset.clone(),
                amount: row.amount.to_string(),
                dest_addr: row.wallet_address.clone(),
                expiry: row.expiry as u64,
                nonce: row.nonce as u64,
                owner: hex::encode(&row.pk_dilithium),
                sr_0: row.sr_0.clone(),
                status: match row.status.as_str() {
                    "pending" => LockStatus::Pending,
                    "confirmed" => LockStatus::Confirmed,
                    "locked" => LockStatus::Locked,
                    "unlock_pending" => LockStatus::UnlockPending,
                    "released" => LockStatus::Released,
                    "emergency_pending" => LockStatus::EmergencyPending,
                    "challenged" => LockStatus::Challenged,
                    "slashed" => LockStatus::Slashed,
                    _ => LockStatus::Pending,
                },
                created_at: row.created_at.timestamp() as u64,
                release_time: None,
                is_emergency: row.status == "emergency_pending",
                user_public_key: hex::encode(&row.pk_dilithium),
            })
            .collect();

        tracing::info!("get_pending_locks: found {} pending locks", locks.len());
        Ok(locks)
    }

    pub async fn notify_lock_created(&self, lock_id: &str) -> Result<(), ApiError> {
        let msg = serde_json::json!({"type": "LOCK_CREATED", "lock_id": lock_id});
        self.rabbitmq.publish("event_bridge", &msg.to_string()).await.map_err(|e| ApiError::Internal(e.to_string()))
    }

    pub async fn request_prover_signatures(&self, unlock_id: &str, lock_id: &str, sr_0: &str, sr_1: &str) -> Result<(), ApiError> {
        let msg = serde_json::json!({"type": "SIG_REQ", "unlock_id": unlock_id, "lock_id": lock_id, "sr_0": sr_0, "sr_1": sr_1});
        self.rabbitmq.publish("sig_queue", &msg.to_string()).await.map_err(|e| ApiError::Internal(e.to_string()))
    }

    pub async fn store_prover(&self, prover_id: &str, req: &ProverRegisterRequest) -> Result<(), ApiError> {
        // 1. Store in PostgreSQL (primary storage)
        let stake_amount = BigDecimal::from_str(&req.stake_amount).unwrap_or_else(|_| BigDecimal::from(0));
        let sphincs_pubkey_bytes = hex::decode(req.sphincs_pubkey.trim_start_matches("0x"))
            .unwrap_or_default();
        let hsm_attestation_bytes = hex::decode(req.hsm_attestation.trim_start_matches("0x"))
            .unwrap_or_default();

        // Insert with all application form fields using dynamic query
        sqlx::query(
            r#"
            INSERT INTO provers (
                prover_id, operator_addr, sphincs_pubkey, stake_amount, hsm_attestation,
                status, tier, registered_at,
                organization_name, country, website, contact_email, validator_experience,
                hsm_provider, infrastructure_location, business_registration_number, documents_count
            )
            VALUES ($1, $2, $3, $4, $5, 'pending_approval', 'standard', NOW(),
                    $6, $7, $8, $9, $10, $11, $12, $13, $14)
            ON CONFLICT (prover_id) DO UPDATE SET
                operator_addr = EXCLUDED.operator_addr,
                sphincs_pubkey = EXCLUDED.sphincs_pubkey,
                stake_amount = EXCLUDED.stake_amount,
                hsm_attestation = EXCLUDED.hsm_attestation,
                organization_name = EXCLUDED.organization_name,
                country = EXCLUDED.country,
                website = EXCLUDED.website,
                contact_email = EXCLUDED.contact_email,
                validator_experience = EXCLUDED.validator_experience,
                hsm_provider = EXCLUDED.hsm_provider,
                infrastructure_location = EXCLUDED.infrastructure_location,
                business_registration_number = EXCLUDED.business_registration_number,
                documents_count = EXCLUDED.documents_count
            "#
        )
        .bind(prover_id)
        .bind(&req.operator_addr)
        .bind(&sphincs_pubkey_bytes)
        .bind(&stake_amount)
        .bind(&hsm_attestation_bytes)
        .bind(req.organization_name.as_deref())
        .bind(req.country.as_deref())
        .bind(req.website.as_deref())
        .bind(req.contact_email.as_deref())
        .bind(req.validator_experience.as_deref())
        .bind(req.hsm_provider.as_deref())
        .bind(req.infrastructure_location.as_deref())
        .bind(req.business_registration_number.as_deref())
        .bind(req.documents_count)
        .execute(self.pool())
        .await
        .map_err(|e| ApiError::Internal(format!("Failed to store prover in DB: {}", e)))?;

        tracing::info!("Prover stored in PostgreSQL: prover_id={}, operator={}, org={:?}",
            prover_id, req.operator_addr, req.organization_name);

        // 2. Also store in Redis for fast access
        let prover = ProverInfoResponse {
            prover_id: prover_id.to_string(),
            operator_addr: req.operator_addr.clone(),
            status: ProverStatus::PendingApproval,
            stake_amount: req.stake_amount.clone(),
            total_signatures: 0,
            slashing_history: vec![],
        };
        let key = format!("prover:{}", prover_id);
        let value = serde_json::to_string(&prover).map_err(|e| ApiError::Internal(e.to_string()))?;
        self.redis.set(&key, &value, 0).await.map_err(|e| ApiError::Internal(e.to_string()))?;

        Ok(())
    }

    pub async fn get_prover(&self, prover_id: &str) -> Result<Option<ProverInfoResponse>, ApiError> {
        let key = format!("prover:{}", prover_id);
        tracing::debug!("get_prover: key={}", key);

        // Try Redis first
        match self.redis.get(&key).await {
            Ok(Some(value)) => {
                if let Ok(prover) = serde_json::from_str::<ProverInfoResponse>(&value) {
                    tracing::debug!("get_prover: found in Redis, status={:?}", prover.status);
                    return Ok(Some(prover));
                }
                tracing::warn!("get_prover: Redis value deserialization failed for {}", prover_id);
            }
            Ok(None) => {
                tracing::debug!("get_prover: not in Redis, trying DB for {}", prover_id);
            }
            Err(e) => {
                tracing::warn!("get_prover: Redis error for {}: {}", prover_id, e);
            }
        }

        // Fallback to PostgreSQL
        let pool = self.pool();
        let result = sqlx::query_as::<_, (String, String, Option<String>, String)>(
            "SELECT prover_id, operator_addr, status, stake_amount::text FROM provers WHERE prover_id = $1"
        )
        .bind(prover_id)
        .fetch_optional(pool)
        .await
        .map_err(|e| ApiError::Internal(format!("Database error: {}", e)))?;

        match result {
            Some((id, addr, status_str, stake)) => {
                tracing::debug!("get_prover: DB returned status_str={:?} for {}", status_str, prover_id);
                let status = match status_str.as_deref() {
                    Some("active") => ProverStatus::Active,
                    Some("inactive") => ProverStatus::Inactive,
                    Some("exiting") => ProverStatus::Exiting,
                    Some("exited") => ProverStatus::Exited,
                    Some("slashed") => ProverStatus::Slashed,
                    _ => ProverStatus::PendingApproval,
                };

                let prover = ProverInfoResponse {
                    prover_id: id,
                    operator_addr: addr,
                    status,
                    stake_amount: stake,
                    total_signatures: 0,
                    slashing_history: vec![],
                };

                // Cache in Redis for next time
                if let Ok(value) = serde_json::to_string(&prover) {
                    let _ = self.redis.set(&key, &value, 0).await;
                    tracing::debug!("Cached prover {} in Redis with status {:?}", prover_id, prover.status);
                }

                Ok(Some(prover))
            }
            None => Ok(None),
        }
    }

    pub async fn get_edition_state(&self) -> Result<EditionState, ApiError> {
        let current = match self.redis.get("edition:current").await {
            Ok(Some(v)) if v == "decentralized" => Edition::Decentralized,
            _ => Edition::Enterprise,
        };
        let switch_pending = self.redis.exists("edition:switch_pending").await.unwrap_or(false);
        let next_switch_time = if switch_pending {
            self.redis.get("edition:next_switch_time").await.ok().flatten().and_then(|v| v.parse().ok())
        } else { None };
        Ok(EditionState { current, switch_pending, next_switch_time })
    }

    pub async fn store_edition_switch(&self, switch_id: &str, req: &crate::types::EditionSwitchRequest, effective_time: u64) -> Result<(), ApiError> {
        let data = serde_json::json!({"switch_id": switch_id, "target": format!("{:?}", req.target_edition), "effective_time": effective_time});
        self.redis.set(&format!("edition:switch:{}", switch_id), &data.to_string(), 86400 * 14).await.map_err(|e| ApiError::Internal(e.to_string()))?;
        self.redis.set("edition:switch_pending", "1", 86400 * 14).await.map_err(|e| ApiError::Internal(e.to_string()))?;
        self.redis.set("edition:next_switch_time", &effective_time.to_string(), 86400 * 14).await.map_err(|e| ApiError::Internal(e.to_string()))
    }

    // ========================================================================
    // Challenge Methods (SEQUENCES §4)
    // ========================================================================

    /// Store a new challenge (Dual-Write: PG first, then Redis cache)
    /// SM-001: PG is Source of Truth, Redis is cache
    pub async fn store_challenge(
        &self,
        challenge_id: &str,
        lock_id: &str,
        challenger: &str,
        fraud_proof_hash: &str,
        bond: &str,
        defense_deadline: u64,
    ) -> Result<(), ApiError> {
        // Step 1: PG INSERT (Source of Truth)
        let bond_bd = BigDecimal::from_str(bond).unwrap_or_else(|_| BigDecimal::from(0));
        let deadline_dt = chrono::DateTime::from_timestamp(defense_deadline as i64, 0)
            .unwrap_or_else(|| chrono::Utc::now());
        crate::db::ChallengeRepository::create(
            self.pool(), challenge_id, lock_id, challenger,
            fraud_proof_hash, &bond_bd, deadline_dt,
        ).await?;
        tracing::info!("Challenge stored in PG: challenge_id={}", challenge_id);

        // Step 2: Redis cache (for fast access)
        let challenge = ChallengeInfo {
            challenge_id: challenge_id.to_string(),
            lock_id: lock_id.to_string(),
            challenger: challenger.to_string(),
            fraud_proof_hash: fraud_proof_hash.to_string(),
            bond: bond.to_string(),
            challenged_at: chrono::Utc::now().timestamp() as u64,
            defense_deadline,
            status: ChallengeStatus::Pending,
            defender: None,
            defense_proof_hash: None,
        };
        let key = format!("challenge:{}", challenge_id);
        let lock_key = format!("challenge:lock:{}", lock_id);
        let value = serde_json::to_string(&challenge).map_err(|e| ApiError::Internal(e.to_string()))?;
        if let Err(e) = self.redis.set(&key, &value, 86400 * 30).await {
            tracing::warn!("Redis cache write failed for challenge (non-fatal): {}", e);
        }
        let _ = self.redis.set(&lock_key, challenge_id, 86400 * 30).await;
        Ok(())
    }

    /// Get challenge by lock_id (PG-first with Redis cache)
    /// SM-002: Redis cache → PG fallback → re-cache
    pub async fn get_challenge_by_lock_id(&self, lock_id: &str) -> Result<Option<ChallengeInfo>, ApiError> {
        // Step 1: Try Redis cache
        let lock_key = format!("challenge:lock:{}", lock_id);
        if let Ok(Some(challenge_id)) = self.redis.get(&lock_key).await {
            let key = format!("challenge:{}", challenge_id);
            if let Ok(Some(value)) = self.redis.get(&key).await {
                if let Ok(challenge) = serde_json::from_str::<ChallengeInfo>(&value) {
                    return Ok(Some(challenge));
                }
            }
        }

        // Step 2: PG fallback (Source of Truth)
        let row = crate::db::ChallengeRepository::get_by_lock_id(self.pool(), lock_id).await?;
        match row {
            Some(r) => {
                let challenge = ChallengeInfo {
                    challenge_id: r.challenge_id.clone(),
                    lock_id: r.lock_id.clone(),
                    challenger: r.challenger.clone(),
                    fraud_proof_hash: r.fraud_proof_hash.clone(),
                    bond: r.bond.to_string(),
                    challenged_at: r.challenged_at.timestamp() as u64,
                    defense_deadline: r.defense_deadline.timestamp() as u64,
                    status: match r.status.as_str() {
                        "pending" => ChallengeStatus::Pending,
                        "defense_submitted" => ChallengeStatus::DefenseSubmitted,
                        "resolved_valid" => ChallengeStatus::ResolvedValid,
                        "resolved_invalid" => ChallengeStatus::ResolvedInvalid,
                        _ => ChallengeStatus::Pending,
                    },
                    defender: r.defender.clone(),
                    defense_proof_hash: r.defense_proof_hash.clone(),
                };

                // Step 3: Re-cache in Redis
                if let Ok(value) = serde_json::to_string(&challenge) {
                    let key = format!("challenge:{}", r.challenge_id);
                    let _ = self.redis.set(&key, &value, 86400 * 30).await;
                    let _ = self.redis.set(&lock_key, &r.challenge_id, 86400 * 30).await;
                }

                Ok(Some(challenge))
            }
            None => Ok(None),
        }
    }

    /// Submit defense for a challenge (Dual-Write: PG first, then Redis cache)
    /// SM-001: PG is Source of Truth
    pub async fn submit_defense(
        &self,
        challenge_id: &str,
        defender: &str,
        defense_proof_hash: &str,
    ) -> Result<(), ApiError> {
        // Step 1: PG UPDATE (Source of Truth)
        crate::db::ChallengeRepository::update_status(
            self.pool(), challenge_id, "defense_submitted",
            Some(defender), Some(defense_proof_hash),
        ).await?;
        tracing::info!("Challenge defense submitted in PG: {}", challenge_id);

        // Step 2: Update Redis cache
        let key = format!("challenge:{}", challenge_id);
        if let Ok(Some(value)) = self.redis.get(&key).await {
            if let Ok(mut challenge) = serde_json::from_str::<ChallengeInfo>(&value) {
                challenge.status = ChallengeStatus::DefenseSubmitted;
                challenge.defender = Some(defender.to_string());
                challenge.defense_proof_hash = Some(defense_proof_hash.to_string());
                if let Ok(new_value) = serde_json::to_string(&challenge) {
                    let _ = self.redis.set(&key, &new_value, 86400 * 30).await;
                }
            }
        }
        Ok(())
    }

    /// Resolve a challenge (Dual-Write: PG first, then Redis cache)
    /// SM-001: PG is Source of Truth. Resolution + slashing in PG transaction.
    pub async fn resolve_challenge(
        &self,
        challenge_id: &str,
        challenge_valid: bool,
        slash_amount: &str,
        challenger_reward: &str,
        insurance_amount: &str,
        burn_amount: &str,
    ) -> Result<(), ApiError> {
        let status_str = if challenge_valid { "resolved_valid" } else { "resolved_invalid" };

        // Step 1: PG UPDATE challenge status (Source of Truth)
        crate::db::ChallengeRepository::update_status(
            self.pool(), challenge_id, status_str, None, None,
        ).await?;

        tracing::info!("Challenge resolved in PG: id={}, valid={}", challenge_id, challenge_valid);

        // Step 2: Update Redis cache
        let key = format!("challenge:{}", challenge_id);
        if let Ok(Some(value)) = self.redis.get(&key).await {
            if let Ok(mut challenge) = serde_json::from_str::<ChallengeInfo>(&value) {
                challenge.status = if challenge_valid { ChallengeStatus::ResolvedValid } else { ChallengeStatus::ResolvedInvalid };
                if let Ok(new_value) = serde_json::to_string(&challenge) {
                    let _ = self.redis.set(&key, &new_value, 86400 * 30).await;
                }
            }
        }

        // Step 2b: Also keep resolution log in Redis for backward compat
        let resolution = serde_json::json!({
            "challenge_id": challenge_id,
            "challenge_valid": challenge_valid,
            "slash_amount": slash_amount,
            "challenger_reward": challenger_reward,
            "insurance_amount": insurance_amount,
            "burn_amount": burn_amount,
            "resolved_at": chrono::Utc::now().timestamp(),
        });
        let resolution_key = format!("challenge:resolution:{}", challenge_id);
        let _ = self.redis.set(&resolution_key, &resolution.to_string(), 86400 * 365).await;
        Ok(())
    }

    // ========================================================================
    // VRF Methods (SEQUENCES §2.3-§2.4)
    // ========================================================================

    /// Store VRF request (Dual-Write: PG first, then Redis cache)
    /// SM-001: PG is Source of Truth, Redis is cache
    pub async fn store_vrf_request(&self, request: &VRFRequest) -> Result<(), ApiError> {
        // Step 1: PG INSERT (Source of Truth)
        let empty_provers = serde_json::json!([]);
        let empty_weights = serde_json::json!({});
        if let Err(e) = crate::db::VrfRepository::create(
            self.pool(),
            &request.vrf_request_id,
            &request.unlock_request_id,
            &[],  // vrf_seed not available in VRFRequest struct
            &empty_provers,
            &empty_weights,
        ).await {
            tracing::warn!("VRF PG write failed (non-fatal, Redis still used): {}", e);
        } else {
            tracing::info!("VRF request stored in PG: vrf_id={}", request.vrf_request_id);
        }

        // Step 2: Redis cache (best-effort, non-fatal if Redis unavailable)
        if let Ok(value) = serde_json::to_string(request) {
            let key = format!("vrf:{}", request.vrf_request_id);
            let unlock_key = format!("vrf:unlock:{}", request.unlock_request_id);
            let _ = self.redis.set(&key, &value, 86400).await;
            let _ = self.redis.set(&unlock_key, &request.vrf_request_id, 86400).await;
        }

        Ok(())
    }

    /// Get VRF request by unlock request ID
    pub async fn get_vrf_request_by_unlock(&self, unlock_request_id: &str) -> Result<Option<VRFRequest>, ApiError> {
        let unlock_key = format!("vrf:unlock:{}", unlock_request_id);
        let vrf_request_id = match self.redis.get(&unlock_key).await {
            Ok(Some(id)) => id,
            Ok(None) => return Ok(None),
            Err(e) => return Err(ApiError::Internal(e.to_string())),
        };

        let key = format!("vrf:{}", vrf_request_id);
        match self.redis.get(&key).await {
            Ok(Some(value)) => Ok(Some(serde_json::from_str(&value).map_err(|e| ApiError::Internal(e.to_string()))?)),
            Ok(None) => Ok(None),
            Err(e) => Err(ApiError::Internal(e.to_string())),
        }
    }

    /// Update VRF request status (Dual-Write: PG first, then Redis cache)
    /// SM-001: PG is Source of Truth, Redis is cache
    pub async fn update_vrf_status(
        &self,
        vrf_request_id: &str,
        status: VRFStatus,
        selected_prover: Option<&str>,
        random_value: Option<&str>,
    ) -> Result<(), ApiError> {
        // Step 1: PG UPDATE (Source of Truth)
        let pg_status = match status {
            VRFStatus::NotStarted => "pending",
            VRFStatus::Pending => "pending",
            VRFStatus::Fulfilled => "fulfilled",
            VRFStatus::FallbackUsed => "fallback_used",
            VRFStatus::Failed => "failed",
        };
        if let Err(e) = crate::db::VrfRepository::update_status(
            self.pool(),
            vrf_request_id,
            pg_status,
        ).await {
            tracing::warn!("VRF PG status update failed (non-fatal): {}", e);
        }

        // Step 2: Update Redis cache (best-effort, non-fatal if Redis unavailable)
        let key = format!("vrf:{}", vrf_request_id);
        if let Ok(Some(value)) = self.redis.get(&key).await {
            if let Ok(mut request) = serde_json::from_str::<VRFRequest>(&value) {
                request.status = status;
                request.selected_prover = selected_prover.map(|s| s.to_string());
                request.random_value = random_value.map(|s| s.to_string());
                if let Ok(new_value) = serde_json::to_string(&request) {
                    let _ = self.redis.set(&key, &new_value, 86400).await;
                }
            }
        }

        Ok(())
    }

    /// Request prover signatures for selected provers only
    /// SEQUENCES §2.4: Only selected provers sign
    /// Also creates an entry in signing_queue for Prover Portal
    pub async fn request_selected_prover_signatures(
        &self,
        unlock_id: &str,
        lock_id: &str,
        sr_0: &str,
        sr_1: &str,
        selected_prover: &str,
        user_address: &str,
        amount: &str,
        is_emergency: bool,
        release_time: u64,
    ) -> Result<(), ApiError> {
        // 1. Generate unique queue_id for this (unlock_id, prover_id) combination
        //    FIX: Previously used unlock_id as queue_id, causing 2nd prover to be ignored
        let mut hasher = Sha3_256::new();
        hasher.update(unlock_id.as_bytes());
        hasher.update(selected_prover.as_bytes());
        let queue_id = format!("0x{}", hex::encode(hasher.finalize()));

        // 2. Insert into signing_queue for Prover Portal
        let pool = self.db.pool();
        let unlock_type = if is_emergency { "emergency" } else { "normal" };
        let priority = if is_emergency { "critical" } else { "normal" };
        let deadline = chrono::DateTime::from_timestamp(release_time as i64, 0)
            .unwrap_or_else(|| chrono::Utc::now());

        sqlx::query(
            r#"
            INSERT INTO signing_queue
                (queue_id, unlock_id, prover_id, lock_id, unlock_type, user_address, amount, asset, sr_0, sr_1, priority, status, dilithium_verified, deadline)
            VALUES
                ($1, $2, $3, $4, $5, $6, $7::numeric, 'ETH', $8, $9, $10, 'pending', true, $11)
            ON CONFLICT (unlock_id, prover_id) DO NOTHING
            "#
        )
        .bind(&queue_id)
        .bind(unlock_id)
        .bind(selected_prover)
        .bind(lock_id)
        .bind(unlock_type)
        .bind(user_address)
        .bind(amount)
        .bind(sr_0)
        .bind(sr_1)
        .bind(priority)
        .bind(deadline)
        .execute(pool)
        .await
        .map_err(|e| {
            tracing::warn!("Failed to insert into signing_queue: {}", e);
            ApiError::Internal(format!("Failed to create signing queue entry: {}", e))
        })?;

        tracing::info!(
            "Created signing_queue entry: queue_id={}, unlock_id={}, prover={}, amount={}",
            queue_id, unlock_id, selected_prover, amount
        );

        // 2. Publish to RabbitMQ for async processing
        let msg = serde_json::json!({
            "type": "SIG_REQ_SELECTED",
            "unlock_id": unlock_id,
            "lock_id": lock_id,
            "sr_0": sr_0,
            "sr_1": sr_1,
            "selected_prover": selected_prover,
        });
        self.rabbitmq.publish("sig_queue", &msg.to_string()).await.map_err(|e| ApiError::Internal(e.to_string()))
    }

    // ========================================================================
    // User API methods (TASK-P5-020)
    // ========================================================================

    /// Get all locks for a specific user
    ///
    /// Storage Migration: PG-first with Redis cache
    /// SM-002: PG is the source of truth, Redis KEYS scan eliminated
    pub async fn get_user_locks(&self, user_address: &str) -> Result<Vec<Lock>, ApiError> {
        let wallet = user_address.to_lowercase();
        let cache_key = format!("user:locks:list:{}", wallet);

        // Step 1: Try Redis cache (aggregated list)
        if let Ok(Some(cached)) = self.redis.get(&cache_key).await {
            if let Ok(locks) = serde_json::from_str::<Vec<Lock>>(&cached) {
                if !locks.is_empty() {
                    tracing::debug!("Redis cache hit for user locks: {}", wallet);
                    return Ok(locks);
                }
            }
        }

        // Step 2: PG query (Source of Truth) - no KEYS scan needed
        tracing::debug!("Fetching user locks from PG for: {}", wallet);
        let rows = crate::db::LockRepository::list_locks_by_wallet(
            self.pool(), &wallet, None, 0, 100
        ).await?;

        let user_locks: Vec<Lock> = rows.iter().map(|row| Lock {
            lock_id: row.lock_id.clone(),
            chain_id: row.chain_id as u64,
            asset: row.asset.clone(),
            amount: row.amount.to_string(),
            dest_addr: row.wallet_address.clone(),
            expiry: row.expiry as u64,
            nonce: row.nonce as u64,
            owner: hex::encode(&row.pk_dilithium),
            sr_0: row.sr_0.clone(),
            status: match row.status.as_str() {
                "pending" => LockStatus::Pending,
                "confirmed" => LockStatus::Confirmed,
                "locked" => LockStatus::Locked,
                "unlock_pending" => LockStatus::UnlockPending,
                "released" => LockStatus::Released,
                "emergency_pending" => LockStatus::EmergencyPending,
                "challenged" => LockStatus::Challenged,
                "slashed" => LockStatus::Slashed,
                _ => LockStatus::Pending,
            },
            created_at: row.created_at.timestamp() as u64,
            release_time: None,
            is_emergency: row.status == "emergency_pending",
            user_public_key: hex::encode(&row.pk_dilithium),
        }).collect();

        // Step 3: Cache result in Redis (5min TTL)
        if let Ok(json) = serde_json::to_string(&user_locks) {
            let _ = self.redis.set(&cache_key, &json, 300).await;
        }

        // Also maintain backward-compatible set index
        let index_key = format!("user:locks:{}", wallet);
        for lock in &user_locks {
            let _ = self.redis.sadd(&index_key, &lock.lock_id).await;
        }

        Ok(user_locks)
    }

    /// Get user settings (PG-first with Redis cache)
    /// SM-002: Redis cache → PG fallback → re-cache
    pub async fn get_user_settings(&self, user_address: &str) -> Result<Option<crate::types::UserSettingsResponse>, ApiError> {
        // Step 1: Try Redis cache
        let key = format!("user:settings:{}", user_address);
        if let Ok(Some(value)) = self.redis.get(&key).await {
            if let Ok(settings) = serde_json::from_str::<crate::types::UserSettingsResponse>(&value) {
                return Ok(Some(settings));
            }
        }

        // Step 2: PG fallback (Source of Truth)
        let row = crate::db::UserRepository::get_settings(self.pool(), user_address).await?;
        match row {
            Some(r) => {
                let settings = crate::types::UserSettingsResponse {
                    address: r.wallet_address.clone(),
                    notifications: crate::types::NotificationSettings {
                        email_enabled: r.notification_email,
                        email: r.email.clone(),
                        on_lock_confirmed: true,
                        on_unlock_ready: true,
                        on_challenge: true,
                    },
                    default_time_lock_hours: 24,
                    language: r.language.clone(),
                    two_factor_enabled: r.two_factor_enabled,
                };

                // Step 3: Re-cache in Redis
                if let Ok(value) = serde_json::to_string(&settings) {
                    let _ = self.redis.set(&key, &value, 3600).await;
                }

                Ok(Some(settings))
            }
            None => Ok(None),
        }
    }

    /// Store user settings (Dual-Write: PG first, then Redis cache)
    /// SM-001: PG is Source of Truth, Redis is cache
    pub async fn store_user_settings(&self, user_address: &str, settings: &crate::types::UserSettingsResponse) -> Result<(), ApiError> {
        // Step 1: PG UPSERT (Source of Truth)
        crate::db::UserRepository::upsert_settings(
            self.pool(), user_address,
            settings.notifications.email.as_deref(),
            &settings.language,
            settings.notifications.email_enabled,
            true,  // notification_browser (default)
            settings.two_factor_enabled,
        ).await?;
        tracing::info!("User settings stored in PG: wallet={}", user_address);

        // Step 2: Redis cache
        let key = format!("user:settings:{}", user_address);
        let value = serde_json::to_string(settings).map_err(|e| ApiError::Internal(e.to_string()))?;
        let _ = self.redis.set(&key, &value, 3600).await;
        Ok(())
    }

    /// Get user's registered Dilithium public key (PG-first with Redis cache)
    /// SM-002: Redis cache → PG fallback → re-cache
    pub async fn get_user_dilithium_key(&self, user_address: &str) -> Result<Option<(String, u64)>, ApiError> {
        // Step 1: Try Redis cache
        let key = format!("user:dilithium:{}", user_address);
        if let Ok(Some(value)) = self.redis.get(&key).await {
            let parts: Vec<&str> = value.splitn(2, ':').collect();
            if parts.len() == 2 {
                let pk = parts[0].to_string();
                let timestamp = parts[1].parse::<u64>().unwrap_or(0);
                return Ok(Some((pk, timestamp)));
            } else {
                return Ok(Some((value, 0)));
            }
        }

        // Step 2: PG fallback (Source of Truth)
        let row = crate::db::UserRepository::get_by_wallet(self.pool(), user_address).await?;
        match row {
            Some(r) if r.pk_dilithium.is_some() => {
                let pk_bytes = r.pk_dilithium.unwrap();
                let pk_hex = hex::encode(&pk_bytes);
                let timestamp = r.created_at.timestamp() as u64;

                // Step 3: Re-cache in Redis
                let cache_value = format!("{}:{}", pk_hex, timestamp);
                let _ = self.redis.set(&key, &cache_value, 0).await;

                Ok(Some((pk_hex, timestamp)))
            }
            _ => Ok(None),
        }
    }

    /// Store user's Dilithium public key (Dual-Write: PG first, then Redis cache)
    /// SM-001: PG is Source of Truth
    pub async fn store_user_dilithium_key(&self, user_address: &str, public_key: &str) -> Result<(), ApiError> {
        // Step 1: PG UPSERT (Source of Truth)
        let pk_bytes = hex::decode(public_key.trim_start_matches("0x")).unwrap_or_default();
        crate::db::UserRepository::upsert(
            self.pool(), user_address, Some(&pk_bytes),
        ).await?;
        tracing::info!("User Dilithium key stored in PG: wallet={}", user_address);

        // Step 2: Redis cache
        let key = format!("user:dilithium:{}", user_address);
        let timestamp = chrono::Utc::now().timestamp() as u64;
        let value = format!("{}:{}", public_key, timestamp);
        let _ = self.redis.set(&key, &value, 0).await;
        Ok(())
    }

    // ========================================================================
    // Token Hub (veQS) Methods (TASK-P5-021)
    // ========================================================================

    /// Get user's veQS lock position
    /// SM-002: PG-first with Redis cache
    pub async fn get_veqs_lock(&self, address: &str) -> Result<Option<LockPosition>, ApiError> {
        // Step 1: Try Redis cache
        let key = format!("veqs:lock:{}", address);
        if let Ok(Some(value)) = self.redis.get(&key).await {
            if let Ok(lock) = serde_json::from_str::<LockPosition>(&value) {
                return Ok(Some(lock));
            }
        }

        // Step 2: PG fallback – get active locks (lock_end > now)
        let rows = crate::db::TokenHubRepository::get_veqs_locks_by_wallet(
            self.pool(), address,
        ).await?;

        let now = chrono::Utc::now();
        let active = rows.into_iter().find(|r| r.lock_end > now);

        if let Some(row) = active {
            let max_lock_time: u64 = 4 * 365 * 24 * 60 * 60;
            let start_ts = row.created_at.timestamp() as u64;
            let unlock_ts = row.lock_end.timestamp() as u64;
            let lock_dur = row.lock_duration_days as u64 * 86400;
            let remaining = unlock_ts.saturating_sub(now.timestamp() as u64);
            let multiplier = remaining as f64 / max_lock_time as f64;

            let lock = LockPosition {
                amount: row.locked_amount.to_string(),
                start_time: start_ts,
                unlock_time: unlock_ts,
                lock_duration: lock_dur,
                veqs_value: row.veqs_value.to_string(),
                multiplier,
                time_remaining: format_veqs_duration(remaining),
            };

            // Re-cache in Redis
            if let Ok(json) = serde_json::to_string(&lock) {
                let _ = self.redis.set(&key, &json, 3600).await;
            }
            Ok(Some(lock))
        } else {
            Ok(None)
        }
    }

    /// Store user's veQS lock position
    /// SM-001: PG first, then Redis cache
    pub async fn store_veqs_lock(&self, address: &str, lock: &LockPosition) -> Result<(), ApiError> {
        // Step 0: Ensure user exists to satisfy FK constraint on veqs_locks
        crate::db::UserRepository::ensure_exists(self.pool(), address).await?;

        // Step 1: PG INSERT (Source of Truth)
        let lock_id = format!("veqs-lock-{}-{}", address, lock.start_time);
        let locked_amount = bigdecimal::BigDecimal::from_str(&lock.amount)
            .unwrap_or_else(|_| bigdecimal::BigDecimal::from(0));
        let veqs_value_bd = bigdecimal::BigDecimal::from_str(&lock.veqs_value)
            .unwrap_or_else(|_| bigdecimal::BigDecimal::from(0));
        let lock_end = chrono::DateTime::from_timestamp(lock.unlock_time as i64, 0)
            .unwrap_or_else(|| chrono::Utc::now());
        let lock_duration_days = (lock.lock_duration / 86400) as i64;

        crate::db::TokenHubRepository::create_veqs_lock(
            self.pool(), &lock_id, address, &locked_amount, &veqs_value_bd,
            lock_end, lock_duration_days,
        ).await?;
        tracing::info!("veQS lock stored in PG: wallet={}, lock_id={}", address, lock_id);

        // Step 2: Redis cache
        let key = format!("veqs:lock:{}", address);
        let value = serde_json::to_string(lock).map_err(|e| ApiError::Internal(e.to_string()))?;
        let _ = self.redis.set(&key, &value, 3600).await;
        Ok(())
    }

    /// Get user's veQS lock history
    /// SM-002: PG-first with Redis cache
    pub async fn get_veqs_lock_history(&self, address: &str) -> Result<Vec<HistoricalLock>, ApiError> {
        // Step 1: Try Redis cache
        let key = format!("veqs:history:{}", address);
        if let Ok(Some(value)) = self.redis.get(&key).await {
            if let Ok(history) = serde_json::from_str::<Vec<HistoricalLock>>(&value) {
                if !history.is_empty() {
                    return Ok(history);
                }
            }
        }

        // Step 2: PG fallback – expired locks
        let rows = crate::db::TokenHubRepository::get_veqs_locks_by_wallet(
            self.pool(), address,
        ).await?;

        let now = chrono::Utc::now();
        let history: Vec<HistoricalLock> = rows.into_iter()
            .filter(|r| r.lock_end <= now)
            .map(|r| HistoricalLock {
                amount: r.locked_amount.to_string(),
                start_time: r.created_at.timestamp() as u64,
                unlock_time: r.lock_end.timestamp() as u64,
                withdrawn_at: r.lock_end.timestamp() as u64,
            })
            .collect();

        // Re-cache
        if !history.is_empty() {
            if let Ok(json) = serde_json::to_string(&history) {
                let _ = self.redis.set(&key, &json, 3600).await;
            }
        }
        Ok(history)
    }

    /// Get user's QS token balance
    /// Note: In production this would call the L1 QS ERC20 contract.
    /// For now we read from Redis (set by L1 indexer), no mock fallback.
    pub async fn get_qs_balance(&self, address: &str) -> Result<String, ApiError> {
        let key = format!("qs:balance:{}", address);
        match self.redis.get(&key).await {
            Ok(Some(value)) => Ok(value),
            Ok(None) => Ok("0".to_string()), // No mock – real zero until L1 indexer populates
            Err(e) => Err(ApiError::Internal(e.to_string())),
        }
    }

    /// Get user's veQS balance (calculated from lock position)
    pub async fn get_veqs_balance(&self, address: &str) -> Result<u128, ApiError> {
        if let Some(lock) = self.get_veqs_lock(address).await? {
            lock.veqs_value.parse().map_err(|_| ApiError::Internal("Invalid veQS value".to_string()))
        } else {
            Ok(0)
        }
    }

    /// Get user's voting power percentage
    /// SM-002: Uses PG for total veQS supply, cross-checked with L3 total voting power
    pub async fn get_voting_power_percent(&self, address: &str) -> Result<f64, ApiError> {
        let user_veqs = self.get_veqs_balance(address).await?;
        if user_veqs == 0 {
            return Ok(0.0);
        }

        // Primary: PG query for total veQS supply (all active locks)
        let total_supply = crate::db::TokenHubRepository::get_total_veqs_supply(self.pool()).await?;
        use bigdecimal::ToPrimitive;
        let mut total_f64 = total_supply.to_f64().unwrap_or(0.0);

        // Cross-check with L3 total voting power if available
        if let Ok(l3_total) = self.l3_contracts.get_total_voting_power().await {
            let l3_total_f64 = l3_total.as_u128() as f64;
            if l3_total_f64 > 0.0 && total_f64 > 0.0 {
                // Use L3 value as authoritative when connected
                if self.l3_contracts.is_connected() {
                    tracing::debug!("Token Hub: using L3 total voting power {} (PG had {})", l3_total_f64, total_f64);
                    total_f64 = l3_total_f64;
                }
            }
        }

        if total_f64 == 0.0 {
            return Ok(0.0);
        }
        Ok((user_veqs as f64 / total_f64) * 100.0)
    }

    /// Get user's delegations count
    /// SM-002: PG-first
    pub async fn get_delegations_count(&self, address: &str) -> Result<u32, ApiError> {
        // Try Redis cache first
        let key = format!("veqs:delegations:{}", address);
        if let Ok(Some(value)) = self.redis.get(&key).await {
            if let Ok(delegations) = serde_json::from_str::<Vec<MyDelegation>>(&value) {
                return Ok(delegations.len() as u32);
            }
        }

        // PG fallback
        let rows = crate::db::TokenHubRepository::get_delegations_by_delegator(
            self.pool(), address,
        ).await?;
        Ok(rows.len() as u32)
    }

    /// Get user's pending rewards
    /// SM-002: PG-first, no mock fallback
    pub async fn get_pending_rewards(&self, address: &str) -> Result<String, ApiError> {
        // Step 1: Redis cache
        let key = format!("veqs:rewards:pending:{}", address);
        if let Ok(Some(value)) = self.redis.get(&key).await {
            return Ok(value);
        }

        // Step 2: PG – sum of finalized epoch rewards not yet claimed
        // For now, calculate from reward_claims vs reward_epochs
        let claims = crate::db::TokenHubRepository::get_reward_claims_by_wallet(
            self.pool(), address,
        ).await?;
        let claimed_epochs: std::collections::HashSet<i64> = claims.iter().map(|c| c.epoch).collect();

        let finalized = crate::db::TokenHubRepository::get_finalized_epochs(
            self.pool(), 0, 100,
        ).await?;

        use bigdecimal::ToPrimitive;
        let mut pending_total: f64 = 0.0;
        for epoch_row in &finalized {
            if !claimed_epochs.contains(&epoch_row.epoch) {
                // Simplified: user's share = epoch rewards * (user veqs / total veqs)
                // In production this would be pre-calculated per-user
                pending_total += epoch_row.total_rewards.to_f64().unwrap_or(0.0);
            }
        }

        let result = if pending_total > 0.0 {
            format!("{:.0}", pending_total)
        } else {
            "0".to_string()
        };

        // Re-cache
        let _ = self.redis.set(&key, &result, 300).await;
        Ok(result)
    }

    /// Get available delegates
    /// SM-002: PG-first – aggregates delegation data from PG
    pub async fn get_delegates(&self, _page: u32, _limit: u32, _sort_by: Option<String>) -> Result<Vec<DelegateInfo>, ApiError> {
        // Query distinct delegatees from PG delegations table
        // and aggregate their stats
        let all_delegations = sqlx::query_as::<_, crate::db::DelegationRow>(
            r#"
            SELECT delegation_id, delegator, delegatee, amount, delegated_at
            FROM delegations
            ORDER BY delegated_at DESC
            "#,
        )
        .fetch_all(self.pool())
        .await
        .map_err(|e| ApiError::Internal(format!("Database error: {}", e)))?;

        
        use std::collections::HashMap;

        let mut delegate_map: HashMap<String, (bigdecimal::BigDecimal, u32)> = HashMap::new();
        for d in &all_delegations {
            let entry = delegate_map
                .entry(d.delegatee.clone())
                .or_insert((bigdecimal::BigDecimal::from(0), 0));
            entry.0 = &entry.0 + &d.amount;
            entry.1 += 1;
        }

        let delegates: Vec<DelegateInfo> = delegate_map.into_iter().map(|(addr, (total, count))| {
            DelegateInfo {
                address: addr,
                name: None, // Names would come from a delegate registry in production
                total_veqs: total.to_string(),
                delegators_count: count,
                participation_rate: 0.0, // Would come from governance vote tracking
                recent_votes: 0,
            }
        }).collect();

        tracing::info!("get_delegates: found {} delegates from PG", delegates.len());
        Ok(delegates)
    }

    /// Get total delegates count
    /// SM-002: PG-based count
    pub async fn get_delegates_count(&self) -> Result<u32, ApiError> {
        let count: i64 = sqlx::query_scalar::<_, i64>(
            "SELECT COUNT(DISTINCT delegatee) FROM delegations",
        )
        .fetch_one(self.pool())
        .await
        .map_err(|e| ApiError::Internal(format!("Database error: {}", e)))?;
        Ok(count as u32)
    }

    /// Get user's delegations
    /// SM-002: PG-first with Redis cache
    pub async fn get_user_delegations(&self, address: &str) -> Result<Vec<MyDelegation>, ApiError> {
        // Step 1: Redis cache
        let key = format!("veqs:delegations:{}", address);
        if let Ok(Some(value)) = self.redis.get(&key).await {
            if let Ok(delegations) = serde_json::from_str::<Vec<MyDelegation>>(&value) {
                if !delegations.is_empty() {
                    return Ok(delegations);
                }
            }
        }

        // Step 2: PG fallback
        let rows = crate::db::TokenHubRepository::get_delegations_by_delegator(
            self.pool(), address,
        ).await?;

        if rows.is_empty() {
            return Ok(vec![]);
        }

        // Calculate total for percent_of_total
        use bigdecimal::ToPrimitive;
        let total: f64 = rows.iter()
            .map(|r| r.amount.to_f64().unwrap_or(0.0))
            .sum();

        let delegations: Vec<MyDelegation> = rows.into_iter().map(|r| {
            let amount_f = r.amount.to_f64().unwrap_or(0.0);
            let pct = if total > 0.0 { (amount_f / total) * 100.0 } else { 0.0 };
            MyDelegation {
                delegatee: r.delegatee,
                delegatee_name: None, // Would come from delegate registry
                veqs_amount: r.amount.to_string(),
                percent_of_total: pct,
                delegated_at: r.delegated_at.timestamp() as u64,
            }
        }).collect();

        // Re-cache
        if let Ok(json) = serde_json::to_string(&delegations) {
            let _ = self.redis.set(&key, &json, 300).await;
        }
        Ok(delegations)
    }

    /// Get user's rewards information
    /// SM-002: PG-first – builds response from reward_epochs + reward_claims tables
    pub async fn get_veqs_rewards(&self, address: &str) -> Result<TokenHubRewardsResponse, ApiError> {
        use bigdecimal::ToPrimitive;

        // Get user's claim history from PG
        let claims = crate::db::TokenHubRepository::get_reward_claims_by_wallet(
            self.pool(), address,
        ).await?;

        let claimed_epochs: std::collections::HashSet<i64> = claims.iter().map(|c| c.epoch).collect();

        // Get finalized epochs
        let finalized_epochs = crate::db::TokenHubRepository::get_finalized_epochs(
            self.pool(), 0, 100,
        ).await?;

        // Calculate claimable (finalized but not claimed)
        let mut claimable_total: f64 = 0.0;
        for epoch_row in &finalized_epochs {
            if !claimed_epochs.contains(&epoch_row.epoch) {
                claimable_total += epoch_row.total_rewards.to_f64().unwrap_or(0.0);
            }
        }

        // Calculate total claimed
        let total_claimed: f64 = claims.iter()
            .map(|c| c.amount.to_f64().unwrap_or(0.0))
            .sum();

        // Build reward history from claims
        let history: Vec<RewardHistory> = claims.iter().map(|c| {
            RewardHistory {
                epoch: c.epoch as u64,
                amount: c.amount.to_string(),
                claimed_at: Some(c.claimed_at.timestamp() as u64),
            }
        }).collect();

        // Current epoch = max finalized + 1 (or 1 if none)
        let current_epoch = finalized_epochs.first()
            .map(|e| e.epoch + 1)
            .unwrap_or(1) as u64;

        Ok(TokenHubRewardsResponse {
            claimable: format!("{:.0}", claimable_total),
            claimable_usd: format!("{:.0}", claimable_total * 5.0), // Simplified price estimate
            total_claimed: format!("{:.0}", total_claimed),
            current_epoch,
            epoch_progress: 0.0, // Would be calculated from epoch start/end times
            estimated_epoch_rewards: "0".to_string(), // Would require current epoch data
            apy: 0.0, // Would require complex calculation
            history,
        })
    }

    // ========================================================================
    // Prover Portal Methods (TASK-P5-022)
    // SEQUENCES §5: Prover Registration, §6: Prover Exit
    // ========================================================================

    /// Get prover dashboard data
    /// GET /v1/prover/dashboard
    pub async fn get_prover_dashboard(&self, prover_id: &str) -> Result<ProverDashboard, ApiError> {
        let prover = self.get_prover(prover_id).await?
            .ok_or_else(|| ApiError::ProverNotFound(prover_id.to_string()))?;

        // Get queue size
        let queue_key = format!("prover:queue:{}", prover_id);
        let queue_items: Vec<SigningQueueItem> = match self.redis.get(&queue_key).await {
            Ok(Some(v)) => serde_json::from_str(&v).unwrap_or_default(),
            _ => vec![],
        };
        let queue_size = queue_items.iter().filter(|i| i.status == QueueItemStatus::Pending).count() as u64;

        // Get metrics
        let metrics_key = format!("prover:metrics:{}", prover_id);
        let (signatures_24h, pending_rewards, total_earnings, uptime_percentage) = match self.redis.get(&metrics_key).await {
            Ok(Some(v)) => {
                let m: serde_json::Value = serde_json::from_str(&v).unwrap_or_default();
                (
                    m.get("signatures_24h").and_then(|v| v.as_u64()).unwrap_or(0),
                    m.get("pending_rewards").and_then(|v| v.as_str()).unwrap_or("0").to_string(),
                    m.get("total_earnings").and_then(|v| v.as_str()).unwrap_or("0").to_string(),
                    m.get("uptime_percentage").and_then(|v| v.as_f64()).unwrap_or(99.9),
                )
            }
            _ => (0, "0".to_string(), "0".to_string(), 99.9),
        };

        // Get active challenges count
        let challenges_key = format!("prover:challenges:{}", prover_id);
        let active_challenges: u64 = match self.redis.get(&challenges_key).await {
            Ok(Some(v)) => {
                let challenges: Vec<ChallengeInfo> = serde_json::from_str(&v).unwrap_or_default();
                challenges.iter().filter(|c| c.status == ChallengeStatus::Pending).count() as u64
            }
            _ => 0,
        };

        let slash_count = prover.slashing_history.len() as u32;
        let last_activity = chrono::Utc::now().timestamp() as u64;

        Ok(ProverDashboard {
            prover_id: prover.prover_id,
            status: prover.status,
            stake_amount: prover.stake_amount,
            total_signatures: prover.total_signatures,
            signatures_24h,
            pending_rewards,
            total_earnings,
            queue_size,
            active_challenges,
            slash_count,
            uptime_percentage,
            last_activity,
        })
    }

    /// Get signing queue for a prover
    /// GET /v1/prover/queue
    /// SM-002: Redis cache → PG fallback → re-cache
    pub async fn get_signing_queue(&self, prover_id: &str) -> Result<SigningQueueResponse, ApiError> {
        // Step 1: Try Redis cache first
        let queue_key = format!("prover:queue:{}", prover_id);
        if let Ok(Some(v)) = self.redis.get(&queue_key).await {
            if let Ok(items) = serde_json::from_str::<Vec<SigningQueueItem>>(&v) {
                let pending_count = items.iter().filter(|i| i.status == QueueItemStatus::Pending).count();
                let total = items.len();
                return Ok(SigningQueueResponse { items, total, pending_count });
            }
        }

        // Step 2: PG fallback via SigningQueueRepository
        tracing::debug!("Redis cache miss for signing queue, falling back to PG, prover_id={}", prover_id);
        let rows = crate::db::SigningQueueRepository::get_by_prover(self.pool(), prover_id, None).await?;
        let now = chrono::Utc::now().timestamp() as u64;

        let items: Vec<SigningQueueItem> = rows.iter().map(|row| {
            let deadline_remaining = row.deadline.map(|exp| {
                let exp_ts = exp.timestamp() as u64;
                if exp_ts > now { (exp_ts - now) as i64 } else { 0 }
            }).unwrap_or(0);

            SigningQueueItem {
                queue_id: row.queue_id.clone(),
                unlock_id: row.unlock_id.clone().unwrap_or_default(),
                lock_id: row.lock_id.clone(),
                amount: "0".to_string(), // Will be populated from lock data if needed
                asset: "ETH".to_string(),
                sr_0: row.sr_0.clone().unwrap_or_default(),
                sr_1: row.sr_1.clone().unwrap_or_default(),
                requested_at: row.created_at.map(|t| t.timestamp() as u64).unwrap_or(0),
                deadline_remaining,
                priority: 2,
                status: match row.status.as_deref().unwrap_or("pending") {
                    "pending" => QueueItemStatus::Pending,
                    "processing" => QueueItemStatus::Processing,
                    "signed" => QueueItemStatus::Signed,
                    "failed" => QueueItemStatus::Failed,
                    "expired" => QueueItemStatus::Expired,
                    _ => QueueItemStatus::Pending,
                },
            }
        }).collect();

        // Step 3: Re-cache in Redis
        if let Ok(json) = serde_json::to_string(&items) {
            let _ = self.redis.set(&queue_key, &json, 300).await; // 5 min cache
        }

        let pending_count = items.iter().filter(|i| i.status == QueueItemStatus::Pending).count();
        let total = items.len();

        Ok(SigningQueueResponse { items, total, pending_count })
    }

    /// Get single queue item
    /// GET /v1/prover/queue/:id
    /// SM-002: Try cache first via get_signing_queue, then direct PG lookup
    pub async fn get_queue_item(&self, prover_id: &str, queue_id: &str) -> Result<Option<SigningQueueItem>, ApiError> {
        // Try cache path first
        let queue = self.get_signing_queue(prover_id).await?;
        if let Some(item) = queue.items.into_iter().find(|i| i.queue_id == queue_id) {
            return Ok(Some(item));
        }

        // Direct PG lookup as fallback
        let row = crate::db::SigningQueueRepository::get_by_id(self.pool(), queue_id).await?;
        Ok(row.map(|r| {
            let now = chrono::Utc::now().timestamp() as u64;
            let deadline_remaining = r.deadline.map(|exp| {
                let exp_ts = exp.timestamp() as u64;
                if exp_ts > now { (exp_ts - now) as i64 } else { 0 }
            }).unwrap_or(0);

            SigningQueueItem {
                queue_id: r.queue_id,
                unlock_id: r.unlock_id.unwrap_or_default(),
                lock_id: r.lock_id,
                amount: "0".to_string(),
                asset: "ETH".to_string(),
                sr_0: r.sr_0.unwrap_or_default(),
                sr_1: r.sr_1.unwrap_or_default(),
                requested_at: r.created_at.map(|t| t.timestamp() as u64).unwrap_or(0),
                deadline_remaining,
                priority: 2,
                status: match r.status.as_deref().unwrap_or("pending") {
                    "pending" => QueueItemStatus::Pending,
                    "processing" => QueueItemStatus::Processing,
                    "signed" => QueueItemStatus::Signed,
                    "failed" => QueueItemStatus::Failed,
                    "expired" => QueueItemStatus::Expired,
                    _ => QueueItemStatus::Pending,
                },
            }
        }))
    }

    /// Store a queue item for prover
    /// SM-001: PG first → Redis cache invalidation
    pub async fn store_queue_item(&self, prover_id: &str, item: &SigningQueueItem) -> Result<(), ApiError> {
        let status_str = match item.status {
            QueueItemStatus::Pending => "pending",
            QueueItemStatus::Processing => "processing",
            QueueItemStatus::Signed => "signed",
            QueueItemStatus::Failed => "failed",
            QueueItemStatus::Expired => "expired",
        };

        // Step 1: PG upsert via SigningQueueRepository
        // If item exists, update its status; otherwise create it
        let expires_at = if item.deadline_remaining > 0 {
            Some(chrono::Utc::now() + chrono::Duration::seconds(item.deadline_remaining))
        } else {
            None
        };

        crate::db::SigningQueueRepository::create(
            self.pool(),
            &item.queue_id,
            &item.unlock_id,
            prover_id,
            &item.lock_id,
            &item.sr_0,
            &item.sr_1,
            expires_at,
        ).await?;

        // Update status if not pending (create defaults to pending)
        if status_str != "pending" {
            crate::db::SigningQueueRepository::update_status(
                self.pool(),
                &item.queue_id,
                status_str,
            ).await?;
        }

        tracing::info!("store_queue_item: PG upsert completed, queue_id={}", item.queue_id);

        // Step 2: Invalidate Redis cache
        let queue_key = format!("prover:queue:{}", prover_id);
        let _ = self.redis.del(&queue_key).await;

        Ok(())
    }

    /// Submit prover signature
    /// POST /v1/prover/sign
    /// SM-001: PG first for queue update, signature storage, metrics update
    pub async fn submit_prover_signature(
        &self,
        prover_id: &str,
        req: &ProverSignRequest,
    ) -> Result<ProverSignResponse, ApiError> {
        // Get queue item (SM-002: Redis → PG fallback)
        let item = self.get_queue_item(prover_id, &req.queue_id).await?
            .ok_or_else(|| ApiError::NotFound(format!("Queue item not found: {}", req.queue_id)))?;

        // Validate signature format (SPHINCS+-128s: 7856 bytes)
        SphincsService::validate_signature_format(&req.sphincs_signature)
            .map_err(|e| ApiError::InvalidSignature(format!("Invalid SPHINCS+ signature: {}", e)))?;

        // Step 1: Update signing_queue status in PG
        crate::db::SigningQueueRepository::update_status(
            self.pool(), &req.queue_id, "signed"
        ).await?;
        tracing::info!("submit_prover_signature: signing_queue updated to signed, queue_id={}", req.queue_id);

        // Step 1b: Ensure unlock_request exists (FK constraint on unlock_prover_signatures)
        // Some signing_queue items may reference unlock_ids not yet in unlock_requests
        let user_addr: String = sqlx::query_scalar(
            "SELECT user_address FROM signing_queue WHERE queue_id = $1"
        )
        .bind(&req.queue_id)
        .fetch_optional(self.pool())
        .await
        .map_err(|e| ApiError::Internal(format!("DB error: {}", e)))?
        .unwrap_or_default();

        if !user_addr.is_empty() {
            crate::db::UserRepository::ensure_exists(self.pool(), &user_addr.to_lowercase()).await?;
            let amount_bd = item.amount.parse::<bigdecimal::BigDecimal>()
                .unwrap_or_else(|_| bigdecimal::BigDecimal::from(0));
            let dest_bytes = hex::decode(user_addr.trim_start_matches("0x"))
                .unwrap_or_else(|_| user_addr.as_bytes().to_vec());
            sqlx::query(
                r#"
                INSERT INTO unlock_requests (unlock_id, lock_id, wallet_address, dest_addr, amount, sig_dilithium, sr_0, sr_1, status)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
                ON CONFLICT (unlock_id) DO NOTHING
                "#,
            )
            .bind(&item.unlock_id)
            .bind(&item.lock_id)
            .bind(&user_addr.to_lowercase())
            .bind(&dest_bytes)
            .bind(&amount_bd)
            .bind(&[0u8; 1] as &[u8]) // placeholder sig
            .bind(&item.sr_0)
            .bind(&item.sr_1)
            .execute(self.pool())
            .await
            .map_err(|e| ApiError::Internal(format!("Failed to ensure unlock_request: {}", e)))?;
            tracing::info!("submit_prover_signature: ensured unlock_request exists for unlock_id={}", item.unlock_id);
        }

        // Step 2: Store signature in unlock_prover_signatures table (PG)
        // Use last 8 chars of prover_id to avoid collision (provers have unique suffix like ...0001, ...0002)
        let prover_suffix: String = prover_id.chars().rev().take(8).collect::<String>().chars().rev().collect();
        let sig_id = format!("sig_{}_{}", item.unlock_id.chars().take(16).collect::<String>(), prover_suffix);
        let sig_bytes = hex::decode(req.sphincs_signature.trim_start_matches("0x")).unwrap_or_default();
        sqlx::query(
            r#"
            INSERT INTO unlock_prover_signatures (signature_id, unlock_id, prover_id, sig_sphincs, sr_0, sr_1)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (unlock_id, prover_id) DO UPDATE SET sig_sphincs = $4
            "#,
        )
        .bind(&sig_id)
        .bind(&item.unlock_id)
        .bind(prover_id)
        .bind(&sig_bytes)
        .bind(&item.sr_0)
        .bind(&item.sr_1)
        .execute(self.pool())
        .await
        .map_err(|e| ApiError::Internal(format!("Failed to store signature: {}", e)))?;
        tracing::info!("submit_prover_signature: signature stored in PG, sig_id={}", sig_id);

        // Step 3: Update prover_metrics in PG
        crate::db::ProverRepository::upsert_metrics(self.pool(), prover_id, 1).await?;
        tracing::info!("submit_prover_signature: metrics updated in PG, prover_id={}", prover_id);

        // Step 4: Invalidate Redis caches
        let queue_key = format!("prover:queue:{}", prover_id);
        let prover_key = format!("prover:{}", prover_id);
        let metrics_key = format!("prover:metrics:{}", prover_id);
        let _ = self.redis.del(&queue_key).await;
        let _ = self.redis.del(&prover_key).await;
        let _ = self.redis.del(&metrics_key).await;

        // Get signature count for this unlock
        let sig_count: i64 = sqlx::query_scalar::<_, i64>(
            "SELECT COUNT(*) FROM unlock_prover_signatures WHERE unlock_id = $1"
        )
        .bind(&item.unlock_id)
        .fetch_one(self.pool())
        .await
        .unwrap_or(1);

        // Step 5: If required signatures (2/5) reached, trigger L1 requestUnlock
        if sig_count >= 2 {
            tracing::info!(
                "Required signatures reached ({}/2) for unlock_id={}, triggering L1 requestUnlock",
                sig_count, item.unlock_id
            );

            if let Some(ref l1_vault) = self.l1_vault {
                // Collect all signatures and prover addresses for this unlock
                let sig_rows: Vec<(Vec<u8>, String)> = sqlx::query_as(
                    "SELECT sig_sphincs, prover_id FROM unlock_prover_signatures WHERE unlock_id = $1"
                )
                .bind(&item.unlock_id)
                .fetch_all(self.pool())
                .await
                .unwrap_or_default();

                let sphincs_signatures: Vec<ethers::prelude::Bytes> = sig_rows.iter()
                    .map(|(sig, _)| ethers::prelude::Bytes::from(sig.clone()))
                    .collect();
                let signing_provers: Vec<ethers::prelude::Address> = sig_rows.iter()
                    .filter_map(|(_, addr)| addr.parse().ok())
                    .collect();

                // Get recipient address from unlock_requests
                let recipient: String = sqlx::query_scalar::<_, String>(
                    "SELECT wallet_address FROM unlock_requests WHERE unlock_id = $1"
                )
                .bind(&item.unlock_id)
                .fetch_one(self.pool())
                .await
                .unwrap_or_else(|_| "0x0000000000000000000000000000000000000000".to_string());

                // SMT proof (empty for now - full SMT integration in Phase 2)
                let smt_proof: Vec<[u8; 32]> = Vec::new();

                match l1_vault.request_unlock(
                    &item.lock_id,
                    &recipient,
                    smt_proof,
                    &item.sr_1,
                    sphincs_signatures,
                    signing_provers,
                ).await {
                    Ok(tx_hash) => {
                        tracing::info!(
                            l1_tx_hash = %tx_hash,
                            unlock_id = %item.unlock_id,
                            "L1 requestUnlock submitted successfully"
                        );
                        // Update unlock status to pending_timelock
                        let _ = sqlx::query(
                            "UPDATE unlock_requests SET status = 'pending_timelock', l1_tx_hash = $1 WHERE unlock_id = $2"
                        )
                        .bind(format!("{:?}", tx_hash))
                        .bind(&item.unlock_id)
                        .execute(self.pool())
                        .await;
                    }
                    Err(e) => {
                        tracing::error!(
                            error = %e,
                            unlock_id = %item.unlock_id,
                            "L1 requestUnlock failed - signatures collected but L1 submission failed"
                        );
                    }
                }
            } else {
                tracing::info!("L1 Vault not configured - skipping L1 requestUnlock");
            }
        }

        // Calculate reward per signature: 10 QS (SEQUENCES.md §9.4)
        // Reward currency is QS Token (not ETH). Actual value from ProverRewardPool in Phase 8-D.
        let reward = "10000000000000000000".to_string(); // 10 QS (10 * 1e18)

        Ok(ProverSignResponse {
            queue_id: req.queue_id.clone(),
            unlock_id: item.unlock_id,
            signature_accepted: true,
            total_signatures: sig_count as u32,
            required_signatures: 2, // 2/5 Prover requirement
            reward_earned: reward,
        })
    }

    /// Get prover metrics
    /// GET /v1/prover/metrics
    /// SM-002: Redis cache → PG fallback → re-cache
    pub async fn get_prover_metrics(&self, prover_id: &str) -> Result<ProverMetrics, ApiError> {
        let prover = self.get_prover(prover_id).await?
            .ok_or_else(|| ApiError::ProverNotFound(prover_id.to_string()))?;

        // Step 1: Try Redis cache
        let metrics_key = format!("prover:metrics:{}", prover_id);
        if let Ok(Some(v)) = self.redis.get(&metrics_key).await {
            if let Ok(cached) = serde_json::from_str::<ProverMetrics>(&v) {
                return Ok(cached);
            }
        }

        // Step 2: PG fallback via ProverRepository
        tracing::debug!("Redis cache miss for prover metrics, falling back to PG, prover_id={}", prover_id);
        let metrics_row = crate::db::ProverRepository::get_metrics(self.pool(), prover_id).await?;

        // Get total provers count for ranking
        let total_provers = crate::db::ProverRepository::count_by_status(self.pool(), Some("active")).await.unwrap_or(0) as u32;
        let rank = 1u32; // Simplified ranking

        // Get slashing data
        let slash_count = prover.slashing_history.len() as u32;
        let total_slashed: String = prover.slashing_history.iter()
            .map(|e| e.amount.parse::<u128>().unwrap_or(0))
            .sum::<u128>()
            .to_string();

        let metrics = match metrics_row {
            Some(row) => ProverMetrics {
                total_signatures: row.total_signatures as u64,
                signatures_24h: row.signatures_24h as u64,
                signatures_7d: row.signatures_7d as u64,
                avg_response_time_ms: row.avg_response_time_ms as u64,
                success_rate: row.success_rate,
                uptime_percentage: row.uptime_percentage,
                total_rewards: row.total_rewards.to_string(),
                rewards_30d: "0".to_string(), // Not tracked in DB yet
                slash_count,
                total_slashed,
                rank,
                total_provers,
            },
            None => ProverMetrics {
                total_signatures: prover.total_signatures,
                signatures_24h: 0,
                signatures_7d: 0,
                avg_response_time_ms: 0,
                success_rate: 100.0,
                uptime_percentage: 100.0,
                total_rewards: "0".to_string(),
                rewards_30d: "0".to_string(),
                slash_count,
                total_slashed,
                rank,
                total_provers,
            },
        };

        // Step 3: Re-cache in Redis
        if let Ok(json) = serde_json::to_string(&metrics) {
            let _ = self.redis.set(&metrics_key, &json, 300).await; // 5 min cache
        }

        Ok(metrics)
    }

    /// Get prover alerts
    /// GET /v1/prover/alerts
    pub async fn get_prover_alerts(&self, prover_id: &str) -> Result<ProverAlertsResponse, ApiError> {
        let alerts_key = format!("prover:alerts:{}", prover_id);
        let alerts: Vec<ProverAlert> = match self.redis.get(&alerts_key).await {
            Ok(Some(v)) => serde_json::from_str(&v).unwrap_or_default(),
            _ => vec![],
        };

        let unacknowledged_count = alerts.iter().filter(|a| !a.acknowledged).count();
        let total = alerts.len();

        Ok(ProverAlertsResponse {
            alerts,
            total,
            unacknowledged_count,
        })
    }

    /// Store a prover alert
    pub async fn store_prover_alert(&self, prover_id: &str, alert: &ProverAlert) -> Result<(), ApiError> {
        let alerts_key = format!("prover:alerts:{}", prover_id);
        let mut alerts: Vec<ProverAlert> = match self.redis.get(&alerts_key).await {
            Ok(Some(v)) => serde_json::from_str(&v).unwrap_or_default(),
            _ => vec![],
        };

        alerts.push(alert.clone());

        // Keep only last 100 alerts
        let len = alerts.len();
        if len > 100 {
            alerts = alerts.into_iter().skip(len - 100).collect();
        }

        let value = serde_json::to_string(&alerts).map_err(|e| ApiError::Internal(e.to_string()))?;
        self.redis.set(&alerts_key, &value, 86400 * 30).await.map_err(|e| ApiError::Internal(e.to_string()))
    }

    /// Get challenges for a prover
    /// GET /v1/prover/challenges
    /// SM-002: Redis cache → PG fallback → re-cache
    pub async fn get_prover_challenges(&self, prover_id: &str) -> Result<ProverChallengesResponse, ApiError> {
        // Step 1: Try Redis cache
        let challenges_key = format!("prover:challenges:{}", prover_id);
        if let Ok(Some(v)) = self.redis.get(&challenges_key).await {
            if let Ok(challenge_infos) = serde_json::from_str::<Vec<ChallengeInfo>>(&v) {
                let now = chrono::Utc::now().timestamp() as u64;
                let challenges: Vec<ProverChallengeItem> = challenge_infos.iter().map(|c| {
                    let time_remaining = if c.defense_deadline > now {
                        (c.defense_deadline - now) as i64
                    } else { 0 };
                    ProverChallengeItem {
                        challenge_id: c.challenge_id.clone(),
                        lock_id: c.lock_id.clone(),
                        challenger: c.challenger.clone(),
                        challenged_at: c.challenged_at,
                        defense_deadline: c.defense_deadline,
                        time_remaining,
                        status: c.status,
                        potential_slash: c.bond.clone(),
                        defense_submitted: c.defense_proof_hash.is_some(),
                    }
                }).collect();
                let pending_count = challenges.iter().filter(|c| c.status == ChallengeStatus::Pending).count();
                let total = challenges.len();
                return Ok(ProverChallengesResponse { challenges, total, pending_count });
            }
        }

        // Step 2: PG fallback - query challenges where this prover is the defender
        tracing::debug!("Redis cache miss for prover challenges, falling back to PG, prover_id={}", prover_id);

        // Look up the prover's operator address to find challenges where they are the defender
        let prover_row = crate::db::ProverRepository::get_by_id(self.pool(), prover_id).await?;
        let challenge_rows = if let Some(row) = prover_row {
            // Query challenges where this prover's operator_addr is the defender
            sqlx::query_as::<_, crate::db::ChallengeRow>(
                r#"
                SELECT challenge_id, lock_id, unlock_id, challenger, fraud_proof_hash,
                       bond, challenged_at, defense_deadline, status, defender, defense_proof_hash,
                       resolved_at
                FROM challenges
                WHERE defender = $1
                ORDER BY challenged_at DESC
                "#,
            )
            .bind(&row.operator_addr)
            .fetch_all(self.pool())
            .await
            .unwrap_or_default()
        } else {
            vec![]
        };

        let now = chrono::Utc::now().timestamp() as u64;
        let challenges: Vec<ProverChallengeItem> = challenge_rows.iter().map(|row| {
            let defense_deadline_ts = row.defense_deadline.timestamp() as u64;
            let time_remaining = if defense_deadline_ts > now {
                (defense_deadline_ts - now) as i64
            } else { 0 };

            let status = match row.status.as_str() {
                "pending" => ChallengeStatus::Pending,
                "defense_submitted" => ChallengeStatus::DefenseSubmitted,
                "resolved_valid" => ChallengeStatus::ResolvedValid,
                "resolved_invalid" => ChallengeStatus::ResolvedInvalid,
                _ => ChallengeStatus::Pending,
            };

            ProverChallengeItem {
                challenge_id: row.challenge_id.clone(),
                lock_id: row.lock_id.clone(),
                challenger: row.challenger.clone(),
                challenged_at: row.challenged_at.timestamp() as u64,
                defense_deadline: defense_deadline_ts,
                time_remaining,
                status,
                potential_slash: row.bond.to_string(),
                defense_submitted: row.defense_proof_hash.is_some(),
            }
        }).collect();

        let pending_count = challenges.iter().filter(|c| c.status == ChallengeStatus::Pending).count();
        let total = challenges.len();

        Ok(ProverChallengesResponse { challenges, total, pending_count })
    }

    /// Store challenge for prover tracking
    pub async fn store_prover_challenge(&self, prover_id: &str, challenge: &ChallengeInfo) -> Result<(), ApiError> {
        let challenges_key = format!("prover:challenges:{}", prover_id);
        let mut challenges: Vec<ChallengeInfo> = match self.redis.get(&challenges_key).await {
            Ok(Some(v)) => serde_json::from_str(&v).unwrap_or_default(),
            _ => vec![],
        };

        // Update or add challenge
        if let Some(pos) = challenges.iter().position(|c| c.challenge_id == challenge.challenge_id) {
            challenges[pos] = challenge.clone();
        } else {
            challenges.push(challenge.clone());
        }

        let value = serde_json::to_string(&challenges).map_err(|e| ApiError::Internal(e.to_string()))?;
        self.redis.set(&challenges_key, &value, 86400 * 30).await.map_err(|e| ApiError::Internal(e.to_string()))
    }

    /// Submit challenge response (defense)
    /// POST /v1/prover/challenge-response
    pub async fn submit_prover_challenge_response(
        &self,
        prover_id: &str,
        req: &ProverChallengeResponseRequest,
    ) -> Result<ProverChallengeResponseResult, ApiError> {
        // Get challenge
        let challenge_key = format!("challenge:{}", req.challenge_id);
        let challenge_value = self.redis.get(&challenge_key).await
            .map_err(|e| ApiError::Internal(e.to_string()))?
            .ok_or_else(|| ApiError::ChallengeNotFound(req.challenge_id.clone()))?;

        let mut challenge: ChallengeInfo = serde_json::from_str(&challenge_value)
            .map_err(|e| ApiError::Internal(e.to_string()))?;

        // Check deadline
        let now = chrono::Utc::now().timestamp() as u64;
        if now > challenge.defense_deadline {
            return Err(ApiError::Forbidden("Defense deadline has passed".into()));
        }

        // Update challenge with defense
        challenge.status = ChallengeStatus::DefenseSubmitted;
        challenge.defender = Some(prover_id.to_string());
        challenge.defense_proof_hash = Some(sha3_hash(&req.defense_proof));

        let new_value = serde_json::to_string(&challenge).map_err(|e| ApiError::Internal(e.to_string()))?;
        self.redis.set(&challenge_key, &new_value, 86400 * 30).await
            .map_err(|e| ApiError::Internal(e.to_string()))?;

        // Update prover's challenge tracking
        self.store_prover_challenge(prover_id, &challenge).await?;

        Ok(ProverChallengeResponseResult {
            challenge_id: req.challenge_id.clone(),
            status: ChallengeStatus::DefenseSubmitted,
            defense_accepted: true,
            message: "Defense submitted successfully. Awaiting arbitration.".to_string(),
        })
    }

    /// Initiate prover exit
    /// POST /v1/prover/exit
    /// SEQUENCES §6: 7-day unbonding period
    /// SM-001: PG first → Redis cache invalidation
    pub async fn initiate_prover_exit(
        &self,
        prover_id: &str,
        _req: &ProverExitRequest,
    ) -> Result<ProverExitResponse, ApiError> {
        let prover = self.get_prover(prover_id).await?
            .ok_or_else(|| ApiError::ProverNotFound(prover_id.to_string()))?;

        // Check if prover can exit (not already exiting, no pending challenges)
        if prover.status == ProverStatus::Exiting || prover.status == ProverStatus::Exited {
            return Err(ApiError::Forbidden("Prover is already exiting or has exited".into()));
        }

        // Check for pending challenges
        let challenges = self.get_prover_challenges(prover_id).await?;
        if challenges.pending_count > 0 {
            return Err(ApiError::Forbidden("Cannot exit with pending challenges".into()));
        }

        // Calculate unbonding period (7 days per SEQUENCES §6)
        let now = chrono::Utc::now();
        let unbonding_days = 7u32;
        let unbonding_end_dt = now + chrono::Duration::days(unbonding_days as i64);

        // Prepare exit record data
        // exit_id must fit in VARCHAR(66), so truncate prover_id to keep total <= 66 chars
        let prefix = "exit_";
        let max_id_len = 66 - prefix.len();
        let truncated_id = if prover_id.len() > max_id_len {
            &prover_id[..max_id_len]
        } else {
            prover_id
        };
        let exit_id = format!("{}{}", prefix, truncated_id);
        let stake_amount = bigdecimal::BigDecimal::from_str(&prover.stake_amount)
            .unwrap_or_else(|_| bigdecimal::BigDecimal::from(0));

        // Get pending rewards from metrics
        let metrics_row = crate::db::ProverRepository::get_metrics(self.pool(), prover_id).await?;
        let pending_rewards_bd = metrics_row
            .map(|m| m.total_rewards)
            .unwrap_or_else(|| bigdecimal::BigDecimal::from(0));
        let pending_rewards = pending_rewards_bd.to_string();

        // Step 1+2: Update status AND create exit record in a single transaction
        // This prevents inconsistency where status changes but exit record is missing
        let mut tx = self.pool().begin().await.map_err(|e| {
            tracing::warn!("initiate_prover_exit: failed to begin transaction: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        sqlx::query("UPDATE provers SET status = 'exiting' WHERE prover_id = $1")
            .bind(prover_id)
            .execute(&mut *tx)
            .await
            .map_err(|e| {
                tracing::warn!("initiate_prover_exit: failed to update prover status: {}", e);
                ApiError::Internal(format!("Database error: {}", e))
            })?;
        tracing::info!("initiate_prover_exit: prover status updated to exiting, prover_id={}", prover_id);

        let pending_rewards_bd2 = bigdecimal::BigDecimal::from_str(&pending_rewards)
            .unwrap_or_else(|_| bigdecimal::BigDecimal::from(0));
        sqlx::query(
            r#"
            INSERT INTO prover_exits (exit_id, prover_id, unbonding_end, stake_to_return, pending_rewards, status)
            VALUES ($1, $2, $3, $4, $5, 'unbonding')
            ON CONFLICT (prover_id) DO UPDATE SET
                unbonding_end = $3,
                stake_to_return = $4,
                pending_rewards = $5,
                status = 'unbonding',
                initiated_at = NOW()
            "#,
        )
        .bind(&exit_id)
        .bind(prover_id)
        .bind(unbonding_end_dt)
        .bind(&stake_amount)
        .bind(&pending_rewards_bd2)
        .execute(&mut *tx)
        .await
        .map_err(|e| {
            tracing::warn!("initiate_prover_exit: failed to create exit record: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;
        tracing::info!("initiate_prover_exit: exit record created in PG, exit_id={}", exit_id);

        tx.commit().await.map_err(|e| {
            tracing::warn!("initiate_prover_exit: failed to commit transaction: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        // Step 3: Invalidate Redis caches
        let prover_key = format!("prover:{}", prover_id);
        let exit_key = format!("prover:exit:{}", prover_id);
        let _ = self.redis.del(&prover_key).await;
        let _ = self.redis.del(&exit_key).await;

        // Step 4: L1 ProverRegistry.requestExit() — conditional on feature flag
        if self.config.l1.mode != "mock" {
            if let Some(ref registry) = self.l1_prover_registry {
                let prover_id_bytes = l1_prover_registry::hex_to_bytes32_or_zero(prover_id);
                match registry.request_exit(prover_id_bytes).await {
                    Ok(tx_hash) => {
                        tracing::info!(
                            l1_tx_hash = %tx_hash,
                            "L1 ProverRegistry.requestExit() submitted for prover={}",
                            prover_id
                        );
                    }
                    Err(e) => {
                        tracing::warn!(
                            "L1 ProverRegistry.requestExit() failed (best-effort): {}",
                            e
                        );
                    }
                }
            }
        }

        let now_ts = now.timestamp() as u64;
        let unbonding_end_ts = unbonding_end_dt.timestamp() as u64;

        Ok(ProverExitResponse {
            prover_id: prover_id.to_string(),
            status: ProverStatus::Exiting,
            exit_initiated_at: now_ts,
            unbonding_end: unbonding_end_ts,
            unbonding_days,
            stake_to_return: prover.stake_amount,
            pending_rewards,
        })
    }

    /// Get prover exit status
    /// GET /v1/prover/:prover_id/exit-status
    /// SEQUENCES §6: Prover Exit - Status tracking during unbonding
    /// SM-002: PG-first read for exit data
    pub async fn get_prover_exit_status(
        &self,
        prover_id: &str,
    ) -> Result<ProverExitStatusResponse, ApiError> {
        let prover = self.get_prover(prover_id).await?
            .ok_or_else(|| ApiError::ProverNotFound(prover_id.to_string()))?;

        // Step 1: Get exit info from PG (Source of Truth)
        let exit_row = crate::db::ProverRepository::get_exit(self.pool(), prover_id).await?;

        let now = chrono::Utc::now().timestamp() as u64;

        let (exit_initiated_at, unbonding_end) = match &exit_row {
            Some(row) => (
                Some(row.initiated_at.timestamp() as u64),
                Some(row.unbonding_end.timestamp() as u64),
            ),
            None => (None, None),
        };

        // Calculate unbonding remaining time
        let unbonding_remaining = unbonding_end.map(|end| {
            if now >= end { 0i64 } else { (end - now) as i64 }
        });

        // Check for pending challenges (blocks withdrawal even after unbonding)
        let challenges = self.get_prover_challenges(prover_id).await?;
        let has_pending_challenges = challenges.pending_count > 0;
        let pending_challenge_count = challenges.pending_count as u32;

        // Determine if withdrawal is allowed
        let can_withdraw = prover.status == ProverStatus::Exiting
            && unbonding_remaining.map_or(false, |r| r <= 0)
            && !has_pending_challenges;

        // Get pending rewards from PG
        let pending_rewards = exit_row
            .as_ref()
            .map(|row| row.pending_rewards.to_string())
            .unwrap_or_else(|| "0".to_string());

        let stake_to_return = exit_row
            .as_ref()
            .map(|row| row.stake_to_return.to_string())
            .unwrap_or_else(|| prover.stake_amount.clone());

        Ok(ProverExitStatusResponse {
            prover_id: prover_id.to_string(),
            status: prover.status,
            exit_initiated_at,
            unbonding_end,
            unbonding_remaining,
            can_withdraw,
            stake_to_return,
            pending_rewards,
            has_pending_challenges,
            pending_challenge_count,
        })
    }

    /// Withdraw prover stake after unbonding
    /// POST /v1/prover/:prover_id/withdraw
    /// SEQUENCES §6: Prover Exit - Step 4-5 (Stake withdrawal)
    /// SM-001: PG first → Redis cache invalidation
    pub async fn withdraw_prover_stake(
        &self,
        prover_id: &str,
        req: &ProverWithdrawRequest,
    ) -> Result<ProverWithdrawResponse, ApiError> {
        // Get exit status to verify eligibility (SM-002: reads from PG)
        let exit_status = self.get_prover_exit_status(prover_id).await?;

        // Verify withdrawal is allowed
        if !exit_status.can_withdraw {
            if exit_status.status != ProverStatus::Exiting {
                return Err(ApiError::Forbidden("Prover has not initiated exit".into()));
            }
            if exit_status.unbonding_remaining.map_or(true, |r| r > 0) {
                let remaining_days = exit_status.unbonding_remaining.unwrap_or(0) / 86400;
                return Err(ApiError::Forbidden(format!(
                    "Unbonding period not complete. {} days remaining.",
                    remaining_days
                )));
            }
            if exit_status.has_pending_challenges {
                return Err(ApiError::Forbidden(format!(
                    "Cannot withdraw with {} pending challenges. Resolve challenges first.",
                    exit_status.pending_challenge_count
                )));
            }
        }

        // Validate destination address format
        if !req.destination_address.starts_with("0x") || req.destination_address.len() != 42 {
            return Err(ApiError::InvalidRequest("Invalid destination address format".into()));
        }

        // Calculate total to return
        let stake: u128 = exit_status.stake_to_return.parse().unwrap_or(0);
        let rewards: u128 = exit_status.pending_rewards.parse().unwrap_or(0);
        let total = stake + rewards;

        // Step 1: Update prover status to Exited in PG
        self.update_prover_status(prover_id, ProverStatus::Exited).await?;
        tracing::info!("withdraw_prover_stake: prover status updated to exited, prover_id={}", prover_id);

        // Step 2: Update exit record status in PG
        crate::db::ProverRepository::update_exit_status(self.pool(), prover_id, "withdrawn").await?;
        tracing::info!("withdraw_prover_stake: exit status updated to withdrawn, prover_id={}", prover_id);

        // Step 3: Invalidate all Redis caches for this prover
        let exit_key = format!("prover:exit:{}", prover_id);
        let prover_key = format!("prover:{}", prover_id);
        let metrics_key = format!("prover:metrics:{}", prover_id);
        let _ = self.redis.del(&exit_key).await;
        let _ = self.redis.del(&prover_key).await;
        let _ = self.redis.del(&metrics_key).await;

        let now = chrono::Utc::now().timestamp() as u64;

        // Step 4: L1 ProverRegistry.executeExit() — conditional on feature flag
        let l1_tx_hash: Option<String> = if self.config.l1.mode != "mock" {
            if let Some(ref registry) = self.l1_prover_registry {
                let prover_id_bytes = l1_prover_registry::hex_to_bytes32_or_zero(prover_id);
                match registry.execute_exit(prover_id_bytes).await {
                    Ok(tx_hash) => {
                        tracing::info!(
                            l1_tx_hash = %tx_hash,
                            "L1 ProverRegistry.executeExit() submitted for prover={}",
                            prover_id
                        );
                        Some(format!("{:?}", tx_hash))
                    }
                    Err(e) => {
                        tracing::warn!(
                            "L1 ProverRegistry.executeExit() failed (best-effort): {}",
                            e
                        );
                        None
                    }
                }
            } else {
                None
            }
        } else {
            None
        };

        // Notify L1 for actual fund transfer (in production, only if L1 call didn't handle it)
        if l1_tx_hash.is_none() {
            let msg = serde_json::json!({
                "type": "PROVER_WITHDRAW",
                "prover_id": prover_id,
                "destination_address": req.destination_address,
                "amount": total.to_string(),
            });
            self.rabbitmq.publish("l1_relay", &msg.to_string()).await
                .map_err(|e| ApiError::Internal(e.to_string()))?;
        }

        tracing::info!(
            "Prover stake withdrawn: prover_id={}, destination={}, total={}, l1_tx={}",
            prover_id,
            req.destination_address,
            total,
            l1_tx_hash.as_deref().unwrap_or("none")
        );

        Ok(ProverWithdrawResponse {
            prover_id: prover_id.to_string(),
            status: ProverStatus::Exited,
            stake_returned: exit_status.stake_to_return,
            rewards_returned: exit_status.pending_rewards,
            total_returned: total.to_string(),
            destination_address: req.destination_address.clone(),
            l1_tx_hash,
            withdrawn_at: now,
        })
    }

    /// Update prover status
    /// SM-001: PG first → Redis cache invalidation
    pub async fn update_prover_status(&self, prover_id: &str, status: ProverStatus) -> Result<(), ApiError> {
        let status_str = match status {
            ProverStatus::Active => "active",
            ProverStatus::Inactive => "inactive",
            ProverStatus::Exiting => "exiting",
            ProverStatus::Exited => "exited",
            ProverStatus::Slashed => "slashed",
            ProverStatus::PendingApproval => "pending_approval",
        };

        // Step 1: PG update (Source of Truth)
        crate::db::ProverRepository::update_status(self.pool(), prover_id, status_str).await?;
        tracing::info!("update_prover_status: PG updated, prover_id={}, status={}", prover_id, status_str);

        // Step 2: Invalidate Redis cache (force re-read from PG on next access)
        let prover_key = format!("prover:{}", prover_id);
        let _ = self.redis.del(&prover_key).await;

        Ok(())
    }

    // Governance methods removed - implemented directly in routes::governance

    // ========================================================================
    // Observer API methods (TASK-P5-019 Extension: Registration)
    // ========================================================================

    /// Store observer (Dual-Write: PG first, then Redis cache)
    /// SM-001: PG is Source of Truth, Redis is cache
    pub async fn store_observer(&self, observer: &crate::types::Observer) -> Result<(), ApiError> {
        // Step 0: Ensure user exists (FK constraint on observers.wallet_address)
        crate::db::UserRepository::ensure_exists(self.pool(), &observer.operator_addr).await?;

        // Step 1: PG INSERT (Source of Truth)
        crate::db::ObserverRepository::create(
            self.pool(), &observer.observer_id, &observer.operator_addr, None,
        ).await?;
        tracing::info!("Observer stored in PG: {}", observer.observer_id);

        // Step 2: Redis cache (for fast access)
        let key = format!("observer:{}", observer.observer_id);
        let value = serde_json::to_string(observer).map_err(|e| ApiError::Internal(e.to_string()))?;
        let _ = self.redis.set(&key, &value, 0).await;

        // Store mapping by address
        let addr_key = format!("observer:addr:{}", observer.operator_addr);
        let _ = self.redis.set(&addr_key, &observer.observer_id, 0).await;

        tracing::info!("Stored observer: {} for address: {}", observer.observer_id, observer.operator_addr);
        Ok(())
    }

    /// Get observer by ID (PG-first with Redis cache)
    /// SM-002: Redis cache → PG fallback → re-cache
    pub async fn get_observer(&self, observer_id: &str) -> Result<Option<crate::types::Observer>, ApiError> {
        // Step 1: Try Redis cache
        let key = format!("observer:{}", observer_id);
        if let Ok(Some(value)) = self.redis.get(&key).await {
            if let Ok(observer) = serde_json::from_str::<crate::types::Observer>(&value) {
                return Ok(Some(observer));
            }
        }

        // Step 2: PG fallback (Source of Truth)
        let row = crate::db::ObserverRepository::get_by_id(self.pool(), observer_id).await?;
        match row {
            Some(r) => {
                let status = match r.status.as_str() {
                    "pending_approval" => crate::types::ObserverStatus::PendingApproval,
                    "active" => crate::types::ObserverStatus::Active,
                    "inactive" => crate::types::ObserverStatus::Inactive,
                    "suspended" => crate::types::ObserverStatus::Suspended,
                    _ => crate::types::ObserverStatus::PendingApproval,
                };
                let observer = crate::types::Observer {
                    observer_id: r.observer_id.clone(),
                    operator_addr: r.wallet_address.clone(),
                    status,
                    stake_amount: None,
                    registered_at: r.registered_at.timestamp() as u64,
                    total_challenges: (r.successful_challenges + r.failed_challenges) as u32,
                    successful_challenges: r.successful_challenges as u32,
                    total_earnings: r.total_earnings.to_string(),
                };

                // Step 3: Re-cache in Redis
                if let Ok(value) = serde_json::to_string(&observer) {
                    let _ = self.redis.set(&key, &value, 0).await;
                    let addr_key = format!("observer:addr:{}", r.wallet_address);
                    let _ = self.redis.set(&addr_key, &r.observer_id, 0).await;
                }

                Ok(Some(observer))
            }
            None => Ok(None),
        }
    }

    /// Get observer by operator address (PG-first with Redis cache)
    /// SM-002: Redis cache → PG fallback
    pub async fn get_observer_by_address(&self, address: &str) -> Result<Option<crate::types::Observer>, ApiError> {
        // Step 1: Try Redis cache
        let addr_key = format!("observer:addr:{}", address);
        if let Ok(Some(observer_id)) = self.redis.get(&addr_key).await {
            if let Some(observer) = self.get_observer(&observer_id).await? {
                return Ok(Some(observer));
            }
        }

        // Step 2: PG fallback
        let row = crate::db::ObserverRepository::get_by_wallet(self.pool(), address).await?;
        match row {
            Some(r) => {
                // Use get_observer which handles conversion + re-cache
                self.get_observer(&r.observer_id).await
            }
            None => Ok(None),
        }
    }

    /// Update observer status (Dual-Write: PG first, then Redis cache)
    /// SM-001: PG is Source of Truth
    pub async fn update_observer_status(&self, observer_id: &str, status: crate::types::ObserverStatus) -> Result<(), ApiError> {
        // Step 1: PG UPDATE (Source of Truth)
        let status_str = match status {
            crate::types::ObserverStatus::PendingApproval => "pending_approval",
            crate::types::ObserverStatus::Active => "active",
            crate::types::ObserverStatus::Inactive => "inactive",
            crate::types::ObserverStatus::Suspended => "suspended",
        };
        crate::db::ObserverRepository::update_status(self.pool(), observer_id, status_str).await?;

        // Step 2: Update Redis cache
        if let Some(mut observer) = self.get_observer(observer_id).await? {
            observer.status = status;
            let key = format!("observer:{}", observer_id);
            if let Ok(value) = serde_json::to_string(&observer) {
                let _ = self.redis.set(&key, &value, 0).await;
            }
        }
        Ok(())
    }

    /// Get all observers (for admin) - PG-first (eliminates KEYS scan)
    /// SM-002: PG is Source of Truth
    pub async fn get_all_observers(&self) -> Result<Vec<crate::types::Observer>, ApiError> {
        // PG query (Source of Truth) - no KEYS scan needed
        let rows = crate::db::ObserverRepository::list_observers(self.pool(), None, 0, 100).await?;

        let observers: Vec<crate::types::Observer> = rows.iter().map(|r| {
            let status = match r.status.as_str() {
                "pending_approval" => crate::types::ObserverStatus::PendingApproval,
                "active" => crate::types::ObserverStatus::Active,
                "inactive" => crate::types::ObserverStatus::Inactive,
                "suspended" => crate::types::ObserverStatus::Suspended,
                _ => crate::types::ObserverStatus::PendingApproval,
            };
            crate::types::Observer {
                observer_id: r.observer_id.clone(),
                operator_addr: r.wallet_address.clone(),
                status,
                stake_amount: None,
                registered_at: r.registered_at.timestamp() as u64,
                total_challenges: (r.successful_challenges + r.failed_challenges) as u32,
                successful_challenges: r.successful_challenges as u32,
                total_earnings: r.total_earnings.to_string(),
            }
        }).collect();

        Ok(observers)
    }

    /// Get pending observers (for admin approval) - PG-first
    /// SM-002: PG query with status filter
    pub async fn get_pending_observers(&self) -> Result<Vec<crate::types::Observer>, ApiError> {
        let rows = crate::db::ObserverRepository::list_observers(
            self.pool(), Some("pending_approval"), 0, 100
        ).await?;

        Ok(rows.iter().map(|r| crate::types::Observer {
            observer_id: r.observer_id.clone(),
            operator_addr: r.wallet_address.clone(),
            status: crate::types::ObserverStatus::PendingApproval,
            stake_amount: None,
            registered_at: r.registered_at.timestamp() as u64,
            total_challenges: (r.successful_challenges + r.failed_challenges) as u32,
            successful_challenges: r.successful_challenges as u32,
            total_earnings: r.total_earnings.to_string(),
        }).collect())
    }
}

/// Helper: Format veQS lock remaining duration
fn format_veqs_duration(seconds: u64) -> String {
    let years = seconds / (365 * 24 * 60 * 60);
    let months = (seconds % (365 * 24 * 60 * 60)) / (30 * 24 * 60 * 60);
    let days = (seconds % (30 * 24 * 60 * 60)) / (24 * 60 * 60);
    if years > 0 {
        if months > 0 { format!("{}Y {}M", years, months) } else { format!("{}Y", years) }
    } else if months > 0 {
        if days > 0 { format!("{}M {}D", months, days) } else { format!("{}M", months) }
    } else {
        format!("{}D", days.max(1))
    }
}

/// Helper: SHA3-256 hash for proof hashing
fn sha3_hash(data: &str) -> String {
    use sha3::{Sha3_256, Digest};
    let mut hasher = Sha3_256::new();
    hasher.update(data.as_bytes());
    format!("0x{}", hex::encode(hasher.finalize()))
}
