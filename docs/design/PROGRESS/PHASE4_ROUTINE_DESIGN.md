# 🔄 Phase 4 Routine Design
## ルーティン設計とプロンプト順序

> **Version**: 1.1  
> **Date**: 2026-01-06  
> **Scope**: Phase 4A (Design) + Phase 4B (Implementation)

---

# Part 1: 全体アーキテクチャ

## 1.1 Phase 4 二段階構成

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           PHASE 4 ARCHITECTURE                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                     PHASE 4A: Discovery & Design                         │   │
│  │                         (8システム × デザイン)                            │   │
│  ├─────────────────────────────────────────────────────────────────────────┤   │
│  │                                                                          │   │
│  │   ┌────────┐   ┌────────┐   ┌────────┐   ┌────────┐   ┌────────┐       │   │
│  │   │08_prep │ → │09_create│ → │10_pir  │ → │11_fix  │ → │ Repeat │       │   │
│  │   └────────┘   └────────┘   └────────┘   └────────┘   └────────┘       │   │
│  │                     │              │            │                        │   │
│  │                     ↓              │            │                        │   │
│  │                 Git Push           │            ↓                        │   │
│  │                 (wip/)             │       Git Push                      │   │
│  │                     │              │       (修正)                        │   │
│  │                     ↓              ↓            │                        │   │
│  │                MANIFEST.md → PIR参照 → 修正参照                          │   │
│  │                                                                          │   │
│  │   成果物: Figma + HTML Mock (Git管理)                                    │   │
│  │   レビュー: CDO, Marketing, Legal, Personas                              │   │
│  │   頻度: 週2回PIR可能                                                     │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                      ↓                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                     PHASE 4B: Implementation                             │   │
│  │                       (7画面/PIR × 実装)                                  │   │
│  ├─────────────────────────────────────────────────────────────────────────┤   │
│  │                                                                          │   │
│  │   ┌────────┐   ┌────────┐   ┌────────┐   ┌────────┐   ┌────────┐       │   │
│  │   │01_plan │ → │02_spec │ → │03_impl │ → │04_review│ → │05_pir  │       │   │
│  │   └────────┘   └────────┘   └────────┘   └────────┘   └────────┘       │   │
│  │       ↓                                                                  │   │
│  │   ┌────────┐   ┌────────┐                                               │   │
│  │   │06_update│ → │07_gonogo│                                              │   │
│  │   └────────┘   └────────┘                                               │   │
│  │                                                                          │   │
│  │   成果物: 実装コード + API統合                                           │   │
│  │   レビュー: 全Agentペルソナ                                              │   │
│  │   頻度: 週1回PIR                                                         │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 1.2 プロンプトファイル一覧

```
quantum-shield/
└── docs_new/
    └── 02_agents_prompt/
        └── 02_prompts/
            ├── 01_plan.md          # Phase 4B: 計画
            ├── 02_spec.md          # Phase 4B: 仕様
            ├── 03_impl.md          # Phase 4B: 実装
            ├── 04_review.md        # Phase 4B: セキュリティレビュー
            ├── 05_pir.md           # Phase 4B: PIR
            ├── 06_update.md        # Phase 4B: 状態更新
            ├── 07_gonogo.md        # Phase 4B: Go/No-Go
            │
            ├── 08_design_prep.md   # Phase 4A: デザイン準備
            ├── 09_design_create.md # Phase 4A: デザイン作成 + Git Push
            ├── 10_design_pir.md    # Phase 4A: デザインPIR（ファイルパス必須）
            └── 11_design_fix.md    # Phase 4A: デザイン修正 ← NEW
```

---

# Part 2: Phase 4A ルーティン

## 2.1 Phase 4A フロー詳細（ファイル永続化対応版）

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    PHASE 4A: DESIGN ROUTINE (FILE PERSISTENCE)                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ 08_design_prep.md                                                        │   │
│  │ ─────────────────                                                        │   │
│  │ 出力: DESIGN_BRIEF_[SYSTEM].md                                           │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                      ↓                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ 09_design_create.md                                                      │   │
│  │ ──────────────────                                                       │   │
│  │                                                                          │   │
│  │ ⚠️ 重要: ファイル永続化プロセス                                          │   │
│  │                                                                          │   │
│  │ 1. ファイル作成                                                          │   │
│  │    └── wip/mocks/01_landing.html                                         │   │
│  │    └── wip/mocks/02_onboarding.html                                      │   │
│  │    └── ...                                                               │   │
│  │                                                                          │   │
│  │ 2. 即座にGitプッシュ（必須）                                             │   │
│  │    └── github:create_or_update_file で各ファイルをプッシュ               │   │
│  │                                                                          │   │
│  │ 3. DESIGN_MANIFEST.md 作成                                               │   │
│  │    └── 全ファイルのパスを記録                                            │   │
│  │    └── Gitにプッシュ                                                     │   │
│  │                                                                          │   │
│  │ 出力:                                                                    │   │
│  │   • wip/wireframes/*.md (Git)                                            │   │
│  │   • wip/mocks/*.html (Git)                                               │   │
│  │   • DESIGN_MANIFEST.md (Git)                                             │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                      ↓                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ 10_design_pir.md                                                         │   │
│  │ ────────────────                                                         │   │
│  │                                                                          │   │
│  │ ⚠️ 重要: ファイルパス必須                                                │   │
│  │                                                                          │   │
│  │ 1. DESIGN_MANIFEST.md からファイル一覧を取得                             │   │
│  │                                                                          │   │
│  │ 2. GitHubからファイルをFetchしてレビュー                                 │   │
│  │                                                                          │   │
│  │ 3. 指摘は必ず「ファイル + 行番号」形式で記載                             │   │
│  │    例:                                                                   │   │
│  │    | # | 重要度 | ファイル | 行 | 指摘 | 修正案 |                        │   │
│  │    | 1 | High | wip/mocks/03_dashboard.html | L142 | ... | ... |         │   │
│  │                                                                          │   │
│  │ 出力:                                                                    │   │
│  │   • PIR_[SYSTEM].md (ファイルパス付き指摘)                               │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                      ↓                                          │
│                              ┌─────────────┐                                    │
│                              │   判定分岐   │                                    │
│                              └─────────────┘                                    │
│                                     │                                           │
│           ┌─────────────────────────┼─────────────────────────┐                 │
│           │                         │                         │                 │
│           ▼                         ▼                         ▼                 │
│     ┌──────────┐           ┌──────────────┐           ┌──────────┐             │
│     │ ✅ PASS  │           │ ⚠️ CONDITIONAL │           │ ❌ FAIL  │             │
│     └──────────┘           └──────────────┘           └──────────┘             │
│           │                         │                         │                 │
│           │                         ▼                         │                 │
│           │        ┌─────────────────────────────────┐        │                 │
│           │        │ 11_design_fix.md                │        │                 │
│           │        │ ─────────────────               │        │                 │
│           │        │                                 │◄───────┘                 │
│           │        │ 1. PIR_[SYSTEM].md から指摘取得 │                          │
│           │        │ 2. GitHubからファイルFetch      │                          │
│           │        │ 3. 修正実施                     │                          │
│           │        │ 4. Gitにプッシュ                │                          │
│           │        │ 5. MANIFEST更新                 │                          │
│           │        │                                 │                          │
│           │        │ 出力:                           │                          │
│           │        │   • 修正済みファイル (Git)      │                          │
│           │        │   • MANIFEST.md 更新 (Git)      │                          │
│           │        └─────────────────────────────────┘                          │
│           │                         │                                           │
│           │                         ▼                                           │
│           │              ┌──────────────────┐                                   │
│           │              │ CONDITIONAL:      │                                   │
│           │              │ → 自動承認        │                                   │
│           │              │ FAIL:            │                                   │
│           │              │ → 再PIR          │                                   │
│           │              └──────────────────┘                                   │
│           │                         │                                           │
│           └─────────────────────────┼───────────────────────────────────────────│
│                                     ▼                                           │
│                         ┌─────────────────────┐                                 │
│                         │ UI_PROGRESS_TRACKER │                                 │
│                         │ 更新               │                                 │
│                         └─────────────────────┘                                 │
│                                     │                                           │
│                                     ▼                                           │
│                         ┌─────────────────────┐                                 │
│                         │ 次のシステムへ      │                                 │
│                         │ or Phase 4B開始    │                                 │
│                         └─────────────────────┘                                 │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 2.2 作業ディレクトリ構造

```
docs_new/01_phase/04_phase4/01_design/system_XX_[name]/
│
├── README.md                        # システム概要
├── DESIGN_BRIEF_[NAME].md           # 08_design_prep 出力
├── DESIGN_MANIFEST.md               # ★ ファイル一覧（09で作成、11で更新）
├── PIR_[NAME].md                    # 10_design_pir 出力
│
└── wip/                             # ★ 作業ファイル保管場所（Git管理）
    │
    ├── wireframes/                  # ワイヤーフレーム
    │   ├── 01_public_pages.md
    │   ├── 02_onboarding.md
    │   └── ...
    │
    └── mocks/                       # HTMLモック
        ├── 01_landing.html
        ├── 02_onboarding_connect.html
        ├── 02_onboarding_keygen.html
        ├── 03_dashboard.html
        ├── 04_lock_input.html
        ├── 04_lock_confirm.html
        └── ...
```

## 2.3 DESIGN_MANIFEST.md テンプレート

```markdown
# Design Manifest: [System Name]

## Overview
- System: [Name]
- Created: [YYYY-MM-DD]
- Last Updated: [YYYY-MM-DD]
- Status: 🔵 In Progress / 🟢 PIR Ready / ✅ Approved

## Files

### Wireframes
| # | ファイル | パス | 説明 |
|---|----------|------|------|
| 1 | 01_public_pages.md | `wip/wireframes/01_public_pages.md` | LP・説明ページ |
| 2 | 02_onboarding.md | `wip/wireframes/02_onboarding.md` | オンボーディング |

### Mocks
| # | ファイル | パス | 画面 | 説明 |
|---|----------|------|------|------|
| 1 | 01_landing.html | `wip/mocks/01_landing.html` | Landing Page | ヒーロー・CTA |
| 2 | 02_onboarding_connect.html | `wip/mocks/02_onboarding_connect.html` | Wallet Connect | ウォレット接続 |
| 3 | 03_dashboard.html | `wip/mocks/03_dashboard.html` | Dashboard | メインダッシュボード |

## Change Log
| Date | Version | Changes |
|------|---------|---------|
| YYYY-MM-DD | 1.0 | 初版作成 |
| YYYY-MM-DD | 1.1 | PIR指摘対応（#1, #2, #3） |
```

---

# Part 3: ディレクトリ構造

## 3.1 完全なディレクトリ構造

```
quantum-shield/
├── docs_new/
│   ├── 00_core/
│   │   └── CORE_PRINCIPLES.md
│   │
│   ├── 01_phase/
│   │   ├── CURRENT_STATE.md
│   │   ├── CURRENT_PLAN.md
│   │   │
│   │   └── 04_phase4/
│   │       ├── 00_戦略決定文書/
│   │       │   ├── 00_INDEX.md
│   │       │   ├── 01_ARCHITECTURE.md
│   │       │   ├── 02_PERSONAS.md
│   │       │   ├── 03_USER_JOURNEYS.md
│   │       │   ├── 04_SCREENS.md
│   │       │   ├── 05_AUTH_SECURITY.md
│   │       │   ├── 06_DATA_DESIGN.md
│   │       │   └── 07_INTEGRATION.md
│   │       │
│   │       ├── 01_design/                           # Phase 4A
│   │       │   ├── UI_DESIGN_GUIDELINES.md
│   │       │   ├── UI_PROGRESS_TRACKER.md
│   │       │   ├── DESIGN_PIR_PROCESS.md
│   │       │   ├── DESIGN_REVIEW_AGENTS.md
│   │       │   ├── PHASE4_ROUTINE_DESIGN.md         # ← このファイル
│   │       │   │
│   │       │   ├── assets/
│   │       │   │   └── design-concept-5-japan-premium.html
│   │       │   │
│   │       │   ├── system_01_consumer/
│   │       │   │   ├── README.md
│   │       │   │   ├── DESIGN_BRIEF_CONSUMER.md
│   │       │   │   ├── DESIGN_MANIFEST.md           # ★ NEW
│   │       │   │   ├── PIR_CONSUMER.md
│   │       │   │   │
│   │       │   │   └── wip/                         # ★ NEW: 作業ファイル
│   │       │   │       ├── wireframes/
│   │       │   │       │   ├── 01_public_pages.md
│   │       │   │       │   └── 02_onboarding.md
│   │       │   │       │
│   │       │   │       └── mocks/
│   │       │   │           ├── 01_landing.html
│   │       │   │           ├── 02_onboarding_connect.html
│   │       │   │           ├── 03_dashboard.html
│   │       │   │           └── ...
│   │       │   │
│   │       │   ├── system_02_token_hub/
│   │       │   ├── system_03_governance/
│   │       │   ├── system_04_prover/
│   │       │   ├── system_05_observer/
│   │       │   ├── system_06_explorer/
│   │       │   ├── system_07_enterprise/
│   │       │   └── system_08_qs_admin/
│   │       │
│   │       └── 02_implementation/                   # Phase 4B
│   │
│   └── 02_agents_prompt/
│       └── 02_prompts/
│           ├── 01_plan.md
│           ├── 02_spec.md
│           ├── 03_impl.md
│           ├── 04_review.md
│           ├── 05_pir.md
│           ├── 06_update.md
│           ├── 07_gonogo.md
│           │
│           ├── 08_design_prep.md                    # Phase 4A: 準備
│           ├── 09_design_create.md                  # Phase 4A: 作成 + Git Push
│           ├── 10_design_pir.md                     # Phase 4A: PIR（パス必須）
│           └── 11_design_fix.md                     # Phase 4A: 修正 ← NEW
│
└── apps/
    └── ui/                                          # 実装コード（Phase 4B）
```

---

# Part 4: 実行例

## 4.1 Phase 4A 開始時のプロンプト

```markdown
# Phase 4A 開始

## 現在の状態
- Phase 3 完了
- Phase 4A 開始

## 最初のタスク
`08_design_prep.md` を実行して、Consumer App のデザイン準備を行ってください。

読み込むファイル:
1. docs_new/01_phase/04_phase4/01_design/UI_PROGRESS_TRACKER.md
2. docs_new/01_phase/04_phase4/00_戦略決定文書/02_PERSONAS.md
3. docs_new/01_phase/04_phase4/00_戦略決定文書/03_USER_JOURNEYS.md
4. docs_new/01_phase/04_phase4/01_design/UI_DESIGN_GUIDELINES.md

出力:
- docs_new/01_phase/04_phase4/01_design/system_01_consumer/DESIGN_BRIEF_CONSUMER.md
```

## 4.2 デザイン作成時のプロンプト

```markdown
# デザイン作成

## 対象
Consumer App (25画面)

## タスク
`09_design_create.md` を実行して、Consumer App のデザインを作成してください。

⚠️ 重要:
1. 作成したファイルは全て `wip/mocks/` に保存
2. 作成後、即座にGitにプッシュ
3. 最後に DESIGN_MANIFEST.md を作成してGitにプッシュ

読み込むファイル:
1. docs_new/01_phase/04_phase4/01_design/system_01_consumer/DESIGN_BRIEF_CONSUMER.md
2. docs_new/01_phase/04_phase4/01_design/UI_DESIGN_GUIDELINES.md
3. docs_new/01_phase/04_phase4/01_design/assets/design-concept-5-japan-premium.html

出力（全てGitにプッシュ）:
- wip/wireframes/*.md
- wip/mocks/*.html
- DESIGN_MANIFEST.md
```

## 4.3 Design PIR 実行時のプロンプト

```markdown
# Design PIR 実行

## 対象
Consumer App (25画面)

## タスク
`10_design_pir.md` を実行して、Design PIR を実施してください。

⚠️ 重要:
1. まず DESIGN_MANIFEST.md を読み込んでファイル一覧を取得
2. GitHubからファイルをFetchしてレビュー
3. 指摘は必ず「ファイルパス + 行番号」形式で記載

以下のAgentになりきってレビューを実行:
1. CDO（佐々木さん）
2. Marketing（田村さん）
3. Legal（西村さん）
4. 田中さん（End User）
5. 鈴木さん（Token Holder）

出力:
- PIR_CONSUMER.md（ファイルパス付き指摘を含む）
```

## 4.4 修正実行時のプロンプト

```markdown
# デザイン修正

## 対象
Consumer App - PIR指摘事項

## タスク
`11_design_fix.md` を実行して、PIR指摘事項を修正してください。

⚠️ 重要:
1. PIR_CONSUMER.md の Action Items Summary を確認
2. 各指摘のファイルパスと行番号を参照
3. GitHubからファイルをFetchして修正
4. 修正後、即座にGitにプッシュ
5. DESIGN_MANIFEST.md の Change Log を更新

読み込むファイル:
1. docs_new/01_phase/04_phase4/01_design/system_01_consumer/PIR_CONSUMER.md
2. docs_new/01_phase/04_phase4/01_design/system_01_consumer/DESIGN_MANIFEST.md

修正対象:
- PIR_CONSUMER.md の Action Items Summary に記載されたファイル
```

---

# Part 5: スケジュール

## 5.1 週次スケジュール例

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  WEEK 1: Consumer App                                                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Day 1 (Mon):                                                                   │
│    • 08_design_prep.md 実行                                                     │
│    • DESIGN_BRIEF_CONSUMER.md 作成                                              │
│                                                                                 │
│  Day 2-3 (Tue-Wed):                                                             │
│    • 09_design_create.md 実行（ワイヤーフレーム + モック）                       │
│    • 作成 → 即Git Push → MANIFEST更新                                          │
│                                                                                 │
│  Day 4 (Thu):                                                                   │
│    • 10_design_pir.md 実行（Design PIR #1）                                     │
│    • PIRレポート作成（ファイルパス付き指摘）                                    │
│                                                                                 │
│  Day 5 (Fri):                                                                   │
│    • 11_design_fix.md 実行（指摘対応）                                          │
│    • 修正 → Git Push → MANIFEST更新                                            │
│    • CONDITIONAL → 自動承認 / FAIL → 再PIR                                     │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 5.2 全体タイムライン

```
Week 1-2:   Consumer App (25画面)        → P0
Week 3-4:   Prover Portal (28画面)       → P0
Week 5:     QS Admin (40画面 Part 1)     → P0
Week 6:     QS Admin (Part 2) + Token Hub (18画面) → P0
Week 7:     Governance (16画面) + Explorer (14画面) → P1
Week 8:     Enterprise Admin (25画面)    → P1
Week 9:     Observer/Challenger (10画面) + バッファ → P2

---
Phase 4A 完了予定: 約9週間
Phase 4B 開始: Week 10〜
```

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-06 | 初版作成 |
| 1.1 | 2026-01-06 | wip/ディレクトリ、MANIFEST、11_design_fix.md 追加 |

---

**END OF DOCUMENT**
