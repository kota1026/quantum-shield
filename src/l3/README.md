# Aegis L3 Chain

Quantum-resistant Layer 3 blockchain for Quantum Shield's cryptographic proof generation and verification.

## Overview

Aegis L3 is a purpose-built blockchain that handles computationally intensive quantum-resistant cryptographic operations, offloading them from L1 (Ethereum) to achieve gas efficiency while maintaining full CP-1 compliance.

### Key Features

- **CP-1 Compliant Cryptography**: SHA3-256 (FIPS 202) + Dilithium-III (FIPS 204) only
- **PBFT Consensus**: 4-node BFT with f=1 fault tolerance
- **Sparse Merkle Trees**: For efficient state proofs
- **ZK-STARK Integration**: Native proof generation and verification
- **RocksDB Storage**: High-performance key-value storage

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Aegis L3 Chain                           │
├─────────────────────────────────────────────────────────────┤
│  aegis-cli       │  Command-line interface                  │
│  aegis-node      │  Full node implementation                │
├──────────────────┼──────────────────────────────────────────┤
│  aegis-consensus │  PBFT consensus engine                   │
│  aegis-network   │  P2P networking (TLS 1.3 + mTLS)        │
│  aegis-storage   │  RocksDB-backed persistence              │
├──────────────────┼──────────────────────────────────────────┤
│  aegis-core      │  Block, transaction, state management    │
│  aegis-crypto    │  SHA3-256, Dilithium-III                │
│  aegis-smt       │  Sparse Merkle Tree implementation       │
│  aegis-types     │  Common types and traits                 │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

### Prerequisites

- Rust 1.75+
- Docker & Docker Compose (for testnet)
- RocksDB development libraries

### Build

```bash
cd l3-aegis
cargo build --release
```

### Run Tests

```bash
cargo test
```

### Run Clippy

```bash
cargo clippy -- -D warnings
```

## Docker Testnet

Deploy a 4-node BFT testnet using Docker Compose:

```bash
cd docker

# Generate keys for each node (if not already generated)
# TODO: aegis-cli keygen implementation

# Build and start the testnet
docker-compose build
docker-compose up -d

# Check node status
docker-compose logs -f
```

### Node Ports

| Node   | P2P Port | RPC Port | Metrics Port |
|--------|----------|----------|--------------|
| node0  | 30303    | 8545     | 9090         |
| node1  | 30304    | 8546     | 9091         |
| node2  | 30305    | 8547     | 9092         |
| node3  | 30306    | 8548     | 9093         |

### Network Topology

```
         ┌─────────┐
         │  node0  │ 172.28.0.10
         └────┬────┘
              │
    ┌─────────┼─────────┐
    │         │         │
┌───┴───┐ ┌───┴───┐ ┌───┴───┐
│ node1 │ │ node2 │ │ node3 │
└───────┘ └───────┘ └───────┘
172.28.0.11  .12      .13
```

## Configuration

Node configuration files are located in `docker/config/`:

- `node0.toml` - Primary validator
- `node1.toml` - Validator
- `node2.toml` - Validator
- `node3.toml` - Validator

### Key Configuration Options

```toml
[crypto]
hash_algorithm = "sha3-256"           # FIPS 202 compliant
signature_algorithm = "dilithium-iii"  # FIPS 204 compliant

[consensus]
algorithm = "pbft"
block_time_ms = 5000      # 5 second blocks
view_timeout_ms = 10000   # 10 second view timeout
```

## CP-1 Compliance

This implementation strictly adheres to Core Principle 1 (CP-1):

| Requirement | Implementation |
|-------------|----------------|
| Hash Algorithm | SHA3-256 (FIPS 202) |
| Signature Algorithm | Dilithium-III (FIPS 204) |
| Prohibited | keccak256, ECDSA, RSA, SHA-256, secp256k1 |

## Crate Structure

| Crate | Description |
|-------|-------------|
| `aegis-types` | Common types: Hash, NodeId, Block, Transaction, Error |
| `aegis-core` | State management, block builder, execution engine |
| `aegis-crypto` | SHA3-256 hasher, Dilithium-III signatures |
| `aegis-smt` | Sparse Merkle Tree for state proofs |
| `aegis-network` | libp2p-based P2P with TLS 1.3 |
| `aegis-consensus` | PBFT consensus with PrePrepare/Prepare/Commit |
| `aegis-storage` | RocksDB backend with versioned storage |
| `aegis-node` | Full node: consensus + network + storage |
| `aegis-cli` | CLI: node start, keygen, status commands |

## Development

### Adding a New Crate

1. Create crate directory in `crates/`
2. Add to workspace members in `Cargo.toml`
3. Implement with CP-1 compliance
4. Add tests

### CI/CD

GitHub Actions workflow (`.github/workflows/l3-aegis.yml`) runs:
- Rust build and test
- Clippy linting
- CP-1 compliance checks (keccak256/ECDSA detection)
- Solidity tests (if applicable)

## License

Copyright © 2024 Project Aegis. All rights reserved.

## Related Documents

- [L3 Chain Specification](../docs/aegis/L3_CHAIN_SPECIFICATION.md)
- [Core Principles](../docs/constitution/CORE_PRINCIPLES.md)
- [Current Plan](../docs/planning/CURRENT_PLAN.md)
