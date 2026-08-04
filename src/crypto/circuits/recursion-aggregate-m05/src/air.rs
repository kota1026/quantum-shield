//! Interface-commitment AIR.
//!
//! The recursive verifier's public statement (§20) is the set of interface
//! values glued across the four segment proofs: the Merkle root, the FRI
//! fold challenges, the fold's initial and final evaluations, and the DEEP
//! trace opening. This AIR absorbs that set — arranged as `NBLOCKS` rate
//! blocks — into a Poseidon2 sponge (overwrite mode, rate = capacity = 8,
//! permutation constrained by `p3-poseidon2-air` via `SubAirBuilder`) and
//! binds the squeezed digest to a public output. The digest is the single
//! public input the §14 Groth16 wrap consumes, so the composition's public
//! surface collapses from the four segments' worth of values to one hash.
//!
//! Changing any interface value changes the digest, so the commitment binds
//! the whole set. (Binding these committed values to the actual segment
//! proofs still requires in-circuit proof verification — the full-recursion
//! step, §21.)

use core::borrow::{Borrow, BorrowMut};
use core::mem::size_of;

use p3_air::{Air, AirBuilder, AirBuilderWithPublicValues, BaseAir};
use p3_baby_bear::{BabyBear, GenericPoseidon2LinearLayersBabyBear};
use p3_field::PrimeCharacteristicRing;
use p3_matrix::Matrix;
use p3_poseidon2_air::{num_cols, Poseidon2Air, Poseidon2Cols, RoundConstants};
use p3_uni_stark::SubAirBuilder;

use crate::poseidon::{HALF_FULL_ROUNDS, PARTIAL_ROUNDS, SBOX_DEGREE, SBOX_REGISTERS, WIDTH};

pub const RATE: usize = WIDTH / 2;
/// Interface rate blocks: [Merkle root(8)], [fold betas(8)],
/// [f_init, f_final, d_t0, pad...].
pub const NBLOCKS: usize = 3;

pub const P2_COLS: usize =
    num_cols::<WIDTH, SBOX_DEGREE, SBOX_REGISTERS, HALF_FULL_ROUNDS, PARTIAL_ROUNDS>();

type Inner = Poseidon2Air<
    BabyBear,
    GenericPoseidon2LinearLayersBabyBear,
    WIDTH,
    SBOX_DEGREE,
    SBOX_REGISTERS,
    HALF_FULL_ROUNDS,
    PARTIAL_ROUNDS,
>;
type Cols<T> =
    Poseidon2Cols<T, WIDTH, SBOX_DEGREE, SBOX_REGISTERS, HALF_FULL_ROUNDS, PARTIAL_ROUNDS>;

#[repr(C)]
pub struct LinkCols<T> {
    pub is_real: T,
    pub links_next: T,
    pub onehot: [T; NBLOCKS],
}

pub const fn num_link_cols() -> usize {
    size_of::<LinkCols<u8>>()
}

impl<T> Borrow<LinkCols<T>> for [T] {
    fn borrow(&self) -> &LinkCols<T> {
        let (p, s, suf) = unsafe { self.align_to::<LinkCols<T>>() };
        debug_assert!(p.is_empty() && suf.is_empty());
        &s[0]
    }
}
impl<T> BorrowMut<LinkCols<T>> for [T] {
    fn borrow_mut(&mut self) -> &mut LinkCols<T> {
        let (p, s, suf) = unsafe { self.align_to_mut::<LinkCols<T>>() };
        debug_assert!(p.is_empty() && suf.is_empty());
        &mut s[0]
    }
}

// Public layout: NBLOCKS interface blocks (RATE each), then the digest (RATE).
pub const fn pi_iface() -> usize {
    0
}
pub const fn pi_digest() -> usize {
    NBLOCKS * RATE
}
pub const fn num_public_values() -> usize {
    NBLOCKS * RATE + RATE
}

pub struct AggregateAir {
    pub inner: Inner,
}

impl AggregateAir {
    pub fn new(c: RoundConstants<BabyBear, WIDTH, HALF_FULL_ROUNDS, PARTIAL_ROUNDS>) -> Self {
        Self { inner: Poseidon2Air::new(c) }
    }
}

impl BaseAir<BabyBear> for AggregateAir {
    fn width(&self) -> usize {
        P2_COLS + num_link_cols()
    }
}

impl<AB> Air<AB> for AggregateAir
where
    AB: AirBuilderWithPublicValues<F = BabyBear>,
{
    fn eval(&self, builder: &mut AB) {
        {
            let mut sub = SubAirBuilder::<AB, Inner, BabyBear>::new(builder, 0..P2_COLS);
            self.inner.eval(&mut sub);
        }

        let pis: Vec<AB::Expr> =
            builder.public_values().iter().map(|&p| p.into()).collect();
        assert_eq!(pis.len(), num_public_values());

        let main = builder.main();
        let local = main.row_slice(0).expect("empty");
        let next = main.row_slice(1).expect("one row");
        let l: &[AB::Var] = &local;
        let n: &[AB::Var] = &next;
        let pc: &Cols<AB::Var> = l[..P2_COLS].borrow();
        let lc: &LinkCols<AB::Var> = l[P2_COLS..].borrow();
        let pc_n: &Cols<AB::Var> = n[..P2_COLS].borrow();
        let lc_n: &LinkCols<AB::Var> = n[P2_COLS..].borrow();

        let one = AB::Expr::ONE;
        let inp = |i: usize| -> AB::Expr { pc.inputs[i].clone().into() };
        let inp_n = |i: usize| -> AB::Expr { pc_n.inputs[i].clone().into() };
        let out = |i: usize| -> AB::Expr {
            pc.ending_full_rounds[HALF_FULL_ROUNDS - 1].post[i].clone().into()
        };

        // -- Booleans and one-hot walk ---------------------------------------
        builder.assert_bool(lc.is_real.clone());
        builder.assert_bool(lc.links_next.clone());
        for k in 0..NBLOCKS {
            builder.assert_bool(lc.onehot[k].clone());
        }
        let sum_oh = lc.onehot.iter().fold(AB::Expr::ZERO, |a, v| a + v.clone());
        builder.assert_zero(lc.is_real.clone() * (sum_oh - one.clone()));
        for k in 0..NBLOCKS {
            builder.assert_zero((one.clone() - lc.is_real.clone()) * lc.onehot[k].clone());
        }
        builder.assert_zero((one.clone() - lc.is_real.clone()) * lc.links_next.clone());
        builder
            .assert_zero(lc.is_real.clone() * lc.onehot[NBLOCKS - 1].clone() * lc.links_next.clone());
        builder.assert_zero(
            lc.is_real.clone()
                * (one.clone() - lc.onehot[NBLOCKS - 1].clone())
                * (one.clone() - lc.links_next.clone()),
        );

        // -- Absorb: input rate == public interface block --------------------
        for i in 0..RATE {
            let blk = (0..NBLOCKS).fold(AB::Expr::ZERO, |acc, r| {
                acc + lc.onehot[r].clone() * pis[pi_iface() + r * RATE + i].clone()
            });
            builder.assert_zero(lc.is_real.clone() * (inp(i) - blk));
        }

        // -- First row: capacity IV = 0 --------------------------------------
        for i in RATE..WIDTH {
            builder.when_first_row().assert_zero(inp(i));
        }
        builder.when_first_row().assert_one(lc.onehot[0].clone());
        builder.when_first_row().assert_one(lc.is_real.clone());

        // -- Digest binding on the last real block ---------------------------
        let g_end = lc.is_real.clone() * (one.clone() - lc.links_next.clone());
        for i in 0..RATE {
            builder.assert_zero(g_end.clone() * (out(i) - pis[pi_digest() + i].clone()));
        }

        // -- Transition: capacity carry + one-hot shift ----------------------
        {
            let mut t = builder.when_transition();
            for k in 0..NBLOCKS - 1 {
                t.assert_zero(
                    lc.links_next.clone() * (lc_n.onehot[k + 1].clone() - lc.onehot[k].clone()),
                );
            }
            t.assert_zero((one.clone() - lc.is_real.clone()) * lc_n.is_real.clone());
            for i in RATE..WIDTH {
                t.assert_zero(lc.links_next.clone() * (inp_n(i) - out(i)));
            }
        }
    }
}
