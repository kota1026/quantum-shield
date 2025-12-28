# Phase 3 ドキュメント連携マップ

> **作成日**: 2025-12-28
> **目的**: プロンプト (01-07) と Phase 3 ドキュメントの連携を可視化

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
│  │ 02_spec.md      │               │                                        │
│  │ (仕様レビュー)   │               │                                        │
│  └─────────────────┘               │                                        │
│           │                        │                                        │
│           ▼                        │                                        │
│  ┌─────────────────┐               │                                        │
│  │ 03_impl.md      │───────────────┼───────────┐                            │
│  │ (実装)          │               │           │                            │
│  └─────────────────┘               │           │                            │
│           │                        │           │                            │
│           ▼                        │           │                            │
│  ┌─────────────────┐               │           │                            │
│  │ 04_review.md    │               │           │                            │
│  │ (レビュー)       │               │           │                            │
│  └─────────────────┘               │           │                            │
│           │                        │           │                            │
│           ▼                        │           │                            │
│  ┌─────────────────┐               │           │                            │
│  │ 05_pir.md       │               │           │                            │
│  │ (PIR)           │               │           │                            │
│  └─────────────────┘               │           │                            │
│           │                        │           │                            │
│           ▼                        │           │                            │
│  ┌─────────────────┐               │           │                            │
│  │ 06_update.md    │───────────────┼───────────┼───────────┐                │
│  │ (状態更新)       │               │           │           │                │
│  └─────────────────┘               │           │           │                │
│           │                        │           │           │                │
│           ▼                        ▼           ▼           ▼                │
│  ┌─────────────────┐    ┌──────────────────────────────────────────┐       │
│  │ 07_gonogo.md    │───►│           SHARED DOCUMENTS                │       │
│  │ (Go/No-Go)      │    │                                          │       │
│  └─────────────────┘    │  ┌────────────────────────────────────┐  │       │
│                         │  │ docs/planning/CURRENT_STATE.md     │  │       │
│                         │  │ (現在の状態 - 全プロンプト参照)     │  │       │
│                         │  └────────────────────────────────────┘  │       │
│                         │                    │                      │       │
│                         │                    ▼                      │       │
│                         │  ┌────────────────────────────────────┐  │       │
│                         │  │ docs/planning/PHASE3_STRATEGY.md   │  │       │
│                         │  │ (Phase 3戦略サマリー)              │  │       │
│                         │  └────────────────────────────────────┘  │       │
│                         │                    │                      │       │
│                         │                    ▼                      │       │
│                         │  ┌────────────────────────────────────┐  │       │
│                         │  │ docs/specs/MODULAR_ARCHITECTURE.md │  │       │
│                         │  │ (Modular Architecture仕様)         │  │       │
│                         │  └────────────────────────────────────┘  │       │
│                         │                    │                      │       │
│                         │                    ▼                      │       │
│                         │  ┌────────────────────────────────────┐  │       │
│                         │  │ docs/checklists/phase3.1.md        │  │       │
│                         │  │ (Phase 3.1チェックリスト)          │  │       │
│                         │  └────────────────────────────────────┘  │       │
│                         │                    │                      │       │
│                         │                    ▼                      │       │
│                         │  ┌────────────────────────────────────┐  │       │
│                         │  │ agents/meetings/phase3_strategy/   │  │       │
│                         │  │ round8_final/FINAL_RESOLUTION_v3.md│  │       │
│                         │  │ (最終決議書)                       │  │       │
│                         │  └────────────────────────────────────┘  │       │
│                         └──────────────────────────────────────────┘       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📋 プロンプト別参照ドキュメント

### 01_plan.md (計画立案)

| 参照ドキュメント | 目的 |
|----------------|------|
| `docs/constitution/CORE_PRINCIPLES.md` | CP準拠確認 |
| `docs/planning/CURRENT_STATE.md` | 現在の状態把握 |
| `docs/planning/PHASE3_STRATEGY.md` | 戦略決議確認 |
| `docs/specs/MODULAR_ARCHITECTURE.md` | アーキテクチャ仕様 |
| `docs/checklists/phase3.1.md` | Active Checklist |

### 02_spec.md (仕様レビュー)

| 参照ドキュメント | 目的 |
|----------------|------|
| `docs/planning/CURRENT_PLAN.md` | 計画確認 |
| `docs/specs/MODULAR_ARCHITECTURE.md` | 仕様準拠確認 |

### 03_impl.md (実装)

| 参照ドキュメント | 目的 |
|----------------|------|
| `docs/planning/CURRENT_PLAN.md` | 実装項目確認 |
| `docs/specs/MODULAR_ARCHITECTURE.md` | インターフェース仕様 |

### 04_review.md (セキュリティレビュー)

| 参照ドキュメント | 目的 |
|----------------|------|
| `docs/planning/PHASE3_STRATEGY.md` | リスク緩和策確認 |
| `docs/specs/MODULAR_ARCHITECTURE.md` | セキュリティ要件 |

### 05_pir.md (PIR)

| 参照ドキュメント | 目的 |
|----------------|------|
| `docs/aegis/PIR_CODE_REVIEW_ROUTINE.md` | レビュールーティン |

### 06_update.md (状態更新)

| 参照ドキュメント | 目的 |
|----------------|------|
| `docs/planning/CURRENT_STATE.md` | 状態更新先 |

### 07_gonogo.md (Go/No-Go)

| 参照ドキュメント | 目的 |
|----------------|------|
| `docs/planning/PHASE3_STRATEGY.md` | 戦略準拠確認 |
| `docs/specs/MODULAR_ARCHITECTURE.md` | アーキテクチャ確認 |
| `agents/meetings/phase3_strategy/round8_final/FINAL_RESOLUTION_v3.md` | 最終決議書 |
| `agents/meetings/phase3_strategy/round7_devils_advocate/analysis.md` | リスク分析 |

---

## 🔄 ワークフロー

```
┌─────────────────────────────────────────────────────────────────┐
│                    PHASE 3 WORKFLOW                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. 計画立案 (01_plan.md)                                        │
│     ├── CURRENT_STATE.md 読み込み                               │
│     ├── PHASE3_STRATEGY.md 参照                                 │
│     ├── phase3.1.md (Active Checklist) 参照                     │
│     └── → CURRENT_PLAN.md 出力                                  │
│                                                                 │
│  2. 仕様レビュー (02_spec.md)                                    │
│     ├── CURRENT_PLAN.md 読み込み                                │
│     ├── MODULAR_ARCHITECTURE.md 参照                            │
│     └── → SPEC_REVIEW.md 出力                                   │
│                                                                 │
│  3. 実装 (03_impl.md)                                           │
│     ├── CURRENT_PLAN.md 読み込み                                │
│     ├── MODULAR_ARCHITECTURE.md 参照                            │
│     └── → 実装コード + テスト 出力                              │
│                                                                 │
│  4. レビュー (04_review.md)                                      │
│     ├── 実装コード読み込み                                       │
│     ├── PHASE3_STRATEGY.md (リスク緩和策) 参照                  │
│     └── → セキュリティレポート 出力                             │
│                                                                 │
│  5. PIR (05_pir.md)                                             │
│     └── → PIR-XXX.md 出力                                       │
│                                                                 │
│  6. 状態更新 (06_update.md)                                      │
│     └── → CURRENT_STATE.md 更新                                 │
│                                                                 │
│  7. Go/No-Go (07_gonogo.md)                                      │
│     ├── PHASE3_STRATEGY.md (リスク緩和策確認)                   │
│     ├── FINAL_RESOLUTION_v3.md (決議準拠確認)                   │
│     └── → GONOGO_PHASE3.X_*.md 出力                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 ファイル構成

```
quantum-shield/
├── docs/
│   ├── constitution/
│   │   └── CORE_PRINCIPLES.md          # 憲法（全プロンプト必読）
│   ├── planning/
│   │   ├── CURRENT_STATE.md            # 現在の状態（全プロンプト参照）
│   │   ├── CURRENT_PLAN.md             # 現在の計画
│   │   ├── PHASE3_STRATEGY.md          # Phase 3戦略サマリー ← NEW
│   │   └── PHASE3_PLAN.md              # Phase 3計画
│   ├── specs/
│   │   └── MODULAR_ARCHITECTURE.md     # Modular Architecture仕様 ← NEW
│   ├── checklists/
│   │   └── phase3.1.md                 # Phase 3.1チェックリスト ← NEW
│   └── decisions/
│       └── GONOGO_*.md                 # Go/No-Go判定記録
├── agents/
│   └── meetings/
│       └── phase3_strategy/            # Phase 3戦略会議記録 ← NEW
│           ├── round1_reports/
│           ├── round2_proposals/
│           ├── round3_crosscheck/
│           ├── round4_voting/
│           ├── round5_resolution/
│           ├── round6_redeliberation/
│           ├── round7_devils_advocate/
│           └── round8_final/
│               └── FINAL_RESOLUTION_v3.md  # 最終決議書
└── scripts/
    └── prompts/
        ├── 01_plan.md                  # 計画立案（更新済）
        ├── 02_spec.md                  # 仕様レビュー
        ├── 03_impl.md                  # 実装
        ├── 04_review.md                # セキュリティレビュー
        ├── 05_pir.md                   # PIR
        ├── 06_update.md                # 状態更新
        └── 07_gonogo.md                # Go/No-Go（更新済）
```

---

## ✅ 連携確認チェックリスト

Phase 3開始前に以下を確認：

- [ ] CURRENT_STATE.md が Phase 3.1 を示している
- [ ] PHASE3_STRATEGY.md が存在し、戦略サマリーが記載されている
- [ ] MODULAR_ARCHITECTURE.md が存在し、仕様が記載されている
- [ ] phase3.1.md (Active Checklist) が存在する
- [ ] 01_plan.md が PHASE3_STRATEGY.md を参照するように更新されている
- [ ] 07_gonogo.md がリスク緩和策チェックを含むように更新されている
- [ ] FINAL_RESOLUTION_v3.md が存在し、決議内容が記載されている

---

**Document Integration: COMPLETE**
