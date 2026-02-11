# Folder Restructure Plan

> **目的**: docs_new/ の6階層構造を整理し、開発効率を向上させる
> **作成日**: 2026-01-22
> **ステータス**: 計画段階（レビュー待ち）

---

## 1. 現状分析

### 1.1 現在の構造

```
docs_new/                              # レベル0
├── 00_core/                           # レベル1
│   └── specs/                         # レベル2
│
├── 01_phase/                          # レベル1
│   ├── 01_Phase1/                     # レベル2
│   │   ├── 100_SPEC REVIEW/           # レベル3
│   │   └── 99_PIR/                    # レベル3
│   │
│   ├── 02_Phase2/                     # レベル2
│   │   └── ...                        # レベル3
│   │
│   ├── 03_Phase3/                     # レベル2
│   │   └── 00_strategy/               # レベル3
│   │       └── round1_reports/        # レベル4
│   │
│   ├── 04_phase4/                     # レベル2
│   │   └── 01_design/                 # レベル3
│   │       └── system_01_consumer/    # レベル4
│   │           └── wip/               # レベル5
│   │               └── mocks/         # レベル6 ← 最深部
│   │
│   └── 06_phase6/                     # レベル2
│       └── *.md                       # レベル3
│
└── 02_agents_prompt/                  # レベル1
    └── 02_prompts/                    # レベル2
```

### 1.2 問題点

| 問題 | 詳細 | 影響 |
|------|------|------|
| **深すぎるネスト** | 最大6階層（mocks/まで） | パス入力が長く、間違いやすい |
| **命名の不一致** | `01_Phase1` vs `04_phase4` | 混乱を招く |
| **番号プレフィックス** | `01_`, `02_` などの番号 | 新規追加時に番号調整が必要 |
| **日本語フォルダ名** | `01_戦略検討資料`, `ぼつ` | CLIでの操作が困難 |
| **アクティブ/アーカイブ混在** | 同一階層に両方存在 | 必要な情報を見つけにくい |

---

## 2. 提案: 新フォルダ構造

### 2.1 基本方針

1. **最大3階層**に制限
2. **英語命名**で統一
3. **番号プレフィックス削除**（必要な場合のみ使用）
4. **アクティブ/アーカイブ分離**

### 2.2 新構造案

```
docs/                                    # レベル0
│
├── README.md                            # ドキュメント概要
│
├── specs/                               # レベル1: 仕様書
│   ├── UNIFIED_SPEC.md                  # 統合仕様書
│   ├── SEQUENCES.md                     # シーケンス詳細
│   ├── DATA_MODEL.md                    # データモデル
│   └── URL_REFERENCE.md                 # URL一覧
│
├── design/                              # レベル1: デザイン
│   ├── DESIGN_SYSTEM.md                 # デザインシステム
│   ├── DESIGN_SPEC.md                   # 設計仕様書
│   ├── CODEBASE_MAP.md                  # コードベース地図
│   │
│   ├── mocks/                           # レベル2: HTMLモック
│   │   ├── consumer/                    # レベル3
│   │   ├── token-hub/
│   │   ├── governance/
│   │   ├── prover/
│   │   ├── observer/
│   │   ├── explorer/
│   │   ├── enterprise/
│   │   └── admin/
│   │
│   └── assets/                          # レベル2: デザインアセット
│       └── design-concept-5-japan-premium.html
│
├── guides/                              # レベル1: 開発ガイド
│   ├── DEVELOPMENT_PLAN.md
│   ├── DEVELOPMENT_PROGRESS.md
│   └── VALIDATION_*.md
│
├── prompts/                             # レベル1: AIプロンプト
│   ├── 30_ui_impl.md
│   ├── 31_design_pir.md
│   └── ...
│
├── archive/                             # レベル1: アーカイブ
│   ├── phase1/
│   ├── phase2/
│   ├── phase3/
│   └── phase4-strategy/
│
└── progress/                            # レベル1: 進捗管理
    └── PHASE6_PROGRESS.md
```

---

## 3. マイグレーション計画

### 3.1 Phase A: 準備（影響調査）

| タスク | 詳細 | 所要時間 |
|--------|------|----------|
| 参照調査 | CLAUDE.md, 各mdファイルからの参照パスを洗い出し | - |
| 依存調査 | コード内からのimport/参照を確認 | - |
| バックアップ | 現状のgit commitを作成 | - |

### 3.2 Phase B: ファイル移動

| 移動元 | 移動先 | 優先度 |
|--------|--------|:------:|
| `docs_new/01_phase/06_phase6/*.md` | `docs/specs/`, `docs/design/`, `docs/guides/` | 高 |
| `docs_new/00_core/specs/` | `docs/specs/` | 高 |
| `docs_new/01_phase/04_phase4/01_design/assets/` | `docs/design/assets/` | 高 |
| `docs_new/01_phase/04_phase4/01_design/system_*/wip/mocks/` | `docs/design/mocks/{app}/` | 高 |
| `docs_new/02_agents_prompt/02_prompts/` | `docs/prompts/` | 中 |
| `docs_new/01_phase/01_Phase1/` | `docs/archive/phase1/` | 低 |
| `docs_new/01_phase/02_Phase2/` | `docs/archive/phase2/` | 低 |
| `docs_new/01_phase/03_Phase3/` | `docs/archive/phase3/` | 低 |

### 3.3 Phase C: 参照更新

| ファイル | 更新内容 |
|----------|----------|
| `CLAUDE.md` | 全パス参照を新構造に更新 |
| `docs/design/CODEBASE_MAP.md` | パス参照を更新 |
| `apps/web/` 内の参照 | 必要に応じて更新 |

### 3.4 Phase D: 検証

- [ ] 全mdファイルのリンクが有効
- [ ] CLAUDE.mdの参照が正しく動作
- [ ] HTMLモックが正しく表示される

---

## 4. リスクと対策

| リスク | 影響 | 対策 |
|--------|------|------|
| 参照切れ | ドキュメント間リンクが壊れる | grep で全参照を事前調査 |
| 開発中断 | 他のメンバーの作業に影響 | 事前告知、短時間で完了 |
| 履歴断絶 | git historyが追いにくい | git mv 使用で履歴保持 |

---

## 5. 実行判断

### 実行する場合

```bash
# Step 1: 新構造作成
mkdir -p docs/{specs,design/mocks,design/assets,guides,prompts,archive,progress}

# Step 2: ファイル移動（git mv使用）
git mv docs_new/01_phase/06_phase6/DATA_MODEL.md docs/specs/
git mv docs_new/01_phase/06_phase6/DESIGN_SYSTEM.md docs/design/
# ... 以下続く

# Step 3: 参照更新
# CLAUDE.md 等のパスを更新

# Step 4: コミット
git add -A
git commit -m "refactor: reorganize docs folder structure"
```

### 延期する場合

現状のドキュメントは機能しており、Phase 6 の UI実装を優先する場合は延期可能。
その場合、本計画書は将来の参照用として保持。

---

## 6. 決定事項（ユーザー確認待ち）

- [ ] 新構造案の承認
- [ ] 実行タイミング（今すぐ / Phase 6 完了後）
- [ ] アーカイブ対象の確認（Phase 1-3 は本当にアーカイブでよいか）

---

## 更新履歴

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-22 | Claude | 初版作成 |
