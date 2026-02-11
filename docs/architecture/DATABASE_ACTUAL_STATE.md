# DATABASE_ACTUAL_STATE.md — PostgreSQL テーブル実態一覧

> **Version**: 3.2
> **Date**: 2026-02-08
> **Purpose**: 実際のマイグレーションファイル（001〜012）から抽出した全テーブル・カラム定義 + 実DB検証結果
> **Source**: `services/api/migrations/001_initial_schema.sql` 〜 `012_add_proposal_type.sql`
> **Note**: v3.1 - 実DB検証実施。329 handlers / 320 routes / 16 repos / 54 tables (53 user + _sqlx_migrations)
> **IMPORTANT**: `_sqlx_migrations` には version 1-4 のみ記録されている。migrations 005-012 は外部で適用。一部テーブル（signing_queue, provers）に実DBとマイグレーション定義の乖離あり。

---

## 目次

1. [概要サマリー](#1-概要サマリー)
2. [マイグレーション一覧](#2-マイグレーション一覧)
3. [テーブル定義一覧（53テーブル）](#3-テーブル定義一覧)
4. [Repository ↔ テーブル対応表](#4-repository--テーブル対応表)
5. [設計書との差分分析](#5-設計書との差分分析)
6. [Migration Plan との整合性](#6-migration-plan-との整合性)
7. [Redis ↔ PostgreSQL 対応表（Dual-Write状況）](#7-redis--postgresql-対応表dual-write状況)
8. [不足テーブル・カラム一覧](#8-不足テーブルカラム一覧)
9. [次のマイグレーション計画](#9-次のマイグレーション計画)
10. [FIX Execution Results (2026-02-08)](#10-fix-execution-results-2026-02-08)

---

## 1. 概要サマリー

| 指標 | 値 |
|------|:--:|
| **総テーブル数** | 53 |
| **総インデックス数** | ~105 |
| **外部キー制約** | ~42 |
| **ユニーク制約（PK除く）** | 4 |
| **CHECK制約** | 6 |
| **部分インデックス（WHERE）** | 10 |
| **シードデータ** | 4 INSERT文（admin_roles, l1_sync_state, insurance_fund, faqs） |
| **Repository数** | 16 |

### ドメイン別テーブル分布

| ドメイン | テーブル数 | テーブル名 |
|----------|:----------:|-----------|
| **Core User** | 3 | users, user_settings, user_dilithium_keys |
| **Lock/Unlock** | 5 | locks, unlock_requests, unlock_prover_signatures, vrf_requests, unlock_risk_scores |
| **Prover** | 3 | provers, prover_exits, prover_metrics |
| **Signing Queue** | 1 | signing_queue |
| **Challenge/Slashing** | 2 | challenges, slashings |
| **Governance** | 3 | proposals, votes, proposal_actions |
| **Council** | 1 | council_members |
| **Token Hub (veQS)** | 4 | veqs_locks, delegations, reward_epochs, reward_claims |
| **Observer** | 2 | observers, observer_earnings |
| **Admin** | 4 | admin_users, admin_roles, admin_audit_logs, admin_sessions |
| **Treasury** | 6 | treasury_wallets, treasury_transactions, treasury_approvals, protocol_revenue, budget_allocations, treasury_audit_log |
| **Support** | 3 | support_tickets, faqs, announcements |
| **Metrics/Alert** | 3 | daily_metrics, alert_rules, alerts |
| **Audit/System** | 2 | audit_logs, system_settings |
| **Enterprise (Legacy)** | 1 | enterprise_contracts |
| **Enterprise (Full)** | 6 | enterprise_organizations, enterprise_users, enterprise_api_keys, enterprise_applications, enterprise_audit_log, enterprise_settings |
| **Insurance** | 3 | insurance_fund, insurance_claims, insurance_transactions |
| **Infra** | 1 | l1_sync_state |
| **合計** | **53** | |

---

## 2. マイグレーション一覧

| # | ファイル | 内容 | テーブル数 | sqlx追跡 |
|---|---------|------|:----------:|:--------:|
| 001 | `001_initial_schema.sql` | コアスキーマ全体 | 36 | ✅ |
| 002 | `002_support_tables.sql` | サポート・FAQ・お知らせ | 3 | ✅ |
| 003 | `003_l1_sync_state.sql` | L1ブロック同期追跡 | 1 | ✅ |
| 004 | `004_add_user_status.sql` | user_settings に status 追加 | 0 (ALTER) | ✅ |
| 005 | `005_prover_application_fields.sql` | provers にアプリケーション項目追加 | 0 (ALTER) | ⚠️ 未登録 |
| 006 | `006_insurance_tables.sql` | 保険ファンド・クレーム・取引 | 3 | ⚠️ 未登録 |
| 007 | `007_add_missing_indexes.sql` | パフォーマンスインデックス追加 | 0 (INDEX) | ⚠️ 未登録 |
| 008 | `008_signing_queue.sql` | Prover署名キューテーブル | 1 | ⚠️ 未登録・スキーマ乖離 |
| 009 | `009_phantom_tables_and_columns.sql` | Council/Treasury phantom tables + proposals カラム追加 | 3 (+ ALTER) | ⚠️ 未登録 |
| 010 | `010_admin_auth_security.sql` | admin_sessions に refresh_token_hash 追加 | 0 (ALTER) | ⚠️ 未登録 |
| 011 | `011_enterprise_tables.sql` | Enterprise組織・ユーザー・APIキー・申請・監査・設定 | 6 | ⚠️ 未登録 |
| 012 | `012_add_proposal_type.sql` | proposals に proposal_type カラム追加 | 0 (ALTER) | ⚠️ 未登録 |

> **⚠️ IMPORTANT**: `_sqlx_migrations` テーブルには version 1-4 のみ記録されている。migrations 005-012 は sqlx migrate 以外の方法で適用された。これにより `signing_queue` テーブルのスキーマ乖離（C-13）が発生した。

---

## 3. テーブル定義一覧

### 3.1 Core User ドメイン

#### `users`
| カラム | 型 | 制約 | デフォルト |
|--------|-----|------|-----------|
| `wallet_address` | VARCHAR(42) | **PK** | - |
| `pk_dilithium` | BYTEA | nullable | NULL |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() |
| `last_active` | TIMESTAMPTZ | nullable | NULL |

**Index**: `idx_users_created (created_at DESC)`

#### `user_settings`
| カラム | 型 | 制約 | デフォルト | マイグレーション |
|--------|-----|------|-----------|:---------------:|
| `wallet_address` | VARCHAR(42) | **PK**, FK→users | - | 001 |
| `email` | VARCHAR(255) | nullable | NULL | 001 |
| `language` | VARCHAR(5) | NOT NULL | 'ja' | 001 |
| `notification_email` | BOOLEAN | NOT NULL | TRUE | 001 |
| `notification_browser` | BOOLEAN | NOT NULL | TRUE | 001 |
| `two_factor_enabled` | BOOLEAN | NOT NULL | FALSE | 001 |
| `updated_at` | TIMESTAMPTZ | NOT NULL | NOW() | 001 |
| `status` | VARCHAR(20) | NOT NULL | 'active' | **004** |

**Index**: `idx_user_settings_status (status)` [004]

#### `user_dilithium_keys`
| カラム | 型 | 制約 | デフォルト |
|--------|-----|------|-----------|
| `key_id` | VARCHAR(66) | **PK** | - |
| `wallet_address` | VARCHAR(42) | NOT NULL, FK→users | - |
| `pk_dilithium` | BYTEA | NOT NULL | - |
| `is_active` | BOOLEAN | NOT NULL | TRUE |
| `registered_at` | TIMESTAMPTZ | NOT NULL | NOW() |
| `revoked_at` | TIMESTAMPTZ | nullable | NULL |

**Indexes**: `idx_user_dilithium_keys_wallet`, `idx_user_dilithium_keys_wallet_active (WHERE is_active=TRUE)` [007]

---

### 3.2 Lock/Unlock ドメイン

#### `locks`
| カラム | 型 | 制約 | デフォルト |
|--------|-----|------|-----------|
| `lock_id` | VARCHAR(66) | **PK** | - |
| `wallet_address` | VARCHAR(42) | NOT NULL, FK→users | - |
| `chain_id` | BIGINT | NOT NULL | - |
| `asset` | VARCHAR(42) | NOT NULL | - |
| `amount` | NUMERIC(78,0) | NOT NULL | - |
| `dest_addr` | BYTEA | NOT NULL | - |
| `expiry` | BIGINT | NOT NULL | - |
| `nonce` | BIGINT | NOT NULL | - |
| `pk_dilithium` | BYTEA | NOT NULL | - |
| `sig_dilithium` | BYTEA | NOT NULL | - |
| `sr_0` | VARCHAR(66) | NOT NULL | - |
| `status` | VARCHAR(20) | NOT NULL | 'pending' |
| `l1_tx_hash` | VARCHAR(66) | nullable | NULL |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() |
| `confirmed_at` | TIMESTAMPTZ | nullable | NULL |

**Indexes**: `idx_locks_wallet`, `idx_locks_status`, `idx_locks_created (DESC)`, `idx_locks_chain`, `idx_locks_asset` [007], `idx_locks_l1_tx_hash (WHERE NOT NULL)` [007]

#### `unlock_requests`
| カラム | 型 | 制約 | デフォルト |
|--------|-----|------|-----------|
| `unlock_id` | VARCHAR(66) | **PK** | - |
| `lock_id` | VARCHAR(66) | NOT NULL, FK→locks | - |
| `wallet_address` | VARCHAR(42) | NOT NULL, FK→users | - |
| `dest_addr` | BYTEA | NOT NULL | - |
| `amount` | NUMERIC(78,0) | NOT NULL | - |
| `sig_dilithium` | BYTEA | NOT NULL | - |
| `sr_0` | VARCHAR(66) | NOT NULL | - |
| `sr_1` | VARCHAR(66) | NOT NULL | - |
| `status` | VARCHAR(20) | NOT NULL | 'pending' |
| `is_emergency` | BOOLEAN | NOT NULL | FALSE |
| `bond_amount` | NUMERIC(78,0) | nullable | NULL |
| `release_time` | TIMESTAMPTZ | nullable | NULL |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() |

**Indexes**: `idx_unlocks_lock`, `idx_unlocks_wallet`, `idx_unlocks_status`, `idx_unlocks_release`, `idx_unlock_requests_lock_status (lock_id, status)` [007], `idx_unlock_requests_is_emergency` [007]

#### `unlock_prover_signatures`
| カラム | 型 | 制約 | デフォルト |
|--------|-----|------|-----------|
| `signature_id` | VARCHAR(66) | **PK** | - |
| `unlock_id` | VARCHAR(66) | NOT NULL, FK→unlock_requests | - |
| `prover_id` | VARCHAR(66) | NOT NULL | - |
| `sig_sphincs` | BYTEA | NOT NULL | - |
| `sr_0` | VARCHAR(66) | NOT NULL | - |
| `sr_1` | VARCHAR(66) | NOT NULL | - |
| `is_valid` | BOOLEAN | NOT NULL | TRUE |
| `signed_at` | TIMESTAMPTZ | NOT NULL | NOW() |

**Unique**: `(unlock_id, prover_id)`
**Indexes**: `idx_unlock_prover_sigs_prover_id` [007], `idx_unlock_prover_sigs_unlock_prover` [007]

#### `vrf_requests`
| カラム | 型 | 制約 | デフォルト |
|--------|-----|------|-----------|
| `vrf_id` | VARCHAR(66) | **PK** | - |
| `unlock_id` | VARCHAR(66) | UNIQUE, NOT NULL, FK→unlock_requests | - |
| `vrf_seed` | BYTEA | NOT NULL | - |
| `selected_prover_ids` | JSONB | NOT NULL | - |
| `prover_weights` | JSONB | NOT NULL | - |
| `status` | VARCHAR(20) | NOT NULL | 'pending' |
| `requested_at` | TIMESTAMPTZ | NOT NULL | NOW() |
| `completed_at` | TIMESTAMPTZ | nullable | NULL |

**Index**: `idx_vrf_requests_status` [007]

#### `unlock_risk_scores`
| カラム | 型 | 制約 | デフォルト |
|--------|-----|------|-----------|
| `unlock_id` | VARCHAR(66) | **PK**, FK→unlock_requests | - |
| `score` | INTEGER | NOT NULL, CHECK(0-100) | - |
| `level` | VARCHAR(10) | NOT NULL, CHECK('low','medium','high') | - |
| `reasons` | JSONB | NOT NULL | '[]' |
| `calculated_at` | TIMESTAMPTZ | NOT NULL | NOW() |

**Indexes**: `idx_risk_scores_level`, `idx_risk_scores_score (DESC)`

---

### 3.3 Prover ドメイン

#### `provers`
| カラム | 型 | 制約 | デフォルト | マイグレーション |
|--------|-----|------|-----------|:---------------:|
| `prover_id` | VARCHAR(66) | **PK** | - | 001 |
| `operator_addr` | VARCHAR(42) | NOT NULL | - | 001 |
| `sphincs_pubkey` | BYTEA | NOT NULL | - | 001 |
| `stake_amount` | NUMERIC(78,0) | NOT NULL | - | 001 |
| `hsm_attestation` | BYTEA | nullable | NULL | 001 |
| `status` | VARCHAR(20) | NOT NULL | 'pending_approval' | 001 |
| `tier` | VARCHAR(20) | NOT NULL | 'standard' | 001 |
| `registered_at` | TIMESTAMPTZ | NOT NULL | NOW() | 001 |
| `approved_at` | TIMESTAMPTZ | nullable | NULL | 001 |
| `organization_name` | VARCHAR(255) | nullable | NULL | **005** |
| `country` | VARCHAR(2) | nullable | NULL | **005** |
| `website` | VARCHAR(255) | nullable | NULL | **005** |
| `contact_email` | VARCHAR(255) | nullable | NULL | **005** |
| `validator_experience` | TEXT | nullable | NULL | **005** |
| `hsm_provider` | VARCHAR(100) | nullable | NULL | **005** |
| `infrastructure_location` | VARCHAR(100) | nullable | NULL | **005** |
| `business_registration_number` | VARCHAR(100) | nullable | NULL | **005** |
| `documents_count` | INTEGER | NOT NULL | 0 | **005** |
| `uptime_percentage` | NUMERIC(5,2) | nullable | 99.5 | **外部追加** ⚠️ |
| `pending_rewards` | VARCHAR(50) | nullable | '0' | **外部追加** ⚠️ |
| `total_earnings` | VARCHAR(50) | nullable | '0' | **外部追加** ⚠️ |

> **⚠️ SCHEMA DRIFT**: `uptime_percentage`, `pending_rewards`, `total_earnings` は migration ファイルに定義がない。外部で追加されたカラム。`prover.rs` ルートハンドラがこれらを参照している。

**Indexes**: `idx_provers_status`, `idx_provers_operator`, `idx_provers_tier`, `idx_provers_organization_name` [005], `idx_provers_contact_email` [005]

#### `prover_exits`
| カラム | 型 | 制約 | デフォルト |
|--------|-----|------|-----------|
| `exit_id` | VARCHAR(66) | **PK** | - |
| `prover_id` | VARCHAR(66) | UNIQUE, NOT NULL, FK→provers | - |
| `initiated_at` | TIMESTAMPTZ | NOT NULL | NOW() |
| `unbonding_end` | TIMESTAMPTZ | NOT NULL | - |
| `stake_to_return` | NUMERIC(78,0) | NOT NULL | - |
| `pending_rewards` | NUMERIC(78,0) | NOT NULL | - |
| `status` | VARCHAR(20) | NOT NULL | 'unbonding' |

**Index**: `idx_prover_exits_status` [007]

#### `prover_metrics`
| カラム | 型 | 制約 | デフォルト |
|--------|-----|------|-----------|
| `prover_id` | VARCHAR(66) | **PK**, FK→provers | - |
| `total_signatures` | BIGINT | NOT NULL | 0 |
| `signatures_24h` | BIGINT | NOT NULL | 0 |
| `signatures_7d` | BIGINT | NOT NULL | 0 |
| `avg_response_time_ms` | BIGINT | NOT NULL | 0 |
| `success_rate` | DOUBLE PRECISION | NOT NULL | 100 |
| `uptime_percentage` | DOUBLE PRECISION | NOT NULL | 100 |
| `total_rewards` | NUMERIC(78,0) | NOT NULL | 0 |
| `updated_at` | TIMESTAMPTZ | NOT NULL | NOW() |

---

### 3.4 Signing Queue ドメイン ★NEW (008) ⚠️ SCHEMA DRIFT

> **WARNING**: 実DBのスキーマはmigration 008と異なる。migration 008は `CREATE TABLE IF NOT EXISTS` のため、先に外部で作成されたテーブルが優先されている。以下は**実際のDB上のスキーマ**を記載する。

#### `signing_queue` (実際のDB — migration 008 とは異なる)
| カラム | 型 | 制約 | デフォルト | 起源 |
|--------|-----|------|-----------|:----:|
| `id` | SERIAL | **PK** (auto) | nextval | 外部作成 |
| `queue_id` | VARCHAR(100) | UNIQUE, NOT NULL | - | 外部作成 |
| `prover_id` | VARCHAR(100) | NOT NULL | - | 外部作成 |
| `lock_id` | VARCHAR(100) | NOT NULL | - | 外部作成 |
| `unlock_type` | VARCHAR(20) | nullable | 'normal' | 外部作成 |
| `user_address` | VARCHAR(100) | NOT NULL | - | 外部作成 |
| `amount` | VARCHAR(50) | NOT NULL | - | 外部作成 |
| `asset` | VARCHAR(20) | nullable | 'ETH' | 外部作成 |
| `sr_0` | TEXT | nullable | NULL | 外部作成 |
| `sr_1` | TEXT | nullable | NULL | 外部作成 |
| `priority` | VARCHAR(20) | nullable | 'normal' | 外部作成 |
| `status` | VARCHAR(20) | nullable | 'pending' | 外部作成 |
| `dilithium_verified` | BOOLEAN | nullable | FALSE | 外部作成 |
| `created_at` | TIMESTAMPTZ | nullable | NOW() | 外部作成 |
| `deadline` | TIMESTAMPTZ | nullable | NULL | 外部作成 |
| `completed_at` | TIMESTAMPTZ | nullable | NULL | 外部作成 |
| `unlock_id` | VARCHAR(100) | nullable | NULL | ALTER追加 |

**Indexes**: `signing_queue_pkey (id)`, `signing_queue_queue_id_key (UNIQUE queue_id)`, `idx_signing_queue_prover`, `idx_signing_queue_prover_status (prover_id, status)`, `idx_signing_queue_status`

**vs Migration 008 との差異**:
| 項目 | Migration 008 | 実DB |
|------|:------------:|:----:|
| PK | `queue_id VARCHAR(66)` | `id SERIAL` (queue_id はUNIQUE) |
| unlock_id | NOT NULL, FK→unlock_requests | nullable, no FK |
| sr_0/sr_1 | VARCHAR(66) NOT NULL | TEXT nullable |
| status | CHECK(5値) | no CHECK |
| タイムスタンプ | `assigned_at`, `signed_at`, `expires_at` | `created_at`, `completed_at`, `deadline` |
| 追加カラム | なし | `id`, `unlock_type`, `user_address`, `amount`, `asset`, `priority`, `dilithium_verified` |
| FK制約 | provers, locks, unlock_requests | なし |
| UNIQUE | `(unlock_id, prover_id)` | `(queue_id)` のみ |

**Repository**: `SigningQueueRepository` (`signing_queue.rs`) — 実DBスキーマに合わせてコード修正済み

---

#### `signing_queue` (Migration 008 定義 — 参考用)
<details>
<summary>クリックで展開</summary>

| カラム | 型 | 制約 | デフォルト |
|--------|-----|------|-----------|
| `queue_id` | VARCHAR(66) | **PK** | - |
| `unlock_id` | VARCHAR(66) | NOT NULL, FK→unlock_requests | - |
| `prover_id` | VARCHAR(66) | NOT NULL, FK→provers | - |
| `lock_id` | VARCHAR(66) | NOT NULL, FK→locks | - |
| `sr_0` | VARCHAR(66) | NOT NULL | - |
| `sr_1` | VARCHAR(66) | NOT NULL | - |
| `status` | VARCHAR(20) | NOT NULL, CHECK(5値) | 'pending' |
| `assigned_at` | TIMESTAMPTZ | nullable | NOW() |
| `signed_at` | TIMESTAMPTZ | nullable | NULL |
| `expires_at` | TIMESTAMPTZ | nullable | NULL |

**CHECK**: `status IN ('pending', 'processing', 'signed', 'expired', 'failed')`
**Unique**: `(unlock_id, prover_id)`
</details>

---

### 3.5 Challenge/Slashing ドメイン

#### `challenges`
| カラム | 型 | 制約 | デフォルト |
|--------|-----|------|-----------|
| `challenge_id` | VARCHAR(66) | **PK** | - |
| `lock_id` | VARCHAR(66) | NOT NULL, FK→locks | - |
| `unlock_id` | VARCHAR(66) | nullable, FK→unlock_requests | NULL |
| `challenger` | VARCHAR(42) | NOT NULL | - |
| `fraud_proof_hash` | VARCHAR(66) | NOT NULL | - |
| `bond` | NUMERIC(78,0) | NOT NULL | - |
| `challenged_at` | TIMESTAMPTZ | NOT NULL | NOW() |
| `defense_deadline` | TIMESTAMPTZ | NOT NULL | - |
| `status` | VARCHAR(20) | NOT NULL | 'pending' |
| `defender` | VARCHAR(42) | nullable | NULL |
| `defense_proof_hash` | VARCHAR(66) | nullable | NULL |
| `resolved_at` | TIMESTAMPTZ | nullable | NULL |

**Indexes**: `idx_challenges_lock`, `idx_challenges_status`, `idx_challenges_deadline`, `idx_challenges_challenger` [007], `idx_challenges_unlock_id` [007], `idx_challenges_resolved_at (DESC, WHERE NOT NULL)` [007]

#### `slashings`
| カラム | 型 | 制約 | デフォルト |
|--------|-----|------|-----------|
| `slashing_id` | VARCHAR(66) | **PK** | - |
| `challenge_id` | VARCHAR(66) | UNIQUE, NOT NULL, FK→challenges | - |
| `prover_id` | VARCHAR(66) | NOT NULL, FK→provers | - |
| `slash_amount` | NUMERIC(78,0) | NOT NULL | - |
| `challenger_reward` | NUMERIC(78,0) | NOT NULL | - |
| `insurance_amount` | NUMERIC(78,0) | NOT NULL | - |
| `burn_amount` | NUMERIC(78,0) | NOT NULL | - |
| `l1_tx_hash` | VARCHAR(66) | nullable | NULL |
| `slashed_at` | TIMESTAMPTZ | NOT NULL | NOW() |

**Indexes**: `idx_slashings_prover_id` [007], `idx_slashings_slashed_at (DESC)` [007]

---

### 3.6 Governance ドメイン

#### `proposals`
| カラム | 型 | 制約 | デフォルト | マイグレーション |
|--------|-----|------|-----------|:---------------:|
| `proposal_id` | VARCHAR(66) | **PK** | - | 001 |
| `title` | VARCHAR(200) | NOT NULL | - | 001 |
| `description` | TEXT | nullable | NULL | 001 |
| `proposer` | VARCHAR(42) | NOT NULL | - | 001 |
| `status` | VARCHAR(20) | NOT NULL | 'pending' | 001 |
| `votes_for` | NUMERIC(78,0) | NOT NULL | 0 | 001 |
| `votes_against` | NUMERIC(78,0) | NOT NULL | 0 | 001 |
| `votes_abstain` | NUMERIC(78,0) | NOT NULL | 0 | 001 |
| `quorum` | NUMERIC(78,0) | NOT NULL | - | 001 |
| `start_time` | TIMESTAMPTZ | nullable | NULL | 001 |
| `end_time` | TIMESTAMPTZ | nullable | NULL | 001 |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | 001 |
| `executed_by` | VARCHAR(42) | nullable | NULL | **009** |
| `executed_tx_hash` | VARCHAR(66) | nullable | NULL | **009** |
| `executed_at` | TIMESTAMPTZ | nullable | NULL | **009** |
| `proposal_type` | VARCHAR(20) | NOT NULL | 'signal' | **012** |

**Indexes**: `idx_proposals_status`, `idx_proposals_end`

#### `votes`
| カラム | 型 | 制約 | デフォルト |
|--------|-----|------|-----------|
| `vote_id` | VARCHAR(66) | **PK** | - |
| `proposal_id` | VARCHAR(66) | NOT NULL, FK→proposals | - |
| `voter` | VARCHAR(42) | NOT NULL | - |
| `support` | SMALLINT | NOT NULL | - |
| `weight` | NUMERIC(78,0) | NOT NULL | - |
| `l1_tx_hash` | VARCHAR(66) | nullable | NULL |
| `voted_at` | TIMESTAMPTZ | NOT NULL | NOW() |

**Unique**: `(proposal_id, voter)`
**Indexes**: `idx_votes_proposal`, `idx_votes_voter`

#### `proposal_actions`
| カラム | 型 | 制約 | デフォルト |
|--------|-----|------|-----------|
| `action_id` | VARCHAR(66) | **PK** | - |
| `proposal_id` | VARCHAR(66) | NOT NULL, FK→proposals | - |
| `target` | VARCHAR(42) | NOT NULL | - |
| `value` | NUMERIC(78,0) | NOT NULL | - |
| `data` | BYTEA | NOT NULL | - |
| `description` | TEXT | nullable | NULL |
| `execution_order` | SMALLINT | NOT NULL | 0 |

**Index**: `idx_proposal_actions_proposal_id` [007]

---

### 3.7 Council ドメイン ★NEW (009)

#### `council_members`
| カラム | 型 | 制約 | デフォルト | マイグレーション |
|--------|-----|------|-----------|:---------------:|
| `member_id` | VARCHAR(66) | **PK** | - | **009** |
| `wallet_address` | VARCHAR(42) | NOT NULL | - | **009** |
| `name` | VARCHAR(100) | nullable | NULL | **009** |
| `role` | VARCHAR(50) | NOT NULL | 'member' | **009** |
| `voting_power` | NUMERIC(78,0) | NOT NULL | 0 | **009** |
| `status` | VARCHAR(20) | NOT NULL | 'active' | **009** |
| `joined_at` | TIMESTAMPTZ | nullable | NOW() | **009** |
| `last_active` | TIMESTAMPTZ | nullable | NULL | **009** |

**Indexes**: `idx_council_members_status`, `idx_council_members_wallet`

**Repository**: `CouncilRepository` (`council.rs`)

> **Note**: `CouncilRepository` also references `council_actions` and `council_action_signatures` tables in code, but these tables have **no migration file** yet. They are runtime phantom tables that will cause errors if accessed before creation. See Section 8 for details.

---

### 3.8 Token Hub (veQS) ドメイン

#### `veqs_locks`
| カラム | 型 | 制約 | デフォルト |
|--------|-----|------|-----------|
| `lock_id` | VARCHAR(66) | **PK** | - |
| `wallet_address` | VARCHAR(42) | NOT NULL, FK→users | - |
| `locked_amount` | NUMERIC(78,0) | NOT NULL | - |
| `veqs_value` | NUMERIC(78,0) | NOT NULL | - |
| `lock_end` | TIMESTAMPTZ | NOT NULL | - |
| `lock_duration_days` | BIGINT | NOT NULL | - |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() |

**Index**: `idx_veqs_locks_wallet` [007]

#### `delegations`
| カラム | 型 | 制約 | デフォルト |
|--------|-----|------|-----------|
| `delegation_id` | VARCHAR(66) | **PK** | - |
| `delegator` | VARCHAR(42) | NOT NULL, FK→users | - |
| `delegatee` | VARCHAR(42) | NOT NULL, FK→users | - |
| `amount` | NUMERIC(78,0) | NOT NULL | - |
| `delegated_at` | TIMESTAMPTZ | NOT NULL | NOW() |

**Indexes**: `idx_delegations_delegator` [007], `idx_delegations_delegatee` [007]

#### `reward_epochs`
| カラム | 型 | 制約 | デフォルト |
|--------|-----|------|-----------|
| `epoch` | BIGINT | **PK** | - |
| `total_rewards` | NUMERIC(78,0) | NOT NULL | - |
| `total_veqs` | NUMERIC(78,0) | NOT NULL | - |
| `start_time` | TIMESTAMPTZ | NOT NULL | - |
| `end_time` | TIMESTAMPTZ | NOT NULL | - |
| `finalized` | BOOLEAN | NOT NULL | FALSE |

#### `reward_claims`
| カラム | 型 | 制約 | デフォルト |
|--------|-----|------|-----------|
| `claim_id` | VARCHAR(66) | **PK** | - |
| `wallet_address` | VARCHAR(42) | NOT NULL, FK→users | - |
| `epoch` | BIGINT | NOT NULL, FK→reward_epochs | - |
| `amount` | NUMERIC(78,0) | NOT NULL | - |
| `l1_tx_hash` | VARCHAR(66) | nullable | NULL |
| `claimed_at` | TIMESTAMPTZ | NOT NULL | NOW() |

**Indexes**: `idx_reward_claims_wallet_epoch` [007], `idx_reward_claims_epoch` [007]

---

### 3.9 Observer ドメイン

#### `observers`
| カラム | 型 | 制約 | デフォルト |
|--------|-----|------|-----------|
| `observer_id` | VARCHAR(66) | **PK** | - |
| `wallet_address` | VARCHAR(42) | UNIQUE, NOT NULL, FK→users | - |
| `status` | VARCHAR(20) | NOT NULL | 'active' |
| `total_earnings` | NUMERIC(78,0) | NOT NULL | 0 |
| `successful_challenges` | BIGINT | NOT NULL | 0 |
| `failed_challenges` | BIGINT | NOT NULL | 0 |
| `registered_at` | TIMESTAMPTZ | NOT NULL | NOW() |
| `practice_mode_until` | TIMESTAMPTZ | nullable | NULL |
| `practice_mode_earnings` | NUMERIC(78,0) | NOT NULL | 0 |

**Index**: `idx_observers_practice_mode (WHERE NOT NULL)`

#### `observer_earnings`
| カラム | 型 | 制約 | デフォルト |
|--------|-----|------|-----------|
| `earning_id` | VARCHAR(66) | **PK** | - |
| `observer_id` | VARCHAR(66) | NOT NULL, FK→observers | - |
| `challenge_id` | VARCHAR(66) | NOT NULL, FK→challenges | - |
| `amount` | NUMERIC(78,0) | NOT NULL | - |
| `claimed` | BOOLEAN | NOT NULL | FALSE |
| `claim_tx_hash` | VARCHAR(66) | nullable | NULL |
| `earned_at` | TIMESTAMPTZ | NOT NULL | NOW() |
| `claimed_at` | TIMESTAMPTZ | nullable | NULL |

**Indexes**: `idx_observer_earnings_observer_id` [007], `idx_observer_earnings_unclaimed (WHERE claimed=FALSE)` [007]

---

### 3.10 Admin ドメイン

#### `admin_roles`
| カラム | 型 | 制約 | デフォルト |
|--------|-----|------|-----------|
| `role_id` | VARCHAR(66) | **PK** | - |
| `name` | VARCHAR(50) | UNIQUE, NOT NULL | - |
| `level` | SMALLINT | NOT NULL | - |
| `permissions` | JSONB | NOT NULL | - |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() |

**Seed**: superadmin(1), admin(2), operator(3), viewer(4)

#### `admin_users`
| カラム | 型 | 制約 | デフォルト |
|--------|-----|------|-----------|
| `admin_id` | VARCHAR(66) | **PK** | - |
| `wallet_address` | VARCHAR(42) | UNIQUE, NOT NULL | - |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | - |
| `name` | VARCHAR(100) | NOT NULL | - |
| `role_id` | VARCHAR(66) | NOT NULL, FK→admin_roles | - |
| `status` | VARCHAR(20) | NOT NULL | 'active' |
| `two_factor_enabled` | BOOLEAN | NOT NULL | FALSE |
| `two_factor_secret` | VARCHAR(255) | nullable | NULL |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() |
| `last_login` | TIMESTAMPTZ | nullable | NULL |

**Indexes**: `idx_admin_users_email` [007], `idx_admin_users_role_id` [007], `idx_admin_users_status` [007]

#### `admin_audit_logs`
| カラム | 型 | 制約 | デフォルト |
|--------|-----|------|-----------|
| `log_id` | VARCHAR(66) | **PK** | - |
| `admin_id` | VARCHAR(66) | NOT NULL, FK→admin_users | - |
| `action` | VARCHAR(100) | NOT NULL | - |
| `resource_type` | VARCHAR(50) | NOT NULL | - |
| `resource_id` | VARCHAR(66) | nullable | NULL |
| `details` | JSONB | nullable | NULL |
| `ip_address` | VARCHAR(45) | nullable | NULL |
| `user_agent` | VARCHAR(500) | nullable | NULL |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() |

**Indexes**: `idx_admin_audit_admin`, `idx_admin_audit_resource`, `idx_admin_audit_created (DESC)`

#### `admin_sessions`
| カラム | 型 | 制約 | デフォルト | マイグレーション |
|--------|-----|------|-----------|:---------------:|
| `session_id` | VARCHAR(66) | **PK** | - | 001 |
| `admin_id` | VARCHAR(66) | NOT NULL, FK→admin_users | - | 001 |
| `ip_address` | VARCHAR(45) | NOT NULL | - | 001 |
| `user_agent` | VARCHAR(500) | nullable | NULL | 001 |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() | 001 |
| `expires_at` | TIMESTAMPTZ | NOT NULL | - | 001 |
| `revoked_at` | TIMESTAMPTZ | nullable | NULL | 001 |
| `refresh_token_hash` | VARCHAR(64) | nullable | NULL | **010** |

**Indexes**: `idx_admin_sessions_admin`, `idx_admin_sessions_refresh_hash (WHERE refresh_token_hash IS NOT NULL AND revoked_at IS NULL)` [010]

---

### 3.11 Treasury ドメイン

#### `treasury_wallets`
| カラム | 型 | 制約 | デフォルト |
|--------|-----|------|-----------|
| `wallet_id` | VARCHAR(66) | **PK** | - |
| `name` | VARCHAR(100) | NOT NULL | - |
| `type` | VARCHAR(20) | NOT NULL | - |
| `address` | VARCHAR(42) | NOT NULL | - |
| `multisig_threshold` | INTEGER | NOT NULL | - |
| `multisig_signers` | JSONB | NOT NULL | - |
| `balance` | NUMERIC(78,0) | NOT NULL | - |
| `currency` | VARCHAR(10) | NOT NULL | 'ETH' |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() |
| `updated_at` | TIMESTAMPTZ | NOT NULL | NOW() |

**Index**: `idx_treasury_wallets_address` [007]

#### `treasury_transactions`
| カラム | 型 | 制約 | デフォルト |
|--------|-----|------|-----------|
| `tx_id` | VARCHAR(66) | **PK** | - |
| `wallet_id` | VARCHAR(66) | NOT NULL, FK→treasury_wallets | - |
| `type` | VARCHAR(20) | NOT NULL | - |
| `amount` | NUMERIC(78,0) | NOT NULL | - |
| `currency` | VARCHAR(10) | NOT NULL | - |
| `from_address` | VARCHAR(42) | nullable | NULL |
| `to_address` | VARCHAR(42) | nullable | NULL |
| `purpose` | VARCHAR(500) | nullable | NULL |
| `status` | VARCHAR(20) | NOT NULL | 'pending' |
| `approved_by` | JSONB | nullable | NULL |
| `tx_hash` | VARCHAR(66) | nullable | NULL |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() |
| `executed_at` | TIMESTAMPTZ | nullable | NULL |

**Indexes**: `idx_treasury_tx_wallet`, `idx_treasury_tx_status`, `idx_treasury_tx_created (DESC)`, `idx_treasury_tx_from_to` [007]

#### `treasury_approvals`
| カラム | 型 | 制約 | デフォルト |
|--------|-----|------|-----------|
| `approval_id` | VARCHAR(66) | **PK** | - |
| `transfer_id` | VARCHAR(66) | NOT NULL, FK→treasury_transactions | - |
| `approver_id` | VARCHAR(66) | NOT NULL, FK→admin_users | - |
| `approver_wallet` | VARCHAR(42) | NOT NULL | - |
| `approved_at` | TIMESTAMPTZ | NOT NULL | NOW() |
| `signature` | BYTEA | NOT NULL | - |
| `status` | VARCHAR(20) | NOT NULL | 'approved' |
| `rejection_reason` | TEXT | nullable | NULL |

**Unique**: `(transfer_id, approver_id)`
**Indexes**: `idx_treasury_approvals_transfer`, `idx_treasury_approvals_approver`

#### `protocol_revenue`
| カラム | 型 | 制約 | デフォルト |
|--------|-----|------|-----------|
| `revenue_id` | VARCHAR(66) | **PK** | - |
| `date` | DATE | NOT NULL | - |
| `source` | VARCHAR(50) | NOT NULL | - |
| `amount` | NUMERIC(78,0) | NOT NULL | - |
| `currency` | VARCHAR(10) | NOT NULL | - |
| `tx_hash` | VARCHAR(66) | nullable | NULL |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() |

**Indexes**: `idx_protocol_revenue_date`, `idx_protocol_revenue_source`

#### `budget_allocations` ★NEW (009)
| カラム | 型 | 制約 | デフォルト | マイグレーション |
|--------|-----|------|-----------|:---------------:|
| `allocation_id` | VARCHAR(66) | **PK** | - | **009** |
| `category` | VARCHAR(100) | NOT NULL | - | **009** |
| `allocated_amount` | NUMERIC(78,0) | NOT NULL | 0 | **009** |
| `spent_amount` | NUMERIC(78,0) | NOT NULL | 0 | **009** |
| `currency` | VARCHAR(10) | NOT NULL | 'ETH' | **009** |
| `period_start` | TIMESTAMPTZ | NOT NULL | - | **009** |
| `period_end` | TIMESTAMPTZ | NOT NULL | - | **009** |
| `created_at` | TIMESTAMPTZ | nullable | NOW() | **009** |

**Indexes**: `idx_budget_allocations_period (period_end)`, `idx_budget_allocations_category`

**Repository**: `TreasuryRepository` (`treasury.rs`)

#### `treasury_audit_log` ★NEW (009)
| カラム | 型 | 制約 | デフォルト | マイグレーション |
|--------|-----|------|-----------|:---------------:|
| `audit_id` | VARCHAR(66) | **PK** | - | **009** |
| `tx_id` | VARCHAR(66) | nullable, FK→treasury_transactions | NULL | **009** |
| `action` | VARCHAR(100) | NOT NULL | - | **009** |
| `actor` | VARCHAR(42) | NOT NULL | - | **009** |
| `details` | JSONB | nullable | NULL | **009** |
| `created_at` | TIMESTAMPTZ | nullable | NOW() | **009** |

**Indexes**: `idx_treasury_audit_log_created (DESC)`, `idx_treasury_audit_log_actor`, `idx_treasury_audit_log_action`

**Repository**: `TreasuryRepository` (`treasury.rs`)

---

### 3.12 Support ドメイン

#### `support_tickets`
| カラム | 型 | 制約 | デフォルト |
|--------|-----|------|-----------|
| `ticket_id` | VARCHAR(66) | **PK** | - |
| `user_wallet` | VARCHAR(42) | NOT NULL | - |
| `subject` | VARCHAR(255) | NOT NULL | - |
| `description` | TEXT | NOT NULL | - |
| `category` | VARCHAR(50) | NOT NULL | 'general' |
| `priority` | VARCHAR(20) | NOT NULL | 'medium' |
| `status` | VARCHAR(20) | NOT NULL | 'open' |
| `assigned_to` | VARCHAR(66) | nullable, FK→admin_users | NULL |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() |
| `updated_at` | TIMESTAMPTZ | NOT NULL | NOW() |
| `resolved_at` | TIMESTAMPTZ | nullable | NULL |

**Indexes**: `idx_tickets_wallet`, `idx_tickets_status`, `idx_tickets_priority`, `idx_tickets_assigned`, `idx_tickets_created (DESC)`

#### `faqs`
| カラム | 型 | 制約 | デフォルト |
|--------|-----|------|-----------|
| `faq_id` | VARCHAR(66) | **PK** | - |
| `question` | TEXT | NOT NULL | - |
| `answer` | TEXT | NOT NULL | - |
| `category` | VARCHAR(50) | NOT NULL | 'general' |
| `sort_order` | INTEGER | NOT NULL | 0 |
| `is_published` | BOOLEAN | NOT NULL | FALSE |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() |
| `updated_at` | TIMESTAMPTZ | NOT NULL | NOW() |

**Seed**: faq-001〜005（general, lock, unlock, prover, token）
**Indexes**: `idx_faqs_category`, `idx_faqs_published`, `idx_faqs_sort (category, sort_order)`

#### `announcements`
| カラム | 型 | 制約 | デフォルト |
|--------|-----|------|-----------|
| `announcement_id` | VARCHAR(66) | **PK** | - |
| `title` | VARCHAR(255) | NOT NULL | - |
| `content` | TEXT | NOT NULL | - |
| `category` | VARCHAR(50) | NOT NULL | 'info' |
| `priority` | VARCHAR(20) | NOT NULL | 'normal' |
| `is_published` | BOOLEAN | NOT NULL | FALSE |
| `published_at` | TIMESTAMPTZ | nullable | NULL |
| `expires_at` | TIMESTAMPTZ | nullable | NULL |
| `created_by` | VARCHAR(66) | NOT NULL, FK→admin_users | - |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() |
| `updated_at` | TIMESTAMPTZ | NOT NULL | NOW() |

**Indexes**: `idx_announcements_published`, `idx_announcements_category`, `idx_announcements_expires`, `idx_announcements_created (DESC)`

---

### 3.13 Metrics/Alert ドメイン

#### `daily_metrics`
| カラム | 型 | 制約 | デフォルト |
|--------|-----|------|-----------|
| `date` | DATE | **PK** | - |
| `tvl` | NUMERIC(78,0) | NOT NULL | - |
| `active_users` | BIGINT | NOT NULL | - |
| `new_users` | BIGINT | NOT NULL | - |
| `transactions_count` | BIGINT | NOT NULL | - |
| `lock_volume` | NUMERIC(78,0) | NOT NULL | - |
| `unlock_volume` | NUMERIC(78,0) | NOT NULL | - |
| `fee_revenue` | NUMERIC(78,0) | NOT NULL | - |
| `prover_uptime` | DOUBLE PRECISION | NOT NULL | - |
| `avg_unlock_time` | DOUBLE PRECISION | NOT NULL | - |
| `computed_at` | TIMESTAMPTZ | NOT NULL | NOW() |

#### `alert_rules`
| カラム | 型 | 制約 | デフォルト |
|--------|-----|------|-----------|
| `rule_id` | VARCHAR(66) | **PK** | - |
| `name` | VARCHAR(100) | NOT NULL | - |
| `metric_type` | VARCHAR(50) | NOT NULL | - |
| `condition` | VARCHAR(10) | NOT NULL | - |
| `threshold` | NUMERIC(78,0) | NOT NULL | - |
| `severity` | VARCHAR(20) | NOT NULL | - |
| `notification_channel` | VARCHAR(100) | NOT NULL | - |
| `enabled` | BOOLEAN | NOT NULL | TRUE |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() |

#### `alerts`
| カラム | 型 | 制約 | デフォルト |
|--------|-----|------|-----------|
| `alert_id` | VARCHAR(66) | **PK** | - |
| `rule_id` | VARCHAR(66) | NOT NULL, FK→alert_rules | - |
| `severity` | VARCHAR(20) | NOT NULL | - |
| `message` | VARCHAR(500) | NOT NULL | - |
| `details` | JSONB | nullable | NULL |
| `status` | VARCHAR(20) | NOT NULL | 'active' |
| `acknowledged_by` | VARCHAR(66) | nullable, FK→admin_users | NULL |
| `triggered_at` | TIMESTAMPTZ | NOT NULL | NOW() |
| `acknowledged_at` | TIMESTAMPTZ | nullable | NULL |
| `resolved_at` | TIMESTAMPTZ | nullable | NULL |

**Indexes**: `idx_alerts_rule`, `idx_alerts_status`, `idx_alerts_triggered (DESC)`, `idx_alerts_unacknowledged (WHERE acknowledged_by IS NULL)` [007]

---

### 3.14 Audit/System ドメイン

#### `audit_logs`
| カラム | 型 | 制約 | デフォルト |
|--------|-----|------|-----------|
| `log_id` | VARCHAR(66) | **PK** | - |
| `entity_type` | VARCHAR(50) | NOT NULL | - |
| `entity_id` | VARCHAR(66) | NOT NULL | - |
| `action` | VARCHAR(50) | NOT NULL | - |
| `actor` | VARCHAR(42) | NOT NULL | - |
| `old_values` | JSONB | nullable | NULL |
| `new_values` | JSONB | nullable | NULL |
| `ip_address` | VARCHAR(45) | nullable | NULL |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() |

**Indexes**: `idx_audit_entity (entity_type, entity_id)`, `idx_audit_actor`, `idx_audit_created (DESC)`

#### `system_settings`
| カラム | 型 | 制約 | デフォルト |
|--------|-----|------|-----------|
| `key` | VARCHAR(100) | **PK** | - |
| `value` | JSONB | NOT NULL | - |
| `updated_by` | VARCHAR(42) | nullable | NULL |
| `updated_at` | TIMESTAMPTZ | NOT NULL | NOW() |

---

### 3.15 Enterprise ドメイン (Legacy)

#### `enterprise_contracts`
| カラム | 型 | 制約 | デフォルト |
|--------|-----|------|-----------|
| `contract_id` | VARCHAR(66) | **PK** | - |
| `prover_id` | VARCHAR(66) | NOT NULL, FK→provers | - |
| `company_name` | VARCHAR(255) | NOT NULL | - |
| `sla_guarantee` | NUMERIC(5,2) | NOT NULL | 99.90 |
| `minimum_revenue` | NUMERIC(78,0) | NOT NULL | - |
| `start_date` | DATE | NOT NULL | - |
| `end_date` | DATE | NOT NULL | - |
| `status` | VARCHAR(20) | NOT NULL | 'active' |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() |
| `updated_at` | TIMESTAMPTZ | NOT NULL | NOW() |

**Indexes**: `idx_enterprise_contracts_prover`, `idx_enterprise_contracts_status`

---

### 3.16 Enterprise ドメイン (Full) ★NEW (011)

#### `enterprise_organizations`
| カラム | 型 | 制約 | デフォルト | マイグレーション |
|--------|-----|------|-----------|:---------------:|
| `org_id` | VARCHAR(66) | **PK** | - | **011** |
| `name` | VARCHAR(200) | NOT NULL | - | **011** |
| `display_name` | VARCHAR(200) | nullable | NULL | **011** |
| `plan` | VARCHAR(30) | NOT NULL | 'enterprise' | **011** |
| `logo_url` | TEXT | nullable | NULL | **011** |
| `website` | TEXT | nullable | NULL | **011** |
| `support_email` | VARCHAR(200) | nullable | NULL | **011** |
| `timezone` | VARCHAR(50) | nullable | 'Asia/Tokyo' | **011** |
| `currency` | VARCHAR(10) | nullable | 'USD' | **011** |
| `created_at` | TIMESTAMPTZ | nullable | NOW() | **011** |
| `updated_at` | TIMESTAMPTZ | nullable | NOW() | **011** |

**Repository**: `EnterpriseRepository` (`enterprise.rs`)

#### `enterprise_users`
| カラム | 型 | 制約 | デフォルト | マイグレーション |
|--------|-----|------|-----------|:---------------:|
| `user_id` | VARCHAR(66) | **PK** | - | **011** |
| `org_id` | VARCHAR(66) | NOT NULL, FK→enterprise_organizations | - | **011** |
| `email` | VARCHAR(200) | NOT NULL | - | **011** |
| `name` | VARCHAR(200) | NOT NULL | - | **011** |
| `role` | VARCHAR(20) | NOT NULL | 'viewer' | **011** |
| `status` | VARCHAR(20) | NOT NULL | 'pending' | **011** |
| `wallet_address` | VARCHAR(42) | nullable | NULL | **011** |
| `two_factor_enabled` | BOOLEAN | nullable | FALSE | **011** |
| `last_active` | TIMESTAMPTZ | nullable | NULL | **011** |
| `invited_by` | VARCHAR(66) | nullable | NULL | **011** |
| `created_at` | TIMESTAMPTZ | nullable | NOW() | **011** |

**Indexes**: `idx_ent_users_org`, `idx_ent_users_email`

#### `enterprise_api_keys`
| カラム | 型 | 制約 | デフォルト | マイグレーション |
|--------|-----|------|-----------|:---------------:|
| `key_id` | VARCHAR(66) | **PK** | - | **011** |
| `org_id` | VARCHAR(66) | NOT NULL, FK→enterprise_organizations | - | **011** |
| `name` | VARCHAR(200) | NOT NULL | - | **011** |
| `key_hash` | VARCHAR(64) | NOT NULL | - | **011** |
| `key_preview` | VARCHAR(20) | NOT NULL | - | **011** |
| `permissions` | JSONB | NOT NULL | '[]' | **011** |
| `status` | VARCHAR(20) | NOT NULL | 'active' | **011** |
| `ip_whitelist` | JSONB | nullable | NULL | **011** |
| `last_used` | TIMESTAMPTZ | nullable | NULL | **011** |
| `created_by` | VARCHAR(66) | NOT NULL | - | **011** |
| `created_at` | TIMESTAMPTZ | nullable | NOW() | **011** |
| `expires_at` | TIMESTAMPTZ | nullable | NULL | **011** |

**Index**: `idx_ent_keys_org`

#### `enterprise_applications`
| カラム | 型 | 制約 | デフォルト | マイグレーション |
|--------|-----|------|-----------|:---------------:|
| `application_id` | VARCHAR(66) | **PK** | - | **011** |
| `company_name` | VARCHAR(200) | NOT NULL | - | **011** |
| `registration_number` | VARCHAR(100) | nullable | NULL | **011** |
| `country` | VARCHAR(100) | NOT NULL | - | **011** |
| `industry` | VARCHAR(100) | NOT NULL | - | **011** |
| `website` | TEXT | nullable | NULL | **011** |
| `contact_name` | VARCHAR(200) | NOT NULL | - | **011** |
| `contact_email` | VARCHAR(200) | NOT NULL | - | **011** |
| `contact_phone` | VARCHAR(50) | nullable | NULL | **011** |
| `job_title` | VARCHAR(200) | NOT NULL | - | **011** |
| `expected_volume` | VARCHAR(100) | nullable | NULL | **011** |
| `use_case` | TEXT | NOT NULL | - | **011** |
| `notes` | TEXT | nullable | NULL | **011** |
| `status` | VARCHAR(30) | NOT NULL | 'pending' | **011** |
| `review_notes` | TEXT | nullable | NULL | **011** |
| `assigned_reviewer` | VARCHAR(200) | nullable | NULL | **011** |
| `submitted_at` | TIMESTAMPTZ | nullable | NOW() | **011** |
| `updated_at` | TIMESTAMPTZ | nullable | NOW() | **011** |

**Index**: `idx_ent_app_status`

#### `enterprise_audit_log`
| カラム | 型 | 制約 | デフォルト | マイグレーション |
|--------|-----|------|-----------|:---------------:|
| `audit_id` | VARCHAR(66) | **PK** | - | **011** |
| `org_id` | VARCHAR(66) | nullable, FK→enterprise_organizations | NULL | **011** |
| `user_id` | VARCHAR(66) | nullable | NULL | **011** |
| `user_name` | VARCHAR(200) | nullable | NULL | **011** |
| `action` | VARCHAR(50) | NOT NULL | - | **011** |
| `details` | JSONB | nullable | NULL | **011** |
| `ip_address` | VARCHAR(45) | nullable | NULL | **011** |
| `user_agent` | TEXT | nullable | NULL | **011** |
| `created_at` | TIMESTAMPTZ | nullable | NOW() | **011** |

**Indexes**: `idx_ent_audit_org`, `idx_ent_audit_created (DESC)`

#### `enterprise_settings`
| カラム | 型 | 制約 | デフォルト | マイグレーション |
|--------|-----|------|-----------|:---------------:|
| `org_id` | VARCHAR(66) | **PK**, FK→enterprise_organizations | - | **011** |
| `notification_email_alerts` | BOOLEAN | nullable | TRUE | **011** |
| `notification_slack` | BOOLEAN | nullable | FALSE | **011** |
| `notification_webhook_url` | TEXT | nullable | NULL | **011** |
| `alert_large_tx` | VARCHAR(100) | nullable | '100' | **011** |
| `alert_daily_volume` | VARCHAR(100) | nullable | '10000' | **011** |
| `max_transaction_size` | VARCHAR(100) | nullable | '1000' | **011** |
| `daily_transaction_limit` | VARCHAR(100) | nullable | '50000' | **011** |
| `api_rate_limit` | INTEGER | nullable | 1000 | **011** |
| `two_factor_required` | BOOLEAN | nullable | TRUE | **011** |
| `session_timeout` | INTEGER | nullable | 60 | **011** |
| `ip_whitelist_enabled` | BOOLEAN | nullable | FALSE | **011** |
| `ip_whitelist` | JSONB | nullable | '[]' | **011** |
| `password_min_length` | INTEGER | nullable | 12 | **011** |
| `password_require_uppercase` | BOOLEAN | nullable | TRUE | **011** |
| `password_require_numbers` | BOOLEAN | nullable | TRUE | **011** |
| `password_require_special` | BOOLEAN | nullable | TRUE | **011** |
| `password_max_age` | INTEGER | nullable | 90 | **011** |
| `audit_log_retention` | INTEGER | nullable | 365 | **011** |
| `signing_key_rotation` | INTEGER | nullable | 90 | **011** |
| `updated_at` | TIMESTAMPTZ | nullable | NOW() | **011** |

---

### 3.17 Insurance ドメイン

#### `insurance_fund`
| カラム | 型 | 制約 | デフォルト |
|--------|-----|------|-----------|
| `fund_id` | VARCHAR(66) | **PK** | 'main' |
| `total_balance` | NUMERIC(78,0) | NOT NULL | 0 |
| `total_received` | NUMERIC(78,0) | NOT NULL | 0 |
| `total_claims_paid` | NUMERIC(78,0) | NOT NULL | 0 |
| `approved_claims_count` | INTEGER | NOT NULL | 0 |
| `rejected_claims_count` | INTEGER | NOT NULL | 0 |
| `updated_at` | TIMESTAMPTZ | NOT NULL | NOW() |

**Seed**: fund_id='main' (全カラム0)

**Repository**: `InsuranceRepository` (`insurance.rs`) ★NEW

#### `insurance_claims`
| カラム | 型 | 制約 | デフォルト |
|--------|-----|------|-----------|
| `claim_id` | VARCHAR(66) | **PK** | - |
| `claimant` | VARCHAR(42) | NOT NULL, FK→users | - |
| `claim_type` | VARCHAR(30) | NOT NULL, CHECK(5値) | - |
| `amount` | NUMERIC(78,0) | NOT NULL | - |
| `amount_usd` | NUMERIC(20,2) | nullable | NULL |
| `status` | VARCHAR(20) | NOT NULL, CHECK(6値) | 'pending' |
| `description` | TEXT | NOT NULL | - |
| `detailed_description` | TEXT | nullable | NULL |
| `incident_tx_hash` | VARCHAR(66) | nullable | NULL |
| `lock_id` | VARCHAR(66) | nullable, FK→locks | NULL |
| `evidence` | JSONB | nullable | NULL |
| `signature` | BYTEA | NOT NULL | - |
| `submitted_at` | TIMESTAMPTZ | NOT NULL | NOW() |
| `processed_at` | TIMESTAMPTZ | nullable | NULL |
| `processed_by` | VARCHAR(42) | nullable | NULL |

**Indexes**: `idx_insurance_claims_claimant`, `idx_insurance_claims_status`, `idx_insurance_claims_type`, `idx_insurance_claims_submitted (DESC)`, `idx_insurance_claims_lock_id (WHERE NOT NULL)` [007], `idx_insurance_claims_processed_at (DESC, WHERE NOT NULL)` [007]

#### `insurance_transactions`
| カラム | 型 | 制約 | デフォルト |
|--------|-----|------|-----------|
| `tx_hash` | VARCHAR(66) | **PK** | - |
| `tx_type` | VARCHAR(30) | NOT NULL, CHECK(4値) | - |
| `amount` | NUMERIC(78,0) | NOT NULL | - |
| `amount_usd` | NUMERIC(20,2) | nullable | NULL |
| `description` | TEXT | nullable | NULL |
| `claim_id` | VARCHAR(66) | nullable, FK→insurance_claims | NULL |
| `source` | VARCHAR(100) | nullable | NULL |
| `created_at` | TIMESTAMPTZ | NOT NULL | NOW() |

**Indexes**: `idx_insurance_tx_type`, `idx_insurance_tx_created (DESC)`, `idx_insurance_tx_claim`

---

### 3.18 Infra ドメイン

#### `l1_sync_state`
| カラム | 型 | 制約 | デフォルト |
|--------|-----|------|-----------|
| `id` | INTEGER | **PK**, CHECK(id=1) | 1 |
| `block_number` | BIGINT | NOT NULL | 0 |
| `synced_at` | TIMESTAMPTZ | NOT NULL | NOW() |

**Seed**: id=1, block_number=0
**Index**: `idx_l1_sync_block`

---

## 4. Repository <-> テーブル対応表

### 4.1 全16リポジトリとテーブルマッピング

| # | Repository | ファイル | テーブル | 状態 |
|---|-----------|---------|---------|:----:|
| 1 | `AdminRepository` | `admin.rs` | admin_users, admin_roles, admin_audit_logs, admin_sessions | ✅ |
| 2 | `ProverRepository` | `prover.rs` | provers, prover_exits, prover_metrics | ✅ |
| 3 | `ObserverRepository` | `observer.rs` | observers, observer_earnings | ✅ |
| 4 | `UserRepository` | `user.rs` | users, user_settings, user_dilithium_keys | ✅ |
| 5 | `LockRepository` | `lock.rs` | locks, unlock_requests, unlock_prover_signatures, unlock_risk_scores | ✅ |
| 6 | `ChallengeRepository` | `challenge.rs` | challenges, slashings | ✅ |
| 7 | `GovernanceRepository` | `governance.rs` | proposals, votes, proposal_actions | ✅ |
| 8 | `TreasuryRepository` | `treasury.rs` | treasury_wallets, treasury_transactions, treasury_approvals, protocol_revenue, budget_allocations, treasury_audit_log | ✅ |
| 9 | `SupportRepository` | `support.rs` | support_tickets, faqs, announcements | ✅ |
| 10 | `SigningQueueRepository` | `signing_queue.rs` | signing_queue | ✅ NEW |
| 11 | `VrfRepository` | `vrf.rs` | vrf_requests | ✅ NEW |
| 12 | `TokenHubRepository` | `token_hub.rs` | veqs_locks, delegations, reward_epochs, reward_claims | ✅ NEW |
| 13 | `InsuranceRepository` | `insurance.rs` | insurance_fund, insurance_claims, insurance_transactions | ✅ NEW |
| 14 | `CouncilRepository` | `council.rs` | council_members, (council_actions)*, (council_action_signatures)* | ⚠️ |
| 15 | `EnterpriseRepository` | `enterprise.rs` | enterprise_organizations, enterprise_users, enterprise_api_keys, enterprise_applications, enterprise_audit_log, enterprise_settings | ✅ NEW |
| 16 | - | - | enterprise_contracts | ⚠️ No repository |

> **\*** `council_actions` and `council_action_signatures` are referenced in `CouncilRepository` code but have no migration creating them. These are phantom table references that will cause runtime errors.

### 4.2 Previously Orphaned Tables (Now Connected)

These tables existed in migrations but previously had no repository or route connections. They are now properly connected:

| テーブル | 旧状態 | 現在の Repository | 備考 |
|---------|:------:|:----------------:|------|
| `treasury_wallets` | Routes had no PG code | `TreasuryRepository` | Routes now use repository |
| `treasury_transactions` | Routes had no PG code | `TreasuryRepository` | Routes now use repository |
| `protocol_revenue` | Routes had no PG code | `TreasuryRepository` | Routes now use repository |
| `insurance_fund` | No repository | `InsuranceRepository` | ★ New repository |
| `insurance_claims` | No repository | `InsuranceRepository` | ★ New repository |
| `insurance_transactions` | No repository | `InsuranceRepository` | ★ New repository |
| `council_members` | No table existed | `CouncilRepository` | ★ New table + repository |
| `budget_allocations` | No table existed | `TreasuryRepository` | ★ New table, connected to existing repo |
| `treasury_audit_log` | No table existed | `TreasuryRepository` | ★ New table, connected to existing repo |

### 4.3 Tables Without Repository (Static/Seed-Only)

| テーブル | 理由 |
|---------|------|
| `daily_metrics` | Computed by background job, read via admin routes directly |
| `alert_rules` | Read via admin routes directly |
| `alerts` | Read via admin routes directly |
| `audit_logs` | Generic audit log, read via admin routes directly |
| `system_settings` | Read via admin routes directly |
| `enterprise_contracts` | Legacy table, no dedicated repository |
| `l1_sync_state` | Infrastructure table, managed by L1 indexer service |

---

## 5. 設計書との差分分析

### 5.1 DATABASE_DESIGN.md（設計書）vs 実態の比較

| 項目 | 設計書 | 実態 | 差分 |
|------|:------:|:----:|:----:|
| **テーブル数** | ~35 | 53 | 実態が18テーブル多い |
| **ORM** | Prisma | sqlx (raw SQL) | 設計と乖離 |
| **Insurance** | 未記載 | 3テーブル | ✅ 追加済み |
| **Enterprise (Legacy)** | enterprise_contracts | enterprise_contracts | ✅ 一致 |
| **Enterprise (Full)** | 未記載 | 6テーブル (011) | ✅ 新規追加 |
| **Council** | 未記載 | council_members (009) | ✅ 新規追加 |
| **Treasury Extended** | budget_allocations 記載あり | budget_allocations (009) | ✅ 追加済み |
| **Treasury Audit** | 未記載 | treasury_audit_log (009) | ✅ 新規追加 |
| **Signing Queue** | MIGRATION_PLAN記載 | signing_queue (008) | ✅ 追加済み |
| **Risk Scores** | unlock_risk_scores | unlock_risk_scores | ✅ 一致 |
| **Prover Fields** | 基本のみ | +9カラム(005) | ✅ 拡張済み |
| **User Status** | 未記載 | status カラム(004) | ✅ 追加済み |
| **L1 Sync** | 未記載 | l1_sync_state(003) | ✅ 追加済み |
| **Admin Auth** | 基本のみ | +refresh_token_hash(010) | ✅ 拡張済み |
| **Proposals** | 基本のみ | +executed_by/tx_hash/at(009) | ✅ 拡張済み |

### 5.2 設計書にあるが実態にないテーブル

| テーブル名 | 設計書セクション | ステータス | 備考 |
|-----------|:----------------:|:---------:|------|
| `council_actions` | §5 Council | ❌ **未作成** | CouncilRepositoryが参照しているが migration なし |
| `council_action_signatures` | §5 Council | ❌ **未作成** | CouncilRepositoryが参照しているが migration なし |
| `expense_requests` | §6 Treasury | ❌ **未作成** | 経費申請 |
| `ticket_messages` | §6 Support | ❌ **未作成** | チケット返信 |
| `hourly_metrics` | §6 Metrics | ❌ **未作成** | 時間単位メトリクス |

### 5.3 実態にあるが設計書にないテーブル

| テーブル名 | マイグレーション | 備考 |
|-----------|:----------------:|------|
| `insurance_fund` | 006 | 設計書v1.1では未記載 |
| `insurance_claims` | 006 | 設計書v1.1では未記載 |
| `insurance_transactions` | 006 | 設計書v1.1では未記載 |
| `l1_sync_state` | 003 | 設計書v1.1では未記載 |
| `signing_queue` | 008 | MIGRATION_PLANに記載、設計書には未反映 |
| `budget_allocations` | 009 | 設計書§6に記載あり→ ★実装済み |
| `treasury_audit_log` | 009 | 設計書v1.1では未記載 |
| `enterprise_organizations` | 011 | 設計書v1.1では未記載 |
| `enterprise_users` | 011 | 設計書v1.1では未記載 |
| `enterprise_api_keys` | 011 | 設計書v1.1では未記載 |
| `enterprise_applications` | 011 | 設計書v1.1では未記載 |
| `enterprise_audit_log` | 011 | 設計書v1.1では未記載 |
| `enterprise_settings` | 011 | 設計書v1.1では未記載 |

### 5.4 カラムレベルの差分

| テーブル | 設計書のカラム | 実態 | 差分 |
|---------|-------------|------|------|
| `proposals` | `proposal_type` | あり (012) | ✅ 追加済み |
| `proposals` | `category` | なし | ❌ 設計にあり実態になし |
| `proposals` | `execution_hash` | なし | ❌ 設計にあり実態になし（`executed_tx_hash`は別用途） |
| `proposals` | `executed_by` | あり (009) | ✅ 追加済み |
| `proposals` | `executed_at` | あり (009) | ✅ 追加済み |
| `veqs_locks` | `status` | なし | ⚠️ ステータス管理が未実装 |
| `veqs_locks` | `ratio` | なし | ⚠️ 比率はアプリ側で計算 (ratio = remaining_time / MAX_LOCK_TIME, 線形減衰) |
| `delegations` | `status` | なし | ⚠️ active/revoked管理が未実装 |
| `delegations` | `revoked_at` | なし | ⚠️ 委任取消のタイムスタンプなし |
| `admin_sessions` | `refresh_token_hash` | あり (010) | ✅ 追加済み |

---

## 6. Migration Plan との整合性

### Phase 別の実態チェック

| Phase | 必要なマイグレーション | 実態 | 状態 |
|:-----:|---------------------|------|:----:|
| **Phase 0** | `signing_queue` テーブル作成 | ✅ 008で作成済み | **完了** |
| **Phase 0** | Repository パターン基盤 | ✅ 16 repositories | **完了** |
| **Phase 1** | locks/unlock_requests スキーマ | ✅ 存在 + LockRepository | **完了** |
| **Phase 2** | challenges/vrf_requests スキーマ | ✅ 存在 + ChallengeRepository + VrfRepository | **完了** |
| **Phase 3** | observers/user_settings スキーマ | ✅ 存在 + ObserverRepository + UserRepository | **完了** |
| **Phase 4** | veqs_locks/delegations スキーマ | ✅ 存在 (⚠️要カラム拡張) + TokenHubRepository | **コード完了、DB要拡張** |
| **Phase 5** | 検証・クリーンアップ | - | **テスト** |
| **Phantom Fix** | council_members, budget_allocations, treasury_audit_log | ✅ 009で作成済み | **完了** |
| **Admin Auth** | admin_sessions.refresh_token_hash | ✅ 010で追加済み | **完了** |
| **Enterprise** | 6テーブル + EnterpriseRepository | ✅ 011で作成済み | **完了** |

---

## 7. Redis <-> PostgreSQL 対応表（Dual-Write状況）

### 7.1 Dual-Write 完了済み（PG + Redis キャッシュ）

| Redis Key Pattern | PostgreSQL テーブル | Repository | Phase | 状態 |
|---|---|---|:---:|:---:|
| `lock:{lock_id}` | `locks` | LockRepository | 1 | ✅ Dual-Write |
| `user:{wallet}:locks` | `locks` (wallet_address index) | LockRepository | 1 | ✅ Dual-Write |
| `unlock:{unlock_id}` | `unlock_requests` | LockRepository | 1 | ✅ Dual-Write |
| `unlock:{unlock_id}:emergency` | `unlock_requests` (is_emergency) | LockRepository | 1 | ✅ Dual-Write |
| `challenge:{challenge_id}` | `challenges` | ChallengeRepository | 2 | ✅ Dual-Write |
| `observer:{observer_id}` | `observers` | ObserverRepository | 3 | ✅ Dual-Write |
| `vrf:{vrf_id}` | `vrf_requests` | VrfRepository | 2 | ✅ Dual-Write |
| `prover_sig:{sig_id}` | `unlock_prover_signatures` | LockRepository | 2 | ✅ Dual-Write |
| `user_settings:{wallet}` | `user_settings` | UserRepository | 3 | ✅ Dual-Write |
| `veqs:{lock_id}` | `veqs_locks` | TokenHubRepository | 4 | ✅ Dual-Write |
| `delegation:{id}` | `delegations` | TokenHubRepository | 4 | ✅ Dual-Write |
| `signing_queue:{prover_id}:*` | `signing_queue` | SigningQueueRepository | 0 | ✅ Dual-Write |
| `prover:{prover_id}:status` | `provers` (status column) | ProverRepository | 1 | ✅ Dual-Write |
| `prover:{prover_id}:metrics` | `prover_metrics` | ProverRepository | 1 | ✅ Dual-Write |
| `prover:{prover_id}:exit` | `prover_exits` | ProverRepository | 1 | ✅ Dual-Write |

### 7.2 Redis-Only（Intentional, No PG Table Needed）

| Redis Key Pattern | 用途 | 理由 |
|---|---|---|
| `prover_alerts:{prover_id}` | Prover一時アラート | 短寿命データ、永続化不要。TTL付きRedisキーで十分。 |

### 7.3 PG-Only（No Redis Cache）

| テーブル | 理由 |
|---------|------|
| `admin_users`, `admin_roles`, `admin_sessions` | Admin認証はPGのみで十分（低頻度アクセス） |
| `treasury_*` (6テーブル) | Treasury操作は低頻度、PG直接クエリ |
| `insurance_*` (3テーブル) | 保険クレームは低頻度、PG直接クエリ |
| `council_members` | Council操作は低頻度、PG直接クエリ |
| `enterprise_*` (7テーブル) | Enterprise機能はPGのみで十分 |
| `support_tickets`, `faqs`, `announcements` | サポート系は低頻度、PG直接クエリ |
| `daily_metrics`, `alert_rules`, `alerts` | メトリクス/アラートはPGのみ |
| `audit_logs`, `admin_audit_logs` | 監査ログはPG永続化のみ |
| `system_settings` | システム設定はPGのみ |

---

## 8. 不足テーブル・カラム一覧

### 8.1 即座に必要（Phantom Table Fix）

| 種別 | 対象 | 理由 | 優先度 |
|------|------|------|:------:|
| **新テーブル** | `council_actions` | CouncilRepositoryが参照しているがmigrationなし。runtime error発生。 | **高** |
| **新テーブル** | `council_action_signatures` | CouncilRepositoryが参照しているがmigrationなし。runtime error発生。 | **高** |

### 8.2 Phase 4 で必要（Token Hub拡張）

| 種別 | 対象 | 理由 |
|------|------|------|
| **カラム追加** | `veqs_locks.status` | Lock状態管理（active/expired/withdrawn） |
| **カラム追加** | `veqs_locks.ratio` | veQSロック比率の永続化 (線形減衰: remaining_time / MAX_LOCK_TIME) |
| **カラム追加** | `delegations.status` | 委任状態管理（active/revoked） |
| **カラム追加** | `delegations.revoked_at` | 委任取消タイムスタンプ |

### 8.3 将来検討（低優先度）

| 種別 | 対象 | 設計書セクション | 理由 |
|------|------|:----------------:|------|
| **新テーブル** | `expense_requests` | §6 | 経費申請管理（Admin機能） |
| **新テーブル** | `ticket_messages` | §6 | チケット返信（Support機能） |
| **新テーブル** | `hourly_metrics` | §6 | 時間単位メトリクス（Analytics機能） |
| **カラム追加** | `proposals.category` | §3 | プロポーザル分類 |
| **カラム追加** | `proposals.execution_hash` | §3 | 実行ハッシュ |

---

## 9. 次のマイグレーション計画

### 即座に実行（Phantom Table Fix）

```
013_council_actions.sql  ← council_actions, council_action_signatures テーブル作成
```

```sql
-- council_actions (referenced in CouncilRepository)
CREATE TABLE IF NOT EXISTS council_actions (
    action_id     VARCHAR(66)  PRIMARY KEY,
    action_type   VARCHAR(50)  NOT NULL,
    proposer      VARCHAR(42)  NOT NULL,
    proposed_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at    TIMESTAMP WITH TIME ZONE NOT NULL,
    signature_count   INTEGER NOT NULL DEFAULT 0,
    required_signatures INTEGER NOT NULL DEFAULT 3,
    state         VARCHAR(20) NOT NULL DEFAULT 'pending',
    action_data   JSONB,
    raw_data      TEXT,
    executed_at   TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_council_actions_state ON council_actions(state);
CREATE INDEX IF NOT EXISTS idx_council_actions_proposer ON council_actions(proposer);

-- council_action_signatures (referenced in CouncilRepository)
CREATE TABLE IF NOT EXISTS council_action_signatures (
    id              SERIAL PRIMARY KEY,
    action_id       VARCHAR(66) NOT NULL REFERENCES council_actions(action_id),
    signer_address  VARCHAR(42) NOT NULL,
    signer_seat_id  INTEGER NOT NULL,
    signed_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(action_id, signer_address)
);

CREATE INDEX IF NOT EXISTS idx_council_sigs_action ON council_action_signatures(action_id);
```

### Phase 4 実装時

```
014_veqs_extensions.sql  ← veqs_locks, delegations にカラム追加
```

### 将来（Phase 5以降で検討）

```
015_support_messages.sql     ← ticket_messages
016_hourly_metrics.sql       ← hourly_metrics
017_governance_extensions.sql ← proposals.category, execution_hash
018_expense_requests.sql     ← expense_requests
```

---

## Appendix A: 外部キー依存関係図

```
users (wallet_address)
├── user_settings
├── user_dilithium_keys
├── locks
│   ├── unlock_requests
│   │   ├── unlock_prover_signatures
│   │   ├── vrf_requests
│   │   ├── unlock_risk_scores
│   │   └── signing_queue
│   ├── challenges
│   │   ├── slashings
│   │   └── observer_earnings
│   └── insurance_claims
├── observers
│   └── observer_earnings
├── veqs_locks
├── delegations (delegator + delegatee)
├── reward_claims
└── insurance_claims

provers (prover_id)
├── prover_exits
├── prover_metrics
├── slashings
├── enterprise_contracts
└── signing_queue

admin_users (admin_id)
├── admin_audit_logs
├── admin_sessions
├── treasury_approvals
├── alerts (acknowledged_by)
├── announcements (created_by)
└── support_tickets (assigned_to)

admin_roles (role_id)
└── admin_users

treasury_wallets (wallet_id)
└── treasury_transactions
    ├── treasury_approvals
    └── treasury_audit_log

alert_rules (rule_id)
└── alerts

reward_epochs (epoch)
└── reward_claims

enterprise_organizations (org_id)
├── enterprise_users
├── enterprise_api_keys
├── enterprise_audit_log
└── enterprise_settings

council_actions (action_id)  ← ★ migration未作成
└── council_action_signatures
```

## Appendix B: マイグレーション変更履歴（v1.0→v2.0）

| マイグレーション | 追加テーブル | 追加カラム | 追加インデックス |
|:---------------:|:-----------:|:---------:|:---------------:|
| **008** | signing_queue | - | 5 |
| **009** | council_members, budget_allocations, treasury_audit_log | proposals.executed_by/tx_hash/at | 8 |
| **010** | - | admin_sessions.refresh_token_hash | 1 (partial) |
| **011** | enterprise_organizations, enterprise_users, enterprise_api_keys, enterprise_applications, enterprise_audit_log, enterprise_settings | - | 7 |
| **012** | - | proposals.proposal_type | 0 |

**結論**: マイグレーション008〜012により、テーブル数は43→53に増加（+10テーブル）。16リポジトリがすべてのテーブルへのDBアクセスを網羅。Dual-Write移行は主要エンティティで完了。SEQUENCES.md全9シーケンスのAPI検証完了（2026-02-07）。

**残課題**:
1. `council_actions`/`council_action_signatures` の phantom table（migration未作成）
2. Token Hub のカラム拡張（veqs_locks.status, delegations.status 等）
3. **signing_queue スキーマ乖離**: 実DBと migration 008 の定義が異なる（詳細は §3.4）
4. **provers 追加カラム**: `uptime_percentage`, `pending_rewards`, `total_earnings` が migration に未記載
5. **_sqlx_migrations 未登録**: migrations 005-012 がsqlxトラッカーに未登録
6. **FIX-001~022完了** (2026-02-08): FE側のMock/FALLBACK定数除去完了。全FEコンポーネントがAPI/DB実データまたは空状態を表示。BE側はgovernance.rs (Quorum) と token_hub.rs (veQS Multiplier) を修正。

## 10. FIX Execution Results (2026-02-08)

### 10.1 Frontend Data Source Cleanup

The FIX-001~022 execution (2026-02-08) addressed frontend components that were displaying fake/hardcoded data instead of querying the actual PostgreSQL tables. All backend handlers already used real PG repositories; the issues were entirely on the frontend side.

**Changes to FE data flow:**

| FIX | App | Change | Impact on DB Usage |
|:----|:----|:-------|:-------------------|
| FIX-009 | Token Hub | Removed try/catch→MOCK_DATA in 13 hooks | Hooks now expose API errors; React Query handles retries |
| FIX-010 | QS Hub | Removed try/catch→MOCK_DATA in 9 hooks | Same as above |
| FIX-011 | Explorer | Zeroed FALLBACK constants in 6 components | Components show empty state when no DB data |
| FIX-012 | QS Admin | Removed 3 generateMock* functions from useDashboard.ts | Charts show error state instead of random data |
| FIX-013 | Prover | Zeroed FALLBACK constants in 4 components | Dashboard/Metrics/Alerts/Application show empty state |
| FIX-014 | Consumer | Changed FALLBACK_BALANCE from 125.5 to 0 | Lock screen shows 0 when API unavailable |
| FIX-015 | Observer | Zeroed FALLBACK constants in Dashboard | Pending/Suspicious/Challenges show empty state |
| FIX-016 | Governance | Zeroed hardcoded data in 4 components | MyActivity/Dashboard/ProposalsList/Council show empty state |
| FIX-020 | Consumer | Removed fake notifications | Notifications show empty state |
| FIX-021 | Prover | Zeroed mock data in Exit/Settings/Challenges | Shows empty/placeholder state |

### 10.2 Backend Sequence Parameter Fixes

| FIX | Route Module | Change | DB Impact |
|:----|:------------|:-------|:----------|
| FIX-006 | governance.rs | proposal_type-specific Quorum (Signal 3%, Parameter 4%, Treasury 6%, Upgrade 8%, Emergency 15%) | `proposals.quorum` now set correctly per type |
| FIX-007 | token_hub.rs | veQS計算: 線形減衰モデルに統一 `calculate_veqs_ratio()` = amount × (remaining_time / MAX_LOCK_TIME)。SEQUENCES.md v2.2 §9.1 に準拠。FE/BE全体で "multiplier" → "ratio" に用語統一。 | `veqs_locks.veqs_value` now calculated correctly |

### 10.3 Remaining DB-Related Issues

| Issue | Table | Description |
|:------|:------|:------------|
| Consumer Lock balance | locks | FE uses `totalLocked` as proxy for available balance — needs wallet balance hook |
| Prover stats hardcoded | prover_metrics | `processed_change=12`, `avg_processed=420`, `response_time=28.2` still hardcoded in BE |
| Price oracle | multiple | USD values return 0 across all apps |
