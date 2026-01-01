# Current Plan

> **Generated**: 2026-01-01 (JST)  
> **Phase**: 3  
> **Sub-Phase**: 3.2 Implementation  
> **Active Week**: 3-4

---

## 対象チェックリスト

`docs/checklists/phase3.2.md`

---

## 前回の成果（Week 1-2）✅ COMPLETE

| # | タスク | IC | 状態 | PIR |
|---|--------|-----|:----:|-----|
| DOC-001 | UNIFIED_SPEC_v2.0.md IC-6削除・設計変更記載 | - | ☑ | - |
| DOC-002 | PHASE3_PLAN.md IC-6関連セクション削除 | - | ☑ | - |
| DOC-003 | SPEC_STRATEGY_BRIDGE.md IC Traceability更新 | - | ☑ | - |
| DOC-004 | L3_CHAIN_SPECIFICATION.md 2本立て設計明記 | - | ☑ | - |
| TOKEN-001 | QSToken基本コントラクト | IC-5 | ☑ | ☑ PIR-P3.2-001 |
| TOKEN-002 | veQS Lock/Unlock機構 | IC-5 | ☑ | ☑ PIR-P3.2-001 |
| TOKEN-003 | 投票力計算 | IC-5 | ☑ | ☑ PIR-P3.2-001 |
| SEQ-001 | Sequencer基本インターフェース定義 | IC-3 | ☑ | ☑ PIR-P3.2-001 |
| SEQ-002 | MempoolManager実装 | IC-3 | ☑ | ☑ PIR-P3.2-001 |

**PIR-P3.2-001: ✅ PASS** (2026-01-01)

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
| veQS Lock 1week-4years | UNIFIED §veQS | veQSToken.sol ✅ 実装済 |
| Quorum (パラメータ) 4% | UNIFIED §投票パラメータ | Governor.sol |
| Delegation | IC-5 | veQS.sol 🔄 **今回実装** |

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

## IC完全性チェック（Phase 3.2）

> 参照: `docs/aegis/QUANTUM_SHIELD_UNIFIED_SPEC_v2.0.md` §Implementation Components

### 今回スコープのIC

| IC-ID | Component | タスク | Status |
|-------|-----------|--------|--------|
| IC-3 | Sequencer | SEQ-003〜008 | ⬜ Week 5-6予定 |
| IC-5 | veQS Token | TOKEN-004〜010 | 🟡 **今回スコープ** |

### マスタ照合

- [x] IC-1: L3 Chain Infrastructure → ✅ Phase 3.1 COMPLETE
- [x] IC-2: L3 Bridge Contract → ✅ Phase 3.1 COMPLETE (Core Layer)
- [x] IC-3: Sequencer → 🔄 Phase 3.2 (2/8完了)
- [x] IC-4: State Management → ✅ Phase 3.1 COMPLETE (CoreState)
- [ ] IC-5: veQS Token → 🔄 Phase 3.2 **今回スコープ** (3/10完了)
- ~~IC-6: Node Expansion (7-node)~~ → **不要（CEO指示）**
- IC-7: Permissionless Nodes → Phase 4 scope

---

## 今回のスコープ（Week 3-4: veQS Token実装）

### 主要タスク

| # | タスク | IC | 優先度 | 状態 |
|---|--------|-----|--------|:----:|
| TOKEN-004 | Delegation機構 | IC-5 | 🔴 **P0** | ⬜ |
| TOKEN-005 | veQSガバナンス統合 | IC-5 | 🔴 **P0** | ⬜ |
| TOKEN-006 | Staking報酬配分 | IC-5 | 🟠 High | ⬜ |
| TOKEN-007 | $QS基本トークン拡張 | IC-5 | 🟠 High | ⬜ |
| TOKEN-008 | Token Distribution準備 | IC-5 | 🟠 High | ⬜ |
| TOKEN-009 | veQS単体テスト | IC-5 | 🟠 High | ⬜ |
| TOKEN-010 | veQS統合テスト | IC-5 | 🟠 High | ⬜ |

### 仕様書要件（Week 3-4）

| 要件 | 出典 | 実装箇所 | 状態 |
|------|------|---------|:----:|
| Delegation | IC-5 | veQS.sol:delegate() | ⬜ |
| Voting Weight計算 | IC-5 | veQS.sol:getVotes() | ⬜ |
| Governor連携 | UNIFIED §Gov | Governor.sol | ⬜ |
| 報酬分配メカニズム | IC-5 | RewardDistributor.sol | ⬜ |
| トークン配布計画 | UNIFIED §Token | TGE設計 | ⬜ |

---

## 依存関係

### Week 3-4の前提条件

| 依存 | 状態 | 備考 |
|------|:----:|------|
| QSToken.sol | ✅ | TOKEN-001で実装済み |
| veQS Lock/Unlock | ✅ | TOKEN-002で実装済み |
| 投票力計算基盤 | ✅ | TOKEN-003で実装済み |
| ReentrancyGuard | ✅ | セキュリティ修正済み |

### Week 5-6への引き継ぎ

| 項目 | 必要状態 | 備考 |
|------|---------|------|
| Delegation機構 | ☑ 完了必須 | SEQ-006のStaking統合で使用 |
| Governor.sol基盤 | ☑ 完了必須 | GOV-001〜006で拡張 |

---

## 成果物

| ファイル | 説明 | IC-ID |
|---------|------|-------|
| `l3-aegis/src/token/veQS.sol` | Delegation拡張 | IC-5 |
| `l3-aegis/src/governance/Governor.sol` | ガバナンスコントラクト | - |
| `l3-aegis/src/token/RewardDistributor.sol` | 報酬分配 | IC-5 |
| `l3-aegis/test/token/veQS.t.sol` | テスト拡張 | IC-5 |
| `l3-aegis/test/governance/Governor.t.sol` | Govテスト | - |

---

## 実行順序（Week 3-4）

### Day 1-2: Delegation機構

1. `TOKEN-004`: veQS.sol Delegation実装
   - delegate(address delegatee)
   - _delegate() internal
   - checkpoints管理

### Day 3-4: ガバナンス統合

2. `TOKEN-005`: Governor.sol実装
   - propose()
   - castVote()
   - execute()
   - veQS連携

### Day 5-6: 報酬・配布

3. `TOKEN-006`: RewardDistributor.sol
   - 報酬計算ロジック
   - クレーム機能

4. `TOKEN-007`: QSToken拡張
   - TGE対応
   - Vesting準備

5. `TOKEN-008`: Distribution設計
   - 配布計画ドキュメント

### Day 7-8: テスト

6. `TOKEN-009`: veQS単体テスト
   - Delegation
   - Checkpoint
   - 投票力

7. `TOKEN-010`: 統合テスト
   - veQS + Governor

---

## Core Principles確認

- [x] CP-1: 完全量子耐性 - SHA3-256, Dilithium, SPHINCS+のみ使用
- [x] CP-2: Self-Custody - ユーザー署名検証（Dilithium）
- [x] CP-3: Time Lock存在 - Normal 24h, Emergency 7d, Proposal 7d
- [x] CP-4: Slashing存在 - Quadratic N²×10%維持
- [x] CP-5: 透明性 - L3記録・Event発行・ReentrancyGuard

---

## リスク・懸念事項

| # | リスク | 重要度 | 対策 |
|---|--------|--------|------|
| 1 | Delegation複雑性 | 🟠 MEDIUM | OpenZeppelin参照・段階実装 |
| 2 | Governor設計 | 🟠 MEDIUM | Compound Governor Bravo参考 |
| 3 | 報酬計算gas | 🟡 LOW | バッチ処理設計 |
| 4 | テスト網羅性 | 🟡 LOW | Fuzzing追加 |

---

## 次のPIR

- **PIR ID**: PIR-P3.2-002
- **対象**: TOKEN-004〜010
- **予定日**: Week 3-4完了後

---

## 参照ドキュメント

| 種類 | ドキュメント | 参照セクション |
|------|------------|---------------|
| 仕様書-戦略ブリッジ | `docs/planning/SPEC_STRATEGY_BRIDGE.md` | §3, §5, §7, §10 |
| Sequence仕様 | `docs/aegis/QUANTUM_SHIELD_SEQUENCES_v2.0.md` | #5, #6, #7 |
| 全体仕様 | `docs/aegis/QUANTUM_SHIELD_UNIFIED_SPEC_v2.0.md` | §IC, §veQS, §Phase 2-3 |
| L3基盤決議 | `docs/aegis/meetings/L3_INFRASTRUCTURE_FINAL_DECISION_2025-12-28.md` | 全体 |
| Phase 3計画 | `docs/planning/PHASE3_PLAN.md` | §2 Sequencer, §Token |
| **PIR-P3.2-001** | `docs/aegis/meetings/PIR-P3.2-001.md` | 全体 |

---

**承認**: CEO 2026-01-01

---

**END OF CURRENT PLAN**
