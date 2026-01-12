//! Services module

mod redis_client;
mod rabbitmq_client;
mod hsm_client;
mod vrf_service;

use anyhow::Result;

use crate::{
    config::Config,
    error::ApiError,
    types::{
        Lock, LockRequest, LockStatus, Edition,
        ProverRegisterRequest, ProverInfoResponse, ProverStatus,
        ChallengeInfo, ChallengeStatus,
        VRFRequest, VRFStatus,
    },
};

pub use redis_client::RedisClient;
pub use rabbitmq_client::RabbitMQClient;
pub use hsm_client::HsmClient;
pub use vrf_service::{VRFService, VRFError};

/// Application state shared across handlers
pub struct AppState {
    pub config: Config,
    pub redis: RedisClient,
    pub rabbitmq: RabbitMQClient,
    pub hsm: HsmClient,
    /// VRF Service for Chainlink VRF integration (SEQUENCES §2.3-§2.4)
    pub vrf: VRFService,
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
        let vrf = VRFService::new(&config.vrf).await?;
        Ok(Self { config: config.clone(), redis, rabbitmq, hsm, vrf })
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
}
