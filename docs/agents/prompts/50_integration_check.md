# 50_integration_check.md - Frontend-Backend Integration Prompt

> **Version**: 2.0
> **Updated**: 2026-01-31
> **Purpose**: フロントエンド-バックエンド統合の実装・テスト・検証

---

## Overview

Quantum Shieldの11フロントエンドアプリとRustバックエンドを統合するための実行プロンプト。
実装 → テスト → 検証の完全なサイクルをサポート。

## Trigger Commands

```
# ===== 統合実装（メインコマンド）=====
統合開始                    ← 次の未統合アプリから自動開始（★推奨）
統合開始 {app}              ← 特定アプリの統合を開始
統合開始 {app} {screen}     ← 特定画面の統合を開始

# ===== 統合テスト =====
統合テスト {app}            ← 特定アプリの統合テストを実行
統合テスト 全アプリ         ← 全アプリの統合テストを実行

# ===== 進捗確認 =====
統合進捗確認                ← 全アプリの統合状況サマリー
統合進捗確認 {app}          ← 特定アプリの詳細状況

# アプリ一覧:
# qs-admin, consumer, prover, observer, explorer,
# governance, token-hub, qs-hub, enterprise
```

---

## Phase 0: 初期化（トリガー検出時に必ず実行）

### 0.1 必須ファイル読み込み

```
READ PARALLEL:
├── docs/integration/FRONTEND_BACKEND_INTEGRATION.md  ← 統合計画
├── docs/integration/INTEGRATION_PROGRESS.md          ← 進捗トラッカー
├── docs/specs/DATA_MODEL.md                          ← データモデル
└── docs/specs/API_SPECIFICATION.yaml                 ← APIエンドポイント
```

### 0.2 初期化完了報告

```markdown
## 統合作業 初期化完了

### 読み込んだファイル
- 統合計画: FRONTEND_BACKEND_INTEGRATION.md ✅
- 進捗: INTEGRATION_PROGRESS.md ✅
- データモデル: DATA_MODEL.md ✅

### 現在の統合状況
- 統合済みアプリ: {n}/9
- 次の対象: {app_name}
- 優先度: {priority}

→ 統合を開始します
```

---

## Phase 1: 「統合開始 {app}」実行フロー

### 1.1 統合パイプライン（6ステップ）

```
┌─────────────────────────────────────────────────────────────────────┐
│  INTEGRATION PIPELINE - 6 STEPS                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ STEP 1: インフラ作成                                          │   │
│  │ ─────────────────────────────────────────────────────────────│   │
│  │ Action: API Types, Client, Mock, Hooks の作成                │   │
│  │ Output:                                                       │   │
│  │   - lib/api/{app}/types.ts                                   │   │
│  │   - lib/api/{app}/client.ts                                  │   │
│  │   - lib/api/{app}/mock.ts                                    │   │
│  │   - hooks/{app}/*.ts                                         │   │
│  │ Gate: TypeScriptコンパイル成功                                │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              ↓                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ STEP 2: コンポーネント統合                                    │   │
│  │ ─────────────────────────────────────────────────────────────│   │
│  │ Action: DEMO_* を useQuery フックに置き換え                  │   │
│  │ Pattern:                                                      │   │
│  │   // Before                                                   │   │
│  │   const DEMO_DATA = [...];                                   │   │
│  │   return <List data={DEMO_DATA} />;                          │   │
│  │                                                               │   │
│  │   // After                                                    │   │
│  │   const { data, isLoading } = useFeatureData();              │   │
│  │   if (isLoading) return <Skeleton />;                        │   │
│  │   return <List data={data} />;                               │   │
│  │ Gate: DEMO_* 使用数 = 0                                       │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              ↓                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ STEP 3: Loading/Error State 実装                              │   │
│  │ ─────────────────────────────────────────────────────────────│   │
│  │ Action: ローディング・エラー状態のUI追加                     │   │
│  │ Required:                                                     │   │
│  │   - Skeleton コンポーネント（ローディング中）                │   │
│  │   - ErrorBoundary / エラー表示（API失敗時）                  │   │
│  │   - Empty State（データなし時）                              │   │
│  │ Gate: 3状態すべて実装済み                                    │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              ↓                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ STEP 4: 統合テスト作成                                        │   │
│  │ ─────────────────────────────────────────────────────────────│   │
│  │ Action: API統合のテストを作成                                │   │
│  │ Output: e2e/{app}/integration.spec.ts                        │   │
│  │ Coverage:                                                     │   │
│  │   - API呼び出し成功時の表示                                  │   │
│  │   - API呼び出し失敗時のエラー表示                            │   │
│  │   - ローディング状態の表示                                   │   │
│  │ Gate: テストファイル存在                                     │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              ↓                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ STEP 5: テスト実行                                            │   │
│  │ ─────────────────────────────────────────────────────────────│   │
│  │ Action: 統合テストを実行                                     │   │
│  │ Command:                                                      │   │
│  │   cd apps/web                                                │   │
│  │   pnpm test:integration {app}                                │   │
│  │   # または                                                    │   │
│  │   npx playwright test e2e/{app}/integration.spec.ts          │   │
│  │ Gate: 全テストPASS                                           │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              ↓                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ STEP 6: 進捗更新 + 完了報告                                   │   │
│  │ ─────────────────────────────────────────────────────────────│   │
│  │ Action: INTEGRATION_PROGRESS.md を更新                       │   │
│  │ Report: 完了レポート出力                                     │   │
│  │ Gate: 進捗ファイル更新完了                                   │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Phase 2: STEP 1 インフラ作成詳細

### 2.1 API Types テンプレート

```typescript
// lib/api/{app}/types.ts

/**
 * {App Name} API Types
 *
 * バックエンドAPIレスポンスの型定義
 */

// ============= Entity Types =============

export interface {Entity}Item {
  id: string;
  // ... fields from DATA_MODEL.md
}

// ============= Request Types =============

export interface {Feature}Request {
  // ... request body fields
}

// ============= Response Types =============

export interface {Feature}Response {
  data: {Entity}Item[];
  total: number;
  page: number;
  limit: number;
}

// ============= Pagination =============

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
```

### 2.2 API Client テンプレート

```typescript
// lib/api/{app}/client.ts

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

class {App}ApiClient {
  private accessToken: string | null = null;

  setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  private async request<T>(
    method: string,
    endpoint: string,
    body?: unknown
  ): Promise<T> {
    const url = `${API_BASE}${endpoint}`;

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(this.accessToken && { Authorization: `Bearer ${this.accessToken}` }),
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(error.message || 'API request failed');
    }

    return res.json();
  }

  async get<T>(endpoint: string, params?: Record<string, unknown>): Promise<T> {
    const url = new URL(`${API_BASE}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined) url.searchParams.set(k, String(v));
      });
    }
    return this.request<T>('GET', url.pathname + url.search);
  }

  async post<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>('POST', endpoint, body);
  }

  async put<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>('PUT', endpoint, body);
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>('DELETE', endpoint);
  }
}

export const {app}Api = new {App}ApiClient();
```

### 2.3 React Query Hook テンプレート

```typescript
// hooks/{app}/use{Feature}.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { {app}Api } from '@/lib/api/{app}/client';
import type { {Feature}Response, {Feature}Request } from '@/lib/api/{app}/types';

// Query keys factory
export const {feature}Keys = {
  all: ['{app}', '{feature}'] as const,
  list: (params?: unknown) => [...{feature}Keys.all, 'list', params] as const,
  detail: (id: string) => [...{feature}Keys.all, 'detail', id] as const,
};

// List query
export function use{Feature}List(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: {feature}Keys.list(params),
    queryFn: () => {app}Api.get<{Feature}Response>('/api/{app}/{feature}', params),
    staleTime: 30_000,
  });
}

// Detail query
export function use{Feature}Detail(id: string) {
  return useQuery({
    queryKey: {feature}Keys.detail(id),
    queryFn: () => {app}Api.get<{Feature}Item>(`/api/{app}/{feature}/${id}`),
    enabled: !!id,
  });
}

// Create mutation
export function useCreate{Feature}() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {Feature}Request) =>
      {app}Api.post<{Feature}Item>('/api/{app}/{feature}', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: {feature}Keys.all });
    },
  });
}

// Update mutation
export function useUpdate{Feature}() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<{Feature}Request> }) =>
      {app}Api.put<{Feature}Item>(`/api/{app}/{feature}/${id}`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: {feature}Keys.detail(id) });
      queryClient.invalidateQueries({ queryKey: {feature}Keys.list() });
    },
  });
}

// Delete mutation
export function useDelete{Feature}() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => {app}Api.delete(`/api/{app}/{feature}/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: {feature}Keys.all });
    },
  });
}
```

---

## Phase 3: STEP 2 コンポーネント統合詳細

### 3.1 統合パターン

```typescript
// ============= Before (Mock Data) =============

const DEMO_ITEMS = [
  { id: '1', name: 'Item 1', value: 100 },
  { id: '2', name: 'Item 2', value: 200 },
];

export function FeatureList() {
  return (
    <div>
      {DEMO_ITEMS.map(item => (
        <Card key={item.id}>
          <p>{item.name}</p>
          <p>{item.value}</p>
        </Card>
      ))}
    </div>
  );
}

// ============= After (API Integration) =============

import { useFeatureList } from '@/hooks/{app}/useFeature';
import { FeatureListSkeleton } from './FeatureListSkeleton';
import { ErrorState } from '@/components/shared/ErrorState';
import { EmptyState } from '@/components/shared/EmptyState';

export function FeatureList() {
  const { data, isLoading, error, refetch } = useFeatureList();

  // Loading state
  if (isLoading) {
    return <FeatureListSkeleton />;
  }

  // Error state
  if (error) {
    return (
      <ErrorState
        message={error.message}
        onRetry={refetch}
      />
    );
  }

  // Empty state
  if (!data?.items?.length) {
    return <EmptyState message="データがありません" />;
  }

  // Success state
  return (
    <div>
      {data.items.map(item => (
        <Card key={item.id}>
          <p>{item.name}</p>
          <p>{item.value}</p>
        </Card>
      ))}
    </div>
  );
}
```

### 3.2 Skeleton コンポーネント

```typescript
// components/{app}/FeatureListSkeleton.tsx

export function FeatureListSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="h-4 bg-muted rounded w-3/4 mb-2" />
          <div className="h-4 bg-muted rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}
```

### 3.3 Error/Empty State

```typescript
// components/shared/ErrorState.tsx

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="text-center py-8">
      <p className="text-red-500 mb-4">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline">
          再試行
        </Button>
      )}
    </div>
  );
}

// components/shared/EmptyState.tsx

interface EmptyStateProps {
  message: string;
  action?: React.ReactNode;
}

export function EmptyState({ message, action }: EmptyStateProps) {
  return (
    <div className="text-center py-8">
      <p className="text-muted-foreground mb-4">{message}</p>
      {action}
    </div>
  );
}
```

---

## Phase 4: STEP 4 統合テスト作成

### 4.1 テストテンプレート

```typescript
// e2e/{app}/integration.spec.ts

import { test, expect } from '@playwright/test';

test.describe('{App} Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API response for consistent testing
    await page.route('**/api/{app}/**', async (route) => {
      const url = route.request().url();

      if (url.includes('/api/{app}/feature')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            items: [
              { id: '1', name: 'Test Item 1', value: 100 },
              { id: '2', name: 'Test Item 2', value: 200 },
            ],
            total: 2,
          }),
        });
      } else {
        await route.continue();
      }
    });
  });

  test('displays data from API', async ({ page }) => {
    await page.goto('/ja/{app}/feature');

    // Wait for data to load
    await expect(page.getByText('Test Item 1')).toBeVisible();
    await expect(page.getByText('Test Item 2')).toBeVisible();
  });

  test('shows loading state', async ({ page }) => {
    // Delay API response
    await page.route('**/api/{app}/feature', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ items: [], total: 0 }),
      });
    });

    await page.goto('/ja/{app}/feature');

    // Check for skeleton/loading indicator
    await expect(page.locator('.animate-pulse').first()).toBeVisible();
  });

  test('shows error state on API failure', async ({ page }) => {
    await page.route('**/api/{app}/feature', async (route) => {
      await route.fulfill({
        status: 500,
        body: JSON.stringify({ message: 'Server error' }),
      });
    });

    await page.goto('/ja/{app}/feature');

    // Check for error message
    await expect(page.getByText(/error|エラー/i)).toBeVisible();
  });

  test('shows empty state when no data', async ({ page }) => {
    await page.route('**/api/{app}/feature', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ items: [], total: 0 }),
      });
    });

    await page.goto('/ja/{app}/feature');

    // Check for empty state message
    await expect(page.getByText(/データがありません|no data/i)).toBeVisible();
  });
});
```

---

## Phase 5: 完了報告テンプレート

### 5.1 アプリ統合完了レポート

```markdown
## 統合完了レポート: {App Name}

### 1. 実装サマリー
| ステップ | 成果物 | ステータス |
|:--------:|--------|:----------:|
| 1 | API Types | ✅ |
| 2 | API Client | ✅ |
| 3 | React Hooks | ✅ |
| 4 | コンポーネント更新 | ✅ ({n}/{total} 完了) |
| 5 | Loading/Error State | ✅ |
| 6 | 統合テスト | ✅ ({n} テスト) |

### 2. 作成ファイル
```
lib/api/{app}/
├── types.ts       ({n} types)
├── client.ts      ({n} methods)
└── mock.ts        ({n} mock items)

hooks/{app}/
├── useFeature1.ts
├── useFeature2.ts
└── ...

e2e/{app}/
└── integration.spec.ts ({n} tests)
```

### 3. 統合済みコンポーネント
| # | Component | Before | After | Status |
|---|-----------|--------|-------|:------:|
| 1 | Dashboard | DEMO_STATS | useDashboardStats() | ✅ |
| 2 | FeatureList | DEMO_ITEMS | useFeatureList() | ✅ |
| ... | ... | ... | ... | ... |

### 4. テスト結果
```
✓ displays data from API (1.2s)
✓ shows loading state (0.8s)
✓ shows error state on API failure (0.5s)
✓ shows empty state when no data (0.4s)

4 passed (3.0s)
```

### 5. 残作業
- [ ] {remaining_task_1}
- [ ] {remaining_task_2}

### 6. 次のアプリ
→ {next_app_name} ({n} pages)
```

---

## Critical Rules

```xml
<rule id="INT-001" level="ABSOLUTE">
  DEMO_* が残っているコンポーネントは「未統合」。
  統合完了判定は DEMO_* 使用数 = 0 が条件。
</rule>

<rule id="INT-002" level="ABSOLUTE">
  Loading/Error/Empty の3状態は必須。
  1つでも欠けていたら統合未完了。
</rule>

<rule id="INT-003" level="ABSOLUTE">
  統合テストなしで統合完了とは認めない。
  最低4テスト（成功・ローディング・エラー・空）が必須。
</rule>

<rule id="INT-004" level="ABSOLUTE">
  進捗更新なしで次のアプリに進むことは禁止。
  INTEGRATION_PROGRESS.md を必ず更新。
</rule>

<rule id="INT-005" level="MUST">
  Types → Client → Hooks → Components の順で実装。
  この順序を守らないと依存エラーが発生する。
</rule>
```

---

## アプリ別エンドポイント一覧

### QS Admin (48 pages, 65 endpoints)
| Feature | Endpoint | Method |
|---------|----------|--------|
| Dashboard Stats | `/api/admin/dashboard/stats` | GET |
| Prover List | `/api/admin/provers` | GET |
| Observer List | `/api/admin/observers` | GET |
| Treasury Overview | `/api/admin/treasury/overview` | GET |
| ... | ... | ... |

### Consumer (28 pages)
| Feature | Endpoint | Method |
|---------|----------|--------|
| Create Lock | `/api/lock` | POST |
| Lock Status | `/api/lock/status/:id` | GET |
| Request Unlock | `/api/unlock/request` | POST |
| User Locks | `/api/user/locks` | GET |
| ... | ... | ... |

### Prover (13 pages)
| Feature | Endpoint | Method |
|---------|----------|--------|
| Apply | `/api/prover/apply` | POST |
| Dashboard | `/api/prover/me` | GET |
| Requests | `/api/prover/requests` | GET |
| ... | ... | ... |

(以下、各アプリのエンドポイント詳細は FRONTEND_BACKEND_INTEGRATION.md を参照)

---

## Related Documents

- [Frontend-Backend Integration Plan](../../integration/FRONTEND_BACKEND_INTEGRATION.md)
- [Integration Progress Tracker](../../integration/INTEGRATION_PROGRESS.md)
- [Data Model](../../specs/DATA_MODEL.md)
- [API Specification](../../specs/API_SPECIFICATION.yaml)

---

## Change Log

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-31 | 1.0 | Initial document (verification only) |
| 2026-01-31 | 2.0 | Full pipeline: 実装 + テスト + 検証 |
