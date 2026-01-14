//! Unlock Monitor - 24h Pending Unlock Surveillance
//!
//! TASK-P5-027: Implements continuous monitoring of pending unlocks.
//!
//! Spec References:
//! - SEQUENCES §2.5: 24h timelock for normal unlocks
//! - SEQUENCES §2.6: 7d timelock for emergency unlocks
//! - UNIFIED_SPEC §Monitoring: Continuous observation requirements

use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use tracing::{debug, error, info, warn};

use crate::types::{PendingUnlock, UnlockType};

/// Response from API for pending unlocks
#[derive(Debug, Deserialize)]
struct PendingUnlocksApiResponse {
    unlocks: Vec<PendingUnlockApiItem>,
    total: u32,
}

#[derive(Debug, Deserialize)]
struct PendingUnlockApiItem {
    #[serde(rename = "lockId")]
    lock_id: String,
    owner: String,
    amount: String,
    token: String,
    #[serde(rename = "unlockType")]
    unlock_type: String,
    #[serde(rename = "unlockRequestedAt")]
    unlock_requested_at: u64,
    #[serde(rename = "timeRemaining")]
    time_remaining: u64,
    #[serde(rename = "riskIndicators", default)]
    risk_indicators: Vec<String>,
}

impl From<PendingUnlockApiItem> for PendingUnlock {
    fn from(item: PendingUnlockApiItem) -> Self {
        let unlock_type = match item.unlock_type.as_str() {
            "emergency" => UnlockType::Emergency,
            _ => UnlockType::Normal,
        };

        PendingUnlock {
            lock_id: item.lock_id,
            owner: item.owner,
            amount: item.amount,
            token: item.token,
            unlock_type,
            unlock_requested_at: item.unlock_requested_at,
            time_remaining: item.time_remaining,
            risk_indicators: item.risk_indicators,
        }
    }
}

/// Unlock Monitor for tracking pending unlocks
#[derive(Debug, Clone)]
pub struct UnlockMonitor {
    /// API URL for fetching pending unlocks
    api_url: String,
    /// L1 RPC URL for direct contract queries
    l1_rpc_url: String,
    /// HTTP client
    client: reqwest::Client,
    /// Poll interval in seconds
    pub poll_interval_secs: u64,
}

impl UnlockMonitor {
    /// Create a new UnlockMonitor
    pub fn new(api_url: String, l1_rpc_url: String, poll_interval_secs: u64) -> Self {
        let client = reqwest::Client::builder()
            .timeout(std::time::Duration::from_secs(30))
            .build()
            .expect("Failed to create HTTP client");

        Self {
            api_url,
            l1_rpc_url,
            client,
            poll_interval_secs,
        }
    }

    /// Fetch all pending unlocks from the API
    pub async fn fetch_pending_unlocks(&self) -> Result<Vec<PendingUnlock>> {
        let url = format!("{}/v1/observer/pending-unlocks", self.api_url);
        debug!("Fetching pending unlocks from: {}", url);

        let response = self
            .client
            .get(&url)
            .header("Content-Type", "application/json")
            .send()
            .await
            .context("Failed to send request to API")?;

        if !response.status().is_success() {
            let status = response.status();
            let body = response.text().await.unwrap_or_default();
            error!("API error: {} - {}", status, body);
            return Err(anyhow::anyhow!("API returned error: {}", status));
        }

        let api_response: PendingUnlocksApiResponse = response
            .json()
            .await
            .context("Failed to parse API response")?;

        info!(
            "Fetched {} pending unlocks (total: {})",
            api_response.unlocks.len(),
            api_response.total
        );

        Ok(api_response.unlocks.into_iter().map(Into::into).collect())
    }

    /// Fetch unlocks that are about to expire (< 1 hour)
    pub async fn fetch_imminent_unlocks(&self) -> Result<Vec<PendingUnlock>> {
        let all_unlocks = self.fetch_pending_unlocks().await?;
        let imminent: Vec<_> = all_unlocks
            .into_iter()
            .filter(|u| u.time_remaining < 3600)
            .collect();

        if !imminent.is_empty() {
            warn!(
                "{} unlocks are imminent (< 1 hour remaining)",
                imminent.len()
            );
        }

        Ok(imminent)
    }

    /// Fetch high-value unlocks (> threshold ETH)
    pub async fn fetch_high_value_unlocks(&self, threshold_wei: u128) -> Result<Vec<PendingUnlock>> {
        let all_unlocks = self.fetch_pending_unlocks().await?;
        let high_value: Vec<_> = all_unlocks
            .into_iter()
            .filter(|u| u.amount_wei() > threshold_wei)
            .collect();

        if !high_value.is_empty() {
            info!(
                "{} high-value unlocks detected (> {} wei)",
                high_value.len(),
                threshold_wei
            );
        }

        Ok(high_value)
    }

    /// Fetch emergency unlocks only
    pub async fn fetch_emergency_unlocks(&self) -> Result<Vec<PendingUnlock>> {
        let all_unlocks = self.fetch_pending_unlocks().await?;
        let emergency: Vec<_> = all_unlocks
            .into_iter()
            .filter(|u| u.is_emergency())
            .collect();

        if !emergency.is_empty() {
            warn!("{} emergency unlocks in progress", emergency.len());
        }

        Ok(emergency)
    }

    /// Calculate statistics for current pending unlocks
    pub async fn calculate_stats(&self) -> Result<UnlockStats> {
        let unlocks = self.fetch_pending_unlocks().await?;

        let total_count = unlocks.len() as u32;
        let emergency_count = unlocks.iter().filter(|u| u.is_emergency()).count() as u32;
        let imminent_count = unlocks.iter().filter(|u| u.is_imminent()).count() as u32;
        let high_value_count = unlocks.iter().filter(|u| u.is_large_amount()).count() as u32;

        let total_value: u128 = unlocks.iter().map(|u| u.amount_wei()).sum();
        let avg_time_remaining: u64 = if !unlocks.is_empty() {
            unlocks.iter().map(|u| u.time_remaining).sum::<u64>() / unlocks.len() as u64
        } else {
            0
        };

        Ok(UnlockStats {
            total_count,
            emergency_count,
            imminent_count,
            high_value_count,
            total_value_wei: total_value.to_string(),
            avg_time_remaining_secs: avg_time_remaining,
        })
    }
}

/// Statistics about pending unlocks
#[derive(Debug, Clone, Serialize)]
pub struct UnlockStats {
    /// Total pending unlocks
    pub total_count: u32,
    /// Emergency unlocks
    pub emergency_count: u32,
    /// Imminent unlocks (< 1 hour)
    pub imminent_count: u32,
    /// High value unlocks (> 10 ETH)
    pub high_value_count: u32,
    /// Total value at risk (wei)
    pub total_value_wei: String,
    /// Average time remaining (seconds)
    pub avg_time_remaining_secs: u64,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_unlock_monitor_creation() {
        let monitor = UnlockMonitor::new(
            "http://localhost:3000".to_string(),
            "http://localhost:8545".to_string(),
            30,
        );
        assert_eq!(monitor.poll_interval_secs, 30);
    }

    #[test]
    fn test_pending_unlock_conversion() {
        let api_item = PendingUnlockApiItem {
            lock_id: "0x123".to_string(),
            owner: "0xabc".to_string(),
            amount: "1000000000000000000".to_string(),
            token: "0x0".to_string(),
            unlock_type: "emergency".to_string(),
            unlock_requested_at: 1704067200,
            time_remaining: 3600,
            risk_indicators: vec!["test".to_string()],
        };

        let unlock: PendingUnlock = api_item.into();
        assert_eq!(unlock.lock_id, "0x123");
        assert!(unlock.is_emergency());
    }

    #[test]
    fn test_unlock_stats_default() {
        let stats = UnlockStats {
            total_count: 10,
            emergency_count: 2,
            imminent_count: 1,
            high_value_count: 3,
            total_value_wei: "100000000000000000000".to_string(),
            avg_time_remaining_secs: 43200,
        };
        assert_eq!(stats.total_count, 10);
    }
}
