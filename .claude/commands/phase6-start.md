# Phase 6 開始コマンド

Phase 6 $ARGUMENTS 開始

## 必須チェックリスト（全てYesになるまで実装禁止）

以下を順番に実行し、各項目を確認してください：

### 1. PHASE 0 初期化

CLAUDE.md の PHASE 0 セクションを読み、以下を並列で読み込んでください：

**プロンプト:**
- docs_new/02_agents_prompt/02_prompts/38_orchestrator.md
- docs_new/02_agents_prompt/02_prompts/30_ui_impl.md
- docs_new/02_agents_prompt/02_prompts/31_design_pir.md
- docs_new/01_phase/04_phase4/01_design/DESIGN_REVIEW_AGENTS.md
- docs_new/01_phase/06_phase6/PHASE6_PLANNING_PROPOSAL.md

**デザインシステム（必須）:**
- docs_new/01_phase/04_phase4/01_design/assets/design-concept-5-japan-premium.html
- apps/web/tailwind.config.ts
- apps/web/src/styles/globals.css

### 2. インフラ検証

以下のファイルの存在を確認：
```bash
ls apps/web/postcss.config.js
ls apps/web/tailwind.config.ts
ls apps/web/src/styles/globals.css
```

**postcss.config.js が無い場合は作成してください。**

### 3. 対象システムのモック確認

指定されたシステムのモックファイルを一覧取得：
```bash
ls docs_new/01_phase/04_phase4/01_design/system_*$ARGUMENTS*/wip/mocks/*.html
```

### 4. 初期化完了報告

上記全て完了後、「Phase 6 初期化完了」レポートをテンプレートに従って出力してください。

---

## Critical Rules（実装時の絶対遵守事項）

- CR-0: design-concept-5-japan-premium.html を読まずに実装開始禁止
- CR-2: 全テキストは t('key') 経由、ハードコード日本語禁止
- CR-7: ページは必ず [locale] ルート配下に配置
- CR-8: Tailwindカスタムクラスは tailwind.config.ts 定義済みのもののみ使用

---

初期化完了報告を出力後、最初の画面から実装を開始してください。
