//! Alert System for Monitor Bot
//!
//! TASK-P5-027: Alert notification system
//!
//! Supports:
//! - Discord webhooks
//! - Slack webhooks
//! - Custom webhooks
//! - Email (SMTP)

use std::collections::HashMap;
use std::sync::Arc;
use std::time::{Duration, Instant};

use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use tokio::sync::RwLock;
use tracing::{debug, error, info, warn};
use uuid::Uuid;

use crate::config::AlertConfig;
use crate::types::{AlertMessage, AlertPriority, FraudAnalysisResult, PendingUnlock, RiskScore};

/// Alert Manager handles sending alerts through various channels
#[derive(Debug, Clone)]
pub struct AlertManager {
    config: AlertConfig,
    client: reqwest::Client,
    /// Cooldown tracking (lock_id -> last alert time)
    cooldowns: Arc<RwLock<HashMap<String, Instant>>>,
}

impl AlertManager {
    /// Create a new AlertManager
    pub async fn new(config: AlertConfig) -> Result<Self> {
        let client = reqwest::Client::builder()
            .timeout(Duration::from_secs(30))
            .build()
            .context("Failed to create HTTP client")?;

        Ok(Self {
            config,
            client,
            cooldowns: Arc::new(RwLock::new(HashMap::new())),
        })
    }

    /// Send a high risk alert
    pub async fn send_high_risk_alert(
        &self,
        unlock: &PendingUnlock,
        risk_score: &RiskScore,
    ) -> Result<()> {
        // Check cooldown
        if !self.should_send_alert(&unlock.lock_id).await {
            debug!("Alert cooldown active for lock: {}", unlock.lock_id);
            return Ok(());
        }

        let alert = AlertMessage {
            id: Uuid::new_v4().to_string(),
            priority: AlertPriority::from(risk_score.level),
            title: format!("High Risk Unlock Detected: {}", shorten_hex(&unlock.lock_id)),
            description: format!(
                "Risk Score: {}/100 ({:?})\n\nOwner: {}\nAmount: {} wei\nTime Remaining: {}s\n\nFactors:\n{}",
                risk_score.score,
                risk_score.level,
                unlock.owner,
                unlock.amount,
                unlock.time_remaining,
                format_risk_factors(&risk_score.factors)
            ),
            lock_id: Some(unlock.lock_id.clone()),
            amount: Some(unlock.amount.clone()),
            risk_score: Some(risk_score.score),
            recommended_action: risk_score.summary.clone(),
            timestamp: chrono::Utc::now(),
        };

        self.send_alert(&alert).await?;
        self.update_cooldown(&unlock.lock_id).await;

        Ok(())
    }

    /// Send a critical fraud alert
    pub async fn send_critical_alert(
        &self,
        unlock: &PendingUnlock,
        fraud_result: &FraudAnalysisResult,
    ) -> Result<()> {
        // Critical alerts bypass cooldown but with a shorter window
        if !self.should_send_critical(&unlock.lock_id).await {
            debug!("Critical alert cooldown active for lock: {}", unlock.lock_id);
            return Ok(());
        }

        let alert = AlertMessage {
            id: Uuid::new_v4().to_string(),
            priority: AlertPriority::Critical,
            title: format!(
                "CRITICAL FRAUD ALERT: {}",
                shorten_hex(&unlock.lock_id)
            ),
            description: format!(
                "IMMEDIATE ACTION REQUIRED\n\nLock ID: {}\nOwner: {}\nAmount: {} wei\nTime Remaining: {}s\n\nRisk Factors:\n{}\n\nRecommended: {}",
                unlock.lock_id,
                unlock.owner,
                unlock.amount,
                unlock.time_remaining,
                format_risk_factors(&fraud_result.risk_factors),
                fraud_result.recommended_action
            ),
            lock_id: Some(unlock.lock_id.clone()),
            amount: Some(unlock.amount.clone()),
            risk_score: None,
            recommended_action: fraud_result.recommended_action.clone(),
            timestamp: chrono::Utc::now(),
        };

        self.send_alert(&alert).await?;
        self.update_cooldown(&unlock.lock_id).await;

        Ok(())
    }

    /// Send an alert through all configured channels
    async fn send_alert(&self, alert: &AlertMessage) -> Result<()> {
        info!(
            "Sending {:?} alert: {} - {}",
            alert.priority, alert.id, alert.title
        );

        let mut sent = false;

        // Discord
        if let Some(ref webhook_url) = self.config.discord_webhook_url {
            if let Err(e) = self.send_discord_alert(webhook_url, alert).await {
                error!("Failed to send Discord alert: {}", e);
            } else {
                sent = true;
            }
        }

        // Slack
        if let Some(ref webhook_url) = self.config.slack_webhook_url {
            if let Err(e) = self.send_slack_alert(webhook_url, alert).await {
                error!("Failed to send Slack alert: {}", e);
            } else {
                sent = true;
            }
        }

        // Custom webhook
        if let Some(ref webhook_url) = self.config.custom_webhook_url {
            if let Err(e) = self.send_custom_webhook(webhook_url, alert).await {
                error!("Failed to send custom webhook: {}", e);
            } else {
                sent = true;
            }
        }

        if !sent && !self.config.has_channels() {
            warn!("No alert channels configured - alert not sent: {}", alert.title);
        }

        Ok(())
    }

    /// Send Discord webhook alert
    async fn send_discord_alert(&self, webhook_url: &str, alert: &AlertMessage) -> Result<()> {
        let color = match alert.priority {
            AlertPriority::Info => 0x3498db,     // Blue
            AlertPriority::Warning => 0xf39c12,  // Orange
            AlertPriority::High => 0xe74c3c,    // Red
            AlertPriority::Critical => 0x9b59b6, // Purple
        };

        let payload = serde_json::json!({
            "embeds": [{
                "title": alert.title,
                "description": alert.description,
                "color": color,
                "fields": [
                    {
                        "name": "Priority",
                        "value": format!("{:?}", alert.priority),
                        "inline": true
                    },
                    {
                        "name": "Lock ID",
                        "value": alert.lock_id.as_ref().map(|s| shorten_hex(s)).unwrap_or_else(|| "N/A".to_string()),
                        "inline": true
                    },
                    {
                        "name": "Amount",
                        "value": alert.amount.as_ref().map(|a| format_wei(a)).unwrap_or_else(|| "N/A".to_string()),
                        "inline": true
                    },
                    {
                        "name": "Recommended Action",
                        "value": &alert.recommended_action,
                        "inline": false
                    }
                ],
                "timestamp": alert.timestamp.to_rfc3339()
            }]
        });

        let response = self
            .client
            .post(webhook_url)
            .json(&payload)
            .send()
            .await
            .context("Failed to send Discord webhook")?;

        if !response.status().is_success() {
            let status = response.status();
            let body = response.text().await.unwrap_or_default();
            return Err(anyhow::anyhow!("Discord webhook failed: {} - {}", status, body));
        }

        debug!("Discord alert sent successfully");
        Ok(())
    }

    /// Send Slack webhook alert
    async fn send_slack_alert(&self, webhook_url: &str, alert: &AlertMessage) -> Result<()> {
        let emoji = match alert.priority {
            AlertPriority::Info => ":information_source:",
            AlertPriority::Warning => ":warning:",
            AlertPriority::High => ":rotating_light:",
            AlertPriority::Critical => ":fire:",
        };

        let payload = serde_json::json!({
            "blocks": [
                {
                    "type": "header",
                    "text": {
                        "type": "plain_text",
                        "text": format!("{} {}", emoji, alert.title),
                        "emoji": true
                    }
                },
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": format!("*Priority:* {:?}\n*Lock ID:* `{}`\n*Amount:* {}",
                            alert.priority,
                            alert.lock_id.as_ref().map(|s| shorten_hex(s)).unwrap_or_else(|| "N/A".to_string()),
                            alert.amount.as_ref().map(|a| format_wei(a)).unwrap_or_else(|| "N/A".to_string())
                        )
                    }
                },
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": format!("*Details:*\n{}", alert.description)
                    }
                },
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": format!("*Recommended Action:*\n{}", alert.recommended_action)
                    }
                }
            ]
        });

        let response = self
            .client
            .post(webhook_url)
            .json(&payload)
            .send()
            .await
            .context("Failed to send Slack webhook")?;

        if !response.status().is_success() {
            let status = response.status();
            let body = response.text().await.unwrap_or_default();
            return Err(anyhow::anyhow!("Slack webhook failed: {} - {}", status, body));
        }

        debug!("Slack alert sent successfully");
        Ok(())
    }

    /// Send custom webhook alert
    async fn send_custom_webhook(&self, webhook_url: &str, alert: &AlertMessage) -> Result<()> {
        let response = self
            .client
            .post(webhook_url)
            .json(alert)
            .send()
            .await
            .context("Failed to send custom webhook")?;

        if !response.status().is_success() {
            let status = response.status();
            let body = response.text().await.unwrap_or_default();
            return Err(anyhow::anyhow!("Custom webhook failed: {} - {}", status, body));
        }

        debug!("Custom webhook sent successfully");
        Ok(())
    }

    /// Check if we should send an alert (cooldown check)
    async fn should_send_alert(&self, lock_id: &str) -> bool {
        let cooldowns = self.cooldowns.read().await;
        if let Some(last_alert) = cooldowns.get(lock_id) {
            let elapsed = last_alert.elapsed();
            elapsed >= Duration::from_secs(self.config.cooldown_secs)
        } else {
            true
        }
    }

    /// Check if we should send a critical alert (shorter cooldown)
    async fn should_send_critical(&self, lock_id: &str) -> bool {
        let cooldowns = self.cooldowns.read().await;
        if let Some(last_alert) = cooldowns.get(lock_id) {
            let elapsed = last_alert.elapsed();
            // Critical alerts have 60 second cooldown
            elapsed >= Duration::from_secs(60)
        } else {
            true
        }
    }

    /// Update cooldown for a lock
    async fn update_cooldown(&self, lock_id: &str) {
        let mut cooldowns = self.cooldowns.write().await;
        cooldowns.insert(lock_id.to_string(), Instant::now());
    }
}

// ============================================================================
// Helper Functions
// ============================================================================

/// Shorten a hex string for display
fn shorten_hex(hex: &str) -> String {
    if hex.len() > 16 {
        format!("{}...{}", &hex[..10], &hex[hex.len() - 6..])
    } else {
        hex.to_string()
    }
}

/// Format wei to ETH for display
fn format_wei(wei: &str) -> String {
    let wei_u128: u128 = wei.parse().unwrap_or(0);
    let eth = wei_u128 as f64 / 1e18;
    format!("{:.4} ETH", eth)
}

/// Format risk factors for display
fn format_risk_factors(factors: &[crate::types::RiskFactor]) -> String {
    factors
        .iter()
        .map(|f| format!("- {} ({}): {}", f.name, f.severity, f.description))
        .collect::<Vec<_>>()
        .join("\n")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_shorten_hex() {
        let long = "0x1234567890abcdef1234567890abcdef12345678";
        let short = shorten_hex(long);
        assert!(short.len() < long.len());
        assert!(short.contains("..."));
    }

    #[test]
    fn test_format_wei() {
        assert_eq!(format_wei("1000000000000000000"), "1.0000 ETH");
        assert_eq!(format_wei("500000000000000000"), "0.5000 ETH");
        assert_eq!(format_wei("0"), "0.0000 ETH");
    }

    #[tokio::test]
    async fn test_alert_manager_creation() {
        let config = AlertConfig::default();
        let manager = AlertManager::new(config).await;
        assert!(manager.is_ok());
    }

    #[tokio::test]
    async fn test_cooldown_logic() {
        let config = AlertConfig {
            cooldown_secs: 1, // Short cooldown for testing
            ..Default::default()
        };
        let manager = AlertManager::new(config).await.unwrap();

        // First alert should pass
        assert!(manager.should_send_alert("lock1").await);

        // Update cooldown
        manager.update_cooldown("lock1").await;

        // Immediate check should fail
        assert!(!manager.should_send_alert("lock1").await);

        // After waiting, should pass
        tokio::time::sleep(Duration::from_secs(2)).await;
        assert!(manager.should_send_alert("lock1").await);
    }
}
