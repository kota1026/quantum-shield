//! Monitor Bot - 24h Monitoring Service for Quantum Shield
//!
//! TASK-P5-027: Monitor Bot Implementation
//!
//! This service provides:
//! - 24h continuous monitoring of pending unlocks
//! - Fraud detection and risk analysis
//! - Alert notifications (Discord/Slack/Webhook)
//! - Automatic challenge recommendation
//!
//! Spec References:
//! - SEQUENCES §2 Unlock Flow (24h timelock)
//! - SEQUENCES §4 Challenge + Slashing
//! - UNIFIED_SPEC §Monitoring

use std::sync::Arc;

use anyhow::Result;
use tokio::sync::RwLock;
use tracing::{error, info};

mod alerts;
mod analysis;
mod config;
mod detectors;
mod monitors;
mod types;

use alerts::AlertManager;
use analysis::RiskAnalyzer;
use config::MonitorConfig;
use detectors::FraudDetector;
use monitors::UnlockMonitor;
use types::{MonitorState, PendingUnlock};

/// Monitor Bot Application
pub struct MonitorBot {
    config: MonitorConfig,
    state: Arc<RwLock<MonitorState>>,
    unlock_monitor: UnlockMonitor,
    fraud_detector: FraudDetector,
    risk_analyzer: RiskAnalyzer,
    alert_manager: AlertManager,
}

impl MonitorBot {
    /// Create a new MonitorBot instance
    pub async fn new(config: MonitorConfig) -> Result<Self> {
        let state = Arc::new(RwLock::new(MonitorState::default()));

        let unlock_monitor = UnlockMonitor::new(
            config.api_url.clone(),
            config.l1_rpc_url.clone(),
            config.poll_interval_secs,
        );

        let fraud_detector = FraudDetector::new(config.fraud_detection.clone());
        let risk_analyzer = RiskAnalyzer::new(config.risk_thresholds.clone());
        let alert_manager = AlertManager::new(config.alerts.clone()).await?;

        Ok(Self {
            config,
            state,
            unlock_monitor,
            fraud_detector,
            risk_analyzer,
            alert_manager,
        })
    }

    /// Run the monitoring bot
    pub async fn run(&self) -> Result<()> {
        info!("Starting Monitor Bot v{}", env!("CARGO_PKG_VERSION"));
        info!("API URL: {}", self.config.api_url);
        info!("Poll interval: {}s", self.config.poll_interval_secs);

        // Spawn monitoring tasks
        let monitor_handle = self.spawn_unlock_monitor();
        let detector_handle = self.spawn_fraud_detector();
        let metrics_handle = self.spawn_metrics_reporter();

        // Wait for all tasks
        tokio::select! {
            result = monitor_handle => {
                error!("Unlock monitor task exited: {:?}", result);
            }
            result = detector_handle => {
                error!("Fraud detector task exited: {:?}", result);
            }
            result = metrics_handle => {
                error!("Metrics reporter task exited: {:?}", result);
            }
        }

        Ok(())
    }

    /// Spawn the unlock monitoring task
    fn spawn_unlock_monitor(&self) -> tokio::task::JoinHandle<Result<()>> {
        let monitor = self.unlock_monitor.clone();
        let state = self.state.clone();
        let fraud_detector = self.fraud_detector.clone();
        let risk_analyzer = self.risk_analyzer.clone();
        let alert_manager = self.alert_manager.clone();

        tokio::spawn(async move {
            loop {
                match monitor.fetch_pending_unlocks().await {
                    Ok(unlocks) => {
                        info!("Fetched {} pending unlocks", unlocks.len());

                        // Update state
                        {
                            let mut state = state.write().await;
                            state.pending_unlocks = unlocks.clone();
                            state.last_poll_time = chrono::Utc::now();
                        }

                        // Analyze each unlock
                        for unlock in unlocks {
                            // Check for fraud indicators
                            if let Some(fraud_result) =
                                fraud_detector.analyze(&unlock).await
                            {
                                // Calculate risk score
                                let risk_score = risk_analyzer.calculate_score(&unlock, &fraud_result);

                                // Send alert if high risk
                                if risk_score.score >= 70 {
                                    if let Err(e) = alert_manager
                                        .send_high_risk_alert(&unlock, &risk_score)
                                        .await
                                    {
                                        error!("Failed to send alert: {}", e);
                                    }
                                }
                            }
                        }
                    }
                    Err(e) => {
                        error!("Failed to fetch pending unlocks: {}", e);
                    }
                }

                tokio::time::sleep(tokio::time::Duration::from_secs(
                    monitor.poll_interval_secs,
                ))
                .await;
            }
        })
    }

    /// Spawn the fraud detection task
    fn spawn_fraud_detector(&self) -> tokio::task::JoinHandle<Result<()>> {
        let state = self.state.clone();
        let fraud_detector = self.fraud_detector.clone();
        let alert_manager = self.alert_manager.clone();

        tokio::spawn(async move {
            loop {
                // Check for suspicious patterns
                let unlocks = {
                    let state = state.read().await;
                    state.pending_unlocks.clone()
                };

                for unlock in unlocks {
                    if let Some(result) = fraud_detector.deep_analyze(&unlock).await {
                        if result.is_critical {
                            if let Err(e) = alert_manager
                                .send_critical_alert(&unlock, &result)
                                .await
                            {
                                error!("Failed to send critical alert: {}", e);
                            }
                        }
                    }
                }

                // Deep analysis runs less frequently
                tokio::time::sleep(tokio::time::Duration::from_secs(60)).await;
            }
        })
    }

    /// Spawn the metrics reporting task
    fn spawn_metrics_reporter(&self) -> tokio::task::JoinHandle<Result<()>> {
        let state = self.state.clone();

        tokio::spawn(async move {
            loop {
                let state = state.read().await;
                info!(
                    "Metrics: pending_unlocks={}, high_risk={}, alerts_sent={}",
                    state.pending_unlocks.len(),
                    state.high_risk_count,
                    state.alerts_sent
                );
                drop(state);

                tokio::time::sleep(tokio::time::Duration::from_secs(300)).await;
            }
        })
    }
}

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize logging
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::from_default_env()
                .add_directive(tracing::Level::INFO.into()),
        )
        .init();

    info!("Quantum Shield Monitor Bot starting...");

    // Load configuration
    dotenvy::dotenv().ok();
    let config = MonitorConfig::from_env()?;

    // Create and run bot
    let bot = MonitorBot::new(config).await?;
    bot.run().await
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_monitor_bot_creation() {
        let config = MonitorConfig::default();
        let bot = MonitorBot::new(config).await;
        assert!(bot.is_ok());
    }
}
