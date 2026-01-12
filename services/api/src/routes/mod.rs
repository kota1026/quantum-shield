//! API routes module

use axum::{Router, routing::{get, post}};

mod lock;
mod unlock;
mod status;
mod prover;
mod edition;
mod health;
mod admin;
mod auth;
mod user;
mod token_hub;
mod challenge;
mod governance;
mod observer;

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
        // Consumer App API (TASK-P5-020)
        .route("/user/dashboard", get(user::get_dashboard))
        .route("/user/transactions", get(user::get_transactions))
        .route("/user/transactions/:id", get(user::get_transaction_detail))
        .route("/user/settings", get(user::get_settings))
        .route("/user/settings", post(user::update_settings))
        .route("/user/keys", get(user::get_keys))
        // Token Hub API (TASK-P5-021) - 9 endpoints
        .route("/token-hub/dashboard", get(token_hub::get_dashboard))
        .route("/token-hub/lock", post(token_hub::create_lock))
        .route("/token-hub/locks", get(token_hub::get_locks))
        .route("/token-hub/extend", post(token_hub::extend_lock))
        .route("/token-hub/delegates", get(token_hub::get_delegates))
        .route("/token-hub/delegate", post(token_hub::delegate_power))
        .route("/token-hub/rewards", get(token_hub::get_rewards))
        .route("/token-hub/claim", post(token_hub::claim_rewards))
        .route("/token-hub/delegations/my", get(token_hub::get_my_delegations))
        // Governance API (TASK-P5-023)
        .route("/governance/dashboard", get(governance::get_dashboard))
        .route("/governance/proposals", get(governance::list_proposals))
        .route("/governance/proposals/:id", get(governance::get_proposal))
        .route("/governance/proposals", post(governance::create_proposal))
        .route("/governance/vote", post(governance::submit_vote))
        .route("/governance/votes/:id", get(governance::get_vote))
        .route("/governance/activity", get(governance::get_activity))
        .route("/governance/council", get(governance::get_council))
        // Observer API (TASK-P5-019) - 8 endpoints
        .route("/observer/dashboard", get(observer::get_dashboard))
        .route("/observer/pending-unlocks", get(observer::get_pending_unlocks))
        .route("/observer/suspicious-txs", get(observer::get_suspicious_txs))
        .route("/observer/history", get(observer::get_history))
        .route("/observer/challenge", post(observer::submit_challenge))
        .route("/observer/challenge/:id", get(observer::get_challenge))
        .route("/observer/earnings", get(observer::get_earnings))
        .route("/observer/claim-earnings", post(observer::claim_earnings))
}

/// Auth API routes (/v1/auth/*)
pub fn auth_routes(_state: std::sync::Arc<crate::services::AppState>) -> Router {
    Router::new()
        .route("/auth/siwe", post(auth::siwe_authenticate))
        .route("/auth/refresh", post(auth::refresh_token))
        .route("/auth/me", get(auth::get_current_user))
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
