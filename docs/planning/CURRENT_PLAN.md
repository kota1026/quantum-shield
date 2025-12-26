# Current Plan

> **Generated**: 2025-12-27 00:30 JST  
> **Phase**: 2 - Security Council + Token  
> **Week**: 8  
> **Status**: 🔄 PLANNING

---

## 対象チェックリスト

`docs/planning/PHASE2_CHECKLIST.md` - Phase 2.2 Week 8

---

## 前回レビュー課題

> CURRENT_STATE.mdより自動取得

**✅ 前回PIR: PIR-P2-006 PASS (11/11 GO)** - Week 7完了

| # | 重要度 | 懸念事項 | 対策 | Status |
|---|--------|----------|------|--------|
| 1 | 🟡 Medium | SHA3_256 Gas消費量 (~2.2M/lock) | Phase 2.3で最適化予定 | 🔄 継続監視 |
| 2 | 🟡 Medium | ZK-STARK実装の複雑性 | 段階的実装継続 | 🔄 継続 |
| 3 | 🟡 Medium | 外部監査のスケジュール | RFP草案作成完了 | 🔄 継続 |
| 4 | ~~🟡 Medium~~ | ~~テストネット環境構築~~ | ~~スクリプト作成~~ | ✅ 解消 |

**🔴 Critical / 🟠 High課題: なし**

---

## 今回のスコープ

### 主要目標: Week 8 インフラ完成 + Sepoliaデプロイ

参照: `docs/planning/NETWORK_DEPLOYMENT_GUIDE.md`

### 実装項目

- [ ] [INFRA-002] CI/CDパイプライン更新
  - GitHub Actions ワークフロー作成
  - 自動テスト実行 (forge test)
  - 自動デプロイ (testnet)
  - Slither静的解析統合

- [ ] [INFRA-003] Sepoliaデプロイ準備
  - foundry.toml マルチネットワーク設定
  - .env.example 更新 (RPC/API Keys)
  - デプロイスクリプト拡張

### テスト項目

- [ ] [TEST-021] テストネットデプロイテスト
  - Ethereum Sepolia (Chain ID: 11155111)
  - 契約デプロイ検証
  - 基本機能テスト (lock/unlock フロー)

- [ ] [TEST-022] マルチネットワーク互換性確認
  - Arbitrum Sepolia (Chain ID: 421614)
  - Base Sepolia (Chain ID: 84532)

### ドキュメント項目

- [ ] [DOC-001] Phase 2.3計画策定
  - Gas最適化計画
  - Batch verification設計
  - Proof compression設計

### 参照ドキュメント

- Network Guide: `docs/planning/NETWORK_DEPLOYMENT_GUIDE.md`
- ZK-STARK計画: `docs/planning/ZK_STARK_IMPLEMENTATION_PLAN.md`
- デプロイスクリプト: `scripts/deploy.sh`
- Gas Baseline: `docs/planning/GAS_BASELINE_P2.md`

---

## 成果物

| ファイル | 説明 |
|---------|------|
| `.github/workflows/ci.yml` | CI/CDパイプライン設定 |
| `.github/workflows/deploy-testnet.yml` | テストネットデプロイワークフロー |
| `foundry.toml` | マルチネットワーク設定追加 |
| `.env.example` | 環境変数テンプレート更新 |
| `scripts/deploy-sepolia.sh` | Sepolia専用デプロイスクリプト |
| `docs/planning/PHASE2_3_PLAN.md` | Phase 2.3 Gas最適化計画 |
| `docs/aegis/pir/PIR-P2-007.md` | Week 8 PIRレポート |

---

## 実行順序

### Day 1: CI/CD基盤構築

1. GitHub Actions ワークフロー作成 (ci.yml)
   - forge test 自動実行
   - Slither静的解析
   - Coverage レポート

2. テストネットデプロイワークフロー作成
   - 手動トリガー対応
   - 環境変数管理 (GitHub Secrets)

### Day 2: Sepoliaデプロイ準備

3. foundry.toml 設定更新
   ```toml
   [rpc_endpoints]
   sepolia = "${SEPOLIA_RPC_URL}"
   arbitrum_sepolia = "https://sepolia-rollup.arbitrum.io/rpc"
   base_sepolia = "https://sepolia.base.org"
   ```

4. .env.example 拡張
   - SEPOLIA_RPC_URL
   - ETHERSCAN_API_KEY / ARBISCAN_API_KEY / BASESCAN_API_KEY
   - VRF_COORDINATOR (Sepolia)
   - VRF_KEY_HASH (Sepolia)

5. デプロイスクリプト作成
   - L1Vault.sol デプロイ
   - 契約検証 (Etherscan)

### Day 3: テストネットデプロイ実行

6. Ethereum Sepolia デプロイ
   - Faucet からテストETH取得
   - L1Vault デプロイ
   - 基本機能テスト

7. (オプション) Arbitrum/Base Sepolia
   - クロスチェーン互換性確認

### Day 4: レビュー & ドキュメント

8. Phase 2.3計画策定
   - Gas最適化目標設定 (87.5%削減)
   - Batch verification設計
   - Week 9-12スケジュール

9. PIR-P2-007 準備
   - Week 8成果物まとめ
   - セキュリティレビュー
   - Go/No-Go判定準備

---

## テストネット情報

> 参照: NETWORK_DEPLOYMENT_GUIDE.md

### Ethereum Sepolia (優先度1)

| 項目 | 値 |
|------|-----|
| Network Name | Ethereum Sepolia |
| Chain ID | `11155111` |
| Currency | SepoliaETH |
| Block Time | ~12秒 |
| RPC (Public) | `https://rpc.sepolia.org` |
| RPC (Alchemy) | `https://eth-sepolia.g.alchemy.com/v2/<API_KEY>` |
| Explorer | https://sepolia.etherscan.io |
| Faucet | https://faucets.chain.link/sepolia |

### Arbitrum Sepolia (優先度2)

| 項目 | 値 |
|------|-----|
| Network Name | Arbitrum Sepolia |
| Chain ID | `421614` |
| RPC | `https://sepolia-rollup.arbitrum.io/rpc` |
| Explorer | https://sepolia.arbiscan.io |

### Base Sepolia (優先度3)

| 項目 | 値 |
|------|-----|
| Network Name | Base Sepolia |
| Chain ID | `84532` |
| RPC | `https://sepolia.base.org` |
| Explorer | https://sepolia.basescan.org |

### Chainlink VRF (Sepolia)

| 項目 | 値 |
|------|-----|
| VRF Coordinator | `0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625` |
| VRF Key Hash | `0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c` |

---

## Core Principles確認

- [x] CP-1: 完全量子耐性 - 違反なし (インフラ作業のため影響なし)
- [x] CP-2: Self-Custody - 違反なし
- [x] CP-3: Time Lock存在 - 違反なし
- [x] CP-4: Slashing存在 - 違反なし
- [x] CP-5: 透明性 - 違反なし

---

## リスク・懸念事項

| # | リスク | 重要度 | 対策 |
|---|--------|--------|------|
| 1 | Sepolia RPC レート制限 | Low | 複数プロバイダ設定 (Alchemy/Infura) |
| 2 | テストETH不足 | Low | 複数Faucet利用 |
| 3 | GitHub Secrets設定ミス | Medium | ドキュメント化・レビュー必須 |
| 4 | デプロイ時のGas見積もり | Low | ローカルシミュレーション実施 |

---

## 成功基準

| 項目 | 基準 |
|------|------|
| CI/CD | GitHub Actions 正常動作 |
| テスト | 656/656+ 全PASS維持 |
| Slither | HIGH 0, MEDIUM 0 維持 |
| Sepolia | L1Vault デプロイ成功 |
| Phase 2.3計画 | ドキュメント作成完了 |
| PIR-P2-007 | PASS判定 |

---

## 次のマイルストーン

Week 8 完了後:
- Phase 2.3: Gas最適化 (Week 9-12)
  - Batch verification実装
  - Proof compression
  - 87.5% Gas削減達成
- MS-1: ZK-STARK実装 Gate Review (Month 9)

---

**END OF CURRENT PLAN**
