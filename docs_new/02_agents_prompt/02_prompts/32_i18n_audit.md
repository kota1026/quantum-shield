# 32_i18n_audit.md - Internationalization Audit Prompt
## Phase 6: 国際化（i18n）完全性監査

> **Version**: 1.0
> **Date**: 2026-01-13
> **Purpose**: 日英切替の完全性保証

---

## 1. Overview

このプロンプトは、UIコンポーネントおよびページにおける国際化対応の完全性を監査します。

> ⚠️ **重要**: 日英切替漏れは**絶対禁止**です。このプロンプトは全UI実装後に必ず実行してください。

---

## 2. 入力要件

```yaml
input:
  required:
    - target_path: "監査対象ディレクトリ（例: apps/web/src）"
    - locale_files:
      - ja: "翻訳ファイル（日本語）"
      - en: "翻訳ファイル（英語）"

  optional:
    - ignore_patterns: "除外パターン（例: *.test.tsx）"
```

---

## 3. 監査チェックリスト

### 3.1 コード監査

```markdown
## Phase 1: ハードコード文字列検出

### 検索パターン
以下のパターンでハードコード文字列を検出：

# JSX内の日本語テキスト
grep -r "[ぁ-んァ-ン一-龯]" --include="*.tsx" --include="*.jsx"

# 疑わしい英語テキスト（翻訳キー以外）
grep -rE ">[A-Z][a-z]+ [A-Z]?[a-z]+" --include="*.tsx" --include="*.jsx"

# プレースホルダー（直接記述）
grep -r "placeholder=\"[^{]" --include="*.tsx"

# aria-label（直接記述）
grep -r "aria-label=\"[^{]" --include="*.tsx"

### チェック結果
| # | ファイル | 行 | 問題 | 修正方法 |
|---|----------|-----|------|---------|
| 1 | | | | t('key') に置換 |
```

### 3.2 翻訳キー完全性

```markdown
## Phase 2: 翻訳キー監査

### 日本語翻訳ファイル確認
- ファイル: locales/ja/*.json
- キー総数: [X]個

### 英語翻訳ファイル確認
- ファイル: locales/en/*.json
- キー総数: [Y]個

### 差分検出
| 言語 | 欠落キー | 対応 |
|------|---------|------|
| 日本語 | [key1, key2, ...] | 追加必須 |
| 英語 | [key3, key4, ...] | 追加必須 |

### キー命名規則確認
| ルール | 準拠 | 例 |
|--------|:----:|-----|
| namespace.component.element | ✅/❌ | common.button.submit |
| camelCase | ✅/❌ | dashboard.totalValue |
| 階層3レベル以内 | ✅/❌ | |
```

### 3.3 動的コンテンツ

```markdown
## Phase 3: 動的コンテンツ監査

### 数値フォーマット
| 項目 | 日本語 | 英語 | 確認 |
|------|--------|------|:----:|
| 金額 | ¥1,234 | $1,234 | ✅/❌ |
| 大きな数値 | 1,234,567 | 1,234,567 | ✅/❌ |
| 小数点 | 0.123 | 0.123 | ✅/❌ |
| パーセント | 12.3% | 12.3% | ✅/❌ |

### 日付フォーマット
| 項目 | 日本語 | 英語 | 確認 |
|------|--------|------|:----:|
| 日付（短） | 2026/01/13 | Jan 13, 2026 | ✅/❌ |
| 日付（長） | 2026年1月13日 | January 13, 2026 | ✅/❌ |
| 時間 | 14:30 | 2:30 PM | ✅/❌ |
| 相対時間 | 3時間前 | 3 hours ago | ✅/❌ |

### 複数形
| キー | 日本語（単数/複数同じ） | 英語（単数/複数） | 確認 |
|------|----------------------|------------------|:----:|
| transaction | 1 トランザクション | 1 transaction / 2 transactions | ✅/❌ |
| day | 1 日 | 1 day / 2 days | ✅/❌ |
```

### 3.4 UI要素

```markdown
## Phase 4: UI要素監査

### ボタン・リンク
| 画面 | 要素 | 日本語 | 英語 | 確認 |
|------|------|--------|------|:----:|
| | | | | ✅/❌ |

### エラーメッセージ
| コード | 日本語 | 英語 | 確認 |
|--------|--------|------|:----:|
| ERR_001 | | | ✅/❌ |

### ツールチップ・ヘルプテキスト
| 画面 | 要素 | 日本語 | 英語 | 確認 |
|------|------|--------|------|:----:|
| | | | | ✅/❌ |

### フォームラベル
| 画面 | フィールド | 日本語 | 英語 | 確認 |
|------|----------|--------|------|:----:|
| | | | | ✅/❌ |

### バリデーションメッセージ
| ルール | 日本語 | 英語 | 確認 |
|--------|--------|------|:----:|
| required | 必須項目です | This field is required | ✅/❌ |
| email | 有効なメールアドレスを入力してください | Please enter a valid email | ✅/❌ |
```

---

## 4. 言語切替動作確認

### 4.1 テストシナリオ

```markdown
## 言語切替テスト

### シナリオ1: 初回アクセス
- [ ] ブラウザ言語が日本語の場合、日本語で表示
- [ ] ブラウザ言語が英語の場合、英語で表示
- [ ] その他の言語の場合、英語（フォールバック）で表示

### シナリオ2: 手動切替
- [ ] ヘッダーの言語切替ボタンが動作
- [ ] 切替後、全テキストが即座に更新
- [ ] ページリロード後も選択言語が維持
- [ ] URLに言語パラメータが反映（/ja, /en）

### シナリオ3: 特殊ケース
- [ ] エラーページが正しい言語で表示
- [ ] 404ページが正しい言語で表示
- [ ] ローディング中のテキストが正しい言語
- [ ] トースト通知が正しい言語

### シナリオ4: 動的コンテンツ
- [ ] APIから取得したデータの表示
- [ ] 日付・時間の表示形式が言語に対応
- [ ] 金額表示が言語に対応（カンマ、小数点）
```

### 4.2 画面別テスト

```markdown
## 画面別言語切替テスト

| # | 画面 | 日本語表示 | 英語表示 | 切替動作 | 備考 |
|---|------|:--------:|:-------:|:-------:|------|
| 1 | Landing | ✅/❌ | ✅/❌ | ✅/❌ | |
| 2 | Dashboard | ✅/❌ | ✅/❌ | ✅/❌ | |
| 3 | Lock | ✅/❌ | ✅/❌ | ✅/❌ | |
| 4 | Unlock | ✅/❌ | ✅/❌ | ✅/❌ | |
| ... | | | | | |
```

---

## 5. 専門用語の翻訳ガイドライン

### 5.1 固有名詞（翻訳しない）

```markdown
## 翻訳しない用語

| 用語 | 理由 |
|------|------|
| Quantum Shield | プロダクト名 |
| Dilithium | 暗号アルゴリズム名 |
| SPHINCS+ | 暗号アルゴリズム名 |
| Prover | 役割名（固有概念） |
| veQS | トークン名 |
| Time Lock | プロトコル用語 |
| Slashing | プロトコル用語 |
| L3 Aegis | システム名 |
```

### 5.2 翻訳する用語

```markdown
## 翻訳対照表

| 英語 | 日本語 | コンテキスト |
|------|--------|-------------|
| Lock | ロック | アクション名 |
| Unlock | アンロック | アクション名 |
| Dashboard | ダッシュボード | 画面名 |
| Transaction | トランザクション | 一般用語 |
| Wallet | ウォレット | 一般用語 |
| Connect Wallet | ウォレット接続 | ボタン |
| Disconnect | 切断 | ボタン |
| Pending | 処理中 | ステータス |
| Complete | 完了 | ステータス |
| Error | エラー | ステータス |
```

### 5.3 説明付き用語

```markdown
## 説明が必要な用語

| 用語 | 日本語説明 | 英語説明 |
|------|-----------|---------|
| Dilithium | NIST承認の量子耐性電子署名アルゴリズム | NIST-approved quantum-resistant digital signature algorithm |
| Time Lock | セキュリティのための待機期間 | Waiting period for security |
| Slashing | 不正行為に対するペナルティ | Penalty for malicious behavior |
| Emergency Unlock | Prover応答がない場合の緊急引き出し | Emergency withdrawal when Provers are unresponsive |
```

---

## 6. 監査レポート出力

### 6.1 レポートテンプレート

```markdown
# i18n 監査レポート

## 概要
- 監査日: YYYY-MM-DD
- 対象: [apps/web/src]
- 監査者: AI Agent

## サマリー
| カテゴリ | 総数 | Pass | Fail | カバレッジ |
|---------|:----:|:----:|:----:|:--------:|
| ハードコード検出 | | | | |
| 翻訳キー完全性 | | | | |
| 動的コンテンツ | | | | |
| 画面別テスト | | | | |
| **合計** | | | | **%** |

## 問題一覧

### 🔴 Critical（修正必須）
| # | ファイル | 行 | 問題 | 修正方法 |
|---|----------|-----|------|---------|
| 1 | | | | |

### 🟡 Warning（推奨修正）
| # | ファイル | 行 | 問題 | 修正方法 |
|---|----------|-----|------|---------|
| 1 | | | | |

## 判定
- [ ] ✅ **PASS** - カバレッジ100%、Critical 0件
- [ ] ⚠️ **CONDITIONAL** - Warning のみ
- [ ] ❌ **FAIL** - Critical 1件以上

## 次のアクション
1. [ ] Critical問題の修正
2. [ ] Warning問題の修正（推奨）
3. [ ] 再監査
```

---

## 7. 自動化スクリプト

### 7.1 検出スクリプト

```bash
#!/bin/bash
# i18n-audit.sh

echo "=== i18n Audit Script ==="

# 1. 日本語ハードコード検出
echo "## Checking Japanese hardcoded strings..."
grep -rn "[ぁ-んァ-ン一-龯]" \
  --include="*.tsx" --include="*.jsx" \
  --exclude-dir=node_modules \
  --exclude-dir=.next \
  --exclude="*.json"

# 2. 翻訳キー差分
echo "## Checking translation key diff..."
comm -3 \
  <(jq -r 'paths(scalars) | join(".")' locales/ja/common.json | sort) \
  <(jq -r 'paths(scalars) | join(".")' locales/en/common.json | sort)

# 3. 未使用翻訳キー
echo "## Checking unused translation keys..."
# (実装は使用するi18nライブラリに依存)

echo "=== Audit Complete ==="
```

### 7.2 CI/CD統合

```yaml
# .github/workflows/i18n-audit.yml
name: i18n Audit

on:
  pull_request:
    paths:
      - 'apps/web/src/**/*.tsx'
      - 'apps/web/locales/**/*.json'

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Check hardcoded strings
        run: |
          if grep -rn "[ぁ-んァ-ン一-龯]" \
            --include="*.tsx" \
            --exclude-dir=node_modules; then
            echo "❌ Hardcoded Japanese strings found!"
            exit 1
          fi

      - name: Check translation key coverage
        run: |
          # 翻訳キーカバレッジチェック
          npm run i18n:check
```

---

## 8. チェックリスト

### 8.1 実装時チェックリスト

```markdown
## 実装者向けチェックリスト

### コンポーネント作成時
- [ ] 全テキストは `t('key')` 経由
- [ ] プレースホルダーは `t('key')` 経由
- [ ] aria-label は `t('key')` 経由
- [ ] エラーメッセージは `t('key')` 経由

### 翻訳ファイル更新時
- [ ] 日本語と英語の両方にキーを追加
- [ ] キー命名規則に準拠
- [ ] 不要なキーは削除
```

### 8.2 レビュー時チェックリスト

```markdown
## レビュアー向けチェックリスト

### PRレビュー時
- [ ] 新規テキストに翻訳キーを使用
- [ ] 翻訳ファイルに両言語でキー追加
- [ ] 動的コンテンツのフォーマット確認
- [ ] 言語切替動作の確認（スクリーンショット添付）
```

---

## 9. よくある問題と解決策

### 9.1 問題パターン

```markdown
## よくある問題

### 問題1: 条件分岐内のテキスト
❌ 悪い例:
{status === 'pending' ? '処理中' : '完了'}

✅ 良い例:
{t(`status.${status}`)}

### 問題2: 文字列結合
❌ 悪い例:
`残り ${days} 日`

✅ 良い例:
t('timelock.remaining', { days })

### 問題3: 配列内のテキスト
❌ 悪い例:
const items = ['ダッシュボード', '設定', '履歴']

✅ 良い例:
const items = [t('nav.dashboard'), t('nav.settings'), t('nav.history')]
```

---

**END OF PROMPT**
