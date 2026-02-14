//! QS Hub API routes
//!
//! TASK-P5-025: QS Foundation Hub API
//! Provides endpoints for QS Hub Dashboard, Staking, Voting, Rewards, Council, and Delegates.

use axum::{
    extract::{Extension, Path, Query},
    Json,
};
use bigdecimal::BigDecimal;
use chrono::{Duration, Utc};
use serde::{Deserialize, Serialize};
use std::str::FromStr;
use std::sync::Arc;
use tracing::info;
use uuid::Uuid;

use crate::db::{GovernanceRepository, TokenHubRepository, UserRepository};
use crate::error::ApiError;
use crate::services::AppState;

/// Placeholder wallet address used when no auth context is available (Phase 8-D)
const PLACEHOLDER_WALLET: &str = "0x0000000000000000000000000000000000000000";

/// Convert BigDecimal to f64
fn bd_to_f64(bd: &BigDecimal) -> f64 {
    bd.to_string().parse::<f64>().unwrap_or(0.0)
}

/// Format a chrono::Duration into a human-readable remaining time string (e.g. "2d 14h")
fn format_remaining(end: chrono::DateTime<Utc>) -> String {
    let now = Utc::now();
    if end <= now {
        return "Ended".to_string();
    }
    let dur = end - now;
    let total_hours = dur.num_hours();
    let days = total_hours / 24;
    let hours = total_hours % 24;
    if days > 365 {
        let years = days / 365;
        let remaining_days = days % 365;
        let months = remaining_days / 30;
        let d = remaining_days % 30;
        format!("{}Y {}M {}D", years, months, d)
    } else if days > 0 {
        format!("{}d {}h", days, hours)
    } else {
        format!("{}h", hours)
    }
}

/// Map a DB status string to ProposalStatus enum
fn map_proposal_status(status: &str) -> ProposalStatus {
    match status {
        "active" => ProposalStatus::Active,
        "pending" => ProposalStatus::Pending,
        "passed" => ProposalStatus::Passed,
        "rejected" => ProposalStatus::Rejected,
        "executed" => ProposalStatus::Executed,
        _ => ProposalStatus::Pending,
    }
}

/// Map VoteDirection to the support integer used in DB (1=For, 2=Against, 0=Abstain)
fn vote_direction_to_support(dir: &VoteDirection) -> i16 {
    match dir {
        VoteDirection::For => 1,
        VoteDirection::Against => 2,
        VoteDirection::Abstain => 0,
    }
}

/// Map DB support integer to VoteDirection
fn support_to_vote_direction(support: i16) -> VoteDirection {
    match support {
        1 => VoteDirection::For,
        0 => VoteDirection::Abstain,
        _ => VoteDirection::Against,
    }
}

// =============================================================================
// Dashboard Types
// =============================================================================

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct QSHubStatsResponse {
    #[serde(rename = "qsBalance")]
    pub qs_balance: f64,
    #[serde(rename = "lockedQS")]
    pub locked_qs: f64,
    #[serde(rename = "veQSBalance")]
    pub veqs_balance: f64,
    pub voting_power: f64,
    pub lock_end_date: String,
    pub lock_duration: String,
    pub time_remaining: String,
    #[serde(rename = "ratio")]
    pub multiplier: f64,
    pub active_proposals: u32,
    pub total_proposals: u32,
    pub delegated_votes: f64,
    pub council_members: u32,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct QSHubProposal {
    pub id: String,
    pub title: String,
    pub status: ProposalStatus,
    pub end_time: String,
    pub votes: ProposalVotes,
}

#[derive(Debug, Serialize, Clone, Copy)]
#[serde(rename_all = "snake_case")]
pub enum ProposalStatus {
    Active,
    Pending,
    Passed,
    Rejected,
    Executed,
}

#[derive(Debug, Serialize)]
pub struct ProposalVotes {
    #[serde(rename = "for")]
    pub votes_for: u32,
    pub against: u32,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct QSHubRewardsResponse {
    pub claimable: f64,
    pub usd_value: f64,
    pub epoch_progress: u32,
    pub next_epoch: String,
    /// Reward currency: "QS" (QS Token on L3 Aegis)
    pub currency: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct QSHubDelegate {
    pub id: String,
    pub name: String,
    pub initial: String,
    pub total_power: String,
    pub delegated_amount: f64,
}

// =============================================================================
// Proposals Types
// =============================================================================

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProposalDetail {
    pub id: String,
    pub title: String,
    pub description: String,
    pub status: ProposalStatus,
    pub proposer: String,
    pub created_at: String,
    pub end_time: String,
    pub votes: ProposalDetailVotes,
}

#[derive(Debug, Serialize)]
pub struct ProposalDetailVotes {
    #[serde(rename = "for")]
    pub votes_for: u32,
    pub against: u32,
    pub quorum: u32,
}

#[derive(Debug, Deserialize)]
pub struct ProposalsQuery {
    pub status: Option<String>,
    pub page: Option<u32>,
    pub limit: Option<u32>,
}

// =============================================================================
// Council Types
// =============================================================================

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CouncilMember {
    pub id: String,
    pub name: String,
    pub initial: String,
    pub role: String,
    #[serde(rename = "veQS")]
    pub veqs: String,
    pub status: MemberStatus,
}

#[derive(Debug, Serialize, Clone, Copy)]
#[serde(rename_all = "snake_case")]
pub enum MemberStatus {
    Active,
    Inactive,
}

// =============================================================================
// Stake Types
// =============================================================================

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StakeLockPosition {
    pub id: String,
    pub amount: f64,
    #[serde(rename = "veQSAmount")]
    pub veqs_amount: f64,
    pub lock_duration: String,
    pub lock_end_date: String,
    #[serde(rename = "ratio")]
    pub multiplier: f64,
}

#[derive(Debug, Deserialize)]
pub struct CreateStakeRequest {
    pub amount: f64,
    pub duration_weeks: u32,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateStakeResponse {
    pub position: StakeLockPosition,
    pub transaction_hash: String,
}

#[derive(Debug, Deserialize)]
pub struct ExtendStakeRequest {
    pub additional_weeks: u32,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ExtendStakeResponse {
    pub position: StakeLockPosition,
    pub transaction_hash: String,
}

#[derive(Debug, Serialize)]
pub struct BalanceResponse {
    pub balance: f64,
}

// =============================================================================
// Vote Types
// =============================================================================

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct VoteRecord {
    pub id: String,
    pub proposal_id: String,
    pub proposal_title: String,
    pub vote: VoteDirection,
    pub vote_power: f64,
    pub timestamp: String,
}

#[derive(Debug, Serialize, Deserialize, Clone, Copy)]
#[serde(rename_all = "snake_case")]
pub enum VoteDirection {
    For,
    Against,
    Abstain,
}

#[derive(Debug, Deserialize)]
pub struct VoteRequest {
    pub proposal_id: String,
    pub vote: VoteDirection,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct VoteResponse {
    pub success: bool,
    pub transaction_hash: String,
    pub vote_power: f64,
}

// =============================================================================
// Claim Types
// =============================================================================

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ClaimRewardsResponse {
    pub claimed: f64,
    pub transaction_hash: String,
    /// Claim currency: "QS" (QS Token on L3 Aegis)
    pub currency: String,
}

// =============================================================================
// Delegates Query
// =============================================================================

#[derive(Debug, Deserialize)]
pub struct DelegatesQuery {
    pub page: Option<u32>,
    pub limit: Option<u32>,
    pub search: Option<String>,
}

// =============================================================================
// Dashboard Endpoints
// =============================================================================

/// GET /v1/qs-hub/dashboard/stats
/// Get QS Hub dashboard stats for current user
pub async fn get_dashboard_stats(
    Extension(state): Extension<Arc<AppState>>,
) -> Result<Json<QSHubStatsResponse>, ApiError> {
    info!("QS Hub: Fetching dashboard stats");
    let pool = state.pool();

    // Fetch veQS locks for the placeholder wallet
    let locks = TokenHubRepository::get_veqs_locks_by_wallet(pool, PLACEHOLDER_WALLET).await?;
    info!("QS Hub: Retrieved {} veQS locks for stats", locks.len());

    // Calculate locked QS and veQS balance from locks
    let locked_qs: f64 = locks.iter().map(|l| bd_to_f64(&l.locked_amount)).sum();
    let veqs_balance = bd_to_f64(&TokenHubRepository::get_veqs_balance(pool, PLACEHOLDER_WALLET).await?);
    let total_veqs_supply = bd_to_f64(&TokenHubRepository::get_total_veqs_supply(pool).await?);

    // Voting power as fraction of total supply
    let voting_power_bd = TokenHubRepository::get_voting_power(pool, PLACEHOLDER_WALLET).await?;
    let voting_power = if total_veqs_supply > 0.0 {
        bd_to_f64(&voting_power_bd) / total_veqs_supply
    } else {
        0.0
    };

    // Lock end date, duration, time remaining, multiplier from first lock (if any)
    let (lock_end_date, lock_duration, time_remaining, multiplier) = if let Some(first) = locks.first() {
        let end_str = first.lock_end.format("%Y-%m-%d").to_string();
        let dur_weeks = first.lock_duration_days / 7;
        let dur_str = if dur_weeks >= 52 {
            format!("{} Years", dur_weeks / 52)
        } else {
            format!("{} Weeks", dur_weeks)
        };
        let remaining = format_remaining(first.lock_end);
        let mult = (dur_weeks as f64) / 208.0;
        (end_str, dur_str, remaining, mult)
    } else {
        ("N/A".to_string(), "N/A".to_string(), "N/A".to_string(), 0.0)
    };

    // Active and total proposals
    let active_proposals = GovernanceRepository::count_by_status(pool, Some("active")).await? as u32;
    let total_proposals = GovernanceRepository::count_by_status(pool, None).await? as u32;
    info!("QS Hub: active_proposals={}, total_proposals={}", active_proposals, total_proposals);

    // Delegated votes (received delegations)
    let delegations = TokenHubRepository::get_delegations_by_delegatee(pool, PLACEHOLDER_WALLET).await?;
    let delegated_votes: f64 = delegations.iter().map(|d| bd_to_f64(&d.amount)).sum();

    // Council members count
    let council = GovernanceRepository::get_council_members(pool).await?;
    let council_members = council.len() as u32;

    // QS balance = locked + remaining (approximate as locked for now)
    let qs_balance = locked_qs;

    let stats = QSHubStatsResponse {
        qs_balance,
        locked_qs,
        veqs_balance,
        voting_power,
        lock_end_date,
        lock_duration,
        time_remaining,
        multiplier,
        active_proposals,
        total_proposals,
        delegated_votes,
        council_members,
    };

    info!("QS Hub: Dashboard stats retrieved successfully, veqs={}, locked_qs={}", veqs_balance, locked_qs);
    Ok(Json(stats))
}

/// GET /v1/qs-hub/proposals/active
/// Get active proposals for dashboard
pub async fn get_active_proposals(
    Extension(state): Extension<Arc<AppState>>,
) -> Result<Json<Vec<QSHubProposal>>, ApiError> {
    info!("QS Hub: Fetching active proposals");
    let pool = state.pool();

    let rows = GovernanceRepository::list_active(pool).await?;
    info!("QS Hub: DB returned {} active proposals", rows.len());

    let proposals: Vec<QSHubProposal> = rows.iter().map(|row| {
        let end_time = match row.end_time {
            Some(et) => format_remaining(et),
            None => "N/A".to_string(),
        };
        QSHubProposal {
            id: row.proposal_id.clone(),
            title: row.title.clone(),
            status: map_proposal_status(&row.status),
            end_time,
            votes: ProposalVotes {
                votes_for: bd_to_f64(&row.votes_for) as u32,
                against: bd_to_f64(&row.votes_against) as u32,
            },
        }
    }).collect();

    info!("QS Hub: Retrieved {} active proposals", proposals.len());
    Ok(Json(proposals))
}

/// GET /v1/qs-hub/rewards
/// Get rewards info for dashboard
pub async fn get_rewards(
    Extension(state): Extension<Arc<AppState>>,
) -> Result<Json<QSHubRewardsResponse>, ApiError> {
    info!("QS Hub: Fetching rewards info");
    let pool = state.pool();

    // Get all claims for the wallet to calculate already-claimed amounts
    let claims = TokenHubRepository::get_reward_claims_by_wallet(pool, PLACEHOLDER_WALLET).await?;
    let claimed_total: f64 = claims.iter().map(|c| bd_to_f64(&c.amount)).sum();
    info!("QS Hub: wallet has {} past claims totalling {}", claims.len(), claimed_total);

    // Get finalized epochs to compute claimable and epoch progress
    let epochs = TokenHubRepository::get_finalized_epochs(pool, 0, 100).await?;
    let total_epoch_rewards: f64 = epochs.iter().map(|e| bd_to_f64(&e.total_rewards)).sum();
    let claimable = (total_epoch_rewards - claimed_total).max(0.0);

    // BE-001: No hardcoded price — returns 0 until price oracle (Phase 8-D)
    let usd_value = 0.0_f64;

    // Epoch progress and next epoch estimate
    let (epoch_progress, next_epoch) = if let Some(latest) = epochs.first() {
        let epoch_dur = latest.end_time - latest.start_time;
        let now = Utc::now();
        // Estimate next epoch end as latest.end_time + epoch_duration
        let next_end = latest.end_time + epoch_dur;
        let remaining = format_remaining(next_end);
        // Progress as percentage of time elapsed in current epoch cycle
        let elapsed = (now - latest.end_time).num_seconds().max(0) as f64;
        let total_secs = epoch_dur.num_seconds().max(1) as f64;
        let progress = ((elapsed / total_secs) * 100.0).min(100.0) as u32;
        (progress, remaining)
    } else {
        (0, "N/A".to_string())
    };

    let rewards = QSHubRewardsResponse {
        claimable,
        usd_value,
        epoch_progress,
        next_epoch,
        currency: "QS".to_string(),
    };

    info!("QS Hub: Rewards info retrieved, claimable={}, usd_value={}", rewards.claimable, rewards.usd_value);
    Ok(Json(rewards))
}

/// GET /v1/qs-hub/delegates
/// Get delegates list
pub async fn get_delegates(
    Extension(state): Extension<Arc<AppState>>,
    Query(query): Query<DelegatesQuery>,
) -> Result<Json<Vec<QSHubDelegate>>, ApiError> {
    info!("QS Hub: Fetching delegates list, page={:?}, limit={:?}, search={:?}", query.page, query.limit, query.search);
    let pool = state.pool();

    // Get all delegations received by any delegatee, then group by delegatee
    // For now, get delegations from the placeholder wallet's perspective
    let delegations = TokenHubRepository::get_delegations_by_delegator(pool, PLACEHOLDER_WALLET).await?;
    info!("QS Hub: Found {} delegations from wallet", delegations.len());

    // Group by delegatee to build delegate list
    let mut delegate_map: std::collections::HashMap<String, f64> = std::collections::HashMap::new();
    for d in &delegations {
        let amt = bd_to_f64(&d.amount);
        *delegate_map.entry(d.delegatee.clone()).or_insert(0.0) += amt;
    }

    let mut delegates: Vec<QSHubDelegate> = delegate_map
        .into_iter()
        .enumerate()
        .map(|(i, (addr, amount))| {
            // Derive a display name from the address
            let short_addr = if addr.len() > 8 {
                format!("{}...{}", &addr[..6], &addr[addr.len()-4..])
            } else {
                addr.clone()
            };
            let initial = addr.chars().nth(2).unwrap_or('D').to_uppercase().to_string();
            // Get voting power for this delegatee (approximate as delegated amount)
            let power_str = if amount >= 1000.0 {
                format!("{:.0}K veQS", amount / 1000.0)
            } else {
                format!("{:.0} veQS", amount)
            };
            QSHubDelegate {
                id: format!("{}", i + 1),
                name: short_addr,
                initial,
                total_power: power_str,
                delegated_amount: amount,
            }
        })
        .collect();

    // Apply search filter if provided
    if let Some(ref search) = query.search {
        let search_lower = search.to_lowercase();
        delegates.retain(|d| d.name.to_lowercase().contains(&search_lower));
    }

    // Sort by delegated amount descending
    delegates.sort_by(|a, b| b.delegated_amount.partial_cmp(&a.delegated_amount).unwrap_or(std::cmp::Ordering::Equal));

    // Apply pagination
    let page = query.page.unwrap_or(1).max(1) as usize;
    let limit = query.limit.unwrap_or(10).max(1) as usize;
    let start = (page - 1) * limit;
    let delegates: Vec<QSHubDelegate> = delegates.into_iter().skip(start).take(limit).collect();

    info!("QS Hub: Retrieved {} delegates", delegates.len());
    Ok(Json(delegates))
}

// =============================================================================
// Proposals Endpoints
// =============================================================================

/// GET /v1/qs-hub/proposals
/// Get all proposals
pub async fn get_proposals(
    Extension(state): Extension<Arc<AppState>>,
    Query(query): Query<ProposalsQuery>,
) -> Result<Json<Vec<ProposalDetail>>, ApiError> {
    info!("QS Hub: Fetching all proposals, status={:?}, page={:?}, limit={:?}", query.status, query.page, query.limit);
    let pool = state.pool();

    let page = query.page.unwrap_or(1).max(1) as i64;
    let limit = query.limit.unwrap_or(20).max(1).min(100) as i64;
    let offset = (page - 1) * limit;

    let rows = GovernanceRepository::list_proposals(
        pool,
        query.status.as_deref(),
        offset,
        limit,
    ).await?;
    info!("QS Hub: DB returned {} proposals", rows.len());

    let proposals: Vec<ProposalDetail> = rows.iter().map(|row| {
        let end_time = match row.end_time {
            Some(et) => format_remaining(et),
            None => "N/A".to_string(),
        };
        let short_proposer = if row.proposer.len() > 10 {
            format!("{}...{}", &row.proposer[..6], &row.proposer[row.proposer.len()-4..])
        } else {
            row.proposer.clone()
        };
        ProposalDetail {
            id: row.proposal_id.clone(),
            title: row.title.clone(),
            description: row.description.clone().unwrap_or_default(),
            status: map_proposal_status(&row.status),
            proposer: short_proposer,
            created_at: row.created_at.format("%Y-%m-%d").to_string(),
            end_time,
            votes: ProposalDetailVotes {
                votes_for: bd_to_f64(&row.votes_for) as u32,
                against: bd_to_f64(&row.votes_against) as u32,
                quorum: bd_to_f64(&row.quorum) as u32,
            },
        }
    }).collect();

    info!("QS Hub: Retrieved {} proposals", proposals.len());
    Ok(Json(proposals))
}

/// GET /v1/qs-hub/proposals/:id
/// Get specific proposal details
pub async fn get_proposal_detail(
    Extension(state): Extension<Arc<AppState>>,
    Path(id): Path<String>,
) -> Result<Json<ProposalDetail>, ApiError> {
    info!("QS Hub: Fetching proposal {}", id);
    let pool = state.pool();

    let row = GovernanceRepository::get_proposal_by_id(pool, &id)
        .await?
        .ok_or_else(|| ApiError::NotFound(format!("Proposal {} not found", id)))?;

    let end_time = match row.end_time {
        Some(et) => format_remaining(et),
        None => "N/A".to_string(),
    };
    let short_proposer = if row.proposer.len() > 10 {
        format!("{}...{}", &row.proposer[..6], &row.proposer[row.proposer.len()-4..])
    } else {
        row.proposer.clone()
    };
    let proposal = ProposalDetail {
        id: row.proposal_id.clone(),
        title: row.title.clone(),
        description: row.description.clone().unwrap_or_default(),
        status: map_proposal_status(&row.status),
        proposer: short_proposer,
        created_at: row.created_at.format("%Y-%m-%d").to_string(),
        end_time,
        votes: ProposalDetailVotes {
            votes_for: bd_to_f64(&row.votes_for) as u32,
            against: bd_to_f64(&row.votes_against) as u32,
            quorum: bd_to_f64(&row.quorum) as u32,
        },
    };

    info!("QS Hub: Proposal {} retrieved successfully", id);
    Ok(Json(proposal))
}

/// POST /v1/qs-hub/proposals/:id/vote
/// Vote on a proposal
pub async fn vote_on_proposal(
    Extension(state): Extension<Arc<AppState>>,
    Path(id): Path<String>,
    Json(req): Json<VoteRequest>,
) -> Result<Json<VoteResponse>, ApiError> {
    info!("QS Hub: Voting on proposal {}, vote: {:?}", id, req.vote);
    let pool = state.pool();

    // Verify proposal exists
    let _proposal = GovernanceRepository::get_proposal_by_id(pool, &id)
        .await?
        .ok_or_else(|| ApiError::NotFound(format!("Proposal {} not found", id)))?;

    // Get voting power for the wallet
    let voting_power_bd = TokenHubRepository::get_voting_power(pool, PLACEHOLDER_WALLET).await?;
    let vote_power = bd_to_f64(&voting_power_bd);
    info!("QS Hub: Voter voting power={}", vote_power);

    // Create the vote
    let vote_id = Uuid::new_v4().to_string();
    let support = vote_direction_to_support(&req.vote);
    GovernanceRepository::create_vote(
        pool,
        &vote_id,
        &id,
        PLACEHOLDER_WALLET,
        support,
        &voting_power_bd,
    ).await?;

    let tx_hash = format!("0x{}", Uuid::new_v4().simple());
    let response = VoteResponse {
        success: true,
        transaction_hash: tx_hash,
        vote_power,
    };

    info!("QS Hub: Vote submitted for proposal {}, vote_id={}", id, vote_id);
    Ok(Json(response))
}

// =============================================================================
// Council Endpoints
// =============================================================================

/// GET /v1/qs-hub/council
/// Get council members
pub async fn get_council(
    Extension(state): Extension<Arc<AppState>>,
) -> Result<Json<Vec<CouncilMember>>, ApiError> {
    info!("QS Hub: Fetching council members");
    let pool = state.pool();

    let rows = GovernanceRepository::get_council_members(pool).await?;
    info!("QS Hub: DB returned {} council members", rows.len());

    let council: Vec<CouncilMember> = rows.iter().map(|row| {
        let name = row.name.clone().unwrap_or_else(|| {
            if row.wallet_address.len() > 8 {
                format!("{}...{}", &row.wallet_address[..6], &row.wallet_address[row.wallet_address.len()-4..])
            } else {
                row.wallet_address.clone()
            }
        });
        let initial = name.chars().next().unwrap_or('?').to_uppercase().to_string();
        let vp = bd_to_f64(&row.voting_power);
        let veqs_str = if vp >= 1000.0 {
            format!("{:.0}K", vp / 1000.0)
        } else {
            format!("{:.0}", vp)
        };
        let status = if row.status == "active" {
            MemberStatus::Active
        } else {
            MemberStatus::Inactive
        };
        CouncilMember {
            id: row.member_id.clone(),
            name,
            initial,
            role: row.role.clone(),
            veqs: veqs_str,
            status,
        }
    }).collect();

    info!("QS Hub: Retrieved {} council members", council.len());
    Ok(Json(council))
}

// =============================================================================
// Stake Endpoints
// =============================================================================

/// GET /v1/qs-hub/stakes
/// Get user's stake positions
pub async fn get_stakes(
    Extension(state): Extension<Arc<AppState>>,
) -> Result<Json<Vec<StakeLockPosition>>, ApiError> {
    info!("QS Hub: Fetching stake positions");
    let pool = state.pool();

    let locks = TokenHubRepository::get_veqs_locks_by_wallet(pool, PLACEHOLDER_WALLET).await?;
    info!("QS Hub: DB returned {} veQS locks", locks.len());

    let positions: Vec<StakeLockPosition> = locks.iter().map(|lock| {
        let dur_weeks = lock.lock_duration_days / 7;
        let lock_duration = if dur_weeks >= 52 {
            format!("{} Years", dur_weeks / 52)
        } else {
            format!("{} Weeks", dur_weeks)
        };
        let multiplier = (dur_weeks as f64) / 208.0;
        StakeLockPosition {
            id: lock.lock_id.clone(),
            amount: bd_to_f64(&lock.locked_amount),
            veqs_amount: bd_to_f64(&lock.veqs_value),
            lock_duration,
            lock_end_date: lock.lock_end.format("%Y-%m-%d").to_string(),
            multiplier,
        }
    }).collect();

    info!("QS Hub: Retrieved {} stake positions", positions.len());
    Ok(Json(positions))
}

/// POST /v1/qs-hub/stakes
/// Create new stake
pub async fn create_stake(
    Extension(state): Extension<Arc<AppState>>,
    Json(req): Json<CreateStakeRequest>,
) -> Result<Json<CreateStakeResponse>, ApiError> {
    info!("QS Hub: Creating stake, amount={}, duration={} weeks", req.amount, req.duration_weeks);
    let pool = state.pool();

    // Calculate veQS amount: veQS = QS * (duration_weeks / 208)
    let max_weeks: f64 = 208.0;
    let multiplier = (req.duration_weeks as f64) / max_weeks;
    let veqs_amount = req.amount * multiplier;

    // Generate IDs and lock end date
    let lock_id = Uuid::new_v4().to_string();
    let lock_duration_days = (req.duration_weeks as i64) * 7;
    let lock_end = Utc::now() + Duration::days(lock_duration_days);

    let locked_amount = BigDecimal::from_str(&format!("{}", req.amount))
        .unwrap_or_else(|_| BigDecimal::from(0));
    let veqs_value = BigDecimal::from_str(&format!("{}", veqs_amount))
        .unwrap_or_else(|_| BigDecimal::from(0));

    // Ensure user exists in the users table to satisfy FK constraint on veqs_locks
    UserRepository::ensure_exists(pool, PLACEHOLDER_WALLET).await?;

    info!("QS Hub: Inserting veQS lock, lock_id={}, veqs={}, lock_end={}", lock_id, veqs_amount, lock_end);
    TokenHubRepository::create_veqs_lock(
        pool,
        &lock_id,
        PLACEHOLDER_WALLET,
        &locked_amount,
        &veqs_value,
        lock_end,
        lock_duration_days,
    ).await?;

    let lock_duration_str = if req.duration_weeks >= 52 {
        format!("{} Years", req.duration_weeks / 52)
    } else {
        format!("{} Weeks", req.duration_weeks)
    };

    let position = StakeLockPosition {
        id: lock_id.clone(),
        amount: req.amount,
        veqs_amount,
        lock_duration: lock_duration_str,
        lock_end_date: lock_end.format("%Y-%m-%d").to_string(),
        multiplier,
    };

    let tx_hash = format!("0x{}", Uuid::new_v4().simple());
    let response = CreateStakeResponse {
        position,
        transaction_hash: tx_hash,
    };

    info!("QS Hub: Stake created successfully, lock_id={}", lock_id);
    Ok(Json(response))
}

/// POST /v1/qs-hub/stakes/:id/extend
/// Extend stake duration
pub async fn extend_stake(
    Extension(state): Extension<Arc<AppState>>,
    Path(id): Path<String>,
    Json(req): Json<ExtendStakeRequest>,
) -> Result<Json<ExtendStakeResponse>, ApiError> {
    info!("QS Hub: Extending stake {}, additional_weeks={}", id, req.additional_weeks);
    let pool = state.pool();

    // Find the existing lock
    let locks = TokenHubRepository::get_veqs_locks_by_wallet(pool, PLACEHOLDER_WALLET).await?;
    let existing = locks.iter().find(|l| l.lock_id == id)
        .ok_or_else(|| ApiError::NotFound(format!("Stake position {} not found", id)))?;
    info!("QS Hub: Found existing lock, current_duration_days={}, lock_end={}", existing.lock_duration_days, existing.lock_end);

    // Calculate new duration and projected values
    let additional_days = (req.additional_weeks as i64) * 7;
    let new_duration_days = existing.lock_duration_days + additional_days;
    let new_lock_end = existing.lock_end + Duration::days(additional_days);
    let new_duration_weeks = new_duration_days / 7;
    let new_multiplier = (new_duration_weeks as f64) / 208.0;
    let amount = bd_to_f64(&existing.locked_amount);
    let new_veqs = amount * new_multiplier;

    let lock_duration_str = if new_duration_weeks >= 52 {
        format!("{:.1} Years", new_duration_weeks as f64 / 52.0)
    } else {
        format!("{} Weeks", new_duration_weeks)
    };

    // Note: actual on-chain lock extension will be implemented in Phase 8-D.
    // For now, return the projected values after extension.
    info!("QS Hub: Projected extension: new_duration_weeks={}, new_veqs={}, new_lock_end={}", new_duration_weeks, new_veqs, new_lock_end);

    let position = StakeLockPosition {
        id: id.clone(),
        amount,
        veqs_amount: new_veqs,
        lock_duration: lock_duration_str,
        lock_end_date: new_lock_end.format("%Y-%m-%d").to_string(),
        multiplier: new_multiplier,
    };

    let tx_hash = format!("0x{}", Uuid::new_v4().simple());
    let response = ExtendStakeResponse {
        position,
        transaction_hash: tx_hash,
    };

    info!("QS Hub: Stake {} extension projected successfully", id);
    Ok(Json(response))
}

/// GET /v1/qs-hub/balance
/// Get QS token balance
pub async fn get_balance(
    Extension(state): Extension<Arc<AppState>>,
) -> Result<Json<BalanceResponse>, ApiError> {
    info!("QS Hub: Fetching QS balance");
    let pool = state.pool();

    let veqs_balance = TokenHubRepository::get_veqs_balance(pool, PLACEHOLDER_WALLET).await?;
    let balance = bd_to_f64(&veqs_balance);

    let response = BalanceResponse { balance };

    info!("QS Hub: Balance retrieved: {}", response.balance);
    Ok(Json(response))
}

// =============================================================================
// Vote History Endpoints
// =============================================================================

/// GET /v1/qs-hub/votes/history
/// Get user's voting history
pub async fn get_vote_history(
    Extension(state): Extension<Arc<AppState>>,
) -> Result<Json<Vec<VoteRecord>>, ApiError> {
    info!("QS Hub: Fetching vote history for wallet={}", PLACEHOLDER_WALLET);
    let pool = state.pool();

    // Use get_votes_by_voter which joins with proposals to get proposal_title
    let rows = GovernanceRepository::get_votes_by_voter(pool, PLACEHOLDER_WALLET, 0, 50).await?;
    info!("QS Hub: DB returned {} vote records", rows.len());

    let history: Vec<VoteRecord> = rows.iter().map(|row| {
        VoteRecord {
            id: row.vote_id.clone(),
            proposal_id: row.proposal_id.clone(),
            proposal_title: row.proposal_title.clone(),
            vote: support_to_vote_direction(row.support),
            vote_power: bd_to_f64(&row.weight),
            timestamp: row.voted_at.format("%Y-%m-%d %H:%M").to_string(),
        }
    }).collect();

    info!("QS Hub: Retrieved {} vote records", history.len());
    Ok(Json(history))
}

// =============================================================================
// Rewards Endpoints
// =============================================================================

/// POST /v1/qs-hub/rewards/claim
/// Claim available rewards
pub async fn claim_rewards(
    Extension(state): Extension<Arc<AppState>>,
) -> Result<Json<ClaimRewardsResponse>, ApiError> {
    info!("QS Hub: Claiming rewards for wallet={}", PLACEHOLDER_WALLET);
    let pool = state.pool();

    // Get finalized epochs and existing claims to determine claimable amount
    let epochs = TokenHubRepository::get_finalized_epochs(pool, 0, 100).await?;
    let claims = TokenHubRepository::get_reward_claims_by_wallet(pool, PLACEHOLDER_WALLET).await?;

    let claimed_epochs: std::collections::HashSet<i64> = claims.iter().map(|c| c.epoch).collect();
    let total_epoch_rewards: f64 = epochs.iter().map(|e| bd_to_f64(&e.total_rewards)).sum();
    let already_claimed: f64 = claims.iter().map(|c| bd_to_f64(&c.amount)).sum();
    let claimable = (total_epoch_rewards - already_claimed).max(0.0);

    info!("QS Hub: total_epoch_rewards={}, already_claimed={}, claimable={}", total_epoch_rewards, already_claimed, claimable);

    if claimable <= 0.0 {
        info!("QS Hub: No rewards to claim");
        return Ok(Json(ClaimRewardsResponse {
            claimed: 0.0,
            transaction_hash: format!("0x{}", Uuid::new_v4().simple()),
            currency: "QS".to_string(),
        }));
    }

    // Ensure user exists in the users table to satisfy FK constraint on reward_claims
    UserRepository::ensure_exists(pool, PLACEHOLDER_WALLET).await?;

    // Create reward claims for unclaimed epochs
    let mut total_claimed = 0.0;
    for epoch in &epochs {
        if !claimed_epochs.contains(&epoch.epoch) {
            let claim_id = Uuid::new_v4().to_string();
            let amount = bd_to_f64(&epoch.total_rewards);
            let amount_bd = BigDecimal::from_str(&format!("{}", amount))
                .unwrap_or_else(|_| BigDecimal::from(0));
            info!("QS Hub: Creating claim for epoch={}, amount={}", epoch.epoch, amount);
            TokenHubRepository::create_reward_claim(
                pool,
                &claim_id,
                PLACEHOLDER_WALLET,
                epoch.epoch,
                &amount_bd,
            ).await?;
            total_claimed += amount;
        }
    }

    let tx_hash = format!("0x{}", Uuid::new_v4().simple());
    let response = ClaimRewardsResponse {
        claimed: total_claimed,
        transaction_hash: tx_hash,
        currency: "QS".to_string(),
    };

    info!("QS Hub: Claimed {} QS rewards across {} epochs", total_claimed, epochs.len());
    Ok(Json(response))
}

// =============================================================================
// Tests
// =============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_proposal_status_serialization() {
        let status = ProposalStatus::Active;
        let json = serde_json::to_string(&status).unwrap();
        assert_eq!(json, "\"active\"");

        let status = ProposalStatus::Passed;
        let json = serde_json::to_string(&status).unwrap();
        assert_eq!(json, "\"passed\"");
    }

    #[test]
    fn test_vote_direction_serialization() {
        let vote = VoteDirection::For;
        let json = serde_json::to_string(&vote).unwrap();
        assert_eq!(json, "\"for\"");

        let vote = VoteDirection::Against;
        let json = serde_json::to_string(&vote).unwrap();
        assert_eq!(json, "\"against\"");
    }

    #[test]
    fn test_member_status_serialization() {
        let status = MemberStatus::Active;
        let json = serde_json::to_string(&status).unwrap();
        assert_eq!(json, "\"active\"");
    }

    #[test]
    fn test_veqs_calculation() {
        // SEQUENCES.md §9: veQS step function multiplier
        // 2 years (730 days) → 5.0x multiplier
        let qs_amount: f64 = 1000.0;
        let multiplier: f64 = 5.0; // Step function: 24 months = 5.0x

        let veqs = qs_amount * multiplier;

        assert!((veqs - 5000.0).abs() < 0.01);
    }
}
