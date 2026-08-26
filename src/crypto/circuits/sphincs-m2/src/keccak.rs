//! Keccak-f[1600], the permutation under SHAKE256/SHA3-256/keccak256.
//!
//! Implemented here rather than pulled from `p3-keccak` so the verification
//! core has **no external dependencies at all**: every Plonky3 crate depends
//! on `p3-field`, which depends on `tracing`, which needs atomic
//! compare-and-swap — unavailable on `riscv32im`, the target zkVM guests
//! compile for. See `docs/core/STARK_AIR_GAP_ANALYSIS.md` §20.
//!
//! Equivalence with `p3_keccak::KeccakF` — the permutation the AIR proves —
//! is pinned by a test, so the guest and the circuit cannot drift.
//!
//! Under the `sp1-precompile` feature the software permutation is replaced by
//! SP1's `syscall_keccak_permute`. Keeping the dependency-free version as the
//! default is what makes that swap a one-line change; §21 measured the cost of
//! *not* doing it at 19,657 cycles per permutation.

/// Round constants (FIPS 202 Table 1).
const RC: [u64; 24] = [
    0x0000000000000001,
    0x0000000000008082,
    0x800000000000808a,
    0x8000000080008000,
    0x000000000000808b,
    0x0000000080000001,
    0x8000000080008081,
    0x8000000000008009,
    0x000000000000008a,
    0x0000000000000088,
    0x0000000080008009,
    0x000000008000000a,
    0x000000008000808b,
    0x800000000000008b,
    0x8000000000008089,
    0x8000000000008003,
    0x8000000000008002,
    0x8000000000000080,
    0x000000000000800a,
    0x800000008000000a,
    0x8000000080008081,
    0x8000000000008080,
    0x0000000080000001,
    0x8000000080008008,
];

/// Rotation offsets for rho, in the order pi visits the lanes.
const ROT: [u32; 24] = [
    1, 3, 6, 10, 15, 21, 28, 36, 45, 55, 2, 14, 27, 41, 56, 8, 25, 43, 62, 18, 39, 61, 20, 44,
];

/// Lane permutation for pi.
const PI: [usize; 24] = [
    10, 7, 11, 17, 18, 3, 5, 16, 8, 21, 24, 4, 15, 23, 19, 13, 12, 2, 20, 14, 22, 9, 6, 1,
];

/// Apply Keccak-f[1600] in place. The state is 25 lanes in `x + 5y` order.
///
/// In a zkVM guest built with `sp1-precompile`, this is a single syscall the
/// prover handles natively rather than ~19.7K RISC-V instructions.
#[cfg(feature = "sp1-precompile")]
pub fn keccak_f(state: &mut [u64; 25]) {
    unsafe {
        sp1_lib::syscall_keccak_permute(state as *mut [u64; 25]);
    }
}

/// Apply Keccak-f[1600] in place. The state is 25 lanes in `x + 5y` order.
#[cfg(not(feature = "sp1-precompile"))]
pub fn keccak_f(state: &mut [u64; 25]) {
    for round in 0..24 {
        // theta
        let mut c = [0u64; 5];
        for x in 0..5 {
            for y in 0..5 {
                c[x] ^= state[5 * y + x];
            }
        }
        for x in 0..5 {
            let d = c[(x + 4) % 5] ^ c[(x + 1) % 5].rotate_left(1);
            for y in 0..5 {
                state[5 * y + x] ^= d;
            }
        }

        // rho and pi
        let mut last = state[1];
        for i in 0..24 {
            let tmp = state[PI[i]];
            state[PI[i]] = last.rotate_left(ROT[i]);
            last = tmp;
        }

        // chi
        for y in 0..5 {
            let row: [u64; 5] = [
                state[5 * y],
                state[5 * y + 1],
                state[5 * y + 2],
                state[5 * y + 3],
                state[5 * y + 4],
            ];
            for x in 0..5 {
                state[5 * y + x] = row[x] ^ (!row[(x + 1) % 5] & row[(x + 2) % 5]);
            }
        }

        // iota
        state[0] ^= RC[round];
    }
}

#[cfg(all(test, not(feature = "sp1-precompile")))]
mod tests {
    use super::*;
    use p3_symmetric::Permutation;

    /// The guest's permutation must be bit-identical to the one the AIR
    /// proves. Without this the circuit and the verifier could silently
    /// diverge.
    #[test]
    fn matches_plonky3_keccak() {
        for seed in 0..8u64 {
            let mut ours = [0u64; 25];
            for (i, lane) in ours.iter_mut().enumerate() {
                *lane = seed
                    .wrapping_mul(0x9E3779B97F4A7C15)
                    .wrapping_add(i as u64)
                    .wrapping_mul(0xBF58476D1CE4E5B9);
            }
            let mut theirs = ours;

            keccak_f(&mut ours);
            p3_keccak::KeccakF.permute_mut(&mut theirs);

            assert_eq!(ours, theirs, "seed {seed}");
        }
    }

    /// The all-zero state is the most common starting point in the sponge.
    #[test]
    fn matches_plonky3_keccak_on_zero_state() {
        let mut ours = [0u64; 25];
        let mut theirs = ours;
        keccak_f(&mut ours);
        p3_keccak::KeccakF.permute_mut(&mut theirs);
        assert_eq!(ours, theirs);
    }
}
