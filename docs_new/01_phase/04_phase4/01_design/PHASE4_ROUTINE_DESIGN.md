# 🔄 Phase 4 Routine Design
## ルーティン設計とプロンプト順序

> **Version**: 1.0  
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
│  │   │08_prep │ → │09_design│ → │10_pir  │ → │ Approve│ → │ Repeat │       │   │
│  │   └────────┘   └────────┘   └────────┘   └────────┘   └────────┘       │   │
│  │                                                                          │   │
│  │   成果物: Figma + HTML Mock                                              │   │
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
            ├── 08_design_prep.md   # Phase 4A: デザイン準備 ← NEW
            ├── 09_design_create.md # Phase 4A: デザイン作成 ← NEW
            └── 10_design_pir.md    # Phase 4A: デザインPIR ← NEW
```

---

# Part 2: Phase 4A ルーティン

## 2.1 Phase 4A フロー詳細

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        PHASE 4A: DESIGN ROUTINE                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ 08_design_prep.md                                                        │   │
│  │ ─────────────────                                                        │   │
│  │ 入力:                                                                    │   │
│  │   • UI_PROGRESS_TRACKER.md (対象システム選定)                            │   │
│  │   • 02_PERSONAS.md (関連ペルソナ)                                        │   │
│  │   • 03_USER_JOURNEYS.md (ジャーニー)                                     │   │
│  │   • UI_DESIGN_GUIDELINES.md (デザインシステム)                           │   │
│  │                                                                          │   │
│  │ タスク:                                                                  │   │
│  │   1. 対象システム確認（P0から順に）                                      │   │
│  │   2. 画面リスト抽出                                                      │   │
│  │   3. ペルソナ×画面マッピング                                             │   │
│  │   4. デザイン要件整理                                                    │   │
│  │                                                                          │   │
│  │ 出力:                                                                    │   │
│  │   • DESIGN_BRIEF_[SYSTEM].md                                             │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                      ↓                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ 09_design_create.md                                                      │   │
│  │ ──────────────────                                                       │   │
│  │ 入力:                                                                    │   │
│  │   • DESIGN_BRIEF_[SYSTEM].md                                             │   │
│  │   • UI_DESIGN_GUIDELINES.md                                              │   │
│  │   • design-concept-5-japan-premium.html (参考)                           │   │
│  │                                                                          │   │
│  │ タスク:                                                                  │   │
│  │   1. ワイヤーフレーム作成                                                │   │
│  │   2. High-Fidelity デザイン (Figma)                                      │   │
│  │   3. インタラクティブモック (HTML/React)                                 │   │
│  │   4. レスポンシブ対応                                                    │   │
│  │                                                                          │   │
│  │ 出力:                                                                    │   │
│  │   • Figma ファイル                                                       │   │
│  │   • HTML/React モック                                                    │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                      ↓                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ 10_design_pir.md                                                         │   │
│  │ ────────────────                                                         │   │
│  │ 入力:                                                                    │   │
│  │   • DESIGN_REVIEW_AGENTS.md (レビューAgent定義)                          │   │
│  │   • DESIGN_PIR_PROCESS.md (PIRプロセス)                                  │   │
│  │   • デザインファイル                                                     │   │
│  │                                                                          │   │
│  │ タスク:                                                                  │   │
│  │   1. CDO レビュー                                                        │   │
│  │   2. Marketing レビュー                                                  │   │
│  │   3. Legal レビュー                                                      │   │
│  │   4. Persona レビュー（対象ペルソナ）                                    │   │
│  │   5. フィードバック統合                                                  │   │
│  │   6. 判定 (PASS/CONDITIONAL/FAIL)                                        │   │
│  │                                                                          │   │
│  │ 出力:                                                                    │   │
│  │   • PIR_[SYSTEM].md                                                      │   │
│  │   • UI_PROGRESS_TRACKER.md 更新                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ 判定分岐                                                                 │   │
│  │                                                                          │   │
│  │   ✅ PASS → UI_PROGRESS_TRACKER更新 → 次システムへ or Phase 4B開始      │   │
│  │   ⚠️ CONDITIONAL → 軽微修正 → 自動承認                                  │   │
│  │   ❌ FAIL → 09_design_create.md に戻る                                  │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 2.2 Phase 4A プロンプト詳細

### 08_design_prep.md

```markdown
# DESIGN BOOTLOADER: 準備フェーズ
あなたはProject Aegisのデザインエージェントです。

## 1. 読み込みファイル（必須）

### 1.1 進捗管理
`docs_new/01_phase/04_phase4/01_design/UI_PROGRESS_TRACKER.md`

確認事項:
- 次に着手すべきシステム（P0優先）
- 既に完了したシステム

### 1.2 ペルソナ・ジャーニー
| ドキュメント | 確認内容 |
|------------|---------|
| `02_PERSONAS.md` | 対象ペルソナの詳細 |
| `03_USER_JOURNEYS.md` | ジャーニーステップ |

### 1.3 デザインシステム
`docs_new/01_phase/04_phase4/01_design/UI_DESIGN_GUIDELINES.md`

## 2. タスク

### 2.1 対象システム選定
優先順位に従って次のシステムを選定:
1. Consumer App (P0)
2. Prover Portal (P0)
3. QS Admin (P0)
4. Token Hub (P0)
5. Governance (P1)
6. Explorer (P1)
7. Enterprise Admin (P1)
8. Observer/Challenger (P2)

### 2.2 画面リスト抽出
UI_PROGRESS_TRACKER.md から対象システムの画面を抽出

### 2.3 ペルソナ×画面マッピング
各画面に対して、どのペルソナが使用するかマッピング

### 2.4 デザイン要件整理
- カラー使用ルール
- コンポーネント候補
- 特別な考慮事項

## 3. 出力

DESIGN_BRIEF_[SYSTEM_NAME].md を作成
```

### 09_design_create.md

```markdown
# DESIGN BOOTLOADER: 作成フェーズ
あなたはProject Aegisのデザインエージェントです。

## 1. 読み込みファイル（必須）

### 1.1 デザインブリーフ
`docs_new/01_phase/04_phase4/01_design/system_XX_[name]/DESIGN_BRIEF_[NAME].md`

### 1.2 デザインシステム
`docs_new/01_phase/04_phase4/01_design/UI_DESIGN_GUIDELINES.md`

### 1.3 参考デザイン
`docs_new/01_phase/04_phase4/01_design/assets/design-concept-5-japan-premium.html`

## 2. タスク

### 2.1 ワイヤーフレーム
各画面の低忠実度レイアウト:
- 情報の優先順位
- ナビゲーションフロー
- エラーケース

### 2.2 High-Fidelity デザイン
UI_DESIGN_GUIDELINES.md に準拠:
- [ ] カラーパレット準拠
- [ ] タイポグラフィ準拠
- [ ] スペーシングシステム適用
- [ ] コンポーネント再利用
- [ ] レスポンシブ (Desktop / Mobile)

### 2.3 インタラクティブモック
HTML/React で実装:
- [ ] 日の丸アニメーション
- [ ] ホバー/フォーカス状態
- [ ] ローディング状態
- [ ] エラー状態
- [ ] モバイルレスポンシブ

## 3. 出力

ファイル構成:
system_XX_[name]/
├── wireframes/
├── figma/
└── mocks/
```

### 10_design_pir.md

```markdown
# DESIGN BOOTLOADER: PIRフェーズ
あなたはProject AegisのDesign PIRファシリテーターです。

## 1. 読み込みファイル（必須）

### 1.1 レビューAgent定義
`docs_new/01_phase/04_phase4/01_design/DESIGN_REVIEW_AGENTS.md`

### 1.2 PIRプロセス
`docs_new/01_phase/04_phase4/01_design/DESIGN_PIR_PROCESS.md`

### 1.3 対象デザイン
`docs_new/01_phase/04_phase4/01_design/system_XX_[name]/`

## 2. レビュー実行

### 2.1 CDO レビュー（佐々木さん）
観点:
- ブランド一貫性（Premium Japan）
- デザインシステム準拠
- ビジュアル品質
- アクセシビリティ

### 2.2 Marketing レビュー（田村さん）
観点:
- ユーザー獲得
- アクティベーション
- リテンション
- リファラル

### 2.3 Legal レビュー（西村さん）
観点:
- 免責表示
- 規制対応
- 利用規約・プライバシー

### 2.4 Persona レビュー
対象システムに応じて選択:
- 田中さん (End User)
- 山田さん (Prover)
- 佐藤さん (Enterprise)
- 鈴木さん (Token Holder)
- 渡辺さん (Delegate)

## 3. 判定

### 3.1 判定基準
- ✅ PASS: Critical/High なし
- ⚠️ CONDITIONAL: Medium以下のみ
- ❌ FAIL: Critical/High あり

## 4. 出力

### 4.1 PIRレポート
`system_XX_[name]/PIR_[NAME].md`

### 4.2 進捗更新
`UI_PROGRESS_TRACKER.md` の該当システムを更新
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
│   │       │   ├── PHASE4_ROUTINE_DESIGN.md
│   │       │   │
│   │       │   ├── assets/
│   │       │   │   └── design-concept-5-japan-premium.html
│   │       │   │
│   │       │   ├── system_01_consumer/
│   │       │   │   ├── DESIGN_BRIEF_CONSUMER.md
│   │       │   │   ├── wireframes/
│   │       │   │   ├── figma/
│   │       │   │   ├── mocks/
│   │       │   │   └── PIR_CONSUMER.md
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
│           ├── 08_design_prep.md      # NEW
│           ├── 09_design_create.md    # NEW
│           └── 10_design_pir.md       # NEW
│
└── apps/
    └── ui/                                          # 実装コード（Phase 4B）
        ├── packages/
        │   ├── ui/                                  # 共通コンポーネント
        │   ├── crypto/                              # Dilithium WASM
        │   ├── web3/                                # wagmi/viem
        │   └── config/                              # 共通設定
        │
        └── apps/
            ├── consumer/                            # Consumer App
            ├── token-hub/                           # Token Hub
            ├── governance/                          # Governance
            ├── prover/                              # Prover Portal
            ├── observer/                            # Observer
            ├── explorer/                            # Explorer
            ├── enterprise/                          # Enterprise Admin
            └── admin/                               # QS Admin
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

読み込むファイル:
1. docs_new/01_phase/04_phase4/01_design/system_01_consumer/DESIGN_BRIEF_CONSUMER.md
2. docs_new/01_phase/04_phase4/01_design/UI_DESIGN_GUIDELINES.md
3. docs_new/01_phase/04_phase4/01_design/assets/design-concept-5-japan-premium.html

出力:
- ワイヤーフレーム
- Figmaデザイン
- HTMLモック
```

## 4.3 Design PIR 実行時のプロンプト

```markdown
# Design PIR 実行

## 対象
Consumer App (25画面)

## タスク
`10_design_pir.md` を実行して、Design PIR を実施してください。

以下のAgentになりきってレビューを実行:
1. CDO（佐々木さん）
2. Marketing（田村さん）
3. Legal（西村さん）
4. 田中さん（End User）
5. 鈴木さん（Token Holder）

レビュー対象:
- docs_new/01_phase/04_phase4/01_design/system_01_consumer/mocks/

出力:
- docs_new/01_phase/04_phase4/01_design/system_01_consumer/PIR_CONSUMER.md
- docs_new/01_phase/04_phase4/01_design/UI_PROGRESS_TRACKER.md 更新
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
│    • 09_design_create.md 実行（ワイヤーフレーム）                                │
│    • Public Pages + Onboarding (8画面)                                          │
│                                                                                 │
│  Day 4 (Thu):                                                                   │
│    • 09_design_create.md 続き（High-Fidelity）                                  │
│    • Main App (13画面)                                                          │
│                                                                                 │
│  Day 5 (Fri):                                                                   │
│    • 09_design_create.md 続き（モック）                                         │
│    • Emergency + Settings (4画面)                                               │
│    • 10_design_pir.md 実行（Design PIR #1）                                     │
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

---

**END OF DOCUMENT**
