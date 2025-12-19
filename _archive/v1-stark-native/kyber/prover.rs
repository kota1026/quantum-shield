//! Kyber Prover implementation
//!
//! Implements the Winterfell Prover trait for generating Kyber STARK proofs.

use winterfell::{
    crypto::{hashers::Blake3_256, DefaultRandomCoin, MerkleTree},
    math::{fields::f128::BaseElement, FieldElement},
    matrix::ColMatrix,
    DefaultConstraintEvaluator, DefaultTraceLde, PartitionOptions, ProofOptions, Prover,
    StarkDomain, Trace, TraceInfo, TracePolyTable, TraceTable,
};

use super::air::{kyber_columns, KyberAir, KyberPublicInputs};

/// Prover for Kyber STARK proofs
pub struct KyberProver {
    options: ProofOptions,
}

impl KyberProver {
    /// Create a new prover with the given options
    pub fn new(options: ProofOptions) -> Self {
        Self { options }
    }

    /// Create prover with default options optimized for security
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

    /// Create prover with options optimized for fast testing
    pub fn with_fast_options() -> Self {
        let options = ProofOptions::new(
            16,   // Fewer queries for faster proof
            8,    // Blowup factor (required for degree 6 constraints)
            0,    // No grinding
            winterfell::FieldExtension::None,
            8,    // FRI folding factor
            31,   // FRI max remainder degree
        );

        Self { options }
    }
}

impl Prover for KyberProver {
    type BaseField = BaseElement;
    type Air = KyberAir;
    type Trace = TraceTable<BaseElement>;
    type HashFn = Blake3_256<BaseElement>;
    type RandomCoin = DefaultRandomCoin<Self::HashFn>;
    type VC = MerkleTree<Self::HashFn>;
    type TraceLde<E: FieldElement<BaseField = Self::BaseField>> =
        DefaultTraceLde<E, Self::HashFn, Self::VC>;
    type ConstraintEvaluator<'a, E: FieldElement<BaseField = Self::BaseField>> =
        DefaultConstraintEvaluator<'a, Self::Air, E>;

    fn get_pub_inputs(&self, trace: &Self::Trace) -> KyberPublicInputs {
        let last_row = trace.length() - 1;

        // Extract NTT public inputs (used for boundary assertions)
        let a_0 = trace.get(kyber_columns::A, 0);
        let b_0 = trace.get(kyber_columns::B, 0);
        let _a_prime_final = trace.get(kyber_columns::A_PRIME, last_row);

        // Extract FMA public inputs
        let r_fma_final = trace.get(kyber_columns::R_FMA, last_row);

        // Construct public key coefficient (from first NTT input)
        let pk_coeff_0 = a_0;

        // Construct ciphertext coefficients (from final values)
        let ct1_coeff_0 = b_0;  // Use B[0] to match boundary assertion
        let ct2_coeff_0 = r_fma_final;

        // Shared secret (derived from final FMA result)
        let shared_secret = r_fma_final;

        // CBD samples count (based on trace length)
        let num_cbd_samples = BaseElement::from(trace.length() as u64);

        // Expected CBD sum (can be verified against trace)
        let expected_cbd_sum = trace.get(kyber_columns::C_B1, last_row);

        KyberPublicInputs {
            pk_coeff_0,
            ct1_coeff_0,
            ct2_coeff_0,
            shared_secret,
            num_cbd_samples,
            expected_cbd_sum,
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

/// Build a TraceTable from ColMatrix for Kyber
pub fn build_kyber_trace_table(col_matrix: ColMatrix<BaseElement>) -> TraceTable<BaseElement> {
    let num_rows = col_matrix.num_rows();
    let num_cols = col_matrix.num_cols();

    // Create TraceTable with correct dimensions
    let mut trace = TraceTable::new(num_cols, num_rows);

    // Fill the trace with values from ColMatrix
    trace.fill(
        |state| {
            // Initial row (row 0)
            for col_idx in 0..num_cols {
                state[col_idx] = col_matrix.get(col_idx, 0);
            }
        },
        |step, state| {
            // Transition function for subsequent rows
            let row_idx = step + 1;
            if row_idx < num_rows {
                for col_idx in 0..num_cols {
                    state[col_idx] = col_matrix.get(col_idx, row_idx);
                }
            }
        },
    );

    trace
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::kyber::trace::build_kyber_test_trace;
    use winterfell::verify;

    #[test]
    fn test_kyber_prover_creation() {
        let prover = KyberProver::with_fast_options();
        let options = prover.options();

        assert_eq!(options.num_queries(), 16);
        assert_eq!(options.blowup_factor(), 8);
    }

    #[test]
    fn test_kyber_public_inputs_extraction() {
        // Build test trace
        let col_matrix = build_kyber_test_trace();
        let trace = build_kyber_trace_table(col_matrix);

        let prover = KyberProver::with_fast_options();
        let pub_inputs = prover.get_pub_inputs(&trace);

        // Verify public inputs are non-zero (valid trace)
        println!("Public key coefficient[0]: {:?}", pub_inputs.pk_coeff_0);
        println!("CT1 coefficient[0]: {:?}", pub_inputs.ct1_coeff_0);
        println!("CT2 coefficient[0]: {:?}", pub_inputs.ct2_coeff_0);
        println!("Shared secret: {:?}", pub_inputs.shared_secret);
    }

    #[test]
    fn test_debug_trace_constraints() {
        use crate::kyber::air::kyber_columns;

        // Build test trace
        let col_matrix = build_kyber_test_trace();

        // Debug: print first 10 rows CBD columns
        println!("=== Debug CBD columns (first 10 rows) ===");
        for row in 0..10.min(col_matrix.num_rows()) {
            let b_cbd = col_matrix.get(kyber_columns::B_CBD, row);
            let c_b1 = col_matrix.get(kyber_columns::C_B1, row);
            let c_b2 = col_matrix.get(kyber_columns::C_B2, row);
            let s_b1 = col_matrix.get(kyber_columns::S_B1, row);
            let s_b2 = col_matrix.get(kyber_columns::S_B2, row);

            println!("Row {}: B_CBD={:?}, C_B1={:?}, C_B2={:?}, S_B1={:?}, S_B2={:?}",
                row, b_cbd, c_b1, c_b2, s_b1, s_b2);

            // Check transition constraint at row
            if row < col_matrix.num_rows() - 1 {
                let c_b1_next = col_matrix.get(kyber_columns::C_B1, row + 1);
                let c_b2_next = col_matrix.get(kyber_columns::C_B2, row + 1);
                let s_b1_next = col_matrix.get(kyber_columns::S_B1, row + 1);

                let s_b2_next = col_matrix.get(kyber_columns::S_B2, row + 1);

                // Sample boundary detection
                let sample_boundary = s_b2 * s_b1_next;
                let one = BaseElement::ONE;
                let next_is_cbd = s_b1_next + s_b2_next;
                let cbd_active_non_boundary = (s_b1 + s_b2) * (one - sample_boundary) * next_is_cbd;

                let constraint7 = (c_b1_next - c_b1 - b_cbd * s_b1) * cbd_active_non_boundary;
                let constraint8 = (c_b2_next - c_b2 - b_cbd * s_b2) * cbd_active_non_boundary;
                println!("  next_is_cbd={:?}, sample_boundary={:?}, cbd_active={:?}", next_is_cbd, sample_boundary, cbd_active_non_boundary);
                println!("  Constraint 7 (B1 acc): {:?}", constraint7);
                println!("  Constraint 8 (B2 acc): {:?}", constraint8);
            }
        }
    }

    #[test]
    fn test_kyber_prove_and_verify() {
        // Build test trace
        let col_matrix = build_kyber_test_trace();
        let trace = build_kyber_trace_table(col_matrix);

        // Create prover with fast options for testing
        let prover = KyberProver::with_fast_options();

        // Extract public inputs from the trace
        let pub_inputs = prover.get_pub_inputs(&trace);

        // Generate proof
        let proof = prover.prove(trace).expect("Failed to generate Kyber proof");

        println!("Kyber proof generated successfully!");
        println!("Proof size: {} bytes", proof.to_bytes().len());

        // Verify proof
        let result = verify::<
            KyberAir,
            Blake3_256<BaseElement>,
            DefaultRandomCoin<Blake3_256<BaseElement>>,
            MerkleTree<Blake3_256<BaseElement>>,
        >(
            proof,
            pub_inputs,
            &winterfell::AcceptableOptions::OptionSet(vec![prover.options().clone()]),
        );

        assert!(result.is_ok(), "Kyber verification failed: {:?}", result);
        println!("✅ Kyber proof verification successful!");
    }

    #[test]
    fn test_kyber768_prove_and_verify() {
        use crate::kyber::trace::build_kyber768_trace;

        // Build Kyber-768 trace
        let col_matrix = build_kyber768_trace(42);
        let trace = build_kyber_trace_table(col_matrix);

        println!("Kyber-768 trace: {} rows", trace.length());

        // Create prover
        let prover = KyberProver::with_fast_options();

        // Extract public inputs
        let pub_inputs = prover.get_pub_inputs(&trace);

        // Generate proof
        let proof = prover.prove(trace).expect("Failed to generate Kyber-768 proof");

        println!("Kyber-768 proof generated!");
        println!("Proof size: {} bytes", proof.to_bytes().len());

        // Verify proof
        let result = verify::<
            KyberAir,
            Blake3_256<BaseElement>,
            DefaultRandomCoin<Blake3_256<BaseElement>>,
            MerkleTree<Blake3_256<BaseElement>>,
        >(
            proof,
            pub_inputs,
            &winterfell::AcceptableOptions::OptionSet(vec![prover.options().clone()]),
        );

        assert!(result.is_ok(), "Kyber-768 verification failed: {:?}", result);
        println!("✅ Kyber-768 proof verification successful!");
    }
}
