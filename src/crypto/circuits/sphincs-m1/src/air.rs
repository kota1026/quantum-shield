//! WOTS+ chain AIR: `p3-keccak-air` plus cross-permutation chaining
//! constraints (M1 of `docs/core/STARK_AIR_GAP_ANALYSIS.md`).
//!
//! # Statement
//!
//! Given public inputs
//! - the full initial sponge state `S0` (100 limbs — pk_seed, ADRS with the
//!   starting hash address, chain start value, SHAKE padding, zero capacity),
//! - the hash-address limb `A_end` of the final chain step,
//! - the 16-byte chain result `R` (8 limbs),
//!
//! the proof attests that applying the SPHINCS+-SHAKE-128s F function
//! repeatedly — each step one Keccak-f[1600] permutation, rebuilding the next
//! message block from the previous output with the hash address incremented —
//! starting from `S0` until the hash address reaches `A_end`, yields `R`.
//!
//! # Trace layout
//!
//! `[ KeccakCols (NUM_KECCAK_COLS) | is_real | is_result | inv | seen ]`
//!
//! - `is_real`: 1 on rows of chain permutations (a contiguous prefix),
//!   0 on the zero-input padding permutations appended by
//!   `generate_trace_rows`.
//! - `is_result`: 1 exactly on the final round row of the last chain step.
//!   Forced by an is-zero gadget on `hash_addr - A_end` (with witness
//!   inverse column `inv`), so the prover cannot place or omit it freely.
//! - `seen`: prefix sum of `is_result`; `seen == 1` on the last row makes
//!   the result row mandatory, and booleanness makes it unique.
//!
//! # Chaining constraints (at every final-round row with `next.is_real = 1`)
//!
//! With message words numbered 0..17 (`word w` lives at
//! `preimage[w/5][w%5]`):
//! - words 6,7 (chain value): `next.preimage == this permutation's output
//!   words 0,1` — the squeezed F output feeds the next block,
//! - word 5 limb 3 (hash-address low bytes): `next == local + 256`
//!   (big-endian u32 address whose value stays < 256, so the increment is
//!   linear in the 16-bit limb),
//! - all other words/limbs (pk_seed, rest of ADRS, padding, capacity):
//!   `next.preimage == local.preimage`.

use core::borrow::Borrow;

use p3_air::{Air, AirBuilder, AirBuilderWithPublicValues, BaseAir, BaseAirWithPublicValues};
use p3_field::{Field, PrimeCharacteristicRing, PrimeField64};
use p3_keccak_air::{generate_trace_rows, KeccakAir, KeccakCols, NUM_KECCAK_COLS, NUM_ROUNDS};
use p3_matrix::dense::RowMajorMatrix;
use p3_matrix::Matrix;
use p3_uni_stark::SubAirBuilder;

use crate::wots::ChainWitness;

/// Extra column offsets (relative to the start of a row).
pub const COL_IS_REAL: usize = NUM_KECCAK_COLS;
pub const COL_IS_RESULT: usize = NUM_KECCAK_COLS + 1;
pub const COL_INV: usize = NUM_KECCAK_COLS + 2;
pub const COL_SEEN: usize = NUM_KECCAK_COLS + 3;

/// Total trace width.
pub const NUM_COLS: usize = NUM_KECCAK_COLS + 4;

/// Public value layout.
pub const PV_INITIAL_STATE: usize = 0; // ..100: initial state limbs, word-major
pub const PV_RESULT_ADDR: usize = 100; // hash-address limb of the result step
pub const PV_RESULT: usize = 101; // ..109: result limbs (output words 0,1)
pub const NUM_PUBLIC_VALUES: usize = 109;

/// Limbs per 64-bit word in the keccak-air layout.
const U64_LIMBS: usize = 4;

/// Message word holding the hash address (ADRS bytes 24..32 live in
/// message bytes 40..48 = word 5; the big-endian u32 hash address occupies
/// bytes 44..48, whose low bytes 46,47 form limb 3).
const HASH_ADDR_WORD: usize = 5;
const HASH_ADDR_LIMB: usize = 3;

/// Message words holding the 16-byte chain value (bytes 48..64).
const VALUE_WORDS: [usize; 2] = [6, 7];

#[derive(Debug)]
pub struct WotsChainAir {}

impl<F> BaseAir<F> for WotsChainAir {
    fn width(&self) -> usize {
        NUM_COLS
    }
}

impl<F: Field> BaseAirWithPublicValues<F> for WotsChainAir {
    fn num_public_values(&self) -> usize {
        NUM_PUBLIC_VALUES
    }
}

impl<AB: AirBuilderWithPublicValues> Air<AB> for WotsChainAir {
    fn eval(&self, builder: &mut AB) {
        // 1. Every permutation in the trace is a correct Keccak-f[1600].
        {
            let mut sub =
                SubAirBuilder::<AB, KeccakAir, AB::F>::new(builder, 0..NUM_KECCAK_COLS);
            KeccakAir {}.eval(&mut sub);
        }

        let pvs: Vec<AB::Expr> = builder.public_values().iter().map(|&pv| pv.into()).collect();
        assert_eq!(pvs.len(), NUM_PUBLIC_VALUES);

        let main = builder.main();
        let local = main.row_slice(0).expect("the matrix is empty?");
        let next = main.row_slice(1).expect("the matrix only has 1 row?");
        let kc: &KeccakCols<AB::Var> = (&(*local)[..NUM_KECCAK_COLS]).borrow();
        let kn: &KeccakCols<AB::Var> = (&(*next)[..NUM_KECCAK_COLS]).borrow();

        let is_real: AB::Expr = (*local)[COL_IS_REAL].clone().into();
        let next_is_real: AB::Expr = (*next)[COL_IS_REAL].clone().into();
        let is_result: AB::Expr = (*local)[COL_IS_RESULT].clone().into();
        let next_is_result: AB::Expr = (*next)[COL_IS_RESULT].clone().into();
        let inv: AB::Expr = (*local)[COL_INV].clone().into();
        let seen: AB::Expr = (*local)[COL_SEEN].clone().into();
        let next_seen: AB::Expr = (*next)[COL_SEEN].clone().into();

        let step_final: AB::Expr = kc.step_flags[NUM_ROUNDS - 1].clone().into();

        // 2. Flag columns are boolean.
        builder.assert_bool(is_real.clone());
        builder.assert_bool(is_result.clone());
        builder.assert_bool(seen.clone());

        // 3. First row: the chain prefix starts here, and the full initial
        //    sponge state is pinned to the public values.
        builder.when_first_row().assert_one(is_real.clone());
        builder.when_first_row().assert_eq(seen.clone(), is_result.clone());
        for word in 0..25 {
            for limb in 0..U64_LIMBS {
                builder.when_first_row().assert_eq(
                    kc.preimage[word / 5][word % 5][limb].clone(),
                    pvs[PV_INITIAL_STATE + word * U64_LIMBS + limb].clone(),
                );
            }
        }

        // 4. is_real is a contiguous prefix: it never rises, and it may only
        //    fall on a permutation boundary.
        builder
            .when_transition()
            .assert_bool(is_real.clone() - next_is_real.clone());
        builder
            .when_transition()
            .when(AB::Expr::ONE - step_final.clone())
            .assert_eq(is_real.clone(), next_is_real.clone());

        // 5. Chaining: at a final-round row whose successor permutation is
        //    still part of the chain, the next preimage is the current block
        //    with (value ← output, hash address += 1).
        let chain_gate = step_final.clone() * next_is_real.clone();
        for word in 0..25 {
            for limb in 0..U64_LIMBS {
                let target: AB::Expr = kn.preimage[word / 5][word % 5][limb].clone().into();
                let expected: AB::Expr = if word == VALUE_WORDS[0] || word == VALUE_WORDS[1] {
                    // Output word 0 or 1 of this permutation.
                    let out_x = word - VALUE_WORDS[0];
                    kc.a_prime_prime_prime(0, out_x, limb).into()
                } else if word == HASH_ADDR_WORD && limb == HASH_ADDR_LIMB {
                    kc.preimage[1][0][HASH_ADDR_LIMB].clone().into()
                        + AB::Expr::from_u16(256)
                } else {
                    kc.preimage[word / 5][word % 5][limb].clone().into()
                };
                builder
                    .when_transition()
                    .when(chain_gate.clone())
                    .assert_eq(target, expected);
            }
        }

        // 6. is_result placement: exactly where the (chain-enforced) hash
        //    address equals the public result address, on a final-round row
        //    of the real prefix. `d == 0 ⇔ is_result == 1` via the inverse
        //    witness.
        let d = kc.preimage[1][0][HASH_ADDR_LIMB].clone().into() - pvs[PV_RESULT_ADDR].clone();
        builder.assert_zero(is_result.clone() * d.clone());
        builder.assert_zero(is_result.clone() * (AB::Expr::ONE - step_final.clone()));
        builder.assert_zero(is_result.clone() * (AB::Expr::ONE - is_real.clone()));
        builder
            .when(step_final.clone() * is_real.clone())
            .assert_zero(is_result.clone() - (AB::Expr::ONE - d * inv));

        // 7. Result binding: on the result row, output words 0,1 equal the
        //    public chain result.
        for i in 0..VALUE_WORDS.len() {
            for limb in 0..U64_LIMBS {
                builder.when(is_result.clone()).assert_eq(
                    kc.a_prime_prime_prime(0, i, limb),
                    pvs[PV_RESULT + i * U64_LIMBS + limb].clone(),
                );
            }
        }

        // 8. The result row exists and is unique: `seen` accumulates
        //    is_result, stays boolean, and must be 1 on the last row.
        builder
            .when_transition()
            .assert_eq(next_seen, seen.clone() + next_is_result);
        builder.when_last_row().assert_one(seen);
    }
}

/// Build the widened trace and matching public values for a chain witness.
///
/// The keccak part is generated by `p3_keccak_air::generate_trace_rows`
/// (which appends zero-input padding permutations up to a power of two);
/// the four extra columns are filled here.
pub fn build_trace<F: PrimeField64>(
    witness: &ChainWitness,
    extra_capacity_bits: usize,
) -> (RowMajorMatrix<F>, Vec<F>) {
    let keccak = generate_trace_rows::<F>(witness.states.clone(), extra_capacity_bits);
    let height = keccak.height();
    let real_rows = witness.steps * NUM_ROUNDS;
    assert!(real_rows <= height);

    let result_addr_limb = result_addr_limb(witness);

    let mut values = F::zero_vec(height * NUM_COLS);
    for r in 0..height {
        let dst = &mut values[r * NUM_COLS..r * NUM_COLS + NUM_KECCAK_COLS];
        dst.copy_from_slice(&keccak.values[r * NUM_KECCAK_COLS..(r + 1) * NUM_KECCAK_COLS]);

        let is_real = r < real_rows;
        let is_result = r + 1 == real_rows;
        values[r * NUM_COLS + COL_IS_REAL] = F::from_bool(is_real);
        values[r * NUM_COLS + COL_IS_RESULT] = F::from_bool(is_result);
        values[r * NUM_COLS + COL_SEEN] = F::from_bool(r + 1 >= real_rows);

        // Inverse witness for the is-zero gadget, needed on final-round rows
        // of non-result chain permutations.
        if is_real && (r % NUM_ROUNDS == NUM_ROUNDS - 1) && !is_result {
            let step = r / NUM_ROUNDS;
            let addr_limb = ((witness.start_hash_addr + step as u32) << 8) as u16;
            let diff = F::from_u16(addr_limb) - F::from_u16(result_addr_limb);
            values[r * NUM_COLS + COL_INV] = diff.inverse();
        }
    }

    (RowMajorMatrix::new(values, NUM_COLS), public_inputs(witness))
}

/// Public values for a chain witness (see the module docs for the layout).
pub fn public_inputs<F: PrimeField64>(witness: &ChainWitness) -> Vec<F> {
    let mut pv = Vec::with_capacity(NUM_PUBLIC_VALUES);
    for word in witness.states[0] {
        for limb in 0..U64_LIMBS {
            pv.push(F::from_u16((word >> (16 * limb)) as u16));
        }
    }
    pv.push(F::from_u16(result_addr_limb(witness)));
    for i in 0..2 {
        let word = u64::from_le_bytes(witness.result[i * 8..(i + 1) * 8].try_into().unwrap());
        for limb in 0..U64_LIMBS {
            pv.push(F::from_u16((word >> (16 * limb)) as u16));
        }
    }
    assert_eq!(pv.len(), NUM_PUBLIC_VALUES);
    pv
}

/// The value of preimage word 5 limb 3 (hash-address low bytes) at the
/// result permutation.
fn result_addr_limb(witness: &ChainWitness) -> u16 {
    let addr = witness.start_hash_addr + witness.steps as u32 - 1;
    debug_assert!(addr < 256);
    (addr << 8) as u16
}
