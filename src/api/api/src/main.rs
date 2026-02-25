//! Quantum Shield API Server
//!
//! Week 4 Implementation: Production-ready API layer
//! - Lock/Unlock/Status/Prover/Edition/Challenge APIs
//! - Auth API (SIWE→JWT)
//! - Admin Dashboard API (JWT-protected)
//! - Rate limiting, request tracing, graceful shutdown
//!
//! ## CP-1 Compliance
//! - Uses NIST FIPS 204 ML-DSA-65 for user signatures
//! - Uses SHA3-256 for all hashing
//! - NO keccak256, ECDSA, or pre-FIPS algorithms

use std::net::SocketAddr;
use std::sync::Arc;

use axum::{Extension, Router};
use axum::http::HeaderValue;
use tower_http::cors::{AllowOrigin, CorsLayer};
use tower_http::trace::TraceLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod config;
pub mod crypto;
pub mod db;
mod error;
mod middleware;
mod routes;
mod services;
mod types;

use config::Config;
use middleware::RateLimiter;
use services::AppState;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Load .env file (for QS__L1_PRIVATE_KEY etc.)
    match dotenvy::dotenv() {
        Ok(path) => eprintln!("[STARTUP] Loaded .env from: {:?}", path),
        Err(e) => eprintln!("[STARTUP] No .env file loaded: {}", e),
    }

    // Debug: check if L1 private key is set
    if std::env::var("QS__L1_PRIVATE_KEY").is_ok() {
        eprintln!("[STARTUP] QS__L1_PRIVATE_KEY is SET");
    } else {
        eprintln!("[STARTUP] QS__L1_PRIVATE_KEY is NOT SET");
    }

    // Initialize tracing
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "quantum_shield_api=debug,tower_http=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    tracing::info!("Starting Quantum Shield API Server v{}", env!("CARGO_PKG_VERSION"));
    tracing::info!("CP-1: Using NIST FIPS 204 ML-DSA-65 for signatures");

    // Load configuration
    eprintln!("[STARTUP] Loading configuration...");
    let config = Config::load()?;
    eprintln!("[STARTUP] Config loaded. l1_private_key set: {}", config.l1_private_key.is_some());
    eprintln!("[STARTUP] l1_vault_address: {:?}", config.l1_vault_address);
    eprintln!("[STARTUP] l1_rpc_url: {:?}", config.l1_rpc_url);
    eprintln!("[STARTUP] l1.mode: {}", config.l1.mode);
    tracing::info!("Configuration loaded");

    // Initialize app state
    eprintln!("[STARTUP] Initializing AppState...");
    let state = AppState::new(&config).await?;
    eprintln!("[STARTUP] AppState initialized. l1_vault present: {}", state.l1_vault.is_some());
    let state = Arc::new(state);

    // Build CORS layer from config
    let cors = if config.cors.allowed_origins.iter().any(|o| o == "*") {
        tracing::warn!("CORS: allowing ALL origins (wildcard)");
        CorsLayer::permissive()
    } else {
        let origins: Vec<HeaderValue> = config
            .cors
            .allowed_origins
            .iter()
            .filter_map(|o| o.parse::<HeaderValue>().ok())
            .collect();
        tracing::info!("CORS: allowed origins = {:?}", config.cors.allowed_origins);
        CorsLayer::new()
            .allow_origin(AllowOrigin::list(origins))
            .allow_methods(tower_http::cors::Any)
            .allow_headers(tower_http::cors::Any)
    };

    // Initialize rate limiter
    let rate_limiter = RateLimiter::new(
        config.rate_limit.max_requests,
        config.rate_limit.window_secs,
        config.rate_limit.enabled,
    );
    if config.rate_limit.enabled {
        tracing::info!(
            "Rate limiting: {} req/{} sec per IP",
            config.rate_limit.max_requests,
            config.rate_limit.window_secs
        );
        rate_limiter.clone().start_cleanup_task();
    } else {
        tracing::warn!("Rate limiting: DISABLED");
    }

    // Start auto-claim background service
    let (shutdown_tx, shutdown_rx) = tokio::sync::watch::channel(false);
    eprintln!("[STARTUP] auto_claim.enabled: {}", config.auto_claim.enabled);
    if config.auto_claim.enabled {
        let auto_claim = services::AutoClaimService::new(
            state.clone(),
            config.auto_claim.clone(),
            shutdown_rx.clone(),
        );
        eprintln!("[STARTUP] Spawning auto-claim service (poll_interval={}s)...", config.auto_claim.poll_interval_secs);
        tokio::spawn(async move { auto_claim.run().await });
        tracing::info!(
            "Auto-claim service: enabled, polling every {}s",
            config.auto_claim.poll_interval_secs
        );
    } else {
        eprintln!("[STARTUP] Auto-claim service is DISABLED");
        tracing::warn!("Auto-claim service: DISABLED");
    }

    // Start L1 sync background service
    if config.l1_sync.enabled {
        let l1_sync = services::L1SyncService::new(
            std::sync::Arc::new(state.pool().clone()),
            config.l1_sync.clone(),
            shutdown_rx.clone(),
        );
        tokio::spawn(async move { l1_sync.run().await });
        tracing::info!(
            "L1 Sync service: enabled, polling every {}s",
            config.l1_sync.poll_interval_secs
        );
    } else {
        tracing::warn!("L1 Sync service: DISABLED");
    }

    // Build router
    let app = Router::new()
        // V1 API routes (Lock/Unlock/Status/Prover/Edition)
        .nest("/v1", routes::api_routes())
        // V1 Auth routes (TASK-P5-012: SIWE→JWT)
        .nest("/v1", routes::auth_routes(state.clone()))
        // Admin Dashboard API routes (JWT-protected)
        .nest("/api", routes::admin_routes(state.clone()))
        .layer(Extension(state))
        // Request ID + structured logging (innermost = first executed)
        .layer(axum::middleware::from_fn(middleware::request_id))
        // Rate limiting
        .layer(axum::middleware::from_fn_with_state(rate_limiter, middleware::rate_limit))
        .layer(cors)
        .layer(TraceLayer::new_for_http());

    // Start server with graceful shutdown
    let addr: SocketAddr = format!("{}:{}", config.server.host, config.server.port)
        .parse()
        .expect("Invalid server address");

    tracing::info!("Listening on {}", addr);
    tracing::info!("Auth API available at /v1/auth/*");
    tracing::info!("Admin Dashboard API available at /api/*");

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app.into_make_service_with_connect_info::<SocketAddr>())
        .with_graceful_shutdown(shutdown_signal())
        .await?;

    // Signal background services to stop
    let _ = shutdown_tx.send(true);
    tracing::info!("Shutdown signal sent to background services");

    Ok(())
}

/// Listen for SIGTERM/SIGINT for graceful shutdown in container environments
async fn shutdown_signal() {
    let ctrl_c = async {
        tokio::signal::ctrl_c()
            .await
            .expect("Failed to install Ctrl+C handler");
    };

    #[cfg(unix)]
    let terminate = async {
        tokio::signal::unix::signal(tokio::signal::unix::SignalKind::terminate())
            .expect("Failed to install SIGTERM handler")
            .recv()
            .await;
    };

    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();

    tokio::select! {
        _ = ctrl_c => tracing::info!("Received Ctrl+C, starting graceful shutdown"),
        _ = terminate => tracing::info!("Received SIGTERM, starting graceful shutdown"),
    }
}
