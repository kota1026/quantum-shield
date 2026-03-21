# Quantum Shield — 案件パイプライン & アクションプラン

> **最終更新**: 2026-03-21
> **目標**: 3ヶ月以内に初回収益を実現

---

## 週次アクションプラン

### Week 1 (3/21 - 3/28): 基盤整備

- [ ] **EF Grant応募**: `ef-grant-application-v2.md` をWebフォームに転記
  - URL: https://esp.ethereum.foundation
  - 所要時間: 2時間
  - 添付: デモ動画 or スクリーンショット

- [ ] **Arbitrum Grant応募**: `arbitrum-grant-application.md` を提出
  - URL: https://arbitrum.foundation/grants
  - 所要時間: 2時間

- [ ] **GitHubリポジトリ公開準備**
  - `.env` / 秘密鍵のチェック
  - README.md を英語で整備
  - LICENSE ファイル追加（MIT or Apache 2.0）

- [ ] **30秒デモ動画撮影**
  - Lock → Processing → Success フローを録画
  - `docs/pitch/demo-video-script.md` 参照

### Week 2 (3/28 - 4/4): 営業開始

- [ ] **JCBA連絡**: LT登壇（5-10分）の打診
  - テーマ: 「NIST FIPS 204/205準拠 耐量子カストディの実装」
  - 連絡先: JCBA事務局

- [ ] **国内取引所3社へメール送付**
  - 優先: SBI VC Trade, bitFlyer, Coincheck
  - テンプレート: `outreach-emails.md` #1
  - 添付: `one-pager.html` をPDF化

- [ ] **Fireblocks Technology Partner応募**
  - URL: fireblocks.com/partners
  - 提案: PQC署名をFireblocksワークフローに統合

- [ ] **Chainlink Grant応募**
  - VRF v2.5統合済みを訴求
  - URL: chain.link/community/grants

### Week 3-4 (4/4 - 4/18): フォローアップ & 海外展開

- [ ] **グラント応募のフォローアップ**（EF, Arbitrum未回答の場合）
- [ ] **海外カストディ3社へメール送付**
  - Copper.co, Anchorage Digital, BitGo
  - テンプレート: `outreach-emails.md` #2

- [ ] **ethresear.ch投稿**: Quadratic Slashingの記事
  - PQ署名 × 二次罰則の新規性を訴求
  - EF Grantの審査員が見る可能性

- [ ] **Gitcoinラウンド参加準備**
  - プロジェクトページ作成
  - 次回ラウンドのスケジュール確認

### Month 2 (4/18 - 5/18): 案件クロージング

- [ ] **デモセッション実施**（反応のあった企業）
  - 30分: ライブデモ + Q&A
  - 準備: ローカル環境でフルフロー動作確認

- [ ] **PoC提案書作成**（興味を示した企業向け）
  - 2-4週間の検証プラン
  - 貴社環境でのデプロイ提案

- [ ] **VC打診**（グラント結果を待ちつつ）
  - 国内: East Ventures, Headline Asia, SBI Investment
  - 海外: a16z Crypto, Paradigm, Polychain
  - テンプレート: `outreach-emails.md` #5

### Month 3 (5/18 - 6/18): 収益化

- [ ] **グラント入金**（EF: $200-300K, Arbitrum: $75-150K）
- [ ] **ライセンス契約締結**（最低1社）
- [ ] **事業譲渡交渉**（オファーがあれば）

---

## パイプラインステータス

| 案件 | ステージ | 期待収益 | 確度 | 次アクション |
|------|---------|---------|------|-------------|
| EF Grant | 未応募 | $200-300K | 中 | Week 1: 応募 |
| Arbitrum Grant | 未応募 | $75-150K | 中-高 | Week 1: 応募 |
| Chainlink Grant | 未応募 | $50-100K | 低-中 | Week 2: 応募 |
| Gitcoin | 未応募 | $10-50K | 低 | Week 3: 準備 |
| SBI VC Trade | 未接触 | ¥30-50M | 低 | Week 2: メール |
| bitFlyer | 未接触 | ¥30-50M | 低 | Week 2: メール |
| Coincheck | 未接触 | ¥30-50M | 低 | Week 2: メール |
| Fireblocks | 未接触 | $100-500K | 低-中 | Week 2: Partner応募 |
| Copper.co | 未接触 | $200K-1M | 低 | Week 3: メール |

---

## 収益シナリオ

### 最低ライン（グラントのみ）
- EF Grant: $200K + Arbitrum Grant: $75K = **$275K（約4,000万円）**
- 達成確率: 40-50%
- 期間: 3-6ヶ月

### 中間ライン（グラント + ライセンス1件）
- グラント: $275K + ライセンス: ¥30M = **約7,000万円**
- 達成確率: 20-30%
- 期間: 6-9ヶ月

### ホームラン（事業譲渡）
- 事業譲渡: ¥100M-500M = **1〜5億円**
- 達成確率: 5-10%（オファー次第）
- 期間: 6-12ヶ月

### シード調達
- $3-5M（4.5〜7.5億円）= **最大リターンだが最も時間がかかる**
- 達成確率: 10-20%
- 期間: 6-12ヶ月

---

## KPI トラッキング

| 指標 | 目標（1ヶ月） | 目標（3ヶ月） |
|------|-------------|-------------|
| グラント応募数 | 4 | 6 |
| 営業メール送信数 | 10 | 30 |
| デモセッション実施数 | 0 | 3-5 |
| PoC提案数 | 0 | 1-2 |
| 契約締結数 | 0 | 1 |
| 収益 | ¥0 | ¥10M+ |

---

## 重要な準備物チェックリスト

- [ ] デモ動画（30秒 + 3分版）
- [ ] GitHub公開リポジトリ
- [ ] one-pager PDF版
- [ ] Calendlyデモ予約リンク
- [ ] 名刺（PQC × Ethereum のタイトル）
- [ ] LinkedInプロフィール更新（Quantum Shield Founder）
- [ ] Twitterアカウント開設（プロジェクト用）
- [ ] ethresear.ch アカウント作成
