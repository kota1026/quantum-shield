//! System Settings repository for database operations
//!
//! Provides CRUD access to the system_settings table
//! and emergency_pause_history table.
//!
//! Follows BE-001~003 rules:
//! - BE-001: No stub responses - real DB queries
//! - BE-002: No test-specific modifications
//! - BE-003: Mandatory logging

use chrono::{DateTime, Utc};
use sqlx::{FromRow, PgPool};
use tracing::{info, warn, instrument};

use crate::error::ApiError;

// ============================================================================
// Models
// ============================================================================

/// Protocol state stored in system_settings as JSONB
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct ProtocolState {
    pub paused: bool,
    #[serde(default)]
    pub pause_id: Option<String>,
    #[serde(default)]
    pub pause_scope: Option<String>,
    #[serde(default)]
    pub pause_reason: Option<String>,
    #[serde(default)]
    pub paused_at: Option<u64>,
    #[serde(default)]
    pub pause_expires_at: Option<u64>,
    #[serde(default)]
    pub pause_initiated_by: Option<String>,
}

impl Default for ProtocolState {
    fn default() -> Self {
        Self {
            paused: false,
            pause_id: None,
            pause_scope: None,
            pause_reason: None,
            paused_at: None,
            pause_expires_at: None,
            pause_initiated_by: None,
        }
    }
}

/// Emergency pause history row
#[derive(Debug, Clone, FromRow)]
pub struct PauseHistoryRow {
    pub pause_id: String,
    pub reason: String,
    pub scope: String,
    pub paused_at: DateTime<Utc>,
    pub unpaused_at: Option<DateTime<Utc>>,
    pub duration_secs: i64,
    pub was_extended: bool,
    pub initiated_by: String,
}

// ============================================================================
// Repository
// ============================================================================

pub struct SystemRepository;

impl SystemRepository {
    /// Get the current protocol state from system_settings
    #[instrument(skip(pool))]
    pub async fn get_protocol_state(pool: &PgPool) -> Result<ProtocolState, ApiError> {
        info!("DB query: get_protocol_state started");

        let row: Option<(serde_json::Value,)> = sqlx::query_as(
            "SELECT value FROM system_settings WHERE key = 'protocol_state'"
        )
        .fetch_optional(pool)
        .await
        .map_err(|e| {
            warn!("DB error: get_protocol_state failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        let state = match row {
            Some((value,)) => {
                serde_json::from_value(value).unwrap_or_else(|e| {
                    warn!("Failed to parse protocol_state JSON: {}", e);
                    ProtocolState::default()
                })
            }
            None => {
                info!("DB query: protocol_state not found, returning default");
                ProtocolState::default()
            }
        };

        info!("DB query: get_protocol_state completed, paused={}", state.paused);
        Ok(state)
    }

    /// Update the protocol state in system_settings
    #[instrument(skip(pool, state))]
    pub async fn update_protocol_state(
        pool: &PgPool,
        state: &ProtocolState,
        updated_by: &str,
    ) -> Result<(), ApiError> {
        info!("DB update: update_protocol_state started, paused={}", state.paused);

        let value = serde_json::to_value(state)
            .map_err(|e| ApiError::Internal(format!("JSON serialization error: {}", e)))?;

        sqlx::query(
            r#"
            INSERT INTO system_settings (key, value, updated_by, updated_at)
            VALUES ('protocol_state', $1, $2, NOW())
            ON CONFLICT (key) DO UPDATE SET
                value = $1,
                updated_by = $2,
                updated_at = NOW()
            "#,
        )
        .bind(&value)
        .bind(updated_by)
        .execute(pool)
        .await
        .map_err(|e| {
            warn!("DB error: update_protocol_state failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB update: update_protocol_state completed");
        Ok(())
    }

    /// Record a pause event in emergency_pause_history
    #[instrument(skip(pool))]
    pub async fn record_pause(
        pool: &PgPool,
        pause_id: &str,
        reason: &str,
        scope: &str,
        initiated_by: &str,
    ) -> Result<(), ApiError> {
        info!("DB insert: record_pause started, pause_id={}", pause_id);

        sqlx::query(
            r#"
            INSERT INTO emergency_pause_history (pause_id, reason, scope, paused_at, initiated_by)
            VALUES ($1, $2, $3, NOW(), $4)
            ON CONFLICT (pause_id) DO NOTHING
            "#,
        )
        .bind(pause_id)
        .bind(reason)
        .bind(scope)
        .bind(initiated_by)
        .execute(pool)
        .await
        .map_err(|e| {
            warn!("DB error: record_pause failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB insert: record_pause completed, pause_id={}", pause_id);
        Ok(())
    }

    /// Record unpause event
    #[instrument(skip(pool))]
    pub async fn record_unpause(
        pool: &PgPool,
        pause_id: &str,
    ) -> Result<(), ApiError> {
        info!("DB update: record_unpause started, pause_id={}", pause_id);

        sqlx::query(
            r#"
            UPDATE emergency_pause_history
            SET unpaused_at = NOW(),
                duration_secs = EXTRACT(EPOCH FROM (NOW() - paused_at))::BIGINT
            WHERE pause_id = $1
            "#,
        )
        .bind(pause_id)
        .execute(pool)
        .await
        .map_err(|e| {
            warn!("DB error: record_unpause failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB update: record_unpause completed, pause_id={}", pause_id);
        Ok(())
    }

    /// Get recent pause history (for status endpoint)
    #[instrument(skip(pool))]
    pub async fn get_pause_history(
        pool: &PgPool,
        limit: i64,
    ) -> Result<Vec<PauseHistoryRow>, ApiError> {
        info!("DB query: get_pause_history started");

        let rows = sqlx::query_as::<_, PauseHistoryRow>(
            r#"
            SELECT pause_id, reason, scope, paused_at, unpaused_at,
                   duration_secs, was_extended, initiated_by
            FROM emergency_pause_history
            ORDER BY paused_at DESC
            LIMIT $1
            "#,
        )
        .bind(limit)
        .fetch_all(pool)
        .await
        .map_err(|e| {
            warn!("DB error: get_pause_history failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: get_pause_history completed, count={}", rows.len());
        Ok(rows)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_protocol_state_default() {
        let state = ProtocolState::default();
        assert!(!state.paused);
        assert!(state.pause_id.is_none());
        assert!(state.pause_scope.is_none());
    }

    #[test]
    fn test_protocol_state_serialization() {
        let state = ProtocolState {
            paused: true,
            pause_id: Some("PAUSE-001".to_string()),
            pause_scope: Some("full".to_string()),
            pause_reason: Some("Test".to_string()),
            paused_at: Some(1000),
            pause_expires_at: Some(260200),
            pause_initiated_by: Some("0x1234".to_string()),
        };
        let json = serde_json::to_string(&state).unwrap();
        assert!(json.contains("\"paused\":true"));
        assert!(json.contains("\"pause_id\":\"PAUSE-001\""));

        let deserialized: ProtocolState = serde_json::from_str(&json).unwrap();
        assert!(deserialized.paused);
        assert_eq!(deserialized.pause_id, Some("PAUSE-001".to_string()));
    }

    #[test]
    fn test_protocol_state_deserialization_minimal() {
        // The DB initially stores just {"paused": false}
        let json = r#"{"paused": false}"#;
        let state: ProtocolState = serde_json::from_str(json).unwrap();
        assert!(!state.paused);
        assert!(state.pause_id.is_none());
    }
}
