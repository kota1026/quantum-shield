//! M2b-1 PoC — full WOTS+ public-key derivation for SPHINCS+-SHAKE-128s.
//!
//! Extends M1 (single chain) to a complete WOTS+ instance:
//!   - a message digest is split into `len1` base-w digits,
//!   - a checksum over those digits is appended as `len2` base-w digits,
//!   - each of the `len = len1 + len2` digits drives a hash chain of the
//!     tweakable hash F = SHAKE256(PK.seed || ADRS || M) (one Keccak-f each),
//!   - the chain ends are the WOTS+ public-key elements.
//! Every Keccak-f permutation the derivation performs is proven with the real
//! Plonky3 p3-keccak-air, and each F is checked against the `sha3` reference
//! (so the proven permutations are exactly the FIPS-205 F). This measures the
//! full-WOTS+ permutation count and proving cost, confirming the M0/M1
//! extrapolation at scale.
//!
//! Scope: this proves the permutations. Binding consecutive permutations into
//! chains (M2a, done) and binding those chains to keccak-air via a cross-table
//! lookup (M2b-2) compose on top; see STARK_AIR_GAP_ANALYSIS.md §8.
//!
//! Feeds STARK_AIR_GAP_ANALYSIS.md M2b.

use core::fmt::Debug;
use std::time::Instant;

use p3_challenger::{HashChallenger, SerializingChallenger64};
use p3_commit::ExtensionMmcs;
use p3_dft::Radix2DitParallel;
use p3_field::extension::BinomialExtensionField;
use p3_fri::{FriParameters, TwoAdicFriPcs};
use p3_goldilocks::Goldilocks;
use p3_keccak::{Keccak256Hash, KeccakF};
use p3_keccak_air::{generate_trace_rows, KeccakAir};
use p3_merkle_tree::MerkleTreeMmcs;
use p3_symmetric::{CompressionFunctionFromHasher, PaddingFreeSponge, Permutation, SerializingHasher};
use p3_uni_stark::{prove, verify, StarkConfig};
use sha3::digest::{ExtendableOutput, Update, XofReader};
use sha3::Shake256;

// ---- SPHINCS+-SHAKE-128s WOTS+ parameters ----
const N: usize = 16; // security parameter (bytes)
const W: usize = 16; // Winternitz parameter
const LG_W: usize = 4; // log2(w)
const LEN1: usize = 32; // ceil(8n / lg_w) = 128/4
const LEN2: usize = 3; // checksum digits
const LEN: usize = LEN1 + LEN2; // 35
const SHAKE256_RATE: usize = 136;

// ---- SHAKE256 single-block Keccak-f input-state reconstruction (from M1) ----

fn absorb_single_block(input: &[u8]) -> [u64; 25] {
    assert!(input.len() < SHAKE256_RATE);
    let mut block = [0u8; SHAKE256_RATE];
    block[..input.len()].copy_from_slice(input);
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

fn squeeze(state: &[u64; 25], out: usize) -> Vec<u8> {
    let mut bytes = Vec::with_capacity(out);
    for lane in state.iter() {
        bytes.extend_from_slice(&lane.to_le_bytes());
        if bytes.len() >= out {
            break;
        }
    }
    bytes.truncate(out);
    bytes
}

fn f_reference(input: &[u8]) -> [u8; N] {
    let mut h = Shake256::default();
    h.update(input);
    let mut r = h.finalize_xof();
    let mut out = [0u8; N];
    r.read(&mut out);
    out
}

/// Tweakable hash F(PK.seed, ADRS, M): assemble input, reconstruct the Keccak-f
/// input state, self-check against the sha3 reference, return (output, state).
fn f_with_state(pk_seed: &[u8; N], adrs: &[u8; 32], m: &[u8; N]) -> ([u8; N], [u64; 25]) {
    let mut input = Vec::with_capacity(N + 32 + N);
    input.extend_from_slice(pk_seed);
    input.extend_from_slice(adrs);
    input.extend_from_slice(m);
    let state_in = absorb_single_block(&input);
    let mut permuted = state_in;
    KeccakF {}.permute_mut(&mut permuted);
    let modeled = squeeze(&permuted, N);
    assert_eq!(modeled, f_reference(&input).to_vec(), "F must match sha3 reference");
    let mut out = [0u8; N];
    out.copy_from_slice(&modeled);
    (out, state_in)
}

/// A WOTS+ chain: apply F `steps` times from `start`, collecting Keccak-f states.
fn chain(
    pk_seed: &[u8; N],
    start: &[u8; N],
    chain_index: usize,
    start_step: usize,
    steps: usize,
    states: &mut Vec<[u64; 25]>,
) -> [u8; N] {
    let mut x = *start;
    for s in 0..steps {
        let mut adrs = [0u8; 32];
        adrs[0..4].copy_from_slice(&(chain_index as u32).to_be_bytes());
        adrs[4..8].copy_from_slice(&((start_step + s) as u32).to_be_bytes());
        let (next, st) = f_with_state(pk_seed, &adrs, &x);
        x = next;
        states.push(st);
    }
    x
}

/// Split a 128-bit message digest into LEN1 base-w digits (w=16 => nibbles).
fn base_w_digits(msg: &[u8; N]) -> [u8; LEN1] {
    let mut out = [0u8; LEN1];
    for (i, out_i) in out.iter_mut().enumerate() {
        let byte = msg[i / 2];
        *out_i = if i % 2 == 0 { byte >> 4 } else { byte & 0x0f };
    }
    out
}

/// WOTS+ checksum: sum(w-1 - d_i) over the LEN1 digits, encoded as LEN2 base-w digits.
fn checksum_digits(digits: &[u8; LEN1]) -> [u8; LEN2] {
    let mut csum: u32 = 0;
    for &d in digits.iter() {
        csum += (W as u32 - 1) - d as u32;
    }
    let mut out = [0u8; LEN2];
    for i in 0..LEN2 {
        out[LEN2 - 1 - i] = ((csum >> (LG_W * i)) & (W as u32 - 1)) as u8;
    }
    out
}

/// Derive the full WOTS+ public key WOTS+-verify style:
/// pk_i = chain(sk_i, from digit d_i, for w-1-d_i steps).
/// Returns (pk elements, all Keccak-f states performed).
fn wots_pubkey(pk_seed: &[u8; N], sk: &[[u8; N]; LEN], msg: &[u8; N]) -> (Vec<[u8; N]>, Vec<[u64; 25]>) {
    let d1 = base_w_digits(msg);
    let d2 = checksum_digits(&d1);
    let mut digits = [0u8; LEN];
    digits[..LEN1].copy_from_slice(&d1);
    digits[LEN1..].copy_from_slice(&d2);

    let mut states = Vec::new();
    let mut pk = Vec::with_capacity(LEN);
    for (i, &digit) in digits.iter().enumerate() {
        let steps = (W - 1) - digit as usize; // remaining chain steps in verification
        let end = chain(pk_seed, &sk[i], i, digit as usize, steps, &mut states);
        pk.push(end);
    }
    (pk, states)
}

// ---- keccak-air proving config (same as M0/M1) ----
type Val = Goldilocks;
type Challenge = BinomialExtensionField<Val, 2>;
type ByteHash = Keccak256Hash;
type U64Hash = PaddingFreeSponge<KeccakF, 25, 17, 4>;
type FieldHash = SerializingHasher<U64Hash>;
type MyCompress = CompressionFunctionFromHasher<U64Hash, 2, 4>;
type ValMmcs =
    MerkleTreeMmcs<[Val; p3_keccak::VECTOR_LEN], [u64; p3_keccak::VECTOR_LEN], FieldHash, MyCompress, 4>;
type ChallengeMmcs = ExtensionMmcs<Val, Challenge, ValMmcs>;
type Dft = Radix2DitParallel<Val>;
type Challenger = SerializingChallenger64<Val, HashChallenger<u8, ByteHash, 32>>;
type Pcs = TwoAdicFriPcs<Val, Dft, ValMmcs, ChallengeMmcs>;
type MyConfig = StarkConfig<Pcs, Challenge, Challenger>;

fn prove_states(states: Vec<[u64; 25]>) -> (f64, f64, usize, bool) {
    let byte_hash = ByteHash {};
    let u64_hash = U64Hash::new(KeccakF {});
    let field_hash = FieldHash::new(u64_hash);
    let compress = MyCompress::new(u64_hash);
    let val_mmcs = ValMmcs::new(field_hash, compress);
    let challenge_mmcs = ChallengeMmcs::new(val_mmcs.clone());
    let dft = Dft::default();
    let fri_params = FriParameters {
        log_blowup: 3,
        log_final_poly_len: 0,
        num_queries: 100,
        commit_proof_of_work_bits: 16,
        query_proof_of_work_bits: 16,
        mmcs: challenge_mmcs,
    };
    let trace = generate_trace_rows::<Val>(states, fri_params.log_blowup);
    let pcs = Pcs::new(dft, val_mmcs, fri_params);
    let challenger = Challenger::from_hasher(vec![], byte_hash);
    let config = MyConfig::new(pcs, challenger);
    let air = KeccakAir {};
    let t0 = Instant::now();
    let proof = prove(&config, &air, trace, &[]);
    let prove_ms = t0.elapsed().as_secs_f64() * 1000.0;
    let size = bincode::serialize(&proof).map(|b| b.len()).unwrap_or(0);
    let t1 = Instant::now();
    let ok = verify(&config, &air, &proof, &[]).is_ok();
    let verify_ms = t1.elapsed().as_secs_f64() * 1000.0;
    (prove_ms, verify_ms, size, ok)
}

fn main() -> Result<(), impl Debug> {
    println!("# M2b-1: full WOTS+ public-key derivation (SPHINCS+-SHAKE-128s)");
    println!("# n={N} w={W} len1={LEN1} len2={LEN2} len={LEN}  F = one Keccak-f per call");

    let pk_seed = [0x11u8; N];
    let mut sk = [[0u8; N]; LEN];
    for (i, sk_i) in sk.iter_mut().enumerate() {
        sk_i[0] = i as u8;
        sk_i[1] = 0xAB;
    }
    let mut msg = [0u8; N];
    for (i, b) in msg.iter_mut().enumerate() {
        *b = (i as u8).wrapping_mul(37).wrapping_add(5);
    }

    let (pk, states) = wots_pubkey(&pk_seed, &sk, &msg);
    println!(
        "WOTS+ pk elements = {}, Keccak-f permutations collected = {}",
        pk.len(),
        states.len()
    );
    println!("pk[0]  = {}", hex(&pk[0]));
    println!("pk[{}] = {}", LEN - 1, hex(&pk[LEN - 1]));

    let n_perms = states.len();
    let (prove_ms, verify_ms, size, ok) = prove_states(states);
    println!();
    println!(
        "{:>28} | {:>7} | {:>12} | {:>12} | {:>12} | {:>5}",
        "unit", "perms", "prove_ms", "verify_ms", "proof_bytes", "ok"
    );
    println!(
        "{:>28} | {:>7} | {:>12.1} | {:>12.1} | {:>12} | {:>5}",
        "1 full WOTS+ pubkey", n_perms, prove_ms, verify_ms, size, ok
    );

    let per = prove_ms / n_perms as f64;
    println!();
    println!("# per-permutation prove ~= {:.1} ms; extrapolation to a full SPHINCS+ sig:", per);
    let full = 8000usize;
    println!(
        "{:>28} | {:>7} | {:>12.0}",
        "~full sig (order 8k perms)", full, full as f64 * per
    );

    if ok {
        Ok(())
    } else {
        Err("proof verification failed")
    }
}

fn hex(b: &[u8]) -> String {
    b.iter().map(|x| format!("{x:02x}")).collect()
}
