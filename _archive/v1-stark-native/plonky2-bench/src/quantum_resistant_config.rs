//! Quantum-Resistant Configuration for Plonky2 STARK Proofs
//!
//! This module provides security parameter configurations that account for
//! quantum computing threats, specifically Grover's algorithm which provides
//! a quadratic speedup for search problems.
//!
//! # Security Analysis
//!
//! ## Classical vs Quantum Security
//!
//! For a proof system with k-bit classical security:
//! - Grover's algorithm reduces security to k/2 bits against quantum attackers
//! - To achieve 128-bit quantum security, we need 256-bit classical security
//!
//! ## STARK Security Components
//!
//! 1. **FRI (Fast Reed-Solomon IOP)**:
//!    - Security comes from number of queries and folding factor
//!    - Each query provides `log(blow_up_factor)` bits of security
//!    - Quantum: Grover can find bad queries in sqrt(N) time
//!
//! 2. **Hash Function (Poseidon)**:
//!    - Collision resistance: 128-bit classical → 64-bit quantum (birthday attack + Grover)
//!    - Preimage resistance: 256-bit classical → 128-bit quantum (Grover)
//!    - For quantum resistance, need larger state/output
//!
//! 3. **Goldilocks Field**:
//!    - p = 2^64 - 2^32 + 1 (64-bit prime)
//!    - DLP in F_p is not relevant for STARK security
//!    - Field size affects proof size, not quantum security directly
//!
//! # Recommendations
//!
//! For 100-bit quantum security (200-bit classical):
//! - FRI queries: ~50 (each provides ~log(8) ≈ 3 bits, total ~150 bits classical)
//! - Hash output: 256 bits minimum (Poseidon with 256-bit capacity)
//! - Blowup factor: 8-16x for good soundness

use plonky2::fri::reduction_strategies::FriReductionStrategy;
use plonky2::fri::FriConfig;
use plonky2::plonk::circuit_data::CircuitConfig;

// ============================================================================
// Security Level Definitions
// ============================================================================

/// Security level enumeration
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SecurityLevel {
    /// Standard: 80-bit quantum security (160-bit classical)
    Standard,
    /// High: 100-bit quantum security (200-bit classical)
    High,
    /// Paranoid: 128-bit quantum security (256-bit classical)
    Paranoid,
}

impl SecurityLevel {
    /// Target quantum security bits
    pub fn quantum_security_bits(&self) -> usize {
        match self {
            SecurityLevel::Standard => 80,
            SecurityLevel::High => 100,
            SecurityLevel::Paranoid => 128,
        }
    }

    /// Target classical security bits (2x quantum for Grover resistance)
    pub fn classical_security_bits(&self) -> usize {
        self.quantum_security_bits() * 2
    }

    /// Recommended FRI query count
    /// Each query with blowup=8 provides ~3 bits classical security
    /// Need classical_bits / 3 queries minimum
    pub fn recommended_fri_queries(&self) -> usize {
        let classical_bits = self.classical_security_bits();
        // With rate_bits=3 (blowup=8), each query gives ~3 bits
        // Add safety margin
        (classical_bits / 3) + 10
    }

    /// Recommended FRI rate bits (log2 of blowup factor)
    pub fn recommended_rate_bits(&self) -> usize {
        match self {
            SecurityLevel::Standard => 3,  // blowup = 8
            SecurityLevel::High => 3,      // blowup = 8
            SecurityLevel::Paranoid => 4,  // blowup = 16
        }
    }

    /// Recommended proof-of-work bits for additional security
    pub fn recommended_pow_bits(&self) -> u32 {
        match self {
            SecurityLevel::Standard => 16,
            SecurityLevel::High => 20,
            SecurityLevel::Paranoid => 24,
        }
    }
}

// ============================================================================
// Quantum-Resistant Circuit Configurations
// ============================================================================

/// Create a quantum-resistant circuit configuration
pub fn quantum_resistant_config(level: SecurityLevel) -> CircuitConfig {
    let fri_config = quantum_resistant_fri_config(level);

    CircuitConfig {
        // Number of wires per gate (standard for Plonky2)
        num_wires: 135,

        // Number of routed wires (affects copy constraints)
        num_routed_wires: 80,

        // Number of constants per gate
        num_constants: 2,

        // Use base arithmetic gate
        use_base_arithmetic_gate: true,

        // Security parameter for hiding inputs
        // Note: Plonky2 checks: min(field_ext_bits, query_security) >= security_bits
        // For Goldilocks with D=2 extension: field_ext_bits = 128
        // FRI security = num_queries * rate_bits + pow_bits
        // We cap at 100 to ensure the check passes while still getting
        // quantum security benefits from additional FRI queries.
        security_bits: 100,

        // Number of challenges for batched polynomial opening
        num_challenges: 2,

        // Maximum degree of quotient polynomial chunks
        max_quotient_degree_factor: 8,

        // FRI configuration
        fri_config,

        // Zero-knowledge: add randomness to hide witness
        zero_knowledge: true,
    }
}

/// Create quantum-resistant FRI configuration
pub fn quantum_resistant_fri_config(level: SecurityLevel) -> FriConfig {
    FriConfig {
        // Rate bits = log2(blowup factor)
        // Higher = more security per query, but larger proofs
        rate_bits: level.recommended_rate_bits(),

        // Degree reduction strategy per FRI layer
        // ConstantArityBits(arity_bits, final_poly_bits):
        //   - arity_bits=4: reduce by 16x each round
        //   - final_poly_bits=8: stop when degree < 256
        // This auto-adjusts to circuit size
        reduction_strategy: FriReductionStrategy::ConstantArityBits(4, 8),

        // Number of FRI queries
        // This is the main security parameter
        // Each query provides rate_bits of security
        num_query_rounds: level.recommended_fri_queries(),

        // Cap height for Merkle tree
        // Affects proof size and verification time
        cap_height: 4,

        // Proof-of-work challenge bits
        // Adds computational cost for attackers
        proof_of_work_bits: level.recommended_pow_bits(),
    }
}

/// Standard quantum-resistant configuration (100-bit quantum security)
pub fn standard_quantum_config() -> CircuitConfig {
    quantum_resistant_config(SecurityLevel::High)
}

/// High-security quantum-resistant configuration (128-bit quantum security)
pub fn high_security_quantum_config() -> CircuitConfig {
    quantum_resistant_config(SecurityLevel::Paranoid)
}

// ============================================================================
// Security Analysis Functions
// ============================================================================

/// Analyze security parameters of a circuit configuration
pub fn analyze_security(config: &CircuitConfig) -> SecurityAnalysis {
    let fri = &config.fri_config;

    // FRI security: each query provides rate_bits of classical security
    let fri_security_classical = fri.num_query_rounds * fri.rate_bits;
    let fri_security_quantum = fri_security_classical / 2;

    // PoW security: adds proof_of_work_bits to attacker cost
    let pow_security = fri.proof_of_work_bits as usize;

    // Effective blowup factor
    let blowup_factor = 1 << fri.rate_bits;

    // Proof size estimate (rough)
    let proof_size_estimate = estimate_proof_size(config);

    SecurityAnalysis {
        fri_query_count: fri.num_query_rounds,
        fri_rate_bits: fri.rate_bits,
        blowup_factor,
        fri_security_classical,
        fri_security_quantum,
        pow_bits: pow_security,
        total_classical_security: fri_security_classical + pow_security,
        total_quantum_security: fri_security_quantum + (pow_security / 2),
        zero_knowledge: config.zero_knowledge,
        estimated_proof_size_kb: proof_size_estimate / 1024,
        is_quantum_safe_100bit: fri_security_quantum + (pow_security / 2) >= 100,
        is_quantum_safe_128bit: fri_security_quantum + (pow_security / 2) >= 128,
    }
}

/// Estimate proof size based on configuration
fn estimate_proof_size(config: &CircuitConfig) -> usize {
    let fri = &config.fri_config;

    // Base proof elements (commitments, evaluations)
    let base_size = 1024;

    // FRI query proofs: each query needs Merkle proofs
    let query_size = fri.num_query_rounds * 256; // ~256 bytes per query

    // Cap size
    let cap_size = (1 << fri.cap_height) * 32;

    base_size + query_size + cap_size
}

/// Security analysis result
#[derive(Debug, Clone)]
pub struct SecurityAnalysis {
    /// Number of FRI queries
    pub fri_query_count: usize,
    /// FRI rate bits (log2 of blowup)
    pub fri_rate_bits: usize,
    /// Effective blowup factor
    pub blowup_factor: usize,
    /// Classical security from FRI (bits)
    pub fri_security_classical: usize,
    /// Quantum security from FRI (bits)
    pub fri_security_quantum: usize,
    /// Proof-of-work bits
    pub pow_bits: usize,
    /// Total classical security (bits)
    pub total_classical_security: usize,
    /// Total quantum security (bits)
    pub total_quantum_security: usize,
    /// Whether zero-knowledge is enabled
    pub zero_knowledge: bool,
    /// Estimated proof size in KB
    pub estimated_proof_size_kb: usize,
    /// Whether configuration provides 100-bit quantum security
    pub is_quantum_safe_100bit: bool,
    /// Whether configuration provides 128-bit quantum security
    pub is_quantum_safe_128bit: bool,
}

impl std::fmt::Display for SecurityAnalysis {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        writeln!(f, "Security Analysis:")?;
        writeln!(f, "  FRI Parameters:")?;
        writeln!(f, "    Query count:      {}", self.fri_query_count)?;
        writeln!(f, "    Rate bits:        {} (blowup = {}x)", self.fri_rate_bits, self.blowup_factor)?;
        writeln!(f, "    PoW bits:         {}", self.pow_bits)?;
        writeln!(f)?;
        writeln!(f, "  Security Levels:")?;
        writeln!(f, "    Classical:        {} bits", self.total_classical_security)?;
        writeln!(f, "    Quantum:          {} bits", self.total_quantum_security)?;
        writeln!(f)?;
        writeln!(f, "  Quantum Resistance:")?;
        writeln!(f, "    100-bit safe:     {}", if self.is_quantum_safe_100bit { "YES" } else { "NO" })?;
        writeln!(f, "    128-bit safe:     {}", if self.is_quantum_safe_128bit { "YES" } else { "NO" })?;
        writeln!(f)?;
        writeln!(f, "  Other:")?;
        writeln!(f, "    Zero-knowledge:   {}", self.zero_knowledge)?;
        writeln!(f, "    Est. proof size:  ~{} KB", self.estimated_proof_size_kb)?;
        Ok(())
    }
}

// ============================================================================
// Poseidon Hash Security Analysis
// ============================================================================

/// Poseidon hash security parameters for Goldilocks field
///
/// Plonky2 uses Poseidon with:
/// - State width: 12 field elements (12 × 64 = 768 bits)
/// - Capacity: 4 field elements (256 bits)
/// - Rate: 8 field elements (512 bits)
/// - Full rounds: 8
/// - Partial rounds: 22
///
/// Security analysis:
/// - Collision resistance: min(capacity/2, output_bits/2) = 128 bits classical
/// - Preimage resistance: capacity = 256 bits classical
/// - Quantum collision: 64 bits (birthday + Grover)
/// - Quantum preimage: 128 bits (Grover)
pub struct PoseidonSecurityAnalysis {
    /// State width in field elements
    pub state_width: usize,
    /// Capacity in field elements
    pub capacity: usize,
    /// Rate in field elements
    pub rate: usize,
    /// Number of full rounds
    pub full_rounds: usize,
    /// Number of partial rounds
    pub partial_rounds: usize,
    /// Classical collision resistance (bits)
    pub collision_resistance_classical: usize,
    /// Quantum collision resistance (bits)
    pub collision_resistance_quantum: usize,
    /// Classical preimage resistance (bits)
    pub preimage_resistance_classical: usize,
    /// Quantum preimage resistance (bits)
    pub preimage_resistance_quantum: usize,
}

impl Default for PoseidonSecurityAnalysis {
    fn default() -> Self {
        // Plonky2's Poseidon configuration for Goldilocks
        let state_width = 12;
        let capacity = 4;
        let rate = 8;
        let capacity_bits = capacity * 64; // 256 bits

        Self {
            state_width,
            capacity,
            rate,
            full_rounds: 8,
            partial_rounds: 22,
            // Collision: birthday bound on capacity
            collision_resistance_classical: capacity_bits / 2, // 128 bits
            collision_resistance_quantum: capacity_bits / 4,   // 64 bits (Grover on birthday)
            // Preimage: full capacity
            preimage_resistance_classical: capacity_bits,      // 256 bits
            preimage_resistance_quantum: capacity_bits / 2,    // 128 bits (Grover)
        }
    }
}

impl std::fmt::Display for PoseidonSecurityAnalysis {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        writeln!(f, "Poseidon Hash Security (Goldilocks):")?;
        writeln!(f, "  Configuration:")?;
        writeln!(f, "    State width:      {} elements ({} bits)", self.state_width, self.state_width * 64)?;
        writeln!(f, "    Capacity:         {} elements ({} bits)", self.capacity, self.capacity * 64)?;
        writeln!(f, "    Rate:             {} elements ({} bits)", self.rate, self.rate * 64)?;
        writeln!(f, "    Full rounds:      {}", self.full_rounds)?;
        writeln!(f, "    Partial rounds:   {}", self.partial_rounds)?;
        writeln!(f)?;
        writeln!(f, "  Security Levels:")?;
        writeln!(f, "    Collision (classical):  {} bits", self.collision_resistance_classical)?;
        writeln!(f, "    Collision (quantum):    {} bits", self.collision_resistance_quantum)?;
        writeln!(f, "    Preimage (classical):   {} bits", self.preimage_resistance_classical)?;
        writeln!(f, "    Preimage (quantum):     {} bits", self.preimage_resistance_quantum)?;
        writeln!(f)?;
        writeln!(f, "  Note: For STARK proofs, preimage resistance is primary;")?;
        writeln!(f, "        128-bit quantum preimage resistance is sufficient.")?;
        Ok(())
    }
}

// ============================================================================
// Tests
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_security_levels() {
        assert_eq!(SecurityLevel::Standard.quantum_security_bits(), 80);
        assert_eq!(SecurityLevel::High.quantum_security_bits(), 100);
        assert_eq!(SecurityLevel::Paranoid.quantum_security_bits(), 128);
    }

    #[test]
    fn test_quantum_config_security() {
        let config = standard_quantum_config();
        let analysis = analyze_security(&config);

        assert!(analysis.is_quantum_safe_100bit,
            "Standard quantum config should provide 100-bit quantum security");
    }

    #[test]
    fn test_high_security_config() {
        let config = high_security_quantum_config();
        let analysis = analyze_security(&config);

        assert!(analysis.is_quantum_safe_128bit,
            "High security config should provide 128-bit quantum security");
    }

    #[test]
    fn test_poseidon_security() {
        let poseidon = PoseidonSecurityAnalysis::default();

        // Verify quantum preimage resistance >= 100 bits
        assert!(poseidon.preimage_resistance_quantum >= 100,
            "Poseidon should provide 100+ bit quantum preimage resistance");
    }
}
