//! WOTS+ signature-verification witness for SPHINCS+-SHAKE-128s (FIPS 205),
//! digit-driven variable-length chains, plus controlled tampering for the
//! negative tests.
//!
//! FIPS 205 `wots_pkFromSig` recovers pk element i by continuing chain i from
//! the signature element: F is applied at hash addresses d_i, d_i+1, .., w-2,
//! i.e. `w-1-d_i` applications, where d_i is the i-th base-w message digit
//! (len1 digits of the message, then len2 checksum digits). A chain whose
//! digit is w-1 performs no F at all — the signature element *is* the pk
//! element, which the verifier checks natively outside the circuit.
//!
//! As in M1/M2a, every F(PK.seed, ADRS, M) over a 64-byte input is a single
//! Keccak-f[1600] permutation and each reconstructed absorption state is
//! asserted against the `sha3` reference implementation.

use sha3::digest::{ExtendableOutput, Update, XofReader};
use sha3::Shake256;

/// Security parameter n in bytes (SPHINCS+-SHAKE-128s).
pub const N: usize = 16;
/// Winternitz parameter.
pub const W: usize = 16;
/// Highest chain step / hash address (w - 1); also the "no chain" digit.
pub const MAX_STEP: usize = W - 1;
/// Message digits (2 per byte of the n-byte message).
pub const LEN1: usize = 2 * N;
/// Checksum digits.
pub const LEN2: usize = 3;
/// Number of WOTS+ chains: len1 + len2.
pub const WOTS_LEN: usize = LEN1 + LEN2;
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

/// FIPS 205 message digits for lg_w = 4: base_2b(md, 4, len1) — the nibbles
/// of the message, high nibble first — followed by the len2 checksum digits
/// of csum = sum(w-1-d_i) left-shifted by 8 - (len2*lg_w mod 8) = 4 bits.
pub fn wots_digits(md: &[u8; N]) -> [u8; WOTS_LEN] {
    let mut d = [0u8; WOTS_LEN];
    for (i, b) in md.iter().enumerate() {
        d[2 * i] = b >> 4;
        d[2 * i + 1] = b & 0x0F;
    }
    let csum: u16 = d[..LEN1].iter().map(|&x| (MAX_STEP as u16) - x as u16).sum();
    let cb = (csum << 4).to_be_bytes();
    d[LEN1] = cb[0] >> 4;
    d[LEN1 + 1] = cb[0] & 0x0F;
    d[LEN1 + 2] = cb[1] >> 4;
    d
}

/// The publicly-derived walk over active chains (digit < w-1): the index of
/// the first active chain and, per chain, the index of the next active chain
/// (0 as the "padding follows" sentinel on the last active chain — sound
/// because a genuine successor always has index > 0, and re-entering chain 0
/// only re-proves an already-bound segment).
pub struct Walk {
    pub first_active: usize,
    pub next_active: [usize; WOTS_LEN],
}

pub fn derive_walk(digits: &[u8; WOTS_LEN]) -> Walk {
    let active: Vec<usize> =
        (0..WOTS_LEN).filter(|&k| (digits[k] as usize) < MAX_STEP).collect();
    assert!(
        !active.is_empty(),
        "checksum digits guarantee at least one active chain"
    );
    let mut next_active = [0usize; WOTS_LEN];
    for pair in active.windows(2) {
        next_active[pair[0]] = pair[1];
    }
    Walk { first_active: active[0], next_active }
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
/// the keccak permutations themselves valid — only the digit-driven structure
/// (or its relation to the public inputs) is broken.
pub enum Tamper {
    None,
    /// Flip one bit of the running value before hash address `at_step` of
    /// `chain`, breaking the output->input link (M2a regression case).
    BreakChain { chain: usize, at_step: usize },
    /// Start `chain` one step early (digit - 1): one extra F application, as
    /// a forger holding the pre-image one step back would attempt.
    WrongStartDigit { chain: usize },
    /// Stop `chain` one step early (last F at hash address w-3).
    StopEarly { chain: usize },
    /// Run `chain` one step past the end (extra F at hash address w-1).
    Overrun { chain: usize },
    /// Omit the active `chain` from the trace entirely.
    SkipChain { chain: usize },
}

/// One Keccak-f permutation of the witness plus its chain position.
pub struct PermMeta {
    pub state: [u64; 25],
    pub chain: usize,
    pub step: usize,
    /// The next permutation continues this chain.
    pub links_next: bool,
}

pub struct Witness {
    pub perms: Vec<PermMeta>,
    /// Per-chain signature elements (chain start values), all 35 chains.
    pub sigs: Vec<[u8; N]>,
    /// Per-chain recovered pk elements, all 35 chains (pk = sig where
    /// digit = w-1).
    pub pks: Vec<[u8; N]>,
}

/// Run `wots_pkFromSig` for the given message digits, collecting every
/// permutation input state. Signature elements are deterministic stand-ins;
/// the circuit only cares that they match the public inputs.
pub fn build_witness(
    pk_seed: &[u8; N],
    params: &AdrsParams,
    digits: &[u8; WOTS_LEN],
    tamper: &Tamper,
) -> Witness {
    let mut perms: Vec<PermMeta> = Vec::new();
    let mut sigs = Vec::with_capacity(WOTS_LEN);
    let mut pks = Vec::with_capacity(WOTS_LEN);

    for k in 0..WOTS_LEN {
        let mut h = Shake256::default();
        h.update(b"qs-m2b-sig");
        h.update(&(k as u32).to_be_bytes());
        let mut sig = [0u8; N];
        h.finalize_xof().read(&mut sig);
        sigs.push(sig);

        let mut first_step = digits[k] as usize;
        let mut last_step = MAX_STEP; // exclusive: F runs at first_step..last_step
        let mut skip = false;
        match tamper {
            Tamper::WrongStartDigit { chain } if *chain == k => {
                assert!(first_step > 0, "pick a chain with digit > 0");
                first_step -= 1;
            }
            Tamper::StopEarly { chain } if *chain == k => last_step = MAX_STEP - 1,
            Tamper::Overrun { chain } if *chain == k => last_step = MAX_STEP + 1,
            Tamper::SkipChain { chain } if *chain == k => skip = true,
            _ => {}
        }

        let mut x = sig;
        if !skip {
            for s in first_step..last_step {
                if let Tamper::BreakChain { chain, at_step } = tamper {
                    if *chain == k && *at_step == s {
                        x[0] ^= 0x01;
                    }
                }
                let adrs =
                    wots_adrs(params, ADRS_TYPE_WOTS_HASH, k as u32, s as u32);
                let (next, state_in) = f_with_state(pk_seed, &adrs, &x);
                perms.push(PermMeta { state: state_in, chain: k, step: s, links_next: true });
                x = next;
            }
        }
        if let Some(last) = perms.last_mut() {
            if last.chain == k {
                last.links_next = false;
            }
        }
        pks.push(x);
    }

    Witness { perms, sigs, pks }
}
