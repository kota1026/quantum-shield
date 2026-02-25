//! Token Hub (veQS) repository for database operations
//!
//! Phase 0: Storage Migration Infrastructure
//! Manages veQS locks, delegations, reward epochs, and reward claims
//! Follows BE-001~003 rules

use bigdecimal::BigDecimal;
use chrono::{DateTime, Utc};
use sqlx::{FromRow, PgPool};
use tracing::{debug, info, instrument, warn};

use crate::error::ApiError;

// ============================================================================
// Token Hub Models
// ============================================================================

#[derive(Debug, Clone, FromRow)]
pub struct VeqsLockRow {
    pub lock_id: String,
    pub wallet_address: String,
    pub locked_amount: BigDecimal,
    pub veqs_value: BigDecimal,
    pub lock_end: DateTime<Utc>,
    pub lock_duration_days: i64,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, FromRow)]
pub struct DelegationRow {
    pub delegation_id: String,
    pub delegator: String,
    pub delegatee: String,
    pub amount: BigDecimal,
    pub delegated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, FromRow)]
pub struct RewardEpochRow {
    pub epoch: i64,
    pub total_rewards: BigDecimal,
    pub total_veqs: BigDecimal,
    pub start_time: DateTime<Utc>,
    pub end_time: DateTime<Utc>,
    pub finalized: bool,
}

#[derive(Debug, Clone, FromRow)]
pub struct RewardClaimRow {
    pub claim_id: String,
    pub wallet_address: String,
    pub epoch: i64,
    pub amount: BigDecimal,
    pub l1_tx_hash: Option<String>,
    pub claimed_at: DateTime<Utc>,
}

// ============================================================================
// Token Hub Repository
// ============================================================================

pub struct TokenHubRepository;

impl TokenHubRepository {
    // ========================================================================
    // veQS Lock Operations
    // ========================================================================

    /// Create a new veQS lock
    /// BE-001: Real DB operation (no stubs)
    /// BE-003: Mandatory logging
    #[instrument(skip(pool))]
    pub async fn create_veqs_lock(
        pool: &PgPool,
        lock_id: &str,
        wallet_address: &str,
        locked_amount: &BigDecimal,
        veqs_value: &BigDecimal,
        lock_end: DateTime<Utc>,
        lock_duration_days: i64,
    ) -> Result<(), ApiError> {
        info!("DB insert: veqs_lock create started, lock_id={}", lock_id);

        sqlx::query(
            r#"
            INSERT INTO veqs_locks (lock_id, wallet_address, locked_amount, veqs_value, lock_end, lock_duration_days)
            VALUES ($1, $2, $3, $4, $5, $6)
            "#,
        )
        .bind(lock_id)
        .bind(wallet_address)
        .bind(locked_amount)
        .bind(veqs_value)
        .bind(lock_end)
        .bind(lock_duration_days)
        .execute(pool)
        .await
        .map_err(|e| {
            warn!("DB error: veqs_lock create failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        debug!("DB insert: veqs_lock create completed, lock_id={}", lock_id);
        Ok(())
    }

    /// Get veQS locks for a wallet
    #[instrument(skip(pool), fields(wallet = %wallet_address))]
    pub async fn get_veqs_locks_by_wallet(
        pool: &PgPool,
        wallet_address: &str,
    ) -> Result<Vec<VeqsLockRow>, ApiError> {
        info!("DB query: veqs_locks get_by_wallet started");

        let results = sqlx::query_as::<_, VeqsLockRow>(
            r#"
            SELECT lock_id, wallet_address, locked_amount, veqs_value,
                   lock_end, lock_duration_days, created_at
            FROM veqs_locks
            WHERE wallet_address = $1
            ORDER BY created_at DESC
            "#,
        )
        .bind(wallet_address)
        .fetch_all(pool)
        .await
        .map_err(|e| {
            warn!("DB error: veqs_locks get_by_wallet failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: veqs_locks get_by_wallet completed, count={}", results.len());
        Ok(results)
    }

    /// Get total veQS balance for a wallet
    #[instrument(skip(pool), fields(wallet = %wallet_address))]
    pub async fn get_veqs_balance(
        pool: &PgPool,
        wallet_address: &str,
    ) -> Result<BigDecimal, ApiError> {
        let balance: BigDecimal = sqlx::query_scalar::<_, BigDecimal>(
            r#"
            SELECT COALESCE(SUM(veqs_value), 0)
            FROM veqs_locks
            WHERE wallet_address = $1
              AND lock_end > NOW()
            "#,
        )
        .bind(wallet_address)
        .fetch_one(pool)
        .await
        .map_err(|e| {
            warn!("DB error: veqs_balance query failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        Ok(balance)
    }

    /// Get total veQS supply (all active locks)
    #[instrument(skip(pool))]
    pub async fn get_total_veqs_supply(pool: &PgPool) -> Result<BigDecimal, ApiError> {
        let total: BigDecimal = sqlx::query_scalar::<_, BigDecimal>(
            r#"
            SELECT COALESCE(SUM(veqs_value), 0)
            FROM veqs_locks
            WHERE lock_end > NOW()
            "#,
        )
        .fetch_one(pool)
        .await
        .map_err(|e| {
            warn!("DB error: total_veqs_supply query failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        Ok(total)
    }

    // ========================================================================
    // Delegation Operations
    // ========================================================================

    /// Create a new delegation
    #[instrument(skip(pool))]
    pub async fn create_delegation(
        pool: &PgPool,
        delegation_id: &str,
        delegator: &str,
        delegatee: &str,
        amount: &BigDecimal,
    ) -> Result<(), ApiError> {
        info!("DB insert: delegation create started, id={}", delegation_id);

        sqlx::query(
            r#"
            INSERT INTO delegations (delegation_id, delegator, delegatee, amount)
            VALUES ($1, $2, $3, $4)
            "#,
        )
        .bind(delegation_id)
        .bind(delegator)
        .bind(delegatee)
        .bind(amount)
        .execute(pool)
        .await
        .map_err(|e| {
            warn!("DB error: delegation create failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        debug!("DB insert: delegation create completed, id={}", delegation_id);
        Ok(())
    }

    /// Get delegations by delegator
    #[instrument(skip(pool), fields(delegator = %delegator))]
    pub async fn get_delegations_by_delegator(
        pool: &PgPool,
        delegator: &str,
    ) -> Result<Vec<DelegationRow>, ApiError> {
        info!("DB query: delegations get_by_delegator started");

        let results = sqlx::query_as::<_, DelegationRow>(
            r#"
            SELECT delegation_id, delegator, delegatee, amount, delegated_at
            FROM delegations
            WHERE delegator = $1
            ORDER BY delegated_at DESC
            "#,
        )
        .bind(delegator)
        .fetch_all(pool)
        .await
        .map_err(|e| {
            warn!("DB error: delegations get_by_delegator failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: delegations get_by_delegator completed, count={}", results.len());
        Ok(results)
    }

    /// Get delegations received by a delegatee
    #[instrument(skip(pool), fields(delegatee = %delegatee))]
    pub async fn get_delegations_by_delegatee(
        pool: &PgPool,
        delegatee: &str,
    ) -> Result<Vec<DelegationRow>, ApiError> {
        info!("DB query: delegations get_by_delegatee started");

        let results = sqlx::query_as::<_, DelegationRow>(
            r#"
            SELECT delegation_id, delegator, delegatee, amount, delegated_at
            FROM delegations
            WHERE delegatee = $1
            ORDER BY delegated_at DESC
            "#,
        )
        .bind(delegatee)
        .fetch_all(pool)
        .await
        .map_err(|e| {
            warn!("DB error: delegations get_by_delegatee failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: delegations get_by_delegatee completed, count={}", results.len());
        Ok(results)
    }

    /// Delete delegation by ID
    #[instrument(skip(pool), fields(delegation_id = %delegation_id))]
    pub async fn delete_delegation(
        pool: &PgPool,
        delegation_id: &str,
    ) -> Result<(), ApiError> {
        info!("DB delete: delegation delete started, id={}", delegation_id);

        sqlx::query("DELETE FROM delegations WHERE delegation_id = $1")
            .bind(delegation_id)
            .execute(pool)
            .await
            .map_err(|e| {
                warn!("DB error: delegation delete failed: {}", e);
                ApiError::Internal(format!("Database error: {}", e))
            })?;

        debug!("DB delete: delegation delete completed, id={}", delegation_id);
        Ok(())
    }

    /// Get voting power for a user (own veQS + received delegations - sent delegations)
    #[instrument(skip(pool), fields(wallet = %wallet_address))]
    pub async fn get_voting_power(
        pool: &PgPool,
        wallet_address: &str,
    ) -> Result<BigDecimal, ApiError> {
        info!("DB query: voting_power calculation started");

        // Own veQS balance (active locks only)
        let own_veqs = Self::get_veqs_balance(pool, wallet_address).await?;

        // Received delegations
        let received: BigDecimal = sqlx::query_scalar::<_, BigDecimal>(
            r#"SELECT COALESCE(SUM(amount), 0) FROM delegations WHERE delegatee = $1"#,
        )
        .bind(wallet_address)
        .fetch_one(pool)
        .await
        .map_err(|e| ApiError::Internal(format!("Database error: {}", e)))?;

        // Sent delegations
        let sent: BigDecimal = sqlx::query_scalar::<_, BigDecimal>(
            r#"SELECT COALESCE(SUM(amount), 0) FROM delegations WHERE delegator = $1"#,
        )
        .bind(wallet_address)
        .fetch_one(pool)
        .await
        .map_err(|e| ApiError::Internal(format!("Database error: {}", e)))?;

        let voting_power = own_veqs + received - sent;
        info!("DB query: voting_power completed, power={}", voting_power);
        Ok(voting_power)
    }

    // ========================================================================
    // Reward Operations
    // ========================================================================

    /// Create a reward claim
    #[instrument(skip(pool))]
    pub async fn create_reward_claim(
        pool: &PgPool,
        claim_id: &str,
        wallet_address: &str,
        epoch: i64,
        amount: &BigDecimal,
    ) -> Result<(), ApiError> {
        info!("DB insert: reward_claim create started, id={}", claim_id);

        sqlx::query(
            r#"
            INSERT INTO reward_claims (claim_id, wallet_address, epoch, amount)
            VALUES ($1, $2, $3, $4)
            "#,
        )
        .bind(claim_id)
        .bind(wallet_address)
        .bind(epoch)
        .bind(amount)
        .execute(pool)
        .await
        .map_err(|e| {
            warn!("DB error: reward_claim create failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        debug!("DB insert: reward_claim create completed, id={}", claim_id);
        Ok(())
    }

    /// Get reward claims by wallet
    #[instrument(skip(pool), fields(wallet = %wallet_address))]
    pub async fn get_reward_claims_by_wallet(
        pool: &PgPool,
        wallet_address: &str,
    ) -> Result<Vec<RewardClaimRow>, ApiError> {
        info!("DB query: reward_claims get_by_wallet started");

        let results = sqlx::query_as::<_, RewardClaimRow>(
            r#"
            SELECT claim_id, wallet_address, epoch, amount, l1_tx_hash, claimed_at
            FROM reward_claims
            WHERE wallet_address = $1
            ORDER BY epoch DESC
            "#,
        )
        .bind(wallet_address)
        .fetch_all(pool)
        .await
        .map_err(|e| {
            warn!("DB error: reward_claims get_by_wallet failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: reward_claims get_by_wallet completed, count={}", results.len());
        Ok(results)
    }

    /// Get finalized reward epochs
    #[instrument(skip(pool))]
    pub async fn get_finalized_epochs(
        pool: &PgPool,
        offset: i64,
        limit: i64,
    ) -> Result<Vec<RewardEpochRow>, ApiError> {
        info!("DB query: reward_epochs get_finalized started");

        let results = sqlx::query_as::<_, RewardEpochRow>(
            r#"
            SELECT epoch, total_rewards, total_veqs, start_time, end_time, finalized
            FROM reward_epochs
            WHERE finalized = TRUE
            ORDER BY epoch DESC
            OFFSET $1 LIMIT $2
            "#,
        )
        .bind(offset)
        .bind(limit)
        .fetch_all(pool)
        .await
        .map_err(|e| {
            warn!("DB error: reward_epochs get_finalized failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: reward_epochs get_finalized completed, count={}", results.len());
        Ok(results)
    }

    /// Check if user has already claimed for an epoch
    #[instrument(skip(pool))]
    pub async fn has_claimed(
        pool: &PgPool,
        wallet_address: &str,
        epoch: i64,
    ) -> Result<bool, ApiError> {
        let count: i64 = sqlx::query_scalar::<_, i64>(
            r#"
            SELECT COUNT(*)
            FROM reward_claims
            WHERE wallet_address = $1 AND epoch = $2
            "#,
        )
        .bind(wallet_address)
        .bind(epoch)
        .fetch_one(pool)
        .await
        .map_err(|e| ApiError::Internal(format!("Database error: {}", e)))?;

        Ok(count > 0)
    }
}
