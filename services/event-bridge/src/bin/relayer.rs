//! Standalone L3→L1 Relayer Binary

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

    tracing::info!("📤 Starting Quantum Shield L3→L1 Relayer");

    let config = Config::load()?;
    event_bridge::relayer::run(&config).await?;

    Ok(())
}
