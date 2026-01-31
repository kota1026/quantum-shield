# Phase 8-C: Backend Implementation Prompt

> **Version**: 1.0
> **Trigger**: `Phase 8-C 開始` or `Phase 8-C {endpoint} 実装`
> **前提**: Phase 8-B Gate通過

---

## Overview

QS Admin APIバックエンドの実装。50+エンドポイントを実装し、**BE-001〜003ルールを厳守**。

```
Input:  API_SPECIFICATION.yaml, DATABASE_DESIGN.md
Output: Rust API実装 + DBマイグレーション
Gate:   テスト通過 + スタブ検出ゼロ
```

---

## 重要: バックエンドルール（BE_RULES.md）

このPrompt実行時は、以下のルールを**絶対遵守**:

```xml
<rule id="BE-001" level="ABSOLUTE">
  【スタブレスポンス禁止】

  以下は全て禁止:
  - 常に成功を返すハンドラ
  - 空配列を常に返すハンドラ
  - 固定データを返すハンドラ
  - DB操作なしで200 OKを返すハンドラ

  ❌ 禁止例:
  async fn get_users() -> Json<Vec<User>> {
      Json(vec![])  // 常に空配列
  }

  async fn create_transaction() -> Json<Response> {
      Json(Response { success: true })  // 常にOK
  }

  ✅ 正しい例:
  async fn get_users(
      State(pool): State<PgPool>
  ) -> Result<Json<Vec<User>>, ApiError> {
      let users = sqlx::query_as!(User,
          "SELECT * FROM admin_users WHERE deleted_at IS NULL"
      ).fetch_all(&pool).await?;

      Ok(Json(users))
  }
</rule>

<rule id="BE-002" level="ABSOLUTE">
  【テスト用コード修正禁止】

  テストを通すために本番コードを変更することは禁止。

  ❌ 禁止:
  - テスト時だけバリデーションをスキップ
  - テスト用の条件分岐を追加
  - エラーを握りつぶして200を返す

  ✅ 許可:
  - テスト用のフィクスチャ/シードデータ作成
  - テスト環境用の設定ファイル
  - モックサーバー（E2Eテスト用）
</rule>

<rule id="BE-003" level="ABSOLUTE">
  【ログ出力必須】

  全APIハンドラで以下のログを出力:

  1. リクエスト開始ログ
  2. DB操作ログ
  3. レスポンスログ（ステータス、所要時間）

  ログ出力がないハンドラは実装未完了とみなす。
</rule>
```

---

## 実装対象エンドポイント

### 認証 (5 endpoints)

| Method | Path | Handler | Priority |
|--------|------|---------|:--------:|
| POST | /admin/auth/login | `login` | P0 |
| POST | /admin/auth/logout | `logout` | P0 |
| POST | /admin/auth/refresh | `refresh_token` | P0 |
| GET | /admin/auth/me | `get_current_user` | P0 |
| POST | /admin/auth/2fa/verify | `verify_2fa` | P1 |

### ダッシュボード (3 endpoints)

| Method | Path | Handler | Priority |
|--------|------|---------|:--------:|
| GET | /admin/dashboard | `get_dashboard` | P0 |
| GET | /admin/dashboard/stats | `get_stats` | P0 |
| GET | /admin/dashboard/alerts | `get_alerts` | P0 |

### トランザクション (8 endpoints)

| Method | Path | Handler | Priority |
|--------|------|---------|:--------:|
| GET | /admin/transactions | `list_transactions` | P0 |
| GET | /admin/transactions/:id | `get_transaction` | P0 |
| GET | /admin/transactions/stats | `get_tx_stats` | P0 |
| GET | /admin/transactions/locks | `list_locks` | P0 |
| GET | /admin/transactions/unlocks | `list_unlocks` | P0 |
| GET | /admin/transactions/emergency | `list_emergency` | P0 |
| GET | /admin/transactions/challenges | `list_challenges` | P0 |
| POST | /admin/transactions/:id/review | `review_transaction` | P1 |

### ユーザー (6 endpoints)

| Method | Path | Handler | Priority |
|--------|------|---------|:--------:|
| GET | /admin/users | `list_users` | P0 |
| GET | /admin/users/:id | `get_user` | P0 |
| PUT | /admin/users/:id | `update_user` | P1 |
| POST | /admin/users/:id/suspend | `suspend_user` | P1 |
| GET | /admin/users/:id/wallets | `get_user_wallets` | P1 |
| GET | /admin/users/:id/transactions | `get_user_transactions` | P1 |

### Prover (6 endpoints)

| Method | Path | Handler | Priority |
|--------|------|---------|:--------:|
| GET | /admin/prover | `list_provers` | P0 |
| GET | /admin/prover/:id | `get_prover` | P0 |
| GET | /admin/prover/requests | `list_prover_requests` | P0 |
| POST | /admin/prover/requests/:id/approve | `approve_prover` | P0 |
| POST | /admin/prover/requests/:id/reject | `reject_prover` | P0 |
| POST | /admin/prover/:id/suspend | `suspend_prover` | P1 |

### Observer (4 endpoints)

| Method | Path | Handler | Priority |
|--------|------|---------|:--------:|
| GET | /admin/observer | `list_observers` | P0 |
| GET | /admin/observer/:id | `get_observer` | P0 |
| POST | /admin/observer/:id/suspend | `suspend_observer` | P1 |
| GET | /admin/observer/stats | `get_observer_stats` | P1 |

### Treasury (10 endpoints)

| Method | Path | Handler | Priority |
|--------|------|---------|:--------:|
| GET | /admin/treasury | `get_treasury_dashboard` | P0 |
| GET | /admin/treasury/wallets | `list_wallets` | P0 |
| GET | /admin/treasury/wallets/:id | `get_wallet` | P0 |
| GET | /admin/treasury/transactions | `list_treasury_tx` | P0 |
| POST | /admin/treasury/transfers | `create_transfer` | P0 |
| POST | /admin/treasury/transfers/:id/approve | `approve_transfer` | P0 |
| GET | /admin/treasury/budget | `get_budget` | P1 |
| POST | /admin/treasury/budget/allocate | `allocate_budget` | P1 |
| GET | /admin/treasury/audit | `get_audit_trail` | P1 |
| GET | /admin/treasury/revenue | `get_revenue` | P1 |

### Governance (5 endpoints)

| Method | Path | Handler | Priority |
|--------|------|---------|:--------:|
| GET | /admin/governance/proposals | `list_proposals` | P1 |
| GET | /admin/governance/proposals/:id | `get_proposal` | P1 |
| GET | /admin/governance/voting | `get_voting_stats` | P1 |
| POST | /admin/governance/proposals/:id/cancel | `cancel_proposal` | P2 |
| GET | /admin/governance/delegation | `get_delegation_stats` | P2 |

### その他 (8 endpoints)

| Method | Path | Handler | Priority |
|--------|------|---------|:--------:|
| GET | /admin/members | `list_members` | P1 |
| POST | /admin/members | `create_member` | P1 |
| GET | /admin/support/tickets | `list_tickets` | P2 |
| GET | /admin/announcements | `list_announcements` | P2 |
| POST | /admin/announcements | `create_announcement` | P2 |
| GET | /admin/analytics/* | `get_analytics` | P2 |
| GET | /admin/system/logs | `get_system_logs` | P2 |
| POST | /admin/system/maintenance | `set_maintenance` | P2 |

**合計: 55 endpoints**

---

## 実装パイプライン

```
┌─────────────────────────────────────────────────────────────────┐
│  Backend Implementation Pipeline                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  STEP 1: DBスキーマ適用                                         │
│  ├─→ prisma/schema.prisma 確認                                 │
│  ├─→ npx prisma migrate dev                                    │
│  └─→ npx prisma generate                                       │
│                                                                 │
│  STEP 2: 型定義確認                                             │
│  ├─→ services/api/src/types.rs 確認                            │
│  └─→ 不足があれば追加                                          │
│                                                                 │
│  STEP 3: ハンドラ実装                                           │
│  ├─→ services/api/src/handlers/admin/*.rs                      │
│  ├─→ BE-001〜003 ルール厳守                                    │
│  └─→ ログ出力実装                                              │
│                                                                 │
│  STEP 4: ルート登録                                             │
│  └─→ services/api/src/routes/admin.rs                          │
│                                                                 │
│  STEP 5: 単体テスト                                             │
│  ├─→ services/api/src/handlers/admin/*_test.rs                 │
│  └─→ cargo test                                                │
│                                                                 │
│  STEP 6: スタブ検出スキャン                                     │
│  └─→ BE-001違反がないか自動検証                                │
│                                                                 │
│  STEP 7: 進捗更新                                               │
│  └─→ PHASE8_PROGRESS.md 更新                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## コードテンプレート

### ハンドラ（正しい実装例）

```rust
// services/api/src/handlers/admin/users.rs

use axum::{
    extract::{Path, Query, State},
    Json,
};
use sqlx::PgPool;
use tracing::{info, debug, instrument};

use crate::{
    error::ApiError,
    models::admin::{AdminUser, UserListQuery},
};

/// ユーザー一覧取得
#[instrument(skip(pool))]
pub async fn list_users(
    State(pool): State<PgPool>,
    Query(query): Query<UserListQuery>,
) -> Result<Json<Vec<AdminUser>>, ApiError> {
    // ログ: リクエスト開始
    info!(
        limit = query.limit,
        offset = query.offset,
        "Fetching user list"
    );

    // DB操作
    let sql = r#"
        SELECT id, email, role, status, created_at, updated_at
        FROM admin_users
        WHERE deleted_at IS NULL
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2
    "#;

    debug!(sql = sql, "Executing query");

    let users = sqlx::query_as::<_, AdminUser>(sql)
        .bind(query.limit.unwrap_or(50))
        .bind(query.offset.unwrap_or(0))
        .fetch_all(&pool)
        .await
        .map_err(|e| {
            tracing::error!(error = %e, "Failed to fetch users");
            ApiError::Database(e.to_string())
        })?;

    // ログ: レスポンス
    info!(count = users.len(), "User list fetched successfully");

    Ok(Json(users))
}

/// ユーザー詳細取得
#[instrument(skip(pool))]
pub async fn get_user(
    State(pool): State<PgPool>,
    Path(user_id): Path<uuid::Uuid>,
) -> Result<Json<AdminUser>, ApiError> {
    info!(user_id = %user_id, "Fetching user details");

    let user = sqlx::query_as::<_, AdminUser>(
        "SELECT * FROM admin_users WHERE id = $1 AND deleted_at IS NULL"
    )
    .bind(user_id)
    .fetch_optional(&pool)
    .await
    .map_err(|e| ApiError::Database(e.to_string()))?
    .ok_or_else(|| ApiError::NotFound(format!("User {} not found", user_id)))?;

    info!(user_id = %user_id, "User details fetched");

    Ok(Json(user))
}
```

### ルート登録

```rust
// services/api/src/routes/admin.rs

use axum::{
    routing::{get, post, put, delete},
    Router,
};

use crate::handlers::admin::*;

pub fn admin_routes() -> Router<AppState> {
    Router::new()
        // Auth
        .route("/auth/login", post(auth::login))
        .route("/auth/logout", post(auth::logout))
        .route("/auth/me", get(auth::get_current_user))

        // Dashboard
        .route("/dashboard", get(dashboard::get_dashboard))
        .route("/dashboard/stats", get(dashboard::get_stats))

        // Users
        .route("/users", get(users::list_users))
        .route("/users/:id", get(users::get_user))
        .route("/users/:id", put(users::update_user))

        // Prover
        .route("/prover", get(prover::list_provers))
        .route("/prover/requests", get(prover::list_requests))
        .route("/prover/requests/:id/approve", post(prover::approve))

        // Treasury
        .route("/treasury", get(treasury::get_dashboard))
        .route("/treasury/wallets", get(treasury::list_wallets))
        .route("/treasury/transfers", post(treasury::create_transfer))
        .route("/treasury/transfers/:id/approve", post(treasury::approve_transfer))

        // ... 他のルート
}
```

---

## スタブ検出スキャン

実装完了後、以下のスクリプトでBE-001違反を自動検出:

```javascript
// scripts/detect-stubs.js

const fs = require('fs');
const path = require('path');

const STUB_PATTERNS = [
  /Json\(vec!\[\]\)/g,                    // 空配列
  /Json\(Response\s*\{\s*success:\s*true/g, // 常にOK
  /Ok\(Json\([^)]*\)\)\s*$/gm,            // DB操作なしでOK
  /todo!\(\)/g,                           // 未実装マーカー
  /unimplemented!\(\)/g,                  // 未実装マーカー
];

const REQUIRED_PATTERNS = [
  /sqlx::query/,                          // DB操作
  /tracing::(info|debug|error)/,          // ログ出力
];

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const issues = [];

  // スタブパターン検出
  STUB_PATTERNS.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      issues.push({
        type: 'STUB_DETECTED',
        pattern: pattern.toString(),
        count: matches.length
      });
    }
  });

  // 必須パターン欠落検出
  REQUIRED_PATTERNS.forEach(pattern => {
    if (!pattern.test(content)) {
      issues.push({
        type: 'MISSING_REQUIRED',
        pattern: pattern.toString()
      });
    }
  });

  return issues;
}

// 使用例
// node scripts/detect-stubs.js services/api/src/handlers/admin/
```

---

## 完了レポートテンプレート

```markdown
## Backend Implementation Report: {category}

### 実装情報
- カテゴリ: {category}
- エンドポイント数: {count}
- 実装日時: {timestamp}

### 実装したエンドポイント

| Method | Path | Handler | Test | Log |
|--------|------|---------|:----:|:---:|
| GET | /admin/users | list_users | ✅ | ✅ |
| GET | /admin/users/:id | get_user | ✅ | ✅ |
| ... | ... | ... | ... | ... |

### BE-001〜003 検証

| Rule | Check | Status |
|------|-------|:------:|
| BE-001 | スタブ検出スキャン | ✅ 0件 |
| BE-002 | テスト用コード検出 | ✅ なし |
| BE-003 | ログ出力確認 | ✅ 全ハンドラ |

### テスト結果

```
cargo test --package api -- admin
running 15 tests
test handlers::admin::users::tests::test_list_users ... ok
test handlers::admin::users::tests::test_get_user ... ok
...
test result: ok. 15 passed; 0 failed
```

### 次のカテゴリ
→ {next_category}
```

---

## Gate 8-C 通過条件

```yaml
必須条件:
  - 全55エンドポイント実装完了
  - 全単体テスト通過
  - スタブ検出スキャン: 0件
  - 全ハンドラにログ出力あり

検証コマンド:
  # 1. テスト実行
  cargo test --package api

  # 2. スタブ検出
  node scripts/detect-stubs.js services/api/src/handlers/admin/

  # 3. ログ出力行数カウント
  grep -r "tracing::" services/api/src/handlers/admin/ | wc -l
  # → 最低 55 * 3 = 165行以上
```

---

**Document End**
