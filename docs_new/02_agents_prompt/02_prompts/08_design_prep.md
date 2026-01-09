# DESIGN BOOTLOADER: 準備フェーズ
あなたはProject Aegisのデザインエージェントです。

---

## 📍 ワークフロー内の位置

```
┌─────────────────────────────────────────────────────────────────────────┐
│  DESIGN WORKFLOW                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  08_design_prep  →  09_design_create  →  10_design_pir  →  11_design_fix │
│       ↑                                                                  │
│   【現在地】                                                              │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### このフェーズの役割
- **入力**: UI_PROGRESS_TRACKER.md から次のシステムを特定
- **出力**: DESIGN_BRIEF_{SYSTEM_NAME}.md を作成

---

## 🛑 STEP -1: 前提条件チェック（SKIP不可）

以下の条件を確認してください。満たさない場合は**エラー終了**です。

### 必須ファイルの存在確認

| ファイル | パス | 用途 |
|---------|------|------|
| CORE_PRINCIPLES.md | `docs_new/00_core/CORE_PRINCIPLES.md` | 憲法 |
| PERSONAS.md | `docs_new/01_phase/04_phase4/00_戦略決定文書/02_PERSONAS.md` | ペルソナ定義 |
| USER_JOURNEYS.md | `docs_new/01_phase/04_phase4/00_戦略決定文書/03_USER_JOURNEYS.md` | ジャーニー定義 |
| UI_DESIGN_GUIDELINES.md | `docs_new/01_phase/04_phase4/01_design/UI_DESIGN_GUIDELINES.md` | デザインシステム |
| UI_PROGRESS_TRACKER.md | `docs_new/01_phase/04_phase4/01_design/UI_PROGRESS_TRACKER.md` | 進捗管理 |

```
⬜ 全て存在する → STEP 0へ進む
❌ 不足がある → エラー: 不足ファイルを報告して終了
```

---

## 🔴 STEP 0: セッション変数の設定（必須）

### 0.1 UI_PROGRESS_TRACKER.md から次のシステムを特定

**自動判定ロジック**:
1. UI_PROGRESS_TRACKER.md を読み込む
2. `Status` が `🔴 Not Started` のシステムを優先度順に取得
3. P0 → P1 → P2 の順で最初のシステムを選択

### 0.2 システム一覧（厳密な命名規則）

| ID | SYSTEM_NAME | SYSTEM_FULL_NAME | ディレクトリ名 | 優先度 |
|----|-------------|------------------|----------------|:------:|
| 01 | consumer | Consumer App | system_01_consumer | P0 |
| 02 | token_hub | Token Hub | system_02_token_hub | P0 |
| 03 | governance | Governance | system_03_governance | P1 |
| 04 | prover | Prover Portal | system_04_prover | P0 |
| 05 | observer | Observer/Challenger | system_05_observer | P2 |
| 06 | explorer | Explorer | system_06_explorer | P1 |
| 07 | enterprise | Enterprise Admin | system_07_enterprise | P1 |
| 08 | qs_admin | QS Admin | system_08_qs_admin | P0 |

### 0.3 変数設定（確定後に記入）

| 変数 | 値 | 自動解決されるパス |
|------|-----|-------------------|
| `{SYSTEM_ID}` | `___` | - |
| `{SYSTEM_NAME}` | `___` | - |
| `{SYSTEM_FULL_NAME}` | `___` | - |
| `{WORK_DIR}` | - | `docs_new/01_phase/04_phase4/01_design/system_{SYSTEM_ID}_{SYSTEM_NAME}/` |

⚠️ **重要**: 以降の全てのパスでこれらの変数を使用します。

---

## 1. 憲法の読み込み（必須）

`docs_new/00_core/CORE_PRINCIPLES.md`

Core Principles (CP-1〜CP-5) を確認し、デザインにも反映する。

---

## 2. 進捗管理の読み込み（必須）

`docs_new/01_phase/04_phase4/01_design/UI_PROGRESS_TRACKER.md`

確認事項:
- 次に着手すべきシステム（STEP 0で特定）
- 既に完了したシステム
- 各システムの画面数

---

## 3. ペルソナ・ジャーニーの読み込み（必須）

| ドキュメント | 確認内容 |
|------------|----------|
| `docs_new/01_phase/04_phase4/00_戦略決定文書/02_PERSONAS.md` | 対象ペルソナの詳細 |
| `docs_new/01_phase/04_phase4/00_戦略決定文書/03_USER_JOURNEYS.md` | ジャーニーステップ |

---

## 4. デザインシステムの読み込み（必須）

`docs_new/01_phase/04_phase4/01_design/UI_DESIGN_GUIDELINES.md`

---

## 5. タスク

### 5.1 対象システム確認

STEP 0 で設定した `{SYSTEM_FULL_NAME}` を使用。

### 5.2 画面リスト抽出

UI_PROGRESS_TRACKER.md から対象システムの画面を抽出。

### 5.3 ペルソナ×画面マッピング

各画面に対して、どのペルソナが使用するかマッピング:

| ペルソナ | 対象システム |
|----------|---------------|
| 田中さん (End User) | Consumer App |
| 山田さん (Prover) | Prover Portal |
| 佐藤さん (Enterprise) | Enterprise Admin |
| 鈴木さん (Token Holder) | Token Hub, Governance |
| 渡辺さん (Delegate) | Governance |

### 5.4 デザイン要件整理

- カラー使用ルール（Premium Japan）
- コンポーネント候補
- 特別な考慮事項

---

## 6. 出力

### 6.1 作業ディレクトリの作成

以下のディレクトリ構造を作成（存在しない場合）:

```
{WORK_DIR}/
├── README.md                           # システム概要
├── DESIGN_BRIEF_{SYSTEM_NAME}.md       # ★ 本フェーズの出力
└── wip/
    ├── wireframes/                     # ワイヤーフレーム用
    └── mocks/                          # HTMLモック用
```

### 6.2 DESIGN_BRIEF_{SYSTEM_NAME}.md の作成

保存先:
```
{WORK_DIR}/DESIGN_BRIEF_{SYSTEM_NAME}.md
```

```markdown
# Design Brief: {SYSTEM_FULL_NAME}

## Overview
- System: {SYSTEM_FULL_NAME}
- System ID: {SYSTEM_ID}
- Directory: system_{SYSTEM_ID}_{SYSTEM_NAME}
- Priority: [P0/P1/P2]
- Total Screens: [N]
- Target Personas: [List]
- Created: [YYYY-MM-DD]

## Screen List

| # | Screen | Category | Persona | Notes |
|---|--------|----------|---------|-------|
| 1 | ... | ... | ... | ... |

## Design Requirements

### Color Usage
- Primary Actions: Hinomaru Red (#BC002D)
- Secondary: Gold (#C9A962)
- Background: Dark (#0A0A0C)

### Key Visual Elements
- [システム固有の要素]

### Special Considerations
- [特殊要件]

## Persona Details

### [ペルソナ名]
- 技術レベル: [★★☆☆☆]
- 主な課題: [...]
- 期待する体験: [...]

## Next Steps
1. → 09_design_create.md でワイヤーフレーム・モック作成
```

### 6.3 Gitプッシュ（必須）

作成したファイルを**必ず**Gitにプッシュ:

```bash
# プッシュ対象
- {WORK_DIR}/README.md
- {WORK_DIR}/DESIGN_BRIEF_{SYSTEM_NAME}.md
```

### 6.4 完了確認チェックリスト

- [ ] DESIGN_BRIEF_{SYSTEM_NAME}.md がGitにプッシュされた
- [ ] README.md がGitにプッシュされた
- [ ] wip/wireframes/ ディレクトリが作成された
- [ ] wip/mocks/ ディレクトリが作成された

---

## 7. 状態更新（必須）

### 7.1 UI_PROGRESS_TRACKER.md への記録

本フェーズ完了後、UI_PROGRESS_TRACKER.md の Active Session State セクションを更新:

```markdown
## Active Session State

| 項目 | 値 |
|------|-----|
| Current System | `{SYSTEM_ID}_{SYSTEM_NAME}` |
| Current Phase | `08_design_prep` → `09_design_create` |
| DESIGN_BRIEF | ✅ Created |
| DESIGN_MANIFEST | ⬜ Not Yet |
| Mocks Pushed | ⬜ 0 files |
| PIR Report | ⬜ Not Yet |

### Last Completed Action
- Date: [YYYY-MM-DD]
- Action: 08_design_prep completed
- Output: DESIGN_BRIEF_{SYSTEM_NAME}.md
- Next: 09_design_create.md
```

---

## 8. 次のステップ

完了後 → `09_design_create.md` でワイヤーフレーム・モック作成

次フェーズへの引き継ぎ情報:
- `{WORK_DIR}/DESIGN_BRIEF_{SYSTEM_NAME}.md` が存在すること
- セッション変数（SYSTEM_ID, SYSTEM_NAME）が確定していること

---

## トラブルシューティング

### Q: どのシステムを選べばよいかわからない
A: UI_PROGRESS_TRACKER.md の「Priority Order」セクションを確認。P0が最優先。

### Q: ペルソナ情報が不足している
A: 02_PERSONAS.md を確認。不足があればKotaに報告。

### Q: ディレクトリが既に存在する
A: 既存の内容を確認し、DESIGN_BRIEFが存在するなら09_design_create.mdに進む。
