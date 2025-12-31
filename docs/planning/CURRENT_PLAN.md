# Current Plan

> **Generated**: 2025-01-01 JST
> **Phase**: 3 - L3 + Token + 完全分散化
> **Sub-Phase**: 3.1 Foundation
> **Task**: PLUG-003 External Bridge Adapter

---

## 対象チェックリスト

`docs/checklists/phase3.1.md`

---

## 仕様書参照（必須）

> 参照: `docs/planning/SPEC_STRATEGY_BRIDGE.md`

### 対象Sequence

| Sequence | 実装Layer | 仕様書参照箇所 |
|----------|----------|---------------|
| #5 | Core + Governance | SEQUENCES §5 Prover Registration |
| #6 | Core + Governance | SEQUENCES §6 Prover Exit |
| #7 | Governance (Token連携) | SEQUENCES §7 Governance Proposal |
| #8 | Core + Governance | SEQUENCES §8 Emergency Pause |

### セキュリティ要件

| 要件 | 仕様書出典 | 実装方法 |
|------|----------|---------|
| Layer分離 | MODULAR_ARCHITECTURE §2.2 | 上位→下位依存のみ許可 |
| CP保護 | CORE_PRINCIPLES CP-1〜5 | ConstitutionLock連携 |
| 認可フロー | SPEC_STRATEGY_BRIDGE §6 | モード別権限チェック |
| Time Lock | MODULAR_ARCHITECTURE §4.2 | 7日/30日タイムロック |

---

## 戦略準拠確認（Phase 3）

> 参照: `docs/planning/PHASE3_STRATEGY.md`

- [x] L3スタック: 独自L3 (l3-aegis) 前提
- [x] アーキテクチャ: Modular (Core/Governance/Token Layer)
- [x] リスク緩和: 網羅的テスト、モード組み合わせ検証
- [x] モード制約: SPEC_STRATEGY_BRIDGE §2.2準拠

---

## L3基盤確認（Phase 3のL3関連タスク）

> 参照: `docs/aegis/meetings/L3_INFRASTRUCTURE_FINAL_DECISION_2025-12-28.md`

- [x] 独自4ノードBFTチェーン前提か → N/A（Solidity Layer間連携）
- [x] l3-aegis (Rust) の範囲内か → N/A（Solidity実装）
- [x] SEQUENCES v2.0に準拠しているか → ✅ #5-8対応
- [x] CP-1/CP-5を満たしているか → ✅ 要検証

---

## IC完全性チェック（Phase 3必須）

> 参照: `docs/aegis/QUANTUM_SHIELD_UNIFIED_SPEC_v2.0.md` §Implementation Components

### 今回スコープのIC

| IC-ID | Component | タスク | Status |
|-------|-----------|--------|--------|
| IC-2 | L3 Bridge Contract | PLUG-003 (Layer連携) | 🟡 In Progress |

### マスタ照合

- [x] 全IC-ID（IC-1〜IC-6）がPHASE3_PLANに対応セクションを持つ
- [x] 欠落ICなし

### タスク紐付け

- [x] 今回スコープの全タスクにIC-IDを付与した（IC-2）
- [x] IC-ID不要タスクは理由を明記した（N/A）

---

## 前回レビュー課題（該当時のみ）

> CURRENT_STATE.mdより確認

| # | 重要度 | 課題 | 状態 |
|---|--------|------|------|
| - | - | Critical/High課題なし | ✅ 解決済み |

※ PIR-P3.1-012 (PLUG-002 Token Switch) 完了、全課題クリア

---

## 今回のスコープ

### 実装項目

- [ ] [IMPL-001] IExternalBridgeAdapter.sol インターフェース定義 (IC-2)
- [ ] [IMPL-002] ExternalBridgeAdapter.sol 作成 (IC-2)
- [ ] [IMPL-003] Core ↔ Governance インターフェース実装 (IC-2)
- [ ] [IMPL-004] Core ↔ Token インターフェース実装 (IC-2)
- [ ] [IMPL-005] Governance ↔ Token インターフェース実装 (IC-2)

### テスト項目

- [ ] [TEST-001] ExternalBridgeAdapter 単体テスト
- [ ] [TEST-002] Layer間連携テスト（Core ↔ Governance）
- [ ] [TEST-003] Layer間連携テスト（Core ↔ Token）
- [ ] [TEST-004] Layer間連携テスト（Governance ↔ Token）
- [ ] [TEST-005] 全モード組み合わせテスト
- [ ] [TEST-006] 禁止モード組み合わせテスト（DECENTRALIZED + DISABLED）

### 参照ドキュメント

| 種類 | ドキュメント | 参照セクション |
|------|------------|---------------|
| 仕様書-戦略ブリッジ | `docs/planning/SPEC_STRATEGY_BRIDGE.md` | §3, §6, §7 |
| Sequence仕様 | `docs/aegis/QUANTUM_SHIELD_SEQUENCES_v2.0.md` | #5, #6, #7, #8 |
| 全体仕様 | `docs/aegis/QUANTUM_SHIELD_UNIFIED_SPEC_v2.0.md` | §IC |
| Modular仕様 | `docs/specs/MODULAR_ARCHITECTURE.md` | §2, §3, §4 |
| Phase 3計画 | `docs/planning/PHASE3_PLAN.md` | §PLUG |
| 既存実装 | `l3-aegis/src/governance/GovernanceSwitch.sol` | 全体 |
| 既存実装 | `l3-aegis/src/token/TokenSwitch.sol` | 全体 |

---

## 成果物

| ファイル | 説明 | IC-ID |
|---------|------|-------|
| `l3-aegis/src/interfaces/IExternalBridgeAdapter.sol` | Layer間連携インターフェース | IC-2 |
| `l3-aegis/src/bridge/ExternalBridgeAdapter.sol` | Layer間連携アダプター実装 | IC-2 |
| `l3-aegis/test/ExternalBridgeAdapter.t.sol` | 包括的テストスイート | - |

---

## 実装順序

### Step 1: インターフェース設計 (IMPL-001)

1. `IExternalBridgeAdapter.sol` を作成
2. Layer間通信メソッド定義:
   - `getGovernanceMode()` → Core用
   - `getTokenMode()` → Core用
   - `canExecuteCoreAction(bytes4 action, address caller)` → 権限チェック
   - `isTokenRequired(bytes4 action)` → Token依存確認
   - `validateLayerCompatibility()` → モード整合性確認

### Step 2: Core ↔ Governance インターフェース (IMPL-002, IMPL-003)

1. `ExternalBridgeAdapter.sol` 基盤作成
2. Governance参照の設定・取得
3. Core操作の権限確認ロジック:
   - CENTRALIZED: admin単独
   - MULTISIG: N/M承認
   - DECENTRALIZED: SC承認
4. Sequence #5, #6, #8 の認可フロー実装

### Step 3: Core ↔ Token インターフェース (IMPL-004)

1. Token参照の設定・取得
2. Stake通貨取得ロジック:
   - DISABLED: ETH (address(0))
   - BASIC/FULL: $QS Token
3. 最低Stake額取得:
   - DISABLED: $400K相当
   - BASIC/FULL: $500K相当
4. Fee Token取得ロジック

### Step 4: Governance ↔ Token インターフェース (IMPL-005)

1. veQS投票権確認
2. DECENTRALIZED + DISABLED 禁止チェック
3. Governance Proposal有効性確認:
   - Governance = DECENTRALIZED
   - Token = BASIC or FULL

### Step 5: テスト実装 (TEST-001〜006)

1. 単体テスト作成
2. Layer間連携テスト
3. モード組み合わせマトリクステスト（9パターン）
4. 禁止モード検証テスト
5. ガスベンチマーク

### Step 6: セキュリティ検証

1. Slitherスキャン実行
2. Re-entrancy検証
3. 権限昇格/降格テスト
4. CP準拠確認

---

## インターフェース設計（案）

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IGovernanceSwitch} from "./IGovernanceSwitch.sol";
import {ITokenSwitch} from "./ITokenSwitch.sol";

/// @title IExternalBridgeAdapter
/// @notice Layer間通信を仲介するアダプターインターフェース
/// @dev Core Layer がPluggable Layerに直接依存しないよう間接参照を提供
interface IExternalBridgeAdapter {
    // ============ Errors ============
    
    /// @notice 禁止されたモード組み合わせ
    error InvalidModeComposition(
        IGovernanceSwitch.GovernanceMode govMode,
        ITokenSwitch.TokenMode tokenMode
    );
    
    /// @notice 権限不足
    error UnauthorizedCaller(address caller, bytes4 action);
    
    // ============ Events ============
    
    /// @notice Layer参照が更新された
    event LayerReferenceUpdated(
        address indexed governance,
        address indexed token
    );
    
    // ============ View Functions ============
    
    /// @notice 現在のGovernanceモードを取得
    function getGovernanceMode() external view returns (IGovernanceSwitch.GovernanceMode);
    
    /// @notice 現在のTokenモードを取得
    function getTokenMode() external view returns (ITokenSwitch.TokenMode);
    
    /// @notice 呼び出し者がCore操作を実行できるか確認
    /// @param action 実行しようとする操作のセレクタ
    /// @param caller 呼び出し者アドレス
    function canExecuteCoreAction(bytes4 action, address caller) external view returns (bool);
    
    /// @notice 操作がToken依存かどうか確認
    /// @param action 操作のセレクタ
    function isTokenRequired(bytes4 action) external view returns (bool);
    
    /// @notice 現在のモード組み合わせが有効か確認
    function validateLayerCompatibility() external view returns (bool);
    
    /// @notice Stake通貨を取得
    function getStakeCurrency() external view returns (address);
    
    /// @notice 最低Stake額を取得
    function getMinimumStake() external view returns (uint256);
    
    /// @notice veQS投票権を確認（DECENTRALIZED時）
    function hasVotingPower(address account) external view returns (bool);
    
    // ============ State-Changing Functions ============
    
    /// @notice Layer参照を設定（初期化時のみ）
    function initialize(
        address governance,
        address token
    ) external;
}
```

---

## モード組み合わせマトリクス

> 参照: SPEC_STRATEGY_BRIDGE §2.2

| # | Governance | Token | 許可 | テスト |
|---|------------|-------|:----:|:------:|
| 1 | CENTRALIZED | DISABLED | ✅ | TEST-005 |
| 2 | CENTRALIZED | BASIC | ✅ | TEST-005 |
| 3 | CENTRALIZED | FULL | ⚠️ | TEST-005 |
| 4 | MULTISIG | DISABLED | ✅ | TEST-005 |
| 5 | MULTISIG | BASIC | ✅ | TEST-005 |
| 6 | MULTISIG | FULL | ✅ | TEST-005 |
| 7 | DECENTRALIZED | DISABLED | ❌ | TEST-006 |
| 8 | DECENTRALIZED | BASIC | ✅ | TEST-005 |
| 9 | DECENTRALIZED | FULL | ✅ | TEST-005 |

---

## Core Principles確認

- [ ] CP-1: 完全量子耐性 - SHA3-256使用、禁止アルゴリズム不使用
- [ ] CP-2: Self-Custody - ユーザー鍵管理に影響なし
- [ ] CP-3: Time Lock存在 - Layer切替時のTime Lock維持
- [ ] CP-4: Slashing存在 - 削除ロジックなし
- [ ] CP-5: 透明性 - 全操作Event発行

---

## Modular Architecture確認（Phase 3）

- [ ] Core Layer: CP保護機構含む（ConstitutionLock連携）
- [ ] Governance Layer: ON/OFF切替可能（GovernanceSwitch連携）
- [ ] Token Layer: ON/OFF切替可能（TokenSwitch連携）
- [ ] Layer間依存: 下位→上位依存なし（Core → Governance/Token依存禁止）

---

## リスク・懸念事項

| # | リスク | 重要度 | 対策 |
|---|--------|--------|------|
| 1 | Layer循環依存 | 🔴 High | アダプターパターンで間接参照 |
| 2 | モード切替中の不整合 | 🟠 Medium | Atomic操作 + Pausable |
| 3 | 禁止モード組み合わせの漏れ | 🟠 Medium | マトリクステストで網羅 |
| 4 | ガスコスト増加 | 🟡 Low | 間接呼び出し最適化 |

---

## 完了基準

| # | 基準 | 検証方法 |
|---|------|---------|
| 1 | IExternalBridgeAdapter.sol 作成完了 | ファイル存在確認 |
| 2 | ExternalBridgeAdapter.sol 作成完了 | ファイル存在確認 |
| 3 | 全テストPASS | `forge test --match-contract ExternalBridgeAdapter` |
| 4 | Slither警告なし（Critical/High） | `slither l3-aegis/src/bridge/` |
| 5 | CP-1準拠（keccak256不使用） | コードレビュー |
| 6 | PIR PASS | PIR-P3.1-013 |

---

**END OF CURRENT PLAN**
