# Legacy Admin - 全画面データトレーサビリティ検証結果

**検証日時:** 2026-02-07
**検証対象:** Legacy Admin (/admin/) 全70画面
**検証方法:** Playwright MCP snapshot + コンソールエラー確認 + ソースコード分析

---

## サマリー

| 指標 | 値 |
|:---|:---|
| 総画面数 | 70 |
| ✅ 正常 | 5 (settings系) |
| ⚠️ 警告 | 58 (MOCK_DATA / FALLBACK / ハードコード) |
| ❌ エラー | 4 (未翻訳英語テキスト / コンポーネント未実装) |
| 🚫 100%ハードコード | 62+ (全データ画面がMock/Fallback) |
| カテゴリ別 | root:11, public:17, saas:25, settings:5, license:7, licensees:3, other:2 |

### 重大発見

1. **❌ Dashboard: アラート・アクティビティが英語テキスト** — "New Prover Application: Node-Alpha-42", "SaaS Application: Acme Corp" 等
2. **❌ Public/Provers: i18n不完全** — "Prover List", "Search...", "Filter", "Dashboard" パンくず等が英語のまま
3. **⚠️ 全データ画面がMock/Fallback** — API hookは定義済み(9ファイル, 63+ hooks)だが、Legacy Admin画面からの利用が限定的
4. **⚠️ Dashboard: 全統計ハードコード** — $1.24B TVL, 45,892ユーザー, 142 Prover, $2.4M月間収益
5. **⚠️ 2つのダッシュボード実装** — AdminDashboard.tsx (旧) と AdminIntegratedDashboard.tsx (新) が共存
6. **⚠️ SaaS/License 32画面** — API hookが未定義、データソース不明
7. **⚠️ 3画面のコンポーネント未確認** — /admin/billing, /admin/reports, /admin/enterprise のコンポーネントが見つからない可能性

### 根本原因

**Legacy Adminは3つの事業領域（パブリック版/企業版SaaS/技術譲渡）を統合管理する最大規模のアプリ。AdminSidebarV2による新しいナビゲーション構造を持つが、大半の画面が100%ハードコードMockデータで動作。API hook基盤(9ファイル)は整備されているが、Legacy Admin独自の画面（public/*, saas/*, license/*）向けのhookが不足。**

---

## アーキテクチャ概要

### ナビゲーション構造 (AdminSidebarV2)

```
概要
  ├── メイン
  │   ├── 統合ダッシュボード → /admin/dashboard
  │   └── 緊急停止 → /admin/emergency
  │
パブリック版管理
  ├── ユーザー管理 (展開)
  │   ├── ユーザー一覧 → /admin/public/users
  │   ├── ユーザー統計 → /admin/public/users/stats
  │   ├── Prover管理 → /admin/public/provers
  │   ├── Observer管理 → /admin/public/observers
  │   ├── デリゲート → /admin/public/delegates
  │   ├── ホルダー → /admin/public/holders
  │   └── 投票力 → /admin/public/voting-power
  ├── ガバナンス (展開)
  │   └── ガバナンス → /admin/public/governance
  ├── トレジャリー → /admin/public/treasury
  └── プロトコル監視 (展開)
      ├── プロトコル → /admin/public/protocol
      ├── コントラクト → /admin/public/protocol/contracts
      └── アラート → /admin/public/protocol/alerts
  │
企業版SaaS管理
  ├── 運営企業 (展開)
  │   ├── 一覧 → /admin/saas/operators
  │   ├── 申請 → /admin/saas/operators/applications
  │   ├── 契約 → /admin/saas/operators/contracts
  │   └── プラン → /admin/saas/operators/plans
  ├── 課金・サポート (展開)
  │   ├── 課金 → /admin/saas/billing
  │   └── サポート → /admin/saas/support
  │
技術譲渡管理
  ├── ライセンス (展開)
  │   ├── 契約企業 → /admin/license/companies
  │   ├── プロジェクト → /admin/license/projects
  │   ├── ドキュメント → /admin/license/documents
  │   ├── 更新 → /admin/license/renewals
  │   └── トレーニング → /admin/license/training
  │
財団設定
  └── 設定
      ├── メンバー管理 → /admin/settings/members
      ├── 監査ログ → /admin/settings/audit-log
      └── セキュリティ → /admin/settings/security
```

### データフロー

```
Legacy Admin画面
  ├── Pattern A: AdminIntegratedDashboard → 100%ハードコードデータ
  ├── Pattern B: Public/SaaS/License Components → 100%ハードコードFALLBACK_*
  └── Pattern C: Settings/Members → useQuery hooks → API (qs-admin hooks共有) → Mock fallback
```

### Hook一覧 (共有: apps/web/src/hooks/admin/ — QS Adminと同じ)

| Hookファイル | hooks数 | Legacy Admin使用 |
|:---|:---:|:---:|
| useDashboard.ts | 11 | 部分的 (AdminIntegratedDashboard) |
| useTransactions.ts | 10 | 限定的 |
| useUsers.ts | 10 | 限定的 |
| useProvers.ts | 7 | 限定的 |
| useObservers.ts | 5 | 限定的 |
| useTreasury.ts | 9 | 限定的 |
| useGovernance.ts | 6 | 限定的 |
| useMembers.ts | 10 | settings/members |
| useSupport.ts | 12 | 限定的 |

**問題**: Public/SaaS/License画面向けの専用hookが存在しない。これらの画面はすべてコンポーネント内のハードコードデータで動作。

---

## カテゴリ別検証結果

### A. Root Level Admin (11画面)

#### 1. Dashboard `/admin/dashboard` — AdminIntegratedDashboard (NEW)

| # | 表示項目 | 表示値 | 項目種別 | ソース | 正確性 |
|:--|:---------|:------|:--------|:------|:------:|
| 1 | タイトル | "統合ダッシュボード" | i18n | i18n | ✅ |
| 2 | サブタイトル | "Quantum Shield 全体管理" | i18n | i18n | ✅ |
| 3 | リアルタイム更新 | "リアルタイム更新" | i18n | i18n | ✅ |
| 4 | 総TVL | $1.24B (+8.5%) | ⚠️ ハードコード | FALLBACK | ⚠️ |
| 5 | 総ユーザー数 | 45,892 (+1,234) | ⚠️ ハードコード | FALLBACK | ⚠️ |
| 6 | 総Prover数 | 142 (+5) | ⚠️ ハードコード | FALLBACK | ⚠️ |
| 7 | 月間収益 | $2.4M (+12%) | ⚠️ ハードコード | FALLBACK | ⚠️ |
| 8 | パブリック版TVL | $847.2M | ⚠️ ハードコード | FALLBACK | ⚠️ |
| 9 | パブリック版ユーザー | 32,456 | ⚠️ ハードコード | FALLBACK | ⚠️ |
| 10 | パブリック版Prover | 127 | ⚠️ ハードコード | FALLBACK | ⚠️ |
| 11 | 企業版SaaS運営企業 | 12 | ⚠️ ハードコード | FALLBACK | ⚠️ |
| 12 | 企業版SaaS MRR | $1.8M | ⚠️ ハードコード | FALLBACK | ⚠️ |
| 13 | 技術譲渡契約企業 | 3 | ⚠️ ハードコード | FALLBACK | ⚠️ |
| 14 | 技術譲渡ライセンス収益 | $4.2M | ⚠️ ハードコード | FALLBACK | ⚠️ |
| 15 | アラート1 | "New Prover Application: Node-Alpha-42" | ❌ 英語 | ハードコード | ❌ |
| 16 | アラート2 | "SaaS Application: Acme Corp" | ❌ 英語 | ハードコード | ❌ |
| 17 | アラート3 | "Prover SLA Warning: Node-Beta-12" | ❌ 英語 | ハードコード | ❌ |
| 18 | アラート4 | "Payment Overdue: XYZ Exchange" | ❌ 英語 | ハードコード | ❌ |
| 19 | アクティビティ1 | "New Lock: 125 ETH from 0x7a3f...9c2d" | ❌ 英語 | ハードコード | ❌ |
| 20 | アクティビティ2 | "Operator joined: Acme Corp" | ❌ 英語 | ハードコード | ❌ |
| 21 | ユーザー名 | "松本さん" / "スーパー管理者" | i18n | i18n | ✅ |
| 22 | タブ | 概要/パブリック版/企業版SaaS/技術譲渡 | i18n | i18n | ✅ |

#### 2-11. Other Root Pages

| # | 画面 | URL | 状態 | データソース |
|:--|:-----|:----|:-----|:-----------|
| 2 | 緊急停止 | /admin/emergency | ⚠️ ハードコード | FALLBACK |
| 3 | Prover管理 | /admin/prover | ⚠️ ハードコード | FALLBACK |
| 4 | TXモニター | /admin/tx-monitor | ⚠️ ハードコード | FALLBACK |
| 5 | L3ノード | /admin/nodes | ⚠️ ハードコード | FALLBACK |
| 6 | スタッフ | /admin/staff | ⚠️ ハードコード | FALLBACK |
| 7 | オンボーディング | /admin/onboarding | ⚠️ ハードコード | FALLBACK |
| 8 | 監査 | /admin/audit | ⚠️ ハードコード | FALLBACK |
| 9 | パラメータ | /admin/parameters | ❌ コンポーネント不明 | — |
| 10 | コミュニティ | /admin/community | ❌ コンポーネント不明 | — |
| 11 | アップデート | /admin/updates | ❌ コンポーネント不明 | — |

---

### B. Public版管理 (17画面)

#### 12. Public Provers `/admin/public/provers`

| # | 表示項目 | 表示値 | 項目種別 | ソース | 正確性 |
|:--|:---------|:------|:--------|:------|:------:|
| 1 | タイトル | "Prover管理" | i18n | i18n | ✅ |
| 2 | パンくず | "Dashboard" > "Prover Management" | ❌ 英語 | ハードコード | ❌ |
| 3 | 総Prover数 | 127 | ⚠️ ハードコード | FALLBACK | ⚠️ |
| 4 | アクティブ | 124 (97.6%) | ⚠️ ハードコード | FALLBACK | ⚠️ |
| 5 | 総ステーク額 | 6.35M QS | ⚠️ ハードコード | FALLBACK | ⚠️ |
| 6 | 平均SLA | 99.87% | ⚠️ ハードコード | FALLBACK | ⚠️ |
| 7 | テーブル見出し | "Prover List" | ❌ 英語 | ハードコード | ❌ |
| 8 | 検索 | "Search..." | ❌ 英語 | ハードコード | ❌ |
| 9 | フィルタボタン | "Filter" | ❌ 英語 | ハードコード | ❌ |
| 10 | Prover名 | "Alpha Node Labs", "Beta Validators" 等 | ⚠️ 英語Mock名 | ハードコード | ⚠️ |
| 11 | ステーク | 40,000-55,000 QS | ⚠️ | SEQUENCES不整合 | ❌ |

**SEQUENCES.md矛盾**: Prover最小ステーク $400K/$500K。50,000 QS は大幅に不足。

#### 13-28. Other Public Pages

| # | 画面 | URL | 状態 |
|:--|:-----|:----|:-----|
| 13 | Prover Detail | /admin/public/provers/[id] | ⚠️ Mock |
| 14 | Prover Applications | /admin/public/provers/applications | ⚠️ Mock |
| 15 | Prover Performance | /admin/public/provers/performance | ⚠️ Mock |
| 16 | Prover Slashing | /admin/public/provers/slashing | ⚠️ Mock |
| 17 | Users | /admin/public/users | ⚠️ Mock |
| 18 | User Detail | /admin/public/users/[id] | ⚠️ Mock |
| 19 | User Stats | /admin/public/users/stats | ⚠️ Mock |
| 20 | Observers | /admin/public/observers | ⚠️ Mock |
| 21 | Delegates | /admin/public/delegates | ⚠️ Mock |
| 22 | Holders | /admin/public/holders | ⚠️ Mock |
| 23 | Voting Power | /admin/public/voting-power | ⚠️ Mock |
| 24 | Governance | /admin/public/governance | ⚠️ Mock |
| 25 | Treasury | /admin/public/treasury | ⚠️ Mock |
| 26 | Protocol Monitor | /admin/public/protocol | ⚠️ Mock |
| 27 | Protocol Contracts | /admin/public/protocol/contracts | ⚠️ Mock |
| 28 | Protocol Alerts | /admin/public/protocol/alerts | ⚠️ Mock |

**共通パターン**: 全Public画面が100%ハードコードFALLBACKデータ。API hookは未接続。

---

### C. 企業版SaaS管理 (25画面)

| # | 画面 | URL | 状態 |
|:--|:-----|:----|:-----|
| 29 | Operators | /admin/saas/operators | ⚠️ Mock |
| 30 | Operator Detail | /admin/saas/operators/[id] | ⚠️ Mock |
| 31 | Operator Applications | /admin/saas/operators/applications | ⚠️ Mock |
| 32 | Operator Contracts | /admin/saas/operators/contracts | ⚠️ Mock |
| 33 | Operator Plans | /admin/saas/operators/plans | ⚠️ Mock |
| 34 | Provers QS | /admin/saas/provers/qs | ⚠️ Mock |
| 35 | Provers Operator | /admin/saas/provers/operator | ⚠️ Mock |
| 36 | Provers Performance | /admin/saas/provers/performance | ⚠️ Mock |
| 37 | Provers SLA | /admin/saas/provers/sla | ⚠️ Mock |
| 38 | Observers | /admin/saas/observers | ⚠️ Mock |
| 39 | Observer Status | /admin/saas/observers/status | ⚠️ Mock |
| 40 | Users | /admin/saas/users | ⚠️ Mock |
| 41 | User Stats | /admin/saas/users/stats | ⚠️ Mock |
| 42 | User Risks | /admin/saas/users/risks | ⚠️ Mock |
| 43 | Support | /admin/saas/support | ⚠️ Mock |
| 44 | Support History | /admin/saas/support/history | ⚠️ Mock |
| 45 | Billing | /admin/saas/billing | ⚠️ Mock |
| 46 | Billing Payments | /admin/saas/billing/payments | ⚠️ Mock |
| 47 | Billing Revenue | /admin/saas/billing/revenue | ⚠️ Mock |
| 48 | Billing Usage | /admin/saas/billing/usage | ⚠️ Mock |
| 49 | Infrastructure | /admin/saas/infrastructure | ⚠️ Mock |
| 50 | Infrastructure Capacity | /admin/saas/infrastructure/capacity | ⚠️ Mock |
| 51 | Infrastructure SLA | /admin/saas/infrastructure/sla | ⚠️ Mock |

**共通パターン**: SaaS画面は独自のデータ領域（運営企業、課金、SLA等）を管理。API hookが未定義のため、全画面がコンポーネント内ハードコードデータ。

---

### D. Settings (5画面)

| # | 画面 | URL | 状態 | データソース |
|:--|:-----|:----|:-----|:-----------|
| 52 | System | /admin/settings/system | ✅ i18n | 設定画面 |
| 53 | Members | /admin/settings/members | ✅ useMembers hook | API + fallback |
| 54 | Roles | /admin/settings/roles | ✅ useRolesList hook | API + fallback |
| 55 | Audit Log | /admin/settings/audit-log | ✅ useAuditLogs hook | API + fallback |
| 56 | Security | /admin/settings/security | ✅ i18n | 設定画面 |

**唯一のAPI連携済みカテゴリ**。useMembers/useRolesList/useAuditLogs hookが接続されている。

---

### E. License管理 (7画面)

| # | 画面 | URL | 状態 |
|:--|:-----|:----|:-----|
| 57 | Companies | /admin/license/companies | ⚠️ Mock |
| 58 | Company Detail | /admin/license/companies/[id] | ⚠️ Mock |
| 59 | Projects | /admin/license/projects | ⚠️ Mock |
| 60 | Project Detail | /admin/license/projects/[id] | ⚠️ Mock |
| 61 | Documents | /admin/license/documents | ⚠️ Mock |
| 62 | Renewals | /admin/license/renewals | ⚠️ Mock |
| 63 | Training | /admin/license/training | ⚠️ Mock |

---

### F. Licensees (3画面)

| # | 画面 | URL | 状態 | 特記 |
|:--|:-----|:----|:-----|:-----|
| 64 | Licensees List | /admin/licensees | ⚠️ 100% FALLBACK_LICENSEES | ハードコード配列 |
| 65 | Licensee Detail | /admin/licensees/[id] | ⚠️ 100% FALLBACK_LICENSEE | ハードコードオブジェクト |
| 66 | Licensee Support | /admin/licensees/[id]/support | ⚠️ 100% FALLBACK_TICKETS | ハードコード配列 |

**特記**: これら3画面はコンポーネント内に直接FALLBACK_*配列が定義されている（hookすら呼ばない）。

---

### G. Other (4画面)

| # | 画面 | URL | 状態 |
|:--|:-----|:----|:-----|
| 67 | Billing | /admin/billing | ❌ コンポーネント不確認 |
| 68 | Support | /admin/support | ⚠️ FALLBACK_TICKETS |
| 69 | Reports | /admin/reports | ❌ コンポーネント不確認 |
| 70 | Enterprise | /admin/enterprise | ❌ コンポーネント不確認 |

---

## 課題一覧（深刻度順）

### ❌ Critical (修正必須)

| # | 画面 | 課題 | 原因 | 対策 |
|:--|:-----|:-----|:-----|:-----|
| 1 | dashboard | アラート4件が英語テキスト | ハードコード英語 | i18nキーに変換 |
| 2 | dashboard | アクティビティ5件が英語テキスト | ハードコード英語 | i18nキーに変換 |
| 3 | public/provers | "Prover List", "Search...", "Filter" 英語 | ハードコード英語 | i18nキーに変換 |
| 4 | public/provers | パンくず "Dashboard" > "Prover Management" 英語 | ハードコード英語 | i18nキーに変換 |

### ⚠️ High (改善推奨)

| # | 画面 | 課題 | 原因 | 対策 |
|:--|:-----|:-----|:-----|:-----|
| 5 | 全62+画面 | 100%ハードコードMockデータ | API未接続 | Public/SaaS/License用hook作成 |
| 6 | dashboard | 全統計値がハードコード ($1.24B等) | FALLBACK | API hook接続 |
| 7 | public/provers | Proverステーク50,000 QS (SEQUENCES不整合) | Mock値 | $400K相当に修正 |
| 8 | 3画面 | コンポーネント未確認 (billing/reports/enterprise) | 実装不完全 | コンポーネント確認・作成 |
| 9 | licensees 3画面 | hookを呼ばず直接FALLBACK_*使用 | 設計上の問題 | hook経由に移行 |
| 10 | 共通 | "Foundation Dashboard" 英語 | サイドバーハードコード | i18n対応 |

### 📊 Medium (要検討)

| # | 画面 | 課題 |
|:--|:-----|:-----|
| 11 | public/* 17画面 | 独自API endpoint未定義 |
| 12 | saas/* 25画面 | SaaS専用API endpoint未定義 |
| 13 | license/* 7画面 | License専用API endpoint未定義 |
| 14 | dashboard | 旧AdminDashboard.tsx と新AdminIntegratedDashboard.tsx が共存 |

---

## SEQUENCES.md照合

| パラメータ | SEQUENCES.md | Legacy Admin表示値 | 一致 |
|:---|:---|:---|:---:|
| Prover最小ステーク | $400K/$500K | 40,000-55,000 QS | ❌ |
| 総Prover数 | — | 127 / 142 (画面により異なる) | ⚠️ 不整合 |
| Emergency Pause | 5/9 Security Council | 表示なし (emergency画面は未確認) | — |

---

## コンポーネント統計

| カテゴリ | コンポーネント数 | Storybookあり | i18n使用 |
|:---|:---:|:---:|:---:|
| Root Level | 27 | 14 | ✅ |
| Public | 17 | 0 | 部分的 |
| SaaS | 22 | 0 | 部分的 |
| Settings | 5 | 0 | ✅ |
| License | 7 | 0 | 部分的 |
| Licensees | 3 | 0 | 部分的 |
| **合計** | **85** | **14** | — |

---

## 技術的特記事項

### AdminSidebarV2 (新サイドバー)

QS Adminの旧AdminSidebarとは異なる新しいナビゲーション:
- 5セクション: 概要, パブリック版管理, 企業版SaaS管理, 技術譲渡管理, 財団設定
- 折りたたみサブメニュー
- ユーザー表示: "松本さん" / "スーパー管理者"

### 2つのダッシュボード

| | AdminDashboard (旧) | AdminIntegratedDashboard (新) |
|:---|:---|:---|
| 使用先 | 不使用？ | /admin/dashboard |
| スコープ | QS Adminのみ | パブリック+SaaS+License統合 |
| サイドバー | AdminSidebar | なし (フルスクリーン) |
| ステータス | 非推奨 | ✅ 現在使用中 |

### API認証

- Legacy Adminは QS Admin と同じ admin JWT 認証を使用
- sessionStorage にトークン保存
- 401 → 自動ログアウト
