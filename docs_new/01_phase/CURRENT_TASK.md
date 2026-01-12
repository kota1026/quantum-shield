# Task Definition

> **Generated**: 2026-01-12 (SEP v3)
> **Status**: DONE ✅
> **Completed**: 2026-01-12

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
| L1 EditionConfig | `contracts/src/core/EditionConfig.sol` | ✅ 完成 | エディション管理 |

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
| 5 | forge build成功 | ✅ |
| 6 | forge test成功 | ✅ |

---

## 成果物

| ファイル | 行数 | 説明 |
|----------|:----:|------|
| `contracts/src/core/EditionConfig.sol` | ~350 | エディション設定管理コントラクト |
| `contracts/test/core/EditionConfig.t.sol` | ~450 | 包括的テストスイート |

---

## 検証結果

### Build

```
Compiler: Solc 0.8.20
Status: ✅ Success
Files: 107 compiled
Warnings: None for EditionConfig.sol
```

### Test

```
Suite: EditionConfigTest
Total: 39 tests
Passed: 39
Failed: 0
Duration: 10.91ms
```

| Category | Count | Status |
|----------|:-----:|:------:|
| Constructor Tests | 3 | ✅ |
| Owner Management | 5 | ✅ |
| Edition Switch | 4 | ✅ |
| Node Configuration | 8 | ✅ |
| Prover Approval Mode | 4 | ✅ |
| Governance Enable | 2 | ✅ |
| View Functions | 8 | ✅ |
| Integration Tests | 2 | ✅ |
| Constants | 1 | ✅ |
| Validation | 2 | ✅ |

---

## Commits

| Hash | Message |
|------|---------|
| `c0d623a` | feat(contracts): implement EditionConfig.sol (TASK-P5-010) |
| `cf219c1` | fix(contracts): change solidity version to ^0.8.20 for compatibility |

---

**END OF TASK DEFINITION**
