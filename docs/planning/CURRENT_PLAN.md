# Current Plan

> **Generated**: 2025-12-29 10:30 JST
> **Phase**: 3 - L3 + Token + 完全分散化
> **Sub-Phase**: 3.1 Foundation

## 対象チェックリスト
`docs/checklists/phase3.1.md`

## 仕様書参照（必須）

> 参照: `docs/planning/SPEC_STRATEGY_BRIDGE.md`

### 対象Sequence
| Sequence | 実装Layer | 仕様書参照箇所 |
|----------|----------|---------------|
| #1 Lock | Core | SEQUENCES §1 |
| #2 Unlock (Normal) | Core | SEQUENCES §2 |
| #3 Unlock (Emergency) | Core | SEQUENCES §3 |
| #4 Challenge + Slashing | Core | SEQUENCES §4 |

### セキュリティ要件
| 要件 | 仕様書出典 | 実装方法 |
|------|----------|---------|
| SHA3-256 State Hash | UNIFIED §暗号 | SHA3Hasher.sol統合 |
| ZK-STARK 128-bit security | UNIFIED §暗号 | STARKVerifier.sol統合 |
| keccak256完全排除 | CP-1 | Phase 2資産はCP-1準拠済み |

## 戦略準拠確認（Phase 3以降）

> 参照: `docs/planning/PHASE3_STRATEGY.md`

- [x] L3スタック: 独自L3 (l3-aegis) 前提
- [x] アーキテクチャ: Modular (Core/Governance/Token Layer)
- [x] リスク緩和: 網羅的テスト（統合テスト計画）
- [x] モード制約: Core Layer（常時有効）のみ対象

## L3基盤確認（Phase 3のL3関連タスク）

> 参照: `docs/aegis/meetings/L3_INFRASTRUCTURE_FINAL_DECISION_2025-12-28.md`

- [x] 独自4ノードBFTチェーン前提か → 対象外（コントラクト層）
- [x] l3-aegis (Rust) の範囲内か → Solidity部分をl3-aegis/src/coreに統合
- [x] SEQUENCES v2.0に準拠しているか → #1-4 Core Layerに対応
- [x] CP-1/CP-5を満たしているか → Phase 2資産はCP-1準拠済み

## 前回レビュー課題（該当時のみ）

> PIR-P3.1-001: ✅ PASS - Critical/Major課題なし

| # | 重要度 | 課題 | 対策 |
|---|--------|------|------|
| - | 🟢 Minor | l3-aegis専用CI/CDワークフロー | SETUP-003で対応予定 |

## 今回のスコープ

### 実装項目
- [ ] [IMPL-001] Phase 2コアライブラリ統合（SHA3_256, SHA3Hasher, OptimizedField）
- [ ] [IMPL-002] 検証コントラクト統合（STARKVerifier, FRIVerifier, BatchVerifier）
- [ ] [IMPL-003] サポートライブラリ統合（ProofCodec, SharedMerkle, ProofDecoder）
- [ ] [IMPL-004] インポートパス調整スクリプト作成

### テスト項目
- [ ] [TEST-001] 統合ライブラリ単体テスト移植
- [ ] [TEST-002] STARKVerifier統合テスト
- [ ] [TEST-003] BatchVerifier統合テスト
- [ ] [TEST-004] forge build / forge test 全テストPASS確認

### インフラ項目
- [ ] [INFRA-001] l3-aegis専用CI/CDワークフロー作成（.github/workflows/l3-aegis.yml）

### 参照ドキュメント
| 種類 | ドキュメント | 参照セクション |
|------|------------|---------------|
| 仕様書-戦略ブリッジ | `docs/planning/SPEC_STRATEGY_BRIDGE.md` | §3, §5 |
| Sequence仕様 | `docs/aegis/QUANTUM_SHIELD_SEQUENCES_v2.0.md` | #1-4 |
| 統合計画 | `l3-aegis/docs/INTEGRATION_PLAN.md` | 全体 |
| L3基盤決議 | `docs/aegis/meetings/L3_INFRASTRUCTURE_FINAL_DECISION_2025-12-28.md` | 全体 |

## 成果物
| ファイル | 説明 |
|---------|------|
| `l3-aegis/src/core/libraries/SHA3_256.sol` | Pure Solidity SHA3-256実装 |
| `l3-aegis/src/core/libraries/SHA3Hasher.sol` | SHA3-256ラッパー |
| `l3-aegis/src/core/lib/OptimizedField.sol` | 最適化演算ライブラリ |
| `l3-aegis/src/core/STARKVerifier.sol` | STARK証明検証 |
| `l3-aegis/src/core/BatchVerifier.sol` | バッチ検証 |
| `l3-aegis/src/core/libraries/ProofCodec.sol` | 証明エンコード/デコード |
| `l3-aegis/src/core/lib/SharedMerkle.sol` | 共有Merkle最適化 |
| `l3-aegis/test/unit/core/*.t.sol` | 統合テストスイート |
| `.github/workflows/l3-aegis.yml` | l3-aegis専用CI/CDワークフロー |

## 実行順序
1. **ディレクトリ構造作成** - `l3-aegis/src/core/libraries/`, `l3-aegis/src/core/lib/` 作成
2. **コアライブラリ統合** - SHA3_256, SHA3Hasher, OptimizedField をコピー・調整
3. **検証コントラクト統合** - STARKVerifier, FRIVerifier, BatchVerifier をコピー・調整
4. **サポートライブラリ統合** - ProofCodec, SharedMerkle 等をコピー・調整
5. **インポートパス修正** - 相対パスをl3-aegis構造に適合
6. **テスト移植** - 単体テスト、統合テストを移植
7. **ビルド・テスト実行** - `cd l3-aegis && forge build && forge test`
8. **CI/CDワークフロー作成** - l3-aegis専用ワークフロー追加
9. **ガスベンチマーク比較** - Phase 2との差異が±5%以内を確認

## Core Principles確認
- [x] CP-1: 完全量子耐性 - SHA3-256使用、keccak256排除済み
- [x] CP-2: Self-Custody - 違反なし（インフラ統合のみ）
- [x] CP-3: Time Lock存在 - 違反なし（ICoreLayer定義済み）
- [x] CP-4: Slashing存在 - 違反なし（ICoreLayer定義済み）
- [x] CP-5: 透明性 - 違反なし（オンチェーン検証）

## Modular Architecture確認（Phase 3以降）
- [x] Core Layer: CP保護機構含む（IConstitutionLock定義済み）
- [x] Governance Layer: ON/OFF切替可能（IGovernanceSwitch定義済み）
- [x] Token Layer: ON/OFF切替可能（ITokenSwitch定義済み）
- [x] Layer間依存: 下位→上位依存なし

## リスク・懸念事項
| # | リスク | 影響 | 確率 | 緩和策 |
|---|-------|------|------|--------|
| R1 | インポートパス不整合 | 中 | 高 | 自動修正スクリプト作成 |
| R2 | ガス効率低下 | 低 | 中 | 継続的ベンチマーク |
| R3 | テスト互換性問題 | 中 | 中 | パス調整 |
| R4 | SharedMerkle via_ir問題 | 低 | 低 | 必要に応じて設定追加 |

---

**END OF CURRENT PLAN**
