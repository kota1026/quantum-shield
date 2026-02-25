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

        let balance: BigDecimal = sqlx::query_scalar::<_, BigDecimal>(
            "SELECT COALESCE(SUM(balance), 0) FROM treasury_wallets"
        )
        .fetch_one(pool)
        .await
        .map_err(|e| {
            warn!("DB error: get_total_treasury_balance failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

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

    // ========================================================================
    // Admin Treasury Operations (Phase 8-C)
    // ========================================================================

    /// Get transaction by ID
    /// BE-001: Real DB operation
    /// BE-003: Mandatory logging
    #[instrument(skip(pool), fields(tx_id = %tx_id))]
    pub async fn get_transaction_by_id(
        pool: &PgPool,
        tx_id: &str,
    ) -> Result<Option<TreasuryTransactionRow>, ApiError> {
        info!("DB query: get_treasury_transaction started");

        let result = sqlx::query_as::<_, TreasuryTransactionRow>(
            r#"
            SELECT tx_id, wallet_id, type as tx_type, amount, currency,
                   from_address, to_address, purpose, status, approved_by,
                   tx_hash, created_at, executed_at
            FROM treasury_transactions
            WHERE tx_id = $1
            "#,
        )
        .bind(tx_id)
        .fetch_optional(pool)
        .await
        .map_err(|e| {
            warn!("DB error: get_treasury_transaction failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: get_treasury_transaction completed, found={}", result.is_some());
        Ok(result)
    }

    /// Count transactions with filters
    #[instrument(skip(pool), fields(wallet_id = ?wallet_id, status = ?status))]
    pub async fn count_transactions(
        pool: &PgPool,
        wallet_id: Option<&str>,
        status: Option<&str>,
    ) -> Result<i64, ApiError> {
        info!("DB query: count_treasury_transactions started");

        let count: i64 = sqlx::query_scalar::<_, i64>(
            r#"
            SELECT COUNT(*)
            FROM treasury_transactions
            WHERE ($1::TEXT IS NULL OR wallet_id = $1)
              AND ($2::TEXT IS NULL OR status = $2)
            "#,
        )
        .bind(wallet_id)
        .bind(status)
        .fetch_one(pool)
        .await
        .map_err(|e| {
            warn!("DB error: count_treasury_transactions failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;


        info!("DB query: count_treasury_transactions completed, count={}", count);
        Ok(count)
    }

    /// Create a new transfer transaction
    /// BE-001: Real DB operation
    /// BE-003: Mandatory logging
    #[instrument(skip(pool), fields(wallet_id = %wallet_id, amount = %amount))]
    pub async fn create_transfer(
        pool: &PgPool,
        tx_id: &str,
        wallet_id: &str,
        to_address: &str,
        amount: &BigDecimal,
        currency: &str,
        purpose: &str,
        created_by: &str,
    ) -> Result<TreasuryTransactionRow, ApiError> {
        info!("DB query: create_treasury_transfer started");

        // Get wallet's address as from_address
        let wallet = Self::get_wallet_by_id(pool, wallet_id)
            .await?
            .ok_or_else(|| ApiError::NotFound(format!("Wallet not found: {}", wallet_id)))?;

        let result = sqlx::query_as::<_, TreasuryTransactionRow>(
            r#"
            INSERT INTO treasury_transactions
                (tx_id, wallet_id, type, amount, currency, from_address, to_address, purpose, status, created_at)
            VALUES ($1, $2, 'transfer', $3, $4, $5, $6, $7, 'pending_approval', NOW())
            RETURNING tx_id, wallet_id, type as tx_type, amount, currency, from_address,
                      to_address, purpose, status, approved_by, tx_hash, created_at, executed_at
            "#,
        )
        .bind(tx_id)
        .bind(wallet_id)
        .bind(amount)
        .bind(currency)
        .bind(&wallet.address)
        .bind(to_address)
        .bind(purpose)
        .fetch_one(pool)
        .await
        .map_err(|e| {
            warn!("DB error: create_treasury_transfer failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: create_treasury_transfer completed, tx_id={}", tx_id);
        Ok(result)
    }

    /// Approve a transfer transaction
    /// BE-001: Real DB operation
    /// BE-003: Mandatory logging
    #[instrument(skip(pool), fields(tx_id = %tx_id, approver = %approver))]
    pub async fn approve_transfer(
        pool: &PgPool,
        tx_id: &str,
        approver: &str,
    ) -> Result<TreasuryTransactionRow, ApiError> {
        info!("DB query: approve_treasury_transfer started");

        let result = sqlx::query_as::<_, TreasuryTransactionRow>(
            r#"
            UPDATE treasury_transactions
            SET status = 'approved',
                approved_by = COALESCE(approved_by, '[]'::jsonb) || $2::jsonb
            WHERE tx_id = $1 AND status = 'pending_approval'
            RETURNING tx_id, wallet_id, type as tx_type, amount, currency, from_address,
                      to_address, purpose, status, approved_by, tx_hash, created_at, executed_at
            "#,
        )
        .bind(tx_id)
        .bind(serde_json::json!([{"signer": approver, "timestamp": chrono::Utc::now().timestamp()}]))
        .fetch_one(pool)
        .await
        .map_err(|e| {
            warn!("DB error: approve_treasury_transfer failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: approve_treasury_transfer completed");
        Ok(result)
    }

    /// Execute a transfer transaction
    /// BE-001: Real DB operation
    /// BE-003: Mandatory logging
    #[instrument(skip(pool), fields(tx_id = %tx_id))]
    pub async fn execute_transfer(
        pool: &PgPool,
        tx_id: &str,
        tx_hash: &str,
    ) -> Result<TreasuryTransactionRow, ApiError> {
        info!("DB query: execute_treasury_transfer started");

        let result = sqlx::query_as::<_, TreasuryTransactionRow>(
            r#"
            UPDATE treasury_transactions
            SET status = 'executed',
                tx_hash = $2,
                executed_at = NOW()
            WHERE tx_id = $1 AND status = 'approved'
            RETURNING tx_id, wallet_id, type as tx_type, amount, currency, from_address,
                      to_address, purpose, status, approved_by, tx_hash, created_at, executed_at
            "#,
        )
        .bind(tx_id)
        .bind(tx_hash)
        .fetch_one(pool)
        .await
        .map_err(|e| {
            warn!("DB error: execute_treasury_transfer failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: execute_treasury_transfer completed");
        Ok(result)
    }

    /// Get treasury overview statistics
    /// BE-001: Real DB operation
    /// BE-003: Mandatory logging
    #[instrument(skip(pool))]
    pub async fn get_overview(
        pool: &PgPool,
    ) -> Result<TreasuryOverviewRow, ApiError> {
        info!("DB query: get_treasury_overview started");

        let total_balance = Self::get_total_balance(pool).await?;
        let wallets = Self::list_wallets(pool).await?;
        let pending_count = Self::count_transactions(pool, None, Some("pending_approval")).await?;

        // Get today's revenue
        let today = chrono::Utc::now().date_naive();
        let today_revenue: BigDecimal = sqlx::query_scalar::<_, BigDecimal>(
            "SELECT COALESCE(SUM(amount), 0) FROM protocol_revenue WHERE date = $1"
        )
        .bind(today)
        .fetch_one(pool)
        .await
        .map_err(|e| {
            warn!("DB error: get_today_revenue failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: get_treasury_overview completed");
        Ok(TreasuryOverviewRow {
            total_balance,
            wallet_count: wallets.len() as i64,
            pending_transfers: pending_count,
            today_revenue,
        })
    }

    /// Get budget allocations
    /// BE-001: Real DB operation
    /// BE-003: Mandatory logging
    #[instrument(skip(pool))]
    pub async fn get_budget_allocations(
        pool: &PgPool,
    ) -> Result<Vec<BudgetAllocationRow>, ApiError> {
        info!("DB query: get_budget_allocations started");

        let results = sqlx::query_as::<_, BudgetAllocationRow>(
            r#"
            SELECT allocation_id, category, allocated_amount, spent_amount,
                   currency, period_start, period_end, created_at
            FROM budget_allocations
            WHERE period_end >= NOW()
            ORDER BY category ASC
            "#,
        )
        .fetch_all(pool)
        .await
        .map_err(|e| {
            warn!("DB error: get_budget_allocations failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: get_budget_allocations completed, count={}", results.len());
        Ok(results)
    }

    /// Get audit log for treasury operations
    /// BE-001: Real DB operation
    /// BE-003: Mandatory logging
    #[instrument(skip(pool))]
    pub async fn get_audit_log(
        pool: &PgPool,
        offset: i64,
        limit: i64,
    ) -> Result<Vec<TreasuryAuditRow>, ApiError> {
        info!("DB query: get_treasury_audit_log started");

        let results = sqlx::query_as::<_, TreasuryAuditRow>(
            r#"
            SELECT audit_id, tx_id, action, actor, details, created_at
            FROM treasury_audit_log
            ORDER BY created_at DESC
            OFFSET $1 LIMIT $2
            "#,
        )
        .bind(offset)
        .bind(limit)
        .fetch_all(pool)
        .await
        .map_err(|e| {
            warn!("DB error: get_treasury_audit_log failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: get_treasury_audit_log completed, count={}", results.len());
        Ok(results)
    }

    /// Count audit log entries
    #[instrument(skip(pool))]
    pub async fn count_audit_log(pool: &PgPool) -> Result<i64, ApiError> {
        info!("DB query: count_treasury_audit_log started");

        let count: i64 = sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM treasury_audit_log")
            .fetch_one(pool)
            .await
            .map_err(|e| {
                warn!("DB error: count_treasury_audit_log failed: {}", e);
                ApiError::Internal(format!("Database error: {}", e))
            })?;
    

        info!("DB query: count_treasury_audit_log completed, count={}", count);
        Ok(count)
    }
}

// ============================================================================
// Additional Treasury Models (Phase 8-C)
// ============================================================================

#[derive(Debug, Clone)]
pub struct TreasuryOverviewRow {
    pub total_balance: BigDecimal,
    pub wallet_count: i64,
    pub pending_transfers: i64,
    pub today_revenue: BigDecimal,
}

#[derive(Debug, Clone, FromRow)]
pub struct BudgetAllocationRow {
    pub allocation_id: String,
    pub category: String,
    pub allocated_amount: BigDecimal,
    pub spent_amount: BigDecimal,
    pub currency: String,
    pub period_start: DateTime<Utc>,
    pub period_end: DateTime<Utc>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, FromRow)]
pub struct TreasuryAuditRow {
    pub audit_id: String,
    pub tx_id: Option<String>,
    pub action: String,
    pub actor: String,
    pub details: Option<serde_json::Value>,
    pub created_at: DateTime<Utc>,
}
