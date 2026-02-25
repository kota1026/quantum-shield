# Auto-Claim Service 設計書

> **Version**: 1.0
> **Last Updated**: 2026-02-24
> **Status**: Draft

---

## 概要

Auto-Claim Serviceは、24時間のTimeLock完了後に自動でUnlockを実行するオフチェーンサービスです。
SEQUENCES.md v3.0で導入され、ユーザーは手動でClaimする必要がなくなります。

## 設計原則

| 原則 | 説明 |
|:-----|:-----|
| **自動化** | ユーザーはSubmit Unlockまでで操作完了 |
| **信頼性** | 複数ノードで冗長化、失敗時はリトライ |
| **ガス負担** | Protocol Treasury（運営）が負担 |
| **後方互換性** | 手動Claimも引き続き可能 |

---

## アーキテクチャ

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Auto-Claim Service                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                        Event Listener                                    │ │
│  │                                                                           │ │
│  │  • L1 Vault の UnlockRequested Event を監視                              │ │
│  │  • WebSocket / Polling で接続                                            │ │
│  │  • 新規Unlock検出時 → Claim Queue に登録                                 │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                      │                                        │
│                                      ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                         Claim Queue                                      │ │
│  │                         (PostgreSQL / Redis)                             │ │
│  │                                                                           │ │
│  │  • lockId, releaseAt, recipient, amount, status                         │ │
│  │  • status: PENDING, PROCESSING, COMPLETED, FAILED                       │ │
│  │  • 永続化 → サービス再起動後も継続                                       │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                      │                                        │
│                                      ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                        Claim Executor                                    │ │
│  │                                                                           │ │
│  │  • releaseAt 到達を検知                                                  │ │
│  │  • Challenge 状態を確認                                                  │ │
│  │  • executeUnlock(lockId) を呼び出し                                      │ │
│  │  • ガス代は Treasury Wallet から                                         │ │
│  │  • 失敗時 → リトライ (max 3回)                                          │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                      │                                        │
│                                      ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                        Notification Service                              │ │
│  │                                                                           │ │
│  │  • Claim完了 → ユーザーに通知 (WebSocket / Push)                         │ │
│  │  • 失敗 → アラート (Slack / PagerDuty)                                  │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## データモデル

### Claim Queue テーブル

```sql
CREATE TABLE auto_claim_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lock_id BYTEA NOT NULL UNIQUE,
    recipient_address TEXT NOT NULL,
    amount NUMERIC(78, 0) NOT NULL,
    release_at TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    retry_count INT NOT NULL DEFAULT 0,
    last_error TEXT,
    tx_hash TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_auto_claim_queue_release_at ON auto_claim_queue(release_at);
CREATE INDEX idx_auto_claim_queue_status ON auto_claim_queue(status);
```

### Status Enum

| Status | 説明 |
|:-------|:-----|
| `PENDING` | Claim待ち（releaseAt未到達） |
| `READY` | releaseAt到達、Claim可能 |
| `PROCESSING` | Claimトランザクション送信中 |
| `COMPLETED` | Claim成功 |
| `FAILED` | Claim失敗（リトライ上限超過） |
| `CANCELLED` | Challenge成立によりキャンセル |

---

## 処理フロー

### 1. Event Detection

```rust
// Pseudo-code
async fn listen_unlock_events(vault: &L1Vault) {
    let filter = vault.unlock_requested_filter();

    loop {
        for event in filter.subscribe().await {
            let claim = ClaimQueueEntry {
                lock_id: event.lock_id,
                recipient: event.recipient,
                amount: event.amount,
                release_at: event.release_time,
                status: Status::Pending,
            };

            db.insert_claim_queue(claim).await;
            log::info!("New unlock queued: {:?}", event.lock_id);
        }
    }
}
```

### 2. Claim Execution

```rust
// Pseudo-code
async fn execute_claims(vault: &L1Vault, treasury: &Wallet) {
    loop {
        let ready_claims = db.get_ready_claims().await;

        for claim in ready_claims {
            // Check for challenges
            let challenge = vault.get_challenge(claim.lock_id).await;
            if challenge.status == ChallengeStatus::Pending {
                log::warn!("Skipping due to active challenge: {:?}", claim.lock_id);
                continue;
            }

            // Execute claim
            db.update_status(claim.id, Status::Processing).await;

            match vault.execute_unlock(claim.lock_id)
                .gas_price(get_gas_price())
                .send_with_wallet(treasury)
                .await
            {
                Ok(tx) => {
                    db.update_completed(claim.id, tx.hash).await;
                    notify_user(claim.recipient, "Claim completed").await;
                }
                Err(e) => {
                    db.increment_retry(claim.id, e.to_string()).await;
                    if claim.retry_count >= MAX_RETRIES {
                        alert_ops("Auto-claim failed", claim).await;
                    }
                }
            }
        }

        sleep(Duration::from_secs(10)).await;
    }
}
```

---

## ガス代管理

### Treasury Wallet

```yaml
# config/auto_claim.yaml
treasury:
  address: "0x..." # Protocol Treasury
  min_balance_eth: 0.5  # Alert if below
  refill_threshold_eth: 1.0

gas:
  max_gas_price_gwei: 50  # Skip if gas too high
  priority_fee_gwei: 2
  gas_limit: 200000
```

### ガス見積もり

| 操作 | Gas | コスト (@50 gwei) |
|:-----|----:|------------------:|
| executeUnlock | ~100K | ~$2.50 |
| 1日100件 | 10M | ~$250 |
| 月間 | 300M | ~$7,500 |

---

## 冗長化

### マルチノード構成

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ Auto-Claim  │  │ Auto-Claim  │  │ Auto-Claim  │
│  Node 1     │  │  Node 2     │  │  Node 3     │
│  (Primary)  │  │  (Standby)  │  │  (Standby)  │
└──────┬──────┘  └──────┬──────┘  └──────┬──────┘
       │                │                │
       └────────────────┼────────────────┘
                        │
                  ┌─────┴─────┐
                  │ PostgreSQL │
                  │ (Shared)   │
                  └───────────┘
```

- **Leader Election**: PostgreSQL advisory locks
- **Failover**: Primary停止時、Standbyが自動昇格
- **重複防止**: `status = PROCESSING` + DB transaction

---

## 監視・アラート

### メトリクス

| メトリクス | 説明 | 閾値 |
|:----------|:-----|:-----|
| `auto_claim_queue_pending` | Pending件数 | > 100 で警告 |
| `auto_claim_latency_seconds` | releaseAt から Claim までの遅延 | > 300s で警告 |
| `auto_claim_failure_rate` | 失敗率 | > 5% で警告 |
| `treasury_balance_eth` | Treasury残高 | < 0.5 ETH で警告 |

### アラート条件

| 条件 | 重大度 | 通知先 |
|:-----|:-------|:-------|
| Claim失敗 (3回リトライ後) | P2 | Slack #ops |
| Treasury残高不足 | P1 | PagerDuty |
| 全ノード停止 | P0 | PagerDuty |

---

## 設定例

```yaml
# config/auto_claim.yaml
service:
  name: "auto-claim-service"
  log_level: "info"

l1:
  rpc_url: "${L1_RPC_URL}"
  vault_address: "0x6F889C00a5e674ab0b9403AfBa0fBEbe30511c67"
  chain_id: 11155111

treasury:
  private_key: "${TREASURY_PRIVATE_KEY}"
  address: "0x..."

database:
  url: "${DATABASE_URL}"

polling:
  event_interval_secs: 10
  claim_interval_secs: 5

retry:
  max_attempts: 3
  backoff_secs: 30

gas:
  max_price_gwei: 100
  priority_fee_gwei: 2
```

---

## 実装場所

```
src/api/api/src/
├── services/
│   └── auto_claim/
│       ├── mod.rs
│       ├── event_listener.rs   # Event監視
│       ├── claim_executor.rs   # Claim実行
│       ├── queue.rs            # Queue管理
│       └── config.rs           # 設定
└── bin/
    └── auto_claim_worker.rs    # Standalone worker
```

---

## 今後の拡張

1. **Priority Queue**: 大口Unlockを優先処理
2. **Gas Optimization**: バッチ処理でガス削減
3. **User Opt-out**: 手動Claim希望者は除外オプション
4. **L2 Bridge**: L2からのUnlockにも対応

---

## 関連ドキュメント

- [SEQUENCES.md](../core/SEQUENCES.md) - Sequence #2: Unlock (Normal Path)
- [L1Vault.sol](../../src/l1/contracts/src/L1Vault.sol) - executeUnlock関数
- [STORAGE_ARCHITECTURE.md](./STORAGE_ARCHITECTURE.md) - データベース設計
