//! A small but structurally real SPHINCS+ witness for the bound tests.
//!
//! One FORS tree's authentication-path recomputation (FIPS 205 Algorithm 17,
//! inner loop): a leaf `F` followed by `a` node hashes `H`, with genuine
//! `FORS_TREE` addresses. Every hash is single-block, and every node consumes
//! the previous node's output — exactly the DAG shape the linking argument
//! has to enforce, at a size that proves in seconds instead of minutes.

use sphincs_m2::adrs::{self, Adrs};
use sphincs_m2::hash::{f, h, PermTrace};
use sphincs_m2::params::{A, N};

/// Recompute one FORS tree root from a leaf secret and an auth path,
/// recording the Keccak witness and hash DAG.
pub fn fors_tree_witness(seed: u8, leaf_index: u32) -> PermTrace {
    let pk_seed = [seed; N];
    let sk = [seed ^ 0x5A; N];

    let mut adrs = Adrs::new();
    adrs.set_layer_address(0);
    adrs.set_tree_address(0);
    adrs.set_type_and_clear(adrs::FORS_TREE);
    adrs.set_key_pair_address(5);

    let mut trace = PermTrace::default();

    adrs.set_tree_height(0);
    adrs.set_tree_index(leaf_index);
    let mut node = f(&pk_seed, &adrs, &sk, Some(&mut trace));

    for j in 0..A {
        // A deterministic stand-in for the signature's auth path; its
        // provenance is external either way, which is the point.
        let sibling = [seed.wrapping_add(j as u8).wrapping_mul(31); N];
        adrs.set_tree_height(j as u32 + 1);
        if (leaf_index >> j) & 1 == 0 {
            adrs.set_tree_index(adrs.tree_index() / 2);
            node = h(&pk_seed, &adrs, &node, &sibling, Some(&mut trace));
        } else {
            adrs.set_tree_index((adrs.tree_index() - 1) / 2);
            node = h(&pk_seed, &adrs, &sibling, &node, Some(&mut trace));
        }
    }

    trace
}

#[cfg(test)]
mod tests {
    use super::*;
    use sphincs_m2::dag::build_dag;

    /// The witness must be the expected shape: 1 + a hash calls, all
    /// single-block, chained leaf -> root.
    #[test]
    fn fors_tree_shape() {
        let trace = fors_tree_witness(0x42, 1234);
        assert_eq!(trace.calls.len(), 1 + A);
        assert_eq!(trace.len(), 1 + A, "every FORS hash is one block");
        assert!(trace.calls.iter().all(|c| c.perm_count == 1));

        let dag = build_dag(&trace);
        assert_eq!(dag.edges.len(), A, "each node consumes the previous one");
        for e in &dag.edges {
            assert_eq!(e.consumer, e.producer + 1);
        }
    }
}
