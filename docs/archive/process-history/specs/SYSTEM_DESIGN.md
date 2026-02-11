# Quantum Shield System Design

> **Version**: 1.0
> **Date**: 2026-01-27
> **Status**: Draft

---

## 1. System Overview

### 1.1 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │  Consumer   │  │   Prover    │  │  Observer   │  │   Explorer  │       │
│  │    App      │  │   Portal    │  │   Portal    │  │             │       │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘       │
│         │                │                │                │              │
│  ┌──────┴──────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │  Token Hub  │  │ Governance  │  │  QS Admin   │  │ Enterprise  │       │
│  │             │  │             │  │             │  │   Admin     │       │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘       │
│         └────────────────┼────────────────┼────────────────┘              │
│                          ▼                ▼                               │
└─────────────────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              API GATEWAY                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐       │
│    │   Rate Limiter  │    │  JWT Validator  │    │  Load Balancer  │       │
│    └────────┬────────┘    └────────┬────────┘    └────────┬────────┘       │
│             └──────────────────────┼──────────────────────┘                │
│                                    ▼                                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           APPLICATION LAYER                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         QS API Server (Rust/Axum)                   │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │                                                                     │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────┐  │   │
│  │  │  Lock API   │  │ Unlock API  │  │Challenge API│  │ Prover API│  │   │
│  │  │ (Seq #1)    │  │ (Seq #2,3)  │  │ (Seq #4)    │  │ (Seq #5,6)│  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └───────────┘  │   │
│  │                                                                     │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────┐  │   │
│  │  │Observer API │  │Governance   │  │ Token Hub   │  │Explorer API│  │   │
│  │  │             │  │    API      │  │    API      │  │           │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └───────────┘  │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│          L3 PROVER NETWORK (Prover-Operated BFT Blockchain)                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ★ 統合モデル: Prover = L3 Node Operator (Succinct Network方式)             │
│    各ProverがL3ノードを運営し、BFT合意に参加しながらSPHINCS+署名も提供       │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │               Prover運営 L3ノード (Prover Network)                   │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │                                                                     │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐  │   │
│  │  │  Prover A   │ │  Prover B   │ │  Prover C   │ │  Prover D   │  │   │
│  │  │  L3 Node    │ │  L3 Node    │ │  L3 Node    │ │  L3 Node    │  │   │
│  │  │  US-East    │ │  EU-West    │ │  Asia-SG    │ │  Reserve    │  │   │
│  │  │  ┌───────┐  │ │  ┌───────┐  │ │  ┌───────┐  │ │  ┌───────┐  │  │   │
│  │  │  │  HSM  │  │ │  │  HSM  │  │ │  │  HSM  │  │ │  │  HSM  │  │  │   │
│  │  │  │SPHINCS│  │ │  │SPHINCS│  │ │  │SPHINCS│  │ │  │SPHINCS│  │  │   │
│  │  │  └───────┘  │ │  └───────┘  │ │  └───────┘  │ │  └───────┘  │  │   │
│  │  │  $400K+     │ │  $400K+     │ │  $400K+     │ │  $400K+     │  │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘  │   │
│  │                                                                     │   │
│  │  役割（統合）:                                                       │   │
│  │  ・BFTコンセンサス: Dilithium-III署名でブロック合意 (3/4 quorum)     │   │
│  │  ・SPHINCS+署名: VRF選定時にアンロック承認署名を提供 (2/5選定)       │   │
│  │  ・ストレージ: RocksDB + SMT                                        │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                              ↓ L3トランザクション                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │           L3 = Quantum-Resistant Application Layer                  │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │                                                                     │   │
│  │  ★ L3の役割拡張: 全ての価値移動・ガバナンス操作を量子耐性化         │   │
│  │    L1はL3の判断を検証・実行する「Settlement Layer」                 │   │
│  │                                                                     │   │
│  │  【L3 Transaction Types】                                           │   │
│  │                                                                     │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │ 1. Unlock Operations (既存)                                  │   │   │
│  │  │    ├── UnlockRequestTx (User Dilithium署名)                  │   │   │
│  │  │    ├── VRFResultTx (Prover選定)                              │   │   │
│  │  │    └── ProverSignatureTx (SPHINCS+ 2/5署名)                  │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                     │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │ 2. veQS Staking Operations ★NEW                             │   │   │
│  │  │    ├── StakeLockTx (QSロック、veQS発行)                      │   │   │
│  │  │    ├── StakeExtendTx (ロック期間延長)                        │   │   │
│  │  │    ├── StakeWithdrawTx (ロック解除申請)                      │   │   │
│  │  │    └── DelegateTx (投票権委任)                               │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                     │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │ 3. Governance Operations ★NEW                               │   │   │
│  │  │    ├── ProposalCreateTx (提案作成)                           │   │   │
│  │  │    ├── VoteTx (投票: veQS加重)                               │   │   │
│  │  │    ├── VoteTallyTx (集計・結果確定)                          │   │   │
│  │  │    └── ExecuteProposalTx (L1実行命令生成)                    │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                     │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │ 4. Treasury Operations ★NEW                                 │   │   │
│  │  │    ├── ExpenseRequestTx (支出申請)                           │   │   │
│  │  │    ├── MultisigApproveTx (承認署名 - Dilithium)              │   │   │
│  │  │    └── ExecuteTransferTx (L1送金命令生成)                    │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                     │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │ 5. Token Operations ★NEW                                    │   │   │
│  │  │    ├── LargeTransferRequestTx (大口送金申請: >10K QS)        │   │   │
│  │  │    └── TransferApproveTx (承認 → L1実行)                     │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                     │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │ 6. Admin Operations ★NEW                                    │   │   │
│  │  │    ├── ProverApprovalTx (Prover承認 - Admin Dilithium)       │   │   │
│  │  │    ├── EmergencyPauseTx (緊急停止 - 3/5 Multisig)            │   │   │
│  │  │    └── ParameterChangeTx (パラメータ変更)                    │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                     │   │
│  │  全トランザクション: Dilithium-III署名必須（量子耐性）             │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    L3 State Management                              │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │                                                                     │   │
│  │  L3 State (RocksDB + SMT):                                          │   │
│  │  ├── veQS_balances: Map<Address, VeQSBalance>                      │   │
│  │  ├── delegations: Map<Address, Delegation>                         │   │
│  │  ├── proposals: Map<ProposalId, Proposal>                          │   │
│  │  ├── votes: Map<(ProposalId, Address), Vote>                       │   │
│  │  ├── treasury_requests: Map<RequestId, ExpenseRequest>             │   │
│  │  ├── multisig_approvals: Map<(RequestId, Signer), Approval>        │   │
│  │  └── unlock_requests: Map<UnlockId, UnlockRequest> (既存)          │   │
│  │                                                                     │   │
│  │  L3 → L1 Bridge:                                                    │   │
│  │  ├── L3で確定した操作をL1に証明と共に提出                          │   │
│  │  ├── L1はL3署名を検証して実行（Settlement）                        │   │
│  │  └── Merkle Proof + Dilithium署名のバンドル                        │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                ┌────────────────────┼────────────────────┐
                ▼                    ▼                    ▼
┌───────────────────────┐ ┌───────────────────┐ ┌───────────────────────┐
│     CRYPTO LAYER      │ │   MESSAGE LAYER   │ │    DATA LAYER         │
├───────────────────────┤ ├───────────────────┤ ├───────────────────────┤
│                       │ │                   │ │                       │
│ ┌───────────────────┐ │ │ ┌───────────────┐ │ │ ┌───────────────────┐ │
│ │  ML-DSA-65        │ │ │ │   RabbitMQ    │ │ │ │   PostgreSQL      │ │
│ │  (FIPS 204)       │ │ │ │               │ │ │ │   (Primary DB)    │ │
│ │  User Signatures  │ │ │ │ - sig_queue   │ │ │ │                   │ │
│ └───────────────────┘ │ │ │ - event_bridge│ │ │ │ Users, Locks,     │ │
│                       │ │ │ - l1_relay    │ │ │ │ Proposals, etc.   │ │
│ ┌───────────────────┐ │ │ └───────────────┘ │ │ └───────────────────┘ │
│ │  SPHINCS+-128s    │ │ │                   │ │                       │
│ │  Prover Signatures│ │ │                   │ │ ┌───────────────────┐ │
│ │  (8KB each)       │ │ │                   │ │ │      Redis        │ │
│ └───────────────────┘ │ │                   │ │ │   (Cache/Session) │ │
│                       │ │                   │ │ │                   │ │
│ ┌───────────────────┐ │ │                   │ │ │ Nonces, Sessions, │ │
│ │    SHA3-256       │ │ │                   │ │ │ Queue, Metrics    │ │
│ │  (FIPS 202)       │ │ │                   │ │ └───────────────────┘ │
│ │  SR_0/SR_1 Hash   │ │ │                   │ │                       │
│ └───────────────────┘ │ │                   │ │                       │
│                       │ │                   │ │                       │
│ ┌───────────────────┐ │ │                   │ │                       │
│ │       HSM         │ │ │                   │ │                       │
│ │  Prover Key Store │ │ │                   │ │                       │
│ └───────────────────┘ │ │                   │ │                       │
│                       │ │                   │ │                       │
└───────────────────────┘ └───────────────────┘ └───────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│               BLOCKCHAIN LAYER (L1 = Settlement Layer)                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ★ L1の役割: L3の判断を検証・実行する「Settlement Layer」                   │
│    L3 Proof + Dilithium署名を検証 → 実行許可 → 資産移動                     │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                 Ethereum L1 (Settlement Layer)                      │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │                                                                     │   │
│  │  ┌───────────────────────────────────────────────────────────────┐ │   │
│  │  │               L3 Bridge Verifier Contract                      │ │   │
│  │  │  ├── verifyL3Proof(proof, signatures) → bool                   │ │   │
│  │  │  ├── verifyDilithiumSignature(pubkey, sig, msg) → bool         │ │   │
│  │  │  └── L3 State Root管理                                         │ │   │
│  │  └───────────────────────────────────────────────────────────────┘ │   │
│  │                              │                                      │   │
│  │                              ▼                                      │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────┐  │   │
│  │  │  L1 Vault   │  │  Treasury   │  │  Governance │  │ QS Token  │  │   │
│  │  │  Contract   │  │  Contract   │  │  Executor   │  │ Contract  │  │   │
│  │  │             │  │             │  │             │  │           │  │   │
│  │  │ - Lock      │  │ - 5 Wallets │  │ - Execute   │  │ - ERC20   │  │   │
│  │  │ - Unlock*   │  │ - Transfer* │  │   Only*     │  │ - Transfer│  │   │
│  │  │ - Challenge │  │ - Gnosis    │  │ - L3 Proof  │  │   Guard*  │  │   │
│  │  │             │  │   Safe      │  │   Required  │  │           │  │   │
│  │  │ *L3 Proof   │  │ *L3 Proof   │  │             │  │ *Large TX │  │   │
│  │  │  Required   │  │  Required   │  │             │  │  Requires │  │   │
│  │  │             │  │             │  │             │  │  L3 Proof │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └───────────┘  │   │
│  │                                                                     │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │               Chainlink VRF v2.5 (Prover Selection)         │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Component Overview

| Component | Technology | Purpose |
|-----------|------------|---------|
| **QS API Server** | Rust + Axum | Core API handling all operations |
| **L3 Prover Network** | Prover運営BFT (Rust) | BFT合意 + SPHINCS+署名（統合モデル） |
| **Prover (= L3 Node)** | 4+ Provers (HSM) | L3ノード運営 + SPHINCS+署名提供 |
| **PostgreSQL** | PostgreSQL 16 | Primary data storage |
| **Redis** | Redis 7 | Caching, sessions, queues |
| **RabbitMQ** | RabbitMQ 3.13 | Async message processing |
| **L1 Contracts** | Solidity | On-chain operations (L1 Vault) |
| **Chainlink VRF** | VRF v2.5 | Prover selection randomness |
| **HSM** | AWS CloudHSM / YubiHSM | Prover key storage (SPHINCS+ keys) |

> **重要**: 統合モデル（Succinct Network方式）を採用。
> 各ProverがL3ノードを運営し、BFT合意に参加しながら、VRF選定時にSPHINCS+署名を提供する。

### 1.3 L3 Prover Network Architecture（統合モデル）

**統合モデル**: Prover = L3 Node Operator（Succinct Network方式）

各Proverが以下の2つの役割を統合して担当:
1. **L3ノード運営**: BFTコンセンサスに参加、Dilithium-III署名でブロック合意
2. **SPHINCS+署名提供**: VRF選定時にアンロック承認署名を提出

詳細仕様: `docs/core/L3_CHAIN_SPECIFICATION.md`

```
┌─────────────────────────────────────────────────────────────────┐
│              L3 Prover Network (Prover-Operated BFT)            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  アーキテクチャ（統合モデル）:                                   │
│  ・Prover = L3 Node Operator                                    │
│  ・各Proverが独自にL3ノードを運営                                │
│  ・参加するProver数に応じてネットワークがスケール                 │
│                                                                 │
│  技術スタック:                                                   │
│  ・言語: Rust                                                    │
│  ・コンセンサス: PBFT variant (3/4 quorum)                       │
│  ・ストレージ: RocksDB                                           │
│  ・P2P: 独自TCP + TLS 1.3 + mTLS                                │
│  ・コード: l3-aegis/crates/*                                     │
│                                                                 │
│  暗号アルゴリズム (CP-1準拠):                                    │
│  ・BFTコンセンサス署名: Dilithium-III (FIPS 204)                 │
│  ・アンロック承認署名: SPHINCS+-128s (FIPS 205)                  │
│  ・ハッシュ: SHA3-256 (FIPS 202)                                 │
│  ・状態管理: Sparse Merkle Tree (SMT)                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### L3トランザクション種別

| 種別 | 用途 | 発行者 |
|------|------|--------|
| **UnlockRequestTx** | Unlock要求の記録 | User（L3経由） |
| **VRFResultTx** | VRF結果の記録 | L3ノード |
| **ProverSignatureTx** | **Prover SPHINCS+署名の記録** | **Prover企業** |
| **L1SubmitTx** | L1提出の記録 | L3ノード |

> **重要**: ProverはL3上で`ProverSignatureTx`を発行してSPHINCS+署名を提出する

#### L3状態構造

```rust
// Unlock状態（L3上で管理）
pub struct UnlockState {
    pub unlock_id: Hash256,
    pub lock_id: Hash256,
    pub dest_addr: Address,
    pub amount: u128,
    pub prover_signatures: Vec<SPHINCSSignature>,  // SPHINCS+署名をL3に記録
    pub status: UnlockStatus,
}
```

#### Unlock時のL3フロー

```
1. User → L3: UnlockRequestTx (Unlock要求 + Dilithium署名)
2. L3: Dilithium検証、nonce/expiry検証、SR_1計算
3. L3 → Chainlink VRF: VRF seed要求
4. L3: VRFResultTx記録、Stake加重確率でProver 2社を選出
   P(i) = Stake_i / Σ Stake
5. Prover → L3: ProverSignatureTx (SPHINCS+署名、各8KB) ← L3上で署名
6. L3: 2/5署名収集完了後、L1SubmitTx記録
7. L3 → L1 Vault: SR_0, SR_1, SMT_proof, 2×SPHINCS+署名
8. L1 Vault: 検証後、24時間Time Lock開始
```

#### State Root計算式

```
Lock State Root (SR_0):
SR_0 = SHA3-256(
  "QS_LOCK_V1" ||
  chain_id ||
  asset ||
  amount ||
  dest_addr ||
  expiry ||
  nonce ||
  pk_dilithium
)

Unlock State Root (SR_1):
SR_1 = SHA3-256(
  "QS_UNLOCK_V1" ||
  SR_0 ||
  lock_id ||
  dest_addr ||
  amount ||
  nonce
)
```

#### Proverノード構成（統合モデル）

| Prover | リージョン | 役割 |
|--------|-----------|------|
| Prover A | US-East | L3ノード運営 + SPHINCS+署名 |
| Prover B | EU-West | L3ノード運営 + SPHINCS+署名 |
| Prover C | Asia-SG | L3ノード運営 + SPHINCS+署名 |
| Prover D | Reserve | L3ノード運営 + SPHINCS+署名 |
| Prover E+ | 拡張可能 | 新規Prover参加でスケール |

> **スケーラビリティ**: 統合モデルにより、新しいProverが参加するとL3ノードも増加し、
> ネットワークの分散性とスループットが向上する。

---

## 2. Component Design

### 2.1 API Server (Rust/Axum)

```
services/api/
├── src/
│   ├── main.rs              # Entry point
│   ├── config.rs            # Configuration
│   ├── error.rs             # Error handling
│   ├── types.rs             # Type definitions (1,339 lines)
│   │
│   ├── routes/              # API handlers
│   │   ├── mod.rs           # Route definitions
│   │   ├── lock.rs          # Sequence #1
│   │   ├── unlock.rs        # Sequence #2, #3
│   │   ├── challenge.rs     # Sequence #4
│   │   ├── prover.rs        # Sequence #5, #6
│   │   ├── observer.rs      # Observer API
│   │   ├── governance.rs    # Governance API
│   │   ├── token_hub.rs     # veQS operations
│   │   └── explorer.rs      # Public explorer
│   │
│   ├── services/            # Business logic
│   │   ├── mod.rs           # AppState definition
│   │   ├── redis_client.rs  # Redis operations
│   │   ├── rabbitmq_client.rs
│   │   ├── hsm_client.rs    # HSM integration
│   │   ├── vrf_service.rs   # Chainlink VRF
│   │   ├── sphincs_service.rs
│   │   └── auth_service.rs  # JWT handling
│   │
│   ├── crypto/              # Cryptographic operations
│   │   ├── mod.rs
│   │   ├── ml_dsa.rs        # FIPS 204
│   │   └── sha3.rs          # FIPS 202
│   │
│   └── middleware/          # Request middleware
│       ├── mod.rs
│       └── jwt_auth.rs      # JWT validation
```

### 2.2 Database Schema (PostgreSQL)

```sql
-- Core User Tables
CREATE TABLE users (
    wallet_address VARCHAR(42) PRIMARY KEY,
    pk_dilithium BYTEA,
    created_at TIMESTAMP DEFAULT NOW(),
    last_active TIMESTAMP
);

CREATE TABLE user_settings (
    wallet_address VARCHAR(42) PRIMARY KEY REFERENCES users,
    email VARCHAR(255),
    language VARCHAR(5) DEFAULT 'ja',
    notification_email BOOLEAN DEFAULT true,
    notification_browser BOOLEAN DEFAULT true,
    two_factor_enabled BOOLEAN DEFAULT false,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Lock/Unlock Tables
CREATE TABLE locks (
    lock_id VARCHAR(66) PRIMARY KEY,
    wallet_address VARCHAR(42) REFERENCES users,
    chain_id BIGINT NOT NULL,
    asset VARCHAR(42) NOT NULL,
    amount NUMERIC(78) NOT NULL,
    dest_addr BYTEA NOT NULL,
    expiry BIGINT NOT NULL,
    nonce BIGINT NOT NULL,
    pk_dilithium BYTEA NOT NULL,
    sig_dilithium BYTEA NOT NULL,
    sr_0 VARCHAR(66) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    l1_tx_hash VARCHAR(66),
    created_at TIMESTAMP DEFAULT NOW(),
    confirmed_at TIMESTAMP,

    INDEX idx_locks_wallet (wallet_address),
    INDEX idx_locks_status (status),
    INDEX idx_locks_created (created_at DESC)
);

CREATE TABLE unlock_requests (
    unlock_id VARCHAR(66) PRIMARY KEY,
    lock_id VARCHAR(66) REFERENCES locks,
    wallet_address VARCHAR(42) REFERENCES users,
    dest_addr BYTEA NOT NULL,
    amount NUMERIC(78) NOT NULL,
    sig_dilithium BYTEA NOT NULL,
    sr_0 VARCHAR(66) NOT NULL,
    sr_1 VARCHAR(66) NOT NULL,
    status VARCHAR(30) DEFAULT 'pending',
    is_emergency BOOLEAN DEFAULT false,
    bond_amount NUMERIC(78),
    release_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),

    INDEX idx_unlocks_lock (lock_id),
    INDEX idx_unlocks_status (status)
);

-- Prover Tables
CREATE TABLE provers (
    prover_id VARCHAR(66) PRIMARY KEY,
    operator_addr VARCHAR(42) NOT NULL,
    sphincs_pubkey BYTEA NOT NULL,
    stake_amount NUMERIC(78) NOT NULL,
    hsm_attestation BYTEA,
    status VARCHAR(20) DEFAULT 'pending_approval',
    registered_at TIMESTAMP DEFAULT NOW(),
    approved_at TIMESTAMP,

    INDEX idx_provers_status (status)
);

CREATE TABLE unlock_prover_signatures (
    signature_id VARCHAR(66) PRIMARY KEY,
    unlock_id VARCHAR(66) REFERENCES unlock_requests,
    prover_id VARCHAR(66) REFERENCES provers,
    sig_sphincs BYTEA NOT NULL,  -- ~8KB
    is_valid BOOLEAN DEFAULT true,
    signed_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(unlock_id, prover_id)
);

-- Challenge/Slashing Tables
CREATE TABLE challenges (
    challenge_id VARCHAR(66) PRIMARY KEY,
    lock_id VARCHAR(66) REFERENCES locks,
    challenger VARCHAR(42) NOT NULL,
    fraud_proof_hash VARCHAR(66) NOT NULL,
    bond NUMERIC(78) NOT NULL,
    challenged_at TIMESTAMP DEFAULT NOW(),
    defense_deadline TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    defender VARCHAR(42),
    defense_proof_hash VARCHAR(66),
    resolved_at TIMESTAMP,

    INDEX idx_challenges_lock (lock_id),
    INDEX idx_challenges_status (status)
);

-- Governance Tables
CREATE TABLE proposals (
    proposal_id VARCHAR(66) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    proposer VARCHAR(42) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    votes_for NUMERIC(78) DEFAULT 0,
    votes_against NUMERIC(78) DEFAULT 0,
    votes_abstain NUMERIC(78) DEFAULT 0,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE votes (
    vote_id VARCHAR(66) PRIMARY KEY,
    proposal_id VARCHAR(66) REFERENCES proposals,
    voter VARCHAR(42) NOT NULL,
    support SMALLINT NOT NULL,  -- 0=Against, 1=For, 2=Abstain
    weight NUMERIC(78) NOT NULL,
    voted_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(proposal_id, voter)
);

-- Token Hub Tables
CREATE TABLE veqs_locks (
    lock_id VARCHAR(66) PRIMARY KEY,
    wallet_address VARCHAR(42) REFERENCES users,
    locked_amount NUMERIC(78) NOT NULL,
    veqs_value NUMERIC(78) NOT NULL,
    lock_end TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE delegations (
    delegation_id VARCHAR(66) PRIMARY KEY,
    delegator VARCHAR(42) REFERENCES users,
    delegatee VARCHAR(42) REFERENCES users,
    amount NUMERIC(78) NOT NULL,
    delegated_at TIMESTAMP DEFAULT NOW()
);
```

### 2.3 Message Queue Design (RabbitMQ)

```
Exchanges:
├── qs.events (topic)
│   └── Routing Keys:
│       ├── lock.created      → Event Bridge
│       ├── unlock.requested  → Signature Queue
│       ├── challenge.filed   → Alert System
│       └── prover.selected   → Prover Nodes
│
├── qs.signatures (direct)
│   └── Queues:
│       ├── sig_queue         → Prover signature requests
│       └── sig_responses     → Collected signatures
│
└── qs.l1relay (direct)
    └── Queues:
        └── l1_relay          → L1 transaction relay
```

### 2.4 Caching Strategy (Redis)

```
Key Patterns:
├── nonce:{pk}:{nonce}          # Nonce tracking (30 day TTL)
├── lock:{lock_id}              # Lock data (365 day TTL)
├── prover:{prover_id}          # Prover info (no TTL)
├── challenge:{challenge_id}    # Challenge data (30 day TTL)
├── vrf:{vrf_request_id}        # VRF request (1 day TTL)
├── session:{token}             # JWT session (15 min TTL)
├── user:settings:{addr}        # User settings (no TTL)
├── veqs:lock:{addr}            # veQS position (no TTL)
└── prover:queue:{prover_id}    # Signing queue (7 day TTL)
```

---

## 3. Security Design

### 3.1 Cryptographic Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     LOCK OPERATION                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  User                          QS API                  L1       │
│    │                             │                      │       │
│    │  1. Generate ML-DSA-65 keypair (client)           │       │
│    │                             │                      │       │
│    │  2. Sign lock_message      │                      │       │
│    │     sig = ML-DSA-65.Sign(  │                      │       │
│    │       "QS_LOCK_V1" ||      │                      │       │
│    │       chain_id ||          │                      │       │
│    │       asset ||             │                      │       │
│    │       amount ||            │                      │       │
│    │       dest_addr ||         │                      │       │
│    │       expiry ||            │                      │       │
│    │       nonce                │                      │       │
│    │     , sk)                  │                      │       │
│    │                             │                      │       │
│    │ ─────── POST /lock ───────▶│                      │       │
│    │         {sig, pk, data}    │                      │       │
│    │                             │                      │       │
│    │                        3. Verify ML-DSA-65        │       │
│    │                           signature               │       │
│    │                             │                      │       │
│    │                        4. Compute SR_0            │       │
│    │                           = SHA3-256(             │       │
│    │                              lock_message ||      │       │
│    │                              pk                   │       │
│    │                           )                       │       │
│    │                             │                      │       │
│    │                             │ ─── store ──────────▶│      │
│    │                             │                      │       │
│    │ ◀────── {lock_id, sr_0} ───│                      │       │
│    │                             │                      │       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    UNLOCK OPERATION                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  User         QS API       Chainlink VRF    Provers    L1       │
│    │            │                │             │        │       │
│    │  Sign unlock_message       │             │        │       │
│    │            │                │             │        │       │
│    │ ─ POST ───▶│                │             │        │       │
│    │  /unlock   │                │             │        │       │
│    │            │                │             │        │       │
│    │       Verify sig           │             │        │       │
│    │            │                │             │        │       │
│    │       Compute SR_1         │             │        │       │
│    │       = SHA3-256(          │             │        │       │
│    │          SR_0 ||           │             │        │       │
│    │          unlock_msg        │             │        │       │
│    │       )                    │             │        │       │
│    │            │                │             │        │       │
│    │            │ ── requestRandomWords() ───▶│        │       │
│    │            │                │             │        │       │
│    │            │ ◀── fulfillRandomWords() ──│        │       │
│    │            │    (select 2 provers)       │        │       │
│    │            │                │             │        │       │
│    │            │ ────── SIG_REQ ────────────▶│        │       │
│    │            │                │             │        │       │
│    │            │                │      Sign with       │       │
│    │            │                │      SPHINCS+-128s   │       │
│    │            │                │             │        │       │
│    │            │ ◀───── SPHINCS+ sig ───────│        │       │
│    │            │        (2 of 5)             │        │       │
│    │            │                │             │        │       │
│    │            │ ────────── submit ─────────────────▶│       │
│    │            │                │             │        │       │
│    │ ◀── {unlock_id, release_time} ──────────│        │       │
│    │            │                │             │        │       │
│    │            │      [24h time lock]        │        │       │
│    │            │                │             │        │       │
│    │ ── claim ─▶│ ────────────────────────────────────▶│      │
│    │            │                │             │        │       │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Authentication Flow (SIWE + JWT)

```
┌─────────────────────────────────────────────────────────────────┐
│                  SIWE Authentication Flow                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Client                           QS API                        │
│    │                                 │                          │
│    │  1. Construct SIWE message      │                          │
│    │     (EIP-4361 format)           │                          │
│    │                                 │                          │
│    │  2. Sign with ML-DSA-65         │                          │
│    │     sig = Sign(message, sk)     │                          │
│    │                                 │                          │
│    │ ───── POST /auth/siwe ─────────▶│                          │
│    │       {message, sig, pk}        │                          │
│    │                                 │                          │
│    │                            3. Parse SIWE message           │
│    │                                 │                          │
│    │                            4. Verify ML-DSA-65 sig         │
│    │                                 │                          │
│    │                            5. Check nonce, expiry          │
│    │                                 │                          │
│    │                            6. Generate JWT tokens          │
│    │                               - access_token (15 min)      │
│    │                               - refresh_token (7 days)     │
│    │                                 │                          │
│    │ ◀──── {access_token, refresh_token} ────                   │
│    │                                 │                          │
│    │                                 │                          │
│    │ ───── GET /api/... ────────────▶│                          │
│    │       Authorization: Bearer {access_token}                 │
│    │                                 │                          │
│    │                            7. Validate JWT                 │
│    │                                 │                          │
│    │ ◀──── {response} ──────────────│                          │
│    │                                 │                          │
└─────────────────────────────────────────────────────────────────┘
```

### 3.3 Threat Model

| Threat | Mitigation |
|--------|------------|
| Quantum attack on signatures | ML-DSA-65, SPHINCS+-128s |
| Replay attack | Nonce tracking, expiry timestamps |
| Front-running | Time lock mechanism |
| Prover collusion | VRF random selection, 2-of-5 requirement |
| Fraudulent unlock | Challenge mechanism, 48h defense period |
| Key compromise | HSM storage, multisig requirement |
| DoS attack | Rate limiting, bond requirements |

---

## 4. Deployment Architecture

### 4.1 Infrastructure Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        AWS Cloud                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                     VPC (10.0.0.0/16)                    │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │                                                         │   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │            Public Subnet (10.0.1.0/24)          │   │   │
│  │  │                                                 │   │   │
│  │  │  ┌─────────────┐    ┌─────────────┐            │   │   │
│  │  │  │     ALB     │    │  CloudFront │            │   │   │
│  │  │  │             │    │   (CDN)     │            │   │   │
│  │  │  └──────┬──────┘    └─────────────┘            │   │   │
│  │  │         │                                       │   │   │
│  │  └─────────┼───────────────────────────────────────┘   │   │
│  │            │                                           │   │
│  │  ┌─────────▼───────────────────────────────────────┐   │   │
│  │  │          Private Subnet (10.0.2.0/24)           │   │   │
│  │  │                                                 │   │   │
│  │  │  ┌─────────────┐  ┌─────────────┐              │   │   │
│  │  │  │  ECS Fargate │  │ ECS Fargate │              │   │   │
│  │  │  │  (API x 3)   │  │  (Worker)   │              │   │   │
│  │  │  └─────────────┘  └─────────────┘              │   │   │
│  │  │                                                 │   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  │                                                         │   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │           Data Subnet (10.0.3.0/24)             │   │   │
│  │  │                                                 │   │   │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌────────┐  │   │   │
│  │  │  │  RDS        │  │ ElastiCache │  │Amazon  │  │   │   │
│  │  │  │ PostgreSQL  │  │   Redis     │  │   MQ   │  │   │   │
│  │  │  │  (Multi-AZ) │  │  (Cluster)  │  │        │  │   │   │
│  │  │  └─────────────┘  └─────────────┘  └────────┘  │   │   │
│  │  │                                                 │   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   Security Services                      │   │
│  │                                                         │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │   │
│  │  │CloudHSM  │  │   WAF    │  │  Shield  │  │Secrets  │ │   │
│  │  │          │  │          │  │          │  │Manager  │ │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Environment Configuration

| Environment | Purpose | Resources |
|-------------|---------|-----------|
| **Development** | Local development | Docker Compose |
| **Staging** | Pre-production testing | AWS (minimal) |
| **Production** | Live system | AWS (full redundancy) |

---

## 5. Monitoring & Observability

### 5.1 Metrics

| Category | Metrics |
|----------|---------|
| **API** | Request count, latency (p50/p95/p99), error rate |
| **Crypto** | Signature verification time, hash computation time |
| **Database** | Query latency, connection pool, disk usage |
| **Queue** | Message rate, queue depth, consumer lag |
| **Blockchain** | Transaction confirmation time, gas usage |

### 5.2 Alerts

| Alert | Condition | Severity |
|-------|-----------|----------|
| API Error Rate | > 1% for 5 min | Critical |
| API Latency | p95 > 2s for 5 min | Warning |
| VRF Timeout | > 5 min | Critical |
| Challenge Filed | Any | Info |
| Prover Offline | > 1 prover for 10 min | Warning |
| Database Connection | Pool exhausted | Critical |

---

## 6. Admin System Architecture

### 6.1 Admin Application Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       QS Foundation Admin Application                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                        Frontend (Next.js)                              │ │
│  │                                                                       │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │ │
│  │  │Dashboard │ │Ecosystem │ │ Treasury │ │Emergency │ │  Audit   │   │ │
│  │  │  Module  │ │  Module  │ │  Module  │ │  Module  │ │  Module  │   │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘   │ │
│  │                                                                       │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │ │
│  │  │Challenge │ │ Support  │ │Governance│ │ Settings │ │Registration│  │ │
│  │  │  Module  │ │  Module  │ │  Module  │ │  Module  │ │  Module  │   │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘   │ │
│  │                                                                       │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                     │                                       │
│                                     ▼                                       │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                        Admin API Layer                                 │ │
│  │                                                                       │ │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐       │ │
│  │  │ Authentication  │  │  Authorization  │  │   Rate Limiting │       │ │
│  │  │   Middleware    │  │   Middleware    │  │    Middleware   │       │ │
│  │  │  (SIWE + 2FA)   │  │  (RBAC Check)   │  │                 │       │ │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘       │ │
│  │                                                                       │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐     │ │
│  │  │/admin/users │ │/admin/      │ │/admin/      │ │/admin/      │     │ │
│  │  │/admin/roles │ │ treasury/*  │ │ emergency/* │ │ audit/*     │     │ │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘     │ │
│  │                                                                       │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                     │                                       │
│                                     ▼                                       │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                        Admin Data Layer                                │ │
│  │                                                                       │ │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐          │ │
│  │  │   PostgreSQL   │  │     Redis      │  │   Blockchain   │          │ │
│  │  │                │  │                │  │                │          │ │
│  │  │ - admin_users  │  │ - Sessions     │  │ - Multisig     │          │ │
│  │  │ - treasury_*   │  │ - Cache        │  │ - Emergency    │          │ │
│  │  │ - audit_logs   │  │ - Rate limits  │  │ - Pause        │          │ │
│  │  │ - support_*    │  │                │  │                │          │ │
│  │  └────────────────┘  └────────────────┘  └────────────────┘          │ │
│  │                                                                       │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Permission System

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Role-Based Access Control (RBAC)                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Level 4: Superadmin (Security Council - 3/5 Multisig)                     │
│  ├── All permissions                                                        │
│  ├── Emergency controls (pause/resume)                                      │
│  ├── Treasury main wallet operations                                        │
│  └── Admin user CRUD                                                        │
│                                                                             │
│  Level 3: Admin (Purpose Committee)                                         │
│  ├── Prover/Observer approval                                               │
│  ├── Challenge intervention                                                 │
│  ├── Operational budget management                                          │
│  └── Support & announcements                                                │
│                                                                             │
│  Level 2: Operator (Operations Team)                                        │
│  ├── Transaction monitoring                                                 │
│  ├── Support ticket handling                                                │
│  ├── Basic statistics view                                                  │
│  └── Incident reporting                                                     │
│                                                                             │
│  Level 1: Viewer (Read-Only)                                                │
│  ├── Dashboard view                                                         │
│  ├── Statistics & reports view                                              │
│  └── Audit logs view                                                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.3 Treasury Wallet Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Treasury Wallet Structure                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                     Main Treasury (3/5 Multisig)                       │ │
│  │                     Security Council Signers                           │ │
│  │                     - Strategic investments                            │ │
│  │                     - Large expenditures (> $500K)                     │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│        │                                                                    │
│        ▼                                                                    │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐              │
│  │  Operational    │ │   Grants Fund   │ │ Insurance Pool  │              │
│  │  Budget (4/7)   │ │     (5/9)       │ │     (9/12)      │              │
│  │                 │ │                 │ │                 │              │
│  │ - Salaries      │ │ - Dev grants    │ │ - Slash claims  │              │
│  │ - Infrastructure│ │ - Ecosystem     │ │ - User protect  │              │
│  │ - Operations    │ │ - Partnerships  │ │                 │              │
│  │ $500K/month cap │ │ $200K/month cap │ │ $100K/month cap │              │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘              │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                  Emergency Reserve (9/12 Multisig)                     │ │
│  │                  Security Council + External Signers                   │ │
│  │                  - Crisis management only                              │ │
│  │                  - Requires incident documentation                     │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  Revenue Flows:                                                             │
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐                │
│  │Protocol Fees│ ──▶  │Main Treasury│      │             │                │
│  └─────────────┘      └─────────────┘      │             │                │
│  ┌─────────────┐                           │  Insurance  │                │
│  │Slash (20%)  │ ────────────────────────▶ │    Pool     │                │
│  └─────────────┘                           │             │                │
│                                            └─────────────┘                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.4 Admin Audit Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Audit Logging Architecture                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Admin Action                                                               │
│       │                                                                     │
│       ▼                                                                     │
│  ┌─────────────────┐                                                       │
│  │   API Request   │                                                       │
│  │   + Context     │ ──┐                                                   │
│  └─────────────────┘   │                                                   │
│                        │                                                    │
│                        ▼                                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     Audit Middleware                                 │   │
│  │                                                                     │   │
│  │  Captures:                                                          │   │
│  │  - admin_id                                                         │   │
│  │  - action (create/update/delete/view)                               │   │
│  │  - resource_type (user/prover/challenge/treasury/...)               │   │
│  │  - resource_id                                                      │   │
│  │  - old_values (for updates)                                         │   │
│  │  - new_values (for creates/updates)                                 │   │
│  │  - ip_address                                                       │   │
│  │  - user_agent                                                       │   │
│  │  - timestamp                                                        │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                        │                                                    │
│                        ▼                                                    │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐            │
│  │   PostgreSQL    │  │   CloudWatch    │  │    S3 Archive   │            │
│  │  (Hot Storage)  │  │   (Realtime)    │  │  (Cold Storage) │            │
│  │   30 days       │  │   Alerts        │  │   7 years       │            │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘            │
│                                                                             │
│  Compliance Requirements:                                                   │
│  - Immutable logs (append-only)                                            │
│  - 7-year retention                                                        │
│  - Export capability (CSV, JSON)                                           │
│  - Search & filter by any field                                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.5 Emergency Control Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Emergency Pause/Resume Flow                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Trigger: Critical incident detected                                        │
│       │                                                                     │
│       ▼                                                                     │
│  ┌─────────────────┐                                                       │
│  │  Superadmin     │                                                       │
│  │  Initiates      │                                                       │
│  │  Pause Request  │                                                       │
│  └─────────────────┘                                                       │
│       │                                                                     │
│       ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                  Gnosis Safe (3/5 Multisig)                          │   │
│  │                                                                     │   │
│  │  Security Council Members:                                          │   │
│  │  [✓] Signer 1   [✓] Signer 2   [✓] Signer 3   [ ] Signer 4   [ ]   │   │
│  │                                                                     │   │
│  │  Status: 3/5 signatures collected ✓                                 │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│       │                                                                     │
│       ▼                                                                     │
│  ┌─────────────────┐                                                       │
│  │  Execute Pause  │                                                       │
│  │  Transaction    │                                                       │
│  └─────────────────┘                                                       │
│       │                                                                     │
│       ├─────────────────────────────────────────────────────────────────┐   │
│       ▼                                                                 ▼   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐            │
│  │  L1 Contracts   │  │   API Services  │  │  L3 Network     │            │
│  │  PAUSED         │  │  PAUSED         │  │  PAUSED         │            │
│  │  - No new locks │  │  - Read-only    │  │  - No consensus │            │
│  │  - No unlocks   │  │  - No writes    │  │  - No signatures│            │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘            │
│                                                                             │
│  Resume: Same multisig process (3/5 signatures required)                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-27 | System | Initial creation |
| 1.1 | 2026-01-27 | System | Added Admin System Architecture (Section 6) |
