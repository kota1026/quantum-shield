# Quantum Shield - AI Agentic Development Guide

## MANDATORY: Trigger Command Detection

以下のパターンを検出したら、**このファイルの指示に従って実行**すること：

```
Phase 6 Week {N} 開始
Phase 6 {System名} 開始
Phase 6 Consumer App 開始
Phase 6 Token Hub 開始
Phase 6 Prover Portal 開始
```

---

## STEP 0: 必須ファイル読み込み（スキップ禁止）

トリガーコマンド検出後、**必ず以下のファイルを読み込む**：

```
1. docs_new/02_agents_prompt/02_prompts/38_orchestrator.md  ← Orchestrator
2. docs_new/02_agents_prompt/02_prompts/30_ui_impl.md       ← UI実装ルール
3. docs_new/02_agents_prompt/02_prompts/31_design_pir.md    ← ペルソナレビュー
4. docs_new/01_phase/04_phase4/01_design/DESIGN_REVIEW_AGENTS.md ← ペルソナ定義
5. docs_new/01_phase/06_phase6/PHASE6_PLANNING_PROPOSAL.md  ← 計画書
```

**読み込み確認後に開始すること。**

---

## STEP 1: システム別モック取得

| System | Mocks Path |
|--------|------------|
| Consumer App | `docs_new/01_phase/04_phase4/01_design/system_01_consumer/wip/mocks/*.html` |
| Token Hub | `docs_new/01_phase/04_phase4/01_design/system_02_token_hub/wip/mocks/*.html` |
| Prover Portal | `docs_new/01_phase/04_phase4/01_design/system_04_prover_portal/wip/mocks/*.html` |

---

## STEP 2: 画面ごとの必須パイプライン（省略禁止）

各画面は**必ず以下の順序で処理**すること：

```
┌─────────────────────────────────────────────────────────────────────┐
│  MANDATORY PIPELINE (省略禁止)                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  [1] UI実装 (30_ui_impl.md)                                         │
│      □ HTMLモック読み込み                                           │
│      □ React Component作成                                          │
│      □ i18n対応（全テキストt()経由）                                │
│      □ Storybook Story作成                                          │
│                                                                     │
│  [2] ペルソナレビュー (31_design_pir.md) ← 必須！スキップ禁止        │
│      □ DESIGN_REVIEW_AGENTS.md のペルソナで検証                     │
│      □ 田中さん（End User）視点チェック                             │
│      □ PASS/CONDITIONAL/FAIL 判定                                   │
│                                                                     │
│  [3] A11yチェック (33_a11y_check.md)                                │
│      □ WCAG 2.1 AA準拠確認                                          │
│      □ aria-*, role, tabIndex設定                                   │
│                                                                     │
│  [4] E2Eテスト (37_e2e_test.md)                                     │
│      □ Playwright テスト作成                                        │
│      □ 主要フロー網羅                                               │
│                                                                     │
│  [5] 完了報告                                                       │
│      □ 上記4ステップ全て完了を報告                                  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## STEP 3: ペルソナ定義（必須参照）

### Consumer App ペルソナ: 田中さん

```yaml
名前: 田中 太郎
年齢: 35歳
職業: 会社員（非エンジニア）
技術レベル: 2/5（スマホアプリは使える、暗号資産は初心者）
目的: ETHを安全に保管したい
不安:
  - 秘密鍵を失くしたらどうしよう
  - 量子コンピュータって何？難しそう
  - 操作を間違えたら資産が消える？

チェック項目:
  □ 専門用語にツールチップがあるか
  □ ボタンが大きくタップしやすいか
  □ エラーメッセージがわかりやすいか
  □ 次に何をすべきか明確か
  □ 取り消し・やり直しができるか
```

---

## Critical Rules（絶対遵守）

```xml
<rule id="CR-1" level="ABSOLUTE">
  APIモックデータの返却は禁止。
  データベースがない場合は、まず報告してから対応方法を検討する。
</rule>

<rule id="CR-2" level="ABSOLUTE">
  日英切替漏れは禁止。
  全テキストは t('key') 経由でアクセスすること。
</rule>

<rule id="CR-3" level="ABSOLUTE">
  ペルソナレビュー(31_design_pir.md)は必須。
  スキップした場合、その画面は未完了とみなす。
</rule>

<rule id="CR-4" level="MUST">
  WCAG 2.1 AA準拠。
  全インタラクティブ要素にキーボードアクセシビリティを確保。
</rule>
```

---

## 完了確認テンプレート

各画面完了時、以下の形式で報告：

```markdown
## 画面完了レポート: {screen_name}

### パイプライン実行状況
| Step | Task | Status |
|:----:|------|:------:|
| 1 | UI実装 | ✅/❌ |
| 2 | ペルソナレビュー | ✅/❌ |
| 3 | A11yチェック | ✅/❌ |
| 4 | E2Eテスト | ✅/❌ |

### ペルソナレビュー結果
- 判定: PASS / CONDITIONAL / FAIL
- 指摘事項: (あれば記載)

### 成果物
- [ ] React Component
- [ ] Storybook Story
- [ ] i18n (ja/en)
- [ ] E2E Test
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
