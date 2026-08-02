//! WOTS+ chain proof component — the M2b AIR (`air.rs`, ported unchanged
//! from `wots-sig-m2b`) packaged as a library: one proof instance per
//! hypertree layer, parameterized by the layer's ADRS values, message digits
//! and real signature elements.

pub mod air;

use core::borrow::BorrowMut;

use p3_field::{Field, PrimeCharacteristicRing};
use p3_goldilocks::Goldilocks;
use p3_keccak_air::{generate_trace_rows, NUM_KECCAK_COLS, NUM_ROUNDS};
use p3_matrix::dense::RowMajorMatrix;
use p3_matrix::Matrix;

use crate::refimpl::{adrs, shake256_16, ADRS_WOTS_HASH, N};
pub use crate::refimpl::{MAX_STEP, WOTS_LEN};

use air::{LinkCols, NUM_COLS, NUM_PUBLIC_VALUES};

type Val = Goldilocks;

/// One hypertree layer's WOTS+ verification instance. `pks` are the claimed
/// chain end values (public glue into the layer's T_len pipeline proof).
pub struct ChainInstance {
    pub pk_seed: [u8; N],
    pub layer: u32,
    pub tree: u64,
    pub kp: u32,
    pub digits: [u8; WOTS_LEN],
    pub sigs: [[u8; N]; WOTS_LEN],
    pub pks: [[u8; N]; WOTS_LEN],
}

struct Walk {
    first_active: usize,
    next_active: [usize; WOTS_LEN],
}

fn derive_walk(digits: &[u8; WOTS_LEN]) -> Walk {
    let active: Vec<usize> =
        (0..WOTS_LEN).filter(|&k| (digits[k] as usize) < MAX_STEP).collect();
    assert!(!active.is_empty(), "checksum digits guarantee an active chain");
    let mut next_active = [0usize; WOTS_LEN];
    for pair in active.windows(2) {
        next_active[pair[0]] = pair[1];
    }
    Walk { first_active: active[0], next_active }
}

pub struct PermMeta {
    pub state: [u64; 25],
    pub chain: usize,
    pub step: usize,
    pub links_next: bool,
}

/// Run `wots_pkFromSig` collecting every Keccak-f input state; every
/// reconstructed absorption is asserted against the `sha3` reference.
pub fn build_witness(inst: &ChainInstance) -> Vec<PermMeta> {
    let mut perms: Vec<PermMeta> = Vec::new();
    for k in 0..WOTS_LEN {
        let mut x = inst.sigs[k];
        for s in inst.digits[k] as usize..MAX_STEP {
            let a = adrs(inst.layer, inst.tree, ADRS_WOTS_HASH, inst.kp, k as u32, s as u32);
            let mut input = Vec::with_capacity(N + 32 + N);
            input.extend_from_slice(&inst.pk_seed);
            input.extend_from_slice(&a);
            input.extend_from_slice(&x);

            let mut block = [0u8; 136];
            block[..input.len()].copy_from_slice(&input);
            block[input.len()] ^= 0x1F;
            block[135] ^= 0x80;
            let mut state = [0u64; 25];
            for (i, lane) in state.iter_mut().take(17).enumerate() {
                *lane = u64::from_le_bytes(block[8 * i..8 * i + 8].try_into().unwrap());
            }
            let mut permuted = state;
            {
                use p3_symmetric::Permutation;
                p3_keccak::KeccakF {}.permute_mut(&mut permuted);
            }
            let mut next = [0u8; N];
            next[..8].copy_from_slice(&permuted[0].to_le_bytes());
            next[8..].copy_from_slice(&permuted[1].to_le_bytes());
            assert_eq!(next, shake256_16(&input), "state must match sha3 reference");

            perms.push(PermMeta { state, chain: k, step: s, links_next: true });
            x = next;
        }
        if let Some(last) = perms.last_mut() {
            if last.chain == k {
                last.links_next = false;
            }
        }
        assert_eq!(x, inst.pks[k], "claimed pk element must match recomputation");
    }
    perms
}

pub fn build_trace(perms: &[PermMeta]) -> RowMajorMatrix<Val> {
    let states: Vec<[u64; 25]> = perms.iter().map(|p| p.state).collect();
    let total = states.len();
    let keccak = generate_trace_rows::<Val>(states, 0);
    let rows = keccak.height();

    let mut values = Val::zero_vec(rows * NUM_COLS);
    let pad_inv_cl = (Val::ZERO - Val::from_u8(MAX_STEP as u8 - 1)).inverse();
    for r in 0..rows {
        let src = keccak.row_slice(r).expect("row in range");
        let row = &mut values[r * NUM_COLS..(r + 1) * NUM_COLS];
        row[..NUM_KECCAK_COLS].clone_from_slice(&src);
        let lc: &mut LinkCols<Val> = row[NUM_KECCAK_COLS..].borrow_mut();
        let perm = r / NUM_ROUNDS;
        if perm < total {
            let meta = &perms[perm];
            let step_f = Val::from_u8(meta.step as u8);
            lc.is_real = Val::ONE;
            lc.chain_step = step_f;
            lc.links_next = if meta.links_next { Val::ONE } else { Val::ZERO };
            lc.is_chain_last = if meta.step == MAX_STEP - 1 { Val::ONE } else { Val::ZERO };
            lc.inv_cl = if meta.step == MAX_STEP - 1 {
                Val::ZERO
            } else {
                (step_f - Val::from_u8(MAX_STEP as u8 - 1)).inverse()
            };
            lc.onehot[meta.chain] = Val::ONE;
        } else {
            lc.inv_cl = pad_inv_cl;
        }
    }
    RowMajorMatrix::new(values, NUM_COLS)
}

fn lane_limbs(bytes: &[u8]) -> [u16; 4] {
    let lane = u64::from_le_bytes(bytes.try_into().expect("8-byte lane"));
    core::array::from_fn(|j| ((lane >> (16 * j)) & 0xFFFF) as u16)
}

fn push16(pis: &mut Vec<Val>, bytes: &[u8; N]) {
    for half in 0..2 {
        for l in lane_limbs(&bytes[8 * half..8 * half + 8]) {
            pis.push(Val::from_u16(l));
        }
    }
}

/// Verifier-side public inputs (M2b layout). Returns None if a digit-15
/// chain's claimed pk does not equal its signature element (native check).
pub fn derive_pis(inst: &ChainInstance) -> Option<Vec<Val>> {
    for k in 0..WOTS_LEN {
        if inst.digits[k] as usize == MAX_STEP && inst.pks[k] != inst.sigs[k] {
            return None;
        }
    }
    let walk = derive_walk(&inst.digits);

    let mut pis = Vec::with_capacity(NUM_PUBLIC_VALUES);
    push16(&mut pis, &inst.pk_seed);

    let mut layer_tree = [0u8; N];
    layer_tree[..4].copy_from_slice(&inst.layer.to_be_bytes());
    layer_tree[8..].copy_from_slice(&inst.tree.to_be_bytes());
    push16(&mut pis, &layer_tree);

    let mut lane4 = [0u8; 8];
    lane4[4..].copy_from_slice(&inst.kp.to_be_bytes());
    let limbs = lane_limbs(&lane4);
    pis.push(Val::from_u16(limbs[2]));
    pis.push(Val::from_u16(limbs[3]));

    for d in inst.digits {
        pis.push(Val::from_u8(d));
    }
    for na in walk.next_active {
        pis.push(Val::from_u8(na as u8));
    }
    pis.push(Val::from_u8(walk.first_active as u8));

    for s in &inst.sigs {
        push16(&mut pis, s);
    }
    for p in &inst.pks {
        push16(&mut pis, p);
    }
    assert_eq!(pis.len(), NUM_PUBLIC_VALUES);
    Some(pis)
}
