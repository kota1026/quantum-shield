//! Build script for SP1 host
//!
//! This compiles the guest program to RISC-V ELF

fn main() {
    sp1_build::build_program("../program");
}
