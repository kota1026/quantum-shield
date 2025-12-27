# Current Plan

> **Generated**: 2025-12-28 23:15 JST
> **Phase**: 2 - Security Council + Token
> **Week**: 11
> **Focus**: テスト修正 & テストネット検証

---

## 対象チェックリスト

`docs/planning/PHASE2_CHECKLIST.md` - Phase 2.3 Week 11

---

## 前回レビュー課題

> CURRENT_STATE.mdより自動取得

| # | 重要度 | 課題 | 対策 |
|---|--------|------|------|
| 1 | 🟡 MEDIUM | Week 11テスト実行待ち | 今回スコープ: forge test実行 |
| 2 | 🟢 LOW | Etherscan検証未完 | Week 11後半で対応 |

---

## 今回のスコープ

### P0: ローカルテスト修正（Critical）

> **理由**: 現在のCIを通すために必須

- [ ] [FIX-001] `GasRegressionTest.t.sol` 最終確認
  - fieldAdd/fieldMul/fieldExp: 目標値 10,000 gas（外部呼出オーバーヘッド考慮）
  - SHA3Hash: 目標値 1,500,000 gas（Pure Solidity SHA3-256制約）
- [ ] [FIX-002] `IntegrationStressTest.t.sol` スコープ確認
  - LargeTraceRoot: 16 elements（OOG回避）
  - LargeBatchVerification: 8 elements, 3 verifications
- [ ] [FIX-003] `STARKVerifierE2E.t.sol` ドメインセパレータ整合性
  - DOMAIN_TRACE / DOMAIN_MERKLE_NODE がSTARKVerifier.solと一致確認
- [ ] [TEST-032] `forge test` 全テスト実行 → 全PASS確認

### P1: Sepolia Forkテスト（High）

> **理由**: 実環境に近いGas計測

- [ ] [TEST-033] Sepolia Fork環境でのGasベンチマーク
  - `forge test --fork-url $SEPOLIA_RPC_URL`
  - 実ネットワーク条件でのGas消費確認
- [ ] [DOC-005] Gas Baseline更新（Fork結果反映）

### P2: Sepolia E2Eスクリプト（Medium）

> **理由**: 実際のトランザクション検証

- [ ] [SCRIPT-001] E2E検証スクリプト作成
  - デプロイ済みコントラクトとの連携確認
  - 実トランザクションでの動作検証
- [ ] [SCRIPT-002] Gas計測スクリプト作成
  - 各コンポーネントの実Gas消費記録

---

## 成果物

| ファイル | 説明 |
|---------|------|
| `contracts/test/GasRegressionTest.t.sol` | Gas目標値修正済み |
| `contracts/test/IntegrationStressTest.t.sol` | スコープ調整済み |
| `contracts/test/STARKVerifierE2E.t.sol` | ドメインセパレータ修正済み |
| `scripts/sepolia/gas_benchmark.sh` | 新規: Forkテストスクリプト |
| `scripts/sepolia/e2e_verify.sh` | 新規: E2E検証スクリプト |

---

## 実行順序

### Step 1: P0 - ローカルテスト確認（30分）

```bash
cd contracts

# 1. 全テスト実行
forge test -vv 2>&1 | tee test_results.log

# 2. 結果確認
grep -E "(PASS|FAIL)" test_results.log | tail -20

# 3. Gas消費確認（主要テスト）
forge test --match-contract GasRegressionTest -vv
```

### Step 2: P1 - Sepolia Forkテスト（30分）

```bash
# 1. Fork環境でテスト
export SEPOLIA_RPC_URL="your_sepolia_rpc_url"
forge test --fork-url $SEPOLIA_RPC_URL --match-contract GasRegressionTest -vv

# 2. 結果をログ保存
forge test --fork-url $SEPOLIA_RPC_URL -vv 2>&1 | tee fork_test_results.log
```

### Step 3: P2 - E2Eスクリプト作成（45分）

```bash
# 1. デプロイ済みコントラクトアドレス確認
# L1Vault: 0xAdEB23203bf5C45e3CbD3406122aED067E41255D
# STARKVerifier: 0x93f550917E45b6BDA45dE4fE3e0bAB09FfC38848

# 2. E2Eスクリプト実行（要実装）
# ./scripts/sepolia/e2e_verify.sh
```

### Step 4: 結果整理 & 次ステップ

1. テスト結果をCURRENT_STATE.mdに反映
2. 問題なければ 04_review.md（セキュリティレビュー）へ
3. PIR-P2-011 実施

---

## Core Principles確認

- [x] CP-1: 完全量子耐性 - 違反なし（SHA3-256使用、keccak256排除済み）
- [x] CP-2: Self-Custody - 違反なし
- [x] CP-3: Time Lock存在 - 違反なし
- [x] CP-4: Slashing存在 - 違反なし
- [x] CP-5: 透明性 - 違反なし

---

## リスク・懸念事項

| # | リスク | 影響度 | 対策 |
|---|--------|--------|------|
| 1 | Pure Solidity SHA3-256のGas高騰 | 🟡 MEDIUM | 目標値を現実的に設定（~1M gas/hash） |
| 2 | Sepolia RPC不安定性 | 🟢 LOW | 複数プロバイダ確保 |
| 3 | Fork環境とローカルのGas差異 | 🟡 MEDIUM | 両方の結果を記録・比較 |

---

## 参照ドキュメント

| ドキュメント | パス |
|-------------|------|
| 憲法 | `docs/constitution/CORE_PRINCIPLES.md` |
| Phase 2.3計画 | `docs/planning/PHASE2_3_PLAN.md` |
| BatchVerifier仕様 | `docs/planning/BATCH_VERIFICATION_SPEC.md` |
| Sepoliaデプロイレポート | `docs/deployments/SEPOLIA_DEPLOYMENT_2025-12-27.md` |
| Gas Baseline (Sepolia) | `docs/deployments/GAS_BASELINE_SEPOLIA.md` |
| PIRコードレビュールーティン | `docs/aegis/PIR_CODE_REVIEW_ROUTINE.md` |
| 03_impl.md Week 11学習事項 | `scripts/prompts/03_impl.md` Section 9-11 |

---

## 優先度サマリー

```
┌─────────────────────────────────────────────────────────────┐
│  P0 🔴 ローカルテスト修正（CIグリーン化）                    │
│  ├─ forge test 全PASS確認                                   │
│  └─ Gas目標値の妥当性検証                                   │
│                                                             │
│  P1 🟠 Sepolia Forkテスト                                   │
│  └─ 実環境条件でのGas計測                                   │
│                                                             │
│  P2 🟡 Sepolia E2Eスクリプト                                │
│  └─ 実トランザクション検証                                  │
└─────────────────────────────────────────────────────────────┘
```

---

**次のステップ**: Step 1実行（forge test）後、結果に応じて修正 or 04_review.md

---

**END OF CURRENT PLAN**
