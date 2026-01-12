//! API routes module

use axum::{Router, routing::{get, post}};

mod lock;
mod unlock;
mod status;
mod prover;
mod edition;
mod health;
mod admin;
mod challenge;
mod governance;

pub fn api_routes() -> Router {
    Router::new()
        // Health check
        .route("/health", get(health::health_check))
        // Lock API (API-002)
        .route("/lock", post(lock::create_lock))
        // Unlock API (API-003)
        .route("/unlock", post(unlock::create_unlock))
        .route("/unlock/emergency", post(unlock::create_emergency_unlock))
        // Status API (API-004)
        .route("/status/:lock_id", get(status::get_lock_status))
        .route("/status/pending", get(status::get_pending_unlocks))
        // Prover API (basic)
        .route("/prover/register", post(prover::register_prover))
        .route("/prover/:prover_id", get(prover::get_prover_info))
        // Prover Portal API (TASK-P5-022)
        .route("/prover/:prover_id/dashboard", get(prover::get_prover_dashboard))
        .route("/prover/:prover_id/queue", get(prover::get_signing_queue))
        .route("/prover/:prover_id/queue/:queue_id", get(prover::get_queue_item))
        .route("/prover/:prover_id/sign", post(prover::submit_signature))
        .route("/prover/:prover_id/metrics", get(prover::get_prover_metrics))
        .route("/prover/:prover_id/alerts", get(prover::get_prover_alerts))
        .route("/prover/:prover_id/challenges", get(prover::get_prover_challenges))
        .route("/prover/:prover_id/challenge-response", post(prover::submit_challenge_response))
        .route("/prover/:prover_id/exit", post(prover::initiate_prover_exit))
        // Edition API (API-006)
        .route("/edition", get(edition::get_edition))
        .route("/edition/switch", post(edition::switch_edition))
        // Challenge API (SEQUENCES §4)
        .route("/challenge", post(challenge::submit_challenge))
        .route("/challenge/:lock_id", get(challenge::get_challenge))
        .route("/challenge/:lock_id/defense", post(challenge::submit_defense))
        .route("/challenge/:lock_id/auto-resolve", post(challenge::auto_resolve))
        // Governance API (TASK-P5-023)
        .route("/governance/dashboard", get(governance::get_dashboard))
        .route("/governance/proposals", get(governance::list_proposals))
        .route("/governance/proposals/:id", get(governance::get_proposal))
        .route("/governance/proposals", post(governance::create_proposal))
        .route("/governance/vote", post(governance::submit_vote))
        .route("/governance/votes/:id", get(governance::get_vote))
        .route("/governance/activity", get(governance::get_activity))
        .route("/governance/council", get(governance::get_council))
}

/// Admin Dashboard API routes (/api/*)
pub fn admin_routes() -> Router {
    Router::new()
        // Prover Management
        .route("/provers", get(admin::list_provers))
        .route("/provers/register", post(admin::register_prover))
        .route("/provers/:id/approve", post(admin::approve_prover))
        .route("/provers/:id/reject", post(admin::reject_prover))
        .route("/provers/:id/suspend", post(admin::suspend_prover))
        // Provider Management
        .route("/providers", get(admin::list_providers))
        .route("/providers/register", post(admin::register_provider))
        // System Status
        .route("/system/status", get(admin::get_system_status))
        .route("/system/pause", post(admin::pause_system))
        .route("/system/unpause", post(admin::unpause_system))
        // Analytics
        .route("/analytics/overview", get(admin::get_analytics_overview))
        // Edition
        .route("/edition/current", get(admin::get_current_edition))
        .route("/edition/switch", post(admin::switch_edition))
}
