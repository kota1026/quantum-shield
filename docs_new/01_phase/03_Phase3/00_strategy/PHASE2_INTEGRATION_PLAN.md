# Phase 2 資産統合計画書

> **Document Version**: 1.0
> **Created**: 2025-12-31
> **Author**: Engineer
> **Task**: SETUP-003 Phase 2資産統合準備
> **IC-ID**: IC-2 (L3 Bridge Contract), IC-4 (State Management)

---

## 1. 概要

### 1.1 目的

本ドキュメントは、Phase 2で実装されたSolidityコンポーネントをPhase 3のModular Architecture Core Layerに統合するための計画を定義します。

### 1.2 スコープ

| 統合対象 | IC-ID | 統合先Layer |
|---------|-------|-------------|
| STARKVerifier | IC-2 | Core Layer |
| SHA3Hasher / SHA3_256 | IC-4 | Core Layer |
| BatchVerifier | IC-2 | Core Layer |
| State Management (SMT) | IC-4 | Core Layer |

### 1.3 参照ドキュメント

| ドキュメント | パス |
|------------|------|
| Modular Architecture | `docs/specs/MODULAR_ARCHITECTURE.md` |
| SPEC_STRATEGY_BRIDGE | `docs/planning/SPEC_STRATEGY_BRIDGE.md` |
| L3_CHAIN_SPECIFICATION | `docs/aegis/L3_CHAIN_SPECIFICATION.md` |
| CORE_PRINCIPLES | `docs/constitution/CORE_PRINCIPLES.md` |

---

## 2. Phase 2資産一覧

### 2.1 STARKVerifier関連 (IC-2)

| ファイル | サイズ | 役割 | 依存関係 |
|---------|--------|------|---------|
| `src/STARKVerifier.sol` | 22,370 bytes | STARK証明検証 | SHA3_256, SHA3Hasher, ProofCodec, FRIVerifier, OptimizedField, ProofCompressor, ProofDecoder |
| `src/FRIVerifier.sol` | 12,854 bytes | FRI検証 | SHA3Hasher, OptimizedField |
| `src/stark/AIRConstraints.sol` | 15,251 bytes | AIR制約評価 | OptimizedField |
| `src/stark/ConstraintEvaluator.sol` | 14,758 bytes | 制約評価器 | AIRConstraints |
| `src/lib/OptimizedFRI.sol` | 14,941 bytes | FRI最適化 | OptimizedField |
| `src/lib/OptimizedField.sol` | 13,542 bytes | 有限体演算 | - |
| `src/lib/ProofCompressor.sol` | 13,890 bytes | 証明圧縮 | - |
| `src/lib/ProofDecoder.sol` | 14,153 bytes | 証明デコード | ProofCodec |

**主要インターフェース**:
- `verifyProof(STARKProof, bytes32 publicInput)`: STARK証明検証
- `verifyProofFull(STARKProof, bytes32, uint256 domainSize)`: 完全検証
- `verifyTraceEvaluationAtIndex(leaf, index, siblings, root)`: Merkle検証
- `fieldAdd/Mul/Exp/Inverse`: 有限体演算

### 2.2 SHA3Hasher関連 (IC-4)

| ファイル | サイズ | 役割 | 依存関係 |
|---------|--------|------|---------|
| `src/libraries/SHA3_256.sol` | 15,035 bytes | SHA3-256コア実装 | - |
| `src/libraries/SHA3Hasher.sol` | 4,940 bytes | ハッシュラッパー | SHA3_256 |
| `src/libraries/SHAKE256.sol` | 11,846 bytes | SHAKE256 XOF | SHA3_256 |

**主要インターフェース**:
- `SHA3Hasher.hash(bytes)`: データハッシュ
- `SHA3Hasher.hashPair(bytes32, bytes32)`: ペアハッシュ
- `SHA3_256.hash(bytes)`: コアSHA3-256

### 2.3 BatchVerifier関連 (IC-2)

| ファイル | サイズ | 役割 | 依存関係 |
|---------|--------|------|---------|
| `src/BatchVerifier.sol` | 9,746 bytes | バッチ検証 | SHA3Hasher, SharedMerkle, ProofCodec |
| `src/lib/SharedMerkle.sol` | 10,024 bytes | 共有Merkleパス | SHA3Hasher |
| `src/libraries/ProofCodec.sol` | 9,355 bytes | 証明エンコード | - |

**主要インターフェース**:
- `verifyBatch(leaves, indices, siblings, root)`: バッチMerkle検証
- `verifySTARKBatch(proofs, publicInputs)`: バッチSTARK検証
- `MAX_BATCH_SIZE`: 100
- `MIN_BATCH_SIZE`: 2

### 2.4 State Management関連 (IC-4)

| ファイル | サイズ | 役割 | 依存関係 |
|---------|--------|------|---------|
| `src/libraries/SparseMerkleTree.sol` | 15,645 bytes | Sparse Merkle Tree | SHA3Hasher |
| `src/libraries/StateRootCalculator.sol` | 8,560 bytes | State Root計算 | SHA3Hasher, SparseMerkleTree |

**主要インターフェース**:
- `verify(leaf, index, siblings, root)`: 包含証明検証
- `calculateStateRoot(entries)`: State Root計算

---

## 3. Core Layer統合設計 (IMPL-001, IMPL-003)

### 3.1 ディレクトリ構造

```
contracts/src/
├── core/                          # Core Layer (常時ON)
│   ├── CoreBridge.sol            # SEQ#1-4, #3' 実装
│   ├── CoreVerifier.sol          # STARKVerifier統合
│   ├── CoreBatch.sol             # BatchVerifier統合
│   └── interfaces/
│       ├── ICoreVerifier.sol
│       ├── ICoreBatch.sol
│       └── ICoreState.sol
├── crypto/                        # 暗号ライブラリ (共通)
│   ├── SHA3_256.sol              # (既存をリネーム)
│   ├── SHA3Hasher.sol            # (既存をリネーム)
│   └── SHAKE256.sol              # (既存をリネーム)
├── stark/                         # STARK関連 (既存維持)
│   ├── AIRConstraints.sol
│   ├── ConstraintEvaluator.sol
│   └── (その他)
├── lib/                           # ライブラリ (既存維持)
│   ├── OptimizedField.sol
│   ├── OptimizedFRI.sol
│   ├── ProofCompressor.sol
│   ├── ProofDecoder.sol
│   └── SharedMerkle.sol
├── libraries/                     # 既存ライブラリ (移行対象)
│   └── (Phase 3で crypto/ へ移行)
├── governance/                    # Governance Layer (Pluggable)
│   └── (Phase 3.2で実装)
└── token/                         # Token Layer (Pluggable)
    └── (Phase 3.2で実装)
```

### 3.2 STARKVerifier統合インターフェース

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ProofCodec} from "../libraries/ProofCodec.sol";

/**
 * @title ICoreVerifier
 * @notice Core Layer STARK検証インターフェース
 * @dev IC-2 L3 Bridge Contract 統合
 */
interface ICoreVerifier {
    /// @notice STARK証明検証
    /// @param proof STARK証明構造体
    /// @param publicInput 公開入力（状態ハッシュ等）
    /// @return 検証結果
    function verifyProof(
        ProofCodec.STARKProof calldata proof,
        bytes32 publicInput
    ) external view returns (bool);

    /// @notice バッチトレース評価検証
    /// @param leaves リーフ値配列
    /// @param indices インデックス配列
    /// @param siblings Merkleパス配列
    /// @param expectedRoot 期待されるMerkleルート
    /// @return validCount 有効な証明数
    function verifyTraceEvaluationsBatch(
        bytes32[] calldata leaves,
        uint256[] calldata indices,
        bytes32[][] calldata siblings,
        bytes32 expectedRoot
    ) external pure returns (uint256 validCount);

    /// @notice セキュリティレベル取得
    /// @return 128 (ビット)
    function securityLevel() external pure returns (uint256);
}
```

### 3.3 BatchVerifier統合インターフェース

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ProofCodec} from "../libraries/ProofCodec.sol";

/**
 * @title ICoreBatch
 * @notice Core Layer バッチ検証インターフェース
 * @dev IC-2 L3 Bridge Contract 統合
 */
interface ICoreBatch {
    /// @notice バッチMerkle証明検証
    /// @param leaves リーフ値配列
    /// @param indices インデックス配列
    /// @param allSiblings Merkleパス2D配列
    /// @param expectedRoot 期待されるMerkleルート
    /// @return validCount 有効な証明数
    function verifyBatch(
        bytes32[] calldata leaves,
        uint256[] calldata indices,
        bytes32[][] calldata allSiblings,
        bytes32 expectedRoot
    ) external view returns (uint256 validCount);

    /// @notice STARK証明バッチ検証
    /// @param proofs STARK証明配列
    /// @param publicInputs 公開入力配列
    /// @return validCount 有効な証明数
    function verifySTARKBatch(
        ProofCodec.STARKProof[] calldata proofs,
        bytes32[] calldata publicInputs
    ) external view returns (uint256 validCount);

    /// @notice 最大バッチサイズ
    function MAX_BATCH_SIZE() external pure returns (uint256);
}
```

---

## 4. インターフェース互換性分析

### 4.1 完全互換

| コンポーネント | 現状 | 統合後 | 変更 |
|---------------|------|--------|------|
| SHA3_256 | ライブラリ | ライブラリ | パス変更のみ |
| SHA3Hasher | ライブラリ | ライブラリ | パス変更のみ |
| OptimizedField | ライブラリ | ライブラリ | 変更なし |
| ProofCodec | ライブラリ | ライブラリ | 変更なし |

### 4.2 ラッパー必要

| コンポーネント | 現状 | 統合後 | 必要な対応 |
|---------------|------|--------|-----------|
| STARKVerifier | コントラクト | CoreVerifier経由 | ICoreVerifier実装 |
| BatchVerifier | コントラクト | CoreBatch経由 | ICoreBatch実装 |
| SparseMerkleTree | ライブラリ | CoreState経由 | ICoreState実装 |

### 4.3 修正必要箇所

| ファイル | 修正内容 | 理由 |
|---------|---------|------|
| STARKVerifier.sol | import パス更新 | crypto/への移行 |
| BatchVerifier.sol | import パス更新 | crypto/への移行 |
| FRIVerifier.sol | import パス更新 | crypto/への移行 |
| L1Vault.sol | ICoreVerifier依存注入 | Modular対応 |

---

## 5. l3-aegis (Rust) との整合性 (IMPL-002)

### 5.1 SHA3-256整合性

| 項目 | Solidity (Phase 2) | Rust (l3-aegis) | 整合性 |
|------|-------------------|------------------|:------:|
| アルゴリズム | FIPS 202 SHA3-256 | sha3クレート | ✅ |
| ドメインセパレータ | `QS_STARK_*` | 同一値使用予定 | ⚠️ 要調整 |
| 出力サイズ | 256-bit | 256-bit | ✅ |

**対応策**: l3-aegisでSolidity側と同一のドメインセパレータを使用

### 5.2 State Root計算整合性

| 項目 | Solidity (Phase 2) | Rust (l3-aegis) | 整合性 |
|------|-------------------|------------------|:------:|
| Merkle Tree | Binary | Binary (aegis-smt) | ✅ |
| ハッシュ関数 | SHA3-256 | SHA3-256 | ✅ |
| リーフ計算 | `hash(domain, value, index)` | 同一形式予定 | ⚠️ 要調整 |

**対応策**: SPEC_STRATEGY_BRIDGE §3に従い、L3で計算したState RootをL1で検証

### 5.3 クロス検証フロー

```
L3 (l3-aegis / Rust)                L1 (Solidity)
┌─────────────────────┐             ┌─────────────────────┐
│ 1. トランザクション受信  │             │                     │
│ 2. SHA3-256でState計算 │             │                     │
│ 3. BFT署名収集        │             │                     │
│ 4. State Root生成    │─────────────▶│ 5. SPHINCS+署名検証  │
│                     │   L1提出     │ 6. State Root記録   │
│                     │             │ 7. 必要に応じてSTARK検証│
└─────────────────────┘             └─────────────────────┘
```

---

## 6. ガスコスト分析 (IMPL-002)

### 6.1 現状のガスコスト

> 参照: 03_impl.md §9 ガスターゲット設定ガイドライン

| 操作 | 現状ガス | 備考 |
|------|---------|------|
| SHA3-256 (32bytes) | ~1,000,000 gas | Pure Solidityプリコンパイルなし |
| SHA3-256 (256bytes) | ~3,000,000 gas | 入力サイズに比例 |
| Merkle Hash Pair | ~1,500,000 gas | ドメインセパレータ含む |
| STARK verify() 構造検証 | ~300,000 gas | 完全検証はさらに増加 |
| modExp (precompile) | ~787 gas | 大幅改善済み |
| modInverse | ~1,969 gas | EEA最適化済み |

### 6.2 ガス課題と対策

| 課題 | 影響 | 対策 |
|------|------|------|
| SHA3-256高コスト | L1検証が高額 | L3で重い計算、L1は軽量検証 |
| Merkle操作スケール | 大規模バッチ困難 | バッチサイズ制限 (MAX=100) |
| ブロックガスリミット | 30M gas制限 | 分割処理設計 |

### 6.3 L3→L1 アーキテクチャによる解決

```
L3 (重い暗号操作)                    L1 (軽量検証)
┌─────────────────────┐             ┌─────────────────────┐
│ SHA3-256ハッシュ     │             │ SPHINCS+署名検証のみ │
│ State Root計算      │             │ (~$25/検証)         │
│ バッチ集約          │─────────────▶│                     │
│ STARK証明生成(将来) │   署名付き   │ State Root記録      │
│                     │   State     │ イベント発行        │
└─────────────────────┘             └─────────────────────┘
```

---

## 7. 統合テスト計画 (IMPL-004, TEST-001〜003)

### 7.1 既存テスト再利用計画

| テストファイル | 再利用 | 修正内容 |
|---------------|:------:|---------|
| STARKVerifier.t.sol | ✅ | importパス更新 |
| STARKVerifierE2E.t.sol | ✅ | CoreVerifier経由に変更 |
| BatchVerifierTest.t.sol | ✅ | importパス更新 |
| SHA3_256.t.sol | ✅ | パス更新のみ |
| SHA3HasherTest.t.sol | ✅ | パス更新のみ |
| GasRegressionTest.t.sol | ✅ | ターゲット値確認 |
| SparseMerkleTree.t.sol | ✅ | CoreState経由に変更 |

### 7.2 新規統合テスト

| テスト | 説明 | 優先度 |
|--------|------|:------:|
| `CoreVerifierIntegration.t.sol` | ICoreVerifierインターフェース検証 | 🔴 High |
| `CoreBatchIntegration.t.sol` | ICoreBatchインターフェース検証 | 🔴 High |
| `ModularArchitecture.t.sol` | Layer間依存性検証 | 🟠 Medium |
| `CrossLayerGas.t.sol` | Layer横断ガスベンチマーク | 🟡 Low |

### 7.3 ガスベンチマーク計画

| テスト対象 | ベースライン | ターゲット | 検証方法 |
|-----------|-------------|-----------|---------|
| CoreVerifier.verifyProof() | 300K gas | <400K gas | GasSnapshot |
| CoreBatch.verifyBatch(10) | TBD | <40%削減 | 比較テスト |
| SHA3Hasher.hash(32) | ~1M gas | 維持 | GasSnapshot |

### 7.4 l3-aegis統合テスト（将来）

| テスト | 説明 | 前提条件 |
|--------|------|---------|
| E2E State Sync | L3→L1 State Root検証 | L3ノード稼働 |
| Cross-chain Proof | 証明クロス検証 | CORE-001〜003完了 |

---

## 8. 実装スケジュール

### 8.1 タスク依存関係

```
SETUP-003 (本タスク) ────▶ CORE-001 ────▶ CORE-002 ────▶ CORE-003
      │                        │              │              │
      │                        ▼              ▼              ▼
      │                   State Manager  STARK統合    CP保護機構
      │
      ▼
  PHASE2_INTEGRATION_PLAN.md 作成
```

### 8.2 推奨実装順序

| 順序 | タスク | 期間 | 前提条件 |
|:----:|--------|------|---------|
| 1 | ディレクトリ再構成 | 2h | なし |
| 2 | インターフェース定義 (ICoreVerifier, ICoreBatch) | 4h | 順序1 |
| 3 | importパス更新 | 2h | 順序2 |
| 4 | 既存テスト修正 | 4h | 順序3 |
| 5 | 新規統合テスト作成 | 8h | 順序4 |
| 6 | ガスベンチマーク実行 | 4h | 順序5 |

---

## 9. リスクと対策

| # | リスク | 重要度 | 対策 |
|---|--------|:------:|------|
| 1 | importパス変更による既存テスト破損 | 🔴 High | 段階的移行、CI検証 |
| 2 | インターフェース互換性問題 | 🟠 Medium | 既存シグネチャ維持 |
| 3 | ガス回帰 | 🟡 Low | GasRegressionTestで検出 |
| 4 | l3-aegisとの整合性不一致 | 🟠 Medium | ドメインセパレータ仕様統一 |

---

## 10. CP準拠確認

| CP | 内容 | 統合後の状態 |
|----|------|-------------|
| CP-1 | 完全量子耐性 | ✅ SHA3-256, SPHINCS+継続使用 |
| CP-2 | Self-Custody | ✅ 影響なし |
| CP-3 | Time Lock存在 | ✅ Core Layer実装で保証 |
| CP-4 | Slashing存在 | ✅ Core Layer実装で保証 |
| CP-5 | 透明性 | ✅ 全操作オンチェーン検証可能 |

---

## 11. 成果物チェックリスト

- [x] [IMPL-001] STARKVerifier統合計画策定
- [x] [IMPL-002] SHA3Hasher統合計画策定
- [x] [IMPL-003] BatchVerifier統合計画策定
- [x] [IMPL-004] 統合テスト計画作成
- [x] [TEST-001] Phase 2コンポーネント互換性テスト計画
- [x] [TEST-002] Core Layer統合テスト計画
- [x] [TEST-003] ガスベンチマーク計画

---

## 12. 次のステップ

本計画書をもとに、以下のタスクを順次実行:

1. **CORE-001 State Manager基盤** (IC-4)
   - ICoreStateインターフェース実装
   - SparseMerkleTree統合

2. **CORE-002 STARK Verifier統合** (IC-2)
   - ICoreVerifierインターフェース実装
   - STARKVerifier統合

3. **CORE-003 CP保護機構実装** (IC-2)
   - ConstitutionLock実装
   - CP-1〜5の強制機構

---

**END OF PHASE 2 INTEGRATION PLAN**
