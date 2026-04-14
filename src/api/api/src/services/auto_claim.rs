//! Auto-Claim Background Service
//!
//! Automatically executes L1 claims after timelock expiry to prevent assets
//! from sitting in a quantum-vulnerable "claimable" state on L1.
//!
//! Polls the database for expired timelocks and calls L1Vault.executeUnlock().
//!
//! ## SR_1 Computation (v2.0 - Solidity Compatible)
//!
//! This service now computes SR_1 at submission time using the exact same
//! algorithm as the L1 Vault contract, including:
//! - Fetching the current unlockNonceCounter from L1
//! - Using abi.encodePacked compatible encoding
//! - SHA3-256 with proper domain separation

use std::sync::Arc;

use bigdecimal::BigDecimal;
use ethers::types::{Address, Bytes, U256};
use sqlx::PgPool;
use tokio::sync::watch;
use tracing::{info, warn, error};

use crate::config::AutoClaimConfig;
use crate::types::LockStatus;

use super::sr1_calculator;
use super::AppState;

/// Row returned by the claimable unlocks query
#[derive(Debug, sqlx::FromRow)]
struct ClaimableUnlock {
    unlock_id: String,
    lock_id: String,
    is_emergency: bool,
}

/// Prover signature data for L1 requestUnlock
#[derive(Debug, sqlx::FromRow)]
struct ProverSignature {
    prover_id: String,
    sig_sphincs: Vec<u8>,
    #[allow(dead_code)]
    sr_1: String, // Kept for reference, but we now compute SR_1 at submission time
}

/// Lock data needed for SR_1 computation
#[derive(Debug, sqlx::FromRow)]
struct LockData {
    lock_id: String,
    wallet_address: String,
    amount: BigDecimal,
    sr_0: String,
}

pub struct AutoClaimService {
    state: Arc<AppState>,
    config: AutoClaimConfig,
    shutdown_rx: watch::Receiver<bool>,
}

impl AutoClaimService {
    pub fn new(
        state: Arc<AppState>,
        config: AutoClaimConfig,
        shutdown_rx: watch::Receiver<bool>,
    ) -> Self {
        Self { state, config, shutdown_rx }
    }

    /// Run the background polling loop until shutdown
    pub async fn run(mut self) {
        eprintln!("[AUTO-CLAIM] Service started, polling every {}s", self.config.poll_interval_secs);
        info!(
            poll_interval_secs = self.config.poll_interval_secs,
            "Auto-claim service started"
        );

        let mut interval = tokio::time::interval(
            std::time::Duration::from_secs(self.config.poll_interval_secs),
        );

        let mut tick_count: u64 = 0;

        loop {
            tokio::select! {
                _ = interval.tick() => {
                    tick_count += 1;

                    if let Err(e) = self.process_claimable_unlocks().await {
                        error!("Auto-claim processing error: {}", e);
                    }

                    // Cleanup expired SIWE nonces every 10th iteration (~10 minutes)
                    if tick_count % 10 == 0 {
                        if let Err(e) = crate::db::NonceRepository::cleanup_expired(self.state.pool()).await {
                            warn!("SIWE nonce cleanup failed: {}", e);
                        }
                    }
                }
                _ = self.shutdown_rx.changed() => {
                    info!("Auto-claim service shutting down");
                    break;
                }
            }
        }

        info!("Auto-claim service stopped");
    }

    /// Find and process all unlocks whose timelock has expired
    async fn process_claimable_unlocks(&self) -> Result<(), String> {
        eprintln!("[AUTO-CLAIM] Checking for claimable unlocks...");
        let pool = self.state.pool();

        let claimable = Self::find_claimable_unlocks(pool)
            .await
            .map_err(|e| format!("DB query failed: {}", e))?;

        eprintln!("[AUTO-CLAIM] Found {} claimable unlocks", claimable.len());
        if claimable.is_empty() {
            return Ok(());
        }

        info!(count = claimable.len(), "Found claimable unlocks");

        for unlock in &claimable {
            match self.claim_single_unlock(unlock).await {
                Ok(()) => {
                    info!(
                        lock_id = %unlock.lock_id,
                        unlock_id = %unlock.unlock_id,
                        is_emergency = unlock.is_emergency,
                        "Auto-claim successful"
                    );
                }
                Err(e) => {
                    error!(
                        lock_id = %unlock.lock_id,
                        unlock_id = %unlock.unlock_id,
                        error = %e,
                        "Auto-claim failed, will retry next cycle"
                    );
                }
            }
        }

        Ok(())
    }

    /// Query for unlocks where timelock has expired and lock is still pending
    async fn find_claimable_unlocks(pool: &PgPool) -> Result<Vec<ClaimableUnlock>, sqlx::Error> {
        sqlx::query_as::<_, ClaimableUnlock>(
            r#"
            SELECT ur.unlock_id, ur.lock_id, ur.is_emergency
            FROM unlock_requests ur
            JOIN locks l ON ur.lock_id = l.lock_id
            WHERE ur.release_time <= NOW()
              AND l.status IN ('unlock_pending', 'emergency_pending')
            ORDER BY ur.release_time ASC
            LIMIT 50
            "#,
        )
        .fetch_all(pool)
        .await
    }

    /// Execute claim for a single unlock
    ///
    /// ## SR_1 Computation (v2.0)
    /// This function now computes SR_1 at submission time by:
    /// 1. Fetching the current unlockNonceCounter from L1
    /// 2. Getting lock data (sr_0, amount) from the database
    /// 3. Computing SR_1 using sr1_calculator (Solidity-compatible)
    ///
    /// This ensures the SR_1 matches what the L1 contract will compute.
    async fn claim_single_unlock(&self, unlock: &ClaimableUnlock) -> Result<(), String> {
        let pool = self.state.pool();

        // Get prover signatures for normal unlocks
        let signatures: Vec<ProverSignature> = if !unlock.is_emergency {
            sqlx::query_as::<_, ProverSignature>(
                "SELECT ups.prover_id, ups.sig_sphincs, ups.sr_1
                 FROM unlock_prover_signatures ups
                 WHERE ups.unlock_id = $1 AND ups.is_valid = true
                 ORDER BY ups.signed_at ASC
                 LIMIT 5",
            )
            .bind(&unlock.unlock_id)
            .fetch_all(pool)
            .await
            .map_err(|e| format!("Signature query failed: {}", e))?
        } else {
            vec![]
        };

        let skip_sig_check = self.state.config().security.skip_signature_verification;
        if !unlock.is_emergency && signatures.len() < 2 && !skip_sig_check {
            return Err(format!(
                "Insufficient signatures: {}/2 for lock_id={}",
                signatures.len(), unlock.lock_id
            ));
        }

        // Get lock data for SR_1 computation
        let lock_data: LockData = sqlx::query_as::<_, LockData>(
            "SELECT lock_id, wallet_address, amount, sr_0 FROM locks WHERE lock_id = $1",
        )
        .bind(&unlock.lock_id)
        .fetch_one(pool)
        .await
        .map_err(|e| format!("Lock data query failed: {}", e))?;

        let recipient = &lock_data.wallet_address;

        // Execute on L1 (skip in dev mode when l1_vault is None)
        if let Some(ref l1_vault) = self.state.l1_vault {
            // First, check if unlock request exists on L1
            let l1_unlock = l1_vault.get_unlock_request(&unlock.lock_id).await;
            let needs_request_unlock = match l1_unlock {
                Ok(req) => req.amount.is_zero(), // No unlock request if amount is 0
                Err(_) => true, // Assume not exists on error
            };

            if needs_request_unlock && !unlock.is_emergency {
                // Submit requestUnlock to L1 first
                eprintln!("[AUTO-CLAIM] Submitting requestUnlock to L1 for lock_id={}", unlock.lock_id);

                // Step 1: Get current unlockNonceCounter from L1
                let unlock_nonce = l1_vault.get_unlock_nonce_counter().await
                    .map_err(|e| format!("Failed to get unlockNonceCounter: {}", e))?;

                eprintln!("[AUTO-CLAIM] Got unlockNonceCounter from L1: {}", unlock_nonce);

                // Step 2: Parse lock data for SR_1 computation
                let sr0_bytes = Self::hex_to_bytes32(&lock_data.sr_0)?;
                let lock_id_bytes = Self::hex_to_bytes32(&unlock.lock_id)?;
                let dest_addr: Address = recipient.parse()
                    .map_err(|e| format!("Invalid recipient address: {}", e))?;

                // Convert BigDecimal amount to U256
                let amount_u256 = Self::bigdecimal_to_u256(&lock_data.amount)?;

                // Step 3: Compute SR_1 using Solidity-compatible algorithm
                let sr1_bytes = sr1_calculator::compute_sr1(
                    &sr0_bytes,
                    &lock_id_bytes,
                    &dest_addr,
                    amount_u256,
                    unlock_nonce,
                );
                let sr1_hex = format!("0x{}", hex::encode(&sr1_bytes));

                eprintln!("[AUTO-CLAIM] Computed SR_1: {}", sr1_hex);
                info!(
                    lock_id = %unlock.lock_id,
                    unlock_nonce = %unlock_nonce,
                    sr1 = %sr1_hex,
                    "Computed SR_1 for requestUnlock"
                );

                // Step 4: Prepare signature data
                let sphincs_sigs: Vec<Bytes> = signatures.iter()
                    .map(|s| Bytes::from(s.sig_sphincs.clone()))
                    .collect();

                let prover_addrs: Vec<Address> = signatures.iter()
                    .map(|s| s.prover_id.parse::<Address>())
                    .collect::<Result<Vec<_>, _>>()
                    .map_err(|e| format!("Invalid prover address: {}", e))?;

                // Empty SMT proof for now (may need to implement proper proof generation)
                let smt_proof: Vec<[u8; 32]> = vec![];

                // Step 5: Submit requestUnlock with computed SR_1
                let req_tx = l1_vault.request_unlock(
                    &unlock.lock_id,
                    recipient,
                    smt_proof,
                    &sr1_hex,
                    sphincs_sigs,
                    prover_addrs,
                ).await.map_err(|e| {
                    eprintln!("[AUTO-CLAIM] L1 requestUnlock FAILED: {}", e);
                    format!("L1 requestUnlock failed: {}", e)
                })?;

                eprintln!("[AUTO-CLAIM] L1 requestUnlock SUCCESS: tx_hash={:?}", req_tx);

                // Wait a bit for L1 state to update
                tokio::time::sleep(std::time::Duration::from_secs(15)).await;
            }

            // Now execute unlock
            eprintln!("[AUTO-CLAIM] Submitting executeUnlock to L1 for lock_id={}", unlock.lock_id);
            info!(lock_id = %unlock.lock_id, "Auto-claim: submitting executeUnlock to L1");

            let tx_hash = l1_vault
                .execute_unlock(&unlock.lock_id)
                .await
                .map_err(|e| {
                    eprintln!("[AUTO-CLAIM] L1 executeUnlock FAILED: {}", e);
                    format!("L1 executeUnlock failed: {}", e)
                })?;

            eprintln!("[AUTO-CLAIM] L1 executeUnlock SUCCESS: tx_hash={:?}", tx_hash);
            info!(
                lock_id = %unlock.lock_id,
                l1_tx_hash = %format!("{:?}", tx_hash),
                "Auto-claim: L1 executeUnlock submitted"
            );
        } else {
            eprintln!("[AUTO-CLAIM] L1 Vault not configured, skipping L1 call");
            info!(
                lock_id = %unlock.lock_id,
                "Auto-claim: L1 Vault not configured (dev mode), skipping L1 call"
            );
        }

        // Update lock status to Released (dual-write PG + Redis)
        self.state
            .update_lock_status(&unlock.lock_id, LockStatus::Released, None)
            .await
            .map_err(|e| format!("Status update failed: {}", e))?;

        Ok(())
    }

    /// Parse hex string (with or without 0x prefix) to [u8; 32]
    fn hex_to_bytes32(hex_str: &str) -> Result<[u8; 32], String> {
        let clean = hex_str.strip_prefix("0x").unwrap_or(hex_str);
        let bytes = hex::decode(clean)
            .map_err(|e| format!("Invalid hex: {}", e))?;
        if bytes.len() != 32 {
            return Err(format!("Expected 32 bytes, got {}", bytes.len()));
        }
        let mut arr = [0u8; 32];
        arr.copy_from_slice(&bytes);
        Ok(arr)
    }

    /// Convert BigDecimal to U256
    fn bigdecimal_to_u256(bd: &BigDecimal) -> Result<U256, String> {
        // Get the integer value (amount in wei should always be an integer)
        let int_val = bd.to_string();
        let clean = int_val.split('.').next().unwrap_or("0");
        U256::from_dec_str(clean)
            .map_err(|e| format!("Failed to convert amount to U256: {}", e))
    }
}
