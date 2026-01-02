# Current Plan

> **Generated**: 2026-01-02 18:00 JST
> **Phase**: 3.3 - Decentralize + Testing
> **Sub-Phase**: Week 9 (Track A: 4BFT + SC基盤)
> **Planner**: PM Agent

---

## 対象チェックリスト

`docs/checklists/phase3.3.md`

---

## 仕様書参照（必須）

> 参照: `docs/planning/SPEC_STRATEGY_BRIDGE.md`

### 対象Sequence

| Sequence | 実装Layer | 仕様書参照箇所 |
|----------|----------|---------------|
| #5 | Core + Governance | SEQUENCES §5 Prover Registration |
| #7 | Governance | SEQUENCES §7 Governance Proposal |
| #8 | Core + Governance | SEQUENCES §8 Emergency Pause |

### セキュリティ要件

| 要件 | 仕様書出典 | 実装方法 |
|------|----------|---------|
| 4BFT Byzantine耐性 (f=1) | L3_CHAIN_SPECIFICATION §Consensus | aegis-node PBFT実装 |
| SC 5/9 Emergency Pause | UNIFIED_SPEC §Security Council | SecurityCouncil.sol閾値 |
| SC 6/9 Veto権 | UNIFIED_SPEC §Security Council | Governor.sol veto機能 |
| SC 7/9 緊急アップグレード | UNIFIED_SPEC §Security Council | Timelock緊急実行 |
| veQS選出 | UNIFIED_SPEC §veQS | VotingEscrow.sol統合 |

---

## 戦略準拠確認（Phase 3）

> 参照: `docs/planning/PHASE3_STRATEGY.md`

- [x] L3スタック: 独自L3 (l3-aegis) 前提
- [x] アーキテクチャ: Modular (Core/Governance/Token Layer)
- [x] リスク緩和: 形式検証、段階的TVL上限、複数回監査計画
- [x] モード制約: DECENTRALIZED + FULL Token（Phase 3.3ターゲット）

---

## L3基盤確認（Phase 3のL3関連タスク）

> 参照: `docs/aegis/meetings/L3_INFRASTRUCTURE_FINAL_DECISION_2025-12-28.md`

- [x] 独自4ノードBFTチェーン前提か
- [x] l3-aegis (Rust) の範囲内か
- [x] SEQUENCES v2.0に準拠しているか
- [x] CP-1/CP-5を満たしているか

---

## IC完全性チェック（Phase 3必須）

> 参照: `docs/aegis/QUANTUM_SHIELD_UNIFIED_SPEC_v2.0.md` §Implementation Components

### 今回スコープのIC

| IC-ID | Component | タスク | Status |
|-------|-----------|--------|--------|
| IC-1 | L3 Chain Infrastructure (4-node BFT) | DECEN-001~004 | 🟡 In Progress |
| IC-3 | Sequencer | DECEN-012~015 (次週) | 🟢 Phase 3.2完了、拡張待ち |
| - | Security Council | DECEN-005~008 | 🟡 In Progress |

### マスタ照合

- [x] 全IC-ID（IC-1〜IC-5, IC-7）がPHASE3_PLANに対応セクションを持つ
- [x] 欠落ICなし（IC-6は不要：CEO指示 2025-01-01）

### タスク紐付け

- [x] 今回スコープの全タスクにIC-IDを付与した
- [x] Security Council関連タスクはIC不要（Governance Layer機能、UNIFIED_SPEC §Security Council定義）

---

## 前回レビュー課題（該当時のみ）

> CURRENT_STATE.mdより確認

**前回課題なし** - Phase 3.2 Go/No-Go判定: 🟢 GO (91.5/100, 全会一致)

| # | 重要度 | 課題 | 対策 |
|---|--------|------|------|
| - | - | なし | - |

---

## 今回のスコープ

### 修正項目（レビュー課題より）

なし（前回Phase 3.2は全課題解決済み）

### 実装項目

#### Track A Week 1: 4BFT Consensus完成 (IC-1)

- [ ] [DECEN-001] 4BFT consensus production readiness (IC-1) 🔴 P0
- [ ] [DECEN-002] Byzantine fault tolerance検証 (IC-1) 🔴 P0
- [ ] [DECEN-003] Leader election & rotation (IC-1) 🟠 High
- [ ] [DECEN-004] Network partition recovery (IC-1) 🟠 High

#### Track A Week 1: Security Council基盤

- [ ] [DECEN-005] SC member election via veQS 🔴 P0
- [ ] [DECEN-006] SC threshold voting (5/9, 6/9, 7/9) 🔴 P0
- [ ] [DECEN-007] SC term limits & rotation 🟠 High
- [ ] [DECEN-008] SC emergency powers integration 🟠 High

### テスト項目

- [ ] [TEST-4BFT-001] 4ノードBFT合意テスト（正常系）
- [ ] [TEST-4BFT-002] Byzantine障害シミュレーション（1ノード悪意）
- [ ] [TEST-4BFT-003] Leader rotation検証
- [ ] [TEST-4BFT-004] Network partition recovery検証
- [ ] [TEST-SC-001] SC選出via veQS投票テスト
- [ ] [TEST-SC-002] 閾値投票テスト（5/9, 6/9, 7/9）
- [ ] [TEST-SC-003] Term limit & rotation テスト
- [ ] [TEST-SC-004] Emergency powers統合テスト

---

## 参照ドキュメント

| 種類 | ドキュメント | 参照セクション |
|------|------------|---------------|
| 仕様書-戦略ブリッジ | `docs/planning/SPEC_STRATEGY_BRIDGE.md` | §3, §5, §10 |
| Sequence仕様 | `docs/aegis/QUANTUM_SHIELD_SEQUENCES_v2.0.md` | #5, #7, #8 |
| 全体仕様 | `docs/aegis/QUANTUM_SHIELD_UNIFIED_SPEC_v2.0.md` | §IC, §Security Council |
| 戦略 | `docs/planning/PHASE3_STRATEGY.md` | Governance設計 |
| Modular仕様 | `docs/specs/MODULAR_ARCHITECTURE.md` | Governance Layer |
| L3基盤決議 | `docs/aegis/meetings/L3_INFRASTRUCTURE_FINAL_DECISION_2025-12-28.md` | 全体 |
| L3詳細仕様 | `docs/aegis/L3_CHAIN_SPECIFICATION.md` | §Consensus, §Node |
| Phase 3計画 | `docs/planning/PHASE3_PLAN.md` | §IC対応 |
| Phase 3.3チェックリスト | `docs/checklists/phase3.3.md` | Track A |

---

## 成果物

| ファイル | 説明 | IC-ID |
|---------|------|-------|
| `l3-aegis/crates/aegis-consensus/src/bft.rs` | 4BFT production実装 | IC-1 |
| `l3-aegis/crates/aegis-consensus/src/leader.rs` | Leader election & rotation | IC-1 |
| `l3-aegis/crates/aegis-consensus/src/partition.rs` | Network partition recovery | IC-1 |
| `l3-aegis/contracts/src/SecurityCouncilElection.sol` | SC選出via veQS | - |
| `l3-aegis/contracts/src/SecurityCouncil.sol` | SC閾値投票拡張 | - |
| `l3-aegis/crates/aegis-consensus/tests/bft_test.rs` | 4BFTテスト | IC-1 |
| `l3-aegis/contracts/test/SecurityCouncilElection.t.sol` | SC選出テスト | - |

---

## 実行順序

### Day 1-2: 4BFT Production Readiness (DECEN-001)

1. 現行aegis-consensusのBFT実装レビュー
2. Production環境向け最適化（タイムアウト調整、ログ強化）
3. メトリクス収集機能追加
4. Unit Test作成・実行

### Day 3-4: Byzantine Fault Tolerance検証 (DECEN-002)

1. Byzantine障害シナリオ定義（悪意ノード1台）
2. 障害検出・隔離ロジック実装
3. Byzantine耐性テスト作成・実行
4. f=1耐性の形式検証

### Day 5-6: Leader Election & Rotation (DECEN-003)

1. Leader選出アルゴリズム実装（ラウンドロビン or VRF）
2. Leader障害時のrotation実装
3. Leader rotation テスト
4. Liveness保証の検証

### Day 7-8: Network Partition Recovery (DECEN-004)

1. Partition検出メカニズム実装
2. Recovery protocolの実装
3. Partition recoveryテスト
4. Safety保証の検証

### Day 9-10: SC Election via veQS (DECEN-005)

1. SecurityCouncilElection.sol設計・実装
2. veQS投票統合（VotingEscrow.sol連携）
3. 9名選出ロジック実装
4. Election テスト

### Day 11-12: SC Threshold Voting (DECEN-006)

1. SecurityCouncil.sol閾値投票拡張
2. 5/9（Pause）、6/9（Veto）、7/9（Emergency）実装
3. 閾値投票テスト
4. Governor.sol統合

### Day 13: SC Term Limits & Rotation (DECEN-007)

1. 任期制限（1年、最大3期）実装
2. Rotation機構実装
3. Term limit テスト

### Day 14: SC Emergency Powers Integration (DECEN-008)

1. EmergencyController.sol との統合
2. Emergency pause/resume via SC
3. 統合テスト実行
4. PIR準備

---

## Core Principles確認

- [x] CP-1: 完全量子耐性 - 違反なし（SHA3-256, Dilithium-III, SPHINCS+-128s継続使用）
- [x] CP-2: Self-Custody - 違反なし（ユーザー秘密鍵は常にユーザー管理）
- [x] CP-3: Time Lock存在 - 違反なし（Timelock 7日維持）
- [x] CP-4: Slashing存在 - 違反なし（Quadratic Slashing継続）
- [x] CP-5: 透明性 - 違反なし（全操作L3ブロック記録、Event発行）

---

## Modular Architecture確認（Phase 3）

- [x] Core Layer: CP保護機構含む（4BFT consensusはCore Layer基盤）
- [x] Governance Layer: ON/OFF切替可能（SC選出はGovernance Layer）
- [x] Token Layer: ON/OFF切替可能（veQS統合はToken Layer）
- [x] Layer間依存: 下位→上位依存なし（Core→Governance→Token順序維持）

---

## リスク・懸念事項

| # | リスク | 重要度 | 対策 |
|---|--------|--------|------|
| 1 | 4BFT liveness vs safety トレードオフ | 🟠 Medium | 形式検証、シミュレーションテスト |
| 2 | SC選出のveQS投票参加率 | 🟠 Medium | Delegation推奨、最低投票率設定 |
| 3 | Leader rotation時のトランザクション遅延 | 🟡 Low | 並行処理、バッファ設計 |
| 4 | SC 9名確保の難しさ | 🟠 Medium | 段階的構成（Phase 3初期は6名可） |

---

## PIR予定

| PIR ID | 対象 | 予定日 |
|--------|------|--------|
| PIR-P3.3-001 | DECEN-001~008 (4BFT + SC基盤) | Track A Week 1終了後 |

---

## 成功基準

| 基準 | 条件 | 目標 |
|------|------|------|
| 4BFT完成 | DECEN-001~004全完了 | 100% |
| SC基盤完成 | DECEN-005~008全完了 | 100% |
| テスト | 全TEST項目PASS | 100% |
| Slither | High/Medium = 0 | ✅ |
| CP準拠 | CP-1~5 全て準拠 | ✅ |
| PIR | PIR-P3.3-001 PASS | ✅ |

---

**END OF CURRENT PLAN**
