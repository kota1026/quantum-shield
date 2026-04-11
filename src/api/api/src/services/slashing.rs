//! Slashing Service
//!
//! Implements Sequence #4.7-4.8: Challenge Resolution + Slashing
//!
//! ## Quadratic Slashing (SEQUENCES §4.7)
//! - N² × 10% where N = number of colluding provers
//! - Capped at 100%
//!
//! ## Distribution (SEQUENCES §4.8)
//! - 60% → Challenger (Observer)
//! - 20% → Insurance Fund
//! - 20% → Burn
//!
//! ## Architecture
//! - PG is Source of Truth (SM-001)
//! - L1 ProverRegistry.slash() for on-chain execution (when connected)
//! - Insurance fund balance updated in PG

use bigdecimal::BigDecimal;
use sqlx::PgPool;
use std::str::FromStr;
use tracing::{info, warn, instrument};

use crate::error::ApiError;
use crate::db::{ChallengeRepository, InsuranceRepository, ProverRepository};
use super::l1_prover_registry::{L1ProverRegistryService, hex_to_bytes32};

/// On-chain slashing status — tracks the lifecycle of the L1 `ProverRegistry.slash()` call.
///
/// Previously the L1 call was "best-effort": a failed submission silently logged a
/// warning and returned `None`, leaving the DB marked as slashed while the on-chain
/// stake was untouched. That is the exact silent-failure pattern we are eliminating.
///
/// With `L1SlashStatus`, every slashing has an explicit L1 lifecycle state that the
/// caller, the UI, and the retry queue can observe.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum L1SlashStatus {
    /// L1 `ProverRegistry.slash()` succeeded; `l1_tx_hash` is populated.
    Submitted,
    /// L1 call is disabled by feature flag (`l1.slashing.l1_execution=false`).
    /// This is an operator decision, not a failure.
    Disabled,
    /// L1 slashing is enabled in config but the registry service is unavailable
    /// (e.g., missing `l1_rpc_url` or `l1_private_key`). Operator action required.
    Unavailable,
    /// L1 call was attempted but failed. The slashing is recorded in the DB as
    /// pending an on-chain retry. A retry service (future work) polls these and
    /// resubmits. Never silently ignored.
    PendingRetry { error: String },
}

impl L1SlashStatus {
    pub fn as_str(&self) -> &'static str {
        match self {
            L1SlashStatus::Submitted => "submitted",
            L1SlashStatus::Disabled => "disabled",
            L1SlashStatus::Unavailable => "unavailable",
            L1SlashStatus::PendingRetry { .. } => "pending_retry",
        }
    }
}

/// Slashing distribution result
#[derive(Debug, Clone)]
pub struct SlashingResult {
    pub slashing_id: String,
    pub challenge_id: String,
    pub prover_id: String,
    pub total_slash: String,
    pub challenger_reward: String,
    pub insurance_amount: String,
    pub burn_amount: String,
    pub prover_deactivated: bool,
    pub l1_tx_hash: Option<String>,
    /// Explicit L1 lifecycle state (C-4 fix: replaces silent `None`).
    pub l1_status: L1SlashStatus,
}

/// Validate and convert the `prover_id` / `challenge_id` hex strings to the
/// `bytes32` format required by `ProverRegistry.slash()`.
///
/// Fail-fast: invalid hex returns `ApiError::InvalidRequest`. This runs BEFORE
/// any DB writes so malformed input cannot leave a half-applied slashing record.
///
/// Previously this used `hex_to_bytes32_or_zero`, which silently converted
/// garbage to `0x00..00` and then attempted to slash a non-existent prover on
/// L1, hiding the real error from operators.
fn prepare_l1_slash_args(
    prover_id: &str,
    challenge_id: &str,
) -> Result<([u8; 32], [u8; 32]), ApiError> {
    let prover_bytes = hex_to_bytes32(prover_id).map_err(|e| {
        ApiError::InvalidRequest(format!(
            "slashing: invalid prover_id hex '{}': {}",
            prover_id, e
        ))
    })?;
    let challenge_bytes = hex_to_bytes32(challenge_id).map_err(|e| {
        ApiError::InvalidRequest(format!(
            "slashing: invalid challenge_id hex '{}': {}",
            challenge_id, e
        ))
    })?;
    Ok((prover_bytes, challenge_bytes))
}

/// Slashing execution service
pub struct SlashingService;

impl SlashingService {
    /// Execute full slashing pipeline for a resolved challenge
    ///
    /// Steps:
    /// 1. Calculate quadratic slash amount
    /// 2. Record slashing in PG
    /// 3. Reduce prover stake in PG
    /// 4. Deposit insurance portion in PG
    /// 5. Deactivate prover if stake falls below minimum
    /// 6. Execute L1 ProverRegistry.slash() (if feature flag enabled)
    #[instrument(skip(pool, l1_prover_registry))]
    pub async fn execute_slashing(
        pool: &PgPool,
        challenge_id: &str,
        prover_id: &str,
        lock_amount: &str,
        colluding_prover_count: u64,
        l1_prover_registry: Option<&L1ProverRegistryService>,
        l1_slashing_enabled: bool,
        min_stake_wei: &str,
    ) -> Result<SlashingResult, ApiError> {
        info!(
            "Slashing: execute started, challenge_id={}, prover_id={}, colluding_count={}",
            challenge_id, prover_id, colluding_prover_count
        );

        // Step 0: Validate hex inputs BEFORE any DB writes (C-4 fail-fast).
        //
        // If l1_slashing is enabled we MUST be able to produce valid bytes32
        // arguments, otherwise we would silently record a slashing in the DB
        // while L1 never sees it. Validate early so invalid input aborts the
        // whole pipeline with InvalidRequest (HTTP 400), not a corrupted DB.
        let l1_args = if l1_slashing_enabled {
            Some(prepare_l1_slash_args(prover_id, challenge_id)?)
        } else {
            None
        };

        // Step 1: Calculate amounts
        let total_slash = calculate_quadratic_slash(colluding_prover_count, lock_amount);
        let challenger_reward = calculate_distribution(&total_slash, 60);
        let insurance_amount = calculate_distribution(&total_slash, 20);
        let burn_amount = calculate_distribution(&total_slash, 20);

        info!(
            "Slashing: amounts calculated, total={}, challenger={}, insurance={}, burn={}",
            total_slash, challenger_reward, insurance_amount, burn_amount
        );

        // Step 2: Record slashing in PG
        let slashing_id = format!("slash_{}", challenge_id);
        let slash_bd = BigDecimal::from_str(&total_slash).unwrap_or_else(|_| BigDecimal::from(0));
        let reward_bd = BigDecimal::from_str(&challenger_reward).unwrap_or_else(|_| BigDecimal::from(0));
        let insurance_bd = BigDecimal::from_str(&insurance_amount).unwrap_or_else(|_| BigDecimal::from(0));
        let burn_bd = BigDecimal::from_str(&burn_amount).unwrap_or_else(|_| BigDecimal::from(0));

        ChallengeRepository::create_slashing(
            pool,
            &slashing_id,
            challenge_id,
            prover_id,
            &slash_bd,
            &reward_bd,
            &insurance_bd,
            &burn_bd,
        ).await?;

        // Step 3: Reduce prover stake
        ProverRepository::reduce_stake(pool, prover_id, &slash_bd).await?;

        // Step 4: Deposit insurance portion
        if insurance_bd > BigDecimal::from(0) {
            InsuranceRepository::deposit_from_slashing(pool, challenge_id, &insurance_bd).await?;
        }

        // Step 5: Check if prover should be deactivated
        // Minimum stake threshold from config (0.01 ETH testnet, 1 ETH mainnet)
        let min_stake = BigDecimal::from_str(min_stake_wei)
            .unwrap_or_else(|_| BigDecimal::from_str("1000000000000000000").unwrap());
        let prover_deactivated = if let Ok(Some(prover)) = ProverRepository::get_by_id(pool, prover_id).await {
            if prover.stake_amount < min_stake {
                info!("Slashing: prover {} stake below minimum, deactivating", prover_id);
                if let Err(e) = ProverRepository::update_status(pool, prover_id, "slashed").await {
                    warn!("Slashing: failed to deactivate prover {}: {}", prover_id, e);
                }
                true
            } else {
                false
            }
        } else {
            warn!("Slashing: prover {} not found during deactivation check", prover_id);
            false
        };

        // Step 6: L1 ProverRegistry.slash() — now tracked explicitly (C-4 fix).
        //
        // Previously a failed L1 submission was silently swallowed (warn + None),
        // letting the DB record the slashing as complete while the attacker's
        // on-chain stake was untouched. Now every branch produces an explicit
        // `L1SlashStatus` value that the caller and future retry service can act
        // on.
        let (l1_tx_hash, l1_status): (Option<String>, L1SlashStatus) = if l1_slashing_enabled {
            if let Some(registry) = l1_prover_registry {
                // Hex validation already happened in Step 0; safe to unwrap the Option.
                let (prover_id_bytes, reason_bytes) = l1_args
                    .expect("l1_args must be Some when l1_slashing_enabled is true");
                match registry.slash(prover_id_bytes, colluding_prover_count, reason_bytes).await {
                    Ok(tx_hash) => {
                        info!(
                            l1_tx_hash = %tx_hash,
                            "L1 ProverRegistry.slash() submitted successfully"
                        );
                        (Some(format!("{:?}", tx_hash)), L1SlashStatus::Submitted)
                    }
                    Err(e) => {
                        // No more silent warn — log at ERROR level and record
                        // the pending state so operators notice and the retry
                        // service can resubmit.
                        tracing::error!(
                            error = %e,
                            slashing_id = %slashing_id,
                            "L1 ProverRegistry.slash() failed — marking pending_retry"
                        );
                        (None, L1SlashStatus::PendingRetry { error: e.to_string() })
                    }
                }
            } else {
                // Slashing is enabled by flag but the service is not available.
                // This is an operator configuration error, not a transient
                // failure — surface it clearly.
                tracing::error!(
                    slashing_id = %slashing_id,
                    "L1 slashing enabled but no L1ProverRegistryService available — \
                     operator must configure QS__L1__PRIVATE_KEY and QS__L1_RPC_URL"
                );
                (None, L1SlashStatus::Unavailable)
            }
        } else {
            info!("L1 slashing disabled by feature flag, skipping on-chain execution");
            (None, L1SlashStatus::Disabled)
        };

        info!(
            slashing_id = %slashing_id,
            deactivated = prover_deactivated,
            l1_status = l1_status.as_str(),
            "Slashing: execute completed"
        );

        Ok(SlashingResult {
            slashing_id,
            challenge_id: challenge_id.to_string(),
            prover_id: prover_id.to_string(),
            total_slash,
            challenger_reward,
            insurance_amount,
            burn_amount,
            prover_deactivated,
            l1_tx_hash,
            l1_status,
        })
    }

    /// Get slashing details for a challenge
    #[instrument(skip(pool))]
    pub async fn get_slashing(
        pool: &PgPool,
        challenge_id: &str,
    ) -> Result<Option<crate::db::SlashingRow>, ApiError> {
        ChallengeRepository::get_slashing(pool, challenge_id).await
    }

    /// List all slashing events (for admin dashboard)
    #[instrument(skip(pool))]
    pub async fn list_slashings(
        pool: &PgPool,
        offset: i64,
        limit: i64,
    ) -> Result<Vec<crate::db::SlashingRow>, ApiError> {
        info!("DB query: list_slashings started");

        let results = sqlx::query_as::<_, crate::db::SlashingRow>(
            r#"
            SELECT slashing_id, challenge_id, prover_id, slash_amount,
                   challenger_reward, insurance_amount, burn_amount,
                   l1_tx_hash, slashed_at
            FROM slashings
            ORDER BY slashed_at DESC
            OFFSET $1 LIMIT $2
            "#,
        )
        .bind(offset)
        .bind(limit)
        .fetch_all(pool)
        .await
        .map_err(|e| {
            warn!("DB error: list_slashings failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: list_slashings completed, count={}", results.len());
        Ok(results)
    }
}

// ============================================================================
// Slashing Calculation Functions
// ============================================================================

/// Calculate quadratic slash: N² × 10% of amount, capped at 100%
/// SEQUENCES §4.7
fn calculate_quadratic_slash(n: u64, amount: &str) -> String {
    let amount_val: u128 = amount.parse().unwrap_or(0);
    let mut slash_percent = (n as u128) * (n as u128) * 10; // N² × 10%
    if slash_percent > 100 {
        slash_percent = 100; // Cap at 100%
    }
    let slash_amount = amount_val * slash_percent / 100;
    slash_amount.to_string()
}

/// Calculate distribution percentage of total
fn calculate_distribution(total: &str, percent: u128) -> String {
    let total_val: u128 = total.parse().unwrap_or(0);
    let amount = total_val * percent / 100;
    amount.to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_quadratic_slash_1_prover() {
        // 1² × 10% = 10%
        let amount = "1000000000000000000"; // 1 ETH
        let slash = calculate_quadratic_slash(1, amount);
        assert_eq!(slash, "100000000000000000"); // 0.1 ETH
    }

    #[test]
    fn test_quadratic_slash_2_provers() {
        // 2² × 10% = 40%
        let amount = "1000000000000000000"; // 1 ETH
        let slash = calculate_quadratic_slash(2, amount);
        assert_eq!(slash, "400000000000000000"); // 0.4 ETH
    }

    #[test]
    fn test_quadratic_slash_3_provers() {
        // 3² × 10% = 90%
        let amount = "1000000000000000000"; // 1 ETH
        let slash = calculate_quadratic_slash(3, amount);
        assert_eq!(slash, "900000000000000000"); // 0.9 ETH
    }

    #[test]
    fn test_quadratic_slash_4_provers_capped() {
        // 4² × 10% = 160% → capped at 100%
        let amount = "1000000000000000000"; // 1 ETH
        let slash = calculate_quadratic_slash(4, amount);
        assert_eq!(slash, "1000000000000000000"); // 1 ETH (capped)
    }

    #[test]
    fn test_distribution_60_20_20() {
        let total = "1000000000000000000"; // 1 ETH
        let challenger = calculate_distribution(total, 60);
        let insurance = calculate_distribution(total, 20);
        let burn = calculate_distribution(total, 20);
        assert_eq!(challenger, "600000000000000000"); // 0.6 ETH
        assert_eq!(insurance, "200000000000000000");  // 0.2 ETH
        assert_eq!(burn, "200000000000000000");       // 0.2 ETH

        // Verify sum = total
        let sum: u128 = challenger.parse::<u128>().unwrap()
            + insurance.parse::<u128>().unwrap()
            + burn.parse::<u128>().unwrap();
        assert_eq!(sum.to_string(), total);
    }

    #[test]
    fn test_distribution_rounding() {
        // 7 wei total: 60% = 4, 20% = 1, 20% = 1 → sum = 6 (1 wei rounding loss)
        let total = "7";
        let challenger = calculate_distribution(total, 60);
        let insurance = calculate_distribution(total, 20);
        let burn = calculate_distribution(total, 20);
        assert_eq!(challenger, "4");
        assert_eq!(insurance, "1");
        assert_eq!(burn, "1");
    }

    #[test]
    fn test_slash_zero_amount() {
        let slash = calculate_quadratic_slash(1, "0");
        assert_eq!(slash, "0");
    }

    #[test]
    fn test_slash_zero_provers() {
        let amount = "1000000000000000000";
        let slash = calculate_quadratic_slash(0, amount);
        assert_eq!(slash, "0"); // 0² × 10% = 0%
    }

    // ========================================================================
    // C-4 regression: prepare_l1_slash_args fail-fast on invalid hex
    //
    // Previously `hex_to_bytes32_or_zero` silently converted garbage to
    // 0x00..00, letting the slashing DB write succeed while the L1 call
    // attempted to slash a non-existent prover. These tests enforce fail-fast
    // validation before any DB or L1 side effects.
    // ========================================================================

    const VALID_BYTES32_HEX: &str =
        "0x7a3246d8fd465f83700c112d20acb07da57c9d25c00535e51a1f7d524cdabf04";
    const VALID_BYTES32_HEX_2: &str =
        "0x1111111111111111111111111111111111111111111111111111111111111111";

    #[test]
    fn test_prepare_l1_slash_args_accepts_valid_hex() {
        let result = prepare_l1_slash_args(VALID_BYTES32_HEX, VALID_BYTES32_HEX_2);
        assert!(result.is_ok(), "valid bytes32 hex must parse");
        let (prover_bytes, challenge_bytes) = result.unwrap();
        assert_eq!(prover_bytes[0], 0x7a);
        assert_eq!(challenge_bytes[0], 0x11);
    }

    #[test]
    fn test_prepare_l1_slash_args_rejects_garbage_prover_id() {
        match prepare_l1_slash_args("not-hex", VALID_BYTES32_HEX) {
            Err(ApiError::InvalidRequest(msg)) => {
                assert!(
                    msg.contains("prover_id"),
                    "error must identify the bad field: {}",
                    msg
                );
                assert!(msg.contains("not-hex"));
            }
            other => panic!("expected InvalidRequest, got {:?}", other),
        }
    }

    #[test]
    fn test_prepare_l1_slash_args_rejects_garbage_challenge_id() {
        match prepare_l1_slash_args(VALID_BYTES32_HEX, "xyz") {
            Err(ApiError::InvalidRequest(msg)) => {
                assert!(
                    msg.contains("challenge_id"),
                    "error must identify the bad field: {}",
                    msg
                );
            }
            other => panic!("expected InvalidRequest, got {:?}", other),
        }
    }

    #[test]
    fn test_prepare_l1_slash_args_rejects_wrong_length() {
        // 16 hex chars = 8 bytes, not 32. Previously this silently became
        // 0x00..00; now it fails with a clear error.
        match prepare_l1_slash_args("0x1234567890abcdef", VALID_BYTES32_HEX) {
            Err(ApiError::InvalidRequest(msg)) => {
                assert!(msg.contains("prover_id"));
            }
            other => panic!("expected InvalidRequest, got {:?}", other),
        }
    }

    #[test]
    fn test_prepare_l1_slash_args_rejects_empty() {
        // The underlying hex_to_bytes32 treats an empty (or prefix-only)
        // string as a wrong-length error, which prepare_l1_slash_args then
        // surfaces as a field-scoped InvalidRequest. That is strictly better
        // than the old `hex_to_bytes32_or_zero` which turned an empty prover_id
        // into a zero-address slash target.
        match prepare_l1_slash_args("", VALID_BYTES32_HEX) {
            Err(ApiError::InvalidRequest(msg)) => assert!(msg.contains("prover_id")),
            other => panic!("expected InvalidRequest, got {:?}", other),
        }
    }

    // ========================================================================
    // L1SlashStatus semantics: verify every state has a distinct string
    // ========================================================================

    #[test]
    fn test_l1_slash_status_strings_are_distinct() {
        let states = [
            L1SlashStatus::Submitted.as_str(),
            L1SlashStatus::Disabled.as_str(),
            L1SlashStatus::Unavailable.as_str(),
            L1SlashStatus::PendingRetry { error: "x".to_string() }.as_str(),
        ];
        let unique: std::collections::HashSet<&&str> = states.iter().collect();
        assert_eq!(
            unique.len(),
            states.len(),
            "every L1SlashStatus variant must serialize to a distinct string"
        );
    }
}
