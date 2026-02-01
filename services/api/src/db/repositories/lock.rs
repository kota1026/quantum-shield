//! Lock repository for database operations
//!
//! Phase 8-C: Lock/Unlock management
//! Follows BE-001~003 rules

use bigdecimal::BigDecimal;
use chrono::{DateTime, Utc};
use sqlx::{FromRow, PgPool};
use tracing::{info, instrument, warn};

use crate::error::ApiError;

// ============================================================================
// Lock Models
// ============================================================================

#[derive(Debug, Clone, FromRow)]
pub struct LockRow {
    pub lock_id: String,
    pub wallet_address: String,
    pub chain_id: i64,
    pub asset: String,
    pub amount: BigDecimal,
    pub dest_addr: Vec<u8>,
    pub expiry: i64,
    pub nonce: i64,
    pub pk_dilithium: Vec<u8>,
    pub sig_dilithium: Vec<u8>,
    pub sr_0: String,
    pub status: String,
    pub l1_tx_hash: Option<String>,
    pub created_at: DateTime<Utc>,
    pub confirmed_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, FromRow)]
pub struct UnlockRequestRow {
    pub unlock_id: String,
    pub lock_id: String,
    pub wallet_address: String,
    pub dest_addr: Vec<u8>,
    pub amount: BigDecimal,
    pub sig_dilithium: Vec<u8>,
    pub sr_0: String,
    pub sr_1: String,
    pub status: String,
    pub is_emergency: bool,
    pub bond_amount: Option<BigDecimal>,
    pub release_time: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
}

// ============================================================================
// Lock Repository
// ============================================================================

pub struct LockRepository;

impl LockRepository {
    /// Get lock by ID
    #[instrument(skip(pool))]
    pub async fn get_by_id(
        pool: &PgPool,
        lock_id: &str,
    ) -> Result<Option<LockRow>, ApiError> {
        info!("DB query: get_lock_by_id started");

        let result = sqlx::query_as::<_, LockRow>(
            r#"
            SELECT lock_id, wallet_address, chain_id, asset, amount, dest_addr,
                   expiry, nonce, pk_dilithium, sig_dilithium, sr_0, status,
                   l1_tx_hash, created_at, confirmed_at
            FROM locks
            WHERE lock_id = $1
            "#,
        )
        .bind(lock_id)
        .fetch_optional(pool)
        .await
        .map_err(|e| {
            warn!("DB error: get_lock_by_id failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: get_lock_by_id completed, found={}", result.is_some());
        Ok(result)
    }

    /// List locks with filtering
    #[instrument(skip(pool))]
    pub async fn list_locks(
        pool: &PgPool,
        wallet_address: Option<&str>,
        status: Option<&str>,
        offset: i64,
        limit: i64,
    ) -> Result<Vec<LockRow>, ApiError> {
        info!("DB query: list_locks started");

        let results = sqlx::query_as::<_, LockRow>(
            r#"
            SELECT lock_id, wallet_address, chain_id, asset, amount, dest_addr,
                   expiry, nonce, pk_dilithium, sig_dilithium, sr_0, status,
                   l1_tx_hash, created_at, confirmed_at
            FROM locks
            WHERE ($1::TEXT IS NULL OR wallet_address = $1)
              AND ($2::TEXT IS NULL OR status = $2)
            ORDER BY created_at DESC
            OFFSET $3 LIMIT $4
            "#,
        )
        .bind(wallet_address)
        .bind(status)
        .bind(offset)
        .bind(limit)
        .fetch_all(pool)
        .await
        .map_err(|e| {
            warn!("DB error: list_locks failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: list_locks completed, count={}", results.len());
        Ok(results)
    }

    /// Count locks by status
    #[instrument(skip(pool))]
    pub async fn count_by_status(
        pool: &PgPool,
        status: Option<&str>,
    ) -> Result<i64, ApiError> {
        info!("DB query: count_locks_by_status started");

        let count: i64 = sqlx::query_scalar::<_, i64>(
            r#"
            SELECT COUNT(*)
            FROM locks
            WHERE ($1::TEXT IS NULL OR status = $1)
            "#,
        )
        .bind(status)
        .fetch_one(pool)
        .await
        .map_err(|e| {
            warn!("DB error: count_locks_by_status failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;


        info!("DB query: count_locks_by_status completed, count={}", count);
        Ok(count)
    }

    /// Get total TVL (Total Value Locked)
    #[instrument(skip(pool))]
    pub async fn get_total_tvl(pool: &PgPool) -> Result<BigDecimal, ApiError> {
        info!("DB query: get_total_tvl started");

        let tvl: BigDecimal = sqlx::query_scalar::<_, i64>(
            r#"
            SELECT COALESCE(SUM(amount), 0)
            FROM locks
            WHERE status IN ('confirmed', 'locked')
            "#,
        )
        .fetch_one(pool)
        .await
        .map_err(|e| {
            warn!("DB error: get_total_tvl failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;
        ;

        info!("DB query: get_total_tvl completed");
        Ok(tvl)
    }

    /// List pending unlock requests
    #[instrument(skip(pool))]
    pub async fn list_pending_unlocks(
        pool: &PgPool,
        offset: i64,
        limit: i64,
    ) -> Result<Vec<UnlockRequestRow>, ApiError> {
        info!("DB query: list_pending_unlocks started");

        let results = sqlx::query_as::<_, UnlockRequestRow>(
            r#"
            SELECT unlock_id, lock_id, wallet_address, dest_addr, amount,
                   sig_dilithium, sr_0, sr_1, status, is_emergency,
                   bond_amount, release_time, created_at
            FROM unlock_requests
            WHERE status IN ('pending', 'vrf_pending', 'prover_signing', 'time_lock')
            ORDER BY created_at ASC
            OFFSET $1 LIMIT $2
            "#,
        )
        .bind(offset)
        .bind(limit)
        .fetch_all(pool)
        .await
        .map_err(|e| {
            warn!("DB error: list_pending_unlocks failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: list_pending_unlocks completed, count={}", results.len());
        Ok(results)
    }

    // ========================================================================
    // Admin Transaction Endpoints (Phase 8-C)
    // ========================================================================

    /// List all unlock requests with filtering (for admin)
    /// BE-001: Real DB operation
    /// BE-003: Mandatory logging
    #[instrument(skip(pool), fields(status = ?status, is_emergency = ?is_emergency))]
    pub async fn list_unlocks(
        pool: &PgPool,
        status: Option<&str>,
        is_emergency: Option<bool>,
        offset: i64,
        limit: i64,
    ) -> Result<Vec<UnlockRequestRow>, ApiError> {
        info!("DB query: list_unlocks started");

        let results = sqlx::query_as::<_, UnlockRequestRow>(
            r#"
            SELECT unlock_id, lock_id, wallet_address, dest_addr, amount,
                   sig_dilithium, sr_0, sr_1, status, is_emergency,
                   bond_amount, release_time, created_at
            FROM unlock_requests
            WHERE ($1::TEXT IS NULL OR status = $1)
              AND ($2::BOOL IS NULL OR is_emergency = $2)
            ORDER BY created_at DESC
            OFFSET $3 LIMIT $4
            "#,
        )
        .bind(status)
        .bind(is_emergency)
        .bind(offset)
        .bind(limit)
        .fetch_all(pool)
        .await
        .map_err(|e| {
            warn!("DB error: list_unlocks failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: list_unlocks completed, count={}", results.len());
        Ok(results)
    }

    /// Get unlock request by ID
    #[instrument(skip(pool), fields(unlock_id = %unlock_id))]
    pub async fn get_unlock_by_id(
        pool: &PgPool,
        unlock_id: &str,
    ) -> Result<Option<UnlockRequestRow>, ApiError> {
        info!("DB query: get_unlock_by_id started");

        let result = sqlx::query_as::<_, UnlockRequestRow>(
            r#"
            SELECT unlock_id, lock_id, wallet_address, dest_addr, amount,
                   sig_dilithium, sr_0, sr_1, status, is_emergency,
                   bond_amount, release_time, created_at
            FROM unlock_requests
            WHERE unlock_id = $1
            "#,
        )
        .bind(unlock_id)
        .fetch_optional(pool)
        .await
        .map_err(|e| {
            warn!("DB error: get_unlock_by_id failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: get_unlock_by_id completed, found={}", result.is_some());
        Ok(result)
    }

    /// Count unlock requests with filters
    #[instrument(skip(pool), fields(status = ?status, is_emergency = ?is_emergency))]
    pub async fn count_unlocks(
        pool: &PgPool,
        status: Option<&str>,
        is_emergency: Option<bool>,
    ) -> Result<i64, ApiError> {
        info!("DB query: count_unlocks started");

        let count: i64 = sqlx::query_scalar::<_, i64>(
            r#"
            SELECT COUNT(*)
            FROM unlock_requests
            WHERE ($1::TEXT IS NULL OR status = $1)
              AND ($2::BOOL IS NULL OR is_emergency = $2)
            "#,
        )
        .bind(status)
        .bind(is_emergency)
        .fetch_one(pool)
        .await
        .map_err(|e| {
            warn!("DB error: count_unlocks failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;


        info!("DB query: count_unlocks completed, count={}", count);
        Ok(count)
    }

    /// Count locks with filters
    #[instrument(skip(pool), fields(status = ?status))]
    pub async fn count_locks(
        pool: &PgPool,
        status: Option<&str>,
    ) -> Result<i64, ApiError> {
        info!("DB query: count_locks started");

        let count: i64 = sqlx::query_scalar::<_, i64>(
            r#"
            SELECT COUNT(*)
            FROM locks
            WHERE ($1::TEXT IS NULL OR status = $1)
            "#,
        )
        .bind(status)
        .fetch_one(pool)
        .await
        .map_err(|e| {
            warn!("DB error: count_locks failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;


        info!("DB query: count_locks completed, count={}", count);
        Ok(count)
    }

    // ========================================================================
    // Wallet-specific Operations (Phase 8-C: Admin Users)
    // ========================================================================

    /// List locks for a specific wallet address
    /// BE-001: Real DB operation
    /// BE-003: Mandatory logging
    #[instrument(skip(pool), fields(wallet = %wallet_address, status = ?status))]
    pub async fn list_locks_by_wallet(
        pool: &PgPool,
        wallet_address: &str,
        status: Option<&str>,
        offset: i64,
        limit: i64,
    ) -> Result<Vec<LockRow>, ApiError> {
        info!("DB query: list_locks_by_wallet started");

        let results = sqlx::query_as::<_, LockRow>(
            r#"
            SELECT lock_id, wallet_address, chain_id, asset, amount, dest_addr,
                   expiry, nonce, pk_dilithium, sig_dilithium, sr_0, status,
                   l1_tx_hash, created_at, confirmed_at
            FROM locks
            WHERE wallet_address = $1
              AND ($2::TEXT IS NULL OR status = $2)
            ORDER BY created_at DESC
            OFFSET $3 LIMIT $4
            "#,
        )
        .bind(wallet_address)
        .bind(status)
        .bind(offset)
        .bind(limit)
        .fetch_all(pool)
        .await
        .map_err(|e| {
            warn!("DB error: list_locks_by_wallet failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: list_locks_by_wallet completed, count={}", results.len());
        Ok(results)
    }

    /// Count locks for a specific wallet address
    #[instrument(skip(pool), fields(wallet = %wallet_address, status = ?status))]
    pub async fn count_locks_by_wallet(
        pool: &PgPool,
        wallet_address: &str,
        status: Option<&str>,
    ) -> Result<i64, ApiError> {
        info!("DB query: count_locks_by_wallet started");

        let count: i64 = sqlx::query_scalar::<_, i64>(
            r#"
            SELECT COUNT(*)
            FROM locks
            WHERE wallet_address = $1
              AND ($2::TEXT IS NULL OR status = $2)
            "#,
        )
        .bind(wallet_address)
        .bind(status)
        .fetch_one(pool)
        .await
        .map_err(|e| {
            warn!("DB error: count_locks_by_wallet failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;


        info!("DB query: count_locks_by_wallet completed, count={}", count);
        Ok(count)
    }

    /// List unlocks for a specific wallet address
    /// BE-001: Real DB operation
    /// BE-003: Mandatory logging
    #[instrument(skip(pool), fields(wallet = %wallet_address, status = ?status))]
    pub async fn list_unlocks_by_wallet(
        pool: &PgPool,
        wallet_address: &str,
        status: Option<&str>,
        offset: i64,
        limit: i64,
    ) -> Result<Vec<UnlockRequestRow>, ApiError> {
        info!("DB query: list_unlocks_by_wallet started");

        let results = sqlx::query_as::<_, UnlockRequestRow>(
            r#"
            SELECT unlock_id, lock_id, wallet_address, dest_addr, amount,
                   sig_dilithium, sr_0, sr_1, status, is_emergency,
                   bond_amount, release_time, created_at
            FROM unlock_requests
            WHERE wallet_address = $1
              AND ($2::TEXT IS NULL OR status = $2)
            ORDER BY created_at DESC
            OFFSET $3 LIMIT $4
            "#,
        )
        .bind(wallet_address)
        .bind(status)
        .bind(offset)
        .bind(limit)
        .fetch_all(pool)
        .await
        .map_err(|e| {
            warn!("DB error: list_unlocks_by_wallet failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: list_unlocks_by_wallet completed, count={}", results.len());
        Ok(results)
    }

    /// Count unlocks for a specific wallet address
    #[instrument(skip(pool), fields(wallet = %wallet_address, status = ?status))]
    pub async fn count_unlocks_by_wallet(
        pool: &PgPool,
        wallet_address: &str,
        status: Option<&str>,
    ) -> Result<i64, ApiError> {
        info!("DB query: count_unlocks_by_wallet started");

        let count: i64 = sqlx::query_scalar::<_, i64>(
            r#"
            SELECT COUNT(*)
            FROM unlock_requests
            WHERE wallet_address = $1
              AND ($2::TEXT IS NULL OR status = $2)
            "#,
        )
        .bind(wallet_address)
        .bind(status)
        .fetch_one(pool)
        .await
        .map_err(|e| {
            warn!("DB error: count_unlocks_by_wallet failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;


        info!("DB query: count_unlocks_by_wallet completed, count={}", count);
        Ok(count)
    }
}
