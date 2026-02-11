# Storage Migration Plan: Redis-Only to Dual-Write

> **Version**: 1.0
> **Date**: 2026-02-07
> **Status**: Draft - Pending Review
> **Depends On**: [STORAGE_ARCHITECTURE.md](./STORAGE_ARCHITECTURE.md)

---

## 1. Overview

### 1.1 Goal

現状のRedis-only書き込みをPostgreSQL + Redis Cacheの統一パターン（Proverパターン）に移行する。

### 1.2 Scope

10個のGap (G-1 ~ G-10) を5つのPhaseで解決する。

### 1.3 Dependency Graph

```
Phase 0: Infrastructure
    │
    ├── signing_queue テーブル
    ├── council_members テーブル
    └── Repository trait統一
         │
    Phase 1: Lock / Unlock / Emergency    ← 最重要（資産）
         │
    Phase 2: Challenge / VRF / Signature  ← セキュリティ
         │
    Phase 3: Observer / User              ← ユーザー体験
         │
    Phase 4: Token Hub (veQS)             ← Governance依存
         │
    Phase 5: Cleanup / Verification
```

### 1.4 Risk Assessment

| Phase | Risk | Mitigation |
|:-----:|:----:|-----------|
| 0 | Low | テーブル作成のみ、既存機能に影響なし |
| 1 | **High** | 資産に関わるため慎重に。既存Redis読み取りはフォールバックとして残す |
| 2 | Medium | Challenge TTL切れ前に移行必要。既存データ損失リスクあり |
| 3 | Low | ユーザー設定の移行。既存データはRedisから一括移行可能 |
| 4 | Medium | Token Hub未使用データが多い。モック除去も含む |
| 5 | Low | クリーンアップ |

---

## 2. Phase 0: Infrastructure

### 2.1 Migration 008: signing_queue テーブル

```sql
-- 008_signing_queue.sql

CREATE TABLE IF NOT EXISTS signing_queue (
    queue_id VARCHAR(66) PRIMARY KEY,
    unlock_id VARCHAR(66) NOT NULL REFERENCES unlock_requests(unlock_id),
    prover_id VARCHAR(66) NOT NULL REFERENCES provers(prover_id),
    lock_id VARCHAR(66) NOT NULL REFERENCES locks(lock_id),
    sr_0 VARCHAR(66) NOT NULL,
    sr_1 VARCHAR(66) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'processing', 'signed', 'expired', 'failed')),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    signed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_signing_queue_prover ON signing_queue(prover_id);
CREATE INDEX IF NOT EXISTS idx_signing_queue_status ON signing_queue(status);
CREATE INDEX IF NOT EXISTS idx_signing_queue_unlock ON signing_queue(unlock_id);
CREATE INDEX IF NOT EXISTS idx_signing_queue_assigned ON signing_queue(assigned_at DESC);
```

### 2.2 統一 Repository Pattern

各エンティティに対して統一的なRepositoryを作成する:

```
services/api/src/db/repositories/
├── mod.rs              (既存)
├── admin.rs            (既存 ✅)
├── prover.rs           (既存 ✅)
├── lock.rs             (既存 - 拡張が必要)
├── challenge.rs        (既存 - 拡張が必要)
├── user.rs             (既存 - 拡張が必要)
├── observer.rs         (既存 - 拡張が必要)
├── governance.rs       (既存 ✅)
├── treasury.rs         (既存 ✅)
├── support.rs          (既存 ✅)
├── signing_queue.rs    (新規作成)
├── vrf.rs              (新規作成)
└── token_hub.rs        (新規作成)
```

### 2.3 完了条件

- [ ] 008_signing_queue.sql がマイグレーションに追加されている
- [ ] `cargo check` が成功する
- [ ] `sqlx migrate run` が成功する

---

## 3. Phase 1: Lock / Unlock / Emergency

### 3.1 G-1: Lock (store_lock)

**現状:**
```rust
// services/mod.rs - store_lock()
Redis SET lock:{id} → 365 day TTL
Redis SADD user:locks:{addr}
// PostgreSQL: 書き込みなし ❌
```

**修正後:**
```rust
// services/mod.rs - store_lock()
PG INSERT INTO locks (...) → lock_id ✅
Redis SET lock:{id} → 24h TTL (cache)
Redis SADD user:locks:{addr} (index)
```

**影響を受けるファイル:**
- `services/api/src/services/mod.rs` - `store_lock()`, `update_lock_status()`
- `services/api/src/db/repositories/lock.rs` - `create()`, `update_status()` 追加
- `services/api/src/routes/user.rs` - `get_user_locks()` を PG-first に

**テスト:**
```
POST /v1/lock → Admin GET /api/admin/locks でデータ確認
POST /v1/lock → Consumer GET /v1/user/dashboard でデータ確認
Redis FLUSHALL → Consumer GET /v1/user/dashboard でデータ確認（PGフォールバック）
```

### 3.2 G-2: Unlock Request

**現状:**
```rust
// services/mod.rs - unlock flow
Redis SET lock:{id} status update
PG INSERT signing_queue (テーブル不在 ❌)
// PG unlock_requests: 書き込みなし ❌
```

**修正後:**
```rust
PG INSERT INTO unlock_requests (...) → unlock_id ✅
PG INSERT INTO vrf_requests (...) ✅
PG INSERT INTO signing_queue (...) ✅
Redis SET unlock:{id} (cache)
PG UPDATE locks SET status='time_lock' ✅
Redis DEL lock:{id} (cache invalidate)
```

### 3.3 G-2 (Emergency): Emergency Unlock

**現状:**
```rust
// routes/emergency.rs
Redis SET lock:{id} status='emergency_pending'
// PG: 書き込みなし ❌
```

**修正後:**
```rust
PG INSERT INTO unlock_requests (is_emergency=true, bond_amount=...) ✅
PG UPDATE locks SET status='emergency_pending' ✅
Redis DEL lock:{id} (cache invalidate)
```

### 3.4 get_user_locks() の書き換え

**現状:**
```rust
// services/mod.rs
Redis SMEMBERS user:locks:{addr} → Redis GET lock:{id} per lock
// Fallback: Redis KEYS lock:* (全件スキャン)
```

**修正後:**
```rust
// PG-first with Redis cache
PG SELECT * FROM locks WHERE wallet_address = $1 ORDER BY created_at DESC
Redis SET user:dashboard:{addr} (cache aggregated result, TTL=5min)
```

### 3.5 Phase 1 完了条件

- [ ] `store_lock()` が PG + Redis に dual-write
- [ ] `unlock flow` が PG に INSERT (unlock_requests + vrf_requests + signing_queue)
- [ ] `emergency flow` が PG に INSERT
- [ ] `get_user_locks()` が PG-first
- [ ] Admin `/api/admin/locks` にデータが表示される
- [ ] Consumer `/v1/user/dashboard` にデータが表示される
- [ ] Redis FLUSHALL 後も Consumer dashboard が動作する

---

## 4. Phase 2: Challenge / VRF / Signature

### 4.1 G-3: Challenge

**修正内容:**
- `store_challenge()`: PG INSERT + Redis cache
- `submit_defense()`: PG UPDATE + Redis DEL
- `resolve_challenge()`: PG UPDATE + PG INSERT slashings

### 4.2 G-5: VRF Request

**修正内容:**
- `store_vrf_request()`: PG INSERT + Redis cache
- `update_vrf_status()`: PG UPDATE + Redis DEL

### 4.3 G-6: Prover Signature

**修正内容:**
- `submit_prover_signature()`: PG INSERT unlock_prover_signatures + Redis cache

### 4.4 Phase 2 完了条件

- [ ] Challenge が PG に永続化（30日TTLの揮発性が解消）
- [ ] VRF request が PG に永続化
- [ ] Prover signature が PG に永続化（暗号学的証拠の保全）
- [ ] Admin `/api/admin/challenges` にデータが表示される
- [ ] Observer `/v1/observer/challenges` にデータが表示される

---

## 5. Phase 3: Observer / User

### 5.1 G-4: Observer

**修正内容:**
- `store_observer()`: PG INSERT + Redis cache
- `get_observer()`: PG-first with Redis cache
- `get_all_observers()`: PG query (KEYS scan除去)

### 5.2 G-7: User Settings

**修正内容:**
- `store_user_settings()`: PG UPDATE + Redis cache
- `get_user_settings()`: PG-first with Redis cache

### 5.3 User Dilithium Key

**修正内容:**
- `store_user_dilithium_key()`: PG INSERT user_dilithium_keys + Redis cache
- `get_user_dilithium_key()`: PG-first with Redis cache

### 5.4 Phase 3 完了条件

- [ ] Observer 登録が PG に永続化
- [ ] Admin `/api/admin/observers` にデータが表示される
- [ ] User Settings 変更が Admin に反映される
- [ ] `KEYS observer:obs_*` スキャンが PG query に置換
- [ ] Redis FLUSHALL 後も Observer dashboard が動作する

---

## 6. Phase 4: Token Hub (veQS)

### 6.1 G-8: veQS Lock

**修正内容:**
- `store_veqs_lock()`: PG INSERT veqs_locks + Redis cache
- `get_veqs_lock()`: PG-first with Redis cache
- Mock data除去: `get_delegates()`, `get_veqs_rewards()` のハードコードデータをPG queryに

### 6.2 G-9: Delegation

**修正内容:**
- Delegation write: PG INSERT delegations + Redis cache
- `get_user_delegations()`: PG-first with Redis cache
- `get_delegates()`: PG query (mock除去)

### 6.3 Phase 4 完了条件

- [ ] veQS Lock が PG に永続化
- [ ] Delegation が PG に永続化
- [ ] Token Hub dashboard に正しいデータが表示される
- [ ] Governance の投票力が PG veqs_locks から計算される
- [ ] 全ハードコード mock データが除去されている

---

## 7. Phase 5: Cleanup / Verification

### 7.1 Cleanup Tasks

- [ ] 全 `redis.scan("pattern:*")` 呼び出しを PG query に置換
- [ ] Redis TTL の統一 (STORAGE_ARCHITECTURE Appendix B に準拠)
- [ ] 不要な Redis キー pattern の除去
- [ ] 全 App の read path が統一パターンに準拠

### 7.2 Integration Verification Script

```bash
#!/bin/bash
# verify-storage-integrity.sh

echo "=== Storage Integrity Check ==="

# 1. PG にデータが存在するか
echo "--- PostgreSQL ---"
psql $DATABASE_URL -c "SELECT 'locks', COUNT(*) FROM locks UNION ALL
                        SELECT 'unlock_requests', COUNT(*) FROM unlock_requests UNION ALL
                        SELECT 'challenges', COUNT(*) FROM challenges UNION ALL
                        SELECT 'provers', COUNT(*) FROM provers UNION ALL
                        SELECT 'observers', COUNT(*) FROM observers UNION ALL
                        SELECT 'veqs_locks', COUNT(*) FROM veqs_locks;"

# 2. Redis FLUSHALL してもAPIが動くか
echo "--- Redis Resilience Test ---"
redis-cli FLUSHALL
curl -s http://localhost:8080/v1/health | jq .
curl -s http://localhost:8080/api/admin/dashboard | jq .status

# 3. Admin と Consumer のデータ一致
echo "--- Cross-App Consistency ---"
ADMIN_LOCKS=$(curl -s http://localhost:8080/api/admin/locks | jq .total)
# Consumer locks count (requires auth)
echo "Admin lock count: $ADMIN_LOCKS"
```

### 7.3 Final Verification Checklist

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

## 8. SEQUENCES.md 更新提案

移行完了後、以下の更新をSEQUENCES.mdに提案:

### 8.1 Core SEQUENCES.md (docs/core/)

**変更不要**: L3-L1のシーケンス自体は正しい。APIサーバーの内部ストレージ戦略はSEQUENCESのスコープ外。

### 8.2 UI SEQUENCES.md (docs/specs/)

**追加提案**: Token Hub フロー (Section 3) に以下を明記:

```
Token Hub Lock フロー:
  1. QS Token承認 → L3 veQSManager.lock()
  2. veQS残高計算 → PostgreSQL + Redis cache
  3. 投票力反映 → Governance proposal/vote 時に veqs_locks テーブル参照

Delegation フロー:
  1. Delegate選択 → PG delegates テーブル
  2. 委任実行 → L3 + PG delegations テーブル
  3. 委任解除 → L3 + PG UPDATE + Redis cache invalidate
```

### 8.3 DATABASE_DESIGN.md

**更新必要**:
- Section 1.1 の図にRedisの役割を明記 ("Cache layer, NOT primary storage")
- Redis Section を追加: "Redisはcacheとephemeral dataのみ。永続データは必ずPostgreSQLに書き込む"
- Caching strategy section を追加 (STORAGE_ARCHITECTURE Appendix B を参照)

---

## Appendix: Estimated Effort

| Phase | Files Modified | New Files | Estimated Time |
|:-----:|:--------------:|:---------:|:--------------:|
| 0 | 3 | 4 | 2-3h |
| 1 | 8-10 | 0 | 6-8h |
| 2 | 5-7 | 2 | 4-6h |
| 3 | 5-7 | 0 | 3-4h |
| 4 | 5-7 | 1 | 4-6h |
| 5 | 3-5 | 1 | 2-3h |
| **Total** | **~35** | **~8** | **21-30h** |
