# Modular Architecture Specification

> **Version**: 1.0.0
> **Status**: Draft
> **Approved**: Phase 3 Strategy Meeting (2025-12-28)

---

## 1. 概要

### 1.1 目的

Quantum ShieldのModular Architectureは、以下の要件を満たすために設計されています：

1. **CP保護の確実性**: Core Principlesを変更不可能な形で保護
2. **柔軟性**: 運用形態に応じたGovernance/Token機能の切替
3. **譲渡対応**: 第三者への技術譲渡時の設定自由度確保

### 1.2 設計原則

| 原則 | 説明 |
|------|------|
| **Layer分離** | 各Layerは独立して動作可能 |
| **Core優先** | Core Layerは常時ON、変更不可 |
| **Pluggable** | Governance/TokenはON/OFF切替可能 |
| **CP保護** | どのモードでもCP-1〜5は保護される |

---

## 2. アーキテクチャ構成

### 2.1 Layer構成図

```
┌─────────────────────────────────────────────────────────────────┐
│                      Application Layer                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   User UI   │  │  Admin UI   │  │    API      │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│              Pluggable Governance Layer [SWITCH: ON/OFF]        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  GovernanceSwitch.sol                                    │   │
│  │  ├── CENTRALIZED: 単一管理者アドレス                     │   │
│  │  ├── MULTISIG: N/Mマルチシグ                            │   │
│  │  └── DECENTRALIZED: Security Council + DAO              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  Security   │  │    DAO      │  │   Voting    │             │
│  │  Council    │  │  Governor   │  │   System    │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                Pluggable Token Layer [SWITCH: ON/OFF]           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  TokenSwitch.sol                                         │   │
│  │  ├── DISABLED: トークンなし（ETH/USDC手数料）           │   │
│  │  ├── BASIC: QSトークン基本機能                          │   │
│  │  └── FULL: veQS + Staking + Rewards                     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  QS Token   │  │   veQS      │  │  Staking    │             │
│  │  (ERC-20)   │  │  Locking    │  │  Rewards    │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                   Core Layer [ALWAYS ON]                        │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  ConstitutionLock.sol                                    │   │
│  │  ├── CP-1: Quantum Resistance (IMMUTABLE)               │   │
│  │  ├── CP-2: Self-Custody (IMMUTABLE)                     │   │
│  │  ├── CP-3: Time Lock (SUPERMAJORITY)                    │   │
│  │  ├── CP-4: Slashing (SUPERMAJORITY)                     │   │
│  │  └── CP-5: Transparency (SUPERMAJORITY)                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  L3 Bridge  │  │  Sequencer  │  │    STARK    │             │
│  │  (QR-safe)  │  │   Manager   │  │  Verifier   │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐                              │
│  │    State    │  │  SHA3-256   │                              │
│  │   Manager   │  │   Hasher    │                              │
│  └─────────────┘  └─────────────┘                              │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Layer間依存関係

```
Application Layer
       │
       ▼
Governance Layer ←──────┐
       │                │
       ▼                │
Token Layer ←───────────┤
       │                │
       ▼                │
Core Layer ─────────────┘
       │
       ▼
  Ethereum L1
```

**依存ルール:**
- 上位Layerは下位Layerに依存可能
- 下位Layerは上位Layerに依存不可
- Core LayerはPluggable Layerに依存しない

---

## 3. インターフェース仕様

### 3.1 IGovernanceSwitch

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IGovernanceSwitch {
    // ============ Enums ============
    
    enum GovernanceMode {
        CENTRALIZED,    // 単一管理者
        MULTISIG,       // N/Mマルチシグ
        DECENTRALIZED   // Security Council + DAO
    }
    
    // ============ Events ============
    
    event GovernanceModeChanged(
        GovernanceMode indexed oldMode,
        GovernanceMode indexed newMode,
        address indexed changedBy
    );
    
    // ============ View Functions ============
    
    /// @notice 現在のガバナンスモードを取得
    function getGovernanceMode() external view returns (GovernanceMode);
    
    /// @notice 指定アクションの承認者を取得
    function getApprover(bytes4 action) external view returns (address);
    
    /// @notice アクションが承認可能か確認
    function canApprove(bytes4 action, address caller) external view returns (bool);
    
    // ============ State-Changing Functions ============
    
    /// @notice ガバナンスモードを変更（権限チェックあり）
    /// @dev CENTRALIZED: 管理者のみ
    /// @dev MULTISIG: 必要署名数
    /// @dev DECENTRALIZED: Security Council承認必要
    function setGovernanceMode(GovernanceMode newMode) external;
    
    /// @notice アクションを承認
    function approveAction(bytes4 action, bytes calldata data) external;
}
```

### 3.2 ITokenSwitch

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface ITokenSwitch {
    // ============ Enums ============
    
    enum TokenMode {
        DISABLED,   // トークンなし
        BASIC,      // 基本トークン機能
        FULL        // veQS + Staking + Rewards
    }
    
    // ============ Events ============
    
    event TokenModeChanged(
        TokenMode indexed oldMode,
        TokenMode indexed newMode,
        address indexed changedBy
    );
    
    // ============ View Functions ============
    
    /// @notice 現在のトークンモードを取得
    function getTokenMode() external view returns (TokenMode);
    
    /// @notice トークンアドレスを取得（DISABLED時は address(0)）
    function getTokenAddress() external view returns (address);
    
    /// @notice 手数料トークンを取得
    function getFeeToken() external view returns (address);
    
    // ============ State-Changing Functions ============
    
    /// @notice トークンモードを変更
    /// @dev Governance Layerの承認が必要
    function setTokenMode(TokenMode newMode) external;
}
```

### 3.3 ICoreLayer

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface ICoreLayer {
    // ============ Core Functions ============
    
    /// @notice ブリッジ操作（Core機能）
    function bridgeAsset(
        address token,
        uint256 amount,
        bytes32 recipient
    ) external returns (bytes32 txHash);
    
    /// @notice 状態検証（Core機能）
    function verifyState(
        bytes32 stateRoot,
        bytes calldata proof
    ) external view returns (bool);
    
    // ============ CP Protection ============
    
    /// @notice CP準拠確認
    function verifyCPCompliance() external view returns (bool);
    
    /// @notice CP保護レベル取得
    function getCPProtectionLevel(uint8 cpNumber) external view returns (string memory);
}
```

### 3.4 IConstitutionLock

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IConstitutionLock {
    // ============ Enums ============
    
    enum ProtectionLevel {
        IMMUTABLE,      // 変更不可
        SUPERMAJORITY   // 超多数決で変更可能
    }
    
    // ============ View Functions ============
    
    /// @notice CP保護レベルを取得
    function getProtectionLevel(uint8 cpNumber) external view returns (ProtectionLevel);
    
    /// @notice CPが準拠しているか確認
    function isCompliant(uint8 cpNumber) external view returns (bool);
    
    /// @notice 超多数決要件を取得
    function getSupermajorityRequirements() external view returns (
        uint256 veQSThreshold,      // 75%
        uint256 scThreshold,        // 6/7
        uint256 timelockDays        // 30 days
    );
}
```

---

## 4. モード組み合わせ

### 4.1 有効な組み合わせ

| # | Governance | Token | ユースケース |
|---|-----------|-------|-------------|
| 1 | CENTRALIZED | DISABLED | 開発・テスト |
| 2 | CENTRALIZED | BASIC | 初期運用 |
| 3 | MULTISIG | DISABLED | 譲渡（最小構成） |
| 4 | MULTISIG | BASIC | 譲渡（トークンあり） |
| 5 | MULTISIG | FULL | 運用移行期 |
| 6 | DECENTRALIZED | BASIC | 分散化初期 |
| 7 | DECENTRALIZED | FULL | 完全分散化 |

### 4.2 モード遷移ルール

```
┌──────────────┐
│ CENTRALIZED  │─────────────────────────────────────────┐
└──────┬───────┘                                         │
       │ 管理者承認                                       │
       ▼                                                 │
┌──────────────┐                                         │
│   MULTISIG   │◄────────────────────────────────────────┤
└──────┬───────┘                                         │
       │ マルチシグ承認 + Time Lock (7日)                 │
       ▼                                                 │
┌──────────────┐                                         │
│DECENTRALIZED │─────────────────────────────────────────┘
└──────────────┘   ※逆方向遷移: 超多数決 + Time Lock (30日)
```

**遷移ルール:**
- CENTRALIZED → MULTISIG: 管理者承認のみ
- MULTISIG → DECENTRALIZED: マルチシグ承認 + 7日Time Lock
- DECENTRALIZED → MULTISIG/CENTRALIZED: 超多数決（75% veQS + 6/7 SC + 30日）
- **降格（分散→集中）は厳格な承認が必要**

---

## 5. セキュリティ考慮事項

### 5.1 攻撃ベクトルと対策

| 攻撃 | リスク | 対策 |
|------|--------|------|
| モード切替攻撃 | 権限昇格/降格 | Time Lock + 超多数決 |
| Core Layer改ざん | CP違反 | Immutable設計 + Proxy禁止 |
| 切替中の攻撃 | 状態不整合 | Atomic切替 + Pausable |
| 譲渡後の悪用 | 設定変更 | Core Layer保護 |

### 5.2 監査要件

| # | 監査項目 | 優先度 |
|---|---------|--------|
| 1 | モード切替ロジック | 🔴 Critical |
| 2 | Core Layer不変性 | 🔴 Critical |
| 3 | CP保護機構 | 🔴 Critical |
| 4 | Layer間インターフェース | 🟠 High |
| 5 | 全モード組み合わせ | 🟠 High |

---

## 6. テスト要件

### 6.1 単体テスト

| コンポーネント | テスト項目 |
|--------------|-----------|
| GovernanceSwitch | モード取得/設定、権限チェック |
| TokenSwitch | モード取得/設定、トークン取得 |
| ConstitutionLock | CP保護レベル、準拠確認 |
| Core Layer | ブリッジ、状態検証 |

### 6.2 結合テスト

| テスト | 内容 |
|-------|------|
| モード切替 | 全遷移パターン |
| Layer連携 | Core ↔ Governance ↔ Token |
| CP保護 | 全モードでのCP維持確認 |

### 6.3 セキュリティテスト

| テスト | 内容 |
|-------|------|
| 権限昇格 | 不正なモード変更試行 |
| 再入可能性 | Re-entrancy攻撃 |
| DoS | ガス枯渇攻撃 |

---

## 7. 実装スケジュール

| Phase | 期間 | 成果物 |
|-------|------|--------|
| 3.1 | Month 10-12 | インターフェース、基盤実装 |
| 3.2 | Month 13-15 | 完全実装、第1回監査 |
| 3.3 | Month 16-18 | 統合テスト、第2回監査、Testnet |

---

## 8. 参照ドキュメント

| ドキュメント | パス |
|------------|------|
| Phase 3戦略 | `docs/planning/PHASE3_STRATEGY.md` |
| Core Principles | `docs/constitution/CORE_PRINCIPLES.md` |
| 最終決議書 | `agents/meetings/phase3_strategy/round8_final/FINAL_RESOLUTION_v3.md` |
