# 30_ui_impl.md - UI Implementation Prompt
## Phase 6: モックからReactコンポーネントへの実装

> **Version**: 2.0
> **Date**: 2026-01-14
> **Purpose**: Phase 4 HTMLモック → React/Next.js/Tailwind実装
> **Structure**: Anthropic Claude 4.x XML Best Practices準拠

---

## 1. Overview

<purpose>
Phase 4で作成されたHTMLモックを、本番品質のReact/Next.js/Tailwindコンポーネントに変換する。
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
    <purpose>デザインコンセプト参照（CSS Variables → Tailwind変換表を使用）</purpose>
  </design_sheet>

  <tailwind_config priority="MUST_READ">
    <path>apps/web/tailwind.config.ts</path>
    <purpose>Tailwind設定（カスタムカラー・スペーシング定義）</purpose>
  </tailwind_config>

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

## 3. CSS Variables → Tailwind 変換表

デザインシート(`design-concept-5-japan-premium.html`)のCSS VariablesをTailwindクラスに変換する際は以下を参照：

### 3.1 背景色

| CSS Variable | Tailwind Class |
|--------------|----------------|
| `--bg-primary: #0a0a0c` | `bg-background` |
| `--bg-secondary: #111114` | `bg-background-secondary` |
| `--bg-elevated: #18181c` | `bg-background-tertiary` |
| `--bg-card: #0e0e11` | `bg-surface` |

### 3.2 アクセントカラー

| CSS Variable | Tailwind Class |
|--------------|----------------|
| `--accent-hinomaru: #bc002d` | `bg-hinomaru`, `text-hinomaru`, `border-hinomaru` |
| `--accent-hinomaru-light: #e8334d` | `bg-hinomaru-400` |
| `--accent-gold: #c9a962` | `bg-gold`, `text-gold`, `border-gold` |

### 3.3 テキスト

| CSS Variable | Tailwind Class |
|--------------|----------------|
| `--text-primary: #f8f8fa` | `text-foreground` |
| `--text-secondary: #9898a0` | `text-foreground-secondary` |
| `--text-tertiary: #606068` | `text-foreground-tertiary` |

### 3.4 ボーダー・角丸

| CSS Variable | Tailwind Class |
|--------------|----------------|
| `--border-default` | `border-surface-tertiary` |
| `--radius-sm: 6px` | `rounded-md` |
| `--radius-md: 10px` | `rounded-lg` |
| `--radius-lg: 14px` | `rounded-xl` |
| `--radius-xl: 20px` | `rounded-2xl` |

### 3.5 スペーシング

| CSS Variable | Tailwind Class |
|--------------|----------------|
| `--space-xs: 4px` | `p-1`, `m-1`, `gap-1` |
| `--space-sm: 8px` | `p-2`, `m-2`, `gap-2` |
| `--space-md: 16px` | `p-4`, `m-4`, `gap-4` |
| `--space-lg: 24px` | `p-6`, `m-6`, `gap-6` |
| `--space-xl: 32px` | `p-8`, `m-8`, `gap-8` |

---

## 4. Session Variables

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

## 5. Implementation Process

### STEP 1: モック分析

<thinking_guidance>
モック分析時に以下を確認:
1. HTML構造とコンポーネント境界
2. CSS Variables → Tailwindクラス変換（上記変換表使用）
3. インタラクション定義（コメント内）
4. 日本語テキスト（i18nキー化対象）
5. アイコン（Lucide Icons使用）
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

### Tailwindクラス変換メモ
| モックのCSS | 変換後Tailwindクラス |
|------------|---------------------|
| `background: var(--bg-card)` | `bg-surface` |
| `color: var(--accent-hinomaru)` | `text-hinomaru` |
| `border-radius: var(--radius-lg)` | `rounded-xl` |
```

### STEP 2: コンポーネント設計

<component_structure>
```
apps/web/src/
├── components/
│   ├── ui/                     # shadcn/ui共通コンポーネント
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   └── ...
│   │
│   └── {system}/               # システム固有
│       ├── {Component}.tsx
│       └── {Component}.stories.tsx
│
├── app/
│   └── [locale]/               # ← i18nルート（必須）
│       └── {system}/
│           └── {page}/
│               └── page.tsx
│
└── locales/                    # ← srcの外（apps/web/locales/）
    ├── ja/
    │   └── {system}.json
    └── en/
        └── {system}.json
```
</component_structure>

**重要**: パスは必ず `[locale]` を含む。
- ✅ `apps/web/src/app/[locale]/consumer/dashboard/page.tsx`
- ❌ `apps/web/src/app/consumer/dashboard/page.tsx`

### STEP 3: コンポーネント実装

<implementation_rules>
  <rule id="R1" priority="CRITICAL">
    全テキストはi18nキー経由。ハードコード禁止。
    使用: useTranslations('namespace') または getTranslations()
  </rule>
  <rule id="R2" priority="CRITICAL">
    Tailwindクラスを直接使用。CSS Modulesは使わない。
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

#### 実装テンプレート（Server Component）

```tsx
// apps/web/src/app/[locale]/{system}/{screen}/page.tsx

import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { {Component} } from '@/components/{system}/{Component}';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: '{system}.{screen}.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function {Screen}Page({ params }: PageProps) {
  return <{Component} />;
}
```

#### 実装テンプレート（Client Component）

```tsx
// apps/web/src/components/{system}/{Component}.tsx

'use client';

import { useTranslations } from 'next-intl';
import { Lock, Unlock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface {Component}Props {
  // Props定義
}

export function {Component}({ ...props }: {Component}Props) {
  const t = useTranslations('{system}.{component}');

  return (
    <main
      className="min-h-screen bg-background p-6"
      role="main"
      aria-label={t('ariaLabel')}
    >
      <h1 className="text-3xl font-bold text-foreground mb-6">
        {t('title')}
      </h1>

      <Card className="bg-surface border-surface-tertiary">
        <CardHeader>
          <CardTitle className="text-foreground">{t('cardTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          {/* 実装 */}
        </CardContent>
      </Card>

      <div className="flex gap-4 mt-6">
        <Button
          className="bg-hinomaru hover:bg-hinomaru-600 text-white"
          aria-label={t('lockButton.ariaLabel')}
        >
          <Lock className="mr-2 h-4 w-4" />
          {t('lockButton.text')}
        </Button>
      </div>
    </main>
  );
}
```

### STEP 4: i18n対応

翻訳ファイルの配置: `apps/web/locales/{locale}/{system}.json`

```json
// apps/web/locales/ja/consumer.json
{
  "dashboard": {
    "meta": {
      "title": "ダッシュボード | Quantum Shield",
      "description": "あなたの資産を量子耐性で保護"
    },
    "title": "ダッシュボード",
    "ariaLabel": "メインダッシュボード",
    "cardTitle": "資産概要",
    "lockButton": {
      "text": "ロックする",
      "ariaLabel": "新しい資産をロックする"
    },
    "stats": {
      "totalLocked": "ロック中",
      "available": "利用可能"
    }
  }
}
```

```json
// apps/web/locales/en/consumer.json
{
  "dashboard": {
    "meta": {
      "title": "Dashboard | Quantum Shield",
      "description": "Protect your assets with quantum resistance"
    },
    "title": "Dashboard",
    "ariaLabel": "Main Dashboard",
    "cardTitle": "Asset Overview",
    "lockButton": {
      "text": "Lock",
      "ariaLabel": "Lock new assets"
    },
    "stats": {
      "totalLocked": "Total Locked",
      "available": "Available"
    }
  }
}
```

### STEP 5: Storybook作成

```tsx
// apps/web/src/components/{system}/{Component}.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import { {Component} } from './{Component}';

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
  args: {},
};

export const Loading: Story = {
  args: {
    isLoading: true,
  },
};

export const Mobile: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};
```

---

## 6. Quality Checklist

### 6.1 実装チェックリスト

<checklist>
  <category name="Tailwind">
    <item>デザインシートのCSS Variables → Tailwindクラス変換完了</item>
    <item>カスタムカラー（hinomaru, gold等）はtailwind.config.ts定義を使用</item>
    <item>レスポンシブクラス（sm:, md:, lg:）適用</item>
  </category>

  <category name="i18n">
    <item>全テキストがt()経由</item>
    <item>日本語翻訳ファイル作成（apps/web/locales/ja/）</item>
    <item>英語翻訳ファイル作成（apps/web/locales/en/）</item>
    <item>日付・数値フォーマット対応</item>
  </category>

  <category name="Accessibility">
    <item>aria-label設定</item>
    <item>role属性設定</item>
    <item>キーボードナビゲーション</item>
    <item>コントラスト比4.5:1以上</item>
    <item>focus-visible対応</item>
  </category>

  <category name="Path">
    <item>ページは [locale] ルート内に配置</item>
    <item>翻訳ファイルは apps/web/locales/ に配置</item>
    <item>コンポーネントは src/components/{system}/ に配置</item>
  </category>
</checklist>

---

## 7. Output

### 7.1 成果物

```
apps/web/
├── src/
│   ├── app/
│   │   └── [locale]/
│   │       └── {system}/
│   │           └── {screen}/
│   │               └── page.tsx      # ページコンポーネント
│   │
│   └── components/
│       └── {system}/
│           ├── {Component}.tsx       # UIコンポーネント
│           └── {Component}.stories.tsx # Storybook
│
└── locales/
    ├── ja/{system}.json              # 日本語翻訳
    └── en/{system}.json              # 英語翻訳
```

### 7.2 実装レポート

```markdown
## UI Implementation Report

### 対象
- System: {SYSTEM_NAME}
- Screen: {SCREEN_FILE}
- Component: {COMPONENT_NAME}

### 成果物
| ファイル | パス | ステータス |
|---------|------|:--------:|
| Page | apps/web/src/app/[locale]/{system}/{screen}/page.tsx | ✅ |
| Component | apps/web/src/components/{system}/{Component}.tsx | ✅ |
| Story | apps/web/src/components/{system}/{Component}.stories.tsx | ✅ |
| i18n (ja) | apps/web/locales/ja/{system}.json | ✅ |
| i18n (en) | apps/web/locales/en/{system}.json | ✅ |

### i18nキー数
- 日本語: [N]キー
- 英語: [N]キー

### 次のステップ
→ 31_design_pir.md でペルソナレビュー
```

---

## 8. Next Steps

### 8.1 レビューフロー

```
30_ui_impl.md (実装)
      ↓
31_design_pir.md (ペルソナレビュー)
      ↓
[PASS] → 次の画面へ
[CONDITIONAL] → 軽微修正後次へ
[FAIL] → 修正後再レビュー
```

### 8.2 API連携

UI実装完了後、`34_api_impl.md` でAPI連携を実装:

```tsx
// API連携追加例
import { useLockMutation } from '@/hooks/useLock';

export function Dashboard() {
  const { mutate: lock, isPending } = useLockMutation();

  const handleLock = () => {
    lock({ amount, duration });
  };

  // ...
}
```

---

## 9. Troubleshooting

### Q: モックにないインタラクションはどうする？
A: `SEQUENCES.md` を参照して仕様に基づき実装。不明な場合は `02_spec.md` で仕様確認。

### Q: Tailwindにないカスタムカラーは？
A: `tailwind.config.ts` に追加定義してから使用。

### Q: APIがまだない場合は？
A: UIのみ先行実装。API連携は `34_api_impl.md` で後から追加。ただしモックデータ返却は禁止。

### Q: 翻訳キーが見つからないエラー？
A: 翻訳ファイル（`apps/web/locales/{locale}/{system}.json`）に該当キーを追加。

---

**END OF PROMPT**
