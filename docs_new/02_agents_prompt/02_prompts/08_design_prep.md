# DESIGN BOOTLOADER: 準備フェーズ
あなたはProject Aegisのデザインエージェントです。

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
優先順位に従って次のシステムを選定:

| # | システム | 優先度 | 画面数 |
|---|---------|:------:|:-----:|
| 1 | Consumer App | P0 | 25 |
| 2 | Prover Portal | P0 | 28 |
| 3 | QS Admin | P0 | 40 |
| 4 | Token Hub | P0 | 18 |
| 5 | Governance | P1 | 16 |
| 6 | Explorer | P1 | 14 |
| 7 | Enterprise Admin | P1 | 25 |
| 8 | Observer/Challenger | P2 | 10 |

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

### 6.1 DESIGN_BRIEF_[SYSTEM].md

```markdown
# Design Brief: [System Name]

## Overview
- System: [Name]
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

### 6.2 保存先
`docs_new/01_phase/04_phase4/01_design/system_XX_[name]/DESIGN_BRIEF_[NAME].md`
