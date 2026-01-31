//! Challenge repository for database operations
//!
//! Phase 8-C: Challenge/Slashing management
//! Follows BE-001~003 rules

use bigdecimal::BigDecimal;
use chrono::{DateTime, Utc};
use sqlx::{FromRow, PgPool};
use tracing::{info, instrument, warn};

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

        let count: i64 = sqlx::query_scalar(
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
        })?
        .unwrap_or(0);

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
}
