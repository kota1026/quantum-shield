# Current Plan

> **Generated**: 2026-01-02 12:00 JST  
> **Phase**: 3.2 Implementation  
> **Sub-Phase**: Week 9-10 監査準備・Go/No-Go  
> **Planning Agent**: PM  
> **Mode**: 計画 (Planner)

---

## 対象チェックリスト

`docs/checklists/phase3.2.md`

---

## 仕様書参照（必須）

> 参照: `docs/planning/SPEC_STRATEGY_BRIDGE.md`

### 対象Sequence

Week 9-10は実装フェーズではなく監査準備フェーズのため、新規Sequence実装はなし。
既存Sequence (#1-8) の統合テストとセキュリティ検証を実施。

| Sequence | 検証対象 | テスト種別 |
|----------|----------|-----------|
| #1 Lock | CoreBridge.lock() | E2E, Fuzz |
| #2 Unlock (Normal) | CoreBridge.unlock() | E2E, Fuzz |
| #3 Unlock (Emergency) | CoreBridge.emergencyUnlock() | E2E, Fuzz, Security |
| #3' Resync | CoreBridge.resync() | E2E |
| #4 Challenge + Slashing | CoreSlashing.challenge() | E2E, Fuzz, Security |
| #5 Prover Registration | Registration flow | E2E |
| #6 Prover Exit | Exit flow | E2E |
| #7 Governance Proposal | Governor.propose/castVote | E2E, Fuzz, Security |
| #8 Emergency Pause | EmergencyController.pause() | E2E, Security |

### セキュリティ要件検証マトリクス

| 要件 | 仕様書出典 | 検証方法 | TEST ID |
|------|-----------|---------|---------|
| 24h Time Lock (Normal) | SEQ#2 Step8 | E2E Test + Fuzz | TEST-001 |
| 7d Time Lock (Emergency) | SEQ#3 Step5 | E2E Test | TEST-001 |
| Emergency Bond計算 | SEQ#3 | Unit Test + Fuzz | TEST-002 |
| Quadratic Slashing N²×10% | SEQ#4 | Unit Test + Fuzz | TEST-002 |
| 72h Emergency Timeout | SEQ#3 条件 | E2E Test | TEST-001 |
| 72h Pause上限 | SEQ#8 | E2E Test | TEST-001, TEST-005 |
| SC 5/9 Pause権限 | UNIFIED §Gov | Security Test | TEST-005 |
| keccak256禁止 | CP-1 | Slither + Manual | TEST-004 |

---

## 戦略準拠確認（Phase 3）

> 参照: `docs/planning/PHASE3_STRATEGY.md`

- [x] L3スタック: 独自L3 (l3-aegis) 前提
- [x] アーキテクチャ: Modular (Core/Governance/Token Layer)
- [x] リスク緩和: 監査実施予定、Bug Bounty準備（本タスク）
- [x] モード制約: DECENTRALIZED + FULL Token（Phase 3.2構成）

---

## L3基盤確認

> 参照: `docs/aegis/meetings/L3_INFRASTRUCTURE_FINAL_DECISION_2025-12-28.md`

- [x] 独自4ノードBFTチェーン前提か → ✅ l3-aegis稼働中
- [x] l3-aegis (Rust) の範囲内か → ✅ aegis-sequencer含む
- [x] SEQUENCES v2.0に準拠しているか → ✅ PIR-P3.2-001~004 PASS
- [x] CP-1/CP-5を満たしているか → ✅ keccak256完全排除

---

## IC完全性チェック（Phase 3）

> 参照: `docs/aegis/QUANTUM_SHIELD_UNIFIED_SPEC_v2.0.md` §Implementation Components

### 今回スコープのIC

Week 9-10は監査準備フェーズのため、新規IC実装はなし。全IC統合検証を実施。

| IC-ID | Component | Phase 3.2 Status | 検証対象 |
|-------|-----------|------------------|----------|
| IC-1 | L3 Chain Infrastructure | ✅ COMPLETE | E2E Test対象 |
| IC-2 | L3 Bridge Contract | ✅ COMPLETE | E2E Test対象 |
| IC-3 | Sequencer | ✅ 8/8 COMPLETE + PIR PASS | Fuzz Test対象 |
| IC-4 | State Management | ✅ COMPLETE | E2E Test対象 |
| IC-5 | veQS Token | ✅ 10/10 COMPLETE + PIR PASS | Fuzz Test対象 |
| ~~IC-6~~ | ~~Node Expansion~~ | ❌ 不要 | - |
| IC-7 | Permissionless Nodes | ⚪ Phase 4 | - |

### マスタ照合

- [x] 全IC-ID（IC-1〜IC-5）がPHASE3_PLANに対応セクションを持つ
- [x] 欠落ICなし（IC-6は不要、IC-7はPhase 4）

### タスク紐付け

- [x] 今回スコープの全タスクはテスト/監査準備（IC-ID不要）
- [x] IC-ID不要タスク: TEST-001~005, AUDIT-001~003, GONOGO-001~003

---

## 前回レビュー課題

> PIR-P3.2-004 (2026-01-02): ✅ **PASS** (11/11 GO, 全会一致)

| # | 重要度 | 課題 | 対策 | 状態 |
|---|--------|------|------|:----:|
| 1 | 🔴 Critical | keccak256使用（CP-1違反） | SHA3Hasher.hash()に置換 | ✅ 修正済 |
| - | - | Timelock.sol | 45c41ceb | ✅ |
| - | - | SecurityCouncil.sol | 33c407bf | ✅ |
| - | - | EmergencyController.sol | 6c9725ba | ✅ |

**結果**: 🔴 Critical課題 0件、未解決課題なし ✅

---

## 今回のスコープ

### 修正項目（レビュー課題より）

なし（前回PIR後の修正完了済み）

### テスト項目

| # | タスク | IC | 優先度 | 説明 |
|---|--------|-----|--------|------|
| TEST-001 | E2E統合テスト | - | 🔴 **P0** | 全Sequence E2Eシナリオ検証 |
| TEST-002 | Fuzzテスト拡充 | - | 🟠 High | veQS/Governance/Sequencer境界値テスト |
| TEST-003 | Gas最適化検証 | - | 🟠 High | Phase 2比較、L3経済性検証 |
| TEST-004 | Slither静的解析 | - | 🔴 **P0** | High/Medium Issue = 0 必須 |
| TEST-005 | セキュリティテスト | - | 🔴 **P0** | Red Team攻撃ベクトル検証 |

### 監査準備項目

| # | タスク | IC | 優先度 | 説明 |
|---|--------|-----|--------|------|
| AUDIT-001 | 監査資料準備 | - | 🟠 High | アーキテクチャ文書、テスト結果、コードベース整理 |
| AUDIT-002 | Bug Bounty準備 | - | 🟠 High | スコープ定義、報酬設計、プラットフォーム選定 |
| AUDIT-003 | 外部監査RFP | - | 🟠 High | 監査会社候補選定、RFP発行、日程調整 |

### Go/No-Go項目

| # | タスク | IC | 優先度 | 説明 |
|---|--------|-----|--------|------|
| GONOGO-001 | PIR最終レビュー | - | 🟠 High | PIR-P3.2-001~004総括 |
| GONOGO-002 | Go/No-Go判定会議 | - | 🔴 **P0** | 11エージェント投票、80点以上でGO |
| GONOGO-003 | 判定書作成 | - | 🟠 High | GONOGO_PHASE3.2_IMPLEMENTATION_*.md |

---

## 参照ドキュメント

| 種類 | ドキュメント | 参照セクション |
|------|------------|---------------|
| 仕様書-戦略ブリッジ | `docs/planning/SPEC_STRATEGY_BRIDGE.md` | §3 Sequence, §5 Security |
| Sequence仕様 | `docs/aegis/QUANTUM_SHIELD_SEQUENCES_v2.0.md` | #1-8 全Sequence |
| 全体仕様 | `docs/aegis/QUANTUM_SHIELD_UNIFIED_SPEC_v2.0.md` | §IC, §Security |
| 戦略 | `docs/planning/PHASE3_STRATEGY.md` | リスク緩和策 |
| L3基盤決議 | `docs/aegis/meetings/L3_INFRASTRUCTURE_FINAL_DECISION_2025-12-28.md` | 全体 |
| L3詳細仕様 | `docs/aegis/L3_CHAIN_SPECIFICATION.md` | テスト要件 |
| Phase 3計画 | `docs/planning/PHASE3_PLAN.md` | §Audit |
| Phase 3.2チェックリスト | `docs/checklists/phase3.2.md` | Week 9-10 |
| 監査RFPドラフト | `docs/planning/AUDIT_RFP_DRAFT.md` | 全体 |
| PIR-P3.2-004 | `docs/aegis/meetings/PIR-P3.2-004.md` | Post-PIR修正 |

---

## 成果物

| ファイル | 説明 | IC-ID |
|---------|------|-------|
| E2E Test Results | 全Sequence統合テスト結果 | - |
| Fuzz Test Results | 境界値テスト結果 | - |
| Gas Report | Gas消費量比較レポート | - |
| Slither Report | 静的解析結果 (0 High/Medium) | - |
| Security Test Report | Red Team検証結果 | - |
| Audit Package | 監査用資料一式 | - |
| Bug Bounty Spec | Bug Bountyスコープ・報酬設計 | - |
| Audit RFP | 外部監査RFP最終版 | - |
| `docs/decisions/GONOGO_PHASE3.2_*.md` | Go/No-Go判定書 | - |

---

## 実行順序

### Day 1: 静的解析・環境準備

1. **TEST-004**: Slither静的解析
   ```bash
   cd l3-aegis
   slither src/ --solc-remaps @openzeppelin=lib/openzeppelin-contracts
   ```
   - 全コントラクト解析
   - High/Medium Issue → 0件確認
   - 既知のlow/informational確認

2. **E2E準備**: テスト環境構築
   - Foundry fork mode設定
   - テストシナリオ確認

### Day 2-3: E2E統合テスト

3. **TEST-001**: E2E統合テスト
   - Sequence #1 Lock E2E
   - Sequence #2 Unlock (Normal) E2E
   - Sequence #3 Emergency Unlock E2E
   - Sequence #4 Challenge + Slashing E2E
   - Sequence #7 Governance Proposal E2E
   - Sequence #8 Emergency Pause E2E
   - **全レイヤー統合**: Core → Governance → Token連携

### Day 3-4: Fuzz + Security

4. **TEST-002**: Fuzzテスト拡充
   - veQS Token: lock/unlock/delegate境界値
   - Governance: propose/vote/execute境界値
   - Sequencer: batch/rotation境界値
   - Slashing: N²×10%計算オーバーフロー検証

5. **TEST-005**: セキュリティテスト
   - Red Team Attack Vectors:
     - Reentrancy攻撃
     - Flash loan攻撃
     - Governance manipulation
     - Time lock bypass試行
     - Emergency bond計算悪用
   - 既存緩和策の有効性確認

### Day 5: Gas最適化検証

6. **TEST-003**: Gas最適化検証
   - Phase 2との比較
   - L3 Bridge操作のGas消費
   - veQS操作のGas消費
   - Governance操作のGas消費
   - 閾値超過項目の特定と最適化検討

### Day 6: 監査準備

7. **AUDIT-001**: 監査資料準備
   - アーキテクチャ文書最終化
   - テスト結果取りまとめ
   - コードベースクリーンアップ
   - NatSpec docstring確認

8. **AUDIT-002**: Bug Bounty準備
   - スコープ定義（Core Layer, Governance, Token）
   - 報酬設計（Critical: $50K, High: $20K, Medium: $5K）
   - Immunefi/Code4renaプラットフォーム検討

9. **AUDIT-003**: 外部監査RFP
   - 監査会社候補: Trail of Bits, OpenZeppelin, Consensys Diligence
   - RFP発行
   - 日程調整（Phase 4 Month 21目標）

### Day 7: Go/No-Go

10. **GONOGO-001**: PIR最終レビュー
    - PIR-P3.2-001~004の総括
    - 未解決課題確認

11. **GONOGO-002**: Go/No-Go判定会議
    - 11エージェント投票
    - 80点以上でGO判定

12. **GONOGO-003**: 判定書作成
    - `docs/decisions/GONOGO_PHASE3.2_IMPLEMENTATION_2026-01-XX.md`

---

## Core Principles確認

- [x] CP-1: 完全量子耐性 - ✅ keccak256完全排除達成
- [x] CP-2: Self-Custody - ✅ ユーザー署名検証維持
- [x] CP-3: Time Lock存在 - ✅ 7日MIN_DELAY (Governance), 24h/7d (Bridge)
- [x] CP-4: Slashing存在 - ✅ Quadratic N²×10%
- [x] CP-5: 透明性 - ✅ 全操作Event発行、L3記録

---

## Modular Architecture確認（Phase 3）

- [x] Core Layer: CP保護機構含む（CoreBridge, CoreSlashing, CoreState）
- [x] Governance Layer: ON/OFF切替可能（GovernanceSwitch）
- [x] Token Layer: ON/OFF切替可能（TokenSwitch）
- [x] Layer間依存: 下位→上位依存なし確認済み

---

## リスク・懸念事項

| # | 懸念 | 重要度 | 緩和策 |
|---|------|--------|--------|
| 1 | Slither誤検知 | 🟡 Medium | マニュアルレビューで補完 |
| 2 | E2Eテスト環境構築遅延 | 🟠 High | 既存Foundry環境活用 |
| 3 | 監査会社スケジュール | 🟠 High | 複数社に同時RFP |
| 4 | Bug Bounty報酬予算 | 🟡 Medium | 段階的報酬設計 |

---

## 現在のテスト状況

| テストスイート | Passed | Failed | Skipped | Warnings |
|---------------|:------:|:------:|:-------:|:--------:|
| l3-aegis (Cargo) | 239 | 0 | 0 | 0 ✅ |
| l3-aegis (Foundry) | 355 | 0 | 130 | - |
| **合計** | **594** | **0** | **130** | **0** |

**目標**: 
- Skipped 130 → 有効化検討（必要なもののみ）
- 新規E2E/Fuzzテスト追加
- 全テスト 0 failures維持

---

## 成功基準

| 基準 | 条件 | 目標 |
|------|------|------|
| Phase 3.2タスク完了 | 39/39 タスク完了 | 100% |
| Slither | High/Medium Issue = 0 | ✅ |
| E2E | 全Sequence PASS | ✅ |
| Fuzz | 全境界値テストPASS | ✅ |
| Security | Red Team PASS | ✅ |
| CP準拠 | CP-1〜5 全て準拠 | ✅ (既達成) |
| PIR | PIR-P3.2-005 PASS | PASS |
| Go/No-Go | 80点以上 | GO |

---

## 次のPIR

| PIR ID | 対象 | 予定 |
|--------|------|------|
| PIR-P3.2-005 | TEST-001~005, AUDIT-001~003, GONOGO-001~003 | Week 9-10終了後 |

---

**END OF CURRENT PLAN**
