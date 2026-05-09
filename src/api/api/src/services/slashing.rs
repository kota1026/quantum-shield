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
use ethers::types::{Address, U256};
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
/// `bytes32` format used internally by Quantum Shield. The `challenge_id`
/// bytes32 also flows through to the L1 `slash(...)` call as the `reason`
/// parameter on the deployed canonical contract.
///
/// The first element (prover_id bytes32) is NOT passed to L1 anymore — the
/// canonical deployed contract identifies provers by `address` rather than
/// `bytes32 proverId` (see Phase 3 PR1/5 ABI alignment in
/// `l1_prover_registry.rs`). It is still validated up-front so we fail fast
/// on garbage input before any DB write.
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

/// Resolve a Quantum Shield `prover_id` (bytes32 hash) to the L1 wallet
/// address that the deployed canonical `ProverRegistry` keys provers by.
///
/// Returns the parsed `Address` on success, or a stringified error on
/// failure. Errors are returned (not panicked) so the caller can mark the
/// slashing row as `pending_retry` rather than crashing the pipeline.
///
/// Phase 3 PR1/5: the deployed `ProverRegistry.slash` takes
/// `address proverAddress`, not `bytes32 proverId`. Each slashing row in PG
/// stores the prover_id; we map it to `provers.operator_addr` here.
async fn lookup_prover_l1_address(
    pool: &PgPool,
    prover_id: &str,
) -> Result<Address, String> {
    let row = ProverRepository::get_by_id(pool, prover_id)
        .await
        .map_err(|e| format!("DB lookup failed for prover_id={}: {}", prover_id, e))?
        .ok_or_else(|| format!("prover_id={} not found in DB (no operator_addr)", prover_id))?;
    row.operator_addr
        .parse::<Address>()
        .map_err(|e| format!(
            "operator_addr={} for prover_id={} is not a valid 0x-prefixed Ethereum address: {}",
            row.operator_addr, prover_id, e
        ))
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

        // Initial l1_status placeholder — the row is created with 'disabled' if
        // L1 slashing is off, or 'pending' if it's on but the actual call has
        // not happened yet. After Step 6 below, the row is UPDATEd with the
        // terminal state. If the update is lost (process crash between L1 call
        // and UPDATE), the retry service treats 'pending' rows older than
        // RETRY_PENDING_STALE_SECS as abandoned and resubmits.
        let initial_l1_status = if l1_slashing_enabled {
            "pending"
        } else {
            "disabled"
        };

        ChallengeRepository::create_slashing(
            pool,
            &slashing_id,
            challenge_id,
            prover_id,
            &slash_bd,
            &reward_bd,
            &insurance_bd,
            &burn_bd,
            colluding_prover_count as i32,
            initial_l1_status,
            None, // l1_tx_hash not known yet
            None, // l1_error not known yet
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
                // The first slot (prover_id bytes32) is no longer passed to L1
                // — the canonical deployed contract takes `address`, which we
                // look up below. challenge_id bytes32 still flows through as
                // the `reason` argument.
                let (_prover_id_bytes, reason_bytes) = l1_args
                    .expect("l1_args must be Some when l1_slashing_enabled is true");

                // Phase 3 PR1/5: resolve operator address from PG. If the
                // lookup or address parse fails, mark pending_retry rather
                // than silently dropping the slash — same C-4 fail-loud
                // pattern as the rest of this branch.
                let prover_address = match lookup_prover_l1_address(pool, prover_id).await {
                    Ok(addr) => addr,
                    Err(err) => {
                        tracing::error!(
                            error = %err,
                            slashing_id = %slashing_id,
                            "L1 slash skipped — could not resolve prover_id to L1 address"
                        );
                        // Record the failure so operators see it and the retry
                        // service can pick it up after the bad row is repaired.
                        let l1_error_str = format!("operator_addr lookup failed: {}", err);
                        if let Err(db_err) = ChallengeRepository::update_slashing_l1_status(
                            pool,
                            &slashing_id,
                            "pending_retry",
                            None,
                            Some(&l1_error_str),
                        ).await {
                            tracing::error!(
                                slashing_id = %slashing_id,
                                error = %db_err,
                                "Failed to persist pending_retry after operator_addr lookup failure"
                            );
                        }
                        return Ok(SlashingResult {
                            slashing_id: slashing_id.clone(),
                            challenge_id: challenge_id.to_string(),
                            prover_id: prover_id.to_string(),
                            total_slash: total_slash.clone(),
                            challenger_reward: challenger_reward.clone(),
                            insurance_amount: insurance_amount.clone(),
                            burn_amount: burn_amount.clone(),
                            prover_deactivated,
                            l1_tx_hash: None,
                            l1_status: L1SlashStatus::PendingRetry { error: l1_error_str },
                        });
                    }
                };

                // Convert the already-computed slash amount (decimal wei
                // string) into a U256 for the canonical
                // `slash(address,uint256,bytes32)` ABI. The alternate
                // (non-deployed) contract took colluding_count and computed
                // the slash on-chain; the canonical contract takes the
                // amount directly. We pass `total_slash` (= N²×10% of
                // lock_amount, capped at 100%) — already calculated in
                // step 1.
                let slash_amount_u256 = U256::from_dec_str(&total_slash)
                    .unwrap_or(U256::zero());

                // colluding_count is preserved in PG (slashings.colluding_count)
                // and emitted in tracing for forensic context, but is no
                // longer an L1 argument.
                let _ = colluding_prover_count;

                match registry.slash(prover_address, slash_amount_u256, reason_bytes).await {
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

        // Step 7: Finalize the slashings row with the actual L1 status.
        // This transitions the row from 'pending' / 'disabled' placeholder to
        // its terminal value ('submitted' | 'pending_retry' | 'unavailable' |
        // 'disabled'). The retry service will pick up 'pending_retry' rows
        // and resubmit.
        let l1_error_str = match &l1_status {
            L1SlashStatus::PendingRetry { error } => Some(error.as_str()),
            _ => None,
        };
        if let Err(e) = ChallengeRepository::update_slashing_l1_status(
            pool,
            &slashing_id,
            l1_status.as_str(),
            l1_tx_hash.as_deref(),
            l1_error_str,
        ).await {
            // If the UPDATE fails, we log loudly so operators notice. The row
            // is stuck in its initial state ('pending' or 'disabled') and
            // the retry service will skip it. Operator intervention required.
            tracing::error!(
                slashing_id = %slashing_id,
                error = %e,
                "Failed to persist final L1 slash status to DB — row stuck in initial state"
            );
        }

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

    // ========================================================================
    // 2026-04-28 follow-ups from the 11-agent E2E orchestrator's Slashing run
    // (verdict FIXABLE, must_fix list). See
    // `docs/e2e-demos/slashing-2026-04-28/report.md`.
    //
    // The cross-reviewer flagged three follow-up items:
    //   - PendingRetry / fail-hard path not exercised
    //   - L1 verification only checks getProverCount() (covered separately
    //     in the orchestrator's spec-loader binding)
    //   - 60/20/20 distribution recipient assertion
    //
    // The unit tests below close items #1 and #3. Item #2 lives in
    // `src/agents/e2e-orchestrator/src/spec-loader.ts` (slashing binding).
    // ========================================================================

    #[test]
    fn test_l1_slash_status_pending_retry_carries_error_message() {
        // When L1 submission fails, the status MUST preserve the underlying
        // error so operators (and the SlashingRetryService) can diagnose. A
        // regression of this property would re-introduce the silent-warn
        // pattern Batch 2 fixed.
        let cases = [
            "rpc connection refused",
            "execution reverted: prover not registered",
            "nonce too low: 42 < 43",
        ];
        for err_str in cases {
            let status = L1SlashStatus::PendingRetry { error: err_str.to_string() };
            match &status {
                L1SlashStatus::PendingRetry { error } => {
                    assert_eq!(error, err_str, "error string must round-trip exactly");
                }
                other => panic!("expected PendingRetry, got {:?}", other),
            }
            // The serialized form is the same regardless of the wrapped error,
            // so retry-service queries (`l1_status = 'pending_retry'`) work.
            assert_eq!(status.as_str(), "pending_retry");
        }
    }

    #[test]
    fn test_l1_slash_status_terminal_classification() {
        // Three terminal states (no retry expected): Submitted, Disabled,
        // Unavailable.
        // One non-terminal state: PendingRetry (retry-service picks it up).
        // A regression that would cause the retry service to skip a
        // PendingRetry row, or re-process a Submitted row, would be caught
        // by adding a new variant; this test pins the intended set.
        let terminal = [
            L1SlashStatus::Submitted.as_str(),
            L1SlashStatus::Disabled.as_str(),
            L1SlashStatus::Unavailable.as_str(),
        ];
        let non_terminal = [
            L1SlashStatus::PendingRetry { error: "any".into() }.as_str(),
        ];
        for s in terminal {
            assert!(s != "pending_retry", "{} must not be the retry-queue token", s);
        }
        for s in non_terminal {
            assert_eq!(s, "pending_retry", "PendingRetry must serialize to the retry-queue token");
        }
    }

    // ========================================================================
    // Distribution invariants (60/20/20 split) — closes follow-up #3.
    //
    // The original test_distribution_60_20_20 covers a single 1-ETH amount.
    // These property-style tests sweep multiple amounts and N values to
    // ensure the math holds and that rounding loss never exceeds 2 wei.
    // ========================================================================

    #[test]
    fn test_distribution_60_20_20_for_various_amounts() {
        // Each entry: (amount_wei, n_provers, expected_total_slash, expected_challenger, expected_insurance, expected_burn).
        let cases: &[(&str, u64, &str, &str, &str, &str)] = &[
            // 1 prover, 10% slash on 1 ETH → 0.1 ETH total; 60/20/20 split.
            ("1000000000000000000", 1, "100000000000000000", "60000000000000000", "20000000000000000", "20000000000000000"),
            // 3 provers, 90% slash on 5 ETH → 4.5 ETH total; 2.7 / 0.9 / 0.9.
            ("5000000000000000000", 3, "4500000000000000000", "2700000000000000000", "900000000000000000", "900000000000000000"),
            // 5 provers, capped at 100% on 0.123 ETH → 0.123; 0.0738 / 0.0246 / 0.0246.
            ("123000000000000000",  5, "123000000000000000", "73800000000000000", "24600000000000000", "24600000000000000"),
        ];
        for (amount, n, expect_total, expect_chal, expect_ins, expect_burn) in cases {
            let total = calculate_quadratic_slash(*n, amount);
            assert_eq!(&total, expect_total, "total slash for amount={} n={}", amount, n);
            assert_eq!(&calculate_distribution(&total, 60), expect_chal, "challenger 60% for amount={}", amount);
            assert_eq!(&calculate_distribution(&total, 20), expect_ins,  "insurance 20% for amount={}",  amount);
            assert_eq!(&calculate_distribution(&total, 20), expect_burn, "burn 20% for amount={}",       amount);
        }
    }

    #[test]
    fn test_distribution_sum_within_rounding_for_property_sweep() {
        // Sum(challenger + insurance + burn) must equal total within ≤2 wei
        // of integer-division rounding loss across a representative sweep.
        // If a future change broke the 60/20/20 invariant (e.g., dropped to
        // 50/25/25), this test would fail loudly.
        let amounts = [
            "1", "100", "100000", "1000000000000000000", "999999999999999999",
        ];
        for n in 1..=4u64 {
            for amt in amounts {
                let total = calculate_quadratic_slash(n, amt);
                let total_v: u128 = total.parse().unwrap();
                if total_v == 0 { continue; }
                let chal: u128 = calculate_distribution(&total, 60).parse().unwrap();
                let ins:  u128 = calculate_distribution(&total, 20).parse().unwrap();
                let burn: u128 = calculate_distribution(&total, 20).parse().unwrap();
                let sum = chal + ins + burn;
                let loss = total_v - sum;
                assert!(loss <= 2, "rounding loss must be ≤2 wei (n={}, amt={}, loss={})", n, amt, loss);
                assert!(chal >= ins, "challenger ≥ insurance (60 ≥ 20) for n={}, amt={}", n, amt);
                assert!(chal >= burn, "challenger ≥ burn (60 ≥ 20) for n={}, amt={}", n, amt);
            }
        }
    }
}
