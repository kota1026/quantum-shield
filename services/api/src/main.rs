//! Quantum Shield API Server
//! 
//! Week 2 Implementation: API Layer
//! - Lock API (API-002)
//! - Unlock API (API-003)
//! - Status API (API-004)
//! - Prover API
//! - Edition API (API-006)

use std::net::SocketAddr;
use std::sync::Arc;

use axum::{Router, Extension};
use tower_http::cors::CorsLayer;
use tower_http::trace::TraceLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod config;
mod error;
mod routes;
mod services;
mod types;
mod middleware;

use config::Config;
use services::AppState;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Initialize tracing
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::try_from_default_env()
            .unwrap_or_else(|_| "quantum_shield_api=debug,tower_http=debug".into()))
        .with(tracing_subscriber::fmt::layer())
        .init();

    tracing::info!("Starting Quantum Shield API Server v0.1.0");

    // Load configuration
    let config = Config::load()?;
    tracing::info!("Configuration loaded");

    // Initialize app state
    let state = AppState::new(&config).await?;
    let state = Arc::new(state);

    // Build router
    let app = Router::new()
        .nest("/v1", routes::api_routes())
        .layer(Extension(state))
        .layer(CorsLayer::permissive())
        .layer(TraceLayer::new_for_http());

    // Start server
    let addr: SocketAddr = format!("{}:{}", config.server.host, config.server.port)
        .parse()
        .expect("Invalid server address");

    tracing::info!("Listening on {}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
