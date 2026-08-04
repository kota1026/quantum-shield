//! FRI folding-consistency AIR.
//!
//! For a single FRI query, each row is one folding round. The verifier holds
//! a running evaluation `e_i` (the claimed value of layer i at the query
//! point), the round's two sibling openings `a_i = p_i(x_i)` and
//! `c_i = p_i(-x_i)`, the round challenge `beta_i` and the domain point
//! `x_i`. The round is consistent iff
//!
//!   * `e_i` equals the opening at the actual query point (index bit picks
//!     `a_i` or `c_i`), and
//!   * the folded value carried into the next round satisfies the FRI fold
//!     `2*x_i*e_{i+1} = x_i*(a_i + c_i) + beta_i*(a_i - c_i)`
//!     (i.e. `e_{i+1} = (a+c)/2 + beta*(a-c)/(2x)`), with the domain squaring
//!     `x_{i+1} = x_i^2`.
//!
//! Openings, challenges and index bits are public (they come from the FRI
//! proof and the Fiat-Shamir transcript); the running evaluation and domain
//! point are witnessed and chained. This is the fold-and-check a recursive
//! FRI verifier performs for every query — here as a native-field AIR, one
//! of method A's components (§16.4). Everything is degree <= 3.

use core::borrow::{Borrow, BorrowMut};
use core::mem::size_of;

use p3_air::{Air, AirBuilder, AirBuilderWithPublicValues, BaseAir};
use p3_baby_bear::BabyBear;
use p3_field::PrimeCharacteristicRing;
use p3_matrix::Matrix;

#[repr(C)]
pub struct FriCols<T, const R: usize> {
    pub is_real: T,
    pub links_next: T,
    /// Query-index bit for this round (0 => query point is x, opening a).
    pub dir: T,
    /// Running evaluation e_i (layer i at the query point).
    pub e: T,
    /// Domain point x_i.
    pub x: T,
    /// One-hot round selector.
    pub onehot: [T; R],
}

pub const fn num_cols<const R: usize>() -> usize {
    size_of::<FriCols<u8, R>>()
}

impl<T, const R: usize> Borrow<FriCols<T, R>> for [T] {
    fn borrow(&self) -> &FriCols<T, R> {
        let (p, s, suf) = unsafe { self.align_to::<FriCols<T, R>>() };
        debug_assert!(p.is_empty() && suf.is_empty());
        &s[0]
    }
}
impl<T, const R: usize> BorrowMut<FriCols<T, R>> for [T] {
    fn borrow_mut(&mut self) -> &mut FriCols<T, R> {
        let (p, s, suf) = unsafe { self.align_to_mut::<FriCols<T, R>>() };
        debug_assert!(p.is_empty() && suf.is_empty());
        &mut s[0]
    }
}

// Public input layout.
pub const fn pi_x0() -> usize {
    0
}
pub const fn pi_init() -> usize {
    1
}
pub const fn pi_final() -> usize {
    2
}
pub const fn pi_beta() -> usize {
    3
}
pub const fn pi_a<const R: usize>() -> usize {
    3 + R
}
pub const fn pi_c<const R: usize>() -> usize {
    3 + 2 * R
}
pub const fn pi_bit<const R: usize>() -> usize {
    3 + 3 * R
}
pub const fn num_public_values<const R: usize>() -> usize {
    3 + 4 * R
}

pub struct FriFoldAir<const R: usize>;

impl<const R: usize> BaseAir<BabyBear> for FriFoldAir<R> {
    fn width(&self) -> usize {
        num_cols::<R>()
    }
}

impl<const R: usize, AB> Air<AB> for FriFoldAir<R>
where
    AB: AirBuilderWithPublicValues<F = BabyBear>,
{
    fn eval(&self, builder: &mut AB) {
        let pis: Vec<AB::Expr> =
            builder.public_values().iter().map(|&p| p.into()).collect();
        assert_eq!(pis.len(), num_public_values::<R>());

        let main = builder.main();
        let local = main.row_slice(0).expect("empty matrix");
        let next = main.row_slice(1).expect("one-row matrix");
        let l: &[AB::Var] = &local;
        let n: &[AB::Var] = &next;
        let c: &FriCols<AB::Var, R> = l.borrow();
        let cn: &FriCols<AB::Var, R> = n.borrow();

        let one = AB::Expr::ONE;
        let two = AB::Expr::from_u8(2);

        let sel = |oh: &[AB::Var; R], base: usize| {
            (0..R).fold(AB::Expr::ZERO, |acc, r| {
                acc + oh[r].clone() * pis[base + r].clone()
            })
        };

        // -- 1. Booleans and one-hot walk ------------------------------------
        builder.assert_bool(c.is_real.clone());
        builder.assert_bool(c.links_next.clone());
        builder.assert_bool(c.dir.clone());
        for r in 0..R {
            builder.assert_bool(c.onehot[r].clone());
        }
        let sum_oh = c.onehot.iter().fold(AB::Expr::ZERO, |a, v| a + v.clone());
        builder.assert_zero(c.is_real.clone() * (sum_oh - one.clone()));
        for r in 0..R {
            builder.assert_zero((one.clone() - c.is_real.clone()) * c.onehot[r].clone());
        }
        builder.assert_zero((one.clone() - c.is_real.clone()) * c.links_next.clone());
        builder.assert_zero(c.is_real.clone() * c.onehot[R - 1].clone() * c.links_next.clone());
        builder.assert_zero(
            c.is_real.clone()
                * (one.clone() - c.onehot[R - 1].clone())
                * (one.clone() - c.links_next.clone()),
        );

        // -- 2. Public bindings for this round -------------------------------
        let a = sel(&c.onehot, pi_a::<R>());
        let cc = sel(&c.onehot, pi_c::<R>());
        let beta = sel(&c.onehot, pi_beta());
        let bit = sel(&c.onehot, pi_bit::<R>());
        // dir equals the public query-index bit.
        builder.assert_zero(c.is_real.clone() * (c.dir.clone() - bit));

        // -- 3. Consistency: running eval = opening at the query point -------
        // query point opening = (1-dir)*a + dir*c.
        let opening_at_query =
            (one.clone() - c.dir.clone()) * a.clone() + c.dir.clone() * cc.clone();
        builder.assert_zero(c.is_real.clone() * (c.e.clone() - opening_at_query));

        // -- 4. Boundary: first round init eval and domain point -------------
        builder
            .when_first_row()
            .assert_zero(c.e.clone() - pis[pi_init()].clone());
        builder
            .when_first_row()
            .assert_zero(c.x.clone() - pis[pi_x0()].clone());
        builder.when_first_row().assert_one(c.onehot[0].clone());
        builder.when_first_row().assert_one(c.is_real.clone());

        // -- 5. Fold relation into the final eval on the last real round -----
        // 2*x*final = x*(a+c) + beta*(a-c).
        let g_end = c.is_real.clone() * (one.clone() - c.links_next.clone());
        let fold_rhs =
            c.x.clone() * (a.clone() + cc.clone()) + beta.clone() * (a.clone() - cc.clone());
        builder.assert_zero(
            g_end * (two.clone() * c.x.clone() * pis[pi_final()].clone() - fold_rhs.clone()),
        );

        // -- 6. Transition: fold chain + domain squaring + one-hot shift -----
        {
            let mut t = builder.when_transition();
            for r in 0..R - 1 {
                t.assert_zero(
                    c.links_next.clone() * (cn.onehot[r + 1].clone() - c.onehot[r].clone()),
                );
            }
            t.assert_zero((one.clone() - c.is_real.clone()) * cn.is_real.clone());
            // e_{i+1} folded: 2*x*e_next = x*(a+c) + beta*(a-c).
            t.assert_zero(
                c.links_next.clone()
                    * (two.clone() * c.x.clone() * cn.e.clone() - fold_rhs.clone()),
            );
            // x_{i+1} = x_i^2.
            t.assert_zero(
                c.links_next.clone() * (cn.x.clone() - c.x.clone() * c.x.clone()),
            );
        }
    }
}
