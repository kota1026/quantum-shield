# QS Admin - 全画面データトレーサビリティ検証結果

**検証日時:** 2026-02-07
**検証対象:** QS Admin全48画面
**検証方法:** Playwright MCP snapshot + コンソールエラー確認 + ソースコード分析

---

## サマリー

| 指標 | 値 |
|:---|:---|
| 総画面数 | 48 |
| ✅ 正常 | 0 |
| ⚠️ 警告 | 38 (MOCK_DATA / FALLBACK / ハードコード) |
| ❌ エラー | 7 (i18n欠落 / 未翻訳 / 空main) |
| 🚫 API未認証 | 全画面 (401 Unauthorized — admin JWT不在) |
| API hook定義済み | 17/20 サブページ (system系3画面はhook未実装) |
| Mock完全フォールバック | 80+エンドポイント (mock.ts 1400+行) |

### 重大発見

1. **❌ Users: i18n翻訳キー欠落** — `qsAdmin.status.active`, `qsAdmin.status.inactive`, `qsAdmin.status.suspended` が未定義（16 IntlError）
2. **❌ Treasury: テーブルヘッダー未翻訳** — "From", "To", "Amount", "Status", "Time", "Actions" が英語のまま
3. **❌ System: "System Status" + "operational"/"degraded" が英語のまま**
4. **❌ Announcements: 全タイトル・説明が英語** — "System Maintenance Scheduled", "New Token Support: WBTC" 等
5. **❌ Analytics/Reports: レポート名が英語** — "Monthly User Report", "Weekly Transaction Summary" 等
6. **❌ System 3画面: API hookなし** — alerts/logs/maintenance は100%ハードコード
7. **❌ Governance: mainコンテンツ空** — `/qs-admin/governance` のmain領域が空
8. **⚠️ サイレントMockフォールバック** — 503/ネットワークエラー時にコンソールwarningのみで利用者に通知なし
9. **⚠️ Dashboard: 統計・アクティビティ・アラート Failed to load** — チャートのみMock生成データ表示
10. **⚠️ Prover: ステーク量5,000-12,000 QS** — SEQUENCES.md要件 $400K/$500K と大幅乖離

### 根本原因

**QS Adminは9つのhookファイル(63+ hooks)と80+エンドポイントのMockが定義されている最大規模のアプリ。API呼び出し構造は整備されているが、全API呼び出しが401 Unauthorizedで失敗し、サイレントにMock/Fallbackデータを表示。i18n未対応箇所が多数残存。**

---

## アーキテクチャ概要

### データフロー

```
画面 (page.tsx)
  → Component (tsx)
    → useQuery hook (hooks/admin/*.ts)
      → AdminApiClient.get/post (lib/api/admin/client.ts)
        → Backend API (http://localhost:8080/api/admin/*)
          → 401 Unauthorized (JWT不在)
            → client: 503 or network error → getMockData(endpoint)
            → hook: try/catch → FALLBACK_* data
              → 画面表示: Mock/Fallbackデータ
```

### Hook一覧 (9ファイル, 63+ hooks)

| Hookファイル | hooks数 | API endpoints | Mock | Fallback |
|:---|:---:|:---:|:---:|:---:|
| useDashboard.ts | 11 | 11 | ✅ | ✅ (generateMock*) |
| useTransactions.ts | 10 | 12 | ✅ | ✅ (FALLBACK_STATS) |
| useUsers.ts | 10 | 10 | ✅ | ✅ |
| useProvers.ts | 7 | 7 | ✅ | ✅ |
| useObservers.ts | 5 | 4 | ✅ | ✅ |
| useTreasury.ts | 9 | 11 | ✅ | ✅ |
| useGovernance.ts | 6 | 6 | ✅ | ✅ |
| useMembers.ts | 10 | 10 | ✅ | ✅ |
| useSupport.ts | 12 | 10 | ✅ | ✅ |

### サイレントMockフォールバック (client.ts)

```
AdminApiClient.get(endpoint)
  → response.status === 503 → console.warn → getMockData(endpoint) ← サイレント
  → TypeError (network) → console.warn → getMockData(endpoint) ← サイレント
  → 401 → onUnauthorized() (ただし設定されていなければ無視)
```

**問題**: Mock/Fallbackデータが表示されても、画面上にはその旨の表示がない。管理者がMockデータを実データと誤認するリスク。

---

## 画面別検証結果

### 共通要素（全画面）

| # | 表示項目 | 表示値 | 項目種別 | ソース | 正確性 |
|:--|:---------|:------|:--------|:------|:------:|
| 1 | サイドバーロゴ | "QS Admin" | 静的テキスト | ハードコード | ✅ |
| 2 | サブタイトル | "Foundation Console" | 静的テキスト | ハードコード | ⚠️ 英語のまま |
| 3 | ユーザー表示 | "A" / "管理者" / "Superadmin" | 静的テキスト | ハードコード | ⚠️ |
| 4 | 検索バー | "検索..." | i18n | i18n | ✅ |
| 5 | サイドバーナビ | ダッシュボード, トランザクション... | i18n | i18n | ✅ |

### サイドバーナビゲーション構造

```
メイン: ダッシュボード
オペレーション: トランザクション (ロック/アンロック/緊急/チャレンジ), ユーザー
ネットワーク: Prover, Observer
ファイナンス: ガバナンス, トレジャリー (送金/予算配分/監査ログ)
組織: メンバー, サポート, お知らせ
設定: 分析, システム
```

---

### 1. Dashboard `/qs-admin/dashboard`

| # | 表示項目 | 表示値 | 項目種別 | ソース | 正確性 |
|:--|:---------|:------|:--------|:------|:------:|
| 1 | ページタイトル | "ダッシュボード" | i18n | i18n | ✅ |
| 2 | サブタイトル | "Quantum Shield Foundation 管理概要" | i18n | i18n | ✅ |
| 3 | タブ | "概要" / "統計" | i18n | i18n | ✅ |
| 4 | 統計カード | "Failed to load statistics" | エラー | API 401 | ⚠️ |
| 5 | TVLチャート | 0.00-140.00 ETH (7日間) | 動的グラフ | ⚠️ generateMockTvlHistory | ⚠️ |
| 6 | トランザクション件数チャート | ロック/アンロック (7日間) | 動的グラフ | ⚠️ generateMockVolumeHistory | ⚠️ |
| 7 | ユーザー数推移チャート | 0-2.2K (7日間) | 動的グラフ | ⚠️ generateMockUserGrowth | ⚠️ |
| 8 | 最近のアクティビティ | "Failed to load activity" | エラー | API 401 | ⚠️ |
| 9 | アラート | "Failed to load alerts" | エラー | API 401 | ⚠️ |
| 10 | クイックアクション | 4リンク (Prover申請/アンロック/お知らせ/トレジャリー) | ナビゲーション | i18n | ✅ |

**コンソール**: 16 errors (全API 401), 13 warnings (mock fallback)
**問題**: 統計・アクティビティ・アラートが "Failed to load" だが、チャートはMock生成データを表示。混在状態。

---

### 2. Transactions Overview `/qs-admin/transactions`

| # | 表示項目 | 表示値 | 項目種別 | ソース | 正確性 |
|:--|:---------|:------|:--------|:------|:------:|
| 1 | タイトル | "トランザクション" | i18n | i18n | ✅ |
| 2 | 統計 | "Failed to load statistics" | エラー | API 401 | ⚠️ |
| 3 | フィルタタブ | すべて/ロック/アンロック/緊急/チャレンジ | i18n | i18n | ✅ |
| 4 | テーブル | "Failed to load transactions" | エラー | API 401 | ⚠️ |
| 5 | テーブルヘッダ | ID/種別/ユーザー/金額/ステータス/日時/操作 | i18n | i18n | ✅ |

---

### 3. Lock Transactions `/qs-admin/transactions/lock`

| # | 表示項目 | 表示値 | 項目種別 | ソース | 正確性 |
|:--|:---------|:------|:--------|:------|:------:|
| 1 | タイトル | "ロックトランザクション" | i18n | i18n | ✅ |
| 2 | 総ロック数 | 0 | 動的数値 | ⚠️ FALLBACK_STATS (0) | ⚠️ |
| 3 | ロック総額 | 0 ETH | 動的数値 | ⚠️ FALLBACK_STATS (0) | ⚠️ |
| 4 | 平均ロック額 | 0 ETH | 動的数値 | ⚠️ FALLBACK_STATS (0) | ⚠️ |
| 5 | 平均ロック期間 | 0 days | 動的数値 | ⚠️ FALLBACK_STATS (0) | ⚠️ |
| 6 | テーブル | "ロックトランザクションはまだありません" | 空リスト | API 401→空配列 | ✅ (空は正常) |

**コンソール**: 2 errors (locks + locks/stats 401)

---

### 4. Unlock Transactions `/qs-admin/transactions/unlock`

| # | 表示項目 | 表示値 | 項目種別 | ソース | 正確性 |
|:--|:---------|:------|:--------|:------|:------:|
| 1 | タイトル | "アンロックトランザクション" | i18n | i18n | ✅ |
| 2 | 統計 | "統計データの読み込みに失敗しました" | エラー | API 401 | ⚠️ |
| 3 | テーブル | "トランザクションの読み込みに失敗しました" | エラー | API 401 | ⚠️ |
| 4 | テーブルヘッダ | ID/ユーザー/金額/残り時間/ステータス/申請日時/操作 | i18n | ハードコード日本語 | ⚠️ |

**コード問題**: STATUS_CONFIG にステータスラベルがハードコード日本語（承認待ち/準備完了/完了等）— t()未使用

---

### 5. Emergency Transactions `/qs-admin/transactions/emergency`

同構造。ハードコード日本語ステータスラベル。API hookあり、FALLBACK_STATSあり。

---

### 6. Challenge Transactions `/qs-admin/transactions/challenge`

同構造。ハードコード日本語ステータスラベル。API hookあり、FALLBACK_STATSあり。

---

### 7. Users Overview `/qs-admin/users`

| # | 表示項目 | 表示値 | 項目種別 | ソース | 正確性 |
|:--|:---------|:------|:--------|:------|:------:|
| 1 | タイトル | "ユーザー管理" | i18n | i18n | ✅ |
| 2 | 総ユーザー数 | 12,847 | 動的数値 | ⚠️ MOCK_DATA | ⚠️ |
| 3 | アクティブユーザー | 8,234 (+3.1%) | 動的数値 | ⚠️ MOCK_DATA | ⚠️ |
| 4 | 新規ユーザー(30日) | 1,256 (+12.5%) | 動的数値 | ⚠️ MOCK_DATA | ⚠️ |
| 5 | ロック中の総額 | 45,230 ETH (+8.3%) | 動的数値 | ⚠️ MOCK_DATA | ⚠️ |
| 6 | ユーザーテーブル | 8件のMockユーザー | 動的リスト | ⚠️ MOCK_DATA | ⚠️ |
| 7 | ステータスラベル | "qsAdmin.status.active" | ❌ i18n欠落 | 翻訳キー未定義 | ❌ |

**コンソール**: 18 errors (2 API 401 + 16 IntlError)
**❌ Critical**: `qsAdmin.status.active`, `qsAdmin.status.inactive`, `qsAdmin.status.suspended` の翻訳キーが未定義

---

### 8. Users List `/qs-admin/users/list`

useUsersList hook使用。Mock fallback。i18n適切（t()使用）。

---

### 9. Users Wallets `/qs-admin/users/wallets`

useWalletsList hook使用。Mock fallback。i18n適切。

---

### 10. User Detail `/qs-admin/users/[id]`

useUserDetail hook使用。動的パラメータ。Wei-to-ETH変換あり。

---

### 11. Prover Overview `/qs-admin/prover`

| # | 表示項目 | 表示値 | 項目種別 | ソース | 正確性 |
|:--|:---------|:------|:--------|:------|:------:|
| 1 | タイトル | "Prover管理" | i18n | i18n | ✅ |
| 2 | アクティブProver | 24 (+8.3%) | 動的数値 | ⚠️ MOCK_DATA | ⚠️ |
| 3 | 申請待ち | 5 | 動的数値 | ⚠️ MOCK_DATA | ⚠️ |
| 4 | 総ステーク量 | 125,000 QS (+12.5%) | 動的数値 | ⚠️ MOCK_DATA | ⚠️ |
| 5 | 平均稼働率 | 99.7% | 動的数値 | ⚠️ MOCK_DATA | ⚠️ |
| 6 | Proverテーブル | 5件のMock Prover | 動的リスト | ⚠️ MOCK_DATA | ⚠️ |
| 7 | Prover名 | "Prover Alpha", "Prover Beta" 等 | 動的テキスト | ⚠️ MOCK英語名 | ⚠️ |
| 8 | ステーク量 | 5,000-12,000 QS | 動的数値 | ⚠️ MOCK | ❌ SEQUENCES |

**SEQUENCES.md矛盾**: Proverの最小ステーク要件は $400K/$500K。5,000 QS は大幅に不足。

---

### 12. Prover List `/qs-admin/prover/list`

useProverList hook使用。Mock fallback。

---

### 13. Prover Detail `/qs-admin/prover/list/[id]`

useProverDetail hook使用。Mock fallback。

---

### 14. Prover Requests `/qs-admin/prover/requests`

useProverRequests hook使用。Mock fallback。

---

### 15. Prover Request Detail `/qs-admin/prover/requests/[id]`

useProverRequestDetail hook使用。Mock fallback。

---

### 16. Observer Overview `/qs-admin/observer`

| # | 表示項目 | 表示値 | 項目種別 | ソース | 正確性 |
|:--|:---------|:------|:--------|:------|:------:|
| 1 | タイトル | "Observer管理" | i18n | i18n | ✅ |
| 2 | アクティブObserver | 156 (+5.2%) | 動的数値 | ⚠️ MOCK_DATA | ⚠️ |
| 3 | 総チャレンジ数 | 1234 (+15.3%) | 動的数値 | ⚠️ MOCK_DATA | ⚠️ |
| 4 | 成功率 | 94.2% | 動的数値 | ⚠️ MOCK_DATA | ⚠️ |
| 5 | 総報酬 | 45,000 QS (+8.7%) | 動的数値 | ⚠️ MOCK_DATA | ⚠️ |
| 6 | Observerテーブル | 5件のMock Observer | 動的リスト | ⚠️ MOCK_DATA | ⚠️ |

---

### 17. Observer List `/qs-admin/observer/list`

useObserverList hook使用。Mock fallback。

---

### 18. Observer Detail `/qs-admin/observer/list/[id]`

useObserverDetail hook使用。Mock fallback。

---

### 19. Governance Overview `/qs-admin/governance`

| # | 表示項目 | 表示値 | 項目種別 | ソース | 正確性 |
|:--|:---------|:------|:--------|:------|:------:|
| 1 | main領域 | (空) | — | — | ❌ 空画面 |

**❌ Critical**: mainコンテンツ領域が完全に空。ガバナンス概要の実装が未完了。

---

### 20. Governance Proposals `/qs-admin/governance/proposals`

useGovernanceProposals hook使用。MOCK_GOVERNANCE_PROPOSALS を直接import。i18n適切（t()使用）。

---

### 21. Governance Proposal Detail `/qs-admin/governance/proposals/[id]`

useProposalDetail hook使用。Mock fallback。

---

### 22. Governance Voting `/qs-admin/governance/voting`

useActiveVotes hook使用。MOCK_VOTING_STATS, MOCK_ACTIVE_VOTES を直接import。i18n適切。

---

### 23. Treasury Overview `/qs-admin/treasury`

| # | 表示項目 | 表示値 | 項目種別 | ソース | 正確性 |
|:--|:---------|:------|:--------|:------|:------:|
| 1 | タイトル | "トレジャリー" | i18n | i18n | ✅ |
| 2 | 残高 | 125,000 ETH / $312,500,000 | 動的数値 | ⚠️ MOCK_DATA | ⚠️ |
| 3 | ウォレット数 | 5 | 動的数値 | ⚠️ MOCK_DATA | ⚠️ |
| 4 | 承認待ち | 2 | 動的数値 | ⚠️ MOCK_DATA | ⚠️ |
| 5 | メインウォレット | 75,000 ETH / $187,500,000 (3/5署名者) | 動的 | ⚠️ MOCK_DATA | ⚠️ |
| 6 | オペレーショナル | 25,000 ETH / $62,500,000 (2/3署名者) | 動的 | ⚠️ MOCK_DATA | ⚠️ |
| 7 | グラント | 15,000 ETH / $37,500,000 (3/5署名者) | 動的 | ⚠️ MOCK_DATA | ⚠️ |
| 8 | 保険基金 | 8,000 ETH / $20,000,000 (5/7署名者) | 動的 | ⚠️ MOCK_DATA | ⚠️ |
| 9 | 緊急対応 | 2,000 ETH / $5,000,000 (2/3署名者) | 動的 | ⚠️ MOCK_DATA | ⚠️ |
| 10 | 承認待ちリスト | TXF-001 (500 ETH), TXF-002 (1,000 ETH) | 動的 | ⚠️ MOCK_DATA | ⚠️ |
| 11 | 履歴テーブルヘッダ | "ID/From/To/Amount/Status/Time/Actions" | ❌ 英語 | ハードコード | ❌ |
| 12 | ステータス | "completed" | ❌ 英語 | ハードコード | ❌ |
| 13 | ETH→USD換算 | $2,500/ETH 想定 | ❌ ハードコード | 計算値 | ❌ |

---

### 24. Treasury Wallets `/qs-admin/treasury/wallets`

useTreasuryWallets hook使用。MOCK_TREASURY_WALLETS_EXTENDED を直接import。i18n適切。

---

### 25. Treasury Transfers `/qs-admin/treasury/transfers`

useTransferStats hook使用。MOCK_TRANSFER_STATS, MOCK_TREASURY_TRANSFERS を直接import。i18n適切。

---

### 26. Treasury Transfer Detail `/qs-admin/treasury/transfers/[id]`

useTreasuryTransfer hook使用。Mock fallback。

---

### 27. Treasury New Transfer `/qs-admin/treasury/transfers/new`

フォーム画面。ウォレット選択はMockデータ。

---

### 28. Treasury Budget `/qs-admin/treasury/budget`

useTreasuryBudget hook使用。MOCK_BUDGET_DATA, MOCK_BUDGET_CATEGORIES を直接import。i18n適切。

---

### 29. Treasury Audit Log `/qs-admin/treasury/audit`

| # | 表示項目 | 表示値 | 項目種別 | ソース | 正確性 |
|:--|:---------|:------|:--------|:------|:------:|
| 1 | ACTION_LABELS | "Transfer Initiated", "Transfer Approved" 等 | ❌ 英語 | ハードコード (lines 50-60) | ❌ |

useAuditLogs hook使用。Mock fallback。**ACTION_LABELS がハードコード英語**。

---

### 30. Members Overview `/qs-admin/members`

| # | 表示項目 | 表示値 | 項目種別 | ソース | 正確性 |
|:--|:---------|:------|:--------|:------|:------:|
| 1 | コンテンツ | "エラーが発生しました" + 再試行ボタン | エラー | API 401 | ⚠️ |

**コンソール**: 2 errors (members/stats + members 401)
Mock fallback がこの画面では発動しない（エラーページ表示）。

---

### 31. Members Roles `/qs-admin/members/roles`

useRolesList hook使用。MOCK_ROLES, MOCK_PERMISSION_CATEGORIES を直接import。i18n適切。

---

### 32. Support Overview `/qs-admin/support`

| # | 表示項目 | 表示値 | 項目種別 | ソース | 正確性 |
|:--|:---------|:------|:--------|:------|:------:|
| 1 | コンテンツ | "エラーが発生しました" + 再試行ボタン | エラー | API 401 | ⚠️ |

Mock fallback がこの画面では発動しない。

---

### 33. Support Tickets `/qs-admin/support/tickets`

useTicketsList hook使用。MOCK_TICKETS を直接import。i18n適切（t()使用）。

---

### 34. Support FAQ `/qs-admin/support/faq`

useFAQCategories hook使用。MOCK_FAQ_CATEGORIES を直接import。i18n適切。

---

### 35. Announcements `/qs-admin/announcements`

| # | 表示項目 | 表示値 | 項目種別 | ソース | 正確性 |
|:--|:---------|:------|:--------|:------|:------:|
| 1 | タイトル | "お知らせ管理" | i18n | i18n | ✅ |
| 2 | 総お知らせ数 | 45 | 動的数値 | ⚠️ ハードコード | ⚠️ |
| 3 | 公開中 | 38 | 動的数値 | ⚠️ ハードコード | ⚠️ |
| 4 | 予約投稿 | 4 | 動的数値 | ⚠️ ハードコード | ⚠️ |
| 5 | 下書き | 3 | 動的数値 | ⚠️ ハードコード | ⚠️ |
| 6 | お知らせ1 | "System Maintenance Scheduled" | ❌ 英語 | ハードコード | ❌ |
| 7 | お知らせ2 | "New Token Support: WBTC" | ❌ 英語 | ハードコード | ❌ |
| 8 | お知らせ3 | "Enhanced Security Features" | ❌ 英語 | ハードコード | ❌ |
| 9 | お知らせ4 | "Prover Rewards Increase" | ❌ 英語 | ハードコード | ❌ |
| 10 | お知らせ5 | "Important Security Notice" | ❌ 英語 | ハードコード | ❌ |
| 11 | お知らせ6 | "Draft: Q1 Roadmap Update" | ❌ 英語 | ハードコード | ❌ |
| 12 | カテゴリタグ | メンテナンス/アップデート/お知らせ/重要 | i18n | i18n | ✅ |
| 13 | 閲覧数 | 3,450 / 5,200 / 2,890 / 8,900 | 動的数値 | ⚠️ ハードコード | ⚠️ |
| 14 | 日付 | 2024-01-15 ～ 2024-01-30 | 動的日付 | ⚠️ ハードコード | ⚠️ |

---

### 36. Analytics Overview `/qs-admin/analytics`

| # | 表示項目 | 表示値 | 項目種別 | ソース | 正確性 |
|:--|:---------|:------|:--------|:------|:------:|
| 1 | タイトル | "分析" | i18n | i18n | ✅ |
| 2 | DAU | 0 (+5.2%) | 動的数値 | API失敗→0 | ⚠️ 0に+5.2%は矛盾 |
| 3 | MAU | 0 (+12.8%) | 動的数値 | API失敗→0 | ⚠️ 0に+12.8%は矛盾 |
| 4 | 総収益 | 0 ETH (+0%) | 動的数値 | API失敗→0 | ⚠️ |
| 5 | 平均取引額 | 2.5 ETH | 動的数値 | ⚠️ ハードコード | ⚠️ |
| 6 | ユーザー成長チャート | Mock生成 (30日間) | 動的グラフ | ⚠️ generateMock | ⚠️ |
| 7 | 取引量チャート | Mock生成 (30日間) | 動的グラフ | ⚠️ generateMock | ⚠️ |

**問題**: DAU=0, MAU=0 に対して +5.2%, +12.8% の変化率が表示 — **矛盾**

---

### 37. Analytics Users `/qs-admin/analytics/users`

ハードコードFALLBACK_STATS。API hookなし。t()部分使用。

---

### 38. Analytics Revenue `/qs-admin/analytics/revenue`

ハードコードFALLBACK_STATS（"125,000 QS" 等）。API hookなし。t()部分使用。

---

### 39. Analytics Reports `/qs-admin/analytics/reports`

| # | 表示項目 | 表示値 | 項目種別 | ソース | 正確性 |
|:--|:---------|:------|:--------|:------|:------:|
| 1 | レポート名 | "Monthly User Report", "Weekly Transaction Summary" 等 | ❌ 英語 | ハードコード FALLBACK_REPORTS | ❌ |

API hookなし。100%ハードコード英語。

---

### 40. System Overview `/qs-admin/system`

| # | 表示項目 | 表示値 | 項目種別 | ソース | 正確性 |
|:--|:---------|:------|:--------|:------|:------:|
| 1 | タイトル | "システム" | i18n | i18n | ✅ |
| 2 | アクティブアラート | 2 | ⚠️ ハードコード | ハードコード | ⚠️ |
| 3 | システム健全性 | 99.2% | ⚠️ ハードコード | ハードコード | ⚠️ |
| 4 | 稼働率 | 99.9% | ⚠️ ハードコード | ハードコード | ⚠️ |
| 5 | 最終メンテナンス | 2024-01-15 | ⚠️ ハードコード | ハードコード | ⚠️ |
| 6 | "System Status" 見出し | "System Status" | ❌ 英語 | ハードコード | ❌ |
| 7 | API Server | 45ms / operational | ⚠️ ハードコード | ハードコード | ⚠️ |
| 8 | Database | 12ms / operational | ⚠️ ハードコード | ハードコード | ⚠️ |
| 9 | Blockchain RPC | 120ms / operational | ⚠️ ハードコード | ハードコード | ⚠️ |
| 10 | Prover Network | 350ms / degraded | ⚠️ ハードコード | ハードコード | ⚠️ |
| 11 | Observer Network | 85ms / operational | ⚠️ ハードコード | ハードコード | ⚠️ |
| 12 | ステータスラベル | "operational" / "degraded" | ❌ 英語 | ハードコード | ❌ |

---

### 41. System Alerts `/qs-admin/system/alerts`

**❌ API hookなし**。FALLBACK_ALERTS（ハードコード）。英語文字列: "Prover Network", "System", "API Server"。

---

### 42. System Logs `/qs-admin/system/logs`

**❌ API hookなし**。FALLBACK_LOGS（ハードコード）。英語文字列: "API", "DB", "Prover", "RPC"。

---

### 43. System Maintenance `/qs-admin/system/maintenance`

**❌ API hookなし**。FALLBACK_MAINTENANCE（ハードコード）。英語文字列: "Database Optimization", "Security Patch Deployment", "API Server Upgrade"。

---

### 44-48. Detail/Dynamic Pages

| 画面 | URL | データソース | 状態 |
|:---|:---|:---|:---|
| 44 | /transactions/lock/[id] | useLockDetail hook | ⚠️ Mock |
| 45 | /transactions/unlock/[id] | useUnlockDetail hook | ⚠️ Mock |
| 46 | /transactions/emergency/[id] | - | ⚠️ Mock |
| 47 | /transactions/challenge/[id] | - | ⚠️ Mock |
| 48 | /qs-admin (root) | リダイレクト/ローディング | ⚠️ |

---

## 課題一覧（深刻度順）

### ❌ Critical (修正必須)

| # | 画面 | 課題 | 原因 | 対策 |
|:--|:-----|:-----|:-----|:-----|
| 1 | users | i18n翻訳キー欠落: qsAdmin.status.* | ja.jsonにキー未定義 | ja/en.jsonにステータスキー追加 |
| 2 | treasury | テーブルヘッダ英語 "From/To/Amount/Status/Time/Actions" | ハードコード英語 | i18nキーに変換 |
| 3 | treasury | ステータス "completed" 英語のまま | ハードコード | i18nキーに変換 |
| 4 | system | "System Status" + "operational"/"degraded" 英語 | ハードコード | i18nキーに変換 |
| 5 | announcements | 全6件のタイトル・説明が英語 | Mockデータが英語 | Mockデータを日本語化 or API接続 |
| 6 | analytics/reports | レポート名が英語 | ハードコードFALLBACK | i18nキーに変換 |
| 7 | treasury/audit | ACTION_LABELS が英語 | ハードコード (lines 50-60) | i18nキーに変換 |
| 8 | governance | main領域が空 | 実装未完了 | GovernanceOverviewコンポーネント実装 |

### ⚠️ High (改善推奨)

| # | 画面 | 課題 | 原因 | 対策 |
|:--|:-----|:-----|:-----|:-----|
| 9 | system/alerts,logs,maintenance | API hookなし (100%ハードコード) | hook未実装 | useSystemAlerts等のhook作成 |
| 10 | analytics/users,revenue | API hookなし (ハードコード数値) | hook未実装 | useAnalytics*のhook作成 |
| 11 | 全画面 | サイレントMockフォールバック | client.ts設計 | ユーザーに通知バナー追加 |
| 12 | dashboard | 統計/アクティビティ/アラート Failed + チャートMock混在 | 一部Mockあり一部なし | 統一されたエラー/Mock表示 |
| 13 | analytics | DAU=0に+5.2%、MAU=0に+12.8%表示 | 変化率がFallback値 | 値が0の場合は変化率非表示に |
| 14 | prover | ステーク量5,000-12,000 QS | Mock値がSEQUENCES.md不整合 | $400K/$500K相当のMock値に修正 |
| 15 | 全画面 | "Foundation Console" 英語 | サイドバーハードコード | i18n対応 |
| 16 | 全画面 | "Superadmin" ラベル英語 | サイドバーハードコード | i18n対応 |
| 17 | transactions/unlock,emergency,challenge | STATUS_CONFIG ハードコード日本語 | t()未使用 | i18nキーに変換 |

### 📊 Medium (要検討)

| # | 画面 | 課題 | 原因 | 対策 |
|:--|:-----|:-----|:-----|:-----|
| 18 | treasury | ETH→USD換算 $2,500固定 | ハードコード | 外部API or 設定値 |
| 19 | announcements | 全日付が2024-01 | Mockデータ | 現在日付のMockに更新 |
| 20 | users | Mock ウォレットアドレス (0x1234...5678等) | Mockデータ | 実データ連携後に解消 |

---

## SEQUENCES.md照合

| パラメータ | SEQUENCES.md | QS Admin表示値 | 一致 |
|:---|:---|:---|:---:|
| Prover最小ステーク | $400K/$500K | 5,000-12,000 QS | ❌ |
| Prover稼働率 | 記載なし | 99.7% (Mock) | — |
| Observer成功率 | 記載なし | 94.2% (Mock) | — |
| Treasury マルチシグ | 記載なし | 3/5, 2/3, 5/7 (Mock) | — |

---

## 技術スタック詳細

### API Client (lib/api/admin/client.ts)

- Base URL: `NEXT_PUBLIC_API_URL || 'http://localhost:8080'`
- Mock有効: `NEXT_PUBLIC_ENABLE_MOCK === 'true'` (現在false)
- 503 → サイレントMock
- Network Error → サイレントMock
- 401 → onUnauthorized callback (設定されていなければ無視)

### Mock Data (lib/api/admin/mock.ts)

- 1400+行
- 80+エンドポイントのレスポンス定義
- パターンマッチング: 動的ルート対応 (`/provers/PV-001` 等)
- **Productionバンドルに含まれるリスク**

### Auth Store (stores/adminAuthStore.ts)

- Zustand + sessionStorage
- JWT access/refresh token
- POST `/api/admin/auth/login`
- POST `/api/admin/auth/refresh`
- 401 → 自動ログアウト
