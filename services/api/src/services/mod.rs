//! Services module

mod redis_client;
mod rabbitmq_client;
mod hsm_client;
mod vrf_service;
mod sphincs_service;
pub mod auth_service;

use anyhow::Result;

use crate::{
    config::Config,
    error::ApiError,
    types::{
        Lock, LockRequest, LockStatus, Edition,
        ProverRegisterRequest, ProverInfoResponse, ProverStatus,
        ChallengeInfo, ChallengeStatus,
        VRFRequest, VRFStatus,
        // Prover Portal types (TASK-P5-022)
        ProverDashboard, SigningQueueItem, SigningQueueResponse, QueueItemStatus,
        ProverSignRequest, ProverSignResponse, ProverMetrics,
        ProverAlert, ProverAlertsResponse,
        ProverChallengeItem, ProverChallengesResponse,
        ProverChallengeResponseRequest, ProverChallengeResponseResult,
        ProverExitRequest, ProverExitResponse,
    },
};

pub use redis_client::RedisClient;
pub use rabbitmq_client::RabbitMQClient;
pub use hsm_client::HsmClient;
pub use vrf_service::{VRFService, VRFError};
pub use sphincs_service::{SphincsService, SphincsError, SPHINCS_PUBLIC_KEY_BYTES, SPHINCS_SIGNATURE_BYTES};
pub use auth_service::AuthService;

/// Application state shared across handlers
pub struct AppState {
    pub config: Config,
    pub redis: RedisClient,
    pub rabbitmq: RabbitMQClient,
    pub hsm: HsmClient,
    /// VRF Service for Chainlink VRF integration (SEQUENCES §2.3-§2.4)
    pub vrf: VRFService,
    /// Authentication service for SIWE/JWT (TASK-P5-012)
    pub auth_service: AuthService,
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
        let auth_service = AuthService::new(config.jwt.clone());
        Ok(Self { config: config.clone(), redis, rabbitmq, hsm, vrf, auth_service })
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

    pub async fn resolve_challenge(
        &self,
        challenge_id: &str,
        challenge_valid: bool,
        _slash_amount: &str,
        _challenger_reward: &str,
        _insurance_amount: &str,
        _burn_amount: &str,
    ) -> Result<(), ApiError> {
        let key = format!("challenge:{}", challenge_id);
        let value = self.redis.get(&key).await.map_err(|e| ApiError::Internal(e.to_string()))?
            .ok_or_else(|| ApiError::ChallengeNotFound(challenge_id.to_string()))?;
        let mut challenge: ChallengeInfo = serde_json::from_str(&value).map_err(|e| ApiError::Internal(e.to_string()))?;
        challenge.status = if challenge_valid { ChallengeStatus::ResolvedValid } else { ChallengeStatus::ResolvedInvalid };
        let new_value = serde_json::to_string(&challenge).map_err(|e| ApiError::Internal(e.to_string()))?;
        self.redis.set(&key, &new_value, 86400 * 30).await.map_err(|e| ApiError::Internal(e.to_string()))
    }

    // ========================================================================
    // VRF Methods (SEQUENCES §2.3-§2.4)
    // ========================================================================

    pub async fn store_vrf_request(&self, request: &VRFRequest) -> Result<(), ApiError> {
        let key = format!("vrf:{}", request.vrf_request_id);
        let unlock_key = format!("vrf:unlock:{}", request.unlock_request_id);
        let value = serde_json::to_string(request).map_err(|e| ApiError::Internal(e.to_string()))?;
        self.redis.set(&key, &value, 86400).await.map_err(|e| ApiError::Internal(e.to_string()))?;
        self.redis.set(&unlock_key, &request.vrf_request_id, 86400).await.map_err(|e| ApiError::Internal(e.to_string()))
    }

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
    // Prover Portal Methods (TASK-P5-022)
    // ========================================================================

    pub async fn get_prover_dashboard(&self, prover_id: &str) -> Result<ProverDashboard, ApiError> {
        let prover = self.get_prover(prover_id).await?
            .ok_or_else(|| ApiError::ProverNotFound(prover_id.to_string()))?;

        Ok(ProverDashboard {
            prover_id: prover.prover_id,
            status: prover.status,
            stake_amount: prover.stake_amount,
            total_signatures: prover.total_signatures,
            signatures_24h: 0,
            pending_rewards: "0".to_string(),
            total_earnings: "0".to_string(),
            queue_size: 0,
            active_challenges: 0,
            slash_count: prover.slashing_history.len() as u32,
            uptime_percentage: 99.9,
            last_activity: chrono::Utc::now().timestamp() as u64,
        })
    }

    pub async fn get_signing_queue(&self, prover_id: &str) -> Result<SigningQueueResponse, ApiError> {
        let queue_key = format!("prover:queue:{}", prover_id);
        let items: Vec<SigningQueueItem> = match self.redis.get(&queue_key).await {
            Ok(Some(v)) => serde_json::from_str(&v).unwrap_or_default(),
            _ => vec![],
        };
        let pending_count = items.iter().filter(|i| i.status == QueueItemStatus::Pending).count();
        let total = items.len();
        Ok(SigningQueueResponse { items, total, pending_count })
    }

    pub async fn get_queue_item(&self, prover_id: &str, queue_id: &str) -> Result<Option<SigningQueueItem>, ApiError> {
        let queue = self.get_signing_queue(prover_id).await?;
        Ok(queue.items.into_iter().find(|i| i.queue_id == queue_id))
    }

    pub async fn store_queue_item(&self, prover_id: &str, item: &SigningQueueItem) -> Result<(), ApiError> {
        let queue_key = format!("prover:queue:{}", prover_id);
        let mut items: Vec<SigningQueueItem> = match self.redis.get(&queue_key).await {
            Ok(Some(v)) => serde_json::from_str(&v).unwrap_or_default(),
            _ => vec![],
        };
        if let Some(pos) = items.iter().position(|i| i.queue_id == item.queue_id) {
            items[pos] = item.clone();
        } else {
            items.push(item.clone());
        }
        let value = serde_json::to_string(&items).map_err(|e| ApiError::Internal(e.to_string()))?;
        self.redis.set(&queue_key, &value, 86400 * 7).await.map_err(|e| ApiError::Internal(e.to_string()))
    }

    pub async fn submit_prover_signature(
        &self,
        prover_id: &str,
        req: &ProverSignRequest,
    ) -> Result<ProverSignResponse, ApiError> {
        let mut item = self.get_queue_item(prover_id, &req.queue_id).await?
            .ok_or_else(|| ApiError::NotFound(format!("Queue item not found: {}", req.queue_id)))?;
        item.status = QueueItemStatus::Signed;
        self.store_queue_item(prover_id, &item).await?;

        Ok(ProverSignResponse {
            queue_id: req.queue_id.clone(),
            unlock_id: item.unlock_id,
            signature_accepted: true,
            total_signatures: 1,
            required_signatures: 2,
            reward_earned: "10000000000000000".to_string(),
        })
    }

    pub async fn get_prover_metrics(&self, prover_id: &str) -> Result<ProverMetrics, ApiError> {
        let prover = self.get_prover(prover_id).await?
            .ok_or_else(|| ApiError::ProverNotFound(prover_id.to_string()))?;

        Ok(ProverMetrics {
            total_signatures: prover.total_signatures,
            signatures_24h: 0,
            signatures_7d: 0,
            avg_response_time_ms: 500,
            success_rate: 99.5,
            uptime_percentage: 99.9,
            total_rewards: "0".to_string(),
            rewards_30d: "0".to_string(),
            slash_count: prover.slashing_history.len() as u32,
            total_slashed: "0".to_string(),
            rank: 1,
            total_provers: 10,
        })
    }

    pub async fn get_prover_alerts(&self, prover_id: &str) -> Result<ProverAlertsResponse, ApiError> {
        let alerts_key = format!("prover:alerts:{}", prover_id);
        let alerts: Vec<ProverAlert> = match self.redis.get(&alerts_key).await {
            Ok(Some(v)) => serde_json::from_str(&v).unwrap_or_default(),
            _ => vec![],
        };
        let unacknowledged_count = alerts.iter().filter(|a| !a.acknowledged).count();
        let total = alerts.len();
        Ok(ProverAlertsResponse { alerts, total, unacknowledged_count })
    }

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
        Ok(ProverChallengesResponse { challenges, total, pending_count })
    }

    pub async fn submit_prover_challenge_response(
        &self,
        prover_id: &str,
        req: &ProverChallengeResponseRequest,
    ) -> Result<ProverChallengeResponseResult, ApiError> {
        let challenge_key = format!("challenge:{}", req.challenge_id);
        let challenge_value = self.redis.get(&challenge_key).await
            .map_err(|e| ApiError::Internal(e.to_string()))?
            .ok_or_else(|| ApiError::ChallengeNotFound(req.challenge_id.clone()))?;

        let mut challenge: ChallengeInfo = serde_json::from_str(&challenge_value)
            .map_err(|e| ApiError::Internal(e.to_string()))?;

        let now = chrono::Utc::now().timestamp() as u64;
        if now > challenge.defense_deadline {
            return Err(ApiError::Forbidden("Defense deadline has passed".into()));
        }

        challenge.status = ChallengeStatus::DefenseSubmitted;
        challenge.defender = Some(prover_id.to_string());
        challenge.defense_proof_hash = Some(sha3_hash(&req.defense_proof));

        let new_value = serde_json::to_string(&challenge).map_err(|e| ApiError::Internal(e.to_string()))?;
        self.redis.set(&challenge_key, &new_value, 86400 * 30).await
            .map_err(|e| ApiError::Internal(e.to_string()))?;

        Ok(ProverChallengeResponseResult {
            challenge_id: req.challenge_id.clone(),
            status: ChallengeStatus::DefenseSubmitted,
            defense_accepted: true,
            message: "Defense submitted successfully. Awaiting arbitration.".to_string(),
        })
    }

    pub async fn initiate_prover_exit(
        &self,
        prover_id: &str,
        _req: &ProverExitRequest,
    ) -> Result<ProverExitResponse, ApiError> {
        let mut prover = self.get_prover(prover_id).await?
            .ok_or_else(|| ApiError::ProverNotFound(prover_id.to_string()))?;

        if prover.status == ProverStatus::Exiting || prover.status == ProverStatus::Exited {
            return Err(ApiError::Forbidden("Prover is already exiting or has exited".into()));
        }

        let challenges = self.get_prover_challenges(prover_id).await?;
        if challenges.pending_count > 0 {
            return Err(ApiError::Forbidden("Cannot exit with pending challenges".into()));
        }

        prover.status = ProverStatus::Exiting;
        let prover_key = format!("prover:{}", prover_id);
        let value = serde_json::to_string(&prover).map_err(|e| ApiError::Internal(e.to_string()))?;
        self.redis.set(&prover_key, &value, 0).await.map_err(|e| ApiError::Internal(e.to_string()))?;

        let now = chrono::Utc::now().timestamp() as u64;
        let unbonding_days = 7u32;
        let unbonding_end = now + (unbonding_days as u64 * 24 * 60 * 60);

        Ok(ProverExitResponse {
            prover_id: prover_id.to_string(),
            status: ProverStatus::Exiting,
            exit_initiated_at: now,
            unbonding_end,
            unbonding_days,
            stake_to_return: prover.stake_amount,
            pending_rewards: "0".to_string(),
        })
    }

    // ========================================================================
    // Token Hub (veQS) Methods (TASK-P5-021)
    // ========================================================================

    pub async fn get_veqs_lock(&self, address: &str) -> Result<Option<crate::types::LockPosition>, ApiError> {
        let key = format!("veqs:lock:{}", address);
        match self.redis.get(&key).await {
            Ok(Some(value)) => Ok(Some(serde_json::from_str(&value).map_err(|e| ApiError::Internal(e.to_string()))?)),
            Ok(None) => Ok(None),
            Err(e) => Err(ApiError::Internal(e.to_string())),
        }
    }

    pub async fn get_qs_balance(&self, _address: &str) -> Result<String, ApiError> {
        Ok("12450".to_string()) // Mock balance
    }

    pub async fn get_voting_power_percent(&self, _address: &str) -> Result<f64, ApiError> {
        Ok(0.5) // Mock voting power
    }

    pub async fn get_delegations_count(&self, _address: &str) -> Result<u32, ApiError> {
        Ok(2) // Mock count
    }

    pub async fn get_pending_rewards(&self, _address: &str) -> Result<String, ApiError> {
        Ok("847".to_string()) // Mock rewards
    }

    pub async fn get_veqs_lock_history(&self, _address: &str) -> Result<Vec<crate::types::HistoricalLock>, ApiError> {
        Ok(vec![])
    }

    pub async fn get_delegates(&self, _page: u32, _limit: u32, _sort_by: Option<String>) -> Result<Vec<crate::types::DelegateInfo>, ApiError> {
        Ok(vec![])
    }

    pub async fn get_delegates_count(&self) -> Result<u32, ApiError> {
        Ok(3)
    }

    pub async fn get_veqs_rewards(&self, _address: &str) -> Result<crate::types::TokenHubRewardsResponse, ApiError> {
        Ok(crate::types::TokenHubRewardsResponse {
            claimable: "847".to_string(),
            claimable_usd: "4235".to_string(),
            total_claimed: "2500".to_string(),
            current_epoch: 15,
            epoch_progress: 0.65,
            estimated_epoch_rewards: "120".to_string(),
            apy: 12.5,
            history: vec![],
        })
    }

    pub async fn get_user_delegations(&self, _address: &str) -> Result<Vec<crate::types::MyDelegation>, ApiError> {
        Ok(vec![])
    }

    pub async fn get_veqs_balance(&self, _address: &str) -> Result<u128, ApiError> {
        Ok(0)
    }

    // ========================================================================
    // User Methods (TASK-P5-020)
    // ========================================================================

    /// Get all locks for a specific user
    pub async fn get_user_locks(&self, user_address: &str) -> Result<Vec<Lock>, ApiError> {
        // Mock implementation - returns empty list for now
        // In production: scan Redis for user's locks
        tracing::debug!("Getting user locks for: {}", user_address);
        Ok(vec![])
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
}

fn sha3_hash(data: &str) -> String {
    use sha3::{Sha3_256, Digest};
    let mut hasher = Sha3_256::new();
    hasher.update(data.as_bytes());
    format!("0x{}", hex::encode(hasher.finalize()))
}
