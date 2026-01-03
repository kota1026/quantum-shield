# Current Plan

> **Generated**: 2026-01-03 10:00 JST
> **Phase**: Phase 3.3 - Decentralize + Testing
> **Sub-Phase**: Week 10 (DECEN-012~015)

---

## 対象チェックリスト

`docs/checklists/phase3.3.md`

---

## 仕様書参照（必須）

> 参照: `docs/planning/SPEC_STRATEGY_BRIDGE.md`

### 対象Sequence

| Sequence | 実装Layer | 仕様書参照箇所 |
|----------|----------|---------------|
| #2 | Core | SEQUENCES §Unlock (Normal Path) - Sequencer署名 |
| #5 | Core + Governance | SEQUENCES §Prover Registration - Sequencer登録 |
| #6 | Core + Governance | SEQUENCES §Prover Exit - Sequencer退出 |

### セキュリティ要件

| 要件 | 仕様書出典 | 実装方法 |
|------|----------|---------|
| Sequencer rotation | L3_CHAIN_SPEC §9 | ラウンドロビン + VRFベース選出 |
| Stake requirement | UNIFIED_SPEC Phase 2+ | $500K QS minimum stake |
| Slashing | SEQ#4 | Quadratic slashing (N²×10%) |
| Failover | L3_CHAIN_SPEC §3 | 10秒タイムアウト + View Change |

---

## 戦略準拠確認（Phase 3）

> 参照: `docs/planning/PHASE3_STRATEGY.md`

- [x] L3スタック: 独自L3 (l3-aegis) 前提
- [x] アーキテクチャ: Modular (Core/Governance/Token Layer)
- [x] リスク緩和: Multi-sequencer で単一障害点回避
- [x] モード制約: Governance ON時はsequencer permissionless参加可能

---

## L3基盤確認（Phase 3のL3関連タスク）

> 参照: `docs/aegis/meetings/L3_INFRASTRUCTURE_FINAL_DECISION_2025-12-28.md`

- [x] 独自4ノードBFTチェーン前提か → YES
- [x] l3-aegis (Rust) の範囲内か → YES（Rust実装）
- [x] SEQUENCES v2.0に準拠しているか → YES
- [x] CP-1/CP-5を満たしているか → YES（SHA3-256、Dilithium使用）

---

## IC完全性チェック（Phase 3必須）

> 参照: `docs/aegis/QUANTUM_SHIELD_UNIFIED_SPEC_v2.0.md` §Implementation Components

### 今回スコープのIC

| IC-ID | Component | タスク | Status |
|-------|-----------|--------|--------|
| IC-3 | Sequencer | DECEN-012~015 | 🟡 In Progress |

### マスタ照合

- [x] 全IC-ID（IC-1〜IC-5）がPHASE3_PLANに対応セクションを持つ
- [x] 欠落ICなし（IC-6は不要：CEO指示）

### タスク紐付け

- [x] 今回スコープの全タスクにIC-IDを付与した
- [x] IC-ID不要タスクは理由を明記した

---

## 前回レビュー課題

> PIR-P3.3-001 PASS (2026-01-02)

**前回までの完了事項**:
- DECEN-001~004: 4BFT Production Readiness ✅ PASS
- DECEN-005~008: Security Council veQS選出 ✅ PASS  
- DECEN-009~011: Governance ON/OFF ✅ PASS

**ブロッカー/懸念事項**:
| # | 懸念 | 重要度 | 対応 |
|---|------|--------|------|
| - | なし（前回PIR全PASS） | - | - |

---

## 今回のスコープ

### 実装項目

| Task ID | 内容 | IC | 優先度 | 詳細 |
|---------|------|-----|:------:|------|
| **DECEN-012** | Sequencer rotation production | IC-3 | 🔴 P0 | ラウンドロビン選出、epoch-based rotation |
| **DECEN-013** | Sequencer staking requirements | IC-3 | 🟠 High | $500K QS minimum、stake管理 |
| **DECEN-014** | Sequencer slashing integration | IC-3 | 🟠 High | 不正行為検知、Quadratic slashing |
| **DECEN-015** | Multi-sequencer failover | IC-3 | 🟠 High | 障害検知、自動フェイルオーバー |

### 実装詳細

#### DECEN-012: Sequencer Rotation Production

**ファイル**: `l3-aegis/crates/aegis-sequencer/src/rotation.rs`

機能:
- `SequencerRotation` struct: epoch管理、現在のsequencer追跡
- `rotate()`: 次のsequencerへのローテーション
- `get_current_sequencer()`: 現在のsequencer取得
- `is_my_turn()`: 自分のターン判定
- VRF-based selection for fairness

```rust
pub struct SequencerRotation {
    pub current_epoch: u64,
    pub current_sequencer: NodeId,
    pub sequencer_pool: Vec<SequencerInfo>,
    pub epoch_duration_blocks: u64,
    pub last_rotation_block: u64,
}
```

#### DECEN-013: Sequencer Staking Requirements

**ファイル**: `l3-aegis/src/sequencer/SequencerStaking.sol`

機能:
- `stake(amount)`: QSトークンをステーク
- `unstake()`: アンステーク開始（7日unbonding）
- `withdraw()`: unbonding後の引き出し
- `getStake(sequencer)`: ステーク量取得
- `isActiveSequencer(addr)`: アクティブ判定

```solidity
uint256 public constant MINIMUM_STAKE = 500_000 * 1e18; // $500K in QS
uint256 public constant UNBONDING_PERIOD = 7 days;
```

#### DECEN-014: Sequencer Slashing Integration

**ファイル**: `l3-aegis/src/sequencer/SequencerSlashing.sol`

機能:
- `slash(sequencer, evidence)`: スラッシング実行
- `reportMisbehavior(sequencer, evidence)`: 不正報告
- `calculateSlashAmount()`: Quadratic計算 (N²×10%)
- GovernanceSwitch統合（Governance ONでスラッシュ提案）

スラッシュ条件:
- Double signing（同一高さで複数ブロック署名）
- Censorship（特定トランザクションの意図的排除）
- Downtime（連続N個のブロック欠落）

#### DECEN-015: Multi-sequencer Failover

**ファイル**: `l3-aegis/crates/aegis-sequencer/src/failover.rs`

機能:
- `FailoverManager`: 障害検知と切り替え管理
- `detect_failure()`: sequencer障害検知
- `trigger_failover()`: フェイルオーバー実行
- `notify_rotation()`: ノードへの通知

タイムアウト設定:
- Block production timeout: 10秒（L3_CHAIN_SPEC §3.4準拠）
- Failover trigger: 2連続ミス後

### テスト項目

| Test ID | 内容 | 対象 |
|---------|------|------|
| TEST-SEQ-001 | Sequencer rotation正常系 | DECEN-012 |
| TEST-SEQ-002 | Sequencer rotation異常系（障害時切り替え） | DECEN-012, 015 |
| TEST-SEQ-003 | Staking lifecycle（stake→unstake→withdraw） | DECEN-013 |
| TEST-SEQ-004 | Minimum stake enforcement | DECEN-013 |
| TEST-SEQ-005 | Slashing conditions（double sign） | DECEN-014 |
| TEST-SEQ-006 | Slashing calculation（quadratic） | DECEN-014 |
| TEST-SEQ-007 | Failover trigger timing | DECEN-015 |
| TEST-SEQ-008 | Multi-sequencer E2E（3台構成） | All |

### 参照ドキュメント

| 種類 | ドキュメント | 参照セクション |
|------|------------|---------------|
| 仕様書-戦略ブリッジ | `docs/planning/SPEC_STRATEGY_BRIDGE.md` | §3, §5, §7 |
| Sequence仕様 | `docs/aegis/QUANTUM_SHIELD_SEQUENCES_v2.0.md` | #2, #5, #6 |
| 全体仕様 | `docs/aegis/QUANTUM_SHIELD_UNIFIED_SPEC_v2.0.md` | §Sequencer |
| 戦略 | `docs/planning/PHASE3_STRATEGY.md` | Core Layer設計 |
| L3基盤決議 | `docs/aegis/meetings/L3_INFRASTRUCTURE_FINAL_DECISION_2025-12-28.md` | 全体 |
| L3詳細仕様 | `docs/aegis/L3_CHAIN_SPECIFICATION.md` | §3, §9 |
| Phase 3計画 | `docs/planning/PHASE3_PLAN.md` | §Sequencer |

---

## 成果物

| ファイル | 説明 | IC-ID |
|---------|------|-------|
| `l3-aegis/crates/aegis-sequencer/src/rotation.rs` | Sequencer rotation logic | IC-3 |
| `l3-aegis/crates/aegis-sequencer/src/failover.rs` | Failover manager | IC-3 |
| `l3-aegis/src/sequencer/SequencerStaking.sol` | Staking contract | IC-3 |
| `l3-aegis/src/sequencer/SequencerSlashing.sol` | Slashing contract | IC-3 |
| `l3-aegis/src/interfaces/ISequencerStaking.sol` | Staking interface | IC-3 |
| `l3-aegis/src/interfaces/ISequencerSlashing.sol` | Slashing interface | IC-3 |
| `l3-aegis/crates/aegis-sequencer/tests/rotation_test.rs` | Rust rotation tests | - |
| `l3-aegis/crates/aegis-sequencer/tests/failover_test.rs` | Rust failover tests | - |
| `l3-aegis/test/sequencer/SequencerStaking.t.sol` | Solidity staking tests | - |
| `l3-aegis/test/sequencer/SequencerSlashing.t.sol` | Solidity slashing tests | - |

---

## 実行順序

### Day 1-2: DECEN-012 Sequencer Rotation

1. `rotation.rs` の基本構造実装
2. Epoch管理とsequencer選出ロジック
3. VRF統合（既存Chainlink VRF活用）
4. Unit tests作成・実行

### Day 3-4: DECEN-013 Sequencer Staking

1. `ISequencerStaking.sol` インターフェース定義
2. `SequencerStaking.sol` 実装
   - stake/unstake/withdraw
   - minimum stake enforcement
   - unbonding period管理
3. Unit tests作成・実行

### Day 5-6: DECEN-014 Sequencer Slashing

1. `ISequencerSlashing.sol` インターフェース定義
2. `SequencerSlashing.sol` 実装
   - slashing条件定義
   - quadratic計算
   - GovernanceSwitch統合
3. Unit tests作成・実行

### Day 7-8: DECEN-015 Failover + Integration

1. `failover.rs` 実装
   - 障害検知ロジック
   - フェイルオーバートリガー
   - rotation.rs との統合
2. E2E tests作成・実行
3. 全テスト実行・確認

### Day 9: レビュー準備

1. 全テスト再実行
2. Slither静的解析
3. 04_review.md用ドキュメント準備
4. PIR-P3.3-002準備

---

## Core Principles確認

- [x] CP-1: 完全量子耐性 - SHA3-256ハッシュ、Dilithium署名使用、keccak256禁止
- [x] CP-2: Self-Custody - Sequencerはユーザー秘密鍵にアクセスしない
- [x] CP-3: Time Lock存在 - 7日unbonding period
- [x] CP-4: Slashing存在 - Quadratic slashing (N²×10%)
- [x] CP-5: 透明性 - 全操作がL3ブロックに記録、Event発行

---

## Modular Architecture確認（Phase 3）

- [x] Core Layer: Sequencer rotation/failover は Core Layer
- [x] Governance Layer: Slashing提案は Governance ON時に拡張
- [x] Token Layer: QSトークンステーキング（Token Layer ON前提）
- [x] Layer間依存: Token→Core 依存のみ（下位→上位依存なし）

---

## リスク・懸念事項

| # | リスク | 重要度 | 緩和策 |
|---|--------|--------|--------|
| 1 | Sequencer中央集権化 | 🟠 MEDIUM | Multi-sequencer rotation で分散化 |
| 2 | Slashing計算ミス | 🟠 MEDIUM | Quadratic計算のfuzz test |
| 3 | Failover遅延 | 🟡 LOW | 10秒タイムアウト設定 |
| 4 | Stake locked期間の長さ | 🟡 LOW | 7日unbondingは業界標準 |

---

## 想定所要時間

| 項目 | 時間 |
|------|------|
| DECEN-012 | 2日 |
| DECEN-013 | 2日 |
| DECEN-014 | 2日 |
| DECEN-015 + Integration | 2日 |
| レビュー準備 | 1日 |
| **合計** | **9日** |

---

**END OF CURRENT PLAN**
