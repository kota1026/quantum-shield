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

### 3.2 L3 → L1 イベント

#### UnlockReady イベント

```rust
pub struct UnlockReadyEvent {
    pub lock_id: [u8; 32],
    pub sr0: [u8; 32],
    pub sr1: [u8; 32],
    pub smt_proof: Vec<u8>,
    pub unlock_data: Vec<u8>,
    pub sphincs_sigs: Vec<SphincsSignature>,
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

- **Primary**: Push方式（WebSocket接続、レイテンシ < 1秒）
- **Backup**: Poll方式（5秒間隔ポーリング）
- **Recovery**: Resync方式（完全/差分再同期）

### 4.2 確認ブロック数

| チェーン | 確認ブロック数 | 理由 |
|---------|:-------------:|------|
| L1 (Ethereum) | 12 | reorg対策 |
| L3 (Aegis) | 1 | BFT即時ファイナリティ |

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

```yaml
max_attempts: 10
initial_delay: 1s
max_delay: 300s
backoff_multiplier: 2.0
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

### 6.2 設定

```yaml
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

### 7.2 アラート

- **EventBridgeHighLatency**: レイテンシ > 30秒 が 5分継続
- **EventBridgeQueueBacklog**: キュー深度 > 1000 が 10分継続
- **EventBridgeConsistencyFailure**: 整合性チェック失敗

---

## 8. 工数見積もり

| コンポーネント | 工数 |
|---------------|:----:|
| L1 Event Listener | 3日 |
| L3 Event Listener | 2日 |
| Message Queue (Redis) | 2日 |
| Event Processor | 3日 |
| Retry/Idempotency | 2日 |
| Resync Manager | 3日 |
| 監視・アラート | 2日 |
| テスト | 3日 |
| **合計** | **20日** |

---

**END OF DOCUMENT**
