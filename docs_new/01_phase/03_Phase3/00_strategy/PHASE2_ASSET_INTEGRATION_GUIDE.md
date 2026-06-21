# Phase 2 Asset Integration Guide

> **Version**: 1.0.0  
> **Created**: 2025-12-28  
> **Status**: Approved  
> **Purpose**: Phase 2資産をl3-aegis Core Layerに統合するためのガイド

---

## 1. 概要

### 1.1 目的

Phase 2で開発・テスト済みの暗号資産を、Phase 3のl3-aegis Core Layerに統合します。

### 1.2 対象資産

| 資産 | Phase 2パス | 統合先 | 状態 |
|------|------------|--------|------|
| STARKVerifier | `contracts/src/STARKVerifier.sol` | `l3-aegis/src/core/` | 🟢 Ready |
| SHA3Hasher | `contracts/src/libraries/SHA3Hasher.sol` | `l3-aegis/src/core/libraries/` | 🟢 Ready |
| BatchVerifier | `contracts/src/BatchVerifier.sol` | `l3-aegis/src/core/` | 🟢 Ready |
| SHA3_256 | `contracts/src/libraries/SHA3_256.sol` | `l3-aegis/src/core/libraries/` | 🟢 Ready |
| OptimizedField | `contracts/src/lib/OptimizedField.sol` | `l3-aegis/src/core/lib/` | 🟢 Ready |
| ProofCodec | `contracts/src/libraries/ProofCodec.sol` | `l3-aegis/src/core/libraries/` | 🟢 Ready |

---

## 2. 依存関係グラフ

```
┌─────────────────────────────────────────────────────────────────┐
│                    l3-aegis Core Layer                          │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    CoreBridge.sol                        │   │
│  │  (ICoreLayer implementation)                             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│              ┌───────────────┼───────────────┐                 │
│              ▼               ▼               ▼                 │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐       │
│  │ STARKVerifier │  │ BatchVerifier │  │ StateManager  │       │
│  └───────┬───────┘  └───────┬───────┘  └───────┬───────┘       │
│          │                  │                  │                │
│          └────────┬─────────┴─────────┬────────┘               │
│                   ▼                   ▼                        │
│          ┌───────────────┐   ┌───────────────┐                 │
│          │  SHA3Hasher   │   │ ProofCodec    │                 │
│          └───────┬───────┘   └───────────────┘                 │
│                  ▼                                              │
│          ┌───────────────┐                                     │
│          │   SHA3_256    │                                     │
│          └───────────────┘                                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. 統合方式

### 3.1 推奨方式: 直接コピー + インポートパス修正

**理由:**
- 依存関係の明確化
- l3-aegis独立テスト可能
- Phase 2凍結後の影響回避

### 3.2 コピー手順

```bash
# 1. ライブラリをコピー
mkdir -p l3-aegis/src/core/libraries
cp contracts/src/libraries/SHA3_256.sol l3-aegis/src/core/libraries/
cp contracts/src/libraries/SHA3Hasher.sol l3-aegis/src/core/libraries/
cp contracts/src/libraries/ProofCodec.sol l3-aegis/src/core/libraries/
cp contracts/src/libraries/SparseMerkleTree.sol l3-aegis/src/core/libraries/

# 2. ユーティリティライブラリをコピー
mkdir -p l3-aegis/src/core/lib
cp contracts/src/lib/OptimizedField.sol l3-aegis/src/core/lib/
cp contracts/src/lib/SharedMerkle.sol l3-aegis/src/core/lib/
cp contracts/src/lib/ProofCompressor.sol l3-aegis/src/core/lib/
cp contracts/src/lib/ProofDecoder.sol l3-aegis/src/core/lib/

# 3. メインコントラクトをコピー
cp contracts/src/STARKVerifier.sol l3-aegis/src/core/
cp contracts/src/BatchVerifier.sol l3-aegis/src/core/
cp contracts/src/FRIVerifier.sol l3-aegis/src/core/
```

### 3.3 インポートパス修正

```solidity
// Before (Phase 2)
import {SHA3_256} from "./libraries/SHA3_256.sol";
import {SHA3Hasher} from "./libraries/SHA3Hasher.sol";

// After (l3-aegis)
import {SHA3_256} from "./libraries/SHA3_256.sol";
import {SHA3Hasher} from "./libraries/SHA3Hasher.sol";
```

---

## 4. インターフェース互換性

### 4.1 ICoreLayer要件

| 要件 | STARKVerifier対応 | 備考 |
|------|------------------|------|
| `verifyState()` | `verifyProof()` 使用 | アダプター不要 |
| SHA3-256 | ✅ 対応済み | CP-1準拠 |
| ZK-STARK | ✅ 対応済み | 128-bit security |

### 4.2 アダプターパターン（必要な場合）

```solidity
// l3-aegis/src/core/adapters/STARKVerifierAdapter.sol
contract STARKVerifierAdapter {
    STARKVerifier public immutable verifier;
    
    constructor(address _verifier) {
        verifier = STARKVerifier(_verifier);
    }
    
    /// @notice ICoreLayer.verifyState() implementation
    function verifyState(
        bytes32 stateRoot,
        bytes calldata proof
    ) external view returns (bool) {
        ProofCodec.STARKProof memory starkProof = abi.decode(
            proof,
            (ProofCodec.STARKProof)
        );
        return verifier.verifyProof(starkProof, stateRoot);
    }
}
```

---

## 5. テスト戦略

### 5.1 テスト階層

| 階層 | テスト | 場所 |
|------|--------|------|
| Unit | 各コントラクト単体 | `l3-aegis/test/unit/` |
| Integration | Layer間連携 | `l3-aegis/test/integration/` |
| E2E | 全フロー | `l3-aegis/test/e2e/` |

### 5.2 リグレッションテスト

Phase 2テストをl3-aegisにも適用：

```bash
# Phase 2テスト実行（参照用）
cd contracts && forge test -vvv

# l3-aegisテスト実行
cd l3-aegis && forge test -vvv
```

---

## 6. CP-1準拠確認

### 6.1 確認チェックリスト

- [x] SHA3-256のみ使用（keccak256なし）
- [x] ZK-STARK証明検証
- [x] 禁止アルゴリズム未使用
- [x] Goldilocks field使用

### 6.2 静的解析確認

```bash
# keccak256使用箇所の確認
grep -r "keccak256" l3-aegis/src/core/
# 期待結果: 出力なし

# Slither分析
cd l3-aegis && slither .
```

---

## 7. マイグレーション手順

### 7.1 事前準備

1. Phase 2資産の凍結確認
2. 全テストパス確認
3. ガスベンチマーク記録

### 7.2 実行手順

```bash
# Step 1: ブランチ作成
git checkout -b feature/phase3-asset-integration dev/phase2-native-stark

# Step 2: ファイルコピー
./scripts/migrate-phase2-assets.sh

# Step 3: インポートパス修正
./scripts/fix-import-paths.sh

# Step 4: ビルド確認
cd l3-aegis && forge build

# Step 5: テスト実行
forge test -vvv

# Step 6: コミット
git add .
git commit -m "feat(phase3): Migrate Phase 2 assets to l3-aegis Core Layer"
```

---

## 8. リスクと対策

| リスク | 重要度 | 対策 |
|--------|--------|------|
| インポートパス不整合 | 🟠 Medium | 自動修正スクリプト |
| Phase 2変更による影響 | 🟠 Medium | コピー方式で分離 |
| ガス効率低下 | 🟡 Low | ベンチマーク継続 |
| テスト漏れ | 🟠 Medium | Phase 2テスト移植 |

---

## 9. 参照ドキュメント

| ドキュメント | パス |
|------------|------|
| CURRENT_PLAN | `docs/planning/CURRENT_PLAN.md` |
| SPEC_STRATEGY_BRIDGE | `docs/planning/SPEC_STRATEGY_BRIDGE.md` |
| MODULAR_ARCHITECTURE | `docs/specs/MODULAR_ARCHITECTURE.md` |
| ICoreLayer | `l3-aegis/src/interfaces/ICoreLayer.sol` |

---

**END OF INTEGRATION GUIDE**
