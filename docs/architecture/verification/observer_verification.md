# Observer Portal - 全画面データトレーサビリティ検証結果

**検証日時:** 2026-02-07
**検証対象:** Observer Portal全9画面
**検証方法:** Playwright MCP snapshot + コンソールエラー確認 + ソースコード分析

---

## サマリー

| 指標 | 値 |
|:---|:---|
| 総画面数 | 9 |
| ✅ 正常 | 2 (login, application) |
| ⚠️ 警告 | 6 (landing, dashboard, pending, suspicious, earnings, history) |
| ❌ エラー | 0 |
| 🔒 100%Mock | 2 (suspicious, earnings) |
| FALLBACK依存 | 1 (settings) |
| 静的ページ | 2 (login, application) |

### 根本原因

**Dashboard/Pending画面はunlocksテーブルから実データを表示するが、報酬・チャレンジ・疑わしい取引は100%Mock。**

- Dashboard: 待機中アンロック一覧は**実データ**（0xe69b...cdc3 = Consumerのロックデータ）
- Pending: アンロック一覧は**実データ**（リスクスコア・フィルター付き）
- Suspicious: **100%Mock** — `mockAlerts` 3件、API hookなし
- Earnings: **100%Mock** — `mockClaimableAmount`等、API hookなし
- History: **混合** — `useChallengeHistory()` hook使用するが`extendedChallenges`ハードコードフォールバック
- Settings: FALLBACK_SETTINGS使用（API hookあり）

---

## 画面別詳細

### 1. /ja/observer/landing (ランディング)

| # | 表示項目 | 表示値 | 項目種別 | ソース | 正確性 |
|:--|:--------|:------|:--------|:------|:------:|
| 1 | ページタイトル | 不正取引を見つけて報酬を獲得しよう | 静的テキスト | i18n | ✅ |
| 2 | アクティブ監視者 | 89 | ⚠️i18n値 | i18n `landing.stats.observers.value` | ⚠️ |
| 3 | 監視済みアンロック | 12,450 | ⚠️i18n値 | i18n `landing.stats.unlocks.value` | ⚠️ |
| 4 | 防止した不正額 | 約3億円 | ⚠️i18n値 | i18n `landing.stats.prevented.value` | ⚠️ |
| 5 | 分配済み報酬 | 156 ETH | ⚠️i18n値 | i18n `landing.stats.rewards.value` | ⚠️ |
| 6 | CTA: 監視者に申請する | ボタン | ナビゲーション | → /observer/application | ✅ |

**課題:**
- O1-W1: ネットワーク統計値がi18n翻訳ファイルにハードコード

---

### 2. /ja/observer/login (ログイン)

| # | 表示項目 | 表示値 | 項目種別 | ソース | 正確性 |
|:--|:--------|:------|:--------|:------|:------:|
| 1 | タイトル | 監視者ポータルにログイン | 静的テキスト | i18n | ✅ |
| 2 | ウォレット選択 | MetaMask, WalletConnect | ナビゲーション | wagmi connectors | ✅ |
| 3 | 戻るリンク | ← ランディングに戻る | ナビゲーション | router | ✅ |

**課題:** なし

---

### 3. /ja/observer/dashboard (ダッシュボード) ★重要

| # | 表示項目 | 表示値 | 項目種別 | ソース | 正確性 |
|:--|:--------|:------|:--------|:------|:------:|
| 1 | 練習モード有効バナー | 残り8日 | ⚠️FALLBACK | FALLBACK_OBSERVER_DATA.practiceDaysRemaining | ⚠️ |
| 2 | 待機中のアンロック | 47 | ⚠️FALLBACK | FALLBACK_OBSERVER_DATA | ⚠️ |
| 3 | 疑わしい取引 | 3 (要確認) | ⚠️FALLBACK | FALLBACK_SUSPICIOUS count | ⚠️ |
| 4 | 進行中の異議申立て | 2 | ⚠️FALLBACK | FALLBACK_CHALLENGES count | ⚠️ |
| 5 | 累計報酬 | 4.28 ETH | ⚠️FALLBACK | FALLBACK (mockデータ) | ⚠️ |
| 6 | アンロック一覧 | 0xe69b...cdc3 | ✅実データ | unlocks テーブル | ✅ |
| 7 | アンロック金額 | 10000000000000000 (wei) | ✅実データ | unlocks テーブル | ✅ |
| 8 | 残り時間 | 20:31:56 カウントダウン | ✅実データ | unlocks.timelock_until 計算 | ✅ |
| 9 | 請求可能報酬 | 1.24 ETH | ⚠️ハードコード | Dashboard props hardcoded | ⚠️ |
| 10 | チャレンジ成功/失敗 | 12/2 | ⚠️ハードコード | Dashboard props hardcoded | ⚠️ |

**課題:**
- O3-W1: サマリーカードの値（47, 3, 2, 4.28 ETH）はFALLBACK定数
- O3-W2: サイドバーの請求可能報酬1.24 ETH、成功12/失敗2はpropsでハードコード
- O3-OK: 待機中アンロック一覧はunlocksテーブルの実データ（Consumerのロックと一致確認済み）

---

### 4. /ja/observer/pending (待機中のアンロック) ★実データ

| # | 表示項目 | 表示値 | 項目種別 | ソース | 正確性 |
|:--|:--------|:------|:--------|:------|:------:|
| 1 | アンロック一覧 | 1件 (0xe69b...cdc3) | ✅実データ | unlocks テーブル | ✅ |
| 2 | 金額 | 10000000000000000 (wei) | ✅実データ | unlocks.amount | ✅ |
| 3 | 種別 | 通常 | ✅実データ | unlocks.unlock_type | ✅ |
| 4 | 残り時間 | 20:30:07 | ✅実データ | unlocks.timelock_until | ✅ |
| 5 | リスクスコア | 25 | ⚠️計算値 | FEリスク算出ロジック | ⚠️ |
| 6 | フィルター | 種別/金額/リスク/並び替え | ✅機能 | クライアント状態 | ✅ |
| 7 | リアルタイム監視 | ● リアルタイム | ✅表示 | polling interval | ✅ |
| 8 | ページネーション | 1~1件 / 1件 | ✅機能 | クライアント状態 | ✅ |

**課題:**
- O4-OK: 最も正確な画面 — unlocksテーブルの実データを正しく表示
- O4-W1: リスクスコア算出ロジックの正確性要確認（FE計算）

---

### 5. /ja/observer/suspicious (疑わしい取引) ★100%Mock

| # | 表示項目 | 表示値 | 項目種別 | ソース | 正確性 |
|:--|:--------|:------|:--------|:------|:------:|
| 1 | アラート数 | 3件のアラートが要確認 | ⚠️Mock | mockAlerts.length | ⚠️ |
| 2 | 高リスク検出 | スコア 87 | ⚠️Mock | mockAlerts[0].score | ⚠️ |
| 3 | アドレス | 0x4b7c...9e1f | ⚠️Mock | mockAlerts[0].address | ⚠️ |
| 4 | 金額 | 45.00 ETH | ⚠️Mock | mockAlerts[0].amount | ⚠️ |
| 5 | 種別 | Emergency | ⚠️Mock | mockAlerts[0].type | ⚠️ |
| 6 | リスク要因 | 4件（英語テキスト） | ⚠️Mock + i18n欠落 | ハードコード英語 | ❌ |

**課題:**
- O5-W1: 疑わしい取引画面は100%Mock — API hookゼロ
- O5-E1: リスク要因テキストが英語のまま（i18n未対応）: "First-time emergency unlock", "Amount is in top 5%", etc.

---

### 6. /ja/observer/earnings (報酬管理) ★100%Mock

| # | 表示項目 | 表示値 | 項目種別 | ソース | 正確性 |
|:--|:--------|:------|:--------|:------|:------:|
| 1 | 請求可能 | 1.24 ETH (≈$4,340) | ⚠️Mock | mockClaimableAmount | ⚠️ |
| 2 | 累計報酬 | 4.28 ETH | ⚠️Mock | mockTotalEarned | ⚠️ |
| 3 | 請求済み | 3.04 ETH | ⚠️Mock | mockTotalClaimed | ⚠️ |
| 4 | 成功率 | 85.7% | ⚠️Mock | 計算値 (12/14) | ⚠️ |
| 5 | 成功/失敗 | 12/2 | ⚠️Mock | ハードコード | ⚠️ |
| 6 | 請求可能な報酬リスト | 3件 (#CHG-2831等) | ⚠️Mock | mockBreakdown | ⚠️ |
| 7 | 監視者ステーク | 5.00 ETH | ⚠️Mock | ハードコード | ⚠️ |
| 8 | アクティブ開始日 | 2025-11-15 | ⚠️Mock | ハードコード | ⚠️ |
| 9 | 報酬請求ボタン | 報酬を請求 1.24 ETH | ⚠️Mock | mockClaimableAmount | ⚠️ |

**課題:**
- O6-W1: 報酬管理画面は100%Mock — API hookゼロ
- O6-W2: 報酬請求ボタンのmutation未実装

---

### 7. /ja/observer/history (異議申立て履歴)

| # | 表示項目 | 表示値 | 項目種別 | ソース | 正確性 |
|:--|:--------|:------|:--------|:------|:------:|
| 1 | 総異議申立て数 | 14 | ⚠️Mock/FALLBACK | extendedChallenges.length | ⚠️ |
| 2 | 成功 | 12 | ⚠️Mock/FALLBACK | 集計 | ⚠️ |
| 3 | 失敗 | 2 | ⚠️Mock/FALLBACK | 集計 | ⚠️ |
| 4 | 累計報酬 | 4.28 ETH | ⚠️Mock/FALLBACK | 集計 | ⚠️ |
| 5 | チャレンジ一覧 | #CHG-2843 等 7件 | ⚠️Mock | extendedChallenges | ⚠️ |
| 6 | CSVエクスポート | ボタン | ✅機能 | クライアント | ✅ |
| 7 | フィルター | 結果/期間 | ✅機能 | クライアント | ✅ |

**課題:**
- O7-W1: `useChallengeHistory()` hookは存在するが、`extendedChallenges`ハードコードにフォールバック

---

### 8. /ja/observer/settings (設定)

| # | 表示項目 | 表示値 | 項目種別 | ソース | 正確性 |
|:--|:--------|:------|:--------|:------|:------:|
| 1 | 監視者ID | OBS-2025-1842 | ⚠️FALLBACK | FALLBACK_SETTINGS.profile.observerId | ⚠️ |
| 2 | ウォレットアドレス | 0x5c3e2d9a8b7c... | ⚠️FALLBACK | FALLBACK_SETTINGS（実ウォレットと不一致！） | ❌ |
| 3 | メールアドレス | ...er@example.com | ⚠️FALLBACK | FALLBACK_SETTINGS | ⚠️ |
| 4 | ステータス | ● アクティブ | ⚠️FALLBACK | FALLBACK_SETTINGS | ⚠️ |
| 5 | 登録日 | 2025-11-15 | ⚠️FALLBACK | FALLBACK_SETTINGS | ⚠️ |
| 6 | 総異議申立て数 | 14 | ⚠️FALLBACK | FALLBACK_SETTINGS | ⚠️ |
| 7 | 成功率 | 85.7% | ⚠️FALLBACK | FALLBACK_SETTINGS | ⚠️ |
| 8 | 保存ボタン | 🖫 保存 | ⚠️機能不完全 | API未統合 | ⚠️ |

**課題:**
- O8-E1: ウォレットアドレスがFALLBACK値（0x5c3e...）で実際の接続ウォレット（0x7a3f...4f6a）と不一致 — **ユーザーに誤情報表示**
- O8-W1: `useObserverSettings()` hookは存在するがFALLBACKに依存

---

### 9. /ja/observer/application (監視者申請)

| # | 表示項目 | 表示値 | 項目種別 | ソース | 正確性 |
|:--|:--------|:------|:--------|:------|:------:|
| 1 | タイトル | 監視者申請 | 静的テキスト | i18n | ✅ |
| 2 | 3ステップ進行 | 1→2→3 | ナビゲーション | クライアント状態 | ✅ |
| 3 | ウォレット接続 | MetaMask | ナビゲーション | wagmi connectors | ✅ |
| 4 | 戻るリンク | ← ランディングに戻る | ナビゲーション | router | ✅ |

**課題:** なし — 静的フォーム

---

## 課題一覧（深刻度順）

### ❌ エラー

| # | 画面 | 課題 | 原因 | 対策 |
|:--|:-----|:-----|:-----|:-----|
| O8-E1 | settings | ウォレットアドレスがFALLBACK（実ウォレットと不一致） | FALLBACK_SETTINGS.walletAddress | wagmi useAccount()からアドレス取得 |
| O5-E1 | suspicious | リスク要因テキストが英語のまま | i18n未対応 | ja/en翻訳ファイルにキー追加 |

### ⚠️ 警告（100%Mock画面）

| # | 画面 | 課題 | 原因 | 対策 |
|:--|:-----|:-----|:-----|:-----|
| O5-W1 | suspicious | 疑わしい取引100%Mock | API hookなし | useSuspiciousTxs() hookを使用 |
| O6-W1 | earnings | 報酬管理100%Mock | API hookなし | useObserverEarnings() hookを使用 |
| O3-W1 | dashboard | サマリーカードの値がFALLBACK | API未返却 or FALLBACK優先 | FALLBACK除去、APIデータ優先 |
| O3-W2 | dashboard | サイドバーpropsハードコード | 親コンポーネントでハードコード | API hookからprops渡し |
| O7-W1 | history | チャレンジ履歴のextendedChallengesハードコード | hook fallback | FALLBACK除去 |
| O1-W1 | landing | ネットワーク統計がi18n値 | API未接続 | /v1/network/stats API化 |

---

## データソースマップ

```
ObserverDashboard
  ├── useObserverData() → FALLBACK_OBSERVER_DATA (練習モード、統計)
  ├── usePendingUnlocks() → ✅ unlocks テーブル実データ
  ├── useSuspiciousTransactions() → FALLBACK_SUSPICIOUS
  ├── useActiveChallenges() → FALLBACK_CHALLENGES
  └── Props hardcoded: claimableAmount="1.24 ETH", successful=12, failed=2

ObserverPending → ✅ usePendingUnlocks() → unlocks テーブル実データ

SuspiciousMonitor → mockAlerts (API hookなし) ❌

Earnings → mockClaimableAmount等 (API hookなし) ❌

ChallengeHistory → useChallengeHistory() + extendedChallenges fallback ⚠️

ObserverSettings → useObserverSettings() + FALLBACK_SETTINGS ⚠️
```

---

## 修正優先度

### P0（即座修正 — 誤情報表示）
1. **O8-E1**: Settings ウォレットアドレスが実ウォレットと不一致

### P1（高優先度 — Mock画面API統合）
2. **O5-W1**: Suspicious取引のAPI統合
3. **O6-W1**: Earnings報酬管理のAPI統合
4. **O5-E1**: リスク要因テキストのi18n化

### P2（中優先度）
5. **O3-W1/W2**: Dashboard統計のFALLBACK除去
6. **O7-W1**: History FALLBACKフォールバック除去
7. **O1-W1**: Landing統計のAPI化
