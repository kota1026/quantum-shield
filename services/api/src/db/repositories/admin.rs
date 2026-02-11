//! Admin repository for QS Admin API database operations
//!
//! Phase 8-C: TASK-P5-015 QS Admin API
//! Follows BE-001~003 rules for compliance

use bigdecimal::BigDecimal;
use chrono::{DateTime, NaiveDate, Utc};
use sqlx::{FromRow, PgPool};
use tracing::{info, instrument, warn};

use crate::error::ApiError;

// ============================================================================
// Admin User Models
// ============================================================================

#[derive(Debug, Clone, FromRow)]
pub struct AdminUserRow {
    pub admin_id: String,
    pub wallet_address: String,
    pub email: String,
    pub name: String,
    pub role_id: String,
    pub status: String,
    pub two_factor_enabled: bool,
    pub created_at: DateTime<Utc>,
    pub last_login: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, FromRow)]
pub struct AdminRoleRow {
    pub role_id: String,
    pub name: String,
    pub level: i16,
    pub permissions: serde_json::Value,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, FromRow)]
pub struct AdminAuditLogRow {
    pub log_id: String,
    pub admin_id: String,
    pub action: String,
    pub resource_type: String,
    pub resource_id: Option<String>,
    pub details: Option<serde_json::Value>,
    pub ip_address: Option<String>,
    pub user_agent: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, FromRow)]
pub struct AdminSessionRow {
    pub session_id: String,
    pub admin_id: String,
    pub ip_address: String,
    pub user_agent: Option<String>,
    pub created_at: DateTime<Utc>,
    pub expires_at: DateTime<Utc>,
    pub revoked_at: Option<DateTime<Utc>>,
    /// SHA-256 hash of refresh token (Phase 3: S-3 security fix)
    pub refresh_token_hash: Option<String>,
}

// ============================================================================
// Dashboard Metrics Models
// ============================================================================

#[derive(Debug, Clone, FromRow)]
pub struct DailyMetricRow {
    pub date: NaiveDate,
    pub tvl: BigDecimal,
    pub active_users: i64,
    pub new_users: i64,
    pub transactions_count: i64,
    pub lock_volume: BigDecimal,
    pub unlock_volume: BigDecimal,
    pub fee_revenue: BigDecimal,
    pub prover_uptime: f64,
    pub avg_unlock_time: f64,
    pub computed_at: DateTime<Utc>,
}

// ============================================================================
// Admin Repository
// ============================================================================

pub struct AdminRepository;

impl AdminRepository {
    // ========================================================================
    // Admin User Operations
    // ========================================================================

    /// Get admin user by wallet address
    /// BE-003: Logs query start and result
    #[instrument(skip(pool), fields(wallet = %wallet_address))]
    pub async fn get_admin_by_wallet(
        pool: &PgPool,
        wallet_address: &str,
    ) -> Result<Option<AdminUserRow>, ApiError> {
        info!("DB query: get_admin_by_wallet started");

        let result = sqlx::query_as::<_, AdminUserRow>(
            r#"
            SELECT admin_id, wallet_address, email, name, role_id, status,
                   two_factor_enabled, created_at, last_login
            FROM admin_users
            WHERE wallet_address = $1
            "#,
        )
        .bind(wallet_address)
        .fetch_optional(pool)
        .await
        .map_err(|e| {
            warn!("DB error: get_admin_by_wallet failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: get_admin_by_wallet completed, found={}", result.is_some());
        Ok(result)
    }

    /// Get admin user by ID
    #[instrument(skip(pool), fields(admin_id = %admin_id))]
    pub async fn get_admin_by_id(
        pool: &PgPool,
        admin_id: &str,
    ) -> Result<Option<AdminUserRow>, ApiError> {
        info!("DB query: get_admin_by_id started");

        let result = sqlx::query_as::<_, AdminUserRow>(
            r#"
            SELECT admin_id, wallet_address, email, name, role_id, status,
                   two_factor_enabled, created_at, last_login
            FROM admin_users
            WHERE admin_id = $1
            "#,
        )
        .bind(admin_id)
        .fetch_optional(pool)
        .await
        .map_err(|e| {
            warn!("DB error: get_admin_by_id failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: get_admin_by_id completed, found={}", result.is_some());
        Ok(result)
    }

    /// List all admin users with pagination
    #[instrument(skip(pool), fields(offset = offset, limit = limit))]
    pub async fn list_admins(
        pool: &PgPool,
        offset: i64,
        limit: i64,
    ) -> Result<Vec<AdminUserRow>, ApiError> {
        info!("DB query: list_admins started");

        let results = sqlx::query_as::<_, AdminUserRow>(
            r#"
            SELECT admin_id, wallet_address, email, name, role_id, status,
                   two_factor_enabled, created_at, last_login
            FROM admin_users
            ORDER BY created_at DESC
            OFFSET $1 LIMIT $2
            "#,
        )
        .bind(offset)
        .bind(limit)
        .fetch_all(pool)
        .await
        .map_err(|e| {
            warn!("DB error: list_admins failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: list_admins completed, count={}", results.len());
        Ok(results)
    }

    /// Create a new admin user
    #[instrument(skip(pool), fields(wallet = %wallet_address, email = %email))]
    pub async fn create_admin(
        pool: &PgPool,
        admin_id: &str,
        wallet_address: &str,
        email: &str,
        name: &str,
        role_id: &str,
    ) -> Result<AdminUserRow, ApiError> {
        info!("DB query: create_admin started");

        let result = sqlx::query_as::<_, AdminUserRow>(
            r#"
            INSERT INTO admin_users (admin_id, wallet_address, email, name, role_id, status, two_factor_enabled, created_at)
            VALUES ($1, $2, $3, $4, $5, 'active', false, NOW())
            RETURNING admin_id, wallet_address, email, name, role_id, status, two_factor_enabled, created_at, last_login
            "#,
        )
        .bind(admin_id)
        .bind(wallet_address)
        .bind(email)
        .bind(name)
        .bind(role_id)
        .fetch_one(pool)
        .await
        .map_err(|e| {
            warn!("DB error: create_admin failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: create_admin completed, admin_id={}", admin_id);
        Ok(result)
    }

    // ========================================================================
    // Admin Session Operations
    // ========================================================================

    /// Create a new admin session
    /// BE-001: Real DB operation required
    /// BE-003: Mandatory logging
    #[instrument(skip(pool), fields(admin_id = %admin_id))]
    pub async fn create_session(
        pool: &PgPool,
        session_id: &str,
        admin_id: &str,
        ip_address: &str,
        user_agent: Option<&str>,
        expires_at: DateTime<Utc>,
    ) -> Result<AdminSessionRow, ApiError> {
        info!("DB query: create_session started");

        let result = sqlx::query_as::<_, AdminSessionRow>(
            r#"
            INSERT INTO admin_sessions (session_id, admin_id, ip_address, user_agent, created_at, expires_at)
            VALUES ($1, $2, $3, $4, NOW(), $5)
            RETURNING session_id, admin_id, ip_address, user_agent, created_at, expires_at, revoked_at, refresh_token_hash
            "#,
        )
        .bind(session_id)
        .bind(admin_id)
        .bind(ip_address)
        .bind(user_agent)
        .bind(expires_at)
        .fetch_one(pool)
        .await
        .map_err(|e| {
            warn!("DB error: create_session failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: create_session completed, session_id={}", session_id);
        Ok(result)
    }

    /// Get active session by ID
    #[instrument(skip(pool), fields(session_id = %session_id))]
    pub async fn get_session(
        pool: &PgPool,
        session_id: &str,
    ) -> Result<Option<AdminSessionRow>, ApiError> {
        info!("DB query: get_session started");

        let result = sqlx::query_as::<_, AdminSessionRow>(
            r#"
            SELECT session_id, admin_id, ip_address, user_agent, created_at, expires_at, revoked_at, refresh_token_hash
            FROM admin_sessions
            WHERE session_id = $1 AND revoked_at IS NULL AND expires_at > NOW()
            "#,
        )
        .bind(session_id)
        .fetch_optional(pool)
        .await
        .map_err(|e| {
            warn!("DB error: get_session failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: get_session completed, found={}", result.is_some());
        Ok(result)
    }

    /// Revoke a session (logout)
    #[instrument(skip(pool), fields(session_id = %session_id))]
    pub async fn revoke_session(
        pool: &PgPool,
        session_id: &str,
    ) -> Result<bool, ApiError> {
        info!("DB query: revoke_session started");

        let result = sqlx::query(
            r#"
            UPDATE admin_sessions
            SET revoked_at = NOW()
            WHERE session_id = $1 AND revoked_at IS NULL
            "#,
        )
        .bind(session_id)
        .execute(pool)
        .await
        .map_err(|e| {
            warn!("DB error: revoke_session failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: revoke_session completed, rows_affected={}", result.rows_affected());
        Ok(result.rows_affected() > 0)
    }

    /// Revoke all sessions for an admin (logout all devices)
    #[instrument(skip(pool), fields(admin_id = %admin_id))]
    pub async fn revoke_all_sessions(
        pool: &PgPool,
        admin_id: &str,
    ) -> Result<u64, ApiError> {
        info!("DB query: revoke_all_sessions started");

        let result = sqlx::query(
            r#"
            UPDATE admin_sessions
            SET revoked_at = NOW()
            WHERE admin_id = $1 AND revoked_at IS NULL
            "#,
        )
        .bind(admin_id)
        .execute(pool)
        .await
        .map_err(|e| {
            warn!("DB error: revoke_all_sessions failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: revoke_all_sessions completed, count={}", result.rows_affected());
        Ok(result.rows_affected())
    }

    /// Update admin last login time
    #[instrument(skip(pool), fields(admin_id = %admin_id))]
    pub async fn update_last_login(
        pool: &PgPool,
        admin_id: &str,
    ) -> Result<(), ApiError> {
        info!("DB query: update_last_login started");

        sqlx::query(
            r#"
            UPDATE admin_users
            SET last_login = NOW()
            WHERE admin_id = $1
            "#,
        )
        .bind(admin_id)
        .execute(pool)
        .await
        .map_err(|e| {
            warn!("DB error: update_last_login failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: update_last_login completed");
        Ok(())
    }

    /// Get admin's 2FA secret
    #[instrument(skip(pool), fields(admin_id = %admin_id))]
    pub async fn get_two_factor_secret(
        pool: &PgPool,
        admin_id: &str,
    ) -> Result<Option<String>, ApiError> {
        info!("DB query: get_two_factor_secret started");

        let result: Option<(Option<String>,)> = sqlx::query_as(
            r#"
            SELECT two_factor_secret
            FROM admin_users
            WHERE admin_id = $1 AND two_factor_enabled = true
            "#,
        )
        .bind(admin_id)
        .fetch_optional(pool)
        .await
        .map_err(|e| {
            warn!("DB error: get_two_factor_secret failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: get_two_factor_secret completed");
        Ok(result.and_then(|(secret,)| secret))
    }

    // ========================================================================
    // Refresh Token Operations (Phase 3: S-3 Security Fix)
    // ========================================================================

    /// Store refresh token hash for a session
    /// S-3: Enables DB-side refresh token validation
    #[instrument(skip(pool), fields(session_id = %session_id))]
    pub async fn store_refresh_token_hash(
        pool: &PgPool,
        session_id: &str,
        refresh_token_hash: &str,
    ) -> Result<(), ApiError> {
        info!("DB update: store_refresh_token_hash started");

        sqlx::query(
            r#"
            UPDATE admin_sessions
            SET refresh_token_hash = $1
            WHERE session_id = $2
            "#,
        )
        .bind(refresh_token_hash)
        .bind(session_id)
        .execute(pool)
        .await
        .map_err(|e| {
            warn!("DB error: store_refresh_token_hash failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB update: store_refresh_token_hash completed");
        Ok(())
    }

    /// Get active session by refresh token hash
    /// S-3: Validates refresh token against DB before issuing new tokens
    #[instrument(skip(pool))]
    pub async fn get_session_by_refresh_hash(
        pool: &PgPool,
        refresh_token_hash: &str,
    ) -> Result<Option<AdminSessionRow>, ApiError> {
        info!("DB query: get_session_by_refresh_hash started");

        let result = sqlx::query_as::<_, AdminSessionRow>(
            r#"
            SELECT session_id, admin_id, ip_address, user_agent, created_at, expires_at, revoked_at, refresh_token_hash
            FROM admin_sessions
            WHERE refresh_token_hash = $1
              AND revoked_at IS NULL
              AND expires_at > NOW()
            "#,
        )
        .bind(refresh_token_hash)
        .fetch_optional(pool)
        .await
        .map_err(|e| {
            warn!("DB error: get_session_by_refresh_hash failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: get_session_by_refresh_hash completed, found={}", result.is_some());
        Ok(result)
    }

    /// Revoke session and invalidate refresh token (rotation)
    /// S-3: Old refresh token is invalidated when new one is issued
    #[instrument(skip(pool), fields(session_id = %session_id))]
    pub async fn rotate_refresh_token(
        pool: &PgPool,
        session_id: &str,
        new_refresh_token_hash: &str,
    ) -> Result<(), ApiError> {
        info!("DB update: rotate_refresh_token started");

        sqlx::query(
            r#"
            UPDATE admin_sessions
            SET refresh_token_hash = $1
            WHERE session_id = $2
            "#,
        )
        .bind(new_refresh_token_hash)
        .bind(session_id)
        .execute(pool)
        .await
        .map_err(|e| {
            warn!("DB error: rotate_refresh_token failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB update: rotate_refresh_token completed");
        Ok(())
    }

    // ========================================================================
    // Admin Audit Log Operations
    // ========================================================================

    /// Insert an audit log entry
    /// BE-003: Mandatory logging for all admin actions
    #[instrument(skip(pool, details))]
    pub async fn create_audit_log(
        pool: &PgPool,
        log_id: &str,
        admin_id: &str,
        action: &str,
        resource_type: &str,
        resource_id: Option<&str>,
        details: Option<serde_json::Value>,
        ip_address: Option<&str>,
        user_agent: Option<&str>,
    ) -> Result<(), ApiError> {
        info!("DB query: create_audit_log started, action={}", action);

        sqlx::query(
            r#"
            INSERT INTO admin_audit_logs (log_id, admin_id, action, resource_type, resource_id, details, ip_address, user_agent, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
            "#,
        )
        .bind(log_id)
        .bind(admin_id)
        .bind(action)
        .bind(resource_type)
        .bind(resource_id)
        .bind(details)
        .bind(ip_address)
        .bind(user_agent)
        .execute(pool)
        .await
        .map_err(|e| {
            warn!("DB error: create_audit_log failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: create_audit_log completed");
        Ok(())
    }

    /// List audit logs with filtering
    #[instrument(skip(pool))]
    pub async fn list_audit_logs(
        pool: &PgPool,
        admin_id: Option<&str>,
        resource_type: Option<&str>,
        offset: i64,
        limit: i64,
    ) -> Result<Vec<AdminAuditLogRow>, ApiError> {
        info!("DB query: list_audit_logs started");

        let results = sqlx::query_as::<_, AdminAuditLogRow>(
            r#"
            SELECT log_id, admin_id, action, resource_type, resource_id, details, ip_address, user_agent, created_at
            FROM admin_audit_logs
            WHERE ($1::TEXT IS NULL OR admin_id = $1)
              AND ($2::TEXT IS NULL OR resource_type = $2)
            ORDER BY created_at DESC
            OFFSET $3 LIMIT $4
            "#,
        )
        .bind(admin_id)
        .bind(resource_type)
        .bind(offset)
        .bind(limit)
        .fetch_all(pool)
        .await
        .map_err(|e| {
            warn!("DB error: list_audit_logs failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: list_audit_logs completed, count={}", results.len());
        Ok(results)
    }

    // ========================================================================
    // Dashboard Metrics Operations
    // ========================================================================

    /// Get latest daily metrics
    #[instrument(skip(pool))]
    pub async fn get_latest_metrics(pool: &PgPool) -> Result<Option<DailyMetricRow>, ApiError> {
        info!("DB query: get_latest_metrics started");

        let result = sqlx::query_as::<_, DailyMetricRow>(
            r#"
            SELECT date, tvl, active_users, new_users, transactions_count,
                   lock_volume, unlock_volume, fee_revenue, prover_uptime,
                   avg_unlock_time, computed_at
            FROM daily_metrics
            ORDER BY date DESC
            LIMIT 1
            "#,
        )
        .fetch_optional(pool)
        .await
        .map_err(|e| {
            warn!("DB error: get_latest_metrics failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: get_latest_metrics completed, found={}", result.is_some());
        Ok(result)
    }

    /// Get metrics for date range
    #[instrument(skip(pool), fields(start = %start_date, end = %end_date))]
    pub async fn get_metrics_range(
        pool: &PgPool,
        start_date: NaiveDate,
        end_date: NaiveDate,
    ) -> Result<Vec<DailyMetricRow>, ApiError> {
        info!("DB query: get_metrics_range started");

        let results = sqlx::query_as::<_, DailyMetricRow>(
            r#"
            SELECT date, tvl, active_users, new_users, transactions_count,
                   lock_volume, unlock_volume, fee_revenue, prover_uptime,
                   avg_unlock_time, computed_at
            FROM daily_metrics
            WHERE date >= $1 AND date <= $2
            ORDER BY date DESC
            "#,
        )
        .bind(start_date)
        .bind(end_date)
        .fetch_all(pool)
        .await
        .map_err(|e| {
            warn!("DB error: get_metrics_range failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: get_metrics_range completed, count={}", results.len());
        Ok(results)
    }

    // ========================================================================
    // Aggregate Queries
    // ========================================================================

    /// Get total counts for dashboard
    #[instrument(skip(pool))]
    pub async fn get_dashboard_counts(
        pool: &PgPool,
    ) -> Result<DashboardCounts, ApiError> {
        info!("DB query: get_dashboard_counts started");

        // Total users
        let total_users: i64 = sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM users")
            .fetch_one(pool)
            .await
            .map_err(|e| ApiError::Internal(format!("Database error: {}", e)))?;

        // Active provers
        let active_provers: i64 = sqlx::query_scalar::<_, i64>(
            "SELECT COUNT(*) FROM provers WHERE status = 'active'"
        )
        .fetch_one(pool)
        .await
        .map_err(|e| ApiError::Internal(format!("Database error: {}", e)))?;

        // Active observers
        let active_observers: i64 = sqlx::query_scalar::<_, i64>(
            "SELECT COUNT(*) FROM observers WHERE status = 'active'"
        )
        .fetch_one(pool)
        .await
        .map_err(|e| ApiError::Internal(format!("Database error: {}", e)))?;

        // Pending challenges
        let pending_challenges: i64 = sqlx::query_scalar::<_, i64>(
            "SELECT COUNT(*) FROM challenges WHERE status = 'pending'"
        )
        .fetch_one(pool)
        .await
        .map_err(|e| ApiError::Internal(format!("Database error: {}", e)))?;

        info!("DB query: get_dashboard_counts completed");
        Ok(DashboardCounts {
            total_users,
            active_provers,
            active_observers,
            pending_challenges,
        })
    }
}

/// Dashboard aggregate counts
#[derive(Debug, Clone)]
pub struct DashboardCounts {
    pub total_users: i64,
    pub active_provers: i64,
    pub active_observers: i64,
    pub pending_challenges: i64,
}

// ============================================================================
// Alert Models (Phase 8-C: dashboard/alerts endpoint)
// ============================================================================

/// Alert row from alerts table
#[derive(Debug, Clone, FromRow)]
pub struct AlertRow {
    pub alert_id: String,
    pub rule_id: Option<String>,
    pub severity: String,
    pub message: String,
    pub details: Option<serde_json::Value>,
    pub status: String,
    pub acknowledged_by: Option<String>,
    pub triggered_at: DateTime<Utc>,
    pub acknowledged_at: Option<DateTime<Utc>>,
    pub resolved_at: Option<DateTime<Utc>>,
}

impl AdminRepository {
    // ========================================================================
    // Alert Operations (Phase 8-C)
    // ========================================================================

    /// List alerts with optional status and severity filters
    /// BE-001: Real DB operation
    /// BE-003: Mandatory logging
    #[instrument(skip(pool), fields(status = ?status, severity = ?severity))]
    pub async fn list_alerts(
        pool: &PgPool,
        status: Option<&str>,
        severity: Option<&str>,
        offset: i64,
        limit: i64,
    ) -> Result<Vec<AlertRow>, ApiError> {
        info!("DB query: list_alerts started");

        let results = match (status, severity) {
            (Some(s), Some(sev)) => {
                sqlx::query_as::<_, AlertRow>(
                    r#"
                    SELECT alert_id, rule_id, severity, message, details, status,
                           acknowledged_by, triggered_at, acknowledged_at, resolved_at
                    FROM alerts
                    WHERE status = $1 AND severity = $2
                    ORDER BY triggered_at DESC
                    OFFSET $3 LIMIT $4
                    "#,
                )
                .bind(s)
                .bind(sev)
                .bind(offset)
                .bind(limit)
                .fetch_all(pool)
                .await
            }
            (Some(s), None) => {
                sqlx::query_as::<_, AlertRow>(
                    r#"
                    SELECT alert_id, rule_id, severity, message, details, status,
                           acknowledged_by, triggered_at, acknowledged_at, resolved_at
                    FROM alerts
                    WHERE status = $1
                    ORDER BY triggered_at DESC
                    OFFSET $2 LIMIT $3
                    "#,
                )
                .bind(s)
                .bind(offset)
                .bind(limit)
                .fetch_all(pool)
                .await
            }
            (None, Some(sev)) => {
                sqlx::query_as::<_, AlertRow>(
                    r#"
                    SELECT alert_id, rule_id, severity, message, details, status,
                           acknowledged_by, triggered_at, acknowledged_at, resolved_at
                    FROM alerts
                    WHERE severity = $1
                    ORDER BY triggered_at DESC
                    OFFSET $2 LIMIT $3
                    "#,
                )
                .bind(sev)
                .bind(offset)
                .bind(limit)
                .fetch_all(pool)
                .await
            }
            (None, None) => {
                sqlx::query_as::<_, AlertRow>(
                    r#"
                    SELECT alert_id, rule_id, severity, message, details, status,
                           acknowledged_by, triggered_at, acknowledged_at, resolved_at
                    FROM alerts
                    ORDER BY triggered_at DESC
                    OFFSET $1 LIMIT $2
                    "#,
                )
                .bind(offset)
                .bind(limit)
                .fetch_all(pool)
                .await
            }
        }
        .map_err(|e| {
            warn!("DB error: list_alerts failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: list_alerts completed, count={}", results.len());
        Ok(results)
    }

    /// Count alerts by status
    #[instrument(skip(pool), fields(status = ?status))]
    pub async fn count_alerts(
        pool: &PgPool,
        status: Option<&str>,
    ) -> Result<i64, ApiError> {
        info!("DB query: count_alerts started");

        let count: i64 = if let Some(s) = status {
            sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM alerts WHERE status = $1")
                .bind(s)
                .fetch_one(pool)
                .await
        } else {
            sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM alerts")
                .fetch_one(pool)
                .await
        }
        .map_err(|e| {
            warn!("DB error: count_alerts failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: count_alerts completed, count={}", count);
        Ok(count)
    }
}
