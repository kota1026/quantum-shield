//! Fraud Detector - Anomaly and Pattern Detection
//!
//! TASK-P5-027: Implements fraud detection for pending unlocks.
//!
//! Spec References:
//! - SEQUENCES §4.1: Challenge submission criteria
//! - SEQUENCES §4.3: Fraud evidence requirements
//! - UNIFIED_SPEC §Monitoring: Fraud detection rules

use chrono::Utc;
use tracing::{debug, info, warn};

use crate::config::FraudDetectionConfig;
use crate::types::{FraudAnalysisResult, PendingUnlock, RiskFactor, SuspicionLevel};

/// Fraud Detector for analyzing unlock requests
#[derive(Debug, Clone)]
pub struct FraudDetector {
    config: FraudDetectionConfig,
    /// Known malicious addresses (would be loaded from database in production)
    blocklist: Vec<String>,
}

impl FraudDetector {
    /// Create a new FraudDetector
    pub fn new(config: FraudDetectionConfig) -> Self {
        Self {
            config,
            blocklist: vec![
                // Example blocklist entries (in production, loaded from database)
                "0xbad0000000000000000000000000000000000001".to_string(),
                "0xbad0000000000000000000000000000000000002".to_string(),
            ],
        }
    }

    /// Analyze an unlock for fraud indicators
    pub async fn analyze(&self, unlock: &PendingUnlock) -> Option<FraudAnalysisResult> {
        debug!("Analyzing unlock: {}", unlock.lock_id);

        let mut risk_factors = Vec::new();
        let mut total_weight = 0u32;

        // Check 1: Large amount
        if unlock.is_large_amount() {
            let factor = RiskFactor {
                name: "Large Amount".to_string(),
                description: format!(
                    "Amount {} wei exceeds {}ETH threshold",
                    unlock.amount,
                    self.config.large_amount_threshold_eth
                ),
                severity: "high".to_string(),
                weight: 30,
            };
            total_weight += factor.weight;
            risk_factors.push(factor);
        }

        // Check 2: Emergency unlock
        if unlock.is_emergency() {
            let factor = RiskFactor {
                name: "Emergency Unlock".to_string(),
                description: "Emergency unlock requires additional scrutiny".to_string(),
                severity: "medium".to_string(),
                weight: 20,
            };
            total_weight += factor.weight;
            risk_factors.push(factor);
        }

        // Check 3: Imminent unlock
        if unlock.is_imminent() {
            let factor = RiskFactor {
                name: "Imminent Unlock".to_string(),
                description: format!(
                    "Unlock will execute in {} seconds",
                    unlock.time_remaining
                ),
                severity: "warning".to_string(),
                weight: 15,
            };
            total_weight += factor.weight;
            risk_factors.push(factor);
        }

        // Check 4: Blocklist
        if self.config.blocklist_enabled && self.is_blocklisted(&unlock.owner) {
            let factor = RiskFactor {
                name: "Blocklisted Address".to_string(),
                description: "Owner address is on the blocklist".to_string(),
                severity: "critical".to_string(),
                weight: 50,
            };
            total_weight += factor.weight;
            risk_factors.push(factor);
        }

        // Check 5: Existing risk indicators from API
        for indicator in &unlock.risk_indicators {
            let factor = RiskFactor {
                name: "API Risk Indicator".to_string(),
                description: indicator.clone(),
                severity: "medium".to_string(),
                weight: 15,
            };
            total_weight += factor.weight;
            risk_factors.push(factor);
        }

        // Only return result if any risk factors found
        if risk_factors.is_empty() {
            return None;
        }

        // Cap weight at 100
        let capped_weight = std::cmp::min(total_weight, 100);
        let suspicion_level = SuspicionLevel::from(capped_weight);
        let is_critical = capped_weight >= 85;

        let recommended_action = match suspicion_level {
            SuspicionLevel::Low => "Continue monitoring".to_string(),
            SuspicionLevel::Medium => "Review and prepare challenge evidence".to_string(),
            SuspicionLevel::High => "Prepare challenge submission".to_string(),
            SuspicionLevel::Critical => "Submit challenge immediately".to_string(),
        };

        info!(
            "Fraud analysis complete for {}: level={:?}, weight={}, factors={}",
            unlock.lock_id,
            suspicion_level,
            capped_weight,
            risk_factors.len()
        );

        Some(FraudAnalysisResult {
            lock_id: unlock.lock_id.clone(),
            suspicion_level,
            risk_factors,
            is_critical,
            recommended_action,
            analyzed_at: Utc::now(),
        })
    }

    /// Deep analysis with additional checks (runs less frequently)
    pub async fn deep_analyze(&self, unlock: &PendingUnlock) -> Option<FraudAnalysisResult> {
        debug!("Deep analyzing unlock: {}", unlock.lock_id);

        // Start with basic analysis
        let mut result = self.analyze(unlock).await?;

        // Additional pattern checks would go here
        // In production, this would include:
        // - Historical transaction analysis
        // - Cross-reference with other pending unlocks
        // - Graph analysis of related addresses
        // - Machine learning-based anomaly detection

        // Check for suspicious timing patterns
        let now = Utc::now().timestamp() as u64;
        let time_since_request = now.saturating_sub(unlock.unlock_requested_at);

        // Suspicious if unlock was requested at unusual time
        let hour = (unlock.unlock_requested_at / 3600) % 24;
        if hour >= 1 && hour <= 5 {
            // 1 AM - 5 AM UTC
            let factor = RiskFactor {
                name: "Unusual Timing".to_string(),
                description: format!("Unlock requested at unusual hour: {} UTC", hour),
                severity: "low".to_string(),
                weight: 10,
            };
            result.risk_factors.push(factor);
        }

        // Recalculate suspicion level
        let total_weight: u32 = result.risk_factors.iter().map(|f| f.weight).sum();
        let capped_weight = std::cmp::min(total_weight, 100);
        result.suspicion_level = SuspicionLevel::from(capped_weight);
        result.is_critical = capped_weight >= 85;

        if result.is_critical {
            warn!(
                "CRITICAL FRAUD RISK: {} (score: {})",
                unlock.lock_id, capped_weight
            );
        }

        Some(result)
    }

    /// Check if an address is blocklisted
    fn is_blocklisted(&self, address: &str) -> bool {
        let normalized = address.to_lowercase();
        self.blocklist.iter().any(|a| a.to_lowercase() == normalized)
    }

    /// Add address to blocklist
    pub fn add_to_blocklist(&mut self, address: String) {
        if !self.is_blocklisted(&address) {
            self.blocklist.push(address);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::UnlockType;

    fn create_test_unlock() -> PendingUnlock {
        PendingUnlock {
            lock_id: "0x123".to_string(),
            owner: "0xabc".to_string(),
            amount: "1000000000000000000".to_string(), // 1 ETH
            token: "0x0".to_string(),
            unlock_type: UnlockType::Normal,
            unlock_requested_at: Utc::now().timestamp() as u64 - 3600,
            time_remaining: 82800, // 23 hours
            risk_indicators: vec![],
        }
    }

    #[tokio::test]
    async fn test_fraud_detector_no_risk() {
        let detector = FraudDetector::new(FraudDetectionConfig::default());
        let unlock = create_test_unlock();
        let result = detector.analyze(&unlock).await;
        assert!(result.is_none()); // No risk factors for normal unlock
    }

    #[tokio::test]
    async fn test_fraud_detector_large_amount() {
        let detector = FraudDetector::new(FraudDetectionConfig::default());
        let mut unlock = create_test_unlock();
        unlock.amount = "50000000000000000000".to_string(); // 50 ETH

        let result = detector.analyze(&unlock).await;
        assert!(result.is_some());
        let analysis = result.unwrap();
        assert!(!analysis.risk_factors.is_empty());
        assert!(analysis.risk_factors.iter().any(|f| f.name == "Large Amount"));
    }

    #[tokio::test]
    async fn test_fraud_detector_emergency() {
        let detector = FraudDetector::new(FraudDetectionConfig::default());
        let mut unlock = create_test_unlock();
        unlock.unlock_type = UnlockType::Emergency;

        let result = detector.analyze(&unlock).await;
        assert!(result.is_some());
        let analysis = result.unwrap();
        assert!(analysis.risk_factors.iter().any(|f| f.name == "Emergency Unlock"));
    }

    #[tokio::test]
    async fn test_fraud_detector_blocklist() {
        let detector = FraudDetector::new(FraudDetectionConfig::default());
        let mut unlock = create_test_unlock();
        unlock.owner = "0xbad0000000000000000000000000000000000001".to_string();

        let result = detector.analyze(&unlock).await;
        assert!(result.is_some());
        let analysis = result.unwrap();
        assert!(analysis.risk_factors.iter().any(|f| f.name == "Blocklisted Address"));
        // Blocklist has weight 50, which is Medium (26-50) suspicion level
        assert!(analysis.suspicion_level >= SuspicionLevel::Medium);
    }

    #[tokio::test]
    async fn test_fraud_detector_imminent() {
        let detector = FraudDetector::new(FraudDetectionConfig::default());
        let mut unlock = create_test_unlock();
        unlock.time_remaining = 1800; // 30 minutes

        let result = detector.analyze(&unlock).await;
        assert!(result.is_some());
        let analysis = result.unwrap();
        assert!(analysis.risk_factors.iter().any(|f| f.name == "Imminent Unlock"));
    }

    #[test]
    fn test_is_blocklisted() {
        let detector = FraudDetector::new(FraudDetectionConfig::default());
        assert!(detector.is_blocklisted("0xbad0000000000000000000000000000000000001"));
        assert!(!detector.is_blocklisted("0x1234567890abcdef1234567890abcdef12345678"));
    }

    #[test]
    fn test_add_to_blocklist() {
        let mut detector = FraudDetector::new(FraudDetectionConfig::default());
        let new_address = "0xnew0000000000000000000000000000000000001".to_string();

        assert!(!detector.is_blocklisted(&new_address));
        detector.add_to_blocklist(new_address.clone());
        assert!(detector.is_blocklisted(&new_address));
    }
}
