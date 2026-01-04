# Current Plan

> **Generated**: 2026-01-03 19:00 JST
> **Phase**: 3.3 Decentralize + Testing
> **Sub-Phase**: Track B E2E Testing (Weeks 12-14)

---

## 対象チェックリスト

`docs/checklists/phase3.3.md` - Track B: E2E Testing & Validation

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
| #5 Prover Registration | Core + Governance | SEQUENCES §5 |
| #6 Prover Exit | Core + Governance | SEQUENCES §6 |
| #7 Governance Proposal | Governance | SEQUENCES §7 |
| #8 Emergency Pause | Core + Governance | SEQUENCES §8 |

### セキュリティ要件

| 要件 | 仕様書出典 | テスト方法 |
|------|----------|------------|
| 24h Time Lock (Normal) | SEQ#2 Step8 | E2E Test (TEST-001) |
| 7d Time Lock (Emergency) | SEQ#3 Step5 | E2E Test (TEST-001) |
| Emergency Bond | SEQ#3 | E2E Test (TEST-001) |
| Quadratic Slashing N²×10% | SEQ#4 | E2E Test (TEST-001) + Fuzz (TEST-002) |
| 2/5 Prover署名 (SPHINCS+) | UNIFIED Phase1 | E2E Test (TEST-001) |
| 72h Emergency Timeout | SEQ#3 条件 | E2E Test (TEST-001) |
| 72h Pause上限 | SEQ#8 | E2E Test (TEST-001) |
| VRF Prover選出 | SEQ#2 Step2-3 | E2E Test (TEST-001) |
| SHA3-256使用 (CP-1) | CORE_PRINCIPLES | Slither (TEST-004) |
| keccak256禁止 (CP-1) | CORE_PRINCIPLES | Slither (TEST-004) |

---

## 戦略準拠確認（Phase 3）

> 参照: `docs/planning/PHASE3_STRATEGY.md`

- [x] L3スタック: 独自L3 (l3-aegis) 前提
- [x] アーキテクチャ: Modular (Core/Governance/Token Layer)
- [x] リスク緩和: セキュリティ監査、TVL制限、Bug Bounty準備
- [x] モード制約: TRAINING → DECENTRALIZED 遷移テスト

---

## L3基盤確認（Phase 3のL3関連タスク）

> 参照: `docs/aegis/meetings/L3_INFRASTRUCTURE_FINAL_DECISION_2025-12-28.md`

- [x] 独自4ノードBFTチェーン前提か
- [x] l3-aegis (Rust) の範囲内か
- [x] SEQUENCES v2.0に準拠しているか
- [x] CP-1/CP-5を満たしているか

---

## IC完全性チェック（Phase 3）

> 参照: `docs/aegis/QUANTUM_SHIELD_UNIFIED_SPEC_v2.0.md` §Implementation Components

### 今回スコープのIC

| IC-ID | Component | タスク | Status |
|-------|-----------|--------|--------|
| IC-1 | L3 Chain Infrastructure | TEST-006, TEST-007, TEST-010 | 🟢 Complete (テスト対象) |
| IC-2 | L3 Bridge Contract | TEST-001, TEST-002 | 🟢 Complete (テスト対象) |
| IC-3 | Sequencer | TEST-001, TEST-007 | 🟢 Complete (テスト対象) |
| IC-4 | State Management (SMT) | TEST-001 | 🟢 Complete (テスト対象) |
| IC-5 | veQS Token | TEST-001, TEST-002, TEST-008 | 🟢 Complete (テスト対象) |

### マスタ照合

- [x] 全IC-ID（IC-1〜IC-5）がPHASE3_PLANに対応セクションを持つ
- [x] 欠落ICなし（IC-6不要、IC-7はPhase 4）

### タスク紐付け

- [x] 今回スコープの全タスクにIC-IDを付与した
- [x] TEST-*タスクは複数ICに跨るため、テスト対象として紐付け

---

## 前回レビュー課題

> CURRENT_STATE.mdより自動取得

✅ **未解決課題なし** - Track A Decentralize完了、全PIR PASS

---

## 今回のスコープ

### 実装項目（なし - テストフェーズ）

なし（Track A完了済み）

### テスト項目

#### B1. 統合テスト

| # | タスク | IC | 優先度 | 内容 |
|---|--------|-----|--------|------|
| TEST-001 | E2E統合テスト（全Sequence #1-8） | IC-1〜5 | 🔴 P0 | Lock→Unlock→Challenge全フロー |
| TEST-002 | Fuzzテスト拡充（veQS/Governance/Sequencer） | IC-3, IC-5 | 🟠 High | 境界値・異常系テスト |
| TEST-003 | Gas最適化検証（Phase 2比較） | IC-2 | 🟠 High | ガス消費量ベンチマーク |

#### B2. セキュリティテスト

| # | タスク | IC | 優先度 | 内容 |
|---|--------|-----|--------|------|
| TEST-004 | Slither静的解析（High/Medium=0必須） | All | 🔴 P0 | 全コントラクトフルスキャン |
| TEST-005 | セキュリティテスト（Red Team攻撃ベクトル） | All | 🔴 P0 | 主要攻撃パターン検証 |
| TEST-006 | 4BFT consensus security audit | IC-1 | 🔴 P0 | コンセンサスセキュリティ検証 |

#### B3. Decentralize統合テスト

| # | タスク | IC | 優先度 | 内容 |
|---|--------|-----|--------|------|
| TEST-007 | Multi-sequencer E2E | IC-3 | 🔴 P0 | Rotation/Failover統合テスト |
| TEST-008 | SC election & voting E2E | IC-5 | 🟠 High | veQS選挙統合テスト |
| TEST-009 | Governance mode transition E2E | - | 🟠 High | TRAINING→DECENTRALIZED遷移テスト |
| TEST-010 | Full system E2E（L1+L3+Token+Governance） | IC-1〜5 | 🔴 P0 | 全システム統合テスト |

---

## 参照ドキュメント

| 種類 | ドキュメント | 参照セクション |
|------|------------|---------------|
| 仕様書-戦略ブリッジ | `docs/planning/SPEC_STRATEGY_BRIDGE.md` | §3, §5, §10 |
| Sequence仕様 | `docs/aegis/QUANTUM_SHIELD_SEQUENCES_v2.0.md` | #1-8 |
| 全体仕様 | `docs/aegis/QUANTUM_SHIELD_UNIFIED_SPEC_v2.0.md` | §IC |
| 戦略 | `docs/planning/PHASE3_STRATEGY.md` | 全体 |
| L3基盤決議 | `docs/aegis/meetings/L3_INFRASTRUCTURE_FINAL_DECISION_2025-12-28.md` | 全体 |
| L3詳細仕様 | `docs/aegis/L3_CHAIN_SPECIFICATION.md` | §3 |
| Phase 3.3チェックリスト | `docs/checklists/phase3.3.md` | Track B |
| PIR-P3.3-001 | `docs/aegis/meetings/PIR-P3.3-001.md` | 全体 |
| PIR-P3.3-002 | `docs/aegis/meetings/PIR-P3.3-002.md` | 全体 |
| PIR-P3.3-003 | `docs/aegis/meetings/PIR-P3.3-003.md` | 全体 |

---

## 成果物

| ファイル | 説明 | IC-ID |
|---------|------|-------|
| `l3-aegis/test/e2e/FullSequenceE2E.t.sol` | Sequence #1-8 E2Eテスト | IC-1〜5 |
| `l3-aegis/test/fuzz/VeQSFuzz.t.sol` | veQS Fuzzテスト | IC-5 |
| `l3-aegis/test/fuzz/GovernanceFuzz.t.sol` | Governance Fuzzテスト | - |
| `l3-aegis/test/fuzz/SequencerFuzz.t.sol` | Sequencer Fuzzテスト | IC-3 |
| `l3-aegis/test/security/SlitherReport.md` | Slither分析レポート | All |
| `l3-aegis/test/security/RedTeamReport.md` | Red Teamレポート | All |
| `l3-aegis/test/e2e/MultiSequencerE2E.t.sol` | Multi-sequencer E2E | IC-3 |
| `l3-aegis/test/e2e/SCElectionE2E.t.sol` | SC選挙E2E | IC-5 |
| `l3-aegis/test/e2e/GovernanceModeE2E.t.sol` | Governance遷移E2E | - |
| `l3-aegis/test/e2e/FullSystemE2E.t.sol` | 全システムE2E | IC-1〜5 |

---

## 実行順序

### Week 12: B1 統合テスト + B2 セキュリティテスト開始

1. **TEST-001** E2E統合テスト（全Sequence #1-8）
   - Lock → Unlock Normal → Time Lock → Claim フロー
   - Lock → Unlock Emergency → 7d Time Lock → Claim フロー
   - Challenge → Slashing → 分配 フロー
   - Prover Registration → Exit フロー
   - Governance Proposal → Vote → Execute フロー
   - Emergency Pause → Recovery フロー

2. **TEST-002** Fuzzテスト拡充
   - veQS: ロック期間、投票権計算境界値
   - Governance: 閾値投票、Quorum境界値
   - Sequencer: Rotation境界値、Slashing計算

3. **TEST-003** Gas最適化検証
   - Phase 2との比較レポート作成
   - ボトルネック特定

4. **TEST-004** Slither静的解析
   - 全コントラクトフルスキャン
   - High/Medium Issue = 0 必達

### Week 13: B2 セキュリティテスト + B3 Decentralize統合

5. **TEST-005** Red Teamセキュリティテスト
   - Reentrancy攻撃
   - Flash loan攻撃
   - Governance攻撃（投票操作）
   - Oracle操作
   - Slashing回避

6. **TEST-006** 4BFT consensus security audit
   - Byzantine fault tolerance検証（再テスト）
   - Leader election操作検証
   - Network partition攻撃

7. **TEST-007** Multi-sequencer E2E
   - Rotation E2E（10s timeout）
   - Failover E2E（障害復旧）
   - Slashing E2E（不正検出→Slash）

8. **TEST-008** SC election & voting E2E
   - veQS投票→SC選出
   - Term rotation
   - Emergency powers発動

### Week 14: B3 Decentralize統合 + GONOGO準備

9. **TEST-009** Governance mode transition E2E
   - TRAINING → CENTRALIZED → MULTISIG → DECENTRALIZED
   - Emergency rollback
   - Mode-specific機能テスト

10. **TEST-010** Full system E2E
    - L1 + L3 + Token + Governance + Sequencer統合
    - 全コンポーネント連携テスト
    - 負荷テスト（TPS検証）

11. **PIR-P3.3-004** 最終レビュー
    - TEST-001~010結果レビュー
    - 残課題特定

12. **GONOGO-001~003** Go/No-Go判定準備
    - PIR Final Review
    - 11エージェント投票準備
    - 判定書作成

---

## Core Principles確認

- [x] CP-1: 完全量子耐性 - 違反なし（SHA3-256, Dilithium, SPHINCS+使用）
- [x] CP-2: Self-Custody - 違反なし（ユーザー署名検証）
- [x] CP-3: Time Lock存在 - 違反なし（24h Normal, 7d Emergency）
- [x] CP-4: Slashing存在 - 違反なし（Quadratic N²×10%）
- [x] CP-5: 透明性 - 違反なし（全操作L3記録）

---

## Modular Architecture確認（Phase 3）

- [x] Core Layer: CP保護機構含む（ALWAYS ON）
- [x] Governance Layer: ON/OFF切替可能（TEST-009で検証）
- [x] Token Layer: ON/OFF切替可能
- [x] Layer間依存: 下位→上位依存なし

---

## リスク・懸念事項

| # | リスク | 重要度 | 緩和策 |
|---|--------|--------|--------|
| 1 | E2Eテストの複雑性 | 🟠 HIGH | 段階的実装、モジュラーテスト設計 |
| 2 | Slither High/Medium Issue発見 | 🟠 HIGH | 発見時は即時修正、PIR再実施 |
| 3 | Red Team攻撃ベクトル発見 | 🔴 CRITICAL | 発見時は即時修正、外部監査チームへ報告 |
| 4 | Full System E2E環境構築 | 🟠 HIGH | ローカル環境でのモック活用 |

---

## 成功基準

| 基準 | 条件 | 目標 |
|------|------|------|
| E2E統合テスト | TEST-001~003 全PASS | ✅ |
| セキュリティテスト | TEST-004 High/Medium=0 | ✅ |
| Decentralize統合 | TEST-007~010 全PASS | ✅ |
| PIR Final | PIR-P3.3-004 PASS | ✅ |
| Go/No-Go | 80点以上 | GO |

---

**END OF CURRENT PLAN**
