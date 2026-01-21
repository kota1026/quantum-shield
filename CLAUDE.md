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
READ PARALLEL（実装ガイド）:  ★ 最重要
├── docs/specs/IMPLEMENTATION_GUIDE.md    ← これ1つで実装できる！
├── docs/design/DESIGN_SYSTEM.md          ← デザイン標準
└── docs/specs/DATA_MODEL.md              ← API型・エンティティ

READ PARALLEL（プロンプト）:
├── docs/agents/prompts/38_orchestrator.md
├── docs/agents/prompts/30_ui_impl.md
├── docs/agents/prompts/31_design_pir.md
├── docs/design/DESIGN_REVIEW_AGENTS.md
└── docs/phase6/PHASE6_PROGRESS.md  ← 進捗管理

READ PARALLEL（デザインアセット）:
├── docs/design/assets/design-concept-5-japan-premium.html  ← 必須！
├── apps/web/tailwind.config.ts
└── apps/web/src/styles/globals.css
```

### 0.2 インフラ検証（実装開始前に必ず確認）

以下のファイルが存在することを確認。無ければ作成：

```bash
# 必須ファイルの存在確認
ls apps/web/postcss.config.js      # ⚠️ 無いとTailwind動作しない
ls apps/web/tailwind.config.ts     # カスタムカラー定義
ls apps/web/src/styles/globals.css # CSS Variables定義
```

**postcss.config.js が無い場合は以下を作成：**
```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

### 0.3 対象システムのモック一覧取得

```bash
ls docs/design/mocks/{app}/*.html
```

| System | ID | Path | 画面数 |
|--------|:--:|------|:------:|
| Consumer App | 01 | `docs/design/mocks/consumer/` | 19 |
| Token Hub | 02 | `docs/design/mocks/token-hub/` | 10 |
| Governance | 03 | `docs/design/mocks/governance/` | 6 |
| Prover Portal | 04 | `docs/design/mocks/prover/` | 11 |
| Observer | 05 | `docs/design/mocks/observer/` | 7 |
| Explorer | 06 | `docs/design/mocks/explorer/` | 8 |
| Enterprise Admin | 07 | `docs/design/mocks/enterprise/` | 25 |
| QS Admin | 08 | `docs/design/mocks/admin/` | 12 |

### 0.4 初期化完了報告

```markdown
## Phase 6 初期化完了

### 読み込んだファイル
- プロンプト: 38, 30, 31 + DESIGN_REVIEW_AGENTS + PHASE6_PLANNING
- デザイン: design-concept-5-japan-premium.html ✅
- 設定: tailwind.config.ts, globals.css ✅

### インフラ検証
- postcss.config.js: ✅ 存在 / ❌ 作成済み
- tailwind.config.ts: ✅ 存在
- globals.css: ✅ 存在

### 対象システム
- システム: {system_name}
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

画面完了後、`docs/phase6/PHASE6_PROGRESS.md` を更新：

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
<rule id="CR-0" level="ABSOLUTE">
  PHASE 0 初期化は必須。design-concept-5-japan-premium.html を読まずに実装開始禁止。
  postcss.config.js の存在確認も必須。
</rule>

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

  更新必須項目:
  1. 該当画面のステータスを ⬜ → ✅ に変更
  2. Status列を "Done" に変更
  3. Progress行の分数を更新 (例: 1/19 → 2/19)
  4. Overview Dashboardのプログレスバーを更新
  5. Change Logに更新日時と内容を追記

  コミット時に進捗更新も含めること。
</rule>

<rule id="CR-10" level="MUST">
  ウォレット接続Provider（WagmiProvider, RainbowKitProvider）はWS-1で設定。
  実際のトランザクション署名・ブロックチェーン連携はWS-2で実装。
  Mock APIを使用してUI動作確認を優先する。
</rule>

<rule id="CR-8" level="ABSOLUTE">
  ページは必ず [locale] ルート配下に配置。
  ✅ apps/web/src/app/[locale]/consumer/dashboard/page.tsx
  ❌ apps/web/src/app/consumer/dashboard/page.tsx
</rule>

<rule id="CR-9" level="ABSOLUTE">
  Tailwindカスタムクラスは tailwind.config.ts で定義済みのもののみ使用。
  存在しないクラス（border-border, duration-250等）は使用禁止。
  globals.css のCSS Variables を直接参照する場合は Tailwind変換表を確認。
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

1. `docs/phase6/PHASE6_PROGRESS.md` を読み込み
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

### 実装ドキュメント（★最重要）

| 用途 | パス | 重要度 |
|------|------|:------:|
| **実装ガイド** | `docs/specs/IMPLEMENTATION_GUIDE.md` | ⚠️ 最重要 |
| **デザインシステム** | `docs/design/DESIGN_SYSTEM.md` | ⚠️ 必須 |
| **データモデル** | `docs/specs/DATA_MODEL.md` | ⚠️ 必須 |
| コードベース地図 | `docs/specs/CODEBASE_MAP.md` | 参照 |
| URL一覧 | `docs/specs/URL_REFERENCE.md` | 参照 |

### デザインアセット

| 用途 | パス | 重要度 |
|------|------|:------:|
| **デザインコンセプト** | `docs/design/assets/design-concept-5-japan-premium.html` | ⚠️ 必須 |
| HTMLモック | `docs/design/mocks/{app}/` | 参照 |
| Tailwind設定 | `apps/web/tailwind.config.ts` | ⚠️ 必須 |
| CSS Variables | `apps/web/src/styles/globals.css` | ⚠️ 必須 |

### プロンプト

| 用途 | パス |
|------|------|
| Orchestrator | `docs/agents/prompts/38_orchestrator.md` |
| UI実装 | `docs/agents/prompts/30_ui_impl.md` |
| ペルソナレビュー | `docs/agents/prompts/31_design_pir.md` |
| i18n監査 | `docs/agents/prompts/32_i18n_audit.md` |
| A11yチェック | `docs/agents/prompts/33_a11y_check.md` |
| API実装 | `docs/agents/prompts/34_api_impl.md` |
| E2Eテスト | `docs/agents/prompts/37_e2e_test.md` |

### 進捗・計画

| 用途 | パス |
|------|------|
| 進捗管理 | `docs/phase6/PHASE6_PROGRESS.md` |
| ペルソナ定義 | `docs/design/DESIGN_REVIEW_AGENTS.md` |

### 経緯・履歴（参照用）

| 用途 | パス |
|------|------|
| 経緯サマリー | `docs/process-history/README.md` |
| Phase 1 | `docs/process-history/phase1/` |
| Phase 2 | `docs/process-history/phase2/` |
| Phase 3 | `docs/process-history/phase3/` |

---

## セッション終了時の手順

画面実装が完了したら、または作業を中断する場合、**必ず以下を実行**：

### 1. コミット＆プッシュ

```bash
git add -A
git commit -m "feat: {作業内容の要約}"
git push -u origin {current-branch}
```

### 2. PR作成案内（ベースブランチ: main）

作業完了後、**必ず main ブランチに対して PR を作成**する。
以下のメッセージをユーザーに表示：

```
## 作業完了

### PR作成（→ main）
https://github.com/kota1026/quantum-shield/compare/main...{branch-name}

### Codespaces確認手順
1. Codespaces を開く
2. ターミナルで実行:
   git pull origin main
   cd apps/web && pnpm install && pnpm dev
3. ポート3000を公開してブラウザで確認:
   https://{codespace}-3000.app.github.dev/ja/consumer/landing

### 次回の再開
新しいチャットで: /phase6-start consumer
```

### 3. 進捗更新

`PHASE6_PROGRESS.md` を更新済みか確認。未更新なら更新する。

---

## ドキュメント更新履歴

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-XX | 初版作成 |
| 1.1 | 2026-01-22 | docs/フォルダ構造整理、IMPLEMENTATION_GUIDE.md統合 |
| 1.2 | 2026-01-22 | IMPLEMENTATION_GUIDE.md v1.3対応（全8アプリ詳細仕様、テンプレート追加） |
