//! Aegis Node - L3 quantum-resistant bridge node

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt::init();
    tracing::info!("Starting Aegis Node...");
    Ok(())
}
