//! L3 → L1 Relayer
//!
//! Multi-Relayer architecture with:
//! - Primary/Secondary failover
//! - Automatic failover on Primary failure
//! - Redis Streams for coordination

mod multi_relayer;
mod primary;
mod secondary;

pub use multi_relayer::MultiRelayer;

use crate::{Config, Result};
use tracing::info;

/// Run the relayer service
pub async fn run(config: &Config) -> Result<()> {
    info!("📤 Starting L3 → L1 Multi-Relayer");
    
    let relayer = MultiRelayer::new(config)?;
    relayer.start().await?;
    
    Ok(())
}
