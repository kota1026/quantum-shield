# QS Hub - 全画面データトレーサビリティ検証結果

**検証日時:** 2026-02-07
**検証対象:** QS Hub全18画面（Governance + Token Hub統合）
**検証方法:** Playwright MCP snapshot + コンソールエラー確認 + ソースコード分析

---

## サマリー

| 指標 | 値 |
|:---|:---|
| 総画面数 | 18 |
| ✅ 正常 | 3 (faq, onboarding, help) |
| ⚠️ 警告 | 14 (大半がMOCK_DATAフォールバック) |
| ❌ クラッシュ | 1 (dashboard) |
| 🔒 100%Mock/FALLBACK | 14画面中12画面 |
| 静的ページ | 4 (faq, onboarding, help, get-qs) |

### 重大発見

1. **❌ Dashboard CRASH**: `rewards.usdValue.toLocaleString()` で undefined エラー (QSHubDashboard.tsx:503)
2. **⚠️ Login: ウォレット接続がシミュレーション**: setTimeout で偽遅延、実際のウォレット接続なし
3. **⚠️ 全15 hooks がサイレントにMOCK_DATAにフォールバック**: API失敗時にエラー表示なし
4. **⚠️ Token Hub統合**: next.config.ts で /token-hub/* → /qs-hub/* にリダイレクト済み
5. **⚠️ Governance統合**: next.config.ts で /governance/* → /qs-hub/* にリダイレクト済み

### 根本原因

**QS HubのuseQSHub.ts内の全15 hooksが try/catch で MOCK_DATA にサイレントフォールバックする。**
API未実装のため、全データ画面が常にMOCK_DATAを表示している。ユーザーはMockデータを本物と誤認するリスクあり。

---

## API Hooks一覧 (useQSHub.ts)

全hooksが以下パターン:
```
try { return await fetchApi(endpoint); }
catch { return MOCK_DATA; }  // ← サイレントフォールバック
```

| Hook | API Endpoint | MOCK定数 | 使用画面 |
|:---|:---|:---|:---|
| `useQSHubStats()` | /v1/qs-hub/dashboard/stats | MOCK_STATS | dashboard |
| `useQSHubProposals()` | /v1/qs-hub/proposals/active | MOCK_PROPOSALS | dashboard |
| `useQSHubRewards()` | /v1/qs-hub/rewards | MOCK_REWARDS | dashboard, rewards |
| `useQSHubDelegates()` | /v1/qs-hub/delegates | MOCK_DELEGATES | dashboard |
| `useProposalsList()` | /v1/qs-hub/proposals | MOCK_PROPOSALS_LIST | vote/proposals |
| `useProposalDetail()` | /v1/qs-hub/proposals/{id} | MOCK_PROPOSALS_LIST[0] | vote/proposals/[id] |
| `useCouncil()` | /v1/qs-hub/council | MOCK_COUNCIL | council |
| `useStakePositions()` | /v1/qs-hub/stakes | MOCK_STAKE_POSITIONS | stake/unlock, stake/extend |
| `useQSBalance()` | /v1/qs-hub/balance | MOCK_BALANCE (12450) | stake/lock |
| `useVoteHistory()` | /v1/qs-hub/votes/history | MOCK_VOTE_HISTORY | vote/history |
| `useCreateStake()` | POST /v1/qs-hub/stakes | — | stake/lock |
| `useExtendStake()` | POST /v1/qs-hub/stakes/{id}/extend | — | stake/extend |
| `useVote()` | POST /v1/qs-hub/proposals/{id}/vote | — | vote/proposals/[id] |
| `useClaimRewards()` | POST /v1/qs-hub/rewards/claim | — | rewards |

---

## 画面別検証結果

### QH1: /qs-hub/landing ⚠️

| # | 表示項目 | 表示値 | 項目種別 | ソース |
|:--|:---------|:------|:--------|:------|
| 1 | ページタイトル | QS Hub | 静的テキスト | i18n |
| 2 | Hero文 | QSトークンをロックしてガバナンス権を獲得 | 静的テキスト | i18n |
| 3 | 総ロック量 | **24.5M QS** | ⚠️ハードコード | FALLBACK_STATS.totalLocked |
| 4 | veQS保有者数 | **12,847** | ⚠️ハードコード | FALLBACK_STATS.veQSHolders |
| 5 | アクティブな提案 | **3** | ⚠️ハードコード | FALLBACK_STATS.activeProposals |
| 6 | 分配済み報酬 | **1.2M QS** | ⚠️ハードコード | FALLBACK_STATS.totalRewardsDistributed |
| 7 | 機能リスト | ステーク＆ロック / ガバナンス / 報酬獲得 | 静的テキスト | i18n |
| 8 | 使い方ステップ | 4ステップ | 静的テキスト | i18n |
| 9 | フィッシング警告 | 公式URL: https://app.quantumshield.io | 静的テキスト | ハードコード |
| 10 | フッター著作権 | © 2024 Quantum Shield | ⚠️ハードコード | **2024年** — 2026年であるべき |

**問題:** 統計4値すべてハードコード。API hookなし。著作権年が2024年。

---

### QH2: /qs-hub/login ⚠️

| # | 表示項目 | 表示値 | 項目種別 | ソース |
|:--|:---------|:------|:--------|:------|
| 1 | ページタイトル | QS Hubにログイン | 静的テキスト | i18n |
| 2 | ウォレットリスト | MetaMask / WalletConnect / Coinbase | 静的テキスト | ハードコード |
| 3 | QSロックリンク | → /qs-hub/stake/lock | ナビゲーション | ✅ |

**問題:** ウォレット接続がシミュレーション（setTimeout偽遅延）、実際のRainbowKit/wagmi接続なし。

---

### QH3: /qs-hub/onboarding ✅

| # | 表示項目 | 表示値 | 項目種別 | ソース |
|:--|:---------|:------|:--------|:------|
| 1 | ステップ1 | QSトークンを入手 | 静的テキスト | i18n |
| 2 | ステップ2 | トークンをロック | 静的テキスト | i18n |
| 3 | ステップ3 | ガバナンスに参加 | 静的テキスト | i18n |
| 4 | ステップ4 | 報酬を獲得 | 静的テキスト | i18n |
| 5 | GetQSリンク | → /qs-hub/get-qs | ナビゲーション | ✅ |

**評価:** ✅ 正常 — 教育コンテンツ、i18nのみ

---

### QH4: /qs-hub/dashboard ❌ CRASH

| # | 表示項目 | 表示値 | 項目種別 | ソース |
|:--|:---------|:------|:--------|:------|
| — | エラーダイアログ | Cannot read properties of undefined (reading 'toLocaleString') | ❌クラッシュ | QSHubDashboard.tsx:503 |

**クラッシュ原因:**
```typescript
// Line 503
badge={`$${rewards.usdValue.toLocaleString()}`}
// rewards.usdValue が undefined のため .toLocaleString() でクラッシュ
```

**根本原因:** `useQSHubRewards()` が MOCK_REWARDS を返すが、MOCK_REWARDS の構造が `rewards.usdValue` を含まない or undefinedを返す。

**修正案:** `rewards?.usdValue?.toLocaleString() ?? '0'` にオプショナルチェイニング追加

---

### QH5: /qs-hub/faq ✅

| # | 表示項目 | 表示値 | 項目種別 | ソース |
|:--|:---------|:------|:--------|:------|
| 1 | カテゴリ: 基本 | veQSとは / ロック理由 | 静的テキスト | i18n |
| 2 | カテゴリ: ステーキング | ロック方法 / ロック期間 / 早期引出 | 静的テキスト | i18n |
| 3 | カテゴリ: ガバナンス | 投票方法 / 委任 | 静的テキスト | i18n |
| 4 | カテゴリ: 報酬 | 計算方法 / 請求方法 | 静的テキスト | i18n |
| 5 | サポートリンク | → /consumer/contact | ナビゲーション | ⚠️ consumer側 |

**評価:** ✅ 正常（サポートリンクがconsumer側を指す点は軽微）

---

### QH6: /qs-hub/help ✅

| # | 表示項目 | 表示値 | 項目種別 | ソース |
|:--|:---------|:------|:--------|:------|
| 1 | クイックアクセス | ステーキング / 投票 / 報酬 / 設定 | 静的テキスト | i18n + ハードコードリンク |
| 2 | サポートリソース | FAQ / お問い合わせ | 静的テキスト | i18n |
| 3 | チュートリアルリンク | → /qs-hub/onboarding | ナビゲーション | ✅ |

**評価:** ✅ 正常

---

### QH7: /qs-hub/get-qs ⚠️

| # | 表示項目 | 表示値 | 項目種別 | ソース |
|:--|:---------|:------|:--------|:------|
| 1 | トークン情報 | Quantum Shield Token (QS) | 静的テキスト | i18n |
| 2 | DEX: Uniswap | → https://app.uniswap.org | ⚠️ハードコード | EXCHANGES定数 |
| 3 | DEX: Curve | → https://curve.fi | ⚠️ハードコード | EXCHANGES定数 |
| 4 | DEX: Balancer | → https://balancer.fi | ⚠️ハードコード | EXCHANGES定数 |
| 5 | 活動リスト | ステーキング / ガバナンス / リファラル | 静的テキスト | i18n |
| 6 | コントラクト検証 | コントラクト検証済み | 静的テキスト | i18n |

**問題:** DEXリンクがハードコード。API連携なし。

---

### QH8: /qs-hub/stake/lock ⚠️

| # | 表示項目 | 表示値 | 項目種別 | ソース |
|:--|:---------|:------|:--------|:------|
| 1 | 利用可能残高 | **0 QS** | 動的数値 | useQSBalance() → MOCK or 0 |
| 2 | ロック期間: 1W | ×0.005 | ⚠️ハードコード | 期間乗数テーブル |
| 3 | ロック期間: 1M | ×0.020 | ⚠️ハードコード | 期間乗数テーブル |
| 4 | ロック期間: 6M | ×0.13 | ⚠️ハードコード | 期間乗数テーブル |
| 5 | ロック期間: 1Y | ×0.25 | ⚠️ハードコード | 期間乗数テーブル |
| 6 | ロック期間: 2Y (デフォルト) | ×0.50 | ⚠️ハードコード | 期間乗数テーブル |
| 7 | ロック期間: 4Y | ×1.00 | ⚠️ハードコード | 期間乗数テーブル |
| 8 | 予想veQS | 0 veQS = 0 QS × 0.50 (2Y/4Y) | 動的計算 | クライアント計算 |
| 9 | 注意事項 | ロック期間終了まで引き出せません | 静的テキスト | i18n |

**SEQUENCES.md照合:**
- veQS = QS × (残日数/730日) → 画面の乗数テーブルは `QS × multiplier` 方式
- 4Y = ×1.00, 2Y = ×0.50 → SEQUENCES.md: 最大2年=1:1 → **不一致**: 画面は最大4年=1:1
- **⚠️ SEQUENCES.mdは最大2年ロックだが、画面は4年ロックを許可**

---

### QH9: /qs-hub/stake/unlock ⚠️🔒

| # | 表示項目 | 表示値 | 項目種別 | ソース |
|:--|:---------|:------|:--------|:------|
| 1 | 総ロック量 | **10,000 QS** | ⚠️Mock | FALLBACK_LOCKED_POSITIONS |
| 2 | 現在のveQS | **1,169 veQS** | ⚠️Mock | FALLBACK_LOCKED_POSITIONS |
| 3 | ポジション数 | **3** | ⚠️Mock | FALLBACK_LOCKED_POSITIONS |
| 4 | アンロック可能 | **5,000 QS** | ⚠️Mock | FALLBACK_LOCKED_POSITIONS |
| 5 | ポジション1: 5,000 QS | ロック中, Jan 15 2025 → Jan 15 2027, 341日, 53% | ⚠️Mock | FALLBACK |
| 6 | ポジション2: 3,000 QS | アンロック可能, Jun 1 2025 → Dec 1 2025, 準備完了 | ⚠️Mock | FALLBACK |
| 7 | ポジション3: 2,000 QS | アンロック可能, Jun 16 2024 → Jan 20 2025, 準備完了 | ⚠️Mock | FALLBACK |

**問題:** 全データMOCK_STAKE_POSITIONS。APIフォールバック。

---

### QH10: /qs-hub/rewards ⚠️🔒

| # | 表示項目 | 表示値 | 項目種別 | ソース |
|:--|:---------|:------|:--------|:------|
| 1 | 請求可能 | **0.85 ETH** | ⚠️Mock | FALLBACK_REWARDS |
| 2 | 未確定 | **0.32 ETH** | ⚠️Mock | FALLBACK_REWARDS |
| 3 | 次のエポック | **2d 14h** | ⚠️Mock | FALLBACK_REWARDS |
| 4 | 総請求済み | **12.45 ETH** | ⚠️Mock | FALLBACK_REWARDS |
| 5 | エポック | **Epoch 47** | ⚠️Mock | FALLBACK_REWARDS |
| 6 | 進捗 | **72%** | ⚠️Mock | FALLBACK_REWARDS |
| 7 | 履歴: プロトコル手数料 Epoch 47 | 0.25 ETH 請求可能 | ⚠️Mock | FALLBACK_HISTORY |
| 8 | 履歴: 投票報酬 Epoch 47 | 0.35 ETH 請求可能 | ⚠️Mock | FALLBACK_HISTORY |
| 9 | 履歴: ステーキングボーナス Epoch 47 | 0.25 ETH 請求可能 | ⚠️Mock | FALLBACK_HISTORY |
| 10 | 履歴: プロトコル手数料 Epoch 46 | 0.42 ETH 請求済み | ⚠️Mock | FALLBACK_HISTORY |
| 11 | Etherscanリンク | → https://etherscan.io/tx/0x1234...5678 | ⚠️Mock | ダミーTxHash |

**問題:** 全データMOCK。Etherscan txハッシュもダミー。

---

### QH11: /qs-hub/vote/proposals ⚠️🔒

| # | 表示項目 | 表示値 | 項目種別 | ソース |
|:--|:---------|:------|:--------|:------|
| 1 | 総提案数 | **5** | ⚠️Mock | MOCK_PROPOSALS_LIST |
| 2 | 投票中 | **2** | ⚠️Mock | 計算値 |
| 3 | 可決済み | **1** | ⚠️Mock | 計算値 |
| 4 | 参加率 | **76%** | ⚠️Mock | MOCK_PROPOSALS_LIST |
| 5 | QIP-047: Increase Observer Rewards by 15% | 投票中, 賛成67% 反対23% | ⚠️Mock | MOCK_PROPOSALS_LIST[0] |
| 6 | QIP-046: Add Support for Polygon zkEVM | 投票中, 賛成82% 反対12% | ⚠️Mock | MOCK_PROPOSALS_LIST[1] |
| 7 | QIP-045: Treasury Diversification Strategy | 投票待ち | ⚠️Mock | MOCK_PROPOSALS_LIST[2] |
| 8 | QIP-044: Reduce Lock Period Minimum to 1 Week | 可決 | ⚠️Mock | MOCK_PROPOSALS_LIST[3] |
| 9 | QIP-043: Emergency Council Expansion | 否決 | ⚠️Mock | MOCK_PROPOSALS_LIST[4] |
| 10 | 提案タイトル言語 | **英語** | ⚠️ | i18n非対応のハードコード英語 |

**問題:** 全データMOCK。提案タイトルが英語ハードコード。

---

### QH12-QH18: コード分析のみ（スナップショット未取得）

| ID | 画面 | データソース | 主要問題 |
|:---|:-----|:-----------|:--------|
| QH12 | /qs-hub/stake/extend | FALLBACK_CURRENT_LOCK | 全データMock |
| QH13 | /qs-hub/vote/proposals/[id] | FALLBACK_PROPOSAL | 100%ハードコード、API hook未使用 |
| QH14 | /qs-hub/vote/proposals/create | ハードコード | ユーザーveQS balance ハードコード |
| QH15 | /qs-hub/vote/delegates | FALLBACK_DELEGATES | 100%ハードコード、API hook未使用 |
| QH16 | /qs-hub/vote/history | FALLBACK_VOTE_HISTORY | 100%ハードコード |
| QH17 | /qs-hub/council | MOCK_COUNCIL + useCouncil() | API hookあり、FALLBACKパターン |
| QH18 | /qs-hub/settings | FALLBACK_USER | 設定保存がシミュレーション(setTimeout) |

---

## 課題一覧（深刻度順）

| # | 深刻度 | 画面 | 課題 | 原因 | 対策 |
|:--|:------:|:-----|:-----|:-----|:-----|
| 1 | 🔴 | dashboard | CRASH: rewards.usdValue.toLocaleString() | undefined値にメソッド呼出 | `?.toLocaleString() ?? '0'` |
| 2 | 🔴 | login | ウォレット接続がシミュレーション | setTimeout偽遅延 | RainbowKit/wagmi実装 |
| 3 | 🔴 | 全画面 | 全15 hooksがサイレントMOCKフォールバック | try/catch → MOCK_DATA | エラー表示 or ローディング状態表示 |
| 4 | ⚠️ | stake/lock | veQSロック最大4年 vs SEQUENCES.md最大2年 | 仕様不一致 | SEQUENCES.md準拠に修正 or SEQUENCES.md更新 |
| 5 | ⚠️ | landing | 統計4値ハードコード (24.5M, 12847, 3, 1.2M) | API hookなし | useQSHubStats()連携 |
| 6 | ⚠️ | rewards | Etherscan txハッシュがダミー | MOCK_HISTORY | API連携で実txハッシュ |
| 7 | ⚠️ | vote/proposals | 提案タイトルが英語ハードコード | MOCK_DATA | API連携 or i18n化 |
| 8 | ⚠️ | 複数 | サポートリンクが/consumer/contact | QS Hub専用なし | 統一contactページ |
| 9 | ⚠️ | 複数 | フッター著作権 "© 2024" | ハードコード | 2026に更新 or 動的取得 |
| 10 | ⚠️ | vote/proposals/[id] | 100%ハードコード、useProposalDetail()未使用 | コンポーネント未連携 | hook接続 |
| 11 | ⚠️ | vote/delegates | 100%ハードコード | API hookなし | useQSHubDelegates()連携 |
| 12 | ⚠️ | settings | 設定保存がシミュレーション | setTimeout偽save | API mutation実装 |

---

## SEQUENCES.md照合

### veQS (Token Hub) シーケンス

| パラメータ | SEQUENCES.md定義 | QS Hub画面表示 | 一致 |
|:---|:---|:---|:---|
| veQS計算式 | QS × (残日数/730日) | QS × multiplier (期間別) | ⚠️ 方式は異なるが等価 |
| 最大ロック期間 | **2年 (730日)** | **4年** | ❌ 不一致 |
| 最大veQS倍率 | 1:1 (2年ロック) | 1:1 (4年ロック) | ❌ 不一致 |
| 2年ロック倍率 | 1.00 | **0.50** | ❌ 不一致 |
| veQS減衰 | 線形（ロック終了時0） | 未表示 | ⚠️ 未検証 |

**重大不一致:** SEQUENCES.mdでは最大ロック2年=1:1だが、QS Hubは最大4年=1:1で、2年は0.50倍。仕様書とコードで最大ロック期間が異なる。

### Governance Proposal シーケンス

QS Hub vote/proposals/create ≒ Governance create（リダイレクト元）のため、Governance検証の結果を参照。

| パラメータ | SEQUENCES.md | QS Hub | 一致 |
|:---|:---|:---|:---|
| parameter定足数 | 4% | (create画面で検証) | → Governance検証参照 |
| タイムロック | 7日 | (create画面で検証) | → Governance検証参照 |

---

## Governance/Token Hub → QS Hub リダイレクト一覧

### next.config.ts (lines 61-157)

```
Token Hub → QS Hub:
  /:locale/token-hub            → /:locale/qs-hub/dashboard
  /:locale/token-hub/dashboard  → /:locale/qs-hub/dashboard
  /:locale/token-hub/lock       → /:locale/qs-hub/stake/lock
  /:locale/token-hub/unlock     → /:locale/qs-hub/stake/unlock
  /:locale/token-hub/delegate   → /:locale/qs-hub/vote/delegates
  /:locale/token-hub/rewards    → /:locale/qs-hub/dashboard

Governance → QS Hub:
  /ja/governance                → /ja/qs-hub/dashboard
  /ja/governance/landing        → /ja/qs-hub/dashboard
  /ja/governance/dashboard      → /ja/qs-hub/dashboard
  /ja/governance/proposals      → /ja/qs-hub/vote/proposals
  /ja/governance/proposals/:id  → /ja/qs-hub/vote/proposals/:id
  /ja/governance/council        → /ja/qs-hub/council
```

**注意:** Token Hubのリダイレクトは `/:locale/` パターンで全ロケール対応。Governanceは `/ja/` `/en/` 固定。

---

## データソースマップ

```
QS Hub画面 (18ページ)
├── 静的ページ (API不要)
│   ├── onboarding ← i18n (教育)
│   ├── faq ← i18n (FAQ)
│   ├── help ← i18n + ハードコードリンク
│   └── get-qs ← i18n + ハードコードDEXリスト
│
├── 認証不要 (API呼出あるがMOCKフォールバック)
│   ├── landing ← FALLBACK_STATS (ハードコード統計)
│   └── login ← シミュレーテッドウォレット接続
│
├── 認証必要 (全てMOCKフォールバック)
│   ├── dashboard ← ❌ CRASH (rewards.usdValue undefined)
│   ├── stake/lock ← useQSBalance() → MOCK_BALANCE
│   ├── stake/unlock ← useStakePositions() → MOCK_STAKE_POSITIONS
│   ├── stake/extend ← useStakePositions() → FALLBACK_CURRENT_LOCK
│   ├── rewards ← useQSHubRewards() → MOCK_REWARDS
│   ├── vote/proposals ← useProposalsList() → MOCK_PROPOSALS_LIST
│   ├── vote/proposals/[id] ← FALLBACK (100%ハードコード)
│   ├── vote/proposals/create ← ハードコード (ユーザーveQS等)
│   ├── vote/delegates ← FALLBACK (100%ハードコード)
│   ├── vote/history ← FALLBACK (100%ハードコード)
│   ├── council ← useCouncil() → MOCK_COUNCIL
│   └── settings ← FALLBACK_USER + シミュレーテッド保存
```
