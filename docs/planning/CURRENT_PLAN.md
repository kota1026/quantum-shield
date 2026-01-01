# Current Plan

> **Generated**: 2026-01-01 18:00 JST
> **Phase**: 3 - L3 + Token + 完全分散化
> **Sub-Phase**: 3.2 Implementation - Week 3-4

---

## 対象チェックリスト

`docs/checklists/phase3.2.md`

---

## 仕様書参照（必須）

> 参照: `docs/planning/SPEC_STRATEGY_BRIDGE.md`

### 対象Sequence

| Sequence | 実装Layer | 仕様書参照箇所 |
|----------|----------|---------------|
| #5 Prover Registration | Token Layer | SEQUENCES §5 - veQS Stake連携 |
| #6 Prover Exit | Token Layer | SEQUENCES §6 - veQS Stake解除 |
| #7 Governance Proposal | Token Layer | SEQUENCES §7 - veQS投票 |

### セキュリティ要件

| 要件 | 仕様書出典 | 実装方法 |
|------|----------|---------|
| Lock Duration 1w-4y | IC-5 UNIFIED §Token | veQS.sol MIN/MAX_LOCK_TIME |
| Voting Power Decay | IC-5 UNIFIED §Token | _calculateVotingPower() 線形減衰 |
| 4x Max Boost | IC-5 UNIFIED §Token | MAX_LOCK_TIME = 4 years |
| Delegation Security | SEQ#7 + CP-5 | nonReentrant + Event発行 |
| Stake通貨 ($QS) | IC-5 UNIFIED §Token | TokenSwitch.getStakeCurrency() |

---

## 戦略準拠確認（Phase 3）

> 参照: `docs/planning/PHASE3_STRATEGY.md`

- [x] L3スタック: 独自L3 (l3-aegis) 前提
- [x] アーキテクチャ: Modular (Core/Governance/Token Layer)
- [x] リスク緩和: Curve veモデル参照、段階実装、ReentrancyGuard
- [x] モード制約: Token = BASIC → FULL への移行準備

---

## L3基盤確認（Phase 3のL3関連タスク）

> 参照: `docs/aegis/meetings/L3_INFRASTRUCTURE_FINAL_DECISION_2025-12-28.md`

- [x] 独自4ノードBFTチェーン前提か: ✅ IC-1完了済
- [x] l3-aegis (Rust) の範囲内か: ✅ Solidity Token Layer
- [x] SEQUENCES v2.0に準拠しているか: ✅
- [x] CP-1/CP-5を満たしているか: ✅ SHA3-256 only + Event発行

---

## IC完全性チェック（Phase 3必須）

> 参照: `docs/aegis/QUANTUM_SHIELD_UNIFIED_SPEC_v2.0.md` §Implementation Components

### 今回スコープのIC

| IC-ID | Component | タスク | Status |
|-------|-----------|--------|--------|
| IC-5 | veQS Token | TOKEN-004〜010 | 🟡 In Progress (3/10完了 → 10/10目標) |

### マスタ照合

- [x] 全IC-ID（IC-1〜IC-5, IC-7）がPHASE3_PLANに対応セクションを持つ
- [x] ~~IC-6~~ 不要（CEO指示 2025-01-01）
- [x] 欠落ICなし

### タスク紐付け

- [x] 今回スコープの全タスクにIC-IDを付与した（IC-5）
- [x] IC-ID不要タスクなし

---

## 前回レビュー課題

> CURRENT_STATE.md および PIR-P3.2-001 より

| # | 重要度 | 課題 | 対策 | 状態 |
|---|--------|------|------|:----:|
| 1 | 🟢 Info | veQS totalVotingPower近似値 | Phase 3.2後半で精密計算実装 | 📋 今回スコープ |
| 2 | 🟠 Medium | veQS設計複雑性 | Curve veモデル参照・段階実装 | 🔄 継続対応 |

---

## 今回のスコープ

### 修正項目（レビュー課題より）

- [ ] [FIX-001] totalVotingPower精密計算実装（TOKEN-006に含む）

### 実装項目

| # | タスク | IC | 優先度 | 説明 |
|---|--------|-----|--------|------|
| TOKEN-004 | Delegation機構 | IC-5 | 🔴 P0 | 投票力の委任機能 |
| TOKEN-005 | veQSガバナンス統合 | IC-5 | 🔴 P0 | GovernorとveQSの連携 |
| TOKEN-006 | Staking報酬配分 | IC-5 | 🟠 High | veQSホルダーへの報酬分配 |
| TOKEN-007 | $QS基本トークン拡張 | IC-5 | 🟠 High | Minter権限・Pause機能追加 |
| TOKEN-008 | Token Distribution準備 | IC-5 | 🟠 High | 初期配布用Vesting契約 |

### テスト項目

| # | タスク | IC | 説明 |
|---|--------|-----|------|
| TOKEN-009 | veQS単体テスト | IC-5 | Delegation/報酬配分テスト |
| TOKEN-010 | veQS統合テスト | IC-5 | Governor連携E2Eテスト |

### 参照ドキュメント

| 種類 | ドキュメント | 参照セクション |
|------|------------|---------------|
| 仕様書-戦略ブリッジ | `docs/planning/SPEC_STRATEGY_BRIDGE.md` | §3, §5, §7, §10 |
| Sequence仕様 | `docs/aegis/QUANTUM_SHIELD_SEQUENCES_v2.0.md` | #5, #6, #7 |
| 全体仕様 | `docs/aegis/QUANTUM_SHIELD_UNIFIED_SPEC_v2.0.md` | §IC-5 Token Design |
| 戦略 | `docs/planning/PHASE3_STRATEGY.md` | Modular Architecture |
| Modular仕様 | `docs/specs/MODULAR_ARCHITECTURE.md` | Token Layer |
| L3基盤決議 | `docs/aegis/meetings/L3_INFRASTRUCTURE_FINAL_DECISION_2025-12-28.md` | 全体 |
| Phase 3計画 | `docs/planning/PHASE3_PLAN.md` | §Token Design: veQS |
| PIR-P3.2-001 | `docs/aegis/meetings/PIR-P3.2-001.md` | 前回レビュー結果 |

---

## 成果物

| ファイル | 説明 | IC-ID |
|---------|------|-------|
| `l3-aegis/src/token/veQS.sol` | Delegation機構追加 | IC-5 |
| `l3-aegis/src/token/VeQSRewardDistributor.sol` | 報酬分配コントラクト（新規） | IC-5 |
| `l3-aegis/src/token/QSToken.sol` | Minter/Pause機能追加 | IC-5 |
| `l3-aegis/src/token/TokenVesting.sol` | Vesting契約（新規） | IC-5 |
| `l3-aegis/src/governance/Governor.sol` | veQS連携Governor（新規） | IC-5 |
| `l3-aegis/src/interfaces/IVeQSRewardDistributor.sol` | インターフェース（新規） | IC-5 |
| `l3-aegis/src/interfaces/IGovernor.sol` | インターフェース（新規） | IC-5 |
| `l3-aegis/test/token/veQSDelegation.t.sol` | Delegation単体テスト（新規） | - |
| `l3-aegis/test/token/VeQSRewardDistributor.t.sol` | 報酬配分テスト（新規） | - |
| `l3-aegis/test/governance/Governor.t.sol` | Governor統合テスト（新規） | - |

---

## 実行順序

### Day 1-2: Delegation機構（TOKEN-004）

1. veQS.solにdelegation関連の状態変数追加
   - `mapping(address => address) public delegates`
   - `mapping(address => uint256) public delegatedPower`
2. delegate()関数実装（委任先設定）
3. undelegateAll()関数実装
4. 委任時のVotingPower再計算ロジック
5. 単体テスト作成（TOKEN-009の一部）

### Day 3-4: ガバナンス統合（TOKEN-005）

1. IGovernor.solインターフェース定義
2. Governor.sol実装
   - Quorum: 4% (パラメータ), 8% (アップグレード), 15% (Council変更)
   - 投票期間: 7日
   - Time Lock: 7日
3. veQS.getVotingPower()連携
4. ProposalState管理
5. 統合テスト作成（TOKEN-010の一部）

### Day 5-6: Staking報酬配分（TOKEN-006）

1. IVeQSRewardDistributor.solインターフェース定義
2. VeQSRewardDistributor.sol実装
   - 報酬プール管理
   - veQS残高に比例した分配
   - Claim機能
3. totalVotingPower精密計算（FIX-001対応）
4. 報酬配分テスト作成

### Day 7-8: トークン拡張・Distribution準備（TOKEN-007, 008）

1. QSToken.sol拡張
   - Minter権限（Ownable）
   - Pause機能（Pausable）
   - mint/burn関数
2. TokenVesting.sol実装
   - 4年線形Vesting
   - Cliff期間サポート
   - 受益者管理
3. 初期配布シミュレーションテスト

### Day 9-10: テスト完成・PIR準備（TOKEN-009, 010）

1. 全単体テスト完成・実行
2. 統合テスト完成・実行
3. Slither静的解析
4. PIR準備（ドキュメント更新）

---

## Core Principles確認

- [x] CP-1: 完全量子耐性 - 違反なし（SHA3-256使用、keccak256禁止）
- [x] CP-2: Self-Custody - 違反なし（ユーザー署名管理）
- [x] CP-3: Time Lock存在 - 違反なし（Governor 7日Time Lock）
- [x] CP-4: Slashing存在 - 違反なし（Sequencer Slashing設計済み）
- [x] CP-5: 透明性 - 違反なし（全Event発行、ReentrancyGuard）

---

## Modular Architecture確認（Phase 3）

- [x] Core Layer: CP保護機構含む（Phase 3.1完了）
- [x] Governance Layer: ON/OFF切替可能（GovernanceSwitch実装済み）
- [x] Token Layer: ON/OFF切替可能（TokenSwitch実装済み）
- [x] Layer間依存: 下位→上位依存なし（Token → Core参照のみ）

---

## リスク・懸念事項

| # | リスク | 重要度 | 対策 |
|---|--------|--------|------|
| 1 | veQS設計複雑性 | 🟠 Medium | Curve veモデル参照、シンプル実装優先 |
| 2 | Delegation攻撃ベクトル | 🟡 Low | flashloan対策（snapshot時点のbalance使用） |
| 3 | 報酬計算精度 | 🟡 Low | 固定小数点演算、オーバーフローチェック |
| 4 | Governor Quorum設定 | 🟡 Low | 仕様書準拠（4%/8%/15%）で固定 |

---

## PIR予定

| PIR ID | 対象 | 予定日 |
|--------|------|--------|
| PIR-P3.2-002 | TOKEN-004〜010 | Week 3-4完了後 |

---

## 次のPIR ID

**PIR-P3.2-002**

---

**END OF CURRENT PLAN**
