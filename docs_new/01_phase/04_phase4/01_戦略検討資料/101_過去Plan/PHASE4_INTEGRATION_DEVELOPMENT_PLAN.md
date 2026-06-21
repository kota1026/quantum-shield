# Phase 4 統合開発計画書

> **Version**: 1.0  
> **Date**: 2026-01-04  
> **Author**: Claude (11-Agent Strategic Meeting Support)  
> **Status**: 📋 DRAFT - Kota承認待ち

---

## 目次

1. [エグゼクティブサマリー](#1-エグゼクティブサマリー)
2. [現状分析](#2-現状分析)
3. [統合開発アプローチ](#3-統合開発アプローチ)
4. [Phase 4移行計画](#4-phase-4移行計画)
5. [エージェントプロンプト統合](#5-エージェントプロンプト統合)
6. [実装フェーズへの移行](#6-実装フェーズへの移行)
7. [リスクと緩和策](#7-リスクと緩和策)
8. [次のステップ](#8-次のステップ)

---

## 1. エグゼクティブサマリー

### 1.1 目的

Phase 4ドキュメント（`docs_new/01_phase/04_phase4/`）を基盤として、エージェントプロンプト（`docs_new/02_agents_prompt/02_prompts/`）との連携を確立し、実装フェーズへ円滑に移行する。

### 1.2 現在の成果物

| ドキュメント | サイズ | 内容 |
|-------------|--------|------|
| PHASE4_PLAN.md | 24KB | 8週間実装計画、週次スケジュール |
| SEQUENCE_IMPLEMENTATION_MAP.md | 24KB | シーケンス別実装マッピング |
| INTEGRATED_SYSTEM_BLUEPRINT_JP.md | 28KB | 統合ブループリント |
| UI_UX_FUNCTIONAL_REQUIREMENTS_JP.md | 23KB | UI/UX機能要件 |
| EVENT_BRIDGE_SPEC.md | 22KB | Event Bridge仕様 |
| EDITION_SWITCH_SPEC.md | 31KB | Edition切替仕様 |
| PROVER_REGISTRATION_FLOW.md | 41KB | Prover登録フロー |
| TEST_STRATEGY.md | 32KB | E2Eテスト戦略 |
| CDO_CIA_REVIEW_REPORT.md | 8KB | CDO/CIAレビュー結果 |
| AGENT_MEETING_MINUTES_20260104.md | 8KB | 会議議事録 |
| phase4.md | 7KB | Phase 4チェックリスト |

### 1.3 主要決定事項（2026-01-04会議）

| 決定 | 内容 |
|------|------|
| Relayer構成 | Multi-Relayer (2台初期) |
| Dilithium WASM性能目標 | <500ms |
| SP Portal | Phase 4.5に延期 |
| プロンプト構造 | ベース+モジュール方式 |

---

## 2. 現状分析

### 2.1 Phase 3.3完了状況

```
┌─────────────────────────────────────────────────────────────┐
│  Phase 3.3: Decentralize + Testing                          │
│  ─────────────────────────────────────────────────────────  │
│  Track A: Decentralize     ✅ 19/19 COMPLETE (100%)         │
│  Track B: E2E Testing      🔄 IC-2 CONDITIONAL PASS         │
│  ─────────────────────────────────────────────────────────  │
│  次のステップ: TEST-004 Slitherフルスキャン                 │
│  Phase 4前提条件: Track B E2E Testing完了                   │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 エージェントプロンプト現状

| プロンプト | 状態 | 課題 |
|-----------|:----:|------|
| 01_plan.md | ✅ Phase 4対応済み | - |
| 02_spec.md | ⚠️ 古いパス参照 | `docs/` → `docs_new/` 移行必要 |
| 03_impl.md | ⚠️ 古いパス参照 | Phase 4セクション追加必要 |
| 04_review.md | ⚠️ 古いパス参照 | `docs/` → `docs_new/` 移行必要 |
| 05_pir.md | ⚠️ 古いパス参照 | `docs/` → `docs_new/` 移行必要 |
| 06_update.md | ⚠️ 古いパス参照 | `docs/` → `docs_new/` 移行必要 |
| 07_gonogo.md | ⚠️ 古いパス参照 | Phase 4基準追加必要 |

### 2.3 ドキュメント参照関係

```
docs_new/
├── 00_core/                          # 憲法・仕様書
│   ├── CORE_PRINCIPLES.md
│   ├── specs/                        # 仕様書群
│   │   ├── SPEC_STRATEGY_BRIDGE.md
│   │   ├── L3_CHAIN_SPECIFICATION.md
│   │   └── MODULAR_ARCHITECTURE.md
│   └── sequences/                    # シーケンス定義
│
├── 01_phase/                         # フェーズ別
│   ├── CURRENT_STATE.md             # ← エージェントが参照
│   ├── CURRENT_PLAN.md              # ← 01_plan.md が生成
│   ├── 03_Phase3/                   # Phase 3ドキュメント
│   └── 04_phase4/                   # ★ Phase 4ドキュメント（今回作成）
│       ├── PHASE4_PLAN.md
│       ├── SEQUENCE_IMPLEMENTATION_MAP.md
│       ├── UI_UX_FUNCTIONAL_REQUIREMENTS_JP.md
│       └── ...
│
└── 02_agents_prompt/                # エージェントプロンプト
    ├── 01_Agent strategic meeting format/
    └── 02_prompts/                  # ★ 修正対象
        ├── 01_plan.md              # ✅ Phase 4対応済み
        ├── 02_spec.md              # ⚠️ 修正必要
        ├── 03_impl.md              # ⚠️ 修正必要
        ├── 04_review.md            # ⚠️ 修正必要
        ├── 05_pir.md               # ⚠️ 修正必要
        ├── 06_update.md            # ⚠️ 修正必要
        └── 07_gonogo.md            # ⚠️ 修正必要
```

---

## 3. 統合開発アプローチ

### 3.1 3フェーズアプローチ

```
┌─────────────────────────────────────────────────────────────┐
│  Phase A: プロンプト連携確立 (今回)                         │
│  ─────────────────────────────────────────────────────────  │
│  ・Phase 4ドキュメントとエージェントプロンプトの参照確立    │
│  ・CURRENT_STATE.md更新によるPhase 4移行準備                │
│  ・実装優先順位の確定                                       │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  Phase B: プロンプト修正 (次回セッション)                   │
│  ─────────────────────────────────────────────────────────  │
│  ・02_spec.md ~ 07_gonogo.md のパス参照修正                 │
│  ・Phase 4固有セクションの追加                              │
│  ・テスト・検証                                             │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  Phase C: 実装フェーズ開始 (プロンプト修正後)               │
│  ─────────────────────────────────────────────────────────  │
│  ・01_plan.mdによるCURRENT_PLAN.md生成                     │
│  ・Week 1: Event Bridge実装                                 │
│  ・週次PIRサイクル開始                                      │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Phase 4ドキュメント参照マップ

エージェントプロンプトが参照すべきPhase 4ドキュメント:

| プロンプト | Phase 4参照ドキュメント | 参照目的 |
|-----------|------------------------|----------|
| 01_plan.md | PHASE4_PLAN.md | 週次スケジュール、タスクID |
| 01_plan.md | SEQUENCE_IMPLEMENTATION_MAP.md | 実装対象シーケンス特定 |
| 02_spec.md | EVENT_BRIDGE_SPEC.md, EDITION_SWITCH_SPEC.md | 仕様詳細 |
| 03_impl.md | PROVER_REGISTRATION_FLOW.md | 実装フロー |
| 03_impl.md | UI_UX_FUNCTIONAL_REQUIREMENTS_JP.md | UI実装要件 |
| 04_review.md | TEST_STRATEGY.md | テスト基準 |
| 07_gonogo.md | PHASE4_PLAN.md §9 | Go/No-Go判定基準 |

---

## 4. Phase 4移行計画

### 4.1 Phase 3.3完了条件（前提）

| 条件 | 現状 | 必要アクション |
|------|:----:|----------------|
| Track A Decentralize | ✅ 100% | - |
| IC-2 CoreLayer | ⚠️ CONDITIONAL | STARK Verifier統合（Phase 4内で対応可） |
| TEST-004 Slither | ⬜ | 実行必須 |
| TEST-005 Red Team | ⬜ | 実行必須 |
| TEST-006~010 | ⬜ | Phase 4並行可 |

### 4.2 Phase 4開始判定基準

```markdown
Phase 4開始 Go/No-Go チェックリスト:

必須条件（ALL PASS）:
- [ ] Track A Decentralize 100%完了
- [ ] TEST-004 Slither Critical/High = 0
- [ ] TEST-005 Red Team 重大脆弱性 = 0
- [ ] IC-2 CONDITIONAL条件の対応計画確定

推奨条件:
- [ ] TEST-006~010の50%以上完了
- [ ] Phase 4ドキュメント承認済み（本計画含む）
```

### 4.3 CURRENT_STATE.md更新案

Phase 4移行時のCURRENT_STATE.md更新内容:

```markdown
## 🎯 現在地サマリー

┌─────────────────────────────────────────────────────────────┐
│  Phase: 4 - Integration & Launch                            │
│  Sub-Phase: 4.1 Infrastructure - Week 15-17                 │
│  Month: 13 / 24                                             │
│  Active Checklist: docs_new/01_phase/04_phase4/phase4.md    │
│  Status: 🔄 Phase 4開始                                     │
│          ✅ Phase 3.3 Go/No-Go判定完了                      │
│  Tests: [継続追跡]                                          │
│  次のステップ: INFRA-001 Event Bridge設計                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. エージェントプロンプト統合

### 5.1 修正対象サマリー

| ファイル | 修正箇所数 | 優先度 | 工数目安 |
|---------|:----------:|:------:|:--------:|
| 02_spec.md | 5箇所 | P1 | 30分 |
| 03_impl.md | 8箇所 | P1 | 45分 |
| 04_review.md | 4箇所 | P1 | 30分 |
| 05_pir.md | 3箇所 | P1 | 20分 |
| 06_update.md | 2箇所 | P2 | 15分 |
| 07_gonogo.md | 6箇所 | P1 | 40分 |

**合計工数**: 約3時間

### 5.2 パス変換マッピング（共通）

| 旧パス | 新パス |
|--------|--------|
| `docs/constitution/CORE_PRINCIPLES.md` | `docs_new/00_core/CORE_PRINCIPLES.md` |
| `docs/planning/CURRENT_STATE.md` | `docs_new/01_phase/CURRENT_STATE.md` |
| `docs/planning/CURRENT_PLAN.md` | `docs_new/01_phase/CURRENT_PLAN.md` |
| `docs/planning/SPEC_STRATEGY_BRIDGE.md` | `docs_new/00_core/specs/SPEC_STRATEGY_BRIDGE.md` |
| `docs/aegis/QUANTUM_SHIELD_SEQUENCES_v2.0.md` | `docs_new/00_core/sequences/SEQUENCES_v2.0.md` |
| `docs/aegis/L3_CHAIN_SPECIFICATION.md` | `docs_new/00_core/specs/L3_CHAIN_SPECIFICATION.md` |
| `docs/aegis/meetings/` | `docs_new/01_phase/[phase]/meetings/` |
| `docs/aegis/pir/` | `docs_new/01_phase/[phase]/pir/` |
| `docs/specs/MODULAR_ARCHITECTURE.md` | `docs_new/00_core/specs/MODULAR_ARCHITECTURE.md` |
| `docs/checklists/` | `docs_new/01_phase/[phase]/checklists/` |

### 5.3 Phase 4追加セクション（03_impl.md向け）

```markdown
### Phase 4関連タスクの場合（追加確認）

以下のドキュメントを確認すること：

1. **Phase 4計画書**
   - `docs_new/01_phase/04_phase4/PHASE4_PLAN.md`
   - 週次スケジュール、タスクID、依存関係

2. **UI/UX機能要件**
   - `docs_new/01_phase/04_phase4/UI_UX_FUNCTIONAL_REQUIREMENTS_JP.md`
   - ペルソナ別画面フロー、必要API一覧

3. **シーケンス実装マップ**
   - `docs_new/01_phase/04_phase4/SEQUENCE_IMPLEMENTATION_MAP.md`
   - 既存コード、新規必要コード、統合チェックリスト

4. **技術仕様書**（該当タスクに応じて）
   - `docs_new/01_phase/04_phase4/EVENT_BRIDGE_SPEC.md` (INFRA-001~004)
   - `docs_new/01_phase/04_phase4/EDITION_SWITCH_SPEC.md` (API-006)
   - `docs_new/01_phase/04_phase4/PROVER_REGISTRATION_FLOW.md` (UI-013~016)

#### Phase 4実装ガイドライン

| Week | Track | 主要成果物 |
|:----:|-------|-----------|
| W1 | Infrastructure | Event Bridge Service |
| W2 | Infrastructure | Lock/Unlock API, Signature Queue |
| W3 | Client SDK | Dilithium WASM, TypeScript SDK |
| W4-5 | UI/UX | Admin Dashboard MVP |
| W5-6 | UI/UX | End User App MVP |
| W6-7 | Testing | E2E Tests Complete |
| W7-8 | Polish | Prover Dashboard, Documentation |

#### Phase 4制約事項

⚠️ **優先度遵守**: P0タスクは前週完了が必須
⚠️ **依存関係**: Event Bridge → API → SDK → UI の順序厳守
⚠️ **スコープ制限**: SP Portalは Phase 4.5に延期済み
```

---

## 6. 実装フェーズへの移行

### 6.1 Week 1 タスク詳細

Phase 4 Week 1 (INFRA-001~005) の実装準備:

| Task ID | タスク | 優先度 | 成果物 | 依存 |
|---------|--------|:------:|--------|------|
| INFRA-001 | Event Bridge設計 | P0 | EVENT_BRIDGE_SPEC.md確定 | - |
| INFRA-002 | L1→L3 Event Indexer | P0 | `services/event-bridge/indexer/` | INFRA-001 |
| INFRA-003 | L3→L1 Relayer (2台構成) | P0 | `services/event-bridge/relayer/` | INFRA-001 |
| INFRA-004 | Event Bridge統合テスト | P0 | `tests/event-bridge/` | INFRA-002,003 |
| INFRA-005 | HSM_INTEGRATION_SPEC.md | P0 | 仕様書 | - |
| PROMPT-001 | プロンプトパス修正 | P0 | `02_prompts/*.md` | - |

### 6.2 Week 1 実装フロー

```
Day 1-2: INFRA-001 + PROMPT-001
├── Event Bridge設計確定
├── エージェントプロンプトパス修正
└── CURRENT_STATE.md Phase 4移行

Day 3-4: INFRA-002
├── L1 Event Indexer実装
├── PostgreSQL Event Store設計
└── Unit Tests

Day 5-6: INFRA-003
├── L3→L1 Primary Relayer実装
├── Secondary Relayer実装
└── フェイルオーバーロジック

Day 7: INFRA-004 + INFRA-005
├── 統合テスト
├── HSM仕様書作成
└── Week 1 PIR
```

### 6.3 CURRENT_PLAN.md生成テンプレート（Week 1用）

01_plan.mdを使用してWeek 1のCURRENT_PLAN.mdを生成する際のテンプレート:

```markdown
# Current Plan

> **Generated**: 2026-01-XX XX:XX JST
> **Phase**: Phase 4 - Integration & Launch
> **Sub-Phase**: 4.1 Infrastructure - Week 1

## 対象チェックリスト
`docs_new/01_phase/04_phase4/phase4.md`

## 仕様書参照（必須）

> 参照: `docs_new/00_core/specs/SPEC_STRATEGY_BRIDGE.md`

### 対象Sequence
| Sequence | 実装Layer | 仕様書参照箇所 |
|----------|----------|---------------|
| #1 Lock | Core | SEQUENCES §1, EVENT_BRIDGE_SPEC |
| #2 Unlock | Core | SEQUENCES §2, EVENT_BRIDGE_SPEC |
| #3' Resync | Core | SEQUENCES §3', EVENT_BRIDGE_SPEC |

### セキュリティ要件
| 要件 | 仕様書出典 | 実装方法 |
|------|----------|---------|
| Multi-Relayer冗長性 | EVENT_BRIDGE_SPEC §3 | Primary/Secondary構成 |
| イベント改ざん防止 | SEQUENCES §1 | SHA3-256ハッシュ検証 |

## Phase 4準拠確認

> 参照: `docs_new/01_phase/04_phase4/PHASE4_PLAN.md`

- [x] 週次スケジュール: Week 1 (W15) 対象タスク
- [x] 優先度: 全てP0
- [x] 依存関係: Event Bridge → API (Week 2)
- [x] ペルソナスコープ: Admin (監視), System (Event処理)

## 今回のスコープ

### 実装項目
- [ ] [INFRA-001] Event Bridge設計 (IC-EB-001)
- [ ] [INFRA-002] L1→L3 Event Indexer (IC-EB-002)
- [ ] [INFRA-003] L3→L1 Relayer 2台構成 (IC-EB-003)
- [ ] [INFRA-004] Event Bridge統合テスト
- [ ] [INFRA-005] HSM_INTEGRATION_SPEC.md (IC-HSM-001)
- [ ] [PROMPT-001] プロンプトパス修正

### テスト項目
- [ ] [TEST-EB-001] L1イベント取得テスト
- [ ] [TEST-EB-002] L3イベント発行テスト
- [ ] [TEST-EB-003] Relayerフェイルオーバーテスト
- [ ] [TEST-EB-004] 統合シナリオテスト

### 参照ドキュメント
| 種類 | ドキュメント | 参照セクション |
|------|------------|---------------|
| Phase 4計画 | `docs_new/01_phase/04_phase4/PHASE4_PLAN.md` | Week 1, §4.1 |
| Event Bridge仕様 | `docs_new/01_phase/04_phase4/EVENT_BRIDGE_SPEC.md` | 全体 |
| シーケンスマップ | `docs_new/01_phase/04_phase4/SEQUENCE_IMPLEMENTATION_MAP.md` | §2-4 |

## 成果物
| ファイル | 説明 | IC-ID |
|---------|------|-------|
| `services/event-bridge/indexer/` | L1 Event Indexer | IC-EB-002 |
| `services/event-bridge/relayer/` | Multi-Relayer | IC-EB-003 |
| `docs_new/00_core/specs/HSM_INTEGRATION_SPEC.md` | HSM統合仕様 | IC-HSM-001 |
| `tests/event-bridge/` | 統合テスト | - |

## 実行順序
1. INFRA-001: Event Bridge設計確定
2. PROMPT-001: プロンプトパス修正（並行可）
3. INFRA-002: L1→L3 Indexer実装
4. INFRA-003: L3→L1 Relayer実装
5. INFRA-004: 統合テスト
6. INFRA-005: HSM仕様書作成
7. Week 1 PIR実施

## Core Principles確認
- [x] CP-1: 完全量子耐性 - SHA3-256使用、keccak256禁止
- [x] CP-2: Self-Custody - Event Bridgeはユーザー資産に直接触れない
- [x] CP-3: Time Lock存在 - N/A (Event Bridgeレイヤー)
- [x] CP-4: Slashing存在 - N/A (Event Bridgeレイヤー)
- [x] CP-5: 透明性 - 全イベントログ保存

## Modular Architecture確認
- [x] Core Layer: Event Bridge はCore機能
- [x] Governance Layer: N/A
- [x] Token Layer: N/A
- [x] Layer間依存: Event Bridge → L1Vault, L3 Consensus

## リスク・懸念事項
- Relayerの高可用性設計が重要
- L1/L3間のレイテンシ管理
- イベント順序保証の実装複雑性
```

---

## 7. リスクと緩和策

### 7.1 識別されたリスク

| # | リスク | 重要度 | 緩和策 |
|---|--------|:------:|--------|
| R1 | Phase 3.3 TEST-004/005未完了でPhase 4開始 | 🔴 HIGH | Phase 4 Week 1でTEST-004/005を並行実施 |
| R2 | プロンプト修正による既存ワークフロー破壊 | 🟠 MEDIUM | 修正前にバックアップ、段階的適用 |
| R3 | Phase 4ドキュメント間の整合性不足 | 🟡 LOW | 本計画で参照関係を明確化済み |
| R4 | IC-2 CONDITIONAL条件の対応遅延 | 🟠 MEDIUM | Phase 4 Week 3でSTARK Verifier統合 |

### 7.2 緩和策実施タイミング

| Week | 緩和策 |
|:----:|--------|
| 今回 | Phase 4ドキュメント参照関係確立 |
| 次回 | プロンプト修正（バックアップ後） |
| W1 | TEST-004/005並行実施 |
| W3 | STARK Verifier統合（IC-2条件対応） |

---

## 8. 次のステップ

### 8.1 今回のセッション（Phase A）

- [x] Phase 4ドキュメント構造確認
- [x] エージェントプロンプト現状分析
- [x] 統合開発計画作成（本ドキュメント）
- [ ] Kota承認

### 8.2 次回セッション（Phase B）

1. **エージェントプロンプト修正**
   - 02_spec.md ~ 07_gonogo.md パス修正
   - Phase 4セクション追加
   - テスト・検証

2. **CURRENT_STATE.md Phase 4移行準備**
   - Phase 3.3 Go/No-Go判定（TEST-004/005結果待ち）
   - Phase 4開始状態への更新

### 8.3 その後（Phase C）

1. **Week 1実装開始**
   - 01_plan.mdでCURRENT_PLAN.md生成
   - INFRA-001~005実装
   - Week 1 PIR

2. **週次サイクル継続**
   - Week 2: API Layer
   - Week 3: Client SDK
   - Week 4-5: Admin Dashboard
   - ...

---

## 付録: ディレクトリ構造提案

```
docs_new/
├── 00_core/
│   ├── CORE_PRINCIPLES.md
│   ├── specs/
│   │   ├── SPEC_STRATEGY_BRIDGE.md
│   │   ├── L3_CHAIN_SPECIFICATION.md
│   │   ├── MODULAR_ARCHITECTURE.md
│   │   ├── HSM_INTEGRATION_SPEC.md      ← Week 1で作成
│   │   └── API_SPECIFICATION.md         ← Week 2で作成
│   └── sequences/
│       └── SEQUENCES_v2.0.md
│
├── 01_phase/
│   ├── CURRENT_STATE.md
│   ├── CURRENT_PLAN.md
│   ├── 03_Phase3/
│   │   ├── PHASE3_STRATEGY.md
│   │   ├── meetings/
│   │   ├── pir/
│   │   └── checklists/
│   └── 04_phase4/                        ← 今回作成済み
│       ├── PHASE4_PLAN.md               ✅
│       ├── SEQUENCE_IMPLEMENTATION_MAP.md ✅
│       ├── INTEGRATED_SYSTEM_BLUEPRINT_JP.md ✅
│       ├── UI_UX_FUNCTIONAL_REQUIREMENTS_JP.md ✅
│       ├── EVENT_BRIDGE_SPEC.md         ✅
│       ├── EDITION_SWITCH_SPEC.md       ✅
│       ├── PROVER_REGISTRATION_FLOW.md  ✅
│       ├── TEST_STRATEGY.md             ✅
│       ├── phase4.md                    ✅
│       ├── meetings/                    ← Phase 4会議議事録
│       ├── pir/                         ← Phase 4 PIRレポート
│       └── checklists/                  ← Phase 4チェックリスト
│
└── 02_agents_prompt/
    ├── 01_Agent strategic meeting format/
    └── 02_prompts/
        ├── 01_plan.md                   ✅ Phase 4対応済み
        ├── 02_spec.md                   ⚠️ 次回修正
        ├── 03_impl.md                   ⚠️ 次回修正
        ├── 04_review.md                 ⚠️ 次回修正
        ├── 05_pir.md                    ⚠️ 次回修正
        ├── 06_update.md                 ⚠️ 次回修正
        └── 07_gonogo.md                 ⚠️ 次回修正
```

---

## 変更履歴

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-04 | 初版作成 |

---

**END OF PHASE 4 INTEGRATION DEVELOPMENT PLAN**
