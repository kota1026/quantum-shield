# Current Plan

> **Generated**: 2025-12-31 11:00 JST
> **Phase**: 3 - L3 + Token + 完全分散化
> **Sub-Phase**: 3.1 Foundation

---

## 対象チェックリスト

`docs/checklists/phase3.1.md`

---

## 仕様書参照（必須）

> 参照: `docs/planning/SPEC_STRATEGY_BRIDGE.md`

### 対象Sequence

| Sequence | 実装Layer | 仕様書参照箇所 |
|----------|----------|---------------|
| #1 Lock | Core | SEQUENCES §1 |
| #2 Unlock (Normal) | Core | SEQUENCES §2 |
| #5 Prover Registration | Core + Governance | SEQUENCES §5 |

### セキュリティ要件

| 要件 | 仕様書出典 | 実装方法 |
|------|----------|---------|
| SHA3-256ハッシュ | CP-1 / UNIFIED §暗号 | Phase 2 SHA3Hasher統合 |
| ZK-STARK検証 | UNIFIED §State | Phase 2 STARKVerifier統合 |
| Batch処理 | UNIFIED §1000tx/batch | Phase 2 BatchVerifier統合 |

---

## 戦略準拠確認（Phase 3）

> 参照: `docs/planning/PHASE3_STRATEGY.md`

- [x] L3スタック: 独自L3 (l3-aegis) 前提
- [x] アーキテクチャ: Modular (Core/Governance/Token Layer)
- [x] リスク緩和: 段階的TVL上限、監査計画
- [x] モード制約: Core Only → +Governance(CENTRALIZED) 許可

---

## L3基盤確認（Phase 3のL3関連タスク）

> 参照: `docs/aegis/meetings/L3_INFRASTRUCTURE_FINAL_DECISION_2025-12-28.md`

- [x] 独自4ノードBFTチェーン前提か → ✅ Track A完了
- [x] l3-aegis (Rust) の範囲内か → ✅ 180/180テストPASS
- [x] SEQUENCES v2.0に準拠しているか → ✅
- [x] CP-1/CP-5を満たしているか → ✅ Dilithium-III, SHA3-256, 禁止アルゴリズム不使用

---

## IC完全性チェック（Phase 3必須）

> 参照: `docs/aegis/QUANTUM_SHIELD_UNIFIED_SPEC_v2.0.md` §Implementation Components

### 今回スコープのIC

| IC-ID | Component | タスク | Status |
|-------|-----------|--------|--------|
| IC-1 | L3 Chain Infrastructure (4-node BFT) | L3-001〜L3-006 | ✅ COMPLETE |
| IC-2 | L3 Bridge Contract | SETUP-003, CORE-001〜003 | 🟡 In Progress |
| IC-4 | State Management (SMT) | CORE-001 | 🟡 In Progress |

### マスタ照合

- [x] 全IC-ID（IC-1〜IC-6）がPHASE3_PLANに対応セクションを持つ
- [x] 欠落ICなし（IC-1完了済み）

### タスク紐付け

- [x] 今回スコープの全タスクにIC-IDを付与した
- [x] IC-ID不要タスクは理由を明記した

---

## 前回タスク結果

> SETUP-003 Phase 2資産統合準備 完了

| 成果物 | 説明 | Status |
|--------|------|:------:|
| `docs/planning/PHASE2_INTEGRATION_PLAN.md` | Phase 2資産統合計画書 | ✅ |
| [IMPL-001] STARKVerifier統合計画策定 | Core Layer統合設計 | ✅ |
| [IMPL-002] SHA3Hasher統合計画策定 | l3-aegis整合性確認 | ✅ |
| [IMPL-003] BatchVerifier統合計画策定 | L3→L1提出フロー設計 | ✅ |
| [IMPL-004] 統合テスト計画作成 | テストスイート設計 | ✅ |

---

## 今回のスコープ

### 🎯 対象タスク: CORE-001 State Manager基盤

> **担当**: Engineer
> **IC-ID**: IC-4 (State Management)
> **目的**: Core LayerのState管理基盤を構築し、Phase 2 SparseMerkleTree/SHA3Hasherを統合

### 参照ドキュメント

| 種類 | ドキュメント | 参照セクション |
|------|------------|---------------|
| 統合計画 | `docs/planning/PHASE2_INTEGRATION_PLAN.md` | §2.4, §3, §5 |
| Modular仕様 | `docs/specs/MODULAR_ARCHITECTURE.md` | Core Layer |
| L3詳細仕様 | `docs/aegis/L3_CHAIN_SPECIFICATION.md` | §5 状態管理 |
| Phase 2 SMT | `src/libraries/SparseMerkleTree.sol` | 統合対象 |
| Phase 2 SHA3 | `src/libraries/SHA3Hasher.sol` | 統合対象 |

### 実装項目

- [ ] [IMPL-001] ICoreState インターフェース定義 (IC-4)
  - `calculateStateRoot(StateEntry[])`: State Root計算
  - `verifyInclusion(leaf, index, siblings, root)`: 包含証明検証
  - `getStateHash(key)`: 状態ハッシュ取得
  - `STATE_VERSION()`: 状態バージョン

- [ ] [IMPL-002] CoreState.sol 実装 (IC-4)
  - Phase 2 SparseMerkleTree統合
  - Phase 2 SHA3Hasher統合
  - State Root計算ロジック
  - 包含証明検証ロジック

- [ ] [IMPL-003] importパス更新 (IC-4)
  - `libraries/` → `crypto/` へのSHA3移行
  - 依存関係の整理

- [ ] [IMPL-004] l3-aegis (Rust) 整合性確認 (IC-4)
  - ドメインセパレータ統一
  - リーフ計算形式統一
  - State Root計算形式統一

### テスト項目

- [ ] [TEST-001] ICoreStateインターフェーステスト
  - インターフェース準拠確認
  - 基本機能テスト

- [ ] [TEST-002] CoreState統合テスト
  - Phase 2 SparseMerkleTreeテスト再利用
  - State Root計算検証
  - 包含証明検証

- [ ] [TEST-003] ガスベンチマーク
  - `calculateStateRoot()` ガス計測
  - `verifyInclusion()` ガス計測
  - ターゲット: Phase 2同等以下

---

## 設計詳細

### ICoreState インターフェース設計

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title ICoreState
 * @notice Core Layer State管理インターフェース
 * @dev IC-4 State Management 統合
 */
interface ICoreState {
    /// @notice 状態エントリ構造体
    struct StateEntry {
        bytes32 key;
        bytes32 value;
    }

    /// @notice State Root計算
    /// @param entries 状態エントリ配列
    /// @return State Root (SHA3-256)
    function calculateStateRoot(
        StateEntry[] calldata entries
    ) external pure returns (bytes32);

    /// @notice 包含証明検証
    /// @param leaf リーフ値
    /// @param index リーフインデックス
    /// @param siblings Merkleパス
    /// @param root 期待されるMerkleルート
    /// @return 検証結果
    function verifyInclusion(
        bytes32 leaf,
        uint256 index,
        bytes32[] calldata siblings,
        bytes32 root
    ) external pure returns (bool);

    /// @notice 状態バージョン
    function STATE_VERSION() external pure returns (uint256);
}
```

### ディレクトリ構造（PHASE2_INTEGRATION_PLAN準拠）

```
contracts/src/
├── core/
│   ├── CoreState.sol         # 今回実装 ← IC-4
│   ├── interfaces/
│   │   └── ICoreState.sol    # 今回実装
│   └── (CoreBridge.sol等は後続タスク)
├── crypto/                    # SHA3移行先
│   ├── SHA3_256.sol          # Phase 2から移行
│   └── SHA3Hasher.sol        # Phase 2から移行
└── libraries/                 # 既存（移行元）
    ├── SparseMerkleTree.sol  # 統合対象
    └── SHA3_256.sol          # 移行対象
```

---

## 実行順序

1. **インターフェース定義** (30分)
   - `src/core/interfaces/ICoreState.sol` 作成
   - 基本テスト作成

2. **ディレクトリ構造整備** (15分)
   - `src/core/` ディレクトリ作成
   - `src/crypto/` ディレクトリ作成

3. **SHA3移行** (30分)
   - `libraries/SHA3_256.sol` → `crypto/SHA3_256.sol`
   - `libraries/SHA3Hasher.sol` → `crypto/SHA3Hasher.sol`
   - importパス更新

4. **CoreState.sol実装** (60分)
   - SparseMerkleTree統合
   - SHA3Hasher統合
   - ICoreState実装

5. **テスト作成・実行** (45分)
   - 既存SparseMerkleTree.t.sol活用
   - 新規CoreState.t.sol作成
   - ガスベンチマーク

6. **l3-aegis整合性確認** (30分)
   - ドメインセパレータ確認
   - クロス検証準備

---

## Core Principles確認

- [x] CP-1: 完全量子耐性 - SHA3-256使用、禁止アルゴリズム不使用
- [x] CP-2: Self-Custody - 影響なし
- [x] CP-3: Time Lock存在 - Core Layer実装で保証
- [x] CP-4: Slashing存在 - Core Layer実装で保証
- [x] CP-5: 透明性 - State管理オンチェーン検証可能

---

## 成果物

| ファイル | 説明 | IC-ID |
|---------|------|-------|
| `src/core/interfaces/ICoreState.sol` | State管理インターフェース | IC-4 |
| `src/core/CoreState.sol` | State Manager実装 | IC-4 |
| `src/crypto/SHA3_256.sol` | SHA3-256ライブラリ (移行) | IC-4 |
| `src/crypto/SHA3Hasher.sol` | SHA3ハッシャー (移行) | IC-4 |
| `test/core/CoreState.t.sol` | 統合テスト | IC-4 |

---

## リスク・懸念事項

| # | 懸念 | 重要度 | 対策 |
|---|------|--------|------|
| 1 | SHA3移行によるimport破損 | 🟠 MEDIUM | 段階的移行、CI検証 |
| 2 | l3-aegis整合性不一致 | 🟠 MEDIUM | ドメインセパレータ仕様統一 |
| 3 | ガス回帰 | 🟡 LOW | GasSnapshot比較 |

---

## 次のタスク（CORE-001完了後）

| 優先度 | タスク | IC-ID |
|--------|--------|-------|
| 🔴 P0 | CORE-002 STARK Verifier統合 | IC-2 |
| 🟠 High | CORE-003 CP保護機構実装 | IC-2 |
| 🟠 High | PLUG-001 Governance Switch実装 | IC-2 |

---

**END OF CURRENT PLAN**
