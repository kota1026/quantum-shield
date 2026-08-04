//! Poseidon2 Merkle authentication-path verifier AIR.
//!
//! Each row is one 2-to-1 Poseidon2 compression, constrained to be a correct
//! permutation by `p3-poseidon2-air` (evaluated through `SubAirBuilder` on
//! the leading columns). Appended link columns then force the rows to form a
//! Merkle path: the truncated output of level l is the running-node child of
//! level l+1, the other child is the public sibling, the running node at
//! level 0 is the public leaf, the final output is the public root, and the
//! per-level left/right choice equals the public index bit. This is the
//! inner loop a recursive FRI verifier runs for every query opening — here
//! over a native-field hash (recursion-friendly) instead of Keccak.

use core::borrow::{Borrow, BorrowMut};
use core::mem::size_of;

use p3_air::{Air, AirBuilder, AirBuilderWithPublicValues, BaseAir};
use p3_baby_bear::{BabyBear, GenericPoseidon2LinearLayersBabyBear};
use p3_field::PrimeCharacteristicRing;
use p3_matrix::Matrix;
use p3_poseidon2_air::{num_cols, Poseidon2Air, Poseidon2Cols, RoundConstants};
use p3_uni_stark::SubAirBuilder;

use crate::poseidon::{
    CHUNK, HALF_FULL_ROUNDS, PARTIAL_ROUNDS, SBOX_DEGREE, SBOX_REGISTERS, WIDTH,
};

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

/// Link columns appended after the Poseidon2 columns.
#[repr(C)]
pub struct LinkCols<T, const D: usize> {
    pub is_real: T,
    pub links_next: T,
    /// 0 = running node is the left child (lanes 0..CHUNK), 1 = right child.
    pub dir: T,
    /// One-hot level selector (level within the path).
    pub onehot: [T; D],
}

pub const fn num_link_cols<const D: usize>() -> usize {
    size_of::<LinkCols<u8, D>>()
}

impl<T, const D: usize> Borrow<LinkCols<T, D>> for [T] {
    fn borrow(&self) -> &LinkCols<T, D> {
        let (p, s, suf) = unsafe { self.align_to::<LinkCols<T, D>>() };
        debug_assert!(p.is_empty() && suf.is_empty());
        &s[0]
    }
}
impl<T, const D: usize> BorrowMut<LinkCols<T, D>> for [T] {
    fn borrow_mut(&mut self) -> &mut LinkCols<T, D> {
        let (p, s, suf) = unsafe { self.align_to_mut::<LinkCols<T, D>>() };
        debug_assert!(p.is_empty() && suf.is_empty());
        &mut s[0]
    }
}

// Public input layout.
pub const fn pi_leaf() -> usize {
    0
}
pub const fn pi_root() -> usize {
    CHUNK
}
pub const fn pi_dir() -> usize {
    2 * CHUNK
}
pub const fn pi_sib<const D: usize>() -> usize {
    2 * CHUNK + D
}
pub const fn num_public_values<const D: usize>() -> usize {
    2 * CHUNK + D + D * CHUNK
}

pub struct MerklePathAir<const D: usize> {
    pub inner: Inner,
}

impl<const D: usize> MerklePathAir<D> {
    pub fn new(constants: RoundConstants<BabyBear, WIDTH, HALF_FULL_ROUNDS, PARTIAL_ROUNDS>) -> Self {
        Self { inner: Poseidon2Air::new(constants) }
    }
}

impl<const D: usize> BaseAir<BabyBear> for MerklePathAir<D> {
    fn width(&self) -> usize {
        P2_COLS + num_link_cols::<D>()
    }
}

impl<const D: usize, AB> Air<AB> for MerklePathAir<D>
where
    AB: AirBuilderWithPublicValues<F = BabyBear>,
{
    fn eval(&self, builder: &mut AB) {
        // Poseidon2 permutation constraints on the leading columns.
        {
            let mut sub = SubAirBuilder::<AB, Inner, BabyBear>::new(builder, 0..P2_COLS);
            self.inner.eval(&mut sub);
        }

        let pis: Vec<AB::Expr> =
            builder.public_values().iter().map(|&p| p.into()).collect();
        assert_eq!(pis.len(), num_public_values::<D>());

        let main = builder.main();
        let local = main.row_slice(0).expect("empty matrix");
        let next = main.row_slice(1).expect("one-row matrix");
        let l: &[AB::Var] = &local;
        let n: &[AB::Var] = &next;
        let pc: &Cols<AB::Var> = l[..P2_COLS].borrow();
        let lc: &LinkCols<AB::Var, D> = l[P2_COLS..].borrow();
        let pc_n: &Cols<AB::Var> = n[..P2_COLS].borrow();
        let lc_n: &LinkCols<AB::Var, D> = n[P2_COLS..].borrow();

        let one = AB::Expr::ONE;

        // Permutation input children and truncated output (as Expr).
        let inp = |i: usize| -> AB::Expr { pc.inputs[i].clone().into() };
        let inp_n = |i: usize| -> AB::Expr { pc_n.inputs[i].clone().into() };
        let out =
            |i: usize| -> AB::Expr { pc.ending_full_rounds[HALF_FULL_ROUNDS - 1].post[i].clone().into() };

        // running_in = child selected by dir (0 -> lanes 0..CHUNK).
        let running_in = |i: usize, dir: AB::Expr, lo: AB::Expr, hi: AB::Expr| {
            (one.clone() - dir.clone()) * lo + dir * hi
        };

        // -- 1. Booleans and one-hot well-formedness -------------------------
        builder.assert_bool(lc.is_real.clone());
        builder.assert_bool(lc.links_next.clone());
        builder.assert_bool(lc.dir.clone());
        for k in 0..D {
            builder.assert_bool(lc.onehot[k].clone());
        }
        let sum_oh = lc.onehot.iter().fold(AB::Expr::ZERO, |a, v| a + v.clone());
        builder.assert_zero(lc.is_real.clone() * (sum_oh.clone() - one.clone()));
        for k in 0..D {
            builder.assert_zero((one.clone() - lc.is_real.clone()) * lc.onehot[k].clone());
        }
        // links_next = is_real AND NOT last level (onehot[D-1]).
        builder.assert_zero((one.clone() - lc.is_real.clone()) * lc.links_next.clone());
        builder.assert_zero(lc.is_real.clone() * lc.onehot[D - 1].clone() * lc.links_next.clone());
        builder.assert_zero(
            lc.is_real.clone()
                * (one.clone() - lc.onehot[D - 1].clone())
                * (one.clone() - lc.links_next.clone()),
        );

        // -- 2. Sibling binding (public, one-hot selected) -------------------
        // sibling child = the one NOT selected by dir.
        for i in 0..CHUNK {
            let sib_sel = (0..D).fold(AB::Expr::ZERO, |acc, lvl| {
                acc + lc.onehot[lvl].clone() * pis[pi_sib::<D>() + lvl * CHUNK + i].clone()
            });
            // sibling_in = dir*lo + (1-dir)*hi.
            let sibling_in = lc.dir.clone() * inp(i)
                + (one.clone() - lc.dir.clone()) * inp(CHUNK + i);
            builder.assert_zero(lc.is_real.clone() * (sibling_in - sib_sel));
        }

        // -- 3. Direction binding to the public index bit --------------------
        let dir_sel = (0..D).fold(AB::Expr::ZERO, |acc, lvl| {
            acc + lc.onehot[lvl].clone() * pis[pi_dir() + lvl].clone()
        });
        builder.assert_zero(lc.is_real.clone() * (lc.dir.clone() - dir_sel));

        // -- 4. Leaf binding at level 0 --------------------------------------
        for i in 0..CHUNK {
            let r_in = running_in(i, lc.dir.clone().into(), inp(i), inp(CHUNK + i));
            builder
                .assert_zero(lc.onehot[0].clone() * (r_in - pis[pi_leaf() + i].clone()));
        }

        // -- 5. Root binding at the last real level --------------------------
        let g_end = lc.is_real.clone() * (one.clone() - lc.links_next.clone());
        for i in 0..CHUNK {
            builder.assert_zero(g_end.clone() * (out(i) - pis[pi_root() + i].clone()));
        }

        // -- 6. Transition: one-hot walk + node chaining ---------------------
        {
            let mut t = builder.when_transition();
            // One-hot shifts by one at each step while the path continues.
            for k in 0..D - 1 {
                t.assert_zero(
                    lc.links_next.clone()
                        * (lc_n.onehot[k + 1].clone() - lc.onehot[k].clone()),
                );
            }
            // Padding is terminal.
            t.assert_zero(
                (one.clone() - lc.is_real.clone()) * lc_n.is_real.clone(),
            );
            // The running node of the next level = this level's output.
            for i in 0..CHUNK {
                let r_in_n = running_in(i, lc_n.dir.clone().into(), inp_n(i), inp_n(CHUNK + i));
                t.assert_zero(lc.links_next.clone() * (r_in_n - out(i)));
            }
        }

        // First row is the real level-0 node.
        builder.when_first_row().assert_one(lc.is_real.clone());
        builder.when_first_row().assert_one(lc.onehot[0].clone());
    }
}
