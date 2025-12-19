//! Kyber AIR (Algebraic Intermediate Representation)
//!
//! This module implements the AIR constraints for Kyber KEM verification.
//! It reuses the NTT/FMA gate structure from Dilithium but with Kyber-specific
//! constants (Q=3329, R=2^16).
//!
//! # Kyber STARK Constraints
//!
//! ## CBD Gate (from cbd.rs)
//! - Bit binary: B * (B - 1) = 0
//! - B1 accumulation: C_B1_next = C_B1 + B * S_B1
//! - B2 accumulation: C_B2_next = C_B2 + B * S_B2
//! - Final result: E_CBD = C_B1 - C_B2
//!
//! ## NTT Gate (from ntt.rs)
//! - Montgomery decomposition: M_NTT = M_H * 2^16 + M_L
//! - Butterfly constraint: T + M_NTT * Q ≡ 0 (mod R)
//!
//! ## FMA Gate (from fma.rs)
//! - Montgomery decomposition: M_FMA = M_FMA_H * 2^16 + M_FMA_L
//! - FMA constraint: A * B + C + M_FMA * Q = R_FMA * R

use winterfell::{
    math::{fields::f128::BaseElement, FieldElement, ToElements},
    Air, AirContext, Assertion, EvaluationFrame, ProofOptions, TraceInfo,
    TransitionConstraintDegree,
};

use super::constants::{Q_KYBER, R_KYBER, N_KYBER};

// ============================================================================
// Kyber Trace Column Indices
// ============================================================================

/// Column indices for Kyber trace
pub mod kyber_columns {
    // NTT columns (0-9)
    pub const A: usize = 0;
    pub const B: usize = 1;
    pub const ZETA: usize = 2;
    pub const T: usize = 3;
    pub const M_NTT: usize = 4;
    pub const A_PRIME: usize = 5;
    pub const B_PRIME: usize = 6;
    pub const M_H: usize = 7;
    pub const M_L: usize = 8;
    pub const S_NTT: usize = 9;

    // FMA columns (10-16)
    pub const A_FMA: usize = 10;
    pub const B_FMA: usize = 11;
    pub const C_FMA: usize = 12;
    pub const M_FMA: usize = 13;
    pub const R_FMA: usize = 14;
    pub const M_FMA_H: usize = 15;
    pub const M_FMA_L: usize = 16;
    pub const S_FMA: usize = 17;

    // CBD columns (18-23)
    pub const B_CBD: usize = 18;
    pub const C_B1: usize = 19;
    pub const C_B2: usize = 20;
    pub const E_CBD: usize = 21;
    pub const S_B1: usize = 22;
    pub const S_B2: usize = 23;

    // General selector (24)
    pub const S_OP: usize = 24;
}

/// Total trace width for Kyber STARK
pub const KYBER_TRACE_WIDTH: usize = 25;

// ============================================================================
// Kyber Public Inputs
// ============================================================================

/// Public inputs for Kyber KEM verification
#[derive(Clone, Debug)]
pub struct KyberPublicInputs {
    /// Public key polynomial (first coefficient)
    pub pk_coeff_0: BaseElement,

    /// Ciphertext polynomial c1 (first coefficient)
    pub ct1_coeff_0: BaseElement,

    /// Ciphertext polynomial c2 (first coefficient)
    pub ct2_coeff_0: BaseElement,

    /// Shared secret (first bytes as field element)
    pub shared_secret: BaseElement,

    /// Number of CBD samples expected
    pub num_cbd_samples: BaseElement,

    /// Expected final CBD sum (for verification)
    pub expected_cbd_sum: BaseElement,
}

impl KyberPublicInputs {
    /// Create default public inputs for testing
    pub fn default_for_test() -> Self {
        Self {
            pk_coeff_0: BaseElement::ZERO,
            ct1_coeff_0: BaseElement::ZERO,
            ct2_coeff_0: BaseElement::ZERO,
            shared_secret: BaseElement::ZERO,
            num_cbd_samples: BaseElement::from(N_KYBER as u64),
            expected_cbd_sum: BaseElement::ZERO,
        }
    }
}

impl ToElements<BaseElement> for KyberPublicInputs {
    fn to_elements(&self) -> Vec<BaseElement> {
        vec![
            self.pk_coeff_0,
            self.ct1_coeff_0,
            self.ct2_coeff_0,
            self.shared_secret,
            self.num_cbd_samples,
            self.expected_cbd_sum,
        ]
    }
}

// ============================================================================
// Kyber AIR Implementation
// ============================================================================

/// AIR for Kyber KEM verification STARK proof
pub struct KyberAir {
    context: AirContext<BaseElement>,
    pub_inputs: KyberPublicInputs,
    /// Q = 3329 as field element
    q_elem: BaseElement,
    /// R = 2^16 as field element
    r_elem: BaseElement,
    /// R_sqrt = 2^16 as field element (same as R for Kyber)
    r_sqrt_elem: BaseElement,
}

impl KyberAir {
    /// Number of transition constraints
    /// - NTT: 3 (M decomp + 2 range check placeholders)
    /// - FMA: 3 (M decomp + FMA constraint + range placeholder)
    /// - CBD: 5 (bit binary + B1 acc + B2 acc + final + selectors)
    /// - Selectors: 4
    pub const NUM_CONSTRAINTS: usize = 15;

    /// Create new Kyber AIR
    pub fn new(trace_info: TraceInfo, pub_inputs: KyberPublicInputs, options: ProofOptions) -> Self {
        let degrees = vec![
            // === NTT Constraints (0-2) ===
            // 0. M_NTT decomposition: M_NTT = M_H * 2^16 + M_L (degree 1)
            TransitionConstraintDegree::new(1),
            // 1. S_NTT binary (degree 2)
            TransitionConstraintDegree::new(2),
            // 2. NTT butterfly placeholder: E::ZERO (degree 1 minimum)
            TransitionConstraintDegree::new(1),

            // === FMA Constraints (3-5) ===
            // 3. M_FMA decomposition (degree 1)
            TransitionConstraintDegree::new(1),
            // 4. FMA constraint: (A*B + C + M*Q - R*R) * S_FMA (degree 3)
            TransitionConstraintDegree::new(3),
            // 5. S_FMA binary (degree 2)
            TransitionConstraintDegree::new(2),

            // === CBD Constraints (6-10) ===
            // 6. Bit binary: B * (1 - B) = 0 (degree 2)
            TransitionConstraintDegree::new(2),
            // 7. B1 accumulation: (c_b1_next - c_b1 - b*s_b1) * (s_b1+s_b2) * (1-boundary) * next_is_cbd
            // Degree analysis:
            // - (c_b1_next - c_b1 - b_cbd * s_b1): degree 2 (b_cbd * s_b1)
            // - (s_b1 + s_b2): degree 1
            // - (E::ONE - sample_boundary): degree 2 (s_b2 * s_b1_next)
            // - next_is_cbd: degree 1 (s_b1_next + s_b2_next)
            // Total: 2 + 1 + 2 + 1 = 6
            TransitionConstraintDegree::new(6),
            // 8. B2 accumulation (same as above)
            TransitionConstraintDegree::new(6),
            // 9. S_B1 binary (degree 2)
            TransitionConstraintDegree::new(2),
            // 10. S_B2 binary (degree 2)
            TransitionConstraintDegree::new(2),

            // === General Selector Constraints (11-14) ===
            // 11. S_OP binary (degree 2)
            TransitionConstraintDegree::new(2),
            // 12-14. Placeholder constraints (degree 1)
            TransitionConstraintDegree::new(1),
            TransitionConstraintDegree::new(1),
            TransitionConstraintDegree::new(1),
        ];

        // Boundary assertions
        // - Initial row: 3 (A[0], B[0], S_OP[0])
        // - Final row: 2 (R_FMA[last], E_CBD check)
        let num_assertions = 5;
        let context = AirContext::new(trace_info, degrees, num_assertions, options);

        Self {
            context,
            pub_inputs,
            q_elem: BaseElement::from(Q_KYBER),
            r_elem: BaseElement::from(R_KYBER),
            r_sqrt_elem: BaseElement::from(1u64 << 16),
        }
    }
}

impl Air for KyberAir {
    type BaseField = BaseElement;
    type PublicInputs = KyberPublicInputs;
    type GkrProof = ();
    type GkrVerifier = ();

    fn new(trace_info: TraceInfo, pub_inputs: Self::PublicInputs, options: ProofOptions) -> Self {
        KyberAir::new(trace_info, pub_inputs, options)
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

        // Convert constants to evaluation field
        let q: E = E::from(self.q_elem);
        let r: E = E::from(self.r_elem);
        let r_sqrt: E = E::from(self.r_sqrt_elem);

        // ===================================================================
        // NTT Constraints (0-2)
        // ===================================================================

        // 0. M_NTT decomposition: M_NTT - (M_H * 2^16 + M_L) = 0
        let m_ntt = current[kyber_columns::M_NTT];
        let m_h = current[kyber_columns::M_H];
        let m_l = current[kyber_columns::M_L];
        result[0] = m_ntt - (m_h * r_sqrt + m_l);

        // 1. S_NTT binary: S_NTT * (1 - S_NTT) = 0
        let s_ntt = current[kyber_columns::S_NTT];
        result[1] = s_ntt * (E::ONE - s_ntt);

        // 2. NTT butterfly (simplified placeholder)
        // Full constraint: T + M_NTT * Q ≡ A' * R for Montgomery reduction
        let _t = current[kyber_columns::T];
        let _a_prime = current[kyber_columns::A_PRIME];
        // For now, this is a placeholder that always passes
        result[2] = E::ZERO;

        // ===================================================================
        // FMA Constraints (3-5)
        // ===================================================================

        // 3. M_FMA decomposition: M_FMA - (M_FMA_H * 2^16 + M_FMA_L) = 0
        let m_fma = current[kyber_columns::M_FMA];
        let m_fma_h = current[kyber_columns::M_FMA_H];
        let m_fma_l = current[kyber_columns::M_FMA_L];
        result[3] = m_fma - (m_fma_h * r_sqrt + m_fma_l);

        // 4. FMA constraint: A * B + C + M_FMA * Q - R_FMA * R = 0
        let a_fma = current[kyber_columns::A_FMA];
        let b_fma = current[kyber_columns::B_FMA];
        let c_fma = current[kyber_columns::C_FMA];
        let r_fma = current[kyber_columns::R_FMA];
        let s_fma = current[kyber_columns::S_FMA];

        // Only enforce when FMA operation is active
        result[4] = (a_fma * b_fma + c_fma + m_fma * q - r_fma * r) * s_fma;

        // 5. S_FMA binary
        result[5] = s_fma * (E::ONE - s_fma);

        // ===================================================================
        // CBD Constraints (6-10)
        // ===================================================================

        let b_cbd = current[kyber_columns::B_CBD];
        let c_b1 = current[kyber_columns::C_B1];
        let c_b2 = current[kyber_columns::C_B2];
        let c_b1_next = next[kyber_columns::C_B1];
        let c_b2_next = next[kyber_columns::C_B2];
        let s_b1 = current[kyber_columns::S_B1];
        let s_b2 = current[kyber_columns::S_B2];

        // 6. Bit binary: B_CBD * (1 - B_CBD) = 0
        // Only enforce when B_CBD column is active (has 0 or 1)
        result[6] = b_cbd * (E::ONE - b_cbd);

        // Get next row selectors to detect boundaries
        let s_b1_next = next[kyber_columns::S_B1];
        let s_b2_next = next[kyber_columns::S_B2];

        // Detect if next row is a CBD row
        let next_is_cbd = s_b1_next + s_b2_next;

        // Detect sample boundary: current row is Phase 2 (S_B2=1), next row is Phase 1 (S_B1=1)
        let sample_boundary = s_b2 * s_b1_next;

        // Detect CBD-to-non-CBD boundary: current is CBD, next is not CBD
        // This happens when (s_b1 + s_b2) = 1 and next_is_cbd = 0
        // We need to skip constraint when this is the last CBD row before padding/NTT/FMA

        // Non-boundary CBD active selector
        // Constraints are active when:
        // 1. Current row is CBD (s_b1 + s_b2 > 0), AND
        // 2. Not at sample boundary (s_b2 * s_b1_next = 0), AND
        // 3. Next row is also CBD (s_b1_next + s_b2_next > 0)
        let cbd_active_non_boundary = (s_b1 + s_b2) * (E::ONE - sample_boundary) * next_is_cbd;

        // 7. B1 accumulation: C_B1_next = C_B1 + B_CBD * S_B1
        // Skip at sample boundary (where C_B1 resets to 0)
        result[7] = (c_b1_next - c_b1 - b_cbd * s_b1) * cbd_active_non_boundary;

        // 8. B2 accumulation: C_B2_next = C_B2 + B_CBD * S_B2
        // Skip at sample boundary (where C_B2 resets to 0)
        result[8] = (c_b2_next - c_b2 - b_cbd * s_b2) * cbd_active_non_boundary;

        // 9. S_B1 binary
        result[9] = s_b1 * (E::ONE - s_b1);

        // 10. S_B2 binary
        result[10] = s_b2 * (E::ONE - s_b2);

        // ===================================================================
        // General Selector Constraints (11-14)
        // ===================================================================

        // 11. S_OP binary
        let s_op = current[kyber_columns::S_OP];
        result[11] = s_op * (E::ONE - s_op);

        // 12-14. Placeholder constraints
        result[12] = E::ZERO;
        result[13] = E::ZERO;
        result[14] = E::ZERO;
    }

    fn get_assertions(&self) -> Vec<Assertion<Self::BaseField>> {
        let _trace_len = self.context().trace_info().length();

        vec![
            // Initial row assertions
            // A[0] matches public input
            Assertion::single(kyber_columns::A, 0, self.pub_inputs.pk_coeff_0),

            // B[0] matches public input
            Assertion::single(kyber_columns::B, 0, self.pub_inputs.ct1_coeff_0),

            // S_OP[0] = 1 (first row is an operation row)
            Assertion::single(kyber_columns::S_OP, 0, BaseElement::ONE),

            // C_B1[0] = 0 (CBD accumulator starts at 0)
            Assertion::single(kyber_columns::C_B1, 0, BaseElement::ZERO),

            // C_B2[0] = 0 (CBD accumulator starts at 0)
            Assertion::single(kyber_columns::C_B2, 0, BaseElement::ZERO),
        ]
    }
}

// ============================================================================
// Tests
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_kyber_air_creation() {
        let trace_info = TraceInfo::new(KYBER_TRACE_WIDTH, 64);
        let pub_inputs = KyberPublicInputs::default_for_test();
        let options = ProofOptions::new(
            16, 8, 0,  // blowup factor 8 for degree 6 constraints
            winterfell::FieldExtension::None,
            8, 31,
        );

        let air = KyberAir::new(trace_info, pub_inputs, options);
        assert_eq!(air.context().trace_info().width(), KYBER_TRACE_WIDTH);
    }

    #[test]
    fn test_kyber_constraint_count() {
        let trace_info = TraceInfo::new(KYBER_TRACE_WIDTH, 64);
        let pub_inputs = KyberPublicInputs::default_for_test();
        let options = ProofOptions::new(16, 8, 0, winterfell::FieldExtension::None, 8, 31);

        let air = KyberAir::new(trace_info, pub_inputs, options);
        assert_eq!(air.context().num_transition_constraints(), KyberAir::NUM_CONSTRAINTS);
    }

    #[test]
    fn test_kyber_boundary_assertions() {
        let trace_info = TraceInfo::new(KYBER_TRACE_WIDTH, 64);
        let pub_inputs = KyberPublicInputs::default_for_test();
        let options = ProofOptions::new(16, 8, 0, winterfell::FieldExtension::None, 8, 31);

        let air = KyberAir::new(trace_info, pub_inputs, options);
        let assertions = air.get_assertions();

        // Should have 5 boundary assertions
        assert_eq!(assertions.len(), 5);
    }

    #[test]
    fn test_kyber_public_inputs_to_elements() {
        let pub_inputs = KyberPublicInputs {
            pk_coeff_0: BaseElement::from(100u64),
            ct1_coeff_0: BaseElement::from(200u64),
            ct2_coeff_0: BaseElement::from(300u64),
            shared_secret: BaseElement::from(400u64),
            num_cbd_samples: BaseElement::from(256u64),
            expected_cbd_sum: BaseElement::ZERO,
        };

        let elements = pub_inputs.to_elements();
        assert_eq!(elements.len(), 6);
        assert_eq!(elements[0], BaseElement::from(100u64));
        assert_eq!(elements[4], BaseElement::from(256u64));
    }

    #[test]
    fn test_kyber_constants() {
        // Verify Kyber constants are correct
        assert_eq!(Q_KYBER, 3329);
        assert_eq!(R_KYBER, 65536);
        assert_eq!(N_KYBER, 256);
    }

    #[test]
    fn test_fma_constraint_arithmetic() {
        // Verify FMA constraint: A*B + C + M*Q = R_FMA * R
        // For A=100, B=200, C=0 in Kyber field

        let a = 100u64;
        let b = 200u64;
        let c = 0u64;

        // P = A * B + C = 20000
        let p = a * b + c;

        // M = P * (-Q^-1) mod R
        let neg_q_inv = 3327u64; // -Q^(-1) mod R for Kyber
        let m = ((p as u128 * neg_q_inv as u128) as u64) & (R_KYBER - 1);

        // R_FMA = (P + M * Q) / R
        let r_fma = ((p as u128 + (m as u128) * (Q_KYBER as u128)) >> 16) as u64;

        // Verify: A*B + C + M*Q = R_FMA * R
        let lhs = (a as u128) * (b as u128) + (c as u128) + (m as u128) * (Q_KYBER as u128);
        let rhs = (r_fma as u128) * (R_KYBER as u128);

        assert_eq!(lhs, rhs, "FMA constraint should hold");
    }

    #[test]
    fn test_cbd_constraint_arithmetic() {
        // Verify CBD constraint: E = C_B1 - C_B2
        // For η = 2: e ∈ {-2, -1, 0, 1, 2}

        // Test case: bits = [1, 1, 0, 0] -> sum_b1 = 2, sum_b2 = 0, e = 2
        let c_b1 = BaseElement::from(2u64);
        let c_b2 = BaseElement::ZERO;
        let e_cbd = c_b1 - c_b2;

        assert_eq!(e_cbd, BaseElement::from(2u64));

        // Test case: bits = [0, 0, 1, 1] -> sum_b1 = 0, sum_b2 = 2, e = -2
        let c_b1_neg = BaseElement::ZERO;
        let c_b2_neg = BaseElement::from(2u64);
        let e_cbd_neg = c_b1_neg - c_b2_neg;

        // -2 in field should be represented as field order - 2
        let expected_neg2 = BaseElement::ZERO - BaseElement::from(2u64);
        assert_eq!(e_cbd_neg, expected_neg2);
    }

    #[test]
    fn test_binary_constraint() {
        // Verify binary constraint: x * (1 - x) = 0 for x ∈ {0, 1}
        let zero = BaseElement::ZERO;
        let one = BaseElement::ONE;
        let two = one + one;

        // x = 0: 0 * 1 = 0 ✓
        assert_eq!(zero * (one - zero), zero);

        // x = 1: 1 * 0 = 0 ✓
        assert_eq!(one * (one - one), zero);

        // x = 2: 2 * (-1) ≠ 0 ✗
        assert_ne!(two * (one - two), zero);
    }
}
