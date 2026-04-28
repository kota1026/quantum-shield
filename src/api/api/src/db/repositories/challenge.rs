//! Challenge repository for database operations
//!
//! Phase 8-C: Challenge/Slashing management
//! Follows BE-001~003 rules

use bigdecimal::BigDecimal;
use chrono::{DateTime, Utc};
use sqlx::{FromRow, PgPool};
use tracing::{debug, info, instrument, warn};

use crate::error::ApiError;

// ============================================================================
// Challenge Models
// ============================================================================

#[derive(Debug, Clone, FromRow)]
pub struct ChallengeRow {
    pub challenge_id: String,
    pub lock_id: String,
    pub unlock_id: Option<String>,
    pub challenger: String,
    pub fraud_proof_hash: String,
    pub bond: BigDecimal,
    pub challenged_at: DateTime<Utc>,
    pub defense_deadline: DateTime<Utc>,
    pub status: String,
    pub defender: Option<String>,
    pub defense_proof_hash: Option<String>,
    pub resolved_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, FromRow)]
pub struct SlashingRow {
    pub slashing_id: String,
    pub challenge_id: String,
    pub prover_id: String,
    pub slash_amount: BigDecimal,
    pub challenger_reward: BigDecimal,
    pub insurance_amount: BigDecimal,
    pub burn_amount: BigDecimal,
    pub l1_tx_hash: Option<String>,
    pub slashed_at: DateTime<Utc>,
}

/// Slim projection for the SlashingRetryService retry queue.
///
/// Only the columns needed to retry an L1 `ProverRegistry.slash()` call.
#[derive(Debug, Clone, FromRow)]
pub struct PendingRetrySlashing {
    pub slashing_id: String,
    pub challenge_id: String,
    pub prover_id: String,
    #[allow(dead_code)]
    pub slash_amount: BigDecimal,
    pub colluding_count: i32,
    pub l1_retry_count: i32,
    #[allow(dead_code)]
    pub l1_last_retry_at: Option<DateTime<Utc>>,
    #[allow(dead_code)]
    pub l1_error: Option<String>,
}

// ============================================================================
// Challenge Repository
// ============================================================================

pub struct ChallengeRepository;

impl ChallengeRepository {
    // ========================================================================
    // Write Operations (Storage Migration Phase 2)
    // ========================================================================

    /// Create a new challenge record in PostgreSQL
    /// SM-001: PG first, then Redis cache
    /// BE-001: Real DB operation (no stubs)
    /// BE-003: Mandatory logging
    #[instrument(skip(pool))]
    pub async fn create(
        pool: &PgPool,
        challenge_id: &str,
        lock_id: &str,
        challenger: &str,
        fraud_proof_hash: &str,
        bond: &BigDecimal,
        defense_deadline: DateTime<Utc>,
    ) -> Result<(), ApiError> {
        info!("DB insert: challenge create started, challenge_id={}", challenge_id);

        sqlx::query(
            r#"
            INSERT INTO challenges (challenge_id, lock_id, challenger, fraud_proof_hash,
                                   bond, defense_deadline, status)
            VALUES ($1, $2, $3, $4, $5, $6, 'pending')
            ON CONFLICT (challenge_id) DO NOTHING
            "#,
        )
        .bind(challenge_id)
        .bind(lock_id)
        .bind(challenger)
        .bind(fraud_proof_hash)
        .bind(bond)
        .bind(defense_deadline)
        .execute(pool)
        .await
        .map_err(|e| {
            warn!("DB error: challenge create failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        debug!("DB insert: challenge create completed, challenge_id={}", challenge_id);
        Ok(())
    }

    /// Update challenge status
    /// SM-001: PG first
    #[instrument(skip(pool), fields(challenge_id = %challenge_id, new_status = %new_status))]
    pub async fn update_status(
        pool: &PgPool,
        challenge_id: &str,
        new_status: &str,
        defender: Option<&str>,
        defense_proof_hash: Option<&str>,
    ) -> Result<(), ApiError> {
        info!("DB update: challenge update_status started, id={}, status={}", challenge_id, new_status);

        let resolved_at = if new_status.starts_with("resolved") {
            Some(Utc::now())
        } else {
            None
        };

        sqlx::query(
            r#"
            UPDATE challenges
            SET status = $2,
                defender = COALESCE($3, defender),
                defense_proof_hash = COALESCE($4, defense_proof_hash),
                resolved_at = COALESCE($5, resolved_at)
            WHERE challenge_id = $1
            "#,
        )
        .bind(challenge_id)
        .bind(new_status)
        .bind(defender)
        .bind(defense_proof_hash)
        .bind(resolved_at)
        .execute(pool)
        .await
        .map_err(|e| {
            warn!("DB error: challenge update_status failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        debug!("DB update: challenge update_status completed");
        Ok(())
    }

    /// Create a slashing record
    /// SM-001: PG first
    ///
    /// C-4 fix (2026-04-11): accepts `l1_status` explicitly. Previously the
    /// column did not exist and the in-memory L1SlashStatus was discarded
    /// when the SlashingResult fell out of scope. Now the DB is the source
    /// of truth for L1 lifecycle so the SlashingRetryService can find rows
    /// that need retrying.
    #[instrument(skip(pool))]
    #[allow(clippy::too_many_arguments)]
    pub async fn create_slashing(
        pool: &PgPool,
        slashing_id: &str,
        challenge_id: &str,
        prover_id: &str,
        slash_amount: &BigDecimal,
        challenger_reward: &BigDecimal,
        insurance_amount: &BigDecimal,
        burn_amount: &BigDecimal,
        colluding_count: i32,
        l1_status: &str,
        l1_tx_hash: Option<&str>,
        l1_error: Option<&str>,
    ) -> Result<(), ApiError> {
        info!(
            slashing_id = %slashing_id,
            l1_status = %l1_status,
            "DB insert: slashing create started"
        );

        sqlx::query(
            r#"
            INSERT INTO slashings (
                slashing_id, challenge_id, prover_id, slash_amount,
                challenger_reward, insurance_amount, burn_amount,
                colluding_count, l1_status, l1_tx_hash, l1_error
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            ON CONFLICT (slashing_id) DO NOTHING
            "#,
        )
        .bind(slashing_id)
        .bind(challenge_id)
        .bind(prover_id)
        .bind(slash_amount)
        .bind(challenger_reward)
        .bind(insurance_amount)
        .bind(burn_amount)
        .bind(colluding_count)
        .bind(l1_status)
        .bind(l1_tx_hash)
        .bind(l1_error)
        .execute(pool)
        .await
        .map_err(|e| {
            warn!("DB error: slashing create failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        debug!("DB insert: slashing create completed, slashing_id={}", slashing_id);
        Ok(())
    }

    /// Fetch slashings that need L1 retry.
    ///
    /// Returns rows where `l1_status = 'pending_retry'` and the retry count is
    /// below `max_retries`. Ordered by oldest last_retry_at first (or NULL first)
    /// so we don't starve new retries while old ones keep failing.
    #[instrument(skip(pool))]
    pub async fn fetch_pending_retry_slashings(
        pool: &PgPool,
        max_retries: i32,
        limit: i64,
    ) -> Result<Vec<PendingRetrySlashing>, ApiError> {
        let rows = sqlx::query_as::<_, PendingRetrySlashing>(
            r#"
            SELECT slashing_id, challenge_id, prover_id, slash_amount,
                   colluding_count, l1_retry_count, l1_last_retry_at, l1_error
              FROM slashings
             WHERE l1_status = 'pending_retry'
               AND l1_retry_count < $1
             ORDER BY l1_last_retry_at NULLS FIRST
             LIMIT $2
            "#,
        )
        .bind(max_retries)
        .bind(limit)
        .fetch_all(pool)
        .await
        .map_err(|e| {
            warn!("DB error: fetch_pending_retry_slashings failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        Ok(rows)
    }

    /// Record a successful L1 slash submission after a retry.
    #[instrument(skip(pool))]
    pub async fn mark_slashing_l1_submitted(
        pool: &PgPool,
        slashing_id: &str,
        l1_tx_hash: &str,
    ) -> Result<(), ApiError> {
        sqlx::query(
            r#"
            UPDATE slashings
               SET l1_status = 'submitted',
                   l1_tx_hash = $2,
                   l1_error = NULL,
                   l1_last_retry_at = NOW()
             WHERE slashing_id = $1
            "#,
        )
        .bind(slashing_id)
        .bind(l1_tx_hash)
        .execute(pool)
        .await
        .map_err(|e| {
            warn!("DB error: mark_slashing_l1_submitted failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        Ok(())
    }

    /// Update the L1 lifecycle state of a slashing after an initial L1 call.
    ///
    /// Used by `SlashingService::execute_slashing` to finalize the L1 status
    /// after the on-chain call returns. Retry attempts should use
    /// `mark_slashing_l1_submitted` / `mark_slashing_l1_retry_failed` instead
    /// so the retry counter is not affected.
    ///
    /// 2026-04-28 hardening: validates that any l1_tx_hash recorded with
    /// status='submitted' is a canonical 0x-prefixed 32-byte (66-char) hex
    /// string. Stub literals like `"0x_l1slash_tx_abcd"` are rejected and
    /// rewritten to status='pending_retry' with an explanatory error so a
    /// mocked L1 client cannot masquerade as a real on-chain submission.
    /// The error is logged at ERROR (loud, not silent) and surfaced via
    /// the `l1_error` column.
    #[instrument(skip(pool))]
    pub async fn update_slashing_l1_status(
        pool: &PgPool,
        slashing_id: &str,
        l1_status: &str,
        l1_tx_hash: Option<&str>,
        l1_error: Option<&str>,
    ) -> Result<(), ApiError> {
        let is_canonical_tx_hash = |s: &str| -> bool {
            s.len() == 66
                && s.starts_with("0x")
                && s[2..].chars().all(|c| c.is_ascii_hexdigit())
        };
        let (effective_status, effective_hash, effective_error): (String, Option<String>, Option<String>) =
            match (l1_status, l1_tx_hash) {
                ("submitted", Some(h)) if !is_canonical_tx_hash(h) => {
                    tracing::error!(
                        slashing_id = %slashing_id,
                        rejected_hash = %h,
                        "L1 slash tx_hash is not a canonical 32-byte hex hash — \
                         refusing to record as 'submitted'. Likely cause: l1.mode=mock \
                         or stubbed L1 client. Forcing pending_retry."
                    );
                    (
                        "pending_retry".to_string(),
                        None,
                        Some(format!(
                            "non-canonical tx_hash rejected: {} (expected 0x + 64 hex chars)",
                            h
                        )),
                    )
                }
                _ => (
                    l1_status.to_string(),
                    l1_tx_hash.map(str::to_string),
                    l1_error.map(str::to_string),
                ),
            };

        sqlx::query(
            r#"
            UPDATE slashings
               SET l1_status = $2,
                   l1_tx_hash = $3,
                   l1_error = $4
             WHERE slashing_id = $1
            "#,
        )
        .bind(slashing_id)
        .bind(&effective_status)
        .bind(effective_hash.as_deref())
        .bind(effective_error.as_deref())
        .execute(pool)
        .await
        .map_err(|e| {
            warn!("DB error: update_slashing_l1_status failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        Ok(())
    }

    /// Record a failed L1 retry attempt, incrementing the counter.
    #[instrument(skip(pool))]
    pub async fn mark_slashing_l1_retry_failed(
        pool: &PgPool,
        slashing_id: &str,
        error: &str,
    ) -> Result<(), ApiError> {
        sqlx::query(
            r#"
            UPDATE slashings
               SET l1_retry_count = l1_retry_count + 1,
                   l1_last_retry_at = NOW(),
                   l1_error = $2
             WHERE slashing_id = $1
            "#,
        )
        .bind(slashing_id)
        .bind(error)
        .execute(pool)
        .await
        .map_err(|e| {
            warn!("DB error: mark_slashing_l1_retry_failed failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        Ok(())
    }

    /// Count distinct provers who have actually signed for the unlock(s) of a
    /// given lock. Used to derive `colluding_count` for the quadratic slashing
    /// formula (`N² × 10%`).
    ///
    /// Pre-Sherlock blocker (CRITICAL-2, 2026-04-28): the previous code in
    /// `routes/challenge.rs::auto_resolve` hardcoded `colluding_count = 1`,
    /// collapsing the quadratic formula to a flat 10% slash regardless of
    /// how many provers actually colluded. This function returns the real
    /// count from the `signing_queue` table joined through `unlock_requests`.
    ///
    /// The minimum returned is 1 — a challenge cannot reach `auto_resolve`
    /// without at least one prover having processed the unlock, so a 0
    /// result indicates a data-consistency issue and we conservatively use 1
    /// (the legacy behavior) rather than 0 (no slash) so the slashing
    /// pipeline still triggers.
    ///
    /// 2026-04-28 hardening (E2E orchestrator bug-hunter HIGH finding):
    /// filter on `signed_at IS NOT NULL` (append-only evidence) rather than
    /// `status = 'signed'` (mutable). A colluding prover that is later
    /// slashed, revoked, or exits would otherwise silently drop out of the
    /// count and reduce the quadratic slash mid-flow — a re-introduction
    /// of CRITICAL-2's spirit through a different vector.
    #[instrument(skip(pool), fields(lock_id = %lock_id))]
    pub async fn count_signed_provers_for_lock(
        pool: &PgPool,
        lock_id: &str,
    ) -> Result<u64, ApiError> {
        info!("DB query: count_signed_provers_for_lock started, lock_id={}", lock_id);

        let row: (i64,) = sqlx::query_as(
            r#"
            SELECT COUNT(DISTINCT sq.prover_id)::BIGINT
            FROM signing_queue sq
            INNER JOIN unlock_requests ur ON sq.unlock_id = ur.unlock_id
            WHERE ur.lock_id = $1
              AND sq.signed_at IS NOT NULL
            "#,
        )
        .bind(lock_id)
        .fetch_one(pool)
        .await
        .map_err(|e| {
            warn!("DB error: count_signed_provers_for_lock failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        let count = row.0.max(1) as u64;
        info!("DB query: count_signed_provers_for_lock completed, count={}", count);
        Ok(count)
    }

    /// Get challenge by lock_id
    #[instrument(skip(pool), fields(lock_id = %lock_id))]
    pub async fn get_by_lock_id(
        pool: &PgPool,
        lock_id: &str,
    ) -> Result<Option<ChallengeRow>, ApiError> {
        info!("DB query: get_challenge_by_lock_id started");

        let result = sqlx::query_as::<_, ChallengeRow>(
            r#"
            SELECT challenge_id, lock_id, unlock_id, challenger, fraud_proof_hash,
                   bond, challenged_at, defense_deadline, status, defender,
                   defense_proof_hash, resolved_at
            FROM challenges
            WHERE lock_id = $1
            ORDER BY challenged_at DESC
            LIMIT 1
            "#,
        )
        .bind(lock_id)
        .fetch_optional(pool)
        .await
        .map_err(|e| {
            warn!("DB error: get_challenge_by_lock_id failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: get_challenge_by_lock_id completed, found={}", result.is_some());
        Ok(result)
    }

    // ========================================================================
    // Read Operations (Phase 8-C)
    // ========================================================================

    /// Get challenge by ID
    #[instrument(skip(pool))]
    pub async fn get_by_id(
        pool: &PgPool,
        challenge_id: &str,
    ) -> Result<Option<ChallengeRow>, ApiError> {
        info!("DB query: get_challenge_by_id started");

        let result = sqlx::query_as::<_, ChallengeRow>(
            r#"
            SELECT challenge_id, lock_id, unlock_id, challenger, fraud_proof_hash,
                   bond, challenged_at, defense_deadline, status, defender,
                   defense_proof_hash, resolved_at
            FROM challenges
            WHERE challenge_id = $1
            "#,
        )
        .bind(challenge_id)
        .fetch_optional(pool)
        .await
        .map_err(|e| {
            warn!("DB error: get_challenge_by_id failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: get_challenge_by_id completed, found={}", result.is_some());
        Ok(result)
    }

    /// List challenges with filtering
    #[instrument(skip(pool))]
    pub async fn list_challenges(
        pool: &PgPool,
        status: Option<&str>,
        offset: i64,
        limit: i64,
    ) -> Result<Vec<ChallengeRow>, ApiError> {
        info!("DB query: list_challenges started");

        let results = sqlx::query_as::<_, ChallengeRow>(
            r#"
            SELECT challenge_id, lock_id, unlock_id, challenger, fraud_proof_hash,
                   bond, challenged_at, defense_deadline, status, defender,
                   defense_proof_hash, resolved_at
            FROM challenges
            WHERE ($1::TEXT IS NULL OR status = $1)
            ORDER BY challenged_at DESC
            OFFSET $2 LIMIT $3
            "#,
        )
        .bind(status)
        .bind(offset)
        .bind(limit)
        .fetch_all(pool)
        .await
        .map_err(|e| {
            warn!("DB error: list_challenges failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: list_challenges completed, count={}", results.len());
        Ok(results)
    }

    /// Count challenges by status
    #[instrument(skip(pool))]
    pub async fn count_by_status(
        pool: &PgPool,
        status: Option<&str>,
    ) -> Result<i64, ApiError> {
        info!("DB query: count_challenges_by_status started");

        let count: i64 = sqlx::query_scalar::<_, i64>(
            r#"
            SELECT COUNT(*)
            FROM challenges
            WHERE ($1::TEXT IS NULL OR status = $1)
            "#,
        )
        .bind(status)
        .fetch_one(pool)
        .await
        .map_err(|e| {
            warn!("DB error: count_challenges_by_status failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;


        info!("DB query: count_challenges_by_status completed, count={}", count);
        Ok(count)
    }

    /// Get pending challenges (expiring soon)
    #[instrument(skip(pool))]
    pub async fn list_expiring_soon(
        pool: &PgPool,
        hours: i32,
    ) -> Result<Vec<ChallengeRow>, ApiError> {
        info!("DB query: list_expiring_challenges started");

        let results = sqlx::query_as::<_, ChallengeRow>(
            r#"
            SELECT challenge_id, lock_id, unlock_id, challenger, fraud_proof_hash,
                   bond, challenged_at, defense_deadline, status, defender,
                   defense_proof_hash, resolved_at
            FROM challenges
            WHERE status = 'pending'
              AND defense_deadline < NOW() + $1 * INTERVAL '1 hour'
            ORDER BY defense_deadline ASC
            "#,
        )
        .bind(hours)
        .fetch_all(pool)
        .await
        .map_err(|e| {
            warn!("DB error: list_expiring_challenges failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: list_expiring_challenges completed, count={}", results.len());
        Ok(results)
    }

    /// Get slashing record for a challenge
    #[instrument(skip(pool))]
    pub async fn get_slashing(
        pool: &PgPool,
        challenge_id: &str,
    ) -> Result<Option<SlashingRow>, ApiError> {
        info!("DB query: get_slashing started");

        let result = sqlx::query_as::<_, SlashingRow>(
            r#"
            SELECT slashing_id, challenge_id, prover_id, slash_amount,
                   challenger_reward, insurance_amount, burn_amount,
                   l1_tx_hash, slashed_at
            FROM slashings
            WHERE challenge_id = $1
            "#,
        )
        .bind(challenge_id)
        .fetch_optional(pool)
        .await
        .map_err(|e| {
            warn!("DB error: get_slashing failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: get_slashing completed, found={}", result.is_some());
        Ok(result)
    }

    // ========================================================================
    // Admin Challenge Operations (Phase 8-C)
    // ========================================================================

    /// Admin intervention on a challenge
    /// BE-001: Real DB operation
    /// BE-003: Mandatory logging
    #[instrument(skip(pool), fields(challenge_id = %challenge_id, action = %action))]
    pub async fn admin_intervene(
        pool: &PgPool,
        challenge_id: &str,
        action: &str,
        admin_id: &str,
        reason: &str,
    ) -> Result<ChallengeRow, ApiError> {
        info!("DB query: admin_intervene started");

        let new_status = match action {
            "approve_challenge" => "approved_by_admin",
            "reject_challenge" => "rejected_by_admin",
            "extend_defense" => "defense_extended",
            _ => return Err(ApiError::BadRequest(format!("Invalid action: {}", action))),
        };

        // Update challenge status
        let result = sqlx::query_as::<_, ChallengeRow>(
            r#"
            UPDATE challenges
            SET status = $2,
                defense_proof_hash = CASE WHEN $3 = 'extend_defense' THEN defense_proof_hash ELSE $4 END,
                defense_deadline = CASE WHEN $3 = 'extend_defense' THEN defense_deadline + INTERVAL '48 hours' ELSE defense_deadline END,
                resolved_at = CASE WHEN $3 IN ('approve_challenge', 'reject_challenge') THEN NOW() ELSE resolved_at END
            WHERE challenge_id = $1
            RETURNING challenge_id, lock_id, unlock_id, challenger, fraud_proof_hash,
                      bond, challenged_at, defense_deadline, status, defender,
                      defense_proof_hash, resolved_at
            "#,
        )
        .bind(challenge_id)
        .bind(new_status)
        .bind(action)
        .bind(format!("Admin intervention: {} - {}", admin_id, reason))
        .fetch_one(pool)
        .await
        .map_err(|e| {
            warn!("DB error: admin_intervene failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: admin_intervene completed, new_status={}", new_status);
        Ok(result)
    }
}
