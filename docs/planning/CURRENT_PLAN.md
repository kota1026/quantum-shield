# Current Plan

> **Generated**: 2026-01-01 23:30 JST
> **Phase**: 3.2 Implementation
> **Sub-Phase**: Week 7-8 Governance Layer完成

---

## 対象チェックリスト

`docs/checklists/phase3.2.md`

---

## 仕様書参照（必須）

> 参照: `docs/planning/SPEC_STRATEGY_BRIDGE.md`

### 対象Sequence

| Sequence | 名称 | 実装Layer | 仕様書参照箇所 |
|----------|------|----------|---------------|
| #7 | Governance Proposal | Governance | SEQUENCES §7 |
| #8 | Emergency Pause & Recovery | Core + Governance | SEQUENCES §8 |

### セキュリティ要件

| 要件 | 仕様書出典 | 実装方法 |
|------|----------|---------| 
| Quorum 4%/8%/15% | SEQ#7 | Governor.solでproposalType別に設定 |
| 議論期間 7日 | SEQ#7 | Governor.sol DISCUSSION_PERIOD |
| 投票期間 7日 | SEQ#7 | Governor.sol VOTING_PERIOD |
| Time Lock 7日 | SEQ#7, CORE_PRINCIPLES | Timelock.sol MIN_DELAY = 7 days |
| Emergency Pause SC 5/9 | SEQ#8 | EmergencyController.sol + Security Council |
| 最大Pause期間 72時間 | SEQ#8 | EmergencyController.sol MAX_PAUSE_DURATION |
| Defense Period 48時間 | SEQ#4 | 既存Challenge機構との連携 |
| veQS投票重み | SEQ#7 | VotingWeight = veQS balance at snapshot |

---

## 戦略準拠確認（Phase 3）

> 参照: `docs/planning/PHASE3_STRATEGY.md`

- [x] L3スタック: 独自L3 (l3-aegis) 前提
- [x] アーキテクチャ: Modular (Core/Governance/Token Layer)
- [x] リスク緩和: 監査準備、TVL制限、Bug Bounty設計中
- [x] モード制約: DECENTRALIZED + FULL (veQS投票必須)

---

## L3基盤確認（Phase 3）

> 参照: `docs/aegis/meetings/L3_INFRASTRUCTURE_FINAL_DECISION_2025-12-28.md`

- [x] 独自4ノードBFTチェーン前提
- [x] l3-aegis (Rust) の範囲内
- [x] SEQUENCES v2.0に準拠
- [x] CP-1（量子耐性）とCP-5（透明性）を満たす

---

## IC完全性チェック（Phase 3必須）

> 参照: `docs/aegis/QUANTUM_SHIELD_UNIFIED_SPEC_v2.0.md` §Implementation Components

### 今回スコープのIC

| IC-ID | Component | タスク | Status |
|-------|-----------|--------|--------|
| - | Governance Layer | GOV-001〜006 | 🟡 本スコープ |

> **Note**: Governance Layer自体はICとして定義されていないが、Sequence #7, #8の実装に必要なコンポーネント

### マスタ照合

- [x] 全IC-ID（IC-1〜IC-5, IC-7）がPHASE3_PLANに対応セクションを持つ
- [x] IC-6は不要（CEO指示 2025-01-01）
- [x] 欠落ICなし

### タスク紐付け

- [x] Governance LayerタスクはSequence #7, #8に紐付け
- [x] IC-ID不要理由: Governance LayerはSequence実装であり、ICは別途定義されていない

---

## 前回レビュー課題

> CURRENT_STATE.mdより確認

| # | 重要度 | 課題 | 対策 |
|---|--------|------|------|
| - | - | **Critical/Highの未解決課題なし** | - |

**前回PIR結果**: 
- PIR-P3.2-001: ✅ PASS (TOKEN-001~003, SEQ-001~002)
- PIR-P3.2-002: ✅ PASS (TOKEN-004~010)
- PIR-P3.2-003: ✅ PASS (SEQ-003~008)

---

## 今回のスコープ

### 実装項目

| # | タスク | 担当 | 優先度 | 説明 |
|---|--------|------|--------|------|
| GOV-001 | Governor.sol実装 | Engineer | 🔴 **P0** | Quorum 4%/8%/15%、veQS投票統合 |
| GOV-002 | Proposal作成・投票フロー | Engineer | 🔴 **P0** | 議論7日+投票7日+Time Lock 7日 |
| GOV-003 | Timelock.sol実装 | Engineer | 🟠 High | 7日Time Lock、キャンセル機能 |
| GOV-004 | Security Council連携 | Engineer | 🟠 High | 6名構成、Veto権限 (6/9) |
| GOV-005 | Emergency Pause拡張 | Engineer | 🟠 High | SC 5/9、最大72時間、Token Vote延長 |
| GOV-006 | Governance統合テスト | QA | 🟠 High | E2Eテスト、シナリオテスト |

### テスト項目

| # | テスト | 対象 | 説明 |
|---|--------|------|------|
| TEST-GOV-001 | Governor単体テスト | GOV-001, GOV-002 | Quorum検証、投票フロー |
| TEST-GOV-002 | Timelock単体テスト | GOV-003 | 遅延実行、キャンセル |
| TEST-GOV-003 | Emergency単体テスト | GOV-005 | Pause/Unpause、延長 |
| TEST-GOV-004 | 統合テスト | 全GOV | veQS + Governor + Timelock |
| TEST-GOV-005 | E2Eテスト | 全GOV | フル提案ライフサイクル |

---

## 参照ドキュメント

| 種類 | ドキュメント | 参照セクション |
|------|------------|---------------|
| 憲法 | `docs/constitution/CORE_PRINCIPLES.md` | 全体（Time Lock削除不可等） |
| 仕様書-戦略ブリッジ | `docs/planning/SPEC_STRATEGY_BRIDGE.md` | §3, §5, §6, §7 |
| Sequence仕様 | `docs/aegis/QUANTUM_SHIELD_SEQUENCES_v2.0.md` | #7, #8 |
| 全体仕様 | `docs/aegis/QUANTUM_SHIELD_UNIFIED_SPEC_v2.0.md` | §Governance |
| 戦略 | `docs/planning/PHASE3_STRATEGY.md` | §Governance |
| Modular仕様 | `docs/specs/MODULAR_ARCHITECTURE.md` | §GovernanceSwitch |
| Phase 3.2チェックリスト | `docs/checklists/phase3.2.md` | Week 7-8 |
| 既存veQS実装 | `l3-aegis/contracts/src/token/` | veQS統合 |

---

## 成果物

| ファイル | 説明 | Sequence |
|---------|------|----------|
| `l3-aegis/contracts/src/governance/Governor.sol` | メインガバナンスコントラクト | #7 |
| `l3-aegis/contracts/src/governance/Timelock.sol` | 7日Time Lock | #7 |
| `l3-aegis/contracts/src/governance/EmergencyController.sol` | 緊急停止コントローラー | #8 |
| `l3-aegis/contracts/src/governance/SecurityCouncil.sol` | SC 6名マルチシグ | #7, #8 |
| `l3-aegis/contracts/src/governance/IGovernor.sol` | インターフェース | #7 |
| `l3-aegis/contracts/test/governance/Governor.t.sol` | Governorテスト | - |
| `l3-aegis/contracts/test/governance/Timelock.t.sol` | Timelockテスト | - |
| `l3-aegis/contracts/test/governance/EmergencyController.t.sol` | Emergencyテスト | - |
| `l3-aegis/contracts/test/governance/GovernanceIntegration.t.sol` | 統合テスト | - |

---

## 実行順序

### Day 1-2: Governor基盤

1. **GOV-001**: Governor.sol基本構造実装
   - IGovernor.solインターフェース定義
   - ProposalState enum (Pending, Active, Canceled, Defeated, Succeeded, Queued, Expired, Executed)
   - Quorum設定 (4%/8%/15% by proposalType)
   - veQS投票力スナップショット統合

2. **GOV-002**: Proposal作成・投票フロー
   - propose() - 提案作成
   - castVote() / castVoteWithReason() - 投票
   - 議論期間7日 + 投票期間7日
   - Event発行 (ProposalCreated, VoteCast, ProposalExecuted)

### Day 3-4: Timelock + Security Council

3. **GOV-003**: Timelock.sol実装
   - 7日間Time Lock (MIN_DELAY = 7 days)
   - schedule() - 実行スケジュール
   - execute() - Time Lock後実行
   - cancel() - キャンセル機能
   - CP-3準拠: Time Lock 0への変更不可

4. **GOV-004**: Security Council連携
   - SecurityCouncil.sol (6名マルチシグ)
   - Veto権限 (6/9で可決提案を拒否可能)
   - Purpose Committee連携（理念チェック）

### Day 5-6: Emergency + 統合

5. **GOV-005**: Emergency Pause拡張
   - EmergencyController.sol
   - pause() - SC 5/9で発動
   - 最大72時間 + Token Vote延長
   - unpause() - 復旧
   - Sequence #8準拠

6. **GOV-006**: Governance統合テスト
   - 全コンポーネント結合
   - E2Eテストシナリオ
   - ガス最適化確認

### Day 7: PIR準備

7. PIR-P3.2-004準備
   - コード整理、警告削除
   - テストカバレッジ確認
   - ドキュメント更新

---

## Core Principles確認

| CP | 原則 | 準拠確認 |
|----|------|----------|
| CP-1 | 完全量子耐性 | ✅ SHA3-256のみ使用、keccak256禁止 |
| CP-2 | Self-Custody | ✅ ユーザー署名でpropose/vote |
| CP-3 | Time Lock存在 | ✅ 7日Time Lock、削除不可 |
| CP-4 | Slashing存在 | ✅ 既存CoreSlashingと連携 |
| CP-5 | 透明性 | ✅ 全操作Event発行、オンチェーン検証可能 |

---

## Modular Architecture確認（Phase 3）

| Layer | 確認事項 | 状態 |
|-------|----------|:----:|
| Core Layer | CP保護機構含む、Governance OFF時も基本機能動作 | ✅ |
| Governance Layer | ON/OFF切替可能、GovernanceSwitch統合 | ✅ |
| Token Layer | veQS投票統合、TokenSwitch連携 | ✅ |
| Layer間依存 | 下位→上位依存なし | ✅ |

### モード別動作確認

| Governanceモード | Sequence #7 | Sequence #8 |
|-----------------|-------------|-------------|
| CENTRALIZED | ❌ 無効 | Admin単独Pause |
| MULTISIG | ❌ 無効 | N/M承認Pause |
| DECENTRALIZED | ✅ veQS投票 | SC 5/9 Pause |

---

## リスク・懸念事項

| # | リスク | 重要度 | 対策 |
|---|--------|--------|------|
| 1 | veQS統合複雑性 | 🟠 Medium | 既存veQS実装を活用、単体テスト強化 |
| 2 | Time Lock回避攻撃 | 🟠 Medium | ReentrancyGuard、CP-3強制検証 |
| 3 | SC Veto濫用 | 🟡 Low | Veto条件を理念違反のみに限定 |

---

## 成功基準

| 基準 | 条件 | 目標 |
|------|------|------|
| 実装完了 | GOV-001〜006全完了 | 6/6 |
| テスト | 全テストPASS | 100% |
| 警告 | コンパイラ警告0 | 0 |
| CP準拠 | CP-1〜5全準拠 | ✅ |
| PIR | PIR-P3.2-004 PASS | PASS |

---

## PIR準備チェックリスト

- [ ] 全タスク(GOV-001〜006)完了
- [ ] 全テストPASS
- [ ] コンパイラ警告0
- [ ] keccak256使用なし確認
- [ ] SEQUENCES v2.0準拠確認
- [ ] CURRENT_STATE.md更新
- [ ] コードレビュー完了

---

**END OF CURRENT PLAN**
