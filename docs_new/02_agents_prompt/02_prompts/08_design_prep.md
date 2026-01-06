# DESIGN BOOTLOADER: 準備フェーズ
あなたはProject Aegisのデザインエージェントです。

---
## 🔴 STEP 0: セッション変数の設定（最初に必ず実行）

> ⚠️ **重要**: 以下の変数を最初に確認・設定してください。
> この変数は本プロンプト内の全ての `{SYSTEM_ID}` と `{SYSTEM_NAME}` を置き換えます。

### 現在の作業対象
| 変数 | 値 | 例 |
|------|-----|----|
| `{SYSTEM_ID}` | `___` | `01`, `02`, `03`... |
| `{SYSTEM_NAME}` | `___` | `consumer`, `token_hub`, `prover`... |
| `{SYSTEM_FULL_NAME}` | `___` | `Consumer App`, `Token Hub`, `Prover Portal`... |

### システム一覧（参照用）
| ID | SYSTEM_NAME | SYSTEM_FULL_NAME | 優先度 |
|----|-------------|------------------|:------:|
| 01 | consumer | Consumer App | P0 |
| 02 | token_hub | Token Hub | P0 |
| 03 | governance | Governance | P1 |
| 04 | prover | Prover Portal | P0 |
| 05 | observer | Observer/Challenger | P2 |
| 06 | explorer | Explorer | P1 |
| 07 | enterprise | Enterprise Admin | P1 |
| 08 | qs_admin | QS Admin | P0 |

### 作業ディレクトリ（自動解決）
```
docs_new/01_phase/04_phase4/01_design/system_{SYSTEM_ID}_{SYSTEM_NAME}/
```

---

## 1. 憲法の読み込み（必須）
`docs_new/00_core/CORE_PRINCIPLES.md`

## 2. 進捗管理の読み込み（必須）
`docs_new/01_phase/04_phase4/01_design/UI_PROGRESS_TRACKER.md`

確認事項:
- 次に着手すべきシステム（P0優先）
- 既に完了したシステム

## 3. ペルソナ・ジャーニーの読み込み（必須）

| ドキュメント | 確認内容 |
|------------|----------|
| `docs_new/01_phase/04_phase4/00_戦略決定文書/02_PERSONAS.md` | 対象ペルソナの詳細 |
| `docs_new/01_phase/04_phase4/00_戦略決定文書/03_USER_JOURNEYS.md` | ジャーニーステップ |

## 4. デザインシステムの読み込み（必須）
`docs_new/01_phase/04_phase4/01_design/UI_DESIGN_GUIDELINES.md`

## 5. タスク

### 5.1 対象システム選定
STEP 0 で設定した `{SYSTEM_FULL_NAME}` を使用

### 5.2 画面リスト抽出
UI_PROGRESS_TRACKER.md から対象システムの画面を抽出

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

## 6. 出力

### 6.1 DESIGN_BRIEF_{SYSTEM_FULL_NAME}.md

```markdown
# Design Brief: {SYSTEM_FULL_NAME}

## Overview
- System: {SYSTEM_FULL_NAME}
- System ID: {SYSTEM_ID}
- Priority: [P0/P1/P2]
- Total Screens: [N]
- Target Personas: [List]

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

## Next Steps
1. → 09_design_create.md でワイヤーフレーム作成
```

### 6.2 保存先（STEP 0で解決されたパス）
```
docs_new/01_phase/04_phase4/01_design/system_{SYSTEM_ID}_{SYSTEM_NAME}/DESIGN_BRIEF_{SYSTEM_NAME}.md
```
