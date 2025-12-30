# Current Plan

> **Generated**: 2025-12-31 10:00 JST
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
| IC-4 | State Management (SMT) | CORE-001 | 🔴 Planning |

### マスタ照合

- [x] 全IC-ID（IC-1〜IC-6）がPHASE3_PLANに対応セクションを持つ
- [x] 欠落ICなし（IC-1完了済み）

### タスク紐付け

- [x] 今回スコープの全タスクにIC-IDを付与した
- [x] IC-ID不要タスクは理由を明記した

---

## 前回レビュー課題

> CURRENT_STATE.mdより取得

| # | 重要度 | 課題 | 対策 |
|---|--------|------|------|
| - | - | Critical/High課題なし | Track A全タスク完了済み |

**備考**: Track A (L3 Chain Infrastructure) は全6タスク完了、7件のPIR全てPASS。

---

## 今回のスコープ

### 🎯 対象タスク: SETUP-003 Phase 2資産統合準備

> **担当**: Engineer
> **IC-ID**: IC-2 (L3 Bridge Contract)
> **目的**: Phase 2で実装したSolidityコンポーネントをPhase 3 Modular Architectureに統合するための準備

### 修正項目（レビュー課題より）

- なし（Critical/High課題なし）

### 実装項目

- [ ] [IMPL-001] STARKVerifier統合計画策定 (IC-2)
  - Phase 2の`src/stark/STARKVerifier.sol`をCore Layerに統合する設計
  - インターフェース互換性の確認
  - 必要な修正点の洗い出し
  
- [ ] [IMPL-002] SHA3Hasher統合計画策定 (IC-4)
  - Phase 2の`src/crypto/SHA3_256.sol`, `SHA3Hasher.sol`をCore Layerに統合する設計
  - l3-aegis (Rust) との整合性確認
  - ガスコスト分析

- [ ] [IMPL-003] BatchVerifier統合計画策定 (IC-2)
  - Phase 2の`src/stark/BatchVerifier.sol`をCore Layerに統合する設計
  - 1000tx/batchの仕様確認
  - L3→L1提出フローの設計

- [ ] [IMPL-004] 統合テスト計画作成
  - Phase 2テストスイートの再利用計画
  - 新規統合テストの設計
  - ガスベンチマーク計画

### テスト項目

- [ ] [TEST-001] Phase 2コンポーネント互換性テスト計画
- [ ] [TEST-002] Core Layer統合テスト計画
- [ ] [TEST-003] ガスベンチマーク計画

---

## 参照ドキュメント

| 種類 | ドキュメント | 参照セクション |
|------|------------|---------------|
| 仕様書-戦略ブリッジ | `docs/planning/SPEC_STRATEGY_BRIDGE.md` | §3, §5, §10 |
| Sequence仕様 | `docs/aegis/QUANTUM_SHIELD_SEQUENCES_v2.0.md` | #1, #2, #5 |
| 全体仕様 | `docs/aegis/QUANTUM_SHIELD_UNIFIED_SPEC_v2.0.md` | §IC, §State |
| 戦略 | `docs/planning/PHASE3_STRATEGY.md` | Core Layer設計 |
| Modular仕様 | `docs/specs/MODULAR_ARCHITECTURE.md` | 全体 |
| L3基盤決議 | `docs/aegis/meetings/L3_INFRASTRUCTURE_FINAL_DECISION_2025-12-28.md` | 全体 |
| L3詳細仕様 | `docs/aegis/L3_CHAIN_SPECIFICATION.md` | §5 状態管理 |
| Phase 3計画 | `docs/planning/PHASE3_PLAN.md` | §IC対応 |
| **Phase 2コード** | `src/stark/`, `src/crypto/` | 統合対象 |

---

## 成果物

| ファイル | 説明 | IC-ID |
|---------|------|-------|
| `docs/planning/PHASE2_INTEGRATION_PLAN.md` | Phase 2資産統合計画書 | IC-2, IC-4 |
| (既存参照) `src/stark/STARKVerifier.sol` | 統合対象コンポーネント | IC-2 |
| (既存参照) `src/crypto/SHA3_256.sol` | 統合対象コンポーネント | IC-4 |
| (既存参照) `src/stark/BatchVerifier.sol` | 統合対象コンポーネント | IC-2 |

---

## 実行順序

1. **Phase 2コードベース調査** (30分)
   - `src/stark/` ディレクトリ構造確認
   - `src/crypto/` ディレクトリ構造確認
   - 依存関係の洗い出し

2. **STARKVerifier統合計画** (45分)
   - インターフェース分析
   - Core Layer適合性評価
   - 修正計画策定

3. **SHA3Hasher統合計画** (30分)
   - l3-aegis (Rust) SHA3-256との整合性確認
   - Solidityガスコスト分析
   - 統合設計

4. **BatchVerifier統合計画** (30分)
   - L3→L1提出フロー設計
   - Batch処理仕様確認
   - 統合設計

5. **統合テスト計画** (30分)
   - 既存テストスイートレビュー
   - 新規テスト設計
   - ガスベンチマーク計画

6. **ドキュメント作成** (45分)
   - `PHASE2_INTEGRATION_PLAN.md` 作成
   - CURRENT_STATE.md更新準備

---

## Core Principles確認

- [x] CP-1: 完全量子耐性 - 違反なし（SHA3-256, Dilithium-III, SPHINCS+使用）
- [x] CP-2: Self-Custody - 違反なし（ユーザー秘密鍵をサーバー保存しない）
- [x] CP-3: Time Lock存在 - 違反なし（24h/7日Time Lock維持）
- [x] CP-4: Slashing存在 - 違反なし（Quadratic Slashing維持）
- [x] CP-5: 透明性 - 違反なし（全操作オンチェーン検証可能）

---

## Modular Architecture確認（Phase 3）

- [x] Core Layer: CP保護機構含む（統合計画で確認）
- [x] Governance Layer: ON/OFF切替可能（設計で考慮）
- [x] Token Layer: ON/OFF切替可能（設計で考慮）
- [x] Layer間依存: 下位→上位依存なし（統合計画で確認）

---

## リスク・懸念事項

| # | 懸念 | 重要度 | 対策 |
|---|------|--------|------|
| 1 | Phase 2コードとModular Architecture互換性 | 🟠 MEDIUM | 詳細な互換性分析を実施 |
| 2 | ガスコスト増加の可能性 | 🟡 LOW | ベンチマーク計画で検証 |
| 3 | インターフェース変更による影響 | 🟠 MEDIUM | 段階的統合で対応 |

---

## 次のタスク（SETUP-003完了後）

| 優先度 | タスク | IC-ID |
|--------|--------|-------|
| 🔴 P0 | CORE-001 State Manager基盤 | IC-4 |
| 🟠 High | CORE-002 STARK Verifier統合 | IC-2 |
| 🟠 High | CORE-003 CP保護機構実装 | IC-2 |

---

**END OF CURRENT PLAN**
