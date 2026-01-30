//! Treasury repository for database operations
//!
//! Phase 8-C: Treasury management
//! Follows BE-001~003 rules

use bigdecimal::BigDecimal;
use chrono::{DateTime, NaiveDate, Utc};
use sqlx::{FromRow, PgPool};
use tracing::{info, instrument, warn};

use crate::error::ApiError;

// ============================================================================
// Treasury Models
// ============================================================================

#[derive(Debug, Clone, FromRow)]
pub struct TreasuryWalletRow {
    pub wallet_id: String,
    pub name: String,
    pub wallet_type: String,
    pub address: String,
    pub multisig_threshold: i32,
    pub multisig_signers: serde_json::Value,
    pub balance: BigDecimal,
    pub currency: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, FromRow)]
pub struct TreasuryTransactionRow {
    pub tx_id: String,
    pub wallet_id: String,
    pub tx_type: String,
    pub amount: BigDecimal,
    pub currency: String,
    pub from_address: Option<String>,
    pub to_address: Option<String>,
    pub purpose: Option<String>,
    pub status: String,
    pub approved_by: Option<serde_json::Value>,
    pub tx_hash: Option<String>,
    pub created_at: DateTime<Utc>,
    pub executed_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, FromRow)]
pub struct ProtocolRevenueRow {
    pub revenue_id: String,
    pub date: NaiveDate,
    pub source: String,
    pub amount: BigDecimal,
    pub currency: String,
    pub tx_hash: Option<String>,
    pub created_at: DateTime<Utc>,
}

// ============================================================================
// Treasury Repository
// ============================================================================

pub struct TreasuryRepository;

impl TreasuryRepository {
    /// Get treasury wallet by ID
    #[instrument(skip(pool))]
    pub async fn get_wallet_by_id(
        pool: &PgPool,
        wallet_id: &str,
    ) -> Result<Option<TreasuryWalletRow>, ApiError> {
        info!("DB query: get_treasury_wallet started");

        let result = sqlx::query_as::<_, TreasuryWalletRow>(
            r#"
            SELECT wallet_id, name, type as wallet_type, address,
                   multisig_threshold, multisig_signers, balance, currency,
                   created_at, updated_at
            FROM treasury_wallets
            WHERE wallet_id = $1
            "#,
        )
        .bind(wallet_id)
        .fetch_optional(pool)
        .await
        .map_err(|e| {
            warn!("DB error: get_treasury_wallet failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: get_treasury_wallet completed, found={}", result.is_some());
        Ok(result)
    }

    /// List all treasury wallets
    #[instrument(skip(pool))]
    pub async fn list_wallets(pool: &PgPool) -> Result<Vec<TreasuryWalletRow>, ApiError> {
        info!("DB query: list_treasury_wallets started");

        let results = sqlx::query_as::<_, TreasuryWalletRow>(
            r#"
            SELECT wallet_id, name, type as wallet_type, address,
                   multisig_threshold, multisig_signers, balance, currency,
                   created_at, updated_at
            FROM treasury_wallets
            ORDER BY name ASC
            "#,
        )
        .fetch_all(pool)
        .await
        .map_err(|e| {
            warn!("DB error: list_treasury_wallets failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: list_treasury_wallets completed, count={}", results.len());
        Ok(results)
    }

    /// Get total treasury balance
    #[instrument(skip(pool))]
    pub async fn get_total_balance(pool: &PgPool) -> Result<BigDecimal, ApiError> {
        info!("DB query: get_total_treasury_balance started");

        let balance: BigDecimal = sqlx::query_scalar(
            "SELECT COALESCE(SUM(balance), 0) FROM treasury_wallets"
        )
        .fetch_one(pool)
        .await
        .map_err(|e| {
            warn!("DB error: get_total_treasury_balance failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?
        .unwrap_or_else(|| BigDecimal::from(0));

        info!("DB query: get_total_treasury_balance completed");
        Ok(balance)
    }

    /// List treasury transactions
    #[instrument(skip(pool))]
    pub async fn list_transactions(
        pool: &PgPool,
        wallet_id: Option<&str>,
        status: Option<&str>,
        offset: i64,
        limit: i64,
    ) -> Result<Vec<TreasuryTransactionRow>, ApiError> {
        info!("DB query: list_treasury_transactions started");

        let results = sqlx::query_as::<_, TreasuryTransactionRow>(
            r#"
            SELECT tx_id, wallet_id, type as tx_type, amount, currency,
                   from_address, to_address, purpose, status, approved_by,
                   tx_hash, created_at, executed_at
            FROM treasury_transactions
            WHERE ($1::TEXT IS NULL OR wallet_id = $1)
              AND ($2::TEXT IS NULL OR status = $2)
            ORDER BY created_at DESC
            OFFSET $3 LIMIT $4
            "#,
        )
        .bind(wallet_id)
        .bind(status)
        .bind(offset)
        .bind(limit)
        .fetch_all(pool)
        .await
        .map_err(|e| {
            warn!("DB error: list_treasury_transactions failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: list_treasury_transactions completed, count={}", results.len());
        Ok(results)
    }

    /// Get protocol revenue for date range
    #[instrument(skip(pool))]
    pub async fn get_revenue_range(
        pool: &PgPool,
        start_date: NaiveDate,
        end_date: NaiveDate,
    ) -> Result<Vec<ProtocolRevenueRow>, ApiError> {
        info!("DB query: get_protocol_revenue started");

        let results = sqlx::query_as::<_, ProtocolRevenueRow>(
            r#"
            SELECT revenue_id, date, source, amount, currency, tx_hash, created_at
            FROM protocol_revenue
            WHERE date >= $1 AND date <= $2
            ORDER BY date DESC
            "#,
        )
        .bind(start_date)
        .bind(end_date)
        .fetch_all(pool)
        .await
        .map_err(|e| {
            warn!("DB error: get_protocol_revenue failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: get_protocol_revenue completed, count={}", results.len());
        Ok(results)
    }

    /// Get total revenue by source
    #[instrument(skip(pool))]
    pub async fn get_revenue_by_source(
        pool: &PgPool,
    ) -> Result<Vec<(String, BigDecimal)>, ApiError> {
        info!("DB query: get_revenue_by_source started");

        let results: Vec<(String, BigDecimal)> = sqlx::query_as(
            r#"
            SELECT source, COALESCE(SUM(amount), 0) as total
            FROM protocol_revenue
            GROUP BY source
            ORDER BY total DESC
            "#,
        )
        .fetch_all(pool)
        .await
        .map_err(|e| {
            warn!("DB error: get_revenue_by_source failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: get_revenue_by_source completed, sources={}", results.len());
        Ok(results)
    }
}
