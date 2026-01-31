# Test Implementation Rules

> **Version**: 1.0
> **適用範囲**: Phase 8-E以降の全テスト実装

---

## Overview

E2Eテストおよび統合テストの実装ルール。
**テストが通ることと、システムが正しく動くことは同義でなければならない。**

---

## Rule TEST-001: 実環境テスト必須

### 定義

E2Eテストは、本番と同等の環境で実行すること。
モックで全てを代替することは禁止。

### 禁止パターン

```typescript
// ❌ 禁止: 全APIをモックで代替
test('should create user', async ({ page }) => {
  // 全てモックで対応
  await page.route('**/admin/users', (route) => {
    route.fulfill({
      status: 201,
      body: JSON.stringify({ id: 1, email: 'test@example.com' })
    });
  });

  await page.goto('/qs-admin/users');
  await page.click('[data-testid="create-user"]');
  // ...
});
```

### 正しいパターン

```typescript
// ✅ 正しい: 実際のAPIを使用
test('should create user', async ({ page, apiContext }) => {
  // 実際のAPIサーバーに接続
  await page.goto('/qs-admin/users');
  await page.click('[data-testid="create-user"]');
  await page.fill('[data-testid="email"]', 'newuser@example.com');
  await page.click('[data-testid="submit"]');

  // 実際にDBに作成されたか確認
  const response = await apiContext.get('/admin/users?email=newuser@example.com');
  const users = await response.json();
  expect(users.length).toBe(1);
});
```

### 例外: 外部サービスのモック

```typescript
// ✅ 許可: 外部サービス（メール送信等）のみモック
await page.route('**/api/sendgrid/**', (route) => {
  route.fulfill({ status: 200, body: '{"success": true}' });
});
```

---

## Rule TEST-002: データ整合性検証必須

### 定義

UIの表示結果だけでなく、バックエンドのデータ状態も検証すること。

### 禁止パターン

```typescript
// ❌ 禁止: UI表示のみ確認
test('should create transfer', async ({ page }) => {
  await page.goto('/qs-admin/treasury/transfers');
  await page.click('[data-testid="new-transfer"]');
  // フォーム入力...
  await page.click('[data-testid="submit"]');

  // UIに成功メッセージが出たから終わり
  await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
  // ← DBに作成されたか未確認
});
```

### 正しいパターン

```typescript
// ✅ 正しい: DB状態も確認
test('should create transfer', async ({ page, apiContext }) => {
  // 作成前のカウント取得
  const beforeResponse = await apiContext.get('/admin/treasury/transactions');
  const beforeCount = (await beforeResponse.json()).length;

  await page.goto('/qs-admin/treasury/transfers');
  await page.click('[data-testid="new-transfer"]');
  await page.selectOption('[data-testid="from-wallet"]', 'operational');
  await page.fill('[data-testid="amount"]', '1000');
  await page.click('[data-testid="submit"]');

  // UI確認
  await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();

  // DB確認
  const afterResponse = await apiContext.get('/admin/treasury/transactions');
  const afterCount = (await afterResponse.json()).length;
  expect(afterCount).toBe(beforeCount + 1);

  // 内容確認
  const transactions = await afterResponse.json();
  const newTx = transactions[transactions.length - 1];
  expect(newTx.amount).toBe('1000');
  expect(newTx.from_wallet).toBe('operational');
});
```

---

## Rule TEST-003: エラーケース検証必須

### 定義

正常系だけでなく、エラーケースも必ずテストすること。

### 必須エラーケース

| カテゴリ | テストケース |
|---------|-------------|
| API | 500エラー時のUI表示 |
| API | 404エラー時のUI表示 |
| API | 401/403エラー時のリダイレクト |
| バリデーション | 必須項目未入力 |
| バリデーション | 不正な値の入力 |
| 状態 | 空データ時の表示 |
| 状態 | ローディング中の表示 |

### テンプレート

```typescript
// エラーケーステストスイート
test.describe('Error Handling', () => {
  test('should handle API 500 error', async ({ page }) => {
    await page.route('**/admin/users', (route) => {
      route.fulfill({ status: 500, body: '{"error": "Internal Server Error"}' });
    });

    await page.goto('/qs-admin/users');

    // エラーメッセージ表示
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]'))
      .toContainText('エラーが発生しました');

    // リトライボタン表示
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
  });

  test('should handle empty state', async ({ page }) => {
    await page.route('**/admin/users', (route) => {
      route.fulfill({ status: 200, body: '[]' });
    });

    await page.goto('/qs-admin/users');

    // 空状態メッセージ
    await expect(page.locator('[data-testid="empty-state"]')).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/qs-admin/users/new');

    // 何も入力せずに送信
    await page.click('[data-testid="submit"]');

    // バリデーションエラー
    await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="email-error"]'))
      .toContainText('必須項目です');
  });
});
```

---

## Rule TEST-004: テスト独立性の確保

### 定義

各テストは独立して実行可能であること。
他のテストの結果に依存しないこと。

### 禁止パターン

```typescript
// ❌ 禁止: テスト間の依存
let createdUserId: number;

test('should create user', async ({ page }) => {
  // ユーザー作成
  createdUserId = ...; // 次のテストで使用
});

test('should update user', async ({ page }) => {
  // 前のテストで作成されたユーザーを更新
  await page.goto(`/qs-admin/users/${createdUserId}`);
  // ← 前のテストが失敗すると、このテストも失敗
});
```

### 正しいパターン

```typescript
// ✅ 正しい: 各テストでセットアップ
test('should update user', async ({ page, apiContext }) => {
  // このテスト用のユーザーを作成
  const response = await apiContext.post('/admin/users', {
    data: { email: 'update-test@example.com', role: 'viewer' }
  });
  const user = await response.json();

  // 更新テスト
  await page.goto(`/qs-admin/users/${user.id}`);
  await page.click('[data-testid="edit"]');
  // ...
});

// ✅ 正しい: beforeEachでセットアップ
test.describe('User Update', () => {
  let testUser: User;

  test.beforeEach(async ({ apiContext }) => {
    const response = await apiContext.post('/admin/users', {
      data: { email: `test-${Date.now()}@example.com`, role: 'viewer' }
    });
    testUser = await response.json();
  });

  test.afterEach(async ({ apiContext }) => {
    await apiContext.delete(`/admin/users/${testUser.id}`);
  });

  test('should update user email', async ({ page }) => {
    await page.goto(`/qs-admin/users/${testUser.id}`);
    // ...
  });
});
```

---

## Rule TEST-005: ログ整合性検証

### 定義

E2Eテストの結果とバックエンドログを照合すること。
07_log_verification.md に従って実行。

### 検証フロー

```
1. バックエンドログ収集開始
2. E2Eテスト実行
3. ログ収集終了
4. テスト期待値とログを照合
5. 不整合があればFAIL
```

### 期待ログパターン

各テストケースに対して、以下を定義:

```yaml
# config/expected-log-patterns.yaml
patterns:
  "should create user":
    - "API request started.*POST.*users"
    - "Executing query.*INSERT INTO admin_users"
    - "API request completed.*201"

  "should approve prover":
    - "API request started.*POST.*prover.*approve"
    - "L3 signature requested"
    - "Executing query.*UPDATE prover_registrations"
    - "API request completed.*200"
```

---

## チェックリスト

### TEST-001: 実環境テスト必須

- [ ] APIサーバーに実際に接続している
- [ ] DBに実際にデータが作成/更新されている
- [ ] モックは外部サービスのみ

### TEST-002: データ整合性検証必須

- [ ] UI表示とDB状態を両方確認している
- [ ] 作成/更新後にAPIで内容を検証している
- [ ] 削除後にAPIで存在しないことを確認している

### TEST-003: エラーケース検証必須

- [ ] APIエラー（500, 404, 401）のテストがある
- [ ] バリデーションエラーのテストがある
- [ ] 空状態のテストがある

### TEST-004: テスト独立性の確保

- [ ] 各テストが独立して実行可能
- [ ] beforeEach/afterEachでセットアップ/クリーンアップ
- [ ] テスト間でグローバル変数を共有していない

### TEST-005: ログ整合性検証

- [ ] テスト実行時にバックエンドログを収集している
- [ ] テスト結果とログを照合している
- [ ] 不整合がゼロ

---

**Document End**
