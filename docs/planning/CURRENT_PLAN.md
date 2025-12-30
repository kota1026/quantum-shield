# Current Plan

> **Generated**: 2025-12-30 11:00 JST
> **Phase**: 3 - L3 + Token + 完全分散化
> **Sub-Phase**: 3.1 Foundation

## 対象チェックリスト

`docs/checklists/phase3.1.md`

## 仕様書参照（必須）

> 参照: `docs/planning/SPEC_STRATEGY_BRIDGE.md`

### 対象Sequence

| Sequence | 実装Layer | 仕様書参照箇所 |
|----------|----------|---------------|
| L3 Chain Infrastructure | l3-aegis (Rust) | L3_CHAIN_SPECIFICATION §3 (合意プロトコル) |

### セキュリティ要件

| 要件 | 仕様書出典 | 実装方法 |
|------|----------|---------|
| Dilithium-III 合意署名 | CP-1 / L3_CHAIN_SPEC §3.6 | 既存aegis-crypto使用 |
| SHA3-256 メッセージハッシュ | CP-1 / L3_CHAIN_SPEC §8 | sha3クレート使用 |
| PBFT 3/4クォーラム | L3_CHAIN_SPEC §3.1 | f=1障害耐性 |
| TLS 1.3 通信暗号化 | L3_CHAIN_SPEC §4.4 | P2Pメッセージ保護 |

## 戦略準拠確認（Phase 3）

> 参照: `docs/planning/PHASE3_STRATEGY.md`

- [x] L3スタック: 独自L3 (l3-aegis) 前提
- [x] アーキテクチャ: Modular (Core/Governance/Token Layer)
- [x] リスク緩和: 監査計画、TVL制限、段階的導入
- [x] モード制約: Phase 3.1は基盤構築フェーズ

## L3基盤確認（Phase 3のL3関連タスク）

> 参照: `docs/aegis/meetings/L3_INFRASTRUCTURE_FINAL_DECISION_2025-12-28.md`

- [x] 独自4ノードBFTチェーン前提か
- [x] l3-aegis (Rust) の範囲内か
- [x] SEQUENCES v2.0に準拠しているか
- [x] CP-1/CP-5を満たしているか

## IC完全性チェック（Phase 3必須）

> 参照: `docs/aegis/QUANTUM_SHIELD_UNIFIED_SPEC_v2.0.md` §Implementation Components

### 今回スコープのIC

| IC-ID | Component | タスク | Status |
|-------|-----------|--------|--------|
| IC-1 | L3 Chain Infrastructure (4-node BFT) | L3-003 Basic PBFT consensus | 🟡 In Progress |

### マスタ照合

- [x] 全IC-ID（IC-1〜IC-6）がPHASE3_PLANに対応セクションを持つ
- [x] 欠落ICなし

### タスク紐付け

- [x] 今回スコープの全タスクにIC-IDを付与した
- [x] IC-ID不要タスクなし

## 前回レビュー課題

> CURRENT_STATE.mdより確認: 前回タスク完了

| # | 重要度 | 課題 | 対策 |
|---|--------|------|------|
| - | - | L3-002 PIR-P3.1-004 PASS完了。未解決課題なし | - |

## 今回のスコープ

### L3-003: Basic PBFT consensus実装

> **Reference**: `docs/aegis/L3_CHAIN_SPECIFICATION.md` §3

### 実装項目

#### PBFT状態マシン実装 (IMPL-001)

- [ ] [IMPL-001a] ConsensusState enum実装 (IC-1)
  - Idle: トランザクション待ち状態
  - PrePreparing: Pre-prepare送信/受信中
  - Preparing: Prepare投票中
  - Committing: Commit投票中
  - Committed: ブロック確定

- [ ] [IMPL-001b] ConsensusMessage enum実装 (IC-1)
  - PrePrepare { view, seq, block, signature }
  - Prepare { view, seq, block_hash, node_id, signature }
  - Commit { view, seq, block_hash, node_id, signature }
  - ViewChange { new_view, node_id, signature }

- [ ] [IMPL-001c] PBFTEngine struct実装 (IC-1)
  - view: u64 (現在のビュー番号)
  - seq: u64 (シーケンス番号)
  - state: ConsensusState
  - prepare_votes: HashMap<Hash256, Vec<NodeId>>
  - commit_votes: HashMap<Hash256, Vec<NodeId>>
  - pending_block: Option<Block>

#### Pre-prepare / Prepare / Commit フェーズ (IMPL-002)

- [ ] [IMPL-002a] Pre-prepare処理 (IC-1)
  - Primary選出ロジック（view % node_count）
  - ブロック提案作成
  - Dilithium-III署名付与
  - 全Backupへブロードキャスト

- [ ] [IMPL-002b] Prepare処理 (IC-1)
  - Pre-prepareメッセージ検証
  - Prepare投票生成
  - Dilithium-III署名付与
  - 全ノードへブロードキャスト
  - 2f+1 (=3) Prepare収集待ち

- [ ] [IMPL-002c] Commit処理 (IC-1)
  - 2f+1 Prepare確認後、Commit投票
  - Dilithium-III署名付与
  - 全ノードへブロードキャスト
  - 2f+1 (=3) Commit収集でブロック確定

- [ ] [IMPL-002d] ブロック確定処理 (IC-1)
  - ブロックをチェーンに追加
  - 状態更新（既存executor活用）
  - 署名集約（validator_signatures）
  - 次シーケンスへ遷移

#### View Change機構 (IMPL-003)

- [ ] [IMPL-003a] タイムアウト検知 (IC-1)
  - Primary障害検知（10秒タイムアウト）
  - 合意タイムアウト（10秒）
  - タイマー管理

- [ ] [IMPL-003b] ViewChange処理 (IC-1)
  - ViewChangeメッセージ生成
  - 2f+1 ViewChange収集
  - NewView生成（新Primary）
  - 状態リセット

#### 設定・パラメータ (IMPL-004)

- [ ] [IMPL-004a] コンセンサス設定 (IC-1)
  - f = 1 (障害耐性)
  - quorum = 3/4 (2f+1 = 3)
  - block_interval = 5秒
  - view_change_timeout = 10秒
  - prepare_timeout = 2秒
  - commit_timeout = 2秒

- [ ] [IMPL-004b] ノード構成 (IC-1)
  - node_count = 4
  - node_ids: [Node0, Node1, Node2, Node3]
  - 静的ピアリスト対応

#### メッセージ署名・検証 (IMPL-005)

- [ ] [IMPL-005a] 署名付与 (IC-1)
  - 各ConsensusMessageへDilithium-III署名
  - ノードIDと紐付け
  - シリアライズ方式統一

- [ ] [IMPL-005b] 署名検証 (IC-1)
  - 受信メッセージの署名検証
  - ノードID照合
  - 不正署名の拒否

### テスト項目

- [ ] [TEST-001] PBFT状態遷移テスト
  - Idle → PrePreparing → Preparing → Committing → Committed
  - 正常フロー確認

- [ ] [TEST-002] Pre-prepare処理テスト
  - Primary選出の正確性
  - メッセージ形式確認
  - 署名検証

- [ ] [TEST-003] Prepare/Commitクォーラムテスト
  - 2/4投票時: 未確定
  - 3/4投票時: 確定
  - 4/4投票時: 確定

- [ ] [TEST-004] View Changeテスト
  - タイムアウト発生時の遷移
  - 新Primary選出
  - 状態リセット確認

- [ ] [TEST-005] 署名検証テスト
  - 有効署名: 受理
  - 無効署名: 拒否
  - 署名なし: 拒否

- [ ] [TEST-006] CP-1準拠テスト
  - Dilithium-III使用確認
  - SHA3-256使用確認
  - 禁止アルゴリズム不使用確認

- [ ] [TEST-007] 設定値テスト
  - 5秒ブロック間隔
  - 10秒View Changeタイムアウト
  - 3/4クォーラム

### 参照ドキュメント

| 種類 | ドキュメント | 参照セクション |
|------|------------|---------------|
| 仕様書-戦略ブリッジ | `docs/planning/SPEC_STRATEGY_BRIDGE.md` | §1.5, §3, §10 |
| L3チェーン仕様 | `docs/aegis/L3_CHAIN_SPECIFICATION.md` | §3 (合意プロトコル) |
| L3基盤決議 | `docs/aegis/meetings/L3_INFRASTRUCTURE_FINAL_DECISION_2025-12-28.md` | 全体 |
| Phase 3.1チェックリスト | `docs/checklists/phase3.1.md` | Track A: L3-003 |
| 憲法 | `docs/constitution/CORE_PRINCIPLES.md` | 全体 |

## 成果物

| ファイル | 説明 | IC-ID |
|---------|------|-------|
| `l3-aegis/crates/aegis-consensus/src/pbft.rs` | PBFT状態マシン | IC-1 |
| `l3-aegis/crates/aegis-consensus/src/message.rs` | コンセンサスメッセージ定義 | IC-1 |
| `l3-aegis/crates/aegis-consensus/src/engine.rs` | PBFTエンジン実装 | IC-1 |
| `l3-aegis/crates/aegis-consensus/src/view_change.rs` | View Change処理 | IC-1 |
| `l3-aegis/crates/aegis-consensus/src/config.rs` | コンセンサス設定 | IC-1 |
| テストファイル群 | 単体・統合テスト | - |

## 実行順序

1. **IMPL-001**: PBFT状態マシン実装
   - ConsensusState/ConsensusMessage enum
   - PBFTEngine基本構造
   - 状態遷移ロジック

2. **IMPL-005**: メッセージ署名・検証
   - Dilithium-III署名付与
   - 署名検証ロジック
   - 既存aegis-crypto活用

3. **IMPL-002**: Pre-prepare/Prepare/Commitフェーズ
   - Primary選出
   - 3フェーズ処理実装
   - クォーラム判定

4. **IMPL-004**: 設定・パラメータ
   - タイムアウト値設定
   - ノード構成設定
   - 設定ファイル対応

5. **IMPL-003**: View Change機構
   - タイムアウト検知
   - ViewChange処理
   - 状態リセット

6. **TEST-001〜007**: テスト実装
   - 各機能の単体テスト
   - 統合テスト
   - CP-1準拠確認

## Core Principles確認

- [x] CP-1: 完全量子耐性 - Dilithium-III署名、SHA3-256ハッシュ使用
- [x] CP-2: Self-Custody - L3はユーザー秘密鍵を保持しない設計
- [x] CP-3: Time Lock存在 - L1で実装（L3は記録のみ）
- [x] CP-4: Slashing存在 - L1で実装（L3は記録のみ）
- [x] CP-5: 透明性 - 全コンセンサスメッセージがL3ブロックに記録可能

## Modular Architecture確認（Phase 3）

- [x] Core Layer: PBFTはL3チェーンのCore Layer基盤
- [x] Governance Layer: Phase 3.1後半で実装予定
- [x] Token Layer: Phase 3.1後半で実装予定
- [x] Layer間依存: 下位→上位依存なし

## リスク・懸念事項

| # | リスク | 重要度 | 緩和策 |
|---|--------|--------|--------|
| 1 | PBFT実装の複雑性 | 🟠 Medium | 段階的実装、詳細テスト |
| 2 | タイミング調整 | 🟡 Low | 設定可能なパラメータ |
| 3 | View Change の信頼性 | 🟠 Medium | 複数シナリオテスト |
| 4 | 署名サイズ（~3KB/署名） | 🟢 Low | 仕様通り（許容範囲） |

## L3-003 完了基準

| # | 基準 | 検証方法 |
|---|------|---------|
| 1 | PBFT状態遷移動作 | 単体テストPASS |
| 2 | Pre-prepare/Prepare/Commit動作 | 単体テストPASS |
| 3 | 3/4クォーラム達成でブロック確定 | 統合テストPASS |
| 4 | View Change動作 | 単体テストPASS |
| 5 | Dilithium-III署名動作 | 単体テストPASS |
| 6 | 5秒ブロックタイム設定 | 設定確認 |
| 7 | 全テストPASS | `cargo test -p aegis-consensus` |
| 8 | CP-1準拠 | 禁止アルゴリズム不使用確認 |

## 次のタスク（L3-003完了後）

| # | タスク | 優先度 | IC-ID |
|---|--------|--------|-------|
| 1 | L3-004: Dilithium-III consensus署名統合 | 🟠 High | IC-1 |
| 2 | L3-005: SHA3-256 block hashing実装 | 🟠 High | IC-1 |
| 3 | L3-006: 4-node local testnet構築 | 🟠 High | IC-1 |

---

**END OF CURRENT PLAN**
