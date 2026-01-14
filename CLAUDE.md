# Quantum Shield - Phase 6 Execution Guide

> **重要**: このファイルはセッション開始時に自動読み込みされます。
> トリガーコマンド検出時は、このファイルの指示を**厳密に実行**してください。

---

## Trigger Commands

```
Phase 6 Consumer App 開始
Phase 6 Token Hub 開始
Phase 6 Prover Portal 開始
Phase 6 Week {N} 開始
Phase 6 進捗確認        ← 進捗状況を表示
```

---

## PHASE 0: 初期化（トリガー検出時に必ず実行）

### 0.1 必須ファイル読み込み

以下のファイルを**並列で読み込み**、内容を理解してから作業開始：

```
READ PARALLEL:
├── docs_new/02_agents_prompt/02_prompts/38_orchestrator.md
├── docs_new/02_agents_prompt/02_prompts/30_ui_impl.md
├── docs_new/02_agents_prompt/02_prompts/31_design_pir.md
├── docs_new/01_phase/04_phase4/01_design/DESIGN_REVIEW_AGENTS.md
├── docs_new/01_phase/06_phase6/PHASE6_PLANNING_PROPOSAL.md
└── docs_new/01_phase/06_phase6/PHASE6_PROGRESS.md  ← 進捗管理ファイル
```

### 0.2 対象システムのモック一覧取得

```bash
ls docs_new/01_phase/04_phase4/01_design/system_{ID}_{NAME}/wip/mocks/*.html
```

| System | ID | Path |
|--------|:--:|------|
| Consumer App | 01 | `system_01_consumer/wip/mocks/` |
| Token Hub | 02 | `system_02_token_hub/wip/mocks/` |
| Prover Portal | 04 | `system_04_prover_portal/wip/mocks/` |

### 0.3 初期化完了報告

```markdown
## Phase 6 初期化完了

- 読み込んだプロンプト: [リスト]
- 対象システム: {system_name}
- 検出した画面数: {count}
- 開始画面: {first_screen}
```

---

## PHASE 1: 画面実装パイプライン

各画面に対して以下の**6ステップを順次実行**。スキップ禁止。

```
┌─────────────────────────────────────────────────────────────────────┐
│  SCREEN PIPELINE (1画面あたり) - 6 STEPS                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ STEP 1: UI実装                                               │   │
│  │ Input:  HTMLモック                                          │   │
│  │ Action: 30_ui_impl.md に従いReact変換                       │   │
│  │ Output: React Component + Storybook Story + i18n (ja/en)    │   │
│  │ Gate:   TypeScript コンパイル成功                           │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              ↓                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ STEP 2: A11yチェック                                         │   │
│  │ Input:  React Component                                     │   │
│  │ Action: 33_a11y_check.md に従い検証                         │   │
│  │ Output: A11y修正済みComponent                               │   │
│  │ Gate:   WCAG 2.1 AA準拠                                     │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              ↓                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ STEP 3: E2Eテスト生成（Playwright）                          │   │
│  │ Input:  完成Component                                       │   │
│  │ Action: 37_e2e_test.md に従いテスト作成                     │   │
│  │ Output: {screen}.spec.ts                                    │   │
│  │ Gate:   テストファイル存在                                  │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              ↓                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ STEP 4: ペルソナ体験テスト ← NEW! AI実操作                   │   │
│  │ ─────────────────────────────────────────────────────────── │   │
│  │ 【Claude Computer Use方式】                                 │   │
│  │                                                             │   │
│  │ AIが田中さん（ペルソナ）として実際に画面を操作し、           │   │
│  │ 体験をレビューする。                                        │   │
│  │                                                             │   │
│  │ 操作シナリオ例（Consumer App Dashboard）:                   │   │
│  │ 1. 画面を開く                                               │   │
│  │ 2. 資産残高を確認する                                       │   │
│  │ 3. 「ロックする」ボタンをタップする                         │   │
│  │ 4. ロック画面に遷移できるか確認                             │   │
│  │ 5. 戻るボタンで戻れるか確認                                 │   │
│  │                                                             │   │
│  │ Output: ペルソナ体験レポート（下記テンプレート）            │   │
│  │ Gate:   重大な問題なし                                      │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              ↓                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ STEP 5: ペルソナレビュー + 改善                              │   │
│  │ ─────────────────────────────────────────────────────────── │   │
│  │ Input:  STEP 4のペルソナ体験レポート                        │   │
│  │ Action: 問題点を修正、改善を実装                            │   │
│  │ Output: 改善済みComponent + 改善内容リスト                  │   │
│  │ Gate:   PASS/CONDITIONAL判定                                │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              ↓                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ STEP 6: 完了報告 + 進捗更新                                  │   │
│  │ Action: 画面完了レポート出力                                │   │
│  │ Action: PHASE6_PROGRESS.md の該当行を更新                   │   │
│  │ Gate:   進捗ファイル更新完了                                │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## PHASE 2: ペルソナ体験テスト詳細（STEP 4）

### 田中さんとしてAIが操作

```yaml
ペルソナ: 田中 太郎
年齢: 35歳
技術レベル: 2/5（暗号資産初心者）
目的: ETHを安全に保管したい
デバイス: スマートフォン（主）、PC（副）
```

### 操作シナリオテンプレート

各画面に対して、AIが田中さんとして以下を実行：

```markdown
## ペルソナ操作シナリオ: {screen_name}

### 基本情報
- ペルソナ: 田中さん（35歳、非エンジニア）
- 目的: {この画面で達成したいこと}
- 前提: {この画面に来るまでの経緯}

### 操作ステップ
1. 【視覚確認】画面を見て最初に目に入るものは？
2. 【理解確認】この画面で何ができるか理解できる？
3. 【操作1】{主要アクション}を実行
4. 【操作2】{サブアクション}を実行
5. 【戻る】前の画面に戻れる？

### 各ステップの評価
| Step | 操作 | 成功? | 迷った? | 理由 |
|:----:|------|:-----:|:-------:|------|
| 1 | 視覚確認 | ✅/❌ | はい/いいえ | |
| 2 | 理解確認 | ✅/❌ | はい/いいえ | |
| 3 | {操作1} | ✅/❌ | はい/いいえ | |
| 4 | {操作2} | ✅/❌ | はい/いいえ | |
| 5 | 戻る | ✅/❌ | はい/いいえ | |
```

### ペルソナ体験レポートテンプレート

```markdown
## ペルソナ体験レポート: {screen_name}

### 総合評価
- 体験スコア: {1-5}/5
- 主要な問題: {あり/なし}
- 改善必要度: {高/中/低/なし}

### 良かった点
- {ポジティブな体験1}
- {ポジティブな体験2}

### 問題点・改善提案
| # | 問題 | 深刻度 | 改善案 |
|---|------|:------:|--------|
| 1 | {問題1} | 高/中/低 | {改善案1} |
| 2 | {問題2} | 高/中/低 | {改善案2} |

### 田中さんの声（ペルソナ視点のコメント）
> 「{田中さんが感じたことを1人称で記述}」

### 判定
- PASS: 問題なし、または軽微な問題のみ
- CONDITIONAL: 中程度の問題あり、改善推奨
- FAIL: 重大な問題あり、改善必須
```

---

## PHASE 3: ペルソナチェックリスト（STEP 5で使用）

### 必須チェック項目

```markdown
## ペルソナレビューチェックリスト: 田中さん

### 理解しやすさ
- [ ] 専門用語（Dilithium, STARK, Lock等）にツールチップがある
- [ ] 「量子耐性」の意味が説明されている
- [ ] エラーメッセージが平易な日本語

### 操作性
- [ ] ボタンが44px以上でタップしやすい
- [ ] 次のアクションが明確（CTA目立つ）
- [ ] 取り消し・やり直しが可能
- [ ] ローディング状態が表示される

### 安心感
- [ ] 資産額が見やすい位置に表示
- [ ] 操作の確認画面がある
- [ ] 24時間待機の理由が説明されている

### 判定基準
- PASS: 全項目OK + 体験テストで問題なし
- CONDITIONAL: 1-2項目の軽微な問題
- FAIL: 3項目以上の問題、または体験テストで重大問題
```

---

## PHASE 4: 成果物要件

### 各画面で必須の成果物

| # | 成果物 | パス | 必須 |
|---|--------|------|:----:|
| 1 | React Component | `apps/web/src/app/[locale]/{system}/{screen}/page.tsx` | ✅ |
| 2 | Storybook Story | `apps/web/src/components/{system}/{Screen}.stories.tsx` | ✅ |
| 3 | 日本語翻訳 | `apps/web/locales/ja/{system}.json` | ✅ |
| 4 | 英語翻訳 | `apps/web/locales/en/{system}.json` | ✅ |
| 5 | E2Eテスト | `apps/web/e2e/{system}/{screen}.spec.ts` | ✅ |
| 6 | ペルソナ体験レポート | (チャット内で報告) | ✅ |
| 7 | 改善実施レポート | (チャット内で報告) | ✅ |

---

## PHASE 5: 完了報告 + 進捗更新

各画面完了時に**必ず以下の形式で報告**し、**進捗ファイルを更新**する：

### 5.1 進捗ファイル更新（必須）

画面完了後、`docs_new/01_phase/06_phase6/PHASE6_PROGRESS.md` を更新：

```markdown
## 更新手順

1. 該当システムのテーブルで該当画面の行を見つける
2. 各ステップの状態を更新:
   - ⬜ → ✅ (完了)
   - ⬜ → ❌ (失敗・要修正)
3. Status列を "Done" に変更
4. Progress行の分数を更新 (例: 0/19 → 1/19)
5. Change Logに更新を追記

## 更新例

更新前:
| 01 | landing | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | Pending |

更新後:
| 01 | landing | ✅ | ✅ | ✅ | ✅ | ✅ | Done |
```

### 5.2 完了報告テンプレート

```markdown
## 画面完了レポート: {screen_name}

### 1. パイプライン実行状況
| Step | Task | Status | 備考 |
|:----:|------|:------:|------|
| 1 | UI実装 | ✅/❌ | |
| 2 | A11yチェック | ✅/❌ | |
| 3 | E2Eテスト | ✅/❌ | |
| 4 | ペルソナ体験テスト | ✅/❌ | スコア: {X}/5 |
| 5 | ペルソナレビュー+改善 | ✅/❌ | PASS/CONDITIONAL/FAIL |

### 2. ペルソナ体験サマリー
- 体験スコア: {X}/5
- 発見した問題数: {N}件
- 改善した問題数: {N}件
- 田中さんの一言: 「{コメント}」

### 3. 改善内容
| # | 問題 | 改善内容 | 対応ファイル |
|---|------|----------|-------------|
| 1 | {問題1} | {改善1} | {ファイル1} |
| 2 | {問題2} | {改善2} | {ファイル2} |

### 4. 成果物チェック
- [x] React Component: `{path}`
- [x] Storybook Story: `{path}`
- [x] i18n ja: {key数}キー
- [x] i18n en: {key数}キー
- [x] E2E Test: `{path}`

### 5. 次の画面
→ {next_screen_name}
```

---

## Critical Rules（絶対遵守）

```xml
<rule id="CR-1" level="ABSOLUTE">
  APIモックデータの返却は禁止。
  データベースがない場合は、まず報告してから対応方法を検討する。
</rule>

<rule id="CR-2" level="ABSOLUTE">
  全テキストは t('key') 経由。ハードコード日本語禁止。
</rule>

<rule id="CR-3" level="ABSOLUTE">
  ペルソナ体験テスト(STEP 4)は必須。スキップ時は画面未完了。
</rule>

<rule id="CR-4" level="ABSOLUTE">
  ペルソナレビュー+改善(STEP 5)は必須。問題を発見したら必ず改善。
</rule>

<rule id="CR-5" level="ABSOLUTE">
  完了報告テンプレートを必ず出力。省略禁止。
</rule>

<rule id="CR-6" level="MUST">
  WCAG 2.1 AA準拠。aria-*, role, tabIndex設定。
</rule>

<rule id="CR-7" level="ABSOLUTE">
  画面完了時は必ずPHASE6_PROGRESS.mdを更新。
  進捗ファイル未更新のまま次の画面に進むことは禁止。
</rule>
```

---

## AI Testing手法（リサーチベース）

### Playwright Healer Agent
テスト失敗時の自己修復フロー:
1. テスト失敗検出
2. Healer Agentが失敗ステップを再生
3. 現在UIを検査して同等要素を特定
4. ロケーター更新パッチを提案
5. テスト再実行

### Claude Computer Use（ペルソナ体験テスト）
- 自然言語でテストケース記述
- スクリーンショット認識でUI要素を特定
- マウス・キーボード操作の自動実行
- ペルソナ視点でのUX評価

### Chromatic Visual Regression
- 全UIステート、テーマ、ビューポートでスナップショット
- 意味的変化を検出（ピクセル比較ではない）
- アクセシビリティチェック自動実行

---

## 進捗確認コマンド（Phase 6 進捗確認）

「Phase 6 進捗確認」を受けたら以下を実行：

1. `docs_new/01_phase/06_phase6/PHASE6_PROGRESS.md` を読み込み
2. Overview Dashboardセクションを表示
3. 各システムの進捗サマリーを計算して報告

```markdown
## Phase 6 進捗レポート

### Overview
| WS | Category | Complete | Total | Progress |
|:--:|----------|:--------:|:-----:|:--------:|
| 1 | UI/UX | {n} | 144 | {%} |
| 2 | Backend | {n} | 30 | {%} |
| 3 | Docs | {n} | 24 | {%} |
| 4 | QA | {n} | 20 | {%} |
| **Total** | | **{n}** | **218** | **{%}** |

### By System
| System | Screens | Done | Progress |
|--------|:-------:|:----:|:--------:|
| Consumer App | 19 | {n} | {%} |
| Token Hub | 10 | {n} | {%} |
| ... | ... | ... | ... |
```

---

## ファイル参照一覧

| 用途 | パス |
|------|------|
| Orchestrator | `docs_new/02_agents_prompt/02_prompts/38_orchestrator.md` |
| UI実装 | `docs_new/02_agents_prompt/02_prompts/30_ui_impl.md` |
| ペルソナレビュー | `docs_new/02_agents_prompt/02_prompts/31_design_pir.md` |
| i18n監査 | `docs_new/02_agents_prompt/02_prompts/32_i18n_audit.md` |
| A11yチェック | `docs_new/02_agents_prompt/02_prompts/33_a11y_check.md` |
| API実装 | `docs_new/02_agents_prompt/02_prompts/34_api_impl.md` |
| E2Eテスト | `docs_new/02_agents_prompt/02_prompts/37_e2e_test.md` |
| ペルソナ定義 | `docs_new/01_phase/04_phase4/01_design/DESIGN_REVIEW_AGENTS.md` |
| 計画書 | `docs_new/01_phase/06_phase6/PHASE6_PLANNING_PROPOSAL.md` |
| 進捗管理 | `docs_new/01_phase/06_phase6/PHASE6_PROGRESS.md` |
| リサーチ | `docs_new/01_phase/06_phase6/AI_AGENTIC_UIUX_RESEARCH.md` |
| 実装計画 | `docs_new/01_phase/06_phase6/AI_AGENTIC_IMPLEMENTATION_PLAN.md` |
