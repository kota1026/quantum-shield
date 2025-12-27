# Current Plan

> **Generated**: 2025-12-27 19:15 JST
> **Phase**: 2 - Security Council + Token
> **Week**: 9 (Phase 2.3 開始)

---

## 対象チェックリスト

- `docs/planning/PHASE2_3_PLAN.md`
- `docs/planning/PHASE2_CHECKLIST.md` (Phase 2.3セクション)

---

## 🚨 計画修正理由

Week 8で完了したのは**デプロイ準備**（スクリプト、CI/CD設定）のみ。
**実際のSepoliaデプロイは未実施**であり、以下の問題がある：

1. Faucetからテスト用ETH未取得 → デプロイ不可
2. 実デプロイ未実施 → 実環境でのGas計測不可
3. ローカルfork環境のGas値は実ネットワークと異なる可能性

**→ Gas最適化の前に、まずSepoliaデプロイ＆実Gas計測が必須**

---

## 前回レビュー課題

> CURRENT_STATE.md より取得 - **前回レビュー課題なし**

| # | 重要度 | 課題 | 対策 |
|---|--------|------|------|
| - | ✅ | 全課題解消済み | PIR-P2-007 PASS |

---

## 🚧 ブロッカー（今回対応必須）

| # | 課題 | 重要度 | 対応 |
|---|------|--------|------|
| 1 | **Sepoliaデプロイ未実施** | 🔴 Critical | Week 9 Day 1-2 で実施 |
| 2 | **実環境Gasベースライン未取得** | 🔴 Critical | デプロイ後に計測 |
| 3 | **Faucet ETH未取得** | 🔴 Critical | デプロイ前に取得 |

---

## 今回のスコープ

### Phase 1: Sepoliaデプロイ＆検証（Day 1-2）🔴 CRITICAL

- [ ] [DEPLOY-001] Sepolia Faucetからテスト用ETH取得
- [ ] [DEPLOY-002] デプロイ用ウォレット設定（.env）
- [ ] [DEPLOY-003] Sepolia実デプロイ実行
- [ ] [DEPLOY-004] Etherscanでコントラクト検証
- [ ] [DEPLOY-005] 基本機能動作確認（deposit/withdraw）

### Phase 2: 実環境Gasベースライン取得（Day 3）

- [ ] [GAS-001] deposit() 実Gas計測
- [ ] [GAS-002] initiateWithdrawal() 実Gas計測
- [ ] [GAS-003] completeWithdrawal() 実Gas計測
- [ ] [GAS-004] SHA3-256操作の実Gas計測
- [ ] [GAS-005] GAS_BASELINE_SEPOLIA.md 作成

### Phase 3: BatchVerifier設計・実装（Day 4-7）

- [ ] [IMPL-008] BatchVerifier.sol設計ドキュメント作成
- [ ] [IMPL-009] BatchVerifier.sol v0.1 基本実装
- [ ] [IMPL-010] SharedMerkle.sol Merkleパス共有実装

### テスト項目

- [ ] [TEST-023] BatchVerifierTest.t.sol 基本テスト (15+)
- [ ] [TEST-024] Gasベンチマークテスト

### ドキュメント項目

- [ ] [DOC-002] BATCH_VERIFICATION_SPEC.md 作成
- [ ] [DOC-003] SEPOLIA_DEPLOYMENT_REPORT.md 作成

---

## 参照ドキュメント

| 種別 | パス |
|------|------|
| デプロイスクリプト | `scripts/deploy/sepolia/deploy.sh` |
| 環境変数テンプレート | `scripts/deploy/sepolia/.env.example` |
| Foundry設定 | `contracts/foundry.toml` |
| Active Plan | `docs/planning/PHASE2_3_PLAN.md` |
| Checklist | `docs/planning/PHASE2_CHECKLIST.md` |
| Gas Baseline (ローカル) | `docs/planning/GAS_BASELINE_P2.md` |
| 憲法 | `docs/constitution/CORE_PRINCIPLES.md` |

---

## 成果物

| ファイル | 説明 |
|---------|------|
| **Sepolia Contracts** | 実デプロイ済みコントラクト群 |
| `docs/planning/SEPOLIA_DEPLOYMENT_REPORT.md` | デプロイレポート（アドレス一覧） |
| `docs/planning/GAS_BASELINE_SEPOLIA.md` | 実環境Gasベースライン |
| `contracts/src/BatchVerifier.sol` | バッチ証明検証コントラクト v0.1 |
| `contracts/src/lib/SharedMerkle.sol` | Merkleパス共有ライブラリ |
| `contracts/test/BatchVerifierTest.t.sol` | BatchVerifier単体テスト |

---

## 実行順序

### Day 1: Faucet取得 & 環境準備

1. Sepolia Faucetからテスト用ETH取得
   - Alchemy Faucet: https://sepoliafaucet.com/
   - Infura Faucet: https://www.infura.io/faucet/sepolia
   - 必要量: 最低 1 ETH（デプロイ + テスト用）

2. デプロイ用ウォレット設定
   ```bash
   cp scripts/deploy/sepolia/.env.example scripts/deploy/sepolia/.env
   # PRIVATE_KEY, SEPOLIA_RPC_URL, ETHERSCAN_API_KEY を設定
   ```

3. RPC接続確認
   ```bash
   cast chain-id --rpc-url $SEPOLIA_RPC_URL
   # Expected: 11155111
   ```

### Day 2: 実デプロイ & 検証

4. Sepoliaデプロイ実行
   ```bash
   cd scripts/deploy/sepolia
   chmod +x deploy.sh
   ./deploy.sh
   ```

5. Etherscanでコントラクト検証
   ```bash
   forge verify-contract <ADDRESS> L1Vault --chain sepolia
   ```

6. 基本機能動作確認
   - deposit() テストトランザクション
   - initiateWithdrawal() テストトランザクション
   - イベント発行確認

7. SEPOLIA_DEPLOYMENT_REPORT.md 作成
   - デプロイ済みアドレス一覧
   - トランザクションハッシュ
   - 検証ステータス

### Day 3: 実環境Gas計測

8. 各操作の実Gasを計測
   ```bash
   # Etherscan または cast を使用
   cast receipt <TX_HASH> --rpc-url $SEPOLIA_RPC_URL
   ```

9. GAS_BASELINE_SEPOLIA.md 作成
   - 実測Gas値の記録
   - ローカル値との比較
   - 最適化目標の再確認

### Day 4-5: BatchVerifier設計・実装

10. 実Gas値に基づいてBatchVerifier設計
11. BATCH_VERIFICATION_SPEC.md 作成
12. BatchVerifier.sol スケルトン作成
13. 基本検証ロジック実装

### Day 6-7: Merkle共有 & テスト

14. SharedMerkle.sol 作成
15. BatchVerifierへの統合
16. BatchVerifierTest.t.sol 作成（15+テスト）
17. テストスイート全体実行（628+ tests）

---

## Sepolia Faucet情報

| Faucet | URL | 制限 |
|--------|-----|------|
| Alchemy | https://sepoliafaucet.com/ | 0.5 ETH/day |
| Infura | https://www.infura.io/faucet/sepolia | 0.5 ETH/day |
| QuickNode | https://faucet.quicknode.com/ethereum/sepolia | 0.1 ETH/day |
| Google Cloud | https://cloud.google.com/application/web3/faucet/ethereum/sepolia | 0.05 ETH/day |

**推奨**: 複数のFaucetから取得して合計 1-2 ETH を確保

---

## 成功基準

| # | 基準 | 目標値 |
|---|------|--------|
| 1 | **Sepoliaデプロイ完了** | ✅ 全コントラクトデプロイ |
| 2 | **Etherscan検証** | ✅ 全コントラクト検証済み |
| 3 | **基本機能動作確認** | ✅ deposit/withdraw成功 |
| 4 | **実Gas計測完了** | ✅ GAS_BASELINE_SEPOLIA.md |
| 5 | BatchVerifier.sol基本動作 | ✅ 動作確認 |
| 6 | バッチ検証Gas削減 | ≥40%削減（10件バッチ） |
| 7 | 新規テスト数 | ≥15テストPASS |
| 8 | 既存テスト維持 | 628/628 ALL PASS |
| 9 | Slither結果 | HIGH 0 / MEDIUM 0 維持 |

---

## Core Principles確認

- [ ] CP-1: 完全量子耐性 - 違反なし（SHA3-256のみ使用）
- [ ] CP-2: Self-Custody - 違反なし（ユーザー秘密鍵管理維持）
- [ ] CP-3: Time Lock存在 - 違反なし（既存Time Lock維持）
- [ ] CP-4: Slashing存在 - 違反なし（既存Slashing維持）
- [ ] CP-5: 透明性 - 違反なし（全てオンチェーン検証可能）

---

## リスク・懸念事項

| リスク | 確率 | 影響 | 対策 |
|--------|------|------|------|
| Faucet ETH取得困難 | MEDIUM | HIGH | 複数Faucet併用 |
| RPC レートリミット | LOW | MEDIUM | Alchemy/Infura有料プラン検討 |
| デプロイGas不足 | LOW | HIGH | 十分なETH確保（1-2 ETH） |
| Etherscan検証失敗 | LOW | LOW | 手動検証フォールバック |
| 実Gasがローカルと大幅に異なる | MEDIUM | MEDIUM | 計画再調整 |

---

## 技術的注意事項

### デプロイ順序

```
1. SHA3_256.sol (ライブラリ)
2. SparseMerkleTree.sol (ライブラリ)
3. ProofCodec.sol (ライブラリ)
4. FRIVerifier.sol
5. STARKVerifier.sol
6. L1Vault.sol (メインコントラクト)
7. QuantumShield.sol (メインコントラクト)
```

### ネットワーク設定確認

```toml
# foundry.toml
[rpc_endpoints]
sepolia = "${SEPOLIA_RPC_URL}"

[etherscan]
sepolia = { key = "${ETHERSCAN_API_KEY}" }
```

---

## 📅 修正後スケジュール

| Day | タスク | 成果物 | 優先度 |
|-----|--------|--------|--------|
| 1 | Faucet取得 + 環境準備 | .env設定完了 | 🔴 Critical |
| 2 | Sepoliaデプロイ + Etherscan検証 | SEPOLIA_DEPLOYMENT_REPORT.md | 🔴 Critical |
| 3 | 実環境Gas計測 | GAS_BASELINE_SEPOLIA.md | 🔴 Critical |
| 4-5 | BatchVerifier設計・実装 | BatchVerifier.sol v0.1 | 🟠 High |
| 6-7 | Merkle共有 + テスト | SharedMerkle.sol, Tests | 🟠 High |

---

**Plan Created**: 2025-12-27 19:15 JST
**Commit**: Updated with Sepolia deployment priority

**Next Step**: Day 1 - Faucet取得 & 環境準備開始

---

**END OF CURRENT PLAN**
