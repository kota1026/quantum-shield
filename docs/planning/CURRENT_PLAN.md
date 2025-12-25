# Current Plan

> **Generated**: 2025-12-26 21:00 JST
> **Phase**: 2 - Security Council + Token
> **Month**: 8
> **Week**: 8 (Phase 2.2 後半)

## 対象チェックリスト

`docs/planning/PHASE2_CHECKLIST.md` - Phase 2.2: Core Implementation (Week 7-8)

## 前回PIR結果

> PIR-P2-006: ✅ **PASS (11/11 GO)**

| # | 完了タスク | 成果物 | Status |
|---|-----------|--------|--------|
| 1 | IMPL-006 AIR制約システム設計 | AIRConstraints.sol | ✅ |
| 2 | IMPL-007 AIRコンパイラ基本構造 | ConstraintEvaluator.sol | ✅ |
| 3 | INFRA-001 テストネット環境構築 | deploy.sh, .env.example | ✅ |
| 4 | TEST-020 AIR制約テスト | AIRConstraintsTest.t.sol (23/23 PASS) | ✅ |

## 今回のスコープ

### Week 8 目標

Week 7の成果を基に、CI/CDパイプラインを完成させ、テストネットデプロイを実施する。

### 実装項目

- [ ] [INFRA-002] CI/CDパイプライン更新
  - テストネットデプロイジョブ追加
  - 自動Slither実行
  - テスト自動実行

- [ ] [TEST-021] テストネットデプロイテスト
  - Sepolia デプロイ確認
  - 基本機能動作確認
  - Gas消費量測定

### 参照ドキュメント

- ZK-STARK計画: `docs/planning/ZK_STARK_IMPLEMENTATION_PLAN.md`
- Gasベースライン: `docs/planning/GAS_BASELINE_P2.md`
- Phase 2 Checklist: `docs/planning/PHASE2_CHECKLIST.md`

## 成果物

| ファイル | 説明 |
|---------|------|
| `.github/workflows/deploy-testnet.yml` | テストネットCI/CDワークフロー |
| `.github/workflows/security-scan.yml` | Slither自動実行ワークフロー |
| `docs/aegis/deployment/SEPOLIA_DEPLOYMENT_LOG.md` | デプロイ記録 |

## 実行順序

### Day 1-2: CI/CDパイプライン (INFRA-002)

1. GitHub Actions ワークフロー作成
2. テストネットデプロイジョブ追加
3. Slither自動実行設定
4. Secret設定（SEPOLIA_RPC_URL, DEPLOYER_PRIVATE_KEY）

### Day 3-4: テストネットデプロイテスト (TEST-021)

1. Sepolia テストネットデプロイ
2. Contract アドレス記録
3. 基本機能テスト（lock/unlock）
4. Gas消費量測定・記録

### Day 5: レビュー & PIR

1. 04_review.md 実行（セキュリティレビュー）
2. 05_pir.md 実行（PIR会議）
3. CURRENT_STATE.md 更新

## Core Principles確認

- [x] CP-1: 完全量子耐性 - 違反なし
- [x] CP-2: Self-Custody - 違反なし
- [x] CP-3: Time Lock存在 - 違反なし
- [x] CP-4: Slashing存在 - 違反なし
- [x] CP-5: 透明性 - 違反なし

## リスク・懸念事項

| # | リスク | 影響度 | 軽減策 |
|---|--------|--------|--------|
| 1 | Sepolia RPCレート制限 | Low | 複数プロバイダ確保 |
| 2 | GitHub Secrets管理 | Medium | 環境変数分離 |
| 3 | デプロイコスト | Low | Sepoliaテストnet使用 |

## 前提条件 ✅

| 条件 | Status |
|------|--------|
| PIR-P2-006 完了 | ✅ PASS (11/11 GO) |
| フルテストスイート | ✅ 656/656 PASS |
| Slither静的解析 | ✅ HIGH 0 / MEDIUM 0 |
| INFRA-001 完了 | ✅ deploy.sh作成済み |

---

**Plan Ready for Implementation**

次のステップ: `01_plan.md` を実行してWeek 8計画を詳細化、または直接 `03_impl.md` で実装開始
