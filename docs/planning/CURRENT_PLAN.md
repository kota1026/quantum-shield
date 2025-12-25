# Current Plan

> **Generated**: 2025-12-25 23:00 JST
> **Phase**: 2 - Security Council + Token
> **Month**: 7 / 24
> **Week**: 2

---

## 対象チェックリスト

`docs/planning/PHASE2_CHECKLIST.md` - Phase 2.1 Week 2

---

## 前回レビュー課題

> ✅ **前回PIR (PIR-P2-002 Week 1 セキュリティレビュー): PASS**
> 
> - 🔴 Critical / 🟠 High の未解決課題: **なし**
> - 全てのブロッカー解決済み

---

## 今回のスコープ

### 修正項目（レビュー課題より）

- なし（前回PIR PASS、未解決課題なし）

### 実装項目

| # | ID | タスク | 担当 | 期限 |
|---|-----|--------|------|------|
| 1 | IMPL-001 | SHA3Hasher.sol作成 | Engineer | 2025-12-30 |
| 2 | IMPL-002 | ProofCodec.sol基本構造 | Engineer | 2025-12-31 |
| 3 | IMPL-003 | NatSpecドキュメント追加 | Engineer | 2025-12-31 |

### テスト項目

| # | ID | タスク | 担当 | 期限 |
|---|-----|--------|------|------|
| 1 | TEST-001 | SHA3Hasher単体テスト (100% coverage) | QA | 2025-12-30 |
| 2 | TEST-002 | ProofCodec単体テスト | QA | 2025-12-31 |

---

## 参照ドキュメント

| 種類 | パス |
|------|------|
| 憲法 | `docs/constitution/CORE_PRINCIPLES.md` |
| シーケンス | `docs/constitution/QUANTUM_SHIELD_SEQUENCES_v2.0_REF.md` |
| ZK-STARK計画 | `docs/planning/ZK_STARK_IMPLEMENTATION_PLAN.md` |
| Gasベースライン | `docs/planning/GAS_BASELINE_P2.md` |
| Phase 2 Checklist | `docs/planning/PHASE2_CHECKLIST.md` |

---

## 成果物

| ファイル | 説明 |
|---------|------|
| `contracts/src/libraries/SHA3Hasher.sol` | SHA3-256ラッパーコントラクト |
| `contracts/src/libraries/ProofCodec.sol` | STARK証明エンコード/デコード |
| `contracts/test/SHA3HasherTest.t.sol` | SHA3Hasher単体テスト |
| `contracts/test/ProofCodecTest.t.sol` | ProofCodec単体テスト |

---

## 実行順序

### Day 1-2: SHA3Hasher.sol実装

1. SHA3Hasher.sol基本構造作成
   - 既存SHA3_256.solをラップ
   - Batch hashing機能追加
   - Gas最適化考慮
2. NatSpecドキュメント追加
3. SHA3HasherTest.t.sol作成
4. テスト実行・カバレッジ確認

### Day 3-4: ProofCodec.sol実装

1. ProofCodec.sol基本構造作成
   - STARKProof構造体定義
   - encode/decode関数実装
   - 圧縮アルゴリズム基盤
2. NatSpecドキュメント追加
3. ProofCodecTest.t.sol作成
4. テスト実行・カバレッジ確認

### Day 5: 統合確認

1. FRIVerifierとの統合テスト準備
2. ドキュメント最終整備
3. CURRENT_STATE.md更新

---

## SHA3Hasher.sol 設計概要

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./SHA3_256.sol";

/**
 * @title SHA3Hasher
 * @notice SHA3-256ラッパー - ZK-STARK証明システム用
 * @dev CP-1準拠: keccak256使用禁止、SHA3-256のみ使用
 */
library SHA3Hasher {
    /**
     * @notice 単一ハッシュ計算
     * @param data 入力データ
     * @return hash SHA3-256ハッシュ値
     */
    function hash(bytes memory data) internal pure returns (bytes32);
    
    /**
     * @notice 2要素ハッシュ（Merkle用）
     * @param left 左ノード
     * @param right 右ノード
     * @return hash 結合ハッシュ
     */
    function hashPair(bytes32 left, bytes32 right) internal pure returns (bytes32);
    
    /**
     * @notice バッチハッシュ計算（Gas最適化）
     * @param inputs 入力配列
     * @return hashes ハッシュ配列
     */
    function batchHash(bytes32[] memory inputs) internal pure returns (bytes32[] memory);
}
```

---

## ProofCodec.sol 設計概要

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title ProofCodec
 * @notice STARK証明のエンコード/デコード
 * @dev ZK-STARK証明システムのシリアライゼーション
 */
library ProofCodec {
    /// @notice STARK証明構造体
    struct STARKProof {
        bytes32 traceCommitment;
        bytes32 constraintCommitment;
        bytes32[] friCommitments;
        uint256[] friChallenges;
        uint256[] queryIndices;
        bytes32[][] merkleProofs;
        uint256[][] evaluations;
        uint256[] finalPolynomial;
    }
    
    /**
     * @notice 証明をバイト列にエンコード
     * @param proof STARK証明
     * @return encoded エンコードされたバイト列
     */
    function encode(STARKProof memory proof) internal pure returns (bytes memory);
    
    /**
     * @notice バイト列を証明にデコード
     * @param encoded エンコードされたバイト列
     * @return proof STARK証明
     */
    function decode(bytes memory encoded) internal pure returns (STARKProof memory);
    
    /**
     * @notice 証明サイズ計算
     * @param proof STARK証明
     * @return size バイト単位のサイズ
     */
    function proofSize(STARKProof memory proof) internal pure returns (uint256);
}
```

---

## Core Principles確認

- [x] CP-1: 完全量子耐性 - SHA3-256のみ使用、keccak256禁止
- [x] CP-2: Self-Custody - 違反なし（ライブラリ実装）
- [x] CP-3: Time Lock存在 - 該当なし
- [x] CP-4: Slashing存在 - 該当なし
- [x] CP-5: 透明性 - 全てオンチェーン検証可能

---

## リスク・懸念事項

| # | 懸念 | 重要度 | 対策 |
|---|------|--------|------|
| 1 | SHA3 Gas消費量 | MEDIUM | batchHash最適化で軽減 |
| 2 | ProofCodec複雑性 | LOW | 段階的実装（基本→圧縮） |
| 3 | テストカバレッジ | LOW | 100%目標、Fuzzテスト追加 |

---

## 完了条件

| 条件 | 基準 | 確認方法 |
|------|------|----------|
| SHA3Hasher実装 | コントラクト完成 | コードレビュー |
| ProofCodec基本構造 | encode/decode動作 | 単体テスト |
| テストカバレッジ | 100% | forge coverage |
| CP-1準拠 | keccak256未使用 | 静的解析 |

---

**END OF CURRENT PLAN**
