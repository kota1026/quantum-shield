# Backend Implementation Rules

> **Version**: 1.0
> **適用範囲**: Phase 8-C以降の全バックエンド実装

---

## Overview

このドキュメントはバックエンド実装時に**絶対遵守**するルールを定義する。
これらのルールに違反した実装は、Gate通過不可。

---

## Rule BE-001: スタブレスポンス禁止

### 定義

「スタブレスポンス」とは、実際の処理を行わずに固定値を返すレスポンスのこと。

### 禁止パターン

```rust
// ❌ 禁止: 常に空配列を返す
async fn get_users() -> Json<Vec<User>> {
    Json(vec![])
}

// ❌ 禁止: 常に成功を返す
async fn create_user() -> Json<Response> {
    Json(Response { success: true, message: "OK".into() })
}

// ❌ 禁止: 固定データを返す
async fn get_dashboard() -> Json<DashboardData> {
    Json(DashboardData {
        total_users: 100,      // 固定値
        total_volume: 1000000, // 固定値
    })
}

// ❌ 禁止: DB操作をスキップ
async fn update_user(id: i64) -> StatusCode {
    // DB操作なし
    StatusCode::OK
}
```

### 正しいパターン

```rust
// ✅ 正しい: 実際にDBを操作
async fn get_users(
    State(pool): State<PgPool>
) -> Result<Json<Vec<User>>, ApiError> {
    let users = sqlx::query_as!(User,
        "SELECT * FROM admin_users WHERE deleted_at IS NULL"
    )
    .fetch_all(&pool)
    .await?;

    Ok(Json(users))
}

// ✅ 正しい: 実際に作成してから結果を返す
async fn create_user(
    State(pool): State<PgPool>,
    Json(req): Json<CreateUserRequest>,
) -> Result<Json<User>, ApiError> {
    let user = sqlx::query_as!(User,
        r#"
        INSERT INTO admin_users (email, role, status)
        VALUES ($1, $2, 'active')
        RETURNING *
        "#,
        req.email,
        req.role
    )
    .fetch_one(&pool)
    .await?;

    Ok(Json(user))
}
```

### 検出方法

```bash
# スタブ検出スクリプト
node scripts/detect-stubs.js services/api/src/handlers/

# 検出パターン:
# - Json(vec![])
# - Json(Response { success: true
# - Ok(Json(固定値))
# - todo!() / unimplemented!()
```

---

## Rule BE-002: テスト用コード修正禁止

### 定義

テストを通すために本番コードを変更することは禁止。

### 禁止パターン

```rust
// ❌ 禁止: テスト用の条件分岐
async fn create_user(req: CreateUserRequest) -> Result<User, ApiError> {
    // テスト時はバリデーションスキップ
    if !cfg!(test) {
        validate_email(&req.email)?;
    }
    // ...
}

// ❌ 禁止: テスト用のフラグ
async fn process_transaction(req: TxRequest) -> Result<Tx, ApiError> {
    if req.skip_l3_signature {  // テスト用フラグ
        return Ok(create_dummy_tx());
    }
    // ...
}

// ❌ 禁止: エラーを握りつぶす
async fn get_user(id: i64) -> Json<Option<User>> {
    match fetch_user(id).await {
        Ok(user) => Json(Some(user)),
        Err(_) => Json(None),  // エラーを隠蔽
    }
}
```

### 正しいパターン

```rust
// ✅ 正しい: テスト用フィクスチャを使用
#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_utils::create_test_user;

    #[tokio::test]
    async fn test_create_user() {
        let pool = setup_test_db().await;
        // テストデータはフィクスチャで作成
        let user = create_test_user(&pool).await;
        // ...
    }
}

// ✅ 正しい: 環境変数で設定を切り替え（コード分岐なし）
// config/test.toml
// [api]
// skip_l3 = false  # テストでも本番と同じ

// ✅ 正しい: エラーを正しく返す
async fn get_user(id: i64) -> Result<Json<User>, ApiError> {
    let user = fetch_user(id).await
        .map_err(|e| ApiError::Database(e.to_string()))?;
    Ok(Json(user))
}
```

### 許可されるテスト関連コード

```rust
// ✅ 許可: テスト専用モジュール
#[cfg(test)]
mod tests {
    // テストコードはここに
}

// ✅ 許可: テスト用フィクスチャ（本番コードとは別ファイル）
// tests/fixtures/users.rs

// ✅ 許可: テスト環境用設定ファイル
// config/test.toml

// ✅ 許可: モックサーバー（E2Eテスト用、本番コードとは独立）
// e2e/mocks/api-mock.ts
```

---

## Rule BE-003: ログ出力必須

### 定義

全APIハンドラで以下のログを出力すること:

1. **リクエスト開始ログ**: エンドポイント、メソッド、ユーザーID
2. **DB操作ログ**: 実行するクエリの概要
3. **レスポンスログ**: ステータスコード、処理時間

### 必須ログパターン

```rust
use tracing::{info, debug, error, instrument};

#[instrument(skip(pool))]  // 関数全体を自動ログ
async fn get_users(
    State(pool): State<PgPool>,
    Extension(user): Extension<CurrentUser>,
) -> Result<Json<Vec<User>>, ApiError> {
    // 1. リクエスト開始ログ
    info!(
        user_id = %user.id,
        "Fetching user list"
    );

    // 2. DB操作ログ
    debug!("Executing: SELECT * FROM admin_users");

    let users = sqlx::query_as!(User, "SELECT * FROM admin_users")
        .fetch_all(&pool)
        .await
        .map_err(|e| {
            // エラーログ
            error!(error = %e, "Failed to fetch users");
            ApiError::Database(e.to_string())
        })?;

    // 3. レスポンスログ
    info!(
        count = users.len(),
        "User list fetched successfully"
    );

    Ok(Json(users))
}
```

### ログレベル指針

| Level | 用途 | 例 |
|-------|------|-----|
| `error` | エラー発生時 | DB接続失敗、認証エラー |
| `warn` | 警告（正常だが注意） | レート制限接近、非推奨API使用 |
| `info` | 重要な操作 | リクエスト開始/終了、状態変更 |
| `debug` | 詳細情報 | SQLクエリ、パラメータ |
| `trace` | 最詳細 | 関数の入出力値 |

### 検証方法

```bash
# ログ出力行数カウント
grep -r "tracing::" services/api/src/handlers/admin/ | wc -l

# 期待値: ハンドラ数 × 3 以上
# 55ハンドラ × 3 = 165行以上
```

---

## 違反検出スクリプト

### detect-stubs.js

```javascript
// scripts/detect-stubs.js

const fs = require('fs');
const path = require('path');
const glob = require('glob');

const STUB_PATTERNS = [
  { pattern: /Json\(vec!\[\]\)/g, name: 'Empty array response' },
  { pattern: /Json\(Response\s*\{\s*success:\s*true/g, name: 'Always-OK response' },
  { pattern: /todo!\(\)/g, name: 'TODO marker' },
  { pattern: /unimplemented!\(\)/g, name: 'Unimplemented marker' },
  { pattern: /StatusCode::(OK|CREATED)\s*$/gm, name: 'Status-only response (no body)' },
];

const REQUIRED_PATTERNS = [
  { pattern: /sqlx::query/, name: 'Database query' },
  { pattern: /tracing::(info|debug|warn|error)/, name: 'Logging' },
];

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const violations = [];

  // スタブ検出
  STUB_PATTERNS.forEach(({ pattern, name }) => {
    const matches = content.match(pattern);
    if (matches) {
      violations.push({
        type: 'STUB',
        rule: 'BE-001',
        name,
        count: matches.length,
        file: filePath
      });
    }
  });

  // ハンドラファイルかどうか判定
  const isHandler = /pub async fn \w+\(/.test(content);

  if (isHandler) {
    // 必須パターン欠落検出
    REQUIRED_PATTERNS.forEach(({ pattern, name }) => {
      if (!pattern.test(content)) {
        violations.push({
          type: 'MISSING',
          rule: pattern.toString().includes('sqlx') ? 'BE-001' : 'BE-003',
          name: `Missing: ${name}`,
          file: filePath
        });
      }
    });
  }

  return violations;
}

function main() {
  const targetDir = process.argv[2] || 'services/api/src/handlers/';
  const files = glob.sync(`${targetDir}/**/*.rs`);

  let totalViolations = 0;
  const allViolations = [];

  files.forEach(file => {
    const violations = scanFile(file);
    totalViolations += violations.length;
    allViolations.push(...violations);
  });

  // レポート出力
  console.log('## BE Rules Violation Report\n');
  console.log(`Files scanned: ${files.length}`);
  console.log(`Violations: ${totalViolations}\n`);

  if (totalViolations > 0) {
    console.log('| File | Rule | Type | Detail |');
    console.log('|------|------|------|--------|');

    allViolations.forEach(v => {
      console.log(`| ${v.file} | ${v.rule} | ${v.type} | ${v.name} |`);
    });

    process.exit(1);
  } else {
    console.log('✅ No violations found');
    process.exit(0);
  }
}

main();
```

---

## チェックリスト

実装時に以下を確認:

### BE-001: スタブレスポンス禁止

- [ ] 全ハンドラでDB操作を実行している
- [ ] 空配列を固定で返していない
- [ ] 常に成功を返していない
- [ ] 固定値のレスポンスがない

### BE-002: テスト用コード修正禁止

- [ ] `if cfg!(test)` がない
- [ ] テスト用フラグパラメータがない
- [ ] エラーを握りつぶしていない
- [ ] 本番とテストで同じコードパスを通る

### BE-003: ログ出力必須

- [ ] リクエスト開始時に`info`ログ
- [ ] DB操作時に`debug`ログ
- [ ] エラー時に`error`ログ
- [ ] 処理完了時に`info`ログ

---

**Document End**
