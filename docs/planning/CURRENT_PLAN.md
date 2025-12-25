# Current Plan

> **Generated**: 2025-12-26 10:30 JST
> **Phase**: 2 - Security Council + Token
> **Month**: 7
> **Week**: 7 (Phase 2.2 開始)

## 対象チェックリスト

`docs/planning/PHASE2_CHECKLIST.md` - Phase 2.2: Core Implementation (Week 7-8)

## 前回レビュー課題

> CURRENT_STATE.mdより自動取得

| # | 重要度 | 課題 | 対策 | Status |
|---|--------|------|------|--------|
| - | - | 全 Critical/High 課題解消済み | - | ✅ |

### 現存する Medium 懸念事項

| # | 懸念 | 対策 | 対応時期 |
|---|------|------|----------|
| 1 | SHA3_256 Gas消費量 (~2.2M/lock) | L2/Assembly/EIP最適化 | Phase 2.3 |
| 2 | ZK-STARK実装の複雑性 | 段階的実装継続 | Month 9 |
| 3 | 外部監査スケジュール | RFP送付予定 | Month 8 |
| 4 | テストネット環境構築 | 今週着手 | Week 7-8 |

## 今回のスコープ

### Phase 2.2 Week 7-8 目標

Phase 2 Security Sprint (SEC-001〜SEC-003) の完了を受け、コア実装フェーズに移行。
テストネット環境構築とSTARKVerifier強化を並行して進める。

### 実装項目

- [ ] [IMPL-006] STARKVerifier v0.2 制約システム設計
  - AIR (Algebraic Intermediate Representation) 設計
  - 制約ポリノミアル定義
  - 境界制約・遷移制約の実装

- [ ] [IMPL-007] AIRコンパイラ基本構造
  - トレース→制約変換ロジック
  - 制約評価関数

### インフラ項目

- [ ] [INFRA-001] テストネット環境構築
  - Sepolia RPC設定
  - デプロイスクリプト作成
  - 環境変数管理

- [ ] [INFRA-002] CI/CD パイプライン更新
  - テストネットデプロイジョブ追加
  - 自動Slither実行

### テスト項目

- [ ] [TEST-020] STARKVerifier v0.2 制約テスト
  - AIR制約検証テスト
  - 境界制約テスト
  - 遷移制約テスト

- [ ] [TEST-021] テストネットデプロイテスト
  - Sepolia デプロイ確認
  - 基本機能動作確認

### 参照ドキュメント

- ZK-STARK計画: `docs/planning/ZK_STARK_IMPLEMENTATION_PLAN.md`
- Gasベースライン: `docs/planning/GAS_BASELINE_P2.md`
- シーケンス: `docs/constitution/QUANTUM_SHIELD_SEQUENCES_v2.0_REF.md`
- 監査RFP: `docs/planning/AUDIT_RFP_DRAFT.md`

## 成果物

| ファイル | 説明 |
|---------|------|
| `contracts/src/stark/AIRConstraints.sol` | AIR制約定義 |
| `contracts/src/stark/ConstraintEvaluator.sol` | 制約評価器 |
| `contracts/test/AIRConstraintsTest.t.sol` | AIR制約テスト |
| `scripts/deploy/sepolia/` | Sepoliaデプロイスクリプト |
| `.github/workflows/deploy-testnet.yml` | テストネットCI/CD |

## 実行順序

### Day 1-2: テストネット環境構築 (INFRA-001)

1. Sepolia RPC プロバイダ設定 (Alchemy/Infura)
2. デプロイスクリプト作成 (`scripts/deploy/sepolia/`)
3. 環境変数テンプレート作成
4. Foundryデプロイ設定 (`foundry.toml` 更新)
5. デプロイテスト実行

### Day 3-4: AIR設計 & 制約システム (IMPL-006)

1. AIR仕様ドキュメント作成
2. 制約ポリノミアル数学的定義
3. `AIRConstraints.sol` 基本構造実装
4. 境界制約実装
5. 遷移制約実装

### Day 5-6: 制約評価器 & テスト (IMPL-007, TEST-020)

1. `ConstraintEvaluator.sol` 実装
2. 単体テスト作成
3. 統合テスト実行
4. Gas測定・ベンチマーク

### Day 7: レビュー準備 & PIR

1. 04_review.md 実行（セキュリティレビュー）
2. 05_pir.md 実行（PIR会議）
3. CURRENT_STATE.md 更新

## Core Principles確認

- [x] CP-1: 完全量子耐性 - 違反なし（SEC-003完了、keccak256完全排除済み）
- [x] CP-2: Self-Custody - 違反なし
- [x] CP-3: Time Lock存在 - 違反なし
- [x] CP-4: Slashing存在 - 違反なし
- [x] CP-5: 透明性 - 違反なし

## リスク・懸念事項

| # | リスク | 影響度 | 軽減策 |
|---|--------|--------|--------|
| 1 | AIR設計の複雑性 | Medium | 段階的実装、既存研究参照 |
| 2 | Sepolia RPCレート制限 | Low | 複数プロバイダ確保 |
| 3 | Gas最適化目標達成 | Medium | Phase 2.3で本格対応 |

## 前提条件 ✅

| 条件 | Status |
|------|--------|
| SEC-003 完了 | ✅ PASS (11/11 GO) |
| フルテストスイート | ✅ 574/574 PASS |
| Slither静的解析 | ✅ HIGH 0 / MEDIUM 0 |
| CP-1完全準拠 | ✅ 達成 |

---

**Plan Ready for Implementation**

次のステップ: `02_spec.md` を実行して仕様レビューを開始
