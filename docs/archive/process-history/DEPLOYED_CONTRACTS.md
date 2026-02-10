# Deployed Contracts - Quantum Shield

## Network: Sepolia Testnet (Chain ID: 11155111)

### Deployment Information

| Property | Value |
|----------|-------|
| **Deployment Date** | 2026-02-03 |
| **Deployer Address** | `0xe69BB031877Cdf6c001BdAEDC0A615B40484CDC3` |
| **Network** | Sepolia Testnet |
| **Chain ID** | 11155111 |
| **Broadcast File** | `contracts/broadcast/Deploy.s.sol/11155111/run-latest.json` |

---

## Deployed Contracts

### 1. SPHINCSVerifier

| Property | Value |
|----------|-------|
| **Address** | [`0x655122b1e816c262168B7f6625346d1914142214`](https://sepolia.etherscan.io/address/0x655122b1e816c262168B7f6625346d1914142214) |
| **Tx Hash** | `0x66ce894c6989bdc3edcd59908828e5520c8e2164ae349461fd289c7f1988aea4` |
| **Verification** | ✅ Verified |
| **Description** | SPHINCS+ post-quantum signature verification |

### 2. STARKVerifier

| Property | Value |
|----------|-------|
| **Address** | [`0x2f2f36fAA504b79D26c5240CCd13AE5c1A08bf90`](https://sepolia.etherscan.io/address/0x2f2f36fAA504b79D26c5240CCd13AE5c1A08bf90) |
| **Tx Hash** | `0xec01eafbe1856f704d34fdf152c017eeb10946a2f57924173e770ff5ebb548b8` |
| **Verification** | ✅ Verified |
| **Description** | STARK zero-knowledge proof verification |

### 3. L1Vault

| Property | Value |
|----------|-------|
| **Address** | [`0xEF851795bc8DE8e0d40781761a0b5B618fED6dE0`](https://sepolia.etherscan.io/address/0xEF851795bc8DE8e0d40781761a0b5B618fED6dE0) |
| **Tx Hash** | `0x7546f6edf0b4b5f9a5a2d055c43d7db8784206bd4e731146a2aa39a2a2d959f5` |
| **Constructor Args** | `owner: 0xe69BB031877Cdf6c001BdAEDC0A615B40484CDC3`, `sphincsVerifier: 0x655122b1e816c262168B7f6625346d1914142214` |
| **Verification** | ✅ Verified |
| **Description** | Main vault for quantum-safe asset locking |

---

## Contract Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        L1Vault                                   │
│  (Main vault contract for quantum-safe asset management)         │
│                                                                  │
│  - Lock/Unlock ETH and ERC20 tokens                             │
│  - 24-hour unlock delay for security                            │
│  - Emergency unlock with SPHINCS+ signature                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     SPHINCSVerifier                              │
│  (Post-quantum signature verification)                           │
│                                                                  │
│  - SPHINCS+ NIST standard implementation                        │
│  - Quantum-resistant digital signatures                         │
│  - Used for emergency unlock authorization                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      STARKVerifier                               │
│  (Zero-knowledge proof verification)                             │
│                                                                  │
│  - STARK proof system implementation                            │
│  - Scalable transparent arguments of knowledge                  │
│  - Used for batch verification and privacy                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Compiler Settings

| Setting | Value |
|---------|-------|
| **Solidity Version** | 0.8.20 |
| **Optimizer** | Enabled |
| **Optimizer Runs** | 200 |
| **EVM Version** | paris |
| **Via IR** | true |

---

## Environment Configuration

Required `.env` variables for deployment:

```bash
# Network
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY

# Deployment
PRIVATE_KEY=0x...

# Verification
ETHERSCAN_API_KEY=YOUR_API_KEY
```

---

## Verification Commands

```bash
# SPHINCSVerifier (already verified)
forge verify-contract 0x655122b1e816c262168B7f6625346d1914142214 SPHINCSVerifier \
  --chain sepolia \
  --etherscan-api-key $ETHERSCAN_API_KEY

# STARKVerifier (already verified)
forge verify-contract 0x2f2f36fAA504b79D26c5240CCd13AE5c1A08bf90 STARKVerifier \
  --chain sepolia \
  --etherscan-api-key $ETHERSCAN_API_KEY

# L1Vault (requires constructor args)
forge verify-contract 0xEF851795bc8DE8e0d40781761a0b5B618fED6dE0 L1Vault \
  --chain sepolia \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  --constructor-args $(cast abi-encode "constructor(address,address)" \
    0xe69BB031877Cdf6c001BdAEDC0A615B40484CDC3 \
    0x655122b1e816c262168B7f6625346d1914142214) \
  --compiler-version 0.8.20 \
  --num-of-optimizations 200 \
  --via-ir \
  --evm-version paris
```

---

## Security Notes

1. **Deployer Key**: The deployer private key should be securely stored and not committed to version control
2. **Ownership**: L1Vault owner is set to the deployer address - consider transferring to a multisig
3. **Upgrade Path**: Current contracts are not upgradeable - any fixes require new deployment

---

## Related Documentation

- [API Specification](/docs/specs/API_SPECIFICATION.yaml)
- [Data Model](/docs/specs/DATA_MODEL.md)
- [Implementation Guide](/docs/specs/IMPLEMENTATION_GUIDE.md)
