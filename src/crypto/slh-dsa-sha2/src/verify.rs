//! SLH-DSA-SHA2-128s verification (FIPS 205 Algorithms 4, 5, 8, 12, 14, 17,
//! 20, 24).
//!
//! The algorithm is identical to the SHAKE parameter set `sphincs-m2`
//! implements; only `crate::hash` differs. Keeping the two side by side means a
//! bug in one is visible as a divergence from the other, and both are pinned
//! against the independent RustCrypto implementation.

use crate::adrs::{self, Adrs};
use crate::hash::{f, h, h_msg, t_l};
use crate::params::*;

/// `base_2b(X, b, out_len)` (FIPS 205 Algorithm 4).
pub fn base_2b(x: &[u8], b: usize, out_len: usize) -> Vec<u32> {
    let mut out = Vec::with_capacity(out_len);
    let mut pos = 0usize;
    let mut bits = 0usize;
    let mut total = 0u64;
    for _ in 0..out_len {
        while bits < b {
            total = (total << 8) + x[pos] as u64;
            pos += 1;
            bits += 8;
        }
        bits -= b;
        out.push(((total >> bits) & ((1u64 << b) - 1)) as u32);
    }
    out
}

/// `chain(X, i, s, PK.seed, ADRS)` (FIPS 205 Algorithm 5).
fn chain(x: &[u8; N], start: u32, steps: u32, pk_seed: &[u8; N], adrs: &mut Adrs) -> [u8; N] {
    let mut tmp = *x;
    for j in start..start + steps {
        adrs.set_hash_address(j);
        tmp = f(pk_seed, adrs, &tmp);
    }
    tmp
}

/// `wots_pkFromSig(sig, M, PK.seed, ADRS)` (FIPS 205 Algorithm 8).
fn wots_pk_from_sig(sig: &[u8], msg: &[u8; N], pk_seed: &[u8; N], adrs: &mut Adrs) -> [u8; N] {
    let mut digits = base_2b(msg, LG_W, LEN1);

    let csum: u32 = digits.iter().map(|d| W - 1 - d).sum();
    let csum = csum << ((8 - ((LEN2 * LG_W) % 8)) % 8);
    let csum_len = (LEN2 * LG_W).div_ceil(8);
    let csum_be = (csum as u64).to_be_bytes();
    digits.extend(base_2b(&csum_be[8 - csum_len..], LG_W, LEN2));
    debug_assert_eq!(digits.len(), LEN);

    let mut tmp = [[0u8; N]; LEN];
    for (i, &digit) in digits.iter().enumerate() {
        adrs.set_chain_address(i as u32);
        let element: [u8; N] = sig[i * N..(i + 1) * N].try_into().unwrap();
        tmp[i] = chain(&element, digit, W - 1 - digit, pk_seed, adrs);
    }

    let mut pk_adrs = *adrs;
    pk_adrs.set_type_and_clear(adrs::WOTS_PK);
    pk_adrs.set_key_pair_address(adrs.key_pair_address());
    t_l(pk_seed, &pk_adrs, &tmp)
}

/// `xmss_pkFromSig(idx, SIG_XMSS, M, PK.seed, ADRS)` (FIPS 205 Algorithm 12).
fn xmss_pk_from_sig(
    idx: u32,
    sig_xmss: &[u8],
    msg: &[u8; N],
    pk_seed: &[u8; N],
    adrs: &mut Adrs,
) -> [u8; N] {
    adrs.set_type_and_clear(adrs::WOTS_HASH);
    adrs.set_key_pair_address(idx);

    let wots_sig = &sig_xmss[..LEN * N];
    let auth = &sig_xmss[LEN * N..];

    let mut node = wots_pk_from_sig(wots_sig, msg, pk_seed, adrs);

    adrs.set_type_and_clear(adrs::TREE);
    adrs.set_tree_index(idx);
    for k in 0..H_PRIME {
        adrs.set_tree_height(k as u32 + 1);
        let sibling: [u8; N] = auth[k * N..(k + 1) * N].try_into().unwrap();
        if (idx >> k) & 1 == 0 {
            adrs.set_tree_index(adrs.tree_index() / 2);
            node = h(pk_seed, adrs, &node, &sibling);
        } else {
            adrs.set_tree_index((adrs.tree_index() - 1) / 2);
            node = h(pk_seed, adrs, &sibling, &node);
        }
    }
    node
}

/// `ht_verify(...)` (FIPS 205 Algorithm 14).
fn ht_verify(
    msg: &[u8; N],
    sig_ht: &[u8],
    pk_seed: &[u8; N],
    mut idx_tree: u64,
    mut idx_leaf: u32,
    pk_root: &[u8; N],
) -> bool {
    let xmss_sig_len = (H_PRIME + LEN) * N;

    let mut adrs = Adrs::new();
    adrs.set_tree_address(idx_tree);
    adrs.set_layer_address(0);

    let mut node = xmss_pk_from_sig(idx_leaf, &sig_ht[..xmss_sig_len], msg, pk_seed, &mut adrs);

    for j in 1..D {
        idx_leaf = (idx_tree % (1u64 << H_PRIME)) as u32;
        idx_tree >>= H_PRIME;
        adrs.set_layer_address(j as u32);
        adrs.set_tree_address(idx_tree);
        node = xmss_pk_from_sig(
            idx_leaf,
            &sig_ht[j * xmss_sig_len..(j + 1) * xmss_sig_len],
            &node,
            pk_seed,
            &mut adrs,
        );
    }

    node == *pk_root
}

/// `fors_pkFromSig(SIG_FORS, md, PK.seed, ADRS)` (FIPS 205 Algorithm 17).
fn fors_pk_from_sig(sig_fors: &[u8], md: &[u8], pk_seed: &[u8; N], adrs: &mut Adrs) -> [u8; N] {
    let indices = base_2b(md, A, K);
    let element_len = (A + 1) * N;
    let mut roots = [[0u8; N]; K];

    for i in 0..K {
        let idx = indices[i];
        let element = &sig_fors[i * element_len..(i + 1) * element_len];
        let sk: [u8; N] = element[..N].try_into().unwrap();
        let auth = &element[N..];

        adrs.set_tree_height(0);
        adrs.set_tree_index(i as u32 * (1 << A) + idx);
        let mut node = f(pk_seed, adrs, &sk);

        for j in 0..A {
            let sibling: [u8; N] = auth[j * N..(j + 1) * N].try_into().unwrap();
            adrs.set_tree_height(j as u32 + 1);
            if (idx >> j) & 1 == 0 {
                adrs.set_tree_index(adrs.tree_index() / 2);
                node = h(pk_seed, adrs, &node, &sibling);
            } else {
                adrs.set_tree_index((adrs.tree_index() - 1) / 2);
                node = h(pk_seed, adrs, &sibling, &node);
            }
        }
        roots[i] = node;
    }

    let mut pk_adrs = *adrs;
    pk_adrs.set_type_and_clear(adrs::FORS_ROOTS);
    pk_adrs.set_key_pair_address(adrs.key_pair_address());
    t_l(pk_seed, &pk_adrs, &roots)
}

/// `slh_verify_internal(M, SIG, PK)` (FIPS 205 Algorithm 20).
pub fn slh_verify_internal(msg: &[u8], sig: &[u8], pk: &[u8]) -> bool {
    if sig.len() != SIG_BYTES || pk.len() != PK_BYTES {
        return false;
    }

    let r: [u8; N] = sig[..N].try_into().unwrap();
    let sig_fors = &sig[N..N + SIG_FORS_BYTES];
    let sig_ht = &sig[N + SIG_FORS_BYTES..];
    let pk_seed: [u8; N] = pk[..N].try_into().unwrap();
    let pk_root: [u8; N] = pk[N..].try_into().unwrap();

    let digest = h_msg(&r, &pk_seed, &pk_root, msg);

    let md = &digest[..MD_BYTES];
    let tree_bytes = &digest[MD_BYTES..MD_BYTES + TREE_BYTES];
    let leaf_bytes = &digest[MD_BYTES + TREE_BYTES..MD_BYTES + TREE_BYTES + LEAF_BYTES];

    let mut tree_val = 0u64;
    for &byte in tree_bytes {
        tree_val = (tree_val << 8) | byte as u64;
    }
    let idx_tree = tree_val & (u64::MAX >> (64 - (H - H / D)));

    let mut leaf_val = 0u32;
    for &byte in leaf_bytes {
        leaf_val = (leaf_val << 8) | byte as u32;
    }
    let idx_leaf = leaf_val & (u32::MAX >> (32 - H_PRIME));

    let mut adrs = Adrs::new();
    adrs.set_tree_address(idx_tree);
    adrs.set_type_and_clear(adrs::FORS_TREE);
    adrs.set_key_pair_address(idx_leaf);

    let pk_fors = fors_pk_from_sig(sig_fors, md, &pk_seed, &mut adrs);

    ht_verify(&pk_fors, sig_ht, &pk_seed, idx_tree, idx_leaf, &pk_root)
}

/// `slh_verify(M, SIG, ctx, PK)` (FIPS 205 Algorithm 24) — the pure variant.
///
/// Prepends `0x00 ‖ |ctx| ‖ ctx`, which is what a conforming signer produces by
/// default. `sphincs-m2`'s §24.3 note applies here too: the on-chain verifier
/// must use the same variant, or the two authorization paths disagree.
pub fn slh_verify(msg: &[u8], sig: &[u8], ctx: &[u8], pk: &[u8]) -> bool {
    if ctx.len() > 255 {
        return false;
    }
    let mut prepared = Vec::with_capacity(2 + ctx.len() + msg.len());
    prepared.push(0x00);
    prepared.push(ctx.len() as u8);
    prepared.extend_from_slice(ctx);
    prepared.extend_from_slice(msg);
    slh_verify_internal(&prepared, sig, pk)
}
