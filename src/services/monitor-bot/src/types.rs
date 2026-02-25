//! Common types for Monitor Bot
//!
//! Defines shared types used across monitoring, detection, and alerting modules.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

// ============================================================================
// Unlock Types
// ============================================================================

/// Type of unlock request
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum UnlockType {
    /// Normal unlock with 24h timelock
    Normal,
    /// Emergency unlock with 7d timelock and bond
    Emergency,
}

impl Default for UnlockType {
    fn default() -> Self {
        Self::Normal
    }
}

/// Suspicion level for transactions
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum SuspicionLevel {
    /// Low risk (0-25)
    Low,
    /// Medium risk (26-50)
    Medium,
    /// High risk (51-75)
    High,
    /// Critical risk (76-100)
    Critical,
}

impl From<u32> for SuspicionLevel {
    fn from(score: u32) -> Self {
        match score {
            0..=25 => SuspicionLevel::Low,
            26..=50 => SuspicionLevel::Medium,
            51..=75 => SuspicionLevel::High,
            _ => SuspicionLevel::Critical,
        }
    }
}

impl Default for SuspicionLevel {
    fn default() -> Self {
        Self::Low
    }
}

/// Pending unlock data structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PendingUnlock {
    /// Lock ID
    #[serde(rename = "lockId")]
    pub lock_id: String,
    /// Owner address
    pub owner: String,
    /// Amount in wei
    pub amount: String,
    /// Token address
    pub token: String,
    /// Unlock type
    #[serde(rename = "unlockType")]
    pub unlock_type: UnlockType,
    /// Unlock request timestamp
    #[serde(rename = "unlockRequestedAt")]
    pub unlock_requested_at: u64,
    /// Time remaining until unlock (seconds)
    #[serde(rename = "timeRemaining")]
    pub time_remaining: u64,
    /// Risk indicators
    #[serde(rename = "riskIndicators", default)]
    pub risk_indicators: Vec<String>,
}

impl PendingUnlock {
    /// Parse amount as u128
    pub fn amount_wei(&self) -> u128 {
        self.amount.parse().unwrap_or(0)
    }

    /// Check if this is a large amount (>10 ETH)
    pub fn is_large_amount(&self) -> bool {
        self.amount_wei() > 10_000_000_000_000_000_000u128
    }

    /// Check if unlock is imminent (< 1 hour remaining)
    pub fn is_imminent(&self) -> bool {
        self.time_remaining < 3600
    }

    /// Check if this is an emergency unlock
    pub fn is_emergency(&self) -> bool {
        matches!(self.unlock_type, UnlockType::Emergency)
    }
}

// ============================================================================
// Fraud Detection Types
// ============================================================================

/// Risk factor identified during analysis
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RiskFactor {
    /// Factor name
    pub name: String,
    /// Description
    pub description: String,
    /// Severity level
    pub severity: String,
    /// Weight in risk calculation (0-100)
    pub weight: u32,
}

/// Result of fraud analysis
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FraudAnalysisResult {
    /// Lock ID analyzed
    pub lock_id: String,
    /// Overall suspicion level
    pub suspicion_level: SuspicionLevel,
    /// Risk factors identified
    pub risk_factors: Vec<RiskFactor>,
    /// Is this a critical risk requiring immediate attention?
    pub is_critical: bool,
    /// Recommended action
    pub recommended_action: String,
    /// Analysis timestamp
    pub analyzed_at: DateTime<Utc>,
}

/// Risk score calculation result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RiskScore {
    /// Numeric score (0-100)
    pub score: u32,
    /// Suspicion level
    pub level: SuspicionLevel,
    /// Contributing factors
    pub factors: Vec<RiskFactor>,
    /// Summary
    pub summary: String,
}

impl RiskScore {
    /// Create a new risk score
    pub fn new(score: u32, factors: Vec<RiskFactor>, summary: String) -> Self {
        Self {
            score,
            level: score.into(),
            factors,
            summary,
        }
    }

    /// Check if this is high risk
    pub fn is_high_risk(&self) -> bool {
        self.score >= 70
    }

    /// Check if this is critical
    pub fn is_critical(&self) -> bool {
        self.score >= 85
    }
}

// ============================================================================
// Monitor State
// ============================================================================

/// Monitor bot state
#[derive(Debug, Default)]
pub struct MonitorState {
    /// Currently tracked pending unlocks
    pub pending_unlocks: Vec<PendingUnlock>,
    /// High risk unlock count
    pub high_risk_count: u32,
    /// Alerts sent count
    pub alerts_sent: u32,
    /// Last poll time
    pub last_poll_time: DateTime<Utc>,
    /// Detected fraud attempts
    pub fraud_attempts: Vec<FraudAnalysisResult>,
}

// ============================================================================
// Alert Types
// ============================================================================

/// Alert priority levels
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum AlertPriority {
    /// Informational
    Info,
    /// Warning - needs attention
    Warning,
    /// High - potential fraud
    High,
    /// Critical - immediate action required
    Critical,
}

impl From<SuspicionLevel> for AlertPriority {
    fn from(level: SuspicionLevel) -> Self {
        match level {
            SuspicionLevel::Low => AlertPriority::Info,
            SuspicionLevel::Medium => AlertPriority::Warning,
            SuspicionLevel::High => AlertPriority::High,
            SuspicionLevel::Critical => AlertPriority::Critical,
        }
    }
}

/// Alert message structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AlertMessage {
    /// Alert ID
    pub id: String,
    /// Priority
    pub priority: AlertPriority,
    /// Title
    pub title: String,
    /// Description
    pub description: String,
    /// Lock ID (if applicable)
    pub lock_id: Option<String>,
    /// Amount at risk
    pub amount: Option<String>,
    /// Risk score
    pub risk_score: Option<u32>,
    /// Recommended action
    pub recommended_action: String,
    /// Timestamp
    pub timestamp: DateTime<Utc>,
}

// ============================================================================
// Tests
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_suspicion_level_from_score() {
        assert_eq!(SuspicionLevel::from(10), SuspicionLevel::Low);
        assert_eq!(SuspicionLevel::from(30), SuspicionLevel::Medium);
        assert_eq!(SuspicionLevel::from(60), SuspicionLevel::High);
        assert_eq!(SuspicionLevel::from(90), SuspicionLevel::Critical);
    }

    #[test]
    fn test_pending_unlock_large_amount() {
        let unlock = PendingUnlock {
            lock_id: "test".to_string(),
            owner: "0x123".to_string(),
            amount: "50000000000000000000".to_string(), // 50 ETH
            token: "0x0".to_string(),
            unlock_type: UnlockType::Normal,
            unlock_requested_at: 0,
            time_remaining: 3600,
            risk_indicators: vec![],
        };
        assert!(unlock.is_large_amount());
    }

    #[test]
    fn test_pending_unlock_imminent() {
        let unlock = PendingUnlock {
            lock_id: "test".to_string(),
            owner: "0x123".to_string(),
            amount: "1000000000000000000".to_string(),
            token: "0x0".to_string(),
            unlock_type: UnlockType::Normal,
            unlock_requested_at: 0,
            time_remaining: 1800, // 30 minutes
            risk_indicators: vec![],
        };
        assert!(unlock.is_imminent());
    }

    #[test]
    fn test_risk_score_levels() {
        let low = RiskScore::new(20, vec![], "Low risk".to_string());
        assert!(!low.is_high_risk());
        assert!(!low.is_critical());

        let high = RiskScore::new(75, vec![], "High risk".to_string());
        assert!(high.is_high_risk());
        assert!(!high.is_critical());

        let critical = RiskScore::new(90, vec![], "Critical".to_string());
        assert!(critical.is_high_risk());
        assert!(critical.is_critical());
    }

    #[test]
    fn test_alert_priority_from_suspicion() {
        assert_eq!(
            AlertPriority::from(SuspicionLevel::Low),
            AlertPriority::Info
        );
        assert_eq!(
            AlertPriority::from(SuspicionLevel::Critical),
            AlertPriority::Critical
        );
    }
}
