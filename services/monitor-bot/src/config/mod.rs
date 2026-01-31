//! Configuration module for Monitor Bot
//!
//! Handles loading configuration from environment variables and config files.

use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};

/// Main configuration for Monitor Bot
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MonitorConfig {
    /// API server URL
    pub api_url: String,
    /// L1 RPC URL for direct contract queries
    pub l1_rpc_url: String,
    /// Poll interval in seconds
    pub poll_interval_secs: u64,
    /// Fraud detection settings
    pub fraud_detection: FraudDetectionConfig,
    /// Risk threshold settings
    pub risk_thresholds: RiskThresholdConfig,
    /// Alert settings
    pub alerts: AlertConfig,
}

impl Default for MonitorConfig {
    fn default() -> Self {
        Self {
            api_url: "http://localhost:3000".to_string(),
            l1_rpc_url: "http://localhost:8545".to_string(),
            poll_interval_secs: 30,
            fraud_detection: FraudDetectionConfig::default(),
            risk_thresholds: RiskThresholdConfig::default(),
            alerts: AlertConfig::default(),
        }
    }
}

impl MonitorConfig {
    /// Load configuration from environment variables
    pub fn from_env() -> Result<Self> {
        let api_url = std::env::var("MONITOR_API_URL")
            .unwrap_or_else(|_| "http://localhost:3000".to_string());

        let l1_rpc_url = std::env::var("L1_RPC_URL")
            .unwrap_or_else(|_| "http://localhost:8545".to_string());

        let poll_interval_secs: u64 = std::env::var("POLL_INTERVAL_SECS")
            .unwrap_or_else(|_| "30".to_string())
            .parse()
            .context("Invalid POLL_INTERVAL_SECS")?;

        let alerts = AlertConfig::from_env()?;

        Ok(Self {
            api_url,
            l1_rpc_url,
            poll_interval_secs,
            fraud_detection: FraudDetectionConfig::default(),
            risk_thresholds: RiskThresholdConfig::default(),
            alerts,
        })
    }
}

/// Fraud detection configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FraudDetectionConfig {
    /// Enable pattern analysis
    pub pattern_analysis_enabled: bool,
    /// Large amount threshold (in ETH)
    pub large_amount_threshold_eth: f64,
    /// New account threshold (days)
    pub new_account_threshold_days: u32,
    /// Rapid unlock threshold (unlocks per day)
    pub rapid_unlock_threshold: u32,
    /// Enable address blocklist checking
    pub blocklist_enabled: bool,
}

impl Default for FraudDetectionConfig {
    fn default() -> Self {
        Self {
            pattern_analysis_enabled: true,
            large_amount_threshold_eth: 10.0,
            new_account_threshold_days: 30,
            rapid_unlock_threshold: 3,
            blocklist_enabled: true,
        }
    }
}

/// Risk threshold configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RiskThresholdConfig {
    /// Score threshold for warning alert (0-100)
    pub warning_threshold: u32,
    /// Score threshold for high alert (0-100)
    pub high_threshold: u32,
    /// Score threshold for critical alert (0-100)
    pub critical_threshold: u32,
    /// Weight for large amount factor
    pub large_amount_weight: u32,
    /// Weight for new account factor
    pub new_account_weight: u32,
    /// Weight for rapid unlock factor
    pub rapid_unlock_weight: u32,
    /// Weight for blocklist match factor
    pub blocklist_weight: u32,
    /// Weight for emergency unlock factor
    pub emergency_weight: u32,
}

impl Default for RiskThresholdConfig {
    fn default() -> Self {
        Self {
            warning_threshold: 40,
            high_threshold: 70,
            critical_threshold: 85,
            large_amount_weight: 30,
            new_account_weight: 25,
            rapid_unlock_weight: 35,
            blocklist_weight: 50,
            emergency_weight: 15,
        }
    }
}

/// Alert configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AlertConfig {
    /// Discord webhook URL
    pub discord_webhook_url: Option<String>,
    /// Slack webhook URL
    pub slack_webhook_url: Option<String>,
    /// Custom webhook URL
    pub custom_webhook_url: Option<String>,
    /// Email notification (SMTP)
    pub email_config: Option<EmailConfig>,
    /// Alert cooldown in seconds (prevent spam)
    pub cooldown_secs: u64,
    /// Minimum alert level
    pub min_alert_level: String,
}

impl Default for AlertConfig {
    fn default() -> Self {
        Self {
            discord_webhook_url: None,
            slack_webhook_url: None,
            custom_webhook_url: None,
            email_config: None,
            cooldown_secs: 300, // 5 minutes
            min_alert_level: "warning".to_string(),
        }
    }
}

impl AlertConfig {
    /// Load from environment variables
    pub fn from_env() -> Result<Self> {
        let discord_webhook_url = std::env::var("DISCORD_WEBHOOK_URL").ok();
        let slack_webhook_url = std::env::var("SLACK_WEBHOOK_URL").ok();
        let custom_webhook_url = std::env::var("CUSTOM_WEBHOOK_URL").ok();

        let cooldown_secs: u64 = std::env::var("ALERT_COOLDOWN_SECS")
            .unwrap_or_else(|_| "300".to_string())
            .parse()
            .unwrap_or(300);

        let min_alert_level = std::env::var("MIN_ALERT_LEVEL")
            .unwrap_or_else(|_| "warning".to_string());

        Ok(Self {
            discord_webhook_url,
            slack_webhook_url,
            custom_webhook_url,
            email_config: None,
            cooldown_secs,
            min_alert_level,
        })
    }

    /// Check if any alert channel is configured
    pub fn has_channels(&self) -> bool {
        self.discord_webhook_url.is_some()
            || self.slack_webhook_url.is_some()
            || self.custom_webhook_url.is_some()
            || self.email_config.is_some()
    }
}

/// Email configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmailConfig {
    /// SMTP server host
    pub smtp_host: String,
    /// SMTP server port
    pub smtp_port: u16,
    /// SMTP username
    pub smtp_username: String,
    /// SMTP password (should be from secret manager)
    pub smtp_password: String,
    /// From address
    pub from_address: String,
    /// To addresses
    pub to_addresses: Vec<String>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_config() {
        let config = MonitorConfig::default();
        assert_eq!(config.poll_interval_secs, 30);
        assert!(config.fraud_detection.pattern_analysis_enabled);
    }

    #[test]
    fn test_risk_threshold_defaults() {
        let thresholds = RiskThresholdConfig::default();
        assert_eq!(thresholds.warning_threshold, 40);
        assert_eq!(thresholds.high_threshold, 70);
        assert_eq!(thresholds.critical_threshold, 85);
    }

    #[test]
    fn test_alert_config_no_channels() {
        let config = AlertConfig::default();
        assert!(!config.has_channels());
    }

    #[test]
    fn test_alert_config_with_discord() {
        let mut config = AlertConfig::default();
        config.discord_webhook_url = Some("https://discord.com/api/webhooks/...".to_string());
        assert!(config.has_channels());
    }
}
