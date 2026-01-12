# Task Definition

> **Generated**: 2026-01-12 (SEP v3)
> **Status**: DONE

---

## 基本情報

| 項目 | 値 |
|------|-----|
| タスクID | TASK-P5-012 |
| タイトル | SIWE→JWT認証基盤 |
| 対象Sequence | Authentication |
| 優先度 | P0 |
| 見積り工数 | 2日 |
| 完了日 | 2026-01-12 |

---

## 背景

### 現状分析

| コンポーネント | ファイル | 状態 | 備考 |
|--------------|---------|:----:|------|
| Auth Routes | `services/api/src/routes/auth.rs` | ❌ 未実装 | エンドポイントなし |
| JWT Middleware | `services/api/src/middleware.rs` | ⚠️ TODO | コメントのみ |
| Auth Service | `services/api/src/services/` | ❌ 未実装 | 認証ロジックなし |

### ギャップ分析

```
必要な機能:
1. SIWE (Sign-In with Ethereum) メッセージパースと検証
2. Dilithium-III署名検証 (CP-1準拠)
3. JWT発行と検証
4. 保護エンドポイント用ミドルウェア
```

---

## 実装項目

### 1. auth_service.rs作成 ✅

```rust
pub struct AuthService {
    jwt_config: JwtConfig,
}

impl AuthService {
    pub fn authenticate_siwe(&self, req: &SiweRequest) -> Result<SiweResponse, ApiError>;
    pub fn refresh_access_token(&self, refresh_token: &str) -> Result<(String, u64), ApiError>;
    pub fn validate_token(&self, token: &str) -> Result<JwtClaims, ApiError>;
    pub fn parse_siwe_message(message: &str) -> Result<SiweMessage, ApiError>;
    fn verify_dilithium_signature(...) -> Result<(), ApiError>;
    pub fn compute_address(pubkey_hex: &str) -> Result<String, ApiError>;
    pub fn compute_pubkey_hash(pubkey_hex: &str) -> Result<String, ApiError>;
}
```

### 2. middleware.rs更新 ✅

```rust
pub async fn jwt_auth(State(state), request, next) -> Response;
pub async fn jwt_auth_optional(State(state), request, next) -> Response;
pub struct AuthUser { address, public_key_hash, issued_at, expires_at }
```

### 3. routes/auth.rs作成 ✅

```rust
// POST /v1/auth/siwe
pub async fn siwe_authenticate(...) -> Result<impl IntoResponse, ApiError>;

// POST /v1/auth/refresh
pub async fn refresh_token(...) -> Result<impl IntoResponse, ApiError>;

// GET /v1/auth/me (protected)
pub async fn get_current_user(...) -> Result<impl IntoResponse, ApiError>;
```

---

## 完了条件

| # | 条件 | 状態 |
|---|------|:----:|
| 1 | SIWE署名検証成功 | ✅ |
| 2 | JWT発行・検証動作 | ✅ |
| 3 | 保護エンドポイントで認証要求 | ✅ |
| 4 | テスト成功 | ✅ 62 passed |

---

## 成果物

| ファイル | 説明 |
|---------|------|
| `services/api/src/services/auth_service.rs` | SIWE/JWT認証サービス (400+ lines) |
| `services/api/src/routes/auth.rs` | 認証APIエンドポイント (150+ lines) |
| `services/api/src/middleware.rs` | JWT検証ミドルウェア |
| `services/api/src/types.rs` | SiweRequest, JwtClaims等の型定義 |
| `services/api/src/error.rs` | 認証関連エラー型 |

---

## 次のタスク

TASK-P5-013: API Client認証統合
- depends_on: TASK-P5-012
- SDK側でSIWE→JWT自動認証フロー実装

---

**END OF TASK DEFINITION**
