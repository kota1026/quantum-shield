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
    #[instrument(skip(pool))]
    pub async fn create_slashing(
        pool: &PgPool,
        slashing_id: &str,
        challenge_id: &str,
        prover_id: &str,
        slash_amount: &BigDecimal,
        challenger_reward: &BigDecimal,
        insurance_amount: &BigDecimal,
        burn_amount: &BigDecimal,
    ) -> Result<(), ApiError> {
        info!("DB insert: slashing create started, slashing_id={}", slashing_id);

        sqlx::query(
            r#"
            INSERT INTO slashings (slashing_id, challenge_id, prover_id, slash_amount,
                                  challenger_reward, insurance_amount, burn_amount)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
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
        .execute(pool)
        .await
        .map_err(|e| {
            warn!("DB error: slashing create failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        debug!("DB insert: slashing create completed, slashing_id={}", slashing_id);
        Ok(())
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
