# Phase 8-A: Screen Implementation Prompt

> **Version**: 1.0
> **Trigger**: `Phase 8-A 開始` or `Phase 8-A {screen} 実装`
> **前提**: Phase 8 Orchestrator初期化完了

---

## Overview

QS Admin管理画面38画面のReact実装を行うフェーズ。

```
Input:  HTMLモック（docs/design/mocks/qs-admin/）
Output: React Component + i18n + Storybook
Gate:   TypeScript/ESLint/Storybook ビルド成功
```

---

## 対象画面一覧

### Priority 0（最優先: 11画面）

| # | Screen | URL | Mock File |
|---|--------|-----|-----------|
| 01 | Dashboard | `/qs-admin/dashboard` | `01-dashboard.html` |
| 02 | Transactions Dashboard | `/qs-admin/transactions` | `02-transactions-dashboard.html` |
| 03 | Transactions - Lock | `/qs-admin/transactions/lock` | `02-transactions-lock.html` |
| 04 | Transactions - Unlock | `/qs-admin/transactions/unlock` | `02-transactions-unlock.html` |
| 05 | Transactions - Emergency | `/qs-admin/transactions/emergency` | `02-transactions-emergency.html` |
| 06 | Transactions - Challenge | `/qs-admin/transactions/challenge` | `02-transactions-challenge.html` |
| 07 | Treasury Dashboard | `/qs-admin/treasury` | `12-treasury-dashboard.html` |
| 08 | Treasury Wallets | `/qs-admin/treasury/wallets` | `12-treasury-wallets.html` |
| 09 | Treasury Transfers | `/qs-admin/treasury/transfers` | `12-treasury-transfers.html` |
| 10 | Treasury Budget | `/qs-admin/treasury/budget` | `12-treasury-budget.html` |
| 11 | Treasury Audit | `/qs-admin/treasury/audit` | `12-treasury-audit.html` |

### Priority 1（9画面）

| # | Screen | URL | Mock File |
|---|--------|-----|-----------|
| 12 | Users Dashboard | `/qs-admin/users` | `03-users-dashboard.html` |
| 13 | Users List | `/qs-admin/users/list` | `03-users-list.html` |
| 14 | Users Wallets | `/qs-admin/users/wallets` | `03-users-wallets.html` |
| 15 | User Detail | `/qs-admin/users/[id]` | `03-users-detail.html` |
| 16 | Prover Dashboard | `/qs-admin/prover` | `04-prover-dashboard.html` |
| 17 | Prover Requests | `/qs-admin/prover/requests` | `04-prover-requests.html` |
| 18 | Prover List | `/qs-admin/prover/list` | `04-prover-list.html` |
| 19 | Observer Dashboard | `/qs-admin/observer` | `05-observer-dashboard.html` |
| 20 | Observer List | `/qs-admin/observer/list` | `05-observer-list.html` |

### Priority 2-3（18画面）

| # | Screen | URL | Mock File |
|---|--------|-----|-----------|
| 21 | Governance Dashboard | `/qs-admin/governance` | `06-governance-dashboard.html` |
| 22 | Governance Proposals | `/qs-admin/governance/proposals` | `06-governance-proposals.html` |
| 23 | Governance Voting | `/qs-admin/governance/voting` | `06-governance-voting.html` |
| 24 | Members List | `/qs-admin/members` | `07-members-list.html` |
| 25 | Members Roles | `/qs-admin/members/roles` | `07-members-roles.html` |
| 26 | Support Dashboard | `/qs-admin/support` | `08-support-dashboard.html` |
| 27 | Support Tickets | `/qs-admin/support/tickets` | `08-support-tickets.html` |
| 28 | Support FAQ | `/qs-admin/support/faq` | `08-support-faq.html` |
| 29 | Announcements List | `/qs-admin/announcements` | `09-announcements-list.html` |
| 30 | Announcements Edit | `/qs-admin/announcements/edit` | `09-announcements-edit.html` |
| 31 | Analytics Overview | `/qs-admin/analytics` | `10-analytics-overview.html` |
| 32 | Analytics Users | `/qs-admin/analytics/users` | `10-analytics-users.html` |
| 33 | Analytics Revenue | `/qs-admin/analytics/revenue` | `10-analytics-revenue.html` |
| 34 | Analytics Reports | `/qs-admin/analytics/reports` | `10-analytics-reports.html` |
| 35 | System Settings | `/qs-admin/system` | `11-system-settings.html` |
| 36 | System Alerts | `/qs-admin/system/alerts` | `11-system-alerts.html` |
| 37 | System Logs | `/qs-admin/system/logs` | `11-system-logs.html` |
| 38 | System Maintenance | `/qs-admin/system/maintenance` | `11-system-maintenance.html` |

---

## 実装パイプライン（1画面あたり）

```
┌─────────────────────────────────────────────────────────────────┐
│  Screen Implementation Pipeline                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  STEP 1: モック確認                                             │
│  ├─→ HTMLモックファイル存在確認                                │
│  ├─→ なければ作成（QS_ADMIN_DESIGN_PLAN.md参照）              │
│  └─→ デザインシステム準拠確認                                  │
│                                                                 │
│  STEP 2: React Component作成                                    │
│  ├─→ ファイル作成: apps/web/src/app/[locale]/qs-admin/{path}  │
│  ├─→ TypeScript + Tailwind CSS                                 │
│  ├─→ クライアントコンポーネント（'use client'）               │
│  └─→ コンポーネント分割（必要に応じて）                       │
│                                                                 │
│  STEP 3: i18n対応                                               │
│  ├─→ locales/ja/qs-admin.json にキー追加                       │
│  ├─→ locales/en/qs-admin.json にキー追加                       │
│  └─→ useTranslations('qsAdmin') 使用                           │
│                                                                 │
│  STEP 4: Storybook登録                                          │
│  ├─→ components/qs-admin/{Component}.stories.tsx               │
│  └─→ 各状態のStory定義                                         │
│                                                                 │
│  STEP 5: 検証                                                   │
│  ├─→ TypeScriptコンパイル                                      │
│  ├─→ ESLint                                                    │
│  └─→ ブラウザ表示確認                                          │
│                                                                 │
│  STEP 6: 進捗更新                                               │
│  └─→ PHASE8_PROGRESS.md 更新                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## コードテンプレート

### Page Component

```tsx
// apps/web/src/app/[locale]/qs-admin/{category}/page.tsx
'use client';

import { useTranslations } from 'next-intl';
import { QSAdminLayout } from '@/components/qs-admin/Layout';
import { {Component} } from '@/components/qs-admin/{Component}';

export default function {PageName}Page() {
  const t = useTranslations('qsAdmin');

  return (
    <QSAdminLayout>
      <{Component} />
    </QSAdminLayout>
  );
}
```

### Component

```tsx
// apps/web/src/components/qs-admin/{Component}/index.tsx
'use client';

import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface {Component}Props {
  // props definition
}

export function {Component}({ ...props }: {Component}Props) {
  const t = useTranslations('qsAdmin.{section}');

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">
          {t('title')}
        </h1>
      </header>

      <Card className="p-6">
        {/* Content */}
      </Card>
    </div>
  );
}
```

### i18n Keys

```json
// locales/ja/qs-admin.json
{
  "dashboard": {
    "title": "ダッシュボード",
    "stats": {
      "totalUsers": "総ユーザー数",
      "totalLocks": "総ロック数",
      "totalVolume": "総ボリューム"
    }
  },
  "transactions": {
    "title": "トランザクション",
    "filters": {
      "all": "すべて",
      "lock": "ロック",
      "unlock": "アンロック"
    }
  }
}
```

### Storybook

```tsx
// components/qs-admin/{Component}.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { {Component} } from '.';

const meta: Meta<typeof {Component}> = {
  title: 'QS Admin/{Component}',
  component: {Component},
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

export const Empty: Story = {
  args: {
    data: [],
  },
};
```

---

## QS Admin専用コンポーネント

### Layout Component

```tsx
// components/qs-admin/Layout/index.tsx
'use client';

import { useTranslations } from 'next-intl';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface QSAdminLayoutProps {
  children: React.ReactNode;
}

export function QSAdminLayout({ children }: QSAdminLayoutProps) {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
```

### Sidebar Navigation

```tsx
const navigation = [
  { name: 'dashboard', href: '/qs-admin/dashboard', icon: HomeIcon },
  { name: 'transactions', href: '/qs-admin/transactions', icon: ArrowsIcon },
  { name: 'users', href: '/qs-admin/users', icon: UsersIcon },
  { name: 'prover', href: '/qs-admin/prover', icon: ServerIcon },
  { name: 'observer', href: '/qs-admin/observer', icon: EyeIcon },
  { name: 'governance', href: '/qs-admin/governance', icon: ScaleIcon },
  { name: 'treasury', href: '/qs-admin/treasury', icon: BankIcon },
  { name: 'members', href: '/qs-admin/members', icon: BadgeIcon },
  { name: 'support', href: '/qs-admin/support', icon: LifebuoyIcon },
  { name: 'announcements', href: '/qs-admin/announcements', icon: MegaphoneIcon },
  { name: 'analytics', href: '/qs-admin/analytics', icon: ChartIcon },
  { name: 'system', href: '/qs-admin/system', icon: CogIcon },
];
```

---

## 完了レポートテンプレート

```markdown
## Screen Implementation Report: {screen_name}

### 実装情報
- 画面: {screen_name}
- URL: /qs-admin/{path}
- 実装日時: {timestamp}

### 成果物
- [x] Page: `apps/web/src/app/[locale]/qs-admin/{path}/page.tsx`
- [x] Component: `apps/web/src/components/qs-admin/{Component}/index.tsx`
- [x] i18n (ja): {key_count}キー追加
- [x] i18n (en): {key_count}キー追加
- [x] Storybook: {story_count}ストーリー

### 検証結果
| Check | Status |
|-------|:------:|
| TypeScript | ✅/❌ |
| ESLint | ✅/❌ |
| ブラウザ表示 | ✅/❌ |

### 次の画面
→ {next_screen_name}
```

---

## Critical Rules

```xml
<rule id="8A-001" level="ABSOLUTE">
  全画面は [locale] ルート配下に配置。
  ✅ apps/web/src/app/[locale]/qs-admin/dashboard/page.tsx
  ❌ apps/web/src/app/qs-admin/dashboard/page.tsx
</rule>

<rule id="8A-002" level="ABSOLUTE">
  全テキストは t('key') 経由。ハードコード禁止。
</rule>

<rule id="8A-003" level="ABSOLUTE">
  Tailwindクラスは tailwind.config.ts で定義済みのもののみ使用。
</rule>

<rule id="8A-004" level="ABSOLUTE">
  実装完了時は必ず PHASE8_PROGRESS.md を更新。
</rule>
```

---

**Document End**
