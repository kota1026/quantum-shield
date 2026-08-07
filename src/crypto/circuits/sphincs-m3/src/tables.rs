//! Building the producer/consumer traces from a real SPHINCS+ hash DAG.

use p3_field::PrimeCharacteristicRing;
use p3_keccak_air::{generate_trace_rows, NUM_ROUNDS};
use p3_matrix::dense::RowMajorMatrix;
use p3_matrix::Matrix;

use sphincs_m2::dag::{digest_limbs, Dag};
use sphincs_m2::hash::PermTrace;

use crate::keccak_link::widen_keccak_trace;
use crate::link::{DIGEST_LIMBS, F, NODE_LIMBS, NODE_WIDTH, WIDTH};
use crate::registry::{node_limbs, NodeDag};

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
    build_bound_tables_with_extra_usage(trace, dag, log_blowup, &[])
}

/// As [`build_bound_tables`], but with additional consumers of some outputs —
/// e.g. the aggregation table receiving a slot's hypertree root. `extra[i]` is
/// added to call `i`'s published multiplicity.
pub fn build_bound_tables_with_extra_usage(
    trace: &PermTrace,
    dag: &Dag,
    log_blowup: usize,
    extra: &[u32],
) -> BoundTables {
    let keccak = generate_trace_rows::<F>(trace.states.clone(), log_blowup);
    let permutations = keccak.height().div_ceil(NUM_ROUNDS);

    let mut usage = dag.usage_counts();
    for (i, add) in extra.iter().enumerate() {
        usage[i] += add;
    }
    let mut digest_of = vec![None; permutations];
    for (i, call) in trace.calls.iter().enumerate() {
        let last = call.perm_start + call.perm_count - 1;
        digest_of[last] = Some(usage[i]);
    }

    let widened = widen_keccak_trace(&keccak, &digest_of, &[], &[]);

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


// =============================================================================
// Registry Merkle chain (32-byte values)
// =============================================================================

/// The Keccak table plus the 32-byte consumer table for a registry
/// membership witness.
pub struct RegistryTables {
    pub keccak: RowMajorMatrix<F>,
    pub node_consumer: RowMajorMatrix<F>,
    pub node_calls: usize,
    pub node_edges: usize,
    pub external_inputs: usize,
}

/// Build the tables for a witness whose hashes are all registry-side
/// (leaf, Merkle nodes, public-key hash).
///
/// The SPHINCS+ `HASH_DAG` interaction is empty here, which is fine: an
/// interaction with no participants sums to zero.
pub fn build_registry_tables(
    trace: &PermTrace,
    node_dag: &NodeDag,
    log_blowup: usize,
) -> RegistryTables {
    let keccak = generate_trace_rows::<F>(trace.states.clone(), log_blowup);
    let permutations = keccak.height().div_ceil(NUM_ROUNDS);

    let usage = node_dag.usage_counts();
    let mut node_of = vec![None; permutations];
    for (i, call) in trace.node_calls.iter().enumerate() {
        let last = call.perm_start + call.perm_count - 1;
        node_of[last] = Some(usage[i]);
    }

    let widened = widen_keccak_trace(&keccak, &[], &node_of, &[]);

    let rows = node_dag.edges.len().next_power_of_two().max(2);
    let mut node_consumer = RowMajorMatrix::new(F::zero_vec(rows * NODE_WIDTH), NODE_WIDTH);
    for (i, edge) in node_dag.edges.iter().enumerate() {
        let digest = trace.node_calls[edge.producer].output;
        let base = i * NODE_WIDTH;
        for (j, limb) in node_limbs(&digest).iter().enumerate() {
            node_consumer.values[base + j] = F::from_u32(*limb);
        }
        node_consumer.values[base + NODE_LIMBS] = F::ONE;
    }

    RegistryTables {
        keccak: widened,
        node_consumer,
        node_calls: node_dag.calls,
        node_edges: node_dag.edges.len(),
        external_inputs: node_dag.external_inputs,
    }
}

/// Corrupt a consumed 32-byte digest.
pub fn tamper_node_consumer(tables: &mut RegistryTables, row: usize) {
    tables.node_consumer.values[row * NODE_WIDTH] += F::ONE;
}

// =============================================================================
// Full batch: SPHINCS+ digests, registry nodes and public-key binding
// =============================================================================

/// Every table a complete threshold witness needs.
pub struct FullTables {
    pub keccak: RowMajorMatrix<F>,
    pub consumer: RowMajorMatrix<F>,
    pub node_consumer: RowMajorMatrix<F>,
}

/// Build the Keccak table together with both consumer tables.
///
/// `extra_digest_usage[i]` adds to 16-byte call `i`'s published multiplicity
/// (the aggregation table consuming a hypertree root, say), and
/// `pubkey_calls` names the 32-byte calls that hash a registered public key,
/// with how many slots bind to each.
pub fn build_full_tables(
    trace: &PermTrace,
    dag: &Dag,
    node_dag: &NodeDag,
    log_blowup: usize,
    extra_digest_usage: &[u32],
    pubkey_calls: &[(usize, u32)],
) -> FullTables {
    let keccak = generate_trace_rows::<F>(trace.states.clone(), log_blowup);
    let permutations = keccak.height().div_ceil(NUM_ROUNDS);

    let mut digest_usage = dag.usage_counts();
    for (i, add) in extra_digest_usage.iter().enumerate() {
        digest_usage[i] += add;
    }
    let mut digest_of = vec![None; permutations];
    for (i, call) in trace.calls.iter().enumerate() {
        digest_of[call.perm_start + call.perm_count - 1] = Some(digest_usage[i]);
    }

    let node_usage = node_dag.usage_counts();
    let mut node_of = vec![None; permutations];
    for (i, call) in trace.node_calls.iter().enumerate() {
        node_of[call.perm_start + call.perm_count - 1] = Some(node_usage[i]);
    }

    let mut pubkey_of = vec![None; permutations];
    for &(call, mult) in pubkey_calls {
        let c = &trace.node_calls[call];
        pubkey_of[c.perm_start + c.perm_count - 1] = Some(mult);
    }

    let widened = widen_keccak_trace(&keccak, &digest_of, &node_of, &pubkey_of);

    let consumer_rows = dag.edges.len().next_power_of_two().max(2);
    let mut consumer = empty_trace(consumer_rows);
    for (i, edge) in dag.edges.iter().enumerate() {
        write_row(&mut consumer, i, &trace.calls[edge.producer].output, 1);
    }

    let node_rows = node_dag.edges.len().next_power_of_two().max(2);
    let mut node_consumer = RowMajorMatrix::new(F::zero_vec(node_rows * NODE_WIDTH), NODE_WIDTH);
    for (i, edge) in node_dag.edges.iter().enumerate() {
        let digest = trace.node_calls[edge.producer].output;
        let base = i * NODE_WIDTH;
        for (j, limb) in node_limbs(&digest).iter().enumerate() {
            node_consumer.values[base + j] = F::from_u32(*limb);
        }
        node_consumer.values[base + NODE_LIMBS] = F::ONE;
    }

    FullTables { keccak: widened, consumer, node_consumer }
}
