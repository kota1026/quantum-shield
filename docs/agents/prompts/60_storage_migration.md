# 60_storage_migration.md - Storage Migration Implementation Prompt

> **Version**: 1.0
> **Created**: 2026-02-07
> **Purpose**: Redis-Only → Dual-Write (PG + Redis Cache) 移行の実装プロンプト
> **Depends On**: STORAGE_ARCHITECTURE.md, MIGRATION_PLAN.md, APP_API_MAPPING.md, DATABASE_ACTUAL_STATE.md

---

## Overview

Quantum Shield のバックエンドにおいて、10個の Critical Gap（G-1 〜 G-10）を解決する。
Consumer アプリが「取引履歴がありません」と表示される根本原因（Redis-Only 書き込み → PG 読み込みの断絶）を修正する。

**Core Principle**: Write PG first → Redis as cache only。Prover パターンを全エンティティに適用する。

## Trigger Commands

```
# ===== Storage Migration 実装 =====
ストレージ移行 開始                 ← Phase 0 から順次実行（★推奨）
ストレージ移行 Phase {N}           ← 特定 Phase の実装
ストレージ移行 Phase {N} 検証      ← 特定 Phase のゲートチェック
ストレージ移行 進捗確認            ← 全体の進捗表示
ストレージ移行 影響確認            ← APP_API_MAPPING.md のフロントエンド影響を確認
```

---

## Phase 0: 初期化（トリガー検出時に必ず実行）

### 0.1 必須ファイル読み込み

```
READ PARALLEL（アーキテクチャ）: ★最重要
├── docs/architecture/STORAGE_ARCHITECTURE.md    ← Three-Layer Model + Golden Rules
├── docs/architecture/MIGRATION_PLAN.md          ← Phase別実装手順
├── docs/architecture/APP_API_MAPPING.md         ← フロントエンド影響範囲
└── docs/architecture/DATABASE_ACTUAL_STATE.md   ← 現在のDB実態

READ PARALLEL（コードベース）:
├── services/api/src/services/mod.rs            ← メインサービスロジック
├── services/api/src/db/repositories/mod.rs     ← Repository一覧
├── services/api/src/routes/                    ← APIルートハンドラ
└── services/api/src/main.rs                    ← AppState定義

READ PARALLEL（参照）:
├── docs/architecture/DOCUMENT_CONTRADICTIONS.md ← 矛盾リスト
├── docs/core/SEQUENCES.md                      ← 正準シーケンス
└── docs/specs/API_SPECIFICATION.yaml           ← APIエンドポイント
```

### 0.2 初期化完了報告

```markdown
## ストレージ移行 初期化完了

### 読み込んだファイル
- STORAGE_ARCHITECTURE.md ✅ (Golden Rules 5つ確認)
- MIGRATION_PLAN.md ✅ (Phase 0-5 確認)
- APP_API_MAPPING.md ✅ (10 Gaps 確認)
- DATABASE_ACTUAL_STATE.md ✅ (43テーブル確認)

### 現在の状況
- 全テーブルスキーマ: 43/43 存在
- 不足テーブル: signing_queue (Phase 0で追加)
- 不足カラム: veqs_locks.status/multiplier, delegations.status/revoked_at (Phase 4で追加)
- 主要な作業: Rust Write Path のデュアルライト修正

### 次のPhase: Phase {N}
→ 実装を開始します
```

---

## Phase 実行フロー（各Phase共通パイプライン）

```
┌─────────────────────────────────────────────────────────────────────┐
│  MIGRATION PHASE PIPELINE - 5 STEPS                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ STEP 1: 現状分析                                              │   │
│  │ ─────────────────────────────────────────────────────────────│   │
│  │ Action: 対象ファイルの Read（services/, routes/, db/)          │   │
│  │ Output: 現在の Write Path / Read Path の図                    │   │
│  │ Gate:   関連ファイル全て読み込み完了                          │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              ↓                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ STEP 2: テスト作成（Test First）                               │   │
│  │ ─────────────────────────────────────────────────────────────│   │
│  │ Action: 検証テストを先に作成                                  │   │
│  │ Required Tests:                                               │   │
│  │   - PG にデータが書き込まれること                             │   │
│  │   - Redis にキャッシュが作成されること                        │   │
│  │   - Redis FLUSHALL 後も読み取りが動作すること                 │   │
│  │   - Admin API と Consumer API のデータ一致                    │   │
│  │ Output: tests/integration/storage_phase_{N}_test.rs           │   │
│  │ Gate:   テストが FAIL すること（Red-Green-Refactor）          │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              ↓                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ STEP 3: 実装（Implementation Loop）                            │   │
│  │ ─────────────────────────────────────────────────────────────│   │
│  │ Action: MIGRATION_PLAN.md の Phase N 手順に従い実装           │   │
│  │ Pattern: Prover パターン（PG INSERT → Redis SET cache）       │   │
│  │ Loop:   実装 → cargo check → テスト → 修正 (max 5 loops)     │   │
│  │ Gate:   cargo check 成功 + テスト PASS                       │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              ↓                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ STEP 4: ゲートチェック                                         │   │
│  │ ─────────────────────────────────────────────────────────────│   │
│  │ Action: Phase完了条件を全て検証                               │   │
│  │ Checks: MIGRATION_PLAN.md §X.Y 完了条件を全項目チェック      │   │
│  │ Gate:   全チェック項目 PASS                                   │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              ↓                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ STEP 5: 完了報告 + 次Phase準備                                 │   │
│  │ ─────────────────────────────────────────────────────────────│   │
│  │ Action: 完了レポート出力 + 進捗更新                           │   │
│  │ Gate:   レポート出力完了                                      │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Phase 0: Infrastructure

### 目標
- `signing_queue` テーブル作成
- 新規 Repository 作成 (signing_queue.rs, vrf.rs, token_hub.rs)
- Repository trait 統一

### 対象 Gap
なし（基盤整備）

### 対象ファイル

| ファイル | 操作 | 内容 |
|---------|:----:|------|
| `services/api/migrations/008_signing_queue.sql` | **新規** | signing_queue テーブル |
| `services/api/src/db/repositories/signing_queue.rs` | **新規** | SigningQueueRepository |
| `services/api/src/db/repositories/vrf.rs` | **新規** | VrfRepository |
| `services/api/src/db/repositories/token_hub.rs` | **新規** | TokenHubRepository |
| `services/api/src/db/repositories/mod.rs` | 修正 | 新Repository登録 |
| `services/api/src/main.rs` | 修正 | AppStateに新Repository追加 |

### SQL マイグレーション

```sql
-- 008_signing_queue.sql
-- MIGRATION_PLAN.md §2.1 に記載のスキーマを使用
```

### Repository パターンテンプレート

```rust
// 新規 Repository の共通パターン
use sqlx::PgPool;

pub struct SigningQueueRepository {
    pool: PgPool,
}

impl SigningQueueRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub async fn create(&self, item: &SigningQueueItem) -> Result<String, sqlx::Error> {
        sqlx::query!(
            r#"INSERT INTO signing_queue (queue_id, unlock_id, prover_id, lock_id, sr_0, sr_1, status)
               VALUES ($1, $2, $3, $4, $5, $6, $7)"#,
            item.queue_id, item.unlock_id, item.prover_id, item.lock_id,
            item.sr_0, item.sr_1, item.status
        )
        .execute(&self.pool)
        .await?;
        Ok(item.queue_id.clone())
    }

    pub async fn get_by_prover(&self, prover_id: &str) -> Result<Vec<SigningQueueItem>, sqlx::Error> {
        sqlx::query_as!(
            SigningQueueItem,
            r#"SELECT * FROM signing_queue WHERE prover_id = $1 AND status = 'pending' ORDER BY assigned_at DESC"#,
            prover_id
        )
        .fetch_all(&self.pool)
        .await
    }
}
```

### 完了条件（MIGRATION_PLAN §2.3 から）

- [ ] `008_signing_queue.sql` がマイグレーションに追加されている
- [ ] `cargo check` が成功する
- [ ] `sqlx migrate run` が成功する
- [ ] 3つの新規Repository (`signing_queue`, `vrf`, `token_hub`) が作成されている
- [ ] `mod.rs` に登録されている

---

## Phase 1: Lock / Unlock / Emergency （★最重要）

### 目標
Consumer「取引履歴がありません」を修正。Lock/Unlock の Write Path を Dual-Write に変更。

### 対象 Gap
| Gap | エンティティ | 現在 | 修正後 |
|:---:|------------|------|--------|
| G-1 | Lock | Redis SET のみ | PG INSERT → Redis SET(cache) |
| G-2 | Unlock | Redis SET のみ | PG INSERT → Redis SET(cache) |
| G-3 | Emergency | Redis SET のみ | PG INSERT → Redis SET(cache) |

### フロントエンド影響（APP_API_MAPPING §9 から）
**フロントエンド変更なし**。Consumer, Explorer, Admin は全て既にPGを読み取るAPIを呼んでいるため、バックエンドの Write Path 修正だけで自動的にデータが表示される。

### 対象ファイル

| ファイル | 操作 | 内容 |
|---------|:----:|------|
| `services/api/src/services/mod.rs` | 修正 | `store_lock()`, `update_lock_status()` をDual-Write化 |
| `services/api/src/db/repositories/lock.rs` | 修正/拡張 | `create()`, `update_status()` メソッド追加 |
| `services/api/src/routes/user.rs` | 修正 | `get_user_locks()` をPG-firstに変更 |
| `services/api/src/routes/emergency.rs` | 修正 | emergency unlock をPG INSERT化 |

### Dual-Write パターン（store_lock の修正例）

```rust
// ===== 修正前（Redis-Only）=====
pub async fn store_lock(&self, lock: &Lock) -> Result<String> {
    let key = format!("lock:{}", lock.lock_id);
    let json = serde_json::to_string(lock)?;
    self.redis.set_ex(&key, &json, 365 * 86400).await?;  // 1年TTL
    self.redis.sadd(&format!("user:locks:{}", lock.wallet_address), &lock.lock_id).await?;
    Ok(lock.lock_id.clone())
}

// ===== 修正後（Dual-Write: Proverパターン）=====
pub async fn store_lock(&self, lock: &Lock) -> Result<String> {
    // 1. PG INSERT (Source of Truth) ★必ず先
    self.lock_repo.create(lock).await?;

    // 2. Redis SET (Cache) - 失敗してもPGにデータは残る
    let key = format!("lock:{}", lock.lock_id);
    let json = serde_json::to_string(lock)?;
    if let Err(e) = self.redis.set_ex(&key, &json, 86400).await {
        tracing::warn!("Redis cache write failed for lock {}: {}", lock.lock_id, e);
        // PGにデータは書き込み済みなので、Redis失敗はwarningのみ
    }

    // 3. Audit Log
    self.audit_log("lock", &lock.lock_id, "created", &lock.wallet_address).await?;

    Ok(lock.lock_id.clone())
}
```

### Read Path パターン（get_user_locks の修正例）

```rust
// ===== 修正前（Redis-Only）=====
pub async fn get_user_locks(&self, wallet: &str) -> Result<Vec<Lock>> {
    let lock_ids: Vec<String> = self.redis.smembers(&format!("user:locks:{}", wallet)).await?;
    // 各lock_idをRedis GETで取得
    let mut locks = Vec::new();
    for id in lock_ids {
        if let Ok(json) = self.redis.get(&format!("lock:{}", id)).await {
            locks.push(serde_json::from_str(&json)?);
        }
    }
    Ok(locks)
}

// ===== 修正後（PG-first + Redis cache）=====
pub async fn get_user_locks(&self, wallet: &str) -> Result<Vec<Lock>> {
    // 1. Redis cache check
    let cache_key = format!("user:locks:{}", wallet);
    if let Ok(cached) = self.redis.get(&cache_key).await {
        if let Ok(locks) = serde_json::from_str::<Vec<Lock>>(&cached) {
            return Ok(locks);
        }
    }

    // 2. PG fallback (Source of Truth)
    let locks = self.lock_repo.get_by_wallet(wallet).await?;

    // 3. Redis cache set
    if let Ok(json) = serde_json::to_string(&locks) {
        let _ = self.redis.set_ex(&cache_key, &json, 300).await; // 5min TTL
    }

    Ok(locks)
}
```

### 完了条件（MIGRATION_PLAN §3.5 から）

- [ ] `store_lock()` が PG + Redis に dual-write
- [ ] `unlock flow` が PG に INSERT (unlock_requests + vrf_requests + signing_queue)
- [ ] `emergency flow` が PG に INSERT
- [ ] `get_user_locks()` が PG-first
- [ ] Admin `/api/admin/locks` にデータが表示される
- [ ] Consumer `/v1/user/dashboard` にデータが表示される
- [ ] Redis FLUSHALL 後も Consumer dashboard が動作する

### 検証テスト

```rust
#[tokio::test]
async fn test_phase1_lock_dual_write() {
    // POST /v1/lock → locks テーブルに行が増える
    // POST /v1/lock → Redis lock:{id} にキャッシュが作成される
    // Redis FLUSHALL → GET /v1/user/dashboard → データが返る（PGフォールバック）
    // Admin GET /api/admin/locks → Consumer POST したデータが見える
}
```

---

## Phase 2: Challenge / VRF / Signature

### 目標
セキュリティ関連データの永続化。30日TTLで揮発するChallengeデータをPGに永続化。

### 対象 Gap
| Gap | エンティティ | 現在 | 修正後 |
|:---:|------------|------|--------|
| G-4 | Challenge | Redis SET (30d TTL) | PG INSERT → Redis SET(cache) |
| G-6 | VRF | Redis SET | PG INSERT → Redis SET(cache) |
| G-7 | Prover Sig | Redis SET | PG INSERT → Redis SET(cache) |

### フロントエンド影響
- Observer Challenge Form: `useSubmitChallenge()` のAPI接続（小変更）
- その他変更なし

### 対象ファイル

| ファイル | 操作 | 内容 |
|---------|:----:|------|
| `services/api/src/services/mod.rs` | 修正 | challenge/vrf/signature をDual-Write化 |
| `services/api/src/db/repositories/challenge.rs` | 拡張 | `create()`, `update_status()`, `submit_defense()` |
| `services/api/src/db/repositories/vrf.rs` | Phase 0で作成済み | `create()`, `update_status()` |
| `services/api/src/routes/challenge.rs` | 修正 | challenge/defense routes |

### 完了条件（MIGRATION_PLAN §4.4 から）

- [ ] Challenge が PG に永続化（30日TTLの揮発性が解消）
- [ ] VRF request が PG に永続化
- [ ] Prover signature が PG に永続化（暗号学的証拠の保全）
- [ ] Admin `/api/admin/challenges` にデータが表示される
- [ ] Observer `/v1/observer/challenges` にデータが表示される

---

## Phase 3: Observer / User

### 目標
Observer登録とUser Settings の永続化。KEYS scan の除去。

### 対象 Gap
| Gap | エンティティ | 現在 | 修正後 |
|:---:|------------|------|--------|
| G-5 | Observer | Redis SET | PG INSERT → Redis SET(cache) |
| G-8 | User Settings | Redis SET | PG UPDATE → Redis SET(cache) |

### フロントエンド影響
- Observer Application: `setTimeout` mock の除去（中変更）
- Observer Earnings: hook接続（中変更）
- その他変更なし

### 対象ファイル

| ファイル | 操作 | 内容 |
|---------|:----:|------|
| `services/api/src/services/mod.rs` | 修正 | observer/user をDual-Write化 |
| `services/api/src/db/repositories/observer.rs` | 拡張 | `create()`, `get_all()` (KEYS scan除去) |
| `services/api/src/db/repositories/user.rs` | 拡張 | `update_settings()`, `store_dilithium_key()` |

### 完了条件（MIGRATION_PLAN §5.4 から）

- [ ] Observer 登録が PG に永続化
- [ ] Admin `/api/admin/observers` にデータが表示される
- [ ] User Settings 変更が Admin に反映される
- [ ] `KEYS observer:obs_*` スキャンが PG query に置換
- [ ] Redis FLUSHALL 後も Observer dashboard が動作する

---

## Phase 4: Token Hub (veQS)

### 目標
veQS Lock と Delegation の永続化。Token Hub のモックデータ除去。

### 対象 Gap
| Gap | エンティティ | 現在 | 修正後 |
|:---:|------------|------|--------|
| G-9 | veQS Lock | Redis SET | PG INSERT → Redis SET(cache) |
| G-10 | Delegation | Redis SET | PG INSERT → Redis SET(cache) |

### 前提：マイグレーション 009

```sql
-- 009_veqs_extensions.sql
ALTER TABLE veqs_locks ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'active';
ALTER TABLE veqs_locks ADD COLUMN multiplier NUMERIC(4,1) NOT NULL DEFAULT 1.0;
CREATE INDEX idx_veqs_locks_status ON veqs_locks(status);

ALTER TABLE delegations ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'active';
ALTER TABLE delegations ADD COLUMN revoked_at TIMESTAMPTZ;
CREATE INDEX idx_delegations_status ON delegations(status);
```

### フロントエンド影響
- フロントエンド変更なし（hooks は既に定義済み、バックエンドがデータを返すようになれば自動的に動作）

### 対象ファイル

| ファイル | 操作 | 内容 |
|---------|:----:|------|
| `services/api/migrations/009_veqs_extensions.sql` | **新規** | カラム追加 |
| `services/api/src/db/repositories/token_hub.rs` | Phase 0で作成済み | veqs/delegation CRUD |
| `services/api/src/services/mod.rs` | 修正 | veqs/delegation をDual-Write化 |
| `services/api/src/routes/token_hub.rs` | 修正 | mock除去、PGクエリ |

### 完了条件（MIGRATION_PLAN §6.3 から）

- [ ] veQS Lock が PG に永続化
- [ ] Delegation が PG に永続化
- [ ] Token Hub dashboard に正しいデータが表示される
- [ ] Governance の投票力が PG veqs_locks から計算される
- [ ] 全ハードコード mock データが除去されている

---

## Phase 5: Cleanup / Verification

### 目標
全エンティティの統合検証。Redis KEYS scan の完全除去。パフォーマンスチェック。

### 実行内容

1. **KEYS scan 除去**: `redis.scan("pattern:*")` を全て PG query に置換
2. **TTL 統一**: STORAGE_ARCHITECTURE Appendix B に準拠
3. **不要 Redis key 除去**: 永続データを Redis に持っている箇所を除去
4. **検証スクリプト実行**: `verify-storage-integrity.sh`

### 最終チェックリスト

```
Storage Rules:
[ ] RULE-1: 全 write が PG に到達している
[ ] RULE-2: Redis は cache のみ
[ ] RULE-3: Redis FLUSHALL 後も全機能動作
[ ] RULE-4: Admin と Consumer のデータが一致
[ ] RULE-5: Write: PG first, Read: Redis first + PG fallback

App Verification:
[ ] Consumer: Dashboard, Lock, Unlock, Emergency, Settings
[ ] Prover: Dashboard, Queue, Metrics, Challenges
[ ] Observer: Dashboard, Challenges, Earnings
[ ] Explorer: Overview, Locks, Unlocks, Provers
[ ] Token Hub: Dashboard, Delegation, Rewards
[ ] Governance: Proposals, Voting
[ ] QS Admin: All sections show real data
[ ] Enterprise: Dashboard, Transactions

Performance:
[ ] Redis cache hit rate > 80%
[ ] API response time < 200ms (cached)
[ ] API response time < 500ms (cache miss)
[ ] No Redis KEYS scan in codebase
```

---

## Critical Rules（絶対遵守）

```xml
<rule id="SM-001" level="ABSOLUTE">
  【Dual-Write 順序】Write は必ず PG → Redis の順。
  PG 失敗時は即エラー。Redis 失敗時は warning log のみ（PGにデータは残る）。
</rule>

<rule id="SM-002" level="ABSOLUTE">
  【既存API互換】Read Path 変更時は、既存の Redis キャッシュからの読み取りを
  フォールバックとして残す。いきなり Redis を切らない。
  パターン: Redis GET → PG SELECT → Redis SET cache
</rule>

<rule id="SM-003" level="ABSOLUTE">
  【テスト先行】各 Phase は必ず検証テストを先に作成してから実装する。
  テストが RED → 実装 → テストが GREEN の Red-Green-Refactor サイクル。
</rule>

<rule id="SM-004" level="ABSOLUTE">
  【Phase依存順序】Phase は番号順に実行。
  Phase 1 完了前に Phase 2 を開始しない。依存関係:
  Phase 0 → Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5
</rule>

<rule id="SM-005" level="ABSOLUTE">
  【ゲートチェック必須】各 Phase の完了条件を全てチェック。
  1つでも FAIL なら次の Phase に進まない。
</rule>

<rule id="SM-006" level="MUST">
  【Audit Log 必須】Write 操作には audit_logs への記録を追加する。
  entity_type, entity_id, action, actor を必ず記録。
</rule>

<rule id="SM-007" level="MUST">
  【Cache TTL 標準化】Redis キャッシュの TTL は以下に統一:
  - Dashboard 集約データ: 5min
  - 個別エンティティ: 1h
  - ユーザー設定: 30min
  - メトリクス: 10min
  ※ STORAGE_ARCHITECTURE Appendix B を参照
</rule>

<rule id="SM-008" level="ABSOLUTE">
  【フロントエンド変更最小化】Phase 0-1 ではフロントエンド変更を一切行わない。
  バックエンドの Write Path 修正のみで Consumer/Explorer/Admin のデータ表示を修正する。
</rule>

<rule id="SM-009" level="ABSOLUTE">
  【BE-001準拠】スタブレスポンス禁止。常にOKを返す実装は禁止。
  実際の PG クエリ結果を返すこと。
</rule>

<rule id="SM-010" level="ABSOLUTE">
  【BE-003準拠】ログ出力必須。以下を必ず記録:
  - リクエスト受信時: tracing::info!
  - PG 操作時: tracing::debug!
  - Redis 操作時: tracing::debug!
  - エラー時: tracing::error! / tracing::warn!
</rule>
```

---

## 完了レポートテンプレート（各Phase共通）

```markdown
## Phase {N} 完了レポート: {Phase名}

### 1. 実装状況
| Step | Task | Status | 備考 |
|:----:|------|:------:|------|
| 1 | 現状分析 | ✅/❌ | |
| 2 | テスト作成 | ✅/❌ | テスト数: {N} |
| 3 | 実装 | ✅/❌ | ループ数: {N}/5 |
| 4 | ゲートチェック | ✅/❌ | PASS/FAIL |

### 2. 解決した Gap
| Gap | エンティティ | 修正前 | 修正後 | 検証結果 |
|:---:|------------|--------|--------|:--------:|
| G-{N} | {entity} | Redis-only | PG+Redis | ✅/❌ |

### 3. 変更ファイル一覧
| ファイル | 変更種別 | 内容 |
|---------|:--------:|------|
| {file} | 新規/修正 | {description} |

### 4. ゲートチェック結果
- [ ] 完了条件1: {結果}
- [ ] 完了条件2: {結果}
...

### 5. 次の Phase
→ Phase {N+1}: {Phase名}
```

---

## 進捗確認テンプレート

```markdown
## ストレージ移行 進捗レポート

### Overview
| Phase | 名称 | Status | Gap | 完了条件 |
|:-----:|------|:------:|:---:|:--------:|
| 0 | Infrastructure | ✅/🔄/⬜ | - | {n}/{total} |
| 1 | Lock/Unlock | ✅/🔄/⬜ | G-1,2,3 | {n}/{total} |
| 2 | Challenge/VRF | ✅/🔄/⬜ | G-4,6,7 | {n}/{total} |
| 3 | Observer/User | ✅/🔄/⬜ | G-5,8 | {n}/{total} |
| 4 | Token Hub | ✅/🔄/⬜ | G-9,10 | {n}/{total} |
| 5 | Cleanup | ✅/🔄/⬜ | - | {n}/{total} |

### Critical Metrics
- Consumer "取引履歴がありません": {修正済み/未修正}
- Admin-Consumer データ一致: {達成/未達成}
- Redis FLUSHALL 耐性: {達成/未達成}
```

---

## 参照ドキュメント一覧

| ドキュメント | パス | 用途 |
|------------|------|------|
| **Storage Architecture** | `docs/architecture/STORAGE_ARCHITECTURE.md` | Three-Layer Model, Golden Rules, Gap分析 |
| **Migration Plan** | `docs/architecture/MIGRATION_PLAN.md` | Phase別実装手順, 完了条件 |
| **App API Mapping** | `docs/architecture/APP_API_MAPPING.md` | フロントエンド影響範囲 |
| **DB Actual State** | `docs/architecture/DATABASE_ACTUAL_STATE.md` | 現在のテーブル実態 |
| **Document Contradictions** | `docs/architecture/DOCUMENT_CONTRADICTIONS.md` | 矛盾リスト |
| **Core SEQUENCES** | `docs/core/SEQUENCES.md` | 正準シーケンス (SEQ#1-9) |
| **API Specification** | `docs/specs/API_SPECIFICATION.yaml` | APIエンドポイント |
| **BE Rules** | `docs/agents/prompts/rules/BE_RULES.md` | BE-001,002,003 |

---

## Appendix: Prover パターン参照コード

現在正しく動作している Prover パターンのコードパス。これが全エンティティの参照実装:

```
Write: POST /v1/prover/register
  → services/mod.rs: register_prover()
  → db/repositories/prover.rs: create()     ← PG INSERT
  → redis: SET prover:{id} (cache, 1h TTL)  ← Redis cache

Read: GET /api/admin/provers
  → routes/admin.rs: get_provers()
  → db/repositories/prover.rs: get_all()    ← PG SELECT
  → (Redis cache は admin では使わない)

Read: GET /v1/prover/dashboard
  → routes/prover.rs: get_dashboard()
  → Redis GET prover:{id}                   ← Redis cache first
  → miss → db/repositories/prover.rs: get() ← PG fallback
  → Redis SET prover:{id} (cache)           ← cache refill
```

この Write: PG first → Read: Redis first + PG fallback パターンを全 10 Gap に適用する。
