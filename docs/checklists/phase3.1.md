# Phase 3.1 Checklist: Foundation

> **期間**: Month 10-12
> **目標**: l3-aegis L3チェーン基盤開発 + Modular Architecture基盤実装
> **前提**: Phase 3 Strategy承認済み (`docs/planning/PHASE3_STRATEGY.md`)

---

## 📋 前提条件チェック

- [x] Phase 2完了確認（628テスト全PASS）
- [x] Phase 3戦略決議v3.0承認確認
- [x] L3基盤技術選定決議確認（2025-12-28）
- [ ] 開発ブランチ作成（`dev/phase3-l3-aegis`）

---

## 🏗️ Phase 3.1 構造

Phase 3.1は2つの並行トラックで進行：

```
Phase 3.1 Foundation
├── Track A: L3 Chain (Rust) - IC-1 ⭐ 最優先
│   └── l3-aegis ブロックチェーン基盤実装
│       ├── L3-001〜L3-006: コア実装
│       └── 目標: 4ノードローカルテストネット
│
└── Track B: L3 Contracts (Solidity) - IC-2,3,4
    └── Modular Architecture + Phase 2統合
        ├── SETUP-001〜003: 基盤セットアップ
        ├── CORE-001〜003: Core Layer実装
        └── PLUG-001〜003: Pluggable Layer実装
```

---

## ⛓️ Track A: L3 Chain Infrastructure (IC-1) ⭐

> **Reference**: `docs/aegis/L3_CHAIN_SPECIFICATION.md`
> **Decision**: `docs/aegis/meetings/L3_INFRASTRUCTURE_FINAL_DECISION_2025-12-28.md`

### Week 1-4: L3チェーンコア実装

| # | タスク | 担当 | 状態 | PIR |
|---|--------|------|:----:|-----|
| L3-001 | l3-aegis プロジェクト構造設計 | Rust Engineer | ✅ | PIR-P3.1-002 PASS |
| L3-002 | Single-node dev mode実装 | Rust Engineer | ✅ | PIR-P3.1-004 PASS 🎉 |
| L3-003 | Basic PBFT consensus実装 | Rust Engineer | ⬜ | - |
| L3-004 | Dilithium-III consensus署名統合 | Crypto Engineer | ⬜ | - |
| L3-005 | SHA3-256 block hashing実装 | Crypto Engineer | ⬜ | - |
| L3-006 | 4-node local testnet構築 | DevOps | ⬜ | - |

### L3-001: l3-aegis プロジェクト構造設計 ✅ 完了 (2025-12-30)

- [x] Rustプロジェクト構造設計（Cargo workspace）
- [x] モジュール分割設計
  - [x] `aegis-consensus/` - PBFT実装
  - [x] `aegis-crypto/` - Dilithium, SHA3-256
  - [x] `aegis-network/` - P2P, TLS 1.3
  - [x] `aegis-storage/` - RocksDB, SMT
  - [x] `aegis-node/` - ノードバイナリ
  - [x] `aegis-cli/` - CLIツール
  - [x] `aegis-types/` - 共通型定義
  - [x] `aegis-core/` - 状態管理、ブロックビルダー
  - [x] `aegis-smt/` - Sparse Merkle Tree
- [x] 依存クレート選定
- [x] Docker設定（Dockerfile, docker-compose.yml）
- [x] ノード設定ファイル（node0-3.toml）
- [x] README.md

**テスト結果**: 69/69 PASS

| クレート | テスト数 | 結果 |
|---------|:--------:|:----:|
| aegis-cli | 4 | ✅ |
| aegis-consensus | 9 | ✅ |
| aegis-core | 5 | ✅ |
| aegis-crypto | 8 | ✅ |
| aegis-network | 8 | ✅ |
| aegis-node | 4 | ✅ |
| aegis-smt | 6 | ✅ |
| aegis-storage | 12 | ✅ |
| aegis-types | 13 | ✅ |

### L3-002: Single-node dev mode実装 ✅ 完了 (2025-12-30) 🎉

- [x] ブロック構造定義
- [x] トランザクション構造定義（4種: UnlockRequest, VRFResult, ProverSignature, L1Submit）
- [x] ステート管理基盤 (`aegis-core/src/state.rs`)
- [x] State Root計算 (SHA3-256)
- [x] Transaction Executor (`aegis-core/src/executor.rs`)
- [x] RocksDB統合
- [x] 単一ノード起動・停止 (`aegis-node/src/single_node.rs`)
- [x] 基本RPCエンドポイント (`aegis-node/src/rpc.rs`)
- [x] CLI実装 (`aegis-node/src/main.rs`)
- [x] CP-1準拠確認 (SHA3-256, Dilithium-III, 禁止アルゴリズム不使用)

**テスト結果**: 74/74 PASS

| クレート | テスト数 | 結果 |
|---------|:--------:|:----:|
| aegis-cli | 4 | ✅ |
| aegis-consensus | 9 | ✅ |
| aegis-core | 7 | ✅ |
| aegis-crypto | 8 | ✅ |
| aegis-network | 8 | ✅ |
| aegis-node | 7 | ✅ |
| aegis-smt | 6 | ✅ |
| aegis-storage | 12 | ✅ |
| aegis-types | 13 | ✅ |

**PIR-P3.1-004 詳細**:
- 判定基準: 14/14 クリア（基本6 + 仕様4 + L3基盤4）
- 11エージェント評価: 11/11 GO（全会一致）
- CP-1準拠: ✅ SHA3-256/Dilithium-III、禁止アルゴリズム不使用
- 仕様書準拠: ✅ L3_CHAIN_SPECIFICATION §5, §7, §10
- セキュリティ: ✅ Critical/Major問題なし

### L3-003: Basic PBFT consensus実装

- [ ] PBFT状態マシン実装
- [ ] Pre-prepare / Prepare / Commit フェーズ
- [ ] View change機構
- [ ] f=1 (3/4 quorum) 設定
- [ ] 5秒ブロックタイム設定
- [ ] コンセンサステスト

### L3-004: Dilithium-III consensus署名統合

- [ ] Dilithium-IIIライブラリ統合（pqcrypto-dilithium）
- [ ] ノード鍵生成
- [ ] ブロック署名
- [ ] 署名検証
- [ ] CP-1準拠確認テスト

### L3-005: SHA3-256 block hashing実装

- [ ] SHA3-256ライブラリ統合（sha3クレート）
- [ ] ブロックハッシュ計算
- [ ] トランザクションハッシュ計算
- [ ] Merkleルート計算
- [ ] CP-1準拠確認テスト

### L3-006: 4-node local testnet構築

- [ ] Docker Compose設定
- [ ] 4ノード構成（US-East, EU-West, Asia-SG, Reserve模擬）
- [ ] P2Pネットワーク接続
- [ ] コンセンサス動作確認
- [ ] ブロック生成確認
- [ ] 耐障害性テスト（1ノードダウン時）

### Track A 完了基準

| # | 基準 | 検証方法 |
|---|------|---------|
| 1 | Single-node起動・ブロック生成 | `cargo run --bin aegis-node` |
| 2 | 4-node consensus動作 | Docker Compose + ログ確認 |
| 3 | Dilithium-III署名検証 | 単体テスト PASS |
| 4 | SHA3-256ハッシュ動作 | 単体テスト PASS |
| 5 | 5秒ブロックタイム達成 | パフォーマンステスト |
| 6 | 1ノードダウン耐性 | 障害注入テスト |

---

## 🏗️ Track B: L3 Contracts (Solidity)

### Week 1-2: プロジェクト構造・基盤

#### SETUP-001: l3-aegis Solidity プロジェクト初期化 ✅ PIR-P3.1-001 PASS

- [x] `l3-aegis/` ディレクトリ構造作成
- [x] Foundry設定（foundry.toml）
- [x] 依存関係設定（Phase 2資産インポート）
- [x] CI/CD設定（GitHub Actions）

#### SETUP-002: Modular Architecture インターフェース定義 ✅ PIR-P3.1-001 PASS

- [x] `IGovernanceSwitch.sol` インターフェース作成
- [x] `ITokenSwitch.sol` インターフェース作成
- [x] `ICoreLayer.sol` インターフェース作成
- [x] `IConstitutionLock.sol` インターフェース作成
- [x] インターフェーステスト作成（16テスト）

#### SETUP-003: Phase 2資産統合準備

- [ ] STARKVerifier統合計画
- [ ] SHA3Hasher統合計画
- [ ] BatchVerifier統合計画
- [ ] 統合テスト計画作成

### Week 3-4: Core Layer基盤

#### CORE-001: State Manager基盤

- [ ] StateManager.sol 基本構造
- [ ] SHA3-256ステートハッシュ実装
- [ ] Merkleルート計算（Phase 2 SHA3Hasher活用）
- [ ] ステート管理テスト

#### CORE-002: STARK Verifier統合

- [ ] Phase 2 STARKVerifier移植
- [ ] l3-aegis環境への適応
- [ ] ガスベンチマーク
- [ ] 統合テスト

#### CORE-003: CP保護機構実装

- [ ] ConstitutionLock.sol 作成
- [ ] CP-1/2 immutable実装
- [ ] CP-3/4/5 supermajority guard実装
- [ ] CP保護テスト

### Week 5-6: Pluggable Layer基盤

#### PLUG-001: Governance Switch実装

- [ ] GovernanceSwitch.sol 作成
- [ ] CENTRALIZED モード実装
- [ ] MULTISIG モード実装
- [ ] DECENTRALIZED モードスタブ
- [ ] モード切替テスト

#### PLUG-002: Token Switch実装

- [ ] TokenSwitch.sol 作成
- [ ] DISABLED モード実装
- [ ] BASIC モードスタブ
- [ ] FULL モードスタブ
- [ ] モード切替テスト

#### PLUG-003: Layer間インターフェース

- [ ] Core ↔ Governance インターフェース
- [ ] Core ↔ Token インターフェース
- [ ] Governance ↔ Token インターフェース
- [ ] 結合テスト

---

## 📊 Week 7-8: 統合・テスト

### TEST-001: 網羅的モードテスト

- [ ] Core Only テスト
- [ ] Core + Governance(CENTRALIZED) テスト
- [ ] Core + Governance(MULTISIG) テスト
- [ ] Core + Token(DISABLED) テスト
- [ ] 全組み合わせマトリクステスト

### TEST-002: セキュリティテスト

- [ ] モード切替攻撃テスト
- [ ] 権限昇格テスト
- [ ] 権限降格テスト
- [ ] Re-entrancyテスト
- [ ] Slitherスキャン

### TEST-003: ガスベンチマーク

- [ ] Core Layer操作ガス計測
- [ ] モード切替ガス計測
- [ ] ターゲット値設定
- [ ] リグレッションテスト作成

---

## 📝 Week 9-10: ドキュメント・計画

### DOC-001: 技術ドキュメント

- [ ] Modular Architecture仕様書
- [ ] Core Layer API仕様
- [ ] Pluggable Layer API仕様
- [ ] 統合ガイド

### DOC-002: エコシステム計画（CBO担当）

- [ ] エコシステム構築戦略
- [ ] パートナー候補リスト
- [ ] マーケティング計画素案
- [ ] コミュニティ構築計画

### PLAN-001: Phase 3.2計画

- [ ] Bridge実装計画
- [ ] Sequencer実装計画
- [ ] 監査準備計画
- [ ] Phase 3.2チェックリスト作成

---

## ✅ Phase 3.1 完了基準

### 必須条件

| # | 基準 | 検証方法 |
|---|------|---------|
| 1 | **L3チェーン4-node動作** | Docker Compose テスト |
| 2 | **Dilithium-III署名動作** | Rust単体テスト PASS |
| 3 | **SHA3-256ハッシュ動作** | Rust単体テスト PASS |
| 4 | Core Layer基盤動作 | Solidity単体テストPASS |
| 5 | Pluggable Layer切替動作 | モード切替テストPASS |
| 6 | CP保護機構動作 | CP保護テストPASS |
| 7 | Phase 2資産統合完了 | 統合テストPASS |
| 8 | 全テスト100% PASS | `cargo test` + `forge test` |
| 9 | Slither警告なし（Critical/High） | `slither .` |

### 成果物

| # | 成果物 | パス |
|---|-------|------|
| 1 | **l3-aegis Rustコードベース** | `l3-aegis/rust/` |
| 2 | **4-node testnet構成** | `l3-aegis/docker/` |
| 3 | l3-aegis Solidityコード | `l3-aegis/src/` |
| 4 | テストスイート | `l3-aegis/test/` |
| 5 | Modular Architecture仕様 | `docs/specs/MODULAR_ARCHITECTURE.md` |
| 6 | エコシステム計画 | `docs/planning/ECOSYSTEM_PLAN.md` |
| 7 | Phase 3.2チェックリスト | `docs/checklists/phase3.2.md` |

---

## 🔗 参照ドキュメント

| ドキュメント | パス |
|------------|------|
| Phase 3戦略 | `docs/planning/PHASE3_STRATEGY.md` |
| **L3チェーン仕様** | `docs/aegis/L3_CHAIN_SPECIFICATION.md` |
| **L3基盤決議** | `docs/aegis/meetings/L3_INFRASTRUCTURE_FINAL_DECISION_2025-12-28.md` |
| Core Principles | `docs/constitution/CORE_PRINCIPLES.md` |
| PHASE3_PLAN | `docs/planning/PHASE3_PLAN.md` |
| 最終決議書 | `agents/meetings/phase3_strategy/round8_final/FINAL_RESOLUTION_v3.md` |

---

## ⚠️ リスク緩和策の進捗

Phase 3.1では以下の緩和策を開始：

| # | 緩和策 | Phase 3.1アクション |
|---|-------|-------------------|
| 1 | 複数回監査 | 監査会社選定開始 |
| 2 | 段階的TVL | 設計に組み込み |
| 3 | Bug Bounty | プログラム設計 |
| 4 | 形式検証 | 対象コード特定 |
| 5 | 網羅的テスト | テストマトリクス作成 |
| 6 | エコシステム | 計画策定 |

---

## 📊 進捗サマリー

### Track A: L3 Chain (Rust) - IC-1

| タスク | 状態 | PIR |
|--------|:----:|-----|
| L3-001 | ✅ | PIR-P3.1-002 PASS |
| L3-002 | ✅ | PIR-P3.1-004 PASS 🎉 |
| L3-003 | ⬜ | - |
| L3-004 | ⬜ | - |
| L3-005 | ⬜ | - |
| L3-006 | ⬜ | - |

### Track B: L3 Contracts (Solidity)

| タスク | 状態 | PIR |
|--------|:----:|-----|
| SETUP-001 | ✅ | PIR-P3.1-001 |
| SETUP-002 | ✅ | PIR-P3.1-001 |
| SETUP-003 | ⬜ | - |
| CORE-001 | ⬜ | - |
| CORE-002 | ⬜ | - |
| CORE-003 | ⬜ | - |
| PLUG-001 | ⬜ | - |
| PLUG-002 | ⬜ | - |
| PLUG-003 | ⬜ | - |
| TEST-001 | ⬜ | - |
| TEST-002 | ⬜ | - |
| TEST-003 | ⬜ | - |
| DOC-001 | ⬜ | - |
| DOC-002 | ⬜ | - |
| PLAN-001 | ⬜ | - |
