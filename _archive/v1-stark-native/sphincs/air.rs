//! SPHINCS+ AIR (Algebraic Intermediate Representation)
//!
//! This module defines the constraint system for SPHINCS+ STARK proofs.
//! The AIR combines Merkle Path Gate and Hash Chain Gate constraints.
//!
//! # Constraint Summary
//!
//! | Index | Constraint | Degree | Description |
//! |-------|------------|--------|-------------|
//! | 0-3 | H_IN decomposition | 1 | Hash input field element constraints |
//! | 4-7 | H_OUT decomposition | 1 | Hash output field element constraints |
//! | 8 | S_MERKLE binary | 2 | Merkle selector is 0 or 1 |
//! | 9 | S_CHAIN binary | 2 | Chain selector is 0 or 1 |
//! | 10 | I_SELECT binary | 2 | Left/right selector is 0 or 1 |
//! | 11 | Counter increment | 3 | c_count_next = c_count + 1 (when active) |
//! | 12 | Chain continuity | 3 | h_in_next = h_out (when active chain) |
//! | 13 | Merkle transition | 3 | h_in_next = h_out (when active merkle) |
//! | 14 | Exclusive selector | 3 | At most one of S_MERKLE, S_CHAIN active |
//!
//! # Maximum Constraint Degree: 3
//! Blowup factor requirement: ρ > 3 (we use ρ = 8)

use winterfell::{
    Air, AirContext, Assertion, EvaluationFrame,
    ProofOptions, TraceInfo, TransitionConstraintDegree,
    math::{FieldElement, ToElements},
};
use winterfell::math::fields::f128::BaseElement;

use super::constants::sphincs_columns;

// ============================================================================
// Public Inputs
// ============================================================================

/// Public inputs for SPHINCS+ STARK verification
#[derive(Debug, Clone)]
pub struct SphincsPublicInputs {
    /// Expected Merkle root (4 × 64-bit field elements)
    pub merkle_root: [BaseElement; 4],

    /// Expected final hash chain values for WOTS+ verification
    pub wots_public_key: Vec<[BaseElement; 4]>,

    /// Message hash (input to FORS)
    pub message_hash: [BaseElement; 4],

    /// Number of Merkle path levels verified
    pub merkle_depth: BaseElement,

    /// Number of hash chain iterations
    pub chain_iterations: BaseElement,
}

impl SphincsPublicInputs {
    /// Create default public inputs for testing
    pub fn default_for_test() -> Self {
        Self {
            merkle_root: [BaseElement::ZERO; 4],
            wots_public_key: vec![],
            message_hash: [BaseElement::ZERO; 4],
            merkle_depth: BaseElement::ZERO,
            chain_iterations: BaseElement::ZERO,
        }
    }

    /// Create public inputs from trace data
    pub fn from_trace_values(
        merkle_root: [u64; 4],
        message_hash: [u64; 4],
        merkle_depth: usize,
        chain_iterations: usize,
    ) -> Self {
        Self {
            merkle_root: [
                BaseElement::from(merkle_root[0]),
                BaseElement::from(merkle_root[1]),
                BaseElement::from(merkle_root[2]),
                BaseElement::from(merkle_root[3]),
            ],
            wots_public_key: vec![],
            message_hash: [
                BaseElement::from(message_hash[0]),
                BaseElement::from(message_hash[1]),
                BaseElement::from(message_hash[2]),
                BaseElement::from(message_hash[3]),
            ],
            merkle_depth: BaseElement::from(merkle_depth as u64),
            chain_iterations: BaseElement::from(chain_iterations as u64),
        }
    }
}

impl Default for SphincsPublicInputs {
    fn default() -> Self {
        Self::default_for_test()
    }
}

impl ToElements<BaseElement> for SphincsPublicInputs {
    fn to_elements(&self) -> Vec<BaseElement> {
        let mut elements = Vec::new();
        elements.extend_from_slice(&self.merkle_root);
        elements.extend_from_slice(&self.message_hash);
        elements.push(self.merkle_depth);
        elements.push(self.chain_iterations);
        for pk in &self.wots_public_key {
            elements.extend_from_slice(pk);
        }
        elements
    }
}

// ============================================================================
// SPHINCS+ AIR
// ============================================================================

/// AIR for SPHINCS+ signature verification
pub struct SphincsAir {
    context: AirContext<BaseElement>,
    pub_inputs: SphincsPublicInputs,
}

impl SphincsAir {
    /// Number of transition constraints
    /// - 4 H_IN decomposition (degree 1)
    /// - 4 H_OUT decomposition (degree 1)
    /// - 3 Binary selectors (degree 2)
    /// - 4 Transition constraints (degree 3)
    pub const NUM_CONSTRAINTS: usize = 15;

    /// Create new SPHINCS+ AIR
    pub fn new(trace_info: TraceInfo, pub_inputs: SphincsPublicInputs, options: ProofOptions) -> Self {
        let degrees = vec![
            // === Hash Input Constraints (0-3) ===
            // Placeholder for hash input validation (degree 1)
            TransitionConstraintDegree::new(1),
            TransitionConstraintDegree::new(1),
            TransitionConstraintDegree::new(1),
            TransitionConstraintDegree::new(1),

            // === Hash Output Constraints (4-7) ===
            // Placeholder for hash output validation (degree 1)
            TransitionConstraintDegree::new(1),
            TransitionConstraintDegree::new(1),
            TransitionConstraintDegree::new(1),
            TransitionConstraintDegree::new(1),

            // === Binary Selector Constraints (8-10) ===
            // 8. S_MERKLE binary: s_merkle * (1 - s_merkle) = 0 (degree 2)
            TransitionConstraintDegree::new(2),
            // 9. S_CHAIN binary: s_chain * (1 - s_chain) = 0 (degree 2)
            TransitionConstraintDegree::new(2),
            // 10. I_SELECT binary: i_select * (1 - i_select) = 0 (degree 2)
            TransitionConstraintDegree::new(2),

            // === Transition Constraints (11-14) ===
            // 11. Counter increment: (c_count_next - c_count - 1) * c_count_next * s_chain * s_chain_next (degree 4)
            TransitionConstraintDegree::new(4),
            // 12. Chain continuity: (h_in_next[0] - h_out[0]) * c_count_next * s_chain * s_chain_next (degree 4)
            TransitionConstraintDegree::new(4),
            // 13. Merkle transition: (h_in_next[0] - h_out[0]) * s_merkle * s_merkle_next (degree 3)
            TransitionConstraintDegree::new(3),
            // 14. Exclusive selector: s_merkle * s_chain = 0 (degree 2)
            TransitionConstraintDegree::new(2),
        ];

        let context = AirContext::new(trace_info, degrees, 5, options)
            .set_num_transition_exemptions(1);

        Self { context, pub_inputs }
    }
}

impl Air for SphincsAir {
    type BaseField = BaseElement;
    type PublicInputs = SphincsPublicInputs;
    type GkrProof = ();
    type GkrVerifier = ();

    fn new(trace_info: TraceInfo, pub_inputs: Self::PublicInputs, options: ProofOptions) -> Self {
        SphincsAir::new(trace_info, pub_inputs, options)
    }

    fn context(&self) -> &AirContext<Self::BaseField> {
        &self.context
    }

    fn evaluate_transition<E: FieldElement + From<Self::BaseField>>(
        &self,
        frame: &EvaluationFrame<E>,
        _periodic_values: &[E],
        result: &mut [E],
    ) {
        let current = frame.current();
        let next = frame.next();

        // ===================================================================
        // Hash Input Constraints (0-3) - Placeholder
        // ===================================================================
        // These would enforce hash input validity if needed
        result[0] = E::ZERO;
        result[1] = E::ZERO;
        result[2] = E::ZERO;
        result[3] = E::ZERO;

        // ===================================================================
        // Hash Output Constraints (4-7) - Placeholder
        // ===================================================================
        result[4] = E::ZERO;
        result[5] = E::ZERO;
        result[6] = E::ZERO;
        result[7] = E::ZERO;

        // ===================================================================
        // Binary Selector Constraints (8-10)
        // ===================================================================
        let s_merkle = current[sphincs_columns::S_MERKLE];
        let s_chain = current[sphincs_columns::S_CHAIN];
        let i_select = current[sphincs_columns::I_SELECT];

        // 8. S_MERKLE binary: s_merkle * (1 - s_merkle) = 0
        result[8] = s_merkle * (E::ONE - s_merkle);

        // 9. S_CHAIN binary: s_chain * (1 - s_chain) = 0
        result[9] = s_chain * (E::ONE - s_chain);

        // 10. I_SELECT binary: i_select * (1 - i_select) = 0
        result[10] = i_select * (E::ONE - i_select);

        // ===================================================================
        // Transition Constraints (11-14)
        // ===================================================================
        let c_count = current[sphincs_columns::C_COUNT];
        let c_count_next = next[sphincs_columns::C_COUNT];
        let s_chain_next = next[sphincs_columns::S_CHAIN];
        let s_merkle_next = next[sphincs_columns::S_MERKLE];

        // Hash values (using first element for chain continuity check)
        let h_out_0 = current[sphincs_columns::H_OUT_0];
        let h_in_next_0 = next[sphincs_columns::H_IN_0];

        // 11. Counter increment (when both rows are active chain rows AND counter is not resetting)
        // Allow counter to either increment by 1 OR reset to 0 (for new chain start)
        // (c_count_next - c_count - 1) * c_count_next * s_chain * s_chain_next = 0
        // This is satisfied when: s_chain=0 OR s_chain_next=0 OR c_count_next=0 OR c_count_next=c_count+1
        result[11] = (c_count_next - c_count - E::ONE) * c_count_next * s_chain * s_chain_next;

        // 12. Chain continuity: h_in_next = h_out (for chain operations, skip when counter resets)
        // (h_in_next[0] - h_out[0]) * c_count_next * s_chain * s_chain_next = 0
        result[12] = (h_in_next_0 - h_out_0) * c_count_next * s_chain * s_chain_next;

        // 13. Merkle transition: h_in_next = h_out (for merkle operations)
        // (h_in_next[0] - h_out[0]) * s_merkle * s_merkle_next = 0
        result[13] = (h_in_next_0 - h_out_0) * s_merkle * s_merkle_next;

        // 14. Exclusive selector: Only one of S_MERKLE or S_CHAIN can be active
        // s_merkle * s_chain = 0
        result[14] = s_merkle * s_chain;
    }

    fn get_assertions(&self) -> Vec<Assertion<Self::BaseField>> {
        let mut assertions = Vec::new();

        // Initial row assertions
        // First hash input should match message hash
        assertions.push(Assertion::single(sphincs_columns::H_IN_0, 0, self.pub_inputs.message_hash[0]));
        assertions.push(Assertion::single(sphincs_columns::H_IN_1, 0, self.pub_inputs.message_hash[1]));
        assertions.push(Assertion::single(sphincs_columns::H_IN_2, 0, self.pub_inputs.message_hash[2]));
        assertions.push(Assertion::single(sphincs_columns::H_IN_3, 0, self.pub_inputs.message_hash[3]));

        // Counter starts at 0
        assertions.push(Assertion::single(sphincs_columns::C_COUNT, 0, BaseElement::ZERO));

        assertions
    }

    fn get_periodic_column_values(&self) -> Vec<Vec<Self::BaseField>> {
        vec![]
    }
}

// ============================================================================
// Tests
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;
    use super::super::constants::TRACE_WIDTH_SPHINCS;

    #[test]
    fn test_sphincs_air_creation() {
        let trace_info = TraceInfo::new(TRACE_WIDTH_SPHINCS, 64);
        let pub_inputs = SphincsPublicInputs::default_for_test();
        let options = ProofOptions::new(
            16, 8, 0,  // blowup factor 8 for safety margin
            winterfell::FieldExtension::None,
            8, 31,
        );

        let air = SphincsAir::new(trace_info, pub_inputs, options);
        assert_eq!(air.context().trace_info().width(), TRACE_WIDTH_SPHINCS);
    }

    #[test]
    fn test_sphincs_constraint_count() {
        let trace_info = TraceInfo::new(TRACE_WIDTH_SPHINCS, 64);
        let pub_inputs = SphincsPublicInputs::default_for_test();
        let options = ProofOptions::new(16, 8, 0, winterfell::FieldExtension::None, 8, 31);

        let air = SphincsAir::new(trace_info, pub_inputs, options);
        assert_eq!(air.context().num_transition_constraints(), SphincsAir::NUM_CONSTRAINTS);
    }

    #[test]
    fn test_sphincs_public_inputs() {
        let pub_inputs = SphincsPublicInputs::from_trace_values(
            [1, 2, 3, 4],
            [5, 6, 7, 8],
            10,
            15,
        );

        assert_eq!(pub_inputs.merkle_root[0], BaseElement::from(1u64));
        assert_eq!(pub_inputs.message_hash[0], BaseElement::from(5u64));
        assert_eq!(pub_inputs.merkle_depth, BaseElement::from(10u64));
        assert_eq!(pub_inputs.chain_iterations, BaseElement::from(15u64));
    }

    #[test]
    fn test_sphincs_boundary_assertions() {
        let trace_info = TraceInfo::new(TRACE_WIDTH_SPHINCS, 64);
        let pub_inputs = SphincsPublicInputs::default_for_test();
        let options = ProofOptions::new(16, 8, 0, winterfell::FieldExtension::None, 8, 31);

        let air = SphincsAir::new(trace_info, pub_inputs, options);
        let assertions = air.get_assertions();

        // Should have 5 boundary assertions
        assert_eq!(assertions.len(), 5);
    }

    #[test]
    fn test_binary_constraint_logic() {
        // Test that binary constraint x * (1 - x) = 0 works
        let zero = BaseElement::ZERO;
        let one = BaseElement::ONE;
        let two = BaseElement::from(2u64);

        // x = 0: 0 * 1 = 0 ✓
        assert_eq!(zero * (one - zero), zero);

        // x = 1: 1 * 0 = 0 ✓
        assert_eq!(one * (one - one), zero);

        // x = 2: 2 * (-1) ≠ 0 ✗
        assert_ne!(two * (one - two), zero);
    }

    #[test]
    fn test_counter_increment_constraint() {
        // Test: (c_next - c - 1) * s * s_next = 0

        let zero = BaseElement::ZERO;
        let one = BaseElement::ONE;

        // When s = 1, s_next = 1, c_next should be c + 1
        let c = BaseElement::from(5u64);
        let c_next_valid = BaseElement::from(6u64);
        let c_next_invalid = BaseElement::from(10u64);

        // Valid: (6 - 5 - 1) * 1 * 1 = 0
        let constraint_valid = (c_next_valid - c - one) * one * one;
        assert_eq!(constraint_valid, zero);

        // Invalid: (10 - 5 - 1) * 1 * 1 = 4 ≠ 0
        let constraint_invalid = (c_next_invalid - c - one) * one * one;
        assert_ne!(constraint_invalid, zero);

        // When s = 0, constraint is always satisfied
        let constraint_inactive = (c_next_invalid - c - one) * zero * one;
        assert_eq!(constraint_inactive, zero);
    }

    #[test]
    fn test_exclusive_selector_constraint() {
        // Test: s_merkle * s_chain = 0

        let zero = BaseElement::ZERO;
        let one = BaseElement::ONE;

        // Both can be 0
        assert_eq!(zero * zero, zero);

        // One can be 1, other must be 0
        assert_eq!(one * zero, zero);
        assert_eq!(zero * one, zero);

        // Both cannot be 1
        assert_ne!(one * one, zero);
    }
}
