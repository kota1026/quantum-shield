//! Emit per-component test vectors for the Solidity verifier.
//!
//! `SPHINCSVerifier.sol` stayed wrong for a long time because nothing compared
//! it to a reference (`STARK_AIR_GAP_ANALYSIS.md` §25). An end-to-end vector
//! alone would only say "fails" — these let the Solidity side be pinned one
//! construction at a time, so a mismatch points at the construction that broke.

use std::fs;

use slh_dsa_sha2::adrs::{self, Adrs};
use slh_dsa_sha2::hash::{f, h, h_msg, t_l};
use slh_dsa_sha2::params::N;

fn hex(bytes: &[u8]) -> String {
    bytes.iter().map(|b| format!("{b:02x}")).collect()
}

/// A deliberately non-trivial address: every field distinct, so a Solidity
/// compression bug cannot hide behind zero bytes.
fn sample_adrs() -> Adrs {
    let mut a = Adrs::new();
    a.set_layer_address(3);
    a.set_tree_address(0x0102030405060708);
    a.set_type_and_clear(adrs::TREE);
    a.set_key_pair_address(0x11223344);
    a.set_tree_height(0x55667788);
    a.set_tree_index(0x99AABBCC);
    a
}

fn main() {
    let dir = std::env::args().nth(1).expect("usage: emit_component_vectors <out-dir>");

    let pk_seed: [u8; N] = core::array::from_fn(|i| i as u8);
    let m1: [u8; N] = core::array::from_fn(|i| 0x40 + i as u8);
    let m2: [u8; N] = core::array::from_fn(|i| 0x80 + i as u8);
    let a = sample_adrs();

    let roots: Vec<[u8; N]> = (0..14u8)
        .map(|k| core::array::from_fn(|i| k.wrapping_mul(17).wrapping_add(i as u8)))
        .collect();

    let r: [u8; N] = core::array::from_fn(|i| 0xF0 ^ i as u8);
    let pk_root: [u8; N] = core::array::from_fn(|i| 0x0A + i as u8);
    let msg = b"quantum shield unlock".to_vec();

    let json = format!(
        r#"{{
  "adrs": "{}",
  "adrsCompressed": "{}",
  "pkSeed": "{}",
  "m1": "{}",
  "m2": "{}",
  "f": "{}",
  "h": "{}",
  "tlRoots": "{}",
  "tl": "{}",
  "r": "{}",
  "pkRoot": "{}",
  "hmsgMessage": "{}",
  "hmsg": "{}"
}}"#,
        hex(&a.0),
        hex(&a.compressed()),
        hex(&pk_seed),
        hex(&m1),
        hex(&m2),
        hex(&f(&pk_seed, &a, &m1)),
        hex(&h(&pk_seed, &a, &m1, &m2)),
        hex(&roots.concat()),
        hex(&t_l(&pk_seed, &a, &roots)),
        hex(&r),
        hex(&pk_root),
        hex(&msg),
        hex(&h_msg(&r, &pk_seed, &pk_root, &msg)),
    );

    let path = format!("{dir}/slhdsa_sha2_components.json");
    fs::write(&path, &json).unwrap();
    println!("wrote {path}");
    println!("ADRS^c = {} ({} bytes)", hex(&a.compressed()), a.compressed().len());
    println!("F      = {}", hex(&f(&pk_seed, &a, &m1)));
    println!("H_msg  = {}", hex(&h_msg(&r, &pk_seed, &pk_root, &msg)));
}
