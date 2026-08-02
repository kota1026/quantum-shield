//! Native (sha3-based) SLH-DSA-SHAKE-128s verification reference: signature
//! parsing and recomputation of every intermediate value the proof
//! composition binds — the H_msg digest, FORS roots and pk, and per-layer
//! WOTS+ pk elements and XMSS roots.
//!
//! Conformance is established end-to-end: for signatures produced by the
//! `fips205` crate, the recomputed hypertree root must equal PK.root. Any
//! misreading of the FIPS 205 structure (index extraction, ADRS layouts,
//! base-w digits, T ordering) would break that equality.

use sha3::digest::{ExtendableOutput, Update, XofReader};
use sha3::Shake256;

/// SLH-DSA-SHAKE-128s parameters (FIPS 205 Table 2).
pub const N: usize = 16;
pub const W: usize = 16;
pub const MAX_STEP: usize = W - 1;
pub const LEN1: usize = 2 * N;
pub const LEN2: usize = 3;
pub const WOTS_LEN: usize = LEN1 + LEN2;
pub const FORS_K: usize = 14;
pub const FORS_A: usize = 12;
pub const HT_D: usize = 7;
pub const XMSS_H: usize = 9;
pub const M_DIGEST: usize = 30; // md 21 + idx_tree 7 + idx_leaf 2
pub const SIG_LEN: usize = N + FORS_K * (1 + FORS_A) * N + HT_D * (WOTS_LEN + XMSS_H) * N;

/// FIPS 205 ADRS type constants.
pub const ADRS_WOTS_HASH: u32 = 0;
pub const ADRS_WOTS_PK: u32 = 1;
pub const ADRS_TREE: u32 = 2;
pub const ADRS_FORS_TREE: u32 = 3;
pub const ADRS_FORS_ROOTS: u32 = 4;

/// 32-byte ADRS: layer(4) || tree(12) || type(4) || w1 || w2 || w3, BE.
pub fn adrs(layer: u32, tree: u64, t: u32, w1: u32, w2: u32, w3: u32) -> [u8; 32] {
    let mut a = [0u8; 32];
    a[0..4].copy_from_slice(&layer.to_be_bytes());
    a[8..16].copy_from_slice(&tree.to_be_bytes()); // 12-byte field, top 4 zero
    a[16..20].copy_from_slice(&t.to_be_bytes());
    a[20..24].copy_from_slice(&w1.to_be_bytes());
    a[24..28].copy_from_slice(&w2.to_be_bytes());
    a[28..32].copy_from_slice(&w3.to_be_bytes());
    a
}

pub fn shake256(input: &[u8], out_len: usize) -> Vec<u8> {
    let mut h = Shake256::default();
    h.update(input);
    let mut r = h.finalize_xof();
    let mut o = vec![0u8; out_len];
    r.read(&mut o);
    o
}

pub fn shake256_16(input: &[u8]) -> [u8; N] {
    shake256(input, N).try_into().expect("n bytes")
}

/// F/H/T: SHAKE256(PK.seed || ADRS || M..) truncated to n bytes.
pub fn thash(pk_seed: &[u8; N], a: &[u8; 32], parts: &[&[u8]]) -> [u8; N] {
    let mut input = Vec::new();
    input.extend_from_slice(pk_seed);
    input.extend_from_slice(a);
    for p in parts {
        input.extend_from_slice(p);
    }
    shake256_16(&input)
}

/// FIPS 205 base-w (lg_w = 4) message digits + checksum digits.
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

// ---- Signature / public-key views ----

pub struct ParsedSig<'a> {
    pub r: &'a [u8],
    /// (sk element, 12 auth nodes) per FORS tree.
    pub fors: Vec<(&'a [u8], Vec<&'a [u8]>)>,
    /// (35 WOTS+ sig elements, 9 XMSS auth nodes) per hypertree layer.
    pub ht: Vec<(Vec<&'a [u8]>, Vec<&'a [u8]>)>,
}

pub fn parse_sig(sig: &[u8]) -> ParsedSig<'_> {
    assert_eq!(sig.len(), SIG_LEN);
    let r = &sig[0..N];
    let mut off = N;
    let mut fors = Vec::with_capacity(FORS_K);
    for _ in 0..FORS_K {
        let sk = &sig[off..off + N];
        off += N;
        let mut auth = Vec::with_capacity(FORS_A);
        for _ in 0..FORS_A {
            auth.push(&sig[off..off + N]);
            off += N;
        }
        fors.push((sk, auth));
    }
    let mut ht = Vec::with_capacity(HT_D);
    for _ in 0..HT_D {
        let mut wots = Vec::with_capacity(WOTS_LEN);
        for _ in 0..WOTS_LEN {
            wots.push(&sig[off..off + N]);
            off += N;
        }
        let mut auth = Vec::with_capacity(XMSS_H);
        for _ in 0..XMSS_H {
            auth.push(&sig[off..off + N]);
            off += N;
        }
        ht.push((wots, auth));
    }
    assert_eq!(off, SIG_LEN);
    ParsedSig { r, fors, ht }
}

/// H_msg digest split (FIPS 205 slh_verify_internal): md || idx_tree || idx_leaf.
pub struct Digest {
    pub bytes: [u8; M_DIGEST],
    pub fors_indices: [u32; FORS_K],
    pub idx_tree: u64,
    pub idx_leaf: u32,
}

/// digest = SHAKE256(R || PK.seed || PK.root || M', 30) where M' is the
/// pure-signing domain framing 0x00 || len(ctx) || ctx || M (empty ctx).
pub fn h_msg_input(r: &[u8], pk_seed: &[u8; N], pk_root: &[u8; N], msg: &[u8]) -> Vec<u8> {
    let mut input = Vec::new();
    input.extend_from_slice(r);
    input.extend_from_slice(pk_seed);
    input.extend_from_slice(pk_root);
    input.push(0x00);
    input.push(0x00);
    input.extend_from_slice(msg);
    input
}

pub fn split_digest(bytes: [u8; M_DIGEST]) -> Digest {
    // FORS indices: 14 x 12-bit, MSB-first bitstream over md = bytes[0..21].
    let mut fors_indices = [0u32; FORS_K];
    for (i, idx) in fors_indices.iter_mut().enumerate() {
        let mut v = 0u32;
        for b in 0..FORS_A {
            let bit_pos = i * FORS_A + b;
            let bit = (bytes[bit_pos / 8] >> (7 - bit_pos % 8)) & 1;
            v = (v << 1) | bit as u32;
        }
        *idx = v;
    }
    let mut t = [0u8; 8];
    t[1..8].copy_from_slice(&bytes[21..28]);
    let idx_tree = u64::from_be_bytes(t) & ((1u64 << 54) - 1);
    let idx_leaf =
        (u16::from_be_bytes([bytes[28], bytes[29]]) & ((1 << XMSS_H) - 1)) as u32;
    Digest { bytes, fors_indices, idx_tree, idx_leaf }
}

/// Every intermediate value the proof composition binds, recomputed natively.
pub struct Intermediates {
    pub digest: Digest,
    pub fors_roots: [[u8; N]; FORS_K],
    pub fors_pk: [u8; N],
    /// Per layer: (tree address, keypair address, digits, wots pk elements,
    /// recovered root).
    pub layers: Vec<LayerValues>,
}

pub struct LayerValues {
    pub tree: u64,
    pub kp: u32,
    pub wots_pks: [[u8; N]; WOTS_LEN],
    pub root: [u8; N],
}

pub fn compute_intermediates(
    pk_seed: &[u8; N],
    pk_root: &[u8; N],
    msg: &[u8],
    sig: &ParsedSig,
) -> Intermediates {
    let digest_bytes: [u8; M_DIGEST] =
        shake256(&h_msg_input(sig.r, pk_seed, pk_root, msg), M_DIGEST)
            .try_into()
            .expect("30 bytes");
    let digest = split_digest(digest_bytes);
    let tree0 = digest.idx_tree;
    let kp0 = digest.idx_leaf;

    // FORS roots.
    let mut fors_roots = [[0u8; N]; FORS_K];
    for i in 0..FORS_K {
        let (sk, auth) = &sig.fors[i];
        let idx_global = (i as u32) * (1 << FORS_A) + digest.fors_indices[i];
        let a = adrs(0, tree0, ADRS_FORS_TREE, kp0, 0, idx_global);
        let mut node = thash(pk_seed, &a, &[sk]);
        for (j, sib) in auth.iter().enumerate() {
            let h = (j + 1) as u32;
            let a = adrs(0, tree0, ADRS_FORS_TREE, kp0, h, idx_global >> h);
            let bit = (digest.fors_indices[i] >> j) & 1;
            node = if bit == 0 {
                thash(pk_seed, &a, &[&node, sib])
            } else {
                thash(pk_seed, &a, &[sib, &node])
            };
        }
        fors_roots[i] = node;
    }
    let a = adrs(0, tree0, ADRS_FORS_ROOTS, kp0, 0, 0);
    let root_refs: Vec<&[u8]> = fors_roots.iter().map(|r| r.as_slice()).collect();
    let fors_pk = thash(pk_seed, &a, &root_refs);

    // Hypertree layers.
    let mut layers = Vec::with_capacity(HT_D);
    let mut tree = tree0;
    let mut kp = kp0;
    let mut m = fors_pk;
    for l in 0..HT_D {
        let (wots_sig, xmss_auth) = &sig.ht[l];
        let digits = wots_digits(&m);
        let mut wots_pks = [[0u8; N]; WOTS_LEN];
        for k in 0..WOTS_LEN {
            let mut x: [u8; N] = wots_sig[k].try_into().expect("n bytes");
            for s in digits[k] as usize..MAX_STEP {
                let a =
                    adrs(l as u32, tree, ADRS_WOTS_HASH, kp, k as u32, s as u32);
                x = thash(pk_seed, &a, &[&x]);
            }
            wots_pks[k] = x;
        }
        let a = adrs(l as u32, tree, ADRS_WOTS_PK, kp, 0, 0);
        let pk_refs: Vec<&[u8]> = wots_pks.iter().map(|p| p.as_slice()).collect();
        let mut node = thash(pk_seed, &a, &pk_refs);
        for (j, sib) in xmss_auth.iter().enumerate() {
            let h = (j + 1) as u32;
            let a = adrs(l as u32, tree, ADRS_TREE, 0, h, kp >> h);
            let bit = (kp >> j) & 1;
            node = if bit == 0 {
                thash(pk_seed, &a, &[&node, sib])
            } else {
                thash(pk_seed, &a, &[sib, &node])
            };
        }
        layers.push(LayerValues { tree, kp, wots_pks, root: node });
        m = node;
        kp = (tree & ((1 << XMSS_H) - 1)) as u32;
        tree >>= XMSS_H;
    }

    Intermediates { digest, fors_roots, fors_pk, layers }
}
