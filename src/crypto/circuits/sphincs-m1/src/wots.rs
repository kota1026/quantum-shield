//! WOTS+ chain witness generation for SPHINCS+-SHAKE-128s (FIPS 205).
//!
//! The F function of the SHAKE parameter sets is
//! `F(PK.seed, ADRS, M) = SHAKE256(PK.seed ‖ ADRS ‖ M, 8n)` with n = 16,
//! so one F evaluation absorbs a single 64-byte message into one rate block
//! and costs exactly ONE Keccak-f[1600] permutation. A WOTS+ chain of `s`
//! steps is therefore `s` chained permutations, which is what the AIR in
//! [`crate::air`] proves.

use crate::shake::{keccak_f, RATE, SHAKE_DOMAIN};

/// Security parameter n for SPHINCS+-SHAKE-128s (bytes).
pub const N: usize = 16;

/// Winternitz parameter for all SPHINCS+ parameter sets.
pub const W: u32 = 16;

/// 32-byte SPHINCS+ address (FIPS 205 §4.2, uncompressed — SHAKE variants).
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Adrs(pub [u8; 32]);

impl Adrs {
    pub fn new() -> Self {
        Adrs([0u8; 32])
    }

    /// WOTS_HASH address type (FIPS 205 Table 1).
    pub const TYPE_WOTS_HASH: u32 = 0;

    pub fn set_layer(&mut self, v: u32) {
        self.0[0..4].copy_from_slice(&v.to_be_bytes());
    }

    pub fn set_type(&mut self, v: u32) {
        self.0[16..20].copy_from_slice(&v.to_be_bytes());
    }

    pub fn set_key_pair(&mut self, v: u32) {
        self.0[20..24].copy_from_slice(&v.to_be_bytes());
    }

    pub fn set_chain(&mut self, v: u32) {
        self.0[24..28].copy_from_slice(&v.to_be_bytes());
    }

    pub fn set_hash(&mut self, v: u32) {
        self.0[28..32].copy_from_slice(&v.to_be_bytes());
    }
}

impl Default for Adrs {
    fn default() -> Self {
        Self::new()
    }
}

/// Build the pre-permutation sponge state for one F evaluation:
/// `SHAKE256(pk_seed ‖ adrs ‖ value, ·)` — 64 message bytes, one rate block.
pub fn f_input_state(pk_seed: &[u8; N], adrs: &Adrs, value: &[u8; N]) -> [u64; 25] {
    let mut block = [0u8; RATE];
    block[0..16].copy_from_slice(pk_seed);
    block[16..48].copy_from_slice(&adrs.0);
    block[48..64].copy_from_slice(value);
    block[64] = SHAKE_DOMAIN;
    block[RATE - 1] |= 0x80;

    let mut state = [0u64; 25];
    for (i, chunk) in block.chunks(8).enumerate() {
        state[i] = u64::from_le_bytes(chunk.try_into().unwrap());
    }
    state
}

/// F via the sponge state path (permute, squeeze first n bytes).
pub fn f(pk_seed: &[u8; N], adrs: &Adrs, value: &[u8; N]) -> [u8; N] {
    let mut state = f_input_state(pk_seed, adrs, value);
    keccak_f(&mut state);
    let mut out = [0u8; N];
    out[0..8].copy_from_slice(&state[0].to_le_bytes());
    out[8..16].copy_from_slice(&state[1].to_le_bytes());
    out
}

/// Witness for one WOTS+ chain: the pre-permutation states of each F step
/// plus the chain result.
#[derive(Clone, Debug)]
pub struct ChainWitness {
    /// Pre-permutation sponge states, one per chain step (length = steps).
    pub states: Vec<[u64; 25]>,
    /// Chain output after the last step.
    pub result: [u8; N],
    /// Hash address of the first step.
    pub start_hash_addr: u32,
    /// Number of F applications.
    pub steps: usize,
}

/// FIPS 205 `chain(X, i, s, PK.seed, ADRS)`: apply F `steps` times starting
/// at hash address `start_hash_addr`, incrementing it each step.
///
/// Requires `start_hash_addr + steps <= 256` so the hash-address increment
/// only ever touches the final address byte — the AIR's linear "+256 limb"
/// chaining constraint (see [`crate::air`]) relies on this. WOTS+ itself
/// stays far below this bound (hash addresses < w = 16).
pub fn chain_witness(
    pk_seed: &[u8; N],
    base_adrs: &Adrs,
    start_value: &[u8; N],
    start_hash_addr: u32,
    steps: usize,
) -> ChainWitness {
    assert!(steps >= 1, "chain must have at least one step");
    assert!(
        start_hash_addr as usize + steps <= 256,
        "hash address must stay within one byte for the linear AIR increment"
    );

    let mut states = Vec::with_capacity(steps);
    let mut value = *start_value;
    for i in 0..steps {
        let mut adrs = base_adrs.clone();
        adrs.set_hash(start_hash_addr + i as u32);
        states.push(f_input_state(pk_seed, &adrs, &value));
        value = f(pk_seed, &adrs, &value);
    }

    ChainWitness {
        states,
        result: value,
        start_hash_addr,
        steps,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::shake::shake256;

    fn test_adrs() -> Adrs {
        let mut adrs = Adrs::new();
        adrs.set_layer(2);
        adrs.set_type(Adrs::TYPE_WOTS_HASH);
        adrs.set_key_pair(7);
        adrs.set_chain(11);
        adrs
    }

    /// The sponge-state path must agree with plain SHAKE256 over the
    /// concatenated message — this pins the block layout and padding.
    #[test]
    fn f_matches_shake256() {
        let pk_seed = [0xA5u8; N];
        let mut adrs = test_adrs();
        adrs.set_hash(3);
        let value = [0x3Cu8; N];

        let mut msg = Vec::new();
        msg.extend_from_slice(&pk_seed);
        msg.extend_from_slice(&adrs.0);
        msg.extend_from_slice(&value);
        let expected = shake256(&msg, N);

        assert_eq!(f(&pk_seed, &adrs, &value).to_vec(), expected);
    }

    /// chain(x, i, s) == chain(chain(x, i, s1), i+s1, s-s1) — FIPS 205
    /// chain composition property.
    #[test]
    fn chain_composes() {
        let pk_seed = [0x11u8; N];
        let adrs = test_adrs();
        let x = [0x77u8; N];

        let full = chain_witness(&pk_seed, &adrs, &x, 0, 15);
        let first = chain_witness(&pk_seed, &adrs, &x, 0, 6);
        let second = chain_witness(&pk_seed, &adrs, &first.result, 6, 9);

        assert_eq!(full.result, second.result);
        assert_eq!(full.states.len(), 15);
    }

    /// Every state in the witness must chain: permuting state i and
    /// rebuilding the next block from its output reproduces state i+1.
    #[test]
    fn witness_states_chain() {
        let pk_seed = [0x42u8; N];
        let adrs = test_adrs();
        let x = [0x99u8; N];
        let w = chain_witness(&pk_seed, &adrs, &x, 0, 15);

        for i in 0..w.steps - 1 {
            let mut state = w.states[i];
            keccak_f(&mut state);
            let mut out = [0u8; N];
            out[0..8].copy_from_slice(&state[0].to_le_bytes());
            out[8..16].copy_from_slice(&state[1].to_le_bytes());

            let mut next_adrs = adrs.clone();
            next_adrs.set_hash(i as u32 + 1);
            assert_eq!(w.states[i + 1], f_input_state(&pk_seed, &next_adrs, &out));
        }
    }
}
