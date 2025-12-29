# Current Plan

> **Generated**: 2025-12-29 14:00 JST
> **Phase**: Phase 3 - L3 + Token + 完全分散化
> **Sub-Phase**: Phase 3.1 Foundation

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
| #3 Unlock (Emergency) | Core | SEQUENCES §3 |
| #3' Resync | Core | SEQUENCES §3' |
| #4 Challenge + Slashing | Core | SEQUENCES §4 |

### セキュリティ要件

| 要件 | 仕様書出典 | 実装方法 |
|------|----------|---------|
| SHA3-256ハッシュ | CP-1 / UNIFIED §暗号 | SHA3Hasher統合 |
| SPHINCS+署名検証 | CP-1 / SEQ#2 | SPHINCSVerifier統合 |
| ZK-STARK証明 | UNIFIED §暗号 | STARKVerifier統合 |
| Time Lock強制 | CP-3 / SEQ#2,#3 | Phase 2定数維持 |

---

## 戦略準拠確認（Phase 3）

> 参照: `docs/planning/PHASE3_STRATEGY.md`

- [x] L3スタック: 独自L3 (l3-aegis) 前提
- [x] アーキテクチャ: Modular (Core/Governance/Token Layer)
- [x] リスク緩和: 監査計画、TVL制限設計、テストマトリクス
- [x] モード制約: SPEC_STRATEGY_BRIDGE §2.2に準拠

---

## L3基盤確認（Phase 3のL3関連タスク）

> 参照: `docs/aegis/meetings/L3_INFRASTRUCTURE_FINAL_DECISION_2025-12-28.md`

- [x] 独自4ノードBFTチェーン前提か → Yes
- [x] l3-aegis (Rust) の範囲内か → Yes（Phase 2 Solidityコントラクト統合）
- [x] SEQUENCES v2.0に準拠しているか → Yes
- [x] CP-1/CP-5を満たしているか → Yes

---

## IC完全性チェック（Phase 3必須）

> 参照: `docs/aegis/QUANTUM_SHIELD_UNIFIED_SPEC_v2.0.md` §Implementation Components

### 今回スコープのIC

| IC-ID | Component | タスク | Status |
|-------|-----------|--------|--------|
| IC-2 | L3 Bridge Contract | SETUP-003 (準備) | 🟡 In Progress |
| IC-3 | Sequencer | SETUP-003 (準備) | 🟡 In Progress |
| IC-4 | State Management (SMT) | SETUP-003 (準備) | 🟡 In Progress |

### マスタ照合

- [x] 全IC-ID（IC-1〜IC-6）がPHASE3_PLANに対応セクションを持つ
- [x] 欠落ICなし（v1.1で追加済み）

### タスク紐付け

- [x] 今回スコープの全タスクにIC-IDを付与した
- [x] IC-ID不要タスク: CI/CDワークフロー（インフラ整備のため）

---

## 前回レビュー課題（該当時のみ）

> CURRENT_STATE.mdより取得

| # | 重要度 | 課題 | 対策 |
|---|--------|------|------|
| - | - | Critical/Major課題なし | PIR-P3.1-001 PASS |

**Minor課題**:
| # | 課題 | 対策 |
|---|------|------|
| 1 | l3-aegis専用CI/CDワークフロー | SETUP-003と並行で対応予定 |

---

## 今回のスコープ

### 実装項目

- [ ] [SETUP-003] Phase 2資産統合準備 (IC-2, IC-3, IC-4)
  - [ ] STARKVerifier統合計画策定
  - [ ] SHA3Hasher統合計画策定
  - [ ] BatchVerifier統合計画策定
  - [ ] SPHINCSVerifier統合計画策定
  - [ ] 統合テスト計画作成

### インフラ項目

- [ ] [INFRA-001] l3-aegis専用CI/CDワークフロー作成

### 参照ドキュメント

| 種類 | ドキュメント | 参照セクション |
|------|------------|---------------|
| 仕様書-戦略ブリッジ | `docs/planning/SPEC_STRATEGY_BRIDGE.md` | §3, §5, §10 |
| Sequence仕様 | `docs/aegis/QUANTUM_SHIELD_SEQUENCES_v2.0.md` | #1-4, #3' |
| 全体仕様 | `docs/aegis/QUANTUM_SHIELD_UNIFIED_SPEC_v2.0.md` | §IC |
| 戦略 | `docs/planning/PHASE3_STRATEGY.md` | 全体 |
| Modular仕様 | `docs/specs/MODULAR_ARCHITECTURE.md` | §3 Layer定義 |
| L3基盤決議 | `docs/aegis/meetings/L3_INFRASTRUCTURE_FINAL_DECISION_2025-12-28.md` | 全体 |
| L3詳細仕様 | `docs/aegis/L3_CHAIN_SPECIFICATION.md` | 該当箇所 |
| Phase 3計画 | `docs/planning/PHASE3_PLAN.md` | §IC対応 |

---

## 成果物

| ファイル | 説明 | IC-ID |
|---------|------|-------|
| `docs/planning/PHASE2_ASSET_INTEGRATION_PLAN.md` | Phase 2資産統合計画書 | IC-2,3,4 |
| `l3-aegis/docs/INTEGRATION_SPEC.md` | l3-aegis統合仕様 | IC-2,3,4 |
| `.github/workflows/l3-aegis-ci.yml` | l3-aegis専用CI/CDワークフロー | - |

---

## 実行順序

### Step 1: Phase 2資産の棚卸し

1. Phase 2で作成されたコントラクト一覧を確認
   - `src/STARKVerifier.sol`
   - `src/BatchVerifier.sol`
   - `src/SHA3Hasher.sol`
   - `src/crypto/SPHINCSVerifier.sol`
   - その他関連コントラクト

2. 各コントラクトの依存関係を分析

3. l3-aegisでの再利用可能性を評価

### Step 2: 統合計画の策定

1. STARKVerifier統合計画
   - 現行インターフェースの分析
   - l3-aegis Core Layer との接続設計
   - ガスコスト影響評価

2. SHA3Hasher統合計画
   - ステートハッシュ計算への適用
   - Merkleルート計算への適用

3. BatchVerifier統合計画
   - バッチ処理フローの確認
   - L3ブリッジとの連携設計

4. SPHINCSVerifier統合計画
   - Prover署名検証フローの確認
   - L3トランザクション検証への適用

### Step 3: 統合テスト計画

1. 単体テスト計画
   - 各コントラクトの既存テストの移植可否
   - 新規テストケースの洗い出し

2. 統合テスト計画
   - Core Layer ↔ Phase 2資産の結合テスト
   - E2Eテストシナリオ

### Step 4: ドキュメント作成

1. `PHASE2_ASSET_INTEGRATION_PLAN.md` 作成
2. `l3-aegis/docs/INTEGRATION_SPEC.md` 作成

### Step 5: CI/CDワークフロー作成（並行タスク）

1. `.github/workflows/l3-aegis-ci.yml` 作成
   - l3-aegis ディレクトリ専用のトリガー
   - Foundry テスト実行
   - Slither静的解析

---

## Core Principles確認

- [x] CP-1: 完全量子耐性 - 違反なし（SHA3-256, Dilithium, SPHINCS+使用）
- [x] CP-2: Self-Custody - 違反なし（ユーザー鍵管理維持）
- [x] CP-3: Time Lock存在 - 違反なし（Phase 2定数継承）
- [x] CP-4: Slashing存在 - 違反なし（Phase 2メカニズム継承）
- [x] CP-5: 透明性 - 違反なし（全操作オンチェーン）

---

## Modular Architecture確認（Phase 3）

- [x] Core Layer: CP保護機構含む（IConstitutionLock.sol定義済み）
- [x] Governance Layer: ON/OFF切替可能（IGovernanceSwitch.sol定義済み）
- [x] Token Layer: ON/OFF切替可能（ITokenSwitch.sol定義済み）
- [x] Layer間依存: 下位→上位依存なし（ICoreLayer.sol独立設計）

---

## リスク・懸念事項

| # | リスク | 重要度 | 対策 |
|---|--------|--------|------|
| 1 | Phase 2コントラクトのl3-aegis互換性 | 🟠 Medium | 事前の互換性評価を実施 |
| 2 | ガスコスト影響（L1検証時） | 🟠 Medium | Phase 2の71%削減成果を維持 |
| 3 | テスト移植の工数 | 🟡 Low | 既存628テストの活用方針を明確化 |

---

## 次のアクション

計画承認後、`02_spec.md` → `03_impl.md` の順で実行

1. **02_spec.md**: Phase 2資産の詳細仕様確認
2. **03_impl.md**: 統合計画ドキュメント作成
3. **04_review.md**: PIRレビュー (PIR-P3.1-002予定)

---

**END OF CURRENT PLAN**
