# 📐 Phase 4 UI 統合計画
## 画面イメージ統合 × 既存コード × プレイヤー管理

> **Version**: 1.0  
> **Date**: 2026-01-05  
> **目的**: 既存仕様書・ジャーニー・コードを統合した実装計画

---

# Part 1: 全体アーキテクチャ

## 1.1 システム構成図

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           Quantum Shield Platform                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                        Edition Selector                                  │   │
│  │    ┌──────────────────┐           ┌──────────────────┐                  │   │
│  │    │   Decentralized  │ ◄───────► │    Enterprise    │                  │   │
│  │    │     Edition      │           │     Edition      │                  │   │
│  │    └────────┬─────────┘           └────────┬─────────┘                  │   │
│  └─────────────┼─────────────────────────────┼─────────────────────────────┘   │
│                │                             │                                   │
│  ┌─────────────┼─────────────────────────────┼─────────────────────────────┐   │
│  │             ▼                             ▼                              │   │
│  │  ┌──────────────────────────────────────────────────────────────────┐   │   │
│  │  │                     8 Application Systems                         │   │   │
│  │  ├──────────────────────────────────────────────────────────────────┤   │   │
│  │  │                                                                   │   │   │
│  │  │  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐           │   │   │
│  │  │  │ 1.Consumer App│ │ 2.Token Hub   │ │ 3.Governance  │           │   │   │
│  │  │  │   (End User)  │ │ (QS/veQS)     │ │   (Voting)    │           │   │   │
│  │  │  └───────────────┘ └───────────────┘ └───────────────┘           │   │   │
│  │  │                                                                   │   │   │
│  │  │  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐           │   │   │
│  │  │  │ 4.Prover      │ │ 5.Observer/   │ │ 6.Explorer    │           │   │   │
│  │  │  │   Portal      │ │   Challenger  │ │   (Public)    │           │   │   │
│  │  │  └───────────────┘ └───────────────┘ └───────────────┘           │   │   │
│  │  │                                                                   │   │   │
│  │  │  ┌───────────────┐ ┌───────────────┐                              │   │   │
│  │  │  │7.Enterprise   │ │8.QS Admin     │                              │   │   │
│  │  │  │  Admin Portal │ │ (Foundation)  │                              │   │   │
│  │  │  └───────────────┘ └───────────────┘                              │   │   │
│  │  │                                                                   │   │   │
│  │  └──────────────────────────────────────────────────────────────────┘   │   │
│  │                                                                          │   │
│  │  ┌──────────────────────────────────────────────────────────────────┐   │   │
│  │  │                     Shared Core Components                        │   │   │
│  │  │  L1 Vault │ L3 Aegis │ STARK Prover │ HSM │ Event Bridge         │   │   │
│  │  └──────────────────────────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 1.2 プレイヤー × システム マトリックス

| プレイヤー | Consumer | Token Hub | Governance | Prover | Observer | Explorer | Enterprise | QS Admin |
|-----------|:--------:|:---------:|:----------:|:------:|:--------:|:--------:|:----------:|:--------:|
| End User | ✅ | ✅ | ✅ (投票) | - | - | ✅ | - | - |
| Prover | - | ✅ | ✅ (投票) | ✅ | - | ✅ | - | - |
| Observer | - | ✅ | ✅ (投票) | - | ✅ | ✅ | - | - |
| Challenger | - | ✅ | ✅ (投票) | - | ✅ | ✅ | - | - |
| Delegate | - | ✅ | ✅ (委任受) | - | - | - | - | - |
| Proposer | - | ✅ | ✅ (提案) | - | - | - | - | - |
| Security Council | - | - | ✅ (特権) | - | - | - | - | ✅ |
| Purpose Committee | - | - | ✅ (理念) | - | - | - | - | ✅ |
| Service Provider | - | - | - | - | - | ✅ | ✅ | - |
| QS Foundation | - | - | ✅ | - | - | ✅ | - | ✅ |

---

# Part 2: システム別 画面定義

## 2.1 システム一覧 × Edition 対応

| # | システム | Decentralized | Enterprise | 優先度 |
|---|---------|:-------------:|:----------:|:------:|
| 1 | Consumer App | ✅ | ✅ | P0 |
| 2 | Token Hub | ✅ | ❌ | P0 |
| 3 | Governance | ✅ | オプション | P1 |
| 4 | Prover Portal | ✅ | ✅ | P0 |
| 5 | Observer/Challenger | ✅ | オプション | P2 |
| 6 | Explorer | ✅ | ✅ | P1 |
| 7 | Enterprise Admin | ❌ | ✅ | P1 |
| 8 | QS Admin | ✅ (縮小) | ✅ | P0 |

---

## 2.2 各システムの画面一覧

### 【1】Consumer App（End User向け）

**対象ジャーニー**: End User Journey（Part 2 STEP_D_USER_JOURNEYS.md）

```
Consumer App
├── 1. Public Pages（未接続）
│   ├── Landing Page (LP)                 # 認知フェーズ
│   ├── How It Works                      # 理解フェーズ  
│   ├── Security Explainer                # 理解フェーズ
│   └── FAQ                               # 理解フェーズ
│
├── 2. Onboarding（登録フェーズ）
│   ├── Wallet Connect                    # ウォレット接続
│   ├── Key Generation                    # Dilithium鍵生成
│   ├── Backup Instructions               # 鍵バックアップ
│   └── Ready                             # 登録完了
│
├── 3. Main App
│   ├── Dashboard                         # 総資産、Lock中、進行中Unlock
│   │
│   ├── Lock Flow
│   │   ├── Lock Input                    # 金額・資産入力
│   │   ├── Lock Confirmation             # 確認画面
│   │   ├── Lock Processing               # 署名・送信中
│   │   └── Lock Success                  # 完了
│   │
│   ├── Unlock Flow（Normal）
│   │   ├── Unlock Select                 # 対象Lock選択
│   │   ├── Unlock Method                 # 通常/緊急選択
│   │   ├── Dilithium Sign                # Dilithium署名
│   │   ├── Prover Waiting                # Prover署名待ち
│   │   ├── Time Lock Countdown           # 24h待機
│   │   ├── Unlock Ready                  # 実行可能
│   │   └── Unlock Complete               # 完了
│   │
│   ├── Unlock Flow（Emergency）
│   │   ├── Emergency Bond                # Bond計算・支払い
│   │   ├── Emergency Time Lock           # 7日待機
│   │   └── Emergency Complete            # Bond返還・完了
│   │
│   ├── History                           # 履歴一覧
│   ├── Settings                          # 設定
│   └── Key Management                    # 鍵管理
│
└── 4. Exit
    ├── Pre-Disconnect Checklist          # 退会確認
    ├── Final Unlock                      # 最終Unlock
    └── Account Disconnect                # 切断・さよなら
```

**画面数**: 約25画面

---

### 【2】Token Hub（QS/veQSホルダー向け）

**対象**: Decentralized Edition のみ

```
Token Hub
├── 1. Dashboard
│   ├── Token Balance                     # QS残高
│   ├── veQS Balance                      # veQS残高
│   ├── Voting Power                      # 投票力（減衰曲線付き）
│   └── Rewards Summary                   # 報酬サマリー
│
├── 2. veQS Lock
│   ├── Lock Form                         # ロック金額・期間入力
│   ├── Lock Preview                      # プレビュー（投票力計算）
│   ├── Lock Confirm                      # 確認・署名
│   └── Lock Success                      # 完了
│
├── 3. veQS Manage
│   ├── Extend Lock                       # ロック期間延長
│   ├── Early Unlock                      # 早期解除（ペナルティ計算）
│   ├── Normal Unlock                     # 満了時解除
│   └── Unlock Success                    # 完了
│
├── 4. Delegation
│   ├── Delegate List                     # Delegate一覧
│   ├── Delegate Detail                   # Delegate詳細
│   ├── Delegate Form                     # 委任実行
│   ├── My Delegations                    # 委任中一覧
│   └── Undelegate                        # 委任解除
│
├── 5. Become Delegate（任意）
│   ├── Register Form                     # Delegate登録
│   ├── Profile Edit                      # プロフィール編集
│   └── Delegators List                   # 委任者一覧
│
└── 6. Rewards
    ├── Rewards Dashboard                 # 報酬ダッシュボード
    ├── Claim Rewards                     # 報酬請求
    └── Rewards History                   # 報酬履歴
```

**画面数**: 約18画面

---

### 【3】Governance（投票・提案）

**対象**: Decentralized Edition（Enterprise はオプション）

```
Governance
├── 1. Overview
│   ├── Governance Dashboard              # 概要、アクティブ提案
│   └── My Voting Power                   # 自分の投票力
│
├── 2. Proposals
│   ├── Proposal List                     # 提案一覧（フィルタ付き）
│   ├── Proposal Detail                   # 提案詳細
│   │   ├── Description                   # 内容説明
│   │   ├── Timeline                      # タイムライン
│   │   ├── Vote Status                   # 投票状況
│   │   └── Discussion                    # Forum連携
│   ├── Vote Form                         # 投票（For/Against/Abstain）
│   └── Vote Success                      # 投票完了
│
├── 3. Proposal Create（Proposer用）
│   ├── Create Step 1                     # 基本情報
│   ├── Create Step 2                     # アクション定義
│   ├── Create Step 3                     # プレビュー
│   └── Submit Proposal                   # 提出
│
├── 4. My Activity
│   ├── My Votes                          # 投票履歴
│   ├── My Proposals                      # 作成した提案
│   └── Delegation Received               # 委任受け履歴
│
└── 5. Council Pages（Security Council / Purpose Committee）
    ├── Council Dashboard                 # Council専用ダッシュボード
    ├── Emergency Actions                 # 緊急アクション
    ├── Veto Management                   # Veto管理
    └── Council Voting                    # Council内投票
```

**画面数**: 約16画面

---

### 【4】Prover Portal（Prover事業者向け）

**対象ジャーニー**: Prover Journey（Part 3 STEP_D_USER_JOURNEYS.md）

```
Prover Portal
├── 1. Public（未登録）
│   ├── Prover Program LP                 # プログラム説明
│   ├── Requirements                      # 要件一覧
│   ├── Economics                         # 経済モデル説明
│   ├── Risk Calculator                   # Slashingリスク計算
│   └── ROI Simulator                     # 収益シミュレーター
│
├── 2. Registration
│   ├── Application Step 1                # 企業情報
│   ├── Application Step 2                # 技術要件証明
│   ├── Application Step 3                # インフラ情報
│   ├── Application Step 4                # Stake準備確認
│   ├── Application Submitted             # 申請完了
│   ├── Application Status                # 審査状況
│   └── Additional Questions              # 追加質問対応
│
├── 3. Activation
│   ├── Approval Notification             # 承認通知
│   ├── Stake Deposit                     # Stake入金
│   ├── SPHINCS+ Key Setup                # 鍵設定
│   └── Activation Complete               # 稼働開始
│
├── 4. Operations（日常運用）
│   ├── Prover Dashboard                  # メインダッシュボード
│   ├── Signature Queue                   # 署名キュー
│   ├── Signature Detail                  # 署名要求詳細
│   ├── Performance Metrics               # パフォーマンス指標
│   ├── Rewards Dashboard                 # 報酬管理
│   ├── Rewards Claim                     # 報酬請求
│   ├── Stake Management                  # Stake管理
│   ├── Stake Add                         # Stake追加
│   ├── Stake Withdraw                    # Stake引出し
│   └── Alerts                            # アラート一覧
│
├── 5. Challenge Response
│   ├── Challenge Notification            # Challenge通知
│   ├── Defense Submission                # Defense提出
│   └── Challenge Result                  # 結果確認
│
└── 6. Exit
    ├── Exit Request                      # 退出申請
    ├── Pending Tasks                     # 保留タスク完了
    ├── Unbonding Progress                # Unbonding進捗
    └── Stake Returned                    # Stake返還完了
```

**画面数**: 約28画面

---

### 【5】Observer/Challenger Portal

**対象**: Decentralized Edition

```
Observer/Challenger Portal
├── 1. Monitor Dashboard
│   ├── Overview                          # 監視概要
│   ├── Pending Unlocks                   # 進行中Unlock一覧
│   ├── Suspicious Activity               # 疑わしいアクティビティ
│   └── Alert History                     # アラート履歴
│
├── 2. Challenge
│   ├── Challenge Form                    # Challenge提起
│   ├── Challenge Confirmation            # 確認
│   ├── Challenge Submitted               # 提出完了
│   ├── Challenge Progress                # 進捗追跡
│   └── Challenge Result                  # 結果（Reward/Fail）
│
└── 3. Earnings
    ├── Challenge Rewards                 # Challenge報酬
    └── Claim Rewards                     # 報酬請求
```

**画面数**: 約10画面

---

### 【6】Explorer（公開閲覧）

```
Explorer
├── 1. Home
│   ├── Overview                          # 全体統計
│   ├── Recent Locks                      # 最近のLock
│   └── Recent Unlocks                    # 最近のUnlock
│
├── 2. Search & List
│   ├── Search                            # 検索
│   ├── Lock List                         # Lock一覧
│   ├── Unlock List                       # Unlock一覧
│   └── Challenge List                    # Challenge一覧
│
├── 3. Detail Pages
│   ├── Lock Detail                       # Lock詳細
│   ├── Unlock Detail                     # Unlock詳細
│   ├── Challenge Detail                  # Challenge詳細
│   └── Address Detail                    # アドレス詳細
│
├── 4. Prover Stats
│   ├── Prover List                       # Prover一覧
│   └── Prover Detail                     # Prover詳細（パフォーマンス）
│
└── 5. Analytics
    ├── TVL Chart                         # TVL推移
    ├── Volume Chart                      # 取引量推移
    └── Prover Performance                # Proverランキング
```

**画面数**: 約14画面

---

### 【7】Enterprise Admin Portal（Service Provider向け）

**対象**: Enterprise Edition のみ

```
Enterprise Admin Portal
├── 1. Dashboard
│   ├── Overview                          # 契約概要
│   ├── TVL Summary                       # 自社TVL
│   ├── Monthly Volume                    # 月間取引量
│   └── Service Status                    # サービス稼働状況
│
├── 2. Transactions
│   ├── Transaction List                  # TX一覧
│   ├── Transaction Detail                # TX詳細
│   ├── Transaction Export                # エクスポート
│   └── Transaction Analytics             # 分析
│
├── 3. User Management
│   ├── User List                         # ユーザー一覧
│   ├── User Detail                       # ユーザー詳細
│   ├── User Create                       # ユーザー追加
│   ├── Role Management                   # 権限管理
│   └── Invite User                       # 招待
│
├── 4. API Management
│   ├── API Keys                          # APIキー一覧
│   ├── API Key Create                    # キー発行
│   ├── API Usage                         # 使用量
│   └── Webhook Settings                  # Webhook設定
│
├── 5. Settings
│   ├── Organization Settings             # 組織設定
│   ├── Security Settings                 # セキュリティ
│   ├── Notification Settings             # 通知設定
│   └── Limit Settings                    # 上限設定
│
├── 6. Reports
│   ├── Monthly Report                    # 月次レポート
│   ├── Compliance Report                 # コンプライアンス
│   └── Audit Trail                       # 監査ログ
│
├── 7. Contract & Billing
│   ├── Contract Detail                   # 契約詳細
│   ├── Billing History                   # 請求履歴
│   └── Payment Methods                   # 支払い方法
│
└── 8. Support
    ├── Support Tickets                   # チケット一覧
    ├── Create Ticket                     # チケット作成
    └── Documentation                     # ドキュメント
```

**画面数**: 約25画面

⚠️ **注意**: 経済条件（価格）、サポート体制が未定義のため、Contract & Billing セクションは後日詳細化

---

### 【8】QS Admin（QS財団向け）

```
QS Admin
├── 1. Dashboard
│   ├── System Overview                   # システム全体状況
│   ├── TVL Summary                       # 全TVL
│   ├── Active Locks/Unlocks              # アクティブ数
│   ├── L3 Node Status                    # ノード状態
│   └── Alert Summary                     # アラートサマリー
│
├── 2. Edition Management
│   ├── Current Mode                      # 現在のエディション
│   ├── Mode Switch                       # モード切替（Enterprise ⇔ Decen）
│   ├── Edition Settings                  # エディション別設定
│   └── Switch History                    # 切替履歴
│
├── 3. L3 Node Management
│   ├── Node List                         # ノード一覧
│   ├── Node Detail                       # ノード詳細
│   ├── Node Add/Remove                   # ノード追加・削除（Decen Phase 4+）
│   └── Node Config                       # ノード設定
│
├── 4. Prover Management
│   ├── Prover List                       # Prover一覧
│   ├── Prover Detail                     # Prover詳細
│   ├── Application Queue                 # 申請キュー
│   ├── Application Review                # 申請審査
│   ├── Prover Suspend                    # Prover停止
│   └── Prover Performance                # パフォーマンス
│
├── 5. Transaction Monitor
│   ├── Lock Monitor                      # Lock監視
│   ├── Unlock Monitor                    # Unlock監視
│   ├── Challenge Monitor                 # Challenge監視
│   ├── Slashing Events                   # Slashingイベント
│   └── Anomaly Detection                 # 異常検知
│
├── 6. Emergency
│   ├── Emergency Dashboard               # 緊急対応ダッシュボード
│   ├── Pause Control                     # Pause実行
│   ├── Pause History                     # Pause履歴
│   └── Recovery Procedures               # 復旧手順
│
├── 7. Parameters（Decentralized: Governance経由）
│   ├── Time Lock Config                  # Time Lock設定
│   ├── Emergency Bond Config             # Bond設定
│   ├── Slashing Config                   # Slashing設定
│   └── Fee Config                        # 手数料設定
│
├── 8. Enterprise Customers（Enterprise Edition）
│   ├── Customer List                     # 顧客一覧
│   ├── Customer Detail                   # 顧客詳細
│   ├── Contract Management               # 契約管理
│   ├── Billing Management                # 請求管理
│   └── Service Control                   # サービス制御
│
├── 9. Community（Decentralized Edition）
│   ├── Delegate List                     # Delegate一覧
│   ├── Proposal Overview                 # 提案概要
│   ├── Council Members                   # Council一覧
│   └── Treasury Status                   # Treasury状況
│
├── 10. Reports
│   ├── Daily Report                      # 日次レポート
│   ├── Weekly Report                     # 週次レポート
│   ├── Monthly Report                    # 月次レポート
│   ├── Revenue Analytics                 # 収益分析
│   └── Export                            # エクスポート
│
└── 11. Audit Log
    ├── All Operations                    # 全操作ログ
    ├── User Operations                   # ユーザー別
    └── Security Events                   # セキュリティイベント
```

**画面数**: 約40画面

---

## 2.3 画面数サマリー

| # | システム | 画面数 | 優先度 |
|---|---------|:------:|:------:|
| 1 | Consumer App | 25 | P0 |
| 2 | Token Hub | 18 | P0 |
| 3 | Governance | 16 | P1 |
| 4 | Prover Portal | 28 | P0 |
| 5 | Observer/Challenger | 10 | P2 |
| 6 | Explorer | 14 | P1 |
| 7 | Enterprise Admin | 25 | P1 |
| 8 | QS Admin | 40 | P0 |
| | **合計** | **176** | |

---

# Part 3: 既存コード分析

## 3.1 現在のリポジトリ構造

```
quantum-shield/
├── apps/
│   └── admin-dashboard/                  # ✅ 既存: Admin Dashboard
│       └── src/
│           ├── pages/
│           │   ├── Dashboard.tsx
│           │   ├── analytics/
│           │   ├── edition/             # ✅ Edition切替あり
│           │   ├── emergency/           # ✅ Emergency対応あり
│           │   ├── provers/             # ✅ Prover管理あり
│           │   └── providers/           # ✅ Provider管理あり
│           ├── components/
│           └── lib/
├── web/
│   ├── index.html                        # ⚠️ 簡易LP（静的HTML）
│   └── dashboard.html                    # ⚠️ 簡易Dashboard（静的HTML）
├── client/                               # ❓ 未確認
├── api/                                  # ✅ API実装
├── contracts/                            # ✅ スマートコントラクト
├── l3-aegis/                             # ✅ L3ノード
├── stark-prover/                         # ✅ STARK Prover
└── services/                             # ✅ バックエンドサービス
```

## 3.2 既存 vs 必要 ギャップ分析

| システム | 既存コード | 必要な対応 |
|---------|-----------|-----------|
| **Consumer App** | web/（静的HTML） | ❌ ゼロから作成（Next.js） |
| **Token Hub** | なし | ❌ ゼロから作成 |
| **Governance** | なし | ❌ ゼロから作成 |
| **Prover Portal** | なし | ❌ ゼロから作成 |
| **Observer/Challenger** | なし | ❌ ゼロから作成 |
| **Explorer** | なし | ❌ ゼロから作成 |
| **Enterprise Admin** | なし | ❌ ゼロから作成 |
| **QS Admin** | apps/admin-dashboard/ | ✅ 拡張（60%程度） |

### 3.2.1 apps/admin-dashboard 既存機能

```
現在実装済み（推定）:
├── ✅ Edition管理（切替画面）
├── ✅ Prover管理（一覧、詳細）
├── ✅ Provider管理
├── ✅ Emergency対応
├── ✅ Analytics
└── ✅ Dashboard

追加が必要:
├── ❌ L3ノード管理詳細
├── ❌ Transaction Monitor詳細
├── ❌ Community管理（Decen用）
├── ❌ Customer管理（Enterprise用）
├── ❌ レポート生成
└── ❌ 監査ログ詳細
```

---

# Part 4: プレイヤー管理のセキュリティ考慮

## 4.1 プレイヤー登録・管理のデータフロー

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                     プレイヤー管理のデータフロー                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  【End User 登録】                                                               │
│  ┌────────────┐     ┌────────────┐     ┌────────────┐                          │
│  │ UI         │────►│ Backend    │────►│ L1 + L3    │                          │
│  │ Dilithium  │     │ 公開鍵     │     │ 公開鍵     │                          │
│  │ 鍵生成     │     │ 受信       │     │ 登録       │                          │
│  └────────────┘     └────────────┘     └────────────┘                          │
│                                                                                 │
│  ⚠️ セキュリティポイント:                                                        │
│  • 秘密鍵はブラウザ内のみ（サーバー送信禁止）                                    │
│  • 公開鍵はL1/L3に記録                                                          │
│  • バックアップは暗号化してローカル保存                                          │
│                                                                                 │
│  【Prover 登録】                                                                 │
│  ┌────────────┐     ┌────────────┐     ┌────────────┐     ┌────────────┐       │
│  │ UI         │────►│ Backend    │────►│ 審査       │────►│ L1         │       │
│  │ 申請       │     │ 申請受付   │     │ (Admin/    │     │ Stake      │       │
│  │ フォーム   │     │ + 検証     │     │  Council)  │     │ 登録       │       │
│  └────────────┘     └────────────┘     └────────────┘     └────────────┘       │
│                            │                                    │              │
│                            ▼                                    ▼              │
│                     ┌────────────┐                       ┌────────────┐       │
│                     │ Off-chain  │                       │ L3         │       │
│                     │ DB         │                       │ 署名者     │       │
│                     │ (企業情報) │                       │ 登録       │       │
│                     └────────────┘                       └────────────┘       │
│                                                                                 │
│  ⚠️ セキュリティポイント:                                                        │
│  • 企業情報はOff-chain DB（プライバシー保護）                                    │
│  • Stake金額・ステータスはL1に記録                                              │
│  • SPHINCS+公開鍵はL3に記録                                                     │
│  • HSM証明は審査時に検証                                                        │
│                                                                                 │
│  【Observer/Challenger 登録】                                                    │
│  ┌────────────┐     ┌────────────┐     ┌────────────┐                          │
│  │ UI         │────►│ Backend    │────►│ L1         │                          │
│  │ Stake      │     │ 検証       │     │ Stake      │                          │
│  │ 入金       │     │            │     │ 登録       │                          │
│  └────────────┘     └────────────┘     └────────────┘                          │
│                                                                                 │
│  ⚠️ セキュリティポイント:                                                        │
│  • Permissionless（Stake入金のみで参加可能）                                    │
│  • 最低Stake閾値はパラメータで設定                                              │
│                                                                                 │
│  【Delegate 登録】                                                               │
│  ┌────────────┐     ┌────────────┐     ┌────────────┐                          │
│  │ UI         │────►│ Backend    │────►│ L1         │                          │
│  │ プロフィール│     │ 保存       │     │ Delegate   │                          │
│  │ 入力       │     │            │     │ 登録       │                          │
│  └────────────┘     └────────────┘     └────────────┘                          │
│                            │                                                    │
│                            ▼                                                    │
│                     ┌────────────┐                                              │
│                     │ Off-chain  │                                              │
│                     │ DB         │                                              │
│                     │ (プロフ)   │                                              │
│                     └────────────┘                                              │
│                                                                                 │
│  ⚠️ セキュリティポイント:                                                        │
│  • Delegate登録自体はPermissionless                                             │
│  • プロフィールはOff-chain（IPFSも検討）                                        │
│  • 委任関係はL1に記録                                                           │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 4.2 L3に記録すべきデータ vs Off-chain

| データ | L3に記録 | Off-chain | 理由 |
|--------|:--------:|:---------:|------|
| End User Dilithium公開鍵 | ✅ | - | 署名検証に必須 |
| End User 秘密鍵 | ❌ | ❌ | ブラウザ内のみ |
| Prover SPHINCS+公開鍵 | ✅ | - | 署名検証に必須 |
| Prover Stake状態 | L1 | - | 経済的検証 |
| Prover 企業情報 | ❌ | ✅ | プライバシー |
| Observer/Challenger登録 | L1 | - | Stake検証 |
| Delegate登録 | L1 | ✅ (プロフ) | オンチェーン+メタデータ |
| 投票記録 | L1 | - | 透明性 |
| Council決定 | L1 | - | 透明性 |

## 4.3 プレイヤー管理API設計

```
【End User API】
POST   /api/v1/users/register           # 公開鍵登録
GET    /api/v1/users/:address           # ユーザー情報
DELETE /api/v1/users/:address           # 登録解除

【Prover API】
POST   /api/v1/provers/apply            # 申請
GET    /api/v1/provers/applications     # 申請一覧（Admin用）
PUT    /api/v1/provers/applications/:id # 承認/却下（Admin用）
GET    /api/v1/provers                  # Prover一覧
GET    /api/v1/provers/:address         # Prover詳細
POST   /api/v1/provers/:address/suspend # 停止（Admin用）
POST   /api/v1/provers/:address/exit    # 退出申請

【Observer/Challenger API】
POST   /api/v1/observers/register       # 登録（Stake入金後）
GET    /api/v1/observers                # 一覧
GET    /api/v1/challengers              # Challenger一覧
POST   /api/v1/challenges               # Challenge提起
GET    /api/v1/challenges/:id           # Challenge詳細

【Delegate API】
POST   /api/v1/delegates/register       # Delegate登録
GET    /api/v1/delegates                # Delegate一覧
GET    /api/v1/delegates/:address       # Delegate詳細
PUT    /api/v1/delegates/:address       # プロフィール更新
DELETE /api/v1/delegates/:address       # 登録解除

【Delegation API】
POST   /api/v1/delegations              # 委任実行
GET    /api/v1/delegations/my           # 自分の委任
DELETE /api/v1/delegations/:id          # 委任解除
```

---

# Part 5: 統合計画

## 5.1 Phase 4 実装順序

```
Week 1-2: 基盤構築
├── monorepo設定（Turborepo）
├── 共通コンポーネントライブラリ
├── デザインシステム
├── 認証基盤（SIWE）
└── wagmi/viem設定

Week 3-4: Consumer App MVP
├── Landing Page
├── Onboarding（Dilithium鍵生成）
├── Lock Flow
└── Dashboard

Week 5-6: Consumer App + QS Admin
├── Unlock Flow（Normal + Emergency）
├── QS Admin: Prover管理拡張
└── QS Admin: Transaction Monitor

Week 7-8: Prover Portal + Token Hub
├── Prover登録フロー
├── Prover Dashboard
├── Token Hub: veQS Lock/Unlock
└── Token Hub: Delegation

Week 9-10: Governance + Explorer
├── Governance: 投票フロー
├── Governance: 提案作成
├── Explorer: 基本機能
└── QS Admin: Community管理

Week 11-12: Enterprise + 仕上げ
├── Enterprise Admin: 基本機能
├── QS Admin: Customer管理
├── Observer/Challenger（基本）
└── 統合テスト
```

## 5.2 技術スタック確定

```
Frontend Monorepo:
quantum-shield-ui/
├── apps/
│   ├── consumer/           # Consumer App (Next.js 14)
│   ├── token-hub/          # Token Hub (Next.js 14)
│   ├── governance/         # Governance (Next.js 14)
│   ├── prover/             # Prover Portal (Next.js 14)
│   ├── observer/           # Observer/Challenger (Next.js 14)
│   ├── explorer/           # Explorer (Next.js 14)
│   ├── enterprise/         # Enterprise Admin (Next.js 14)
│   └── admin/              # QS Admin (既存を移行)
│
├── packages/
│   ├── ui/                 # 共通UIコンポーネント
│   ├── crypto/             # Dilithium WASM等
│   ├── web3/               # wagmi/viem wrapper
│   ├── api-client/         # API Client
│   └── config/             # 共通設定
│
└── tooling/
    ├── eslint-config/
    ├── typescript-config/
    └── tailwind-config/
```

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-05 | 初版作成 |

---

**END OF DOCUMENT**
