# 40_screen_review.md - AI画面レビュープロンプト

> **Version**: 1.0
> **Purpose**: 全175画面のUI/UXを自動レビューするためのプロンプト

---

## 使い方

Claude Codeで以下のコマンドを実行:

```bash
# 全画面スモークテスト
claude "40_screen_review: smoke-all"

# 特定アプリのレビュー
claude "40_screen_review: consumer"
claude "40_screen_review: enterprise"

# 単一画面の詳細レビュー
claude "40_screen_review: http://localhost:3000/ja/consumer/dashboard"

# ペルソナ体験テスト
claude "40_screen_review: persona 田中さん consumer"
```

---

## プロンプト

### smoke-all: 全画面存在確認

```
以下の手順で全175画面の存在確認を行ってください:

1. docs/specs/URL_REFERENCE.md を読み込み
2. 開発サーバーが起動していることを確認 (http://localhost:3000)
3. 各URLにアクセスして以下を確認:
   - ページが存在する（404でない）
   - 致命的なJSエラーがない
   - 何か表示されている

4. 結果を以下の形式で報告:

## Smoke Test Results

### Summary
- Total: 175
- Pass: {n}
- Fail: {n}
- Skip: {n}

### Failed Screens
| # | App | Screen | Path | Error |
|---|-----|--------|------|-------|
| 1 | {app} | {name} | {path} | {error} |

### Passed Screens (per app)
- Consumer App: {n}/19
- Token Hub: {n}/18
- Governance: {n}/11
- QS Hub: {n}/14
- Prover Portal: {n}/9
- Observer: {n}/7
- Explorer: {n}/9
- Enterprise Admin: {n}/18
- QS Admin: {n}/70
```

---

### {app}: アプリ別詳細レビュー

```
{app} の全画面を詳細レビューしてください:

## 手順

1. docs/specs/URL_REFERENCE.md から {app} のURL一覧を取得
2. 各画面について以下を確認:

### 視覚的確認
- [ ] 文字の見切れがない
- [ ] レイアウトが崩れていない
- [ ] モバイル表示で問題ない
- [ ] ボタンのタップ領域が44px以上

### 遷移確認
- [ ] 全ボタン/リンクが機能する
- [ ] 遷移先が正しい（docs/specs/NAVIGATION_FLOW_SPEC.md参照）
- [ ] 戻るボタンが機能する

### アクセシビリティ
- [ ] ARIAラベルがある
- [ ] キーボード操作可能
- [ ] フォーカス表示がある

3. 結果を以下の形式で報告:

## {App} Review Report

### Screen: {screen_name}
- URL: {url}
- Status: PASS / FAIL / CONDITIONAL

#### Issues Found
| # | Severity | Issue | Location | Fix Suggestion |
|---|:--------:|-------|----------|----------------|
| 1 | 🔴/🟡/🟢 | {issue} | {location} | {fix} |

#### Navigation Test
| Element | Expected | Actual | Result |
|---------|----------|--------|:------:|
| {element} | {expected} | {actual} | ✅/❌ |

---
(全画面分を繰り返し)
```

---

### URL単独レビュー

```
{url} を詳細レビューしてください:

## 手順

1. ブラウザで {url} を開く
2. デスクトップ表示を確認してスクリーンショット
3. モバイル表示 (375x667) を確認してスクリーンショット
4. 以下の観点でレビュー:

### チェックリスト

#### 視覚的品質
- [ ] 文字の見切れがない
- [ ] 要素が重なっていない
- [ ] 余白が適切
- [ ] カラーコントラストが十分

#### 機能性
- [ ] 全ボタンがクリック可能
- [ ] 遷移先が正しい
- [ ] フォーム入力が機能する
- [ ] モーダルが正しく開閉する

#### ペルソナ視点（田中さん: 35歳、非エンジニア）
- [ ] 専門用語が説明されている
- [ ] 次に何をすべきか明確
- [ ] エラー時に何が起きたか分かる
- [ ] 安心して操作できる

5. 結果を報告:

## Screen Review: {screen_name}

### Basic Info
- URL: {url}
- Viewport: Desktop / Mobile
- Status: PASS / FAIL / CONDITIONAL

### Screenshots
[Desktop Screenshot]
[Mobile Screenshot]

### Issues
| # | Severity | Issue | Location | Fix |
|---|:--------:|-------|----------|-----|

### Navigation Test
| Element | Expected | Actual | Result |
|---------|----------|--------|:------:|

### Persona Evaluation
- Understandability: {1-5}/5
- Usability: {1-5}/5
- Trust: {1-5}/5
- Overall: {1-5}/5

### Tanaka-san's Comment
> "{ペルソナ視点でのコメント}"
```

---

### persona: ペルソナ体験テスト

```
{persona} として {app} を実際に操作してレビューしてください:

## ペルソナ情報

### 田中さん
- 年齢: 35歳
- 職業: 営業マネージャー
- 技術レベル: 2/5（暗号資産初心者）
- 目的: ETHを安全に保管したい
- デバイス: iPhone 13 (主)、MacBook (副)

### 山田さん
- 年齢: 28歳
- 職業: エンジニア
- 技術レベル: 4/5
- 目的: DeFi資産を量子耐性で保護
- デバイス: Android + Windows PC

## テストシナリオ

### Consumer App (田中さん)
1. Landing → 「今すぐ始める」をクリック
2. Onboarding を完了
3. Dashboard で資産残高を確認
4. 「ロックする」ボタンをクリック
5. 1 ETHをロック
6. 完了画面を確認
7. 履歴で取引を確認

### 各ステップで記録
- スクリーンショット
- 迷った点
- 分かりにくい点
- 嬉しかった点

## 報告形式

## Persona Experience Report: {persona}

### Journey Summary
| Step | Action | Success | Confusion | Comment |
|:----:|--------|:-------:|:---------:|---------|
| 1 | Landing → Click CTA | ✅/❌ | Yes/No | {comment} |
| 2 | Complete onboarding | ✅/❌ | Yes/No | {comment} |
...

### Positive Experiences
- {positive1}
- {positive2}

### Pain Points
| # | Step | Issue | Severity | Suggestion |
|---|:----:|-------|:--------:|------------|

### Persona's Voice
> "{ペルソナの感想を1人称で}"

### Overall Score
- Task Completion: {1-5}/5
- Ease of Use: {1-5}/5
- Confidence: {1-5}/5
- Would Recommend: Yes/No
```

---

## 自動化コマンド

### Playwrightテスト実行

```bash
# 全画面スモークテスト
cd apps/web
npx playwright test e2e/smoke/all-screens.spec.ts

# 特定アプリのみ
npx playwright test e2e/smoke/all-screens.spec.ts --grep "consumer"

# ナビゲーションテスト
npx playwright test e2e/navigation/
```

### レポート生成

```bash
# HTMLレポート
npx playwright test --reporter=html

# JSONレポート
npx playwright test --reporter=json > test-results.json
```

---

## 期待される成果物

1. **スモークテスト結果** - 全175画面の存在確認
2. **詳細レビューレポート** - 各画面のUI/UX問題リスト
3. **ナビゲーションテスト結果** - 全遷移の検証結果
4. **ペルソナ体験レポート** - ユーザー視点での評価
5. **修正タスクリスト** - 発見した問題の修正タスク

---

## 関連ドキュメント

- `docs/specs/URL_REFERENCE.md` - 全URL一覧
- `docs/specs/NAVIGATION_FLOW_SPEC.md` - 遷移仕様
- `docs/specs/AI_SCREEN_REVIEW_WORKFLOW.md` - レビューワークフロー
- `docs/design/DESIGN_REVIEW_AGENTS.md` - ペルソナ定義
