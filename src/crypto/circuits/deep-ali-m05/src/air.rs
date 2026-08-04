//! DEEP-ALI constraint-consistency AIR.
//!
//! The final step of STARK verification checks that the opened polynomial
//! evaluations satisfy the AIR constraints at a random out-of-domain point
//! `zeta`, via the DEEP quotient identity
//!
//!   C(t(zeta), t(zeta*g)) = Z_H(zeta) * q(zeta),
//!
//! where `C` is the constraint combination, `t` the trace polynomial, `q`
//! the committed quotient and `Z_H(x) = x^n - 1` the vanishing polynomial of
//! the size-`n` trace domain. A recursive verifier must recompute this
//! identity in-circuit. This AIR does so for a demo inner constraint
//! `C = t(zeta*g) - t(zeta)^2` (a squaring-transition AIR): it recomputes
//! `Z_H(zeta) = zeta^n - 1` through an in-AIR squaring chain (`n = 2^LOG_N`)
//! and asserts the identity against the public openings `t0 = t(zeta)`,
//! `t1 = t(zeta*g)` and `q = q(zeta)`. All constraints are degree <= 3.

use core::borrow::{Borrow, BorrowMut};
use core::mem::size_of;

use p3_air::{Air, AirBuilder, AirBuilderWithPublicValues, BaseAir};
use p3_baby_bear::BabyBear;
use p3_field::PrimeCharacteristicRing;
use p3_matrix::Matrix;

/// log2 of the demo trace-domain size (n = 2^LOG_N). The squaring chain has
/// LOG_N steps: p_0 = zeta, p_{i+1} = p_i^2, p_LOG_N = zeta^n.
pub const LOG_N: usize = 10;
/// Chain rows (p_0 .. p_LOG_N).
pub const ROWS: usize = LOG_N + 1;

#[repr(C)]
pub struct Cols<T> {
    pub is_real: T,
    pub links_next: T,
    /// Squaring accumulator: p_i = zeta^(2^i).
    pub p: T,
    /// One-hot step selector.
    pub onehot: [T; ROWS],
}

pub const fn num_cols() -> usize {
    size_of::<Cols<u8>>()
}

impl<T> Borrow<Cols<T>> for [T] {
    fn borrow(&self) -> &Cols<T> {
        let (a, s, b) = unsafe { self.align_to::<Cols<T>>() };
        debug_assert!(a.is_empty() && b.is_empty());
        &s[0]
    }
}
impl<T> BorrowMut<Cols<T>> for [T] {
    fn borrow_mut(&mut self) -> &mut Cols<T> {
        let (a, s, b) = unsafe { self.align_to_mut::<Cols<T>>() };
        debug_assert!(a.is_empty() && b.is_empty());
        &mut s[0]
    }
}

// Public layout: zeta, t0 = t(zeta), t1 = t(zeta*g), q = q(zeta).
pub const PI_ZETA: usize = 0;
pub const PI_T0: usize = 1;
pub const PI_T1: usize = 2;
pub const PI_Q: usize = 3;
pub const NUM_PUBLIC_VALUES: usize = 4;

pub struct DeepAliAir;

impl BaseAir<BabyBear> for DeepAliAir {
    fn width(&self) -> usize {
        num_cols()
    }
}

impl<AB> Air<AB> for DeepAliAir
where
    AB: AirBuilderWithPublicValues<F = BabyBear>,
{
    fn eval(&self, builder: &mut AB) {
        let pis: Vec<AB::Expr> =
            builder.public_values().iter().map(|&p| p.into()).collect();
        assert_eq!(pis.len(), NUM_PUBLIC_VALUES);

        let main = builder.main();
        let local = main.row_slice(0).expect("empty");
        let next = main.row_slice(1).expect("one row");
        let l: &[AB::Var] = &local;
        let n: &[AB::Var] = &next;
        let c: &Cols<AB::Var> = l.borrow();
        let cn: &Cols<AB::Var> = n.borrow();

        let one = AB::Expr::ONE;

        // -- Booleans and one-hot walk ---------------------------------------
        builder.assert_bool(c.is_real.clone());
        builder.assert_bool(c.links_next.clone());
        for k in 0..ROWS {
            builder.assert_bool(c.onehot[k].clone());
        }
        let sum_oh = c.onehot.iter().fold(AB::Expr::ZERO, |a, v| a + v.clone());
        builder.assert_zero(c.is_real.clone() * (sum_oh - one.clone()));
        for k in 0..ROWS {
            builder.assert_zero((one.clone() - c.is_real.clone()) * c.onehot[k].clone());
        }
        builder.assert_zero((one.clone() - c.is_real.clone()) * c.links_next.clone());
        builder.assert_zero(c.is_real.clone() * c.onehot[ROWS - 1].clone() * c.links_next.clone());
        builder.assert_zero(
            c.is_real.clone()
                * (one.clone() - c.onehot[ROWS - 1].clone())
                * (one.clone() - c.links_next.clone()),
        );

        // -- Boundary: p_0 = zeta --------------------------------------------
        builder
            .when_first_row()
            .assert_zero(c.p.clone() - pis[PI_ZETA].clone());
        builder.when_first_row().assert_one(c.onehot[0].clone());
        builder.when_first_row().assert_one(c.is_real.clone());

        // -- DEEP identity on the last real row (p = zeta^n) -----------------
        // C = t1 - t0^2 ; assert C == (p - 1) * q.
        let g_end = c.is_real.clone() * (one.clone() - c.links_next.clone());
        let cc = pis[PI_T1].clone() - pis[PI_T0].clone() * pis[PI_T0].clone();
        let zh = c.p.clone() - one.clone();
        builder.assert_zero(g_end * (cc - zh * pis[PI_Q].clone()));

        // -- Transition: squaring chain + one-hot shift ----------------------
        {
            let mut t = builder.when_transition();
            for k in 0..ROWS - 1 {
                t.assert_zero(
                    c.links_next.clone() * (cn.onehot[k + 1].clone() - c.onehot[k].clone()),
                );
            }
            t.assert_zero((one.clone() - c.is_real.clone()) * cn.is_real.clone());
            // p_{i+1} = p_i^2.
            t.assert_zero(c.links_next.clone() * (cn.p.clone() - c.p.clone() * c.p.clone()));
        }
    }
}
