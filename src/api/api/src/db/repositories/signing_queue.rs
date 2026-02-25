//! Signing Queue repository for database operations
//!
//! Phase 0: Storage Migration Infrastructure
//! Manages the prover signing queue for unlock requests
//! Follows BE-001~003 rules

use chrono::{DateTime, Utc};
use sqlx::{FromRow, PgPool};
use tracing::{debug, info, instrument, warn};

use crate::error::ApiError;

// ============================================================================
// Signing Queue Models
// ============================================================================

#[derive(Debug, Clone, FromRow)]
pub struct SigningQueueRow {
    pub queue_id: String,
    pub unlock_id: Option<String>,
    pub prover_id: String,
    pub lock_id: String,
    pub sr_0: Option<String>,
    pub sr_1: Option<String>,
    pub status: Option<String>,
    pub created_at: Option<DateTime<Utc>>,
    pub completed_at: Option<DateTime<Utc>>,
    pub deadline: Option<DateTime<Utc>>,
}

// ============================================================================
// Signing Queue Repository
// ============================================================================

pub struct SigningQueueRepository;

impl SigningQueueRepository {
    /// Create a new signing queue entry
    /// BE-001: Real DB operation (no stubs)
    /// BE-003: Mandatory logging
    #[instrument(skip(pool))]
    pub async fn create(
        pool: &PgPool,
        queue_id: &str,
        unlock_id: &str,
        prover_id: &str,
        lock_id: &str,
        sr_0: &str,
        sr_1: &str,
        expires_at: Option<DateTime<Utc>>,
    ) -> Result<(), ApiError> {
        info!("DB insert: signing_queue create started, queue_id={}", queue_id);

        sqlx::query(
            r#"
            INSERT INTO signing_queue (queue_id, unlock_id, prover_id, lock_id, sr_0, sr_1, user_address, amount, status, deadline)
            VALUES ($1, $2, $3, $4, $5, $6, '', 0, 'pending', $7)
            ON CONFLICT (queue_id) DO UPDATE SET
                status = 'pending',
                created_at = NOW(),
                deadline = $7
            "#,
        )
        .bind(queue_id)
        .bind(unlock_id)
        .bind(prover_id)
        .bind(lock_id)
        .bind(sr_0)
        .bind(sr_1)
        .bind(expires_at)
        .execute(pool)
        .await
        .map_err(|e| {
            warn!("DB error: signing_queue create failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        debug!("DB insert: signing_queue create completed, queue_id={}", queue_id);
        Ok(())
    }

    /// Get a single signing queue entry by ID
    /// Phase 2: SM-002 support for get_queue_item
    #[instrument(skip(pool), fields(queue_id = %queue_id))]
    pub async fn get_by_id(
        pool: &PgPool,
        queue_id: &str,
    ) -> Result<Option<SigningQueueRow>, ApiError> {
        info!("DB query: signing_queue get_by_id started");

        let result = sqlx::query_as::<_, SigningQueueRow>(
            r#"
            SELECT queue_id, unlock_id, prover_id, lock_id, sr_0, sr_1,
                   status, created_at, completed_at, deadline
            FROM signing_queue
            WHERE queue_id = $1
            "#,
        )
        .bind(queue_id)
        .fetch_optional(pool)
        .await
        .map_err(|e| {
            warn!("DB error: signing_queue get_by_id failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: signing_queue get_by_id completed, found={}", result.is_some());
        Ok(result)
    }

    /// Get signing queue entries for a prover
    #[instrument(skip(pool), fields(prover_id = %prover_id))]
    pub async fn get_by_prover(
        pool: &PgPool,
        prover_id: &str,
        status: Option<&str>,
    ) -> Result<Vec<SigningQueueRow>, ApiError> {
        info!("DB query: signing_queue get_by_prover started");

        let results = sqlx::query_as::<_, SigningQueueRow>(
            r#"
            SELECT queue_id, unlock_id, prover_id, lock_id, sr_0, sr_1,
                   status, created_at, completed_at, deadline
            FROM signing_queue
            WHERE prover_id = $1
              AND ($2::TEXT IS NULL OR status = $2)
            ORDER BY created_at DESC
            "#,
        )
        .bind(prover_id)
        .bind(status)
        .fetch_all(pool)
        .await
        .map_err(|e| {
            warn!("DB error: signing_queue get_by_prover failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: signing_queue get_by_prover completed, count={}", results.len());
        Ok(results)
    }

    /// Get signing queue entries for an unlock request
    #[instrument(skip(pool), fields(unlock_id = %unlock_id))]
    pub async fn get_by_unlock(
        pool: &PgPool,
        unlock_id: &str,
    ) -> Result<Vec<SigningQueueRow>, ApiError> {
        info!("DB query: signing_queue get_by_unlock started");

        let results = sqlx::query_as::<_, SigningQueueRow>(
            r#"
            SELECT queue_id, unlock_id, prover_id, lock_id, sr_0, sr_1,
                   status, created_at, completed_at, deadline
            FROM signing_queue
            WHERE unlock_id = $1
            ORDER BY created_at ASC
            "#,
        )
        .bind(unlock_id)
        .fetch_all(pool)
        .await
        .map_err(|e| {
            warn!("DB error: signing_queue get_by_unlock failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: signing_queue get_by_unlock completed, count={}", results.len());
        Ok(results)
    }

    /// Update signing queue entry status
    #[instrument(skip(pool), fields(queue_id = %queue_id, new_status = %new_status))]
    pub async fn update_status(
        pool: &PgPool,
        queue_id: &str,
        new_status: &str,
    ) -> Result<(), ApiError> {
        info!("DB update: signing_queue update_status started");

        let completed_at = if new_status == "signed" {
            Some(Utc::now())
        } else {
            None
        };

        sqlx::query(
            r#"
            UPDATE signing_queue
            SET status = $2,
                completed_at = COALESCE($3, completed_at)
            WHERE queue_id = $1
            "#,
        )
        .bind(queue_id)
        .bind(new_status)
        .bind(completed_at)
        .execute(pool)
        .await
        .map_err(|e| {
            warn!("DB error: signing_queue update_status failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        debug!("DB update: signing_queue update_status completed, queue_id={}, status={}", queue_id, new_status);
        Ok(())
    }

    /// Expire stale queue entries
    #[instrument(skip(pool))]
    pub async fn expire_stale(pool: &PgPool) -> Result<i64, ApiError> {
        info!("DB update: signing_queue expire_stale started");

        let result = sqlx::query(
            r#"
            UPDATE signing_queue
            SET status = 'expired'
            WHERE status = 'pending'
              AND deadline IS NOT NULL
              AND deadline < NOW()
            "#,
        )
        .execute(pool)
        .await
        .map_err(|e| {
            warn!("DB error: signing_queue expire_stale failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        let expired_count = result.rows_affected() as i64;
        info!("DB update: signing_queue expire_stale completed, expired={}", expired_count);
        Ok(expired_count)
    }

    /// Count pending entries for a prover
    #[instrument(skip(pool), fields(prover_id = %prover_id))]
    pub async fn count_pending_by_prover(
        pool: &PgPool,
        prover_id: &str,
    ) -> Result<i64, ApiError> {
        let count: i64 = sqlx::query_scalar::<_, i64>(
            r#"
            SELECT COUNT(*)
            FROM signing_queue
            WHERE prover_id = $1 AND status = 'pending'
            "#,
        )
        .bind(prover_id)
        .fetch_one(pool)
        .await
        .map_err(|e| {
            warn!("DB error: signing_queue count_pending failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        Ok(count)
    }
}
