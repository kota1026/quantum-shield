# 41: Design System Compliance Check

> **目的**: DESIGN_SYSTEM.md準拠を体系的に検証するチェックリスト
> **実行タイミング**: 画面実装完了後、PRレビュー前
> **所要時間**: 1画面あたり5-10分

---

## 概要

このプロンプトは、実装した画面がDESIGN_SYSTEM.md v1.2に準拠しているかを検証するためのチェックリストです。Playwright MCPを使用して自動検証を行います。

---

## 検証カテゴリ

### 1. タップターゲット (D9)

**基準**: 最小44px × 44px（iOS HIG準拠）

```javascript
// Playwright検証コード
() => {
  const buttons = document.querySelectorAll('button, a, [role="button"], [tabindex="0"]');
  const issues = [];
  buttons.forEach((btn, i) => {
    const rect = btn.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      if (rect.width < 44 || rect.height < 44) {
        issues.push({
          index: i,
          element: btn.textContent?.substring(0, 30),
          width: rect.width,
          height: rect.height
        });
      }
    }
  });
  return { total: buttons.length, issues };
}
```

**チェック項目**:
- [ ] ナビゲーションボタン ≥ 44px
- [ ] アイコンボタン ≥ 44px（パディングで確保可）
- [ ] テーブル内ボタン ≥ 44px
- [ ] ツールチップトリガー ≥ 44px（親要素で確保）
- [ ] フィルター/タブボタン ≥ 44px

---

### 2. カラー検証 (C1-C5)

**基準**: DESIGN_SYSTEM.md Section 2

| ID | チェック項目 | 期待値 |
|----|-------------|--------|
| C1 | 背景色 | `#0A0A0C` (dark mode) |
| C2 | Hinomaru Red | `#BC002D` |
| C3 | Premium Gold | `#C9A962` |
| C4 | テキスト（primary） | `#F8F8FA` |
| C5 | テキスト（secondary） | `#9898A0` |

```javascript
// Playwright検証コード
() => {
  const body = document.body;
  const bodyBg = window.getComputedStyle(body).backgroundColor;

  // RGB to Hex conversion
  const rgbToHex = (rgb) => {
    const match = rgb.match(/\d+/g);
    if (!match) return rgb;
    return '#' + match.slice(0,3).map(x => parseInt(x).toString(16).padStart(2,'0')).join('').toUpperCase();
  };

  return {
    background: rgbToHex(bodyBg),
    expected: '#0A0A0C'
  };
}
```

**⚠️ 既知の不整合**:
- `globals.css`と`tailwind.config.ts`で一部カラー値が異なる
- 詳細は DESIGN_COMPLIANCE_TRACKER.md を参照

---

### 3. タイポグラフィ検証 (T1-T4)

**基準**: DESIGN_SYSTEM.md Section 3

| ID | チェック項目 | 期待値 |
|----|-------------|--------|
| T1 | フォントファミリー | Plus Jakarta Sans, Noto Sans JP |
| T2 | 数値フォント | DM Mono |
| T3 | 最小フォントサイズ | 12px (0.75rem) |
| T4 | 見出しweight | 600-700 |

```javascript
// Playwright検証コード
() => {
  const body = document.body;
  const fontFamily = window.getComputedStyle(body).fontFamily;

  const monoEl = document.querySelector('[class*="font-mono"]');
  const monoFont = monoEl ? window.getComputedStyle(monoEl).fontFamily : 'N/A';

  return {
    bodyFont: fontFamily,
    monoFont: monoFont,
    expectedBody: 'Plus Jakarta Sans, Noto Sans JP',
    expectedMono: 'DM Mono'
  };
}
```

---

### 4. ボタンバリアント検証 (B1-B3)

**基準**: DESIGN_SYSTEM.md Section 5

| ID | チェック項目 | 基準 |
|----|-------------|------|
| B1 | Primary CTAは1画面に1つ | ❌ 複数は禁止 |
| B2 | Primaryボタン色 | Hinomaru gradient |
| B3 | Secondaryボタン色 | Gold border |

```javascript
// Playwright検証コード
() => {
  const primaryBtns = document.querySelectorAll(
    'button[class*="bg-gradient-hinomaru"], button[class*="bg-hinomaru"]:not([class*="bg-hinomaru/"])'
  );
  return {
    primaryCount: primaryBtns.length,
    rule: primaryBtns.length <= 1 ? 'PASS' : 'FAIL - Multiple primary buttons'
  };
}
```

---

### 5. ツールチップ検証 (TT1-TT3)

**基準**: 解説テキストが見切れずに表示される

| ID | チェック項目 | 基準 |
|----|-------------|------|
| TT1 | 最大幅 | 320px |
| TT2 | テキスト折り返し | あり |
| TT3 | 画面端での位置調整 | あり |

**手動検証手順**:
1. ツールチップトリガー（?アイコン）にホバー
2. ツールチップが表示されることを確認
3. テキストが見切れていないことを確認
4. 画面端でも正しく表示されることを確認

**チェック対象の技術用語**:
- Dilithium（量子耐性署名）
- STARK（証明システム）
- Bond（保証金）
- Time Lock（時間ロック）
- veQS（投票権トークン）
- Quorum（定足数）

---

### 6. 角丸検証 (R1-R3)

**基準**: DESIGN_SYSTEM.md / tailwind.config.ts

| ID | 名前 | 値 | 用途 |
|----|------|-----|------|
| R1 | qs | 10px | 標準 |
| R2 | qs-lg | 14px | カード |
| R3 | qs-xl | 20px | モーダル |

---

### 7. スペーシング検証 (S1)

**基準**: 4pxグリッドシステム

- [ ] 要素間のスペーシングが4の倍数
- [ ] padding/marginが一貫している

---

### 8. ファイル整合性検証 (F1)

**基準**: 3ファイル間でカラー値が一致

| ファイル | 役割 |
|----------|------|
| `docs/design/DESIGN_SYSTEM.md` | 仕様書（正） |
| `apps/web/tailwind.config.ts` | Tailwindテーマ |
| `apps/web/src/styles/globals.css` | CSS変数 |

**⚠️ 現在の不整合**:

| カラー | DESIGN_SYSTEM.md | tailwind.config.ts | globals.css |
|--------|------------------|-------------------|-------------|
| text-primary | `#F8F8FA` | `#F8F8FA` ✅ | `#FAFAFA` ❌ |
| text-secondary | `#9898A0` | `#9898A0` ✅ | `#A1A1AA` ❌ |
| success | `#00C896` | `#00C896` ✅ | `#10B981` ❌ |
| warning | `#F0A030` | `#F0A030` ✅ | `#F59E0B` ❌ |
| danger | `#E84057` | `#E84057` ✅ | `#EF4444` ❌ |

---

## 実行方法

### 1. Playwright MCPを使用した自動検証

```
1. 対象画面をブラウザで開く
2. browser_evaluate で検証コードを実行
3. 結果を確認
```

### 2. 手動検証

```
1. ツールチップのホバー確認
2. モバイルビューでのタップエリア確認
3. スクリーンショットでの目視確認
```

---

## 検証レポートテンプレート

```markdown
## Design System Compliance Report

### 画面情報
- URL: {url}
- 画面名: {screen_name}
- 検証日: {date}

### 検証結果サマリー

| カテゴリ | 結果 | 備考 |
|----------|:----:|------|
| D9 タップターゲット | ✅/❌ | |
| C1-C5 カラー | ✅/❌ | |
| T1-T4 タイポグラフィ | ✅/❌ | |
| B1-B3 ボタン | ✅/❌ | |
| TT1-TT3 ツールチップ | ✅/❌ | |
| R1-R3 角丸 | ✅/❌ | |
| S1 スペーシング | ✅/❌ | |

### 詳細

#### 問題点
| # | カテゴリ | 問題 | 修正方法 |
|---|---------|------|----------|
| 1 | | | |

#### スクリーンショット
- 通常表示: {screenshot_url}
- ツールチップ: {screenshot_url}

### 判定
- **PASS**: 全項目クリア
- **CONDITIONAL**: 軽微な問題あり（1-2件）
- **FAIL**: 重大な問題あり（3件以上）
```

---

## 関連ドキュメント

| ドキュメント | パス |
|-------------|------|
| デザインシステム仕様 | `docs/design/DESIGN_SYSTEM.md` |
| Tailwind設定 | `apps/web/tailwind.config.ts` |
| CSS変数 | `apps/web/src/styles/globals.css` |
| 進捗トラッカー | `docs/phase6/DESIGN_COMPLIANCE_TRACKER.md` |
| 画面監査ガイド | `docs/design/SCREEN_AUDIT_GUIDE.md` |

---

## 更新履歴

| バージョン | 日付 | 変更内容 |
|-----------|------|----------|
| 1.0 | 2026-01-25 | 初版作成 |
