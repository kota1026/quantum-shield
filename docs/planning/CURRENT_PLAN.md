# Current Plan

> **Generated**: 2025-12-25 17:00 JST  
> **Phase**: 2 - Security Council + Token  
> **Month**: 7 / 24  
> **Week**: 3

---

## 対象チェックリスト

`docs/planning/PHASE2_CHECKLIST.md` - Phase 2.1: Foundation (Week 3-4)

---

## 前回レビュー課題

> CURRENT_STATE.mdより - **すべて解決済み** ✅

| # | 重要度 | 課題 | 対策 | 状態 |
|---|--------|------|------|------|
| 1 | ~~🔴 HIGH~~ | FRIVerifier keccak256使用 | SHA3-256移行 | ✅ PIR-P2-001 PASS |
| 2 | ~~🟡 LOW~~ | Compiler Warnings | 棚卸し完了 | ✅ CP-1違反0件 |

**Note**: Week 2完了時点で全Critical/High課題は解決済み。新規レビュー課題なし。

---

## 今回のスコープ

### Week 3 目標

Week 2で完成したSHA3HasherとProofCodecを基盤として、STARKVerifierの基本構造構築とFRIVerifierとの統合テストを実施する。

### 実装項目

| # | ID | タスク | 担当 | 優先度 |
|---|----|--------|------|--------|
| 1 | IMPL-004 | STARKVerifier.sol v0.1 基本構造 | Engineer | 🔴 HIGH |
| 2 | IMPL-005 | トレースCommitment検証 | Engineer | 🟡 MEDIUM |
| 3 | IMPL-006 | ProofCodec.sol 最終調整（必要時） | Engineer | 🟢 LOW |

### テスト項目

| # | ID | タスク | 担当 | 優先度 |
|---|----|--------|------|--------|
| 1 | TEST-003 | FRIVerifier統合テスト（SHA3使用確認） | QA | 🔴 HIGH |
| 2 | TEST-004 | STARKVerifier単体テスト | QA | 🔴 HIGH |
| 3 | TEST-005 | SHA3Hasher/ProofCodec統合テスト | QA | 🟡 MEDIUM |

### インフラ項目

| # | ID | タスク | 担当 | 優先度 |
|---|----|--------|------|--------|
| 1 | INFRA-001 | テストネット環境構築（Sepolia） | DevOps | 🟡 MEDIUM |

### 参照ドキュメント

| 種別 | パス |
|------|------|
| 憲法 | `docs/constitution/CORE_PRINCIPLES.md` |
| シーケンス参照 | `docs/constitution/QUANTUM_SHIELD_SEQUENCES_v2.0_REF.md` |
| ZK-STARK計画 | `docs/planning/ZK_STARK_IMPLEMENTATION_PLAN.md` |
| Gasベースライン | `docs/planning/GAS_BASELINE_P2.md` |
| PIR-P2-003レポート | `docs/aegis/pir/PIR-P2-003_WEEK2_REVIEW.md` |

---

## 成果物

| ファイル | 説明 |
|---------|------|
| `contracts/src/STARKVerifier.sol` | STARKVerifier v0.1 - 基本構造・インターフェース定義 |
| `contracts/test/STARKVerifier.t.sol` | STARKVerifier単体テスト |
| `contracts/test/integration/FRIIntegration.t.sol` | FRIVerifier統合テスト（SHA3確認） |

---

## 実行順序

### Day 1: STARKVerifier基本構造

1. `ZK_STARK_IMPLEMENTATION_PLAN.md` Section 3.3 Proof Structureを確認
2. `STARKVerifier.sol` v0.1を作成
   - 基本インターフェース定義
   - STARKProof構造体実装
   - SHA3Hasherとの統合ポイント設計
3. NatSpecドキュメント追加

### Day 2: 単体テスト作成

4. `STARKVerifier.t.sol` を作成
   - 構造体エンコード/デコードテスト
   - 基本検証フローテスト
5. テスト実行・カバレッジ確認

### Day 3: FRIVerifier統合テスト

6. `FRIIntegration.t.sol` を作成
   - SHA3-256使用確認テスト
   - FRIVerifier + SHA3Hasher統合テスト
7. 既存テストとの整合性確認

### Day 4: ドキュメント・レビュー準備

8. コード整理・NatSpec最終化
9. PIR-P2-004準備（Week 3レビュー）
10. CURRENT_STATE.md更新

---

## Core Principles確認

| CP | 原則 | 確認項目 | 判定 |
|----|------|----------|------|
| CP-1 | 完全量子耐性 | SHA3-256のみ使用、keccak256禁止 | ⬜ 確認予定 |
| CP-2 | Self-Custody | ユーザー秘密鍵のサーバー保管なし | ✅ 違反なし |
| CP-3 | Time Lock存在 | Time Lock無効化なし | ✅ 違反なし |
| CP-4 | Slashing存在 | Slashing機能削除なし | ✅ 違反なし |
| CP-5 | 透明性 | オンチェーン検証可能 | ⬜ 確認予定 |

---

## リスク・懸念事項

| # | リスク | 重要度 | 対策 |
|---|--------|--------|------|
| 1 | STARKVerifier設計の複雑性 | 🟡 MEDIUM | 段階的実装、v0.1は基本構造のみ |
| 2 | Gas目標達成の不確実性 | 🟡 MEDIUM | Phase 2.3で最適化フェーズ確保 |
| 3 | FRI統合テスト失敗時の影響 | 🟢 LOW | SHA3移行完了済み（PIR-P2-001 PASS） |

---

## 依存関係

### 完了済み依存

| 依存 | 状態 | PIR |
|------|------|-----|
| SHA3Hasher.sol | ✅ COMPLETE | PIR-P2-003 |
| ProofCodec.sol | ✅ COMPLETE | PIR-P2-003 |
| FRIVerifier SHA3移行 | ✅ COMPLETE | PIR-P2-001 |

### 外部依存

| 依存 | 状態 | 対策 |
|------|------|------|
| Sepolia RPC | ⬜ 未確認 | 複数プロバイダ確保（Alchemy, Infura） |

---

## 次のマイルストーン

| マイルストーン | 時期 | 備考 |
|---------------|------|------|
| Week 3 完了 | 2025-12-31 | STARKVerifier v0.1 |
| PIR-P2-004 | 2025-12-31 | Week 3レビュー |
| Phase 2.1 完了 | Week 4終了時 | Month 7完了判定 |

---

**Plan Status**: ✅ Ready for Implementation

---

**END OF CURRENT PLAN**
