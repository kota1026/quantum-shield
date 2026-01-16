//! Standalone L1 Event Indexer Binary

use event_bridge::{Config, Result};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

#[tokio::main]
async fn main() -> Result<()> {
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::new(
            std::env::var("RUST_LOG").unwrap_or_else(|_| "info".into()),
        ))
        .with(tracing_subscriber::fmt::layer())
        .init();

    tracing::info!("🔍 Starting Quantum Shield L1 Event Indexer");

    let config = Config::load()?;
    event_bridge::indexer::run(&config).await?;

    Ok(())
}
