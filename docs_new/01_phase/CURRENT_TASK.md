# Task Definition

> **Generated**: 2026-01-12 (SEP v3)
> **Status**: Active

---

## 基本情報

| 項目 | 値 |
|------|-----|
| タスクID | TASK-P5-006 |
| タイトル | Event Bridge WebSocket/MQ統合 |
| 対象Sequence | #1 Lock, #2 Unlock |
| 優先度 | P1 |
| 見積り工数 | 8日 |

---

## 背景

### 現状分析

| コンポーネント | ファイル | 状態 | 備考 |
|--------------|---------|:----:|------|
| L1EventListener | `indexer/listener.rs` | ✅ 完成 | Polling mode動作、Alloy使用 |
| EventQueue | `queue.rs` | ✅ 完成 | Redis Streams使用 |
| Config | `config.rs` | ✅ 完成 | L1/L3/Redis設定 |
| Events | `events.rs` | ✅ 完成 | LockedEvent, EmergencyUnlockEvent |
| Metrics | `metrics.rs` | ✅ 完成 | Prometheus metrics |
| **WebSocket** | - | ❌ 未実装 | リアルタイム通知なし |
| **RabbitMQ** | - | ❌ 未実装 | publish機能なし |

### ギャップ分析

```
現在のフロー:
L1 Event → Indexer → Redis Streams → (終了)

必要なフロー:
L1 Event → Indexer → Redis Streams → WebSocket Broadcast
                                   → RabbitMQ Publish → API消費
```

---

## 実装項目

### 1. WebSocketサーバー追加

**ファイル**: `services/event-bridge/src/websocket.rs`

```rust
pub struct WebSocketServer {
    connections: Arc<RwLock<Vec<WebSocketSender>>>,
}

impl WebSocketServer {
    pub async fn start(addr: SocketAddr) -> Result<Self>;
    pub async fn broadcast(&self, event: &BridgeEvent) -> Result<()>;
}
```

### 2. RabbitMQクライアント追加

**ファイル**: `services/event-bridge/src/rabbitmq.rs`

```rust
pub struct RabbitMQClient {
    connection: Connection,
    channel: Channel,
}

impl RabbitMQClient {
    pub async fn new(url: &str) -> Result<Self>;
    pub async fn publish(&self, queue: &str, event: &BridgeEvent) -> Result<()>;
}
```

### 3. NotificationService統合

**ファイル**: `services/event-bridge/src/notification.rs`

```rust
pub struct NotificationService {
    websocket: WebSocketServer,
    rabbitmq: RabbitMQClient,
}

impl NotificationService {
    pub async fn notify(&self, event: &BridgeEvent) -> Result<()> {
        self.websocket.broadcast(event).await?;
        self.rabbitmq.publish("events", event).await?;
        Ok(())
    }
}
```

### 4. main.rs更新

- WebSocketサーバー起動
- NotificationService統合
- EventQueueからの読み取り→通知

---

## 完了条件

| # | 条件 | コマンド |
|---|------|---------|
| 1 | ビルド成功 | `cargo build -p event-bridge` |
| 2 | テスト成功 | `cargo test -p event-bridge` |
| 3 | WebSocket接続可能 | Manual test |

---

## 次のステップ

→ `21_impl_verify_loop.md` を実行（検証ループ付き実装）

---

**END OF TASK DEFINITION**
