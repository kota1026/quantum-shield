# Quantum Shield 設計仕様書

> **Document Version**: 2.0
> **Last Updated**: 2026-01-21
> **Purpose**: 画面・API・DBの整合性を担保し、サービスローンチを実現するための設計基盤

---

## 目次

1. [登場人物一覧](#1-登場人物一覧)
2. [アクター別アクション一覧](#2-アクター別アクション一覧)
3. [シーケンス対応表](#3-シーケンス対応表)
4. [画面遷移図](#4-画面遷移図) ← **NEW: サービスローンチ必須**
5. [画面×ジャーニー×APIマッピング](#5-画面ジャーニーapiマッピング)
6. [DB/データ設計](#6-dbデータ設計)
7. [規制対応要件](#7-規制対応要件)
8. [Gap分析結果](#8-gap分析結果)
9. [優先度付き対応リスト](#9-優先度付き対応リスト)
10. [ペルソナレビュー結果](#10-ペルソナレビュー結果)

---

## 1. 登場人物一覧

| # | 登場人物 | 説明 | 関連シーケンス | 主要画面 |
|---|----------|------|----------------|----------|
| 1 | Consumer | 一般ユーザー（資産ロック/アンロック） | #1, #2, #3, #3' | Consumer App |
| 2 | Prover | 証明者（署名サービス事業者） | #2, #4, #5, #6, #13, #14 | Prover Portal |
| 3 | Observer | 監視者（不正検知・Challenge） | #2, #4, #9, #10, #15, #16 | Observer |
| 4 | Token Holder | QSトークン保有者（ガバナンス参加） | #7, #17, #18, #19, #20 | Token Hub, Governance |
| 5 | Enterprise Admin | 企業管理者（SaaS版運営） | #11, #12, #21, #22, #23 | Enterprise Admin |
| 6 | QS Foundation Admin | 財団スタッフ | #4, #5, #8, #11, #12, #24, #25, #26, #27 | QS Admin |
| 7 | Security Council | セキュリティ評議会（9名） | #7, #8, #28 | Governance |
| 8 | Purpose Committee | 理念委員会（5名） | #7, #29 | Governance |

---

## 2. アクター別アクション一覧

> 各アクターの「目的」「できること」「必要なシーケンス」を体系的に整理

### 2.1 Consumer（一般ユーザー）

| 項目 | 内容 |
|------|------|
| **目的** | ETHなどの資産を量子コンピュータ攻撃から守りたい |
| **動機** | 秘密鍵流出リスクなく長期保管したい |
| **ペルソナ** | 田中さん（32歳、技術レベル★★☆☆☆） |
| **主要デバイス** | スマートフォン（通勤中にチェック） |

#### アクション一覧

| カテゴリ | アクション | シーケンス | API | 備考 |
|---------|-----------|:----------:|-----|------|
| **登録** | ウォレット接続→SIWE認証 | - | `/auth/*` | 暗黙的 |
| **登録** | Dilithium鍵生成・登録 | - | `/user/keys` | Onboarding時 |
| **登録** | 利用規約同意 | - | `/user/terms` | 記録必須 |
| **コア** | 資産ロック | #1 | `/lock` | ✅ |
| **コア** | 資産アンロック（通常） | #2 | `/unlock` | ✅ |
| **コア** | 資産アンロック（緊急） | #3 | `/unlock/emergency` | ✅ |
| **復旧** | 再同期（Resync） | #3' | `/resync` | エラー時 |
| **閲覧** | 履歴確認 | - | `/user/transactions` | 読取のみ |
| **閲覧** | 通知確認 | - | `/user/notifications` | ❌ API無し |
| **設定** | Dilithium鍵管理 | - | `/user/keys` | 追加・失効 |
| **設定** | 通知設定 | - | `/user/settings` | メール・プッシュ |
| **設定** | 言語設定 | - | `/user/settings` | ja/en |
| **退会** | アカウント削除 | - | `DELETE /user` | GDPR対応 |

#### 設定機能詳細

```
Consumer App 設定画面
├── セキュリティ
│   ├── Dilithium鍵管理（一覧、追加、失効）
│   ├── アクティブセッション確認
│   └── ログアウト
├── 通知
│   ├── メール通知 ON/OFF
│   ├── プッシュ通知 ON/OFF（モバイル）
│   └── 通知対象選択（Lock完了、Unlock待機、緊急アラート）
├── 表示
│   ├── 言語（日本語/English）
│   ├── 通貨表示（USD/JPY/ETH）
│   └── テーマ（ダーク/ライト）※将来
└── アカウント
    ├── 接続ウォレット確認
    ├── 利用規約
    ├── プライバシーポリシー
    └── アカウント削除
```

---

### 2.2 Prover（証明者）

| 項目 | 内容 |
|------|------|
| **目的** | 署名サービスを提供して報酬を得たい |
| **動機** | $400K+のステークで参入し、安定収益を得る |
| **ペルソナ** | 山田さん（45歳、技術レベル★★★★★） |
| **主要デバイス** | PC（ダッシュボードを常時監視） |

#### アクション一覧

| カテゴリ | アクション | シーケンス | API | 備考 |
|---------|-----------|:----------:|-----|------|
| **登録** | 要件確認 | - | - | $400K+、HSM、2-of-3 |
| **登録** | 申請フォーム入力 | #5 | `/prover/register` | ✅ |
| **登録** | KYB書類提出 | #5 | `/prover/kyb` | ❌ API無し |
| **登録** | ステーク（ETH送金） | #5 | L1 Contract | オンチェーン |
| **登録** | 審査待ち・結果確認 | #5 | `/prover/:id/status` | |
| **日常** | 署名キュー確認 | #13 | `/prover/:id/queue` | ✅ |
| **日常** | 署名要求処理（HSM署名） | #13 | `/prover/:id/sign` | ✅ |
| **日常** | メトリクス確認 | - | `/prover/:id/metrics` | 読取のみ |
| **日常** | アラート確認・対応 | - | `/prover/:id/alerts` | ✅ |
| **防御** | チャレンジ詳細確認 | #4 | `/challenge/:id` | ✅ |
| **防御** | 防御証拠提出 | #4 | `/challenge/:id/defense` | 48h以内 |
| **報酬** | 報酬残高確認 | - | `/prover/:id/rewards` | 読取のみ |
| **報酬** | 報酬Claim | #14 | `/prover/:id/claim` | ❌ API無し |
| **退出** | 退出申請 | #6 | `/prover/:id/exit` | ✅ |
| **退出** | Stake引出 | #6 | L1 Contract | 7日後 |

#### 設定機能詳細

```
Prover Portal 設定画面
├── ノード設定
│   ├── SPHINCS+公開鍵管理
│   ├── HSM接続設定
│   ├── エンドポイントURL
│   └── バックアップノード設定
├── アラート
│   ├── 通知先（メール、Webhook、Slack）
│   ├── アラート閾値設定（稼働率、レスポンス時間）
│   └── 緊急連絡先
├── 運用
│   ├── 自動署名 ON/OFF
│   ├── メンテナンスモード
│   └── ログレベル設定
├── KYB
│   ├── 法人情報確認・更新
│   ├── 書類再提出
│   └── UBO情報更新
└── アカウント
    ├── 管理者追加/削除
    ├── 2FA設定
    └── APIキー管理
```

---

### 2.3 Observer（監視者）

| 項目 | 内容 |
|------|------|
| **目的** | 不正を検知してシステムを守り、報酬を得たい |
| **動機** | VRF抽選で選ばれ、成功報酬（60%）を獲得 |
| **ペルソナ** | 小林さん（35歳、技術レベル★★★★☆） |
| **主要デバイス** | PC（監視ダッシュボード） |

#### アクション一覧

| カテゴリ | アクション | シーケンス | API | 備考 |
|---------|-----------|:----------:|-----|------|
| **登録** | 要件確認 | - | `/observer/requirements` | ❌ API無し |
| **登録** | 申請フォーム入力 | #9 | `/observer/register` | ❌ API無し |
| **登録** | ステーク（ETH送金） | #9 | L1 Contract | オンチェーン |
| **日常** | ペンディングUnlock一覧確認 | - | `/observer/pending-unlocks` | ✅ |
| **日常** | Dilithium署名検証実行 | #15 | `/observer/verify` | ❌ API無し |
| **日常** | 不審tx一覧確認 | - | `/observer/suspicious-txs` | ✅ |
| **日常** | Challenge提出 | #15 | `/challenge/submit` | Bond支払い |
| **日常** | Challenge結果確認 | - | `/challenge/:id` | |
| **報酬** | 報酬残高確認 | - | `/observer/earnings` | ✅ |
| **報酬** | 報酬Claim | #16 | `/observer/claim` | ❌ API無し |
| **履歴** | 過去Challenge履歴 | - | `/observer/history` | ✅ |
| **退出** | 退出申請 | #10 | `/observer/:id/exit` | ❌ API無し |
| **退出** | Stake引出 | #10 | L1 Contract | 7日後 |

#### 設定機能詳細

```
Observer 設定画面
├── 監視設定
│   ├── 自動検証 ON/OFF
│   ├── 検証間隔設定
│   └── 検証対象フィルタ
├── 通知
│   ├── Webhook URL
│   ├── メール通知
│   └── 不審tx検知時の即時通知
├── Challenge
│   ├── 自動Challenge提出 ON/OFF
│   ├── Bond自動支払い上限
│   └── 確信度閾値
└── アカウント
    ├── エイリアス（任意）
    ├── 連絡先メール（任意）
    └── ステータス確認
```

---

### 2.4 Token Holder（トークン保有者）

| 項目 | 内容 |
|------|------|
| **目的** | $QSを保有してガバナンスに参加し、報酬を得たい |
| **動機** | プロトコルの方向性に影響を与えたい、ステーク報酬を得たい |
| **ペルソナ** | 鈴木さん（28歳、技術レベル★★★★☆）、渡辺さん（42歳、Delegate） |
| **主要デバイス** | PC / スマートフォン |

#### アクション一覧（Token Hub）

| カテゴリ | アクション | シーケンス | API | 備考 |
|---------|-----------|:----------:|-----|------|
| **参加** | ウォレット接続・残高確認 | - | `/token-hub/dashboard` | ✅ |
| **ステーク** | $QSロック→veQS獲得 | #17 | `/token-hub/lock` | ✅ |
| **ステーク** | ロック期間延長 | #17 | `/token-hub/extend` | ❌ API無し |
| **アンステーク** | veQS→$QS返還 | #18 | `/token-hub/unstake` | ❌ API無し |
| **デリゲート** | 投票権委任 | #19 | `/token-hub/delegate` | ✅ |
| **デリゲート** | 委任解除 | #19 | `/token-hub/undelegate` | ❌ API無し |
| **報酬** | 報酬残高確認 | - | `/token-hub/rewards` | ✅ |
| **報酬** | 報酬Claim | #20 | `/token-hub/claim` | ✅ |
| **閲覧** | 履歴確認 | - | `/token-hub/history` | ❌ API無し |
| **閲覧** | デリゲート先一覧 | - | `/token-hub/delegates` | ✅ |

#### アクション一覧（Governance）

| カテゴリ | アクション | シーケンス | API | 備考 |
|---------|-----------|:----------:|-----|------|
| **閲覧** | 提案一覧確認 | - | `/governance/proposals` | ✅ |
| **閲覧** | 提案詳細確認 | - | `/governance/proposals/:id` | ✅ |
| **投票** | 賛成/反対投票 | #7 | `/governance/vote` | ✅ |
| **提案** | 新規提案作成 | #7 | `/governance/proposals` | ✅ |
| **提案** | 提案実行（Execute） | #7 | `/governance/execute` | ✅ |
| **閲覧** | 自分の投票履歴 | - | `/governance/activity` | ✅ |

#### 設定機能詳細

```
Token Hub 設定画面
├── ステーク
│   ├── 自動再ステーク ON/OFF
│   └── ロック期間プリセット
├── 通知
│   ├── 新規提案通知
│   ├── 投票締切リマインダー
│   └── 報酬発生通知
├── 委任
│   ├── デフォルト委任先設定
│   └── 委任履歴確認
└── 表示
    ├── veQS減衰グラフ表示
    └── 報酬APY表示
```

---

### 2.5 Enterprise Admin（企業管理者）

| 項目 | 内容 |
|------|------|
| **目的** | 自社サービスにQuantum Shieldを組み込み、ユーザーに提供したい |
| **動機** | カストディ/ウォレットサービスの差別化、セキュリティ強化 |
| **ペルソナ** | 佐藤さん（38歳、技術レベル★★★★☆） |
| **主要デバイス** | PC（長時間ダッシュボード監視） |

#### アクション一覧

| カテゴリ | アクション | シーケンス | API | 備考 |
|---------|-----------|:----------:|-----|------|
| **申請** | プラン選択 | #11 | - | Starter/Business/Enterprise |
| **申請** | KYB情報入力 | #11 | `/enterprise/apply` | |
| **申請** | 契約書署名 | #11 | `/enterprise/:id/contract` | |
| **申請** | オンボーディング完了 | #11 | `/enterprise/:id/onboard` | |
| **ユーザー** | ユーザー一覧確認 | - | `/enterprise/:id/users` | ✅ |
| **ユーザー** | ユーザー詳細確認 | - | `/enterprise/:id/users/:uid` | ✅ |
| **ユーザー** | ユーザー制限・停止 | #21 | `/enterprise/:id/users/:uid/restrict` | ❌ API無し |
| **トランザクション** | 一覧・詳細確認 | - | `/enterprise/:id/transactions` | ✅ |
| **API** | APIキー発行 | #22 | `/enterprise/:id/api-keys` | ✅ |
| **API** | APIキー失効・ローテーション | #22 | `/enterprise/:id/api-keys/:kid` | |
| **Webhook** | Webhook設定 | - | `/enterprise/:id/webhooks` | ❌ API無し |
| **Webhook** | Webhookテスト | - | `/enterprise/:id/webhooks/test` | ❌ API無し |
| **チーム** | メンバー招待 | #23 | `/enterprise/:id/members/invite` | ❌ API無し |
| **チーム** | ロール変更 | #23 | `/enterprise/:id/members/:mid` | ❌ API無し |
| **チーム** | メンバー削除 | #23 | `/enterprise/:id/members/:mid` | ❌ API無し |
| **レポート** | 監査ログ確認 | - | `/enterprise/:id/audit-logs` | ✅ |
| **レポート** | 利用状況レポート | - | `/enterprise/:id/reports` | ❌ API無し |
| **課金** | 請求確認 | - | `/enterprise/:id/billing` | ❌ API無し |
| **解約** | 解約申請 | #12 | `/enterprise/:id/terminate` | |

#### 設定機能詳細

```
Enterprise Admin 設定画面
├── 会社情報
│   ├── 法人情報確認・更新
│   ├── 請求先住所
│   └── 連絡先メール
├── セキュリティ
│   ├── IPホワイトリスト
│   ├── 2FA必須設定
│   └── セッションタイムアウト
├── API
│   ├── レート制限設定
│   ├── 許可エンドポイント
│   └── APIバージョン選択
├── Webhook
│   ├── URLリスト管理
│   ├── イベント種別選択
│   ├── リトライ設定
│   └── シークレット管理
├── 通知
│   ├── アラート通知先
│   ├── 日次/週次レポート
│   └── 課金アラート閾値
├── ブランディング（将来）
│   ├── ロゴ設定
│   ├── カラーテーマ
│   └── カスタムドメイン
└── プラン
    ├── 現在のプラン確認
    ├── プラン変更
    └── 解約
```

---

### 2.6 QS Foundation Admin（財団管理者）

| 項目 | 内容 |
|------|------|
| **目的** | Quantum Shieldプロトコル全体を健全に運営したい |
| **動機** | プロトコルの成長、セキュリティ維持、収益管理 |
| **ペルソナ** | 高橋さん（40歳、技術レベル★★★★★） |
| **主要デバイス** | PC |

#### アクション一覧（パブリック版管理）

| カテゴリ | アクション | シーケンス | API | 備考 |
|---------|-----------|:----------:|-----|------|
| **ユーザー** | ユーザー一覧・詳細 | - | `/admin/users` | ❌ API無し |
| **ユーザー** | 制裁チェック実行 | - | `/admin/users/:id/sanction-check` | ❌ API無し |
| **Prover** | 申請一覧確認 | - | `/admin/provers/applications` | △ 部分的 |
| **Prover** | 申請承認/却下 | #24 | `/admin/provers/:id/approve` | ❌ API無し |
| **Prover** | Prover監視 | - | `/admin/provers/:id/metrics` | |
| **Observer** | Observer一覧・監視 | - | `/admin/observers` | ❌ API無し |
| **Challenge** | Challenge一覧確認 | - | `/admin/challenges` | ❌ API無し |
| **Challenge** | Slash実行 | #25 | `/admin/challenges/:id/slash` | ❌ API無し |
| **ガバナンス** | 提案状況監視 | - | `/governance/proposals` | ✅ |
| **トレジャリー** | 残高確認 | - | `/treasury/balance` | ✅ |
| **トレジャリー** | 出金承認 | #27 | `/treasury/withdraw` | ✅ |

#### アクション一覧（SaaS版管理）

| カテゴリ | アクション | シーケンス | API | 備考 |
|---------|-----------|:----------:|-----|------|
| **Enterprise** | 申請一覧確認 | - | `/admin/enterprises/applications` | ❌ API無し |
| **Enterprise** | 申請承認/却下 | #26 | `/admin/enterprises/:id/approve` | ❌ API無し |
| **Enterprise** | 契約状況確認 | - | `/admin/enterprises/:id/contract` | ❌ API無し |
| **課金** | 請求書発行 | - | `/admin/billing/invoices` | ❌ API無し |
| **課金** | 入金確認 | - | `/admin/billing/payments` | ❌ API無し |
| **SLA** | 稼働率監視 | - | `/admin/sla/metrics` | ❌ API無し |

#### アクション一覧（システム管理）

| カテゴリ | アクション | シーケンス | API | 備考 |
|---------|-----------|:----------:|-----|------|
| **スタッフ** | スタッフ追加 | - | `/admin/staff` | ❌ API無し |
| **スタッフ** | ロール変更 | - | `/admin/staff/:id` | ❌ API無し |
| **監査** | 監査ログ確認 | - | `/admin/audit-logs` | ❌ API無し |
| **緊急** | Emergency Pause | #8 | `/emergency/pause` | ✅ |
| **緊急** | Emergency Unpause | #8 | `/emergency/unpause` | ✅ |

#### 設定機能詳細

```
QS Admin 設定画面
├── システム
│   ├── メンテナンスモード ON/OFF
│   ├── 新規登録受付 ON/OFF
│   └── APIレート制限グローバル設定
├── セキュリティ
│   ├── 管理者IPホワイトリスト
│   ├── MFA必須設定
│   └── セッション管理
├── 通知
│   ├── Slack連携
│   ├── PagerDuty連携
│   └── アラート閾値設定
├── 監査
│   ├── ログ保持期間
│   ├── エクスポート設定
│   └── 外部SIEM連携
└── 緊急対応
    ├── Emergency Pause 権限者設定
    └── エスカレーションフロー
```

---

### 2.7 Security Council（セキュリティ評議会 - 9名）

| 項目 | 内容 |
|------|------|
| **目的** | プロトコルのセキュリティを最終防衛線として守りたい |
| **動機** | 重大バグ/攻撃時の緊急対応、悪意ある提案の阻止 |
| **ペルソナ** | 伊藤さん（52歳、技術レベル★★★★★） |
| **主要デバイス** | PC / モバイル（緊急時） |

#### アクション一覧

| カテゴリ | アクション | シーケンス | API | 備考 |
|---------|-----------|:----------:|-----|------|
| **緊急** | Emergency Pause提案作成 | #8 | `/council/pause/propose` | |
| **緊急** | Pause提案への署名 | #8 | `/council/pause/:id/sign` | 5/9必要 |
| **緊急** | Pause実行 | #8 | `/council/pause/:id/execute` | |
| **Veto** | Veto提案作成 | #28 | `/council/veto/propose` | |
| **Veto** | Veto提案への署名 | #28 | `/council/veto/:id/sign` | 6/9必要 |
| **Veto** | Veto実行 | #28 | `/council/veto/:id/execute` | |
| **監視** | アラート確認 | - | `/council/alerts` | |
| **監視** | 提案セキュリティレビュー | - | `/governance/proposals/:id` | |

#### 設定機能詳細

```
Security Council 設定画面
├── 署名
│   ├── 署名キー管理（ハードウェアウォレット連携）
│   ├── マルチシグ設定確認
│   └── 署名有効期限設定
├── 通知
│   ├── 緊急アラート通知先（メール、SMS、Telegram）
│   ├── 新規提案通知
│   └── 署名リクエスト通知
├── セキュリティ
│   ├── 2FA設定
│   ├── セッション管理
│   └── ログイン履歴
└── 表示
    ├── 署名進捗ダッシュボード
    └── アラート優先度フィルタ
```

---

### 2.8 Purpose Committee（理念委員会 - 5名）

| 項目 | 内容 |
|------|------|
| **目的** | プロトコルの理念に沿った運営を維持したい |
| **動機** | Core Principles違反の提案を事前に阻止 |
| **ペルソナ** | 中村さん（48歳、技術レベル★★★☆☆） |
| **主要デバイス** | PC |

#### アクション一覧

| カテゴリ | アクション | シーケンス | API | 備考 |
|---------|-----------|:----------:|-----|------|
| **審査** | 新規提案確認 | #29 | `/committee/proposals/pending` | |
| **審査** | 理念適合性判断 | #29 | - | Core Principles照合 |
| **審査** | 提案承認 | #29 | `/committee/proposals/:id/approve` | |
| **審査** | 提案却下 | #29 | `/committee/proposals/:id/reject` | Bond返還 |
| **意見** | 提案へのコメント | - | `/governance/proposals/:id/comments` | |

#### 設定機能詳細

```
Purpose Committee 設定画面
├── 審査
│   ├── Core Principles参照設定
│   ├── 審査テンプレート管理
│   └── 却下理由テンプレート
├── 通知
│   ├── 新規提案通知
│   ├── 審査期限リマインダー
│   └── 他委員の判断通知
├── コミュニケーション
│   ├── 委員間チャット設定
│   └── 提案者への連絡設定
└── 履歴
    ├── 過去の判断履歴検索
    └── 議事録アーカイブ
```

---

## 3. シーケンス対応表

| # | シーケンス | 登場アクター | 関連画面 | 関連API |
|---|-----------|-------------|----------|---------|
| 1 | Lock | Consumer, L3, L1 | Consumer Lock系 | `/lock` |
| 2 | Unlock (Normal) | Consumer, L3, VRF, Prover, L1, 監視ボット | Consumer Unlock系 | `/unlock` |
| 3 | Unlock (Emergency) | Consumer, L3, L1, 監視ボット | Emergency Unlock | `/unlock/emergency` |
| 3' | Resync | Consumer, L3, L1 | (未実装) | `/resync` |
| 4 | Challenge + Slashing | 監視ボット, Challenger, L1, Prover | Observer, Prover | `/challenge/*` |
| 5 | Prover Registration | Prover候補, L1, L3, Governance | Prover Register | `/prover/register` |
| 6 | Prover Exit | Prover, L1, L3 | Prover Dashboard | `/prover/:id/exit` |
| 7 | Governance Proposal | Proposer, Governance, Purpose, Security, Holders | Governance | `/governance/*` |
| 8 | Emergency Pause | Security Council, L1/L3, Token Holders | Admin Emergency | `/emergency/*` |
| 9 | Observer Registration | Observer候補, L1, Backend | Observer Landing/Application | `/observer/register` |
| 10 | Observer Exit | Observer, L1, Backend | Observer Settings | `/observer/:id/exit` |
| 11 | Enterprise Application | Enterprise候補, QS Admin | Enterprise Apply系 | `/enterprise/apply` |
| 12 | Enterprise Termination | Enterprise Admin, QS Admin | Enterprise Settings | `/enterprise/:id/terminate` |
| 13 | Prover Signing | Prover, Consumer, L3 | Prover Queue | `/prover/:id/sign` |
| 14 | Prover Rewards Claim | Prover, L1 | Prover Dashboard | `/prover/:id/claim` |
| 15 | Observer Verification & Challenge | Observer, L1, Prover | Observer Dashboard | `/challenge/submit` |
| 16 | Observer Rewards Claim | Observer, L1 | Observer Earnings | `/observer/claim` |
| 17 | Token Staking | Token Holder, L1 | Token Hub Lock | `/token-hub/lock` |
| 18 | Token Unstaking | Token Holder, L1 | Token Hub Unstake | `/token-hub/unstake` |
| 19 | Token Delegation | Token Holder, L1 | Token Hub Delegate | `/token-hub/delegate` |
| 20 | Token Rewards Claim | Token Holder, L1 | Token Hub Claim | `/token-hub/claim` |
| 21 | Enterprise User Management | Enterprise Admin | Enterprise Users | `/enterprise/:id/users/*` |
| 22 | Enterprise API Key Management | Enterprise Admin | Enterprise API | `/enterprise/:id/api-keys` |
| 23 | Enterprise Team Management | Enterprise Admin | Enterprise Members | `/enterprise/:id/members/*` |
| 24 | QS Admin Prover Approval | QS Admin, Prover候補 | Admin Provers | `/admin/provers/:id/approve` |
| 25 | QS Admin Slash Execution | QS Admin, Challenge Winner | Admin Challenges | `/admin/challenges/:id/slash` |
| 26 | QS Admin Enterprise Approval | QS Admin, Enterprise候補 | Admin Enterprises | `/admin/enterprises/:id/approve` |
| 27 | Treasury Withdrawal | QS Admin, Security Council | Admin Treasury | `/treasury/withdraw` |
| 28 | Security Council Veto | Security Council, Governance | Governance | `/council/veto/*` |
| 29 | Purpose Committee Review | Purpose Committee, Proposer | Governance | `/committee/proposals/*` |

---

### 3.1 アクター別登録・退会シーケンス

### 3.1.1 Consumer（一般ユーザー）

#### 登録シーケンス（SIWE認証）

```
User                     Frontend              Backend API           Database
  │                         │                       │                    │
  │──(1) Connect Wallet────►│                       │                    │
  │                         │                       │                    │
  │◄──(2) Nonce Request─────│──(3) GET /auth/nonce──►│                   │
  │                         │                       │──(4) Nonce生成────►│
  │                         │                       │   {nonce, expiry}  │
  │                         │◄─────────────────────│                    │
  │◄────────────────────────│                       │                    │
  │   {nonce}               │                       │                    │
  │                         │                       │                    │
  │──(5) Sign Message───────►│                       │                    │
  │   (SIWE format)         │                       │                    │
  │                         │                       │                    │
  │                         │──(6) POST /auth/siwe──►│                   │
  │                         │   {message,           │                    │
  │                         │    signature}         │                    │
  │                         │                       │                    │
  │                         │                 ┌─────┴─────┐              │
  │                         │                 │ 検証      │              │
  │                         │                 │ ・署名    │              │
  │                         │                 │ ・nonce   │              │
  │                         │                 │ ・expiry  │              │
  │                         │                 │ ・domain  │              │
  │                         │                 └─────┬─────┘              │
  │                         │                       │                    │
  │                         │                       │  [新規ユーザー]    │
  │                         │                       │──(7) User作成─────►│
  │                         │                       │   {wallet_address, │
  │                         │                       │    created_at}     │
  │                         │                       │                    │
  │                         │◄──(8) JWT発行─────────│                    │
  │                         │   {access_token,      │                    │
  │                         │    refresh_token}     │                    │
  │                         │                       │                    │
  │◄──(9) 認証完了──────────│                       │                    │
  │   → Dashboard           │                       │                    │
  │                         │                       │                    │
  │   [初回ログイン時]      │                       │                    │
  │                         │                       │                    │
  │◄──(10) Onboarding───────│                       │                    │
  │   ・利用規約同意        │                       │                    │
  │   ・Dilithium鍵生成     │                       │                    │
  │   ・通知設定            │                       │                    │
  │                         │                       │                    │
  │──(11) 規約同意──────────►│──(12) POST /user/terms─►│                  │
  │   {version,             │                       │──(13) 記録────────►│
  │    accepted_at,         │                       │   {user_id,        │
  │    ip_hash}             │                       │    version,        │
  │                         │                       │    accepted_at,    │
  │                         │                       │    ip_hash}        │
  │                         │                       │                    │
  │──(14) Dilithium鍵生成───►│──(15) POST /user/keys──►│                  │
  │   (クライアント側生成)   │                       │──(16) 公開鍵保存──►│
  │                         │                       │   {pk_dilithium}   │
  │                         │                       │                    │
  │◄──(17) 設定完了─────────│                       │                    │
  │   → Dashboard           │                       │                    │
```

**登録データ**:
```
users:
  - id: UUID
  - wallet_address: VARCHAR(42)
  - country_code: VARCHAR(2)          # GeoIP検出
  - is_sanctioned_checked: BOOLEAN    # 制裁リスト照合済み
  - terms_accepted_at: TIMESTAMP
  - terms_version: VARCHAR(10)
  - created_at: TIMESTAMP

user_dilithium_keys:
  - id: UUID
  - user_id: UUID (FK)
  - pk_dilithium: BYTEA
  - created_at: TIMESTAMP
  - revoked_at: TIMESTAMP
```

**必要API**:
| メソッド | エンドポイント | 状況 |
|----------|---------------|:----:|
| GET | `/auth/nonce` | ✅ |
| POST | `/auth/siwe` | ✅ |
| POST | `/user/terms` | ❌ 要追加 |
| POST | `/user/keys` | ✅ |

---

#### 退会シーケンス（アカウント削除）

```
User                     Frontend              Backend API           Database
  │                         │                       │                    │
  │──(1) 設定 > アカウント削除─►│                       │                    │
  │                         │                       │                    │
  │◄──(2) 確認ダイアログ────│                       │                    │
  │   ・ロック中資産の確認  │                       │                    │
  │   ・削除の影響説明      │                       │                    │
  │                         │                       │                    │
  │   [ロック中資産あり]    │                       │                    │
  │◄──(3a) エラー表示───────│                       │                    │
  │   「先にアンロック要」  │                       │                    │
  │                         │                       │                    │
  │   [ロック中資産なし]    │                       │                    │
  │──(4) 削除確認───────────►│                       │                    │
  │   (ウォレット署名)      │                       │                    │
  │                         │                       │                    │
  │                         │──(5) DELETE /user─────►│                   │
  │                         │   {signature}         │                    │
  │                         │                       │                    │
  │                         │                 ┌─────┴─────┐              │
  │                         │                 │ 検証      │              │
  │                         │                 │ ・署名    │              │
  │                         │                 │ ・残高0   │              │
  │                         │                 └─────┬─────┘              │
  │                         │                       │                    │
  │                         │                       │──(6) 論理削除─────►│
  │                         │                       │   deleted_at設定   │
  │                         │                       │   (GDPR対応)       │
  │                         │                       │                    │
  │                         │◄──(7) 削除完了─────────│                    │
  │                         │                       │                    │
  │◄──(8) ログアウト────────│                       │                    │
  │   → Landing             │                       │                    │
```

**注意事項**:
- GDPR対応のため、30日間の猶予期間を設け、その後完全削除
- 監査ログは保持（匿名化）
- トランザクション履歴はブロックチェーン上に残存

---

### 3.1.2 Observer（監視者）

#### 登録シーケンス（⚠️ 現在未実装）

```
Observer候補             Frontend              Backend API           L1 Staking         Database
  │                         │                       │                    │                  │
  │──(1) Connect Wallet────►│                       │                    │                  │
  │                         │                       │                    │                  │
  │──(2) 「Observerになる」──►│                       │                    │                  │
  │                         │                       │                    │                  │
  │◄──(3) 要件説明画面──────│                       │                    │                  │
  │   ・最低ステーク: X ETH │                       │                    │                  │
  │   ・報酬構造説明        │                       │                    │                  │
  │   ・監視義務説明        │                       │                    │                  │
  │                         │                       │                    │                  │
  │──(4) 申請開始───────────►│                       │                    │                  │
  │                         │                       │                    │                  │
  │◄──(5) 登録フォーム──────│                       │                    │                  │
  │                         │                       │                    │                  │
  │──(6) 情報入力───────────►│                       │                    │                  │
  │   {entity_type,         │                       │                    │                  │
  │    alias (optional),    │                       │                    │                  │
  │    email (optional),    │                       │                    │                  │
  │    notification_webhook,│                       │                    │                  │
  │    country_code}        │                       │                    │                  │
  │                         │                       │                    │                  │
  │   [entity_type == company && ステーク高額]       │                    │                  │
  │──(7) KYB情報入力────────►│                       │                    │                  │
  │   {legal_name,          │                       │                    │                  │
  │    registration_number, │                       │                    │                  │
  │    ...}                 │                       │                    │                  │
  │                         │                       │                    │                  │
  │──(8) 規約同意───────────►│──(9) POST /observer/register─►│            │                  │
  │   {terms_version,       │   {registration_data} │                    │                  │
  │    signature}           │                       │                    │                  │
  │                         │                       │──(10) 制裁チェック───────────────────►│
  │                         │                       │   (GeoIP, OFAC)    │                  │
  │                         │                       │                    │                  │
  │                         │                       │   [制裁対象]       │                  │
  │                         │◄──(11a) 拒否──────────│                    │                  │
  │◄────────────────────────│                       │                    │                  │
  │                         │                       │                    │                  │
  │                         │                       │   [OK]             │                  │
  │                         │                       │──(11b) 仮登録─────────────────────────►│
  │                         │                       │   status='pending' │                  │
  │                         │                       │                    │                  │
  │                         │◄──(12) ステーク要求───│                    │                  │
  │◄────────────────────────│                       │                    │                  │
  │                         │                       │                    │                  │
  │──(13) ステーク送金──────────────────────────────────────────────────►│                  │
  │   registerObserver()    │                       │                    │                  │
  │   {stake_amount}        │                       │            ┌───────┴───────┐          │
  │                         │                       │            │ ステーク検証  │          │
  │                         │                       │            │ ・最低額確認  │          │
  │                         │                       │            │ ・Observer登録│          │
  │                         │                       │            └───────┬───────┘          │
  │                         │                       │                    │                  │
  │                         │                       │◄──(14) Event通知───│                  │
  │                         │                       │   ObserverRegistered                  │
  │                         │                       │                    │                  │
  │                         │                       │──(15) Status更新───────────────────────►│
  │                         │                       │   status='active'  │                  │
  │                         │                       │                    │                  │
  │                         │◄──(16) 登録完了───────│                    │                  │
  │◄────────────────────────│                       │                    │                  │
  │   → Observer Dashboard  │                       │                    │                  │
```

**登録データ**:
```
observers:
  - id: UUID
  - wallet_address: VARCHAR(42)
  - entity_type: VARCHAR(20)          # individual / company
  - alias: VARCHAR(100)               # 任意
  - email: VARCHAR(255)               # 任意（通知用）
  - country_code: VARCHAR(2)
  - stake_amount: DECIMAL(36, 18)
  - status: VARCHAR(20)               # pending / active / exiting / exited
  - notification_webhook: VARCHAR(500)
  - terms_accepted_at: TIMESTAMP
  - terms_version: VARCHAR(10)
  - total_challenges: INTEGER
  - successful_challenges: INTEGER
  - total_earnings: DECIMAL(36, 18)
  - created_at: TIMESTAMP
  - approved_at: TIMESTAMP

# 法人Observerの場合（高額ステーク時）
observer_kyb:
  - id: UUID
  - observer_id: UUID (FK)
  - legal_name: VARCHAR(255)
  - registration_number: VARCHAR(100)
  - country: VARCHAR(2)
  - kyb_status: VARCHAR(20)
  - created_at: TIMESTAMP
```

**必要API（⚠️ すべて未実装）**:
| メソッド | エンドポイント | 状況 |
|----------|---------------|:----:|
| GET | `/observer/requirements` | ❌ 要追加 |
| POST | `/observer/register` | ❌ 要追加 |
| GET | `/observer/application/:id` | ❌ 要追加 |
| POST | `/observer/stake` | ❌ 要追加 |

---

#### 退出シーケンス

```
Observer                 Frontend              Backend API           L1 Staking         Database
  │                         │                       │                    │                  │
  │──(1) 設定 > 退出申請───►│                       │                    │                  │
  │                         │                       │                    │                  │
  │◄──(2) 確認ダイアログ───│                       │                    │                  │
  │   ・未解決Challenge確認 │                       │                    │                  │
  │   ・7日Unbonding説明    │                       │                    │                  │
  │   ・報酬受取確認        │                       │                    │                  │
  │                         │                       │                    │                  │
  │   [未解決Challenge有]   │                       │                    │                  │
  │◄──(3a) エラー表示───────│                       │                    │                  │
  │   「Challenge解決後」   │                       │                    │                  │
  │                         │                       │                    │                  │
  │   [OK]                  │                       │                    │                  │
  │──(4) 退出確認───────────►│──(5) POST /observer/:id/exit─►│            │                  │
  │   (ウォレット署名)      │                       │                    │                  │
  │                         │                       │                    │                  │
  │                         │                       │──(6) 退出トランザクション───────────►│
  │                         │                       │   requestExit()    │                  │
  │                         │                       │                    │                  │
  │                         │                       │            ┌───────┴───────┐          │
  │                         │                       │            │ 退出開始      │          │
  │                         │                       │            │ ・VRF選出除外 │          │
  │                         │                       │            │ ・Unbonding   │          │
  │                         │                       │            │   開始(7日)   │          │
  │                         │                       │            └───────┬───────┘          │
  │                         │                       │                    │                  │
  │                         │                       │◄──(7) Event通知────│                  │
  │                         │                       │   ObserverExiting  │                  │
  │                         │                       │                    │                  │
  │                         │                       │──(8) Status更新────────────────────────►│
  │                         │                       │   status='exiting' │                  │
  │                         │                       │   exit_requested_at│                  │
  │                         │                       │                    │                  │
  │                         │◄──(9) 退出受理────────│                    │                  │
  │◄────────────────────────│                       │                    │                  │
  │   {unbonding_end}       │                       │                    │                  │
  │                         │                       │                    │                  │
  │       ════════════════════════════════════════════════════════════════                  │
  │       [7日間 Unbonding期間]                     │                    │                  │
  │       ════════════════════════════════════════════════════════════════                  │
  │                         │                       │                    │                  │
  │──(10) Stake引出─────────────────────────────────────────────────────►│                 │
  │   withdrawStake()       │                       │                    │                  │
  │                         │                       │            ┌───────┴───────┐          │
  │                         │                       │            │ 引出検証      │          │
  │                         │                       │            │ ・Unbonding   │          │
  │                         │                       │            │   完了確認    │          │
  │                         │                       │            │ ・Stake返還   │          │
  │                         │                       │            └───────┬───────┘          │
  │                         │                       │                    │                  │
  │◄──(11) ETH返還──────────────────────────────────────────────────────│                  │
  │   {stake_amount}        │                       │                    │                  │
  │                         │                       │◄──(12) Event通知───│                  │
  │                         │                       │   ObserverExited   │                  │
  │                         │                       │                    │                  │
  │                         │                       │──(13) Status更新───────────────────────►│
  │                         │                       │   status='exited'  │                  │
  │                         │                       │                    │                  │
  │◄──(14) 退出完了─────────│                       │                    │                  │
```

---

### 3.1.3 Enterprise Admin（企業管理者）

#### 申請・契約シーケンス

```
Enterprise担当者         Frontend              Backend API           QS Admin            Database
  │                         │                       │                    │                  │
  │──(1) Landing > 申込────►│                       │                    │                  │
  │                         │                       │                    │                  │
  │◄──(2) プラン選択画面───│                       │                    │                  │
  │   ・Starter ($X/mo)     │                       │                    │                  │
  │   ・Business ($Y/mo)    │                       │                    │                  │
  │   ・Enterprise (要相談)  │                       │                    │                  │
  │                         │                       │                    │                  │
  │──(3) プラン選択─────────►│                       │                    │                  │
  │                         │                       │                    │                  │
  │◄──(4) 申請フォーム──────│                       │                    │                  │
  │                         │                       │                    │                  │
  │──(5) 企業情報入力───────►│                       │                    │                  │
  │   {company_name,        │                       │                    │                  │
  │    legal_name,          │                       │                    │                  │
  │    registration_number, │                       │                    │                  │
  │    country,             │                       │                    │                  │
  │    industry,            │                       │                    │                  │
  │    website,             │                       │                    │                  │
  │    contact_email,       │                       │                    │                  │
  │    contact_name,        │                       │                    │                  │
  │    expected_volume}     │                       │                    │                  │
  │                         │                       │                    │                  │
  │──(6) KYB書類アップロード─►│                       │                    │                  │
  │   ・登記簿謄本          │                       │                    │                  │
  │   ・代表者身分証明      │                       │                    │                  │
  │   ・UBO情報             │                       │                    │                  │
  │                         │                       │                    │                  │
  │──(7) 申請送信───────────►│──(8) POST /enterprise/apply─►│            │                  │
  │                         │   {application_data,  │                    │                  │
  │                         │    documents[]}       │                    │                  │
  │                         │                       │                    │                  │
  │                         │                       │──(9) 申請作成─────────────────────────►│
  │                         │                       │   status='pending' │                  │
  │                         │                       │                    │                  │
  │                         │                       │──(10) 審査通知─────►│                  │
  │                         │                       │   新規申請あり     │                  │
  │                         │                       │                    │                  │
  │                         │◄──(11) 申請受理───────│                    │                  │
  │◄────────────────────────│                       │                    │                  │
  │   {application_id}      │                       │                    │                  │
  │                         │                       │                    │                  │
  │       ════════════════════════════════════════════════════════════════                  │
  │       [審査期間: 3-5営業日]                     │                    │                  │
  │       ════════════════════════════════════════════════════════════════                  │
  │                         │                       │                    │                  │
  │                         │                       │              ┌─────┴─────┐            │
  │                         │                       │              │ KYB審査   │            │
  │                         │                       │              │ ・書類確認│            │
  │                         │                       │              │ ・制裁確認│            │
  │                         │                       │              │ ・UBO確認 │            │
  │                         │                       │              └─────┬─────┘            │
  │                         │                       │                    │                  │
  │                         │                       │◄──(12) 審査結果────│                  │
  │                         │                       │   approved / rejected                 │
  │                         │                       │                    │                  │
  │                         │                       │   [rejected]       │                  │
  │                         │◄──(13a) 却下通知──────│                    │                  │
  │◄────────────────────────│   {reason}           │                    │                  │
  │                         │                       │                    │                  │
  │                         │                       │   [approved]       │                  │
  │                         │                       │──(13b) Status更新──────────────────────►│
  │                         │                       │   kyb_status=      │                  │
  │                         │                       │   'approved'       │                  │
  │                         │                       │                    │                  │
  │◄──(14) 承認通知─────────│                       │                    │                  │
  │   → 契約画面へ          │                       │                    │                  │
  │                         │                       │                    │                  │
  │◄──(15) 契約書表示───────│                       │                    │                  │
  │   ・利用規約            │                       │                    │                  │
  │   ・SLA                 │                       │                    │                  │
  │   ・料金表              │                       │                    │                  │
  │                         │                       │                    │                  │
  │──(16) 契約署名──────────►│──(17) POST /enterprise/:id/contract─►│    │                  │
  │   {signed_by_name,      │                       │                    │                  │
  │    signed_by_title,     │                       │                    │                  │
  │    signature}           │                       │──(18) 契約記録─────────────────────────►│
  │                         │                       │   contract_status= │                  │
  │                         │                       │   'active'         │                  │
  │                         │                       │                    │                  │
  │                         │◄──(19) 契約完了───────│                    │                  │
  │◄────────────────────────│                       │                    │                  │
  │                         │                       │                    │                  │
  │◄──(20) Onboarding───────│                       │                    │                  │
  │   ・APIキー発行         │                       │                    │                  │
  │   ・管理者アカウント作成│                       │                    │                  │
  │   ・Webhook設定         │                       │                    │                  │
  │                         │                       │                    │                  │
  │──(21) 初期設定完了──────►│                       │                    │                  │
  │                         │                       │                    │                  │
  │◄──(22) Dashboard────────│                       │                    │                  │
```

**登録データ**:
```
enterprises:
  - id: UUID
  - name: VARCHAR(255)
  - legal_name: VARCHAR(255)
  - registration_number: VARCHAR(100)
  - country: VARCHAR(2)
  - industry: VARCHAR(100)
  - website: VARCHAR(500)
  - kyb_status: VARCHAR(20)         # pending / approved / rejected
  - kyb_risk_rating: VARCHAR(10)
  - plan: VARCHAR(20)               # starter / business / enterprise
  - contract_status: VARCHAR(20)    # draft / active / terminated / terminating
  - contract_signed_at: TIMESTAMP
  - billing_email: VARCHAR(255)
  - billing_address: TEXT           # Section 5.2と整合
  - api_quota: INTEGER
  - created_at: TIMESTAMP
  - approved_at: TIMESTAMP

enterprise_members:
  - id: UUID
  - enterprise_id: UUID (FK)
  - email: VARCHAR(255)
  - name: VARCHAR(255)
  - role: VARCHAR(20)               # admin / member / viewer
  - wallet_address: VARCHAR(42)
  - mfa_enabled: BOOLEAN
  - invited_at: TIMESTAMP
  - joined_at: TIMESTAMP

enterprise_contracts:
  - id: UUID
  - enterprise_id: UUID (FK)
  - contract_type: VARCHAR(50)
  - contract_version: VARCHAR(20)
  - signed_at: TIMESTAMP
  - signed_by_name: VARCHAR(255)
  - signed_by_title: VARCHAR(100)
  - document_hash: VARCHAR(64)
  - valid_from: DATE
  - valid_until: DATE
  - auto_renew: BOOLEAN
```

---

#### 解約シーケンス

```
Enterprise Admin         Frontend              Backend API           QS Admin            Database
  │                         │                       │                    │                  │
  │──(1) 設定 > 解約申請───►│                       │                    │                  │
  │                         │                       │                    │                  │
  │◄──(2) 確認画面──────────│                       │                    │                  │
  │   ・契約終了日          │                       │                    │                  │
  │   ・アクティブユーザー数│                       │                    │                  │
  │   ・ロック中資産総額    │                       │                    │                  │
  │   ・データ保持ポリシー  │                       │                    │                  │
  │                         │                       │                    │                  │
  │   [ロック中資産有]      │                       │                    │                  │
  │◄──(3a) 警告表示─────────│                       │                    │                  │
  │   「ユーザー移行が必要」│                       │                    │                  │
  │                         │                       │                    │                  │
  │──(4) 解約理由入力───────►│                       │                    │                  │
  │   {reason,              │                       │                    │                  │
  │    feedback}            │                       │                    │                  │
  │                         │                       │                    │                  │
  │──(5) 解約確認───────────►│──(6) POST /enterprise/:id/terminate─►│    │                  │
  │   (管理者署名)          │                       │                    │                  │
  │                         │                       │                    │                  │
  │                         │                       │──(7) 解約通知──────►│                  │
  │                         │                       │                    │                  │
  │                         │                       │──(8) Status更新─────────────────────────►│
  │                         │                       │   contract_status= │                  │
  │                         │                       │   'terminating'    │                  │
  │                         │                       │                    │                  │
  │                         │◄──(9) 解約受理────────│                    │                  │
  │◄────────────────────────│                       │                    │                  │
  │   {termination_date,    │                       │                    │                  │
  │    notice_period: 30d}  │                       │                    │                  │
  │                         │                       │                    │                  │
  │       ════════════════════════════════════════════════════════════════                  │
  │       [30日間 通知期間]                         │                    │                  │
  │       ・APIアクセス継続                         │                    │                  │
  │       ・新規ユーザー登録停止                    │                    │                  │
  │       ・既存ユーザーにパブリック版移行案内      │                    │                  │
  │       ════════════════════════════════════════════════════════════════                  │
  │                         │                       │                    │                  │
  │   [30日後]              │                       │                    │                  │
  │                         │                       │──(10) 完全終了────────────────────────►│
  │                         │                       │   contract_status= │                  │
  │                         │                       │   'terminated'     │                  │
  │                         │                       │   api_revoked=true │                  │
  │                         │                       │                    │                  │
  │◄──(11) 解約完了─────────│                       │                    │                  │
  │   ・データエクスポート  │                       │                    │                  │
  │   ・最終請求書          │                       │                    │                  │
```

---

### 3.1.4 Token Holder（トークン保有者）

#### 参加シーケンス（暗黙的登録）

```
User                     DEX/CEX               Token Hub             Governance
  │                         │                       │                    │
  │  [トークン取得方法1: DEX]                       │                    │
  │──(1a) $QS購入───────────►│                       │                    │
  │   (Uniswap等)           │                       │                    │
  │                         │                       │                    │
  │  [トークン取得方法2: CEX]                       │                    │
  │──(1b) $QS購入───────────►│                       │                    │
  │   (Binance等)           │                       │                    │
  │                         │                       │                    │
  │  [トークン取得方法3: エアドロップ]              │                    │
  │◄──(1c) $QS受取──────────│   (Claim)             │                    │
  │                         │                       │                    │
  │  ※ この時点ではまだガバナンス参加不可          │                    │
  │  ※ veQS（投票権）を得るにはステークが必要      │                    │
  │                         │                       │                    │
  │──(2) Token Hub接続──────────────────────────────►│                    │
  │                         │                       │                    │
  │◄──(3) Dashboard─────────────────────────────────│                    │
  │   ・$QS残高表示         │                       │                    │
  │   ・veQS: 0（未ステーク）│                       │                    │
  │                         │                       │                    │
  │──(4) 「ステーク」───────────────────────────────►│                    │
  │                         │                       │                    │
  │◄──(5) ステーク画面──────────────────────────────│                    │
  │   ・ロック期間選択      │                       │                    │
  │     (1週間～4年)        │                       │                    │
  │   ・veQS計算プレビュー  │                       │                    │
  │                         │                       │                    │
  │──(6) ステーク実行───────────────────────────────►│                    │
  │   {amount,              │                 ┌─────┴─────┐              │
  │    lock_period}         │                 │ veQS計算  │              │
  │                         │                 │           │              │
  │   + $QS Transfer        │                 │ veQS =    │              │
  │                         │                 │ QS × (t/  │              │
  │                         │                 │ t_max)^α  │              │
  │                         │                 │           │              │
  │                         │                 │ α = 0.5   │              │
  │                         │                 │ t_max = 4y│              │
  │                         │                 └─────┬─────┘              │
  │                         │                       │                    │
  │◄──(7) ステーク完了──────────────────────────────│                    │
  │   {veQS_balance}        │                       │                    │
  │                         │                       │──(8) 投票権同期────►│
  │   ※ これでガバナンス参加可能に                 │   {voter,          │
  │                         │                       │    veQS_balance}   │
  │                         │                       │                    │
  │──(9) Governance接続─────────────────────────────────────────────────►│
  │                         │                       │                    │
  │◄──(10) 提案一覧─────────────────────────────────────────────────────│
  │   ・アクティブ提案      │                       │                    │
  │   ・投票権: X veQS      │                       │                    │
```

**注意**: Token Holderは明示的な「登録」プロセスがない。トークンを保有し、ステークすることで自動的にガバナンス参加資格を得る。

---

#### 退出シーケンス（アンステーク）

```
Token Holder             Token Hub             L1 veQS Contract
  │                         │                       │
  │──(1) 「アンステーク」───►│                       │
  │                         │                       │
  │◄──(2) アンステーク画面──│                       │
  │   ・現在のロック状態    │                       │
  │   ・ロック解除日        │                       │
  │   ・早期解除ペナルティ  │                       │
  │                         │                       │
  │   [ロック期間中]        │                       │
  │◄──(3a) 警告表示─────────│                       │
  │   「早期解除は50%       │                       │
  │    ペナルティ」         │                       │
  │                         │                       │
  │   [ロック期間終了]      │                       │
  │──(4) アンステーク実行──►│──(5) withdraw()───────►│
  │                         │                       │
  │                         │                 ┌─────┴─────┐
  │                         │                 │ ロック検証│
  │                         │                 │           │
  │                         │                 │ $QS返還   │
  │                         │                 │ veQS消滅  │
  │                         │                 └─────┬─────┘
  │                         │                       │
  │◄──(6) $QS返還───────────────────────────────────│
  │   {amount}              │                       │
  │                         │                       │
  │   ※ veQS = 0 でガバナンス参加資格喪失          │
```

---

### 3.1.5 Security Council / Purpose Committee

#### メンバー選出シーケンス（ガバナンス経由）

```
Proposer                Governance            Token Holders         Security Council
  │                         │                       │                    │
  │  [Councilメンバー追加/変更提案]                 │                    │
  │                         │                       │                    │
  │──(1) 提案作成───────────►│                       │                    │
  │   {type: 'council_change',                      │                    │
  │    action: 'add_member',│                       │                    │
  │    council: 'security', │                       │                    │
  │    candidate: 0x...,    │                       │                    │
  │    bond: 1 ETH}         │                       │                    │
  │                         │                       │                    │
  │                   ┌─────┴─────┐                 │                    │
  │                   │ Council   │                 │                    │
  │                   │ 変更提案  │                 │                    │
  │                   │           │                 │                    │
  │                   │ Quorum:   │                 │                    │
  │                   │ 15%       │                 │                    │
  │                   └─────┬─────┘                 │                    │
  │                         │                       │                    │
  │                         │   [Purpose Committee審査]                  │
  │                         │   [議論期間 7日]      │                    │
  │                         │   [投票期間 7日]      │                    │
  │                         │                       │                    │
  │                         │──(2) 投票開始────────►│                    │
  │                         │                       │                    │
  │                         │                 ┌─────┴─────┐              │
  │                         │                 │ veQS投票  │              │
  │                         │                 │           │              │
  │                         │                 │ 15%以上   │              │
  │                         │                 │ 参加必須  │              │
  │                         │                 └─────┬─────┘              │
  │                         │                       │                    │
  │                         │◄──(3) 投票結果────────│                    │
  │                         │                       │                    │
  │                   ┌─────┴─────┐                 │                    │
  │                   │ 可決判定  │                 │                    │
  │                   └─────┬─────┘                 │                    │
  │                         │                       │                    │
  │                         │   [Time Lock 7日]     │                    │
  │                         │   [Veto期間]          │                    │
  │                         │                       │                    │
  │──(4) Execute────────────►│                       │                    │
  │                         │                       │                    │
  │                         │──(5) Council更新──────────────────────────►│
  │                         │   addMember()         │                    │
  │                         │                       │              ┌─────┴─────┐
  │                         │                       │              │ メンバー  │
  │                         │                       │              │ 追加      │
  │                         │                       │              │           │
  │                         │                       │              │ 9名維持   │
  │                         │                       │              │ 確認      │
  │                         │                       │              └─────┬─────┘
  │                         │                       │                    │
  │                         │◄──(6) 更新完了────────────────────────────│
  │                         │                       │                    │
  │◄──(7) 提案実行完了──────│                       │                    │
```

**Council構成ルール**:
- Security Council: 9名固定
- Purpose Committee: 5名固定
- 任期: なし（ガバナンスによる変更のみ）
- 削除時は同時に後任指名必須

---

### 3.1.6 QS Foundation Admin（財団スタッフ）

#### スタッフ登録シーケンス（内部プロセス）

```
HR担当者                  Admin System          Super Admin           Database
  │                         │                       │                    │
  │──(1) 新規スタッフ登録───►│                       │                    │
  │   {email,               │                       │                    │
  │    name,                │                       │                    │
  │    employee_id,         │                       │                    │
  │    department,          │                       │                    │
  │    role}                │                       │                    │
  │                         │                       │                    │
  │                         │──(2) 承認要求─────────►│                    │
  │                         │                       │                    │
  │                         │                 ┌─────┴─────┐              │
  │                         │                 │ 審査      │              │
  │                         │                 │ ・バック  │              │
  │                         │                 │   グラウンド│              │
  │                         │                 │   チェック │              │
  │                         │                 │ ・権限妥当│              │
  │                         │                 │   性確認  │              │
  │                         │                 └─────┬─────┘              │
  │                         │                       │                    │
  │                         │◄──(3) 承認────────────│                    │
  │                         │                       │                    │
  │                         │──(4) アカウント作成──────────────────────────►│
  │                         │   {id, email, role,   │                    │
  │                         │    permissions,       │                    │
  │                         │    created_by}        │                    │
  │                         │                       │                    │
  │                         │──(5) 招待メール送信   │                    │
  │                         │   (MFA設定リンク)     │                    │
  │                         │                       │                    │
  │◄──(6) 登録完了──────────│                       │                    │
  │                         │                       │                    │
  │                         │                       │                    │
  新規スタッフ              │                       │                    │
  │◄──(7) 招待メール受信────│                       │                    │
  │                         │                       │                    │
  │──(8) 初回ログイン───────►│                       │                    │
  │                         │                       │                    │
  │◄──(9) MFA設定要求───────│                       │                    │
  │                         │                       │                    │
  │──(10) MFA設定─────────►│                       │                    │
  │   (TOTP/Security Key)   │                       │                    │
  │                         │                       │                    │
  │◄──(11) 秘密保持契約─────│                       │                    │
  │                         │                       │                    │
  │──(12) 契約同意──────────►│──(13) 記録────────────────────────────────►│
  │                         │   confidentiality_    │                    │
  │                         │   signed = true       │                    │
  │                         │                       │                    │
  │◄──(14) アカウント有効化─│                       │                    │
  │   → Admin Dashboard     │                       │                    │
```

**スタッフロール**:
| ロール | 権限 |
|--------|------|
| super_admin | 全権限 |
| admin | ほぼ全権限（スタッフ管理以外） |
| operator | 日常運用（承認、監視） |
| support | サポート対応のみ |
| viewer | 閲覧のみ |

---

## 4. 画面遷移図

> **目的**: 各アプリケーションの画面遷移を可視化し、ナビゲーション設計の矛盾を防ぐ
> **更新日**: 2026-01-21
> **検証方法**: 実際のコードベース（`apps/web/src/app/[locale]/`）と照合済み

### 4.0 画面インベントリ（コードベース vs URL_REFERENCE 比較）

#### 不整合一覧

| アプリ | URL_REFERENCE記載 | 実際のパス | 状態 |
|--------|------------------|-----------|:----:|
| Consumer | `/lock/complete` | `/lock/success` | ⚠️ 命名不一致 |
| Consumer | `/unlock/complete` | `/unlock/success` | ⚠️ 命名不一致 |
| Consumer | `/settings/security` | `/security` | ⚠️ パス不一致 |
| Consumer | `/settings/keys` | `/key-management` | ⚠️ パス不一致 |
| Consumer | `/emergency-unlock` | `/emergency-bond`, `/emergency-processing`, `/emergency-success` | ⚠️ 3画面に分割 |
| Observer | - | `/application`, `/landing`, `/login` | ✅ NEW追加済 |
| Prover | `/register` | `/application` | ⚠️ 命名不一致 |
| Prover | - | `/requirements`, `/login`, `/terms` | ✅ NEW追加済 |
| Governance | - | `/faq`, `/onboarding`, `/settings` | ✅ NEW追加済 |
| Token Hub | - | `/onboarding`, `/landing` | ✅ NEW追加済 |
| Explorer | - | `/landing`, `/challenges`, `/provers` | ✅ NEW追加済 |
| Ecosystem | - | `/ecosystem`, `/ecosystem/technical` | ✅ NEW追加済 |

**推奨アクション**: URL_REFERENCE.mdを実コードに合わせて更新するか、コード側を修正

---

### 4.1 Consumer App 画面遷移図（26画面）

```
                                    ┌─────────────────┐
                                    │   Landing       │
                                    │  /consumer/     │
                                    │   landing       │
                                    └────────┬────────┘
                                             │
                              Connect Wallet │
                                             ▼
                                    ┌─────────────────┐
                                    │ Wallet Connect  │
                                    │ /consumer/      │
                                    │ wallet-connect  │
                                    └────────┬────────┘
                                             │
                                 [初回] ─────┼───── [既存ユーザー]
                                    │        │            │
                                    ▼        │            │
                           ┌─────────────┐   │            │
                           │ Onboarding  │   │            │
                           │ /consumer/  │   │            │
                           │ onboarding  │   │            │
                           └──────┬──────┘   │            │
                                  │          │            │
                                  └──────────┼────────────┘
                                             │
                                             ▼
    ┌───────────────────────────────────────────────────────────────────────────────┐
    │                              Dashboard                                         │
    │                         /consumer/dashboard                                    │
    │  ┌──────────┬──────────┬──────────┬──────────┬──────────┬──────────┐          │
    │  │ Lock     │ Unlock   │ History  │ Notify   │ Settings │ Help     │          │
    │  │ ボタン   │ ボタン   │ リンク   │ リンク   │ リンク   │ リンク   │          │
    │  └────┬─────┴────┬─────┴────┬─────┴────┬─────┴────┬─────┴────┬─────┘          │
    └───────┼──────────┼──────────┼──────────┼──────────┼──────────┼────────────────┘
            │          │          │          │          │          │
            ▼          │          │          │          │          │
    ┌─────────────┐    │          │          │          │          │
    │    Lock     │    │          │          │          │          │
    │  /consumer/ │    │          │          │          │          │
    │    lock     │    │          │          │          │          │
    └──────┬──────┘    │          │          │          │          │
           │           │          │          │          │          │
           ▼           │          │          │          │          │
    ┌─────────────┐    │          │          │          │          │
    │  Lock       │    │          │          │          │          │
    │ Processing  │    │          │          │          │          │
    │ /lock/      │    │          │          │          │          │
    │ processing  │    │          │          │          │          │
    └──────┬──────┘    │          │          │          │          │
           │           │          │          │          │          │
           ▼           │          │          │          │          │
    ┌─────────────┐    │          │          │          │          │
    │  Lock       │    │          │          │          │          │
    │  Success    │    │          │          │          │          │
    │ /lock/      │    │          │          │          │          │
    │  success    │    │          │          │          │          │
    └──────┬──────┘    │          │          │          │          │
           │           │          │          │          │          │
           └───────────┼──► Dashboard ◄──────┼──────────┼──────────┘
                       │                     │          │
                       ▼                     │          │
               ┌─────────────┐               │          │
               │   Unlock    │               │          │
               │  /consumer/ │               │          │
               │   unlock    │               │          │
               └──────┬──────┘               │          │
                      │                      │          │
         ┌────────────┼────────────┐         │          │
         │ 通常       │ 緊急       │         │          │
         ▼            ▼            │         │          │
    ┌─────────┐  ┌─────────────┐   │         │          │
    │ Unlock  │  │ Emergency   │   │         │          │
    │Process- │  │   Bond      │   │         │          │
    │  ing    │  │ /emergency- │   │         │          │
    └────┬────┘  │   bond      │   │         │          │
         │       └──────┬──────┘   │         │          │
         ▼              ▼          │         │          │
    ┌─────────┐  ┌─────────────┐   │         │          │
    │ Unlock  │  │ Emergency   │   │         │          │
    │ Success │  │ Processing  │   │         │          │
    └────┬────┘  └──────┬──────┘   │         │          │
         │              ▼          │         │          │
         │       ┌─────────────┐   │         │          │
         │       │ Emergency   │   │         │          │
         │       │  Success    │   │         │          │
         │       └──────┬──────┘   │         │          │
         │              │          │         │          │
         └──────────────┴──────────┴─────────┤          │
                                             │          │
                                             ▼          │
                                    ┌─────────────┐     │
                                    │  History    │     │
                                    │ /consumer/  │     │
                                    │  history    │     │
                                    └──────┬──────┘     │
                                           │           │
                                           ▼           │
                                    ┌─────────────┐    │
                                    │  History    │    │
                                    │   Detail    │    │
                                    │ /history/   │    │
                                    │    [id]     │    │
                                    └─────────────┘    │
                                                       │
    ┌──────────────────────────────────────────────────┘
    │
    ▼
    ┌─────────────────────────────────────────────────────────────────────┐
    │                         Settings                                    │
    │                    /consumer/settings                               │
    │  ┌───────────┬───────────────┬──────────────┬───────────────┐      │
    │  │ Security  │ Key Mgmt      │   Terms      │   Privacy     │      │
    │  │ /security │ /key-         │  /terms      │  /privacy     │      │
    │  │           │  management   │              │               │      │
    │  └───────────┴───────────────┴──────────────┴───────────────┘      │
    └─────────────────────────────────────────────────────────────────────┘

    ┌─────────────────────────────────────────────────────────────────────┐
    │                      補助ページ（フッターリンク）                    │
    │  ┌────────┬────────┬────────┬────────┬────────┬────────────────┐   │
    │  │ Help   │  FAQ   │ How It │ Contact│ Cookie │ Notifications  │   │
    │  │ /help  │ /faq   │ Works  │/contact│/cookie │ /notifications │   │
    │  └────────┴────────┴────────┴────────┴────────┴────────────────┘   │
    └─────────────────────────────────────────────────────────────────────┘
```

**遷移ルール**:
- Landing → Dashboard: ウォレット接続＆認証完了後
- Dashboard → Lock/Unlock: 資産操作
- 全画面 → Dashboard: 戻るボタン/ロゴクリック
- Processing → Success: トランザクション完了後（自動遷移）

---

### 4.2 Token Hub 画面遷移図（20画面）

```
                                    ┌─────────────────┐
                                    │   Landing       │
                                    │  /token-hub/    │
                                    │   landing       │
                                    └────────┬────────┘
                                             │
                              Connect Wallet │
                                             ▼
                                    ┌─────────────────┐
                                    │  Onboarding     │
                                    │  /token-hub/    │
                                    │   onboarding    │
                                    └────────┬────────┘
                                             │
                                             ▼
    ┌───────────────────────────────────────────────────────────────────────────────┐
    │                              Dashboard                                         │
    │                         /token-hub/dashboard                                   │
    │  ┌──────────┬──────────┬──────────┬──────────┬──────────┬──────────┐          │
    │  │  Lock    │ Unlock   │ Delegate │ Rewards  │ Settings │  Help    │          │
    │  │  ボタン  │ ボタン   │  ボタン  │  ボタン  │  リンク  │  リンク  │          │
    │  └────┬─────┴────┬─────┴────┬─────┴────┬─────┴────┬─────┴────┬─────┘          │
    └───────┼──────────┼──────────┼──────────┼──────────┼──────────┼────────────────┘
            │          │          │          │          │          │
            ▼          │          │          │          │          │
    ┌─────────────┐    │          │          │          │          │
    │    Lock     │    │          │          │          │          │
    │ /token-hub/ │    │          │          │          │          │
    │    lock     │    │          │          │          │          │
    └──────┬──────┘    │          │          │          │          │
           │           │          │          │          │          │
           ▼           │          │          │          │          │
    ┌─────────────┐    │          │          │          │          │
    │Lock Preview │    │          │          │          │          │
    │ /lock/      │    │          │          │          │          │
    │  preview    │    │          │          │          │          │
    └──────┬──────┘    │          │          │          │          │
           │           │          │          │          │          │
           └───────► Dashboard ◄──┼──────────┼──────────┼──────────┘
                       │          │          │          │
                       │          ▼          │          │
                       │  ┌─────────────┐    │          │
                       │  │  Unlock     │    │          │
                       │  │ /token-hub/ │    │          │
                       │  │   unlock    │    │          │
                       │  └─────────────┘    │          │
                       │                     │          │
                       │          ┌──────────┘          │
                       │          ▼                     │
                       │  ┌─────────────────────────────────────────┐
                       │  │              Delegate Flow              │
                       │  │  ┌─────────────┐     ┌──────────────┐  │
                       │  │  │  Delegate   │────►│ Delegate     │  │
                       │  │  │ /delegate   │     │  Detail      │  │
                       │  │  └──────┬──────┘     │ /delegate/   │  │
                       │  │         │            │   [id]       │  │
                       │  │         ▼            └──────────────┘  │
                       │  │  ┌─────────────┐                       │
                       │  │  │Delegate List│                       │
                       │  │  │/delegate-   │                       │
                       │  │  │ list        │                       │
                       │  │  └─────────────┘                       │
                       │  └────────────────────────────────────────┘
                       │                                │
                       │          ┌─────────────────────┘
                       │          ▼
                       │  ┌─────────────────────────────────────────┐
                       │  │              Rewards Flow               │
                       │  │  ┌─────────────┐     ┌──────────────┐  │
                       │  │  │  Rewards    │────►│ Rewards      │  │
                       │  │  │ /rewards    │     │  Claim       │  │
                       │  │  └──────┬──────┘     │ /rewards/    │  │
                       │  │         │            │   claim      │  │
                       │  │         ▼            └──────────────┘  │
                       │  │  ┌─────────────┐                       │
                       │  │  │ Rewards     │                       │
                       │  │  │  History    │                       │
                       │  │  │ /rewards/   │                       │
                       │  │  │  history    │                       │
                       │  │  └─────────────┘                       │
                       │  └────────────────────────────────────────┘
                       │
                       └────────────────────────┐
                                                ▼
    ┌─────────────────────────────────────────────────────────────────────┐
    │                      補助ページ                                     │
    │  ┌──────────┬──────────┬──────────┬──────────────┬───────────────┐ │
    │  │ Settings │   FAQ    │  Help    │ Consumer Link│   Get QS     │ │
    │  │/settings │  /faq    │  /help   │/consumer-link│  /get-qs     │ │
    │  └──────────┴──────────┴──────────┴──────────────┴───────────────┘ │
    └─────────────────────────────────────────────────────────────────────┘
```

---

### 4.3 Governance 画面遷移図（10画面）

```
                                    ┌─────────────────┐
                                    │   Landing       │
                                    │  /governance/   │
                                    │   landing       │
                                    └────────┬────────┘
                                             │
                                [Token Holder] / [Guest]
                                             │
                        ┌────────────────────┼────────────────────┐
                        │                    │                    │
                        ▼                    ▼                    ▼
               ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
               │ Onboarding  │      │  Proposals  │      │   Council   │
               │/onboarding  │      │ /proposals  │      │  /council   │
               └──────┬──────┘      └──────┬──────┘      └─────────────┘
                      │                    │
                      └────────► Dashboard │
                                          │
                         ┌────────────────┼────────────────┐
                         │                │                │
                         ▼                ▼                ▼
                ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
                │  Create     │  │  Proposal   │  │  History    │
                │  Proposal   │  │   Detail    │  │ /history    │
                │  /create    │  │ /proposals/ │  └─────────────┘
                └─────────────┘  │    [id]     │
                                 └──────┬──────┘
                                        │
                                        ▼
                                 ┌─────────────┐
                                 │   投票      │
                                 │  （モーダル） │
                                 └─────────────┘

    ┌─────────────────────────────────────────────────────────────────────┐
    │                      補助ページ                                     │
    │  ┌──────────┬──────────┐                                           │
    │  │ Settings │   FAQ    │                                           │
    │  │/settings │  /faq    │                                           │
    │  └──────────┴──────────┘                                           │
    └─────────────────────────────────────────────────────────────────────┘
```

---

### 4.4 Prover Portal 画面遷移図（15画面）

```
                                    ┌─────────────────┐
                                    │   Landing       │
                                    │   /prover/      │
                                    │   landing       │
                                    └────────┬────────┘
                                             │
                              ┌──────────────┼──────────────┐
                              │ 未登録       │ 登録済み     │
                              ▼              │              ▼
                     ┌─────────────┐        │      ┌─────────────┐
                     │Requirements │        │      │   Login     │
                     │/requirements│        │      │  /login     │
                     └──────┬──────┘        │      └──────┬──────┘
                            │               │             │
                            ▼               │             │
                     ┌─────────────┐        │             │
                     │ Application │        │             │
                     │/application │        │             │
                     └──────┬──────┘        │             │
                            │               │             │
                            ▼               │             │
                     ┌─────────────┐        │             │
                     │   Terms     │        │             │
                     │  /terms     │        │             │
                     └──────┬──────┘        │             │
                            │               │             │
                            ▼               │             │
                     ┌─────────────────┐    │             │
                     │ Application     │    │             │
                     │    Status       │    │             │
                     │/application-    │    │             │
                     │ status          │    │             │
                     └────────┬────────┘    │             │
                              │ [承認後]    │             │
                              └─────────────┴─────────────┘
                                            │
                                            ▼
    ┌───────────────────────────────────────────────────────────────────────────────┐
    │                              Dashboard                                         │
    │                          /prover/dashboard                                     │
    │  ┌──────────┬──────────┬──────────┬──────────┬──────────┬──────────┐          │
    │  │  Queue   │ Metrics  │ Alerts   │Challenge │   Exit   │ Settings │          │
    │  │  リンク  │  リンク  │  リンク  │  リンク  │  リンク  │  リンク  │          │
    │  └────┬─────┴────┬─────┴────┬─────┴────┬─────┴────┬─────┴────┬─────┘          │
    └───────┼──────────┼──────────┼──────────┼──────────┼──────────┼────────────────┘
            │          │          │          │          │          │
            ▼          ▼          ▼          ▼          ▼          ▼
    ┌──────────┐┌──────────┐┌──────────┐┌──────────┐┌──────────┐┌──────────┐
    │  Queue   ││ Metrics  ││  Alerts  ││Challenges││   Exit   ││ Settings │
    │  /queue  ││ /metrics ││ /alerts  ││/challenge││  /exit   ││/settings │
    └──────────┘└──────────┘└──────────┘└──────────┘└──────────┘└──────────┘
```

**遷移ルール**:
- Landing → Requirements: 新規Prover候補
- Requirements → Application → Terms → Application Status: 登録フロー
- Application Status → Dashboard: 承認後
- Login → Dashboard: 既存Prover

---

### 4.5 Observer 画面遷移図（14画面）

```
                                    ┌─────────────────┐
                                    │   Landing       │
                                    │  /observer/     │
                                    │   landing       │
                                    └────────┬────────┘
                                             │
                              ┌──────────────┼──────────────┐
                              │ 未登録       │ 登録済み     │
                              ▼              │              ▼
                     ┌─────────────┐        │      ┌─────────────┐
                     │ Application │        │      │   Login     │
                     │/application │        │      │  /login     │
                     └──────┬──────┘        │      └──────┬──────┘
                            │               │             │
                            └───────────────┴─────────────┘
                                            │
                                            ▼
    ┌───────────────────────────────────────────────────────────────────────────────┐
    │                              Dashboard                                         │
    │                         /observer/dashboard                                    │
    │  ┌──────────┬──────────┬──────────┬──────────┬──────────┬──────────┐          │
    │  │ Pending  │Suspicious│ History  │ Earnings │ Settings │Challenge │          │
    │  │  リンク  │  リンク  │  リンク  │  リンク  │  リンク  │  new     │          │
    │  └────┬─────┴────┬─────┴────┬─────┴────┬─────┴────┬─────┴────┬─────┘          │
    └───────┼──────────┼──────────┼──────────┼──────────┼──────────┼────────────────┘
            │          │          │          │          │          │
            ▼          ▼          ▼          ▼          ▼          ▼
    ┌──────────┐┌──────────┐┌──────────┐┌──────────┐┌──────────┐┌──────────┐
    │ Pending  ││Suspicious││ History  ││ Earnings ││ Settings ││Challenge │
    │ /pending ││/suspi-   ││ /history ││/earnings ││/settings ││   new    │
    │          ││  cious   ││          ││          ││          ││/challenge│
    └──────────┘└──────────┘└──────────┘└──────────┘└──────────┘│  /new    │
                                                                └────┬─────┘
                                                                     │
                                                                     ▼
                                                               ┌──────────┐
                                                               │Challenge │
                                                               │  Detail  │
                                                               │/challenge│
                                                               │  /[id]   │
                                                               └──────────┘
```

---

### 4.6 Explorer 画面遷移図（14画面）

```
                                    ┌─────────────────┐
                                    │   Landing       │
                                    │  /explorer/     │
                                    │   landing       │
                                    └────────┬────────┘
                                             │
                                             ▼
    ┌───────────────────────────────────────────────────────────────────────────────┐
    │                              Overview                                          │
    │                          /explorer/overview                                    │
    │  ┌──────────┬──────────┬──────────┬──────────┬──────────┬──────────┐          │
    │  │  Locks   │ Unlocks  │Challenges│ Provers  │ Analytics│  Search  │          │
    │  │  リンク  │  リンク  │  リンク  │  リンク  │  リンク  │  バー    │          │
    │  └────┬─────┴────┬─────┴────┬─────┴────┬─────┴────┬─────┴────┬─────┘          │
    └───────┼──────────┼──────────┼──────────┼──────────┼──────────┼────────────────┘
            │          │          │          │          │          │
            ▼          ▼          ▼          ▼          ▼          ▼
    ┌──────────┐┌──────────┐┌──────────┐┌──────────┐┌──────────┐┌──────────┐
    │  Locks   ││ Unlocks  ││Challenges││ Provers  ││Analytics ││  Search  │
    │  /locks  ││ /unlocks ││/challenge││ /provers ││/analytics││ /search  │
    └────┬─────┘└────┬─────┘└──────────┘└──────────┘└──────────┘└──────────┘
         │           │
         ▼           ▼
    ┌──────────┐┌──────────┐
    │  Lock    ││ Unlock   │
    │  Detail  ││ Detail   │
    │ /locks/  ││/unlocks/ │
    │ [lockId] ││[unlockId]│
    └──────────┘└──────────┘

    ┌─────────────────────────────────────────────────────────────────────┐
    │                      補助ページ                                     │
    │  ┌──────────┐                                                       │
    │  │  About   │                                                       │
    │  │ /about   │                                                       │
    │  └──────────┘                                                       │
    └─────────────────────────────────────────────────────────────────────┘
```

---

### 4.7 Enterprise Admin 画面遷移図（35画面）

```
                                    ┌─────────────────┐
                                    │   Landing       │
                                    │  /enterprise/   │
                                    │   landing       │
                                    └────────┬────────┘
                                             │
                        ┌────────────────────┼────────────────────┐
                        │ 未契約             │ 契約済み           │
                        ▼                    │                    │
               ┌─────────────────────────────┴──────────────────────────────┐
               │                    申請フロー                              │
               │  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐│
               │  │  Apply   │──►│ Apply    │──►│ Apply    │──►│ Contract ││
               │  │  /apply  │   │   Plan   │   │   KYB    │   │/contract ││
               │  └──────────┘   │ /apply/  │   │ /apply/  │   └────┬─────┘│
               │                 │   plan   │   │   kyb    │        │      │
               │                 └──────────┘   └──────────┘        │      │
               └────────────────────────────────────────────────────┼──────┘
                                                                    │
                                            [審査・契約完了]         │
                                                                    ▼
                                                           ┌─────────────┐
                                                           │ Onboarding  │
                                                           │/onboarding  │
                                                           └──────┬──────┘
                                                                  │
                                                                  ▼
    ┌───────────────────────────────────────────────────────────────────────────────┐
    │                              Dashboard                                         │
    │                         /enterprise/dashboard                                  │
    │  ┌───────┬───────┬───────┬───────┬───────┬───────┬───────┬───────┬───────┐   │
    │  │ Users │ Trans │ Team  │ API   │Webhook│Billing│Reports│Approval│Settings│  │
    │  └───┬───┴───┬───┴───┬───┴───┬───┴───┬───┴───┬───┴───┬───┴───┬───┴───┬───┘   │
    └──────┼───────┼───────┼───────┼───────┼───────┼───────┼───────┼───────┼───────┘
           │       │       │       │       │       │       │       │       │
           ▼       ▼       ▼       ▼       ▼       ▼       ▼       ▼       ▼
    [Users][Transactions][Team][API Keys][Webhooks][Billing][Reports][Approvals][Settings]
       │          │         │       │         │        │        │        │
       ▼          ▼         ▼       ▼         ▼        ▼        ▼        ▼
    User      Trans      Invite  Create    Create  Invoices Compliance Provers
    Detail    Detail                               ↓
    [id]      [id]                              ┌────────────────────────────────┐
                                                │ 補助ページ                     │
                                                │ TVL, Volume, Status, SLA      │
                                                │ Support, Help, Terms, Privacy │
                                                └────────────────────────────────┘
```

---

### 4.8 QS Admin 画面遷移図（70+画面）

```
    ┌───────────────────────────────────────────────────────────────────────────────┐
    │                         統合ダッシュボード                                     │
    │                           /admin/dashboard                                     │
    │  ┌──────────┬──────────┬──────────┬──────────┐                               │
    │  │ Public   │  SaaS    │ License  │ Settings │                               │
    │  │  管理    │   管理   │   管理   │   管理   │                               │
    │  └────┬─────┴────┬─────┴────┬─────┴────┬─────┘                               │
    └───────┼──────────┼──────────┼──────────┼────────────────────────────────────────┘
            │          │          │          │
            ▼          │          │          │
    ┌─────────────────────────────────────────────────────────────────────┐
    │              Public版管理 (/admin/public/*)                        │
    │  ┌───────┬────────┬─────────┬────────┬──────────┬─────────┐       │
    │  │ Users │ Provers│Observers│ Holders│Governance│ Treasury│       │
    │  │       │        │         │Delegates│         │         │       │
    │  └───┬───┴────┬───┴────┬────┴────┬───┴─────┬───┴────┬────┘       │
    │      │        │        │         │         │        │             │
    │      ▼        ▼        ▼         ▼         ▼        ▼             │
    │   [Users]  [Provers] [Observers][Holders] [Gov]  [Treasury]       │
    │   Detail   Detail              Delegates  Params  Expenses        │
    │   Stats    Appli-             VotingPower Execute Distribution    │
    │            cations            　　        Emergency Audit          │
    │            Slashing                                               │
    │            Performance                                            │
    │  ┌─────────────────────────────────────────┐                      │
    │  │ Protocol (/admin/public/protocol/*)     │                      │
    │  │  Protocol │ Contracts │ Alerts          │                      │
    │  └─────────────────────────────────────────┘                      │
    └─────────────────────────────────────────────────────────────────────┘
            │
            ▼
    ┌─────────────────────────────────────────────────────────────────────┐
    │              SaaS管理 (/admin/saas/*)                              │
    │  ┌──────────┬──────────┬──────────┬──────────┬──────────┐         │
    │  │Operators │  Users   │ Provers  │Observers │ Billing  │         │
    │  │          │          │          │          │          │         │
    │  └────┬─────┴────┬─────┴────┬─────┴────┬─────┴────┬─────┘         │
    │       ▼          ▼          ▼          ▼          ▼               │
    │   [Detail]    [Stats]    [QS/Op]   [Status]   [Payments]          │
    │   [Appli]     [Risks]  [Performance]         [Usage]              │
    │   [Contracts]          [SLA]                 [Revenue]            │
    │   [Plans]                                                         │
    │  ┌────────────────────┬─────────────────────┐                     │
    │  │Infrastructure      │ Support             │                     │
    │  │ Capacity │ SLA     │ History             │                     │
    │  └────────────────────┴─────────────────────┘                     │
    └─────────────────────────────────────────────────────────────────────┘
            │
            ▼
    ┌─────────────────────────────────────────────────────────────────────┐
    │              License管理 (/admin/license/*)                        │
    │  ┌──────────┬──────────┬──────────┬──────────┐                    │
    │  │Companies │ Projects │ Documents│ Training │                    │
    │  └────┬─────┴────┬─────┴──────────┴──────────┘                    │
    │       ▼          ▼                                                │
    │   [Detail]    [Detail]                                            │
    │   [Renewals]                                                      │
    └─────────────────────────────────────────────────────────────────────┘
            │
            ▼
    ┌─────────────────────────────────────────────────────────────────────┐
    │              Settings管理 (/admin/settings/*)                      │
    │  ┌──────────┬──────────┬──────────┬──────────┬──────────┐         │
    │  │ Members  │  Roles   │Audit Log │ Security │  System  │         │
    │  └──────────┴──────────┴──────────┴──────────┴──────────┘         │
    └─────────────────────────────────────────────────────────────────────┘

    ┌─────────────────────────────────────────────────────────────────────┐
    │         レガシーページ（旧構造 - 要整理）                           │
    │  /admin/audit, /admin/community, /admin/emergency,                 │
    │  /admin/enterprise, /admin/nodes, /admin/onboarding,               │
    │  /admin/parameters, /admin/prover, /admin/reports,                 │
    │  /admin/staff, /admin/tx-monitor                                   │
    └─────────────────────────────────────────────────────────────────────┘
```

---

### 4.9 Ecosystem（共通）画面遷移図

```
    ┌───────────────────────────────────────────────────────────────────────────────┐
    │                           Ecosystem                                            │
    │                          /ecosystem                                            │
    │                                                                               │
    │  ┌─────────────────────────────────────────────────────────────────────────┐ │
    │  │                      全アプリ共通ランディング                           │ │
    │  │                                                                         │ │
    │  │  ┌────────┬────────┬────────┬────────┬────────┬────────┬────────┐      │ │
    │  │  │Consumer│Token   │Govern- │ Prover │Observer│Explorer│Enter-  │      │ │
    │  │  │  App   │  Hub   │  ance  │ Portal │        │        │ prise  │      │ │
    │  │  └───┬────┴───┬────┴───┬────┴───┬────┴───┬────┴───┬────┴───┬────┘      │ │
    │  │      │        │        │        │        │        │                    │ │
    │  │      ▼        ▼        ▼        ▼        ▼        ▼                    │ │
    │  │  /consumer /token-hub /governance /prover /observer /explorer /enterprise│ │
    │  │  /landing  /landing    /landing   /landing /landing  /landing  /landing │ │
    │  └─────────────────────────────────────────────────────────────────────────┘ │
    │                                                                               │
    │                          ┌─────────────┐                                     │
    │                          │  Technical  │                                     │
    │                          │ /ecosystem/ │                                     │
    │                          │  technical  │                                     │
    │                          └─────────────┘                                     │
    └───────────────────────────────────────────────────────────────────────────────┘
```

---

### 4.10 遷移整合性チェックリスト

| アプリ | 遷移に矛盾 | 孤立画面 | 到達不能 | 修正必要 |
|--------|:----------:|:--------:|:--------:|:--------:|
| Consumer | ✅ なし | ✅ なし | ✅ なし | - |
| Token Hub | ✅ なし | ✅ なし | ✅ なし | - |
| Governance | ⚠️ あり | Council | - | Council→Dashboard遷移追加 |
| Prover | ✅ なし | ✅ なし | ✅ なし | - |
| Observer | ✅ なし | ✅ なし | ✅ なし | - |
| Explorer | ✅ なし | ✅ なし | ✅ なし | - |
| Enterprise | ✅ なし | ✅ なし | ✅ なし | - |
| QS Admin | ⚠️ あり | レガシー11画面 | - | 統合または削除検討 |

---

## 5. 画面×ジャーニー×APIマッピング

### 5.1 Consumer App（19画面 + 補助7画面 = 26画面）

#### 主要画面（19画面）

| # | 画面 | ジャーニー | シーケンス | API | 状況 |
|---|------|-----------|:----------:|-----|:----:|
| 1 | Landing | 登録前 | - | - | ✅ |
| 2 | Dashboard | ホーム | - | `GET /user/dashboard` | ✅ |
| 3 | Lock | Lock入力 | #1 | - | ✅ |
| 4 | Lock Processing | Lock処理中 | #1 | `POST /lock` | ✅ |
| 5 | Lock Success | Lock完了 | #1 | `GET /status/:lock_id` | ✅ |
| 6 | Unlock | Unlock選択 | #2 | - | ✅ |
| 7 | Unlock Processing | Unlock処理中 | #2 | `POST /unlock` | ✅ |
| 8 | Unlock Success | Unlock完了 | #2 | `GET /status/:lock_id` | ✅ |
| 9 | Emergency Bond | 緊急Unlock保証金 | #3 | - | ✅ |
| 10 | Emergency Processing | 緊急処理中 | #3 | `POST /unlock/emergency` | ✅ |
| 11 | Emergency Success | 緊急完了 | #3 | `GET /status/:lock_id` | ✅ |
| 12 | History | 履歴一覧 | - | `GET /user/transactions` | ✅ |
| 13 | History Detail | 履歴詳細 | - | `GET /user/transactions/:id` | ✅ |
| 14 | Notifications | 通知 | - | **❌ API無し** | ❌ |
| 15 | Settings | 設定 | - | `GET/POST /user/settings` | ✅ |
| 16 | Security | セキュリティ設定 | - | `GET/POST /user/settings` | ✅ |
| 17 | Key Management | Dilithium鍵管理 | - | `GET /user/keys` | ✅ |
| 18 | Help | ヘルプ | - | - (静的) | ✅ |
| 19 | Onboarding | 初回設定 | 登録 | `POST /auth/siwe` | ✅ |

#### 補助画面（7画面）

| # | 画面 | 用途 |
|---|------|------|
| 20 | Wallet Connect | ウォレット接続 |
| 21 | FAQ | よくある質問 |
| 22 | How It Works | 仕組み説明 |
| 23 | Terms | 利用規約 |
| 24 | Privacy | プライバシー |
| 25 | Contact | お問い合わせ |
| 26 | Cookie | Cookie設定 |

**不足**: 通知API、Resync画面

### 5.2 Token Hub（13画面 + 補助7画面 = 20画面）

#### 主要画面（13画面）

| # | 画面 | API | 状況 |
|---|------|-----|:----:|
| 1 | Landing | - | ✅ |
| 2 | Dashboard | `GET /token-hub/dashboard` | ✅ |
| 3 | Lock | - | ✅ |
| 4 | Lock Preview | `POST /token-hub/lock` | ✅ |
| 5 | Unlock | **❌ API無し** | ❌ |
| 6 | Rewards | `GET /token-hub/rewards` | ✅ |
| 7 | Rewards Claim | `POST /token-hub/claim` | ✅ |
| 8 | Rewards History | **❌ API無し** | ❌ |
| 9 | Delegate | `POST /token-hub/delegate` | ✅ |
| 10 | Delegate Detail | `GET /token-hub/delegates/:id` | ✅ |
| 11 | Delegate List | `GET /token-hub/delegates` | ✅ |
| 12 | Onboarding | - | ✅ |
| 13 | Settings | **❌ API無し** | ❌ |

#### 補助画面（7画面）

| # | 画面 | 用途 |
|---|------|------|
| 14 | FAQ | よくある質問 |
| 15 | Help | ヘルプ |
| 16 | Get QS | トークン取得 |
| 17 | Consumer Link | Consumer連携 |
| 18-20 | (予備) | 将来拡張用 |

**不足**: Unstake、履歴、Settings API

### 5.3 Governance（6画面 + 補助4画面 = 10画面）

#### 主要画面（6画面）

| # | 画面 | API | 状況 |
|---|------|-----|:----:|
| 1 | Landing | - | ✅ |
| 2 | Proposals | `GET /governance/proposals` | ✅ |
| 3 | Proposal Detail | `GET /governance/proposals/:id` | ✅ |
| 4 | Proposal Create | `POST /governance/proposals` | ✅ |
| 5 | Council | `GET /governance/council` | ✅ |
| 6 | History | `GET /governance/activity` | ✅ |

#### 補助画面（4画面）

| # | 画面 | 用途 |
|---|------|------|
| 7 | Onboarding | 初回説明 |
| 8 | Settings | 設定 |
| 9 | FAQ | よくある質問 |
| 10 | (予備) | 将来拡張用 |

**不足画面**: Committee Dashboard、Council/Committee Settings API

### 5.4 Prover Portal（9画面 + 補助6画面 = 15画面）

#### 主要画面（9画面）

| # | 画面 | API | 状況 |
|---|------|-----|:----:|
| 1 | Landing | - | ✅ |
| 2 | Dashboard | `GET /prover/:id/dashboard` | ✅ |
| 3 | Application | `POST /prover/register` | ✅ |
| 4 | Application Status | `GET /prover/:id/status` | ✅ |
| 5 | Queue | `GET /prover/:id/queue` | ✅ |
| 6 | Metrics | `GET /prover/:id/metrics` | ✅ |
| 7 | Alerts | `GET /prover/:id/alerts` | ✅ |
| 8 | Exit | `POST /prover/:id/exit` | ✅ |
| 9 | Challenges | `GET /prover/:id/challenges` | ✅ |

#### 補助画面（6画面）

| # | 画面 | 用途 |
|---|------|------|
| 10 | Requirements | 要件説明 |
| 11 | Login | ログイン |
| 12 | Terms | 利用規約 |
| 13 | Settings | 設定 |
| 14-15 | (予備) | 将来拡張用 |

**不足**: Settings API、Claim API（#14対応）

### 5.5 Observer（7画面 + 補助7画面 = 14画面）

#### 主要画面（7画面）

| # | 画面 | API | 状況 |
|---|------|-----|:----:|
| 1 | Dashboard | `GET /observer/dashboard` | ✅ |
| 2 | Pending | `GET /observer/pending-unlocks` | ✅ |
| 3 | Suspicious | `GET /observer/suspicious-txs` | ✅ |
| 4 | History | `GET /observer/history` | ✅ |
| 5 | Earnings | `GET /observer/earnings` | ✅ |
| 6 | Challenge New | **❌ API無し** | ❌ |
| 7 | Challenge Detail | `GET /observer/challenges/:id` | ✅ |

#### 補助画面（7画面）

| # | 画面 | 用途 |
|---|------|------|
| 8 | Landing | ランディング |
| 9 | Application | 登録申請 |
| 10 | Login | ログイン |
| 11 | Settings | 設定 |
| 12-14 | (予備) | 将来拡張用 |

**不足**: 登録API（#9対応）、検証API（#15対応）、Claim API（#16対応）、Settings API

### 5.6 Explorer（9画面 + 補助5画面 = 14画面）

#### 主要画面（9画面）

| # | 画面 | API | 状況 |
|---|------|-----|:----:|
| 1 | Overview | `GET /explorer/overview` | ✅ |
| 2 | Locks | `GET /explorer/locks` | ✅ |
| 3 | Lock Detail | `GET /explorer/locks/:id` | ✅ |
| 4 | Unlocks | `GET /explorer/unlocks` | ✅ |
| 5 | Unlock Detail | `GET /explorer/unlocks/:id` | ✅ |
| 6 | Challenges | `GET /explorer/challenges` | ✅ |
| 7 | Provers | `GET /explorer/provers` | ✅ |
| 8 | Analytics | `GET /explorer/analytics` | ✅ |
| 9 | Search | `GET /explorer/search` | ✅ |

#### 補助画面（5画面）

| # | 画面 | 用途 |
|---|------|------|
| 10 | Landing | ランディング |
| 11 | About | サービス説明 |
| 12-14 | (予備) | 将来拡張用 |

**完備** ✅

### 5.7 Enterprise Admin（31画面 + 補助4画面 = 35画面）

#### 主要画面（31画面）

| カテゴリ | 画面数 | API対応 | 不足 |
|----------|:------:|:-------:|------|
| Dashboard | 3 | ✅ | - |
| Users | 5 | ✅ | - |
| Transactions | 3 | ✅ | - |
| API Keys | 3 | ✅ | - |
| Webhooks | 2 | ❌ | API無し |
| Billing | 2 | ❌ | API無し |
| Reports | 3 | △ | Compliance無し |
| Settings | 3 | ✅ | - |
| Apply Flow | 5 | ✅ | - |
| Approvals | 1 | ❌ | API無し |
| Provers | 1 | ❌ | API無し |

#### 補助画面（4画面）

| # | 画面 | 用途 |
|---|------|------|
| 32 | Landing | エンタープライズ紹介 |
| 33 | Onboarding | 初回設定フロー |
| 34 | KYB | 法人確認 |
| 35 | Contract | 契約管理 |

### 5.8 QS Admin（61画面）

> **注**: 当初70+画面予定だったが、精査の結果61画面に整理

| カテゴリ | 画面数 | API対応 | 状況 |
|----------|:------:|:-------:|:----:|
| Dashboard | 1 | ✅ | ✅ |
| Public - Users | 3 | ❌ | ❌ |
| Public - Provers | 5 | △ | 部分的 |
| Public - Observers | 3 | ❌ | ❌ |
| Public - Token | 3 | ❌ | ❌ |
| Public - Governance | 4 | △ | 部分的 |
| Public - Treasury | 4 | △ | 部分的 |
| Public - Protocol | 3 | ❌ | ❌ |
| SaaS - Operators | 5 | △ | 部分的 |
| SaaS - Users | 3 | ❌ | ❌ |
| SaaS - Provers | 4 | ❌ | ❌ |
| SaaS - Observers | 2 | ❌ | ❌ |
| SaaS - Billing | 4 | ❌ | ❌ |
| SaaS - Infrastructure | 3 | ❌ | ❌ |
| SaaS - Support | 2 | ❌ | ❌ |
| License | 7 | ❌ | ❌ |
| Settings | 5 | △ | 部分的 |

**合計**: 61画面
**API対応率**: 約25%（61画面中約15画面）

---

## 6. DB/データ設計

### 6.1 オンチェーンデータ（スマートコントラクト）

#### L1 Vault Contract

```
Lock
├── lock_id: bytes32 (PK)
├── chain_id: uint256
├── asset: address
├── amount: uint256
├── dest_addr: bytes
├── expiry: uint256
├── nonce: uint256
├── pk_dilithium: bytes
├── SR_0: bytes32 (State Root)
├── status: enum(pending, confirmed, unlocked)
└── created_at: uint256

Unlock
├── unlock_id: bytes32 (PK)
├── lock_id: bytes32 (FK)
├── SR_1: bytes32
├── selected_provers: address[]
├── sphincs_sigs: bytes[]
├── release_time: uint256
├── status: enum(pending, time_locked, claimable, completed, cancelled, challenged)
├── is_emergency: bool
└── emergency_bond: uint256

Challenge
├── challenge_id: bytes32 (PK)
├── unlock_id: bytes32 (FK)
├── challenger: address
├── evidence: bytes
├── bond: uint256
├── defense_deadline: uint256
├── status: enum(pending, resolved)
└── result: enum(challenger_won, prover_won)
```

#### L1 Staking Contract

```
Prover
├── operator_addr: address (PK)
├── sphincs_pubkey: bytes
├── stake_amount: uint256
├── hsm_attestation: bytes
├── status: enum(pending, active, exiting, exited, slashed)
├── registered_at: uint256
├── approved_at: uint256
├── exit_requested_at: uint256
└── unbonding_end: uint256

Observer
├── observer_addr: address (PK)
├── stake_amount: uint256
├── status: enum(pending, active, exiting, exited)  // pending追加
├── registered_at: uint256
├── exit_requested_at: uint256
├── unbonding_end: uint256
└── total_rewards: uint256
```

#### Governance Contract

```
Proposal
├── proposal_id: bytes32 (PK)
├── proposer: address
├── actions: bytes[]
├── bond: uint256
├── status: enum(review, discussion, voting, timelock, executed, rejected, vetoed)
├── discussion_end: uint256
├── voting_end: uint256
├── timelock_end: uint256
├── votes_for: uint256
└── votes_against: uint256

Vote
├── proposal_id: bytes32 (FK)
├── voter: address
├── support: bool
└── weight: uint256

Council Member
├── member_addr: address (PK)
├── council_type: enum(security, purpose)
└── added_at: uint256
```

### 6.2 オフチェーンデータ（PostgreSQL）

#### User Management

```sql
-- ユーザー基本情報
CREATE TABLE users (
    id UUID PRIMARY KEY,
    wallet_address VARCHAR(42) UNIQUE NOT NULL,
    enterprise_id UUID REFERENCES enterprises(id),
    country_code VARCHAR(2),
    is_sanctioned_checked BOOLEAN DEFAULT FALSE,
    terms_accepted_at TIMESTAMP,
    terms_version VARCHAR(10),
    created_at TIMESTAMP DEFAULT NOW(),
    last_active_at TIMESTAMP
);

-- Dilithium鍵管理
CREATE TABLE user_dilithium_keys (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    pk_dilithium BYTEA NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    revoked_at TIMESTAMP
);

-- 通知設定
CREATE TABLE user_notifications (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### Observer

```sql
-- Observer登録情報
CREATE TABLE observers (
    id UUID PRIMARY KEY,
    wallet_address VARCHAR(42) UNIQUE NOT NULL,
    entity_type VARCHAR(20) NOT NULL, -- individual/company
    alias VARCHAR(100),
    email VARCHAR(255),
    country_code VARCHAR(2),
    stake_amount DECIMAL(36, 18),
    status VARCHAR(20) DEFAULT 'pending', -- pending/active/exiting/exited
    notification_webhook VARCHAR(500),

    -- 規約同意（Section 3.1.2と整合）
    terms_accepted_at TIMESTAMP,
    terms_version VARCHAR(10),

    -- 退出管理
    exit_requested_at TIMESTAMP,
    unbonding_end_at TIMESTAMP,

    -- 統計
    total_challenges INTEGER DEFAULT 0,
    successful_challenges INTEGER DEFAULT 0,
    total_earnings DECIMAL(36, 18) DEFAULT 0,

    created_at TIMESTAMP DEFAULT NOW(),
    approved_at TIMESTAMP
);

-- Observer KYB情報（高額ステーク法人用）
CREATE TABLE observer_kyb (
    id UUID PRIMARY KEY,
    observer_id UUID REFERENCES observers(id),
    legal_name VARCHAR(255) NOT NULL,
    registration_number VARCHAR(100),
    country VARCHAR(2),
    kyb_status VARCHAR(20) DEFAULT 'pending', -- pending/approved/rejected
    kyb_reviewed_by UUID,
    kyb_reviewed_at TIMESTAMP,
    kyb_notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### Prover KYB

```sql
-- Prover KYB情報
CREATE TABLE prover_kyb (
    id UUID PRIMARY KEY,
    prover_wallet VARCHAR(42) UNIQUE NOT NULL,

    -- 法人基本情報
    legal_name VARCHAR(255) NOT NULL,
    registration_number VARCHAR(100),
    incorporation_country VARCHAR(2),
    incorporation_date DATE,
    business_address TEXT,
    registered_address TEXT,
    business_type VARCHAR(50),

    -- 審査結果
    kyb_status VARCHAR(20) DEFAULT 'pending',
    kyb_risk_rating VARCHAR(10),
    kyb_reviewed_by UUID,
    kyb_reviewed_at TIMESTAMP,
    kyb_notes TEXT,
    rekyb_due_date DATE,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP
);

-- Prover 役員・UBO情報
CREATE TABLE prover_directors (
    id UUID PRIMARY KEY,
    prover_kyb_id UUID REFERENCES prover_kyb(id),
    role VARCHAR(20) NOT NULL, -- director/ubo
    full_name VARCHAR(255) NOT NULL,
    nationality VARCHAR(2),
    date_of_birth DATE,
    ownership_percentage DECIMAL(5, 2),
    pep_check_result VARCHAR(20),
    sanction_check_result VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Prover 提出書類
CREATE TABLE prover_documents (
    id UUID PRIMARY KEY,
    prover_kyb_id UUID REFERENCES prover_kyb(id),
    document_type VARCHAR(50) NOT NULL,
    file_hash VARCHAR(64) NOT NULL,
    file_path VARCHAR(500),
    uploaded_at TIMESTAMP DEFAULT NOW(),
    verified_at TIMESTAMP,
    verified_by UUID
);
```

#### Enterprise

```sql
-- Enterprise基本情報
CREATE TABLE enterprises (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    legal_name VARCHAR(255),
    registration_number VARCHAR(100),
    country VARCHAR(2),
    industry VARCHAR(100),
    website VARCHAR(500),

    -- KYB
    kyb_status VARCHAR(20) DEFAULT 'pending',
    kyb_risk_rating VARCHAR(10),

    -- プラン・契約
    plan VARCHAR(20),
    contract_status VARCHAR(20) DEFAULT 'draft',
    contract_signed_at TIMESTAMP,

    -- 課金
    billing_email VARCHAR(255),
    billing_address TEXT,
    api_quota INTEGER DEFAULT 1000,

    created_at TIMESTAMP DEFAULT NOW(),
    approved_at TIMESTAMP
);

-- Enterpriseメンバー
CREATE TABLE enterprise_members (
    id UUID PRIMARY KEY,
    enterprise_id UUID REFERENCES enterprises(id),
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    role VARCHAR(20) DEFAULT 'member',
    wallet_address VARCHAR(42),
    mfa_enabled BOOLEAN DEFAULT FALSE,
    invited_at TIMESTAMP DEFAULT NOW(),
    joined_at TIMESTAMP
);

-- Enterprise契約
CREATE TABLE enterprise_contracts (
    id UUID PRIMARY KEY,
    enterprise_id UUID REFERENCES enterprises(id),
    contract_type VARCHAR(50) NOT NULL,
    contract_version VARCHAR(20),
    signed_at TIMESTAMP,
    signed_by_name VARCHAR(255),
    signed_by_title VARCHAR(100),
    document_hash VARCHAR(64),
    valid_from DATE,
    valid_until DATE,
    auto_renew BOOLEAN DEFAULT TRUE
);

-- Webhook設定
CREATE TABLE webhooks (
    id UUID PRIMARY KEY,
    enterprise_id UUID REFERENCES enterprises(id),
    url VARCHAR(500) NOT NULL,
    events TEXT[] NOT NULL,
    secret_hash VARCHAR(64),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    last_triggered_at TIMESTAMP
);

-- 請求書
CREATE TABLE invoices (
    id UUID PRIMARY KEY,
    enterprise_id UUID REFERENCES enterprises(id),
    amount DECIMAL(18, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    period_start DATE,
    period_end DATE,
    status VARCHAR(20) DEFAULT 'draft',
    issued_at TIMESTAMP,
    paid_at TIMESTAMP
);
```

#### QS Foundation

```sql
-- 財団スタッフ
CREATE TABLE admin_members (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    employee_id VARCHAR(50),
    department VARCHAR(100),
    role VARCHAR(20) NOT NULL,
    permissions JSONB,
    wallet_address VARCHAR(42),
    mfa_enabled BOOLEAN DEFAULT TRUE,
    background_check_completed BOOLEAN DEFAULT FALSE,
    confidentiality_signed BOOLEAN DEFAULT FALSE,
    last_security_training DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    created_by UUID,
    last_login_at TIMESTAMP
);

-- 監査ログ
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY,
    actor_type VARCHAR(20) NOT NULL,
    actor_id VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id VARCHAR(100),
    metadata JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- トランザクションログ（AML用）
CREATE TABLE transaction_logs (
    id UUID PRIMARY KEY,
    tx_hash VARCHAR(66),
    user_wallet VARCHAR(42),
    action VARCHAR(20) NOT NULL,
    amount DECIMAL(36, 18),
    asset VARCHAR(42),
    ip_address_hash VARCHAR(64),
    country_code VARCHAR(2),
    risk_score INTEGER,
    flagged BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 7. 規制対応要件

### 7.1 対象規制

| 規制 | 対象 | 要件 |
|------|------|------|
| KYC | 個人ユーザー | 簡易確認（パブリック版は非管理型） |
| KYB | Prover, Enterprise | 法人確認必須 |
| AML/CFT | 全体 | 取引監視、制裁リストチェック |
| GDPR | EU顧客 | 個人情報保護、削除権 |

### 7.2 登場人物別要件

| 登場人物 | KYC/KYB | 制裁チェック | 監査ログ | 書類保存 |
|----------|:-------:|:------------:|:--------:|:--------:|
| Consumer | △ 簡易 | ✅ 必須 | ✅ 必須 | - |
| Prover | ✅ KYB必須 | ✅ 必須 | ✅ 必須 | ✅ 必須 |
| Observer | △ 金額次第 | ✅ 必須 | ✅ 必須 | △ |
| Token Holder | - | △ 推奨 | △ 推奨 | - |
| Enterprise | ✅ KYB必須 | ✅ 必須 | ✅ 必須 | ✅ 必須 |
| QS Staff | - | - | ✅ 必須 | ✅ 必須 |

### 7.3 必須実装項目

1. **制裁国チェック**: GeoIPによる接続国確認、OFAC等の制裁リスト照合
2. **利用規約同意記録**: 同意日時、バージョン、IPアドレス（ハッシュ化）
3. **取引監視**: 異常パターン検知、リスクスコアリング
4. **監査証跡**: 全管理操作のログ記録
5. **書類管理**: KYB書類の安全な保存、有効期限管理

---

## 8. Gap分析結果（包括的レビュー）

> **レビュー日**: 2026-01-21
> **レビュー観点**: 設定画面整合性、シーケンス、API、DB、ペルソナ指摘事項

### 8.1 設定画面の整合性分析

#### 8.1.1 URL_REFERENCE vs DESIGN_SPEC 比較

| アプリ | URL_REFERENCE（実装） | DESIGN_SPEC（設計） | GAP |
|--------|----------------------|-------------------|-----|
| Consumer | Settings, Security, Keys (3) | セキュリティ、通知、表示、アカウント (4) | 通知・表示・アカウント設定画面なし |
| Token Hub | Settings (1) | ステーク、通知、委任、表示 (4) | サブページなし |
| Governance | **なし** (codebaseには存在) | - | URL_REFERENCEに未記載 |
| Prover | Settings (1) | ノード設定、アラート、運用、KYB、アカウント (5) | サブページなし |
| Observer | Settings (1) | 監視設定、通知、Challenge、アカウント (4) | サブページなし |
| Enterprise | Settings (1) | 会社情報、セキュリティ等 (7) | Webhook/Billingは別画面あり |
| QS Admin | Members, Roles, Audit, Security, System (5) | システム、セキュリティ、通知、監査、緊急対応 (5) | ✅ 概ね一致 |

#### 8.1.2 設定画面の不足

| 画面 | 必要理由 | 対応するAPI | 対応するDB |
|------|----------|------------|-----------|
| Governance Settings | 鈴木/渡辺ペルソナ要望 | ❌ なし | ❌ なし |
| Council/Committee Settings | 伊藤/中村ペルソナ要望 | ❌ なし | ❌ なし |
| Consumer Notifications Settings | 田中ペルソナ要望 | ❌ なし | ✅ user_notifications |
| Prover Settings sub-pages | 山田ペルソナ要望 | ❌ なし | ❌ prover_settings なし |
| Observer Settings sub-pages | 小林ペルソナ要望 | ❌ なし | ❌ observer_settings なし |

#### 8.1.3 設定データ保存用DB不足

```sql
-- 不足テーブル1: ユーザー設定
CREATE TABLE user_settings (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    language VARCHAR(5) DEFAULT 'ja',
    currency VARCHAR(3) DEFAULT 'USD',
    theme VARCHAR(10) DEFAULT 'dark',
    email_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT FALSE,
    notification_types JSONB, -- {"lock_complete": true, "unlock_waiting": true, ...}
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 不足テーブル2: Prover設定
CREATE TABLE prover_settings (
    id UUID PRIMARY KEY,
    prover_wallet VARCHAR(42) REFERENCES provers(operator_addr),
    auto_sign BOOLEAN DEFAULT TRUE,
    maintenance_mode BOOLEAN DEFAULT FALSE,
    alert_email VARCHAR(255),
    alert_webhook VARCHAR(500),
    alert_slack VARCHAR(500),
    alert_thresholds JSONB, -- {"uptime_min": 99.5, "response_time_max": 1000}
    log_level VARCHAR(10) DEFAULT 'INFO',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 不足テーブル3: Observer設定
CREATE TABLE observer_settings (
    id UUID PRIMARY KEY,
    observer_id UUID REFERENCES observers(id),
    auto_verify BOOLEAN DEFAULT TRUE,
    verify_interval_minutes INTEGER DEFAULT 5,
    auto_challenge BOOLEAN DEFAULT FALSE,
    max_auto_challenge_bond DECIMAL(36,18),
    confidence_threshold INTEGER DEFAULT 90,
    webhook_url VARCHAR(500),
    email_notifications BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 不足テーブル4: Council/Committee設定
CREATE TABLE council_member_settings (
    id UUID PRIMARY KEY,
    member_addr VARCHAR(42) NOT NULL,
    council_type VARCHAR(20) NOT NULL, -- security/purpose
    emergency_sms VARCHAR(20),
    emergency_telegram VARCHAR(100),
    signature_key_type VARCHAR(20), -- ledger/trezor/gnosis
    notification_preferences JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

---

### 8.2 画面の過不足（更新版）

#### 不足画面

| システム | 不足画面 | 理由 | シーケンス | ペルソナ指摘 |
|----------|----------|------|:----------:|:-----------:|
| Consumer | Resync画面 | シーケンス#3'対応 | #3' | - |
| Consumer | 通知設定画面 | 設定詳細に記載 | - | 田中 T-3 |
| Observer | 登録/申請画面 | ジャーニー欠落 | #9 | 小林 O-1 |
| Observer | チャレンジ詳細画面 | #15対応 | #15 | 小林 |
| Observer | 要件確認画面 | 登録フロー | #9 | 小林 |
| Governance | Council Dashboard | Security Council用 | #8, #28 | 伊藤 C-1 |
| Governance | Committee Dashboard | Purpose Committee用 | #29 | 中村 P-1 |
| Governance | Settings画面 | URL_REFERENCEに未記載 | - | 鈴木/渡辺 |
| Prover | 申請ステータス画面 | 審査待ち表示 | #5 | 山田 Y-3 |
| Prover | チャレンジ対応画面 | #4 Defense対応 | #4 | 山田 |
| Token Hub | 履歴画面（API連携） | 画面はあるがAPI無し | - | 鈴木 K-4 |

#### 過剰/要検討

| システム | 画面 | 検討事項 |
|----------|------|----------|
| QS Admin | 61画面中約46画面 | APIが無い画面が多い（API対応率25%） |

---

### 8.3 APIの過不足（更新版）

#### 不足API一覧（ペルソナ指摘含む）

| 優先度 | カテゴリ | エンドポイント | 用途 | ペルソナ指摘 |
|:------:|----------|---------------|------|:-----------:|
| P0 | Observer | `POST /observer/register` | 登録申請 | 小林 O-1 |
| P0 | Observer | `POST /observer/verify` | 検証実行 | 小林 O-2 |
| P0 | Observer | `POST /observer/claim` | 報酬引出 | 小林 O-3 |
| P0 | Prover | `POST /prover/:id/claim` | 報酬引出 | 山田 Y-1 |
| P0 | Token Hub | `POST /token-hub/unstake` | アンステーク | 鈴木 K-1 |
| P0 | Enterprise | `GET/POST /enterprise/:id/webhooks` | Webhook管理 | 佐藤 S-1 |
| P0 | QS Admin | `POST /admin/provers/:id/approve` | Prover承認 | 高橋 A-2 |
| P1 | Token Hub | `POST /token-hub/extend` | ロック期間延長 | 鈴木 K-2 |
| P1 | Token Hub | `POST /token-hub/undelegate` | 委任解除 | 鈴木 K-5 |
| P1 | Token Hub | `GET /token-hub/history` | ステーク履歴 | 鈴木 K-4 |
| P1 | Consumer | `GET /user/notifications` | 通知一覧 | 田中 T-3 |
| P1 | Enterprise | `GET /enterprise/:id/billing` | 請求情報 | 佐藤 S-3 |
| P1 | QS Admin | `POST /admin/challenges/:id/slash` | Slash実行 | 高橋 A-3 |
| P2 | Observer | `GET /observer/:id/exit` | 退出申請 | - |
| P2 | Settings | `GET/POST /user/settings` | ユーザー設定 | 田中 |
| P2 | Settings | `GET/POST /prover/:id/settings` | Prover設定 | 山田 |
| P2 | Settings | `GET/POST /observer/:id/settings` | Observer設定 | 小林 |
| P2 | Settings | `GET/POST /governance/settings` | Governance設定 | 鈴木/渡辺 |

#### シーケンス→API対応状況

| # | シーケンス | 必要API | 実装状況 |
|---|-----------|---------|:--------:|
| 1 | Lock | `/lock` | ✅ |
| 2 | Unlock (Normal) | `/unlock` | ✅ |
| 3 | Unlock (Emergency) | `/unlock/emergency` | ✅ |
| 3' | Resync | `/resync` | ✅ |
| 4 | Challenge + Slashing | `/challenge/*` | ✅ |
| 5 | Prover Registration | `/prover/register` | ✅ |
| 6 | Prover Exit | `/prover/:id/exit` | ✅ |
| 7 | Governance Proposal | `/governance/*` | ✅ |
| 8 | Emergency Pause | `/emergency/*` | ✅ |
| 9 | Observer Registration | `/observer/register` | ❌ |
| 10 | Observer Exit | `/observer/:id/exit` | ❌ |
| 11 | Enterprise Application | `/enterprise/apply` | ✅ |
| 12 | Enterprise Termination | `/enterprise/:id/terminate` | △ |
| 13 | Prover Signing | `/prover/:id/sign` | ✅ |
| 14 | Prover Rewards Claim | `/prover/:id/claim` | ❌ |
| 15 | Observer Verification | `/observer/verify`, `/challenge/submit` | ❌ |
| 16 | Observer Rewards Claim | `/observer/claim` | ❌ |
| 17 | Token Staking | `/token-hub/lock` | ✅ |
| 18 | Token Unstaking | `/token-hub/unstake` | ❌ |
| 19 | Token Delegation | `/token-hub/delegate` | ✅ |
| 20 | Token Rewards Claim | `/token-hub/claim` | ✅ |
| 21 | Enterprise User Management | `/enterprise/:id/users/*` | ✅ |
| 22 | Enterprise API Key Management | `/enterprise/:id/api-keys` | ✅ |
| 23 | Enterprise Team Management | `/enterprise/:id/members/*` | ❌ |
| 24 | QS Admin Prover Approval | `/admin/provers/:id/approve` | ❌ |
| 25 | QS Admin Slash Execution | `/admin/challenges/:id/slash` | ❌ |
| 26 | QS Admin Enterprise Approval | `/admin/enterprises/:id/approve` | ❌ |
| 27 | Treasury Withdrawal | `/treasury/withdraw` | ✅ |
| 28 | Security Council Veto | `/council/veto/*` | △ |
| 29 | Purpose Committee Review | `/committee/proposals/*` | △ |

**API実装率**: 29シーケンス中 約17本実装済み（59%）

---

### 8.4 DB/データの過不足（更新版）

#### テーブル設計状況

| テーブル | 状況 | 備考 |
|----------|:----:|------|
| users | ✅ 設計済み | Section 5.2参照 |
| user_dilithium_keys | ✅ 設計済み | Section 5.2参照 |
| user_notifications | ✅ 設計済み | Section 5.2参照 |
| **user_settings** | ❌ 未設計 | **7.1.3で追加提案** |
| observers | ✅ 設計済み | Section 5.2参照 |
| observer_kyb | ✅ 設計済み | Section 5.2参照 |
| **observer_settings** | ❌ 未設計 | **7.1.3で追加提案** |
| prover_kyb | ✅ 設計済み | Section 5.2参照 |
| prover_documents | ✅ 設計済み | Section 5.2参照 |
| **prover_settings** | ❌ 未設計 | **7.1.3で追加提案** |
| enterprise_contracts | ✅ 設計済み | Section 5.2参照 |
| audit_logs | ✅ 設計済み | Section 5.2参照 |
| **council_member_settings** | ❌ 未設計 | **7.1.3で追加提案** |

---

## 9. 優先度付き対応リスト（ペルソナ指摘統合版）

### P0: 必須（9名ペルソナが機能不足と指摘）

| # | 対応項目 | 種別 | 指摘者 | 備考 |
|---|----------|------|--------|------|
| 1 | Observer登録フロー完備 | 画面+API+DB | 小林 | シーケンス#9, #10対応 |
| 2 | Observer検証API | API | 小林 | シーケンス#15対応 |
| 3 | Observer報酬Claim API | API | 小林 | シーケンス#16対応 |
| 4 | Prover報酬Claim API | API | 山田 | シーケンス#14対応 |
| 5 | Token Unstake API | API | 鈴木 | シーケンス#18対応 |
| 6 | Enterprise Webhook API | API | 佐藤 | 既存画面と連携 |
| 7 | QS Admin Prover承認API | API | 高橋 | シーケンス#24対応 |
| 8 | 専門用語の図解説明 | UX | 田中 | Onboarding改善 |
| 9 | Council緊急通知インフラ | インフラ | 伊藤 | SMS/Telegram連携 |
| 10 | Committee審査画面にCore Principles表示 | UX | 中村 | シーケンス#29対応 |

### P1: 重要（複数ペルソナ指摘）

| # | 対応項目 | 種別 | 指摘者 | 備考 |
|---|----------|------|--------|------|
| 11 | Token Lock期間延長API | API | 鈴木 | veToken標準機能 |
| 12 | Token Undelegate API | API | 鈴木 | デリゲート解除 |
| 13 | Token Hub履歴API | API | 鈴木 | 画面はあるがAPI無し |
| 14 | Consumer通知機能 | 画面+API | 田中 | 設定画面と連携 |
| 15 | Enterprise Billing API | API | 佐藤 | 既存画面と連携 |
| 16 | QS Admin Slash実行API | API | 高橋 | シーケンス#25対応 |
| 17 | 署名進捗リアルタイム表示 | 仕様 | 伊藤 | Council Dashboard |
| 18 | モバイル署名対応 | 機能 | 伊藤 | Emergency Pause用 |
| 19 | 監査ログフィルタ・エクスポート | API | 佐藤 | 規制対応 |
| 20 | メトリクスPDF出力 | 機能 | 山田 | 取締役会報告用 |

### P2: 中（改善推奨）

| # | 対応項目 | 種別 | 指摘者 | 備考 |
|---|----------|------|--------|------|
| 21 | 設定用DBテーブル追加 | DB | 全員 | 7.1.3参照 |
| 22 | 設定API全般 | API | 全員 | 各アプリ共通 |
| 23 | veQS減衰グラフ表示 | 仕様 | 鈴木 | Dashboard表示 |
| 24 | VRF確率計算機 | 機能 | 小林 | Observer Dashboard |
| 25 | OGP動的生成 | 仕様 | 渡辺 | SNS共有用 |
| 26 | SNS共有ボタン | 仕様 | 渡辺 | 投票結果共有 |
| 27 | 一括承認/却下機能 | 機能 | 高橋 | QS Admin効率化 |
| 28 | 委員間ディスカッション | 機能 | 中村 | Purpose Committee |
| 29 | Emergency Pauseモバイル対応 | 機能 | 高橋 | PWA検討 |

### P3: 低（後回し可）

| # | 対応項目 | 種別 | 備考 |
|---|----------|------|------|
| 30 | QS Admin SaaS管理API（~15本） | API | スコープ要検討 |
| 31 | QS Admin ライセンス管理 | 画面+API+DB | 将来機能 |
| 32 | Veto理由公開フロー | 仕様 | 伊藤指摘 |
| 33 | 委員会議事録機能 | 機能 | 中村指摘 |

---

## 付録

### A. 既存API一覧（参照）

ファイル: `/services/api/src/routes/mod.rs`

合計約120エンドポイント。主要カテゴリ:
- Auth (3), Lock/Unlock (4), User (5), Prover (12)
- Challenge (4), Token Hub (9), Governance (8), Council (8)
- Enterprise (23), Observer (8), Treasury (6), Explorer (12)
- Admin (27+), Resync (3), Emergency (4), Fees (2), Insurance (4)

### B. 画面一覧（参照）

ファイル: `/docs_new/01_phase/06_phase6/URL_REFERENCE.md`

| 分類 | 画面数 | 備考 |
|------|:------:|------|
| URL_REFERENCE.md記載 | 160画面 | 実装済み・作業中 |
| Section 5総計（補助含む） | 195画面 | 計画含む |
| 差分 | 35画面 | 補助画面・将来予定 |

> **注**: Section 5の画面数は補助画面（Landing, Onboarding等）を含む計画値。
> URL_REFERENCEは実装済み画面のみ記載。

### C. シーケンス詳細（参照）

ファイル: `/docs_new/00_core/specs/SEQUENCES.md`

---

## 10. ペルソナレビュー結果

> 各ペルソナ視点でDESIGN_SPECをレビューし、改善要望を記録

### 10.1 田中さん（Consumer / 32歳）

**担当システム**: Consumer App, Token Hub, Explorer
**技術レベル**: ★★☆☆☆
**主な利用デバイス**: スマートフォン（通勤中にチェック）

#### レビューコメント

> 「えーと、このドキュメント見たんですけど、専門用語が多くて正直ちょっと...
> DilithiumとかSPHINCS+とか言われても、それが何なのか分からないと不安なんですよね。
> あと、24時間待たないとアンロックできないのは分かったけど、なんで24時間なの？
> 通勤中にスマホでチェックすることが多いから、スマホで見やすいといいな」

#### 懸念点と改善要望

| # | 重要度 | 画面/機能 | 懸念 | 改善提案 |
|---|:------:|----------|------|---------|
| T-1 | 高 | Consumer全般 | 「Dilithium鍵」「量子耐性」の説明が不足 | Onboarding時に図解付きの説明モーダル追加 |
| T-2 | 高 | Unlock待機画面 | 24時間待機の理由が不明 | 「なぜ24時間？」FAQリンク+ツールチップ追加 |
| T-3 | 中 | 通知機能 | 現状APIが❌（未実装） | 通知機能は初心者の安心感に直結、P1優先度を推奨 |
| T-4 | 中 | 設定画面 | 「アクティブセッション」が分からない | 平易な日本語に（例:「ログイン中の端末」） |
| T-5 | 低 | 言語設定 | 英語切替があるが自分には不要 | 自動検出＋必要な人だけ切替できるUIに |

#### 総合評価
- 使いやすさ: ⭐⭐⭐☆☆（専門用語が多い）
- 安心感: ⭐⭐⭐⭐☆（機能は網羅的だが説明不足）
- モバイル対応: ⭐⭐⭐☆☆（設定機能が深い階層で迷いそう）

---

### 10.2 山田さん（Prover / 45歳）

**担当システム**: Prover Portal
**技術レベル**: ★★★★★
**主な利用デバイス**: PC（ダッシュボードを常時監視）

#### レビューコメント

> 「設計としてはしっかりしていますね。ただ、取締役会への報告を考えると、
> メトリクスのPDF出力機能は必須です。あと、報酬Claimのシーケンス#14が新しく
> 追加されましたが、APIは❌（未実装）ですよね？これは早めに対応してほしい。
> $400K+のステークをしている身としては、収益の可視化と引出しは最重要です」

#### 懸念点と改善要望

| # | 重要度 | 画面/機能 | 懸念 | 改善提案 |
|---|:------:|----------|------|---------|
| Y-1 | 高 | Prover報酬Claim | `/prover/:id/claim` APIが❌未実装 | P0優先度に引き上げ |
| Y-2 | 高 | メトリクス画面 | PDF出力機能が設定詳細に記載なし | メトリクス・レポートのPDF/CSVエクスポート機能追加 |
| Y-3 | 中 | KYB書類提出 | `/prover/kyb` APIが❌未実装 | KYBフローを完結させるAPI設計が必要 |
| Y-4 | 中 | アラート | 優先度表示の仕様が不明確 | アラート優先度（Critical/Warning/Info）の定義明確化 |
| Y-5 | 低 | 退出フロー | 7日間の待機期間中のUI状態が不明 | 待機中ステータス表示・カウントダウン追加 |

#### 総合評価
- データの正確性: ⭐⭐⭐⭐☆（メトリクス詳細は十分）
- プロフェッショナル感: ⭐⭐⭐⭐☆（取締役会向け出力がほしい）
- 運用効率: ⭐⭐⭐⭐⭐（署名キュー・アラートの設計は良い）

---

### 10.3 佐藤さん（Enterprise / 38歳）

**担当システム**: Enterprise Admin
**技術レベル**: ★★★★☆
**主な利用デバイス**: PC（長時間ダッシュボード監視）

#### レビューコメント

> 「API統合関連の設計は充実していますね。ただ、Webhook設定のAPIが❌になっている
> のは困ります。うちみたいな取引所だと、イベント通知はリアルタイムで受け取りたい
> ので必須機能です。あと、監査ログのフィルタリング・エクスポート機能について
> 詳細仕様が見当たらないのですが、規制当局への報告で絶対必要です」

#### 懸念点と改善要望

| # | 重要度 | 画面/機能 | 懸念 | 改善提案 |
|---|:------:|----------|------|---------|
| S-1 | 高 | Webhook設定 | `/enterprise/:id/webhooks` APIが❌未実装 | P0優先度に引き上げ |
| S-2 | 高 | 監査ログ | フィルタリング・エクスポート詳細仕様なし | 監査ログのフィルタ条件・出力フォーマット仕様追加 |
| S-3 | 高 | 課金管理 | Billing APIが❌未実装 | 請求書発行・支払い履歴のAPI設計 |
| S-4 | 中 | チーム管理 | メンバー招待・ロール変更APIが❌ | 基本的なIAM機能のAPI設計 |
| S-5 | 中 | ブランディング | 設定画面に「将来」と記載あり | ホワイトラベル対応の優先度・ロードマップ明確化 |
| S-6 | 低 | ダークモード | 長時間使用で目が疲れる可能性 | ライトモード/自動切替オプション追加 |

#### 総合評価
- API/統合: ⭐⭐⭐☆☆（Webhook未実装は致命的）
- 監査対応: ⭐⭐⭐☆☆（エクスポート仕様が不明）
- 長時間使用: ⭐⭐⭐⭐☆（設定は充実）

---

### 10.4 鈴木さん（Token Holder / 28歳）

**担当システム**: Consumer App, Token Hub, Governance
**技術レベル**: ★★★★☆
**主な利用デバイス**: PC / スマートフォン

#### レビューコメント

> 「DeFiユーザーとしては、veQSの減衰曲線グラフがほしいですね。設定画面に
> 『veQS減衰グラフ表示』と書いてあるけど、どこで見れるのか分からない。
> あと、Token HubのUnstake APIが❌なのはマズいでしょ。Curve、Aaveとか他の
> プロトコルと比べても、基本機能だと思います。あ、ダークモードはデフォルトで
> いいけど、ライトモードもあると嬉しい人いるかも」

#### 懸念点と改善要望

| # | 重要度 | 画面/機能 | 懸念 | 改善提案 |
|---|:------:|----------|------|---------|
| K-1 | 高 | Token Unstake | `/token-hub/unstake` APIが❌未実装 | P0優先度に引き上げ（基本機能） |
| K-2 | 高 | ロック期間延長 | `/token-hub/extend` APIが❌未実装 | veTokenでは標準機能、同時実装推奨 |
| K-3 | 中 | veQS減衰グラフ | 設定に記載あるが画面仕様不明 | Dashboard/Lock画面でグラフ表示位置明確化 |
| K-4 | 中 | 履歴確認 | `/token-hub/history` APIが❌未実装 | ステーク・報酬履歴の一覧API設計 |
| K-5 | 中 | 委任解除 | `/token-hub/undelegate` APIが❌未実装 | デリゲート機能は委任・解除セットで実装 |
| K-6 | 低 | ライトモード | ダークモードのみ | テーマ切替オプション追加（将来） |

#### 総合評価
- DeFi標準との整合性: ⭐⭐⭐☆☆（基本APIが未実装）
- 投票体験: ⭐⭐⭐⭐☆（Governance APIは充実）
- 差別化: ⭐⭐⭐⭐⭐（Premium Japanコンセプトは独自性あり）

---

### 10.5 渡辺さん（Delegate / 42歳）

**担当システム**: Token Hub, Governance, Explorer
**技術レベル**: ★★★★☆
**主な利用デバイス**: PC（複数DAO管理）

#### レビューコメント

> 「Delegateとしては、自分への委任状況と投票履歴が一目で分かることが大事。
> Governanceの提案一覧・詳細のAPIは✅なので良いですね。ただ、委任履歴の
> 確認機能が設定画面にあるけど、APIは明記されていない。あと、OGP画像の仕様が
> 見当たらないんですが、Twitterで共有するときに映える画像が自動生成されると
> 嬉しいです。投票結果をワンタップでツイートできる機能も欲しい」

#### 懸念点と改善要望

| # | 重要度 | 画面/機能 | 懸念 | 改善提案 |
|---|:------:|----------|------|---------|
| W-1 | 中 | 委任履歴 | 確認機能はあるがAPIが不明 | `/token-hub/delegation-history` API追加 |
| W-2 | 中 | OGP画像 | 共有用OGP画像仕様が未定義 | 提案・投票結果のOGP動的生成仕様追加 |
| W-3 | 中 | SNS共有 | ワンタップ共有機能の詳細なし | 投票結果のTwitter/X共有ボタン仕様追加 |
| W-4 | 低 | Delegateプロフィール | 編集機能の詳細が不明 | プロフィール編集画面の仕様追加 |
| W-5 | 低 | 多言語 | 日本語優先の設計 | 英語優先オプション（国際的なDelegate向け） |

#### 総合評価
- 情報整理: ⭐⭐⭐⭐☆（提案一覧は良い）
- 共有性: ⭐⭐⭐☆☆（OGP・共有機能が未定義）
- Delegate機能: ⭐⭐⭐⭐☆（基本は揃っている）

---

### 10.6 小林さん（Observer / 35歳）

**担当システム**: Observer
**技術レベル**: ★★★★☆
**主な利用デバイス**: PC（監視ダッシュボード）

#### レビューコメント

> 「セキュリティエンジニアとして、このシステムは面白いですね。Bug Bounty的な
> インセンティブ設計は好みです。ただ、気になる点がいくつか。まず、VRFで選ばれる
> 確率がどこにも表示されていない。ステーク量に応じた期待値を知りたいです。
> あと、自動検証をスクリプトで回したいんですが、APIが❌になってる箇所が多い。
> 24時間ずっと画面見てられないので、Webhook通知は必須ですね」

#### 懸念点と改善要望

| # | 重要度 | 画面/機能 | 懸念 | 改善提案 |
|---|:------:|----------|------|---------|
| O-1 | 高 | Observer登録 | `/observer/register` APIが❌未実装 | 基本的な登録フローのAPI実装 |
| O-2 | 高 | 検証機能 | `/observer/verify` APIが❌未実装 | 自動検証スクリプト連携のためAPI必須 |
| O-3 | 高 | 報酬Claim | `/observer/claim` APIが❌未実装 | 報酬引出し機能のAPI実装 |
| O-4 | 中 | VRF確率 | 選出確率・期待値が表示されない | ダッシュボードにVRF確率計算機追加 |
| O-5 | 中 | 不審tx一覧 | フィルタリング機能の詳細が不明 | 金額・時間・アドレスでのフィルタ仕様追加 |
| O-6 | 中 | 設定画面 | 自動Challenge提出のBond上限設定 | Bond自動支払い上限の仕様明確化 |

#### 総合評価
- 監視効率: ⭐⭐⭐☆☆（API未実装が多く自動化困難）
- Challenge体験: ⭐⭐⭐⭐☆（フローは明確）
- 報酬・収益: ⭐⭐☆☆☆（Claim APIが無い、期待値計算不可）

---

### 10.7 高橋さん（QS Foundation Admin / 40歳）

**担当システム**: QS Admin
**技術レベル**: ★★★★★
**主な利用デバイス**: PC（管理ダッシュボード）

#### レビューコメント

> 「財団のオペレーションを任されている身としては、このダッシュボードの情報密度が
> もう少し高いと嬉しいですね。Prover申請が10件溜まってるとき、一括承認できないと
> 厳しいです。あと、深夜にインシデントが起きたときモバイルで対応できるUIが
> あるといいんですが、現状PCでしか使えない想定ですよね？Emergency Pauseを
> スマホから実行できないのは運用上キツいです」

#### 懸念点と改善要望

| # | 重要度 | 画面/機能 | 懸念 | 改善提案 |
|---|:------:|----------|------|---------|
| A-1 | 高 | パブリック版管理API | 約15本のAPIが❌未実装 | P0優先度でAPI設計・実装 |
| A-2 | 高 | Prover承認 | `/admin/provers/:id/approve` APIが❌ | 一括承認機能含めてAPI設計 |
| A-3 | 高 | Slash実行 | `/admin/challenges/:id/slash` APIが❌ | 緊急対応のため必須 |
| A-4 | 中 | モバイル対応 | Emergency Pauseのモバイル対応なし | レスポンシブ対応・PWA検討 |
| A-5 | 中 | 一括操作 | 一括承認/却下機能の記載なし | 一括操作UI・API仕様追加 |
| A-6 | 中 | SaaS管理 | Billing/Invoice APIが❌ | 課金管理の基本API設計 |

#### 総合評価
- 運用効率: ⭐⭐☆☆☆（API未実装が致命的）
- インシデント対応: ⭐⭐⭐☆☆（Emergency Pauseはあるがモバイル未対応）
- 監査・コンプライアンス: ⭐⭐⭐☆☆（監査ログはあるがエクスポート不明）

---

### 10.8 伊藤さん（Security Council / 52歳）

**担当システム**: Governance（Security Council機能）
**技術レベル**: ★★★★★
**主な利用デバイス**: PC / モバイル（緊急時）

#### レビューコメント

> 「セキュリティ評議会のメンバーとして、Emergency Pauseの署名フローは
> クリティカルです。5/9の署名を集めるのに、各メンバーの署名状況がリアルタイムで
> 見えないと困ります。深夜2時に攻撃を検知して、9人に連絡して5人の署名を
> 集めるまでに何時間かかるか...。署名リクエストの通知がSMS/Telegramで
> 来るようになっていますが、それはちゃんと実装されていますか？」

#### 懸念点と改善要望

| # | 重要度 | 画面/機能 | 懸念 | 改善提案 |
|---|:------:|----------|------|---------|
| C-1 | 高 | 署名進捗 | リアルタイム署名状況の表示仕様が不明 | 署名ダッシュボードに進捗表示（X/9）追加 |
| C-2 | 高 | 緊急通知 | SMS/Telegram通知のAPI・連携仕様なし | 緊急通知インフラの設計・仕様追加 |
| C-3 | 高 | モバイル署名 | 深夜対応でモバイルから署名できるか不明 | ハードウェアウォレット+モバイル連携仕様 |
| C-4 | 中 | Veto理由 | 公開可否、フォーマットが不明 | Veto理由の公開フロー仕様追加 |
| C-5 | 中 | 署名有効期限 | 期限の仕様が不明（24h? 48h?） | 署名有効期限の明確化（設定画面にも反映） |
| C-6 | 低 | インシデント履歴 | 過去のPause/Veto履歴参照機能 | 履歴一覧・詳細画面の仕様追加 |

#### 総合評価
- 緊急対応: ⭐⭐⭐☆☆（フローはあるが通知・モバイル対応が不明）
- Veto機能: ⭐⭐⭐⭐☆（APIは定義済み）
- 監視・アラート: ⭐⭐⭐☆☆（アラート仕様の詳細が不足）

---

### 10.9 中村さん（Purpose Committee / 48歳）

**担当システム**: Governance（Purpose Committee機能）
**技術レベル**: ★★★☆☆
**主な利用デバイス**: PC

#### レビューコメント

> 「理念委員会として、新規提案がCore Principlesに沿っているか判断するのが
> 役割なんですが、そのCore Principlesがどこに表示されているのか分からない。
> 審査中に常に参照できるようにしてほしいです。あと、却下する場合、提案者に
> 丁寧に理由を伝えたい。テンプレートがあると助かるんですが、設定画面に
> 『却下理由テンプレート』とあるのは良いですね。ただAPIは実装されていますか？」

#### 懸念点と改善要望

| # | 重要度 | 画面/機能 | 懸念 | 改善提案 |
|---|:------:|----------|------|---------|
| P-1 | 高 | Core Principles表示 | 審査画面でCore Principlesを参照できない | 審査画面にCore Principles常時表示/リンク |
| P-2 | 中 | 却下理由 | `/committee/proposals/:id/reject` の詳細仕様なし | 却下理由フィールド・通知仕様追加 |
| P-3 | 中 | 過去判断検索 | 類似提案の検索機能の詳細なし | 提案キーワード・カテゴリ検索機能仕様 |
| P-4 | 中 | 委員間コミュニケーション | 他委員との意見交換手段が不明 | 委員間コメント・ディスカッション機能仕様 |
| P-5 | 低 | 議事録 | 議事録の作成・保存場所が不明 | 議事録機能の仕様追加 |
| P-6 | 低 | 提案者対話 | 提案者との質疑応答フローが不明 | 提案者へのコメント・質問機能仕様 |

#### 総合評価
- 提案審査: ⭐⭐⭐☆☆（Core Principles参照が困難）
- コミュニケーション: ⭐⭐☆☆☆（委員間・提案者との対話機能が不足）
- 透明性: ⭐⭐⭐☆☆（履歴・議事録機能が不明確）

---

### 10.10 改善要望サマリー

> **注**: このセクションは指摘元ベースの分類。正式な優先度付けはSection 9を参照。
> （Section 9: P0:10, P1:10, P2:9, P3:4 = 33件）

#### P0: 最優先（ペルソナが機能不足と指摘）

| # | 要望ID | 内容 | 指摘者 | 対応カテゴリ |
|---|:------:|------|--------|-------------|
| 1 | Y-1 | Prover報酬Claim API実装 | 山田 | API |
| 2 | K-1 | Token Unstake API実装 | 鈴木 | API |
| 3 | S-1 | Enterprise Webhook API実装 | 佐藤 | API |
| 4 | T-1 | 専門用語の図解説明追加 | 田中 | UX |
| 5 | O-1 | Observer登録API実装 | 小林 | API |
| 6 | O-2 | Observer検証API実装 | 小林 | API |
| 7 | O-3 | Observer報酬Claim API実装 | 小林 | API |
| 8 | A-1 | QS Adminパブリック版管理API（15本） | 高橋 | API |
| 9 | A-2 | Prover承認API（一括含む） | 高橋 | API |
| 10 | C-2 | Security Council緊急通知インフラ | 伊藤 | インフラ |
| 11 | P-1 | 審査画面にCore Principles表示 | 中村 | UX |

#### P1: 重要（複数ペルソナが指摘）

| # | 要望ID | 内容 | 指摘者 | 対応カテゴリ |
|---|:------:|------|--------|-------------|
| 12 | K-2 | Token Lock期間延長API | 鈴木 | API |
| 13 | K-5 | Token Undelegate API | 鈴木 | API |
| 14 | S-2 | 監査ログのフィルタ・エクスポート仕様 | 佐藤 | 仕様 |
| 15 | S-3 | Enterprise Billing API | 佐藤 | API |
| 16 | T-2 | 24時間待機理由の説明追加 | 田中 | UX |
| 17 | Y-2 | メトリクスPDF出力機能 | 山田 | 機能 |
| 18 | A-3 | Slash実行API | 高橋 | API |
| 19 | C-1 | 署名進捗リアルタイム表示 | 伊藤 | 仕様 |
| 20 | C-3 | モバイル署名対応 | 伊藤 | 機能 |

#### P2: 中（改善推奨）

| # | 要望ID | 内容 | 指摘者 | 対応カテゴリ |
|---|:------:|------|--------|-------------|
| 21 | T-3 | 通知機能の優先度引き上げ | 田中 | API |
| 22 | K-3 | veQS減衰グラフ表示位置明確化 | 鈴木 | 仕様 |
| 23 | K-4 | Token Hub履歴API | 鈴木 | API |
| 24 | W-2 | OGP動的生成仕様 | 渡辺 | 仕様 |
| 25 | W-3 | SNS共有ボタン仕様 | 渡辺 | 仕様 |
| 26 | O-4 | VRF確率・期待値計算機 | 小林 | 機能 |
| 27 | O-5 | 不審tx フィルタリング仕様 | 小林 | 仕様 |
| 28 | A-4 | Emergency Pauseモバイル対応 | 高橋 | 機能 |
| 29 | A-5 | 一括承認/却下機能 | 高橋 | 機能 |
| 30 | C-4 | Veto理由公開フロー | 伊藤 | 仕様 |
| 31 | P-2 | 却下理由フィールド・通知 | 中村 | 仕様 |
| 32 | P-3 | 類似提案検索機能 | 中村 | 機能 |
| 33 | P-4 | 委員間ディスカッション機能 | 中村 | 機能 |

### 10.11 ペルソナレビュー完了状況

| # | ペルソナ | 役割 | 担当システム | レビュー | 指摘数 |
|---|---------|------|-------------|:-------:|:------:|
| 1 | 田中さん | Consumer | Consumer App | ✅ | 5 |
| 2 | 山田さん | Prover | Prover Portal | ✅ | 5 |
| 3 | 佐藤さん | Enterprise | Enterprise Admin | ✅ | 6 |
| 4 | 鈴木さん | Token Holder | Token Hub, Governance | ✅ | 6 |
| 5 | 渡辺さん | Delegate | Governance, Explorer | ✅ | 5 |
| 6 | 小林さん | Observer | Observer | ✅ | 6 |
| 7 | 高橋さん | QS Admin | QS Admin | ✅ | 6 |
| 8 | 伊藤さん | Security Council | Governance | ✅ | 6 |
| 9 | 中村さん | Purpose Committee | Governance | ✅ | 6 |

**全9名のペルソナによるレビュー完了。合計51件の改善要望を記録。**

> **注**: 51件の生指摘から重複・類似を統合し、Section 9の優先度付き対応リストでは33件に整理済み。
> - P0（必須）: 10件
> - P1（重要）: 10件
> - P2（改善推奨）: 9件
> - P3（後回し可）: 4件

---

## 11. サービスローンチ準備チェックリスト

> **目的**: このドキュメントをベースにサービスローンチに向けた対応状況を追跡

### 11.1 画面整合性（Section 4対応）

| # | 項目 | 状態 | アクション |
|---|------|:----:|-----------|
| 1 | URL_REFERENCE.md 更新 | ⬜ | Section 4.0の不整合一覧を反映 |
| 2 | Consumer: `/lock/success`命名統一 | ⬜ | コード or URL_REFERENCE修正 |
| 3 | Consumer: `/security`, `/key-management`パス統一 | ⬜ | コード or URL_REFERENCE修正 |
| 4 | Prover: `/register` → `/application`統一 | ⬜ | URL_REFERENCE修正 |
| 5 | Governance: Council→Dashboard遷移追加 | ⬜ | コンポーネント修正 |
| 6 | QS Admin: レガシー11画面整理 | ⬜ | 統合または削除 |

### 11.2 必須API実装（Section 8対応）

| # | API | シーケンス | 対応画面 | 状態 |
|---|-----|:---------:|---------|:----:|
| 1 | `POST /observer/register` | #9 | Observer Application | ⬜ |
| 2 | `POST /observer/verify` | #15 | Observer Challenge | ⬜ |
| 3 | `POST /observer/claim` | #16 | Observer Earnings | ⬜ |
| 4 | `POST /prover/:id/claim` | #14 | Prover Dashboard | ⬜ |
| 5 | `POST /token-hub/unstake` | #18 | Token Hub Unlock | ⬜ |
| 6 | `GET/POST /enterprise/:id/webhooks` | - | Enterprise Webhooks | ⬜ |
| 7 | `POST /admin/provers/:id/approve` | #24 | Admin Provers | ⬜ |
| 8 | `POST /admin/challenges/:id/slash` | #25 | Admin Challenges | ⬜ |
| 9 | `GET /user/notifications` | - | Consumer Notifications | ⬜ |
| 10 | `POST /token-hub/extend` | - | Token Hub Lock | ⬜ |

### 11.3 必須DB追加（Section 8.1.3対応）

| # | テーブル | 対応画面 | 状態 |
|---|---------|---------|:----:|
| 1 | `user_settings` | Consumer Settings | ⬜ |
| 2 | `prover_settings` | Prover Settings | ⬜ |
| 3 | `observer_settings` | Observer Settings | ⬜ |
| 4 | `council_member_settings` | Governance Council | ⬜ |

### 11.4 ペルソナ指摘対応（Section 9対応）

> **注**: 51件の指摘を重複排除・統合した結果、33件に整理（Section 9参照）

| 優先度 | 未対応数 | 対応済数 | 進捗 |
|:------:|:--------:|:--------:|:----:|
| P0 | 10 | 0 | 0% |
| P1 | 10 | 0 | 0% |
| P2 | 9 | 0 | 0% |
| P3 | 4 | 0 | 0% |
| **合計** | **33** | **0** | **0%** |

### 11.5 画面遷移→API→DB マッピング検証

以下のフローが一貫して動作することを確認:

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ Consumer Lock Flow                                                               │
│                                                                                  │
│ [Landing] → [Dashboard] → [Lock] → [Processing] → [Success]                     │
│     │            │           │           │            │                          │
│     └─ SIWE ─────┴──GET /user/dashboard ─┴──POST /lock─┴──GET /status/:id ──────│
│     │            │           │           │            │                          │
│     └─ users ────┴──user_dilithium_keys──┴──locks (L1)─┴──locks (L1) ───────────│
│                                                                                  │
│ 状態: ✅ 画面あり / ✅ API実装済 / ✅ DB定義済                                    │
└──────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────────┐
│ Observer Registration Flow                                                       │
│                                                                                  │
│ [Landing] → [Application] → [Stake] → [Dashboard]                               │
│     │            │            │           │                                      │
│     └─ ??? ──────┴──POST /observer/register──┴──L1 stake──┴──GET /dashboard ────│
│     │            │            │           │                                      │
│     └─ ??? ──────┴──observers─┴──observers (stake)──┴──observers ───────────────│
│                                                                                  │
│ 状態: ✅ 画面あり / ❌ API未実装 / ✅ DB定義済                                    │
└──────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────────┐
│ Token Hub Unstake Flow                                                           │
│                                                                                  │
│ [Dashboard] → [Unlock] → [Processing] → [Dashboard]                             │
│      │           │            │            │                                     │
│      └─GET──────┴──POST /token-hub/unstake──┴──GET status──┴──GET dashboard ────│
│      │           │            │            │                                     │
│      └─veQS──────┴──veQS (L1)─┴──veQS (L1)─┴──veQS ─────────────────────────────│
│                                                                                  │
│ 状態: ✅ 画面あり / ❌ API未実装 / ✅ DB(L1)定義済                                │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

### 11.6 ドキュメント自己点検結果

| # | 点検項目 | 結果 | 備考 |
|---|----------|:----:|------|
| 1 | 全登場人物がSection 1に定義されているか | ✅ | 9アクター定義済み |
| 2 | 全シーケンスに対応画面があるか | ⚠️ | #9, #10, #15, #16, #24, #25に画面実装必要 |
| 3 | 全画面に対応APIがあるか | ⚠️ | Section 8.3参照 - 59%実装率 |
| 4 | 全APIに対応DBテーブルがあるか | ⚠️ | Section 8.4参照 - 設定テーブル4本追加必要 |
| 5 | 画面遷移に矛盾がないか | ⚠️ | Section 4.10参照 - Governance/Admin要修正 |
| 6 | ペルソナ全員からレビュー取得済みか | ✅ | 9名完了、51件指摘 |
| 7 | URL_REFERENCEとコードベースが一致するか | ⚠️ | Section 4.0参照 - 12件不整合 |

**総合評価**: ローンチ前に上記⚠️項目の対応が必要

---

**END OF DOCUMENT**

**Document Version**: 2.0
**Last Updated**: 2026-01-21
**Next Review**: API実装完了後
