# Enterprise Admin - 全画面データトレーサビリティ検証結果

**検証日時:** 2026-02-07
**検証対象:** Enterprise Admin全18画面
**検証方法:** Playwright MCP snapshot + コンソールエラー確認 + ソースコード分析

---

## サマリー

| 指標 | 値 |
|:---|:---|
| 総画面数 | 18 |
| ✅ 正常 | 2 (help, terms/privacy) |
| ⚠️ 警告 | 14 (FALLBACK / ハードコード / i18nエラー) |
| ❌ エラー | 2 (dashboard i18n欠落, dashboard wei表示) |
| 🔒 100%Mock | 1 (monitoring) |
| API+FALLBACK | 8 (dashboard, provers, observers, users, audit-log, settings等) |

### 重大発見

1. **❌ Dashboard: i18n翻訳キー欠落** — `enterprise.dashboard.recentTransactions.statuses.processing` と `statuses.completed` が未定義（4 IntlError）
2. **❌ Dashboard: トランザクション金額がwei値のまま表示** — `10000000000000000` (= 0.01 ETH) がフォーマットされていない
3. **⚠️ Dashboard: 実データとFALLBACKの混在** — トランザクションテーブルは**実データ**（locksテーブル）、統計はFALLBACK
4. **⚠️ Login: デモ認証** — 任意の認証情報でログイン可能
5. **⚠️ Monitoring: API hookなし** — 100% FALLBACK_ALERTS

### 根本原因

**Enterprise Adminは最もAPI統合が進んでいるアプリ。25+のhookが定義・使用されているが、バックエンドからの応答フォーマットに問題（wei→ETH変換、ステータスi18n）が残る。**

---

## API Hooks一覧 (useEnterprise.ts)

| Hook | API Endpoint | 使用画面 | 状態 |
|:---|:---|:---|:---|
| `useDashboardOverview()` | GET /v1/enterprise/dashboard/overview | dashboard | ✅ |
| `useTVLMetrics()` | GET /v1/enterprise/dashboard/tvl | dashboard | ✅ |
| `useVolumeMetrics()` | GET /v1/enterprise/dashboard/volume | dashboard | ✅ |
| `useTransactions()` | GET /v1/enterprise/transactions | dashboard | ✅ 実データ |
| `useTransactionDetail()` | GET /v1/enterprise/transactions/:id | monitoring | ✅ |
| `useExportTransactions()` | POST /v1/enterprise/transactions/export | monitoring | ✅ |
| `useUsers()` | GET /v1/enterprise/users | users | ✅ |
| `useUserDetail()` | GET /v1/enterprise/users/:id | users | ✅ |
| `useCreateUser()` | POST /v1/enterprise/users | users | ✅ |
| `useInviteUser()` | POST /v1/enterprise/users/invite | team/invite | ✅ |
| `useUpdateUserRole()` | PUT /v1/enterprise/users/:id/role | users | ✅ |
| `useApiKeys()` | GET /v1/enterprise/api-keys | settings | ✅ |
| `useCreateApiKey()` | POST /v1/enterprise/api-keys | settings | ✅ |
| `useRevokeApiKey()` | DELETE /v1/enterprise/api-keys/:id | settings | ✅ |
| `useSettings()` | GET/PUT /v1/enterprise/settings | settings | ✅ |
| `useAuditLog()` | GET /v1/enterprise/audit-log | audit-log | ✅ |
| `useProvers()` | GET /v1/enterprise/provers | provers | ✅ |
| `useObservers()` | GET /v1/enterprise/observers | observers | ✅ |
| `useSystemStatus()` | GET /v1/enterprise/status | dashboard | ✅ |
| `useRecentActivity()` | GET /v1/enterprise/activity | dashboard | ✅ |
| `useWebhooks()` | GET /v1/enterprise/webhooks | settings | ✅ |
| `useReports()` | GET /v1/enterprise/reports | — | ✅ |
| `useLicenseReports()` | GET /v1/enterprise/license/reports | settings | ✅ |
| `useEnvironments()` | GET /v1/enterprise/environments | settings | ✅ |
| `useUserActivity()` | GET /v1/enterprise/users/:id/activity | users | ✅ |

**25+ hooks全て定義済み — 最も充実したAPI統合**

---

## 画面別検証結果

### E1: /enterprise/login ⚠️

| # | 表示項目 | 表示値 | 項目種別 | ソース |
|:--|:---------|:------|:--------|:------|
| 1 | ブランド名 | Quantum Shield ENTERPRISE | 静的テキスト | i18n |
| 2 | 暗号アルゴリズム | **Dilithium-III** | ⚠️ハードコード | 定数 |
| 3 | 稼働率 | **99.99%** | ⚠️ハードコード | 定数 |
| 4 | ノード数 | **127+** | ⚠️ハードコード | 定数 |
| 5 | TVL | **$2.4B** | ⚠️ハードコード | 定数 |
| 6 | SSO選択肢 | Google / Microsoft / SAML SSO | 静的テキスト | i18n |

**問題:** デモログイン — 任意認証情報でログイン可能（setTimeout 1.5s シミュレーション）。ログイン画面の統計値はすべてハードコード。

---

### E2: /enterprise/dashboard ❌⚠️

| # | 表示項目 | 表示値 | 項目種別 | ソース |
|:--|:---------|:------|:--------|:------|
| 1 | トランザクション(24h) | **12,847** | FALLBACK | FALLBACK_STATS |
| 2 | 変動率 | **+12.4%** | FALLBACK | FALLBACK_STATS |
| 3 | アクティブProver | **127** | FALLBACK | FALLBACK_STATS |
| 4 | アクティブObserver | **48** | FALLBACK | FALLBACK_STATS |
| 5 | システム稼働率 | **99.99%** | FALLBACK | FALLBACK_STATS |
| 6 | 未処理Challenge | **3** | FALLBACK | FALLBACK_STATS |
| 7 | APIレイテンシ | **45ms** | FALLBACK | FALLBACK_STATS |
| 8 | ユーザー名 | **佐藤** | ⚠️ハードコード | ユーザー情報 |
| 9 | 組織名 | **Acme Corp** | ⚠️ハードコード | ENTERPRISE EDITION |
| 10 | TX Hash row 1 | **0x65e849c9...** | ✅実データ | useTransactions() → locksテーブル |
| 11 | TX 種別 | **ロック** | ✅実データ | locksテーブルtype |
| 12 | TX 金額 | **10000000000000000** | ❌wei値 | locksテーブルamount（wei未変換） |
| 13 | TX ステータス | **処理中 / enterprise.dashboard...statuses.processing** | ❌i18n欠落 | 一部は翻訳成功、一部は翻訳キーがそのまま表示 |
| 14 | システムステータス | Lock Contract: Operational | ✅実データ | useSystemStatus() |
| 15 | Prover Network | **5 Active** | ✅実データ | useSystemStatus() |
| 16 | Observer Network | **3 Active** | ✅実データ | useSystemStatus() |
| 17 | 要対応: KYC審査 | **3件** | FALLBACK | FALLBACK_TASKS |
| 18 | 要対応: 緊急アンロック | **1件** | FALLBACK | FALLBACK_TASKS |
| 19 | 要対応: 承認待ち | **5件** | FALLBACK | FALLBACK_TASKS |

**問題一覧:**

| ID | 問題 | 深刻度 | 詳細 |
|:---|:-----|:------:|:-----|
| E2-C1 | TX金額がwei値のまま表示 | 🔴 | `10000000000000000` = 0.01 ETH。ETH変換必要 |
| E2-C2 | i18n翻訳キー欠落 (4 IntlError) | 🔴 | `enterprise.dashboard.recentTransactions.statuses.processing` / `completed` |
| E2-W1 | 統計6値がFALLBACK | ⚠️ | TX数12847, Prover127, Observer48等 |
| E2-W2 | ユーザー名/組織名ハードコード | ⚠️ | 佐藤 / Acme Corp |
| E2-W3 | TX時間が空セル | ⚠️ | timeカラムが表示されていない |

**重要な発見:** トランザクションテーブルは**実際のlocksテーブルデータ**を表示している（0x65e849c9... = Consumer Appでロックしたトランザクション）。これはEnterprise Adminが最もバックエンド統合が進んでいる証拠。

---

### E3: /enterprise/monitoring ⚠️🔒

**コード分析結果:**
- **データソース:** FALLBACK_ALERTS のみ — API hookなし
- **問題:** useMonitoring() hookが存在しない、100%ハードコードデモデータ
- **表示内容:** アラート一覧、メトリクスチャート（デモ）

---

### E4: /enterprise/emergency ⚠️

**コード分析結果:**
- **データソース:** 未詳細分析
- **SEQUENCES関連:** Emergency Pause = 5/9 Security Council が画面に実装されているか要確認
- **表示内容:** 緊急対応ダッシュボード

---

### E5: /enterprise/provers ⚠️

**コード分析結果:**
- **データソース:** API + FALLBACK — `useProvers()` → FALLBACK_PROVERS
- **問題:** API応答をコンポーネント形式にマッピング後、FALLBACK使用
- **表示内容:** Proverノード一覧、ステータス

---

### E6: /enterprise/provers/[id] ⚠️

**コード分析結果:**
- **データソース:** API (props経由) — `useProver(id)`
- **問題:** 個別Prover詳細、APIデータ使用

---

### E7: /enterprise/provers/calendar ⚠️

**コード分析結果:** 未詳細分析（メンテナンスカレンダー）

---

### E8: /enterprise/observers ⚠️

**コード分析結果:**
- **データソース:** API + FALLBACK — `useObservers()` → FALLBACK_OBSERVERS
- **表示内容:** Observerノード一覧

---

### E9: /enterprise/parameters ⚠️

**コード分析結果:** 未詳細分析（プロトコルパラメータ管理）

---

### E10: /enterprise/users ⚠️

**コード分析結果:**
- **データソース:** API + FALLBACK — `useUsers()` → FALLBACK_USERS
- **表示内容:** ユーザー統計、一覧

---

### E11: /enterprise/team ⚠️

**コード分析結果:** 未詳細分析（チーム管理）

---

### E12: /enterprise/team/invite ⚠️

**コード分析結果:**
- **データソース:** `useInviteUser()` mutation
- **表示内容:** 招待フォーム

---

### E13: /enterprise/settings ⚠️

**コード分析結果:**
- **データソース:** 複数hook — useSettings(), useEnvironments(), useLicenseReports(), useWebhooks()
- **タブ構成:** Organization / Branding / Notifications / Environments / Developer / License
- **問題:** 一部タブはMOCK_*データ使用

---

### E14: /enterprise/audit-log ⚠️

**コード分析結果:**
- **データソース:** API + FALLBACK — `useAuditLog()` → FALLBACK_AUDIT_EVENTS (MOCK_AUDIT_EVENTS_DATA)
- **表示内容:** 監査ログ一覧、フィルタ、ページネーション

---

### E15-E18: 静的ページ

| ID | 画面 | データソース | 評価 |
|:---|:-----|:-----------|:-----|
| E15 | /enterprise/help | i18n | ✅ |
| E16 | /enterprise/support | i18n | ✅ |
| E17 | /enterprise/terms | i18n | ✅ |
| E18 | /enterprise/privacy | i18n | ✅ |

---

## 課題一覧（深刻度順）

| # | 深刻度 | 画面 | 課題 | 原因 | 対策 |
|:--|:------:|:-----|:-----|:-----|:-----|
| 1 | 🔴 | dashboard | TX金額wei値のまま表示 | BEからwei値返却、FE未変換 | `ethers.formatEther(amount)` で変換 |
| 2 | 🔴 | dashboard | i18n翻訳キー4件欠落 | statuses.processing/completed | enterprise.jsonに翻訳追加 |
| 3 | ⚠️ | login | デモ認証（任意でログイン可） | シミュレーション | JWT認証実装 |
| 4 | ⚠️ | dashboard | 統計FALLBACK値 | API応答の形式不一致? | API応答マッピング確認 |
| 5 | ⚠️ | monitoring | API hookなし、100%FALLBACK | 未実装 | useMonitoring()作成 |
| 6 | ⚠️ | dashboard | ユーザー名/組織名ハードコード | 認証情報未連携 | JWT claimsから取得 |
| 7 | ⚠️ | dashboard | TX時間が空セル | API応答にtimestamp含まれず? | BE修正 or FEフォーマット追加 |
| 8 | 低 | login | 統計値ハードコード | ランディング用デモ値 | API連携 or 削除 |

---

## SEQUENCES.md照合

### Emergency Pause シーケンス

| パラメータ | SEQUENCES.md定義 | Enterprise表示 | 一致 |
|:---|:---|:---|:---|
| Security Council | 5/9 承認必要 | 緊急対応画面（未確認） | ⚠️ 未検証 |
| Emergency Pause権限 | Security Council | 要対応タスクに「緊急アンロック申請」表示 | ✅ 概念は表示 |

---

## データソースマップ

```
Enterprise Admin画面 (18ページ)
├── 認証
│   └── login ← デモ認証 (setTimeout)
│
├── ダッシュボード (API+FALLBACK混在)
│   └── dashboard ← 実データ(TX) + FALLBACK(統計) + i18nエラー
│
├── インフラ管理 (API+FALLBACK)
│   ├── provers ← useProvers() + FALLBACK_PROVERS
│   ├── provers/[id] ← useProver(id)
│   ├── provers/calendar ← 未確認
│   └── observers ← useObservers() + FALLBACK_OBSERVERS
│
├── 運用管理
│   ├── monitoring ← ❌ FALLBACK_ALERTSのみ (API hookなし)
│   ├── emergency ← 未確認
│   ├── parameters ← 未確認
│   └── users ← useUsers() + FALLBACK_USERS
│
├── チーム
│   ├── team ← 未確認
│   └── team/invite ← useInviteUser() mutation
│
├── レポート
│   └── audit-log ← useAuditLog() + FALLBACK_AUDIT_EVENTS
│
├── システム設定
│   └── settings ← 6タブ (useSettings, useEnvironments, etc.)
│
└── 静的ページ
    ├── help ← i18n
    ├── support ← i18n
    ├── terms ← i18n
    └── privacy ← i18n
```

### 特筆事項: Enterprise Adminは実データ表示を確認

ダッシュボードのトランザクションテーブルに**locksテーブルの実データ**が表示されている:
- TX Hash: `0x65e849c9adff6396b41dcedc3e41263c330a8bc32f58e55960d10809952a09f1` (Consumer Appのロック)
- 種別: ロック
- 金額: 10000000000000000 (wei = 0.01 ETH)
- ステータス: 処理中

システムステータスも実データ:
- Lock/Unlock Contract: Operational
- STARK Verifier: Operational
- Prover Network: 5 Active
- Observer Network: 3 Active

→ **Enterprise Adminは最もAPI統合が進んでいるアプリ**（ただしフォーマット/i18n問題あり）
