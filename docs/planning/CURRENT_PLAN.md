# Current Plan

> **Generated**: 2025-12-31 15:00 JST
> **Phase**: 3 - L3 + Token + 完全分散化
> **Sub-Phase**: 3.1 Foundation - Pluggable Layer実装

## 対象チェックリスト
`docs/checklists/phase3.1.md`

## 仕様書参照（必須）

> 参照: `docs/planning/SPEC_STRATEGY_BRIDGE.md`

### 対象Sequence
| Sequence | 実装Layer | 仕様書参照箇所 |
|----------|----------|---------------|
| #5 | Governance | SEQUENCES §5 - Prover Registration |
| #6 | Governance | SEQUENCES §6 - Prover Exit |
| #7 | Governance | SEQUENCES §7 - Governance Proposal |
| #8 | Core + Governance | SEQUENCES §8 - Emergency Pause |

### セキュリティ要件
| 要件 | 仕様書出典 | 実装方法 |
|------|----------|---------|
| モード切替Time Lock | MODULAR_ARCHITECTURE §4.2 | 7日（MULTISIG→DECENTRALIZED） |
| 降格Time Lock | MODULAR_ARCHITECTURE §4.2 | 30日 + 超多数決 |
| Emergency Pause権限 | SPEC_STRATEGY_BRIDGE §7.1 | モード別権限分岐 |
| Admin単独承認制限 | CORE_PRINCIPLES | CENTRALIZEDモードのみ |

## 戦略準拠確認（Phase 3）

> 参照: `docs/planning/PHASE3_STRATEGY.md`

- [x] L3スタック: 独自L3 (l3-aegis) 前提
- [x] アーキテクチャ: Modular (Core/Governance/Token Layer)
- [x] リスク緩和: Time Lock + 超多数決要件
- [x] モード制約: SPEC_STRATEGY_BRIDGE §2.2の許可組み合わせのみ

## L3基盤確認（Phase 3のL3関連タスク）

> 参照: `docs/aegis/meetings/L3_INFRASTRUCTURE_FINAL_DECISION_2025-12-28.md`

- [x] 独自4ノードBFTチェーン前提か → Yes
- [x] l3-aegis (Rust + Solidity) の範囲内か → Yes
- [x] SEQUENCES v2.0に準拠しているか → Yes
- [x] CP-1/CP-5を満たしているか → Yes

## IC完全性チェック（Phase 3必須）

> 参照: `docs/aegis/QUANTUM_SHIELD_UNIFIED_SPEC_v2.0.md` §Implementation Components

### 今回スコープのIC
| IC-ID | Component | タスク | Status |
|-------|-----------|--------|--------|
| IC-2 | L3 Bridge Contract (Governance部分) | PLUG-001 | 🟡 In Progress |

### マスタ照合
- [x] 全IC-ID（IC-1〜IC-6）がPHASE3_PLANに対応セクションを持つ
- [x] 欠落ICなし

### タスク紐付け
- [x] 今回スコープの全タスクにIC-IDを付与した
- [x] IC-ID不要タスクは理由を明記した

## 前回レビュー課題

> CURRENT_STATE.mdより確認

| # | 重要度 | 課題 | 対策 |
|---|--------|------|------|
| - | - | 未解決課題なし | - |

**Note**: CORE-001, CORE-002, CORE-003 すべてPIR PASSにより未解決課題なし。

## 今回のスコープ

### 実装項目
- [x] [IMPL-001] IGovernanceSwitch.sol インターフェース定義 (IC-2) **完了済み**
- [ ] [IMPL-002] GovernanceSwitch.sol コントラクト作成 (IC-2)
- [ ] [IMPL-003] CENTRALIZED モード実装 (IC-2)
- [ ] [IMPL-004] MULTISIG モード実装 (IC-2)
- [ ] [IMPL-005] DECENTRALIZED モードスタブ (IC-2)
- [ ] [IMPL-006] Emergency Pause統合（SEQ#8対応） (IC-2)

### テスト項目
- [ ] [TEST-001] GovernanceSwitch単体テスト
- [ ] [TEST-002] モード切替テスト（全遷移パターン）
- [ ] [TEST-003] 権限チェックテスト
- [ ] [TEST-004] Time Lock検証テスト
- [ ] [TEST-005] Emergency Pauseテスト
- [ ] [TEST-006] Fuzzテスト（境界値）

### 参照ドキュメント
| 種類 | ドキュメント | 参照セクション |
|------|------------|---------------|
| 仕様書-戦略ブリッジ | `docs/planning/SPEC_STRATEGY_BRIDGE.md` | §3, §5, §7, §10 |
| Sequence仕様 | `docs/aegis/QUANTUM_SHIELD_SEQUENCES_v2.0.md` | #5, #6, #7, #8 |
| 全体仕様 | `docs/aegis/QUANTUM_SHIELD_UNIFIED_SPEC_v2.0.md` | §IC-2 |
| 戦略 | `docs/planning/PHASE3_STRATEGY.md` | Modular Architecture |
| Modular仕様 | `docs/specs/MODULAR_ARCHITECTURE.md` | §3.1, §4 |
| L3基盤決議 | `docs/aegis/meetings/L3_INFRASTRUCTURE_FINAL_DECISION_2025-12-28.md` | 全体 |
| 既存インターフェース | `l3-aegis/src/interfaces/IGovernanceSwitch.sol` | 全体 |

## 成果物
| ファイル | 説明 | IC-ID |
|---------|------|-------|
| `l3-aegis/src/governance/GovernanceSwitch.sol` | GovernanceSwitch実装 | IC-2 |
| `l3-aegis/test/governance/GovernanceSwitch.t.sol` | 包括的テストスイート | - |

## 実装順序

### Step 1: GovernanceSwitch基本構造 (IMPL-002)
1. `l3-aegis/src/governance/` ディレクトリ作成
2. `GovernanceSwitch.sol` 基本スケルトン作成
3. IGovernanceSwitchインターフェース実装宣言
4. 状態変数定義（mode, admin, multisigConfig, scConfig）
5. コンストラクタ（初期モード: CENTRALIZED）

### Step 2: CENTRALIZED モード実装 (IMPL-003)
1. `getAdmin()` 実装
2. `canApprove()` - admin判定実装
3. `approveAction()` - admin専用パス
4. `setGovernanceMode()` - admin→MULTISIG遷移

### Step 3: MULTISIG モード実装 (IMPL-004)
1. MultisigConfig struct定義
2. `getMultisigConfig()` 実装
3. 署名管理（signers mapping, signatureCount）
4. `canApprove()` - threshold判定追加
5. `approveAction()` - 署名収集・閾値判定
6. `setGovernanceMode()` - MULTISIG→DECENTRALIZED遷移（7日Time Lock）

### Step 4: DECENTRALIZED モードスタブ (IMPL-005)
1. SecurityCouncilConfig struct定義
2. `getSecurityCouncilConfig()` スタブ実装
3. `canApprove()` - SC判定スタブ
4. 降格遷移制限（30日Time Lock + 超多数決要件記載）
5. **Note**: 完全実装はPhase 3.2のDAO統合時

### Step 5: Emergency Pause統合 (IMPL-006)
1. Pausable機能統合（OpenZeppelin or カスタム）
2. `emergencyPause()` 関数追加
3. モード別権限チェック（SPEC_STRATEGY_BRIDGE §7.1準拠）
4. 72時間最大期間制限

### Step 6: テスト作成 (TEST-001〜006)
1. `GovernanceSwitch.t.sol` 作成
2. モード取得/設定テスト
3. 全遷移パターンテスト（9パターン）
4. 権限違反テスト（revert確認）
5. Time Lock検証テスト
6. Fuzzテスト（閾値、署名数）

### Step 7: セキュリティ確認
1. Slitherスキャン実行
2. Critical/High/Medium 0件確認
3. ガスベンチマーク測定
4. PIR準備

## Core Principles確認
- [x] CP-1: 完全量子耐性 - 違反なし（暗号アルゴリズム不使用）
- [x] CP-2: Self-Custody - 違反なし（ユーザー鍵管理なし）
- [x] CP-3: Time Lock存在 - 違反なし（モード遷移にTime Lock適用）
- [x] CP-4: Slashing存在 - 違反なし（本コンポーネント対象外）
- [x] CP-5: 透明性 - 違反なし（全モード変更をEvent発行）

## Modular Architecture確認（Phase 3）
- [x] Core Layer: CP保護機構含む（ConstitutionLock実装済み）
- [x] Governance Layer: ON/OFF切替可能（GovernanceSwitchで実現）
- [x] Token Layer: ON/OFF切替可能（PLUG-002で実装予定）
- [x] Layer間依存: 下位→上位依存なし（GovernanceはCoreに依存するがCoreはGovernanceに依存しない）

## モード組み合わせ制約（SPEC_STRATEGY_BRIDGE §2.2）

| # | Governance | Token | 許可 | 備考 |
|---|-----------|-------|:----:|------|
| 1 | CENTRALIZED | DISABLED | ✅ | Phase 1相当 |
| 2 | CENTRALIZED | BASIC | ✅ | 初期トークン発行 |
| 3 | MULTISIG | DISABLED | ✅ | 譲渡用最小構成 |
| 4 | MULTISIG | BASIC | ✅ | Phase 2相当 |
| 5 | DECENTRALIZED | DISABLED | ❌ | **禁止**: veQS投票不可 |
| 6 | DECENTRALIZED | BASIC | ✅ | 分散化初期 |
| 7 | DECENTRALIZED | FULL | ✅ | 完全分散化（推奨） |

## リスク・懸念事項

| # | リスク | 重要度 | 対策 |
|---|--------|--------|------|
| 1 | モード切替攻撃 | 🔴 High | Time Lock + 超多数決 |
| 2 | 権限昇格脆弱性 | 🔴 High | 厳格なアクセス制御テスト |
| 3 | 降格悪用 | 🟠 Medium | 30日Time Lock + 75% veQS要件 |
| 4 | DECENTRALIZEDスタブの不完全性 | 🟡 Low | Phase 3.2で完全実装予定を明記 |

## 完了基準

| # | 基準 | 検証方法 |
|---|------|---------|
| 1 | IGovernanceSwitch完全実装 | インターフェースコンプライアンステスト |
| 2 | 3モード切替動作 | モード切替テストPASS |
| 3 | Time Lock適用確認 | Time Lock検証テストPASS |
| 4 | 全テストPASS | `forge test` |
| 5 | Slither 0 Critical/High | `slither .` |
| 6 | ガスベンチマーク記録 | テスト結果に含む |

---

**END OF CURRENT PLAN**
