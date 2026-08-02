//! M2c tree-pipeline AIR: keccak-air plus multi-block absorption (XOR link)
//! and Merkle auth-path constraints.
//!
//! The trace is the p3-keccak-air trace horizontally extended with a 30-wide
//! one-hot *slot* selector (the pipeline position of each permutation) and
//! 1,088 *output bit* columns (the bit decomposition of the rate part of a
//! permutation's output, populated on permutations that feed an XOR link).
//!
//! The pipeline shape is fixed (FORS leaf, 12 FORS climbs, 3 T_k blocks,
//! 5 T_len blocks, 9 XMSS climbs), so the slot walk is a plain +1 shift,
//! and all per-slot structure is bound through public tables:
//!
//!   1. fresh permutations (new sponge): the structural rate limbs (lanes
//!      0-5 = PK.seed || ADRS, lanes 10-16 = trailing data/padding) equal
//!      the public rate table for that slot, and the capacity is zero;
//!   2. lanes 6-7 / 8-9 (the two 16-byte "value" positions) are either
//!      bound to a public value (mask/rate pairs — auth-path nodes, sk,
//!      pk elements, sibling roots) or chained from the previous
//!      permutation's first 16 output bytes (c67/c89 flags — the running
//!      Merkle node, in the position selected by the public direction bit;
//!      also the FORS root entering T_k and the T_len leaf entering the
//!      XMSS climb, giving in-trace glue between adjacent stages);
//!   3. XOR-continuation permutations (T_k blocks 1-2, T_len blocks 1-4):
//!      the capacity is carried verbatim from the previous output, and each
//!      rate limb equals the previous output XOR the public block —
//!      expressed over the output-bit columns, whose decomposition is
//!      itself constrained on the feeding permutation. XOR with a *public*
//!      bit b is linear in the output bit o (o + b - 2bo), which keeps the
//!      whole constraint set within keccak-air's degree-3 budget;
//!   4. the T_k output (FORS pk = the message the layer-0 WOTS+ signs) and
//!      the XMSS climb output (the tree root) are bound to public values.
//!
//! Everything the verifier needs (rate tables, masks, direction flags,
//! block bits) is derived natively from public instance data — the
//! "public glue" principle established in M2b (§9.3).

use core::borrow::{Borrow, BorrowMut};
use core::mem::size_of;

use p3_air::{Air, AirBuilder, AirBuilderWithPublicValues, BaseAir};
use p3_field::PrimeCharacteristicRing;
use p3_keccak_air::{KeccakAir, KeccakCols, NUM_KECCAK_COLS, NUM_ROUNDS};
use p3_matrix::Matrix;
use p3_uni_stark::SubAirBuilder;

use crate::sphincs::{is_cont, CONT_SLOTS, FEED_SLOTS, NUM_SLOTS, RATE_LANES};

/// Link columns appended after the keccak-air columns. All are constant
/// across the 24 rows of a permutation (enforced by transition constraints;
/// obits are only read on final-round rows, where their binding holds).
#[repr(C)]
pub struct LinkCols<T> {
    /// One-hot pipeline-slot selector. All zero on padding rows.
    pub slot: [T; NUM_SLOTS],
    /// Bit decomposition of the rate part of this permutation's output,
    /// meaningful (and constrained) only on permutations in FEED_SLOTS.
    pub obits: [[T; 64]; RATE_LANES],
}

pub const NUM_LINK_COLS: usize = size_of::<LinkCols<u8>>();
pub const NUM_COLS: usize = NUM_KECCAK_COLS + NUM_LINK_COLS;

impl<T> Borrow<LinkCols<T>> for [T] {
    fn borrow(&self) -> &LinkCols<T> {
        debug_assert_eq!(self.len(), NUM_LINK_COLS);
        let (prefix, shorts, suffix) = unsafe { self.align_to::<LinkCols<T>>() };
        debug_assert!(prefix.is_empty(), "Alignment should match");
        debug_assert!(suffix.is_empty(), "Alignment should match");
        debug_assert_eq!(shorts.len(), 1);
        &shorts[0]
    }
}

impl<T> BorrowMut<LinkCols<T>> for [T] {
    fn borrow_mut(&mut self) -> &mut LinkCols<T> {
        debug_assert_eq!(self.len(), NUM_LINK_COLS);
        let (prefix, shorts, suffix) = unsafe { self.align_to_mut::<LinkCols<T>>() };
        debug_assert!(prefix.is_empty(), "Alignment should match");
        debug_assert!(suffix.is_empty(), "Alignment should match");
        debug_assert_eq!(shorts.len(), 1);
        &mut shorts[0]
    }
}

// ---- Public input layout ----

/// Number of structural rate limbs per slot: lanes 0-5 (24 limbs) and lanes
/// 10-16 (28 limbs). Lanes 6-9 are handled by the mask/rate pairs below.
pub const TAB_LIMBS: usize = 52;

/// Structural rate table, TAB_LIMBS per slot (fresh slots only; zero and
/// unused on continuation slots).
pub const PI_TAB: usize = 0;
/// Per-slot flags: lanes 6-7 (8-9) bound to the public rate values below.
pub const PI_M67: usize = PI_TAB + NUM_SLOTS * TAB_LIMBS;
pub const PI_M89: usize = PI_M67 + NUM_SLOTS;
/// Public rate values for lanes 6-7 (8-9), 8 limbs per slot.
pub const PI_R67: usize = PI_M89 + NUM_SLOTS;
pub const PI_R89: usize = PI_R67 + NUM_SLOTS * 8;
/// Per-slot flags: lanes 6-7 (8-9) chained from the previous output.
pub const PI_C67: usize = PI_R89 + NUM_SLOTS * 8;
pub const PI_C89: usize = PI_C67 + NUM_SLOTS;
/// Rate-block bits for the 6 continuation slots, 1088 each (bit z of lane l
/// at offset l*64 + z).
pub const PI_BITS: usize = PI_C89 + NUM_SLOTS;
/// T_k output binding (FORS pk), 8 limbs.
pub const PI_FORS_PK: usize = PI_BITS + CONT_SLOTS.len() * RATE_LANES * 64;
/// XMSS climb output binding (tree root), 8 limbs.
pub const PI_ROOT: usize = PI_FORS_PK + 8;
pub const NUM_PUBLIC_VALUES: usize = PI_ROOT + 8;

/// The structural limb index (0..TAB_LIMBS) -> (lane, limb) map.
pub fn tab_lane_limb(i: usize) -> (usize, usize) {
    if i < 24 {
        (i / 4, i % 4)
    } else {
        (10 + (i - 24) / 4, (i - 24) % 4)
    }
}

pub struct SphincsTreeAir;

impl<F> BaseAir<F> for SphincsTreeAir {
    fn width(&self) -> usize {
        NUM_COLS
    }
}

impl<AB: AirBuilderWithPublicValues> Air<AB> for SphincsTreeAir {
    fn eval(&self, builder: &mut AB) {
        // Full Keccak-f[1600] round constraints on the leading keccak columns.
        {
            let mut sub =
                SubAirBuilder::<AB, KeccakAir, AB::F>::new(builder, 0..NUM_KECCAK_COLS);
            KeccakAir {}.eval(&mut sub);
        }

        let pis: Vec<AB::Expr> = builder
            .public_values()
            .iter()
            .map(|&p| p.into())
            .collect();
        assert_eq!(pis.len(), NUM_PUBLIC_VALUES);

        let main = builder.main();
        let local_row = main.row_slice(0).expect("the matrix is empty?");
        let next_row = main.row_slice(1).expect("the matrix only has 1 row?");
        let local_slice: &[AB::Var] = &local_row;
        let next_slice: &[AB::Var] = &next_row;
        let kc: &KeccakCols<AB::Var> = local_slice[..NUM_KECCAK_COLS].borrow();
        let lc: &LinkCols<AB::Var> = local_slice[NUM_KECCAK_COLS..].borrow();
        let lc_next: &LinkCols<AB::Var> = next_slice[NUM_KECCAK_COLS..].borrow();
        let kc_next: &KeccakCols<AB::Var> = next_slice[..NUM_KECCAK_COLS].borrow();

        let one = AB::Expr::ONE;
        let s0 = kc.step_flags[0].clone();
        let sf = kc.step_flags[NUM_ROUNDS - 1].clone();

        let pre = |lane: usize, limb: usize| kc.preimage[lane / 5][lane % 5][limb].clone();
        let pre_next = |lane: usize, limb: usize| kc_next.preimage[lane / 5][lane % 5][limb].clone();
        let out = |lane: usize, limb: usize| kc.a_prime_prime_prime(lane / 5, lane % 5, limb);

        // Per-slot selected public value (degree 1: publics are scalars).
        let sel = |slots: &[AB::Var; NUM_SLOTS], base: usize, stride: usize, off: usize| {
            (0..NUM_SLOTS).fold(AB::Expr::ZERO, |acc, p| {
                acc + slots[p].clone() * pis[base + stride * p + off].clone()
            })
        };

        // -- 1. Slot selector well-formedness (row-local) --------------------
        let sum_slot = lc
            .slot
            .iter()
            .fold(AB::Expr::ZERO, |acc, v| acc + v.clone());
        for p in 0..NUM_SLOTS {
            builder.assert_bool(lc.slot[p].clone());
        }
        builder.assert_bool(sum_slot.clone());
        // Output bits are boolean everywhere.
        for l in 0..RATE_LANES {
            for z in 0..64 {
                builder.assert_bool(lc.obits[l][z].clone());
            }
        }

        // Baked structural slot classes (degree-1 selectors).
        let fresh_l = (0..NUM_SLOTS)
            .filter(|p| !is_cont(*p))
            .fold(AB::Expr::ZERO, |acc, p| acc + lc.slot[p].clone());
        let cont_n = CONT_SLOTS
            .iter()
            .fold(AB::Expr::ZERO, |acc, &p| acc + lc_next.slot[p].clone());
        let feed_l = FEED_SLOTS
            .iter()
            .fold(AB::Expr::ZERO, |acc, &p| acc + lc.slot[p].clone());

        // -- 2. Fresh absorption: structural table + zero capacity -----------
        let g_fresh = s0.clone() * fresh_l.clone();
        for i in 0..TAB_LIMBS {
            let (lane, limb) = tab_lane_limb(i);
            let tab = sel(&lc.slot, PI_TAB, TAB_LIMBS, i);
            builder.assert_zero(g_fresh.clone() * (pre(lane, limb) - tab));
        }
        for lane in RATE_LANES..25 {
            for limb in 0..4 {
                builder.assert_zero(g_fresh.clone() * pre(lane, limb));
            }
        }
        // Lanes 6-7 / 8-9 public-value binding (mask/rate pairs).
        let m67 = sel(&lc.slot, PI_M67, 1, 0);
        let m89 = sel(&lc.slot, PI_M89, 1, 0);
        for l in 0..2 {
            for j in 0..4 {
                let r67 = sel(&lc.slot, PI_R67, 8, 4 * l + j);
                builder.assert_zero(s0.clone() * m67.clone() * (pre(6 + l, j) - r67));
                let r89 = sel(&lc.slot, PI_R89, 8, 4 * l + j);
                builder.assert_zero(s0.clone() * m89.clone() * (pre(8 + l, j) - r89));
            }
        }

        // -- 3. Output-bit decomposition on feeding permutations -------------
        let g_feed = sf.clone() * feed_l.clone();
        for lane in 0..RATE_LANES {
            for limb in 0..4 {
                let bits = (0..16).fold(AB::Expr::ZERO, |acc, z| {
                    acc + lc.obits[lane][16 * limb + z].clone()
                        * AB::Expr::from_u32(1 << z)
                });
                builder.assert_zero(g_feed.clone() * (bits - out(lane, limb)));
            }
        }

        // -- 4. Output bindings (T_k -> FORS pk, XMSS climb -> root) ---------
        for l in 0..2 {
            for j in 0..4 {
                builder.assert_zero(
                    sf.clone()
                        * lc.slot[15].clone()
                        * (out(l, j) - pis[PI_FORS_PK + 4 * l + j].clone()),
                );
                builder.assert_zero(
                    sf.clone()
                        * lc.slot[NUM_SLOTS - 1].clone()
                        * (out(l, j) - pis[PI_ROOT + 4 * l + j].clone()),
                );
            }
        }

        // -- 5. Boundary rows -------------------------------------------------
        builder.when_first_row().assert_one(lc.slot[0].clone());
        builder.when_last_row().assert_zero(sum_slot.clone());

        // -- 6. Transition constraints ---------------------------------------
        let not_sf = one.clone() - sf.clone();
        {
            let mut t = builder.when_transition();

            // Slot selector constant within a permutation's 24 rows.
            for p in 0..NUM_SLOTS {
                t.assert_zero(not_sf.clone() * (lc_next.slot[p].clone() - lc.slot[p].clone()));
            }
            // The walk: +1 shift at permutation boundaries; nothing re-enters
            // slot 0, so after slot 29 the selector is all-zero (padding) and
            // stays so.
            for p in 0..NUM_SLOTS - 1 {
                t.assert_zero(sf.clone() * (lc_next.slot[p + 1].clone() - lc.slot[p].clone()));
            }
            t.assert_zero(sf.clone() * lc_next.slot[0].clone());

            // Chained 16-byte values: previous output lanes 0-1 land in the
            // next permutation's lanes 6-7 or 8-9, as the public c67/c89
            // flags dictate (Merkle node direction, root_0 -> T_k,
            // T_len leaf -> XMSS climb).
            let c67_n = sel(&lc_next.slot, PI_C67, 1, 0);
            let c89_n = sel(&lc_next.slot, PI_C89, 1, 0);
            for l in 0..2 {
                for j in 0..4 {
                    t.assert_zero(
                        sf.clone() * c67_n.clone() * (pre_next(6 + l, j) - out(l, j)),
                    );
                    t.assert_zero(
                        sf.clone() * c89_n.clone() * (pre_next(8 + l, j) - out(l, j)),
                    );
                }
            }

            // XOR continuation: capacity carried verbatim...
            for lane in RATE_LANES..25 {
                for limb in 0..4 {
                    t.assert_zero(
                        sf.clone() * cont_n.clone() * (pre_next(lane, limb) - out(lane, limb)),
                    );
                }
            }
            // ...and each rate limb equals previous-output XOR public block,
            // per continuation slot (so the block bits are plain scalars and
            // the XOR stays linear in the committed output bits).
            for (ci, &c) in CONT_SLOTS.iter().enumerate() {
                let g = sf.clone() * lc_next.slot[c].clone();
                for lane in 0..RATE_LANES {
                    for limb in 0..4 {
                        let x = (0..16).fold(AB::Expr::ZERO, |acc, z| {
                            let o = lc.obits[lane][16 * limb + z].clone();
                            let b = pis
                                [PI_BITS + ci * RATE_LANES * 64 + lane * 64 + 16 * limb + z]
                                .clone();
                            let xor = o.clone() + b.clone()
                                - AB::Expr::from_u8(2) * b * o;
                            acc + xor * AB::Expr::from_u32(1 << z)
                        });
                        t.assert_zero(g.clone() * (pre_next(lane, limb) - x));
                    }
                }
            }
        }
    }
}
