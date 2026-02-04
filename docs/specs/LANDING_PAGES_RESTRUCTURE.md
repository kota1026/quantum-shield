# ランディングページ再構成ガイド

> **目的**: エコシステムと各アプリLPの役割を明確化し、統一感のある構成に整理する
> **作成日**: 2026-01-22
> **ステータス**: ✅ 分析完了 → 再構成待ち

---

## 目次

1. [背景・課題](#1-背景課題)
2. [現状分析](#2-現状分析)
3. [再構成方針](#3-再構成方針)
4. [各ページの役割定義](#4-各ページの役割定義)
5. [修正計画](#5-修正計画)
6. [実施状況](#6-実施状況)

---

## 1. 背景・課題

### 1.1 経緯

- 各アプリのランディングページは個別に、つぎはぎ的に作成された
- エコシステムページは後から追加された
- 結果として全体の統一感や役割分担が曖昧になっている

### 1.2 解決したい課題

| # | 課題 | 影響 |
|:-:|------|------|
| 1 | 重複コンテンツ | 同じ説明が複数ページにあり、メンテナンス負荷 |
| 2 | 役割の曖昧さ | ユーザーがどこから入るべきか分からない |
| 3 | ナビゲーション不統一 | アプリ間の移動方法がバラバラ |
| 4 | 導線の不明確さ | Ecosystem → App LP → Onboarding の流れが整理されていない |

---

## 2. 現状分析

### 2.1 ページ一覧

| ページ | URL | 主要コンテンツ | 分析状況 | 課題レベル |
|--------|-----|----------------|:--------:|:----------:|
| Ecosystem | `/ecosystem` | 全体概要、アプリ一覧 | ✅ | 低 |
| Ecosystem Technical | `/ecosystem/technical` | 技術詳細 | ⬜ | - |
| Consumer Landing | `/consumer/landing` | Consumer App詳細 | ✅ | 中 |
| Token Hub Landing | `/token-hub/landing` | Token Hub詳細 | ✅ | 低 |
| Governance Landing | `/governance/landing` | ⚠️ ダッシュボード表示 | ✅ | **高** |
| Prover Landing | `/prover/landing` | Prover Portal詳細 | ✅ | 低 |
| Observer Landing | `/observer/landing` | Observer詳細 | ✅ | 低 |
| Explorer Landing | `/explorer/landing` | Explorer詳細 | ✅ | 低 |
| Enterprise Landing | `/enterprise/landing` | Enterprise詳細 | ✅ | 中 |

### 2.2 Ecosystem ページ分析

**URL**: `/ecosystem`
**ファイル**: `src/components/ecosystem/EcosystemLanding.tsx`

**現状のコンテンツ構成**:
- [x] ヘッダー（ロゴ、言語切替、「始める」CTA）
- [x] ヒーロー（バッジ、タイトル、説明、CTA）
- [x] About（「守る、という新しい資産運用」Lock/Protect/Unlock）
- [x] アプリ一覧（3カテゴリ: 一般ユーザー向け/参加者向け/法人向け）
- [x] ユースケース別おすすめ（4パターン）
- [x] FAQ（5項目）
- [x] フッター（外部リンク、法的リンク）

**含まれている要素**:
```
カテゴリ別アプリ:
├── 一般ユーザー向け (consumer)
│   ├── Consumer App
│   ├── Token Hub
│   ├── Governance
│   └── Explorer
├── 参加者向け (participant)
│   ├── Prover Portal
│   └── Observer Portal
└── 法人向け (enterprise)
    └── Enterprise
```

**問題点**:
```
- 軽微: SkipLinkが英語のみ ("Skip to main content")
- 良好: i18n対応済み、EcosystemLinkは不要（自身がポータル）
```

### 2.3 Consumer Landing 分析

**URL**: `/consumer/landing`
**ファイル**: `src/components/consumer/Landing/index.tsx` (~845行)

**現状のコンテンツ構成**:
- [x] ヘッダー（ロゴ、ナビ、EcosystemLink、言語切替、CTA）
- [x] ヒーロー（バッジ、タイトル、説明、CTA）
- [x] 統計セクション（保護資産、ロック数、Prover数、Observer数）
- [x] 機能紹介（Features: 4機能）
- [x] 使い方（How It Works: 3ステップ）
- [x] 専門家の声（Expert Quotes: 3人）
- [x] CTA
- [x] フッター

**EcosystemLinkの有無**: ✅ あり（ヘッダー line 75）

**問題点**:
```
1. [中] ハードコード日本語 line 264: <span>24</span>時間
2. [中] ハードコード日本語 line 635: learnMoreLabel = '詳細を見る'
3. [軽] SkipLinkが英語のみ (line 48)
4. [軽] 一部でLink (next/link) を使用、I18nLinkではない
```

### 2.4 Token Hub Landing 分析

**URL**: `/token-hub/landing`
**ファイル**: `src/components/token-hub/Landing/index.tsx` (~280行)

**現状のコンテンツ構成**:
- [x] ヘッダー（ロゴ、EcosystemLink、言語切替、CTA）
- [x] ヒーロー（バッジ、タイトル、説明、CTA）
- [x] 統計セクション（TVL、ロック数、平均APY、平均ロック期間）
- [x] 機能紹介（Features: 3機能）
- [x] 使い方（How It Works: 3ステップ）
- [x] メリット（Benefits: 4項目）
- [x] veQSセクション（ガバナンス参加説明）
- [x] CTA
- [x] フッター

**EcosystemLinkの有無**: ✅ あり（ヘッダー line 116）

**問題点**:
```
- 良好: i18n対応済み
- 良好: 構成が整っている
```

### 2.5 Governance Landing 分析

**URL**: `/governance/landing`
**ファイル**: `src/app/[locale]/governance/landing/page.tsx` → `GovernanceDashboard.tsx` (~614行)

**⚠️ 重大な問題: ランディングページではなくダッシュボードを表示**

**現状のコンテンツ構成**（実際はダッシュボード）:
- [x] ヘッダー（GovernanceHeader経由）
- [x] Getting Started セクション（オンボーディング誘導）
- [x] 統計グリッド（提案数、投票力、参加率）
- [x] My Voting Power（自分の投票力詳細）
- [x] Active Proposals リスト
- [x] Quorum説明
- [x] Recent Activity
- [x] Council Status
- [x] フッター

**EcosystemLinkの有無**: ✅ あり（GovernanceHeader経由）

**問題点**:
```
1. [重大] /governance/landing がダッシュボードを表示 → LP本来の役割を果たしていない
2. [中] ハードコード日本語 line 523-538: 最近のアクティビティ内テキスト
   - 「QIP-47 に 賛成 投票」
   - 「0x456...789 から委任を受領」
   - 「QIP-45 が91%で可決」
3. [要判断] 他アプリと違い「紹介→オンボーディング」ではなく、
   直接ダッシュボードを見せる設計意図が不明

対応方針案:
A) 他アプリと同様の専用ランディングを作成
B) 現状を「認証済みユーザー向けダッシュボード」と位置づけ、
   別途未認証向けLPを作成
```

### 2.6 Prover Landing 分析

**URL**: `/prover/landing`
**ファイル**: `src/components/prover/ProverLanding.tsx` (~893行)

**現状のコンテンツ構成**:
- [x] ヘッダー（ロゴ、EcosystemLink、言語切替、CTA）
- [x] ヒーロー（バッジ、タイトル、説明、CTA）
- [x] Public/Enterprise切替タブ（2モード対応）
- [x] 統計セクション
- [x] 機能紹介（Features）
- [x] ROI Calculator（収益計算ツール）
- [x] 要件セクション（Requirements）
- [x] 使い方（How It Works）
- [x] FAQ
- [x] CTA
- [x] フッター

**EcosystemLinkの有無**: ✅ あり（line 221）

**問題点**:
```
- 良好: i18n対応済み
- 良好: Public/Enterprise両方に対応した豊富なコンテンツ
- 良好: ROI計算ツールで価値を可視化
```

### 2.7 Observer Landing 分析

**URL**: `/observer/landing`
**ファイル**: `src/components/observer/Landing/index.tsx` (~750行)

**現状のコンテンツ構成**:
- [x] ヘッダー（ロゴ、EcosystemLink、言語切替、CTA）
- [x] SkipLink（line 105）
- [x] ヒーロー（バッジ、タイトル、説明、CTA）
- [x] 統計セクション
- [x] 機能紹介（Features）
- [x] 収益シミュレーション（Earnings Potential）
- [x] 使い方（How It Works）
- [x] ステーキング要件
- [x] FAQ
- [x] CTA
- [x] フッター

**EcosystemLinkの有無**: ✅ あり（line 193）

**問題点**:
```
- 良好: i18n対応済み
- 良好: 構成が整っている
```

### 2.8 Explorer Landing 分析

**URL**: `/explorer/landing`
**ファイル**: `src/components/explorer/Landing/index.tsx` (~353行)

**現状のコンテンツ構成**:
- [x] ヘッダー（ロゴ、EcosystemLink、言語切替、CTA）
- [x] SkipLink（line 86-91）
- [x] ヒーロー（バッジ、タイトル、説明、CTA）
- [x] 統計セクション（TVL、ロック数、アンロック数、Prover数）
- [x] 機能紹介（Features: リアルタイム、透明性、分析、検索）
- [x] できること（What You Can Do: ロック/アンロック/分析）
- [x] CTA
- [x] フッター

**EcosystemLinkの有無**: ✅ あり（line 141）

**問題点**:
```
- [軽] SkipLinkが英語のみ ("Skip to main content")
- 良好: i18n対応済み
- 良好: コンパクトで分かりやすい構成
```

### 2.9 Enterprise Landing 分析

**URL**: `/enterprise/landing`
**ファイル**: `src/components/enterprise/EnterpriseLanding.tsx` (~249行)

**現状のコンテンツ構成**:
- [x] ヘッダー（ロゴ、EcosystemLink）
- [x] ヒーロー（バッジ、タイトル、説明、CTA、統計）
- [x] 機能紹介（Features: 4機能）
- [x] プラン比較（Plans: Starter/Business/Enterprise）
- [x] CTA
- [ ] フッターなし

**EcosystemLinkの有無**: ✅ あり（line 147）

**問題点**:
```
1. [中] ハードコード英語 line 59: "Recommended"
2. [中] ハードコード英語 line 82: "Get Started"
3. [軽] フッターがない（他LPとの不整合）
4. [軽] SkipLinkがない
```

---

## 3. 再構成方針

### 3.1 ページ階層

```
/ecosystem (ポータル)
├── Quantum Shield全体の紹介
├── 各アプリへの誘導（カテゴリ別）
├── 「誰向け？」ユースケース別ガイド
└── 全体FAQ

↓ アプリ選択

/[app]/landing (アプリ詳細)
├── そのアプリ固有の機能・価値
├── 使い方（How It Works）
├── CTA → オンボーディング
└── EcosystemLinkで全体への戻り導線

↓ 始める

/[app]/onboarding (開始フロー)
├── ウォレット接続
├── 初期設定
└── ダッシュボードへ
```

### 3.2 役割分担

| ページ | 役割 | 含める | 含めない |
|--------|------|--------|----------|
| **Ecosystem** | ポータル | 全体概要、アプリ比較、ユースケース | 個別アプリの詳細機能 |
| **App Landing** | アプリ詳細 | 固有機能、使い方、CTA | 他アプリの詳細、全体概要の重複 |

### 3.3 ナビゲーション統一

全アプリLPで統一するナビゲーション要素:

| 要素 | 配置 | 遷移先 |
|------|------|--------|
| ロゴ | ヘッダー左 | 同アプリのランディング |
| EcosystemLink | ヘッダー | `/ecosystem` |
| アプリ固有ナビ | ヘッダー中央 | ページ内アンカー |
| CTA | ヘッダー右 | オンボーディング |
| 他アプリへ | フッター | 各アプリLP |

---

## 4. 各ページの役割定義

### 4.1 Ecosystem (`/ecosystem`)

**目的**: Quantum Shield全体を理解し、適切なアプリを選ぶ

**必須セクション**:
1. ヒーロー: Quantum Shieldとは（1文で）
2. 概要: 仕組みの簡潔な説明（Lock → Protect → Unlock）
3. アプリ一覧: カテゴリ別に全アプリを紹介
4. ユースケース: 「こんな人には○○がおすすめ」
5. FAQ: 全体に関するよくある質問
6. CTA: 「始める」→ Consumer Landing へ

**削除/移動すべき**:
- 個別アプリの詳細説明（各アプリLPへ）
- 技術的詳細（/ecosystem/technical へ）

### 4.2 Consumer Landing (`/consumer/landing`)

**目的**: Consumer Appの価値を伝え、オンボーディングに誘導

**必須セクション**:
1. ヒーロー: Consumer App固有の価値提案
2. 統計: 保護資産額、Prover数など
3. 機能: Dilithium暗号、Time Lock、緊急リカバリーなど
4. 使い方: 3ステップ説明
5. 信頼性: 専門家の声、セキュリティ監査など
6. CTA: オンボーディングへ

**ヘッダー必須要素**:
- ロゴ → `/consumer/landing`
- EcosystemLink → `/ecosystem`
- 「アプリを開く」→ `/consumer/onboarding`

### 4.3 他アプリLP共通

（Consumer Landingと同様の構成を各アプリ用にカスタマイズ）

---

## 5. 修正計画

### 5.1 Phase 1: 現状分析（このドキュメント）

| # | タスク | 状態 |
|:-:|--------|:----:|
| 1 | 全LPのコンテンツ構成を確認 | ✅ |
| 2 | 重複・不整合を洗い出し | ✅ |
| 3 | 役割分担案を確定 | ⬜ |

### 5.2 Phase 2: 再構成

| # | タスク | 状態 |
|:-:|--------|:----:|
| 1 | Ecosystemページの整理 | ⬜ |
| 2 | 各アプリLPの統一 | ⬜ |
| 3 | ナビゲーションの統一 | ⬜ |
| 4 | 重複コンテンツの削除/移動 | ⬜ |

### 5.3 Phase 3: 検証

| # | タスク | 状態 |
|:-:|--------|:----:|
| 1 | 全導線の動作確認 | ⬜ |
| 2 | ユーザーフローの検証 | ⬜ |

---

## 6. 実施状況

### 6.1 分析ログ

| 日時 | 作業内容 | 結果 |
|------|----------|------|
| 2026-01-22 | ドキュメント作成 | 初版 |
| 2026-01-22 | 全LP分析完了 | 8ページ分析、問題洗い出し |

### 6.2 発見した問題

| # | ページ | 問題 | 深刻度 | 対応方針 |
|:-:|--------|------|:------:|----------|
| 1 | Governance | `/landing` がダッシュボード表示、LP本来の役割なし | **高** | 専用LP作成を検討 |
| 2 | Consumer | ハードコード日本語（line 264, 635） | 中 | i18n化 |
| 3 | Governance | ハードコード日本語（line 523-538） | 中 | i18n化 |
| 4 | Enterprise | ハードコード英語（line 59, 82） | 中 | i18n化 |
| 5 | Enterprise | フッターなし | 軽 | フッター追加 |
| 6 | 全LP | SkipLinkが英語のみ | 軽 | i18n化 |
| 7 | Consumer | 一部Link使用（I18nLinkではない） | 軽 | I18nLinkに統一 |

### 6.3 構造的問題

| # | 問題 | 該当ページ | 対応方針 |
|:-:|------|-----------|----------|
| 1 | ランディングの役割不統一 | Governance | 他LP同様の「紹介→CTA→オンボーディング」構成に |
| 2 | フッター構成の不統一 | Enterprise | 他LPに合わせて追加 |
| 3 | SkipLinkの有無が混在 | Enterprise | 全LPに追加 |

### 6.4 デザインシステム準拠監査結果

| LP | カラー | ボタン | ロゴ | A11y | 構造 | 総合 |
|:--:|:------:|:------:|:----:|:----:|:----:|:----:|
| Ecosystem | ⚠️ | ✅ | ✅ | ✅ | ⚠️ | ⚠️ |
| Consumer | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Token Hub | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ⚠️ |
| Governance | ✅ | ✅ | ❌ | ✅ | ⚠️ | ⚠️ |
| Prover | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Observer | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Explorer | ⚠️ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Enterprise | ⚠️ | ✅ | ⚠️ | ⚠️ | ⚠️ | ⚠️ |

#### 🔴 高優先度（即時対応）
| # | ページ | 問題 | 対応 |
|:-:|--------|------|------|
| 1 | Governance | ダッシュボード表示、LP未実装 | 専用LP作成 |
| 2 | Token Hub | Skip link/role="main"/Footer なし | 追加 |
| 3 | Enterprise | Skip link/role="main" なし | 追加 |

#### 🟠 中優先度
| # | ページ | 問題 | 対応 |
|:-:|--------|------|------|
| 4 | Ecosystem | 非標準カラー使用（blue-500等） | Hinomaru/Gold に統一 |
| 5 | Enterprise | A11y属性不足 | aria-label詳細化 |

#### ベストプラクティス例
- **Consumer Landing**: Skip link完備、詳細aria-label、完全なフッター
- **Prover Landing**: バージョン切り替え + A11y完全準拠
- **Observer Landing**: 複数role="region"、計算表示

### 6.5 修正履歴

| 日時 | 修正内容 | 対象ファイル |
|------|----------|-------------|
| | | |

---

## 更新履歴

| Date | Author | Changes |
|------|--------|---------|
| 2026-01-22 | Claude | 初版作成 |
| 2026-01-22 | Claude | 全LP分析完了、問題リスト更新 |
