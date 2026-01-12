//! Services module

mod redis_client;
mod rabbitmq_client;
mod hsm_client;
<<<<<<< HEAD
mod vrf_service;
mod sphincs_service;
=======
pub mod auth_service;
>>>>>>> origin/claude/implement-task-p5-012-CoGF1

use anyhow::Result;

use crate::{
    config::Config,
    error::ApiError,
    types::{
        Lock, LockRequest, LockStatus, Edition,
        ProverRegisterRequest, ProverInfoResponse, ProverStatus,
<<<<<<< HEAD
        ChallengeInfo, ChallengeStatus,
        VRFRequest, VRFStatus,
=======
        LockPosition, HistoricalLock, DelegateInfo, MyDelegation,
        TokenHubRewardsResponse, RewardHistory,
>>>>>>> origin/claude/implement-task-p5-021-RdbJS
    },
};

pub use redis_client::RedisClient;
pub use rabbitmq_client::RabbitMQClient;
pub use hsm_client::HsmClient;
<<<<<<< HEAD
pub use vrf_service::{VRFService, VRFError};
pub use sphincs_service::{SphincsService, SphincsError, SPHINCS_PUBLIC_KEY_BYTES, SPHINCS_SIGNATURE_BYTES};
=======
pub use auth_service::AuthService;
>>>>>>> origin/claude/implement-task-p5-012-CoGF1

/// Application state shared across handlers
pub struct AppState {
    pub config: Config,
    pub redis: RedisClient,
    pub rabbitmq: RabbitMQClient,
    pub hsm: HsmClient,
<<<<<<< HEAD
    /// VRF Service for Chainlink VRF integration (SEQUENCES §2.3-§2.4)
    pub vrf: VRFService,
=======
    /// Authentication service for SIWE/JWT (TASK-P5-012)
    pub auth_service: AuthService,
>>>>>>> origin/claude/implement-task-p5-012-CoGF1
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
        let redis = RedisClient::new(&config.redis).await?;
        let rabbitmq = RabbitMQClient::new(&config.rabbitmq).await?;
        let hsm = HsmClient::new().await?;
<<<<<<< HEAD
        let vrf = VRFService::new(&config.vrf).await?;
        Ok(Self { config: config.clone(), redis, rabbitmq, hsm, vrf })
=======
        let auth_service = AuthService::new(config.jwt.clone());
        Ok(Self { config: config.clone(), redis, rabbitmq, hsm, auth_service })
>>>>>>> origin/claude/implement-task-p5-012-CoGF1
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
<<<<<<< HEAD
<<<<<<< HEAD
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
=======
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
                    // Filter by owner address
                    if lock.owner == user_address || lock.user_public_key == user_address {
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
>>>>>>> origin/claude/implement-task-p5-020-vNCen
=======
    // Token Hub (veQS) Methods
    // ========================================================================

    /// Get user's veQS lock position
    pub async fn get_veqs_lock(&self, address: &str) -> Result<Option<LockPosition>, ApiError> {
        let key = format!("veqs:lock:{}", address);
>>>>>>> origin/claude/implement-task-p5-021-RdbJS
        match self.redis.get(&key).await {
            Ok(Some(value)) => Ok(Some(serde_json::from_str(&value).map_err(|e| ApiError::Internal(e.to_string()))?)),
            Ok(None) => Ok(None),
            Err(e) => Err(ApiError::Internal(e.to_string())),
        }
    }

<<<<<<< HEAD
<<<<<<< HEAD
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
=======
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
>>>>>>> origin/claude/implement-task-p5-020-vNCen
            Ok(None) => Ok(None),
=======
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
>>>>>>> origin/claude/implement-task-p5-021-RdbJS
            Err(e) => Err(ApiError::Internal(e.to_string())),
        }
    }

<<<<<<< HEAD
<<<<<<< HEAD
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
=======
    /// Store user's Dilithium public key
    pub async fn store_user_dilithium_key(&self, user_address: &str, public_key: &str) -> Result<(), ApiError> {
        let key = format!("user:dilithium:{}", user_address);
        let timestamp = chrono::Utc::now().timestamp() as u64;
        let value = format!("{}:{}", public_key, timestamp);
        self.redis.set(&key, &value, 0).await.map_err(|e| ApiError::Internal(e.to_string()))
>>>>>>> origin/claude/implement-task-p5-020-vNCen
=======
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
    pub async fn get_delegates(&self, page: u32, limit: u32, sort_by: Option<String>) -> Result<Vec<DelegateInfo>, ApiError> {
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
    pub async fn get_veqs_rewards(&self, address: &str) -> Result<TokenHubRewardsResponse, ApiError> {
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
>>>>>>> origin/claude/implement-task-p5-021-RdbJS
    }
}
