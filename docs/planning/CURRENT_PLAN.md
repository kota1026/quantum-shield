# Current Plan

> **Generated**: 2025-12-29 23:30 JST
> **Phase**: Phase 3 - L3 + Token + 完全分散化
> **Sub-Phase**: Phase 3.1 Foundation

---

## 対象チェックリスト

`docs/checklists/phase3.1.md`

---

## 📋 今回の対象タスク

### 🎯 主タスク: L3-001 l3-aegis プロジェクト構造設計 (IC-1) ⭐

> **IC-ID**: IC-1 (L3 Chain Infrastructure)
> **優先度**: P0 (最優先)
> **担当**: Rust Engineer

---

## 仕様書参照（必須）

> 参照: `docs/planning/SPEC_STRATEGY_BRIDGE.md`

### L3基盤技術選定（2025-12-28決議）

| 項目 | 決定 |
|------|------|
| L3構成 | 独自4ノードBFTチェーン |
| 実装 | l3-aegis (Rust) |
| 合意方式 | PBFT variant (f=1) |
| ブロックタイム | 5秒 |
| 暗号 | Dilithium-III (署名), SHA3-256 (ハッシュ) |
| ストレージ | RocksDB |
| P2P | Custom TCP + TLS 1.3 + mTLS |

### セキュリティ要件

| 要件 | 仕様書出典 | 実装方法 |
|------|----------|---------|
| Dilithium-III署名 | CP-1 / L3_CHAIN_SPEC §4.1 | `aegis-crypto/` クレート |
| SHA3-256ハッシュ | CP-1 / L3_CHAIN_SPEC §4.2 | `aegis-crypto/` クレート |
| PBFT合意 | L3_CHAIN_SPEC §3 | `aegis-consensus/` クレート |
| 4ノードBFT | L3_CHAIN_SPEC §2.1 | f=1, 3/4 quorum |
| 透明性 | CP-5 | 全操作をL3ブロックに記録 |

---

## 戦略準拠確認（Phase 3）

> 参照: `docs/planning/PHASE3_STRATEGY.md`

- [x] L3スタック: 独自L3 (l3-aegis) 前提
- [x] アーキテクチャ: 4ノードBFTチェーン
- [x] リスク緩和: 段階的実装（L3-001→L3-006）
- [x] CP-1準拠: Dilithium-III + SHA3-256

---

## L3基盤確認

> 参照: `docs/aegis/meetings/L3_INFRASTRUCTURE_FINAL_DECISION_2025-12-28.md`
> 参照: `docs/aegis/L3_CHAIN_SPECIFICATION.md`

- [x] 独自4ノードBFTチェーン前提か → Yes
- [x] l3-aegis (Rust) 実装か → Yes
- [x] SEQUENCES v2.0に準拠しているか → Yes
- [x] CP-1/CP-5を満たしているか → Yes

---

## IC完全性チェック（Phase 3必須）

> 参照: `docs/aegis/QUANTUM_SHIELD_UNIFIED_SPEC_v2.0.md` §Implementation Components

### 今回スコープのIC

| IC-ID | Component | タスク | Status |
|-------|-----------|--------|--------|
| **IC-1** | **L3 Chain Infrastructure** | **L3-001** | 🟡 **In Progress** |

### マスタ照合

- [x] 全IC-ID（IC-1〜IC-6）がPHASE3_PLANに対応セクションを持つ
- [x] 欠落ICなし

### タスク紐付け

- [x] 今回スコープのタスクにIC-IDを付与した
- [x] IC-1: L3-001 l3-aegis プロジェクト構造設計

---

## 前回レビュー課題（該当時のみ）

> CURRENT_STATE.mdより取得

| # | 重要度 | 課題 | 対策 |
|---|--------|------|------|
| - | - | Critical/Major課題なし | PIR-P3.1-001 PASS |

**Minor課題**:
| # | 課題 | 対策 |
|---|------|------|
| 1 | l3-aegis専用CI/CDワークフロー | L3-001と並行で対応 |

---

## 今回のスコープ

### 実装項目

- [ ] [L3-001] l3-aegis プロジェクト構造設計 (IC-1)
  - [ ] Rustプロジェクト構造設計（Cargo workspace）
  - [ ] モジュール分割設計
  - [ ] 依存クレート選定
  - [ ] CI/CD設定（Rust用GitHub Actions）

### モジュール構成

```
l3-aegis/
├── Cargo.toml                    # Workspace root
├── aegis-consensus/              # PBFT implementation
│   ├── Cargo.toml
│   └── src/
│       ├── lib.rs
│       ├── pbft.rs              # PBFT state machine
│       ├── message.rs           # Consensus messages
│       ├── view_change.rs       # View change logic
│       └── config.rs            # Consensus config
│
├── aegis-crypto/                 # Cryptographic primitives
│   ├── Cargo.toml
│   └── src/
│       ├── lib.rs
│       ├── dilithium.rs         # Dilithium-III signatures
│       ├── sha3.rs              # SHA3-256 hashing
│       └── keys.rs              # Key management
│
├── aegis-network/                # P2P networking
│   ├── Cargo.toml
│   └── src/
│       ├── lib.rs
│       ├── peer.rs              # Peer management
│       ├── transport.rs         # TCP + TLS 1.3
│       └── discovery.rs         # Peer discovery
│
├── aegis-storage/                # Persistent storage
│   ├── Cargo.toml
│   └── src/
│       ├── lib.rs
│       ├── rocksdb.rs           # RocksDB backend
│       ├── smt.rs               # Sparse Merkle Tree
│       └── block.rs             # Block storage
│
├── aegis-node/                   # Node binary
│   ├── Cargo.toml
│   └── src/
│       ├── main.rs              # Entry point
│       ├── node.rs              # Node implementation
│       ├── rpc.rs               # RPC server
│       └── config.rs            # Node config
│
├── aegis-cli/                    # CLI tools
│   ├── Cargo.toml
│   └── src/
│       ├── main.rs
│       └── commands/
│           ├── mod.rs
│           ├── keygen.rs        # Key generation
│           └── status.rs        # Node status
│
├── aegis-types/                  # Shared types
│   ├── Cargo.toml
│   └── src/
│       ├── lib.rs
│       ├── block.rs             # Block structure
│       ├── transaction.rs       # Transaction structure
│       └── hash.rs              # Hash types
│
└── docker/                       # Docker configuration
    ├── Dockerfile
    └── docker-compose.yml       # 4-node local testnet
```

### 依存クレート（候補）

| クレート | バージョン | 用途 |
|---------|-----------|------|
| `pqcrypto-dilithium` | latest | Dilithium-III実装 |
| `sha3` | 0.10.x | SHA3-256ハッシュ |
| `rocksdb` | 0.22.x | 永続ストレージ |
| `tokio` | 1.x | 非同期ランタイム |
| `serde` | 1.x | シリアライゼーション |
| `tonic` | 0.11.x | gRPC (RPC用) |
| `rustls` | 0.23.x | TLS 1.3 |
| `tracing` | 0.1.x | ログ・トレース |

### 参照ドキュメント

| 種類 | ドキュメント | 参照セクション |
|------|------------|---------------|
| **L3チェーン仕様** | `docs/aegis/L3_CHAIN_SPECIFICATION.md` | **全体** |
| **L3基盤決議** | `docs/aegis/meetings/L3_INFRASTRUCTURE_FINAL_DECISION_2025-12-28.md` | **全体** |
| 仕様書-戦略ブリッジ | `docs/planning/SPEC_STRATEGY_BRIDGE.md` | §1.5, §3.3 |
| Phase 3戦略 | `docs/planning/PHASE3_STRATEGY.md` | L3基盤決定 |
| Phase 3計画 | `docs/planning/PHASE3_PLAN.md` | §0 L3 Chain Infrastructure |
| 全体仕様 | `docs/aegis/QUANTUM_SHIELD_UNIFIED_SPEC_v2.0.md` | §IC |

---

## 成果物

| ファイル | 説明 | IC-ID |
|---------|------|-------|
| `l3-aegis/Cargo.toml` | Workspace root | IC-1 |
| `l3-aegis/aegis-*/Cargo.toml` | 各クレートマニフェスト | IC-1 |
| `l3-aegis/aegis-*/src/*.rs` | クレート基本構造 | IC-1 |
| `.github/workflows/l3-aegis-rust.yml` | Rust CI/CD | IC-1 |
| `l3-aegis/docker/Dockerfile` | Dockerイメージ定義 | IC-1 |
| `l3-aegis/docker/docker-compose.yml` | 4ノードtestnet構成 | IC-1 |
| `l3-aegis/README.md` | プロジェクト説明 | IC-1 |

---

## 実行順序

### Step 1: プロジェクト構造作成

1. `l3-aegis/Cargo.toml` (workspace root) 作成
2. 各クレートディレクトリ作成
   - `aegis-types/`
   - `aegis-crypto/`
   - `aegis-consensus/`
   - `aegis-network/`
   - `aegis-storage/`
   - `aegis-node/`
   - `aegis-cli/`
3. 各クレートの `Cargo.toml` 作成

### Step 2: 基本ファイル作成

1. 各クレートの `src/lib.rs` または `src/main.rs` 作成
2. モジュール宣言
3. 基本的な型定義（`aegis-types`）

### Step 3: 依存関係設定

1. `pqcrypto-dilithium` 統合テスト
2. `sha3` 統合テスト
3. `rocksdb` 統合テスト
4. `tokio` 非同期ランタイム設定

### Step 4: CI/CD設定

1. `.github/workflows/l3-aegis-rust.yml` 作成
   - Rust toolchain設定
   - `cargo build` / `cargo test`
   - `cargo clippy` (lint)
   - `cargo fmt --check` (format check)

### Step 5: Docker設定

1. `l3-aegis/docker/Dockerfile` 作成
2. `l3-aegis/docker/docker-compose.yml` 作成（4ノード構成）

### Step 6: ドキュメント作成

1. `l3-aegis/README.md` 更新
2. 各クレートのdocコメント

---

## Core Principles確認

- [x] CP-1: 完全量子耐性 - 違反なし（Dilithium-III, SHA3-256使用）
- [x] CP-2: Self-Custody - 違反なし（ユーザー鍵管理維持）
- [x] CP-3: Time Lock存在 - 違反なし（将来実装で対応）
- [x] CP-4: Slashing存在 - 違反なし（将来実装で対応）
- [x] CP-5: 透明性 - 違反なし（全操作をL3ブロックに記録）

---

## L3 Chain仕様確認

> 参照: `docs/aegis/L3_CHAIN_SPECIFICATION.md`

- [x] 4ノードBFTチェーン (f=1)
- [x] PBFT variant consensus
- [x] 5秒ブロックタイム
- [x] Dilithium-III consensus署名
- [x] SHA3-256 block hashing
- [x] RocksDBストレージ
- [x] TLS 1.3 + mTLS for P2P

---

## リスク・懸念事項

| # | リスク | 重要度 | 対策 |
|---|--------|--------|------|
| 1 | Rust PBFT実装の複雑性 | 🔴 High | 段階的実装、参考実装調査 |
| 2 | pqcrypto-dilithium の安定性 | 🟠 Medium | バージョン固定、広範なテスト |
| 3 | 4ノードコンセンサスのテスト | 🟠 Medium | Docker Composeでローカルテスト |
| 4 | ビルド時間 | 🟡 Low | キャッシュ活用、増分ビルド |

---

## 次のアクション

計画承認後、以下の順序で実行：

1. **03_impl.md**: L3-001 実装（Rustプロジェクト構造作成）
2. **04_review.md**: PIRレビュー (PIR-P3.1-002予定)
3. **L3-002**: Single-node dev mode実装へ移行

### L3-001 → L3-002 移行基準

- [ ] 全クレートが `cargo build` 成功
- [ ] 基本テストが `cargo test` 成功
- [ ] CI/CDパイプライン動作確認
- [ ] Docker Compose設定完了

---

## Track B (Solidity) 並行タスク

L3-001と並行して、以下を進行可能：

| # | タスク | 優先度 | 状態 |
|---|--------|--------|------|
| 1 | SETUP-003 Phase 2資産統合準備 | 🟠 High | ⬜ |
| 2 | l3-aegis Solidity CI/CDワークフロー | 🟠 High | ⬜ |

---

**END OF CURRENT PLAN**
