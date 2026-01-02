# Current Plan

> **Generated**: 2026-01-03 01:00 JST
> **Phase**: 3.3 (Decentralize + Testing)
> **Sub-Phase**: Week 10

---

## 対象チェックリスト

`docs/checklists/phase3.3.md`

---

## 仕様書参照（必須）

> 参照: `docs/planning/SPEC_STRATEGY_BRIDGE.md`

### 対象Sequence

| Sequence | 実装Layer | 仕様書参照箇所 |
|----------|----------|---------------|
| #2 | Core | SEQUENCES §Unlock - Sequencer役割 |
| #5 | Core + Governance | SEQUENCES §Prover Registration - 署名期限・VRF選出 |
| #6 | Core + Governance | SEQUENCES §Prover Exit - Unbonding |

### セキュリティ要件

| 要件 | 仕様書出典 | 実装方法 |
|------|----------|---------|
| 署名期限5分 | SEQ#2 Step4 | Rotation timeout設定 |
| VRF選出 | SEQ#2 Step2-3 | Chainlink VRF統合 |
| Unbonding期間7日 | SEQ#6 | Sequencer退出時のlockup |
| Slashing対象維持 | SEQ#6 | Unbonding中もslash対象 |
| 99.5% SLA | UNIFIED §Prover仕様 | 稼働率監視・自動rotation |

---

## 戦略準拠確認（Phase 3）

> 参照: `docs/planning/PHASE3_STRATEGY.md`

- [x] L3スタック: 独自L3 (l3-aegis) 前提
- [x] アーキテクチャ: Modular (Core/Governance/Token Layer)
- [ ] リスク緩和: Multi-sequencer対応によるSPOF解消
- [x] モード制約: CENTRALIZED→DECENTRALIZED段階的移行対応

---

## L3基盤確認（Phase 3のL3関連タスク）

> 参照: `docs/aegis/meetings/L3_INFRASTRUCTURE_FINAL_DECISION_2025-12-28.md`

- [x] 独自4ノードBFTチェーン前提か
- [x] l3-aegis (Rust) の範囲内か
- [x] SEQUENCES v2.0に準拠しているか
- [x] CP-1/CP-5を満たしているか

---

## IC完全性チェック（Phase 3必須）

> 参照: `docs/aegis/QUANTUM_SHIELD_UNIFIED_SPEC_v2.0.md` §Implementation Components

### 今回スコープのIC

| IC-ID | Component | タスク | Status |
|-------|-----------|--------|--------|
| IC-3 | Sequencer | DECEN-012~015 | 🟡 In Progress |

### マスタ照合

- [x] 全IC-ID（IC-1〜IC-5, IC-7）がPHASE3_PLANに対応セクションを持つ
- [x] 欠落ICなし（IC-6は不要：CEO指示）

### タスク紐付け

- [x] 今回スコープの全タスクにIC-IDを付与した
- [x] IC-ID不要タスクは理由を明記した

---

## 前回レビュー課題（該当時のみ）

> CURRENT_STATE.mdより - 前回PIR-P3.3-001 PASS

| # | 重要度 | 課題 | 対策 |
|---|--------|------|------|
| - | - | 前回PIR PASSにつき未解決課題なし | - |

---

## 今回のスコープ

### 実装項目

| Task ID | 内容 | IC-ID | 優先度 |
|---------|------|-------|--------|
| DECEN-012 | Multi-sequencer rotation | IC-3 | 🔴 P0 |
| DECEN-013 | Sequencer staking requirements | IC-3 | 🟠 High |
| DECEN-014 | Sequencer slashing integration | IC-3 | 🟠 High |
| DECEN-015 | Multi-sequencer failover | IC-3 | 🟠 High |

### DECEN-012: Multi-sequencer rotation

**目的**: 複数Sequencerによるローテーションメカニズムの実装

**要件**:
- Sequencer登録・退出API
- ラウンドロビンまたはStake重み付きローテーション
- 現在のActiveSequencer取得
- Epoch単位でのrotation（例: 1000ブロックごと）

**実装ファイル**:
- `l3-aegis/src/sequencer/SequencerRegistry.sol` - 登録・管理
- `l3-aegis/src/sequencer/SequencerRotation.sol` - ローテーションロジック
- `l3-aegis/crates/aegis-sequencer/src/rotation.rs` - Rust側rotation

**テスト**:
- `l3-aegis/test/sequencer/SequencerRotation.t.sol`

### DECEN-013: Sequencer staking requirements

**目的**: Sequencer登録に必要なStake要件の実装

**要件**:
- 最低Stake額: $500K相当（$QS or ETH）
- Stake増減API
- Stake不足時の自動inactive化
- Delegated Stake対応（$50K最低）

**実装ファイル**:
- `l3-aegis/src/sequencer/SequencerStaking.sol`
- `l3-aegis/src/interfaces/ISequencerStaking.sol`

**テスト**:
- `l3-aegis/test/sequencer/SequencerStaking.t.sol`

### DECEN-014: Sequencer slashing integration

**目的**: 不正Sequencerのスラッシングメカニズム

**要件**:
- Double-signing検出・slash
- Downtime（SLA違反）検出・slash
- Slashing率: Quadratic N² × 10%（Proverと同等）
- Slash報酬配分: Challenger 60%, Insurance 20%, Burn 20%
- 既存CoreSlashing.solとの統合

**実装ファイル**:
- `l3-aegis/src/sequencer/SequencerSlashing.sol`
- `l3-aegis/src/interfaces/ISequencerSlashing.sol`

**テスト**:
- `l3-aegis/test/sequencer/SequencerSlashing.t.sol`

### DECEN-015: Multi-sequencer failover

**目的**: Sequencer障害時の自動フェイルオーバー

**要件**:
- Heartbeat監視（30秒間隔）
- 3回連続失敗で自動rotation
- 障害Sequencerの一時停止
- 復旧後の再登録フロー
- 強制包含（24時間）保証

**実装ファイル**:
- `l3-aegis/crates/aegis-sequencer/src/failover.rs`
- `l3-aegis/src/sequencer/SequencerHealth.sol`

**テスト**:
- `l3-aegis/test/sequencer/SequencerFailover.t.sol`
- `l3-aegis/crates/aegis-sequencer/tests/failover_test.rs`

---

### テスト項目

| Task ID | 内容 | テスト数（予定） |
|---------|------|-----------------|
| TEST-SEQ-001 | Sequencer rotation E2E | 6 |
| TEST-SEQ-002 | Staking requirements | 8 |
| TEST-SEQ-003 | Slashing integration | 10 |
| TEST-SEQ-004 | Failover scenarios | 8 |

---

### 参照ドキュメント

| 種類 | ドキュメント | 参照セクション |
|------|------------|---------------|
| 仕様書-戦略ブリッジ | `docs/planning/SPEC_STRATEGY_BRIDGE.md` | §3, §5, §7 |
| Sequence仕様 | `docs/aegis/QUANTUM_SHIELD_SEQUENCES_v2.0.md` | #2, #5, #6 |
| 全体仕様 | `docs/aegis/QUANTUM_SHIELD_UNIFIED_SPEC_v2.0.md` | §Prover仕様, §IC |
| 戦略 | `docs/planning/PHASE3_STRATEGY.md` | §Core Layer設計 |
| L3基盤決議 | `docs/aegis/meetings/L3_INFRASTRUCTURE_FINAL_DECISION_2025-12-28.md` | 全体 |
| L3詳細仕様 | `docs/aegis/L3_CHAIN_SPECIFICATION.md` | §Sequencer |
| Phase 3計画 | `docs/planning/PHASE3_PLAN.md` | §IC-3 |
| Phase 3.3チェックリスト | `docs/checklists/phase3.3.md` | §A4 Multi-Sequencer |

---

## 成果物

| ファイル | 説明 | IC-ID |
|---------|------|-------|
| `l3-aegis/src/sequencer/SequencerRegistry.sol` | Sequencer登録・管理 | IC-3 |
| `l3-aegis/src/sequencer/SequencerRotation.sol` | ローテーションロジック | IC-3 |
| `l3-aegis/src/sequencer/SequencerStaking.sol` | Stake管理 | IC-3 |
| `l3-aegis/src/sequencer/SequencerSlashing.sol` | スラッシング | IC-3 |
| `l3-aegis/src/sequencer/SequencerHealth.sol` | ヘルスチェック | IC-3 |
| `l3-aegis/src/interfaces/ISequencerRegistry.sol` | インターフェース | IC-3 |
| `l3-aegis/src/interfaces/ISequencerStaking.sol` | インターフェース | IC-3 |
| `l3-aegis/src/interfaces/ISequencerSlashing.sol` | インターフェース | IC-3 |
| `l3-aegis/crates/aegis-sequencer/src/rotation.rs` | Rust rotation | IC-3 |
| `l3-aegis/crates/aegis-sequencer/src/failover.rs` | Rust failover | IC-3 |
| `l3-aegis/test/sequencer/SequencerRotation.t.sol` | テスト | - |
| `l3-aegis/test/sequencer/SequencerStaking.t.sol` | テスト | - |
| `l3-aegis/test/sequencer/SequencerSlashing.t.sol` | テスト | - |
| `l3-aegis/test/sequencer/SequencerFailover.t.sol` | テスト | - |
| `l3-aegis/crates/aegis-sequencer/tests/failover_test.rs` | Rustテスト | - |

---

## 実行順序

### Day 1-2: DECEN-012 (Sequencer Rotation)

1. `ISequencerRegistry.sol` インターフェース定義
2. `SequencerRegistry.sol` 実装
   - `register(address, bytes sphincsKey, uint256 stake)`
   - `deregister(address)`
   - `getActiveSequencers()` → address[]
   - `getCurrentSequencer()` → address
3. `SequencerRotation.sol` 実装
   - `rotateSequencer()` - エポックベースrotation
   - `forceRotation()` - 緊急rotation（SC権限）
4. Rust側 `rotation.rs` 実装
   - `RotationManager` struct
   - `next_sequencer()` → Address
5. テスト作成・実行

### Day 3-4: DECEN-013 (Staking Requirements)

1. `ISequencerStaking.sol` インターフェース定義
2. `SequencerStaking.sol` 実装
   - `stake(uint256 amount)` - Stake追加
   - `unstake(uint256 amount)` - Stake引き出し（7日unbonding）
   - `getStake(address)` → uint256
   - `isEligible(address)` → bool
   - `MINIMUM_STAKE` = 500_000e18 ($500K)
   - `MINIMUM_DELEGATED_STAKE` = 50_000e18 ($50K)
3. TokenSwitch統合（$QS or ETH選択）
4. テスト作成・実行

### Day 5-6: DECEN-014 (Slashing Integration)

1. `ISequencerSlashing.sol` インターフェース定義
2. `SequencerSlashing.sol` 実装
   - `reportDoubleSign(bytes proof)` - Double-signing報告
   - `reportDowntime(address sequencer)` - Downtime報告
   - `calculateSlash(uint256 stake, uint256 violations)` - Quadratic計算
   - `distributeSlash(uint256 amount)` - 配分（60/20/20）
3. 既存 `CoreSlashing.sol` との統合
4. テスト作成・実行

### Day 7-8: DECEN-015 (Failover)

1. `SequencerHealth.sol` 実装
   - `heartbeat()` - Sequencerからの生存報告
   - `checkHealth(address)` → bool
   - `HEARTBEAT_INTERVAL` = 30 seconds
   - `MAX_MISSED_HEARTBEATS` = 3
2. Rust側 `failover.rs` 実装
   - `FailoverManager` struct
   - `detect_failure()` → Option<Address>
   - `trigger_failover()` → Result
3. 強制包含保証（24時間）
4. テスト作成・実行

### Day 9: 統合テスト・PIR準備

1. 全コントラクト統合テスト
2. E2Eシナリオテスト
3. Slither静的解析
4. ドキュメント更新
5. PIR-P3.3-002準備

---

## Core Principles確認

- [x] CP-1: 完全量子耐性 - 違反なし（SPHINCS+, SHA3-256使用）
- [x] CP-2: Self-Custody - 違反なし（ユーザー鍵管理不変）
- [x] CP-3: Time Lock存在 - 違反なし（Unbonding 7日維持）
- [x] CP-4: Slashing存在 - 違反なし（Quadratic Slashing実装）
- [x] CP-5: 透明性 - 違反なし（全操作オンチェーン記録）

---

## Modular Architecture確認（Phase 3）

- [x] Core Layer: CP保護機構含む（Slashing, Time Lock）
- [x] Governance Layer: ON/OFF切替可能（Sequencer承認方式切替）
- [x] Token Layer: ON/OFF切替可能（Stake通貨切替）
- [x] Layer間依存: 下位→上位依存なし

---

## リスク・懸念事項

| # | リスク | 重要度 | 対策 |
|---|--------|--------|------|
| 1 | Multi-sequencer統合の複雑性 | 🟠 Medium | 段階的実装、各段階でテスト |
| 2 | 既存Sequencer実装との互換性 | 🟠 Medium | インターフェース先行定義 |
| 3 | Failover時のトランザクション損失 | 🟠 Medium | 強制包含24時間保証 |
| 4 | Slashing攻撃ベクトル | 🟠 Medium | Challenge Bond必須化 |

---

## 成功基準

| 基準 | 条件 | 目標 |
|------|------|------|
| DECEN-012完了 | Rotation機能実装+テストPASS | ✅ |
| DECEN-013完了 | Staking機能実装+テストPASS | ✅ |
| DECEN-014完了 | Slashing統合+テストPASS | ✅ |
| DECEN-015完了 | Failover実装+テストPASS | ✅ |
| 全テスト | 32+ tests PASS | ✅ |
| Slither | High/Medium = 0 | ✅ |
| CP準拠 | CP-1〜5全て準拠 | ✅ |

---

**END OF CURRENT PLAN**
