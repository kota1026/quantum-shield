# Task Definition

> **Generated**: 2026-01-12 (SEP v3)
> **Status**: DONE

---

## 基本情報

| 項目 | 値 |
|------|-----|
| タスクID | TASK-P5-010 |
| タイトル | EditionConfig.sol 実装 |
| Phase | 5.1 |
| 優先度 | P0 |
| 見積り工数 | 3日 |

---

## 背景

### 仕様参照

- EDITION_SWITCH_SPEC.md §3, §8
- 26_phase5_planner.md TASK-P5-010

### 現状分析

| コンポーネント | ファイル | 状態 | 備考 |
|--------------|---------|:----:|------|
| L3 GovernanceSwitch | `l3-aegis/src/governance/GovernanceSwitch.sol` | ✅ 完成 | ガバナンスモード管理 |
| L1 EditionConfig | `contracts/src/core/EditionConfig.sol` | ⚠️ 未実装 | エディション管理（新規） |

### ギャップ分析

```
既存: GovernanceSwitch.sol (L3)
  - GovernanceMode enum (TRAINING, CENTRALIZED, MULTISIG, DECENTRALIZED)
  - ガバナンスモード遷移管理

不足: EditionConfig.sol (L1)
  - Edition enum (ENTERPRISE, DECENTRALIZED)
  - ConsensusType enum (FIXED_4BFT, DYNAMIC_PBFT)
  - ProverApprovalMode enum (CONTRACT_BASED, FOUNDATION_INVITE, COUNCIL_VOTE, STAKE_AUTO)
  - NodeConfig struct
  - Settings struct
  - switchEdition(), getSettings() など
```

---

## 実装項目

### 1. EditionConfig.sol

```solidity
contract EditionConfig {
    enum Edition { ENTERPRISE, DECENTRALIZED }
    enum ConsensusType { FIXED_4BFT, DYNAMIC_PBFT }
    enum ProverApprovalMode { CONTRACT_BASED, FOUNDATION_INVITE, COUNCIL_VOTE, STAKE_AUTO }

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

    function switchEdition(Edition newEdition) external;
    function updateNodeConfig(NodeConfig calldata newConfig) external;
    function updateProverApprovalMode(ProverApprovalMode newMode) external;
    function getSettings() external view returns (Settings memory);
    // ... その他view関数
}
```

### 2. EditionConfig.t.sol テスト

- Constructor tests (Enterprise, Decentralized)
- Owner management tests
- Edition switch tests
- Node configuration tests
- Prover approval mode tests
- Integration tests (Phase transition simulation)

---

## 完了条件

| # | 条件 | 状態 |
|---|------|:----:|
| 1 | Edition切替機能動作 | ✅ |
| 2 | Phase 1-4の承認モード対応 | ✅ |
| 3 | Enterprise制約の強制 | ✅ |
| 4 | テスト作成 | ✅ |

---

## 成果物

| ファイル | 行数 | 説明 |
|----------|:----:|------|
| `contracts/src/core/EditionConfig.sol` | ~350 | エディション設定管理コントラクト |
| `contracts/test/core/EditionConfig.t.sol` | ~450 | 包括的テストスイート |

---

## 次のステップ

- ローカル環境で `forge build` 実行
- ローカル環境で `forge test --match-contract EditionConfigTest` 実行
- slither静的解析（推奨）

---

**END OF TASK DEFINITION**
