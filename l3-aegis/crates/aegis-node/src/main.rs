//! # aegis-node
//!
//! Main binary for the L3 Aegis node.
//!
//! ## Overview
//!
//! This binary provides:
//! - Node initialization and lifecycle management
//! - PBFT consensus participation
//! - P2P networking
//! - RPC server for external queries
//!
//! ## CP-1 Compliance
//!
//! All cryptographic operations use:
//! - SHA3-256 (FIPS 202) for hashing
//! - Dilithium-III (FIPS 204) for signatures
//!
//! ## Usage
//!
//! ```bash
//! # Start node with default config
//! aegis-node --config config.toml
//!
//! # Start in dev mode (single node)
//! aegis-node --dev
//! ```

mod config;
mod node;

use clap::Parser;
use tracing::{info, error};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

pub use config::NodeConfig;
pub use node::AegisNode;

/// L3 Aegis Node - Quantum-resistant bridge layer
#[derive(Parser, Debug)]
#[command(name = "aegis-node")]
#[command(version, about, long_about = None)]
struct Cli {
    /// Path to configuration file
    #[arg(short, long, default_value = "config.toml")]
    config: String,

    /// Run in development mode (single node)
    #[arg(long)]
    dev: bool,

    /// Data directory
    #[arg(short, long, default_value = "./data")]
    data_dir: String,

    /// Log level (trace, debug, info, warn, error)
    #[arg(long, default_value = "info")]
    log_level: String,

    /// Enable JSON logging
    #[arg(long)]
    json_logs: bool,

    /// RPC server port
    #[arg(long, default_value = "8545")]
    rpc_port: u16,

    /// P2P listen port
    #[arg(long, default_value = "30303")]
    p2p_port: u16,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let cli = Cli::parse();

    // Initialize logging
    init_logging(&cli.log_level, cli.json_logs)?;

    info!(
        version = env!("CARGO_PKG_VERSION"),
        dev_mode = cli.dev,
        "Starting L3 Aegis Node"
    );

    // Load configuration
    let config = if cli.dev {
        info!("Running in development mode");
        NodeConfig::dev()
    } else {
        NodeConfig::from_file(&cli.config)?
    };

    // Override config with CLI arguments
    let config = config
        .with_data_dir(&cli.data_dir)
        .with_rpc_port(cli.rpc_port)
        .with_p2p_port(cli.p2p_port);

    // Create and start node
    let node = AegisNode::new(config).await?;
    
    info!("Node initialized, starting services...");
    
    // Run until shutdown signal
    match node.run().await {
        Ok(()) => {
            info!("Node shut down gracefully");
            Ok(())
        }
        Err(e) => {
            error!(error = %e, "Node error");
            Err(e)
        }
    }
}

fn init_logging(level: &str, json: bool) -> anyhow::Result<()> {
    let filter = tracing_subscriber::EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| tracing_subscriber::EnvFilter::new(level));

    let subscriber = tracing_subscriber::registry().with(filter);

    if json {
        subscriber
            .with(tracing_subscriber::fmt::layer().json())
            .init();
    } else {
        subscriber
            .with(tracing_subscriber::fmt::layer())
            .init();
    }

    Ok(())
}
