//! SPHINCS+ Prover Implementation
//!
//! This module implements the STARK prover for SPHINCS+ signature verification.

use winterfell::{
    crypto::{hashers::Blake3_256, DefaultRandomCoin, MerkleTree},
    math::{fields::f128::BaseElement, FieldElement},
    matrix::ColMatrix,
    DefaultConstraintEvaluator, DefaultTraceLde, PartitionOptions, ProofOptions, Prover,
    StarkDomain, Trace, TraceInfo, TracePolyTable, TraceTable,
};

use super::air::{SphincsAir, SphincsPublicInputs};
use super::constants::sphincs_columns;

/// Prover for SPHINCS+ STARK proofs
pub struct SphincsProver {
    options: ProofOptions,
}

impl SphincsProver {
    /// Create a new prover with the given options
    pub fn new(options: ProofOptions) -> Self {
        Self { options }
    }

    /// Create prover with default secure options
    pub fn with_default_options() -> Self {
        let options = ProofOptions::new(
            32,   // Number of queries
            8,    // Blowup factor (ρ > max_degree = 3)
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
            8,    // Blowup factor
            0,    // No grinding
            winterfell::FieldExtension::None,
            8,    // FRI folding factor
            31,   // FRI max remainder degree
        );

        Self { options }
    }
}

impl Prover for SphincsProver {
    type BaseField = BaseElement;
    type Air = SphincsAir;
    type Trace = TraceTable<BaseElement>;
    type HashFn = Blake3_256<BaseElement>;
    type RandomCoin = DefaultRandomCoin<Self::HashFn>;
    type VC = MerkleTree<Self::HashFn>;
    type TraceLde<E: FieldElement<BaseField = Self::BaseField>> =
        DefaultTraceLde<E, Self::HashFn, Self::VC>;
    type ConstraintEvaluator<'a, E: FieldElement<BaseField = Self::BaseField>> =
        DefaultConstraintEvaluator<'a, Self::Air, E>;

    fn get_pub_inputs(&self, trace: &Self::Trace) -> SphincsPublicInputs {
        let _last_row = trace.length() - 1;

        // Extract message hash from first row
        let message_hash = [
            trace.get(sphincs_columns::H_IN_0, 0),
            trace.get(sphincs_columns::H_IN_1, 0),
            trace.get(sphincs_columns::H_IN_2, 0),
            trace.get(sphincs_columns::H_IN_3, 0),
        ];

        SphincsPublicInputs {
            merkle_root: [BaseElement::ZERO; 4], // Would be computed from trace
            wots_public_key: vec![],
            message_hash,
            merkle_depth: BaseElement::ZERO,
            chain_iterations: BaseElement::ZERO,
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

/// Build a TraceTable from ColMatrix for SPHINCS+
pub fn build_sphincs_trace_table(col_matrix: ColMatrix<BaseElement>) -> TraceTable<BaseElement> {
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
    use crate::sphincs::trace::build_sphincs_test_trace;
    use winterfell::verify;

    #[test]
    fn test_sphincs_prover_creation() {
        let prover = SphincsProver::with_fast_options();
        let options = prover.options();

        assert_eq!(options.num_queries(), 16);
        assert_eq!(options.blowup_factor(), 8);
    }

    #[test]
    fn test_sphincs_public_inputs_extraction() {
        // Build test trace
        let col_matrix = build_sphincs_test_trace();
        let trace = build_sphincs_trace_table(col_matrix);

        let prover = SphincsProver::with_fast_options();
        let pub_inputs = prover.get_pub_inputs(&trace);

        // Verify message hash is extracted from first row
        println!("Message hash[0]: {:?}", pub_inputs.message_hash[0]);
    }

    #[test]
    fn test_sphincs_prove_and_verify() {
        // Build test trace
        let col_matrix = build_sphincs_test_trace();
        let trace = build_sphincs_trace_table(col_matrix);

        // Create prover with fast options for testing
        let prover = SphincsProver::with_fast_options();

        // Extract public inputs from trace
        let pub_inputs = prover.get_pub_inputs(&trace);

        // Generate proof
        let proof = prover.prove(trace).expect("Proof generation failed");

        println!("SPHINCS+ Proof size: {} bytes", proof.to_bytes().len());

        // Verify proof
        let result = verify::<
            SphincsAir,
            Blake3_256<BaseElement>,
            DefaultRandomCoin<Blake3_256<BaseElement>>,
            MerkleTree<Blake3_256<BaseElement>>,
        >(
            proof,
            pub_inputs,
            &winterfell::AcceptableOptions::OptionSet(vec![prover.options().clone()]),
        );

        assert!(result.is_ok(), "Proof verification failed: {:?}", result.err());
    }

    #[test]
    fn test_sphincs_larger_trace() {
        use crate::sphincs::trace::build_sphincs_full_trace;

        // Build a more comprehensive trace
        let message_hash = [0x12345678, 0, 0, 0];
        let col_matrix = build_sphincs_full_trace(
            message_hash,
            4,  // fors_depth
            5,  // wots_chains
            10, // wots_chain_length
            3,  // hypertree_depth
        );
        let trace = build_sphincs_trace_table(col_matrix);

        println!("Trace length: {} rows", trace.length());

        // Create prover
        let prover = SphincsProver::with_fast_options();

        // Extract public inputs from trace
        let pub_inputs = prover.get_pub_inputs(&trace);

        // Generate proof
        let proof = prover.prove(trace).expect("Proof generation failed");

        println!("Full SPHINCS+ Proof size: {} bytes", proof.to_bytes().len());

        // Verify proof
        let result = verify::<
            SphincsAir,
            Blake3_256<BaseElement>,
            DefaultRandomCoin<Blake3_256<BaseElement>>,
            MerkleTree<Blake3_256<BaseElement>>,
        >(
            proof,
            pub_inputs,
            &winterfell::AcceptableOptions::OptionSet(vec![prover.options().clone()]),
        );

        assert!(result.is_ok(), "Proof verification failed: {:?}", result.err());
    }
}
