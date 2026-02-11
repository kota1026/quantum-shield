# Prover Portal - 全画面データトレーサビリティ検証結果

**検証日時:** 2026-02-07
**検証対象:** Prover Portal全13画面
**検証方法:** Playwright MCP snapshot + コンソールエラー確認 + ソースコード分析 + SEQUENCES.md照合

---

## サマリー

| 指標 | 値 |
|:---|:---|
| 総画面数 | 13 |
| ✅ 正常 | 3 (login, terms, application-status) |
| ⚠️ 警告 | 7 (landing, requirements, application, dashboard, queue, alerts, challenges) |
| ❌ エラー | 2 (metrics - クラッシュ, rewards - 404) |
| 🔒 100%Mock | 3 (exit, settings, challenges) |
| 静的ページ | 4 (landing, login, requirements, terms) |

### 根本原因

**大半のProver画面がFALLBACK定数またはmockデータで動作しており、APIデータは署名キュー(queue)のみ実データを表示。**

- Dashboard: signing_queueからの署名キューアイテムは**実データ**、しかし統計値(処理数、レスポンスタイム等)は**FALLBACK_STATS**
- Queue: signing_queueテーブルからの2件は**実データ**、avgWaitは**ハードコード** ('4m 32s')
- Exit/Settings/Challenges: **100%Mock** — API hookなし
- Metrics: i18nキー欠落 + React Query undefined でクラッシュ
- Alerts: API hook使用するがFALLBACKに依存、i18n `maintenance` キー欠落

### SEQUENCES.md準拠状況

| パラメータ | SEQUENCES定義 | 画面表示値 | 準拠 |
|:---|:---|:---|:---:|
| Minimum Stake | $400K~$500K | $400,000 | ✅ |
| Exit Cooling Period | 7日 unbonding | 7日間 | ✅ |
| Slashing N=1 | N²×10% = 10% | 40,000 QS (10%) | ✅ |
| Uptime Requirement | 99.9% | 99.9% (requirements), 99.97% (landing) | ⚠️差異 |
| Response Time | <30s | <30s (requirements), 28.2s (dashboard, ハードコード) | ⚠️ |
| Early Exit Penalty | 定義あり | 5% (-$20,000) | ✅ 画面に表示 |

---

## 画面別詳細

### 1. /ja/prover/landing (ランディング)

| # | 表示項目 | 表示値 | 項目種別 | ソース | 正確性 |
|:--|:--------|:------|:--------|:------|:------:|
| 1 | ページタイトル | Prover Portal | 静的テキスト | i18n | ✅ |
| 2 | アクティブProver数 | 127 | ⚠️i18n値 | i18n `landing.stats.activeProvers.value` | ⚠️ |
| 3 | 総ステーク額 | $50.8M | ⚠️i18n値 | i18n `landing.stats.totalStaked.value` | ⚠️ |
| 4 | 年間ROI | 18.5% | ⚠️i18n値 | i18n `landing.stats.annualRoi.value` | ⚠️ |
| 5 | ネットワーク稼働率 | 99.97% | ⚠️i18n値 | i18n `landing.stats.uptime.value` | ⚠️ |
| 6 | ROI計算ツール | 計算機 | クライアント計算 | baseFeeRate=0.0004 hardcoded | ⚠️ |
| 7 | スラッシングテーブル | 4段階 | 静的参照 | ハードコード | ✅参考 |
| 8 | 要件サマリー | $400K+, FIPS 140-2等 | 静的テキスト | i18n | ✅ |

**課題:**
- P1-W1: ネットワーク統計値(127, $50.8M, 18.5%, 99.97%)がi18n翻訳ファイルにハードコード — APIから取得すべき
- P1-W2: ROI計算のbaseFeeRate=0.0004がハードコード定数

---

### 2. /ja/prover/login (ログイン)

| # | 表示項目 | 表示値 | 項目種別 | ソース | 正確性 |
|:--|:--------|:------|:--------|:------|:------:|
| 1 | ページタイトル | Prover ログイン | 静的テキスト | i18n | ✅ |
| 2 | SIWE署名リクエスト | Sign-In with Ethereum | ナビゲーション | wagmi + SIWE | ✅ |
| 3 | ウォレット接続状態 | 接続済み | 動的 | wagmi useAccount | ✅ |

**課題:** なし — 認証フローは正常動作

---

### 3. /ja/prover/requirements (要件)

| # | 表示項目 | 表示値 | 項目種別 | ソース | 正確性 |
|:--|:--------|:------|:--------|:------|:------:|
| 1 | 最小ステーク | $400,000+ | 静的テキスト | i18n | ✅ |
| 2 | ハードウェア要件 | FIPS 140-2 Level 3+ | 静的テキスト | i18n | ✅ |
| 3 | 稼働率要件 | 99.9% uptime | 静的テキスト | i18n | ✅ |
| 4 | レスポンスタイム | <30秒 | 静的テキスト | i18n | ✅ |

**課題:** なし — SEQUENCES.md準拠の静的参照ページ

---

### 4. /ja/prover/terms (利用規約)

| # | 表示項目 | 表示値 | 項目種別 | ソース | 正確性 |
|:--|:--------|:------|:--------|:------|:------:|
| 1 | 規約テキスト | 法的文書 | 静的テキスト | i18n | ✅ |
| 2 | 同意チェックボックス | 未チェック | ナビゲーション | クライアント状態 | ✅ |

**課題:** なし

---

### 5. /ja/prover/application (申請フォーム)

| # | 表示項目 | 表示値 | 項目種別 | ソース | 正確性 |
|:--|:--------|:------|:--------|:------|:------:|
| 1 | 4ステップフォーム | Step 1-4 | ナビゲーション | クライアント状態 | ✅ |
| 2 | Public/Enterprise タブ | 選択式 | ナビゲーション | クライアント状態 | ✅ |
| 3 | 基本情報フォーム | 入力欄 | フォーム | クライアント状態 | ✅ |
| 4 | 技術要件確認 | チェックリスト | フォーム | クライアント状態 | ✅ |

**課題:** なし — フォーム自体は正常動作（送信先APIは別途検証必要）

---

### 6. /ja/prover/dashboard (ダッシュボード) ★重要

| # | 表示項目 | 表示値 | 項目種別 | ソース | 正確性 |
|:--|:--------|:------|:--------|:------|:------:|
| 1 | 保留中の署名 | 12 | ⚠️FALLBACK | FALLBACK_STATS.pendingSignatures | ⚠️ |
| 2 | 緊急署名 | 3件 | ⚠️FALLBACK | FALLBACK_STATS.urgentCount | ⚠️ |
| 3 | 本日の処理数 | 487 | ⚠️FALLBACK | FALLBACK_STATS.todaysProcessed | ⚠️ |
| 4 | 処理数変化率 | +12% | ⚠️FALLBACK | FALLBACK_STATS.processedChange=12 | ⚠️ |
| 5 | 平均処理数 | 420/日 | ⚠️FALLBACK | FALLBACK_STATS.avgProcessed=420 | ⚠️ |
| 6 | レスポンスタイム | 28.2ms | ⚠️FALLBACK | FALLBACK_STATS.responseTime=28.2 | ⚠️ |
| 7 | 署名キューアイテム | 0xe69b...cdc3 等 | ✅実データ | signing_queue テーブル | ✅ |
| 8 | キューアイテム金額 | 0.01 ETH | ✅実データ | signing_queue テーブル | ✅ |
| 9 | 請求可能報酬 | 3.75 ETH | ⚠️FALLBACK | FALLBACK_REWARDS.claimable=3.75 | ⚠️ |
| 10 | ステーク額 | 100.0 QST | ⚠️FALLBACK | FALLBACK_STAKE.amount=100.0 | ⚠️ |
| 11 | 今月の予想報酬 | 1.125 ETH | ⚠️計算値 | claimable × 0.3 (ハードコード係数) | ⚠️ |

**課題:**
- P6-W1: FALLBACK_STATS内の6個の値（pendingSignatures, urgentCount, todaysProcessed, processedChange, avgProcessed, responseTime）が全てハードコード — KI-6で既知
- P6-W2: 報酬データ(3.75 ETH)はFALLBACK — ProverRewardsテーブルなし
- P6-W3: 月間予想=claimable×0.3 は不正確な推定式
- P6-OK: 署名キューアイテムはsigning_queueテーブルから実データ取得

---

### 7. /ja/prover/queue (署名キュー)

| # | 表示項目 | 表示値 | 項目種別 | ソース | 正確性 |
|:--|:--------|:------|:--------|:------|:------:|
| 1 | キューアイテム一覧 | 2件 (0xe69b..., 別1件) | ✅実データ | signing_queue テーブル | ✅ |
| 2 | アイテム金額 | 0.01 ETH | ✅実データ | signing_queue テーブル | ✅ |
| 3 | アイテムステータス | pending | ✅実データ | signing_queue.status | ✅ |
| 4 | 平均待機時間 | 4m 32s | ⚠️ハードコード | ProverQueue.tsx L119 TODO | ⚠️ |
| 5 | ソースチェーン | L3 Aegis | ⚠️ハードコード | ProverQueue.tsx | ⚠️ |
| 6 | 宛先チェーン | Ethereum L1 | ⚠️ハードコード | ProverQueue.tsx | ⚠️ |
| 7 | 署名生成 | SPHINCS+ 署名 | ⚠️Mock | random hex generation L222 | ⚠️ |
| 8 | HSM証明 | HSM_ATT_sign_... | ⚠️Mock | format string L223 | ⚠️ |

**課題:**
- P7-W1: avgWait='4m 32s' ハードコード (TODO: キューデータから算出すべき)
- P7-W2: SPHINCS+署名生成がランダムhex — 実際のHSM/暗号ライブラリ未統合
- P7-W3: HSM証明がフォーマット文字列 — 実際のHSM未統合
- P7-OK: キューアイテム自体はsigning_queueテーブルの実データ

---

### 8. /ja/prover/metrics (メトリクス) ★クラッシュ

| # | 表示項目 | 表示値 | 項目種別 | ソース | 正確性 |
|:--|:--------|:------|:--------|:------|:------:|
| 1 | 画面全体 | ❌ Application Error | エラー | クラッシュ | ❌ |

**エラー詳細:**
1. `IntlError: MISSING_MESSAGE: Could not resolve 'prover.metrics.detail.undefined'` — i18nキーに `undefined` が混入
2. `Query data cannot be undefined` — React Query `["prover","payoutHistory",...]` が undefined を返す

**課題:**
- P8-E1: メトリクスページ完全クラッシュ — i18nキー `prover.metrics.detail.undefined` が未定義
- P8-E2: payoutHistory hookがundefinedを返してReact Queryエラー
- P8-E3: FALLBACK_DETAIL_METRICS のmetric名がundefinedになっている可能性

---

### 9. /ja/prover/alerts (アラート & ステーク管理)

| # | 表示項目 | 表示値 | 項目種別 | ソース | 正確性 |
|:--|:--------|:------|:--------|:------|:------:|
| 1 | ページタイトル | アラート & ステーク管理 | 静的テキスト | i18n | ✅ |
| 2 | アラートタブ | すべて, 緊急(1), 警告(1), 情報(0) | ⚠️FALLBACK | FALLBACK_ALERTS | ⚠️ |
| 3 | 署名タイムアウト警告 | REQ-2026-0001, 120秒 | ⚠️FALLBACK | FALLBACK_ALERTS[0] | ⚠️ |
| 4 | システムリソース警告 | CPU 85%, prover-node-01 | ⚠️FALLBACK | FALLBACK_ALERTS[1] | ⚠️ |
| 5 | ステーク管理タブ | ステーク管理 | ⚠️FALLBACK | FALLBACK_STAKE_DATA | ⚠️ |

**i18nエラー:**
- `prover.alerts.items.maintenance.title` — 未定義
- `prover.alerts.items.maintenance.description` — 未定義

**課題:**
- P9-W1: アラートデータは全てFALLBACK_ALERTS（APIエンドポイント未実装、Redis-only設計でPGテーブルなし）
- P9-W2: ステークデータもFALLBACK_STAKE_DATA
- P9-E1: maintenance アラートのi18nキーが欠落

---

### 10. /ja/prover/challenges (チャレンジ対応)

| # | 表示項目 | 表示値 | 項目種別 | ソース | 正確性 |
|:--|:--------|:------|:--------|:------|:------:|
| 1 | ページタイトル | チャレンジ対応 | 静的テキスト | i18n | ✅ |
| 2 | チャレンジID | CHG-2026-000123 | ⚠️Mock | mockActiveChallenge.id | ⚠️ |
| 3 | 申立人 | Watcher #W-0042 | ⚠️Mock | mockActiveChallenge.applicant | ⚠️ |
| 4 | 日時 | 2026/01/17 10:15 | ⚠️Mock | mockActiveChallenge.date | ⚠️ |
| 5 | 違反種類 | 無効な署名 | ⚠️Mock | mockActiveChallenge.violationType | ⚠️ |
| 6 | 潜在的Slashing | 40,000 QS (10%) | ⚠️Mock | mockActiveChallenge | ⚠️ |
| 7 | 弁明期限カウントダウン | 23:45:xx | ⚠️Mock | mockActiveChallenge.timeRemaining | ⚠️ |
| 8 | タブ | 通知(1), 弁明提出, 結果 | ⚠️Mock | mockデータ | ⚠️ |

**課題:**
- P10-W1: チャレンジ機能は100%Mock — API hookなし
- P10-OK: Slashing率10%はSEQUENCES.md準拠（N=1, N²×10%=10%）

---

### 11. /ja/prover/exit (Exit申請)

| # | 表示項目 | 表示値 | 項目種別 | ソース | 正確性 |
|:--|:--------|:------|:--------|:------|:------:|
| 1 | ページタイトル | Prover Exit申請 | 静的テキスト | i18n | ✅ |
| 2 | 現在のステーク | $400,000 (QST 80,000) | ⚠️Mock | mockExitData.currentStake | ⚠️ |
| 3 | 未請求報酬 | $12,340 | ⚠️Mock | mockExitData.unclaimedRewards | ⚠️ |
| 4 | ロック解除日 | 2026/09/20 (残り183日) | ⚠️Mock | mockExitData (計算値) | ⚠️ |
| 5 | Exit処理タイムライン | 4ステージ | ⚠️Mock | ハードコード | ⚠️ |
| 6 | クーリング期間 | 7日間 | ⚠️Mock | ハードコード | ✅SEQUENCES準拠 |
| 7 | 早期Exitペナルティ率 | 5% | ⚠️Mock | mockExitData.penaltyRate | ⚠️ |
| 8 | ペナルティ金額 | -$20,000 | ⚠️Mock | mockExitData.penaltyAmount | ⚠️ |
| 9 | Exit前確認事項 | 180日ロック、リクエスト完了必要 | 静的テキスト | i18n | ✅ |

**課題:**
- P11-W1: Exit機能は100%Mock — API hookゼロ
- P11-OK: 7日間クーリング期間はSEQUENCES.md準拠

---

### 12. /ja/prover/settings (設定)

| # | 表示項目 | 表示値 | 項目種別 | ソース | 正確性 |
|:--|:--------|:------|:--------|:------|:------:|
| 1 | Prover ID | PRV-047 | ⚠️Mock | mockSettings.profile.proverId | ⚠️ |
| 2 | 組織名 | Quantum Node Labs | ⚠️Mock | mockSettings.profile.organizationName | ⚠️ |
| 3 | メールアドレス | admin@quantumnodelabs.io | ⚠️Mock | mockSettings.profile.email | ⚠️ |
| 4 | 国 | Japan | ⚠️Mock | mockSettings.profile.country | ⚠️ |
| 5 | ティア | Tier 1 | ⚠️Mock | mockSettings.profile.tier | ⚠️ |
| 6 | ステータス | Active | ⚠️Mock | ハードコード | ⚠️ |
| 7 | 登録日 | 2025/06/15 | ⚠️Mock | mockSettings.profile.joinedDate | ⚠️ |
| 8 | 言語設定 | 日本語/English | ✅機能 | next-intl locale | ✅ |
| 9 | 通知設定トグル | ON/OFF | ✅機能 | クライアント状態 | ⚠️保存なし |
| 10 | セキュリティ設定 | 2FA有効等 | ⚠️Mock | mockSettings.security | ⚠️ |

**課題:**
- P12-W1: 設定は100%Mock — API hookゼロ、保存機能なし
- P12-W2: 通知設定のトグルは動作するがバックエンドに送信されない

---

### 13. /ja/prover/application-status (申請状況確認)

| # | 表示項目 | 表示値 | 項目種別 | ソース | 正確性 |
|:--|:--------|:------|:--------|:------|:------:|
| 1 | ページタイトル | 申請状況確認 | 静的テキスト | i18n | ✅ |
| 2 | 申請ID入力欄 | 例: PRV-2026-001234 | フォーム | クライアント | ✅ |
| 3 | メールアドレス入力欄 | 例: admin@example.com | フォーム | クライアント | ✅ |
| 4 | Overviewに戻るリンク | ← Overviewに戻る | ナビゲーション | router | ✅ |

**課題:** なし — 検索フォーム自体は正常（検索結果のAPI統合は別途検証必要）

---

## 存在しないページ

| URL | 結果 | 備考 |
|:---|:---|:---|
| /ja/prover/stake | 404 | alertsページの「ステーク管理」タブに内包 |
| /ja/prover/rewards | 404 | dashboardの報酬カードに内包、独立ページなし |

---

## 課題一覧（深刻度順）

### ❌ エラー（修正必須）

| # | 画面 | 課題 | 原因 | 対策 |
|:--|:-----|:-----|:-----|:-----|
| P8-E1 | metrics | ページ完全クラッシュ | i18nキー `prover.metrics.detail.undefined` 未定義 | metricsデータのキー名マッピング修正 + i18nキー追加 |
| P8-E2 | metrics | React Query undefined | payoutHistory hookがundefined返却 | hookのデフォルト値またはFALLBACK設定 |
| P9-E1 | alerts | i18n欠落 | `maintenance.title/description` キー未定義 | ja/en翻訳ファイルにキー追加 |

### ⚠️ 警告（100%Mock画面 — バックエンド統合必要）

| # | 画面 | 課題 | 原因 | 対策 |
|:--|:-----|:-----|:-----|:-----|
| P11-W1 | exit | Exit機能100%Mock | API hook未実装 | ProverExitリポジトリ + APIエンドポイント実装 |
| P12-W1 | settings | 設定100%Mock | API hook未実装 | ProverProfileリポジトリ + APIエンドポイント実装 |
| P10-W1 | challenges | チャレンジ100%Mock | API hook未実装 | ChallengeRepository + APIエンドポイント実装 |
| P9-W1 | alerts | アラート全てFALLBACK | Redis-only設計、PGテーブルなし | alertsテーブル作成 or Redis API統合 |

### ⚠️ 警告（FALLBACK混在 — 部分修正必要）

| # | 画面 | 課題 | 原因 | 対策 |
|:--|:-----|:-----|:-----|:-----|
| P6-W1 | dashboard | 統計値6個がFALLBACK | KI-6: ハードコードTODO値 | Prover統計テーブル + 集計クエリ実装 |
| P6-W2 | dashboard | 報酬3.75 ETH FALLBACK | ProverRewardsテーブルなし | 報酬計算ロジック + テーブル実装 |
| P7-W1 | queue | avgWait='4m 32s' ハードコード | TODO: キューデータから算出 | signing_queueのcreated_atから平均待機時間算出 |
| P7-W2 | queue | SPHINCS+署名がランダムhex | HSM未統合 | fips205 crateまたはHSM API統合 |
| P1-W1 | landing | ネットワーク統計がi18n値 | API未接続 | /v1/network/stats APIから動的取得 |

---

## API検証結果

### 実データ確認済みエンドポイント

| エンドポイント | レスポンス | データソース | 状態 |
|:---|:---|:---|:---:|
| GET /v1/prover/queue | 200 OK | signing_queue テーブル | ✅実データ |
| GET /v1/prover/stats | 200 OK | signing_queue 集計 | ✅実データ(部分) |

### FALLBACK依存エンドポイント

| エンドポイント | 状態 | FALLBACK定数 |
|:---|:---|:---|
| GET /v1/prover/dashboard | FALLBACK使用 | FALLBACK_STATS, FALLBACK_REWARDS, FALLBACK_STAKE |
| GET /v1/prover/alerts | FALLBACK使用 | FALLBACK_ALERTS (Redis未統合) |
| GET /v1/prover/metrics | クラッシュ | FALLBACK_PERFORMANCE等 |
| GET /v1/prover/payout-history | undefined | (hookがundefined返却) |

### 未実装（100%Mock）

| 機能 | コンポーネント | API hook |
|:---|:---|:---|
| Exit申請 | ProverExit.tsx | なし（mockExitDataのみ） |
| 設定管理 | ProverSettings.tsx | なし（mockSettingsのみ） |
| チャレンジ対応 | ProverChallenge.tsx | なし（mockActiveChallengeのみ） |

---

## データソースマップ

```
ProverDashboard
  ├── useProverStats() → /v1/prover/stats → signing_queue COUNT/WHERE
  │   └── FALLBACK: pendingSignatures=12, urgentCount=3, todaysProcessed=487,
  │       processedChange=12, avgProcessed=420, responseTime=28.2
  ├── useSigningQueue() → /v1/prover/queue → signing_queue SELECT
  │   └── ✅ 実データ (0xe69b...cdc3, 0.01 ETH等)
  ├── useProverRewards() → /v1/prover/rewards
  │   └── FALLBACK: claimable=3.75 ETH
  └── useProverStake() → /v1/prover/stake
      └── FALLBACK: amount=100.0 QST

ProverQueue
  ├── useSigningQueue() → ✅ 実データ
  ├── useProverStats() → FALLBACK混在
  └── avgWait → ハードコード '4m 32s'

ProverMetrics → ❌ クラッシュ
  ├── useProverMetrics() → undefined
  ├── usePerformanceStats() → FALLBACK_PERFORMANCE
  ├── usePayoutHistory() → undefined (❌クラッシュ原因)
  └── chart data → ハードコード (mockChartData)

ProverAlerts
  ├── useProverAlerts() → FALLBACK_ALERTS
  └── useStakeData() → FALLBACK_STAKE_DATA

ProverExit → mockExitData (API hookなし)
ProverSettings → mockSettings (API hookなし)
ProverChallenge → mockActiveChallenge (API hookなし)
```

---

## 修正優先度

### P0（即座修正 — ページクラッシュ）
1. **P8-E1/E2**: Metrics ページクラッシュ修正（i18nキー + payoutHistory hook）

### P1（高優先度 — 誤情報表示）
2. **P6-W1**: Dashboard統計値のFALLBACK除去（KI-6）
3. **P9-E1**: Alerts i18n maintenance キー追加
4. **P1-W1**: Landing ネットワーク統計のAPI化

### P2（中優先度 — Mock画面のAPI統合）
5. **P11-W1**: Exit機能のAPI統合
6. **P10-W1**: Challenge機能のAPI統合
7. **P12-W1**: Settings機能のAPI統合
8. **P9-W1**: Alerts Redis API統合

### P3（低優先度 — 精度向上）
9. **P7-W1**: avgWait動的計算
10. **P7-W2**: SPHINCS+署名の実装
11. **P6-W2**: 報酬計算ロジック実装
