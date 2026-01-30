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
        let total_users: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM users")
            .fetch_one(pool)
            .await
            .map_err(|e| ApiError::Internal(format!("Database error: {}", e)))?
            .unwrap_or(0);

        // Active provers
        let active_provers: i64 = sqlx::query_scalar(
            "SELECT COUNT(*) FROM provers WHERE status = 'active'"
        )
        .fetch_one(pool)
        .await
        .map_err(|e| ApiError::Internal(format!("Database error: {}", e)))?
        .unwrap_or(0);

        // Active observers
        let active_observers: i64 = sqlx::query_scalar(
            "SELECT COUNT(*) FROM observers WHERE status = 'active'"
        )
        .fetch_one(pool)
        .await
        .map_err(|e| ApiError::Internal(format!("Database error: {}", e)))?
        .unwrap_or(0);

        // Pending challenges
        let pending_challenges: i64 = sqlx::query_scalar(
            "SELECT COUNT(*) FROM challenges WHERE status = 'pending'"
        )
        .fetch_one(pool)
        .await
        .map_err(|e| ApiError::Internal(format!("Database error: {}", e)))?
        .unwrap_or(0);

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
