# Governance - 全画面データトレーサビリティ検証結果

**検証日時:** 2026-02-07
**検証対象:** Governance全11画面（うち5画面はQS Hubにリダイレクト）
**検証方法:** Playwright MCP snapshot + Chrome MCP snapshot + コンソールエラー確認 + ソースコード分析

---

## サマリー

| 指標 | 値 |
|:---|:---|
| 総画面数 | 11 |
| ✅ 正常 | 3 (login, faq, onboarding) |
| ⚠️ 警告 | 3 (create, history, settings) |
| ❌ エラー | 0 |
| 🔒 100%Mock | 1 (history/MyActivity) |
| ⚠️ ハードコード | 2 (create, settings) |
| 🔄 QS Hubリダイレクト | 5 (landing, dashboard, proposals, proposals/[id], council) |

### 重大発見: GovernanceはQS Hubに統合済み

**`next.config.ts` (lines 61-157) でGovernance→QS Hubの永続リダイレクトが設定されている。**

| Governance URL | リダイレクト先 | 設定 |
|:---|:---|:---|
| `/governance/landing` | `/qs-hub/dashboard` | permanent: true |
| `/governance/dashboard` | `/qs-hub/dashboard` | permanent: true |
| `/governance/proposals` | `/qs-hub/vote/proposals` | permanent: true |
| `/governance/proposals/:id` | `/qs-hub/vote/proposals/:id` | permanent: true |
| `/governance/council` | `/qs-hub/council` | permanent: true |

Token Hubも同様にQS Hubにリダイレクト:

| Token Hub URL | リダイレクト先 |
|:---|:---|
| `/token-hub/dashboard` | `/qs-hub/dashboard` |
| `/token-hub/lock` | `/qs-hub/stake/lock` |
| `/token-hub/unlock` | `/qs-hub/stake/unlock` |
| `/token-hub/delegate` | `/qs-hub/vote/delegates` |
| `/token-hub/rewards` | `/qs-hub/dashboard` |

→ **リダイレクト先のQS Hub画面はQS Hub検証で詳細確認**

### 根本原因

**Governance機能はQS Hubに統合されたが、旧Governance画面のコードは残存している。**

- 5画面はnext.config.tsのリダイレクトでアクセス不可（→QS Hub側で検証）
- 残り6画面（login, onboarding, faq, create, history, settings）は直接アクセス可能
- 認証要画面（create, history, settings）はウォレット接続が必要

---

## API Hooks一覧 (useGovernance.ts)

| Hook | API Endpoint | 使用元 | 状態 |
|:---|:---|:---|:---|
| `useGovernanceStats()` | GET /v1/governance/dashboard | GovernanceDashboard | ✅ 使用中 |
| `useVotingPower()` | GET /v1/governance/voting-power | GovernanceDashboard | ✅ 使用中 |
| `useDashboardProposals()` | GET /v1/governance/proposals?limit=3 | GovernanceDashboard | ✅ 使用中 |
| `useProposals(params)` | GET /v1/governance/proposals | ProposalsList | ✅ 使用中 |
| `useProposal(id)` | GET /v1/governance/proposals/:id | ProposalDetail | ❌ **未使用** |
| `useCouncil()` | GET /v1/governance/council | Council | ✅ 使用中 |
| `useGovernanceActivity()` | GET /v1/governance/activity | MyActivity | ❌ **未使用** |
| `useUserVote(id)` | GET /v1/governance/proposals/:id/vote | — | ❌ **未使用** |
| `useSubmitVote()` | POST /v1/governance/proposals/:id/vote | — | ❌ **未使用** |
| `useCreateProposal()` | POST /v1/governance/proposals | CreateProposal | ⚠️ Hook存在・使用不明 |

**⚠️ 問題: 4つのhookが定義されているが未使用（ProposalDetail, MyActivity）**

---

## 画面別検証結果

### G1: /governance/login ✅

| # | 表示項目 | 表示値（実際） | 項目種別 | ソース |
|:--|:---------|:-------------|:--------|:------|
| 1 | ページタイトル | ガバナンスにログイン | 静的テキスト | i18n |
| 2 | 説明文 | ウォレットを接続して提案に投票し... | 静的テキスト | i18n |
| 3 | ウォレットリスト | MetaMask / WalletConnect / Coinbase | 静的テキスト | WALLET_OPTIONS定数 |
| 4 | ウォレット作成リンク | → https://metamask.io/ | ナビゲーション | ハードコードURL |
| 5 | オンボーディングリンク | → /governance/onboarding | ナビゲーション | ✅ |

**データソース:** 100% i18n + RainbowKit (wagmi) wallet integration
**評価:** ✅ 正常 — 静的ログインページ、ウォレット接続は実動作

---

### G2: /governance/onboarding ✅

| # | 表示項目 | 表示値（実際） | 項目種別 | ソース |
|:--|:---------|:-------------|:--------|:------|
| 1 | ページタイトル | ガバナンスを学ぶ | 静的テキスト | i18n |
| 2 | ガバナンスとは？ | プロトコル運営方針をコミュニティで決める仕組み | 静的テキスト | i18n |
| 3 | 参加ステップ | 3ステップ（QS入手→ロック→投票） | 静的テキスト | i18n |
| 4 | veQS計算式 | veQS = QS × (残り日数 / 730日) | 静的テキスト | i18n |
| 5 | 最大2年ロック | 1 QS = 1 veQS | 静的テキスト | i18n |
| 6 | QSロックリンク | → /qs-hub/stake/lock | ナビゲーション | ✅ QS Hub統合済み |
| 7 | 提案を見るリンク | → /governance/proposals | ナビゲーション | ⚠️ リダイレクト対象 |

**データソース:** 100% i18n（教育コンテンツ）
**評価:** ✅ 正常 — 静的教育ページ
**SEQUENCES準拠:** veQS計算式 `QS × (残り日数 / 730日)` はSEQUENCES.md準拠 ✅

---

### G3: /governance/faq ✅

| # | 表示項目 | 表示値（実際） | 項目種別 | ソース |
|:--|:---------|:-------------|:--------|:------|
| 1 | ページタイトル | よくある質問 | 静的テキスト | i18n |
| 2 | カテゴリ: 基本 | ガバナンスとは？ / 参加可否 / コスト | 静的テキスト | i18n |
| 3 | カテゴリ: 投票 | 投票方法 / 投票期間 / 定足数 | 静的テキスト | i18n |
| 4 | カテゴリ: veQS | 計算方法 / 時間減少 | 静的テキスト | i18n |
| 5 | カテゴリ: 評議会 | セキュリティ評議会 / 拒否権 | 静的テキスト | i18n |
| 6 | カテゴリ: 委任 | 委任とは / 解除可否 | 静的テキスト | i18n |
| 7 | お問い合わせリンク | → /consumer/contact | ナビゲーション | ⚠️ consumer側のcontact |

**データソース:** 100% i18n（FAQ用）
**評価:** ✅ 正常 — 静的FAQ、全テキストi18n管理
**注意:** お問い合わせリンクが`/consumer/contact`を指している（Governance専用のcontactではない）

---

### G4: /governance/create ⚠️

| # | 表示項目 | 表示値（実際） | 項目種別 | ソース |
|:--|:---------|:-------------|:--------|:------|
| 1 | ページタイトル | 提案作成 | 静的テキスト | i18n |
| 2 | 説明文 | 新しいガバナンス提案をコミュニティ投票に提出 | 静的テキスト | i18n |
| 3 | パラメータ変更 定足数 | **4%** | ⚠️ハードコード | quorumMap定数 L151 |
| 4 | コントラクトアップグレード 定足数 | **8%** | ⚠️ハードコード | quorumMap定数 L153 |
| 5 | シグナル提案 定足数 | **3%** | ⚠️ハードコード | quorumMap定数 L155 |
| 6 | 最低veQS要件 | **10,000 veQS** | ⚠️ハードコード | minVeqs定数 L147 |
| 7 | ユーザーveQS残高 | **125,000 veQS** | ⚠️ハードコード | userVeqs定数 L148 |
| 8 | タイムロック説明 | 7日間 | 静的テキスト | i18n |
| 9 | キャンセルリンク | → /governance/landing | ナビゲーション | ⚠️ リダイレクト対象 |

**データソース:** i18n + ハードコード定数
**評価:** ⚠️ 警告

**問題一覧:**

| ID | 問題 | 深刻度 | 詳細 |
|:---|:-----|:------:|:-----|
| G4-W1 | 定足数% ハードコード | ⚠️ | 4%/8%/3%がquorumMap定数。SEQUENCES.md: parameter=4%, upgrade=8%, signal=3% → **値自体は正しい** |
| G4-W2 | ユーザーveQS残高 ハードコード | ⚠️ | `125,000 veQS`は実際のウォレット残高ではなくコード内定数 |
| G4-W3 | minVeqs ハードコード | ⚠️ | `10,000 veQS`はコントラクトパラメータから取得すべき |
| G4-W4 | 提案IDハードコード | ⚠️ | 成功時に`QIP-48`を返す — API応答ではなくハードコード |
| G4-N1 | キャンセル→/governance/landing | ⚠️ | リダイレクト対象URL（→QS Hub dashboard） |

**SEQUENCES.md照合:**
- parameter定足数 4% → ✅ 一致
- upgrade定足数 8% → ✅ 一致
- signal定足数 3% → ✅ 一致
- emergency定足数 15% → ⚠️ **画面に表示なし**（emergency提案タイプが選択肢にない）
- treasury定足数 → ⚠️ **画面に表示なし**（treasury提案タイプが選択肢にない）

**注意:** SEQUENCES.mdでは5つの提案タイプ（parameter, treasury, upgrade, signal, emergency）があるが、画面には3つ（parameter, upgrade, signal）しか表示されていない。`treasury`と`emergency`が欠落。

---

### G5: /governance/history (MyActivity) ⚠️🔒

| # | 表示項目 | 表示値（実際） | 項目種別 | ソース |
|:--|:---------|:-------------|:--------|:------|
| 1 | ページタイトル | マイアクティビティ | 静的テキスト | i18n |
| 2 | 投票総数 | (値不表示・バグ?) | 動的数値 | ❌ハードコード stats.totalVotes=42 |
| 3 | 参加率 | **89%** | ⚠️ハードコード | stats.participationRate=89 |
| 4 | 作成した提案 | (値不表示) | 動的数値 | ❌ハードコード stats.proposalsCreated=3 |
| 5 | 委任受領数 | (値不表示) | 動的数値 | ❌ハードコード stats.delegationsReceived=3 |
| 6 | 投票履歴タブ: QIP-47 | Increase Prover Bond... | ⚠️ハードコード | voteHistory[0] |
| 7 | 投票履歴: 125,000 veQS | 125,000 veQS | ⚠️ハードコード | voteHistory[0].power |
| 8 | 投票履歴タブ: QIP-45 | Upgrade STARK Verifier... | ⚠️ハードコード | voteHistory[1] |
| 9 | 投票履歴タブ: QIP-44 | Reduce Challenge Period... | ⚠️ハードコード | voteHistory[2] |
| 10 | 投票履歴タブ: QIP-40 | Decrease Minimum Lock... | ⚠️ハードコード | voteHistory[3] |
| 11 | 投票履歴タブ: QIP-38 | Add Emergency Pause... | ⚠️ハードコード | voteHistory[4] |
| 12 | 作成提案タブ: QIP-35 | Implement Quarterly Security... | ⚠️ハードコード | myProposals[0] |
| 13 | 作成提案タブ: QIP-28 | Add Dilithium Signature... | ⚠️ハードコード | myProposals[1] |
| 14 | 作成提案タブ: QIP-22 | Increase Validator Rewards... | ⚠️ハードコード | myProposals[2] |
| 15 | 委任タブ: 0x456...789 | 12,500 veQS | ⚠️ハードコード | delegations[0] |
| 16 | 委任タブ: 0x789...abc | 8,000 veQS | ⚠️ハードコード | delegations[1] |
| 17 | 委任タブ: 0xdef...123 | 4,500 veQS | ⚠️ハードコード | delegations[2] |

**データソース:** 100%ハードコード（API hook `useGovernanceActivity()` が存在するが未使用）
**評価:** ⚠️🔒 100%Mock — 全データがコンポーネント内ハードコード

**問題一覧:**

| ID | 問題 | 深刻度 | 詳細 |
|:---|:-----|:------:|:-----|
| G5-C1 | 全データ100%ハードコード | 🔴 | 投票履歴5件、提案3件、委任3件すべてハードコード |
| G5-C2 | API hook未使用 | 🔴 | `useGovernanceActivity()` hookが存在するがコンポーネントで未import |
| G5-C3 | 提案タイトルが英語 | ⚠️ | "Increase Prover Bond..."等、i18n非対応のハードコード英語 |
| G5-C4 | 投票総数が表示欠落 | ⚠️ | スナップショット上で`投票総数`の数値が見えない |

---

### G6: /governance/settings ⚠️

| # | 表示項目 | 表示値（実際） | 項目種別 | ソース |
|:--|:---------|:-------------|:--------|:------|
| 1 | ページタイトル | 設定 | 静的テキスト | i18n |
| 2 | 接続中のウォレット | **0x7a3f...9c2d** | ⚠️ハードコード | 定数 L31 |
| 3 | 投票履歴ボタン | 過去の投票を確認 | 静的テキスト | i18n |
| 4 | 委任管理ボタン | 投票権の委任状況を確認 | 静的テキスト | i18n |
| 5 | プッシュ通知トグル | (ON/OFF) | ローカルState | useState(true) |
| 6 | メール通知トグル | (ON/OFF) | ローカルState | useState(false) |
| 7 | 新規提案通知トグル | (ON/OFF) | ローカルState | — |
| 8 | 投票リマインダートグル | (ON/OFF) | ローカルState | — |
| 9 | 委任通知トグル | (ON/OFF) | ローカルState | — |
| 10 | ダークモードトグル | (ON/OFF) | ローカルState | useState(true) |
| 11 | 言語 | 日本語 | ローカルState | useState('日本語') |
| 12 | 通貨表示 | JPY (¥) | ローカルState | useState('JPY (¥)') |
| 13 | アプリバージョン | **v1.0.0 (Build 2026.01.16)** | ⚠️ハードコード | 定数 VERSION/BUILD |
| 14 | 「ダッシュボードに戻る」リンク | → /governance/landing | ナビゲーション | ⚠️ リダイレクト対象 |

**データソース:** i18n + ハードコード定数 + ローカルState（非永続化）
**評価:** ⚠️ 警告

**問題一覧:**

| ID | 問題 | 深刻度 | 詳細 |
|:---|:-----|:------:|:-----|
| G6-W1 | ウォレットアドレスがハードコード | ⚠️ | `0x7a3f...9c2d`は実ウォレットではなくフォールバック値。useAccount()で取得すべき |
| G6-W2 | 設定が非永続化 | ⚠️ | 全トグル/選択がuseStateのみ — リロードでリセット |
| G6-W3 | バージョン/ビルドハードコード | 低 | `v1.0.0 (Build 2026.01.16)` — 環境変数から取得すべき |
| G6-N1 | 「ダッシュボードに戻る」→リダイレクト | ⚠️ | /governance/landingはQS Hub dashboardにリダイレクト |

---

### G7-G11: QS Hubリダイレクト画面 🔄

以下の5画面は `next.config.ts` の永続リダイレクトによりGovernance URLではアクセス不可。QS Hub側で検証。

| ID | Governance URL | リダイレクト先 | 検証先 |
|:---|:---|:---|:---|
| G7 | /governance/landing | /qs-hub/dashboard | → QS Hub検証 |
| G8 | /governance/dashboard | /qs-hub/dashboard | → QS Hub検証 |
| G9 | /governance/proposals | /qs-hub/vote/proposals | → QS Hub検証 |
| G10 | /governance/proposals/[id] | /qs-hub/vote/proposals/[id] | → QS Hub検証 |
| G11 | /governance/council | /qs-hub/council | → QS Hub検証 |

**元Governanceコンポーネントのコード分析結果:**

#### GovernanceDashboard (リダイレクト先: QS Hub Dashboard)
- API hooks: `useGovernanceStats()`, `useVotingPower()`, `useDashboardProposals()` — 3つ使用
- FALLBACK_STATS: activeProposals=5, votingPower=125000, participationRate=78, totalProposals=47
- ⚠️ アクティビティ欄はハードコード日本語テキスト
- ⚠️ 評議会ステータス(5/7, 3/3)もハードコード

#### ProposalsList (リダイレクト先: QS Hub vote/proposals)
- API hooks: `useProposals(params)` — 使用
- FALLBACK_PROPOSALS: QIP-47等のフォールバック配列
- ✅ フィルタリング・ページネーション実装

#### ProposalDetail (リダイレクト先: QS Hub vote/proposals/[id])
- API hooks: ❌ **未使用** — `useProposal(id)` hookが存在するが使っていない
- 100%ハードコードmock: `useMemo`で偽データ生成
- 投票モーダルもmock — 実際の投票送信なし

#### Council (リダイレクト先: QS Hub council)
- API hooks: `useCouncil()` — 使用
- FALLBACK_COUNCIL: 7名セキュリティ評議会 + 3名目的委員会のフォールバック
- ✅ 適切なAPI+FALLBACKパターン

#### GovernanceLanding (リダイレクト先: QS Hub Dashboard)
- API hooks: ❌ なし
- ⚠️ 統計ハードコード: activeProposals=5, participationRate=78%, totalProposals=47
- `useGovernanceStats()` を使うべきだが未使用

---

## 課題一覧（深刻度順）

| # | 深刻度 | 画面 | 課題ID | 課題 | 原因 | 対策 |
|:--|:------:|:-----|:-------|:-----|:-----|:-----|
| 1 | 🔴 | history | G5-C1 | 全データ100%ハードコード | API hook未使用 | `useGovernanceActivity()` hookをimport・使用 |
| 2 | 🔴 | history | G5-C2 | `useGovernanceActivity()` hook定義済み・未使用 | コンポーネント未連携 | hookをimportしてデータ取得 |
| 3 | 🔴 | proposalDetail* | — | 100%ハードコードmock・API hook未使用 | `useProposal(id)` 未使用 | hookを接続（※QS Hub側で検証） |
| 4 | ⚠️ | create | G4-W2 | ユーザーveQS残高ハードコード (125,000) | wallet/API未連携 | useAccount() + useVotingPower()連携 |
| 5 | ⚠️ | create | G4-N1 | treasury/emergency提案タイプ欠落 | 画面に3タイプのみ | 5タイプすべて表示 |
| 6 | ⚠️ | settings | G6-W1 | ウォレットアドレスハードコード | useAccount()未使用 | wagmi useAccount()から取得 |
| 7 | ⚠️ | settings | G6-W2 | 設定が非永続化 | useStateのみ | localStorage/バックエンドに保存 |
| 8 | ⚠️ | history | G5-C3 | 提案タイトルが英語ハードコード | i18n未対応 | APIデータ使用でi18n不要化 |
| 9 | ⚠️ | 複数 | — | リダイレクト先URLの不整合 | /governance/landingがリダイレクト対象 | 内部リンクをQS Hub URLに更新 |
| 10 | 低 | faq | — | お問い合わせが/consumer/contact | Governance専用なし | Governance用contactページ or 汎用化 |

---

## SEQUENCES.md照合

### Governance Proposal シーケンス

| パラメータ | SEQUENCES.md定義 | 画面表示 | 一致 |
|:---|:---|:---|:---|
| parameter定足数 | 4% | 4% (create画面) | ✅ |
| treasury定足数 | 6% | **表示なし** | ❌ treasury提案タイプ欠落 |
| upgrade定足数 | 8% | 8% (create画面) | ✅ |
| signal定足数 | 3% | 3% (create画面) | ✅ |
| emergency定足数 | 15% | **表示なし** | ❌ emergency提案タイプ欠落 |
| タイムロック期間 | 7日 | 7日間 (create画面フッター) | ✅ |
| 評議会拒否権 | あり | あり (create画面フッター) | ✅ |
| veQS計算式 | QS × (残日数/730) | QS × (残り日数/730日) (onboarding) | ✅ |
| 最大ロック期間 | 2年 (730日) | 最大2年ロック (onboarding) | ✅ |

**不一致:** create画面でtreasury(6%)とemergency(15%)の提案タイプが選択肢に含まれていない

---

## データソースマップ

```
Governance画面
├── login ← RainbowKit (wagmi) wallet connection
├── onboarding ← 100% i18n (静的教育コンテンツ)
├── faq ← 100% i18n (静的FAQ)
├── create ← i18n + ハードコード定数 (quorum%, veQS balance)
│   └── useCreateProposal() mutation available (未確認)
├── history ← 100%ハードコード (useGovernanceActivity() hook未使用)
├── settings ← i18n + ハードコード (wallet, version, settings)
│
├── [リダイレクト] dashboard → QS Hub Dashboard
│   └── useGovernanceStats() + useVotingPower() + useDashboardProposals()
│   └── FALLBACK_STATS使用
├── [リダイレクト] proposals → QS Hub vote/proposals
│   └── useProposals() + FALLBACK_PROPOSALS
├── [リダイレクト] proposals/[id] → QS Hub vote/proposals/[id]
│   └── ❌ useProposal(id) 未使用・100%ハードコード
├── [リダイレクト] council → QS Hub council
│   └── useCouncil() + FALLBACK_COUNCIL
└── [リダイレクト] landing → QS Hub Dashboard
    └── ❌ useGovernanceStats() 未使用・統計ハードコード
```
