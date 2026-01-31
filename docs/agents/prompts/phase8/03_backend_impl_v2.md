# Phase 8-C: Backend Implementation Prompt v2

> **Version**: 2.0
> **Trigger**: `Phase 8-C 開始` / `Phase 8-C {category} 実装`
> **前提**: Phase 8-B Gate通過

---

## Quick Start

```
Phase 8-C 開始           ← 次の未実装カテゴリから自動開始
Phase 8-C auth 実装      ← 認証エンドポイント実装
Phase 8-C dashboard 実装 ← ダッシュボードエンドポイント実装
Phase 8-C 進捗確認       ← 現在の進捗表示
```

---

## PHASE 0: 初期化（トリガー検出時に必ず実行）

### 0.1 必須ファイル読み込み（並列実行）

```
READ PARALLEL:
├── docs/specs/DATABASE_DESIGN.md       ← テーブル定義・リレーション
├── docs/specs/API_SPECIFICATION.yaml   ← エンドポイント定義
├── docs/agents/prompts/rules/BE_RULES.md ← BE-001~003ルール
├── docs/phase8/PHASE8_PROGRESS.md      ← 現在の進捗
└── services/api/src/routes/admin.rs    ← 既存実装確認
```

### 0.2 実装対象カテゴリ特定

PHASE8_PROGRESS.mdから「Status = Pending」の最初のカテゴリを特定:

```markdown
## 実装カテゴリ一覧

| # | Category | Endpoints | Priority | Status |
|---|----------|:---------:|:--------:|:------:|
| 1 | auth | 5 | P0 | Pending |
| 2 | dashboard | 3 | P0 | Done |
| 3 | transactions | 8 | P0 | Pending |
| 4 | users | 6 | P0 | Pending |
| 5 | prover | 6 | P0 | Done |
| 6 | observer | 4 | P0 | Pending |
| 7 | treasury | 10 | P0 | Pending |
| 8 | governance | 5 | P1 | Pending |
| 9 | members | 2 | P1 | Pending |
| 10 | support | 2 | P2 | Pending |
| 11 | announcements | 2 | P2 | Pending |
| 12 | analytics | 4 | P2 | Pending |
| 13 | system | 2 | P2 | Pending |
```

### 0.3 初期化完了報告

```markdown
## Phase 8-C 初期化完了

### 読み込んだファイル
- DATABASE_DESIGN.md: ✅
- API_SPECIFICATION.yaml: ✅
- BE_RULES.md: ✅
- PHASE8_PROGRESS.md: ✅

### 実装対象
- カテゴリ: {category}
- エンドポイント数: {count}
- 優先度: {priority}

### 既存実装状況
- 完了: {done_count}/55
- 残り: {remaining_count}
```

---

## PHASE 1: エンドポイント実装パイプライン

各エンドポイントに対して以下を**順次実行**:

```
┌─────────────────────────────────────────────────────────────────────┐
│  ENDPOINT IMPLEMENTATION PIPELINE                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  STEP 1: 仕様抽出                                                   │
│  ├─→ API_SPECIFICATION.yaml から該当エンドポイント取得              │
│  ├─→ REQUEST/RESPONSE スキーマ特定                                  │
│  └─→ DATABASE_DESIGN.md から必要テーブル特定                        │
│                                                                     │
│  STEP 2: 型定義                                                     │
│  ├─→ services/api/src/routes/admin.rs に型追加                      │
│  └─→ 既存型との重複確認                                            │
│                                                                     │
│  STEP 3: ハンドラ実装                                               │
│  ├─→ BE-001: 実DB操作（sqlx::query）                               │
│  ├─→ BE-002: テスト用分岐なし                                      │
│  ├─→ BE-003: 3種ログ（開始/DB操作/完了）                           │
│  └─→ エラーハンドリング（ApiError使用）                            │
│                                                                     │
│  STEP 4: ルート登録                                                 │
│  └─→ services/api/src/main.rs に追加                               │
│                                                                     │
│  STEP 5: スタブ検出スキャン                                         │
│  └─→ scripts/detect-stubs.sh 実行                                  │
│                                                                     │
│  STEP 6: 進捗更新                                                   │
│  └─→ PHASE8_PROGRESS.md 自動更新                                   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## PHASE 2: 実装テンプレート

### 2.1 API仕様からの型生成

**API_SPECIFICATION.yamlの該当部分を読み取り、Rust型を生成:**

```yaml
# API_SPECIFICATION.yaml の例
/admin/users:
  get:
    responses:
      200:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UserListResponse'
```

↓ 自動変換

```rust
// services/api/src/routes/admin.rs

#[derive(Debug, Serialize)]
pub struct UserListResponse {
    pub users: Vec<UserListItem>,
    pub total: i64,
}

#[derive(Debug, Serialize)]
pub struct UserListItem {
    pub id: String,
    pub wallet_address: String,
    pub status: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
}
```

### 2.2 DATABASE_DESIGN.mdからのクエリ生成

**テーブル定義を読み取り、SQLクエリを生成:**

```sql
-- DATABASE_DESIGN.md から
-- users テーブル: wallet_address, pk_dilithium, created_at, last_active
-- user_settings テーブル: wallet_address, email, language, ...

-- 生成するクエリ
SELECT
    u.wallet_address,
    u.created_at,
    u.last_active,
    us.email,
    us.language
FROM users u
LEFT JOIN user_settings us ON u.wallet_address = us.wallet_address
WHERE u.wallet_address = $1
```

### 2.3 ハンドラ実装（BE-001~003準拠）

```rust
/// GET /admin/users
///
/// BE-001: Real database query (no stub)
/// BE-002: No test-specific code
/// BE-003: 3-tier logging (request/db/response)
#[instrument(skip(state))]
pub async fn list_users(
    Extension(state): Extension<Arc<AppState>>,
    Query(params): Query<PaginationParams>,
) -> Result<Json<UserListResponse>, ApiError> {
    // BE-003: リクエスト開始ログ
    info!(
        limit = params.limit,
        offset = params.offset,
        "Admin: Listing users - request started"
    );

    let pool = state.db.pool();

    // BE-003: DB操作ログ
    debug!("Executing: SELECT users with pagination");

    // BE-001: 実DB操作
    let users = sqlx::query_as!(
        UserRow,
        r#"
        SELECT
            u.wallet_address,
            u.created_at,
            u.last_active,
            COALESCE(us.email, '') as email
        FROM users u
        LEFT JOIN user_settings us ON u.wallet_address = us.wallet_address
        ORDER BY u.created_at DESC
        LIMIT $1 OFFSET $2
        "#,
        params.limit.unwrap_or(50) as i64,
        params.offset.unwrap_or(0) as i64
    )
    .fetch_all(pool)
    .await
    .map_err(|e| {
        error!(error = %e, "Failed to fetch users");
        ApiError::Database(e.to_string())
    })?;

    // BE-001: 総件数も実DB操作
    let total = sqlx::query_scalar!(
        "SELECT COUNT(*) FROM users"
    )
    .fetch_one(pool)
    .await
    .map_err(|e| ApiError::Database(e.to_string()))?
    .unwrap_or(0);

    // BE-003: レスポンスログ
    info!(
        count = users.len(),
        total = total,
        "Admin: Users listed successfully"
    );

    Ok(Json(UserListResponse {
        users: users.into_iter().map(|u| u.into()).collect(),
        total,
    }))
}
```

---

## PHASE 3: 進捗自動更新

### 3.1 エンドポイント完了時の更新

エンドポイント実装完了後、**必ず**以下を実行:

```markdown
## 進捗更新チェックリスト

1. [ ] PHASE8_PROGRESS.md を開く
2. [ ] 該当エンドポイントの行を更新:
   - Impl: ⬜ → ✅
   - Test: ⬜ → ✅ (テスト作成時)
   - Log: ⬜ → ✅
   - Status: Pending → Done
3. [ ] カテゴリ完了時は Progress 行も更新
4. [ ] Overview Dashboard の数値を更新
```

### 3.2 自動更新コマンド

```bash
# 進捗更新用ヘルパースクリプト
./scripts/update-backend-progress.sh {endpoint_number} done

# 例: エンドポイント06 (GET /admin/users) を完了に
./scripts/update-backend-progress.sh 06 done
```

### 3.3 更新テンプレート

```markdown
## 更新前:
| 06 | GET | /admin/users | ⬜ | ⬜ | ⬜ | Pending |

## 更新後:
| 06 | GET | /admin/users | ✅ | - | ✅ | Done |
```

---

## PHASE 4: スタブ検出自動化

### 4.1 実装後スキャン

各カテゴリ実装完了後、**必ず**スタブ検出スキャンを実行:

```bash
cd services/api
./scripts/detect-stubs.sh src/routes/admin.rs
```

### 4.2 検出パターン

| パターン | ルール | 深刻度 |
|----------|--------|:------:|
| `Json(vec![])` | BE-001 | Critical |
| `success: true` (固定) | BE-001 | Critical |
| `todo!()` | BE-001 | Critical |
| `sqlx::query` なし | BE-001 | Critical |
| `tracing::` なし | BE-003 | High |

### 4.3 検出時の対応

```markdown
## スタブ検出時のアクション

1. 違反箇所を特定
2. DATABASE_DESIGN.md から正しいクエリを生成
3. ハンドラを修正（実DB操作に置き換え）
4. 再スキャン
5. 0件になるまで繰り返し
```

---

## PHASE 5: カテゴリ完了報告

### 5.1 報告テンプレート

```markdown
## Backend Implementation Report: {category}

### 実装情報
- カテゴリ: {category}
- エンドポイント数: {count}
- 実装日時: {timestamp}

### 実装したエンドポイント

| # | Method | Path | Impl | Log | Status |
|---|--------|------|:----:|:---:|:------:|
| 01 | GET | /admin/{path1} | ✅ | ✅ | Done |
| 02 | POST | /admin/{path2} | ✅ | ✅ | Done |
| ... | ... | ... | ... | ... | ... |

### BE-001~003 検証

| Rule | Check | Result |
|------|-------|:------:|
| BE-001 | スタブ検出スキャン | ✅ 0件 |
| BE-002 | cfg!(test) 検出 | ✅ なし |
| BE-003 | ログ行数 ({n}行) | ✅ 十分 |

### 次のカテゴリ
→ {next_category} ({next_count} endpoints)

### 全体進捗
- 完了: {done}/55 ({percent}%)
- 残り: {remaining}
```

---

## Critical Rules

```xml
<rule id="P8C-AUTO-001" level="ABSOLUTE">
  【ドキュメント参照必須】

  実装前に必ず以下を参照:
  1. API_SPECIFICATION.yaml → エンドポイント定義
  2. DATABASE_DESIGN.md → テーブル・クエリ
  3. 既存admin.rs → パターン踏襲
</rule>

<rule id="P8C-AUTO-002" level="ABSOLUTE">
  【進捗更新必須】

  エンドポイント実装完了後、必ずPHASE8_PROGRESS.mdを更新。
  更新なしで次のエンドポイントに進むことは禁止。
</rule>

<rule id="P8C-AUTO-003" level="ABSOLUTE">
  【スタブ検出ゼロ】

  カテゴリ完了時、スタブ検出スキャンで0件であること。
  1件でも検出された場合、Gate通過不可。
</rule>

<rule id="P8C-AUTO-004" level="MUST">
  【型の自動生成】

  API_SPECIFICATION.yamlのスキーマから型を生成。
  手動で型を作らない（ドキュメントとの乖離防止）。
</rule>
```

---

## カテゴリ別実装ガイド

### Auth (5 endpoints)

```
参照テーブル: admin_users, admin_sessions
主要クエリ:
- SELECT * FROM admin_users WHERE email = $1
- INSERT INTO admin_sessions (user_id, token, expires_at)
```

### Dashboard (3 endpoints)

```
参照テーブル: locks, unlocks, provers, observers
主要クエリ:
- SELECT COUNT(*) FROM locks WHERE status = 'active'
- SELECT SUM(amount) FROM locks
- SELECT COUNT(*) FROM provers WHERE status = 'active'
```

### Transactions (8 endpoints)

```
参照テーブル: locks, unlocks, emergency_unlocks, challenges
主要クエリ:
- SELECT * FROM locks ORDER BY created_at DESC LIMIT $1
- SELECT * FROM unlocks WHERE lock_id = $1
- SELECT * FROM challenges WHERE status = 'active'
```

### Users (6 endpoints)

```
参照テーブル: users, user_settings, user_dilithium_keys
主要クエリ:
- SELECT u.*, us.* FROM users u LEFT JOIN user_settings us ...
- SELECT * FROM user_dilithium_keys WHERE wallet_address = $1
```

### Treasury (10 endpoints)

```
参照テーブル: treasury_wallets, treasury_transfers, treasury_audit
主要クエリ:
- SELECT * FROM treasury_wallets
- SELECT * FROM treasury_transfers WHERE status = 'pending'
- INSERT INTO treasury_audit (action, actor, details)
```

---

## Gate 8-C 通過条件

```yaml
必須条件:
  - 全55エンドポイント実装完了
  - スタブ検出スキャン: 0件
  - 全ハンドラにログ出力あり (165行以上)
  - PHASE8_PROGRESS.md 全項目 Done

検証コマンド:
  # 1. スタブ検出
  ./scripts/detect-stubs.sh src/routes/admin.rs

  # 2. ログ行数カウント
  grep -c "tracing::" services/api/src/routes/admin.rs
  # → 165以上

  # 3. 進捗確認
  grep -c "Done" docs/phase8/PHASE8_PROGRESS.md
  # → 55以上
```

---

**Document End**
