# Phase 6 $ARGUMENTS 開始

**今すぐ以下を実行してください（指示ではなく、実際に実行）：**

## STEP 1: 必須ファイルを読み込む

以下のファイルを**今すぐ並列で読み込んで**ください：

1. `docs_new/01_phase/04_phase4/01_design/assets/design-concept-5-japan-premium.html`
2. `apps/web/tailwind.config.ts`
3. `apps/web/src/styles/globals.css`
4. `docs_new/02_agents_prompt/02_prompts/30_ui_impl.md`

## STEP 2: インフラ確認

`apps/web/postcss.config.js` が存在するか確認し、無ければ作成。

## STEP 3: モック一覧取得

`docs_new/01_phase/04_phase4/01_design/system_*$ARGUMENTS*/wip/mocks/` のHTMLファイル一覧を取得。

## STEP 4: 初期化完了報告

以下の形式で報告を出力：

```
## Phase 6 初期化完了

### 読み込んだファイル
- design-concept-5-japan-premium.html: ✅
- tailwind.config.ts: ✅
- globals.css: ✅
- 30_ui_impl.md: ✅

### インフラ検証
- postcss.config.js: ✅ 存在

### 対象システム: $ARGUMENTS
- 画面数: {N}
- 最初の画面: {name}
```

## STEP 5: 最初の画面の実装開始

初期化完了報告を出力後、最初の画面のUI実装を開始してください。

---

**重要**: このコマンドを受けたら、上記を**説明せずに実行**してください。
