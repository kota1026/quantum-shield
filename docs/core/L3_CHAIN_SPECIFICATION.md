# L3 Aegis Chain Specification v1.2

> **Document Version**: 1.2  
> **Last Updated**: 2025-01-01  
> **Status**: ✅ 全項目決定済み

---

## 1. 概要

### 1.1 目的

L3 Aegis Chainは、Quantum Shield L3ブリッジの分散処理レイヤーとして、
以下の機能を提供する：

- Unlock Requestの受付・検証・記録
- VRF結果の記録
- Prover選出と署名収集
- State Root計算とL1への提出

### 1.2 設計原則

| 原則 | 適用 |
|------|------|
| CP-1 完全量子耐性 | 全署名・ハッシュはNIST準拠 |
| CP-2 Self-Custody | L3はユーザー秘密鍵を保持しない |
| CP-3 Time Lock | L1で24h/7日Time Lock |
| CP-4 Slashing | L1でSlashing実行 |
| CP-5 透明性 | 全操作がL3ブロックに記録 |

### 1.3 技術選定サマリー

| 項目 | 決定 | 根拠 |
|------|------|------|
| 構成 | 独自4ノードBFTチェーン | CP-5透明性 |
| フレームワーク | 独自構築（l3-aegis） | CP-1完全制御 |
| 合意 | PBFT variant | f=1障害耐性 |
| ZK-STARK | 使用しない | 将来検討 |
| 実装言語 | Rust | 既存資産活用 |

### 1.4 除外した選択肢

| 選択肢 | 除外理由 |
|--------|---------|
| Rollup構成 | 透明性欠如（CP-5違反リスク） |
| Cosmos SDK | Go言語（Rustと不整合） |
| Substrate | CP-1改造が複雑 |
| SP1/Risc Zero | Sequencer構成で透明性欠如 |

> **決議記録**: `docs/aegis/meetings/L3_INFRASTRUCTURE_FINAL_DECISION_2025-12-28.md`

---

## 2. ブロック構造

### 2.1 ブロックヘッダ

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `version` | u8 | プロトコルバージョン |
| `height` | u64 | ブロック高 |
| `timestamp` | u64 | Unix timestamp (秒) |
| `parent_hash` | [u8; 32] | 前ブロックハッシュ (SHA3-256) |
| `state_root` | [u8; 32] | SMT State Root |
| `tx_root` | [u8; 32] | トランザクションMerkle Root |
| `proposer` | [u8; 32] | 提案ノードID |
| `validator_signatures` | Vec<DilithiumSig> | 合意署名 (3/4) |

```rust
// 実装時に詳細化（基本構造は決定済み）
pub struct BlockHeader {
    pub version: u8,
    pub height: u64,
    pub timestamp: u64,
    pub parent_hash: Hash256,
    pub state_root: Hash256,
    pub tx_root: Hash256,
    pub proposer: NodeId,
    pub validator_signatures: Vec<ValidatorSignature>,
}
```

### 2.2 ブロックボディ

```rust
pub struct BlockBody {
    pub transactions: Vec<Transaction>,
}
```

### 2.3 トランザクション種別

| 種別 | 用途 | 発行者 |
|------|------|--------|
| `UnlockRequestTx` | Unlock要求の記録 | User（L3経由） |
| `VRFResultTx` | VRF結果の記録 | L3ノード |
| `ProverSignatureTx` | Prover署名の記録 | Prover企業 |
| `L1SubmitTx` | L1提出の記録 | L3ノード |

```rust
// 実装時に詳細化（トランザクション種別は決定済み）
pub enum Transaction {
    UnlockRequest(UnlockRequestTx),
    VRFResult(VRFResultTx),
    ProverSignature(ProverSignatureTx),
    L1Submit(L1SubmitTx),
}
```

### 2.4 ブロックハッシュ計算

```
block_hash = SHA3-256(
    version ||
    height ||
    timestamp ||
    parent_hash ||
    state_root ||
    tx_root ||
    proposer
)
```

---

## 3. 合意プロトコル

### 3.1 PBFT Variant概要

| 項目 | 値 |
|------|-----|
| ノード数 | 4 |
| 障害耐性 | f = 1 (1/4) |
| 合意閾値 | 3/4 (75%) |
| ファイナリティ | 即時 |

### 3.2 フェーズ詳細

```
┌─────────────────────────────────────────────────────────────┐
│                     Consensus Flow                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│    Client Request                                           │
│         │                                                   │
│         ▼                                                   │
│    ┌─────────┐                                              │
│    │ Primary │──── Pre-Prepare ────► Backups (3)            │
│    └─────────┘                                              │
│         │                                                   │
│         ▼                                                   │
│    Prepare Phase: All nodes broadcast PREPARE               │
│    (Wait for 2f+1 = 3 PREPARE messages)                     │
│         │                                                   │
│         ▼                                                   │
│    Commit Phase: All nodes broadcast COMMIT                 │
│    (Wait for 2f+1 = 3 COMMIT messages)                      │
│         │                                                   │
│         ▼                                                   │
│    Reply to Client                                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.3 合意メッセージ

```rust
// 実装時に詳細化（メッセージ構造は決定済み）
pub enum ConsensusMessage {
    PrePrepare {
        view: u64,
        seq: u64,
        block: Block,
        signature: DilithiumSignature,
    },
    Prepare {
        view: u64,
        seq: u64,
        block_hash: Hash256,
        node_id: NodeId,
        signature: DilithiumSignature,
    },
    Commit {
        view: u64,
        seq: u64,
        block_hash: Hash256,
        node_id: NodeId,
        signature: DilithiumSignature,
    },
    ViewChange {
        new_view: u64,
        node_id: NodeId,
        signature: DilithiumSignature,
    },
}
```

### 3.4 View Change

| トリガー | タイムアウト |
|---------|------------|
| Primary障害検知 | **10秒** |
| 合意タイムアウト | **10秒** |

### 3.5 タイムアウト設定

| 項目 | 値 | 備考 |
|------|-----|------|
| ブロック生成間隔 | **5秒** | Unlock処理に十分な速度 |
| Pre-Prepare待機 | **2秒** | |
| Prepare待機 | **2秒** | |
| Commit待機 | **2秒** | |
| View Change | **10秒** | ブロック間隔の2倍 |

### 3.6 L3合意署名

| 項目 | 仕様 |
|------|------|
| アルゴリズム | Dilithium-III (FIPS 204) |
| 署名対象 | 合意メッセージ全体 |
| 署名サイズ | ~3KB/署名 |
| ブロックあたり | 4署名 × 3KB = ~12KB |

---

## 4. P2Pネットワーク

### 4.1 プロトコル選定

| 選択肢 | 評価 | 採用 |
|--------|------|------|
| libp2p | 成熟、Rust対応 | ❌ 4ノードには過剰 |
| **独自TCP** | シンプル | ✅ **採用** |
| gRPC | 型安全 | ❌ |

**決定**: 独自TCP + TLS 1.3 + mTLS

### 4.2 ノード発見

| 方式 | 説明 | 採用 |
|------|------|------|
| **静的ピアリスト** | 4ノード固定 | ✅ **採用** |
| DNS seeds | 動的発見 | ❌ Phase 4で検討 |

**決定**: 静的ピアリスト（設定ファイルに4ノードのアドレス記載）

### 4.3 メッセージ伝播

| メッセージ | 伝播方式 |
|-----------|---------|
| ブロック | ブロードキャスト |
| 合意メッセージ | ブロードキャスト |
| トランザクション | ブロードキャスト |

### 4.4 セキュリティ

| 項目 | 仕様 |
|------|------|
| 通信暗号化 | TLS 1.3 / mTLS |
| ノード認証 | Dilithium署名 |
| メッセージ認証 | 全メッセージに署名 |

---

## 5. 状態管理

### 5.1 Sparse Merkle Tree

| 項目 | 仕様 |
|------|------|
| ハッシュ | SHA3-256 |
| 深さ | 256ビット |
| Proof | Merkle Proof |

### 5.2 ストレージバックエンド

| 選択肢 | 評価 | 採用 |
|--------|------|------|
| **RocksDB** | 高性能、実績 | ✅ **採用** |
| LevelDB | シンプル | ❌ Rust対応弱い |
| sled | Pure Rust | ❌ 成熟度低 |

**決定**: RocksDB（rust-rocksdb crate使用）

### 5.3 状態構造

```rust
// Lock状態
pub struct LockState {
    pub lock_id: Hash256,
    pub amount: u128,
    pub owner_pk: DilithiumPublicKey,
    pub status: LockStatus,
}

// Unlock状態
pub struct UnlockState {
    pub unlock_id: Hash256,
    pub lock_id: Hash256,
    pub dest_addr: Address,
    pub amount: u128,
    pub prover_signatures: Vec<SPHINCSSignature>,
    pub status: UnlockStatus,
}
```

### 5.4 スナップショット

| 項目 | 値 |
|------|-----|
| 頻度 | **毎1000ブロック（約1.4時間）** |
| 形式 | RocksDB checkpoint |
| 保持数 | **3世代** |

### 5.5 プルーニング

| 項目 | ポリシー |
|------|---------|
| 古いブロック | **90日後削除** |
| トランザクション履歴 | **90日保持** |

---

## 6. データ可用性

### 6.1 フルノード要件

| 要件 | 説明 |
|------|------|
| 全ブロック保持 | 必須 |
| 全トランザクション保持 | 必須 |
| SMT状態保持 | 必須 |

### 6.2 履歴データ保持

| データ | 保持期間 |
|--------|---------|
| ブロック | **90日** |
| トランザクション | **90日** |
| 状態スナップショット | **3世代** |

### 6.3 可用性保証

| 項目 | 要件 |
|------|------|
| 最小ノード数 | 3/4 (障害1ノード許容) |
| データ冗長性 | 4ノード全てがフルデータ |

---

## 7. ノード運用

### 7.1 ハードウェア要件

| 項目 | 最小 | 推奨 |
|------|------|------|
| CPU | 4 vCPU | **8 vCPU** |
| メモリ | 8 GB | **16 GB** |
| ストレージ | 100 GB SSD | **500 GB NVMe** |
| ネットワーク | 100 Mbps | **1 Gbps** |

**根拠**:
- Dilithium署名検証はCPU負荷高
- SMTはメモリ使用量多
- 90日分のブロックは約75GB程度

### 7.2 地理的分散

| ノード | リージョン | 役割 |
|--------|-----------|------|
| Node 1 | US-East | Primary候補 |
| Node 2 | EU-West | Backup |
| Node 3 | Asia-SG | Backup |
| Node 4 | Reserve | Hot Standby |

### 7.3 HSM要件

| 項目 | 要件 |
|------|------|
| 対応アルゴリズム | Dilithium-III |
| 鍵バックアップ | 2-of-3マルチシグ |
| 物理セキュリティ | FIPS 140-2 Level 3+ |

### 7.4 SLA

| 項目 | 目標 |
|------|------|
| 稼働率 | **99.5%** |
| ブロック生成 | **10秒以内** |
| 復旧時間（RTO） | **5分以内** |

---

## 8. 量子耐性確認

### 8.1 使用アルゴリズム

| 用途 | アルゴリズム | 標準 | CP-1 |
|------|-------------|------|------|
| L3合意署名 | Dilithium-III | FIPS 204 | ✅ |
| ブロックハッシュ | SHA3-256 | FIPS 202 | ✅ |
| SMT | SHA3-256 | FIPS 202 | ✅ |
| P2P認証 | Dilithium-III | FIPS 204 | ✅ |

### 8.2 禁止アルゴリズム

| アルゴリズム | 理由 | 違反 |
|-------------|------|------|
| ECDSA | 量子脆弱 | CP-1 |
| Ed25519 | 量子脆弱 | CP-1 |
| secp256k1 | 量子脆弱 | CP-1 |
| RSA | 量子脆弱 | CP-1 |
| keccak256 | 非NIST | CP-1 |
| SHA-256 | SHA-2系 | CP-1 |

### 8.3 CP-1準拠チェックリスト

- [ ] 全署名がDilithium
- [ ] 全ハッシュがSHA3-256
- [ ] P2P通信がTLS 1.3
- [ ] HSMがDilithium対応

---

## 9. 2本立て設計と拡張性

> ⚠️ **重要設計変更（2025-01-01 CEO指示）**: IC-6 (Node Expansion 4→7) は不要。代替として2本立て設計を採用。

### 9.1 2本立て設計概要

| Edition | 対象市場 | L3 Nodes | Prover | 重視点 |
|---------|----------|----------|--------|--------|
| **Enterprise** | 金融系システム会社 | 4ノード固定（全Phase） | 許可制 | 安定性・規制対応 |
| **Decentralized** | DEX・ブリッジ・カストディ | 4ノード→Permissionless | 段階的分散化 | 分散性・透明性 |

### 9.2 Enterprise Edition

| Phase | L3 Nodes | Prover | メンバーシップ |
|-------|----------|--------|---------------|
| 全Phase | 4ノード固定 | 許可制（契約ベース） | Static |

**特徴**:
- 金融規制対応（知り得る運営者）
- 4ノードで十分なBFT耐性（f=1）
- QS提供 or 顧客自社運営（ライセンス）

### 9.3 Decentralized Edition

| Phase | L3 Nodes | Prover | メンバーシップ |
|-------|----------|--------|---------------|
| 1-2 (Foundation) | 4ノード（QS運営） | 5社固定（ETHステーク） | Static |
| 3 (Security Council) | 4ノード（SC管理） | $QSステーク（SC承認） | CouncilManaged |
| 4 (Full Decentralization) | Permissionless | Permissionless | Stake-based |

### 9.4 L3ノード拡張設計

```rust
/// メンバーシップ管理の抽象化
pub trait MembershipManager {
    fn add_node(&mut self, node: NodeConfig) -> Result<()>;
    fn remove_node(&mut self, node_id: NodeId) -> Result<()>;
    fn get_quorum(&self) -> usize;
    fn is_member(&self, node_id: NodeId) -> bool;
}

/// Phase 1-2: 静的メンバーシップ
pub struct StaticMembershipManager {
    nodes: Vec<NodeConfig>,  // 設定ファイルから読み込み
}

/// Phase 3: Security Council管理
pub struct CouncilMembershipManager {
    nodes: Vec<NodeConfig>,
    council: SecurityCouncil,
}

/// Phase 4: ステークベース
pub struct StakeMembershipManager {
    nodes: Vec<NodeConfig>,
    min_stake: u128,
    stake_contract: Address,
}
```

### 9.5 Prover拡張設計

```rust
/// Prover登録の抽象化
pub trait ProverRegistry {
    fn register(&mut self, prover: ProverConfig) -> Result<()>;
    fn unregister(&mut self, prover_id: ProverId) -> Result<()>;
    fn get_active_provers(&self) -> Vec<ProverConfig>;
    fn select_provers(&self, vrf_seed: &[u8], count: usize) -> Vec<ProverId>;
}

/// Phase 1-2: 許可制
pub struct PermissionedRegistry {
    provers: Vec<ProverConfig>,  // 5社固定
    admin: Address,
}

/// Phase 3-4: ステークベース
pub struct StakeBasedRegistry {
    provers: Vec<ProverConfig>,
    min_stake: u128,
    stake_currency: StakeCurrency,
}

pub enum StakeCurrency {
    ETH,  // Phase 1-2
    QS,   // Phase 3-4
}
```

### 9.6 合意閾値の設定可能化

```rust
pub struct ConsensusConfig {
    /// 合意に必要な投票数（分子）
    pub quorum_numerator: usize,
    /// 全ノード数（分母）
    pub quorum_denominator: usize,
    
    // Phase 1-2: 3/4
    // Phase 3:   5/7
    // Phase 4:   2/3 or stake-weighted
}

impl ConsensusConfig {
    pub fn quorum(&self) -> usize {
        (self.quorum_numerator * self.total_nodes()) / self.quorum_denominator
    }
}
```

### 9.7 BFT閾値の自動調整（Phase 4）

| ノード数 | 障害耐性 f | 合意閾値 |
|---------|-----------|---------|
| 4 | 1 | 3/4 (75%) |
| 7 | 2 | 5/7 (71%) |
| 13 | 4 | 9/13 (69%) |
| 21 | 6 | 15/21 (71%) |
| n | (n-1)/3 | 2f+1 / n |

---

## 10. 開発環境

### 10.1 動作モード

| モード | 用途 | ノード数 | メモリ | 対象環境 |
|--------|------|---------|--------|---------|
| `--dev --single` | 機能開発 | 1 | 500MB | MacBook Air 8GB |
| `--dev --nodes=4` | 合意テスト | 4 | 2GB | MacBook Pro 16GB |
| `--testnet` | 統合テスト | 4 | 4GB | 開発サーバー |
| (デフォルト) | 本番 | 4+ | 16GB | AWS/GCP |

### 10.2 シングルノードモード

```bash
# 起動
aegis-node --dev --single

# 特徴
# - 合意スキップ（即時確定）
# - スナップショット無効
# - プルーニング即時
# - メモリ500MB以下
```

### 10.3 4ノードローカルモード

```bash
# 起動スクリプト
./scripts/run-local-network.sh

# 内部動作
aegis-node --dev --node-id=1 --port=8001 --peers=localhost:8002,localhost:8003,localhost:8004 &
aegis-node --dev --node-id=2 --port=8002 --peers=localhost:8001,localhost:8003,localhost:8004 &
aegis-node --dev --node-id=3 --port=8003 --peers=localhost:8001,localhost:8002,localhost:8004 &
aegis-node --dev --node-id=4 --port=8004 --peers=localhost:8001,localhost:8002,localhost:8003 &

# 特徴
# - 実際の合意プロトコル動作
# - ブロック間隔: 1秒（高速テスト）
# - View Change テスト可能
# - メモリ2GB程度
```

### 10.4 開発モードの設定

```toml
# config/dev.toml
[consensus]
block_interval_secs = 1        # 本番は5秒
view_change_timeout_secs = 3   # 本番は10秒

[storage]
snapshot_enabled = false
pruning_immediate = true

[logging]
level = "debug"
```

### 10.5 最小ハードウェア要件（開発）

| 項目 | シングルノード | 4ノードローカル |
|------|---------------|----------------|
| CPU | 2コア | 4コア |
| メモリ | 8GB（うちノード500MB） | 16GB（うちノード2GB） |
| ストレージ | 10GB空き | 20GB空き |
| OS | macOS / Linux | macOS / Linux |

---

## 付録A: 決定事項サマリー

### 決定済み（2025-12-28エージェント会議）

| セクション | 項目 | 決定値 |
|-----------|------|--------|
| §3.5 | ブロック生成間隔 | **5秒** |
| §3.4 | View Changeタイムアウト | **10秒** |
| §3.5 | Pre-Prepare待機 | **2秒** |
| §3.5 | Prepare待機 | **2秒** |
| §3.5 | Commit待機 | **2秒** |
| §4.1 | P2Pプロトコル | **独自TCP + TLS 1.3 + mTLS** |
| §4.2 | ノード発見 | **静的ピアリスト** |
| §5.2 | ストレージ | **RocksDB** |
| §5.4 | スナップショット頻度 | **毎1000ブロック（~1.4時間）** |
| §5.5 | プルーニングポリシー | **90日後削除** |
| §6.2 | 履歴保持期間 | **90日** |
| §7.1 | CPU（推奨） | **8 vCPU** |
| §7.1 | メモリ（推奨） | **16 GB** |
| §7.1 | ストレージ（推奨） | **500 GB NVMe** |
| §7.1 | ネットワーク（推奨） | **1 Gbps** |
| §7.4 | ブロック生成SLA | **10秒以内** |
| §7.4 | 復旧時間（RTO） | **5分以内** |
| §7.4 | 稼働率 | **99.5%** |
| §9 | 拡張性 | **段階的アプローチ（Phase 1-4）** |
| §10 | 開発環境 | **シングル/4ノードローカル対応** |

### 決定済み（2025-01-01 CEO指示）

| セクション | 項目 | 決定値 |
|-----------|------|--------|
| §9 | IC-6 (Node Expansion 4→7) | **❌ 不要** |
| §9 | 代替設計 | **2本立て（Enterprise / Decentralized）** |
| §9 | Enterprise L3 Nodes | **4ノード固定（全Phase）** |
| §9 | Decentralized Phase 4 | **Permissionless** |

---

## 付録B: 決議記録への参照

- **技術選定決議**: `docs/aegis/meetings/L3_INFRASTRUCTURE_FINAL_DECISION_2025-12-28.md`
- **Core Principles**: `docs/constitution/CORE_PRINCIPLES.md`
- **Sequences**: `docs/aegis/QUANTUM_SHIELD_SEQUENCES_v2.0.md`

---

## 付録C: Phase別構成詳細表

> ⚠️ **2本立て設計（CEO指示 2025-01-01）**: IC-6 (4→7) は不要。Enterprise版は全Phaseで4ノード固定。Decentralized版はPhase 4でPermissionless。

### L3ノード構成（Decentralized Edition）

| 項目 | Phase 1-2 | Phase 3 | Phase 4 |
|------|-----------|---------|---------|
| ノード数 | 4固定 | 4（SC管理） | 動的 |
| 運営者 | QS | QS + 外部 | Permissionless |
| 参加要件 | QS選定 | SC承認 | $QSステーク |
| 合意閾値 | 3/4 | 3/4 | 2f+1 |
| メンバーシップ | Static | CouncilManaged | Stake-based |
| ノード追加 | 手動（設定変更） | SC投票 | 自動（ステーク） |
| ノード削除 | 手動 | SC投票 | 自動（ステーク不足/Slash） |

### Prover構成

| 項目 | Phase 1-2 | Phase 3 | Phase 4 |
|------|-----------|---------|---------|
| Prover数 | 5固定 | 拡張可能 | 無制限 |
| 運営者 | QS 3 + パートナー 2 | SC承認 | Permissionless |
| 参加要件 | 契約 + ETHステーク | SC承認 + $QSステーク | $QSステーク |
| 署名要件 | 2/5 | 設定可能 | 設定可能 |
| ステーク通貨 | ETH | $QS | $QS |
| Slashing | L1コントラクト | L1コントラクト | L1コントラクト |

### 開発環境対応

| 項目 | Phase 1-2 | Phase 3 | Phase 4 |
|------|-----------|---------|---------|
| ローカル開発 | ✅ 必須 | ✅ 必須 | 🟡 オプション |
| シングルノード | ✅ 対応 | ✅ 対応 | ✅ 対応 |
| 4ノードローカル | ✅ 対応 | ✅ 対応 | ✅ 対応 |
| テストネット | Sepolia | Sepolia | Sepolia |
| 最小メモリ | 500MB | 500MB | 500MB |

---

## 変更履歴

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-12-28 | 初版作成（ドラフト） |
| 1.1 | 2025-12-28 | 全項目決定、拡張性・開発環境セクション追加 |
| 1.2 | 2025-01-01 | ❌ IC-6不要（CEO指示）、§9 2本立て設計（Enterprise/Decentralized）追加 |

---

**END OF DOCUMENT**
