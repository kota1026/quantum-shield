# 📊 UI Progress Tracker
## Phase 4A Design Progress

> **Version**: 1.0  
> **Date**: 2026-01-06  
> **Total Screens**: 176

---

# Summary

| # | System | Screens | Priority | Figma | Mock | Implementation |
|---|--------|:-------:|:--------:|:-----:|:----:|:--------------:|
| 1 | Consumer App | 25 | P0 | ⬜ | ⬜ | ⬜ |
| 2 | Token Hub | 18 | P0 | ⬜ | ⬜ | ⬜ |
| 3 | Governance | 16 | P1 | ⬜ | ⬜ | ⬜ |
| 4 | Prover Portal | 28 | P0 | ⬜ | ⬜ | ⬜ |
| 5 | Observer/Challenger | 10 | P2 | ⬜ | ⬜ | ⬜ |
| 6 | Explorer | 14 | P1 | ⬜ | ⬜ | ⬜ |
| 7 | Enterprise Admin | 25 | P1 | ⬜ | ⬜ | ⬜ |
| 8 | QS Admin | 40 | P0 | ⬜ | ⬜ | ⬜ |
| | **Total** | **176** | | | | |

**Legend**: ⬜ Not Started | 🔄 In Progress | ✅ Complete | ⏸️ Blocked

---

# Priority Order

```
P0 (Must Have - Week 1-6):
├── 1. Consumer App (25)     ← End User 向け、最優先
├── 4. Prover Portal (28)    ← Prover 事業者向け
├── 8. QS Admin (40)         ← 運用必須
└── 2. Token Hub (18)        ← Decentralized Edition

P1 (Should Have - Week 7-10):
├── 3. Governance (16)       ← 投票システム
├── 6. Explorer (14)         ← 公開閲覧
└── 7. Enterprise Admin (25) ← Enterprise Edition

P2 (Nice to Have - Week 11-12):
└── 5. Observer/Challenger (10)
```

---

# System 1: Consumer App (25 screens)

## 1.1 Public Pages (4)

| # | Screen | Persona | Priority | Figma | Mock | Notes |
|---|--------|---------|:--------:|:-----:|:----:|-------|
| 1.1.1 | Landing Page | 田中 | High | ⬜ | ⬜ | ファーストビュー重要 |
| 1.1.2 | How It Works | 田中 | High | ⬜ | ⬜ | 3ステップ説明 |
| 1.1.3 | Security Explainer | 田中 | Medium | ⬜ | ⬜ | Dilithium/SPHINCS+説明 |
| 1.1.4 | FAQ | 田中 | Low | ⬜ | ⬜ | アコーディオン |

## 1.2 Onboarding (4)

| # | Screen | Persona | Priority | Figma | Mock | Notes |
|---|--------|---------|:--------:|:-----:|:----:|-------|
| 1.2.1 | Wallet Connect | 田中 | High | ⬜ | ⬜ | MetaMask/WalletConnect |
| 1.2.2 | Key Generation | 田中 | High | ⬜ | ⬜ | Dilithium鍵生成 |
| 1.2.3 | Backup Instructions | 田中 | High | ⬜ | ⬜ | 鍵バックアップ |
| 1.2.4 | Ready | 田中 | Medium | ⬜ | ⬜ | 完了画面 |

## 1.3 Main App (13)

| # | Screen | Persona | Priority | Figma | Mock | Notes |
|---|--------|---------|:--------:|:-----:|:----:|-------|
| 1.3.1 | Dashboard | 田中 | High | ⬜ | ⬜ | 総資産、Lock中、進行中 |
| 1.3.2 | Lock Input | 田中 | High | ⬜ | ⬜ | 金額・資産入力 |
| 1.3.3 | Lock Confirmation | 田中 | High | ⬜ | ⬜ | 確認画面 |
| 1.3.4 | Lock Processing | 田中 | Medium | ⬜ | ⬜ | 署名・送信中 |
| 1.3.5 | Lock Success | 田中 | Medium | ⬜ | ⬜ | 完了画面 |
| 1.3.6 | Unlock Select | 田中 | High | ⬜ | ⬜ | 対象Lock選択 |
| 1.3.7 | Unlock Method | 田中 | High | ⬜ | ⬜ | 通常/緊急選択 |
| 1.3.8 | Dilithium Sign | 田中 | High | ⬜ | ⬜ | Dilithium署名 |
| 1.3.9 | Prover Waiting | 田中 | Medium | ⬜ | ⬜ | Prover署名待ち |
| 1.3.10 | Time Lock Countdown | 田中 | Medium | ⬜ | ⬜ | 24h待機 |
| 1.3.11 | Unlock Ready | 田中 | Medium | ⬜ | ⬜ | 実行可能 |
| 1.3.12 | Unlock Complete | 田中 | Medium | ⬜ | ⬜ | 完了画面 |
| 1.3.13 | History | 田中 | Medium | ⬜ | ⬜ | 履歴一覧 |

## 1.4 Emergency Flow (2)

| # | Screen | Persona | Priority | Figma | Mock | Notes |
|---|--------|---------|:--------:|:-----:|:----:|-------|
| 1.4.1 | Emergency Bond | 田中 | High | ⬜ | ⬜ | Bond計算・支払い |
| 1.4.2 | Emergency Complete | 田中 | Medium | ⬜ | ⬜ | Bond返還・完了 |

## 1.5 Settings (2)

| # | Screen | Persona | Priority | Figma | Mock | Notes |
|---|--------|---------|:--------:|:-----:|:----:|-------|
| 1.5.1 | Settings | 田中 | Low | ⬜ | ⬜ | 設定一覧 |
| 1.5.2 | Key Management | 田中 | Medium | ⬜ | ⬜ | 鍵管理 |

---

# System 2: Token Hub (18 screens)

## 2.1 Dashboard (1)

| # | Screen | Persona | Priority | Figma | Mock | Notes |
|---|--------|---------|:--------:|:-----:|:----:|-------|
| 2.1.1 | Token Dashboard | 鈴木 | High | ⬜ | ⬜ | QS/veQS残高 |

## 2.2 veQS Lock (4)

| # | Screen | Persona | Priority | Figma | Mock | Notes |
|---|--------|---------|:--------:|:-----:|:----:|-------|
| 2.2.1 | Lock Form | 鈴木 | High | ⬜ | ⬜ | 金額・期間入力 |
| 2.2.2 | Lock Preview | 鈴木 | High | ⬜ | ⬜ | 投票力計算 |
| 2.2.3 | Lock Confirm | 鈴木 | High | ⬜ | ⬜ | 確認・署名 |
| 2.2.4 | Lock Success | 鈴木 | Medium | ⬜ | ⬜ | 完了 |

## 2.3 veQS Manage (4)

| # | Screen | Persona | Priority | Figma | Mock | Notes |
|---|--------|---------|:--------:|:-----:|:----:|-------|
| 2.3.1 | Extend Lock | 鈴木 | Medium | ⬜ | ⬜ | 期間延長 |
| 2.3.2 | Early Unlock | 鈴木 | Medium | ⬜ | ⬜ | ペナルティ計算 |
| 2.3.3 | Normal Unlock | 鈴木 | Medium | ⬜ | ⬜ | 満了時解除 |
| 2.3.4 | Unlock Success | 鈴木 | Low | ⬜ | ⬜ | 完了 |

## 2.4 Delegation (5)

| # | Screen | Persona | Priority | Figma | Mock | Notes |
|---|--------|---------|:--------:|:-----:|:----:|-------|
| 2.4.1 | Delegate List | 鈴木 | High | ⬜ | ⬜ | Delegate一覧 |
| 2.4.2 | Delegate Detail | 鈴木 | High | ⬜ | ⬜ | Delegate詳細 |
| 2.4.3 | Delegate Form | 鈴木 | High | ⬜ | ⬜ | 委任実行 |
| 2.4.4 | My Delegations | 鈴木 | Medium | ⬜ | ⬜ | 委任中一覧 |
| 2.4.5 | Undelegate | 鈴木 | Medium | ⬜ | ⬜ | 委任解除 |

## 2.5 Rewards (4)

| # | Screen | Persona | Priority | Figma | Mock | Notes |
|---|--------|---------|:--------:|:-----:|:----:|-------|
| 2.5.1 | Rewards Dashboard | 鈴木 | Medium | ⬜ | ⬜ | 報酬ダッシュボード |
| 2.5.2 | Claim Rewards | 鈴木 | Medium | ⬜ | ⬜ | 報酬請求 |
| 2.5.3 | Rewards History | 鈴木 | Low | ⬜ | ⬜ | 報酬履歴 |
| 2.5.4 | Become Delegate | 渡辺 | Low | ⬜ | ⬜ | Delegate登録 |

---

# System 3: Governance (16 screens)

## 3.1 Overview (2)

| # | Screen | Persona | Priority | Figma | Mock | Notes |
|---|--------|---------|:--------:|:-----:|:----:|-------|
| 3.1.1 | Governance Dashboard | 鈴木/渡辺 | High | ⬜ | ⬜ | 概要、アクティブ提案 |
| 3.1.2 | My Voting Power | 鈴木/渡辺 | High | ⬜ | ⬜ | 自分の投票力 |

## 3.2 Proposals (4)

| # | Screen | Persona | Priority | Figma | Mock | Notes |
|---|--------|---------|:--------:|:-----:|:----:|-------|
| 3.2.1 | Proposal List | 鈴木/渡辺 | High | ⬜ | ⬜ | 提案一覧 |
| 3.2.2 | Proposal Detail | 鈴木/渡辺 | High | ⬜ | ⬜ | 提案詳細 |
| 3.2.3 | Vote Form | 鈴木/渡辺 | High | ⬜ | ⬜ | 投票画面 |
| 3.2.4 | Vote Success | 鈴木/渡辺 | Medium | ⬜ | ⬜ | 投票完了 |

## 3.3 Proposal Create (4)

| # | Screen | Persona | Priority | Figma | Mock | Notes |
|---|--------|---------|:--------:|:-----:|:----:|-------|
| 3.3.1 | Create Step 1 | 渡辺 | Medium | ⬜ | ⬜ | 基本情報 |
| 3.3.2 | Create Step 2 | 渡辺 | Medium | ⬜ | ⬜ | アクション定義 |
| 3.3.3 | Create Step 3 | 渡辺 | Medium | ⬜ | ⬜ | プレビュー |
| 3.3.4 | Submit Proposal | 渡辺 | Medium | ⬜ | ⬜ | 提出 |

## 3.4 My Activity (3)

| # | Screen | Persona | Priority | Figma | Mock | Notes |
|---|--------|---------|:--------:|:-----:|:----:|-------|
| 3.4.1 | My Votes | 鈴木/渡辺 | Medium | ⬜ | ⬜ | 投票履歴 |
| 3.4.2 | My Proposals | 渡辺 | Medium | ⬜ | ⬜ | 作成した提案 |
| 3.4.3 | Delegation Received | 渡辺 | Low | ⬜ | ⬜ | 委任受け履歴 |

## 3.5 Council Pages (3)

| # | Screen | Persona | Priority | Figma | Mock | Notes |
|---|--------|---------|:--------:|:-----:|:----:|-------|
| 3.5.1 | Council Dashboard | Council | Medium | ⬜ | ⬜ | Council専用 |
| 3.5.2 | Emergency Actions | Council | Medium | ⬜ | ⬜ | 緊急アクション |
| 3.5.3 | Veto Management | Council | Low | ⬜ | ⬜ | Veto管理 |

---

# System 4: Prover Portal (28 screens)

## 4.1 Public (5)

| # | Screen | Persona | Priority | Figma | Mock | Notes |
|---|--------|---------|:--------:|:-----:|:----:|-------|
| 4.1.1 | Prover Program LP | 山田 | High | ⬜ | ⬜ | プログラム説明 |
| 4.1.2 | Requirements | 山田 | High | ⬜ | ⬜ | 要件一覧 |
| 4.1.3 | Economics | 山田 | High | ⬜ | ⬜ | 経済モデル |
| 4.1.4 | Risk Calculator | 山田 | Medium | ⬜ | ⬜ | Slashingリスク |
| 4.1.5 | ROI Simulator | 山田 | Medium | ⬜ | ⬜ | 収益シミュレーター |

## 4.2 Registration (7)

| # | Screen | Persona | Priority | Figma | Mock | Notes |
|---|--------|---------|:--------:|:-----:|:----:|-------|
| 4.2.1 | Application Step 1 | 山田 | High | ⬜ | ⬜ | 企業情報 |
| 4.2.2 | Application Step 2 | 山田 | High | ⬜ | ⬜ | 技術要件証明 |
| 4.2.3 | Application Step 3 | 山田 | High | ⬜ | ⬜ | インフラ情報 |
| 4.2.4 | Application Step 4 | 山田 | High | ⬜ | ⬜ | Stake準備確認 |
| 4.2.5 | Application Submitted | 山田 | Medium | ⬜ | ⬜ | 申請完了 |
| 4.2.6 | Application Status | 山田 | Medium | ⬜ | ⬜ | 審査状況 |
| 4.2.7 | Additional Questions | 山田 | Low | ⬜ | ⬜ | 追加質問対応 |

## 4.3 Activation (4)

| # | Screen | Persona | Priority | Figma | Mock | Notes |
|---|--------|---------|:--------:|:-----:|:----:|-------|
| 4.3.1 | Approval Notification | 山田 | High | ⬜ | ⬜ | 承認通知 |
| 4.3.2 | Stake Deposit | 山田 | High | ⬜ | ⬜ | Stake入金 |
| 4.3.3 | SPHINCS+ Key Setup | 山田 | High | ⬜ | ⬜ | 鍵設定 |
| 4.3.4 | Activation Complete | 山田 | Medium | ⬜ | ⬜ | 稼働開始 |

## 4.4 Operations (8)

| # | Screen | Persona | Priority | Figma | Mock | Notes |
|---|--------|---------|:--------:|:-----:|:----:|-------|
| 4.4.1 | Prover Dashboard | 山田 | High | ⬜ | ⬜ | メインダッシュボード |
| 4.4.2 | Signature Queue | 山田 | High | ⬜ | ⬜ | 署名キュー |
| 4.4.3 | Signature Detail | 山田 | High | ⬜ | ⬜ | 署名要求詳細 |
| 4.4.4 | Performance Metrics | 山田 | Medium | ⬜ | ⬜ | パフォーマンス指標 |
| 4.4.5 | Rewards Dashboard | 山田 | Medium | ⬜ | ⬜ | 報酬管理 |
| 4.4.6 | Stake Management | 山田 | Medium | ⬜ | ⬜ | Stake管理 |
| 4.4.7 | Alerts | 山田 | Medium | ⬜ | ⬜ | アラート一覧 |
| 4.4.8 | Rewards Claim | 山田 | Low | ⬜ | ⬜ | 報酬請求 |

## 4.5 Exit (4)

| # | Screen | Persona | Priority | Figma | Mock | Notes |
|---|--------|---------|:--------:|:-----:|:----:|-------|
| 4.5.1 | Exit Request | 山田 | Medium | ⬜ | ⬜ | 退出申請 |
| 4.5.2 | Pending Tasks | 山田 | Medium | ⬜ | ⬜ | 保留タスク完了 |
| 4.5.3 | Unbonding Progress | 山田 | Medium | ⬜ | ⬜ | Unbonding進捗 |
| 4.5.4 | Stake Returned | 山田 | Low | ⬜ | ⬜ | Stake返還完了 |

---

# System 5: Observer/Challenger (10 screens)

## 5.1 Monitor (4)

| # | Screen | Persona | Priority | Figma | Mock | Notes |
|---|--------|---------|:--------:|:-----:|:----:|-------|
| 5.1.1 | Monitor Overview | Observer | Medium | ⬜ | ⬜ | 監視概要 |
| 5.1.2 | Pending Unlocks | Observer | Medium | ⬜ | ⬜ | 進行中Unlock一覧 |
| 5.1.3 | Suspicious Activity | Observer | Medium | ⬜ | ⬜ | 疑わしいアクティビティ |
| 5.1.4 | Alert History | Observer | Low | ⬜ | ⬜ | アラート履歴 |

## 5.2 Challenge (4)

| # | Screen | Persona | Priority | Figma | Mock | Notes |
|---|--------|---------|:--------:|:-----:|:----:|-------|
| 5.2.1 | Challenge Form | Challenger | High | ⬜ | ⬜ | Challenge提起 |
| 5.2.2 | Challenge Confirmation | Challenger | High | ⬜ | ⬜ | 確認 |
| 5.2.3 | Challenge Progress | Challenger | Medium | ⬜ | ⬜ | 進捗追跡 |
| 5.2.4 | Challenge Result | Challenger | Medium | ⬜ | ⬜ | 結果 |

## 5.3 Earnings (2)

| # | Screen | Persona | Priority | Figma | Mock | Notes |
|---|--------|---------|:--------:|:-----:|:----:|-------|
| 5.3.1 | Challenge Rewards | Challenger | Medium | ⬜ | ⬜ | Challenge報酬 |
| 5.3.2 | Claim Rewards | Challenger | Low | ⬜ | ⬜ | 報酬請求 |

---

# System 6: Explorer (14 screens)

## 6.1 Home (3)

| # | Screen | Persona | Priority | Figma | Mock | Notes |
|---|--------|---------|:--------:|:-----:|:----:|-------|
| 6.1.1 | Overview | Public | High | ⬜ | ⬜ | 全体統計 |
| 6.1.2 | Recent Locks | Public | Medium | ⬜ | ⬜ | 最近のLock |
| 6.1.3 | Recent Unlocks | Public | Medium | ⬜ | ⬜ | 最近のUnlock |

## 6.2 Search & List (4)

| # | Screen | Persona | Priority | Figma | Mock | Notes |
|---|--------|---------|:--------:|:-----:|:----:|-------|
| 6.2.1 | Search | Public | High | ⬜ | ⬜ | 検索 |
| 6.2.2 | Lock List | Public | Medium | ⬜ | ⬜ | Lock一覧 |
| 6.2.3 | Unlock List | Public | Medium | ⬜ | ⬜ | Unlock一覧 |
| 6.2.4 | Challenge List | Public | Low | ⬜ | ⬜ | Challenge一覧 |

## 6.3 Detail Pages (4)

| # | Screen | Persona | Priority | Figma | Mock | Notes |
|---|--------|---------|:--------:|:-----:|:----:|-------|
| 6.3.1 | Lock Detail | Public | High | ⬜ | ⬜ | Lock詳細 |
| 6.3.2 | Unlock Detail | Public | High | ⬜ | ⬜ | Unlock詳細 |
| 6.3.3 | Challenge Detail | Public | Medium | ⬜ | ⬜ | Challenge詳細 |
| 6.3.4 | Address Detail | Public | Medium | ⬜ | ⬜ | アドレス詳細 |

## 6.4 Analytics (3)

| # | Screen | Persona | Priority | Figma | Mock | Notes |
|---|--------|---------|:--------:|:-----:|:----:|-------|
| 6.4.1 | TVL Chart | Public | Medium | ⬜ | ⬜ | TVL推移 |
| 6.4.2 | Volume Chart | Public | Low | ⬜ | ⬜ | 取引量推移 |
| 6.4.3 | Prover Ranking | Public | Low | ⬜ | ⬜ | Proverランキング |

---

# System 7: Enterprise Admin (25 screens)

## 7.1 Dashboard (4)

| # | Screen | Persona | Priority | Figma | Mock | Notes |
|---|--------|---------|:--------:|:-----:|:----:|-------|
| 7.1.1 | Overview | 佐藤 | High | ⬜ | ⬜ | 契約概要 |
| 7.1.2 | TVL Summary | 佐藤 | High | ⬜ | ⬜ | 自社TVL |
| 7.1.3 | Monthly Volume | 佐藤 | Medium | ⬜ | ⬜ | 月間取引量 |
| 7.1.4 | Service Status | 佐藤 | Medium | ⬜ | ⬜ | サービス稼働状況 |

## 7.2 Transactions (4)

| # | Screen | Persona | Priority | Figma | Mock | Notes |
|---|--------|---------|:--------:|:-----:|:----:|-------|
| 7.2.1 | Transaction List | 佐藤 | High | ⬜ | ⬜ | TX一覧 |
| 7.2.2 | Transaction Detail | 佐藤 | High | ⬜ | ⬜ | TX詳細 |
| 7.2.3 | Transaction Export | 佐藤 | Medium | ⬜ | ⬜ | エクスポート |
| 7.2.4 | Transaction Analytics | 佐藤 | Low | ⬜ | ⬜ | 分析 |

## 7.3 User Management (5)

| # | Screen | Persona | Priority | Figma | Mock | Notes |
|---|--------|---------|:--------:|:-----:|:----:|-------|
| 7.3.1 | User List | 佐藤 | High | ⬜ | ⬜ | ユーザー一覧 |
| 7.3.2 | User Detail | 佐藤 | High | ⬜ | ⬜ | ユーザー詳細 |
| 7.3.3 | User Create | 佐藤 | Medium | ⬜ | ⬜ | ユーザー追加 |
| 7.3.4 | Role Management | 佐藤 | Medium | ⬜ | ⬜ | 権限管理 |
| 7.3.5 | Invite User | 佐藤 | Low | ⬜ | ⬜ | 招待 |

## 7.4 API Management (4)

| # | Screen | Persona | Priority | Figma | Mock | Notes |
|---|--------|---------|:--------:|:-----:|:----:|-------|
| 7.4.1 | API Keys | 佐藤 | High | ⬜ | ⬜ | APIキー一覧 |
| 7.4.2 | API Key Create | 佐藤 | High | ⬜ | ⬜ | キー発行 |
| 7.4.3 | API Usage | 佐藤 | Medium | ⬜ | ⬜ | 使用量 |
| 7.4.4 | Webhook Settings | 佐藤 | Medium | ⬜ | ⬜ | Webhook設定 |

## 7.5 Settings (4)

| # | Screen | Persona | Priority | Figma | Mock | Notes |
|---|--------|---------|:--------:|:-----:|:----:|-------|
| 7.5.1 | Organization Settings | 佐藤 | Medium | ⬜ | ⬜ | 組織設定 |
| 7.5.2 | Security Settings | 佐藤 | Medium | ⬜ | ⬜ | セキュリティ |
| 7.5.3 | Notification Settings | 佐藤 | Low | ⬜ | ⬜ | 通知設定 |
| 7.5.4 | Limit Settings | 佐藤 | Low | ⬜ | ⬜ | 上限設定 |

## 7.6 Reports (4)

| # | Screen | Persona | Priority | Figma | Mock | Notes |
|---|--------|---------|:--------:|:-----:|:----:|-------|
| 7.6.1 | Monthly Report | 佐藤 | Medium | ⬜ | ⬜ | 月次レポート |
| 7.6.2 | Compliance Report | 佐藤 | Medium | ⬜ | ⬜ | コンプライアンス |
| 7.6.3 | Audit Trail | 佐藤 | Medium | ⬜ | ⬜ | 監査ログ |
| 7.6.4 | Support Tickets | 佐藤 | Low | ⬜ | ⬜ | サポートチケット |

---

# System 8: QS Admin (40 screens)

## 8.1 Dashboard (5)

| # | Screen | Persona | Priority | Figma | Mock | Notes |
|---|--------|---------|:--------:|:-----:|:----:|-------|
| 8.1.1 | System Overview | Admin | High | ⬜ | ⬜ | システム全体状況 |
| 8.1.2 | TVL Summary | Admin | High | ⬜ | ⬜ | 全TVL |
| 8.1.3 | Active Locks/Unlocks | Admin | High | ⬜ | ⬜ | アクティブ数 |
| 8.1.4 | L3 Node Status | Admin | High | ⬜ | ⬜ | ノード状態 |
| 8.1.5 | Alert Summary | Admin | Medium | ⬜ | ⬜ | アラートサマリー |

## 8.2 Edition Management (4)

| # | Screen | Persona | Priority | Figma | Mock | Notes |
|---|--------|---------|:--------:|:-----:|:----:|-------|
| 8.2.1 | Current Mode | Admin | High | ⬜ | ⬜ | 現在のエディション |
| 8.2.2 | Mode Switch | Admin | High | ⬜ | ⬜ | モード切替 |
| 8.2.3 | Edition Settings | Admin | Medium | ⬜ | ⬜ | エディション別設定 |
| 8.2.4 | Switch History | Admin | Low | ⬜ | ⬜ | 切替履歴 |

## 8.3 L3 Node Management (4)

| # | Screen | Persona | Priority | Figma | Mock | Notes |
|---|--------|---------|:--------:|:-----:|:----:|-------|
| 8.3.1 | Node List | Admin | High | ⬜ | ⬜ | ノード一覧 |
| 8.3.2 | Node Detail | Admin | High | ⬜ | ⬜ | ノード詳細 |
| 8.3.3 | Node Add/Remove | Admin | Medium | ⬜ | ⬜ | ノード追加・削除 |
| 8.3.4 | Node Config | Admin | Medium | ⬜ | ⬜ | ノード設定 |

## 8.4 Prover Management (6)

| # | Screen | Persona | Priority | Figma | Mock | Notes |
|---|--------|---------|:--------:|:-----:|:----:|-------|
| 8.4.1 | Prover List | Admin | High | ⬜ | ⬜ | Prover一覧 |
| 8.4.2 | Prover Detail | Admin | High | ⬜ | ⬜ | Prover詳細 |
| 8.4.3 | Application Queue | Admin | High | ⬜ | ⬜ | 申請キュー |
| 8.4.4 | Application Review | Admin | High | ⬜ | ⬜ | 申請審査 |
| 8.4.5 | Prover Suspend | Admin | Medium | ⬜ | ⬜ | Prover停止 |
| 8.4.6 | Prover Performance | Admin | Medium | ⬜ | ⬜ | パフォーマンス |

## 8.5 Transaction Monitor (5)

| # | Screen | Persona | Priority | Figma | Mock | Notes |
|---|--------|---------|:--------:|:-----:|:----:|-------|
| 8.5.1 | Lock Monitor | Admin | High | ⬜ | ⬜ | Lock監視 |
| 8.5.2 | Unlock Monitor | Admin | High | ⬜ | ⬜ | Unlock監視 |
| 8.5.3 | Challenge Monitor | Admin | Medium | ⬜ | ⬜ | Challenge監視 |
| 8.5.4 | Slashing Events | Admin | Medium | ⬜ | ⬜ | Slashingイベント |
| 8.5.5 | Anomaly Detection | Admin | Medium | ⬜ | ⬜ | 異常検知 |

## 8.6 Emergency (4)

| # | Screen | Persona | Priority | Figma | Mock | Notes |
|---|--------|---------|:--------:|:-----:|:----:|-------|
| 8.6.1 | Emergency Dashboard | Admin | High | ⬜ | ⬜ | 緊急対応ダッシュボード |
| 8.6.2 | Pause Control | Admin | High | ⬜ | ⬜ | Pause実行 |
| 8.6.3 | Pause History | Admin | Medium | ⬜ | ⬜ | Pause履歴 |
| 8.6.4 | Recovery Procedures | Admin | Medium | ⬜ | ⬜ | 復旧手順 |

## 8.7 Parameters (4)

| # | Screen | Persona | Priority | Figma | Mock | Notes |
|---|--------|---------|:--------:|:-----:|:----:|-------|
| 8.7.1 | Time Lock Config | Admin | Medium | ⬜ | ⬜ | Time Lock設定 |
| 8.7.2 | Emergency Bond Config | Admin | Medium | ⬜ | ⬜ | Bond設定 |
| 8.7.3 | Slashing Config | Admin | Medium | ⬜ | ⬜ | Slashing設定 |
| 8.7.4 | Fee Config | Admin | Medium | ⬜ | ⬜ | 手数料設定 |

## 8.8 Reports (4)

| # | Screen | Persona | Priority | Figma | Mock | Notes |
|---|--------|---------|:--------:|:-----:|:----:|-------|
| 8.8.1 | Daily Report | Admin | Medium | ⬜ | ⬜ | 日次レポート |
| 8.8.2 | Weekly Report | Admin | Medium | ⬜ | ⬜ | 週次レポート |
| 8.8.3 | Monthly Report | Admin | Medium | ⬜ | ⬜ | 月次レポート |
| 8.8.4 | Revenue Analytics | Admin | Low | ⬜ | ⬜ | 収益分析 |

## 8.9 Audit Log (4)

| # | Screen | Persona | Priority | Figma | Mock | Notes |
|---|--------|---------|:--------:|:-----:|:----:|-------|
| 8.9.1 | All Operations | Admin | High | ⬜ | ⬜ | 全操作ログ |
| 8.9.2 | User Operations | Admin | Medium | ⬜ | ⬜ | ユーザー別 |
| 8.9.3 | Security Events | Admin | Medium | ⬜ | ⬜ | セキュリティイベント |
| 8.9.4 | Export Logs | Admin | Low | ⬜ | ⬜ | ログエクスポート |

---

## Document History

| Version | Date | Changes |
|---------|------|--------|
| 1.0 | 2026-01-06 | 初版作成（176画面定義） |

---

**END OF DOCUMENT**