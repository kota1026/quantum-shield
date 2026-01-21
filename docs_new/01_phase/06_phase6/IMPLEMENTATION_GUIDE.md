# Quantum Shield 実装ガイド

> **目的**: このドキュメント1つで全画面を実装できる状態にする
> **原則**: Lock機能検証で得た学びを全シーケンス・全画面に反映済み
> **更新日**: 2026-01-22

---

## 目次

1. [はじめに](#1-はじめに)
2. [実装前の必読事項](#2-実装前の必読事項)
   - 2.4 [Core Principles 準拠チェック](#24-core-principles-準拠チェックmust)
3. [共通実装パターン](#3-共通実装パターン)
   - 3.8 [セキュリティパターン](#38-セキュリティパターンmust)
   - 3.9 [エラーハンドリングパターン](#39-エラーハンドリングパターンmust)
   - 3.10 [型定義の場所](#310-型定義の場所must)
4. [Consumer App](#4-consumer-app)
5. [Token Hub](#5-token-hub)
6. [Governance](#6-governance)
7. [Prover Portal](#7-prover-portal)
8. [Observer](#8-observer)
9. [Explorer](#9-explorer)
10. [Enterprise Admin](#10-enterprise-admin)
11. [QS Admin](#11-qs-admin)

---

## 1. はじめに

### 1.1 このドキュメントの使い方

```
画面実装時の流れ:

1. このガイドの該当セクションを開く
2. 「画面仕様」でレイアウト・状態・バリデーションを確認
3. 「共通パターン」で実装方法を確認
4. コードを書く
5. チェックリストで漏れがないか確認
```

### 1.2 関連ドキュメント

| ドキュメント | 用途 | いつ参照？ |
|-------------|------|-----------|
| **本ドキュメント** | 画面実装の全て | 常に |
| [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) | 色・フォント・コンポーネント | スタイル迷った時 |
| [DATA_MODEL.md](./DATA_MODEL.md) | API型・エンティティ | API実装時 |
| [CODEBASE_MAP.md](./CODEBASE_MAP.md) | ファイル配置場所 | ファイル作成時 |

### 1.3 必須度の凡例

| ラベル | 意味 | 実装必須？ |
|:------:|------|:----------:|
| **MUST** | 必須。これがないと機能しない | ✅ |
| **SHOULD** | 推奨。UX向上に重要 | ⚠️ |
| **MAY** | 任意。あると良い | ❌ |

---

## 2. 実装前の必読事項

### 2.1 Lock検証から得た教訓

これらは全画面で適用すること。

| # | 教訓 | 具体的な対策 |
|---|------|-------------|
| 1 | **既存実装を先に確認** | コードを書く前に既存コンポーネントを確認 |
| 2 | **i18nキーは既存構造に従う** | `{app}.{screen}.{element}` 形式を維持 |
| 3 | **Mock APIから始める** | 実API前にRoute Handlersでモック作成 |
| 4 | **URLSearchParamsでデータ渡し** | 画面間は基本的にURLパラメータで |
| 5 | **デフォルト値を必ず設定** | パラメータがない場合の動作を保証 |

### 2.2 ファイル配置ルール

```
apps/web/src/
├── app/[locale]/{app}/{screen}/page.tsx    # ページ（MUST）
├── components/{app}/{Screen}/index.tsx      # コンポーネント（MUST）
├── components/ui/                           # 共通UI（既存使用）
├── lib/api/{domain}.ts                      # APIクライアント（MUST）
└── app/api/{domain}/route.ts                # Mock API（開発時）

locales/
├── ja/{app}.json                            # 日本語（MUST）
└── en/{app}.json                            # 英語（MUST）
```

### 2.3 開発フロー

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  1. Mock API │ → │  2. UI実装   │ → │  3. 結合    │ → │  4. テスト  │
│  Route Handler│   │  Component  │    │  API接続    │    │  E2E作成   │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

### 2.4 Core Principles 準拠チェック（MUST）

**全画面実装時に確認すること**

Quantum Shield の5つの憲法原則に準拠しているか、各画面でチェック：

| CP | 原則 | 確認ポイント | 例 |
|:--:|------|-------------|---|
| CP-1 | **自己主権性** | ユーザーが常に資産をコントロールできるか？ | 「キャンセル」「戻る」ボタンがあるか |
| CP-2 | **量子耐性** | 量子耐性が維持されているか？ | Dilithium署名を使用しているか |
| CP-3 | **透明性** | 操作がオンチェーンで検証可能か？ | txHashを表示・コピー可能か |
| CP-4 | **分散化** | 単一障害点がないか？ | 特定サーバーに依存していないか |
| CP-5 | **持続可能性** | 長期運用可能な設計か？ | Gas効率、保守性を考慮しているか |

#### 画面別チェックリスト

```
□ ユーザーは操作を中断・キャンセルできるか？ (CP-1)
□ 秘密鍵をブラウザに保存していないか？ (CP-2)
□ 取引結果にtxHashを表示しているか？ (CP-3)
□ オフライン時のフォールバックがあるか？ (CP-4)
□ 不要な再レンダリングを避けているか？ (CP-5)
```

---

## 3. 共通実装パターン

### 3.1 画面間データ受け渡し（MUST）

#### 送信側

```typescript
// Lock画面 → Processing画面
const handleSubmit = useCallback(() => {
  const params = new URLSearchParams({
    amount: parseFloat(amount).toFixed(2),
    period: period.toString(),
  });
  router.push(`/consumer/lock/processing?${params.toString()}`);
}, [router, amount, period]);
```

#### 受信側

```typescript
'use client';
import { useSearchParams } from 'next/navigation';

export function ProcessingScreen() {
  const searchParams = useSearchParams();

  // MUST: デフォルト値を必ず設定
  const amount = searchParams.get('amount') || '0.00';
  const period = searchParams.get('period') || '2';

  // ...
}
```

#### ルール

```
✅ MUST
- デフォルト値を必ず設定
- 金額は小数点2桁に正規化 (toFixed(2))
- 数値は toString() で文字列化

❌ DON'T
- 機密データ（秘密鍵等）をURLに含める
- 配列・オブジェクトをURLに入れる（Zustand使用）
- パラメータなしでエラーになる設計
```

### 3.2 Mock API パターン（MUST for 開発）

#### Route Handler

```typescript
// app/api/lock/route.ts
import { NextRequest, NextResponse } from 'next/server';

interface LockRequest {
  amount: string;
  period_years: number;
}

interface LockResponse {
  lock_id: string;
  status: 'pending' | 'confirmed' | 'failed';
  amount: string;
  period_years: number;
  unlock_date: string;
  tx_hash: string;
  created_at: string;
}

// インメモリストレージ（サーバー再起動でリセット）
const mockStorage = new Map<string, LockResponse>();

export async function POST(
  request: NextRequest
): Promise<NextResponse<LockResponse | { error: { code: string; message: string } }>> {
  try {
    const body: LockRequest = await request.json();

    // バリデーション
    const amount = parseFloat(body.amount);
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { error: { code: 'INVALID_AMOUNT', message: '金額が不正です' } },
        { status: 400 }
      );
    }

    // モックレスポンス生成
    const lockId = generateId();
    const response: LockResponse = {
      lock_id: lockId,
      status: 'pending',
      amount: body.amount,
      period_years: body.period_years,
      unlock_date: calculateUnlockDate(body.period_years),
      tx_hash: generateTxHash(),
      created_at: new Date().toISOString(),
    };

    mockStorage.set(lockId, response);

    return NextResponse.json(response);
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'サーバーエラー' } },
      { status: 500 }
    );
  }
}
```

#### APIクライアント

```typescript
// lib/api/lock.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

// APIはsnake_case、クライアントはcamelCase
export interface CreateLockRequest {
  amount: string;
  periodYears: number;  // camelCase
}

export interface LockResponse {
  lockId: string;       // camelCase
  status: 'pending' | 'confirmed' | 'failed';
  amount: string;
  periodYears: number;
  unlockDate: string;
  txHash: string;
  createdAt: string;
}

export async function createLock(request: CreateLockRequest): Promise<LockResponse> {
  const response = await fetch(`${API_BASE_URL}/api/lock`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: request.amount,
      period_years: request.periodYears,  // snake_case変換
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'APIエラー');
  }

  const data = await response.json();

  // snake_case → camelCase 変換
  return {
    lockId: data.lock_id,
    status: data.status,
    amount: data.amount,
    periodYears: data.period_years,
    unlockDate: data.unlock_date,
    txHash: data.tx_hash,
    createdAt: data.created_at,
  };
}
```

### 3.3 i18n パターン（MUST）

#### キー命名規則

```
{app}.{screen}.{section}.{element}

例:
consumer.lock.header.title        → "資産をロック"
consumer.lock.form.amount.label   → "ロックする金額"
consumer.lock.form.period.1year   → "1年"
consumer.lock.summary.unlockDate  → "解除可能日"
consumer.lock.button.submit       → "ロックする"
consumer.lock.error.minAmount     → "最小ロック金額は0.01 ETHです"
```

#### 使用方法

```typescript
'use client';
import { useTranslations } from 'next-intl';

export function LockScreen() {
  const t = useTranslations('consumer');

  return (
    <div>
      <h1>{t('lock.header.title')}</h1>
      <Button>{t('lock.button.submit')}</Button>
    </div>
  );
}
```

### 3.4 派生値計算（SHOULD）

```typescript
import { useMemo } from 'react';

// 日付計算はuseMemoでメモ化
const unlockDate = useMemo(() => {
  const date = new Date();
  date.setFullYear(date.getFullYear() + period);
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}, [period]);
```

### 3.5 コピー機能（SHOULD）

```typescript
const [copied, setCopied] = useState(false);

const handleCopy = async (text: string) => {
  await navigator.clipboard.writeText(text);
  setCopied(true);
  setTimeout(() => setCopied(false), 2000);  // 2秒後にリセット
};

// UI
<Button variant="ghost" size="icon" onClick={() => handleCopy(txHash)}>
  {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
</Button>
```

### 3.6 ステータスバッジ（MUST）

```typescript
import { Badge } from '@/components/ui/badge';

// ステータスとバリアントのマッピング
const STATUS_BADGE_MAP = {
  locked: 'gold',
  unlocking: 'warning',
  unlocked: 'success',
  failed: 'danger',
  pending: 'default',
} as const;

<Badge variant={STATUS_BADGE_MAP[status]}>{statusLabel}</Badge>
```

### 3.7 ローディング・エラー状態（MUST）

```typescript
interface ScreenState {
  isLoading: boolean;
  error: string | null;
  data: DataType | null;
}

// UI
{isLoading && <LoadingSpinner />}
{error && <ErrorMessage message={error} />}
{data && <ContentComponent data={data} />}
```

### 3.8 セキュリティパターン（MUST）

#### 3.8.1 機密データの取り扱い

**URLに含めてはいけないデータ（絶対禁止）**

| データ種別 | 理由 | 代替手段 |
|-----------|------|---------|
| 秘密鍵 | ブラウザ履歴・ログに残る | Zustand (メモリ内のみ) |
| セッショントークン | 漏洩リスク | httpOnly Cookie |
| パスワード | 漏洩リスク | POST bodyのみ |
| 個人情報 (メール等) | プライバシー | API経由で取得 |

```typescript
// ❌ 絶対ダメ
router.push(`/settings?privateKey=${key}`);

// ✅ OK
useStore.setState({ tempKey: key });
router.push('/settings');
```

#### 3.8.2 XSS対策

```typescript
// ❌ 危険: URLパラメータを直接innerHTML
const param = searchParams.get('message');
element.innerHTML = param;  // XSS脆弱性！

// ✅ 安全: Reactが自動エスケープ
const param = searchParams.get('message') || '';
return <div>{param}</div>;  // 自動エスケープされる

// ✅ 安全: 許可リストで検証
const ALLOWED_STATUS = ['pending', 'confirmed', 'failed'] as const;
const status = searchParams.get('status');
if (!ALLOWED_STATUS.includes(status as any)) {
  return <ErrorPage />;
}
```

#### 3.8.3 CSRF対策

```typescript
// APIクライアントにCSRFトークンを含める
export async function apiRequest(endpoint: string, options: RequestInit) {
  const csrfToken = getCsrfToken(); // Cookieから取得

  return fetch(endpoint, {
    ...options,
    headers: {
      ...options.headers,
      'X-CSRF-Token': csrfToken,
    },
    credentials: 'same-origin',
  });
}
```

#### 3.8.4 入力値検証

```typescript
// 金額入力の検証
function validateAmount(input: string): { valid: boolean; error?: string } {
  const amount = parseFloat(input);

  if (isNaN(amount)) {
    return { valid: false, error: '有効な数値を入力してください' };
  }
  if (amount <= 0) {
    return { valid: false, error: '0より大きい金額を入力してください' };
  }
  if (amount < 0.01) {
    return { valid: false, error: '最小金額は0.01 ETHです' };
  }
  if (!/^\d+(\.\d{1,18})?$/.test(input)) {
    return { valid: false, error: '小数点以下18桁までです' };
  }

  return { valid: true };
}
```

#### 3.8.5 セキュリティチェックリスト

```
□ URLパラメータに機密データを含めていないか？
□ ユーザー入力を直接DOMに挿入していないか？
□ 外部URLへのリダイレクトを検証しているか？
□ API呼び出しにCSRFトークンを含めているか？
□ エラーメッセージに内部情報を含めていないか？
```

### 3.9 エラーハンドリングパターン（MUST）

#### 3.9.1 標準エラー型

```typescript
// lib/types/error.ts
export interface AppError {
  code: string;
  message: string;        // ユーザー向けメッセージ
  details?: string;       // 開発者向け詳細（本番では非表示）
  retryable: boolean;     // リトライ可能か
}

export const ERROR_CODES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
  INVALID_INPUT: 'INVALID_INPUT',
  UNAUTHORIZED: 'UNAUTHORIZED',
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  TX_FAILED: 'TX_FAILED',
} as const;
```

#### 3.9.2 APIエラーハンドリング

```typescript
// lib/api/client.ts
export async function apiCall<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒タイムアウト

  try {
    const response = await fetch(endpoint, {
      ...options,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw {
        code: error.code || 'API_ERROR',
        message: error.message || 'APIエラーが発生しました',
        retryable: response.status >= 500,
      } as AppError;
    }

    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === 'AbortError') {
      throw {
        code: 'TIMEOUT',
        message: '接続がタイムアウトしました。再試行してください。',
        retryable: true,
      } as AppError;
    }

    if (error instanceof TypeError) {
      throw {
        code: 'NETWORK_ERROR',
        message: 'ネットワークに接続できません。接続を確認してください。',
        retryable: true,
      } as AppError;
    }

    throw error;
  }
}
```

#### 3.9.3 リトライパターン

```typescript
// lib/utils/retry.ts
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: AppError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as AppError;

      if (!lastError.retryable || i === maxRetries - 1) {
        throw lastError;
      }

      // 指数バックオフ
      await new Promise(resolve =>
        setTimeout(resolve, delayMs * Math.pow(2, i))
      );
    }
  }

  throw lastError!;
}

// 使用例
const result = await withRetry(() => createLock(request));
```

#### 3.9.4 UIでのエラー表示

```typescript
// components/shared/ErrorDisplay.tsx
interface ErrorDisplayProps {
  error: AppError;
  onRetry?: () => void;
}

export function ErrorDisplay({ error, onRetry }: ErrorDisplayProps) {
  return (
    <div className="rounded-qs bg-danger/10 p-4 border border-danger">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-danger flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-foreground font-medium">{error.message}</p>
          {error.retryable && onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="mt-2"
            >
              再試行
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
```

#### 3.9.5 エラーメッセージガイドライン

```
✅ 良いエラーメッセージ
- 「残高が不足しています。必要: 0.5 ETH、現在: 0.3 ETH」
- 「ネットワークに接続できません。接続を確認してください。」
- 「入力金額は0.01 ETH以上にしてください。」

❌ 悪いエラーメッセージ
- 「エラーが発生しました」（何のエラーか不明）
- 「Error: INSUFFICIENT_FUNDS」（技術用語）
- 「null pointer exception at line 42」（内部情報の露出）
```

### 3.10 型定義の場所（MUST）

```
apps/web/src/
├── types/                         # アプリ共通の型
│   ├── index.ts                   # エクスポート
│   ├── api.ts                     # API関連の型
│   ├── error.ts                   # エラー型
│   └── entities.ts                # ビジネスエンティティ
│
├── components/{app}/types.ts      # アプリ固有の型
│
└── lib/api/{domain}.ts            # API関数と一緒に型定義
```

#### 共通型の例

```typescript
// types/entities.ts
export type LockStatus = 'pending' | 'confirmed' | 'failed';
export type UnlockMethod = 'normal' | 'emergency';
export type LockPeriod = 1 | 2 | 3 | 5;

export interface Lock {
  id: string;
  amount: string;
  periodYears: LockPeriod;
  status: LockStatus;
  unlockDate: string;
  txHash: string;
  createdAt: string;
}

export interface User {
  address: string;
  dilithiumPubkey?: string;
  createdAt: string;
}
```

---

## 4. Consumer App

### 4.1 概要

| 項目 | 内容 |
|------|------|
| 対象ユーザー | 一般ユーザー（暗号資産保有者） |
| 画面数 | 19画面 + 補助7画面 |
| 主要機能 | Lock, Unlock, History |
| ペルソナ | 田中さん（32歳、技術レベル★★☆☆☆） |

### 4.2 画面一覧

| # | 画面ID | URL | 説明 | シーケンス |
|---|--------|-----|------|-----------|
| 01 | landing | `/consumer/landing` | ランディングページ | - |
| 02 | onboarding | `/consumer/onboarding` | ウォレット接続・鍵生成 | - |
| 03 | dashboard | `/consumer/dashboard` | メインダッシュボード | - |
| 04 | lock | `/consumer/lock` | Lock入力・確認 | #1 |
| 05 | lock-processing | `/consumer/lock/processing` | Lock処理中 | #1 |
| 06 | lock-success | `/consumer/lock/success` | Lock完了 | #1 |
| 07 | unlock | `/consumer/unlock` | Unlock選択・入力 | #2, #3 |
| 08 | unlock-sign | `/consumer/unlock/sign` | Unlock署名 | #2 |
| 09 | unlock-processing | `/consumer/unlock/processing` | Unlock処理中 | #2 |
| 10 | unlock-success | `/consumer/unlock/success` | Unlock完了 | #2 |
| 11 | emergency-bond | `/consumer/unlock/emergency/bond` | 緊急Unlock保証金 | #3 |
| 12 | emergency-processing | `/consumer/unlock/emergency/processing` | 緊急Unlock処理中 | #3 |
| 13 | emergency-success | `/consumer/unlock/emergency/success` | 緊急Unlock完了 | #3 |
| 14 | history | `/consumer/history` | 取引履歴 | - |
| 15 | history-detail | `/consumer/history/[id]` | 取引詳細 | - |
| 16 | settings | `/consumer/settings` | 設定 | - |
| 17 | keys | `/consumer/settings/keys` | 鍵管理 | - |
| 18 | faq | `/consumer/faq` | FAQ | - |
| 19 | help | `/consumer/help` | ヘルプ | - |

### 4.3 シーケンス #1: Lock（資産ロック）

#### フロー図

```
[Dashboard] → [Lock入力] → [Lock処理中] → [Lock完了] → [Dashboard]
                  │              │             │
                  │ confirm      │ API呼出     │ 完了
                  ▼              ▼             ▼
              URLParams      URLParams      戻るボタン
              送信           送信           表示
```

#### 画面詳細: Lock入力 (`/consumer/lock`)

**レイアウト（MUST）**

```
┌─────────────────────────────────────────────────────────────┐
│  [← 戻る]                               Quantum Shield      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  資産をロック                                                │
│                                                             │
│  ロックする金額                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  [ETH]  0.00                                   ETH │   │
│  └─────────────────────────────────────────────────────┘   │
│  利用可能: 1.5 ETH                                          │
│  [25%] [50%] [75%] [MAX]    ← Quick Amount (SHOULD)        │
│                                                             │
│  ロック期間 (MUST)                                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  [1年]  [2年]  [3年]  [5年]                         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ────────────────────────────────────────────────────────   │
│                                                             │
│  ロック概要 (MUST)                                          │
│  ├─ ロック金額:      0.5 ETH                                │
│  ├─ ロック期間:      2年                                    │
│  ├─ 解除可能日:      2028年1月22日                          │
│  └─ ネットワーク手数料: ~0.001 ETH                          │
│                                                             │
│  [           ロックする (primary, lg)           ] (MUST)    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**状態管理（MUST）**

```typescript
interface LockFormState {
  amount: string;
  period: 1 | 2 | 3 | 5;
  isSubmitting: boolean;
  error: string | null;
}

// 初期値
const initialState: LockFormState = {
  amount: '',
  period: 2,  // デフォルト2年
  isSubmitting: false,
  error: null,
};
```

**バリデーション（MUST）**

| ルール | エラーメッセージ | i18nキー |
|--------|-----------------|----------|
| 金額が0以下 | 0より大きい金額を入力してください | `consumer.lock.error.invalidAmount` |
| 金額が残高超過 | 残高が不足しています | `consumer.lock.error.insufficientBalance` |
| 最小値未満 (0.01 ETH) | 最小ロック金額は0.01 ETHです | `consumer.lock.error.minAmount` |

**確認モーダル（MUST）**

```
┌─────────────────────────────────────────┐
│  ロックを確認                            │
├─────────────────────────────────────────┤
│                                         │
│  以下の内容でロックしますか？            │
│                                         │
│  ロック金額:    0.5 ETH                 │
│  ロック期間:    2年                     │
│  解除可能日:    2028年1月22日           │
│                                         │
│  ⚠️ ロック期間中は資産を引き出せません   │
│                                         │
│  [キャンセル]  [ロックする]              │
│                                         │
└─────────────────────────────────────────┘
```

**API（開発時Mock）**

```typescript
// POST /api/lock
Request: {
  amount: string;
  period_years: number;
  dilithium_pubkey?: string;
}

Response: {
  lock_id: string;
  status: 'pending';
  amount: string;
  period_years: number;
  unlock_date: string;  // ISO8601
  tx_hash: string;
  created_at: string;   // ISO8601
}
```

**遷移パラメータ（MUST）**

```typescript
// Lock → Processing
const params = new URLSearchParams({
  amount: parseFloat(amount).toFixed(2),
  period: period.toString(),
});
router.push(`/consumer/lock/processing?${params}`);
```

#### 画面詳細: Lock処理中 (`/consumer/lock/processing`)

**レイアウト（MUST）**

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                    [日の丸ロゴ アニメーション]                │
│                                                             │
│                    ロック処理中...                           │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ✅ 1. トランザクション作成                          │   │
│  │  ✅ 2. 署名検証                                      │   │
│  │  🔄 3. ブロックチェーン送信                          │   │
│  │  ⬜ 4. 完了確認                                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ロック金額: 0.5 ETH                                        │
│  ロック期間: 2年                                            │
│                                                             │
│  ※ この処理には数分かかる場合があります                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**状態（MUST）**

```typescript
type ProcessingStep = 'creating' | 'signing' | 'submitting' | 'confirming' | 'done' | 'error';

interface ProcessingState {
  step: ProcessingStep;
  error: string | null;
}
```

**遷移パラメータ（MUST）**

```typescript
// 受信
const amount = searchParams.get('amount') || '0.00';
const period = searchParams.get('period') || '2';

// Processing → Success
const params = new URLSearchParams({
  amount,
  period,
  txHash: response.txHash,
  lockId: response.lockId,
});
router.push(`/consumer/lock/success?${params}`);
```

#### 画面詳細: Lock完了 (`/consumer/lock/success`)

**レイアウト（MUST）**

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                    [✓ チェックマーク]                        │
│                                                             │
│                    ロック完了！                              │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │  [Badge: gold] Locked                               │   │ ← MUST
│  │                                                     │   │
│  │  ロック金額      0.5 ETH                            │   │
│  │  ロック期間      2年                                │   │ ← MUST
│  │  解除可能日      2028年1月22日                      │   │ ← MUST
│  │                                                     │   │
│  │  ─────────────────────────────────                  │   │
│  │                                                     │   │
│  │  トランザクションハッシュ                           │   │
│  │  0x7a3f...9c2d  [コピー]                           │   │ ← MUST
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [      ダッシュボードに戻る (primary, lg)      ]            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**受信パラメータ（MUST）**

```typescript
const amount = searchParams.get('amount') || '0.00';
const period = searchParams.get('period') || '2';
const txHash = searchParams.get('txHash') || '0x...';
const lockId = searchParams.get('lockId') || '';
```

### 4.4 シーケンス #2: Unlock (通常)

#### フロー図

```
[Dashboard] → [Unlock選択] → [Unlock署名] → [Unlock処理中] → [Unlock完了]
                  │              │               │              │
                  │ 資産選択     │ 署名要求      │ 24h待機     │ 完了
                  ▼              ▼               ▼              ▼
              URLParams      URLParams       URLParams      戻るボタン
```

#### 画面詳細: Unlock選択 (`/consumer/unlock`)

**レイアウト（MUST）**

```
┌─────────────────────────────────────────────────────────────┐
│  [← 戻る]                               Quantum Shield      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  アンロック                                                  │
│                                                             │
│  アンロックする資産を選択                                    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  [●] ETH  0.5 ETH                                   │   │
│  │      解除可能日: 2028年1月22日                       │   │
│  │      [Badge: gold] Locked                           │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │  [○] ETH  1.0 ETH                                   │   │
│  │      解除可能日: 2029年6月15日                       │   │
│  │      [Badge: gold] Locked                           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  アンロック方法 (MUST)                                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  [●] 通常アンロック（24時間待機）                    │   │
│  │      手数料: 無料                                    │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │  [○] 緊急アンロック（即時）                          │   │
│  │      手数料: 150%保証金（24h後返金）                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [           次へ (primary, lg)           ]                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**状態管理（MUST）**

```typescript
interface UnlockSelectState {
  selectedLockId: string | null;
  unlockMethod: 'normal' | 'emergency';
}
```

**遷移パラメータ（MUST）**

```typescript
// 通常アンロック → 署名画面
const params = new URLSearchParams({
  lockId: selectedLockId,
  amount: selectedLock.amount,
  method: 'normal',
});
router.push(`/consumer/unlock/sign?${params}`);

// 緊急アンロック → 保証金画面
const params = new URLSearchParams({
  lockId: selectedLockId,
  amount: selectedLock.amount,
  method: 'emergency',
});
router.push(`/consumer/unlock/emergency/bond?${params}`);
```

#### 画面詳細: Unlock署名 (`/consumer/unlock/sign`)

**レイアウト（MUST）**

```
┌─────────────────────────────────────────────────────────────┐
│  [← 戻る]                               Quantum Shield      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  署名を確認                                                  │
│                                                             │
│  アンロックするには署名が必要です                            │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  アンロック金額:    0.5 ETH                          │   │
│  │  24時間待機後:      資産が引き出し可能               │   │
│  │  手数料:            無料                             │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ⚠️ 署名後、24時間の待機期間が始まります                     │
│                                                             │
│  [           署名する (primary, lg)           ]              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**API（MUST）**

```typescript
// POST /api/unlock/initiate
Request: {
  lock_id: string;
  method: 'normal' | 'emergency';
}

Response: {
  unlock_id: string;
  status: 'waiting';  // 24h待機中
  unlock_available_at: string;  // ISO8601
  amount: string;
}
```

### 4.5 シーケンス #3: Unlock (緊急)

#### フロー図

```
[Unlock選択] → [保証金入力] → [処理中] → [完了]
      │             │            │          │
      │ emergency   │ 150%入金   │ 即時処理 │
      ▼             ▼            ▼          ▼
```

#### 画面詳細: 保証金入力 (`/consumer/unlock/emergency/bond`)

**レイアウト（MUST）**

```
┌─────────────────────────────────────────────────────────────┐
│  [← 戻る]                               Quantum Shield      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  緊急アンロック                                              │
│                                                             │
│  ⚠️ 緊急アンロックには150%の保証金が必要です                 │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  アンロック金額:    0.5 ETH                          │   │
│  │  必要保証金:        0.75 ETH (150%)                  │   │
│  │  保証金返金:        24時間後                         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  💡 なぜ保証金が必要？                               │   │
│  │                                                     │   │
│  │  緊急アンロックは24時間の待機期間をスキップします。  │   │
│  │  不正防止のため、一時的に150%の保証金を預けます。    │   │
│  │  24時間後、問題がなければ保証金は全額返金されます。  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [           保証金を入金してアンロック (danger, lg)   ]     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4.6 実装チェックリスト: Consumer App

各画面の実装後、以下をチェック：

```
□ URLパラメータにデフォルト値設定
□ i18nキーが全て定義されている（ja/en両方）
□ バリデーションエラーが日本語で表示される
□ ローディング状態が表示される
□ エラー時にユーザーに分かりやすいメッセージ
□ 戻るボタンが機能する
□ Badge でステータスが表示される（該当画面）
□ コピーボタンが機能する（txHash等）
□ スマホ表示で崩れない
□ キーボード操作ができる（Tab移動）
```

---

## 5. Token Hub

### 5.1 概要

| 項目 | 内容 |
|------|------|
| 対象ユーザー | QSトークン保有者 |
| 画面数 | 20画面 |
| 主要機能 | ステーキング、報酬、Delegate |

### 5.2 画面一覧

| # | 画面ID | URL | 説明 |
|---|--------|-----|------|
| 01 | landing | `/token-hub/landing` | ランディング |
| 02 | onboarding | `/token-hub/onboarding` | オンボーディング |
| 03 | dashboard | `/token-hub/dashboard` | ダッシュボード |
| 04 | stake | `/token-hub/stake` | ステーキング |
| 05 | unstake | `/token-hub/unstake` | アンステーキング |
| 06 | rewards | `/token-hub/rewards` | 報酬確認 |
| 07 | claim | `/token-hub/claim` | 報酬請求 |
| 08 | delegate | `/token-hub/delegate` | Delegate |
| 09 | history | `/token-hub/history` | 履歴 |
| 10 | settings | `/token-hub/settings` | 設定 |

### 5.3 シーケンス: Stake

```
[Dashboard] → [Stake入力] → [Stake処理中] → [Stake完了]
                  │              │             │
              amount,        URLParams      戻る
              lockPeriod       渡し          ボタン
```

**Lock学びの適用:**
- Stake画面もLockと同様に「期間選択」「概要表示」「確認モーダル」が必要
- URLSearchParamsで画面間データ渡し
- Mock APIを先に作成

### 5.4 ペルソナ: Token Hub

```yaml
ペルソナ: 山田 花子
年齢: 28歳
職業: DeFiユーザー（中級者）
技術レベル: 3/5
目的: QSトークンをステーキングして報酬を得たい
課題:
  - APY計算がよく分からない
  - Delegateの仕組みを理解したい
  - ステーキング期間のロックを把握したい
```

### 5.5 シーケンス詳細: Stake

#### フロー図

```
[Dashboard] → [Stake入力] → [Stake処理中] → [Stake完了] → [Dashboard]
                  │              │             │
                  │ confirm      │ API呼出     │ 完了
                  ▼              ▼             ▼
              URLParams      URLParams      戻るボタン
```

#### 画面詳細: Stake入力 (`/token-hub/stake`)

**レイアウト（MUST）**

```
┌─────────────────────────────────────────────────────────────┐
│  [← 戻る]                               Quantum Shield      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  QSトークンをステーク                                        │
│                                                             │
│  ステークする金額                                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  [QS]  0                                         QS │   │
│  └─────────────────────────────────────────────────────┘   │
│  利用可能: 10,000 QS                                        │
│  [25%] [50%] [75%] [MAX]                                   │
│                                                             │
│  ステーク期間 (MUST)                                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  [3ヶ月]  [6ヶ月]  [1年]  [2年]                     │   │
│  │   APY 5%   APY 8%   APY 12%  APY 18%               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 💡 APYについて                               [?]    │   │ ← ツールチップ
│  │ 期間が長いほど報酬率が高くなります                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ────────────────────────────────────────────────────────   │
│                                                             │
│  ステーク概要 (MUST)                                        │
│  ├─ ステーク金額:     5,000 QS                             │
│  ├─ ステーク期間:     1年                                  │
│  ├─ 予想年間報酬:     600 QS (APY 12%)                     │
│  ├─ 解除可能日:       2027年1月22日                        │
│  └─ ネットワーク手数料: ~0.002 ETH                         │
│                                                             │
│  [           ステークする (primary, lg)           ]         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**状態管理（MUST）**

```typescript
interface StakeFormState {
  amount: string;
  period: 3 | 6 | 12 | 24;  // 月単位
  isSubmitting: boolean;
  error: string | null;
}

// APY定数
const APY_BY_PERIOD: Record<number, number> = {
  3: 5,    // 3ヶ月 → 5%
  6: 8,    // 6ヶ月 → 8%
  12: 12,  // 1年 → 12%
  24: 18,  // 2年 → 18%
};
```

**バリデーション（MUST）**

| ルール | エラーメッセージ | i18nキー |
|--------|-----------------|----------|
| 金額が0以下 | 0より大きい金額を入力してください | `token-hub.stake.error.invalidAmount` |
| 金額が残高超過 | QS残高が不足しています | `token-hub.stake.error.insufficientBalance` |
| 最小値未満 (100 QS) | 最小ステーク金額は100 QSです | `token-hub.stake.error.minAmount` |

**API（Mock）**

```typescript
// POST /api/stake
Request: {
  amount: string;
  period_months: number;
}

Response: {
  stake_id: string;
  status: 'pending';
  amount: string;
  period_months: number;
  apy: number;
  estimated_reward: string;
  unlock_date: string;  // ISO8601
  tx_hash: string;
  created_at: string;   // ISO8601
}
```

**遷移パラメータ（MUST）**

```typescript
// Stake → Processing
const params = new URLSearchParams({
  amount: amount,
  period: period.toString(),
  apy: APY_BY_PERIOD[period].toString(),
});
router.push(`/token-hub/stake/processing?${params}`);
```

### 5.6 シーケンス詳細: Delegate

#### フロー図

```
[Dashboard] → [Delegate選択] → [Delegate確認] → [Delegate完了]
                   │                │                │
               検索/選択        金額入力         結果表示
```

#### 画面詳細: Delegate選択 (`/token-hub/delegate`)

**レイアウト（MUST）**

```
┌─────────────────────────────────────────────────────────────┐
│  [← 戻る]                               Quantum Shield      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  投票権を委任（Delegate）                                    │
│                                                             │
│  委任先を検索                                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  🔍 アドレスまたは名前で検索...                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  おすすめの委任先                                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  [●] QS Foundation                                  │   │
│  │      0x1234...5678                                  │   │
│  │      投票率: 98%  |  委任者: 1,234人                │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │  [○] Community DAO                                  │   │
│  │      0x2345...6789                                  │   │
│  │      投票率: 95%  |  委任者: 856人                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  委任するQS量                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  [QS]  0                                         QS │   │
│  └─────────────────────────────────────────────────────┘   │
│  利用可能: 10,000 QS                                        │
│                                                             │
│  [           委任する (primary, lg)           ]             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**状態管理（MUST）**

```typescript
interface DelegateFormState {
  searchQuery: string;
  selectedDelegate: string | null;  // アドレス
  amount: string;
  isSearching: boolean;
  isSubmitting: boolean;
  error: string | null;
}

interface DelegateOption {
  address: string;
  name: string;
  voteRate: number;      // 投票参加率 (%)
  delegatorCount: number;
}
```

### 5.7 実装チェックリスト: Token Hub

```
□ Consumer Appと同じパターンを適用
□ QSトークン特有の用語にツールチップ追加
  - "APY" → 「年利回り。預けた金額に対する年間報酬の割合」
  - "Delegate" → 「投票権を他のアドレスに委任すること」
  - "ステーク" → 「トークンを預けて報酬を得ること」
□ ステーキング報酬の計算式を説明
□ Delegate先の検索・選択UI
□ 予想報酬をリアルタイム計算
□ 期間選択時にAPYを強調表示
□ 解除不可期間の注意喚起を表示
```

---

## 6. Governance

### 6.1 概要

| 項目 | 内容 |
|------|------|
| 対象ユーザー | 投票者、Delegate |
| 画面数 | 10画面 |
| 主要機能 | 提案作成、投票、結果確認 |

### 6.2 画面一覧

| # | 画面ID | URL | 説明 |
|---|--------|-----|------|
| 01 | landing | `/governance/landing` | ランディング |
| 02 | dashboard | `/governance/dashboard` | ダッシュボード |
| 03 | proposals | `/governance/proposals` | 提案一覧 |
| 04 | proposal-detail | `/governance/proposals/[id]` | 提案詳細 |
| 05 | vote | `/governance/proposals/[id]/vote` | 投票 |
| 06 | create | `/governance/proposals/create` | 提案作成 |
| 07 | council | `/governance/council` | 評議会 |
| 08 | history | `/governance/history` | 履歴 |
| 09 | settings | `/governance/settings` | 設定 |
| 10 | faq | `/governance/faq` | FAQ |

### 6.3 ペルソナ: Governance

```yaml
ペルソナ: 鈴木 一郎
年齢: 42歳
職業: コミュニティメンバー（ガバナンス参加経験あり）
技術レベル: 4/5
目的: Quantum Shieldの方向性に影響を与えたい
課題:
  - 提案の技術的詳細を理解したい
  - 自分の投票が反映されているか確認したい
  - 評議会メンバーの活動を追跡したい
```

### 6.4 シーケンス詳細: Vote

#### フロー図

```
[Proposals一覧] → [Proposal詳細] → [Vote確認] → [Vote完了]
                       │               │            │
                  proposalId       投票選択     結果表示
                     URLパラメータ   URLパラメータ
```

#### 画面詳細: Proposal詳細 (`/governance/proposals/[id]`)

**レイアウト（MUST）**

```
┌─────────────────────────────────────────────────────────────┐
│  [← 提案一覧へ]                         Quantum Shield      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Badge: success] 投票中                                    │
│                                                             │
│  QIP-42: プロトコル手数料の改定                              │
│                                                             │
│  提案者: 0x1234...5678  |  提出日: 2026年1月15日            │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  概要                                               │   │
│  │  プロトコル手数料を現行の0.1%から0.05%に引き下げる   │   │
│  │  提案です。これにより...                            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  投票状況                                                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  賛成: 65%  ████████████████░░░░░░░░  反対: 35%      │   │
│  │  投票者: 1,234人  |  投票力: 5.2M QS                │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  投票期限: 残り3日12時間                                     │
│                                                             │
│  [           投票する (primary, lg)           ]             │
│                                                             │
│  ────────────────────────────────────────────────────────   │
│                                                             │
│  詳細情報  |  ディスカッション  |  投票履歴                   │
│                                                             │
│  [詳細情報タブの内容...]                                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**状態管理（MUST）**

```typescript
interface ProposalDetailState {
  proposal: Proposal | null;
  isLoading: boolean;
  error: string | null;
  activeTab: 'details' | 'discussion' | 'history';
}

interface Proposal {
  id: string;
  title: string;
  summary: string;
  proposer: string;
  status: 'pending' | 'voting' | 'passed' | 'rejected' | 'executed';
  forVotes: number;
  againstVotes: number;
  voterCount: number;
  totalVotingPower: string;
  deadline: string;  // ISO8601
  createdAt: string;
}
```

#### 画面詳細: Vote確認 (`/governance/proposals/[id]/vote`)

**レイアウト（MUST）**

```
┌─────────────────────────────────────────────────────────────┐
│  [← 戻る]                               Quantum Shield      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  投票を確認                                                  │
│                                                             │
│  QIP-42: プロトコル手数料の改定                              │
│                                                             │
│  投票を選択 (MUST)                                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  [●] 賛成                                           │   │
│  │      この提案に賛成します                           │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │  [○] 反対                                           │   │
│  │      この提案に反対します                           │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │  [○] 棄権                                           │   │
│  │      この投票を棄権します（投票力はカウント）       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ────────────────────────────────────────────────────────   │
│                                                             │
│  あなたの投票力                                              │
│  ├─ 保有QS:         5,000 QS                               │
│  ├─ 委任されたQS:   1,200 QS                               │
│  └─ 合計投票力:     6,200 QS                               │
│                                                             │
│  ⚠️ 投票後は変更できません                                   │
│                                                             │
│  [           投票を確定する (primary, lg)           ]       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**状態管理（MUST）**

```typescript
interface VoteFormState {
  voteChoice: 'for' | 'against' | 'abstain' | null;
  isSubmitting: boolean;
  error: string | null;
}

interface VotingPower {
  ownedQs: string;
  delegatedQs: string;
  totalPower: string;
}
```

**API（Mock）**

```typescript
// POST /api/vote
Request: {
  proposal_id: string;
  vote: 'for' | 'against' | 'abstain';
}

Response: {
  vote_id: string;
  proposal_id: string;
  vote: 'for' | 'against' | 'abstain';
  voting_power: string;
  tx_hash: string;
  created_at: string;
}
```

### 6.5 シーケンス詳細: Create Proposal

#### フロー図

```
[Dashboard] → [提案作成] → [プレビュー] → [提出確認] → [提出完了]
                  │            │             │            │
              入力フォーム   内容確認      署名・送信     結果表示
```

#### 画面詳細: 提案作成 (`/governance/proposals/create`)

**レイアウト（MUST）**

```
┌─────────────────────────────────────────────────────────────┐
│  [← 戻る]                               Quantum Shield      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  新しい提案を作成                                            │
│                                                             │
│  提案タイプ (MUST)                                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  [●] パラメータ変更                                 │   │
│  │  [○] 資金配分                                       │   │
│  │  [○] プロトコルアップグレード                       │   │
│  │  [○] その他                                         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  タイトル (MUST)                                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  QIP-XX: 提案タイトル                               │   │
│  └─────────────────────────────────────────────────────┘   │
│  50文字以内                                                 │
│                                                             │
│  概要 (MUST)                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  提案の概要を入力...                                │   │
│  │                                                     │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│  Markdown対応 | 500文字以内                                 │
│                                                             │
│  詳細説明 (MUST)                                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  詳細な説明を入力...                                │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│  Markdown対応                                               │
│                                                             │
│  ⚠️ 提案には最低10,000 QSの保有が必要です                   │
│                                                             │
│  [           プレビュー (secondary, lg)           ]         │
│  [           提出する (primary, lg)           ]             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**バリデーション（MUST）**

| ルール | エラーメッセージ | i18nキー |
|--------|-----------------|----------|
| タイトル空 | タイトルを入力してください | `governance.create.error.titleRequired` |
| タイトル50文字超過 | タイトルは50文字以内です | `governance.create.error.titleTooLong` |
| 概要空 | 概要を入力してください | `governance.create.error.summaryRequired` |
| QS保有量不足 | 提案には10,000 QS以上の保有が必要です | `governance.create.error.insufficientQs` |

### 6.6 実装チェックリスト: Governance

```
□ Consumer Appと同じパターンを適用
□ 投票状況をプログレスバーで視覚化
□ 投票期限のカウントダウン表示
□ Markdown対応のテキストエリア
□ 投票変更不可の警告を明確に表示
□ 提案ステータスに応じたBadge色分け
  - pending → default
  - voting → gold
  - passed → success
  - rejected → danger
  - executed → secondary
□ 投票力の内訳を表示（自己保有 + 委任）
□ 提案作成のプレビュー機能
```

---

## 7. Prover Portal

### 7.1 概要

| 項目 | 内容 |
|------|------|
| 対象ユーザー | 証明者（署名サービス事業者） |
| 画面数 | 15画面 |
| 主要機能 | 申請、ステーク、メトリクス確認 |

### 7.2 画面一覧

| # | 画面ID | URL | 説明 |
|---|--------|-----|------|
| 01 | landing | `/prover/landing` | ランディング |
| 02 | requirements | `/prover/requirements` | 参加要件 |
| 03 | application | `/prover/application` | 申請 |
| 04 | application-status | `/prover/application/status` | 申請状況 |
| 05 | dashboard | `/prover/dashboard` | ダッシュボード |
| 06 | stake | `/prover/stake` | ステーク管理 |
| 07 | queue | `/prover/queue` | キュー確認 |
| 08 | metrics | `/prover/metrics` | メトリクス |
| 09 | alerts | `/prover/alerts` | アラート |
| 10 | challenge | `/prover/challenge` | Challenge対応 |
| 11 | exit | `/prover/exit` | 離脱申請 |
| 12 | history | `/prover/history` | 履歴 |
| 13 | settings | `/prover/settings` | 設定 |
| 14 | terms | `/prover/terms` | 利用規約 |
| 15 | faq | `/prover/faq` | FAQ |

### 7.3 ペルソナ: Prover Portal

```yaml
ペルソナ: 佐藤 健二
年齢: 38歳
職業: インフラエンジニア（Prover事業者）
技術レベル: 5/5
目的: Proverとして安定した収益を得たい
課題:
  - 申請プロセスの要件を把握したい
  - ノードのパフォーマンスを監視したい
  - Challengeへの対応方法を理解したい
```

### 7.4 シーケンス詳細: Application（申請）

#### フロー図

```
[Landing] → [Requirements] → [Application] → [Stake] → [Application Status]
               │                 │             │              │
           要件確認          フォーム入力    担保入金       審査待ち
```

#### 画面詳細: Application (`/prover/application`)

**レイアウト（MUST）**

```
┌─────────────────────────────────────────────────────────────┐
│  [← 戻る]                               Quantum Shield      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Prover申請                                                  │
│                                                             │
│  ステップ 1/3: 基本情報                                      │
│  ────────────────────────────────────────────────────────   │
│                                                             │
│  組織名 (MUST)                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  株式会社〇〇                                        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  代表者名 (MUST)                                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  佐藤 健二                                          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  メールアドレス (MUST)                                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  contact@example.com                                │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ノードURL (MUST)                                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  https://prover-node.example.com                    │   │
│  └─────────────────────────────────────────────────────┘   │
│  ※ HTTPSのみ対応                                            │
│                                                             │
│  [           次へ (primary, lg)           ]                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**状態管理（MUST）**

```typescript
interface ProverApplicationState {
  step: 1 | 2 | 3;
  formData: {
    // Step 1: 基本情報
    organizationName: string;
    representativeName: string;
    email: string;
    nodeUrl: string;
    // Step 2: 技術情報
    gpuSpec: string;
    networkBandwidth: string;
    storageCapacity: string;
    // Step 3: 担保
    stakeAmount: string;
  };
  isSubmitting: boolean;
  error: string | null;
}
```

**バリデーション（MUST）**

| ルール | エラーメッセージ | i18nキー |
|--------|-----------------|----------|
| 組織名空 | 組織名を入力してください | `prover.application.error.orgRequired` |
| メール形式不正 | 有効なメールアドレスを入力してください | `prover.application.error.invalidEmail` |
| URL形式不正 | 有効なURLを入力してください | `prover.application.error.invalidUrl` |
| URL非HTTPS | HTTPSのURLを入力してください | `prover.application.error.httpsRequired` |
| 担保不足 | 最低担保額は100,000 QSです | `prover.application.error.minStake` |

### 7.5 シーケンス詳細: Challenge対応

#### フロー図

```
[Dashboard] → [Challenge Alert] → [Challenge Detail] → [Response] → [Result]
                   │                    │                 │          │
              通知表示            詳細確認           対応入力    結果確認
```

#### 画面詳細: Challenge対応 (`/prover/challenge`)

**レイアウト（MUST）**

```
┌─────────────────────────────────────────────────────────────┐
│  [← ダッシュボード]                     Quantum Shield      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ⚠️ Challenge #1234                                         │
│  [Badge: warning] 対応待ち                                  │
│                                                             │
│  対応期限: 残り23時間45分                                    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Challenge詳細                                      │   │
│  │                                                     │   │
│  │  対象取引: 0xabc...def                              │   │
│  │  Challenge者: 0x123...456                           │   │
│  │  提出時刻: 2026-01-22 10:30 JST                     │   │
│  │                                                     │   │
│  │  申立内容:                                          │   │
│  │  署名検証に失敗しました。                           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  対応方法                                                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  [●] 有効な証明を再提出                             │   │
│  │  [○] 異議を申し立て                                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  証明データ (証明再提出の場合)                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  証明データをアップロード...                        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [           対応を送信 (primary, lg)           ]           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**状態管理（MUST）**

```typescript
interface ChallengeResponseState {
  challenge: Challenge | null;
  responseType: 'resubmit' | 'dispute' | null;
  proofData: File | null;
  disputeReason: string;
  isSubmitting: boolean;
  error: string | null;
}

interface Challenge {
  id: string;
  transactionHash: string;
  challenger: string;
  reason: string;
  status: 'pending' | 'responded' | 'resolved' | 'slashed';
  deadline: string;  // ISO8601
  createdAt: string;
}
```

### 7.6 シーケンス詳細: Dashboard（メトリクス監視）

#### 画面詳細: Dashboard (`/prover/dashboard`)

**レイアウト（MUST）**

```
┌─────────────────────────────────────────────────────────────┐
│  Quantum Shield                [通知] [設定] [ログアウト]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Badge: success] アクティブ                                │
│  株式会社〇〇 Prover Node                                   │
│                                                             │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐│
│  │ 今月の報酬     │  │ 処理済み署名   │  │ 稼働率        ││
│  │ 1,234 QS      │  │ 5,678 件      │  │ 99.8%        ││
│  │ +12% vs先月   │  │ +8% vs先月    │  │              ││
│  └────────────────┘  └────────────────┘  └────────────────┘│
│                                                             │
│  ステーク状況                                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ステーク残高:    100,000 QS                        │   │
│  │  最低必要額:      100,000 QS                        │   │
│  │  ステータス:      ✅ 十分                           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  最近のアラート (MUST)                                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ⚠️ Challenge #1234 - 対応期限: 残り23時間         │→  │
│  │  ⚠️ CPU使用率が90%を超えています                   │→  │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  パフォーマンスグラフ                                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  [応答時間推移グラフ - 過去24時間]                  │   │
│  │  ████████████████████████████████████████           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 7.7 実装チェックリスト: Prover Portal

```
□ Consumer Appと同じパターンを適用
□ 技術用語にツールチップ追加
  - "Challenge" → 「Observerによる不正検知の申し立て」
  - "Slash" → 「不正行為に対するペナルティ（担保没収）」
  - "稼働率" → 「ノードがオンラインで応答可能な時間の割合」
□ Challenge対応の期限カウントダウンを目立たせる
□ アラートの重要度に応じた色分け
  - 緊急 (Challenge) → danger
  - 警告 (パフォーマンス) → warning
  - 情報 → default
□ メトリクスのリアルタイム更新（ポーリング or WebSocket）
□ 申請ステップのプログレスバー表示
□ ノードURL接続テスト機能
```

---

## 8. Observer

### 8.1 概要

| 項目 | 内容 |
|------|------|
| 対象ユーザー | 監視者（不正検知担当） |
| 画面数 | 14画面 |
| 主要機能 | 監視、Challenge提出、報酬 |

### 8.2 画面一覧

| # | 画面ID | URL | 説明 |
|---|--------|-----|------|
| 01 | landing | `/observer/landing` | ランディング |
| 02 | application | `/observer/application` | 申請 |
| 03 | dashboard | `/observer/dashboard` | ダッシュボード |
| 04 | monitoring | `/observer/monitoring` | 監視画面 |
| 05 | suspicious | `/observer/suspicious` | 不正検知 |
| 06 | challenge | `/observer/challenge` | Challenge提出 |
| 07 | challenge-status | `/observer/challenge/[id]` | Challenge状況 |
| 08 | earnings | `/observer/earnings` | 報酬 |
| 09 | history | `/observer/history` | 履歴 |
| 10 | stake | `/observer/stake` | ステーク管理 |
| 11 | exit | `/observer/exit` | 離脱申請 |
| 12 | settings | `/observer/settings` | 設定 |
| 13 | faq | `/observer/faq` | FAQ |
| 14 | help | `/observer/help` | ヘルプ |

### 8.3 ペルソナ: Observer

```yaml
ペルソナ: 高橋 美咲
年齢: 29歳
職業: セキュリティアナリスト（副業でObserver）
技術レベル: 4/5
目的: 不正を検知して報酬を得たい
課題:
  - 効率的に不正を発見する方法を知りたい
  - Challenge提出の手順を理解したい
  - 報酬の仕組みを把握したい
```

### 8.4 シーケンス詳細: Challenge提出

#### フロー図

```
[Dashboard] → [Suspicious検出] → [Challenge作成] → [Challenge確認] → [提出完了]
                   │                  │                │               │
              自動検知             詳細入力         署名・送信      結果待ち
```

#### 画面詳細: Suspicious検出 (`/observer/suspicious`)

**レイアウト（MUST）**

```
┌─────────────────────────────────────────────────────────────┐
│  [← ダッシュボード]                     Quantum Shield      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  不正疑いの検出                                              │
│                                                             │
│  フィルター                                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  [すべて] [署名不正] [タイムアウト] [その他]         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  検出リスト                                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  [Badge: danger] 署名不正                           │   │
│  │  Prover: 0xabc...def  |  TX: 0x123...456           │   │
│  │  検出時刻: 2026-01-22 10:30 JST                     │   │
│  │  [Challenge提出]                             →     │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │  [Badge: warning] タイムアウト                      │   │
│  │  Prover: 0xdef...ghi  |  TX: 0x456...789           │   │
│  │  検出時刻: 2026-01-22 09:15 JST                     │   │
│  │  [Challenge提出]                             →     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  💡 Challengeについて                               │   │
│  │  不正を検出した場合、Challengeを提出できます。       │   │
│  │  成功すると報酬を受け取れます。                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**状態管理（MUST）**

```typescript
interface SuspiciousListState {
  suspiciousList: SuspiciousItem[];
  filter: 'all' | 'signature' | 'timeout' | 'other';
  isLoading: boolean;
  error: string | null;
}

interface SuspiciousItem {
  id: string;
  type: 'signature' | 'timeout' | 'other';
  proverId: string;
  proverAddress: string;
  transactionHash: string;
  detectedAt: string;  // ISO8601
  status: 'detected' | 'challenged' | 'resolved';
}
```

#### 画面詳細: Challenge作成 (`/observer/challenge`)

**レイアウト（MUST）**

```
┌─────────────────────────────────────────────────────────────┐
│  [← 戻る]                               Quantum Shield      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Challenge提出                                               │
│                                                             │
│  対象取引                                                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  TX Hash: 0x123...456  [コピー]                     │   │
│  │  Prover: 0xabc...def                                │   │
│  │  検出タイプ: 署名不正                               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Challenge理由 (MUST)                                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  [●] 署名検証失敗                                   │   │
│  │  [○] 応答タイムアウト                               │   │
│  │  [○] 不正なデータ形式                               │   │
│  │  [○] その他                                         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  詳細説明 (任意)                                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  追加の説明があれば入力...                          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  証拠データ (SHOULD)                                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  📎 ファイルをドラッグ or クリックしてアップロード   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ────────────────────────────────────────────────────────   │
│                                                             │
│  Challenge費用                                               │
│  ├─ 提出手数料:      100 QS (成功時返金)                   │
│  └─ 予想報酬:        1,000 QS (成功時)                     │
│                                                             │
│  ⚠️ 虚偽のChallengeは担保を没収されます                     │
│                                                             │
│  [           Challengeを提出 (primary, lg)           ]      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**API（Mock）**

```typescript
// POST /api/challenge
Request: {
  transaction_hash: string;
  prover_address: string;
  reason: 'signature_invalid' | 'timeout' | 'invalid_data' | 'other';
  description?: string;
  evidence_file_url?: string;
}

Response: {
  challenge_id: string;
  status: 'submitted';
  fee_paid: string;
  estimated_reward: string;
  tx_hash: string;
  created_at: string;
}
```

### 8.5 シーケンス詳細: Earnings（報酬管理）

#### 画面詳細: Earnings (`/observer/earnings`)

**レイアウト（MUST）**

```
┌─────────────────────────────────────────────────────────────┐
│  [← ダッシュボード]                     Quantum Shield      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  報酬                                                        │
│                                                             │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐│
│  │ 総報酬         │  │ 請求可能       │  │ 請求済み      ││
│  │ 12,500 QS     │  │ 2,500 QS      │  │ 10,000 QS    ││
│  └────────────────┘  └────────────────┘  └────────────────┘│
│                                                             │
│  [         報酬を請求 (primary, lg)         ]               │
│                                                             │
│  ────────────────────────────────────────────────────────   │
│                                                             │
│  報酬履歴                                                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  2026-01-20  Challenge #1230 成功    +1,000 QS     │   │
│  │  2026-01-18  Challenge #1228 成功    +1,500 QS     │   │
│  │  2026-01-15  報酬請求               -5,000 QS     │   │
│  │  2026-01-10  Challenge #1220 成功    +2,000 QS     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [もっと見る]                                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**状態管理（MUST）**

```typescript
interface EarningsState {
  totalEarnings: string;
  claimable: string;
  claimed: string;
  history: EarningEntry[];
  isLoading: boolean;
  isClaiming: boolean;
  error: string | null;
}

interface EarningEntry {
  id: string;
  type: 'challenge_reward' | 'claim';
  amount: string;
  challengeId?: string;
  txHash?: string;
  createdAt: string;
}
```

### 8.6 実装チェックリスト: Observer

```
□ Consumer Appと同じパターンを適用
□ 不正検出タイプに応じたBadge色分け
  - signature_invalid → danger
  - timeout → warning
  - other → default
□ Challenge成功率・履歴の表示
□ 報酬計算の内訳説明
□ 虚偽Challengeのリスク警告
□ 証拠ファイルのアップロード機能
□ Challenge状態のリアルタイム更新
□ 自動検出アラートの通知設定
```

---

## 9. Explorer

### 9.1 概要

| 項目 | 内容 |
|------|------|
| 対象ユーザー | 一般公開（認証不要） |
| 画面数 | 14画面 |
| 主要機能 | ブロック検索、取引検索、統計 |

### 9.2 画面一覧

| # | 画面ID | URL | 説明 |
|---|--------|-----|------|
| 01 | landing | `/explorer/landing` | ランディング |
| 02 | blocks | `/explorer/blocks` | ブロック一覧 |
| 03 | block-detail | `/explorer/blocks/[id]` | ブロック詳細 |
| 04 | transactions | `/explorer/transactions` | 取引一覧 |
| 05 | tx-detail | `/explorer/transactions/[hash]` | 取引詳細 |
| 06 | accounts | `/explorer/accounts` | アカウント検索 |
| 07 | account-detail | `/explorer/accounts/[address]` | アカウント詳細 |
| 08 | provers | `/explorer/provers` | Prover一覧 |
| 09 | prover-detail | `/explorer/provers/[id]` | Prover詳細 |
| 10 | challenges | `/explorer/challenges` | Challenge一覧 |
| 11 | challenge-detail | `/explorer/challenges/[id]` | Challenge詳細 |
| 12 | stats | `/explorer/stats` | 統計 |
| 13 | search | `/explorer/search` | 検索結果 |
| 14 | api-docs | `/explorer/api` | API仕様 |

### 9.3 ペルソナ: Explorer

```yaml
ペルソナ: 誰でも（一般公開）
技術レベル: 1-5（様々）
目的:
  - 取引を検索・確認したい
  - Proverのパフォーマンスを確認したい
  - ネットワーク統計を見たい
特徴: 認証不要、読み取り専用
```

### 9.4 シーケンス詳細: 検索フロー

#### フロー図

```
[Landing] → [検索入力] → [検索結果] → [詳細画面]
                │             │            │
           検索クエリ     結果一覧      詳細表示
```

#### 画面詳細: Landing (`/explorer/landing`)

**レイアウト（MUST）**

```
┌─────────────────────────────────────────────────────────────┐
│           Quantum Shield Explorer                           │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  🔍 取引ハッシュ、アドレス、ブロックを検索...       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ネットワーク統計                                            │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐│
│  │ 総取引数       │  │ アクティブProver │  │ ロック総額    ││
│  │ 1,234,567     │  │ 42             │  │ 50,000 ETH   ││
│  └────────────────┘  └────────────────┘  └────────────────┘│
│                                                             │
│  最新ブロック                                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  #12345  |  2 txs  |  10秒前                    →  │   │
│  │  #12344  |  5 txs  |  22秒前                    →  │   │
│  │  #12343  |  1 tx   |  34秒前                    →  │   │
│  └─────────────────────────────────────────────────────┘   │
│  [すべてのブロックを見る →]                                  │
│                                                             │
│  最新取引                                                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  0xabc...  Lock    0.5 ETH   10秒前            →  │   │
│  │  0xdef...  Unlock  1.0 ETH   25秒前            →  │   │
│  │  0xghi...  Lock    2.0 ETH   40秒前            →  │   │
│  └─────────────────────────────────────────────────────┘   │
│  [すべての取引を見る →]                                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**状態管理（MUST）**

```typescript
interface ExplorerLandingState {
  stats: NetworkStats | null;
  latestBlocks: Block[];
  latestTransactions: Transaction[];
  isLoading: boolean;
  error: string | null;
}

interface NetworkStats {
  totalTransactions: number;
  activeProvers: number;
  totalLocked: string;
  totalLockedUsd: string;
}
```

#### 画面詳細: Transaction Detail (`/explorer/transactions/[hash]`)

**レイアウト（MUST）**

```
┌─────────────────────────────────────────────────────────────┐
│  [← 取引一覧]                       Quantum Shield Explorer │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  取引詳細                                                    │
│  [Badge: success] 成功                                      │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  取引ハッシュ                                       │   │
│  │  0x1234567890abcdef...                    [コピー]  │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │  タイプ:         Lock                               │   │
│  │  ステータス:     成功                               │   │
│  │  ブロック:       #12345                     →      │   │
│  │  タイムスタンプ: 2026-01-22 10:30:45 JST            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  送金情報                                                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  From: 0xabc...def                          →      │   │
│  │  To:   L1Vault (0x123...456)                →      │   │
│  │  金額: 0.5 ETH                                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  署名情報                                                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Prover: QS Prover #1 (0xpro...ver)         →      │   │
│  │  署名タイプ: Dilithium3                             │   │
│  │  検証: ✅ 有効                                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Gas情報                                                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Gas Used:    21,000                                │   │
│  │  Gas Price:   20 gwei                               │   │
│  │  手数料:      0.00042 ETH                           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**API（Mock）**

```typescript
// GET /api/explorer/tx/:hash
Response: {
  hash: string;
  type: 'lock' | 'unlock' | 'stake' | 'unstake' | 'vote' | 'other';
  status: 'pending' | 'success' | 'failed';
  block_number: number;
  timestamp: string;  // ISO8601
  from: string;
  to: string;
  value: string;
  prover_address?: string;
  signature_type: 'dilithium3';
  signature_valid: boolean;
  gas_used: number;
  gas_price: string;
  fee: string;
}
```

### 9.5 シーケンス詳細: Prover一覧・詳細

#### 画面詳細: Prover一覧 (`/explorer/provers`)

**レイアウト（MUST）**

```
┌─────────────────────────────────────────────────────────────┐
│  [← ホーム]                         Quantum Shield Explorer │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  アクティブProver一覧                                        │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  フィルター: [すべて] [アクティブ] [停止中]          │   │
│  │  ソート: [署名数] [稼働率] [ステーク額]              │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  #  Prover           ステータス  署名数   稼働率   │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │  1  QS Foundation    [Active]   50,000   99.9%  → │   │
│  │  2  Prover Alpha     [Active]   45,000   99.8%  → │   │
│  │  3  Secure Node      [Active]   40,000   99.5%  → │   │
│  │  4  Node Beta        [Paused]   35,000   98.0%  → │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [1] [2] [3] ... [10] [次へ →]                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 9.6 実装チェックリスト: Explorer

```
□ 認証不要で全画面アクセス可能
□ 検索機能
  - 取引ハッシュ検索
  - アドレス検索
  - ブロック番号検索
  - 自動判定（入力内容からタイプ判別）
□ ページネーション実装（20件/ページ）
□ リアルタイム更新（最新ブロック・取引）
□ レスポンシブテーブル（モバイル対応）
□ 外部リンク（Etherscan等）への導線
□ コピーボタン（ハッシュ、アドレス）
□ 時間表示は相対時間（○秒前）とISO両方
□ API仕様ページにOpenAPI形式で記載
```

---

## 10. Enterprise Admin

### 10.1 概要

| 項目 | 内容 |
|------|------|
| 対象ユーザー | 企業管理者（SaaS版） |
| 画面数 | 35画面 |
| 主要機能 | ユーザー管理、請求、Prover管理 |

### 10.2 画面カテゴリ

| カテゴリ | 画面数 | 説明 |
|---------|:------:|------|
| 認証・オンボーディング | 5 | ログイン、KYB、プラン選択 |
| ダッシュボード | 3 | メイン、統計、アラート |
| ユーザー管理 | 6 | 一覧、詳細、作成、権限 |
| Prover管理 | 5 | 専用Prover設定、監視 |
| 請求・支払い | 5 | 請求書、支払い方法、履歴 |
| 設定 | 6 | 組織、セキュリティ、API |
| ヘルプ・サポート | 5 | FAQ、チケット、連絡先 |

### 10.3 ペルソナ: Enterprise Admin

```yaml
ペルソナ: 田村 陽子
年齢: 45歳
職業: 大手企業のIT部門マネージャー
技術レベル: 3/5
目的: 社内の暗号資産管理を一元化したい
課題:
  - 複数ユーザーの権限管理
  - 請求・コスト管理
  - コンプライアンス対応
```

### 10.4 シーケンス詳細: User Management

#### フロー図

```
[Dashboard] → [Users一覧] → [User詳細] → [権限編集] → [保存完了]
                  │             │            │           │
              一覧表示       詳細確認     権限変更    更新完了
```

#### 画面詳細: Users一覧 (`/enterprise/users`)

**レイアウト（MUST）**

```
┌─────────────────────────────────────────────────────────────┐
│  [サイドバー]  │  ユーザー管理                              │
│               │                                            │
│  ダッシュボード│  [+ 新規ユーザー招待]                      │
│  ユーザー ←  │                                            │
│  Prover管理  │  ┌─────────────────────────────────────┐   │
│  請求        │  │  🔍 名前・メールで検索...            │   │
│  設定        │  └─────────────────────────────────────┘   │
│               │                                            │
│               │  フィルター: [すべて] [管理者] [一般]       │
│               │                                            │
│               │  ┌─────────────────────────────────────┐   │
│               │  │  名前         メール       権限  操作 │   │
│               │  ├─────────────────────────────────────┤   │
│               │  │  田中 太郎   tanaka@...   管理者  ⋮  │   │
│               │  │  山田 花子   yamada@...   一般    ⋮  │   │
│               │  │  鈴木 一郎   suzuki@...   一般    ⋮  │   │
│               │  └─────────────────────────────────────┘   │
│               │                                            │
│               │  [1] [2] [3] [次へ →]                      │
│               │                                            │
└───────────────┴────────────────────────────────────────────┘
```

**状態管理（MUST）**

```typescript
interface UsersListState {
  users: EnterpriseUser[];
  filter: 'all' | 'admin' | 'member';
  searchQuery: string;
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    totalPages: number;
    totalCount: number;
  };
}

interface EnterpriseUser {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
  status: 'active' | 'invited' | 'suspended';
  lastLoginAt?: string;
  createdAt: string;
}
```

#### 画面詳細: User招待 (`/enterprise/users/invite`)

**レイアウト（MUST）**

```
┌─────────────────────────────────────────────────────────────┐
│  [← ユーザー一覧]                       Enterprise Admin    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  新規ユーザー招待                                            │
│                                                             │
│  メールアドレス (MUST)                                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  user@example.com                                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  権限 (MUST)                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  [○] 管理者                                         │   │
│  │      全機能にアクセス可能                           │   │
│  │  [●] 一般                                           │   │
│  │      閲覧と基本操作のみ                             │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  メッセージ (任意)                                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  招待メッセージを入力...                            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [           招待を送信 (primary, lg)           ]           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 10.5 シーケンス詳細: Billing

#### 画面詳細: Billing Dashboard (`/enterprise/billing`)

**レイアウト（MUST）**

```
┌─────────────────────────────────────────────────────────────┐
│  [サイドバー]  │  請求・支払い                              │
│               │                                            │
│  ダッシュボード│  現在のプラン                              │
│  ユーザー    │  ┌─────────────────────────────────────┐   │
│  Prover管理  │  │  [Badge: gold] Enterprise Pro       │   │
│  請求 ←     │  │  月額: ¥500,000                      │   │
│  設定        │  │  更新日: 2026年2月1日                │   │
│               │  │  [プランを変更]                      │   │
│               │  └─────────────────────────────────────┘   │
│               │                                            │
│               │  今月の利用状況                            │
│               │  ┌────────────────┐  ┌────────────────┐   │
│               │  │ 署名数         │  │ ストレージ     │   │
│               │  │ 45,000/50,000 │  │ 8GB/10GB      │   │
│               │  │ [████████░░]  │  │ [████████░░]  │   │
│               │  └────────────────┘  └────────────────┘   │
│               │                                            │
│               │  請求履歴                                  │
│               │  ┌─────────────────────────────────────┐   │
│               │  │  2026-01  ¥500,000  支払済  [PDF]   │   │
│               │  │  2025-12  ¥500,000  支払済  [PDF]   │   │
│               │  └─────────────────────────────────────┘   │
│               │                                            │
└───────────────┴────────────────────────────────────────────┘
```

### 10.6 実装チェックリスト: Enterprise Admin

```
□ Consumer Appと同じパターンを適用
□ サイドバーナビゲーション
□ 権限に応じた機能制限
  - owner: 全機能
  - admin: ユーザー管理可、請求閲覧のみ
  - member: 閲覧のみ
□ ユーザー招待フロー（メール送信）
□ 請求書PDF出力
□ 利用状況のプログレスバー表示
□ 監査ログの表示
□ SSO設定（将来対応）
```

---

## 11. QS Admin

### 11.1 概要

| 項目 | 内容 |
|------|------|
| 対象ユーザー | 財団スタッフ |
| 画面数 | 61画面 |
| 主要機能 | プロトコル管理、Prover承認、Enterprise管理 |

### 11.2 画面カテゴリ

| カテゴリ | 画面数 | 説明 |
|---------|:------:|------|
| ダッシュボード | 5 | メイン、アラート、統計 |
| Prover管理 | 12 | 申請審査、監視、停止 |
| Observer管理 | 8 | 申請審査、Challenge確認 |
| Enterprise管理 | 10 | 契約、請求、サポート |
| ガバナンス管理 | 8 | 提案確認、投票管理 |
| システム管理 | 10 | パラメータ、緊急停止 |
| ログ・監査 | 8 | アクセスログ、監査証跡 |

### 11.3 ペルソナ: QS Admin

```yaml
ペルソナ: 財団スタッフ
技術レベル: 4-5/5
目的: プロトコル全体の健全性を維持する
責任:
  - Prover/Observer申請の審査・承認
  - Enterprise契約管理
  - 緊急時の対応（緊急停止等）
  - システムパラメータの調整
```

### 11.4 シーケンス詳細: Prover審査

#### フロー図

```
[Dashboard] → [申請一覧] → [申請詳細] → [審査] → [承認/却下]
                  │            │          │          │
              一覧表示      詳細確認    コメント    結果通知
```

#### 画面詳細: Prover申請一覧 (`/admin/provers/applications`)

**レイアウト（MUST）**

```
┌─────────────────────────────────────────────────────────────┐
│  [サイドバー]  │  Prover申請管理                            │
│               │                                            │
│  ダッシュボード│  フィルター                                │
│  Prover管理 ←│  ┌─────────────────────────────────────┐   │
│    申請一覧   │  │  [すべて] [審査待ち] [承認済] [却下]  │   │
│    アクティブ │  └─────────────────────────────────────┘   │
│    停止中     │                                            │
│  Observer管理│  ┌─────────────────────────────────────┐   │
│  Enterprise  │  │  組織名      申請日    ステータス 操作 │   │
│  ガバナンス  │  ├─────────────────────────────────────┤   │
│  システム    │  │  株式会社A   01/20   [審査待ち]  →  │   │
│  ログ        │  │  B社        01/18   [審査待ち]  →  │   │
│               │  │  C Inc.     01/15   [承認済]   詳細 │   │
│               │  └─────────────────────────────────────┘   │
│               │                                            │
└───────────────┴────────────────────────────────────────────┘
```

#### 画面詳細: Prover申請詳細 (`/admin/provers/applications/[id]`)

**レイアウト（MUST）**

```
┌─────────────────────────────────────────────────────────────┐
│  [← 申請一覧]                                QS Admin       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Prover申請詳細                                              │
│  [Badge: warning] 審査待ち                                  │
│                                                             │
│  基本情報                                                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  組織名:       株式会社A                            │   │
│  │  代表者:       佐藤 健二                            │   │
│  │  メール:       sato@example.com                     │   │
│  │  ノードURL:    https://prover.example.com   [テスト] │   │
│  │  申請日:       2026-01-20                           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  技術情報                                                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  GPU:          NVIDIA A100 x4                       │   │
│  │  帯域:         10Gbps                               │   │
│  │  ストレージ:   100TB NVMe                           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  担保情報                                                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ステーク額:   150,000 QS (最低: 100,000 QS) ✅     │   │
│  │  入金TX:       0xabc...def                  [確認]  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  審査コメント                                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  審査コメントを入力...                              │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [   却下 (danger)   ]  [   承認 (primary)   ]              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**状態管理（MUST）**

```typescript
interface ProverApplicationDetailState {
  application: ProverApplication | null;
  reviewComment: string;
  nodeTestResult: 'pending' | 'success' | 'failed' | null;
  isApproving: boolean;
  isRejecting: boolean;
  error: string | null;
}

interface ProverApplication {
  id: string;
  organizationName: string;
  representativeName: string;
  email: string;
  nodeUrl: string;
  gpuSpec: string;
  networkBandwidth: string;
  storageCapacity: string;
  stakeAmount: string;
  stakeTxHash: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewComment?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}
```

### 11.5 シーケンス詳細: 緊急停止

#### フロー図

```
[Dashboard] → [System] → [Emergency] → [確認ダイアログ] → [実行]
                             │              │              │
                        緊急停止画面    2FA認証        停止実行
```

#### 画面詳細: Emergency Stop (`/admin/system/emergency`)

**レイアウト（MUST）**

```
┌─────────────────────────────────────────────────────────────┐
│  [← システム管理]                                QS Admin   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ⚠️ 緊急停止                                                │
│                                                             │
│  現在のステータス                                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  [Badge: success] 正常稼働中                        │   │
│  │                                                     │   │
│  │  最終緊急停止: なし                                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  停止対象を選択                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  [□] Lock機能                                       │   │
│  │  [□] Unlock機能                                     │   │
│  │  [□] Prover登録                                     │   │
│  │  [□] すべて                                         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  停止理由 (MUST)                                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  停止理由を入力...                                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ⚠️ この操作はすべてのユーザーに影響します                   │
│  ⚠️ 実行には2FA認証が必要です                               │
│                                                             │
│  [           緊急停止を実行 (danger, lg)           ]        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**確認ダイアログ（MUST）**

```
┌─────────────────────────────────────────┐
│  ⚠️ 緊急停止の確認                        │
├─────────────────────────────────────────┤
│                                         │
│  以下の機能を停止します:                  │
│  • Lock機能                             │
│  • Unlock機能                           │
│                                         │
│  この操作は取り消せません。               │
│  本当に実行しますか？                    │
│                                         │
│  2FA認証コード                           │
│  ┌─────────────────────────────────┐   │
│  │  ______                         │   │
│  └─────────────────────────────────┘   │
│                                         │
│  [キャンセル]  [停止を実行]              │
│                                         │
└─────────────────────────────────────────┘
```

### 11.6 実装チェックリスト: QS Admin

```
□ Consumer Appと同じパターンを適用
□ 2段階のサイドバー（カテゴリ → 機能）
□ 権限レベル管理
  - super_admin: 緊急停止、パラメータ変更
  - admin: 申請審査、Enterprise管理
  - viewer: 閲覧のみ
□ 危険な操作には確認ダイアログ + 2FA
□ 操作ログの自動記録
□ ノード接続テスト機能
□ バッチ操作（複数申請の一括承認等）
□ ダッシュボードにアラート表示
□ 監査証跡のエクスポート機能
```

---

## 付録

### A. i18nキー一覧テンプレート

```json
{
  "{app}": {
    "{screen}": {
      "header": {
        "title": "",
        "subtitle": ""
      },
      "form": {
        "{field}": {
          "label": "",
          "placeholder": "",
          "hint": ""
        }
      },
      "summary": {
        "{item}": ""
      },
      "button": {
        "submit": "",
        "cancel": "",
        "back": ""
      },
      "error": {
        "{errorType}": ""
      },
      "success": {
        "title": "",
        "message": ""
      }
    }
  }
}
```

### B. API エンドポイント一覧

| アプリ | エンドポイント | メソッド | 説明 |
|--------|---------------|----------|------|
| Consumer | `/api/lock` | POST | Lock実行 |
| Consumer | `/api/lock/status/:id` | GET | Lock状況確認 |
| Consumer | `/api/unlock/initiate` | POST | Unlock開始 |
| Consumer | `/api/unlock/status/:id` | GET | Unlock状況確認 |
| Token Hub | `/api/stake` | POST | Stake実行 |
| Token Hub | `/api/rewards` | GET | 報酬確認 |
| Governance | `/api/proposals` | GET | 提案一覧 |
| Governance | `/api/vote` | POST | 投票 |

### C. コンポーネント使用ガイド

| 用途 | コンポーネント | variant | size |
|------|---------------|---------|------|
| メインCTA | `<Button>` | primary | lg |
| セカンダリ | `<Button>` | secondary | md |
| キャンセル | `<Button>` | ghost | md |
| 削除 | `<Button>` | danger | md |
| 状態表示 | `<Badge>` | gold/warning/success/danger | - |
| 金額入力 | `<Input>` | - | - |
| 期間選択 | カスタム RadioGroup | - | - |

### D. コンポーネントテンプレート

#### ページコンポーネント

```typescript
// apps/web/src/app/[locale]/consumer/lock/page.tsx
import { LockScreen } from '@/components/consumer/Lock';

export default function LockPage() {
  return <LockScreen />;
}
```

#### 画面コンポーネント

```typescript
// apps/web/src/components/consumer/Lock/index.tsx
'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

interface LockFormState {
  amount: string;
  period: 1 | 2 | 3 | 5;
  isSubmitting: boolean;
  error: string | null;
}

export function LockScreen() {
  const t = useTranslations('consumer');
  const router = useRouter();

  // 状態管理
  const [state, setState] = useState<LockFormState>({
    amount: '',
    period: 2,
    isSubmitting: false,
    error: null,
  });

  // 派生値（useMemoでメモ化）
  const unlockDate = useMemo(() => {
    const date = new Date();
    date.setFullYear(date.getFullYear() + state.period);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, [state.period]);

  // バリデーション
  const validate = useCallback((): boolean => {
    const amount = parseFloat(state.amount);
    if (isNaN(amount) || amount <= 0) {
      setState(prev => ({ ...prev, error: t('lock.error.invalidAmount') }));
      return false;
    }
    if (amount < 0.01) {
      setState(prev => ({ ...prev, error: t('lock.error.minAmount') }));
      return false;
    }
    return true;
  }, [state.amount, t]);

  // 送信ハンドラ
  const handleSubmit = useCallback(async () => {
    if (!validate()) return;

    setState(prev => ({ ...prev, isSubmitting: true, error: null }));

    try {
      // API呼び出し（後で実装）
      const params = new URLSearchParams({
        amount: parseFloat(state.amount).toFixed(2),
        period: state.period.toString(),
      });
      router.push(`/consumer/lock/processing?${params.toString()}`);
    } catch (error) {
      setState(prev => ({
        ...prev,
        isSubmitting: false,
        error: t('lock.error.generic'),
      }));
    }
  }, [state.amount, state.period, validate, router, t]);

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <h1 className="text-2xl font-bold">{t('lock.header.title')}</h1>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 金額入力 */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {t('lock.form.amount.label')}
            </label>
            <Input
              type="number"
              value={state.amount}
              onChange={e => setState(prev => ({ ...prev, amount: e.target.value }))}
              placeholder="0.00"
            />
          </div>

          {/* 期間選択 */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {t('lock.form.period.label')}
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 5].map(period => (
                <Button
                  key={period}
                  variant={state.period === period ? 'primary' : 'outline'}
                  onClick={() => setState(prev => ({ ...prev, period: period as 1|2|3|5 }))}
                >
                  {t(`lock.form.period.${period}year`)}
                </Button>
              ))}
            </div>
          </div>

          {/* サマリー */}
          <div className="bg-surface rounded-qs p-4 space-y-2">
            <div className="flex justify-between">
              <span>{t('lock.summary.amount')}</span>
              <span>{state.amount || '0.00'} ETH</span>
            </div>
            <div className="flex justify-between">
              <span>{t('lock.summary.unlockDate')}</span>
              <span>{unlockDate}</span>
            </div>
          </div>

          {/* エラー表示 */}
          {state.error && (
            <div className="text-danger text-sm">{state.error}</div>
          )}

          {/* 送信ボタン */}
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={handleSubmit}
            disabled={state.isSubmitting}
          >
            {state.isSubmitting ? t('lock.button.submitting') : t('lock.button.submit')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
```

### E. E2Eテストテンプレート

```typescript
// apps/web/e2e/consumer/lock.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Lock Screen', () => {
  test.beforeEach(async ({ page }) => {
    // 画面に移動
    await page.goto('/ja/consumer/lock');
  });

  test('should display lock form', async ({ page }) => {
    // タイトル確認
    await expect(page.getByRole('heading', { name: '資産をロック' })).toBeVisible();

    // フォーム要素確認
    await expect(page.getByPlaceholder('0.00')).toBeVisible();
    await expect(page.getByRole('button', { name: '2年' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'ロックする' })).toBeVisible();
  });

  test('should show validation error for invalid amount', async ({ page }) => {
    // 空の状態で送信
    await page.getByRole('button', { name: 'ロックする' }).click();

    // エラーメッセージ確認
    await expect(page.getByText('0より大きい金額を入力してください')).toBeVisible();
  });

  test('should navigate to processing on valid submit', async ({ page }) => {
    // 金額入力
    await page.getByPlaceholder('0.00').fill('0.5');

    // 期間選択
    await page.getByRole('button', { name: '2年' }).click();

    // 送信
    await page.getByRole('button', { name: 'ロックする' }).click();

    // 遷移確認
    await expect(page).toHaveURL(/\/consumer\/lock\/processing\?amount=0\.50&period=2/);
  });

  test('should be accessible', async ({ page }) => {
    // キーボードナビゲーション
    await page.keyboard.press('Tab');
    await expect(page.getByPlaceholder('0.00')).toBeFocused();

    // aria-label確認
    await expect(page.getByRole('button', { name: 'ロックする' })).toBeVisible();
  });
});
```

### F. ユニットテストテンプレート

```typescript
// apps/web/src/components/consumer/Lock/__tests__/Lock.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { LockScreen } from '../index';

// モック
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

const messages = {
  consumer: {
    lock: {
      header: { title: '資産をロック' },
      form: {
        amount: { label: 'ロックする金額' },
        period: { label: 'ロック期間', '1year': '1年', '2year': '2年', '3year': '3年', '5year': '5年' },
      },
      button: { submit: 'ロックする', submitting: '処理中...' },
      error: { invalidAmount: '0より大きい金額を入力してください' },
    },
  },
};

const renderWithIntl = (component: React.ReactElement) => {
  return render(
    <NextIntlClientProvider locale="ja" messages={messages}>
      {component}
    </NextIntlClientProvider>
  );
};

describe('LockScreen', () => {
  it('renders lock form', () => {
    renderWithIntl(<LockScreen />);

    expect(screen.getByText('資産をロック')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('0.00')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'ロックする' })).toBeInTheDocument();
  });

  it('shows error when amount is empty', async () => {
    renderWithIntl(<LockScreen />);

    fireEvent.click(screen.getByRole('button', { name: 'ロックする' }));

    await waitFor(() => {
      expect(screen.getByText('0より大きい金額を入力してください')).toBeInTheDocument();
    });
  });

  it('updates period selection', () => {
    renderWithIntl(<LockScreen />);

    const period3Button = screen.getByRole('button', { name: '3年' });
    fireEvent.click(period3Button);

    // 選択状態を確認（primary variantのスタイル）
    expect(period3Button).toHaveClass('bg-hinomaru');
  });
});
```

### G. Mock APIテンプレート

```typescript
// apps/web/src/app/api/lock/route.ts
import { NextRequest, NextResponse } from 'next/server';

interface LockRequest {
  amount: string;
  period_years: number;
}

interface LockResponse {
  lock_id: string;
  status: 'pending' | 'confirmed' | 'failed';
  amount: string;
  period_years: number;
  unlock_date: string;
  tx_hash: string;
  created_at: string;
}

// インメモリストレージ
const mockStorage = new Map<string, LockResponse>();

// ヘルパー関数
function generateId(): string {
  return `lock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateTxHash(): string {
  return `0x${Array.from({ length: 64 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('')}`;
}

function calculateUnlockDate(years: number): string {
  const date = new Date();
  date.setFullYear(date.getFullYear() + years);
  return date.toISOString();
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<LockResponse | { error: { code: string; message: string } }>> {
  try {
    const body: LockRequest = await request.json();

    // バリデーション
    const amount = parseFloat(body.amount);
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { error: { code: 'INVALID_AMOUNT', message: '金額が不正です' } },
        { status: 400 }
      );
    }

    if (amount < 0.01) {
      return NextResponse.json(
        { error: { code: 'MIN_AMOUNT', message: '最小ロック金額は0.01 ETHです' } },
        { status: 400 }
      );
    }

    // レスポンス生成
    const lockId = generateId();
    const response: LockResponse = {
      lock_id: lockId,
      status: 'pending',
      amount: body.amount,
      period_years: body.period_years,
      unlock_date: calculateUnlockDate(body.period_years),
      tx_hash: generateTxHash(),
      created_at: new Date().toISOString(),
    };

    mockStorage.set(lockId, response);

    // 開発用: 2秒後に confirmed に変更
    setTimeout(() => {
      const lock = mockStorage.get(lockId);
      if (lock) {
        lock.status = 'confirmed';
        mockStorage.set(lockId, lock);
      }
    }, 2000);

    return NextResponse.json(response);
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'サーバーエラー' } },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const lockId = request.nextUrl.searchParams.get('id');

  if (!lockId) {
    return NextResponse.json(
      { error: { code: 'MISSING_ID', message: 'IDが必要です' } },
      { status: 400 }
    );
  }

  const lock = mockStorage.get(lockId);
  if (!lock) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'ロックが見つかりません' } },
      { status: 404 }
    );
  }

  return NextResponse.json(lock);
}
```

---

## 更新履歴

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-22 | Claude | 初版作成。Lock学びを全シーケンスに反映 |
| 1.1 | 2026-01-22 | Claude | CP準拠チェック、セキュリティパターン、エラーハンドリング追加 |
| 1.2 | 2026-01-22 | Claude | 全8アプリの詳細仕様追記（ペルソナ、レイアウト、状態管理、API） |
| 1.3 | 2026-01-22 | Claude | コンポーネント・E2E・Unit Test・Mock APIテンプレート追加 |
