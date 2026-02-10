# 🔄 Design PIR Process
## Phase 4A デザインフェーズ専用PIRプロセス

> **Version**: 1.0  
> **Date**: 2026-01-06  
> **Scope**: Phase 4A（Discovery & Design）

---

# Part 1: Overview

## 1.1 Phase 4A vs Phase 4B

```
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 4A: Discovery & Design                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  単位: システム単位（8システム）                                │
│  成果物: Figma + HTML Mock（フロントエンドのみ、API接続なし）   │
│  レビュー: Design PIR（軽量、週2回可能）                        │
│  レビュアー: CDO, Marketing, Legal, UX Personas                 │
│                                                                 │
│  フロー:                                                        │
│  ┌──────┐   ┌──────┐   ┌──────┐   ┌──────┐   ┌──────┐          │
│  │ Wire │ → │Design│ → │ Mock │ → │Review│ → │Approve│          │
│  │frame │   │      │   │      │   │ PIR  │   │      │          │
│  └──────┘   └──────┘   └──────┘   └──────┘   └──────┘          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  PHASE 4B: Integration                                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  単位: 7画面/PIR（既存ルール継続）                              │
│  成果物: 実装済みUI + API統合                                   │
│  レビュー: 通常PIR（01_plan → 07_gonogo フロー）                │
│  レビュアー: 全Agentペルソナ                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 1.2 Design PIR の特徴

| 項目 | 通常PIR | Design PIR |
|------|---------|------------|
| 頻度 | 週1回 | 週2回可能 |
| 所要時間 | 2-3時間 | 1-1.5時間 |
| レビュー対象 | コード + テスト | Figma + Mock |
| レビュアー | 全Agent | Design専門Agent |
| 成果物 | 実装コード | デザインファイル |
| 次フェーズ | 本番デプロイ | Phase 4B実装 |

---

# Part 2: Design PIR Workflow

## 2.1 全体フロー

```
┌─────────────────────────────────────────────────────────────────┐
│  DESIGN PIR WORKFLOW                                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ STEP 1: 準備 (Design Prep)                               │   │
│  │ • 対象システム選定                                        │   │
│  │ • ペルソナ・ジャーニー確認                                │   │
│  │ • 画面リスト作成                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                          ↓                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ STEP 2: ワイヤーフレーム (Wireframe)                     │   │
│  │ • 低忠実度スケッチ                                        │   │
│  │ • 情報設計・レイアウト確認                                │   │
│  │ • 内部レビュー                                            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                          ↓                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ STEP 3: デザイン (High-Fidelity Design)                  │   │
│  │ • Figmaでデザイン作成                                     │   │
│  │ • UI_DESIGN_GUIDELINES.md 準拠                           │   │
│  │ • コンポーネント化                                        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                          ↓                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ STEP 4: モック (Interactive Mock)                        │   │
│  │ • HTML/React モック作成                                   │   │
│  │ • アニメーション・インタラクション実装                    │   │
│  │ • レスポンシブ対応                                        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                          ↓                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ STEP 5: Design PIR                                       │   │
│  │ • Agent レビュー（CDO, Marketing, Legal, Personas）      │   │
│  │ • フィードバック収集                                      │   │
│  │ • 修正対応                                                │   │
│  └─────────────────────────────────────────────────────────┘   │
│                          ↓                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ STEP 6: 承認 (Approval)                                  │   │
│  │ • UI_PROGRESS_TRACKER.md 更新                            │   │
│  │ • デザインファイル確定                                    │   │
│  │ • Phase 4B 実装準備                                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 2.2 各ステップ詳細

### STEP 1: 準備 (Design Prep)

**入力:**
- `02_PERSONAS.md` - 対象ペルソナ
- `03_USER_JOURNEYS.md` - ユーザージャーニー
- `04_SCREENS.md` - 画面定義
- `UI_DESIGN_GUIDELINES.md` - デザインシステム

**出力:**
- 対象画面リスト（システム単位）
- ペルソナ×画面マッピング

**チェックリスト:**
- [ ] 対象システム決定
- [ ] 関連ペルソナ特定
- [ ] ジャーニー確認
- [ ] 画面リスト作成（UI_PROGRESS_TRACKER.mdから）

---

### STEP 2: ワイヤーフレーム

**入力:**
- 画面リスト
- ペルソナの課題・ニーズ

**出力:**
- 低忠実度ワイヤーフレーム（手書き or Figma）
- 情報設計ドキュメント

**チェックリスト:**
- [ ] 各画面のレイアウト決定
- [ ] 情報の優先順位付け
- [ ] ナビゲーションフロー確認
- [ ] エラーケース検討

---

### STEP 3: デザイン (High-Fidelity)

**入力:**
- 承認済みワイヤーフレーム
- `UI_DESIGN_GUIDELINES.md`

**出力:**
- Figmaデザインファイル
- コンポーネント定義

**チェックリスト:**
- [ ] カラーパレット準拠（日の丸レッド、ゴールド等）
- [ ] タイポグラフィ準拠
- [ ] スペーシングシステム適用
- [ ] コンポーネント再利用
- [ ] レスポンシブバリエーション（Desktop / Mobile）
- [ ] ダーク/ライトモード対応

---

### STEP 4: モック (Interactive Mock)

**入力:**
- Figmaデザイン

**出力:**
- HTML/React インタラクティブモック
- アニメーション実装

**チェックリスト:**
- [ ] 日の丸アニメーション実装
- [ ] ホバー/フォーカス状態
- [ ] ローディング状態
- [ ] エラー状態
- [ ] モバイルレスポンシブ
- [ ] アクセシビリティ（フォーカス、コントラスト）

---

### STEP 5: Design PIR

**参加Agent:**
- CDO（最高デザイン責任者）
- Marketing
- Legal
- UX Personas（田中さん、山田さん等）

**レビュー観点:**

| Agent | 観点 |
|-------|------|
| CDO | ブランド一貫性、デザインシステム準拠 |
| Marketing | ユーザー獲得、コンバージョン |
| Legal | 規制対応、免責表示 |
| Personas | 使いやすさ、ペルソナニーズ充足 |

**出力:**
- フィードバックリスト
- 修正要否判定

---

### STEP 6: 承認

**条件:**
- 全Agentから PASS または CONDITIONAL PASS
- Critical/High の指摘事項なし

**出力:**
- `UI_PROGRESS_TRACKER.md` 更新（Figma: ✅, Mock: ✅）
- デザインファイル確定（バージョンタグ付け）

---

# Part 3: Design PIR Meeting Format

## 3.1 アジェンダ

```
┌─────────────────────────────────────────────────────────────────┐
│  DESIGN PIR AGENDA (60-90分)                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. オープニング (5分)                                          │
│     • 対象システム確認                                          │
│     • 前回からの変更点                                          │
│                                                                 │
│  2. デザインプレゼンテーション (15分)                           │
│     • 画面ウォークスルー                                        │
│     • ジャーニー沿いのデモ                                      │
│                                                                 │
│  3. Agent レビュー (30-45分)                                    │
│     • CDO レビュー                                              │
│     • Marketing レビュー                                        │
│     • Legal レビュー                                            │
│     • Persona レビュー                                          │
│                                                                 │
│  4. フィードバック整理 (10分)                                   │
│     • Critical/High/Medium/Low 分類                             │
│     • 修正対応決定                                              │
│                                                                 │
│  5. 判定 (5分)                                                  │
│     • PASS / CONDITIONAL / FAIL                                 │
│     • 次ステップ確認                                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 3.2 判定基準

| 判定 | 条件 | 次アクション |
|:----:|------|-------------|
| ✅ PASS | Critical/High なし | Phase 4B 実装開始可 |
| ⚠️ CONDITIONAL | Medium以下のみ | 軽微修正後に自動承認 |
| ❌ FAIL | Critical/High あり | 修正後に再PIR |

## 3.3 フィードバックテンプレート

```markdown
## Design PIR Feedback

### レビュー対象
- システム: [Consumer App / Token Hub / ...]
- 画面数: [X] 画面
- レビュー日: [YYYY-MM-DD]

### Agent レビュー結果

#### CDO
| # | 重要度 | 画面 | 指摘 | 対応 |
|---|:------:|------|------|------|
| 1 | High | Dashboard | ... | ... |

#### Marketing
| # | 重要度 | 画面 | 指摘 | 対応 |
|---|:------:|------|------|------|

#### Legal
| # | 重要度 | 画面 | 指摘 | 対応 |
|---|:------:|------|------|------|

#### Persona (田中さん)
| # | 重要度 | 画面 | 指摘 | 対応 |
|---|:------:|------|------|------|

### 総合判定
- [ ] ✅ PASS
- [ ] ⚠️ CONDITIONAL
- [ ] ❌ FAIL

### 次アクション
1. ...
2. ...
```

---

# Part 4: ファイル構成

## 4.1 ディレクトリ構造

```
quantum-shield/
├── docs_new/
│   └── 01_phase/
│       └── 04_phase4/
│           ├── 00_戦略決定文書/
│           │   ├── 02_PERSONAS.md
│           │   ├── 03_USER_JOURNEYS.md
│           │   └── 04_SCREENS.md
│           │
│           ├── 01_design/                    # ← NEW: Phase 4A
│           │   ├── UI_DESIGN_GUIDELINES.md
│           │   ├── UI_PROGRESS_TRACKER.md
│           │   ├── DESIGN_PIR_PROCESS.md
│           │   ├── DESIGN_REVIEW_AGENTS.md
│           │   │
│           │   ├── assets/
│           │   │   └── design-concept-5-japan-premium.html
│           │   │
│           │   ├── system_01_consumer/
│           │   │   ├── wireframes/
│           │   │   ├── figma/
│           │   │   ├── mocks/
│           │   │   └── PIR_CONSUMER_APP.md
│           │   │
│           │   ├── system_02_token_hub/
│           │   ├── system_03_governance/
│           │   ├── system_04_prover/
│           │   ├── system_05_observer/
│           │   ├── system_06_explorer/
│           │   ├── system_07_enterprise/
│           │   └── system_08_qs_admin/
│           │
│           └── 02_implementation/            # Phase 4B（後で使用）
│
└── apps/
    └── ui/                                   # 実装コード（Phase 4B）
        ├── packages/
        │   ├── ui/                           # 共通コンポーネント
        │   └── config/
        └── apps/
            ├── consumer/
            ├── prover/
            └── admin/
```

## 4.2 Figma 構成（推奨）

```
Quantum Shield Design System
├── 🎨 Design System
│   ├── Colors
│   ├── Typography
│   ├── Spacing
│   ├── Icons
│   └── Components
│
├── 📱 Consumer App
│   ├── Desktop
│   └── Mobile
│
├── 🏢 Prover Portal
│   ├── Desktop
│   └── Mobile
│
├── ⚙️ QS Admin
│   └── Desktop
│
└── ... (other systems)
```

---

# Part 5: プロンプト構成

## 5.1 Design Phase 用ブートローダー

### 08_design_prep.md（デザイン準備）

```markdown
# DESIGN BOOTLOADER: 準備フェーズ

## 1. 読み込みファイル
- `docs_new/01_phase/04_phase4/00_戦略決定文書/02_PERSONAS.md`
- `docs_new/01_phase/04_phase4/00_戦略決定文書/03_USER_JOURNEYS.md`
- `docs_new/01_phase/04_phase4/01_design/UI_DESIGN_GUIDELINES.md`
- `docs_new/01_phase/04_phase4/01_design/UI_PROGRESS_TRACKER.md`

## 2. タスク
1. 対象システム選定
2. 関連ペルソナ確認
3. 画面リスト抽出
4. デザイン要件整理

## 3. 出力
- 対象画面リスト
- ペルソナ×画面マッピング
- デザイン要件サマリー
```

### 09_design_create.md（デザイン作成）

```markdown
# DESIGN BOOTLOADER: 作成フェーズ

## 1. 読み込みファイル
- `docs_new/01_phase/04_phase4/01_design/UI_DESIGN_GUIDELINES.md`
- 対象システムの画面リスト

## 2. タスク
1. ワイヤーフレーム作成
2. High-Fidelity デザイン作成
3. インタラクティブモック作成

## 3. 出力
- Figmaデザインファイル
- HTML/React モック
```

### 10_design_pir.md（デザインPIR）

```markdown
# DESIGN BOOTLOADER: PIRフェーズ

## 1. 読み込みファイル
- `docs_new/01_phase/04_phase4/01_design/DESIGN_REVIEW_AGENTS.md`
- `docs_new/01_phase/04_phase4/01_design/DESIGN_PIR_PROCESS.md`
- 対象システムのデザインファイル

## 2. タスク
1. CDO レビュー実行
2. Marketing レビュー実行
3. Legal レビュー実行
4. Persona レビュー実行
5. フィードバック統合
6. 判定

## 3. 出力
- PIR_[SYSTEM_NAME].md
- UI_PROGRESS_TRACKER.md 更新
```

---

# Part 6: スケジュール目安

## 6.1 システム別所要時間

| System | Screens | Design | Mock | PIR | Total |
|--------|:-------:|:------:|:----:|:---:|:-----:|
| Consumer App | 25 | 3日 | 2日 | 1日 | 6日 |
| Token Hub | 18 | 2日 | 1日 | 1日 | 4日 |
| Governance | 16 | 2日 | 1日 | 1日 | 4日 |
| Prover Portal | 28 | 3日 | 2日 | 1日 | 6日 |
| Observer | 10 | 1日 | 1日 | 0.5日 | 2.5日 |
| Explorer | 14 | 2日 | 1日 | 0.5日 | 3.5日 |
| Enterprise | 25 | 3日 | 2日 | 1日 | 6日 |
| QS Admin | 40 | 4日 | 3日 | 1日 | 8日 |
| **Total** | **176** | **20日** | **13日** | **7日** | **40日** |

## 6.2 推奨スケジュール

```
Week 1-2:  Consumer App (P0)
Week 3:    Prover Portal (P0) - Part 1
Week 4:    Prover Portal (P0) - Part 2 + QS Admin Start
Week 5:    QS Admin (P0)
Week 6:    Token Hub (P0)
Week 7:    Governance (P1) + Explorer (P1)
Week 8:    Enterprise Admin (P1) + Observer (P2)
```

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-06 | 初版作成 |

---

**END OF DOCUMENT**
