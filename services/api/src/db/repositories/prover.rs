//! Prover repository for database operations
//!
//! Phase 8-C: Prover management for QS Admin
//! Follows BE-001~003 rules

use bigdecimal::BigDecimal;
use chrono::{DateTime, Utc};
use sqlx::{FromRow, PgPool};
use tracing::{info, instrument, warn};

use crate::error::ApiError;

// ============================================================================
// Prover Models
// ============================================================================

#[derive(Debug, Clone, FromRow)]
pub struct ProverRow {
    pub prover_id: String,
    pub operator_addr: String,
    pub sphincs_pubkey: Vec<u8>,
    pub stake_amount: BigDecimal,
    pub hsm_attestation: Option<Vec<u8>>,
    pub status: String,
    pub tier: Option<String>,
    pub registered_at: DateTime<Utc>,
    pub approved_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, FromRow)]
pub struct ProverMetricsRow {
    pub prover_id: String,
    pub total_signatures: i64,
    pub signatures_24h: i64,
    pub signatures_7d: i64,
    pub avg_response_time_ms: i64,
    pub success_rate: f64,
    pub uptime_percentage: f64,
    pub total_rewards: BigDecimal,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, FromRow)]
pub struct ProverExitRow {
    pub exit_id: String,
    pub prover_id: String,
    pub initiated_at: DateTime<Utc>,
    pub unbonding_end: DateTime<Utc>,
    pub stake_to_return: BigDecimal,
    pub pending_rewards: BigDecimal,
    pub status: String,
}

// ============================================================================
// Prover Repository
// ============================================================================

pub struct ProverRepository;

impl ProverRepository {
    /// Get prover by ID
    #[instrument(skip(pool), fields(prover_id = %prover_id))]
    pub async fn get_by_id(
        pool: &PgPool,
        prover_id: &str,
    ) -> Result<Option<ProverRow>, ApiError> {
        info!("DB query: get_prover_by_id started");

        let result = sqlx::query_as::<_, ProverRow>(
            r#"
            SELECT prover_id, operator_addr, sphincs_pubkey, stake_amount,
                   hsm_attestation, status, tier, registered_at, approved_at
            FROM provers
            WHERE prover_id = $1
            "#,
        )
        .bind(prover_id)
        .fetch_optional(pool)
        .await
        .map_err(|e| {
            warn!("DB error: get_prover_by_id failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: get_prover_by_id completed, found={}", result.is_some());
        Ok(result)
    }

    /// List provers with filtering and pagination
    #[instrument(skip(pool))]
    pub async fn list_provers(
        pool: &PgPool,
        status: Option<&str>,
        tier: Option<&str>,
        offset: i64,
        limit: i64,
    ) -> Result<Vec<ProverRow>, ApiError> {
        info!("DB query: list_provers started");

        let results = sqlx::query_as::<_, ProverRow>(
            r#"
            SELECT prover_id, operator_addr, sphincs_pubkey, stake_amount,
                   hsm_attestation, status, tier, registered_at, approved_at
            FROM provers
            WHERE ($1::TEXT IS NULL OR status = $1)
              AND ($2::TEXT IS NULL OR tier = $2)
            ORDER BY registered_at DESC
            OFFSET $3 LIMIT $4
            "#,
        )
        .bind(status)
        .bind(tier)
        .bind(offset)
        .bind(limit)
        .fetch_all(pool)
        .await
        .map_err(|e| {
            warn!("DB error: list_provers failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: list_provers completed, count={}", results.len());
        Ok(results)
    }

    /// Count provers by status
    #[instrument(skip(pool))]
    pub async fn count_by_status(
        pool: &PgPool,
        status: Option<&str>,
    ) -> Result<i64, ApiError> {
        info!("DB query: count_provers_by_status started");

        let count: i64 = sqlx::query_scalar(
            r#"
            SELECT COUNT(*)
            FROM provers
            WHERE ($1::TEXT IS NULL OR status = $1)
            "#,
        )
        .bind(status)
        .fetch_one(pool)
        .await
        .map_err(|e| {
            warn!("DB error: count_provers_by_status failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?
        .unwrap_or(0);

        info!("DB query: count_provers_by_status completed, count={}", count);
        Ok(count)
    }

    /// Create a new prover registration
    #[instrument(skip(pool, sphincs_pubkey, hsm_attestation))]
    pub async fn create(
        pool: &PgPool,
        prover_id: &str,
        operator_addr: &str,
        sphincs_pubkey: &[u8],
        stake_amount: &BigDecimal,
        hsm_attestation: Option<&[u8]>,
    ) -> Result<ProverRow, ApiError> {
        info!("DB query: create_prover started");

        let result = sqlx::query_as::<_, ProverRow>(
            r#"
            INSERT INTO provers (prover_id, operator_addr, sphincs_pubkey, stake_amount, hsm_attestation, status, registered_at)
            VALUES ($1, $2, $3, $4, $5, 'pending_approval', NOW())
            RETURNING prover_id, operator_addr, sphincs_pubkey, stake_amount, hsm_attestation, status, tier, registered_at, approved_at
            "#,
        )
        .bind(prover_id)
        .bind(operator_addr)
        .bind(sphincs_pubkey)
        .bind(stake_amount)
        .bind(hsm_attestation)
        .fetch_one(pool)
        .await
        .map_err(|e| {
            warn!("DB error: create_prover failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: create_prover completed, prover_id={}", prover_id);
        Ok(result)
    }

    /// Update prover status
    #[instrument(skip(pool))]
    pub async fn update_status(
        pool: &PgPool,
        prover_id: &str,
        status: &str,
    ) -> Result<(), ApiError> {
        info!("DB query: update_prover_status started, new_status={}", status);

        let approved_at = if status == "active" {
            Some(Utc::now())
        } else {
            None
        };

        sqlx::query(
            r#"
            UPDATE provers
            SET status = $2, approved_at = COALESCE($3, approved_at)
            WHERE prover_id = $1
            "#,
        )
        .bind(prover_id)
        .bind(status)
        .bind(approved_at)
        .execute(pool)
        .await
        .map_err(|e| {
            warn!("DB error: update_prover_status failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: update_prover_status completed");
        Ok(())
    }

    /// Get prover metrics
    #[instrument(skip(pool))]
    pub async fn get_metrics(
        pool: &PgPool,
        prover_id: &str,
    ) -> Result<Option<ProverMetricsRow>, ApiError> {
        info!("DB query: get_prover_metrics started");

        let result = sqlx::query_as::<_, ProverMetricsRow>(
            r#"
            SELECT prover_id, total_signatures, signatures_24h, signatures_7d,
                   avg_response_time_ms, success_rate, uptime_percentage,
                   total_rewards, updated_at
            FROM prover_metrics
            WHERE prover_id = $1
            "#,
        )
        .bind(prover_id)
        .fetch_optional(pool)
        .await
        .map_err(|e| {
            warn!("DB error: get_prover_metrics failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: get_prover_metrics completed, found={}", result.is_some());
        Ok(result)
    }

    /// Get pending prover applications
    #[instrument(skip(pool))]
    pub async fn list_pending_applications(
        pool: &PgPool,
        offset: i64,
        limit: i64,
    ) -> Result<Vec<ProverRow>, ApiError> {
        info!("DB query: list_pending_prover_applications started");

        let results = sqlx::query_as::<_, ProverRow>(
            r#"
            SELECT prover_id, operator_addr, sphincs_pubkey, stake_amount,
                   hsm_attestation, status, tier, registered_at, approved_at
            FROM provers
            WHERE status = 'pending_approval'
            ORDER BY registered_at ASC
            OFFSET $1 LIMIT $2
            "#,
        )
        .bind(offset)
        .bind(limit)
        .fetch_all(pool)
        .await
        .map_err(|e| {
            warn!("DB error: list_pending_prover_applications failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: list_pending_prover_applications completed, count={}", results.len());
        Ok(results)
    }

    /// Get prover exit info
    #[instrument(skip(pool))]
    pub async fn get_exit(
        pool: &PgPool,
        prover_id: &str,
    ) -> Result<Option<ProverExitRow>, ApiError> {
        info!("DB query: get_prover_exit started");

        let result = sqlx::query_as::<_, ProverExitRow>(
            r#"
            SELECT exit_id, prover_id, initiated_at, unbonding_end,
                   stake_to_return, pending_rewards, status
            FROM prover_exits
            WHERE prover_id = $1
            "#,
        )
        .bind(prover_id)
        .fetch_optional(pool)
        .await
        .map_err(|e| {
            warn!("DB error: get_prover_exit failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: get_prover_exit completed, found={}", result.is_some());
        Ok(result)
    }
}
