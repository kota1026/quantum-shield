# 04 全画面定義（253画面）

> **対応Agent**: 03_impl.md, 04_review.md

---

# Part 1: 画面数サマリー

| # | システム | 画面数 | 📱対応 | 優先度 |
|---|---------|:------:|:------:|:------:|
| 0 | サービス全体サイト | 15 | ✅ | P1 |
| 1 | Consumer App | 25 | ✅ | P0 |
| 2 | Token Hub | 22 | ✅ | P0 |
| 3 | Governance | 20 | △ | P1 |
| 4 | Prover Portal | 32 | △ | P0 |
| 5 | Observer/Challenger | 16 | ✅ | P1 |
| 6 | Explorer | 14 | ✅ | P1 |
| 7 | Enterprise Admin | 47 | △ | P1 |
| 8 | QS Admin | 62 | ❌ | P0 |
| | **合計** | **253** | | |

---

# Part 2: システム別画面定義

## 【0】サービス全体サイト（15画面）

```
quantum-shield.io/
├── 1. Public Pages
│   ├── Main Landing                      # ヒーロー、価値提案
│   ├── Problem Section                   # 量子脅威解説
│   ├── Solution Section                  # QSの解決策
│   ├── How It Works                      # 仕組み概要
│   ├── Features                          # 主要機能
│   ├── Technology                        # 技術概要
│   ├── Editions                          # Decentralized vs Enterprise
│   ├── Roadmap                           # ロードマップ
│   └── Team & Partners                   # チーム・パートナー
│
├── 2. Whitepaper
│   ├── Whitepaper Landing                # 概要・目次
│   ├── Whitepaper Viewer                 # オンライン閲覧
│   └── Whitepaper Download               # PDF DL
│
└── 3. Resources
    ├── Blog / News                       # ブログ一覧
    ├── Careers                           # 採用情報
    └── Contact                           # お問い合わせ
```

---

## 【1】Consumer App（25画面）

```
Consumer App
├── 1. Public Pages（未接続）
│   ├── Landing Page                      # 認知フェーズ
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
│   │   └── Emergency Bond                # Bond計算・支払い
│   │
│   ├── History                           # 履歴一覧
│   ├── Settings                          # 設定
│   └── Key Management                    # 鍵管理
│
└── 4. Exit
    └── Account Disconnect                # 退会確認・実行
```

---

## 【2】Token Hub（22画面）

```
Token Hub
├── 1. Public Pages
│   ├── Token Hub LP                      # veQSの価値説明
│   ├── veQS Explainer                    # veQS仕組み解説
│   ├── Voting Power Calculator           # 投票力計算ツール
│   ├── Rewards Explainer                 # 報酬仕組み解説
│   └── FAQ                               # よくある質問
│
├── 2. veQS Lock
│   ├── Lock Form                         # ロック金額・期間入力
│   ├── Lock Preview                      # プレビュー（投票力計算）
│   ├── Lock Confirm                      # 確認・署名
│   └── Lock Success                      # 完了
│
├── 3. veQS Dashboard
│   ├── Token Dashboard                   # veQS概要
│   ├── Voting Power Chart                # 投票力減衰グラフ
│   ├── Extend Lock                       # ロック期間延長
│   ├── Early Unlock                      # 早期解除（ペナルティ計算）
│   ├── Normal Unlock                     # 満了時解除
│   └── Unlock Success                    # 完了
│
├── 4. Delegation
│   ├── Delegate List                     # Delegate一覧
│   ├── Delegate Detail                   # Delegate詳細
│   ├── Delegate Form                     # 委任実行
│   └── My Delegations                    # 委任中一覧
│
├── 5. Become Delegate（任意）
│   └── Register Delegate                 # Delegate登録
│
└── 6. Rewards
    ├── Rewards Dashboard                 # 報酬ダッシュボード
    └── Claim Rewards                     # 報酬請求
```

---

## 【3】Governance（20画面）

```
Governance
├── 1. Public Pages
│   ├── Governance LP                     # ガバナンスの価値説明
│   ├── Governance Explainer              # 仕組み解説
│   ├── Proposal Types                    # 提案種類と閾値説明
│   ├── Council Explainer                 # Council役割説明
│   └── FAQ                               # よくある質問
│
├── 2. Overview
│   ├── Governance Dashboard              # 概要、アクティブ提案
│   └── My Voting Power                   # 自分の投票力
│
├── 3. Proposals
│   ├── Proposal List                     # 提案一覧（フィルタ付き）
│   ├── Proposal Detail                   # 提案詳細
│   ├── Vote Form                         # 投票（For/Against/Abstain）
│   └── Vote Success                      # 投票完了
│
├── 4. Proposal Create（Proposer用）
│   ├── Create Step 1                     # 基本情報
│   ├── Create Step 2                     # アクション定義
│   ├── Create Step 3                     # プレビュー
│   └── Submit Proposal                   # 提出
│
├── 5. My Activity
│   ├── My Votes                          # 投票履歴
│   └── My Proposals                      # 作成した提案
│
└── 6. Council Pages（PC only）
    ├── Council Dashboard                 # Council専用ダッシュボード
    └── Veto Management                   # Veto管理
```

---

## 【4】Prover Portal（32画面）

```
Prover Portal
├── 1. Public Pages（未登録）
│   ├── Prover Program LP                 # プログラム説明
│   ├── How Prover Works                  # Prover仕組み解説
│   ├── Economics Explainer               # 経済モデル説明
│   ├── Requirements Detail               # 要件一覧
│   ├── Risk Calculator                   # Slashingリスク計算
│   ├── ROI Simulator                     # 収益シミュレーター
│   └── FAQ                               # よくある質問
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
│   └── Alerts                            # アラート一覧
│
├── 5. Challenge Response
│   ├── Challenge Notification            # Challenge通知
│   ├── Defense Submission                # Defense提出
│   └── Challenge Result                  # 結果確認
│
└── 6. Exit
    ├── Exit Request                      # 退出申請
    └── Unbonding Progress                # Unbonding進捗
```

---

## 【5】Observer/Challenger Portal（16画面）

```
Observer/Challenger Portal
├── 1. Public Pages
│   ├── Observer Program LP               # プログラム説明
│   ├── How Observer Works                # 仕組み解説
│   ├── Challenge Explainer               # Challenge仕組み説明
│   ├── Reward Calculator                 # 報酬計算ツール
│   └── FAQ                               # よくある質問
│
├── 2. Registration
│   ├── Stake Deposit                     # Stake入金
│   └── Registration Complete             # 登録完了
│
├── 3. Monitor Dashboard
│   ├── Observer Dashboard                # 監視ダッシュボード
│   ├── Pending Unlocks                   # 進行中Unlock一覧
│   └── Suspicious Activity               # 疑わしいアクティビティ
│
├── 4. Challenge
│   ├── Challenge Form                    # Challenge提起
│   ├── Challenge Progress                # 進捗追跡
│   ├── Challenge Result                  # 結果（Reward/Fail）
│   └── My Challenges                     # Challenge履歴
│
└── 5. Rewards & Exit
    ├── Claim Rewards                     # 報酬請求
    └── Stake Withdraw                    # Stake引出し
```

---

## 【6】Explorer（14画面）

```
Explorer
├── 1. Home
│   └── Explorer Home                     # 全体統計・概要
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
    └── Volume Chart                      # 取引量推移
```

---

## 【7】Enterprise Admin Portal（47画面）

```
Enterprise Admin Portal
├── 1. Public Pages
│   ├── Enterprise LP                     # Enterpriseソリューション紹介
│   ├── Solution Overview                 # ソリューション概要
│   ├── Use Cases                         # ユースケース紹介
│   ├── Pricing                           # 価格説明 ⚠️
│   └── FAQ                               # よくある質問
│
├── 2. Contact
│   ├── Contact Form                      # 問い合わせフォーム
│   └── Contact Confirmation              # 送信完了
│
├── 3. Authentication（12画面）
│   ├── Login                             # ログイン
│   ├── 2FA Input                         # 2FA入力
│   ├── WebAuthn Prompt                   # 生体認証
│   ├── Forgot Password                   # パスワード忘れ
│   ├── Reset Password                    # パスワードリセット
│   ├── Email Verification                # メール確認
│   ├── New Device Alert                  # 新規デバイスアラート
│   ├── Session Management                # セッション管理
│   ├── Security Settings                 # セキュリティ設定
│   ├── 2FA Setup                         # 2FA設定
│   ├── WebAuthn Setup                    # WebAuthn設定
│   └── Logout                            # ログアウト
│
├── 4. Onboarding
│   ├── Welcome                           # ようこそ画面
│   ├── Getting Started                   # はじめ方ガイド
│   └── API Quick Start                   # API設定ガイド
│
├── 5. Dashboard
│   ├── Dashboard                         # メインダッシュボード
│   ├── Transaction List                  # TX一覧
│   ├── Transaction Detail                # TX詳細
│   ├── Transaction Export                # エクスポート
│   └── Analytics                         # 分析
│
├── 6. User Management
│   ├── User List                         # ユーザー一覧
│   ├── User Detail                       # ユーザー詳細
│   ├── User Invite                       # ユーザー招待
│   └── Role Management                   # 権限管理
│
├── 7. API Management
│   ├── API Keys                          # APIキー一覧
│   ├── API Key Create                    # キー発行
│   ├── API Usage                         # 使用量
│   └── Webhook Settings                  # Webhook設定
│
├── 8. Settings
│   ├── Organization Settings             # 組織設定
│   ├── Security Settings                 # セキュリティ設定
│   └── Notification Settings             # 通知設定
│
├── 9. Contract & Billing ⚠️
│   ├── Contract Detail                   # 契約詳細
│   ├── Billing History                   # 請求履歴
│   └── Payment Methods                   # 支払い方法
│
├── 10. Support
│   ├── Support Tickets                   # チケット一覧
│   ├── Create Ticket                     # チケット作成
│   └── Documentation                     # ドキュメント
│
└── 11. Exit
    └── Cancel Contract                   # 契約解除 ⚠️

⚠️ = 経済条件確定後に詳細化
```

---

## 【8】QS Admin（62画面）

```
QS Admin
├── 1. Authentication（12画面）
│   ├── Login                             # ログイン
│   ├── 2FA Input                         # 2FA入力
│   ├── WebAuthn Prompt                   # 生体認証
│   ├── Forgot Password                   # パスワード忘れ
│   ├── Reset Password                    # パスワードリセット
│   ├── Email Verification                # メール確認
│   ├── New Device Alert                  # 新規デバイスアラート
│   ├── Session Management                # セッション管理
│   ├── Security Settings                 # セキュリティ設定
│   ├── 2FA Setup                         # 2FA設定
│   ├── WebAuthn Setup                    # WebAuthn設定
│   └── Logout                            # ログアウト
│
├── 2. Onboarding（6画面）
│   ├── Welcome                           # ようこそ画面
│   ├── QS Overview                       # QS全体像説明
│   ├── Core Principles                   # 5原則解説
│   ├── System Architecture               # システム構成説明
│   ├── Your Role                         # 担当領域説明
│   └── Emergency Procedures              # 緊急対応手順
│
├── 3. Dashboard（5画面）
│   ├── System Overview                   # システム全体状況
│   ├── TVL Summary                       # 全TVL
│   ├── Active Locks/Unlocks              # アクティブ数
│   ├── L3 Node Status                    # ノード状態
│   └── Alert Summary                     # アラートサマリー
│
├── 4. Edition Management（4画面）
│   ├── Current Mode                      # 現在のエディション
│   ├── Mode Switch                       # モード切替
│   ├── Edition Settings                  # エディション別設定
│   └── Switch History                    # 切替履歴
│
├── 5. L3 Node Management（4画面）
│   ├── Node List                         # ノード一覧
│   ├── Node Detail                       # ノード詳細
│   ├── Node Add/Remove                   # ノード追加・削除
│   └── Node Config                       # ノード設定
│
├── 6. Prover Management（6画面）
│   ├── Prover List                       # Prover一覧
│   ├── Prover Detail                     # Prover詳細
│   ├── Application Queue                 # 申請キュー
│   ├── Application Review                # 申請審査
│   ├── Prover Suspend                    # Prover停止
│   └── Prover Performance                # パフォーマンス
│
├── 7. Transaction Monitor（5画面）
│   ├── Lock Monitor                      # Lock監視
│   ├── Unlock Monitor                    # Unlock監視
│   ├── Challenge Monitor                 # Challenge監視
│   ├── Slashing Events                   # Slashingイベント
│   └── Anomaly Detection                 # 異常検知
│
├── 8. Emergency（4画面）
│   ├── Emergency Dashboard               # 緊急対応ダッシュボード
│   ├── Pause Control                     # Pause実行
│   ├── Pause History                     # Pause履歴
│   └── Recovery Procedures               # 復旧手順
│
├── 9. Parameters（4画面）
│   ├── Time Lock Config                  # Time Lock設定
│   ├── Emergency Bond Config             # Bond設定
│   ├── Slashing Config                   # Slashing設定
│   └── Fee Config                        # 手数料設定
│
├── 10. Enterprise Customers（4画面）
│   ├── Customer List                     # 顧客一覧
│   ├── Customer Detail                   # 顧客詳細
│   ├── Contract Management               # 契約管理
│   └── Service Control                   # サービス制御
│
├── 11. Community（4画面）
│   ├── Delegate Overview                 # Delegate一覧
│   ├── Proposal Overview                 # 提案概要
│   ├── Council Members                   # Council一覧
│   └── Treasury Status                   # Treasury状況
│
├── 12. Reports（2画面）
│   ├── Report Generator                  # レポート生成
│   └── Report Archive                    # レポート履歴
│
├── 13. Audit Log（1画面）
│   └── Audit Log                         # 監査ログ
│
└── 14. Staff Management（1画面）
    └── Staff List                        # スタッフ一覧
```

---

# Part 3: スマホ対応設計

## 3.1 デバイス別対応方針

| システム | PC | タブレット | スマホ | 備考 |
|---------|:--:|:----------:|:------:|------|
| サービス全体サイト | ✅ | ✅ | ✅ | フル対応 |
| Consumer App | ✅ | ✅ | ✅ | フル対応必須 |
| Token Hub | ✅ | ✅ | ✅ | フル対応 |
| Governance | ✅ | ✅ | ✅ | 投票対応、提案作成はPC推奨 |
| Prover Portal | ✅ | ✅ | △ | ダッシュボード閲覧は対応、申請はPC |
| Observer/Challenger | ✅ | ✅ | ✅ | 監視・Challenge対応 |
| Explorer | ✅ | ✅ | ✅ | フル対応必須 |
| Enterprise Admin | ✅ | ✅ | △ | ダッシュボード閲覧は対応、管理はPC |
| QS Admin | ✅ | △ | ❌ | PCのみ推奨 |

## 3.2 レスポンシブブレークポイント

```css
/* Mobile First Approach */
@media (min-width: 375px) { }  /* Standard phones */
@media (min-width: 428px) { }  /* Large phones */
@media (min-width: 768px) { }  /* Tablets */
@media (min-width: 1024px) { } /* Desktop */
@media (min-width: 1280px) { } /* Large desktop */
```

---

**END OF SCREENS**
