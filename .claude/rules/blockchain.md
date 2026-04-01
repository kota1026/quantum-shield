# Blockchain Rules

## L1: Sepolia Testnet

| Item | Value |
|------|-------|
| Network | Ethereum Sepolia |
| Chain ID | 11155111 |
| RPC URL | Set via `QS__L1_RPC_URL` env var (default: `https://rpc.sepolia.org`) |
| Vault | `0x07012aeF87C6E423c32F2f8eaF81762f63337260` |
| ProverRegistry | `0x08e1fc1A0d614bc132B48950760c7A291cCB8946` |
| SPHINCS+ Verifier | `0xD090b5A627d9bd6D96a8b5f6F504ebCa79980103` |

**CRITICAL**: Never create a new L1 deployment. Always use these existing Sepolia contracts.

## L3: Local Anvil

| Item | Value |
|------|-------|
| Network | Local Anvil |
| Chain ID | 31337 |
| Endpoint | http://localhost:8545 |
| CoreLayer | `0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0` |
| veQS | `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512` |
| RewardRouter | `0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e` |
| Governor | `0x5FC8d32690cc91D4c39d9d3abcBD16989F875707` |
| InsuranceFund | `0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9` |
| Treasury | `0xa513E6E4b8f2a923D98304ec87F64353C4D5C853` |

**Note**: L3 contracts deployed via `DeployCore.s.sol` to local Anvil. Default config uses local Anvil.

## L3: Arbitrum Sepolia (Public Testnet)

| Item | Value |
|------|-------|
| Network | Arbitrum Sepolia |
| Chain ID | 421614 |
| Endpoint | https://sepolia-rollup.arbitrum.io/rpc |
| Explorer | https://sepolia.arbiscan.io |
| CoreLayer | `0xb04F4DFe093dC80420117EDC8300f5EB6F6EDBf0` |
| veQS | `0xE72dFa97C9E452dC0b8E6aa026c910D21B20fCAE` |
| RewardRouter | `0x83E9818ead29B8884d2E49eA3c4b7d5d72824319` |
| Governor | `0xe93b8129DC3dBD48E5d78C5A4C156DD1BFa8D65B` |
| InsuranceFund | `0x9357e01Bf1ABdE8f3b32DEbaf853a0BAB9aaDfB6` |
| Treasury | `0x9Dc3249c8BDcEA8693e73e3BaA071B17Dd84bD55` |
| QSToken | `0xBD66beBE19E664dF143da54808d746192e4f2ee2` |
| GovernanceSwitch | `0x898e26853675368AC051b74809Ac5d0b02f19937` |
| SecurityCouncil | `0xE8278a98e6fe4ecBe19fC9192036C6FaCCD720FF` |
| VeQSRewardDistributor | `0x904F0c22fAB3dfB193D482593BBFAdeE2FBae2FF` |
| ProverRewardPool | `0x24A7958fa27ce160425a9D4204aFF53010e1f77E` |
| ObserverRewardPool | `0xCDb0C88d6711c29ED25BA63888B91F216Acc6784` |
| Deployer | `0xe69BB031877Cdf6c001BdAEDC0A615B40484CDC3` |
| Deployed | 2026-03-03 |

**Note**: To switch backend to L3 testnet, override env vars or copy `config/testnet.yaml.template` to `default.yaml`.

## Backend Config Reference

All values are in `src/api/api/config/default.yaml` lines 87-109.

```yaml
l1:
  mode: "testnet"  # "mock" | "testnet" | "mainnet"
```

## Private Key
- Set via `QS__L1_PRIVATE_KEY` env var (hex, without 0x prefix)
- Never hardcode in config files

## Cryptography (CP-1 Compliance)
- NIST FIPS 204 ML-DSA-65 for user signatures
- SHA3-256 for all hashing
- **FORBIDDEN**: keccak256, ECDSA, or pre-FIPS algorithms in application layer
- L1 contracts still use EVM-native keccak256/ECDSA (Solidity limitation)

## VRF Configuration
- Timeout: 300 seconds (5 minutes per SEQUENCES section 2.3)
- Polling interval: 5 seconds

## Security Parameters
- Normal time lock: 24 hours
- Emergency time lock: 7 days
- Emergency timeout: 72 hours
- Max pause duration: 72 hours
- Emergency bond minimum: 0.5 ETH
- Emergency bond percentage: 5% (500 bps)

## Docker Services
```bash
docker compose up -d postgres redis rabbitmq l3-node minio minio-init
# l1-node (Anvil fork of Sepolia) requires: docker compose --profile full up -d l1-node
```
