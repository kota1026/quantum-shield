# L3 Aegis Node Architecture Design

> **Task ID**: 1.2.1  
> **Version**: 1.0  
> **Author**: CTO Agent  
> **Date**: 2025-12-22  
> **Status**: Draft

---

## 1. Overview

L3 Aegis（Layer 3 Aegis）は、Quantum Shield L3ブリッジのオフチェーン処理レイヤーである。4ノード分散構成でBFTコンセンサスを実現し、L1とL3間の状態同期、Dilithium署名検証、SMT管理を担当する。

### 1.1 Design Goals

| Goal | Description |
|------|-------------|
| **Quantum Resistance** | Dilithium署名検証、SHA3-256ハッシュ |
| **Byzantine Fault Tolerance** | 1/4ノード障害耐性 |
| **High Availability** | 99.5% SLA目標 |
| **Geographic Distribution** | US/EU/Asia/予備の4リージョン |
| **Deterministic Execution** | 全ノードで同一状態 |

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              L3 Aegis Network                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│    ┌──────────────────┐        ┌──────────────────┐                         │
│    │   Node US-East   │◄──────►│   Node EU-West   │                         │
│    │   (Primary)      │        │   (Secondary)    │                         │
│    └────────┬─────────┘        └────────┬─────────┘                         │
│             │                           │                                    │
│             │      BFT Consensus        │                                    │
│             │       (PBFT/HotStuff)     │                                    │
│             │                           │                                    │
│    ┌────────┴─────────┐        ┌────────┴─────────┐                         │
│    │   Node Asia-SG   │◄──────►│   Node Reserve   │                         │
│    │   (Secondary)    │        │   (Hot Standby)  │                         │
│    └──────────────────┘        └──────────────────┘                         │
│                                                                              │
│    ════════════════════════════════════════════════                         │
│                         Shared State                                         │
│    ════════════════════════════════════════════════                         │
│                                                                              │
│    ┌──────────────────────────────────────────────┐                         │
│    │           Sparse Merkle Tree (SMT)           │                         │
│    │         ┌─────────────────────────┐          │                         │
│    │         │       State Root        │          │                         │
│    │         └───────────┬─────────────┘          │                         │
│    │              ┌──────┴──────┐                 │                         │
│    │           ┌──┴──┐       ┌──┴──┐              │                         │
│    │         Lock1  Lock2  Lock3  ...             │                         │
│    └──────────────────────────────────────────────┘                         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                    │                           │
                    │  L1 Sync                  │  Prover Communication
                    ▼                           ▼
          ┌─────────────────┐         ┌─────────────────┐
          │   L1 Ethereum   │         │  Prover Pool    │
          │   (Vault)       │         │  (5 Provers)    │
          └─────────────────┘         └─────────────────┘
```

---

## 3. Node Architecture

### 3.1 Single Node Components

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          Aegis Node                                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                        API Layer                                 │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │    │
│  │  │  REST API   │  │  gRPC API   │  │  WebSocket  │              │    │
│  │  │  (Public)   │  │  (Internal) │  │  (Events)   │              │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘              │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                              │                                           │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    Processing Layer                              │    │
│  │  ┌──────────────────┐  ┌──────────────────┐                     │    │
│  │  │  Transaction     │  │  Consensus       │                     │    │
│  │  │  Processor       │  │  Engine (BFT)    │                     │    │
│  │  └──────────────────┘  └──────────────────┘                     │    │
│  │  ┌──────────────────┐  ┌──────────────────┐                     │    │
│  │  │  Dilithium       │  │  SMT             │                     │    │
│  │  │  Verifier        │  │  Manager         │                     │    │
│  │  └──────────────────┘  └──────────────────┘                     │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                              │                                           │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    External Integration                          │    │
│  │  ┌──────────────────┐  ┌──────────────────┐                     │    │
│  │  │  L1 Sync         │  │  Prover          │                     │    │
│  │  │  Module          │  │  Coordinator     │                     │    │
│  │  └──────────────────┘  └──────────────────┘                     │    │
│  │  ┌──────────────────┐  ┌──────────────────┐                     │    │
│  │  │  VRF             │  │  Monitoring      │                     │    │
│  │  │  Integration     │  │  & Metrics       │                     │    │
│  │  └──────────────────┘  └──────────────────┘                     │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                              │                                           │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    Storage Layer                                 │    │
│  │  ┌──────────────────┐  ┌──────────────────┐                     │    │
│  │  │  RocksDB         │  │  WAL             │                     │    │
│  │  │  (State)         │  │  (Recovery)      │                     │    │
│  │  └──────────────────┘  └──────────────────┘                     │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Component Details

| Component | Technology | Description |
|-----------|------------|-------------|
| REST API | Actix-Web | Public API for client requests |
| gRPC API | Tonic | Internal node-to-node communication |
| WebSocket | Tokio-tungstenite | Real-time event streaming |
| Consensus Engine | Custom PBFT | 3/4 Byzantine fault tolerance |
| Dilithium Verifier | pqcrypto-dilithium | FIPS 204 compliant |
| SMT Manager | Custom | Sparse Merkle Tree operations |
| L1 Sync | ethers-rs | Ethereum event monitoring |
| Prover Coordinator | Custom | VRF selection, signature aggregation |
| Storage | RocksDB | Persistent state storage |

---

## 4. Consensus Mechanism

### 4.1 PBFT Variant

L3 Aegisは4ノード構成のPBFT（Practical Byzantine Fault Tolerance）を採用。

**Fault Tolerance**: f = ⌊(n-1)/3⌋ = ⌊(4-1)/3⌋ = 1

```
                    ┌───────────────┐
                    │    Client     │
                    └───────┬───────┘
                            │ Request
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│    ┌─────────┐      Pre-Prepare       ┌─────────┐           │
│    │ Primary │─────────────────────▶ │ Backup1 │           │
│    │  (P)    │                        │  (B1)   │           │
│    └────┬────┘                        └────┬────┘           │
│         │                                   │                │
│         │ Prepare                           │ Prepare        │
│         │◀─────────────────────────────────▶│                │
│         │                                   │                │
│    ┌────┴────┐                        ┌────┴────┐           │
│    │ Backup2 │                        │ Backup3 │           │
│    │  (B2)   │                        │  (B3)   │           │
│    └─────────┘                        └─────────┘           │
│                                                              │
│         Commit Phase: 3/4 agreement required                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Consensus Phases

| Phase | Description | Threshold |
|-------|-------------|-----------|
| Pre-Prepare | Primary proposes block | 1/4 |
| Prepare | Nodes validate and broadcast | 3/4 |
| Commit | Nodes commit to state | 3/4 |
| Reply | Response to client | - |

### 4.3 View Change

Primary failure triggers view change:

1. Backup detects timeout (5 seconds)
2. Initiates VIEW-CHANGE message
3. 3/4 agreement on new primary
4. New primary resumes operations

---

## 5. Core Modules

### 5.1 Transaction Processor

```rust
pub struct TransactionProcessor {
    smt: SparseMerkleTree,
    dilithium_verifier: DilithiumVerifier,
    pending_txs: VecDeque<Transaction>,
}

impl TransactionProcessor {
    /// Process incoming unlock request
    pub async fn process_unlock_request(
        &mut self,
        request: UnlockRequest,
    ) -> Result<UnlockResponse, ProcessError> {
        // 1. Validate Dilithium signature
        let sig_valid = self.dilithium_verifier.verify(
            &request.public_key,
            &request.message,
            &request.signature,
        )?;
        
        if !sig_valid {
            return Err(ProcessError::InvalidSignature);
        }
        
        // 2. Check SMT for lock existence
        let lock = self.smt.get(&request.lock_id)?;
        if lock.is_none() {
            return Err(ProcessError::LockNotFound);
        }
        
        // 3. Validate amount and recipient
        let lock = lock.unwrap();
        if lock.amount != request.amount {
            return Err(ProcessError::AmountMismatch);
        }
        
        // 4. Create pending unlock
        let pending = PendingUnlock {
            lock_id: request.lock_id,
            recipient: request.recipient,
            amount: request.amount,
            state_root: self.smt.root(),
            created_at: Utc::now(),
        };
        
        // 5. Add to consensus queue
        self.pending_txs.push_back(Transaction::Unlock(pending));
        
        Ok(UnlockResponse {
            state_root: self.smt.root(),
            proof: self.smt.prove(&request.lock_id)?,
        })
    }
}
```

### 5.2 Dilithium Verifier

```rust
use pqcrypto_dilithium::dilithium3::{
    PublicKey, Signature, verify_detached,
};

pub struct DilithiumVerifier {
    /// FIPS 204 Level 3 parameters
    security_level: SecurityLevel,
}

impl DilithiumVerifier {
    pub fn verify(
        &self,
        public_key: &[u8],      // 1952 bytes
        message: &[u8],
        signature: &[u8],        // 3293 bytes
    ) -> Result<bool, VerifyError> {
        // Parse public key
        let pk = PublicKey::from_bytes(public_key)
            .map_err(|_| VerifyError::InvalidPublicKey)?;
        
        // Parse signature
        let sig = Signature::from_bytes(signature)
            .map_err(|_| VerifyError::InvalidSignature)?;
        
        // Verify
        Ok(verify_detached(&sig, message, &pk).is_ok())
    }
}
```

### 5.3 SMT Manager

```rust
pub struct SparseMerkleTree {
    root: Hash256,
    db: RocksDB,
    depth: u8,  // 256 for SHA3-256
}

impl SparseMerkleTree {
    /// Insert new lock into tree
    pub fn insert(&mut self, lock_id: Hash256, lock_data: LockData) -> Result<Hash256> {
        let leaf = self.hash_leaf(&lock_id, &lock_data);
        let path = self.compute_path(&lock_id);
        
        // Update path from leaf to root
        let mut current = leaf;
        for (depth, sibling) in path.iter().enumerate() {
            current = if lock_id.bit(depth) {
                self.hash_node(sibling, &current)
            } else {
                self.hash_node(&current, sibling)
            };
        }
        
        self.root = current;
        self.db.put(&lock_id, &lock_data)?;
        
        Ok(self.root)
    }
    
    /// Generate Merkle proof for lock
    pub fn prove(&self, lock_id: &Hash256) -> Result<MerkleProof> {
        let mut proof = Vec::new();
        let path = self.compute_path(lock_id);
        
        for (depth, sibling) in path.iter().enumerate() {
            proof.push(ProofNode {
                hash: *sibling,
                is_left: !lock_id.bit(depth),
            });
        }
        
        Ok(MerkleProof { nodes: proof })
    }
    
    /// Hash function using SHA3-256 (FIPS 202)
    fn hash_node(&self, left: &Hash256, right: &Hash256) -> Hash256 {
        let mut hasher = Sha3_256::new();
        hasher.update(left.as_bytes());
        hasher.update(right.as_bytes());
        Hash256::from_slice(&hasher.finalize())
    }
}
```

### 5.4 L1 Sync Module

```rust
pub struct L1Sync {
    provider: Provider<Ws>,
    vault_address: Address,
    last_synced_block: u64,
}

impl L1Sync {
    /// Monitor L1 for Lock events
    pub async fn start_sync(&mut self, tx: Sender<L1Event>) -> Result<()> {
        let filter = Filter::new()
            .address(self.vault_address)
            .event("Locked(bytes32,address,address,uint256,bytes32)")
            .from_block(self.last_synced_block);
        
        let mut stream = self.provider.subscribe_logs(&filter).await?;
        
        while let Some(log) = stream.next().await {
            let event = self.parse_lock_event(log)?;
            tx.send(L1Event::Lock(event)).await?;
            self.last_synced_block = log.block_number.unwrap().as_u64();
        }
        
        Ok(())
    }
    
    /// Submit state root to L1
    pub async fn submit_state_root(
        &self,
        state_root: Hash256,
        signatures: Vec<SPHINCSSignature>,
    ) -> Result<TxHash> {
        let tx = self.vault_contract
            .update_state_root(state_root, signatures)
            .send()
            .await?;
        
        Ok(tx.tx_hash())
    }
}
```

### 5.5 Prover Coordinator

```rust
pub struct ProverCoordinator {
    provers: Vec<ProverInfo>,
    vrf_client: ChainlinkVRF,
}

impl ProverCoordinator {
    /// Select provers using VRF
    pub async fn select_provers(
        &self,
        unlock_id: Hash256,
        num_required: usize,
    ) -> Result<Vec<ProverInfo>> {
        // Request VRF randomness
        let random = self.vrf_client
            .request_randomness(unlock_id.as_bytes())
            .await?;
        
        // Weighted selection based on stake
        let total_stake: u128 = self.provers.iter()
            .map(|p| p.stake)
            .sum();
        
        let mut selected = Vec::new();
        let mut remaining = random;
        
        while selected.len() < num_required {
            let threshold = remaining % total_stake;
            let mut cumulative = 0u128;
            
            for prover in &self.provers {
                cumulative += prover.stake;
                if cumulative > threshold && !selected.contains(prover) {
                    selected.push(prover.clone());
                    break;
                }
            }
            
            remaining = keccak256(&remaining.to_be_bytes());
        }
        
        Ok(selected)
    }
    
    /// Request signatures from selected provers
    pub async fn request_signatures(
        &self,
        provers: &[ProverInfo],
        message: &[u8],
    ) -> Result<Vec<SPHINCSSignature>> {
        let timeout = Duration::from_secs(300); // 5 minutes
        
        let futures: Vec<_> = provers.iter()
            .map(|p| self.request_signature(p, message))
            .collect();
        
        let results = tokio::time::timeout(
            timeout,
            futures::future::join_all(futures),
        ).await?;
        
        let signatures: Vec<_> = results
            .into_iter()
            .filter_map(|r| r.ok())
            .collect();
        
        if signatures.len() < 2 {
            return Err(ProverError::InsufficientSignatures);
        }
        
        Ok(signatures)
    }
}
```

---

## 6. Data Structures

### 6.1 Lock Data

```rust
#[derive(Serialize, Deserialize, Clone)]
pub struct LockData {
    pub lock_id: Hash256,
    pub sender: Address,
    pub recipient: Address,
    pub amount: U256,
    pub dilithium_pubkey_hash: Hash256,
    pub locked_at: u64,       // L1 block number
    pub status: LockStatus,
}

#[derive(Serialize, Deserialize, Clone)]
pub enum LockStatus {
    Active,
    PendingUnlock { requested_at: u64 },
    Released { released_at: u64 },
    Challenged { challenged_at: u64 },
}
```

### 6.2 Consensus Message

```rust
#[derive(Serialize, Deserialize)]
pub enum ConsensusMessage {
    PrePrepare {
        view: u64,
        sequence: u64,
        digest: Hash256,
        block: Block,
    },
    Prepare {
        view: u64,
        sequence: u64,
        digest: Hash256,
        node_id: NodeId,
        signature: Signature,
    },
    Commit {
        view: u64,
        sequence: u64,
        digest: Hash256,
        node_id: NodeId,
        signature: Signature,
    },
    ViewChange {
        new_view: u64,
        last_sequence: u64,
        node_id: NodeId,
        proof: ViewChangeProof,
    },
}
```

### 6.3 Block

```rust
#[derive(Serialize, Deserialize)]
pub struct Block {
    pub height: u64,
    pub timestamp: u64,
    pub prev_hash: Hash256,
    pub state_root: Hash256,
    pub transactions: Vec<Transaction>,
    pub proposer: NodeId,
    pub signatures: Vec<NodeSignature>,
}

#[derive(Serialize, Deserialize)]
pub enum Transaction {
    Lock(LockData),
    Unlock(UnlockData),
    StateRootUpdate(StateRootUpdate),
}
```

---

## 7. Network Protocol

### 7.1 Node Discovery

```yaml
# Static node configuration (Phase 1)
nodes:
  - id: "node-us-east"
    endpoint: "aegis-us.quantumshield.io:9000"
    public_key: "0x..."
    region: "us-east-1"
    
  - id: "node-eu-west"
    endpoint: "aegis-eu.quantumshield.io:9000"
    public_key: "0x..."
    region: "eu-west-1"
    
  - id: "node-asia-sg"
    endpoint: "aegis-sg.quantumshield.io:9000"
    public_key: "0x..."
    region: "ap-southeast-1"
    
  - id: "node-reserve"
    endpoint: "aegis-reserve.quantumshield.io:9000"
    public_key: "0x..."
    region: "us-west-2"
```

### 7.2 Message Format

```protobuf
syntax = "proto3";

package aegis;

message AegisMessage {
    MessageType type = 1;
    bytes payload = 2;
    bytes signature = 3;
    uint64 timestamp = 4;
}

enum MessageType {
    CONSENSUS = 0;
    TRANSACTION = 1;
    STATE_SYNC = 2;
    HEARTBEAT = 3;
}

message TransactionRequest {
    bytes lock_id = 1;
    bytes recipient = 2;
    uint64 amount = 3;
    bytes dilithium_signature = 4;
    bytes dilithium_pubkey = 5;
}

message TransactionResponse {
    bool success = 1;
    bytes state_root = 2;
    repeated bytes proof = 3;
    string error = 4;
}
```

---

## 8. API Specification

### 8.1 Public REST API

```yaml
openapi: 3.0.0
info:
  title: L3 Aegis API
  version: 1.0.0

paths:
  /v1/locks/{lockId}:
    get:
      summary: Get lock details
      parameters:
        - name: lockId
          in: path
          required: true
          schema:
            type: string
      responses:
        200:
          description: Lock details
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Lock'

  /v1/unlock/request:
    post:
      summary: Request unlock
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UnlockRequest'
      responses:
        200:
          description: Unlock request accepted
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/UnlockResponse'

  /v1/state/root:
    get:
      summary: Get current state root
      responses:
        200:
          description: Current state root
          content:
            application/json:
              schema:
                type: object
                properties:
                  root:
                    type: string
                  height:
                    type: integer
                  timestamp:
                    type: integer

  /v1/proof/{lockId}:
    get:
      summary: Get SMT proof for lock
      parameters:
        - name: lockId
          in: path
          required: true
          schema:
            type: string
      responses:
        200:
          description: Merkle proof
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/MerkleProof'
```

### 8.2 Internal gRPC API

```protobuf
service AegisNode {
    // Consensus
    rpc ProposeBlock(ProposeRequest) returns (ProposeResponse);
    rpc Vote(VoteRequest) returns (VoteResponse);
    rpc Commit(CommitRequest) returns (CommitResponse);
    
    // State Sync
    rpc SyncState(SyncRequest) returns (stream StateChunk);
    rpc GetStateRoot(Empty) returns (StateRootResponse);
    
    // Health
    rpc HealthCheck(Empty) returns (HealthResponse);
}
```

---

## 9. Deployment

### 9.1 Infrastructure

| Node | Region | Instance | Storage |
|------|--------|----------|---------|
| US-East | us-east-1 | c6a.2xlarge | 500GB NVMe |
| EU-West | eu-west-1 | c6a.2xlarge | 500GB NVMe |
| Asia-SG | ap-southeast-1 | c6a.2xlarge | 500GB NVMe |
| Reserve | us-west-2 | c6a.2xlarge | 500GB NVMe |

### 9.2 Docker Compose

```yaml
version: '3.8'

services:
  aegis-node:
    image: quantumshield/aegis:latest
    environment:
      - NODE_ID=${NODE_ID}
      - PEERS=${PEERS}
      - L1_RPC=${L1_RPC}
      - VAULT_ADDRESS=${VAULT_ADDRESS}
    ports:
      - "9000:9000"   # gRPC
      - "8080:8080"   # REST API
      - "8081:8081"   # WebSocket
      - "9090:9090"   # Metrics
    volumes:
      - aegis-data:/data
      - ./config:/config:ro
    deploy:
      resources:
        limits:
          cpus: '4'
          memory: 16G

  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9091:9090"

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    volumes:
      - grafana-data:/var/lib/grafana

volumes:
  aegis-data:
  grafana-data:
```

---

## 10. Monitoring

### 10.1 Metrics

| Metric | Type | Description |
|--------|------|-------------|
| aegis_blocks_height | Gauge | Current block height |
| aegis_consensus_rounds | Counter | Consensus rounds completed |
| aegis_locks_total | Counter | Total locks processed |
| aegis_unlocks_total | Counter | Total unlocks processed |
| aegis_state_root_updates | Counter | State root updates to L1 |
| aegis_dilithium_verifications | Histogram | Verification latency |
| aegis_smt_operations | Histogram | SMT operation latency |
| aegis_peer_connections | Gauge | Active peer connections |

### 10.2 Alerts

```yaml
groups:
  - name: aegis
    rules:
      - alert: NodeDown
        expr: up{job="aegis"} == 0
        for: 1m
        labels:
          severity: critical
          
      - alert: ConsensusSlow
        expr: rate(aegis_consensus_rounds[5m]) < 0.1
        for: 5m
        labels:
          severity: warning
          
      - alert: HighLatency
        expr: histogram_quantile(0.99, aegis_dilithium_verifications) > 1
        for: 5m
        labels:
          severity: warning
```

---

## 11. Security

### 11.1 Network Security

| Layer | Protection |
|-------|------------|
| Transport | mTLS with Ed25519 certificates |
| Message | HMAC-SHA3-256 authentication |
| Consensus | BFT with signature verification |

### 11.2 Key Management

```
┌─────────────────────────────────────────────────────────────┐
│                      Key Hierarchy                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│    ┌─────────────────────────────────────────────────────┐  │
│    │              Master Key (HSM)                        │  │
│    │        - Never leaves HSM                            │  │
│    │        - Used for key derivation only                │  │
│    └──────────────────────┬──────────────────────────────┘  │
│                           │                                  │
│            ┌──────────────┼──────────────┐                  │
│            ▼              ▼              ▼                  │
│    ┌────────────┐  ┌────────────┐  ┌────────────┐          │
│    │  Node      │  │  Signing   │  │  TLS       │          │
│    │  Identity  │  │  Key       │  │  Key       │          │
│    └────────────┘  └────────────┘  └────────────┘          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 12. Recovery

### 12.1 State Recovery

```rust
impl AegisNode {
    /// Recover state from peers
    pub async fn recover_state(&mut self) -> Result<()> {
        // 1. Find highest block among peers
        let peer_heights = self.query_peer_heights().await?;
        let max_height = peer_heights.iter().max().unwrap();
        
        // 2. Request missing blocks
        let my_height = self.storage.get_height()?;
        for height in my_height..*max_height {
            let block = self.request_block(height).await?;
            self.apply_block(block)?;
        }
        
        // 3. Verify state root matches
        let our_root = self.smt.root();
        let peer_roots = self.query_peer_roots().await?;
        
        if peer_roots.iter().filter(|r| **r == our_root).count() >= 3 {
            Ok(())
        } else {
            Err(RecoveryError::StateMismatch)
        }
    }
}
```

### 12.2 Disaster Recovery

| Scenario | RTO | RPO | Procedure |
|----------|-----|-----|-----------|
| Single node failure | 5 min | 0 | Auto-failover to reserve |
| Region failure | 15 min | 0 | Promote reserve, deploy new |
| 2+ node failure | 30 min | 0 | Manual intervention required |
| Complete failure | 1 hour | Last L1 commit | Restore from L1 state |

---

## 13. Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| Block time | 2 seconds | Consensus round |
| TPS | 100 tx/s | Lock/Unlock combined |
| Dilithium verify | < 5ms | Per signature |
| SMT update | < 1ms | Per operation |
| L1 sync latency | < 30s | Event detection |
| State root commit | Every 100 blocks | ~3.3 minutes |

---

## 14. Next Steps

1. **1.2.2**: Implement BFT consensus engine
2. **1.2.3**: Implement Dilithium verification module
3. **1.2.4**: Implement SMT management module
4. **1.2.5**: Integrate Chainlink VRF
5. **1.2.6**: Implement Prover communication protocol
6. **1.2.7**: Implement L1 sync module
7. **1.2.8**: Deploy 4-node cluster

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-22 | CTO | Initial architecture |

---

**END OF DOCUMENT**
