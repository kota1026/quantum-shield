# 📊 UI Progress Tracker
## Phase 4 UI 176画面 進捗管理

> **Version**: 1.0  
> **Date**: 2026-01-06  
> **Design System**: Premium Japan v1.0

---

# Overview

## 進捗サマリー

```
┌─────────────────────────────────────────────────────────────────┐
│  全体進捗: 0 / 176 画面 (0%)                                    │
│  ████████████████████████████████████████ 0%                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Phase 4A (Design):    0 / 176 完了                            │
│  Phase 4B (Implement): 0 / 176 完了                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## システム別進捗

| # | System | Screens | Figma | Mock | Impl | Status |
|:-:|--------|:-------:|:-----:|:----:|:----:|:------:|
| 1 | Consumer App | 25 | 0/25 | 0/25 | 0/25 | 🔴 Not Started |
| 2 | Token Hub | 18 | 0/18 | 0/18 | 0/18 | 🔴 Not Started |
| 3 | Governance | 16 | 0/16 | 0/16 | 0/16 | 🔴 Not Started |
| 4 | Prover Portal | 28 | 0/28 | 0/28 | 0/28 | 🔴 Not Started |
| 5 | Observer/Challenger | 10 | 0/10 | 0/10 | 0/10 | 🔴 Not Started |
| 6 | Explorer | 14 | 0/14 | 0/14 | 0/14 | 🔴 Not Started |
| 7 | Enterprise Admin | 25 | 0/25 | 0/25 | 0/25 | 🔴 Not Started |
| 8 | QS Admin | 40 | 0/40 | 0/40 | 0/40 | 🔴 Not Started |
| | **Total** | **176** | **0** | **0** | **0** | |

### ステータス凡例

| Status | 意味 |
|:------:|------|
| 🔴 | Not Started - 未着手 |
| 🟡 | In Progress - 進行中 |
| 🟢 | Complete - 完了 |
| ⏸️ | On Hold - 保留 |

---

# Priority Order

## P0: Critical Path（最優先）

| Order | System | Reason |
|:-----:|--------|--------|
| 1 | Consumer App | コアユーザー体験、MVP必須 |
| 2 | Prover Portal | 収益の要、ローンチ必須 |
| 3 | QS Admin | 運用必須、既存コード拡張 |
| 4 | Token Hub | Decentralized Edition 必須 |

## P1: Important（重要）

| Order | System | Reason |
|:-----:|--------|--------|
| 5 | Governance | Decentralized Edition |
| 6 | Explorer | 透明性、公開情報 |
| 7 | Enterprise Admin | Enterprise Edition |

## P2: Nice to Have

| Order | System | Reason |
|:-----:|--------|--------|
| 8 | Observer/Challenger | Permissionless 参加 |

---

# System 1: Consumer App (25 screens)

## 1.1 Public Pages (4)

| # | Screen | Figma | Mock | Impl | Notes |
|:-:|--------|:-----:|:----:|:----:|-------|
| 1-1 | Landing Page | ⬜ | ⬜ | ⬜ | |
| 1-2 | How It Works | ⬜ | ⬜ | ⬜ | |
| 1-3 | Security Explainer | ⬜ | ⬜ | ⬜ | |
| 1-4 | FAQ | ⬜ | ⬜ | ⬜ | |

## 1.2 Onboarding (4)

| # | Screen | Figma | Mock | Impl | Notes |
|:-:|--------|:-----:|:----:|:----:|-------|
| 1-5 | Wallet Connect | ⬜ | ⬜ | ⬜ | |
| 1-6 | Key Generation | ⬜ | ⬜ | ⬜ | Dilithium鍵生成 |
| 1-7 | Backup Instructions | ⬜ | ⬜ | ⬜ | |
| 1-8 | Ready | ⬜ | ⬜ | ⬜ | |

## 1.3 Main App (13)

| # | Screen | Figma | Mock | Impl | Notes |
|:-:|--------|:-----:|:----:|:----:|-------|
| 1-9 | Dashboard | ⬜ | ⬜ | ⬜ | |
| 1-10 | Lock Input | ⬜ | ⬜ | ⬜ | |
| 1-11 | Lock Confirmation | ⬜ | ⬜ | ⬜ | |
| 1-12 | Lock Processing | ⬜ | ⬜ | ⬜ | |
| 1-13 | Lock Success | ⬜ | ⬜ | ⬜ | |
| 1-14 | Unlock Select | ⬜ | ⬜ | ⬜ | |
| 1-15 | Unlock Method | ⬜ | ⬜ | ⬜ | Normal/Emergency選択 |
| 1-16 | Dilithium Sign | ⬜ | ⬜ | ⬜ | |
| 1-17 | Prover Waiting | ⬜ | ⬜ | ⬜ | |
| 1-18 | Time Lock Countdown | ⬜ | ⬜ | ⬜ | 24h待機 |
| 1-19 | Unlock Ready | ⬜ | ⬜ | ⬜ | |
| 1-20 | Unlock Complete | ⬜ | ⬜ | ⬜ | |
| 1-21 | History | ⬜ | ⬜ | ⬜ | |

## 1.4 Emergency Flow (2)

| # | Screen | Figma | Mock | Impl | Notes |
|:-:|--------|:-----:|:----:|:----:|-------|
| 1-22 | Emergency Bond | ⬜ | ⬜ | ⬜ | Bond計算・支払い |
| 1-23 | Emergency Complete | ⬜ | ⬜ | ⬜ | |

## 1.5 Settings & Exit (2)

| # | Screen | Figma | Mock | Impl | Notes |
|:-:|--------|:-----:|:----:|:----:|-------|
| 1-24 | Settings | ⬜ | ⬜ | ⬜ | |
| 1-25 | Key Management | ⬜ | ⬜ | ⬜ | |

---

# System 2: Token Hub (18 screens)

## 2.1 Dashboard (1)

| # | Screen | Figma | Mock | Impl | Notes |
|:-:|--------|:-----:|:----:|:----:|-------|
| 2-1 | Token Dashboard | ⬜ | ⬜ | ⬜ | QS/veQS残高、投票力 |

## 2.2 veQS Lock (4)

| # | Screen | Figma | Mock | Impl | Notes |
|:-:|--------|:-----:|:----:|:----:|-------|
| 2-2 | Lock Form | ⬜ | ⬜ | ⬜ | |
| 2-3 | Lock Preview | ⬜ | ⬜ | ⬜ | 投票力計算 |
| 2-4 | Lock Confirm | ⬜ | ⬜ | ⬜ | |
| 2-5 | Lock Success | ⬜ | ⬜ | ⬜ | |

## 2.3 veQS Manage (4)

| # | Screen | Figma | Mock | Impl | Notes |
|:-:|--------|:-----:|:----:|:----:|-------|
| 2-6 | Extend Lock | ⬜ | ⬜ | ⬜ | |
| 2-7 | Early Unlock | ⬜ | ⬜ | ⬜ | ペナルティ計算 |
| 2-8 | Normal Unlock | ⬜ | ⬜ | ⬜ | |
| 2-9 | Unlock Success | ⬜ | ⬜ | ⬜ | |

## 2.4 Delegation (5)

| # | Screen | Figma | Mock | Impl | Notes |
|:-:|--------|:-----:|:----:|:----:|-------|
| 2-10 | Delegate List | ⬜ | ⬜ | ⬜ | |
| 2-11 | Delegate Detail | ⬜ | ⬜ | ⬜ | |
| 2-12 | Delegate Form | ⬜ | ⬜ | ⬜ | |
| 2-13 | My Delegations | ⬜ | ⬜ | ⬜ | |
| 2-14 | Undelegate | ⬜ | ⬜ | ⬜ | |

## 2.5 Rewards (4)

| # | Screen | Figma | Mock | Impl | Notes |
|:-:|--------|:-----:|:----:|:----:|-------|
| 2-15 | Rewards Dashboard | ⬜ | ⬜ | ⬜ | |
| 2-16 | Claim Rewards | ⬜ | ⬜ | ⬜ | |
| 2-17 | Rewards History | ⬜ | ⬜ | ⬜ | |
| 2-18 | Become Delegate | ⬜ | ⬜ | ⬜ | 任意登録 |

---

# System 3: Governance (16 screens)

## 3.1 Overview (2)

| # | Screen | Figma | Mock | Impl | Notes |
|:-:|--------|:-----:|:----:|:----:|-------|
| 3-1 | Governance Dashboard | ⬜ | ⬜ | ⬜ | |
| 3-2 | My Voting Power | ⬜ | ⬜ | ⬜ | |

## 3.2 Proposals (5)

| # | Screen | Figma | Mock | Impl | Notes |
|:-:|--------|:-----:|:----:|:----:|-------|
| 3-3 | Proposal List | ⬜ | ⬜ | ⬜ | フィルタ付き |
| 3-4 | Proposal Detail | ⬜ | ⬜ | ⬜ | |
| 3-5 | Vote Form | ⬜ | ⬜ | ⬜ | For/Against/Abstain |
| 3-6 | Vote Success | ⬜ | ⬜ | ⬜ | |
| 3-7 | Discussion | ⬜ | ⬜ | ⬜ | Forum連携 |

## 3.3 Proposal Create (4)

| # | Screen | Figma | Mock | Impl | Notes |
|:-:|--------|:-----:|:----:|:----:|-------|
| 3-8 | Create Step 1 | ⬜ | ⬜ | ⬜ | 基本情報 |
| 3-9 | Create Step 2 | ⬜ | ⬜ | ⬜ | アクション定義 |
| 3-10 | Create Step 3 | ⬜ | ⬜ | ⬜ | プレビュー |
| 3-11 | Submit Proposal | ⬜ | ⬜ | ⬜ | |

## 3.4 My Activity (2)

| # | Screen | Figma | Mock | Impl | Notes |
|:-:|--------|:-----:|:----:|:----:|-------|
| 3-12 | My Votes | ⬜ | ⬜ | ⬜ | |
| 3-13 | My Proposals | ⬜ | ⬜ | ⬜ | |

## 3.5 Council Pages (3)

| # | Screen | Figma | Mock | Impl | Notes |
|:-:|--------|:-----:|:----:|:----:|-------|
| 3-14 | Council Dashboard | ⬜ | ⬜ | ⬜ | |
| 3-15 | Emergency Actions | ⬜ | ⬜ | ⬜ | |
| 3-16 | Veto Management | ⬜ | ⬜ | ⬜ | |

---

# System 4: Prover Portal (28 screens)

## 4.1 Public (5)

| # | Screen | Figma | Mock | Impl | Notes |
|:-:|--------|:-----:|:----:|:----:|-------|
| 4-1 | Prover Program LP | ⬜ | ⬜ | ⬜ | |
| 4-2 | Requirements | ⬜ | ⬜ | ⬜ | |
| 4-3 | Economics | ⬜ | ⬜ | ⬜ | |
| 4-4 | Risk Calculator | ⬜ | ⬜ | ⬜ | Slashingリスク |
| 4-5 | ROI Simulator | ⬜ | ⬜ | ⬜ | |

## 4.2 Registration (7)

| # | Screen | Figma | Mock | Impl | Notes |
|:-:|--------|:-----:|:----:|:----:|-------|
| 4-6 | Application Step 1 | ⬜ | ⬜ | ⬜ | 企業情報 |
| 4-7 | Application Step 2 | ⬜ | ⬜ | ⬜ | 技術要件 |
| 4-8 | Application Step 3 | ⬜ | ⬜ | ⬜ | インフラ情報 |
| 4-9 | Application Step 4 | ⬜ | ⬜ | ⬜ | Stake確認 |
| 4-10 | Application Submitted | ⬜ | ⬜ | ⬜ | |
| 4-11 | Application Status | ⬜ | ⬜ | ⬜ | |
| 4-12 | Additional Questions | ⬜ | ⬜ | ⬜ | |

## 4.3 Activation (4)

| # | Screen | Figma | Mock | Impl | Notes |
|:-:|--------|:-----:|:----:|:----:|-------|
| 4-13 | Approval Notification | ⬜ | ⬜ | ⬜ | |
| 4-14 | Stake Deposit | ⬜ | ⬜ | ⬜ | |
| 4-15 | SPHINCS+ Key Setup | ⬜ | ⬜ | ⬜ | |
| 4-16 | Activation Complete | ⬜ | ⬜ | ⬜ | |

## 4.4 Operations (9)

| # | Screen | Figma | Mock | Impl | Notes |
|:-:|--------|:-----:|:----:|:----:|-------|
| 4-17 | Prover Dashboard | ⬜ | ⬜ | ⬜ | |
| 4-18 | Signature Queue | ⬜ | ⬜ | ⬜ | |
| 4-19 | Signature Detail | ⬜ | ⬜ | ⬜ | |
| 4-20 | Performance Metrics | ⬜ | ⬜ | ⬜ | |
| 4-21 | Rewards Dashboard | ⬜ | ⬜ | ⬜ | |
| 4-22 | Rewards Claim | ⬜ | ⬜ | ⬜ | |
| 4-23 | Stake Management | ⬜ | ⬜ | ⬜ | |
| 4-24 | Stake Add/Withdraw | ⬜ | ⬜ | ⬜ | |
| 4-25 | Alerts | ⬜ | ⬜ | ⬜ | |

## 4.5 Challenge & Exit (3)

| # | Screen | Figma | Mock | Impl | Notes |
|:-:|--------|:-----:|:----:|:----:|-------|
| 4-26 | Challenge Response | ⬜ | ⬜ | ⬜ | |
| 4-27 | Exit Request | ⬜ | ⬜ | ⬜ | |
| 4-28 | Stake Returned | ⬜ | ⬜ | ⬜ | |

---

# System 5: Observer/Challenger (10 screens)

| # | Screen | Figma | Mock | Impl | Notes |
|:-:|--------|:-----:|:----:|:----:|-------|
| 5-1 | Overview | ⬜ | ⬜ | ⬜ | |
| 5-2 | Pending Unlocks | ⬜ | ⬜ | ⬜ | |
| 5-3 | Suspicious Activity | ⬜ | ⬜ | ⬜ | |
| 5-4 | Alert History | ⬜ | ⬜ | ⬜ | |
| 5-5 | Challenge Form | ⬜ | ⬜ | ⬜ | |
| 5-6 | Challenge Confirmation | ⬜ | ⬜ | ⬜ | |
| 5-7 | Challenge Submitted | ⬜ | ⬜ | ⬜ | |
| 5-8 | Challenge Progress | ⬜ | ⬜ | ⬜ | |
| 5-9 | Challenge Result | ⬜ | ⬜ | ⬜ | |
| 5-10 | Claim Rewards | ⬜ | ⬜ | ⬜ | |

---

# System 6: Explorer (14 screens)

| # | Screen | Figma | Mock | Impl | Notes |
|:-:|--------|:-----:|:----:|:----:|-------|
| 6-1 | Explorer Home | ⬜ | ⬜ | ⬜ | |
| 6-2 | Search | ⬜ | ⬜ | ⬜ | |
| 6-3 | Lock List | ⬜ | ⬜ | ⬜ | |
| 6-4 | Unlock List | ⬜ | ⬜ | ⬜ | |
| 6-5 | Challenge List | ⬜ | ⬜ | ⬜ | |
| 6-6 | Lock Detail | ⬜ | ⬜ | ⬜ | |
| 6-7 | Unlock Detail | ⬜ | ⬜ | ⬜ | |
| 6-8 | Challenge Detail | ⬜ | ⬜ | ⬜ | |
| 6-9 | Address Detail | ⬜ | ⬜ | ⬜ | |
| 6-10 | Prover List | ⬜ | ⬜ | ⬜ | |
| 6-11 | Prover Detail | ⬜ | ⬜ | ⬜ | |
| 6-12 | TVL Chart | ⬜ | ⬜ | ⬜ | |
| 6-13 | Volume Chart | ⬜ | ⬜ | ⬜ | |
| 6-14 | Prover Ranking | ⬜ | ⬜ | ⬜ | |

---

# System 7: Enterprise Admin (25 screens)

## 7.1 Dashboard (1)

| # | Screen | Figma | Mock | Impl | Notes |
|:-:|--------|:-----:|:----:|:----:|-------|
| 7-1 | Enterprise Dashboard | ⬜ | ⬜ | ⬜ | |

## 7.2 Transactions (4)

| # | Screen | Figma | Mock | Impl | Notes |
|:-:|--------|:-----:|:----:|:----:|-------|
| 7-2 | Transaction List | ⬜ | ⬜ | ⬜ | |
| 7-3 | Transaction Detail | ⬜ | ⬜ | ⬜ | |
| 7-4 | Transaction Export | ⬜ | ⬜ | ⬜ | |
| 7-5 | Transaction Analytics | ⬜ | ⬜ | ⬜ | |

## 7.3 User Management (5)

| # | Screen | Figma | Mock | Impl | Notes |
|:-:|--------|:-----:|:----:|:----:|-------|
| 7-6 | User List | ⬜ | ⬜ | ⬜ | |
| 7-7 | User Detail | ⬜ | ⬜ | ⬜ | |
| 7-8 | User Create | ⬜ | ⬜ | ⬜ | |
| 7-9 | Role Management | ⬜ | ⬜ | ⬜ | |
| 7-10 | Invite User | ⬜ | ⬜ | ⬜ | |

## 7.4 API Management (4)

| # | Screen | Figma | Mock | Impl | Notes |
|:-:|--------|:-----:|:----:|:----:|-------|
| 7-11 | API Keys | ⬜ | ⬜ | ⬜ | |
| 7-12 | API Key Create | ⬜ | ⬜ | ⬜ | |
| 7-13 | API Usage | ⬜ | ⬜ | ⬜ | |
| 7-14 | Webhook Settings | ⬜ | ⬜ | ⬜ | |

## 7.5 Settings (4)

| # | Screen | Figma | Mock | Impl | Notes |
|:-:|--------|:-----:|:----:|:----:|-------|
| 7-15 | Organization Settings | ⬜ | ⬜ | ⬜ | |
| 7-16 | Security Settings | ⬜ | ⬜ | ⬜ | |
| 7-17 | Notification Settings | ⬜ | ⬜ | ⬜ | |
| 7-18 | Limit Settings | ⬜ | ⬜ | ⬜ | |

## 7.6 Reports (3)

| # | Screen | Figma | Mock | Impl | Notes |
|:-:|--------|:-----:|:----:|:----:|-------|
| 7-19 | Monthly Report | ⬜ | ⬜ | ⬜ | |
| 7-20 | Compliance Report | ⬜ | ⬜ | ⬜ | |
| 7-21 | Audit Trail | ⬜ | ⬜ | ⬜ | |

## 7.7 Contract & Support (4)

| # | Screen | Figma | Mock | Impl | Notes |
|:-:|--------|:-----:|:----:|:----:|-------|
| 7-22 | Contract Detail | ⬜ | ⬜ | ⬜ | |
| 7-23 | Billing History | ⬜ | ⬜ | ⬜ | |
| 7-24 | Support Tickets | ⬜ | ⬜ | ⬜ | |
| 7-25 | Create Ticket | ⬜ | ⬜ | ⬜ | |

---

# System 8: QS Admin (40 screens)

## 8.1 Dashboard (1)

| # | Screen | Figma | Mock | Impl | Notes |
|:-:|--------|:-----:|:----:|:----:|-------|
| 8-1 | System Overview | ⬜ | ⬜ | ⬜ | |

## 8.2 Edition Management (4)

| # | Screen | Figma | Mock | Impl | Notes |
|:-:|--------|:-----:|:----:|:----:|-------|
| 8-2 | Current Mode | ⬜ | ⬜ | ⬜ | |
| 8-3 | Mode Switch | ⬜ | ⬜ | ⬜ | |
| 8-4 | Edition Settings | ⬜ | ⬜ | ⬜ | |
| 8-5 | Switch History | ⬜ | ⬜ | ⬜ | |

## 8.3 L3 Node Management (4)

| # | Screen | Figma | Mock | Impl | Notes |
|:-:|--------|:-----:|:----:|:----:|-------|
| 8-6 | Node List | ⬜ | ⬜ | ⬜ | |
| 8-7 | Node Detail | ⬜ | ⬜ | ⬜ | |
| 8-8 | Node Add/Remove | ⬜ | ⬜ | ⬜ | |
| 8-9 | Node Config | ⬜ | ⬜ | ⬜ | |

## 8.4 Prover Management (6)

| # | Screen | Figma | Mock | Impl | Notes |
|:-:|--------|:-----:|:----:|:----:|-------|
| 8-10 | Prover List | ⬜ | ⬜ | ⬜ | |
| 8-11 | Prover Detail | ⬜ | ⬜ | ⬜ | |
| 8-12 | Application Queue | ⬜ | ⬜ | ⬜ | |
| 8-13 | Application Review | ⬜ | ⬜ | ⬜ | |
| 8-14 | Prover Suspend | ⬜ | ⬜ | ⬜ | |
| 8-15 | Prover Performance | ⬜ | ⬜ | ⬜ | |

## 8.5 Transaction Monitor (5)

| # | Screen | Figma | Mock | Impl | Notes |
|:-:|--------|:-----:|:----:|:----:|-------|
| 8-16 | Lock Monitor | ⬜ | ⬜ | ⬜ | |
| 8-17 | Unlock Monitor | ⬜ | ⬜ | ⬜ | |
| 8-18 | Challenge Monitor | ⬜ | ⬜ | ⬜ | |
| 8-19 | Slashing Events | ⬜ | ⬜ | ⬜ | |
| 8-20 | Anomaly Detection | ⬜ | ⬜ | ⬜ | |

## 8.6 Emergency (4)

| # | Screen | Figma | Mock | Impl | Notes |
|:-:|--------|:-----:|:----:|:----:|-------|
| 8-21 | Emergency Dashboard | ⬜ | ⬜ | ⬜ | |
| 8-22 | Pause Control | ⬜ | ⬜ | ⬜ | |
| 8-23 | Pause History | ⬜ | ⬜ | ⬜ | |
| 8-24 | Recovery Procedures | ⬜ | ⬜ | ⬜ | |

## 8.7 Parameters (4)

| # | Screen | Figma | Mock | Impl | Notes |
|:-:|--------|:-----:|:----:|:----:|-------|
| 8-25 | Time Lock Config | ⬜ | ⬜ | ⬜ | |
| 8-26 | Emergency Bond Config | ⬜ | ⬜ | ⬜ | |
| 8-27 | Slashing Config | ⬜ | ⬜ | ⬜ | |
| 8-28 | Fee Config | ⬜ | ⬜ | ⬜ | |

## 8.8 Enterprise Customers (5)

| # | Screen | Figma | Mock | Impl | Notes |
|:-:|--------|:-----:|:----:|:----:|-------|
| 8-29 | Customer List | ⬜ | ⬜ | ⬜ | |
| 8-30 | Customer Detail | ⬜ | ⬜ | ⬜ | |
| 8-31 | Contract Management | ⬜ | ⬜ | ⬜ | |
| 8-32 | Billing Management | ⬜ | ⬜ | ⬜ | |
| 8-33 | Service Control | ⬜ | ⬜ | ⬜ | |

## 8.9 Community (4)

| # | Screen | Figma | Mock | Impl | Notes |
|:-:|--------|:-----:|:----:|:----:|-------|
| 8-34 | Delegate List | ⬜ | ⬜ | ⬜ | |
| 8-35 | Proposal Overview | ⬜ | ⬜ | ⬜ | |
| 8-36 | Council Members | ⬜ | ⬜ | ⬜ | |
| 8-37 | Treasury Status | ⬜ | ⬜ | ⬜ | |

## 8.10 Reports & Audit (3)

| # | Screen | Figma | Mock | Impl | Notes |
|:-:|--------|:-----:|:----:|:----:|-------|
| 8-38 | Reports Dashboard | ⬜ | ⬜ | ⬜ | Daily/Weekly/Monthly |
| 8-39 | Revenue Analytics | ⬜ | ⬜ | ⬜ | |
| 8-40 | Audit Log | ⬜ | ⬜ | ⬜ | |

---

# Changelog

| Date | Screen | Phase | Change |
|------|--------|-------|--------|
| 2026-01-06 | - | - | Initial tracker created |

---

**END OF TRACKER**
