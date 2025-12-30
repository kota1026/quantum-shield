# Phase 3.1 Checklist: Foundation

> **期間**: Month 10-12
> **目標**: l3-aegis L3チェーン基盤開発 + Modular Architecture基盤実装
> **前提**: Phase 3 Strategy承認済み (`docs/planning/PHASE3_STRATEGY.md`)

---

## 📋 前提条件チェック

- [x] Phase 2完了確認（628テスト全PASS）
- [x] Phase 3戦略決議v3.0承認確認
- [x] L3基盤技術選定決議確認（2025-12-28）
- [x] 開発ブランチ作成（`dev/phase2-native-stark`）

---

## 🏗️ Phase 3.1 構造

Phase 3.1は2つの並行トラックで進行：

```
Phase 3.1 Foundation
├── Track A: L3 Chain (Rust) - IC-1 ✅ COMPLETE 🎉
│   └── l3-aegis ブロックチェーン基盤実装
│       ├── L3-001〜L3-006: コア実装 ✅
│       └── 目標: 4ノードローカルテストネット ✅
│
└── Track B: L3 Contracts (Solidity) - IC-2,3,4
    └── Modular Architecture + Phase 2統合
        ├── SETUP-001〜003: 基盤セットアップ ✅
        ├── CORE-001〜003: Core Layer実装 🔄
        └── PLUG-001〜003: Pluggable Layer実装
```

---

## ⛓️ Track A: L3 Chain Infrastructure (IC-1) ✅ COMPLETE 🎉

> **Reference**: `docs/aegis/L3_CHAIN_SPECIFICATION.md`
> **Decision**: `docs/aegis/meetings/L3_INFRASTRUCTURE_FINAL_DECISION_2025-12-28.md`

### Week 1-4: L3チェーンコア実装

| # | タスク | 担当 | 状態 | PIR |
|---|--------|------|:----:|-----|
| L3-001 | l3-aegis プロジェクト構造設計 | Rust Engineer | ✅ | PIR-P3.1-002 PASS |
| L3-002 | Single-node dev mode実装 | Rust Engineer | ✅ | PIR-P3.1-004 PASS 🎉 |
| L3-003 | Basic PBFT consensus実装 | Rust Engineer | ✅ | PIR-P3.1-005 PASS 🎉 |
| L3-004 | Dilithium-III consensus署名統合 | Crypto Engineer | ✅ | (L3-003に含む) |
| L3-005 | SHA3-256 block hashing実装 | Crypto Engineer | ✅ | PIR-P3.1-006 PASS 🎉 |
| L3-006 | 4-node local testnet構築 | DevOps | ✅ | PIR-P3.1-007 PASS 🎉 |

**Track A 完了: 6/6 (100%) ✅**

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

#### SETUP-003: Phase 2資産統合準備 ✅ 完了 (2025-12-30)

- [x] `PHASE2_INTEGRATION_PLAN.md` 作成
- [x] STARKVerifier統合計画策定
- [x] SHA3Hasher統合計画策定
- [x] BatchVerifier統合計画策定
- [x] 統合テスト計画作成

### Week 3-4: Core Layer基盤

#### CORE-001: State Manager基盤 ✅ 完了・テスト検証済み (2025-12-30) 🎉

- [x] ICoreState.sol インターフェース定義
- [x] CoreState.sol 基本構造
- [x] SHA3-256ステートハッシュ実装（Phase 2 SHA3_256活用）
- [x] Sparse Merkle Tree統合（Phase 2 SparseMerkleTree活用）
- [x] Domain Separation (LEAF_DOMAIN, NODE_DOMAIN, STATE_ROOT_DOMAIN)
- [x] 包括的テストスイート (CoreState.t.sol)
- [x] ガスベンチマークテスト
- [x] **テスト実行検証済み: 32/32 PASS** ✅

**成果物**:

| ファイル | サイズ | 説明 |
|---------|--------|------|
| `l3-aegis/src/interfaces/ICoreState.sol` | 6,997 bytes | State管理インターフェース |
| `l3-aegis/src/core/CoreState.sol` | 7,870 bytes | CoreState実装 |
| `l3-aegis/test/CoreState.t.sol` | 12,987 bytes | 包括的テストスイート |

**テスト結果 (2025-12-30 22:28 JST)**:

| カテゴリ | テスト数 | 結果 |
|---------|:-------:|:----:|
| Constants Tests | 4 | ✅ |
| Hash Function Tests | 4 | ✅ |
| State Root Tests | 4 | ✅ |
| Leaf Computation Tests | 4 | ✅ |
| Merkle Proof Tests | 6 | ✅ |
| Gas Benchmark Tests | 4 | ✅ |
| Interface Compliance | 1 | ✅ |
| Fuzz Tests (256 runs each) | 3 | ✅ |
| Lock Inclusion Tests | 1 | ✅ |
| **合計** | **32** | ✅ **ALL PASS** |

**Gas Benchmarks (参考値)**:

| 操作 | Gas消費 | 備考 |
|------|---------|------|
| `calculateStateRoot` (10 entries) | ~4,037,288 | L3実行前提 |
| `computeLeaf` | ~1,615,168 | L3実行前提 |
| `hashNodes` | ~808,317 | L3実行前提 |
| `verifyInclusion` (depth 20) | ~16,441,280 | L3実行前提 |

**Commits**:
- `14883a2` feat(CORE-001): Add ICoreState interface
- `6107200` feat(CORE-001): Implement CoreState contract
- `0a067a4` test(CORE-001): Add CoreState comprehensive tests
- `4914b19` fix(CORE-001): Update CoreState import path
- `a535a12` fix(l3-aegis): Fix foundry.toml for proper dependency resolution

#### CORE-002: STARK Verifier統合 ⬜ 次のタスク

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

| # | 基準 | 検証方法 | 状態 |
|---|------|---------|:----:|
| 1 | **L3チェーン4-node動作** | Docker Compose テスト | ✅ |
| 2 | **Dilithium-III署名動作** | Rust単体テスト PASS | ✅ |
| 3 | **SHA3-256ハッシュ動作** | Rust単体テスト PASS | ✅ |
| 4 | Core Layer基盤動作 | Solidity単体テストPASS | 🔄 |
| 5 | Pluggable Layer切替動作 | モード切替テストPASS | ⬜ |
| 6 | CP保護機構動作 | CP保護テストPASS | ⬜ |
| 7 | Phase 2資産統合完了 | 統合テストPASS | 🔄 |
| 8 | 全テスト100% PASS | `cargo test` + `forge test` | 🔄 |
| 9 | Slither警告なし（Critical/High） | `slither .` | ⬜ |

### 成果物

| # | 成果物 | パス | 状態 |
|---|-------|------|:----:|
| 1 | **l3-aegis Rustコードベース** | `l3-aegis/crates/` | ✅ |
| 2 | **4-node testnet構成** | `l3-aegis/docker/` | ✅ |
| 3 | l3-aegis Solidityコード | `l3-aegis/src/` | 🔄 |
| 4 | テストスイート | `l3-aegis/test/` | 🔄 |
| 5 | Modular Architecture仕様 | `docs/specs/MODULAR_ARCHITECTURE.md` | ⬜ |
| 6 | エコシステム計画 | `docs/planning/ECOSYSTEM_PLAN.md` | ⬜ |
| 7 | Phase 3.2チェックリスト | `docs/checklists/phase3.2.md` | ⬜ |

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

### Track A: L3 Chain (Rust) - IC-1 ✅ COMPLETE 🎉

| タスク | 状態 | PIR |
|--------|:----:|-----|
| L3-001 | ✅ | PIR-P3.1-002 PASS |
| L3-002 | ✅ | PIR-P3.1-004 PASS 🎉 |
| L3-003 | ✅ | PIR-P3.1-005 PASS 🎉 |
| L3-004 | ✅ | (L3-003に含む) |
| L3-005 | ✅ | PIR-P3.1-006 PASS 🎉 |
| L3-006 | ✅ | PIR-P3.1-007 PASS 🎉 |

### Track B: L3 Contracts (Solidity)

| タスク | 状態 | PIR |
|--------|:----:|-----|
| SETUP-001 | ✅ | PIR-P3.1-001 |
| SETUP-002 | ✅ | PIR-P3.1-001 |
| SETUP-003 | ✅ | - |
| **CORE-001** | ✅ | **32/32 PASS** 🎉 |
| CORE-002 | ⬜ | 次のタスク |
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
