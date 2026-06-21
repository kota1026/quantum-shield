# 🎨 Step D 追補: Prover System & Enterprise Admin UI要件

> **日時**: 2026年1月5日  
> **議長**: CDO (Engineer) / CBO  
> **議題**: Prover署名システム詳細 / Enterprise向け管理画面  
> **ステータス**: ✅ 完了

---

## 会議の目的

Step D本編で不足していた以下の要件を定義する：
1. **Prover署名システム** - ProverがUnlock要求をProveする詳細フロー
2. **Service Provider Admin Portal** - QS運営側の管理画面
3. **Customer Admin Portal** - Enterprise顧客向け管理画面
4. **Contract & Billing System** - 契約・課金システム
5. **Service Control** - 提供停止フロー

---

## 10. Prover署名システム詳細設計

### 10.1 アーキテクチャ概要

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  Prover Signing System Architecture                                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  【L3 Aegis】              【Prover Backend】           【HSM】                  │
│  ┌─────────────┐           ┌─────────────────┐         ┌─────────────┐         │
│  │             │           │                 │         │             │         │
│  │ 1. VRFで    │──(署名要求)→ 2. Signing     │──(署名)→│ 3. HSM内    │         │
│  │    Prover   │           │    Service     │         │    2-of-3   │         │
│  │    選出     │           │    (API)       │←(署名)──│    マルチシグ│         │
│  │    (2/5)    │←(署名応答)─│                │         │             │         │
│  │             │           │                 │         │             │         │
│  └─────────────┘           └─────────────────┘         └─────────────┘         │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 10.2 詳細シーケンス（Prover視点）

```
L3 Aegis                     Prover Backend              HSM (2-of-3)           Key Holders
    │                              │                          │                      │
    │──(1) 署名要求───────────────►│                          │                      │
    │   {unlock_id,                │                          │                      │
    │    unlock_data,              │                          │                      │
    │    SR_0, SR_1,               │                          │                      │
    │    user_dilithium_sig}       │                          │                      │
    │                              │                          │                      │
    │                        ┌─────┴─────┐                    │                      │
    │                        │ 検証      │                    │                      │
    │                        │           │                    │                      │
    │                        │ 1. SR_0照合│                    │                      │
    │                        │    (L3から)│                    │                      │
    │                        │           │                    │                      │
    │                        │ 2. SR_1   │                    │                      │
    │                        │    遷移検証│                    │                      │
    │                        │           │                    │                      │
    │                        │ 3. Dilithium                   │                      │
    │                        │    署名検証│                    │                      │
    │                        │           │                    │                      │
    │                        │ 4. amount │                    │                      │
    │                        │    ≤ Lock額│                    │                      │
    │                        └─────┬─────┘                    │                      │
    │                              │                          │                      │
    │                              │                          │                      │
    │                              │   [自動承認の場合]        │                      │
    │                              │──(2) 署名要求───────────►│                      │
    │                              │   {hash(unlock_data)}    │                      │
    │                              │                          │                      │
    │                              │                    ┌─────┴─────┐                │
    │                              │                    │ HSM内処理 │                │
    │                              │                    │           │                │
    │                              │                    │ SPHINCS+  │                │
    │                              │                    │ 秘密鍵で  │                │
    │                              │                    │ 署名生成  │                │
    │                              │                    │ (~8KB)    │                │
    │                              │                    └─────┬─────┘                │
    │                              │                          │                      │
    │                              │◄──(3) SPHINCS+ Sig───────│                      │
    │                              │                          │                      │
    │                              │                          │                      │
    │                              │   [手動承認の場合]        │                      │
    │                              │─────────────────────────────────(通知)─────────►│
    │                              │                          │                      │
    │                              │                          │              ┌───────┴───────┐
    │                              │                          │              │ 2人以上が     │
    │                              │                          │              │ 承認ボタン    │
    │                              │                          │              │ クリック      │
    │                              │                          │              └───────┬───────┘
    │                              │                          │                      │
    │                              │◄─────────────────────────────────(2/3承認)──────│
    │                              │                          │                      │
    │                              │──(2') 署名要求──────────►│                      │
    │                              │                          │                      │
    │                              │◄──(3') SPHINCS+ Sig──────│                      │
    │                              │                          │                      │
    │◄──(4) SPHINCS+ Signature─────│                          │                      │
    │   {prover_id,                │                          │                      │
    │    sphincs_sig}              │                          │                      │
    │                              │                          │                      │
```

### 10.3 Prover Backend構成要素

| コンポーネント | 役割 | 技術スタック |
|--------------|------|-------------|
| **Signing Service API** | L3からの署名要求を受信 | gRPC / REST API |
| **Validation Engine** | SR遷移、Dilithium署名、金額の検証 | Rust / Go |
| **HSM Connector** | HSMとのmTLS通信 | PKCS#11 |
| **Approval Workflow** | 2-of-3マルチシグ承認フロー | Internal Queue |
| **Monitoring** | 応答時間、SLA監視 | Prometheus / Grafana |
| **Notification Service** | Key Holderへの承認通知 | Push / SMS / Email |

### 10.4 検証ロジック詳細

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  Prover Validation Logic                                                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  function validateUnlockRequest(request):                                        │
│                                                                                 │
│    // Step 1: SR_0照合                                                          │
│    stored_SR_0 = L3.getStateRoot(request.lock_id)                               │
│    if request.SR_0 != stored_SR_0:                                              │
│      return REJECT("SR_0 mismatch")                                             │
│                                                                                 │
│    // Step 2: SR_1遷移検証                                                       │
│    expected_SR_1 = SHA3-256(                                                    │
│      "QS_UNLOCK_V1" ||                                                          │
│      request.SR_0 ||                                                            │
│      request.lock_id ||                                                         │
│      request.dest_addr ||                                                       │
│      request.amount ||                                                          │
│      request.nonce                                                              │
│    )                                                                            │
│    if request.SR_1 != expected_SR_1:                                            │
│      return REJECT("SR_1 transition invalid")                                   │
│                                                                                 │
│    // Step 3: Dilithium署名検証                                                  │
│    user_pubkey = L3.getDilithiumPubkey(request.lock_id)                         │
│    if !dilithium_verify(user_pubkey, request.unlock_data, request.sig):         │
│      return REJECT("Dilithium signature invalid")                               │
│                                                                                 │
│    // Step 4: 金額検証                                                           │
│    locked_amount = L3.getLockedAmount(request.lock_id)                          │
│    if request.amount > locked_amount:                                           │
│      return REJECT("Amount exceeds locked")                                     │
│                                                                                 │
│    // Step 5: Expiry検証                                                         │
│    if request.expiry < now():                                                   │
│      return REJECT("Request expired")                                           │
│                                                                                 │
│    // Step 6: Nonce検証（リプレイ防止）                                          │
│    if isNonceUsed(request.lock_id, request.nonce):                              │
│      return REJECT("Nonce already used")                                        │
│                                                                                 │
│    return APPROVE                                                               │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 10.5 Prover操作UI（署名承認画面）

| 画面 | 要素 | 機能 |
|------|------|------|
| **Pending Signatures** | Request Queue | 署名待ち要求一覧 |
| | Request ID | 要求ID |
| | Lock ID | 対象Lock |
| | Amount | 金額 |
| | Validation Status | 検証結果（✅ All Passed） |
| | Timestamp | 受信時刻 |
| | Approve Button | 承認ボタン |
| | Reject Button | 拒否ボタン（理由必須） |
| **Request Detail** | Unlock Data | Unlock詳細情報 |
| | SR_0 / SR_1 | State Root表示 |
| | User Dilithium Pubkey | ユーザー公開鍵 |
| | Validation Log | 各検証ステップの結果 |
| | Approval Status | 現在の承認状況（0/3, 1/3, 2/3） |
| | Other Approvers | 他の承認者の状況 |
| **Signature History** | Completed List | 完了した署名一覧 |
| | Response Time | 応答時間記録 |
| | Outcome | 承認/拒否 |
| | Approvers | 承認者一覧 |

### 10.6 運用モード

| モード | 説明 | トリガー | 用途 |
|-------|------|---------|------|
| **Auto-Sign** | 検証パス時に自動署名 | デフォルト | 通常運用（高速、~30秒） |
| **Manual-Approve** | 2-of-3の手動承認必須 | 高額（>$100K）、異常検知 | リスク管理 |
| **Pause** | 全署名停止 | 管理者操作、緊急時 | メンテナンス、インシデント対応 |

### 10.7 SLA要件

| 指標 | 目標 | 計測方法 |
|------|------|---------|
| 署名応答時間 | < 5分（Auto-Sign） | L3要求〜署名返却 |
| 手動承認時間 | < 30分 | 要求〜2/3承認完了 |
| 稼働率 | 99.9% | 月間ダウンタイム < 43分 |
| 署名成功率 | > 99.5% | 有効な要求に対する成功率 |

---

## 11. Service Provider Admin Portal（QS運営側）

### 11.1 全体構成

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  Service Provider Admin Portal - Structure                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  Dashboard                                                               │   │
│  │  ├── Total Customers: 42                                                 │   │
│  │  ├── Total TVL: $2.4B                                                    │   │
│  │  ├── MRR: $850K                                                          │   │
│  │  ├── Active Alerts: 3                                                    │   │
│  │  └── SLA Status: ✅ All Green                                            │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐              │
│  │ Customers   │ │ Contracts   │ │ Billing     │ │ SLA Monitor │              │
│  ├─────────────┤ ├─────────────┤ ├─────────────┤ ├─────────────┤              │
│  │ • List      │ │ • Active    │ │ • Invoices  │ │ • Dashboard │              │
│  │ • Detail    │ │ • Pending   │ │ • Payments  │ │ • Alerts    │              │
│  │ • Create    │ │ • Templates │ │ • Revenue   │ │ • Reports   │              │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘              │
│                                                                                 │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                              │
│  │ Service     │ │ Support     │ │ Settings    │                              │
│  │ Control     │ │             │ │             │                              │
│  ├─────────────┤ ├─────────────┤ ├─────────────┤                              │
│  │ • Suspend   │ │ • Tickets   │ │ • Users     │                              │
│  │ • Terminate │ │ • Knowledge │ │ • Roles     │                              │
│  │ • Restore   │ │ • Escalation│ │ • Audit Log │                              │
│  └─────────────┘ └─────────────┘ └─────────────┘                              │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 11.2 顧客管理

#### Customer List

| 要素 | 説明 |
|------|------|
| Customer Table | 顧客企業一覧（ソート/フィルタ可） |
| Search | 企業名、担当者名、ドメインで検索 |
| Filters | Status (Active/Suspended/Terminated), Plan, Region |
| Columns | Company Name, Status, Plan, TVL, MRR, Contract End, Actions |
| Quick Actions | View Detail, Suspend, Contact |

#### Customer Detail

| セクション | 内容 |
|-----------|------|
| **Company Info** | 企業名、住所、業種、従業員数、設立年 |
| **Contact Persons** | 主担当、技術担当、請求担当（名前、Email、電話） |
| **Contract Summary** | プラン、契約開始日、契約終了日、自動更新設定 |
| **Usage Metrics** | TVL、月間取引量、API呼び出し数、ユーザー数 |
| **Revenue History** | 月別請求額グラフ |
| **Support History** | サポートチケット一覧 |
| **Audit Log** | 設定変更、アクセスログ |

#### Customer Creation

| ステップ | 入力項目 |
|---------|---------|
| 1. Basic Info | Company Name, Domain, Industry, Region |
| 2. Contacts | Primary Contact (Name, Email, Phone), Billing Contact |
| 3. Plan Selection | Starter / Growth / Enterprise / Custom |
| 4. Contract Terms | Start Date, Duration, Auto-Renewal, Custom Clauses |
| 5. Technical Setup | API Key Generation, Webhook URL, IP Whitelist |
| 6. Review & Create | 確認画面、契約書生成 |

### 11.3 契約管理

#### Contract List

| カラム | 説明 |
|-------|------|
| Contract ID | 契約ID |
| Customer | 顧客企業名 |
| Plan | プラン名 |
| Start Date | 開始日 |
| End Date | 終了日 |
| Status | Active / Pending / Expired / Terminated |
| Value | 契約金額（年間） |
| Actions | View, Amend, Renew, Terminate |

#### Contract Detail

| セクション | 内容 |
|-----------|------|
| **Terms** | 契約条件詳細 |
| **Pricing** | 基本料金、従量料金、割引 |
| **SLA** | SLA条件、ペナルティ条項 |
| **Documents** | 契約書PDF、NDA、DPA |
| **Amendment History** | 契約変更履歴 |
| **Renewal Settings** | 自動更新設定、更新通知設定 |

#### Contract Templates

| テンプレート | 用途 |
|-------------|------|
| Standard SaaS | 中小企業向け標準契約 |
| Enterprise | 大企業向けカスタム契約 |
| White Label | パートナー向け再販契約 |
| POC | 検証用短期契約 |

### 11.4 課金・請求

#### Billing Dashboard

| メトリクス | 説明 |
|-----------|------|
| MRR (Monthly Recurring Revenue) | 月間経常収益 |
| ARR (Annual Recurring Revenue) | 年間経常収益 |
| Churn Rate | 解約率 |
| ARPU | 顧客平均単価 |
| Outstanding Invoices | 未払い請求額 |
| Revenue by Plan | プラン別収益 |

#### Invoice Management

| 機能 | 説明 |
|------|------|
| Invoice List | 請求書一覧（フィルタ: Status, Customer, Date Range） |
| Invoice Detail | 請求書詳細（明細、支払い状況） |
| Generate Invoice | 請求書生成（自動/手動） |
| Send Invoice | 請求書送信（Email/郵送） |
| Record Payment | 支払い記録 |
| Credit Note | クレジットノート発行 |

#### Revenue Report

| レポート | 内容 |
|---------|------|
| Revenue by Month | 月別収益推移 |
| Revenue by Customer | 顧客別収益 |
| Revenue by Region | 地域別収益 |
| Fee Breakdown | 手数料内訳（基本料/従量） |

### 11.5 SLA監視

#### SLA Dashboard

| メトリクス | 目標 | 現在値 | ステータス |
|-----------|------|--------|----------|
| Uptime | 99.9% | 99.95% | ✅ |
| API Response Time | < 200ms | 145ms | ✅ |
| Prover Response Time | < 5min | 2.3min | ✅ |
| Error Rate | < 0.1% | 0.02% | ✅ |

#### Per-Customer SLA

| カラム | 説明 |
|-------|------|
| Customer | 顧客名 |
| SLA Tier | SLAレベル（Standard/Premium） |
| Current Uptime | 現在の稼働率 |
| Incidents (MTD) | 月間インシデント数 |
| Credits Owed | 発生クレジット額 |
| Status | Green/Yellow/Red |

#### SLA Breach Management

| 機能 | 説明 |
|------|------|
| Breach Alert | 違反アラート一覧 |
| Auto-Credit Calculation | 自動クレジット計算 |
| Root Cause Analysis | 原因分析記録 |
| Resolution Actions | 対応アクション記録 |
| Customer Communication | 顧客通知テンプレート |

### 11.6 サービス制御（Suspend/Terminate）

#### Service Control Dashboard

| 要素 | 説明 |
|------|------|
| Active Services | アクティブサービス数 |
| Suspended Services | 一時停止中サービス数 |
| Pending Terminations | 終了予定サービス |
| Recent Actions | 最近の制御アクション |

#### Suspend Service

| ステップ | 内容 |
|---------|------|
| 1. Customer Selection | 対象顧客選択 |
| 2. Reason | 理由選択（Payment Overdue / Policy Violation / Customer Request / Other） |
| 3. Scope | 停止範囲（Full / Partial - New Locks Only） |
| 4. Grace Period | 猶予期間設定（0-30日） |
| 5. Notification | 通知設定（Email/In-App/Both） |
| 6. Confirmation | 確認・実行 |

#### Terminate Service

| ステップ | 内容 |
|---------|------|
| 1. Customer Selection | 対象顧客選択 |
| 2. Reason | 終了理由 |
| 3. Effective Date | 発効日（最低30日後） |
| 4. Data Handling | データ処理（Export/Retain/Delete） |
| 5. Final Settlement | 最終精算確認 |
| 6. Notification | 通知設定 |
| 7. Legal Review | 法務確認（必要な場合） |
| 8. Confirmation | 確認・実行 |

#### Restore Service

| 要件 | 説明 |
|------|------|
| Eligibility | 停止から90日以内 |
| Payment Clear | 未払いがないこと |
| Compliance | ポリシー違反が解消されていること |
| Approval | 管理者承認必要 |

### 11.7 サポート管理

#### Ticket Management

| 要素 | 説明 |
|------|------|
| Ticket List | チケット一覧（フィルタ: Status, Priority, Customer） |
| Ticket Detail | チケット詳細・対応履歴 |
| Assignment | 担当者割当 |
| SLA Timer | 対応期限タイマー |
| Escalation | エスカレーション管理 |

#### Priority Levels

| 優先度 | 説明 | 初回応答 | 解決目標 |
|-------|------|---------|---------|
| P1 - Critical | サービス停止 | 15分 | 4時間 |
| P2 - High | 重大な機能障害 | 1時間 | 24時間 |
| P3 - Medium | 軽微な問題 | 4時間 | 72時間 |
| P4 - Low | 質問・要望 | 24時間 | 1週間 |

---

## 12. Customer Admin Portal（Enterprise顧客向け）

### 12.1 全体構成

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  Customer Admin Portal - Structure                                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  Dashboard                                                               │   │
│  │  ├── TVL: $45.2M                                                         │   │
│  │  ├── Active Locks: 1,234                                                 │   │
│  │  ├── Pending Unlocks: 56                                                 │   │
│  │  ├── 24h Volume: $2.3M                                                   │   │
│  │  └── Service Status: ✅ Operational                                      │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐              │
│  │ Organization│ │ Transactions│ │ Settings    │ │ Reports     │              │
│  ├─────────────┤ ├─────────────┤ ├─────────────┤ ├─────────────┤              │
│  │ • Users     │ │ • Dashboard │ │ • Limits    │ │ • Usage     │              │
│  │ • Roles     │ │ • List      │ │ • Notify    │ │ • Compliance│              │
│  │ • API Keys  │ │ • Export    │ │ • Security  │ │ • Billing   │              │
│  │ • SSO       │ │             │ │ • Webhooks  │ │             │              │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘              │
│                                                                                 │
│  ┌─────────────┐ ┌─────────────┐                                              │
│  │ Support     │ │ Contract    │                                              │
│  ├─────────────┤ ├─────────────┤                                              │
│  │ • Tickets   │ │ • Details   │                                              │
│  │ • Docs      │ │ • Invoices  │                                              │
│  │ • Status    │ │ • Renewal   │                                              │
│  └─────────────┘ └─────────────┘                                              │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 12.2 組織管理

#### User Management

| 機能 | 説明 |
|------|------|
| User List | ユーザー一覧（名前、Email、Role、Status、Last Login） |
| Invite User | 新規ユーザー招待（Email送信） |
| Edit User | ユーザー編集（Role変更、権限調整） |
| Deactivate User | ユーザー無効化 |
| Bulk Import | CSV一括インポート |

#### Roles & Permissions

| ロール | 権限 |
|-------|------|
| **Admin** | 全機能アクセス、ユーザー管理、設定変更 |
| **Operator** | トランザクション管理、レポート閲覧 |
| **Viewer** | 閲覧のみ |
| **API User** | API経由のみ（UI制限） |
| **Custom** | カスタム権限設定 |

#### API Key Management

| 機能 | 説明 |
|------|------|
| Key List | APIキー一覧（Name、Created、Last Used、Status） |
| Generate Key | 新規キー生成（権限設定、有効期限） |
| Rotate Key | キーローテーション |
| Revoke Key | キー無効化 |
| Usage Stats | キー別利用統計 |

#### SSO Settings

| 設定項目 | 内容 |
|---------|------|
| Provider | SAML 2.0 / OIDC |
| IdP URL | Identity Provider URL |
| Certificate | 証明書アップロード |
| Attribute Mapping | 属性マッピング |
| Test Connection | 接続テスト |
| Enable/Disable | SSO有効/無効 |

### 12.3 トランザクション管理

#### Transaction Dashboard

| メトリクス | 表示 |
|-----------|------|
| Total TVL | 総ロック額（推移グラフ） |
| Active Locks | アクティブLock数 |
| Pending Unlocks | 進行中Unlock数 |
| Volume (24h/7d/30d) | 取引量 |
| Avg Lock Duration | 平均ロック期間 |
| Success Rate | 成功率 |

#### Transaction List

| カラム | 説明 |
|-------|------|
| TX ID | トランザクションID |
| Type | Lock / Unlock |
| Amount | 金額 |
| Asset | 資産種類 |
| Status | Pending / Completed / Failed |
| Created | 作成日時 |
| Actions | View Detail |

#### Filters

| フィルタ | オプション |
|---------|----------|
| Date Range | 日付範囲 |
| Type | Lock / Unlock / All |
| Status | Pending / Completed / Failed / All |
| Amount Range | 金額範囲 |
| Asset | 資産種類 |

#### Export

| 形式 | 内容 |
|------|------|
| CSV | 基本データ |
| JSON | 全データ（API互換） |
| PDF | 監査用フォーマット |

### 12.4 設定

#### Limits

| 設定 | 説明 | デフォルト |
|------|------|----------|
| Per-Transaction Limit | 1取引上限 | $1M |
| Daily Limit | 日次上限 | $10M |
| Monthly Limit | 月次上限 | $100M |
| Whitelist Only | ホワイトリストのみ許可 | OFF |

#### Notifications

| 設定 | オプション |
|------|----------|
| Email Alerts | ON/OFF、受信者設定 |
| Webhook | URL設定、イベント選択 |
| Slack Integration | Webhook URL |
| Alert Threshold | 通知閾値（金額、頻度） |

#### Security

| 設定 | 説明 |
|------|------|
| IP Whitelist | 許可IPリスト |
| 2FA Enforcement | 全ユーザー2FA必須 |
| Session Timeout | セッションタイムアウト |
| Password Policy | パスワードポリシー |

### 12.5 レポート

#### Usage Report

| レポート | 内容 |
|---------|------|
| Transaction Volume | 取引量推移（日/週/月） |
| TVL History | TVL推移 |
| Fee Summary | 手数料サマリー |
| API Usage | API呼び出し統計 |
| User Activity | ユーザー活動サマリー |

#### Compliance Report

| レポート | 内容 |
|---------|------|
| Audit Trail | 全操作ログ（フィルタ可） |
| User Activity | ユーザー別活動ログ |
| Access Log | アクセスログ |
| Export for Audit | 監査用エクスポート（署名付きPDF） |

#### Billing Report

| レポート | 内容 |
|---------|------|
| Invoice History | 請求書履歴 |
| Payment History | 支払い履歴 |
| Fee Breakdown | 手数料内訳 |
| Projected Cost | 予測コスト |

---

## 13. Contract & Billing System

### 13.1 契約フロー

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  Contract Lifecycle                                                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  [1. Lead]     [2. Proposal]   [3. Negotiation]  [4. Contract]   [5. Active]   │
│  ┌─────────┐   ┌───────────┐   ┌─────────────┐   ┌───────────┐   ┌─────────┐  │
│  │ Contact │──►│ Proposal  │──►│ Negotiation │──►│ Signing   │──►│ Live    │  │
│  │ Form    │   │ Generation│   │ & Revision  │   │ (DocuSign)│   │ Service │  │
│  └─────────┘   └───────────┘   └─────────────┘   └───────────┘   └─────────┘  │
│       │              │               │                 │              │         │
│       ▼              ▼               ▼                 ▼              ▼         │
│    CRM記録      見積書作成      条件交渉         電子署名      サービス開始    │
│                                                                                 │
│  [6. Renewal]                                                                   │
│  ┌───────────────────────────────────────────────────────────────────────────┐ │
│  │  契約満了90日前                                                            │ │
│  │  ├── 自動更新: 自動継続                                                    │ │
│  │  └── 手動更新: 更新提案 → 交渉 → 署名                                     │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 13.2 料金体系

#### プラン構成

| プラン | 月額基本料 | 取引手数料 | 機能 | 対象 |
|-------|-----------|-----------|------|------|
| **Starter** | $5,000 | 0.10% | 基本機能、5ユーザー、Email Support | スタートアップ |
| **Growth** | $15,000 | 0.075% | 全機能、20ユーザー、優先Support、SLA 99.5% | 中堅企業 |
| **Enterprise** | カスタム | 0.05%〜 | 無制限ユーザー、専任AM、SLA 99.9%、カスタム開発 | 大企業 |
| **White Label** | カスタム | Revenue Share | 再販権、ブランドカスタマイズ | パートナー |

#### 従量課金詳細

| 項目 | 計算方法 |
|------|---------|
| 取引手数料 | Unlock金額 × 手数料率 |
| API呼び出し | 100万回/月超過分: $0.001/回 |
| ストレージ | 1TB/月超過分: $100/TB |
| カスタム開発 | 工数ベース（$200/時間） |

### 13.3 請求フロー

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  Billing Flow                                                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  月初                    月中                      月末                         │
│  ┌─────────────┐        ┌─────────────┐          ┌─────────────┐              │
│  │ 前月分      │        │ 利用状況    │          │ 請求書      │              │
│  │ 請求書発行  │        │ 監視・記録  │          │ 確定・送付  │              │
│  └─────────────┘        └─────────────┘          └─────────────┘              │
│        │                       │                        │                      │
│        ▼                       ▼                        ▼                      │
│    Net 30支払い           ダッシュボード表示        翌月5日発行               │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 13.4 支払い方法

| 方法 | 対応 | 備考 |
|------|:---:|------|
| 銀行振込 | ✅ | Net 30 |
| クレジットカード | ✅ | Stripe経由 |
| 暗号資産（ETH/USDC） | ✅ | Enterpriseのみ |
| 請求書払い（後払い） | ✅ | 与信審査後 |

---

## 14. Service Control（提供停止詳細）

### 14.1 停止種類と影響

| 種類 | トリガー | 新規Lock | 既存Unlock | データ | 復旧 |
|------|---------|:--------:|:----------:|:------:|------|
| **Suspend (Soft)** | 支払い延滞（軽度） | ❌ 停止 | ✅ 継続 | ✅ 保持 | 支払い後即時 |
| **Suspend (Hard)** | 支払い延滞（重度）、軽微な違反 | ❌ 停止 | ⚠️ 新規停止 | ✅ 保持 | 問題解決後 |
| **Terminate** | 重大な違反、契約終了 | ❌ 停止 | ⚠️ 完了まで | 90日後削除 | 新規契約必要 |

### 14.2 停止プロセスUI

#### Suspension Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  Suspension Process                                                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Step 1: 警告通知                                                                │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  📧 支払い延滞警告メール送信                                              │   │
│  │  ├── 送信先: 主担当、請求担当                                             │   │
│  │  ├── 内容: 延滞金額、支払い期限、停止予告                                 │   │
│  │  └── アクション: 支払いリンク、サポート連絡先                              │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                           │                                                     │
│                           ▼ (7日後、未払い継続)                                  │
│                                                                                 │
│  Step 2: 猶予期間開始                                                            │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  ⚠️ 猶予期間開始（14日間）                                               │   │
│  │  ├── 新規Lock: 停止                                                       │   │
│  │  ├── 既存Unlock: 継続                                                     │   │
│  │  ├── Admin Portal: 警告バナー表示                                         │   │
│  │  └── データエクスポート: 有効                                             │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                           │                                                     │
│                           ▼ (14日後、未払い継続)                                 │
│                                                                                 │
│  Step 3: 完全停止                                                                │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  🚫 サービス完全停止                                                       │   │
│  │  ├── 全機能: 停止                                                         │   │
│  │  ├── APIキー: 無効化                                                      │   │
│  │  ├── Admin Portal: ロックアウト（支払いページのみ表示）                    │   │
│  │  └── 進行中Unlock: 完了まで継続                                           │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### Termination Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  Termination Process                                                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Day -30: 終了予告                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  📧 契約終了予告メール送信                                                 │   │
│  │  ├── 終了理由                                                             │   │
│  │  ├── 終了日                                                               │   │
│  │  ├── データエクスポート手順                                               │   │
│  │  └── 最終精算予定                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                           │                                                     │
│                           ▼                                                     │
│                                                                                 │
│  Day -30 〜 Day 0: 移行期間                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  📦 データ移行サポート                                                     │   │
│  │  ├── 新規Lock: 停止                                                       │   │
│  │  ├── 既存Unlock: 完了まで継続                                             │   │
│  │  ├── データエクスポート: 全データダウンロード可能                          │   │
│  │  └── 技術サポート: 移行支援                                               │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                           │                                                     │
│                           ▼                                                     │
│                                                                                 │
│  Day 0: 契約終了                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  🔒 サービス終了                                                           │   │
│  │  ├── 全機能: 停止                                                         │   │
│  │  ├── APIキー: 完全削除                                                    │   │
│  │  ├── Admin Portal: アクセス不可                                           │   │
│  │  └── 最終精算: 実行                                                       │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                           │                                                     │
│                           ▼                                                     │
│                                                                                 │
│  Day 0 〜 Day +90: データ保持期間                                                │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  💾 データ保持（読み取り専用）                                             │   │
│  │  ├── リクエストによるデータ提供                                           │   │
│  │  └── 法的保持義務のあるデータのみ保持                                     │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                           │                                                     │
│                           ▼                                                     │
│                                                                                 │
│  Day +90: データ削除                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  🗑️ 完全削除                                                               │   │
│  │  ├── 全データ: 削除                                                       │   │
│  │  └── 法的保持データ: 別途保管（7年）                                       │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 14.3 データエクスポート

| エクスポート対象 | 形式 | 説明 |
|----------------|------|------|
| Transaction History | CSV/JSON | 全取引履歴 |
| Lock/Unlock Details | JSON | 詳細データ |
| Audit Trail | PDF | 監査証跡 |
| User Data | CSV | ユーザー情報 |
| Configuration | JSON | 設定データ |

### 14.4 復旧（Reactivation）

| 要件 | 説明 |
|------|------|
| 対象 | Suspend状態のみ（Terminate後は不可） |
| 条件 | 停止理由の解消（支払い完了、違反是正） |
| 承認 | 管理者承認必要 |
| 復旧時間 | 承認後24時間以内 |
| データ | 全データ保持（停止期間中も） |

---

## 合意事項

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  Step D 追補: 合意事項                                                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  【10. Prover署名システム】                                                      │
│  ✅ 詳細シーケンス定義（L3→Backend→HSM→Key Holders）                           │
│  ✅ 検証ロジック詳細（6ステップ検証）                                           │
│  ✅ 運用モード（Auto-Sign / Manual-Approve / Pause）                            │
│  ✅ Prover操作UI（署名承認画面）                                                │
│  ✅ SLA要件（署名<5分、稼働率99.9%）                                            │
│                                                                                 │
│  【11. Service Provider Admin Portal】                                          │
│  ✅ 顧客管理（List/Detail/Create）                                              │
│  ✅ 契約管理（List/Detail/Templates）                                           │
│  ✅ 課金・請求（Dashboard/Invoice/Revenue）                                     │
│  ✅ SLA監視（Dashboard/Per-Customer/Breach）                                    │
│  ✅ サービス制御（Suspend/Terminate/Restore）                                   │
│  ✅ サポート管理（Ticket/Priority）                                             │
│                                                                                 │
│  【12. Customer Admin Portal】                                                   │
│  ✅ 組織管理（User/Role/API Key/SSO）                                           │
│  ✅ トランザクション管理（Dashboard/List/Export）                               │
│  ✅ 設定（Limits/Notifications/Security）                                       │
│  ✅ レポート（Usage/Compliance/Billing）                                        │
│                                                                                 │
│  【13. Contract & Billing System】                                               │
│  ✅ 契約ライフサイクル（Lead→Contract→Active→Renewal）                         │
│  ✅ 料金体系（Starter/Growth/Enterprise/White Label）                           │
│  ✅ 請求フロー（月次、Net 30）                                                  │
│  ✅ 支払い方法（銀行振込/CC/暗号資産）                                          │
│                                                                                 │
│  【14. Service Control】                                                         │
│  ✅ 停止種類（Suspend Soft/Hard、Terminate）                                    │
│  ✅ 停止プロセス（警告→猶予→停止）                                             │
│  ✅ 終了プロセス（30日前通知→移行→終了→データ保持→削除）                       │
│  ✅ データエクスポート要件                                                      │
│  ✅ 復旧要件                                                                    │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**投票結果**: 全エージェント賛成 ✅

---

## 出席エージェント

| エージェント | 役割 | 主な発言 |
|-------------|------|---------|
| CDO (Engineer) | 議長 | Prover署名システム、技術設計 |
| CBO | ビジネス | Enterprise管理画面、料金体系 |
| CFO | 経済 | 課金・請求システム |
| Legal | 法務 | 契約管理、データ保持 |
| CSO | セキュリティ | アクセス制御、停止プロセス |
| CTO | 技術 | API設計、SSO連携 |
| CEO (Kota) | 承認 | - |

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-05 | 初版作成 |

---

**END OF DOCUMENT**
