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

    // ========================================================================
    // Admin Governance Operations (Phase 8-C)
    // ========================================================================

    /// Execute a passed proposal
    /// BE-001: Real DB operation
    /// BE-003: Mandatory logging
    #[instrument(skip(pool), fields(proposal_id = %proposal_id))]
    pub async fn execute_proposal(
        pool: &PgPool,
        proposal_id: &str,
        executor: &str,
        tx_hash: Option<&str>,
    ) -> Result<ProposalRow, ApiError> {
        info!("DB query: execute_proposal started");

        let result = sqlx::query_as::<_, ProposalRow>(
            r#"
            UPDATE proposals
            SET status = 'executed',
                executed_by = $2,
                executed_tx_hash = $3,
                executed_at = NOW()
            WHERE proposal_id = $1 AND status = 'passed'
            RETURNING proposal_id, title, description, proposer, status,
                      votes_for, votes_against, votes_abstain, quorum,
                      start_time, end_time, created_at
            "#,
        )
        .bind(proposal_id)
        .bind(executor)
        .bind(tx_hash)
        .fetch_one(pool)
        .await
        .map_err(|e| {
            warn!("DB error: execute_proposal failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: execute_proposal completed");
        Ok(result)
    }

    /// Get security council members
    /// BE-001: Real DB operation
    /// BE-003: Mandatory logging
    #[instrument(skip(pool))]
    pub async fn get_council_members(
        pool: &PgPool,
    ) -> Result<Vec<CouncilMemberRow>, ApiError> {
        info!("DB query: get_council_members started");

        let results = sqlx::query_as::<_, CouncilMemberRow>(
            r#"
            SELECT member_id, wallet_address, name, role, voting_power,
                   status, joined_at, last_active
            FROM council_members
            WHERE status = 'active'
            ORDER BY voting_power DESC
            "#,
        )
        .fetch_all(pool)
        .await
        .map_err(|e| {
            warn!("DB error: get_council_members failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: get_council_members completed, count={}", results.len());
        Ok(results)
    }

    /// List all votes across proposals
    /// BE-001: Real DB operation
    /// BE-003: Mandatory logging
    #[instrument(skip(pool))]
    pub async fn list_all_votes(
        pool: &PgPool,
        offset: i64,
        limit: i64,
    ) -> Result<Vec<VoteWithProposalRow>, ApiError> {
        info!("DB query: list_all_votes started");

        let results = sqlx::query_as::<_, VoteWithProposalRow>(
            r#"
            SELECT v.vote_id, v.proposal_id, p.title as proposal_title,
                   v.voter, v.support, v.weight, v.l1_tx_hash, v.voted_at
            FROM votes v
            JOIN proposals p ON v.proposal_id = p.proposal_id
            ORDER BY v.voted_at DESC
            OFFSET $1 LIMIT $2
            "#,
        )
        .bind(offset)
        .bind(limit)
        .fetch_all(pool)
        .await
        .map_err(|e| {
            warn!("DB error: list_all_votes failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

        info!("DB query: list_all_votes completed, count={}", results.len());
        Ok(results)
    }

    /// Count all votes
    #[instrument(skip(pool))]
    pub async fn count_all_votes(pool: &PgPool) -> Result<i64, ApiError> {
        info!("DB query: count_all_votes started");

        let count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM votes")
            .fetch_one(pool)
            .await
            .map_err(|e| {
                warn!("DB error: count_all_votes failed: {}", e);
                ApiError::Internal(format!("Database error: {}", e))
            })?
            .unwrap_or(0);

        info!("DB query: count_all_votes completed, count={}", count);
        Ok(count)
    }
}

// ============================================================================
// Additional Governance Models (Phase 8-C)
// ============================================================================

#[derive(Debug, Clone, FromRow)]
pub struct CouncilMemberRow {
    pub member_id: String,
    pub wallet_address: String,
    pub name: Option<String>,
    pub role: String,
    pub voting_power: BigDecimal,
    pub status: String,
    pub joined_at: DateTime<Utc>,
    pub last_active: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, FromRow)]
pub struct VoteWithProposalRow {
    pub vote_id: String,
    pub proposal_id: String,
    pub proposal_title: String,
    pub voter: String,
    pub support: i16,
    pub weight: BigDecimal,
    pub l1_tx_hash: Option<String>,
    pub voted_at: DateTime<Utc>,
}
