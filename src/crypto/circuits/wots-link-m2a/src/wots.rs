//! WOTS+ witness computation for SPHINCS+-SHAKE-128s (FIPS 205 parameters),
//! including the exact ADRS layout, plus controlled tampering used by the
//! negative tests.
//!
//! As in M1, every tweakable-hash call
//!   F(PK.seed, ADRS, M) = SHAKE256(PK.seed || ADRS || M) truncated to n bytes
//! over a 64-byte input is a single Keccak-f[1600] permutation, and each
//! reconstructed absorption state is asserted against the `sha3` reference
//! implementation, so the permutations the circuit proves are exactly the F
//! calls the FIPS spec performs.

use sha3::digest::{ExtendableOutput, Update, XofReader};
use sha3::Shake256;

/// Security parameter n in bytes (SPHINCS+-SHAKE-128s).
pub const N: usize = 16;
/// Winternitz parameter.
pub const W: usize = 16;
/// F applications per full chain (w - 1).
pub const CHAIN_STEPS: usize = W - 1;
/// Number of WOTS+ chains: len1 (32) + len2 (3).
pub const WOTS_LEN: usize = 35;
/// Keccak-f permutations in the witness.
pub const TOTAL_PERMS: usize = WOTS_LEN * CHAIN_STEPS;
/// SHAKE256 rate in bytes.
pub const SHAKE256_RATE: usize = 136;

/// FIPS 205 ADRS type constant for WOTS chain hashes.
pub const ADRS_TYPE_WOTS_HASH: u32 = 0;

/// The ADRS fields that are constant across the whole WOTS+ unit.
pub struct AdrsParams {
    pub layer: u32,
    pub tree: [u8; 12],
    pub keypair: u32,
}

/// FIPS 205 32-byte ADRS: layer(4) || tree(12) || type(4) || keypair(4) ||
/// chain(4) || hash(4), all big-endian.
pub fn wots_adrs(p: &AdrsParams, adrs_type: u32, chain: u32, hash: u32) -> [u8; 32] {
    let mut a = [0u8; 32];
    a[0..4].copy_from_slice(&p.layer.to_be_bytes());
    a[4..16].copy_from_slice(&p.tree);
    a[16..20].copy_from_slice(&adrs_type.to_be_bytes());
    a[20..24].copy_from_slice(&p.keypair.to_be_bytes());
    a[24..28].copy_from_slice(&chain.to_be_bytes());
    a[28..32].copy_from_slice(&hash.to_be_bytes());
    a
}

/// Little-endian pack the padded single rate block into a fresh 25-lane state.
pub fn absorb_single_block(input: &[u8]) -> [u64; 25] {
    assert!(input.len() < SHAKE256_RATE, "F inputs fit in one SHAKE256 block");
    let mut block = [0u8; SHAKE256_RATE];
    block[..input.len()].copy_from_slice(input);
    // pad10*1 with SHAKE domain separator 0x1F
    block[input.len()] ^= 0x1F;
    block[SHAKE256_RATE - 1] ^= 0x80;

    let mut state = [0u64; 25];
    for (i, lane) in state.iter_mut().take(SHAKE256_RATE / 8).enumerate() {
        let mut b = [0u8; 8];
        b.copy_from_slice(&block[8 * i..8 * i + 8]);
        *lane = u64::from_le_bytes(b);
    }
    state
}

/// Reference F via the `sha3` crate: SHAKE256(input) truncated to n bytes.
fn f_reference(input: &[u8]) -> [u8; N] {
    let mut h = Shake256::default();
    h.update(input);
    let mut r = h.finalize_xof();
    let mut out = [0u8; N];
    r.read(&mut out);
    out
}

/// Compute F while returning the Keccak-f input state the circuit proves.
/// Asserts the reconstruction against the `sha3` reference.
fn f_with_state(pk_seed: &[u8; N], adrs: &[u8; 32], m: &[u8; N]) -> ([u8; N], [u64; 25]) {
    let mut input = Vec::with_capacity(N + 32 + N);
    input.extend_from_slice(pk_seed);
    input.extend_from_slice(adrs);
    input.extend_from_slice(m);

    let state_in = absorb_single_block(&input);
    let mut permuted = state_in;
    keccak_f(&mut permuted);
    let mut modeled = [0u8; N];
    modeled[..8].copy_from_slice(&permuted[0].to_le_bytes());
    modeled[8..].copy_from_slice(&permuted[1].to_le_bytes());
    assert_eq!(
        modeled,
        f_reference(&input),
        "state reconstruction must match sha3 reference"
    );
    (modeled, state_in)
}

/// Keccak-f[1600] via p3-keccak (same permutation keccak-air proves).
fn keccak_f(state: &mut [u64; 25]) {
    use p3_symmetric::Permutation;
    p3_keccak::KeccakF {}.permute_mut(state);
}

/// Controlled witness corruption for the negative tests. Every variant keeps
/// the keccak permutations themselves valid — only the *linking structure*
/// (or its relation to the public inputs) is broken, which is exactly what
/// the M2a constraints must catch.
pub enum Tamper {
    None,
    /// Flip one bit of the running chain value before `step` of `chain`,
    /// breaking the output->input link between step-1 and step.
    BreakChain { chain: usize, step: usize },
    /// Use hash address step+1 instead of step for every F of `chain`.
    WrongHashAddr { chain: usize },
    /// Use chain address chain+1 in the ADRS of `chain`.
    WrongChainAddr { chain: usize },
    /// Use ADRS type WOTS_PK (1) instead of WOTS_HASH (0) for `chain`.
    WrongAdrsType { chain: usize },
}

pub struct Witness {
    /// The 525 Keccak-f input states, chain-major then step order.
    pub states: Vec<[u64; 25]>,
    /// Per-chain start values (M of step 0).
    pub starts: Vec<[u8; N]>,
    /// Per-chain end values (F output of step 14) as computed by this run.
    pub ends: Vec<[u8; N]>,
}

/// Run all 35 chains of 15 F steps, collecting every permutation input state.
pub fn build_witness(pk_seed: &[u8; N], params: &AdrsParams, tamper: &Tamper) -> Witness {
    let mut states = Vec::with_capacity(TOTAL_PERMS);
    let mut starts = Vec::with_capacity(WOTS_LEN);
    let mut ends = Vec::with_capacity(WOTS_LEN);

    for k in 0..WOTS_LEN {
        // Deterministic per-chain start value (stands in for a signature
        // element; the circuit only cares that it matches the public input).
        let mut h = Shake256::default();
        h.update(b"qs-m2a-start");
        h.update(&(k as u32).to_be_bytes());
        let mut start = [0u8; N];
        h.finalize_xof().read(&mut start);
        starts.push(start);

        let mut x = start;
        for s in 0..CHAIN_STEPS {
            if let Tamper::BreakChain { chain, step } = tamper {
                if *chain == k && *step == s {
                    x[0] ^= 0x01;
                }
            }
            let mut adrs_type = ADRS_TYPE_WOTS_HASH;
            let mut chain_addr = k as u32;
            let mut hash_addr = s as u32;
            match tamper {
                Tamper::WrongHashAddr { chain } if *chain == k => hash_addr = s as u32 + 1,
                Tamper::WrongChainAddr { chain } if *chain == k => chain_addr = k as u32 + 1,
                Tamper::WrongAdrsType { chain } if *chain == k => adrs_type = 1,
                _ => {}
            }
            let adrs = wots_adrs(params, adrs_type, chain_addr, hash_addr);
            let (next, state_in) = f_with_state(pk_seed, &adrs, &x);
            states.push(state_in);
            x = next;
        }
        ends.push(x);
    }

    Witness { states, starts, ends }
}
