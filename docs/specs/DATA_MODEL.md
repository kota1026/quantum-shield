# Quantum Shield Data Model

> **目的**: エンティティ中心のデータ設計。各エンティティがどのアプリから参照・更新されるかを明確化。
> **更新日**: 2026-01-24
> **バージョン**: v3.1（技術譲渡モデル対応）
> **関連**: [APP_DESIGN_SPECS.md](./APP_DESIGN_SPECS.md), [CODEBASE_MAP.md](./CODEBASE_MAP.md)

---

## 目次

1. [設計原則](#1-設計原則)
2. [エンティティ一覧](#2-エンティティ一覧)
3. [エンティティ詳細](#3-エンティティ詳細)
4. [アプリ×エンティティ マトリクス](#4-アプリエンティティ-マトリクス)
5. [API×エンティティ マトリクス](#5-apiエンティティ-マトリクス)
6. [データフロー図](#6-データフロー図)

---

## 1. 設計原則

### 1.1 エンティティ中心設計

```
従来のアプローチ（アプリ中心）:
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Consumer    │    │  Explorer   │    │  QS Admin   │
│  App API    │    │    API      │    │    API      │
└──────┬──────┘    └──────┬──────┘    └──────┬──────┘
       │                  │                  │
       ▼                  ▼                  ▼
   独自DB             独自DB             独自DB

→ 問題: データ重複、整合性の問題


提案するアプローチ（エンティティ中心）:
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Consumer    │    │  Explorer   │    │  QS Admin   │
│    App      │    │             │    │             │
└──────┬──────┘    └──────┬──────┘    └──────┬──────┘
       │                  │                  │
       └─────────────┬────┴──────────────────┘
                     │
                     ▼
              ┌─────────────┐
              │   Lock      │  ← 単一のエンティティ
              │  Entity     │     複数アプリから参照
              └─────────────┘

→ 利点: データ一元化、整合性保証
```

### 1.2 権限モデル

| 権限 | 説明 | 例 |
|------|------|---|
| **Create** | エンティティ作成 | Consumer → Lock作成 |
| **Read (Own)** | 自分のデータ読取 | Consumer → 自分のLock一覧 |
| **Read (Public)** | 公開データ読取 | Explorer → 全Lock統計 |
| **Read (Admin)** | 管理者読取 | QS Admin → 全Lock詳細 |
| **Update (Own)** | 自分のデータ更新 | Prover → 自分の設定 |
| **Update (Admin)** | 管理者更新 | QS Admin → Proverステータス |
| **Delete** | 削除（論理削除推奨） | Consumer → アカウント削除 |

---

## 2. エンティティ一覧

### 2.1 コアエンティティ

| # | エンティティ | 説明 | 保存場所 |
|---|-------------|------|----------|
| 1 | **User** | 一般ユーザー | オフチェーン (PostgreSQL) |
| 2 | **Lock** | ロックされた資産 | オンチェーン (L1) + オフチェーン |
| 3 | **Unlock** | アンロック要求 | オンチェーン (L1) + オフチェーン |
| 4 | **Prover** | 証明者 | オンチェーン (L1) + オフチェーン |
| 5 | **Observer** | 監視者 | オンチェーン (L1) + オフチェーン |
| 6 | **Challenge** | 異議申し立て | オンチェーン (L1) |
| 7 | **Proposal** | ガバナンス提案 | オンチェーン (L1) |
| 8 | **Vote** | 投票 | オンチェーン (L1) |
| 9 | **Enterprise** | 企業（SaaS版） | オフチェーン |
| 10 | **Token** | QSトークン（veQS含む） | オンチェーン (L1) |

### 2.2 補助エンティティ

| # | エンティティ | 説明 | 保存場所 |
|---|-------------|------|----------|
| 11 | UserDilithiumKey | ユーザーのDilithium公開鍵 | オフチェーン |
| 12 | UserSession | ログインセッション | オフチェーン |
| 13 | UserSettings | ユーザー設定 | オフチェーン |
| 14 | Notification | 通知 | オフチェーン |
| 15 | AuditLog | 監査ログ | オフチェーン |
| 16 | ProverKYB | Prover法人確認 | オフチェーン |
| 17 | ObserverKYB | Observer法人確認 | オフチェーン |
| 18 | EnterpriseContract | 企業契約 | オフチェーン |

### 2.3 v3.1 追加エンティティ（技術譲渡モデル対応）

| # | エンティティ | 説明 | 保存場所 |
|---|-------------|------|----------|
| 19 | **Licensee** | 技術譲渡先企業 | オフチェーン |
| 20 | **LicenseContract** | ライセンス契約情報 | オフチェーン |
| 21 | **SupportTicket** | サポートチケット | オフチェーン |
| 22 | **MaintenanceEvent** | メンテナンスイベント | オフチェーン |
| 23 | **AuditReport** | 監査レポート | オフチェーン |
| 24 | **EnvironmentConfig** | 環境設定（本番/ステージング/テスト） | オフチェーン |
| 25 | **SavedSearch** | 保存された検索条件 | オフチェーン |

---

## 3. エンティティ詳細

### 3.1 User

```
┌─────────────────────────────────────────────────────────────────┐
│  User                                                           │
├─────────────────────────────────────────────────────────────────┤
│  PK: user_id (UUID)                                             │
│                                                                 │
│  wallet_address: string (unique)    # Ethereumアドレス          │
│  nonce: string                      # SIWE用nonce               │
│  created_at: timestamp                                          │
│  updated_at: timestamp                                          │
│  deleted_at: timestamp?             # 論理削除                  │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  Relations:                                                     │
│  - has_many: UserDilithiumKey                                   │
│  - has_many: UserSession                                        │
│  - has_one: UserSettings                                        │
│  - has_many: Lock                                               │
│  - has_many: Notification                                       │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  アクセス権限:                                                   │
│  - Create: Consumer App (Onboarding)                            │
│  - Read (Own): Consumer App                                     │
│  - Read (Admin): QS Admin, Enterprise Admin                     │
│  - Update (Own): Consumer App (Settings)                        │
│  - Delete: Consumer App (アカウント削除)                        │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Lock

```
┌─────────────────────────────────────────────────────────────────┐
│  Lock                                                           │
├─────────────────────────────────────────────────────────────────┤
│  PK: lock_id (bytes32)              # オンチェーンID            │
│                                                                 │
│  chain_id: uint256                  # チェーンID                │
│  user_address: address              # ユーザーアドレス          │
│  asset: address                     # 資産アドレス              │
│  amount: uint256                    # 金額                      │
│  dest_addr: bytes                   # 送金先                    │
│  expiry: uint256                    # 有効期限                  │
│  pk_dilithium: bytes                # Dilithium公開鍵           │
│  SR_0: bytes32                      # 初期状態ルート            │
│  status: enum                       # pending/confirmed/unlocked│
│  created_at: uint256                # 作成日時                  │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  保存場所:                                                       │
│  - オンチェーン (L1 Vault Contract): 資産・ステータス           │
│  - オフチェーン (PostgreSQL): メタデータ・検索用インデックス    │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  アクセス権限:                                                   │
│  - Create: Consumer App                                         │
│  - Read (Own): Consumer App                                     │
│  - Read (Public): Explorer (統計情報のみ)                       │
│  - Read (Admin): QS Admin (全詳細), Enterprise Admin (自社顧客) │
│  - Update: L1 Contract のみ（ステータス変更）                   │
└─────────────────────────────────────────────────────────────────┘
```

### 3.3 Prover

```
┌─────────────────────────────────────────────────────────────────┐
│  Prover                                                         │
├─────────────────────────────────────────────────────────────────┤
│  PK: operator_addr (address)        # オペレーターアドレス       │
│                                                                 │
│  sphincs_pubkey: bytes              # SPHINCS+公開鍵            │
│  stake_amount: uint256              # ステーク額                │
│  hsm_attestation: bytes             # HSM証明                   │
│  status: enum                       # pending/active/exiting/   │
│                                     # exited/slashed            │
│  registered_at: uint256                                         │
│  approved_at: uint256?                                          │
│  exit_requested_at: uint256?                                    │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  保存場所:                                                       │
│  - オンチェーン (L1 Staking Contract): ステーク・ステータス     │
│  - オフチェーン (PostgreSQL): KYB情報・設定・メトリクス         │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  アクセス権限:                                                   │
│  - Create: Prover Portal (申請)                                 │
│  - Read (Own): Prover Portal                                    │
│  - Read (Public): Explorer (公開情報), Consumer App (VRF選出時) │
│  - Read (Admin): QS Admin (全詳細), Enterprise Admin (自社)     │
│  - Update (Own): Prover Portal (設定)                           │
│  - Update (Admin): QS Admin (承認/Slash)                        │
└─────────────────────────────────────────────────────────────────┘
```

### 3.4 Observer

```
┌─────────────────────────────────────────────────────────────────┐
│  Observer                                                       │
├─────────────────────────────────────────────────────────────────┤
│  PK: observer_addr (address)        # Observerアドレス          │
│                                                                 │
│  stake_amount: uint256              # ステーク額                │
│  vrf_weight: uint256                # VRF重み                   │
│  status: enum                       # pending/active/exiting    │
│  challenges_won: uint256            # 勝利Challenge数           │
│  challenges_lost: uint256           # 敗北Challenge数           │
│  total_rewards: uint256             # 累計報酬                  │
│  registered_at: uint256                                         │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  アクセス権限:                                                   │
│  - Create: Observer App (申請)                                  │
│  - Read (Own): Observer App                                     │
│  - Read (Public): Explorer                                      │
│  - Read (Admin): QS Admin                                       │
│  - Update (Own): Observer App (設定)                            │
│  - Update (System): Challenge結果によるステータス更新           │
└─────────────────────────────────────────────────────────────────┘
```

### 3.5 その他のエンティティ

> Challenge, Proposal, Vote, Enterprise, Token は同様の形式で定義
> 詳細は DESIGN_SPEC_v3.md の各アプリセクション参照

---

## 4. アプリ×エンティティ マトリクス

### 4.1 参照マトリクス

| エンティティ | Consumer | Token Hub | Governance | Prover | Observer | Explorer | Enterprise | QS Admin |
|-------------|:--------:|:---------:|:----------:|:------:|:--------:|:--------:|:----------:|:--------:|
| User | C/R/U/D | R | R | - | - | - | R | R/U |
| Lock | C/R | R | - | R | R | R | R | R |
| Unlock | C/R | - | - | R | R | R | R | R |
| Prover | R | - | - | C/R/U | - | R | R | R/U |
| Observer | - | - | - | - | C/R/U | R | - | R/U |
| Challenge | R | - | - | R | C/R | R | - | R/U |
| Proposal | - | - | C/R | - | - | R | - | R |
| Vote | - | - | C/R | - | - | R | - | R |
| Token (veQS) | - | C/R/U | R | - | - | R | - | R |
| Enterprise | - | - | - | - | - | - | C/R/U | R/U |

**凡例**: C=Create, R=Read, U=Update, D=Delete

### 4.2 権限レベル

| エンティティ | Public | Own | Admin |
|-------------|:------:|:---:|:-----:|
| User | - | Consumer | QS Admin |
| Lock | Explorer (統計) | Consumer | QS Admin, Enterprise |
| Prover | Explorer (一覧) | Prover Portal | QS Admin |
| Observer | Explorer (一覧) | Observer App | QS Admin |

---

## 5. API×エンティティ マトリクス

### 5.1 User関連API

| API | エンティティ | 操作 | アプリ |
|-----|-------------|------|--------|
| `POST /auth/siwe` | User, UserSession | Create | 全アプリ |
| `GET /user/dashboard` | User, Lock | Read (Own) | Consumer |
| `PUT /user/settings` | UserSettings | Update (Own) | Consumer |
| `GET /user/keys` | UserDilithiumKey | Read (Own) | Consumer |
| `POST /user/keys` | UserDilithiumKey | Create | Consumer |
| `DELETE /user` | User | Delete | Consumer |

### 5.2 Lock関連API

| API | エンティティ | 操作 | アプリ |
|-----|-------------|------|--------|
| `POST /lock` | Lock | Create | Consumer |
| `GET /status/:lock_id` | Lock | Read (Own) | Consumer |
| `POST /unlock` | Unlock | Create | Consumer |
| `POST /unlock/emergency` | Unlock | Create | Consumer |
| `GET /explorer/locks` | Lock | Read (Public) | Explorer |
| `GET /admin/locks` | Lock | Read (Admin) | QS Admin |

### 5.3 Prover関連API

| API | エンティティ | 操作 | アプリ |
|-----|-------------|------|--------|
| `POST /prover/register` | Prover, ProverKYB | Create | Prover Portal |
| `GET /prover/:id/dashboard` | Prover | Read (Own) | Prover Portal |
| `GET /prover/:id/queue` | Unlock | Read | Prover Portal |
| `POST /prover/:id/sign` | Unlock | Update | Prover Portal |
| `GET /explorer/provers` | Prover | Read (Public) | Explorer |
| `POST /admin/provers/:id/approve` | Prover | Update (Admin) | QS Admin |

---

## 6. データフロー図

### 6.1 Lock → Unlock フロー

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Lock → Unlock データフロー                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   Consumer App                  API                      L1 Contract        │
│   ───────────                  ───                      ────────────        │
│                                                                             │
│   [Lock画面]                                                                │
│       │                                                                     │
│       │ POST /lock                                                          │
│       ├────────────────────────► Lock エンティティ作成                      │
│       │                              │                                      │
│       │                              │ L1 トランザクション                   │
│       │                              ├────────────────────► Vault.deposit() │
│       │                              │                           │          │
│       │                              │ ◄─────────────────────────┘          │
│       │ ◄────────────────────────────┤                                      │
│   [Success]                          │                                      │
│                                      │                                      │
│   ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   │
│                                      │                                      │
│   [Unlock画面]                       │                                      │
│       │                              │                                      │
│       │ POST /unlock                 │                                      │
│       ├────────────────────────► Unlock エンティティ作成                    │
│       │                              │                                      │
│       │                              │ VRF でProver選出                     │
│       │                              │     │                                │
│       │                              │     ▼                                │
│       │                              │ Prover に署名要求                    │
│       │                              │     │                                │
│       │ Dilithium署名要求            │     │                                │
│       │ ◄────────────────────────────┤     │                                │
│       │                              │     │                                │
│       │ 署名送信                     │     │                                │
│       ├────────────────────────►     │     │                                │
│       │                              │     │                                │
│       │                              │     ▼                                │
│       │                              │ L1 トランザクション                   │
│       │                              ├────────────────────► Vault.unlock()  │
│       │                              │                           │          │
│       │                              │         TimeLock 開始 ◄───┘          │
│       │ ◄────────────────────────────┤                                      │
│   [24h待機]                          │                                      │
│       │                              │                                      │
│       │ （24時間後）                  │                                      │
│       │                              │                                      │
│       │                              │ Claim 実行                           │
│       │                              ├────────────────────► Vault.claim()   │
│       │ ◄────────────────────────────┤                           │          │
│   [Success]                          │         資産送金 ◄────────┘          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 クロスアプリ参照フロー

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         クロスアプリ データ参照                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                        ┌──────────────────────┐                             │
│                        │                      │                             │
│                        │    Lock Entity       │                             │
│                        │                      │                             │
│                        └──────────┬───────────┘                             │
│                                   │                                         │
│         ┌─────────────────────────┼─────────────────────────┐               │
│         │                         │                         │               │
│         ▼                         ▼                         ▼               │
│   ┌───────────┐            ┌───────────┐            ┌───────────┐          │
│   │ Consumer  │            │  Explorer │            │ QS Admin  │          │
│   │   App     │            │           │            │           │          │
│   ├───────────┤            ├───────────┤            ├───────────┤          │
│   │ 権限:     │            │ 権限:     │            │ 権限:     │          │
│   │ Read(Own) │            │ Read(Pub) │            │ Read(All) │          │
│   │           │            │           │            │ Update    │          │
│   ├───────────┤            ├───────────┤            ├───────────┤          │
│   │ 表示:     │            │ 表示:     │            │ 表示:     │          │
│   │ 自分のLock│            │ 全Lock統計│            │ 全Lock詳細│          │
│   │ 詳細情報  │            │ 公開情報  │            │ 管理操作  │          │
│   └───────────┘            └───────────┘            └───────────┘          │
│                                                                             │
│   ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   │
│                                                                             │
│   API設計の原則:                                                            │
│   - 同じエンティティに対して、アプリごとに異なるエンドポイント              │
│   - 権限チェックはAPIレベルで実施                                           │
│   - 公開情報は集計・匿名化してから返す                                      │
│                                                                             │
│   例:                                                                       │
│   Consumer:  GET /user/locks          → 自分のLockのみ                     │
│   Explorer:  GET /explorer/locks/stats → 統計情報のみ                       │
│   QS Admin:  GET /admin/locks         → 全Lock詳細                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. 開発時のAPI実装パターン

### 7.1 Mock API パターン

開発初期はNext.js Route Handlersを使ってMock APIを作成し、UI開発を進める。

```
開発フロー:
1. UI実装 (コンポーネント作成)
2. Mock API作成 (Next.js Route Handlers)
3. APIクライアント作成 (lib/api/)
4. 実API接続 (services/api/ へ切り替え)
```

### 7.2 Mock API 実装例（Lock）

**エンドポイント構成**:

| エンドポイント | メソッド | 説明 |
|---------------|---------|------|
| `/api/lock` | POST | ロック作成 |
| `/api/lock/status/[lockId]` | GET | ロック状態取得 |

**リクエスト/レスポンス例**:

```typescript
// POST /api/lock
// Request
{
  amount: "5.00",
  period_years: 2,
  dilithium_pubkey: "0x..."
}

// Response (200 OK)
{
  lock_id: "0x1234...5678",
  status: "pending",
  amount: "5.00",
  period_years: 2,
  unlock_date: "2028-01-22T00:00:00Z",
  tx_hash: "0xabcd...efgh",
  created_at: "2026-01-22T12:00:00Z"
}

// GET /api/lock/status/0x1234...5678
// Response (200 OK)
{
  lock_id: "0x1234...5678",
  status: "confirmed", // pending | confirming | confirmed | failed
  amount: "5.00",
  period_years: 2,
  unlock_date: "2028-01-22T00:00:00Z",
  tx_hash: "0xabcd...efgh",
  confirmations: 6,
  created_at: "2026-01-22T12:00:00Z",
  updated_at: "2026-01-22T12:01:00Z"
}
```

### 7.3 APIクライアントパターン

```typescript
// lib/api/lock.ts
export interface LockRequest {
  amount: string;
  periodYears: number;
}

export interface LockResponse {
  lockId: string;
  status: 'pending';
  amount: string;
  // ...
}

// snake_case (API) → camelCase (クライアント) 変換
export async function createLock(request: LockRequest): Promise<LockResponse> {
  const response = await fetch('/api/lock', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: request.amount,
      period_years: request.periodYears, // camelCase → snake_case
    }),
  });

  const data = await response.json();
  return {
    lockId: data.lock_id, // snake_case → camelCase
    status: data.status,
    // ...
  };
}
```

### 7.4 本番API移行

Mock APIが安定したら、以下の手順で本番API（services/api/）に移行:

1. `NEXT_PUBLIC_API_URL` 環境変数を設定
2. APIクライアントのベースURLを切り替え
3. 認証ヘッダー（Bearer token）を追加
4. エラーハンドリングを強化

```typescript
// lib/api/lock.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || ''; // 空=Mock使用

export async function createLock(request: LockRequest): Promise<LockResponse> {
  const response = await fetch(`${API_BASE_URL}/api/lock`, {
    // ...
  });
}
```

---

## 8. v3.1 追加エンティティ詳細

### 8.1 Licensee（技術譲渡先企業）

```
┌─────────────────────────────────────────────────────────────────┐
│  Licensee                                                       │
├─────────────────────────────────────────────────────────────────┤
│  PK: licensee_id (UUID)                                         │
│                                                                 │
│  company_name: string               # 企業名                    │
│  company_name_en: string?           # 企業名（英語）            │
│  contact_email: string              # 代表連絡先メール          │
│  contact_name: string               # 担当者名                  │
│  license_type: enum                 # Standard/Enterprise/Premium│
│  status: enum                       # Active/Suspended/Terminated│
│  explorer_url: string?              # 公開Explorer URL (必須義務)│
│  created_at: timestamp                                          │
│  updated_at: timestamp                                          │
│                                                                 │
│  Relations:                                                     │
│  - LicenseContract (1:N)                                        │
│  - SupportTicket (1:N)                                          │
│  - AuditReport (1:N)                                            │
│  - EnvironmentConfig (1:N)                                      │
└─────────────────────────────────────────────────────────────────┘

アクセス権限:
- QS Admin: Create, Read (All), Update (All)
- Enterprise Admin: Read (Own), Update (Own, 一部フィールド)
```

### 8.2 LicenseContract（ライセンス契約）

```
┌─────────────────────────────────────────────────────────────────┐
│  LicenseContract                                                │
├─────────────────────────────────────────────────────────────────┤
│  PK: contract_id (UUID)                                         │
│  FK: licensee_id → Licensee                                     │
│                                                                 │
│  contract_number: string            # 契約番号                  │
│  start_date: date                   # 契約開始日                │
│  end_date: date                     # 契約終了日                │
│  renewal_date: date?                # 更新期限                  │
│  annual_fee: decimal                # 年間保守料（JPY）         │
│  status: enum                       # Active/Expiring/Expired   │
│  terms_version: string              # 利用規約バージョン        │
│  signed_by: string                  # 署名者                    │
│  signed_at: timestamp               # 署名日時                  │
│  created_at: timestamp                                          │
│  updated_at: timestamp                                          │
└─────────────────────────────────────────────────────────────────┘

アクセス権限:
- QS Admin: Create, Read (All), Update (All)
- Enterprise Admin: Read (Own)
```

### 8.3 SupportTicket（サポートチケット）

```
┌─────────────────────────────────────────────────────────────────┐
│  SupportTicket                                                  │
├─────────────────────────────────────────────────────────────────┤
│  PK: ticket_id (UUID)                                           │
│  FK: licensee_id → Licensee                                     │
│  FK: assigned_to → QSAdminUser?                                 │
│                                                                 │
│  ticket_number: string              # チケット番号（自動生成）  │
│  title: string                      # タイトル                  │
│  description: text                  # 詳細説明                  │
│  priority: enum                     # Critical/High/Normal      │
│  status: enum                       # Open/InProgress/Resolved/Closed│
│  category: enum                     # Technical/Security/Billing/Other│
│  resolution: text?                  # 解決内容                  │
│  resolved_at: timestamp?            # 解決日時                  │
│  sla_deadline: timestamp            # SLA期限                   │
│  created_by: string                 # 作成者（Enterprise Admin）│
│  created_at: timestamp                                          │
│  updated_at: timestamp                                          │
│                                                                 │
│  Relations:                                                     │
│  - TicketComment (1:N)  # チケットへのコメント                  │
└─────────────────────────────────────────────────────────────────┘

SLA基準:
- Critical: 1時間以内に初期対応
- High: 4時間以内に初期対応
- Normal: 1営業日以内に初期対応

アクセス権限:
- QS Admin: Read (All), Update (All)
- Enterprise Admin: Create (Own), Read (Own), Update (Own, statusは読取専用)
```

### 8.4 MaintenanceEvent（メンテナンスイベント）

```
┌─────────────────────────────────────────────────────────────────┐
│  MaintenanceEvent                                               │
├─────────────────────────────────────────────────────────────────┤
│  PK: event_id (UUID)                                            │
│  FK: licensee_id → Licensee                                     │
│  FK: prover_id → Prover                                         │
│                                                                 │
│  event_type: enum                   # Scheduled/Emergency/Update│
│  title: string                      # イベントタイトル          │
│  description: text                  # 詳細説明                  │
│  scheduled_start: timestamp         # 予定開始日時              │
│  scheduled_end: timestamp           # 予定終了日時              │
│  actual_start: timestamp?           # 実際の開始日時            │
│  actual_end: timestamp?             # 実際の終了日時            │
│  status: enum                       # Scheduled/InProgress/Completed/Cancelled│
│  fallback_prover_id: UUID?          # 代替Prover                │
│  reason: text                       # メンテナンス理由          │
│  created_by: string                 # 作成者                    │
│  created_at: timestamp                                          │
│  updated_at: timestamp                                          │
└─────────────────────────────────────────────────────────────────┘

アクセス権限:
- Enterprise Admin: Create, Read (Own), Update (Own), Delete (Own, Scheduled状態のみ)
- QS Admin: Read (All) # 技術譲渡先の運用状況把握
```

### 8.5 AuditReport（監査レポート）

```
┌─────────────────────────────────────────────────────────────────┐
│  AuditReport                                                    │
├─────────────────────────────────────────────────────────────────┤
│  PK: report_id (UUID)                                           │
│  FK: licensee_id → Licensee                                     │
│                                                                 │
│  report_type: enum                  # Quarterly/Annual/Security │
│  period_start: date                 # 対象期間開始              │
│  period_end: date                   # 対象期間終了              │
│  file_url: string                   # レポートファイルURL       │
│  file_hash: string                  # ファイルハッシュ          │
│  status: enum                       # Submitted/Reviewed/Approved/Rejected│
│  reviewed_by: string?               # レビュー担当者            │
│  reviewed_at: timestamp?            # レビュー日時              │
│  reviewer_notes: text?              # レビューコメント          │
│  submitted_by: string               # 提出者                    │
│  submitted_at: timestamp            # 提出日時                  │
│  created_at: timestamp                                          │
│  updated_at: timestamp                                          │
│                                                                 │
│  ライセンス条件:                                                │
│  - 四半期ごとに運用レポートをQS財団に提出（必須義務）          │
└─────────────────────────────────────────────────────────────────┘

アクセス権限:
- Enterprise Admin: Create (Own), Read (Own)
- QS Admin: Read (All), Update (status, reviewer_notes)
```

### 8.6 EnvironmentConfig（環境設定）

```
┌─────────────────────────────────────────────────────────────────┐
│  EnvironmentConfig                                              │
├─────────────────────────────────────────────────────────────────┤
│  PK: config_id (UUID)                                           │
│  FK: licensee_id → Licensee                                     │
│                                                                 │
│  environment: enum                  # Production/Staging/Test   │
│  name: string                       # 環境表示名                │
│  api_endpoint: string               # APIエンドポイント         │
│  l1_contract_address: string        # L1コントラクトアドレス    │
│  l3_contract_address: string?       # L3コントラクトアドレス    │
│  explorer_url: string?              # Explorer URL              │
│  color_code: string                 # 環境識別カラー            │
│  is_active: boolean                 # アクティブフラグ          │
│  created_at: timestamp                                          │
│  updated_at: timestamp                                          │
│                                                                 │
│  環境別カラー（v3.1仕様）:                                       │
│  - Production: 青 (#3B82F6)                                     │
│  - Staging: 黄 (#EAB308)                                        │
│  - Test: 灰 (#6B7280)                                           │
└─────────────────────────────────────────────────────────────────┘

アクセス権限:
- Enterprise Admin: Create (Own), Read (Own), Update (Own), Delete (Own, Test環境のみ)
```

### 8.7 SavedSearch（保存された検索条件）

```
┌─────────────────────────────────────────────────────────────────┐
│  SavedSearch                                                    │
├─────────────────────────────────────────────────────────────────┤
│  PK: search_id (UUID)                                           │
│  FK: user_id → User (QSAdminUser or EnterpriseAdminUser)        │
│                                                                 │
│  name: string                       # 検索名                    │
│  target_entity: string              # 対象エンティティ          │
│  filters: jsonb                     # フィルター条件（JSON）    │
│  columns: jsonb?                    # 表示カラム設定            │
│  sort_by: string?                   # ソートキー                │
│  sort_order: enum?                  # ASC/DESC                  │
│  is_default: boolean                # デフォルト検索フラグ      │
│  created_at: timestamp                                          │
│  updated_at: timestamp                                          │
│                                                                 │
│  使用例:                                                         │
│  - 監査ログの複合条件検索保存（v3.1新機能）                     │
│  - よく使うフィルター条件の保存                                 │
└─────────────────────────────────────────────────────────────────┘

アクセス権限:
- QS Admin: Create (Own), Read (Own), Update (Own), Delete (Own)
- Enterprise Admin: Create (Own), Read (Own), Update (Own), Delete (Own)
```

---

## 更新履歴

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-22 | Claude | 初版作成 |
| 1.1 | 2026-01-22 | Claude | 開発時のAPI実装パターン追加（Mock API、クライアントパターン）|
| 2.0 | 2026-01-24 | Claude | v3.1対応: 技術譲渡モデルエンティティ追加（Licensee, LicenseContract, SupportTicket, MaintenanceEvent, AuditReport, EnvironmentConfig, SavedSearch）|
