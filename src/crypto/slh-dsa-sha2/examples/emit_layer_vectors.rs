//! Emit per-layer vectors: `base_2b`, a WOTS+ chain, and the three
//! `pkFromSig` reconstructions, plus one complete signature.
//!
//! Each layer of the Solidity verifier is pinned against the layer below it,
//! so a failure names the algorithm that broke rather than just the signature.

use core::convert::Infallible;
use std::fs;

use sha2::{Digest, Sha256};
use slh_dsa::{Sha2_128s, SigningKey, VerifyingKey};
use slh_dsa_sha2::adrs::{self, Adrs};
use slh_dsa_sha2::params::*;
use slh_dsa_sha2::verify::{base_2b, chain, fors_pk_from_sig, wots_pk_from_sig, xmss_pk_from_sig};

struct CountRng { state: [u8; 32], buf: Vec<u8>, pos: usize }

impl CountRng {
    fn new(seed: u64) -> Self {
        let mut state = [0u8; 32];
        state[..8].copy_from_slice(&seed.to_le_bytes());
        Self { state, buf: Vec::new(), pos: 0 }
    }
    fn next_byte(&mut self) -> u8 {
        if self.pos >= self.buf.len() {
            let mut hasher = Sha256::new();
            hasher.update(self.state);
            self.state = hasher.finalize().into();
            self.buf = self.state.to_vec();
            self.pos = 0;
        }
        let b = self.buf[self.pos];
        self.pos += 1;
        b
    }
}

impl rand_core::TryRng for CountRng {
    type Error = Infallible;
    fn try_next_u32(&mut self) -> Result<u32, Infallible> {
        let mut b = [0u8; 4]; self.try_fill_bytes(&mut b)?; Ok(u32::from_le_bytes(b))
    }
    fn try_next_u64(&mut self) -> Result<u64, Infallible> {
        let mut b = [0u8; 8]; self.try_fill_bytes(&mut b)?; Ok(u64::from_le_bytes(b))
    }
    fn try_fill_bytes(&mut self, dst: &mut [u8]) -> Result<(), Infallible> {
        for s in dst.iter_mut() { *s = self.next_byte(); }
        Ok(())
    }
}

impl rand_core::TryCryptoRng for CountRng {}

fn hex(bytes: &[u8]) -> String {
    bytes.iter().map(|b| format!("{b:02x}")).collect()
}

fn main() {
    let dir = std::env::args().nth(1).expect("usage: emit_layer_vectors <out-dir>");

    let pk_seed: [u8; N] = core::array::from_fn(|i| 0x20 + i as u8);
    let m1: [u8; N] = core::array::from_fn(|i| 0x40 + i as u8);

    // --- chain: a WOTS+ chain segment with a non-zero start ---
    let mut chain_adrs = Adrs::new();
    chain_adrs.set_layer_address(2);
    chain_adrs.set_tree_address(0x0102030405060708);
    chain_adrs.set_type_and_clear(adrs::WOTS_HASH);
    chain_adrs.set_key_pair_address(7);
    chain_adrs.set_chain_address(11);
    let chain_start = 3u32;
    let chain_steps = 5u32;
    let mut ca = chain_adrs;
    let chain_out = chain(&m1, chain_start, chain_steps, &pk_seed, &mut ca);

    // --- a real signature, so the reconstructions run on genuine data ---
    let message = b"quantum shield unlock".to_vec();
    let mut rng = CountRng::new(42);
    let sk = SigningKey::<Sha2_128s>::new(&mut rng);
    let vk: VerifyingKey<Sha2_128s> = sk.as_ref().clone();
    let sig_obj = signature::Signer::sign(&sk, message.as_slice());
    let pk = vk.to_bytes().to_vec();
    let sig = sig_obj.to_bytes().to_vec();

    // The message the pure variant actually signs.
    let mut prepared = vec![0x00, 0x00];
    prepared.extend_from_slice(&message);

    let r: [u8; N] = sig[..N].try_into().unwrap();
    let sig_fors = &sig[N..N + SIG_FORS_BYTES];
    let sig_ht = &sig[N + SIG_FORS_BYTES..];
    let pk_seed_real: [u8; N] = pk[..N].try_into().unwrap();
    let pk_root: [u8; N] = pk[N..].try_into().unwrap();

    let digest = slh_dsa_sha2::hash::h_msg(&r, &pk_seed_real, &pk_root, &prepared);
    let md = &digest[..MD_BYTES];
    let tree_bytes = &digest[MD_BYTES..MD_BYTES + TREE_BYTES];
    let leaf_bytes = &digest[MD_BYTES + TREE_BYTES..MD_BYTES + TREE_BYTES + LEAF_BYTES];

    let mut tree_val = 0u64;
    for &b in tree_bytes { tree_val = (tree_val << 8) | b as u64; }
    let idx_tree = tree_val & (u64::MAX >> (64 - (H - H / D)));
    let mut leaf_val = 0u32;
    for &b in leaf_bytes { leaf_val = (leaf_val << 8) | b as u32; }
    let idx_leaf = leaf_val & (u32::MAX >> (32 - H_PRIME));

    // --- fors_pkFromSig ---
    let mut fors_adrs = Adrs::new();
    fors_adrs.set_tree_address(idx_tree);
    fors_adrs.set_type_and_clear(adrs::FORS_TREE);
    fors_adrs.set_key_pair_address(idx_leaf);
    let mut fa = fors_adrs;
    let fors_pk = fors_pk_from_sig(sig_fors, md, &pk_seed_real, &mut fa);

    // --- wots and xmss on the bottom hypertree layer ---
    let xmss_sig_len = (H_PRIME + LEN) * N;
    let mut xmss_adrs = Adrs::new();
    xmss_adrs.set_tree_address(idx_tree);
    xmss_adrs.set_layer_address(0);
    let mut xa = xmss_adrs;
    let xmss_root = xmss_pk_from_sig(idx_leaf, &sig_ht[..xmss_sig_len], &fors_pk, &pk_seed_real, &mut xa);

    let mut wots_adrs = xmss_adrs;
    wots_adrs.set_type_and_clear(adrs::WOTS_HASH);
    wots_adrs.set_key_pair_address(idx_leaf);
    let mut wa = wots_adrs;
    let wots_pk = wots_pk_from_sig(&sig_ht[..LEN * N], &fors_pk, &pk_seed_real, &mut wa);

    let json = format!(
        r#"{{
  "base2bInput": "{}",
  "base2bDigits": [{}],
  "chainPkSeed": "{}",
  "chainAdrs": "{}",
  "chainInput": "{}",
  "chainStart": {},
  "chainSteps": {},
  "chainOut": "{}",
  "message": "{}",
  "pk": "{}",
  "sig": "{}",
  "digest": "{}",
  "idxTree": {},
  "idxLeaf": {},
  "forsAdrs": "{}",
  "forsPk": "{}",
  "wotsAdrs": "{}",
  "wotsPk": "{}",
  "xmssAdrs": "{}",
  "xmssRoot": "{}",
  "pkRoot": "{}"
}}"#,
        hex(md),
        base_2b(md, A, K).iter().map(|d| d.to_string()).collect::<Vec<_>>().join(", "),
        hex(&pk_seed),
        hex(&chain_adrs.0),
        hex(&m1),
        chain_start,
        chain_steps,
        hex(&chain_out),
        hex(&message),
        hex(&pk),
        hex(&sig),
        hex(&digest),
        idx_tree,
        idx_leaf,
        hex(&fors_adrs.0),
        hex(&fors_pk),
        hex(&wots_adrs.0),
        hex(&wots_pk),
        hex(&xmss_adrs.0),
        hex(&xmss_root),
        hex(&pk_root),
    );

    let path = format!("{dir}/slhdsa_sha2_layers.json");
    fs::write(&path, &json).unwrap();
    println!("wrote {path}");
    println!("idx_tree={idx_tree} idx_leaf={idx_leaf}");
    println!("fors_pk  = {}", hex(&fors_pk));
    println!("wots_pk  = {}", hex(&wots_pk));
    println!("xmss_root= {}", hex(&xmss_root));
}
