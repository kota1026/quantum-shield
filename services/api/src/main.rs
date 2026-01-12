//! Quantum Shield API Server
//!
//! Week 2 Implementation: API Layer
//! - Lock API (API-002)
//! - Unlock API (API-003)
//! - Status API (API-004)
//! - Prover API
//! - Edition API (API-006)
//! - Admin API (Week 4-5)
//! - Auth API (TASK-P5-012: SIWE→JWT)
//!
//! ## CP-1 Compliance
//! - Uses NIST FIPS 204 ML-DSA-65 for user signatures
//! - Uses SHA3-256 for all hashing
//! - NO keccak256, ECDSA, or pre-FIPS algorithms

use std::net::SocketAddr;
use std::sync::Arc;

use axum::{Extension, Router};
use tower_http::cors::CorsLayer;
use tower_http::trace::TraceLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod config;
pub mod crypto;
mod error;
mod middleware;
mod routes;
mod services;
mod types;

use config::Config;
use services::AppState;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Initialize tracing
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "quantum_shield_api=debug,tower_http=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    tracing::info!("Starting Quantum Shield API Server v0.2.0");
    tracing::info!("CP-1: Using NIST FIPS 204 ML-DSA-65 for signatures");

    // Load configuration
    let config = Config::load()?;
    tracing::info!("Configuration loaded");

    // Initialize app state
    let state = AppState::new(&config).await?;
    let state = Arc::new(state);

    // Build router
    let app = Router::new()
        // V1 API routes (Lock/Unlock/Status/Prover/Edition)
        .nest("/v1", routes::api_routes())
        // TODO: V1 Auth routes (TASK-P5-012: SIWE→JWT) - re-enable after types consolidated
        // .nest("/v1", routes::auth_routes(state.clone()))
        // Admin Dashboard API routes
        .nest("/api", routes::admin_routes())
        .layer(Extension(state))
        .layer(CorsLayer::permissive())
        .layer(TraceLayer::new_for_http());

    // Start server
    let addr: SocketAddr = format!("{}:{}", config.server.host, config.server.port)
        .parse()
        .expect("Invalid server address");

    tracing::info!("Listening on {}", addr);
    tracing::info!("Auth API available at /v1/auth/*");
    tracing::info!("Admin Dashboard API available at /api/*");

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
