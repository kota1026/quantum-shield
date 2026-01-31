//! Support repository for database operations
//!
//! Phase 8-C: Support tickets, FAQ, and announcements management
//! Follows BE-001~003 rules

use chrono::{DateTime, Utc};
use sqlx::{FromRow, PgPool};
use tracing::{info, instrument, warn};

use crate::error::ApiError;

// ============================================================================
// Support Ticket Models
// ============================================================================

#[derive(Debug, Clone, FromRow)]
pub struct TicketRow {
    pub ticket_id: String,
    pub user_wallet: String,
    pub subject: String,
    pub description: String,
    pub category: String,
    pub priority: String,
    pub status: String,
    pub assigned_to: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub resolved_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, FromRow)]
pub struct FaqRow {
    pub faq_id: String,
    pub question: String,
    pub answer: String,
    pub category: String,
    pub sort_order: i32,
    pub is_published: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, FromRow)]
pub struct AnnouncementRow {
    pub announcement_id: String,
    pub title: String,
    pub content: String,
    pub category: String,
    pub priority: String,
    pub is_published: bool,
    pub published_at: Option<DateTime<Utc>>,
    pub expires_at: Option<DateTime<Utc>>,
    pub created_by: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// Support Repository
// ============================================================================

pub struct SupportRepository;

impl SupportRepository {
    // ========================================================================
    // Ticket Operations
    // ========================================================================

    /// List support tickets with filtering
    /// BE-001: Real DB operation
    /// BE-003: Mandatory logging
    #[instrument(skip(pool))]
    pub async fn list_tickets(
        pool: &PgPool,
        status: Option<&str>,
        priority: Option<&str>,
        offset: i64,
        limit: i64,
    ) -> Result<Vec<TicketRow>, ApiError> {
        info!("DB query: list_tickets started");

        let results = sqlx::query_as::<_, TicketRow>(
            r#"
            SELECT ticket_id, user_wallet, subject, description, category,
                   priority, status, assigned_to, created_at, updated_at, resolved_at
            FROM support_tickets
            WHERE ($1::TEXT IS NULL OR status = $1)
              AND ($2::TEXT IS NULL OR priority = $2)
            ORDER BY
                CASE priority
                    WHEN 'critical' THEN 1
                    WHEN 'high' THEN 2
                    WHEN 'medium' THEN 3
                    ELSE 4
                END,
                created_at DESC
            OFFSET $3 LIMIT $4
            "#,
        )
        .bind(status)
        .bind(priority)
        .bind(offset)
        .bind(limit)
        .fetch_all(pool)
        .await
        .map_err(|e| {
            warn!("DB error: list_tickets failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: list_tickets completed, count={}", results.len());
        Ok(results)
    }

    /// Count tickets by status
    #[instrument(skip(pool))]
    pub async fn count_tickets(
        pool: &PgPool,
        status: Option<&str>,
    ) -> Result<i64, ApiError> {
        info!("DB query: count_tickets started");

        let count: i64 = sqlx::query_scalar(
            r#"
            SELECT COUNT(*)
            FROM support_tickets
            WHERE ($1::TEXT IS NULL OR status = $1)
            "#,
        )
        .bind(status)
        .fetch_one(pool)
        .await
        .map_err(|e| {
            warn!("DB error: count_tickets failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?
        .unwrap_or(0);

        info!("DB query: count_tickets completed, count={}", count);
        Ok(count)
    }

    /// Get ticket by ID
    #[instrument(skip(pool), fields(ticket_id = %ticket_id))]
    pub async fn get_ticket_by_id(
        pool: &PgPool,
        ticket_id: &str,
    ) -> Result<Option<TicketRow>, ApiError> {
        info!("DB query: get_ticket_by_id started");

        let result = sqlx::query_as::<_, TicketRow>(
            r#"
            SELECT ticket_id, user_wallet, subject, description, category,
                   priority, status, assigned_to, created_at, updated_at, resolved_at
            FROM support_tickets
            WHERE ticket_id = $1
            "#,
        )
        .bind(ticket_id)
        .fetch_optional(pool)
        .await
        .map_err(|e| {
            warn!("DB error: get_ticket_by_id failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: get_ticket_by_id completed, found={}", result.is_some());
        Ok(result)
    }

    /// Update ticket status
    #[instrument(skip(pool), fields(ticket_id = %ticket_id))]
    pub async fn update_ticket(
        pool: &PgPool,
        ticket_id: &str,
        status: Option<&str>,
        assigned_to: Option<&str>,
        priority: Option<&str>,
    ) -> Result<TicketRow, ApiError> {
        info!("DB query: update_ticket started");

        let result = sqlx::query_as::<_, TicketRow>(
            r#"
            UPDATE support_tickets
            SET status = COALESCE($2, status),
                assigned_to = COALESCE($3, assigned_to),
                priority = COALESCE($4, priority),
                updated_at = NOW(),
                resolved_at = CASE WHEN $2 = 'resolved' THEN NOW() ELSE resolved_at END
            WHERE ticket_id = $1
            RETURNING ticket_id, user_wallet, subject, description, category,
                      priority, status, assigned_to, created_at, updated_at, resolved_at
            "#,
        )
        .bind(ticket_id)
        .bind(status)
        .bind(assigned_to)
        .bind(priority)
        .fetch_one(pool)
        .await
        .map_err(|e| {
            warn!("DB error: update_ticket failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: update_ticket completed");
        Ok(result)
    }

    // ========================================================================
    // FAQ Operations
    // ========================================================================

    /// List FAQs
    #[instrument(skip(pool))]
    pub async fn list_faqs(
        pool: &PgPool,
        category: Option<&str>,
        published_only: bool,
    ) -> Result<Vec<FaqRow>, ApiError> {
        info!("DB query: list_faqs started");

        let results = sqlx::query_as::<_, FaqRow>(
            r#"
            SELECT faq_id, question, answer, category, sort_order,
                   is_published, created_at, updated_at
            FROM faqs
            WHERE ($1::TEXT IS NULL OR category = $1)
              AND ($2 = false OR is_published = true)
            ORDER BY category, sort_order
            "#,
        )
        .bind(category)
        .bind(published_only)
        .fetch_all(pool)
        .await
        .map_err(|e| {
            warn!("DB error: list_faqs failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: list_faqs completed, count={}", results.len());
        Ok(results)
    }

    // ========================================================================
    // Announcement Operations
    // ========================================================================

    /// List announcements
    #[instrument(skip(pool))]
    pub async fn list_announcements(
        pool: &PgPool,
        published_only: bool,
        offset: i64,
        limit: i64,
    ) -> Result<Vec<AnnouncementRow>, ApiError> {
        info!("DB query: list_announcements started");

        let results = sqlx::query_as::<_, AnnouncementRow>(
            r#"
            SELECT announcement_id, title, content, category, priority,
                   is_published, published_at, expires_at, created_by,
                   created_at, updated_at
            FROM announcements
            WHERE ($1 = false OR (is_published = true AND (expires_at IS NULL OR expires_at > NOW())))
            ORDER BY
                CASE priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 ELSE 3 END,
                created_at DESC
            OFFSET $2 LIMIT $3
            "#,
        )
        .bind(published_only)
        .bind(offset)
        .bind(limit)
        .fetch_all(pool)
        .await
        .map_err(|e| {
            warn!("DB error: list_announcements failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: list_announcements completed, count={}", results.len());
        Ok(results)
    }

    /// Count announcements
    #[instrument(skip(pool))]
    pub async fn count_announcements(
        pool: &PgPool,
        published_only: bool,
    ) -> Result<i64, ApiError> {
        info!("DB query: count_announcements started");

        let count: i64 = sqlx::query_scalar(
            r#"
            SELECT COUNT(*)
            FROM announcements
            WHERE ($1 = false OR (is_published = true AND (expires_at IS NULL OR expires_at > NOW())))
            "#,
        )
        .bind(published_only)
        .fetch_one(pool)
        .await
        .map_err(|e| {
            warn!("DB error: count_announcements failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?
        .unwrap_or(0);

        info!("DB query: count_announcements completed, count={}", count);
        Ok(count)
    }

    /// Create announcement
    #[instrument(skip(pool))]
    pub async fn create_announcement(
        pool: &PgPool,
        announcement_id: &str,
        title: &str,
        content: &str,
        category: &str,
        priority: &str,
        created_by: &str,
        is_published: bool,
    ) -> Result<AnnouncementRow, ApiError> {
        info!("DB query: create_announcement started");

        let result = sqlx::query_as::<_, AnnouncementRow>(
            r#"
            INSERT INTO announcements (
                announcement_id, title, content, category, priority,
                is_published, published_at, created_by, created_at, updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, CASE WHEN $6 THEN NOW() ELSE NULL END, $7, NOW(), NOW())
            RETURNING announcement_id, title, content, category, priority,
                      is_published, published_at, expires_at, created_by,
                      created_at, updated_at
            "#,
        )
        .bind(announcement_id)
        .bind(title)
        .bind(content)
        .bind(category)
        .bind(priority)
        .bind(is_published)
        .bind(created_by)
        .fetch_one(pool)
        .await
        .map_err(|e| {
            warn!("DB error: create_announcement failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: create_announcement completed, id={}", announcement_id);
        Ok(result)
    }
}
