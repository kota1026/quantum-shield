# Lock機能 実装ガイド（検証用ミニドキュメント）

> **目的**: このドキュメントだけでLock機能を実装できるか検証する
> **スコープ**: 画面3つ + API 2つ + DB 2テーブル
> **検証方法**: このドキュメントを読んで実装し、不足した情報をリストアップする

---

## 1. 機能概要

### 1.1 Lock機能とは

ユーザーがETHなどの資産をQuantum Shield Vaultにロックし、量子耐性で保護する機能。

### 1.2 ユーザーフロー

```
[Dashboard] → [Lock入力] → [Lock確認] → [Lock処理中] → [Lock完了] → [Dashboard]
```

### 1.3 対象画面

| # | 画面ID | 画面名 | URL |
|---|--------|--------|-----|
| 1 | lock | Lock入力・確認 | `/ja/consumer/lock` |
| 2 | lock-processing | Lock処理中 | `/ja/consumer/lock/processing` |
| 3 | lock-success | Lock完了 | `/ja/consumer/lock/success` |

---

## 2. 画面仕様

### 2.1 Lock入力・確認画面 (`/consumer/lock`)

#### 2.1.1 レイアウト

```
┌─────────────────────────────────────────────────────────────┐
│  [← 戻る]                               Quantum Shield      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  資産をロック                                        │   │
│  │                                                     │   │
│  │  ロックする金額                                      │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │  [ETHアイコン]  0.00                    ETH │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  │  利用可能: 1.5 ETH                                  │   │
│  │                                                     │   │
│  │  ロック期間                                          │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │  [1年]  [2年]  [3年]  [5年]                 │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  │                                                     │   │
│  │  ────────────────────────────────────────────────   │   │
│  │                                                     │   │
│  │  ロック概要                                          │   │
│  │  ├─ ロック金額:      0.5 ETH                        │   │
│  │  ├─ ロック期間:      2年                            │   │
│  │  ├─ 解除可能日:      2028年1月22日                  │   │
│  │  └─ ネットワーク手数料: ~0.001 ETH                  │   │
│  │                                                     │   │
│  │  [           ロックする（primary, lg）           ]   │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### 2.1.2 コンポーネント仕様

| 要素 | コンポーネント | Props |
|------|---------------|-------|
| 戻るボタン | `<Button variant="ghost">` | leftIcon: ArrowLeft |
| 金額入力 | `<Input>` | type="number", rightElement: "ETH" |
| 期間選択 | `<RadioGroup>` | options: 1年/2年/3年/5年 |
| ロックボタン | `<Button variant="primary" size="lg" fullWidth>` | disabled: 金額未入力時 |

#### 2.1.3 状態管理

```typescript
interface LockFormState {
  amount: string;
  period: 1 | 2 | 3 | 5; // 年
  isSubmitting: boolean;
  error: string | null;
}
```

#### 2.1.4 バリデーション

| ルール | エラーメッセージ |
|--------|-----------------|
| 金額が0以下 | 「0より大きい金額を入力してください」 |
| 金額が残高超過 | 「残高が不足しています」 |
| 金額が最小値未満 (0.01 ETH) | 「最小ロック金額は0.01 ETHです」 |

#### 2.1.5 翻訳キー

```json
// locales/ja/consumer.json
{
  "lock": {
    "title": "資産をロック",
    "amountLabel": "ロックする金額",
    "amountPlaceholder": "0.00",
    "availableBalance": "利用可能: {{balance}} ETH",
    "periodLabel": "ロック期間",
    "period1y": "1年",
    "period2y": "2年",
    "period3y": "3年",
    "period5y": "5年",
    "summaryTitle": "ロック概要",
    "summaryAmount": "ロック金額",
    "summaryPeriod": "ロック期間",
    "summaryUnlockDate": "解除可能日",
    "summaryFee": "ネットワーク手数料",
    "submitButton": "ロックする",
    "errors": {
      "amountRequired": "金額を入力してください",
      "amountTooSmall": "最小ロック金額は0.01 ETHです",
      "insufficientBalance": "残高が不足しています"
    }
  }
}
```

---

### 2.2 Lock処理中画面 (`/consumer/lock/processing`)

#### 2.2.1 レイアウト

```
┌─────────────────────────────────────────────────────────────┐
│                                          Quantum Shield      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                                                             │
│                    [日の丸アニメーション]                    │
│                       (hinomaru-pulse)                      │
│                                                             │
│                                                             │
│                   ロック処理中...                            │
│                                                             │
│                   トランザクションを                         │
│                   ブロックチェーンに送信しています            │
│                                                             │
│                   ┌─────────────────────┐                   │
│                   │ ████████░░░░░░ 60%  │                   │
│                   └─────────────────────┘                   │
│                                                             │
│                   処理には数分かかる場合があります            │
│                   この画面を閉じないでください                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### 2.2.2 コンポーネント仕様

| 要素 | コンポーネント | Props/Notes |
|------|---------------|-------------|
| 日の丸 | `<HinomaruLogo>` | animate: true, size: "lg" |
| プログレスバー | `<Progress>` | value: pollingで更新 |
| テキスト | - | text-foreground-secondary |

#### 2.2.3 状態管理

```typescript
interface LockProcessingState {
  lockId: string;
  status: 'pending' | 'confirming' | 'confirmed' | 'failed';
  progress: number; // 0-100
  error: string | null;
}
```

#### 2.2.4 ポーリング

```typescript
// 5秒ごとにステータス確認
useEffect(() => {
  const interval = setInterval(async () => {
    const status = await fetchLockStatus(lockId);
    if (status === 'confirmed') {
      router.push(`/consumer/lock/success?id=${lockId}`);
    } else if (status === 'failed') {
      setError('トランザクションが失敗しました');
    }
  }, 5000);
  return () => clearInterval(interval);
}, [lockId]);
```

---

### 2.3 Lock完了画面 (`/consumer/lock/success`)

#### 2.3.1 レイアウト

```
┌─────────────────────────────────────────────────────────────┐
│                                          Quantum Shield      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                    [✓ 成功アイコン]                         │
│                       (success色)                           │
│                                                             │
│                   ロック完了！                               │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ロック詳細                                          │   │
│  │                                                     │   │
│  │  ロックID                                            │   │
│  │  0x1234...5678  [コピー]                            │   │
│  │                                                     │   │
│  │  ロック金額          0.5 ETH                         │   │
│  │  ロック期間          2年                             │   │
│  │  解除可能日          2028年1月22日                   │   │
│  │  ステータス          [Locked] (gold badge)           │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [     ダッシュボードに戻る（primary, lg）    ]             │
│                                                             │
│  [     取引履歴を見る（outline）    ]                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### 2.3.2 コンポーネント仕様

| 要素 | コンポーネント | Props |
|------|---------------|-------|
| 成功アイコン | `<CheckCircle>` | className: "text-success", size: 64 |
| ロックID | - | DM Mono, truncate中間省略 |
| コピーボタン | `<Button variant="ghost" size="icon">` | onClick: copyToClipboard |
| ステータスバッジ | `<Badge variant="gold">` | |
| ダッシュボードボタン | `<Button variant="primary" size="lg" fullWidth>` | |
| 履歴ボタン | `<Button variant="outline" fullWidth>` | |

---

## 3. API仕様

### 3.1 POST /lock

#### リクエスト

```typescript
// POST /api/lock
// Content-Type: application/json
// Authorization: Bearer <token>

interface LockRequest {
  amount: string;        // "0.5" (ETH単位、文字列)
  period_years: number;  // 1, 2, 3, 5
  dilithium_pubkey: string; // ユーザーのDilithium公開鍵
}
```

#### レスポンス（成功）

```typescript
// 200 OK
interface LockResponse {
  lock_id: string;       // "0x1234...5678"
  status: 'pending';
  amount: string;
  period_years: number;
  unlock_date: string;   // ISO 8601
  tx_hash: string;       // L1トランザクションハッシュ
  created_at: string;    // ISO 8601
}
```

#### レスポンス（エラー）

```typescript
// 400 Bad Request
interface ErrorResponse {
  error: {
    code: string;        // "INSUFFICIENT_BALANCE", "INVALID_AMOUNT", etc.
    message: string;     // 人間が読めるメッセージ
  };
}
```

#### エラーコード

| コード | 説明 | HTTPステータス |
|--------|------|---------------|
| INSUFFICIENT_BALANCE | 残高不足 | 400 |
| INVALID_AMOUNT | 金額が無効 | 400 |
| INVALID_PERIOD | 期間が無効 | 400 |
| UNAUTHORIZED | 認証エラー | 401 |
| INTERNAL_ERROR | サーバーエラー | 500 |

---

### 3.2 GET /status/:lock_id

#### リクエスト

```typescript
// GET /api/status/0x1234...5678
// Authorization: Bearer <token>
```

#### レスポンス

```typescript
// 200 OK
interface LockStatusResponse {
  lock_id: string;
  status: 'pending' | 'confirming' | 'confirmed' | 'failed';
  amount: string;
  period_years: number;
  unlock_date: string;
  tx_hash: string;
  confirmations: number; // ブロック確認数
  created_at: string;
  updated_at: string;
}
```

---

## 4. DB仕様

### 4.1 locks テーブル（オフチェーン）

```sql
CREATE TABLE locks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lock_id VARCHAR(66) NOT NULL UNIQUE,  -- 0x + 64文字
  user_id UUID NOT NULL REFERENCES users(id),
  amount DECIMAL(78, 0) NOT NULL,       -- wei単位
  period_years INTEGER NOT NULL,
  unlock_date TIMESTAMP NOT NULL,
  tx_hash VARCHAR(66),
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  confirmations INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_locks_user_id ON locks(user_id);
CREATE INDEX idx_locks_status ON locks(status);
```

### 4.2 L1 Vault Contract（オンチェーン）

```solidity
struct Lock {
    bytes32 lockId;
    address user;
    uint256 amount;
    uint256 unlockDate;
    bytes dilithiumPubkey;
    LockStatus status;
}

enum LockStatus { Pending, Confirmed, Unlocked }

mapping(bytes32 => Lock) public locks;
```

---

## 5. デザイン仕様

### 5.1 使用するコンポーネント

| コンポーネント | パス | 用途 |
|---------------|------|------|
| Button | `@/components/ui/button` | 全ボタン |
| Input | `@/components/ui/input` | 金額入力 |
| Card | `@/components/ui/card` | 概要カード |
| Badge | `@/components/ui/badge` | ステータス表示 |
| Progress | `@/components/ui/progress` | 処理進捗 |

### 5.2 カラー

| 用途 | Tailwindクラス |
|------|---------------|
| 背景 | `bg-background` |
| カード | `bg-card` |
| メインテキスト | `text-foreground` |
| サブテキスト | `text-foreground-secondary` |
| 成功 | `text-success` |
| ロック中バッジ | `bg-gold text-background` |

### 5.3 スペーシング

| 用途 | 値 |
|------|-----|
| ページpadding | `p-8` (32px) |
| カード内padding | `p-6` (24px) |
| 要素間 | `space-y-4` (16px) |
| ボタン間 | `space-y-3` (12px) |

---

## 6. 実装チェックリスト

### 6.1 画面実装

- [ ] Lock入力画面のレイアウト実装
- [ ] 金額入力のバリデーション
- [ ] 期間選択の実装
- [ ] ロックボタンの状態管理
- [ ] Lock処理中画面の実装
- [ ] ポーリングによるステータス確認
- [ ] Lock完了画面の実装
- [ ] ダッシュボードへの遷移

### 6.2 API接続

- [ ] POST /lock の呼び出し
- [ ] GET /status/:lock_id のポーリング
- [ ] エラーハンドリング
- [ ] ローディング状態の管理

### 6.3 i18n

- [ ] 日本語翻訳の追加
- [ ] 英語翻訳の追加
- [ ] t() 関数での参照

### 6.4 テスト

- [ ] 単体テスト
- [ ] E2Eテスト（Lock完了まで）

---

## 7. 検証結果記録欄

> 実装時に不足していた情報、曖昧だった点を記録する

### 7.1 不足していた情報

| # | 内容 | 影響度 |
|---|------|:------:|
| 1 | **ロック期間選択がない** - ドキュメントでは1年/2年/3年/5年選択を必須としているが、現在の実装には期間選択UIが存在しない | 高 |
| 2 | **LockSuccess画面で期間・解除日が未表示** - ドキュメントではロック期間と解除可能日の表示を必須としているが、実装では金額とtxHashのみ表示 | 中 |
| 3 | **API連携がモック状態** - `DEMO_BALANCE = 12.50`のハードコード値を使用。実際のAPI呼び出し（POST /lock, GET /status）が未実装 | 高 |
| 4 | **LockSuccess画面でコピーボタンがない** - ドキュメントではtxHashのコピー機能を必須としているが未実装 | 低 |
| 5 | **LockSuccess画面でステータスバッジがない** - ドキュメントでは`<Badge variant="gold">`でLocked表示を必須としているが未実装 | 低 |

### 7.2 曖昧だった点

| # | 内容 | 解釈した内容 |
|---|------|-------------|
| 1 | **i18nキー構造** - ドキュメントでは`lock.title`形式を提案しているが、実装では`consumer.lock.header.title`のようなネスト構造を使用 | 既存の構造に従うのが正しい |
| 2 | **Lock処理中のプログレスバー vs ステップ表示** - ドキュメントではプログレスバー形式を示唆しているが、実装ではステップリスト形式 | 両方とも有効。ステップリストの方が詳細な進捗を示せる |
| 3 | **日の丸アニメーション** - ドキュメントでは`<HinomaruLogo animate>`を指定しているが、実装ではCSS spinningで独自アニメーション | 既存実装で十分。ブランドアイデンティティは維持されている |
| 4 | **Quick Amount Buttons** - ドキュメントには記載なしだが、実装では25%/50%/75%/MAX選択がある | UX向上のため残すべき |

### 7.3 ドキュメント改善提案

| # | 提案 |
|---|------|
| 1 | **必須/任意の明確化**: 各コンポーネントに必須(MUST)/推奨(SHOULD)/任意(MAY)ラベルを付ける |
| 2 | **既存実装との差分明示**: 新規実装なのか既存改修なのかを明記する |
| 3 | **API Mock仕様の追加**: 開発段階でのMockデータ構造を定義し、段階的に実API接続できるようにする |
| 4 | **Quick Amount等のUX要素**: ドキュメントにないがUX向上に有効な機能を「拡張仕様」として記載 |
| 5 | **i18nキーの命名規則**: プロジェクト全体で統一した命名規則を別ドキュメントで定義 |

### 7.4 実装との対応状況

| 画面 | 実装状況 | 主な差分 |
|------|:--------:|----------|
| Lock入力 | ⚠️ 部分的 | 期間選択なし、概要セクションの構成が異なる |
| Lock処理中 | ✅ 完了 | プログレスバー→ステップ形式（許容範囲） |
| Lock完了 | ⚠️ 部分的 | 期間・解除日・コピー・バッジなし |

### 7.5 検証結論

**総合評価: ドキュメントは概ね有効だが、以下の改善が必要**

1. **ロック期間機能の設計見直し**
   - 現在の実装では期間選択がないため、仕様とズレている
   - ビジネス要件として期間選択が本当に必要か確認が必要

2. **段階的実装ガイドの追加**
   - UI実装 → Mock API → 実API → テストの段階を明示

3. **既存コードとの整合性チェック**
   - 新規ドキュメント作成時に既存実装を必ず確認

---

## 8. 実装後の最終結果

> 検証に基づいて実際に改修を行った結果を記録

### 8.1 実施した改修

| # | 改修内容 | 対応ファイル | 結果 |
|---|---------|-------------|:----:|
| 1 | ロック期間選択 (1/2/3/5年) 追加 | `Lock/index.tsx` | ✅ |
| 2 | ロック概要セクション追加 | `Lock/index.tsx` | ✅ |
| 3 | 確認モーダルに期間・解除日追加 | `Lock/index.tsx` | ✅ |
| 4 | LockSuccess画面に期間・解除日・バッジ追加 | `LockSuccess/index.tsx` | ✅ |
| 5 | コピーボタン追加 | `LockSuccess/index.tsx` | ✅ |
| 6 | 画面間パラメータ渡し (URLSearchParams) | Lock → Processing → Success | ✅ |
| 7 | Mock API追加 | `api/lock/route.ts`, `api/lock/status/[lockId]/route.ts` | ✅ |
| 8 | APIクライアント追加 | `lib/api/lock.ts` | ✅ |
| 9 | 日英翻訳追加 | `locales/ja/consumer.json`, `locales/en/consumer.json` | ✅ |

### 8.2 学んだこと（ドキュメント改善に反映すべき）

#### A. ドキュメント作成時の教訓

| # | 教訓 | 具体的な対策 |
|---|------|-------------|
| 1 | **既存実装を先に確認** | ドキュメント作成前に必ず現在のコードを読む |
| 2 | **i18nキー構造は既存に従う** | `consumer.lock.xxx` のようなネスト構造を維持 |
| 3 | **MUST/SHOULD/MAYを明記** | 各要素に必須度を明示する |
| 4 | **Mock APIパターンを標準化** | 開発フローにMock API作成を含める |

#### B. 実装時に有効だったパターン

| パターン | 説明 |
|---------|------|
| **URLSearchParams** | 画面間データ渡しにURLパラメータを使用 |
| **useMemo** | 解除日計算などの派生値にmemoを使用 |
| **コピー機能** | `navigator.clipboard.writeText` + 2秒後リセット |
| **Mock API** | Next.js Route Handlersで/api/xxxを作成 |

#### C. デザインシステムとの整合性

- Tailwindカスタムクラス (`rounded-qs`, `bg-surface`, `text-gold`) は問題なく動作
- Buttonコンポーネントの9バリエーションは十分
- Badge `gold` バリエーションでステータス表示に対応

### 8.3 ドキュメント更新計画

| ドキュメント | 更新内容 |
|-------------|---------|
| **DESIGN_SPEC_v3.md** | Consumer App Lock画面仕様を実装に合わせて更新 |
| **DATA_MODEL.md** | Mock APIパターンとエンドポイント追加 |
| **CODEBASE_MAP.md** | API, lib/apiフォルダ追加 |
| **DESIGN_SYSTEM.md** | 画面間データ渡しパターン追加 |

### 8.4 最終評価

**検証成功**: ミニドキュメントによる検証は有効だった

- ドキュメントの不足点を早期に発見できた
- 実装しながらドキュメントを改善するサイクルが機能した
- 今後の画面開発に適用可能なパターンを確立できた

**推奨**: 新しいアプリ/機能を追加する際は、このようなミニドキュメント検証を実施すること

---

## 更新履歴

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-22 | Claude | 初版作成（検証用） |
| 1.1 | 2026-01-22 | Claude | 検証結果記録。実装との差分分析、改善提案追加 |
| 1.2 | 2026-01-22 | Claude | 実装完了。最終結果、学んだこと、ドキュメント更新計画追加 |
