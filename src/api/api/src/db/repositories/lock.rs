//! Lock repository for database operations
//!
//! Phase 8-C: Lock/Unlock management
//! Storage Migration: Added create/update methods for dual-write support
//! Follows BE-001~003 rules

use bigdecimal::BigDecimal;
use chrono::{DateTime, Utc};
use sqlx::{FromRow, PgPool};
use tracing::{debug, info, instrument, warn};

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
    // ========================================================================
    // Write Operations (Phase 0: Storage Migration Infrastructure)
    // ========================================================================

    /// Create a new lock record in PostgreSQL
    /// SM-001: PG first, then Redis cache
    /// BE-001: Real DB operation (no stubs)
    /// BE-003: Mandatory logging
    #[instrument(skip(pool, dest_addr, pk_dilithium, sig_dilithium))]
    pub async fn create(
        pool: &PgPool,
        lock_id: &str,
        wallet_address: &str,
        chain_id: i64,
        asset: &str,
        amount: &BigDecimal,
        dest_addr: &[u8],
        expiry: i64,
        nonce: i64,
        pk_dilithium: &[u8],
        sig_dilithium: &[u8],
        sr_0: &str,
    ) -> Result<(), ApiError> {
        info!("DB insert: lock create started, lock_id={}", lock_id);

        sqlx::query(
            r#"
            INSERT INTO locks (lock_id, wallet_address, chain_id, asset, amount, dest_addr,
                              expiry, nonce, pk_dilithium, sig_dilithium, sr_0, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending')
            ON CONFLICT (lock_id) DO NOTHING
            "#,
        )
        .bind(lock_id)
        .bind(wallet_address)
        .bind(chain_id)
        .bind(asset)
        .bind(amount)
        .bind(dest_addr)
        .bind(expiry)
        .bind(nonce)
        .bind(pk_dilithium)
        .bind(sig_dilithium)
        .bind(sr_0)
        .execute(pool)
        .await
        .map_err(|e| {
            warn!("DB error: lock create failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        debug!("DB insert: lock create completed, lock_id={}", lock_id);
        Ok(())
    }

    /// Update lock status
    /// SM-001: PG first, then invalidate Redis cache
    #[instrument(skip(pool), fields(lock_id = %lock_id, new_status = %new_status))]
    pub async fn update_status(
        pool: &PgPool,
        lock_id: &str,
        new_status: &str,
    ) -> Result<(), ApiError> {
        info!("DB update: lock update_status started, lock_id={}, status={}", lock_id, new_status);

        let confirmed_at = if new_status == "confirmed" || new_status == "locked" {
            Some(Utc::now())
        } else {
            None
        };

        sqlx::query(
            r#"
            UPDATE locks
            SET status = $2,
                confirmed_at = COALESCE($3, confirmed_at)
            WHERE lock_id = $1
            "#,
        )
        .bind(lock_id)
        .bind(new_status)
        .bind(confirmed_at)
        .execute(pool)
        .await
        .map_err(|e| {
            warn!("DB error: lock update_status failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        debug!("DB update: lock update_status completed, lock_id={}", lock_id);
        Ok(())
    }

    /// Update lock L1 transaction hash
    #[instrument(skip(pool), fields(lock_id = %lock_id))]
    pub async fn update_l1_tx_hash(
        pool: &PgPool,
        lock_id: &str,
        l1_tx_hash: &str,
    ) -> Result<(), ApiError> {
        info!("DB update: lock l1_tx_hash started, lock_id={}", lock_id);

        sqlx::query(
            r#"
            UPDATE locks
            SET l1_tx_hash = $2
            WHERE lock_id = $1
            "#,
        )
        .bind(lock_id)
        .bind(l1_tx_hash)
        .execute(pool)
        .await
        .map_err(|e| {
            warn!("DB error: lock update l1_tx_hash failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        debug!("DB update: lock l1_tx_hash completed, lock_id={}", lock_id);
        Ok(())
    }

    /// Create a new unlock request in PostgreSQL
    /// SM-001: PG first for unlock requests
    #[instrument(skip(pool, dest_addr, sig_dilithium))]
    pub async fn create_unlock_request(
        pool: &PgPool,
        unlock_id: &str,
        lock_id: &str,
        wallet_address: &str,
        dest_addr: &[u8],
        amount: &BigDecimal,
        sig_dilithium: &[u8],
        sr_0: &str,
        sr_1: &str,
        is_emergency: bool,
        bond_amount: Option<&BigDecimal>,
        release_time: Option<DateTime<Utc>>,
    ) -> Result<(), ApiError> {
        info!("DB insert: unlock_request create started, unlock_id={}", unlock_id);

        sqlx::query(
            r#"
            INSERT INTO unlock_requests (unlock_id, lock_id, wallet_address, dest_addr, amount,
                                        sig_dilithium, sr_0, sr_1, status, is_emergency,
                                        bond_amount, release_time)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', $9, $10, $11)
            ON CONFLICT (unlock_id) DO NOTHING
            "#,
        )
        .bind(unlock_id)
        .bind(lock_id)
        .bind(wallet_address)
        .bind(dest_addr)
        .bind(amount)
        .bind(sig_dilithium)
        .bind(sr_0)
        .bind(sr_1)
        .bind(is_emergency)
        .bind(bond_amount)
        .bind(release_time)
        .execute(pool)
        .await
        .map_err(|e| {
            warn!("DB error: unlock_request create failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        debug!("DB insert: unlock_request create completed, unlock_id={}", unlock_id);
        Ok(())
    }

    /// Update unlock request status
    #[instrument(skip(pool), fields(unlock_id = %unlock_id, new_status = %new_status))]
    pub async fn update_unlock_status(
        pool: &PgPool,
        unlock_id: &str,
        new_status: &str,
    ) -> Result<(), ApiError> {
        info!("DB update: unlock_request status started, unlock_id={}", unlock_id);

        sqlx::query(
            r#"
            UPDATE unlock_requests
            SET status = $2
            WHERE unlock_id = $1
            "#,
        )
        .bind(unlock_id)
        .bind(new_status)
        .execute(pool)
        .await
        .map_err(|e| {
            warn!("DB error: unlock_request update_status failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        debug!("DB update: unlock_request status completed, unlock_id={}", unlock_id);
        Ok(())
    }

    // ========================================================================
    // Read Operations (existing, from Phase 8-C)
    // ========================================================================

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

        let tvl: BigDecimal = sqlx::query_scalar::<_, BigDecimal>(
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
            WHERE LOWER(wallet_address) = LOWER($1)
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
            WHERE LOWER(wallet_address) = LOWER($1)
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

    // ========================================================================
    // Multi-Status Query Operations (Phase 1: get_pending_locks fix)
    // ========================================================================

    /// List locks matching any of the given statuses
    /// Used by Consumer status routes to fetch pending unlock/emergency locks
    /// BE-001: Real DB operation (no stubs)
    /// BE-003: Mandatory logging
    #[instrument(skip(pool))]
    pub async fn list_locks_by_statuses(
        pool: &PgPool,
        statuses: &[&str],
    ) -> Result<Vec<LockRow>, ApiError> {
        info!("DB query: list_locks_by_statuses started, statuses={:?}", statuses);

        if statuses.is_empty() {
            return Ok(vec![]);
        }

        // Build parameterized IN clause: $1, $2, ...
        let placeholders: Vec<String> = statuses
            .iter()
            .enumerate()
            .map(|(i, _)| format!("${}", i + 1))
            .collect();
        let in_clause = placeholders.join(", ");

        let query_str = format!(
            r#"
            SELECT lock_id, wallet_address, chain_id, asset, amount, dest_addr,
                   expiry, nonce, pk_dilithium, sig_dilithium, sr_0, status,
                   l1_tx_hash, created_at, confirmed_at
            FROM locks
            WHERE status IN ({})
            ORDER BY created_at DESC
            "#,
            in_clause
        );

        let mut query = sqlx::query_as::<_, LockRow>(&query_str);
        for status in statuses {
            query = query.bind(*status);
        }

        let results = query
            .fetch_all(pool)
            .await
            .map_err(|e| {
                warn!("DB error: list_locks_by_statuses failed: {}", e);
                ApiError::Internal(format!("Database error: {}", e))
            })?;

        info!("DB query: list_locks_by_statuses completed, count={}", results.len());
        Ok(results)
    }

    /// List locks with status='pending' that have an L1 transaction hash.
    /// Used by L1TxConfirmationService to check pending L1 confirmations.
    #[instrument(skip(pool))]
    pub async fn list_pending_with_l1_tx_hash(
        pool: &PgPool,
    ) -> Result<Vec<LockRow>, ApiError> {
        info!("DB query: list_pending_with_l1_tx_hash started");

        let results = sqlx::query_as::<_, LockRow>(
            r#"
            SELECT lock_id, wallet_address, chain_id, asset, amount, dest_addr,
                   expiry, nonce, pk_dilithium, sig_dilithium, sr_0, status,
                   l1_tx_hash, created_at, confirmed_at
            FROM locks
            WHERE status = 'pending' AND l1_tx_hash IS NOT NULL
            ORDER BY created_at ASC
            "#,
        )
        .fetch_all(pool)
        .await
        .map_err(|e| {
            warn!("DB error: list_pending_with_l1_tx_hash failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: list_pending_with_l1_tx_hash completed, count={}", results.len());
        Ok(results)
    }

    /// List locks that are stuck in `status='pending'` with NO L1 transaction
    /// hash for longer than `older_than_seconds`. These are locks where the
    /// inline L1 submission in routes/lock.rs failed (e.g. L1 RPC down) and
    /// no retry mechanism ever picked them up — the verifier in orchestrator
    /// run 25168505086 flagged this as a silent-stranding pattern. Used by
    /// L1TxConfirmationService to log a per-row warning and emit a count
    /// metric so operators can intervene rather than have the rows sit
    /// invisible.
    #[instrument(skip(pool))]
    pub async fn list_stale_pending_without_l1_tx_hash(
        pool: &PgPool,
        older_than_seconds: i64,
    ) -> Result<Vec<LockRow>, ApiError> {
        info!(
            "DB query: list_stale_pending_without_l1_tx_hash started, older_than_seconds={}",
            older_than_seconds
        );

        let results = sqlx::query_as::<_, LockRow>(
            r#"
            SELECT lock_id, wallet_address, chain_id, asset, amount, dest_addr,
                   expiry, nonce, pk_dilithium, sig_dilithium, sr_0, status,
                   l1_tx_hash, created_at, confirmed_at
            FROM locks
            WHERE status = 'pending'
              AND l1_tx_hash IS NULL
              AND created_at < NOW() - make_interval(secs => $1::DOUBLE PRECISION)
            ORDER BY created_at ASC
            "#,
        )
        .bind(older_than_seconds as f64)
        .fetch_all(pool)
        .await
        .map_err(|e| {
            warn!("DB error: list_stale_pending_without_l1_tx_hash failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!(
            "DB query: list_stale_pending_without_l1_tx_hash completed, count={}",
            results.len()
        );
        Ok(results)
    }
}
