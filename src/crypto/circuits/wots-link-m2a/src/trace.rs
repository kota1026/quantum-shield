//! Trace and public-input construction for the M2a linking AIR.

use core::borrow::BorrowMut;

use p3_field::{Field, PrimeCharacteristicRing};
use p3_goldilocks::Goldilocks;
use p3_keccak_air::{generate_trace_rows, NUM_KECCAK_COLS, NUM_ROUNDS};
use p3_matrix::dense::RowMajorMatrix;
use p3_matrix::Matrix;

use crate::air::{LinkCols, NUM_COLS, NUM_PUBLIC_VALUES};
use crate::wots::{AdrsParams, Witness, CHAIN_STEPS, N, TOTAL_PERMS, WOTS_LEN};

type Val = Goldilocks;

/// Build the combined trace: the keccak-air trace (padded to a power of two
/// with zero-state permutations) extended with the link columns.
pub fn build_trace(witness: &Witness) -> RowMajorMatrix<Val> {
    assert_eq!(witness.states.len(), TOTAL_PERMS);
    let keccak = generate_trace_rows::<Val>(witness.states.clone(), 0);
    let rows = keccak.height();

    let mut values = Val::zero_vec(rows * NUM_COLS);
    // Padding rows have chain_step = 0, which the inverse-witness constraints
    // classify as chain-first and not chain-last; inv_cl must then invert -14.
    let pad_inv_cl = (Val::ZERO - Val::from_u8(CHAIN_STEPS as u8 - 1)).inverse();

    for r in 0..rows {
        let src = keccak.row_slice(r).expect("row in range");
        let row = &mut values[r * NUM_COLS..(r + 1) * NUM_COLS];
        row[..NUM_KECCAK_COLS].clone_from_slice(&src);

        let lc: &mut LinkCols<Val> = row[NUM_KECCAK_COLS..].borrow_mut();
        let perm = r / NUM_ROUNDS;
        if perm < TOTAL_PERMS {
            let chain = perm / CHAIN_STEPS;
            let step = perm % CHAIN_STEPS;
            let step_f = Val::from_u8(step as u8);
            lc.is_real = Val::ONE;
            lc.chain_step = step_f;
            lc.links_next = if step < CHAIN_STEPS - 1 { Val::ONE } else { Val::ZERO };
            lc.is_chain_first = if step == 0 { Val::ONE } else { Val::ZERO };
            lc.inv_cf = if step == 0 { Val::ZERO } else { step_f.inverse() };
            lc.is_chain_last = if step == CHAIN_STEPS - 1 { Val::ONE } else { Val::ZERO };
            lc.inv_cl = if step == CHAIN_STEPS - 1 {
                Val::ZERO
            } else {
                (step_f - Val::from_u8(CHAIN_STEPS as u8 - 1)).inverse()
            };
            lc.onehot[chain] = Val::ONE;
        } else {
            lc.is_chain_first = Val::ONE;
            lc.inv_cl = pad_inv_cl;
        }
    }

    RowMajorMatrix::new(values, NUM_COLS)
}

/// 16-bit little-endian limbs of one 8-byte input lane.
fn lane_limbs(bytes: &[u8]) -> [u16; 4] {
    let lane = u64::from_le_bytes(bytes.try_into().expect("8-byte lane"));
    core::array::from_fn(|j| ((lane >> (16 * j)) & 0xFFFF) as u16)
}

fn push16(pis: &mut Vec<Val>, bytes: &[u8; 16]) {
    for half in 0..2 {
        for limb in lane_limbs(&bytes[8 * half..8 * half + 8]) {
            pis.push(Val::from_u16(limb));
        }
    }
}

/// Public inputs: PK.seed, ADRS constants (layer/tree/keypair) and the 35
/// per-chain start and end values, all as 16-bit lane limbs matching the
/// layout constants in `air.rs`.
pub fn public_inputs(
    pk_seed: &[u8; N],
    params: &AdrsParams,
    starts: &[[u8; N]],
    ends: &[[u8; N]],
) -> Vec<Val> {
    assert_eq!(starts.len(), WOTS_LEN);
    assert_eq!(ends.len(), WOTS_LEN);
    let mut pis = Vec::with_capacity(NUM_PUBLIC_VALUES);

    push16(&mut pis, pk_seed);

    let mut layer_tree = [0u8; 16];
    layer_tree[..4].copy_from_slice(&params.layer.to_be_bytes());
    layer_tree[4..].copy_from_slice(&params.tree);
    push16(&mut pis, &layer_tree);

    // Input lane 4 is type(4B) || keypair(4B); only limbs 2-3 (keypair) are
    // public — the type limbs are constrained to zero directly.
    let mut lane4 = [0u8; 8];
    lane4[4..].copy_from_slice(&params.keypair.to_be_bytes());
    let limbs = lane_limbs(&lane4);
    pis.push(Val::from_u16(limbs[2]));
    pis.push(Val::from_u16(limbs[3]));

    for s in starts {
        push16(&mut pis, s);
    }
    for e in ends {
        push16(&mut pis, e);
    }

    assert_eq!(pis.len(), NUM_PUBLIC_VALUES);
    pis
}
