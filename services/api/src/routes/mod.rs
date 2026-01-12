//! API routes module

use axum::{middleware, Router, routing::{get, post}};
use std::sync::Arc;

mod lock;
mod unlock;
mod status;
mod prover;
mod edition;
mod health;
mod admin;
<<<<<<< HEAD
mod challenge;
=======
mod auth;

use crate::middleware::jwt_auth;
use crate::services::AppState;
>>>>>>> origin/claude/implement-task-p5-012-CoGF1

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
        // Prover API
        .route("/prover/register", post(prover::register_prover))
        .route("/prover/:prover_id", get(prover::get_prover_info))
        // Edition API (API-006)
        .route("/edition", get(edition::get_edition))
        .route("/edition/switch", post(edition::switch_edition))
        // Challenge API (SEQUENCES §4)
        .route("/challenge", post(challenge::submit_challenge))
        .route("/challenge/:lock_id", get(challenge::get_challenge))
        .route("/challenge/:lock_id/defense", post(challenge::submit_defense))
        .route("/challenge/:lock_id/auto-resolve", post(challenge::auto_resolve))
}

/// Authentication routes (TASK-P5-012: SIWE→JWT)
/// POST /v1/auth/siwe - SIWE authentication (public)
/// POST /v1/auth/refresh - Refresh access token (public)
/// GET /v1/auth/me - Get current user (protected)
pub fn auth_routes(state: Arc<AppState>) -> Router {
    Router::new()
        // Public endpoints (no auth required)
        .route("/auth/siwe", post(auth::siwe_authenticate))
        .route("/auth/refresh", post(auth::refresh_token))
        // Protected endpoint (requires JWT)
        .route(
            "/auth/me",
            get(auth::get_current_user)
                .layer(middleware::from_fn_with_state(state.clone(), jwt_auth)),
        )
        .with_state(state)
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
