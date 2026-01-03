# Current Plan

> **Generated**: 2026-01-03 17:00 JST
> **Phase**: Phase 3.3 - Decentralize + Testing
> **Sub-Phase**: Week 11-12 (DECEN-016~019 Inflation/Treasury)

---

## 対象チェックリスト

`docs/checklists/phase3.3.md`

---

## 仕様書参照（必須）

> 参照: `docs/planning/SPEC_STRATEGY_BRIDGE.md`

### 対象Sequence

| Sequence | 実装Layer | 仕様書参照箇所 |
|----------|----------|---------------|
| - | Token Layer | UNIFIED_SPEC §Token仕様, §Treasury |
| #5 | Core + Token | SEQUENCES §Prover Registration - Reward計算 |

### セキュリティ要件

| 要件 | 仕様書出典 | 実装方法 |
|------|----------|---------|
| Inflation schedule | UNIFIED_SPEC §Token配分 | 5%→1% 4年間逓減 |
| Treasury management | UNIFIED_SPEC §Treasury | マルチシグ + DAO管理 |
| Voting power cap | UNIFIED_SPEC §Token制限 | 5% per address |
| Reward distribution | PHASE3_STRATEGY | 60% Prover, 20% Treasury, 20% Burn |

---

## 戦略準拠確認（Phase 3）

> 参照: `docs/planning/PHASE3_STRATEGY.md`

- [x] L3スタック: 独自L3 (l3-aegis) 前提
- [x] アーキテクチャ: Modular (Core/Governance/Token Layer)
- [x] リスク緩和: Treasury multi-sig + DAO管理
- [x] モード制約: Token Layer FULL mode 前提

---

## L3基盤確認（Phase 3のL3関連タスク）

> 参照: `docs/aegis/meetings/L3_INFRASTRUCTURE_FINAL_DECISION_2025-12-28.md`

- [x] 独自4ノードBFTチェーン前提か → YES
- [x] l3-aegis (Rust) の範囲内か → YES
- [x] SEQUENCES v2.0に準拠しているか → YES
- [x] CP-1/CP-5を満たしているか → YES（SHA3-256使用）

---

## IC完全性チェック（Phase 3必須）

> 参照: `docs/aegis/QUANTUM_SHIELD_UNIFIED_SPEC_v2.0.md` §Implementation Components

### 今回スコープのIC

| IC-ID | Component | タスク | Status |
|-------|-----------|--------|--------|
| IC-5 | veQS Token | DECEN-016~019 | 🟡 In Progress |

### マスタ照合

- [x] 全IC-ID（IC-1〜IC-5）がPHASE3_PLANに対応セクションを持つ
- [x] 欠落ICなし（IC-6は不要：CEO指示）

### タスク紐付け

- [x] 今回スコープの全タスクにIC-IDを付与した
- [x] IC-ID不要タスクは理由を明記した

---

## 前回レビュー課題

> PIR-P3.3-002 PASS (2026-01-03)

**前回までの完了事項**:
- DECEN-001~004: 4BFT Production Readiness ✅ PASS
- DECEN-005~008: Security Council veQS選出 ✅ PASS  
- DECEN-009~011: Governance ON/OFF ✅ PASS
- DECEN-012~015: Multi-Sequencer ✅ PASS (51/51 tests)

**ブロッカー/懸念事項**:
| # | 懸念 | 重要度 | 対応 |
|---|------|--------|------|
| - | なし（前回PIR全PASS） | - | - |

---

## 今回のスコープ

### 実装項目

| Task ID | 内容 | IC | 優先度 | 詳細 |
|---------|------|-----|:------:|------|
| **DECEN-016** | Inflation mechanism | IC-5 | 🟠 High | 5%→1% 4年間逓減インフレーション |
| **DECEN-017** | Treasury management | IC-5 | 🟠 High | Treasury contract + マルチシグ管理 |
| **DECEN-018** | Reward distribution | IC-5 | 🟠 High | Sequencer/Prover報酬分配 |
| **DECEN-019** | Economic parameters | IC-5 | 🟠 High | 経済パラメータ設定・調整機構 |

### 実装詳細

#### DECEN-016: Inflation Mechanism

**ファイル**: `l3-aegis/src/token/QSInflation.sol`

**仕様** (UNIFIED_SPEC §Token仕様):
- 初年度: 5% inflation
- 2年目: 3.75%
- 3年目: 2.5%
- 4年目以降: 1% (固定)

```solidity
contract QSInflation is IQSInflation, AccessControl {
    uint256 public constant INITIAL_INFLATION_RATE = 500; // 5.00% (basis points)
    uint256 public constant FINAL_INFLATION_RATE = 100;   // 1.00%
    uint256 public constant REDUCTION_PERIOD = 4 * 365 days;
    
    function getCurrentInflationRate() external view returns (uint256);
    function mintInflation() external returns (uint256);
    function calculateYearlyMint(uint256 totalSupply) external view returns (uint256);
}
```

機能:
- `getCurrentInflationRate()`: 現在のインフレーション率を計算（時間ベース逓減）
- `mintInflation()`: 年間インフレーション分をミント（Treasury/Rewardsへ配分）
- `calculateYearlyMint()`: 年間ミント量の事前計算

#### DECEN-017: Treasury Management

**ファイル**: `l3-aegis/src/treasury/Treasury.sol`

**仕様** (UNIFIED_SPEC §Treasury):
- Phase 1-2: 財団マルチシグ（3/5）
- Phase 3: Token Vote + 財団承認
- Phase 4: Token Vote のみ

```solidity
contract Treasury is ITreasury, GovernanceControlled {
    uint256 public constant MAX_SINGLE_SPEND = 100_000 * 1e18; // $100K
    uint256 public minimumBalance; // 12ヶ月分運営費
    
    function propose(address target, uint256 amount, bytes calldata data) external;
    function execute(uint256 proposalId) external;
    function emergencyWithdraw(address to, uint256 amount) external; // SC 7/9
    function getBalance() external view returns (uint256);
}
```

機能:
- `propose()`: 支出提案（Token Vote or マルチシグ承認）
- `execute()`: 承認済み提案の実行
- `emergencyWithdraw()`: SC 7/9 緊急引き出し
- GovernanceSwitch統合（モードに応じた承認方式）

**資金源**:
- Protocol Revenue: 手数料の30-40%
- Inflation mint の Treasury 配分
- Slash収入の一部

#### DECEN-018: Reward Distribution

**ファイル**: `l3-aegis/src/rewards/RewardDistributor.sol`

**仕様** (PHASE3_STRATEGY, UNIFIED_SPEC Phase 2+):

手数料配分（Phase 3）:
| 配分先 | 割合 |
|--------|------|
| Prover/Sequencer報酬 | 40% |
| Treasury | 30% |
| $QS Burn | 20% |
| Insurance | 10% |

```solidity
contract RewardDistributor is IRewardDistributor {
    uint256 public constant PROVER_SHARE = 4000;    // 40%
    uint256 public constant TREASURY_SHARE = 3000;  // 30%
    uint256 public constant BURN_SHARE = 2000;      // 20%
    uint256 public constant INSURANCE_SHARE = 1000; // 10%
    
    function distribute(uint256 amount) external;
    function claimRewards() external;
    function getUnclaimedRewards(address prover) external view returns (uint256);
    function setShares(uint256 prover, uint256 treasury, uint256 burn, uint256 insurance) external;
}
```

機能:
- `distribute()`: 手数料収入の自動分配
- `claimRewards()`: Prover/Sequencer報酬請求
- `setShares()`: 配分率変更（Governance承認必須）

#### DECEN-019: Economic Parameters

**ファイル**: `l3-aegis/src/economics/EconomicParameters.sol`

**仕様** (UNIFIED_SPEC, CORE_PRINCIPLES):

| パラメータ | 初期値 | 変更可否 |
|-----------|--------|----------|
| Fee Rate | 0.05% (min $10) | ✅ Token Vote |
| Minimum Stake | $500K | ✅ Token Vote |
| Unbonding Period | 7 days | ⚠️ 延長のみ可 |
| Slashing Rate | N²×10% | ❌ 削除不可 (CP-4) |
| Voting Power Cap | 5% | ✅ Token Vote |

```solidity
contract EconomicParameters is IEconomicParameters, GovernanceControlled {
    uint256 public feeRate = 5; // 0.05% (basis points)
    uint256 public minimumFee = 10 * 1e18; // $10
    uint256 public votingPowerCap = 500; // 5% (basis points)
    
    function setFeeRate(uint256 newRate) external; // requires Token Vote
    function setMinimumFee(uint256 newFee) external;
    function setVotingPowerCap(uint256 newCap) external;
    function getParameters() external view returns (EconomicParams memory);
}
```

機能:
- 経済パラメータの一元管理
- Token Vote 連携（DECENTRALIZED mode）
- パラメータ変更時の Time Lock (7日)
- CP保護パラメータの不変性保証

### テスト項目

| Test ID | 内容 | 対象 |
|---------|------|------|
| TEST-INF-001 | Inflation rate calculation (year 1-4+) | DECEN-016 |
| TEST-INF-002 | Inflation minting schedule | DECEN-016 |
| TEST-INF-003 | Rate transition (5%→1%) | DECEN-016 |
| TEST-TREA-001 | Treasury proposal/execute lifecycle | DECEN-017 |
| TEST-TREA-002 | Max single spend enforcement | DECEN-017 |
| TEST-TREA-003 | Minimum balance requirement | DECEN-017 |
| TEST-TREA-004 | Emergency withdraw (SC 7/9) | DECEN-017 |
| TEST-TREA-005 | GovernanceSwitch integration | DECEN-017 |
| TEST-REW-001 | Fee distribution (40/30/20/10) | DECEN-018 |
| TEST-REW-002 | Reward claim lifecycle | DECEN-018 |
| TEST-REW-003 | Burn mechanism verification | DECEN-018 |
| TEST-ECON-001 | Parameter change with Token Vote | DECEN-019 |
| TEST-ECON-002 | Voting power cap enforcement | DECEN-019 |
| TEST-ECON-003 | Unbonding period (extension only) | DECEN-019 |
| TEST-ECON-004 | CP-4 slashing rate immutability | DECEN-019 |

### 参照ドキュメント

| 種類 | ドキュメント | 参照セクション |
|------|------------|---------------|
| 仕様書-戦略ブリッジ | `docs/planning/SPEC_STRATEGY_BRIDGE.md` | §3, §4, §5 |
| Sequence仕様 | `docs/aegis/QUANTUM_SHIELD_SEQUENCES_v2.0.md` | #5 |
| 全体仕様 | `docs/aegis/QUANTUM_SHIELD_UNIFIED_SPEC_v2.0.md` | §Token, §Treasury, §経済モデル |
| 戦略 | `docs/planning/PHASE3_STRATEGY.md` | Token設計, 手数料配分 |
| 憲法 | `docs/constitution/CORE_PRINCIPLES.md` | CP-3, CP-4 保護 |
| L3基盤決議 | `docs/aegis/meetings/L3_INFRASTRUCTURE_FINAL_DECISION_2025-12-28.md` | 全体 |
| Phase 3計画 | `docs/planning/PHASE3_PLAN.md` | §Token, §Treasury |

---

## 成果物

| ファイル | 説明 | IC-ID |
|---------|------|-------|
| `l3-aegis/src/token/QSInflation.sol` | Inflation mechanism | IC-5 |
| `l3-aegis/src/interfaces/IQSInflation.sol` | Inflation interface | IC-5 |
| `l3-aegis/src/treasury/Treasury.sol` | Treasury management | IC-5 |
| `l3-aegis/src/interfaces/ITreasury.sol` | Treasury interface | IC-5 |
| `l3-aegis/src/rewards/RewardDistributor.sol` | Reward distribution | IC-5 |
| `l3-aegis/src/interfaces/IRewardDistributor.sol` | Distributor interface | IC-5 |
| `l3-aegis/src/economics/EconomicParameters.sol` | Economic parameters | IC-5 |
| `l3-aegis/src/interfaces/IEconomicParameters.sol` | Parameters interface | IC-5 |
| `l3-aegis/test/token/QSInflation.t.sol` | Inflation tests | - |
| `l3-aegis/test/treasury/Treasury.t.sol` | Treasury tests | - |
| `l3-aegis/test/rewards/RewardDistributor.t.sol` | Reward tests | - |
| `l3-aegis/test/economics/EconomicParameters.t.sol` | Parameters tests | - |

---

## 実行順序

### Day 1-2: DECEN-016 Inflation Mechanism

1. `IQSInflation.sol` インターフェース定義
2. `QSInflation.sol` 実装
   - 逓減インフレーション計算
   - 年間ミントスケジュール
   - veQSToken統合
3. Unit tests作成・実行 (TEST-INF-001~003)

### Day 3-4: DECEN-017 Treasury Management

1. `ITreasury.sol` インターフェース定義
2. `Treasury.sol` 実装
   - 提案・実行ライフサイクル
   - マルチシグ/TokenVote統合
   - 緊急引き出し (SC 7/9)
3. GovernanceSwitch統合テスト
4. Unit tests作成・実行 (TEST-TREA-001~005)

### Day 5-6: DECEN-018 Reward Distribution

1. `IRewardDistributor.sol` インターフェース定義
2. `RewardDistributor.sol` 実装
   - 手数料分配ロジック (40/30/20/10)
   - Prover/Sequencer報酬請求
   - Burn統合（BURN_ADDRESS使用）
3. SequencerSlashing統合確認
4. Unit tests作成・実行 (TEST-REW-001~003)

### Day 7-8: DECEN-019 Economic Parameters + Integration

1. `IEconomicParameters.sol` インターフェース定義
2. `EconomicParameters.sol` 実装
   - パラメータ管理
   - Token Vote連携
   - CP保護（slashing rate不変）
3. 全契約間の統合テスト
4. Unit tests作成・実行 (TEST-ECON-001~004)

### Day 9: レビュー準備

1. 全テスト再実行
2. Slither静的解析 (High/Medium = 0必須)
3. 04_review.md用ドキュメント準備
4. PIR-P3.3-003準備

---

## Core Principles確認

- [x] CP-1: 完全量子耐性 - SHA3-256ハッシュ使用、keccak256禁止
- [x] CP-2: Self-Custody - Treasury管理は運営資金のみ、ユーザー資産に影響なし
- [x] CP-3: Time Lock存在 - パラメータ変更に7日Time Lock
- [x] CP-4: Slashing存在 - Slashing rateは不変（EconomicParametersで保護）
- [x] CP-5: 透明性 - 全操作がEvent発行、オンチェーン検証可能

---

## Modular Architecture確認（Phase 3）

- [x] Core Layer: 基本手数料処理は Core Layer
- [x] Governance Layer: Treasury提案/承認は Governance Layer
- [x] Token Layer: Inflation/Rewards は Token Layer FULL mode
- [x] Layer間依存: Token→Governance→Core の上位→下位依存

---

## リスク・懸念事項

| # | リスク | 重要度 | 緩和策 |
|---|--------|--------|--------|
| 1 | Inflation計算の複雑さ | 🟡 LOW | 時間ベース線形逓減で単純化 |
| 2 | Treasury攻撃 | 🟠 MEDIUM | マルチシグ + Token Vote + 最低残高 |
| 3 | 報酬分配の公平性 | 🟡 LOW | stake-weighted distribution |
| 4 | パラメータ攻撃 | 🟠 MEDIUM | Time Lock + CP保護 |

---

## 想定所要時間

| 項目 | 時間 |
|------|------|
| DECEN-016 | 2日 |
| DECEN-017 | 2日 |
| DECEN-018 | 2日 |
| DECEN-019 + Integration | 2日 |
| レビュー準備 | 1日 |
| **合計** | **9日** |

---

## 依存関係

```
DECEN-016 (Inflation)
    ↓
DECEN-018 (Rewards) ← inflation mint 配分先
    ↓
DECEN-017 (Treasury) ← rewards の一部が流入
    ↓
DECEN-019 (Parameters) ← 全契約のパラメータ管理
```

---

## テスト合計見込み

| カテゴリ | テスト数 |
|---------|:-------:|
| Inflation (TEST-INF) | 3 |
| Treasury (TEST-TREA) | 5 |
| Rewards (TEST-REW) | 3 |
| Economics (TEST-ECON) | 4 |
| **合計** | **15** |

---

**END OF CURRENT PLAN**
