# アプリ別詳細設計書 v3.0

> **作成日**: 2026-01-24
> **更新日**: 2026-01-24
> **作成者**: CTOエージェント
> **目的**: 各アプリでユーザーが何をするか、画面構成、API、データフローを明確化
> **参照**: [SEQUENCES.md](../core/SEQUENCES.md), [DATA_MODEL.md](./DATA_MODEL.md), [CROSS_APP_PATTERNS.md](./CROSS_APP_PATTERNS.md), [PERSONA_FEEDBACK.md](./PERSONA_FEEDBACK.md)
> **変更履歴**:
> - v2.0: Token Hub + Governance → QS Hub 統合
> - **v3.0**: Enterprise = 技術譲渡先企業モデルに修正、QS Admin = ライセンサー管理に修正

---

## 目次

1. [設計原則](#1-設計原則)
2. [QS Hub](#2-qs-hub) ← **Token Hub + Governance 統合**
3. [Prover Portal](#3-prover-portal)
4. [Observer](#4-observer)
5. [Enterprise Admin](#5-enterprise-admin) ← **ビジネスモデル修正**
6. [QS Admin](#6-qs-admin)
7. [Explorer](#7-explorer)

---

## 1. 設計原則

### 1.1 各アプリの責務

| アプリ | 主要ペルソナ | 主要タスク | 責務 |
|--------|-------------|-----------|------|
| **Consumer** | 田中さん（一般ユーザー） | 資産をロック・アンロック | 資産保護の実行 |
| **QS Hub** | 鈴木さん（投資家） | QSロック・投票・報酬管理 | **トークン経済参加**（Token Hub + Governance統合） |
| **Prover Portal** | 山田さん（ノード運用者） | 署名リクエストを処理、報酬を受領 | 署名サービス提供 |
| **Observer** | 監視者 | 不正を検知、Challengeを提出 | セキュリティ監視 |
| **Enterprise** | 佐藤さん（技術譲渡先CTO） | **自社QS実装を運営管理** | **技術譲渡先の自社版QS Admin** |
| **QS Admin** | QS財団運営チーム | パブリック版運営 + **技術譲渡先管理** | **システム管理 + ライセンサー業務** |
| **Explorer** | 誰でも | プロトコル状況を確認 | 透明性の提供 |

### 1.2 技術譲渡モデル概要

> **v3.0 追加**: Quantum Shieldのビジネスモデルを明確化

```
┌─────────────────────────────────────────────────────────────────┐
│  【技術譲渡モデル】                                               │
│                                                                 │
│  [QS財団]                                                        │
│       │  - 技術開発・保守                                        │
│       │  - パブリック版QSの運営                                  │
│       │  - 技術譲渡（ライセンス）                                │
│       │                                                         │
│       │ 技術ライセンス提供 ─────────┐                           │
│       │                            │                           │
│       ▼                            ▼                           │
│  [パブリック版QS]           [Enterprise（技術譲渡先）]           │
│  QS財団が運営               例: 大手取引所、金融機関            │
│  QS Adminで管理             自社ブランドで運営                  │
│                             Enterprise Adminで管理             │
│                             ↓                                  │
│                             保守料をQS財団に支払               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

Enterprise Admin = 技術譲渡先が自社のQuantum Shield実装を管理するツール
                   基本的にQS Adminと同等の機能（自社スコープ限定）

QS Admin = パブリック版の管理 + 技術譲渡先企業の管理（ライセンス・保守）
```

### 1.3 共通パターン

```
認証フロー（RainbowKit使用アプリ）:
Landing → Login（RainbowKit接続） → Dashboard

登録確認フロー（Prover/Observer）:
Landing → Login → 登録確認 → [登録済: Dashboard] / [未登録: Application]
```

### 1.4 データフロー原則

```
┌─────────────────────────────────────────────────────────────────┐
│                      データフロー原則                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [ユーザー入力]                                                  │
│       │                                                         │
│       ▼                                                         │
│  [フロントエンド検証]                                            │
│       │                                                         │
│       ▼                                                         │
│  [API呼び出し]                                                   │
│       │                                                         │
│       ▼                                                         │
│  [バックエンド検証] ──→ [オフチェーンDB保存]                     │
│       │                                                         │
│       ▼                                                         │
│  [オンチェーン処理] ──→ [L1/L3 Contract]                        │
│       │                                                         │
│       ▼                                                         │
│  [Event発火] ──→ [インデクサー] ──→ [DB同期]                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. QS Hub（Token Hub + Governance 統合）

> **v2.0 変更**: Token HubとGovernanceを統合。DeFi業界標準（Frax Finance, Curve）に準拠。
> **戦略会議決定**: 2026-01-24 賛成8 / 中立3 / 反対0 で可決

### 2.1 統合の根拠

```
┌─────────────────────────────────────────────────────────────────┐
│  統合メリット:                                                    │
│  - veQSがロック・投票の両方で使用される → 一元管理が自然          │
│  - Frax Finance, Curve Finance など業界標準モデル               │
│  - 開発工数削減（Login/Settings重複排除で -15h）                 │
│  - ユーザー体験向上（ロック→投票→報酬が一連の流れ）              │
│                                                                 │
│  条件（戦略会議）:                                                │
│  1. サブナビゲーション設計の精緻化                               │
│  2. フィッシング対策の強化                                       │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 ユーザーが何をするか

| # | タスク | カテゴリ | 説明 | 頻度 |
|---|--------|---------|------|------|
| 1 | QSトークンをロック | Stake | QSをロックしてveQSを取得 | 低 |
| 2 | ロック期間を延長 | Stake | 既存ロックの期間を延長 | 低 |
| 3 | ロックを解除 | Stake | 期限到来後にQSを引き出し | 低 |
| 4 | veQS残高を確認 | Dashboard | 現在の投票力を確認 | 高 |
| 5 | 報酬を確認・請求 | Rewards | プロトコル手数料を受領 | 中 |
| 6 | 提案を閲覧 | Vote | アクティブな提案を確認 | 高 |
| 7 | 提案に投票 | Vote | veQSの投票力で賛成/反対 | 中 |
| 8 | 投票を委任 | Vote | 信頼できる人に委任 | 低 |
| 9 | 提案を作成 | Vote | 新規提案を提出（要Bond） | 非常に低 |
| 10 | Council情報を確認 | Council | Security Council等を確認 | 低 |

### 2.3 画面構成

```
QS Hub (/qs-hub)
├── Landing (/qs-hub/landing)
│   └── CTA → Login
├── Login (/qs-hub/login)
│   └── RainbowKit接続 → Dashboard
├── Dashboard (/qs-hub/dashboard)
│   ├── veQS残高カード（投票力表示）
│   ├── アクティブ提案数バッジ
│   ├── ロック一覧サマリー
│   ├── 報酬サマリー
│   └── サブナビ: [Stake] [Vote] [Council] [Rewards]
│
├── 【Stakeセクション】
│   ├── Lock (/qs-hub/stake/lock)
│   │   ├── 金額入力
│   │   ├── 期間選択（1週〜4年）
│   │   ├── veQS試算表示
│   │   └── 確認・実行
│   ├── Extend (/qs-hub/stake/extend)
│   │   ├── 対象ロック選択
│   │   ├── 新期間選択
│   │   └── 確認・実行
│   └── Unlock (/qs-hub/stake/unlock)
│       ├── 解除可能ロック一覧
│       └── 確認・実行
│
├── 【Voteセクション】
│   ├── Proposals (/qs-hub/vote/proposals)
│   │   ├── アクティブ提案一覧
│   │   ├── 投票期間フィルター
│   │   └── 各提案カード
│   ├── Proposal Detail (/qs-hub/vote/proposals/[id])
│   │   ├── 提案内容
│   │   ├── 投票状況（Quorum進捗）
│   │   ├── 投票ボタン
│   │   └── 用語ツールチップ
│   ├── Create Proposal (/qs-hub/vote/proposals/create)
│   │   ├── タイトル・説明入力
│   │   ├── Bond確認（1 ETH）
│   │   └── 提出
│   ├── Delegates (/qs-hub/vote/delegates)
│   │   ├── デリゲート一覧
│   │   └── 委任設定
│   └── My Votes (/qs-hub/vote/history)
│       └── 投票履歴
│
├── 【Councilセクション】
│   └── Council (/qs-hub/council)
│       ├── Security Council一覧（9名）
│       └── Purpose Committee一覧
│
├── 【Rewardsセクション】
│   └── Rewards (/qs-hub/rewards)
│       ├── 累計報酬
│       ├── 報酬履歴
│       └── 請求ボタン
│
└── Settings (/qs-hub/settings)
    ├── 通知設定
    └── 委任設定
```

### 2.4 画面遷移図

```
┌──────────┐    ┌──────────┐    ┌──────────────────────────────────┐
│ Landing  │───►│  Login   │───►│           Dashboard              │
└──────────┘    └──────────┘    │ [veQS残高] [提案数] [報酬]        │
                                └────────────────┬─────────────────┘
                                                 │
          ┌──────────────┬───────────────┬───────┴───────┬─────────────┐
          │              │               │               │             │
          ▼              ▼               ▼               ▼             ▼
    ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌─────────┐
    │  Stake   │   │   Vote   │   │ Council  │   │ Rewards  │   │Settings │
    │          │   │          │   │          │   │          │   │         │
    │ Lock     │   │Proposals │   │ 9名一覧  │   │ 請求     │   │ 通知    │
    │ Extend   │   │ Detail   │   │          │   │ 履歴     │   │ 委任    │
    │ Unlock   │   │ Create   │   │          │   │          │   │         │
    │          │   │Delegates │   │          │   │          │   │         │
    │          │   │My Votes  │   │          │   │          │   │         │
    └──────────┘   └──────────┘   └──────────┘   └──────────┘   └─────────┘
```

### 2.5 API一覧

| API | メソッド | 説明 | リクエスト | レスポンス |
|-----|---------|------|-----------|-----------|
| **Stake** |
| `/api/qs-hub/balance` | GET | veQS残高取得 | - | `{ veqs, qs_locked, locks[] }` |
| `/api/qs-hub/lock` | POST | QSロック | `{ amount, period_weeks }` | `{ lock_id, veqs_amount, tx_hash }` |
| `/api/qs-hub/extend` | POST | 期間延長 | `{ lock_id, new_period_weeks }` | `{ veqs_diff, tx_hash }` |
| `/api/qs-hub/unlock` | POST | ロック解除 | `{ lock_id }` | `{ amount, tx_hash }` |
| **Vote** |
| `/api/qs-hub/proposals` | GET | 提案一覧 | `?status=active&page=1` | `{ proposals[], total }` |
| `/api/qs-hub/proposals/[id]` | GET | 提案詳細 | - | `{ proposal }` |
| `/api/qs-hub/vote` | POST | 投票 | `{ proposal_id, support }` | `{ tx_hash }` |
| `/api/qs-hub/proposals/create` | POST | 提案作成 | `{ title, description, actions[] }` | `{ proposal_id, tx_hash }` |
| `/api/qs-hub/delegate` | POST | 委任設定 | `{ to_address }` | `{ tx_hash }` |
| `/api/qs-hub/delegate` | DELETE | 委任解除 | - | `{ tx_hash }` |
| **Council** |
| `/api/qs-hub/council` | GET | Council情報 | - | `{ security[], purpose[] }` |
| **Rewards** |
| `/api/qs-hub/rewards` | GET | 報酬一覧 | - | `{ pending, claimed, history[] }` |
| `/api/qs-hub/claim` | POST | 報酬請求 | - | `{ amount, tx_hash }` |

### 2.6 veQS計算式

```
veQS計算式:
┌─────────────────────────────────────────────────────────────────┐
│  veQS = QS × (ロック期間週数 / 208)                              │
│                                                                 │
│  例:                                                            │
│  - 1000 QS を 1年（52週）ロック → 250 veQS                      │
│  - 1000 QS を 2年（104週）ロック → 500 veQS                     │
│  - 1000 QS を 4年（208週）ロック → 1000 veQS（最大）            │
│                                                                 │
│  重要:                                                           │
│  - 最大ロック期間: 4年（208週）                                  │
│  - veQSは時間経過で線形減少                                      │
│  - 早期解約: 不可（期限到来後のみ解除可能）                      │
└─────────────────────────────────────────────────────────────────┘
```

### 2.7 Governance シーケンス

```
提案ライフサイクル:
1. 提案作成 + Bond（1 ETH）
2. Purpose Committee理念チェック
3. 議論期間（7日）
4. 投票期間（7日）
5. Time Lock（7日）- Security Council Veto可能
6. 実行

Quorum要件:
- パラメータ変更: 4%
- アップグレード: 8%
- Council変更: 15%
```

### 2.8 用語解説（ツールチップ用）

| 用語 | 説明（ja） |
|------|----------|
| veQS | 投票力トークン。QSをロックすると取得できる |
| Quorum | 提案成立に必要な最低投票率 |
| Time Lock | 可決後、実行までの待機期間 |
| Bond | 提案時の保証金（1 ETH） |
| Purpose Committee | 理念適合チェック委員会 |
| Security Council | 緊急時Veto権を持つ9名の委員会 |

### 2.9 チェック項目

- [x] 登録フロー: 不要（ウォレット接続のみ）
- [x] 戻るボタン先: 各サブページ → Dashboard
- [x] データ入力元: ユーザー入力
- [x] データ格納先: L1 veQS Contract + L1 Governor Contract + PostgreSQL
- [x] API: 上記13エンドポイント
- [x] ja/en翻訳: stake, vote, council, rewards キー
- [x] フィッシング対策: 公式URLの明示、ドメイン確認UI

---

## 3. Prover Portal

### 3.1 ユーザーが何をするか

| # | タスク | 説明 | 頻度 |
|---|--------|------|------|
| 1 | Prover登録申請 | HSM証明、マルチシグ、Stake | 1回 |
| 2 | 署名リクエストを処理 | VRF選出時に署名を返す | 高（自動） |
| 3 | ノード状態を確認 | オンライン状態、署名キュー | 高 |
| 4 | 報酬を確認・請求 | 署名手数料を受領 | 中 |
| 5 | 設定を管理 | アラート、オペレーター変更 | 低 |
| 6 | 退出申請 | 7日間Unbonding後にStake返還 | 非常に低 |

### 3.2 画面構成

```
Prover Portal
├── Landing (/prover/landing)
│   └── CTA → Login
├── Login (/prover/login)
│   └── RainbowKit接続 → 登録確認
├── [未登録の場合]
│   └── Application (/prover/application)
│       ├── Step 1: 基本情報（組織名、連絡先）
│       ├── Step 2: 技術要件（HSM証明、SPHINCS+公開鍵）
│       ├── Step 3: セキュリティ（マルチシグ設定）
│       ├── Step 4: Stake（$400K+ ETH/QS）
│       └── Step 5: 確認・提出
├── [登録済の場合]
│   └── Dashboard (/prover/dashboard)
│       ├── ステータスカード（Active/Pending/Exiting）
│       ├── 署名キュー（ペンディング数）
│       ├── 報酬サマリー
│       ├── ノードメトリクス（応答時間、成功率）
│       └── CTAs: 報酬請求、設定、退出
├── Queue (/prover/queue)
│   ├── ペンディング署名一覧
│   ├── 自動署名設定
│   └── 手動承認オプション
├── Rewards (/prover/rewards)
│   ├── 累計報酬
│   ├── 報酬履歴
│   └── 請求ボタン
├── Settings (/prover/settings)
│   ├── オペレーターアドレス変更
│   ├── アラート設定
│   └── HSM更新
└── Exit (/prover/exit)
    ├── 退出条件確認
    ├── Unbonding期間説明（7日）
    └── 退出申請ボタン
```

### 3.3 登録フロー詳細（Sequence #5参照）

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ Landing  │───►│  Login   │───►│ 登録確認 │───►│Application│
└──────────┘    └──────────┘    └────┬─────┘    └────┬─────┘
                                     │               │
                                     │ 登録済        │ 提出
                                     ▼               ▼
                              ┌──────────┐    ┌──────────┐
                              │Dashboard │◄───│ Pending  │
                              └──────────┘    │ (承認待) │
                                              └──────────┘

承認プロセス:
- Phase 1: 財団招待制
- Phase 2: Council 3/9 + 条件自動承認
- Phase 3+: 条件満たせば自動承認
```

### 3.4 API一覧

| API | メソッド | 説明 | リクエスト | レスポンス |
|-----|---------|------|-----------|-----------|
| `/api/prover/status` | GET | 登録状態確認 | - | `{ registered: boolean, status: string }` |
| `/api/prover/register` | POST | 登録申請 | `{ org_name, sphincs_pubkey, hsm_attestation, multisig_proof, stake_amount }` | `{ prover_id: string, tx_hash: string }` |
| `/api/prover/dashboard` | GET | ダッシュボード | - | `{ status, queue_count, rewards, metrics }` |
| `/api/prover/queue` | GET | 署名キュー | - | `{ pending: SignRequest[] }` |
| `/api/prover/sign` | POST | 署名提出 | `{ request_id: string, signature: bytes }` | `{ success: boolean }` |
| `/api/prover/rewards/claim` | POST | 報酬請求 | - | `{ amount: string, tx_hash: string }` |
| `/api/prover/exit` | POST | 退出申請 | - | `{ unbonding_end: timestamp, tx_hash: string }` |
| `/api/prover/settings` | PUT | 設定更新 | `{ operator_addr?, alert_settings? }` | `{ success: boolean }` |

### 3.5 データフロー

```
登録申請:
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Application │────►│POST /register────►│ L1 Staking  │────►│ PostgreSQL  │
│ フォーム    │     │             │     │ Contract    │     │ provers     │
│             │     │             │     │ + Stake転送 │     │ prover_kyb  │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘

DB保存:
- provers: { id, operator_addr, sphincs_pubkey, stake_amount, status, registered_at }
- prover_kyb: { prover_id, org_name, contact_email, hsm_model, legal_signed_at }

署名フロー（自動）:
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ L3 Aegis    │────►│ Prover HSM  │────►│ L3 Aegis    │
│ 署名要求    │     │ 2-of-3承認  │     │ 署名収集    │
│ VRF選出     │     │ SPHINCS+生成│     │             │
└─────────────┘     └─────────────┘     └─────────────┘
```

### 3.6 SLA要件（ペルソナフィードバック反映）

> **重要**: Dashboard/Queueに明示的に表示すること

```
署名SLA:
┌─────────────────────────────────────────────────────────────────┐
│  署名応答時間:                                                   │
│  - 目標: 5分以内                                                 │
│  - 警告: 10分超過でアラート                                       │
│  - ペナルティ: 30分超過で選出確率低下                             │
│  - タイムアウト: 60分でVRF再選出、該当Proverは一時停止            │
│                                                                 │
│  可用性要件:                                                     │
│  - 目標: 99.9% uptime                                           │
│  - 月間許容ダウンタイム: 43分                                    │
│  - 連続ダウン: 4時間超で選出停止                                 │
│                                                                 │
│  署名成功率:                                                     │
│  - 目標: 99.5%                                                  │
│  - 95%未満が続くと警告                                           │
│  - 90%未満が1週間続くと要レビュー                                │
└─────────────────────────────────────────────────────────────────┘
```

### 3.7 Slashing条件詳細（ペルソナフィードバック反映）

> **重要**: Settings/Exit画面に明示的に表示すること

```
Slashing対象となる行為:
┌─────────────────────────────────────────────────────────────────┐
│  1. 不正署名（Challengeで立証された場合）                         │
│     - 無効なDilithium署名を持つUnlockに署名した                  │
│     - SR遷移が不正なUnlockに署名した                             │
│                                                                 │
│  2. 二重署名                                                     │
│     - 同じUnlockに対して異なる内容で2回署名した                   │
│                                                                 │
│  3. 鍵漏洩                                                       │
│     - HSM外で署名が生成された証拠がある場合                      │
│                                                                 │
│  Slashing額（Quadratic）:                                        │
│  - 1社不正: Stake × 10% = $40K                                  │
│  - 2社同時不正: Stake × 40% = $160K/社                          │
│  - 3社同時不正: Stake × 90% = $360K/社                          │
│  - 4社以上同時: Stake × 100% = 全額没収                         │
│                                                                 │
│  Slashing配分:                                                   │
│  - Challenger: 60%                                              │
│  - Insurance Fund: 20%                                          │
│  - Burn: 20%                                                    │
└─────────────────────────────────────────────────────────────────┘
```

### 3.8 チェック項目

- [x] 登録フロー: 必須（5ステップApplication）
- [x] 戻るボタン先: Application各ステップ → 前ステップ、最終確認 → Dashboard
- [x] データ入力元: Prover運用者（組織情報、HSM証明、マルチシグ）
- [x] データ格納先: L1 Staking Contract + PostgreSQL (provers, prover_kyb)
- [x] API: 上記8エンドポイント
- [x] ja/en翻訳: application, dashboard, queue, rewards, settings, exit
- [x] SLA表示: Dashboard/Queueに応答時間・成功率を表示
- [x] Slashing説明: Settings/Exitで条件と計算式を明示

---

## 4. Observer

### 4.1 ユーザーが何をするか

| # | タスク | 説明 | 頻度 |
|---|--------|------|------|
| 1 | Observer登録 | Stakeして監視者として登録 | 1回 |
| 2 | 監視ダッシュボード確認 | 疑わしいUnlock、アラート | 高 |
| 3 | Challengeを提出 | 不正Unlockに異議申し立て | 低（不正発見時） |
| 4. Challenge結果確認 | 勝敗と報酬 | Challenge後 |
| 5 | 報酬を請求 | Challenge報酬（60%） | 低 |
| 6 | 退出申請 | Stake返還 | 非常に低 |

### 4.2 画面構成

```
Observer
├── Landing (/observer/landing)
│   └── CTA → Login
├── Login (/observer/login)
│   └── RainbowKit接続 → 登録確認
├── [未登録の場合]
│   └── Registration (/observer/register)
│       ├── Stake金額入力
│       └── 確認・登録
├── [登録済の場合]
│   └── Dashboard (/observer/dashboard)
│       ├── 監視統計（検知数、Challenge数、成功率）
│       ├── 疑わしいUnlock一覧（リアルタイム）
│       ├── アクティブChallenge一覧
│       ├── 報酬サマリー
│       └── CTAs: Challenge提出、報酬請求
├── Unlocks (/observer/unlocks)
│   ├── 全Unlock一覧（フィルター: 正常/疑わしい/チャレンジ済）
│   ├── 各Unlockの詳細（SR_0, SR_1, 署名者）
│   └── Challengeボタン
├── Challenge (/observer/challenge/[unlock_id])
│   ├── Unlock詳細
│   ├── 不正の証拠説明
│   ├── Bond確認（MAX(0.1ETH, amount×1%)）
│   └── Challenge提出
├── Challenges (/observer/challenges)
│   ├── 自分のChallenge一覧
│   ├── 状態（進行中/勝利/敗北）
│   └── 報酬/損失
├── Rewards (/observer/rewards)
│   ├── 累計報酬
│   ├── Challenge報酬履歴
│   └── 請求ボタン
└── Settings (/observer/settings)
    ├── アラート設定（Telegram, Email）
    └── 自動Challenge設定
```

### 4.3 Challenge フロー（Sequence #4参照）

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ Unlocks  │───►│Challenge │───►│ L1 Vault │───►│ 48h待機  │
│ 疑わしい │    │ 提出     │    │ 登録     │    │ Defense  │
└──────────┘    └────┬─────┘    └──────────┘    └────┬─────┘
                     │                               │
                     │                   ┌───────────┴───────────┐
                     │                   │                       │
                     │            Defense成功              Defense失敗
                     │                   │                       │
                     ▼                   ▼                       ▼
              ┌──────────┐        ┌──────────┐          ┌──────────┐
              │Challenges│◄───────│Bond没収 │          │Slash実行 │
              │ 履歴     │        │(敗北)    │          │報酬分配  │
              └──────────┘        └──────────┘          │60%受領   │
                                                        └──────────┘

Quadratic Slashing:
- 1社不正: 10%
- 2社同時: 40%/社
- 3社同時: 90%/社
- 4社以上: 100%
```

### 4.4 API一覧

| API | メソッド | 説明 | リクエスト | レスポンス |
|-----|---------|------|-----------|-----------|
| `/api/observer/status` | GET | 登録状態確認 | - | `{ registered: boolean, status: string }` |
| `/api/observer/register` | POST | 登録 | `{ stake_amount: string }` | `{ observer_id: string, tx_hash: string }` |
| `/api/observer/dashboard` | GET | ダッシュボード | - | `{ stats, suspicious_unlocks, active_challenges, rewards }` |
| `/api/observer/unlocks` | GET | Unlock一覧 | `?filter=suspicious` | `{ unlocks: UnlockWithRisk[] }` |
| `/api/observer/challenge` | POST | Challenge提出 | `{ unlock_id: string, evidence: string }` | `{ challenge_id: string, tx_hash: string }` |
| `/api/observer/challenges` | GET | Challenge一覧 | - | `{ challenges: Challenge[] }` |
| `/api/observer/rewards/claim` | POST | 報酬請求 | - | `{ amount: string, tx_hash: string }` |

### 4.5 疑わしいUnlock判定基準（ペルソナフィードバック反映）

> **重要**: Unlocks画面に判定基準を表示すること

```
疑わしいUnlock判定:
┌─────────────────────────────────────────────────────────────────┐
│  リスクスコア計算（0-100）:                                       │
│                                                                 │
│  [自動検出項目]                                                  │
│  +30: Dilithium署名検証が一致しない                             │
│  +25: SR_0 → SR_1 の遷移が不正                                  │
│  +20: 署名者Proverに過去の警告履歴あり                          │
│  +15: 短期間での大量Unlock（同一アドレス）                       │
│  +10: 通常と異なるタイミング（深夜等）                           │
│  +5:  新規登録アドレスからの高額Unlock                          │
│                                                                 │
│  [リスクレベル]                                                  │
│  - 0-20: 正常（緑）                                             │
│  - 21-50: 要注意（黄）                                          │
│  - 51-80: 疑わしい（オレンジ）                                   │
│  - 81-100: 高リスク（赤）- Challenge推奨                        │
│                                                                 │
│  [表示項目]                                                      │
│  - リスクスコア                                                  │
│  - 検出理由リスト                                               │
│  - 類似過去事例（あれば）                                        │
└─────────────────────────────────────────────────────────────────┘
```

### 4.6 誤検知と救済措置（ペルソナフィードバック反映）

```
誤検知リスクと対策:
┌─────────────────────────────────────────────────────────────────┐
│  [システム誤検知の場合]                                          │
│  - Observerがシステム表示を信じてChallengeした場合               │
│  - 48時間のDefense期間でProverが正当性を証明                    │
│  - 誤検知と判明 → Observer Bond没収（リスク）                    │
│                                                                 │
│  [救済措置]                                                      │
│  - Challenge前に「確信度」表示: 高/中/低                        │
│  - 低確信度でのChallenge: 警告メッセージ表示                    │
│  - 過去類似事例の勝率表示: 「同様のChallengeは過去70%勝利」     │
│                                                                 │
│  [システムバグによる誤検知]                                      │
│  - バグが確認された場合、Governance提案で被害者に補償            │
│  - Insurance Fundから補填される可能性                           │
│  - ただし保証はない（自己責任が原則）                            │
│                                                                 │
│  [推奨事項]                                                      │
│  - 高リスク（81-100）のみChallengeを推奨                        │
│  - 中リスクは手動検証後に判断                                   │
│  - 初心者は最初の3ヶ月はChallenge控えめに                       │
└─────────────────────────────────────────────────────────────────┘
```

### 4.7 チェック項目

- [x] 登録フロー: 必須（Stake登録）
- [x] 戻るボタン先: Challenge → Unlocks → Dashboard
- [x] データ入力元: 監視システム（疑わしいUnlock自動検出）+ Observer判断
- [x] データ格納先: L1 Vault Contract (Challenge) + PostgreSQL
- [x] API: 上記7エンドポイント
- [x] ja/en翻訳: dashboard, unlocks, challenge, challenges, rewards
- [x] 判定基準表示: リスクスコアと検出理由をUnlocks画面に表示
- [x] 救済説明: Challenge画面で誤検知リスクと確信度を表示

---

## 5. Enterprise Admin

### 5.1 ビジネスモデル: 技術譲渡先向け自社版QS Admin

> **v3.0 修正**: Enterprise は「QS財団より技術譲渡を受けた企業」向けのアプリ
> - 技術譲渡先が**自社でQuantum Shield実装を運営**する
> - QS財団は**保守料**を受け取る立場
> - Enterprise Admin = **自社版 QS Admin**（自社スコープ限定）

```
【v3.0 技術譲渡モデル】
┌─────────────────────────────────────────────────────────────────┐
│  [QS財団]                                                        │
│       │                                                         │
│       │ 1. 技術ライセンス契約（オフライン）                      │
│       │ 2. 技術譲渡（ソースコード、ドキュメント、サポート）       │
│       │ 3. 保守契約（年間保守料）                                │
│       ▼                                                         │
│  [技術譲渡先企業]  例: 大手取引所、金融機関、機関投資家          │
│       │                                                         │
│       │ 自社でQuantum Shieldを運営:                              │
│       │ - 自社ブランドでサービス提供                             │
│       │ - 自社のProverノード運用                                 │
│       │ - 自社のObserverノード運用                               │
│       │ - 自社のConsumer App（ユーザー向け）                     │
│       │                                                         │
│       ▼                                                         │
│  [Enterprise Admin]  = 自社版 QS Admin                           │
│       │                                                         │
│       │ 以下を自社スコープで管理:                                │
│       │ - Prover管理（自社Proverの承認・監視）                   │
│       │ - Observer管理（自社Observerの監視）                     │
│       │ - プロトコル監視（自社TVL、TX）                          │
│       │ - Emergency Pause（自社環境の緊急停止）                  │
│       │ - ユーザー統計（自社ユーザーの利用状況）                 │
│       │ - チーム管理（自社管理者の権限設定）                     │
│       │                                                         │
│       ▼                                                         │
│  [技術譲渡先のエンドユーザー]                                    │
│       │                                                         │
│       │ 技術譲渡先が提供する Consumer App を利用:                │
│       │ - Lock/Unlock/Claim を実行                               │
│       │ - 自社ブランド体験                                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

重要なポイント:
- Enterprise = 技術譲渡を受けて自社でQSを運営する企業
- Enterprise Admin = QS Adminの機能を自社スコープで提供
- QS財団は技術提供・保守サポートの立場（直接運営しない）
- 技術譲渡先は独自のProver/Observer/Consumer Appを持つ
```

### 5.2 ユーザーが何をするか

| # | タスク | 説明 | 頻度 |
|---|--------|------|------|
| 1 | **Prover管理** | 自社Proverの登録・監視・メンテナンス | 中 |
| 2 | **Observer管理** | 自社Observerの監視・アラート確認 | 中 |
| 3 | **プロトコル監視** | 自社環境のTVL、TX数、異常検知 | 高 |
| 4 | **Emergency対応** | 緊急時に自社環境を停止 | 非常に低 |
| 5 | **パラメータ管理** | 自社環境のパラメータ設定 | 低 |
| 6 | **ユーザー統計** | 自社ユーザーの利用状況レポート | 中 |
| 7 | **チーム管理** | 自社管理者の追加・権限設定 | 低 |
| 8 | **監査ログ確認** | 自社環境の全操作ログ確認 | 中 |

### 5.3 画面構成（v3.1 ペルソナフィードバック反映版 - 14画面）

> **v3.1 更新**: ペルソナ（佐藤さん）フィードバックと11体エージェント会議決定を反映
> **会議決定事項**: Explorer公開義務、監査レポート提出義務、Premium Japanデザイン準拠義務

```
Enterprise Admin（= 自社版 QS Admin）
├── Login (/enterprise/login)
│   └── 内部認証（Email + 2FA / SSO）→ Dashboard
│
├── Dashboard (/enterprise/dashboard)
│   ├── **環境セレクター**（本番/ステージング/テスト）← v3.1追加
│   ├── **環境別カラーバー**（本番=青、ステージング=黄、テスト=灰）
│   ├── **KPIカード6個**（TVL、TX数、Prover数、Observer数、ユーザー数、稼働率）
│   │   └── 各カードにミニグラフ + 前日比/前週比表示
│   ├── 要対応タスク（優先度別: Critical/High/Normal）
│   ├── システムアラート（優先度バッジ強化）
│   ├── **グローバルエクスポートボタン**
│   ├── **キーボードショートカットヘルプ**
│   └── CTAs: 各管理画面へ
│
├── **Provers** (/enterprise/provers)
│   ├── 自社Prover一覧（Active/Pending/Maintenance）
│   ├── 登録・承認操作
│   ├── ステータス監視
│   ├── パフォーマンスメトリクス
│   └── エクスポート機能
│
├── **Prover Detail** (/enterprise/provers/[id])
│   ├── 基本情報
│   ├── 稼働統計
│   ├── 署名処理メトリクス
│   └── メンテナンス操作
│
├── **Prover Calendar** (/enterprise/provers/calendar)  ← v3.1追加
│   ├── メンテナンスカレンダー（月表示/週表示）
│   ├── 予定されたメンテナンス一覧
│   ├── メンテナンス登録
│   └── 代替Prover自動割り当て表示
│
├── **Observers** (/enterprise/observers)
│   ├── 自社Observer一覧
│   ├── アラート状況
│   └── Challenge提出履歴
│
├── **Monitoring** (/enterprise/monitoring)
│   ├── リアルタイムダッシュボード
│   ├── 自社TVL推移
│   ├── 自社TX推移
│   ├── 自社ユーザー統計
│   └── アラート設定
│
├── **Users** (/enterprise/users)
│   ├── ユーザー数推移
│   ├── 利用状況（Lock/Unlock/Claim）
│   └── 月次レポート
│
├── **Parameters** (/enterprise/parameters)
│   ├── 自社環境パラメータ一覧
│   ├── 変更履歴
│   └── 変更操作（QS財団承認が必要な項目あり）
│
├── **Emergency** (/enterprise/emergency)
│   ├── 現在のプロトコル状態
│   ├── Pause履歴
│   └── Emergency Pause操作（自社Security Council承認）
│
├── **Support** (/enterprise/support)  ← v3.1追加
│   ├── サポートチケット一覧
│   ├── チケット作成
│   ├── チケット詳細・コメント
│   └── ステータス追跡（Open/In Progress/Resolved）
│
├── **Team** (/enterprise/team)
│   ├── 自社管理者一覧
│   ├── 招待・権限管理
│   └── ロール設定（Admin/Operator/Viewer）
│
├── **Audit Log** (/enterprise/audit-log)  ← v3.1更新
│   ├── **高度な検索フィルター**（日付範囲 + 操作者 + 操作種別 + キーワード）
│   ├── **検索条件保存機能**
│   ├── 自社環境操作ログ
│   └── エクスポート
│
└── **Settings** (/enterprise/settings)  ← v3.1更新（6タブ）
    ├── 組織情報
    ├── ブランディング設定（ロゴ、カラー）
    ├── 通知設定（Telegram/Slack/Email/Webhook）
    ├── **環境管理**（複数環境切り替え設定）← v3.1追加
    ├── **開発者**（APIドキュメント、Webhookテスト）← v3.1追加
    ├── ライセンス情報・契約情報
    │   └── **監査レポート提出**（会議決定事項）
    └── QS財団への保守連絡先

キーボードショートカット（v3.1追加）:
- g: Dashboard  - p: Provers  - o: Observers  - m: Monitoring
- s: Settings   - /: グローバル検索  - ?: ショートカットヘルプ
- j/k: リスト上下移動（Vim風）
```

### 5.4 API一覧（v3.1 更新）

| API | メソッド | 説明 | リクエスト | レスポンス | 新規 |
|-----|---------|------|-----------|-----------|:----:|
| **Core** |
| `/api/enterprise/dashboard` | GET | ダッシュボード（KPI6個） | `?env=production` | `{ kpis, tasks, alerts }` | 更新 |
| `/api/enterprise/dashboard/export` | POST | ダッシュボードエクスポート | `{ format }` | `{ file_url }` | ✅ |
| **Prover管理** |
| `/api/enterprise/provers` | GET | 自社Prover一覧 | `?status=active` | `{ provers[], total }` | |
| `/api/enterprise/provers` | POST | Prover登録 | `{ name, endpoint, ... }` | `{ prover_id }` | |
| `/api/enterprise/provers/[id]` | GET | Prover詳細 | - | `{ prover, metrics }` | |
| `/api/enterprise/provers/[id]/status` | PUT | ステータス変更 | `{ status }` | `{ success }` | |
| `/api/enterprise/provers/calendar` | GET | メンテナンスカレンダー | `?month=2026-01` | `{ events[] }` | ✅ |
| `/api/enterprise/provers/[id]/maintenance` | POST | メンテナンス登録 | `{ start, end, reason }` | `{ event_id }` | ✅ |
| **Observer管理** |
| `/api/enterprise/observers` | GET | 自社Observer一覧 | - | `{ observers[] }` | |
| `/api/enterprise/observers/[id]` | GET | Observer詳細 | - | `{ observer, alerts }` | |
| **Monitoring** |
| `/api/enterprise/monitoring` | GET | 監視データ | `?period=7d` | `{ tvl, txs, users }` | |
| `/api/enterprise/monitoring/alerts` | GET | アラート一覧 | - | `{ alerts[] }` | |
| **Users** |
| `/api/enterprise/users/stats` | GET | ユーザー統計 | `?period=30d` | `{ user_count, tx_stats }` | |
| `/api/enterprise/users/report` | POST | レポート生成 | `{ month }` | `{ report_url }` | |
| **Parameters** |
| `/api/enterprise/parameters` | GET | パラメータ一覧 | - | `{ parameters[] }` | |
| `/api/enterprise/parameters` | PUT | パラメータ変更 | `{ key, value }` | `{ success }` | |
| **Emergency** |
| `/api/enterprise/emergency/status` | GET | 緊急状態 | - | `{ paused, history }` | |
| `/api/enterprise/emergency/pause` | POST | 緊急停止 | `{ reason }` | `{ success }` | |
| `/api/enterprise/emergency/unpause` | POST | 再開 | `{ approval }` | `{ success }` | |
| **Support（v3.1追加）** |
| `/api/enterprise/support/tickets` | GET | チケット一覧 | `?status=open` | `{ tickets[], total }` | ✅ |
| `/api/enterprise/support/tickets` | POST | チケット作成 | `{ title, description, priority }` | `{ ticket_id }` | ✅ |
| `/api/enterprise/support/tickets/[id]` | GET | チケット詳細 | - | `{ ticket, comments[] }` | ✅ |
| `/api/enterprise/support/tickets/[id]/comments` | POST | コメント追加 | `{ content }` | `{ comment_id }` | ✅ |
| **Team** |
| `/api/enterprise/team` | GET | チーム一覧 | - | `{ members[] }` | |
| `/api/enterprise/team/invite` | POST | 招待 | `{ email, role }` | `{ invite_id }` | |
| `/api/enterprise/team/[id]/role` | PUT | ロール変更 | `{ role }` | `{ success }` | |
| **Audit（v3.1更新）** |
| `/api/enterprise/audit-log` | GET | 監査ログ（高度検索） | `?dateFrom=&dateTo=&user=&action=&keyword=` | `{ logs[], total }` | 更新 |
| `/api/enterprise/audit-log/saved-searches` | GET/POST | 検索条件保存 | `{ name, filters }` | `{ searches[] }` | ✅ |
| `/api/enterprise/audit-log/export` | POST | エクスポート | `{ filters, format }` | `{ file_url }` | ✅ |
| **Settings（v3.1追加）** |
| `/api/enterprise/settings/environments` | GET/POST | 環境管理 | `{ name, url, color }` | `{ environments[] }` | ✅ |
| `/api/enterprise/settings/webhook/test` | POST | Webhookテスト | `{ url }` | `{ status, response }` | ✅ |
| `/api/enterprise/settings/audit-report` | POST | 監査レポート提出 | `{ report_file }` | `{ report_id }` | ✅ |

### 5.5 QS Adminとの機能比較

```
┌─────────────────────────────────────────────────────────────────┐
│  【Enterprise Admin vs QS Admin 機能比較】                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  機能              | Enterprise Admin | QS Admin                │
│  ─────────────────|──────────────────|─────────────────────     │
│  Prover管理        | 自社のみ         | パブリック全体           │
│  Observer管理      | 自社のみ         | パブリック全体           │
│  プロトコル監視    | 自社環境         | パブリック環境           │
│  Emergency Pause   | 自社環境         | パブリック環境           │
│  ユーザー統計      | 自社ユーザー     | パブリック全体           │
│  パラメータ管理    | 自社環境         | パブリック環境           │
│  チーム管理        | ✅               | ✅                       │
│  監査ログ          | 自社ログ         | パブリックログ           │
│  ─────────────────|──────────────────|─────────────────────     │
│  技術譲渡先管理    | ❌               | ✅（QS Admin専用）        │
│  ライセンス管理    | ❌               | ✅（QS Admin専用）        │
│                                                                 │
│  結論: Enterprise Admin は QS Admin の「自社スコープ版」         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.6 ブランディング機能

```
ブランディング設定:
┌─────────────────────────────────────────────────────────────────┐
│  技術譲渡先は自社ブランドでサービス提供可能:                     │
│                                                                 │
│  [カスタマイズ可能項目]                                          │
│  - ロゴ（ヘッダー、ログイン画面）                                │
│  - プライマリカラー                                              │
│  - サービス名                                                    │
│  - フッターテキスト                                              │
│  - 利用規約・プライバシーポリシーURL                             │
│                                                                 │
│  [固定項目]                                                      │
│  - "Powered by Quantum Shield" 表記（必須）                      │
│  - セキュリティ関連の技術表記                                    │
│                                                                 │
│  Consumer Appにも同様のブランディング設定を適用                   │
└─────────────────────────────────────────────────────────────────┘
```

### 5.7 保守サポート連携

```
QS財団保守サポート:
┌─────────────────────────────────────────────────────────────────┐
│  [サポートチャンネル]                                            │
│  - 専用Slackチャンネル                                           │
│  - 技術問い合わせチケットシステム                                │
│  - 24/7緊急連絡先（Critical対応）                                │
│                                                                 │
│  [サポート範囲]                                                  │
│  - セキュリティアップデート提供                                  │
│  - バグ修正                                                      │
│  - 技術相談                                                      │
│  - パフォーマンスチューニング支援                                │
│                                                                 │
│  [Enterprise Admin連携]                                          │
│  - Settings画面から保守チケット作成可能                          │
│  - QS財団からの通知をダッシュボードに表示                        │
│  - アップデート適用状況の確認                                    │
└─────────────────────────────────────────────────────────────────┘
```

### 5.8 ライセンス条件（11体エージェント会議決定）

> **可決**: 2026-01-24 全会一致（11-0-0）

```
技術譲渡ライセンス条件:
┌─────────────────────────────────────────────────────────────────┐
│  [必須義務]                                                      │
│  1. Explorer公開義務                                             │
│     - 自社環境のExplorerを一般公開すること                       │
│     - オンチェーン検証可能性の維持（CP-3 透明性）                │
│                                                                 │
│  2. 監査レポート提出義務                                         │
│     - 四半期ごとに運用レポートをQS財団に提出                     │
│     - Settings > ライセンス情報 > 監査レポート提出 から実行       │
│                                                                 │
│  3. Premium Japan デザインシステム準拠義務                       │
│     - カラーはカスタマイズ可能                                   │
│     - コンポーネント構造・スペーシングはPremium Japan準拠維持    │
│                                                                 │
│  [QS財団側の権限]                                                │
│  - 運用監査権（年1回以上の監査実施可能）                         │
│  - セキュリティインシデント報告要求権                            │
│  - 重大違反時のライセンス停止権（QS Adminから実行）              │
│                                                                 │
│  [責任分界]                                                      │
│  - 技術譲渡先の運用ミスによる損害はQS財団に及ばない              │
│  - GDPR/個人情報保護法対応は技術譲渡先の責任                     │
│  - QS財団は適切な技術仕様・サポートを提供する義務                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.9 チェック項目

- [x] 登録フロー: 技術ライセンス契約ベース（オフライン契約後にアクセス付与）
- [x] 戻るボタン先: 各画面 → Dashboard
- [x] データ入力元: 技術譲渡先管理者
- [x] データ格納先: **技術譲渡先の自社インフラ**（PostgreSQL + 自社L1/L3）
- [x] API: 上記32エンドポイント（v3.1: +12エンドポイント）
- [x] ja/en翻訳: dashboard, provers, observers, monitoring, users, parameters, emergency, support, team, audit-log, settings
- [x] ブランディング機能: ロゴ、カラー、サービス名のカスタマイズ（デザインシステム準拠必須）
- [x] 保守連携: Support画面からチケット作成・追跡可能
- [x] 複数環境対応: 環境セレクター + 環境別カラーバー
- [x] キーボードショートカット: グローバルナビゲーション対応
- [x] 高度な検索: 監査ログで複合条件検索 + 検索条件保存
- [x] Explorer公開義務: ライセンス条件として明記
- [x] 監査レポート提出: Settings > ライセンス情報から提出可能

---

## 6. QS Admin

### 6.1 v3.0 役割拡張: パブリック版運営 + ライセンサー業務

> **v3.0 修正**: QS Adminは2つの役割を持つ
> 1. **パブリック版QSの運営管理**（従来機能）
> 2. **技術譲渡先企業の管理**（ライセンサー業務）← NEW

```
【QS Admin v3.0 デュアルロール】
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  [パブリック版QS運営]                                            │
│  ├── Prover承認・管理                                           │
│  ├── Observer監視                                               │
│  ├── プロトコル監視（TVL、TX）                                  │
│  ├── Challenge対応                                              │
│  ├── Emergency Pause                                            │
│  └── パラメータ管理                                             │
│                                                                 │
│  ─────────────────────────────────────────────────────          │
│                                                                 │
│  [ライセンサー業務]  ← v3.0 追加                                 │
│  ├── 技術譲渡先（Licensee）管理                                 │
│  │   ├── ライセンス契約管理                                     │
│  │   ├── アカウント発行                                         │
│  │   └── 契約更新・終了管理                                     │
│  ├── 保守サポート                                               │
│  │   ├── チケット対応                                           │
│  │   ├── アップデート配信                                       │
│  │   └── 技術問い合わせ対応                                     │
│  ├── 収益管理                                                   │
│  │   ├── 保守料請求                                             │
│  │   └── 支払い状況確認                                         │
│  └── 技術ドキュメント管理                                       │
│      ├── ドキュメント公開管理                                   │
│      └── 更新通知                                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 ユーザーが何をするか

| # | タスク | 説明 | 頻度 | カテゴリ |
|---|--------|------|------|---------|
| **パブリック版運営** |
| 1 | Prover承認 | 申請中Proverを審査・承認 | 中 | 運営 |
| 2 | プロトコル監視 | パブリック版TVL、TX数、異常検知 | 高 | 運営 |
| 3 | Emergency Pause | 緊急時にパブリック版を停止 | 非常に低 | 運営 |
| 4 | パラメータ管理 | 手数料率、Time Lock期間等 | 低 | 運営 |
| 5 | Challenge対応 | Challenge状況確認、介入 | 中 | 運営 |
| **ライセンサー業務** |
| 6 | **ライセンシー管理** | 技術譲渡先企業の登録・管理 | 中 | ライセンス |
| 7 | **ライセンス管理** | 契約情報、有効期限、更新管理 | 中 | ライセンス |
| 8 | **保守チケット対応** | 技術問い合わせへの対応 | 高 | サポート |
| 9 | **アップデート配信** | セキュリティパッチ、バージョン管理 | 低 | サポート |
| 10 | **保守料管理** | 請求・支払い状況確認 | 月次 | 収益 |
| 11 | 監査ログ確認 | 全操作のログ確認 | 中 | 共通 |

### 6.3 画面構成（v3.1 - 17画面）

> **v3.1 更新**: 11体エージェント会議決定事項を反映
> - Licensee Supportビュー追加（Enterprise Adminからのチケット一元管理）
> - License Suspension機能追加（重大違反時のライセンス停止）

```
QS Admin
├── Login (/admin/login)
│   └── 内部認証 → Dashboard
│
├── Dashboard (/admin/dashboard)
│   ├── KPIカード
│   │   ├── [パブリック] TVL、TX数、Prover数
│   │   └── [ライセンス] Licensee数、保守チケット数、保守料収益
│   ├── 要対応タスク
│   │   ├── Prover承認待ち
│   │   ├── 保守チケット未対応
│   │   └── ライセンス更新期限
│   ├── システムアラート
│   └── CTAs: 各管理画面へ
│
├─────────────────────────────────────────────────────────
│ 【パブリック版運営セクション】
├─────────────────────────────────────────────────────────
│
├── Provers (/admin/provers)
│   ├── Prover一覧（Active/Pending/Exiting/Slashed）
│   ├── 承認/却下操作
│   └── 詳細確認
│
├── Prover Detail (/admin/provers/[id])
│   ├── 基本情報、KYB情報
│   ├── メトリクス
│   └── 操作履歴
│
├── Monitoring (/admin/monitoring)
│   ├── リアルタイムダッシュボード
│   ├── パブリック版TVL推移
│   ├── パブリック版TX推移
│   └── アラート設定
│
├── Challenges (/admin/challenges)
│   ├── Challenge一覧
│   ├── 状態別フィルター
│   └── 介入操作（必要時）
│
├── Parameters (/admin/parameters)
│   ├── パブリック版パラメータ一覧
│   ├── 変更履歴
│   └── 変更提案（Governance経由）
│
├── Emergency (/admin/emergency)
│   ├── パブリック版プロトコル状態
│   ├── Pause履歴
│   └── Emergency Pause操作（Security Council 5/9）
│
├─────────────────────────────────────────────────────────
│ 【ライセンサー業務セクション】← v3.0 追加
├─────────────────────────────────────────────────────────
│
├── **Licensees** (/admin/licensees)  ← 旧 Enterprises
│   ├── 技術譲渡先企業一覧
│   ├── ライセンス状態（Active/Pending/Expired）
│   ├── 新規契約登録
│   └── 検索・フィルター
│
├── **Licensee Detail** (/admin/licensees/[id])
│   ├── 企業基本情報
│   ├── ライセンス契約情報
│   │   ├── 契約期間
│   │   ├── ライセンスタイプ
│   │   └── 更新履歴
│   ├── 技術譲渡状況
│   │   ├── 提供済みコンポーネント
│   │   └── アップデート適用状況
│   ├── 保守チケット履歴
│   ├── 請求・支払い履歴
│   ├── 担当者連絡先
│   ├── 監査レポート履歴 ← v3.1追加
│   └── **ライセンス停止操作** ← v3.1追加（重大違反時）
│
├── **Support Tickets** (/admin/support)
│   ├── チケット一覧（Open/In Progress/Resolved）
│   ├── **Licensee Supportビュー** ← v3.1追加（Enterprise Adminからのチケット）
│   ├── 優先度別フィルター（Critical/High/Normal）
│   ├── 担当者アサイン
│   └── チケット詳細・対応履歴
│
├── **Updates** (/admin/updates)
│   ├── 配信済みアップデート一覧
│   ├── 新規アップデート作成
│   │   ├── バージョン番号
│   │   ├── リリースノート
│   │   └── 対象Licensee選択
│   ├── Licensee別適用状況
│   └── セキュリティアドバイザリ
│
├── **Billing** (/admin/billing)
│   ├── 保守料収益サマリー
│   ├── Licensee別請求一覧
│   ├── 支払い状況（Paid/Pending/Overdue）
│   └── 請求書生成
│
├─────────────────────────────────────────────────────────
│ 【共通セクション】
├─────────────────────────────────────────────────────────
│
├── Team (/admin/team)
│   ├── 管理者一覧
│   ├── 招待・権限管理
│   └── ロール設定（SuperAdmin/Operator/Support/Viewer）
│
├── Audit Log (/admin/audit)
│   ├── 全操作ログ
│   ├── フィルター（操作者、日付、カテゴリ）
│   └── エクスポート
│
└── Settings (/admin/settings)
    ├── システム設定
    ├── 通知設定
    └── ドキュメントリポジトリ設定
```

### 6.4 API一覧

| API | メソッド | 説明 | カテゴリ |
|-----|---------|------|---------|
| **Core** |
| `/api/admin/dashboard` | GET | ダッシュボード | 共通 |
| **パブリック版運営** |
| `/api/admin/provers` | GET | Prover一覧 | 運営 |
| `/api/admin/provers/[id]` | GET | Prover詳細 | 運営 |
| `/api/admin/provers/[id]/approve` | POST | Prover承認 | 運営 |
| `/api/admin/provers/[id]/reject` | POST | Prover却下 | 運営 |
| `/api/admin/monitoring` | GET | 監視データ | 運営 |
| `/api/admin/challenges` | GET | Challenge一覧 | 運営 |
| `/api/admin/parameters` | GET | パラメータ一覧 | 運営 |
| `/api/admin/parameters` | PUT | パラメータ変更 | 運営 |
| `/api/admin/emergency/pause` | POST | Emergency Pause | 運営 |
| `/api/admin/emergency/unpause` | POST | Emergency Unpause | 運営 |
| **ライセンサー業務** |
| `/api/admin/licensees` | GET | Licensee一覧 | ライセンス |
| `/api/admin/licensees` | POST | Licensee登録 | ライセンス |
| `/api/admin/licensees/[id]` | GET | Licensee詳細 | ライセンス |
| `/api/admin/licensees/[id]` | PUT | Licensee更新 | ライセンス |
| `/api/admin/licensees/[id]/license` | POST | ライセンス発行 | ライセンス |
| `/api/admin/licensees/[id]/license/renew` | POST | ライセンス更新 | ライセンス |
| `/api/admin/licensees/[id]/license/suspend` | POST | **ライセンス停止** ← v3.1追加 | ライセンス |
| `/api/admin/licensees/[id]/license/reinstate` | POST | **ライセンス復活** ← v3.1追加 | ライセンス |
| `/api/admin/licensees/[id]/audit-reports` | GET | **監査レポート履歴** ← v3.1追加 | ライセンス |
| `/api/admin/support` | GET | チケット一覧 | サポート |
| `/api/admin/support/licensee` | GET | **Licensee Supportビュー** ← v3.1追加 | サポート |
| `/api/admin/support` | POST | チケット作成 | サポート |
| `/api/admin/support/[id]` | GET | チケット詳細 | サポート |
| `/api/admin/support/[id]` | PUT | チケット更新 | サポート |
| `/api/admin/updates` | GET | アップデート一覧 | サポート |
| `/api/admin/updates` | POST | アップデート配信 | サポート |
| `/api/admin/billing` | GET | 請求サマリー | 収益 |
| `/api/admin/billing/invoices` | GET | 請求書一覧 | 収益 |
| `/api/admin/billing/invoices` | POST | 請求書生成 | 収益 |
| **共通** |
| `/api/admin/team` | GET | チーム一覧 | 共通 |
| `/api/admin/team/invite` | POST | 招待 | 共通 |
| `/api/admin/audit` | GET | 監査ログ | 共通 |

### 6.5 ライセンスタイプ

```
ライセンスタイプ:
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  [Standard License]                                              │
│  - Consumer App                                                  │
│  - Prover運用（最大3ノード）                                     │
│  - Observer運用（最大1ノード）                                   │
│  - 標準保守サポート（営業時間内）                                │
│  - 四半期アップデート                                            │
│                                                                 │
│  [Enterprise License]                                            │
│  - Consumer App                                                  │
│  - Prover運用（無制限）                                          │
│  - Observer運用（無制限）                                        │
│  - 24/7保守サポート                                              │
│  - 優先アップデート                                              │
│  - カスタマイズサポート                                          │
│                                                                 │
│  [Premium License]                                               │
│  - Enterprise License 全機能                                     │
│  - 専任サポート担当者                                            │
│  - オンサイトサポート（年4回）                                   │
│  - ロードマップ共有                                              │
│  - 新機能早期アクセス                                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6.6 保守サポートSLA

```
保守サポートSLA:
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  [優先度: Critical]                                              │
│  - 定義: サービス完全停止、セキュリティインシデント              │
│  - 初回応答: 1時間以内                                           │
│  - 解決目標: 4時間以内                                           │
│                                                                 │
│  [優先度: High]                                                  │
│  - 定義: 主要機能の障害、パフォーマンス深刻劣化                  │
│  - 初回応答: 4時間以内                                           │
│  - 解決目標: 24時間以内                                          │
│                                                                 │
│  [優先度: Normal]                                                │
│  - 定義: 軽微な障害、質問、機能リクエスト                        │
│  - 初回応答: 1営業日以内                                         │
│  - 解決目標: 5営業日以内                                         │
│                                                                 │
│  ※ Enterprise/Premium License は SLA が強化される               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6.7 チェック項目

- [x] 登録フロー: 内部認証（招待制）
- [x] 戻るボタン先: 各詳細画面 → 一覧画面 → Dashboard
- [x] データ入力元: QS Admin操作者
- [x] データ格納先: PostgreSQL (全テーブル参照権限) + L1 Contract (承認操作)
- [x] API: 上記28エンドポイント（パブリック版11 + ライセンサー14 + 共通3）
- [x] ja/en翻訳: dashboard, provers, monitoring, challenges, parameters, emergency, licensees, support, updates, billing, team, audit
- [x] ライセンスタイプ: Standard/Enterprise/Premium の3段階
- [x] 保守SLA: Critical 1h/High 4h/Normal 1bd

---

## 7. Explorer

### 7.1 ユーザーが何をするか

| # | タスク | 説明 | 頻度 |
|---|--------|------|------|
| 1 | プロトコル統計を確認 | TVL、TX数、Prover数 | 高 |
| 2 | 最近のTXを確認 | Lock/Unlock/Claimの履歴 | 高 |
| 3 | Prover一覧を確認 | アクティブProverの情報 | 中 |
| 4 | 特定TXを検索 | lock_id、tx_hashで検索 | 中 |

### 7.2 画面構成

```
Explorer
├── Dashboard (/explorer/dashboard)  ※認証不要
│   ├── KPIカード（TVL、24h TX数、Prover数）
│   ├── TVL推移チャート
│   ├── 最近のTX一覧（10件）
│   └── CTAs: TX検索、Prover一覧
├── Transactions (/explorer/transactions)
│   ├── TX一覧（ページネーション）
│   ├── フィルター（Lock/Unlock/Claim）
│   └── 検索（lock_id, tx_hash）
├── Transaction Detail (/explorer/transactions/[id])
│   ├── TX情報（type, amount, timestamp）
│   ├── アドレス情報（匿名化）
│   └── オンチェーンリンク
├── Provers (/explorer/provers)
│   ├── Prover一覧
│   ├── ステータス別フィルター
│   └── メトリクス（平均応答時間等）
└── Prover Detail (/explorer/provers/[id])
    ├── 公開情報のみ
    ├── Stake額
    └── 署名統計
```

### 7.3 API一覧

| API | メソッド | 説明 | 認証 |
|-----|---------|------|:----:|
| `/api/explorer/stats` | GET | 統計 | 不要 |
| `/api/explorer/transactions` | GET | TX一覧 | 不要 |
| `/api/explorer/transactions/[id]` | GET | TX詳細 | 不要 |
| `/api/explorer/provers` | GET | Prover一覧 | 不要 |
| `/api/explorer/provers/[id]` | GET | Prover詳細 | 不要 |

### 7.4 用語集ページ（ペルソナフィードバック反映）

> **追加画面**: /explorer/glossary

```
用語集（初心者向け）:
┌─────────────────────────────────────────────────────────────────┐
│  [基本用語]                                                      │
│  - Lock: 資産を安全に預けること                                  │
│  - Unlock: 預けた資産を引き出すこと                             │
│  - Claim: アンロック完了後に実際に受け取ること                   │
│  - TVL (Total Value Locked): ロックされている資産の総額          │
│                                                                 │
│  [セキュリティ用語]                                              │
│  - 量子耐性: 量子コンピュータでも解読できない暗号技術            │
│  - Dilithium: 量子耐性署名アルゴリズム（ユーザー側）             │
│  - SPHINCS+: 量子耐性署名アルゴリズム（Prover側）               │
│  - Time Lock: セキュリティのための待機期間                       │
│                                                                 │
│  [ネットワーク用語]                                              │
│  - Prover: 署名を生成するノード運営者                           │
│  - Observer: ネットワークを監視する参加者                       │
│  - Challenge: 不正を報告する仕組み                              │
│  - Slashing: 不正に対するペナルティ                             │
│                                                                 │
│  [ガバナンス用語]                                                │
│  - QS: Quantum Shieldのネイティブトークン                       │
│  - veQS: 投票力トークン（QSをロックして取得）                   │
│  - Proposal: 変更提案                                           │
│  - Quorum: 投票成立に必要な最低参加率                           │
└─────────────────────────────────────────────────────────────────┘
```

### 7.5 期間選択機能（ペルソナフィードバック反映）

```
チャート期間選択:
┌─────────────────────────────────────────────────────────────────┐
│  [TVL推移チャート]                                               │
│  期間: [24h] [7d] [30d] [90d] [1y] [全期間]                     │
│                                                                 │
│  [TX推移チャート]                                                │
│  期間: [24h] [7d] [30d]                                         │
│  グループ: [時間] [日] [週]                                      │
│                                                                 │
│  デフォルト: 7d                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 7.6 チェック項目

- [x] 登録フロー: 不要（認証なし）
- [x] 戻るボタン先: 詳細 → 一覧 → Dashboard
- [x] データ入力元: なし（読み取り専用）
- [x] データ格納先: なし（参照のみ）
- [x] API: 上記5エンドポイント
- [x] ja/en翻訳: dashboard, transactions, provers, glossary
- [x] 用語集: 初心者向け説明ページを追加
- [x] 期間選択: チャートに期間フィルターを追加

---

## 更新履歴

| Date | Author | Changes |
|------|--------|---------|
| 2026-01-24 | CTOエージェント | 初版作成 |
| 2026-01-24 | CTOエージェント | v1.1: ペルソナフィードバック反映 |
| 2026-01-24 | CTOエージェント | **v2.0**: Token Hub + Governance → QS Hub 統合（戦略会議8-0-3可決）, Enterprise ビジネスモデル修正（承認済パートナー向けサービス、Whitelist→Watchlist名称変更）, API Key保護・GDPRポリシー追加 |
