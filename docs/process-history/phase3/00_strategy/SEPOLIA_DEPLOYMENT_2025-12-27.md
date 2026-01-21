# Sepolia Testnet Deployment Report

**Date**: 2025-12-27  
**Network**: Ethereum Sepolia Testnet (Chain ID: 11155111)  
**Phase**: 2.3 Gas Optimization  
**Deployer**: `0xe69BB031877Cdf6c001BdAEDC0A615B40484CDC3`

---

## Deployed Contracts

| Contract | Address | TX Hash |
|----------|---------|---------|
| AIRConstraints | `0x49a1f515A10447197078b7282e8d8C1AD658b149` | [0xaef5e1ae...](https://sepolia.etherscan.io/tx/0xaef5e1ae8c12aa3f7c0d0d61f71292b95d8b68e7bd22012becce99ef020462cc) |
| ConstraintEvaluator | `0x5fbffa05d45E85F052Ac9bD0DA30a7C2fb070c81` | [0x2c80c7b1...](https://sepolia.etherscan.io/tx/0x2c80c7b16b821633eac595c9b74f688a653be364e0e21db62382fe53511612d5) |
| STARKVerifier | `0x93f550917E45b6BDA45dE4fE3e0bAB09FfC38848` | [0xa04e1bd8...](https://sepolia.etherscan.io/tx/0xa04e1bd882e2ca623b5a101b216620749726f4e8f905a88c9678b1cfa29bb7ce) |
| SPHINCSVerifier | `0xd5F3cEA1fE247fff7e15cBA00C1f804D2Bd126f3` | [0x31e641d8...](https://sepolia.etherscan.io/tx/0x31e641d8cb92083b568905365173016720204520077253376273afa5d5a32f6b) |
| L1Vault | `0xAdEB23203bf5C45e3CbD3406122aED067E41255D` | [0xe15b1925...](https://sepolia.etherscan.io/tx/0xe15b192508733c006406aa486a1784ada539d5742367915712f9d7ef42dff383) |
| SharedMerkle | `0x956139A615687fA9e0F85e9ff520129f4C3C8574` | [0x336c9c97...](https://sepolia.etherscan.io/tx/0x336c9c971ea1c17b1b13de9164e5efdf5f9adf272911cabe5d7ceac6e571d654) |
| BatchVerifier | `0xD264ac2CB8548B76d95E9267ACADDb42CE608730` | [0xe3dcb779...](https://sepolia.etherscan.io/tx/0xe3dcb77973678f27fd16ee50d91edf163fc39e06f90e20c2b7f2dbaf699dd17d) |

---

## Contract Links (Etherscan)

- **AIRConstraints**: https://sepolia.etherscan.io/address/0x49a1f515A10447197078b7282e8d8C1AD658b149
- **ConstraintEvaluator**: https://sepolia.etherscan.io/address/0x5fbffa05d45E85F052Ac9bD0DA30a7C2fb070c81
- **STARKVerifier**: https://sepolia.etherscan.io/address/0x93f550917E45b6BDA45dE4fE3e0bAB09FfC38848
- **SPHINCSVerifier**: https://sepolia.etherscan.io/address/0xd5F3cEA1fE247fff7e15cBA00C1f804D2Bd126f3
- **L1Vault**: https://sepolia.etherscan.io/address/0xAdEB23203bf5C45e3CbD3406122aED067E41255D
- **SharedMerkle**: https://sepolia.etherscan.io/address/0x956139A615687fA9e0F85e9ff520129f4C3C8574
- **BatchVerifier**: https://sepolia.etherscan.io/address/0xD264ac2CB8548B76d95E9267ACADDb42CE608730

---

## Constructor Arguments

### L1Vault
```
_securityCouncil: 0xe69BB031877Cdf6c001BdAEDC0A615B40484CDC3
_sphincsVerifier: 0xd5F3cEA1fE247fff7e15cBA00C1f804D2Bd126f3
```

### BatchVerifier
```
_sharedMerkle: 0x956139A615687fA9e0F85e9ff520129f4C3C8574
```

---

## Gas Measurements

### L1Vault.lock()
- **Gas Used**: 4,319,591
- **TX Hash**: [0x297ebb7a...](https://sepolia.etherscan.io/tx/0x297ebb7aff9bfaa7cae5a4737c828d553865ff4b21709413c88f922d79737f11)
- **Lock ID**: `0xeba42771fa25f9bb35d5b5d5430629f9c9825a8cf1eea6bb53f03fe3397cb4c7`

See [GAS_BASELINE_SEPOLIA.md](./GAS_BASELINE_SEPOLIA.md) for detailed analysis.

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
| SharedMerkle | ⏳ Pending |
| BatchVerifier | ⏳ Pending |

---

## Completed Tasks

- [x] Deploy core contracts (AIRConstraints, ConstraintEvaluator, STARKVerifier, SPHINCSVerifier)
- [x] Deploy L1Vault with SPHINCS+ integration
- [x] Deploy SharedMerkle library
- [x] Deploy BatchVerifier with SharedMerkle integration
- [x] Execute test lock transaction
- [x] Measure L1Vault.lock() gas consumption

## Next Steps

1. [ ] Verify contracts on Etherscan
2. [ ] Measure BatchVerifier gas consumption
3. [ ] Compare individual vs batch verification gas
4. [ ] Complete Phase 2.3 PIR

---

## Notes

This is the first deployment of Quantum Shield to a public testnet. All contracts are CP-1 compliant with SHA3-256 for quantum resistance.

The deployment uses the deployer address as security council for testing purposes. In production, this would be a multisig.

**Deployment completed**: 7 contracts successfully deployed to Sepolia.
