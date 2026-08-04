//! Native BabyBear Poseidon2 permutation and 2-to-1 compression, replicating
//! the exact evaluation order of `p3-poseidon2-air`'s `eval` from the *same*
//! `RoundConstants`, so the permutations the AIR proves are byte-identical to
//! the ones this module computes when building the Merkle path (the M1
//! reconstruction-matches-reference pattern).

use p3_baby_bear::{BabyBear, GenericPoseidon2LinearLayersBabyBear as LL};
use p3_field::{Field, PrimeCharacteristicRing};
use p3_poseidon2::GenericPoseidon2LinearLayers;
use p3_poseidon2_air::RoundConstants;
use rand::rngs::SmallRng;
use rand::{Rng, SeedableRng};

pub const WIDTH: usize = 16;
pub const CHUNK: usize = 8;
pub const SBOX_DEGREE: u64 = 7;
pub const SBOX_REGISTERS: usize = 1;
pub const HALF_FULL_ROUNDS: usize = 4;
pub const PARTIAL_ROUNDS: usize = 20;

pub type Constants = RoundConstants<BabyBear, WIDTH, HALF_FULL_ROUNDS, PARTIAL_ROUNDS>;

/// Deterministic constants shared by the AIR and this reference.
pub fn constants() -> (Constants, [[BabyBear; WIDTH]; HALF_FULL_ROUNDS], [BabyBear; PARTIAL_ROUNDS], [[BabyBear; WIDTH]; HALF_FULL_ROUNDS]) {
    let mut rng = SmallRng::seed_from_u64(0x5051_5253);
    let beginning: [[BabyBear; WIDTH]; HALF_FULL_ROUNDS] =
        core::array::from_fn(|_| core::array::from_fn(|_| rng.random()));
    let partial: [BabyBear; PARTIAL_ROUNDS] = core::array::from_fn(|_| rng.random());
    let ending: [[BabyBear; WIDTH]; HALF_FULL_ROUNDS] =
        core::array::from_fn(|_| core::array::from_fn(|_| rng.random()));
    (RoundConstants::new(beginning, partial, ending), beginning, partial, ending)
}

fn sbox(x: BabyBear) -> BabyBear {
    x.exp_u64(SBOX_DEGREE)
}

/// The Poseidon2 permutation, mirroring poseidon2-air's `eval` exactly.
pub fn permute(
    mut state: [BabyBear; WIDTH],
    beginning: &[[BabyBear; WIDTH]; HALF_FULL_ROUNDS],
    partial: &[BabyBear; PARTIAL_ROUNDS],
    ending: &[[BabyBear; WIDTH]; HALF_FULL_ROUNDS],
) -> [BabyBear; WIDTH] {
    LL::external_linear_layer(&mut state);
    for rc in beginning.iter() {
        for i in 0..WIDTH {
            state[i] = sbox(state[i] + rc[i]);
        }
        LL::external_linear_layer(&mut state);
    }
    for &rc in partial.iter() {
        state[0] = sbox(state[0] + rc);
        LL::internal_linear_layer(&mut state);
    }
    for rc in ending.iter() {
        for i in 0..WIDTH {
            state[i] = sbox(state[i] + rc[i]);
        }
        LL::external_linear_layer(&mut state);
    }
    state
}

/// 2-to-1 truncated compression: node = permute(left || right)[0..CHUNK].
pub fn compress(
    left: [BabyBear; CHUNK],
    right: [BabyBear; CHUNK],
    b: &[[BabyBear; WIDTH]; HALF_FULL_ROUNDS],
    p: &[BabyBear; PARTIAL_ROUNDS],
    e: &[[BabyBear; WIDTH]; HALF_FULL_ROUNDS],
) -> ([BabyBear; CHUNK], [BabyBear; WIDTH]) {
    let mut input = [BabyBear::ZERO; WIDTH];
    input[..CHUNK].copy_from_slice(&left);
    input[CHUNK..].copy_from_slice(&right);
    let out = permute(input, b, p, e);
    let mut node = [BabyBear::ZERO; CHUNK];
    node.copy_from_slice(&out[..CHUNK]);
    (node, input)
}
