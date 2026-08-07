//! Tweakable hash functions for the SHAKE parameter sets (FIPS 205 §11.1),
//! instrumented to record every Keccak-f[1600] permutation.
//!
//! For SHAKE-based SLH-DSA every tweakable hash is the same primitive:
//! `SHAKE256(PK.seed ‖ ADRS ‖ M, 8n)`. Only `H_msg` differs
//! (`SHAKE256(R ‖ PK.seed ‖ PK.root ‖ M, 8m)`). Recording the sponge state
//! before each permutation gives exactly the witness `p3-keccak-air`
//! consumes, so the circuit and the reference implementation cannot drift.

use p3_keccak::KeccakF;
use p3_symmetric::Permutation;

use crate::adrs::Adrs;
use crate::params::N;

/// SHAKE256 rate in bytes.
pub const RATE: usize = 136;

/// SHAKE domain-separation byte (FIPS 202).
pub const SHAKE_DOMAIN: u8 = 0x1f;

/// SHA3 domain-separation byte (FIPS 202).
pub const SHA3_DOMAIN: u8 = 0x06;

/// Keccak (pre-FIPS, Ethereum) domain-separation byte.
///
/// Needed because the FR-THRESH-5 active-set commitment the same proof must
/// verify is built with `keccak256` on-chain — see `ProverRegistry.sol` and
/// `docs/core/STARK_AIR_GAP_ANALYSIS.md` §6. Only the padding byte differs;
/// the permutation, and therefore the AIR, is identical.
pub const KECCAK_DOMAIN: u8 = 0x01;

/// Which tweakable hash produced a call (for readability of the DAG).
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum HashKind {
    /// `H_msg` — the message digest.
    HMsg,
    /// `F` — one n-byte input (WOTS+ chain step, FORS leaf).
    F,
    /// `H` — two n-byte inputs (tree node).
    H,
    /// `T_l` — l n-byte inputs (WOTS+ public key, FORS roots).
    T,
}

/// One tweakable-hash call: its n-byte value inputs, its digest, and the
/// span of Keccak permutations it consumed.
///
/// This is the DAG the M3 linking argument has to enforce: an input that
/// equals some earlier call's `output` is an *internal* edge and must be
/// proven, rather than taken on trust from the prover.
#[derive(Clone, Debug)]
pub struct HashCall {
    pub kind: HashKind,
    pub inputs: Vec<[u8; N]>,
    pub output: [u8; N],
    pub perm_start: usize,
    pub perm_count: usize,
}

/// One 32-byte hash call — the registry commitment's leaves and Merkle nodes
/// (FR-THRESH-5), which the same proof must verify. Kept separate from
/// [`HashCall`] because SPHINCS+ works in 16-byte digests and the registry
/// tree in 32-byte ones, and the two must not be confused.
#[derive(Clone, Debug)]
pub struct NodeCall {
    pub inputs: Vec<[u8; 32]>,
    pub output: [u8; 32],
    pub perm_start: usize,
    pub perm_count: usize,
}

/// Records the pre-permutation sponge state of every Keccak-f invocation and
/// the hash-call DAG, both in evaluation order.
#[derive(Clone, Debug, Default)]
pub struct PermTrace {
    pub states: Vec<[u64; 25]>,
    pub calls: Vec<HashCall>,
    pub node_calls: Vec<NodeCall>,
}

impl PermTrace {
    /// Number of Keccak permutations recorded.
    pub fn len(&self) -> usize {
        self.states.len()
    }

    pub fn is_empty(&self) -> bool {
        self.states.is_empty()
    }

    fn record_call(&mut self, kind: HashKind, inputs: Vec<[u8; N]>, output: [u8; N], start: usize) {
        let perm_count = self.states.len() - start;
        self.calls.push(HashCall { kind, inputs, output, perm_start: start, perm_count });
    }

    /// Record a 32-byte hash call. Public so the registry commitment
    /// ([`crate`]'s sibling crate `sphincs-m3`) can contribute to the same
    /// witness without duplicating the sponge.
    pub fn record_node_call(&mut self, inputs: Vec<[u8; 32]>, output: [u8; 32], start: usize) {
        let perm_count = self.states.len() - start;
        self.node_calls.push(NodeCall { inputs, output, perm_start: start, perm_count });
    }
}

/// SHAKE256 over `parts` concatenated, squeezing `out_len` bytes.
///
/// Every permutation's input state is appended to `trace` when present.
/// `out_len <= RATE` for all SLH-DSA uses, so squeezing never permutes.
pub fn shake256_parts(parts: &[&[u8]], out_len: usize, trace: Option<&mut PermTrace>) -> Vec<u8> {
    sponge_parts(parts, SHAKE_DOMAIN, out_len, trace)
}

/// SHA3-256 over `parts` concatenated (FIPS 202 padding `0x06`).
pub fn sha3_256_parts(parts: &[&[u8]], trace: Option<&mut PermTrace>) -> [u8; 32] {
    sponge_parts(parts, SHA3_DOMAIN, 32, trace)
        .try_into()
        .expect("32 bytes")
}

/// keccak256 over `parts` concatenated (Ethereum padding `0x01`).
pub fn keccak256_parts(parts: &[&[u8]], trace: Option<&mut PermTrace>) -> [u8; 32] {
    sponge_parts(parts, KECCAK_DOMAIN, 32, trace)
        .try_into()
        .expect("32 bytes")
}

/// Keccak sponge with a caller-chosen domain byte, rate 136.
///
/// One code path for SHAKE256, SHA3-256 and keccak256 keeps the recorded
/// permutation witness identical in shape across all three, which is what
/// lets a single Keccak table prove them together.
pub fn sponge_parts(
    parts: &[&[u8]],
    domain: u8,
    out_len: usize,
    trace: Option<&mut PermTrace>,
) -> Vec<u8> {
    assert!(out_len <= RATE, "squeezing past one rate block is not used here");

    let total: usize = parts.iter().map(|p| p.len()).sum();
    let mut padded = Vec::with_capacity(total.div_ceil(RATE).max(1) * RATE);
    for p in parts {
        padded.extend_from_slice(p);
    }
    padded.push(domain);
    while padded.len() % RATE != 0 {
        padded.push(0);
    }
    let last = padded.len() - 1;
    padded[last] |= 0x80;

    let mut state = [0u64; 25];
    let mut recorder = trace;
    for block in padded.chunks(RATE) {
        for (i, chunk) in block.chunks(8).enumerate() {
            state[i] ^= u64::from_le_bytes(chunk.try_into().unwrap());
        }
        if let Some(rec) = recorder.as_deref_mut() {
            rec.states.push(state);
        }
        KeccakF.permute_mut(&mut state);
    }

    let mut out = Vec::with_capacity(out_len);
    'squeeze: for word in state.iter().take(RATE / 8) {
        for b in word.to_le_bytes() {
            out.push(b);
            if out.len() == out_len {
                break 'squeeze;
            }
        }
    }
    out
}

fn to_n(bytes: Vec<u8>) -> [u8; N] {
    bytes.try_into().expect("output length is N")
}

/// `F(PK.seed, ADRS, M1)` — one n-byte input (one permutation).
pub fn f(pk_seed: &[u8; N], adrs: &Adrs, m1: &[u8; N], trace: Option<&mut PermTrace>) -> [u8; N] {
    match trace {
        None => to_n(shake256_parts(&[pk_seed, &adrs.0, m1], N, None)),
        Some(t) => {
            let start = t.states.len();
            let out = to_n(shake256_parts(&[pk_seed, &adrs.0, m1], N, Some(&mut *t)));
            t.record_call(HashKind::F, vec![*m1], out, start);
            out
        }
    }
}

/// `H(PK.seed, ADRS, M2)` — two n-byte inputs (one permutation).
pub fn h(
    pk_seed: &[u8; N],
    adrs: &Adrs,
    left: &[u8; N],
    right: &[u8; N],
    trace: Option<&mut PermTrace>,
) -> [u8; N] {
    match trace {
        None => to_n(shake256_parts(&[pk_seed, &adrs.0, left, right], N, None)),
        Some(t) => {
            let start = t.states.len();
            let out = to_n(shake256_parts(&[pk_seed, &adrs.0, left, right], N, Some(&mut *t)));
            t.record_call(HashKind::H, vec![*left, *right], out, start);
            out
        }
    }
}

/// `T_l(PK.seed, ADRS, M)` — l n-byte inputs (multi-block absorb).
pub fn t_l(
    pk_seed: &[u8; N],
    adrs: &Adrs,
    values: &[[u8; N]],
    trace: Option<&mut PermTrace>,
) -> [u8; N] {
    let mut msg = Vec::with_capacity(values.len() * N);
    for v in values {
        msg.extend_from_slice(v);
    }
    match trace {
        None => to_n(shake256_parts(&[pk_seed, &adrs.0, &msg], N, None)),
        Some(t) => {
            let start = t.states.len();
            let out = to_n(shake256_parts(&[pk_seed, &adrs.0, &msg], N, Some(&mut *t)));
            t.record_call(HashKind::T, values.to_vec(), out, start);
            out
        }
    }
}

/// `H_msg(R, PK.seed, PK.root, M)` — squeezes m bytes.
///
/// The digest is `out_len` bytes (30 for this parameter set), not n, so it is
/// recorded with a truncated-to-n output purely as a DAG placeholder: nothing
/// consumes `H_msg`'s output as an n-byte value — it is split into indices.
pub fn h_msg(
    r: &[u8; N],
    pk_seed: &[u8; N],
    pk_root: &[u8; N],
    msg: &[u8],
    out_len: usize,
    trace: Option<&mut PermTrace>,
) -> Vec<u8> {
    match trace {
        None => shake256_parts(&[r, pk_seed, pk_root, msg], out_len, None),
        Some(t) => {
            let start = t.states.len();
            let out = shake256_parts(&[r, pk_seed, pk_root, msg], out_len, Some(&mut *t));
            let mut head = [0u8; N];
            head.copy_from_slice(&out[..N]);
            t.record_call(HashKind::HMsg, vec![*r], head, start);
            out
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn hex(bytes: &[u8]) -> String {
        bytes.iter().map(|b| format!("{b:02x}")).collect()
    }

    /// FIPS 202 vectors generated independently with Python hashlib.shake_256.
    #[test]
    fn shake256_kat() {
        assert_eq!(
            hex(&shake256_parts(&[b""], 32, None)),
            "46b9dd2b0ba88d13233b3feb743eeb243fcd52ea62b81b82b50c27646ed5762f"
        );
        assert_eq!(
            hex(&shake256_parts(&[b"a", b"bc"], 32, None)),
            "483366601360a8771c6863080cc4114d8db44530f8f1e1ee4f94ea37e78b5739"
        );
    }

    /// The multi-part API must be equivalent to hashing the concatenation.
    #[test]
    fn parts_equal_concatenation() {
        let msg: Vec<u8> = (0..=255u8).cycle().take(1024).collect();
        let split = shake256_parts(&[&msg[..300], &msg[300..]], 32, None);
        let whole = shake256_parts(&[&msg], 32, None);
        assert_eq!(split, whole);
        assert_eq!(
            hex(&whole),
            "60aff3fd4c0f158ba0ed6890336a907451281739d48cc8315211b36660619742"
        );
    }

    /// Permutation counts drive the circuit size, so pin them: one block per
    /// 136 bytes of (message + 1 padding byte).
    #[test]
    fn permutation_counts_match_block_structure() {
        let pk_seed = [0u8; N];
        let adrs = Adrs::new();

        let mut t = PermTrace::default();
        f(&pk_seed, &adrs, &[0u8; N], Some(&mut t));
        assert_eq!(t.len(), 1, "F: 16+32+16 = 64 bytes -> 1 block");

        let mut t = PermTrace::default();
        h(&pk_seed, &adrs, &[0u8; N], &[0u8; N], Some(&mut t));
        assert_eq!(t.len(), 1, "H: 16+32+32 = 80 bytes -> 1 block");

        // T_k for FORS: 16+32+14*16 = 272 bytes; padding forces a third block.
        let mut t = PermTrace::default();
        t_l(&pk_seed, &adrs, &[[0u8; N]; 14], Some(&mut t));
        assert_eq!(t.len(), 3);

        // T_len for WOTS+: 16+32+35*16 = 608 bytes -> 5 blocks.
        let mut t = PermTrace::default();
        t_l(&pk_seed, &adrs, &[[0u8; N]; 35], Some(&mut t));
        assert_eq!(t.len(), 5);
    }

    /// Recording must not change the digest.
    #[test]
    fn recording_is_transparent() {
        let pk_seed = [7u8; N];
        let adrs = Adrs::new();
        let mut t = PermTrace::default();
        assert_eq!(
            f(&pk_seed, &adrs, &[3u8; N], Some(&mut t)),
            f(&pk_seed, &adrs, &[3u8; N], None)
        );
    }
}
