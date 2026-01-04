//! Event Bridge Service - Main Entry Point

use event_bridge::{Config, Result};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize logging
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::new(
            std::env::var("RUST_LOG").unwrap_or_else(|_| "info".into()),
        ))
        .with(tracing_subscriber::fmt::layer())
        .init();

    tracing::info!("🚀 Starting Quantum Shield Event Bridge Service");

    // Load configuration
    let config = Config::load()?;
    tracing::info!("📋 Configuration loaded");

    // Start metrics server
    let metrics_handle = tokio::spawn(async move {
        event_bridge::metrics::start_metrics_server(9090).await
    });

    // Start indexer and relayer concurrently
    let indexer_handle = tokio::spawn(async move {
        event_bridge::indexer::run(&config).await
    });

    let relayer_handle = tokio::spawn(async move {
        event_bridge::relayer::run(&config).await
    });

    // Wait for all tasks
    tokio::select! {
        r = indexer_handle => {
            tracing::error!("Indexer exited: {:?}", r);
        }
        r = relayer_handle => {
            tracing::error!("Relayer exited: {:?}", r);
        }
        r = metrics_handle => {
            tracing::error!("Metrics server exited: {:?}", r);
        }
    }

    Ok(())
}
