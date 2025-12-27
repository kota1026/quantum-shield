# Current Plan

> **Generated**: 2025-12-27 19:00 JST
> **Phase**: 2 - Security Council + Token
> **Week**: 9 (Phase 2.3 Gas Optimization 開始)

---

## 対象チェックリスト

- `docs/planning/PHASE2_3_PLAN.md`
- `docs/planning/PHASE2_CHECKLIST.md` (Phase 2.3セクション)

---

## 前回レビュー課題

> CURRENT_STATE.md より取得 - **前回レビュー課題なし**

| # | 重要度 | 課題 | 対策 |
|---|--------|------|------|
| - | ✅ | 全課題解消済み | PIR-P2-007 PASS |

**備考**: Week 8は全タスク完了、PIR-P2-007 PASS判定。ブロッカーなし。

---

## 🚧 継続的な懸念事項

| # | 懸念 | 重要度 | 今回の対応 |
|---|------|--------|------------|
| 1 | SHA3_256 Gas消費量 (~2.2M/lock) | 🟡 MEDIUM | ← **今回の最適化対象** |
| 2 | ZK-STARK実装の複雑性 | 🟡 MEDIUM | 段階的実装継続 |
| 3 | 外部監査のスケジュール | 🟡 MEDIUM | RFP草案作成済み |

---

## 今回のスコープ

### 実装項目

- [ ] [IMPL-008] BatchVerifier.sol設計ドキュメント作成
- [ ] [IMPL-009] BatchVerifier.sol v0.1 基本実装
- [ ] [IMPL-010] SharedMerkle.sol Merkleパス共有実装

### テスト項目

- [ ] [TEST-023] BatchVerifierTest.t.sol 基本テスト (15+)
- [ ] [TEST-024] Gasベンチマークテスト（バッチ10件で40%削減確認）

### ドキュメント項目

- [ ] [DOC-002] BATCH_VERIFICATION_SPEC.md 作成

---

## 参照ドキュメント

| 種別 | パス |
|------|------|
| Active Plan | `docs/planning/PHASE2_3_PLAN.md` |
| Checklist | `docs/planning/PHASE2_CHECKLIST.md` |
| Gas Baseline | `docs/planning/GAS_BASELINE_P2.md` |
| ZK-STARK計画 | `docs/planning/ZK_STARK_IMPLEMENTATION_PLAN.md` |
| 憲法 | `docs/constitution/CORE_PRINCIPLES.md` |

---

## 成果物

| ファイル | 説明 |
|---------|------|
| `contracts/src/BatchVerifier.sol` | バッチ証明検証コントラクト v0.1 |
| `contracts/src/lib/SharedMerkle.sol` | Merkleパス共有ライブラリ |
| `contracts/test/BatchVerifierTest.t.sol` | BatchVerifier単体テスト |
| `contracts/test/GasOptimizationTest.t.sol` | Gasベンチマークテスト |
| `docs/planning/BATCH_VERIFICATION_SPEC.md` | バッチ検証設計ドキュメント |

---

## 実行順序

### Day 1-2: 設計フェーズ

1. 既存STARKVerifier、FRIVerifier、ProofCodecのインターフェース確認
2. バッチ検証のアーキテクチャ設計
3. `BATCH_VERIFICATION_SPEC.md` 作成
4. インターフェース定義

### Day 3-4: 基本実装フェーズ

5. `BatchVerifier.sol` スケルトン作成
6. バッチ証明データ構造実装
7. 基本検証ロジック実装
8. 単体テスト作成開始

### Day 5-6: Merkle共有実装フェーズ

9. `SharedMerkle.sol` 作成
10. Merkleパス共有アルゴリズム実装
11. BatchVerifierへの統合
12. Gas削減効果測定

### Day 7: テスト & 検証フェーズ

13. `BatchVerifierTest.t.sol` 15+テスト完成
14. `GasOptimizationTest.t.sol` ベンチマーク実装
15. 40%削減目標の検証
16. テストスイート全体実行（628+ tests）

---

## 成功基準

| # | 基準 | 目標値 |
|---|------|--------|
| 1 | BatchVerifier.sol基本動作 | ✅ 動作確認 |
| 2 | バッチ検証Gas削減 | ≥40%削減（10件バッチ） |
| 3 | 新規テスト数 | ≥15テストPASS |
| 4 | 既存テスト維持 | 628/628 ALL PASS |
| 5 | Slither結果 | HIGH 0 / MEDIUM 0 維持 |

---

## Core Principles確認

- [ ] CP-1: 完全量子耐性 - 違反なし（SHA3-256のみ使用）
- [ ] CP-2: Self-Custody - 違反なし（ユーザー秘密鍵管理維持）
- [ ] CP-3: Time Lock存在 - 違反なし（既存Time Lock維持）
- [ ] CP-4: Slashing存在 - 違反なし（既存Slashing維持）
- [ ] CP-5: 透明性 - 違反なし（全てオンチェーン検証可能）

---

## リスク・懸念事項

| リスク | 確率 | 影響 | 対策 |
|--------|------|------|------|
| 40%削減目標未達成 | LOW | MEDIUM | Merkle共有最適化拡張 |
| 既存コンポーネントとの互換性問題 | LOW | HIGH | 段階的統合・単体テスト先行 |
| Gas計測の不正確性 | LOW | LOW | 複数シナリオでベンチマーク |

---

## 技術的注意事項

### バッチ検証アプローチ

```solidity
// 目標: 個別検証から共有化検証へ
// Before: N回のMerkle計算
// After: 1回のMerkle計算 + N回の差分検証

interface IBatchVerifier {
    function verifyBatch(
        bytes32[] calldata proofs,
        bytes32[] calldata publicInputs
    ) external view returns (bool);
}
```

### Gas最適化ターゲット

| コンポーネント | 現在（推定） | 目標 | 削減戦略 |
|--------------|-------------|------|----------|
| Merkle検証 (per proof) | ~50,000 | ~10,000 | パス共有 |
| フィールド演算 (per proof) | ~100,000 | ~50,000 | SIMD-like最適化 |
| STARK検証 (バッチ) | ~1,000,000 | ~600,000 | 40%削減 |

---

## 参考: Week 9 スケジュール（PHASE2_3_PLAN.mdより）

| Day | タスク | 成果物 |
|-----|--------|--------|
| 1-2 | BatchVerifier設計 | BATCH_VERIFICATION_SPEC.md |
| 3-4 | 基本実装 | BatchVerifier.sol v0.1 |
| 5-6 | Merkle共有実装 | SharedMerkle.sol |
| 7 | テスト作成 | test/BatchVerifierTest.t.sol |

---

**Plan Created**: 2025-12-27 19:00 JST
**Next Step**: 02_spec.md → 詳細仕様作成

---

**END OF CURRENT PLAN**
