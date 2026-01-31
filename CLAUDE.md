# Quantum Shield - Phase 6 Execution Guide

> **重要**: このファイルはセッション開始時に自動読み込みされます。
> トリガーコマンド検出時は、このファイルの指示を**厳密に実行**してください。

---

## Trigger Commands

```
# ===== Phase 6: 既存アプリ画面実装 =====
Phase 6 Consumer App 開始
Phase 6 Token Hub 開始
Phase 6 Prover Portal 開始
Phase 6 Week {N} 開始
Phase 6 進捗確認        ← 進捗状況を表示

# ===== Phase 8: QS Admin管理画面開発 ===== ★NEW
Phase 8 開始            ← Phase 8-A から順次開始
Phase 8-A 開始          ← 画面実装（38画面）
Phase 8-B 開始          ← 画面検証（Playwright MCP）
Phase 8-C 開始          ← バックエンド実装（次の未実装カテゴリから自動開始）
Phase 8-C {category} 実装 ← 特定カテゴリ実装（auth, dashboard, transactions等）
Phase 8-C 進捗確認      ← バックエンド実装の進捗表示
Phase 8-D 開始          ← L3/L1統合
Phase 8-D L3 開始       ← L3 Dilithium署名統合
Phase 8-D L1 開始       ← L1 Sepolia統合
Phase 8-E 開始          ← 統合テスト
Phase 8-E E2E 開始      ← E2Eテスト作成・実行
Phase 8-E ログ検証 開始  ← バックエンドログ整合性検証
Phase 8 進捗確認        ← Phase 8全体の進捗表示
Phase 8 ゲートチェック   ← 現在Phaseのゲート検証
Phase 8-{X} ゲートチェック ← 特定Phaseのゲート検証

# Phase 8-C カテゴリ一覧 (65 endpoints):
# auth(5), dashboard(3), transactions(8), users(6), prover(6),
# observer(4), treasury(10), governance(5), members(2),
# support(4), announcements(2), analytics(4), system(6)

# ===== 統合画面レビュー（5観点）=====
画面レビュー 開始            ← 進捗トラッカーから自動で続きを開始（★推奨）

# 画面レビュー系コマンド
画面レビュー 全画面          ← 175画面のスモークテスト
画面レビュー {app}          ← 特定アプリの詳細レビュー
画面レビュー {url}          ← 単一画面の詳細レビュー
ペルソナテスト {app}        ← 田中さんとして操作テスト
ナビゲーションテスト {app}  ← 遷移フローの検証

# デザインシステム検証コマンド
デザイン検証 {app}          ← DESIGN_SYSTEM.md準拠チェック
デザイン検証 {url}          ← 単一画面のデザイン検証
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

<rule id="CR-11" level="ABSOLUTE">
  【画面レビュー時の必須ドキュメント読み込み】

  画面レビューを開始する前に、以下のファイルを**必ず読み込む**こと。
  読み込み完了を報告してから作業開始。これをスキップしたレビューは無効。

  **必須読み込みファイル:**
  1. docs/agents/prompts/42_unified_screen_review.md  ← 5観点レビュー手順
  2. docs/agents/prompts/41_design_system_check.md   ← D観点 Playwright検証コード（★必須）
  3. docs/specs/DATA_MODEL.md                        ← M観点チェック用
  4. docs/design/DESIGN_SYSTEM.md                    ← D観点チェック用

  **読み込み確認の出力（必須）:**
  ```
  ## レビュー前チェック完了
  - [x] 42_unified_screen_review.md 読み込み完了
  - [x] 41_design_system_check.md 読み込み完了（検証コード取得）
  - [x] DATA_MODEL.md 読み込み完了
  - [x] DESIGN_SYSTEM.md 読み込み完了
  - [x] 5観点（D, J, N, M, C）の各チェック項目を理解
  → レビュー開始します
  ```

  このテンプレートを出力せずにレビューを開始することは**禁止**。
</rule>

<rule id="CR-12" level="ABSOLUTE">
  【5観点レビューの完全実施】

  各画面レビューは以下の5観点を**すべて**チェックすること。
  1つでも欠落した場合、そのレビューは無効とし、やり直しが必要。

  | 観点 | 必須チェック項目 |
  |:----:|------------------|
  | D | D1-D6（ブランド色、デザインシステム、44pxタップ、コントラスト、階層、状態定義） |
  | J | J1-J5（エントリーポイント、出口、戻るボタン、次アクション、死エンド） |
  | N | N1-N5（全リンク・ボタンのクリック検証、遷移先確認） |
  | M | M1-M4（DATA_MODEL.mdとの整合性、型定義、必須フィールド） |
  | C | C1-C5（必須機能、不要要素、ツールチップ、ペルソナ視点、状態網羅） |

  **D観点でのDESIGN_SYSTEM.md準拠チェック（必須）:**
  - Section 1.2: 44pxタップエリア、12px最小フォント、4.5:1コントラスト
  - Section 2: ブランドカラー（Hinomaru Red, Gold）の適切な使用
  - Section 5: ボタンバリエーション（primary 1画面1つ等）
  - Section 7: カードスタイル
  - Section 10: アクセシビリティ（aria-*, focus states）
  - Section 13: 禁止パターンに該当しないこと
  - **専門用語へのツールチップ**（Section 1.1 Clarity原則）

  **レビュー結果の出力（必須）:**
  ```
  ## {画面名} - 5観点レビュー結果

  | 観点 | 結果 | 詳細 |
  |:----:|:----:|------|
  | D | ✅/⚠️/❌ | {具体的な確認内容} |
  | J | ✅/⚠️/❌ | {具体的な確認内容} |
  | N | ✅/⚠️/❌ | {リンク数、問題数} |
  | M | ✅/-/❌ | {モデル整合性} |
  | C | ✅/⚠️/❌ | {完全性確認} |

  ### 発見した問題
  | # | 問題 | 深刻度 | 対応案 |
  |---|------|:------:|--------|
  ```

  このテンプレート外の形式での報告は無効。
</rule>

<rule id="CR-13" level="ABSOLUTE">
  【Playwright MCP による実検証の必須実行】

  画面レビュー時、以下の検証を**必ず Playwright MCP で実行**すること。
  コード解析や目視のみでの確認は不十分。実行結果をレポートに含めること。

  **D観点: browser_evaluate 必須実行**
  41_design_system_check.md に記載のJavaScriptコードを実行:

  1. タップエリア44px検証（必須）:
     ```javascript
     () => {
       const buttons = document.querySelectorAll('button, a, [role="button"], [tabindex="0"]');
       const issues = [];
       buttons.forEach((btn, i) => {
         const rect = btn.getBoundingClientRect();
         if (rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44)) {
           issues.push({ text: btn.textContent?.substring(0, 30), width: Math.round(rect.width), height: Math.round(rect.height) });
         }
       });
       return { total: buttons.length, issues };
     }
     ```

  2. Primary CTA数検証（必須）:
     ```javascript
     () => {
       const primaryBtns = document.querySelectorAll('button[class*="bg-gradient-hinomaru"], button[class*="bg-hinomaru"]:not([class*="bg-hinomaru/"])');
       return { count: primaryBtns.length, rule: primaryBtns.length <= 1 ? 'PASS' : 'FAIL' };
     }
     ```

  **N観点: browser_click 必須実行**
  - ヘッダーの全ボタン・リンクを実際にクリック
  - メインコンテンツのCTAボタンをクリック
  - モーダル開閉の動作確認
  - 遷移先URLの記録

  **C観点: ツールチップ hover 必須実行**
  - 専門用語（veQS, Dilithium等）にhover
  - ツールチップ表示を確認
  - テキスト見切れがないか確認

  **検証結果の記録形式:**
  ```
  ## Playwright検証結果

  ### D観点: タップエリア
  - 検証ボタン数: {N}
  - 違反数: {N}
  - 違反詳細: [{text, width, height}, ...]

  ### D観点: Primary CTA
  - Primary CTA数: {N}
  - 判定: PASS/FAIL

  ### N観点: クリックテスト
  | 要素 | 期待遷移先 | 実際の遷移先 | 結果 |
  |------|-----------|-------------|:----:|
  | {要素名} | {expected} | {actual} | ✅/❌ |

  ### C観点: ツールチップ
  | 用語 | 表示 | 見切れ | 結果 |
  |------|:----:|:------:|:----:|
  | {term} | ✅/❌ | なし/あり | ✅/❌ |
  ```
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
| **画面レビュー** | `docs/agents/prompts/40_screen_review.md` |
| **統合画面レビュー（5観点）** | `docs/agents/prompts/42_unified_screen_review.md` |
| **デザインシステムチェック** | `docs/agents/prompts/41_design_system_check.md` |

### 画面レビュー・ナビゲーション

| 用途 | パス |
|------|------|
| **Navigation Flow仕様** | `docs/specs/NAVIGATION_FLOW_SPEC.md` |
| **AI画面レビューワークフロー** | `docs/specs/AI_SCREEN_REVIEW_WORKFLOW.md` |
| 全画面スモークテスト | `apps/web/e2e/smoke/all-screens.spec.ts` |
| ナビゲーションテスト | `apps/web/e2e/navigation/` |

### デザインシステム準拠検証（NEW）

| 用途 | パス |
|------|------|
| **検証プロンプト** | `docs/agents/prompts/41_design_system_check.md` |
| **準拠トラッカー** | `docs/phase6/DESIGN_COMPLIANCE_TRACKER.md` |
| デザインシステム仕様 | `docs/design/DESIGN_SYSTEM.md` |

### 進捗・計画

| 用途 | パス |
|------|------|
| Phase 6 進捗管理 | `docs/phase6/PHASE6_PROGRESS.md` |
| **画面レビュー進捗** | `docs/phase6/SCREEN_REVIEW_TRACKER.md` |
| **デザイン準拠進捗** | `docs/phase6/DESIGN_COMPLIANCE_TRACKER.md` |
| ペルソナ定義 | `docs/design/DESIGN_REVIEW_AGENTS.md` |

### Phase 8: QS Admin開発（★NEW）

| 用途 | パス |
|------|------|
| **オーケストレーター** | `docs/agents/prompts/phase8/00_phase8_orchestrator.md` |
| 画面実装 | `docs/agents/prompts/phase8/01_screen_impl.md` |
| 画面検証 | `docs/agents/prompts/phase8/02_screen_verify.md` |
| **バックエンド実装** | `docs/agents/prompts/phase8/03_backend_impl.md` |
| L3統合 | `docs/agents/prompts/phase8/04_l3_integration.md` |
| L1統合 | `docs/agents/prompts/phase8/05_l1_integration.md` |
| E2Eテスト | `docs/agents/prompts/phase8/06_e2e_test.md` |
| **ログ検証** | `docs/agents/prompts/phase8/07_log_verification.md` |
| **ゲートチェック** | `docs/agents/prompts/phase8/08_gate_check.md` |
| **BEルール** | `docs/agents/prompts/rules/BE_RULES.md` |
| テストルール | `docs/agents/prompts/rules/TEST_RULES.md` |
| 設計書 | `docs/specs/QS_ADMIN_DESIGN_PLAN.md` |
| 進捗管理 | `docs/phase8/PHASE8_PROGRESS.md` |

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

## 画面レビューワークフロー

### コマンド一覧

| コマンド | 説明 |
|---------|------|
| **`画面レビュー 開始`** | **進捗トラッカーから自動で続きを開始（★推奨）** |
| `画面レビュー 全画面` | 175画面のスモークテスト実行 |
| `画面レビュー consumer` | Consumer App 19画面の詳細レビュー |
| `画面レビュー {url}` | 単一画面の詳細レビュー |
| `ペルソナテスト {app}` | 田中さんとして操作テスト |
| `ナビゲーションテスト {app}` | 全ボタン/リンクの遷移確認 |

### 「画面レビュー 開始」の実行フロー

```
STEP 0: 必須ドキュメント読み込み（スキップ禁止）
────────────────────────────────────────────
この手順を省略したレビューは無効です。

1. レビュープロンプト読み込み:
   Read: docs/agents/prompts/42_unified_screen_review.md
   → STEP 1-8 のフローを確認

2. データモデル読み込み:
   Read: docs/specs/DATA_MODEL.md
   → M観点チェックで使用するエンティティを確認

3. デザインシステム読み込み:
   Read: docs/design/DESIGN_SYSTEM.md
   → D観点チェックで使用する準拠基準を確認
   → 特に: 44pxタップ、ブランドカラー、専門用語tooltip

4. 読み込み完了報告（必須出力）:
   ```
   ## レビュー前チェック完了
   - [x] 42_unified_screen_review.md 読み込み完了
   - [x] DATA_MODEL.md 読み込み完了
   - [x] DESIGN_SYSTEM.md 読み込み完了
   - [x] 5観点（D, J, N, M, C）の各チェック項目を理解
   → レビュー開始します
   ```

STEP 1-5: レビュー実行
────────────────────────────────────────────
1. SCREEN_REVIEW_TRACKER.md を読み込み
2. Status = "Pending" の最初の画面を特定
3. 42_unified_screen_review.md の手順に従い5観点レビュー:
   - D: デザイン（D1-D6: ブランド、44px、コントラスト等）
   - J: ジャーニー（J1-J5: エントリー、出口、戻る、次、死エンド）
   - N: ナビゲーション（N1-N5: 全リンク・ボタン検証）
   - M: モデル整合性（M1-M4: DATA_MODEL.md準拠）
   - C: 完全性（C1-C5: 必須機能、ペルソナ視点）
4. 5観点レビュー結果をテンプレートで報告
5. SCREEN_REVIEW_TRACKER.md 更新 → 次の画面へ
```

### 実行手順

#### 1. 全画面スモークテスト
```bash
cd apps/web
pnpm dev  # 別ターミナルで
npx playwright test e2e/smoke/all-screens.spec.ts
```

#### 2. ナビゲーションテスト
```bash
npx playwright test e2e/navigation/
```

#### 3. AI画面レビュー（Playwright MCP使用）
```
「http://localhost:3000/ja/consumer/dashboard を開いて
以下を確認してください:
1. 文字の見切れ
2. 全ボタンの遷移先
3. モバイル表示
スクリーンショットを撮って報告」
```

### 関連ファイル

- `docs/agents/prompts/42_unified_screen_review.md` - 統合レビュープロンプト（★推奨）
- `docs/phase6/SCREEN_REVIEW_TRACKER.md` - 画面レビュー進捗トラッカー（★推奨）
- `docs/agents/prompts/40_screen_review.md` - レビュープロンプト（旧）
- `docs/specs/NAVIGATION_FLOW_SPEC.md` - 遷移仕様書
- `docs/specs/AI_SCREEN_REVIEW_WORKFLOW.md` - ワークフロー詳細
- `apps/web/e2e/smoke/all-screens.spec.ts` - 全画面テスト
- `apps/web/e2e/navigation/` - ナビゲーションテスト

---

## Phase 8: QS Admin管理画面開発ワークフロー

### 概要

Phase 8はQS Foundation管理画面の開発フェーズ。5つのサブフェーズで構成され、各フェーズの品質ゲートを通過しないと次に進めない。

```
Phase 8-A（画面実装）→ Gate → Phase 8-B（画面検証）→ Gate →
Phase 8-C（バックエンド）→ Gate → Phase 8-D（L3/L1統合）→ Gate →
Phase 8-E（統合テスト）→ Gate → 完了
```

### トリガーコマンド

| コマンド | 実行内容 |
|---------|---------|
| `Phase 8 開始` | Phase 8-Aから順次開始 |
| `Phase 8-A 開始` | 画面実装（38画面） |
| `Phase 8-B 開始` | Playwright MCP検証 |
| `Phase 8-C 開始` | バックエンドAPI実装（次の未実装カテゴリから自動開始） |
| `Phase 8-C {category} 実装` | 特定カテゴリ実装（auth, dashboard, transactions等） |
| `Phase 8-C 進捗確認` | バックエンド実装の進捗表示 |
| `Phase 8-D 開始` | L3/L1統合 |
| `Phase 8-E 開始` | E2E + ログ検証 |
| `Phase 8 進捗確認` | 進捗状況表示 |
| `Phase 8 ゲートチェック` | ゲート検証実行 |

**Phase 8-C カテゴリ一覧（65 endpoints）:**
auth(5), dashboard(3), transactions(8), users(6), prover(6), observer(4),
treasury(10), governance(5), members(2), support(4), announcements(2),
analytics(4), system(6)

### Phase 8 初期化（トリガー検出時に実行）

```
READ PARALLEL:
├── docs/specs/QS_ADMIN_DESIGN_PLAN.md      ← 設計・画面一覧
├── docs/specs/DATABASE_DESIGN.md           ← DBスキーマ
├── docs/specs/API_SPECIFICATION.yaml       ← APIエンドポイント
├── docs/agents/prompts/rules/BE_RULES.md   ← BEルール（★必須）
└── docs/phase8/PHASE8_PROGRESS.md          ← 進捗管理
```

### Phase別プロンプト

| Phase | プロンプト | 内容 |
|:-----:|-----------|------|
| 8-A | `01_screen_impl.md` | React Component + i18n + Storybook |
| 8-B | `02_screen_verify.md` | 5観点レビュー（Playwright MCP） |
| 8-C | `03_backend_impl_v2.md` ★ | Rust API + sqlx + BE-001〜003ルール（自動化対応） |
| 8-D | `04_l3_integration.md`, `05_l1_integration.md` | Dilithium署名 + L1実行 |
| 8-E | `06_e2e_test.md`, `07_log_verification.md` | E2E + ログ整合性検証 |

### Phase 8-C 自動化ツール

```bash
# 実装後スタブ検出（BE-001準拠確認）
cd services/api
./scripts/detect-stubs.sh src/routes/admin.rs

# 進捗更新（エンドポイント番号指定）
./scripts/update-backend-progress.sh 06 done
```

### バックエンドルール（BE-001〜003）

Phase 8-C以降で**絶対遵守**:

```xml
<rule id="BE-001">スタブレスポンス禁止（常にOKを返す実装禁止）</rule>
<rule id="BE-002">テスト用コード修正禁止</rule>
<rule id="BE-003">ログ出力必須（リクエスト、DB操作、レスポンス）</rule>
```

### ゲートチェック

各Phase完了時に実行:

```bash
./scripts/gate-check.sh 8-{X}
```

| Phase | 主要チェック項目 |
|:-----:|-----------------|
| 8-A | TypeScript/ESLint/i18n/Storybook |
| 8-B | 5観点レビュー全画面PASS |
| 8-C | テスト通過/スタブ検出0/ログ出力確認 |
| 8-D | L3ヘルス/署名検証/L1接続 |
| 8-E | E2E全通過/ログ整合性検証PASS |

### ログ整合性検証

E2Eテストの期待値とバックエンドログを照合し、「テスト成功だが実処理なし」を検出:

```bash
./scripts/verify-test-logs.sh
```

不整合があればFAIL → 修正必須

---

## ドキュメント更新履歴

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-XX | 初版作成 |
| 1.1 | 2026-01-22 | docs/フォルダ構造整理、IMPLEMENTATION_GUIDE.md統合 |
| 1.2 | 2026-01-22 | IMPLEMENTATION_GUIDE.md v1.3対応（全8アプリ詳細仕様、テンプレート追加） |
| 1.3 | 2026-01-25 | 画面レビューワークフロー追加（Navigation Flow, AI Screen Review, Playwright MCP） |
| 1.4 | 2026-01-26 | CR-11/CR-12追加: 画面レビュー時の必須ドキュメント読み込みと5観点完全実施ルール |
| 1.5 | 2026-01-26 | CR-11にDESIGN_SYSTEM.md追加、CR-12にデザイン準拠チェック項目追加 |
| 1.6 | 2026-01-26 | CR-11に41_design_system_check.md追加、CR-13追加（Playwright MCP実検証必須化） |
| 1.7 | 2026-01-27 | Phase 8 QS Admin開発ワークフロー追加（8プロンプト、BEルール、ログ検証） |
| 1.8 | 2026-01-31 | Phase 8-C自動化対応（03_backend_impl_v2.md、進捗更新スクリプト追加） |
