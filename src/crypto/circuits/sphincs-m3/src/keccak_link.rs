//! Binding the producer side of the DAG argument to the Keccak table
//! (gap analysis §10.4-1).
//!
//! In the earlier PoC the producer table was standalone, so a prover could
//! invent a digest and declare it "produced". Here the producer **is** the
//! Keccak table: the tuple sent into the `HASH_DAG` interaction is read
//! directly out of `p3-keccak-air`'s output columns, so every digest offered
//! to a consumer is the output of a permutation the Keccak AIR has proven.
//!
//! ```text
//! [ KeccakCols (NUM_KECCAK_COLS) | is_digest | mult ]
//!                                     │         └─ times this digest is consumed
//!                                     └─ 1 on the final round row of a
//!                                        permutation that completes a hash call
//! ```
//!
//! The squeezed 16-byte digest is state words 0 and 1, which keccak-air
//! exposes as `output_limb(0..8)` (16-bit limbs). Two limbs recombine into
//! each 32-bit tuple element with a degree-1 expression, so the tuple matches
//! the consumer side's `digest_limbs` encoding exactly.

use core::borrow::Borrow;

use p3_air::{
    Air, AirBuilder, AirBuilderWithPublicValues, BaseAir, PairBuilder, PermutationAirBuilder,
};
use p3_field::{Field, PrimeCharacteristicRing};
use p3_keccak_air::{
    input_limb, output_limb, KeccakAir, KeccakCols, NUM_KECCAK_COLS, NUM_ROUNDS,
};
use p3_lookup::lookup_traits::{AirLookupHandler, Direction, Kind, Lookup};
use p3_matrix::dense::RowMajorMatrix;
use p3_matrix::Matrix;
use p3_uni_stark::{SubAirBuilder, SymbolicAirBuilder, SymbolicExpression};

use crate::link::{
    DIGEST_LIMBS, F, INTERACTION, MERKLE_INTERACTION, NODE_LIMBS, PUBKEY_INTERACTION,
};

/// Column holding the "this row publishes a 16-byte SPHINCS+ digest" flag.
pub const COL_IS_DIGEST: usize = NUM_KECCAK_COLS;

/// Column holding how many times the published digest is consumed.
pub const COL_MULT: usize = NUM_KECCAK_COLS + 1;

/// Column holding the "this row publishes a 32-byte registry digest" flag.
pub const COL_IS_NODE: usize = NUM_KECCAK_COLS + 2;

/// Column holding how many times the published registry digest is consumed.
pub const COL_NODE_MULT: usize = NUM_KECCAK_COLS + 3;

/// Column flagging "this row hashes a registered public key".
pub const COL_IS_PUBKEY: usize = NUM_KECCAK_COLS + 4;

/// Column holding how many times the published `(hash, PK.root)` pair is used.
pub const COL_PUBKEY_MULT: usize = NUM_KECCAK_COLS + 5;

/// Column flagging "the value at message bytes 48..64 came from another hash".
pub const COL_RECV0: usize = NUM_KECCAK_COLS + 6;

/// Column flagging "the value at message bytes 64..80 came from another hash".
pub const COL_RECV1: usize = NUM_KECCAK_COLS + 7;

/// Total width of the bound producer table.
pub const WIDTH: usize = NUM_KECCAK_COLS + 8;

/// 16-bit preimage limb where the first value argument starts.
///
/// Every SPHINCS+ tweakable hash is `SHAKE256(PK.seed ‖ ADRS ‖ values…)`, so
/// the first value begins at message byte 48 — limb 24 — and the second at
/// byte 64 — limb 32. `F` uses one value, `H` two, `T_l` the first two of
/// `l`; the rest of `T_l` spills past the first rate block and is handled by
/// the separate consumer table.
pub const VALUE0_LIMB: usize = 24;

/// 16-bit preimage limb where the second value argument starts.
pub const VALUE1_LIMB: usize = 32;

/// The Keccak table, extended to publish hash-call digests into `HASH_DAG`.
#[derive(Clone, Debug, Default)]
pub struct KeccakDigestAir {
    num_lookups: usize,
}

impl KeccakDigestAir {
    pub const fn new() -> Self {
        Self { num_lookups: 0 }
    }
}

impl<T: Field> BaseAir<T> for KeccakDigestAir {
    fn width(&self) -> usize {
        WIDTH
    }
}

impl<AB> Air<AB> for KeccakDigestAir
where
    AB: PermutationAirBuilder + PairBuilder + AirBuilderWithPublicValues,
{
    fn eval(&self, builder: &mut AB) {
        // Every permutation in the table is a correct Keccak-f[1600].
        {
            let mut sub = SubAirBuilder::<AB, KeccakAir, AB::F>::new(builder, 0..NUM_KECCAK_COLS);
            KeccakAir {}.eval(&mut sub);
        }

        let main = builder.main();
        let local = main.row_slice(0).expect("empty trace");
        let kc: &KeccakCols<AB::Var> = (&(*local)[..NUM_KECCAK_COLS]).borrow();

        let is_digest: AB::Expr = (*local)[COL_IS_DIGEST].clone().into();
        let mult: AB::Expr = (*local)[COL_MULT].clone().into();
        let is_node: AB::Expr = (*local)[COL_IS_NODE].clone().into();
        let node_mult: AB::Expr = (*local)[COL_NODE_MULT].clone().into();
        let is_pubkey: AB::Expr = (*local)[COL_IS_PUBKEY].clone().into();
        let pubkey_mult: AB::Expr = (*local)[COL_PUBKEY_MULT].clone().into();
        let recv0: AB::Expr = (*local)[COL_RECV0].clone().into();
        let recv1: AB::Expr = (*local)[COL_RECV1].clone().into();
        let step_first: AB::Expr = kc.step_flags[0].clone().into();
        let step_final: AB::Expr = kc.step_flags[NUM_ROUNDS - 1].clone().into();

        // The flags are flags.
        builder.assert_bool(is_digest.clone());
        builder.assert_bool(is_node.clone());
        builder.assert_bool(is_pubkey.clone());
        builder.assert_bool(recv0.clone());
        builder.assert_bool(recv1.clone());

        // A value argument may only be claimed on a permutation's first round
        // row. That is the only row whose preimage is the raw message: from
        // the second block onwards the preimage is the previous output XOR the
        // next message block, not the message itself.
        builder.assert_zero(recv0 * (AB::Expr::ONE - step_first.clone()));
        builder.assert_zero(recv1 * (AB::Expr::ONE - step_first));

        // A digest may only be published on a permutation's final round row —
        // that is where the output state (and hence the squeezed bytes) is
        // valid. Mid-permutation rows hold no digest.
        builder.assert_zero(is_digest.clone() * (AB::Expr::ONE - step_final.clone()));
        builder.assert_zero(is_node.clone() * (AB::Expr::ONE - step_final.clone()));
        builder.assert_zero(is_pubkey.clone() * (AB::Expr::ONE - step_final));

        // A multiplicity may only be declared where a digest is published, so
        // padding and mid-permutation rows cannot contribute to the argument.
        builder.assert_zero(mult * (AB::Expr::ONE - is_digest.clone()));
        builder.assert_zero(node_mult * (AB::Expr::ONE - is_node.clone()));
        builder.assert_zero(pubkey_mult * (AB::Expr::ONE - is_pubkey.clone()));

        // One permutation belongs to one hash call, so its output is either a
        // 16-byte SPHINCS+ digest or a 32-byte registry digest, never both.
        // (A public-key hash is a 32-byte digest, so `is_pubkey` may accompany
        // `is_node` — the leaf consumes it and the aggregation table binds it.)
        builder.assert_zero(is_digest.clone() * is_node);
        builder.assert_zero(is_digest * is_pubkey);
    }
}

impl<AB> AirLookupHandler<AB> for KeccakDigestAir
where
    AB: PermutationAirBuilder + PairBuilder + AirBuilderWithPublicValues,
{
    fn add_lookup_columns(&mut self) -> Vec<usize> {
        let idx = self.num_lookups;
        self.num_lookups += 1;
        vec![idx]
    }

    fn get_lookups(&mut self) -> Vec<Lookup<AB::F>> {
        self.num_lookups = 0;

        let symbolic = SymbolicAirBuilder::<AB::F>::new(0, WIDTH, 0, 0, 0);
        let main = symbolic.main();
        let local = main.row_slice(0).unwrap();

        let shift = SymbolicExpression::Constant(AB::F::from_u32(1 << 16));

        // element_j = low_limb + 2^16 * high_limb, i.e. bytes 4j..4j+4 of the
        // squeezed output — the same encoding as `digest_limbs`.
        let element = |j: usize| -> SymbolicExpression<AB::F> {
            let lo: SymbolicExpression<AB::F> = local[output_limb(2 * j)].into();
            let hi: SymbolicExpression<AB::F> = local[output_limb(2 * j + 1)].into();
            lo + shift.clone() * hi
        };

        // 16-byte SPHINCS+ digests.
        let digest_elements: Vec<SymbolicExpression<AB::F>> =
            (0..DIGEST_LIMBS).map(element).collect();
        let digest_lookup = AirLookupHandler::<AB>::register_lookup(
            self,
            Kind::Global(INTERACTION.to_string()),
            &[(digest_elements, local[COL_MULT].into(), Direction::Send)],
        );

        // 32-byte registry digests (leaves and Merkle nodes).
        let node_elements: Vec<SymbolicExpression<AB::F>> =
            (0..NODE_LIMBS).map(element).collect();
        let node_lookup = AirLookupHandler::<AB>::register_lookup(
            self,
            Kind::Global(MERKLE_INTERACTION.to_string()),
            &[(node_elements, local[COL_NODE_MULT].into(), Direction::Send)],
        );

        // (public-key hash, PK.root) — the only interaction that exposes a
        // hash *input*. The registered key is `PK.seed ‖ PK.root`, 32 bytes,
        // so `PK.root` is preimage bytes 16..32 = 16-bit limbs 8..16.
        let mut pubkey_elements: Vec<SymbolicExpression<AB::F>> =
            (0..NODE_LIMBS).map(element).collect();
        pubkey_elements.extend((0..DIGEST_LIMBS).map(|j| {
            let lo: SymbolicExpression<AB::F> = local[input_limb(8 + 2 * j)].into();
            let hi: SymbolicExpression<AB::F> = local[input_limb(8 + 2 * j + 1)].into();
            lo + shift.clone() * hi
        }));
        let pubkey_lookup = AirLookupHandler::<AB>::register_lookup(
            self,
            Kind::Global(PUBKEY_INTERACTION.to_string()),
            &[(pubkey_elements, local[COL_PUBKEY_MULT].into(), Direction::Send)],
        );

        // The value arguments this hash consumes, read from its own preimage.
        //
        // This is what makes the DAG argument bite. A separate consumer table
        // only proves "these values were produced somewhere" — its rows are
        // free witness, so a prover can write whatever balances. Receiving
        // from the preimage instead ties the claim to an actual hash *input*
        // that the Keccak AIR constrains.
        let preimage_element = |limb: usize| -> SymbolicExpression<AB::F> {
            let lo: SymbolicExpression<AB::F> = local[input_limb(limb)].into();
            let hi: SymbolicExpression<AB::F> = local[input_limb(limb + 1)].into();
            lo + shift.clone() * hi
        };

        let value0: Vec<SymbolicExpression<AB::F>> = (0..DIGEST_LIMBS)
            .map(|j| preimage_element(VALUE0_LIMB + 2 * j))
            .collect();
        let value0_lookup = AirLookupHandler::<AB>::register_lookup(
            self,
            Kind::Global(INTERACTION.to_string()),
            &[(value0, local[COL_RECV0].into(), Direction::Receive)],
        );

        let value1: Vec<SymbolicExpression<AB::F>> = (0..DIGEST_LIMBS)
            .map(|j| preimage_element(VALUE1_LIMB + 2 * j))
            .collect();
        let value1_lookup = AirLookupHandler::<AB>::register_lookup(
            self,
            Kind::Global(INTERACTION.to_string()),
            &[(value1, local[COL_RECV1].into(), Direction::Receive)],
        );

        vec![
            digest_lookup,
            node_lookup,
            pubkey_lookup,
            value0_lookup,
            value1_lookup,
        ]
    }
}

/// Widen a `p3-keccak-air` trace with the two linking columns.
///
/// `digest_of[p]` is `Some(mult)` when permutation `p` completes a 16-byte
/// SPHINCS+ hash call whose digest is consumed `mult` times; `node_of[p]` is
/// the same for 32-byte registry digests. Both are `None` for mid-hash blocks
/// and padding, and a permutation may appear in at most one of them.
pub fn widen_keccak_trace(
    keccak: &RowMajorMatrix<F>,
    digest_of: &[Option<u32>],
    node_of: &[Option<u32>],
    pubkey_of: &[Option<u32>],
    recv_of: &[[bool; 2]],
) -> RowMajorMatrix<F> {
    // `generate_trace_rows` pads to a power-of-two row count, which is not a
    // multiple of NUM_ROUNDS in general — the trailing chunk is a partial
    // padding permutation. Real permutations always come first, so indexing
    // final-round rows by `r % NUM_ROUNDS == NUM_ROUNDS - 1` stays correct.
    let height = keccak.height();

    let mut values = F::zero_vec(height * WIDTH);
    for r in 0..height {
        values[r * WIDTH..r * WIDTH + NUM_KECCAK_COLS]
            .copy_from_slice(&keccak.values[r * NUM_KECCAK_COLS..(r + 1) * NUM_KECCAK_COLS]);

        // Consumed value arguments are read on the first round row, where the
        // preimage still holds the raw message.
        if r % NUM_ROUNDS == 0 {
            if let Some(flags) = recv_of.get(r / NUM_ROUNDS) {
                if flags[0] {
                    values[r * WIDTH + COL_RECV0] = F::ONE;
                }
                if flags[1] {
                    values[r * WIDTH + COL_RECV1] = F::ONE;
                }
            }
        }

        // Digests live on each permutation's final round row.
        if r % NUM_ROUNDS == NUM_ROUNDS - 1 {
            let perm = r / NUM_ROUNDS;
            let short = digest_of.get(perm).copied().flatten();
            let long = node_of.get(perm).copied().flatten();
            assert!(
                short.is_none() || long.is_none(),
                "permutation {perm} cannot publish both a 16- and a 32-byte digest"
            );
            if let Some(mult) = short {
                values[r * WIDTH + COL_IS_DIGEST] = F::ONE;
                values[r * WIDTH + COL_MULT] = F::from_u32(mult);
            }
            if let Some(mult) = long {
                values[r * WIDTH + COL_IS_NODE] = F::ONE;
                values[r * WIDTH + COL_NODE_MULT] = F::from_u32(mult);
            }
            if let Some(mult) = pubkey_of.get(perm).copied().flatten() {
                values[r * WIDTH + COL_IS_PUBKEY] = F::ONE;
                values[r * WIDTH + COL_PUBKEY_MULT] = F::from_u32(mult);
            }
        }
    }

    RowMajorMatrix::new(values, WIDTH)
}
