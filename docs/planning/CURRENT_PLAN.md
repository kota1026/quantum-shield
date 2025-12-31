# Current Plan

> **Generated**: 2025-12-31 18:30 JST
> **Phase**: 3 - L3 + Token + 完全分散化
> **Sub-Phase**: 3.1 Foundation

---

## 対象チェックリスト

`docs/checklists/phase3.1.md`

---

## 仕様書参照（必須）

> 参照: `docs/planning/SPEC_STRATEGY_BRIDGE.md`

### 対象Sequence

| Sequence | 実装Layer | 仕様書参照箇所 |
|----------|----------|---------------|
| #5 Prover Registration | Token | SEQUENCES §5, SPEC_STRATEGY_BRIDGE §7.2 |
| #6 Prover Exit | Token | SEQUENCES §6, SPEC_STRATEGY_BRIDGE §7.2 |
| #7 Governance Proposal | Token | SEQUENCES §7 (FULL mode時のみ) |

### セキュリティ要件

| 要件 | 仕様書出典 | 実装方法 |
|------|----------|---------|
| Stake通貨切替 | SPEC_STRATEGY_BRIDGE §7.2 | TokenSwitch.getStakeCurrency() |
| 最低Stake額 | SPEC_STRATEGY_BRIDGE §7.2 | DISABLED: $400K ETH, BASIC/FULL: $500K $QS |
| モード切替Time Lock | MODULAR_ARCHITECTURE §4.2 | 7日(UPGRADE), 30日(DOWNGRADE) |
| Governance連携 | MODULAR_ARCHITECTURE §3.2 | IGovernanceSwitch経由承認 |

---

## 戦略準拠確認（Phase 3）

> 参照: `docs/planning/PHASE3_STRATEGY.md`

- [x] L3スタック: 独自L3 (l3-aegis) 前提
- [x] アーキテクチャ: Modular (Core/Governance/Token Layer)
- [ ] リスク緩和: 監査対象コード（Phase 3.2で外部監査）
- [x] モード制約: SPEC_STRATEGY_BRIDGE §2.2準拠

---

## L3基盤確認（Phase 3のL3関連タスク）

> 参照: `docs/aegis/meetings/L3_INFRASTRUCTURE_FINAL_DECISION_2025-12-28.md`

- [x] 独自4ノードBFTチェーン前提か → N/A (Solidity Pluggable Layer)
- [x] l3-aegis (Rust) の範囲内か → Solidity Layer（l3-aegis/src/token/）
- [x] SEQUENCES v2.0に準拠しているか → §5, §6, §7のToken依存動作
- [x] CP-1/CP-5を満たしているか → Token Layerは暗号処理なし（CP-1影響なし）

---

## IC完全性チェック（Phase 3必須）

> 参照: `docs/aegis/QUANTUM_SHIELD_UNIFIED_SPEC_v2.0.md` §Implementation Components

### 今回スコープのIC

| IC-ID | Component | タスク | Status |
|-------|-----------|--------|--------|
| - | Token Switch | PLUG-002 | 🟡 In Progress |

> **Note**: PLUG-002はPluggable Layer基盤であり、IC-5 (veQS Token)の前提条件を構築。
> IC-5自体はPhase 3.2で実装予定。

### マスタ照合

- [x] 全IC-ID（IC-1〜IC-6）がPHASE3_PLANに対応セクションを持つ
- [x] 欠落ICなし

### タスク紐付け

- [x] 今回スコープの全タスクにIC-IDを付与した（PLUG-002はIC-5前提条件）
- [x] IC-ID不要タスクは理由を明記した（Pluggable Layer基盤のため）

---

## 前回レビュー課題

> CURRENT_STATE.mdより確認: 未解決課題なし

| # | 重要度 | 課題 | 対策 |
|---|--------|------|------|
| - | - | なし（PLUG-001完了済み） | - |

---

## 今回のスコープ

### 修正項目（レビュー課題より）

なし（前回PIR全てPASS）

### 実装項目

| ID | 項目 | IC | 参照 |
|----|------|-----|------|
| IMPL-001 | TokenSwitch.sol 基本構造 | - | MODULAR_ARCHITECTURE §3.2 |
| IMPL-002 | DISABLED モード実装 | - | SPEC_STRATEGY_BRIDGE §7.2 |
| IMPL-003 | BASIC モード（スタブ） | - | SPEC_STRATEGY_BRIDGE §7.2 |
| IMPL-004 | FULL モード（スタブ） | - | SPEC_STRATEGY_BRIDGE §7.2 |
| IMPL-005 | モード切替ロジック + Time Lock | - | MODULAR_ARCHITECTURE §4.2 |
| IMPL-006 | GovernanceSwitch連携 | - | MODULAR_ARCHITECTURE §2.2 |
| IMPL-007 | Stake通貨/最低額管理 | - | SPEC_STRATEGY_BRIDGE §7.2 |

### テスト項目

| ID | 項目 | 対象 |
|----|------|------|
| TEST-001 | TokenMode取得・設定テスト | getTokenMode(), setTokenMode() |
| TEST-002 | DISABLED モードテスト | ETH手数料、$400K Stake |
| TEST-003 | BASIC モードテスト（スタブ） | $QS設定、$500K Stake |
| TEST-004 | FULL モードテスト（スタブ） | veQS/Staking enabled確認 |
| TEST-005 | モード遷移テスト | 全有効遷移パターン |
| TEST-006 | Time Lockテスト | 7日/30日制約 |
| TEST-007 | 権限テスト | Governance連携、Unauthorized |
| TEST-008 | Fuzzテスト | setTokenMode fuzz |
| TEST-009 | ガスベンチマーク | 主要操作のgas計測 |

### 参照ドキュメント

| 種類 | ドキュメント | 参照セクション |
|------|------------|---------------|
| 仕様書-戦略ブリッジ | `docs/planning/SPEC_STRATEGY_BRIDGE.md` | §2.2, §3, §7.2 |
| Sequence仕様 | `docs/aegis/QUANTUM_SHIELD_SEQUENCES_v2.0.md` | #5, #6, #7 |
| 全体仕様 | `docs/aegis/QUANTUM_SHIELD_UNIFIED_SPEC_v2.0.md` | §Token Design |
| 戦略 | `docs/planning/PHASE3_STRATEGY.md` | Token Layer |
| Modular仕様 | `docs/specs/MODULAR_ARCHITECTURE.md` | §3.2, §4.2 |
| Phase 3計画 | `docs/planning/PHASE3_PLAN.md` | §veQS Token |
| GovernanceSwitch参考 | `l3-aegis/src/governance/GovernanceSwitch.sol` | 全体（実装パターン） |

---

## 成果物

| ファイル | 説明 | IC-ID |
|---------|------|-------|
| `l3-aegis/src/token/TokenSwitch.sol` | TokenSwitch実装 | - |
| `l3-aegis/test/token/TokenSwitch.t.sol` | テストスイート | - |

---

## 実装順序

### Phase 1: 基本構造 (IMPL-001)

1. `l3-aegis/src/token/` ディレクトリ作成
2. TokenSwitch.sol スケルトン作成
3. ITokenSwitch.sol インポート確認
4. 基本状態変数定義

### Phase 2: モード実装 (IMPL-002〜004)

1. **DISABLED モード**
   - getTokenAddress() → address(0)
   - getFeeToken() → address(0) (ETH)
   - getStakeCurrency() → address(0) (ETH)
   - getMinimumStake() → 400_000e18 ($400K)
   - isVeQSEnabled() → false
   - isStakingEnabled() → false

2. **BASIC モード（スタブ）**
   - getTokenAddress() → _qsTokenAddress
   - getFeeToken() → _qsTokenAddress
   - getStakeCurrency() → _qsTokenAddress
   - getMinimumStake() → 500_000e18 ($500K)
   - isVeQSEnabled() → false
   - isStakingEnabled() → false

3. **FULL モード（スタブ）**
   - 上記BASIC + veQS/Staking enabled
   - Phase 3.2で完全実装

### Phase 3: モード切替 (IMPL-005〜006)

1. **setTokenMode()実装**
   - Governance Layer承認チェック
   - モード遷移バリデーション
   - Time Lock実装
     - DISABLED → BASIC: 管理者承認
     - BASIC → FULL: 7日 Time Lock
     - FULL → BASIC/DISABLED: 30日 Time Lock（超多数決）

2. **GovernanceSwitch連携**
   - IGovernanceSwitch参照
   - canApprove()チェック
   - モード依存の承認ロジック

### Phase 4: Stake管理 (IMPL-007)

1. Stake通貨切替ロジック
2. 最低Stake額管理
3. Prover登録/退出との連携準備

### Phase 5: テスト作成 (TEST-001〜009)

1. 単体テスト（TEST-001〜004）
2. 遷移テスト（TEST-005〜006）
3. セキュリティテスト（TEST-007）
4. Fuzz + ガス（TEST-008〜009）

---

## Core Principles確認

- [x] CP-1: 完全量子耐性 - 違反なし（Token Layerは暗号処理なし）
- [x] CP-2: Self-Custody - 違反なし（ユーザー鍵管理に影響なし）
- [x] CP-3: Time Lock存在 - 違反なし（モード切替にTime Lock適用）
- [x] CP-4: Slashing存在 - 違反なし（Slashingメカニズムに影響なし）
- [x] CP-5: 透明性 - 違反なし（全イベント発行）

---

## Modular Architecture確認（Phase 3）

- [x] Core Layer: 依存なし（Token LayerはCore Layerに依存しない）
- [x] Governance Layer: ON/OFF切替可能（GovernanceSwitch経由）
- [x] Token Layer: ON/OFF切替可能（DISABLED/BASIC/FULL）
- [x] Layer間依存: 下位→上位依存なし（Token → Governance参照のみ）

---

## リスク・懸念事項

| # | リスク | 重要度 | 緩和策 |
|---|--------|--------|--------|
| 1 | BASIC/FULLモードはスタブ実装 | 🟡 Medium | Phase 3.2で完全実装予定、テストでスタブ動作確認 |
| 2 | Governance連携の複雑性 | 🟡 Medium | GovernanceSwitch実装パターンを踏襲 |
| 3 | Time Lock bypass攻撃 | 🟠 High | 絶対タイムスタンプ使用、テストで検証 |

---

## 想定テスト数

| カテゴリ | テスト数 |
|---------|:-------:|
| Mode Tests (DISABLED/BASIC/FULL) | 12 |
| Transition Tests | 8 |
| Time Lock Tests | 6 |
| Authorization Tests | 4 |
| Stake Currency/Amount Tests | 4 |
| Fuzz Tests | 2 |
| Gas Benchmarks | 3 |
| **合計** | **39** |

---

## 次のステップ

1. ✅ 計画作成（本ドキュメント）
2. ⏳ 仕様確認（02_spec.md）
3. ⬜ 実装（03_impl.md）
4. ⬜ レビュー（04_review.md）
5. ⬜ PIR会議（05_pir.md）
6. ⬜ 状態更新（06_update.md）

---

**END OF CURRENT PLAN**
