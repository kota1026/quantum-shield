# Quantum Shield - L1↔L3 Event Bridge 詳細設計 v1.0

> **作成日**: 2026-01-04
> **目的**: L1↔L3間のイベント同期メカニズムの詳細設計
> **優先度**: P0 (ブロッカー)
> **レビュー**: CIA必須

---

## 目次

1. [概要](#1-概要)
2. [アーキテクチャ](#2-アーキテクチャ)
3. [イベント定義](#3-イベント定義)
4. [同期メカニズム](#4-同期メカニズム)
5. [エラーハンドリング](#5-エラーハンドリング)
6. [実装詳細](#6-実装詳細)
7. [監視・アラート](#7-監視アラート)

---

## 1. 概要

### 1.1 目的

L1（Ethereum）とL3（Quantum Shield独自チェーン）間でイベントを双方向に同期し、以下を実現する：

- Lock: L1でのLockイベントをL3に伝播
- Unlock: L3での署名完了をL1に伝播
- 状態整合性: 両チェーン間の状態を一貫性を保つ

### 1.2 影響範囲

| シーケンス | 依存度 | 影響 |
|-----------|:------:|------|
| Seq #1 Lock | 高 | L1 Lock → L3 SMT更新 |
| Seq #2 Unlock (Normal) | 高 | L3署名 → L1 submitUnlock |
| Seq #3 Unlock (Emergency) | 高 | L1 timeout検知 |
| Seq #3' Resync | 中 | 同期ずれ修復 |
| Seq #4 Challenge | 中 | 証拠データ同期 |
| Seq #5-8 | 低 | 間接的影響 |

---

## 2. アーキテクチャ

### 2.1 全体構成

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Event Bridge System                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────┐                          ┌─────────────┐           │
│  │   L1        │                          │   L3        │           │
│  │  Ethereum   │                          │   Aegis     │           │
│  │             │                          │             │           │
│  │ ┌─────────┐ │     ┌──────────────┐    │ ┌─────────┐ │           │
│  │ │L1Vault  │◄├────►│ Event Bridge │◄───├►│L3State  │ │           │
│  │ └─────────┘ │     │   Service    │    │ └─────────┘ │           │
│  │             │     └──────┬───────┘    │             │           │
│  │ ┌─────────┐ │            │            │ ┌─────────┐ │           │
│  │ │VRF      │ │     ┌──────▼───────┐    │ │BFT      │ │           │
│  │ └─────────┘ │     │  Message     │    │ │Consensus│ │           │
│  │             │     │  Queue       │    │ └─────────┘ │           │
│  │ ┌─────────┐ │     │  (Redis)     │    │             │           │
│  │ │SPHINCS  │ │     └──────────────┘    │ ┌─────────┐ │           │
│  │ │Verifier │ │                         │ │Prover   │ │           │
│  │ └─────────┘ │                         │ │Registry │ │           │
│  │             │                         │ └─────────┘ │           │
│  └─────────────┘                         └─────────────┘           │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 コンポーネント

| コンポーネント | 役割 | 技術 |
|---------------|------|------|
| **Event Listener (L1)** | L1イベント監視 | ethers.js / viem |
| **Event Listener (L3)** | L3イベント監視 | Rust native |
| **Message Queue** | イベントバッファリング | Redis Streams |
| **Event Processor** | イベント処理・変換 | Rust |
| **State Sync** | 状態同期確認 | Rust |
| **Retry Manager** | 失敗時再試行 | Rust |

---

## 3. イベント定義

### 3.1 L1 → L3 イベント

#### Locked イベント

```solidity
// L1Vault.sol
event Locked(
    bytes32 indexed lockId,
    address indexed owner,
    uint256 chainId,
    address asset,
    uint256 amount,
    bytes destAddr,
    uint256 expiry,
    uint256 nonce,
    bytes32 sr0
);
```

#### L3での処理

```rust
// L3 Event Handler
pub struct LockedEvent {
    pub lock_id: [u8; 32],
    pub owner: Address,
    pub chain_id: u64,
    pub asset: Address,
    pub amount: U256,
    pub dest_addr: Vec<u8>,
    pub expiry: u64,
    pub nonce: u64,
    pub sr0: [u8; 32],
    pub l1_block_number: u64,
    pub l1_tx_hash: [u8; 32],
}

impl LockedEvent {
    pub async fn process(&self, state: &mut L3State) -> Result<()> {
        // 1. SR_0検証
        let computed_sr0 = compute_sr0(&self.to_lock_data());
        if computed_sr0 != self.sr0 {
            return Err(Error::InvalidSR0);
        }
        
        // 2. SMTに追加
        state.smt.insert(self.lock_id, self.sr0)?;
        
        // 3. Lockレコード作成
        state.locks.insert(self.lock_id, Lock {
            owner: self.owner,
            amount: self.amount,
            status: LockStatus::Locked,
            created_at: current_timestamp(),
            l1_block: self.l1_block_number,
        })?;
        
        // 4. イベント発行
        emit_event(L3Event::LockSynced {
            lock_id: self.lock_id,
            sr0: self.sr0,
        });
        
        Ok(())
    }
}
```

### 3.2 L3 → L1 イベント

#### UnlockReady イベント

```rust
// L3 Event
pub struct UnlockReadyEvent {
    pub lock_id: [u8; 32],
    pub sr0: [u8; 32],
    pub sr1: [u8; 32],
    pub smt_proof: Vec<u8>,
    pub unlock_data: Vec<u8>,
    pub sphincs_sigs: Vec<SphincsSignature>,
}
```

#### L1への伝播

```typescript
// Event Bridge Service
async function propagateUnlockReady(event: UnlockReadyEvent): Promise<void> {
  // 1. 署名検証
  for (const sig of event.sphincs_sigs) {
    if (!verifySphincsSignature(sig)) {
      throw new Error('Invalid SPHINCS+ signature');
    }
  }
  
  // 2. L1トランザクション作成
  const tx = await l1Vault.submitUnlock(
    event.lock_id,
    event.sr0,
    event.sr1,
    event.smt_proof,
    event.unlock_data,
    event.sphincs_sigs
  );
  
  // 3. 確認待ち
  await tx.wait(CONFIRMATION_BLOCKS);
  
  // 4. L3に結果通知
  await notifyL3UnlockSubmitted(event.lock_id, tx.hash);
}
```

### 3.3 イベント一覧

| 方向 | イベント名 | トリガー | 処理 |
|------|-----------|----------|------|
| L1→L3 | `Locked` | lock()実行 | SMT更新、Lock作成 |
| L1→L3 | `EmergencyUnlockInitiated` | emergencyUnlock()実行 | 緊急フラグ設定 |
| L1→L3 | `Claimed` | claim()実行 | Lock削除 |
| L3→L1 | `UnlockReady` | 2/5署名完了 | submitUnlock()実行 |
| L3→L1 | `ChallengeEvidence` | 不正検知 | challenge()実行 |
| 双方向 | `Heartbeat` | 定期 | 同期確認 |

---

## 4. 同期メカニズム

### 4.1 同期方式

**ハイブリッド方式**: Push + Poll

```
┌─────────────────────────────────────────────────────────────────────┐
│                        同期方式                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  【Primary】Push方式（リアルタイム）                                  │
│  ├── WebSocket接続                                                  │
│  ├── イベント即時通知                                                │
│  └── レイテンシ: < 1秒                                               │
│                                                                      │
│  【Backup】Poll方式（フォールバック）                                 │
│  ├── 定期ポーリング（5秒間隔）                                       │
│  ├── 見逃しイベント検出                                              │
│  └── 整合性チェック                                                  │
│                                                                      │
│  【Recovery】Resync方式（手動/自動）                                  │
│  ├── 完全再同期                                                      │
│  ├── 差分同期                                                        │
│  └── トリガー: 同期ずれ検知時                                        │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.2 Push方式詳細

```rust
// L1 Event Listener
pub struct L1EventListener {
    provider: Provider<Ws>,
    contract: L1Vault,
    event_channel: mpsc::Sender<L1Event>,
}

impl L1EventListener {
    pub async fn start(&self) -> Result<()> {
        let filter = self.contract.events();
        let mut stream = filter.subscribe().await?;
        
        while let Some(event) = stream.next().await {
            match event {
                Ok(e) => {
                    // イベント送信
                    self.event_channel.send(e.into()).await?;
                    
                    // 確認待ち
                    self.wait_confirmations(e.block_number, REQUIRED_CONFIRMATIONS).await?;
                    
                    // 確定イベント送信
                    self.event_channel.send(ConfirmedEvent(e).into()).await?;
                }
                Err(e) => {
                    log::error!("Event stream error: {}", e);
                    // 再接続
                    self.reconnect().await?;
                }
            }
        }
        
        Ok(())
    }
}
```

### 4.3 Poll方式詳細

```rust
// Fallback Poller
pub struct EventPoller {
    provider: Provider<Http>,
    contract: L1Vault,
    last_block: AtomicU64,
}

impl EventPoller {
    pub async fn poll_loop(&self) -> Result<()> {
        let mut interval = tokio::time::interval(Duration::from_secs(5));
        
        loop {
            interval.tick().await;
            
            let current_block = self.provider.get_block_number().await?;
            let from_block = self.last_block.load(Ordering::SeqCst);
            
            if current_block > from_block {
                // イベント取得
                let events = self.contract
                    .events()
                    .from_block(from_block)
                    .to_block(current_block)
                    .query()
                    .await?;
                
                // 処理
                for event in events {
                    self.process_event(event).await?;
                }
                
                // 更新
                self.last_block.store(current_block, Ordering::SeqCst);
            }
        }
    }
}
```

### 4.4 Resync方式詳細

```rust
// Resync Manager
pub struct ResyncManager {
    l1_state: L1State,
    l3_state: L3State,
}

impl ResyncManager {
    /// 完全再同期
    pub async fn full_resync(&mut self, from_block: u64) -> Result<()> {
        log::info!("Starting full resync from block {}", from_block);
        
        // 1. L1全イベント取得
        let events = self.l1_state.get_all_events(from_block).await?;
        
        // 2. L3状態リセット
        self.l3_state.reset_to_block(from_block).await?;
        
        // 3. 順次適用
        for event in events {
            self.l3_state.apply_event(event).await?;
        }
        
        // 4. 整合性チェック
        self.verify_consistency().await?;
        
        log::info!("Full resync completed");
        Ok(())
    }
    
    /// 差分同期
    pub async fn incremental_resync(&mut self) -> Result<()> {
        // 1. 差分検出
        let diff = self.detect_diff().await?;
        
        // 2. 差分適用
        for missing_event in diff.missing_in_l3 {
            self.l3_state.apply_event(missing_event).await?;
        }
        
        Ok(())
    }
    
    /// 整合性検証
    async fn verify_consistency(&self) -> Result<()> {
        let l1_root = self.l1_state.get_smt_root().await?;
        let l3_root = self.l3_state.get_smt_root().await?;
        
        if l1_root != l3_root {
            return Err(Error::InconsistentState {
                l1_root,
                l3_root,
            });
        }
        
        Ok(())
    }
}
```

---

## 5. エラーハンドリング

### 5.1 エラー分類

| カテゴリ | エラー | 対応 |
|---------|--------|------|
| **ネットワーク** | 接続断 | 自動再接続 + Poll fallback |
| **ネットワーク** | タイムアウト | リトライ（指数バックオフ） |
| **データ** | 無効イベント | スキップ + ログ + アラート |
| **データ** | 重複イベント | 冪等性チェック |
| **状態** | 同期ずれ | 自動Resync |
| **状態** | 不整合 | アラート + 手動介入 |

### 5.2 リトライポリシー

```rust
// Retry Policy
pub struct RetryPolicy {
    max_attempts: u32,
    initial_delay: Duration,
    max_delay: Duration,
    backoff_multiplier: f64,
}

impl Default for RetryPolicy {
    fn default() -> Self {
        Self {
            max_attempts: 10,
            initial_delay: Duration::from_secs(1),
            max_delay: Duration::from_secs(300),
            backoff_multiplier: 2.0,
        }
    }
}

impl RetryPolicy {
    pub async fn execute<F, T, E>(&self, mut f: F) -> Result<T, E>
    where
        F: FnMut() -> Pin<Box<dyn Future<Output = Result<T, E>>>>,
        E: std::fmt::Debug,
    {
        let mut attempts = 0;
        let mut delay = self.initial_delay;
        
        loop {
            attempts += 1;
            
            match f().await {
                Ok(result) => return Ok(result),
                Err(e) if attempts >= self.max_attempts => {
                    log::error!("Max retry attempts reached: {:?}", e);
                    return Err(e);
                }
                Err(e) => {
                    log::warn!("Attempt {} failed: {:?}, retrying in {:?}", attempts, e, delay);
                    tokio::time::sleep(delay).await;
                    delay = std::cmp::min(
                        Duration::from_secs_f64(delay.as_secs_f64() * self.backoff_multiplier),
                        self.max_delay,
                    );
                }
            }
        }
    }
}
```

### 5.3 冪等性保証

```rust
// Idempotency Key Manager
pub struct IdempotencyManager {
    processed_events: HashSet<[u8; 32]>,
    redis: RedisClient,
}

impl IdempotencyManager {
    pub async fn process_if_new<F>(&mut self, event_id: [u8; 32], f: F) -> Result<bool>
    where
        F: FnOnce() -> Pin<Box<dyn Future<Output = Result<()>>>>,
    {
        // メモリチェック
        if self.processed_events.contains(&event_id) {
            return Ok(false);
        }
        
        // Redisチェック (分散環境対応)
        let key = format!("event:{}", hex::encode(event_id));
        let exists: bool = self.redis.exists(&key).await?;
        
        if exists {
            self.processed_events.insert(event_id);
            return Ok(false);
        }
        
        // 処理実行
        f().await?;
        
        // 処理済みマーク
        self.redis.set_ex(&key, "1", 86400 * 30).await?; // 30日保持
        self.processed_events.insert(event_id);
        
        Ok(true)
    }
}
```

---

## 6. 実装詳細

### 6.1 メッセージキュー設計

```
Redis Streams構成:

stream:l1_events
├── consumer_group: l3_processors
│   ├── consumer_1 (Node A)
│   ├── consumer_2 (Node B)
│   ├── consumer_3 (Node C)
│   └── consumer_4 (Node D)
└── retention: 7 days

stream:l3_events
├── consumer_group: l1_relayers
│   └── consumer_1 (L1 Relayer)
└── retention: 7 days
```

```rust
// Redis Streams Client
pub struct EventQueue {
    redis: RedisClient,
    stream_name: String,
    consumer_group: String,
    consumer_name: String,
}

impl EventQueue {
    pub async fn enqueue(&self, event: &Event) -> Result<String> {
        let id = self.redis.xadd(
            &self.stream_name,
            "*",
            &[
                ("type", &event.event_type),
                ("data", &serde_json::to_string(event)?),
                ("timestamp", &event.timestamp.to_string()),
            ],
        ).await?;
        
        Ok(id)
    }
    
    pub async fn dequeue(&self, count: usize) -> Result<Vec<Event>> {
        let entries = self.redis.xreadgroup(
            &self.consumer_group,
            &self.consumer_name,
            &[&self.stream_name],
            &[">"],
            Some(count),
            Some(5000), // 5秒ブロック
        ).await?;
        
        let events = entries
            .iter()
            .map(|e| serde_json::from_str(&e.data))
            .collect::<Result<Vec<_>>>()?;
        
        Ok(events)
    }
    
    pub async fn ack(&self, id: &str) -> Result<()> {
        self.redis.xack(&self.stream_name, &self.consumer_group, &[id]).await?;
        Ok(())
    }
}
```

### 6.2 Event Bridge Service

```rust
// Main Service
pub struct EventBridgeService {
    l1_listener: L1EventListener,
    l3_listener: L3EventListener,
    l1_queue: EventQueue,
    l3_queue: EventQueue,
    idempotency: IdempotencyManager,
    retry_policy: RetryPolicy,
}

impl EventBridgeService {
    pub async fn run(&mut self) -> Result<()> {
        // 並行タスク起動
        tokio::select! {
            r = self.run_l1_to_l3() => r?,
            r = self.run_l3_to_l1() => r?,
            r = self.run_health_check() => r?,
        }
        
        Ok(())
    }
    
    async fn run_l1_to_l3(&mut self) -> Result<()> {
        loop {
            // L1イベント取得
            let events = self.l1_queue.dequeue(10).await?;
            
            for event in events {
                // 冪等性チェック
                let processed = self.idempotency.process_if_new(
                    event.id,
                    || Box::pin(self.process_l1_event(&event))
                ).await?;
                
                if processed {
                    self.l1_queue.ack(&event.queue_id).await?;
                }
            }
        }
    }
    
    async fn process_l1_event(&self, event: &L1Event) -> Result<()> {
        match event {
            L1Event::Locked(e) => {
                // L3に同期
                self.l3_client.sync_lock(e).await?;
            }
            L1Event::EmergencyUnlockInitiated(e) => {
                // L3に緊急フラグ設定
                self.l3_client.set_emergency_flag(e.lock_id).await?;
            }
            _ => {}
        }
        
        Ok(())
    }
}
```

### 6.3 設定

```yaml
# event_bridge.yaml
l1:
  rpc_url: "wss://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_KEY}"
  contract_address: "0x..."
  confirmation_blocks: 12
  
l3:
  rpc_url: "http://localhost:8545"
  
redis:
  url: "redis://localhost:6379"
  streams:
    l1_events: "stream:l1_events"
    l3_events: "stream:l3_events"
  consumer_group: "event_bridge"
  
retry:
  max_attempts: 10
  initial_delay_ms: 1000
  max_delay_ms: 300000
  backoff_multiplier: 2.0
  
health_check:
  interval_secs: 30
  consistency_check_interval_secs: 300
```

---

## 7. 監視・アラート

### 7.1 メトリクス

| メトリクス | 説明 | 閾値 |
|-----------|------|------|
| `event_bridge_l1_events_total` | L1イベント総数 | - |
| `event_bridge_l3_events_total` | L3イベント総数 | - |
| `event_bridge_latency_seconds` | 同期レイテンシ | < 10秒 |
| `event_bridge_queue_depth` | キュー深度 | < 1000 |
| `event_bridge_retry_count` | リトライ回数 | < 10/分 |
| `event_bridge_errors_total` | エラー総数 | < 1/分 |
| `event_bridge_consistency_check_failures` | 整合性チェック失敗 | 0 |

### 7.2 アラート設定

```yaml
# alerts.yaml
groups:
  - name: event_bridge
    rules:
      - alert: EventBridgeHighLatency
        expr: event_bridge_latency_seconds > 30
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Event Bridge latency is high"
          
      - alert: EventBridgeQueueBacklog
        expr: event_bridge_queue_depth > 1000
        for: 10m
        labels:
          severity: critical
        annotations:
          summary: "Event queue is backing up"
          
      - alert: EventBridgeConsistencyFailure
        expr: event_bridge_consistency_check_failures > 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "L1/L3 state consistency check failed"
```

---

## 8. 工数見積もり

| コンポーネント | 工数 | 担当 |
|---------------|:----:|------|
| L1 Event Listener | 3日 | Backend |
| L3 Event Listener | 2日 | Backend |
| Message Queue (Redis) | 2日 | Infra |
| Event Processor | 3日 | Backend |
| Retry/Idempotency | 2日 | Backend |
| Resync Manager | 3日 | Backend |
| 監視・アラート | 2日 | DevOps |
| テスト | 3日 | QA |
| **合計** | **20日** | - |

---

**END OF DOCUMENT**
