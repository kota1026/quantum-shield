//! M2a linking AIR: keccak-air plus chain-structure constraints.
//!
//! The trace is the p3-keccak-air trace (one Keccak-f[1600] permutation per
//! 24 rows) horizontally extended with `LinkCols`. keccak-air proves each
//! permutation is a correct Keccak-f; the link columns and the constraints in
//! this module additionally force, for a full 35-chain WOTS+ unit
//! (SPHINCS+-SHAKE-128s, w=16):
//!
//!   1. every permutation input is a well-formed single-block SHAKE256
//!      absorption of F(PK.seed, ADRS, M) — pad10*1 bytes and zero capacity,
//!   2. the ADRS has the FIPS 205 WOTS_HASH layout: public layer/tree/keypair,
//!      type = 0, chain address = the chain the permutation belongs to, hash
//!      address = the step within the chain,
//!   3. consecutive permutations of a chain are linked: the first 16 output
//!      bytes of step s are the message input M of step s+1,
//!   4. each chain's first M equals the public per-chain start value and each
//!      chain's final output equals the public per-chain end value,
//!   5. the trace contains exactly the 35 chains of 15 steps, in order —
//!      the one-hot chain selector must walk 0..35 and padding cannot begin
//!      before chain 34 completes (see the one-hot shift constraints).
//!
//! All constraints have degree <= 3, the same budget keccak-air itself uses,
//! so the quotient degree (and prover cost profile) is unchanged.

use core::borrow::{Borrow, BorrowMut};
use core::mem::size_of;

use p3_air::{Air, AirBuilder, AirBuilderWithPublicValues, BaseAir};
use p3_field::PrimeCharacteristicRing;
use p3_keccak_air::{KeccakAir, KeccakCols, NUM_KECCAK_COLS, NUM_ROUNDS};
use p3_matrix::Matrix;
use p3_uni_stark::SubAirBuilder;

use crate::wots::{CHAIN_STEPS, WOTS_LEN};

/// Link columns appended after the keccak-air columns. All are constant across
/// the 24 rows of a permutation (enforced by transition constraints).
#[repr(C)]
pub struct LinkCols<T> {
    /// 1 on the 525 witness permutations, 0 on power-of-two padding.
    pub is_real: T,
    /// Step within the current WOTS+ chain: 0..=14. 0 on padding.
    pub chain_step: T,
    /// 1 iff the next permutation continues this chain (real, step < 14).
    pub links_next: T,
    /// 1 iff chain_step == 0 (forced both ways via `inv_cf`).
    pub is_chain_first: T,
    /// Inverse witness: chain_step * inv_cf = 1 - is_chain_first.
    pub inv_cf: T,
    /// 1 iff chain_step == 14 (forced both ways via `inv_cl`).
    pub is_chain_last: T,
    /// Inverse witness: (chain_step - 14) * inv_cl = 1 - is_chain_last.
    pub inv_cl: T,
    /// One-hot selector of the chain this permutation belongs to. All zero on
    /// padding; exactly one on real rows.
    pub onehot: [T; WOTS_LEN],
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

// ---- Public input layout (all values are 16-bit lane limbs) ----

/// PK.seed, input lanes 0-1 (16 bytes = 8 limbs).
pub const PI_PK_SEED: usize = 0;
/// ADRS layer (4B) || tree (12B), input lanes 2-3 (8 limbs).
pub const PI_LAYER_TREE: usize = 8;
/// ADRS keypair address, high half of input lane 4 (2 limbs).
pub const PI_KEYPAIR: usize = 16;
/// 35 per-chain start values (M of step 0), 8 limbs each.
pub const PI_STARTS: usize = 18;
/// 35 per-chain end values (F output of step 14), 8 limbs each.
pub const PI_ENDS: usize = PI_STARTS + 8 * WOTS_LEN;
pub const NUM_PUBLIC_VALUES: usize = PI_ENDS + 8 * WOTS_LEN;

pub struct WotsLinkAir;

impl<F> BaseAir<F> for WotsLinkAir {
    fn width(&self) -> usize {
        NUM_COLS
    }
}

impl<AB: AirBuilderWithPublicValues> Air<AB> for WotsLinkAir {
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
        let kc_next: &KeccakCols<AB::Var> = next_slice[..NUM_KECCAK_COLS].borrow();
        let lc_next: &LinkCols<AB::Var> = next_slice[NUM_KECCAK_COLS..].borrow();

        let one = AB::Expr::ONE;
        let c256 = AB::Expr::from_u16(256);
        // Round selectors from keccak-air: first / last row of a permutation.
        let s0 = kc.step_flags[0].clone();
        let sf = kc.step_flags[NUM_ROUNDS - 1].clone();

        // preimage limb of input lane `lane` (lane i = state[y=i/5][x=i%5]).
        let pre = |lane: usize, limb: usize| kc.preimage[lane / 5][lane % 5][limb].clone();
        let pre_next = |lane: usize, limb: usize| kc_next.preimage[lane / 5][lane % 5][limb].clone();
        // F output limb: first 16 squeezed bytes = output lanes 0 (y=0,x=0) and 1 (y=0,x=1).
        let out = |lane: usize, limb: usize| kc.a_prime_prime_prime(0, lane, limb);

        // -- 1. Booleans and flag/counter couplings (row-local) --------------
        builder.assert_bool(lc.is_real.clone());
        builder.assert_bool(lc.links_next.clone());
        builder.assert_bool(lc.is_chain_first.clone());
        builder.assert_bool(lc.is_chain_last.clone());
        for k in 0..WOTS_LEN {
            builder.assert_bool(lc.onehot[k].clone());
        }

        // Real rows carry exactly one hot chain selector; padding carries none
        // and a zero step counter.
        let sum_onehot = lc
            .onehot
            .iter()
            .fold(AB::Expr::ZERO, |acc, v| acc + v.clone());
        builder.assert_zero(lc.is_real.clone() * (sum_onehot - one.clone()));
        for k in 0..WOTS_LEN {
            builder.assert_zero((one.clone() - lc.is_real.clone()) * lc.onehot[k].clone());
        }
        builder.assert_zero((one.clone() - lc.is_real.clone()) * lc.chain_step.clone());

        // is_chain_first <=> chain_step == 0 (inverse-witness trick).
        builder.assert_zero(lc.is_chain_first.clone() * lc.chain_step.clone());
        builder.assert_zero(
            lc.chain_step.clone() * lc.inv_cf.clone()
                - (one.clone() - lc.is_chain_first.clone()),
        );
        // is_chain_last <=> chain_step == 14.
        let step_m14 = lc.chain_step.clone() - AB::Expr::from_u8(CHAIN_STEPS as u8 - 1);
        builder.assert_zero(lc.is_chain_last.clone() * step_m14.clone());
        builder
            .assert_zero(step_m14 * lc.inv_cl.clone() - (one.clone() - lc.is_chain_last.clone()));

        // links_next = is_real AND NOT is_chain_last (forced both ways).
        builder.assert_zero((one.clone() - lc.is_real.clone()) * lc.links_next.clone());
        builder.assert_zero(
            lc.is_real.clone() * lc.is_chain_last.clone() * lc.links_next.clone(),
        );
        builder.assert_zero(
            lc.is_real.clone()
                * (one.clone() - lc.is_chain_last.clone())
                * (one.clone() - lc.links_next.clone()),
        );

        // -- 2. SHAKE256 absorption structure and FIPS 205 ADRS layout -------
        // Gated on the first round row of every real permutation. The gate has
        // degree 2 and every gated difference is linear, so degree <= 3.
        let g = s0.clone() * lc.is_real.clone();

        // Lanes 0-1: PK.seed (public).
        for l in 0..2 {
            for j in 0..4 {
                builder.assert_zero(
                    g.clone() * (pre(l, j) - pis[PI_PK_SEED + 4 * l + j].clone()),
                );
            }
        }
        // Lanes 2-3: ADRS layer || tree (public).
        for l in 2..4 {
            for j in 0..4 {
                builder.assert_zero(
                    g.clone() * (pre(l, j) - pis[PI_LAYER_TREE + 4 * (l - 2) + j].clone()),
                );
            }
        }
        // Lane 4: ADRS type (bytes 0-3) must be WOTS_HASH = 0; keypair address
        // (bytes 4-7) is public.
        builder.assert_zero(g.clone() * pre(4, 0));
        builder.assert_zero(g.clone() * pre(4, 1));
        builder.assert_zero(g.clone() * (pre(4, 2) - pis[PI_KEYPAIR].clone()));
        builder.assert_zero(g.clone() * (pre(4, 3) - pis[PI_KEYPAIR + 1].clone()));
        // Lane 5: chain address (BE u32, bytes 0-3) = one-hot chain index and
        // hash address (BE u32, bytes 4-7) = chain_step. Both are < 256 so the
        // three high BE bytes are zero: limbs 0 and 2 vanish, limbs 1 and 3
        // carry the LSB in their high byte (value * 256).
        let chain_idx = (0..WOTS_LEN).fold(AB::Expr::ZERO, |acc, k| {
            acc + lc.onehot[k].clone() * AB::Expr::from_u8(k as u8)
        });
        builder.assert_zero(g.clone() * pre(5, 0));
        builder.assert_zero(g.clone() * (pre(5, 1) - c256.clone() * chain_idx));
        builder.assert_zero(g.clone() * pre(5, 2));
        builder.assert_zero(g.clone() * (pre(5, 3) - c256 * lc.chain_step.clone()));
        // Lanes 6-7 are the message M — constrained by 3. and 4. below.
        // Lane 8: SHAKE256 pad10*1 begins right after the 64-byte input: 0x1F.
        builder.assert_zero(g.clone() * (pre(8, 0) - AB::Expr::from_u8(0x1F)));
        for j in 1..4 {
            builder.assert_zero(g.clone() * pre(8, j));
        }
        // Lanes 9-15: zero up to the final rate byte.
        for l in 9..16 {
            for j in 0..4 {
                builder.assert_zero(g.clone() * pre(l, j));
            }
        }
        // Lane 16: final rate byte (135) carries the 0x80 pad bit -> limb 3.
        for j in 0..3 {
            builder.assert_zero(g.clone() * pre(16, j));
        }
        builder.assert_zero(g.clone() * (pre(16, 3) - AB::Expr::from_u16(0x8000)));
        // Lanes 17-24: capacity must be zero for a fresh sponge.
        for l in 17..25 {
            for j in 0..4 {
                builder.assert_zero(g.clone() * pre(l, j));
            }
        }

        // -- 3. Chain start binding ------------------------------------------
        // On the first permutation of each chain, M equals the public start
        // value selected by the one-hot. (On padding rows is_chain_first is 1
        // but preimage and one-hot are all zero, so the constraint holds.)
        let g_start = s0 * lc.is_chain_first.clone();
        for l in 0..2 {
            for j in 0..4 {
                let sel = (0..WOTS_LEN).fold(AB::Expr::ZERO, |acc, k| {
                    acc + lc.onehot[k].clone() * pis[PI_STARTS + 8 * k + 4 * l + j].clone()
                });
                builder.assert_zero(g_start.clone() * (pre(6 + l, j) - sel));
            }
        }

        // -- 4. Chain end binding --------------------------------------------
        // is_real - links_next is 1 exactly on the last permutation of a chain
        // (and 0 on padding), so this binds each chain's final F output to the
        // public end value.
        let g_end = sf.clone() * (lc.is_real.clone() - lc.links_next.clone());
        for l in 0..2 {
            for j in 0..4 {
                let sel = (0..WOTS_LEN).fold(AB::Expr::ZERO, |acc, k| {
                    acc + lc.onehot[k].clone() * pis[PI_ENDS + 8 * k + 4 * l + j].clone()
                });
                builder.assert_zero(g_end.clone() * (out(l, j) - sel));
            }
        }

        // -- 5. Boundary: the trace starts at chain 0, step 0, real ----------
        builder.when_first_row().assert_one(lc.is_real.clone());
        builder.when_first_row().assert_zero(lc.chain_step.clone());
        builder.when_first_row().assert_one(lc.onehot[0].clone());

        // -- 6. Transition constraints ---------------------------------------
        // (is_transition contributes no symbolic degree in p3-uni-stark, so
        // every constraint below still fits the degree-3 budget.)
        let not_sf = one.clone() - sf.clone();
        let g_link = sf.clone() * lc.links_next.clone();
        let g_break = sf.clone() * (lc.is_real.clone() - lc.links_next.clone());
        {
            let mut t = builder.when_transition();

            // Link columns are constant within a permutation's 24 rows.
            t.assert_zero(not_sf.clone() * (lc_next.is_real.clone() - lc.is_real.clone()));
            t.assert_zero(not_sf.clone() * (lc_next.chain_step.clone() - lc.chain_step.clone()));
            t.assert_zero(not_sf.clone() * (lc_next.links_next.clone() - lc.links_next.clone()));
            for k in 0..WOTS_LEN {
                t.assert_zero(not_sf.clone() * (lc_next.onehot[k].clone() - lc.onehot[k].clone()));
            }

            // Step counter: +1 within a chain, reset to 0 at a chain boundary.
            t.assert_zero(
                g_link.clone()
                    * (lc_next.chain_step.clone() - lc.chain_step.clone() - one.clone()),
            );
            t.assert_zero(g_break.clone() * lc_next.chain_step.clone());

            // One-hot: held within a chain, shifted by one at a chain
            // boundary, never wrapping. Together with "sum = 1 on real rows"
            // and "all zero on padding" this forces the trace to walk chains
            // 0..35 completely, in order, before padding may begin.
            for k in 0..WOTS_LEN {
                t.assert_zero(
                    g_link.clone() * (lc_next.onehot[k].clone() - lc.onehot[k].clone()),
                );
            }
            for k in 0..WOTS_LEN - 1 {
                t.assert_zero(
                    g_break.clone() * (lc_next.onehot[k + 1].clone() - lc.onehot[k].clone()),
                );
            }
            t.assert_zero(g_break.clone() * lc_next.onehot[0].clone());

            // Padding is terminal: once is_real drops to 0 it stays 0.
            t.assert_zero(
                sf.clone() * (one.clone() - lc.is_real.clone()) * lc_next.is_real.clone(),
            );

            // The chaining link itself: the next permutation's message lanes
            // (input lanes 6-7) equal the first 16 output bytes (output lanes
            // 0-1) of this permutation.
            for l in 0..2 {
                for j in 0..4 {
                    t.assert_zero(g_link.clone() * (pre_next(6 + l, j) - out(l, j)));
                }
            }
        }
    }
}
