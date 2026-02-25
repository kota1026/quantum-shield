//! Signature Queue Service (API-005)
//!
//! Manages Prover signature requests for Unlock operations.
//! - Receives signature requests from API
//! - Selects Provers via VRF
//! - Collects 2/5 SPHINCS+ signatures
//! - Handles 72h timeout (SEQ#3 Emergency Path trigger)

use std::time::Duration;
use anyhow::Result;
use serde::{Deserialize, Serialize};

mod queue;
mod prover_selector;
mod timeout_handler;

use queue::SignatureQueue;
use prover_selector::ProverSelector;
use timeout_handler::TimeoutHandler;

/// Configuration
#[derive(Debug, Clone)]
pub struct Config {
    pub rabbitmq_url: String,
    pub queue_name: String,
    /// Signature collection timeout (SEQ#3: 72 hours)
    pub timeout_hours: u64,
    /// Required signatures (2 of 5 Provers)
    pub required_signatures: u32,
    pub total_provers: u32,
}

impl Default for Config {
    fn default() -> Self {
        Self {
            rabbitmq_url: "amqp://localhost:5672".to_string(),
            queue_name: "sig_queue".to_string(),
            timeout_hours: 72,  // SEQ#3: 72h Emergency Timeout
            required_signatures: 2,  // 2/5 Prover signatures
            total_provers: 5,
        }
    }
}

/// Signature request from API
#[derive(Debug, Serialize, Deserialize)]
pub struct SignatureRequest {
    pub unlock_id: String,
    pub lock_id: String,
    pub sr_0: String,
    pub sr_1: String,
    pub required_signatures: u32,
    pub timeout_hours: u64,
    pub timestamp: u64,
}

/// Signature response from Prover
#[derive(Debug, Serialize, Deserialize)]
pub struct SignatureResponse {
    pub unlock_id: String,
    pub prover_id: String,
    pub signature: Vec<u8>,  // SPHINCS+ signature (8KB)
    pub timestamp: u64,
}

#[tokio::main]
async fn main() -> Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter("sig_queue=debug")
        .init();

    tracing::info!("Starting Signature Queue Service v0.1.0");

    let config = Config::default();
    
    // Initialize components
    let queue = SignatureQueue::new(&config).await?;
    let selector = ProverSelector::new(&config);
    let timeout_handler = TimeoutHandler::new(&config);

    tracing::info!("Signature Queue Service initialized");
    tracing::info!("  - Required signatures: {}/{}", config.required_signatures, config.total_provers);
    tracing::info!("  - Timeout: {}h", config.timeout_hours);

    // Run main processing loop
    tokio::select! {
        result = queue.process_loop(&selector) => {
            if let Err(e) = result {
                tracing::error!("Queue processing error: {}", e);
            }
        }
        result = timeout_handler.run() => {
            if let Err(e) = result {
                tracing::error!("Timeout handler error: {}", e);
            }
        }
    }

    Ok(())
}
