//! Enterprise repository for database operations
//!
//! Handles all enterprise-specific DB queries:
//! - Organizations, Users, API Keys, Applications, Audit Log, Settings
//! Follows BE-001~003 rules

use chrono::{DateTime, Utc};
use sqlx::{FromRow, PgPool};
use tracing::{info, instrument, warn};

use crate::error::ApiError;

// ============================================================================
// Enterprise Row Models
// ============================================================================

#[derive(Debug, Clone, FromRow)]
pub struct EnterpriseOrgRow {
    pub org_id: String,
    pub name: String,
    pub display_name: Option<String>,
    pub plan: String,
    pub logo_url: Option<String>,
    pub website: Option<String>,
    pub support_email: Option<String>,
    pub timezone: Option<String>,
    pub currency: Option<String>,
    pub created_at: Option<DateTime<Utc>>,
    pub updated_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, FromRow)]
pub struct EnterpriseUserRow {
    pub user_id: String,
    pub org_id: String,
    pub email: String,
    pub name: String,
    pub role: String,
    pub status: String,
    pub wallet_address: Option<String>,
    pub two_factor_enabled: Option<bool>,
    pub last_active: Option<DateTime<Utc>>,
    pub invited_by: Option<String>,
    pub created_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, FromRow)]
pub struct EnterpriseApiKeyRow {
    pub key_id: String,
    pub org_id: String,
    pub name: String,
    pub key_hash: String,
    pub key_preview: String,
    pub permissions: serde_json::Value,
    pub status: String,
    pub ip_whitelist: Option<serde_json::Value>,
    pub last_used: Option<DateTime<Utc>>,
    pub created_by: String,
    pub created_at: Option<DateTime<Utc>>,
    pub expires_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, FromRow)]
pub struct EnterpriseApplicationRow {
    pub application_id: String,
    pub company_name: String,
    pub registration_number: Option<String>,
    pub country: String,
    pub industry: String,
    pub website: Option<String>,
    pub contact_name: String,
    pub contact_email: String,
    pub contact_phone: Option<String>,
    pub job_title: String,
    pub expected_volume: Option<String>,
    pub use_case: String,
    pub notes: Option<String>,
    pub status: String,
    pub review_notes: Option<String>,
    pub assigned_reviewer: Option<String>,
    pub submitted_at: Option<DateTime<Utc>>,
    pub updated_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, FromRow)]
pub struct EnterpriseAuditLogRow {
    pub audit_id: String,
    pub org_id: Option<String>,
    pub user_id: Option<String>,
    pub user_name: Option<String>,
    pub action: String,
    pub details: Option<serde_json::Value>,
    pub ip_address: Option<String>,
    pub user_agent: Option<String>,
    pub created_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, FromRow)]
pub struct EnterpriseSettingsRow {
    pub org_id: String,
    pub notification_email_alerts: Option<bool>,
    pub notification_slack: Option<bool>,
    pub notification_webhook_url: Option<String>,
    pub alert_large_tx: Option<String>,
    pub alert_daily_volume: Option<String>,
    pub max_transaction_size: Option<String>,
    pub daily_transaction_limit: Option<String>,
    pub api_rate_limit: Option<i32>,
    pub two_factor_required: Option<bool>,
    pub session_timeout: Option<i32>,
    pub ip_whitelist_enabled: Option<bool>,
    pub ip_whitelist: Option<serde_json::Value>,
    pub password_min_length: Option<i32>,
    pub password_require_uppercase: Option<bool>,
    pub password_require_numbers: Option<bool>,
    pub password_require_special: Option<bool>,
    pub password_max_age: Option<i32>,
    pub audit_log_retention: Option<i32>,
    pub signing_key_rotation: Option<i32>,
    pub updated_at: Option<DateTime<Utc>>,
}

// ============================================================================
// Enterprise Repository
// ============================================================================

pub struct EnterpriseRepository;

impl EnterpriseRepository {
    // ========================================================================
    // Organization
    // ========================================================================

    /// Get organization by ID
    #[instrument(skip(pool))]
    pub async fn get_org(
        pool: &PgPool,
        org_id: &str,
    ) -> Result<Option<EnterpriseOrgRow>, ApiError> {
        info!("DB query: get_org started, org_id={}", org_id);

        let result = sqlx::query_as::<_, EnterpriseOrgRow>(
            r#"
            SELECT org_id, name, display_name, plan, logo_url, website,
                   support_email, timezone, currency, created_at, updated_at
            FROM enterprise_organizations
            WHERE org_id = $1
            "#,
        )
        .bind(org_id)
        .fetch_optional(pool)
        .await
        .map_err(|e| {
            warn!("DB error: get_org failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: get_org completed, found={}", result.is_some());
        Ok(result)
    }

    /// Create a new organization
    #[instrument(skip(pool))]
    pub async fn create_org(
        pool: &PgPool,
        org_id: &str,
        name: &str,
        display_name: Option<&str>,
        plan: &str,
        support_email: Option<&str>,
    ) -> Result<(), ApiError> {
        info!("DB insert: create_org started, org_id={}", org_id);

        sqlx::query(
            r#"
            INSERT INTO enterprise_organizations (org_id, name, display_name, plan, support_email)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (org_id) DO NOTHING
            "#,
        )
        .bind(org_id)
        .bind(name)
        .bind(display_name)
        .bind(plan)
        .bind(support_email)
        .execute(pool)
        .await
        .map_err(|e| {
            warn!("DB error: create_org failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB insert: create_org completed, org_id={}", org_id);
        Ok(())
    }

    /// Update organization fields
    #[instrument(skip(pool))]
    pub async fn update_org(
        pool: &PgPool,
        org_id: &str,
        display_name: Option<&str>,
        logo_url: Option<&str>,
        website: Option<&str>,
        support_email: Option<&str>,
        timezone: Option<&str>,
        currency: Option<&str>,
    ) -> Result<(), ApiError> {
        info!("DB update: update_org started, org_id={}", org_id);

        sqlx::query(
            r#"
            UPDATE enterprise_organizations
            SET display_name = COALESCE($2, display_name),
                logo_url = COALESCE($3, logo_url),
                website = COALESCE($4, website),
                support_email = COALESCE($5, support_email),
                timezone = COALESCE($6, timezone),
                currency = COALESCE($7, currency),
                updated_at = NOW()
            WHERE org_id = $1
            "#,
        )
        .bind(org_id)
        .bind(display_name)
        .bind(logo_url)
        .bind(website)
        .bind(support_email)
        .bind(timezone)
        .bind(currency)
        .execute(pool)
        .await
        .map_err(|e| {
            warn!("DB error: update_org failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB update: update_org completed, org_id={}", org_id);
        Ok(())
    }

    // ========================================================================
    // Users
    // ========================================================================

    /// List users for an organization
    #[instrument(skip(pool))]
    pub async fn list_users(
        pool: &PgPool,
        org_id: &str,
        offset: i64,
        limit: i64,
    ) -> Result<Vec<EnterpriseUserRow>, ApiError> {
        info!("DB query: list_users started, org_id={}", org_id);

        let results = sqlx::query_as::<_, EnterpriseUserRow>(
            r#"
            SELECT user_id, org_id, email, name, role, status,
                   wallet_address, two_factor_enabled, last_active,
                   invited_by, created_at
            FROM enterprise_users
            WHERE org_id = $1
            ORDER BY created_at DESC
            OFFSET $2 LIMIT $3
            "#,
        )
        .bind(org_id)
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

    /// Get a single user by ID
    #[instrument(skip(pool))]
    pub async fn get_user(
        pool: &PgPool,
        user_id: &str,
    ) -> Result<Option<EnterpriseUserRow>, ApiError> {
        info!("DB query: get_user started, user_id={}", user_id);

        let result = sqlx::query_as::<_, EnterpriseUserRow>(
            r#"
            SELECT user_id, org_id, email, name, role, status,
                   wallet_address, two_factor_enabled, last_active,
                   invited_by, created_at
            FROM enterprise_users
            WHERE user_id = $1
            "#,
        )
        .bind(user_id)
        .fetch_optional(pool)
        .await
        .map_err(|e| {
            warn!("DB error: get_user failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: get_user completed, found={}", result.is_some());
        Ok(result)
    }

    /// Create a new enterprise user
    #[instrument(skip(pool))]
    pub async fn create_user(
        pool: &PgPool,
        user_id: &str,
        org_id: &str,
        email: &str,
        name: &str,
        role: &str,
        wallet_address: Option<&str>,
    ) -> Result<(), ApiError> {
        info!("DB insert: create_user started, user_id={}, org_id={}", user_id, org_id);

        sqlx::query(
            r#"
            INSERT INTO enterprise_users (user_id, org_id, email, name, role, status, wallet_address)
            VALUES ($1, $2, $3, $4, $5, 'active', $6)
            ON CONFLICT (user_id) DO NOTHING
            "#,
        )
        .bind(user_id)
        .bind(org_id)
        .bind(email)
        .bind(name)
        .bind(role)
        .bind(wallet_address)
        .execute(pool)
        .await
        .map_err(|e| {
            warn!("DB error: create_user failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB insert: create_user completed, user_id={}", user_id);
        Ok(())
    }

    /// Create a pending (invited) enterprise user
    #[instrument(skip(pool))]
    pub async fn create_invited_user(
        pool: &PgPool,
        user_id: &str,
        org_id: &str,
        email: &str,
        role: &str,
        invited_by: Option<&str>,
    ) -> Result<(), ApiError> {
        info!("DB insert: create_invited_user started, user_id={}, email={}", user_id, email);

        sqlx::query(
            r#"
            INSERT INTO enterprise_users (user_id, org_id, email, name, role, status, invited_by)
            VALUES ($1, $2, $3, $3, $4, 'pending', $5)
            ON CONFLICT (user_id) DO NOTHING
            "#,
        )
        .bind(user_id)
        .bind(org_id)
        .bind(email)
        .bind(role)
        .bind(invited_by)
        .execute(pool)
        .await
        .map_err(|e| {
            warn!("DB error: create_invited_user failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB insert: create_invited_user completed, user_id={}", user_id);
        Ok(())
    }

    /// Count users for an organization
    #[instrument(skip(pool))]
    pub async fn count_users(
        pool: &PgPool,
        org_id: &str,
    ) -> Result<i64, ApiError> {
        info!("DB query: count_users started, org_id={}", org_id);

        let count: i64 = sqlx::query_scalar::<_, i64>(
            r#"
            SELECT COUNT(*)
            FROM enterprise_users
            WHERE org_id = $1
            "#,
        )
        .bind(org_id)
        .fetch_one(pool)
        .await
        .map_err(|e| {
            warn!("DB error: count_users failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: count_users completed, count={}", count);
        Ok(count)
    }

    /// Update user role
    #[instrument(skip(pool))]
    pub async fn update_user_role(
        pool: &PgPool,
        user_id: &str,
        new_role: &str,
    ) -> Result<(), ApiError> {
        info!("DB update: update_user_role started, user_id={}, role={}", user_id, new_role);

        sqlx::query(
            r#"
            UPDATE enterprise_users
            SET role = $2
            WHERE user_id = $1
            "#,
        )
        .bind(user_id)
        .bind(new_role)
        .execute(pool)
        .await
        .map_err(|e| {
            warn!("DB error: update_user_role failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB update: update_user_role completed, user_id={}", user_id);
        Ok(())
    }

    // ========================================================================
    // API Keys
    // ========================================================================

    /// List API keys for an organization
    #[instrument(skip(pool))]
    pub async fn list_api_keys(
        pool: &PgPool,
        org_id: &str,
    ) -> Result<Vec<EnterpriseApiKeyRow>, ApiError> {
        info!("DB query: list_api_keys started, org_id={}", org_id);

        let results = sqlx::query_as::<_, EnterpriseApiKeyRow>(
            r#"
            SELECT key_id, org_id, name, key_hash, key_preview, permissions,
                   status, ip_whitelist, last_used, created_by, created_at, expires_at
            FROM enterprise_api_keys
            WHERE org_id = $1
            ORDER BY created_at DESC
            "#,
        )
        .bind(org_id)
        .fetch_all(pool)
        .await
        .map_err(|e| {
            warn!("DB error: list_api_keys failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: list_api_keys completed, count={}", results.len());
        Ok(results)
    }

    /// Create a new API key
    #[instrument(skip(pool, key_hash))]
    pub async fn create_api_key(
        pool: &PgPool,
        key_id: &str,
        org_id: &str,
        name: &str,
        key_hash: &str,
        key_preview: &str,
        permissions: &serde_json::Value,
        created_by: &str,
        expires_at: Option<DateTime<Utc>>,
    ) -> Result<(), ApiError> {
        info!("DB insert: create_api_key started, key_id={}, org_id={}", key_id, org_id);

        sqlx::query(
            r#"
            INSERT INTO enterprise_api_keys (key_id, org_id, name, key_hash, key_preview,
                                             permissions, created_by, expires_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (key_id) DO NOTHING
            "#,
        )
        .bind(key_id)
        .bind(org_id)
        .bind(name)
        .bind(key_hash)
        .bind(key_preview)
        .bind(permissions)
        .bind(created_by)
        .bind(expires_at)
        .execute(pool)
        .await
        .map_err(|e| {
            warn!("DB error: create_api_key failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB insert: create_api_key completed, key_id={}", key_id);
        Ok(())
    }

    // ========================================================================
    // Settings
    // ========================================================================

    /// Get settings for an organization
    #[instrument(skip(pool))]
    pub async fn get_settings(
        pool: &PgPool,
        org_id: &str,
    ) -> Result<Option<EnterpriseSettingsRow>, ApiError> {
        info!("DB query: get_settings started, org_id={}", org_id);

        let result = sqlx::query_as::<_, EnterpriseSettingsRow>(
            r#"
            SELECT org_id, notification_email_alerts, notification_slack,
                   notification_webhook_url, alert_large_tx, alert_daily_volume,
                   max_transaction_size, daily_transaction_limit, api_rate_limit,
                   two_factor_required, session_timeout, ip_whitelist_enabled,
                   ip_whitelist, password_min_length, password_require_uppercase,
                   password_require_numbers, password_require_special,
                   password_max_age, audit_log_retention, signing_key_rotation,
                   updated_at
            FROM enterprise_settings
            WHERE org_id = $1
            "#,
        )
        .bind(org_id)
        .fetch_optional(pool)
        .await
        .map_err(|e| {
            warn!("DB error: get_settings failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: get_settings completed, found={}", result.is_some());
        Ok(result)
    }

    /// Upsert settings for an organization
    #[instrument(skip(pool))]
    pub async fn upsert_settings(
        pool: &PgPool,
        org_id: &str,
        notification_email_alerts: Option<bool>,
        notification_slack: Option<bool>,
        notification_webhook_url: Option<&str>,
        alert_large_tx: Option<&str>,
        alert_daily_volume: Option<&str>,
        max_transaction_size: Option<&str>,
        daily_transaction_limit: Option<&str>,
        api_rate_limit: Option<i32>,
    ) -> Result<(), ApiError> {
        info!("DB upsert: upsert_settings started, org_id={}", org_id);

        sqlx::query(
            r#"
            INSERT INTO enterprise_settings (org_id)
            VALUES ($1)
            ON CONFLICT (org_id) DO UPDATE
            SET notification_email_alerts = COALESCE($2, enterprise_settings.notification_email_alerts),
                notification_slack = COALESCE($3, enterprise_settings.notification_slack),
                notification_webhook_url = COALESCE($4, enterprise_settings.notification_webhook_url),
                alert_large_tx = COALESCE($5, enterprise_settings.alert_large_tx),
                alert_daily_volume = COALESCE($6, enterprise_settings.alert_daily_volume),
                max_transaction_size = COALESCE($7, enterprise_settings.max_transaction_size),
                daily_transaction_limit = COALESCE($8, enterprise_settings.daily_transaction_limit),
                api_rate_limit = COALESCE($9, enterprise_settings.api_rate_limit),
                updated_at = NOW()
            "#,
        )
        .bind(org_id)
        .bind(notification_email_alerts)
        .bind(notification_slack)
        .bind(notification_webhook_url)
        .bind(alert_large_tx)
        .bind(alert_daily_volume)
        .bind(max_transaction_size)
        .bind(daily_transaction_limit)
        .bind(api_rate_limit)
        .execute(pool)
        .await
        .map_err(|e| {
            warn!("DB error: upsert_settings failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB upsert: upsert_settings completed, org_id={}", org_id);
        Ok(())
    }

    // ========================================================================
    // Applications
    // ========================================================================

    /// Create a new enterprise application
    #[instrument(skip(pool))]
    pub async fn create_application(
        pool: &PgPool,
        application_id: &str,
        company_name: &str,
        registration_number: Option<&str>,
        country: &str,
        industry: &str,
        website: Option<&str>,
        contact_name: &str,
        contact_email: &str,
        contact_phone: Option<&str>,
        job_title: &str,
        expected_volume: Option<&str>,
        use_case: &str,
        notes: Option<&str>,
    ) -> Result<(), ApiError> {
        info!("DB insert: create_application started, app_id={}", application_id);

        sqlx::query(
            r#"
            INSERT INTO enterprise_applications (
                application_id, company_name, registration_number, country, industry,
                website, contact_name, contact_email, contact_phone, job_title,
                expected_volume, use_case, notes, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'pending')
            ON CONFLICT (application_id) DO NOTHING
            "#,
        )
        .bind(application_id)
        .bind(company_name)
        .bind(registration_number)
        .bind(country)
        .bind(industry)
        .bind(website)
        .bind(contact_name)
        .bind(contact_email)
        .bind(contact_phone)
        .bind(job_title)
        .bind(expected_volume)
        .bind(use_case)
        .bind(notes)
        .execute(pool)
        .await
        .map_err(|e| {
            warn!("DB error: create_application failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB insert: create_application completed, app_id={}", application_id);
        Ok(())
    }

    /// Get application by ID
    #[instrument(skip(pool))]
    pub async fn get_application(
        pool: &PgPool,
        application_id: &str,
    ) -> Result<Option<EnterpriseApplicationRow>, ApiError> {
        info!("DB query: get_application started, app_id={}", application_id);

        let result = sqlx::query_as::<_, EnterpriseApplicationRow>(
            r#"
            SELECT application_id, company_name, registration_number, country, industry,
                   website, contact_name, contact_email, contact_phone, job_title,
                   expected_volume, use_case, notes, status, review_notes,
                   assigned_reviewer, submitted_at, updated_at
            FROM enterprise_applications
            WHERE application_id = $1
            "#,
        )
        .bind(application_id)
        .fetch_optional(pool)
        .await
        .map_err(|e| {
            warn!("DB error: get_application failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: get_application completed, found={}", result.is_some());
        Ok(result)
    }

    /// Update application status
    #[instrument(skip(pool))]
    pub async fn update_application_status(
        pool: &PgPool,
        application_id: &str,
        status: &str,
    ) -> Result<(), ApiError> {
        info!("DB update: update_application_status started, app_id={}, status={}", application_id, status);

        sqlx::query(
            r#"
            UPDATE enterprise_applications
            SET status = $2, updated_at = NOW()
            WHERE application_id = $1
            "#,
        )
        .bind(application_id)
        .bind(status)
        .execute(pool)
        .await
        .map_err(|e| {
            warn!("DB error: update_application_status failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB update: update_application_status completed, app_id={}", application_id);
        Ok(())
    }

    // ========================================================================
    // Audit Log
    // ========================================================================

    /// List audit log entries for an organization
    #[instrument(skip(pool))]
    pub async fn list_audit_log(
        pool: &PgPool,
        org_id: &str,
        offset: i64,
        limit: i64,
    ) -> Result<Vec<EnterpriseAuditLogRow>, ApiError> {
        info!("DB query: list_audit_log started, org_id={}", org_id);

        let results = sqlx::query_as::<_, EnterpriseAuditLogRow>(
            r#"
            SELECT audit_id, org_id, user_id, user_name, action,
                   details, ip_address, user_agent, created_at
            FROM enterprise_audit_log
            WHERE org_id = $1
            ORDER BY created_at DESC
            OFFSET $2 LIMIT $3
            "#,
        )
        .bind(org_id)
        .bind(offset)
        .bind(limit)
        .fetch_all(pool)
        .await
        .map_err(|e| {
            warn!("DB error: list_audit_log failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: list_audit_log completed, count={}", results.len());
        Ok(results)
    }

    /// Count audit log entries for an organization
    #[instrument(skip(pool))]
    pub async fn count_audit_log(
        pool: &PgPool,
        org_id: &str,
    ) -> Result<i64, ApiError> {
        info!("DB query: count_audit_log started, org_id={}", org_id);

        let count: i64 = sqlx::query_scalar::<_, i64>(
            r#"
            SELECT COUNT(*)
            FROM enterprise_audit_log
            WHERE org_id = $1
            "#,
        )
        .bind(org_id)
        .fetch_one(pool)
        .await
        .map_err(|e| {
            warn!("DB error: count_audit_log failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: count_audit_log completed, count={}", count);
        Ok(count)
    }

    /// Insert audit log entry
    #[instrument(skip(pool))]
    pub async fn insert_audit_log(
        pool: &PgPool,
        audit_id: &str,
        org_id: &str,
        user_id: Option<&str>,
        user_name: Option<&str>,
        action: &str,
        details: Option<&serde_json::Value>,
        ip_address: Option<&str>,
        user_agent: Option<&str>,
    ) -> Result<(), ApiError> {
        info!("DB insert: insert_audit_log started, audit_id={}, action={}", audit_id, action);

        sqlx::query(
            r#"
            INSERT INTO enterprise_audit_log (audit_id, org_id, user_id, user_name, action,
                                              details, ip_address, user_agent)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            "#,
        )
        .bind(audit_id)
        .bind(org_id)
        .bind(user_id)
        .bind(user_name)
        .bind(action)
        .bind(details)
        .bind(ip_address)
        .bind(user_agent)
        .execute(pool)
        .await
        .map_err(|e| {
            warn!("DB error: insert_audit_log failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB insert: insert_audit_log completed, audit_id={}", audit_id);
        Ok(())
    }

    // ========================================================================
    // Settings: Create default settings for a new org
    // ========================================================================

    /// Create default settings for a new organization
    #[instrument(skip(pool))]
    pub async fn create_default_settings(
        pool: &PgPool,
        org_id: &str,
    ) -> Result<(), ApiError> {
        info!("DB insert: create_default_settings started, org_id={}", org_id);

        sqlx::query(
            r#"
            INSERT INTO enterprise_settings (org_id)
            VALUES ($1)
            ON CONFLICT (org_id) DO NOTHING
            "#,
        )
        .bind(org_id)
        .execute(pool)
        .await
        .map_err(|e| {
            warn!("DB error: create_default_settings failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB insert: create_default_settings completed, org_id={}", org_id);
        Ok(())
    }
}
