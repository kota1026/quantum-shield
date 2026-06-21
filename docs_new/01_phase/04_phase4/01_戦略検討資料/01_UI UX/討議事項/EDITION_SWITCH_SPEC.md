# Quantum Shield - エディション切替詳細設計 v1.0

> **作成日**: 2026-01-04
> **目的**: Enterprise/Decentralized切替、4BFT→N-BFT移行の詳細設計
> **レビュー**: CIA (Chief Integration Architect) 確認必須

---

## 目次

1. [概要](#1-概要)
2. [ガバナンスモード階層](#2-ガバナンスモード階層)
3. [エディション定義](#3-エディション定義)
4. [ノード構成切替](#4-ノード構成切替)
5. [Prover承認モード切替](#5-prover承認モード切替)
6. [切替シナリオ](#6-切替シナリオ)
7. [状態遷移図](#7-状態遷移図)
8. [実装詳細](#8-実装詳細)
9. [リスク分析](#9-リスク分析)
10. [🔴 CIA指摘事項と解決策](#10-cia指摘事項と解決策)

---

## 1. 概要

### 1.1 二重の切替概念

Quantum Shieldには**2つの切替概念**が存在する：

```
┌─────────────────────────────────────────────────────────────┐
│                    切替概念の二重構造                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. ガバナンスモード（GovernanceSwitch.sol）                 │
│     └── TRAINING → CENTRALIZED → MULTISIG → DECENTRALIZED   │
│                                                             │
│  2. エディション（製品形態）                                  │
│     └── Enterprise Edition vs Decentralized Edition         │
│                                                             │
│  ※ ガバナンスモードとエディションは独立した概念               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 既存実装の確認

`GovernanceSwitch.sol` (32KB) で以下が実装済み：

```solidity
enum GovernanceMode {
    TRAINING,       // 初期テストモード
    CENTRALIZED,    // 単一管理者
    MULTISIG,       // マルチシグ (n-of-m)
    DECENTRALIZED   // Token投票 + Security Council
}
```

### 1.3 🔴 問題点

**現在の設計の問題**:
1. ガバナンスモードとエディションが混同されている
2. ノード構成（4BFT vs N-BFT）の切替が未設計
3. Prover承認方式の切替が未設計

---

## 2. ガバナンスモード階層

### 2.1 モード定義

| モード | 説明 | 主な用途 |
|--------|------|----------|
| **TRAINING** | テスト・開発用 | Phase 0 |
| **CENTRALIZED** | 単一管理者 | Enterprise初期 |
| **MULTISIG** | マルチシグ管理 | Enterprise運用 |
| **DECENTRALIZED** | Token投票 | 完全分散化 |

### 2.2 モード別権限

| 操作 | TRAINING | CENTRALIZED | MULTISIG | DECENTRALIZED |
|------|:--------:|:-----------:|:--------:|:-------------:|
| パラメータ変更 | Admin | Admin | n/m署名 | Token Vote |
| 緊急停止 | Admin | Admin | n/m署名 | SC 5/9 |
| アップグレード | Admin | Admin | n/m + 7日 | Vote + SC + 7日 |
| Prover承認 | Admin | Admin | n/m署名 | Council/自動 |

### 2.3 遷移規則

```
TRAINING ─────► CENTRALIZED ─────► MULTISIG ─────► DECENTRALIZED
    │                │                  │                  │
    │                │                  │                  │
    └── 3日TimeLock ─┴── 即時 ─────────┴── 7日TimeLock ───┘
    
逆方向（ダウングレード）:
DECENTRALIZED ─► MULTISIG ─► CENTRALIZED
       │              │             │
       │              │             │
       └─ 30日 + 7/9 ─┴── 30日 ────┘
```

---

## 3. エディション定義

### 3.1 新規概念: EditionConfig

**GovernanceSwitchとは別に、エディション設定を管理**

```solidity
// 新規: EditionConfig.sol
contract EditionConfig {
    enum Edition {
        ENTERPRISE,     // Enterprise Edition
        DECENTRALIZED   // Decentralized Edition
    }
    
    struct EditionSettings {
        Edition edition;
        NodeConfig nodeConfig;
        ProverApprovalMode proverApprovalMode;
        bool governanceEnabled;
    }
    
    struct NodeConfig {
        uint8 minNodes;           // 最小ノード数
        uint8 maxNodes;           // 最大ノード数
        bool dynamicMembership;   // 動的ノード追加可否
        ConsensusType consensus;  // BFT種別
    }
    
    enum ConsensusType {
        FIXED_4BFT,       // 固定4ノードBFT
        DYNAMIC_PBFT,     // 動的PBFTノード
        DAG_CONSENSUS     // 将来: DAG型
    }
    
    enum ProverApprovalMode {
        CONTRACT_BASED,   // 契約ベース（Enterprise）
        FOUNDATION_INVITE,// 財団招待（Phase 1-2）
        COUNCIL_VOTE,     // Council投票（Phase 3）
        STAKE_AUTO        // Stakeベース自動承認（Phase 4+）
    }
}
```

### 3.2 エディション比較表

| 項目 | Enterprise Edition | Decentralized Edition |
|------|-------------------|----------------------|
| **ターゲット** | 金融機関、銀行 | DeFi、ブリッジ |
| **ノード構成** | 固定4ノード（全Phase） | 4ノード → Nノード |
| **コンセンサス** | FIXED_4BFT | FIXED_4BFT → DYNAMIC_PBFT |
| **Prover承認** | CONTRACT_BASED | Phase別移行 |
| **ガバナンス** | CENTRALIZED/MULTISIG | DECENTRALIZED |
| **SLA** | あり | なし |
| **サポート** | 専用 | コミュニティ |

### 3.3 Phase別エディション設定

#### Enterprise Edition (全Phase共通)

```javascript
const ENTERPRISE_CONFIG = {
  edition: "ENTERPRISE",
  nodeConfig: {
    minNodes: 4,
    maxNodes: 4,
    dynamicMembership: false,
    consensus: "FIXED_4BFT"
  },
  proverApprovalMode: "CONTRACT_BASED",
  governanceEnabled: false,  // または限定的
  governanceMode: "MULTISIG" // 最大でもMULTISIG
};
```

#### Decentralized Edition (Phase別)

```javascript
// Phase 1-2
const DECEN_PHASE_1_2 = {
  edition: "DECENTRALIZED",
  nodeConfig: {
    minNodes: 4,
    maxNodes: 4,
    dynamicMembership: false,
    consensus: "FIXED_4BFT"
  },
  proverApprovalMode: "FOUNDATION_INVITE",
  governanceEnabled: true,
  governanceMode: "MULTISIG"
};

// Phase 3
const DECEN_PHASE_3 = {
  edition: "DECENTRALIZED",
  nodeConfig: {
    minNodes: 4,
    maxNodes: 4,
    dynamicMembership: false,
    consensus: "FIXED_4BFT"
  },
  proverApprovalMode: "COUNCIL_VOTE",
  governanceEnabled: true,
  governanceMode: "DECENTRALIZED"
};

// Phase 4+
const DECEN_PHASE_4 = {
  edition: "DECENTRALIZED",
  nodeConfig: {
    minNodes: 4,
    maxNodes: 21,  // 拡張可能
    dynamicMembership: true,
    consensus: "DYNAMIC_PBFT"
  },
  proverApprovalMode: "STAKE_AUTO",
  governanceEnabled: true,
  governanceMode: "DECENTRALIZED"
};
```

---

## 4. ノード構成切替

### 4.1 🔴 現状の問題

**CIA指摘**: 4BFT→N-BFT切替の設計がない

現在の`aegis-consensus`は4ノード固定で設計されており、動的ノード追加の仕組みがない。

### 4.2 解決策: NodeManager導入

```rust
// 新規: NodeManager (Rust)
pub struct NodeManager {
    config: NodeConfig,
    active_nodes: Vec<NodeInfo>,
    pending_additions: Vec<NodeInfo>,
    pending_removals: Vec<NodeId>,
}

impl NodeManager {
    /// ノード追加（Phase 4+のみ）
    pub async fn add_node(&mut self, node: NodeInfo) -> Result<()> {
        if !self.config.dynamic_membership {
            return Err(Error::DynamicMembershipDisabled);
        }
        if self.active_nodes.len() >= self.config.max_nodes as usize {
            return Err(Error::MaxNodesReached);
        }
        // Council承認チェック
        self.pending_additions.push(node);
        Ok(())
    }
    
    /// ノード削除
    pub async fn remove_node(&mut self, node_id: NodeId) -> Result<()> {
        if self.active_nodes.len() <= self.config.min_nodes as usize {
            return Err(Error::MinNodesRequired);
        }
        self.pending_removals.push(node_id);
        Ok(())
    }
    
    /// BFT閾値の動的計算
    pub fn calculate_bft_threshold(&self) -> usize {
        let n = self.active_nodes.len();
        // BFT: f < n/3 なので、必要な正直ノード数 = 2f + 1
        (2 * n / 3) + 1
    }
}
```

### 4.3 コンセンサス切替

#### FIXED_4BFT (現行)

```
4ノード固定
├── 閾値: 3/4 (f=1)
├── ブロック生成: ラウンドロビン
└── メンバーシップ: 静的
```

#### DYNAMIC_PBFT (Phase 4+)

```
4-21ノード動的
├── 閾値: 2n/3 + 1 (動的計算)
├── ブロック生成: Stake加重ラウンドロビン
├── メンバーシップ: 動的
│   ├── 追加: Council承認 or Stake条件
│   └── 削除: Council決定 or 自動退出
└── リーダー選出: VRF + Stake加重
```

### 4.4 切替シーケンス

```
Phase 3 → Phase 4 切替時:

1. Council提案: DYNAMIC_PBFT移行
2. Token投票: 8% Quorum + 過半数
3. 7日 TimeLock
4. SC Veto機会 (6/9)
5. 実行:
   a. NodeManager設定更新
   b. コンセンサスパラメータ更新
   c. 新ノード受付開始
```

---

## 5. Prover承認モード切替

### 5.1 承認モード定義

| モード | 説明 | 対象 |
|--------|------|------|
| **CONTRACT_BASED** | 法的契約 + 手動承認 | Enterprise |
| **FOUNDATION_INVITE** | 財団からの招待 | Decen Phase 1-2 |
| **COUNCIL_VOTE** | Council 3/9投票 | Decen Phase 3 |
| **STAKE_AUTO** | Stake条件で自動承認 | Decen Phase 4+ |

### 5.2 各モードの詳細

#### CONTRACT_BASED (Enterprise)

```solidity
function approveProver(
    address prover,
    bytes calldata legalContractHash,
    bytes calldata adminSignature
) external onlyAdmin {
    require(verifyContract(legalContractHash), "Invalid contract");
    require(verifyAdminSignature(adminSignature), "Invalid signature");
    
    _provers[prover].status = ProverStatus.Active;
    emit ProverApproved(prover, ApprovalMode.CONTRACT_BASED);
}
```

#### FOUNDATION_INVITE (Phase 1-2)

```solidity
function inviteProver(
    address prover,
    bytes calldata inviteCode
) external onlyFoundation {
    require(verifyInviteCode(inviteCode), "Invalid invite");
    require(_provers[prover].stake >= MIN_STAKE, "Insufficient stake");
    
    _provers[prover].status = ProverStatus.Active;
    emit ProverApproved(prover, ApprovalMode.FOUNDATION_INVITE);
}
```

#### COUNCIL_VOTE (Phase 3)

```solidity
function voteForProver(
    address prover
) external onlyCouncilMember {
    require(_pendingProvers[prover].stake >= MIN_STAKE, "Insufficient stake");
    
    _proverVotes[prover][msg.sender] = true;
    _proverVoteCount[prover]++;
    
    // 3/9 以上の投票で承認
    if (_proverVoteCount[prover] >= 3) {
        _provers[prover].status = ProverStatus.Active;
        emit ProverApproved(prover, ApprovalMode.COUNCIL_VOTE);
    }
}
```

#### STAKE_AUTO (Phase 4+)

```solidity
function registerProver(
    bytes calldata sphincsPubkey,
    bytes calldata hsmAttestation
) external payable {
    require(msg.value >= MIN_STAKE, "Insufficient stake");
    require(verifyHSMAttestation(hsmAttestation), "Invalid HSM");
    require(verifySphincsKey(sphincsPubkey), "Invalid key");
    
    // 条件を満たせば自動承認
    _provers[msg.sender] = Prover({
        pubkey: sphincsPubkey,
        stake: msg.value,
        status: ProverStatus.Active,
        registeredAt: block.timestamp
    });
    
    emit ProverApproved(msg.sender, ApprovalMode.STAKE_AUTO);
}
```

### 5.3 モード切替フロー

```
Enterprise (CONTRACT_BASED) は固定

Decentralized:
Phase 1-2: FOUNDATION_INVITE
    │
    ▼ (Council設立)
Phase 3: COUNCIL_VOTE
    │
    ▼ (完全分散化提案 + 投票)
Phase 4+: STAKE_AUTO
```

---

## 6. 切替シナリオ

### 6.1 シナリオ1: Enterprise → Decentralized

**ユースケース**: Enterprise顧客が分散化を希望

```
現状: Enterprise Edition + MULTISIG

ステップ1: 提案作成
├── エディション: ENTERPRISE → DECENTRALIZED
├── ガバナンス: MULTISIG → DECENTRALIZED
└── Bond: 1 ETH

ステップ2: n/m マルチシグ承認

ステップ3: 7日 TimeLock

ステップ4: 実行
├── EditionConfig更新
├── GovernanceSwitch更新
├── Security Council設立
└── Token配布準備

所要時間: 最短14日
```

### 6.2 シナリオ2: Decentralized Phase 3 → Phase 4

**ユースケース**: 完全分散化への移行

```
現状: Decentralized Edition + Phase 3 (4BFT + COUNCIL_VOTE)

ステップ1: 提案作成
├── ノード構成: FIXED_4BFT → DYNAMIC_PBFT
├── Prover承認: COUNCIL_VOTE → STAKE_AUTO
├── 最大ノード数: 4 → 21
└── Bond: 1 ETH

ステップ2: Token投票
├── 期間: 7日
├── Quorum: 8%
└── 必要: 過半数

ステップ3: 7日 TimeLock

ステップ4: SC Veto機会 (6/9)

ステップ5: 実行
├── NodeManager.config更新
├── ProverRegistry.approvalMode更新
└── 新ノード/Prover受付開始

所要時間: 最短21日
```

### 6.3 シナリオ3: Emergency Rollback

**ユースケース**: 重大バグ発見時の緊急ダウングレード

```
現状: Decentralized Edition + DECENTRALIZED mode

ステップ1: SC緊急提案
├── 理由: 重大バグ
├── ターゲット: MULTISIG mode
└── 7/9 署名必要

ステップ2: 署名収集
├── 24時間以内に7/9
└── 自動リマインダー

ステップ3: 24時間 TimeLock

ステップ4: 実行
├── GovernanceSwitch.executeEmergencyRollback()
└── 通知: 全ユーザー

所要時間: 最短48時間
```

---

## 7. 状態遷移図

### 7.1 ガバナンスモード遷移

```
┌──────────┐      3日      ┌───────────────┐     即時     ┌──────────┐
│ TRAINING │─────────────►│ CENTRALIZED   │────────────►│ MULTISIG │
└──────────┘              └───────────────┘             └─────┬────┘
                                                              │
                                                         7日TimeLock
                                                              │
                                                              ▼
                          ┌───────────────┐             ┌───────────────┐
                          │ (rollback)    │◄────────────│ DECENTRALIZED │
                          │ 30日 + 7/9    │             └───────────────┘
                          └───────────────┘
```

### 7.2 エディション遷移

```
┌─────────────────────────────────────────────────────────────────────┐
│                       Enterprise Edition                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐           │
│  │ CENTRALIZED  │───►│  MULTISIG    │    │ (DECEN不可)  │           │
│  └──────────────┘    └──────────────┘    └──────────────┘           │
│                                                                      │
│  NodeConfig: 固定4BFT                                                │
│  ProverApproval: CONTRACT_BASED                                      │
└─────────────────────────────────────────────────────────────────────┘

         │
         │ エディション切替（14日+）
         ▼

┌─────────────────────────────────────────────────────────────────────┐
│                     Decentralized Edition                            │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐           │
│  │  Phase 1-2   │───►│   Phase 3    │───►│   Phase 4+   │           │
│  │  MULTISIG    │    │ DECENTRALIZED│    │ DECENTRALIZED│           │
│  │  4BFT        │    │  4BFT        │    │  N-BFT       │           │
│  │  INVITE      │    │  COUNCIL     │    │  STAKE_AUTO  │           │
│  └──────────────┘    └──────────────┘    └──────────────┘           │
└─────────────────────────────────────────────────────────────────────┘
```

### 7.3 ノード構成遷移

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FIXED_4BFT                                   │
│                                                                      │
│   ┌───┐     ┌───┐     ┌───┐     ┌───┐                              │
│   │ 1 │◄───►│ 2 │◄───►│ 3 │◄───►│ 4 │                              │
│   └───┘     └───┘     └───┘     └───┘                              │
│                                                                      │
│   閾値: 3/4 (固定)                                                   │
│   メンバーシップ: 静的                                               │
└─────────────────────────────────────────────────────────────────────┘

         │
         │ Phase 4 移行（21日+）
         ▼

┌─────────────────────────────────────────────────────────────────────┐
│                        DYNAMIC_PBFT                                  │
│                                                                      │
│   ┌───┐   ┌───┐   ┌───┐   ┌───┐   ┌───┐   ┌───┐   ...   ┌───┐    │
│   │ 1 │◄─►│ 2 │◄─►│ 3 │◄─►│ 4 │◄─►│ 5 │◄─►│ 6 │   ...   │21 │    │
│   └───┘   └───┘   └───┘   └───┘   └───┘   └───┘         └───┘    │
│                                                                      │
│   閾値: 2n/3 + 1 (動的)                                              │
│   メンバーシップ: 動的（Stake条件）                                   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 8. 実装詳細

### 8.1 新規コントラクト

#### EditionConfig.sol

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IGovernanceSwitch} from "./interfaces/IGovernanceSwitch.sol";

/// @title EditionConfig
/// @notice エディション設定管理（Enterprise/Decentralized）
contract EditionConfig {
    
    // ============ Enums ============
    
    enum Edition { ENTERPRISE, DECENTRALIZED }
    enum ConsensusType { FIXED_4BFT, DYNAMIC_PBFT }
    enum ProverApprovalMode { CONTRACT_BASED, FOUNDATION_INVITE, COUNCIL_VOTE, STAKE_AUTO }
    
    // ============ Structs ============
    
    struct NodeConfig {
        uint8 minNodes;
        uint8 maxNodes;
        bool dynamicMembership;
        ConsensusType consensus;
    }
    
    struct Settings {
        Edition edition;
        NodeConfig nodeConfig;
        ProverApprovalMode proverApprovalMode;
        bool governanceEnabled;
    }
    
    // ============ State ============
    
    Settings public settings;
    IGovernanceSwitch public governanceSwitch;
    
    // ============ Events ============
    
    event EditionChanged(Edition oldEdition, Edition newEdition);
    event NodeConfigChanged(NodeConfig oldConfig, NodeConfig newConfig);
    event ProverApprovalModeChanged(ProverApprovalMode oldMode, ProverApprovalMode newMode);
    
    // ============ Constructor ============
    
    constructor(address _governanceSwitch, Edition _initialEdition) {
        governanceSwitch = IGovernanceSwitch(_governanceSwitch);
        
        if (_initialEdition == Edition.ENTERPRISE) {
            settings = Settings({
                edition: Edition.ENTERPRISE,
                nodeConfig: NodeConfig({
                    minNodes: 4,
                    maxNodes: 4,
                    dynamicMembership: false,
                    consensus: ConsensusType.FIXED_4BFT
                }),
                proverApprovalMode: ProverApprovalMode.CONTRACT_BASED,
                governanceEnabled: false
            });
        } else {
            settings = Settings({
                edition: Edition.DECENTRALIZED,
                nodeConfig: NodeConfig({
                    minNodes: 4,
                    maxNodes: 4,
                    dynamicMembership: false,
                    consensus: ConsensusType.FIXED_4BFT
                }),
                proverApprovalMode: ProverApprovalMode.FOUNDATION_INVITE,
                governanceEnabled: true
            });
        }
    }
    
    // ============ Modifiers ============
    
    modifier onlyGovernance() {
        require(
            governanceSwitch.canApprove(msg.sig, msg.sender),
            "Unauthorized"
        );
        _;
    }
    
    // ============ Functions ============
    
    /// @notice ノード構成を更新（Phase 4移行時）
    function updateNodeConfig(NodeConfig calldata newConfig) external onlyGovernance {
        // Enterprise は動的メンバーシップ不可
        if (settings.edition == Edition.ENTERPRISE) {
            require(!newConfig.dynamicMembership, "Enterprise: dynamic membership not allowed");
            require(newConfig.maxNodes == 4, "Enterprise: max nodes must be 4");
        }
        
        NodeConfig memory oldConfig = settings.nodeConfig;
        settings.nodeConfig = newConfig;
        
        emit NodeConfigChanged(oldConfig, newConfig);
    }
    
    /// @notice Prover承認モードを更新
    function updateProverApprovalMode(ProverApprovalMode newMode) external onlyGovernance {
        // Enterprise は CONTRACT_BASED のみ
        if (settings.edition == Edition.ENTERPRISE) {
            require(newMode == ProverApprovalMode.CONTRACT_BASED, "Enterprise: contract-based only");
        }
        
        ProverApprovalMode oldMode = settings.proverApprovalMode;
        settings.proverApprovalMode = newMode;
        
        emit ProverApprovalModeChanged(oldMode, newMode);
    }
    
    /// @notice エディション切替
    function switchEdition(Edition newEdition) external onlyGovernance {
        require(settings.edition != newEdition, "Same edition");
        
        Edition oldEdition = settings.edition;
        settings.edition = newEdition;
        
        // Decentralized移行時はガバナンス有効化
        if (newEdition == Edition.DECENTRALIZED) {
            settings.governanceEnabled = true;
        }
        
        emit EditionChanged(oldEdition, newEdition);
    }
    
    // ============ View Functions ============
    
    function isEnterprise() external view returns (bool) {
        return settings.edition == Edition.ENTERPRISE;
    }
    
    function isDynamicMembershipEnabled() external view returns (bool) {
        return settings.nodeConfig.dynamicMembership;
    }
    
    function getProverApprovalMode() external view returns (ProverApprovalMode) {
        return settings.proverApprovalMode;
    }
}
```

### 8.2 NodeManager 更新

```rust
// l3-aegis/crates/aegis-consensus/src/node_manager.rs

use crate::config::NodeConfig;
use crate::types::{NodeId, NodeInfo};

pub struct NodeManager {
    config: NodeConfig,
    active_nodes: Vec<NodeInfo>,
    pending_additions: Vec<NodeAdditionRequest>,
    pending_removals: Vec<NodeRemovalRequest>,
}

pub struct NodeAdditionRequest {
    node: NodeInfo,
    proposer: Address,
    votes: HashSet<Address>,
    created_at: u64,
}

impl NodeManager {
    pub fn new(config: NodeConfig) -> Self {
        Self {
            config,
            active_nodes: Vec::new(),
            pending_additions: Vec::new(),
            pending_removals: Vec::new(),
        }
    }
    
    /// ノード追加提案（DYNAMIC_PBFT時のみ）
    pub fn propose_node_addition(&mut self, node: NodeInfo, proposer: Address) -> Result<RequestId> {
        if !self.config.dynamic_membership {
            return Err(Error::DynamicMembershipDisabled);
        }
        
        if self.active_nodes.len() >= self.config.max_nodes as usize {
            return Err(Error::MaxNodesReached);
        }
        
        // Stake条件確認
        if node.stake < self.config.min_node_stake {
            return Err(Error::InsufficientStake);
        }
        
        let request = NodeAdditionRequest {
            node,
            proposer,
            votes: HashSet::from([proposer]),
            created_at: current_timestamp(),
        };
        
        let request_id = generate_request_id(&request);
        self.pending_additions.push(request);
        
        Ok(request_id)
    }
    
    /// 投票
    pub fn vote_for_addition(&mut self, request_id: RequestId, voter: Address) -> Result<bool> {
        let request = self.pending_additions
            .iter_mut()
            .find(|r| r.id == request_id)
            .ok_or(Error::RequestNotFound)?;
        
        request.votes.insert(voter);
        
        // 閾値チェック（Council 3/9 または自動承認条件）
        let approved = self.check_approval_threshold(&request);
        
        if approved {
            self.finalize_addition(request_id)?;
        }
        
        Ok(approved)
    }
    
    /// BFT閾値計算
    pub fn bft_threshold(&self) -> usize {
        let n = self.active_nodes.len();
        // f < n/3 なので、必要ノード数 = 2f + 1 = 2(n-1)/3 + 1
        (2 * n + 2) / 3
    }
    
    /// リーダー選出（Stake加重）
    pub fn select_leader(&self, round: u64, vrf_seed: [u8; 32]) -> NodeId {
        let total_stake: u128 = self.active_nodes.iter().map(|n| n.stake).sum();
        let random = vrf_random(vrf_seed, round);
        let threshold = (random as u128 * total_stake) / u64::MAX as u128;
        
        let mut cumulative = 0u128;
        for node in &self.active_nodes {
            cumulative += node.stake;
            if cumulative >= threshold {
                return node.id;
            }
        }
        
        self.active_nodes.last().unwrap().id
    }
}
```

---

## 9. リスク分析

### 9.1 リスクマトリックス

| リスク | 影響度 | 発生確率 | 緩和策 |
|--------|:------:|:--------:|--------|
| 切替中のサービス中断 | 高 | 中 | TimeLock + 段階的移行 |
| 設定ミス | 高 | 低 | マルチシグ必須 |
| ノード追加時の攻撃 | 中 | 低 | Stake要件 + 遅延 |
| Rollback失敗 | 高 | 低 | 7/9閾値 + TimeLock |

### 9.2 緩和策詳細

1. **段階的移行**: 一度に全設定を変更せず、ノード構成→Prover承認→ガバナンスの順で移行
2. **監視強化**: 切替後48時間は監視を強化
3. **Rollback準備**: 常にRollbackプランを用意

---

## 10. 🔴 CIA指摘事項と解決策

### 10.1 指摘1: ガバナンスモードとエディションの混同

**問題**: 現在の設計では`GovernanceSwitch.sol`がガバナンスモードを管理しているが、エディション（Enterprise/Decentralized）の概念と混同されている。

**解決策**: 
- `EditionConfig.sol`を新規作成し、エディション設定を分離
- `GovernanceSwitch.sol`はガバナンスモードのみを管理
- 両者は独立して動作し、組み合わせで最終設定を決定

### 10.2 指摘2: 4BFT→N-BFT切替の未設計

**問題**: `aegis-consensus`は4ノード固定で、動的ノード追加がない。

**解決策**:
- `NodeManager`を導入し、動的メンバーシップを実装
- `NodeConfig`で`dynamicMembership`フラグを追加
- Phase 4移行時にのみ有効化

### 10.3 指摘3: Prover承認モードの詳細不足

**問題**: シーケンス#5のProver登録で、モード別承認フローが不明確。

**解決策**:
- `ProverApprovalMode` enumを導入
- 各モードの承認ロジックを実装
- `EditionConfig`と連動して適切なモードを適用

### 10.4 指摘4: 切替時のトランザクション処理

**問題**: 切替中の進行中トランザクション（Lock/Unlock）の扱いが不明。

**解決策**:
- **切替前**: 新規Lock/Unlockを一時停止（Grace Period: 24h）
- **切替中**: 進行中のUnlockは継続
- **切替後**: 新設定で新規トランザクション受付再開

```
切替タイムライン:
T-24h: Grace Period開始、新規Lock停止
T-0:   切替実行
T+1h:  健全性チェック
T+2h:  新規Lock受付再開
```

---

**END OF DOCUMENT**

---

## 変更履歴

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-04 | 初版作成、CIA指摘対応追加 |
