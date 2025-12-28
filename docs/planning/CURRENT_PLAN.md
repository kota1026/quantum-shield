# Current Plan

> **Generated**: 2025-12-28 21:30 JST
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

### セキュリティ要件

| 要件 | 仕様書出典 | 実装方法 |
|------|----------|---------|
| SHA3-256ステートハッシュ | CP-1, UNIFIED §暗号 | SHA3Hasher統合 |
| ZK-STARK証明検証 | UNIFIED §ZK | STARKVerifier統合 |
| バッチ検証 | UNIFIED §Gas最適化 | BatchVerifier統合 |
| 禁止アルゴリズム排除 | CP-1 | keccak256未使用確認 |

---

## 戦略準拠確認（Phase 3）

> 参照: `docs/planning/PHASE3_STRATEGY.md`

- [x] L3スタック: 独自L3 (l3-aegis) 前提
- [x] アーキテクチャ: Modular (Core/Governance/Token Layer)
- [ ] リスク緩和: 監査計画策定中
- [x] モード制約: Core Layer固定（ALWAYS ON）

---

## 前回レビュー課題

> PIR-P3.1-001 結果: ✅ PASS

| # | 重要度 | 課題 | 対策 |
|---|--------|------|------|
| 1 | 🟡 Minor | l3-aegis専用CI/CDワークフロー未作成 | 今回のスコープに含める |

---

## 今回のスコープ

### SETUP-003: Phase 2資産統合準備

Phase 2で完成したコア資産をl3-aegisに統合するための準備を行う。

### 実装項目

- [ ] [IMPL-001] STARKVerifier統合計画策定
  - `contracts/src/STARKVerifier.sol` → `l3-aegis/src/core/` へのマイグレーション方針
  - インターフェース互換性確認
  - 依存関係マッピング

- [ ] [IMPL-002] SHA3Hasher統合計画策定
  - `contracts/src/SHA3Hasher.sol` → `l3-aegis/src/core/` へのマイグレーション方針
  - StateManagerとの連携設計
  - CP-1準拠確認（keccak256未使用）

- [ ] [IMPL-003] BatchVerifier統合計画策定
  - `contracts/src/BatchVerifier.sol` → `l3-aegis/src/core/` へのマイグレーション方針
  - Gas最適化維持確認
  - STARKVerifierとの連携設計

- [ ] [IMPL-004] l3-aegis専用CI/CDワークフロー作成
  - `.github/workflows/l3-aegis.yml` 作成
  - l3-aegis単独テスト実行
  - Phase 2テストとの並列実行

### テスト項目

- [ ] [TEST-001] 統合テスト計画作成
  - Phase 2資産 → l3-aegis Core Layer統合シナリオ
  - インターフェース互換性テスト設計
  - リグレッションテスト設計

- [ ] [TEST-002] 依存関係テスト設計
  - STARKVerifier ↔ BatchVerifier連携
  - SHA3Hasher ↔ StateManager連携
  - Core Layer ↔ Pluggable Layer境界

### ドキュメント項目

- [ ] [DOC-001] Phase 2資産統合ガイド作成
  - マイグレーション手順
  - 依存関係図
  - テスト戦略

---

## 参照ドキュメント

| 種類 | ドキュメント | 参照セクション |
|------|------------|---------------|
| 仕様書-戦略ブリッジ | `docs/planning/SPEC_STRATEGY_BRIDGE.md` | §3, §5 |
| Sequence仕様 | `docs/aegis/QUANTUM_SHIELD_SEQUENCES_v2.0.md` | #1-4, #3' |
| 全体仕様 | `docs/aegis/QUANTUM_SHIELD_UNIFIED_SPEC_v2.0.md` | §暗号, §ZK |
| 戦略 | `docs/planning/PHASE3_STRATEGY.md` | Core Layer設計 |
| Modular仕様 | `docs/specs/MODULAR_ARCHITECTURE.md` | §3 インターフェース |

---

## 成果物

| ファイル | 説明 |
|---------|------|
| `docs/planning/PHASE2_ASSET_INTEGRATION_GUIDE.md` | Phase 2資産統合ガイド |
| `.github/workflows/l3-aegis.yml` | l3-aegis専用CI/CDワークフロー |
| `l3-aegis/docs/INTEGRATION_PLAN.md` | 統合計画詳細 |

---

## 実行順序

1. **Phase 2資産の現状分析**
   - `contracts/src/STARKVerifier.sol` のインターフェース確認
   - `contracts/src/SHA3Hasher.sol` のインターフェース確認
   - `contracts/src/BatchVerifier.sol` のインターフェース確認
   - 依存関係グラフ作成

2. **l3-aegis Core Layer設計確認**
   - `l3-aegis/src/interfaces/ICoreLayer.sol` との整合性確認
   - StateManager ↔ SHA3Hasher連携設計
   - STARKVerifier ↔ BatchVerifier連携設計

3. **統合計画策定**
   - マイグレーション方針決定（コピー vs シンボリックリンク vs サブモジュール）
   - インターフェースアダプター設計（必要に応じて）
   - テスト戦略策定

4. **CI/CDワークフロー作成**
   - l3-aegis単独テスト
   - Phase 2テストとの並列実行
   - ガスベンチマーク継続

5. **統合ガイド作成**
   - 手順書作成
   - 依存関係図作成
   - レビュー準備

---

## Core Principles確認

- [x] CP-1: 完全量子耐性 - SHA3-256, ZK-STARKのみ使用、keccak256排除確認必須
- [x] CP-2: Self-Custody - ユーザー署名検証設計維持
- [x] CP-3: Time Lock存在 - ICoreLayer.sol定義済み（24h/7d）
- [x] CP-4: Slashing存在 - ICoreLayer.sol定義済み（Quadratic N²×10%）
- [x] CP-5: 透明性 - 全操作オンチェーンEvent発行

---

## Modular Architecture確認（Phase 3）

- [x] Core Layer: CP保護機構含む（IConstitutionLock.sol定義済み）
- [x] Governance Layer: ON/OFF切替可能（IGovernanceSwitch.sol定義済み）
- [x] Token Layer: ON/OFF切替可能（ITokenSwitch.sol定義済み）
- [x] Layer間依存: 下位→上位依存なし（設計原則遵守）

---

## リスク・懸念事項

| # | リスク | 重要度 | 対策 |
|---|--------|--------|------|
| 1 | Phase 2資産の変更によるl3-aegis影響 | 🟠 Medium | Phase 2資産を凍結状態で統合 |
| 2 | インターフェース不整合 | 🟠 Medium | アダプターパターン適用検討 |
| 3 | ガス効率低下 | 🟡 Low | ベンチマーク継続実施 |
| 4 | CI/CD実行時間増加 | 🟡 Low | 並列実行・キャッシュ活用 |

---

## 見積もり

| 項目 | 工数 |
|------|------|
| Phase 2資産分析 | 2時間 |
| 統合計画策定 | 3時間 |
| CI/CDワークフロー | 2時間 |
| ドキュメント作成 | 2時間 |
| **合計** | **約9時間** |

---

**次のステップ**: この計画に基づき `02_spec.md` → `03_impl.md` → `04_review.md` の順で実行

---

**END OF CURRENT PLAN**
