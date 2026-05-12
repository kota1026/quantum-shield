use alloy_sol_types::sol;

pub mod kat;

sol! {
    /// Public values committed by the SP1 program: a single byte indicating
    /// whether the embedded ML-DSA-65 signature verified.
    struct PublicValuesStruct {
        bool verified;
    }
}
