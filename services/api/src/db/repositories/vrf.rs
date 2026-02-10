//! VRF repository for database operations
//!
//! Phase 0: Storage Migration Infrastructure
//! Manages VRF (Verifiable Random Function) requests for prover selection
//! Follows BE-001~003 rules

use chrono::{DateTime, Utc};
use sqlx::{FromRow, PgPool};
use tracing::{debug, info, instrument, warn};

use crate::error::ApiError;

// ============================================================================
// VRF Models
// ============================================================================

#[derive(Debug, Clone, FromRow)]
pub struct VrfRequestRow {
    pub vrf_id: String,
    pub unlock_id: String,
    pub vrf_seed: Vec<u8>,
    pub selected_prover_ids: serde_json::Value,
    pub prover_weights: serde_json::Value,
    pub status: String,
    pub requested_at: Option<DateTime<Utc>>,
    pub completed_at: Option<DateTime<Utc>>,
}

// ============================================================================
// VRF Repository
// ============================================================================

pub struct VrfRepository;

impl VrfRepository {
    /// Create a new VRF request
    /// BE-001: Real DB operation (no stubs)
    /// BE-003: Mandatory logging
    #[instrument(skip(pool, vrf_seed))]
    pub async fn create(
        pool: &PgPool,
        vrf_id: &str,
        unlock_id: &str,
        vrf_seed: &[u8],
        selected_prover_ids: &serde_json::Value,
        prover_weights: &serde_json::Value,
    ) -> Result<(), ApiError> {
        info!("DB insert: vrf_request create started, vrf_id={}", vrf_id);

        sqlx::query(
            r#"
            INSERT INTO vrf_requests (vrf_id, unlock_id, vrf_seed, selected_prover_ids, prover_weights, status)
            VALUES ($1, $2, $3, $4, $5, 'pending')
            ON CONFLICT (unlock_id) DO UPDATE SET
                vrf_seed = $3,
                selected_prover_ids = $4,
                prover_weights = $5,
                status = 'pending',
                requested_at = NOW()
            "#,
        )
        .bind(vrf_id)
        .bind(unlock_id)
        .bind(vrf_seed)
        .bind(selected_prover_ids)
        .bind(prover_weights)
        .execute(pool)
        .await
        .map_err(|e| {
            warn!("DB error: vrf_request create failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        debug!("DB insert: vrf_request create completed, vrf_id={}", vrf_id);
        Ok(())
    }

    /// Get VRF request by ID
    #[instrument(skip(pool), fields(vrf_id = %vrf_id))]
    pub async fn get_by_id(
        pool: &PgPool,
        vrf_id: &str,
    ) -> Result<Option<VrfRequestRow>, ApiError> {
        info!("DB query: vrf_request get_by_id started");

        let result = sqlx::query_as::<_, VrfRequestRow>(
            r#"
            SELECT vrf_id, unlock_id, vrf_seed, selected_prover_ids, prover_weights,
                   status, requested_at, completed_at
            FROM vrf_requests
            WHERE vrf_id = $1
            "#,
        )
        .bind(vrf_id)
        .fetch_optional(pool)
        .await
        .map_err(|e| {
            warn!("DB error: vrf_request get_by_id failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: vrf_request get_by_id completed, found={}", result.is_some());
        Ok(result)
    }

    /// Get VRF request by unlock ID
    #[instrument(skip(pool), fields(unlock_id = %unlock_id))]
    pub async fn get_by_unlock_id(
        pool: &PgPool,
        unlock_id: &str,
    ) -> Result<Option<VrfRequestRow>, ApiError> {
        info!("DB query: vrf_request get_by_unlock_id started");

        let result = sqlx::query_as::<_, VrfRequestRow>(
            r#"
            SELECT vrf_id, unlock_id, vrf_seed, selected_prover_ids, prover_weights,
                   status, requested_at, completed_at
            FROM vrf_requests
            WHERE unlock_id = $1
            "#,
        )
        .bind(unlock_id)
        .fetch_optional(pool)
        .await
        .map_err(|e| {
            warn!("DB error: vrf_request get_by_unlock_id failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: vrf_request get_by_unlock_id completed, found={}", result.is_some());
        Ok(result)
    }

    /// Update VRF request status
    #[instrument(skip(pool), fields(vrf_id = %vrf_id, new_status = %new_status))]
    pub async fn update_status(
        pool: &PgPool,
        vrf_id: &str,
        new_status: &str,
    ) -> Result<(), ApiError> {
        info!("DB update: vrf_request update_status started");

        let completed_at = if new_status == "fulfilled" || new_status == "fallback_used" {
            Some(Utc::now())
        } else {
            None
        };

        sqlx::query(
            r#"
            UPDATE vrf_requests
            SET status = $2,
                completed_at = COALESCE($3, completed_at)
            WHERE vrf_id = $1
            "#,
        )
        .bind(vrf_id)
        .bind(new_status)
        .bind(completed_at)
        .execute(pool)
        .await
        .map_err(|e| {
            warn!("DB error: vrf_request update_status failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        debug!("DB update: vrf_request update_status completed, vrf_id={}, status={}", vrf_id, new_status);
        Ok(())
    }

    /// List VRF requests with filtering
    #[instrument(skip(pool))]
    pub async fn list_requests(
        pool: &PgPool,
        status: Option<&str>,
        offset: i64,
        limit: i64,
    ) -> Result<Vec<VrfRequestRow>, ApiError> {
        info!("DB query: vrf_request list started");

        let results = sqlx::query_as::<_, VrfRequestRow>(
            r#"
            SELECT vrf_id, unlock_id, vrf_seed, selected_prover_ids, prover_weights,
                   status, requested_at, completed_at
            FROM vrf_requests
            WHERE ($1::TEXT IS NULL OR status = $1)
            ORDER BY requested_at DESC
            OFFSET $2 LIMIT $3
            "#,
        )
        .bind(status)
        .bind(offset)
        .bind(limit)
        .fetch_all(pool)
        .await
        .map_err(|e| {
            warn!("DB error: vrf_request list failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: vrf_request list completed, count={}", results.len());
        Ok(results)
    }
}
