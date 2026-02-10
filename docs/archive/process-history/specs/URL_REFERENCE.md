# Quantum Shield 画面URL一覧

> **最終更新**: 2026-01-25
> **バージョン**: v3.2
> **ベースURL**: `http://localhost:3001` (ポート3000使用中の場合)

---

## 凡例

| マーク | 説明 |
|:------:|------|
| - | 既存画面 |
| **NEW** | Phase 6で新規作成した画面 |
| **v3.1** | v3.1で追加・更新した画面 |

---

## 目次

1. [Consumer App](#1-consumer-app-19画面)
2. [Token Hub (Legacy)](#2-token-hub-legacy-18画面)
3. [Governance (Legacy)](#3-governance-legacy-11画面)
4. [QS Hub (v3.1 統合版)](#4-qs-hub-v31-統合版-14画面)
5. [Prover Portal](#5-prover-portal-9画面)
6. [Observer](#6-observer-7画面)
7. [Explorer](#7-explorer-9画面)
8. [Enterprise Admin](#8-enterprise-admin-v31---18画面)
9. [QS Admin](#9-qs-admin-v31---70画面)

---

## 1. Consumer App (19画面)

一般ユーザー向けの資産ロック・アンロック機能を提供するアプリケーション。

| # | 画面名 | 新規 | 日本語URL | 英語URL |
|---|--------|:----:|-----------|---------|
| 1 | Landing | - | http://localhost:3001/ja/consumer/landing | http://localhost:3001/en/consumer/landing |
| 2 | Dashboard | - | http://localhost:3001/ja/consumer/dashboard | http://localhost:3001/en/consumer/dashboard |
| 3 | Lock | - | http://localhost:3001/ja/consumer/lock | http://localhost:3001/en/consumer/lock |
| 4 | Lock Confirm | - | http://localhost:3001/ja/consumer/lock/confirm | http://localhost:3001/en/consumer/lock/confirm |
| 5 | Lock Processing | - | http://localhost:3001/ja/consumer/lock/processing | http://localhost:3001/en/consumer/lock/processing |
| 6 | Lock Complete | - | http://localhost:3001/ja/consumer/lock/complete | http://localhost:3001/en/consumer/lock/complete |
| 7 | Unlock | - | http://localhost:3001/ja/consumer/unlock | http://localhost:3001/en/consumer/unlock |
| 8 | Unlock Confirm | - | http://localhost:3001/ja/consumer/unlock/confirm | http://localhost:3001/en/consumer/unlock/confirm |
| 9 | Unlock Processing | - | http://localhost:3001/ja/consumer/unlock/processing | http://localhost:3001/en/consumer/unlock/processing |
| 10 | Unlock Complete | - | http://localhost:3001/ja/consumer/unlock/complete | http://localhost:3001/en/consumer/unlock/complete |
| 11 | Emergency Unlock | - | http://localhost:3001/ja/consumer/emergency-unlock | http://localhost:3001/en/consumer/emergency-unlock |
| 12 | History | - | http://localhost:3001/ja/consumer/history | http://localhost:3001/en/consumer/history |
| 13 | History Detail | - | http://localhost:3001/ja/consumer/history/[id] | http://localhost:3001/en/consumer/history/[id] |
| 14 | Notifications | - | http://localhost:3001/ja/consumer/notifications | http://localhost:3001/en/consumer/notifications |
| 15 | Settings | - | http://localhost:3001/ja/consumer/settings | http://localhost:3001/en/consumer/settings |
| 16 | Settings Security | - | http://localhost:3001/ja/consumer/settings/security | http://localhost:3001/en/consumer/settings/security |
| 17 | Settings Keys | - | http://localhost:3001/ja/consumer/settings/keys | http://localhost:3001/en/consumer/settings/keys |
| 18 | Help | - | http://localhost:3001/ja/consumer/help | http://localhost:3001/en/consumer/help |
| 19 | Onboarding | - | http://localhost:3001/ja/consumer/onboarding | http://localhost:3001/en/consumer/onboarding |

---

## 2. Token Hub (Legacy - 18画面)

> ⚠️ **注意**: v3.1ではQS Hubに統合予定。現在は両方存在。

QSトークンのステーキング・報酬管理アプリケーション。

| # | 画面名 | 日本語URL |
|---|--------|-----------|
| 1 | Landing | http://localhost:3001/ja/token-hub/landing |
| 2 | Login | http://localhost:3001/ja/token-hub/login |
| 3 | Dashboard | http://localhost:3001/ja/token-hub/dashboard |
| 4 | Lock | http://localhost:3001/ja/token-hub/lock |
| 5 | Lock Preview | http://localhost:3001/ja/token-hub/lock/preview |
| 6 | Unlock | http://localhost:3001/ja/token-hub/unlock |
| 7 | Rewards | http://localhost:3001/ja/token-hub/rewards |
| 8 | Rewards Claim | http://localhost:3001/ja/token-hub/rewards/claim |
| 9 | Rewards History | http://localhost:3001/ja/token-hub/rewards/history |
| 10 | Delegate | http://localhost:3001/ja/token-hub/delegate |
| 11 | Delegate Detail | http://localhost:3001/ja/token-hub/delegate/[id] |
| 12 | Delegate List | http://localhost:3001/ja/token-hub/delegate-list |
| 13 | Get QS | http://localhost:3001/ja/token-hub/get-qs |
| 14 | Consumer Link | http://localhost:3001/ja/token-hub/consumer-link |
| 15 | Settings | http://localhost:3001/ja/token-hub/settings |
| 16 | Help | http://localhost:3001/ja/token-hub/help |
| 17 | FAQ | http://localhost:3001/ja/token-hub/faq |
| 18 | Onboarding | http://localhost:3001/ja/token-hub/onboarding |

---

## 3. Governance (Legacy - 11画面)

> ⚠️ **注意**: v3.1ではQS Hubに統合予定。現在は両方存在。

プロトコルガバナンスの投票・提案管理アプリケーション。

| # | 画面名 | 日本語URL |
|---|--------|-----------|
| 1 | Landing | http://localhost:3001/ja/governance/landing |
| 2 | Login | http://localhost:3001/ja/governance/login |
| 3 | Dashboard | http://localhost:3001/ja/governance/dashboard |
| 4 | Proposals | http://localhost:3001/ja/governance/proposals |
| 5 | Proposal Detail | http://localhost:3001/ja/governance/proposals/[id] |
| 6 | Create Proposal | http://localhost:3001/ja/governance/create |
| 7 | Council | http://localhost:3001/ja/governance/council |
| 8 | History | http://localhost:3001/ja/governance/history |
| 9 | Settings | http://localhost:3001/ja/governance/settings |
| 10 | FAQ | http://localhost:3001/ja/governance/faq |
| 11 | Onboarding | http://localhost:3001/ja/governance/onboarding |

---

## 4. QS Hub (v3.1 統合版 - 14画面)

> **v3.1 新規**: Token Hub + Governance を統合した新しいハブ

QSトークンのステーキング・報酬管理・ガバナンス機能を統合したハブアプリケーション。

| # | 画面名 | 新規 | 日本語URL |
|---|--------|:----:|-----------|
| 1 | Landing | **v3.1** | http://localhost:3001/ja/qs-hub/landing |
| 2 | Login | **v3.1** | http://localhost:3001/ja/qs-hub/login |
| 3 | Dashboard | **v3.1** | http://localhost:3001/ja/qs-hub/dashboard |
| 4 | Stake Lock | **v3.1** | http://localhost:3001/ja/qs-hub/stake/lock |
| 5 | Stake Extend | **v3.1** | http://localhost:3001/ja/qs-hub/stake/extend |
| 6 | Stake Unlock | **v3.1** | http://localhost:3001/ja/qs-hub/stake/unlock |
| 7 | Rewards | **v3.1** | http://localhost:3001/ja/qs-hub/rewards |
| 8 | Vote Proposals | **v3.1** | http://localhost:3001/ja/qs-hub/vote/proposals |
| 9 | Proposal Detail | **v3.1** | http://localhost:3001/ja/qs-hub/vote/proposals/[id] |
| 10 | Create Proposal | **v3.1** | http://localhost:3001/ja/qs-hub/vote/proposals/create |
| 11 | Vote Delegates | **v3.1** | http://localhost:3001/ja/qs-hub/vote/delegates |
| 12 | Vote History | **v3.1** | http://localhost:3001/ja/qs-hub/vote/history |
| 13 | Council | **v3.1** | http://localhost:3001/ja/qs-hub/council |
| 14 | Settings | **v3.1** | http://localhost:3001/ja/qs-hub/settings |

---

## 5. Prover Portal (9画面)

Proverノード運営者向けの管理ポータル。

| # | 画面名 | 日本語URL |
|---|--------|-----------|
| 1 | Landing | http://localhost:3001/ja/prover/landing |
| 2 | Dashboard | http://localhost:3001/ja/prover/dashboard |
| 3 | Register | http://localhost:3001/ja/prover/register |
| 4 | Node Setup | http://localhost:3001/ja/prover/node-setup |
| 5 | Signatures | http://localhost:3001/ja/prover/signatures |
| 6 | Earnings | http://localhost:3001/ja/prover/earnings |
| 7 | Stake | http://localhost:3001/ja/prover/stake |
| 8 | Settings | http://localhost:3001/ja/prover/settings |
| 9 | Alerts | http://localhost:3001/ja/prover/alerts |

---

## 6. Observer (7画面)

不正監視者向けのモニタリングポータル。

| # | 画面名 | 日本語URL |
|---|--------|-----------|
| 1 | Landing | http://localhost:3001/ja/observer/landing |
| 2 | Dashboard | http://localhost:3001/ja/observer/dashboard |
| 3 | Pending | http://localhost:3001/ja/observer/pending |
| 4 | Suspicious | http://localhost:3001/ja/observer/suspicious |
| 5 | History | http://localhost:3001/ja/observer/history |
| 6 | Earnings | http://localhost:3001/ja/observer/earnings |
| 7 | Settings | http://localhost:3001/ja/observer/settings |

---

## 7. Explorer (9画面)

ブロックチェーンデータの探索・可視化アプリケーション。

| # | 画面名 | 日本語URL |
|---|--------|-----------|
| 1 | Landing | http://localhost:3001/ja/explorer/landing |
| 2 | Overview | http://localhost:3001/ja/explorer/overview |
| 3 | Locks | http://localhost:3001/ja/explorer/locks |
| 4 | Lock Detail | http://localhost:3001/ja/explorer/locks/[id] |
| 5 | Unlocks | http://localhost:3001/ja/explorer/unlocks |
| 6 | Unlock Detail | http://localhost:3001/ja/explorer/unlocks/[id] |
| 7 | Challenges | http://localhost:3001/ja/explorer/challenges |
| 8 | Provers | http://localhost:3001/ja/explorer/provers |
| 9 | Analytics | http://localhost:3001/ja/explorer/analytics |

---

## 8. Enterprise Admin (v3.1 - 18画面)

> **v3.1 定義**: 技術譲渡先企業向けの自社版QS Admin

技術譲渡を受けた企業が自社でQuantum Shieldを運営するための管理ダッシュボード。

| # | 画面名 | 新規 | 日本語URL |
|---|--------|:----:|-----------|
| 1 | Login | - | http://localhost:3001/ja/enterprise/login |
| 2 | Dashboard | **v3.1** | http://localhost:3001/ja/enterprise/dashboard |
| 3 | Provers | - | http://localhost:3001/ja/enterprise/provers |
| 4 | Prover Detail | - | http://localhost:3001/ja/enterprise/provers/[id] |
| 5 | Prover Calendar | **v3.1** | http://localhost:3001/ja/enterprise/provers/calendar |
| 6 | Observers | - | http://localhost:3001/ja/enterprise/observers |
| 7 | Monitoring | - | http://localhost:3001/ja/enterprise/monitoring |
| 8 | Users | - | http://localhost:3001/ja/enterprise/users |
| 9 | Parameters | - | http://localhost:3001/ja/enterprise/parameters |
| 10 | Emergency | - | http://localhost:3001/ja/enterprise/emergency |
| 11 | Support | **v3.1** | http://localhost:3001/ja/enterprise/support |
| 12 | Team | - | http://localhost:3001/ja/enterprise/team |
| 13 | Team Invite | - | http://localhost:3001/ja/enterprise/team/invite |
| 14 | Audit Log | **v3.1** | http://localhost:3001/ja/enterprise/audit-log |
| 15 | Settings | **v3.1** | http://localhost:3001/ja/enterprise/settings |
| 16 | Help | - | http://localhost:3001/ja/enterprise/help |
| 17 | Terms | - | http://localhost:3001/ja/enterprise/terms |
| 18 | Privacy | - | http://localhost:3001/ja/enterprise/privacy |

### v3.1 主要機能

- **Dashboard**: 6KPI + EnvironmentSelector + Action Items
- **Prover Calendar**: メンテナンススケジュール管理
- **Support**: QS財団へのチケットシステム連携
- **Audit Log**: 高度な検索 + 検索条件保存
- **Settings**: 6タブ構成（組織/ブランディング/通知/環境/開発者/ライセンス）

---

## 9. QS Admin (v3.1 - 70画面)

> **v3.1 定義**: パブリック版QS運営 + SaaS + 技術譲渡先（Licensee）管理のトリプルロール

Quantum Shield財団向けの統合管理システム。

### 9.1 Overview セクション

| # | 画面名 | 日本語URL |
|---|--------|-----------|
| 1 | Dashboard | http://localhost:3001/ja/admin/dashboard |
| 2 | Emergency | http://localhost:3001/ja/admin/emergency |

### 9.2 Public版管理セクション

| # | 画面名 | 日本語URL |
|---|--------|-----------|
| 3 | Public Users | http://localhost:3001/ja/admin/public/users |
| 4 | Public User Detail | http://localhost:3001/ja/admin/public/users/[id] |
| 5 | Public User Stats | http://localhost:3001/ja/admin/public/users/stats |
| 6 | Public Provers | http://localhost:3001/ja/admin/public/provers |
| 7 | Public Prover Detail | http://localhost:3001/ja/admin/public/provers/[id] |
| 8 | Prover Applications | http://localhost:3001/ja/admin/public/provers/applications |
| 9 | Prover Performance | http://localhost:3001/ja/admin/public/provers/performance |
| 10 | Prover Slashing | http://localhost:3001/ja/admin/public/provers/slashing |
| 11 | Public Observers | http://localhost:3001/ja/admin/public/observers |
| 12 | Token Holders | http://localhost:3001/ja/admin/public/holders |
| 13 | Voting Power | http://localhost:3001/ja/admin/public/voting-power |
| 14 | Delegates | http://localhost:3001/ja/admin/public/delegates |
| 15 | Governance | http://localhost:3001/ja/admin/public/governance |
| 16 | Treasury | http://localhost:3001/ja/admin/public/treasury |
| 17 | Protocol Monitor | http://localhost:3001/ja/admin/public/protocol |
| 18 | Protocol Alerts | http://localhost:3001/ja/admin/public/protocol/alerts |
| 19 | Protocol Contracts | http://localhost:3001/ja/admin/public/protocol/contracts |

### 9.3 SaaS版管理セクション

| # | 画面名 | 日本語URL |
|---|--------|-----------|
| 20 | SaaS Operators | http://localhost:3001/ja/admin/saas/operators |
| 21 | Operator Detail | http://localhost:3001/ja/admin/saas/operators/[id] |
| 22 | Operator Applications | http://localhost:3001/ja/admin/saas/operators/applications |
| 23 | Operator Contracts | http://localhost:3001/ja/admin/saas/operators/contracts |
| 24 | Operator Plans | http://localhost:3001/ja/admin/saas/operators/plans |
| 25 | SaaS Users | http://localhost:3001/ja/admin/saas/users |
| 26 | SaaS User Stats | http://localhost:3001/ja/admin/saas/users/stats |
| 27 | SaaS User Risks | http://localhost:3001/ja/admin/saas/users/risks |
| 28 | SaaS QS Provers | http://localhost:3001/ja/admin/saas/provers/qs |
| 29 | SaaS Operator Provers | http://localhost:3001/ja/admin/saas/provers/operator |
| 30 | SaaS Prover Performance | http://localhost:3001/ja/admin/saas/provers/performance |
| 31 | SaaS Prover SLA | http://localhost:3001/ja/admin/saas/provers/sla |
| 32 | SaaS Observers | http://localhost:3001/ja/admin/saas/observers |
| 33 | SaaS Observer Status | http://localhost:3001/ja/admin/saas/observers/status |
| 34 | SaaS Billing | http://localhost:3001/ja/admin/saas/billing |
| 35 | SaaS Usage | http://localhost:3001/ja/admin/saas/billing/usage |
| 36 | SaaS Revenue | http://localhost:3001/ja/admin/saas/billing/revenue |
| 37 | SaaS Payments | http://localhost:3001/ja/admin/saas/billing/payments |
| 38 | SaaS Support | http://localhost:3001/ja/admin/saas/support |
| 39 | SaaS Support History | http://localhost:3001/ja/admin/saas/support/history |
| 40 | Infrastructure | http://localhost:3001/ja/admin/saas/infrastructure |
| 41 | Infrastructure Capacity | http://localhost:3001/ja/admin/saas/infrastructure/capacity |
| 42 | Infrastructure SLA | http://localhost:3001/ja/admin/saas/infrastructure/sla |

### 9.4 License版管理セクション

| # | 画面名 | 日本語URL |
|---|--------|-----------|
| 43 | Licensees | http://localhost:3001/ja/admin/licensees |
| 44 | Licensee Detail | http://localhost:3001/ja/admin/licensees/[id] |
| 45 | Licensee Support | http://localhost:3001/ja/admin/licensees/[id]/support |
| 46 | License Companies | http://localhost:3001/ja/admin/license/companies |
| 47 | License Company Detail | http://localhost:3001/ja/admin/license/companies/[id] |
| 48 | License Projects | http://localhost:3001/ja/admin/license/projects |
| 49 | License Project Detail | http://localhost:3001/ja/admin/license/projects/[id] |
| 50 | License Documents | http://localhost:3001/ja/admin/license/documents |
| 51 | License Renewals | http://localhost:3001/ja/admin/license/renewals |
| 52 | License Training | http://localhost:3001/ja/admin/license/training |
| 53 | Updates | http://localhost:3001/ja/admin/updates |
| 54 | Licensee Support (Top) | http://localhost:3001/ja/admin/support |
| 55 | Billing | http://localhost:3001/ja/admin/billing |

### 9.5 Foundation設定セクション

| # | 画面名 | 日本語URL |
|---|--------|-----------|
| 56 | Members | http://localhost:3001/ja/admin/settings/members |
| 57 | Roles | http://localhost:3001/ja/admin/settings/roles |
| 58 | Audit Log | http://localhost:3001/ja/admin/settings/audit-log |
| 59 | Security | http://localhost:3001/ja/admin/settings/security |
| 60 | System | http://localhost:3001/ja/admin/settings/system |

### 9.6 その他の管理画面

| # | 画面名 | 日本語URL |
|---|--------|-----------|
| 61 | Audit (Top) | http://localhost:3001/ja/admin/audit |
| 62 | Staff | http://localhost:3001/ja/admin/staff |
| 63 | Nodes | http://localhost:3001/ja/admin/nodes |
| 64 | Prover (Legacy) | http://localhost:3001/ja/admin/prover |
| 65 | Parameters | http://localhost:3001/ja/admin/parameters |
| 66 | TX Monitor | http://localhost:3001/ja/admin/tx-monitor |
| 67 | Reports | http://localhost:3001/ja/admin/reports |
| 68 | Community | http://localhost:3001/ja/admin/community |
| 69 | Onboarding | http://localhost:3001/ja/admin/onboarding |
| 70 | Enterprise (Legacy) | http://localhost:3001/ja/admin/enterprise |

---

## 画面サマリー (v3.2)

| アプリケーション | 画面数 | バージョン | 備考 |
|------------------|:------:|:----------:|------|
| Consumer App | 19 | - | 資産ロック・アンロック |
| Token Hub (Legacy) | 18 | - | ⚠️ QS Hubに統合予定 |
| Governance (Legacy) | 11 | - | ⚠️ QS Hubに統合予定 |
| QS Hub | 14 | **v3.1** | Token Hub + Governance統合版 |
| Prover Portal | 9 | - | 署名プロバイダ向け |
| Observer | 7 | - | 不正監視者向け |
| Explorer | 9 | - | 透明性確保 |
| Enterprise Admin | 18 | **v3.1** | 技術譲渡先向け自社版Admin |
| QS Admin | 70 | **v3.1** | 財団運営（Public + SaaS + License） |
| **合計** | **175** | | |

### 統合完了後の予定画面数

| アプリケーション | 画面数 | 備考 |
|------------------|:------:|------|
| Consumer App | 19 | |
| QS Hub | 14 | Token Hub + Governance統合 |
| Prover Portal | 9 | |
| Observer | 7 | |
| Explorer | 9 | |
| Enterprise Admin | 18 | |
| QS Admin | 70 | |
| **合計** | **146** | Token Hub/Governance削除後 |

---

## クイックリンク

### 各アプリケーションのエントリーポイント

| アプリケーション | 日本語URL |
|------------------|-----------|
| Consumer App | http://localhost:3001/ja/consumer/landing |
| Token Hub (Legacy) | http://localhost:3001/ja/token-hub/landing |
| Governance (Legacy) | http://localhost:3001/ja/governance/landing |
| QS Hub (v3.1) | http://localhost:3001/ja/qs-hub/landing |
| Prover Portal | http://localhost:3001/ja/prover/landing |
| Observer | http://localhost:3001/ja/observer/landing |
| Explorer | http://localhost:3001/ja/explorer/landing |
| Enterprise Admin | http://localhost:3001/ja/enterprise/login |
| QS Admin | http://localhost:3001/ja/admin/dashboard |

### 各アプリケーションのダッシュボード

| アプリケーション | 日本語URL |
|------------------|-----------|
| Consumer App | http://localhost:3001/ja/consumer/dashboard |
| Token Hub (Legacy) | http://localhost:3001/ja/token-hub/dashboard |
| Governance (Legacy) | http://localhost:3001/ja/governance/dashboard |
| QS Hub (v3.1) | http://localhost:3001/ja/qs-hub/dashboard |
| Prover Portal | http://localhost:3001/ja/prover/dashboard |
| Observer | http://localhost:3001/ja/observer/dashboard |
| Enterprise Admin | http://localhost:3001/ja/enterprise/dashboard |
| QS Admin | http://localhost:3001/ja/admin/dashboard |

---

## 注意事項

1. **ポート番号**: デフォルトは3000ですが、使用中の場合は3001等が使われます

2. **動的ルート**: `[id]` を含むURLは、実際のIDに置き換えてアクセスしてください
   - 例: `/ja/enterprise/provers/prover_001`
   - 例: `/ja/admin/licensees/lic_001`

3. **言語切り替え**: URLの `ja` を `en` に変更することで英語版にアクセスできます

4. **開発サーバー起動**:
   ```bash
   cd apps/web
   pnpm dev
   ```

5. **Legacy画面について**: Token Hub と Governance は QS Hub に統合予定ですが、現在は両方存在しています。統合完了後、旧URLからはリダイレクトされる予定です。

---

## 更新履歴

| バージョン | 日付 | 変更内容 |
|------------|------|----------|
| v3.2 | 2026-01-25 | 実装ファイルに基づきURL一覧を更新、Token Hub/Governance/QS Hub併存状態を反映 |
| v3.1 | 2026-01-24 | Enterprise/QS Admin v3.1対応 |
| v3.0 | 2026-01-22 | 初版作成 |
