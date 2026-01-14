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
└── docs_new/01_phase/06_phase6/PHASE6_PLANNING_PROPOSAL.md
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

各画面に対して以下の**5ステップを順次実行**。スキップ禁止。

```
┌─────────────────────────────────────────────────────────────────────┐
│  SCREEN PIPELINE (1画面あたり)                                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ STEP 1: UI実装                                               │   │
│  │ ─────────────────────────────────────────────────────────── │   │
│  │ Input:  HTMLモック                                          │   │
│  │ Action: 30_ui_impl.md に従いReact変換                       │   │
│  │ Output: React Component + Storybook Story + i18n (ja/en)    │   │
│  │ Gate:   TypeScript コンパイル成功                           │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              ↓                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ STEP 2: ペルソナレビュー ← 必須！スキップ禁止                 │   │
│  │ ─────────────────────────────────────────────────────────── │   │
│  │ Input:  React Component                                     │   │
│  │ Action: 31_design_pir.md + 下記ペルソナチェックリスト       │   │
│  │ Output: PIRレポート (PASS/CONDITIONAL/FAIL)                 │   │
│  │ Gate:   PASS or CONDITIONAL のみ次へ進める                  │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              ↓                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ STEP 3: A11yチェック                                         │   │
│  │ ─────────────────────────────────────────────────────────── │   │
│  │ Input:  React Component                                     │   │
│  │ Action: 33_a11y_check.md に従い検証                         │   │
│  │ Output: A11y修正済みComponent                               │   │
│  │ Gate:   WCAG 2.1 AA準拠                                     │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              ↓                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ STEP 4: E2Eテスト生成                                        │   │
│  │ ─────────────────────────────────────────────────────────── │   │
│  │ Input:  完成Component                                       │   │
│  │ Action: 37_e2e_test.md に従いPlaywrightテスト作成           │   │
│  │ Output: {screen}.spec.ts                                    │   │
│  │ Gate:   テストファイル存在                                  │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              ↓                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ STEP 5: 完了報告                                             │   │
│  │ ─────────────────────────────────────────────────────────── │   │
│  │ Output: 画面完了レポート（下記テンプレート使用）            │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## PHASE 2: ペルソナレビュー詳細（STEP 2で使用）

### Consumer App ペルソナ: 田中さん

```yaml
名前: 田中 太郎
年齢: 35歳
職業: 会社員（非エンジニア）
技術レベル: 2/5
目的: ETHを安全に保管したい

不安:
  - 秘密鍵を失くしたらどうしよう
  - 量子コンピュータって何？難しそう
  - 操作を間違えたら資産が消える？
```

### 必須チェックリスト（全項目確認必須）

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

### 判定
- PASS: 全項目OK
- CONDITIONAL: 1-2項目の軽微な問題
- FAIL: 3項目以上の問題 → 修正必須
```

---

## PHASE 3: 成果物要件

### 各画面で必須の成果物

| # | 成果物 | パス | 必須 |
|---|--------|------|:----:|
| 1 | React Component | `apps/web/src/app/[locale]/{system}/{screen}/page.tsx` | ✅ |
| 2 | Storybook Story | `apps/web/src/components/{system}/{Screen}.stories.tsx` | ✅ |
| 3 | 日本語翻訳 | `apps/web/locales/ja/{system}.json` | ✅ |
| 4 | 英語翻訳 | `apps/web/locales/en/{system}.json` | ✅ |
| 5 | E2Eテスト | `apps/web/e2e/{system}/{screen}.spec.ts` | ✅ |
| 6 | PIRレポート | (チャット内で報告) | ✅ |

---

## PHASE 4: 完了報告テンプレート

各画面完了時に**必ず以下の形式で報告**：

```markdown
## 画面完了レポート: {screen_name}

### 1. パイプライン実行状況
| Step | Task | Status | 備考 |
|:----:|------|:------:|------|
| 1 | UI実装 | ✅/❌ | |
| 2 | ペルソナレビュー | ✅/❌ | PASS/CONDITIONAL/FAIL |
| 3 | A11yチェック | ✅/❌ | |
| 4 | E2Eテスト | ✅/❌ | |

### 2. ペルソナレビュー詳細
- 判定: {PASS/CONDITIONAL/FAIL}
- チェック項目: {OK数}/{総数}
- 指摘事項: (あれば記載)

### 3. 成果物チェック
- [x] React Component: `{path}`
- [x] Storybook Story: `{path}`
- [x] i18n ja: {key数}キー
- [x] i18n en: {key数}キー
- [x] E2E Test: `{path}`

### 4. 次の画面
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
  ペルソナレビュー(STEP 2)は必須。スキップ時は画面未完了。
</rule>

<rule id="CR-4" level="ABSOLUTE">
  完了報告テンプレートを必ず出力。省略禁止。
</rule>

<rule id="CR-5" level="MUST">
  WCAG 2.1 AA準拠。aria-*, role, tabIndex設定。
</rule>
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
| リサーチ | `docs_new/01_phase/06_phase6/AI_AGENTIC_UIUX_RESEARCH.md` |
| 実装計画 | `docs_new/01_phase/06_phase6/AI_AGENTIC_IMPLEMENTATION_PLAN.md` |
