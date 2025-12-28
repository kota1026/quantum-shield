# Current Plan

> **Generated**: 2025-12-28 17:00 JST
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
| #1 Lock | Core | SEQUENCES §1 |
| #2 Unlock (Normal) | Core | SEQUENCES §2 |
| #3 Unlock (Emergency) | Core | SEQUENCES §3 |
| #3' Resync | Core | SEQUENCES §3' |
| #4 Challenge + Slashing | Core | SEQUENCES §4 |
| #5 Prover Registration | Core + Governance | SEQUENCES §5 |
| #6 Prover Exit | Core + Governance | SEQUENCES §6 |
| #8 Emergency Pause | Core + Governance | SEQUENCES §8 |

### セキュリティ要件

| 要件 | 仕様書出典 | 実装方法 |
|------|----------|---------|
| 24h Time Lock (Normal) | SEQ#2 Step8 | Core Layer `NORMAL_TIMELOCK` |
| 7d Time Lock (Emergency) | SEQ#3 Step5 | Core Layer `EMERGENCY_TIMELOCK` |
| Emergency Bond | SEQ#3 | Core Layer `calculateBond()` |
| Quadratic Slashing N²×10% | SEQ#4 | Core Layer `calculateSlash()` |
| SHA3-256 State Hash | CP-1 | Core Layer StateManager |
| ZK-STARK Proof | CP-1 | STARKVerifier統合 |

---

## 戦略準拠確認（Phase 3）

> 参照: `docs/planning/PHASE3_STRATEGY.md`

- [x] L3スタック: 独自L3 (l3-aegis) 前提
- [x] アーキテクチャ: Modular (Core/Governance/Token Layer)
- [x] リスク緩和: 監査会社選定開始、TVL設計組み込み、Bug Bounty設計
- [x] モード制約: SPEC_STRATEGY_BRIDGE §2.2準拠

---

## 前回レビュー課題

> Phase 2完了: ✅ Go/No-Go 94.0/100 全会一致GO
> 未解決課題: なし

Phase 2は正常完了しており、Critical/Highの未解決課題はありません。

---

## 今回のスコープ

### 実装項目（Week 1-2: プロジェクト構造・基盤）

- [ ] [SETUP-001] l3-aegis プロジェクト初期化
  - [ ] `l3-aegis/` ディレクトリ構造作成
  - [ ] Foundry設定（foundry.toml）
  - [ ] 依存関係設定（Phase 2資産インポート）
  - [ ] CI/CD設定（GitHub Actions）

- [ ] [SETUP-002] Modular Architecture インターフェース定義
  - [ ] `IGovernanceSwitch.sol` インターフェース作成
  - [ ] `ITokenSwitch.sol` インターフェース作成
  - [ ] `ICoreLayer.sol` インターフェース作成
  - [ ] `IConstitutionLock.sol` インターフェース作成
  - [ ] インターフェーステスト作成

- [ ] [SETUP-003] Phase 2資産統合準備
  - [ ] STARKVerifier統合計画
  - [ ] SHA3Hasher統合計画
  - [ ] BatchVerifier統合計画
  - [ ] 統合テスト計画作成

### 開発ブランチ準備

- [ ] [DEVOPS-001] 開発ブランチ作成（`dev/phase3-l3-aegis`）

### 参照ドキュメント

| 種類 | ドキュメント | 参照セクション |
|------|------------|---------------|
| 仕様書-戦略ブリッジ | `docs/planning/SPEC_STRATEGY_BRIDGE.md` | §3, §5, §7 |
| Sequence仕様 | `docs/aegis/QUANTUM_SHIELD_SEQUENCES_v2.0.md` | #1-8 |
| 全体仕様 | `docs/aegis/QUANTUM_SHIELD_UNIFIED_SPEC_v2.0.md` | Phase定義 |
| 戦略 | `docs/planning/PHASE3_STRATEGY.md` | 全体 |
| Modular仕様 | `docs/specs/MODULAR_ARCHITECTURE.md` | §2, §3 |
| 憲法 | `docs/constitution/CORE_PRINCIPLES.md` | CP-1〜5 |

---

## 成果物

| ファイル | 説明 |
|---------|------|
| `l3-aegis/` | プロジェクトルートディレクトリ |
| `l3-aegis/foundry.toml` | Foundry設定 |
| `l3-aegis/src/interfaces/IGovernanceSwitch.sol` | Governance Switchインターフェース |
| `l3-aegis/src/interfaces/ITokenSwitch.sol` | Token Switchインターフェース |
| `l3-aegis/src/interfaces/ICoreLayer.sol` | Core Layerインターフェース |
| `l3-aegis/src/interfaces/IConstitutionLock.sol` | CP保護インターフェース |
| `l3-aegis/test/interfaces/` | インターフェーステスト |
| `.github/workflows/l3-aegis-ci.yml` | CI/CD設定 |

---

## 実行順序

### Step 1: 開発ブランチ作成
1. `dev/phase2-native-stark` から `dev/phase3-l3-aegis` ブランチを作成
2. ブランチ保護設定

### Step 2: SETUP-001 l3-aegis プロジェクト初期化
1. ディレクトリ構造作成
   ```
   l3-aegis/
   ├── src/
   │   ├── core/           # Core Layer
   │   ├── governance/     # Governance Layer
   │   ├── token/          # Token Layer
   │   └── interfaces/     # インターフェース
   ├── test/
   ├── script/
   ├── foundry.toml
   └── README.md
   ```
2. Foundry設定（via_ir有効、optimizer設定）
3. Phase 2資産参照設定（remappings）
4. CI/CD設定

### Step 3: SETUP-002 インターフェース定義
1. MODULAR_ARCHITECTURE.md §3を参照
2. IGovernanceSwitch.sol 作成
3. ITokenSwitch.sol 作成
4. ICoreLayer.sol 作成
5. IConstitutionLock.sol 作成
6. インターフェーステスト作成

### Step 4: SETUP-003 統合準備
1. Phase 2成果物の統合計画策定
2. STARKVerifier互換性確認
3. SHA3Hasher互換性確認
4. 統合テスト計画書作成

### Step 5: PIR審査
1. 実装レビュー（PIR Code Review Routine）
2. テスト実行・結果確認
3. PIR記録作成

---

## Core Principles確認

- [x] CP-1: 完全量子耐性 - SHA3-256、Dilithium-III、SPHINCS+-128s、ZK-STARK使用計画
- [x] CP-2: Self-Custody - ユーザー署名検証設計
- [x] CP-3: Time Lock存在 - Core Layer TIMELOCK定数設計
- [x] CP-4: Slashing存在 - Quadratic Slashing設計
- [x] CP-5: 透明性 - 全操作Event発行設計

---

## Modular Architecture確認

- [x] Core Layer: CP保護機構含む（ConstitutionLock.sol）
- [x] Governance Layer: ON/OFF切替可能（GovernanceSwitch.sol）
- [x] Token Layer: ON/OFF切替可能（TokenSwitch.sol）
- [x] Layer間依存: 下位→上位依存なし（設計済み）

---

## リスク・懸念事項

| # | 懸念 | 重要度 | 対策 |
|---|------|--------|------|
| 1 | 独自L3技術リスク | 🔴 HIGH | 段階的実装、監査会社選定開始 |
| 2 | Modular設計複雑性 | 🟠 MEDIUM | インターフェース先行定義、テスト駆動 |
| 3 | Phase 2資産統合 | 🟡 LOW | 互換性事前確認 |

---

## Phase 3.1 リスク緩和策進捗（本計画での対応）

| # | 緩和策 | Phase 3.1アクション | 本計画での対応 |
|---|-------|-------------------|--------------|
| 1 | 複数回監査 | 監査会社選定開始 | 候補リスト作成 |
| 2 | 段階的TVL | 設計に組み込み | Core Layer設計反映 |
| 3 | Bug Bounty | プログラム設計 | 次週以降 |
| 4 | 形式検証 | 対象コード特定 | インターフェース対象 |
| 5 | 網羅的テスト | テストマトリクス作成 | テスト計画策定 |
| 6 | エコシステム | 計画策定 | CBO担当 |

---

**END OF CURRENT PLAN**
