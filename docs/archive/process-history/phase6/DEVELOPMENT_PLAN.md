# Quantum Shield 開発計画書

> **最終更新**: 2026-01-18
> **バージョン**: 1.0.0

---

## 目次

1. [製品概要](#1-製品概要)
2. [システム一覧](#2-システム一覧)
3. [Consumer App](#3-consumer-app)
4. [Token Hub](#4-token-hub)
5. [Governance](#5-governance)
6. [Prover Portal](#6-prover-portal)
7. [Observer](#7-observer)
8. [Explorer](#8-explorer)
9. [Enterprise Admin](#9-enterprise-admin)
10. [QS Admin](#10-qs-admin)
11. [進捗サマリー](#11-進捗サマリー)

---

## 1. 製品概要

### 1.1 Quantum Shield とは

量子耐性暗号を用いた資産保護プロトコル。Dilithium署名とSTARK証明により、量子コンピュータ時代でも安全な資産管理を実現。

### 1.2 製品ライン

```
Quantum Shield
├── パブリック版（分散型）
│   ・完全分散型、パーミッションレス
│   ・誰でもLock/Unlock、Proverになれる
│   ・QSトークンでガバナンス
│
└── 企業版（4BFT Edition）
    ├── SaaS版（Managed）
    │   ・QS財団がインフラ提供
    │   ・月額/従量課金
    │   ・迅速導入
    │
    └── 技術譲渡版（On-Premise）
        ・ソースコード提供
        ・一括ライセンス料
        ・自社で完全運用
```

### 1.3 登場人物

| バージョン | 登場人物 |
|-----------|---------|
| パブリック版 | ユーザー、Prover、Observer、トークン保有者、デリゲート |
| 企業版SaaS | 運営企業、エンドユーザー、Prover、Observer |
| 技術譲渡版 | 運営企業（導入後はQS財団管理外） |
| 全版共通 | QS財団（システム提供者） |

---

## 2. システム一覧

| # | システム | 対象者 | 対象版 | 現状画面数 | 最終画面数 |
|---|----------|--------|--------|:----------:|:----------:|
| 1 | Consumer App | ユーザー | 全版 | 19 | 19 |
| 2 | Token Hub | トークン保有者 | パブリック | 16 | 16 |
| 3 | Governance | トークン保有者 | パブリック | 6 | 6 |
| 4 | Prover Portal | Prover | 全版 | 9 | 9 |
| 5 | Observer | 監視者 | パブリック(主) | 7 | 7 |
| 6 | Explorer | 全員 | 全版 | 9 | 9 |
| 7 | Enterprise Admin | 運営企業 | 企業版SaaS | 25 | 33 |
| 8 | QS Admin | QS財団 | 全版管理 | 12 | 61 |
| | **合計** | | | **103** | **160** |

---

## 3. Consumer App

**対象者**: エンドユーザー（パブリック版 & 企業版SaaS の顧客）
**URL**: `/consumer/*`
**状態**: ✅ 完了（19画面）

### 3.1 機能一覧

| # | 画面 | パス | 機能 | 状態 |
|---|------|------|------|:----:|
| 1 | ランディング | `/consumer/landing` | サービス紹介、CTA | ✅ |
| 2 | ダッシュボード | `/consumer/dashboard` | 資産残高、ロック状況一覧 | ✅ |
| 3 | ロック | `/consumer/lock` | 資産ロック画面 | ✅ |
| 4 | ロック確認 | `/consumer/lock/confirm` | ロック内容確認 | ✅ |
| 5 | ロック処理中 | `/consumer/lock/processing` | トランザクション処理中 | ✅ |
| 6 | ロック完了 | `/consumer/lock/complete` | ロック完了通知 | ✅ |
| 7 | アンロック | `/consumer/unlock` | アンロック申請画面 | ✅ |
| 8 | アンロック確認 | `/consumer/unlock/confirm` | アンロック内容確認 | ✅ |
| 9 | アンロック処理中 | `/consumer/unlock/processing` | トランザクション処理中 | ✅ |
| 10 | アンロック完了 | `/consumer/unlock/complete` | アンロック完了通知 | ✅ |
| 11 | 緊急アンロック | `/consumer/emergency-unlock` | 緊急アンロック申請 | ✅ |
| 12 | 履歴一覧 | `/consumer/history` | 取引履歴一覧 | ✅ |
| 13 | 履歴詳細 | `/consumer/history/[id]` | 取引詳細 | ✅ |
| 14 | 通知 | `/consumer/notifications` | 通知一覧 | ✅ |
| 15 | 設定 | `/consumer/settings` | 一般設定 | ✅ |
| 16 | セキュリティ設定 | `/consumer/settings/security` | 2FA、セッション管理 | ✅ |
| 17 | 鍵管理 | `/consumer/settings/keys` | Dilithium鍵管理 | ✅ |
| 18 | ヘルプ | `/consumer/help` | FAQ、サポート | ✅ |
| 19 | オンボーディング | `/consumer/onboarding` | 初回利用ガイド | ✅ |

### 3.2 備考

- 企業版SaaSでは運営企業がブランディング変更可能
- 技術譲渡版では運営企業が自由にカスタマイズ

---

## 4. Token Hub

**対象者**: QSトークン保有者
**URL**: `/token-hub/*`
**状態**: ✅ 完了（16画面）
**対象版**: パブリック版のみ

### 4.1 機能一覧

| # | 画面 | パス | 機能 | 状態 |
|---|------|------|------|:----:|
| 1 | ランディング | `/token-hub/landing` | Token Hub紹介 | ✅ |
| 2 | ダッシュボード | `/token-hub/dashboard` | トークン残高、ステーク状況 | ✅ |
| 3 | ステーク | `/token-hub/stake` | トークンステーク | ✅ |
| 4 | ステーク確認 | `/token-hub/stake/confirm` | ステーク内容確認 | ✅ |
| 5 | アンステーク | `/token-hub/unstake` | ステーク解除 | ✅ |
| 6 | 報酬 | `/token-hub/rewards` | 報酬残高確認 | ✅ |
| 7 | 報酬請求 | `/token-hub/rewards/claim` | 報酬クレーム | ✅ |
| 8 | 委任 | `/token-hub/delegate` | 投票権委任 | ✅ |
| 9 | ガバナンスパワー | `/token-hub/governance-power` | 投票力確認 | ✅ |
| 10 | 履歴 | `/token-hub/history` | ステーク履歴 | ✅ |
| 11 | 分析 | `/token-hub/analytics` | トークン分析 | ✅ |
| 12 | 設定 | `/token-hub/settings` | Token Hub設定 | ✅ |
| 13 | ロックプレビュー | `/token-hub/lock-preview` | ロック条件プレビュー | ✅ |
| 14-16 | その他 | - | - | ✅ |

---

## 5. Governance

**対象者**: QSトークン保有者
**URL**: `/governance/*`
**状態**: ✅ 完了（6画面）
**対象版**: パブリック版のみ

### 5.1 機能一覧

| # | 画面 | パス | 機能 | 状態 |
|---|------|------|------|:----:|
| 1 | ランディング | `/governance/landing` | ガバナンス紹介 | ✅ |
| 2 | 提案一覧 | `/governance/proposals` | Proposal一覧 | ✅ |
| 3 | 提案詳細 | `/governance/proposals/[id]` | Proposal詳細・投票 | ✅ |
| 4 | 提案作成 | `/governance/proposals/create` | 新規Proposal作成 | ✅ |
| 5 | デリゲート一覧 | `/governance/delegates` | 委任先一覧 | ✅ |
| 6 | 自分の投票 | `/governance/my-votes` | 投票履歴 | ✅ |

---

## 6. Prover Portal

**対象者**: Prover運営者
**URL**: `/prover/*`
**状態**: 🔄 改修必要（9画面中5画面）
**対象版**: 全版

### 6.1 機能一覧

| # | 画面 | パス | 機能 | 状態 | 備考 |
|---|------|------|------|:----:|------|
| 1 | ランディング | `/prover/landing` | Prover Portal紹介 | 🔄 | パブリック/企業版分岐 |
| 2 | ダッシュボード | `/prover/dashboard` | ノード状況、署名統計 | 🔄 | 企業版: 契約情報表示 |
| 3 | 登録 | `/prover/register` | Prover登録 | 🔄 | 企業版: 招待フロー |
| 4 | ノード設定 | `/prover/node-setup` | ノードセットアップ | ✅ | |
| 5 | 署名履歴 | `/prover/signatures` | 署名履歴一覧 | ✅ | |
| 6 | 報酬 | `/prover/earnings` | 報酬管理 | 🔄 | 企業版: 報酬体系が異なる |
| 7 | ステーク | `/prover/stake` | ステーク管理 | 🔄 | 企業版: 要件が異なる |
| 8 | 設定 | `/prover/settings` | Prover設定 | ✅ | |
| 9 | アラート | `/prover/alerts` | アラート通知 | ✅ | |

### 6.2 改修内容

- [ ] ランディング: パブリック版/企業版の分岐UI
- [ ] ダッシュボード: 運営企業との契約情報表示（企業版）
- [ ] 登録: 運営企業からの招待フロー追加（企業版）
- [ ] 報酬: 企業版の報酬体系対応
- [ ] ステーク: 企業版のステーク要件対応

---

## 7. Observer

**対象者**: 監視者・チャレンジャー
**URL**: `/observer/*`
**状態**: ✅ 完了（7画面）
**対象版**: パブリック版（主）

### 7.1 機能一覧

| # | 画面 | パス | 機能 | 状態 |
|---|------|------|------|:----:|
| 1 | ランディング | `/observer/landing` | Observer紹介 | ✅ |
| 2 | ダッシュボード | `/observer/dashboard` | 監視状況一覧 | ✅ |
| 3 | 保留中 | `/observer/pending` | 保留中アンロック | ✅ |
| 4 | 疑わしい取引 | `/observer/suspicious` | 疑わしい取引一覧 | ✅ |
| 5 | 履歴 | `/observer/history` | チャレンジ履歴 | ✅ |
| 6 | 報酬 | `/observer/earnings` | 報酬管理 | ✅ |
| 7 | 設定 | `/observer/settings` | Observer設定 | ✅ |

### 7.2 備考

- 企業版SaaSではQS財団または運営企業が監視を担当
- 技術譲渡版では運営企業が自社で監視

---

## 8. Explorer

**対象者**: 全ユーザー（閲覧者）
**URL**: `/explorer/*`
**状態**: ✅ 完了（9画面）
**対象版**: 全版

### 8.1 機能一覧

| # | 画面 | パス | 機能 | 状態 |
|---|------|------|------|:----:|
| 1 | ランディング | `/explorer/landing` | Explorer紹介 | ✅ |
| 2 | 概要 | `/explorer/overview` | プロトコル統計 | ✅ |
| 3 | ロック一覧 | `/explorer/locks` | 全ロック一覧 | ✅ |
| 4 | ロック詳細 | `/explorer/locks/[id]` | ロック詳細 | ✅ |
| 5 | アンロック一覧 | `/explorer/unlocks` | 全アンロック一覧 | ✅ |
| 6 | アンロック詳細 | `/explorer/unlocks/[id]` | アンロック詳細 | ✅ |
| 7 | チャレンジ一覧 | `/explorer/challenges` | 全チャレンジ一覧 | ✅ |
| 8 | Prover一覧 | `/explorer/provers` | 全Prover一覧 | ✅ |
| 9 | 分析 | `/explorer/analytics` | プロトコル分析 | ✅ |

---

## 9. Enterprise Admin

**対象者**: 運営企業の管理者（企業版SaaS）
**URL**: `/enterprise/*`
**状態**: 🔄 改修 + 🆕 新規作成（25画面 → 33画面）

### 9.1 既存画面（改修）

| # | 画面 | パス | 機能 | 状態 | 備考 |
|---|------|------|------|:----:|------|
| 1 | ランディング | `/enterprise/landing` | 4BFT紹介LP | 🔄 | LP強化必要 |
| 2 | ダッシュボード | `/enterprise/dashboard` | KPI、要対応タスク | 🔄 | アクション導線追加 |
| 3 | ユーザー一覧 | `/enterprise/users` | エンドユーザー管理 | 🔄 | KYC/AML追加 |
| 4 | ユーザー詳細 | `/enterprise/users/[id]` | ユーザー詳細 | 🔄 | リスクスコア追加 |

### 9.2 既存画面（そのまま使用）

| # | 画面 | パス | 機能 | 状態 |
|---|------|------|------|:----:|
| 5 | トランザクション | `/enterprise/transactions` | 取引一覧 | ✅ |
| 6 | トランザクション詳細 | `/enterprise/transactions/[id]` | 取引詳細 | ✅ |
| 7 | チーム | `/enterprise/team` | チームメンバー | ✅ |
| 8 | チーム招待 | `/enterprise/team/invite` | メンバー招待 | ✅ |
| 9 | APIキー | `/enterprise/api-keys` | APIキー管理 | ✅ |
| 10 | APIキー作成 | `/enterprise/api-keys/create` | APIキー発行 | ✅ |
| 11 | Webhook | `/enterprise/webhooks` | Webhook管理 | ✅ |
| 12 | Webhook作成 | `/enterprise/webhooks/create` | Webhook設定 | ✅ |
| 13 | 請求 | `/enterprise/billing` | 請求情報 | ✅ |
| 14 | 請求書 | `/enterprise/invoices` | 請求書一覧 | ✅ |
| 15 | レポート | `/enterprise/reports` | レポート一覧 | ✅ |
| 16 | コンプライアンスレポート | `/enterprise/reports/compliance` | コンプライアンス | ✅ |
| 17 | 監査ログ | `/enterprise/audit-log` | 操作履歴 | ✅ |
| 18 | 設定 | `/enterprise/settings` | 一般設定 | ✅ |
| 19 | ステータス | `/enterprise/status` | システム状態 | ✅ |
| 20 | SLA | `/enterprise/sla` | SLA情報 | ✅ |
| 21 | サポート | `/enterprise/support` | サポート連絡 | ✅ |
| 22 | ヘルプ | `/enterprise/help` | ヘルプ | ✅ |
| 23 | 利用規約 | `/enterprise/terms` | 利用規約 | ✅ |
| 24 | プライバシー | `/enterprise/privacy` | プライバシーポリシー | ✅ |
| 25 | TVL | `/enterprise/tvl` | TVL分析 | ✅ |

### 9.3 新規作成画面

| # | 画面 | パス | 機能 | 状態 | 優先度 |
|---|------|------|------|:----:|:------:|
| 26 | 4BFT LP | `/enterprise/4bft` | SaaS vs 技術譲渡比較 | 🆕 | 高 |
| 27 | 申し込み | `/enterprise/apply` | 会社情報入力 | 🆕 | 高 |
| 28 | プラン選択 | `/enterprise/apply/plan` | プラン選択 | 🆕 | 高 |
| 29 | KYB | `/enterprise/apply/kyb` | 法人確認 | 🆕 | 高 |
| 30 | 契約 | `/enterprise/contract` | 電子署名・支払い | 🆕 | 高 |
| 31 | オンボーディング | `/enterprise/onboarding` | 初期設定ウィザード | 🆕 | 中 |
| 32 | 承認センター | `/enterprise/approvals` | マルチシグ承認 | 🆕 | 中 |
| 33 | Prover管理 | `/enterprise/provers` | Prover選定・監視 | 🆕 | 中 |

---

## 10. QS Admin

**対象者**: QS財団の管理者
**URL**: `/admin/*`
**状態**: 🔄 改修 + 🆕 大幅新規作成（12画面 → 61画面）

### 10.0 統合ダッシュボード

| # | 画面 | パス | 機能 | 状態 | 優先度 |
|---|------|------|------|:----:|:------:|
| 1 | 統合ダッシュボード | `/admin/dashboard` | 3領域のKPI一覧 | 🔄 | 高 |

### 10.1 パブリック版管理（25画面）

#### ユーザー管理

| # | 画面 | パス | 機能 | 状態 | 優先度 |
|---|------|------|------|:----:|:------:|
| 2 | ユーザー一覧 | `/admin/public/users` | 全ユーザー一覧 | 🆕 | 中 |
| 3 | ユーザー詳細 | `/admin/public/users/[id]` | ユーザー詳細 | 🆕 | 中 |
| 4 | ユーザー統計 | `/admin/public/users/stats` | アクティブユーザー推移 | 🆕 | 低 |

#### Prover管理

| # | 画面 | パス | 機能 | 状態 | 優先度 |
|---|------|------|------|:----:|:------:|
| 5 | Prover一覧 | `/admin/public/provers` | 全Prover一覧 | 🆕 | 高 |
| 6 | Prover詳細 | `/admin/public/provers/[id]` | Prover詳細 | 🆕 | 高 |
| 7 | 登録申請 | `/admin/public/provers/applications` | 登録申請審査 | 🆕 | 高 |
| 8 | スラッシング | `/admin/public/provers/slashing` | スラッシング履歴 | 🆕 | 中 |
| 9 | パフォーマンス | `/admin/public/provers/performance` | パフォーマンス監視 | 🆕 | 中 |

#### Observer管理

| # | 画面 | パス | 機能 | 状態 | 優先度 |
|---|------|------|------|:----:|:------:|
| 10 | Observer一覧 | `/admin/public/observers` | 全Observer一覧 | 🆕 | 中 |
| 11 | チャレンジ履歴 | `/admin/public/observers/challenges` | チャレンジ履歴 | 🆕 | 中 |
| 12 | 報酬分配 | `/admin/public/observers/rewards` | 報酬分配状況 | 🆕 | 低 |

#### トークン保有者/デリゲート管理

| # | 画面 | パス | 機能 | 状態 | 優先度 |
|---|------|------|------|:----:|:------:|
| 13 | 保有者分布 | `/admin/public/holders` | トークン保有者分布 | 🆕 | 低 |
| 14 | デリゲート一覧 | `/admin/public/delegates` | デリゲート一覧 | 🆕 | 低 |
| 15 | 投票権分析 | `/admin/public/voting-power` | 投票権分析 | 🆕 | 低 |

#### ガバナンス管理

| # | 画面 | パス | 機能 | 状態 | 優先度 |
|---|------|------|------|:----:|:------:|
| 16 | Proposal一覧 | `/admin/public/governance/proposals` | 全Proposal一覧 | 🆕 | 中 |
| 17 | Proposal実行 | `/admin/public/governance/execute` | 可決Proposal実行 | 🆕 | 中 |
| 18 | パラメータ履歴 | `/admin/public/governance/parameters` | パラメータ変更履歴 | 🆕 | 低 |
| 19 | 緊急対応 | `/admin/public/governance/emergency` | 緊急対応（マルチシグ） | 🆕 | 中 |

#### トレジャリー管理

| # | 画面 | パス | 機能 | 状態 | 優先度 |
|---|------|------|------|:----:|:------:|
| 20 | 残高一覧 | `/admin/public/treasury` | 財団資金残高 | 🆕 | 中 |
| 21 | 支出管理 | `/admin/public/treasury/expenses` | 支出管理 | 🆕 | 中 |
| 22 | 報酬分配 | `/admin/public/treasury/distribution` | 報酬分配 | 🆕 | 低 |
| 23 | 監査レポート | `/admin/public/treasury/audit` | 監査レポート | 🆕 | 低 |

#### プロトコル監視

| # | 画面 | パス | 機能 | 状態 | 優先度 |
|---|------|------|------|:----:|:------:|
| 24 | モニタリング | `/admin/public/protocol` | TVL/取引量監視 | 🆕 | 高 |
| 25 | コントラクト | `/admin/public/protocol/contracts` | コントラクト状態 | 🆕 | 中 |
| 26 | アラート | `/admin/public/protocol/alerts` | 異常検知アラート | 🆕 | 高 |

### 10.2 企業版SaaS管理（23画面）

#### 運営企業管理

| # | 画面 | パス | 機能 | 状態 | 優先度 |
|---|------|------|------|:----:|:------:|
| 27 | 運営企業一覧 | `/admin/saas/operators` | 全運営企業一覧 | 🆕 | 高 |
| 28 | 運営企業詳細 | `/admin/saas/operators/[id]` | 企業詳細 | 🆕 | 高 |
| 29 | 申し込み審査 | `/admin/saas/operators/applications` | 申し込み審査 | 🆕 | 高 |
| 30 | 契約管理 | `/admin/saas/operators/contracts` | 契約管理 | 🆕 | 高 |
| 31 | プラン変更 | `/admin/saas/operators/plans` | プラン変更管理 | 🆕 | 中 |

#### エンドユーザー管理（企業横断）

| # | 画面 | パス | 機能 | 状態 | 優先度 |
|---|------|------|------|:----:|:------:|
| 32 | ユーザー一覧 | `/admin/saas/users` | 全ユーザー一覧（企業別） | 🆕 | 中 |
| 33 | ユーザー統計 | `/admin/saas/users/stats` | ユーザー統計 | 🆕 | 低 |
| 34 | リスク検知 | `/admin/saas/users/risks` | リスク検知 | 🆕 | 中 |

#### Prover管理（SaaS）

| # | 画面 | パス | 機能 | 状態 | 優先度 |
|---|------|------|------|:----:|:------:|
| 35 | QS提供Prover | `/admin/saas/provers/qs` | QS提供Prover一覧 | 🆕 | 中 |
| 36 | 企業選定Prover | `/admin/saas/provers/operator` | 企業選定Prover一覧 | 🆕 | 中 |
| 37 | パフォーマンス | `/admin/saas/provers/performance` | パフォーマンス監視 | 🆕 | 中 |
| 38 | SLA状況 | `/admin/saas/provers/sla` | SLA遵守状況 | 🆕 | 中 |

#### Observer管理（SaaS）

| # | 画面 | パス | 機能 | 状態 | 優先度 |
|---|------|------|------|:----:|:------:|
| 39 | Observer一覧 | `/admin/saas/observers` | QS提供Observer | 🆕 | 低 |
| 40 | 監視状況 | `/admin/saas/observers/status` | 監視状況 | 🆕 | 低 |

#### 課金管理

| # | 画面 | パス | 機能 | 状態 | 優先度 |
|---|------|------|------|:----:|:------:|
| 41 | 請求一覧 | `/admin/saas/billing` | 請求一覧 | 🆕 | 高 |
| 42 | 支払い状況 | `/admin/saas/billing/payments` | 支払い状況 | 🆕 | 高 |
| 43 | 利用量レポート | `/admin/saas/billing/usage` | 利用量レポート | 🆕 | 中 |
| 44 | 収益分析 | `/admin/saas/billing/revenue` | 収益分析 | 🆕 | 中 |

#### インフラ管理

| # | 画面 | パス | 機能 | 状態 | 優先度 |
|---|------|------|------|:----:|:------:|
| 45 | テナント状況 | `/admin/saas/infrastructure` | テナント別リソース | 🆕 | 中 |
| 46 | キャパシティ | `/admin/saas/infrastructure/capacity` | キャパシティ管理 | 🆕 | 低 |
| 47 | SLA監視 | `/admin/saas/infrastructure/sla` | SLA監視 | 🆕 | 中 |

#### サポート管理

| # | 画面 | パス | 機能 | 状態 | 優先度 |
|---|------|------|------|:----:|:------:|
| 48 | チケット一覧 | `/admin/saas/support` | チケット一覧 | 🆕 | 中 |
| 49 | 対応履歴 | `/admin/saas/support/history` | 対応履歴 | 🆕 | 低 |

### 10.3 技術譲渡管理（7画面）

#### ライセンス企業管理

| # | 画面 | パス | 機能 | 状態 | 優先度 |
|---|------|------|------|:----:|:------:|
| 50 | 企業一覧 | `/admin/license/companies` | ライセンス企業一覧 | 🆕 | 高 |
| 51 | 企業詳細 | `/admin/license/companies/[id]` | 契約詳細 | 🆕 | 高 |
| 52 | ライセンス更新 | `/admin/license/renewals` | ライセンス更新管理 | 🆕 | 中 |

#### 導入プロジェクト管理

| # | 画面 | パス | 機能 | 状態 | 優先度 |
|---|------|------|------|:----:|:------:|
| 53 | プロジェクト一覧 | `/admin/license/projects` | プロジェクト一覧 | 🆕 | 中 |
| 54 | プロジェクト詳細 | `/admin/license/projects/[id]` | マイルストーン進捗 | 🆕 | 中 |
| 55 | ドキュメント | `/admin/license/documents` | ドキュメント提供状況 | 🆕 | 低 |
| 56 | トレーニング | `/admin/license/training` | トレーニング履歴 | 🆕 | 低 |

### 10.4 財団共通（5画面）

| # | 画面 | パス | 機能 | 状態 | 優先度 |
|---|------|------|------|:----:|:------:|
| 57 | メンバー管理 | `/admin/settings/members` | 財団メンバー管理 | 🆕 | 中 |
| 58 | 権限管理 | `/admin/settings/roles` | ロール/権限管理 | 🆕 | 中 |
| 59 | 監査ログ | `/admin/settings/audit-log` | 操作履歴 | 🆕 | 中 |
| 60 | セキュリティ | `/admin/settings/security` | セキュリティ設定 | 🆕 | 高 |
| 61 | システム設定 | `/admin/settings/system` | システム設定 | 🆕 | 低 |

---

## 11. 進捗サマリー

### 11.1 全体進捗

| システム | 完了 | 改修中 | 新規 | 合計 | 進捗率 |
|----------|:----:|:------:|:----:|:----:|:------:|
| Consumer App | 19 | 0 | 0 | 19 | 100% |
| Token Hub | 16 | 0 | 0 | 16 | 100% |
| Governance | 6 | 0 | 0 | 6 | 100% |
| Prover Portal | 4 | 5 | 0 | 9 | 44% |
| Observer | 7 | 0 | 0 | 7 | 100% |
| Explorer | 9 | 0 | 0 | 9 | 100% |
| Enterprise Admin | 21 | 4 | 8 | 33 | 64% |
| QS Admin | 0 | 1 | 60 | 61 | 0% |
| **合計** | **82** | **10** | **68** | **160** | **51%** |

### 11.2 優先度別 新規画面数

| 優先度 | Enterprise Admin | QS Admin | 合計 |
|:------:|:----------------:|:--------:|:----:|
| 高 | 5 | 18 | 23 |
| 中 | 3 | 26 | 29 |
| 低 | 0 | 16 | 16 |
| **合計** | **8** | **60** | **68** |

### 11.3 推奨開発順序

```
Phase 1: 基盤整備（高優先度）
├── QS Admin 統合ダッシュボード
├── QS Admin パブリック版 Prover管理（5画面）
├── QS Admin パブリック版 プロトコル監視（3画面）
├── QS Admin SaaS 運営企業管理（5画面）
├── QS Admin SaaS 課金管理（4画面）
└── Enterprise Admin LP・申し込み（5画面）

Phase 2: 運用機能（中優先度）
├── QS Admin パブリック版 ガバナンス管理
├── QS Admin パブリック版 トレジャリー管理
├── QS Admin SaaS インフラ管理
├── QS Admin 技術譲渡管理
├── Enterprise Admin 承認センター・Prover管理
└── Prover Portal 企業版対応

Phase 3: 拡張機能（低優先度）
├── QS Admin パブリック版 Observer管理
├── QS Admin パブリック版 トークン保有者管理
├── QS Admin SaaS サポート管理
└── その他統計・分析画面
```

---

## 更新履歴

| 日付 | バージョン | 内容 |
|------|-----------|------|
| 2026-01-18 | 1.0.0 | 初版作成 |
