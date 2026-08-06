//! M1: SHAKE256 permutation AIR + single WOTS+ chain verification circuit.
//!
//! See `docs/core/STARK_AIR_GAP_ANALYSIS.md` (G1, milestone M1). Builds on
//! the M0 finding that `p3-keccak-air` is the right base ("buy"): this crate
//! adds the sponge/witness layer for SPHINCS+-SHAKE-128s F-function chains
//! and an AIR wrapper that enforces the cross-permutation chaining that
//! plain keccak-air does not constrain.

pub mod air;
pub mod shake;
pub mod stark;
pub mod wots;

#[cfg(test)]
mod tests {
    use crate::stark::{prove_chain, verify_chain, FriSettings, Val};
    use crate::wots::{chain_witness, Adrs, N};
    use p3_field::PrimeCharacteristicRing;

    fn test_adrs() -> Adrs {
        let mut adrs = Adrs::new();
        adrs.set_layer(1);
        adrs.set_type(Adrs::TYPE_WOTS_HASH);
        adrs.set_key_pair(5);
        adrs.set_chain(3);
        adrs
    }

    /// Full WOTS+ chain (w - 1 = 15 F applications): prove and verify.
    #[test]
    fn prove_verify_full_chain() {
        let pk_seed = [0xA7u8; N];
        let x = [0x5Cu8; N];
        let witness = chain_witness(&pk_seed, &test_adrs(), &x, 0, 15);

        let settings = FriSettings::fast();
        let (proof, pvs) = prove_chain(&witness, settings);
        verify_chain(&proof, &pvs, settings).expect("valid proof must verify");
    }

    /// Partial chain with a nonzero starting hash address (the shape WOTS+
    /// verification actually uses: sig element at digit d, w-1-d steps).
    #[test]
    fn prove_verify_partial_chain() {
        let pk_seed = [0x01u8; N];
        let x = [0xEEu8; N];
        let witness = chain_witness(&pk_seed, &test_adrs(), &x, 3, 7);

        let settings = FriSettings::fast();
        let (proof, pvs) = prove_chain(&witness, settings);
        verify_chain(&proof, &pvs, settings).expect("valid proof must verify");
    }

    /// A proof must not verify against a tampered chain result.
    #[test]
    fn reject_wrong_result() {
        let pk_seed = [0x33u8; N];
        let x = [0x44u8; N];
        let witness = chain_witness(&pk_seed, &test_adrs(), &x, 0, 15);

        let settings = FriSettings::fast();
        let (proof, mut pvs) = prove_chain(&witness, settings);
        pvs[crate::air::PV_RESULT] += Val::ONE;
        assert!(
            verify_chain(&proof, &pvs, settings).is_err(),
            "tampered result must be rejected"
        );
    }

    /// A proof must not verify against a tampered initial state (different
    /// chain start value / seed / address).
    #[test]
    fn reject_wrong_start() {
        let pk_seed = [0x33u8; N];
        let x = [0x44u8; N];
        let witness = chain_witness(&pk_seed, &test_adrs(), &x, 0, 15);

        let settings = FriSettings::fast();
        let (proof, mut pvs) = prove_chain(&witness, settings);
        pvs[crate::air::PV_INITIAL_STATE] += Val::ONE;
        assert!(
            verify_chain(&proof, &pvs, settings).is_err(),
            "tampered initial state must be rejected"
        );
    }

    /// A proof must not verify with a shifted chain-end address (claiming a
    /// different number of F applications).
    #[test]
    fn reject_wrong_chain_length() {
        let pk_seed = [0x33u8; N];
        let x = [0x44u8; N];
        let witness = chain_witness(&pk_seed, &test_adrs(), &x, 0, 15);

        let settings = FriSettings::fast();
        let (proof, mut pvs) = prove_chain(&witness, settings);
        // Claim the chain ended one step earlier.
        pvs[crate::air::PV_RESULT_ADDR] -= Val::from_u16(256);
        assert!(
            verify_chain(&proof, &pvs, settings).is_err(),
            "wrong chain length must be rejected"
        );
    }
}
