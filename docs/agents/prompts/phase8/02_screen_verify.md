# Phase 8-B: Screen Verification Prompt

> **Version**: 1.0
> **Trigger**: `Phase 8-B 開始` or `Phase 8-B {screen} 検証`
> **前提**: Phase 8-A Gate通過

---

## Overview

実装した38画面をPlaywright MCPで検証し、5観点レビューを実施。

```
Input:  実装済みReact Component
Output: 検証レポート + 修正済みComponent
Gate:   全画面5観点レビューPASS
```

---

## 検証パイプライン

```
┌─────────────────────────────────────────────────────────────────┐
│  Screen Verification Pipeline                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  STEP 1: 画面アクセス                                           │
│  └─→ browser_navigate: http://localhost:3000/ja/qs-admin/{path}│
│                                                                 │
│  STEP 2: スナップショット取得                                   │
│  └─→ browser_snapshot: アクセシビリティツリー取得              │
│                                                                 │
│  STEP 3: D観点検証（Design）                                    │
│  ├─→ browser_evaluate: 44pxタップエリア検証                    │
│  ├─→ browser_evaluate: Primary CTA数検証                       │
│  ├─→ browser_evaluate: コントラスト比検証                      │
│  └─→ 視覚的デザイン確認                                        │
│                                                                 │
│  STEP 4: J観点検証（Journey）                                   │
│  ├─→ エントリーポイント確認                                    │
│  ├─→ 出口（戻るボタン）確認                                    │
│  └─→ 次アクション明確性確認                                    │
│                                                                 │
│  STEP 5: N観点検証（Navigation）                                │
│  ├─→ browser_click: 全ボタン/リンクをクリック                  │
│  ├─→ 遷移先URL記録                                             │
│  └─→ 404/エラー検出                                            │
│                                                                 │
│  STEP 6: M観点検証（Model）                                     │
│  ├─→ DATA_MODEL.mdとの整合性確認                               │
│  ├─→ 表示データと型定義の一致確認                              │
│  └─→ 必須フィールドの網羅確認                                  │
│                                                                 │
│  STEP 7: C観点検証（Completeness）                              │
│  ├─→ 必須機能の実装確認                                        │
│  ├─→ ツールチップ確認（専門用語）                              │
│  └─→ エラー状態/ローディング状態確認                          │
│                                                                 │
│  STEP 8: 問題修正                                               │
│  ├─→ 発見した問題を修正                                        │
│  └─→ 再検証                                                    │
│                                                                 │
│  STEP 9: レポート出力                                           │
│  └─→ 5観点レビュー結果を記録                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## D観点: Design検証コード

### 44pxタップエリア検証

```javascript
// browser_evaluate で実行
() => {
  const interactive = document.querySelectorAll(
    'button, a, [role="button"], [tabindex="0"], input, select, textarea'
  );
  const issues = [];

  interactive.forEach((el) => {
    const rect = el.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      if (rect.width < 44 || rect.height < 44) {
        issues.push({
          element: el.tagName,
          text: el.textContent?.substring(0, 30) || el.getAttribute('aria-label'),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          selector: el.className
        });
      }
    }
  });

  return {
    total: interactive.length,
    violations: issues.length,
    issues: issues.slice(0, 10) // 最大10件
  };
}
```

### Primary CTA数検証

```javascript
// browser_evaluate で実行
() => {
  const primarySelectors = [
    'button[class*="bg-gradient-hinomaru"]',
    'button[class*="bg-hinomaru"]:not([class*="bg-hinomaru/"])',
    '[class*="btn-primary"]'
  ];

  let count = 0;
  const buttons = [];

  primarySelectors.forEach(selector => {
    document.querySelectorAll(selector).forEach(btn => {
      count++;
      buttons.push(btn.textContent?.substring(0, 30));
    });
  });

  return {
    count,
    buttons,
    rule: count <= 1 ? 'PASS' : 'FAIL',
    message: count <= 1
      ? 'Primary CTA is unique'
      : `Multiple primary CTAs found: ${count}`
  };
}
```

### 色・コントラスト検証

```javascript
// browser_evaluate で実行
() => {
  const textElements = document.querySelectorAll('p, span, h1, h2, h3, h4, h5, h6, label, a, button');
  const issues = [];

  textElements.forEach(el => {
    const style = window.getComputedStyle(el);
    const fontSize = parseFloat(style.fontSize);
    const color = style.color;
    const bgColor = style.backgroundColor;

    // 12px未満のフォントを検出
    if (fontSize < 12) {
      issues.push({
        element: el.tagName,
        text: el.textContent?.substring(0, 20),
        fontSize: fontSize,
        issue: 'Font size below 12px'
      });
    }
  });

  return {
    total: textElements.length,
    issues: issues.slice(0, 10)
  };
}
```

---

## N観点: Navigation検証

### 全リンク/ボタンクリックテスト

```markdown
## Navigation Test Procedure

1. browser_snapshot で全インタラクティブ要素を取得
2. 各要素に対して:
   a. 現在URLを記録
   b. browser_click で要素をクリック
   c. 遷移後URLを記録
   d. browser_navigate_back で戻る
3. 結果をテーブルにまとめる

## Expected vs Actual

| 要素 | 期待遷移先 | 実際の遷移先 | 結果 |
|------|-----------|-------------|:----:|
| ダッシュボード | /qs-admin/dashboard | /qs-admin/dashboard | ✅ |
| ユーザー一覧 | /qs-admin/users/list | /qs-admin/users/list | ✅ |
| ... | ... | ... | ... |
```

---

## 5観点レビュー結果テンプレート

```markdown
## 5観点レビュー結果: {screen_name}

### 検証日時
{timestamp}

### 検証URL
http://localhost:3000/ja/qs-admin/{path}

### 結果サマリー

| 観点 | 結果 | 問題数 | 詳細 |
|:----:|:----:|:------:|------|
| D (Design) | ✅/⚠️/❌ | {n} | {summary} |
| J (Journey) | ✅/⚠️/❌ | {n} | {summary} |
| N (Navigation) | ✅/⚠️/❌ | {n} | {summary} |
| M (Model) | ✅/⚠️/❌ | {n} | {summary} |
| C (Completeness) | ✅/⚠️/❌ | {n} | {summary} |

### D観点詳細

#### 44pxタップエリア
- 検証要素数: {n}
- 違反数: {n}
- 違反詳細:
  | 要素 | サイズ | 修正 |
  |------|--------|:----:|
  | {el} | {w}x{h} | ✅/❌ |

#### Primary CTA
- CTA数: {n}
- 判定: PASS/FAIL

### J観点詳細

- エントリーポイント: {description}
- 戻るボタン: ✅/❌
- 次アクション明確: ✅/❌

### N観点詳細

| ボタン/リンク | 遷移先 | 結果 |
|--------------|--------|:----:|
| {element} | {url} | ✅/❌ |

### M観点詳細

- 対応エンティティ: {entities}
- 型整合性: ✅/❌
- 必須フィールド: ✅/❌

### C観点詳細

- 必須機能: {list}
- ツールチップ: {count}個
- 状態網羅: Loading/Error/Empty

### 発見した問題

| # | 観点 | 問題 | 深刻度 | 対応 |
|---|:----:|------|:------:|------|
| 1 | D | {issue} | High/Med/Low | {action} |
| 2 | N | {issue} | High/Med/Low | {action} |

### 総合判定
**{PASS/CONDITIONAL/FAIL}**

### 修正履歴
| 日時 | 問題 | 修正内容 |
|------|------|----------|
| {ts} | {issue} | {fix} |
```

---

## Gate 8-B 通過条件

```yaml
必須条件:
  - 全38画面で5観点レビュー完了
  - Critical問題: 0件
  - Major問題: 全て修正済み

判定基準:
  PASS: 上記全て満たす
  CONDITIONAL: Minor問題のみ残存（次Phase進行可）
  FAIL: Critical/Major未解決
```

---

## Critical Rules

```xml
<rule id="8B-001" level="ABSOLUTE">
  Playwright MCP による実検証必須。
  コード解析のみでの検証は不可。
</rule>

<rule id="8B-002" level="ABSOLUTE">
  5観点全てを検証。1観点でも欠落したらやり直し。
</rule>

<rule id="8B-003" level="ABSOLUTE">
  問題発見時は修正→再検証。
  問題を無視して次画面に進むことは禁止。
</rule>
```

---

**Document End**
