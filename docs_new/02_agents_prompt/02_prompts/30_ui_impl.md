# 30_ui_impl.md - UI Implementation Prompt
## Phase 6: モックからReactコンポーネントへの実装

> **Version**: 1.0
> **Date**: 2026-01-13
> **Purpose**: Phase 4 HTMLモック → React/Next.js実装
> **Structure**: Anthropic Claude 4.x XML Best Practices準拠

---

## 1. Overview

<purpose>
Phase 4で作成されたHTMLモックを、本番品質のReact/Next.jsコンポーネントに変換する。
デザインシステム準拠、i18n対応、アクセシビリティ対応を含む。
</purpose>

<workflow_position>
```
Phase 4 (Design)              Phase 6 (Implementation)
─────────────────             ────────────────────────
09_design_create  ─────────>  30_ui_impl (THIS)
10_design_pir     ─────────>  31_design_pir
11_design_fix     ─────────>  修正ループ
```
</workflow_position>

---

## 2. Required Context

<required_context>
  <constitution priority="MUST_READ">
    <path>docs_new/00_core/CORE_PRINCIPLES.md</path>
    <purpose>不変原則の遵守（CP-1〜CP-5）</purpose>
  </constitution>

  <design_system priority="MUST_READ">
    <path>docs_new/01_phase/04_phase4/01_design/UI_DESIGN_GUIDELINES.md</path>
    <purpose>Premium Japan デザインシステム準拠</purpose>
  </design_system>

  <design_sheet priority="MUST_READ">
    <path>docs_new/01_phase/04_phase4/01_design/assets/design-concept-5-japan-premium.html</path>
    <purpose>デザインコンセプト参照</purpose>
  </design_sheet>

  <personas priority="SHOULD_READ">
    <path>docs_new/01_phase/04_phase4/01_design/DESIGN_REVIEW_AGENTS.md</path>
    <purpose>ペルソナ要件の理解</purpose>
  </personas>

  <source_mock priority="MUST_READ">
    <path>docs_new/01_phase/04_phase4/01_design/system_{SYSTEM_ID}_{SYSTEM_NAME}/wip/mocks/{SCREEN_FILE}</path>
    <purpose>実装対象のHTMLモック</purpose>
  </source_mock>
</required_context>

---

## 3. Session Variables

<session_variables>
  <variable name="SYSTEM_ID" example="01" />
  <variable name="SYSTEM_NAME" example="consumer" />
  <variable name="SCREEN_FILE" example="03_dashboard.html" />
  <variable name="COMPONENT_NAME" example="Dashboard" />
</session_variables>

### システム一覧

| ID | SYSTEM_NAME | 画面数 | 優先度 |
|----|-------------|:------:|:------:|
| 01 | consumer | 19 | P1 |
| 02 | token_hub | 10 | P2 |
| 03 | governance | 6 | P2 |
| 04 | prover | 11 | P1 |
| 05 | observer | 7 | P3 |
| 06 | explorer | 8 | P3 |
| 07 | enterprise | 25 | P1 |
| 08 | qs_admin | 12 | P2 |

---

## 4. Implementation Process

### STEP 1: モック分析

<thinking_guidance>
モック分析時に以下を確認:
1. HTML構造とコンポーネント境界
2. CSS Variables（デザインシステム準拠確認）
3. インタラクション定義（コメント内）
4. 日本語テキスト（i18nキー化対象）
5. 画像・アイコン（Lucide Icons使用）
</thinking_guidance>

```markdown
## モック分析レポート

### 基本情報
| 項目 | 値 |
|------|-----|
| ファイル | `{SCREEN_FILE}` |
| コンポーネント名 | `{COMPONENT_NAME}` |
| システム | `{SYSTEM_NAME}` |

### 抽出コンポーネント
| # | コンポーネント | 種別 | 再利用 |
|---|---------------|------|:------:|
| 1 | Header | Layout | ✅ 共通 |
| 2 | StatCard | Feature | ✅ 共通 |
| 3 | TransactionList | Feature | 🔵 固有 |

### i18nキー抽出
| # | 日本語テキスト | i18nキー |
|---|---------------|---------|
| 1 | ダッシュボード | `{system}.dashboard.title` |
| 2 | ロックする | `{system}.dashboard.lockButton` |

### インタラクション
| # | 要素 | アクション | 遷移先 |
|---|------|----------|--------|
| 1 | #lockBtn | click | openLockModal() |
| 2 | .tx-item | click | /history |
```

### STEP 2: コンポーネント設計

<component_structure>
```
apps/web/src/
├── components/
│   ├── common/              # 共通コンポーネント
│   │   ├── Button/
│   │   ├── Card/
│   │   ├── Input/
│   │   └── ...
│   │
│   └── {system}/            # システム固有
│       ├── {Component}/
│       │   ├── index.tsx
│       │   ├── {Component}.stories.tsx
│       │   └── {Component}.test.tsx
│       └── ...
│
├── app/
│   └── [locale]/
│       └── {system}/
│           └── {page}/
│               └── page.tsx
│
└── locales/
    ├── ja/
    │   └── {system}.json
    └── en/
        └── {system}.json
```
</component_structure>

### STEP 3: コンポーネント実装

<implementation_rules>
  <rule id="R1" priority="CRITICAL">
    全テキストはi18nキー経由。ハードコード禁止。
  </rule>
  <rule id="R2" priority="CRITICAL">
    CSS VariablesはUI_DESIGN_GUIDELINES.md準拠。
  </rule>
  <rule id="R3" priority="HIGH">
    アクセシビリティ: aria-*, role, tabIndex設定。
  </rule>
  <rule id="R4" priority="HIGH">
    レスポンシブ: モバイルファースト設計。
  </rule>
  <rule id="R5" priority="HIGH">
    Lucide Iconsを使用（絵文字禁止）。
  </rule>
</implementation_rules>

#### 実装テンプレート

```tsx
// apps/web/src/components/{system}/{Component}/index.tsx

'use client';

import { useTranslations } from 'next-intl';
import { FC } from 'react';
import { LucideIcon } from 'lucide-react';
import styles from './{Component}.module.css';

interface {Component}Props {
  // Props定義
}

export const {Component}: FC<{Component}Props> = ({ ...props }) => {
  const t = useTranslations('{system}.{component}');

  return (
    <div
      className={styles.container}
      role="region"
      aria-label={t('ariaLabel')}
    >
      <h1 className={styles.title}>{t('title')}</h1>
      {/* 実装 */}
    </div>
  );
};

export default {Component};
```

```css
/* apps/web/src/components/{system}/{Component}/{Component}.module.css */

.container {
  background: var(--bg-secondary);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
}

.title {
  font-size: var(--text-h1);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

/* レスポンシブ */
@media (max-width: 768px) {
  .container {
    padding: var(--space-4);
  }
}
```

### STEP 4: i18n対応

<i18n_structure>
```json
// locales/ja/{system}.json
{
  "{component}": {
    "title": "ダッシュボード",
    "ariaLabel": "メインダッシュボード",
    "lockButton": "ロックする",
    "unlockButton": "アンロックする",
    "stats": {
      "totalLocked": "ロック中",
      "available": "利用可能"
    }
  }
}

// locales/en/{system}.json
{
  "{component}": {
    "title": "Dashboard",
    "ariaLabel": "Main Dashboard",
    "lockButton": "Lock",
    "unlockButton": "Unlock",
    "stats": {
      "totalLocked": "Total Locked",
      "available": "Available"
    }
  }
}
```
</i18n_structure>

### STEP 5: Storybook作成

```tsx
// apps/web/src/components/{system}/{Component}/{Component}.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import { {Component} } from './index';

const meta: Meta<typeof {Component}> = {
  title: '{System}/{Component}',
  component: {Component},
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof {Component}>;

export const Default: Story = {
  args: {
    // デフォルトProps
  },
};

export const Loading: Story = {
  args: {
    isLoading: true,
  },
};

export const Error: Story = {
  args: {
    error: 'エラーメッセージ',
  },
};

export const Mobile: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};
```

### STEP 6: テスト作成

```tsx
// apps/web/src/components/{system}/{Component}/{Component}.test.tsx

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { {Component} } from './index';

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

describe('{Component}', () => {
  it('renders correctly', () => {
    render(<{Component} />);
    expect(screen.getByRole('region')).toBeInTheDocument();
  });

  it('displays translated title', () => {
    render(<{Component} />);
    expect(screen.getByText('title')).toBeInTheDocument();
  });

  it('handles user interaction', async () => {
    const user = userEvent.setup();
    const onAction = jest.fn();

    render(<{Component} onAction={onAction} />);

    await user.click(screen.getByRole('button'));
    expect(onAction).toHaveBeenCalled();
  });

  it('is accessible', () => {
    render(<{Component} />);
    expect(screen.getByRole('region')).toHaveAttribute('aria-label');
  });
});
```

---

## 5. Quality Checklist

### 5.1 実装チェックリスト

<checklist>
  <category name="Design System">
    <item>CSS Variables がUI_DESIGN_GUIDELINES.md準拠</item>
    <item>Premium Japan カラーパレット使用</item>
    <item>フォント: Plus Jakarta Sans, Noto Sans JP</item>
    <item>スペーシング: 4px基準</item>
    <item>Border Radius: 設計書準拠</item>
  </category>

  <category name="i18n">
    <item>全テキストがt()経由</item>
    <item>日本語翻訳ファイル作成</item>
    <item>英語翻訳ファイル作成</item>
    <item>日付・数値フォーマット対応</item>
  </category>

  <category name="Accessibility">
    <item>aria-label設定</item>
    <item>role属性設定</item>
    <item>キーボードナビゲーション</item>
    <item>コントラスト比4.5:1以上</item>
    <item>focus-visible対応</item>
  </category>

  <category name="Responsive">
    <item>モバイル対応（< 768px）</item>
    <item>タブレット対応（768px - 1024px）</item>
    <item>デスクトップ対応（> 1024px）</item>
  </category>

  <category name="Testing">
    <item>ユニットテスト作成</item>
    <item>Storybookストーリー作成</item>
    <item>全バリアント網羅</item>
  </category>
</checklist>

### 5.2 ペルソナ確認

<persona_check system="consumer">
  <persona name="田中さん" tech_level="2">
    <check>専門用語にツールチップがある</check>
    <check>ボタンが大きくタップしやすい</check>
    <check>エラーメッセージがわかりやすい</check>
  </persona>
</persona_check>

---

## 6. Output

### 6.1 成果物

```
apps/web/src/
├── components/{system}/{Component}/
│   ├── index.tsx              # メインコンポーネント
│   ├── {Component}.module.css # スタイル
│   ├── {Component}.stories.tsx # Storybook
│   └── {Component}.test.tsx   # テスト
│
└── locales/
    ├── ja/{system}.json       # 日本語翻訳
    └── en/{system}.json       # 英語翻訳
```

### 6.2 実装レポート

```markdown
## UI Implementation Report

### 対象
- System: {SYSTEM_NAME}
- Screen: {SCREEN_FILE}
- Component: {COMPONENT_NAME}

### 成果物
| ファイル | ステータス |
|---------|:--------:|
| index.tsx | ✅ |
| {Component}.module.css | ✅ |
| {Component}.stories.tsx | ✅ |
| {Component}.test.tsx | ✅ |
| ja/{system}.json | ✅ |
| en/{system}.json | ✅ |

### i18nキー数
- 日本語: [N]キー
- 英語: [N]キー

### テストカバレッジ
- Statements: [X]%
- Branches: [X]%

### 次のステップ
→ 31_design_pir.md でペルソナレビュー
```

---

## 7. Next Steps

### 7.1 レビューフロー

```
30_ui_impl.md (実装)
      ↓
31_design_pir.md (ペルソナレビュー)
      ↓
[PASS] → 次の画面へ
[CONDITIONAL] → 軽微修正後次へ
[FAIL] → 修正後再レビュー
```

### 7.2 API連携

UI実装完了後、`34_api_impl.md` でAPI連携を実装:

```tsx
// API連携追加例
import { useLockMutation } from '@/hooks/useLock';

export const Dashboard = () => {
  const { mutate: lock, isLoading } = useLockMutation();

  const handleLock = () => {
    lock({ amount, duration });
  };

  // ...
};
```

---

## 8. Examples

### 8.1 Consumer Dashboard 実装例

<example system="consumer" screen="dashboard">

**入力モック**: `system_01_consumer/wip/mocks/03_dashboard.html`

**出力コンポーネント**:

```tsx
// apps/web/src/components/consumer/Dashboard/index.tsx

'use client';

import { useTranslations } from 'next-intl';
import { Lock, Unlock, Clock, Shield } from 'lucide-react';
import { StatCard } from '@/components/common/StatCard';
import { TransactionList } from './TransactionList';
import styles from './Dashboard.module.css';

export const Dashboard = () => {
  const t = useTranslations('consumer.dashboard');

  return (
    <main className={styles.container} role="main">
      <header className={styles.header}>
        <h1 className={styles.title}>{t('title')}</h1>
        <p className={styles.subtitle}>{t('subtitle')}</p>
      </header>

      <section
        className={styles.stats}
        aria-label={t('stats.ariaLabel')}
      >
        <StatCard
          icon={<Lock />}
          label={t('stats.totalLocked')}
          value="1,234.56 ETH"
          trend="+12.5%"
        />
        <StatCard
          icon={<Shield />}
          label={t('stats.quantumProtected')}
          value="100%"
          variant="success"
        />
        <StatCard
          icon={<Clock />}
          label={t('stats.avgLockTime')}
          value="45 days"
        />
      </section>

      <section className={styles.actions}>
        <button
          className={styles.primaryButton}
          aria-label={t('lockButton.ariaLabel')}
        >
          <Lock size={20} />
          {t('lockButton.text')}
        </button>
        <button
          className={styles.secondaryButton}
          aria-label={t('unlockButton.ariaLabel')}
        >
          <Unlock size={20} />
          {t('unlockButton.text')}
        </button>
      </section>

      <TransactionList />
    </main>
  );
};
```

```json
// locales/ja/consumer.json
{
  "dashboard": {
    "title": "ダッシュボード",
    "subtitle": "あなたの資産を量子耐性で保護",
    "stats": {
      "ariaLabel": "資産統計",
      "totalLocked": "ロック中",
      "quantumProtected": "量子耐性保護",
      "avgLockTime": "平均ロック期間"
    },
    "lockButton": {
      "text": "ロックする",
      "ariaLabel": "新しい資産をロックする"
    },
    "unlockButton": {
      "text": "アンロックする",
      "ariaLabel": "ロック中の資産をアンロックする"
    }
  }
}
```

</example>

---

## 9. Troubleshooting

### Q: モックにないインタラクションはどうする？
A: `SEQUENCES.md` を参照して仕様に基づき実装。不明な場合は `02_spec.md` で仕様確認。

### Q: デザインシステムにないコンポーネントは？
A: 共通コンポーネントとして新規作成。`UI_DESIGN_GUIDELINES.md` のルールに従う。

### Q: APIがまだない場合は？
A: UIのみ先行実装。API連携は `34_api_impl.md` で後から追加。ただしモックデータ返却は禁止。

### Q: テストが失敗する場合は？
A: `24_sandbox_execute.md` でサンドボックス実行してデバッグ。

---

**END OF PROMPT**
