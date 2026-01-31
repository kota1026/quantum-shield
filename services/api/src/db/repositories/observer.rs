//! Observer repository for database operations
//!
//! Phase 8-C: Observer management for QS Admin
//! Follows BE-001~003 rules

use bigdecimal::BigDecimal;
use chrono::{DateTime, Utc};
use sqlx::{FromRow, PgPool};
use tracing::{info, instrument, warn};

use crate::error::ApiError;

// ============================================================================
// Observer Models
// ============================================================================

#[derive(Debug, Clone, FromRow)]
pub struct ObserverRow {
    pub observer_id: String,
    pub wallet_address: String,
    pub status: String,
    pub total_earnings: BigDecimal,
    pub successful_challenges: i64,
    pub failed_challenges: i64,
    pub registered_at: DateTime<Utc>,
    pub practice_mode_until: Option<DateTime<Utc>>,
    pub practice_mode_earnings: BigDecimal,
}

#[derive(Debug, Clone, FromRow)]
pub struct ObserverEarningRow {
    pub earning_id: String,
    pub observer_id: String,
    pub challenge_id: String,
    pub amount: BigDecimal,
    pub claimed: bool,
    pub claim_tx_hash: Option<String>,
    pub earned_at: DateTime<Utc>,
    pub claimed_at: Option<DateTime<Utc>>,
}

// ============================================================================
// Observer Repository
// ============================================================================

pub struct ObserverRepository;

impl ObserverRepository {
    /// Get observer by ID
    #[instrument(skip(pool))]
    pub async fn get_by_id(
        pool: &PgPool,
        observer_id: &str,
    ) -> Result<Option<ObserverRow>, ApiError> {
        info!("DB query: get_observer_by_id started");

        let result = sqlx::query_as::<_, ObserverRow>(
            r#"
            SELECT observer_id, wallet_address, status, total_earnings,
                   successful_challenges, failed_challenges, registered_at,
                   practice_mode_until, practice_mode_earnings
            FROM observers
            WHERE observer_id = $1
            "#,
        )
        .bind(observer_id)
        .fetch_optional(pool)
        .await
        .map_err(|e| {
            warn!("DB error: get_observer_by_id failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: get_observer_by_id completed, found={}", result.is_some());
        Ok(result)
    }

    /// List observers with filtering
    #[instrument(skip(pool))]
    pub async fn list_observers(
        pool: &PgPool,
        status: Option<&str>,
        offset: i64,
        limit: i64,
    ) -> Result<Vec<ObserverRow>, ApiError> {
        info!("DB query: list_observers started");

        let results = sqlx::query_as::<_, ObserverRow>(
            r#"
            SELECT observer_id, wallet_address, status, total_earnings,
                   successful_challenges, failed_challenges, registered_at,
                   practice_mode_until, practice_mode_earnings
            FROM observers
            WHERE ($1::TEXT IS NULL OR status = $1)
            ORDER BY registered_at DESC
            OFFSET $2 LIMIT $3
            "#,
        )
        .bind(status)
        .bind(offset)
        .bind(limit)
        .fetch_all(pool)
        .await
        .map_err(|e| {
            warn!("DB error: list_observers failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: list_observers completed, count={}", results.len());
        Ok(results)
    }

    /// Count observers by status
    #[instrument(skip(pool))]
    pub async fn count_by_status(
        pool: &PgPool,
        status: Option<&str>,
    ) -> Result<i64, ApiError> {
        info!("DB query: count_observers_by_status started");

        let count: i64 = sqlx::query_scalar(
            r#"
            SELECT COUNT(*)
            FROM observers
            WHERE ($1::TEXT IS NULL OR status = $1)
            "#,
        )
        .bind(status)
        .fetch_one(pool)
        .await
        .map_err(|e| {
            warn!("DB error: count_observers_by_status failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?
        .unwrap_or(0);

        info!("DB query: count_observers_by_status completed, count={}", count);
        Ok(count)
    }

    /// Get observer earnings
    #[instrument(skip(pool))]
    pub async fn get_earnings(
        pool: &PgPool,
        observer_id: &str,
        limit: i64,
    ) -> Result<Vec<ObserverEarningRow>, ApiError> {
        info!("DB query: get_observer_earnings started");

        let results = sqlx::query_as::<_, ObserverEarningRow>(
            r#"
            SELECT earning_id, observer_id, challenge_id, amount, claimed,
                   claim_tx_hash, earned_at, claimed_at
            FROM observer_earnings
            WHERE observer_id = $1
            ORDER BY earned_at DESC
            LIMIT $2
            "#,
        )
        .bind(observer_id)
        .bind(limit)
        .fetch_all(pool)
        .await
        .map_err(|e| {
            warn!("DB error: get_observer_earnings failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: get_observer_earnings completed, count={}", results.len());
        Ok(results)
    }

    // ========================================================================
    // Admin Observer Operations (Phase 8-C)
    // ========================================================================

    /// Update observer status
    /// BE-001: Real DB operation
    /// BE-003: Mandatory logging
    #[instrument(skip(pool), fields(observer_id = %observer_id, status = %status))]
    pub async fn update_status(
        pool: &PgPool,
        observer_id: &str,
        status: &str,
    ) -> Result<(), ApiError> {
        info!("DB query: update_observer_status started");

        sqlx::query(
            r#"
            UPDATE observers
            SET status = $2
            WHERE observer_id = $1
            "#,
        )
        .bind(observer_id)
        .bind(status)
        .execute(pool)
        .await
        .map_err(|e| {
            warn!("DB error: update_observer_status failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: update_observer_status completed");
        Ok(())
    }

    /// Get challenges submitted by an observer
    /// BE-001: Real DB operation
    /// BE-003: Mandatory logging
    #[instrument(skip(pool), fields(observer_id = %observer_id))]
    pub async fn get_challenges_by_observer(
        pool: &PgPool,
        observer_id: &str,
        offset: i64,
        limit: i64,
    ) -> Result<Vec<ObserverChallengeRow>, ApiError> {
        info!("DB query: get_challenges_by_observer started");

        let results = sqlx::query_as::<_, ObserverChallengeRow>(
            r#"
            SELECT c.challenge_id, c.lock_id, c.unlock_id, c.challenger, c.status,
                   c.bond, c.challenged_at, c.defense_deadline, c.resolved_at
            FROM challenges c
            WHERE c.challenger = (SELECT wallet_address FROM observers WHERE observer_id = $1)
            ORDER BY c.challenged_at DESC
            OFFSET $2 LIMIT $3
            "#,
        )
        .bind(observer_id)
        .bind(offset)
        .bind(limit)
        .fetch_all(pool)
        .await
        .map_err(|e| {
            warn!("DB error: get_challenges_by_observer failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: get_challenges_by_observer completed, count={}", results.len());
        Ok(results)
    }

    /// Count challenges by observer
    #[instrument(skip(pool), fields(observer_id = %observer_id))]
    pub async fn count_challenges_by_observer(
        pool: &PgPool,
        observer_id: &str,
    ) -> Result<i64, ApiError> {
        info!("DB query: count_challenges_by_observer started");

        let count: i64 = sqlx::query_scalar(
            r#"
            SELECT COUNT(*)
            FROM challenges c
            WHERE c.challenger = (SELECT wallet_address FROM observers WHERE observer_id = $1)
            "#,
        )
        .bind(observer_id)
        .fetch_one(pool)
        .await
        .map_err(|e| {
            warn!("DB error: count_challenges_by_observer failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?
        .unwrap_or(0);

        info!("DB query: count_challenges_by_observer completed, count={}", count);
        Ok(count)
    }
}

// ============================================================================
// Additional Models (Phase 8-C)
// ============================================================================

#[derive(Debug, Clone, FromRow)]
pub struct ObserverChallengeRow {
    pub challenge_id: String,
    pub lock_id: String,
    pub unlock_id: Option<String>,
    pub challenger: String,
    pub status: String,
    pub bond: BigDecimal,
    pub challenged_at: DateTime<Utc>,
    pub defense_deadline: DateTime<Utc>,
    pub resolved_at: Option<DateTime<Utc>>,
}
