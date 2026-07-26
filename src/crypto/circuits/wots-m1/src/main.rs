//! M1 PoC — single WOTS+ chain verification for SPHINCS+-SHAKE-128s.
//!
//! The dominant cost of verifying a SPHINCS+ signature is a very large number
//! of tweakable-hash calls. For the SHAKE variant the tweakable hash F is
//!   F(PK.seed, ADRS, M) = SHAKE256(PK.seed || ADRS || M)  truncated to n bytes,
//! and each F call over a 64-byte input (n=16 seed + 32 ADRS + 16 message) is a
//! SINGLE Keccak-f[1600] permutation (64 < 136-byte SHAKE256 rate).
//!
//! A WOTS+ chain applies F repeatedly (up to w-1 = 15 times for w=16). This PoC:
//!   1. implements F and the Keccak-f input-state reconstruction,
//!   2. validates the reconstruction against the `sha3` reference (the proven
//!      permutation really is the F the FIPS spec performs),
//!   3. runs a full WOTS+ chain and collects every Keccak-f input state,
//!   4. PROVES all those permutations with the real Plonky3 p3-keccak-air AIR,
//!   5. measures and extrapolates to a full signature.
//!
//! Feeds `docs/core/STARK_AIR_GAP_ANALYSIS.md` M1. What this proves: the
//! permutations a WOTS+ chain performs are real Keccak-f. What it does NOT yet
//! constrain (left to M2/M3): that consecutive permutations are correctly
//! chained, and that the ADRS/padding are well-formed — those need a custom
//! linking AIR on top of keccak-air.

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

// ---- SPHINCS+-SHAKE-128s parameters ----
const N: usize = 16; // security parameter (bytes)
const W: usize = 16; // Winternitz parameter
const WOTS_LEN: usize = 35; // len1 (32) + len2 (3)
const SHAKE256_RATE: usize = 136; // bytes (1088-bit rate, 512-bit capacity)

// ---- SHAKE256 single-block Keccak-f input-state reconstruction ----

/// Little-endian pack 136 rate bytes into the first 17 lanes of a fresh state.
fn absorb_single_block(input: &[u8]) -> [u64; 25] {
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

/// Squeeze the first `out` bytes (out <= rate) from a permuted state.
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

/// Reference F via the `sha3` crate: SHAKE256(input) truncated to n bytes.
fn f_reference(input: &[u8]) -> [u8; N] {
    let mut h = Shake256::default();
    h.update(input);
    let mut r = h.finalize_xof();
    let mut out = [0u8; N];
    r.read(&mut out);
    out
}

/// Tweakable hash F(PK.seed, ADRS, M) input assembly (64 bytes).
fn f_input(pk_seed: &[u8; N], adrs: &[u8; 32], m: &[u8; N]) -> Vec<u8> {
    let mut v = Vec::with_capacity(N + 32 + N);
    v.extend_from_slice(pk_seed);
    v.extend_from_slice(adrs);
    v.extend_from_slice(m);
    v
}

/// Compute F and also return the Keccak-f input state that a circuit proves.
fn f_with_state(pk_seed: &[u8; N], adrs: &[u8; 32], m: &[u8; N]) -> ([u8; N], [u64; 25]) {
    let input = f_input(pk_seed, adrs, m);
    let state_in = absorb_single_block(&input);
    // self-check: permuting the reconstructed state must reproduce the spec F
    let mut permuted = state_in;
    KeccakF {}.permute_mut(&mut permuted);
    let modeled = squeeze(&permuted, N);
    let reference = f_reference(&input);
    assert_eq!(modeled, reference.to_vec(), "state reconstruction must match sha3 reference");
    let mut out = [0u8; N];
    out.copy_from_slice(&modeled);
    (out, state_in)
}

/// Run one WOTS+ chain of `steps` applications of F, collecting each Keccak-f
/// input state. Returns (end_value, states).
fn wots_chain(pk_seed: &[u8; N], start: &[u8; N], chain_index: u16, steps: usize) -> ([u8; N], Vec<[u64; 25]>) {
    let mut x = *start;
    let mut states = Vec::with_capacity(steps);
    for s in 0..steps {
        // deterministic hash-address encoding (chain index + step) — a stand-in
        // for the full SPHINCS+ ADRS; exact layout is constrained in M2
        let mut adrs = [0u8; 32];
        adrs[0..2].copy_from_slice(&chain_index.to_be_bytes());
        adrs[2..4].copy_from_slice(&(s as u16).to_be_bytes());
        let (next, state_in) = f_with_state(pk_seed, &adrs, &x);
        x = next;
        states.push(state_in);
    }
    (x, states)
}

// ---- Plonky3 keccak-air proving config (same as M0) ----
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
    println!("# M1: single WOTS+ chain verification (SPHINCS+-SHAKE-128s)");
    println!("# n={N} w={W} wots_len={WOTS_LEN}  F = one Keccak-f[1600] per call");

    let pk_seed = [0x11u8; N];
    let start = [0x22u8; N];
    let steps = W - 1; // full chain length

    // Build + self-verify the chain (asserts each F matches the sha3 reference)
    let (end, states) = wots_chain(&pk_seed, &start, 0, steps);
    println!("chain steps = {steps}, permutations collected = {}", states.len());
    println!("chain end value = {}", hex(&end));

    // Prove every permutation the chain performed
    let (prove_ms, verify_ms, size, ok) = prove_states(states);
    println!();
    println!("{:>22} | {:>12} | {:>12} | {:>12} | {:>5}", "unit", "prove_ms", "verify_ms", "proof_bytes", "ok");
    println!("{:>22} | {:>12.1} | {:>12.1} | {:>12} | {:>5}", "1 WOTS+ chain (15 F)", prove_ms, verify_ms, size, ok);

    // Extrapolation to larger units (permutation counts are exact; timing is
    // linear-ish in perms, verify/size grow sublinearly — see M0)
    let per_perm_ms = prove_ms / steps as f64;
    let wots_sig_perms = WOTS_LEN * steps; // worst case, whole WOTS+ verification
    println!();
    println!("# extrapolation (perm counts exact; prove_ms scaled at {:.1} ms/perm)", per_perm_ms);
    println!("{:>34} | {:>10} | {:>12}", "unit", "perms", "prove_ms~");
    println!("{:>34} | {:>10} | {:>12.0}", "1 WOTS+ chain", steps, prove_ms);
    println!("{:>34} | {:>10} | {:>12.0}", "1 WOTS+ sig (len=35 chains)", wots_sig_perms, wots_sig_perms as f64 * per_perm_ms);
    // A full SPHINCS+-SHAKE-128s verification is ~10^3-10^4 F calls (FORS +
    // hypertree of d=7 WOTS+ instances + Merkle nodes). Report a conservative
    // 8k-perm reference point.
    let full_sig_perms = 8000usize;
    println!("{:>34} | {:>10} | {:>12.0}", "~full sig (order 8k perms)", full_sig_perms, full_sig_perms as f64 * per_perm_ms);

    if ok {
        Ok(())
    } else {
        Err("proof verification failed")
    }
}

fn hex(b: &[u8]) -> String {
    b.iter().map(|x| format!("{x:02x}")).collect()
}
