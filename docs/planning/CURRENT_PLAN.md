# Current Plan

> **Generated**: 2025-12-30 10:30 JST
> **Phase**: 3 - L3 + Token + 完全分散化
> **Sub-Phase**: 3.1 Foundation

## 対象チェックリスト

`docs/checklists/phase3.1.md`

## 仕様書参照（必須）

> 参照: `docs/planning/SPEC_STRATEGY_BRIDGE.md`

### 対象Sequence

| Sequence | 実装Layer | 仕様書参照箇所 |
|----------|----------|---------------|
| L3 Chain Infrastructure | l3-aegis (Rust) | L3_CHAIN_SPECIFICATION §7, §10 |

### セキュリティ要件

| 要件 | 仕様書出典 | 実装方法 |
|------|----------|---------|
| SHA3-256 ハッシュ | CP-1 / L3_CHAIN_SPEC §4.2 | sha3クレート使用 |
| Dilithium-III 署名 | CP-1 / L3_CHAIN_SPEC §4.1 | 既存aegis-crypto使用 |
| ブロック構造 | L3_CHAIN_SPEC §2 | BlockHeader/BlockBody実装 |
| トランザクション種別 | L3_CHAIN_SPEC §2.3 | 4種のTx型実装 |
| RocksDB統合 | L3_CHAIN_SPEC §5.2 | 既存aegis-storage活用 |

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
| IC-1 | L3 Chain Infrastructure (4-node BFT) | L3-002 Single-node dev mode | 🟡 In Progress |

### マスタ照合

- [x] 全IC-ID（IC-1〜IC-6）がPHASE3_PLANに対応セクションを持つ
- [x] 欠落ICなし

### タスク紐付け

- [x] 今回スコープの全タスクにIC-IDを付与した
- [x] IC-ID不要タスクなし

## 前回レビュー課題

> CURRENT_STATE.mdより確認: 未解決課題なし

| # | 重要度 | 課題 | 対策 |
|---|--------|------|------|
| - | - | 前回PIR-P3.1-002 PASS。未解決課題なし | - |

## 今回のスコープ

### L3-002: Single-node dev mode実装

> **Reference**: `docs/aegis/L3_CHAIN_SPECIFICATION.md` §7.1, §10

### 実装項目

- [ ] [IMPL-001] ブロック構造の実装強化 (IC-1)
  - BlockHeader/BlockBody のシリアライズ/デシリアライズ
  - ブロックハッシュ計算（SHA3-256）
  - ブロックバリデーション

- [ ] [IMPL-002] トランザクション構造の実装 (IC-1)
  - UnlockRequestTx 型
  - VRFResultTx 型
  - ProverSignatureTx 型
  - L1SubmitTx 型
  - トランザクションハッシュ計算

- [ ] [IMPL-003] ステート管理基盤 (IC-1)
  - 状態遷移ロジック
  - SMT (Sparse Merkle Tree) との統合
  - State Root計算

- [ ] [IMPL-004] RocksDB統合強化 (IC-1)
  - ブロック永続化
  - トランザクション永続化
  - 状態永続化

- [ ] [IMPL-005] 単一ノード起動・停止 (IC-1)
  - `--dev --single` モード実装
  - 合意スキップ（即時確定）
  - メモリ500MB以下制約

- [ ] [IMPL-006] 基本RPCエンドポイント (IC-1)
  - ブロック取得API
  - トランザクション送信API
  - 状態クエリAPI

### テスト項目

- [ ] [TEST-001] ブロック生成テスト
- [ ] [TEST-002] トランザクション処理テスト
- [ ] [TEST-003] 状態更新テスト
- [ ] [TEST-004] ノード起動・停止テスト
- [ ] [TEST-005] RPC統合テスト
- [ ] [TEST-006] CP-1準拠テスト（禁止アルゴリズム不使用）

### 参照ドキュメント

| 種類 | ドキュメント | 参照セクション |
|------|------------|---------------|
| 仕様書-戦略ブリッジ | `docs/planning/SPEC_STRATEGY_BRIDGE.md` | §1.5, §3, §10 |
| L3チェーン仕様 | `docs/aegis/L3_CHAIN_SPECIFICATION.md` | §2, §5, §7, §10 |
| L3基盤決議 | `docs/aegis/meetings/L3_INFRASTRUCTURE_FINAL_DECISION_2025-12-28.md` | 全体 |
| Phase 3.1チェックリスト | `docs/checklists/phase3.1.md` | Track A: L3-002 |
| 憲法 | `docs/constitution/CORE_PRINCIPLES.md` | 全体 |

## 成果物

| ファイル | 説明 | IC-ID |
|---------|------|-------|
| `l3-aegis/crates/aegis-types/src/block.rs` | ブロック構造強化 | IC-1 |
| `l3-aegis/crates/aegis-types/src/transaction.rs` | トランザクション4種実装 | IC-1 |
| `l3-aegis/crates/aegis-core/src/state.rs` | 状態管理実装 | IC-1 |
| `l3-aegis/crates/aegis-core/src/executor.rs` | トランザクション実行 | IC-1 |
| `l3-aegis/crates/aegis-node/src/single_node.rs` | シングルノードモード | IC-1 |
| `l3-aegis/crates/aegis-node/src/rpc.rs` | RPCサーバー | IC-1 |
| 各種テストファイル | 単体・統合テスト | - |

## 実行順序

1. **IMPL-001**: ブロック構造の実装強化
   - BlockHeader/BlockBodyのシリアライズ実装
   - SHA3-256によるブロックハッシュ計算
   - バリデーションロジック

2. **IMPL-002**: トランザクション構造の実装
   - 4種のトランザクション型定義
   - トランザクションハッシュ計算
   - tx_root（Merkle Root）計算

3. **IMPL-003**: ステート管理基盤
   - SMTとの統合
   - トランザクション適用による状態更新
   - State Root計算

4. **IMPL-004**: RocksDB統合強化
   - ブロック/Tx/状態の永続化
   - 既存aegis-storageの拡張

5. **IMPL-005**: 単一ノード起動・停止
   - `--dev --single` CLIオプション
   - 合意なしの即時ブロック確定
   - 軽量モード（メモリ制約）

6. **IMPL-006**: 基本RPCエンドポイント
   - JSON-RPCまたはgRPC
   - 基本クエリAPI
   - トランザクション送信API

7. **TEST-001〜006**: テスト実装
   - 各機能の単体テスト
   - 統合テスト
   - CP-1準拠確認

## Core Principles確認

- [x] CP-1: 完全量子耐性 - SHA3-256、Dilithium-III使用、禁止アルゴリズム不使用
- [x] CP-2: Self-Custody - L3はユーザー秘密鍵を保持しない設計
- [x] CP-3: Time Lock存在 - L1で実装（L3は記録のみ）
- [x] CP-4: Slashing存在 - L1で実装（L3は記録のみ）
- [x] CP-5: 透明性 - 全操作がL3ブロックに記録

## Modular Architecture確認（Phase 3）

- [x] Core Layer: L3チェーン基盤はCore Layerの基盤
- [x] Governance Layer: Phase 3.1後半で実装予定
- [x] Token Layer: Phase 3.1後半で実装予定
- [x] Layer間依存: 下位→上位依存なし

## リスク・懸念事項

| # | リスク | 重要度 | 緩和策 |
|---|--------|--------|--------|
| 1 | シングルノードモードの軽量化 | 🟡 Medium | メモリプロファイリング実施 |
| 2 | RPC設計の複雑性 | 🟢 Low | 最小限のAPIから開始 |
| 3 | 既存クレートとの統合 | 🟢 Low | L3-001で基盤構築済み |

## L3-002 完了基準

| # | 基準 | 検証方法 |
|---|------|---------|
| 1 | Single-node起動成功 | `cargo run --bin aegis-node -- --dev --single` |
| 2 | ブロック生成動作 | ログ出力確認 + テスト |
| 3 | トランザクション処理動作 | CLI経由でTx投入テスト |
| 4 | 状態更新動作 | SMT State Root変更確認 |
| 5 | RPC動作 | curl等でAPI呼び出しテスト |
| 6 | 全テストPASS | `cargo test` |
| 7 | CP-1準拠 | 禁止アルゴリズム不使用確認 |

---

**END OF CURRENT PLAN**
