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

        let count: i64 = sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM users")
            .fetch_one(pool)
            .await
            .map_err(|e| {
                warn!("DB error: count_users failed: {}", e);
                ApiError::Internal(format!("Database error: {}", e))
            })?;
    

        info!("DB query: count_users completed, count={}", count);
        Ok(count)
    }

    /// Ensure a user exists in the users table (lightweight, no update on conflict).
    /// Used to satisfy FK constraints before inserting into veqs_locks, delegations, etc.
    #[instrument(skip(pool))]
    pub async fn ensure_exists(
        pool: &PgPool,
        wallet_address: &str,
    ) -> Result<(), ApiError> {
        info!("DB upsert: ensure_user_exists started, wallet={}", wallet_address);

        sqlx::query(
            r#"
            INSERT INTO users (wallet_address, created_at, last_active)
            VALUES ($1, NOW(), NOW())
            ON CONFLICT (wallet_address) DO NOTHING
            "#,
        )
        .bind(wallet_address)
        .execute(pool)
        .await
        .map_err(|e| {
            warn!("DB error: ensure_user_exists failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB upsert: ensure_user_exists completed, wallet={}", wallet_address);
        Ok(())
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

    /// Upsert user settings (Storage Migration Phase 3)
    /// SM-001: PG first, then Redis cache
    #[instrument(skip(pool))]
    pub async fn upsert_settings(
        pool: &PgPool,
        wallet_address: &str,
        email: Option<&str>,
        language: &str,
        notification_email: bool,
        notification_browser: bool,
        two_factor_enabled: bool,
    ) -> Result<(), ApiError> {
        info!("DB upsert: user_settings started, wallet={}", wallet_address);

        sqlx::query(
            r#"
            INSERT INTO user_settings (wallet_address, email, language, notification_email,
                                      notification_browser, two_factor_enabled, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, NOW())
            ON CONFLICT (wallet_address) DO UPDATE SET
                email = COALESCE($2, user_settings.email),
                language = $3,
                notification_email = $4,
                notification_browser = $5,
                two_factor_enabled = $6,
                updated_at = NOW()
            "#,
        )
        .bind(wallet_address)
        .bind(email)
        .bind(language)
        .bind(notification_email)
        .bind(notification_browser)
        .bind(two_factor_enabled)
        .execute(pool)
        .await
        .map_err(|e| {
            warn!("DB error: upsert_settings failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB upsert: user_settings completed, wallet={}", wallet_address);
        Ok(())
    }

    // ========================================================================
    // Admin User Operations (Phase 8-C)
    // ========================================================================

    /// List users with search and status filter (for admin)
    /// BE-001: Real DB operation
    /// BE-003: Mandatory logging
    #[instrument(skip(pool), fields(search = ?search, status = ?status))]
    pub async fn list_users_admin(
        pool: &PgPool,
        search: Option<&str>,
        status: Option<&str>,
        offset: i64,
        limit: i64,
    ) -> Result<Vec<UserAdminRow>, ApiError> {
        info!("DB query: list_users_admin started");

        let results = sqlx::query_as::<_, UserAdminRow>(
            r#"
            SELECT u.wallet_address, u.pk_dilithium, u.created_at, u.last_active,
                   us.email, us.language,
                   COALESCE(us.status, 'active') as status,
                   (SELECT COUNT(*) FROM locks l WHERE l.wallet_address = u.wallet_address) as total_locks,
                   (SELECT COALESCE(SUM(amount), 0) FROM locks l WHERE l.wallet_address = u.wallet_address AND l.status IN ('confirmed', 'locked')) as total_locked
            FROM users u
            LEFT JOIN user_settings us ON u.wallet_address = us.wallet_address
            WHERE ($1::TEXT IS NULL OR u.wallet_address ILIKE '%' || $1 || '%' OR us.email ILIKE '%' || $1 || '%')
              AND ($2::TEXT IS NULL OR COALESCE(us.status, 'active') = $2)
            ORDER BY u.created_at DESC
            OFFSET $3 LIMIT $4
            "#,
        )
        .bind(search)
        .bind(status)
        .bind(offset)
        .bind(limit)
        .fetch_all(pool)
        .await
        .map_err(|e| {
            warn!("DB error: list_users_admin failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: list_users_admin completed, count={}", results.len());
        Ok(results)
    }

    /// Count users with filters
    #[instrument(skip(pool), fields(search = ?search, status = ?status))]
    pub async fn count_users_admin(
        pool: &PgPool,
        search: Option<&str>,
        status: Option<&str>,
    ) -> Result<i64, ApiError> {
        info!("DB query: count_users_admin started");

        let count: i64 = sqlx::query_scalar::<_, i64>(
            r#"
            SELECT COUNT(*)
            FROM users u
            LEFT JOIN user_settings us ON u.wallet_address = us.wallet_address
            WHERE ($1::TEXT IS NULL OR u.wallet_address ILIKE '%' || $1 || '%' OR us.email ILIKE '%' || $1 || '%')
              AND ($2::TEXT IS NULL OR COALESCE(us.status, 'active') = $2)
            "#,
        )
        .bind(search)
        .bind(status)
        .fetch_one(pool)
        .await
        .map_err(|e| {
            warn!("DB error: count_users_admin failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;


        info!("DB query: count_users_admin completed, count={}", count);
        Ok(count)
    }

    /// Get detailed user info for admin
    #[instrument(skip(pool), fields(wallet = %wallet_address))]
    pub async fn get_user_detail_admin(
        pool: &PgPool,
        wallet_address: &str,
    ) -> Result<Option<AdminUserDetailRow>, ApiError> {
        info!("DB query: get_user_detail_admin started");

        let result = sqlx::query_as::<_, AdminUserDetailRow>(
            r#"
            SELECT u.wallet_address, u.pk_dilithium, u.created_at, u.last_active,
                   us.email, us.language, us.notification_email, us.notification_browser,
                   us.two_factor_enabled,
                   COALESCE(us.status, 'active') as status,
                   (SELECT COUNT(*) FROM locks l WHERE l.wallet_address = u.wallet_address) as total_locks,
                   (SELECT COUNT(*) FROM unlock_requests ur WHERE ur.wallet_address = u.wallet_address) as total_unlocks,
                   (SELECT COALESCE(SUM(amount), 0) FROM locks l WHERE l.wallet_address = u.wallet_address AND l.status IN ('confirmed', 'locked')) as total_locked
            FROM users u
            LEFT JOIN user_settings us ON u.wallet_address = us.wallet_address
            WHERE u.wallet_address = $1
            "#,
        )
        .bind(wallet_address)
        .fetch_optional(pool)
        .await
        .map_err(|e| {
            warn!("DB error: get_user_detail_admin failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: get_user_detail_admin completed, found={}", result.is_some());
        Ok(result)
    }

    /// Update user status (suspend/activate)
    #[instrument(skip(pool), fields(wallet = %wallet_address, status = %new_status))]
    pub async fn update_user_status(
        pool: &PgPool,
        wallet_address: &str,
        new_status: &str,
    ) -> Result<(), ApiError> {
        info!("DB query: update_user_status started");

        // Upsert user_settings with new status
        sqlx::query(
            r#"
            INSERT INTO user_settings (wallet_address, status, updated_at)
            VALUES ($1, $2, NOW())
            ON CONFLICT (wallet_address) DO UPDATE
            SET status = $2, updated_at = NOW()
            "#,
        )
        .bind(wallet_address)
        .bind(new_status)
        .execute(pool)
        .await
        .map_err(|e| {
            warn!("DB error: update_user_status failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: update_user_status completed");
        Ok(())
    }
}

// ============================================================================
// Admin User Models (Phase 8-C)
// ============================================================================

use bigdecimal::BigDecimal;

#[derive(Debug, Clone, FromRow)]
pub struct UserAdminRow {
    pub wallet_address: String,
    pub pk_dilithium: Option<Vec<u8>>,
    pub created_at: DateTime<Utc>,
    pub last_active: Option<DateTime<Utc>>,
    pub email: Option<String>,
    pub language: Option<String>,
    pub status: String,
    pub total_locks: i64,
    pub total_locked: BigDecimal,
}

#[derive(Debug, Clone, FromRow)]
pub struct AdminUserDetailRow {
    pub wallet_address: String,
    pub pk_dilithium: Option<Vec<u8>>,
    pub created_at: DateTime<Utc>,
    pub last_active: Option<DateTime<Utc>>,
    pub email: Option<String>,
    pub language: Option<String>,
    pub notification_email: Option<bool>,
    pub notification_browser: Option<bool>,
    pub two_factor_enabled: Option<bool>,
    pub status: String,
    pub total_locks: i64,
    pub total_unlocks: i64,
    pub total_locked: BigDecimal,
}
