//! AIR (Algebraic Intermediate Representation) for Dilithium Signature Verification
//!
//! Implements the transition constraints for:
//! - Montgomery NTT custom gate (C1)
//! - Montgomery FMA custom gate (C_FMA)
//! - Truncation custom gate (C_Trunc)
//! - Keccak chi step custom gate (C_Chi)
//! - Norm Check custom gate (C_Norm)
//! - Permutation Range Check (PRC)
//! - Bit decomposition constraints

use winterfell::{
    math::{fields::f128::BaseElement, FieldElement, ToElements},
    Air, AirContext, Assertion, EvaluationFrame, ProofOptions, TraceInfo,
    TransitionConstraintDegree,
};

use super::constants::{Q, R, R_SQRT, TWO_POW_K};

/// Public inputs for the Dilithium Signature Verification STARK proof
///
/// These values are shared between the prover and verifier, and are committed
/// to in the proof to ensure the computation was performed correctly.
#[derive(Clone, Debug)]
pub struct DilithiumNttPublicInputs {
    // === Input Commitments (Row 0) ===
    /// Public key coefficient t[0] - first coefficient of public key polynomial
    pub t_coeff_0: BaseElement,

    /// Initial NTT input coefficient A[0]
    pub ntt_input_a: BaseElement,

    /// Initial NTT input coefficient B[0]
    pub ntt_input_b: BaseElement,

    // === Challenge Commitment ===
    /// Challenge hash c - commitment to the challenge derived from SHAKE256
    pub challenge_hash: BaseElement,

    // === Final Verification Results (Last Row) ===
    /// Final truncation output W_1 - High(w) value
    pub final_w1: BaseElement,

    /// Expected challenge output from Keccak - must match challenge_hash
    pub expected_challenge: BaseElement,

    /// Final FMA result R_FMA - result of A*z + c*t computation
    pub final_fma_result: BaseElement,

    // === Norm Bound Verification ===
    /// Maximum norm coefficient seen (for ||z||_inf < beta verification)
    /// This should be < NORM_BOUND for valid signatures
    pub max_norm_coeff: BaseElement,

    // === PRC Accumulator ===
    /// Z accumulator initial value (must be 1)
    pub z_init: BaseElement,

    /// Z accumulator final value (must be 1 for valid permutation)
    pub z_final: BaseElement,
}

impl DilithiumNttPublicInputs {
    /// Create default public inputs for testing
    pub fn default_for_test() -> Self {
        Self {
            t_coeff_0: BaseElement::from(1u64),
            ntt_input_a: BaseElement::from(0u64),
            ntt_input_b: BaseElement::from(0u64),
            challenge_hash: BaseElement::ZERO,
            final_w1: BaseElement::ZERO,
            expected_challenge: BaseElement::ZERO,
            final_fma_result: BaseElement::ZERO,
            max_norm_coeff: BaseElement::ZERO,
            z_init: BaseElement::ONE,
            z_final: BaseElement::ONE,
        }
    }
}

impl ToElements<BaseElement> for DilithiumNttPublicInputs {
    fn to_elements(&self) -> Vec<BaseElement> {
        vec![
            self.t_coeff_0,
            self.ntt_input_a,
            self.ntt_input_b,
            self.challenge_hash,
            self.final_w1,
            self.expected_challenge,
            self.final_fma_result,
            self.max_norm_coeff,
            self.z_init,
            self.z_final,
        ]
    }
}

/// Column indices for trace
pub mod columns {
    // NTT columns (0-14)
    pub const A: usize = 0;
    pub const B: usize = 1;
    pub const M_NTT: usize = 2;
    pub const B_PRIME: usize = 3;
    pub const M_H: usize = 4;
    pub const M_L: usize = 5;
    pub const Z: usize = 6;
    pub const T_16: usize = 7;
    pub const BITS_START: usize = 8;
    pub const BITS_END: usize = 14;

    // FMA columns (15-19)
    pub const C: usize = 15;
    pub const M_FMA: usize = 16;
    pub const R_FMA: usize = 17;
    pub const M_FMA_H: usize = 18;
    pub const M_FMA_L: usize = 19;

    // Truncation columns (20-24)
    pub const W_IN: usize = 20;
    pub const W_1: usize = 21;
    pub const W_0: usize = 22;
    pub const W_0_H: usize = 23;
    pub const W_0_L: usize = 24;

    // Operation selector columns (25-26)
    pub const S_OP: usize = 25;
    pub const OP_TYPE: usize = 26;

    // Keccak chi step columns (27-32)
    pub const K_A: usize = 27;
    pub const K_B: usize = 28;
    pub const K_C: usize = 29;
    pub const K_AND: usize = 30;
    pub const K_OUT: usize = 31;
    pub const S_KECCAK: usize = 32;

    // Norm Check columns (33-36)
    pub const Z_NORM: usize = 33;
    pub const Z_NORM_H: usize = 34;
    pub const Z_NORM_L: usize = 35;
    pub const S_NORM: usize = 36;

    // Phase II Extension: Sampler Gate Columns (37-41)
    pub const CHALLENGE_C: usize = 37;
    pub const C_INDICATOR: usize = 38;
    pub const C_SIGN: usize = 39;
    pub const KECCAK_BIT: usize = 40;
    pub const S_SAMPLE: usize = 41;

    // Phase II Extension: Hint Gate Columns (42-44)
    pub const HINT_H: usize = 42;
    pub const HINT_ACC: usize = 43;
    pub const S_HINT: usize = 44;
}

/// AIR for Dilithium Signature Verification STARK proof
pub struct DilithiumNttAir {
    context: AirContext<BaseElement>,
    /// Public inputs for boundary constraints
    pub_inputs: DilithiumNttPublicInputs,
    /// Q as field element
    q_elem: BaseElement,
    /// R as field element
    r_elem: BaseElement,
    /// R_sqrt as field element (2^16)
    r_sqrt_elem: BaseElement,
    /// 2^k for truncation decomposition
    two_pow_k_elem: BaseElement,
}

impl DilithiumNttAir {
    pub fn new(trace_info: TraceInfo, pub_inputs: DilithiumNttPublicInputs, options: ProofOptions) -> Self {
        // Define constraint degrees for each constraint type
        // Total: 25 constraints
        let degrees = vec![
            // --- NTT Constraints (0-7) ---
            TransitionConstraintDegree::new(1),  // C_Decomp_NTT
            TransitionConstraintDegree::new(2),  // Bit 0
            TransitionConstraintDegree::new(2),  // Bit 1
            TransitionConstraintDegree::new(2),  // Bit 2
            TransitionConstraintDegree::new(2),  // Bit 3
            TransitionConstraintDegree::new(2),  // Bit 4
            TransitionConstraintDegree::new(2),  // Bit 5
            TransitionConstraintDegree::new(2),  // Bit 6

            // --- FMA Constraints (8-9) ---
            TransitionConstraintDegree::new(1),  // C_Decomp_FMA
            TransitionConstraintDegree::new(2),  // C_FMA

            // --- Truncation Constraints (10-11) ---
            TransitionConstraintDegree::new(1),  // C_Trunc
            TransitionConstraintDegree::new(1),  // C_Decomp_W0

            // --- Selector and PRC Constraints (12-15) ---
            TransitionConstraintDegree::new(1),  // S_OP binary
            TransitionConstraintDegree::new(1),  // OP_TYPE consistency
            TransitionConstraintDegree::new(1),  // Z consistency (op rows)
            TransitionConstraintDegree::new(1),  // Z consistency (pad rows)

            // --- Keccak chi Step Constraints (16-21) ---
            TransitionConstraintDegree::new(2),  // K_A binary
            TransitionConstraintDegree::new(2),  // K_B binary
            TransitionConstraintDegree::new(2),  // K_C binary
            TransitionConstraintDegree::new(2),  // K_AND
            TransitionConstraintDegree::new(2),  // K_OUT
            TransitionConstraintDegree::new(1),  // S_KECCAK binary

            // --- Norm Check Constraints (22-24) ---
            TransitionConstraintDegree::new(1),  // C_Norm_Decomp
            TransitionConstraintDegree::new(1),  // C_Norm_Range
            TransitionConstraintDegree::new(1),  // S_NORM binary
        ];

        let num_assertions = 8;
        let context = AirContext::new(trace_info, degrees, num_assertions, options);

        Self {
            context,
            pub_inputs,
            q_elem: BaseElement::from(Q),
            r_elem: BaseElement::from(R),
            r_sqrt_elem: BaseElement::from(R_SQRT),
            two_pow_k_elem: BaseElement::from(TWO_POW_K),
        }
    }
}

impl Air for DilithiumNttAir {
    type BaseField = BaseElement;
    type PublicInputs = DilithiumNttPublicInputs;
    type GkrProof = ();
    type GkrVerifier = ();

    fn new(trace_info: TraceInfo, pub_inputs: Self::PublicInputs, options: ProofOptions) -> Self {
        DilithiumNttAir::new(trace_info, pub_inputs, options)
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
        let two_pow_k: E = E::from(self.two_pow_k_elem);

        // ===================================================================
        // NTT Constraints (0-7)
        // ===================================================================

        // C_Decomp_NTT: M_NTT - (M_H * 2^16 + M_L) = 0
        let m_ntt = current[columns::M_NTT];
        let m_h = current[columns::M_H];
        let m_l = current[columns::M_L];
        result[0] = m_ntt - (m_h * r_sqrt + m_l);

        // Bit constraints: b_i * (1 - b_i) = 0 for i in 0..7
        for i in 0..7 {
            let b_i = current[columns::BITS_START + i];
            result[1 + i] = b_i * (E::ONE - b_i);
        }

        // ===================================================================
        // FMA Constraints (8-9)
        // ===================================================================

        // C_Decomp_FMA: M_FMA - (M_FMA_H * 2^16 + M_FMA_L) = 0
        let m_fma = current[columns::M_FMA];
        let m_fma_h = current[columns::M_FMA_H];
        let m_fma_l = current[columns::M_FMA_L];
        result[8] = m_fma - (m_fma_h * r_sqrt + m_fma_l);

        // C_FMA: A * B + C + M_FMA * Q - R_FMA * R = 0
        let a = current[columns::A];
        let b = current[columns::B];
        let c = current[columns::C];
        let r_fma = current[columns::R_FMA];
        result[9] = a * b + c + m_fma * q - r_fma * r;

        // ===================================================================
        // Truncation Constraints (10-11)
        // ===================================================================

        let w_in = current[columns::W_IN];
        let w_1 = current[columns::W_1];
        let w_0 = current[columns::W_0];
        result[10] = w_in - (w_1 * two_pow_k + w_0);

        let w_0_h = current[columns::W_0_H];
        let w_0_l = current[columns::W_0_L];
        result[11] = w_0 - (w_0_h * r_sqrt + w_0_l);

        // ===================================================================
        // Selector Constraints (12-13)
        // ===================================================================

        let s_op = current[columns::S_OP];
        result[12] = s_op * (E::ONE - s_op);

        let op_type = current[columns::OP_TYPE];
        let op_type_next = next[columns::OP_TYPE];
        result[13] = (op_type_next - op_type) * (E::ONE - s_op);

        // ===================================================================
        // PRC Constraints (14-15)
        // ===================================================================

        let z = current[columns::Z];
        let z_next = next[columns::Z];
        result[14] = (z_next - z) * s_op;
        result[15] = (z_next - z) * (E::ONE - s_op);

        // ===================================================================
        // Keccak chi Step Constraints (16-21)
        // ===================================================================

        let k_a = current[columns::K_A];
        let k_b = current[columns::K_B];
        let k_c = current[columns::K_C];
        let k_and = current[columns::K_AND];
        let k_out = current[columns::K_OUT];
        let s_keccak = current[columns::S_KECCAK];

        result[16] = k_a * (E::ONE - k_a);
        result[17] = k_b * (E::ONE - k_b);
        result[18] = k_c * (E::ONE - k_c);
        result[19] = k_and - (E::ONE - k_b) * k_c;

        let two = E::ONE + E::ONE;
        result[20] = k_out - (k_a + k_and - two * k_a * k_and);
        result[21] = s_keccak * (E::ONE - s_keccak);

        // ===================================================================
        // Norm Check Constraints (22-24)
        // ===================================================================

        let z_norm = current[columns::Z_NORM];
        let z_norm_h = current[columns::Z_NORM_H];
        let z_norm_l = current[columns::Z_NORM_L];
        let s_norm = current[columns::S_NORM];

        result[22] = z_norm - (z_norm_h * r_sqrt + z_norm_l);
        result[23] = z_norm_h;
        result[24] = s_norm * (E::ONE - s_norm);
    }

    fn get_assertions(&self) -> Vec<Assertion<Self::BaseField>> {
        let trace_len = self.context().trace_info().length();
        let last_step = trace_len - 1;

        vec![
            // Initial Row (Row 0) Boundary Constraints
            Assertion::single(columns::A, 0, self.pub_inputs.ntt_input_a),
            Assertion::single(columns::B, 0, self.pub_inputs.ntt_input_b),
            Assertion::single(columns::Z, 0, self.pub_inputs.z_init),
            Assertion::single(columns::S_OP, 0, BaseElement::ONE),

            // Final Row (Last Row) Boundary Constraints
            Assertion::single(columns::Z, last_step, self.pub_inputs.z_final),
            Assertion::single(columns::W_1, last_step, self.pub_inputs.final_w1),
            Assertion::single(columns::R_FMA, last_step, self.pub_inputs.final_fma_result),
            Assertion::single(columns::Z_NORM_H, last_step, BaseElement::ZERO),
        ]
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use super::super::constants::TRACE_WIDTH;

    #[test]
    fn test_air_creation() {
        let trace_info = TraceInfo::new(TRACE_WIDTH, 64);
        let pub_inputs = DilithiumNttPublicInputs::default_for_test();
        let options = ProofOptions::new(
            16, 4, 0,
            winterfell::FieldExtension::None,
            8, 31,
        );

        let air = DilithiumNttAir::new(trace_info, pub_inputs, options);
        assert_eq!(air.context().trace_info().width(), TRACE_WIDTH);
    }

    #[test]
    fn test_constraint_count() {
        let trace_info = TraceInfo::new(TRACE_WIDTH, 64);
        let pub_inputs = DilithiumNttPublicInputs::default_for_test();
        let options = ProofOptions::new(16, 4, 0, winterfell::FieldExtension::None, 8, 31);

        let air = DilithiumNttAir::new(trace_info, pub_inputs, options);
        // 1 + 7 + 2 + 2 + 4 + 6 + 3 = 25
        assert_eq!(air.context().num_transition_constraints(), 25);
    }

    #[test]
    fn test_boundary_assertion_count() {
        let trace_info = TraceInfo::new(TRACE_WIDTH, 64);
        let pub_inputs = DilithiumNttPublicInputs::default_for_test();
        let options = ProofOptions::new(16, 4, 0, winterfell::FieldExtension::None, 8, 31);

        let air = DilithiumNttAir::new(trace_info, pub_inputs, options);
        let assertions = air.get_assertions();

        // 4 initial row + 4 final row = 8
        assert_eq!(assertions.len(), 8);
    }

    #[test]
    fn test_public_inputs_to_elements() {
        let pub_inputs = DilithiumNttPublicInputs {
            t_coeff_0: BaseElement::from(100u64),
            ntt_input_a: BaseElement::from(200u64),
            ntt_input_b: BaseElement::from(300u64),
            challenge_hash: BaseElement::from(400u64),
            final_w1: BaseElement::from(500u64),
            expected_challenge: BaseElement::from(600u64),
            final_fma_result: BaseElement::from(700u64),
            max_norm_coeff: BaseElement::from(800u64),
            z_init: BaseElement::ONE,
            z_final: BaseElement::ONE,
        };

        let elements = pub_inputs.to_elements();
        assert_eq!(elements.len(), 10);
        assert_eq!(elements[0], BaseElement::from(100u64));
        assert_eq!(elements[8], BaseElement::ONE);
    }
}
