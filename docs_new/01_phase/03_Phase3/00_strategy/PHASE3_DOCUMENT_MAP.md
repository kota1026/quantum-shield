# Phase 3 ドキュメント連携マップ

> **作成日**: 2025-12-28
> **更新日**: 2025-12-28 (仕様書連動追加)
> **目的**: プロンプト (01-07) と Phase 3 ドキュメント、および仕様書の連携を可視化

---

## 📊 ドキュメント階層

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          DOCUMENT HIERARCHY                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Layer 0: 憲法（不変）                                                       │
│  └── docs/constitution/CORE_PRINCIPLES.md                                   │
│      ※ ガバナンス投票でも変更不可                                            │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Layer 1: 原理原則仕様（安定）                                               │
│  ├── docs/aegis/QUANTUM_SHIELD_SEQUENCES_v2.0.md     ← 「何をするか」       │
│  │   ※ 8つのSequence定義（Lock, Unlock, Challenge等）                       │
│  └── docs/aegis/QUANTUM_SHIELD_UNIFIED_SPEC_v2.0.md  ← 「全体像」           │
│      ※ Phase定義、Token、ガバナンス、経済モデル                              │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Layer 2: 戦略決議（Phase単位で更新）                                        │
│  ├── docs/planning/PHASE3_STRATEGY.md                ← 「どう実現するか」   │
│  ├── docs/specs/MODULAR_ARCHITECTURE.md              ← 「実装設計」         │
│  └── docs/planning/SPEC_STRATEGY_BRIDGE.md           ← 「Layer 1-2対応」★  │
│      ※ Phase-Mode対応表、Sequence-Layer対応、拡張仕様                       │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Layer 3: 実装計画（週単位で更新）                                           │
│  ├── docs/planning/CURRENT_STATE.md                                         │
│  ├── docs/planning/CURRENT_PLAN.md                                          │
│  └── docs/checklists/phase3.X.md                                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📊 連携図

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          DOCUMENT INTEGRATION MAP                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐                                                        │
│  │ 01_plan.md      │───────────────┐                                        │
│  │ (計画立案)       │               │                                        │
│  └─────────────────┘               │                                        │
│           │                        │                                        │
│           ▼                        │                                        │
│  ┌─────────────────┐               │                                        │
│  │ 02_spec.md      │───────────────┼───────────┐                            │
│  │ (仕様レビュー)   │               │           │                            │
│  └─────────────────┘               │           │                            │
│           │                        │           │                            │
│           ▼                        │           │                            │
│  ┌─────────────────┐               │           │                            │
│  │ 03_impl.md      │───────────────┼───────────┼───────────┐                │
│  │ (実装)          │               │           │           │                │
│  └─────────────────┘               │           │           │                │
│           │                        │           │           │                │
│           ▼                        │           │           │                │
│  ┌─────────────────┐               │           │           │                │
│  │ 04_review.md    │───────────────┼───────────┼───────────┼───────┐        │
│  │ (レビュー)       │               │           │           │       │        │
│  └─────────────────┘               │           │           │       │        │
│           │                        │           │           │       │        │
│           ▼                        │           │           │       │        │
│  ┌─────────────────┐               │           │           │       │        │
│  │ 05_pir.md       │───────────────┼───────────┼───────────┼───────┼───┐    │
│  │ (PIR)           │               │           │           │       │   │    │
│  └─────────────────┘               │           │           │       │   │    │
│           │                        │           │           │       │   │    │
│           ▼                        │           │           │       │   │    │
│  ┌─────────────────┐               │           │           │       │   │    │
│  │ 06_update.md    │───────────────┼───────────┤           │       │   │    │
│  │ (状態更新)       │               │           │           │       │   │    │
│  └─────────────────┘               │           │           │       │   │    │
│           │                        │           │           │       │   │    │
│           ▼                        │           │           │       │   │    │
│  ┌─────────────────┐               │           │           │       │   │    │
│  │ 07_gonogo.md    │───────────────┼───────────┼───────────┼───────┼───┼──┐ │
│  │ (Go/No-Go)      │               │           │           │       │   │  │ │
│  └─────────────────┘               │           │           │       │   │  │ │
│                                    │           │           │       │   │  │ │
│                                    ▼           ▼           ▼       ▼   ▼  ▼ │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                        SHARED DOCUMENTS                               │ │
│  ├───────────────────────────────────────────────────────────────────────┤ │
│  │                                                                       │ │
│  │  ★ SPEC_STRATEGY_BRIDGE.md (仕様書-戦略ブリッジ) ★                   │ │
│  │  ├── §2 Phase-Mode対応表                                              │ │
│  │  ├── §3 Sequence-Layer対応                                            │ │
│  │  ├── §4 CP保護トレーサビリティ                                        │ │
│  │  ├── §5 セキュリティ要件マトリクス                                    │ │
│  │  ├── §6 モード別Sequence有効性                                        │ │
│  │  └── §7 拡張仕様（衝突解決）                                          │ │
│  │           │                                                           │ │
│  │           ▼                                                           │ │
│  │  ┌─────────────────────┐    ┌─────────────────────────────────────┐   │ │
│  │  │ Layer 1: 原理原則   │    │ Layer 2: 戦略                       │   │ │
│  │  │ SEQUENCES_v2.0.md   │←──│ PHASE3_STRATEGY.md                  │   │ │
│  │  │ UNIFIED_SPEC_v2.0.md│    │ MODULAR_ARCHITECTURE.md             │   │ │
│  │  └─────────────────────┘    └─────────────────────────────────────┘   │ │
│  │           │                              │                            │ │
│  │           └──────────────┬───────────────┘                            │ │
│  │                          ▼                                            │ │
│  │  ┌───────────────────────────────────────────────────────────────┐   │ │
│  │  │ Layer 3: 実装計画                                              │   │ │
│  │  │ ├── CURRENT_STATE.md (状態)                                    │   │ │
│  │  │ ├── CURRENT_PLAN.md (計画)                                     │   │ │
│  │  │ └── phase3.X.md (チェックリスト)                               │   │ │
│  │  └───────────────────────────────────────────────────────────────┘   │ │
│  │                                                                       │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📋 プロンプト別参照ドキュメント（更新版）

### 01_plan.md (計画立案)

| 参照ドキュメント | 目的 | Layer |
|----------------|------|-------|
| `docs/constitution/CORE_PRINCIPLES.md` | CP準拠確認 | 0 |
| `docs/planning/SPEC_STRATEGY_BRIDGE.md` | 仕様書-戦略連動 ★ | 2 |
| `docs/aegis/QUANTUM_SHIELD_SEQUENCES_v2.0.md` | Sequence定義参照 ★ | 1 |
| `docs/aegis/QUANTUM_SHIELD_UNIFIED_SPEC_v2.0.md` | 全体仕様参照 ★ | 1 |
| `docs/planning/CURRENT_STATE.md` | 現在の状態把握 | 3 |
| `docs/planning/PHASE3_STRATEGY.md` | 戦略決議確認 | 2 |
| `docs/specs/MODULAR_ARCHITECTURE.md` | アーキテクチャ仕様 | 2 |
| `docs/checklists/phase3.1.md` | Active Checklist | 3 |

### 02_spec.md (仕様レビュー)

| 参照ドキュメント | 目的 | Layer |
|----------------|------|-------|
| `docs/planning/SPEC_STRATEGY_BRIDGE.md` | §3, §5 参照 ★ | 2 |
| `docs/aegis/QUANTUM_SHIELD_SEQUENCES_v2.0.md` | 該当Sequence参照 ★ | 1 |
| `docs/planning/CURRENT_PLAN.md` | 計画確認 | 3 |
| `docs/specs/MODULAR_ARCHITECTURE.md` | 仕様準拠確認 | 2 |

### 03_impl.md (実装)

| 参照ドキュメント | 目的 | Layer |
|----------------|------|-------|
| `docs/planning/SPEC_STRATEGY_BRIDGE.md` | §3, §5, §7 参照 ★ | 2 |
| `docs/aegis/QUANTUM_SHIELD_SEQUENCES_v2.0.md` | Sequence仕様実装 ★ | 1 |
| `docs/planning/CURRENT_PLAN.md` | 実装項目確認 | 3 |
| `docs/specs/MODULAR_ARCHITECTURE.md` | インターフェース仕様 | 2 |

### 04_review.md (セキュリティレビュー)

| 参照ドキュメント | 目的 | Layer |
|----------------|------|-------|
| `docs/planning/SPEC_STRATEGY_BRIDGE.md` | §4, §5, §7 参照 ★ | 2 |
| `docs/aegis/QUANTUM_SHIELD_SEQUENCES_v2.0.md` | セキュリティ要件確認 ★ | 1 |
| `docs/planning/PHASE3_STRATEGY.md` | リスク緩和策確認 | 2 |
| `docs/specs/MODULAR_ARCHITECTURE.md` | セキュリティ要件 | 2 |

### 05_pir.md (PIR)

| 参照ドキュメント | 目的 | Layer |
|----------------|------|-------|
| `docs/planning/SPEC_STRATEGY_BRIDGE.md` | §3, §4 参照 ★ | 2 |
| `docs/aegis/PIR_CODE_REVIEW_ROUTINE.md` | レビュールーティン | - |

### 06_update.md (状態更新)

| 参照ドキュメント | 目的 | Layer |
|----------------|------|-------|
| `docs/planning/CURRENT_STATE.md` | 状態更新先 | 3 |
| Sequence完了状況追跡 | BRIDGE §3参照 ★ | 2 |

### 07_gonogo.md (Go/No-Go)

| 参照ドキュメント | 目的 | Layer |
|----------------|------|-------|
| `docs/planning/SPEC_STRATEGY_BRIDGE.md` | §2-6 全体参照 ★ | 2 |
| `docs/aegis/QUANTUM_SHIELD_SEQUENCES_v2.0.md` | Sequence完了確認 ★ | 1 |
| `docs/aegis/QUANTUM_SHIELD_UNIFIED_SPEC_v2.0.md` | Phase定義確認 ★ | 1 |
| `docs/planning/PHASE3_STRATEGY.md` | 戦略準拠確認 | 2 |
| `docs/specs/MODULAR_ARCHITECTURE.md` | アーキテクチャ確認 | 2 |
| `agents/meetings/phase3_strategy/round8_final/FINAL_RESOLUTION_v3.md` | 最終決議書 | 2 |

★ = 今回追加された参照

---

## 🔄 ワークフロー（仕様書連動版）

```
┌─────────────────────────────────────────────────────────────────┐
│                    PHASE 3 WORKFLOW (仕様書連動)                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. 計画立案 (01_plan.md)                                        │
│     ├── SPEC_STRATEGY_BRIDGE.md 読み込み ★                      │
│     │   └── 対象Sequence特定 (§3)                               │
│     │   └── セキュリティ要件把握 (§5)                           │
│     ├── SEQUENCES_v2.0.md 参照 ★                                │
│     ├── CURRENT_STATE.md 読み込み                               │
│     ├── PHASE3_STRATEGY.md 参照                                 │
│     └── → CURRENT_PLAN.md 出力（対象Sequence、仕様書要件含む）  │
│                                                                 │
│  2. 仕様レビュー (02_spec.md)                                    │
│     ├── SPEC_STRATEGY_BRIDGE.md §3, §5 確認 ★                   │
│     │   └── Sequence-Layer整合性                                │
│     │   └── セキュリティ要件確認                                │
│     ├── SEQUENCES_v2.0.md 該当Sequence確認 ★                    │
│     └── → SPEC_REVIEW.md 出力（仕様書参照含む）                 │
│                                                                 │
│  3. 実装 (03_impl.md)                                           │
│     ├── SPEC_STRATEGY_BRIDGE.md §3, §7 参照 ★                   │
│     │   └── Layer配置ガイドライン                               │
│     │   └── 拡張仕様（モード依存）                              │
│     ├── SEQUENCES_v2.0.md 仕様に準拠して実装 ★                  │
│     └── → 実装コード + テスト（仕様書要件テスト含む）           │
│                                                                 │
│  4. レビュー (04_review.md)                                      │
│     ├── SPEC_STRATEGY_BRIDGE.md §5 チェックリスト ★             │
│     │   └── セキュリティ要件実装確認                            │
│     ├── SEQUENCES_v2.0.md セキュリティ要件確認 ★                │
│     └── → セキュリティレポート（仕様書準拠確認含む）            │
│                                                                 │
│  5. PIR (05_pir.md)                                             │
│     ├── SPEC_STRATEGY_BRIDGE.md §3, §4 判定基準 ★               │
│     │   └── Sequence準拠判定                                    │
│     │   └── CP保護判定                                          │
│     └── → PIR-XXX.md 出力（仕様書準拠判定含む）                 │
│                                                                 │
│  6. 状態更新 (06_update.md)                                      │
│     ├── Sequence完了状況更新 ★                                  │
│     └── → CURRENT_STATE.md 更新（Sequence実装状況含む）         │
│                                                                 │
│  7. Go/No-Go (07_gonogo.md)                                      │
│     ├── SPEC_STRATEGY_BRIDGE.md §2-6 総合判定 ★                 │
│     │   └── Sequence実装完了確認                                │
│     │   └── セキュリティ要件完了確認                            │
│     │   └── Phase-Mode整合性確認                                │
│     ├── SEQUENCES_v2.0.md 全Sequence確認 ★                      │
│     ├── UNIFIED_SPEC_v2.0.md Phase定義確認 ★                    │
│     └── → GONOGO_PHASE3.X_*.md 出力（仕様書準拠スコア含む）     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 ファイル構成（更新版）

```
quantum-shield/
├── docs/
│   ├── constitution/
│   │   └── CORE_PRINCIPLES.md          # Layer 0: 憲法（全プロンプト必読）
│   │
│   ├── aegis/
│   │   ├── QUANTUM_SHIELD_SEQUENCES_v2.0.md    # Layer 1: Sequence定義 ★
│   │   ├── QUANTUM_SHIELD_UNIFIED_SPEC_v2.0.md # Layer 1: 全体仕様 ★
│   │   └── PIR_CODE_REVIEW_ROUTINE.md          # PIRルーティン
│   │
│   ├── planning/
│   │   ├── SPEC_STRATEGY_BRIDGE.md     # Layer 2: 仕様書-戦略ブリッジ ★NEW
│   │   ├── CURRENT_STATE.md            # Layer 3: 現在の状態
│   │   ├── CURRENT_PLAN.md             # Layer 3: 現在の計画
│   │   ├── PHASE3_STRATEGY.md          # Layer 2: Phase 3戦略サマリー
│   │   ├── PHASE3_DOCUMENT_MAP.md      # 本ドキュメント
│   │   └── PHASE3_PLAN.md              # Phase 3計画
│   │
│   ├── specs/
│   │   └── MODULAR_ARCHITECTURE.md     # Layer 2: Modular Architecture仕様
│   │
│   ├── checklists/
│   │   └── phase3.1.md                 # Layer 3: Phase 3.1チェックリスト
│   │
│   └── decisions/
│       └── GONOGO_*.md                 # Go/No-Go判定記録
│
├── agents/
│   └── meetings/
│       └── phase3_strategy/            # Phase 3戦略会議記録
│           └── round8_final/
│               └── FINAL_RESOLUTION_v3.md  # 最終決議書
│
└── scripts/
    └── prompts/
        ├── 01_plan.md                  # 計画立案（仕様書参照追加）★UPDATED
        ├── 02_spec.md                  # 仕様レビュー（仕様書参照追加）★UPDATED
        ├── 03_impl.md                  # 実装（仕様書参照追加）★UPDATED
        ├── 04_review.md                # レビュー（仕様書参照追加）★UPDATED
        ├── 05_pir.md                   # PIR（仕様書参照追加）★UPDATED
        ├── 06_update.md                # 状態更新（Sequence追跡追加）★UPDATED
        └── 07_gonogo.md                # Go/No-Go（仕様書参照追加）★UPDATED
```

---

## ✅ 連携確認チェックリスト（更新版）

Phase 3開始前に以下を確認：

### Layer 0-1: 原理原則
- [ ] CORE_PRINCIPLES.md が存在し、CP-1〜CP-5が定義されている
- [ ] QUANTUM_SHIELD_SEQUENCES_v2.0.md が存在し、8つのSequenceが定義されている
- [ ] QUANTUM_SHIELD_UNIFIED_SPEC_v2.0.md が存在し、Phase定義が記載されている

### Layer 2: 戦略・ブリッジ
- [ ] **SPEC_STRATEGY_BRIDGE.md が存在し、以下を含む** ★NEW
  - [ ] §2 Phase-Mode対応表
  - [ ] §3 Sequence-Layer対応
  - [ ] §4 CP保護トレーサビリティ
  - [ ] §5 セキュリティ要件マトリクス
  - [ ] §6 モード別Sequence有効性
  - [ ] §7 拡張仕様
- [ ] PHASE3_STRATEGY.md が存在し、戦略サマリーが記載されている
- [ ] MODULAR_ARCHITECTURE.md が存在し、仕様が記載されている
- [ ] FINAL_RESOLUTION_v3.md が存在し、決議内容が記載されている

### Layer 3: 実装計画
- [ ] CURRENT_STATE.md が Phase 3.1 を示している
- [ ] phase3.1.md (Active Checklist) が存在する

### プロンプト連携
- [ ] 01_plan.md が SPEC_STRATEGY_BRIDGE.md を参照している ★UPDATED
- [ ] 02_spec.md が SPEC_STRATEGY_BRIDGE.md, SEQUENCES を参照している ★UPDATED
- [ ] 03_impl.md が Layer配置ガイドラインを含んでいる ★UPDATED
- [ ] 04_review.md が §5 セキュリティ要件チェックを含んでいる ★UPDATED
- [ ] 05_pir.md が 仕様書準拠判定基準を含んでいる ★UPDATED
- [ ] 06_update.md が Sequence完了追跡を含んでいる ★UPDATED
- [ ] 07_gonogo.md が 仕様書準拠総合判定を含んでいる ★UPDATED

---

## 🔑 クイックリファレンス

### 「何を参照すべきか」早見表

| やりたいこと | 参照ドキュメント |
|-------------|----------------|
| Sequenceの動作を確認 | `SEQUENCES_v2.0.md` |
| Phase定義を確認 | `UNIFIED_SPEC_v2.0.md` |
| SequenceをどのLayerに実装するか | `SPEC_STRATEGY_BRIDGE.md §3` |
| セキュリティ要件は何か | `SPEC_STRATEGY_BRIDGE.md §5` |
| モード依存の実装方法 | `SPEC_STRATEGY_BRIDGE.md §7` |
| Phase-Modeの対応関係 | `SPEC_STRATEGY_BRIDGE.md §2` |
| CP保護の実装方法 | `SPEC_STRATEGY_BRIDGE.md §4` |

---

**Document Integration: COMPLETE (仕様書連動版)**
