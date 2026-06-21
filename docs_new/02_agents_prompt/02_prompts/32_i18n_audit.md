# 32_i18n_audit.md - Internationalization Audit Prompt

## Phase 6: 国際化（i18n）完全性監査

> **Version**: 1.1
> **Date**: 2026-01-14
> **Purpose**: 日英切替の完全性保証
> **Structure**: Anthropic Claude 4.x XML Best Practices準拠

---

## 1. Overview

<purpose>
UIコンポーネントおよびページにおける国際化対応の完全性を監査する。
日英切替漏れを検出し、100%カバレッジを保証する。
</purpose>

<critical_warning level="ABSOLUTE">
日英切替漏れは**絶対禁止**です。
このプロンプトは全UI実装後に必ず実行してください。
</critical_warning>

---

## 2. Required Context

<required_context>
  <ui_components priority="MUST_READ">
    <path>apps/web/src/**/*.tsx</path>
    <purpose>監査対象UIコード</purpose>
  </required_context>
  <locale_files priority="MUST_READ">
    <path>apps/web/locales/ja/*.json</path>
    <path>apps/web/locales/en/*.json</path>
    <purpose>翻訳ファイル</purpose>
  </locale_files>
</required_context>

<input_requirements>
  <required>
    <param name="target_path">監査対象ディレクトリ（例: apps/web/src）</param>
    <param name="locale_files_ja">翻訳ファイル（日本語）</param>
    <param name="locale_files_en">翻訳ファイル（英語）</param>
  </required>
  <optional>
    <param name="ignore_patterns">除外パターン（例: *.test.tsx）</param>
  </optional>
</input_requirements>

---

## 3. Audit Checklist

### 3.1 Phase 1: Hardcoded String Detection

<checklist category="hardcoded_detection">

```bash
# JSX内の日本語テキスト
grep -r "[ぁ-んァ-ン一-龯]" --include="*.tsx" --include="*.jsx"

# 疑わしい英語テキスト（翻訳キー以外）
grep -rE ">[A-Z][a-z]+ [A-Z]?[a-z]+" --include="*.tsx" --include="*.jsx"

# プレースホルダー（直接記述）
grep -r "placeholder=\"[^{]" --include="*.tsx"

# aria-label（直接記述）
grep -r "aria-label=\"[^{]" --include="*.tsx"
```

<result_template>
| # | ファイル | 行 | 問題 | 修正方法 |
|---|----------|-----|------|---------|
| 1 | | | | t('key') に置換 |
</result_template>

</checklist>

### 3.2 Phase 2: Translation Key Completeness

<checklist category="translation_keys">

```markdown
## 翻訳キー監査

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

</checklist>

### 3.3 Phase 3: Dynamic Content

<checklist category="dynamic_content">

<format_check type="numbers">
| 項目 | 日本語 | 英語 | 確認 |
|------|--------|------|:----:|
| 金額 | ¥1,234 | $1,234 | ⬜ |
| 大きな数値 | 1,234,567 | 1,234,567 | ⬜ |
| 小数点 | 0.123 | 0.123 | ⬜ |
| パーセント | 12.3% | 12.3% | ⬜ |
</format_check>

<format_check type="dates">
| 項目 | 日本語 | 英語 | 確認 |
|------|--------|------|:----:|
| 日付（短） | 2026/01/14 | Jan 14, 2026 | ⬜ |
| 日付（長） | 2026年1月14日 | January 14, 2026 | ⬜ |
| 時間 | 14:30 | 2:30 PM | ⬜ |
| 相対時間 | 3時間前 | 3 hours ago | ⬜ |
</format_check>

<format_check type="plurals">
| キー | 日本語（単数/複数同じ） | 英語（単数/複数） | 確認 |
|------|----------------------|------------------|:----:|
| transaction | 1 トランザクション | 1 transaction / 2 transactions | ⬜ |
| day | 1 日 | 1 day / 2 days | ⬜ |
</format_check>

</checklist>

### 3.4 Phase 4: UI Elements

<checklist category="ui_elements">

<element_check type="buttons">
| 画面 | 要素 | 日本語 | 英語 | 確認 |
|------|------|--------|------|:----:|
| | | | | ⬜ |
</element_check>

<element_check type="errors">
| コード | 日本語 | 英語 | 確認 |
|--------|--------|------|:----:|
| ERR_001 | | | ⬜ |
</element_check>

<element_check type="tooltips">
| 画面 | 要素 | 日本語 | 英語 | 確認 |
|------|------|--------|------|:----:|
| | | | | ⬜ |
</element_check>

<element_check type="form_labels">
| 画面 | フィールド | 日本語 | 英語 | 確認 |
|------|----------|--------|------|:----:|
| | | | | ⬜ |
</element_check>

<element_check type="validation">
| ルール | 日本語 | 英語 | 確認 |
|--------|--------|------|:----:|
| required | 必須項目です | This field is required | ⬜ |
| email | 有効なメールアドレスを入力してください | Please enter a valid email | ⬜ |
</element_check>

</checklist>

---

## 4. Language Switch Testing

### 4.1 Test Scenarios

<test_scenarios>

<scenario id="initial_access">
  <name>初回アクセス</name>
  <checks>
    <check>ブラウザ言語が日本語の場合、日本語で表示</check>
    <check>ブラウザ言語が英語の場合、英語で表示</check>
    <check>その他の言語の場合、英語（フォールバック）で表示</check>
  </checks>
</scenario>

<scenario id="manual_switch">
  <name>手動切替</name>
  <checks>
    <check>ヘッダーの言語切替ボタンが動作</check>
    <check>切替後、全テキストが即座に更新</check>
    <check>ページリロード後も選択言語が維持</check>
    <check>URLに言語パラメータが反映（/ja, /en）</check>
  </checks>
</scenario>

<scenario id="special_cases">
  <name>特殊ケース</name>
  <checks>
    <check>エラーページが正しい言語で表示</check>
    <check>404ページが正しい言語で表示</check>
    <check>ローディング中のテキストが正しい言語</check>
    <check>トースト通知が正しい言語</check>
  </checks>
</scenario>

<scenario id="dynamic_content">
  <name>動的コンテンツ</name>
  <checks>
    <check>APIから取得したデータの表示</check>
    <check>日付・時間の表示形式が言語に対応</check>
    <check>金額表示が言語に対応（カンマ、小数点）</check>
  </checks>
</scenario>

</test_scenarios>

### 4.2 Screen-by-Screen Testing

<screen_test_matrix>
| # | 画面 | 日本語表示 | 英語表示 | 切替動作 | 備考 |
|---|------|:--------:|:-------:|:-------:|------|
| 1 | Landing | ⬜ | ⬜ | ⬜ | |
| 2 | Dashboard | ⬜ | ⬜ | ⬜ | |
| 3 | Lock | ⬜ | ⬜ | ⬜ | |
| 4 | Unlock | ⬜ | ⬜ | ⬜ | |
</screen_test_matrix>

---

## 5. Terminology Guidelines

### 5.1 Terms NOT to Translate

<untranslated_terms>
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
</untranslated_terms>

### 5.2 Translation Dictionary

<translation_dictionary>
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
</translation_dictionary>

### 5.3 Terms Requiring Explanation

<terms_with_explanation>
| 用語 | 日本語説明 | 英語説明 |
|------|-----------|---------|
| Dilithium | NIST承認の量子耐性電子署名アルゴリズム | NIST-approved quantum-resistant digital signature algorithm |
| Time Lock | セキュリティのための待機期間 | Waiting period for security |
| Slashing | 不正行為に対するペナルティ | Penalty for malicious behavior |
| Emergency Unlock | Prover応答がない場合の緊急引き出し | Emergency withdrawal when Provers are unresponsive |
</terms_with_explanation>

---

## 6. Audit Report Output

<report_template>
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
</report_template>

---

## 7. Automation Scripts

### 7.1 Detection Script

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

echo "=== Audit Complete ==="
```

### 7.2 CI/CD Integration

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
          npm run i18n:check
```

---

## 8. Common Issues and Solutions

<common_issues>

<issue id="conditional_text">
  <name>条件分岐内のテキスト</name>
  <bad_example>{status === 'pending' ? '処理中' : '完了'}</bad_example>
  <good_example>{t(`status.${status}`)}</good_example>
</issue>

<issue id="string_concatenation">
  <name>文字列結合</name>
  <bad_example>`残り ${days} 日`</bad_example>
  <good_example>t('timelock.remaining', { days })</good_example>
</issue>

<issue id="array_text">
  <name>配列内のテキスト</name>
  <bad_example>const items = ['ダッシュボード', '設定', '履歴']</bad_example>
  <good_example>const items = [t('nav.dashboard'), t('nav.settings'), t('nav.history')]</good_example>
</issue>

</common_issues>

---

## 9. Implementation Checklist

<checklist category="implementation">
  <item>全テキストは `t('key')` 経由</item>
  <item>プレースホルダーは `t('key')` 経由</item>
  <item>aria-label は `t('key')` 経由</item>
  <item>エラーメッセージは `t('key')` 経由</item>
</checklist>

<checklist category="translation_update">
  <item>日本語と英語の両方にキーを追加</item>
  <item>キー命名規則に準拠</item>
  <item>不要なキーは削除</item>
</checklist>

<checklist category="review">
  <item>新規テキストに翻訳キーを使用</item>
  <item>翻訳ファイルに両言語でキー追加</item>
  <item>動的コンテンツのフォーマット確認</item>
  <item>言語切替動作の確認（スクリーンショット添付）</item>
</checklist>

---

**END OF PROMPT**
