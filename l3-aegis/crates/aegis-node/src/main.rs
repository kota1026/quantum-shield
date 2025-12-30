//! # aegis-node
//!
//! Main binary for the L3 Aegis node.
//!
//! ## Usage
//!
//! ```bash
//! # Start in dev mode (single node)
//! aegis-node --dev --single
//! ```

mod config;
mod node;
mod single_node;
mod rpc;

use clap::Parser;
use tracing::{info, error};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

pub use config::NodeConfig;
pub use node::AegisNode;
pub use single_node::{SingleNode, SingleNodeConfig};

/// L3 Aegis Node - Quantum-resistant bridge layer
#[derive(Parser, Debug)]
#[command(name = "aegis-node")]
#[command(version, about, long_about = None)]
struct Cli {
    #[arg(short, long, default_value = "config.toml")]
    config: String,
    #[arg(long)]
    dev: bool,
    #[arg(long)]
    single: bool,
    #[arg(short, long, default_value = "./data")]
    data_dir: String,
    #[arg(long, default_value = "info")]
    log_level: String,
    #[arg(long)]
    json_logs: bool,
    #[arg(long, default_value = "8545")]
    rpc_port: u16,
    #[arg(long, default_value = "30303")]
    p2p_port: u16,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let cli = Cli::parse();
    init_logging(&cli.log_level, cli.json_logs)?;

    info!(version = env!("CARGO_PKG_VERSION"), dev = cli.dev, single = cli.single, "Starting L3 Aegis Node");

    if cli.dev && cli.single {
        info!("Running in single-node development mode");
        return run_single_node(&cli).await;
    }

    let config = if cli.dev { NodeConfig::dev() } else { NodeConfig::from_file(&cli.config)? };
    let config = config.with_data_dir(&cli.data_dir).with_rpc_port(cli.rpc_port).with_p2p_port(cli.p2p_port);
    let node = AegisNode::new(config).await?;
    
    info!("Node initialized, starting services...");
    
    match node.run().await {
        Ok(()) => { info!("Node shut down gracefully"); Ok(()) }
        Err(e) => { error!(error = %e, "Node error"); Err(e) }
    }
}

async fn run_single_node(cli: &Cli) -> anyhow::Result<()> {
    let config = SingleNodeConfig {
        block_interval_ms: 1000, max_txs_per_block: 100, memory_limit_mb: 500,
        data_dir: std::path::PathBuf::from(&cli.data_dir),
    };
    let mut node = SingleNode::new(config)?.with_storage().await?;
    node.start().await?;
    info!(rpc_port = cli.rpc_port, "Single node running. Press Ctrl+C to stop.");
    tokio::signal::ctrl_c().await?;
    info!("Shutting down...");
    node.stop().await?;
    info!("Single node stopped gracefully");
    Ok(())
}

fn init_logging(level: &str, json: bool) -> anyhow::Result<()> {
    let filter = tracing_subscriber::EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| tracing_subscriber::EnvFilter::new(level));
    let subscriber = tracing_subscriber::registry().with(filter);
    if json { subscriber.with(tracing_subscriber::fmt::layer().json()).init(); }
    else { subscriber.with(tracing_subscriber::fmt::layer()).init(); }
    Ok(())
}
