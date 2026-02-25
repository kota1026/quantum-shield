//! Risk Analyzer - Risk Score Calculation
//!
//! TASK-P5-027: Implements risk scoring for pending unlocks.
//!
//! Spec References:
//! - SEQUENCES §4.3: Risk assessment criteria
//! - UNIFIED_SPEC §Monitoring: Risk thresholds

use tracing::{debug, info};

use crate::config::RiskThresholdConfig;
use crate::types::{FraudAnalysisResult, PendingUnlock, RiskFactor, RiskScore, SuspicionLevel};

/// Risk Analyzer for calculating risk scores
#[derive(Debug, Clone)]
pub struct RiskAnalyzer {
    config: RiskThresholdConfig,
}

impl RiskAnalyzer {
    /// Create a new RiskAnalyzer
    pub fn new(config: RiskThresholdConfig) -> Self {
        Self { config }
    }

    /// Calculate risk score for an unlock based on fraud analysis
    pub fn calculate_score(
        &self,
        unlock: &PendingUnlock,
        fraud_result: &FraudAnalysisResult,
    ) -> RiskScore {
        debug!("Calculating risk score for: {}", unlock.lock_id);

        let mut factors = Vec::new();
        let mut total_score: u32 = 0;

        // Factor 1: Large amount
        if unlock.is_large_amount() {
            let weight = self.config.large_amount_weight;
            factors.push(RiskFactor {
                name: "Large Amount".to_string(),
                description: format!(
                    "Amount exceeds 10 ETH: {} wei",
                    unlock.amount
                ),
                severity: "high".to_string(),
                weight,
            });
            total_score += weight;
        }

        // Factor 2: Emergency unlock
        if unlock.is_emergency() {
            let weight = self.config.emergency_weight;
            factors.push(RiskFactor {
                name: "Emergency Unlock".to_string(),
                description: "Emergency unlock with bond requirement".to_string(),
                severity: "medium".to_string(),
                weight,
            });
            total_score += weight;
        }

        // Factor 3: Imminent execution
        if unlock.is_imminent() {
            let weight = 20u32; // Fixed weight for imminent
            factors.push(RiskFactor {
                name: "Imminent Execution".to_string(),
                description: format!(
                    "Unlock in {} seconds - limited time to challenge",
                    unlock.time_remaining
                ),
                severity: "high".to_string(),
                weight,
            });
            total_score += weight;
        }

        // Include factors from fraud analysis
        for factor in &fraud_result.risk_factors {
            factors.push(factor.clone());
            total_score += factor.weight;
        }

        // Cap score at 100
        let capped_score = std::cmp::min(total_score, 100);

        // Generate summary based on score
        let summary = self.generate_summary(capped_score, &factors);

        info!(
            "Risk score calculated for {}: {} (factors: {})",
            unlock.lock_id,
            capped_score,
            factors.len()
        );

        RiskScore::new(capped_score, factors, summary)
    }

    /// Calculate a simple risk score without fraud analysis
    pub fn calculate_simple_score(&self, unlock: &PendingUnlock) -> RiskScore {
        let mut factors = Vec::new();
        let mut total_score: u32 = 0;

        // Large amount check
        if unlock.is_large_amount() {
            let weight = self.config.large_amount_weight;
            factors.push(RiskFactor {
                name: "Large Amount".to_string(),
                description: "Amount exceeds threshold".to_string(),
                severity: "high".to_string(),
                weight,
            });
            total_score += weight;
        }

        // Emergency unlock check
        if unlock.is_emergency() {
            let weight = self.config.emergency_weight;
            factors.push(RiskFactor {
                name: "Emergency Unlock".to_string(),
                description: "Emergency unlock type".to_string(),
                severity: "medium".to_string(),
                weight,
            });
            total_score += weight;
        }

        // Imminent check
        if unlock.is_imminent() {
            let weight = 20u32;
            factors.push(RiskFactor {
                name: "Imminent Execution".to_string(),
                description: "Less than 1 hour remaining".to_string(),
                severity: "high".to_string(),
                weight,
            });
            total_score += weight;
        }

        // Include existing risk indicators
        for indicator in &unlock.risk_indicators {
            let weight = 15u32;
            factors.push(RiskFactor {
                name: "API Risk Indicator".to_string(),
                description: indicator.clone(),
                severity: "medium".to_string(),
                weight,
            });
            total_score += weight;
        }

        let capped_score = std::cmp::min(total_score, 100);
        let summary = self.generate_summary(capped_score, &factors);

        RiskScore::new(capped_score, factors, summary)
    }

    /// Generate summary text based on score
    fn generate_summary(&self, score: u32, factors: &[RiskFactor]) -> String {
        let level = SuspicionLevel::from(score);
        let factor_names: Vec<_> = factors.iter().map(|f| f.name.as_str()).collect();

        match level {
            SuspicionLevel::Low => {
                format!(
                    "Low risk (score: {}). Standard monitoring recommended.",
                    score
                )
            }
            SuspicionLevel::Medium => {
                format!(
                    "Medium risk (score: {}). Review recommended. Factors: {}",
                    score,
                    factor_names.join(", ")
                )
            }
            SuspicionLevel::High => {
                format!(
                    "HIGH RISK (score: {}). Prepare challenge evidence. Factors: {}",
                    score,
                    factor_names.join(", ")
                )
            }
            SuspicionLevel::Critical => {
                format!(
                    "CRITICAL (score: {}). IMMEDIATE ACTION REQUIRED. Submit challenge. Factors: {}",
                    score,
                    factor_names.join(", ")
                )
            }
        }
    }

    /// Get the threshold for a given alert level
    pub fn get_threshold(&self, level: &str) -> u32 {
        match level.to_lowercase().as_str() {
            "warning" => self.config.warning_threshold,
            "high" => self.config.high_threshold,
            "critical" => self.config.critical_threshold,
            _ => self.config.warning_threshold,
        }
    }

    /// Check if score meets threshold
    pub fn meets_threshold(&self, score: u32, level: &str) -> bool {
        score >= self.get_threshold(level)
    }

    /// Aggregate multiple risk scores
    pub fn aggregate_scores(&self, scores: &[RiskScore]) -> RiskScore {
        if scores.is_empty() {
            return RiskScore::new(0, vec![], "No data".to_string());
        }

        let total_score: u32 = scores.iter().map(|s| s.score).sum();
        let avg_score = total_score / scores.len() as u32;
        let max_score = scores.iter().map(|s| s.score).max().unwrap_or(0);

        // Use the higher of average or max
        let final_score = std::cmp::max(avg_score, max_score);

        // Combine all factors
        let all_factors: Vec<_> = scores
            .iter()
            .flat_map(|s| s.factors.clone())
            .collect();

        let summary = format!(
            "Aggregated score: {} (avg: {}, max: {}, count: {})",
            final_score, avg_score, max_score, scores.len()
        );

        RiskScore::new(final_score, all_factors, summary)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::UnlockType;
    use chrono::Utc;

    fn create_test_unlock() -> PendingUnlock {
        PendingUnlock {
            lock_id: "0x123".to_string(),
            owner: "0xabc".to_string(),
            amount: "1000000000000000000".to_string(),
            token: "0x0".to_string(),
            unlock_type: UnlockType::Normal,
            unlock_requested_at: Utc::now().timestamp() as u64 - 3600,
            time_remaining: 82800,
            risk_indicators: vec![],
        }
    }

    #[test]
    fn test_risk_analyzer_creation() {
        let config = RiskThresholdConfig::default();
        let analyzer = RiskAnalyzer::new(config);
        assert_eq!(analyzer.config.warning_threshold, 40);
    }

    #[test]
    fn test_simple_score_low_risk() {
        let analyzer = RiskAnalyzer::new(RiskThresholdConfig::default());
        let unlock = create_test_unlock();

        let score = analyzer.calculate_simple_score(&unlock);
        assert!(score.score < 40); // Low risk
        assert_eq!(score.level, SuspicionLevel::Low);
    }

    #[test]
    fn test_simple_score_large_amount() {
        let analyzer = RiskAnalyzer::new(RiskThresholdConfig::default());
        let mut unlock = create_test_unlock();
        unlock.amount = "50000000000000000000".to_string(); // 50 ETH

        let score = analyzer.calculate_simple_score(&unlock);
        assert!(score.score >= 30); // Large amount weight
        assert!(!score.factors.is_empty());
    }

    #[test]
    fn test_simple_score_emergency() {
        let analyzer = RiskAnalyzer::new(RiskThresholdConfig::default());
        let mut unlock = create_test_unlock();
        unlock.unlock_type = UnlockType::Emergency;

        let score = analyzer.calculate_simple_score(&unlock);
        assert!(score.factors.iter().any(|f| f.name == "Emergency Unlock"));
    }

    #[test]
    fn test_simple_score_imminent() {
        let analyzer = RiskAnalyzer::new(RiskThresholdConfig::default());
        let mut unlock = create_test_unlock();
        unlock.time_remaining = 1800; // 30 minutes

        let score = analyzer.calculate_simple_score(&unlock);
        assert!(score.factors.iter().any(|f| f.name == "Imminent Execution"));
    }

    #[test]
    fn test_meets_threshold() {
        let analyzer = RiskAnalyzer::new(RiskThresholdConfig::default());

        assert!(analyzer.meets_threshold(50, "warning"));
        assert!(analyzer.meets_threshold(75, "high"));
        assert!(analyzer.meets_threshold(90, "critical"));

        assert!(!analyzer.meets_threshold(30, "warning"));
        assert!(!analyzer.meets_threshold(60, "high"));
    }

    #[test]
    fn test_aggregate_scores() {
        let analyzer = RiskAnalyzer::new(RiskThresholdConfig::default());

        let scores = vec![
            RiskScore::new(30, vec![], "test1".to_string()),
            RiskScore::new(50, vec![], "test2".to_string()),
            RiskScore::new(70, vec![], "test3".to_string()),
        ];

        let aggregated = analyzer.aggregate_scores(&scores);
        assert_eq!(aggregated.score, 70); // max(avg=50, max=70) = 70
    }

    #[test]
    fn test_generate_summary() {
        let analyzer = RiskAnalyzer::new(RiskThresholdConfig::default());

        let low_summary = analyzer.generate_summary(20, &[]);
        assert!(low_summary.contains("Low risk"));

        let high_summary = analyzer.generate_summary(75, &[
            RiskFactor {
                name: "Test".to_string(),
                description: "Test factor".to_string(),
                severity: "high".to_string(),
                weight: 30,
            }
        ]);
        assert!(high_summary.contains("HIGH RISK"));
    }
}
