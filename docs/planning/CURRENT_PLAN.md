# Current Plan

> **Generated**: 2025-01-01 (JST)  
> **Phase**: 3  
> **Sub-Phase**: 3.2 Implementation

---

## 対象チェックリスト

`docs/checklists/phase3.2.md`

---

## 仕様書参照（必須）

> 参照: `docs/planning/SPEC_STRATEGY_BRIDGE.md`

### 対象Sequence

| Sequence | 実装Layer | 仕様書参照箇所 |
|----------|----------|---------------|
| #5 | Core + Governance | SEQUENCES §5 Prover Registration |
| #6 | Core + Governance | SEQUENCES §6 Prover Exit |
| #7 | Governance | SEQUENCES §7 Governance Proposal |

### セキュリティ要件

| 要件 | 仕様書出典 | 実装方法 |
|------|----------|---------|
| Prover Stake $500K (QS) | UNIFIED §Phase 2 | TokenSwitch + veQS |
| Emergency Pause 72h上限 | SEQ#8 | GovernanceSwitch |
| veQS Lock 1week-4years | UNIFIED §veQS | veQSToken.sol |
| Quorum (パラメータ) 4% | UNIFIED §投票パラメータ | Governor.sol |

---

## 戦略準拠確認（Phase 3）

> 参照: `docs/planning/PHASE3_STRATEGY.md`

- [x] L3スタック: 独自L3 (l3-aegis) 前提 ✅ Phase 3.1完了
- [x] アーキテクチャ: Modular (Core/Governance/Token Layer) ✅ Phase 3.1完了
- [ ] リスク緩和: 監査会社選定・Bug Bounty準備
- [x] モード制約: DECENTRALIZED + BASIC/FULL（Phase 3推奨）

---

## L3基盤確認（Phase 3.2）

> 参照: `docs/aegis/meetings/L3_INFRASTRUCTURE_FINAL_DECISION_2025-12-28.md`

- [x] 独自4ノードBFTチェーン前提か ✅
- [x] l3-aegis (Rust) の範囲内か ✅
- [x] SEQUENCES v2.0に準拠しているか ✅
- [x] CP-1/CP-5を満たしているか ✅

---

## ⚠️ 重要設計変更: BTF7不要

> **CEO指示**: 2025-01-01

### 変更内容

- ❌ IC-6（Node Expansion 4→7）は **不要**
- ✅ 代替設計: **BTF4（Enterprise）** か **Full Decentralization（Permissionless）** のいずれかを選択可能

### 設計方針

| Edition | L3 Nodes | Prover | Target |
|---------|----------|--------|--------|
| **Enterprise** | 4ノード固定 | 許可制 | 金融系システム会社 |
| **Decentralized** | 4ノード→Permissionless | 段階的Permissionless | DEX・ブリッジ等 |

### 影響範囲

- UNIFIED_SPEC_v2.0.md §Node Expansion Roadmap の更新必要
- PHASE3_PLAN.md の IC-6 関連セクション削除
- SPEC_STRATEGY_BRIDGE.md §10 IC Traceability の更新

---

## IC完全性チェック（Phase 3.2）

> 参照: `docs/aegis/QUANTUM_SHIELD_UNIFIED_SPEC_v2.0.md` §Implementation Components

### 今回スコープのIC

| IC-ID | Component | タスク | Status |
|-------|-----------|--------|--------|
| IC-3 | Sequencer | SEQ-001〜008 | 🟡 In Progress |
| IC-5 | veQS Token | TOKEN-001〜014 | 🟡 In Progress |

### マスタ照合

- [x] IC-1: L3 Chain Infrastructure → ✅ Phase 3.1 COMPLETE
- [x] IC-2: L3 Bridge Contract → ✅ Phase 3.1 COMPLETE (Core Layer)
- [ ] IC-3: Sequencer → Phase 3.2 **本スコープ**
- [x] IC-4: State Management → ✅ Phase 3.1 COMPLETE (CoreState)
- [ ] IC-5: veQS Token → Phase 3.2 **本スコープ**
- ~~IC-6: Node Expansion (7-node)~~ → **不要（CEO指示）**
- IC-7: Permissionless Nodes → Phase 4 scope

### タスク紐付け

- [x] 今回スコープの全タスクにIC-IDを付与した
- [x] IC-ID不要タスクは理由を明記した

---

## 前回レビュー課題

> CURRENT_STATE.mdより

| # | 重要度 | 課題 | 対策 |
|---|--------|------|------|
| - | - | **全課題解決済み** | Phase 3.1 GO判定完了 |

---

## 今回のスコープ

### 仕様書更新項目（BTF7不要対応）

- [ ] [DOC-001] UNIFIED_SPEC_v2.0.md IC-6削除・設計変更記載
- [ ] [DOC-002] PHASE3_PLAN.md IC-6関連セクション削除
- [ ] [DOC-003] SPEC_STRATEGY_BRIDGE.md IC Traceability更新
- [ ] [DOC-004] L3_CHAIN_SPECIFICATION.md 2本立て設計明記

### Sequencer実装項目（IC-3）

- [ ] [SEQ-001] Sequencer基本インターフェース定義 (IC-3)
- [ ] [SEQ-002] MempoolManager実装 (IC-3)
- [ ] [SEQ-003] BatchBuilder実装 (IC-3)
- [ ] [SEQ-004] L1 Submitter実装 (IC-3)
- [ ] [SEQ-005] Sequencer Rotation機構 (IC-3)
- [ ] [SEQ-006] Sequencer Staking統合 (IC-3)
- [ ] [SEQ-007] Multi-Sequencer対応準備 (IC-3)
- [ ] [SEQ-008] Sequencer統合テスト (IC-3)

### veQS Token実装項目（IC-5）

- [ ] [TOKEN-001] veQS Token基本コントラクト (IC-5)
- [ ] [TOKEN-002] Lock/Unlock機構 (IC-5)
- [ ] [TOKEN-003] 投票力計算（残りロック期間×数量） (IC-5)
- [ ] [TOKEN-004] Delegation機構 (IC-5)
- [ ] [TOKEN-005] veQSガバナンス統合 (IC-5)
- [ ] [TOKEN-006] Staking報酬配分 (IC-5)
- [ ] [TOKEN-007] $QS基本トークン実装 (IC-5)
- [ ] [TOKEN-008] Token Distribution準備 (IC-5)
- [ ] [TOKEN-009] veQS単体テスト (IC-5)
- [ ] [TOKEN-010] veQS統合テスト (IC-5)

### Governance Layer完成項目

- [ ] [GOV-001] Governor.sol実装（Quorum 4%/8%/15%）
- [ ] [GOV-002] Proposal作成・投票フロー
- [ ] [GOV-003] Time Lock (7日) 実装
- [ ] [GOV-004] Security Council連携（6名構成）
- [ ] [GOV-005] Emergency Pause拡張（SC 5/9対応）
- [ ] [GOV-006] Governance統合テスト

### テスト項目

- [ ] [TEST-001] Sequencer単体テスト
- [ ] [TEST-002] veQS Token単体テスト
- [ ] [TEST-003] Governor単体テスト
- [ ] [TEST-004] Sequencer + veQS統合テスト
- [ ] [TEST-005] Full Flow E2Eテスト（Lock→Unlock with veQS）

### 監査・セキュリティ項目

- [ ] [AUDIT-001] 監査会社選定・RFP発行
- [ ] [AUDIT-002] 監査スコープ定義
- [ ] [AUDIT-003] Bug Bounty Program設計

---

## 参照ドキュメント

| 種類 | ドキュメント | 参照セクション |
|------|------------|---------------|
| 仕様書-戦略ブリッジ | `docs/planning/SPEC_STRATEGY_BRIDGE.md` | §3, §5, §7, §10 |
| Sequence仕様 | `docs/aegis/QUANTUM_SHIELD_SEQUENCES_v2.0.md` | #5, #6, #7 |
| 全体仕様 | `docs/aegis/QUANTUM_SHIELD_UNIFIED_SPEC_v2.0.md` | §IC, §veQS, §Phase 2-3 |
| L3基盤決議 | `docs/aegis/meetings/L3_INFRASTRUCTURE_FINAL_DECISION_2025-12-28.md` | 全体 |
| L3詳細仕様 | `docs/aegis/L3_CHAIN_SPECIFICATION.md` | §Membership |
| Phase 3計画 | `docs/planning/PHASE3_PLAN.md` | §2 Sequencer, §Token |
| ビジネス戦略 | `docs/planning/DEVELOPMENT_STRATEGY_v2.0.md` | §2本立て戦略 |

---

## 成果物

| ファイル | 説明 | IC-ID |
|---------|------|-------|
| `l3-aegis/aegis-sequencer/` | Sequencerモジュール | IC-3 |
| `l3-aegis/contracts/src/token/veQSToken.sol` | veQSトークン | IC-5 |
| `l3-aegis/contracts/src/token/QSToken.sol` | $QS基本トークン | IC-5 |
| `l3-aegis/contracts/src/governance/Governor.sol` | ガバナンス | - |
| `l3-aegis/contracts/test/token/*.t.sol` | Tokenテスト | IC-5 |
| `l3-aegis/contracts/test/governance/*.t.sol` | Govテスト | - |
| `docs/checklists/phase3.2.md` | チェックリスト | - |

---

## 実行順序

### Week 1-2: 仕様書更新 + 基盤設計

- DOC-001〜004: BTF7不要設計変更をドキュメント反映
- TOKEN-001〜003: veQS基本コントラクト
- SEQ-001〜002: Sequencer基本インターフェース

### Week 3-4: veQS Token実装

- TOKEN-004〜006: Delegation・投票力・報酬
- TOKEN-007〜008: $QS Token・Distribution
- TOKEN-009〜010: テスト

### Week 5-6: Sequencer実装

- SEQ-003〜005: BatchBuilder・L1 Submitter・Rotation
- SEQ-006〜007: Staking・Multi-Sequencer
- SEQ-008: 統合テスト

### Week 7-8: Governance完成

- GOV-001〜006: Governor・Proposal・SC連携
- TEST-003〜005: 統合テスト・E2E

### Week 9-10: 監査準備・Phase 3.2 Go/No-Go

- AUDIT-001〜003: 監査会社・スコープ・Bug Bounty
- PIR会議・Go/No-Go判定

---

## Core Principles確認

- [x] CP-1: 完全量子耐性 - SHA3-256, Dilithium, SPHINCS+のみ使用
- [x] CP-2: Self-Custody - ユーザー署名検証（Dilithium）
- [x] CP-3: Time Lock存在 - Normal 24h, Emergency 7d, Proposal 7d
- [x] CP-4: Slashing存在 - Quadratic N²×10%維持
- [x] CP-5: 透明性 - L3記録・Event発行

---

## Modular Architecture確認

- [x] Core Layer: CP保護機構含む ✅ Phase 3.1完了
- [ ] Governance Layer: ON/OFF切替可能 → Phase 3.2で完成
- [ ] Token Layer: ON/OFF切替可能 → Phase 3.2で完成
- [x] Layer間依存: 下位→上位依存なし ✅

---

## リスク・懸念事項

| # | リスク | 重要度 | 対策 |
|---|--------|--------|------|
| 1 | veQS設計複雑性 | 🟠 MEDIUM | Curve veモデル参照・段階実装 |
| 2 | Sequencer中央集権リスク | 🟠 MEDIUM | Multi-Sequencer設計組込 |
| 3 | 監査日程調整 | 🟠 MEDIUM | 早期RFP発行 |
| 4 | IC-6削除による仕様書整合性 | 🟡 LOW | Week 1-2で全ドキュメント更新 |

---

**承認**: CEO 2025-01-01

---

**END OF CURRENT PLAN**
