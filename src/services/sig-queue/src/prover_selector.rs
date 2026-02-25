//! Prover selection via VRF (Chainlink VRF compatible)

use crate::Config;

pub struct ProverSelector {
    required: u32,
    total: u32,
}

impl ProverSelector {
    pub fn new(config: &Config) -> Self {
        Self {
            required: config.required_signatures,
            total: config.total_provers,
        }
    }

    /// Select Provers using VRF seed
    /// 
    /// Selection is weighted by stake:
    /// P(i) = Stake_i / Σ Stake
    pub fn select(&self, vrf_seed: &[u8], provers: &[ProverInfo]) -> Vec<String> {
        // TODO: Implement stake-weighted random selection
        // For now, return first N provers
        provers.iter()
            .take(self.required as usize)
            .map(|p| p.id.clone())
            .collect()
    }
}

#[derive(Debug)]
pub struct ProverInfo {
    pub id: String,
    pub stake: u128,
    pub sphincs_pubkey: Vec<u8>,
}
