//! Fiat-Shamir transcript-replay AIR.
//!
//! A Poseidon2 duplex sponge (overwrite mode, rate = capacity = 8) replays
//! the verifier's transcript: each row absorbs the prover's observed
//! commitment for that round into the rate lanes, keeps the running capacity,
//! permutes (constrained by `p3-poseidon2-air` via `SubAirBuilder`), and the
//! squeezed rate lanes are the round's challenges. The AIR binds each
//! squeezed challenge to the public value that the FRI folding AIR (§17)
//! consumes, so a recursive verifier derives its own `beta_i` / query
//! indices in-circuit rather than trusting the prover's claimed challenges.
//!
//! (The production QS proofs use a Keccak challenger; this component
//! demonstrates the in-circuit transcript over the recursion-friendly
//! Poseidon2 sponge that method A commits to — §15/§16.)

use core::borrow::{Borrow, BorrowMut};
use core::mem::size_of;

use p3_air::{Air, AirBuilder, AirBuilderWithPublicValues, BaseAir};
use p3_baby_bear::{BabyBear, GenericPoseidon2LinearLayersBabyBear};
use p3_field::PrimeCharacteristicRing;
use p3_matrix::Matrix;
use p3_poseidon2_air::{num_cols, Poseidon2Air, Poseidon2Cols, RoundConstants};
use p3_uni_stark::SubAirBuilder;

use crate::poseidon::{
    HALF_FULL_ROUNDS, PARTIAL_ROUNDS, SBOX_DEGREE, SBOX_REGISTERS, WIDTH,
};

/// Sponge rate (and capacity): WIDTH / 2.
pub const RATE: usize = WIDTH / 2;
/// Challenge lanes squeezed per round.
pub const CH: usize = 2;

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
pub struct LinkCols<T, const R: usize> {
    pub is_real: T,
    pub links_next: T,
    pub onehot: [T; R],
}

pub const fn num_link_cols<const R: usize>() -> usize {
    size_of::<LinkCols<u8, R>>()
}

impl<T, const R: usize> Borrow<LinkCols<T, R>> for [T] {
    fn borrow(&self) -> &LinkCols<T, R> {
        let (p, s, suf) = unsafe { self.align_to::<LinkCols<T, R>>() };
        debug_assert!(p.is_empty() && suf.is_empty());
        &s[0]
    }
}
impl<T, const R: usize> BorrowMut<LinkCols<T, R>> for [T] {
    fn borrow_mut(&mut self) -> &mut LinkCols<T, R> {
        let (p, s, suf) = unsafe { self.align_to_mut::<LinkCols<T, R>>() };
        debug_assert!(p.is_empty() && suf.is_empty());
        &mut s[0]
    }
}

// Public layout: R observed commitments (RATE each), then R challenges (CH each).
pub const fn pi_obs() -> usize {
    0
}
pub const fn pi_chal<const R: usize>() -> usize {
    R * RATE
}
pub const fn num_public_values<const R: usize>() -> usize {
    R * RATE + R * CH
}

pub struct TranscriptAir<const R: usize> {
    pub inner: Inner,
}

impl<const R: usize> TranscriptAir<R> {
    pub fn new(c: RoundConstants<BabyBear, WIDTH, HALF_FULL_ROUNDS, PARTIAL_ROUNDS>) -> Self {
        Self { inner: Poseidon2Air::new(c) }
    }
}

impl<const R: usize> BaseAir<BabyBear> for TranscriptAir<R> {
    fn width(&self) -> usize {
        P2_COLS + num_link_cols::<R>()
    }
}

impl<const R: usize, AB> Air<AB> for TranscriptAir<R>
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
        assert_eq!(pis.len(), num_public_values::<R>());

        let main = builder.main();
        let local = main.row_slice(0).expect("empty");
        let next = main.row_slice(1).expect("one row");
        let l: &[AB::Var] = &local;
        let n: &[AB::Var] = &next;
        let pc: &Cols<AB::Var> = l[..P2_COLS].borrow();
        let lc: &LinkCols<AB::Var, R> = l[P2_COLS..].borrow();
        let pc_n: &Cols<AB::Var> = n[..P2_COLS].borrow();
        let lc_n: &LinkCols<AB::Var, R> = n[P2_COLS..].borrow();

        let one = AB::Expr::ONE;
        let inp = |i: usize| -> AB::Expr { pc.inputs[i].clone().into() };
        let inp_n = |i: usize| -> AB::Expr { pc_n.inputs[i].clone().into() };
        let out = |i: usize| -> AB::Expr {
            pc.ending_full_rounds[HALF_FULL_ROUNDS - 1].post[i].clone().into()
        };

        // -- 1. Booleans and one-hot walk ------------------------------------
        builder.assert_bool(lc.is_real.clone());
        builder.assert_bool(lc.links_next.clone());
        for k in 0..R {
            builder.assert_bool(lc.onehot[k].clone());
        }
        let sum_oh = lc.onehot.iter().fold(AB::Expr::ZERO, |a, v| a + v.clone());
        builder.assert_zero(lc.is_real.clone() * (sum_oh - one.clone()));
        for k in 0..R {
            builder.assert_zero((one.clone() - lc.is_real.clone()) * lc.onehot[k].clone());
        }
        builder.assert_zero((one.clone() - lc.is_real.clone()) * lc.links_next.clone());
        builder.assert_zero(lc.is_real.clone() * lc.onehot[R - 1].clone() * lc.links_next.clone());
        builder.assert_zero(
            lc.is_real.clone()
                * (one.clone() - lc.onehot[R - 1].clone())
                * (one.clone() - lc.links_next.clone()),
        );

        // -- 2. Absorb: input rate lanes == public observed commitment -------
        for i in 0..RATE {
            let obs = (0..R).fold(AB::Expr::ZERO, |acc, r| {
                acc + lc.onehot[r].clone() * pis[pi_obs() + r * RATE + i].clone()
            });
            builder.assert_zero(lc.is_real.clone() * (inp(i) - obs));
        }

        // -- 3. First row: capacity initialized to the zero IV ---------------
        for i in RATE..WIDTH {
            builder.when_first_row().assert_zero(inp(i));
        }
        builder.when_first_row().assert_one(lc.onehot[0].clone());
        builder.when_first_row().assert_one(lc.is_real.clone());

        // -- 4. Squeeze: output rate lanes == public round challenges --------
        for j in 0..CH {
            let ch = (0..R).fold(AB::Expr::ZERO, |acc, r| {
                acc + lc.onehot[r].clone() * pis[pi_chal::<R>() + r * CH + j].clone()
            });
            builder.assert_zero(lc.is_real.clone() * (out(j) - ch));
        }

        // -- 5. Transition: capacity carry + one-hot shift -------------------
        {
            let mut t = builder.when_transition();
            for k in 0..R - 1 {
                t.assert_zero(
                    lc.links_next.clone() * (lc_n.onehot[k + 1].clone() - lc.onehot[k].clone()),
                );
            }
            t.assert_zero((one.clone() - lc.is_real.clone()) * lc_n.is_real.clone());
            // Next round's capacity lanes = this round's output capacity.
            for i in RATE..WIDTH {
                t.assert_zero(lc.links_next.clone() * (inp_n(i) - out(i)));
            }
        }
    }
}
