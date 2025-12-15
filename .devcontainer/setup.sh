#!/bin/bash
set -e

echo "=== PQC STARK Development Environment Setup ==="

# Update Rust
echo "Updating Rust toolchain..."
rustup update stable
rustup default stable

# Install SP1 toolchain
echo "Installing SP1 zkVM toolchain..."
curl -L https://sp1up.succinct.xyz | bash
export PATH="$HOME/.sp1/bin:$PATH"
sp1up

# Verify installations
echo "Verifying installations..."
rustc --version
cargo --version
sp1 --version || echo "SP1 installation will complete on first use"

# Build the main project
echo "Building zk-dilithium-ntt..."
cargo build --release

# Run tests to verify setup
echo "Running tests..."
cargo test

echo "=== Setup Complete ==="
echo ""
echo "Next steps:"
echo "1. cd sp1-bench && cargo build"
echo "2. Run benchmarks: cd sp1-bench/script && cargo run --release"
