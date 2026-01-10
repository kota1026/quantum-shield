//! Build script for linking pq-crystals dilithium reference implementation
//!
//! This compiles the pq-crystals/dilithium reference C code and links it
//! for use via FFI in NIST KAT verification.

use std::env;
use std::path::Path;

fn main() {
    // Only build the C library if the pq-crystals source exists
    let pq_crystals_path = Path::new("../../pq-crystals-dilithium/ref");

    if pq_crystals_path.exists() {
        println!("cargo:rerun-if-changed=../../pq-crystals-dilithium/ref");

        // Compile the pq-crystals reference implementation for Dilithium3
        cc::Build::new()
            .file("../../pq-crystals-dilithium/ref/sign.c")
            .file("../../pq-crystals-dilithium/ref/packing.c")
            .file("../../pq-crystals-dilithium/ref/polyvec.c")
            .file("../../pq-crystals-dilithium/ref/poly.c")
            .file("../../pq-crystals-dilithium/ref/ntt.c")
            .file("../../pq-crystals-dilithium/ref/reduce.c")
            .file("../../pq-crystals-dilithium/ref/rounding.c")
            .file("../../pq-crystals-dilithium/ref/fips202.c")
            .file("../../pq-crystals-dilithium/ref/symmetric-shake.c")
            .define("DILITHIUM_MODE", "3")
            .flag("-O3")
            .flag("-fomit-frame-pointer")
            .warnings(false)
            .compile("dilithium3_ref");

        println!("cargo:rustc-cfg=feature=\"pq_crystals_ffi\"");
    } else {
        println!("cargo:warning=pq-crystals-dilithium not found, FFI KAT tests will be disabled");
    }
}
