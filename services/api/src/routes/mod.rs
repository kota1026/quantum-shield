//! API routes module

use axum::{Router, routing::{get, post}};

mod lock;
mod unlock;
mod status;
mod prover;
mod edition;
mod health;

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
}
