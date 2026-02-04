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
pub mod admin_l3_ops;
pub mod bridge_verifier;
pub mod treasury_vault;
pub mod l3_l1_bridge;

use anyhow::Result;
use sqlx::PgPool;

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
pub use vrf_service::{VRFService, VRFError};
pub use sphincs_service::{SphincsService, SphincsError, SPHINCS_PUBLIC_KEY_BYTES, SPHINCS_SIGNATURE_BYTES};
pub use auth_service::AuthService;
pub use l3_client::{L3Client, L3Config, L3HealthStatus, L3Transaction, L3TxReceipt, L3TxStatus, L3TxType};
pub use l1_client::{L1Client, L1Config, L1Error, L1Monitor, TxStatus, SEPOLIA_CHAIN_ID};
pub use admin_l3_ops::{AdminL3OpsService, TreasuryTransferRequest, TreasuryTransferResult, ProverApprovalRequest, ProverApprovalResult, ProverApprovalAction};
pub use bridge_verifier::{BridgeVerifierService, VerificationStatus, BridgeVerificationResult};
pub use treasury_vault::{TreasuryVaultService, TreasuryBalance, TreasuryWithdrawRequest, TreasuryWithdrawResult, Withdrawal, WithdrawalStatus};
pub use l3_l1_bridge::{L3L1BridgeService, E2EOperationStatus, E2EOperationResult, E2ETreasuryWithdrawRequest};
pub use smt_service::{SmtService, SmtProof, SmtLeaf};

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
        })
    }

    /// Get database pool reference
    pub fn pool(&self) -> &PgPool {
        self.db.pool()
    }

    pub async fn is_nonce_used(&self, pk: &str, nonce: u64) -> Result<bool, ApiError> {
        let key = format!("nonce:{}:{}", pk, nonce);
        self.redis.exists(&key).await.map_err(|e| ApiError::Internal(e.to_string()))
    }

    pub async fn mark_nonce_used(&self, pk: &str, nonce: u64) -> Result<(), ApiError> {
        let key = format!("nonce:{}:{}", pk, nonce);
        self.redis.set(&key, "1", 86400 * 30).await.map_err(|e| ApiError::Internal(e.to_string()))
    }

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
            // Store user's Dilithium public key for signature verification during unlock
            user_public_key: req.pk_dilithium.clone(),
        };
        let key = format!("lock:{}", lock_id);
        let value = serde_json::to_string(&lock).map_err(|e| ApiError::Internal(e.to_string()))?;
        self.redis.set(&key, &value, 86400 * 365).await.map_err(|e| ApiError::Internal(e.to_string()))
    }

    pub async fn get_lock(&self, lock_id: &str) -> Result<Option<Lock>, ApiError> {
        let key = format!("lock:{}", lock_id);
        match self.redis.get(&key).await {
            Ok(Some(value)) => Ok(Some(serde_json::from_str(&value).map_err(|e| ApiError::Internal(e.to_string()))?)),
            Ok(None) => Ok(None),
            Err(e) => Err(ApiError::Internal(e.to_string())),
        }
    }

    pub async fn update_lock_status(&self, lock_id: &str, status: LockStatus, release_time: Option<u64>) -> Result<(), ApiError> {
        if let Some(mut lock) = self.get_lock(lock_id).await? {
            lock.status = status;
            lock.release_time = release_time;
            lock.is_emergency = matches!(status, LockStatus::EmergencyPending);
            let key = format!("lock:{}", lock_id);
            let value = serde_json::to_string(&lock).map_err(|e| ApiError::Internal(e.to_string()))?;
            self.redis.set(&key, &value, 86400 * 365).await.map_err(|e| ApiError::Internal(e.to_string()))?;
        }
        Ok(())
    }

    pub async fn get_pending_locks(&self) -> Result<Vec<Lock>, ApiError> { Ok(vec![]) }

    pub async fn notify_lock_created(&self, lock_id: &str) -> Result<(), ApiError> {
        let msg = serde_json::json!({"type": "LOCK_CREATED", "lock_id": lock_id});
        self.rabbitmq.publish("event_bridge", &msg.to_string()).await.map_err(|e| ApiError::Internal(e.to_string()))
    }

    pub async fn request_prover_signatures(&self, unlock_id: &str, lock_id: &str, sr_0: &str, sr_1: &str) -> Result<(), ApiError> {
        let msg = serde_json::json!({"type": "SIG_REQ", "unlock_id": unlock_id, "lock_id": lock_id, "sr_0": sr_0, "sr_1": sr_1});
        self.rabbitmq.publish("sig_queue", &msg.to_string()).await.map_err(|e| ApiError::Internal(e.to_string()))
    }

    pub async fn store_prover(&self, prover_id: &str, req: &ProverRegisterRequest) -> Result<(), ApiError> {
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
        self.redis.set(&key, &value, 0).await.map_err(|e| ApiError::Internal(e.to_string()))
    }

    pub async fn get_prover(&self, prover_id: &str) -> Result<Option<ProverInfoResponse>, ApiError> {
        let key = format!("prover:{}", prover_id);
        match self.redis.get(&key).await {
            Ok(Some(value)) => Ok(Some(serde_json::from_str(&value).map_err(|e| ApiError::Internal(e.to_string()))?)),
            Ok(None) => Ok(None),
            Err(e) => Err(ApiError::Internal(e.to_string())),
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

    /// Store a new challenge
    pub async fn store_challenge(
        &self,
        challenge_id: &str,
        lock_id: &str,
        challenger: &str,
        fraud_proof_hash: &str,
        bond: &str,
        defense_deadline: u64,
    ) -> Result<(), ApiError> {
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
        self.redis.set(&key, &value, 86400 * 30).await.map_err(|e| ApiError::Internal(e.to_string()))?;
        self.redis.set(&lock_key, challenge_id, 86400 * 30).await.map_err(|e| ApiError::Internal(e.to_string()))
    }

    /// Get challenge by lock_id
    pub async fn get_challenge_by_lock_id(&self, lock_id: &str) -> Result<Option<ChallengeInfo>, ApiError> {
        let lock_key = format!("challenge:lock:{}", lock_id);
        let challenge_id = match self.redis.get(&lock_key).await {
            Ok(Some(id)) => id,
            Ok(None) => return Ok(None),
            Err(e) => return Err(ApiError::Internal(e.to_string())),
        };
        let key = format!("challenge:{}", challenge_id);
        match self.redis.get(&key).await {
            Ok(Some(value)) => Ok(Some(serde_json::from_str(&value).map_err(|e| ApiError::Internal(e.to_string()))?)),
            Ok(None) => Ok(None),
            Err(e) => Err(ApiError::Internal(e.to_string())),
        }
    }

    /// Submit defense for a challenge
    pub async fn submit_defense(
        &self,
        challenge_id: &str,
        defender: &str,
        defense_proof_hash: &str,
    ) -> Result<(), ApiError> {
        let key = format!("challenge:{}", challenge_id);
        let value = self.redis.get(&key).await.map_err(|e| ApiError::Internal(e.to_string()))?
            .ok_or_else(|| ApiError::ChallengeNotFound(challenge_id.to_string()))?;
        let mut challenge: ChallengeInfo = serde_json::from_str(&value).map_err(|e| ApiError::Internal(e.to_string()))?;
        challenge.status = ChallengeStatus::DefenseSubmitted;
        challenge.defender = Some(defender.to_string());
        challenge.defense_proof_hash = Some(defense_proof_hash.to_string());
        let new_value = serde_json::to_string(&challenge).map_err(|e| ApiError::Internal(e.to_string()))?;
        self.redis.set(&key, &new_value, 86400 * 30).await.map_err(|e| ApiError::Internal(e.to_string()))
    }

    /// Resolve a challenge (after deadline or arbitration)
    pub async fn resolve_challenge(
        &self,
        challenge_id: &str,
        challenge_valid: bool,
        slash_amount: &str,
        challenger_reward: &str,
        insurance_amount: &str,
        burn_amount: &str,
    ) -> Result<(), ApiError> {
        let key = format!("challenge:{}", challenge_id);
        let value = self.redis.get(&key).await.map_err(|e| ApiError::Internal(e.to_string()))?
            .ok_or_else(|| ApiError::ChallengeNotFound(challenge_id.to_string()))?;
        let mut challenge: ChallengeInfo = serde_json::from_str(&value).map_err(|e| ApiError::Internal(e.to_string()))?;
        challenge.status = if challenge_valid { ChallengeStatus::ResolvedValid } else { ChallengeStatus::ResolvedInvalid };
        let new_value = serde_json::to_string(&challenge).map_err(|e| ApiError::Internal(e.to_string()))?;
        self.redis.set(&key, &new_value, 86400 * 30).await.map_err(|e| ApiError::Internal(e.to_string()))?;

        // Log the resolution for audit trail
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
        self.redis.set(&resolution_key, &resolution.to_string(), 86400 * 365).await.map_err(|e| ApiError::Internal(e.to_string()))
    }

    // ========================================================================
    // VRF Methods (SEQUENCES §2.3-§2.4)
    // ========================================================================

    /// Store VRF request in Redis
    pub async fn store_vrf_request(&self, request: &VRFRequest) -> Result<(), ApiError> {
        let key = format!("vrf:{}", request.vrf_request_id);
        let unlock_key = format!("vrf:unlock:{}", request.unlock_request_id);
        let value = serde_json::to_string(request).map_err(|e| ApiError::Internal(e.to_string()))?;

        // Store VRF request
        self.redis.set(&key, &value, 86400).await.map_err(|e| ApiError::Internal(e.to_string()))?;

        // Map unlock_request_id -> vrf_request_id
        self.redis.set(&unlock_key, &request.vrf_request_id, 86400).await.map_err(|e| ApiError::Internal(e.to_string()))
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

    /// Update VRF request status
    pub async fn update_vrf_status(
        &self,
        vrf_request_id: &str,
        status: VRFStatus,
        selected_prover: Option<&str>,
        random_value: Option<&str>,
    ) -> Result<(), ApiError> {
        let key = format!("vrf:{}", vrf_request_id);
        let value = self.redis.get(&key).await.map_err(|e| ApiError::Internal(e.to_string()))?
            .ok_or_else(|| ApiError::Internal(format!("VRF request not found: {}", vrf_request_id)))?;

        let mut request: VRFRequest = serde_json::from_str(&value).map_err(|e| ApiError::Internal(e.to_string()))?;
        request.status = status;
        request.selected_prover = selected_prover.map(|s| s.to_string());
        request.random_value = random_value.map(|s| s.to_string());

        let new_value = serde_json::to_string(&request).map_err(|e| ApiError::Internal(e.to_string()))?;
        self.redis.set(&key, &new_value, 86400).await.map_err(|e| ApiError::Internal(e.to_string()))
    }

    /// Request prover signatures for selected provers only
    /// SEQUENCES §2.4: Only selected provers sign
    pub async fn request_selected_prover_signatures(
        &self,
        unlock_id: &str,
        lock_id: &str,
        sr_0: &str,
        sr_1: &str,
        selected_prover: &str,
    ) -> Result<(), ApiError> {
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
    pub async fn get_user_locks(&self, user_address: &str) -> Result<Vec<Lock>, ApiError> {
        // Get all lock keys for this user
        let pattern = format!("lock:*");
        let keys = self.redis.scan(&pattern).await.map_err(|e| ApiError::Internal(e.to_string()))?;

        let mut user_locks = Vec::new();
        for key in keys {
            if let Ok(Some(value)) = self.redis.get(&key).await {
                if let Ok(lock) = serde_json::from_str::<Lock>(&value) {
                    // Filter by owner address, user_public_key, OR dest_addr (wallet address)
                    // dest_addr is the user's Ethereum wallet address from the lock request
                    if lock.owner == user_address
                        || lock.user_public_key == user_address
                        || lock.dest_addr.to_lowercase() == user_address.to_lowercase() {
                        user_locks.push(lock);
                    }
                }
            }
        }

        // Sort by created_at descending
        user_locks.sort_by(|a, b| b.created_at.cmp(&a.created_at));

        Ok(user_locks)
    }

    /// Get user settings
    pub async fn get_user_settings(&self, user_address: &str) -> Result<Option<crate::types::UserSettingsResponse>, ApiError> {
        let key = format!("user:settings:{}", user_address);
        match self.redis.get(&key).await {
            Ok(Some(value)) => Ok(Some(serde_json::from_str(&value).map_err(|e| ApiError::Internal(e.to_string()))?)),
            Ok(None) => Ok(None),
            Err(e) => Err(ApiError::Internal(e.to_string())),
        }
    }

    /// Store user settings
    pub async fn store_user_settings(&self, user_address: &str, settings: &crate::types::UserSettingsResponse) -> Result<(), ApiError> {
        let key = format!("user:settings:{}", user_address);
        let value = serde_json::to_string(settings).map_err(|e| ApiError::Internal(e.to_string()))?;
        self.redis.set(&key, &value, 0).await.map_err(|e| ApiError::Internal(e.to_string()))
    }

    /// Get user's registered Dilithium public key
    pub async fn get_user_dilithium_key(&self, user_address: &str) -> Result<Option<(String, u64)>, ApiError> {
        let key = format!("user:dilithium:{}", user_address);
        match self.redis.get(&key).await {
            Ok(Some(value)) => {
                // Format: "public_key:timestamp"
                let parts: Vec<&str> = value.splitn(2, ':').collect();
                if parts.len() == 2 {
                    let pk = parts[0].to_string();
                    let timestamp = parts[1].parse::<u64>().unwrap_or(0);
                    Ok(Some((pk, timestamp)))
                } else {
                    Ok(Some((value, 0)))
                }
            }
            Ok(None) => Ok(None),
            Err(e) => Err(ApiError::Internal(e.to_string())),
        }
    }

    /// Store user's Dilithium public key
    pub async fn store_user_dilithium_key(&self, user_address: &str, public_key: &str) -> Result<(), ApiError> {
        let key = format!("user:dilithium:{}", user_address);
        let timestamp = chrono::Utc::now().timestamp() as u64;
        let value = format!("{}:{}", public_key, timestamp);
        self.redis.set(&key, &value, 0).await.map_err(|e| ApiError::Internal(e.to_string()))
    }

    // ========================================================================
    // Token Hub (veQS) Methods (TASK-P5-021)
    // ========================================================================

    /// Get user's veQS lock position
    pub async fn get_veqs_lock(&self, address: &str) -> Result<Option<LockPosition>, ApiError> {
        let key = format!("veqs:lock:{}", address);
        match self.redis.get(&key).await {
            Ok(Some(value)) => Ok(Some(serde_json::from_str(&value).map_err(|e| ApiError::Internal(e.to_string()))?)),
            Ok(None) => Ok(None),
            Err(e) => Err(ApiError::Internal(e.to_string())),
        }
    }

    /// Store user's veQS lock position
    pub async fn store_veqs_lock(&self, address: &str, lock: &LockPosition) -> Result<(), ApiError> {
        let key = format!("veqs:lock:{}", address);
        let value = serde_json::to_string(lock).map_err(|e| ApiError::Internal(e.to_string()))?;
        self.redis.set(&key, &value, 0).await.map_err(|e| ApiError::Internal(e.to_string()))
    }

    /// Get user's veQS lock history
    pub async fn get_veqs_lock_history(&self, address: &str) -> Result<Vec<HistoricalLock>, ApiError> {
        let key = format!("veqs:history:{}", address);
        match self.redis.get(&key).await {
            Ok(Some(value)) => Ok(serde_json::from_str(&value).unwrap_or_default()),
            Ok(None) => Ok(vec![]),
            Err(e) => Err(ApiError::Internal(e.to_string())),
        }
    }

    /// Get user's QS token balance (mock - would call L1 contract)
    pub async fn get_qs_balance(&self, address: &str) -> Result<String, ApiError> {
        // In production: Call QS token contract balanceOf(address)
        let key = format!("qs:balance:{}", address);
        match self.redis.get(&key).await {
            Ok(Some(value)) => Ok(value),
            Ok(None) => Ok("12450".to_string()), // Default mock balance
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
    pub async fn get_voting_power_percent(&self, address: &str) -> Result<f64, ApiError> {
        let user_veqs = self.get_veqs_balance(address).await?;
        if user_veqs == 0 {
            return Ok(0.0);
        }
        // Mock total supply - in production: Call veQS.getTotalVotingPower()
        let total_veqs: u128 = 5_000_000;
        Ok((user_veqs as f64 / total_veqs as f64) * 100.0)
    }

    /// Get user's delegations count
    pub async fn get_delegations_count(&self, address: &str) -> Result<u32, ApiError> {
        let key = format!("veqs:delegations:{}", address);
        match self.redis.get(&key).await {
            Ok(Some(value)) => {
                let delegations: Vec<MyDelegation> = serde_json::from_str(&value).unwrap_or_default();
                Ok(delegations.len() as u32)
            }
            Ok(None) => Ok(0),
            Err(e) => Err(ApiError::Internal(e.to_string())),
        }
    }

    /// Get user's pending rewards
    pub async fn get_pending_rewards(&self, address: &str) -> Result<String, ApiError> {
        let key = format!("veqs:rewards:pending:{}", address);
        match self.redis.get(&key).await {
            Ok(Some(value)) => Ok(value),
            Ok(None) => Ok("847".to_string()), // Mock pending rewards
            Err(e) => Err(ApiError::Internal(e.to_string())),
        }
    }

    /// Get available delegates
    pub async fn get_delegates(&self, _page: u32, _limit: u32, _sort_by: Option<String>) -> Result<Vec<DelegateInfo>, ApiError> {
        // In production: Query from indexed data or contract
        // Return mock delegates for now
        Ok(vec![
            DelegateInfo {
                address: "0x1234567890abcdef1234567890abcdef12345678".to_string(),
                name: Some("渡辺 Delegate".to_string()),
                total_veqs: "285000".to_string(),
                delegators_count: 45,
                participation_rate: 98.5,
                recent_votes: 12,
            },
            DelegateInfo {
                address: "0xabcdef1234567890abcdef1234567890abcdef12".to_string(),
                name: Some("佐藤 Crypto".to_string()),
                total_veqs: "198000".to_string(),
                delegators_count: 32,
                participation_rate: 95.0,
                recent_votes: 11,
            },
            DelegateInfo {
                address: "0x7890abcdef1234567890abcdef1234567890abcd".to_string(),
                name: Some("田中 DeFi".to_string()),
                total_veqs: "156000".to_string(),
                delegators_count: 28,
                participation_rate: 92.3,
                recent_votes: 10,
            },
        ])
    }

    /// Get total delegates count
    pub async fn get_delegates_count(&self) -> Result<u32, ApiError> {
        // In production: Query actual count
        Ok(3)
    }

    /// Get user's delegations
    pub async fn get_user_delegations(&self, address: &str) -> Result<Vec<MyDelegation>, ApiError> {
        let key = format!("veqs:delegations:{}", address);
        match self.redis.get(&key).await {
            Ok(Some(value)) => Ok(serde_json::from_str(&value).unwrap_or_default()),
            Ok(None) => {
                // Return mock delegations
                Ok(vec![
                    MyDelegation {
                        delegatee: "0x1234567890abcdef1234567890abcdef12345678".to_string(),
                        delegatee_name: Some("渡辺 Delegate".to_string()),
                        veqs_amount: "3000".to_string(),
                        percent_of_total: 48.0,
                        delegated_at: 1704067200,
                    },
                    MyDelegation {
                        delegatee: "0xabcdef1234567890abcdef1234567890abcdef12".to_string(),
                        delegatee_name: Some("佐藤 Crypto".to_string()),
                        veqs_amount: "2000".to_string(),
                        percent_of_total: 32.0,
                        delegated_at: 1704153600,
                    },
                ])
            }
            Err(e) => Err(ApiError::Internal(e.to_string())),
        }
    }

    /// Get user's rewards information
    pub async fn get_veqs_rewards(&self, _address: &str) -> Result<TokenHubRewardsResponse, ApiError> {
        // In production: Query from rewards contract
        Ok(TokenHubRewardsResponse {
            claimable: "847".to_string(),
            claimable_usd: "4235".to_string(),
            total_claimed: "2500".to_string(),
            current_epoch: 15,
            epoch_progress: 0.65,
            estimated_epoch_rewards: "120".to_string(),
            apy: 12.5,
            history: vec![
                RewardHistory {
                    epoch: 14,
                    amount: "110".to_string(),
                    claimed_at: Some(1704067200),
                },
                RewardHistory {
                    epoch: 13,
                    amount: "105".to_string(),
                    claimed_at: Some(1703462400),
                },
                RewardHistory {
                    epoch: 12,
                    amount: "98".to_string(),
                    claimed_at: Some(1702857600),
                },
            ],
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
    pub async fn get_signing_queue(&self, prover_id: &str) -> Result<SigningQueueResponse, ApiError> {
        let queue_key = format!("prover:queue:{}", prover_id);
        let items: Vec<SigningQueueItem> = match self.redis.get(&queue_key).await {
            Ok(Some(v)) => serde_json::from_str(&v).unwrap_or_default(),
            _ => vec![],
        };

        let pending_count = items.iter().filter(|i| i.status == QueueItemStatus::Pending).count();
        let total = items.len();

        Ok(SigningQueueResponse {
            items,
            total,
            pending_count,
        })
    }

    /// Get single queue item
    /// GET /v1/prover/queue/:id
    pub async fn get_queue_item(&self, prover_id: &str, queue_id: &str) -> Result<Option<SigningQueueItem>, ApiError> {
        let queue = self.get_signing_queue(prover_id).await?;
        Ok(queue.items.into_iter().find(|i| i.queue_id == queue_id))
    }

    /// Store a queue item for prover
    pub async fn store_queue_item(&self, prover_id: &str, item: &SigningQueueItem) -> Result<(), ApiError> {
        let queue_key = format!("prover:queue:{}", prover_id);
        let mut items: Vec<SigningQueueItem> = match self.redis.get(&queue_key).await {
            Ok(Some(v)) => serde_json::from_str(&v).unwrap_or_default(),
            _ => vec![],
        };

        // Update or add item
        if let Some(pos) = items.iter().position(|i| i.queue_id == item.queue_id) {
            items[pos] = item.clone();
        } else {
            items.push(item.clone());
        }

        let value = serde_json::to_string(&items).map_err(|e| ApiError::Internal(e.to_string()))?;
        self.redis.set(&queue_key, &value, 86400 * 7).await.map_err(|e| ApiError::Internal(e.to_string()))
    }

    /// Submit prover signature
    /// POST /v1/prover/sign
    pub async fn submit_prover_signature(
        &self,
        prover_id: &str,
        req: &ProverSignRequest,
    ) -> Result<ProverSignResponse, ApiError> {
        // Get queue item
        let mut item = self.get_queue_item(prover_id, &req.queue_id).await?
            .ok_or_else(|| ApiError::NotFound(format!("Queue item not found: {}", req.queue_id)))?;

        // Validate signature format (SPHINCS+-128s: 7856 bytes)
        SphincsService::validate_signature_format(&req.sphincs_signature)
            .map_err(|e| ApiError::InvalidSignature(format!("Invalid SPHINCS+ signature: {}", e)))?;

        // Update queue item status
        item.status = QueueItemStatus::Signed;
        self.store_queue_item(prover_id, &item).await?;

        // Store signature
        let sig_key = format!("sig:{}:{}", item.unlock_id, prover_id);
        let sig_data = serde_json::json!({
            "prover_id": prover_id,
            "signature": req.sphincs_signature,
            "timestamp": chrono::Utc::now().timestamp(),
        });
        self.redis.set(&sig_key, &sig_data.to_string(), 86400 * 30).await
            .map_err(|e| ApiError::Internal(e.to_string()))?;

        // Update prover stats
        if let Some(mut prover) = self.get_prover(prover_id).await? {
            prover.total_signatures += 1;
            let prover_key = format!("prover:{}", prover_id);
            let value = serde_json::to_string(&prover).map_err(|e| ApiError::Internal(e.to_string()))?;
            self.redis.set(&prover_key, &value, 0).await.map_err(|e| ApiError::Internal(e.to_string()))?;
        }

        // Calculate reward (0.01% of amount)
        let reward = "10000000000000000".to_string(); // 0.01 ETH default

        Ok(ProverSignResponse {
            queue_id: req.queue_id.clone(),
            unlock_id: item.unlock_id,
            signature_accepted: true,
            total_signatures: 1,
            required_signatures: 2, // 2/5 Prover requirement
            reward_earned: reward,
        })
    }

    /// Get prover metrics
    /// GET /v1/prover/metrics
    pub async fn get_prover_metrics(&self, prover_id: &str) -> Result<ProverMetrics, ApiError> {
        let prover = self.get_prover(prover_id).await?
            .ok_or_else(|| ApiError::ProverNotFound(prover_id.to_string()))?;

        let metrics_key = format!("prover:metrics:{}", prover_id);
        let metrics: serde_json::Value = match self.redis.get(&metrics_key).await {
            Ok(Some(v)) => serde_json::from_str(&v).unwrap_or_default(),
            _ => serde_json::json!({}),
        };

        // Get total provers count for ranking
        let total_provers = 10u32; // TODO: implement actual count
        let rank = 1u32; // TODO: implement actual ranking

        Ok(ProverMetrics {
            total_signatures: prover.total_signatures,
            signatures_24h: metrics.get("signatures_24h").and_then(|v| v.as_u64()).unwrap_or(0),
            signatures_7d: metrics.get("signatures_7d").and_then(|v| v.as_u64()).unwrap_or(0),
            avg_response_time_ms: metrics.get("avg_response_time_ms").and_then(|v| v.as_u64()).unwrap_or(500),
            success_rate: metrics.get("success_rate").and_then(|v| v.as_f64()).unwrap_or(99.5),
            uptime_percentage: metrics.get("uptime_percentage").and_then(|v| v.as_f64()).unwrap_or(99.9),
            total_rewards: metrics.get("total_rewards").and_then(|v| v.as_str()).unwrap_or("0").to_string(),
            rewards_30d: metrics.get("rewards_30d").and_then(|v| v.as_str()).unwrap_or("0").to_string(),
            slash_count: prover.slashing_history.len() as u32,
            total_slashed: prover.slashing_history.iter()
                .map(|e| e.amount.parse::<u128>().unwrap_or(0))
                .sum::<u128>()
                .to_string(),
            rank,
            total_provers,
        })
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
    pub async fn get_prover_challenges(&self, prover_id: &str) -> Result<ProverChallengesResponse, ApiError> {
        let challenges_key = format!("prover:challenges:{}", prover_id);
        let challenge_infos: Vec<ChallengeInfo> = match self.redis.get(&challenges_key).await {
            Ok(Some(v)) => serde_json::from_str(&v).unwrap_or_default(),
            _ => vec![],
        };

        let now = chrono::Utc::now().timestamp() as u64;
        let challenges: Vec<ProverChallengeItem> = challenge_infos.iter().map(|c| {
            let time_remaining = if c.defense_deadline > now {
                (c.defense_deadline - now) as i64
            } else {
                0
            };

            ProverChallengeItem {
                challenge_id: c.challenge_id.clone(),
                lock_id: c.lock_id.clone(),
                challenger: c.challenger.clone(),
                challenged_at: c.challenged_at,
                defense_deadline: c.defense_deadline,
                time_remaining,
                status: c.status,
                potential_slash: c.bond.clone(), // Simplified: use bond as potential slash
                defense_submitted: c.defense_proof_hash.is_some(),
            }
        }).collect();

        let pending_count = challenges.iter().filter(|c| c.status == ChallengeStatus::Pending).count();
        let total = challenges.len();

        Ok(ProverChallengesResponse {
            challenges,
            total,
            pending_count,
        })
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
    pub async fn initiate_prover_exit(
        &self,
        prover_id: &str,
        _req: &ProverExitRequest,
    ) -> Result<ProverExitResponse, ApiError> {
        let mut prover = self.get_prover(prover_id).await?
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

        // Update prover status to Exiting
        prover.status = ProverStatus::Exiting;
        let prover_key = format!("prover:{}", prover_id);
        let value = serde_json::to_string(&prover).map_err(|e| ApiError::Internal(e.to_string()))?;
        self.redis.set(&prover_key, &value, 0).await.map_err(|e| ApiError::Internal(e.to_string()))?;

        // Calculate unbonding period (7 days per SEQUENCES §6)
        let now = chrono::Utc::now().timestamp() as u64;
        let unbonding_days = 7u32;
        let unbonding_end = now + (unbonding_days as u64 * 24 * 60 * 60);

        // Store exit info
        let exit_key = format!("prover:exit:{}", prover_id);
        let exit_data = serde_json::json!({
            "initiated_at": now,
            "unbonding_end": unbonding_end,
            "stake_amount": prover.stake_amount,
        });
        self.redis.set(&exit_key, &exit_data.to_string(), 86400 * 14).await
            .map_err(|e| ApiError::Internal(e.to_string()))?;

        // Get pending rewards
        let metrics_key = format!("prover:metrics:{}", prover_id);
        let pending_rewards: String = match self.redis.get(&metrics_key).await {
            Ok(Some(v)) => {
                let m: serde_json::Value = serde_json::from_str(&v).unwrap_or_default();
                m.get("pending_rewards").and_then(|v| v.as_str()).unwrap_or("0").to_string()
            }
            _ => "0".to_string(),
        };

        Ok(ProverExitResponse {
            prover_id: prover_id.to_string(),
            status: ProverStatus::Exiting,
            exit_initiated_at: now,
            unbonding_end,
            unbonding_days,
            stake_to_return: prover.stake_amount,
            pending_rewards,
        })
    }

    /// Get prover exit status
    /// GET /v1/prover/:prover_id/exit-status
    /// SEQUENCES §6: Prover Exit - Status tracking during unbonding
    pub async fn get_prover_exit_status(
        &self,
        prover_id: &str,
    ) -> Result<ProverExitStatusResponse, ApiError> {
        let prover = self.get_prover(prover_id).await?
            .ok_or_else(|| ApiError::ProverNotFound(prover_id.to_string()))?;

        // Get exit info
        let exit_key = format!("prover:exit:{}", prover_id);
        let exit_data: Option<serde_json::Value> = match self.redis.get(&exit_key).await {
            Ok(Some(v)) => serde_json::from_str(&v).ok(),
            _ => None,
        };

        let now = chrono::Utc::now().timestamp() as u64;

        // Extract exit data if exists
        let (exit_initiated_at, unbonding_end) = match &exit_data {
            Some(data) => (
                data.get("initiated_at").and_then(|v| v.as_u64()),
                data.get("unbonding_end").and_then(|v| v.as_u64()),
            ),
            None => (None, None),
        };

        // Calculate unbonding remaining time
        let unbonding_remaining = unbonding_end.map(|end| {
            if now >= end {
                0i64
            } else {
                (end - now) as i64
            }
        });

        // Check for pending challenges (blocks withdrawal even after unbonding)
        let challenges = self.get_prover_challenges(prover_id).await?;
        let has_pending_challenges = challenges.pending_count > 0;
        let pending_challenge_count = challenges.pending_count as u32;

        // Determine if withdrawal is allowed
        // Can withdraw when: Exiting status + unbonding complete + no pending challenges
        let can_withdraw = prover.status == ProverStatus::Exiting
            && unbonding_remaining.map_or(false, |r| r <= 0)
            && !has_pending_challenges;

        // Get pending rewards
        let metrics_key = format!("prover:metrics:{}", prover_id);
        let pending_rewards: String = match self.redis.get(&metrics_key).await {
            Ok(Some(v)) => {
                let m: serde_json::Value = serde_json::from_str(&v).unwrap_or_default();
                m.get("pending_rewards").and_then(|v| v.as_str()).unwrap_or("0").to_string()
            }
            _ => "0".to_string(),
        };

        Ok(ProverExitStatusResponse {
            prover_id: prover_id.to_string(),
            status: prover.status,
            exit_initiated_at,
            unbonding_end,
            unbonding_remaining,
            can_withdraw,
            stake_to_return: prover.stake_amount,
            pending_rewards,
            has_pending_challenges,
            pending_challenge_count,
        })
    }

    /// Withdraw prover stake after unbonding
    /// POST /v1/prover/:prover_id/withdraw
    /// SEQUENCES §6: Prover Exit - Step 4-5 (Stake withdrawal)
    pub async fn withdraw_prover_stake(
        &self,
        prover_id: &str,
        req: &ProverWithdrawRequest,
    ) -> Result<ProverWithdrawResponse, ApiError> {
        // Get exit status to verify eligibility
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

        // Update prover status to Exited
        self.update_prover_status(prover_id, ProverStatus::Exited).await?;

        // Clear exit data
        let exit_key = format!("prover:exit:{}", prover_id);
        self.redis.del(&exit_key).await.map_err(|e| ApiError::Internal(e.to_string()))?;

        // Record withdrawal
        let now = chrono::Utc::now().timestamp() as u64;
        let withdrawal_key = format!("prover:withdrawal:{}", prover_id);
        let withdrawal_data = serde_json::json!({
            "prover_id": prover_id,
            "destination_address": req.destination_address,
            "stake_returned": exit_status.stake_to_return,
            "rewards_returned": exit_status.pending_rewards,
            "total_returned": total.to_string(),
            "withdrawn_at": now,
        });
        self.redis.set(&withdrawal_key, &withdrawal_data.to_string(), 86400 * 365).await
            .map_err(|e| ApiError::Internal(e.to_string()))?;

        // Notify L1 for actual fund transfer (in production)
        let msg = serde_json::json!({
            "type": "PROVER_WITHDRAW",
            "prover_id": prover_id,
            "destination_address": req.destination_address,
            "amount": total.to_string(),
        });
        self.rabbitmq.publish("l1_relay", &msg.to_string()).await
            .map_err(|e| ApiError::Internal(e.to_string()))?;

        tracing::info!(
            "Prover stake withdrawn: prover_id={}, destination={}, total={}",
            prover_id,
            req.destination_address,
            total
        );

        Ok(ProverWithdrawResponse {
            prover_id: prover_id.to_string(),
            status: ProverStatus::Exited,
            stake_returned: exit_status.stake_to_return,
            rewards_returned: exit_status.pending_rewards,
            total_returned: total.to_string(),
            destination_address: req.destination_address.clone(),
            l1_tx_hash: None, // Would be set after L1 confirmation
            withdrawn_at: now,
        })
    }

    /// Update prover status
    pub async fn update_prover_status(&self, prover_id: &str, status: ProverStatus) -> Result<(), ApiError> {
        if let Some(mut prover) = self.get_prover(prover_id).await? {
            prover.status = status;
            let prover_key = format!("prover:{}", prover_id);
            let value = serde_json::to_string(&prover).map_err(|e| ApiError::Internal(e.to_string()))?;
            self.redis.set(&prover_key, &value, 0).await.map_err(|e| ApiError::Internal(e.to_string()))?;
        }
        Ok(())
    }

    // Governance methods removed - implemented directly in routes::governance

    // ========================================================================
    // Observer API methods (TASK-P5-019 Extension: Registration)
    // ========================================================================

    /// Store observer in Redis
    pub async fn store_observer(&self, observer: &crate::types::Observer) -> Result<(), ApiError> {
        // Store by ID
        let key = format!("observer:{}", observer.observer_id);
        let value = serde_json::to_string(observer).map_err(|e| ApiError::Internal(e.to_string()))?;
        self.redis.set(&key, &value, 0).await.map_err(|e| ApiError::Internal(e.to_string()))?;

        // Store mapping by address
        let addr_key = format!("observer:addr:{}", observer.operator_addr);
        self.redis.set(&addr_key, &observer.observer_id, 0).await.map_err(|e| ApiError::Internal(e.to_string()))?;

        tracing::info!("Stored observer: {} for address: {}", observer.observer_id, observer.operator_addr);
        Ok(())
    }

    /// Get observer by ID
    pub async fn get_observer(&self, observer_id: &str) -> Result<Option<crate::types::Observer>, ApiError> {
        let key = format!("observer:{}", observer_id);
        match self.redis.get(&key).await {
            Ok(Some(value)) => Ok(Some(serde_json::from_str(&value).map_err(|e| ApiError::Internal(e.to_string()))?)),
            Ok(None) => Ok(None),
            Err(e) => Err(ApiError::Internal(e.to_string())),
        }
    }

    /// Get observer by operator address
    pub async fn get_observer_by_address(&self, address: &str) -> Result<Option<crate::types::Observer>, ApiError> {
        let addr_key = format!("observer:addr:{}", address);
        let observer_id = match self.redis.get(&addr_key).await {
            Ok(Some(id)) => id,
            Ok(None) => return Ok(None),
            Err(e) => return Err(ApiError::Internal(e.to_string())),
        };
        self.get_observer(&observer_id).await
    }

    /// Update observer status
    pub async fn update_observer_status(&self, observer_id: &str, status: crate::types::ObserverStatus) -> Result<(), ApiError> {
        if let Some(mut observer) = self.get_observer(observer_id).await? {
            observer.status = status;
            self.store_observer(&observer).await?;
        }
        Ok(())
    }

    /// Get all observers (for admin)
    pub async fn get_all_observers(&self) -> Result<Vec<crate::types::Observer>, ApiError> {
        let pattern = "observer:obs_*";
        let keys = self.redis.scan(pattern).await.map_err(|e| ApiError::Internal(e.to_string()))?;

        let mut observers = Vec::new();
        for key in keys {
            if let Ok(Some(value)) = self.redis.get(&key).await {
                if let Ok(observer) = serde_json::from_str::<crate::types::Observer>(&value) {
                    observers.push(observer);
                }
            }
        }

        // Sort by registered_at descending
        observers.sort_by(|a, b| b.registered_at.cmp(&a.registered_at));

        Ok(observers)
    }

    /// Get pending observers (for admin approval)
    pub async fn get_pending_observers(&self) -> Result<Vec<crate::types::Observer>, ApiError> {
        let all_observers = self.get_all_observers().await?;
        Ok(all_observers.into_iter()
            .filter(|o| o.status == crate::types::ObserverStatus::PendingApproval)
            .collect())
    }
}

/// Helper: SHA3-256 hash for proof hashing
fn sha3_hash(data: &str) -> String {
    use sha3::{Sha3_256, Digest};
    let mut hasher = Sha3_256::new();
    hasher.update(data.as_bytes());
    format!("0x{}", hex::encode(hasher.finalize()))
}
