//! Insurance Fund repository for database operations
//!
//! Phase 5: Insurance fund management
//! Follows BE-001~003 rules

use bigdecimal::BigDecimal;
use chrono::{DateTime, Utc};
use sqlx::{FromRow, PgPool};
use tracing::{debug, info, instrument, warn};

use crate::error::ApiError;

// ============================================================================
// Insurance Models
// ============================================================================

#[derive(Debug, Clone, FromRow)]
pub struct InsuranceFundRow {
    pub fund_id: String,
    pub total_balance: BigDecimal,
    pub total_received: BigDecimal,
    pub total_claims_paid: BigDecimal,
    pub approved_claims_count: i32,
    pub rejected_claims_count: i32,
    pub updated_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, FromRow)]
pub struct InsuranceClaimRow {
    pub claim_id: String,
    pub claimant: String,
    pub claim_type: String,
    pub amount: BigDecimal,
    pub amount_usd: Option<BigDecimal>,
    pub status: String,
    pub description: String,
    pub detailed_description: Option<String>,
    pub incident_tx_hash: Option<String>,
    pub lock_id: Option<String>,
    pub submitted_at: Option<DateTime<Utc>>,
    pub processed_at: Option<DateTime<Utc>>,
    pub processed_by: Option<String>,
}

#[derive(Debug, Clone, FromRow)]
pub struct InsuranceTransactionRow {
    pub tx_hash: String,
    pub tx_type: String,
    pub amount: BigDecimal,
    pub amount_usd: Option<BigDecimal>,
    pub description: Option<String>,
    pub claim_id: Option<String>,
    pub source: Option<String>,
    pub created_at: Option<DateTime<Utc>>,
}

// ============================================================================
// Insurance Repository
// ============================================================================

pub struct InsuranceRepository;

impl InsuranceRepository {
    // ========================================================================
    // Fund Operations
    // ========================================================================

    /// Get the main insurance fund record
    #[instrument(skip(pool))]
    pub async fn get_fund(pool: &PgPool) -> Result<Option<InsuranceFundRow>, ApiError> {
        info!("DB query: get_insurance_fund started");

        let result = sqlx::query_as::<_, InsuranceFundRow>(
            r#"
            SELECT fund_id, total_balance, total_received, total_claims_paid,
                   approved_claims_count, rejected_claims_count, updated_at
            FROM insurance_fund
            WHERE fund_id = 'main'
            "#,
        )
        .fetch_optional(pool)
        .await
        .map_err(|e| {
            warn!("DB error: get_insurance_fund failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: get_insurance_fund completed, found={}", result.is_some());
        Ok(result)
    }

    // ========================================================================
    // Claims Operations
    // ========================================================================

    /// List insurance claims with optional status filter
    #[instrument(skip(pool))]
    pub async fn list_claims(
        pool: &PgPool,
        status: Option<&str>,
        offset: i64,
        limit: i64,
    ) -> Result<Vec<InsuranceClaimRow>, ApiError> {
        info!("DB query: list_insurance_claims started");

        let results = sqlx::query_as::<_, InsuranceClaimRow>(
            r#"
            SELECT claim_id, claimant, claim_type, amount, amount_usd, status,
                   description, detailed_description, incident_tx_hash, lock_id,
                   submitted_at, processed_at, processed_by
            FROM insurance_claims
            WHERE ($1::TEXT IS NULL OR status = $1)
            ORDER BY submitted_at DESC
            OFFSET $2 LIMIT $3
            "#,
        )
        .bind(status)
        .bind(offset)
        .bind(limit)
        .fetch_all(pool)
        .await
        .map_err(|e| {
            warn!("DB error: list_insurance_claims failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: list_insurance_claims completed, count={}", results.len());
        Ok(results)
    }

    /// Count insurance claims by status
    #[instrument(skip(pool))]
    pub async fn count_claims(
        pool: &PgPool,
        status: Option<&str>,
    ) -> Result<i64, ApiError> {
        info!("DB query: count_insurance_claims started");

        let count: i64 = sqlx::query_scalar::<_, i64>(
            r#"
            SELECT COUNT(*)
            FROM insurance_claims
            WHERE ($1::TEXT IS NULL OR status = $1)
            "#,
        )
        .bind(status)
        .fetch_one(pool)
        .await
        .map_err(|e| {
            warn!("DB error: count_insurance_claims failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: count_insurance_claims completed, count={}", count);
        Ok(count)
    }

    /// Count claims by type with totals
    #[instrument(skip(pool))]
    pub async fn count_claims_by_type(
        pool: &PgPool,
    ) -> Result<Vec<(String, i64, BigDecimal)>, ApiError> {
        info!("DB query: count_claims_by_type started");

        let results: Vec<(String, i64, BigDecimal)> = sqlx::query_as(
            r#"
            SELECT claim_type, COUNT(*) as cnt, COALESCE(SUM(amount), 0) as total
            FROM insurance_claims
            WHERE status IN ('approved', 'paid')
            GROUP BY claim_type
            ORDER BY cnt DESC
            "#,
        )
        .fetch_all(pool)
        .await
        .map_err(|e| {
            warn!("DB error: count_claims_by_type failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: count_claims_by_type completed, types={}", results.len());
        Ok(results)
    }

    /// Create a new insurance claim
    #[instrument(skip(pool))]
    pub async fn create_claim(
        pool: &PgPool,
        claim_id: &str,
        claimant: &str,
        claim_type: &str,
        amount: &BigDecimal,
        description: &str,
        detailed_description: &str,
        incident_tx_hash: &str,
        lock_id: Option<&str>,
        signature: &[u8],
    ) -> Result<(), ApiError> {
        info!("DB insert: create_insurance_claim started, claim_id={}", claim_id);

        sqlx::query(
            r#"
            INSERT INTO insurance_claims (claim_id, claimant, claim_type, amount, status,
                                         description, detailed_description, incident_tx_hash,
                                         lock_id, signature)
            VALUES ($1, $2, $3, $4, 'pending', $5, $6, $7, $8, $9)
            "#,
        )
        .bind(claim_id)
        .bind(claimant)
        .bind(claim_type)
        .bind(amount)
        .bind(description)
        .bind(detailed_description)
        .bind(incident_tx_hash)
        .bind(lock_id)
        .bind(signature)
        .execute(pool)
        .await
        .map_err(|e| {
            warn!("DB error: create_insurance_claim failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        debug!("DB insert: create_insurance_claim completed, claim_id={}", claim_id);
        Ok(())
    }

    // ========================================================================
    // Transactions Operations
    // ========================================================================

    /// List insurance transactions with optional type filter
    #[instrument(skip(pool))]
    pub async fn list_transactions(
        pool: &PgPool,
        tx_type: Option<&str>,
        offset: i64,
        limit: i64,
    ) -> Result<Vec<InsuranceTransactionRow>, ApiError> {
        info!("DB query: list_insurance_transactions started");

        let results = sqlx::query_as::<_, InsuranceTransactionRow>(
            r#"
            SELECT tx_hash, tx_type, amount, amount_usd, description,
                   claim_id, source, created_at
            FROM insurance_transactions
            WHERE ($1::TEXT IS NULL OR tx_type = $1)
            ORDER BY created_at DESC
            OFFSET $2 LIMIT $3
            "#,
        )
        .bind(tx_type)
        .bind(offset)
        .bind(limit)
        .fetch_all(pool)
        .await
        .map_err(|e| {
            warn!("DB error: list_insurance_transactions failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: list_insurance_transactions completed, count={}", results.len());
        Ok(results)
    }

    /// Count insurance transactions
    #[instrument(skip(pool))]
    pub async fn count_transactions(
        pool: &PgPool,
        tx_type: Option<&str>,
    ) -> Result<i64, ApiError> {
        info!("DB query: count_insurance_transactions started");

        let count: i64 = sqlx::query_scalar::<_, i64>(
            r#"
            SELECT COUNT(*)
            FROM insurance_transactions
            WHERE ($1::TEXT IS NULL OR tx_type = $1)
            "#,
        )
        .bind(tx_type)
        .fetch_one(pool)
        .await
        .map_err(|e| {
            warn!("DB error: count_insurance_transactions failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: count_insurance_transactions completed, count={}", count);
        Ok(count)
    }
}
