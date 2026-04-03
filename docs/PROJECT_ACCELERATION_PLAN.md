# Quantum Shield — Project Acceleration Plan

> **作成日**: 2026-04-03
> **目的**: プロジェクトをBeta → Public Launch → Grant獲得まで最短で推進するためのアクションプラン

---

## 1. 現在地（Where We Are）

### 技術的完了状況: 100%

```
✅ Phase A: Deploy & Service Public
✅ Phase B: 全9シーケンス動作テスト (44/44 passed)
✅ Phase C: Security Hardening (HSTS, CSP, SECURITY.md)
✅ Phase D: Monitoring (Prometheus /metrics, 9 alert rules)
✅ Phase E: Performance (gas benchmark, k6, API latency tests)
✅ Phase F: Documentation (API Reference, Incident Response)
⬜ Phase G: Public Launch (Mainnet deploy — 要: Security Audit)
```

### 主要資産

| 資産 | 状態 | URL/場所 |
|------|------|---------|
| GitHub repo | Public | github.com/kota1026/quantum-shield |
| Frontend (Vercel) | Live | quantum-shield.vercel.app |
| Backend (Railway) | Live | API health OK |
| L1 Sepolia (3 contracts) | Verified | Etherscan |
| L3 Arb Sepolia (12 contracts) | Verified | Sourcify |
| EF Grant Application | 文書完了、未提出 | docs/pitch/ef-grant-application.md |
| Pitch Deck v1 | 骨格あり | docs/pitch/PITCH_DECK_v1.md |
| Demo Video Script | 作成済み | docs/pitch/demo-video-script.md |
| One-pager | HTML | docs/pitch/one-pager.html |

---

## 2. ブロッカー分析

### Mainnet Launch のブロッカー

```
Security Audit ($60K+)
  └── これがないとMainnetデプロイは無責任
       └── 資金が必要 → Grant or Self-fund
```

### Grant 獲得のブロッカー

```
提出していない
  └── EF Portal でフォーム入力 + 提出が必要
       └── 所要時間: 1-2時間（文書は完成済み）
```

---

## 3. 90日アクションプラン

### Week 1-2: 露出 & Grant提出 (あなたがやること)

| # | アクション | 所要時間 | 優先度 |
|---|-----------|---------|--------|
| 1 | **EF Grant 提出** (https://esp.ethereum.foundation/) | 1-2h | P0 |
| 2 | **デモ動画撮影** (60秒、Lock→History→Explorer) | 2-3h | P0 |
| 3 | **Twitter/X アカウント開設 & 告知スレッド** | 1h | P0 |
| 4 | **Zenn/dev.to 技術ブログ記事** 「Post-Quantum Security on Ethereum」 | 4-6h | P1 |
| 5 | **README.md にライブデモリンク追加** | 30min | P1 |

### Week 1-2: 技術 (Claude Codeでやれること)

| # | アクション | 優先度 |
|---|-----------|--------|
| 6 | README.md リニューアル（badges, demo GIF, architecture diagram） | P1 |
| 7 | GitHub Actions CI完全化（テスト自動実行） | P2 |
| 8 | One-pager HTML更新（最新の数値・URL反映） | P2 |

### Week 3-6: Grant並行 & コミュニティ構築

| # | アクション | 所要時間 | 優先度 |
|---|-----------|---------|--------|
| 9 | **EF以外のGrant応募** (下記リスト参照) | 各1-2h | P0 |
| 10 | **ETHGlobal ハッカソン出場** (次回チェック) | 1-2日 | P1 |
| 11 | **Ethereum Research Forum 投稿** (Quadratic Slashing論文) | 3-4h | P1 |
| 12 | **Discord/Telegram コミュニティ開設** | 1h | P2 |
| 13 | **Product Hunt / Hacker News ローンチ** | 2h | P2 |

### Week 7-12: Audit & Mainnet準備

| # | アクション | 依存 |
|---|-----------|------|
| 14 | **Security Audit 発注** | Grant承認 or 自費 |
| 15 | **Mainnet deploy script 準備** | Audit完了待ち |
| 16 | **Prover Pilot (テストネット)** | Prover参加者の募集 |
| 17 | **Mainnet Launch** | Audit + Pilot完了 |

---

## 4. Grant応募先リスト

### Tier 1 (最優先 — 金額大、フィット高)

| Grant Program | 金額 | 締切 | URL | フィット理由 |
|---------------|------|------|-----|-------------|
| **Ethereum Foundation ESP** | $50K-$200K | 常時受付 | esp.ethereum.foundation | PQ cryptography = EFの重点分野 |
| **Arbitrum STIP / LTIPP** | $50K-$500K | 要確認 | arbitrum.foundation/grants | L3がArbitrum Sepoliaにデプロイ済み |
| **Chainlink BUILD** | サポート+$$ | 常時受付 | chain.link/build | VRF v2.5使用中、直接的な統合 |

### Tier 2 (並行応募推奨)

| Grant Program | 金額 | URL | フィット理由 |
|---------------|------|-----|-------------|
| **Gitcoin Grants** | コミュニティ資金 | gitcoin.co | Public goods, OSS |
| **NIST PQC Consortium** | 研究助成 | nist.gov | FIPS 204/205の実用実装 |
| **Web3 Foundation** | $10K-$100K | web3.foundation/grants | Interop + PQ標準 |
| **Uniswap Foundation** | $50K-$250K | unigrants.org | DeFi security infrastructure |

### Tier 3 (コンテスト・ハッカソン)

| Event | 賞金 | 時期 |
|-------|------|------|
| ETHGlobal (次回) | $10K-$50K | 2026年内複数回 |
| Chainlink Hackathon | $5K-$25K | 不定期 |
| EF Devcon PQ Track | 発表+露出 | Devcon時 |

---

## 5. コンテンツ戦略

### 技術ブログ（Zenn / dev.to / Medium）

| # | タイトル案 | ターゲット | 効果 |
|---|-----------|-----------|------|
| 1 | 「NIST FIPS 204 on Ethereum: 世界初の実装ガイド」 | 開発者 | 技術的信頼性 |
| 2 | 「量子コンピュータからETHを守る — Quantum Shieldの設計思想」 | 日本語コミュニティ | 日本市場 |
| 3 | 「Quadratic Slashing: PoSの新しいセキュリティモデル」 | Ethereum Research | 学術的評価 |
| 4 | 「Claude Codeでソロ開発者が251ページのDAppを作った話」 | AI/開発者 | バズ狙い |

### Twitter/X 告知スレッド

```
🧵 We just deployed the first post-quantum asset protection protocol on Ethereum.

15 contracts on Sepolia + Arbitrum Sepolia.
251 frontend pages. 200+ API endpoints.
ML-DSA (FIPS 204) + SLH-DSA (FIPS 205).
100% test coverage on all 9 core sequences.

Here's what we built and why it matters 👇

1/N The quantum threat isn't theoretical...
```

---

## 6. 即座にやるべき3つのこと

### 今日やること

1. **EF Grant Portal にアクセスして提出**
   - URL: https://esp.ethereum.foundation/
   - 文書: `docs/pitch/ef-grant-application.md` をコピペ
   - 所要時間: 1-2時間

2. **デモ動画を撮影**
   - スクリプト: `docs/pitch/demo-video-script.md`
   - 60秒、Ecosystem → Lock → History → Explorer
   - YouTube/Loom にアップロード

3. **Twitter/X でローンチ告知**
   - スレッド形式で技術的ハイライトを紹介
   - デモ動画リンク添付
   - #PostQuantum #Ethereum #DeFi タグ

---

## 7. 資金調達なしでもできること

Security Audit ($60K) が最大のブロッカーだが、Audit なしでも進められること:

| アクション | コスト | 効果 |
|-----------|--------|------|
| Grant 応募 (3-5件) | $0 | 資金獲得の可能性 |
| テストネットPilot (知人Prover) | $0 | 実運用実績 |
| 技術ブログ発信 | $0 | 露出・コミュニティ |
| ETHGlobal ハッカソン | $0 | 賞金 + 露出 |
| Gitcoin Grants ラウンド | $0 | コミュニティ資金 |
| Code4rena/Sherlock コンテスト応募 | $0 | 低コスト監査代替 |

### 低コスト Audit 代替案

| 方法 | コスト | 信頼性 |
|------|--------|--------|
| Code4rena competitive audit | $10K-$30K | 高（多数の監査人） |
| Sherlock contest | $15K-$40K | 高 |
| Immunefi bug bounty (先行) | 報酬ベース | 中（発見時のみ支払い） |
| Halmos + Lean4 (既存) | $0 | 中（形式検証は既に完了） |

---

## 8. 成功の定義

### 30日後

- [ ] EF Grant 提出済み
- [ ] Arbitrum Grant 提出済み
- [ ] Chainlink BUILD 応募済み
- [ ] デモ動画 公開
- [ ] 技術ブログ 1本公開
- [ ] Twitter/X フォロワー 100+

### 90日後

- [ ] Grant 1件以上承認
- [ ] テストネットPilot 実施（3+ Provers）
- [ ] Security Audit 発注 or Code4rena contest開催
- [ ] 技術ブログ 3本公開
- [ ] ETH Research Forum 投稿

### 180日後

- [ ] Mainnet Launch
- [ ] TVL > 10 ETH
- [ ] Active Provers > 5
