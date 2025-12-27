# Sepolia Testnet Deployment Report

**Date**: 2025-12-27  
**Network**: Ethereum Sepolia Testnet (Chain ID: 11155111)  
**Phase**: 2.3 Gas Optimization  
**Deployer**: `0xe69BB031877Cdf6c001BdAEDC0A615B40484CDC3`

---

## Deployed Contracts

| Contract | Address | TX Hash | Gas Used |
|----------|---------|---------|----------|
| AIRConstraints | `0x49a1f515A10447197078b7282e8d8C1AD658b149` | [0xaef5e1ae...](https://sepolia.etherscan.io/tx/0xaef5e1ae8c12aa3f7c0d0d61f71292b95d8b68e7bd22012becce99ef020462cc) | TBD |
| ConstraintEvaluator | `0x5fbffa05d45E85F052Ac9bD0DA30a7C2fb070c81` | [0x2c80c7b1...](https://sepolia.etherscan.io/tx/0x2c80c7b16b821633eac595c9b74f688a653be364e0e21db62382fe53511612d5) | TBD |
| STARKVerifier | `0x93f550917E45b6BDA45dE4fE3e0bAB09FfC38848` | [0xa04e1bd8...](https://sepolia.etherscan.io/tx/0xa04e1bd882e2ca623b5a101b216620749726f4e8f905a88c9678b1cfa29bb7ce) | TBD |
| SPHINCSVerifier | `0xd5F3cEA1fE247fff7e15cBA00C1f804D2Bd126f3` | [0x31e641d8...](https://sepolia.etherscan.io/tx/0x31e641d8cb92083b568905365173016720204520077253376273afa5d5a32f6b) | TBD |
| L1Vault | `0xAdEB23203bf5C45e3CbD3406122aED067E41255D` | [0xe15b1925...](https://sepolia.etherscan.io/tx/0xe15b192508733c006406aa486a1784ada539d5742367915712f9d7ef42dff383) | TBD |

---

## Contract Links (Etherscan)

- **AIRConstraints**: https://sepolia.etherscan.io/address/0x49a1f515A10447197078b7282e8d8C1AD658b149
- **ConstraintEvaluator**: https://sepolia.etherscan.io/address/0x5fbffa05d45E85F052Ac9bD0DA30a7C2fb070c81
- **STARKVerifier**: https://sepolia.etherscan.io/address/0x93f550917E45b6BDA45dE4fE3e0bAB09FfC38848
- **SPHINCSVerifier**: https://sepolia.etherscan.io/address/0xd5F3cEA1fE247fff7e15cBA00C1f804D2Bd126f3
- **L1Vault**: https://sepolia.etherscan.io/address/0xAdEB23203bf5C45e3CbD3406122aED067E41255D

---

## Constructor Arguments

### L1Vault
```
_securityCouncil: 0xe69BB031877Cdf6c001BdAEDC0A615B40484CDC3
_sphincsVerifier: 0xd5F3cEA1fE247fff7e15cBA00C1f804D2Bd126f3
```

---

## Configuration

| Parameter | Value |
|-----------|-------|
| Security Council | Deployer (for testing) |
| SPHINCS+ Verifier | Integrated |
| Full Verification | Enabled |
| TVL Cap | 400 ETH |
| Normal Time Lock | 24 hours |
| Emergency Time Lock | 7 days |

---

## Deployment Environment

| Item | Value |
|------|-------|
| Foundry Version | Latest |
| Solidity Version | 0.8.20 |
| Optimizer | Enabled (200 runs) |
| EVM Version | Paris |
| RPC Provider | Alchemy |

---

## Verification Status

| Contract | Verified |
|----------|----------|
| AIRConstraints | ⏳ Pending |
| ConstraintEvaluator | ⏳ Pending |
| STARKVerifier | ⏳ Pending |
| SPHINCSVerifier | ⏳ Pending |
| L1Vault | ⏳ Pending |

---

## Next Steps

1. [ ] Verify contracts on Etherscan
2. [ ] Execute test transactions (lock/unlock)
3. [ ] Measure real-world gas consumption
4. [ ] Create GAS_BASELINE_SEPOLIA.md with measurements
5. [ ] Deploy BatchVerifier and SharedMerkle

---

## Notes

This is the first deployment of Quantum Shield to a public testnet. All contracts are CP-1 compliant with SHA3-256 for quantum resistance.

The deployment uses the deployer address as security council for testing purposes. In production, this would be a multisig.
