# Phase 3.1 Checklist: Foundation

> **期間**: Month 10-12
> **目標**: l3-aegis Core開発、Modular Architecture基盤実装
> **前提**: Phase 3 Strategy承認済み (`docs/planning/PHASE3_STRATEGY.md`)

---

## 📋 前提条件チェック

- [ ] Phase 2完了確認（834テスト全PASS）
- [ ] PR #25マージ済み確認
- [ ] Phase 3戦略決議v3.0承認確認
- [ ] 開発ブランチ作成（`dev/phase3-l3-aegis`）

---

## 🏗️ Week 1-2: プロジェクト構造・基盤

### SETUP-001: l3-aegis プロジェクト初期化

- [ ] `l3-aegis/` ディレクトリ構造作成
- [ ] Foundry設定（foundry.toml）
- [ ] 依存関係設定（Phase 2資産インポート）
- [ ] CI/CD設定（GitHub Actions）

### SETUP-002: Modular Architecture インターフェース定義

- [ ] `IGovernanceSwitch.sol` インターフェース作成
- [ ] `ITokenSwitch.sol` インターフェース作成
- [ ] `ICoreLayer.sol` インターフェース作成
- [ ] インターフェーステスト作成

### SETUP-003: Phase 2資産統合準備

- [ ] STARKVerifier統合計画
- [ ] SHA3Hasher統合計画
- [ ] BatchVerifier統合計画
- [ ] 統合テスト計画作成

---

## 🔧 Week 3-4: Core Layer基盤

### CORE-001: State Manager基盤

- [ ] StateManager.sol 基本構造
- [ ] SHA3-256ステートハッシュ実装
- [ ] Merkleルート計算（Phase 2 SHA3Hasher活用）
- [ ] ステート管理テスト

### CORE-002: STARK Verifier統合

- [ ] Phase 2 STARKVerifier移植
- [ ] l3-aegis環境への適応
- [ ] ガスベンチマーク
- [ ] 統合テスト

### CORE-003: CP保護機構実装

- [ ] ConstitutionLock.sol 作成
- [ ] CP-1/2 immutable実装
- [ ] CP-3/4/5 supermajority guard実装
- [ ] CP保護テスト

---

## 🔌 Week 5-6: Pluggable Layer基盤

### PLUG-001: Governance Switch実装

- [ ] GovernanceSwitch.sol 作成
- [ ] CENTRALIZED モード実装
- [ ] MULTISIG モード実装
- [ ] DECENTRALIZED モードスタブ
- [ ] モード切替テスト

### PLUG-002: Token Switch実装

- [ ] TokenSwitch.sol 作成
- [ ] DISABLED モード実装
- [ ] BASIC モードスタブ
- [ ] FULL モードスタブ
- [ ] モード切替テスト

### PLUG-003: Layer間インターフェース

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
| 1 | Core Layer基盤動作 | 単体テストPASS |
| 2 | Pluggable Layer切替動作 | モード切替テストPASS |
| 3 | CP保護機構動作 | CP保護テストPASS |
| 4 | Phase 2資産統合完了 | 統合テストPASS |
| 5 | 全テスト100% PASS | `forge test` |
| 6 | Slither警告なし（Critical/High） | `slither .` |

### 成果物

| # | 成果物 | パス |
|---|-------|------|
| 1 | l3-aegis基盤コード | `l3-aegis/src/` |
| 2 | テストスイート | `l3-aegis/test/` |
| 3 | Modular Architecture仕様 | `docs/specs/MODULAR_ARCHITECTURE.md` |
| 4 | エコシステム計画 | `docs/planning/ECOSYSTEM_PLAN.md` |
| 5 | Phase 3.2チェックリスト | `docs/checklists/phase3.2.md` |

---

## 🔗 参照ドキュメント

| ドキュメント | パス |
|------------|------|
| Phase 3戦略 | `docs/planning/PHASE3_STRATEGY.md` |
| Core Principles | `docs/constitution/CORE_PRINCIPLES.md` |
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
