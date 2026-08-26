//! The hash DAG of one SLH-DSA verification.
//!
//! M1's WOTS+ chain could be linked positionally because a chain is a *line*.
//! Full SPHINCS+ verification is a DAG: FORS roots feed `T_k`, the WOTS+
//! public key feeds the tree hashes, each hypertree layer's root feeds the
//! next layer's WOTS+ message. The producer of a given input is not at a
//! fixed trace offset, so M3 links these edges with a LogUp argument instead.
//!
//! This module extracts that DAG from a [`PermTrace`]: an input value is an
//! **internal edge** when it equals the output of an earlier hash call, and
//! **external** otherwise (signature bytes, the public key, auth paths) —
//! external values are bound by the public inputs, internal ones must be
//! proven.

use std::collections::HashMap;

use crate::hash::{HashCall, PermTrace};
use crate::params::N;

/// One internal edge: `producer`'s output is consumed as `consumer`'s
/// `slot`-th value input.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct Edge {
    pub producer: usize,
    pub consumer: usize,
    pub slot: usize,
}

/// The extracted DAG.
#[derive(Clone, Debug)]
pub struct Dag {
    /// Internal edges, in consumer order.
    pub edges: Vec<Edge>,
    /// Value inputs that no earlier call produced (signature/public key data).
    pub external_inputs: usize,
    /// Total value inputs across all calls.
    pub total_inputs: usize,
    /// Number of hash calls (= number of produced digests).
    pub calls: usize,
}

impl Dag {
    /// How many times each call's output is consumed, indexed by call.
    pub fn usage_counts(&self) -> Vec<u32> {
        let mut counts = vec![0u32; self.calls];
        for e in &self.edges {
            counts[e.producer] += 1;
        }
        counts
    }
}

/// Extract the DAG from a recorded verification.
///
/// Scanning in evaluation order means a value can only match an output that
/// was produced *before* it is consumed, so the edge set is acyclic by
/// construction.
pub fn build_dag(trace: &PermTrace) -> Dag {
    let mut produced: HashMap<[u8; N], usize> = HashMap::with_capacity(trace.calls.len());
    let mut edges = Vec::new();
    let mut external_inputs = 0usize;
    let mut total_inputs = 0usize;

    for (consumer, call) in trace.calls.iter().enumerate() {
        for (slot, input) in call.inputs.iter().enumerate() {
            total_inputs += 1;
            match produced.get(input) {
                Some(&producer) => edges.push(Edge { producer, consumer, slot }),
                None => external_inputs += 1,
            }
        }
        // Register the output only after its own inputs are resolved.
        produced.entry(call.output).or_insert(consumer);
    }

    Dag { edges, external_inputs, total_inputs, calls: trace.calls.len() }
}

/// Convenience accessor for a call's output.
pub fn output_of(trace: &PermTrace, call: usize) -> [u8; N] {
    trace.calls[call].output
}

/// Split an n-byte digest into four 32-bit limbs (little-endian), the form
/// the M3 lookup tuples use.
pub fn digest_limbs(digest: &[u8; N]) -> [u32; 4] {
    let mut limbs = [0u32; 4];
    for (i, limb) in limbs.iter_mut().enumerate() {
        *limb = u32::from_le_bytes(digest[i * 4..(i + 1) * 4].try_into().unwrap());
    }
    limbs
}

/// Helper for tests/benches that only need the calls of one call kind.
pub fn calls_of<'a>(
    trace: &'a PermTrace,
    kind: crate::hash::HashKind,
) -> impl Iterator<Item = (usize, &'a HashCall)> {
    trace
        .calls
        .iter()
        .enumerate()
        .filter(move |(_, c)| c.kind == kind)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::adrs::Adrs;
    use crate::hash::{f, h, HashKind, PermTrace};

    /// A hand-built chain must yield exactly the chain edges.
    #[test]
    fn linear_chain_edges() {
        let pk_seed = [1u8; N];
        let adrs = Adrs::new();
        let mut t = PermTrace::default();

        let a = f(&pk_seed, &adrs, &[9u8; N], Some(&mut t));
        let b = f(&pk_seed, &adrs, &a, Some(&mut t));
        let _c = f(&pk_seed, &adrs, &b, Some(&mut t));

        let dag = build_dag(&t);
        assert_eq!(dag.calls, 3);
        assert_eq!(dag.total_inputs, 3);
        assert_eq!(dag.external_inputs, 1, "only the chain start is external");
        assert_eq!(
            dag.edges,
            vec![
                Edge { producer: 0, consumer: 1, slot: 0 },
                Edge { producer: 1, consumer: 2, slot: 0 },
            ]
        );
        assert_eq!(dag.usage_counts(), vec![1, 1, 0]);
    }

    /// A node hash consuming a produced value on one side and an external
    /// sibling on the other — the shape every tree level has.
    #[test]
    fn tree_node_has_one_internal_and_one_external_input() {
        let pk_seed = [2u8; N];
        let adrs = Adrs::new();
        let mut t = PermTrace::default();

        let leaf = f(&pk_seed, &adrs, &[7u8; N], Some(&mut t));
        let _node = h(&pk_seed, &adrs, &leaf, &[0xEEu8; N], Some(&mut t));

        let dag = build_dag(&t);
        assert_eq!(dag.edges, vec![Edge { producer: 0, consumer: 1, slot: 0 }]);
        assert_eq!(dag.external_inputs, 2, "chain start + auth sibling");
    }

    #[test]
    fn digest_limbs_roundtrip() {
        let mut d = [0u8; N];
        for (i, b) in d.iter_mut().enumerate() {
            *b = i as u8;
        }
        let limbs = digest_limbs(&d);
        assert_eq!(limbs[0], u32::from_le_bytes([0, 1, 2, 3]));
        assert_eq!(limbs[3], u32::from_le_bytes([12, 13, 14, 15]));
    }

    #[test]
    fn call_kinds_are_recorded() {
        let pk_seed = [3u8; N];
        let adrs = Adrs::new();
        let mut t = PermTrace::default();
        f(&pk_seed, &adrs, &[1u8; N], Some(&mut t));
        h(&pk_seed, &adrs, &[1u8; N], &[2u8; N], Some(&mut t));
        assert_eq!(calls_of(&t, HashKind::F).count(), 1);
        assert_eq!(calls_of(&t, HashKind::H).count(), 1);
    }
}
