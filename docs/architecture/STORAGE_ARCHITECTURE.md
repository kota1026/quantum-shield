# Quantum Shield Storage Architecture

> **Version**: 3.2
> **Date**: 2026-02-08
> **Status**: Active - Post FIX Execution (FIX-001~022)
> **Purpose**: Redis/PostgreSQL/Blockchain三層ストレージの統合設計
> **References**: [SEQUENCES.md (core)](../core/SEQUENCES.md), [DATABASE_DESIGN.md](../specs/DATABASE_DESIGN.md), [DATA_MODEL.md](../specs/DATA_MODEL.md)
> **IMPORTANT**: signing_queue テーブルは migration 008 定義と実DBスキーマが異なる（C-13で修正済み）。詳細は [DATABASE_ACTUAL_STATE.md](./DATABASE_ACTUAL_STATE.md) §3.4 を参照。

---

## 1. 設計原則

### 1.1 Three-Layer Storage Model

```
                        Write Path                    Read Path
                        ========                      =========

User Action ──> API Server ──> PostgreSQL ──────────> API Server ──> App
                    │              (Source of Truth)        ^
                    │                    │                  │
                    └──> Redis ──────────┼──> Redis ───────┘
                         (Cache)         │   (High-speed read)
                                         v
                                    Blockchain L1/L3
                                    (Settlement/Verification)
```

### 1.2 Storage Responsibility

| Layer | Role | Durability | Use For |
|:---:|------|:---:|---------|
| **PostgreSQL** | Source of Truth (off-chain) | Persistent | 全エンティティの永続化、Admin/Explorer参照、監査ログ |
| **Redis** | High-speed Cache | Ephemeral | セッション、nonce、キャッシュ、一時的なキュー |
| **Blockchain L1** | Settlement Layer | Immutable | 資産の移動、ステーキング、スラッシング |
| **L3 Aegis** | Computation Layer | Consensus | BFT合意、Dilithium検証、SR計算、SMT管理 |

### 1.3 Golden Rules

```
RULE-1: 全てのエンティティはPostgreSQLに書き込む（永続性の保証）
RULE-2: Redisは読み取り高速化のキャッシュとしてのみ使用する
RULE-3: Redisにしか存在しないデータは「存在しない」と同義
RULE-4: L1/L3は検証・決済用。APIはPostgreSQLを参照する
RULE-5: Write: PG first, then Redis cache. Read: Redis first, PG fallback.
```

### 1.4 Migration Patterns (SM-001 / SM-002)

All route modules follow one of two standard migration patterns:

| Pattern | Name | Description | Direction |
|:---:|------|-------------|-----------|
| **SM-001** | Dual-Write | Write to PG first (Source of Truth), then invalidate/update Redis cache | Write path |
| **SM-002** | PG-First Read | Read from PG first, populate Redis cache on read | Read path |

```rust
// SM-001: Dual-Write (Write Path)
// 1. Write to PostgreSQL via Repository
// 2. Invalidate Redis cache (DEL key)
// 3. Redis failure is non-fatal (PG is Source of Truth)

// SM-002: PG-First Read (Read Path)
// 1. Read from PostgreSQL via Repository
// 2. Populate Redis cache for future reads
// 3. Redis cache miss falls through to PG
```

---

## 2. エンティティ別ストレージマップ

### 2.1 Core Entities

| Entity | Write To | Read From | Redis Cache | TTL | Notes |
|--------|----------|-----------|:-----------:|:---:|-------|
| **Lock** | PG + L1 | PG (Redis cache) | `lock:{id}` | 24h | SEQ#1: L1 Vault.deposit |
| **Unlock Request** | PG + L1 | PG (Redis cache) | `unlock:{id}` | 24h | SEQ#2/3: TimeLock |
| **Challenge** | PG | PG (Redis cache) | `challenge:{id}` | 24h | SEQ#4: Slashing |
| **Prover** | PG + L1(stake) | PG (Redis cache) | `prover:{id}` | 1h | SEQ#5: Registration |
| **Observer** | PG | PG (Redis cache) | `observer:{id}` | 1h | Practice mode管理 |
| **Proposal** | PG + L3 | PG | - | - | SEQ#7: Governance |
| **Vote** | PG + L3 | PG | - | - | SEQ#7: Governance |
| **User** | PG | PG (Redis cache) | `user:{addr}` | 1h | 基本情報 |
| **User Settings** | PG | PG (Redis cache) | `user:settings:{addr}` | 1h | メール、言語設定 |

### 2.2 Financial Entities (永続性が最重要)

| Entity | Write To | Read From | Redis Cache | Notes |
|--------|----------|-----------|:-----------:|-------|
| **Treasury Wallet** | PG | PG | - | 管理者のみアクセス |
| **Treasury Transaction** | PG + L1 | PG | - | 監査必須 |
| **Insurance Claim** | PG | PG | - | 法的保管義務 |
| **Slashing** | PG + L1 | PG | - | 60/20/20分配 |
| **Prover Exit** | PG + L1 | PG | - | 7日unbonding |

### 2.3 Ephemeral Entities (Redisが適切)

| Entity | Storage | Redis Key | TTL | Notes |
|--------|---------|-----------|:---:|-------|
| **SIWE Nonce** | Redis only | `siwe:nonce:{nonce}` | 1h | 一回使い捨て |
| **JWT Session** | Redis only | `session:{token}` | 7d | ログアウトで削除 |
| **Rate Limit** | Redis only | `ratelimit:{ip}:{endpoint}` | 1min | IP別 |
| **Prover Alerts** | Redis only | `prover:alerts:{prover_id}` | 24h | 一時的な通知、PGテーブル不要 |

### 2.4 Dual-Storage Entities (PG + Redis Cache)

| Entity | Write To | Read From | Redis Cache | TTL | Notes |
|--------|----------|-----------|:-----------:|:---:|-------|
| **Signing Queue** | PG (signing_queue table) | PG (Redis cache) | `queue:{prover_id}` | 1h | SM-002: PG first, Redis cache |
| **Prover Metrics** | PG | PG (Redis cache) | `prover:metrics:{id}` | 1h | SM-002: PG first, Redis cache |
| **Prover Exit** | PG | PG (Redis cache) | `prover:exit:{id}` | 1h | SM-002: PG first, Redis cache |

### 2.5 Token Hub (veQS) Entities

| Entity | Write To | Read From | Redis Cache | Notes |
|--------|----------|-----------|:-----------:|-------|
| **veQS Lock** | PG + L3 | PG (Redis cache) | `veqs:lock:{addr}` | 1h | ロック量 = 投票力 |
| **Delegation** | PG + L3 | PG (Redis cache) | - | - | veQS委任 |
| **Reward Epoch** | PG | PG | - | - | エポック報酬 |
| **Reward Claim** | PG + L3 | PG | - | - | 二重請求防止 |

### 2.6 報酬通貨設計 (2026-02-08追加)

> **原則**: 全ての報酬はQS Token (L3 Aegis ERC-20) で支払い。
> ETHはユーザー資産Lock/Unlockと担保(Bond/Stake)のみ。

| 報酬種別 | 通貨 | チェーン | L3コントラクト | 配分タイミング | 配分比率 |
|----------|:----:|:-------:|----------------|----------------|:--------:|
| veQSホルダー報酬 | QS | L3 | RewardRouter → VeQSRewardDistributor | Epoch終了時 | 50% |
| Prover署名報酬 | QS | L3 | RewardRouter → ProverRewardPool | 日次バッチ | 30% |
| Observer Challenge報酬 | QS | L3 | RewardRouter → ObserverRewardPool | Challenge確定時 | 10% |
| Treasury | QS | L3 | RewardRouter → Treasury | 自動 | 10% |

> **RewardRouter アーキテクチャ (SEQUENCES.md §9.4)**:
> QSInflation → RewardRouter.sol → 4プール分配。
> コントラクト: `l3-aegis/src/rewards/{RewardRouter,ProverRewardPool,ObserverRewardPool}.sol`

**Phase 8-D実装予定**: バックエンドAPIからL3 RewardRouterへの連携。
現Phase（BE-001）: `currency: "QS"` をレスポンスに含め、金額は `0.0`。

---

## 3. シーケンス別データフロー

### 3.1 SEQ#1: Lock (資産ロック)

```
Consumer App                API Server              PostgreSQL           Redis              L1 Vault
    │                           │                       │                  │                   │
    │──POST /v1/lock───────────>│                       │                  │                   │
    │                           │──nonce check──────────────────────────-->│                   │
    │                           │<─────────────────────────────────────────│                   │
    │                           │                       │                  │                   │
    │                           │──Dilithium verify─────│                  │                   │
    │                           │                       │                  │                   │
    │                           │──INSERT locks─────────>│                  │                   │
    │                           │   status='pending'     │                  │                   │
    │                           │<──lock_id──────────────│                  │                   │
    │                           │                       │                  │                   │
    │                           │──SET lock:{id}────────────────────────-->│                   │
    │                           │   (cache, TTL=24h)     │                  │                   │
    │                           │                       │                  │                   │
    │                           │──SADD user:locks:{addr}─────────────────>│                   │
    │                           │                       │                  │                   │
    │                           │──Vault.deposit()──────────────────────────────────────────-->│
    │                           │                       │                  │                   │
    │                           │──UPDATE locks─────────>│                  │                   │
    │                           │   status='confirmed'   │                  │                   │
    │                           │   l1_tx_hash=...       │                  │                   │
    │                           │                       │                  │                   │
    │<─{lock_id, status}────────│                       │                  │                   │
    │                           │                       │                  │                   │

Who Reads This Data:
  Consumer: GET /v1/user/dashboard    → PG (via Redis cache)
  Explorer: GET /v1/explorer/locks    → PG
  QS Admin: GET /api/admin/locks      → PG (via LockRepository)
```

### 3.2 SEQ#2: Unlock Normal Path (通常アンロック)

```
Consumer App      API Server        PostgreSQL       Redis          VRF        Provers (2/5)    L1 Vault
    │                 │                  │              │              │             │              │
    │──POST /unlock──>│                  │              │              │             │              │
    │                 │──GET lock────────>│              │              │             │              │
    │                 │   verify owner    │              │              │             │              │
    │                 │                  │              │              │             │              │
    │                 │──INSERT unlock────>│              │              │             │              │
    │                 │   requests        │              │              │             │              │
    │                 │   status='pending'│              │              │             │              │
    │                 │                  │              │              │             │              │
    │                 │──INSERT vrf───────>│              │              │             │              │
    │                 │   requests        │              │              │             │              │
    │                 │                  │              │              │             │              │
    │                 │──VRF request───────────────────────────────────>│             │              │
    │                 │                  │              │              │             │              │
    │                 │──INSERT signing───>│              │              │             │              │
    │                 │   queue           │              │              │             │              │
    │                 │                  │              │              │             │              │
    │                 │──SET queue:{prover}──────────-->│              │             │              │
    │                 │   (cache, TTL=1h) │              │              │             │              │
    │                 │                  │              │              │             │              │
    │                 │                  │              │              │  ──sign───>│              │
    │                 │                  │              │              │  (SPHINCS+) │              │
    │                 │                  │              │              │  <─────────│              │
    │                 │                  │              │              │             │              │
    │                 │──INSERT unlock_prover_signatures>│              │             │              │
    │                 │   (2/5 collected) │              │              │             │              │
    │                 │                  │              │              │             │              │
    │                 │──UPDATE unlock────>│              │              │             │              │
    │                 │   status='time_lock'             │              │             │              │
    │                 │   release_time=now+24h           │              │             │              │
    │                 │                  │              │              │             │              │
    │                 │                  │              │              │             │  execute()──>│
    │                 │                  │              │              │             │   (24h後)     │
    │<─{unlock_id}────│                  │              │              │             │              │
    │                 │                  │              │              │             │              │

Who Reads This Data:
  Consumer:  GET /v1/user/dashboard        → PG (unlock status)
  Prover:    GET /v1/prover/queue          → PG (signing_queue) + Redis cache
  Explorer:  GET /v1/explorer/unlocks      → PG
  QS Admin:  GET /api/admin/unlocks        → PG (via LockRepository)
```

### 3.3 SEQ#3: Unlock Emergency Path (緊急アンロック)

```
Consumer App      API Server        PostgreSQL       Redis                        L1 Vault
    │                 │                  │              │                              │
    │──POST /unlock/  │                  │              │                              │
    │  emergency──────>│                  │              │                              │
    │                 │                  │              │                              │
    │                 │──GET lock────────>│              │                              │
    │                 │   verify owner    │              │                              │
    │                 │                  │              │                              │
    │                 │──Bond calc: MAX(0.1 ETH, amount * 5%)                          │
    │                 │                  │              │                              │
    │                 │──INSERT unlock────>│              │                              │
    │                 │   requests        │              │                              │
    │                 │   status='emergency_pending'     │                              │
    │                 │   is_emergency=true│              │                              │
    │                 │   bond_amount=... │              │                              │
    │                 │                  │              │                              │
    │                 │──UPDATE locks─────>│              │                              │
    │                 │   status='emergency_pending'     │                              │
    │                 │                  │              │                              │
    │                 │   [7-day wait]   │              │                              │
    │                 │                  │              │                              │
    │                 │──UPDATE unlock────>│              │                              │
    │                 │   status='time_lock'             │                              │
    │                 │   release_time=now+7d            │                              │
    │                 │                  │              │                              │
    │                 │                  │              │           execute()───────────>│
    │                 │                  │              │            (7日後)             │
    │<─{unlock_id}────│                  │              │                              │
    │                 │                  │              │                              │

Who Reads This Data:
  Consumer:  GET /v1/user/dashboard     → PG (emergency status, countdown)
  QS Admin:  GET /api/admin/emergency   → PG
```

### 3.4 SEQ#4: Challenge + Slashing

```
Observer App      API Server        PostgreSQL       Redis              L1
    │                 │                  │              │                 │
    │──POST /challenge>│                  │              │                 │
    │                 │                  │              │                 │
    │                 │──GET unlock───────>│              │                 │
    │                 │   verify validity  │              │                 │
    │                 │                  │              │                 │
    │                 │──INSERT challenges>│              │                 │
    │                 │   status='open'   │              │                 │
    │                 │   defense_deadline=now+48h       │                 │
    │                 │                  │              │                 │
    │                 │──SET challenge:{id}────────────>│                 │
    │                 │   (cache, TTL=48h)│              │                 │
    │                 │                  │              │                 │
    │<─{challenge_id}─│                  │              │                 │
    │                 │                  │              │                 │
    │                 │   [48h後 defense なし]           │                 │
    │                 │                  │              │                 │
    │                 │──UPDATE challenges>│              │                 │
    │                 │   status='resolved'│              │                 │
    │                 │   result='slashed'│              │                 │
    │                 │                  │              │                 │
    │                 │──INSERT slashings─>│              │                 │
    │                 │   60% challenger  │              │                 │
    │                 │   20% insurance   │              │                 │
    │                 │   20% burn        │              │                 │
    │                 │                  │              │   slash()──────>│
    │                 │                  │              │                 │

Who Reads This Data:
  Observer:  GET /v1/observer/challenges → PG
  Prover:    GET /v1/prover/challenges   → PG
  Explorer:  GET /v1/explorer/challenges → PG
  QS Admin:  GET /api/admin/challenges   → PG (via ChallengeRepository)
```

### 3.5 SEQ#5: Prover Registration

```
Prover App        API Server        PostgreSQL       Redis              L1 (Staking)
    │                 │                  │              │                 │
    │──POST /prover/register────────────>│              │                 │
    │                 │                  │              │                 │
    │                 │──INSERT provers───>│              │                 │
    │                 │   status='pending_approval'      │                 │
    │                 │                  │              │                 │
    │                 │──SET prover:{id}────────────────>│                 │
    │                 │   (cache, TTL=1h) │              │                 │
    │                 │                  │              │                 │
    │<─{prover_id}────│                  │              │                 │
    │                 │                  │              │                 │
    │   [Admin approval in QS Admin]    │              │                 │
    │                 │                  │              │                 │
    │                 │──UPDATE provers───>│              │                 │
    │                 │   status='active' │              │                 │
    │                 │                  │              │                 │
    │                 │──DEL+SET prover:{id}────────────>│                 │
    │                 │   (refresh cache) │              │                 │
    │                 │                  │              │                 │
    │                 │                  │              │   stake()──────>│
    │                 │                  │              │                 │
```

### 3.6 SEQ#5b: Prover Operations (Status, Queue, Metrics, Exit)

```
Prover App        API Server        PostgreSQL                 Redis
    │                 │                  │                        │
    │                 │  === update_prover_status (SM-001) ===    │
    │──PUT /prover/   │                  │                        │
    │  status────────>│                  │                        │
    │                 │──ProverRepo::     │                        │
    │                 │  update_status──>│                        │
    │                 │                  │                        │
    │                 │──DEL prover:{id}──────────────────────-->│
    │                 │   (invalidate)   │                        │
    │<─{ok}───────────│                  │                        │
    │                 │                  │                        │
    │                 │  === get_signing_queue (SM-002) ===       │
    │──GET /prover/   │                  │                        │
    │  queue─────────>│                  │                        │
    │                 │──SigningQueueRepo::│                       │
    │                 │  get_by_prover──>│                        │
    │                 │<──[queue items]──│                        │
    │                 │──SET queue:{id}──────────────────────────>│
    │                 │   (populate cache)│                       │
    │<─{queue}────────│                  │                        │
    │                 │                  │                        │
    │                 │  === submit_prover_signature (SM-001) === │
    │──POST /prover/  │                  │                        │
    │  sign──────────>│                  │                        │
    │                 │──signing_queue    │                        │
    │                 │  UPDATE + INSERT  │                        │
    │                 │  prover_signatures│                        │
    │                 │  + metrics update>│                        │
    │                 │                  │                        │
    │                 │──DEL queue:{id}──────────────────────────>│
    │                 │   (invalidate)   │                        │
    │<─{ok}───────────│                  │                        │
    │                 │                  │                        │
    │                 │  === get_prover_metrics (SM-002) ===      │
    │──GET /prover/   │                  │                        │
    │  metrics───────>│                  │                        │
    │                 │──ProverRepo::     │                        │
    │                 │  get_metrics────>│                        │
    │                 │<──[metrics]──────│                        │
    │                 │──SET metrics:{id}────────────────────────>│
    │                 │   (populate cache)│                       │
    │<─{metrics}──────│                  │                        │
    │                 │                  │                        │
    │                 │  === initiate_prover_exit (SM-001) ===    │
    │──POST /prover/  │                  │                        │
    │  exit──────────>│                  │                        │
    │                 │──ProverRepo::     │                        │
    │                 │  create_exit────>│                        │
    │                 │                  │                        │
    │                 │──DEL prover:{id}──────────────────────-->│
    │                 │   (invalidate)   │                        │
    │<─{exit_id}──────│                  │                        │
    │                 │                  │                        │
    │                 │  === get_prover_exit_status (SM-002) ===  │
    │──GET /prover/   │                  │                        │
    │  exit/status───>│                  │                        │
    │                 │──ProverRepo::     │                        │
    │                 │  get_exit───────>│                        │
    │                 │<──[exit status]──│                        │
    │                 │──SET exit:{id}───────────────────────────>│
    │                 │   (populate cache)│                       │
    │<─{exit_status}──│                  │                        │
    │                 │                  │                        │
```

### 3.7 Token Hub (veQS Lock + Delegation)

```
Token Hub App     API Server        PostgreSQL       Redis              L3 Aegis
    │                 │                  │              │                 │
    │──POST /tokenhub/lock──────────────>│              │                 │
    │                 │                  │              │                 │
    │                 │──INSERT veqs_locks>│              │                 │
    │                 │   amount, period  │              │                 │
    │                 │   veqs_amount=calc│              │                 │
    │                 │                  │              │                 │
    │                 │──SET veqs:lock:{addr}───────────>│                 │
    │                 │   (cache, TTL=1h) │              │                 │
    │                 │                  │              │  ──L3 state──>│
    │                 │                  │              │   update       │
    │<─{veqs_amount}──│                  │              │                 │
    │                 │                  │              │                 │

Who Reads This Data:
  Token Hub:   GET /v1/tokenhub/dashboard → PG (via Redis cache)
  Governance:  GET /v1/governance/*       → PG (voting power)
  QS Hub:      GET /v1/qshub/*           → PG
  QS Admin:    GET /api/admin/analytics   → PG
```

---

## 4. Read Path: App別の参照先

### 4.1 Consumer App

| Screen | Data Required | Read From | Cache Key | TTL |
|--------|--------------|-----------|-----------|:---:|
| Dashboard | User locks, balance, activity | PG | `user:dashboard:{addr}` | 5min |
| Lock Detail | Lock status, L1 tx | PG | `lock:{id}` | 5min |
| Transaction History | All user locks + unlocks | PG | - | - |
| Settings | User preferences | PG | `user:settings:{addr}` | 1h |

### 4.2 Prover Portal

| Screen | Data Required | Read From | Cache Key | TTL |
|--------|--------------|-----------|-----------|:---:|
| Dashboard | Prover stats, uptime, earnings | PG (SM-002) | `prover:{id}` | 1h |
| Signing Queue | Pending requests | PG (SM-002, Redis cache) | `queue:{prover_id}` | 1h |
| Metrics | Performance history | PG (SM-002) | `prover:metrics:{id}` | 1h |
| Challenges | Challenges against this prover | PG | - | - |
| Alerts | Prover alerts/notifications | Redis only | `prover:alerts:{id}` | 24h |
| Exit Status | Exit request status | PG (SM-002) | `prover:exit:{id}` | 1h |

### 4.3 Observer App

| Screen | Data Required | Read From | Cache Key | TTL |
|--------|--------------|-----------|-----------|:---:|
| Dashboard | Pending unlocks to monitor | PG | - | - |
| Suspicious Txs | Flagged transactions | PG | - | - |
| My Challenges | Observer's challenge history | PG | - | - |
| Earnings | Challenge rewards | PG | - | - |

### 4.4 Explorer (Public)

| Screen | Data Required | Read From | Cache Key | TTL |
|--------|--------------|-----------|-----------|:---:|
| Overview | TVL, lock count, volume | PG | `explorer:overview` | 5min |
| Locks List | All locks (paginated) | PG | - | - |
| Lock Detail | Single lock + timeline | PG | `lock:{id}` | 5min |
| Provers | Active provers | PG | `explorer:provers` | 5min |

### 4.5 Token Hub

| Screen | Data Required | Read From | Cache Key | TTL |
|--------|--------------|-----------|-----------|:---:|
| Dashboard | veQS balance, voting power | PG | `veqs:lock:{addr}` | 1h |
| Delegates | All delegates (paginated) | PG | - | - |
| Rewards | Claimable rewards | PG | - | - |

### 4.6 QS Admin

| Screen | Data Required | Read From | Cache Key | TTL |
|--------|--------------|-----------|-----------|:---:|
| Dashboard | All counts, TVL, charts | PG | - | - |
| Transactions | All locks + unlocks | PG | - | - |
| Provers | All provers + applications | PG | - | - |
| Observers | All observers | PG | - | - |
| Treasury | Wallets, transfers, budget | PG | - | - |

---

## 5. Write Path: 統一パターン

### 5.1 Dual-Write Pattern (SM-001)

全エンティティの書き込みに適用する統一パターン:

```rust
/// SM-001: Dual-Write Pattern (Write Path)
async fn create_entity(pool: &PgPool, redis: &RedisClient, entity: &Entity) -> Result<()> {
    // STEP 1: PostgreSQL に書き込む (Source of Truth)
    let id = sqlx::query_scalar("INSERT INTO table (...) VALUES (...) RETURNING id")
        .bind(...)
        .fetch_one(pool)
        .await
        .map_err(|e| {
            tracing::error!("DB write failed: {}", e);
            ApiError::Internal(format!("Database error: {}", e))
        })?;

    // STEP 2: Redis キャッシュを無効化 (staleデータ防止)
    let cache_key = format!("entity:{}", id);
    if let Err(e) = redis.del(&cache_key).await {
        // Redis 失敗は致命的ではない（PGがSource of Truth）
        tracing::warn!("Redis cache invalidation failed: {}", e);
    }

    // STEP 3: Index 更新（必要な場合）
    if let Err(e) = redis.sadd(&format!("user:entities:{}", owner), &id).await {
        tracing::warn!("Redis index write failed: {}", e);
    }

    Ok(())
}
```

### 5.2 PG-First Read Pattern (SM-002)

全エンティティの読み取りに適用する統一パターン:

```rust
/// SM-002: PG-First Read Pattern (Read Path)
async fn get_entity(pool: &PgPool, redis: &RedisClient, id: &str) -> Result<Entity> {
    // STEP 1: PostgreSQL から取得 (Source of Truth)
    let entity = sqlx::query_as("SELECT * FROM table WHERE id = $1")
        .bind(id)
        .fetch_optional(pool)
        .await
        .map_err(|e| ApiError::Internal(format!("Database error: {}", e)))?
        .ok_or(ApiError::NotFound("Entity not found"))?;

    // STEP 2: Redis にキャッシュを書き戻す (次回以降の高速読み取り)
    let cache_key = format!("entity:{}", id);
    if let Ok(value) = serde_json::to_string(&entity) {
        let _ = redis.set(&cache_key, &value, CACHE_TTL).await;
    }

    Ok(entity)
}
```

### 5.3 Cache Invalidation Strategy

```
Write操作     → PG INSERT/UPDATE → Redis DEL (キャッシュ無効化) → 次の Read で PG から再取得
Status更新    → PG UPDATE → Redis DEL (staleデータ防止)
Admin操作     → PG UPDATE → Redis DEL (管理者の変更を即座に反映)
```

---

## 6. Route Module Storage Compliance

### 6.1 Route Module Map (All Modules)

All route modules have been migrated to follow SM-001 (Dual-Write) and SM-002 (PG-First Read) patterns.

| Route Module | Pattern | Repository Dependencies | Status |
|-------------|---------|------------------------|:------:|
| **admin.rs** | SM-001/SM-002 | AdminRepository + LockRepository + ProverRepository + ObserverRepository + GovernanceRepository + UserRepository | ✅ Complete (140 handlers) |
| **user.rs** | SM-001/SM-002 | UserRepository + LockRepository | ✅ Complete |
| **prover.rs** | SM-001/SM-002 | ProverRepository + SigningQueueRepository | ✅ Complete |
| **observer.rs** | SM-001/SM-002 | ObserverRepository | ✅ Complete |
| **explorer.rs** | SM-002 (read-only) | LockRepository + ProverRepository + ChallengeRepository | ✅ Complete |
| **governance.rs** | SM-001/SM-002 | GovernanceRepository | ✅ Complete |
| **insurance.rs** | SM-001/SM-002 | InsuranceRepository | ✅ Complete |
| **council.rs** | SM-001/SM-002 | CouncilRepository | ✅ Complete |
| **enterprise.rs** | SM-001/SM-002 | EnterpriseRepository + LockRepository + ProverRepository + ObserverRepository | ✅ Complete (34 handlers) |
| **treasury.rs** | SM-001/SM-002 | TreasuryRepository + GovernanceRepository | ✅ Complete |
| **qs_hub.rs** | SM-001/SM-002 | TokenHubRepository + GovernanceRepository | ✅ Complete |
| **fees.rs** | SM-002 (read-only) | TreasuryRepository + LockRepository | ✅ Complete |
| **resync.rs** | SM-001/SM-002 | LockRepository | ✅ Complete |
| **emergency.rs** | Partial | GovernanceRepository (validation); pause state pending `system_settings` table | ⚠️ Partial |
| **token_hub.rs** | SM-001/SM-002 | TokenHubRepository | ✅ Complete |
| **unlock.rs** | SM-001/SM-002 | LockRepository + SigningQueueRepository | ✅ Complete |

### 6.2 Prover Route Detail (Comprehensive Migration)

The prover module has been fully migrated from Redis-only to PG-first with Redis caching:

| Endpoint | Old Pattern | New Pattern | Repository |
|----------|------------|-------------|------------|
| `update_prover_status` | Redis SET | SM-001: ProverRepository::update_status (PG) → Redis invalidate | ProverRepository |
| `get_signing_queue` | Redis GET | SM-002: SigningQueueRepository::get_by_prover (PG) → Redis cache | SigningQueueRepository |
| `submit_prover_signature` | Redis SET | SM-001: signing_queue UPDATE + prover_signatures INSERT + metrics UPDATE (all PG) | SigningQueueRepository |
| `get_prover_metrics` | Redis GET | SM-002: ProverRepository::get_metrics (PG first) → Redis cache | ProverRepository |
| `initiate_prover_exit` | Redis SET | SM-001: ProverRepository::create_exit (PG) | ProverRepository |
| `get_prover_exit_status` | Redis GET | SM-002: ProverRepository::get_exit (PG first) → Redis cache | ProverRepository |
| `get_prover_alerts` | Redis GET | Redis only (intentional - no PG table needed) | N/A |

### 6.3 Intentional Redis-Only Items

The following items are intentionally Redis-only and do **not** require PG migration:

| Item | Redis Key | TTL | Rationale |
|------|-----------|:---:|-----------|
| SIWE Nonce | `siwe:nonce:{nonce}` | 1h | One-time use, ephemeral by design |
| JWT Session | `session:{token}` | 7d | Session state, logout clears |
| Rate Limit | `ratelimit:{ip}:{endpoint}` | 1min | Ephemeral counters |
| Prover Alerts | `prover:alerts:{prover_id}` | 24h | Transient notifications, no audit requirement |

### 6.4 Remaining Gaps

| # | Item | Current State | Required Action | Priority |
|:--:|------|--------------|-----------------|:--------:|
| G-1 | `emergency.rs` pause state | GovernanceRepository for validation only; pause state uses Redis | Create `system_settings` PG table for pause state | Medium |

---

## 7. Migration Status

### 7.1 Completed Phases

```
Phase 0: Infrastructure                                              ✅ COMPLETE
├── signing_queue テーブル作成 (Migration 008)                        ✅
├── council_members テーブル確認                                      ✅
└── 統一 Repository trait 定義                                       ✅

Phase 1: Lock/Unlock (最重要 - 資産に関わる)                          ✅ COMPLETE
├── Lock: store_lock() を PG + Redis dual-write に変更               ✅
├── Unlock: unlock flow を PG に書き込むよう変更                     ✅
├── Emergency: emergency flow を PG に書き込むよう変更               ✅
└── Consumer App の読み取りを PG-first に変更                        ✅

Phase 2: Challenge/VRF (セキュリティに関わる)                         ✅ COMPLETE
├── Challenge: store_challenge() を PG dual-write に変更             ✅
├── Slashing: resolve_challenge() を PG に書き込むよう変更           ✅
├── VRF: store_vrf_request() を PG dual-write に変更                 ✅
└── Prover Signature: submit_prover_signature() を PG dual-write     ✅

Phase 3: Observer/User (ユーザー体験)                                 ✅ COMPLETE
├── Observer: store_observer() を PG dual-write に変更               ✅
├── User Settings: store_user_settings() を PG dual-write に変更     ✅
├── User Dilithium Key: store_user_dilithium_key() を PG dual-write  ✅
└── Observer Earnings: PG に書き込むよう変更                         ✅

Phase 4: Token Hub (Governance に影響)                                ✅ COMPLETE
├── veQS Lock: store_veqs_lock() を PG dual-write に変更             ✅
├── Delegation: PG dual-write に変更                                 ✅
├── Reward Claim: PG に書き込むよう変更                              ✅
└── QS Balance: PG に書き込むよう変更                                ✅

Phase 5: Prover Operations (SM-001/SM-002 完全移行)                   ✅ COMPLETE
├── update_prover_status: Redis SET → PG + invalidate                ✅
├── get_signing_queue: Redis GET → PG first + cache                  ✅
├── submit_prover_signature: Redis SET → PG (all tables)             ✅
├── get_prover_metrics: Redis GET → PG first + cache                 ✅
├── initiate_prover_exit: Redis SET → PG                             ✅
└── get_prover_exit_status: Redis GET → PG first + cache             ✅

Phase 6: Cleanup                                                      ⚠️ IN PROGRESS
├── Redis KEYS scan の完全除去                                        ✅
├── 全 App の read path を統一パターンに                              ✅
├── stale Redis data の cleanup script                                ⬜ TODO
├── emergency.rs pause state → system_settings table                  ⬜ TODO
└── 統合テスト                                                        ⬜ TODO
```

### 7.2 Summary

| Phase | Description | Status |
|:-----:|-------------|:------:|
| Phase 0 | Infrastructure | ✅ Complete |
| Phase 1 | Lock/Unlock/Emergency | ✅ Complete |
| Phase 2 | Challenge/VRF/Signature | ✅ Complete |
| Phase 3 | Observer/User | ✅ Complete |
| Phase 4 | Token Hub | ✅ Complete |
| Phase 5 | Prover Operations | ✅ Complete |
| Phase 6 | Cleanup/Verification | ⚠️ In Progress |

---

## 8. Verification Checklist

各 Phase 完了時に以下を確認:

```
[x] 全 Write 操作が PostgreSQL に書き込んでいる
[x] Redis は Cache としてのみ使用されている (prover_alerts は intentional Redis-only)
[x] Admin Dashboard に正しいデータが表示される
[x] Consumer App に正しいデータが表示される
[x] Explorer に正しいデータが表示される
[ ] Redis を flush しても全機能が動作する (degraded mode) ← 要テスト
[x] cargo check が成功する
[x] cargo test が成功する (174 tests passed, 0 failed)
[ ] E2E テストが通る ← Phase 6 cleanup で実施予定
[x] SEQUENCES.md 全9シーケンス API検証完了 (2026-02-07)
[x] Frontend FALLBACK/Mock data eliminated (FIX-001~022, 2026-02-08)
```

### 8.1 SEQUENCES.md API Validation (2026-02-07)

全9シーケンスに基づくエンドポイントテストを実施し、以下の問題を発見・修正:

| Issue | Fix | Migration |
|-------|-----|:---------:|
| Consumer FALLBACK_LOCKS causing "Lock not found: 1" | Removed fake lock data from Unlock/index.tsx | - |
| HSM attestation format mismatch (0x vs HSM_ATT_) | Fixed ProverQueue.tsx + dev-mode bypass in prover.rs | - |
| Governance vote 404 on `/proposals/:id/vote` | Added RESTful route in governance.rs + mod.rs | - |
| veQS FK constraint violation (users table) | Added `UserRepository::ensure_exists()` (INSERT ON CONFLICT DO NOTHING) | - |
| Emergency pause `actionId` required but should be optional | Made `actionId` optional with `#[serde(default)]` + auto-generate | - |
| proposals table missing `proposal_type` column | Added proposal_type VARCHAR(20) DEFAULT 'signal' | **012** |

**Result**: All 12 tested endpoints pass. `cargo test` 174 passed, 0 failed.

### 8.2 FIX Execution Frontend Cleanup (2026-02-08)

FIX-001~022 execution eliminated all frontend FALLBACK/Mock data patterns that were masking the real PostgreSQL data:

| Category | Before | After | Impact |
|:---------|:-------|:------|:-------|
| Token Hub hooks | 13 hooks silently returned MOCK_DATA on API error | Error propagated to React Query | Users see error state instead of fake data |
| QS Hub hooks | 9 hooks silently returned MOCK_DATA on API error | Error propagated to React Query | Same as above |
| Explorer components | 6 components had FALLBACK constants with fake stats | Constants zeroed/emptied | Shows empty state or 0 values |
| Prover components | 7 components had FALLBACK_STATS/MOCK data | Constants zeroed/emptied | Shows empty state |
| Governance components | 4 components had hardcoded vote history/proposals | Replaced with empty arrays | Shows empty state |
| Observer Dashboard | FALLBACK_PENDING_UNLOCKS etc. with fake data | Replaced with empty arrays | Shows empty state |
| Consumer | FALLBACK_BALANCE=125.5, fake notifications | Zeroed/emptied | Shows 0 balance, empty notifications |
| QS Admin | 3 generateMock* functions for charts | Functions deleted | Charts show error state |

**Backend changes:**
- `governance.rs`: Quorum now set per proposal_type (Signal 3%, Parameter 4%, Treasury 6%, Upgrade 8%, Emergency 15%)
- `token_hub.rs`: veQS calculation updated to linear time-decay model matching SEQUENCES.md v2.2 §9.1: `voting_power = amount × (remaining_time / MAX_LOCK_TIME)`. Renamed `calculate_veqs_multiplier()` → `calculate_veqs_ratio()`. "multiplier" terminology replaced with "ratio" across all FE/BE code.

**Verification:** `cargo build` success, `cargo test` 175 tests passed.

---

## Appendix A: Redis Key Naming Convention

```
Pattern: {entity}:{id}
  lock:0xabc123...
  prover:prv_001
  observer:obs_001
  challenge:chl_001
  user:0x1234...

Index Pattern: {entity}:index:{field}:{value}
  user:locks:0x1234...          (SET: user's lock IDs)
  prover:queue:prv_001          (cached signing queue)

Cache Pattern: {entity}:{subtype}:{id}
  prover:metrics:prv_001        (cached prover metrics)
  prover:exit:prv_001           (cached exit status)

Ephemeral Pattern: {purpose}:{key}
  siwe:nonce:abc123
  session:jwt_token_hash
  ratelimit:192.168.1.1:/v1/lock

Intentional Redis-Only:
  prover:alerts:prv_001         (transient alerts, no PG table)
```

## Appendix B: Cache TTL Strategy

| Category | TTL | Rationale |
|----------|:---:|-----------|
| Lock/Unlock status | 5min | 頻繁に変化、ユーザーが最新状態を期待 |
| Prover info | 1h | 変化頻度低い、ダッシュボード向け |
| Prover metrics | 1h | SM-002 cache, performance stats |
| Prover exit status | 1h | SM-002 cache, infrequent changes |
| Observer info | 1h | 同上 |
| User settings | 1h | 変更頻度低い |
| Explorer overview | 5min | 公開統計、適度な鮮度 |
| Signing queue | 10min | Prover が高頻度アクセス |
| veQS balance | 1h | 変更頻度低い |
| SIWE nonce | 1h | セキュリティ: 短命 |
| JWT session | 7d | Refresh token lifetime |
| Prover alerts | 24h | Ephemeral notifications |

## Appendix C: Repository Dependencies by Route

```
admin.rs         → AdminRepository, LockRepository, ProverRepository, ObserverRepository, GovernanceRepository, UserRepository (140 handlers)
enterprise.rs    → EnterpriseRepository, LockRepository, ProverRepository, ObserverRepository (34 handlers)
prover.rs        → ProverRepository, SigningQueueRepository (29 handlers)
explorer.rs      → LockRepository, ProverRepository, ChallengeRepository, UserRepository (23 handlers)
token_hub.rs     → TokenHubRepository (18 handlers)
qs_hub.rs        → TokenHubRepository, GovernanceRepository (14 handlers)
observer.rs      → ObserverRepository, LockRepository, ChallengeRepository (13 handlers)
governance.rs    → GovernanceRepository (10 handlers)
council.rs       → CouncilRepository (8 handlers)
user.rs          → UserRepository, LockRepository (6 handlers)
treasury.rs      → TreasuryRepository, GovernanceRepository (6 handlers)
challenge.rs     → ChallengeRepository (4 handlers)
emergency.rs     → GovernanceRepository (4 handlers)
insurance.rs     → InsuranceRepository (4 handlers)
auth.rs          → UserRepository + Redis (3 handlers)
resync.rs        → LockRepository (3 handlers)
fees.rs          → TreasuryRepository, LockRepository (2 handlers)
unlock.rs        → LockRepository (2 handlers)
lock.rs          → LockRepository (1 handler)
Total: ~329 handlers across 22 route modules
```
