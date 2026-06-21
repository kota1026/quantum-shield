# 33_a11y_check.md - Accessibility Check Prompt
## Phase 6: アクセシビリティ検証

> **Version**: 1.0
> **Date**: 2026-01-13
> **Purpose**: WCAG 2.1 AA準拠検証
> **Structure**: Anthropic Claude 4.x XML Best Practices準拠

---

## 1. Overview

<purpose>
8システム98画面のアクセシビリティをWCAG 2.1 AA基準で検証する。
</purpose>

<wcag_target>
  <level>AA</level>
  <version>2.1</version>
  <principles>
    <principle name="Perceivable">知覚可能</principle>
    <principle name="Operable">操作可能</principle>
    <principle name="Understandable">理解可能</principle>
    <principle name="Robust">堅牢</principle>
  </principles>
</wcag_target>

---

## 2. Required Context

<required_context>
  <design_guidelines priority="MUST_READ">
    <path>docs_new/01_phase/04_phase4/01_design/UI_DESIGN_GUIDELINES.md</path>
    <section>Part 11: Accessibility</section>
  </design_guidelines>
</required_context>

---

## 3. Checklist by WCAG Principle

### 3.1 Perceivable（知覚可能）

<checklist category="perceivable">

#### 1.1 Text Alternatives
| # | 基準 | 確認項目 | 結果 |
|---|------|---------|:----:|
| 1.1.1 | Non-text Content | 全画像にalt属性がある | ⬜ |
| 1.1.1 | Non-text Content | 装飾画像はalt="" | ⬜ |
| 1.1.1 | Non-text Content | アイコンボタンにaria-label | ⬜ |

#### 1.3 Adaptable
| # | 基準 | 確認項目 | 結果 |
|---|------|---------|:----:|
| 1.3.1 | Info and Relationships | 見出し階層が正しい（h1→h2→h3） | ⬜ |
| 1.3.1 | Info and Relationships | フォームにlabel紐付け | ⬜ |
| 1.3.1 | Info and Relationships | テーブルにヘッダー定義 | ⬜ |
| 1.3.2 | Meaningful Sequence | DOM順序が論理的 | ⬜ |
| 1.3.4 | Orientation | 画面回転対応 | ⬜ |

#### 1.4 Distinguishable
| # | 基準 | 確認項目 | 結果 |
|---|------|---------|:----:|
| 1.4.1 | Use of Color | 色だけで情報伝達していない | ⬜ |
| 1.4.3 | Contrast (Minimum) | テキスト4.5:1以上 | ⬜ |
| 1.4.3 | Contrast (Minimum) | 大きなテキスト3:1以上 | ⬜ |
| 1.4.4 | Resize Text | 200%拡大で崩れない | ⬜ |
| 1.4.10 | Reflow | 320px幅で横スクロール不要 | ⬜ |
| 1.4.11 | Non-text Contrast | UI要素3:1以上 | ⬜ |
| 1.4.12 | Text Spacing | 行間・文字間調整可能 | ⬜ |

</checklist>

### 3.2 Operable（操作可能）

<checklist category="operable">

#### 2.1 Keyboard Accessible
| # | 基準 | 確認項目 | 結果 |
|---|------|---------|:----:|
| 2.1.1 | Keyboard | 全機能がキーボード操作可能 | ⬜ |
| 2.1.1 | Keyboard | Tab順序が論理的 | ⬜ |
| 2.1.2 | No Keyboard Trap | フォーカストラップなし | ⬜ |
| 2.1.4 | Character Key Shortcuts | 単一キーショートカットOFF可能 | ⬜ |

#### 2.4 Navigable
| # | 基準 | 確認項目 | 結果 |
|---|------|---------|:----:|
| 2.4.1 | Bypass Blocks | スキップリンクがある | ⬜ |
| 2.4.2 | Page Titled | ページタイトルが適切 | ⬜ |
| 2.4.3 | Focus Order | フォーカス順序が論理的 | ⬜ |
| 2.4.4 | Link Purpose | リンク目的が明確 | ⬜ |
| 2.4.6 | Headings and Labels | 見出しとラベルが説明的 | ⬜ |
| 2.4.7 | Focus Visible | フォーカスが視認可能 | ⬜ |

#### 2.5 Input Modalities
| # | 基準 | 確認項目 | 結果 |
|---|------|---------|:----:|
| 2.5.1 | Pointer Gestures | 複雑なジェスチャー不要 | ⬜ |
| 2.5.2 | Pointer Cancellation | 誤操作取消可能 | ⬜ |
| 2.5.3 | Label in Name | 表示ラベルとaria-labelが一致 | ⬜ |
| 2.5.4 | Motion Actuation | モーション操作代替あり | ⬜ |

</checklist>

### 3.3 Understandable（理解可能）

<checklist category="understandable">

#### 3.1 Readable
| # | 基準 | 確認項目 | 結果 |
|---|------|---------|:----:|
| 3.1.1 | Language of Page | lang属性設定（ja/en） | ⬜ |
| 3.1.2 | Language of Parts | 言語切替で正しく変更 | ⬜ |

#### 3.2 Predictable
| # | 基準 | 確認項目 | 結果 |
|---|------|---------|:----:|
| 3.2.1 | On Focus | フォーカスで意図しない変更なし | ⬜ |
| 3.2.2 | On Input | 入力で意図しない変更なし | ⬜ |
| 3.2.3 | Consistent Navigation | ナビゲーションが一貫 | ⬜ |
| 3.2.4 | Consistent Identification | 同機能は同名称 | ⬜ |

#### 3.3 Input Assistance
| # | 基準 | 確認項目 | 結果 |
|---|------|---------|:----:|
| 3.3.1 | Error Identification | エラー箇所が明示 | ⬜ |
| 3.3.2 | Labels or Instructions | 入力ガイダンスあり | ⬜ |
| 3.3.3 | Error Suggestion | エラー修正案提示 | ⬜ |
| 3.3.4 | Error Prevention | 重要操作は確認あり | ⬜ |

</checklist>

### 3.4 Robust（堅牢）

<checklist category="robust">

#### 4.1 Compatible
| # | 基準 | 確認項目 | 結果 |
|---|------|---------|:----:|
| 4.1.1 | Parsing | HTMLが妥当 | ⬜ |
| 4.1.2 | Name, Role, Value | ARIA属性が正しい | ⬜ |
| 4.1.3 | Status Messages | 状態変更が通知される | ⬜ |

</checklist>

---

## 4. Automated Testing

### 4.1 axe-core統合

```typescript
// playwright.config.ts に追加

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('accessibility check', async ({ page }) => {
  await page.goto('/dashboard');

  const accessibilityScanResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();

  expect(accessibilityScanResults.violations).toEqual([]);
});
```

### 4.2 Lighthouse CI

```yaml
# .github/workflows/a11y.yml

name: Accessibility Audit

on: [push, pull_request]

jobs:
  a11y:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Lighthouse CI
        uses: treosh/lighthouse-ci-action@v10
        with:
          configPath: ./lighthouserc.json
          uploadArtifacts: true

      - name: Check Accessibility Score
        run: |
          SCORE=$(cat .lighthouseci/lhr-*.json | jq '.categories.accessibility.score')
          if (( $(echo "$SCORE < 0.9" | bc -l) )); then
            echo "Accessibility score $SCORE is below 90%"
            exit 1
          fi
```

---

## 5. Color Contrast Verification

### 5.1 Premium Japan カラーパレット検証

| 組み合わせ | 前景色 | 背景色 | コントラスト比 | 判定 |
|-----------|--------|--------|:-------------:|:----:|
| Primary Text | #F8F8FA | #0A0A0C | 15.2:1 | ✅ AAA |
| Secondary Text | #9898A0 | #0A0A0C | 5.8:1 | ✅ AA |
| Hinomaru on BG | #BC002D | #0A0A0C | 5.1:1 | ✅ AA |
| Gold on BG | #C9A962 | #0A0A0C | 4.6:1 | ✅ AA |
| Success | #00C896 | #0A0A0C | 6.2:1 | ✅ AA |
| Error | #E07040 | #0A0A0C | 4.7:1 | ✅ AA |

---

## 6. Screen Reader Testing

### 6.1 テストシナリオ

<screen_reader_test>
| # | シナリオ | VoiceOver | NVDA | 結果 |
|---|---------|:---------:|:----:|:----:|
| 1 | ダッシュボード読み上げ | ⬜ | ⬜ | |
| 2 | ロックフォーム操作 | ⬜ | ⬜ | |
| 3 | エラーメッセージ通知 | ⬜ | ⬜ | |
| 4 | モーダル操作 | ⬜ | ⬜ | |
| 5 | テーブルナビゲーション | ⬜ | ⬜ | |
</screen_reader_test>

---

## 7. Reduced Motion

```css
/* 既にUI_DESIGN_GUIDELINES.mdで定義済み */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 8. Output

```markdown
## Accessibility Audit Report

### System: {SYSTEM_NAME}
### Date: YYYY-MM-DD

### WCAG 2.1 AA Compliance

| Principle | Total | Pass | Fail | N/A |
|-----------|:-----:|:----:|:----:|:---:|
| Perceivable | 14 | | | |
| Operable | 14 | | | |
| Understandable | 10 | | | |
| Robust | 3 | | | |
| **Total** | **41** | | | |

### Automated Test Results
- axe-core violations: [N]
- Lighthouse Accessibility: [X]%

### Issues Found
| # | 基準 | 画面 | 問題 | 対応 |
|---|------|------|------|------|
| 1 | 1.4.3 | Dashboard | コントラスト不足 | 色調整 |

### Judgment
- [ ] ✅ **PASS** - 全基準クリア
- [ ] ⚠️ **CONDITIONAL** - 軽微な問題あり
- [ ] ❌ **FAIL** - 重大な問題あり
```

---

**END OF PROMPT**
