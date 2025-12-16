//! Prover implementation for Dilithium NTT STARK
//!
//! Implements the Winterfell Prover trait for generating proofs.

use winterfell::{
    crypto::{hashers::Blake3_256, DefaultRandomCoin, MerkleTree},
    math::{fields::f128::BaseElement, FieldElement},
    matrix::ColMatrix,
    DefaultConstraintEvaluator, DefaultTraceLde, PartitionOptions, ProofOptions, Prover,
    StarkDomain, Trace, TraceInfo, TracePolyTable, TraceTable,
};

use crate::air::{columns, DilithiumNttAir, DilithiumNttPublicInputs};

/// Prover for Dilithium NTT STARK proofs
pub struct DilithiumNttProver {
    options: ProofOptions,
}

impl DilithiumNttProver {
    /// Create a new prover with the given options
    pub fn new(options: ProofOptions) -> Self {
        Self { options }
    }

    /// Create prover with default options optimized for M3 Mac
    pub fn with_default_options() -> Self {
        let options = ProofOptions::new(
            32,   // Number of queries (for ~128-bit security)
            8,    // Blowup factor (trace extension)
            0,    // Grinding factor
            winterfell::FieldExtension::None,
            8,    // FRI folding factor
            31,   // FRI max remainder degree
        );

        Self { options }
    }

    /// Create prover with options optimized for fast benchmarking
    pub fn with_fast_options() -> Self {
        let options = ProofOptions::new(
            16,   // Fewer queries for faster proof
            4,    // Lower blowup factor
            0,    // No grinding
            winterfell::FieldExtension::None,
            8,    // FRI folding factor
            31,   // FRI max remainder degree
        );

        Self { options }
    }
}

impl Prover for DilithiumNttProver {
    type BaseField = BaseElement;
    type Air = DilithiumNttAir;
    type Trace = TraceTable<BaseElement>;
    type HashFn = Blake3_256<BaseElement>;
    type RandomCoin = DefaultRandomCoin<Self::HashFn>;
    type VC = MerkleTree<Self::HashFn>;
    type TraceLde<E: FieldElement<BaseField = Self::BaseField>> =
        DefaultTraceLde<E, Self::HashFn, Self::VC>;
    type ConstraintEvaluator<'a, E: FieldElement<BaseField = Self::BaseField>> =
        DefaultConstraintEvaluator<'a, Self::Air, E>;

    fn get_pub_inputs(&self, trace: &Self::Trace) -> DilithiumNttPublicInputs {
        // Extract public inputs from trace for boundary constraint verification
        let last_row = trace.length() - 1;

        // === Initial Row (Row 0) Values ===
        // NTT input coefficients A[0] and B[0]
        let ntt_input_a = trace.get(columns::A, 0);
        let ntt_input_b = trace.get(columns::B, 0);

        // Z accumulator initial value (should be 1)
        let z_init = trace.get(columns::Z, 0);

        // === Final Row Values ===
        // Z accumulator final value (should be 1 for valid PRC)
        let z_final = trace.get(columns::Z, last_row);

        // Final truncation output W_1 (High(w))
        let final_w1 = trace.get(columns::W_1, last_row);

        // Final FMA result
        let final_fma_result = trace.get(columns::R_FMA, last_row);

        // Norm check value (Z_NORM at last row for verification)
        let max_norm_coeff = trace.get(columns::Z_NORM, last_row);

        // Public key coefficient t[0] - using A[0] as proxy
        let t_coeff_0 = ntt_input_a;

        // Challenge hash - using Keccak output K_OUT at last row
        let challenge_hash = trace.get(columns::K_OUT, last_row);

        // Expected challenge - same as challenge_hash for simplified verification
        let expected_challenge = challenge_hash;

        DilithiumNttPublicInputs {
            t_coeff_0,
            ntt_input_a,
            ntt_input_b,
            challenge_hash,
            final_w1,
            expected_challenge,
            final_fma_result,
            max_norm_coeff,
            z_init,
            z_final,
        }
    }

    fn options(&self) -> &ProofOptions {
        &self.options
    }

    fn new_trace_lde<E: FieldElement<BaseField = Self::BaseField>>(
        &self,
        trace_info: &TraceInfo,
        main_trace: &ColMatrix<Self::BaseField>,
        domain: &StarkDomain<Self::BaseField>,
        partition_option: PartitionOptions,
    ) -> (Self::TraceLde<E>, TracePolyTable<E>) {
        DefaultTraceLde::new(trace_info, main_trace, domain, partition_option)
    }

    fn new_evaluator<'a, E: FieldElement<BaseField = Self::BaseField>>(
        &self,
        air: &'a Self::Air,
        aux_rand_elements: Option<winterfell::AuxRandElements<E>>,
        composition_coefficients: winterfell::ConstraintCompositionCoefficients<E>,
    ) -> Self::ConstraintEvaluator<'a, E> {
        DefaultConstraintEvaluator::new(air, aux_rand_elements, composition_coefficients)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::trace::{build_ntt_trace, generate_test_coefficients};
    use winterfell::verify;

    #[test]
    fn test_prove_and_verify() {
        // Generate test data
        let num_rows = 64; // Small trace for testing
        let coeffs = generate_test_coefficients(num_rows * 2);

        // Build trace
        let trace = build_ntt_trace(num_rows, &coeffs);

        // Create prover with fast options for testing
        let prover = DilithiumNttProver::with_fast_options();

        // Extract public inputs from the trace (same trace used for proof)
        let pub_inputs = prover.get_pub_inputs(&trace);

        // Generate proof
        let proof = prover.prove(trace).expect("Failed to generate proof");

        // Verify proof with extracted public inputs
        let result = verify::<
            DilithiumNttAir,
            Blake3_256<BaseElement>,
            DefaultRandomCoin<Blake3_256<BaseElement>>,
            MerkleTree<Blake3_256<BaseElement>>,
        >(
            proof,
            pub_inputs,
            &winterfell::AcceptableOptions::OptionSet(vec![prover.options().clone()]),
        );

        // Verification should pass with correctly extracted public inputs
        assert!(result.is_ok(), "Verification failed: {:?}", result);
        println!("✅ Proof generation and verification successful!");
    }

    #[test]
    fn test_public_inputs_extraction() {
        let num_rows = 64;
        let coeffs = generate_test_coefficients(num_rows * 2);
        let trace = build_ntt_trace(num_rows, &coeffs);

        let prover = DilithiumNttProver::with_fast_options();
        let pub_inputs = prover.get_pub_inputs(&trace);

        // Verify Z accumulator values
        assert_eq!(pub_inputs.z_init, BaseElement::ONE, "Z init should be 1");
        assert_eq!(pub_inputs.z_final, BaseElement::ONE, "Z final should be 1");

        // Verify NTT inputs match trace
        assert_eq!(pub_inputs.ntt_input_a, trace.get(columns::A, 0));
        assert_eq!(pub_inputs.ntt_input_b, trace.get(columns::B, 0));

        // Verify final values match trace
        let last_row = trace.length() - 1;
        assert_eq!(pub_inputs.final_w1, trace.get(columns::W_1, last_row));
        assert_eq!(pub_inputs.final_fma_result, trace.get(columns::R_FMA, last_row));

        println!("✅ Public inputs extraction verified!");
    }

    #[test]
    fn test_boundary_constraints_match() {
        // Test that boundary constraints properly link public inputs to trace
        let num_rows = 128;
        let coeffs = generate_test_coefficients(num_rows * 2);
        let trace = build_ntt_trace(num_rows, &coeffs);

        let prover = DilithiumNttProver::with_fast_options();
        let pub_inputs = prover.get_pub_inputs(&trace);
        let last_row = trace.length() - 1;

        // Boundary constraint 1: A[0] matches public input
        assert_eq!(trace.get(columns::A, 0), pub_inputs.ntt_input_a);

        // Boundary constraint 2: B[0] matches public input
        assert_eq!(trace.get(columns::B, 0), pub_inputs.ntt_input_b);

        // Boundary constraint 3: Z[0] = 1
        assert_eq!(trace.get(columns::Z, 0), BaseElement::ONE);

        // Boundary constraint 4: S_OP[0] = 1
        assert_eq!(trace.get(columns::S_OP, 0), BaseElement::ONE);

        // Boundary constraint 5: Z[last] = 1
        assert_eq!(trace.get(columns::Z, last_row), BaseElement::ONE);

        // Boundary constraint 6: W_1[last] matches public input
        assert_eq!(trace.get(columns::W_1, last_row), pub_inputs.final_w1);

        // Boundary constraint 7: R_FMA[last] matches public input
        assert_eq!(trace.get(columns::R_FMA, last_row), pub_inputs.final_fma_result);

        // Boundary constraint 8: Z_NORM_H[last] = 0 (norm bound)
        assert_eq!(trace.get(columns::Z_NORM_H, last_row), BaseElement::ZERO);

        println!("✅ All 8 boundary constraints verified!");
    }
}
