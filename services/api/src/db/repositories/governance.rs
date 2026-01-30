//! Governance repository for database operations
//!
//! Phase 8-C: Governance/Proposals management
//! Follows BE-001~003 rules

use bigdecimal::BigDecimal;
use chrono::{DateTime, Utc};
use sqlx::{FromRow, PgPool};
use tracing::{info, instrument, warn};

use crate::error::ApiError;

// ============================================================================
// Governance Models
// ============================================================================

#[derive(Debug, Clone, FromRow)]
pub struct ProposalRow {
    pub proposal_id: String,
    pub title: String,
    pub description: Option<String>,
    pub proposer: String,
    pub status: String,
    pub votes_for: BigDecimal,
    pub votes_against: BigDecimal,
    pub votes_abstain: BigDecimal,
    pub quorum: BigDecimal,
    pub start_time: Option<DateTime<Utc>>,
    pub end_time: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, FromRow)]
pub struct VoteRow {
    pub vote_id: String,
    pub proposal_id: String,
    pub voter: String,
    pub support: i16,
    pub weight: BigDecimal,
    pub l1_tx_hash: Option<String>,
    pub voted_at: DateTime<Utc>,
}

// ============================================================================
// Governance Repository
// ============================================================================

pub struct GovernanceRepository;

impl GovernanceRepository {
    /// Get proposal by ID
    #[instrument(skip(pool))]
    pub async fn get_proposal_by_id(
        pool: &PgPool,
        proposal_id: &str,
    ) -> Result<Option<ProposalRow>, ApiError> {
        info!("DB query: get_proposal_by_id started");

        let result = sqlx::query_as::<_, ProposalRow>(
            r#"
            SELECT proposal_id, title, description, proposer, status,
                   votes_for, votes_against, votes_abstain, quorum,
                   start_time, end_time, created_at
            FROM proposals
            WHERE proposal_id = $1
            "#,
        )
        .bind(proposal_id)
        .fetch_optional(pool)
        .await
        .map_err(|e| {
            warn!("DB error: get_proposal_by_id failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: get_proposal_by_id completed, found={}", result.is_some());
        Ok(result)
    }

    /// List proposals with filtering
    #[instrument(skip(pool))]
    pub async fn list_proposals(
        pool: &PgPool,
        status: Option<&str>,
        offset: i64,
        limit: i64,
    ) -> Result<Vec<ProposalRow>, ApiError> {
        info!("DB query: list_proposals started");

        let results = sqlx::query_as::<_, ProposalRow>(
            r#"
            SELECT proposal_id, title, description, proposer, status,
                   votes_for, votes_against, votes_abstain, quorum,
                   start_time, end_time, created_at
            FROM proposals
            WHERE ($1::TEXT IS NULL OR status = $1)
            ORDER BY created_at DESC
            OFFSET $2 LIMIT $3
            "#,
        )
        .bind(status)
        .bind(offset)
        .bind(limit)
        .fetch_all(pool)
        .await
        .map_err(|e| {
            warn!("DB error: list_proposals failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: list_proposals completed, count={}", results.len());
        Ok(results)
    }

    /// Count proposals by status
    #[instrument(skip(pool))]
    pub async fn count_by_status(
        pool: &PgPool,
        status: Option<&str>,
    ) -> Result<i64, ApiError> {
        info!("DB query: count_proposals_by_status started");

        let count: i64 = sqlx::query_scalar(
            r#"
            SELECT COUNT(*)
            FROM proposals
            WHERE ($1::TEXT IS NULL OR status = $1)
            "#,
        )
        .bind(status)
        .fetch_one(pool)
        .await
        .map_err(|e| {
            warn!("DB error: count_proposals_by_status failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?
        .unwrap_or(0);

        info!("DB query: count_proposals_by_status completed, count={}", count);
        Ok(count)
    }

    /// Get votes for a proposal
    #[instrument(skip(pool))]
    pub async fn list_votes(
        pool: &PgPool,
        proposal_id: &str,
        offset: i64,
        limit: i64,
    ) -> Result<Vec<VoteRow>, ApiError> {
        info!("DB query: list_votes started");

        let results = sqlx::query_as::<_, VoteRow>(
            r#"
            SELECT vote_id, proposal_id, voter, support, weight, l1_tx_hash, voted_at
            FROM votes
            WHERE proposal_id = $1
            ORDER BY voted_at DESC
            OFFSET $2 LIMIT $3
            "#,
        )
        .bind(proposal_id)
        .bind(offset)
        .bind(limit)
        .fetch_all(pool)
        .await
        .map_err(|e| {
            warn!("DB error: list_votes failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: list_votes completed, count={}", results.len());
        Ok(results)
    }

    /// Get active proposals (voting in progress)
    #[instrument(skip(pool))]
    pub async fn list_active(
        pool: &PgPool,
    ) -> Result<Vec<ProposalRow>, ApiError> {
        info!("DB query: list_active_proposals started");

        let results = sqlx::query_as::<_, ProposalRow>(
            r#"
            SELECT proposal_id, title, description, proposer, status,
                   votes_for, votes_against, votes_abstain, quorum,
                   start_time, end_time, created_at
            FROM proposals
            WHERE status = 'active'
              AND end_time > NOW()
            ORDER BY end_time ASC
            "#,
        )
        .fetch_all(pool)
        .await
        .map_err(|e| {
            warn!("DB error: list_active_proposals failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: list_active_proposals completed, count={}", results.len());
        Ok(results)
    }
}
