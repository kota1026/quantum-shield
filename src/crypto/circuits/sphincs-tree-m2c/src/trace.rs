//! Trace and public-input construction for the M2c tree-pipeline AIR.
//!
//! `derive_public_inputs` is the verifier side: every table (structural rate
//! limbs, lane 6-9 masks/values, chain-direction flags, continuation-block
//! bits) is computed natively from public instance data. Running Merkle-node
//! values are never table-bound — their positions are excluded via the masks
//! and covered by the chain constraints instead.

use core::borrow::BorrowMut;

use p3_field::PrimeCharacteristicRing;
use p3_goldilocks::Goldilocks;
use p3_keccak_air::{generate_trace_rows, NUM_KECCAK_COLS, NUM_ROUNDS};
use p3_matrix::dense::RowMajorMatrix;
use p3_matrix::Matrix;

use crate::air::{
    tab_lane_limb, LinkCols, NUM_COLS, NUM_PUBLIC_VALUES, PI_BITS, PI_C67, PI_C89,
    PI_FORS_PK, PI_M67, PI_M89, PI_R67, PI_R89, PI_ROOT, PI_TAB, TAB_LIMBS,
};
use crate::sphincs::{
    climb_bit, shake_blocks, slot_adrs, Instance, Witness, CONT_SLOTS, FEED_SLOTS,
    FORS_A, N, NUM_SLOTS, RATE, RATE_LANES, SLOT_FORS_CLIMB0, SLOT_TK0, SLOT_TLEN0,
    SLOT_XMSS_CLIMB0, XMSS_H,
};

type Val = Goldilocks;

/// Build the combined trace: the keccak-air trace (padded to a power of two
/// with zero-state permutations) extended with the link columns.
pub fn build_trace(witness: &Witness) -> RowMajorMatrix<Val> {
    let keccak = generate_trace_rows::<Val>(witness.pre.clone(), 0);
    let rows = keccak.height();

    let mut values = Val::zero_vec(rows * NUM_COLS);
    for r in 0..rows {
        let src = keccak.row_slice(r).expect("row in range");
        let row = &mut values[r * NUM_COLS..(r + 1) * NUM_COLS];
        row[..NUM_KECCAK_COLS].clone_from_slice(&src);

        let lc: &mut LinkCols<Val> = row[NUM_KECCAK_COLS..].borrow_mut();
        let perm = r / NUM_ROUNDS;
        if perm < NUM_SLOTS {
            lc.slot[perm] = Val::ONE;
            // Output-bit decomposition, populated on the final-round row of
            // permutations that feed an XOR continuation.
            if r % NUM_ROUNDS == NUM_ROUNDS - 1 && FEED_SLOTS.contains(&perm) {
                let post = &witness.post[perm];
                for lane in 0..RATE_LANES {
                    for z in 0..64 {
                        if (post[lane] >> z) & 1 == 1 {
                            lc.obits[lane][z] = Val::ONE;
                        }
                    }
                }
            }
        }
    }

    RowMajorMatrix::new(values, NUM_COLS)
}

fn limb(block: &[u8; RATE], lane: usize, l: usize) -> u16 {
    u16::from_le_bytes([block[8 * lane + 2 * l], block[8 * lane + 2 * l + 1]])
}

/// The 8 limbs of the 16-byte pair starting at `base_lane` (6 or 8).
fn pair(block: &[u8; RATE], base_lane: usize) -> [u16; 8] {
    core::array::from_fn(|i| limb(block, base_lane + i / 4, i % 4))
}

fn limbs16(bytes: &[u8; N]) -> [u16; 8] {
    core::array::from_fn(|i| {
        u16::from_le_bytes([bytes[2 * i], bytes[2 * i + 1]])
    })
}

/// Derive the full public-input vector from public instance data plus the
/// claimed pipeline outputs (FORS pk and XMSS root).
pub fn derive_public_inputs(inst: &Instance, fors_pk: &[u8; N], root: &[u8; N]) -> Vec<Val> {
    let idx = inst.idx_global();

    let mut tab = [[0u16; TAB_LIMBS]; NUM_SLOTS];
    let mut m67 = [0u8; NUM_SLOTS];
    let mut m89 = [0u8; NUM_SLOTS];
    let mut r67 = [[0u16; 8]; NUM_SLOTS];
    let mut r89 = [[0u16; 8]; NUM_SLOTS];
    let mut c67 = [0u8; NUM_SLOTS];
    let mut c89 = [0u8; NUM_SLOTS];
    let mut bits = vec![[0u8; RATE_LANES * 64]; CONT_SLOTS.len()];

    let fill_tab = |tab: &mut [u16; TAB_LIMBS], block: &[u8; RATE]| {
        for i in 0..TAB_LIMBS {
            let (lane, l) = tab_lane_limb(i);
            tab[i] = limb(block, lane, l);
        }
    };
    let fill_bits = |bits: &mut [u8; RATE_LANES * 64], block: &[u8; RATE]| {
        for lane in 0..RATE_LANES {
            for z in 0..64 {
                bits[lane * 64 + z] = (block[8 * lane + z / 8] >> (z % 8)) & 1;
            }
        }
    };
    let cont_index = |slot: usize| CONT_SLOTS.iter().position(|&c| c == slot).unwrap();

    // FORS leaf: seed || ADRS || sk (all public).
    {
        let mut input = Vec::new();
        input.extend_from_slice(&inst.pk_seed);
        input.extend_from_slice(&slot_adrs(&inst.params, idx, 0));
        input.extend_from_slice(&inst.sk);
        let b = shake_blocks(&input)[0];
        fill_tab(&mut tab[0], &b);
        m67[0] = 1;
        r67[0] = pair(&b, 6);
        m89[0] = 1;
        r89[0] = pair(&b, 8);
    }

    // Climb slots (FORS 1..=12, XMSS 21..=29): the running node's pair is
    // chained (mask 0), the auth node's pair is public.
    let climb_slots = (SLOT_FORS_CLIMB0..SLOT_FORS_CLIMB0 + FORS_A)
        .chain(SLOT_XMSS_CLIMB0..SLOT_XMSS_CLIMB0 + XMSS_H);
    for slot in climb_slots {
        let auth = if slot < SLOT_TK0 {
            inst.fors_auth[slot - SLOT_FORS_CLIMB0]
        } else {
            inst.xmss_auth[slot - SLOT_XMSS_CLIMB0]
        };
        let bit = climb_bit(inst.i_leaf, inst.params.kp, slot).unwrap();
        let mut input = Vec::new();
        input.extend_from_slice(&inst.pk_seed);
        input.extend_from_slice(&slot_adrs(&inst.params, idx, slot));
        let zero = [0u8; N];
        let (left, right) = if bit == 0 { (zero, auth) } else { (auth, zero) };
        input.extend_from_slice(&left);
        input.extend_from_slice(&right);
        let b = shake_blocks(&input)[0];
        fill_tab(&mut tab[slot], &b);
        if bit == 0 {
            c67[slot] = 1;
            m89[slot] = 1;
            r89[slot] = pair(&b, 8);
        } else {
            c89[slot] = 1;
            m67[slot] = 1;
            r67[slot] = pair(&b, 6);
        }
    }

    // T_k: block 0 is fresh with root_0 chained into lanes 6-7; blocks 1-2
    // are XOR continuations bound through their public bits.
    {
        let blocks = shake_blocks(&inst.tk_stream_public());
        assert_eq!(blocks.len(), 3);
        fill_tab(&mut tab[SLOT_TK0], &blocks[0]);
        c67[SLOT_TK0] = 1;
        m89[SLOT_TK0] = 1;
        r89[SLOT_TK0] = pair(&blocks[0], 8);
        fill_bits(&mut bits[cont_index(SLOT_TK0 + 1)], &blocks[1]);
        fill_bits(&mut bits[cont_index(SLOT_TK0 + 2)], &blocks[2]);
    }

    // T_len: block 0 fresh and fully public; blocks 1-4 XOR continuations.
    {
        let blocks = shake_blocks(&inst.tlen_stream());
        assert_eq!(blocks.len(), 5);
        fill_tab(&mut tab[SLOT_TLEN0], &blocks[0]);
        m67[SLOT_TLEN0] = 1;
        r67[SLOT_TLEN0] = pair(&blocks[0], 6);
        m89[SLOT_TLEN0] = 1;
        r89[SLOT_TLEN0] = pair(&blocks[0], 8);
        for k in 1..5 {
            fill_bits(&mut bits[cont_index(SLOT_TLEN0 + k)], &blocks[k]);
        }
    }

    // Pack in PI_* order.
    let mut pis = Vec::with_capacity(NUM_PUBLIC_VALUES);
    assert_eq!(pis.len(), PI_TAB);
    for p in 0..NUM_SLOTS {
        for i in 0..TAB_LIMBS {
            pis.push(Val::from_u16(tab[p][i]));
        }
    }
    assert_eq!(pis.len(), PI_M67);
    for p in 0..NUM_SLOTS {
        pis.push(Val::from_u8(m67[p]));
    }
    assert_eq!(pis.len(), PI_M89);
    for p in 0..NUM_SLOTS {
        pis.push(Val::from_u8(m89[p]));
    }
    assert_eq!(pis.len(), PI_R67);
    for p in 0..NUM_SLOTS {
        for i in 0..8 {
            pis.push(Val::from_u16(r67[p][i]));
        }
    }
    assert_eq!(pis.len(), PI_R89);
    for p in 0..NUM_SLOTS {
        for i in 0..8 {
            pis.push(Val::from_u16(r89[p][i]));
        }
    }
    assert_eq!(pis.len(), PI_C67);
    for p in 0..NUM_SLOTS {
        pis.push(Val::from_u8(c67[p]));
    }
    assert_eq!(pis.len(), PI_C89);
    for p in 0..NUM_SLOTS {
        pis.push(Val::from_u8(c89[p]));
    }
    assert_eq!(pis.len(), PI_BITS);
    for b in &bits {
        for &v in b.iter() {
            pis.push(Val::from_u8(v));
        }
    }
    assert_eq!(pis.len(), PI_FORS_PK);
    for l in limbs16(fors_pk) {
        pis.push(Val::from_u16(l));
    }
    assert_eq!(pis.len(), PI_ROOT);
    for l in limbs16(root) {
        pis.push(Val::from_u16(l));
    }
    assert_eq!(pis.len(), NUM_PUBLIC_VALUES);
    pis
}
