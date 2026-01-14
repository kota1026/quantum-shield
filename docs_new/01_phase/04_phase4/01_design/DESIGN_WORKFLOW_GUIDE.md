# 🎨 Design Workflow Guide
## Phase 4A デザインフェーズ ワークフローガイド

> **Version**: 1.0  
> **Date**: 2026-01-09  
> **Purpose**: 08〜11のデザインプロンプト連携ガイド

---

## Overview

Phase 4A のデザインワークフローは、4つのプロンプトで構成されています。

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  DESIGN WORKFLOW                                                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  08_design_prep  →  09_design_create  →  10_design_pir  →  11_design_fix       │
│                                                                 ↑               │
│                                               (CONDITIONAL/FAILの場合のみ)       │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Phase Responsibilities

| Phase | プロンプト | 役割 | 出力 |
|:-----:|-----------|------|------|
| 1 | `08_design_prep.md` | 準備・計画 | `DESIGN_BRIEF_{SYSTEM_NAME}.md` |
| 2 | `09_design_create.md` | 作成 | `DESIGN_MANIFEST.md` + `wip/mocks/*.html` |
| 3 | `10_design_pir.md` | レビュー | `PIR_{SYSTEM_NAME}.md` |
| 4 | `11_design_fix.md` | 修正（必要時のみ） | 修正済みファイル |

---

## State Management

### Active Session State

`UI_PROGRESS_TRACKER.md` の `Active Session State` セクションで状態を管理します。

```markdown
## Active Session State

| 項目 | 値 |
|------|-----|
| Current System | `01_consumer` |
| Current Phase | `09_design_create` → `10_design_pir` |
| DESIGN_BRIEF | ✅ Created |
| DESIGN_MANIFEST | ✅ Created |
| Mocks Pushed | ✅ 17 files |
| PIR Report | ⬜ Not Yet |

### Last Completed Action
- Date: 2026-01-09
- Action: 09_design_create completed
- Output: DESIGN_MANIFEST.md + 17 mock files
- Next: 10_design_pir.md
```

### Session Variables

各フェーズで使用するセッション変数:

| 変数 | 説明 | 例 |
|------|------|-----|
| `{SYSTEM_ID}` | 2桁のID | `01`, `02` |
| `{SYSTEM_NAME}` | スネークケース名 | `consumer`, `token_hub` |
| `{SYSTEM_FULL_NAME}` | 表示名 | `Consumer App`, `Token Hub` |
| `{WORK_DIR}` | 作業ディレクトリ | `system_01_consumer/` |

---

## Phase Gate Checks

各フェーズは開始前に **STEP -1: 前提条件チェック** を実行します。

### 08_design_prep

```
必須ファイル:
- CORE_PRINCIPLES.md ✓
- PERSONAS.md ✓
- USER_JOURNEYS.md ✓
- UI_DESIGN_GUIDELINES.md ✓
- UI_PROGRESS_TRACKER.md ✓
```

### 09_design_create

```
前フェーズの出力確認:
- DESIGN_BRIEF_{SYSTEM_NAME}.md が存在する ✓
- DESIGN_BRIEF の内容が空でない ✓
```

### 10_design_pir

```
前フェーズの出力確認:
- DESIGN_MANIFEST.md が存在する ✓
- wip/mocks/ に .html ファイルが存在する ✓
- Screen Flow図が記載されている ✓
- Link Validation Tableが記載されている ✓
```

### 11_design_fix

```
前フェーズの出力確認:
- PIR_{SYSTEM_NAME}.md が存在する ✓
- Action Items Summary が記載されている ✓
- Overall Judgment が CONDITIONAL または FAIL ✓
```

---

## Directory Naming Convention

⚠️ **重要**: 全てのシステムディレクトリは以下の命名規則に従います。

```
system_{ID}_{SYSTEM_NAME}/

例:
system_01_consumer/       ✅ 正しい
system_01_consumer_app/   ❌ 間違い（DEPRECATED）
```

### System List

| ID | SYSTEM_NAME | Directory |
|----|-------------|-----------|
| 01 | consumer | `system_01_consumer/` |
| 02 | token_hub | `system_02_token_hub/` |
| 03 | governance | `system_03_governance/` |
| 04 | prover | `system_04_prover/` |
| 05 | observer | `system_05_observer/` |
| 06 | explorer | `system_06_explorer/` |
| 07 | enterprise | `system_07_enterprise/` |
| 08 | qs_admin | `system_08_qs_admin/` |

---

## File Output Summary

各フェーズの出力ファイル:

```
{WORK_DIR}/
├── README.md                           # システム概要 (08で作成)
├── DESIGN_BRIEF_{SYSTEM_NAME}.md       # デザインブリーフ (08で作成)
├── DESIGN_MANIFEST.md                  # マニフェスト (09で作成)
├── PIR_{SYSTEM_NAME}.md                # PIRレポート (10で作成)
│
└── wip/
    ├── wireframes/                     # ワイヤーフレーム (09で作成)
    │   └── *.md
    │
    └── mocks/                          # HTMLモック (09で作成)
        ├── 01_landing.html
        ├── 02_onboarding.html
        └── ...
```

---

## Troubleshooting

### Q: 前フェーズが完了していないエラーが出る

**A**: 前のフェーズのプロンプトを実行してください。
- `DESIGN_BRIEF` がない → `08_design_prep.md` を実行
- `DESIGN_MANIFEST` がない → `09_design_create.md` を実行
- `PIR_xxx.md` がない → `10_design_pir.md` を実行

### Q: セッション変数が空になっている

**A**: `UI_PROGRESS_TRACKER.md` の `Active Session State` を確認し、変数を再設定してください。

### Q: ディレクトリが見つからない

**A**: 命名規則を確認してください。`system_01_consumer/` が正しく、`system_01_consumer_app/` は DEPRECATED です。

### Q: PIR PASS なのに 11_design_fix を実行しようとした

**A**: PASS の場合は修正不要です。次のシステムに進んでください（`08_design_prep.md`）。

---

## Quick Reference

### 新しいシステムを開始する

1. `UI_PROGRESS_TRACKER.md` で次のシステムを確認
2. `08_design_prep.md` を実行
3. 順番に 09 → 10 → (11) と進む

### PIR結果別の次アクション

| 判定 | 次のアクション |
|:----:|----------------|
| ✅ PASS | `UI_PROGRESS_TRACKER.md` 更新 → 次システムへ |
| ⚠️ CONDITIONAL | `11_design_fix.md` → 自動承認 → 次システムへ |
| ❌ FAIL | `11_design_fix.md` → 再PIR (`10_design_pir.md`) |

---

## Related Documents

| ドキュメント | パス | 用途 |
|------------|------|------|
| UI Progress Tracker | `01_design/UI_PROGRESS_TRACKER.md` | 進捗管理・状態管理 |
| Design PIR Process | `01_design/DESIGN_PIR_PROCESS.md` | PIRプロセス詳細 |
| Design Review Agents | `01_design/DESIGN_REVIEW_AGENTS.md` | レビュアーAgent定義 |
| UI Design Guidelines | `01_design/UI_DESIGN_GUIDELINES.md` | デザインシステム |

---

**END OF GUIDE**
