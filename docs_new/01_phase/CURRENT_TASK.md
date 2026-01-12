# CURRENT_TASK.md - 現在のタスク定義

> **Created**: 2026-01-12
> **Completed**: 2026-01-12
> **Status**: DONE
> **Task ID**: TASK-P5-013

---

## 1. タスク定義

```yaml
task_id: "TASK-P5-013"
name: "API Client認証統合"
phase: "5.1"
priority: "P1"
status: "IN_PROGRESS"
depends_on: ["TASK-P5-012"]

spec_refs:
  unified_spec: ["§SDK Authentication"]

existing_code_check:
  sdk:
    - "packages/sdk/typescript/src/client.ts (QuantumShieldClient存在)"
    - "packages/sdk/react/src/QuantumShieldProvider.tsx (Provider存在)"

gap:
  what_exists: "Client構造あり、WASM/Dilithium統合済み"
  what_missing: "SIWE→JWT自動認証フロー"
  estimated_effort: "1 day"

deliverables:
  - "packages/sdk/typescript/src/auth.ts"
  - "packages/sdk/react/src/useAuth.ts"
```

---

## 2. 成果物詳細

### 2.1 packages/sdk/typescript/src/auth.ts

**目的**: SIWE (Sign-In with Ethereum) + JWT認証クライアント

**機能**:
- `AuthClient` クラス
  - SIWE メッセージ生成
  - SIWE 署名送信 → JWT取得
  - JWT トークン管理（保存・更新・削除）
  - 自動リフレッシュ機能
  - 認証状態管理

**インターフェース**:
```typescript
interface AuthState {
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
  address: string | null;
}

interface SIWEMessage {
  domain: string;
  address: string;
  statement: string;
  uri: string;
  version: string;
  chainId: number;
  nonce: string;
  issuedAt: string;
  expirationTime?: string;
}

class AuthClient {
  constructor(config: AuthClientConfig);

  // SIWE認証フロー
  createSIWEMessage(address: string, chainId: number): Promise<SIWEMessage>;
  authenticate(signature: string, message: SIWEMessage): Promise<AuthState>;

  // トークン管理
  getAccessToken(): string | null;
  refreshTokens(): Promise<AuthState>;
  logout(): void;

  // 状態
  getAuthState(): AuthState;
  isAuthenticated(): boolean;
}
```

### 2.2 packages/sdk/react/src/useAuth.ts

**目的**: React Hook for 認証機能

**機能**:
- 認証状態のReactive管理
- ウォレット接続後の自動SIWE認証
- トークン自動リフレッシュ
- ローカルストレージ永続化

**インターフェース**:
```typescript
interface UseAuthReturn {
  // 状態
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  authError: Error | null;
  address: string | null;

  // アクション
  signIn: () => Promise<void>;
  signOut: () => void;
  refreshAuth: () => Promise<void>;

  // トークン
  accessToken: string | null;
  expiresAt: number | null;
}
```

---

## 3. 完了条件

### 3.1 形式的検証
- [x] TypeScriptコンパイルエラーなし
- [x] ESLint警告なし
- [x] 型定義が完全

### 3.2 実行検証
- [x] npm run build 成功
- [x] npm test 成功
- [x] 既存テスト破壊なし

### 3.3 機能検証
- [x] SIWE メッセージ生成機能
- [x] JWT トークン管理（取得・保存・更新・削除）
- [x] 認証状態管理
- [x] React Hook 動作

---

## 6. 完了記録

```yaml
completion:
  date: "2026-01-12"
  verification_loops: 3
  artifacts:
    - "packages/sdk/typescript/src/auth.ts"
    - "packages/sdk/react/src/useAuth.ts"
  tests_passed: 44
  build_output:
    typescript_sdk: "28.06 KB ESM + 23.84 KB DTS"
    react_sdk: "18.95 KB ESM + 9.95 KB DTS"
```

---

## 4. トレーサビリティ

| 要件 | 仕様参照 | 実装ファイル | テスト |
|------|---------|-------------|-------|
| SIWE認証 | §SDK Authentication | auth.ts | - |
| JWT管理 | §SDK Authentication | auth.ts | - |
| React統合 | §SDK Authentication | useAuth.ts | - |

---

## 5. 検証ループ設定

- **最大ループ回数**: 5
- **検証コマンド**:
  - `cd packages/sdk/typescript && npm run build`
  - `cd packages/sdk/react && npm run build`
  - `cd packages/sdk/typescript && npm test`
  - `cd packages/sdk/react && npm test`

---

**WHY**: SDK経由でのシームレスな認証体験を提供し、Consumer App、Token Hub、Prover Portal等のフロントエンドからAPIを安全に利用可能にする。
