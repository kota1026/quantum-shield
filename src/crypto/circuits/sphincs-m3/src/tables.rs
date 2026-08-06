//! Building the producer/consumer traces from a real SPHINCS+ hash DAG.

use p3_field::PrimeCharacteristicRing;
use p3_keccak_air::{generate_trace_rows, NUM_ROUNDS};
use p3_matrix::dense::RowMajorMatrix;
use p3_matrix::Matrix;

use sphincs_m2::dag::{digest_limbs, Dag};
use sphincs_m2::hash::PermTrace;

use crate::keccak_link::widen_keccak_trace;
use crate::link::{DIGEST_LIMBS, F, WIDTH};

/// Sizes of the generated tables (reported by the benchmark).
#[derive(Clone, Copy, Debug)]
pub struct Stats {
    pub calls: usize,
    pub edges: usize,
    pub external_inputs: usize,
    pub producer_rows: usize,
    pub consumer_rows: usize,
}

/// The two linked traces.
pub struct Tables {
    pub producer: RowMajorMatrix<F>,
    pub consumer: RowMajorMatrix<F>,
    pub stats: Stats,
}

fn empty_trace(rows: usize) -> RowMajorMatrix<F> {
    RowMajorMatrix::new(F::zero_vec(rows * WIDTH), WIDTH)
}

fn write_row(trace: &mut RowMajorMatrix<F>, row: usize, digest: &[u8; 16], multiplicity: u32) {
    let limbs = digest_limbs(digest);
    let base = row * WIDTH;
    for (i, limb) in limbs.iter().enumerate() {
        trace.values[base + i] = F::from_u32(*limb);
    }
    trace.values[base + DIGEST_LIMBS] = F::from_u32(multiplicity);
}

/// Build the producer (every hash output, with its usage count) and consumer
/// (every internal edge) traces. Heights are rounded up to powers of two;
/// padding rows carry multiplicity zero and so contribute nothing.
pub fn build_tables(trace: &PermTrace, dag: &Dag) -> Tables {
    let usage = dag.usage_counts();

    let producer_rows = dag.calls.next_power_of_two().max(2);
    let consumer_rows = dag.edges.len().next_power_of_two().max(2);

    let mut producer = empty_trace(producer_rows);
    for (i, call) in trace.calls.iter().enumerate() {
        write_row(&mut producer, i, &call.output, usage[i]);
    }

    let mut consumer = empty_trace(consumer_rows);
    for (i, edge) in dag.edges.iter().enumerate() {
        write_row(&mut consumer, i, &trace.calls[edge.producer].output, 1);
    }

    Tables {
        producer,
        consumer,
        stats: Stats {
            calls: dag.calls,
            edges: dag.edges.len(),
            external_inputs: dag.external_inputs,
            producer_rows,
            consumer_rows,
        },
    }
}

/// Corrupt one consumer row's digest so it no longer matches any produced
/// output — the tampering the linking argument must catch.
pub fn tamper_consumer(tables: &mut Tables, row: usize) {
    let base = row * WIDTH;
    tables.consumer.values[base] += F::ONE;
}

/// The bound pair: the Keccak table itself is the producer.
pub struct BoundTables {
    pub keccak: RowMajorMatrix<F>,
    pub consumer: RowMajorMatrix<F>,
    pub stats: Stats,
    /// Permutations in the padded Keccak trace.
    pub permutations: usize,
}

/// Build the Keccak table (widened with the linking columns) and the consumer
/// table from a recorded verification.
///
/// A hash call publishes its digest on its **last** permutation — for a
/// multi-block absorb the earlier blocks hold no digest — so `digest_of` is
/// indexed by `perm_start + perm_count - 1`.
pub fn build_bound_tables(trace: &PermTrace, dag: &Dag, log_blowup: usize) -> BoundTables {
    let keccak = generate_trace_rows::<F>(trace.states.clone(), log_blowup);
    let permutations = keccak.height().div_ceil(NUM_ROUNDS);

    let usage = dag.usage_counts();
    let mut digest_of = vec![None; permutations];
    for (i, call) in trace.calls.iter().enumerate() {
        let last = call.perm_start + call.perm_count - 1;
        digest_of[last] = Some(usage[i]);
    }

    let widened = widen_keccak_trace(&keccak, &digest_of);

    let consumer_rows = dag.edges.len().next_power_of_two().max(2);
    let mut consumer = empty_trace(consumer_rows);
    for (i, edge) in dag.edges.iter().enumerate() {
        write_row(&mut consumer, i, &trace.calls[edge.producer].output, 1);
    }

    BoundTables {
        keccak: widened,
        consumer,
        stats: Stats {
            calls: dag.calls,
            edges: dag.edges.len(),
            external_inputs: dag.external_inputs,
            producer_rows: keccak.height(),
            consumer_rows,
        },
        permutations,
    }
}

/// Corrupt a consumed digest in a bound pair.
pub fn tamper_bound_consumer(tables: &mut BoundTables, row: usize) {
    let base = row * WIDTH;
    tables.consumer.values[base] += F::ONE;
}
