//! Council repository for database operations
//!
//! Security Council member and action management.
//! Tables: council_members, council_actions, council_action_signatures
//! Follows BE-001~003 rules

use bigdecimal::BigDecimal;
use chrono::{DateTime, Utc};
use serde_json::Value as JsonValue;
use sqlx::{FromRow, PgPool};
use tracing::{debug, info, instrument, warn};

use crate::error::ApiError;

// ============================================================================
// Council Models
// ============================================================================

#[derive(Debug, Clone, FromRow)]
pub struct SecurityCouncilMemberRow {
    pub member_id: String,
    pub wallet_address: String,
    pub name: Option<String>,
    pub role: String,
    pub voting_power: BigDecimal,
    pub status: String,
    pub joined_at: DateTime<Utc>,
    pub last_active: Option<DateTime<Utc>>,
}

impl SecurityCouncilMemberRow {
    /// Derive whether the member is active from the status column.
    pub fn is_active(&self) -> bool {
        self.status == "active"
    }
}

#[derive(Debug, Clone, FromRow)]
pub struct CouncilActionRow {
    pub action_id: String,
    pub action_type: String,
    pub proposer: String,
    pub proposed_at: DateTime<Utc>,
    pub expires_at: DateTime<Utc>,
    pub signature_count: i32,
    pub required_signatures: i32,
    pub state: String,
    pub action_data: Option<JsonValue>,
    pub raw_data: Option<String>,
    pub executed_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, FromRow)]
pub struct CouncilSignatureRow {
    pub id: i32,
    pub action_id: String,
    pub signer_address: String,
    pub signer_seat_id: i32,
    pub signed_at: DateTime<Utc>,
}

// ============================================================================
// Council Repository
// ============================================================================

pub struct CouncilRepository;

impl CouncilRepository {
    // ========================================================================
    // Member Operations
    // ========================================================================

    /// List all council members
    /// BE-001: Real DB operation (no stubs)
    /// BE-003: Mandatory logging
    #[instrument(skip(pool))]
    pub async fn list_members(pool: &PgPool) -> Result<Vec<SecurityCouncilMemberRow>, ApiError> {
        info!("DB query: list_council_members started");

        let results = sqlx::query_as::<_, SecurityCouncilMemberRow>(
            r#"
            SELECT member_id, wallet_address, name, role, voting_power, status,
                   joined_at, last_active
            FROM council_members
            ORDER BY joined_at ASC
            "#,
        )
        .fetch_all(pool)
        .await
        .map_err(|e| {
            warn!("DB error: list_council_members failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: list_council_members completed, count={}", results.len());
        Ok(results)
    }

    /// Get council member by wallet address
    /// BE-001: Real DB operation (no stubs)
    /// BE-003: Mandatory logging
    #[instrument(skip(pool))]
    pub async fn get_member_by_address(
        pool: &PgPool,
        address: &str,
    ) -> Result<Option<SecurityCouncilMemberRow>, ApiError> {
        info!("DB query: get_council_member_by_address started, address={}", address);

        let result = sqlx::query_as::<_, SecurityCouncilMemberRow>(
            r#"
            SELECT member_id, wallet_address, name, role, voting_power, status,
                   joined_at, last_active
            FROM council_members
            WHERE wallet_address = $1
            "#,
        )
        .bind(address)
        .fetch_optional(pool)
        .await
        .map_err(|e| {
            warn!("DB error: get_council_member_by_address failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!(
            "DB query: get_council_member_by_address completed, found={}",
            result.is_some()
        );
        Ok(result)
    }

    // ========================================================================
    // Action Operations
    // ========================================================================

    /// List council actions with optional state filter and pagination
    /// BE-001: Real DB operation (no stubs)
    /// BE-003: Mandatory logging
    #[instrument(skip(pool), fields(state = ?state, offset = offset, limit = limit))]
    pub async fn list_actions(
        pool: &PgPool,
        state: Option<&str>,
        offset: i64,
        limit: i64,
    ) -> Result<Vec<CouncilActionRow>, ApiError> {
        info!("DB query: list_council_actions started");

        let results = sqlx::query_as::<_, CouncilActionRow>(
            r#"
            SELECT action_id, action_type, proposer, proposed_at, expires_at,
                   signature_count, required_signatures, state, action_data,
                   raw_data, executed_at
            FROM council_actions
            WHERE ($1::TEXT IS NULL OR state = $1)
            ORDER BY proposed_at DESC
            OFFSET $2 LIMIT $3
            "#,
        )
        .bind(state)
        .bind(offset)
        .bind(limit)
        .fetch_all(pool)
        .await
        .map_err(|e| {
            warn!("DB error: list_council_actions failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: list_council_actions completed, count={}", results.len());
        Ok(results)
    }

    /// Get a single council action by ID
    /// BE-001: Real DB operation (no stubs)
    /// BE-003: Mandatory logging
    #[instrument(skip(pool))]
    pub async fn get_action_by_id(
        pool: &PgPool,
        action_id: &str,
    ) -> Result<Option<CouncilActionRow>, ApiError> {
        info!("DB query: get_council_action_by_id started, action_id={}", action_id);

        let result = sqlx::query_as::<_, CouncilActionRow>(
            r#"
            SELECT action_id, action_type, proposer, proposed_at, expires_at,
                   signature_count, required_signatures, state, action_data,
                   raw_data, executed_at
            FROM council_actions
            WHERE action_id = $1
            "#,
        )
        .bind(action_id)
        .fetch_optional(pool)
        .await
        .map_err(|e| {
            warn!("DB error: get_council_action_by_id failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!(
            "DB query: get_council_action_by_id completed, found={}",
            result.is_some()
        );
        Ok(result)
    }

    /// Create a new council action
    /// BE-001: Real DB operation (no stubs)
    /// BE-003: Mandatory logging
    #[instrument(skip(pool, action_data, raw_data))]
    pub async fn create_action(
        pool: &PgPool,
        action_id: &str,
        action_type: &str,
        proposer: &str,
        expires_at: DateTime<Utc>,
        required_signatures: i32,
        action_data: Option<&JsonValue>,
        raw_data: Option<&str>,
    ) -> Result<(), ApiError> {
        info!(
            "DB insert: create_council_action started, action_id={}, type={}",
            action_id, action_type
        );

        sqlx::query(
            r#"
            INSERT INTO council_actions
                (action_id, action_type, proposer, expires_at, required_signatures,
                 action_data, raw_data, state, signature_count)
            VALUES ($1, $2, $3, $4, $5, $6, $7, 'proposed', 0)
            ON CONFLICT (action_id) DO NOTHING
            "#,
        )
        .bind(action_id)
        .bind(action_type)
        .bind(proposer)
        .bind(expires_at)
        .bind(required_signatures)
        .bind(action_data)
        .bind(raw_data)
        .execute(pool)
        .await
        .map_err(|e| {
            warn!("DB error: create_council_action failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        debug!(
            "DB insert: create_council_action completed, action_id={}",
            action_id
        );
        Ok(())
    }

    // ========================================================================
    // Signature Operations
    // ========================================================================

    /// Get all signatures for an action
    /// BE-001: Real DB operation (no stubs)
    /// BE-003: Mandatory logging
    #[instrument(skip(pool))]
    pub async fn get_action_signatures(
        pool: &PgPool,
        action_id: &str,
    ) -> Result<Vec<CouncilSignatureRow>, ApiError> {
        info!(
            "DB query: get_council_action_signatures started, action_id={}",
            action_id
        );

        let results = sqlx::query_as::<_, CouncilSignatureRow>(
            r#"
            SELECT id, action_id, signer_address, signer_seat_id, signed_at
            FROM council_action_signatures
            WHERE action_id = $1
            ORDER BY signed_at ASC
            "#,
        )
        .bind(action_id)
        .fetch_all(pool)
        .await
        .map_err(|e| {
            warn!("DB error: get_council_action_signatures failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!(
            "DB query: get_council_action_signatures completed, count={}",
            results.len()
        );
        Ok(results)
    }

    /// Add a signature to an action and increment the action's signature_count.
    /// Returns the new signature_count after the insert.
    /// BE-001: Real DB operation (no stubs)
    /// BE-003: Mandatory logging
    #[instrument(skip(pool))]
    pub async fn add_signature(
        pool: &PgPool,
        action_id: &str,
        signer_address: &str,
        signer_seat_id: i32,
    ) -> Result<i32, ApiError> {
        info!(
            "DB insert: add_council_signature started, action_id={}, signer={}",
            action_id, signer_address
        );

        // Insert signature row
        sqlx::query(
            r#"
            INSERT INTO council_action_signatures (action_id, signer_address, signer_seat_id)
            VALUES ($1, $2, $3)
            "#,
        )
        .bind(action_id)
        .bind(signer_address)
        .bind(signer_seat_id)
        .execute(pool)
        .await
        .map_err(|e| {
            warn!("DB error: add_council_signature insert failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        // Increment signature_count on the action and return the new value
        let new_count: i32 = sqlx::query_scalar::<_, i32>(
            r#"
            UPDATE council_actions
            SET signature_count = signature_count + 1
            WHERE action_id = $1
            RETURNING signature_count
            "#,
        )
        .bind(action_id)
        .fetch_one(pool)
        .await
        .map_err(|e| {
            warn!("DB error: add_council_signature update count failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!(
            "DB insert: add_council_signature completed, action_id={}, new_count={}",
            action_id, new_count
        );
        Ok(new_count)
    }

    // ========================================================================
    // State Management
    // ========================================================================

    /// Update the state of an action (e.g. proposed -> executed)
    /// BE-001: Real DB operation (no stubs)
    /// BE-003: Mandatory logging
    #[instrument(skip(pool))]
    pub async fn update_action_state(
        pool: &PgPool,
        action_id: &str,
        state: &str,
    ) -> Result<(), ApiError> {
        info!(
            "DB update: update_council_action_state started, action_id={}, state={}",
            action_id, state
        );

        let executed_at = if state == "executed" {
            Some(Utc::now())
        } else {
            None
        };

        sqlx::query(
            r#"
            UPDATE council_actions
            SET state = $2,
                executed_at = COALESCE($3, executed_at)
            WHERE action_id = $1
            "#,
        )
        .bind(action_id)
        .bind(state)
        .bind(executed_at)
        .execute(pool)
        .await
        .map_err(|e| {
            warn!("DB error: update_council_action_state failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        debug!(
            "DB update: update_council_action_state completed, action_id={}",
            action_id
        );
        Ok(())
    }

    // ========================================================================
    // Count / Aggregate Operations
    // ========================================================================

    /// Count council actions with optional state filter
    /// BE-001: Real DB operation (no stubs)
    /// BE-003: Mandatory logging
    #[instrument(skip(pool), fields(state = ?state))]
    pub async fn count_actions(
        pool: &PgPool,
        state: Option<&str>,
    ) -> Result<i64, ApiError> {
        info!("DB query: count_council_actions started");

        let count: i64 = sqlx::query_scalar::<_, i64>(
            r#"
            SELECT COUNT(*)
            FROM council_actions
            WHERE ($1::TEXT IS NULL OR state = $1)
            "#,
        )
        .bind(state)
        .fetch_one(pool)
        .await
        .map_err(|e| {
            warn!("DB error: count_council_actions failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: count_council_actions completed, count={}", count);
        Ok(count)
    }

    /// Count how many distinct actions a member has signed
    /// Used by get_members to populate actions_participated
    /// BE-001: Real DB operation (no stubs)
    /// BE-003: Mandatory logging
    #[instrument(skip(pool))]
    pub async fn count_member_signatures(
        pool: &PgPool,
        signer_address: &str,
    ) -> Result<i64, ApiError> {
        info!(
            "DB query: count_member_signatures started, signer={}",
            signer_address
        );

        let count: i64 = sqlx::query_scalar::<_, i64>(
            r#"
            SELECT COUNT(DISTINCT action_id)
            FROM council_action_signatures
            WHERE signer_address = $1
            "#,
        )
        .bind(signer_address)
        .fetch_one(pool)
        .await
        .map_err(|e| {
            warn!("DB error: count_member_signatures failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!(
            "DB query: count_member_signatures completed, signer={}, count={}",
            signer_address, count
        );
        Ok(count)
    }
}
