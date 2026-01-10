# Quantum Shield Dilithium WASM Module

> FIPS 204 ML-DSA-65 (Dilithium-III) signatures for web browsers

## Overview

This WASM module provides post-quantum cryptographic signatures for the Quantum Shield bridge system. It implements NIST FIPS 204 ML-DSA-65, which provides 192-bit security against quantum computers.

## Features

- **Key Generation**: Generate Dilithium key pairs (<500ms target)
- **Signing**: Sign messages with secret key (<100ms target)
- **Verification**: Verify signatures with public key (<50ms target)
- **SHA3-256**: CP-1 compliant hash function

## Security Properties

| Property | Value |
|----------|-------|
| Algorithm | ML-DSA-65 (Dilithium-III) |
| Standard | NIST FIPS 204 |
| Security Level | NIST Level 3 (192-bit) |
| Public Key | 1,952 bytes |
| Secret Key | 4,032 bytes |
| Signature | 3,309 bytes |
| Hash | SHA3-256 |

## Building

```bash
# Install wasm-pack
curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh

# Build for web
wasm-pack build --target web --release

# Build for bundlers (webpack, etc.)
wasm-pack build --target bundler --release
```

## Usage

### Key Generation

```javascript
import init, { keygen, sign, verify } from '@quantum-shield/wasm';

await init();

// Generate key pair
const keyPair = keygen();
console.log('Public Key:', keyPair.public_key);
console.log('Public Key Hash:', keyPair.public_key_hash);
// Keep secret_key secure!
```

### Signing

```javascript
// Message to sign (hex encoded)
const message = '48656c6c6f'; // "Hello" in hex

// Sign with secret key
const signature = sign(keyPair.secret_key, message);
console.log('Signature:', signature);
```

### Verification

```javascript
// Verify signature
const result = verify(keyPair.public_key, message, signature);
if (result.valid) {
  console.log('Signature is valid!');
} else {
  console.error('Verification failed:', result.error);
}
```

## Core Principles Compliance

- ✅ **CP-1**: Uses FIPS 204 ML-DSA-65 (quantum-resistant)
- ✅ **CP-2**: Secret keys never leave client
- ✅ **CP-5**: All operations are transparent

## Forbidden Algorithms

This module does NOT use:
- ❌ ECDSA
- ❌ RSA
- ❌ secp256k1
- ❌ SHA-256 / SHA-2
- ❌ keccak256

## Testing

```bash
# Native tests
cargo test

# WASM tests (requires browser)
wasm-pack test --headless --chrome
```

## Performance Targets

| Operation | Target | Platform |
|-----------|--------|----------|
| Key Generation | <500ms | M1 Mac, Chrome |
| Signing (32B) | <100ms | M1 Mac, Chrome |
| Verification (32B) | <50ms | M1 Mac, Chrome |
| Bundle Size | <1MB | gzip compressed |

## License

MIT OR Apache-2.0
