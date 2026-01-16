# Phase 6 $ARGUMENTS 開始

**今すぐ以下を実行してください（指示ではなく、実際に実行）：**

## STEP 1: 進捗状況を確認

`docs_new/01_phase/06_phase6/PHASE6_PROGRESS.md` を読み込み、$ARGUMENTS システムの進捗状況を確認してください。

## STEP 2: 未完了画面を特定

PHASE6_PROGRESS.md から以下を分析：
- **Status が「Pending」または「In Progress」の画面**を特定
- 未完了画面の中で**最初の画面番号**を確認
- その画面名と必要な実装項目（UI, A11y, E2E, Persona Test, PIR）を把握

## STEP 3: 必須ファイルを読み込む

以下のファイルを**今すぐ並列で読み込んで**ください：

1. `docs_new/01_phase/04_phase4/01_design/assets/design-concept-5-japan-premium.html`
2. `apps/web/tailwind.config.ts`
3. `apps/web/src/styles/globals.css`
4. `docs_new/02_agents_prompt/02_prompts/30_ui_impl.md`

## STEP 4: インフラ確認

`apps/web/postcss.config.js` が存在するか確認し、無ければ作成。

## STEP 5: 対象モック確認

`docs_new/01_phase/04_phase4/01_design/system_*$ARGUMENTS*/wip/mocks/` から、STEP 2 で特定した未完了画面に対応するHTMLファイルを確認。

## STEP 6: 初期化完了報告

以下の形式で報告を出力：

```
## Phase 6 初期化完了

### 進捗確認結果
- PHASE6_PROGRESS.md: ✅ 読み込み完了
- 対象システム: $ARGUMENTS
- 完了済み画面数: {completed}
- 未完了画面数: {pending}

### 次に実装する画面
- 画面番号: {screen_number}
- 画面名: {screen_name}
- 未完了項目: {UI/A11y/E2E/Persona Test/PIR}

### 読み込んだファイル
- design-concept-5-japan-premium.html: ✅
- tailwind.config.ts: ✅
- globals.css: ✅
- 30_ui_impl.md: ✅

### インフラ検証
- postcss.config.js: ✅ 存在
```

## STEP 7: 未完了画面の実装開始

初期化完了報告を出力後、**STEP 2 で特定した未完了画面**のUI実装を開始してください。

---

**重要**:
- このコマンドを受けたら、上記を**説明せずに実行**してください。
- 必ず PHASE6_PROGRESS.md を確認し、**未完了の画面から順番に**実装を進めてください。
- 既に完了している画面は飛ばし、効率的に進めてください。
