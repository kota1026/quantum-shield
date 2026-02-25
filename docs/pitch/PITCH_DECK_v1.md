# Quantum Shield - Pitch Deck v1.0
## "The First Quantum-Safe Asset Protection Protocol"

> **用途**: VC/グラントピッチ用骨格。各スライドの要点を記載。
> **形式**: Google Slides / Figma / Keynote に転写して使用。
> **所要時間**: 10分ピッチ + 5分Q&A

---

## Slide 1: Cover

```
QUANTUM SHIELD

The First Quantum-Safe
Asset Protection Protocol

─────────────────────────
Protecting $2.5T in smart contract assets
from the quantum threat — before it's too late.
─────────────────────────

[Name] | Founder
[Date] | Seed Round
```

**Speaker Note**:
自己紹介 → 「量子コンピュータが暗号資産の署名を破る未来はもう議論の段階じゃない。NISTが標準を決め、米国政府が2028年の期限を設定した。問題は"いつ"ではなく"誰が先に対応するか"。」

---

## Slide 2: Problem — The Quantum Clock is Ticking

```
┌─────────────────────────────────────────────────┐
│                                                   │
│   ⏰ 2028                                        │
│   US Federal Quantum-Safe Deadline                │
│                                                   │
│   Today's crypto signatures (ECDSA) will be       │
│   broken by quantum computers.                    │
│                                                   │
│   ┌───────────────────────────────────────────┐  │
│   │ "Harvest Now, Decrypt Later"               │  │
│   │  Attackers are already collecting           │  │
│   │  encrypted data to decrypt later.           │  │
│   │              — US Federal Reserve           │  │
│   └───────────────────────────────────────────┘  │
│                                                   │
│   $2.5T in smart contracts                        │
│   $20B in digital asset custody                   │
│   ALL use ECDSA signatures                        │
│   ALL vulnerable to quantum attack                │
│                                                   │
└─────────────────────────────────────────────────┘
```

**Key Messages**:
- Vitalik Buterin: 量子脅威の現実的最悪ケースは **2028年**
- NIST: 2024年8月に耐量子暗号標準を正式発行（ML-DSA, SLH-DSA）
- EU DORA/MiCA 2.0: 重要インフラに量子耐性を義務化
- 「Harvest Now, Decrypt Later」攻撃はすでに進行中

**Speaker Note**:
「これは仮説じゃない。NISTが標準を決め、EUが法律を作り、Vitalikが2028年と言っている。問題は起きるかどうかじゃなく、備えるかどうか。」

---

## Slide 3: Market Opportunity — Multi-Billion Dollar PQC Wave

```
┌─────────────────────────────────────────────────┐
│                                                   │
│   TAM: $2.8 - $4.6B by 2030                      │
│   Post-Quantum Cryptography Market                │
│   ├── MarketsandMarkets: $2.84B (46.2% CAGR)     │
│   ├── Mordor Intelligence: $4.60B (39.3% CAGR)   │
│   └── Precedence Research: $29.95B by 2034        │
│                                                   │
│   SAM: $400M - $900M                              │
│   Crypto/DeFi PQ Infrastructure (15-20% of TAM)   │
│   ├── EU financial institutions (DORA mandate)    │
│   └── DeFi protocols + institutional custody      │
│                                                   │
│   SOM: $50M - $150M                               │
│   Ethereum-native PQ protection (2026-2028)       │
│   ├── Early adopter DeFi protocols                │
│   └── Institutional custody on Ethereum           │
│                                                   │
│   ── CRITICAL WINDOW ──                           │
│   Ethereum's PQ upgrade: 2028                     │
│   Our head start: 2 years                         │
│                                                   │
│   Context: PsiQuantum raised $1B in Sep 2025      │
│   → Quantum is attracting serious capital          │
│                                                   │
└─────────────────────────────────────────────────┘
```

**Key Messages**:
- PQC市場は2025年$420M-$1.68B → 2030年$2.84B-$4.6B（CAGR 37-46%）
  - Source: MarketsandMarkets, Mordor Intelligence, Precedence Research
- 規制が追い風: US Executive Order 14110（連邦$7.1Bの移行予算）、EU DORA/MiCA 2.0
- PsiQuantumが2025年9月に$1B調達（BlackRock, Nvidia参加）→ 量子に巨額資本が流入中
- Ethereumの耐量子対応完了は2028年 → **2年間の空白市場**
- QANplatformが$17.1M調達済み → PQ×Crypto市場にVC appetiteがある

---

## Slide 4: Solution — Quantum Shield Protocol

```
┌─────────────────────────────────────────────────┐
│                                                   │
│         QUANTUM SHIELD: 3-Layer Architecture      │
│                                                   │
│  ┌─────────────┐                                 │
│  │  L1 Vault   │  Ethereum L1                    │
│  │  (SPHINCS+) │  永久的に不変のスマートコントラクト  │
│  └──────┬──────┘                                 │
│         │                                         │
│  ┌──────┴──────┐                                 │
│  │  L3 Aegis   │  Off-chain BFT Consensus        │
│  │ (Dilithium) │  ガスフリー署名検証               │
│  └──────┬──────┘                                 │
│         │                                         │
│  ┌──────┴──────┐                                 │
│  │ Prover Pool │  Decentralized N-party           │
│  │  (VRF+Slash)│  経済的セキュリティ保証           │
│  └─────────────┘                                 │
│                                                   │
│  User Flow:                                       │
│  Lock(2s) → 24h TimeLock → Auto-Claim → Unlock   │
│                                                   │
│  ✅ Dual NIST Standards (FIPS 204 + 205)          │
│  ✅ Quadratic Slashing (collusion = ruin)         │
│  ✅ Auto-Claim (zero user action for unlock)      │
│  ✅ Emergency Path (7d failsafe, no asset loss)   │
│                                                   │
└─────────────────────────────────────────────────┘
```

**Key Messages**:
- **L1 Vault**: SPHINCS+（FIPS 205）でオンチェーン検証。一度デプロイしたら永久不変
- **L3 Aegis**: Dilithium（FIPS 204）でオフチェーン検証。ガス代を93%削減
- **Prover Pool**: VRF選出 + Quadratic Slashing。2者共謀でステーク40%没収、3者で90%
- **Auto-Claim**: 24時間後に自動で資産解放。ユーザー操作不要（競合は手動クレーム）
- **Emergency Path**: Prover全員ダウンでも7日後にユーザーが自力回収可能

**Speaker Note**:
「シンプルに言うと、ユーザーは資産をロックして、24時間後に自動で戻ってくる。その間に3層の量子耐性セキュリティが資産を守る。」

---

## Slide 5: Why Us — Technical Moat

```
┌──────────────────────────────────────────────────────────┐
│                                                            │
│              Quantum Shield vs. Competitors                │
│                                                            │
│              QRL    QAN    ETH PQ  Solana PQ  QS ★        │
│  ──────────────────────────────────────────────────────   │
│  Dilithium    ❌     ✅      🔜      ✅       ✅          │
│  SPHINCS+     ✅     ❌      🔜      ❌       ✅          │
│  Dual NIST    ❌     ❌      ❌      ❌       ✅ ★        │
│  Prover Pool  ❌     ❌      ❌      ❌       ✅ ★        │
│  Time Lock    ❌     ❌      ❌      ✅       ✅          │
│  Quad Slash   ❌     ❌      ❌      ❌       ✅ ★        │
│  Auto-Claim   ❌     ❌      ❌      ❌       ✅ ★        │
│  Emergency    ❌     ❌      ❌      ❌       ✅ ★        │
│  Apps/UX      1      1      ❌      ❌       9 ★         │
│  Status      Prod  2026/7  2028   Testnet   Testnet      │
│                                                            │
│  QRL: Single-algo, no economic security layer              │
│  QAN: EU govt pilots, but Dilithium-only, no Prover model │
│  ETH PQ: Massive resources, but 2028 = 2 years away       │
│  Solana: Testnet sigs only, no economic model              │
│                                                            │
│  ★ Quantum Shield: ONLY protocol combining                │
│    cryptographic + economic + temporal security             │
│                                                            │
└──────────────────────────────────────────────────────────┘
```

**Key Messages**:
- **唯一のDual NIST準拠**: Dilithium + SPHINCS+の両方を使うのはQSだけ
- **経済的セキュリティ**: Quadratic Slashingは他のどのプロジェクトにもない
- **UXの差別化**: Auto-Claim + 9アプリのエコシステム vs 競合の単一ツール
- **QRL**: 7年の実績あるが、単一アルゴリズム・経済モデルなし
- **QANplatform**: $15M調達済み、EU政府パイロットあり → 最大の競合

**Speaker Note**:
「QRLは7年やっていて尊敬しているが、署名アルゴリズムを1つ載せただけ。我々は暗号・経済・時間の3層で守る。これはセキュリティの設計思想の違い。」

---

## Slide 6: Quadratic Slashing — The Economic Moat

```
┌─────────────────────────────────────────────────┐
│                                                   │
│   Quadratic Slashing: Collusion = Financial Ruin  │
│                                                   │
│   Formula: penalty = N² × 10% of stake            │
│                                                   │
│   ┌─────────────────────────────────────────┐    │
│   │  Colluders │  Penalty   │  Remaining    │    │
│   │──────────────────────────────────────── │    │
│   │  1 (solo)  │   10%      │  90% ✅       │    │
│   │  2 (pair)  │   40%      │  60% ⚠️       │    │
│   │  3 (group) │   90%      │  10% 💀       │    │
│   │  4+        │  100%+     │   0% ☠️       │    │
│   └─────────────────────────────────────────┘    │
│                                                   │
│   With $400K stake per Prover:                    │
│   - 2-party attack costs $320K ($160K each)       │
│   - 3-party attack costs $1.08M ($360K each)      │
│   - Economic irrationality threshold: 2 colluders │
│                                                   │
│   "Making cheating more expensive than honesty"   │
│                                                   │
│   + 60% of slashed funds → Challenger reward      │
│   = Active fraud detection incentive               │
│                                                   │
└─────────────────────────────────────────────────┘
```

**Key Messages**:
- Ethereumの線形Slashing（1人不正→1人分没収）と根本的に違う
- 二次関数的ペナルティにより、**共謀の経済合理性を破壊**
- Slashされた資金の60%がChallenger（告発者）に → 不正発見のインセンティブ
- Proverステーク$400K × N²式 = 2人共謀で$320K損失 → やる意味がない

**Speaker Note**:
「これがEthereumの線形Slashingとの決定的な違い。PoSでは1人の不正は1人分の罰金。QSでは2人で共謀すると4倍、3人で9倍。共謀すればするほど損をする設計。」

---

## Slide 7: Product — 9 Apps, 175 Screens, Ready to Ship

```
┌─────────────────────────────────────────────────┐
│                                                   │
│   Full Ecosystem — Not Just a Smart Contract      │
│                                                   │
│   👤 Consumer Tier                                │
│   ├── Consumer App (Lock/Unlock/Emergency)        │
│   ├── Explorer (Public tx history, risk scores)   │
│   └── Token Hub (veQS staking, rewards)           │
│                                                   │
│   🏛️ Governance Tier                              │
│   ├── Governance Portal (Proposals, veQS voting)  │
│   └── QS Hub (Treasury, allocation tracking)      │
│                                                   │
│   🏢 Institutional Tier                           │
│   ├── Enterprise Admin (Multi-sig custody)        │
│   └── QS Admin (Foundation operations)            │
│                                                   │
│   ⚙️ Operator Tier                                │
│   ├── Prover Portal (Node ops, signing queue)     │
│   └── Observer Portal (Monitoring, challenges)    │
│                                                   │
│   ─────────────────────────────────────────────  │
│   375 Components | 202 API Functions | 144 Tests  │
│   Sepolia Testnet Live                             │
│                                                   │
└─────────────────────────────────────────────────┘
```

**Key Messages**:
- **「スマコンだけ」のプロジェクトじゃない** → 完全なエコシステム
- Consumer向けからEnterprise向けまで4つの層
- 375 Reactコンポーネント、202 Rust APIエンドポイント、全てテスト済み
- **Sepoliaテストネットですでに動作可能**

**Speaker Note**:
「多くのPQプロジェクトはスマートコントラクトかアルゴリズムだけ。QSは初日からユーザーが触れるプロダクトがある。9つのアプリ、175画面。これは論文じゃなくプロダクト。」

---

## Slide 8: Traction & Development Status

```
┌─────────────────────────────────────────────────┐
│                                                   │
│   Development: 92% Complete                       │
│   ████████████████████████░░  92%                │
│                                                   │
│   ✅ Done                                         │
│   ├── Core Protocol (SEQUENCES v3.0)              │
│   ├── L1 Vault on Sepolia (0x6F88...)             │
│   ├── 9/9 Frontend Apps                           │
│   ├── 202 Backend API Functions (Rust/Axum)       │
│   ├── PostgreSQL + Redis Storage Layer            │
│   └── 144 E2E Test Files                          │
│                                                   │
│   🔜 Remaining (est. 15 days eng work)            │
│   ├── L3 Environment Configuration                │
│   ├── Mock Data Cleanup (38 locations)            │
│   └── Final E2E Execution                         │
│                                                   │
│   Key Milestones:                                 │
│   ├── 2025 Q3: Architecture Design                │
│   ├── 2025 Q4: Core Protocol + Smart Contracts    │
│   ├── 2026 Q1: 9 Apps + Backend + Testnet ← NOW  │
│   └── 2026 Q2: Audit → Mainnet                   │
│                                                   │
└─────────────────────────────────────────────────┘
```

**Key Messages**:
- 92%完成。あと15日分のエンジニアリング作業
- L1 VaultはSepoliaでデプロイ済み → **今すぐデモ可能**
- SEQUENCES v3.0は9つの本番フローを完全定義
- フルスタック: フロントエンド(React) + バックエンド(Rust) + DB(PostgreSQL) + ブロックチェーン(Sepolia)

**Speaker Note**:
「多くのSeedステージのプロジェクトはホワイトペーパーとデモ画面だけ。QSはフルスタックのプロダクトがSepoliaで動いている。これはコードを書ける創業者だからできた。」

---

## Slide 9: Unit Economics & Business Model

```
┌─────────────────────────────────────────────────┐
│                                                   │
│   Transaction Economics                           │
│                                                   │
│   Lock:    ~$7   (135K gas)                       │
│   Unlock:  ~$27  (490K gas, Treasury-paid)        │
│   Total:   ~$34  per round-trip                   │
│                                                   │
│   vs. Competitors:                                │
│   QANplatform: ~$40-100+ (on-chain Dilithium)     │
│   QS saves 30-70% via L1/L3 separation            │
│                                                   │
│   ─────────────────────────────────────────────  │
│                                                   │
│   Revenue Streams                                 │
│   ├── Protocol Fees (0.1-0.5% of lock amount)     │
│   ├── Prover Rewards (consensus + signing)        │
│   ├── Enterprise Licensing (multi-org features)   │
│   └── Treasury Yield (protocol-owned liquidity)   │
│                                                   │
│   Token Distribution (veQS)                       │
│   ├── 50% → veQS Holders (governance)             │
│   ├── 30% → Provers (security)                    │
│   ├── 10% → Observers (fraud detection)           │
│   └── 10% → Treasury (development)                │
│                                                   │
└─────────────────────────────────────────────────┘
```

**Key Messages**:
- L1/L3分離で**ガスコスト30-70%削減** vs 全オンチェーン方式
- 複数の収益源: Protocol Fees + Enterprise + Treasury Yield
- veQSトークンは「ロック期間 × 量」で投票力が決まる → 長期コミットメントを促進
- 報酬分配: セキュリティ貢献者（Prover/Observer）に40%

---

## Slide 10: Roadmap

```
┌─────────────────────────────────────────────────┐
│                                                   │
│   2026                                            │
│   ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐       │
│   │  Q1  │→ │  Q2  │→ │  Q3  │→ │  Q4  │       │
│   │      │  │      │  │      │  │      │       │
│   │Testnet│ │Audit │  │Main- │  │Scale │       │
│   │Public│  │+Beta │  │ net  │  │      │       │
│   └──────┘  └──────┘  └──────┘  └──────┘       │
│                                                   │
│   Q1 2026 (NOW)                                   │
│   ✅ Sepolia Testnet Public                       │
│   ✅ 9 Apps Functional                            │
│   🔜 L3 Config + Mock Cleanup                     │
│                                                   │
│   Q2 2026                                         │
│   → Security Audit (Hacken / Trail of Bits)       │
│   → Pilot: 4-8 Trusted Provers                    │
│   → Enterprise Beta Program                       │
│                                                   │
│   Q3 2026                                         │
│   → Ethereum Mainnet Launch                       │
│   → veQS Governance Live                          │
│   → Multi-asset Support (ERC-20)                  │
│                                                   │
│   Q4 2026                                         │
│   → Decentralized Prover Onboarding               │
│   → DeFi Partnerships (Uniswap, Lido, Aave)      │
│   → Cross-chain (Polygon, Arbitrum, Optimism)     │
│                                                   │
│   2027                                            │
│   → Hardware Wallet Integration                   │
│   → Enterprise SaaS Launch                        │
│   → Target: $500M+ TVL, 10M+ Locks               │
│                                                   │
└─────────────────────────────────────────────────┘
```

---

## Slide 11: The Ask

```
┌─────────────────────────────────────────────────┐
│                                                   │
│   Seed Round: $3-5M                               │
│                                                   │
│   Use of Funds                                    │
│   ┌─────────────────────────────────────────┐    │
│   │  40%  Engineering                        │    │
│   │       Security Audit ($200-500K)         │    │
│   │       L1/L3 Production Optimization      │    │
│   │       Chief Cryptographer Hire            │    │
│   │                                          │    │
│   │  35%  Go-to-Market                       │    │
│   │       Enterprise Sales (2 hires)         │    │
│   │       DeFi Partnership Development       │    │
│   │       Community Building                 │    │
│   │                                          │    │
│   │  15%  Operations                         │    │
│   │       L3 Infrastructure (12 months)      │    │
│   │       Prover Pilot Program               │    │
│   │                                          │    │
│   │  10%  Legal & Compliance                 │    │
│   │       Token Legal Structure              │    │
│   │       Regulatory Compliance              │    │
│   └─────────────────────────────────────────┘    │
│                                                   │
│   18-Month Targets                                │
│   ├── $500M+ TVL                                  │
│   ├── 4+ Institutional Clients                    │
│   ├── 8+ Active Provers                           │
│   └── Mainnet Launch (Q3 2026)                    │
│                                                   │
└─────────────────────────────────────────────────┘
```

---

## Slide 12: Why Now, Why Us

```
┌─────────────────────────────────────────────────┐
│                                                   │
│   Why Now                                         │
│   ├── NIST standardized PQ algorithms (Aug 2024)  │
│   ├── US/EU mandates driving adoption (2028)      │
│   ├── Ethereum PQ upgrade: 2028 → 2yr window      │
│   └── "Harvest Now, Decrypt Later" is happening   │
│                                                   │
│   Why Us                                          │
│   ├── Only dual-NIST protocol in crypto            │
│   ├── Full product (not just whitepaper)           │
│   ├── 92% built, Sepolia live, demo-ready          │
│   └── Novel economic security (Quad Slashing)      │
│                                                   │
│   The Opportunity                                  │
│   ┌─────────────────────────────────────────┐    │
│   │                                          │    │
│   │  In 2 years, every major protocol will   │    │
│   │  need quantum-safe infrastructure.       │    │
│   │                                          │    │
│   │  We're building it today.                │    │
│   │                                          │    │
│   └─────────────────────────────────────────┘    │
│                                                   │
│   [Contact Information]                            │
│   [Demo: Sepolia Testnet URL]                     │
│                                                   │
└─────────────────────────────────────────────────┘
```

**Speaker Note**:
「2年後、すべてのメジャープロトコルが量子耐性インフラを必要とする。我々は今日それを作っている。残りの問題はマーケットへの橋を架けること。そのためにこのラウンドがある。」

---

# Appendix: Q&A想定質問と回答

## Q1: 「量子コンピュータの脅威はまだ先では？」

> NISTが2024年に標準を正式発行した時点で"if"の議論は終わりました。
> US連邦政府の期限は2028年。EUのDORAも同時期。
> 「Harvest Now, Decrypt Later」攻撃は既に進行中です。
> 問題は「いつ量子コンピュータが実用化するか」ではなく、
> 「規制対応の期限までに準備できるか」です。

## Q2: 「Ethereumが2028年にPQ対応したらQSは不要になるのでは？」

> Ethereumの対応は「署名アルゴリズムの置換」のみです。
> QSが提供するのは署名 + 経済的セキュリティ（Quadratic Slashing）
> + 時間的セキュリティ（24h TimeLock）+ Auto-Claim UX。
> Ethereum PQ後も、これらの追加保護層の需要は残ります。
> むしろEthereumのPQ対応で市場が「PQ-aware」になり、QSへの関心が高まります。

## Q3: 「QRLは7年間運用実績がある。なぜQSの方が良い？」

> QRLは素晴らしいプロジェクトで敬意を持っています。
> ただしQRLは「SPHINCS+ベースのL1チェーン」で、既存のEthereumエコシステムとは別の世界。
> QSはEthereum上のプロトコルとして、$2.5Tの既存DeFiエコシステムに
> 量子耐性を「追加」します。全く異なるアプローチです。
> また、Quadratic Slashingのような経済的セキュリティ層はQRLにはありません。

## Q4: 「$400KのProverステークは高すぎないか？」

> 意図的に高く設定しています。Phase 1では4-8の信頼できるProverで開始し、
> ガバナンスで段階的に引き下げる計画です。
> Ethereum Validatorの32 ETH（~$100K）と比較して、
> 量子耐性セキュリティの提供に対する対価として妥当と考えています。
> 高いステークがQuadratic Slashingの抑止力を強化します。

## Q5: 「チームは何人？」

> 現在は創業者1名 + AI開発ツール（Claude Code）で92%を構築。
> これは弱みではなく強み — 少人数で高速にプロダクトを作れる実行力の証明。
> Seed資金でChief Cryptographer + Enterprise Sales 2名 + BizDev 1名を採用予定。
> 技術実装はClaude Code + フリーランスRustエンジニアでスケール可能。

## Q6: 「競合のQANplatformが$17.1M調達している。どう差別化する？」

> QANは累計$17.1M調達（Seed $2.1M + Series A $15M from MBK Holding, Qatar）。
> QANは「Dilithium対応の独自L1チェーン」で、EU政府・金融機関向け。
> 2025年にはパラグアイ最大のUeno Bank（220万顧客）がQANを採用。
> QSは「Ethereum上のPQ保護プロトコル」で、DeFi + 機関投資家向け。
> 市場セグメントが異なり、棲み分けが可能です。
> むしろQANの調達とUeno Bank採用は「PQ市場が投資対象として成熟している」証拠です。

---

# Appendix: Grant Application Priority List

| Priority | Grant Program | Amount | Fit | Status |
|:--------:|--------------|:------:|:---:|:------:|
| 1 | **Ethereum Foundation (PQ Research)** | $50-200K | ★★★ | Thomas Coratger's PQ team |
| 2 | **Chainlink BUILD Program** | $50-100K | ★★★ | VRF integration angle |
| 3 | **EF Academic Grants** | $50-100K | ★★☆ | Quadratic Slashing research |
| 4 | **Gitcoin Grants** | $10-50K | ★★☆ | Community visibility |
| 5 | **Polygon Grants** | $50-100K | ★★☆ | Cross-chain expansion |
| 6 | **Optimism RPGF** | $50-200K | ★★☆ | Public goods angle |
| 7 | **IPA (日本)** | ¥500万-2000万 | ★★☆ | 耐量子暗号研究開発 |

---

# 次のステップ

1. **このドキュメントをレビュー** → 数字・表現の修正
2. **デモ動画撮影** → Sepolia Lock/Unlock の実操作を録画
3. **1枚サマリー（One-Pager）作成** → メールで送れるPDF
4. **EF Grants応募文書作成** → PQチーム向けにカスタマイズ
5. **Google Slides / Figma でビジュアル化** → デザインコンセプト適用
