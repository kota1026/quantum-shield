# 📐 Phase 4 UI 統合計画 v2.0
## 画面イメージ統合 × 全プレイヤージャーニー × データ設計

> **Version**: 2.0  
> **Date**: 2026-01-05  
> **目的**: 既存仕様書・ジャーニー・コードを統合した実装計画  
> **更新内容**: 全プレイヤージャーニー追加、認知・理解フェーズ追加、権限設計追加、データ設計再検討、スマホ対応

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

# Part 2: 全プレイヤー ジャーニーマップ

## 2.1 プレイヤー一覧と登録/退会の有無

| # | プレイヤー | 登録 | 退会 | 認証方式 | 備考 |
|---|-----------|:----:|:----:|----------|------|
| 1 | End User | ✅ | ✅ | Wallet (SIWE) | Dilithium鍵登録 |
| 2 | Token Holder | - | - | Wallet | End Userが自動的になる |
| 3 | Prover | ✅ | ✅ | Wallet + HSM証明 | 審査あり |
| 4 | Observer | ✅ | ✅ | Wallet + Stake | Permissionless |
| 5 | Challenger | - | - | Wallet | Observerが行動するとなる |
| 6 | Delegate | ✅ | ✅ | Wallet | Permissionless登録 |
| 7 | Proposer | - | - | Wallet + veQS閾値 | veQS保有で自動資格 |
| 8 | Security Council | ✅ | ✅ | Wallet + 選出/任命 | Token Vote or 財団任命 |
| 9 | Purpose Committee | ✅ | ✅ | Wallet + 選出/任命 | Token Vote or 財団任命 |
| 10 | Service Provider | ✅ | ✅ | Email + Password + 2FA | 契約ベース |
| 11 | QS Staff | ✅ | ✅ | Email + Password + 2FA | 財団メンバー |

---

## 2.2 【1】Consumer App（End User）

### ジャーニー概要

```
認知 → 理解 → 登録 → 初回Lock → Unlock → 継続利用 → 退会
```

### 詳細画面（25画面）

| Phase | 画面名 | 目的 | 📱 | 優先度 |
|-------|--------|------|:--:|:------:|
| **認知** | Landing Page | QSの価値を伝える | ✅ | P0 |
| **理解** | How It Works | 仕組みを図解で説明 | ✅ | P0 |
| **理解** | Security Explainer | セキュリティ詳細 | ✅ | P1 |
| **理解** | FAQ | よくある質問 | ✅ | P1 |
| **登録** | Wallet Connect | ウォレット接続 | ✅ | P0 |
| **登録** | Key Generation | Dilithium鍵生成 | ✅ | P0 |
| **登録** | Backup Instructions | 鍵バックアップ手順 | ✅ | P0 |
| **登録** | Registration Complete | 登録完了 | ✅ | P0 |
| **利用** | Dashboard | 資産概要 | ✅ | P0 |
| **利用** | Lock Input | Lock金額入力 | ✅ | P0 |
| **利用** | Lock Confirm | Lock確認 | ✅ | P0 |
| **利用** | Lock Processing | Lock処理中 | ✅ | P0 |
| **利用** | Lock Success | Lock完了 | ✅ | P0 |
| **利用** | Unlock Select | Unlock対象選択 | ✅ | P0 |
| **利用** | Unlock Method | 通常/緊急選択 | ✅ | P0 |
| **利用** | Dilithium Sign | Dilithium署名 | ✅ | P0 |
| **利用** | Prover Waiting | Prover署名待ち | ✅ | P0 |
| **利用** | Time Lock Countdown | 24h待機 | ✅ | P0 |
| **利用** | Unlock Ready | 実行可能 | ✅ | P0 |
| **利用** | Unlock Complete | 完了 | ✅ | P0 |
| **利用** | Emergency Bond | 緊急Bond支払い | ✅ | P1 |
| **継続** | History | 履歴一覧 | ✅ | P1 |
| **継続** | Settings | 設定 | ✅ | P1 |
| **継続** | Key Management | 鍵管理 | ✅ | P1 |
| **退会** | Account Disconnect | 退会確認・実行 | ✅ | P2 |

---

## 2.3 【2】Token Hub（veQSホルダー）

### ジャーニー概要

```
認知 → 理解 → 登録(=veQS Lock) → 投票参加 → Delegation → 報酬管理 → 退会(=veQS Unlock)
```

### ペルソナ：鈴木さん（28歳、DeFiユーザー）

```
┌─────────────────────────────────────────────────────────────┐
│                        鈴木さん                              │
├─────────────────────────────────────────────────────────────┤
│  背景:                                                      │
│  • QSを利用中のEnd User                                     │
│  • 他のDAOにも参加経験あり                                  │
│  • 「QSのガバナンスに参加したい」                           │
│                                                             │
│  関心:                                                      │
│  • 投票に参加して報酬を得たい                               │
│  • 信頼できるDelegateに委任したい                           │
│  • プロトコルの方向性に意見したい                           │
└─────────────────────────────────────────────────────────────┘
```

### 詳細画面（22画面）

| Phase | 画面名 | 目的 | 📱 | 優先度 |
|-------|--------|------|:--:|:------:|
| **認知** | Token Hub LP | veQSの価値を伝える | ✅ | P0 |
| **理解** | veQS Explainer | veQS仕組み解説 | ✅ | P0 |
| **理解** | Voting Power Calculator | 投票力計算ツール | ✅ | P1 |
| **理解** | Rewards Explainer | 報酬仕組み解説 | ✅ | P1 |
| **理解** | FAQ | よくある質問 | ✅ | P1 |
| **登録** | veQS Lock Form | ロック金額・期間入力 | ✅ | P0 |
| **登録** | veQS Lock Preview | プレビュー | ✅ | P0 |
| **登録** | veQS Lock Confirm | 確認・署名 | ✅ | P0 |
| **登録** | veQS Lock Success | 完了 | ✅ | P0 |
| **利用** | Token Dashboard | veQS概要 | ✅ | P0 |
| **利用** | Voting Power Chart | 投票力減衰グラフ | ✅ | P1 |
| **利用** | Delegate List | Delegate一覧 | ✅ | P0 |
| **利用** | Delegate Detail | Delegate詳細 | ✅ | P0 |
| **利用** | Delegate Form | 委任実行 | ✅ | P0 |
| **利用** | My Delegations | 委任中一覧 | ✅ | P1 |
| **利用** | Become Delegate | Delegate登録 | ✅ | P1 |
| **利用** | Rewards Dashboard | 報酬ダッシュボード | ✅ | P0 |
| **利用** | Claim Rewards | 報酬請求 | ✅ | P0 |
| **管理** | Extend Lock | ロック期間延長 | ✅ | P1 |
| **退会** | Early Unlock | 早期解除（ペナルティ計算） | ✅ | P1 |
| **退会** | Normal Unlock | 満了時解除 | ✅ | P1 |
| **退会** | Unlock Complete | 完了 | ✅ | P1 |

---

## 2.4 【3】Governance（投票・提案）

### ジャーニー概要

```
認知 → 理解 → 提案閲覧 → 投票参加 → 提案作成(Proposer) → Council活動(Council)
```

### ペルソナ：高橋さん（35歳、コミュニティリーダー）

```
┌─────────────────────────────────────────────────────────────┐
│                        高橋さん                              │
├─────────────────────────────────────────────────────────────┤
│  背景:                                                      │
│  • QS大口veQSホルダー                                       │
│  • 他のDAOでもアクティブに提案・投票                        │
│  • プロトコル改善のアイデアがある                           │
│                                                             │
│  関心:                                                      │
│  • Time Lock期間の最適化提案                                │
│  • 手数料モデルの改善提案                                   │
│  • 自分の提案が可決されること                               │
└─────────────────────────────────────────────────────────────┘
```

### 詳細画面（20画面）

| Phase | 画面名 | 目的 | 📱 | 優先度 |
|-------|--------|------|:--:|:------:|
| **認知** | Governance LP | ガバナンスの価値説明 | ✅ | P0 |
| **理解** | Governance Explainer | 仕組み解説 | ✅ | P0 |
| **理解** | Proposal Types | 提案種類と閾値説明 | ✅ | P1 |
| **理解** | Council Explainer | Council役割説明 | ✅ | P1 |
| **理解** | FAQ | よくある質問 | ✅ | P1 |
| **利用** | Governance Dashboard | 概要、アクティブ提案 | ✅ | P0 |
| **利用** | Proposal List | 提案一覧（フィルタ付き） | ✅ | P0 |
| **利用** | Proposal Detail | 提案詳細 | ✅ | P0 |
| **利用** | Vote Form | 投票（For/Against/Abstain） | ✅ | P0 |
| **利用** | Vote Success | 投票完了 | ✅ | P0 |
| **利用** | My Votes | 投票履歴 | ✅ | P1 |
| **提案** | Proposal Create Step1 | 基本情報 | ✅ | P1 |
| **提案** | Proposal Create Step2 | アクション定義 | ✅ | P1 |
| **提案** | Proposal Create Step3 | プレビュー | ✅ | P1 |
| **提案** | Proposal Submit | 提出 | ✅ | P1 |
| **提案** | My Proposals | 作成した提案 | ✅ | P1 |
| **Council** | Council Dashboard | Council専用ダッシュボード | 🖥️ | P2 |
| **Council** | Emergency Actions | 緊急アクション | 🖥️ | P2 |
| **Council** | Veto Management | Veto管理 | 🖥️ | P2 |
| **Council** | Council Voting | Council内投票 | 🖥️ | P2 |

---

## 2.5 【4】Prover Portal

### ジャーニー概要

```
認知 → 理解・評価 → 申請 → 審査 → Stake → 稼働 → 運用 → 退出
```

### 詳細画面（32画面）

| Phase | 画面名 | 目的 | 📱 | 優先度 |
|-------|--------|------|:--:|:------:|
| **認知** | Prover Program LP | プログラム説明 | ✅ | P0 |
| **理解** | How Prover Works | Prover仕組み解説 | ✅ | P0 |
| **理解** | Economics Explainer | 経済モデル説明 | ✅ | P0 |
| **理解** | Requirements Detail | 要件一覧 | ✅ | P0 |
| **理解** | Risk Calculator | Slashingリスク計算 | ✅ | P1 |
| **理解** | ROI Simulator | 収益シミュレーター | ✅ | P1 |
| **理解** | FAQ | よくある質問 | ✅ | P1 |
| **申請** | Application Step1 | 企業情報 | 🖥️ | P0 |
| **申請** | Application Step2 | 技術要件証明 | 🖥️ | P0 |
| **申請** | Application Step3 | インフラ情報 | 🖥️ | P0 |
| **申請** | Application Step4 | Stake準備確認 | 🖥️ | P0 |
| **申請** | Application Submitted | 申請完了 | 🖥️ | P0 |
| **審査** | Application Status | 審査状況 | ✅ | P0 |
| **審査** | Additional Questions | 追加質問対応 | ✅ | P0 |
| **参加** | Approval Notification | 承認通知 | ✅ | P0 |
| **参加** | Stake Deposit | Stake入金 | ✅ | P0 |
| **参加** | SPHINCS+ Key Setup | 鍵設定 | ✅ | P0 |
| **参加** | Activation Complete | 稼働開始 | ✅ | P0 |
| **運用** | Prover Dashboard | メインダッシュボード | ✅ | P0 |
| **運用** | Signature Queue | 署名キュー | ✅ | P0 |
| **運用** | Signature Detail | 署名要求詳細 | ✅ | P0 |
| **運用** | Performance Metrics | パフォーマンス指標 | ✅ | P1 |
| **運用** | Rewards Dashboard | 報酬管理 | ✅ | P0 |
| **運用** | Rewards Claim | 報酬請求 | ✅ | P0 |
| **運用** | Stake Management | Stake管理 | ✅ | P0 |
| **運用** | Stake Add | Stake追加 | ✅ | P1 |
| **運用** | Alerts | アラート一覧 | ✅ | P0 |
| **Challenge** | Challenge Notification | Challenge通知 | ✅ | P0 |
| **Challenge** | Defense Submission | Defense提出 | ✅ | P0 |
| **Challenge** | Challenge Result | 結果確認 | ✅ | P0 |
| **退出** | Exit Request | 退出申請 | ✅ | P1 |
| **退出** | Unbonding Progress | Unbonding進捗 | ✅ | P1 |

---

## 2.6 【5】Observer/Challenger Portal

### ジャーニー概要

```
認知 → 理解 → 登録(Stake) → 監視 → Challenge提起 → 報酬獲得 → 退出
```

### ペルソナ：中村さん（40歳、セキュリティリサーチャー）

```
┌─────────────────────────────────────────────────────────────┐
│                        中村さん                              │
├─────────────────────────────────────────────────────────────┤
│  背景:                                                      │
│  • ブロックチェーンセキュリティの専門家                     │
│  • バグバウンティ経験あり                                   │
│  • 「不正を検知して報酬を得たい」                           │
│                                                             │
│  関心:                                                      │
│  • 異常なUnlockを検知してChallenge                         │
│  • Challenge成功時の報酬                                    │
│  • 必要Stake額と報酬の見合い                                │
└─────────────────────────────────────────────────────────────┘
```

### 詳細画面（16画面）

| Phase | 画面名 | 目的 | 📱 | 優先度 |
|-------|--------|------|:--:|:------:|
| **認知** | Observer Program LP | プログラム説明 | ✅ | P1 |
| **理解** | How Observer Works | 仕組み解説 | ✅ | P1 |
| **理解** | Challenge Explainer | Challenge仕組み説明 | ✅ | P1 |
| **理解** | Reward Calculator | 報酬計算ツール | ✅ | P1 |
| **理解** | FAQ | よくある質問 | ✅ | P2 |
| **登録** | Stake Deposit | Stake入金 | ✅ | P1 |
| **登録** | Registration Complete | 登録完了 | ✅ | P1 |
| **利用** | Observer Dashboard | 監視ダッシュボード | ✅ | P1 |
| **利用** | Pending Unlocks | 進行中Unlock一覧 | ✅ | P1 |
| **利用** | Suspicious Activity | 疑わしいアクティビティ | ✅ | P1 |
| **利用** | Challenge Form | Challenge提起 | ✅ | P1 |
| **利用** | Challenge Progress | 進捗追跡 | ✅ | P1 |
| **利用** | Challenge Result | 結果（Reward/Fail） | ✅ | P1 |
| **利用** | My Challenges | Challenge履歴 | ✅ | P2 |
| **利用** | Claim Rewards | 報酬請求 | ✅ | P1 |
| **退出** | Stake Withdraw | Stake引出し | ✅ | P2 |

---

## 2.7 【6】Explorer（公開閲覧）

### ジャーニー概要

```
認知 → 探索 → 詳細確認 → 分析
```

### 詳細画面（14画面）

| Phase | 画面名 | 目的 | 📱 | 優先度 |
|-------|--------|------|:--:|:------:|
| **認知** | Explorer Home | 全体統計・概要 | ✅ | P0 |
| **探索** | Search | 検索 | ✅ | P0 |
| **探索** | Lock List | Lock一覧 | ✅ | P0 |
| **探索** | Unlock List | Unlock一覧 | ✅ | P0 |
| **探索** | Challenge List | Challenge一覧 | ✅ | P1 |
| **詳細** | Lock Detail | Lock詳細 | ✅ | P0 |
| **詳細** | Unlock Detail | Unlock詳細 | ✅ | P0 |
| **詳細** | Challenge Detail | Challenge詳細 | ✅ | P1 |
| **詳細** | Address Detail | アドレス詳細 | ✅ | P1 |
| **分析** | Prover List | Prover一覧 | ✅ | P1 |
| **分析** | Prover Detail | Prover詳細 | ✅ | P1 |
| **分析** | TVL Chart | TVL推移 | ✅ | P1 |
| **分析** | Volume Chart | 取引量推移 | ✅ | P1 |
| **分析** | Prover Ranking | Proverランキング | ✅ | P2 |

---

## 2.8 【7】Enterprise Admin Portal

### ジャーニー概要

```
認知 → 理解 → 問い合わせ → 契約 → オンボーディング → 運用 → 解約
```

### ペルソナ：佐藤さん（38歳、取引所CTO）

```
┌─────────────────────────────────────────────────────────────┐
│                        佐藤さん                              │
├─────────────────────────────────────────────────────────────┤
│  背景:                                                      │
│  • 中規模暗号資産取引所のCTO                                │
│  • 複数チェーン対応を検討中                                 │
│  • 規制当局から将来のセキュリティ対策への問い合わせ         │
│                                                             │
│  ニーズ:                                                    │
│  • 安全なクロスチェーンブリッジ                             │
│  • 規制対応の証跡                                           │
│  • SLAと専用サポート                                        │
└─────────────────────────────────────────────────────────────┘
```

### ログイン・権限設計

```
┌─────────────────────────────────────────────────────────────┐
│                    Enterprise 権限構造                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐                                            │
│  │Organization │ ← 契約単位（1社=1組織）                    │
│  └──────┬──────┘                                            │
│         │                                                   │
│  ┌──────┴──────────────────────────────────────┐            │
│  │                 Roles                        │            │
│  ├──────────────────────────────────────────────┤            │
│  │                                              │            │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐      │            │
│  │  │  Owner  │  │  Admin  │  │ Operator│      │            │
│  │  └────┬────┘  └────┬────┘  └────┬────┘      │            │
│  │       │            │            │           │            │
│  │  全権限        設定変更       閲覧+操作     │            │
│  │  ユーザー管理   API管理       TX確認        │            │
│  │  請求確認       レポート      レポート      │            │
│  │                                              │            │
│  │  ┌─────────┐  ┌─────────┐                   │            │
│  │  │Developer│  │ Viewer  │                   │            │
│  │  └────┬────┘  └────┬────┘                   │            │
│  │       │            │                        │            │
│  │  API利用        閲覧のみ                    │            │
│  │  テスト環境                                  │            │
│  │                                              │            │
│  └──────────────────────────────────────────────┘            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 詳細画面（35画面）

| Phase | 画面名 | 目的 | 📱 | 優先度 |
|-------|--------|------|:--:|:------:|
| **認知** | Enterprise LP | Enterpriseソリューション紹介 | ✅ | P0 |
| **理解** | Solution Overview | ソリューション概要 | ✅ | P0 |
| **理解** | Use Cases | ユースケース紹介 | ✅ | P1 |
| **理解** | Pricing | 価格説明 ⚠️ | ✅ | P1 |
| **理解** | FAQ | よくある質問 | ✅ | P1 |
| **問い合わせ** | Contact Form | 問い合わせフォーム | ✅ | P0 |
| **問い合わせ** | Contact Confirmation | 送信完了 | ✅ | P0 |
| **認証** | Login | ログイン | ✅ | P0 |
| **認証** | 2FA Setup | 2FA設定 | ✅ | P0 |
| **認証** | Password Reset | パスワードリセット | ✅ | P0 |
| **オンボーディング** | Welcome | ようこそ画面 | 🖥️ | P0 |
| **オンボーディング** | Getting Started | はじめ方ガイド | 🖥️ | P0 |
| **オンボーディング** | API Quick Start | API設定ガイド | 🖥️ | P0 |
| **運用** | Dashboard | メインダッシュボード | ✅ | P0 |
| **運用** | Transaction List | TX一覧 | ✅ | P0 |
| **運用** | Transaction Detail | TX詳細 | ✅ | P0 |
| **運用** | Transaction Export | エクスポート | 🖥️ | P1 |
| **運用** | Analytics | 分析 | 🖥️ | P1 |
| **管理** | User List | ユーザー一覧 | 🖥️ | P0 |
| **管理** | User Detail | ユーザー詳細 | 🖥️ | P0 |
| **管理** | User Invite | ユーザー招待 | 🖥️ | P0 |
| **管理** | Role Management | 権限管理 | 🖥️ | P0 |
| **API** | API Keys | APIキー一覧 | 🖥️ | P0 |
| **API** | API Key Create | キー発行 | 🖥️ | P0 |
| **API** | API Usage | 使用量 | 🖥️ | P1 |
| **API** | Webhook Settings | Webhook設定 | 🖥️ | P1 |
| **設定** | Organization Settings | 組織設定 | 🖥️ | P1 |
| **設定** | Security Settings | セキュリティ設定 | 🖥️ | P0 |
| **設定** | Notification Settings | 通知設定 | 🖥️ | P1 |
| **契約** | Contract Detail | 契約詳細 ⚠️ | 🖥️ | P1 |
| **契約** | Billing History | 請求履歴 ⚠️ | 🖥️ | P1 |
| **サポート** | Support Tickets | チケット一覧 | ✅ | P1 |
| **サポート** | Create Ticket | チケット作成 | ✅ | P1 |
| **サポート** | Documentation | ドキュメント | ✅ | P0 |
| **退会** | Cancel Contract | 契約解除 ⚠️ | 🖥️ | P2 |

⚠️ = 経済条件確定後に詳細化

---

## 2.9 【8】QS Admin（QS財団）

### ジャーニー概要

```
入社オンボーディング → 権限取得 → 日常運用 → 緊急対応 → 退社
```

### ペルソナ：新入社員・加藤さん（26歳、新卒エンジニア）

```
┌─────────────────────────────────────────────────────────────┐
│                        加藤さん                              │
├─────────────────────────────────────────────────────────────┤
│  背景:                                                      │
│  • QS財団に新卒入社                                         │
│  • ブロックチェーン基礎知識あり                             │
│  • QSの仕組みをこれから学ぶ                                 │
│                                                             │
│  ニーズ:                                                    │
│  • QSの全体像を理解したい                                   │
│  • 自分の担当領域を把握したい                               │
│  • 緊急時の対応手順を知りたい                               │
└─────────────────────────────────────────────────────────────┘
```

### ログイン・権限設計

```
┌─────────────────────────────────────────────────────────────┐
│                    QS Admin 権限構造                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────────────────────────┐           │
│  │                    Roles                      │           │
│  ├──────────────────────────────────────────────┤           │
│  │                                              │           │
│  │  ┌──────────────┐  ┌──────────────┐          │           │
│  │  │ Super Admin  │  │    Admin     │          │           │
│  │  │   (Kota)     │  │              │          │           │
│  │  └──────┬───────┘  └──────┬───────┘          │           │
│  │         │                 │                   │           │
│  │  全権限            Pause実行               │           │
│  │  権限付与          Prover管理               │           │
│  │  Edition切替       Parameter変更            │           │
│  │                    Customer管理             │           │
│  │                                              │           │
│  │  ┌──────────────┐  ┌──────────────┐          │           │
│  │  │   Operator   │  │   Support    │          │           │
│  │  └──────┬───────┘  └──────┬───────┘          │           │
│  │         │                 │                   │           │
│  │  TX監視            チケット対応             │           │
│  │  アラート確認      顧客対応                 │           │
│  │  レポート生成                                │           │
│  │                                              │           │
│  │  ┌──────────────┐                            │           │
│  │  │   Viewer     │                            │           │
│  │  └──────┬───────┘                            │           │
│  │         │                                     │           │
│  │  閲覧のみ                                    │           │
│  │  (新入社員初期)                              │           │
│  │                                              │           │
│  └──────────────────────────────────────────────┘           │
│                                                             │
│  権限付与フロー:                                             │
│  1. 入社時: Viewer権限を付与                                │
│  2. 研修完了後: 担当領域のOperator権限を付与                │
│  3. 昇進時: Admin権限を付与（Super Admin承認）              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 詳細画面（50画面）

| Phase | 画面名 | 目的 | 📱 | 優先度 |
|-------|--------|------|:--:|:------:|
| **認証** | Login | ログイン | 🖥️ | P0 |
| **認証** | 2FA Setup | 2FA設定 | 🖥️ | P0 |
| **認証** | Password Reset | パスワードリセット | 🖥️ | P0 |
| **オンボーディング** | Welcome | ようこそ画面 | 🖥️ | P0 |
| **オンボーディング** | QS Overview | QS全体像説明 | 🖥️ | P0 |
| **オンボーディング** | Core Principles | 5原則解説 | 🖥️ | P0 |
| **オンボーディング** | System Architecture | システム構成説明 | 🖥️ | P0 |
| **オンボーディング** | Your Role | 担当領域説明 | 🖥️ | P0 |
| **オンボーディング** | Emergency Procedures | 緊急対応手順 | 🖥️ | P0 |
| **オンボーディング** | Getting Started | はじめ方ガイド | 🖥️ | P0 |
| **ダッシュボード** | System Overview | システム全体状況 | 🖥️ | P0 |
| **ダッシュボード** | TVL Summary | 全TVL | 🖥️ | P0 |
| **ダッシュボード** | Active Locks/Unlocks | アクティブ数 | 🖥️ | P0 |
| **ダッシュボード** | L3 Node Status | ノード状態 | 🖥️ | P0 |
| **ダッシュボード** | Alert Summary | アラートサマリー | 🖥️ | P0 |
| **Edition** | Current Mode | 現在のエディション | 🖥️ | P0 |
| **Edition** | Mode Switch | モード切替 | 🖥️ | P0 |
| **Edition** | Edition Settings | エディション別設定 | 🖥️ | P0 |
| **Edition** | Switch History | 切替履歴 | 🖥️ | P1 |
| **L3ノード** | Node List | ノード一覧 | 🖥️ | P0 |
| **L3ノード** | Node Detail | ノード詳細 | 🖥️ | P0 |
| **L3ノード** | Node Add/Remove | ノード追加・削除 | 🖥️ | P2 |
| **L3ノード** | Node Config | ノード設定 | 🖥️ | P1 |
| **Prover管理** | Prover List | Prover一覧 | 🖥️ | P0 |
| **Prover管理** | Prover Detail | Prover詳細 | 🖥️ | P0 |
| **Prover管理** | Application Queue | 申請キュー | 🖥️ | P0 |
| **Prover管理** | Application Review | 申請審査 | 🖥️ | P0 |
| **Prover管理** | Prover Suspend | Prover停止 | 🖥️ | P0 |
| **Prover管理** | Prover Performance | パフォーマンス | 🖥️ | P1 |
| **TX監視** | Lock Monitor | Lock監視 | 🖥️ | P0 |
| **TX監視** | Unlock Monitor | Unlock監視 | 🖥️ | P0 |
| **TX監視** | Challenge Monitor | Challenge監視 | 🖥️ | P0 |
| **TX監視** | Slashing Events | Slashingイベント | 🖥️ | P0 |
| **TX監視** | Anomaly Detection | 異常検知 | 🖥️ | P0 |
| **緊急対応** | Emergency Dashboard | 緊急対応ダッシュボード | 🖥️ | P0 |
| **緊急対応** | Pause Control | Pause実行 | 🖥️ | P0 |
| **緊急対応** | Pause History | Pause履歴 | 🖥️ | P0 |
| **緊急対応** | Recovery Procedures | 復旧手順 | 🖥️ | P0 |
| **パラメータ** | Time Lock Config | Time Lock設定 | 🖥️ | P1 |
| **パラメータ** | Emergency Bond Config | Bond設定 | 🖥️ | P1 |
| **パラメータ** | Slashing Config | Slashing設定 | 🖥️ | P1 |
| **パラメータ** | Fee Config | 手数料設定 | 🖥️ | P1 |
| **Enterprise顧客** | Customer List | 顧客一覧 | 🖥️ | P1 |
| **Enterprise顧客** | Customer Detail | 顧客詳細 | 🖥️ | P1 |
| **Enterprise顧客** | Service Control | サービス制御 | 🖥️ | P1 |
| **Community** | Delegate Overview | Delegate一覧 | 🖥️ | P2 |
| **Community** | Council Members | Council一覧 | 🖥️ | P2 |
| **レポート** | Report Generator | レポート生成 | 🖥️ | P1 |
| **監査** | Audit Log | 監査ログ | 🖥️ | P0 |
| **スタッフ管理** | Staff List | スタッフ一覧 | 🖥️ | P0 |

---

# Part 3: 画面数サマリー

## 3.1 システム別画面数（精査後）

| # | システム | 画面数 | 📱対応 | 優先度 |
|---|---------|:------:|:------:|:------:|
| 1 | Consumer App | 25 | 全画面 | P0 |
| 2 | Token Hub | 22 | 全画面 | P0 |
| 3 | Governance | 20 | 大部分 | P1 |
| 4 | Prover Portal | 32 | 大部分 | P0 |
| 5 | Observer/Challenger | 16 | 全画面 | P1 |
| 6 | Explorer | 14 | 全画面 | P1 |
| 7 | Enterprise Admin | 35 | 一部 | P1 |
| 8 | QS Admin | 50 | デスクトップ | P0 |
| | **合計** | **214** | | |

## 3.2 Phase別開発計画

| Phase | 期間 | 対象システム | 画面数 |
|-------|------|-------------|:------:|
| Phase 4 W1-4 | 4週間 | Consumer App MVP | ~15 |
| Phase 4 W5-6 | 2週間 | Prover Portal MVP | ~20 |
| Phase 4 W7-8 | 2週間 | Token Hub + Governance | ~25 |
| Phase 4 W9-10 | 2週間 | Explorer + QS Admin拡張 | ~25 |
| Phase 4 W11-12 | 2週間 | Enterprise Admin + 統合 | ~20 |
| Phase 5以降 | - | Observer/Challenger + 残り | ~100+ |

---

# Part 4: データ設計（ジャーニーから逆算）

## 4.1 プレイヤー別必要データ

### End User

| ジャーニーフェーズ | 必要データ | 保存先 | 理由 |
|------------------|-----------|--------|------|
| 登録 | Dilithium公開鍵 | L1 + L3 | 署名検証に必須 |
| 登録 | Dilithium秘密鍵 | ブラウザ内のみ | セキュリティ（CP-2） |
| 登録 | ユーザーID（アドレス） | L1 | オンチェーン識別 |
| Lock | Lock情報（金額、日時） | L1 + L3 | 状態管理 |
| Unlock | Unlock進捗 | L3 → L1 | 状態追跡 |
| 継続利用 | 通知設定 | DB | ユーザー設定 |
| 退会 | 退会フラグ | DB | 状態管理（鍵はL1に残る） |

### Prover

| ジャーニーフェーズ | 必要データ | 保存先 | 理由 |
|------------------|-----------|--------|------|
| 申請 | 企業情報（名称、住所等） | DB（暗号化） | プライバシー保護 |
| 申請 | 技術証明（HSM証明書） | DB（暗号化） | 審査用 |
| 審査 | 審査ステータス | DB | ワークフロー管理 |
| 参加 | SPHINCS+公開鍵 | L1 + L3 | 署名検証に必須 |
| 参加 | Stake金額・状態 | L1 | 経済的インセンティブ |
| 運用 | 署名履歴 | L3 | パフォーマンス追跡 |
| 運用 | 報酬残高 | L1 | 経済的インセンティブ |
| Challenge | Defense証拠 | L1 + IPFS | 検証可能性（CP-5） |
| 退出 | Unbonding状態 | L1 | 状態管理 |

### Observer/Challenger

| ジャーニーフェーズ | 必要データ | 保存先 | 理由 |
|------------------|-----------|--------|------|
| 登録 | Stake金額 | L1 | Permissionless参加 |
| 監視 | 監視対象設定 | DB | ユーザー設定 |
| Challenge | Challenge証拠 | L1 + IPFS | 検証可能性（CP-5） |
| Challenge | Challenge結果 | L1 | 透明性（CP-5） |
| 報酬 | 報酬残高 | L1 | 経済的インセンティブ |

### Token Holder / Delegate

| ジャーニーフェーズ | 必要データ | 保存先 | 理由 |
|------------------|-----------|--------|------|
| veQS Lock | ロック情報（金額、期間） | L1 | 投票力計算 |
| Delegation | 委任関係 | L1 | 投票力移譲 |
| Delegate登録 | プロフィール | IPFS + DB | メタデータ |
| 投票 | 投票記録 | L1 | 透明性（CP-5） |

### Service Provider（Enterprise）

| ジャーニーフェーズ | 必要データ | 保存先 | 理由 |
|------------------|-----------|--------|------|
| 問い合わせ | 問い合わせ内容 | DB | CRM |
| 契約 | 契約情報 | DB（暗号化） | ビジネス |
| オンボーディング | ユーザー一覧 | DB | アクセス管理 |
| 運用 | TX履歴（自社分） | L1 + DB | 監査証跡 |
| 運用 | API使用量 | DB | 課金 |
| 請求 | 請求履歴 | DB | ビジネス |

### QS Staff

| ジャーニーフェーズ | 必要データ | 保存先 | 理由 |
|------------------|-----------|--------|------|
| 入社 | スタッフ情報 | DB | アクセス管理 |
| 権限取得 | 権限情報 | DB | アクセス制御 |
| 運用 | 操作ログ | DB + SIEM | 監査 |
| 退社 | 退社フラグ | DB | アクセス無効化 |

---

## 4.2 データ保存先サマリー

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          データ保存先マッピング                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌────────────────────────────────────────────────────────────────────────┐    │
│  │                            L1 (Ethereum)                                │    │
│  │                                                                         │    │
│  │  • 公開鍵（Dilithium, SPHINCS+）                                       │    │
│  │  • Stake状態                                                           │    │
│  │  • Lock/Unlock最終状態                                                 │    │
│  │  • veQSロック情報                                                      │    │
│  │  • Delegation関係                                                      │    │
│  │  • 投票記録                                                            │    │
│  │  • Challenge結果                                                       │    │
│  │  • Slashing記録                                                        │    │
│  │                                                                         │    │
│  │  特徴: 不変、透明、検証可能（CP-5準拠）                                │    │
│  └────────────────────────────────────────────────────────────────────────┘    │
│                                                                                 │
│  ┌────────────────────────────────────────────────────────────────────────┐    │
│  │                            L3 (Aegis)                                   │    │
│  │                                                                         │    │
│  │  • State Root（全Lock状態のSMT Root）                                  │    │
│  │  • 署名キュー                                                          │    │
│  │  • 署名履歴                                                            │    │
│  │  • Unlock進捗                                                          │    │
│  │  • STARK証明                                                           │    │
│  │                                                                         │    │
│  │  特徴: 高速処理、量子耐性署名                                          │    │
│  └────────────────────────────────────────────────────────────────────────┘    │
│                                                                                 │
│  ┌────────────────────────────────────────────────────────────────────────┐    │
│  │                            DB (PostgreSQL)                              │    │
│  │                                                                         │    │
│  │  • ユーザー設定（通知等）                                              │    │
│  │  • Prover企業情報（暗号化）                                            │    │
│  │  • 審査ワークフロー                                                    │    │
│  │  • Enterprise契約情報（暗号化）                                        │    │
│  │  • Enterprise APIキー（ハッシュ化）                                    │    │
│  │  • Enterprise請求情報                                                  │    │
│  │  • QSスタッフ情報                                                      │    │
│  │  • 操作ログ                                                            │    │
│  │  • サポートチケット                                                    │    │
│  │                                                                         │    │
│  │  特徴: プライバシー保護、柔軟なクエリ                                  │    │
│  └────────────────────────────────────────────────────────────────────────┘    │
│                                                                                 │
│  ┌────────────────────────────────────────────────────────────────────────┐    │
│  │                         IPFS / Arweave                                  │    │
│  │                                                                         │    │
│  │  • Delegate プロフィール                                               │    │
│  │  • Proposal本文                                                        │    │
│  │  • Challenge証拠（ログ等）                                             │    │
│  │  • Defense証拠                                                         │    │
│  │                                                                         │    │
│  │  特徴: 分散保存、永続性                                                │    │
│  └────────────────────────────────────────────────────────────────────────┘    │
│                                                                                 │
│  ┌────────────────────────────────────────────────────────────────────────┐    │
│  │                      Client Side (ブラウザ)                             │    │
│  │                                                                         │    │
│  │  • Dilithium秘密鍵（LocalStorage暗号化 or WebAuthn）                   │    │
│  │  • セッション情報                                                      │    │
│  │  • キャッシュ                                                          │    │
│  │                                                                         │    │
│  │  特徴: Self-Custody（CP-2準拠）、サーバー送信禁止                      │    │
│  └────────────────────────────────────────────────────────────────────────┘    │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

# Part 5: スマホ対応設計

## 5.1 デバイス別対応方針

| システム | PC | タブレット | スマホ | 備考 |
|---------|:--:|:----------:|:------:|------|
| Consumer App | ✅ | ✅ | ✅ | フル対応必須 |
| Token Hub | ✅ | ✅ | ✅ | フル対応 |
| Governance | ✅ | ✅ | ✅ | 投票・閲覧は対応、提案作成はPC推奨 |
| Prover Portal | ✅ | ✅ | △ | ダッシュボード閲覧は対応、申請・設定はPC |
| Observer/Challenger | ✅ | ✅ | ✅ | 監視・Challenge対応 |
| Explorer | ✅ | ✅ | ✅ | フル対応必須 |
| Enterprise Admin | ✅ | ✅ | △ | ダッシュボード閲覧は対応、管理はPC |
| QS Admin | ✅ | △ | ❌ | PCのみ推奨 |

## 5.2 スマホ対応設計原則

```
┌─────────────────────────────────────────────────────────────┐
│                    スマホUI設計原則                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. タッチファースト                                        │
│     • ボタンサイズ: 最低44px × 44px                        │
│     • タップ領域: 十分な余白                               │
│     • スワイプジェスチャー: 自然なナビゲーション           │
│                                                             │
│  2. 1画面1アクション                                        │
│     • 複雑なフォームは複数ステップに分割                   │
│     • CTAは画面下部に固定（親指で届く）                    │
│     • 不要な要素は隠す（プログレッシブ表示）               │
│                                                             │
│  3. ウォレット連携最適化                                    │
│     • WalletConnect v2対応                                  │
│     • ディープリンク（MetaMask Mobile等）                  │
│     • 署名リクエストはシンプルに                           │
│                                                             │
│  4. オフライン考慮                                          │
│     • ネットワーク状態表示                                 │
│     • ローカルキャッシュ活用                               │
│     • リトライ機能                                         │
│                                                             │
│  5. 通知連携                                                │
│     • Push通知対応（Unlock完了等）                         │
│     • ディープリンクで該当画面へ                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 5.3 レスポンシブブレークポイント

```css
/* Mobile First Approach */

/* Small phones */
@media (min-width: 320px) { }

/* Standard phones */
@media (min-width: 375px) { }

/* Large phones */
@media (min-width: 428px) { }

/* Tablets */
@media (min-width: 768px) { }

/* Desktop */
@media (min-width: 1024px) { }

/* Large desktop */
@media (min-width: 1280px) { }

/* Extra large */
@media (min-width: 1536px) { }
```

---

# Part 6: 既存コード分析 & 統合計画

## 6.1 現在のリポジトリ構造

```
quantum-shield/
├── apps/
│   └── admin-dashboard/          # ✅ 既存: QS Admin
│       └── src/
│           ├── pages/
│           │   ├── Dashboard.tsx
│           │   ├── analytics/
│           │   ├── edition/      # ✅ Edition切替
│           │   ├── emergency/    # ✅ Emergency対応
│           │   ├── provers/      # ✅ Prover管理
│           │   └── providers/    # ✅ Provider管理
│           ├── components/
│           └── lib/
├── web/                          # ⚠️ 簡易LP（静的HTML）→リプレース対象
├── contracts/                    # ✅ スマートコントラクト
├── l3-aegis/                     # ✅ L3ノード
└── services/                     # ✅ バックエンドサービス
```

## 6.2 追加が必要なシステム

| システム | 現状 | 対応 |
|---------|------|------|
| Consumer App | web/（静的HTML） | ❌ 新規作成（Next.js） |
| Token Hub | なし | ❌ 新規作成 |
| Governance | なし | ❌ 新規作成 |
| Prover Portal | なし | ❌ 新規作成 |
| Observer/Challenger | なし | ❌ 新規作成 |
| Explorer | なし | ❌ 新規作成 |
| Enterprise Admin | なし | ❌ 新規作成 |
| QS Admin | apps/admin-dashboard/ | ✅ 拡張（オンボーディング、スタッフ管理追加） |

## 6.3 推奨アーキテクチャ

```
quantum-shield-ui/                 # 新規monorepo
├── apps/
│   ├── consumer/                  # Consumer App
│   ├── token-hub/                 # Token Hub
│   ├── governance/                # Governance
│   ├── prover/                    # Prover Portal
│   ├── observer/                  # Observer/Challenger
│   ├── explorer/                  # Explorer
│   ├── enterprise/                # Enterprise Admin
│   └── admin/                     # QS Admin（移行）
│
├── packages/
│   ├── ui/                        # 共通UIコンポーネント
│   ├── crypto/                    # Dilithium WASM等
│   ├── web3/                      # wagmi/viem wrapper
│   ├── api-client/                # API Client
│   └── config/                    # 共通設定
│
└── tooling/
    ├── eslint-config/
    ├── typescript-config/
    └── tailwind-config/
```

---

# Part 7: 開発計画

## 7.1 Phase 4 タイムライン

```
Week 1-2: 基盤構築
├── monorepo設定（Turborepo）
├── 共通コンポーネントライブラリ（shadcn/ui）
├── デザインシステム確立
├── 認証基盤（SIWE + NextAuth）
└── wagmi/viem設定

Week 3-4: Consumer App MVP
├── Landing Page + How It Works
├── Wallet Connect + Key Generation
├── Lock Flow完全実装
└── Dashboard

Week 5-6: Consumer App + Prover MVP
├── Unlock Flow（Normal + Emergency）
├── Prover LP + Requirements
├── Application Flow
└── Prover Dashboard基本

Week 7-8: Token Hub + Governance
├── veQS Lock/Unlock
├── Delegation
├── Governance LP + Proposal List
└── Vote Flow

Week 9-10: Explorer + QS Admin拡張
├── Explorer Home + Search
├── Lock/Unlock Detail
├── QS Admin オンボーディング追加
└── QS Admin スタッフ管理追加

Week 11-12: Enterprise + 統合テスト
├── Enterprise LP + Contact
├── Enterprise Login + Dashboard
├── 全システム統合テスト
└── パフォーマンス最適化
```

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-05 | 初版作成 |
| 2.0 | 2026-01-05 | 全プレイヤージャーニー追加、認知・理解フェーズ追加、権限設計追加、データ設計再検討、スマホ対応追加 |

---

**END OF DOCUMENT**
