//! Trace and public-input construction for the M2b signature-verification
//! AIR, including the verifier-side native checks.

use core::borrow::BorrowMut;

use p3_field::{Field, PrimeCharacteristicRing};
use p3_goldilocks::Goldilocks;
use p3_keccak_air::{generate_trace_rows, NUM_KECCAK_COLS, NUM_ROUNDS};
use p3_matrix::dense::RowMajorMatrix;
use p3_matrix::Matrix;

use crate::air::{LinkCols, NUM_COLS, NUM_PUBLIC_VALUES};
use crate::wots::{derive_walk, wots_digits, AdrsParams, Witness, MAX_STEP, N, WOTS_LEN};

type Val = Goldilocks;

/// Build the combined trace: the keccak-air trace (padded to a power of two
/// with zero-state permutations) extended with the link columns.
pub fn build_trace(witness: &Witness) -> RowMajorMatrix<Val> {
    let states: Vec<[u64; 25]> = witness.perms.iter().map(|p| p.state).collect();
    let total_perms = states.len();
    let keccak = generate_trace_rows::<Val>(states, 0);
    let rows = keccak.height();

    let mut values = Val::zero_vec(rows * NUM_COLS);
    // Padding rows have chain_step = 0, so inv_cl must invert -14.
    let pad_inv_cl = (Val::ZERO - Val::from_u8(MAX_STEP as u8 - 1)).inverse();

    for r in 0..rows {
        let src = keccak.row_slice(r).expect("row in range");
        let row = &mut values[r * NUM_COLS..(r + 1) * NUM_COLS];
        row[..NUM_KECCAK_COLS].clone_from_slice(&src);

        let lc: &mut LinkCols<Val> = row[NUM_KECCAK_COLS..].borrow_mut();
        let perm = r / NUM_ROUNDS;
        if perm < total_perms {
            let meta = &witness.perms[perm];
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

/// Derive the full public-input vector the way the *verifier* does: digits
/// and the active-chain walk are recomputed from the message, never taken
/// from the prover, and chains with digit = w-1 are checked natively
/// (pk element must equal the signature element — no permutation exists in
/// the trace to constrain them). Returns None if a native check fails.
pub fn derive_public_inputs(
    pk_seed: &[u8; N],
    params: &AdrsParams,
    md: &[u8; N],
    sigs: &[[u8; N]],
    pks: &[[u8; N]],
) -> Option<Vec<Val>> {
    assert_eq!(sigs.len(), WOTS_LEN);
    assert_eq!(pks.len(), WOTS_LEN);
    let digits = wots_digits(md);
    for k in 0..WOTS_LEN {
        if digits[k] as usize == MAX_STEP && pks[k] != sigs[k] {
            return None;
        }
    }
    let walk = derive_walk(&digits);

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

    for d in digits {
        pis.push(Val::from_u8(d));
    }
    for na in walk.next_active {
        pis.push(Val::from_u8(na as u8));
    }
    pis.push(Val::from_u8(walk.first_active as u8));

    for s in sigs {
        push16(&mut pis, s);
    }
    for p in pks {
        push16(&mut pis, p);
    }

    assert_eq!(pis.len(), NUM_PUBLIC_VALUES);
    Some(pis)
}
