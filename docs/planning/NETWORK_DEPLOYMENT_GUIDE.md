# 資産別ネットワークランキング & Sepolia接続ガイド

**Quantum Shield Project - マルチチェーン展開計画**

*作成日: 2025-12-26*

---

## 1. ネットワークランキング (TVL基準)

### Tier 1: 最優先展開対象

| 順位 | ネットワーク | TVL (2024末) | 特徴 | QS適合性 |
|------|-------------|-------------|------|---------|
| **1** | **Ethereum** | ~$68B | DeFi支配、最高セキュリティ | ⭐⭐⭐⭐⭐ |
| **2** | **Solana** | ~$9B | 高速、低手数料、急成長 | ⭐⭐⭐ (要追加開発) |
| **3** | **BSC** | ~$5.5B | 低Gas、アジア圏人気 | ⭐⭐⭐⭐ |
| **4** | **Arbitrum** | ~$2.5B | L2リーダー、Gas効率 | ⭐⭐⭐⭐⭐ |
| **5** | **Base** | ~$3.9B | Coinbase連携、急成長 | ⭐⭐⭐⭐⭐ |

### Tier 2: 中期展開候補

| 順位 | ネットワーク | TVL | 特徴 | QS適合性 |
|------|-------------|-----|------|---------|
| **6** | **Optimism** | ~$1B | OP Stack、安定 | ⭐⭐⭐⭐ |
| **7** | **Polygon** | ~$1.1B | 既存ユーザー多数 | ⭐⭐⭐⭐ |
| **8** | **Avalanche** | ~$1.6B | 機関投資家採用 | ⭐⭐⭐⭐ |
| **9** | **Sui** | 成長中 | Move言語、高TPS | ⭐⭐⭐ |
| **10** | **Aptos** | 成長中 | Move言語、BUIDL採用 | ⭐⭐⭐ |

---

## 2. Quantum Shield 推奨展開順序

```
Phase 2 (現在):  Ethereum Sepolia → Arbitrum Sepolia → Base Sepolia
Phase 3:         Mainnet展開 (ETH → ARB → BASE)
Phase 4:         Polygon, Optimism, Avalanche
Future:          Solana (要独自開発), Sui/Aptos (Move対応)
```

### 優先順位の根拠

| ネットワーク | 優先理由 |
|------------|---------|
| **Ethereum** | L1セキュリティ継承、量子耐性の価値最大化 |
| **Arbitrum** | Gas効率 (L1比90%↓)、DeFi統合豊富、L1セキュリティ継承 |
| **Base** | Coinbase連携、機関投資家オンボーディング容易 |
| **Polygon** | zkEVM対応、既存ユーザー基盤 |
| **Solana** | 非EVM、別アーキテクチャ要 (Phase 4以降) |

---

## 3. Sepolia テストネット接続ガイド

### 3.1 Ethereum Sepolia

**基本情報**
| 項目 | 値 |
|------|-----|
| Network Name | Ethereum Sepolia |
| Chain ID | `11155111` |
| Currency | SepoliaETH |
| Block Time | ~12秒 |

**RPC Endpoints**
```
# 公開RPC (レート制限あり)
https://rpc.sepolia.org
https://rpc2.sepolia.org

# プロバイダーRPC (API Key必要)
https://eth-sepolia.g.alchemy.com/v2/<API_KEY>
https://sepolia.infura.io/v3/<API_KEY>
```

**Faucets**
- https://faucets.chain.link/sepolia (Chainlink)
- https://www.alchemy.com/faucets/ethereum-sepolia

**MetaMask設定**
```
ネットワーク名: Ethereum Sepolia
RPC URL: https://rpc.sepolia.org
チェーンID: 11155111
通貨シンボル: ETH
エクスプローラー: https://sepolia.etherscan.io
```

### 3.2 Arbitrum Sepolia

| 項目 | 値 |
|------|-----|
| Chain ID | `421614` |
| RPC | `https://sepolia-rollup.arbitrum.io/rpc` |
| Explorer | https://sepolia.arbiscan.io |

### 3.3 Base Sepolia

| 項目 | 値 |
|------|-----|
| Chain ID | `84532` |
| RPC | `https://sepolia.base.org` |
| Explorer | https://sepolia.basescan.org |

### 3.4 Optimism Sepolia

| 項目 | 値 |
|------|-----|
| Chain ID | `11155420` |
| RPC | `https://sepolia.optimism.io` |
| Explorer | https://sepolia-optimism.etherscan.io |

---

## 4. Quantum Shield用 統合設定

### foundry.toml (推奨設定)
```toml
[profile.default]
src = "contracts/src"
out = "contracts/out"
libs = ["contracts/lib"]
solc = "0.8.24"

[rpc_endpoints]
sepolia = "${SEPOLIA_RPC_URL}"
arbitrum_sepolia = "https://sepolia-rollup.arbitrum.io/rpc"
base_sepolia = "https://sepolia.base.org"
optimism_sepolia = "https://sepolia.optimism.io"

[etherscan]
sepolia = { key = "${ETHERSCAN_API_KEY}" }
arbitrum_sepolia = { key = "${ARBISCAN_API_KEY}" }
base_sepolia = { key = "${BASESCAN_API_KEY}" }
```

### .env.example
```bash
# RPCs
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY

# Private Key (NEVER COMMIT!)
PRIVATE_KEY=0x...

# Verification
ETHERSCAN_API_KEY=your_key
ARBISCAN_API_KEY=your_key
BASESCAN_API_KEY=your_key

# Chainlink VRF (Sepolia)
VRF_COORDINATOR=0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625
VRF_KEY_HASH=0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c
```

---

## 5. 推奨デプロイ順序

1. **Ethereum Sepolia** (最優先) - L1Vault.sol デプロイ
2. **Arbitrum Sepolia** - L2Vault.sol デプロイ
3. **Base Sepolia** - Gas効率比較

---

*このドキュメントは定期的に更新されます。*
