# Phase 5: バックエンド統合計画書

> **Version**: 1.0
> **Date**: 2026-01-11
> **Status**: Draft
> **Author**: Claude (Integration Analysis)

---

## 1. Executive Summary

### 1.1 現状

| カテゴリ | 完了 | 未完了 | 完了率 |
|---------|:----:|:-----:|:------:|
| **UIモック** | 107画面 | 0 | 100% |
| **API実装** | 10 EP | 82 EP | 11% |
| **L1コントラクト** | 6 | 2 | 75% |
| **L3 Aegis** | コア完了 | Edition/Node管理 | 80% |
| **Event Bridge** | 基本完了 | UI通知層 | 90% |

### 1.2 Phase 5 目標

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Phase 5: モック → 実動アプリケーション                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   [UIモック 107画面]  ──統合──>  [実動アプリ]                            │
│          │                           │                                  │
│          ▼                           ▼                                  │
│   [API 10 EP]        ──拡張──>  [API 92 EP]                             │
│          │                           │                                  │
│          ▼                           ▼                                  │
│   [L1/L3 基盤]       ──追加──>  [Edition/Prover完全対応]                │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. 発見されたギャップ一覧

### 2.1 API ギャップ（89%未実装）

| システム | 必要API | 実装済 | 未実装 | 優先度 |
|---------|:------:|:-----:|:-----:|:------:|
| Consumer App | 7 | 1 | 6 | P0 |
| Token Hub | 9 | 0 | 9 | P0 |
| Governance | 8 | 0 | 8 | P0 |
| Prover Portal | 11 | 2 | 9 | P0 |
| Observer | 8 | 0 | 8 | P1 |
| Explorer | 12 | 0 | 12 | P1 |
| Enterprise Admin | 19 | 0 | 19 | P0 |
| QS Admin | 14 | 3 | 11 | P0 |
| **合計** | **88** | **6** | **82** | |

### 2.2 コントラクト ギャップ

| コントラクト | 状態 | 影響 | 優先度 |
|------------|:----:|------|:------:|
| **EditionConfig.sol** | ❌ 未実装 | Enterprise/Decentralized切替不可 | 🔴 P0 |
| **ProverRegistry.sol** | ❌ 未実装 | Prover登録フロー全滅 | 🔴 P0 |
| GovernanceSwitch.sol | ✅ 実装済 | - | - |
| SecurityCouncil.sol | ✅ 実装済 | - | - |
| Governor.sol | ✅ 実装済 | - | - |
| L1Vault.sol | ✅ 実装済 | - | - |

### 2.3 L3 Aegis ギャップ

| コンポーネント | 状態 | 影響 | 優先度 |
|--------------|:----:|------|:------:|
| **NodeManager** | ❌ 未実装 | Phase 4 動的ノード追加不可 | 🔴 P0 |
| **Edition判定ロジック** | ⚠️ 部分 | Enterprise/Decen分岐なし | 🟠 P1 |
| Consensus (4BFT) | ✅ 実装済 | 4ノード固定 | - |
| Sequencer | ✅ 実装済 | - | - |

### 2.4 機能 ギャップ

| 機能 | モック | API | Backend | 優先度 |
|------|:-----:|:---:|:-------:|:------:|
| **Enterprise申込ページ** | ❌ なし | ❌ なし | ❌ なし | 🔴 P0 |
| **4BFT契約者管理** | ✅ あり | ❌ なし | ❌ なし | 🔴 P0 |
| **多言語対応 (i18n)** | ⚠️ UI設計のみ | ❌ なし | - | 🟠 P1 |
| **リアルタイム通知** | ⚠️ 想定のみ | ❌ なし | ⚠️ 部分 | 🟠 P1 |

---

## 3. Phase 5 実装計画

### 3.1 全体スケジュール

```
Phase 5.1: 基盤整備 (Week 1-2)
├── EditionConfig.sol 実装
├── ProverRegistry.sol 実装
├── 認証基盤 (SIWE→JWT)
└── API Client 認証統合

Phase 5.2: コアAPI実装 (Week 3-4)
├── Consumer App API (6 EP)
├── Token Hub API (9 EP)
├── Prover Portal API (9 EP)
└── WebSocket/SSE基盤

Phase 5.3: 管理系API実装 (Week 5-6)
├── QS Admin API (11 EP)
├── Enterprise Admin API (19 EP)
├── Enterprise申込フロー
└── 4BFT契約者管理

Phase 5.4: 補完機能実装 (Week 7-8)
├── Governance API (8 EP)
├── Observer API (8 EP)
├── Explorer API (12 EP)
└── i18n対応

Phase 5.5: 統合・テスト (Week 9-10)
├── UI ↔ API 統合
├── E2Eテスト
├── Edition切替テスト
└── 本番デプロイ準備
```

### 3.2 Phase 5.1 詳細: 基盤整備

#### 3.2.1 EditionConfig.sol 実装

**ファイル**: `contracts/src/core/EditionConfig.sol`

```solidity
// 必要な実装
contract EditionConfig {
    enum Edition { ENTERPRISE, DECENTRALIZED }
    enum ConsensusType { FIXED_4BFT, DYNAMIC_PBFT }
    enum ProverApprovalMode {
        CONTRACT_BASED,      // Enterprise
        FOUNDATION_INVITE,   // Phase 1-2
        COUNCIL_VOTE,        // Phase 3
        STAKE_AUTO           // Phase 4+
    }

    struct Settings {
        Edition edition;
        ConsensusType consensus;
        ProverApprovalMode approvalMode;
        uint256 minNodes;
        uint256 maxNodes;
    }

    function switchEdition(Edition target) external;
    function getSettings() external view returns (Settings memory);
}
```

**工数**: 2-3日

#### 3.2.2 ProverRegistry.sol 実装

**ファイル**: `contracts/src/prover/ProverRegistry.sol`

```solidity
// 必要な実装
contract ProverRegistry {
    struct Prover {
        address operator;
        bytes32 sphincsPublicKey;
        uint256 stake;
        ProverStatus status;
        uint256 totalSignatures;
        uint256 slashCount;
    }

    function register(bytes32 sphincsKey, bytes calldata hsmAttestation) external payable;
    function approve(address prover) external; // Council/Foundation
    function autoApprove(address prover) external; // Stake条件達成時
    function slash(address prover, uint256 amount, string calldata reason) external;
}
```

**工数**: 3-4日

#### 3.2.3 認証基盤

**現状**: SIWE基盤あり、JWT未統合

**必要な実装**:
```typescript
// services/api/src/routes/auth.rs
POST /v1/auth/siwe      // SIWE署名検証 → JWT発行
POST /v1/auth/refresh   // JWTリフレッシュ
GET  /v1/auth/me        // 現在のユーザー情報
```

**工数**: 2日

### 3.3 Phase 5.2 詳細: コアAPI実装

#### Consumer App API (6 EP)

| エンドポイント | 機能 | 工数 |
|--------------|------|:----:|
| GET /v1/user/dashboard | 統計情報 | 0.5日 |
| GET /v1/user/transactions | 取引履歴 | 0.5日 |
| GET /v1/user/transactions/:id | 取引詳細 | 0.5日 |
| GET /v1/user/settings | 設定取得 | 0.5日 |
| POST /v1/user/settings | 設定更新 | 0.5日 |
| GET /v1/user/keys | 鍵情報 | 0.5日 |

#### Token Hub API (9 EP)

| エンドポイント | 機能 | 工数 |
|--------------|------|:----:|
| GET /v1/token-hub/dashboard | veQS残高・投票力 | 0.5日 |
| POST /v1/token-hub/lock | veQS Lock | 1日 |
| GET /v1/token-hub/locks | Lock一覧 | 0.5日 |
| POST /v1/token-hub/extend | 期間延長 | 0.5日 |
| GET /v1/token-hub/delegates | Delegate一覧 | 0.5日 |
| POST /v1/token-hub/delegate | 委任実行 | 1日 |
| GET /v1/token-hub/rewards | 報酬情報 | 0.5日 |
| POST /v1/token-hub/claim | 報酬請求 | 1日 |
| GET /v1/token-hub/delegations/my | 自分の委任 | 0.5日 |

#### Prover Portal API (9 EP)

| エンドポイント | 機能 | 工数 |
|--------------|------|:----:|
| GET /v1/prover/dashboard | 統計 | 0.5日 |
| GET /v1/prover/queue | 署名キュー | 1日 |
| GET /v1/prover/queue/:id | キュー詳細 | 0.5日 |
| POST /v1/prover/sign | 署名実行 | 1日 |
| GET /v1/prover/metrics | 実績 | 0.5日 |
| GET /v1/prover/alerts | アラート | 0.5日 |
| GET /v1/prover/challenges | チャレンジ | 0.5日 |
| POST /v1/prover/challenge-response | 回答提出 | 1日 |
| POST /v1/prover/exit | 終了申請 | 0.5日 |

### 3.4 Phase 5.3 詳細: 管理系API

#### Enterprise申込フロー（新規実装）

**モック追加が必要**:
- `system_07_enterprise/wip/mocks/00_application.html` - 申込フォーム
- `system_07_enterprise/wip/mocks/00_onboarding.html` - オンボーディング

**API追加**:
| エンドポイント | 機能 | 工数 |
|--------------|------|:----:|
| POST /v1/enterprise/apply | 申込受付 | 1日 |
| GET /v1/enterprise/application/:id | 申込状況 | 0.5日 |
| POST /v1/enterprise/contract/sign | 契約署名 | 1日 |
| GET /v1/enterprise/onboarding | オンボーディング状態 | 0.5日 |

#### 4BFT契約者管理（QS Admin側）

**API追加**:
| エンドポイント | 機能 | 工数 |
|--------------|------|:----:|
| GET /v1/admin/enterprise/accounts | 企業一覧 | 0.5日 |
| GET /v1/admin/enterprise/accounts/:id | 企業詳細 | 0.5日 |
| POST /v1/admin/enterprise/accounts | 企業登録 | 1日 |
| PUT /v1/admin/enterprise/accounts/:id | 企業更新 | 0.5日 |
| GET /v1/admin/enterprise/contracts | 契約一覧 | 0.5日 |
| POST /v1/admin/enterprise/contracts | 契約作成 | 1日 |

### 3.5 Phase 5.4 詳細: 補完機能

#### i18n対応

**導入ライブラリ**: `next-intl`

**必要な対応**:
1. ライブラリ導入・設定
2. 翻訳ファイル作成 (ja/en)
3. 全コンポーネントの言語値外部化
4. 言語切替UI実装

**工数**: 5日（全システム共通）

#### Governance API (8 EP)

| エンドポイント | 機能 | 工数 |
|--------------|------|:----:|
| GET /v1/governance/dashboard | 概要 | 0.5日 |
| GET /v1/governance/proposals | 提案一覧 | 0.5日 |
| GET /v1/governance/proposals/:id | 提案詳細 | 0.5日 |
| POST /v1/governance/proposals | 提案作成 | 1日 |
| POST /v1/governance/vote | 投票 | 1日 |
| GET /v1/governance/votes/:id | 投票結果 | 0.5日 |
| GET /v1/governance/activity | 活動履歴 | 0.5日 |
| GET /v1/governance/council | Council情報 | 0.5日 |

---

## 4. 詳細ギャップ分析

### 4.1 Enterprise Edition (4BFT) 専用機能

| 機能 | モック | API | Contract | 状態 |
|------|:-----:|:---:|:--------:|:----:|
| 企業申込ページ | ❌ | ❌ | - | **要追加** |
| 契約管理 | ❌ | ❌ | ❌ | **要追加** |
| SLA設定 | ❌ | ❌ | - | **要追加** |
| 課金管理 | ❌ | ❌ | - | **要追加** |
| 4BFTノード監視 | ✅ | ❌ | - | **API必要** |
| 企業ユーザー管理 | ✅ | ❌ | - | **API必要** |

### 4.2 Decentralized Edition 専用機能

| 機能 | モック | API | Contract | 状態 |
|------|:-----:|:---:|:--------:|:----:|
| Token Hub (veQS) | ✅ | ❌ | ✅ | **API必要** |
| Governance投票 | ✅ | ❌ | ✅ | **API必要** |
| Delegation | ✅ | ❌ | ✅ | **API必要** |
| Observer/Challenger | ✅ | ❌ | - | **API必要** |
| 動的ノード管理 | - | ❌ | ❌ | **Phase 4** |

### 4.3 共通機能

| 機能 | モック | API | Contract | 状態 |
|------|:-----:|:---:|:--------:|:----:|
| Lock/Unlock | ✅ | ✅ | ✅ | ✅ 完了 |
| Edition切替 | - | ✅ | ❌ | **Contract必要** |
| Prover登録 | ✅ | ⚠️ | ❌ | **Contract必要** |
| Explorer | ✅ | ❌ | - | **API必要** |
| 多言語 (i18n) | ⚠️ | - | - | **実装必要** |

---

## 5. 工数見積もり

### 5.1 総工数

| フェーズ | 内容 | 工数 |
|---------|------|:----:|
| Phase 5.1 | 基盤整備 | **10日** |
| Phase 5.2 | コアAPI | **12日** |
| Phase 5.3 | 管理系API | **15日** |
| Phase 5.4 | 補完機能 | **12日** |
| Phase 5.5 | 統合・テスト | **10日** |
| **合計** | | **59日** |

### 5.2 カテゴリ別工数

| カテゴリ | 工数 |
|---------|:----:|
| Contract実装 | 7日 |
| API実装 (82 EP) | 35日 |
| L3 Aegis拡張 | 5日 |
| UI統合 | 7日 |
| i18n対応 | 5日 |

---

## 6. リスクと対策

### 6.1 技術リスク

| リスク | 影響度 | 対策 |
|--------|:-----:|------|
| EditionConfig設計変更 | 高 | 仕様書レビュー優先 |
| L3 Aegis統合複雑性 | 中 | 段階的統合、テスト強化 |
| WebSocket負荷 | 中 | スケーラビリティ検証 |

### 6.2 スケジュールリスク

| リスク | 影響度 | 対策 |
|--------|:-----:|------|
| API実装遅延 | 高 | 優先度順に実装 |
| テスト不足 | 高 | TDD採用 |
| 仕様変更 | 中 | 変更管理プロセス |

---

## 7. 成功基準

### 7.1 Phase 5 完了基準

- [ ] 全8システム107画面が実APIと接続
- [ ] 92 APIエンドポイント実装完了
- [ ] EditionConfig.sol, ProverRegistry.sol デプロイ
- [ ] E2Eテスト全PASS
- [ ] i18n (日本語/英語) 対応完了
- [ ] Enterprise申込フロー実装

### 7.2 品質基準

- API応答時間: 95%ile < 500ms
- テストカバレッジ: > 80%
- セキュリティ監査: Critical/High 0件

---

## 8. 次のアクション

### 8.1 即時 (今週)

1. **EditionConfig.sol 設計レビュー** - EDITION_SWITCH_SPEC.md との最終確認
2. **ProverRegistry.sol 設計レビュー** - 承認フロー詳細化
3. **認証基盤実装** - SIWE → JWT

### 8.2 短期 (来週)

4. **Contract実装開始** - EditionConfig.sol
5. **Consumer App API実装** - Dashboard, History
6. **Token Hub API実装** - Lock, Delegate

### 8.3 中期 (3-4週)

7. **Enterprise申込フロー** - モック + API + 統合
8. **Governance API実装**
9. **i18n基盤導入**

---

## Appendix A: ファイルパス一覧

### A.1 モック

```
docs_new/01_phase/04_phase4/01_design/
├── system_01_consumer/wip/mocks/     (19 HTML)
├── system_02_token_hub/mocks/        (19 HTML)
├── system_03_governance/wip/mocks/   (6 HTML)
├── system_04_prover/wip/mocks/       (11 HTML)
├── system_05_observer/wip/mocks/     (7 HTML)
├── system_06_explorer/wip/mocks/     (8 HTML)
├── system_07_enterprise/wip/mocks/   (25 HTML)
└── system_08_qs_admin/wip/mocks/     (12 HTML)
```

### A.2 API実装

```
services/api/src/routes/
├── mod.rs
├── lock.rs        (✅ 実装済)
├── unlock.rs      (✅ 実装済)
├── status.rs      (✅ 実装済)
├── prover.rs      (✅ 部分実装)
├── edition.rs     (✅ 実装済)
├── admin.rs       (✅ 部分実装)
├── health.rs      (✅ 実装済)
├── auth.rs        (❌ 未実装)
├── user.rs        (❌ 未実装)
├── token_hub.rs   (❌ 未実装)
├── governance.rs  (❌ 未実装)
├── observer.rs    (❌ 未実装)
├── explorer.rs    (❌ 未実装)
└── enterprise.rs  (❌ 未実装)
```

### A.3 コントラクト

```
contracts/src/
├── L1Vault.sol           (✅ 実装済)
├── QuantumShield.sol     (✅ 実装済)
├── SPHINCSVerifier.sol   (✅ 実装済)
├── VRFConsumer.sol       (✅ 実装済)
├── core/
│   └── EditionConfig.sol (❌ 未実装)
└── prover/
    └── ProverRegistry.sol (❌ 未実装)

l3-aegis/src/governance/
├── GovernanceSwitch.sol  (✅ 実装済)
├── SecurityCouncil.sol   (✅ 実装済)
├── Governor.sol          (✅ 実装済)
└── Timelock.sol          (✅ 実装済)
```

---

## Appendix B: API エンドポイント全リスト

### B.1 実装済み (10 EP)

```
# Core
POST /v1/lock
POST /v1/unlock
POST /v1/unlock/emergency
GET  /v1/status/:lock_id
GET  /v1/status/pending

# Prover
POST /v1/prover/register
GET  /v1/prover/:prover_id

# Edition
GET  /v1/edition
POST /v1/edition/switch

# Health
GET  /v1/health
```

### B.2 未実装 (82 EP)

```
# Auth (3)
POST /v1/auth/siwe
POST /v1/auth/refresh
GET  /v1/auth/me

# User/Consumer (6)
GET  /v1/user/dashboard
GET  /v1/user/transactions
GET  /v1/user/transactions/:id
GET  /v1/user/settings
POST /v1/user/settings
GET  /v1/user/keys

# Token Hub (9)
GET  /v1/token-hub/dashboard
POST /v1/token-hub/lock
GET  /v1/token-hub/locks
POST /v1/token-hub/extend
GET  /v1/token-hub/delegates
POST /v1/token-hub/delegate
GET  /v1/token-hub/rewards
POST /v1/token-hub/claim
GET  /v1/token-hub/delegations/my

# Governance (8)
GET  /v1/governance/dashboard
GET  /v1/governance/proposals
GET  /v1/governance/proposals/:id
POST /v1/governance/proposals
POST /v1/governance/vote
GET  /v1/governance/votes/:id
GET  /v1/governance/activity
GET  /v1/governance/council

# Prover Extended (9)
GET  /v1/prover/dashboard
GET  /v1/prover/queue
GET  /v1/prover/queue/:id
POST /v1/prover/sign
GET  /v1/prover/metrics
GET  /v1/prover/alerts
GET  /v1/prover/challenges
POST /v1/prover/challenge-response
POST /v1/prover/exit

# Observer (8)
GET  /v1/observer/dashboard
GET  /v1/observer/pending-unlocks
GET  /v1/observer/suspicious-txs
GET  /v1/observer/history
POST /v1/observer/challenge
GET  /v1/observer/challenge/:id
GET  /v1/observer/earnings
POST /v1/observer/claim-earnings

# Explorer (12)
GET  /v1/explorer/overview
GET  /v1/explorer/search
GET  /v1/explorer/locks
GET  /v1/explorer/locks/:id
GET  /v1/explorer/unlocks
GET  /v1/explorer/unlocks/:id
GET  /v1/explorer/challenges
GET  /v1/explorer/challenges/:id
GET  /v1/explorer/address/:addr
GET  /v1/explorer/provers
GET  /v1/explorer/provers/:id
GET  /v1/explorer/analytics

# Enterprise Admin (19)
GET  /v1/enterprise/dashboard/overview
GET  /v1/enterprise/dashboard/tvl
GET  /v1/enterprise/dashboard/volume
GET  /v1/enterprise/transactions
GET  /v1/enterprise/transactions/:id
POST /v1/enterprise/transactions/export
GET  /v1/enterprise/users
GET  /v1/enterprise/users/:id
POST /v1/enterprise/users
POST /v1/enterprise/users/invite
POST /v1/enterprise/users/:id/role
GET  /v1/enterprise/api-keys
POST /v1/enterprise/api-keys
GET  /v1/enterprise/api-keys/:id/usage
GET  /v1/enterprise/settings
POST /v1/enterprise/settings
GET  /v1/enterprise/security-settings
GET  /v1/enterprise/reports
GET  /v1/enterprise/audit-log

# QS Admin Extended (11)
GET  /v1/admin/dashboard
GET  /v1/admin/transactions
GET  /v1/admin/nodes
GET  /v1/admin/staff
POST /v1/admin/staff
GET  /v1/admin/reports
GET  /v1/admin/audit-log
GET  /v1/admin/parameters
POST /v1/admin/parameters/change-request
GET  /v1/admin/enterprise/accounts
POST /v1/admin/enterprise/accounts
```

---

**Document End**
