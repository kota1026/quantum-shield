//! User repository for database operations
//!
//! Phase 8-C: User management
//! Follows BE-001~003 rules

use chrono::{DateTime, Utc};
use sqlx::{FromRow, PgPool};
use tracing::{info, instrument, warn};

use crate::error::ApiError;

// ============================================================================
// User Models
// ============================================================================

#[derive(Debug, Clone, FromRow)]
pub struct UserRow {
    pub wallet_address: String,
    pub pk_dilithium: Option<Vec<u8>>,
    pub created_at: DateTime<Utc>,
    pub last_active: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, FromRow)]
pub struct UserSettingsRow {
    pub wallet_address: String,
    pub email: Option<String>,
    pub language: String,
    pub notification_email: bool,
    pub notification_browser: bool,
    pub two_factor_enabled: bool,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// User Repository
// ============================================================================

pub struct UserRepository;

impl UserRepository {
    /// Get user by wallet address
    #[instrument(skip(pool))]
    pub async fn get_by_wallet(
        pool: &PgPool,
        wallet_address: &str,
    ) -> Result<Option<UserRow>, ApiError> {
        info!("DB query: get_user_by_wallet started");

        let result = sqlx::query_as::<_, UserRow>(
            r#"
            SELECT wallet_address, pk_dilithium, created_at, last_active
            FROM users
            WHERE wallet_address = $1
            "#,
        )
        .bind(wallet_address)
        .fetch_optional(pool)
        .await
        .map_err(|e| {
            warn!("DB error: get_user_by_wallet failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: get_user_by_wallet completed, found={}", result.is_some());
        Ok(result)
    }

    /// List users with pagination
    #[instrument(skip(pool))]
    pub async fn list_users(
        pool: &PgPool,
        offset: i64,
        limit: i64,
    ) -> Result<Vec<UserRow>, ApiError> {
        info!("DB query: list_users started");

        let results = sqlx::query_as::<_, UserRow>(
            r#"
            SELECT wallet_address, pk_dilithium, created_at, last_active
            FROM users
            ORDER BY created_at DESC
            OFFSET $1 LIMIT $2
            "#,
        )
        .bind(offset)
        .bind(limit)
        .fetch_all(pool)
        .await
        .map_err(|e| {
            warn!("DB error: list_users failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: list_users completed, count={}", results.len());
        Ok(results)
    }

    /// Count total users
    #[instrument(skip(pool))]
    pub async fn count_users(pool: &PgPool) -> Result<i64, ApiError> {
        info!("DB query: count_users started");

        let count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM users")
            .fetch_one(pool)
            .await
            .map_err(|e| {
                warn!("DB error: count_users failed: {}", e);
                ApiError::Internal(format!("Database error: {}", e))
            })?
            .unwrap_or(0);

        info!("DB query: count_users completed, count={}", count);
        Ok(count)
    }

    /// Create or update user
    #[instrument(skip(pool, pk_dilithium))]
    pub async fn upsert(
        pool: &PgPool,
        wallet_address: &str,
        pk_dilithium: Option<&[u8]>,
    ) -> Result<UserRow, ApiError> {
        info!("DB query: upsert_user started");

        let result = sqlx::query_as::<_, UserRow>(
            r#"
            INSERT INTO users (wallet_address, pk_dilithium, created_at, last_active)
            VALUES ($1, $2, NOW(), NOW())
            ON CONFLICT (wallet_address) DO UPDATE
            SET last_active = NOW(), pk_dilithium = COALESCE($2, users.pk_dilithium)
            RETURNING wallet_address, pk_dilithium, created_at, last_active
            "#,
        )
        .bind(wallet_address)
        .bind(pk_dilithium)
        .fetch_one(pool)
        .await
        .map_err(|e| {
            warn!("DB error: upsert_user failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: upsert_user completed");
        Ok(result)
    }

    /// Get user settings
    #[instrument(skip(pool))]
    pub async fn get_settings(
        pool: &PgPool,
        wallet_address: &str,
    ) -> Result<Option<UserSettingsRow>, ApiError> {
        info!("DB query: get_user_settings started");

        let result = sqlx::query_as::<_, UserSettingsRow>(
            r#"
            SELECT wallet_address, email, language, notification_email,
                   notification_browser, two_factor_enabled, updated_at
            FROM user_settings
            WHERE wallet_address = $1
            "#,
        )
        .bind(wallet_address)
        .fetch_optional(pool)
        .await
        .map_err(|e| {
            warn!("DB error: get_user_settings failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: get_user_settings completed, found={}", result.is_some());
        Ok(result)
    }
}
